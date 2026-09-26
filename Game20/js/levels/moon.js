// The Moon: grey craters under a black sky with the Earth hanging in it, low
// gravity for huge jumps, Zero's domed base, and the Pump's giant battery.
import * as THREE from "three";
import { M } from "../tex.js";

const CRATERS = [[0, -60, 26, 7], [-50, -20, 16, 5], [46, -34, 18, 5], [-34, 40, 14, 4], [40, 36, 12, 4], [-70, -70, 20, 6], [70, 10, 14, 4], [0, 50, 10, 3], [-20, -40, 8, 2.5], [24, -8, 7, 2]];
function ground(x, z) {
  let h = Math.sin(x * 0.05) * 0.6 + Math.cos(z * 0.04 + 1) * 0.6;
  for (const [cx, cz, R, d] of CRATERS) {
    const r = Math.hypot(x - cx, z - cz) / R;
    if (r < 1) h -= d * (1 - r * r);
    h += d * 0.35 * Math.exp(-(((r - 1) / 0.22) ** 2));
  }
  // keep the landing area and the laser corridor flat
  const flat = Math.max(Math.min(1, Math.max(0, 1.4 - Math.hypot(x, z - 14) / 16)), Math.min(1, Math.max(0, 1.5 - Math.hypot(x - 14, z + 20) / 12)));
  return h * (1 - flat);
}
function dome(w, x, z, r, color) {
  const y = ground(x, z);
  const glass = new THREE.MeshPhysicalMaterial({ color, roughness: 0.1, metalness: 0.1, clearcoat: 1, emissive: color, emissiveIntensity: 0.25 });
  w.mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass, x, y, z);
  w.mesh(new THREE.TorusGeometry(r, 0.3, 8, 40), M(0x3a3f4a, { metal: 0.8 }), x, y + 0.2, z, { rx: Math.PI / 2 });
  w.phys.fixedBall(x, y, z, r * 0.97);
}
function battery(w, x, z) {
  const y = ground(x, z);
  const steel = M(0x3a3f4a, { metal: 0.85, rough: 0.3 });
  w.cyl(6, 7, 2, steel, x, y + 1, z, { seg: 32 });
  const core = w.mesh(new THREE.CylinderGeometry(4.2, 4.2, 22, 32), new THREE.MeshStandardMaterial({ color: 0x3aa8ff, emissive: 0x3ab0ff, emissiveIntensity: 1.6, roughness: 0.2 }), x, y + 13, z);
  core.userData.dynamic = true;
  for (let i = 0; i < 5; i++) w.cyl(4.5, 4.5, 0.8, steel, x, y + 4 + i * 4.4, z, { seg: 32, collide: false });
  w.cyl(4.4, 4.4, 22, steel, x, y + 13, z, { collide: true, seg: 8 }).visible = false;
  const cap = w.mesh(new THREE.ConeGeometry(4.6, 3, 32), steel, x, y + 25.5, z); void cap;
  w.updaters.push((dt, t) => { core.material.emissiveIntensity = w.batteryOff ? 0.05 : 1.2 + Math.sin(t * 2) * 0.5; });
}

