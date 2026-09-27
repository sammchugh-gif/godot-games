// The animals of Deep Red, built from simple shapes: baby turtles and clownfish
// to lead home, crabs that scare them, and the sea life that makes the places
// feel alive (schools of fish, sea turtles, sea lions, manta rays, marine
// iguanas and giant tortoises). critter(kind) makes one; animateCritter moves
// its fins and legs; roam() sets one swimming round a loop; school() is a shoal.
import * as THREE from "three";
import { compact } from "./people.js";

const mats = new Map();
const M = (color, o = {}) => { const k = color + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide })); return mats.get(k); };
function part(parent, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m; }
const sph = (r, a = 14, b = 10) => new THREE.SphereGeometry(r, a, b);

export function critter(kind, scale = 1) {
  const g = new THREE.Group(), P = g.userData = { kind, t: Math.random() * 6, parts: {} };
  const eye = (parent, x, y, z, r = 0.02) => { part(parent, sph(r, 8, 6), M(0x0a0a0a, { rough: 0.2 }), x, y, z); };
  if (kind === "turtle" || kind === "seaturtle") {
    const s = kind === "turtle" ? 0.22 : 1.1, shell = M(kind === "turtle" ? 0x3a4a2a : 0x4a5a2a, { rough: 0.7 }), skin = M(kind === "turtle" ? 0x5a6a4a : 0x7a8a5a);
    part(g, sph(s, 16, 10), shell, 0, s * 0.35, 0, 1, 0.45, 1.2);
    part(g, sph(s * 0.9, 16, 8), M(0xd8c89a), 0, s * 0.22, 0, 1, 0.2, 1.1);
    const head = P.parts.head = part(g, sph(s * 0.35, 12, 8), skin, 0, s * 0.35, s * 1.25, 1, 0.9, 1.2);
    eye(head, s * 0.18, s * 0.1, s * 0.25, s * 0.06); eye(head, -s * 0.18, s * 0.1, s * 0.25, s * 0.06);
    P.parts.fl = [[-1, 0.6], [1, 0.6], [-1, -0.8], [1, -0.8]].map(([sx, sz]) => { const f = new THREE.Group(); f.position.set(sx * s * 0.8, s * 0.3, sz * s); g.add(f); part(f, new THREE.BoxGeometry(s * (sz > 0 ? 0.9 : 0.5), s * 0.06, s * 0.35), skin, sx * s * 0.35, 0, 0); return f; });
  } else if (kind === "clownfish" || kind === "fish") {
    const s = kind === "clownfish" ? 0.2 : 0.16, body = M(kind === "clownfish" ? 0xff7a1a : 0x3ab0e8, { rough: 0.35, emissive: kind === "clownfish" ? 0x401a00 : 0x001a30, ei: 1 });
    part(g, sph(s, 16, 10), body, 0, 0, 0, 0.55, 0.9, 1.3);
    if (kind === "clownfish") for (const z of [s * 0.55, 0, -s * 0.55]) { const k = Math.sqrt(1 - (z / (s * 1.3)) ** 2) * 1.04; part(g, new THREE.CylinderGeometry(s * 0.56, s * 0.56, s * 0.12, 16), M(0xffffff), 0, 0, z, 0.98 * k, 1, 1.6 * k).rotation.x = Math.PI / 2; }
    const tail = P.parts.tail = new THREE.Group(); tail.position.z = -s * 1.2; g.add(tail);
    part(tail, new THREE.ConeGeometry(s * 0.6, s * 0.7, 4), body, 0, 0, -s * 0.3, 0.2, 1, 1).rotation.x = -Math.PI / 2;
    eye(g, s * 0.25, s * 0.2, s * 0.9, s * 0.13); eye(g, -s * 0.25, s * 0.2, s * 0.9, s * 0.13);
  } else if (kind === "crab") {
    const red = M(0xd83a2a, { rough: 0.5 });
    part(g, sph(0.22, 14, 8), red, 0, 0.18, 0, 1.2, 0.45, 0.9);
    P.parts.legs = [];
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const l = new THREE.Group(); l.position.set(sx * 0.22, 0.16, (i - 1) * 0.12); g.add(l); part(l, new THREE.BoxGeometry(0.22, 0.03, 0.03), red, sx * 0.1, -0.06, 0).rotation.z = sx * -0.6; P.parts.legs.push(l); }
    for (const sx of [-1, 1]) { const c = part(g, sph(0.08, 10, 8), red, sx * 0.2, 0.22, 0.26, 1.3, 0.8, 1); c.rotation.y = sx * 0.4; part(g, new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), red, sx * 0.07, 0.3, 0.14); eye(g, sx * 0.07, 0.37, 0.14, 0.022); }
  } else if (kind === "sealion") {
    // a Galápagos sea lion propped up on its front flippers: a sleek body, a raised chest, a dog-like
    // head with a snout, whiskers and big dark eyes. Its feet are at y = 0.
    const fur = M(0x8a7258, { rough: 0.45, metal: 0.05 }), dark = M(0x5a4a3a, { rough: 0.5 });
    part(g, sph(0.45, 18, 12), fur, 0, 0.3, -0.2, 0.75, 0.62, 1.9);
    part(g, sph(0.32, 16, 12), fur, 0, 0.58, 0.62, 0.85, 1.15, 1);
    const head = P.parts.head = new THREE.Group(); head.position.set(0, 0.98, 0.86); g.add(head);
    part(head, sph(0.2, 16, 12), fur, 0, 0, 0, 0.9, 0.85, 1.05);
    part(head, sph(0.11, 12, 8), fur, 0, -0.05, 0.2, 1, 0.8, 1.3);
    part(head, sph(0.04, 8, 6), M(0x1a1410), 0, -0.02, 0.33);
    eye(head, 0.09, 0.06, 0.14, 0.045); eye(head, -0.09, 0.06, 0.14, 0.045);
    for (const sx of [-1, 1]) {
      part(head, sph(0.03, 6, 4), dark, sx * 0.15, 0.1, -0.02);
      for (let k = 0; k < 3; k++) { const wk = part(head, new THREE.CylinderGeometry(0.004, 0.004, 0.16, 3), M(0xf0ece0), sx * 0.1, -0.06 + k * 0.02, 0.26); wk.rotation.z = sx * (1.3 + k * 0.15); }
    }
    P.parts.fl = [-1, 1].map(sx => { const f = new THREE.Group(); f.position.set(sx * 0.26, 0.42, 0.62); g.add(f); const b = part(f, new THREE.BoxGeometry(0.14, 0.46, 0.22), dark, sx * 0.08, -0.22, 0.06); b.rotation.z = sx * 0.3; return f; });
    const tail = P.parts.tail = new THREE.Group(); tail.position.set(0, 0.14, -1.0); g.add(tail);
    for (const sx of [-1, 1]) { const t = part(tail, new THREE.BoxGeometry(0.2, 0.04, 0.42), dark, sx * 0.14, 0, -0.16); t.rotation.y = sx * 0.35; }
    // swimming, it lies flat: the chest and head come down level with the body
    const chest = P.parts.chest = g.children[1];
    P.swimPose = () => { chest.position.set(0, 0.32, 0.62); chest.scale.set(0.8, 0.75, 1.1); head.position.set(0, 0.38, 1.05); for (const f of P.parts.fl) { f.position.y = 0.25; f.rotation.z = 0; } };
  } else if (kind === "otter") {
    // a sea otter floating on its back, paws on its chest: its middle is at y = 0 (the water line)
    const fur = M(0x5a3a22, { rough: 0.7 }), face = M(0xc8b08a, { rough: 0.7 });
    part(g, sph(0.2, 16, 12), fur, 0, 0, 0, 1, 0.7, 2.1);
    const head = P.parts.head = new THREE.Group(); head.position.set(0, 0.1, 0.44); g.add(head);
    part(head, sph(0.13, 14, 10), face, 0, 0, 0, 1, 0.95, 1);
    part(head, sph(0.05, 10, 8), face, 0, -0.02, 0.11, 1.2, 0.8, 1);
    part(head, sph(0.022, 8, 6), M(0x1a1410), 0, 0.01, 0.16);
    eye(head, 0.055, 0.05, 0.09, 0.022); eye(head, -0.055, 0.05, 0.09, 0.022);
    for (const sx of [-1, 1]) part(head, sph(0.03, 8, 6), fur, sx * 0.1, 0.09, -0.02);
    P.parts.fl = [-1, 1].map(sx => { const f = new THREE.Group(); f.position.set(sx * 0.1, 0.12, 0.22); g.add(f); part(f, sph(0.045, 8, 6), fur, 0, 0, 0.02, 1, 0.8, 1.4); return f; });
    const tail = P.parts.tail = new THREE.Group(); tail.position.set(0, 0.02, -0.4); g.add(tail);
    part(tail, sph(0.07, 10, 8), fur, 0, 0, -0.14, 1.1, 0.5, 2.4);
  } else if (kind === "lanternfish") {
    // a little dark fish with rows of blue lights along its belly
    const s = 0.14, body = M(0x1a2230, { rough: 0.3, metal: 0.4 }), glow = M(0x6ad8ff, { emissive: 0x6ad8ff, ei: 3 });
    part(g, sph(s, 12, 8), body, 0, 0, 0, 0.5, 0.6, 1.4);
    for (let k = -3; k <= 3; k++) for (const sx of [-1, 1]) part(g, sph(s * 0.08, 6, 4), glow, sx * s * 0.38, -s * 0.28, k * s * 0.3);
    part(g, sph(s * 0.14, 8, 6), glow, 0, s * 0.1, s * 1.15);
    eye(g, s * 0.25, s * 0.15, s * 1.0, s * 0.12); eye(g, -s * 0.25, s * 0.15, s * 1.0, s * 0.12);
    const tail = P.parts.tail = new THREE.Group(); tail.position.set(0, 0, -s * 1.3); g.add(tail);
    part(tail, new THREE.ConeGeometry(s * 0.5, s * 0.8, 4), body, 0, 0, -s * 0.3, 0.3, 1, 1).rotation.x = -Math.PI / 2;
  } else if (kind === "jelly") {
    // a jellyfish: a glowing bell and trailing tentacles that sway
    const col = P.color = 0xff7ad8, bell = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2, transparent: true, opacity: 0.55, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
    const b = P.parts.bell = part(g, new THREE.SphereGeometry(0.4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), bell, 0, 0, 0);
    b.castShadow = false;
    const tm = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.4), transparent: true, opacity: 0.6, depthWrite: false });
    P.parts.legs = [];
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, t = part(g, new THREE.CylinderGeometry(0.012, 0.004, 1.2, 3), tm, Math.cos(a) * 0.26, -0.6, Math.sin(a) * 0.26); t.castShadow = false; P.parts.legs.push(t); }
  } else if (kind === "angler") {
    // an anglerfish: a round dark body, a huge toothy mouth, and a glowing lure on a stalk
    const body = M(0x2a1a22, { rough: 0.6 }), tooth = M(0xf0f0e0, { rough: 0.3 }), lure = M(0xb8ff6a, { emissive: 0xb8ff6a, ei: 4 });
    part(g, sph(0.5, 18, 12), body, 0, 0, 0, 1, 0.9, 1.1);
    part(g, sph(0.36, 14, 10), M(0x100810), 0, -0.1, 0.36, 1.1, 0.5, 0.5);
    for (let k = 0; k < 9; k++) { const a = -0.9 + k * 0.225; part(g, new THREE.ConeGeometry(0.03, 0.14, 4), tooth, Math.sin(a) * 0.36, -0.02, 0.36 + Math.cos(a) * 0.14).rotation.x = Math.PI; }
    eye(g, 0.2, 0.2, 0.36, 0.05); eye(g, -0.2, 0.2, 0.36, 0.05);
    const stalk = part(g, new THREE.CylinderGeometry(0.015, 0.02, 0.7, 5), body, 0, 0.62, 0.3); stalk.rotation.x = 0.7;
    const L = P.parts.head = part(g, sph(0.08, 10, 8), lure, 0, 0.86, 0.62);
    const light = new THREE.PointLight(0xb8ff6a, 3, 6, 1.6); L.add(light);
    P.parts.fl = [-1, 1].map(sx => { const f = new THREE.Group(); f.position.set(sx * 0.46, -0.05, 0); g.add(f); part(f, new THREE.ConeGeometry(0.15, 0.3, 4), body, sx * 0.1, 0, 0, 0.4, 1, 1).rotation.z = -sx * Math.PI / 2; return f; });
    const tail = P.parts.tail = new THREE.Group(); tail.position.set(0, 0, -0.55); g.add(tail);
    part(tail, new THREE.ConeGeometry(0.25, 0.4, 4), body, 0, 0, -0.15, 0.3, 1, 1).rotation.x = -Math.PI / 2;
  } else if (kind === "narwhal") {
    // a narwhal: a long mottled grey whale with a spiral tusk
    const skin = M(0x8a929a, { rough: 0.5 }), belly = M(0xd8dce0, { rough: 0.5 }), tusk = M(0xf0e8d0, { rough: 0.4 });
    part(g, sph(0.6, 20, 14), skin, 0, 0, 0, 1, 0.9, 3);
    part(g, sph(0.55, 18, 12), belly, 0, -0.1, 0.2, 0.95, 0.75, 2.7);
    part(g, new THREE.ConeGeometry(0.05, 2.2, 8), tusk, 0.08, 0.05, 2.8).rotation.x = Math.PI / 2;
    eye(g, 0.3, 0.12, 1.3, 0.04); eye(g, -0.3, 0.12, 1.3, 0.04);
    P.parts.fl = [-1, 1].map(sx => { const f = new THREE.Group(); f.position.set(sx * 0.5, -0.2, 0.9); g.add(f); part(f, new THREE.BoxGeometry(0.4, 0.04, 0.22), skin, sx * 0.2, 0, 0); return f; });
    const tail = P.parts.tail = new THREE.Group(); tail.position.set(0, 0, -1.7); g.add(tail);
    for (const sx of [-1, 1]) { const t = part(tail, new THREE.BoxGeometry(0.5, 0.05, 0.3), skin, sx * 0.25, 0, -0.1); t.rotation.y = sx * 0.4; }
  } else if (kind === "glim") {
    // Glim, the lost POLARIS probe: a round silver body, one big glowing eye, stubby fins, an
    // antenna with a light on top, and a glow of its own in the dark
    const shell = M(0xe8eef4, { rough: 0.25, metal: 0.6 }), glow = M(0x7ff4e8, { emissive: 0x7ff4e8, ei: 3 });
    part(g, sph(0.35, 20, 14), shell, 0, 0, 0);
    part(g, new THREE.TorusGeometry(0.35, 0.03, 8, 32), glow, 0, 0, 0).rotation.x = Math.PI / 2;
    part(g, new THREE.CircleGeometry(0.16, 20), glow, 0, 0.04, 0.345);
    part(g, sph(0.06, 10, 8), M(0x0a1a24), 0, 0.04, 0.35);
    part(g, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), shell, 0, 0.45, 0);
    const tip = P.parts.head = part(g, sph(0.05, 10, 8), glow, 0, 0.62, 0);
    tip.add(new THREE.PointLight(0x7ff4e8, 3, 7, 1.6));
    P.parts.fl = [-1, 1].map(sx => { const f = new THREE.Group(); f.position.set(sx * 0.34, -0.05, -0.05); g.add(f); part(f, new THREE.BoxGeometry(0.2, 0.03, 0.14), shell, sx * 0.1, 0, 0); return f; });
  } else if (kind === "manta") {
    const top = M(0x1a1c24, { rough: 0.5, side: THREE.DoubleSide }), belly = M(0xe8e8ec, { side: THREE.DoubleSide });
    const sh = new THREE.Shape(); sh.moveTo(0, 1.2); sh.quadraticCurveTo(1.6, 0.4, 2.6, -0.2); sh.quadraticCurveTo(1.2, -0.3, 0, -0.9); sh.quadraticCurveTo(-1.2, -0.3, -2.6, -0.2); sh.quadraticCurveTo(-1.6, 0.4, 0, 1.2);
    const geo = new THREE.ShapeGeometry(sh, 16); geo.rotateX(Math.PI / 2);
    const pos = geo.attributes.position; P.base = Float32Array.from(pos.array);
    const w = P.parts.wing = part(g, geo, top); part(g, geo, belly, 0, -0.03, 0).userData.belly = true;
    P.geo = geo;
    const tail = part(g, new THREE.CylinderGeometry(0.02, 0.05, 2, 6), top, 0, 0, -1.8); tail.rotation.x = Math.PI / 2;
    void w;
  } else if (kind === "iguana") {
    const skin = M(0x2a2a28, { rough: 0.9 });
    part(g, sph(0.2, 12, 8), skin, 0, 0.15, 0, 0.8, 0.6, 2);
    const head = P.parts.head = part(g, sph(0.12, 12, 8), skin, 0, 0.2, 0.45, 1, 0.8, 1.3); eye(head, 0.07, 0.04, 0.05, 0.02); eye(head, -0.07, 0.04, 0.05, 0.02);
    for (let i = 0; i < 6; i++) part(g, new THREE.ConeGeometry(0.03, 0.08, 4), skin, 0, 0.3, 0.3 - i * 0.12);
    const tail = P.parts.tail = new THREE.Group(); tail.position.z = -0.38; g.add(tail); part(tail, new THREE.ConeGeometry(0.08, 0.9, 6), skin, 0, 0.12, -0.45).rotation.x = -Math.PI / 2;
    for (const [sx, sz] of [[-1, 0.2], [1, 0.2], [-1, -0.25], [1, -0.25]]) part(g, new THREE.BoxGeometry(0.2, 0.04, 0.05), skin, sx * 0.18, 0.05, sz);
  } else if (kind === "tortoise") {
    // a Galápagos giant tortoise: a high domed shell of plates, a long leathery neck, a beaky face and
    // legs like an elephant's
    const shellM = M(0x3e3426, { rough: 0.85 }), plate = M(0x5c4a32, { rough: 0.8 }), rim = M(0x2e261c, { rough: 0.9 }), skin = M(0x7a705c, { rough: 0.95 });
    const dome = new THREE.SphereGeometry(0.85, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const shell = part(g, dome, shellM, 0, 0.36, 0, 1, 0.85, 1.2);
    part(g, new THREE.CylinderGeometry(0.88, 0.8, 0.2, 22), rim, 0, 0.36, 0, 1, 1, 1.2);
    part(g, sph(0.8, 16, 8), skin, 0, 0.36, 0, 1, 0.22, 1.15);
    // the plates on the shell, each lying on the curve of the dome
    const hex = new THREE.CylinderGeometry(0.21, 0.25, 0.05, 6), up = new THREE.Vector3(0, 1, 0);
    const spots = [[0, 0]]; for (let k = 0; k < 6; k++) spots.push([0.62, k / 6 * Math.PI * 2 + 0.52]); for (let k = 0; k < 10; k++) spots.push([1.12, k / 10 * Math.PI * 2]);
    for (const [th, a] of spots) {
      const a0 = 0.85, b0 = 0.85 * 0.85, c0 = 0.85 * 1.2, px = Math.sin(th) * Math.cos(a) * a0, py = Math.cos(th) * b0, pz = Math.sin(th) * Math.sin(a) * c0;
      const n = new THREE.Vector3(px / (a0 * a0), py / (b0 * b0), pz / (c0 * c0)).normalize();
      const pl = part(g, hex, plate, px + n.x * 0.01, 0.36 + py + n.y * 0.01, pz + n.z * 0.01, th > 1 ? 0.85 : 1, 1, th > 1 ? 0.85 : 1);
      pl.quaternion.setFromUnitVectors(up, n);
    }
    void shell;
    // neck and head
    const neck = part(g, new THREE.CylinderGeometry(0.12, 0.17, 0.7, 10), skin, 0, 0.62, 1.05); neck.rotation.x = 1.0;
    const head = P.parts.head = new THREE.Group(); head.position.set(0, 0.88, 1.38); g.add(head);
    part(head, sph(0.17, 14, 10), skin, 0, 0, 0, 0.9, 0.85, 1.3);
    part(head, new THREE.ConeGeometry(0.08, 0.14, 8), M(0x4a4436, { rough: 0.6 }), 0, -0.04, 0.24, 1, 1, 0.7).rotation.x = Math.PI / 2;
    eye(head, 0.1, 0.05, 0.1, 0.028); eye(head, -0.1, 0.05, 0.1, 0.028);
    // legs, with pale toenails at the front
    const nail = M(0xd8d0bc, { rough: 0.5 });
    P.parts.legs = [[-1, 0.62], [1, 0.62], [-1, -0.62], [1, -0.62]].map(([sx, sz]) => {
      const leg = part(g, new THREE.CylinderGeometry(0.15, 0.19, 0.46, 10), skin, sx * 0.58, 0.23, sz * 0.85);
      if (sz > 0) for (let k = -1; k <= 1; k++) part(leg, new THREE.ConeGeometry(0.035, 0.08, 5), nail, k * 0.07, -0.2, 0.17).rotation.x = Math.PI / 2;
      return leg;
    });
    part(g, new THREE.ConeGeometry(0.06, 0.2, 6), skin, 0, 0.3, -1.05).rotation.x = -Math.PI / 2 - 0.3;
  }
  // the parts that never move, merged into one mesh per material (ten iguanas were three hundred
  // draw calls); the ones the animation or a change of pose moves stay as they are. (Mantas ripple
  // their whole shape, so they're left alone.)
  if (kind !== "manta") { const keep = new Set(); for (const v of Object.values(P.parts)) for (const m of [v].flat()) if (m && m.isMesh) keep.add(m); compact(g, keep); }
  g.scale.setScalar(scale);
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  return g;
}

