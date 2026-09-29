// PEBBLE: Rory's partner in Timeslip, a baby triceratops built from simple shapes. She has three
// nubby horns, a frill that flushes pink when she's happy, big shiny eyes and a stubby tail. She
// trots after Rory, sniffs out hidden things with her nose to the ground, charges, and honks and
// purrs rather than talking. She grows a little in every era (grow). Same little API as BOLT and
// PALETTE: root, pos, play(name), update(dt), walkTo(x, z, speed, dt).
import * as THREE from "three";

export class Pebble {
  constructor(size = 1) {
    const g = this.root = new THREE.Group();
    const s = 1; this.s = s;
    // (her body is one size; the whole of her is scaled as she grows)
    const skin = this.skin = new THREE.MeshStandardMaterial({ color: 0x7cc47a, roughness: 0.6, metalness: 0.02 });
    const belly = new THREE.MeshStandardMaterial({ color: 0xe8e2b8, roughness: 0.7 });
    const frillM = this.frillM = new THREE.MeshStandardMaterial({ color: 0x5aa86a, roughness: 0.55, emissive: 0xff5a8a, emissiveIntensity: 0 });
    const horn = new THREE.MeshStandardMaterial({ color: 0xf4ead0, roughness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.3, metalness: 0.2 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const spots = new THREE.MeshStandardMaterial({ color: 0x5a9a5e, roughness: 0.6 });
    const add = (geo, m, x, y, z, parent = g) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };

    // the body: a round barrel on four stumpy legs
    const body = this.body = new THREE.Group(); body.position.y = 0.36; g.add(body);
    add(new THREE.SphereGeometry(0.3, 20, 14), skin, 0, 0, 0, body).scale.set(0.95, 0.85, 1.25);
    add(new THREE.SphereGeometry(0.26, 16, 10), belly, 0, -0.08, 0.04, body).scale.set(0.85, 0.7, 1.1);
    for (const [x, y, z, r] of [[0.12, 0.2, -0.05, 0.07], [-0.1, 0.22, 0.1, 0.06], [0.02, 0.24, -0.2, 0.05], [-0.16, 0.14, -0.14, 0.05]]) add(new THREE.SphereGeometry(r, 8, 6), spots, x, y, z, body).scale.y = 0.4;
    this.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const leg = new THREE.Group(); leg.position.set(sx * 0.17, -0.12, sz * 0.2); body.add(leg);
      add(new THREE.CylinderGeometry(0.075, 0.085, 0.24, 10), skin, 0, -0.1, 0, leg);
      const foot = add(new THREE.CylinderGeometry(0.095, 0.1, 0.06, 12), belly, 0, -0.22, 0.01, leg);
      for (let k = -1; k <= 1; k++) add(new THREE.SphereGeometry(0.022, 6, 4), horn, k * 0.045, -0.235, 0.085, leg).castShadow = false;
      void foot; return leg;
    });
    // the tail: short and tapering, with a wag
    const tailPts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; tailPts.push(new THREE.Vector3(0, 0.02 - t * 0.12, -0.32 - t * 0.34)); }
    const tail = this.tail = new THREE.Group(); tail.position.set(0, 0, 0); body.add(tail);
    const tailGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts), 16, 0.08, 10);
    // (taper it)
    const tp = tailGeo.attributes.position; for (let i = 0; i < tp.count; i++) { const z = tp.getZ(i), t = Math.min(1, Math.max(0, (-z - 0.32) / 0.34)), k = 1 - t * 0.8; tp.setX(i, tp.getX(i) * k); tp.setY(i, (tp.getY(i) - (0.02 - t * 0.12)) * k + (0.02 - t * 0.12)); }
    tailGeo.computeVertexNormals(); add(tailGeo, skin, 0, 0, 0, tail);

    // the head: big and round for a baby, with the frill behind it, a beak and three horns
    const head = this.head = new THREE.Group(); head.position.set(0, 0.12, 0.34); body.add(head);
    add(new THREE.SphereGeometry(0.21, 20, 14), skin, 0, 0, 0.02, head).scale.set(1, 0.95, 1.05);
    add(new THREE.SphereGeometry(0.13, 14, 10), skin, 0, -0.06, 0.17, head).scale.set(0.9, 0.75, 1);
    const beak = add(new THREE.ConeGeometry(0.07, 0.14, 10), horn, 0, -0.07, 0.3, head); beak.rotation.x = Math.PI / 2;
    // (the frill: a fan of plate round the back of the head, with knobs round its rim)
    const frill = this.frill = new THREE.Group(); frill.position.set(0, 0.08, -0.1); frill.rotation.x = -0.5; head.add(frill);
    add(new THREE.CylinderGeometry(0.3, 0.3, 0.035, 24, 1, false, -Math.PI * 0.62, Math.PI * 1.24), frillM, 0, 0, 0, frill).rotation.x = Math.PI / 2;
    for (let k = 0; k < 9; k++) { const a = -Math.PI * 0.55 + k / 8 * Math.PI * 1.1; add(new THREE.SphereGeometry(0.035, 8, 6), horn, Math.sin(a) * 0.3, Math.cos(a) * 0.3, -0.01, frill); }
    // (two brow horns and a nose nub, just buds on a baby)
    this.horns = [];
    for (const sx of [-1, 1]) { const h = add(new THREE.ConeGeometry(0.035, 0.12, 8), horn, sx * 0.09, 0.17, 0.1, head); h.rotation.x = 0.5; h.rotation.z = -sx * 0.25; this.horns.push(h); }
    const nose = add(new THREE.ConeGeometry(0.03, 0.07, 8), horn, 0, 0.02, 0.26, head); nose.rotation.x = 0.35; this.horns.push(nose);
    // big eyes with a shine in each
    this.eyes = [-1, 1].map(sx => {
      const e = new THREE.Group(); e.position.set(sx * 0.12, 0.05, 0.13); head.add(e);
      add(new THREE.SphereGeometry(0.065, 14, 10), white, 0, 0, 0, e).castShadow = false;
      const pupil = add(new THREE.SphereGeometry(0.042, 12, 8), dark, sx * 0.012, 0, 0.035, e); pupil.castShadow = false;
      add(new THREE.SphereGeometry(0.014, 6, 4), white, sx * 0.02 + 0.012, 0.022, 0.07, e).castShadow = false;
      return { e, pupil, ph: Math.random() * 6 };
    });
    // the mouth, which opens for a honk
    const jaw = this.jaw = new THREE.Group(); jaw.position.set(0, -0.11, 0.12); head.add(jaw);
    add(new THREE.SphereGeometry(0.1, 12, 8), belly, 0, 0, 0.06, jaw).scale.set(0.9, 0.45, 1.1);
    // cheeks that blush with the frill
    this.cheeks = [-1, 1].map(sx => add(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff8aa8, roughness: 0.8, transparent: true, opacity: 0 }), sx * 0.16, -0.04, 0.12, head));
    for (const c of this.cheeks) c.castShadow = false;

    this.pos = g.position;
    this.mode = "Idle"; this.t = Math.random() * 6; this.speedT = 0; this.talking = false; this.dance = 0; this.happy = 0; this.honkT = 0;
    this.size = 1; this.grow(size, true);
  }
  // how big she is: 1 when she hatches, growing a little each era (she's rideable at about 2.2)
  grow(size, now) { this.sizeTarget = size; if (now) { this.size = size; this.root.scale.setScalar(size); } }
  // her frill flushes pink and she purrs when she's pleased
  cheer(t = 2) { this.happy = Math.max(this.happy, t); }
  honk() { this.honkT = 0.35; }
  play(name) { this.mode = name; if (name === "Dance") { this.dance = 1; this.cheer(3); } }
  walkTo(x, z, speed, dt) {
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.1) { const step = Math.min(d, speed * dt); this.pos.x += dx / d * step; this.pos.z += dz / d * step; const want = Math.atan2(dx, dz); let r = want - this.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); this.root.rotation.y += r * Math.min(1, dt * 8); this.speedT = speed; }
    return d;
  }
  update(dt) {
    this.t += dt;
    const t = this.t, m = this.mode;
    // growing is slow and smooth
    if (Math.abs(this.sizeTarget - this.size) > 1e-3) { this.size += (this.sizeTarget - this.size) * Math.min(1, dt * 0.8); this.root.scale.setScalar(this.size); }
    // moving: a trotting waddle; still: breathing
    const moving = m === "Walking" || m === "Running" || m === "Charge", run = m === "Running" || m === "Charge";
    const ph = t * (run ? 15 : 9);
    this.legs.forEach((leg, i) => { const sw = moving ? Math.sin(ph + (i % 2 ? Math.PI : 0) + (i < 2 ? 0 : Math.PI)) * (run ? 0.75 : 0.5) : 0; leg.rotation.x += (sw - leg.rotation.x) * Math.min(1, dt * 12); });
    this.body.position.y = 0.36 + (moving ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(t * 2.2) * 0.008) + (m === "Jump" ? 0.25 : 0);
    this.body.rotation.z += ((moving ? Math.sin(ph) * 0.07 : 0) - this.body.rotation.z) * Math.min(1, dt * 8);
    // charging: head down, horns first
    const charge = m === "Charge" ? 0.35 : 0, sniff = m === "Sniff" ? 0.55 : 0;
    this.body.rotation.x += ((charge ? 0.12 : 0) - this.body.rotation.x) * Math.min(1, dt * 8);
    // the tail wags more the happier she is
    const wag = this.happy > 0 || this.dance > 0 ? 0.55 : moving ? 0.3 : 0.12;
    this.tail.rotation.y = Math.sin(t * (this.happy > 0 ? 12 : moving ? 7 : 2)) * wag;
    // dancing: a happy bounce and a spin of the head
    if (this.dance > 0) { this.dance -= dt * 0.35; this.body.rotation.y = Math.sin(t * 8) * 0.3; this.body.position.y += Math.abs(Math.sin(t * 8)) * 0.1; if (this.dance <= 0) this.mode = "Idle"; } else this.body.rotation.y *= 0.8;
    // yes and no with the head; sniffing with it down at the ground, snuffling
    const nod = m === "Yes" ? Math.sin(t * 10) * 0.25 : 0, shake = m === "No" ? Math.sin(t * 10) * 0.35 : 0;
    const down = charge + sniff + (sniff ? Math.sin(t * 16) * 0.05 : 0);
    this.head.rotation.x += (nod + down - 0.05 - this.head.rotation.x) * Math.min(1, dt * 8);
    this.head.rotation.y += (shake + (sniff ? Math.sin(t * 3) * 0.3 : 0) - this.head.rotation.y) * Math.min(1, dt * 8);
    if (m === "Sitting") { this.body.position.y = 0.26; this.legs.forEach((l, i) => { l.rotation.x = i < 2 ? -0.9 : 1.2; }); }
    if (m === "Wave") { this.legs[1].rotation.x += (-1.6 - this.legs[1].rotation.x) * Math.min(1, dt * 8); }
    // the eyes look about and blink
    for (const e of this.eyes) { e.pupil.position.x = Math.sin(t * 0.6 + e.ph) * 0.012; const blink = Math.sin(t * 0.8 + e.ph) > 0.985; e.e.scale.y = blink ? 0.15 : 1; }
    // honking and talking open the jaw
    this.honkT = Math.max(0, this.honkT - dt);
    const open = this.honkT > 0 ? 0.5 : this.talking ? Math.abs(Math.sin(t * 12)) * 0.35 : 0;
    this.jaw.rotation.x += (open - this.jaw.rotation.x) * Math.min(1, dt * 14);
    // a happy blush on the frill and the cheeks
    this.happy = Math.max(0, this.happy - dt);
    const glow = Math.min(1, this.happy);
    this.frillM.emissiveIntensity += (glow * 0.6 - this.frillM.emissiveIntensity) * Math.min(1, dt * 4);
    for (const c of this.cheeks) c.material.opacity += (glow * 0.9 - c.material.opacity) * Math.min(1, dt * 4);
  }
}
