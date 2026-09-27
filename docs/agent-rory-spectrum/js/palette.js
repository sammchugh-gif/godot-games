// PALETTE: Rory's partner, a chameleon robot built from simple shapes. Her skin
// is whatever colour she feels like, she walks, runs, waves, dances, and in a
// sneak she fades to nearly nothing. Same little API as the old robots: root,
// pos, play(name), update(dt), walkTo(x, z, speed, dt).
import * as THREE from "three";

const clamp = THREE.MathUtils.clamp;

export class Palette {
  constructor(height = 0.9) {
    const g = this.root = new THREE.Group();
    const s = height / 0.9; this.s = s;
    const skin = this.skin = new THREE.MeshPhysicalMaterial({ color: 0x5ad86a, roughness: 0.35, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.2, emissive: 0x2a8a3a, emissiveIntensity: 0.25, transparent: true, opacity: 1 });
    const belly = this.belly = new THREE.MeshStandardMaterial({ color: 0xf4f0d0, roughness: 0.6, transparent: true, opacity: 1 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 1 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 1 });
    this.mats = [skin, belly, dark, white];
    const add = (geo, m, x, y, z, parent = g) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };
    // the body, arched, on four stubby legs
    const body = this.body = new THREE.Group(); body.position.y = 0.42 * s; g.add(body);
    const torso = add(new THREE.CapsuleGeometry(0.2 * s, 0.5 * s, 6, 16), skin, 0, 0, 0, body); torso.rotation.x = Math.PI / 2; torso.scale.set(1, 1.15, 1);
    const tummy = add(new THREE.CapsuleGeometry(0.15 * s, 0.4 * s, 6, 12), belly, 0, -0.09 * s, 0, body); tummy.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const sp = add(new THREE.ConeGeometry(0.045 * s, 0.09 * s, 6), skin, 0, 0.21 * s, (0.22 - i * 0.09) * s, body); void sp; }
    this.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const leg = new THREE.Group(); leg.position.set(sx * 0.16 * s, -0.1 * s, sz * 0.2 * s); body.add(leg);
      add(new THREE.CylinderGeometry(0.045 * s, 0.05 * s, 0.3 * s, 8), skin, 0, -0.15 * s, 0, leg);
      const foot = add(new THREE.SphereGeometry(0.06 * s, 8, 6), dark, 0, -0.3 * s, 0.02 * s, leg); foot.scale.set(1.2, 0.6, 1.4);
      return leg;
    });
    // the tail: a spiral behind
    const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * Math.PI * 2.4; const r = 0.16 * s * (1 - t * 0.85); pts.push(new THREE.Vector3(0, -0.05 * s - Math.sin(a) * r * 0.9 + t * 0.02 * s, -0.3 * s - t * 0.28 * s + (1 - Math.cos(a)) * r)); }
    const tail = this.tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.045 * s, 8), skin); tail.castShadow = true; body.add(tail);
    // the head: big turret eyes, a crest, a grin
    const head = this.head = new THREE.Group(); head.position.set(0, 0.06 * s, 0.38 * s); body.add(head);
    add(new THREE.SphereGeometry(0.17 * s, 18, 12), skin, 0, 0, 0, head).scale.set(1, 0.9, 1.15);
    add(new THREE.ConeGeometry(0.06 * s, 0.16 * s, 6), skin, 0, 0.17 * s, -0.04 * s, head);
    add(new THREE.ConeGeometry(0.04 * s, 0.1 * s, 6), skin, 0, 0.13 * s, 0.08 * s, head);
    this.eyes = [-1, 1].map(sx => {
      const e = new THREE.Group(); e.position.set(sx * 0.13 * s, 0.05 * s, 0.06 * s); head.add(e);
      add(new THREE.SphereGeometry(0.085 * s, 12, 10), skin, 0, 0, 0, e);
      const ball = new THREE.Group(); e.add(ball);
      add(new THREE.SphereGeometry(0.06 * s, 12, 10), white, sx * 0.03 * s, 0, 0.03 * s, ball).castShadow = false;
      add(new THREE.SphereGeometry(0.028 * s, 8, 6), dark, sx * 0.05 * s, 0, 0.07 * s, ball).castShadow = false;
      return { e, ball, ph: Math.random() * 6 };
    });
    const mouth = this.mouth = add(new THREE.TorusGeometry(0.07 * s, 0.012 * s, 6, 12, Math.PI), dark, 0, -0.06 * s, 0.16 * s, head); mouth.rotation.z = Math.PI; mouth.castShadow = false;
    const tongue = this.tongue = add(new THREE.CapsuleGeometry(0.02 * s, 0.3 * s, 4, 8), new THREE.MeshStandardMaterial({ color: 0xff6a8a, roughness: 0.5, transparent: true }), 0, -0.05 * s, 0.32 * s, head); tongue.rotation.x = Math.PI / 2; tongue.visible = false;
    // a glowing bead on the crest that the bloom picks up
    this.light = add(new THREE.SphereGeometry(0.03 * s, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3, transparent: true }), 0, 0.26 * s, -0.04 * s, head);
    this.mats.push(this.light.material, tongue.material);
    this.pos = g.position;
    this.hue = 0.33; this.hueTarget = 0.33; this.mode = "Idle"; this.t = Math.random() * 6; this.speedT = 0; this.hidden = 0; this.hideTarget = 0; this.height = height;
    this.talking = false; this.dance = 0;
  }
  // any colour she likes: a hue 0..1, or "rainbow" to cycle
  setHue(h) { this.hueTarget = h; }
  hide(on) { this.hideTarget = on ? 1 : 0; }
  play(name) { this.mode = name; if (name === "Dance") this.dance = 1; }
  walkTo(x, z, speed, dt) {
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.1) { const step = Math.min(d, speed * dt); this.pos.x += dx / d * step; this.pos.z += dz / d * step; const want = Math.atan2(dx, dz); let r = want - this.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); this.root.rotation.y += r * Math.min(1, dt * 8); this.speedT = speed; }
    return d;
  }
  update(dt) {
    this.t += dt;
    const t = this.t, s = this.s, m = this.mode;
    // her colour drifts to what she wants, and cycles when she's dancing
    if (this.hueTarget === "rainbow" || this.dance > 0) this.hue = (this.hue + dt * (this.dance > 0 ? 0.6 : 0.15)) % 1;
    else { let d = this.hueTarget - this.hue; d -= Math.round(d); this.hue = (this.hue + d * Math.min(1, dt * 1.5) + 1) % 1; }
    this.skin.color.setHSL(this.hue, 0.75, 0.55); this.skin.emissive.setHSL(this.hue, 0.8, 0.3);
    this.light.material.emissive.setHSL((this.hue + 0.1) % 1, 0.8, 0.7);
    // fading out for a sneak
    this.hidden += (this.hideTarget - this.hidden) * Math.min(1, dt * 2);
    const op = 1 - this.hidden * 0.88;
    for (const mt of this.mats) { mt.opacity = op; mt.depthWrite = op > 0.5; }
    // moving: legs swing, body sways; still: breathing, eyes wander
    const moving = m === "Walking" || m === "Running", run = m === "Running";
    const ph = t * (run ? 14 : 8);
    this.legs.forEach((leg, i) => { const sw = moving ? Math.sin(ph + (i % 2 ? Math.PI : 0) + (i < 2 ? 0 : Math.PI / 2)) * (run ? 0.7 : 0.45) : 0; leg.rotation.x += (sw - leg.rotation.x) * Math.min(1, dt * 12); });
    this.body.position.y = 0.42 * s + (moving ? Math.abs(Math.sin(ph)) * 0.03 * s : Math.sin(t * 2) * 0.008 * s) + (m === "Jump" ? 0.3 * s : 0);
    this.body.rotation.z += ((moving ? Math.sin(ph) * 0.06 : 0) - this.body.rotation.z) * Math.min(1, dt * 8);
    this.tail.rotation.y = Math.sin(t * (moving ? 6 : 1.5)) * (moving ? 0.25 : 0.12);
    // dancing: a wiggle all over; waving: one front leg up; yes and no with the head
    if (this.dance > 0) { this.dance -= dt * 0.35; this.body.rotation.y = Math.sin(t * 9) * 0.35; this.body.position.y += Math.abs(Math.sin(t * 9)) * 0.08 * s; if (this.dance <= 0) this.mode = "Idle"; } else this.body.rotation.y *= 0.8;
    if (m === "Wave") { this.legs[1].rotation.x += (-2.2 - this.legs[1].rotation.x) * Math.min(1, dt * 8); this.legs[1].rotation.z = Math.sin(t * 10) * 0.3; }
    else this.legs[1].rotation.z *= 0.8;
    const nod = m === "Yes" ? Math.sin(t * 10) * 0.2 : 0, shake = m === "No" ? Math.sin(t * 10) * 0.3 : 0;
    this.head.rotation.x += (nod - 0.1 - this.head.rotation.x) * Math.min(1, dt * 8); this.head.rotation.y += (shake - this.head.rotation.y) * Math.min(1, dt * 8);
    if (m === "Sitting") { this.body.position.y = 0.3 * s; this.legs.forEach(l => { l.rotation.x = 1.2; }); }
    // the eyes wander on their own, each its own way
    for (const e of this.eyes) { e.ball.rotation.y = Math.sin(t * 0.9 + e.ph) * 0.5; e.ball.rotation.x = Math.cos(t * 0.7 + e.ph * 1.3) * 0.3; const blink = Math.sin(t * 0.8 + e.ph) > 0.985; e.e.scale.y = blink ? 0.2 : 1; }
    // talking: the mouth works, and now and then the tongue flicks
    this.mouth.scale.y = this.talking ? 1 + Math.abs(Math.sin(t * 14)) * 1.2 : 1;
    this.tongue.visible = Math.sin(t * 0.37) > 0.995 && !this.talking; if (this.tongue.visible) this.tongue.scale.z = 0.5 + Math.abs(Math.sin(t * 30)) * 0.8;
  }
}
