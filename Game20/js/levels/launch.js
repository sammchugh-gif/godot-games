// The POLARIS launch base on the coast: a tall white rocket on its pad, a
// gantry tower to climb, the control centre, and a ring road round it all.
import * as THREE from "three";
import { M } from "../tex.js";

function bigRocket(w, x, z) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f6fa, roughness: 0.3, clearcoat: 0.8 }), blue = M(0x1a3a8a, { rough: 0.4 }), black = M(0x1a1c22, { rough: 0.5 });
  const g = new THREE.Group(); g.position.set(x, 3, z); w.scene.add(g);
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(3.2, 3.2, 40, 32), white, 0, 20, 0);
  add(new THREE.CylinderGeometry(3.25, 3.25, 2, 32), black, 0, 30, 0);
  add(new THREE.CylinderGeometry(2.6, 3.2, 6, 32), white, 0, 43, 0);
  add(new THREE.ConeGeometry(2.6, 8, 32), blue, 0, 50, 0);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { const b = add(new THREE.CylinderGeometry(1.2, 1.2, 24, 20), white, Math.cos(a) * 4.4, 12, Math.sin(a) * 4.4); void b; add(new THREE.ConeGeometry(1.2, 3, 20), white, Math.cos(a) * 4.4, 25.5, Math.sin(a) * 4.4); }
  const sign = add(new THREE.PlaneGeometry(3.2, 12), M(0x1a3a8a), 0, 22, 3.22); void sign;
  const flame = add(new THREE.ConeGeometry(4, 14, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb040).multiplyScalar(4), transparent: true, opacity: 0.9 }), 0, -7, 0); flame.rotation.x = Math.PI; flame.visible = false;
  w.phys.fixedCyl(x, 23, z, 3.3, 20);
  let up = 0;
  w.updaters.push((dt) => { if (!w.launch) return; up += dt; flame.visible = true; flame.scale.set(1 + Math.random() * 0.2, 1 + Math.random() * 0.3, 1 + Math.random() * 0.2); g.position.y = 3 + up * up * 2.5; if (w.fx) { w.fx.puff(x + Math.random() * 16 - 8, 1, z + Math.random() * 16 - 8, 0xe8e4de, 3); w.fx.burst(x, g.position.y - 6, z, 0xffa040, 8, { speed: 5, up: -8, life: 0.6, size: 1.6, gravity: 0, bright: 3 }); } });
  return g;
}
function gantry(w, x, z) {
  // a red steel tower with a platform every 6 m, stairs zig-zagging up, and a lift
  const red = M(0xc8302a, { rough: 0.5, metal: 0.6 }), grate = M("metal", { args: [181, [120, 124, 130]], repeat: [2, 2] });
  const levels = 6, step = 6;
  for (const [sx, sz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) w.box(0.5, levels * step + 4, 0.5, red, x + sx, (levels * step + 4) / 2, z + sz);
  for (let i = 1; i <= levels; i++) {
    const y = i * step;
    w.box(7, 0.3, 7, grate, x, y, z);
    w.box(2, 0.3, 2, grate, x + 2.5, y, z + 4.4);
    for (const [sx, sz, rw, rd] of [[0, -3.4, 7, 0.1], [-3.4, 0, 0.1, 7]]) w.box(rw, 1, rd, red, x + sx, y + 0.65, z + sz, { collide: true });
  }
  // the lift on the open side
  w.platform(2.6, 0.3, 2.6, M(0xf0c020, { rough: 0.4 }), x + 5, 0.4, z + 5.4, t => [x + 5, 0.4 + (Math.sin(t * 0.35 - Math.PI / 2) + 1) / 2 * (levels * step - 0.3), z + 5.4]);
  // an arm across to the rocket at the top
  w.box(9, 0.4, 2.4, grate, x - 7, levels * step, z);
  return { top: levels * step, step };
}

export function buildLaunch(w) {
  w.setSky("day");
  w.ground(M("grass", { args: [183, [110, 150, 80]], repeat: [60, 60] }), 500);
  w.water(800, 300, 0, 0.05, -230, 0x1a6aa8, { opacity: 0.95 });
  w.box(800, 0.4, 30, M("sand", { args: [185], repeat: [60, 3] }), 0, 0.02, -75, { collide: false });
  // the pad and the rocket
  w.box(34, 3, 34, M("paving", { args: [187, [190, 190, 186], 64], repeat: [6, 6] }), 0, 1.5, -30);
  w.ramp(8, 20, 3, M("asphalt", { args: [189], repeat: [2, 4] }), 0, 0, 7, Math.PI);
  const rocket = bigRocket(w, -4, -30);
  const gt = gantry(w, 10, -30);
  // the control centre and its dish
  w.building(28, 9, 14, -30, 54, { wall: [230, 234, 240], seed: 191, win: { lit: 0.3, glass: "#3a6a9a" }, trim: 0x1a3a8a, ry: 0 });
  w.sign("POLARIS LAUNCH CONTROL", 16, 1.8, -30, 10.4, 46.9, Math.PI, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1.2 });
  const dish = w.mesh(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), M(0xf0f2f6, { rough: 0.3, side: THREE.DoubleSide }), -44, 14, 56, { rx: -0.8 }); void dish;
  w.cyl(0.4, 0.6, 5, M(0xd8d8e0, { metal: 0.6 }), -44, 11.5, 56, { collide: false });
  // the ring road
  const road = M("asphalt", { args: [193], repeat: [4, 4] });
  const loop = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; loop.push([Math.cos(a) * 56, -8 + Math.sin(a) * 44]); }
  for (let i = 0; i < loop.length; i++) { const [x0, z0] = loop[i], [x1, z1] = loop[(i + 1) % loop.length]; const L = Math.hypot(x1 - x0, z1 - z0); w.box(9, 0.06, L + 1.5, road, (x0 + x1) / 2, 0.03, (z0 + z1) / 2, { ry: Math.atan2(x1 - x0, z1 - z0), collide: false }); }
  for (const [x, z] of [[40, 30], [66, 10], [-68, -20], [30, -62], [-20, 62], [62, -34]]) w.palm(x, z, 9);
  for (let i = 0; i < 6; i++) w.lamp(-20 + i * 8, 46, 5, 0xfff0d0);
  w.floorY = -20;
  const lv = y => y + 0.2;
  w.missionData = {
    lb1: { title: "LAUNCH SEQUENCE" },
    lb2: { cells: [[10, lv(6) + 1.1, -30], [10, lv(12) + 1.1, -30], [8, lv(18) + 1.1, -28], [12, lv(24) + 1.1, -32], [10, lv(30) + 1.1, -30], [10, lv(36) + 1.1, -30], [4, lv(36) + 1.1, -30], [15, 20, -24.6]] },
    lb3: { rings: [[0, 8, -12, 2.4], [-12, 14, -24, 2.4, 1.2], [-12, 22, -40, 2.4, 2.4], [2, 30, -44, 2.4, 3.2], [8, 36, -32, 2.4, 4.4], [-2, 42, -18, 2.4, 5.4], [-14, 48, -30, 2.4, 6.4], [-4, 58, -38, 2.6, 7.2]], ceiling: 70 },
    lb4: { path: loop, y: 0.3, car: "buggy", quarry: "kart", lead: 30 },
  };
  return { spawn: [0, 0.05, 30], yaw: Math.PI, bolt: [2, 0.05, 29], contact: [-4, 0.05, 27, 2.6], rocket, gantry: gt };
}
