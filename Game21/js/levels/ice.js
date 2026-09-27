// The Ice Trench, under the Arctic: the sea is roofed with pack ice two metres
// thick, broken only by a few breathing holes. Nuka's ice camp is on top, by the
// dive hole. Below, a trench in the sea bed, and Undertow's ice-brick factory
// on stilts over it: the sea goes in one end and leaves as frozen bricks on
// conveyors. Keels of old ice hang down from the roof like a forest of tunnels,
// and narwhals are trapped behind blocks the factory dumped.
import * as THREE from "three";
import { M } from "../tex.js";
import { walls } from "./deepkit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildIce(w) {
  w.setSky("snow");
  const h = (x, z) => -26 + Math.sin(x * 0.07) * Math.cos(z * 0.06) * 2 - 14 * S(18, 6, Math.abs(z + 10 + Math.sin(x * 0.05) * 4));
  w.terrain(420, 170, h, M("sand", { args: [11, [120, 128, 136]], repeat: [80, 80] }));
  w.ocean({ level: 0, box: [0, 0, 240, 200], shallow: 0x8ad8e8, deep: 0x1a4a6a, under: 0x3a7aa0, deepUnder: 0x061a2a, clear: 0.2, waves: 0.15, caustics: 1.5, see: 36 });
  w.deepAt = 60; w.floorY = -60;
  // ---- the pack ice: a roof over everything but the holes; its top is the snow Rory walks on
  const HOLES = [[0, 0, 3.2], [-40, 30, 2.6], [36, -40, 2.6], [-70, -30, 2.6], [60, 30, 2.6]];
  const ice = M("snow", { args: [5, [232, 240, 248]], repeat: [60, 60] }), under = M(0xcfe8f4, { rough: 0.3, emissive: 0x6a9ab8, ei: 0.35 });
  const R0 = 110, TOP = 1.2, THICK = 3;
  // (a grid of slabs with the hole cells left out, so the roof has colliders with holes in it)
  const C = 4;
  const holeAt = (x, z) => HOLES.some(([hx, hz, r]) => Math.abs(x - hx) < r && Math.abs(z - hz) < r);
  for (let x = -R0; x < R0; x += C) {
    let z0 = null;
    for (let z = -R0; z <= R0; z += C) {
      const open = z >= R0 || holeAt(x + C / 2, z + C / 2);
      if (!open && z0 === null) z0 = z;
      if (open && z0 !== null) { w.box(C, THICK, z - z0, under, x + C / 2, TOP - THICK / 2, (z0 + z) / 2); w.box(C, 0.06, z - z0, ice, x + C / 2, TOP + 0.03, (z0 + z) / 2, { collide: false }); z0 = null; }
    }
  }
  // (each hole is somewhere to come up and breathe: the autopilot looks for air among the dry rooms)
  for (const [hx, hz, r] of HOLES) w.dryRoom(hx - r + 0.4, 0, hz - r + 0.4, hx + r - 0.4, 3, hz + r - 0.4, { wl: 0, below: 60 });
  // rims of broken ice round each hole
  for (const [hx, hz, r] of HOLES) w.mesh(new THREE.TorusGeometry(r * 0.95, 0.3, 8, 24), M(0xe8f4fa, { rough: 0.3 }), hx, TOP, hz, { rx: Math.PI / 2 });
  // keels of old ice hanging down: the tunnels the sub chase threads
  const KEELS = [];
  for (let k = 0; k < 22; k++) { const x = -90 + (k % 11) * 16 + (k > 10 ? 8 : 0), z = k > 10 ? 50 : -60 + Math.sin(k) * 6, d = 8 + (k % 3) * 4; KEELS.push([x, z]); w.box(6 + (k % 2) * 3, d, 5 + (k % 3) * 2, under, x, TOP - THICK - d / 2 + 0.5, z); }

  // ---- Nuka's camp on the ice: tents, a sledge, a flag, a ladder down the dive hole
  const tent = M(0xe86a3a, { rough: 0.8 });
  for (const [x, z, ry] of [[8, 6, 0.4], [10, -4, -0.3]]) { const t = w.mesh(new THREE.ConeGeometry(2, 2.4, 4), tent, x, TOP + 1.2, z, { ry }); w.phys.fixedCyl(x, TOP + 1.2, z, 1.4, 1.2); void t; }
  w.box(2.6, 0.4, 1.2, M("wood", { args: [5, [140, 100, 60]] }), 4, TOP + 0.2, 8);
  w.cyl(0.05, 0.05, 4, M(0xd8d8d8), 6, TOP + 2, 1, { seg: 6 });
  w.box(1.2, 0.8, 0.02, M(0x2a6ad8), 6.6, TOP + 3.5, 1, { collide: false });
  w.steps(4, 1.2, 0.35, 0.35, M(0x8a8a8a, { metal: 0.6 }), 2.5, TOP - 1.4, -1.2, Math.PI / 2);

  // ---- the factory: a hall on stilts over the trench, with a moon pool; conveyors of ice bricks
  const F = -14, FX0 = -30, FX1 = 10, FZ0 = -22, FZ1 = 2, POOL = { x0: 4, x1: 8, z0: -4, z1: 0 };
  const steel = M(0x8a96a8, { metal: 0.6, rough: 0.4 }), floorM = M(0x5a6a7a, { metal: 0.5, rough: 0.6 });
  const slab = (a, b, c, d) => w.box(b - a, 0.4, d - c, floorM, (a + b) / 2, F - 0.2, (c + d) / 2);
  slab(FX0, FX1, FZ0, POOL.z0); slab(FX0, FX1, POOL.z1, FZ1); slab(FX0, POOL.x0, POOL.z0, POOL.z1); slab(POOL.x1, FX1, POOL.z0, POOL.z1);
  w.box(FX1 - FX0, 0.4, FZ1 - FZ0, steel, (FX0 + FX1) / 2, F + 6.2, (FZ0 + FZ1) / 2);
  walls(w, FX0, FZ0, FX1, FZ1, F, 6, [], { mat: steel });
  for (const [x, z] of [[FX0 + 2, FZ0 + 2], [FX1 - 2, FZ0 + 2], [FX0 + 2, FZ1 - 2], [FX1 - 2, FZ1 - 2]]) w.cyl(0.5, 0.6, F - h(x, z), steel, x, (F + h(x, z)) / 2, z, { seg: 10 });
  // conveyors across the hall, bricks sliding along them
  const belt = M(0x1a1e24, { rough: 0.8 }), brickM = M(0xcff4ff, { rough: 0.15, metal: 0.1 });
  const BELTS = [-16, -10];
  for (const z of BELTS) w.box(30, 0.8, 2, belt, -12, F + 0.4, z);
  const bricks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.6, 0.8), brickM, 24); bricks.userData.dynamic = true; w.scene.add(bricks);
  const m4 = new THREE.Matrix4();
  w.updaters.push((dt, t) => { for (let i = 0; i < 24; i++) { const z = BELTS[i % 2], x = -27 + (((i >> 1) * 2.5 + t * 1.5) % 30); m4.makeTranslation(x, F + 1.1, z); bricks.setMatrixAt(i, m4); } bricks.instanceMatrix.needsUpdate = true; });
  // the freezer (its control panel is the circuit), the control room at the west end
  w.box(6, 5, 6, M(0xe8f0f4, { metal: 0.3, rough: 0.3 }), -24, F + 2.5, -4);
  w.sign("FREEZER", 3, 0.7, -24, F + 3.6, -0.95, 0, { bg: "#0a2a4a", fg: "#7ff4e8", glow: 0.6 });
  w.box(0.3, 6, 10, steel, -18, F + 3, -17, { collide: true });
  for (const x of [-20, -4, 6]) { const l = new THREE.PointLight(0xe8f4ff, 8, 16, 1.3); l.position.set(x, F + 5.4, -10); w.scene.add(l); }
  w.sign("DRIP ICE WORKS", 6, 1, (FX0 + FX1) / 2, F + 5, FZ1 + 0.2, 0, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });
  w.dryRoom(FX0 + 0.2, F, FZ0 + 0.2, FX1 - 0.2, F + 6, FZ1 - 0.2, { wl: F, below: 8, air: [(POOL.x0 + POOL.x1) / 2, (POOL.z0 + POOL.z1) / 2] });

  // ---- the narwhals, trapped in a bay walled with dumped ice blocks, and more swimming free
  const BAY = { x: 50, z: -10 };
  for (let k = 0; k < 3; k++) roam(w, "narwhal", { cx: BAY.x, cz: BAY.z, rx: 3 + k, rz: 2 + k * 0.5, y: -10 - k * 2, dy: 0.5, period: 16 + k * 3, phase: k * 2, speed: 0.5, scale: 1.2 });
  roam(w, "narwhal", { cx: -30, cz: 40, rx: 30, rz: 14, y: -8, dy: 1, period: 50, scale: 1.3 });
  roam(w, "sealion", { cx: 10, cz: 20, rx: 12, rz: 8, y: -4, dy: 1, period: 20 });
  school(w, 20, -6, 20, 70, 6, 0xc8d8e8); school(w, -50, -12, -10, 50, 5, 0x9ab0c0);
  w.vent(-20, h(-20, 30), 30, 22); w.airStation(30, h(30, 10), 10); w.vent(40, h(40, -50), -50, 22);

  // ---- the missions
  const bed = (x, z, up = 1.2) => [x, h(x, z) + up, z];
  w.missionData = {
    ice1: { cells: [[-4, -3, 8], [-20, -6, 24], [-40, -4, 18], [-60, -8, -20], [30, -5, -34], [48, -7, 20], [20, -16, 40]], floor: -40 },
    ice2: { start: [7, F + 0.1, -18], goal: [-17, F + 0.9, -20],
      guards: [{ path: [[-4, -20], [-4, -6]], speed: 1.3, y: F }, { path: [[-14, -6], [-14, -20]], speed: 1.2, phase: 0.5, y: F }, { path: [[2, -13], [-12, -13]], speed: 1.4, y: F }] },
    ice3: { start: [8, F + 0.1, -13], goal: [-16, F + 0.1, -13], width: 5 },
    ice4: { title: "THE FREEZER" },
    ice5: { exit: [8, TOP + 0.1, 6], floor: -40, path: [[0, -8, -40], [-20, -9, -54], [-40, -10, -66], [-60, -9, -54], [-80, -10, -64], [-96, -11, -50], [-86, -12, -20], [-70, -10, 10], [-60, -9, 44], [-80, -10, 60]] },
    ice6: { sub: [36, -6, -8, Math.PI / 2], exit: [8, TOP + 0.1, 6], thing: "ice", items: [[BAY.x - 6, -12, BAY.z], [BAY.x, -12, BAY.z - 6], [BAY.x + 6, -12, BAY.z], [BAY.x, -12, BAY.z + 6]], pad: [BAY.x - 18, h(BAY.x - 18, BAY.z) + 1, BAY.z], padR: 3.2, floor: -40 },
  };
  // (the blocks round the bay, on the sea bed under the narwhals; the salvage lifts them away)
  void bed;
  return {
    stars: [bed(-90, 40, 0.3), bed(70, 60, 0.3), [9, TOP + 0.3, 9]],
    spawn: [6, TOP + 0.1, 4], yaw: Math.PI, bolt: [4, TOP + 0.1, 5], contact: [8, TOP, 2.5, -2],
    swimTop: 0.6, lamp: 20,
    at: { ice1: [3.5, 2.5], ice2: [-0.5, 5], ice3: [2, 6.5], ice4: [4.5, 10.5], ice5: [9, 1], ice6: [11, 3] },
  };
}
