// Baroness Grisaille's Blotters: round grey blobs that hover along on a cushion
// of nothing, a mop stuck in the top, two anxious eyes, and a drip now and then.
// They mop colour up. Same API as the old robots (root, pos, play, update,
// walkTo), so every mission that had robots has Blotters instead.
import * as THREE from "three";

const greyM = () => new THREE.MeshStandardMaterial({ color: 0x9a9aa4, roughness: 0.55, metalness: 0.15 });
const darkM = new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.5, metalness: 0.3 });
const whiteM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
const blackM = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.2 });

export class Blotter {
  // kind: "blot" (a Blotter), "guard" (one with a lamp), "boss" (the Big Blot)
  constructor(kind = "blot", height = 1.25) {
    const g = this.root = new THREE.Group();
    const s = this.s = height / 1.25;
    this.kind = kind;
    const body = this.body = new THREE.Group(); body.position.y = 0.55 * s; g.add(body);
    const add = (geo, m, x, y, z, parent = body) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };
    this.skin = greyM();
    if (kind === "boss") this.skin.color.setHex(0x6a6a78);
    const blob = add(new THREE.SphereGeometry(0.42 * s, 20, 14), this.skin, 0, 0, 0); blob.scale.set(1.15, 0.85, 1.1);
    // a drippy skirt of lumps round the bottom
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; add(new THREE.SphereGeometry(0.12 * s, 8, 6), this.skin, Math.cos(a) * 0.36 * s, -0.24 * s - (i % 2) * 0.06 * s, Math.sin(a) * 0.34 * s); }
    // the mop
    add(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 0.7 * s, 8), darkM, 0.05 * s, 0.6 * s, -0.05 * s).rotation.z = -0.15;
    const mop = this.mop = new THREE.Group(); mop.position.set(0.12 * s, 0.9 * s, -0.05 * s); body.add(mop);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const st = add(new THREE.CapsuleGeometry(0.02 * s, 0.22 * s, 3, 6), new THREE.MeshStandardMaterial({ color: 0xd8d8dc, roughness: 0.9 }), Math.cos(a) * 0.07 * s, -0.08 * s, Math.sin(a) * 0.07 * s, mop); st.rotation.z = Math.cos(a) * 0.6; st.rotation.x = -Math.sin(a) * 0.6; }
    // eyes (worried), a mouth (a wobbly line), stubby arms
    this.eyes = [-1, 1].map(sx => { const e = add(new THREE.SphereGeometry(0.1 * s, 12, 10), whiteM, sx * 0.16 * s, 0.1 * s, 0.36 * s); e.castShadow = false; add(new THREE.SphereGeometry(0.045 * s, 8, 6), blackM, sx * 0.17 * s, 0.1 * s, 0.44 * s).castShadow = false; const brow = add(new THREE.BoxGeometry(0.14 * s, 0.03 * s, 0.03 * s), darkM, sx * 0.16 * s, 0.22 * s, 0.38 * s); brow.rotation.z = -sx * 0.35; brow.castShadow = false; return e; });
    this.mouth = add(new THREE.TorusGeometry(0.07 * s, 0.012 * s, 6, 10, Math.PI), darkM, 0, -0.06 * s, 0.4 * s); this.mouth.rotation.x = 0.3; this.mouth.castShadow = false;
    this.arms = [-1, 1].map(sx => { const a = add(new THREE.CapsuleGeometry(0.05 * s, 0.2 * s, 4, 8), this.skin, sx * 0.44 * s, -0.02 * s, 0.05 * s); a.rotation.z = sx * 1.2; return a; });
    // a lamp for the guards
    if (kind === "guard") {
      const lampM = new THREE.MeshStandardMaterial({ color: 0xffe8a0, emissive: 0xffd060, emissiveIntensity: 2.5 });
      add(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.5 * s, 6), darkM, 0.5 * s, 0.2 * s, 0.2 * s).rotation.z = -0.3;
      this.lamp = add(new THREE.SphereGeometry(0.1 * s, 10, 8), lampM, 0.58 * s, 0.44 * s, 0.2 * s); this.lamp.castShadow = false;
    }
    // the boss carries the tank the missions aim at, on its back
    this.pos = g.position;
    this.mode = "Idle"; this.t = Math.random() * 6; this.height = height; this.talk = 0;
    this.light = { material: this.skin }; // (the old robots had an antenna light the missions poke at)
  }
  play(name) { this.mode = name; if (name === "No" || name === "Punch" || name === "Death") this.react = 1; }
  walkTo(x, z, speed, dt) {
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.1) { const step = Math.min(d, speed * dt); this.pos.x += dx / d * step; this.pos.z += dz / d * step; const want = Math.atan2(dx, dz); let r = want - this.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); this.root.rotation.y += r * Math.min(1, dt * 8); }
    return d;
  }
  update(dt) {
    this.t += dt; const t = this.t, s = this.s, m = this.mode, moving = m === "Walking" || m === "Running";
    // hovering: a bob, a lean into the move, the mop flops about
    this.body.position.y = 0.55 * s + Math.sin(t * 3) * 0.04 * s + (moving ? Math.abs(Math.sin(t * 9)) * 0.05 * s : 0);
    this.body.rotation.x += ((moving ? 0.18 : 0) - this.body.rotation.x) * Math.min(1, dt * 6);
    this.body.rotation.z = Math.sin(t * 2.1) * 0.05;
    this.mop.rotation.z = Math.sin(t * 4) * 0.15; this.mop.rotation.x = Math.cos(t * 3.3) * 0.15;
    this.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (1.2 + Math.sin(t * 5 + i) * 0.2); });
    if (this.react > 0) { this.react -= dt; this.body.rotation.y = Math.sin(t * 25) * 0.3 * this.react; this.body.scale.setScalar(1 + Math.sin(t * 20) * 0.08 * this.react); if (this.react <= 0) { this.body.rotation.y = 0; this.body.scale.setScalar(1); if (m !== "Death") this.mode = "Idle"; } }
    if (m === "Sitting") this.body.position.y = 0.35 * s;
    if (m === "Jump") this.body.position.y += 0.4 * s;
    if (m === "Death") { this.body.rotation.x = 0.6; this.body.position.y = 0.3 * s; }
    this.mouth.scale.y = this.talk ? 1 + Math.abs(Math.sin(t * 14)) : 1;
    for (const e of this.eyes) e.scale.y = Math.sin(t * 1.1 + this.t) > 0.98 ? 0.2 : 1;
    if (this.lamp) this.lamp.material.emissiveIntensity = 2.2 + Math.sin(t * 6) * 0.5;
  }
}
// a Blotter for missions that asked the old code for a robot by name
export function makeBot(kind, height) { return new Blotter(kind === "guard" ? "guard" : kind === "boss" ? "boss" : "blot", height); }
