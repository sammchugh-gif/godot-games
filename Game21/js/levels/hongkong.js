// Hong Kong harbour at night: neon towers along the shore, the old market
// with its rooftops, a container quay with Undertow's ship alongside, junks
// with red sails, ferries, and the lights of Kowloon across the water.
import * as THREE from "three";
import { M, TEX } from "../tex.js";
import { shoreProfile, bollard, container, crateStack, cargoShip, mooredBoat, buoy, fish, lampAt, palmAt } from "../seakit.js";

function neon(w, text, x, y, z, ry, color, o = {}) {
  const tex = TEX.sign(text, { bg: "#07070c", fg: color, w: 512, h: Math.round(512 * (o.h || 1) / (o.w || 4)), border: color, font: "system-ui, sans-serif", weight: 900 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 4, o.h || 1), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: o.ei ?? 2.2, roughness: 0.5 }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; w.scene.add(m);
  return m;
}
function ferry(w, path, speed, phase, color = 0x2a8a4a) {
  const g = new THREE.Group(); w.scene.add(g);
  const hull = M(color, { rough: 0.4 }), cream = M(0xf0e8d0, { rough: 0.5 });
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(5, 1.2, 12), hull, 0, -0.6, 0); add(new THREE.BoxGeometry(3.6, 2, 6), cream, 0, 1.2, 0); add(new THREE.BoxGeometry(4, 0.2, 6.6), hull, 0, 2.3, 0);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.05, 0.6, 0.8), M(0xffe0a0, { emissive: 0xffe0a0, ei: 1.2 }), 1.82, 1.3, -2.2 + i * 1.1);
  g.traverse(n => { n.userData.dynamic = true; });
  const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0, z)), true), len = curve.getLength();
  w.updaters.push((dt, t) => { const u = (((t + phase) * speed) % len) / len, p = curve.getPointAt(u), tg = curve.getTangentAt(u); g.position.set(p.x, w.sea ? w.sea.height(p.x, p.z) : 0, p.z); g.rotation.y = Math.atan2(tg.x, tg.z); });
}