// fins, flippers and legs going; speed from 0 (resting) to 1 (hurrying)
export function animateCritter(g, dt, speed = 1) {
  const P = g.userData, k = P.kind; P.t += dt * (2 + speed * 8);
  const t = P.t, p = P.parts;
  if (p.fl) p.fl.forEach((f, i) => { f.rotation.z = Math.sin(t + (i % 2 ? 0 : Math.PI)) * (k === "sealion" ? 0.5 : 0.6) * (0.3 + speed); f.rotation.y = Math.sin(t) * 0.3 * (i < 2 ? 1 : -1); });
  if (p.tail) p.tail.rotation.y = Math.sin(t * (k === "clownfish" || k === "fish" ? 2.5 : 1.2)) * 0.5;
  if (p.legs && k !== "jelly") p.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 1.5 + i) * 0.4 * speed; });
  if (p.head && (k === "tortoise" || k === "iguana")) p.head.rotation.y = Math.sin(t * 0.3) * 0.3;
  if (k === "jelly") { const q = Math.sin(t * 0.5); p.bell.scale.set(1 + q * 0.12, 1 - q * 0.15, 1 + q * 0.12); p.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 0.4 + i) * 0.25; l.rotation.z = Math.cos(t * 0.3 + i * 1.7) * 0.25; }); }
  if (k === "manta") {
    const pos = P.geo.attributes.position, b = P.base;
    for (let i = 0; i < pos.count; i++) { const x = b[i * 3]; pos.setY(i, Math.sin(t * 0.6 - Math.abs(x) * 0.3) * Math.abs(x) * 0.28); }
    pos.needsUpdate = true;
  }
}

