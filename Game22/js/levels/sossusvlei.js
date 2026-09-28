// Sossusvlei, Namibia: the tallest red dunes in the world, and Deadvlei, the
// white clay pan with its black six-hundred-year-old trees. The Monochrome
// hangs in the sky, drinking the red out of the sand, with its gangway of
// grey beams reaching down.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks, corridor } from "../seakit.js";
import { deadTree, airshipInSky, tent, campfire, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("desert");
  const PAN = [30, -6], PR = 20, BIG = [-34, -24];
  const f = (x, z) => {
    // rolling dunes, a big one to the west, the flat pan to the east
    let h = 3 * Math.sin(x * 0.045 + 1) * Math.cos(z * 0.035) + 1.5 * Math.sin(x * 0.09 - z * 0.07) + 0.4 * Math.sin(x * 0.3) * Math.cos(z * 0.27);
    const db = Math.hypot((x - BIG[0]) * 0.8, z - BIG[1]); if (db < 34) h += 12 * (0.5 + 0.5 * Math.cos(db / 34 * Math.PI));
    // the gangway strip is levelled
    const e = Math.max(Math.abs(x - 56) - 6, -Math.min(z + 8, 38 - z)); if (e < 4) h = e < 0 ? 0.2 : h + (0.2 - h) * (1 - e / 4);
    const dp = Math.hypot(x - PAN[0], z - PAN[1]); if (dp < PR) h = Math.min(h, -0.6) - (PR - dp) * 0.0; else if (dp < PR + 10) h = Math.min(h, -0.6 + (dp - PR) * 0.4);
    if (Math.abs(x) > 90 || Math.abs(z) > 90) h += (Math.max(Math.abs(x), Math.abs(z)) - 90) * 0.4;
    return h;
  };
  w.terrain(400, 160, f, M("sand", { args: [10, [200, 70, 40]], repeat: [44, 44], normal: 0.6 }));
  w.mountains(12, 280, 50, { seed: 23, snow: false, color: 0x8a3a2a });
  // the white pan, drawn over the terrain where it is flat, and the dead trees on it
  w.mesh(new THREE.CircleGeometry(PR - 0.5, 40), M("sand", { args: [12, [236, 226, 206]], repeat: [10, 10] }), PAN[0], -0.55, PAN[1], { rx: -Math.PI / 2, cast: false });
  const TREES = [[24, -12], [36, -2], [30, 4], [40, -14], [20, 0], [34, -18], [26, 8], [44, -6]];
  TREES.forEach(([x, z], i) => deadTree(w, x, -0.6, z, 5 + (i % 3) * 1.5));
  // the camp at the foot of the dunes: tents, a fire, the buggy's shade
  const CX = -4, CZ = 20;
  tent(w, CX - 8, CZ + 4, 0.3, { color: 0xd8a040 }); tent(w, CX + 8, CZ + 6, -0.5, { color: 0x3a8ad8 }); campfire(w, CX, CZ + 2);
  w.box(6, 0.1, 6, M(0xc8a060, { rough: 0.9 }), CX + 14, f(CX + 14, CZ - 2) + 3, CZ - 2, { collide: false });
  for (const [dx, dz] of [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]]) w.cyl(0.06, 0.06, 3, M(0x6a4a30), CX + 14 + dx, f(CX + 14, CZ - 2) + 1.5, CZ - 2 + dz, { seg: 6, collide: false });
  rocks(w, [[60, f(60, 30), 30, 2.6], [-60, f(-60, 40), 40, 3], [10, f(10, -60), -60, 2.2], [70, f(70, -50), -50, 3.2]], { color: 0x6a3a2a });
  // the Monochrome overhead, and its gangway: a laser hall of grey beams across the sand towards it
  airshipInSky(w, 60, 80, -40, { s: 70, ry: 0.4 });
  const grey = M("metal", { args: [5, [150, 150, 158]], repeat: [4, 1] });
  corridor(w, [56, 0.2, 30], [56, 0.2, -2], 6, grey, 3.5);
  w.box(8, 0.4, 6, grey, 56, 0.4, 33); w.box(8, 0.4, 6, grey, 56, 0.4, -5);
  w.sign("MONOCHROME · GANGWAY", 4, 0.8, 56, 4.6, 36.4, 0, { bg: "#2a2a30", fg: "#d0d0d8" });
  // the ridge of Big Daddy, marked with flags where the drops go up
  const RIDGE = []; for (let k = 0; k < 9; k++) { const t = k / 8, x = BIG[0] + 30 - t * 30, z = BIG[1] + 22 - t * 22; RIDGE.push([x, f(x, z), z]); }
  for (const [x, y, z] of RIDGE) { w.cyl(0.04, 0.04, 2.2, M(0x2a2e34), x + 1, y + 1.1, z, { seg: 5, collide: false }); w.box(0.8, 0.5, 0.03, M(0xff5a2a), x + 1.4, y + 2, z, { collide: false }); }
  w.sign("BIG DADDY", 2.6, 0.6, BIG[0], f(BIG[0], BIG[1]) + 2.6, BIG[1] - 2, 0, { bg: "#3a1a10", fg: "#ffd8a0" });

  const H = (x, z, dy = 1.1) => [x, f(x, z) + dy, z];
  w.missionData = {
    ss1: { start: [CX + 14, f(CX + 14, CZ - 2) + 0.5, CZ - 2, Math.PI], car: "buggy", carOpts: { awd: true, grip: 2.6, force: 1600 }, cells: [H(-20, 40, 1.4), H(-50, 50, 1.4), H(-70, 20, 1.4), H(-60, -10, 1.4), H(-10, -40, 1.4), H(20, -50, 1.4), H(60, -30, 1.4), H(70, 10, 1.4), H(50, 40, 1.4)] },
    ss2: { spots: TREES.slice(0, 5).map(([x, z], i) => [x + 1.2, -0.6, z + 0.8, [0x14100c, 0x1a1410, 0x14100c, 0x1a1410, 0x14100c][i], 9]) },
    ss3: { cells: RIDGE.map(([x, y, z]) => [x, y + 1.1, z]) },
    ss4: { gates: [[-10, 50, 0.3], [4, 56, 0], [18, 52, -0.4], [26, 62, 0.4], [10, 70, -0.5], [-6, 66, 0.2]].map(([x, z, r]) => [x, f(x, z), z, r]) },
    ss5: { start: [56, 0.2, 30], goal: [56, 0.2, -2], width: 6, beams: 8 },
  };
  void groundAt;
  return { spawn: [CX, f(CX, CZ - 6) + 0.3, CZ - 6], yaw: Math.PI, bolt: [CX + 2, f(CX + 2, CZ - 5) + 0.3, CZ - 5], contact: [CX - 4, f(CX - 4, CZ - 6), CZ - 6, 0.8] };
}
