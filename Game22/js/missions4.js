// The colour missions: finding the things that still have their colour and
// spreading it, running the rainbow gates in order, and flying a sky lantern
// through the rings. Each has an autopilot like every other kind.
import * as THREE from "three";
import { Mission, KINDS, Drone, v3 } from "./missions.js";
import { HUES } from "./props.js";
import { Chroma } from "./chroma.js";
import { toast } from "./ui.js";

const glowM = (hex, ei = 2) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: ei, roughness: 0.3 });

// ------------------------------------------------------------ Search: the last coloured things
// data.spots: [x, y, z, hue?] the things the level built that still have colour. A hovering
// swatch marks each; touching it spreads the colour to everything round it.
export class Search extends Mission {
  start() {
    const spots = this.data.spots || [];
    this.need = Math.min(this.def.n || spots.length, spots.length);
    this.spots = spots.slice(0, this.need).map((s, i) => {
      const hue = s[3] ?? HUES[i % HUES.length];
      const g = new THREE.Group(); g.position.set(s[0], s[1], s[2]); this.add(g);
      // a drop of the colour, hovering, and a ring on the ground under it
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), glowM(hue, 2.4)); orb.position.y = 1.6; g.add(orb);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(hue).multiplyScalar(1.5), transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.y = 1.6; g.add(halo);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(hue).multiplyScalar(2.5) })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.08; g.add(ring);
      return { g, orb, halo, ring, hue, found: false, ph: i * 1.3, r: s[4] ?? 8 };
    });
    this.found = 0;
  }
  update(dt) {
    const pc = this.p.pos;
    for (const s of this.spots) {
      if (s.found) continue;
      const t = this.t + s.ph;
      s.orb.position.y = 1.6 + Math.sin(t * 2) * 0.15; s.halo.position.y = s.orb.position.y; s.halo.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
      s.ring.rotation.z += dt; s.ring.scale.setScalar(1 + Math.sin(t * 2.5) * 0.08);
      const p = s.g.position;
      if (Math.hypot(p.x - pc.x, p.z - pc.z) < 1.4 && Math.abs(p.y - pc.y) < 2) {
        s.found = true; this.found++; s.g.visible = false;
        Chroma.restore(p.x, p.y, p.z, s.r, 2.2);
        this.g.fx.burst(p.x, p.y + 1.4, p.z, s.hue, 40, { speed: 4, up: 3, life: 1.2, size: 0.7, bright: 2 });
        this.g.fx.ring(p.x, p.y + 0.2, p.z, s.hue, s.r * 0.5);
        this.g.sound("colour"); this.g.addCells(1);
        if (this.found >= this.need) { this.finishing = true; this.later(1.4, () => this.win()); }
      }
    }
  }
  hud() { return { ...super.hud(), text: `Find the things that still have colour  ${this.found}/${this.need}`, progress: this.found / this.need }; }
  target() { const s = this.spots.filter(s => !s.found).sort((a, b) => a.g.position.distanceTo(this.p.pos) - b.g.position.distanceTo(this.p.pos))[0]; return s ? s.g.position : null; }
  debugState() { const f = x => Math.round(x * 10) / 10, pp = this.p.pos; return { p: [f(pp.x), f(pp.y), f(pp.z)], found: this.found, aim: this.aim ? this.spots.indexOf(this.aim) : null, path: this.navPath ? this.navPath.length : null }; }
  solve() {
    const s = this.aim && !this.aim.found ? this.aim : this.spots.filter(s => !s.found).sort((a, b) => a.g.position.distanceTo(this.p.pos) - b.g.position.distanceTo(this.p.pos))[0];
    if (!s) return;
    if (s !== this.aim) { this.aim = s; this.aimT = this.t; this.navTo = null; }
    const p = s.g.position;
    if (this.t - this.aimT > 30) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} spot ${this.spots.indexOf(s)} at ${p.toArray().map(v => v.toFixed(1)).join(",")}`); this.p.teleport(p.x, p.y, p.z); this.aimT = this.t; return; }
    this.g.input.jumpHeld = false;
    this.walkTo(p.x, p.y + 0.7, p.z, 0.8, this.spots.map(s => s.g.position));
  }
}

// ------------------------------------------------------------ Hues: the rainbow gates, in order
// data.gates: [x, y, z, ry] six or more arches; the colours go round the rainbow.
export class Hues extends Mission {
  start() {
    const d = this.data;
    this.gates = (d.gates || []).map((g, i) => {
      const hue = HUES[i % HUES.length];
      const grp = new THREE.Group(); grp.position.set(g[0], g[1], g[2]); grp.rotation.y = g[3] || 0; this.add(grp);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.16, 12, 40, Math.PI), glowM(hue, 0.5)); arch.position.y = 0.2; grp.add(arch);
      for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.6, 10), arch.material); post.position.set(sx * 1.9, 0.3, 0); grp.add(post); }
      const num = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), glowM(hue, 2)); num.position.y = 2.5; grp.add(num);
      return { grp, arch, num, hue, passed: false, i };
    });
    this.next = 0; this.wrongT = 0;
    this.paint();
  }
  paint() { this.gates.forEach((g, i) => { const on = i === this.next; g.arch.material.emissiveIntensity = g.passed ? 0.25 : on ? 2.4 : 0.35; g.num.visible = on; g.arch.scale.setScalar(on ? 1.06 : 1); }); }
  update(dt) {
    const pp = this.p.pos;
    const g = this.gates[this.next]; if (!g) return;
    this.wrongT -= dt;
    g.num.position.y = 2.5 + Math.sin(this.t * 4) * 0.15; g.num.rotation.y += dt * 2; g.arch.rotation.z += 0; // (the arch stays)
    for (const q of this.gates) {
      if (q.passed) continue;
      const p = q.grp.position;
      if (Math.hypot(p.x - pp.x, p.z - pp.z) < 1.5 && pp.y > p.y - 1 && pp.y < p.y + 2.5) {
        if (q === g) {
          q.passed = true; this.next++; this.paint();
          this.g.sound("cell"); this.g.fx.ring(p.x, p.y + 0.3, p.z, q.hue, 2.5); this.g.fx.burst(p.x, p.y + 1.5, p.z, q.hue, 30, { speed: 4, up: 2, life: 0.9, bright: 2 });
          Chroma.restore(p.x, p.y, p.z, 5, 1.5);
          if (this.next >= this.gates.length) { this.finishing = true; this.later(0.8, () => this.win()); }
        } else if (this.wrongT <= 0) { this.wrongT = 2; this.g.sound("fail"); toast(`Not that one! ${NAMES[g.i % NAMES.length]} is next.`, 1.8); }
      }
    }
  }
  hud() { return { ...super.hud(), text: `Through the gates in rainbow order  ${this.next}/${this.gates.length}`, progress: this.next / this.gates.length }; }
  target() { const g = this.gates[this.next]; return g ? g.grp.position : null; }
  debugState() { const f = x => Math.round(x * 10) / 10, pp = this.p.pos; return { p: [f(pp.x), f(pp.y), f(pp.z)], next: this.next, path: this.navPath ? this.navPath.length : null }; }
  solve() {
    const g = this.gates[this.next]; if (!g) return;
    const p = g.grp.position;
    if (this.aim !== g) { this.aim = g; this.aimT = this.t; this.navTo = null; }
    if (this.t - this.aimT > 30) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} gate ${g.i} at ${p.toArray().map(v => v.toFixed(1)).join(",")}`); this.p.teleport(p.x, p.y, p.z); this.aimT = this.t; return; }
    this.g.input.jumpHeld = false;
    this.walkTo(p.x, p.y + 0.7, p.z, 0.6, this.gates.map(g => g.grp.position));
  }
}
const NAMES = ["Red", "Orange", "Yellow", "Green", "Blue", "Violet"];

