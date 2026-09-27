// Hawaii: a black sand bay under a volcano, lava terraces climbing the hill,
// a lava flow steaming into the sea, palms and surfboards on the beach, a
// turtle reef past the point, and the lava tube where the pump sits.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, rocks, shed, mooredBoat, buoy, seaweed, fish, bubbles, gulls, lampAt, palmAt, coral, bigFish, corridor, pump, pipe } from "../seakit.js";
import { thing } from "../props.js";

export function buildHawaii(w) {
  w.setSky("sunset");
  const LAND = 2.0;
  // the land is to the south here: the shore runs along z = 0, the sea to the north
  const f = (x, z) => {
    let h = shoreProfile(-z, { land: LAND, beach: 8, depth: -12, slope: 26, water: 0.3 });
    if (z > 52) h += (z - 52) * 0.12 + Math.sin(x * 0.08) * 1.5;
    if (z > 90) h += (z - 90) * 0.6;
    return h;
  };
  w.terrain(400, 160, f, M("grass", { args: [81, [70, 130, 60]], repeat: [56, 56], normal: 0.5 }));
  w.mountains(10, 260, 70, { seed: 18, snow: false, color: 0x3a3a40 });
  // the volcano, and its glowing top
  w.mesh(new THREE.ConeGeometry(110, 100, 22, 1, true), M(0x2e2a2c, { rough: 1, flat: true }), -20, 45, 230, { cast: false });
  w.mesh(new THREE.CircleGeometry(14, 22), M(0xff5a1a, { emissive: 0xff4a0a, ei: 3 }), -20, 95, 230, { rx: -Math.PI / 2, cast: false });
  w.ocean({ level: 0, box: [0, -30, 240, 240], shallow: 0x2ab8c0, deep: 0x0a3a6a, under: 0x0c4a6a, see: 30 });
  // black sand along the shore, and the lava flow reaching the sea on the west
  w.box(140, 0.12, 8, M("sand", { args: [83, [36, 34, 36]], repeat: [24, 2] }), 0, 0.5, 4, { collide: false });
  const lava = M(0x2a2426, { rough: 1, emissive: 0xff4a0a, ei: 0.9 });
  w.box(10, 0.5, 60, lava, -58, LAND + 0.1, 32, { collide: false }); w.box(14, 0.4, 10, lava, -58, 0.5, 2, { collide: false });
  w.updaters.push(dt => { if (w.fx && Math.random() < dt * 6) w.fx.puff(-58 + (Math.random() - 0.5) * 12, 0.6, -2 + Math.random() * 4, 0xe8e8f0, 3); });
  // the lava terraces: steps of black rock up the west hill, with pads
  const rock = M("stone", { args: [85, [60, 56, 60]], repeat: [4, 2], normal: 1.4 });
  for (let i = 0; i < 6; i++) w.box(26 - i * 2, 1.2 * (i + 1), 10, rock, -26 + i * 1.5, LAND + 0.6 * (i + 1), 18 + i * 5);
  w.pad(-30, LAND, 10, 11, 0x7bed9f);
  // the lava tube: a dark tunnel into the hill on the west, the pump at the end
  const tube = M("stone", { args: [87, [50, 46, 50]], repeat: [3, 3], normal: 1.5 });
  corridor(w, [-40, LAND, 20], [-40, LAND, 46], 7, tube, 3.4);
  w.box(30, 8, 26, tube, -40, LAND + 4, 60, { ry: 0.1 });
  w.box(12, 8, 8, tube, -40, LAND + 4, 52); // the end wall of the tube, the pump just before it
  pump(w, -40, LAND, 47, { s: 0.7 });
  pipe(w, [[-37.5, LAND + 1, 47], [-34, LAND + 0.5, 40], [-30, LAND, 30], [-20, LAND - 0.5, 8], [-14, -3, -16], [-10, -8, -40]], 0.8);
  lampAt(w, -44, 18, 3.5, 0xff5a6a, { ei: 3 }); lampAt(w, -36, 18, 3.5, 0xff5a6a, { ei: 3 });
  // the beach: huts, palms, surfboards, a lifeguard tower
  shed(w, 8, 20, 8, 4, 6, 0, { wall: [220, 190, 140], seed: 89, roofColor: [150, 120, 70], sign: "KAI'S SURF SHACK", bg: "#2a4a5a", fg: "#ffe8a0", y: LAND });
  shed(w, 26, 24, 6, 3.5, 5, -0.4, { wall: [230, 220, 200], seed: 90, roofColor: [150, 120, 70], y: LAND });
  for (const [x, z] of [[-6, 12], [2, 8], [16, 10], [30, 12], [40, 16], [-14, 8], [48, 8], [20, 30], [36, 34]]) palmAt(w, x, z, 7 + (x % 3));
  for (const [x, z, c] of [[4, 6, 0xff6a3a], [12, 5, 0x3ad0ff], [22, 7, 0xffd23f]]) { const b = thing("surfboard", c); b.position.set(x, LAND - 0.9, z); b.rotation.set(-1.2, 0, 0.2); w.scene.add(b); }
  const tower = new THREE.Group(); tower.position.set(44, LAND, 10); w.scene.add(tower);
  for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 8), M(0xe8e0c8)); p.position.set(dx, 1.5, dz); tower.add(p); }
  w.box(3.4, 0.2, 3.4, M(0xe8e0c8), 44, LAND + 3, 10); w.box(2.6, 1.8, 2.6, M(0xffd23f, { rough: 0.6 }), 44, LAND + 4, 10);
  for (const [x, z] of [[-2, 16], [14, 18], [34, 20]]) lampAt(w, x, z, 4, 0xffe0a0);
  mooredBoat(w, "jetski", 8, -8, 0.2); mooredBoat(w, "jetski", 12, -9, -0.2, { color: 0x2ab8c8 });
  buoy(w, 30, -30); buoy(w, -20, -40, 0xffd23f); buoy(w, 56, -20, 0x7bed9f);
  rocks(w, [[50, 0.3, -6, 2.6], [56, -0.4, -12, 3.0], [62, 0.6, -2, 2.2], [66, -1, -18, 2.8], [-70, 0.2, -4, 2.4]], { color: 0x2a2a30 });
  // the turtle reef past the point
  for (const [x, z, s] of [[30, -18, 1.4], [38, -24, 1.2], [26, -28, 1.6], [44, -16, 1.0], [34, -34, 1.3]]) coral(w, x, f(x, z) + 0.2, z, s, 10 + x, { collide: true });
  seaweed(w, 40, f(40, -28), -28, 8, 3); seaweed(w, 24, f(24, -20), -20, 6, 2.6);
  fish(w, 34, -4, -24, 8, 34, 0xffd23f); fish(w, -10, -6, -30, 9, 28, 0x9ad8ff);
  bigFish(w, "turtle", [[24, -3, -14], [44, -5, -22], [36, -6, -38], [20, -4, -30]], { speed: 1.4 }); bigFish(w, "turtle", [[40, -4, -30], [30, -5, -16], [50, -6, -26]], { speed: 1.1, phase: 20 });
  bubbles(w, 36, f(36, -26), -26);
  gulls(w, 20, 16, -10, 5);
  w.floorY = -30;
  w.missionData = {
    hw1: { boat: "jetski", quarry: "jetski", lead: 28, exit: [10, 1.4, 6, Math.PI], path: [[14, -14], [30, -12], [48, -18], [60, -34], [50, -52], [24, -58], [-4, -50], [-24, -56], [-44, -40], [-36, -20], [-16, -12], [0, -18]] },
    hw2: { cells: [[-30, LAND + 1.1, 6], [-30, LAND + 2.3, 15], [-20, LAND + 3.5, 20], [-26, LAND + 4.7, 25], [-16, LAND + 5.9, 30], [-24, LAND + 7.1, 35], [-14, LAND + 8.3, 42], [-34, LAND + 1.1, 34]] },
    hw3: { entry: [34, -1.6, -10], bubbles: [[30, -3.5, -22], [44, -4, -30]], cells: [[30, -4.2, -18], [38, -4.6, -24], [26, -5.2, -28], [44, -3.4, -16], [34, -5.8, -34], [40, -5, -36], [22, -3.8, -22], [48, -6, -28]] },
    hw4: { start: [-40, LAND, 22], goal: [-40, LAND, 44], width: 7, beams: 9 },
    hw5: { area: [14, 30, 9], bots: [[8, LAND, 26], [20, LAND, 34], [6, LAND, 36], [22, LAND, 26], [14, LAND, 40], [26, LAND, 30]] },
    hw6: { title: "VOLCANO PUMP" },
  };
  return { spawn: [0, LAND, 20], yaw: Math.PI, bolt: [2, LAND, 21], contact: [4, LAND, 16, -2.6], apply: save => { w.pumpOff = save.done.includes("hw6"); } };
}
