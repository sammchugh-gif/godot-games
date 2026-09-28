// The north polar cap of Mars: a white plain of ice under a low sun, and on it the stolen sea,
// frozen into bricks and stacked into towers, rows and rows of them. Some towers have heaters
// round their feet, melting them; the meltwater runs off north in pipes to Undertow's dome,
// which glows blue over the ridge. The brick yard (Drip guards; the melt switch at its far
// side) is to the east, a frozen lake to the south-east, a crack in the ice to the west.
import * as THREE from "three";
import { M } from "../tex.js";
import { marsRock, lander } from "./spacekit.js";

const YARD = { x0: 32, x1: 68, z0: -12, z1: 24 }, LAKE = { x: 40, z: -92, rx: 50, rz: 30 };
const flatIn = (x, z) => Math.max(
  Math.min(1, Math.max(0, Math.min(x - YARD.x0 + 8, YARD.x1 + 8 - x, z - YARD.z0 + 8, YARD.z1 + 8 - z) / 6)),
  Math.min(1, Math.max(0, (1.15 - Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz)) * 5)));
export function ground(x, z) {
  const h = Math.sin(x * 0.03 + z * 0.02) * 0.8 + Math.cos(z * 0.045 - 0.4) * 0.5 + Math.sin((x + 2 * z) * 0.012) * 1.6;
  return h * (1 - flatIn(x, z));
}

