// Dinosaur Valley, 66 million years ago: a warm green valley between wooded hills, with a
// smoking volcano to the north and long-necked sauropods grazing far off. A shallow river runs down
// the west side (a fallen log crosses it); the mother triceratops's nest is in the meadow to the
// east; a T. rex sleeps among the boulders in the south-west; and the POLARIS time-sled has landed
// in the south, where Dr Flint is waiting. Pebble isn't here yet: she hatches in the fourth mission.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks } from "./kit.js";
import { ferns, cycad, treeFern, monkeyPuzzle, nest, volcano, sauropod, pterosaurs, timeSled, tufts, blossoms } from "./timekit.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const RIVER = -34, NEST = [42, 12];
// low rocky knolls to climb (and find sparks on): [x, z, r, h]
const KNOLLS = [[-8, -22, 5, 1.3], [14, 28, 6, 1.5], [-18, 40, 5, 1.2], [62, -22, 5, 1.4], [70, 40, 6, 1.6]];
export function ground(x, z) {
  let h = Math.sin(x * 0.045) * 0.5 + Math.cos(z * 0.05 + 0.6) * 0.45 + Math.sin((x + z) * 0.11) * 0.12;
  // the valley's sides
  h += S(95, 150, Math.abs(x)) * 34 + S(115, 170, z) * 30 + S(-105, -160, z) * 30;
  // the river's channel
  h -= 1.0 * S(6, 2.5, Math.abs(x - RIVER));
  for (const [cx, cz, r, H] of KNOLLS) h += H * Math.min(1, Math.max(0, (1 - Math.hypot(x - cx, z - cz) / r) * 3));
  // flat round the nest and where the sled landed
  const f = Math.max(S(14, 8, Math.hypot(x - NEST[0], z - NEST[1])), S(12, 6, Math.hypot(x, z + 60)));
  return h * (1 - f);
}

