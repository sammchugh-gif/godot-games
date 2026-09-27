// Plitvice Lakes, Croatia: lakes one above the other, turquoise and green,
// with waterfalls tumbling between them and wooden boardwalks zigzagging up
// past the falls. The lower lake is deep enough to dive; the Baroness's jars
// are on its bed.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks, treeAt, seaweed, fish, bubbles, lampAt, corridor } from "../seakit.js";
import { waterfall, boardwalk, reeds, jar, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("day");
  // three terraces: the lower lake basin (sea level 0), a middle shelf at 5 and the upper shelf at 10,
  // the lake bed shelving down to -7 in the middle
  const T1 = -8, T2 = -40;   // where the ground steps up (z going negative)
  const f = (x, z) => {
    let h;
    if (z > T1) { const d = Math.hypot(x * 0.9, z - 36); h = d < 34 ? -0.3 - (34 - d) * 0.22 : Math.min(2.4, -0.3 + (d - 34) * 0.45); if (z > 78) h += (z - 78) * 0.3; }
    else if (z > T2) { const r = (T1 - z); h = r < 2 ? 2.4 + r * 1.3 : 5; if (Math.hypot(x + 12, z + 26) < 12) h = 4.2; }
    else { const r = (T2 - z); h = r < 2 ? 5 + r * 2.5 : 10; if (Math.hypot(x, z + 58) < 16) h = 9.2; if (z < -70) h += (-70 - z) * 0.4; }
    if (Math.abs(x) > 56) h += (Math.abs(x) - 56) * 0.35;
    return h;
  };
  w.terrain(320, 150, f, M("grass", { args: [23, [70, 120, 60]], repeat: [50, 50], normal: 0.5 }));
  w.mountains(12, 240, 60, { seed: 21, snow: false, color: 0x4a6a4a });
  w.ocean({ level: 0, box: [0, 30, 160, 120], shallow: 0x3ad0c0, deep: 0x0a5a6a, under: 0x0c6a70, see: 26, waves: 0.25, foam: 0.6 });
  // the upper lakes as still pools on the shelves, and the falls that spill from them
  w.water(60, 22, -10, 4.85, -28, 0x3ad0c0, { opacity: 0.85 });
  w.water(70, 24, 0, 9.85, -58, 0x2ab8b0, { opacity: 0.85 });
  for (const [x, wd] of [[-30, 4], [-16, 6], [4, 5], [22, 4]]) waterfall(w, x, 5, -0.5, T1 + 0.4, wd);
  for (const [x, wd] of [[-20, 8], [10, 6], [30, 3]]) waterfall(w, x, 10, 4.8, T2 + 0.4, wd);
  // the big falls at the west end, where the sluice is
  waterfall(w, -44, 10, -0.6, T1 - 6, 10, { ry: 0.5 });
  const stone = M("stone", { args: [24, [120, 116, 100]], repeat: [4, 2], normal: 1.2 });
  w.box(4, 5, 6, stone, -46, 7.5, -44); corridor(w, [-52, 5, -36], [-52, 5, -30], 4, stone, 3); // the sluice house and its lock
  w.sign("SLUICE", 2.2, 0.6, -52, 8.4, -37.6, 0, { bg: "#1a2a1a", fg: "#bfe8ff" });
  // the boardwalks: along the lower shore, then zigzagging up beside the falls to the middle shelf and the upper
  const B1 = [[20, 1.5, 6], [8, 1.5, 4], [-4, 1.5, 6], [-14, 1.5, 2], [-20, 1.5, -3], [-12, 3.6, -6], [-2, 5.6, -10], [10, 5.6, -16], [22, 5.6, -22], [28, 7.8, -32], [24, 10.6, -40], [12, 10.6, -46]];
  boardwalk(w, B1);
  boardwalk(w, [[-34, 5.6, -20], [-40, 5.6, -30], [-34, 9.9, -39.5], [-30, 11.0, -46]]);
  boardwalk(w, [[30, 1.5, 12], [40, 1.5, 24], [34, 1.5, 40], [18, 1.5, 50]], { rails: false });
  // trees and rocks and reeds on the shores; fish and weed in the lake
  for (const [x, z] of [[-40, 14], [-46, 30], [44, 40], [50, 10], [-34, -60], [30, -66], [-50, -54], [0, 66], [-24, 60], [30, 60]]) w.pine(x, z, 9 + (Math.abs(x) % 3) * 2, { y: f(x, z) });
  for (const [x, z] of [[-28, 22], [36, 26], [-8, 62], [16, -32], [-18, -34], [0, -64]]) treeAt(w, x, z, 6, { color: 0x3a8a3a });
  for (const [x, z] of [[-22, 12], [26, 14], [40, 30], [-30, 44]]) reeds(w, x, z, 10);
  rocks(w, [[-8, f(-8, 20), 20, 2.4], [16, f(16, 30), 30, 3], [-20, f(-20, 36), 36, 2.2], [30, f(30, 48), 48, 2], [6, f(6, 44), 44, 2.6]], { color: 0x6a7a6a });
  seaweed(w, -6, f(-6, 34), 34, 10, 2.5, 0x2a8a3a); seaweed(w, 14, f(14, 24), 24, 8, 2, 0x3a9a4a); seaweed(w, 22, f(22, 42), 42, 8, 2.5, 0x2a8a3a);
  fish(w, 0, -3, 30, 10, 30, 0xc8c0a0); fish(w, 16, -3, 44, 6, 20, 0xe0a060, { size: 0.8 });
  bubbles(w, 0, f(0, 30), 30); bubbles(w, 18, f(18, 46), 46);
  for (const [x, z] of [[24, 8], [-16, 4], [16, -18], [-36, -22]]) lampAt(w, x, z, 3.2, 0xffe0a0);
  // the jars on the bed of the deep lake, stirred up mud all round them
  const JARS = [[-6, 32], [8, 36], [2, 24], [16, 44], [-14, 42], [-2, 44], [10, 26], [-10, 20]].map(([x, z]) => [x, f(x, z), z]);
  JARS.forEach(([x, y, z], i) => jar(w, x, y, z, [0x2ab8c8, 0x3ad06a, 0xffd23f, 0xd83a2a, 0x9a4aff, 0xff8a2a, 0x3a8aff, 0xff8ac8][i], { full: 0.6 }));

  w.missionData = {
    pl1: { entry: [8, f(8, 8), 8], cells: [[4, -2.5, 16], [-6, -3.5, 20], [12, -3, 22], [-14, -2.6, 28], [0, -5, 30], [20, -3.2, 34], [-8, -4.5, 40], [10, -4.5, 46]], bubbles: [[-4, -2.5, 28], [14, -3, 40]] },
    pl2: { cells: [[8, 2.6, 4], [-14, 2.6, 2], [-12, 4.7, -8], [10, 6.5, -16], [22, 6.5, -22], [28, 8.7, -30], [24, 11.5, -40], [-38, 7.4, -32], [-30, 12.0, -46]] },
    pl3: { entry: [-8, f(-8, 8), 8], cells: JARS.map(([x, y, z]) => [x, y + 1.9, z]), bubbles: [[4, -4, 30], [-8, -3.5, 36], [14, -3, 22]] },
    pl4: { title: "WATERFALL LOCK" },
    pl5: { area: [-36, -30, 9], bots: [[-30, 5, -26], [-32, 5, -34], [-44, 5, -36], [-26, 5, -22], [-46, 5, -26], [-40, 5, -38], [-28, 5, -30]] },
  };
  void groundAt; void THREE;
  return { spawn: [0, f(0, -2) + 0.2, -2], yaw: 0, bolt: [2, f(2, -2) + 0.2, -2], contact: [-4, f(-4, -3), -3, 0.8] };
}
