// The Narwhal's sub pen: a POLARIS base on a Scottish sea loch. A quay with
// sheds and a crane, the great black submarine moored alongside, a jetty
// where TORPEDO waits, and a training ground on the grass behind.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, jetty, rocks, shed, crateStack, bollard, torpedoParked, buoy, seaweed, fish, bubbles, gulls, lampAt, coral } from "../seakit.js";

function narwhalSub(w, x, z) {
  // the Narwhal: a long black hull with a sail and a horn on the bow
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const black = new THREE.MeshPhysicalMaterial({ color: 0x14181e, roughness: 0.35, metalness: 0.5, clearcoat: 0.6 }), white = M(0xe8eef4, { rough: 0.5 });
  const add = (geo, m, px, py, pz, rx = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.rotation.x = rx; me.castShadow = true; g.add(me); return me; };
  add(new THREE.CapsuleGeometry(3.2, 34, 8, 24), black, 0, -0.6, 0, Math.PI / 2);
  add(new THREE.CylinderGeometry(1.4, 1.8, 4, 16), black, 0, 3.5, 2);
  add(new THREE.BoxGeometry(0.15, 3.4, 0.6), black, 0, 5, 1.6);
  add(new THREE.ConeGeometry(0.5, 6, 10), white, 0, 0.2, 22, Math.PI / 2);
  add(new THREE.BoxGeometry(4, 0.2, 30), M(0x2a2e34, { rough: 0.7 }), 0, 2.55, 0);
  for (let i = 0; i < 6; i++) add(new THREE.SphereGeometry(0.16, 8, 6), M(0xffd166, { emissive: 0xffd166, ei: 2.5 }), 2.1, 2.7, -12 + i * 5);
  w.sign("NARWHAL", 5, 1, x + 3.25, 1.6, z - 4, Math.PI / 2, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1 });
  w.phys.fixedBox(x, 0.6, z, 3.2, 2, 20);
  w.phys.fixedBox(x, 4, z + 2, 1.6, 2, 2);
  w.updaters.push((dt, t) => { g.position.y = Math.sin(t * 0.7) * 0.08; g.rotation.z = Math.sin(t * 0.5) * 0.01; });
}
function crane(w, x, z) {
  const steel = M(0xe8a020, { metal: 0.6, rough: 0.4 });
  w.box(2.4, 1.2, 2.4, M(0x3a4048, { metal: 0.6 }), x, 1.6, z);
  w.cyl(0.5, 0.6, 14, steel, x, 9, z, { seg: 10 });
  const arm = w.mesh(new THREE.BoxGeometry(0.6, 0.6, 16), steel, x, 15.5, z + 6, { ry: 0 }); void arm;
  w.mesh(new THREE.BoxGeometry(0.4, 0.4, 5), steel, x, 15.5, z - 3);
  const hook = w.mesh(new THREE.BoxGeometry(0.1, 8, 0.1), M(0x1a1a1a), x, 11, z + 12, { cast: false }); hook.userData.dynamic = true;
  const crate = w.mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), M("wood", { args: [88, [150, 110, 70]] }), x, 6.2, z + 12); crate.userData.dynamic = true;
  w.updaters.push((dt, t) => { const y = 6.2 + Math.sin(t * 0.3) * 2; crate.position.y = y; hook.position.y = y + 4.8; hook.scale.y = (15.5 - (y + 0.8)) / 8; hook.position.y = (15.5 + y + 0.8) / 2; crate.rotation.y = t * 0.2; });
}

