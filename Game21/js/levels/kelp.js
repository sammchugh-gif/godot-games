// The Kelp Forest, off California: Rosa's otter-rescue pontoon floats at the edge
// of a forest of giant kelp that grows from the rocky sea bed right up to the
// surface. Otters bob in the canopy; sea urchins have eaten a bare patch; Drip
// divers are cutting a lane through the forest for Undertow's pipe, which runs
// away down the slope into the deep water to the west.
import * as THREE from "three";
import { M } from "../tex.js";
import { boat } from "./kit.js";
import { kelp } from "./deepkit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const toPath = (path, x, z) => { let best = 1e9; for (let i = 0; i + 1 < path.length; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; };

export function buildKelp(w) {
  w.setSky({ top: "#3a78c8", mid: "#a8c8e4", bottom: "#e4ecf0", sun: [34, 220], sunColor: "#fff0d8", sunI: 2.1, hemi: ["#d8e4ff", "#3a5a4a", 0.6], fog: [110, 520], clouds: 20 });
  // the forest's clearings and lanes: the channel the sub chase follows, the Drips' cut lane
  const LANE = [[-10, -30], [-30, -50], [-60, -58], [-100, -60]];
  const BARREN = { x: 28, z: -40, r: 12 };
  const h = (x, z) => {
    let y = -19 + Math.sin(x * 0.11) * Math.cos(z * 0.09) * 1.8 + Math.sin(x * 0.31 + z * 0.23) * 0.6;
    // shallower towards the shore in the east, dropping away to the deep in the west
    y += 8 * S(40, 90, x) - 22 * S(-70, -130, x);
    return y;
  };
  w.terrain(460, 200, h, M("rock", { args: [91, [110, 104, 92]], repeat: [90, 90] }));
  w.overlay(-40, -50, 140, 60, M("sand", { args: [11, [196, 186, 150]], repeat: [30, 14] }), (x, z) => toPath(LANE, x, z) < 7, 0.05);
  w.ocean({ level: 0, box: [0, -40, 240, 180], shallow: 0x3a9a8a, deep: 0x0a3a50, under: 0x1a6a70, deepUnder: 0x04161c, clear: 0.55, waves: 1.0, caustics: 5, see: 34 });
  w.deepAt = 60;

  // ---- Rosa's pontoon and her rescue boat
  const deckM = M("wood", { args: [9, [160, 136, 104]], repeat: [5, 3] }), rail = M(0xe8ecf0, { metal: 0.6, rough: 0.3 }), float = M(0xe8e4d8, { rough: 0.7 });
  const TOP = 0.9;
  w.box(12, 1.2, 7, float, 0, 0, 6, { collide: false });
  w.box(12, 0.2, 7, deckM, 0, TOP - 0.1, 6);
  w.phys.fixedBox(0, 0.1, 6, 6, 0.7, 3.5);
  w.fence(-6, 9.5, 6, 9.5, 1, rail, { y: TOP }); w.fence(6, 2.5, 6, 9.5, 1, rail, { y: TOP });
  // a hut with the rescue sign, and tubs for the otters that need looking after
  w.box(3.4, 2.4, 2.6, M(0xd8e8f0, { rough: 0.6 }), -3.6, TOP + 1.2, 8);
  w.box(3.8, 0.2, 3, M(0xe86a3a, { rough: 0.6 }), -3.6, TOP + 2.5, 8, { collide: false });
  w.sign("OTTER RESCUE", 3.2, 0.6, -3.6, TOP + 1.9, 6.68, 0, { bg: "#2a6a8a", fg: "#ffffff" });
  for (const x of [1, 3.4]) { w.cyl(0.9, 0.8, 0.7, M(0x3a8ad8, { rough: 0.5 }), x, TOP + 0.35, 8.4, { seg: 16 }); w.cyl(0.8, 0.8, 0.05, M(0x5ac8e8, { rough: 0.1, opacity: 0.8 }), x, TOP + 0.62, 8.4, { seg: 16, collide: false }); }
  boat(w, 11, -0.7, 5, 0.1, { color: 0xe8603a, size: 1.0, name: "ROSA" });
  w.steps(3, 1.6, 0.3, 0.35, rail, -1, -0.15, 1.4, 0);

  // ---- the kelp: a forest east to west, a lane cut through it, the urchin barren bare, and a
  // tangle so thick in the north-west that only sonar finds the way (the maze)
  const stalks = [];
  let seed = 7; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let x = -120; x < 70; x += 3.2) for (let z = -110; z < 60; z += 3.2) {
    const jx = x + (R() - 0.5) * 2.6, jz = z + (R() - 0.5) * 2.6, y = h(jx, jz);
    if (y < -34 || y > -4) continue;
    if (Math.hypot(jx, jz - 6) < 16 || Math.hypot(jx - 11, jz - 5) < 8) continue;
    if (toPath(LANE, jx, jz) < 6 || Math.hypot(jx - BARREN.x, jz - BARREN.z) < BARREN.r) continue;
    const maze = jx < -40 && jz > -20 && jz < 30;
    if (!maze && R() < 0.45) continue;
    stalks.push([jx, y, jz, -y - 0.3]);
    if (maze && R() < 0.5) stalks.push([jx + 1.2, h(jx + 1.2, jz + 0.8), jz + 0.8, -h(jx + 1.2, jz + 0.8) - 0.3]);
  }
  kelp(w, stalks, { color: 0x7a6a2a });
  // the urchins on the barren
  const urchin = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.28, 0), M(0x5a2a6a, { rough: 0.6, flat: true }), 60);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 60; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * BARREN.r, x = BARREN.x + Math.cos(a) * d, z = BARREN.z + Math.sin(a) * d; m4.makeScale(1, 0.7, 1).setPosition(x, h(x, z) + 0.15, z); urchin.setMatrixAt(i, m4); }
  urchin.userData.dynamic = true; w.scene.add(urchin);

  // ---- the Drips' pipe, down the lane into the deep
  const pipeM = M("metal", { args: [9, [104, 118, 110], 128], repeat: [10, 2], rough: 0.6, metal: 0.5 });
  for (let i = 0; i + 1 < LANE.length; i++) {
    const [ax, az] = LANE[i], [bx, bz] = LANE[i + 1], L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, ry = Math.atan2(bx - ax, bz - az);
    const ya = h(ax, az) + 1.3, yb = h(bx, bz) + 1.3, cy = (ya + yb) / 2, pitch = Math.atan2(yb - ya, L);
    const m = w.mesh(new THREE.CylinderGeometry(1.1, 1.1, Math.hypot(L, yb - ya) + 0.8, 18), pipeM, cx, cy, cz);
    m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2 - pitch, ry, 0, "YXZ"));
    w.phys.fixedBox(cx, cy, cz, 1.0, 1.0, Math.hypot(L, yb - ya) / 2, ry, { rx: -pitch });
  }

  // ---- life: otters in the canopy, a mother and her raft, fish in the kelp, a sea lion
  const OTTERS = [[-20, 14], [-8, -18], [18, -12], [-34, -4], [30, 18]];
  for (const [x, z] of OTTERS) roam(w, "otter", { cx: x, cz: z, rx: 3, rz: 2, y: 0.05, dy: 0.08, period: 40, speed: 0.2, scale: 1.3 });
  const MUMS = { x: 34, z: 26 };
  for (let k = 0; k < 3; k++) roam(w, "otter", { cx: MUMS.x, cz: MUMS.z, rx: 1.5 + k * 0.5, rz: 1.2 + k * 0.4, y: 0.05, dy: 0.08, period: 50 + k * 6, phase: k * 2, speed: 0.2, scale: 1.4 });
  roam(w, "sealion", { cx: -16, cz: -30, rx: 14, rz: 9, y: -6, dy: 2, period: 22 });
  school(w, -20, -8, -10, 60, 6, 0xd8a83a); school(w, 10, -12, -30, 50, 5, 0xc8d8e8); school(w, -60, -14, 10, 40, 5, 0x3ab0a0);
  w.vent(-30, h(-30, -40), -40, 30); w.vent(10, h(10, -60), -60, 30);
  w.floorY = -60;

  // ---- the missions
  const bed = (x, z, up = 0.7) => [x, h(x, z) + up, z];
  const ring = (x, y, z, a) => [x, y, z, 2.6, a];
  w.missionData = {
    kel1: { cells: [[-14, -1.5, 14], [-24, -2.5, 2], [-12, -3, -12], [4, -1.8, -22], [16, -2.2, -8], [-30, -4, -20], [22, -3, 16]], floor: -30 },
    kel2: { sub: [4, -3, -6, Math.PI], exit: [0, TOP, 5], thing: "net", items: [bed(-18, -24), bed(12, -34), bed(-40, -46), bed(26, -58)], pad: [8, -3, 0], padR: 2.8, floor: -30 },
    kel3: { exit: [0, TOP, 5], floor: -40, path: [[0, -6, -10], [-10, -9, -30], [-30, -12, -50], [-50, -14, -40], [-64, -15, -20], [-56, -14, 4], [-72, -18, 24], [-96, -24, 20], [-110, -30, -10]] },
    kel4: { area: [-50, -54, 12], bots: [[-44, 0, -54], [-52, 0, -60], [-58, 0, -50], [-40, 0, -48], [-62, 0, -58], [-48, 0, -64]], floor: -40 },
    kel5: { sub: [-38, -8, 6, -Math.PI / 2], exit: [0, TOP, 5], dark: true, floor: -30,
      marks: [bed(-52, 4, 1.4), bed(-64, 18, 1.4), bed(-78, -4, 1.4), bed(-92, 20, 1.4), bed(-100, 0, 1.4)] },
    kel6: { critter: "otter", water: true, kids: [[-20, 0.1, 22], [-40, 0.1, -6], [4, 0.1, -30]], goal: [MUMS.x, 0.1, MUMS.z], goalR: 3.5 },
  };
  return {
    stars: [bed(BARREN.x, BARREN.z, 0.3), bed(-70, 10, 0.3), bed(40, -20, 0.3)],
    spawn: [0, TOP + 0.1, 5], yaw: Math.PI, bolt: [-2, TOP + 0.1, 5], contact: [2, TOP, 7.5, Math.PI],
    at: { kel1: [-4.5, 4], kel2: [4.5, 4], kel3: [0, 3.2], kel4: [-4.5, 3], kel5: [4.5, 3], kel6: [2, 4.2] },
  };
}
