// People built from smooth shapes, with a small rig (hips, spine, head, arms,
// legs) that the walk, run, jump, float, wave and talk poses drive.
import * as THREE from "three";

const cache = new Map();
function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1 }));
  return cache.get(key);
}
function mesh(geo, m, x = 0, y = 0, z = 0, parent) {
  const me = new THREE.Mesh(geo, m);
  me.position.set(x, y, z);
  me.castShadow = true; me.receiveShadow = false;
  if (parent) parent.add(me);
  return me;
}
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);
const sphere = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);

export const RORY = { skin: 0xf3cfae, hair: 0x6b4423, eyes: 0x3b5f8a, coat: 0x16324f, trousers: 0x1a1f2a, shirt: 0xf4f6fa, tie: 0x0e1a2c, shoes: 0x0c0c10, kid: true, earpiece: true, watch: true, hairStyle: "rory" };

// o: skin hair eyes coat trousers shirt tie shoes kid hairStyle hat glasses beard moustache crown dress
export function makePerson(o = {}) {
  const kid = !!o.kid;
  const S = kid ? { leg: 0.56, torso: 0.3, headR: 0.2, sh: 0.23, armR: 0.058, legR: 0.08, bodyR: 0.18 }
                : { leg: 0.86, torso: 0.46, headR: 0.155, sh: 0.26, armR: 0.065, legR: 0.09, bodyR: 0.2 };
  if (o.big) { S.bodyR *= 1.25; S.sh *= 1.1; }
  const root = new THREE.Group(); root.name = "person";
  const rig = { root, S, o };
  const skin = mat(o.skin ?? 0xe8c0a0, { rough: 0.55 });
  const coat = mat(o.coat ?? 0x3a4a6a, { rough: 0.75 });
  const trousers = mat(o.trousers ?? 0x22262e, { rough: 0.8 });
  const shoes = mat(o.shoes ?? 0x1a1a1a, { rough: 0.35, metal: 0.1 });
  const hairM = mat(o.hair ?? 0x3a2a1a, { rough: 0.85 });
  // hips
  const hips = rig.hips = new THREE.Group(); hips.position.y = S.leg; root.add(hips);
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * S.bodyR * 0.5, 0, 0); hips.add(leg);
    const upper = mesh(capsule(S.legR, S.leg * 0.42), o.dress ? coat : trousers, 0, -S.leg * 0.26, 0, leg);
    const knee = new THREE.Group(); knee.position.y = -S.leg * 0.5; leg.add(knee);
    mesh(capsule(S.legR * 0.9, S.leg * 0.4), o.dress ? skin : trousers, 0, -S.leg * 0.22, 0, knee);
    const shoe = mesh(sphere(S.legR * 1.3, 14, 10), shoes, 0, -S.leg * 0.47, S.legR * 0.7, knee); shoe.scale.set(1, 0.6, 1.7);
    rig[side < 0 ? "legL" : "legR"] = leg; rig[side < 0 ? "kneeL" : "kneeR"] = knee;
    void upper;
  }
  if (o.dress) { const d = mesh(new THREE.CylinderGeometry(S.bodyR * 0.9, S.bodyR * 1.8, S.leg * 0.55, 18), coat, 0, -S.leg * 0.2, 0, hips); d.castShadow = true; }
  // spine and torso
  const spine = rig.spine = new THREE.Group(); spine.position.y = 0.02; hips.add(spine);
  const torso = mesh(capsule(S.bodyR, S.torso * 0.75), coat, 0, S.torso * 0.5, 0, spine); torso.scale.set(1.05, 1, 0.78);
  if (o.shirt !== undefined || !o.dress) {
    const shirt = mesh(new THREE.CircleGeometry(S.bodyR * 0.5, 3), mat(o.shirt ?? 0xf0f0f0, { rough: 0.6 }), 0, S.torso * 0.78, S.bodyR * 0.8, spine);
    shirt.rotation.z = Math.PI / 2 * 3; shirt.scale.set(1.15, 0.7, 1); shirt.rotation.x = -0.12; shirt.castShadow = false;
    if (o.tie !== undefined && o.tie !== null) { const t = mesh(new THREE.BoxGeometry(S.bodyR * 0.16, S.torso * 0.45, 0.02), mat(o.tie, { rough: 0.4 }), 0, S.torso * 0.58, S.bodyR * 0.8, spine); t.rotation.x = -0.1; }
  }
  if (o.belt) mesh(new THREE.TorusGeometry(S.bodyR * 0.95, 0.025, 6, 20), mat(o.belt, { rough: 0.4 }), 0, 0.06, 0, spine).rotation.x = Math.PI / 2;
  // arms
  const shY = S.torso * 0.95;
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * S.sh, shY, 0); spine.add(arm);
    mesh(sphere(S.armR * 1.35, 12, 10), coat, 0, 0, 0, arm);
    mesh(capsule(S.armR, S.leg * 0.26), coat, 0, -S.leg * 0.18, 0, arm);
    const elbow = new THREE.Group(); elbow.position.y = -S.leg * 0.36; arm.add(elbow);
    mesh(capsule(S.armR * 0.9, S.leg * 0.22), coat, 0, -S.leg * 0.14, 0, elbow);
    const hand = mesh(sphere(S.armR * 1.15, 12, 10), skin, 0, -S.leg * 0.32, 0, elbow);
    arm.rotation.z = side * 0.12;
    rig[side < 0 ? "armL" : "armR"] = arm; rig[side < 0 ? "elbowL" : "elbowR"] = elbow; rig[side < 0 ? "handL" : "handR"] = hand;
  }
  if (o.watch) { const w = mesh(new THREE.BoxGeometry(0.06, 0.03, 0.05), mat(0x2a2f38, { metal: 0.8, rough: 0.3 }), 0, -S.leg * 0.26, 0, rig.elbowL); mesh(new THREE.BoxGeometry(0.045, 0.012, 0.04), mat(0x7fe3ff, { emissive: 0x7fe3ff, ei: 3 }), 0, -0.012, 0, w).position.set(0, 0, 0.022); w.rotation.x = Math.PI / 2; w.position.set(0, -S.leg * 0.26, 0.03); rig.watch = w; }
  // neck and head
  const neck = rig.neck = new THREE.Group(); neck.position.y = S.torso + S.bodyR * 0.55; spine.add(neck);
  mesh(new THREE.CylinderGeometry(S.headR * 0.32, S.headR * 0.38, S.headR * 0.5, 10), skin, 0, S.headR * 0.1, 0, neck);
  const head = rig.head = new THREE.Group(); head.position.y = S.headR * 1.05; neck.add(head);
  const skull = mesh(sphere(S.headR, 28, 20), skin, 0, 0, 0, head); skull.scale.set(1, 1.02, 0.98);
  const r = S.headR;
  // face
  rig.eyes = [];
  const white = mat(0xffffff, { rough: 0.3 }), iris = mat(o.eyes ?? 0x3a2a1a, { rough: 0.3 }), black = mat(0x0a0a0a, { rough: 0.2 });
  for (const side of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(side * r * 0.36, r * 0.07, r * 0.86); head.add(eg); rig.eyes.push(eg);
    const e = mesh(sphere(r * 0.2, 14, 10), white, 0, 0, 0, eg); e.scale.set(1, 1.2, 0.6); e.castShadow = false;
    const ir = mesh(sphere(r * 0.12, 12, 8), iris, 0, -r * 0.01, r * 0.11, eg); ir.scale.set(1, 1.1, 0.5); ir.castShadow = false;
    const p = mesh(sphere(r * 0.065, 10, 8), black, 0, -r * 0.01, r * 0.15, eg); p.scale.set(1, 1.1, 0.5); p.castShadow = false;
    const hl = mesh(sphere(r * 0.028, 8, 6), mat(0xffffff, { emissive: 0xffffff, ei: 0.6 }), r * 0.04, r * 0.04, r * 0.17, eg); hl.castShadow = false;
    const brow = mesh(new THREE.BoxGeometry(r * 0.3, r * 0.06, r * 0.06), hairM, side * r * 0.36, r * 0.34, r * 0.9, head); brow.rotation.z = -side * (o.stern ? -0.25 : 0.1); brow.castShadow = false;
    rig[side < 0 ? "browL" : "browR"] = brow;
    const ear = mesh(sphere(r * 0.2, 10, 8), skin, side * r * 0.98, r * 0.02, 0, head); ear.scale.set(0.5, 1, 0.8);
  }
  mesh(sphere(r * 0.12, 10, 8), skin, 0, -r * 0.1, r * 0.98, head).scale.set(0.9, 0.8, 0.8);
  const mouth = rig.mouth = mesh(new THREE.TorusGeometry(r * 0.2, r * 0.035, 6, 14, Math.PI), mat(0x8a2a2a, { rough: 0.5 }), 0, -r * 0.34, r * 0.9, head);
  mouth.rotation.z = Math.PI; mouth.rotation.x = -0.25; mouth.castShadow = false;
  if (o.moustache !== undefined) { for (const side of [-1, 1]) { const m = mesh(sphere(r * 0.14, 10, 8), mat(o.moustache, { rough: 0.9 }), side * r * 0.14, -r * 0.23, r * 0.93, head); m.scale.set(1.4, 0.55, 0.6); m.rotation.z = side * 0.3; } }
  if (o.beard !== undefined) { const b = mesh(sphere(r * 0.6, 16, 12), mat(o.beard, { rough: 0.95 }), 0, -r * 0.55, r * 0.45, head); b.scale.set(1.1, 0.9, 0.8); }
  if (o.glasses) { const gm = mat(o.glasses === true ? 0x1a1a1a : o.glasses, { metal: 0.6, rough: 0.3 }); for (const side of [-1, 1]) { const ring = mesh(new THREE.TorusGeometry(r * 0.2, r * 0.03, 6, 16), gm, side * r * 0.36, r * 0.07, r * 1.02, head); ring.castShadow = false; } mesh(new THREE.BoxGeometry(r * 0.25, r * 0.03, r * 0.03), gm, 0, r * 0.1, r * 1.03, head); }
  // hair
  hair(head, r, o.hairStyle || (kid ? "short" : "short"), hairM);
  if (o.earpiece) { const ep = mesh(sphere(r * 0.09, 10, 8), mat(0x7fe3ff, { emissive: 0x7fe3ff, ei: 2.5 }), r * 1.02, 0, r * 0.1, head); ep.castShadow = false; }
  if (o.hat) hat(head, r, o.hat, o.hatColor);
  root.traverse(n => { if (n.isMesh) n.userData.person = true; });
  rig.phase = Math.random() * 6; rig.blink = 2 + Math.random() * 3; rig.talk = 0; rig.wave = 0;
  return rig;
}

