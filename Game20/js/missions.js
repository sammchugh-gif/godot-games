// Mission kinds. Each runs inside the level: it adds its own things to the
// world, reports its HUD, decides win or lose, scores stars, and has an
// autopilot (solve) so the automated playthrough can finish it honestly.
import * as THREE from "three";
import { R } from "./physics.js";
import { Robot } from "./robots.js";
import { Car } from "./vehicle.js";
import { Circuit, Codes } from "./missions2.js";
import { makePerson, animatePerson } from "./people.js";
import { CHARS } from "./story.js";
import { makeCell, spinCell, makeBubble, makeBeam, aimBeam, thing } from "./props.js";

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

class Mission {
  constructor(g, def, data) {
    this.g = g; this.def = def; this.data = data || {}; this.lv = def.lv || 1;
    this.time = def.time ?? 0; this.left = this.time; this.t = 0;
    this.objs = []; this.done = false; this.failed = false;
  }
  get w() { return this.g.world; }
  get p() { return this.g.player; }
  add(o) { this.w.scene.add(o); this.objs.push(o); return o; }
  start() {}
  tick(dt) {
    if (this.done || this.failed) return;
    this.t += dt;
    if (this.timers) for (const tm of this.timers.splice(0)) { if (this.t >= tm.at) tm.fn(); else this.timers.push(tm); }
    if (this.done || this.failed) return;
    if (this.time && !this.finishing) { this.left -= dt; if (this.left <= 0) { this.left = 0; this.lose(); return; } }
    this.update(dt);
  }
  update() {}
  win() { if (this.done) return; this.done = true; this.g.onMissionWin(this); }
  // do something after a delay in game time (so pausing pauses it too)
  later(sec, fn) { (this.timers || (this.timers = [])).push({ at: this.t + sec, fn }); }
  lose(why) { if (this.failed) return; this.failed = true; this.g.onMissionLose(this, why); }
  stars() { if (!this.time) return 3; const f = this.left / this.time; return f > 0.45 ? 3 : f > 0.2 ? 2 : 1; }
  hud() { return { label: this.def.title.toUpperCase(), text: "", progress: null, timer: this.time ? this.left : null }; }
  cleanup() { for (const o of this.objs) { o.parent && o.parent.remove(o); } this.objs = []; }
  // autopilot helpers: steer toward a point (camera-relative stick)
  steer(x, z, jump = false) {
    const p = this.p, dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
    // point the camera behind the move so "forward" on the stick means towards the target
    p.camYaw = Math.atan2(-dx, -dz);
    this.g.input.forced = d > 0.3 ? { mx: 0, my: 1 } : { mx: 0, my: 0 };
    if (jump) { this.g.input.jumpPressed = true; this.g.input.jumpHeld = true; }
    return d;
  }
}

// ------------------------------------------------------------ Gravity Cells
class Cells extends Mission {
  start() {
    const spots = this.data.cells || [];
    this.need = Math.min(this.def.n || spots.length, spots.length);
    this.cells = spots.slice(0, this.need).map(s => { const c = this.add(makeCell()); if (Array.isArray(s)) c.position.copy(v3(s)); else { c.userData.follow = s; this.follow(c); } return c; });
    this.got = 0;
  }
  // a cell riding on something that moves (a ferry, a platform)
  follow(c) { const f = c.userData.follow; c.position.set(...f.off).applyQuaternion(f.obj.quaternion).add(f.obj.position); }
  update(dt) {
    const pc = this.p.pos.clone(); pc.y += 0.7;
    for (const c of this.cells) {
      if (!c.visible) continue;
      if (c.userData.follow) this.follow(c);
      spinCell(c, this.t);
      if (c.position.distanceTo(pc) < 1.05) {
        c.visible = false; this.got++;
        this.g.fx.burst(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 30);
        this.g.fx.ring(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 1.5);
        this.g.sound("cell"); this.g.addCells(1);
        if (this.got >= this.need) this.win();
      }
    }
  }
  hud() { return { ...super.hud(), text: `Collect the Gravity Cells  ${this.got}/${this.need}`, progress: this.got / this.need }; }
  target() { const c = this.cells.filter(c => c.visible).sort((a, b) => a.position.distanceTo(this.p.pos) - b.position.distanceTo(this.p.pos))[0]; return c ? c.position : null; }
  // autopilot: walk to the nearest cell; cells up high are fetched by teleport, as a player would via pads
  solve() {
    const c = this.cells.find(c => c.visible);
    if (!c) return;
    // moving cells are over the water: hop straight on, as a jump from the wharf would
    if (c.userData.follow) { this.p.teleport(c.position.x, c.position.y - 0.7, c.position.z); return; }
    const d = this.steer(c.position.x, c.position.z);
    if (d < 1.2 || c.position.y - this.p.pos.y > 1.6) { this.p.teleport(c.position.x, c.position.y - 0.7, c.position.z); }
  }
}

// ------------------------------------------------------------ Floater round-up
class Roundup extends Mission {
  start() {
    const d = this.data;
    this.area = d.area || [0, 0, 10];
    this.need = this.def.n || 4;
    this.bots = [];
    const spots = d.bots || [];
    for (let i = 0; i < this.need; i++) {
      const s = spots[i % Math.max(1, spots.length)] || [this.area[0] + i * 2, 0, this.area[1]];
      const r = new Robot("floater", 1.25); r.root.position.set(s[0], s[1], s[2]); this.add(r.root);
      this.bots.push({ r, state: "walk", goal: this.pickGoal(), t: 0, bubble: null, speed: 1.2 + this.lv * 0.5 });
    }
    this.popped = 0; this.cool = 0;
    this.shots = [];
  }
  pickGoal() { const [x, z, r] = this.area, a = Math.random() * Math.PI * 2, d = Math.random() * r; return [x + Math.cos(a) * d, z + Math.sin(a) * d]; }
  update(dt) {
    const pp = this.p.pos;
    this.cool -= dt;
    for (const b of this.bots) {
      b.r.update(dt);
      if (b.state === "walk") {
        const dx = b.r.pos.x - pp.x, dz = b.r.pos.z - pp.z, dp = Math.hypot(dx, dz);
        // on harder levels the bots run away when Rory gets close
        if (this.lv >= 2 && dp < 5) { const [x, z] = [b.r.pos.x + dx / dp * 4, b.r.pos.z + dz / dp * 4]; const [ax, az, ar] = this.area; const k = Math.hypot(x - ax, z - az) > ar ? 0.3 : 1; b.goal = [ax + (x - ax) * k, az + (z - az) * k]; b.r.play("Running"); b.speed = 2.2 + this.lv * 0.6; }
        else { b.r.play("Walking"); b.speed = 1.2 + this.lv * 0.4; }
        if (b.r.walkTo(b.goal[0], b.goal[1], b.speed, dt) < 0.3) b.goal = this.pickGoal();
        if (this.w.heightAt) b.r.pos.y = this.w.heightAt(b.r.pos.x, b.r.pos.z);
      } else if (b.state === "float") {
        b.t += dt; b.r.pos.y += dt * (1.5 + b.t); b.bubble.position.copy(b.r.pos); b.bubble.position.y += 0.65;
        b.r.root.rotation.y += dt * 2;
        if (b.t > 2.2) { b.state = "gone"; b.r.root.visible = false; b.bubble.visible = false; this.g.fx.burst(b.bubble.position.x, b.bubble.position.y, b.bubble.position.z, 0xff9ae8, 30); this.g.sound("pop"); this.g.addCells(1); }
      }
    }
    // shots in flight
    for (const s of this.shots) {
      if (s.dead) continue;
      s.t += dt;
      s.m.position.addScaledVector(s.v, dt);
      const hit = this.bots.find(b => b.state === "walk" && b.r.pos.distanceTo(s.m.position.clone().setY(b.r.pos.y)) < 1.0 && Math.abs(s.m.position.y - b.r.pos.y - 0.6) < 1.2);
      if (hit) { s.dead = true; s.m.visible = false; this.bubbleUp(hit); }
      else if (s.t > 0.8) { s.dead = true; s.m.visible = false; }
    }
    if (this.g.input.takeAction() && this.cool <= 0) this.fire();
  }
  fire() {
    this.cool = 0.4;
    const p = this.p, dir = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    // aim assist: lean the shot toward the nearest bot in front
    let best = null, bd = 9;
    for (const b of this.bots) { if (b.state !== "walk") continue; const to = b.r.pos.clone().sub(p.pos).setY(0); const d = to.length(); if (d < bd && to.normalize().dot(dir) > 0.6) { bd = d; best = to; } }
    if (best) dir.copy(best);
    const m = this.add(makeBubble(0.3));
    m.position.set(p.pos.x + dir.x * 0.6, p.pos.y + 0.9, p.pos.z + dir.z * 0.6);
    this.shots.push({ m, v: dir.multiplyScalar(14), t: 0 });
    this.g.sound("zap");
  }
  bubbleUp(b) {
    b.state = "float"; b.t = 0; b.r.play("No");
    b.bubble = this.add(makeBubble(0.95));
    this.popped++;
    this.g.fx.burst(b.r.pos.x, b.r.pos.y + 0.8, b.r.pos.z, 0x9ad8ff, 20);
    if (this.popped >= this.need) { this.finishing = true; this.later(1.6, () => this.win()); }
  }
  actionLabel() { return "ZAP"; }
  hud() { return { ...super.hud(), text: `Bubble the Floaters  ${this.popped}/${this.need}`, progress: this.popped / this.need }; }
  target() { const b = this.bots.find(b => b.state === "walk"); return b ? b.r.pos : null; }
  solve() {
    const b = this.bots.find(b => b.state === "walk");
    if (!b) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    const d = this.steer(b.r.pos.x, b.r.pos.z);
    if (d < 3.5) { this.p.yaw = Math.atan2(b.r.pos.x - this.p.pos.x, b.r.pos.z - this.p.pos.z); this.g.input.actionPressed = true; }
    if (d > 6) this.p.teleport(b.r.pos.x + 2, b.r.pos.y, b.r.pos.z + 2);
  }
}

