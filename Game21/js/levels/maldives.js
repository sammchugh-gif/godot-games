// The Maldives: a sand island in a turquoise lagoon, villas on stilts over
// the water, a brand-new sandbank where the sea has drained, a seaplane, and
// the reef pass where Undertow's rings lead down into the blue.
import * as THREE from "three";
import { M } from "../tex.js";
import { jetty, torpedoParked, mooredBoat, buoy, seaweed, fish, bubbles, gulls, lampAt, palmAt, coral, bigFish, villa, shed, rocks } from "../seakit.js";

export function buildMaldives(w) {
  w.setSky("tropical");
  const ISLE = 1.2;
  const f = (x, z) => {
    const r = Math.hypot(x, z), rb = Math.hypot(x + 10, z - 40), rr = Math.hypot(x - 10, z + 10);
    let h = -4.2 + Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.25;            // the lagoon floor
    if (r < 36) h = Math.max(h, ISLE - Math.max(0, r - 26) * 0.55);           // the island
    if (rb < 16) h = Math.max(h, 0.9 - Math.max(0, rb - 9) * 0.6);            // the new sandbank
    if (rr > 70) h = Math.min(h, -4.2 - (rr - 70) * 0.3);                     // the lagoon floor falls away to the reef
    if (rr > 84) h = Math.min(h, -8.4 - (rr - 84) * 0.6);                     // over the reef edge, the deep
    if (rr > 78 && rr < 84 && Math.abs(x - 24) > 10) h = -1.6;                // the reef ring, with the pass cut through it
    return h;
  };
  w.terrain(400, 160, f, M("sand", { args: [111, [244, 232, 200]], repeat: [50, 50], normal: 0.5 }));
  w.ocean({ level: 0, box: [0, 0, 240, 240], shallow: 0x3ae0d8, deep: 0x0a6a9a, under: 0x1a8aaa, see: 40, caustics: 1.4, clear: 0.35 });
  // palms and a beach bar on the island, a lamp or two
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + 0.3, r = 12 + (i % 3) * 6; palmAt(w, Math.cos(a) * r, Math.sin(a) * r, 6 + (i % 3) * 1.5); }
  shed(w, 6, -14, 8, 3.6, 6, 0.2, { wall: [230, 220, 200], seed: 113, roofColor: [160, 130, 80], sign: "AISHA'S", bg: "#1a4a5a", fg: "#ffe8a0", y: ISLE });
  for (const [x, z] of [[-8, -10], [10, 4], [-4, 12]]) lampAt(w, x, z, 3.6, 0xffe0a0);
  for (const [x, z] of [[14, 8], [-2, 18]]) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.6), M(0xff6a3a)); t.position.set(x, ISLE + 0.2, z); t.rotation.y = x; w.scene.add(t); }
  // the villas on stilts over the lagoon, joined to the island by a walkway
  const walkway = M("wood", { args: [115, [200, 170, 120]], repeat: [1, 6] });
  w.box(3, 0.3, 26, walkway, -22, 1.6, 6, { ry: Math.PI / 2 });
  villa(w, -22, 20, 0); villa(w, -34, 8, 0.3); villa(w, -34, 26, -0.2);
  w.box(3, 0.3, 12, walkway, -22, 1.6, 14); w.box(3, 0.3, 12, walkway, -28, 1.6, 8, { ry: Math.PI / 2 }); w.box(3, 0.3, 12, walkway, -28, 1.6, 22, { ry: Math.PI / 2 + 0.4 });
  w.steps(4, 3, 0.34, 0.6, walkway, -10, ISLE, 6, -Math.PI / 2);
  // the jetty and the boats, TORPEDO waiting at the south jetty
  jetty(w, 24, -14, 12, Math.PI, { y: 1.0, rail: true });
  torpedoParked(w, 24, 0, -30, 0);
  mooredBoat(w, "speedboat", 36, -14, 0.2, { color: 0xf0f0e0 });
  mooredBoat(w, "seaplane", 44, 6, -0.6, { collide: true });
  buoy(w, 60, 20); buoy(w, -60, -20, 0xffd23f); buoy(w, 20, 70, 0x7bed9f);
  rocks(w, [[-50, -2.5, 30, 2.4], [56, -3, -40, 2.6], [-40, -3, -50, 2.0]], { color: 0x8a8a80 });
  // the new sandbank's stranded things
  for (const [x, z, c] of [[-8, 42, 0x3ad0ff], [-14, 36, 0xff6a3a]]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.6, 4, 12), M(c, { rough: 0.2 })); b.position.set(x, 1.05, z); b.rotation.set(Math.PI / 2, 0, x); b.scale.set(1, 1, 0.18); w.scene.add(b); }
  // under the water: coral heads, kelp, fish, a manta
  for (const [x, z, s] of [[40, 20, 1.4], [50, 30, 1.2], [36, 34, 1.6], [58, 12, 1.0], [46, 44, 1.3], [-46, 4, 1.2], [-56, 22, 1.4], [30, -52, 1.2], [18, -64, 1.4], [10, -56, 1.0]]) coral(w, x, f(x, z), z, s, 120 + x, { collide: true });
  seaweed(w, 44, f(44, 28), 28, 8, 2.6); seaweed(w, -48, f(-48, 14), 14, 6, 2.4); seaweed(w, 24, f(24, -60), -60, 8, 3);
  fish(w, 44, -2.6, 26, 7, 34, 0xffd23f, { size: 0.8 }); fish(w, -50, -2.8, 12, 6, 26, 0x7bed9f, { size: 0.8 }); fish(w, 20, -5, -66, 9, 30, 0x9ad8ff);
  bigFish(w, "manta", [[30, -2.8, 30], [60, -3, 40], [70, -3, 0], [40, -2.5, -10]], { speed: 2 });
  bubbles(w, 46, f(46, 38), 38); bubbles(w, 22, f(22, -70), -70);
  gulls(w, 0, 12, 0, 5);
  w.floorY = -30;
  w.missionData = {
    md1: { entry: [30, -1.6, 12], bubbles: [[44, -2.6, 24], [52, -2.8, 40]], cells: [[38, -3.2, 18], [46, -3.4, 26], [54, -3, 30], [40, -3.6, 34], [50, -2.4, 44], [58, -3.4, 14], [34, -3.2, 40], [62, -2.8, 24], [46, -3.6, 50]] },
    md2: { pad: [-16, ISLE, -2], padR: 1.8, blocks: [[-6, ISLE + 0.66, -6], [-14, ISLE + 0.66, 8], [-4, ISLE + 0.66, 2], [-18, ISLE + 0.66, -10]] },
    md3: { boat: "speedboat", quarry: "seaplane", lead: 34, exit: [20, ISLE, -12, Math.PI], path: [[40, -18], [60, -30], [70, -4], [66, 30], [50, 56], [20, 64], [-10, 62], [-30, 48], [-46, 30], [-56, 6], [-44, -20], [-24, -40], [0, -48], [24, -40]] },
    md4: { title: "LAGOON SLUICES" },
    md5: { start: [24, -2.6, -34, Math.PI], exit: [24, 1.15, -24, Math.PI], rings: [[24, -3, -44, 2.4], [26, -3.4, -54, 2.4, 0.2], [24, -3.4, -64, 2.4, 0], [22, -3.4, -74, 2.4, 0.2], [24, -4.6, -84, 2.4, 0], [28, -7.5, -94, 2.4, 0.4], [34, -5.4, -84, 2.4, 1.6], [36, -3.4, -74, 2.4, 2.4]] },
    md6: { area: [-10, 40, 8], bots: [[-14, 1, 36], [-6, 1, 44], [-4, 1, 36], [-16, 1, 44], [-10, 1, 48], [-2, 1, 40], [-12, 1, 32]] },
  };
  return { spawn: [0, ISLE, -6], yaw: 0, bolt: [2, ISLE, -6], contact: [-3, ISLE, -2, 2.4] };
}
