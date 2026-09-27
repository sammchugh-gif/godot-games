// Dingle, Ireland: a fishing harbour with the brightest painted street in the
// country. The quay, a pier out into the bay, the terrace of shopfronts, the
// pub, a chapel and the fields with their stone walls climbing behind.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, rocks, jetty, bollard, mooredBoat, buoy, fish, gulls, lampAt, treeAt, crateStack } from "../seakit.js";
import { houseRow, paintedHouse, lanternString } from "../kit.js";

export function build(w) {
  w.setSky("day");
  const LAND = 2.0, Q = 2.4;
  const f = (x, z) => {
    let h = shoreProfile(z, { land: LAND, beach: 8, depth: -10, slope: 30, water: 0.3 });
    if (z < -40) h += (-40 - z) * 0.18 + Math.sin(x * 0.08) * 1.2;
    if (Math.abs(x) > 70) h += (Math.abs(x) - 70) * 0.25;
    return h;
  };
  w.terrain(360, 150, f, M("grass", { args: [3, [88, 132, 58]], repeat: [54, 54], normal: 0.5 }));
  w.mountains(10, 260, 50, { seed: 4, snow: false, color: 0x5a6a5a });
  w.ocean({ level: 0, box: [0, 40, 220, 220], shallow: 0x3aa0a8, deep: 0x0c3a5a, under: 0x0e4a5a, see: 24 });
  const stone = M("stone", { args: [11, [150, 140, 126]], repeat: [6, 1], normal: 1.2 }), cobble = M("cobble", { args: [4, [140, 132, 120]], repeat: [30, 6] });
  // the quay: a long stone shelf along the shore, and the harbour arms
  w.box(76, Q, 10, stone, 0, Q / 2, -3);
  w.box(76, 0.1, 10, cobble, 0, Q + 0.05, -3, { collide: false });
  w.box(6, Q + 0.6, 22, stone, -36, Q / 2 - 0.3, 6); w.box(6, Q + 0.6, 14, stone, 36, Q / 2 - 0.3, 2);
  for (const x of [-30, -20, -10, 0, 10, 20, 30]) bollard(w, x, Q, 1.2);
  // the pier, out into the bay
  jetty(w, 14, 2, 26, 0, { y: 1.9, w: 3.2, rail: true });
  // the street: a cobbled road between the quay and the terrace
  w.box(84, 0.3, 8, cobble, 0, LAND - 0.1, -12, { collide: false });
  // the terrace of painted shopfronts facing the harbour
  houseRow(w, -40, -20, 0, [
    { w: 7, h: 7, color: 0xd83a2a, door: 0x1a3a6a, sign: true }, { w: 6, h: 6, color: 0xffd23f, door: 0x2a8a4a }, { w: 7, h: 8, color: 0x2a8ad8, door: 0xd83a2a },
    { w: 6, h: 6.5, color: 0x3ad06a, door: 0xffd23f }, { w: 7, h: 7.5, color: 0xff8a2a, door: 0x1a1a2a }, { w: 6, h: 6, color: 0xff8ac8, door: 0x2a8ad8 },
    { w: 7, h: 7, color: 0x9a4aff, door: 0xffd23f }, { w: 6, h: 6.5, color: 0x3ad0d0, door: 0xd83a2a }, { w: 7, h: 8, color: 0xf4f0e0, door: 0x2a8a4a }, { w: 6, h: 6, color: 0xd83a6a, door: 0x1a3a6a },
  ], { seed: 30, flowers: true });
  w.sign("MURPHY'S", 4, 1, -36.5, LAND + 3.2, -16.4, 0, { bg: "#2a1a10", fg: "#ffe8a0" });
  w.sign("SAOIRSE'S SWEETS", 5, 1, -18.5, LAND + 3.6, -16.4, 0, { bg: "#1a3a6a", fg: "#ffd23f" });
  w.sign("THE HARBOUR BAR", 5, 1, 3, LAND + 3.6, -16.4, 0, { bg: "#3a1a1a", fg: "#ffd23f" });
  w.sign("WOOL & TWEED", 4.5, 1, 22.5, LAND + 3.4, -16.4, 0, { bg: "#1a2a1a", fg: "#f4f0e0" });
  for (const x of [-34, -22, -10, 2, 14, 26, 38]) lampAt(w, x, -9, 4.2, 0xffe0a0);
  lanternString(w, -30, -10, -6, -10, LAND + 4.6, 8); lanternString(w, 2, -10, 30, -10, LAND + 4.6, 9);
  // the pub on the corner, and the chapel up the lane
  paintedHouse(w, 44, -14, 9, 7, 9, -Math.PI / 2, { color: 0x1a4a2a, door: 0xd83a2a, trim: 0xffd166, seed: 44, roofColor: [60, 60, 70] });
  w.sign("O'SHEA'S", 4, 1, 39.4, LAND + 3.4, -14, -Math.PI / 2, { bg: "#0a1a0a", fg: "#ffd166" });
  paintedHouse(w, -12, -38, 10, 9, 14, 0, { color: 0xe8e0d0, door: 0x4a2a1a, trim: 0x8a8a90, seed: 51, roofColor: [70, 70, 80], flowers: false });
  w.box(2.2, 6, 2.2, M("stone", { args: [12, [200, 190, 170]], repeat: [1, 2] }), -6, LAND + 12, -38);
  w.cone(1.6, 2.4, M(0x4a4a50), -6, LAND + 16.2, -38);
  // the lane up to the chapel, between stone walls
  const wall = M("stone", { args: [21, [120, 116, 108]], repeat: [4, 1] });
  for (const x of [-20, -4]) w.box(1, 1.2, 14, wall, x, LAND + 0.6, -30);
  // fields behind, with stone walls and a few trees; the hill climbs beyond
  for (const [x0, z0, x1, z1] of [[-60, -26, -22, -26], [-2, -26, 14, -26], [34, -26, 60, -26], [-60, -46, -22, -46], [-2, -46, 60, -46], [-46, -26, -46, -46]]) { const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0); w.box(0.8, 1.1, len, wall, (x0 + x1) / 2, LAND + 0.55, (z0 + z1) / 2, { ry }); }
  for (const [x, z] of [[-54, -34], [-30, -52], [40, -36], [56, -54], [8, -56], [-58, -56]]) treeAt(w, x, z, 6, { color: 0x3a7a3a });
  // a few sheep
  for (const [x, z] of [[-40, -36], [-34, -40], [36, -38], [46, -32]]) { const y = w.heightAt(x, z); w.mesh(new THREE.SphereGeometry(0.55, 10, 8), M(0xf0ece0, { rough: 1 }), x, y + 0.7, z).scale.set(1.3, 0.9, 1); w.mesh(new THREE.SphereGeometry(0.25, 8, 6), M(0x1a1a1a), x + 0.75, y + 0.85, z); w.phys.fixedBall(x, y + 0.7, z, 0.6); }
  // crates and nets on the quay, boats in the harbour
  crateStack(w, -26, Q, 0, 2); crateStack(w, 30, Q, -6, 2); crateStack(w, 6, Q, 0, 2);
  mooredBoat(w, "motorboat", -12, 6, 0.3, { color: 0xd83a2a }); mooredBoat(w, "motorboat", 4, 8, -0.4, { color: 0x2a6ad8 }); mooredBoat(w, "speedboat", 26, 12, 1.2, { color: 0xffd23f });
  buoy(w, -20, 30); buoy(w, 30, 40, 0xffd23f); buoy(w, 50, 20, 0x2ab8c8);
  rocks(w, [[-48, 0.4, 8, 2.6], [-56, -0.4, 16, 3], [52, 0.2, 10, 2.2], [60, -0.6, 20, 2.8], [-44, 1.4, -2, 1.8]]);
  fish(w, 0, -3, 30, 8, 30, 0xc0c8d0); gulls(w, 10, 16, 6, 6);
  // steps down from the quay onto the beach at the west end
  w.steps(5, 4, 0.4, 0.7, stone, -30, 0.3, 2.2, 0);
  // the training ground for the mixing desk: a table by the sweet shop
  w.box(2, 0.1, 1, M(0x6a4a30), -16, LAND + 0.9, -14.5, { collide: false }); w.phys.fixedBox(-16, LAND + 0.45, -14.5, 1, 0.45, 0.5);
  for (const [i, c] of [0xff3a3a, 0xffd23f, 0x3a8aff, 0xffffff].entries()) w.mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.24, 10), M(c), -16.7 + i * 0.5, LAND + 1.07, -14.5, { collide: false });

  const D = (x, z, dy = 1.1) => [x, w.heightAt(x, z) + dy, z];
  w.missionData = {
    dg1: { cells: [[-8, Q + 1.1, -4], [-18, Q + 1.1, -6], [-26, Q + 2.9, 0], [2, Q + 1.1, 2], [14, Q + 1.4, 12], [14, Q + 1.4, 22], [22, Q + 1.1, -6], [30, Q + 2.5, -6]] },
    dg2: { area: [22, -6, 7], bots: [[18, Q, -3], [26, Q, -7], [22, Q, -1], [28, Q, -2]] },
    dg3: { spots: [[-20.5, LAND, -15.5, 0xd83a2a, 9], [-33.5, LAND, -15.5, 0xffd23f, 9], [16, LAND, -15.5, 0x3ad06a, 9]] },
    dg4: { gates: [[6, -31, 0.3], [12, -37, 0.5], [20, -42, 0.9], [28, -38, -0.5], [30, -30, -0.2], [24, -27.5, 0.5]].map(([x, z, r]) => [x, w.heightAt(x, z), z, r]) },
    dg5: {},
  };
  void D;
  return { spawn: [0, Q + 0.2, -5], yaw: Math.PI, bolt: [2, Q + 0.2, -6], contact: [-5, Q, -8, 0.6] };
}