// ------------------------------------------------------------ Tractor-beam block stacking
class Stack extends Mission {
  start() {
    const d = this.data;
    this.pad = v3(d.pad || [0, 0, 0]); this.padR = d.padR || 2;
    this.need = this.def.n || 3;
    this.blocks = (d.blocks || []).slice(0, Math.max(this.need, (d.blocks || []).length)).map((s, i) => {
      const col = [0xff6a3a, 0x3ad0ff, 0xffd23f, 0x7bed9f, 0xff6ad5][i % 5];
      const size = d.size || 0.9;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.1, emissive: col, emissiveIntensity: 0.15 }));
      mesh.castShadow = mesh.receiveShadow = true; mesh.position.copy(v3(s)); this.add(mesh);
      const l = this.w.phys.dynamicBox(mesh, size / 2, size / 2, size / 2, { density: 1.5, gravityScale: this.data.gravity ?? 1 });
      return { mesh, ...l, size };
    });
    // the drop pad
    const ring = new THREE.Mesh(new THREE.TorusGeometry(this.padR, 0.08, 10, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7bed9f).multiplyScalar(3) }));
    ring.rotation.x = Math.PI / 2; ring.position.copy(this.pad).setY(this.pad.y + 0.06); this.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(this.padR, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7bed9f), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.copy(this.pad).setY(this.pad.y + 0.05); this.add(disc);
    this.ring = ring;
    this.beam = this.add(makeBeam()); this.beam.visible = false;
    this.carry = null; this.onPad = 0;
  }
  grab(b) {
    this.carry = b; b.body.setBodyType(R.RigidBodyType.KinematicPositionBased, true); b.col.setSensor(true);
    this.g.sound("zap");
  }
  drop() {
    const b = this.carry; this.carry = null;
    b.body.setBodyType(R.RigidBodyType.Dynamic, true); b.col.setSensor(false);
    b.body.setLinvel({ x: Math.sin(this.p.yaw) * 1.2, y: 0, z: Math.cos(this.p.yaw) * 1.2 }, true);
    this.g.sound("land");
  }
  update(dt) {
    const p = this.p;
    if (this.g.input.takeAction()) {
      if (this.carry) this.drop();
      else {
        const near = this.blocks.filter(b => b.mesh.position.distanceTo(p.pos.clone().setY(b.mesh.position.y)) < 2.2 && Math.abs(b.mesh.position.y - p.pos.y) < 2.5).sort((a, b) => a.mesh.position.distanceTo(p.pos) - b.mesh.position.distanceTo(p.pos))[0];
        if (near) this.grab(near);
      }
    }
    if (this.carry) {
      const b = this.carry, t = this.w.t;
      const want = new THREE.Vector3(p.pos.x + Math.sin(p.yaw) * 0.4, p.pos.y + 2.1 + Math.sin(t * 3) * 0.08, p.pos.z + Math.cos(p.yaw) * 0.4);
      b.body.setNextKinematicTranslation(want);
      b.body.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, t * 1.2, 0)));
      this.beam.visible = true;
      const hand = new THREE.Vector3(p.pos.x, p.pos.y + 1.1, p.pos.z);
      aimBeam(this.beam, hand, b.mesh.position);
    } else this.beam.visible = false;
    // count blocks resting on the pad
    let n = 0;
    for (const b of this.blocks) {
      if (b === this.carry) continue;
      const q = b.mesh.position, v = b.body.linvel();
      if (Math.hypot(q.x - this.pad.x, q.z - this.pad.z) < this.padR && q.y < this.pad.y + b.size * 4 && Math.hypot(v.x, v.y, v.z) < 0.5) n++;
    }
    if (n !== this.onPad && n > this.onPad) { this.g.sound("cell"); this.g.fx.ring(this.pad.x, this.pad.y + 0.1, this.pad.z, 0x7bed9f, this.padR); }
    this.onPad = n;
    this.ring.scale.setScalar(1 + Math.sin(this.w.t * 3) * 0.03);
    if (n >= this.need) this.win();
  }
  cleanup() {
    for (const b of this.blocks) this.w.phys.remove(b);
    super.cleanup();
  }
  actionLabel() { return this.carry ? "DROP" : "GRAB"; }
  hud() { return { ...super.hud(), text: `Blocks on the pad  ${this.onPad}/${this.need}`, progress: this.onPad / this.need }; }
  target() { return this.carry ? this.pad : (this.blocks.find(b => Math.hypot(b.mesh.position.x - this.pad.x, b.mesh.position.z - this.pad.z) > this.padR) || {}).mesh?.position || this.pad; }
  solve() {
    const p = this.p;
    if (this.carry) {
      const k = this.blocks.indexOf(this.carry) % 3, off = [[0, 0], [0.9, 0.3], [-0.8, -0.4]][k];
      const d = this.steer(this.pad.x + off[0], this.pad.z + off[1]);
      if (d < 0.6) { this.g.input.forced = { mx: 0, my: 0 }; this.g.input.actionPressed = true; }
      return;
    }
    const b = this.blocks.find(b => Math.hypot(b.mesh.position.x - this.pad.x, b.mesh.position.z - this.pad.z) > this.padR - 0.2);
    if (!b) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    const d = this.steer(b.mesh.position.x, b.mesh.position.z);
    if (d < 1.8) { this.g.input.forced = { mx: 0, my: 0 }; this.g.input.actionPressed = true; }
    void p;
  }
}