export function buildDino(w) {
  w.setSky({ top: "#4a7ab8", mid: "#b8d4a0", bottom: "#e8e2b8", sun: [36, 150], sunColor: "#fff0c8", sunI: 2.2, hemi: ["#e8f0d0", "#5a6a3a", 0.66], fog: [110, 440], clouds: 12, cloudTint: "#f4ecd8" });
  const G = ground;
  w.terrain(420, 160, G, M("grass", { args: [231, [84, 124, 50]], repeat: [70, 70] }));
  w.phys.fixedBox(0, -12, 0, 300, 1, 300); w.floorY = -20;
  w.overlay(RIVER, 0, 12, 300, M("sand", { args: [233, [150, 128, 90]], repeat: [2, 40] }), (x, z) => Math.abs(x - RIVER) < 5.5 && G(x, z) < 0.6, 0.03);
  w.water(8, 300, RIVER, -0.55, 0, 0x3a8a8a, { opacity: 0.85 });
  // a fallen log across the river, and stepping stones
  w.cyl(0.45, 0.5, 11, M("wood", { args: [235, [110, 80, 50]], repeat: [1, 3] }), RIVER, -0.55, 22, { rz: Math.PI / 2, collide: false });
  w.phys.fixedBox(RIVER, -0.55, 22, 5.5, 0.45, 0.45);
  // (it floats high enough to walk along: its top is just clear of the water)
  for (let i = 0; i < 4; i++) w.cyl(0.6, 0.7, 0.5, M("rock", { args: [237, [120, 116, 108]] }), RIVER - 3 + i * 2, -0.6, -30 + (i % 2) * 0.6, { seg: 10 });

  // ---- the chase loop round the valley floor, kept clear
  const LOOP = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; LOOP.push([8 + Math.cos(a) * 62, 6 + Math.sin(a) * 50]); }
  const nearLoop = (x, z, m) => LOOP.some(([ax, az], i) => { const [bx, bz] = LOOP[(i + 1) % LOOP.length], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2)); return Math.hypot(ax + vx * t - x, az + vz * t - z) < m; });
  const clear = (x, z) => !nearLoop(x, z, 6) && Math.hypot(x - NEST[0], z - NEST[1]) > 12 && Math.hypot(x, z + 60) > 8 && Math.abs(x - RIVER) > 7 && !(x < -44 && x > -92 && z > -40 && z < 24);

  // ---- the plants: fern fields, cycads, tree ferns, and monkey-puzzle trees round the edges
  const fernSpots = [];
  for (let i = 0; i < 480; i++) { const a = i * 2.39996, d = 6 + (i * 37) % 124, x = Math.cos(a) * d * 1.1, z = Math.sin(a) * d; if (!clear(x, z) || Math.abs(x) > 110 || z > 125 || z < -110) continue; fernSpots.push([x, G(x, z), z, 0.8 + (i % 5) * 0.2]); }
  ferns(w, fernSpots);
  // grass tufts all over the valley floor, and the first flowers on low shrubs
  const tuftSpots = [];
  for (let i = 0; i < 3500; i++) { const a = i * 2.39996, d = 3 + Math.sqrt(i / 3500) * 118, x = Math.cos(a) * d * 1.05, z = Math.sin(a) * d + 6; if (Math.abs(x - RIVER) < 6 || Math.hypot(x - NEST[0], z - NEST[1]) < 4.5) continue; tuftSpots.push([x, G(x, z), z, 0.8 + (i % 5) * 0.15]); }
  tufts(w, tuftSpots, 0x5a8a36);
  const bushSpots = [];
  for (let i = 0; i < 40; i++) { const a = i * 2.1 + 0.3, d = 14 + (i * 31) % 90, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9; if (!clear(x, z)) continue; bushSpots.push([x, G(x, z), z, 0.8 + (i % 3) * 0.3]); }
  blossoms(w, bushSpots, 0xf4e0ec);
  for (let i = 0; i < 16; i++) { const a = i * 1.7, d = 25 + (i * 23) % 70, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9; if (!clear(x, z)) continue; cycad(w, x, G(x, z), z, 1.6 + (i % 3) * 0.5); }
  for (let i = 0; i < 12; i++) { const a = i * 2.1 + 0.4, d = 40 + (i * 29) % 60, x = Math.cos(a) * d, z = Math.sin(a) * d; if (!clear(x, z)) continue; treeFern(w, x, G(x, z), z, 4 + (i % 3)); }
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, x = Math.cos(a) * 100, z = 10 + Math.sin(a) * 92; monkeyPuzzle(w, x, G(x, z), z, 12 + (i % 4) * 2); }
  for (const [x, z] of [[-70, -60], [80, -70], [-60, 90], [90, 80], [-95, 20], [95, -10]]) rocks(w, x, z, 5, 6, 1.6, { y: G(x, z) });
  // on the skyline: the volcano, the sauropods, and pterosaurs overhead
  volcano(w, 30, 300, 110, 150, -10);
  w.mountains(10, 260, 60, { color: 0x5a6a48, snow: false });
  sauropod(w, -120, G(-120, 150) - 1, 150, 1.4, 0.8); sauropod(w, -150, G(-150, 120) - 1, 120, 1.2, 2.4); sauropod(w, 130, G(130, 170) - 1, 170, 1.5, -0.5);
  pterosaurs(w, 10, 45, 20, 6, 55);

  // ---- the mother's nest, and the T. rex's boulders
  const ny = G(NEST[0], NEST[1]);
  nest(w, NEST[0], ny, NEST[1], 4, 2.6);
  const REX = [-64, -8];
  rocks(w, -54, -18, 3, 2.5, 1.5, { y: G(-54, -18) });
  for (const [x, z, s] of [[-52, -20, 1.4], [-68, 2, 1.6], [-76, 8, 1.3], [-60, -30, 1.2], [-72, -16, 1.5], [-82, 0, 1.2]]) w.sphere(s, M("rock", { args: [239, [118, 112, 100]] }), x, G(x, z) + s * 0.5, z, { collide: true, seg: 12 });
  // the egg cart's hiding place: a lean-to of fronds the Sandbots built
  const HIDE = [-84, 16], hy = G(HIDE[0], HIDE[1]);
  w.box(3, 0.2, 3, M("wood", { args: [241, [120, 90, 50]] }), HIDE[0], hy + 2.2, HIDE[1], { rx: 0.4 });
  for (const s of [-1, 1]) w.cyl(0.08, 0.1, 2.4, M(0x6a4a2a), HIDE[0] + s * 1.3, hy + 1.2, HIDE[1] + 1.2);

  // ---- where Rory lands: the time-sled, and Dr Flint's camp
  const sy = G(0, -60);
  timeSled(w, -5, sy, -63, 0.3);
  w.box(2.4, 0.1, 1.4, M("wood", { args: [243, [150, 110, 70]] }), 7, sy + 0.8, -63);
  for (const [x, z] of [[6, -63.5], [8, -62.5]]) w.cyl(0.05, 0.05, 0.8, M(0x5a3a1a), x, sy + 0.4, z, { collide: false });
  w.sign("POLARIS CAMP", 3.2, 0.6, 7, sy + 1.6, -63.8, 0, { bg: "#1a1030", fg: "#c8a8ff", glow: 0.9 });

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const bot = (x, z) => [x, G(x, z) + 0.05, z];
  w.missionData = {
    dino1: { cells: [on(-8, -22, 2.4), on(6, -34), on(14, 28, 2.6), on(-18, 40, 2.3), [RIVER, 0.85, 22], on(-20, 8)] },
    dino2: { area: [NEST[0], NEST[1], 16], bots: [bot(32, 22), bot(52, 4), bot(30, 2), bot(54, 22)] },
    dino3: { look: "egg", size: 0.9, pad: [NEST[0], ny, NEST[1]], padR: 2.4, blocks: [on(24, 36, 0.6), on(60, 30, 0.6), on(62, -6, 0.6)] },
    dino4: { critter: "babytri", hazard: "compy", kids: [on(18, -18, 0.05), on(66, 26, 0.05), on(28, 46, 0.05)], goal: [NEST[0], ny, NEST[1]], goalR: 3, crabs: [[48, -6, 62, -6, 1.4], [18, 30, 30, 38, 1.2]] },
    dino5: { what: "cart", robot: "trex", range: 9, angle: 34, start: bot(-44, -38), goal: bot(HIDE[0], HIDE[1] - 1.5),
      guards: [{ path: [[REX[0], REX[1]], [REX[0] + 0.5, REX[1] - 0.5]], speed: 0.3, pause: 3.5, y: G(REX[0], REX[1]) }] },
    dino6: { what: "egg cart", path: LOOP, y: 0.4, car: "timesled", carOpts: { grip: 2.4, maxSpeed: 16 }, quarry: "eggcart", lead: 26 },
  };
  return {
    spawn: on(0, -56, 0.1), yaw: 0, pebble: on(2, -55, 0), contact: [...on(5, -52, 0), Math.PI],
    stars: [on(-96, -40, 0.2), on(92, 30, 0.2), on(-40, 70, 0.2)],
    // Pebble hatches at the start of the fourth mission
    apply: save => { w.noPebble = !save.done.includes("dino3"); },
    at: { dino1: [-2, -44, 20], dino2: [30, -2, 20], dino3: [NEST[0] - 8, NEST[1] - 8, 20], dino4: [NEST[0] - 6, NEST[1] - 10, 20], dino5: [-44, -42, 20], dino6: [LOOP[13][0] + 3, LOOP[13][1], 20] },
  };
}