// something swimming (or walking) round a loop: an ellipse at (cx, cz) with radii rx, rz, at height y
// (bobbing by dy), taking `period` seconds; it faces the way it's going
export function roam(world, kind, o) {
  const c = critter(kind, o.scale || 1); world.scene.add(c);
  if (c.userData.swimPose && o.y < (world.sea ? world.sea.level : 0)) c.userData.swimPose();
  const ph = o.phase ?? Math.random() * 6, dir = o.dir || 1;
  world.updaters.push((dt, t) => {
    const a = ph + dir * t * Math.PI * 2 / (o.period || 30);
    const x = o.cx + Math.cos(a) * o.rx, z = o.cz + Math.sin(a) * o.rz, y = o.y + Math.sin(t * 0.7 + ph) * (o.dy ?? 0.4);
    const nx = -Math.sin(a) * o.rx * dir, nz = Math.cos(a) * o.rz * dir;
    c.position.set(x, y, z); c.rotation.y = Math.atan2(nx, nz);
    if (kind === "manta" || kind === "seaturtle") c.rotation.z = -dir * 0.15;
    animateCritter(c, dt, o.speed ?? 0.6);
  });
  return c;
}

// a shoal of little fish milling round a point, drawn as one instanced mesh
// (glow: how brightly they shine, for the lanternfish of the deep)
export function school(world, cx, cy, cz, n = 40, r = 4, color = 0x3ab0e8, glow = 0.15) {
  const body = new THREE.SphereGeometry(0.12, 8, 6); body.scale(0.45, 0.8, 1.4);
  const mesh = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.3, emissive: color, emissiveIntensity: glow }), n);
  mesh.frustumCulled = false; mesh.userData.dynamic = true; world.scene.add(mesh);
  const fish = Array.from({ length: n }, (_, i) => ({ a: Math.random() * 6.28, r: r * (0.4 + Math.random() * 0.6), y: (Math.random() - 0.5) * r * 0.6, s: 0.6 + Math.random() * 0.5, ph: Math.random() * 6 }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  world.updaters.push((dt, t) => {
    fish.forEach((f, i) => {
      f.a += dt * f.s * (1 + Math.sin(t * 0.3 + f.ph) * 0.3) / Math.max(1, f.r * 0.5);
      p.set(cx + Math.cos(f.a) * f.r, cy + f.y + Math.sin(t + f.ph) * 0.3, cz + Math.sin(f.a) * f.r);
      q.setFromEuler(e.set(0, Math.atan2(-Math.sin(f.a), Math.cos(f.a)), 0));
      m.compose(p, q, one); mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return mesh;
}
