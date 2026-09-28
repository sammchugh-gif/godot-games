// Jezero Crater on Mars: a wide, flat crater floor of red dust and rocks under a butterscotch
// sky, the crater's rim a long wall of hills all round. To the west is the old river delta, the
// fan of mud a river left here billions of years ago, now low flat-topped mesas. Dr Amani's base
// is in the middle: the habitat, the greenhouse dome, the rover garage and the helicopter pad;
// the POLARIS supply rocket has landed just east of it.
import * as THREE from "three";
import { M } from "../tex.js";
import { module, marsGround, marsRock, glassDome, lander } from "./spacekit.js";

// the delta's mesas: [x, z, rx, rz, height]
const MESAS = [[-46, -18, 16, 10, 2.6], [-62, 4, 14, 12, 4.2], [-40, 22, 12, 9, 2], [-78, -22, 12, 10, 3.4], [-82, 26, 10, 8, 2.8]];
export function ground(x, z) {
  let h = Math.sin(x * 0.045) * 0.5 + Math.cos(z * 0.05 + 0.7) * 0.45 + Math.sin((x - z) * 0.11) * 0.15;
  for (const [cx, cz, rx, rz, H] of MESAS) { const d = Math.hypot((x - cx) / rx, (z - cz) / rz); h += H * Math.min(1, Math.max(0, (1 - d) * 2.2)); }
  // the crater rim, a wall of hills far off all round
  const r = Math.hypot(x, z); h += Math.max(0, Math.min(1, (r - 150) / 70)) ** 2 * 46 * (0.8 + Math.sin(Math.atan2(z, x) * 5) * 0.2);
  // flat round the base
  const f = Math.min(1, Math.max(0, 1.6 - Math.hypot(x - 18, z - 12) / 24));
  return h * (1 - f);
}

