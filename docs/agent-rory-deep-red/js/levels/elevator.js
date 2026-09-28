// The Space Elevator's anchor station, on the equator in the Pacific: a round floating deck a
// hundred metres across, and out of the middle of it the tether, going straight up until you
// can't see it any more. Around the tether's foot is the climber bay (glass walls; in through
// the laser corridor from the east). West of it is the station yard, stacked with containers,
// with Otis's control room at the far side; to the north-east the maintenance tower. Otis's boat
// is moored at the landing stage in the south, below a long stair up to the deck.
import * as THREE from "three";
import { M } from "../tex.js";
import { boat } from "./kit.js";
import { gantry } from "./spacekit.js";
import { roam, school } from "../critters.js";

export function buildElevator(w) {
  w.setSky("morning");
  const D = 8, R = 44;
  const h = (x, z) => -60 + Math.sin(x * 0.02) * Math.cos(z * 0.025) * 5;
  w.terrain(460, 115, h, M("sand", { args: [21, [150, 140, 120]], repeat: [60, 60] }));
  w.ocean({ level: 0, box: [0, 0, 220, 220], shallow: 0x1a7ab0, deep: 0x06305a, under: 0x1a5a8a, deepUnder: 0x031428, clear: 0.35, waves: 1.0, absorb: [0.22, 0.08, 0.05], see: 34, caustics: 2 });
  w.floorY = -70;
  const deckM = M("metal", { args: [23, [132, 142, 156], 64], repeat: [30, 30], metal: 0.5, rough: 0.5 });
  const dark = M(0x2a3038, { metal: 0.5, rough: 0.5 }), yel = M(0xf0c020, { rough: 0.4, metal: 0.2 }), orange = M(0xf08a1a, { rough: 0.45, metal: 0.2 });

  // ---- the deck: a great disc on eight columns, with a ring of pontoons under the water
  w.cyl(R, R, 1.2, deckM, 0, D - 0.6, 0, { seg: 64 });
  w.cyl(R + 0.2, R - 1, 2.4, dark, 0, D - 2.4, 0, { seg: 64, collide: false });
  const legM = M("metal", { args: [12, [200, 204, 210], 64], repeat: [2, 6], metal: 0.4, rough: 0.4 });
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8, x = Math.cos(a) * 30, z = Math.sin(a) * 30; w.cyl(3, 3.4, D + 12.8, legM, x, (D - 15.2) / 2, z, { seg: 18 }); w.mesh(new THREE.TorusGeometry(3.5, 0.3, 8, 24), yel, x, 0.2, z, { rx: Math.PI / 2, cast: false }); }
  w.mesh(new THREE.TorusGeometry(30, 3, 10, 64), legM, 0, -9, 0, { rx: Math.PI / 2, cast: false });
  // the rail round the edge, open at the top of the stair (south)
  const railM = M(0xf0c020, { metal: 0.3, rough: 0.5 }), N = 32, RR = R - 0.4;
  for (let k = 1; k < N; k++) {
    const a0 = -Math.PI / 2 - Math.PI / N + k * 2 * Math.PI / N, a1 = a0 + 2 * Math.PI / N;
    w.fence(Math.cos(a0) * RR, Math.sin(a0) * RR, Math.cos(a1) * RR, Math.sin(a1) * RR, 1.1, railM, { y: D });
  }
  // painted rings round the middle (the tether's safety circle)
  w.mesh(new THREE.RingGeometry(9, 9.6, 64), yel, 0, D + 0.02, 0, { rx: -Math.PI / 2, cast: false });
  w.mesh(new THREE.RingGeometry(22, 22.4, 64), M(0xe8ecf0, { rough: 0.6 }), 0, D + 0.02, 0, { rx: -Math.PI / 2, cast: false });

  // ---- the landing stage, Otis's boat and the long stair up to the deck
  const stage = M("wood", { args: [9, [120, 106, 88]], repeat: [7, 3] }), stairM = M("metal", { args: [9, [150, 160, 170]] });
  w.box(24, 1.2, 8, stage, 0, 0.6, -60);
  const SN = 19, RUN = 0.6, Z0 = -56;
  w.steps(SN, 3, (D - 1.2) / SN, RUN, stairM, 0, 1.2, Z0, 0);
  w.box(3, 0.3, 2.4, stairM, 0, D - 0.15, Z0 + SN * RUN + 0.9);
  const stairY = (x, z) => 1.2 + Math.min(1, Math.max(0, (z - Z0) / (SN * RUN))) * (D - 1.2);
  for (const x of [-1.55, 1.55]) w.fence(x, Z0, x, Z0 + SN * RUN, 1, railM, { y: stairY });
  boat(w, 0, -1.4, -69, Math.PI / 2, { color: 0xf08a1a, size: 2.2, name: "OTIS" });
  w.lamp(-10, -57, 4, 0xffe0a0, { y: 1.2, ei: 3, light: 3 }); w.lamp(10, -57, 4, 0xffe0a0, { y: 1.2, ei: 3, light: 3 });

  // ---- the tether, and the climber bay round its foot
  const tetherM = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, emissive: 0x6ab0ff, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.3 });
  const tether = w.mesh(new THREE.CylinderGeometry(1, 1, 2000, 16), tetherM, 0, D + 1000, 0, { cast: false }); tether.userData.dynamic = true;
  w.phys.fixedCyl(0, D + 5, 0, 1, 5);
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(1.25, 0.12, 6, 20), new THREE.MeshStandardMaterial({ color: 0x9fe0ff, emissive: 0x6ad8ff, emissiveIntensity: 1.6 }), 44);
  const mm = new THREE.Matrix4(), rx = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  for (let k = 0; k < 44; k++) { mm.makeTranslation(0, D + 6 + k * 12, 0).multiply(rx); rings.setMatrixAt(k, mm); }
  rings.userData.dynamic = true; w.scene.add(rings);
  w.cyl(2.6, 3.2, 1, dark, 0, D + 0.5, 0, { seg: 24 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0, depthWrite: false });
  const frame = M(0xe8ecf0, { metal: 0.5, rough: 0.4 }), BR = 7, BN = 14, BH = 4.5;
  for (let k = 0; k < BN; k++) {
    const a = (k + 0.5) * 2 * Math.PI / BN, a0 = k * 2 * Math.PI / BN;
    w.box(0.3, BH, 0.3, frame, Math.cos(a0) * BR, D + BH / 2, Math.sin(a0) * BR);
    if (k === 0 || k === BN - 1) continue;   // the door, east, where the corridor comes in
    const cw = 2 * BR * Math.sin(Math.PI / BN);
    w.box(cw, BH, 0.12, glass, Math.cos(a) * BR, D + BH / 2, Math.sin(a) * BR, { ry: Math.PI / 2 - a, cast: false });
  }
  w.mesh(new THREE.RingGeometry(4.6, BR + 0.3, 40), M(0xe8ecf0, { rough: 0.5, side: THREE.DoubleSide }), 0, D + BH, 0, { rx: -Math.PI / 2, cast: false });
  // Otis's climber, clamped to the tether, waiting (the race uses its own)
  const pod = new THREE.Group(); pod.position.set(0, D + 1.3, 2.4); w.scene.add(pod);
  const podBody = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 2.6, 16), new THREE.MeshStandardMaterial({ color: 0x2a6ad8, roughness: 0.35, metalness: 0.3 })); podBody.castShadow = true; pod.add(podBody);
  const podWin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x0a1a2a, emissive: 0x9fe0ff, emissiveIntensity: 0.8 })); podWin.position.set(0, 0.5, 1.15); pod.add(podWin);
  pod.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  w.climberProp = pod;
  // the laser corridor, from the east into the bay
  const wallM = M("metal", { args: [31, [90, 100, 116], 64], repeat: [8, 2], metal: 0.5, rough: 0.5 });
  for (const s of [-1, 1]) w.box(19.8, 3.2, 0.3, wallM, 16.1, D + 1.6, s * 2.95);
  for (let x = 8; x <= 26; x += 3) for (const s of [-1, 1]) w.box(0.1, 0.1, 0.1, M(0xff3a4a, { emissive: 0xff2a3a, ei: 2 }), x, D + 2.9, s * 2.78, { collide: false });
  w.sign("CLIMBER BAY", 5, 1, 26.1, D + 4, 0, Math.PI / 2, { bg: "#0c1a36", fg: "#ffd166", glow: 0.6 });
  w.box(0.3, 1, 6.2, wallM, 26.05, D + 3.7, 0);

  // ---- the station yard (west): containers, and Otis's control room on the far side
  const contM = [M("metal", { args: [41, [200, 110, 50], 64], repeat: [3, 1] }), M("metal", { args: [42, [50, 100, 170], 64], repeat: [3, 1] }), M("metal", { args: [43, [40, 150, 140], 64], repeat: [3, 1] })];
  const containers = [[-22, -30, 0], [-14, -20, Math.PI / 2], [-26, -18, 0], [-20, -6, 0], [-12, 0, Math.PI / 2], [-32, -2, Math.PI / 2]];
  containers.forEach(([x, z, ry], i) => w.box(6, 2.6, 2.4, contM[i % 3], x, D + 1.3, z, { ry }));
  w.box(6, 2.6, 2.4, contM[1], -22, D + 3.9, -30);
  w.building(12, 5, 8, -30, 17, { y: D, wall: [236, 238, 242], seed: 221, win: { lit: 0.6, glass: "#3a6a9a" }, trim: 0xf08a1a });
  w.sign("ANCHOR STATION", 7, 1.1, -30, D + 4, 12.95, Math.PI, { bg: "#1a1a2a", fg: "#f0a040", glow: 0.9 });
  w.box(2.2, 3, 0.2, dark, -30, D + 1.5, 12.9, { collide: false });
  const dish = w.mesh(new THREE.SphereGeometry(2.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3.2), M(0xf0f2f6, { rough: 0.3, side: THREE.DoubleSide }), -34, D + 7.6, 19, { rx: -0.7 }); void dish;
  w.cyl(0.25, 0.35, 2.6, M(0xd8d8e0, { metal: 0.6 }), -34, D + 6.2, 19, { collide: false });
  // a winch drum for the tether's spare line, and spools about the deck
  w.cyl(3, 3, 6, orange, 20, D + 3.2, -24, { rz: Math.PI / 2, seg: 24 }); w.box(7, 0.6, 3, dark, 20, D + 0.3, -24);
  for (const [x, z] of [[30, -12], [32, -8]]) w.cyl(1.2, 1.2, 1.4, M(0x3a4a5a, { metal: 0.5 }), x, D + 0.7, z, { seg: 16 });

  // ---- the maintenance tower, north-east (its first flight starts on the deck)
  const gt = gantry(w, 18, D - 3, 22, { levels: 7 });
  w.sign("MAINTENANCE", 4, 0.8, 18, D + 4.6, 18.55, Math.PI, { bg: "#1a1a2a", fg: "#ffd166", glow: 0.6 });
  w.lamp(-4, -40, 4, 0xffe0a0, { y: D, ei: 3 }); w.lamp(4, -40, 4, 0xffe0a0, { y: D, ei: 3 });

  // ---- far off to the west: the Sea-Launch Platform, its pad empty now
  w.box(40, 3, 26, dark, -330, 12, 210, { collide: false });
  for (const [x, z] of [[-345, 200], [-315, 200], [-345, 220], [-315, 220]]) w.cyl(2.5, 2.5, 14, dark, x, 5, z, { collide: false, seg: 10 });
  w.box(4, 40, 4, M(0xc8302a), -318, 34, 210, { collide: false });

  // ---- life in the open ocean
  school(w, 20, -8, -60, 60, 7, 0x9ad8ff); school(w, -50, -14, 40, 50, 6, 0xffd23a);
  roam(w, "manta", { cx: 0, cz: 70, rx: 50, rz: 30, y: -10, dy: 1, period: 80, scale: 1.8 });
  roam(w, "turtle", { cx: 30, cz: -70, rx: 20, rz: 12, y: -3, dy: 0.6, period: 50, scale: 1.2 });

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, D + up, z];
  const lvl = i => D - 3 + i * gt.step + 0.3 + 1.1;
  w.missionData = {
    ele1: { range: 7, angle: 30, start: [-8, D + 0.1, -34], goal: [-30, D + 0.1, 11.2],
      guards: [{ path: [[-8, -25], [-33, -25]], speed: 1.3, y: D }, { path: [[-34, -12], [-8, -12]], speed: 1.2, phase: 4, y: D }, { path: [[-36, 5], [-17, 5]], speed: 1.1, phase: 2, y: D }] },
    ele2: { start: [25, D + 0.1, 0], goal: [8.5, D + 0.1, 0], width: 5.6, beams: 8 },
    ele3: { title: "COOLANT VALVES" },
    ele4: { cells: [[18, lvl(1), 22], [18, lvl(2), 22], [18, lvl(3), 22], [18, lvl(4), 22], [18, lvl(5), 22], [18, lvl(6), 22], [11, gt.top + 0.4 + 1.1, 22]], climb: gt.climb },
    ele5: { word: "RACE", title: "THE RIBBON LAMP" },
    ele6: { axis: [0, 0], base: D + 1.3, height: 480, r: 2.4, exit: [12, D + 0.2, 7] },
  };
  return {
    stars: [[10, 1.2, -61], [18, gt.top + 0.15, 24], [-28, D, 25]],
    spawn: [-3, 1.2, -61], yaw: 0, bolt: [-5, 1.2, -62], contact: [3, 1.2, -58, -Math.PI / 2],
    at: { ele1: [-8, -38, D + 3], ele2: [29, -6, D + 3], ele3: [12, -9, D + 3], ele4: [22, 36, D + 3], ele5: [-4, 16, D + 3], ele6: [12, 8, D + 3] },
  };
}