function hair(head, r, style, m) {
  if (style === "bald") return;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 26, 16, 0, Math.PI * 2, 0, style === "long" ? 1.9 : 1.35), m);
  cap.rotation.x = -0.28; cap.position.set(0, r * 0.06, -r * 0.04); cap.castShadow = true; head.add(cap);
  if (style === "rory" || style === "short" || style === "spiky") {
    // a side-swept fringe
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(r * 0.26, 10, 8), m);
      f.position.set(-r * 0.45 + i * r * 0.22, r * 0.62 - Math.abs(i - 1.5) * r * 0.04, r * 0.62); f.scale.set(1, 0.55, 0.8); f.rotation.z = -0.5;
      if (style === "spiky") { f.scale.set(0.6, 1.3, 0.6); f.position.y += r * 0.2; }
      head.add(f);
    }
    if (style === "rory") { const tuft = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.4, 8), m); tuft.position.set(r * 0.15, r * 1.05, -r * 0.1); tuft.rotation.set(-0.5, 0, -0.3); head.add(tuft); }
  }
  if (style === "long" || style === "ponytail" || style === "bun" || style === "pigtails") {
    if (style === "long") { const back = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.75, r * 1.1, 6, 12), m); back.position.set(0, -r * 0.55, -r * 0.45); back.scale.set(1.2, 1, 0.55); head.add(back); }
    if (style === "ponytail") { const pt = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.2, r * 0.9, 6, 10), m); pt.position.set(0, -r * 0.1, -r * 1.1); pt.rotation.x = 0.5; head.add(pt); }
    if (style === "bun") { const b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.38, 12, 10), m); b.position.set(0, r * 0.75, -r * 0.6); head.add(b); }
    if (style === "pigtails") for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.16, r * 0.6, 6, 10), m); b.position.set(s * r * 1.05, -r * 0.2, -r * 0.2); b.rotation.z = s * 0.3; head.add(b); }
  }
  if (style === "curly") for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 8, 6), m); c.position.set(Math.cos(a) * r * 0.85, r * 0.45 + Math.sin(i * 1.7) * r * 0.15, Math.sin(a) * r * 0.85 - r * 0.1); head.add(c); }
}

