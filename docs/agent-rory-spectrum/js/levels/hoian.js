// Hội An, Vietnam: the lantern town on the river, on festival night. Yellow
// shophouses hung with silk lanterns, paper lantern boats on the water, the
// covered Japanese Bridge, the market on the far bank, and sky lanterns
// drifting up over the roofs.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, lampAt, treeAt, palmAt, fish } from "../seakit.js";
import { houseRow, lantern, lanternString, lanternBoat, stall, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("sunset");
  const LAND = 1.2;
  // the river runs along x through the middle of the town
  const f = (x, z) => {
    let h = shoreProfile(7 - Math.abs(z), { land: LAND, beach: 5, depth: -4, slope: 7, water: 0.2 });
    if (Math.abs(x) > 70) h += (Math.abs(x) - 70) * 0.2;
    return h;
  };
  w.terrain(320, 140, f, M("paving", { args: [7, [190, 170, 140], 40], repeat: [60, 60], normal: 0.5 }));
  w.mountains(10, 240, 40, { seed: 15, snow: false, color: 0x4a5a5a });
  w.ocean({ level: 0, box: [0, 0, 320, 60], shallow: 0x3a6a5a, deep: 0x1a3a3a, under: 0x1a4a40, see: 14, waves: 0.3, foam: 0.4, size: 400 });
  const quay = M("stone", { args: [14, [170, 150, 120]], repeat: [8, 1] });
  // the quays either bank, with steps down to the water
  for (const s of [-1, 1]) { w.box(150, 1.4, 4, quay, 0, LAND - 0.7 + 0.2, s * 11.5); w.steps(4, 3, 0.3, 0.6, quay, s * -20, LAND - 1.0, s * 9.4, s > 0 ? Math.PI : 0); }
  // the old town on the north bank: yellow shophouses with tiled roofs, facing the river
  const yellows = [0xf0c040, 0xe8b030, 0xf4d060, 0xd8a838];
  houseRow(w, -56, -20, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(i => ({ w: 8, h: 5 + (i % 2) * 1.5, d: 8, color: yellows[i % 4], door: 0x6a3a1a, trim: 0x8a4a2a, roof: i < 5 ? "flat" : "pitched", roofColor: [90, 70, 60], flowers: false })), { seed: 300 });
  // pads in the street to bounce onto the flat roofs, and on the quay ends of the bridge for its roof
  for (const x of [-44, -36, -28]) w.pad(x, LAND, -14.7, Math.sqrt(31 * 8.5), 0xff8a2a);
  houseRow(w, -40, -34, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ w: 8, h: 6 + (i % 3), d: 8, color: yellows[(i + 2) % 4], door: 0x2a4a6a, trim: 0x8a4a2a, roofColor: [90, 70, 60], flowers: false })), { seed: 320 });
  // lanterns everywhere: strings across the street, and a few on posts
  const LC = [0xff3a3a, 0xffd23f, 0xff8a2a, 0x3ad06a, 0xff8ac8, 0x9a4aff];
  for (let i = 0; i < 7; i++) lanternString(w, -52 + i * 16, -13.6, -40 + i * 16, -13.6, LAND + 4.4, 7, LC);
  for (let i = 0; i < 5; i++) lanternString(w, -36 + i * 16, -27.5, -24 + i * 16, -27.5, LAND + 4.6, 7, LC);
  for (const [x, z] of [[-48, -14], [-24, -14], [0, -14], [24, -14], [48, -14], [-30, -28], [10, -28], [40, -28]]) lampAt(w, x, z, 3.8, 0xffb060, { ei: 2.5 });
  // the lit lanterns that still have their colour, on posts by the river
  const LIT = [[-30, -12.4], [-4, -12.4], [22, -12.4], [46, -12.4]];
  LIT.forEach(([x, z], i) => { w.cyl(0.06, 0.06, 3.4, M(0x3a2a1a), x, LAND + 1.7, z, { seg: 6 }); lantern(w, x, LAND + 3.6, z, LC[i], { r: 0.45, light: 3 }); });
  // the Japanese Bridge: a covered wooden bridge over the river to the west
  const wood = M("wood", { args: [35, [140, 80, 50]], repeat: [2, 6] }), red = M(0xb83a2a, { rough: 0.7 });
  const BX = -22;
  w.box(5, 0.5, 26, wood, BX, LAND + 0.2, 0);
  w.pad(BX - 4.2, 1.4, -11.5, Math.sqrt(31 * 5.5), 0xff8a2a); w.pad(BX + 4.2, 1.4, 11.5, Math.sqrt(31 * 5.5), 0xff8a2a);
  for (const s of [-1, 1]) for (let i = -10; i <= 10; i += 5) w.box(0.3, 3.2, 0.3, red, BX + s * 2.3, LAND + 2.4, i);
  w.box(6.4, 0.4, 28, M("roof", { args: [8, [80, 60, 60]], repeat: [2, 6] }), BX, LAND + 4.2, 0, { collide: false });
  w.box(7.2, 0.2, 29, M("roof", { args: [8, [80, 60, 60]], repeat: [2, 6] }), BX, LAND + 4.05, 0, { collide: false });
  for (let i = -8; i <= 8; i += 8) { lantern(w, BX - 2.6, LAND + 3.4, i, 0xff3a3a, { r: 0.28, string: 0.4 }); lantern(w, BX + 2.6, LAND + 3.4, i, 0xffd23f, { r: 0.28, string: 0.4 }); }
  w.sign("CHÙA CẦU", 2.6, 0.7, BX, LAND + 4.9, 14.4, 0, { bg: "#3a1a10", fg: "#ffd8a0" });
  for (const s of [-1, 1]) w.cyl(0.4, 0.5, 6, M(0x8a5a2a), BX + s * 2.2, LAND - 2, s * 9, { seg: 8, collide: false });
  // lantern boats on the water
  for (let i = 0; i < 24; i++) lanternBoat(w, -60 + i * 5.2 + (i % 3), (i % 2 ? 2.5 : -2.5) + Math.sin(i) * 1.5, LC[i % 6]);
  // the market on the south bank: stalls of fruit under striped awnings
  const STALLS = [[-10, 20, 0], [0, 20, 0], [10, 20, 0], [-10, 30, Math.PI], [0, 30, Math.PI], [10, 30, Math.PI], [22, 25, Math.PI / 2], [-22, 25, -Math.PI / 2]];
  STALLS.forEach(([x, z, ry], i) => stall(w, x, z, ry, { awning: LC[i % 6], goods: [[0xff5a8a, 0xffd23f, 0x3ad06a], [0xff8a2a, 0xd83a2a, 0xffe8a0], [0x9a4aff, 0xff8ac8, 0x3ad06a]][i % 3] }));
  houseRow(w, 44, 40, Math.PI, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ w: 8, h: 5 + (i % 2), d: 7, color: yellows[(i + 1) % 4], door: 0x6a3a1a, trim: 0x8a4a2a, roofColor: [90, 70, 60], flowers: false })), { seed: 340 });
  for (const [x, z] of [[-30, 36], [30, 36], [-36, 18], [36, 18]]) palmAt(w, x, z, 7);
  for (const [x, z] of [[-50, -44], [56, -44], [60, 30]]) treeAt(w, x, z, 6, { color: 0x3a7a3a });
  fish(w, 20, -1.5, 0, 10, 24, 0xffb040);

  const rt = (i, row) => (row === 0 ? 5 + (i % 2) * 1.5 : 6 + (i % 3)); // roof heights of the rows
  const H = (x, z, dy = 1.1) => [x, f(x, z) + dy, z];
  w.missionData = {
    ha1: { spots: LIT.map(([x, z], i) => [x + 1.3, LAND + 0.2, z, LC[i], 9]) },
    ha2: { path: [[-14, -3], [10, -3], [40, -3], [60, 0], [40, 3], [10, 3], [-14, 3], [-18, 0]], boat: "jetski", quarry: "motorboat", exit: [-10, LAND + 0.3, -10, 0], lead: 34 },
    ha3: { start: [30, LAND + 1.5, -12], ceiling: 34, rings: [[30, 8, -18, 2.2, 0], [22, 12, -24, 2.2, 0.4], [10, 14, -28, 2.4, 0.6], [-4, 12, -22, 2.2, 0.2], [-14, 15, -30, 2.4, 0.5], [-24, 11, -20, 2.2, 0], [-30, 9, -8, 2.4, 0.9], [-18, 14, 4, 2.2, 0.5], [0, 12, 2, 2.4, 0], [14, 9, -8, 2.2, 0.3]] },
    ha4: { cells: [[BX, LAND + 1.55, 0], [BX, LAND + 1.55, -8], [BX, LAND + 1.55, 8], [BX - 1.5, LAND + 5.5, -8], [BX + 1.5, LAND + 5.5, 8], [BX, LAND + 5.5, 0], ...[[-44, -19], [-36, -19], [-28, -19]].map(([x, z], i) => [x, LAND + rt(i + 1, 0) + 1.5, z])] },
    ha5: { area: [0, 25, 12], bots: [[-6, LAND, 25], [6, LAND, 25], [-14, LAND, 17], [14, LAND, 33], [0, LAND, 35], [16, LAND, 20]] },
  };
  void groundAt; void THREE;
  return { spawn: [0, LAND + 0.3, -12], yaw: 0, bolt: [2, LAND + 0.3, -13], contact: [-4, LAND + 0.2, -11, 0.8] };
}
