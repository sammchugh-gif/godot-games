// The Sunken Liner: RMS Neptune sits upright on a ledge sixty metres down, her
// bow still full of air. POLARIS has set down a dive bell beside her. In through
// the old cargo door (an airlock) to the air pocket: the hold, the cabin deck and
// the grand staircase up to the ballroom, where Drip guards keep watch. Aft, the
// engine room is flooded, and Undertow's pipe runs through it and away over the
// edge of the ledge into the deep.
import * as THREE from "three";
import { M } from "../tex.js";
import { airlock, diveBell } from "./deepkit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildLiner(w) {
  w.setSky("deep");
  // the ledge (y = 0) and, to the west, the drop into the deep
  const h = (x, z) => -1 + Math.sin(x * 0.2) * Math.cos(z * 0.17) * 0.4 - 44 * S(-36, -60, x) + Math.sin(z * 0.05) * 3 * S(-40, -70, x);
  w.terrain(420, 180, h, M("sand", { args: [11, [120, 124, 120]], repeat: [80, 80] }));
  w.ocean({ level: 300, abyss: { top: 30, bottom: -46, k: [0.5, 0.95] }, under: 0x0e3a5a, deepUnder: 0x010812, see: 40, room: 70 });
  w.deepAt = 80;
  w.floorY = -80; w.dark = true;
  const hullM = M(0x2a2a2e, { rough: 0.7, metal: 0.3 }), rust = M(0x5a3a2a, { rough: 0.85, metal: 0.2 }), white = M(0xb8b4a8, { rough: 0.7 });
  const deckM = M("wood", { args: [9, [110, 86, 60]], repeat: [4, 10] }), wall = M(0x8a7a64, { rough: 0.7 }), brass = M(0xc8963a, { metal: 0.8, rough: 0.3 });
  // ---- the hull: x -8..8, z -50 (stern)..50 (bow); decks at 0.4 (hold), 4.4 (cabins), 8.4 (ballroom), 12 (main)
  const X = 8, Z0 = -50, Z1 = 50, T = 0.4, BULK = 20, DK = [0.4, 4.4, 8.4, 12];
  // the air pocket's cargo door: an airlock through the starboard side into the hold
  const AZ = 34;
  const lock = airlock(w, X - 2.5, DK[0], AZ, 3, { wall: hullM });
  // the starboard side, with a hole where the airlock sits and a porthole row (drawn)
  const side = (sx, holes) => {
    let z = Z0;
    for (const [a, b, y0, y1] of [...holes, [Z1, Z1, 0, 0]]) {
      if (a > z) w.box(T, DK[3], a - z, hullM, sx * X, DK[3] / 2, (z + a) / 2);
      if (b > a) { w.box(T, DK[3] - y1, b - a, hullM, sx * X, (DK[3] + y1) / 2, (a + b) / 2); if (y0 > 0) w.box(T, y0, b - a, hullM, sx * X, y0 / 2, (a + b) / 2); }
      z = b;
    }
  };
  side(1, [[AZ - 2.1, AZ + 2.1, DK[0], DK[0] + 3.6]]);
  // the port side has a breach into the engine room
  side(-1, [[-12, -2, DK[0], 7]]);
  w.box(2 * X, T, T, hullM, 0, DK[3] / 2, Z1, { collide: false });
  w.phys.fixedBox(0, DK[3] / 2, Z1, X, DK[3] / 2, T / 2);
  w.box(2 * X, DK[3], T, hullM, 0, DK[3] / 2, Z0);
  // the bow's point and the stern's round (drawn only), a red waterline and the name
  const bow = w.mesh(new THREE.CylinderGeometry(X, X, DK[3], 3, 1), hullM, 0, DK[3] / 2, Z1 + 4); bow.scale.set(1, 1, 1); bow.rotation.y = Math.PI / 2;
  w.phys.fixedBox(0, DK[3] / 2, Z1 + 4, 4, DK[3] / 2, 4);
  w.box(2 * X + 0.1, 1.2, Z1 - Z0, M(0x6a1a1a, { rough: 0.8 }), 0, 0.6, 0, { collide: false });
  w.sign("NEPTUNE", 7, 1.3, X + 0.25, DK[3] - 2, 40, Math.PI / 2, { bg: "#2a2a2e", fg: "#d8c890" });
  w.sign("NEPTUNE", 7, 1.3, -X - 0.25, DK[3] - 2, 40, -Math.PI / 2, { bg: "#2a2a2e", fg: "#d8c890" });
  // the main deck (the roof over everything), a superstructure, two funnels
  w.box(2 * X, T, Z1 - Z0, deckM, 0, DK[3] + T / 2, 0);
  w.box(12, 5, 50, white, 0, DK[3] + 2.9, -4);
  w.box(10, 3, 30, white, 0, DK[3] + 6.9, -6);
  for (const z of [-18, 4]) { w.cyl(2.2, 2.4, 9, M(0xd8a040, { rough: 0.6 }), 0, DK[3] + 12.5, z, { seg: 18 }); w.cyl(2.25, 2.25, 1.6, M(0x1a1a1a), 0, DK[3] + 16.4, z, { seg: 18, collide: false }); }
  for (let z = -40; z < 46; z += 3) for (const sx of [-1, 1]) w.mesh(new THREE.CircleGeometry(0.35, 12), M(0xffd890, { emissive: 0xffc860, ei: z > BULK ? 1.2 : 0.05 }), sx * (X + 0.22), DK[2] + 1.6, z, { ry: sx * Math.PI / 2, cast: false });

  // ---- inside the air pocket (z BULK..Z1): the bulkhead that keeps the air in, three decks, the
  // grand staircase, cabins, the ballroom
  w.box(2 * X, DK[3], T, rust, 0, DK[3] / 2, BULK);
  w.box(2 * X - T, T, Z1 - BULK, deckM, 0, DK[0] - T / 2, (BULK + Z1) / 2);
  // decks B and C, each with a stairwell: the first flight (hold to cabins) up the port side, the
  // second (cabins to ballroom) up the starboard side, each starting a step back from the bulkhead
  const RUN = 0.52, RISE = 4 / 12, ZS = BULK + 1.7, ZE = ZS + 12 * RUN;
  const PORT = [-X + T / 2, -5.0], STAR = [5.0, X - T / 2];
  const slab = (y, [hx0, hx1]) => {
    const x0 = -X + T / 2, x1 = X - T / 2, z0 = BULK + T / 2, z1 = Z1 - T / 2, hz0 = ZS + 0.4;
    const put = (a, b, c, d) => { if (b - a > 0.01 && d - c > 0.01) w.box(b - a, T, d - c, deckM, (a + b) / 2, y - T / 2, (c + d) / 2); };
    put(x0, x1, z0, hz0); put(x0, x1, ZE, z1); put(x0, hx0, hz0, ZE); put(hx1, x1, hz0, ZE);
  };
  slab(DK[1], PORT); slab(DK[2], STAR);
  const carpet = M(0x6a1a2a, { rough: 0.8 });
  w.steps(12, PORT[1] - PORT[0] - 0.2, RISE, RUN, carpet, (PORT[0] + PORT[1]) / 2, DK[0], ZS, 0);
  w.steps(12, STAR[1] - STAR[0] - 0.2, RISE, RUN, carpet, (STAR[0] + STAR[1]) / 2, DK[1], ZS, 0);
  // banisters on the open side of each flight
  w.fence(PORT[1] + 0.05, ZS, PORT[1] + 0.05, ZE, 1, brass, { y: (x, z) => DK[0] + Math.min(4, Math.max(0, (z - ZS) / RUN) * RISE) });
  w.fence(STAR[0] - 0.05, ZS, STAR[0] - 0.05, ZE, 1, brass, { y: (x, z) => DK[1] + Math.min(4, Math.max(0, (z - ZS) / RUN) * RISE) });
  // the hold: crates and a pile of Undertow's barrels
  for (const [x, z] of [[4, 44], [2, 46], [-4, 42], [-5.5, 46.5], [5, 26]]) w.box(1.6, 1.4, 1.6, M("wood", { args: [5, [150, 110, 70]] }), x, DK[0] + 0.7, z);
  for (const [x, z] of [[-2, 30], [-1, 31.4], [0.4, 30.2]]) w.cyl(0.45, 0.45, 1.1, M(0x2a8a8a, { metal: 0.4 }), x, DK[0] + 0.55, z, { seg: 12 });
  // the cabin deck: a corridor down the middle, cabin walls either side with doorways
  for (const sx of [-1, 1]) for (let z = 30; z < Z1 - 2; z += 4) { w.box(T / 2, 3.6, 2.4, wall, sx * 2.2, DK[1] + 1.8, z + 1.2); w.box(X - 2.2, 3.6, T / 2, wall, sx * (2.2 + (X - 2.2) / 2), DK[1] + 1.8, z); }
  // the ballroom: pillars, a dance floor, chandeliers, a stage
  for (const [x, z] of [[-4.5, 30], [4.5, 30], [-4.5, 38], [4.5, 38], [-4.5, 46], [4.5, 46]]) w.cyl(0.35, 0.35, 3.6, M(0xe8e0c8, { rough: 0.4 }), x, DK[2] + 1.8, z, { seg: 12 });
  const floorTiles = new THREE.Mesh(new THREE.PlaneGeometry(8, 12), new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.25, metalness: 0.2 })); floorTiles.rotation.x = -Math.PI / 2; floorTiles.position.set(0, DK[2] + 0.02, 38); w.scene.add(floorTiles);
  w.box(10, 0.8, 3, M(0x6a1a2a, { rough: 0.8 }), 0, DK[2] + 0.4, Z1 - 2);
  for (const [x, z] of [[0, 30], [0, 42]]) { w.mesh(new THREE.SphereGeometry(0.6, 12, 8), M(0xfff0c0, { emissive: 0xffd890, ei: 1.5 }), x, DK[3] - 1.2, z, { cast: false }); const l = new THREE.PointLight(0xffd890, 8, 16, 1.4); l.position.set(x, DK[3] - 1.6, z); w.scene.add(l); }
  for (const [y, z] of [[DK[0] + 3, 40], [DK[1] + 3, 36]]) { const l = new THREE.PointLight(0xffe0b0, 6, 14, 1.4); l.position.set(0, y, z); w.scene.add(l); }
  // the air: the whole bow above the hold's floor (the airlock's own room was made first, so
  // inside the airlock it's the airlock that decides)
  const pocket = w.dryRoom(-X + T / 2, DK[0] - 0.1, BULK + T / 2, X - T / 2, DK[3], Z1 - T / 2);
  void pocket;

  // ---- aft, flooded: the engine room behind the breach, and Undertow's pipe through it
  for (const z of [-20, -8, 4]) { w.box(4, 5, 8, M(0x3a3e44, { metal: 0.6, rough: 0.5 }), 2, DK[0] + 2.5, z); w.cyl(0.6, 0.6, 8, rust, 2, DK[0] + 5.6, z, { rz: Math.PI / 2, seg: 10, collide: false }); }
  w.box(2 * X - T, T, BULK - Z0, rust, 0, DK[0] - T / 2, (BULK + Z0) / 2);
  const panel = [-5.4, DK[0], -6];
  w.box(1.6, 2, 0.4, M(0x2a3a4a, { metal: 0.6 }), panel[0], DK[0] + 1, panel[2] - 1.4);
  for (let k = 0; k < 4; k++) w.mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), brass, panel[0] - 0.5 + k * 0.33, DK[0] + 1.3, panel[2] - 1.15, { cast: false });
  const pipeM = M("metal", { args: [9, [104, 118, 110], 128], repeat: [10, 2], rough: 0.6, metal: 0.5 });
  w.mesh(new THREE.CylinderGeometry(1.1, 1.1, 60, 18), pipeM, -3, DK[0] + 1.6, -20, { rx: Math.PI / 2 });
  w.phys.fixedBox(-3, DK[0] + 1.6, -20, 1.0, 1.0, 30);
  // out of the stern and away down the drop
  const PIPE = [[-3, -50], [-10, -62], [-40, -66], [-80, -60]];
  for (let i = 0; i + 1 < PIPE.length; i++) {
    const [ax, az] = PIPE[i], [bx, bz] = PIPE[i + 1], L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, ry = Math.atan2(bx - ax, bz - az);
    const ya = Math.max(h(ax, az), -40) + 1.6, yb = Math.max(h(bx, bz), -40) + 1.6, cy = (ya + yb) / 2, pitch = Math.atan2(yb - ya, L);
    const m = w.mesh(new THREE.CylinderGeometry(1.1, 1.1, Math.hypot(L, yb - ya) + 0.8, 18), pipeM, cx, cy, cz);
    m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2 - pitch, ry, 0, "YXZ"));
  }

  // ---- the dive bell, off the starboard bow
  const bell = diveBell(w, 22, h(22, 30), 30);

  // ---- life in the gloom: a big old grouper, a school of silver fish round the bow, jellies
  roam(w, "seaturtle", { cx: 10, cz: 0, rx: 30, rz: 50, y: 18, dy: 3, period: 80 });
  school(w, 14, 10, 44, 60, 7, 0xa8b8c8); school(w, -20, -10, -30, 40, 6, 0x8a9aa8);
  for (let k = 0; k < 5; k++) { const j = critter("jelly", 1.2 + k * 0.2); w.scene.add(j); const px = -30 + k * 11, pz = 20 - k * 13, ph = k * 1.3; w.updaters.push((dt, t) => { j.position.set(px + Math.sin(t * 0.1 + ph) * 3, 14 + Math.sin(t * 0.3 + ph) * 3, pz); animateCritter(j, dt, 0.3); }); }
  w.vent(-20, h(-20, 10), 10, 30); w.airStation(14, h(14, -10), -10);

  // ---- the missions
  const inside = (x, y, z) => [x, y, z];
  w.missionData = {
    lin1: { steps: [[lock, "in"]], goal: [0, DK[0] + 0.5, 38] },
    lin2: { enter: [1, DK[0] + 0.1, 36, 0], cells: [inside(4, DK[0] + 1, 40), inside(-5, DK[0] + 1, 26), inside((PORT[0] + PORT[1]) / 2, DK[0] + 2.4 + 0.8, ZS + 6 * RUN), inside(0, DK[1] + 1, 30), inside(0, DK[1] + 1, 46), inside(5, DK[1] + 1, 41), inside((STAR[0] + STAR[1]) / 2, DK[1] + 2.4 + 0.8, ZS + 6 * RUN), inside(0, DK[2] + 1, 44)] },
    lin3: { enter: [(STAR[0] + STAR[1]) / 2, DK[2] + 0.1, ZE + 1, Math.PI], start: [(STAR[0] + STAR[1]) / 2, DK[2] + 0.1, ZE + 1], goal: [0, DK[2] + 0.9, Z1 - 4.5],
      guards: [{ path: [[-6, 32], [6, 32]], speed: 1.3, y: DK[2] }, { path: [[6, 40], [-6, 40]], speed: 1.5, phase: 0.4, y: DK[2] }, { path: [[-2.5, 45], [2.5, 45]], speed: 1.1, y: DK[2] }] },
    lin4: { title: "ENGINE ROOM VALVES" },
    lin5: { sub: [16, 8, 36, -Math.PI / 2], exit: bell.spawn, thing: "safe", items: [[-58, h(-58, 24) + 0.7, 24], [-66, h(-66, -4) + 0.7, -4], [-52, h(-52, 44) + 0.7, 44]], pad: [14, 1, 16], padR: 3, floor: -48 },
    lin6: { exit: bell.spawn, floor: -60, path: [[16, 6, 20], [4, 8, -4], [-14, 4, -30], [-40, -10, -40], [-60, -24, -20], [-66, -32, 10], [-58, -36, 40], [-70, -38, 70]] },
  };
  return {
    stars: [[-3.5, DK[2] + 0.4, Z1 - 3], [-60, h(-60, 60) + 0.3, 60], [0, DK[3] + 0.6, 30]],
    spawn: bell.spawn, yaw: -Math.PI / 2, bolt: [19.5, bell.F + 0.1, 27.5], contact: [25.5, bell.F, 27.5, -0.8],
    swimTop: 34, lamp: 30,
    at: { lin1: [lock.sea[0] + 0.5, lock.sea[1], 3], lin2: [lock.sea[0] + 1.5, lock.sea[1] + 2.5, 3], lin3: [lock.sea[0] + 1.5, lock.sea[1] - 2.5, 3], lin4: [panel[0] + 1, panel[2], 3], lin5: [19.5, 33, bell.F + 1], lin6: [24.5, 33, bell.F + 1] },
  };
}
