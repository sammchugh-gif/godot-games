// Giza: dunes you can drive over, three pyramids (the biggest one's top
// floating), the Sphinx, a step pyramid to climb, a tomb full of lasers
// and a palm oasis with a market.
import * as THREE from "three";
import { M } from "../tex.js";

function pyramid(w, x, z, base, h, o = {}) {
  const geo = new THREE.ConeGeometry(base * 0.7071, h, 4, 1); geo.rotateY(Math.PI / 4);
  const mat = M("stone", { args: [41, o.color || [214, 186, 136]], repeat: [base / 6, h / 6], normal: 1.2 });
  const m = w.mesh(geo, mat, x, h / 2, z);
  // a slope collider: a stack of shrinking boxes
  const steps = 8;
  for (let i = 0; i < steps; i++) { const f0 = i / steps, hh = h / steps, half = base / 2 * (1 - f0 - 0.5 / steps); w.phys.fixedBox(x, hh * (i + 0.5), z, half, hh / 2, half); }
  return m;
}
function stepPyramid(w, x, z) {
  // six big steps, each one a jump high
  const mat = M("stone", { args: [43, [200, 176, 130]], repeat: [3, 1] });
  for (let i = 0; i < 6; i++) { const s = 22 - i * 3.4, h = 1.0; w.box(s, h, s, mat, x, h * i + h / 2, z); }
  return 6;
}
function sphinx(w, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; w.scene.add(g);
  const stone = M("stone", { args: [45, [206, 170, 116]], repeat: [2, 1] }), stripe = M(0x3a6ab0, { rough: 0.7 }), gold = M(0xd8a830, { rough: 0.5, metal: 0.4 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(6, 4, 14), stone, 0, 2, -2);
  for (const sx of [-2, 2]) add(new THREE.BoxGeometry(1.6, 1.4, 6), stone, sx, 0.7, 7);
  add(new THREE.BoxGeometry(4, 4.6, 3.6), stone, 0, 6.2, 4);
  const head = add(new THREE.BoxGeometry(3, 3.4, 3), stone, 0, 7, 5.2); void head;
  for (let i = 0; i < 5; i++) { add(new THREE.BoxGeometry(4.3, 0.35, 3.7), i % 2 ? stripe : gold, 0, 6.2 + i * 0.7, 3.9); }
  add(new THREE.BoxGeometry(0.4, 0.4, 0.3), M(0x1a1a1a), -0.7, 7.6, 6.72); add(new THREE.BoxGeometry(0.4, 0.4, 0.3), M(0x1a1a1a), 0.7, 7.6, 6.72);
  w.phys.fixedBox(x, 3, z, 3.4, 3, 8.6);
}
function palm(w, x, z, h) { w.palm(x, z, h); }
function camel(w, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; w.scene.add(g);
  const fur = M(0xc89a5a, { rough: 0.95 });
  const add = (geo, px, py, pz, rx = 0) => { const me = new THREE.Mesh(geo, fur); me.position.set(px, py, pz); me.rotation.x = rx; me.castShadow = true; g.add(me); return me; };
  add(new THREE.CapsuleGeometry(0.5, 1.4, 6, 12), 0, 1.7, 0, Math.PI / 2);
  add(new THREE.SphereGeometry(0.45, 12, 10), 0, 2.2, -0.2);
  for (const [sx, sz] of [[-0.3, 0.6], [0.3, 0.6], [-0.3, -0.6], [0.3, -0.6]]) add(new THREE.CylinderGeometry(0.1, 0.08, 1.4, 8), sx, 0.7, sz);
  add(new THREE.CylinderGeometry(0.14, 0.18, 1.2, 8), 0, 2.3, 1.1, -0.6);
  add(new THREE.CapsuleGeometry(0.16, 0.4, 4, 8), 0, 2.85, 1.45, Math.PI / 2);
  w.phys.fixedBox(x, 1, z, 0.6, 1, 1.2, ry);
  return g;
}
function tent(w, x, z, color) {
  const cloth = M(color, { rough: 0.8, side: THREE.DoubleSide });
  const c = w.mesh(new THREE.ConeGeometry(2.4, 2.2, 4, 1, true), cloth, x, 2.9, z, { ry: Math.PI / 4 });
  for (const [sx, sz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) w.cyl(0.06, 0.06, 1.8, M(0x6a4a2a), x + sx, 0.9, z + sz, { seg: 6, collide: false });
  w.box(2.8, 0.8, 1.2, M("wood", { args: [47, [140, 96, 56]] }), x, 0.4, z + 0.6);
  for (let i = 0; i < 5; i++) w.sphere(0.2, M([0xff8a2a, 0xe83a3a, 0x7bbd3a, 0xffd23f, 0xa04ad8][i]), x - 1 + i * 0.5, 0.95, z + 0.6, { collide: false, seg: 10 });
  void c;
}

export function buildEgypt(w) {
  w.setSky("desert");
  // dunes: flat around the plaza, rolling further out
  const dune = (x, z) => {
    const r = Math.hypot(x, z * 0.8);
    const k = Math.min(1, Math.max(0, (r - 38) / 30));
    return k * (2.2 + Math.sin(x * 0.045) * 2.2 + Math.cos(z * 0.06 + x * 0.02) * 1.8 + Math.sin((x + z) * 0.11) * 0.6);
  };
  w.terrain(320, 96, dune, M("sand", { args: [49], repeat: [50, 50], normal: 0.8 }));
  w.phys.fixedBox(0, -2, 0, 400, 1, 400); // a floor under everything, just in case
  // the three pyramids of Giza behind, the big one's top floating
  pyramid(w, 20, -95, 60, 42);
  pyramid(w, -45, -120, 48, 34);
  pyramid(w, -80, -80, 26, 18);
  const cap = new THREE.Group(); w.scene.add(cap);
  { const geo = new THREE.ConeGeometry(8 * 0.7071, 6, 4, 1); geo.rotateY(Math.PI / 4); const m = new THREE.Mesh(geo, M(0xe8c060, { rough: 0.3, metal: 0.6, emissive: 0xd8a030, ei: 0.3 })); m.castShadow = true; cap.add(m); cap.position.set(20, 52, -95); }
  // stones orbiting the floating top
  const rocks = [];
  for (let i = 0; i < 10; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 2), M("stone", { args: [41, [214, 186, 136]] })); r.castShadow = true; r.userData.dynamic = true; w.scene.add(r); rocks.push(r); }
  w.updaters.push((dt, t) => { cap.position.y = 52 + Math.sin(t * 0.7) * 1.2; cap.rotation.y = t * 0.15; rocks.forEach((r, i) => { const a = t * 0.25 + i / 10 * Math.PI * 2; r.position.set(20 + Math.cos(a) * 14, 40 + Math.sin(t + i) * 2 + (i % 3) * 3, -95 + Math.sin(a) * 14); r.rotation.set(t * 0.3 + i, t * 0.2, i); }); });
  sphinx(w, -30, -24, 0.35);
  const topY = stepPyramid(w, -34, 22);
  // the tomb: a sunken corridor with high walls; the lasers run inside
  const tombStone = M("stone", { args: [51, [170, 146, 110]], repeat: [4, 1] });
  w.box(1, 5, 30, tombStone, 26.5, 2.5, -2); w.box(1, 5, 30, tombStone, 33.5, 2.5, -2);
  w.box(8, 5, 1, tombStone, 30, 2.5, -17.5);
  w.box(2, 6, 1, tombStone, 26, 3, 13.3); w.box(2, 6, 1, tombStone, 34, 3, 13.3); w.box(10, 1.2, 1.2, M(0xd8a830, { metal: 0.5, rough: 0.4 }), 30, 6.3, 13.3);
  w.box(6, 0.1, 30, M("tiles", { args: [53, [200, 176, 126], [160, 132, 96], 6], repeat: [1, 5] }), 30, 0.05, -2, { collide: false });
  for (let i = 0; i < 4; i++) { w.box(0.2, 1.2, 0.6, M(0x3a6ab0), 26.95, 3.5, -12 + i * 7, { collide: false }); w.box(0.2, 1.2, 0.6, M(0xd8a830, { metal: 0.4 }), 33.05, 3.5, -12 + i * 7, { collide: false }); }
  // the oasis: palms, a pool, a market and camels
  w.water(14, 10, 0, 0.12, 30, 0x2aa8b8, { opacity: 0.9 });
  w.box(15, 0.2, 11, M("sand", { args: [55, [190, 170, 120]] }), 0, 0.02, 30, { collide: false });
  for (const [x, z, h] of [[-8, 25, 8], [7, 26, 9], [-6, 36, 7], [9, 35, 8], [0, 38, 9], [-12, 32, 7]]) palm(w, x, z, h);
  tent(w, 14, 16, 0xe83a3a); tent(w, 20, 20, 0x3a8ad8); tent(w, 14, 24, 0xffd23f);
  camel(w, -14, 12, 0.8); camel(w, -18, 15, 1.4); camel(w, 20, 32, -0.6);
  // obelisks marking the plaza
  for (const [x, z] of [[-10, -6], [10, -6]]) { w.box(1.4, 9, 1.4, M("stone", { args: [57, [220, 196, 150]] }), x, 4.5, z); const tip = w.cone(1, 1.6, M(0xe8c060, { metal: 0.6, rough: 0.3 }), x, 9.8, z, { collide: false }); tip.rotation.y = Math.PI / 4; }
  w.floorY = -20;
  // the buggy chase goes out round the dunes and back through the plaza
  const loop = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; loop.push([Math.cos(a) * (72 + Math.sin(a * 3) * 10), Math.sin(a) * (60 + Math.cos(a * 2) * 8) + 5]); }
  w.missionData = {
    egy1: { cells: [[-34, 1.8, 22 + 10.2], [-34 - 8.5, 2.8, 22], [-34, 3.8, 22 - 6.8], [-34 + 5, 4.8, 22], [-34, 5.8, 22 + 3.3], [-34, topY + 1.2, 22], [-34, topY + 3.5, 22], [-42, 1.8, 30]] },
    egy2: { pad: [-8, 0, -14], padR: 2.2, size: 1.1, blocks: [[4, 0.8, -12], [-18, 0.8, -8], [0, 0.8, -26], [-14, 0.8, -20], [8, 0.8, -20]] },
    egy3: { start: [30, 0.1, 11], goal: [30, 0.1, -15], width: 6 },
    egy4: { path: loop, y: 0.3, car: "buggy", quarry: "buggy", lead: 26 },
  };
  return { spawn: [0, 0.1, 16], yaw: Math.PI, bolt: [2, 0.1, 15], contact: [-3, 0.1, 13, 2.4] };
}