function hat(head, r, kind, color) {
  const m = mat(color ?? 0x1a1a1a, { rough: 0.6, metal: kind === "crown" ? 0.9 : 0 });
  const add = (g, x, y, z) => { const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; head.add(me); return me; };
  if (kind === "cap") { add(new THREE.SphereGeometry(r * 1.08, 20, 10, 0, Math.PI * 2, 0, 1.4), 0, r * 0.1, 0); add(new THREE.BoxGeometry(r * 1.2, r * 0.06, r * 0.8), 0, r * 0.45, r * 0.9).rotation.x = 0.15; }
  if (kind === "helmet") { const h = add(new THREE.SphereGeometry(r * 1.18, 22, 14, 0, Math.PI * 2, 0, 1.7), 0, r * 0.05, 0); h.material = mat(color ?? 0xf4f4f4, { rough: 0.2, metal: 0.3 }); }
  if (kind === "top") { add(new THREE.CylinderGeometry(r * 0.7, r * 0.7, r * 1.2, 18), 0, r * 1.3, 0); add(new THREE.CylinderGeometry(r * 1.2, r * 1.2, r * 0.06, 20), 0, r * 0.72, 0); }
  if (kind === "crown") { add(new THREE.CylinderGeometry(r * 0.8, r * 0.75, r * 0.45, 16, 1, true), 0, r * 0.95, 0); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new THREE.ConeGeometry(r * 0.1, r * 0.3, 6), Math.cos(a) * r * 0.78, r * 1.3, Math.sin(a) * r * 0.78); } }
  if (kind === "beret") { const b = add(new THREE.SphereGeometry(r * 1.05, 18, 10), -r * 0.1, r * 0.7, 0); b.scale.set(1.1, 0.35, 1.1); }
  if (kind === "hardhat") { add(new THREE.SphereGeometry(r * 1.1, 18, 10, 0, Math.PI * 2, 0, 1.45), 0, r * 0.2, 0).material = mat(color ?? 0xffc020, { rough: 0.3 }); add(new THREE.CylinderGeometry(r * 1.3, r * 1.3, r * 0.05, 20), 0, r * 0.35, 0).material = mat(color ?? 0xffc020, { rough: 0.3 }); }
  if (kind === "chef") { const c = add(new THREE.CylinderGeometry(r * 0.8, r * 0.75, r * 0.9, 16), 0, r * 1.1, 0); c.material = mat(0xffffff); const t = add(new THREE.SphereGeometry(r * 0.9, 14, 10), 0, r * 1.6, 0); t.material = mat(0xffffff); t.scale.y = 0.6; }
  if (kind === "straw") { add(new THREE.CylinderGeometry(r * 1.6, r * 1.6, r * 0.05, 22), 0, r * 0.6, 0).material = mat(0xe8c870, { rough: 0.9 }); add(new THREE.CylinderGeometry(r * 0.75, r * 0.8, r * 0.45, 16), 0, r * 0.82, 0).material = mat(0xe8c870, { rough: 0.9 }); }
}

