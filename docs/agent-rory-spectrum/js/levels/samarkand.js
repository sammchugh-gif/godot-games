// Samarkand, Uzbekistan: the Registan, the bluest square in the world. Three
// great portals of tiles round the square, turquoise domes and minarets, and
// behind them the bazaar of spice sacks and hanging silks where the Baroness
// keeps her workshop.
import * as THREE from "three";
import { M } from "../tex.js";
import { lampAt, treeAt, corridor } from "../seakit.js";
import { dome, minaret, iwan, tileMat, stall, spiceSack, silkRail, silk, jar, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("day");
  const f = (x, z) => { let h = 0; if (Math.abs(x) > 80) h += (Math.abs(x) - 80) * 0.2; if (z < -80) h += (-80 - z) * 0.2; return h; };
  w.terrain(320, 120, f, M("paving", { args: [11, [200, 186, 160], 64], repeat: [50, 50], normal: 0.6 }));
  w.mountains(10, 260, 50, { seed: 19, snow: true, color: 0x8a7a70 });
  const stone = M("stone", { args: [21, [214, 190, 150]], repeat: [4, 2] }), teal = 0x2ab8c8, blue = 0x2a5ad8;
  // the square, paved, with the three madrasas round it: north, west, east
  w.box(70, 0.12, 60, M("tiles", { args: [13, [214, 200, 170], [60, 120, 160], 10], repeat: [14, 12] }), 0, 0.06, -20, { collide: false });
  const madrasa = (x, z, ry, color, seed) => {
    const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
    const at = (dx, dz) => [x + sx * dx + fx * dz, z + sz * dx + fz * dz];
    const topY = iwan(w, x, z, 20, 13, 4, ry, { color, seed });
    // the wings either side, lower, with the courtyard behind
    for (const s of [-1, 1]) { const [wx, wz] = at(s * 22, -6); w.box(24, 10, 16, tileMat(color, seed + s), wx, 5, wz, { ry }); }
    const [bx, bz] = at(0, -22); w.box(68, 10, 4, stone, bx, 5, bz, { ry });
    // the domes on the wings and the minarets at the corners
    for (const s of [-1, 1]) { const [dx, dz] = at(s * 22, -6); dome(w, dx, 10, dz, 5, { color, seed: seed + 3 + s, drum: 2 }); }
    for (const s of [-1, 1]) { const [mx, mz] = at(s * 35, 2); minaret(w, mx, mz, 18, { color, seed: seed + 5 + s }); }
    // a long flight of stairs up the front of the right-hand wing to its roof
    const [ax, az] = at(12, 3.2);
    w.steps(24, 2.4, 0.42, 0.7, stone, ax, 0, az, ry + Math.PI / 2);
    return topY;
  };
  madrasa(0, -50, 0, teal, 400);
  madrasa(-40, -20, Math.PI / 2, blue, 420);
  madrasa(40, -20, -Math.PI / 2, 0x3ad0d0, 440);
  for (const [x, z] of [[-20, 4], [20, 4], [-20, -44], [20, -44]]) lampAt(w, x, z, 4.4, 0xffe0a0);
  for (const [x, z] of [[-12, 8], [12, 8]]) treeAt(w, x, z, 5, { color: 0x4a8a3a });
  // the bazaar to the south: rows of stalls, spice sacks, silks on rails
  const SPICE = [[-16, 30, 0xffd23f], [-6, 36, 0xd83a2a], [6, 30, 0xff8a2a], [16, 38, 0x8a3a8a], [0, 44, 0x3ad06a]];
  for (let i = 0; i < 8; i++) stall(w, -28 + (i % 4) * 18, 24 + Math.floor(i / 4) * 20, i < 4 ? Math.PI : 0, { awning: [0xd83a2a, 0xffd23f, 0x2a8ad8, 0x3ad06a][i % 4], goods: [[0xff5a8a, 0xffd23f, 0x3ad06a], [0xff8a2a, 0xd83a2a, 0xffe8a0], [0x9a4aff, 0xff8ac8, 0x3ad06a]][i % 3] });
  for (let i = 0; i < 14; i++) spiceSack(w, -30 + (i * 7) % 62, 22 + (i * 11) % 26, [0x8a8a90, 0x9a9a98, 0x7a7a80][i % 3]);
  SPICE.forEach(([x, z, c]) => spiceSack(w, x, z, c));
  silkRail(w, -30, 52, 30, 52, 4, [0xd83a6a, 0xffd23f, 0x2a8ad8, 0x3ad06a, 0x9a4aff], 12);
  silkRail(w, -30, 16, -30, 50, 4, [0xff8a2a, 0x2ab8c8, 0xd83a2a], 8);
  // the workshop behind the silks: a walled yard of hanging cloths, the loom at the back with the key
  const WX = 48, WZ = 42, cloth = M(0x9a8a7a, { rough: 0.9 });
  w.box(30, 4, 0.6, cloth, WX, 2, WZ - 12); w.box(30, 4, 0.6, cloth, WX, 2, WZ + 12); w.box(0.6, 4, 24, cloth, WX + 15, 2, WZ);
  w.box(0.6, 4, 8, cloth, WX - 15, 2, WZ - 8); w.box(0.6, 4, 8, cloth, WX - 15, 2, WZ + 8);
  for (const [dx, dz, ry] of [[-6, -4, 0], [-6, 4, 0], [2, -6, Math.PI / 2], [2, 6, Math.PI / 2], [8, 0, 0], [-2, 0, Math.PI / 2]]) { silk(w, WX + dx, 3.6, WZ + dz, ry, [0xd83a6a, 0xffd23f, 0x2a8ad8, 0x3ad06a][Math.abs(dx + dz) % 4], 2.4, 3.4); w.phys.fixedBox(WX + dx, 1.8, WZ + dz, ry ? 0.1 : 1.2, 1.8, ry ? 1.2 : 0.1); }
  w.box(2.6, 1.6, 1.2, M("wood", { args: [37, [140, 100, 60]] }), WX + 12, 0.8, WZ); w.box(2.6, 0.1, 0.05, M(0x1a1a1a), WX + 12, 1.9, WZ, { collide: false });
  jar(w, WX + 12, 0, WZ - 4, 0x2ab8c8); jar(w, WX + 12, 0, WZ + 4, 0xffd23f, { full: 0.7 });
  w.sign("WORKSHOP · KEEP OUT", 3.5, 0.7, WX - 15.4, 3.2, WZ, -Math.PI / 2, { bg: "#3a3a40", fg: "#e0e0e0" });
  corridor(w, [-52, 0, -62], [-52, 0, -68], 4, stone, 3.2); // the tile-makers' kiln, for the mixing

  // the drops on the domes and minarets (stairs and the balconies), with pads at the foot of each
  const domesTop = [[-22, 10 + 2 + 5 * 1.15, -56], [22, 10 + 2 + 5 * 1.15, -56], [-46, 10 + 2 + 5 * 1.15, -42], [-46, 10 + 2 + 5 * 1.15, 2], [46, 10 + 2 + 5 * 1.15, -42], [46, 10 + 2 + 5 * 1.15, 2]];
  // (the pads for the domes are up on the wing roofs, reached over the portal roof; the minaret's is below its balcony)
  w.missionData = {
    // on the wing roofs (up the stairs on each madrasa's right-hand wing), one on the stairs, two in the square
    sk1: { cells: [[30, 11.1, -54], [14, 11.1, -62], [20, 6.2, -46.8], [-44, 11.1, -50], [-52, 11.1, -34], [44, 11.1, 10], [52, 11.1, -6], [0, 1.1, -30], [-20, 1.1, -10]] },
    sk2: { spots: SPICE.map(([x, z, c]) => [x + 1.1, 0, z, c, 9]) },
    sk3: { start: [WX - 15, 0, WZ], goal: [WX + 12, 0, WZ - 1.4], range: 8, guards: [{ path: [[WX - 10, WZ - 9], [WX - 10, WZ + 9]], speed: 1.5, pause: 1.4 }, { path: [[WX + 5, WZ + 9], [WX + 5, WZ - 9]], speed: 1.6, pause: 1.2, phase: 5 }, { path: [[WX - 2, WZ - 2], [WX + 10, WZ - 8]], speed: 1.4, pause: 1.6, phase: 2 }] },
    sk4: { title: "FOUR HUNDRED BLUES" },
    sk5: { area: [0, -20, 14], bots: [[-10, 0, -12], [10, 0, -28], [-8, 0, -30], [12, 0, -10], [0, 0, -34], [-16, 0, -20], [16, 0, -20]] },
  };
  void groundAt; void THREE;
  return { spawn: [0, 0.2, 0], yaw: Math.PI, bolt: [2, 0.2, 1], contact: [-4, 0, 2, 0.8] };
}
