// The Roman aqueduct, 2,000 years ago: a brand-new aqueduct strides across the valley on tall
// arches, from the spring on the hill in the north-west (where the sluice gates are) to the water
// tower at the edge of the town. The town has a paved forum with a temple and a fountain, white
// houses with red roofs, a bathhouse with an open-air pool, and a walled yard whose gate needs two
// levers at once. The Roman road runs round the fields to the south; the time-sled lands to the
// west, where Livia is waiting.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks } from "./kit.js";
import { timeSled, landFrame, tufts } from "./timekit.js";
import { temple, column, cypress, olive, villa, fountain, aqueduct } from "./antiquekit.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const TOP = 12, SPRING = [-150, 125], LV = -0.4;
const AQ = [[-126, 112], [-80, 90], [-30, 70], [20, 52], [58, 38]];
// the pool sits exactly on the terrain's grid (a vertex every 420/170 m), so the slope between
// the last deep vertex and the first high one is hidden inside its thick stone walls
const CELL = 420 / 170, gx = i => -210 + i * CELL, POOL = [gx(98), gx(79), gx(104), gx(83)], YARD = [-40, 20], LAND = [-84, -16], FORUM = [0, 0];
// the Roman road: a long loop, two straights joined by wide bends; off(x, z) is how far a point
// is from the road's middle line
const RX0 = -25, RX1 = 65, RZ = -60, RR = 24;
const off = (x, z) => Math.abs(Math.hypot(x - Math.max(RX0, Math.min(RX1, x)), z - RZ) - RR);
// flat ground under the buildings: [x0, z0, x1, z1]
const FLAT = [[-18, -14, 18, 24], [26, -20, 64, 0], [-50, 6, -30, 30], [52, 14, 64, 42]];
export function ground(x, z) {
  let h = 0.6 + Math.sin(x * 0.045) * 0.45 + Math.cos(z * 0.05 + 0.3) * 0.4 + Math.sin((x - z) * 0.1) * 0.1;
  h += S(150, 200, Math.abs(x)) * 24 + S(-120, -180, z) * 22 + S(150, 200, z) * 26;
  // the spring's hilltop: a flat top level with the aqueduct's channel
  h = Math.max(h, TOP * S(60, 30, Math.hypot(x - SPRING[0], z - SPRING[1])));
  let f = 0;
  for (const [x0, z0, x1, z1] of FLAT) f = Math.max(f, S(6, 0, Math.max(x0 - x, x - x1, z0 - z, z - z1, 0)));
  f = Math.max(f, S(12, 6, Math.hypot(x - LAND[0], z - LAND[1])));
  // the road's line is levelled too
  f = Math.max(f, S(8, 4, off(x, z)));
  h = h * (1 - f) + 0.6 * f;
  // the pool: deep all the way to its walls
  const [px0, pz0, px1, pz1] = POOL;
  if (x > px0 - 0.05 && x < px1 + 0.05 && z > pz0 - 0.05 && z < pz1 + 0.05) return -4.2;
  return h;
}

