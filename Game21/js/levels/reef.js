// The Great Barrier Reef: a research pontoon anchored over a coral garden,
// an old pontoon beside it, bommies and clownfish below, a manta cruising
// by, and the drain pipe snaking away across the sea floor.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks, bollard, torpedoParked, buoy, seaweed, fish, bubbles, gulls, coral, bigFish, pipe } from "../seakit.js";

export function buildReef(w) {
  w.setSky("tropical");
  // the seabed: sand at nine metres down with bommies rising from it
  const bommies = [[10, 28, 5, 4], [-14, 24, 6, 5], [26, 10, 4, 3.5], [-30, 16, 5, 4.5], [-22, -20, 6, 5], [20, -30, 5, 4], [40, 22, 4, 3.5], [-40, -6, 5, 4]];
  const f = (x, z) => {
    let h = -9 + Math.sin(x * 0.25) * Math.cos(z * 0.3) * 0.3;
    for (const [bx, bz, r, bh] of bommies) { const d = Math.hypot(x - bx, z - bz); if (d < r) h = Math.max(h, -9 + bh * Math.cos(d / r * Math.PI / 2)); }
    if (z < -30) h -= (-30 - z) * 0.2;
    if (Math.hypot(x, z) > 110) h -= (Math.hypot(x, z) - 110) * 0.3;
    return h;
  };
  w.terrain(360, 150, f, M("sand", { args: [91, [220, 200, 160]], repeat: [50, 50], normal: 0.6 }));
  w.ocean({ level: 0, box: [0, 0, 240, 240], shallow: 0x3ad0d0, deep: 0x0a5a8a, under: 0x1a7a9a, see: 40, caustics: 1.4 });
  // the pontoon: a big floating deck with a hut, railings and ladders, and the old pontoon beside it
  const deck = M("wood", { args: [93, [200, 176, 130]], repeat: [8, 6] }), white = M(0xf4f4f0, { rough: 0.5 }), rail = M(0x4a5058, { metal: 0.6 });
  w.box(30, 1.6, 24, white, 0, 0.8, 0); w.box(30.2, 0.1, 24.2, deck, 0, 1.65, 0, { collide: false });
  w.box(12, 1.4, 12, white, 34, 0.7, 0); w.box(12.2, 0.1, 12.2, deck, 34, 1.45, 0, { collide: false });
  w.box(8, 0.5, 3, deck, 22, 1.25, 0);   // the walkway between them
  for (const [x0, z0, x1, z1] of [[-15, -12, 15, -12], [-15, 12, -4, 12], [4, 12, 15, 12], [-15, -12, -15, 12]]) w.fence(x0, z0, x1, z1, 1.0, rail);
  for (const [x, z] of [[-14, -11], [14, -11], [-14, 11], [14, 11], [28, -5], [40, 5]]) bollard(w, x, 1.6, z);
  w.building(8, 3.2, 6, -8, -4, { wall: [236, 240, 244], seed: 95, roof: "flat", trim: 0x9ab0c0, win: { lit: 0.3, glass: "#3a7aa0" }, y: 1.6 });
  w.sign("REEF RESEARCH", 5, 0.9, -8, 4.0, -0.94, 0, { bg: "#0c2a4a", fg: "#9fe0ff", glow: 0.8 });
  w.box(3, 0.4, 3, M(0x2a8ad8, { rough: 0.5 }), 13, 1.8, -9); w.cyl(0.4, 0.4, 3, M(0xe8e8e0), 13, 3.4, -9, { seg: 12 }); // a water tank
  for (const [x, z] of [[-12, 8], [12, 8], [12, -8], [-4, 8]]) { w.cyl(0.07, 0.1, 3.6, M(0x1e2228, { metal: 0.6 }), x, 3.4, z, { seg: 8 }); w.mesh(new THREE.SphereGeometry(0.22, 12, 8), M(0xffe0a0, { emissive: 0xffe0a0, ei: 4 }), x, 5.3, z, { cast: false }); }
  // the ladders down into the water on the south side
  for (const x of [-8, 8]) { for (let i = 0; i < 5; i++) w.box(0.9, 0.05, 0.08, rail, x, 1.5 - i * 0.5, 12.2, { collide: false }); w.box(0.06, 3, 0.06, rail, x - 0.45, 0.3, 12.2, { collide: false }); w.box(0.06, 3, 0.06, rail, x + 0.45, 0.3, 12.2, { collide: false }); }
  torpedoParked(w, 0, 0, -15, 0);
  buoy(w, -30, -30); buoy(w, 50, 30, 0xffd23f); buoy(w, 20, 50, 0x7bed9f);
  // the drain pipe along the seabed and away to the south
  pipe(w, [[-10, -8.5, -30], [0, -9.5, -40], [6, -10.5, -52], [0, -12.5, -66], [-10, -14, -80], [-4, -16, -100]], 2.6, { mat: M(0x4a5058, { metal: 0.7, rough: 0.4, side: THREE.DoubleSide }), ringEvery: 1 });
  // the coral garden
  for (const [bx, bz, r, bh] of bommies) { for (let k = 0; k < 4; k++) { const a = k * 1.7 + bx, x = bx + Math.cos(a) * r * 0.6, z = bz + Math.sin(a) * r * 0.6; coral(w, x, f(x, z), z, 1.2 + (k % 2) * 0.4, 100 + k + bx, { n: 6 }); } coral(w, bx, -9 + bh, bz, 1.4, 200 + bx); }
  for (let i = 0; i < 12; i++) { const x = -50 + i * 9, z = 36 + (i % 3) * 10; coral(w, x, f(x, z), z, 1.0 + (i % 3) * 0.3, 300 + i); }
  seaweed(w, 4, f(4, 20), 20, 8, 3); seaweed(w, -26, f(-26, 30), 30, 8, 3.5); seaweed(w, 30, f(30, -10), -10, 6, 2.6);
  rocks(w, [[18, -8.5, 40, 2.6], [-36, -8.5, 34, 3.0], [46, -8.4, -14, 2.4]], { color: 0x6a6a72 });
  fish(w, 10, -6, 28, 6, 36, 0xff8a2a, { size: 0.8 }); fish(w, -14, -5, 24, 6, 30, 0xffd23f, { size: 0.8 }); fish(w, -22, -6, -20, 7, 30, 0x9ad8ff); fish(w, 24, -7, 10, 5, 24, 0x7bed9f);
  fish(w, -30, -4, 60, 12, 40, 0xc0c8d0, { size: 1.4, speed: 0.3 });
  bigFish(w, "manta", [[-30, -4, -30], [30, -5, -40], [40, -3, 30], [-20, -5, 40]], { speed: 2.2 });
  bigFish(w, "turtle", [[20, -5, 20], [40, -6, 40], [10, -6, 50], [-10, -4, 30]], { speed: 1.3 });
  bubbles(w, 12, f(12, 32), 32); bubbles(w, -30, f(-30, 12), 12);
  gulls(w, 0, 12, 0, 4);
  w.floorY = -40;
  w.missionData = {
    rf1: { entry: [8, -1.6, 16], bubbles: [[6, -4, 26], [-10, -3.5, 30]], cells: [[10, -3.6, 24], [14, -5, 30], [4, -6.4, 34], [-8, -4.8, 28], [-14, -3.2, 22], [-20, -6, 30], [20, -4, 18], [0, -7.2, 40]] },
    rf2: { entry: [-16, -1.6, 12], bubbles: [[-26, -5, 14], [-34, -4, 24]], cells: [[-24, -5, 12], [-30, -3.4, 18], [-36, -6, 8], [-28, -7, 26], [-40, -5.4, 20], [-22, -6.6, 30], [-44, -7, 10], [-34, -6.5, 28]] },
    rf3: { start: [0, -2.4, -18, Math.PI], exit: [0, 1.65, -10, Math.PI], rings: [[-6, -6, -26, 2.4, 0.4], [-8, -8, -32, 2.4, 0.2], [2, -9.5, -42, 2.4, -0.4], [6, -10.5, -52, 2.4, 0], [2, -12, -62, 2.4, 0.3], [-6, -13.5, -74, 2.4, 0.4], [-10, -14, -84, 2.4, 0.2], [-6, -15, -96, 2.4, -0.2]] },
    rf4: { start: [0, -2.4, -18, Math.PI], exit: [0, 1.65, -10, Math.PI], crates: [[30, -8.6, 14], [44, -8.6, 8], [36, -8.5, -14]], drop: [34, -3, 0], dropR: 3.5 },
    rf5: { title: "PIPE PRESSURE" },
    rf6: { area: [2, -2, 9], bots: [[-6, 1.6, 4], [6, 1.6, -4], [-10, 1.6, -8], [10, 1.6, 6], [0, 1.6, 8], [-4, 1.6, -9]] },
  };
  return { spawn: [0, 1.65, 6], yaw: Math.PI, bolt: [2, 1.65, 6], contact: [-4, 1.65, 3, 2.4] };
}