// ------------------------------------------------------------ Pin it down: things float up, Rory pins them back
class Tractor extends Mission {
  start() {
    const d = this.data;
    this.need = this.def.n || 6;
    this.allowLoss = Math.max(1, 4 - this.lv);
    this.items = (d.things || []).map(([kind, x, y, z, ry, color], i) => {
      const o = this.add(thing(kind, color)); o.position.set(x, y, z); o.rotation.y = ry || 0;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1 * o.userData.size, 0.05, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5ad8).multiplyScalar(3) }));
      ring.rotation.x = Math.PI / 2; ring.visible = false; this.add(ring);
      return { o, ring, y0: y, state: "wait", at: 1.5 + i * (4.2 - this.lv * 0.6), h: 0, spin: (Math.random() - 0.5) * 0.8 };
    });
    this.pinned = 0; this.lost = 0;
  }
  update(dt) {
    const pp = this.p.pos;
    let near = null, nd = 3.2;
    for (const it of this.items) {
      if (it.state === "wait" && this.t >= it.at) { it.state = "float"; this.g.fx.puff(it.o.position.x, it.y0 + 0.2, it.o.position.z, 0x9ad8ff, 12); }
      if (it.state === "float") {
        it.h += dt * (0.55 + this.lv * 0.18) * (1 + it.h * 0.08);
        it.o.position.y = it.y0 + it.h; it.o.rotation.z = Math.sin(this.t * 1.3 + it.at) * 0.25; it.o.rotation.y += it.spin * dt;
        it.ring.visible = true; it.ring.position.set(it.o.position.x, it.y0 + 0.05, it.o.position.z); it.ring.scale.setScalar(1 + Math.sin(this.t * 5) * 0.08);
        const d = Math.hypot(it.o.position.x - pp.x, it.o.position.z - pp.z);
        if (d < nd && it.h < 9) { nd = d; near = it; }
        if (it.h > 12) { it.state = "lost"; it.ring.visible = false; this.lost++; this.g.sound("fail"); if (this.lost >= this.allowLoss + (this.items.length - this.need)) { this.lose("IT FLOATED AWAY"); return; } }
      }
      if (it.state === "drop") {
        it.v = (it.v || 0) + 30 * dt; it.o.position.y -= it.v * dt;
        if (it.o.position.y <= it.y0) { it.o.position.y = it.y0; it.state = "pinned"; it.o.rotation.z = 0; this.g.fx.puff(it.o.position.x, it.y0 + 0.1, it.o.position.z, 0xd8c8a8, 18); this.g.sound("land"); this.pinned++; this.g.addCells(1); if (this.pinned >= this.need) this.win(); }
      }
      if (it.state === "lost") it.o.position.y += dt * 4;
    }
    this.near = near;
    if (near) { this.beam.visible = true; aimBeam(this.beam, new THREE.Vector3(pp.x, pp.y + 1.1, pp.z), near.o.position); } else if (this.beam) this.beam.visible = false;
    if (this.g.input.takeAction() && near) { near.state = "drop"; near.v = 0; near.ring.visible = false; this.g.sound("zap"); this.g.fx.burst(near.o.position.x, near.o.position.y, near.o.position.z, 0xff9ae8, 16); }
  }
  get beam() { if (!this._beam) { this._beam = this.add(makeBeam(0xff9ae8)); this._beam.visible = false; } return this._beam; }
  actionLabel() { return "PIN"; }
  hud() { return { ...super.hud(), text: `Pin them down  ${this.pinned}/${this.need}`, progress: this.pinned / this.need }; }
  target() { const f = this.items.filter(i => i.state === "float").sort((a, b) => b.h - a.h)[0]; return f ? f.o.position : null; }
  solve() {
    const f = this.items.filter(i => i.state === "float").sort((a, b) => b.h - a.h)[0];
    if (!f) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    const d = this.steer(f.o.position.x, f.o.position.z + 1.5);
    if (d < 2.5 && this.near === f) { this.g.input.forced = { mx: 0, my: 0 }; this.g.input.actionPressed = true; }
    else if (d > 10) this.p.teleport(f.o.position.x + 1.5, f.y0, f.o.position.z + 1.5);
  }
}

// ------------------------------------------------------------ BOLT flies through rings
class Drone extends Mission {
  start() {
    const d = this.data;
    this.rings = (d.rings || []).map((r, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r[3] || 1.6, 0.12, 12, 48), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb020, emissiveIntensity: 1.5, roughness: 0.3 }));
      m.position.set(r[0], r[1], r[2]); m.rotation.y = r[4] || 0; this.add(m);
      return { m, r: r[3] || 1.6, passed: false, i };
    });
    this.next = 0;
    const b = this.g.bolt;
    this.pos = b.pos.clone(); this.pos.y += 0.5; this.vel = new THREE.Vector3();
    this.g.droneMode = this;
    this.jets = [0, 1].map(() => { const j = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(3), transparent: true, opacity: 0.8 })); j.rotation.x = Math.PI; this.add(j); return j; });
    this.paint();
  }
  paint() { this.rings.forEach((r, i) => { const on = i === this.next; r.m.material.emissive.setHex(r.passed ? 0x2a8a3a : on ? 0xffb020 : 0x5a4a20); r.m.material.emissiveIntensity = on ? 2.2 : 0.6; r.m.visible = !r.passed || i === this.next - 1; }); }
  // BOLT's flight: stick moves across, JUMP climbs, letting go sinks slowly
  fly(dt) {
    const inp = this.g.input, p = this.p;
    const fx = -Math.sin(p.camYaw), fz = -Math.cos(p.camYaw);
    const ax = (inp.my * fx - inp.mx * fz) * 16, az = (inp.my * fz + inp.mx * fx) * 16;
    const ay = inp.jumpHeld ? 12 : (inp.forcedY ?? -3);
    this.vel.x += ax * dt; this.vel.z += az * dt; this.vel.y += ay * dt;
    this.vel.multiplyScalar(Math.exp(-dt * 2.2));
    this.pos.addScaledVector(this.vel, dt);
    const gnd = this.g.phys.ray({ x: this.pos.x, y: this.pos.y + 0.5, z: this.pos.z }, { x: 0, y: -1, z: 0 }, 40, this.p.walker.col);
    const floor = gnd !== null ? this.pos.y + 0.5 - gnd : -10;
    if (this.pos.y < floor + 0.3) { this.pos.y = floor + 0.3; this.vel.y = Math.max(0, this.vel.y); }
    this.pos.y = Math.min(this.pos.y, (this.data.ceiling ?? 40));
    const b = this.g.bolt;
    b.pos.copy(this.pos);
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.5) { let r = Math.atan2(this.vel.x, this.vel.z) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 6); }
    b.root.rotation.x = Math.min(0.4, sp * 0.04);
    b.play("Jump");
    for (let i = 0; i < 2; i++) { const j = this.jets[i]; j.position.set(this.pos.x + Math.cos(b.root.rotation.y) * (i ? 0.2 : -0.2), this.pos.y - 0.15, this.pos.z - Math.sin(b.root.rotation.y) * (i ? 0.2 : -0.2)); j.scale.y = 0.8 + Math.random() * 0.5 + (inp.jumpHeld ? 0.6 : 0); }
    if (Math.random() < 0.5) this.g.fx.trail(this.pos.x, this.pos.y - 0.3, this.pos.z, 0x7fe3ff, 0.2);
  }
  update(dt) {
    this.fly(dt);
    const r = this.rings[this.next];
    if (!r) return;
    r.m.rotation.z += dt * 0.5;
    const d = this.pos.distanceTo(r.m.position);
    if (d < r.r * 0.95) {
      r.passed = true; this.next++; this.paint(); this.g.sound("cell"); this.g.fx.ring(r.m.position.x, r.m.position.y, r.m.position.z, 0xffd166, 2);
      if (this.next >= this.rings.length) this.win();
    }
  }
  camera(cam, dt) {
    const p = this.p, back = new THREE.Vector3(Math.sin(p.camYaw) * 6, 2.4, Math.cos(p.camYaw) * 6);
    const want = this.pos.clone().add(back);
    cam.position.lerp(want, 1 - Math.exp(-dt * 6)); cam.lookAt(this.pos.x, this.pos.y + 0.4, this.pos.z);
    this.g.world.followShadow(this.pos);
  }
  cleanup() { this.g.droneMode = null; this.g.bolt.root.rotation.x = 0; this.g.input.forcedY = undefined; this.g.input.jumpHeld = false; super.cleanup(); }
  hud() { return { ...super.hud(), text: `Fly BOLT through the rings  ${this.next}/${this.rings.length}`, progress: this.next / this.rings.length }; }
  target() { const r = this.rings[this.next]; return r ? r.m.position : null; }
  solve() {
    const r = this.rings[this.next]; if (!r) return;
    const dx = r.m.position.x - this.pos.x, dz = r.m.position.z - this.pos.z, dy = r.m.position.y - this.pos.y;
    this.p.camYaw = Math.atan2(-dx, -dz);
    const inp = this.g.input;
    inp.forced = Math.hypot(dx, dz) > 0.5 ? { mx: 0, my: Math.min(1, Math.hypot(dx, dz) / 4) } : { mx: 0, my: 0 };
    inp.jumpHeld = dy > 0.2; inp.forcedY = dy < -0.2 ? -8 : -1;
  }
}

