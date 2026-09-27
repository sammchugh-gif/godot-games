// The Glass Station: Professor Silt's laboratory, three kilometres down, a long
// glass-walled station on legs over the sea bed. In at its east end through the
// airlock (or up through the moon pool at its west end, where the subs come and
// go). Inside: the entrance hall and Silt's desk, the labs under a glass dome
// where Drip guards patrol, and the security wing, a corridor of lasers between
// the labs and the moon pool.
import * as THREE from "three";
import { M } from "../tex.js";
import { airlock, diveBell, walls } from "./deepkit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

export function buildGlass(w) {
  w.setSky({ top: "#000308", mid: "#01050c", bottom: "#000206", sun: [80, 30], sunColor: "#2a4a7a", sunI: 0.1, hemi: ["#2a4a6a", "#04060a", 0.22], fog: null, clouds: 0 });
  const h = (x, z) => Math.sin(x * 0.08) * Math.cos(z * 0.07) * 1.2 + Math.sin(x * 0.3 + z * 0.2) * 0.3 - 1;
  w.terrain(380, 160, h, M("sand", { args: [11, [80, 84, 92]], repeat: [70, 70] }));
  w.ocean({ level: 3000, abyss: { top: 10, bottom: -10, k: [0.86, 0.98] }, under: 0x06182e, deepUnder: 0x010408, see: 34, room: 60 });
  w.floorY = -40; w.dark = true;
  const F = 4.4, HT = 5, X0 = -46, X1 = 20, Z0 = -12, Z1 = 12, POOL = { x0: -42, x1: -36, z0: -3, z1: 3 };
  const steel = M(0xd8dde4, { metal: 0.7, rough: 0.35 }), floorM = M(0xe8ecf0, { rough: 0.5 }), dark = M(0x3a4250, { metal: 0.5, rough: 0.5 });
  // ---- the airlock at the east end (made before the station's own air, so it decides inside itself)
  const lock = airlock(w, X1 + 2.35, F, 0, 3, { wall: steel });
  // ---- floor (round the moon pool), roof, legs
  const slab = (a, b, c, d) => w.box(b - a, 0.4, d - c, floorM, (a + b) / 2, F - 0.2, (c + d) / 2);
  slab(X0, X1, Z0, POOL.z0); slab(X0, X1, POOL.z1, Z1); slab(X0, POOL.x0, POOL.z0, POOL.z1); slab(POOL.x1, X1, POOL.z0, POOL.z1);
  for (const [x0, x1] of [[POOL.x0, POOL.x1]]) for (const z of [POOL.z0, POOL.z1]) w.box(x1 - x0, 0.12, 0.3, M(0xf2c418), (x0 + x1) / 2, F + 0.05, z, { collide: false });
  w.box(X1 - X0, 0.4, Z1 - Z0, dark, (X0 + X1) / 2, F + HT + 0.2, 0);
  for (let x = X0 + 3; x < X1; x += 11) for (const z of [Z0 + 2, Z1 - 2]) w.cyl(0.4, 0.5, F - h(x, z), steel, x, (F + h(x, z)) / 2, z, { seg: 10 });
  // the walls: glass all round, a door to the airlock in the east; inside, partitions between the
  // hall, the labs, the security wing and the moon pool room
  walls(w, X0, Z0, X1, Z1, F, HT, [{ side: "e", at: 0, w: 3.4 }], { glass: true });
  const part = (x, doorZ = 0, dw = 2.2, mat = steel) => { w.box(0.3, HT, doorZ - dw / 2 - Z0, mat, x, F + HT / 2, (Z0 + doorZ - dw / 2) / 2); w.box(0.3, HT, Z1 - doorZ - dw / 2, mat, x, F + HT / 2, (Z1 + doorZ + dw / 2) / 2); w.box(0.3, HT - 2.6, dw, mat, x, F + 2.6 + (HT - 2.6) / 2, doorZ); };
  part(6); part(-14); part(-30);
  // the security wing is a corridor six wide: solid walls either side of it
  for (const z of [-3, 3]) w.box(16, HT, 0.3, dark, -22, F + HT / 2, z);
  // ---- the hall: Silt's desk, a map of the ocean on the wall, a sofa
  w.box(3, 0.9, 1.2, M("wood", { args: [5, [120, 90, 60]] }), 14, F + 0.45, 7);
  w.box(0.1, 2.4, 5, M(0x0a3a6a, { emissive: 0x1a5a9a, ei: 0.6 }), X1 - 0.3, F + 2.4, -7, { collide: false });
  w.sign("GLASS STATION", 5, 0.8, 13, F + 3.8, Z0 + 0.3, 0, { bg: "#0a2a4a", fg: "#7ff4e8", glow: 0.6 });
  w.box(3, 0.6, 1, M(0x2a6a8a, { rough: 0.8 }), 10, F + 0.3, -9);
  // ---- the labs: benches with glass tanks, a dome of glass overhead
  const bench = M(0xf0f2f4, { rough: 0.4 }), tank = new THREE.MeshPhysicalMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false });
  for (const [x, z] of [[0, -7], [0, 7], [-8, -7], [-8, 7]]) { w.box(4, 0.9, 1.4, bench, x, F + 0.45, z); const t = w.mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), tank, x + 0.8, F + 1.3, z, { cast: false }); t.userData.dynamic = true; }
  const dome = w.mesh(new THREE.SphereGeometry(9, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }), -4, F + HT, 0, { cast: false }); dome.userData.dynamic = true;
  // ---- the moon pool room: the pool, a crane, TORPEDO's berth
  w.box(0.4, 5, 0.4, M(0xf2c418), POOL.x0 - 1, F + 2.5, POOL.z1 + 1);
  w.box(6, 0.4, 0.4, M(0xf2c418), POOL.x0 + 2, F + 4.8, POOL.z1 + 1, { collide: false });
  // lights in every room
  for (const x of [13, -4, -22, -38]) { const l = new THREE.PointLight(0xf0f4ff, 9, 16, 1.3); l.position.set(x, F + HT - 0.6, 0); w.scene.add(l); }
  // the station's air: everything inside its walls above the floor, and up through the moon pool
  w.dryRoom(X0 + 0.2, F, Z0 + 0.2, X1 - 0.2, F + HT, Z1 - 0.2, { wl: F, below: F - h(-39, 0), air: [(POOL.x0 + POOL.x1) / 2, (POOL.z0 + POOL.z1) / 2] });

  // ---- outside: the dive bell, and the life of the deep plain
  const bell = diveBell(w, 46, h(46, 26), 26, { face: -2.4 });
  roam(w, "angler", { cx: 10, cz: 30, rx: 14, rz: 8, y: 3, dy: 1, period: 60, scale: 2 });
  school(w, -10, 12, -26, 70, 6, 0x6ad8ff, 2.2);
  for (let k = 0; k < 5; k++) { const j = critter("jelly", 1.2); w.scene.add(j); const px = -60 + k * 30, pz = 30 - (k % 2) * 60, ph = k; w.updaters.push((dt, t) => { j.position.set(px + Math.sin(t * 0.07 + ph) * 5, 10 + Math.sin(t * 0.3 + ph) * 2, pz); animateCritter(j, dt, 0.3); }); }
  w.airStation(30, h(30, 10), 10); w.airStation(-20, h(-20, 24), 24);

  // ---- the missions (the ones inside start where they happen)
  w.missionData = {
    gla1: { steps: [[lock, "in"]], goal: [14, F + 0.5, 0] },
    gla2: { range: 6, angle: 30, enter: [4.5, F + 0.1, 0, -Math.PI / 2], start: [4.5, F + 0.1, 0], goal: [-12.5, F + 0.9, 0],
      guards: [{ path: [[-2, -10], [-2, 10]], speed: 1.3, y: F }, { path: [[-10, 10], [-10, -10]], speed: 1.2, phase: 0.5, y: F }, { path: [[2, -4.5], [-12, -4.5], [-12, 4.5], [2, 4.5]], speed: 1.1, y: F }] },
    gla3: { word: "HELP", title: "SILT'S LAMP", enter: [15.5, F + 0.1, 3, -Math.PI / 2] },
    gla4: { title: "UNDERTOW'S SAFE", enter: [-6, F + 0.1, 3, -Math.PI / 2] },
    gla5: { start: [-15, F + 0.1, 0], goal: [-29, F + 0.1, 0], width: 5.6, beams: 7 },
    gla6: { sub: [-39, F - 1.6, 0, -Math.PI / 2], exit: [14, F + 0.1, 3], floor: -30,
      rings: [[-39, 1.2, 0, 2.6, 0], [-50, 1.5, -2, 2.6, -Math.PI / 2], [-66, 3, -8, 2.6, -1.9], [-80, 5, -20, 2.6, -2.4], [-86, 6, -38, 2.6, -2.9], [-80, 7, -56, 2.6, 2.6]] },
  };
  return {
    stars: [[X0 + 1.5, F + 0.4, Z1 - 1.5], [0, h(0, -40) + 0.3, -40], [70, h(70, 50) + 0.3, 50]],
    spawn: bell.spawn, yaw: bell.face, bolt: [bell.hole[0] + 3.8, bell.F + 0.1, bell.hole[1] - 1.5], contact: [15.5, F, 5.5, Math.PI],
    swimTop: 18, lamp: 36,
    // (the missions inside start in there: their beacons wait on the sea bed by the airlock's outer door)
    at: { gla1: [lock.sea[0] + 0.5, lock.sea[1], F + 1], gla2: [lock.sea[0] + 3, 4, F + 1], gla3: [lock.sea[0] + 3, -4, F + 1], gla4: [lock.sea[0] + 6, 6, F + 1], gla5: [lock.sea[0] + 6, -6, F + 1], gla6: [lock.sea[0] + 8, 0, F + 1] },
  };
}