export function buildHongKong(w) {
  w.setSky("night");
  w.scene.userData.envI = 0.25;
  const LAND = 2.0;
  const f = (x, z) => {
    let h = shoreProfile(z + 10, { land: LAND, beach: 4, depth: -12, slope: 22, water: 0.3 });
    if (x > 14 && x < 60 && z > -34 && z < 14) h = LAND; // the quay pushes out into the harbour
    if (z > 100) h = shoreProfile(120 - z, { land: LAND, beach: 6, depth: -12, slope: 22, water: 0.3 }); // Kowloon
    if (z < -60) h += (-60 - z) * 0.35 + Math.sin(x * 0.06) * 3;
    return h;
  };
  w.terrain(400, 160, f, M("asphalt", { args: [101], repeat: [60, 60] }));
  w.ocean({ level: 0, box: [0, 30, 260, 260], shallow: 0x1a5a6a, deep: 0x06182a, under: 0x0a2a3a, see: 22, foam: 0.6 });
  // the shore: pavement, the quay, the ship
  const pave = M("paving", { args: [103, [120, 118, 116], 32], repeat: [30, 6] }), conc = M("paving", { args: [104, [140, 140, 136], 64], repeat: [10, 10] });
  w.box(200, 0.2, 40, pave, 0, LAND + 0.1, -30, { collide: false });
  w.box(46, 0.2, 48, conc, 37, LAND + 0.1, -10, { collide: false });
  w.box(46, 2.4, 0.5, M(0x4a4a50), 37, LAND - 1.2, 14, { collide: false }); w.box(0.5, 2.4, 48, M(0x4a4a50), 60, LAND - 1.2, -10, { collide: false });
  for (let z = -30; z <= 12; z += 7) bollard(w, 59, LAND, z);
  for (let x = 16; x <= 58; x += 7) bollard(w, x, LAND, 13);
  cargoShip(w, 72, 0, -6, 0, { len: 64, wid: 14, color: 0x8a1a2a });
  w.sign("UNDERTOW LINES", 8, 1.2, 64.9, 4.2, -6, -Math.PI / 2, { bg: "#3a0a14", fg: "#ff5a6a", glow: 1.2 });
  // the container yard
  const cols = [0xd83a2a, 0x2a6ad8, 0x3aa84a, 0xffd23f, 0x8a3ad8, 0xf0f0f0];
  const yard = [[20, -28, 0], [26, -28, 0], [32, -28, 0], [38, -28, 0], [44, -28, 0], [50, -28, 0], [20, -16, 0], [32, -16, 0], [44, -16, 0], [26, -4, 0], [38, -4, 0], [50, -4, 0], [20, 6, 0], [32, 6, 0], [44, 6, 0], [54, -16, 0]];
  yard.forEach(([x, z, ry], i) => container(w, x, LAND, z, ry, cols[i % 6]));
  for (const [x, z] of [[17, -24], [57, -24], [17, 0], [57, 0], [42, -10]]) lampAt(w, x, z, 5, 0xffe0a0, { ei: 3 });
  w.building(6, 4, 6, 40, -32, { wall: [210, 210, 214], seed: 105, roof: "flat", win: { lit: 0.8, glow: "#ffe6a8" }, ei: 1.4, y: LAND });
  w.sign("YARD OFFICE", 4, 0.8, 40, LAND + 3.2, -28.94, 0, { bg: "#1a2440", fg: "#ffffff", glow: 0.8 });
  crateStack(w, 16, LAND, -8, 3); crateStack(w, 56, LAND, 8, 2);
  // the city: towers along the shore road, lit up
  const B = [[12, 44, 12, -20, -52, "#c8ccd4", "HK NOODLES", "#ff5a5a"], [14, 60, 14, -38, -50, "#b8c0cc", null], [10, 36, 12, -54, -54, "#d0c8c0", "DIM SUM", "#ffd166"], [12, 50, 12, 2, -56, "#c8d0dc", "STAR", "#5ae8ff"], [16, 70, 16, 20, -58, "#b0b8c8", null], [12, 40, 12, 40, -54, "#d8d0c8", "TEA", "#7bed9f"], [10, 30, 10, 58, -50, "#c8c0b8", null], [14, 56, 14, -70, -50, "#a8b0c0", "NEON", "#ff5ad8"], [12, 34, 12, 76, -52, "#d0c8c8", null], [10, 28, 10, -20, -76, "#c0c8d0", null], [12, 66, 12, 8, -80, "#b8c4d0", null], [14, 48, 14, 48, -78, "#c8c8d0", null]];
  for (const [bw, bh, bd, x, z, wall, sign, col] of B) {
    const hex = parseInt(wall.slice(1), 16), rgb = [hex >> 16, (hex >> 8) & 255, hex & 255];
    w.building(bw, bh, bd, x, z, { wall: rgb, seed: Math.abs(x * 3 + z), win: { lit: 0.6, glow: "#ffe6a8", glass: "#1a2230" }, ei: 1.3, trim: 0x3a3a40, y: LAND });
    if (sign) neon(w, sign, x, LAND + bh * 0.5, z + bd / 2 + 0.06, 0, col, { w: bw * 0.7, h: 2 });
  }
  // the old market: a low building with stairs up its side, pads across the rooftops, a neon sign
  const mkt = M("metal", { args: [107, [90, 70, 110]], repeat: [3, 1] });
  w.box(16, 6, 12, mkt, -24, LAND + 3, -20);
  neon(w, "MARKET", -24, LAND + 4.6, -13.94, 0, "#ff5ad8", { w: 8, h: 1.8, ei: 3 });
  w.steps(18, 2.4, 0.34, 0.6, M("metal", { args: [26], repeat: [1, 1] }), -33.4, LAND, -14, Math.PI);
  w.box(6, 9, 6, mkt, -12, LAND + 4.5, -22); w.box(8, 10, 8, mkt, -26, LAND + 5, -32);
  w.pad(-16.5, LAND + 6.05, -21, 12, 0xff5ad8); w.pad(-25, LAND + 6.05, -25.2, 13, 0x7bed9f);
  for (const [x, z] of [[-30, -12], [-16, -12], [-2, -12], [10, -12], [-44, -12], [-60, -12]]) lampAt(w, x, z, 4.4, 0xfff0d0, { ei: 5 });
  for (const [x, z, c] of [[-10, -12, 0xff5ad8], [-40, -14, 0x5ae8ff], [30, -12, 0xffd166], [4, -20, 0x7bed9f]]) { const l = new THREE.PointLight(c, 18, 30, 1.8); l.position.set(x, LAND + 6, z); w.scene.add(l); }
  for (const [x, z] of [[-50, -14], [-56, -16]]) palmAt(w, x, z, 6);
  // the pier and the junks, the ferries crossing to Kowloon
  w.box(4, 0.4, 20, M("wood", { args: [109, [130, 96, 62]], repeat: [1, 5] }), -60, LAND - 0.2, 0);
  mooredBoat(w, "junk", -70, 10, 0.4); mooredBoat(w, "junk", -50, 14, -0.5, { color: 0x6a3a1a }); mooredBoat(w, "junk", -52, 34, 2.8);
  mooredBoat(w, "speedboat", -64, -2, 0.1, { color: 0xf0f0e0 });
  ferry(w, [[-30, 30], [10, 60], [40, 90], [0, 100], [-40, 70]], 4, 0); ferry(w, [[20, 40], [60, 60], [50, 96], [10, 80]], 3.5, 30, 0x2a6a8a);
  buoy(w, 0, 30); buoy(w, -30, 50, 0xffd23f); buoy(w, 40, 40, 0x7bed9f);
  // Kowloon across the water
  for (let i = 0; i < 16; i++) w.building(12, 20 + (i * 17) % 50, 12, -110 + i * 15, 130 + (i % 3) * 12, { wall: [170 + (i % 3) * 20, 180, 200], seed: 110 + i, win: { lit: 0.7, glow: "#ffe6a8", glass: "#1a2230" }, ei: 1.5, trim: 0x3a3a40, y: LAND });
  fish(w, 0, -4, 40, 8, 26, 0x9ad8ff);
  w.floorY = -30;
  w.missionData = {
    hk1: { start: [20, LAND, 10], goal: [40, LAND, -24], range: 8, guards: [{ path: [[22, -22], [50, -22]], speed: 1.8, pause: 1.4 }, { path: [[50, -10], [22, -10]], speed: 1.6, pause: 1.3, phase: 6 }, { path: [[36, 2], [36, -30]], speed: 1.5, pause: 1.6, phase: 10 }],
      route: [[23, LAND, 8], [23, LAND, 0], [29, LAND, -10], [29, LAND, -22], [40, LAND, -24]] },
    hk2: { cells: [[-24, LAND + 7.1, -20], [-30, LAND + 7.1, -24], [-18, LAND + 7.1, -16], [-12, LAND + 10.1, -22], [-10, LAND + 10.1, -24], [-25, LAND + 11.1, -29.5], [-27, LAND + 11.1, -29], [-24, 1.4, -11], [-33.4, LAND + 3.8, -19]] },
    hk3: { title: "SHIP'S LOCK" },
    hk4: { boat: "speedboat", quarry: "junk", lead: 32, exit: [-6, LAND, -8.5, 0], path: [[-8, 2], [-20, 24], [-40, 40], [-30, 66], [0, 80], [30, 70], [50, 46], [40, 22], [16, 24], [4, 14]] },
    hk5: { things: [["container", 22, LAND, -6, 0.1, 0x8a3ad8], ["crate", 16, LAND, 0, 0.3, 0xb08850], ["container", 30, LAND, 8, -0.2, 0xffd23f], ["barrel", 14, LAND, -4, 0], ["case", 26, LAND, 2, 0.6], ["container", 44, LAND, 0, 0.2, 0x3aa84a]] },
    hk6: { title: "HARBOUR LIGHTS", word: "MALE" },
  };
  return { spawn: [0, LAND, -18], yaw: 0, bolt: [2, LAND, -18], contact: [-4, LAND, -16, 2.4] };
}
