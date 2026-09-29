// The Ice Age, 20,000 years ago: a snowy valley under a pale sky, snow drifting down. Tuva's
// family camp of hide tents is in the west, round a fire; a woolly mammoth herd grazes out on the
// tundra to the north, with the glacier's blue wall behind; and in the cliff to the east is the
// painted cave: a corridor lit by torch bowls to a hall of paintings, horses and mammoths and
// handprints. Icicles hang over the cave's mouth. The sled lands in the south.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks } from "./kit.js";
import { critter, animateCritter } from "../critters.js";
import { timeSled, snowfall, hideTent, campfire, cavePainting, torch } from "./timekit.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const CAMP = [-34, -14], HERD = [-24, 62], CLIFF = 58;
// the cave: a corridor from the cliff face east, then the painted hall
const inCorridor = (x, z) => x > CLIFF - 2 && x < 98 && Math.abs(z) < 3.2;
const inHall = (x, z) => x > 94 && x < 114 && Math.abs(z) < 10;
export function ground(x, z) {
  if (inCorridor(x, z) || inHall(x, z)) return 0;
  let h = Math.sin(x * 0.04) * 0.6 + Math.cos(z * 0.045 + 0.4) * 0.5 + Math.sin((x - z) * 0.09) * 0.15;
  // the cliff to the east (the cave is cut into it), the glacier to the north, hills round the rest
  h += S(CLIFF - 4, CLIFF + 1, x) * 16;
  h += S(120, 170, z) * 28 + S(-100, -150, z) * 24 + S(-110, -160, x) * 26;
  // flat round the camp and where the sled lands
  const f = Math.max(S(14, 8, Math.hypot(x - CAMP[0], z - CAMP[1])), S(12, 6, Math.hypot(x, z + 58)));
  return h * (1 - f);
}