export function buildMoon(w) {
  w.setSky("moon");
  w.scene.userData.envI = 0.3;
  w.terrain(360, 128, ground, M("moon", { args: [211], repeat: [24, 24], normal: 1.2, rough: 0.95 }));
  w.phys.fixedBox(0, -12, 0, 400, 1, 400);
  w.floorY = -30;
  // boulders
  for (let i = 0; i < 40; i++) { const a = i * 2.39, d = 20 + (i * 37) % 120, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.hypot(x, z - 14) < 18) continue; const r = 0.6 + (i % 5) * 0.4; const m = w.mesh(new THREE.DodecahedronGeometry(r, 0), M(0x8a8a90, { rough: 1, flat: true }), x, ground(x, z) + r * 0.5, z, { ry: i }); m.scale.y = 0.7; w.phys.fixedBall(x, ground(x, z) + r * 0.3, z, r * 0.7); }
  // the POLARIS lander where Rory arrives
  const LX = -22, LZ = 30; const lander = new THREE.Group(); lander.position.set(LX, ground(LX, LZ), LZ); w.scene.add(lander);
  const gold = M(0xd8a830, { metal: 0.8, rough: 0.35 }), white = M(0xf0f2f6, { rough: 0.35 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.4, 3, 8), gold); body.position.y = 3; body.castShadow = true; lander.add(body);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 2, 8), white); top.position.y = 5.5; lander.add(top);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 6), M(0xc0c4cc, { metal: 0.8 })); leg.position.set(Math.cos(a) * 2.5, 1.2, Math.sin(a) * 2.5); leg.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); lander.add(leg); }
  w.phys.fixedCyl(LX, lander.position.y + 3, LZ, 2.4, 3);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), M(0x1a3a8a, { side: THREE.DoubleSide, emissive: 0x1a3a8a, ei: 0.2 })); flag.position.set(LX + 4.9, ground(LX + 4, LZ) + 2.4, LZ); w.scene.add(flag);
  w.cyl(0.04, 0.04, 3, M(0xd8d8e0), LX + 4, ground(LX + 4, LZ) + 1.5, LZ, { collide: false });
  // Zero's base: domes, an antenna and the battery in the big crater
  dome(w, 30, -6, 7, 0x8a4ad8); dome(w, 40, 2, 5, 0x6a3ab8); dome(w, 22, 6, 4, 0xa05ad8);
  w.cyl(0.3, 0.5, 18, M(0xc0c4cc, { metal: 0.7 }), 50, ground(50, -8) + 9, -8, { seg: 8 });
  w.sphere(0.6, M(0xff3a6a, { emissive: 0xff2a5a, ei: 4 }), 50, ground(50, -8) + 18.4, -8, { collide: false });
  battery(w, 0, -60);
  // the base entrance: a corridor with no roof
  const wm = M("metal", { args: [213, [110, 110, 124]], repeat: [4, 1] });
  const ex = 14, ez = -20;
  w.box(1, 4, 20, wm, ex - 3.5, ground(ex, ez) + 2, ez); w.box(1, 4, 20, wm, ex + 3.5, ground(ex, ez) + 2, ez);
  const gy = ground(ex, ez);
  const loop = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; loop.push([Math.cos(a) * 62, 4 + Math.sin(a) * 52]); }
  w.missionData = {
    moon1: { start: [0, ground(0, 8) + 0.5, 8, 0], car: "buggy", carOpts: { color: 0xf0f2f6, trim: 0x3a8ad8, grip: 1.8 }, cells: [[-30, ground(-30, 10) + 1.2, 10], [-44, ground(-44, -8) + 1.2, -8], [-20, ground(-20, 30) + 1.2, 30], [20, ground(20, 30) + 1.2, 30], [56, ground(56, 20) + 1.2, 20], [60, ground(60, -20) + 1.2, -20], [30, ground(30, -36) + 1.2, -36], [-10, ground(-10, -30) + 1.2, -30]] },
    moon2: { cells: [[-50, ground(-50, -20) + 1.3, -20], [-50, ground(-50, -4) + 2.5, -4], [-66, ground(-66, -20) + 2.5, -20], [-50, ground(-50, -36) + 2.5, -36], [-34, ground(-34, -20) + 2.5, -20], [-50, ground(-50, -20) + 7, -20], [-40, ground(-40, -30) + 5, -30], [-60, ground(-60, -10) + 5, -10]] },
    moon3: { pad: [-12, ground(-12, 10), 10], padR: 2.4, size: 1.1, gravity: 1, blocks: [[-4, ground(-4, 2) + 1, 2], [-20, ground(-20, 2) + 1, 2], [-18, ground(-18, 18) + 1, 18], [-2, ground(-2, 18) + 1, 18], [-10, ground(-10, -2) + 1, -2]] },
    moon4: { things: [["crate", 6, ground(6, 16), 16, 0, 0xf0f2f6], ["barrel", 10, ground(10, 10), 10, 0, 0x3a8ad8], ["crate", -2, ground(-2, 6), 6, 0.5, 0xf0f2f6], ["barrel", 14, ground(14, 18), 18, 0, 0xd8a830], ["crate", 4, ground(4, 26), 26, 0.3, 0xf0f2f6], ["barrel", -8, ground(-8, 14), 14, 0, 0xe83a3a], ["crate", 12, ground(12, 4), 4, 1, 0xf0f2f6]] },
    moon5: { path: loop, y: 0.4, car: "buggy", carOpts: { color: 0xf0f2f6, trim: 0x3a8ad8, grip: 1.8 }, quarry: "buggy", lead: 30 },
    moon6: { start: [ex, gy + 0.1, ez + 9], goal: [ex, gy + 0.1, ez - 9], width: 6, beams: 10 },
    moon7: { title: "BATTERY BREAKER" },
    moon8: { center: [0, ground(0, 14), 14], radius: 14, height: 9, rider: "zero" },
  };
  return { spawn: [-2, ground(-2, 26) + 0.1, 26], yaw: Math.PI, bolt: [0, ground(0, 25), 25], contact: null, gravity: 0.3, apply: save => { w.batteryOff = save.done.includes("moon7"); } };
}