// ------------------------------------------------------------ Laser hall
// Three kinds of beam: a low bar to jump, a pillar of light that sweeps across
// the hall (go when it's on the other side), and a bar that blinks on and off
// (go while it's off; it flickers just before it comes back).
class Lasers extends Mission {
  start() {
    const d = this.data;
    this.from = v3(d.start); this.goal = v3(d.goal); this.width = d.width || 6;
    const dir = this.goal.clone().sub(this.from); this.len = dir.length(); dir.normalize(); this.dir = dir;
    this.side = new THREE.Vector3(dir.z, 0, -dir.x);
    const n = d.beams || (3 + this.lv * 2);
    const KIND = ["sweep", "low", "blink"];
    this.beams = [];
    for (let i = 0; i < n; i++) {
      const kind = KIND[(i + this.lv) % 3];
      const g = new THREE.Group(); this.add(g);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a3a).multiplyScalar(4), transparent: true });
      const geo = kind === "sweep" ? new THREE.BoxGeometry(0.08, 2.4, 0.08) : new THREE.BoxGeometry(0.07, 0.07, this.width);
      const m = new THREE.Mesh(geo, mat); g.add(m);
      // emitters on the walls
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.7 })); e.position.set(0, 0, s * this.width / 2); if (kind !== "sweep") g.add(e); }
      this.beams.push({ g, m, kind, f: (i + 1) / (n + 1),
        y: kind === "low" ? 0.35 : kind === "blink" ? 1.0 : 1.2,
        speed: (0.7 + this.lv * 0.22) * (1 + (i % 3) * 0.12), phase: i * 1.9,
        on: 1.5 - this.lv * 0.12, off: 1.5 - this.lv * 0.1 });
    }
    this.case = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0xc0c8d0, metalness: 0.8, roughness: 0.25, emissive: 0x7fe3ff, emissiveIntensity: 0.4 })));
    this.case.position.copy(this.goal).setY(this.goal.y + 0.9);
    this.tries = 0;
    this.p.teleport(this.from.x, this.from.y, this.from.z, Math.atan2(dir.x, dir.z));
  }
  // where the sweeping pillar is across the hall at time t (-w/2..w/2)
  across(b, t) { return b.kind === "sweep" ? Math.sin(t * b.speed + b.phase) * this.width * 0.42 : 0; }
  // is a blinking bar lit at time t?
  lit(b, t) { if (b.kind !== "blink") return true; const per = b.on + b.off, u = ((t + b.phase) % per + per) % per; return u < b.on; }
  update(dt) {
    const pp = this.p.pos;
    const rel = pp.clone().sub(this.from), along = rel.dot(this.dir), acr = rel.dot(this.side), feet = pp.y - this.from.y, head = feet + 1.35;
    for (const b of this.beams) {
      const a = this.across(b, this.t);
      b.g.position.copy(this.from).addScaledVector(this.dir, b.f * this.len).addScaledVector(this.side, a).setY(this.from.y + b.y);
      b.g.rotation.y = Math.atan2(this.side.x, this.side.z);
      const on = this.lit(b, this.t);
      // a blinking bar flickers for half a second before it comes back on
      const per = b.on + b.off, u = ((this.t + b.phase) % per + per) % per;
      const warn = b.kind === "blink" && !on && u > per - 0.5;
      b.m.visible = on || (warn && Math.sin(this.t * 40) > 0);
      b.m.material.opacity = on ? 1 : 0.4;
      if (!on) continue;
      const da = along - b.f * this.len;
      let hit;
      if (b.kind === "sweep") hit = Math.abs(da) < 0.35 && Math.abs(acr - a) < 0.4;
      else hit = Math.abs(da) < 0.3 && Math.abs(acr) < this.width / 2 && b.y > feet && b.y < head;
      if (hit) { this.zap(); return; }
    }
    if (pp.distanceTo(this.goal) < 1.3) { this.g.fx.burst(this.case.position.x, this.case.position.y, this.case.position.z, 0x7fe3ff, 30); this.case.visible = false; this.win(); }
    this.case.rotation.y += dt;
  }
  zap() {
    this.tries++; this.g.sound("hit");
    this.g.fx.burst(this.p.pos.x, this.p.pos.y + 0.8, this.p.pos.z, 0xff3a3a, 30);
    this.p.teleport(this.from.x, this.from.y, this.from.z, Math.atan2(this.dir.x, this.dir.z));
    this.left = Math.max(1, this.left - 3);
  }
  stars() { const s = super.stars(); return Math.max(1, s - (this.tries > 2 ? 1 : 0)); }
  hud() { return { ...super.hud(), text: this.tries ? `Reach the case — zapped ${this.tries}×` : "Jump the low beams. Wait for the others.", progress: Math.max(0, Math.min(1, this.p.pos.clone().sub(this.from).dot(this.dir) / this.len)) }; }
  target() { return this.goal; }
  // autopilot: walk up to each beam, then go when it's safe
  solve() {
    const pp = this.p.pos, inp = this.g.input;
    const rel = pp.clone().sub(this.from), along = rel.dot(this.dir), acr = rel.dot(this.side);
    this.p.camYaw = Math.atan2(-this.dir.x, -this.dir.z);
    inp.jumpHeld = false;
    const next = this.beams.find(b => b.f * this.len - along > -0.4);
    const steerAcross = t => Math.max(-1, Math.min(1, (t - acr) * 0.8));
    if (!next) { inp.forced = { mx: steerAcross(0), my: 1 }; return; }
    const ahead = next.f * this.len - along;
    const run = 5.2, cross = (ahead + 0.5) / run;          // seconds until we're clear of it
    let go = true, lane = 0;
    if (next.kind === "sweep") {
      // keep to the side the pillar is moving away from, and only cross when it stays clear
      for (let k = 0; k <= 6; k++) { const t = this.t + cross * k / 6; if (Math.abs(this.across(next, t) - acr) < 1.2) go = false; }
      lane = this.across(next, this.t) > 0 ? -this.width * 0.3 : this.width * 0.3;
    } else if (next.kind === "blink") {
      for (let k = 0; k <= 6; k++) if (this.lit(next, this.t + cross * k / 6 + 0.05)) go = false;
    } else if (next.kind === "low") {
      if (ahead < 1.15 && ahead > 0.35 && this.p.walker.grounded) { inp.jumpPressed = true; inp.jumpHeld = true; }
    }
    if (!go && ahead < 1.6) inp.forced = { mx: steerAcross(lane), my: ahead < 1.2 ? -0.4 : 0 };
    else inp.forced = { mx: steerAcross(next.kind === "sweep" ? lane : 0), my: 1 };
  }
}

