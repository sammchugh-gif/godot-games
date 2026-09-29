// Ancient Egypt, 4,500 years ago: the Nile runs down the west side between reed beds and palms,
// with hippos wallowing in it and green fields along its east bank. On the plateau to the east
// stands the new pyramid, finished all but its golden capstone: a covered causeway leads to the
// tomb door in its west face, the sealed entrance is on the north side, and the workers' quarry
// and their knocked-down ramp are to the south. The Sphinx lies by the causeway; the workers'
// village of mudbrick houses is by the dig; the time-sled lands in the south, where Nefi waits.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks } from "./kit.js";
import { timeSled, landFrame, tufts } from "./timekit.js";
import { reeds, pyramid, farPyramid, obelisk, mudHouse, sphinx, hippo, glyphPanel } from "./antiquekit.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const P = [70, 40], PB = 44, PLAT = 2, LV = -1.0;
// the Nile's middle, curving away west at both ends
const NX = z => -62 - S(100, 190, Math.abs(z)) * 60;
// the plateau: flat round the pyramid, the causeway and the Sphinx
const PLATEAU = [6, 12, 96, 68];
export function ground(x, z) {
  let h = Math.sin(x * 0.05 + 1) * 0.5 + Math.cos(z * 0.04) * 0.6 + Math.sin((x + z) * 0.09) * 0.2;
  h += S(-10, 30, x) * PLAT;
  // desert hills far out on every side
  h += S(140, 190, x) * 22 + S(-130, -180, x) * 26 + S(165, 205, Math.abs(z)) * 18;
  const [x0, z0, x1, z1] = PLATEAU, out = Math.max(x0 - x, x - x1, z0 - z, z - z1, 0), fp = S(7, 0, out);
  h = h * (1 - fp) + PLAT * fp;
  // flat where the sled lands
  const fl = S(12, 6, Math.hypot(x, z + 60)); h = h * (1 - fl) + 0.3 * fl;
  // the river's channel, four metres deep, its banks sloping up
  const ch = S(22, 15, Math.abs(x - NX(z)));
  return h * (1 - ch) - 4 * ch;
}

