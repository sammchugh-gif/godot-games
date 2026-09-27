// The sea missions: diving for crystals (with air, and in the dark by sonar),
// TORPEDO through rings and salvaging cases with the claw, and chases on the
// water. Each has an autopilot, like every other kind.
import * as THREE from "three";
import { Mission, KINDS, v3, animateSeat } from "./missions.js";
import { Robot } from "./robots.js";
import { makeCell, spinCell, makeAirBubble, makeTorpedo, animateTorpedo, thing, makeBubble } from "./props.js";
import { makeBoat, animateBoat, BOATS } from "./boats.js";
import { toast } from "./ui.js";

const SWIM_UP = 3.6;

// ------------------------------------------------------------ Dive: crystals under the water
export class Dive extends Mission {
  start() {
    const d = this.data;
    const spots = d.cells || [];
    this.need = Math.min(this.def.n || spots.length, spots.length);
    this.cells = spots.slice(0, this.need).map(s => { const c = this.add(makeCell()); c.position.copy(v3(s)); c.userData.seen = 0; return c; });
    this.bubbles = (d.bubbles || []).map(s => { const b = this.add(makeAirBubble()); b.position.copy(v3(s)); b.userData.away = 0; return b; });
    this.got = 0;
    this.sonar = !!this.def.sonar; this.pingCool = 0; this.pings = 0;
    // in the dark only what the sonar has just lit up can be seen
    if (this.sonar) { for (const c of this.cells) c.visible = false; this.dark = this.w.sea ? this.w.sea.see : 40; if (this.w.sea) this.w.sea.see = 9; }
    const p = this.p; p.airMax = this.def.air || 45; p.air = 1; p.noAir = false; p.dive(true);
    this.pulse = this.add(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fffe8).multiplyScalar(2), transparent: true, opacity: 0, wireframe: true, depthWrite: false })));
    this.pulseT = 9;
  }
  update(dt) {
    const p = this.p, pc = p.pos.clone(); pc.y += 1.0;
    this.pingCool -= dt;
    if (this.sonar && this.g.input.takeAction() && this.pingCool <= 0) this.ping();
    // the sonar pulse spreads out and fades
    this.pulseT += dt;
    if (this.pulseT < 1.4) { const r = 1 + this.pulseT * 16; this.pulse.scale.setScalar(r); this.pulse.material.opacity = 0.35 * (1 - this.pulseT / 1.4); this.pulse.position.copy(pc); } else this.pulse.material.opacity = 0;
    for (const c of this.cells) {
      if (c.userData.got) continue;
      if (this.sonar) { c.userData.seen -= dt; c.visible = c.userData.seen > 0; if (c.visible) c.children[0].material.opacity = Math.min(0.82, c.userData.seen * 0.4); }
      spinCell(c, this.t);
      if (c.position.distanceTo(pc) < 1.25) {
        c.userData.got = true; c.visible = false; this.got++;
        this.g.fx.burst(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 30, { gravity: 2, up: 0.5 });
        this.g.fx.ring(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 1.5);
        this.g.sound("cell"); this.g.addCells(1);
        if (this.got >= this.need) { this.finishing = true; this.later(0.4, () => this.win()); }
      }
    }
    for (const b of this.bubbles) {
      if (b.userData.away > 0) { b.userData.away -= dt; b.visible = b.userData.away <= 0; if (b.visible) this.g.fx.burst(b.position.x, b.position.y, b.position.z, 0xffffff, 10, { gravity: 3, up: 1, bright: 1.5 }); continue; }
      b.position.y += Math.sin(this.t * 1.5 + b.userData.phase) * 0.004; b.scale.setScalar(1 + Math.sin(this.t * 3 + b.userData.phase) * 0.05);
      if (b.position.distanceTo(pc) < 1.2) { b.userData.away = 12; b.visible = false; p.air = 1; p.noAir = false; this.g.sound("breath"); this.g.fx.burst(b.position.x, b.position.y, b.position.z, 0xffffff, 24, { gravity: 4, up: 2, bright: 1.5 }); toast("Air!", 1.2); }
    }
  }
  ping() {
    this.pingCool = 1.6; this.pings++; this.pulseT = 0; this.g.sound("ping");
    const pc = this.p.pos.clone(); pc.y += 1;
    for (const c of this.cells) if (!c.userData.got && c.position.distanceTo(pc) < 24) c.userData.seen = Math.max(c.userData.seen, 4.5);
  }
  onNoAir() { this.lose("OUT OF AIR"); }
  cleanup() { this.p.dive(false); this.p.noAir = false; if (this.sonar && this.w.sea) this.w.sea.see = this.dark; super.cleanup(); }
  actionLabel() { return this.sonar ? "PING" : null; }
  hud() { return { ...super.hud(), text: `${this.sonar ? "PING, then swim for the crystals" : "Dive for the Tide Crystals"}  ${this.got}/${this.need}`, progress: this.got / this.need }; }
  target() { const c = this.cells.filter(c => !c.userData.got && (!this.sonar || c.userData.seen > 0)).sort((a, b) => a.position.distanceTo(this.p.pos) - b.position.distanceTo(this.p.pos))[0]; return c ? c.position : null; }
  debugState() { const f = x => Math.round(x * 10) / 10, pp = this.p.pos; return { p: [f(pp.x), f(pp.y), f(pp.z)], swim: this.p.swimming, air: f(this.p.air), got: this.got, aim: this.aim ? this.cells.indexOf(this.aim) : null, mode: this.mode }; }
  // autopilot: walk into the water at the entry point, then swim straight at the nearest
  // crystal, rising over anything in the way; surface (or find a bubble) when the air runs low
  solve() {
    const p = this.p, w = p.walker, inp = this.g.input, pp = p.pos;
    const c = this.aim && !this.aim.userData.got ? this.aim : this.cells.filter(c => !c.userData.got).sort((a, b) => a.position.distanceTo(pp) - b.position.distanceTo(pp))[0];
    if (!c) { inp.forced = { mx: 0, my: 0 }; inp.forcedDive = false; inp.jumpHeld = false; return; }
    if (c !== this.aim) { this.aim = c; this.aimT = this.t; }
    if (this.t - this.aimT > 40) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} crystal ${this.cells.indexOf(c)} at ${c.position.toArray().map(v => v.toFixed(1)).join(",")}`); p.teleport(c.position.x, c.position.y - 1, c.position.z); this.aimT = this.t; return; }
    if (this.sonar && this.pingCool <= 0 && p.swimming) inp.actionPressed = true;
    if (!p.swimming) {
      // on land: to the water's edge (the level says where it is easy to get in)
      const e = this.data.entry || [c.position.x, 0, c.position.z];
      inp.forcedDive = false; this.mode = "walk";
      this.walkTo(e[0], e[1], e[2], 0.6, [c.position, v3(e)]);
      if (Math.hypot(e[0] - pp.x, e[2] - pp.z) < 1.5) this.steer(c.position.x, c.position.z);
      return;
    }
    const surf = p.surface(), head = pp.y + 1.45;
    const cp = c.position, dh = Math.hypot(cp.x - pp.x, cp.z - pp.z), dy = cp.y - (pp.y + 1.0);
    // air: low and no bubble close by, go up for a breath; keep breathing till the bar is full
    const bub = this.bubbles.filter(b => b.visible).sort((a, b) => a.position.distanceTo(pp) - b.position.distanceTo(pp))[0];
    const bubD = bub ? bub.position.distanceTo(pp) : 99;
    if (this.breathing) { if (p.air > 0.95) this.breathing = false; }
    else if (p.air < 0.3 && !(bub && bubD < 14)) this.breathing = true;
    let tx = cp.x, tz = cp.z, ty = cp.y;
    if (this.breathing) { tx = pp.x; tz = pp.z; ty = surf + 5; this.mode = "breathe"; }
    else if (p.air < 0.45 && bub && bubD < 14) { tx = bub.position.x; tz = bub.position.z; ty = bub.position.y; this.mode = "bubble"; }
    else this.mode = "crystal";
    const d2 = Math.hypot(tx - pp.x, tz - pp.z), up = ty - (pp.y + 1.0);
    // something solid in the way: rise over it, and slide sideways round it
    let block = false;
    if (d2 > 0.5) {
      const ux = (tx - pp.x) / d2, uz = (tz - pp.z) / d2;
      const hit = this.w.phys.ray({ x: pp.x, y: pp.y + 0.8, z: pp.z }, { x: ux, y: 0, z: uz }, 1.6, w.col);
      const hit2 = this.w.phys.ray({ x: pp.x, y: pp.y + 1.6, z: pp.z }, { x: ux, y: 0, z: uz }, 1.6, w.col);
      block = hit !== null || hit2 !== null;
    }
    if (d2 > 0.35) { p.camYaw = Math.atan2(-(tx - pp.x), -(tz - pp.z)); inp.forced = { mx: block ? 0.6 : 0, my: block ? 0.5 : 1 }; }
    else inp.forced = { mx: 0, my: 0 };
    inp.jumpHeld = block || up > 0.35;
    inp.forcedDive = !block && up < -0.35;
    if (this.breathing) { inp.jumpHeld = true; inp.forcedDive = false; }
    void head; void dh; void dy; void SWIM_UP;
  }
}

// ------------------------------------------------------------ TORPEDO: rings under the water, or cases lifted with the claw
export class Sub extends Mission {
  start() {
    const d = this.data;
    const [x, y, z, yaw] = d.start;
    this.sub = this.add(makeTorpedo()); this.pos = new THREE.Vector3(x, y, z); this.vel = new THREE.Vector3(); this.yaw = yaw || 0; this.pitch = 0;
    this.sub.position.copy(this.pos); this.sub.rotation.y = this.yaw;
    this.salvage = this.def.kind === "salvage";
    this.rings = (d.rings || []).map(r => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r[3] || 2, 0.14, 12, 48), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb020, emissiveIntensity: 1.5, roughness: 0.3 }));
      m.position.set(r[0], r[1], r[2]); m.rotation.y = r[4] || 0; this.add(m);
      return { m, r: r[3] || 2, passed: false };
    });
    this.next = 0;
    if (this.salvage) {
      this.need = Math.min(this.def.n || (d.crates || []).length, (d.crates || []).length);
      this.crates = (d.crates || []).slice(0, this.need).map(([cx, cy, cz], i) => { const o = this.add(thing("case", [0xc0c8d0, 0xffd23f, 0x7bed9f][i % 3])); o.position.set(cx, cy, cz); o.rotation.y = i; const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7bed9f).multiplyScalar(2.5) })); ring.rotation.x = Math.PI / 2; ring.position.set(cx, cy + 0.05, cz); this.add(ring); return { o, ring, done: false }; });
      this.drop = v3(d.drop); this.dropR = d.dropR || 3;
      const dr = new THREE.Mesh(new THREE.TorusGeometry(this.dropR, 0.1, 10, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7bed9f).multiplyScalar(3) })); dr.rotation.x = Math.PI / 2; dr.position.copy(this.drop); this.add(dr); this.dropRing = dr;
      this.carry = null; this.dropped = 0;
    }
    this.g.driveMode = this; this.dive = true;
    // Rory's own body waits, dry, at the exit until the ride is over
    const e = d.exit || d.start; this.p.teleport(e[0], e[1], e[2], e[3] || 0); this.p.swimming = false; this.p.walker.setSwim(false);
    this.p.walker.col.setEnabled(false); this.p.frozen = true;
    this.g.bolt.root.visible = false;
    if (this.w.torpedo) this.w.torpedo.visible = false;
    this.paint();
    this.camYaw = this.yaw + Math.PI;
  }
  paint() { this.rings.forEach((r, i) => { r.m.material.emissive.setHex(r.passed ? 0x2a8a3a : i === this.next ? 0xffb020 : 0x5a4a20); r.m.material.emissiveIntensity = i === this.next ? 2.2 : 0.6; r.m.visible = !r.passed || i === this.next - 1; }); }
  update(dt) {
    const inp = this.g.input, sea = this.w.sea;
    // steering: the stick pushes the sub along, relative to the camera; JUMP rises, DIVE sinks
    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
    const ax = (inp.my * fx - inp.mx * fz) * 13, az = (inp.my * fz + inp.mx * fx) * 13;
    let ay = 0; if (inp.jumpHeld) ay = 9; if (inp.diveHeld) ay = -9;
    const wheel = inp.wheelY || 0; if (wheel) { ay = wheel > 0 ? -9 : 9; inp.wheelY = 0; }
    this.vel.x += ax * dt; this.vel.z += az * dt; this.vel.y += ay * dt;
    this.vel.multiplyScalar(Math.exp(-dt * 1.7));
    // walls: stop against anything solid ahead
    const sp = this.vel.length();
    if (sp > 0.5) {
      const dir = this.vel.clone().normalize();
      const hit = this.w.phys.ray({ x: this.pos.x, y: this.pos.y + 0.8, z: this.pos.z }, { x: dir.x, y: dir.y, z: dir.z }, 2.2, this.p.walker.col);
      if (hit !== null) { this.vel.multiplyScalar(-0.25); this.bump = 0.4; if (sp > 5) this.g.sound("hit"); }
    }
    this.pos.addScaledVector(this.vel, dt);
    // never above the surface (the tower may show), never into the seabed
    if (sea) { const top = sea.height(this.pos.x, this.pos.z) - 1.0; if (this.pos.y > top) { this.pos.y = top; this.vel.y = Math.min(0, this.vel.y); } }
    const gnd = this.w.phys.ray({ x: this.pos.x, y: this.pos.y + 0.8, z: this.pos.z }, { x: 0, y: -1, z: 0 }, 40, this.p.walker.col);
    const floor = gnd !== null ? this.pos.y + 0.8 - gnd : -60;
    if (this.pos.y < floor + 0.4) { this.pos.y = floor + 0.4; this.vel.y = Math.max(0, this.vel.y); }
    const ceil = this.w.phys.ray({ x: this.pos.x, y: this.pos.y + 0.8, z: this.pos.z }, { x: 0, y: 1, z: 0 }, 2.0, this.p.walker.col);
    if (ceil !== null) { this.pos.y = Math.min(this.pos.y, this.pos.y + 0.8 + ceil - 2.0); this.vel.y = Math.min(0, this.vel.y); }
    // pose the sub
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (hs > 0.6) { let r = Math.atan2(this.vel.x, this.vel.z) - this.yaw; r = Math.atan2(Math.sin(r), Math.cos(r)); this.yaw += r * Math.min(1, dt * 4); }
    this.pitch += (THREE.MathUtils.clamp(-this.vel.y * 0.08, -0.35, 0.35) - this.pitch) * Math.min(1, dt * 3);
    this.sub.position.copy(this.pos); this.sub.rotation.set(this.pitch, this.yaw, Math.sin(this.t * 2) * 0.02 + (this.bump ? Math.sin(this.t * 30) * this.bump * 0.2 : 0), "YXZ");
    if (this.bump) this.bump = Math.max(0, this.bump - dt);
    animateTorpedo(this.sub, dt, this.t, { speed: 4 + sp * 2, talk: this.g.talking === "torpedo", claw: !!this.carry });
    if (Math.random() < dt * (3 + sp)) this.g.fx.trail(this.pos.x - Math.sin(this.yaw) * 1.9, this.pos.y + 0.8, this.pos.z - Math.cos(this.yaw) * 1.9, 0xdff6ff, 0.18);
    // rings
    const r = this.rings[this.next];
    if (r) {
      r.m.rotation.z += dt * 0.5;
      if (this.pos.distanceTo(r.m.position) < r.r * 0.95) {
        r.passed = true; this.next++; this.paint(); this.g.sound("cell"); this.g.fx.ring(r.m.position.x, r.m.position.y, r.m.position.z, 0xffd166, 2);
        if (this.next >= this.rings.length && !this.salvage) { this.finishing = true; this.later(0.5, () => this.win()); }
      }
    }
    if (this.salvage) this.salvageUpdate(dt);
  }
  salvageUpdate(dt) {
    const inp = this.g.input, near = this.nearCrate();
    if (this.carry) {
      this.carry.o.position.set(this.pos.x, this.pos.y - 0.55, this.pos.z); this.carry.o.rotation.y = this.yaw;
      const inDrop = Math.hypot(this.pos.x - this.drop.x, this.pos.z - this.drop.z) < this.dropR && Math.abs(this.pos.y - this.drop.y) < 3;
      this.dropRing.material.color.setHex(inDrop ? 0xffffff : 0x7bed9f).multiplyScalar(3);
      if (inp.takeAction()) {
        if (inDrop) { this.carry.done = true; this.carry.o.position.set(this.drop.x + (this.dropped - 1) * 1.2, this.drop.y + 0.2, this.drop.z); this.carry.o.rotation.y = 0; this.dropped++; this.g.sound("cell"); this.g.fx.ring(this.drop.x, this.drop.y + 0.2, this.drop.z, 0x7bed9f, this.dropR); this.carry = null; if (this.dropped >= this.need) { this.finishing = true; this.later(0.6, () => this.win()); } }
        else { this.carry.o.position.y = this.pos.y - 1.2; this.carry = null; this.g.sound("land"); }
      }
    } else if (near && inp.takeAction()) { this.carry = near; near.ring.visible = false; this.g.sound("grab"); this.g.fx.burst(near.o.position.x, near.o.position.y + 0.3, near.o.position.z, 0x7bed9f, 16); }
    for (const c of this.crates) if (!c.done && c !== this.carry) c.ring.scale.setScalar(1 + Math.sin(this.t * 4) * 0.06);
  }
  nearCrate() { return this.crates.filter(c => !c.done && c !== this.carry && Math.hypot(c.o.position.x - this.pos.x, c.o.position.z - this.pos.z) < 2.4 && Math.abs(c.o.position.y - this.pos.y) < 3.2).sort((a, b) => a.o.position.distanceTo(this.pos) - b.o.position.distanceTo(this.pos))[0] || null; }
  ride(dt) {
    const pl = this.p;
    const seat = new THREE.Vector3(0, 0.55, 0.3).applyEuler(this.sub.rotation).add(this.pos);
    pl.obj.position.copy(seat); pl.obj.quaternion.copy(this.sub.quaternion);
    pl.blob.visible = false;
    animateSeat(pl.rig, dt, 0);
    pl.rig.hips.rotation.x = 0;
  }
  camera(cam, dt) {
    const inp = this.g.input;
    // the camera drifts round behind the heading; a drag swings it
    let d = this.yaw + Math.PI - this.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.camYaw += d * Math.min(1, dt * 1.2);
    const want = new THREE.Vector3(this.pos.x + Math.sin(this.camYaw) * 7, this.pos.y + 2.6, this.pos.z + Math.cos(this.camYaw) * 7);
    const sea = this.w.sea; if (sea) { const sh = sea.height(want.x, want.z); if (want.y > sh - 0.4) want.y = sh - 0.4; }
    const to = want.clone().sub(this.pos).normalize(), hit = this.w.phys.ray({ x: this.pos.x, y: this.pos.y + 0.8, z: this.pos.z }, { x: to.x, y: to.y, z: to.z }, 7.5, this.p.walker.col);
    if (hit !== null) want.copy(this.pos).addScaledVector(to, Math.max(1.5, hit - 0.4));
    cam.position.lerp(want, 1 - Math.exp(-dt * 5)); cam.lookAt(this.pos.x, this.pos.y + 0.6, this.pos.z);
    this.w.followShadow(this.pos);
    this.p.camYaw = this.camYaw;
    void inp;
  }
  cleanup() {
    this.g.driveMode = null; this.p.frozen = false;
    this.p.walker.col.setEnabled(true);
    const e = this.data.exit || this.data.start;
    this.p.teleport(e[0], e[1], e[2], e[3] || 0); this.p.obj.quaternion.identity(); this.p.rig.hips.rotation.x = 0;
    this.g.bolt.root.visible = true; this.g.bolt.pos.set(e[0] + 1.5, e[1], e[2]);
    this.g.input.forcedDive = false; this.g.input.jumpHeld = false;
    if (this.w.torpedo) this.w.torpedo.visible = true;
    super.cleanup();
  }
  actionLabel() { if (!this.salvage) return null; return this.carry ? "DROP" : this.nearCrate() ? "GRAB" : null; }
  hud() {
    if (this.salvage) return { ...super.hud(), text: `Lift the cases to the ring  ${this.dropped}/${this.need}`, progress: this.dropped / this.need };
    return { ...super.hud(), text: `Fly TORPEDO through the rings  ${this.next}/${this.rings.length}`, progress: this.next / this.rings.length };
  }
  target() { if (this.salvage) { if (this.carry) return this.drop; const c = this.crates.find(c => !c.done); return c ? c.o.position : null; } const r = this.rings[this.next]; return r ? r.m.position : null; }
  debugState() { const f = x => Math.round(x * 10) / 10; return { p: [f(this.pos.x), f(this.pos.y), f(this.pos.z)], next: this.next, carry: !!this.carry, dropped: this.dropped }; }
  solve() {
    const inp = this.g.input;
    let t = null, reach = 0;
    if (this.salvage) {
      if (this.carry) { t = this.drop.clone(); t.y += 1.2; reach = this.dropR * 0.5; }
      else { const c = this.crates.find(c => !c.done); if (!c) return; t = c.o.position.clone(); t.y += 1.2; reach = 1.2; }
    } else { const r = this.rings[this.next]; if (!r) return; t = r.m.position; }
    const dx = t.x - this.pos.x, dz = t.z - this.pos.z, dy = t.y - this.pos.y, dh = Math.hypot(dx, dz);
    this.camYaw = Math.atan2(-dx, -dz);
    // something in the way: go up over it
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const hit = dh > 1 ? this.w.phys.ray({ x: this.pos.x, y: this.pos.y + 0.8, z: this.pos.z }, { x: dir.x, y: 0, z: dir.z }, 4, this.p.walker.col) : null;
    inp.forced = dh > reach + 0.3 ? { mx: hit !== null ? 0.5 : 0, my: Math.min(1, dh / 3) } : { mx: 0, my: 0 };
    inp.jumpHeld = hit !== null || dy > 0.3; inp.forcedDive = hit === null && dy < -0.3;
    if (this.salvage && dh < reach + 0.3 && Math.abs(dy) < 1.5) { inp.forced = { mx: 0, my: 0 }; inp.jumpHeld = false; inp.forcedDive = false; if ((this.actT = (this.actT || 0) + 1) % 10 === 0) inp.actionPressed = true; }
    if (this.t - (this.solveT0 ?? (this.solveT0 = this.t)) > 90) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} sub target ${this.next}`); this.pos.copy(t); this.solveT0 = this.t; }
    if (this.lastNext !== this.next || this.lastCarry !== !!this.carry) { this.lastNext = this.next; this.lastCarry = !!this.carry; this.solveT0 = this.t; }
  }
}