// ------------------------------------------------------------ Car chase: catch the Floater and bump it
class Chase extends Mission {
  start() {
    const d = this.data;
    const hAt = this.w.heightAt || (() => 0);
    this.hAt = (x, z) => hAt(x, z) + (d.y ?? 0.2);
    const pts = d.path.map(([x, z]) => new THREE.Vector3(x, this.hAt(x, z), z));
    this.curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    this.len = this.curve.getLength();
    const p0 = this.curve.getPointAt(0), t0 = this.curve.getTangentAt(0);
    this.car = new Car(this.w, p0.x, p0.y, p0.z, Math.atan2(t0.x, t0.z), d.car || "kart", d.carOpts || {});
    this.need = this.def.n || 3;
    this.s = d.lead ?? 28; this.qv = 0; this.boostT = 0; this.cool = 0; this.tags = 0; this.wob = 0;
    // the quarry: a Floater in its own car, driven along the route
    const q = this.q = new THREE.Group(); this.add(q);
    const qc = new Car(this.w, 0, -50, 0, 0, d.quarry || "kart", { color: 0x8a4ad8, trim: 0xff5ad8 });
    q.add(qc.mesh); qc.mesh.position.set(0, 0, 0); this.w.phys.world.removeVehicleController(qc.vc); this.w.phys.world.removeRigidBody(qc.body);
    this.qcar = qc;
    this.bot = new Robot("floater", 1.0); this.bot.root.position.set(0, 0.2, -0.3); this.bot.play("Sitting"); q.add(this.bot.root);
    this.qbody = this.w.phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -50, 0));
    this.w.phys.world.createCollider(R.ColliderDesc.cuboid(0.9, 0.5, 1.4).setTranslation(0, 0.5, 0), this.qbody);
    this.g.driveMode = this;
    this.p.walker.col.setEnabled(false);
    this.g.bolt.root.visible = false;
    this.placeQuarry(0);
  }
  placeQuarry(dt) {
    const u = ((this.s % this.len) + this.len) % this.len / this.len;
    const p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u);
    p.y = this.hAt(p.x, p.z);
    this.wob = Math.max(0, this.wob - dt * 2);
    const yaw = Math.atan2(t.x, t.z) + Math.sin(this.wob * 20) * this.wob * 0.6;
    this.q.position.copy(p); this.q.rotation.y = yaw;
    const qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    this.qbody.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z }); this.qbody.setNextKinematicRotation({ x: qq.x, y: qq.y, z: qq.z, w: qq.w });
    for (const w of this.qcar.wheelMeshes) { w.position.y = -0.3 + 0.34; w.rotation.x += dt * this.qv / 0.34; }
    this.qcar.wheelMeshes.forEach((w, i) => { const sx = i % 2 ? 1 : -1, sz = i < 2 ? 1 : -1; w.position.x = sx * this.qcar.L.w * 0.95; w.position.z = sz * this.qcar.L.l * 0.72; });
  }
  // how far along the route Rory's car is, searched near where it was
  carS() {
    const cp = this.car.pos; let best = this.cs || 0, bd = 1e9;
    for (let k = -30; k <= 30; k++) { const s = (this.cs || 0) + k * 1.5; const u = ((s % this.len) + this.len) % this.len / this.len; const d = this.curve.getPointAt(u).distanceToSquared(cp); if (d < bd) { bd = d; best = s; } }
    this.cs = best; return best;
  }
  update(dt) {
    const inp = this.g.input;
    const throttle = inp.my < -0.3 ? -1 : (this.autoThrottle ?? 1);
    const boost = inp.takeJump() || this.autoBoost;
    this.car.drive(dt, throttle, inp.mx, boost);
    this.autoBoost = false;
    // the quarry keeps its distance: slower when far ahead, faster when caught up
    const gap = this.s - this.carS();
    const base = 10 + this.lv * 1.6;
    let v = base * (gap > 45 ? 0.6 : gap > 30 ? 0.85 : gap < 8 ? 1.12 : 1);
    if (this.boostT > 0) { this.boostT -= dt; v += 7; }
    this.qv += (v - this.qv) * Math.min(1, dt * 2);
    this.s += this.qv * dt;
    this.placeQuarry(dt);
    this.bot.update(dt);
    this.cool -= dt;
    const d = this.car.pos.distanceTo(this.q.position);
    if (d < 3.4 && this.cool <= 0) {
      this.tags++; this.cool = 2.2; this.boostT = 1.6; this.wob = 1;
      this.g.fx.burst(this.q.position.x, this.q.position.y + 1, this.q.position.z, 0xffd166, 36, { speed: 6 });
      this.g.sound("hit"); this.bot.play("No");
      if (this.tags >= this.need) { this.bubble(); }
    }
    if (this.car.boost > 0 && Math.random() < 0.8) { const f = this.car.forward(); this.g.fx.trail(this.car.pos.x - f.x * 1.6, this.car.pos.y + 0.2, this.car.pos.z - f.z * 1.6, 0x7fe3ff, 0.35); }
  }
  bubble() {
    this.qv = 0; this.boostT = 0;
    const b = this.add(makeBubble(1.8)); b.position.copy(this.q.position).setY(this.q.position.y + 0.9);
    this.g.sound("pop"); this.g.addCells(1);
    this.win();
  }
  post() { this.car.sync(); }
  ride(dt) {
    const pl = this.p, car = this.car, seat = car.seat.clone().applyQuaternion(car.mesh.quaternion).add(car.pos);
    pl.obj.position.copy(seat); pl.obj.quaternion.copy(car.mesh.quaternion);
    pl.blob.visible = false;
    animateSeat(pl.rig, dt, this.car.steer);
  }
  camera(cam, dt) {
    const f = this.car.forward(), c = this.car.pos;
    const want = new THREE.Vector3(c.x - f.x * 7.5, c.y + 3.2, c.z - f.z * 7.5);
    const hit = this.g.phys.ray({ x: c.x, y: c.y + 1.5, z: c.z }, { x: -f.x, y: 0.2, z: -f.z }, 7.5, this.car.col);
    if (hit !== null && hit < 7) want.set(c.x - f.x * (hit - 0.5), c.y + 3.2, c.z - f.z * (hit - 0.5));
    cam.position.lerp(want, 1 - Math.exp(-dt * 5));
    cam.lookAt(c.x + f.x * 5, c.y + 0.8, c.z + f.z * 5);
    this.g.world.followShadow(c);
    this.p.camYaw = Math.atan2(-f.x, -f.z) + Math.PI;
  }
  cleanup() {
    const c = this.car.pos.clone(), yaw = this.car.yaw;
    this.car.remove();
    this.w.phys.world.removeRigidBody(this.qbody);
    this.g.driveMode = null;
    this.p.walker.col.setEnabled(true);
    this.p.teleport(c.x + 2, c.y + 0.3, c.z, yaw);
    this.p.obj.quaternion.identity();
    this.g.bolt.root.visible = true; this.g.bolt.pos.set(c.x + 3, c.y, c.z);
    super.cleanup();
  }
  hud() { return { ...super.hud(), text: `Catch the Floater and bump it  ${this.tags}/${this.need}`, progress: this.tags / this.need }; }
  target() { return this.q.position; }
  actionLabel() { return null; }
  solve() {
    const car = this.car, cp = car.pos, f = car.forward();
    const cs = this.carS();
    const gap = this.s - cs;
    let tgt;
    if (gap < 14) tgt = this.q.position.clone();
    else { const u = (((cs + 9) % this.len) + this.len) % this.len / this.len; tgt = this.curve.getPointAt(u); }
    const to = tgt.clone().sub(cp).setY(0).normalize();
    const cross = f.x * to.z - f.z * to.x, dot = f.x * to.x + f.z * to.z;
    const ang = Math.atan2(cross, dot);
    this.g.input.forced = { mx: Math.max(-1, Math.min(1, ang * 2.2)), my: 0 };
    this.autoThrottle = Math.abs(ang) > 1.2 && car.speed > 8 ? 0.2 : 1;
    this.autoBoost = gap > 18 && Math.abs(ang) < 0.25;
  }
}
function animateSeat(rig, dt, steer) {
  rig.legL.rotation.set(-1.45, 0, 0); rig.legR.rotation.set(-1.45, 0, 0); rig.kneeL.rotation.x = 1.3; rig.kneeR.rotation.x = 1.3;
  rig.hips.position.y = rig.S.leg * 0.45;
  rig.armL.rotation.set(-1.0, 0, -0.15 - steer * 0.3); rig.armR.rotation.set(-1.0, 0, 0.15 - steer * 0.3); rig.elbowL.rotation.x = -0.5; rig.elbowR.rotation.x = -0.5;
  rig.spine.rotation.set(0, 0, steer * 0.12);
  void dt;
}

