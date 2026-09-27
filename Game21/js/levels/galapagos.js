// The Galápagos: a black lava island with a lagoon full of marine iguanas,
// giant tortoises in the grass, boobies on the rocks, a research station, a
// lava field to buggy across, and a reef tunnel where Undertow's pipe runs.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, rocks, shed, jetty, torpedoParked, mooredBoat, buoy, seaweed, fish, bubbles, gulls, lampAt, palmAt, tortoise, iguana, coral, bigFish, pump } from "../seakit.js";

function cactus(w, x, z) {
  const y = w.heightAt(x, z), green = M(0x5a9a4a, { rough: 0.9 });
  w.cyl(0.35, 0.4, 3.2, green, x, y + 1.6, z, { seg: 9 });
  for (const [a, h] of [[0, 1.6], [2.2, 1.2]]) { w.cyl(0.2, 0.2, 1.2, green, x + Math.cos(a) * 0.7, y + h, z + Math.sin(a) * 0.7, { seg: 8, collide: false }); w.cyl(0.2, 0.2, 1.4, green, x + Math.cos(a) * 0.7, y + h + 0.8, z + Math.sin(a) * 0.7, { seg: 8, collide: false }); }
}
function booby(w, x, y, z, ry) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.SphereGeometry(0.3, 12, 8), M(0xf0f0e8), 0, 0.55, 0).scale.set(1, 0.9, 1.4);
  add(new THREE.SphereGeometry(0.16, 10, 8), M(0xe8e0d0), 0, 0.95, 0.35);
  add(new THREE.ConeGeometry(0.06, 0.4, 6), M(0x6a6a5a), 0, 0.93, 0.62).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), M(0x3a8ad8), s * 0.1, 0.2, 0); add(new THREE.BoxGeometry(0.22, 0.03, 0.3), M(0x3a8ad8), s * 0.1, 0.02, 0.06); }
}