// ------------------------------------------------------------ Boat chase: catch the Drip's boat and bump it
export class Boat extends Mission {
  start() {
    const d = this.data, sea = this.w.sea;
    this.seaH = (x, z) => sea ? sea.height(x, z) : (d.y ?? 0);
    const pts = d.path.map(([x, z]) => new THREE.Vector3(x, this.seaH(x, z), z));
    this.curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    this.len = this.curve.getLength();
    const kind = d.boat || "jetski"; this.L = BOATS[kind];
    this.boat = this.add(makeBoat(kind));
    const p0 = this.curve.getPointAt(0), t0 = this.curve.getTangentAt(0);
    this.pos = new THREE.Vector3(p0.x, this.seaH(p0.x, p0.z), p0.z); this.yaw = Math.atan2(t0.x, t0.z); this.speed = 0; this.steer = 0; this.boost = 0; this.roll = 0; this.pitch = 0;
    this.need = this.def.n || 3;
    this.s = d.lead ?? 30; this.qv = 0; this.boostT = 0; this.cool = 0; this.tags = 0; this.wob = 0;
    // the quarry: a Drip at the wheel of its own boat, driven along the route
    this.q = this.add(makeBoat(d.quarry || "motorboat", 0x2ab8c8));
    this.bot = new Robot("drip", 1.0); const qs = this.q.userData.seat; this.bot.root.position.set(qs.x, qs.y - 0.3, qs.z); this.bot.play("Sitting"); this.q.add(this.bot.root);
    this.g.driveMode = this;
    if (d.exit) { this.p.teleport(d.exit[0], d.exit[1], d.exit[2], d.exit[3] || 0); this.p.swimming = false; this.p.walker.setSwim(false); }
    this.p.walker.col.setEnabled(false); this.p.frozen = true;
    // BOLT rides along when there is a second seat
    this.boltAboard = !!this.boat.userData.seat2;
    if (!this.boltAboard) this.g.bolt.root.visible = false;
    this.placeQuarry(0);
  }
  placeQuarry(dt) {
    const u = ((this.s % this.len) + this.len) % this.len / this.len;
    const p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u);
    p.y = this.seaH(p.x, p.z);
    this.wob = Math.max(0, this.wob - dt * 2);
    const yaw = Math.atan2(t.x, t.z) + Math.sin(this.wob * 20) * this.wob * 0.5;
    this.q.position.copy(p); this.q.rotation.set(0, yaw, Math.sin(this.t * 2.5) * 0.04, "YXZ");
    animateBoat(this.q, dt, this.qv);
    if (this.qv > 3 && Math.random() < dt * 8) this.g.fx.trail(p.x - Math.sin(yaw) * 2, p.y + 0.1, p.z - Math.cos(yaw) * 2, 0xffffff, 0.35);
  }
  // how far along the route the boat is, searched near where it was
  boatS() {
    let best = this.cs || 0, bd = 1e9;
    for (let k = -30; k <= 30; k++) { const s = (this.cs || 0) + k * 1.5; const u = ((s % this.len) + this.len) % this.len / this.len; const d = this.curve.getPointAt(u).distanceToSquared(this.pos); if (d < bd) { bd = d; best = s; } }
    this.cs = best; return best;
  }
  update(dt) {
    const inp = this.g.input, L = this.L;
    const throttle = inp.my < -0.3 ? -1 : (this.autoThrottle ?? 1);
    if ((inp.takeJump() || this.autoBoost) && this.boost <= 0) { this.boost = 1.4; this.g.sound("whoosh"); }
    this.autoBoost = false; this.boost -= dt;
    const bo = this.boost > 0 ? 1.55 : 1;
    const want = throttle > 0 ? L.maxSpeed * bo : throttle < 0 ? -3 : 0;
    this.speed += (want - this.speed) * Math.min(1, dt * (throttle > 0 ? L.accel / 8 : 1.2));
    this.steer += (-inp.mx * L.turn - this.steer) * Math.min(1, dt * 6);
    this.yaw += this.steer * Math.min(1, Math.abs(this.speed) / 5) * dt * Math.sign(this.speed || 1);
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    // rocks, quays and hulls stop the boat
    let blocked = false;
    for (const a of [0, 0.45, -0.45]) {
      const dx = Math.sin(this.yaw + a), dz = Math.cos(this.yaw + a);
      const hit = this.w.phys.ray({ x: this.pos.x, y: this.pos.y + 0.5, z: this.pos.z }, { x: dx, y: 0, z: dz }, L.len * 0.6 + 0.6, this.p.walker.col);
      if (hit !== null) { blocked = true; break; }
    }
    if (blocked && this.speed > 0) { if (this.speed > 4) { this.g.sound("hit"); this.wobT = 0.6; } this.speed = -1.5; this.pos.x -= hx * 0.3; this.pos.z -= hz * 0.3; }
    this.pos.x += hx * this.speed * dt; this.pos.z += hz * this.speed * dt;
    // stuck with the pedal down: back onto the water
    this.stuckT = Math.abs(this.speed) < 0.6 && throttle > 0 ? (this.stuckT || 0) + dt : 0;
    if (this.stuckT > 2.5) { this.stuckT = 0; this.backOnWater(); }
    // ride the waves
    const sea = this.w.sea, h = this.seaH(this.pos.x, this.pos.z), n = sea ? sea.normal(this.pos.x, this.pos.z) : [0, 1, 0];
    this.pos.y = h + 0.05 + Math.min(0.25, Math.abs(this.speed) * 0.015);
    const wantRoll = -this.steer * Math.min(1, Math.abs(this.speed) / 8) * 0.28 + n[0] * 0.6, wantPitch = -Math.min(0.2, Math.abs(this.speed) * 0.012) + n[2] * 0.6 + (this.wobT ? Math.sin(this.t * 25) * this.wobT * 0.2 : 0);
    if (this.wobT) this.wobT = Math.max(0, this.wobT - dt);
    this.roll += (wantRoll - this.roll) * Math.min(1, dt * 4); this.pitch += (wantPitch - this.pitch) * Math.min(1, dt * 4);
    this.boat.position.copy(this.pos); this.boat.rotation.set(this.pitch, this.yaw, this.roll, "YXZ");
    animateBoat(this.boat, dt, this.speed);
    // the wake and the spray
    if (Math.abs(this.speed) > 3 && Math.random() < dt * 14) this.g.fx.trail(this.pos.x - hx * L.len * 0.5 + (Math.random() - 0.5), this.pos.y + 0.05, this.pos.z - hz * L.len * 0.5 + (Math.random() - 0.5), 0xffffff, 0.4);
    if (this.boost > 0 && Math.random() < 0.8) this.g.fx.burst(this.pos.x - hx * L.len * 0.5, this.pos.y + 0.1, this.pos.z - hz * L.len * 0.5, 0xdff6ff, 3, { speed: 2, up: 2, life: 0.4, size: 0.4, gravity: -6, bright: 1.5 });
    // the quarry keeps its distance: slower when far ahead, faster when caught up
    const cs = this.boatS();
    if (this.lastCs !== undefined && dt > 0) this.csv = (this.csv ?? 0) + (Math.max(0, (cs - this.lastCs) / dt) - (this.csv ?? 0)) * Math.min(1, dt * 1.5);
    this.lastCs = cs;
    const gap = this.s - cs, base = 9 + this.lv * 1.6, rv = this.csv ?? 0;
    const r = gap > 40 ? 0.6 : gap > 14 ? 0.8 : 0.86;
    let v = Math.min(base, Math.max(3, rv * r));
    if (this.boostT > 0) { this.boostT -= dt; v += 6; }
    this.qv += (v - this.qv) * Math.min(1, dt * 2);
    this.s += this.qv * dt;
    this.placeQuarry(dt);
    this.bot.update(dt);
    this.cool -= dt;
    const d = this.pos.distanceTo(this.q.position);
    if (d < 4.4 && this.cool <= 0) {
      this.tags++; this.cool = 2.2; this.boostT = 1.6; this.wob = 1;
      this.g.fx.burst(this.q.position.x, this.q.position.y + 1, this.q.position.z, 0xffd166, 36, { speed: 6 });
      this.g.sound("hit"); this.bot.play("No");
      if (this.tags >= this.need) this.caught();
    }
  }
  backOnWater() {
    const s = (this.cs || 0) + 3, u = ((s % this.len) + this.len) % this.len / this.len;
    const p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u);
    this.pos.set(p.x, this.seaH(p.x, p.z), p.z); this.yaw = Math.atan2(t.x, t.z); this.speed = 0;
    this.resets = (this.resets || 0) + 1;
    this.g.fx.puff(p.x, p.y + 0.3, p.z, 0xffffff, 20);
    toast("Back on the water!", 1.6);
  }
  caught() {
    this.qv = 0; this.boostT = 0;
    const b = this.add(makeBubble(2.2)); b.position.copy(this.q.position).setY(this.q.position.y + 1.2);
    this.g.sound("pop"); this.g.addCells(1);
    this.finishing = true; this.later(0.6, () => this.win());
  }
  ride(dt) {
    const pl = this.p, seat = this.boat.userData.seat.clone().applyEuler(this.boat.rotation).add(this.pos);
    pl.obj.position.copy(seat); pl.obj.quaternion.copy(this.boat.quaternion); pl.blob.visible = false;
    animateSeat(pl.rig, dt, -this.steer / this.L.turn); pl.rig.hips.rotation.x = 0;
    if (this.boltAboard) { const b = this.g.bolt, s2 = this.boat.userData.seat2.clone().applyEuler(this.boat.rotation).add(this.pos); b.pos.copy(s2); b.pos.y -= 0.35; b.root.rotation.y = this.yaw; b.play("Sitting"); }
  }
  camera(cam, dt) {
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw), c = this.pos;
    const want = new THREE.Vector3(c.x - hx * 8.5, c.y + 3.4, c.z - hz * 8.5);
    const hit = this.g.phys.ray({ x: c.x, y: c.y + 1.5, z: c.z }, { x: -hx, y: 0.2, z: -hz }, 8.5, this.p.walker.col);
    if (hit !== null && hit < 8) want.set(c.x - hx * (hit - 0.5), c.y + 3.4, c.z - hz * (hit - 0.5));
    const sea = this.w.sea; if (sea) want.y = Math.max(want.y, sea.height(want.x, want.z) + 1.2);
    cam.position.lerp(want, 1 - Math.exp(-dt * 5));
    cam.lookAt(c.x + hx * 5, c.y + 0.8, c.z + hz * 5);
    this.w.followShadow(c);
    this.p.camYaw = Math.atan2(-hx, -hz) + Math.PI;
  }
  cleanup() {
    this.g.driveMode = null; this.p.frozen = false;
    this.p.walker.col.setEnabled(true);
    const e = this.data.exit || [this.pos.x, this.pos.y + 0.3, this.pos.z];
    this.p.teleport(e[0], e[1], e[2], e[3] ?? this.yaw); this.p.obj.quaternion.identity(); this.p.rig.hips.rotation.x = 0;
    this.g.bolt.root.visible = true; this.g.bolt.pos.set(e[0] + 1.5, e[1], e[2]); this.g.bolt.play("Idle");
    super.cleanup();
  }
  hud() { return { ...super.hud(), text: `Catch the Drip's boat and bump it  ${this.tags}/${this.need}`, progress: this.tags / this.need }; }
  target() { return this.q.position; }
  actionLabel() { return null; }
  debugState() { const f = x => Math.round(x * 10) / 10; return { gap: f(this.s - (this.cs || 0)), qv: f(this.qv), v: f(this.speed), tags: this.tags, resets: this.resets || 0 }; }
  solve() {
    const cs = this.boatS(), gap = this.s - cs;
    let tgt;
    if (gap < 14) tgt = this.q.position.clone();
    else { const u = (((cs + 10) % this.len) + this.len) % this.len / this.len; tgt = this.curve.getPointAt(u); }
    const hx = Math.sin(this.yaw), hz = Math.cos(this.yaw);
    const to = tgt.clone().sub(this.pos).setY(0).normalize();
    const cross = hx * to.z - hz * to.x, dot = hx * to.x + hz * to.z;
    const ang = Math.atan2(cross, dot);
    this.g.input.forced = { mx: Math.max(-1, Math.min(1, ang * 2.0)), my: 0 };
    const at = k => { const u = ((((cs + k) % this.len) + this.len) % this.len) / this.len, t = this.curve.getTangentAt(u); return Math.atan2(t.x, t.z); };
    let bend = at(this.speed * 1.5 + 6) - at(2); bend = Math.abs(Math.atan2(Math.sin(bend), Math.cos(bend)));
    const safe = bend > 1.0 ? 8 : bend > 0.5 ? 12 : 99;
    this.autoThrottle = Math.abs(ang) > 1.4 && this.speed > 8 ? -1 : this.speed > safe ? 0.2 : 1;
    this.autoBoost = (gap > 18 || gap < 10) && Math.abs(ang) < 0.25 && bend < 0.3;
  }
}

Object.assign(KINDS, { dive: Dive, sub: Sub, salvage: Sub, boat: Boat });