// ------------------------------------------------------------ Flight: a sky lantern through the rings
// data.start: [x, y, z]; data.rings: [x, y, z, r, ry]; data.ceiling. Rory rides in the basket
// under a paper lantern; JUMP lifts it, letting go sinks it, the stick drifts it across.
export class Flight extends Drone {
  start() {
    super.start();
    const d = this.data;
    const L = this.lantern = new THREE.Group(); this.add(L);
    const paper = new THREE.MeshStandardMaterial({ color: 0xffb040, emissive: 0xff8020, emissiveIntensity: 1.6, roughness: 0.9, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 2.2, 14, 1, true), paper); body.position.y = 2.4; L.add(body);
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), paper); top.position.y = 3.5; L.add(top);
    const flame = this.flame = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe080).multiplyScalar(4) })); flame.position.y = 1.5; L.add(flame);
    const light = this.lightP = new THREE.PointLight(0xffa040, 2.5, 12, 1.6); light.position.y = 2.2; L.add(light);
    const basketM = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.9 });
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.7, 12, 1, true), basketM); basket.position.y = 0.35; L.add(basket);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12), basketM); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; L.add(floor);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), basketM); rope.position.set(Math.cos(a) * 0.55, 1.15, Math.sin(a) * 0.55); rope.rotation.z = Math.cos(a) * 0.35; rope.rotation.x = -Math.sin(a) * 0.35; L.add(rope); }
    this.pos.set(...(d.start || [this.p.pos.x, this.p.pos.y + 1, this.p.pos.z]));
    this.vel.set(0, 0, 0);
    for (const j of this.jets) j.visible = false;
    this.p.blob.visible = false;
    this.g.bolt.root.visible = false;
    this.place();
  }
  place() {
    const L = this.lantern, p = this.p;
    L.position.copy(this.pos);
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.5) { let r = Math.atan2(this.vel.x, this.vel.z) - L.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); L.rotation.y += r * 0.05; }
    L.rotation.z = -this.vel.x * 0.03; L.rotation.x = this.vel.z * 0.03;
    // Rory stands in the basket (the walker rides along so nothing falls away)
    p.walker.teleport(this.pos.x, this.pos.y + 0.05, this.pos.z); p.walker.vel.set(0, 0, 0);
    p.obj.position.set(this.pos.x, this.pos.y + 0.05, this.pos.z); p.obj.rotation.y = L.rotation.y; p.blob.visible = false;
    p.yaw = L.rotation.y;
  }
  fly(dt) {
    const inp = this.g.input, p = this.p;
    const fx = -Math.sin(p.camYaw), fz = -Math.cos(p.camYaw);
    const ax = (inp.my * fx - inp.mx * fz) * 12, az = (inp.my * fz + inp.mx * fx) * 12;
    const ay = inp.jumpHeld ? 9 : (inp.forcedY ?? -2.2);
    this.vel.x += ax * dt; this.vel.z += az * dt; this.vel.y += ay * dt;
    this.vel.multiplyScalar(Math.exp(-dt * 1.6));
    this.pos.addScaledVector(this.vel, dt);
    const gnd = this.g.phys.ray({ x: this.pos.x, y: this.pos.y + 0.5, z: this.pos.z }, { x: 0, y: -1, z: 0 }, 40, p.walker.col);
    const floor = gnd !== null ? this.pos.y + 0.5 - gnd : -10;
    if (this.pos.y < floor + 0.4) { this.pos.y = floor + 0.4; this.vel.y = Math.max(0, this.vel.y); }
    this.pos.y = Math.min(this.pos.y, (this.data.ceiling ?? 40));
    this.flame.scale.setScalar(0.8 + Math.random() * 0.4 + (inp.jumpHeld ? 0.7 : 0)); this.lightP.intensity = 2 + (inp.jumpHeld ? 2 : 0) + Math.random() * 0.5;
    if (inp.jumpHeld && Math.random() < 0.6) this.g.fx.trail(this.pos.x, this.pos.y + 1.4, this.pos.z, 0xffb040, 0.25);
    this.place();
  }
  camera(cam, dt) {
    const p = this.p, back = new THREE.Vector3(Math.sin(p.camYaw) * 7.5, 3.2, Math.cos(p.camYaw) * 7.5);
    const want = this.pos.clone().add(back);
    cam.position.lerp(want, 1 - Math.exp(-dt * 6)); cam.lookAt(this.pos.x, this.pos.y + 1.4, this.pos.z);
    this.g.world.followShadow(this.pos);
  }
  cleanup() {
    const c = this.pos.clone();
    this.g.droneMode = null; this.g.input.forcedY = undefined; this.g.input.jumpHeld = false;
    // down to the ground under the basket
    const gnd = this.g.phys.ray({ x: c.x, y: c.y + 0.5, z: c.z }, { x: 0, y: -1, z: 0 }, 60, this.p.walker.col);
    const y = gnd !== null ? c.y + 0.5 - gnd : c.y;
    this.p.teleport(c.x, y + 0.2, c.z); this.p.obj.rotation.set(0, this.p.yaw, 0);
    this.g.bolt.root.visible = true; this.g.bolt.pos.set(c.x + 1.5, y, c.z);
    Mission.prototype.cleanup.call(this);
  }
  hud() { return { ...super.hud(), text: `Fly the lantern through the rings  ${this.next}/${this.rings.length}`, progress: this.next / this.rings.length }; }
}

Object.assign(KINDS, { search: Search, hues: Hues, flight: Flight });
void v3;
