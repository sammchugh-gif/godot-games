// The Maldives: a resort island in a turquoise lagoon, a jetty running out to
// the water villas, and to the east a scatter of brand-new sandbanks poking out
// of the sea, each with Undertow's pipes sticking out of it. West of the jetty
// a blue hole drops away to the mantas' cleaning station, where a pump hums on
// the floor; the seaplane dock floats beside it.
import * as THREE from "three";
import { M } from "../tex.js";
import { coral } from "./kit.js";
import { roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildMaldives(w) {
  w.setSky({ top: "#1470d8", mid: "#86d0f4", bottom: "#e0f8f8", sun: [64, 170], sunColor: "#fffaec", sunI: 2.55, hemi: ["#d4f0ff", "#5a9aa0", 0.7], fog: [160, 620], clouds: 20 });
  const LV = 0, Y = 1.6;
  const ISLE = [0, 32, 24], HOLE = [-40, -46, 16];
  const BANKS = [[45, -30, 7], [60, -46, 6], [75, -32, 6.5], [89, -48, 6], [101, -30, 7], [63, -63, 5.5], [80, -66, 6], [97, -62, 5]];
  const h = (x, z) => {
    // the lagoon floor, deeper in the channels between the sandbanks
    let y = -1.8 + Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.3 - 1.8 * S(28, 40, x) * S(120, 110, x) * S(-4, -14, z) * S(-84, -74, z);
    // the resort island and its beach
    const di = Math.hypot(x - ISLE[0], (z - ISLE[1]) * 1.3);
    y = Math.max(y, -1.8 + 4.2 * S(ISLE[2] + 6, ISLE[2] - 10, di));
    // the new sandbanks
    for (const [bx, bz, r] of BANKS) { const d = Math.hypot(x - bx, z - bz); if (d < r + 4) y = Math.max(y, -3.6 + 4.3 * S(r + 3, r * 0.4, d)); }
    // the blue hole
    const dh = Math.hypot(x - HOLE[0], z - HOLE[1]);
    if (dh < HOLE[2] + 2) y = Math.min(y, -18 + 16.4 * S(HOLE[2] * 0.5, HOLE[2], dh));
    // the ocean outside the atoll
    const da = Math.hypot(x - 20, z + 20);
    if (da > 150) y = Math.min(y, -1.8 - (da - 150) * 0.8);
    return y;
  };
  w.terrain(460, 230, h, M("sand", { args: [13, [236, 228, 204]], repeat: [100, 100] }));
  w.ocean({ level: LV, box: [20, -30, 260, 200], shallow: 0x48e8d8, deep: 0x0a4a9a, under: 0x1a90b8, clear: 0.85, waves: 0.45, caustics: 8, see: 50 });
  w.overlay(0, 32, 64, 50, M("grass", { args: [31, [96, 150, 70]], repeat: [14, 11] }), (x, z) => h(x, z) > 1.4, 0.05);

  // ---- the island: palms, a beach bar, the pump control hut
  for (let k = 0; k < 26; k++) { const a = k * 2.399, r = 4 + (k % 7) * 2.6, x = ISLE[0] + Math.cos(a) * r * 1.3, z = ISLE[1] + Math.sin(a) * r; if (h(x, z) < 0.6 || (Math.abs(x) < 3 && z < 20)) continue; w.palm(x, z, 6 + (k % 4), { y: h(x, z) - 0.2 }); }
  const thatch = M(0xc8a060, { rough: 0.95 }), timber = M("wood", { args: [8, [150, 110, 70]] });
  const hut = (x, y, z, wd, dp, ry = 0) => {
    w.box(wd, 2.6, dp, M(0xf4ecdc, { rough: 0.8 }), x, y + 1.3, z, { ry });
    const roof = w.mesh(new THREE.ConeGeometry(Math.max(wd, dp) * 0.8, 2, 4), thatch, x, y + 3.6, z, { ry: ry + Math.PI / 4 });
    roof.scale.set(wd / Math.max(wd, dp), 1, dp / Math.max(wd, dp));
  };
  hut(10, h(10, 30), 30, 6, 4, 0.3);
  w.sign("BEACH BAR", 3, 0.6, 10.9, h(10, 30) + 2.2, 27.9, Math.PI + 0.3, { bg: "#1a6a8a", fg: "#ffffff" });
  hut(-10, h(-10, 34), 34, 4, 4, -0.2);
  w.sign("PUMP CONTROL", 3.4, 0.6, -9.6, h(-10, 34) + 2.2, 31.95, Math.PI - 0.2, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.5 });

  // ---- the jetty and the water villas on their stilts
  const deckM = M("wood", { args: [9, [176, 140, 100]], repeat: [1, 10] });
  const walk = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    w.box(2.4, 0.3, len, deckM, mx, Y - 0.15, mz, { ry });
    for (let t = 0; t <= len; t += 4) for (const s of [-1, 1]) { const px = x0 + (x1 - x0) * t / len + Math.cos(ry) * s * 1.1, pz = z0 + (z1 - z0) * t / len - Math.sin(ry) * s * 1.1; w.cyl(0.1, 0.1, Y + 3, timber, px, (Y - 3) / 2, pz, { seg: 6, collide: false }); }
  };
  walk(0, 17, 0, -40); walk(-1.2, -20, -30, -20); walk(1.2, -38, 30, -38);
  const villa = (x, z, side) => {
    const vz = z + side * 3.4;
    w.box(5, 0.3, 4.4, deckM, x, Y - 0.15, vz);
    w.box(3.6, 2.4, 3, M(0xf4ecdc, { rough: 0.8 }), x, Y + 1.2, vz + side * 0.6);
    const roof = w.mesh(new THREE.ConeGeometry(3.2, 1.8, 4), thatch, x, Y + 3.3, vz + side * 0.6, { ry: Math.PI / 4 }); roof.scale.set(1.1, 1, 1);
    for (const [ox, oz] of [[-2.3, -2], [2.3, -2], [-2.3, 2], [2.3, 2]]) w.cyl(0.12, 0.12, 4, timber, x + ox, Y - 2, vz + oz, { seg: 6, collide: false });
  };
  for (const x of [-9, -17, -25]) { villa(x, -20, 1); villa(x, -20, -1); }
  for (const x of [9, 17, 25]) { villa(x, -38, 1); villa(x, -38, -1); }
  w.sign("WATER VILLAS", 3.4, 0.6, 1.3, Y + 1.4, -5, Math.PI / 2, { bg: "#1a6a8a", fg: "#ffffff" });

  // ---- the sandbanks and Undertow's pipes
  const pipeM = M(0x7a848e, { metal: 0.7, rough: 0.4 }), valveM = M(0xd83a3a, { metal: 0.3 });
  const tops = BANKS.map(([x, z, r], i) => {
    const px = x + r * 0.35, pz = z - r * 0.25, py = h(px, pz);
    w.cyl(0.35, 0.4, 1.4, pipeM, px, py + 0.5, pz, { seg: 12 });
    w.cyl(0.5, 0.5, 0.15, valveM, px, py + 1.25, pz, { seg: 12 });
    if (i % 2 === 0) w.cyl(0.25, 0.25, 3, pipeM, px - 1.2, py + 0.2, pz, { rz: Math.PI / 2, seg: 10 });
    return [x, h(x, z), z];
  });
  // the sluice gate by the beach: the pipes from the sandbanks come ashore here
  w.box(4, 2.2, 1.2, M("paving", { args: [51, [184, 180, 170], 64] }), 12, 0.8, 16);
  for (const dx of [-1.2, 1.2]) w.cyl(0.4, 0.4, 8, pipeM, 12 + dx, 0.2, 11.5, { rx: Math.PI / 2, seg: 12, collide: false });
  w.box(3, 0.4, 0.3, valveM, 12, 2.1, 16.7);

  // ---- the blue hole: coral round its rim, the cleaning station and the pump on its floor
  let seed = 5;
  for (let k = 0; k < 40; k++) { const a = k * 0.7 + (k % 3) * 0.2, r = HOLE[2] * (0.62 + (k % 5) * 0.1), x = HOLE[0] + Math.cos(a) * r, z = HOLE[1] + Math.sin(a) * r, y = h(x, z); if (y > -1.4) continue; coral(w, x, y, z, 0.9 + (k % 4) * 0.4, seed++); }
  const fy = h(HOLE[0], HOLE[1]);
  w.cyl(2.2, 2.8, 3, M("rock", { args: [92, [140, 120, 110]] }), HOLE[0], fy + 1.5, HOLE[1], { seg: 10 });
  w.cyl(1, 1.2, 4, M("metal", { args: [10, [80, 92, 104], 64] }), HOLE[0], fy + 5, HOLE[1], { seg: 16 });
  w.cyl(1.25, 1.25, 0.3, M(0x39c0ff, { emissive: 0x39c0ff, ei: 1.6 }), HOLE[0], fy + 6.2, HOLE[1], { seg: 16, collide: false });
  for (let k = 0; k < 3; k++) roam(w, "manta", { cx: HOLE[0], cz: HOLE[1], rx: 8 + k * 2, rz: 7 + k * 2, y: fy + 6 + k * 3, dy: 0.8, period: 30 + k * 8, phase: k * 2, dir: k % 2 ? -1 : 1, scale: 1.3 });
  w.vent(HOLE[0] + 6, h(HOLE[0] + 6, HOLE[1] + 3), HOLE[1] + 3, 20); w.vent(HOLE[0] - 5, h(HOLE[0] - 5, HOLE[1] - 5), HOLE[1] - 5, 20);
  school(w, HOLE[0], fy + 9, HOLE[1], 60, 6, 0xf0e03a);

  // ---- the seaplane dock, a floating platform with a windsock
  w.box(10, 0.8, 6, deckM, -40, 0.4, -5);
  w.cyl(0.06, 0.06, 4, M(0xd8d8d8, { metal: 0.6 }), -44, 2.8, -7, { seg: 6, collide: false });
  w.cone(0.35, 1.4, M(0xff7a1a), -43.3, 4.5, -7, { rz: -Math.PI / 2 });
  w.sign("SEAPLANES", 3, 0.6, -40, 1.4, -1.95, 0, { bg: "#1a6a8a", fg: "#ffffff" });

  // ---- life in the lagoon: turtles, reef sharks' little cousins, shoals over the sand
  roam(w, "seaturtle", { cx: 20, cz: -15, rx: 14, rz: 8, y: -1.1, dy: 0.2, period: 60 });
  school(w, 10, -1, -26, 40, 4, 0x3ae0ff); school(w, 70, -2.2, -50, 50, 6, 0xffb03a); school(w, 30, 8, 20, 14, 8, 0xf8f8f8);
  w.floorY = -30;

  const T = tops, pearl = (t, up = 0.9) => [t[0], t[1] + up, t[2]];
  const b2 = BANKS[2], pipeTop = [b2[0] + b2[2] * 0.35, h(b2[0] + b2[2] * 0.35, b2[1] - b2[2] * 0.25) + 2.2, b2[1] - b2[2] * 0.25];
  w.missionData = {
    mal1: { cells: [pearl(T[0]), pearl(T[1]), [pipeTop[0], pipeTop[1], pipeTop[2]], pearl(T[3]), pearl(T[4]), pearl(T[5]), pearl(T[6]), pearl(T[7])] },
    mal2: { title: "LAGOON SLUICES" },
    mal3: { cells: [[HOLE[0] + 4, -8, HOLE[1] + 6], [HOLE[0] - 6, -10, HOLE[1] + 2], [HOLE[0] + 2, fy + 1.2, HOLE[1] - 5], [HOLE[0] - 3, fy + 1.2, HOLE[1] + 4], [HOLE[0] + 5, -13, HOLE[1] - 2], [HOLE[0] - 1, fy + 8, HOLE[1] - 1], [HOLE[0] - 7, -6, HOLE[1] - 6], [HOLE[0] + 1, -4, HOLE[1] + 9]], floor: -20 },
    mal4: { area: [0, -28, 22], lanes: [[0, -4, 0, -38, Y], [-2, -20, -29, -20, Y], [2, -38, 29, -38, Y]], bots: [[0, Y, -6], [0, Y, -30], [-10, Y, -20], [-24, Y, -20], [12, Y, -38], [24, Y, -38]] },
    mal5: { title: "ISLAND PUMPS" },
    mal6: { ride: "jetski", quarry: "seaplane", exit: [-40, 1, -5], path: [[-30, -12], [20, -20], [60, -5], [125, -20], [120, -70], [60, -90], [0, -80], [-40, -70]] },
  };
  return {
    spawn: [4, h(4, 22), 22], yaw: Math.PI, bolt: [6, h(6, 22), 22], contact: [1, h(1, 24), 24, Math.PI * 0.85],
    at: { mal1: [26, -38], mal2: [14, 21], mal3: [-26, -20], mal4: [0, -10], mal5: [-8, 29], mal6: [-40, -5] },
  };
}
