// The Taj Mahal at dawn: white marble, the onion dome, four minarets, the long
// reflecting pool with fountains, and gardens of hedges where Zero's guards walk.
import * as THREE from "three";
import { M } from "../tex.js";

const marble = () => M("tiles", { args: [151, [246, 242, 236], [236, 230, 222], 8], repeat: [4, 4], rough: 0.25 });
function onion(r, h) {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const f = i / 24; const y = f * h; const rr = r * (f < 0.35 ? 1 + Math.sin(f / 0.35 * Math.PI / 2) * 0.18 : 1.18 * Math.cos((f - 0.35) / 0.65 * Math.PI / 2) ** 1.4); pts.push(new THREE.Vector2(Math.max(0.01, rr), y)); }
  return new THREE.LatheGeometry(pts, 32);
}
function chhatri(w, x, y, z, s) {
  const m = marble();
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; w.cyl(0.12 * s, 0.12 * s, 1.6 * s, m, x + Math.cos(a) * 0.9 * s, y + 0.8 * s, z + Math.sin(a) * 0.9 * s, { seg: 8, collide: false }); }
  w.cyl(1.2 * s, 1.2 * s, 0.2 * s, m, x, y + 1.7 * s, z, { collide: false });
  w.mesh(onion(1 * s, 1.8 * s), m, x, y + 1.8 * s, z);
}
function minaret(w, x, z, h) {
  const m = marble();
  w.cyl(1.1, 1.4, h, m, x, 2 + h / 2, z, { seg: 16 });
  for (const f of [0.33, 0.66, 0.97]) { w.cyl(1.9, 1.9, 0.35, m, x, 2 + h * f, z, { seg: 20, collide: true }); }
  chhatri(w, x, 2 + h, z, 1);
}
function taj(w, x, z) {
  const m = marble(), dark = M(0x2a2830, { rough: 0.6 }), gold = M(0xe8b030, { metal: 0.8, rough: 0.25 });
  w.box(48, 2, 48, m, x, 1, z);                       // the plinth
  w.steps(4, 10, 0.5, 0.8, m, x, 0, z + 27.2, Math.PI);
  // the main hall: an octagon with tall arched fronts
  const hall = w.cyl(14, 14, 16, m, x, 2 + 8, z, { seg: 8 }); hall.rotation.y = Math.PI / 8;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const px = x + Math.sin(a) * 12.95, pz = z + Math.cos(a) * 12.95; const arch = w.mesh(new THREE.PlaneGeometry(6, 10), dark, px, 7.5, pz, { ry: a, cast: false }); void arch; w.mesh(new THREE.CircleGeometry(3, 24, 0, Math.PI), dark, px, 12.5, pz, { ry: a, cast: false }); }
  w.cyl(8.5, 8.5, 3, m, x, 19.5, z, { seg: 32, collide: false });
  w.mesh(onion(8, 16), m, x, 21, z);
  w.cyl(0.25, 0.4, 5, gold, x, 38.5, z, { collide: false });
  w.sphere(0.5, gold, x, 39.5, z, { collide: false });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) chhatri(w, x + sx * 9, 18, z + sz * 9, 1.6);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) minaret(w, x + sx * 21, z + sz * 21, 26);
}
function cypress(w, x, z, h = 6) { const t = w.mesh(new THREE.ConeGeometry(0.9, h, 10), M(0x2a5a2a, { rough: 0.9 }), x, h / 2, z); t.scale.x = 0.8; w.phys.fixedCyl(x, h / 2, z, 0.5, h / 2); }
function fountainSpray(w, x, z) {
  if (!w.fx) { w.updaters.push(() => {}); }
  w.updaters.push((dt) => { if (w.fx && Math.random() < 0.6) w.fx.burst(x, 0.4, z, 0xbfe8ff, 2, { speed: 1.2, up: 4.5, life: 0.9, size: 0.25, gravity: -9, bright: 1.2, drag: 0.2 }); void dt; });
}