export function buildGalapagos(w) {
  w.setSky("tropical");
  const LAND = 2.0;
  const f = (x, z) => {
    let h = shoreProfile(z, { land: LAND, beach: 9, depth: -12, slope: 26, water: 0.3 });
    if (z < -6) h += Math.sin(x * 0.4) * Math.cos(z * 0.35) * 0.18;              // lumpy lava
    if (z < -70) h += (-70 - z) * 0.5 + Math.sin(x * 0.05) * 3;                   // the volcano's skirts
    const dl = Math.hypot(x - 26, z - 12); if (dl < 12) h = Math.min(h, 0.6 - 6.4 * (1 - dl / 12)); // the lagoon
    return h;
  };
  w.terrain(400, 160, f, M("stone", { args: [71, [52, 50, 52]], repeat: [60, 60], normal: 1.2 }));
  w.mountains(10, 240, 90, { seed: 16, snow: false, color: 0x4a4048 });
  // the volcano behind
  w.mesh(new THREE.ConeGeometry(120, 90, 24, 1, true), M(0x3a3236, { rough: 1, flat: true }), 30, 40, -230, { cast: false });
  w.ocean({ level: 0, box: [10, 20, 240, 240], shallow: 0x2ab8b0, deep: 0x0a4a6a, under: 0x0e5a6a, see: 32 });
  // green patches for the tortoises, black sand on the beach
  w.box(40, 0.16, 30, M("grass", { args: [73, [96, 140, 60]], repeat: [8, 6], normal: 0.5 }), -10, LAND + 0.1, -16, { collide: false });
  w.box(120, 0.12, 8, M("sand", { args: [75, [40, 38, 40]], repeat: [20, 2] }), 0, 0.42, 4, { collide: false });
  // the tortoises, the iguanas, the boobies and the cacti
  for (const [x, z, r] of [[-20, -10, 0], [-6, -8, 1.2], [4, -14, 2.4], [-14, -22, 0.6], [-2, -26, 3.0], [8, -22, 1.6], [-24, -24, 2.2]]) tortoise(w, x, z, r, 1 + (x % 3) * 0.1);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, x = 26 + Math.cos(a) * 12.5, z = 12 + Math.sin(a) * 12.5; iguana(w, x, f(x, z), z, -a + Math.PI / 2); }
  for (let i = 0; i < 5; i++) iguana(w, 40 + i * 2.2, LAND + 0.1, -4 - (i % 2), i);
  rocks(w, [[46, LAND - 0.2, 2, 2.4], [52, 0.4, 8, 2.8], [58, -0.6, 14, 2.2], [-46, LAND, -2, 2.0], [-54, 0.2, 6, 2.6], [-60, -1, 14, 3.0], [62, LAND, -10, 2.0]], { color: 0x3a3a3e });
  for (const [x, z, ry] of [[46, 1.4, 2, 0.4], [52, 2.3, 8, 2], [-46, 3.4, -2, 1], [-54, 2.0, 6, 4]]) booby(w, x, w.heightAt(x, z) + 1.0 + ry * 0, z, ry);
  for (const [x, z] of [[-36, -34], [-44, -14], [30, -30], [40, -44], [14, -38], [-30, -48]]) cactus(w, x, z);
  for (const [x, z] of [[-40, -6], [-34, -8], [58, -4]]) palmAt(w, x, z, 6);
  // the research station and the jetty where TORPEDO waits
  shed(w, -24, -26, 12, 5, 8, 0, { wall: [236, 236, 228], seed: 77, roofColor: [60, 100, 60], sign: "RESEARCH STATION", bg: "#1a3a2a", fg: "#dfffe0", y: LAND, roof: "flat" });
  shed(w, -36, -18, 6, 3.5, 5, 0.6, { wall: [200, 190, 170], seed: 78, roofColor: [120, 60, 50], y: LAND });
  for (const [x, z] of [[-30, -22], [-16, -20], [36, -14]]) lampAt(w, x, z, 4, 0xffe0a0);
  jetty(w, 40, -0.6, 14, 0, { y: 0.9, rail: true });
  torpedoParked(w, 40, 0, 18, Math.PI);
  mooredBoat(w, "speedboat", -22, 8, -0.6, { color: 0xf0f0e0 });
  buoy(w, 10, 36); buoy(w, 50, 44, 0xffd23f);
  // the reef tunnel: arches of rock over Undertow's pipe running south from the lagoon
  const arch = M("stone", { args: [79, [70, 64, 66]], repeat: [2, 2] });
  for (let i = 0; i < 6; i++) { const z = 30 + i * 8, x = 40 - i * 2, y = -4 - i * 0.8; for (const s of [-1, 1]) w.cyl(1.2, 1.4, 6, arch, x + s * 4.5, y - 3, z, { seg: 10, collide: false }); w.box(11, 1.6, 2, arch, x, y + 0.8, z, { collide: false }); }
  pump(w, -6, LAND, -46, { s: 0.8 });
  // under the water
  seaweed(w, 26, -4.5, 10, 8, 3); seaweed(w, 22, -3.5, 16, 6, 2.6); coral(w, 30, -4.8, 8, 1.2, 8); coral(w, 24, -5.2, 14, 1.0, 9);
  fish(w, 26, -3.5, 12, 6, 30, 0xffb040); fish(w, 34, -5, 34, 8, 24, 0x9ad8ff); fish(w, 20, -7, 60, 9, 30, 0xff5a5a, { size: 1.2 });
  bubbles(w, 30, -6, 44); bigFish(w, "turtle", [[20, -3, 40], [40, -5, 56], [24, -6, 70], [6, -4, 52]], { speed: 1.5 });
  gulls(w, 40, 16, 0, 5);
  w.floorY = -30;
  w.missionData = {
    gp1: { area: [-8, -16, 10], bots: [[-16, LAND, -12], [-4, LAND, -22], [2, LAND, -10], [-12, LAND, -26], [6, LAND, -18], [-20, LAND, -20]] },
    gp2: { entry: [26, -1.6, 12], bubbles: [[30, -2.8, 14]], cells: [[26, -5.0, 12], [22, -2.6, 9], [30, -2.3, 8], [28, -2.5, 17], [22, -2.6, 15], [32, -2.1, 13], [24, -1.9, 6]] },
    gp3: { start: [40, -2.4, 22, 0], exit: [40, 1.05, 12, 0], rings: [[40, -3.4, 30, 2.4], [38, -4.2, 38, 2.4, 0.2], [36, -5, 46, 2.4, 0.3], [34, -6, 54, 2.4, 0.3], [32, -7, 62, 2.4, 0.3], [30, -8, 70, 2.4, 0.3], [22, -7, 76, 2.4, 1.2], [14, -6, 70, 2.4, 2.4]] },
    gp4: { things: [["boat", -30, f(-30, -7), -7, 0.3, 0x2a8ad8], ["buoy", -36, f(-36, -8), -8, 0], ["crate", -26, f(-26, -10), -10, 0.4, 0xb08850], ["pot", -22, f(-22, -8), -8, 0], ["barrel", -34, f(-34, -12), -12, 0], ["case", -28, f(-28, -13), -13, 0.7]] },
    gp5: { start: [-8, LAND + 0.3, -34, Math.PI], car: "buggy", carOpts: { awd: true, maxSpeed: 14 }, cells: [[-20, LAND + 1, -40], [-36, LAND + 1, -46], [-44, LAND + 1, -60], [-26, LAND + 1, -66], [-6, LAND + 1, -58], [12, LAND + 1, -62], [24, LAND + 1, -50], [10, LAND + 1, -42]] },
    gp6: { title: "STATION RADIO", word: "HAWAII" },
  };
  return { spawn: [0, LAND, -20], yaw: 0, bolt: [2, LAND, -20], contact: [-4, LAND, -18, 2.4] };
}
