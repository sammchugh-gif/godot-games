// The Viking fjord, 1,000 years ago: a long arm of the sea between mountains that drop straight
// into it, dark with pines. Sigrid's village is on the flat east shore: turf-roofed longhouses,
// the boathouse with the sail loft, a jetty, the rune stones on their knoll and grandad's lookout
// cairn on the point. At the head of the fjord is a wide sandy beach (where the Sand Serpent
// rises). Skerries break the water down the middle; the open sea is away to the south.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks } from "./kit.js";
import { timeSled, tufts } from "./timekit.js";
import { longhouse, runeStone, birch } from "./antiquekit.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const FX = -20, FW = 30, BEACH = [-20, 138], LAND = [70, -30], BH = [26, 44], RUNES = [74, 32], CAIRN = [60, -58];
export function ground(x, z) {
  let h = 1.6 + Math.sin(x * 0.06) * 0.3 + Math.cos(z * 0.05) * 0.3 + Math.sin((x + z) * 0.13) * 0.1;
  // the mountains: straight up from the west shore, behind the village, and behind the beach
  // (with ridges and gullies running down them, so they read as mountains and not as walls)
  const rid = 1 + 0.22 * Math.sin(z * 0.05 + 0.4) + 0.12 * Math.sin(z * 0.17 + x * 0.09) + 0.08 * Math.sin(x * 0.21);
  h += (S(-54, -84, x) * 58 + S(104, 140, x) * 52) * rid + S(166, 200, z) * 46 * (1 + 0.2 * Math.sin(x * 0.06) + 0.1 * Math.sin(x * 0.19 + 1));
  h += S(-58, -76, x) * (5 * Math.sin(z * 0.11) + 3 * Math.sin(z * 0.29 + 1)) + S(108, 126, x) * (4 * Math.sin(z * 0.13 + 2) + 3 * Math.sin(z * 0.31));
  // the rune stones' knoll
  h += 1.4 * S(9, 3, Math.hypot(x - RUNES[0], z - RUNES[1]));
  // the beach at the head: flat sand just above the water
  const b = S(24, 16, Math.hypot(x - BEACH[0], z - BEACH[1]));
  h = h * (1 - b) + 1.2 * b;
  // flat where the sled lands, and round the boathouse and its yard
  const f = Math.max(S(12, 6, Math.hypot(x - LAND[0], z - LAND[1])), S(4, 0, Math.max(16 - x, x - 66, 28 - z, z - 64, 0)));
  h = h * (1 - f) + 1.6 * f;
  // the fjord itself: a deep channel of sea from the south up to the beach
  const df = S(FW + 4, FW - 14, Math.abs(x - FX)) * S(128, 112, z);
  return h * (1 - df) - 10 * df;
}

