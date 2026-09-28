// Lisbon, Portugal: tiled houses on a hill, the number 28 tram rattling round
// the block, a square with a fountain, the steps of Alfama climbing to the
// castle, and the old iron elevator with its colour lock.
import * as THREE from "three";
import { M } from "../tex.js";
import { lampAt, treeAt, corridor } from "../seakit.js";
import { houseRow, paintedHouse, rails, tram, tramStop, lanternString, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("morning");
  // flat by the river, climbing to the castle at the back
  // (Alfama is four terraces, each three metres up, with a steep riser you take the stairs for)
  const f = (x, z) => {
    let h = 0;
    if (z < -36) { const k = Math.min(4, (-36 - z) / 10), fl = Math.floor(k), fr = k - fl; h = 3 * fl + (fl < 4 ? 3 * Math.max(0, (fr - 0.85) / 0.15) : 0); }
    if (z < -92) h += (-92 - z) * 0.3;
    if (Math.abs(x) > 60) h += (Math.abs(x) - 60) * 0.2;
    return h;
  };
  w.terrain(320, 140, f, M("paving", { args: [5, [190, 182, 170], 48], repeat: [60, 60], normal: 0.6 }));
  w.mountains(8, 240, 40, { seed: 5, snow: false, color: 0x7a7a70 });
  const cobble = M("cobble", { args: [6, [160, 150, 140]], repeat: [8, 30] }), stone = M("stone", { args: [8, [200, 186, 160]], repeat: [4, 1] });
  // the loop road round the block, with the tram rails on it
  const LOOP = [[-30, 20], [30, 20], [30, -20], [-30, -20]];
  for (let i = 0; i < 4; i++) { const a = LOOP[i], b = LOOP[(i + 1) % 4]; const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = Math.atan2(b[0] - a[0], b[1] - a[1]); w.box(7, 0.08, len + 7, cobble, (a[0] + b[0]) / 2, 0.04, (a[1] + b[1]) / 2, { ry, collide: false }); }
  rails(w, LOOP, { closed: true });
  const T = tram(w, LOOP, { stops: [0, 2], speed: 4.5, dwell: 6 });
  // (parked under the ground while the chase has the rails)
  const mv = T.userData.mover, ride = mv.fn; mv.fn = t => w.tramParked ? [0, -40, 0, 0] : ride(t);
  // the stops: a raised platform beside the rails, with steps, so the roof is a jump away
  for (const [x, z, s] of [[-30, 23.2, 1], [30, -23.2, -1]]) { w.box(6, 1.5, 3, stone, x, 0.75, z); w.steps(5, 2.5, 0.3, 0.6, stone, x + 4.3, 0, z, s > 0 ? -Math.PI / 2 : Math.PI / 2); tramStop(w, x, z + s * 2.2, s > 0 ? 0 : Math.PI); }
  // tiled houses round the outside of the loop, facing in
  const blues = [0x2a5ad8, 0x1a3a8a, 0x2ab8c8, 0x3a8ad8];
  houseRow(w, 36, 30, Math.PI, [{ w: 10, h: 8, color: 0xf4e8c0, tiles: blues[0] }, { w: 10, h: 7, color: 0xffd23f, tiles: blues[1] }, { w: 10, h: 9, color: 0xf4f0e8, tiles: blues[2] }, { w: 10, h: 7.5, color: 0xff8a8a, tiles: blues[3] }, { w: 10, h: 8, color: 0xf4e8c0, tiles: blues[0] }, { w: 10, h: 8.5, color: 0xb8e0c8, tiles: blues[1] }, { w: 10, h: 7, color: 0xffd8a0, tiles: blues[2] }], { seed: 60 });
  houseRow(w, -36, -30, 0, [{ w: 7, h: 8, color: 0xffd8a0, tiles: blues[2] }, { w: 6, h: 7, color: 0xf4f0e8, tiles: blues[0] }, { w: 7, h: 9, color: 0xff8a8a, tiles: blues[1] }, { w: 7, h: 7.5, color: 0xffd23f, tiles: blues[3] }, { w: 7, h: 8, color: 0xf4e8c0, tiles: blues[2] }, { w: 7, h: 8.5, color: 0xb8e0c8, tiles: blues[0] }, { w: 7, h: 7, color: 0xf4f0e8, tiles: blues[1] }, { w: 7, h: 8, color: 0xffd8a0, tiles: blues[3] }, { w: 7, h: 7.5, color: 0xf4e8c0, tiles: blues[2] }, { w: 7, h: 8, color: 0xb8e0c8, tiles: blues[0] }], { seed: 70 });
  for (const s of [-1, 1]) houseRow(w, s * 38, -s * 22, s > 0 ? -Math.PI / 2 : Math.PI / 2, [{ w: 8, h: 8, color: 0xf4e8c0, tiles: blues[3] }, { w: 8, h: 9, color: 0xffd8a0, tiles: blues[0] }, { w: 8, h: 7, color: 0xb8e0c8, tiles: blues[2] }, { w: 8, h: 8, color: 0xff8a8a, tiles: blues[1] }, { w: 8, h: 7.5, color: 0xf4f0e8, tiles: blues[0] }], { seed: s > 0 ? 80 : 90 });
  // the square inside the loop: a fountain, benches, trees and the block of shops
  w.box(40, 0.1, 26, M("tiles", { args: [7, [230, 226, 216], [40, 60, 120], 8], repeat: [10, 6] }), 0, 0.06, 0, { collide: false });
  w.cyl(3.2, 3.4, 0.8, stone, 0, 0.4, 0, { seg: 24 }); w.cyl(0.5, 0.6, 3, stone, 0, 1.9, 0, { seg: 12 }); w.cyl(1.6, 1.6, 0.3, stone, 0, 3.5, 0, { seg: 16, collide: false });
  w.water(5.6, 5.6, 0, 0.7, 0, 0x2a8ad8);
  w.updaters.push(dt => { if (w.fx && Math.random() < dt * 8) w.fx.burst(0, 3.8, 0, 0xdff6ff, 2, { speed: 0.6, up: 2.5, life: 1.1, size: 0.3, gravity: -6, bright: 1.5 }); });
  for (const [x, z, ry] of [[-10, 8, 0], [10, 8, 0], [-10, -8, Math.PI], [10, -8, Math.PI]]) w.bench(x, z, ry);
  for (const [x, z] of [[-16, 10], [16, 10], [-16, -10], [16, -10]]) treeAt(w, x, z, 6, { color: 0x4a8a3a });
  for (const [x, z] of [[-24, 16], [24, 16], [-24, -16], [24, -16], [0, 24], [0, -24]]) lampAt(w, x, z, 4.4, 0xffe0a0);
  lanternString(w, -18, 14, 18, 14, 5.2, 9, [0xffd23f, 0x2a8ad8, 0xf4f4f0]); lanternString(w, -18, -14, 18, -14, 5.2, 9, [0xffd23f, 0x2a8ad8, 0xf4f4f0]);
  // Alfama: terraces climbing the hill behind the loop, with staircases and little houses
  for (let k = 0; k < 4; k++) {
    const z = -42 - k * 10;
    // the stairs up each riser, at alternate ends of the terrace
    w.steps(8, 4, 0.375, 0.7, stone, (k % 2 ? 14 : -14), 3 * k, -38.9 - k * 10, Math.PI);
    for (const x of [-30, -18, 18, 30]) paintedHouse(w, x + (k % 2 ? 4 : -4), z, 7, 6 + (k % 2), 6, 0, { color: [0xf4e8c0, 0xffd8a0, 0xff8a8a, 0xb8e0c8][(k + Math.abs(x)) % 4], tiles: blues[(k + 1) % 4], seed: 100 + k * 4 + Math.abs(x), y: 3 * k });
    for (const x of [-8, 8]) lampAt(w, x, z, 4, 0xffe0a0);
  }
  // the castle wall on the top, and the elevator: an iron tower with a cabin, from the square's edge
  const y12 = 12;
  w.box(80, 6, 3, M("stone", { args: [9, [160, 150, 130]], repeat: [10, 1], normal: 1.4 }), 0, y12 + 3, -82);
  for (const x of [-40, -20, 0, 20, 40]) w.box(4, 9, 4, M("stone", { args: [9, [160, 150, 130]], repeat: [1, 2] }), x, y12 + 4.5, -82);
  w.sign("CASTELO", 3, 0.7, 0, y12 + 4.5, -80.4, 0, { bg: "#2a1a10", fg: "#ffd23f" });
  const iron = M(0x2a2e34, { metal: 0.7, rough: 0.4 });
  corridor(w, [22, 0, -18], [22, 0, -26], 3.2, iron, 3.5); // the elevator's iron cage at the bottom
  w.box(0.4, 26, 0.4, iron, 20, 13, -30); w.box(0.4, 26, 0.4, iron, 24, 13, -30); w.box(0.4, 26, 0.4, iron, 20, 13, -34); w.box(0.4, 26, 0.4, iron, 24, 13, -34);
  w.box(5, 0.4, 5, iron, 22, 26, -32, { collide: false });
  w.box(3.2, 2.6, 3.2, M(0x8a4a2a, { metal: 0.3 }), 22, 1.3, -32);
  w.sign("ELEVADOR", 3, 0.7, 22, 3.2, -28.2, 0, { bg: "#2a1a10", fg: "#ffd23f" });
  // the tram shed at the top corner where the chase begins
  w.box(10, 5, 8, M("metal", { args: [3, [130, 120, 110]], repeat: [3, 1] }), 40, 2.5, 30);
  w.sign("CARRIS", 3, 0.8, 40, 4.3, 34.1, 0, { bg: "#ffd23f", fg: "#1a1a1a" });

  const top = T.userData.top + 0.6;
  w.missionData = {
    lb1: { cells: [[0, -40], [-8, -44.5], [8, -50], [-6, -54.5], [0, -60], [10, -64.5], [-8, -70], [6, -74.5], [-2, -79]].map(([x, z]) => [x, f(x, z) + 1.1, z]) },
    lb2: { cells: [-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1].map((z, i) => ({ obj: T, off: [i % 2 ? 0.5 : -0.5, top, z] })) },
    lb3: { area: [0, 0, 12], bots: [[-8, 0, -4], [8, 0, 4], [-6, 0, 6], [7, 0, -6], [0, 0, 9]] },
    lb4: { title: "ELEVADOR LOCK" },
    lb5: { path: [[0, 22], [30, 20], [32, 0], [30, -20], [0, -22], [-30, -20], [-32, 0], [-30, 20]], car: "tram", quarry: "tram", carOpts: { maxSpeed: 16, force: 1800, grip: 2.4, density: 25 }, lead: 30, enter: () => { w.tramParked = true; }, leave: () => { w.tramParked = false; } },
  };
  void groundAt; void THREE;
  return { spawn: [0, 0.2, 16], yaw: Math.PI, bolt: [2, 0.2, 17], contact: [-4, 0, 14, 0.6] };
}
