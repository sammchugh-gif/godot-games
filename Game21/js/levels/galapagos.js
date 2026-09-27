// The Galápagos Islands: a dry volcanic island. The research station and the
// giant tortoises' pen sit above the bay; the turtle beach curves away to the
// east; black lava runs down to the sea in the west, where the marine iguanas
// bask; and above them the old lava fields climb the volcano in basalt columns
// and steam vents, up to the Drips' radio mast. Out in the bay, the sea lions
// play round a salvage barge.
import * as THREE from "three";
import { M } from "../tex.js";
import { pier, rocks } from "./kit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildGalapagos(w) {
  w.setSky({ top: "#2a74d0", mid: "#8cc8ee", bottom: "#d8ecec", sun: [55, 160], sunColor: "#fff6e0", sunI: 2.4, hemi: ["#cfe8ff", "#6a6048", 0.64], fog: [120, 520], clouds: 14 });
  const LV = 0;
  const coast = x => 4 + Math.sin(x * 0.05) * 3;
  // the lava field is a shelf at 6 up the volcano's foot; the volcano itself rises behind it
  const shelf = (x, z) => { const q = Math.hypot((x + 48) / 40, (z - 58) / 22) + Math.sin(x * 0.3) * Math.cos(z * 0.27) * 0.05; return 6 * S(1.12, 0.96, q); };
  // the black lava: the shelf, and the shore west of the station down to the sea
  const lavaAt = (x, z) => shelf(x, z) > 0.3 || (x < -22 + Math.sin(z * 0.15) * 5 && z < coast(x) + 17 + Math.sin(x * 0.2) * 4);
  const h = (x, z) => {
    const d = z - coast(x), beach = S(26, 34, x) * S(84, 76, x);
    // inland the ground rises gently; seaward it shelves to the bay floor (gentler on the beach)
    let y = d > 0 ? 0.6 + d * (0.1 - beach * 0.03) : 0.6 + d * (0.25 - beach * 0.1);
    y = Math.max(y, -12 + Math.sin(x * 0.13) * Math.cos(z * 0.11) * 0.8);
    // the black lava shore to the west is lumpy
    if (x < -20) y += Math.sin(x * 0.55) * Math.cos(z * 0.5) * 0.35 * S(-20, -30, x) * S(-4, 2, d);
    const sh = shelf(x, z); if (sh > 0) y = Math.max(y, sh);
    // the volcano
    const v = Math.hypot(x + 50, z - 125);
    if (v < 80) y = Math.max(y, 46 * S(80, 8, v) - 2);
    return y;
  };
  w.terrain(460, 230, h, M("grass", { args: [27, [118, 116, 80]], repeat: [80, 80], normal: 0.7 }));
  w.ocean({ level: LV, box: [10, -40, 260, 120], shallow: 0x3ac8c0, deep: 0x0a4a70, under: 0x1a7088, clear: 0.6, waves: 0.7 });
  // sand on the beach and the bay floor, black lava in the west and on the shelf
  w.overlay(55, 8, 58, 22, M("sand", { args: [6, [232, 220, 188]], repeat: [16, 8] }), (x, z) => x > 27 && x < 83 && z > -3 && z < 19 && h(x, z) > -0.8);
  w.overlay(10, -40, 200, 90, M("sand", { args: [7, [210, 200, 170]], repeat: [40, 18] }), (x, z) => h(x, z) < LV - 0.5, 0.02);
  const lava = M("lava", { args: [61], repeat: [24, 32] }); lava.roughness = 0.9;
  w.overlay(-55, 32, 80, 96, lava, (x, z) => lavaAt(x, z) && h(x, z) > -0.6, 0.05);
  // hot cracks glowing in the lava shelf
  const glow = M(0xff6a20, { emissive: 0xff4a10, ei: 2.2 });
  for (let k = 0; k < 16; k++) { const x = -86 + (k * 37) % 64, z = 42 + (k * 13) % 26; w.box(0.25, 0.05, 2 + (k % 3), glow, x, h(x, z) + 0.06, z, { ry: k * 1.3, collide: false }); }

  // ---- the research station, the tortoise pen and the boardwalk down to the beach
  const sy = h(0, 36);
  w.building(12, 4.5, 8, 0, 36, { y: sy - 0.2, wall: [240, 238, 228], roof: "flat", seed: 12, win: { lit: 0.1, glass: "#3a6a8a" } });
  w.sign("ESTACIÓN CIENTÍFICA", 7, 1, 0, sy + 3.6, 31.95, Math.PI, { bg: "#1a4a3a", fg: "#fff4d8" });
  const post = M("wood", { args: [8, [120, 92, 64]] });
  for (const [a, b, c, d] of [[10, 24, 24, 24], [24, 24, 24, 36], [24, 36, 10, 36], [10, 36, 10, 28]]) w.fence(a, b, c, d, 1.1, post, { y: h });
  const rosa = critter("tortoise", 1.9); rosa.position.set(16, h(16, 30), 30); rosa.rotation.y = -2.4; w.scene.add(rosa);
  w.updaters.push(dt => animateCritter(rosa, dt, 0.05));
  for (const [cx, cz, ph] of [[18, 31, 0], [15, 28, 3]]) roam(w, "tortoise", { cx, cz, rx: 3, rz: 2, y: h(cx, cz), dy: 0, period: 120, scale: 1.3, phase: ph, speed: 0.15 });
  w.sign("DOÑA ROSA", 2.2, 0.5, 17, h(17, 24) + 1.4, 23.9, Math.PI, { bg: "#5a3a1a", fg: "#fff4d8" });
  const plank = M("wood", { args: [9, [150, 120, 84]], repeat: [1, 6] });
  const walk = [[2, 30.5], [4, 22], [20, 18.5], [33, 14]];
  for (let k = 0; k + 1 < walk.length; k++) {
    const [x0, z0] = walk[k], [x1, z1] = walk[k + 1], y0 = h(x0, z0) + 0.2, y1 = h(x1, z1) + 0.2;
    w.ramp(2.2, Math.hypot(x1 - x0, z1 - z0), y1 - y0, plank, x0, y0, z0, Math.atan2(x1 - x0, z1 - z0));
  }

  // ---- the turtle beach: nests in the dry sand, crabs on the wet sand, mangroves at the ends
  for (const [x, z] of [[40, 16], [52, 18], [62, 15], [72, 17]]) { const y = h(x, z); w.mesh(new THREE.TorusGeometry(0.7, 0.15, 6, 16), M("sand", { args: [6, [214, 196, 160]] }), x, y + 0.05, z, { rx: Math.PI / 2, cast: false }); }
  for (let k = 0; k < 10; k++) { const x = k < 5 ? 26 + k * 1.5 : 80 + (k - 5) * 1.6, z = 6 + (k % 3) * 3; w.tree(x, z, 3 + (k % 2), { y: h(x, z) - 0.2, color: 0x2a6a34, collide: false }); }
  w.sign("PLAYA DE LAS TORTUGAS", 5, 0.8, 32, h(32, 20) + 1.8, 20, -Math.PI / 2 - 0.6, { bg: "#2a5a7a", fg: "#fff4d8" });

  // ---- the lava shore: iguanas basking on the rocks
  rocks(w, -52, 0, 14, 16, 1.4, { seed: 71, color: [60, 56, 54] });
  for (let k = 0; k < 7; k++) { const x = -30 - k * 6, z = coast(x) + 3 + (k % 3) * 2, c = critter("iguana", 2.2); c.position.set(x, h(x, z), z); c.rotation.y = k * 1.7; w.scene.add(c); w.updaters.push(dt => animateCritter(c, dt, 0.05)); }

  // ---- the lava field: basalt columns stepping up to the high rocks, steam vents to bounce on,
  // and the Drip mast at the top
  const basalt = M("rock", { args: [63, [66, 62, 60]], repeat: [1, 2] }); basalt.flatShading = true;
  // (each column a hop across and no more than a metre up from the one before, so a jump always makes it)
  const cols = [[-24, 44, 1.0], [-28, 46.5, 1.9], [-32, 48.5, 2.8], [-36.5, 49, 2.0], [-40.5, 51, 2.9], [-44, 53.5, 3.8], [-48.5, 54, 3.0], [-52.5, 56, 3.9], [-56, 59, 4.8], [-60, 61, 4.0], [-64, 59, 4.9], [-30, 55, 1.2], [-26, 58, 2.1], [-22, 56, 1.0]];
  const tops = cols.map(([x, z, ht]) => {
    const gy = h(x, z), top = gy + ht;
    w.mesh(new THREE.CylinderGeometry(1.25, 1.35, ht + 1, 6), basalt, x, top - (ht + 1) / 2, z);
    w.phys.fixedCyl(x, top - (ht + 1) / 2, z, 1.2, (ht + 1) / 2);
    return [x, top, z];
  });
  // steam vents: bounce pads that hiss
  const vents = [[-47, 59.5, 16], [-34, 60, 16], [-70, 52, 16]].map(([x, z, p]) => { const pd = w.pad(x, h(x, z), z, p, 0xe8f0f0); return [x, h(x, z), z, p, pd]; });
  w.updaters.push(() => { for (const [x, y, z] of vents) if (w.fx && Math.random() < 0.3) w.fx.puff(x + (Math.random() - 0.5), y + 0.5, z + (Math.random() - 0.5), 0xf0f4f4, 1); });
  // the high rocks the vents throw Rory up to
  const high = [[-50, 64, 7], [-37, 64.5, 6.5], [-74, 56, 7.2]].map(([x, z, ht]) => {
    const gy = h(x, z), top = gy + ht;
    w.mesh(new THREE.CylinderGeometry(2, 2.6, ht + 1, 7), basalt, x, top - (ht + 1) / 2, z);
    w.phys.fixedCyl(x, top - (ht + 1) / 2, z, 2, (ht + 1) / 2);
    return [x, top, z];
  });
  // the mast: a lattice tower with a dish and a blinking light
  const mx = -62, mz = 68, my = h(mx, mz), steel = M(0x5a646e, { metal: 0.7, rough: 0.4 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) w.cyl(0.08, 0.1, 14, steel, mx + sx * 0.7, my + 7, mz + sz * 0.7, { seg: 6, collide: false });
  for (let k = 1; k < 7; k++) w.box(1.5, 0.08, 1.5, steel, mx, my + k * 2, mz, { collide: false });
  w.phys.fixedBox(mx, my + 7, mz, 0.8, 7, 0.8);
  w.mesh(new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), M(0xe8e8ec, { metal: 0.3, side: THREE.DoubleSide }), mx + 0.9, my + 11, mz, { rz: -Math.PI / 2 });
  const blink = w.mesh(new THREE.SphereGeometry(0.22, 10, 8), M(0xff3a3a, { emissive: 0xff2020, ei: 3 }), mx, my + 14.3, mz, { cast: false });
  blink.userData.dynamic = true; w.updaters.push(() => { blink.visible = Math.sin(w.t * 5) > 0; });
  w.box(2.4, 1.6, 1.2, M(0x2a3040, { metal: 0.6 }), mx + 2, my + 0.8, mz - 1.4);
  w.sign("DRIP", 1.6, 0.5, mx + 2, my + 1.2, mz - 2.02, Math.PI, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });

  // ---- the bay: a jetty out to the salvage barge, its crane and cradle, sea lions on the rocks
  const jx = -10, jy = 1.3;
  pier(w, jx, coast(jx) + 4, jx, -8, jy, 2.4, -6, M("wood", { args: [9, [140, 110, 76]], repeat: [1, 10] }));
  const bz = -13, hull = M(0x3a4a5a, { metal: 0.4, rough: 0.5 }), rust = M(0x8a4a2a, { rough: 0.8 });
  w.box(16, 2.6, 7, hull, jx, 0.1, bz - 1.5); w.box(16.2, 0.4, 7.2, rust, jx, -0.8, bz - 1.5, { collide: false });
  w.box(3, 3, 3, M(0xf0c020), jx - 5, 2.9, bz - 1.5);
  const arm = w.mesh(new THREE.BoxGeometry(0.5, 0.5, 13), M(0xf0c020, { metal: 0.3 }), jx, 6.8, bz - 6.5, { rx: -0.25 });
  w.cyl(0.3, 0.4, 5, M(0xf0c020, { metal: 0.3 }), jx, 3.8, bz - 1.5, { seg: 10 }); void arm;
  const cz = -24, cy = -4.5;
  w.cyl(0.03, 0.03, 9.5, M(0x2a2a2a), jx, cy + 5.4, cz, { collide: false, seg: 4 });
  w.box(4.4, 0.4, 4.4, M(0x5a646e, { metal: 0.6 }), jx, cy - 0.2, cz);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) w.cyl(0.15, 0.15, 2.4, steel, jx + sx * 1.9, cy - 1.4, cz + sz * 1.9, { seg: 6 });
  w.sign("SALVAGE", 3, 0.7, jx, 2.6, bz + 2.02, 0, { bg: "#3a2a1a", fg: "#ffd166" });
  rocks(w, 30, -6, 6, 5, 1.8, { seed: 73, color: [70, 66, 62] });
  for (const [x, z, ry] of [[29, 9.5, 2.6], [32, 8.3, -2.2], [34.5, 10.6, 3.4]]) { const c = critter("sealion", 1.1); c.position.set(x, h(x, z), z); c.rotation.y = ry; w.scene.add(c); w.updaters.push(dt => animateCritter(c, dt, 0.05)); }
  roam(w, "sealion", { cx: 22, cz: -24, rx: 10, rz: 6, y: -2, dy: 0.8, period: 16 });
  roam(w, "sealion", { cx: 30, cz: -30, rx: 7, rz: 9, y: -4, dy: 1, period: 20, dir: -1 });
  roam(w, "seaturtle", { cx: 0, cz: -40, rx: 20, rz: 8, y: -5, dy: 0.5, period: 70 });
  roam(w, "manta", { cx: -20, cz: -55, rx: 26, rz: 12, y: -7, dy: 0.6, period: 60, scale: 1.4 });
  school(w, 34, -6, -34, 50, 5, 0xe8d23a);
  school(w, -25, -5, -40, 40, 4, 0x3ab0e8);
  w.vent(26, h(26, -26), -26, 30);

  // ---- prickly-pear cactus trees and grey palo santo on the dry slopes
  const pad = M(0x5a8a3a, { rough: 0.8 }), bark = M(0x7a6a54, { rough: 0.95 });
  for (let k = 0; k < 40; k++) {
    const a = k * 2.399, r = 30 + (k % 7) * 9, x = Math.cos(a) * r * 1.4, z = 30 + Math.abs(Math.sin(a)) * r * 0.8;
    const y = h(x, z);
    if (y < 1.5 || (x > 4 && x < 26 && z < 38) || (x < -18 && z > 38 && z < 72) || Math.abs(x - 0) < 8 && z < 42) continue;
    if (k % 2) {
      w.cyl(0.18, 0.25, 3, bark, x, y + 1.5, z, { seg: 8 });
      for (let i = 0; i < 9; i++) { const p = w.mesh(new THREE.SphereGeometry(0.45, 10, 6), pad, x + Math.sin(i * 2.1) * 0.6, y + 3 + (i % 3) * 0.5, z + Math.cos(i * 2.1) * 0.6, { cast: true }); p.scale.set(1, 1.3, 0.25); p.rotation.y = i * 1.3; }
    } else w.tree(x, z, 5 + (k % 3), { y, color: 0x8a9a7a, collide: false });
  }
  // saltbush and scrub everywhere the ground is dry (one instanced mesh)
  const bush = new THREE.IcosahedronGeometry(0.7, 0); bush.scale(1, 0.6, 1);
  const bushes = new THREE.InstancedMesh(bush, M(0x5a6a3a, { rough: 0.9, flat: true }), 420);
  const mtx = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  let nb = 0;
  for (let k = 0; k < 2400 && nb < 420; k++) {
    const x = -150 + ((k * 97.13) % 300), z = 8 + ((k * 53.71) % 110), y = h(x, z);
    if (y < 1 || lavaAt(x, z) || (x > 26 && x < 84 && z < 22) || (x > -8 && x < 26 && z > 20 && z < 40) || Math.hypot(x + 50, z - 125) < 30) continue;
    const s = 0.6 + ((k * 7.7) % 1) * 0.9;
    mtx.compose(ps.set(x, y + 0.2 * s, z), qq.setFromAxisAngle(ps.clone().set(0, 1, 0), k), sc.set(s, s, s)); bushes.setMatrixAt(nb++, mtx);
  }
  bushes.count = nb; bushes.castShadow = true; bushes.receiveShadow = true; bushes.userData.dynamic = true; w.scene.add(bushes);
  w.floorY = -30;

  const pearl = (x, y, z) => [x, y, z];
  const T = tops, Hh = high;
  w.missionData = {
    gal1: { critter: "turtle", kids: [[40, h(40, 16), 16], [52, h(52, 18), 18], [62, h(62, 15), 15], [72, h(72, 17), 17]], goal: [56, h(56, 1), 1], goalR: 3.5, release: true,
      crabs: [[36, 9, 76, 9, 1.1], [44, 12.5, 70, 12.5, 1.3]] },
    gal2: { area: [-44, 11, 11], costume: "iguana", decoys: [[-40, 8], [-50, 12], [-36, 14], [-46, 5], [-54, 9]],
      bots: [[-42, 0, 10], [-48, 0, 14], [-38, 0, 6], [-52, 0, 8], [-44, 0, 16]] },
    gal3: { cells: [pearl(18, h(18, -18) + 0.9, -18), pearl(26, h(26, -30) + 1, -30), pearl(36, h(36, -22) + 0.9, -22), pearl(14, h(14, -36) + 1, -36), pearl(40, h(40, -40) + 1, -40), pearl(24, -3, -40), pearl(8, h(8, -26) + 0.9, -26)], floor: -13 },
    gal4: { cells: [[T[2][0], T[2][1] + 0.9, T[2][2]], [T[5][0], T[5][1] + 0.9, T[5][2]], [T[8][0], T[8][1] + 0.9, T[8][2]], [T[10][0], T[10][1] + 0.9, T[10][2]], [T[12][0], T[12][1] + 0.9, T[12][2]],
      [Hh[0][0], Hh[0][1] + 0.9, Hh[0][2]], [Hh[1][0], Hh[1][1] + 0.9, Hh[1][2]], [Hh[2][0], Hh[2][1] + 0.9, Hh[2][2]]] },
    gal5: { title: "THE DRIP MAST" },
    gal6: { sub: [jx + 10, -1.5, -14, Math.PI], exit: [jx, jy + 0.1, -6], thing: "part", items: [[-24, h(-24, -44) + 0.45, -44], [6, h(6, -50) + 0.45, -50], [-32, h(-32, -34) + 0.45, -34]], pad: [jx, cy, cz], padR: 2.1, floor: -14 },
  };
  return {
    spawn: [0, h(0, 24), 24], yaw: Math.PI, bolt: [2, h(2, 24), 24], contact: [-3, h(-3, 26), 26, Math.PI * 0.8],
    at: { gal1: [50, 22], gal2: [-30, 16], gal3: [22, 8], gal4: [-18, 42], gal5: [mx + 3, mz - 4], gal6: [jx, -6] },
  };
}