export function buildJezero(w) {
  w.setSky("mars");
  const G = ground;
  w.terrain(480, 140, G, marsGround(301, [196, 112, 70], 70));
  w.phys.fixedBox(0, -20, 0, 400, 1, 400);
  w.floorY = -30;

  // ---- the drive round the crater floor (kept clear of rocks)
  const LOOP = [[44, -32], [74, -40], [98, -10], [92, 30], [62, 56], [22, 64], [-6, 46], [-12, -12]];
  const nearLoop = (x, z, m) => LOOP.some(([ax, az], i) => { const [bx, bz] = LOOP[(i + 1) % LOOP.length], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2)); return Math.hypot(ax + vx * t - x, az + vz * t - z) < m; });
  // ---- rocks: a scatter of them, bigger ones on the delta's slopes
  for (let i = 0; i < 70; i++) {
    const a = i * 2.39996, d = 16 + (i * 53) % 130, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - 18, z - 12) < 26 || nearLoop(x, z, 7)) continue;
    marsRock(w, x, G(x, z), z, 0.5 + (i % 6) * 0.35, { collide: i % 6 > 1 });
  }

  // ---- Dr Amani's base
  const BX = 18, BZ = 12, by = G(BX, BZ);
  module(w, BX + 4, by + 2.6, BZ - 8, 0, 12, [232, 226, 218]);
  module(w, BX - 8, by + 2.6, BZ - 2, Math.PI / 2, 10, [226, 220, 210]);
  w.sign("JEZERO BASE", 5, 0.9, BX + 4, by + 5.8, BZ - 5.3, 0, { bg: "#2a1208", fg: "#ffb070", glow: 0.9 });
  glassDome(w, BX + 14, by, BZ + 18, 8, { garden: true });
  w.sign("GREENHOUSE", 4, 0.8, BX + 14, by + 2.4, BZ + 9.7, Math.PI, { bg: "#0a2a14", fg: "#9fffb0", glow: 0.8 });
  // the rover garage: open to the south
  const garM = M("metal", { args: [321, [210, 206, 198], 64], repeat: [4, 2], metal: 0.3, rough: 0.6 }), GX = BX - 12, GZ = BZ + 16;
  w.box(12, 4.5, 0.4, garM, GX, by + 2.25, GZ + 5); w.box(0.4, 4.5, 10, garM, GX - 6, by + 2.25, GZ); w.box(0.4, 4.5, 10, garM, GX + 6, by + 2.25, GZ);
  w.box(12.8, 0.4, 10.8, garM, GX, by + 4.7, GZ);
  w.sign("ROVER GARAGE", 5, 0.9, GX, by + 5.6, GZ - 5.2, Math.PI, { bg: "#2a1208", fg: "#ffd166", glow: 0.8 });
  for (let k = -1; k <= 1; k++) { w.box(2.2, 0.1, 1.2, M(0x3a8ad8, { emissive: 0x1a5ab8, ei: 0.6 }), GX + k * 3.4, by + 0.05, GZ + 3.2, { collide: false }); }
  // the helicopter pad
  w.cyl(3, 3, 0.2, M(0x3a3a40, { rough: 0.8 }), BX - 22, by + 0.1, BZ - 4, { seg: 24 });
  w.box(0.4, 0.02, 2.4, M(0xf0f0f0), BX - 22.8, by + 0.21, BZ - 4, { collide: false }); w.box(0.4, 0.02, 2.4, M(0xf0f0f0), BX - 21.2, by + 0.21, BZ - 4, { collide: false }); w.box(1.2, 0.02, 0.4, M(0xf0f0f0), BX - 22, by + 0.21, BZ - 4, { collide: false });
  // solar panels in rows
  const sol = M("tiles", { args: [201, [30, 60, 140], [20, 40, 110], 8], repeat: [2, 1], rough: 0.25, metal: 0.4 });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = BX + 20 + c * 4.4, z = BZ - 18 + r * 4; w.box(4, 0.1, 2.4, sol, x, by + 1.2, z, { rx: -0.35 }); w.box(0.15, 1.1, 0.15, M(0x5a6068), x, by + 0.55, z); }
  // the POLARIS supply rocket, landed
  lander(w, BX + 26, by, BZ + 2);
  // a little Mars flag and a sign-post
  w.cyl(0.04, 0.04, 2.6, M(0xe8e8ec), BX + 20, by + 1.3, BZ - 2, { collide: false });

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  w.missionData = {
    jez1: { what: "sample spots", start: [...on(BX + 12, BZ - 26, 0.5), Math.PI / 2], car: "rover", carOpts: { grip: 2.4, maxSpeed: 13 }, cells: LOOP.map(([x, z]) => on(x, z)) },
    jez2: { heli: true, ceiling: 40, rings: [[BX - 26, by + 5, BZ - 8, 2.4, Math.PI / 2], [-30, G(-30, -10) + 9, -10, 2.4, 1.2], [-52, G(-52, -2) + 12, -2, 2.4, Math.PI / 2], [-72, G(-72, 12) + 10, 12, 2.4, 0.6], [-62, G(-62, 34) + 13, 34, 2.4, -0.4], [-36, G(-36, 34) + 15, 34, 2.4, Math.PI / 2]] },
    jez3: { cells: [on(-46, -18), on(-54, -24), on(-62, 4), on(-66, 12), on(-40, 22), on(-78, -22), on(-82, 26), on(-28, 6)] },
    jez4: { title: "THE GREENHOUSE" },
    jez5: { critter: "minirover", kids: [on(46, -30, 0.05), on(56, 44, 0.05), on(-22, 50, 0.05)], goal: [GX, by, GZ], goalR: 3.5 },
    jez6: { title: "UNDERTOW'S MAP" },
  };
  return {
    stars: [on(-90, 40, 0.2), on(110, 60, 0.2), on(12, -70, 0.2)],
    spawn: on(BX + 22, BZ + 9, 0.1), yaw: -Math.PI / 2, bolt: on(BX + 22, BZ + 11, 0), contact: [...on(BX + 17, BZ + 6, 0), Math.PI / 2],
    at: { jez1: [BX + 10, BZ - 22, 20], jez2: [BX - 18, BZ - 8, 20], jez3: [BX - 30, BZ + 2, 20], jez4: [BX + 8, BZ + 10, 20], jez5: [GX + 8, GZ - 8, 20], jez6: [BX - 8, BZ - 16, 20] },
  };
}