export function buildNarwhal(w) {
  w.setSky("morning");
  // the loch: grass to the north at a metre up, the shore at z = -2, deep water to the south
  const f = (x, z) => {
    const r = z + 2;
    let h = shoreProfile(r, { land: 1.0, beach: 6, depth: -11, slope: 28, water: 0.3 });
    if (z < -30) h += (-30 - z) * 0.25 + Math.sin(x * 0.08) * 2; // hills behind
    if (z > 60) h += (z - 60) * 0.05;
    return h;
  };
  w.terrain(360, 150, f, M("grass", { args: [3, [86, 132, 62]], repeat: [54, 54], normal: 0.6 }));
  w.mountains(14, 240, 80, { seed: 4, color: 0x5a6a7a });
  w.ocean({ level: 0, box: [0, 20, 200, 200], shallow: 0x2a9a90, deep: 0x0a3a5a, under: 0x0c4a5a, see: 34 });
  // the quay: a concrete apron flush with the grass, over the shoreline, with a wall to the water
  const conc = M("paving", { args: [5, [176, 174, 168], 48], repeat: [12, 3] });
  w.box(44, 2.6, 10, conc, -10, -0.3, 1);
  w.box(44, 0.6, 0.6, M(0x8a8a90, { rough: 0.8 }), -10, 1.3, 5.7, { collide: true });
  for (let x = -28; x <= 8; x += 6) bollard(w, x, 1.0, 5);
  // sheds, the crane and lamps on the land
  shed(w, -12, -26, 22, 8, 12, 0, { wall: [226, 232, 240], seed: 3, sign: "POLARIS · SUB PEN", bg: "#0c1a36", fg: "#9fe0ff", roof: "flat" });
  shed(w, 18, -30, 10, 5, 8, 0.3, { wall: [180, 160, 130], seed: 8, roofColor: [120, 60, 50] });
  crane(w, -34, -6);
  for (const [x, z] of [[-30, -12], [-20, -12], [-10, -12], [0, -12], [10, -12], [22, -12]]) lampAt(w, x, z, 4.4, 0x9ae8ff);
  crateStack(w, 6, 1.0, -9, 4); crateStack(w, -4, 1.0, -3, 2);
  w.box(2, 1.2, 2, M("metal", { args: [26], repeat: [1, 1] }), -16, 1.6, 0);
  w.box(2, 2.4, 2, M("metal", { args: [26], repeat: [1, 2] }), -20, 2.2, 0);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const x = Math.cos(a) * 44 - 8, z = -40 + Math.sin(a) * 14 - 8; if (z < -34) w.pine(x, z, 8 + (i % 3) * 2, { y: f(x, z) }); }
  for (let i = 0; i < 8; i++) { const x = -60 + i * 16, z = -42 - (i % 3) * 5; w.pine(x, z, 9, { y: f(x, z) }); }
  // the Narwhal alongside the west end, TORPEDO at the end of the jetty
  narwhalSub(w, -40, 22);
  const jend = jetty(w, -14, 5.5, 18, 0, { rail: true });
  torpedoParked(w, -14, 0, 28, Math.PI);
  buoy(w, 20, 30); buoy(w, -4, 44, 0xffd23f);
  rocks(w, [[30, 0.6, 2, 1.6], [34, 0.2, 6, 2.0], [26, -0.4, 12, 1.4], [-52, 0.5, 4, 2.2], [-58, -0.5, 12, 2.6]]);
  // under the water: kelp, a shoal of fish and a spring of bubbles
  seaweed(w, 6, -3.2, 18, 7, 3); seaweed(w, -6, -2.6, 14, 6, 2.6); seaweed(w, 14, -5, 22, 8, 3.5);
  fish(w, 0, -3, 20, 7, 30, 0xffb040); fish(w, -24, -5, 34, 8, 24, 0x9ad8ff, { size: 1.2 });
  coral(w, 10, -4.9, 26, 1.2, 2); coral(w, -8, -6.2, 30, 1.4, 3);
  bubbles(w, 4, -6, 28);
  gulls(w, -10, 14, 10, 4);
  w.floorY = -30;
  w.missionData = {
    nw1: { cells: [[0, 2.1, -8], [-8, 2.1, -6], [6, 4.9, -9], [-16, 3.3, 0], [-20, 4.5, 0], [12, 2.1, -2]] },
    nw2: { entry: [14, -1.6, 10], bubbles: [[4, -2.5, 16], [-6, -4, 22]], cells: [[8, -1.6, 12], [0, -2.2, 16], [-6, -2.8, 18], [6, -3.8, 22], [-2, -4.6, 24], [12, -4.2, 24]] },
    nw3: { start: [-14, -2.2, 30, Math.PI], exit: [-14, 1.15, 22, Math.PI], rings: [[-14, -3, 36, 2.4], [-8, -4, 42, 2.4, 0.5], [0, -6, 46, 2.4, 1.2], [8, -5, 40, 2.4, 2.0], [12, -3, 32, 2.4, 2.6], [6, -4.5, 26, 2.4, 3.6], [-4, -6, 30, 2.4, 4.4]] },
    nw4: { area: [12, -16, 7], bots: [[8, 1, -14], [14, 1, -20], [18, 1, -12], [10, 1, -22]] },
    nw5: { title: "LOCK SCHOOL" },
  };
  void jend;
  return { spawn: [-2, 1.0, -16], yaw: 0, bolt: [0.5, 1.0, -16], contact: [-4, 1.0, -6, 2.6] };
}
