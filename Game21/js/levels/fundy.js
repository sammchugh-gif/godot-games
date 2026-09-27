// The Bay of Fundy, Canada: the highest tides in the world, and the tide has
// gone out and not come back. Red mudflats stretch away to a distant sea; the
// Flowerpot Rocks stand on them like giant pots of trees; a long wooden
// staircase comes down the red cliff; up top are the fields, the shore road, the
// tide gauge hut and, down in the creek, the old tide mill.
import * as THREE from "three";
import { M } from "../tex.js";
import { flowerpot, road, rocks } from "./kit.js";
import { school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildFundy(w) {
  w.setSky({ top: "#3a70c8", mid: "#a4c8ec", bottom: "#e4e0d4", sun: [30, 150], sunColor: "#fff0d8", sunI: 2.15, hemi: ["#d8e4ff", "#6a5040", 0.62], fog: [110, 480], clouds: 18 });
  const LV = -7;
  const edge = x => 12 + Math.sin(x * 0.07) * 1.5;
  const mud = (x, z) => -2 - (10 - z) * 0.05 + Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.25;
  const h = (x, z) => {
    const e = edge(x);
    // the creek and the mill pond, cut down into the fields
    const creek = x > 38 && x < 66 && z > e - 2 && z < 40 ? 1 - S(0, 10, Math.abs(x - 52) - 4) : 0;
    let top = 8 + Math.sin(x * 0.05) * 1.2 * S(20, 40, z) + Math.max(0, z - 70) * 0.25;
    top = top * (1 - creek) + creek * (0.6 + Math.max(0, z - 30) * 0.3);
    if (z >= e + 2) return top;
    const m = z < e ? mud(x, z) : -2;
    if (z >= e) return m + (top - m) * S(e, e + 2, z);
    return z > -90 ? m : m - (-90 - z) * 0.2;
  };
  w.terrain(460, 230, h, M("grass", { args: [24, [104, 138, 70]], repeat: [80, 80], normal: 0.6 }));
  w.ocean({ level: LV, box: [0, -80, 240, 160], shallow: 0x6a9a8a, deep: 0x2a5a6a, under: 0x3a6a6a, clear: 0.3, waves: 0.8, absorb: [0.22, 0.12, 0.1] });
  // red mud and red cliffs
  const redMud = M("sand", { args: [15, [134, 76, 56]], repeat: [30, 30] }); redMud.roughness = 0.3;
  w.overlay(0, -40, 220, 106, redMud, (x, z) => z < edge(x) + 0.5 && h(x, z) > LV - 0.2, 0.03);
  w.overlay(0, 12, 220, 10, M("rock", { args: [82, [164, 88, 62]], repeat: [40, 3] }), (x, z) => Math.abs(z - edge(x) - 1) < 2.4, 0.05);
  // the Flowerpot Rocks, each with a bounce pad at its foot
  const pots = [[-25, -8, 11, 3, 1], [-12, -18, 12, 3.2, 2], [5, -10, 10, 2.8, 3], [18, -22, 13, 3.4, 4], [30, -6, 9, 2.6, 5], [-36, -26, 12, 3, 6]];
  const tops = pots.map(([x, z, ht, r, seed]) => {
    const y = mud(x, z) - 0.4, top = flowerpot(w, x, y, z, ht, r, { seed });
    const px = x + r + 1.9, pz = z + 1, py = mud(px, pz), pw = Math.sqrt(31 * (top - py + 2.2));
    w.pad(px, py, pz, pw, [0x39f0ff, 0xff5ad8, 0x7bed9f][seed % 3]);
    return { x, z, top, r };
  });
  rocks(w, 0, -30, 26, 40, 1.2, { seed: 91, color: [150, 90, 70] });
  // the stairs down the cliff, and the viewing deck at the top
  const plank = M("wood", { args: [8, [130, 96, 62]], repeat: [1, 1] });
  w.steps(29, 2.5, 0.345, 0.5, plank, 4.5, -2, 10.4, -Math.PI / 2);
  w.box(5, 0.3, 6, plank, -11.5, 7.85, 12.6);
  const rail = M(0x5a4030, { rough: 0.8 });
  w.fence(-14, 15.4, -14, 9.8, 1.1, rail, { y: 8 }); w.fence(-14, 9.1, -10, 9.1, 1.1, rail, { y: 8 }); w.fence(-10, 9.1, 4.6, 9.1, 1.1, rail, { y: (x) => -2 + (4.5 - x) / 14.5 * 10 + 0.35 });
  w.sign("HOPEWELL ROCKS", 4, 0.9, -11.5, 9.4, 15.6, Math.PI, { bg: "#1a3a2a", fg: "#f4e8c8" });
  // up top: the tide gauge hut, the fields, fences, and the shore road
  w.building(5, 3, 4, -30, 22, { y: h(-30, 22) - 0.2, wall: [236, 232, 220], roof: "pitched", roofColor: [170, 60, 50], seed: 5 });
  w.cyl(0.06, 0.06, 7, M(0x8a939e, { metal: 0.8 }), -27, h(-27, 22) + 3.5, 22, { collide: false });
  w.sign("TIDE GAUGE", 2.4, 0.6, -30, h(-30, 22) + 2.2, 19.95, 0, { bg: "#0c2a3a", fg: "#9fe8ff", glow: 0.5 });
  const roadPath = [[-70, 30], [-30, 28], [10, 26], [45, 34], [75, 50], [60, 78], [20, 84], [-30, 78], [-72, 62]];
  road(w, roadPath, 7);
  for (let k = 0; k < 26; k++) { const x = -90 + k * 7, z = 100 + (k % 3) * 6; w.pine(x, z, 8 + (k % 4), { y: h(x, z) }); }
  for (let k = 0; k < 10; k++) { const x = -60 + k * 11, z = 50 + (k % 2) * 10; w.tree(x, z, 5 + (k % 3), { y: h(x, z) }); }
  // the tide mill in the creek: a timber mill with its wheel, the empty mill pond, and its sluice
  const mx = 52, mz = 22, my = h(mx, mz);
  w.building(8, 6, 6, mx + 6, mz, { y: my - 0.2, wall: [196, 150, 110], roof: "pitched", roofColor: [110, 70, 50], seed: 7 });
  const wheel = w.mesh(new THREE.CylinderGeometry(3, 3, 0.8, 20, 1, true), M(0x5a4030, { rough: 0.8, side: THREE.DoubleSide }), mx + 1.4, my + 2.8, mz, { rz: Math.PI / 2 });
  wheel.userData.dynamic = true;
  for (let k = 0; k < 10; k++) { const p = w.mesh(new THREE.BoxGeometry(0.12, 0.8, 1.2), M(0x6a4a30), 0, 0, 0, { parent: wheel }); const a = k / 10 * Math.PI * 2; p.position.set(Math.cos(a) * 3, 0, Math.sin(a) * 3); p.rotation.y = -a; }
  w.updaters.push(dt => { wheel.rotation.x += dt * (w.millTurning ? 0.8 : 0.02); });
  w.box(10, 1.6, 0.6, M("stone", { args: [44, [150, 140, 128]] }), mx - 6, my + 0.3, mz - 8);
  w.sign("TIDE MILL", 3, 0.7, mx + 6, my + 5.2, mz - 3.05, Math.PI, { bg: "#3a2a1a", fg: "#f4e8c8" });
  // the fish weir out on the mud: a curve of stakes with a gap to mend
  const stake = M(0x4a3424, { rough: 0.9 });
  for (let k = 0; k < 28; k++) { if (k > 12 && k < 16) continue; const a = -1.2 + k / 27 * 2.4, x = Math.sin(a) * 22, z = -52 + Math.cos(a) * 12; w.cyl(0.12, 0.14, 2.2, stake, x, mud(x, z) + 0.9, z, { seg: 6 }); }
  // birds wheeling over the mud, a shoal out in the far water
  school(w, 20, LV - 2, -120, 40, 6, 0x9aaab8);
  w.floorY = -30;
  const T = tops;
  w.missionData = {
    fun1: { cells: [[T[0].x, T[0].top + 0.9, T[0].z], [T[1].x, T[1].top + 0.9, T[1].z], [T[2].x, T[2].top + 0.9, T[2].z], [T[3].x, T[3].top + 0.9, T[3].z], [T[4].x, T[4].top + 0.9, T[4].z], [T[5].x, T[5].top + 0.9, T[5].z], [-4, mud(-4, 0) + 1, 0], [0, 4.2, 10.4]] },
    fun2: { title: "THE TIDE MILL" },
    fun3: { area: [0, -40, 14], bots: [[-8, mud(-8, -36), -36], [6, mud(6, -44), -44], [-2, mud(-2, -30), -30], [10, mud(10, -34), -34], [-12, mud(-12, -46), -46]] },
    fun4: { title: "WAKE THE TIDE GAUGE" },
    fun5: { path: roadPath, car: "buggy", quarry: "jeep", y: 0.3 },
    fun6: { pad: [0, mud(0, -40), -40], padR: 1.8, blocks: [[-6, mud(-6, -33) + 0.5, -33], [7, mud(7, -32) + 0.5, -32], [-10, mud(-10, -44) + 0.5, -44], [12, mud(12, -46) + 0.5, -46]] },
  };
  return {
    spawn: [-8, 8, 20], yaw: Math.PI, bolt: [-6, 8, 20], contact: [-4, h(-4, 18), 18, Math.PI],
    at: { fun1: [-4, 3], fun2: [mx - 2, mz - 4], fun3: [-2, -24], fun4: [-30, 17], fun5: [-30, 32], fun6: [2, -28] },
  };
}
