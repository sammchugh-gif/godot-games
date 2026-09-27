// The Panama Canal: three lock chambers between the jungle banks, running
// dry, with the Coral Queen stuck in the middle. Lock walls to run along, a
// control tower in a guarded yard, the canal road round the east bank, and the
// mules that haul the ship through.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, shed, bollard, lampAt, treeAt, crateStack, container, buoy, gulls, fish } from "../seakit.js";

function lockGate(w, z, open, conc) {
  // a pair of mitre gate leaves; open ones lie back along the walls
  for (const s of [-1, 1]) {
    const x = open ? s * 6.5 : s * 3.6, ry = open ? 0 : s * 0.55;
    w.box(0.8, 5.2, 9.5, conc, x, 2.9, z + (open ? 4.5 : 3.5), { ry });
  }
}
function ship(w, path, dwell) {
  // the Coral Queen: a container ship pulled along the canal, a deck you can ride
  const g = new THREE.Group(); w.scene.add(g);
  const hull = M(0x2a4a8a, { rough: 0.5, metal: 0.2 }), white = M(0xf0f0f0, { rough: 0.5 }), deck = M("metal", { args: [51, [110, 116, 124]], repeat: [4, 12] });
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  // (the group's origin is the middle of the hull, so the mover's box matches it: the deck is 2.5 up)
  add(new THREE.BoxGeometry(11, 5, 38), hull, 0, 0, 0);
  add(new THREE.BoxGeometry(11.2, 0.2, 38.2), deck, 0, 2.6, 0);
  const bow = add(new THREE.ConeGeometry(5.5, 8, 4), hull, 0, 0, 23); bow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bow.scale.set(1, 1, 5 / 5.5);
  add(new THREE.BoxGeometry(8, 6, 6), white, 0, 5.5, -14);
  add(new THREE.BoxGeometry(8.2, 1.2, 6.2), M(0x1a3050, { rough: 0.1, metal: 0.6, emissive: 0xffe0a0, ei: 0.4 }), 0, 8.1, -14);
  add(new THREE.CylinderGeometry(0.9, 1.1, 4, 12), M(0xd83a2a), 0, 10.5, -16);
  for (let i = 0; i < 3; i++) for (const c of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 6), M([0xd83a2a, 0x3aa84a, 0xffd23f][i], { rough: 0.6 })); m.position.set(c * 2.9, 3.8, 12 - i * 7); m.castShadow = true; g.add(m); }
  const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0, z)), false);
  const len = curve.getLength(), T = len / 3 + dwell;
  const fn = t => { const s = ((t % (2 * T)) + 2 * T) % (2 * T), fwd = s < T, u0 = fwd ? s : s - T; const u = Math.min(0.9999, Math.max(0, (u0 - dwell / 2) * 3 / len)); const uu = fwd ? u : 1 - u; const p = curve.getPointAt(uu); return [p.x, 3.0, p.z, 0]; };
  g.position.set(path[0][0], 3.0, path[0][1]);
  w.phys.mover(g, 5.5, 2.5, 19, fn);
  return { g, fn };
}

