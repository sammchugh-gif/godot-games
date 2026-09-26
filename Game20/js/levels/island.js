// Zero's Island: a Z of rock in a stormy sea, a smoking volcano, laser fences
// on the beach, a guarded yard of crates, and the silo where the Pump sits on
// its rocket, ready to launch.
import * as THREE from "three";
import { M } from "../tex.js";

function pump(w, x, y, z, s = 1) {
  // the Gravity Pump: a great ring of glowing cells round a spinning core
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); w.scene.add(g);
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.85, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5, 0.7, 16, 48), metal); g.add(ring);
  const cells = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x3aa8ff, emissive: 0x3ab0ff, emissiveIntensity: 2.2 })); c.position.set(Math.cos(a) * 5, Math.sin(a) * 5, 0); c.rotation.z = a; g.add(c); cells.push(c); }
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 1), new THREE.MeshStandardMaterial({ color: 0xff5ad8, emissive: 0xff3ad8, emissiveIntensity: 1.8, flatShading: true })); g.add(core);
  for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.4, 0.3), metal); sp.rotation.z = i * Math.PI / 4; g.add(sp); }
  w.updaters.push((dt, t) => { ring.rotation.z = t * 0.3; core.rotation.set(t * 0.7, t, 0); cells.forEach((c, i) => { c.material.emissiveIntensity = 1.6 + Math.sin(t * 4 + i) * 0.8; }); });
  return g;
}
function rocket(w, x, z) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf0f2f6, roughness: 0.3, clearcoat: 0.6 }), purple = M(0x6a3aa8, { rough: 0.4 });
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 26, 24), white); body.position.y = 16; body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(2.4, 7, 24), purple); nose.position.y = 32.5; g.add(nose);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 3.6), purple); const a = i * Math.PI / 2; f.position.set(Math.cos(a) * 3, 5, Math.sin(a) * 3); f.rotation.y = -a; g.add(f); }
  const z0 = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), M(0xff5ad8, { emissive: 0xff5ad8, ei: 1.5, side: THREE.DoubleSide })); z0.position.set(0, 20, 2.72); g.add(z0);
  w.phys.fixedCyl(x, 16, z, 2.8, 13);
  return g;
}

