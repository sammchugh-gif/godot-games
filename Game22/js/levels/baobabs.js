// The Avenue of the Baobabs, Madagascar: a red dirt road between trees a
// thousand years old, at sunset. Chameleons on the branches, lemurs in the
// Blotters' camp, a zebu cart on the road, and pads at the foot of every
// baobab to bounce up to the drops on top.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks, lampAt } from "../seakit.js";
import { baobab, chameleon, lemur, tent, campfire, stall, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("sunset");
  const f = (x, z) => {
    let h = Math.sin(x * 0.04) * Math.cos(z * 0.05) * 0.8 + Math.sin(x * 0.11 + z * 0.09) * 0.25;
    if (Math.abs(z) < 5) h = Math.sin(x * 0.04) * 0.3; // the road is flat
    if (Math.abs(x) > 80) h += (Math.abs(x) - 80) * 0.15;
    return h;
  };
  w.terrain(360, 150, f, M("sand", { args: [8, [170, 90, 60]], repeat: [40, 40], normal: 0.5 }));
  w.mountains(8, 260, 30, { seed: 17, snow: false, color: 0x6a4a3a });
  // the avenue: the road, and the baobabs either side, each with a bounce pad at its foot
  w.box(160, 0.1, 9, M("sand", { args: [9, [150, 70, 40]], repeat: [30, 2] }), 0, 0.05, 0, { collide: false });
  const TREES = [], CLIMB = [0, 2, 5, 7, 9, 11, 12, 14];
  let n = 0;
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const x = -56 + i * 16 + (s > 0 ? 6 : 0), z = s * 9, h = 12 + (i * 3 + (s > 0 ? 1 : 0)) % 6; const top = baobab(w, x, z, h, { color: [0x9a7a5a, 0x8a6a4a, 0xa88868][i % 3], climb: CLIMB.includes(n) ? (s > 0 ? 0.5 : 3.6) : false }); TREES.push({ x, z, h, top }); n++; }
  // a few smaller baobabs and thorn bushes further out, and rocks
  for (const [x, z] of [[-70, 30], [-40, 40], [20, 46], [60, 36], [-60, -36], [0, -44], [50, -40]]) baobab(w, x, z, 7 + (Math.abs(x) % 3), { leaf: 0x6a8a3a });
  for (let i = 0; i < 20; i++) { const x = -80 + (i * 37) % 160, z = (i % 2 ? 1 : -1) * (18 + (i * 13) % 30); w.mesh(new THREE.IcosahedronGeometry(1 + (i % 3) * 0.4, 1), M(0x5a6a2a, { rough: 1, flat: true }), x, f(x, z) + 0.6, z); }
  rocks(w, [[-30, f(-30, 24), 24, 2], [36, f(36, -26), -26, 2.4], [70, f(70, 10), 10, 3]], { color: 0x6a4a3a });
  // the village end of the avenue: a stall, lamps, a well
  stall(w, -70, 6, 0.2, { awning: 0xffb020, goods: [0x3ad06a, 0xffd23f, 0xff8a2a] });
  for (const x of [-72, -40, -8, 24, 56]) lampAt(w, x, -6.5, 3.6, 0xffb060, { ei: 2.5 });
  w.cyl(1.2, 1.3, 1.0, M("stone", { args: [16, [140, 120, 100]], repeat: [3, 1] }), -76, f(-76, -8) + 0.5, -8, { seg: 14 });
  // the chameleons, sitting where the colour still is: on rocks, a stall, a low branch
  const CHAM = [[-30, f(-30, 24) + 1.4, 24, 0.33], [36, f(36, -26) + 1.7, -26, 0.08], [-70, f(-70, 6) + 1.05, 6, 0.6], [70, f(70, 10) + 2.1, 10, 0.16], [0, f(0, -44) + 7.4, -44, 0.83]];
  CHAM.forEach(([x, y, z, hue], i) => chameleon(w, x, y, z, hue, i * 1.3));
  // the Blotters' camp behind the avenue: grey tents, a drained fire, lemurs everywhere
  const CX = -8, CZ = 32;
  for (const [dx, dz, ry] of [[-10, -4, 0.3], [8, -6, -0.5], [-6, 10, 1.1], [10, 8, 2.2]]) tent(w, CX + dx, CZ + dz, ry, { color: 0x8a8a92 });
  campfire(w, CX, CZ);
  for (const [dx, dz] of [[-14, 2], [14, -2], [2, 14], [-4, -12]]) lemur(w, CX + dx, f(CX + dx, CZ + dz), CZ + dz, dx * 0.4);
  w.box(2.6, 1.6, 2.6, M(0x4a4a54, { metal: 0.5 }), CX + 16, f(CX + 16, CZ + 10) + 0.8, CZ + 10);
  w.cyl(0.4, 0.4, 3, M(0x2a2a30, { metal: 0.6 }), CX + 16, f(CX + 16, CZ + 10) + 3.1, CZ + 10, { seg: 10, collide: false });
  // the zebu cart track: a loop of dirt road round the camp and back along the avenue
  const TRACK = [[-40, 4], [-4, 4], [30, 4], [46, 22], [30, 44], [-4, 54], [-40, 44], [-56, 22]];
  w.box(60, 0.08, 6, M("sand", { args: [9, [150, 70, 40]], repeat: [12, 1] }), -4, 0.04, 50, { collide: false });

  const H = (x, z, dy = 1.1) => [x, f(x, z) + dy, z];
  w.missionData = {
    bb1: { spots: CHAM.map(([x, y, z, hue], i) => [x + 2.6, y - (i === 4 ? 7.2 : i === 2 ? 0.9 : i === 3 ? 1.9 : 1.2), z + 2.0, new THREE.Color().setHSL(hue, 0.8, 0.5).getHex(), 10]) },
    // (on the low branches of the climbable trees, a jump up, and on the ground between them)
    bb2: { cells: [0, 5, 9, 14].map(i => { const t = TREES[i], a = (t.z > 0 ? 0.5 : 3.6) + 0.6 * 2 / (t.h * 0.16 + 0.85), rr = t.h * 0.16 + 0.85; return [t.x + Math.cos(a) * (rr + 1.2), f(t.x, t.z) + 1.6, t.z + Math.sin(a) * (rr + 1.2)]; }).concat([H(-48, 0), H(-24, -3), H(4, 3), H(28, -2)]) },
    bb3: { path: TRACK, car: "zebu", quarry: "zebu", carOpts: { maxSpeed: 12, force: 1300, grip: 2.2 }, lead: 30, y: 0.25 },
    bb4: { things: [["lemur", CX - 8, f(CX - 8, CZ - 8), CZ - 8, 0.3], ["lemur", CX + 4, f(CX + 4, CZ - 12), CZ - 12, 0], ["lemur", CX + 12, f(CX + 12, CZ + 2), CZ + 2, 0.5], ["lemur", CX - 12, f(CX - 12, CZ + 10), CZ + 10, 0], ["lemur", CX + 6, f(CX + 6, CZ + 16), CZ + 16, 0.4], ["lemur", CX - 2, f(CX - 2, CZ - 4), CZ - 4, 1.0]] },
    bb5: { gates: [[-50, 0, 0.3], [-36, -2, 0], [-20, 2, 0], [-4, -2, -0.3], [12, 2, 0.3], [28, 0, 0]].map(([x, z, r]) => [x, f(x, z), z, r + Math.PI / 2]) },
  };
  void groundAt; void H;
  return { spawn: [-62, f(-62, 0) + 0.3, 0], yaw: -Math.PI / 2, bolt: [-63, f(-63, 1) + 0.3, 1.5], contact: [-66, f(-66, -2), -2, 1.2] };
}
