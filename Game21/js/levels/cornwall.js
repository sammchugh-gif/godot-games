// Porthcarrow, Cornwall: a fishing harbour where the sea has gone out, leaving
// the boats leaning on the mud between two granite piers. White cottages climb
// the hill behind; a striped lighthouse stands on the headland to the east; and
// round the point to the west, past the smugglers' beach, a sea cave floods down
// to a tunnel and the chamber where Undertow's pump hums.
import * as THREE from "three";
import { M } from "../tex.js";
import { boat, cottage, pier, rocks, cliff, lighthouse } from "./kit.js";
import { roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildCornwall(w) {
  w.setSky({ top: "#3a6cc0", mid: "#9cc4ea", bottom: "#d8e4ec", sun: [38, 200], sunColor: "#fff2dc", sunI: 2.2, hemi: ["#d4e4ff", "#5a6048", 0.64], fog: [100, 460], clouds: 20 });
  const LV = -2.5;
  // the land. The harbour's mud is at -1.2 (dry now), the open sea bed falls away to the south,
  // the village climbs the hill to the north, the headland is a plateau at 12, and the cave and
  // its tunnel are pits under the rock slabs to the west.
  const h = (x, z) => {
    // the cave: its ledge, its pool, the tunnel and the pump chamber (all under the rock slabs)
    if (x > -125 && x < -68 && z > -22 && z < 12) {
      if (x > -78 && z > -15 && z < 5) return -0.5;
      if (x > -92 && z > -15 && z < 5) return -12;
      if (x > -106 && z > -8 && z < -2) return -11;
      if (x <= -105 && z > -16 && z < 6) return -14;
      return -14;
    }
    let y;
    // the harbour basin between the piers
    if (x > -24 && x < 19 && z > -32 && z < 12) y = -1.3 - S(-20, -32, z) * 0.6;
    else y = -3 - S(-30, -90, z) * 11 - S(12, -30, z) * 1.5;
    // the village hill
    const hill = 2 + Math.max(0, z - 12) * 0.34;
    y = Math.max(y, z > 11 ? hill : y);
    // the smugglers' beach to the west
    if (x < -30 && x > -68 && z > -34) y = Math.max(y, 2 - (12 - z) * 0.14);
    // the headland: a plateau with cliffs to the sea, and a path down to the village
    const hd = Math.hypot((x - 72) / 1.2, z + 12);
    const plateau = 12 * S(30, 22, hd);
    const path = z > -12 && x > 32 && x < 60 ? 2 + (x - 32) / 28 * 10 * S(-12, 2, z) : -99;
    y = Math.max(y, plateau, Math.min(12, path));
    // cliffs behind the cave rise high (nothing is under them)
    if (x < -68) y = Math.max(y, Math.min(30, (-68 - x) * 1.2) * S(12, 16, z) + Math.min(30, (-68 - x) * 1.2) * S(-22, -26, z) - 6);
    return y;
  };
  w.terrain(460, 230, h, M("grass", { args: [22, [92, 132, 64]], repeat: [80, 80], normal: 0.6 }));
  w.ocean({ level: LV, box: [-10, -30, 250, 160], shallow: 0x34b8b0, deep: 0x0a3a60, under: 0x13607a, clear: 0.5, waves: 1 });
  // mud on the harbour floor and sand on the beach
  const mud = M("sand", { args: [14, [104, 90, 70]], repeat: [12, 12] }); mud.roughness = 0.3;
  w.overlay(-2.5, -10, 44, 46, mud, (x, z) => x > -24 && x < 19 && z > -33 && z < 11.5);
  w.overlay(-49, -12, 40, 50, M("sand", { args: [6, [222, 200, 158]], repeat: [14, 14] }), (x, z) => x < -30 && x > -68 && z > -36 && z < 11);
  w.overlay(-8, -60, 160, 60, M("sand", { args: [7, [196, 180, 140]], repeat: [30, 12] }), (x, z) => h(x, z) < LV - 0.3, 0.02);
  // the cave's floor is wet rock, not grass
  w.overlay(-96.5, -5, 57, 34, M("rock", { args: [81, [96, 90, 82]], repeat: [10, 6] }), (x, z) => x > -125 && x < -68 && z > -22 && z < 12, 0.03);
  // the piers and the harbour wall along the village front
  const granite = M("stone", { args: [41, [156, 150, 140]], repeat: [2, 10] });
  pier(w, 20, 12, 20, -28, 2, 4, -6, granite); pier(w, 20, -28, 6, -36, 2, 4, -8, granite);
  pier(w, -25, 12, -25, -24, 2, 4, -6, granite); pier(w, -25, -24, -10, -33, 2, 4, -8, granite);
  w.box(45, 5, 2, granite, -2.5, -0.5, 12);
  // steps from the quay down to the mud, and down the inside of each pier
  const stepM = M("stone", { args: [43, [170, 164, 152]], repeat: [1, 1] });
  w.steps(9, 3, 0.367, 0.5, stepM, 0, -1.3, 6.5, 0);
  w.steps(9, 2, 0.367, 0.5, stepM, 13.5, -1.3, -15, Math.PI / 2);
  w.steps(9, 2, 0.367, 0.5, stepM, -18.5, -1.3, -10, -Math.PI / 2);
  // bollards, lobster pots, a lamp at each pier end
  const dark = M(0x1e2228, { metal: 0.6, rough: 0.4 });
  for (const [x, z] of [[20, 0], [20, -12], [20, -24], [-25, 0], [-25, -14], [-8, 12.6], [8, 12.6]]) w.cyl(0.25, 0.3, 0.6, dark, x, 2.3, z, { seg: 10 });
  w.lamp(6, -36, 4, 0x7bed9f, { ei: 4 }); w.lamp(-10, -33, 4, 0xff5a5a, { ei: 4 });
  const pot = M(0x3a5a4a, { rough: 0.8 });
  for (const [x, y, z] of [[-1, -1.0, -8], [0.1, -1.0, -8], [-0.45, -0.4, -8], [14, 2.3, 10], [15, 2.3, 10]]) w.box(0.9, 0.6, 0.9, pot, x, y, z);
  // the boats, stranded on the mud
  const boats = [
    boat(w, -12, -1.35, -5, 0.3, { roll: 0.22, color: 0x2a6ad8, name: "MORWENNA" }),
    boat(w, 5, -1.35, -15, -0.4, { roll: -0.25, color: 0xd83a3a, name: "GULL" }),
    boat(w, -5, -1.4, -25, 1.2, { roll: 0.18, color: 0x2a8a4a, name: "PILCHARD" }),
    boat(w, 12, -1.35, -2, 0.1, { roll: -0.2, color: 0xf0c020, name: "KITTIWAKE" }),
    boat(w, -18, -1.4, -20, 0.8, { roll: 0.25, color: 0xf2f2f2, name: "STARGAZY" }),
  ];
  // the village: cottages up the hill, the harbour master's hut and the pub
  // a steady random number from 0 to 1 for each spot, so the village is the same every visit
  const R = (a, b) => ((Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1 + 1) % 1;
  let i = 0;
  for (let z = 22; z < 52; z += 9) for (let x = -34; x < 32; x += 8.5) { if ((i++ % 5) === 2) continue; const xx = x + (z % 2) * 3, y = h(xx, z) - 0.3; cottage(w, xx, y, z, (R(x, z) - 0.5) * 0.3, { w: 5.5 + R(z, x) * 2, d: 4.5, h: 3.6 + R(x, x) * 1.5, wall: [[238, 236, 226], [230, 224, 206], [214, 222, 230]][i % 3] }); }
  cottage(w, -14, 2, 17, 0, { w: 9, d: 5.5, h: 4.5, wall: [70, 60, 56] });
  w.sign("THE SMUGGLERS' ARMS", 6, 1, -14, 4.2, 14.2, 0, { bg: "#1a2a1a", fg: "#ffd166", glow: 0.4 });
  cottage(w, 12, 2, 16, 0, { w: 5, d: 4, h: 3.2, wall: [230, 230, 236] });
  w.sign("HARBOUR MASTER", 4, 0.8, 12, 3.3, 13.95, 0, { bg: "#0c1a36", fg: "#9fe0ff" });
  for (const x of [-20, -6, 6]) w.lamp(x, 14.5, 4.2, 0xffe0a0, { ei: 3 });
  // the headland and its lighthouse
  const lh = lighthouse(w, 72, 12, -16, { height: 16, door: -0.8 });
  rocks(w, 60, -32, 14, 10, 1.6, { seed: 31 });
  // the smugglers' beach: sand, rocks to hide behind, and the cave in the cliff
  const beachRocks = [[-52, -4], [-56, -12], [-60, 2], [-49, -14], [-63, -9]];
  for (const [x, z] of beachRocks) rocks(w, x, z, 1, 0.1, 1.6, { seed: Math.round(x * z) });
  // the cliff and the cave: rock slabs make the walls and the roof over the cave, with the cave mouth
  // facing the beach, a hole through the back wall for the tunnel, and the pump chamber beyond
  const rc = { color: [112, 106, 96] };
  cliff(w, -86.5, -0.5, 8.5, 37, 29, 7, { ...rc, seed: 62 });            // north wall
  cliff(w, -86.5, -0.5, -18.5, 37, 29, 7, { ...rc, seed: 63 });          // south wall
  cliff(w, -86.5, 10, -5, 37, 8, 20, { ...rc, seed: 64, lumps: false }); // the roof
  cliff(w, -70, -1, -15, 4, 28, 14, { ...rc, seed: 65 });                // the face, either side of the mouth
  cliff(w, -70, -1, 5, 4, 28, 14, { ...rc, seed: 66 });
  cliff(w, -70, 9.25, -5, 4, 9.5, 6, { ...rc, seed: 67, lumps: false }); // over the mouth
  cliff(w, -70, -8, -5, 4, 15, 6, { ...rc, seed: 68, lumps: false }); // under it: the floor of the mouth
  // the back wall, with the tunnel through it
  cliff(w, -98.5, -12.5, -5, 13, 5, 34, { ...rc, lumps: false, seed: 69 });
  cliff(w, -98.5, 3.5, -5, 13, 21, 34, { ...rc, lumps: false, seed: 70 });
  cliff(w, -98.5, -8.5, -14.5, 13, 3, 15, { ...rc, lumps: false, seed: 71 });
  cliff(w, -98.5, -8.5, 4.5, 13, 3, 15, { ...rc, lumps: false, seed: 72 });
  // the pump chamber, under a slab of rock
  cliff(w, -114, 5, -5, 18, 18, 22, { ...rc, lumps: false, seed: 73 });
  cliff(w, -114, -9, -17.5, 18, 12, 3, { ...rc, lumps: false, seed: 74 });
  cliff(w, -114, -9, 7.5, 18, 12, 3, { ...rc, lumps: false, seed: 75 });
  cliff(w, -124, -9, -5, 3, 12, 22, { ...rc, lumps: false, seed: 76 });
  // the dark inside the mouth, seen from the beach (one-sided, so from inside it isn't there)
  { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 40, 4, 32, 40, 40);
    gr.addColorStop(0, "rgba(6,8,10,0.85)"); gr.addColorStop(0.6, "rgba(8,10,12,0.6)"); gr.addColorStop(1, "rgba(10,12,14,0.25)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const veil = w.mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }), -70.5, 2, -5, { ry: Math.PI / 2, cast: false, collide: false });
    veil.userData.dynamic = true; veil.renderOrder = 2; }
  // the ledge inside the cave mouth, with rock steps down into the pool
  w.steps(8, 3, 0.34, 0.5, M("stone", { args: [44, [120, 114, 104]] }), -82, -3.2, -5, Math.PI / 2);
  // the pump, and a lantern or two in the cave
  const pumpM = M(0x2a6ad8, { metal: 0.6, rough: 0.4 });
  w.cyl(1.4, 1.6, 3, pumpM, -116, -12.5, -10); w.cyl(0.5, 0.5, 5, dark, -116, -9, -10, { collide: false });
  w.mesh(new THREE.TorusGeometry(1.5, 0.12, 8, 24), M(0x7fe3ff, { emissive: 0x7fe3ff, ei: 2 }), -116, -11, -10, { rx: Math.PI / 2, cast: false });
  w.box(0.6, 0.6, 10, dark, -110, -13.5, -5, { collide: false });
  w.vent(-110, -14, 2, 10);
  for (const [x, y, z] of [[-74, 1.5, 3.5], [-74, 1.5, -13.5]]) { w.mesh(new THREE.SphereGeometry(0.25, 10, 8), M(0xffc060, { emissive: 0xffa030, ei: 4 }), x, y, z, { cast: false }); const l = new THREE.PointLight(0xffb060, 6, 14, 1.8); l.position.set(x, y, z); w.scene.add(l); }
  // sea life, gulls' eye trees on the hill
  roam(w, "sealion", { cx: 30, cz: -70, rx: 20, rz: 10, y: LV - 0.5, dy: 0.2, period: 50 });
  school(w, 20, -8, -60, 50, 5, 0x8ab0c8);
  school(w, -95, -9, -5, 24, 2.5, 0xc8d8e8);
  for (let k = 0; k < 18; k++) { const x = -40 + k * 5, z = 58 + (k % 3) * 5; w.tree(x, z, 6 + (k % 3), { y: h(x, z) }); }
  w.floorY = -30;
  const B = boats;
  w.missionData = {
    cor1: { cells: [B[0].aft, [5, B[1].roofY + 0.8, -15], [20, 2.8, -10], [-15, 2.8, -30], [-0.45, 0.7, -8], [0, 1.2, 9], B[2].aft, [9, 2.8, -34.3]] },
    cor2: { start: [-44, h(-44, 8), 8], goal: [-67, h(-67, -5), -5], guards: [{ path: [[-50, -2], [-62, -2]], speed: 1.4 }, { path: [[-57, 4], [-57, -14]], speed: 1.2, phase: 0.5 }] },
    cor3: { cells: [3, 11, 19, 27, 35, 43].map(k => { const s = lh.steps[k]; return [s[0], s[1] + 0.8, s[2]]; }).concat([[lh.gallery[0], lh.top + 0.9, lh.gallery[2]]]), climb: lh.climb },
    cor4: { word: "FUNDY", title: "LAMP SIGNALS" },
    cor5: { cells: [[-84, -5, -5], [-90, -8.5, -5], [-96, -8.5, -5], [-102, -8.5, -5], [-110, -10, -3], [-116, -8, -6]], floor: -14 },
    cor6: { path: [[0, -48], [40, -60], [85, -52], [110, -30], [120, -60], [80, -84], [30, -88], [-20, -80], [-40, -62]] },
  };
  return {
    spawn: [-4, h(-4, 16), 16], yaw: Math.PI, bolt: [-2, h(-2, 16), 16], contact: [2, h(2, 14.5), 14.5, Math.PI],
    at: { cor1: [-4, 14], cor2: [-40, 10], cor3: [lh.door[0], lh.door[2]], cor4: [62, -4], cor5: [-74, -5, 3], cor6: [8, -34.5] },
  };
}
void THREE;
