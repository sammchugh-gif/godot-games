// Hong Kong at dusk: Victoria Harbour between the Kowloon waterfront (the
// promenade, the clock tower, the ferry pier and a forest of towers) and the
// island's skyline across the water, lit up for the light show. Red-sail junks
// sail loops round the harbour past the pier, and at the container terminal to
// the west Undertow's cargo ship is loading.
import * as THREE from "three";
import { M } from "../tex.js";
import { pier } from "./kit.js";
import { school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildHongKong(w) {
  w.setSky({ top: "#16204a", mid: "#6a5a92", bottom: "#f0a07a", sun: [4, 250], sunColor: "#ffb080", sunI: 1.25, hemi: ["#a4b0e0", "#2a2a3a", 0.58], fog: [120, 560], clouds: 10, cloudTint: "#e0a0a8" });
  const LV = 0, TOP = 2;
  // the Kowloon side is flat at 2 behind its sea wall; the harbour bed is at -12; the island rises
  // steeply on the far side
  const h = (x, z) => {
    let y = z > -3 ? TOP : -12 + 14 * S(-12, -3, z);
    // the island: a sea wall, a flat strip of city, then the Peak's green hills behind
    if (z < -160) y = TOP + Math.max(0, -212 - z) * (2.2 + Math.sin(x * 0.02) * 0.8);
    return y;
  };
  w.terrain(520, 260, h, M("paving", { args: [52, [150, 146, 140], 32], repeat: [140, 140] }));
  w.ocean({ level: LV, box: [-20, -80, 300, 170], shallow: 0x3a7a8a, deep: 0x0a2a4a, under: 0x16404e, clear: 0.2, waves: 0.8, absorb: [0.2, 0.1, 0.08] });
  const lit = { lit: 0.7, glow: "#ffe0a0", glass: "#1a2a44" };
  // the sea wall and the promenade: rails, lamps, palms, benches, the clock tower
  w.box(300, 14, 1.2, M("stone", { args: [55, [150, 146, 138]], repeat: [60, 3] }), -20, TOP - 7, -2.6);
  w.fence(-150, -2.2, -12, -2.2, 1.1, M(0xd8dce0, { metal: 0.6 }), { y: TOP });
  w.fence(12, -2.2, 120, -2.2, 1.1, M(0xd8dce0, { metal: 0.6 }), { y: TOP });
  for (let x = -10; x <= 110; x += 12) { w.lamp(x, 1.5, 4.2, 0xffe0a0, { y: TOP }); }
  for (let x = 20; x <= 100; x += 16) w.palm(x, 6, 7, { y: TOP });
  const clock = M("brick", { args: [56, [196, 120, 90], [176, 104, 80], [230, 220, 200]], repeat: [2, 8] });
  w.box(5, 26, 5, clock, 60, TOP + 13, 12);
  w.box(6, 1, 6, M(0xe8e0d0), 60, TOP + 26.5, 12);
  w.cone(3.6, 6, M(0x5a6a7a, { metal: 0.4 }), 60, TOP + 30, 12);
  for (const [dx, dz, ry] of [[0, -2.52, Math.PI], [2.52, 0, Math.PI / 2], [0, 2.52, 0], [-2.52, 0, -Math.PI / 2]]) {
    const face = w.mesh(new THREE.CircleGeometry(1.4, 24), M(0xfff4d0, { emissive: 0xffe0a0, ei: 0.9 }), 60 + dx, TOP + 22, 12 + dz, { ry, cast: false });
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.05), M(0x1a1a1a)); hand.position.set(0, 0.45, 0.04); hand.userData.dynamic = true; face.add(hand);
    face.userData.dynamic = true;
  }
  // the star ferry pier: a covered pier out into the harbour, and the long pier the junks pass
  const deckM = M("wood", { args: [9, [120, 96, 70]], repeat: [2, 12] });
  pier(w, 0, -3, 0, -25.5, TOP, 6, -12, deckM);
  for (let z = -6; z > -26; z -= 5) for (const s of [-1, 1]) w.cyl(0.2, 0.25, 0.6, M(0x1e2228, { metal: 0.6 }), s * 2.6, TOP + 0.3, z, { seg: 8 });
  // steps up out of the water, beside the pier
  w.steps(5, 2, 0.44, 0.9, M("stone", { args: [43, [170, 164, 152]] }), 8, -0.2, -7.7, 0);
  pier(w, 36, -3, 36, -16, TOP, 10, -12, deckM);
  w.box(10.4, 0.4, 13.4, M(0x2a7a4a), 36, TOP + 4.2, -9.5);
  for (const [x, z] of [[31.5, -4], [40.5, -4], [31.5, -15], [40.5, -15]]) w.cyl(0.18, 0.18, 4, M(0xe8e8e0), x, TOP + 2, z, { seg: 8 });
  w.sign("STAR FERRY", 5, 1, 36, TOP + 5.2, -16.25, Math.PI, { bg: "#1a5a3a", fg: "#ffffff", glow: 0.5 });
  const ferry = new THREE.Group(); ferry.position.set(44.5, 0, -10); w.scene.add(ferry); w.phys.fixedBox(44.5, 1.5, -10, 3, 1.9, 6);
  { const hull = new THREE.Mesh(new THREE.BoxGeometry(12, 2.4, 6), M(0x2a6a4a)); hull.position.y = 0.4; ferry.add(hull);
    const top = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.8, 5.4), M(0xf2f2ee)); top.position.y = 2.5; ferry.add(top);
    ferry.rotation.y = Math.PI / 2; }

  // ---- Kowloon's towers behind the promenade, and the island's skyline across the water
  const towers = [];
  const tower = (x, z, wd, ht, dp, seed, col) => { w.building(wd, ht, dp, x, z, { y: TOP, wall: col, seed, win: lit, ei: 1.0 }); towers.push([x, z, wd, ht, dp]); };
  const cols = [[150, 160, 176], [196, 190, 176], [120, 140, 160], [210, 206, 196], [90, 104, 128]];
  let k = 0;
  for (let x = -40; x <= 120; x += 18) for (const z of [28, 52, 78]) { if (x > 44 && x < 76 && z < 40) continue; tower(x + ((k * 7) % 5), z + ((k * 5) % 6), 12, 24 + ((k * 37) % 50) + (z > 40 ? 16 : 0), 12, 60 + k, cols[k % cols.length]); k++; }
  w.overlay(0, -222, 520, 20, M("grass", { args: [58, [52, 92, 48]], repeat: [120, 5] }), (x, z) => z < -211, 0.05);
  for (let x = -200; x <= 200; x += 22) {
    const z = -178 - ((k * 13) % 26), ht = 50 + ((k * 53) % 90);
    w.building(16, ht, 16, x, z, { y: h(x, z) - 1, wall: cols[k % cols.length], seed: 90 + k, win: lit, ei: 1.1 }); k++;
  }
  // the light show: beams sweeping from the island's rooftops
  const beamM = [0x39f0ff, 0xff5ad8, 0x7bed9f, 0xffd166].map(c => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2), transparent: true, opacity: 0.35, depthWrite: false }));
  const beams = [];
  for (let i = 0; i < 8; i++) { const x = -150 + i * 42, b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.9, 160, 8, 1, true), beamM[i % 4]); b.geometry.translate(0, 80, 0); b.position.set(x, 90, -186); b.userData.dynamic = true; w.scene.add(b); beams.push(b); }
  w.updaters.push(() => beams.forEach((b, i) => { b.rotation.z = Math.sin(w.t * 0.5 + i) * 0.6; b.rotation.x = 0.4 + Math.cos(w.t * 0.4 + i * 1.3) * 0.3; }));

  // ---- the container terminal to the west, and the cargo ship alongside
  const conts = [0xd83a3a, 0x2a8ad8, 0x2a9a5a, 0xf0a020, 0x8a4ad8, 0xe8e8ec];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { const n = 1 + ((i * 3 + j) % 3); for (let q = 0; q < n; q++) w.box(6, 2.6, 2.5, M(conts[(i + j + q) % 6], { metal: 0.3, rough: 0.6 }), -150 + i * 8, TOP + 1.3 + q * 2.6, 12 + j * 4); }
  // the big locked container
  w.box(12, 3.2, 3.2, M(0x3a3a44, { metal: 0.5, rough: 0.5 }), -34, TOP + 1.6, 10);
  w.sign("TIDAL ENGINE", 4, 0.8, -34, TOP + 2, 8.38, Math.PI, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });
  for (const x of [-120, -90]) { w.box(1.2, 30, 1.2, M(0xf0c020), x, TOP + 15, -1); w.box(1.2, 30, 1.2, M(0xf0c020), x, TOP + 15, 18); w.box(1.4, 1.4, 34, M(0xf0c020), x, TOP + 30, -8); }
  // the ship: hull, deck, containers in rows with lanes between, the bridge at the stern
  const sx0 = -140, sx1 = -50, sz = -15, deck = 7.5, hullM = M(0x1a2a3a, { metal: 0.3, rough: 0.5 });
  w.box(sx1 - sx0, 12, 20, hullM, (sx0 + sx1) / 2, deck - 6, sz);
  w.box(sx1 - sx0 + 0.2, 1.6, 20.2, M(0xb83a2a), (sx0 + sx1) / 2, -4.2, sz, { collide: false });
  w.sign("PEARL EXPRESS", 10, 1.4, -95, deck - 2.2, sz + 10.03, 0, { bg: "#1a2a3a", fg: "#ffffff" });
  const railM = M(0xe8ecf0, { metal: 0.6 });
  w.fence(sx0, sz - 9.9, sx1, sz - 9.9, 1.1, railM, { y: deck }); w.fence(sx0, sz + 9.9, -57, sz + 9.9, 1.1, railM, { y: deck }); w.fence(-53, sz + 9.9, sx1, sz + 9.9, 1.1, railM, { y: deck });
  for (let x = sx0 + 22; x < sx1 - 6; x += 9) for (const zz of [-5.5, 5.5]) { const n = 1 + ((x | 0) % 2); for (let q = 0; q < n; q++) w.box(6.5, 2.6, 5, M(conts[((x | 0) + q + (zz > 0 ? 2 : 0)) % 6 < 0 ? 0 : ((x | 0) * 7 + q + (zz > 0 ? 2 : 0)) % 6], { metal: 0.3, rough: 0.6 }), x, deck + 1.3 + q * 2.6, sz + zz); }
  const bridgeM = M("facade", { args: [57, [236, 236, 230], 4, 3, { lit: 0.6, glow: "#ffe8b0", glass: "#2a3a4a" }], ei: 0.8 });
  w.box(12, 9, 16, bridgeM, sx0 + 8, deck + 4.5, sz);
  w.box(13, 0.4, 17, M(0x2a2e34), sx0 + 8, deck + 9.2, sz);
  w.cyl(0.8, 1, 5, M(0xd83a3a), sx0 + 6, deck + 11.5, sz, { seg: 12 });
  // the gangway from the quay up to the deck
  w.ramp(2.4, 11, deck - TOP, M("metal", { args: [9, [140, 150, 160]], repeat: [1, 4] }), -55, TOP, -2.5, Math.PI);
  // searchlight posts along the deck
  for (let x = sx0 + 20; x < sx1; x += 18) w.lamp(x, sz - 9.7, 4, 0xfff0c0, { y: deck, ei: 3 });

  // ---- the junks: three red-sail boats sailing loops round the harbour
  const sail = M(0xc83a2a, { rough: 0.8, side: THREE.DoubleSide }), wood = M("wood", { args: [8, [110, 70, 44]], repeat: [1, 3] });
  const junks = [];
  const junk = (loop, phase) => {
    const [cx, cz, rx, rz, T] = loop;
    const fn = t => { const a = phase + t * Math.PI * 2 / T, x = cx + Math.cos(a) * rx, z = cz + Math.sin(a) * rz; const tx = -Math.sin(a) * rx, tz = Math.cos(a) * rz; return [x, 0.75, z, Math.atan2(tx, tz)]; };
    const m = w.platform(5, 1.1, 14, wood, ...fn(0).slice(0, 3), fn);
    // hull sides, a raised stern deck, two masts with batten sails
    const add = (geo, mat, x, y, z) => { const e = new THREE.Mesh(geo, mat); e.position.set(x, y, z); e.castShadow = true; e.userData.dynamic = true; m.add(e); return e; };
    add(new THREE.BoxGeometry(5.3, 1.2, 14.3), M(0x5a3420), 0, -0.4, 0);
    for (const [z, ht] of [[1.5, 9], [-2.5, 7]]) {
      add(new THREE.CylinderGeometry(0.12, 0.16, ht, 8), wood, 0, ht / 2 + 0.5, z);
      const sl = add(new THREE.PlaneGeometry(ht * 0.55, ht * 0.7, 1, 5), sail, 0, ht * 0.55 + 0.5, z - 0.1); sl.rotation.y = Math.PI / 2;
      for (let i = 1; i < 5; i++) add(new THREE.BoxGeometry(0.06, 0.06, ht * 0.56), wood, 0.05, ht * 0.2 + 0.5 + i * ht * 0.14, z - 0.1);
    }
    junks.push({ m, fn });
    return m;
  };
  // (each loop passes close by somewhere to jump aboard: the pier's end, the ferry pier's end, the
  // pier's side; the loops never cross)
  const J = [junk([0, -41, 20, 12, 70], Math.PI / 2 + 0.3), junk([42, -34.1, 16, 14.2, 80], 1.2), junk([-20, -15, 14.1, 8, 60], -1)];

  // ---- the harbour's life: gulls, a shoal under the pier
  school(w, 0, 16, -30, 16, 10, 0xf4f4f4);
  school(w, 4, -3, -16, 30, 3, 0x9ab0c0);
  w.floorY = -30;

  const on = (m, x, y, z) => ({ obj: m, off: [x, y, z] });
  w.missionData = {
    hk1: { cells: [on(J[0], 0, 1.4, 4), on(J[0], 0, 1.4, -4.5), on(J[1], 1.2, 1.4, 3), on(J[1], -1, 1.4, -4.5), on(J[2], -1, 1.4, 2), on(J[2], 0, 1.4, -4.5), [44.5, 4.3, -10], [0, TOP + 0.9, -24.5]] },
    hk2: { start: [-55, deck, -15], goal: [sx0 + 16, deck, sz], guards: [{ path: [[-62, -15], [-110, -15]], speed: 1.6, y: deck }, { path: [[-86.5, -23.5], [-86.5, -6.5]], speed: 1.2, phase: 0.5, y: deck }, { path: [[-120, -23.5], [-95, -23.5]], speed: 1.3, phase: 0.2, y: deck }] },
    hk3: { word: "MALDIVES", title: "RADIO ROOM" },
    hk4: { title: "CONTAINER LOCK" },
    hk5: { rings: [[0, 14, -18, 2.4], [30, 22, -30, 2.4], [58, 30, -10, 2.4], [66, 36, 16, 2.4], [40, 42, 42.5, 2.4], [10, 50, 42.5, 2.4], [-20, 56, 42.5, 2.4]], ceiling: 110 },
    hk6: { ride: "jetski", exit: [36, TOP + 0.1, -12], path: [[20, -30], [60, -45], [90, -80], [60, -120], [0, -110], [-50, -100], [-80, -60], [-40, -34]] },
  };
  return {
    spawn: [10, TOP, 6], yaw: Math.PI, bolt: [12, TOP, 6], contact: [6, TOP, 4, Math.PI * 0.8],
    at: { hk1: [0, -12], hk2: [-55, 3], hk3: [sx0 + 16, sz + 5], hk4: [-34, 6], hk5: [20, 10], hk6: [36, -8] },
  };
}
