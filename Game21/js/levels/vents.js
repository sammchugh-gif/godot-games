// The Hydrothermal Vents: two and a half kilometres down, a rift in the sea bed
// where the rock is hot. Black smokers pour out scalding black water; giant tube
// worms crowd round them. Dr Ama's vent lab (a POLARIS dive bell) sits on the
// eastern rim. Across the rift Undertow has built a pump house that runs on the
// vents' heat, and a heat exchanger that sends it down her pipe to the Engine.
import * as THREE from "three";
import { M } from "../tex.js";
import { diveBell, smoker, tubeWorms } from "./deepkit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildVents(w) {
  w.setSky({ top: "#000308", mid: "#01050c", bottom: "#000206", sun: [80, 30], sunColor: "#2a4a7a", sunI: 0.1, hemi: ["#2a3a5a", "#0a0604", 0.22], fog: null, clouds: 0 });
  // the rift: a trough running north-south down the middle, walls of pillow lava either side
  const h = (x, z) => {
    let y = Math.sin(x * 0.15) * Math.cos(z * 0.13) * 0.8 + Math.sin(x * 0.4 + z * 0.3) * 0.25;
    y -= 10 * S(22, 8, Math.abs(x + Math.sin(z * 0.04) * 6));
    return y;
  };
  w.terrain(380, 170, h, M("rock", { args: [91, [44, 40, 40]], repeat: [80, 80] }));
  w.ocean({ level: 2500, abyss: { top: 0, bottom: -30, k: [0.88, 1] }, under: 0x06142a, deepUnder: 0x010306, see: 30, room: 50 });
  w.floorY = -60; w.dark = true;
  const rift = z => -Math.sin(z * 0.04) * 6;

  // ---- the vent field: smokers along the rift, tube worms round their feet, white crabs
  const SMOKERS = [[0, -50, 9], [-4, -26, 12], [3, -6, 8], [-2, 16, 14], [4, 36, 10], [-3, 58, 11]].map(([dx, z, ht]) => { const x = rift(z) + dx, y = h(x, z); smoker(w, x, y, z, ht, { light: Math.abs(z) < 40 }); return { x, y, z, ht }; });
  for (const s of SMOKERS) for (let k = 0; k < 3; k++) { const a = k * 2.2 + s.z; tubeWorms(w, s.x + Math.cos(a) * 3.8, h(s.x + Math.cos(a) * 3.8, s.z + Math.sin(a) * 3.8) - 0.1, s.z + Math.sin(a) * 3.8, 16, 1.3); }
  // the worm forest the sub threads through (the maze)
  const WORMS = [];
  for (let k = 0; k < 26; k++) { const z = -60 + k * 5, x = rift(z) + ((k % 2) ? 7 : -7) + Math.sin(k * 1.3) * 3; WORMS.push([x, z]); tubeWorms(w, x, h(x, z) - 0.1, z, 24, 1.6); w.phys.fixedCyl(x, h(x, z) + 1.2, z, 1.4, 1.3); }
  for (let k = 0; k < 8; k++) { const c = critter("crab", 1.2); const cx = rift(-40 + k * 12) + (k % 2 ? 3 : -3), cz = -40 + k * 12; c.position.set(cx, h(cx, cz), cz); w.scene.add(c); c.traverse(n => { if (n.isMesh && n.material.color) { n.material = n.material.clone(); n.material.color.set(0xf0ece0); } }); w.updaters.push((dt, t) => { c.position.x = cx + Math.sin(t * 0.3 + k) * 1.5; animateCritter(c, dt, 0.5); }); }
  school(w, 12, -6, 0, 40, 5, 0x9aff7a, 1.6);

  // ---- Dr Ama's lab on the eastern rim
  const bell = diveBell(w, 44, h(44, 20), 20);
  w.sign("VENT LAB", 2.6, 0.6, 44, bell.F + 2.6, 20 + 4.85, Math.PI, { bg: "#6a3a0a", fg: "#ffd166", glow: 0.4 });
  // her instrument sleds, knocked over, and the rack they go back on
  const RACK = [36, h(36, 34) + 0.4, 34];
  w.box(4, 0.3, 3, M(0x3a4a5a, { metal: 0.6 }), RACK[0], RACK[1] - 0.25, RACK[2]);

  // ---- Undertow's pump house and heat exchanger on the western rim
  const PH = { x: -44, z: -8 }, py = h(PH.x, PH.z), dark = M("metal", { args: [10, [60, 56, 70], 64], repeat: [3, 2], metal: 0.6, rough: 0.5 }), teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 1.3 });
  w.box(12, 7, 10, dark, PH.x, py + 3.5, PH.z);
  w.box(12.2, 0.4, 10.2, teal, PH.x, py + 7.2, PH.z, { collide: false });
  w.box(2.2, 2.6, 0.3, M(0x1a1a24, { metal: 0.7 }), PH.x + 6.1, py + 1.3, PH.z, { ry: Math.PI / 2, collide: false });
  w.sign("PUMP HOUSE", 5, 0.9, PH.x + 6.15, py + 5.2, PH.z, Math.PI / 2, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });
  // pipes from the smokers to the pump house, and on from it to the heat exchanger
  const pipeM = M("metal", { args: [9, [96, 110, 104], 128], repeat: [8, 2], rough: 0.6, metal: 0.5 });
  const pipe = (ax, az, bx, bz, r = 0.7) => { const L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, y = Math.max(h(ax, az), h(bx, bz), h(cx, cz)) + r + 0.3, ry = Math.atan2(bx - ax, bz - az); const m = w.mesh(new THREE.CylinderGeometry(r, r, L, 14), pipeM, cx, y, cz); m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, ry, 0, "YXZ")); w.phys.fixedBox(cx, y, cz, r, r, L / 2, ry); };
  pipe(SMOKERS[2].x - 2, SMOKERS[2].z, PH.x + 6, PH.z - 2);
  pipe(SMOKERS[1].x - 2, SMOKERS[1].z, PH.x + 6, PH.z - 4);
  const HX = { x: -48, z: -34 }, hy = h(HX.x, HX.z);
  pipe(PH.x, PH.z - 5, HX.x, HX.z + 3, 0.9);
  for (let k = 0; k < 7; k++) w.box(0.2, 4, 5, M(0x8a5a3a, { metal: 0.7, rough: 0.4 }), HX.x - 3 + k, hy + 2, HX.z, { collide: false });
  w.phys.fixedBox(HX.x, hy + 2, HX.z, 3.6, 2, 2.6);
  w.mesh(new THREE.TorusGeometry(0.6, 0.1, 8, 20), M(0xe83a2a), HX.x + 4, hy + 1.6, HX.z, { ry: Math.PI / 2 });
  w.sign("HEAT EXCHANGER", 5, 0.8, HX.x, hy + 4.6, HX.z + 2.7, 0, { bg: "#4a1a0a", fg: "#ffb070", glow: 0.5 });
  const pl = new THREE.PointLight(0x2ad0c0, 8, 20, 1.4); pl.position.set(PH.x + 8, py + 4, PH.z); w.scene.add(pl);
  // the pipe away to the Engine, west
  pipe(HX.x - 3, HX.z, -150, -40, 1.1);
  w.airStation(20, h(20, -20), -20); w.airStation(-24, h(-24, 20), 20); w.airStation(-30, h(-30, -40), -40);

  // ---- the missions
  const bed = (x, z, up = 1.2) => [x, h(x, z) + up, z];
  const onSmoker = (i, up, side) => { const s = SMOKERS[i]; return [s.x + side * 1.9, s.y + up, s.z]; };
  const ring = (x, y, z, a) => [x, y, z, 2.6, a];
  w.missionData = {
    ven1: { cells: [onSmoker(0, 4, 1), onSmoker(1, 6, -1), onSmoker(2, 3, 1), onSmoker(3, 8, -1), onSmoker(4, 5, 1), onSmoker(5, 6, -1), onSmoker(3, 3, 1)], floor: -20 },
    ven2: { sub: [30, 4, -64, -Math.PI / 2], exit: bell.spawn, floor: -24,
      rings: WORMS.filter((_, k) => k % 4 === 1).map(([x, z], i) => ring(rift(z) + (x > rift(z) ? -1.5 : 1.5), h(x, z) + 3, z, 0)).slice(0, 6) },
    ven3: { title: "PUMP HOUSE" },
    ven4: { exit: bell.spawn, floor: -24, path: [[30, 8, 60], [14, 7, 48], [7, 6, 28], [12, 7, 8], [10, 6, -14], [8, 7, -36], [7, 6, -58], [-4, 8, -80], [-24, 9, -96]] },
    ven5: { sub: [30, 4, 10, -Math.PI / 2], exit: bell.spawn, items: [bed(12, 40, 0.6), bed(-16, 30, 0.6), bed(16, -40, 0.6)], pad: RACK, padR: 2.8, floor: -24 },
    ven6: { title: "HEAT EXCHANGER" },
  };
  return {
    stars: [bed(-2, -60, 0.3), bed(-60, 40, 0.3), bed(60, -40, 0.3)],
    spawn: bell.spawn, yaw: bell.face, bolt: [bell.hole[0] + 3.8, bell.F + 0.1, bell.hole[1] - 1.5], contact: [bell.hole[0], bell.F, bell.hole[1] - 3.9, 0.3],
    swimTop: 14, lamp: 40,
    at: { ven1: [41.5, 23.5, bell.F + 1], ven2: [46.5, 23.5, bell.F + 1], ven3: [PH.x + 8, PH.z, py + 5], ven4: [41.5, 16.5, bell.F + 1], ven5: [46.5, 16.5, bell.F + 1], ven6: [HX.x + 5.5, HX.z, hy + 5] },
  };
}
