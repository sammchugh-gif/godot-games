// Sydney Harbour: the Opera House with its roof floating off, the Harbour
// Bridge, ferries hovering above the water, a beach, and Zero's warehouse.
import * as THREE from "three";
import { M } from "../tex.js";

function sail(w, parent, x, z, s, ry, tilt) {
  // one shell of the roof: a slice of a dome, tall and thin, with white tiles
  const geo = new THREE.SphereGeometry(1, 28, 16, 0, Math.PI, 0, Math.PI / 2);
  const m = new THREE.Mesh(geo, M("tiles", { args: [61, [244, 240, 228], [228, 222, 206], 16], repeat: [4, 2], rough: 0.35, side: THREE.DoubleSide }));
  m.scale.set(s * 0.55, s * 1.25, s); m.position.set(x, 0, z); m.rotation.set(tilt, ry, 0);
  m.castShadow = true; parent.add(m);
  return m;
}
function operaHouse(w, x, z) {
  const podium = M("stone", { args: [63, [214, 190, 160]], repeat: [4, 1] });
  w.box(34, 2, 26, podium, x, 1, z);
  w.steps(6, 14, 0.334, 0.75, podium, x, 0.2, z + 17.5, Math.PI);
  // the shells, floating a little off the podium
  const roof = new THREE.Group(); roof.position.set(x, 2, z); w.scene.add(roof);
  for (const [dx, dz, s] of [[-7, 6, 10], [-7, -1, 12], [-7, -8, 9], [7, 6, 8.5], [7, -1, 10.5], [7, -8, 7.5], [0, 10, 5]]) sail(w, roof, dx, dz, s, 0, -0.35);
  const glass = M(0x1a3050, { rough: 0.05, metal: 0.8, emissive: 0xffd8a0, ei: 0.2 });
  w.box(26, 5, 20, glass, x, 4.5, z, { collide: true });
  w.updaters.push((dt, t) => { roof.position.y = 5 + Math.sin(t * 0.8) * 0.6; roof.rotation.z = Math.sin(t * 0.5) * 0.02; });
}
function bridge(w, z) {
  const steel = M(0x6a7482, { rough: 0.45, metal: 0.7 }), stone = M("stone", { args: [65, [200, 186, 160]], repeat: [2, 3] });
  const span = 150, rise = 34, deck = 14;
  w.box(span + 40, 1.4, 12, M(0x3a3e46, { rough: 0.8 }), 0, deck, z, { collide: false });
  for (const sx of [-1, 1]) { w.box(10, 30, 12, stone, sx * (span / 2 + 6), 15, z, { collide: false }); w.box(7, 6, 9, stone, sx * (span / 2 + 6), 33, z, { collide: false }); }
  for (const dz of [-5, 5]) {
    const pts = []; for (let i = 0; i <= 40; i++) { const f = i / 40, x = -span / 2 + f * span; pts.push(new THREE.Vector3(x, deck - 6 + Math.sin(f * Math.PI) * rise, z + dz)); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 1.1, 8), steel); tube.castShadow = true; w.scene.add(tube);
    const pts2 = pts.map(p => p.clone().setY(p.y - 5 * Math.sin((p.x / span + 0.5) * Math.PI) - 1));
    const tube2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 60, 0.6, 8), steel); w.scene.add(tube2);
    for (let i = 2; i < 40; i += 2) { const a = pts[i], b = new THREE.Vector3(a.x, Math.max(deck, pts2[i].y), a.z); if (a.y - deck < 1) continue; const h = a.y - deck; const v = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 0.4), steel); v.position.set(a.x, deck + h / 2, a.z); w.scene.add(v); void b; }
  }
  // flags on the top
  for (const x of [-4, 4]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), M(0x2a4ab0, { side: THREE.DoubleSide })); f.position.set(x, deck - 6 + rise + 3, z); f.userData.dynamic = true; w.scene.add(f); w.updaters.push((dt, t) => { f.rotation.y = Math.sin(t * 3 + x) * 0.3; }); }
}
function ferry(w, path, speed, phase, color = 0x2a8a4a, dwell = 8) {
  // a green and cream harbour ferry, hovering above the water, that you can ride; it waits
  // alongside its wharf (the first point of its loop) for a few seconds every trip
  const g = new THREE.Group(); w.scene.add(g);
  const hull = M(color, { rough: 0.4 }), cream = M(0xf0e8d0, { rough: 0.5 }), trim = M(0xf0c020, { rough: 0.5 }), deckM = M("wood", { args: [67, [150, 110, 70]], repeat: [2, 1] });
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(5, 1.2, 12), hull, 0, -0.6, 0);
  add(new THREE.BoxGeometry(5.1, 0.25, 12.1), trim, 0, 0, 0);
  const cab = add(new THREE.BoxGeometry(3.6, 2, 6), cream, 0, 1.2, 0); void cab;
  add(new THREE.BoxGeometry(4, 0.2, 6.6), hull, 0, 2.3, 0);
  add(new THREE.BoxGeometry(4.9, 0.1, 11.9), deckM, 0, 0.1, 0);
  for (let i = 0; i < 5; i++) { add(new THREE.BoxGeometry(0.05, 0.6, 0.8), M(0x2a3a4a, { rough: 0.1, metal: 0.6 }), 1.82, 1.3, -2.2 + i * 1.1); add(new THREE.BoxGeometry(0.05, 0.6, 0.8), M(0x2a3a4a, { rough: 0.1, metal: 0.6 }), -1.82, 1.3, -2.2 + i * 1.1); }
  const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0, z)), true);
  const len = curve.getLength();
  g.position.copy(curve.getPointAt(0));
  const T = len / speed + dwell;
  const fn = t => { const s = (((t + phase) % T) + T) % T, u = s < dwell ? 0 : Math.min(0.9999, (s - dwell) * speed / len); const p = curve.getPointAt(u), tg = curve.getTangentAt(u); return [p.x, 0.9 + Math.sin(t * 1.2 + phase) * 0.15, p.z, Math.atan2(tg.x, tg.z)]; };
  // the deck and the cabin roof are both platforms
  w.phys.mover(g, 2.5, 0.2, 6, fn);
  const roof = new THREE.Object3D(); w.scene.add(roof);
  w.phys.mover(roof, 2, 0.1, 3.3, t => { const [x, y, z, ry] = fn(t); return [x, y + 2.3, z, ry]; });
  return { g, fn };
}

