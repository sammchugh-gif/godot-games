// The Big Island of Hawaii: a young black coast where lava still runs down to
// the sea and hisses into steam. The volcano centre stands above a black-sand
// beach with palms and basking turtles; a surf break rolls in over the turtle
// reef; to the west the land ends in tall sea cliffs; up the slope an old lava
// tube runs into the hill, and the Drip Digger has cleared a plain to drill in.
import * as THREE from "three";
import { M } from "../tex.js";
import { coral, pier } from "./kit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildHawaii(w) {
  w.setSky({ top: "#1a6ad0", mid: "#86c4f0", bottom: "#d4ecf4", sun: [58, 200], sunColor: "#fff4e0", sunI: 2.45, hemi: ["#cce6ff", "#4a4a40", 0.62], fog: [120, 540], clouds: 24 });
  const LV = 0;
  const coast = x => 2 + Math.sin(x * 0.04) * 2;
  const TUBE = { x0: -64, x1: -26, z: 50, y: 6.6 }, ARENA = { x: 42, z: 46, r: 17, y: 4.2 };
  const h = (x, z) => {
    const d = z - coast(x), cliff = S(-38, -52, x), beach = S(26, 34, x) * S(88, 80, x);
    let y;
    if (d > 0) y = 0.8 + d * (0.12 - beach * 0.05) + cliff * 18 * S(-1, 3, d) + Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.4 * (1 - beach);
    else y = 0.6 + d * (0.3 + cliff * 1.2 - beach * 0.18);
    // the reef flat off the beach, and the deep sea beyond
    const reef = S(12, 22, x) * S(78, 66, x) * S(-6, -14, z) * S(-58, -48, z);
    y = Math.max(y, -16 + Math.sin(x * 0.1) * Math.cos(z * 0.13) * 0.8, reef > 0 ? -8 + reef * 2.5 + Math.sin(x * 0.4) * Math.cos(z * 0.35) * 0.4 : -99);
    // the flat floor of the lava tube, and the plain the Digger cleared
    const tube = S(TUBE.x0 - 6, TUBE.x0 - 2, x) * S(TUBE.x1 + 6, TUBE.x1 + 2, x) * S(10, 6, Math.abs(z - TUBE.z));
    if (tube > 0) y = y + (TUBE.y - y) * tube;
    const ar = S(ARENA.r + 8, ARENA.r + 1, Math.hypot(x - ARENA.x, z - ARENA.z));
    if (ar > 0) y = y + (ARENA.y - y) * ar;
    // the shield volcano filling the sky to the north
    if (z > 60) y = Math.max(y, (z - 60) * 0.35 * S(60, 120, z) + Math.max(0, z - 120) * 0.15);
    return y;
  };
  w.terrain(480, 240, h, M("lava", { args: [21, [70, 64, 60]], repeat: [90, 90] }));
  w.ocean({ level: LV, box: [0, -40, 300, 120], shallow: 0x2ad0c8, deep: 0x0a3a78, under: 0x146a90, clear: 0.65, waves: 1.1 });
  // green growth on the older ground, black sand on the beach, bright sand on the reef flat
  w.overlay(0, 40, 200, 80, M("grass", { args: [29, [74, 110, 52]], repeat: [40, 16] }), (x, z) => z > 26 + Math.sin(x * 0.13) * 5 && x > -40 && !(Math.abs(z - TUBE.z) < 9 && x < -20) && Math.hypot(x - ARENA.x, z - ARENA.z) > ARENA.r + 3, 0.05);
  w.overlay(57, 6, 64, 20, M("sand", { args: [8, [58, 56, 58]], repeat: [18, 6] }), (x, z) => x > 27 && x < 87 && z > -4 && z < 15 && h(x, z) > -1, 0.04);
  w.overlay(44, -32, 70, 54, M("sand", { args: [9, [226, 214, 180]], repeat: [20, 16] }), (x, z) => h(x, z) < -4, 0.03);

  // ---- the lava flows: two glowing channels running down to the sea, steam where they meet it
  const flowM = M("magma", { args: [17], repeat: [1, 6], ei: 2.2, rough: 0.7 });
  const flows = [[-18, 40, -17, coast(-17) - 1, 1.6], [-33, 32, -35, coast(-35) - 1, 1.2]];
  for (const [x0, z0, x1, z1, r] of flows) {
    const y = Math.min(h(x0, z0), h(x1, z1));
    w.lavaFlow(x0, z0, x1, z1, r, Math.max(h(x0, z0), h(x1, z1)));
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
    w.overlay((x0 + x1) / 2, (z0 + z1) / 2, Math.abs(dx) + r * 2 + 2, Math.abs(dz) + r * 2 + 2, flowM, (x, z) => { const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (L * L))); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t) < r; }, 0.08);
    // dark crust along each bank
    for (let k = 0; k <= L; k += 2.2) for (const s of [-1, 1]) { const t = k / L, bx = x0 + dx * t + s * dz / L * (r + 0.3), bz = z0 + dz * t - s * dx / L * (r + 0.3); w.mesh(new THREE.DodecahedronGeometry(0.45 + (k % 3) * 0.1, 0), M(0x2a2624, { rough: 1, flat: true }), bx, h(bx, bz) + 0.1, bz, { cast: false }); }
    void y;
  }
  w.updaters.push(() => {
    flowM.emissiveIntensity = 2 + Math.sin(w.t * 2.3) * 0.35; flowM.emissiveMap.offset.y = flowM.map.offset.y = -w.t * 0.05;
    if (w.fx) for (const [, , x1, z1] of flows) if (Math.random() < 0.6) w.fx.puff(x1 + (Math.random() - 0.5) * 3, 0.4, z1 - 1 + (Math.random() - 0.5) * 2, 0xf4f4f4, 1);
  });

  // ---- the lava coast: spatter cones, rocks and steam vents between the flows
  const cone = M("lava", { args: [22, [58, 52, 50]], repeat: [2, 2] });
  // three chains of spatter cones, each a staircase of tops (a step up and a hop across each time),
  // given as [x, z, the top's height]; a cone is never shorter than half a metre
  const chains = [
    [[-8, 8, 2.6], [-10.5, 11, 3.9], [-9, 14.5, 5.2], [-11.5, 17.5, 6.4], [-9.5, 21, 7.6]],
    [[-23, 8, 3.2], [-25.5, 11, 4.5], [-23.5, 14.5, 5.8], [-26, 17.5, 7.0], [-24, 21, 8.2], [-26.5, 24, 9.4]],
    [[-39, 13, 4.4], [-41.5, 16, 5.6], [-39.5, 19.5, 6.8]],
  ];
  const ctops = chains.flat().map(([x, z, top]) => {
    const gy = h(x, z), ht = Math.max(0.5, top - gy), t = gy + ht, r = 1.3;
    w.mesh(new THREE.CylinderGeometry(r, r * 1.5, ht + 1, 9), cone, x, t - (ht + 1) / 2, z);
    w.phys.fixedCyl(x, t - (ht + 1) / 2, z, r, (ht + 1) / 2);
    return [x, t, z];
  });
  const vents = [[-6, 16, 17], [-22, 30, 17], [-38, 10, 17]];
  for (const [x, z, p] of vents) w.pad(x, h(x, z), z, p, 0xf0f0f0);
  w.updaters.push(() => { if (w.fx) for (const [x, z] of vents) if (Math.random() < 0.3) w.fx.puff(x + (Math.random() - 0.5), h(x, z) + 0.5, z + (Math.random() - 0.5), 0xf0f4f4, 1); });
  const highs = [[-7, 20.5, 8], [-23, 34.5, 8.2], [-40.5, 7, 7.4]].map(([x, z, ht]) => {
    const gy = h(x, z), top = gy + ht;
    w.mesh(new THREE.CylinderGeometry(1.8, 2.8, ht + 1, 8), cone, x, top - (ht + 1) / 2, z);
    w.phys.fixedCyl(x, top - (ht + 1) / 2, z, 1.8, (ht + 1) / 2);
    return [x, top, z];
  });

  // ---- the volcano centre, the jetty with Kai's jet-ski, surfboards in the sand
  const vy = h(4, 34);
  w.building(14, 5, 9, 4, 34, { y: vy - 0.2, wall: [230, 220, 196], roof: "pitched", roofColor: [120, 70, 50], seed: 14, win: { lit: 0.1, glass: "#2a5a7a" } });
  w.sign("VOLCANO CENTRE", 7, 1, 4, vy + 4, 29.45, Math.PI, { bg: "#6a1a0a", fg: "#ffd8a0" });
  const boardCols = [0xff5a3a, 0x39c0ff, 0xf0d040, 0x7bed9f];
  boardCols.forEach((c, i) => { const x = 36 + i * 1.3, z = 13; const b = w.mesh(new THREE.CapsuleGeometry(0.28, 1.8, 4, 10), M(c, { rough: 0.3 }), x, h(x, z) + 1.1, z, { rx: 0.2 }); b.scale.z = 0.25; });
  pier(w, -36, coast(-36) + 3, -36, -8, 1.3, 2.4, -8, M("wood", { args: [9, [140, 110, 76]], repeat: [1, 8] }));
  // palms on the beach and along the shore
  for (let k = 0; k < 16; k++) { const x = 30 + k * 3.6 + Math.sin(k) * 1.5, z = 11 + (k % 3) * 3; w.palm(x, z, 7 + (k % 3), { y: h(x, z) - 0.2 }); }
  for (let k = 0; k < 8; k++) { const x = -2 + k * 3.2, z = 26 + (k % 2) * 3; w.palm(x, z, 6 + (k % 3), { y: h(x, z) - 0.2 }); }
  // turtles basking on the black sand
  for (const [x, z, ry] of [[46, 4, 0.4], [52, 3, -0.6], [64, 5, 2.4], [70, 3, 1.2]]) { const c = critter("seaturtle", 0.9); c.position.set(x, h(x, z) + 0.05, z); c.rotation.y = ry; w.scene.add(c); w.updaters.push(dt => animateCritter(c, dt, 0.03)); }

  // ---- the lava tube: a long rocky ridge with a tunnel through it
  const tubeM = M("lava", { args: [23, [64, 58, 56]], repeat: [8, 2] }), tl = TUBE.x1 - TUBE.x0, tx = (TUBE.x0 + TUBE.x1) / 2;
  for (const s of [-1, 1]) w.box(tl, 4.6, 0.6, tubeM, tx, TUBE.y + 2.3, TUBE.z + s * 3.2);
  w.box(tl, 0.6, 7, tubeM, tx, TUBE.y + 4.6, TUBE.z);
  w.box(1, 4.6, 7, tubeM, TUBE.x0 - 0.5, TUBE.y + 2.3, TUBE.z);
  const ridge = w.mesh(new THREE.CylinderGeometry(6.5, 6.5, tl + 1, 18, 1, true, 0, Math.PI), tubeM, tx, TUBE.y - 0.5, TUBE.z, { rz: Math.PI / 2 }); ridge.scale.z = 0.9;
  // the rock faces at each end: the mouth has a hole in it, the far end is shut
  const face = hole => { const sh = new THREE.Shape(); sh.absarc(0, 0, 6.5, 0, Math.PI, false); sh.lineTo(6.5, 0); if (hole) { const p = new THREE.Path(); p.moveTo(-3.4, 0.5); p.lineTo(3.4, 0.5); p.lineTo(3.4, 5.3); p.lineTo(-3.4, 5.3); p.lineTo(-3.4, 0.5); sh.holes.push(p); } return new THREE.ShapeGeometry(sh, 12); };
  const mouth = w.mesh(face(true), tubeM, TUBE.x1 + 0.5, TUBE.y - 0.5, TUBE.z, { ry: Math.PI / 2 }); mouth.scale.x = 0.9;
  const back = w.mesh(face(false), tubeM, TUBE.x0 - 0.5, TUBE.y - 0.5, TUBE.z, { ry: -Math.PI / 2 }); back.scale.x = 0.9;
  for (let x = TUBE.x0 + 3; x < TUBE.x1 - 1; x += 7) { const l = new THREE.PointLight(0xff7a30, 5, 9, 1.8); l.position.set(x, TUBE.y + 3.6, TUBE.z); w.scene.add(l); w.box(0.4, 0.05, 2.6, flowM, x, TUBE.y + 0.03, TUBE.z + 2.6, { collide: false }); }
  w.sign("LAVA TUBE", 3, 0.7, TUBE.x1 + 0.56, TUBE.y + 5.3, TUBE.z, Math.PI / 2, { bg: "#2a1a10", fg: "#ffb060" });
  // the Drip machine at the far end
  w.box(1.4, 2.4, 3.6, M(0x2a3040, { metal: 0.6 }), TUBE.x0 + 1.2, TUBE.y + 1.2, TUBE.z);
  w.cyl(0.35, 0.35, 12, M(0x8a939e, { metal: 0.8 }), TUBE.x0 - 6, TUBE.y + 0.6, TUBE.z + 2, { rz: Math.PI / 2, collide: false });

  // ---- the Digger's plain: bare rock, drill holes and survey flags
  w.overlay(ARENA.x, ARENA.z, ARENA.r * 2 + 4, ARENA.r * 2 + 4, M("lava", { args: [24, [86, 78, 72]], repeat: [10, 10] }), (x, z) => Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 1.5, 0.05);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = ARENA.x + Math.cos(a) * (ARENA.r + 1.8), z = ARENA.z + Math.sin(a) * (ARENA.r + 1.8); w.cyl(0.04, 0.04, 1.4, M(0x8a8a8a), x, ARENA.y + 0.7, z, { collide: false, seg: 4 }); w.box(0.5, 0.3, 0.02, M(0xff5a1a), x + 0.25, ARENA.y + 1.25, z, { collide: false }); }

  // ---- the sea cliffs to the west, with stacks standing off them
  // boulders fallen from the cliffs, just off their foot
  const boulder = M("rock", { args: [77, [62, 58, 56]] });
  for (let k = 0; k < 14; k++) { const x = -46 - k * 7.5, z = coast(x) - 2.5 - (k % 3) * 1.2, r = 1.6 + (k % 4) * 0.5; const m = w.mesh(new THREE.DodecahedronGeometry(r, 1), boulder, x, -0.2, z); m.rotation.set(k, k * 2, 0); w.phys.fixedBall(x, -0.2, z, r * 0.9); }
  for (const [x, z, ht] of [[-60, -26, 14], [-95, -30, 18], [-128, -22, 12]]) { w.mesh(new THREE.CylinderGeometry(3, 5, ht + 12, 8), cone, x, ht / 2 - 6, z); w.phys.fixedCyl(x, ht / 2 - 6, z, 4, (ht + 12) / 2); }

  // ---- the turtle reef: coral heads over the reef flat, turtles, fish and bubble streams
  let seed = 3;
  for (let x = 16; x < 76; x += 5.5) for (let z = -16; z > -56; z -= 5.5) {
    const jx = x + Math.sin(seed * 1.7) * 2, jz = z + Math.cos(seed * 2.3) * 2, y = h(jx, jz);
    // (not on top of a pearl, and not in the surf's path)
    if (y < -9 || y > -2.5 || [[22, -24], [36, -46], [48, -20], [62, -34], [70, -50], [30, -34], [52, -52]].some(([px, pz]) => Math.hypot(jx - px, jz - pz) < 3.5)) { seed++; continue; }
    coral(w, jx, y, jz, 1 + (seed % 4) * 0.5, seed++);
  }
  roam(w, "seaturtle", { cx: 42, cz: -30, rx: 14, rz: 8, y: -3.5, dy: 0.6, period: 50 });
  roam(w, "seaturtle", { cx: 56, cz: -40, rx: 9, rz: 12, y: -5, dy: 0.6, period: 60, dir: -1 });
  roam(w, "seaturtle", { cx: 30, cz: -44, rx: 8, rz: 5, y: -4.5, dy: 0.5, period: 40 });
  school(w, 36, -4, -26, 40, 4, 0xf0d23a); school(w, 60, -5, -46, 40, 4, 0x3ae0ff); school(w, 24, -5, -40, 30, 3, 0xff8a3a);
  w.vent(34, h(34, -38), -38, 30); w.vent(58, h(58, -28), -28, 30);
  roam(w, "manta", { cx: -20, cz: -60, rx: 30, rz: 12, y: -8, dy: 0.8, period: 70, scale: 1.6 });
  w.floorY = -30;

  const on = (p, up = 0.9) => [p[0], p[1] + up, p[2]];
  const C = ctops, Hh = highs;
  // pearls for the surf, strung along the face of the wave as it runs in to the beach
  // (a gentle S the board can follow at speed: never more than a couple of metres sideways per pearl)
  const surfPearls = []; for (let k = 0; k < 12; k++) surfPearls.push([54 + Math.sin(k * 0.5) * 4.5, -62 + k * 4.8]);
  w.missionData = {
    haw1: { start: [54, 0, -70, 0], speed: 8, pearls: surfPearls, beach: 64, spare: 2, exit: [50, h(50, 8), 8] },
    haw2: { cells: [on(C[2]), on(C[4]), on(C[7]), on(C[10]), on(C[13]), on(Hh[0]), on(Hh[1]), on(Hh[2])] },
    haw3: { start: [TUBE.x1 - 1.5, TUBE.y, TUBE.z], goal: [TUBE.x0 + 3, TUBE.y, TUBE.z], width: 5.8 },
    haw4: { cells: [[22, h(22, -24) + 1, -24], [36, h(36, -46) + 1, -46], [48, h(48, -20) + 1, -20], [62, h(62, -34) + 1, -34], [70, h(70, -50) + 1, -50], [30, -2.5, -34], [52, h(52, -52) + 1, -52]], floor: -12 },
    haw5: { ride: "jetski", exit: [-36, 1.4, -5], path: [[-40, -12], [-75, -8], [-110, -4], [-140, -10], [-150, -30], [-120, -44], [-80, -40], [-50, -38], [-30, -26]] },
    haw6: { center: [ARENA.x, ARENA.y, ARENA.z], radius: ARENA.r - 2, robot: "digger", height: 5 },
  };
  return {
    spawn: [0, h(0, 22), 22], yaw: Math.PI, bolt: [2, h(2, 22), 22], contact: [-3, h(-3, 24), 24, Math.PI * 0.85],
    at: { haw1: [50, 10], haw2: [-8, 5], haw3: [TUBE.x1 + 3, TUBE.z], haw4: [26, 5], haw5: [-36, -6], haw6: [ARENA.x, ARENA.z - ARENA.r - 4] },
  };
}