export function buildAqueduct(w) {
  w.setSky({ top: "#2a6ac8", mid: "#98c0ea", bottom: "#e8e4d8", sun: [52, 150], sunColor: "#fff2d8", sunI: 2.4, hemi: ["#eef2ff", "#6a6a48", 0.68], fog: [110, 420], clouds: 10 });
  const G = ground;
  w.terrain(420, 170, G, M("grass", { args: [501, [118, 138, 70]], repeat: [80, 80] }));
  w.phys.fixedBox(0, -12, 0, 300, 1, 300); w.floorY = -20;
  w.ocean({ level: LV, size: 420, noSkirt: true, box: [(POOL[0] + POOL[2]) / 2, (POOL[1] + POOL[3]) / 2, 15, 10], shallow: 0x5ac8d8, deep: 0x2a8ab0, under: 0x2a7a9a, clear: 0.7, waves: 0.05 });
  landFrame(w, 210, 0.2, 0x8a9a5a);
  const paving = M("paving", { args: [503, [206, 196, 176]], repeat: [20, 20] });
  w.overlay(0, 0, 60, 60, paving, (x, z) => x > -18 && x < 18 && z > -14 && z < 24, 0.04);
  w.overlay(45, -10, 40, 24, paving, (x, z) => x > 26 && x < 64 && z > -20 && z < 0 && !(x > POOL[0] - 0.2 && x < POOL[2] + 0.2 && z > POOL[1] - 0.2 && z < POOL[3] + 0.2), 0.04);
  w.overlay((RX0 + RX1) / 2, RZ, RX1 - RX0 + 2 * RR + 12, 2 * RR + 12, M("cobble", { args: [505, [150, 144, 132]], repeat: [40, 16] }), (x, z) => off(x, z) < 2.8, 0.05);
  w.mountains(10, 262, 55, { color: 0x6a7a58, snow: false });
  const st = M("stone", { args: [507, [214, 196, 160]], repeat: [3, 2] }), marble = M("stone", { args: [509, [236, 230, 216]], repeat: [4, 4] });

  // ---- the aqueduct, with two broken spans to jump, and the water tower where it ends
  aqueduct(w, AQ, TOP, G, { gaps: [2, 3], gap: 3.2 });
  w.box(6, TOP, 6, st, AQ[4][0], TOP / 2, AQ[4][1]);
  // (steps from the town up the tower's south side)
  w.steps(40, 2.6, TOP / 40, 0.45, st, AQ[4][0], 0, AQ[4][1] - 3 - 40 * 0.45);
  // the spring: a round basin on the hilltop, and the sluice house over the channel's head
  w.cyl(4, 4.2, 1, st, SPRING[0], TOP + 0.5, SPRING[1]);
  w.mesh(new THREE.CircleGeometry(3.6, 24), M(0x3a8ab8, { rough: 0.1, metal: 0.2 }), SPRING[0], TOP + 1.02, SPRING[1], { rx: -Math.PI / 2, cast: false });
  villa(w, AQ[0][0] - 8, TOP, AQ[0][1] + 4, 5, 4, 3, 0.4);
  // fallen stones under the arches
  w.box(2, 1.6, 2, st, -55, G(-55, 80) + 0.8, 80, { ry: 0.4 });

  // ---- the forum: a temple at the north end, colonnades down the sides, the fountain in the middle
  const fy = G(FORUM[0], FORUM[1]);
  temple(w, 0, fy, 18, 4, 5, { spacing: 2.6, h: 5.5, ry: Math.PI, mat: marble });
  for (const sx of [-1, 1]) { for (let i = 0; i < 8; i++) column(w, sx * 15, fy, -10 + i * 3, 4, marble); w.box(1.2, 0.6, 22.6, marble, sx * 15, fy + 4.3, 0.5, { collide: false }); }
  fountain(w, 0, fy, 0, 1.8);
  fountain(w, -24, G(-24, -8), -8, 1.2); fountain(w, 26, G(26, 8), 8, 1.2);
  // ---- houses round the forum, along the streets
  for (const [x, z, r, sx, sz] of [[-26, -24, 0, 8, 6], [-8, -24, 0, 7, 5], [10, -26, 0.1, 8, 6], [-26, 32, Math.PI / 2, 7, 5], [-28, -8, Math.PI / 2, 6, 5], [26, 22, -0.2, 8, 6], [34, 10, Math.PI, 7, 5], [-10, 34, 0.3, 8, 6], [8, 36, -0.2, 7, 5], [70, 4, Math.PI / 2, 8, 6], [72, -24, 0, 7, 5]]) villa(w, x, G(x, z), z, sx, sz, 3.2, r);

  // ---- the bathhouse: the pool with its stone edge and columns, and the bath hall beside it
  const [px0, pz0, px1, pz1] = POOL, pcx = (px0 + px1) / 2, pcz = (pz0 + pz1) / 2;
  // (its walls fill the cell all round, from the floor up to a stone edge you can walk on)
  const WT = CELL, WY = 0.9;
  for (const [x, z, sx, sz] of [[px0 - WT / 2, pcz, WT, pz1 - pz0 + 2 * WT], [px1 + WT / 2, pcz, WT, pz1 - pz0 + 2 * WT], [pcx, pz0 - WT / 2, px1 - px0, WT], [pcx, pz1 + WT / 2, px1 - px0, WT]]) w.box(sx, WY + 4.3, sz, marble, x, (WY - 4.3) / 2, z);
  // steps down into the water at the west end
  for (let i = 0; i < 3; i++) { const top = -0.3 - i * 1.2; w.box(1.2, top + 4.25, pz1 - pz0, marble, px0 + 0.6 + i * 1.2, (top - 4.25) / 2, pcz); }
  for (let i = 0; i < 6; i++) for (const z of [pz0 - WT - 1.2, pz1 + WT + 1.2]) column(w, px0 + 1 + i * 2.8, 0.6, z, 3.6, marble);
  villa(w, 58, 0.6, pcz, 10, 8, 5, Math.PI / 2);

  // ---- the walled yard with the double-lever gate
  const [yx, yz] = YARD, yy = G(yx, yz);
  w.box(16.8, 3.4, 0.8, st, yx, yy + 1.7, yz + 6); w.box(0.8, 3.4, 12, st, yx - 8, yy + 1.7, yz); w.box(0.8, 3.4, 12, st, yx + 8, yy + 1.7, yz);
  for (const s of [-1, 1]) w.box(5.9, 3.4, 0.8, st, yx + s * 5.05, yy + 1.7, yz - 6);
  w.box(5, 0.6, 1, st, yx, yy + 3.7, yz - 6, { collide: false });
  w.box(3, 1, 1.4, st, yx, yy + 0.5, yz + 4.2);
  // the two levers, far apart, on posts
  for (const s of [-1, 1]) { w.cyl(0.15, 0.2, 1.1, st, yx + s * 10, yy + 0.55, yz - 12, { seg: 8 }); w.box(0.12, 0.9, 0.12, M(0x6a4a2a), yx + s * 10, yy + 1.4, yz - 12, { rz: 0.5, collide: false }); }

  // ---- trees: cypresses along the road, olives on the slopes, pines on the far hills
  for (let i = 0; i < 12; i++) { const x = RX0 + i * (RX1 - RX0) / 11, z = RZ - RR - 7; cypress(w, x, G(x, z), z, 8 + (i % 3)); }
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.6, x = (sx < 0 ? RX0 : RX1) + sx * Math.cos(a) * (RR + 7), z = RZ + Math.sin(a) * (RR + 7); cypress(w, x, G(x, z), z, 9); }
  const clear = (x, z) => Math.hypot(x - LAND[0], z - LAND[1]) > 14 && off(x, z) > 9 && !FLAT.some(([x0, z0, x1, z1]) => x > x0 - 8 && x < x1 + 8 && z > z0 - 8 && z < z1 + 8) && Math.hypot(x - SPRING[0], z - SPRING[1]) > 34;
  for (let i = 0; i < 60; i++) { const x = -150 + (i % 12) * 26 + ((i * 7) % 5), z = 40 + Math.floor(i / 12) * 24 + ((i * 3) % 6) - 150 * (i % 2); if (!clear(x, z) || G(x, z) > 6) continue; olive(w, x, G(x, z), z, 4 + (i % 3) * 0.5); }
  for (let i = 0; i < 30; i++) { const a = i * 2.39996, d = 150 + (i * 13) % 40, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) > 195 || Math.abs(z) > 195 || !clear(x, z)) continue; w.pine(x, z, 9 + (i % 3) * 2, { y: G(x, z) }); }
  for (const [x, z] of [[-100, -60], [120, -90], [140, 60], [-120, 40]]) rocks(w, x, z, 4, 5, 1.3, { y: G(x, z), color: [170, 160, 140] });

  // grass tufts on the fields and slopes (not on the paving, the pool or the road)
  const tuftSpots = [];
  for (let i = 0; i < 1400; i++) { const a = i * 2.39996, d = 6 + Math.sqrt(i / 1400) * 150, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9; 
    if (off(x, z) < 3.5 || FLAT.some(([x0, z0, x1, z1]) => x > x0 - 3 && x < x1 + 3 && z > z0 - 3 && z < z1 + 3) || G(x, z) > 10) continue; tuftSpots.push([x, G(x, z), z, 0.8 + (i % 5) * 0.12]); }
  tufts(w, tuftSpots, 0x7a9448);

  // ---- where Rory lands
  const ly = G(LAND[0], LAND[1]);
  timeSled(w, LAND[0] - 5, ly, LAND[1] - 3, 0.3);

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const along = (u) => { const segs = AQ.slice(1).map((p, i) => Math.hypot(p[0] - AQ[i][0], p[1] - AQ[i][1])), L = segs.reduce((a, b) => a + b, 0); let s = u * L, i = 0; while (i < segs.length - 1 && s > segs[i]) s -= segs[i++]; const f = s / segs[i]; return [AQ[i][0] + (AQ[i + 1][0] - AQ[i][0]) * f, TOP + 1.1, AQ[i][1] + (AQ[i + 1][1] - AQ[i][1]) * f]; };
  const ROAD = []; { const L = RX1 - RX0, T = 2 * L + 2 * Math.PI * RR;
    for (let i = 0; i < 28; i++) { let s = i / 28 * T; let p;
      if (s < L) p = [RX0 + s, RZ - RR]; else if ((s -= L) < Math.PI * RR) { const a = -Math.PI / 2 + s / RR; p = [RX1 + Math.cos(a) * RR, RZ + Math.sin(a) * RR]; }
      else if ((s -= Math.PI * RR) < L) p = [RX1 - s, RZ + RR]; else { s -= L; const a = Math.PI / 2 + s / RR; p = [RX0 + Math.cos(a) * RR, RZ + Math.sin(a) * RR]; }
      ROAD.push(p); } }
  w.missionData = {
    aq1: { cells: [0.04, 0.16, 0.3, 0.42, 0.55, 0.68, 0.82, 0.97].map(along) },
    aq2: { title: "THE SLUICE GATES" },
    aq3: { title: "THE TOWN FOUNTAINS" },
    aq4: { cells: [[40, -3.4, -12], [44, -3.6, -8], [45.8, -3.5, -13], [38, -3.2, -7], [42, -3.6, -10]], floor: -4.2 },
    aq5: { plates: [[yx - 10, yy, yz - 15], [yx + 10, yy, yz - 15]], doors: [{ at: [yx, yy + 1.7, yz - 6], size: [4.3, 3.4, 0.7], need: [0, 1], latch: true }], goal: [yx, yy, yz + 1] },
    aq6: { what: "cart", path: ROAD, y: 0.3, car: "cart", quarry: "cart", quarryOpts: { color: 0x2a1a3a, trim: 0xe8c070, horse: 0x1a1a1a }, driver: "hourglass", lead: 24 },
  };
  return {
    spawn: on(LAND[0], LAND[1] + 4, 0.1), yaw: 0, pebble: on(LAND[0] + 2, LAND[1] + 5, 0), contact: [...on(LAND[0] + 6, LAND[1] + 7, 0), Math.PI],
    // the golden ammonites: by the spring on the hill, at the bottom of the pool, on a fallen stone under the arches
    stars: [[SPRING[0] - 6, TOP + 0.3, SPRING[1] + 7], [45.8, -3.8, -6.2], [-55, G(-55, 80) + 1.9, 80]],
    at: { aq1: [AQ[4][0], AQ[4][1] - 26], aq2: [AQ[0][0] - 6, AQ[0][1] - 4, 40], aq3: [4, -4], aq4: [px0 - WT - 2, pcz], aq5: [yx, yz - 18], aq6: [ROAD[0][0] - 3, ROAD[0][1] - 5] },
  };
}