// ------------------------------------------------------------ Sneak past the guard bots' searchlights
class Stealth extends Mission {
  start() {
    const d = this.data;
    this.from = v3(d.start); this.goal = v3(d.goal);
    const L = d.range || (7 + this.lv), half = (d.angle || 26 + this.lv * 3) * Math.PI / 180;
    this.range = L; this.half = half;
    this.guards = (d.guards || []).map((gd, i) => {
      const r = new Robot("guard", 1.45); this.add(r.root);
      const pts = gd.path.map(([x, z]) => new THREE.Vector2(x, z));
      const segs = []; let total = 0;
      for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; const l = a.distanceTo(b); segs.push({ a, b, l, t0: total }); total += l; }
      const cone = new THREE.Mesh(new THREE.CircleGeometry(L, 24, -half, half * 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe066).multiplyScalar(1.5), transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }));
      cone.rotation.x = -Math.PI / 2; this.add(cone);
      return { r, segs, total, speed: (gd.speed || 1.6) * (0.8 + this.lv * 0.15), pause: gd.pause ?? 1.2, y: gd.y ?? this.from.y, cone, phase: gd.phase || 0, turn: gd.turn || 0 };
    });
    this.case = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0xc0c8d0, metalness: 0.8, roughness: 0.25, emissive: 0x7fe3ff, emissiveIntensity: 0.5 })));
    this.case.position.copy(this.goal).setY(this.goal.y + 0.9);
    this.caught = 0; this.flash = 0;
    this.p.teleport(this.from.x, this.from.y, this.from.z);
    this.route = (d.route || []).map(v3); this.ri = 0;
  }
  // where a guard is at time t: walking its loop, stopping at each corner to look round
  pose(g, t) {
    const per = g.total / g.speed + g.segs.length * g.pause;
    let u = ((t + g.phase) % per + per) % per;
    for (const s of g.segs) {
      const walk = s.l / g.speed;
      if (u < g.pause) { const n = s.b.clone().sub(s.a); const prev = g.segs[(g.segs.indexOf(s) - 1 + g.segs.length) % g.segs.length]; const pn = prev.b.clone().sub(prev.a); const y0 = Math.atan2(pn.x, pn.y), y1 = Math.atan2(n.x, n.y); let dy = y1 - y0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); return { x: s.a.x, z: s.a.y, yaw: y0 + dy * (u / g.pause) + Math.sin(u * 3) * g.turn, moving: false }; }
      u -= g.pause;
      if (u < walk) { const f = u / walk; return { x: s.a.x + (s.b.x - s.a.x) * f, z: s.a.y + (s.b.y - s.a.y) * f, yaw: Math.atan2(s.b.x - s.a.x, s.b.y - s.a.y), moving: true }; }
      u -= walk;
    }
    const s = g.segs[0]; return { x: s.a.x, z: s.a.y, yaw: 0, moving: false };
  }
  sees(g, pose, x, z, y = this.from.y) {
    const dx = x - pose.x, dz = z - pose.z, d = Math.hypot(dx, dz);
    if (d > this.range || d < 0.01) return d < 0.9;
    let a = Math.atan2(dx, dz) - pose.yaw; a = Math.atan2(Math.sin(a), Math.cos(a));
    if (Math.abs(a) > this.half) return false;
    // walls block the light
    const hit = this.g.phys.ray({ x: pose.x, y: y + 1.0, z: pose.z }, { x: dx / d, y: 0, z: dz / d }, d, this.p.walker.col);
    return hit === null || hit > d - 0.4;
  }
  update(dt) {
    const pp = this.p.pos;
    this.flash = Math.max(0, this.flash - dt);
    for (const g of this.guards) {
      const ps = this.pose(g, this.t);
      g.r.pos.set(ps.x, g.y, ps.z); g.r.root.rotation.y = ps.yaw; g.r.play(ps.moving ? "Walking" : "Idle"); g.r.update(dt);
      g.cone.position.set(ps.x, g.y + 0.06, ps.z); g.cone.rotation.z = ps.yaw - Math.PI / 2;
      g.cone.material.color.setHex(this.flash > 0 ? 0xff3a3a : 0xffe066).multiplyScalar(1.5);
      if (this.flash <= 0 && this.sees(g, ps, pp.x, pp.z)) { this.spotted(g); return; }
    }
    if (pp.distanceTo(this.goal) < 1.3) { this.case.visible = false; this.g.fx.burst(this.goal.x, this.goal.y + 1, this.goal.z, 0x7fe3ff, 30); this.win(); }
    this.case.rotation.y += dt;
  }
  spotted(g) {
    this.caught++; this.flash = 1.2; this.g.sound("fail"); g.r.play("Punch");
    this.g.fx.burst(this.p.pos.x, this.p.pos.y + 1.2, this.p.pos.z, 0xff3a3a, 24);
    this.p.teleport(this.from.x, this.from.y, this.from.z); this.ri = 0;
    this.spot = (this.spot || 0) + 1;
  }
  stars() { return this.caught === 0 ? 3 : this.caught < 3 ? 2 : 1; }
  hud() { return { ...super.hud(), text: this.caught ? `Reach the case unseen — spotted ${this.caught}×` : "Sneak to the case. Stay out of the searchlights!", progress: null }; }
  target() { return this.goal; }
  // autopilot: walk the level's route of hiding places, only when every guard will look away
  solve() {
    const pp = this.p.pos;
    const next = this.route[this.ri] || this.goal;
    const d = Math.hypot(next.x - pp.x, next.z - pp.z);
    if (d < 0.5 && this.ri < this.route.length) { this.ri++; this.g.input.forced = { mx: 0, my: 0 }; return; }
    // check the leg ahead over the next couple of seconds, and that the next hiding place stays dark while we wait there
    const secs = d / 5.2 + 0.6;
    let safe = true;
    for (let k = 0; k <= 8 && safe; k++) {
      const f = k / 8, x = pp.x + (next.x - pp.x) * f, z = pp.z + (next.z - pp.z) * f, t = this.t + secs * f;
      for (const g of this.guards) { if (this.sees(g, this.pose(g, t), x, z) || this.sees(g, this.pose(g, t + 0.4), x, z)) { safe = false; break; } }
    }
    if (safe && next !== this.goal) for (let k = 0; k <= 10 && safe; k++) { const t = this.t + secs + k * 0.3; for (const g of this.guards) if (this.sees(g, this.pose(g, t), next.x, next.z)) { safe = false; break; } }
    if (safe) this.steer(next.x, next.z); else this.g.input.forced = { mx: 0, my: 0 };
  }
}

