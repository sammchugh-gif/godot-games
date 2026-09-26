// The Great Wall: a walkway you can run along, up and down the hills,
// through watchtowers, with red lanterns, a bamboo grove, a temple with a
// gong, and the relay room in the great fort at the end.
import * as THREE from "three";
import { M } from "../tex.js";

function wall(w, pts) {
  // pts: [x, z, topY]; a walkway with parapets on both sides, on a tall base
  const stone = M("stone", { args: [131, [170, 160, 140]], repeat: [3, 1] }), top = M("paving", { args: [133, [150, 142, 128], 48], repeat: [1, 3] }), dark = M("stone", { args: [135, [130, 122, 108]], repeat: [3, 2] });
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0, y0] = pts[i], [x1, z1, y1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), pitch = Math.atan2(y1 - y0, L), len = Math.hypot(L, y1 - y0) + 0.6;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, cy = (y0 + y1) / 2;
    // the walkway: a tilted slab
    const g = new THREE.Group(); g.position.set(cx, cy, cz); g.rotation.set(0, ry, 0); w.scene.add(g);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, len), top); slab.rotation.x = -pitch; slab.position.y = -0.3; slab.receiveShadow = true; slab.castShadow = true; g.add(slab);
    for (const sx of [-2.7, 2.7]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, len), stone); p.rotation.x = -pitch; p.position.set(sx, 0.35, 0); p.castShadow = true; g.add(p);
      for (let k = -len / 2 + 0.6; k < len / 2; k += 1.6) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.6, 0.8), stone); c.position.set(sx, 1.1 + Math.tan(pitch) * k, k); g.add(c); } }
    // the base down to the ground
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.8, Math.max(y0, y1) + 1, L + 0.2), dark); base.position.set(0, -(Math.max(y0, y1) + 1) / 2 - 0.55 - Math.abs(y1 - y0) / 2, 0); base.castShadow = true; g.add(base);
    g.updateMatrixWorld(true);
    // colliders: the slab and the two parapets, tilted
    const q = new THREE.Quaternion(); slab.getWorldQuaternion(q);
    const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
    w.phys.fixedBox(cx, cy - 0.3, cz, 2.5, 0.3, len / 2, ry, { rx: e.x });
    for (const sx of [-2.7, 2.7]) w.phys.fixedBox(cx + Math.cos(ry) * sx, cy + 0.5, cz - Math.sin(ry) * sx, 0.3, 0.8, len / 2, ry, { rx: e.x });
    // the base under it: its top stays below the walkway's lower end, or on a slope it would stick up
    // through the walkway as an invisible step at the bottom of every climb
    const baseTop = Math.min(y0, y1) - 0.7;
    w.phys.fixedBox(cx, baseTop / 2, cz, 2.9, Math.max(0.1, baseTop / 2), L / 2, ry);
    segs.push({ x0, z0, y0, x1, z1, y1, ry });
  }
  return segs;
}
function watchtower(w, x, z, y, ry) {
  // four stout corners and a roof over the walkway, with a lantern
  const stone = M("stone", { args: [137, [178, 168, 150]], repeat: [1, 2] }), roof = M("roof", { args: [139, [60, 70, 80]], repeat: [3, 2] });
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  for (const [sx, sz] of [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.4, 1.4), stone); p.position.set(sx, 2.2, sz); p.castShadow = true; g.add(p); }
  const slab = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.8, 8.4), stone); slab.position.y = 4.6; slab.castShadow = true; g.add(slab);
  const r = new THREE.Mesh(new THREE.ConeGeometry(6.6, 2.6, 4), roof); r.position.y = 6.3; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const lan = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), M(0xe83a2a, { emissive: 0xff3a1a, ei: 2.5 })); lan.position.set(0, 3.4, 3.9); lan.scale.y = 1.3; g.add(lan);
  g.updateMatrixWorld(true);
  for (const [sx, sz] of [[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]]) { const p = new THREE.Vector3(sx, 2.2, sz).applyMatrix4(g.matrixWorld); w.phys.fixedBox(p.x, p.y, p.z, 0.7, 2.2, 0.7, ry); }
  w.phys.fixedBox(x, y + 4.6, z, 4.2, 0.4, 4.2, ry);
}
function pagoda(w, x, z) {
  const red = M(0xc8302a, { rough: 0.5 }), roof = M("roof", { args: [141, [40, 60, 50]], repeat: [4, 2] }), gold = M(0xe8b030, { metal: 0.6, rough: 0.3 });
  w.box(12, 0.8, 12, M("stone", { args: [143, [200, 190, 170]] }), x, 0.4, z);
  for (let i = 0; i < 3; i++) {
    const s = 8 - i * 2, y = 0.8 + i * 3.6;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.cyl(0.25, 0.25, 3, red, x + sx * s * 0.42, y + 1.5, z + sz * s * 0.42, { seg: 10 });
    const r = w.cone(s * 0.95, 1.6, roof, x, y + 3.6, z); r.rotation.y = Math.PI / 4;
  }
  w.cyl(0.08, 0.08, 2.4, gold, x, 12.8, z, { collide: false });
  // the gong on its frame out front
  w.box(0.25, 3, 0.25, red, x - 1.8, 1.5 + 0.8, z + 7.6); w.box(0.25, 3, 0.25, red, x + 1.8, 1.5 + 0.8, z + 7.6); w.box(4, 0.25, 0.25, red, x, 3.9, z + 7.6, { collide: false });
  const gong = w.mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.12, 32), M(0xd8a030, { metal: 0.9, rough: 0.25 }), x, 2.4, z + 7.6, { rx: Math.PI / 2 });
  return gong;
}
function bamboo(w, x, z, n) {
  const green = M(0x6aa83a, { rough: 0.5 }), leaf = M(0x4a8a2a, { rough: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) {
    const bx = x + Math.cos(i * 2.4) * (1 + (i % 5)), bz = z + Math.sin(i * 2.4) * (1 + (i % 5)), h = 6 + (i % 4);
    const stalk = w.cyl(0.08, 0.1, h, green, bx, h / 2, bz, { seg: 6, collide: false }); stalk.rotation.z = Math.sin(i) * 0.08;
    for (let k = 0; k < 3; k++) { const l = w.mesh(new THREE.PlaneGeometry(0.25, 1), leaf, bx + 0.3, h * (0.6 + k * 0.12), bz, { rz: 0.9, ry: i + k * 2 }); l.castShadow = false; }
  }
}

export function buildChina(w) {
  w.setSky("morning");
  const hills = (x, z) => Math.max(0, Math.hypot(x, z - 10) - 24) * 0.18 * (1 + Math.sin(x * 0.05) * 0.5) + Math.sin(x * 0.04 + z * 0.03) * 1.5 * Math.min(1, Math.max(0, (Math.hypot(x, z - 10) - 24) / 20));
  w.terrain(360, 96, hills, M("grass", { args: [145, [96, 130, 70]], repeat: [60, 60], normal: 0.6 }));
  w.phys.fixedBox(0, -3, 0, 400, 1, 400);
  w.mountains(18, 200, 110, { seed: 17, snow: false, color: 0x5a7a6a });
  // the wall climbs out of the valley, along the ridge, and back down
  const pts = [[-14, 2, 1.4], [-14, -8, 3.4], [-8, -20, 6.0], [4, -30, 8.4], [18, -36, 10.6], [32, -34, 12.0], [44, -24, 12.4], [50, -10, 11.0], [52, 6, 8.6], [48, 20, 6.4], [40, 30, 4.4]];
  const segs = wall(w, pts);
  w.steps(4, 5, 0.35, 0.7, M("stone", { args: [131, [170, 160, 140]] }), -14, 0, 5.6, Math.PI);
  for (const i of [2, 5, 8]) { const [x, z, y] = pts[i], s = segs[i] || segs[i - 1]; watchtower(w, x, z, y, s.ry); }
  // the great fort at the end, with the relay room: a long hall with no roof
  const fort = M("stone", { args: [147, [166, 156, 136]], repeat: [4, 1] });
  const fx = 40, fz = 44;
  w.box(1, 5, 26, fort, fx - 3.5, 2.5, fz + 10); w.box(1, 5, 26, fort, fx + 3.5, 2.5, fz + 10); w.box(8, 5, 1, fort, fx, 2.5, fz + 23);
  w.box(6, 0.1, 26, M("tiles", { args: [149, [140, 60, 50], [110, 50, 40], 6], repeat: [1, 4] }), fx, 0.05, fz + 10, { collide: false });
  w.sign("RELAY ROOM", 4, 0.9, fx, 5.6, fz - 3.1, Math.PI, { bg: "#6a1a1a", fg: "#ffd166" });
  // the temple, the gong, bamboo and lanterns in the valley
  const gong = pagoda(w, -26, 26);
  bamboo(w, 16, 22, 26); bamboo(w, -40, 8, 18);
  for (let i = 0; i < 8; i++) { const l = w.mesh(new THREE.SphereGeometry(0.45, 12, 8), M(0xe83a2a, { emissive: 0xff3a1a, ei: 2.2 }), -16 + i * 4, 4, 18, { cast: false }); l.scale.y = 1.3; }
  w.box(32, 0.05, 0.05, M(0x1a1a1a), -2, 4.5, 18, { collide: false });
  w.gong = gong;
  w.floorY = -20;
  // lanterns for BOLT to fly through, along the wall
  const rings = pts.slice(1, 10).map(([x, z, y], i) => [x + (i % 2 ? 3 : -3), y + 4 + (i % 3), z, 2.2, Math.atan2(pts[i + 2]?.[0] - x || 0, pts[i + 2]?.[1] - z || 1)]);
  // cells along the walkway, and two on the tower roofs
  const cellsOn = []; for (let i = 1; i < pts.length - 1; i++) { const [x0, z0, y0] = pts[i], [x1, z1, y1] = pts[i + 1]; cellsOn.push([(x0 + x1) / 2, (y0 + y1) / 2 + 1, (z0 + z1) / 2]); }
  cellsOn.push([pts[2][0], pts[2][2] + 2.6, pts[2][1]], [pts[5][0], pts[5][2] + 2.6, pts[5][1]]);
  w.missionData = {
    chn1: { cells: cellsOn.slice(0, 10) },
    chn2: { title: "TEMPLE BELLS" },
    chn3: { rings, ceiling: 50 },
    chn4: { start: [fx, 0.1, fz - 2], goal: [fx, 0.1, fz + 21], width: 6, beams: 8 },
  };
  return { spawn: [-6, 0.05, 22], yaw: Math.PI * 0.9, bolt: [-4, 0.05, 21], contact: [-10, 0.05, 20, 2.4] };
}