// pose the rig. s: { speed, grounded, vy, float, talk, wave, sit, dt }
export function animatePerson(rig, s) {
  const dt = s.dt || 0.016;
  const sp = Math.min(s.speed || 0, 9);
  rig.phase += dt * (3 + sp * 2.1);
  const p = rig.phase;
  const run = Math.min(1, sp / 5);
  const walk = Math.min(1, sp / 1.2);
  const k = 1 - Math.exp(-dt * 14);
  const set = (o, x, y, z) => { o.rotation.x += (x - o.rotation.x) * k; if (y !== undefined) o.rotation.y += (y - o.rotation.y) * k; if (z !== undefined) o.rotation.z += (z - o.rotation.z) * k; };
  let legA = Math.sin(p) * (0.5 + run * 0.4) * walk, armA = Math.sin(p) * (0.4 + run * 0.6) * walk;
  let kneeL = Math.max(0, -Math.cos(p)) * (0.4 + run * 0.9) * walk, kneeR = Math.max(0, Math.cos(p)) * (0.4 + run * 0.9) * walk;
  let bob = Math.abs(Math.cos(p)) * 0.04 * walk * (1 + run), lean = run * 0.18;
  let armZ = 0.12, elbow = -0.2 - run * 0.9 * walk;
  if (!s.grounded && !s.sit) {
    if (s.float) { // drifting in low gravity: arms out, legs dangle
      const f = Math.sin(rig.phase * 0.4);
      legA = f * 0.2; kneeL = 0.3 + f * 0.1; kneeR = 0.3 - f * 0.1; armA = 0; armZ = 1.1 + f * 0.15; elbow = -0.3; bob = 0; lean = -0.05;
    } else if (s.vy > 0) { legA = 0.6; kneeL = 1.1; kneeR = 0.3; armA = -0.4; armZ = 0.5; elbow = -0.9; lean = 0.05; bob = 0; }
    else { legA = 0.25; kneeL = 0.5; kneeR = 0.4; armA = 0; armZ = 0.9; elbow = -0.4; lean = 0; bob = 0; }
  }
  if (s.sit) { set(rig.legL, -1.45, 0, 0); set(rig.legR, -1.45, 0, 0); set(rig.kneeL, 1.4); set(rig.kneeR, 1.4); legA = null; }
  if (legA !== null) {
    set(rig.legL, legA, 0, 0); set(rig.legR, -legA, 0, 0);
    set(rig.kneeL, kneeL); set(rig.kneeR, kneeR);
  }
  set(rig.armL, -armA, 0, -armZ); set(rig.armR, armA, 0, armZ);
  set(rig.elbowL, elbow); set(rig.elbowR, elbow);
  // idle breathing
  const breathe = Math.sin(performance.now() / 700 + rig.phase * 0.01) * 0.012 * (1 - walk);
  rig.hips.position.y = rig.S.leg + bob + breathe * 0.5 - (s.sit ? rig.S.leg * 0.5 : 0);
  set(rig.spine, lean + breathe);
  // waving: right arm up and swinging
  if (s.wave) { rig.armR.rotation.z = 2.6 + Math.sin(performance.now() / 120) * 0.3; rig.armR.rotation.x = 0; rig.elbowR.rotation.x = -0.4; }
  if (s.point) { rig.armR.rotation.x = -1.5; rig.armR.rotation.z = 0.1; rig.elbowR.rotation.x = 0; }
  // talking: mouth opens and closes
  rig.talk = s.talk ? rig.talk + dt * 14 : 0;
  rig.mouth.scale.y = s.talk ? 1 + Math.abs(Math.sin(rig.talk)) * 1.6 : 1;
  // blinking
  rig.blink -= dt;
  const closed = rig.blink < 0.12;
  if (rig.blink < 0) rig.blink = 2 + Math.random() * 3.5;
  for (const e of rig.eyes) e.scale.y = closed ? 0.08 : 1;
  // head: look direction
  if (s.lookYaw !== undefined) set(rig.neck, s.lookPitch || 0, s.lookYaw, 0);
}