export function buildIceAge(w) {
  w.setSky({ top: "#5a86c0", mid: "#c8daea", bottom: "#eef2f6", sun: [22, 200], sunColor: "#fff6ea", sunI: 1.9, hemi: ["#e8f0ff", "#8a9098", 0.78], fog: [70, 330], clouds: 16, cloudTint: "#eef2f8" });
  const G = ground;
  w.terrain(420, 170, G, M("snow", { args: [261, [236, 240, 246]], repeat: [80, 80] }));
  w.phys.fixedBox(0, -12, 0, 300, 1, 300); w.floorY = -20;
  // the cliff shows rock where it's steep; the cave floor is rock too
  const steep = (x, z) => Math.hypot(G(x + 0.5, z) - G(x - 0.5, z), G(x, z + 0.5) - G(x, z - 0.5));
  w.overlay(0, 0, 420, 420, M("rock", { args: [263, [118, 114, 110]], repeat: [60, 60] }), (x, z) => steep(x, z) > 0.8 || inCorridor(x, z) || inHall(x, z), 0.04);
  snowfall(w, 1);
  w.mountains(10, 250, 70, { color: 0x7a8494 });

  // ---- the glacier: a long blue wall of ice across the north
  const iceM = new THREE.MeshPhysicalMaterial({ color: 0xbfe0f4, roughness: 0.2, clearcoat: 0.6, emissive: 0x2a5a8a, emissiveIntensity: 0.15 });
  for (let i = 0; i < 9; i++) { const x = -160 + i * 40, h = 22 + (i % 3) * 6; w.box(40, h, 14, iceM, x, G(x, 150) + h / 2 - 4, 150 + (i % 2) * 6, { collide: false }); }

  // ---- the ride's route across the tundra, kept clear
  const RIDE = [[-46, -2], [-70, 36], [-58, 88], [-14, 110], [40, 100], [48, 60], [30, 26]];
  const nearRide = (x, z, m) => RIDE.some(([ax, az], i) => { if (i === RIDE.length - 1) return false; const [bx, bz] = RIDE[i + 1], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2)); return Math.hypot(ax + vx * t - x, az + vz * t - z) < m; });
  const clear = (x, z) => !nearRide(x, z, 7) && Math.hypot(x - CAMP[0], z - CAMP[1]) > 14 && Math.hypot(x, z + 58) > 12 && x < CLIFF - 6 && Math.hypot(x - HERD[0], z - HERD[1]) > 14;
  for (let i = 0; i < 46; i++) { const a = i * 2.39996, d = 30 + (i * 41) % 110, x = Math.cos(a) * d, z = Math.sin(a) * d; if (!clear(x, z) || G(x, z) > 6) continue; w.pine(x, z, 7 + (i % 4) * 2, { y: G(x, z), snow: true }); }
  for (const [x, z] of [[-80, -50], [20, -80], [-90, 60], [30, 70], [-10, 20]]) if (clear(x, z)) rocks(w, x, z, 4, 5, 1.4, { y: G(x, z), color: [150, 150, 156] });

  // ---- the woolly mammoth herd, grazing
  const herd = [];
  for (let i = 0; i < 4; i++) { const a = i * 1.7, x = HERD[0] + Math.cos(a) * 7, z = HERD[1] + Math.sin(a) * 6; const m = critter("mammoth", 0.9); m.position.set(x, G(x, z), z); m.rotation.y = a + 1; w.scene.add(m); herd.push(m); w.phys.fixedCyl(x, G(x, z) + 1.6, z, 1.5, 1.6); }
  w.updaters.push((dt) => { for (const m of herd) animateCritter(m, dt, 0.15); });

  // ---- Tuva's camp: tents round the fire, and a gap in the windbreak for the snow wall
  const cy = G(CAMP[0], CAMP[1]);
  for (const [dx, dz, yaw] of [[-7, -3, 0.9], [-2, 7, 2.6], [6, 4, -2.2]]) hideTent(w, CAMP[0] + dx, cy, CAMP[1] + dz, 2.2, 3.4, yaw);
  campfire(w, CAMP[0], cy, CAMP[1]);
  for (let i = 0; i < 6; i++) { const x = CAMP[0] + 4 + i * 1.3; w.box(1.2, 1.1, 0.9, M(0xf4f8fc, { rough: 0.6 }), x, cy + 0.55, CAMP[1] + 12.5); }
  const WALL = [CAMP[0] - 5, cy, CAMP[1] + 12.5];

  // ---- the painted cave: its roof, the torches down the corridor, the paintings in the hall
  const roofM = M("rock", { args: [265, [96, 92, 88]], repeat: [6, 2] });
  w.box(98 - CLIFF + 4, 12, 8.4, roofM, (CLIFF - 4 + 98) / 2, 4.6 + 6, 0);
  w.box(22, 12, 22, roofM, 104, 5.2 + 6, 0);
  // (the cave's mouth: an overhang the icicles hang from)
  w.box(6, 1.2, 12, roofM, CLIFF - 3.5, 6.2, 0);
  for (let i = 0; i < 5; i++) torch(w, CLIFF + 6 + i * 8, 0, i % 2 ? 2.6 : -2.6, i % 2 === 0);
  torch(w, 100, 0, -8, true); torch(w, 108, 0, 8, true);
  cavePainting(w, 113.6, 2.2, 0, 8, 3.6, -Math.PI / 2, ["horse", "mammoth", "deer", "hands"]);
  cavePainting(w, 104, 2.2, -9.6, 7, 3, 0, ["mammoth", "horse"]);
  cavePainting(w, 104, 2.2, 9.6, 7, 3, Math.PI, ["hands", "deer"]);
  // (the empty space where the great horse was: a pale patch of rock)
  w.box(0.1, 1.6, 2.8, M(0xc8b8a0, { rough: 1 }), 113.4, 3.2, -2.6, { collide: false });

  // ---- where Rory lands
  const sy = G(0, -58);
  timeSled(w, -5, sy, -61, 0.3);

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  w.missionData = {
    ice1: { critter: "calf", kids: [on(46, 46, 0.05)], goal: [HERD[0], G(HERD[0], HERD[1]), HERD[1]], goalR: 6, crabs: [[20, 40, 20, 60, 1.3], [0, 70, 12, 50, 1.1]] },
    ice2: { fall: 5.2, things: [["icicle", CLIFF - 5, 0, -4], ["icicle", CLIFF - 3, 0, 3], ["icicle", CLIFF - 6, 0, 1], ["icicle", CLIFF - 2, 0, -2], ["icicle", CLIFF - 4.5, 0, 4.5], ["icicle", CLIFF - 3, 0, -5], ["icicle", CLIFF - 6, 0, -1]] },
    ice3: { cells: [[CLIFF + 4, 1.2, 0], [CLIFF + 14, 1.2, 1.8], [CLIFF + 22, 2.4, -1.8], [CLIFF + 30, 1.2, 0], [98, 1.2, -6], [110, 1.2, -7], [110, 2.4, 7], [100, 1.2, 7]] },
    ice4: { look: "snow", size: 1.0, pad: WALL, padR: 2.2, blocks: [on(-18, -30, 0.6), on(-48, -34, 0.6), on(-54, 4, 0.6), on(-16, 2, 0.6)] },
    ice5: { path: RIDE, width: 3.5, exit: on(34, 22, 0.1), lead: 36 },
    ice6: { title: "THE HANDPRINTS", symbols: ["✋", "🖐", "🤚", "👋"] },
  };
  return {
    spawn: on(0, -54, 0.1), yaw: 0, pebble: on(2, -53, 0), contact: [...on(CAMP[0] + 3, CAMP[1] - 6, 0), 0.6],
    stars: [on(-96, -30, 0.2), on(40, -60, 0.2), [112, 0.2, -8]],
    at: { ice1: [30, 40, 20], ice2: [CLIFF - 10, 0, 20], ice3: [CLIFF + 2, 0, 3.5], ice4: [CAMP[0] + 4, CAMP[1] + 7, 20], ice5: [-44, -8, 20], ice6: [108, -2, 3.5] },
  };
}