export function buildSydney(w) {
  w.setSky("tropical");
  w.water(700, 700, 0, -0.35, 0, 0x1a78b8, { opacity: 0.95 });
  w.phys.fixedBox(0, -6, 0, 400, 1, 400);
  w.floorY = -3;
  // the quay: paving on a raised shore, and the beach to the east
  const pave = M("paving", { args: [69, [200, 196, 188], 48], repeat: [16, 12] });
  w.box(70, 1, 70, pave, -5, -0.3, 5);
  w.box(32, 0.9, 40, M("sand", { args: [71, [236, 214, 168]], repeat: [8, 10] }), 46, -0.35, 12);
  for (const x of [-22, 0, 20]) w.box(4, 1, 16, M("wood", { args: [73, [130, 96, 62]], repeat: [1, 4] }), x, -0.3, 47);
  // hills and houses across the water
  for (let i = 0; i < 20; i++) { const x = -180 + i * 19, z = -140 - (i % 3) * 12, h = 6 + (i * 7) % 18; w.mesh(new THREE.BoxGeometry(10, h, 8), M("facade", { args: [70 + i, [230 - (i % 4) * 14, 220 - (i % 3) * 10, 200], 3, Math.max(2, Math.round(h / 3.4))] }), x, h / 2, z, { cast: false }); }
  w.mesh(new THREE.BoxGeometry(400, 4, 40), M("grass", { args: [75, [80, 130, 70]], repeat: [30, 3] }), 0, 0, -150, { cast: false });
  operaHouse(w, -18, -20);
  bridge(w, -78);
  // the city skyline across the harbour, beyond the ferry loops, on its own shore
  w.box(170, 1, 34, M("paving", { args: [81, [190, 186, 178], 48], repeat: [20, 4] }), -4, -0.3, 133);
  for (let i = 0; i < 9; i++) w.building(10, 20 + (i * 13) % 30, 10, -60 + i * 14, 126 + (i % 2) * 12, { wall: [180 + (i % 3) * 20, 196, 210], seed: 80 + i, win: { lit: 0.2, glass: "#6a9ac8" }, trim: 0x8a9098 });
  // the quay front: lamps, palms, benches
  for (let x = -36; x <= 26; x += 10) w.lamp(x, 38, 4.2, 0xfff0d0);
  for (const [x, z] of [[-34, 30], [-26, 34], [10, 34], [26, 30], [34, 4], [58, 26], [60, 4]]) w.palm(x, z, 8);
  for (const [x, z, ry] of [[-10, 26, 0], [4, 26, 0], [-30, 12, Math.PI / 2]]) w.bench(x, z, ry);
  // ferries looping between the wharves and the point
  const ferries = [
    // each loop starts broadside to the end of a wharf, with a step's gap between deck and planks
    ferry(w, [[-22, 57.8], [-42, 64], [-40, 82], [-10, 95], [8, 66]], 3.2, 0, 0x2a8a4a),
    ferry(w, [[0, 57.8], [26, 66], [50, 62], [36, 82], [-18, 70]], 3.6, 14, 0x2a6a8a),
    ferry(w, [[20, 57.8], [40, 70], [44, 92], [0, 104], [-6, 72]], 3.0, 29, 0x8a3a2a),
  ];
  w.ferries = ferries;
  // Zero's warehouse: a walled yard of crates behind the quay
  const wall = M("brick", { args: [77, [150, 70, 50], [130, 60, 44]], repeat: [4, 1] });
  const wx0 = 12, wx1 = 32, wz0 = -24, wz1 = -4;
  w.box(wx1 - wx0, 3.2, 0.6, wall, (wx0 + wx1) / 2, 1.8, wz0);
  w.box(0.6, 3.2, wz1 - wz0, wall, wx0, 1.8, (wz0 + wz1) / 2); w.box(0.6, 3.2, wz1 - wz0, wall, wx1, 1.8, (wz0 + wz1) / 2);
  w.box(8, 3.2, 0.6, wall, wx0 + 4, 1.8, wz1); w.box(8, 3.2, 0.6, wall, wx1 - 4, 1.8, wz1);
  w.sign("ZERO SHIPPING", 6, 1.2, 22, 4.2, wz1 + 0.35, 0, { bg: "#2a1030", fg: "#ff9ae8", glow: 1.2 });
  const crate = M("wood", { args: [79, [170, 124, 70]], repeat: [1, 1] });
  for (const [x, z, sx, sz] of [[16.5, -8, 5, 1.6], [27.5, -8, 5, 1.6], [22, -14, 8, 1.6], [16.5, -20, 5, 1.6], [27.5, -20, 5, 1.6]]) w.box(sx, 1.8, sz, crate, x, 1.1, z);
  w.floorY = -3;
  w.missionData = {
    syd1: { things: [["umbrella", 36, 0.1, 8, 0, 0xff6a3a], ["surfboard", 40, 0.1, 14, 0.4, 0x3ad0ff], ["umbrella", 44, 0.1, 20, 0, 0x3a8ad8], ["surfboard", 48, 0.1, 6, -0.3, 0xffd23f], ["umbrella", 52, 0.1, 16, 0, 0xffd23f], ["barrel", 38, 0.1, 24, 0], ["surfboard", 54, 0.1, 24, 1.2, 0xff6ad5], ["umbrella", 34, 0.1, 18, 0, 0x7bed9f]] },
    syd2: { cells: [
      // one cell at each end of each ferry's deck (the cabin roof is for exploring, not required)
      { obj: ferries[0].g, off: [0, 1.3, 4] }, { obj: ferries[0].g, off: [0, 1.3, -4] }, { obj: ferries[1].g, off: [0, 1.3, -4] }, { obj: ferries[1].g, off: [0, 1.3, 4] },
      { obj: ferries[2].g, off: [0, 1.3, 4] }, { obj: ferries[2].g, off: [0, 1.3, -4] }, [-22, 1.3, 54], [20, 1.3, 54]] },
    syd3: { rings: [[-6, 6, 20, 2.4], [-10, 8, 0, 2.4], [-18, 12, -20, 2.4], [-20, 9, -40, 2.4], [-8, 7, -60, 2.6], [4, 7, -78, 3], [16, 24, -78, 3, Math.PI / 2], [28, 12, -64, 2.6, 2], [30, 6, -40, 2.4, 2.8]], ceiling: 60 },
    syd4: { start: [22, 0.2, -1], goal: [22, 0.2, -21.8], range: 8, guards: [{ path: [[14, -11], [30, -11]], speed: 1.7, pause: 1.4 }, { path: [[30, -17], [14, -17]], speed: 1.5, pause: 1.2, phase: 4 }],
      route: [[22, 0.2, -3.5], [16.5, 0.2, -6.2], [16.5, 0.2, -12.4], [22, 0.2, -12.2], [22, 0.2, -15.8], [16.5, 0.2, -18.6], [22, 0.2, -21.8]] },
  };
  return { spawn: [-4, 0.2, 22], yaw: Math.PI, bolt: [-2, 0.2, 21], contact: [-7, 0.2, 19, 2.4] };
}