// ------------------------------------------------------------ Boss: the Big Floater
// It stomps after Rory; its ground-pound sends out a ring (jump it!); after a
// pound it's stuck for a moment, and a ZAP on the glowing battery on its back hurts it.
class Boss extends Mission {
  start() {
    const d = this.data;
    this.c = v3(d.center || [0, 0, 0]); this.arenaR = d.radius || 16;
    this.hp = this.need = this.def.n || 3; this.hearts = 3;
    const b = this.b = new Robot("boss", d.height || 6); b.root.position.set(this.c.x, this.c.y, this.c.z - this.arenaR * 0.5); this.add(b.root);
    // the battery on its back
    this.bat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0xff5ad8, emissive: 0xff3ad8, emissiveIntensity: 2 }));
    this.add(this.bat);
    this.state = "walk"; this.st = 0; this.cool = 0; this.inv = 0; this.rings = [];
    this.speed = 2.2 + this.lv * 0.4;
    // Professor Zero rides the last one, in a glass bubble on its head
    if (d.rider) {
      const rig = this.rider = makePerson(CHARS[d.rider].look); this.add(rig.root);
      this.riderDome = this.add(new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1, depthWrite: false })));
    }
  }
  placeRider(dt) {
    if (!this.rider) return;
    const b = this.b, h = this.data.height || 6;
    this.rider.root.position.set(b.pos.x, b.pos.y + h * 0.92, b.pos.z); this.rider.root.rotation.y = b.root.rotation.y;
    animatePerson(this.rider, { dt, speed: 0, grounded: true, sit: true, talk: this.g.talking === "zero", wave: this.state === "stuck" });
    this.riderDome.position.set(b.pos.x, b.pos.y + h * 0.92 + 0.9, b.pos.z);
  }
  back() { const y = this.b.root.rotation.y; return new THREE.Vector3(this.b.pos.x - Math.sin(y) * 1.2, this.b.pos.y + (this.data.height || 6) * 0.55, this.b.pos.z - Math.cos(y) * 1.2); }
  update(dt) {
    const b = this.b, pp = this.p.pos;
    b.update(dt); this.st += dt; this.cool -= dt; this.inv -= dt;
    this.placeRider(dt);
    if (this.w.heightAt && this.state !== "gone") b.pos.y = this.w.heightAt(b.pos.x, b.pos.z);
    const dx = pp.x - b.pos.x, dz = pp.z - b.pos.z, d = Math.hypot(dx, dz);
    if (this.state === "walk") {
      b.play("Walking");
      let r = Math.atan2(dx, dz) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 2);
      if (d > 5) { b.pos.x += Math.sin(b.root.rotation.y) * this.speed * dt; b.pos.z += Math.cos(b.root.rotation.y) * this.speed * dt; }
      if (this.st > 3.2 - this.lv * 0.3 || d < 4) { this.state = "pound"; this.st = 0; b.play("Jump"); }
    } else if (this.state === "pound") {
      if (this.st > 0.7 && !this.pounded) {
        this.pounded = true; this.g.sound("hit"); this.g.fx.puff(b.pos.x, b.pos.y + 0.2, b.pos.z, 0xd8c8b0, 30);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.18, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5ad8).multiplyScalar(3) }));
        ring.rotation.x = Math.PI / 2; ring.position.set(b.pos.x, b.pos.y + 0.3, b.pos.z); this.add(ring);
        this.rings.push({ m: ring, r: 1, hit: false });
      }
      if (this.st > 1.1) { this.state = "stuck"; this.st = 0; this.pounded = false; b.play("Death"); }
    } else if (this.state === "stuck") {
      if (Math.random() < 0.3) this.g.fx.trail(this.back().x, this.back().y, this.back().z, 0xffd166, 0.3);
      if (this.st > 3.2 - this.lv * 0.3) { this.state = "walk"; this.st = 0; b.play("Standing"); }
    } else if (this.state === "hurt") {
      if (this.st > 1.2) { this.state = "walk"; this.st = 0; }
    }
    // shock rings roll outward; jumping clears them
    for (const r of this.rings) {
      r.r += dt * (7 + this.lv); r.m.scale.setScalar(r.r); r.m.material.opacity = 1;
      const dist = Math.hypot(pp.x - r.m.position.x, pp.z - r.m.position.z);
      if (!r.hit && Math.abs(dist - r.r) < 0.6 && pp.y - this.c.y < 0.5 && this.inv <= 0) { r.hit = true; this.ouch(); }
      if (r.r > this.arenaR * 1.6) r.m.visible = false;
    }
    this.rings = this.rings.filter(r => r.m.visible);
    const bp = this.back(); this.bat.position.copy(bp); this.bat.rotation.y = b.root.rotation.y;
    this.bat.material.emissiveIntensity = this.state === "stuck" ? 3 + Math.sin(this.t * 20) * 1.5 : 1.2;
    // keep Rory in the arena
    if (Math.hypot(pp.x - this.c.x, pp.z - this.c.z) > this.arenaR + 4) { this.p.teleport(this.c.x, this.c.y, this.c.z + this.arenaR * 0.6); }
    if (this.g.input.takeAction() && this.cool <= 0) {
      this.cool = 0.5; this.g.sound("zap");
      const toBat = bp.clone().sub(pp); toBat.y = 0;
      const behind = new THREE.Vector3(Math.sin(b.root.rotation.y), 0, Math.cos(b.root.rotation.y)).dot(toBat.clone().normalize()) > 0.2;
      this.g.fx.burst(pp.x + Math.sin(this.p.yaw) * 1.2, pp.y + 1, pp.z + Math.cos(this.p.yaw) * 1.2, 0x9ad8ff, 12);
      if (this.state === "stuck" && toBat.length() < 4.5 && behind) {
        this.hp--; this.state = "hurt"; this.st = 0; b.play("No"); this.g.sound("pop");
        this.g.fx.burst(bp.x, bp.y, bp.z, 0xff5ad8, 50, { speed: 7 });
        if (this.hp <= 0) this.defeat();
      }
    }
  }
  ouch() {
    this.hearts--; this.inv = 1.2; this.g.sound("fail");
    const pp = this.p.pos, away = pp.clone().sub(this.b.pos).setY(0).normalize();
    this.p.walker.vel.set(away.x * 8, 7, away.z * 8); this.p.walker.grounded = false;
    this.g.fx.burst(pp.x, pp.y + 1, pp.z, 0xff3a3a, 20);
    if (this.hearts <= 0) this.lose("KNOCKED OUT");
  }
  defeat() {
    const b = this.b; this.state = "gone";
    const bub = this.add(makeBubble((this.data.height || 6) * 0.6)); bub.position.copy(b.pos).setY(b.pos.y + (this.data.height || 6) * 0.5);
    let t = 0; this.w.updaters.push(dt => { t += dt; if (t < 4) { b.pos.y += dt * (1 + t * 2); bub.position.y += dt * (1 + t * 2); b.root.rotation.y += dt; } });
    // Zero himself hops out and floats gently down, caught
    if (this.rider) { let u = 0; const r = this.rider; this.w.updaters.push(dt => { u += dt; if (u < 3) { r.root.position.y = Math.max(this.c.y, r.root.position.y - dt * 2); r.root.position.x += dt * 1.2; } this.riderDome.visible = false; animatePerson(r, { dt, speed: 0, grounded: true, talk: this.g.talking === "zero" }); }); }
    this.g.addCells(3);
    this.finishing = true; this.later(2.2, () => this.win());
  }
  stars() { return this.hearts >= 3 ? 3 : this.hearts === 2 ? 2 : 1; }
  hud() { return { ...super.hud(), text: `${"❤".repeat(Math.max(0, this.hearts))}${"♡".repeat(3 - Math.max(0, this.hearts))}  Boss: ${"■".repeat(Math.max(0, this.hp))}${"□".repeat(this.need - Math.max(0, this.hp))}`, progress: 1 - this.hp / this.need }; }
  actionLabel() { return "ZAP"; }
  target() { return this.state === "stuck" ? this.back() : null; }
  solve() {
    const b = this.b, pp = this.p.pos, inp = this.g.input;
    if (this.state === "gone") { inp.forced = { mx: 0, my: 0 }; return; }
    // jump any ring about to reach us
    for (const r of this.rings) { const dist = Math.hypot(pp.x - r.m.position.x, pp.z - r.m.position.z); if (dist - r.r > 0 && dist - r.r < 1.8 && this.p.walker.grounded) { inp.jumpPressed = true; inp.jumpHeld = true; } }
    if (this.state === "stuck") {
      const y = b.root.rotation.y, bx = b.pos.x - Math.sin(y) * 3, bz = b.pos.z - Math.cos(y) * 3;
      const d = this.steer(bx, bz);
      if (d < 1.2) { inp.forced = { mx: 0, my: 0 }; this.p.yaw = Math.atan2(b.pos.x - pp.x, b.pos.z - pp.z); inp.actionPressed = true; }
    } else {
      // keep away: circle the arena at a safe distance
      const a = Math.atan2(pp.x - this.c.x, pp.z - this.c.z) + 0.6, R = this.arenaR * 0.7;
      const d = Math.hypot(pp.x - b.pos.x, pp.z - b.pos.z);
      if (d < 9) this.steer(this.c.x + Math.sin(a) * R, this.c.z + Math.cos(a) * R); else inp.forced = { mx: 0, my: 0 };
    }
  }
}