export function buildIsland(w) {
  w.setSky("storm");
  w.water(900, 900, 0, -0.4, 0, 0x16323f, { opacity: 0.96 });
  w.phys.fixedBox(0, -6, 0, 500, 1, 500);
  w.floorY = -3;
  // the Z: a top bar, a diagonal and a bottom bar of dark rock
  const rock = M("stone", { args: [171, [70, 64, 60]], repeat: [12, 4], normal: 1.4 });
  w.box(96, 2, 32, rock, 0, -0.8, -36);
  w.box(96, 2, 22, rock, 0, -0.8, 34);
  w.box(18, 2, 96, rock, 0, -0.8, -1, { ry: -Math.atan2(80, 60) });
  // the volcano behind, glowing
  const cone = w.mesh(new THREE.ConeGeometry(70, 60, 24, 1, true), M(0x3a302c, { rough: 1, flat: true }), -30, 28, -140, { cast: false });
  void cone;
  const lava = w.mesh(new THREE.CircleGeometry(12, 24), M(0xff5a1a, { emissive: 0xff4a0a, ei: 3 }), -30, 57, -140, { rx: -Math.PI / 2, cast: false }); void lava;
  w.updaters.push((dt, t) => { if (w.fx && Math.random() < dt * 3) w.fx.burst(-30 + Math.random() * 10 - 5, 58, -140, 0xff6a2a, 6, { speed: 3, up: 8, life: 2, size: 1.5, gravity: -2, bright: 2 }); });
  // the beach and its laser fence corridor
  const wallM = M("metal", { args: [173, [60, 62, 72]], repeat: [6, 1] });
  w.box(34, 3, 0.6, wallM, 0, 1.5, 29.5); w.box(34, 3, 0.6, wallM, 0, 1.5, 38.5);
  for (let x = -16; x <= 16; x += 8) { w.cyl(0.25, 0.25, 3.6, M(0xff3a3a, { emissive: 0xff2a2a, ei: 1.5 }), x, 1.8, 29.2, { seg: 8, collide: false }); w.cyl(0.25, 0.25, 3.6, M(0xff3a3a, { emissive: 0xff2a2a, ei: 1.5 }), x, 1.8, 38.8, { seg: 8, collide: false }); }
  // Zero's base: the dome, the guarded yard, the silo
  const domeM = new THREE.MeshPhysicalMaterial({ color: 0x8a6ad8, roughness: 0.15, metalness: 0.2, transmission: 0, clearcoat: 1, emissive: 0x3a1a6a, emissiveIntensity: 0.4 });
  const dome = w.mesh(new THREE.SphereGeometry(10, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeM, 0, 0.2, -40); void dome;
  w.phys.fixedBall(0, 0.2, -40, 9.6);
  w.sign("ZERO", 6, 1.8, 0, 7, -30.6, 0, { bg: "#1a0820", fg: "#ff5ad8", glow: 2 });
  // the yard (west end of the top bar): walls and rows of crates
  const yx0 = -46, yx1 = -14, yz0 = -50, yz1 = -22;
  const yw = M("metal", { args: [175, [80, 84, 96]], repeat: [4, 1] });
  w.box(yx1 - yx0, 2.6, 0.5, yw, (yx0 + yx1) / 2, 1.5, yz0);
  w.box(0.5, 2.6, yz1 - yz0, yw, yx0, 1.5, (yz0 + yz1) / 2);
  w.box(0.5, 2.6, 10, yw, yx1, 1.5, yz0 + 5); w.box(0.5, 2.6, 10, yw, yx1, 1.5, yz1 - 5);
  const crate = M("wood", { args: [177, [120, 90, 140]] });
  for (const [x, z, sx] of [[-40, -28, 8], [-24, -28, 8], [-32, -36, 10], [-42, -44, 6], [-22, -44, 8]]) w.box(sx, 1.8, 1.6, crate, x, 1.1, z);
  // the silo and the rocket with the Pump strapped on
  w.cyl(9, 9, 0.6, M("metal", { args: [179, [90, 94, 104]], repeat: [4, 4] }), 30, 0.5, -38, { seg: 32 });
  const rk = rocket(w, 38, -44);
  const pmp = w.pump = pump(w, 38, 24, -38.6, 0.8);
  // when Zero launches, the rocket and the Pump go up on a column of fire
  let up = 0;
  w.updaters.push((dt) => { if (!w.launch) return; up += dt; const h = up * up * 3; rk.position.y = h; pmp.position.y = 24 + h; if (w.fx) { w.fx.burst(38, h + 1, -44, 0xffa030, 10, { speed: 4, up: -6, life: 0.8, size: 1.2, gravity: -3, bright: 3 }); w.fx.puff(38 + Math.random() * 6 - 3, 0.5, -44 + Math.random() * 6 - 3, 0xc8c0b8, 2); } });
  for (let i = 0; i < 6; i++) w.lamp(-40 + i * 16, -22, 5, 0xff9ae8, { ei: 4 });
  w.weather = "storm";
  // rain
  const drops = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0x9ab8d8, transparent: true, opacity: 0.5 }), 500);
  const dd = []; for (let i = 0; i < 500; i++) dd.push([Math.random() * 80 - 40, Math.random() * 30, Math.random() * 80 - 40]);
  drops.frustumCulled = false; w.scene.add(drops);
  const mm = new THREE.Matrix4();
  w.updaters.push((dt) => { const c = w.camTarget || { x: 0, z: 0 }; for (let i = 0; i < 500; i++) { const d = dd[i]; d[1] -= dt * 22; if (d[1] < 0) d[1] = 30; mm.makeTranslation(c.x + d[0], d[1], c.z + d[2]); drops.setMatrixAt(i, mm); } drops.instanceMatrix.needsUpdate = true; });
  // lightning flashes
  w.updaters.push((dt, t) => { const f = Math.max(0, Math.sin(t * 0.7) * 30 - 29) + Math.max(0, Math.sin(t * 1.9 + 1) * 40 - 39.5); w.hemi.intensity = w.sky.hemi[2] + f * 1.5; });
  w.missionData = {
    isl1: { start: [-16, 0.2, 34], goal: [16, 0.2, 34], width: 8, beams: 11 },
    isl2: { start: [-16, 0.2, -24], goal: [-42, 0.2, -47], range: 8, guards: [{ path: [[-40, -32], [-18, -32]], speed: 1.8, pause: 1.4 }, { path: [[-18, -40], [-40, -40]], speed: 1.7, pause: 1.4, phase: 6 }],
      route: [[-18, 0.2, -25.5], [-44, 0.2, -25.5], [-44, 0.2, -36], [-44, 0.2, -46.5], [-42, 0.2, -47]] },
    isl3: { title: "SILO DOORS" },
    isl4: { center: [28, 0.2, -34], radius: 11, height: 7.5 },
  };
  return { spawn: [-30, 0.2, 34], yaw: Math.PI / 2, bolt: [-31, 0.2, 32], contact: null, apply: save => { if (save.done.includes("isl4")) { rk.visible = false; pmp.visible = false; } } };
}