export function buildFjord(w) {
  w.setSky({ top: "#3a6aa8", mid: "#a8c0d8", bottom: "#dfe6ea", sun: [30, 230], sunColor: "#fff0dc", sunI: 2.0, hemi: ["#dce8f4", "#4a5a48", 0.7], fog: [90, 380], clouds: 22, cloudTint: "#f0f2f4" });
  const G = ground;
  w.terrain(420, 170, G, M("grass", { args: [601, [86, 118, 64]], repeat: [80, 80] }));
  w.phys.fixedBox(0, -16, 0, 300, 1, 300); w.floorY = -24;
  w.ocean({ level: 0, box: [FX, -40, 72, 340], shallow: 0x2a7a8a, deep: 0x0a2a4a, under: 0x0a3a50, clear: 0.4, waves: 0.45 });
  // rock where the mountains are steep, sand on the beach and along the shore
  const steep = (x, z) => Math.hypot(G(x + 0.5, z) - G(x - 0.5, z), G(x, z + 0.5) - G(x, z - 0.5));
  w.overlay(0, 0, 420, 420, M("rock", { args: [603, [110, 108, 104]], repeat: [60, 60] }), (x, z) => steep(x, z) > 0.75, 0.05);
  w.overlay(FX, 60, 140, 200, M("sand", { args: [605, [206, 190, 156]], repeat: [20, 30] }), (x, z) => { const hh = G(x, z); return hh > -3 && hh < 1.25 && steep(x, z) < 0.75; }, 0.04);
  w.mountains(10, 260, 90, { color: 0x5a6878 });

  // ---- pines up every mountainside, birches along the shore
  for (let i = 0; i < 150; i++) {
    const a = i * 2.39996, d = 40 + (i * 53) % 170, x = FX + Math.cos(a) * d, z = Math.sin(a) * d * 1.1;
    if (Math.abs(x) > 200 || Math.abs(z) > 200) continue;
    const hh = G(x, z); if (hh < 3 || hh > 50 || steep(x, z) > 1.6) continue;
    w.pine(x, z, 8 + (i % 4) * 2, { y: hh });
  }
  for (let i = 0; i < 14; i++) { const x = 14 + (i % 4) * 3, z = -70 + i * 11; if (Math.abs(z - BH[1]) < 10 || Math.abs(z) < 5) continue; birch(w, x + 4, G(x + 4, z), z, 6 + (i % 3)); }
  // skerries down the middle of the fjord
  for (const z of [-100, -20, 56]) rocks(w, FX, z, 3, 2.2, 2, { y: -0.6, color: [104, 100, 96], seed: 7 + z });

  // ---- the village: longhouses, the jetty, the boathouse with its sail loft
  for (const [x, z, len, r] of [[52, 10, 18, 0], [80, -6, 16, 0.2], [44, -26, 14, Math.PI / 2], [84, 56, 16, 0.1], [56, 66, 14, Math.PI / 2 + 0.2]]) longhouse(w, x, G(x, z), z, len, 7, r);
  const wood = M("wood", { args: [607, [120, 86, 54]], repeat: [1, 4] }), dark = M("wood", { args: [609, [80, 56, 36]], repeat: [4, 1] });
  w.box(12, 0.3, 3, wood, 8, 1.1, 0);
  for (const x of [4, 8, 12]) for (const s of [-1, 1]) w.cyl(0.14, 0.14, 4, M(0x4a3020), x, -0.9, s * 1.3, { seg: 6 });
  // (the boathouse: long walls, a back wall with a door on the land side, a steep roof; the sail
  // loft is inside, the water side open to a slipway)
  const by = G(BH[0], BH[1]), BL = 16, BW = 10;
  for (const s of [-1, 1]) w.box(BL, 3.6, 0.6, dark, BH[0], by + 1.8, BH[1] + s * BW / 2);
  for (const s of [-1, 1]) w.box(0.6, 3.6, BW / 2 - 1.5, dark, BH[0] + BL / 2, by + 1.8, BH[1] + s * (1.5 + (BW / 2 - 1.5) / 2));
  w.box(0.7, 0.8, 3.2, dark, BH[0] + BL / 2, by + 3.2, BH[1], { collide: false });
  const RR = (BW + 1.2) / 1.732, roof = w.mesh(new THREE.CylinderGeometry(RR, RR, BL + 1, 3, 1, false, Math.PI / 2), M("wood", { args: [611, [70, 50, 34]], repeat: [6, 2] }), BH[0], by + 3.6 + RR * 0.45, BH[1], { rz: Math.PI / 2 });
  roof.scale.x = 0.9;
  w.box(3, 0.2, 8, wood, BH[0] - BL / 2 - 1.5, 0.4, BH[1], { rz: 0.25 });
  // the sail loft: bolts of cloth and a rolled-up sail on racks
  for (let i = 0; i < 3; i++) w.box(1.2, 0.5, 3, M(i % 2 ? 0xc83a2a : 0xf0e8d8, { rough: 0.9 }), BH[0] + 4 - i * 3, by + 0.25, BH[1] - 3, { collide: false });
  // the rune stones on their knoll, and grandad's lookout cairn on the point
  const ry = G(RUNES[0], RUNES[1]);
  runeStone(w, RUNES[0], ry - 0.2, RUNES[1], 2.8, 0.4); runeStone(w, RUNES[0] + 4, G(RUNES[0] + 4, RUNES[1] + 3) - 0.2, RUNES[1] + 3, 2.4, -0.3); runeStone(w, RUNES[0] - 3, G(RUNES[0] - 3, RUNES[1] + 5) - 0.2, RUNES[1] + 5, 2.2, 1.1);
  const cy = G(CAIRN[0], CAIRN[1]), stoneM = M("rock", { args: [613, [130, 126, 120]] });
  for (let i = 0; i < 3; i++) w.box(4 - i * 1.2, 1.1, 4 - i * 1.2, stoneM, CAIRN[0], cy + 0.55 + i * 1.1, CAIRN[1], { ry: i * 0.4 });
  w.cyl(0.08, 0.08, 2.4, M(0x5a3a20), CAIRN[0], cy + 4.5, CAIRN[1], { collide: false, seg: 6 });

  // grass tufts along the shore meadows (not on the sand or the mountainsides)
  const tuftSpots = [];
  for (let i = 0; i < 2600; i++) { const x = 12 + ((i * 37) % 97) + (i % 7) * 0.13, z = -150 + ((i * 53) % 290) + (i % 5) * 0.21; const hh = G(x, z); if (hh < 1.3 || hh > 5 || steep(x, z) > 0.4 || (x > 16 && x < 36 && z > 36 && z < 52)) continue; tuftSpots.push([x, hh, z, 0.8 + (i % 5) * 0.12]); }
  tufts(w, tuftSpots, 0x5a8040);

  // ---- where Rory lands
  const ly = G(LAND[0], LAND[1]);
  timeSled(w, LAND[0] - 5, ly, LAND[1] - 3, 0.3);

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const bot = (x, z) => [x, G(x, z) + 0.05, z];
  const LOOP = [[-7, 0], [-8, 50], [-12, 86], [-22, 96], [-31, 84], [-33, 30], [-32, -40], [-33, -110], [-28, -150], [-18, -160], [-9, -150], [-6, -90], [-7, -40]];
  w.missionData = {
    vik1: { ride: "longship", quarry: "longship", path: LOOP, lead: 28, exit: on(16, 4, 0.2) },
    vik2: { title: "THE RUNE STONES", symbols: ["🐉", "⚓", "🛡️", "🌙"] },
    vik3: { title: "THE NIGHT SKY" },
    vik4: { what: "sail loft", robot: "sandbot", start: bot(64, 55), goal: bot(BH[0] - 2, BH[1]),
      guards: [{ path: [[42, 34], [42, 54]], speed: 1.3, y: 1.6 }, { path: [[52, 48], [38, 48]], speed: 1.1, phase: 0.5, y: 1.6 }, { path: [[48, 38], [36, 38]], speed: 1.2, phase: 3, y: 1.6 }] },
    vik5: { what: "sail pieces", cells: [[-10, -9.3, 24], [-16, -9.3, 34], [-24, -9.3, 18], [-14, -9.3, 48], [-28, -9.3, 40], [-20, -9.3, 60]], floor: -10 },
    vik6: { center: [BEACH[0], 1.2, BEACH[1]], radius: 14, robot: "serpent", height: 5, serpent: true },
  };
  return {
    spawn: on(LAND[0], LAND[1] + 4, 0.1), yaw: Math.PI, pebble: on(LAND[0] + 2, LAND[1] + 5, 0), contact: [...on(LAND[0] - 6, LAND[1] + 6, 0), 0],
    // the golden ammonites: on top of the cairn, on the fjord bed, up among the pines behind the village
    stars: [[CAIRN[0], cy + 3.6, CAIRN[1]], [-30, -9.4, -30], on(108, 20, 0.3)],
    at: { vik1: [15, 0], vik2: [RUNES[0] - 5, RUNES[1] - 5], vik3: [CAIRN[0] - 5, CAIRN[1] + 5], vik4: [66, 51], vik5: [15, 30], vik6: [-4, 132] },
  };
}
