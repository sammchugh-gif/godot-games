// The big dinosaurs, built from simple shapes. Rex is the T. rex that guards the valley: it has
// the same little API as a robot guard (root, pos, play(name), update(dt)) so a stealth mission can
// use it in a guard's place. It "sleeps with one eye open": standing, its head swings slowly
// round, and wherever it's looking is where you mustn't be.
import * as THREE from "three";

export class Rex {
  constructor(height = 4.2) {
    const g = this.root = new THREE.Group(), k = height / 4.2;
    const skin = new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 0.8 }), belly = new THREE.MeshStandardMaterial({ color: 0xa8a070, roughness: 0.85 });
    const stripe = new THREE.MeshStandardMaterial({ color: 0x3a4a2a, roughness: 0.8 }), tooth = new THREE.MeshStandardMaterial({ color: 0xf4f0e0, roughness: 0.4 });
    const eyeM = this.eyeM = new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb020, emissiveIntensity: 1.2, roughness: 0.3 });
    const add = (geo, m, x, y, z, p = g) => { const me = new THREE.Mesh(geo, m); me.position.set(x * k, y * k, z * k); me.castShadow = true; p.add(me); return me; };
    const body = this.body = new THREE.Group(); g.add(body);
    add(new THREE.SphereGeometry(1.1, 18, 12), skin, 0, 2.5, 0, body).scale.set(0.95, 1, 1.5);
    add(new THREE.SphereGeometry(0.9, 16, 10), belly, 0, 2.2, 0.3, body).scale.set(0.8, 0.8, 1.2);
    for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(1.6, 0.12, 0.25), stripe, 0, 3.15, -0.6 + i * 0.4, body).rotation.x = 0.1;
    // the neck and the great head, with a jaw that can open
    const head = this.head = new THREE.Group(); head.position.set(0, 3.3 * k, 1.6 * k); body.add(head);
    add(new THREE.CylinderGeometry(0.55, 0.7, 1.0, 12), skin, 0, -0.1, -0.35, head).rotation.x = 1.1;
    add(new THREE.BoxGeometry(0.9, 0.7, 1.4), skin, 0, 0.35, 0.55, head);
    const jaw = this.jaw = new THREE.Group(); jaw.position.set(0, 0.05 * k, 0.1 * k); head.add(jaw);
    add(new THREE.BoxGeometry(0.8, 0.3, 1.25), belly, 0, -0.15, 0.55, jaw);
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.05, 0.16, 5), tooth, s * 0.36, 0.05, 0.1 + i * 0.2, head).rotation.x = Math.PI; }
    this.eyes = [-1, 1].map(s => add(new THREE.SphereGeometry(0.1, 10, 8), eyeM, s * 0.44, 0.55, 0.5, head));
    // the little arms, the big legs and the tail that balances it all
    for (const s of [-1, 1]) { const a = add(new THREE.CylinderGeometry(0.07, 0.06, 0.55, 6), skin, s * 0.75, 2.4, 1.3, body); a.rotation.x = 1.0; }
    this.legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * 0.65 * k, 2.2 * k, -0.2 * k); g.add(l); add(new THREE.CylinderGeometry(0.4, 0.3, 1.4, 10), skin, 0, -0.5, 0, l); add(new THREE.CylinderGeometry(0.2, 0.24, 1.0, 8), skin, 0, -1.5, 0.2, l); add(new THREE.BoxGeometry(0.5, 0.18, 0.8), skin, 0, -2.1, 0.35, l); return l; });
    const tail = this.tail = new THREE.Group(); tail.position.set(0, 2.6 * k, -1.4 * k); body.add(tail);
    add(new THREE.ConeGeometry(0.75, 3.2, 12), skin, 0, 0, -1.4, tail).rotation.x = -Math.PI / 2 - 0.12;
    g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
    this.pos = g.position; this.mode = "Idle"; this.t = Math.random() * 6; this.height = height;
  }
  play(name) { this.mode = name; }
  update(dt) {
    this.t += dt;
    const t = this.t, walk = this.mode === "Walking" || this.mode === "Running";
    const ph = t * (this.mode === "Running" ? 7 : 3.5);
    this.legs.forEach((l, i) => { l.rotation.x = walk ? Math.sin(ph + i * Math.PI) * 0.45 : 0; });
    this.body.position.y = walk ? Math.abs(Math.sin(ph)) * 0.08 : Math.sin(t * 0.8) * 0.04; // (asleep on its feet: slow breaths)
    this.tail.rotation.y = Math.sin(t * (walk ? 3.5 : 0.7)) * 0.2;
    this.jaw.rotation.x = this.mode === "Roar" ? 0.6 : Math.max(0, Math.sin(t * 0.5)) * 0.08;
    // one eye open: the glow pulses as it looks
    this.eyeM.emissiveIntensity = 0.9 + Math.sin(t * 3) * 0.3;
  }
}