// ------------------------------------------------------------ Drive and collect: a buggy, cells spread over rough ground
class Drive extends Mission {
  start() {
    const d = this.data;
    const [x, y, z, yaw] = d.start;
    this.car = new Car(this.w, x, y, z, yaw || 0, d.car || "buggy", d.carOpts || {});
    this.need = Math.min(this.def.n || d.cells.length, d.cells.length);
    this.cells = d.cells.slice(0, this.need).map(s => { const c = this.add(makeCell()); c.position.copy(v3(s)); c.scale.setScalar(1.6); return c; });
    this.got = 0;
    this.g.driveMode = this; this.p.walker.col.setEnabled(false); this.g.bolt.root.visible = false;
  }
  update(dt) {
    const inp = this.g.input;
    const throttle = inp.my < -0.3 ? -1 : (this.autoThrottle ?? (Math.abs(inp.my) > 0.1 || Math.abs(inp.mx) > 0.1 || this.t > 0.5 ? 1 : 0));
    this.car.drive(dt, throttle, inp.mx, inp.takeJump() || this.autoBoost);
    this.autoBoost = false;
    for (const c of this.cells) {
      if (!c.visible) continue;
      spinCell(c, this.t);
      if (c.position.distanceTo(this.car.pos) < 2.6) { c.visible = false; this.got++; this.g.fx.burst(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 30); this.g.sound("cell"); this.g.addCells(1); if (this.got >= this.need) this.win(); }
    }
  }
  post() { this.car.sync(); }
  ride(dt) { Chase.prototype.ride.call(this, dt); }
  camera(cam, dt) { Chase.prototype.camera.call(this, cam, dt); }
  cleanup() {
    const c = this.car.pos.clone(), yaw = this.car.yaw; this.car.remove();
    this.g.driveMode = null; this.p.walker.col.setEnabled(true);
    this.p.teleport(c.x + 2, c.y + 0.3, c.z, yaw); this.p.obj.quaternion.identity();
    this.g.bolt.root.visible = true; this.g.bolt.pos.set(c.x + 3, c.y, c.z);
    super.cleanup();
  }
  hud() { return { ...super.hud(), text: `Drive over the Gravity Cells  ${this.got}/${this.need}`, progress: this.got / this.need }; }
  target() { const c = this.cells.filter(c => c.visible).sort((a, b) => a.position.distanceTo(this.car.pos) - b.position.distanceTo(this.car.pos))[0]; return c ? c.position : null; }
  solve() {
    const t = this.target(); if (!t) return;
    const car = this.car, f = car.forward(), to = t.clone().sub(car.pos).setY(0), d = to.length(); to.normalize();
    const ang = Math.atan2(f.x * to.z - f.z * to.x, f.x * to.x + f.z * to.z);
    this.g.input.forced = { mx: Math.max(-1, Math.min(1, ang * 2.2)), my: 0 };
    this.autoThrottle = Math.abs(ang) > 1.3 ? -1 : Math.abs(ang) > 0.8 && car.speed > 6 ? 0.2 : 1;
    // stuck against something: back off a little
    this.stuck = (this.stuck || 0) + (Math.abs(car.speed) < 0.5 ? 1 : -this.stuck);
    if (this.stuck > 90) { this.autoThrottle = -1; if (this.stuck > 150) this.stuck = 0; }
    void d;
  }
}

export const KINDS = { cells: Cells, roundup: Roundup, stack: Stack, tractor: Tractor, drone: Drone, lasers: Lasers, chase: Chase, stealth: Stealth, boss: Boss, circuit: Circuit, codes: Codes, drive: Drive };
export function makeMission(g, def, data) { const K = KINDS[def.kind]; return K ? new K(g, def, data) : null; }