export function buildEgypt(w) {
  w.setSky({ top: "#3a78cc", mid: "#a8c8e4", bottom: "#f2e2c2", sun: [58, 120], sunColor: "#fff0d0", sunI: 2.5, hemi: ["#fff2dc", "#b8986a", 0.7], fog: [120, 430], clouds: 4, cloudTint: "#fff8ec" });
  const G = ground;
  w.terrain(420, 170, G, M("sand", { args: [281, [222, 196, 144]], repeat: [80, 80] }));
  w.phys.fixedBox(0, -12, 0, 300, 1, 300); w.floorY = -20;
  w.ocean({ level: LV, size: 420, noSkirt: true, box: [-62, 0, 70, 420], shallow: 0x3a9a8a, deep: 0x1a5a6a, under: 0x2a6a6a, clear: 0.35, waves: 0.25 });
  landFrame(w, 210, -0.5, 0xc8aa78);
  // green fields along the river, a band of mud at its edge
  w.overlay(-40, 0, 44, 320, M("grass", { args: [283, [104, 140, 58]], repeat: [10, 60] }), (x, z) => { const d = x - NX(z); return d > 21 && d < 42 && Math.abs(z) < 150; }, 0.04);
  w.overlay(-62, 0, 70, 420, M("sand", { args: [285, [120, 104, 76]], repeat: [14, 80] }), (x, z) => { const d = Math.abs(x - NX(z)); return d > 14 && d < 21.5; }, 0.03);
  w.mountains(10, 262, 40, { color: 0xc8a878, snow: false });
  farPyramid(w, 178, G(178, 100) - 2, 100, 70, 48); farPyramid(w, 186, G(186, 20) - 2, 20, 46, 32);
  w.phys.fixedBox(178, G(178, 100) + 10, 100, 24, 12, 24); w.phys.fixedBox(186, G(186, 20) + 6, 20, 16, 8, 16);

  // ---- the Nile: reeds along both banks, palms behind them, hippos in the water
  const reedSpots = [];
  for (let z = -150; z <= 150; z += 5) for (const sd of [-1, 1]) { if ((z * 7 + sd * 13) % 3 === 0) continue; const x = NX(z) + sd * (19 + ((z * 3) % 2)); reedSpots.push([x, G(x, z) - 0.2, z, 0.9 + ((z * 11) % 4) * 0.1]); }
  reeds(w, reedSpots);
  for (let z = -140; z <= 140; z += 14) for (const sd of [-1, 1]) { const x = NX(z) + sd * (27 + ((z * 5) % 4)); if (Math.hypot(x + 40, z + 80) < 8) continue; w.palm(x, z, 7 + ((z * 3) % 3), { y: G(x, z) }); }
  for (const [x, z, s, r] of [[-62, -40, 1.2, 0.4], [-62, 30, 1.1, 2.4], [-62, 80, 1.2, -1], [-77, 20, 1, 1.6], [-46, -10, 1, -2.2]]) hippo(w, x, LV - 0.15, z, s, r);
  // the boat jetty on the east bank
  const wood = M("wood", { args: [287, [140, 100, 60]], repeat: [1, 4] });
  w.box(3, 0.3, 10, wood, -45, 0.1, -80, { ry: Math.PI / 2 });
  for (const x of [-49, -45, -41]) for (const s of [-1, 1]) w.cyl(0.12, 0.12, 2.2, M(0x5a3a1a), x, -0.9, -80 + s * 1.3, { seg: 6 });

  // ---- the plateau: the pyramid, its causeway, the sealed door, the Sphinx and obelisks
  const stone = M("stone", { args: [289, [210, 184, 134]], repeat: [6, 1] });
  pyramid(w, P[0], PLAT, P[1], PB, 11, 1.2, 4);
  // the tomb door at the end of the causeway, in the west face
  w.box(0.3, 2.8, 2.6, M(0x1a120a), P[0] - PB / 2 - 0.1, PLAT + 1.4, P[1], { collide: false });
  w.box(0.6, 0.5, 3.6, stone, P[0] - PB / 2 - 0.2, PLAT + 3.0, P[1], { collide: false });
  // the causeway: two tall walls with painted friezes inside, open to the sun
  const CX0 = 10, CX1 = P[0] - PB / 2, CM = (CX0 + CX1) / 2, CL = CX1 - CX0;
  for (const s of [-1, 1]) w.box(CL, 3.4, 0.8, stone, CM, PLAT + 1.7, P[1] + s * 3.3);
  glyphPanel(w, CM, PLAT + 2.4, P[1] - 2.89, CL - 4, 1.4, 0);
  glyphPanel(w, CM, PLAT + 2.4, P[1] + 2.89, CL - 4, 1.4, Math.PI);
  obelisk(w, 6, PLAT, P[1] - 5.5, 9); obelisk(w, 6, PLAT, P[1] + 5.5, 9);
  // the sealed entrance on the north side: two pillars, a lintel and a door of carved stone
  const NZ = P[1] + PB / 2;
  for (const s of [-1, 1]) w.box(1, 4.2, 1.4, stone, P[0] + s * 2.2, PLAT + 2.1, NZ + 0.7);
  w.box(5.4, 0.8, 1.6, stone, P[0], PLAT + 4.6, NZ + 0.7);
  w.box(3.4, 3.8, 0.5, M(0xc8b080, { rough: 0.9 }), P[0], PLAT + 1.9, NZ + 0.45);
  glyphPanel(w, P[0], PLAT + 1.9, NZ + 0.71, 3.2, 3.6, 0);
  // the Sphinx, looking out over the river, with a fallen block to climb its side by
  sphinx(w, 18, PLAT, 58, 1.2, -Math.PI / 2);
  w.box(2, 1.5, 2, stone, 19, PLAT + 0.75, 61.8);

  // ---- the quarry and the knocked-down ramp, south of the pyramid
  const QB = [[82, -2, 2.2, 1.4, 1.8], [96, -10, 1.8, 1.2, 2.4], [104, 2, 2.4, 1.6, 2], [78, -12, 1.6, 1, 1.6]];
  for (const [x, z, a, b, c] of QB) w.box(a, b, c, stone, x, G(x, z) + b / 2, z, { ry: x * 0.3 });
  rocks(w, 108, -12, 6, 6, 1.6, { y: G(108, -12), color: [200, 176, 130] });
  for (const [x, z, r] of [[62, 12, 0.3], [66, 9, -0.5], [76, 10, 0.8], [80, 13, 0.2]]) w.box(1.6, 0.8, 1.2, stone, x, PLAT + 0.4, z, { ry: r, rz: 0.15 });

  // ---- the workers' village and the dig
  const houses = [[18, -30, 0.1], [30, -38, -0.2], [40, -24, 0.3], [26, -16, 0], [52, -36, 0.2], [8, -42, -0.1]];
  for (const [x, z, r] of houses) mudHouse(w, x, G(x, z), z, 5, 4, 3, r);
  // (mudbricks stacked by the house at [40, -24]: a way up onto its roof)
  w.box(1.6, 1.4, 1.6, M("brick", { args: [291, [170, 130, 90], [150, 116, 80], [200, 180, 150]] }), 40, G(40, -21) + 0.7, -20.6);
  const DIG = [-8, -14], dy = G(DIG[0], DIG[1]);
  for (const [x, z] of [[-11, -17], [-5, -17], [-5, -11], [-11, -11]]) w.cyl(0.05, 0.05, 1, M(0x6a4a2a), DIG[0] + (x - DIG[0]), dy + 0.5, z, { collide: false, seg: 5 });
  w.cyl(0.5, 0.4, 0.5, M(0xb89a5a, { rough: 1 }), DIG[0] + 4, dy + 0.25, DIG[1] + 2, { seg: 10 });
  for (let i = 0; i < 6; i++) { const a = i * 1.1; w.palm(DIG[0] + 30 + Math.cos(a) * 20, DIG[1] - 20 + Math.sin(a) * 12, 7, { y: G(DIG[0] + 30 + Math.cos(a) * 20, DIG[1] - 20 + Math.sin(a) * 12) }); }

  // green tufts in the fields along the east bank
  const tuftSpots = [];
  for (let i = 0; i < 700; i++) { const z = -150 + (i * 0.43) % 300, d = 21.5 + ((i * 37) % 20), x = NX(z) + d; tuftSpots.push([x, G(x, z), z, 0.9 + (i % 4) * 0.15]); }
  tufts(w, tuftSpots, 0x6a9a3a);

  // ---- where Rory lands
  const sy = G(0, -60);
  timeSled(w, -5, sy, -63, 0.3);

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const RIVERLOOP = [[-54, -80], [-53, -30], [-55, 20], [-53, 70], [-57, 96], [-64, 102], [-70, 94], [-71, 50], [-69, 0], [-71, -50], [-68, -92], [-61, -100]];
  // the pyramid's ledges: tier i's ledge is dd(i) from the middle, at spark height y(i)
  const dd = i => PB / 2 - (PB - 4) / 2 / 11 * (i + 0.5), ty = i => PLAT + 1.2 * (i + 1) + 1.0;
  w.missionData = {
    egy1: { ride: "reedboat", quarry: "reedboat", path: RIVERLOOP, lead: 28, exit: on(-38, -76, 0.2) },
    egy2: { title: "THE PICTURE LOCK", symbols: ["👁️", "🪲", "☀️", "🐍"] },
    egy3: { start: [CX0 + 2, PLAT, P[1]], goal: [CX1 - 3, PLAT, P[1]], width: 5.8, what: "tomb door" },
    egy4: { title: "THE BURIED STONE" },
    egy5: { look: "stone", size: 1.0, pad: [P[0], PLAT, 12], padR: 2.4, blocks: [on(86, -2, 0.6), on(92, 4, 0.6), on(98, -4, 0.6), on(90, -8, 0.6), on(100, 6, 0.6), on(80, 4, 0.6)] },
    egy6: { cells: [[P[0], ty(0), P[1] - dd(0)], [P[0] - 6, ty(2), P[1] - dd(2)], [P[0] + dd(3), ty(3), P[1] - 4], [P[0] + dd(5), ty(5), P[1] + 6], [P[0] + 4, ty(6), P[1] + dd(6)], [P[0] - 6, ty(8), P[1] + dd(8)], [P[0] - dd(9), ty(9), P[1]], [P[0], PLAT + 13.2 + 1.0, P[1]]] },
  };
  return {
    spawn: on(0, -56, 0.1), yaw: 0, pebble: on(2, -55, 0), contact: [...on(6, -53, 0), Math.PI],
    // the golden ammonites: on the Sphinx's back, in the reeds across the river, on a village roof
    stars: [[19.2, PLAT + 3.12 + 0.3, 58], [NX(30) - 19, G(NX(30) - 19, 30) + 0.4, 30], [40, G(40, -24) + 3.6, -24]],
    at: { egy1: [-40, -80], egy2: [P[0], NZ + 5], egy3: [CX0 - 4, P[1]], egy4: [DIG[0], DIG[1] - 4], egy5: [P[0] + 4, 6], egy6: [P[0] - 10, 12] },
  };
}
