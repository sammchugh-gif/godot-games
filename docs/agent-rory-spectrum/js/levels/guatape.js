// Guatapé, Colombia: the most painted town in the world, on a lake. Streets
// of houses with zócalos (pictures painted along the bottom of every wall),
// the promenade, the boat yard, and El Peñol, the great rock with its
// staircase zigzagging up to the top.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, rocks, jetty, mooredBoat, buoy, fish, gulls, lampAt, treeAt, crateStack, palmAt } from "../seakit.js";
import { houseRow, paintedHouse, lanternString } from "../kit.js";

export function build(w) {
  w.setSky("tropical");
  const LAND = 1.6;
  const ROCK = [38, -26];
  const f = (x, z) => {
    let h = shoreProfile(z, { land: LAND, beach: 10, depth: -9, slope: 34, water: 0.3 });
    // the lake wraps round to the east too
    h = Math.min(h, shoreProfile(x - 64, { land: LAND, beach: 10, depth: -9, slope: 34, water: 0.3 }));
    if (z < -50) h += (-50 - z) * 0.2;
    return h;
  };
  w.terrain(360, 150, f, M("grass", { args: [5, [92, 140, 62]], repeat: [54, 54], normal: 0.5 }));
  w.mountains(12, 260, 55, { seed: 6, snow: false, color: 0x4a6a4a });
  w.ocean({ level: 0, box: [30, 40, 260, 260], shallow: 0x3ab0a0, deep: 0x0a4a5a, under: 0x0e5a5a, see: 20 });
  const cobble = M("cobble", { args: [8, [150, 140, 128]], repeat: [30, 6] }), stone = M("stone", { args: [12, [160, 150, 136]], repeat: [6, 1], normal: 1.2 });
  // the promenade along the shore, and the plaza
  w.box(90, 0.6, 8, stone, -4, LAND - 0.3 + 0.3, -3, { collide: false }); w.phys.fixedBox(-4, LAND - 0.15, -3, 45, 0.3, 4);
  w.box(90, 0.1, 8, cobble, -4, LAND + 0.32, -3, { collide: false });
  w.box(30, 0.1, 30, M("tiles", { args: [9, [220, 214, 200], [140, 60, 40], 6], repeat: [8, 8] }), -6, LAND + 0.06, -22, { collide: false });
  jetty(w, -10, 1, 20, 0, { y: 1.6, w: 3, rail: true });
  // the streets of zócalo houses: two rows facing the plaza and one along the promenade
  const Z = [0xd83a2a, 0xffd23f, 0x2a8ad8, 0x3ad06a, 0xff8a2a, 0x9a4aff, 0xff8ac8, 0x3ad0d0];
  houseRow(w, -28, -42, 0, [0, 1, 2, 3, 4, 5, 6].map(i => ({ w: 6.5, h: 6 + (i % 3), color: [0xf4f0e0, 0xffe8a0, 0xf4d0c0, 0xd8f0ff][i % 4], zocalo: Z[i % 8], door: Z[(i + 3) % 8], trim: Z[(i + 5) % 8] })), { seed: 200 });
  houseRow(w, 20, -14, Math.PI, [0, 1, 2, 3, 4, 5].map(i => ({ w: 6.5, h: 6 + ((i + 1) % 3), color: [0xffe8a0, 0xf4f0e0, 0xd8f0ff, 0xf4d0c0][i % 4], zocalo: Z[(i + 2) % 8], door: Z[(i + 6) % 8], trim: Z[(i + 1) % 8] })), { seed: 220 });
  houseRow(w, -36, -14, Math.PI / 2, [0, 1, 2, 3].map(i => ({ w: 6.5, h: 6 + (i % 2), color: [0xf4d0c0, 0xffe8a0][i % 2], zocalo: Z[(i + 4) % 8], door: Z[(i + 1) % 8], trim: Z[(i + 7) % 8] })), { seed: 240 });
  paintedHouse(w, -6, -60, 12, 12, 10, 0, { color: 0xf4f0e0, door: 0x8a4a2a, trim: 0xd83a2a, seed: 260, roofColor: [150, 70, 50], flowers: false });
  w.box(2.4, 6, 2.4, M(0xf4f0e0), 0, LAND + 15, -60); w.cone(1.5, 2.2, M(0xd83a2a), 0, LAND + 19, -60);
  for (const [x, z] of [[-26, -0.5], [-14, -0.5], [-2, -0.5], [10, -0.5], [22, -0.5], [34, -0.5], [-20, -30], [8, -30]]) lampAt(w, x, z, 4.2, 0xffe0a0);
  lanternString(w, -26, -8, 10, -8, LAND + 4.8, 12, [0xd83a2a, 0xffd23f, 0x2a8ad8, 0x3ad06a]);
  for (const [x, z] of [[-44, -26], [-48, -50], [30, -50], [52, -8], [-40, 4]]) palmAt(w, x, z, 7);
  for (const [x, z] of [[-14, -22], [2, -22]]) treeAt(w, x, z, 5, { color: 0x3a8a3a });
  // El Peñol: tiers of rock with a staircase winding up, and the lookout on top
  const rock = M("stone", { args: [31, [110, 104, 100]], repeat: [4, 2], normal: 1.4 });
  const tiers = [[13, 4], [10.5, 4], [8.2, 4], [6.2, 4], [4.6, 4], [3.4, 4]];
  const A0 = []; { let a = 0.4; for (const [r] of tiers) { A0.push(a); a += 7 / (r + 1.1) + 0.8; } }
  let ty = f(ROCK[0], ROCK[1]);
  const [rx, rz] = ROCK;
  tiers.forEach(([r, h], i) => {
    w.cyl(r, r, h, rock, rx, ty + h / 2, rz, { seg: 20 });
    // the stairs from this ledge up to the next, spiralling round the side
    const a0 = A0[i], sr = r + 1.1, n = 10, rise = h / n;
    for (let k = 0; k < n; k++) { const ak = a0 + k * 0.7 / sr; w.box(2.2, rise * (k + 1), 0.72, stone, rx + Math.cos(ak) * sr, ty + rise * (k + 1) / 2, rz + Math.sin(ak) * sr, { ry: -ak }); }
    for (let k = 0; k <= n; k += 2) { const ak = a0 + k * 0.7 / sr; w.cyl(0.05, 0.05, 1, M(0xf4f0e0), rx + Math.cos(ak) * (sr + 1.15), ty + rise * k + 0.5, rz + Math.sin(ak) * (sr + 1.15), { seg: 5, collide: false }); }
    ty += h;
  });
  w.cyl(3.3, 3.3, 0.2, stone, rx, ty + 0.1, rz, { seg: 24 });
  w.sign("EL PEÑOL · 740 STEPS", 3, 0.7, rx, ty + 2.4, rz + 4.3, 0, { bg: "#1a2a1a", fg: "#ffe8a0" });
  for (const a of [0, 1.5, 3, 4.5]) w.cyl(0.06, 0.06, 1.1, M(0xf4f0e0), rx + Math.cos(a) * 3.1, ty + 0.85, rz + Math.sin(a) * 3.1, { seg: 5, collide: false });
  // the boat yard to the west: hulls on trestles, crates, a shed
  w.box(12, 5, 9, M("metal", { args: [4, [140, 130, 120]], repeat: [3, 1] }), -46, LAND + 2.5, -20, { ry: 0.2 });
  w.sign("ASTILLERO", 3, 0.7, -46, LAND + 4.3, -15.4, 0.2, { bg: "#1a2a4a", fg: "#ffd23f" });
  for (const [x, z, ry, c] of [[-56, -6, 0.3, 0xd83a2a], [-50, -2, -0.4, 0x2a8ad8], [-62, 0, 1.0, 0xffd23f]]) mooredBoat(w, "motorboat", x, z, ry, { y: LAND, aground: true, lean: 0.2, color: c });
  crateStack(w, -40, LAND, -8, 2); crateStack(w, -58, LAND, -14, 3);
  mooredBoat(w, "speedboat", -26, 12, 0.5, { color: 0xf4f0e0 }); mooredBoat(w, "motorboat", 8, 14, -0.3, { color: 0xd83a2a });
  buoy(w, 20, 36); buoy(w, -30, 44, 0xffd23f); buoy(w, 60, 30, 0x2ab8c8); buoy(w, 76, -20, 0xd83a2a);
  rocks(w, [[-70, 0.4, 10, 3], [70, 0.3, 4, 2.6], [78, -0.4, -40, 3], [-64, 1.2, -30, 2.2]]);
  fish(w, 0, -3, 40, 10, 30, 0xffb040); gulls(w, 0, 18, 10, 6);

  const H = (x, z, dy = 1.1) => [x, f(x, z) + dy, z];
  const rt = ty;
  // the drops climb El Peñol: one on each ledge, the rest on top
  const ledges = []; let ly = f(rx, rz); tiers.forEach(([r, h], i) => { ly += h; if (!tiers[i + 1]) return; const a = A0[i] + 7 / (r + 1.1) + 0.35, lr = tiers[i + 1][0] + 1.0; ledges.push([rx + Math.cos(a) * lr, ly + 1.1, rz + Math.sin(a) * lr]); });
  w.missionData = {
    gt1: { spots: [[-25.5, LAND, -37.4, 0xd83a2a, 9], [-6, LAND, -37.4, 0x2a8ad8, 9], [14, LAND, -18.6, 0xffd23f, 9], [-31.4, LAND, -24, 0x3ad06a, 9]] },
    gt2: { cells: [H(26, -9), H(26, -16, 2.2), ...ledges, [rx + Math.cos(A0[5] + 7 / 4.5) * 2.4, rt + 1.3, rz + Math.sin(A0[5] + 7 / 4.5) * 2.4], [rx, rt + 1.3, rz]] },
    gt3: { path: [[0, 20], [30, 28], [56, 38], [80, 26], [84, -4], [74, -30], [60, 10], [40, 8], [20, 12]], boat: "speedboat", quarry: "motorboat", exit: [-14, LAND + 0.4, -4, 0], lead: 30 },
    gt4: { gates: [[-20, -3, 0.2], [-8, -3, 0], [4, -3, 0], [16, -3, -0.2], [28, -3, 0.3], [38, -3, 0.5]].map(([x, z, r]) => [x, LAND + 0.32, z, r]) },
    gt5: { area: [-48, -8, 9], bots: [[-44, LAND, -4], [-54, LAND, -10], [-40, LAND, -12], [-58, LAND, -4], [-50, LAND, -14], [-36, LAND, -2]] },
  };
  return { spawn: [-6, LAND + 0.5, -4], yaw: Math.PI, bolt: [-4, LAND + 0.5, -3], contact: [-12, LAND + 0.4, -5, 0.6] };
}
void THREE;
