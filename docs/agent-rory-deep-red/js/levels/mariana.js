// The Mariana Trench: the deepest place on Earth. POLARIS's dive bell sits on the
// eastern rim; a pressure station straddles the lip, two pressure doors with a
// dry room between, and beyond them the trench drops away eighty metres to a
// floor of grey ooze. Every pipe from every ocean joins the Great Pipe here and
// runs south along the floor to a round door in the trench wall: the way into the
// Tidal Engine. Undertow's supply sled lies wrecked below.
import * as THREE from "three";
import { M } from "../tex.js";
import { airlock, diveBell, walls } from "./deepkit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildMariana(w) {
  w.setSky({ top: "#000206", mid: "#000308", bottom: "#000104", sun: [80, 30], sunColor: "#2a3a5a", sunI: 0.08, hemi: ["#1a2a4a", "#020304", 0.18], fog: null, clouds: 0 });
  // the trench: rims at y 0 either side of |x| 34, a floor at -80 between |x| < 12
  const h = (x, z) => {
    const ax = Math.abs(x + Math.sin(z * 0.03) * 4);
    let y = -80 * S(34, 12, ax) + Math.sin(x * 0.2) * Math.cos(z * 0.15) * 0.6 + Math.sin(z * 0.07) * 1.5 * S(20, 34, ax);
    return y;
  };
  w.terrain(420, 200, h, M("rock", { args: [91, [64, 64, 70]], repeat: [80, 80] }));
  w.ocean({ level: 11000, abyss: { top: 0, bottom: -80, k: [0.9, 1] }, under: 0x04101e, deepUnder: 0x000104, see: 30, room: 50 });
  w.floorY = -120; w.dark = true;
  const steel = M(0x8a96a8, { metal: 0.6, rough: 0.4 }), dark = M(0x2a2e36, { metal: 0.6, rough: 0.5 });

  // ---- the pressure station on the eastern lip: lock A (from the rim), a dry room, lock B (out to the trench)
  const PZ = -20, PY = 0.4, RX0 = 29, RX1 = 35;
  const lockA = airlock(w, RX1 + 2.35, PY, PZ, 3, { wall: steel });
  const lockB = airlock(w, RX0 - 2.35, PY, PZ, 1, { wall: steel });
  w.box(RX1 - RX0, 0.4, 8, steel, (RX0 + RX1) / 2, PY - 0.2, PZ);
  w.box(RX1 - RX0, 0.4, 8, dark, (RX0 + RX1) / 2, PY + 4.2, PZ);
  walls(w, RX0, PZ - 4, RX1, PZ + 4, PY, 4, [{ side: "e", at: PZ, w: 3.4 }, { side: "w", at: PZ, w: 3.4 }], { mat: steel });
  for (const [x, z] of [[RX0 + 0.5, PZ - 3.5], [RX1 - 0.5, PZ - 3.5], [RX0 + 0.5, PZ + 3.5], [RX1 - 0.5, PZ + 3.5]]) w.cyl(0.35, 0.4, PY - h(x, z) + 0.4, steel, x, (PY + h(x, z)) / 2, z, { seg: 8 });
  w.dryRoom(RX0 + 0.2, PY, PZ - 3.8, RX1 - 0.2, PY + 4, PZ + 3.8);
  const pl = new THREE.PointLight(0xffe0c0, 8, 12, 1.4); pl.position.set((RX0 + RX1) / 2, PY + 3.5, PZ); w.scene.add(pl);
  w.sign("PRESSURE DOOR 1", 3.4, 0.6, RX1 + 4.8, PY + 3.4, PZ, Math.PI / 2, { bg: "#4a1a0a", fg: "#ffd166", glow: 0.5 });

  // ---- the Great Pipe along the trench floor, south to the Engine's door
  const pipeM = M("metal", { args: [9, [96, 104, 110], 128], repeat: [20, 3], rough: 0.6, metal: 0.5 }), band = M(0x3a4a44, { metal: 0.6, rough: 0.5 });
  const GP = { x: -4, y: -76, z0: 90, z1: -110, r: 3 };
  w.mesh(new THREE.CylinderGeometry(GP.r, GP.r, GP.z0 - GP.z1, 32), pipeM, GP.x, GP.y, (GP.z0 + GP.z1) / 2, { rx: Math.PI / 2 });
  w.phys.fixedBox(GP.x, GP.y, (GP.z0 + GP.z1) / 2, GP.r, GP.r, (GP.z0 - GP.z1) / 2);
  for (let z = GP.z1 + 6; z < GP.z0; z += 12) w.mesh(new THREE.TorusGeometry(GP.r + 0.1, 0.25, 8, 28), band, GP.x, GP.y, z);
  // the valve station on the pipe
  const VS = { x: 8, z: 10 }, vy = h(VS.x, VS.z);
  w.box(4, 3, 3, dark, VS.x, vy + 1.5, VS.z);
  for (let k = 0; k < 4; k++) w.mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 20), M(0xe83a2a, { emissive: 0x6a0a0a, ei: 0.5 }), VS.x - 1.5 + k, vy + 2, VS.z - 1.55, { cast: false });
  w.sign("GREAT PIPE", 4, 0.7, VS.x, vy + 3.6, VS.z - 1.52, Math.PI, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });
  const vl = new THREE.PointLight(0x2ad0c0, 8, 18, 1.4); vl.position.set(VS.x, vy + 5, VS.z - 3); w.scene.add(vl);
  // the Engine's door: a great round hatch in the trench wall at the south end
  const DOOR = { x: -14, z: -100 }, dy = h(DOOR.x, DOOR.z);
  w.mesh(new THREE.CylinderGeometry(9, 9, 1.6, 40), M(0x3a2a4a, { metal: 0.7, rough: 0.35 }), DOOR.x, dy + 8, DOOR.z, { rz: Math.PI / 2 });
  w.mesh(new THREE.TorusGeometry(9.2, 0.6, 10, 48), M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 1.5 }), DOOR.x, dy + 8, DOOR.z, { ry: Math.PI / 2, cast: false });
  w.phys.fixedBox(DOOR.x, dy + 8, DOOR.z, 0.8, 9, 9);
  const dl = new THREE.PointLight(0x2ad0c0, 10, 26, 1.4); dl.position.set(DOOR.x + 6, dy + 8, DOOR.z); w.scene.add(dl);

  // ---- the down-current: from the rim, down the eastern wall to the floor
  const CUR = [[34, 5.5, 32], [26, 3, 28], [20, -10, 25], [16, -32, 18], [10, -48, 8], [6, -62, -4], [4, -70, -20], [2, -72, -40]];
  w.current(CUR, 3.8, 7);
  // ---- Undertow's supply sled, wrecked on the floor, and its crates scattered
  const SLED = { x: 2, z: 44 }, sy = h(SLED.x, SLED.z);
  w.box(6, 1.4, 3, M(0x5a1a2a, { metal: 0.5, rough: 0.5 }), SLED.x, sy + 0.7, SLED.z, { ry: 0.5, rz: 0.2 });
  // ---- the dive bell on the rim, and life that can live this deep: amphipods, a snailfish, jellies
  const bell = diveBell(w, 50, h(50, 0), 0);
  school(w, 0, -60, 0, 60, 7, 0xd8e8ff, 0.8); school(w, 10, -40, -60, 40, 5, 0x9ad8ff, 1.6);
  for (let k = 0; k < 6; k++) { const j = critter("jelly", 1 + (k % 2) * 0.5); w.scene.add(j); const px = -8 + (k % 3) * 8, pz = -60 + k * 24, ph = k * 1.1; w.updaters.push((dt, t) => { j.position.set(px + Math.sin(t * 0.1 + ph) * 3, -40 + Math.sin(t * 0.3 + ph) * 10, pz); animateCritter(j, dt, 0.3); }); }
  w.airStation(20, h(20, -20), -20); w.airStation(4, h(4, 20), 20); w.airStation(0, h(0, -60), -60); w.airStation(40, h(40, 20), 20);
  w.vent(-6, h(-6, 60), 60, 24);

  // ---- the missions
  const bed = (x, z, up = 1.2) => [x, h(x, z) + up, z];
  w.missionData = {
    mar1: { steps: [[lockA, "in"], [lockB, "out"]], goal: [lockB.sea[0] - 2, PY + 1, lockB.sea[1]] },
    mar2: { rings: [[20, -10, 25, 2.8], [16, -32, 18, 2.8], [10, -48, 8, 2.8], [6, -62, -4, 2.8], [4, -70, -20, 2.8], [2, -72, -40, 2.8]], floor: -84 },
    mar3: { title: "THE GREAT PIPE" },
    mar4: { sub: [44, 4, -8, -Math.PI / 2], exit: bell.spawn, thing: "crate", items: [bed(8, 52, 0.6), bed(-14, 36, 0.6), bed(10, 30, 0.6)], pad: [40, h(40, -8) + 1, -8], padR: 3.2, floor: -84 },
    mar5: { sub: [40, 2, -30, -Math.PI / 2], exit: bell.spawn, dark: true, floor: -84,
      marks: [bed(6, -30, 3), bed(8, -50, 3), bed(2, -66, 3), bed(-12, -80, 3), bed(-10, -92, 5), bed(0, -100, 5)] },
    mar6: { title: "THE LAST DOOR" },
  };
  return {
    stars: [bed(-30, 80, 0.3), bed(10, -104, 0.3), bed(60, -60, 0.3)],
    spawn: bell.spawn, yaw: bell.face, bolt: [bell.hole[0] + 3.8, bell.F + 0.1, bell.hole[1] - 1.5], contact: [bell.hole[0], bell.F, bell.hole[1] + 3.9, 2.8],
    swimTop: 8, lamp: 40,
    at: { mar1: [lockA.sea[0] + 0.5, lockA.sea[1], 3], mar2: [47.5, 3.5, bell.F + 1], mar3: [VS.x, VS.z - 4, vy + 4], mar4: [52.5, 3.5, bell.F + 1], mar5: [47.5, -3.5, bell.F + 1], mar6: [DOOR.x + 6, DOOR.z, dy + 6] },
  };
}