export function buildPanama(w) {
  w.setSky("tropical");
  const LAND = 4, FLOOR = 0.5, TOP = 4.4;
  const f = (x, z) => {
    if (Math.abs(x) < 8 && z > -42 && z < 32) return FLOOR;
    if (z > 34) return shoreProfile(z - 34, { land: LAND, beach: 6, depth: -10, slope: 24, water: 0.3 });
    if (z < -44) return shoreProfile(-44 - z, { land: LAND, beach: 6, depth: -8, slope: 24, water: 0.3 });
    let h = LAND;
    if (Math.abs(x) > 70) h += (Math.abs(x) - 70) * 0.3 + Math.sin(z * 0.1) * 2;
    return h;
  };
  w.terrain(400, 160, f, M("grass", { args: [53, [70, 120, 50]], repeat: [50, 50], normal: 0.6 }));
  w.mountains(14, 240, 60, { seed: 14, snow: false, color: 0x4a6a4a });
  w.ocean({ level: 0, box: [0, 0, 260, 260], shallow: 0x3aa890, deep: 0x0a4a5a, under: 0x0e5a5a, see: 26 });
  // the chambers: a concrete floor, walls either side, gates between
  const conc = M("paving", { args: [55, [170, 168, 160], 64], repeat: [10, 2] });
  w.box(16, 0.3, 74, conc, 0, FLOOR - 0.1, -5, { collide: false });
  for (const s of [-1, 1]) { w.box(4, TOP, 76, conc, s * 9, TOP / 2, -5); for (let z = -38; z <= 28; z += 8) bollard(w, s * 10, TOP, z); }
  for (const s of [-1, 1]) w.box(0.3, 0.06, 76, M(0xffd23f), s * 7.3, TOP + 0.03, -5, { collide: false });
  lockGate(w, -30, false, conc); lockGate(w, -8, true, conc); lockGate(w, 14, true, conc);
  // the mule rails and a mule on each wall
  const steel = M(0x3a4048, { metal: 0.7, rough: 0.4 });
  for (const s of [-1, 1]) { w.box(0.2, 0.15, 74, steel, s * 8, TOP + 0.08, -5, { collide: false }); const mule = w.box(1.6, 1.4, 3, M(0xe8a020, { metal: 0.4 }), s * 8, TOP + 0.7, 4, { collide: false }); mule.userData.dynamic = true; w.updaters.push((dt, t) => { mule.position.z = 4 + Math.sin(t * 0.12) * 30; }); }
  // the ship, hauled up and down the canal
  const sh = ship(w, [[0, 40], [0, 8], [0, -22]], 10);
  // the banks: the control tower and its yard on the west, the road and sheds on the east
  w.building(8, 16, 8, -30, -30, { wall: [230, 232, 236], seed: 57, win: { lit: 0.4, glass: "#3a6a9a" }, trim: 0x8a9098 });
  w.sign("CANAL CONTROL", 6, 1, -30, 12, -25.9, 0, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1 });
  const wall = M("brick", { args: [59, [180, 170, 150], [160, 150, 130]], repeat: [4, 1] });
  w.box(30, 2.6, 0.5, wall, -30, LAND + 1.3, -44); w.box(0.5, 2.6, 28, wall, -45, LAND + 1.3, -30); w.box(0.5, 2.6, 10, wall, -15, LAND + 1.3, -39); w.box(0.5, 2.6, 8, wall, -15, LAND + 1.3, -21);
  crateStack(w, -24, LAND, -36, 3); crateStack(w, -36, LAND, -36, 2); crateStack(w, -24, LAND, -30, 2);
  container(w, -20, LAND, -34, 0.3, 0xd83a2a);
  for (const [x, z] of [[-20, -18], [-42, -20], [-42, -42], [-20, -42]]) lampAt(w, x, z, 4.2, 0xffe0a0);
  shed(w, 36, 32, 10, 5, 8, -Math.PI / 2, { wall: [220, 210, 190], seed: 61, roofColor: [120, 60, 50], sign: "PILOTS", bg: "#1a2440", y: LAND });
  shed(w, 44, -20, 12, 6, 10, 0, { wall: [200, 196, 190], seed: 62, roofColor: [80, 80, 90], y: LAND });
  // the canal road: a loop of asphalt round the east bank
  const road = [[24, -40], [40, -46], [58, -40], [64, -20], [58, 0], [62, 20], [50, 30], [34, 24], [26, 4], [22, -16]];
  const asphalt = M("asphalt", { args: [63], repeat: [1, 4] });
  for (let i = 0; i < road.length; i++) { const a = road[i], b = road[(i + 1) % road.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = Math.atan2(b[0] - a[0], b[1] - a[1]); w.box(6, 0.06, len + 2, asphalt, (a[0] + b[0]) / 2, LAND + 0.03, (a[1] + b[1]) / 2, { ry, collide: false }); }
  // jungle
  for (let i = 0; i < 26; i++) { const a = i * 1.7, x = 42 + Math.cos(a) * (22 + (i % 5) * 4), z = -8 + Math.sin(a) * (26 + (i % 3) * 5); if (Math.abs(x) > 16) treeAt(w, x, z, 7 + (i % 3) * 2, { color: [0x2a7a3a, 0x3a9a4a, 0x1a6a2a][i % 3] }); }
  for (let i = 0; i < 16; i++) { const x = -60 - (i % 4) * 8, z = -50 + i * 6; treeAt(w, x, z, 8 + (i % 3) * 2, { color: 0x2a8a3a }); }
  for (let i = 0; i < 10; i++) w.palm(-22 - (i % 3) * 6, 4 + i * 4, 7);
  for (const [x, z] of [[14, 40], [-14, 40], [14, -50], [-14, -50]]) lampAt(w, x, z, 4.2, 0xffe0a0);
  buoy(w, 0, 60); buoy(w, 12, 70, 0xffd23f); buoy(w, -6, -66, 0x7bed9f);
  fish(w, 0, -4, 66, 8, 24, 0x9ad8ff); gulls(w, 0, 20, 30, 4);
  w.floorY = -30;
  const D = sh.g;
  w.missionData = {
    pn1: { title: "LOCK CODES" },
    pn2: { cells: [{ obj: D, off: [0, 3.4, 18] }, { obj: D, off: [0, 3.4, 4] }, { obj: D, off: [-4, 3.4, -6] }, { obj: D, off: [4, 3.4, -10] }, { obj: D, off: [0, 3.4, 16] }, { obj: D, off: [-4, 3.4, 8] }, [9, TOP + 1.1, -20], [-9, TOP + 1.1, 12]] },
    pn3: { pad: [26, LAND, 14], padR: 1.8, blocks: [[20, LAND + 0.66, 18], [32, LAND + 0.66, 10], [30, LAND + 0.66, 20], [22, LAND + 0.66, 8]] },
    pn4: { start: [-18, LAND, -18], goal: [-42, LAND, -30], range: 8, guards: [{ path: [[-42, -22], [-18, -22]], speed: 1.7, pause: 1.3 }, { path: [[-18, -40], [-42, -40]], speed: 1.6, pause: 1.3, phase: 5 }, { path: [[-38, -22], [-38, -40]], speed: 1.4, pause: 1.6, phase: 9 }],
      route: [[-18, LAND, -18], [-24, LAND, -18], [-30, LAND, -18], [-36, LAND, -20], [-42, LAND, -24], [-42, LAND, -30]] },
    pn5: { path: road, car: "jeep", quarry: "jeep", y: 0.2, lead: 30 },
    pn6: { title: "FILL THE LOCKS" },
  };
  return { spawn: [9, TOP, 12], yaw: 0, bolt: [10.5, TOP, 13], contact: [9, TOP, 8, 2.6] };
}