// a space suit for the orbit and the Moon: a bubble helmet and a jetpack
export function spaceSuit(rig, on) {
  if (!rig.suit) {
    const r = rig.S.headR;
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(r * 1.55, 28, 20), new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.22, roughness: 0.02, metalness: 0.1, clearcoat: 1, depthWrite: false }));
    helmet.position.y = r * 0.05; rig.head.add(helmet);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, r * 0.14, 10, 28), new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.4, metalness: 0.4 }));
    collar.rotation.x = Math.PI / 2; collar.position.y = -r * 0.95; rig.head.add(collar);
    const pack = new THREE.Group(); rig.spine.add(pack); pack.position.set(0, rig.S.torso * 0.55, -rig.S.bodyR * 0.95);
    const box = new THREE.Mesh(new THREE.BoxGeometry(rig.S.bodyR * 1.6, rig.S.torso * 0.9, rig.S.bodyR * 0.7), new THREE.MeshStandardMaterial({ color: 0xf0f2f6, roughness: 0.35, metalness: 0.3 })); box.castShadow = true; pack.add(box);
    const flames = [];
    for (const sx of [-1, 1]) {
      const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.8 })); noz.position.set(sx * rig.S.bodyR * 0.5, -rig.S.torso * 0.5, 0); pack.add(noz);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(4), transparent: true, opacity: 0.85 })); fl.rotation.x = Math.PI; fl.position.set(sx * rig.S.bodyR * 0.5, -rig.S.torso * 0.5 - 0.25, 0); fl.visible = false; pack.add(fl); flames.push(fl);
    }
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7bed9f).multiplyScalar(3) })); light.position.set(rig.S.bodyR * 0.5, rig.S.torso * 0.3, -rig.S.bodyR * 0.36); pack.add(light);
    rig.suit = { parts: [helmet, collar, pack], flames };
  }
  for (const p of rig.suit.parts) p.visible = on;
}
