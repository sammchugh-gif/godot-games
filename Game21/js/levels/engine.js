// The Tidal Engine: behind the round door at the bottom of the Mariana Trench, a
// cavern with Undertow's machine in the middle: a tower of turning rings that
// drinks the sea through its intakes and freezes it into bricks. A glass dome on
// legs holds the arena where the new Kraken waits; the cargo pods of frozen sea
// go north to the foot of a shaft that climbs out of the cavern towards the
// surface and the space elevator.
import * as THREE from "three";
import { M } from "../tex.js";
import { diveBell, walls } from "./deepkit.js";
import { critter, animateCritter, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildEngine(w) {
  w.setSky({ top: "#02030a", mid: "#040612", bottom: "#010208", sun: [80, 30], sunColor: "#4a2a7a", sunI: 0.15, hemi: ["#3a2a6a", "#040208", 0.25], fog: null, clouds: 0 });
  // the cavern floor, its walls rising all round
  const h = (x, z) => Math.sin(x * 0.1) * Math.cos(z * 0.09) * 0.5 + 60 * S(95, 130, Math.hypot(x, z));
  w.terrain(320, 150, h, M("rock", { args: [91, [52, 48, 60]], repeat: [60, 60] }));
  w.ocean({ level: 11000, abyss: { top: 10, bottom: 0, k: [0.85, 0.95] }, under: 0x0a0a2a, deepUnder: 0x020208, see: 44, room: 70 });
  w.floorY = -30; w.dark = true;
  const dark = M("metal", { args: [10, [58, 52, 72], 64], repeat: [6, 4], metal: 0.6, rough: 0.45 }), teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 1.6 }), pink = M(0xff3a8a, { emissive: 0xff3a8a, ei: 1.6 });
  const steel = M(0x8a96a8, { metal: 0.6, rough: 0.4 });

  // ---- the Engine: a tower of rings, intakes round its foot, a glowing heart
  w.cyl(10, 13, 8, dark, 0, 4, 0, { seg: 32 });
  w.cyl(8, 10, 10, dark, 0, 13, 0, { seg: 32 });
  w.cyl(5, 7, 10, dark, 0, 23, 0, { seg: 28 });
  const rings = [];
  for (const [y, r] of [[8.2, 12], [18.2, 9.5], [28.2, 6.5]]) { const m = w.mesh(new THREE.TorusGeometry(r, 0.4, 10, 48), teal, 0, y, 0, { rx: Math.PI / 2, cast: false }); m.userData.dynamic = true; rings.push(m); }
  const heart = w.mesh(new THREE.SphereGeometry(2.4, 24, 16), pink, 0, 30, 0, { cast: false }); heart.userData.dynamic = true;
  const hl = new THREE.PointLight(0xff3a8a, 20, 50, 1.2); hl.position.set(0, 31, 0); w.scene.add(hl);
  w.updaters.push((dt, t) => { rings.forEach((r, i) => { r.rotation.z += dt * (0.4 + i * 0.3) * (i % 2 ? -1 : 1); }); const b = 1 + Math.sin(t * 2.5) * 0.08; heart.scale.setScalar(b); hl.intensity = 18 + Math.sin(t * 2.5) * 6; });
  // six intakes: great mouths round the foot, each drawing a current of specks in
  const INTAKES = [];
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2, x = Math.cos(a) * 16, z = Math.sin(a) * 16;
    const m = w.mesh(new THREE.CylinderGeometry(2.4, 3, 6, 20, 1, true), dark, x, 3, z); m.lookAt(0, 3, 0); m.rotateX(Math.PI / 2);
    w.phys.fixedBox(x, 3, z, 2.6, 2.6, 2.6, -a);
    w.mesh(new THREE.TorusGeometry(3, 0.2, 8, 28), teal, Math.cos(a) * 19, 3, Math.sin(a) * 19, { ry: -a + Math.PI / 2, cast: false });
    INTAKES.push([x, z, a]);
  }
  w.sign("TIDAL ENGINE", 8, 1.4, 0, 12, 13.2, 0, { bg: "#1a0a2a", fg: "#ff5ad8", glow: 0.8 });
  // the intake valve panel and the heart's control panel, on the Engine's side
  const VALVE = [Math.cos(0.5) * 20, Math.sin(0.5) * 20], CORE = [Math.cos(3.6) * 20, Math.sin(3.6) * 20];
  for (const [x, z] of [VALVE, CORE]) { w.box(3, 2.4, 1, steel, x, 1.2, z, { ry: Math.atan2(x, z) }); w.mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x39f0ff).multiplyScalar(1.5) }), x * 1.028, 1.5, z * 1.028, { ry: Math.atan2(x, z), cast: false }); }

  // ---- the arena: a glass dome on legs to the west, with a moon pool to swim up into
  const AR = { x: -56, z: 20, r: 13 }, AF = 5, POOL = 1.6;
  const floorM = M(0x5a4a6a, { metal: 0.5, rough: 0.6 }), R = AR.r + 1, HX = -R + 3;
  // (the moon pool near its western wall, clear of the fight)
  const fl = (a, b, c, d) => w.box(b - a, 0.4, d - c, floorM, AR.x + (a + b) / 2, AF - 0.2, AR.z + (c + d) / 2);
  fl(-R, R, -R, -POOL); fl(-R, R, POOL, R); fl(-R, HX - POOL, -POOL, POOL); fl(HX + POOL, R, -POOL, POOL);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.cyl(0.5, 0.6, AF, steel, AR.x + sx * R * 0.7, AF / 2, AR.z + sz * R * 0.7, { seg: 10 });
  walls(w, AR.x - R, AR.z - R, AR.x + R, AR.z + R, AF, 6, [], { glass: true });
  w.box(2 * R, 0.4, 2 * R, dark, AR.x, AF + 6.2, AR.z);
  const al = new THREE.PointLight(0xffd0f0, 12, 30, 1.2); al.position.set(AR.x, AF + 5.5, AR.z); w.scene.add(al);
  w.mesh(new THREE.TorusGeometry(POOL * 1.05, 0.1, 8, 28), M(0xf2c418), AR.x + HX, AF + 0.03, AR.z, { rx: Math.PI / 2, cast: false });
  w.dryRoom(AR.x - R + 0.2, AF, AR.z - R + 0.2, AR.x + R - 0.2, AF + 6, AR.z + R - 0.2, { wl: AF, below: AF + 1, air: [AR.x + HX, AR.z] });

  // ---- the lift shaft to the north: a tube climbing out of the cavern's roof
  const SH = { x: 30, z: -80 };
  // (pillars all round but for a gap on the south-west side, where the pods come in)
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; if (Math.abs(a - 2.83) < 0.7) continue; w.box(0.6, 60, 0.6, steel, SH.x + Math.cos(a) * 7, h(SH.x, SH.z) + 30, SH.z + Math.sin(a) * 7); }
  for (let y = 4; y < 60; y += 8) w.mesh(new THREE.TorusGeometry(7, 0.25, 8, 40), teal, SH.x, h(SH.x, SH.z) + y, SH.z, { rx: Math.PI / 2, cast: false });
  // the cargo pods waiting at its foot, and the track they run on from the Engine
  for (let k = 0; k < 3; k++) { const p = w.mesh(new THREE.CapsuleGeometry(1.8, 4, 8, 16), M(0xcff4ff, { rough: 0.2, metal: 0.3 }), SH.x - 18 + k * 5, 2.2, SH.z + 14, { rx: Math.PI / 2 }); p.castShadow = true; w.phys.fixedBox(SH.x - 18 + k * 5, 2.2, SH.z + 14, 1.8, 1.8, 3.8); }
  w.box(3, 0.5, 70, steel, 16, 0.25, -40);

  // ---- the Drip army's quarters, and life even here
  school(w, 20, 14, 30, 60, 6, 0x9a7aff, 1.8);
  for (let k = 0; k < 4; k++) { const j = critter("jelly", 1.3); w.scene.add(j); const ph = k * 1.6; w.updaters.push((dt, t) => { j.position.set(Math.cos(t * 0.05 + ph) * 40, 16 + Math.sin(t * 0.3 + ph) * 3, Math.sin(t * 0.05 + ph) * 40); animateCritter(j, dt, 0.3); }); }
  w.airStation(30, h(30, 20), 20); w.airStation(-30, h(-30, -20), -20); w.airStation(40, h(40, -50), -50); w.airStation(-30, h(-30, 50), 50);
  const bell = diveBell(w, 60, h(60, 40), 40, { face: -2.2 });

  // ---- the missions
  const bed = (x, z, up = 1.2) => [x, h(x, z) + up, z];
  w.missionData = {
    eng1: { title: "INTAKE VALVES", valves: 5, gauges: 5 },
    eng2: { area: [0, 0, 30], lanes: Array.from({ length: 8 }, (_, k) => { const a = k / 8 * Math.PI * 2; return [Math.cos(a) * 25, Math.sin(a) * 25, Math.cos(a + 0.55) * 25, Math.sin(a + 0.55) * 25, 0]; }), bots: Array.from({ length: 8 }, (_, k) => [Math.cos(k / 8 * Math.PI * 2) * 25, 0, Math.sin(k / 8 * Math.PI * 2) * 25]), floor: -4, lamps: true },
    eng3: { title: "THE ENGINE'S HEART" },
    eng4: { center: [AR.x + 3, AF, AR.z], radius: 8.5, robot: "kraken", height: 5.5, arms: true },
    eng5: { exit: bell.spawn, floor: -4, path: [[24, 8, 10], [26, 6, -10], [16, 5, -30], [20, 6, -50], [10, 8, -66], [18, 10, -76], [SH.x, 18, SH.z], [SH.x, 34, SH.z], [SH.x, 50, SH.z]] },
    eng6: { sub: [SH.x - 16, 6, SH.z + 20, Math.PI], exit: bell.spawn, floor: -4,
      rings: [[SH.x - 11, 10, SH.z + 4, 2.8, 1.9], [SH.x, 13, SH.z, 2.8, 1.9], [SH.x, 20, SH.z, 2.8, 0], [SH.x, 28, SH.z, 2.8, 0], [SH.x, 36, SH.z, 2.8, 0], [SH.x, 44, SH.z, 2.8, 0], [SH.x, 52, SH.z, 2.8, 0]] },
  };
  return {
    stars: [bed(-80, -60, 0.3), bed(80, -20, 0.3), [AR.x - 10, AF + 0.4, AR.z - 10]],
    spawn: bell.spawn, yaw: bell.face, bolt: [bell.hole[0] + 4, bell.F + 0.1, bell.hole[1] + 1], contact: [bell.hole[0], bell.F, bell.hole[1] + 3.9, 2.8],
    swimTop: 58, lamp: 30,
    at: { eng1: [VALVE[0] * 1.2, VALVE[1] * 1.2, 6], eng2: [57.5, 43.5, bell.F + 1], eng3: [CORE[0] * 1.2, CORE[1] * 1.2, 6], eng4: [AR.x + 7, AR.z + 7, AF + 2], eng5: [62.5, 43.5, bell.F + 1], eng6: [62.5, 36.5, bell.F + 1] },
  };
}
