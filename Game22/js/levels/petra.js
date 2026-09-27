// Petra, Jordan: a city carved into rose-red cliffs. The Siq, a winding
// canyon, opens onto the Treasury; the stairs of the High Place climb the
// cliff; camels wait in the sand, and the Baroness's Blotters have made camp
// on the flats beyond.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks, lampAt, corridor } from "../seakit.js";
import { sandstone, treasury, column, camelStanding, tent, campfire, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("desert");
  const f = (x, z) => {
    let h = Math.sin(x * 0.07) * Math.cos(z * 0.05) * 0.5 + Math.sin(x * 0.19 + z * 0.13) * 0.2;
    if (z < -60) h += (-60 - z) * 0.5;
    if (Math.abs(x) > 64) h += (Math.abs(x) - 64) * 0.4;
    return h;
  };
  w.terrain(360, 150, f, M("sand", { args: [6, [214, 170, 130]], repeat: [40, 40], normal: 0.5 }));
  w.mountains(14, 320, 50, { seed: 13, snow: false, color: 0x9a5a4a });
  const rock = sandstone(3), rock2 = sandstone(7, [190, 100, 90]);
  // the Siq: two winding walls from the south flats up to the Treasury forecourt
  const SIQ = [[-4, 40], [6, 24], [-6, 8], [4, -6], [-2, -18]];
  for (let i = 0; i < SIQ.length - 1; i++) {
    const [ax, az] = SIQ[i], [bx, bz] = SIQ[i + 1], len = Math.hypot(bx - ax, bz - az) + 4, ry = Math.atan2(bx - ax, bz - az);
    const cx = (ax + bx) / 2, cz = (az + bz) / 2, side = [Math.cos(ry), -Math.sin(ry)];
    for (const s of [-1, 1]) { const hh = 16 + (i % 2) * 4; w.box(6, hh, len, i % 2 ? rock : rock2, cx + side[0] * s * 7, f(cx, cz) + hh / 2 - 0.5, cz + side[1] * s * 7, { ry }); }
  }
  // the Treasury at the end of the Siq, and the forecourt between it and the cliffs
  treasury(w, 0, -42, 0, { y: f(0, -42) - 0.2, mat: rock, w: 20, h: 22 });
  for (const s of [-1, 1]) w.box(24, 20, 14, rock2, s * 24, f(s * 24, -40) + 9.5, -40, { ry: s * 0.15 });
  for (const [dx, dz] of [[-9, -24], [-3, -30], [3, -30], [9, -24]]) column(w, dx, f(dx, dz), dz, 0.7, 7, rock);
  w.box(2.4, 0.6, 2.4, rock2, 0, f(0, -33) + 0.3, -33);   // the altar in the forecourt
  for (const [x, z] of [[-8, -20], [8, -20], [-12, -34], [12, -34]]) lampAt(w, x, z, 3.2, 0xffb060, { ei: 3 });
  // the carvings along the west cliff: tombs with coloured doorways, where the red still clings
  const TOMBS = [[-30, -6], [-38, 6], [-30, 18], [-40, 30]];
  w.box(14, 18, 50, rock, -50, f(-50, 12) + 8.5, 12);
  TOMBS.forEach(([x, z], i) => { column(w, x - 2.5, f(x, z), z, 0.5, 5, rock); column(w, x + 2.5, f(x, z), z, 0.5, 5, rock); w.box(7, 1, 2, rock, x, f(x, z) + 5.6, z); w.box(2.2, 4, 0.4, M([0xd83a6a, 0xff8a2a, 0xffd23f, 0xd83a2a][i]), x, f(x, z) + 2, z - 0.3, { collide: false }); });
  // the High Place: a flight of ledges up the east cliff to a lookout, with the drops along them
  const HX = 30, HZ = 4;
  w.box(14, 26, 60, rock2, HX + 16, f(HX, HZ) + 12.5, HZ, { ry: -0.1 });
  const ledges = [];
  for (let k = 0; k < 7; k++) { const y = f(HX, HZ) + k * 2.6, z = HZ + 18 - k * 6, x = HX + (k % 2 ? 2 : 6); w.box(8, 0.8, 5, rock, x, y + 0.4 + 0.1, z); if (k > 0) w.steps(6, 3, 0.43, 0.6, rock, x + (k % 2 ? 2 : -2), y - 2.6 + 0.5, z + 5.8, Math.PI); ledges.push([x, y + 0.9 + 1.1, z]); }
  const topY = f(HX, HZ) + 6 * 2.6 + 0.9;
  w.box(10, 0.8, 8, rock, HX + 4, topY - 0.4, HZ - 22); w.sign("HIGH PLACE", 3, 0.7, HX + 4, topY + 1.8, HZ - 25.8, 0, { bg: "#3a1a10", fg: "#ffd8a0" });
  // camels by the Siq mouth, and the Blotter camp out on the flats
  camelStanding(w, -14, 44, 0.4); camelStanding(w, -18, 50, -0.3); camelStanding(w, 16, 46, 2.6, { blanket: 0x2a8ad8 });
  for (const [x, z, ry] of [[-16, 66, 0.3], [-6, 74, -0.5], [10, 70, 1.1]]) tent(w, x, z, ry, { color: 0x8a8a92 });
  campfire(w, -2, 66);
  rocks(w, [[-24, f(-24, 60), 60, 2.6], [26, f(26, 62), 62, 3], [40, f(40, 40), 40, 2.2], [-46, f(-46, 50), 50, 3.2], [50, f(50, -10), -10, 2.4]], { color: 0x9a5a4a });
  void corridor;

  const H = (x, z, dy = 1.1) => [x, f(x, z) + dy, z];
  w.missionData = {
    pt1: { spots: TOMBS.map(([x, z], i) => [x, f(x, z), z + 1.8, [0xd83a6a, 0xff8a2a, 0xffd23f, 0xd83a2a][i], 10]) },
    pt2: { path: [[-10, 48], [16, 40], [40, 52], [44, 76], [20, 92], [-16, 90], [-40, 72], [-36, 50]], car: "camel", quarry: "camel", carOpts: { maxSpeed: 13, force: 1200, grip: 1.8 }, lead: 30, y: 0.25 },
    pt3: { cells: [H(HX - 2, HZ + 24), ...ledges, [HX + 4, topY + 1.1, HZ - 22]] },
    pt4: { start: [0, f(0, -20), -20], goal: [0, f(0, -33), -33.8], range: 9, guards: [{ path: [[-10, -22], [10, -22]], speed: 1.6, pause: 1.4 }, { path: [[10, -28], [-10, -28]], speed: 1.5, pause: 1.2, phase: 5 }, { path: [[-6, -36], [6, -36]], speed: 1.7, pause: 1.0, phase: 2 }, { path: [[14, -30], [14, -20]], speed: 1.4, pause: 1.6, phase: 8 }] },
    pt5: { center: [0, f(0, 74), 74], radius: 18, height: 6 },
  };
  void groundAt; void THREE;
  return { spawn: [0, f(0, 46) + 0.3, 46], yaw: 0, bolt: [2, f(2, 47) + 0.3, 47], contact: [-5, f(-5, 44), 44, 0.8] };
}