export function buildPolar(w) {
  w.setSky({ top: "#5a4a58", mid: "#d8b8a0", bottom: "#f0e0d4", sun: [12, 60], sunColor: "#fff4e8", sunI: 2.1, hemi: ["#f0e8e8", "#8a7870", 0.72], fog: [120, 700], clouds: 0, stars: 300, dust: 0.3, moons: true });
  const G = ground;
  w.terrain(900, 220, G, M("snow", { args: [381, [238, 228, 226]], repeat: [120, 120] }));
  w.overlay(LAKE.x, LAKE.z, LAKE.rx * 2.2, LAKE.rz * 2.2, M(0xbfe0f0, { rough: 0.12, metal: 0.1 }), (x, z) => Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1.05);
  w.phys.fixedBox(0, -20, 0, 400, 1, 400);
  w.floorY = -30;
  const brick = M("tiles", { args: [383, [206, 234, 248], [176, 214, 238], 4], repeat: [1, 2], rough: 0.25 });
  const tower = (x, z, h, s = 3) => { const y = G(x, z); w.box(s, h, s, brick, x, y + h / 2, z); return y + h; };

  // ---- the tower field (north-west): rows of tall towers, and among them the ones with cells
  const TOWERS = [[-28, -20, 2.4], [-40, -12, 1.8], [-52, -24, 3], [-34, 4, 2.4], [-58, 0, 2.4], [-46, 18, 3], [-26, 22, 1.8], [-64, 30, 2.4]];
  const tops = TOWERS.map(([x, z, h]) => [x, tower(x, z, h), z]);
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 1, 3), brick, 80), mm = new THREE.Matrix4();
  let n = 0;
  for (let i = -8; i <= 8; i++) for (let j = -2; j <= 9; j++) {
    const x = -44 + i * 9 + (j % 2) * 4.5, z = 8 + j * 12;
    if (n >= 80 || Math.hypot(x + 44, z - 8) < 30 || TOWERS.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 7) || x > 20) continue;
    const h = 6 + ((i * 7 + j * 13) % 7), y = G(x, z);
    mm.makeScale(1, h, 1).setPosition(x, y + h / 2, z); inst.setMatrixAt(n++, mm); w.phys.fixedBox(x, y + h / 2, z, 1.5, h / 2, 1.5);
  }
  inst.count = n; inst.castShadow = inst.receiveShadow = true; w.scene.add(inst);
  // the heaters melting four of the towers, and the pipes carrying the meltwater away north
  const heatM = M(0xff8a3a, { emissive: 0xff6a1a, ei: 2 }).clone(), pipeM = M(0x3a4048, { metal: 0.6, rough: 0.4 });
  const HEAT = [[-70, 44], [-18, 56], [-44, 68], [2, 44]];
  for (const [x, z] of HEAT) {
    const y = G(x, z); tower(x, z, 7);
    w.mesh(new THREE.TorusGeometry(2.4, 0.35, 8, 24), heatM, x, y + 0.6, z, { rx: Math.PI / 2, cast: false });
    w.box(0.8, 0.8, 120, pipeM, x, y + 0.4, z + 62, { collide: false });
  }
  w.updaters.push((dt, t) => { heatM.emissiveIntensity = w.meltOff ? 0.05 : 1.6 + Math.sin(t * 4) * 0.5; if (!w.meltOff && w.fx && Math.random() < dt * 6) { const [x, z] = HEAT[Math.floor(Math.random() * HEAT.length)]; w.fx.puff(x + (Math.random() - 0.5) * 3, G(x, z) + 2 + Math.random() * 4, z + (Math.random() - 0.5) * 3, 0xf0f4f8, 6); } });

  // ---- the brick yard (east): walls, stacks of bricks for cover, the melt switch at the far side
  const wallM = M("tiles", { args: [385, [190, 220, 238], [160, 200, 226], 4], repeat: [8, 1], rough: 0.3 });
  w.box(YARD.x1 - YARD.x0 + 1, 2.2, 0.8, wallM, (YARD.x0 + YARD.x1) / 2, 1.1, YARD.z1 + 3);
  for (const x of [YARD.x0 - 1, YARD.x1 + 1]) w.box(0.8, 2.2, YARD.z1 - YARD.z0 + 6, wallM, x, 1.1, (YARD.z0 + YARD.z1) / 2 + 1.5);
  for (const [x, z] of [[38, 2.5], [50, 2.5], [62, 2.5], [44, 11], [56, 11], [38, 19.5], [62, 19.5]]) w.box(4, 2.4, 2, brick, x, 1.2, z);
  w.box(1.6, 1.8, 0.8, M(0x3a4048, { metal: 0.6 }), 50, 0.9, 23.6);
  w.mesh(new THREE.PlaneGeometry(1.2, 0.8), M(0xff8a3a, { emissive: 0xff6a1a, ei: 1.5 }), 50, 1.3, 23.18, { ry: Math.PI, cast: false });
  w.sign("MELT SWITCH", 3, 0.6, 50, 2.6, 23.15, Math.PI, { bg: "#061a2a", fg: "#ff9a4a", glow: 1 });
  w.sign("BRICK YARD", 4, 0.8, 50, 3.2, YARD.z0 - 3.5, 0, { bg: "#061a2a", fg: "#2ad0c0", glow: 1 });
  for (const x of [YARD.x0 + 2, YARD.x1 - 2]) w.box(0.3, 3.4, 0.3, M(0x3a4048, { metal: 0.6 }), x, 1.7, YARD.z0 - 3.5);
  w.box(YARD.x1 - YARD.x0 - 4, 0.6, 0.2, M(0x3a4048, { metal: 0.6 }), 50, 3.3, YARD.z0 - 3.5, { collide: false });

  // ---- the crack in the ice (west), and the landing site
  w.overlay(-58, -70, 6, 60, M(0x1a2a3a, { rough: 0.9 }), (x, z) => Math.abs(x + 58 + Math.sin(z * 0.2) * 1.2) < 1.2, 0.05);
  lander(w, 12, G(12, -68), -68);
  for (let i = 0; i < 24; i++) { const a = i * 2.39996, d = 60 + (i * 53) % 150, x = Math.cos(a) * d, z = Math.sin(a) * d; if (z > -20 || flatIn(x, z) > 0.01 || Math.hypot(x - 12, z + 68) < 14) continue; marsRock(w, x, G(x, z), z, 0.5 + (i % 4) * 0.4, { collide: false, base: [120, 80, 70] }); }

  // ---- Undertow's dome, glowing blue over the ridge to the north
  const dome = w.mesh(new THREE.SphereGeometry(95, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, emissive: 0x1a6ab8, emissiveIntensity: 0.6, roughness: 0.1, transparent: true, opacity: 0.55 }), 0, G(0, 330) - 10, 330, { cast: false });
  dome.userData.dynamic = true;
  w.mesh(new THREE.SphereGeometry(92, 40, 12, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.2), new THREE.MeshBasicMaterial({ color: 0x1a5aa8 }), 0, G(0, 330) - 10, 330, { cast: false });

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const LOOP = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; LOOP.push([LAKE.x + Math.cos(a) * 36, LAKE.z + Math.sin(a) * 20]); }
  w.missionData = {
    pol1: { cells: tops.map(([x, y, z]) => [x, y + 1.2, z]) },
    pol2: { what: "sensor spots", start: [...on(8, -86, 0.5), Math.PI / 2], car: "rover", carOpts: { grip: 1.35, color: 0xe8f0f8, trim: 0x3a8ad8 }, cells: LOOP.map(([x, z]) => on(x, z)) },
    pol3: { range: 7, angle: 30, start: [50, 0.1, YARD.z0 + 1], goal: [50, 0.1, 22],
      guards: [{ path: [[YARD.x0 + 1, -2], [YARD.x1 - 1, -2]], speed: 1.1, y: 0 }, { path: [[YARD.x1 - 1, 7], [YARD.x0 + 1, 7]], speed: 1.0, phase: 4, y: 0 }, { path: [[YARD.x0 + 1, 15], [YARD.x1 - 1, 15]], speed: 1.0, phase: 8, y: 0 }] },
    pol4: { title: "THE MELT SWITCH" },
    pol5: { pad: on(-48, -64, 0), padR: 2.4, size: 1.1, gravity: 1, blocks: [on(-40, -56, 1), on(-36, -70, 1), on(-44, -78, 1), on(-50, -52, 1), on(-32, -62, 1)] },
    pol6: { title: "SILT'S STAR CHART" },
  };
  return {
    stars: [on(-90, 60, 0.2), on(90, -20, 0.2), [50, 3.1, 11]],
    spawn: on(0, -62, 0.1), yaw: 0, bolt: on(-2, -63, 0), contact: [...on(4, -56, 0), -2.5],
    apply: save => { w.meltOff = save.done.includes("pol4"); },
    at: { pol1: [-18, -34, 20], pol2: [14, -78, 20], pol3: [50, YARD.z0 - 8, 20], pol4: [42, 30, 20], pol5: [-38, -60, 20], pol6: [-6, -50, 20] },
  };
}
