// The POLARIS sub pen: a concrete quay on a Scottish sea loch, the big
// submarine Narwhal moored under its pen roof, a training pool, and TORPEDO's
// slipway. Hills all round, grey-green water, gulls.
import * as THREE from "three";
import { M } from "../tex.js";
import { roam, school } from "../critters.js";

export function buildPen(w) {
  w.setSky({ top: "#3a64a8", mid: "#a8c0d8", bottom: "#d8dde0", sun: [24, 150], sunColor: "#fff0dc", sunI: 2.0, hemi: ["#d0dcec", "#4a5a48", 0.62], fog: [70, 360], clouds: 26, cloudTint: "#e8ecf0" });
  // the land: the quay's shore at 1.2, rising to hills behind; the loch falls away to 16 m deep
  // in front; the training pool is a pit in the quay
  const pool = (x, z) => x > 14 && x < 28 && z > 5 && z < 17;
  const h = (x, z) => {
    if (pool(x, z)) return -6;
    if (z >= 1) return (z < 23 && Math.abs(x) < 50 ? 0.9 : 1.2) + Math.max(0, z - 26) * 0.35 + Math.max(0, Math.abs(x) - 44) * 0.3 + Math.sin(x * 0.08) * Math.max(0, z - 30) * 0.08;
    const off = Math.min(1, (0.5 - z + 3) / 13);
    return 1.2 - off * 17 + Math.sin(x * 0.2) * Math.cos(z * 0.15) * 0.6 * off + Math.max(0, Math.abs(x) - 70) * 0.45;
  };
  w.terrain(420, 210, (x, z) => h(x, z), M("grass", { args: [21, [74, 104, 58]], repeat: [70, 70], normal: 0.6 }));
  w.ocean({ level: 0, box: [0, -20, 180, 140], shallow: 0x3a8a8a, deep: 0x0a2a3a, under: 0x1a5a64, clear: 0.35, waves: 0.7, absorb: [0.2, 0.07, 0.05] });
  w.mountains(18, 230, 110, { seed: 12, color: 0x4a5a48, snow: false });
  const concrete = M("paving", { args: [31, [168, 168, 160], 96], repeat: [12, 6] }), dark = M(0x2a2e34, { metal: 0.5, rough: 0.5 }), yellow = M(0xf4c020, { rough: 0.5 });
  // the quay: a concrete apron along the water, with a wall down into the loch
  // (in four pieces round the training pool)
  w.box(64, 1.4, 22, concrete, -18, 0.5, 12); w.box(18, 1.4, 22, concrete, 37, 0.5, 12);
  w.box(14, 1.4, 4, concrete, 21, 0.5, 3); w.box(14, 1.4, 6, concrete, 21, 0.5, 20);
  w.box(96, 16, 1, M(0x6a6a64, { rough: 0.95 }), -2, -7, 0.5, { cast: false });
  // yellow safety line and bollards along the edge
  w.box(96, 0.02, 0.2, yellow, -2, 1.21, 1.4, { collide: false });
  for (let x = -46; x <= 42; x += 8) { w.cyl(0.25, 0.3, 0.6, dark, x, 1.5, 1.6, { seg: 12 }); }
  // the training pool: tiled walls, steps down one end, a bubble vent at the bottom
  const tile = M("tiles", { args: [12, [214, 236, 240], [150, 190, 200], 10], repeat: [4, 2] });
  for (const [x, z, sx, sz] of [[21, 4.75, 14.5, 0.5], [21, 17.25, 14.5, 0.5], [13.75, 11, 0.5, 13], [28.25, 11, 0.5, 13]]) w.box(sx, 8, sz, tile, x, -2.8, z, { cast: false });
  w.box(14, 0.4, 12, tile, 21, -6.2, 11, { cast: false });
  // the steps: from the deck down into the water at the near end
  w.steps(9, 3, 0.3, 0.45, tile, 16, -1.5, 9.25, Math.PI);
  w.vent(26, -6, 15, 7);
  w.sign("TRAINING POOL", 5, 1.1, 21, 3.2, 17.6, Math.PI, { bg: "#0c2a3a", fg: "#9fe8ff", glow: 0.6 });
  w.box(0.12, 2.2, 0.12, dark, 18.6, 2.3, 17.6); w.box(0.12, 2.2, 0.12, dark, 23.4, 2.3, 17.6);
  // TORPEDO's slipway: a ramp from the quay down into the loch
  w.ramp(6, 12, 3.4, concrete, 36, -2.2, -11.6, 0);
  // the pen: a great concrete shelter over the Narwhal, open to the loch
  const pen = M("paving", { args: [33, [128, 130, 128], 64], repeat: [6, 3] });
  w.box(52, 1.2, 30, pen, -20, 16, -14, { cast: true });
  for (const x of [-45, -20, 5]) w.box(1.6, 17, 1.6, pen, x, 7.5, -28.5);
  w.box(1.6, 17, 1.6, pen, -45, 7.5, -1); w.box(1.6, 17, 1.6, pen, 5, 7.5, -1);
  w.box(52, 5, 0.6, pen, -20, 13, -28.8);
  for (let i = 0; i < 8; i++) w.mesh(new THREE.SphereGeometry(0.35, 12, 8), M(0xffe8b0, { emissive: 0xffe8b0, ei: 5 }), -42 + i * 6, 15.2, -14, { cast: false });
  w.sign("POLARIS · SUB PEN 1", 12, 2, -20, 13.2, -1.3, 0, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1.2 });
  // the Narwhal: a long black submarine, half out of the water, with its tower and a gangway
  const hull = M(0x1a1e24, { metal: 0.4, rough: 0.55 });
  const nw = new THREE.Group(); nw.position.set(-20, -0.8, -15); w.scene.add(nw);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(3, 34, 12, 32), hull); body.rotation.z = Math.PI / 2; body.castShadow = body.receiveShadow = true; nw.add(body);
  const sail = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 2.6), hull); sail.position.set(4, 4.4, 0); sail.castShadow = true; nw.add(sail);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 3.2), hull); f.position.set(4.5, 5, s * 2.8); nw.add(f); }
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(3.02, 3.02, 0.6, 32, 1, true), M(0x9fe0ff, { emissive: 0x3aa8ff, ei: 0.8 })); stripe.rotation.z = Math.PI / 2; stripe.position.x = -8; nw.add(stripe);
  w.phys.fixedBox(-20, -0.8, -15, 20, 3, 3);
  w.phys.fixedBox(-16, 3.6, -15, 2.5, 2.5, 1.3);
  w.fence(-34, -12, -13.4, -12, 1, dark, { y: 2.2 }); w.fence(-10.6, -12, -6, -12, 1, dark, { y: 2.2 }); w.fence(-34, -18, -6, -18, 1, dark, { y: 2.2 });
  // the gangway from the quay to the deck
  w.ramp(2.2, 11.5, 1.0, M("metal", { args: [9, [140, 150, 160]], repeat: [1, 4] }), -12, 1.2, 0.4, Math.PI);
  const gang = (x, z) => 1.35 + (0.4 - z) / 11.5;
  w.fence(-13.1, -1, -13.1, -10.5, 1, dark, { y: gang }); w.fence(-10.9, -1, -10.9, -10.5, 1, dark, { y: gang });
  // cranes, containers, crates and a hut
  const crate = M("wood", { args: [8, [150, 110, 70]], repeat: [1, 1] });
  for (const [x, z, c] of [[-38, 14, 0x2a6ad8], [-38, 17, 0xd83a3a], [-31, 16, 0x2a9a5a]]) w.box(6, 2.6, 2.4, M(c, { rough: 0.6, metal: 0.3 }), x, 2.5, z);
  for (const [x, y, z] of [[4, 1.85, 8], [5.4, 1.85, 8], [4.7, 3.15, 8], [-4, 1.85, 14], [10, 1.85, 3.5], [-34.1, 1.85, 13.5], [-32.7, 1.85, 13.5], [-34.1, 3.15, 13.5]]) w.box(1.3, 1.3, 1.3, crate, x, y, z);
  w.building(14, 7, 8, -12, 24, { y: 1.2, wall: [220, 226, 232], seed: 21, win: { lit: 0.3, glow: "#bfefff", glass: "#3a5a7a" } });
  w.sign("POLARIS", 7, 1.4, -12, 5.6, 19.9, 0, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1.4 });
  const crane = M(0xe8a020, { metal: 0.4, rough: 0.5 });
  w.box(0.8, 16, 0.8, crane, 12, 9.2, 3); w.box(0.8, 0.8, 16, crane, 12, 17, -3.5, { collide: false }); w.box(0.1, 6, 0.1, dark, 12, 13.6, -10.5, { collide: false });
  // lamps along the quay and pines on the hills
  for (let x = -40; x <= 40; x += 16) w.lamp(x, 21, 5, 0xfff0d0, { ei: 3 });
  for (let i = 0; i < 40; i++) { const a = i * 2.39, r = 34 + (i % 7) * 7, x = Math.cos(a) * r * 1.5, z = 30 + Math.abs(Math.sin(a)) * r * 0.9; w.pine(x, z, 7 + (i % 4) * 1.6, { y: h(x, z) }); }
  // life: seals in the loch, a shoal round the pen, gulls overhead
  roam(w, "sealion", { cx: 10, cz: -40, rx: 16, rz: 8, y: -0.6, dy: 0.2, period: 40, scale: 0.9 });
  school(w, -30, -6, -34, 50, 5, 0x9ab8c8);
  school(w, 20, -8, -30, 40, 4, 0x6a8aa8);
  w.floorY = -40;
  const pearl = (x, y, z) => [x, y, z];
  w.missionData = {
    pen1: { cells: [pearl(-6, 2.3, 6), pearl(4.7, 4.6, 8), pearl(10, 3.3, 3.5), pearl(-4, 3.3, 14), pearl(-38, 4.6, 14), pearl(-12, 3.2, -8)] },
    pen2: { cells: [pearl(18, -1, 9), pearl(24, -2.5, 7), pearl(20, -4.5, 14), pearl(26, -5, 8), pearl(17, -5.4, 15)], floor: -6.2 },
    pen3: { sub: [36, -2.5, -16, Math.PI], exit: [36, 1.5, 2], rings: [[34, -3, -26, 2.4, 0], [24, -4, -36, 2.4, 0.8], [10, -6, -44, 2.4, 1.4], [-4, -8, -40, 2.4, 2.2], [-12, -5, -32, 2.4, 3], [-30, -9, -30, 2.4, 2.4], [-46, -6, -22, 2.4, 3.6], [-40, -3, -8, 2.4, 4.4]], floor: -17 },
    pen4: { area: [-26, 10, 9], bots: [[-30, 1.2, 8], [-22, 1.2, 12], [-26, 1.2, 5], [-18, 1.2, 9]] },
    pen5: { pad: [-12, 1.2, 3], padR: 1.7, blocks: [[-2, 1.7, 17], [0, 1.7, 18.5], [-6, 1.7, 17.5]] },
  };
  return {
    spawn: [2, 1.2, 12], yaw: Math.PI, bolt: [4, 1.2, 11], contact: [-3, 1.2, 9, 0.6],
    at: { pen1: [0, 10], pen2: [16, 3.2], pen3: [36, 3], pen4: [-26, 6], pen5: [-8, 10] },
  };
}
void THREE;