export function buildIndia(w) {
  w.setSky({ top: "#3a4a8a", mid: "#f0a8a0", bottom: "#ffd8a8", sun: [8, 95], sunColor: "#ffc8a0", sunI: 1.9, hemi: ["#ffd8c8", "#5a5a48", 0.62], fog: [90, 400], clouds: 10, cloudTint: "#ffc8b8" });
  w.ground(M("grass", { args: [153, [90, 140, 70]], repeat: [50, 50] }), 500);
  taj(w, 0, -62);
  // the reflecting pool, its marble edge and the fountains
  w.box(6, 0.3, 64, M("tiles", { args: [155, [240, 236, 228], [220, 214, 206], 4], repeat: [1, 12] }), 0, 0.15, -2, { collide: false });
  w.water(4, 62, 0, 0.25, -2, 0x3a7aa8, { opacity: 0.85 });
  for (let z = -28; z <= 24; z += 8) fountainSpray(w, 0, z);
  // the paths and the four gardens, the cypresses along the pool
  const path = M("paving", { args: [157, [220, 200, 170], 32], repeat: [2, 16] });
  w.box(3, 0.1, 64, path, -4.6, 0.05, -2, { collide: false }); w.box(3, 0.1, 64, path, 4.6, 0.05, -2, { collide: false }); w.box(60, 0.1, 3, path, 0, 0.05, 0, { collide: false });
  for (let z = -26; z <= 26; z += 6.5) { cypress(w, -7, z); cypress(w, 7, z); }
  // the west garden: hedge rows with gaps, lanes between for the guards
  const hedge = M(0x3a6a2a, { rough: 0.95 });
  const rows = [[18, [[-29, -20], [-16, -7]]], [6, [[-29, -12]]], [-6, [[-24, -7]]], [-18, [[-29, -20], [-16, -7]]]];
  for (const [z, spans] of rows) for (const [a, b] of spans) w.box(b - a, 1.6, 1.2, hedge, (a + b) / 2, 0.8, z);
  // the east garden: flower beds and the stack mission's fountain plinth
  for (let i = 0; i < 6; i++) w.box(4, 0.5, 2.5, M([0xff9a2a, 0xffd23f, 0xe83a6a][i % 3], { rough: 0.9 }), 14 + (i % 3) * 6, 0.25, -14 + Math.floor(i / 3) * 24);
  w.cyl(3.2, 3.4, 0.6, M("stone", { args: [159, [236, 230, 220]] }), 20, 0.3, 6, { seg: 24 });
  // the gate at the south end
  const red = M("stone", { args: [161, [170, 70, 50]], repeat: [3, 2] });
  w.box(20, 12, 5, red, 0, 6, 40); w.mesh(new THREE.PlaneGeometry(5, 8), M(0x1a1410), 0, 4, 37.45, { ry: Math.PI, cast: false });
  w.phys.fixedBox(0, 6, 40, 10, 6, 2.5);
  // the hatch to Zero's workshop, hidden in the west garden
  w.box(2.4, 0.12, 2.4, M(0x3a3a42, { metal: 0.8, rough: 0.35 }), -18, 0.06, -24, { collide: false });
  w.sign("Z", 1.2, 1.2, -18, 0.14, -24, 0, { bg: "#2a1030", fg: "#ff9ae8" }).rotation.x = -Math.PI / 2;
  w.floorY = -20;
  const minTop = h => 2 + 26 * h;
  w.missionData = {
    ind1: { start: [-18, 0.1, 26], goal: [-18, 0.1, -24], range: 7, guards: [{ path: [[-28, 12], [-8, 12]], speed: 1.6, pause: 1.2 }, { path: [[-8, 0], [-28, 0]], speed: 1.5, pause: 1.2, phase: 5 }, { path: [[-28, -12], [-8, -12]], speed: 1.7, pause: 1, phase: 2 }],
      route: [[-22, 0.1, 19.8], [-18, 0.1, 19.8], [-14, 0.1, 7.6], [-9.5, 0.1, 7.6], [-9.5, 0.1, 4.4], [-20, 0.1, 4.4], [-26.5, 0.1, 4.4], [-26.5, 0.1, -4.4], [-26.5, 0.1, -7.6], [-20, 0.1, -7.6], [-18, 0.1, -7.6], [-18, 0.1, -16.4], [-18, 0.1, -21]] },
    ind2: { pad: [20, 0.6, 6], padR: 2.6, size: 1.0, blocks: [[12, 0.6, 16], [28, 0.6, 18], [26, 0.6, -4], [12, 0.6, -4], [30, 0.6, 8]] },
    ind3: { title: "WORKSHOP HATCH" },
    ind4: { cells: [...[[-21, -41], [21, -41], [-21, -83], [21, -83]].flatMap(([mx, mz], i) => { const d = Math.hypot(mx, mz + 62), dx = mx / d * 1.6, dz = (mz + 62) / d * 1.6; return [[mx + dx, minTop([0.33, 0.66, 0.97, 0.66][i]) + 1.1, mz + dz]]; }), [-21 - 1.1, minTop(0.97) + 1.1, -83 - 1.1], [21 + 1.1, minTop(0.97) + 1.1, -41 + 1.1], [0, 3.2, -36], [8, 3.2, -36]] },
  };
  // pads beside the minarets up to each balcony
  // the gravity round the minarets has gone weak: pads throw you up and you float to the balconies
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { w.pad(sx * 17.5, 2, -62 + sz * 21, 14, 0xff5ad8); w.zone(sx * 21, 16, -62 + sz * 21, 12.5, 0.22); }
  return { spawn: [0, 0.1, 30], yaw: Math.PI, bolt: [2, 0.1, 29], contact: [-3.5, 0.1, 27, 2.4] };
}
