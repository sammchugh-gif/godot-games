// The top of Olympus Mons, the tallest volcano in the solar system: so high the sky is nearly
// black and the stars show by day. The summit is a vast crater, the caldera, with a flat floor
// twenty-four metres down inside a ring of cliffs; Undertow's radio mast stands in it, and her
// Drips have put a laser gate across the way in. Outside the rim the mountain falls away for
// ever, in long slopes broken by cliffs; Hana's camp is on the slope below. Everyone flies here:
// the air is thin enough for jetpacks.
import * as THREE from "three";
import { M } from "../tex.js";
import { Car } from "../vehicle.js";
import { marsGround, marsRock, glassDome, parkedCar, strataMat, strata } from "./spacekit.js";

const CX = 0, CZ = 90, sm = t => t * t * (3 - 2 * t), cl = t => Math.max(0, Math.min(1, t));
const CAMP = { x: 0, z: -80, r: 14 };
export function ground(x, z) {
  const d = Math.hypot(x - CX, z - CZ);
  let h;
  if (d < 55) h = 0;
  else if (d < 70) h = 24 * sm((d - 55) / 15);
  else h = 24 - 0.3 * (d - 70);
  // the cliffs that break the slope
  h -= 5 * sm(cl((d - 98) / 4)) + 6 * sm(cl((d - 128) / 4));
  h += Math.sin(x * 0.09 + z * 0.05) * 0.4 + Math.cos(x * 0.05 - z * 0.12) * 0.3;
  const f = cl(1.5 - Math.hypot(x - CAMP.x, z - CAMP.z) / CAMP.r);
  return h * (1 - f) - 17 * f;
}

export function buildOlympus(w) {
  w.setSky({ top: "#1a1422", mid: "#a07458", bottom: "#d09a74", sun: [32, 120], sunColor: "#fff0e0", sunI: 2.3, hemi: ["#e0c0a8", "#5a3020", 0.6], fog: [140, 620], clouds: 0, stars: 600, dust: 0.4, moons: true });
  const G = ground;
  w.terrain(480, 160, G, marsGround(371, [176, 96, 62], 80));
  const steep = (x, z) => Math.hypot(G(x + 0.5, z) - G(x - 0.5, z), G(x, z + 0.5) - G(x, z - 0.5));
  strata(w.overlay(0, 0, 480, 480, strataMat(), (x, z) => steep(x, z) > 0.8, 0.05), 0.08);
  w.phys.fixedBox(0, -60, 0, 400, 1, 400);
  w.floorY = -70;
  for (let i = 0; i < 60; i++) {
    const a = i * 2.39996, d = 20 + (i * 53) % 190, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP.r + 6 || (Math.abs(x) < 22 && z > 10 && z < 30) || Math.hypot(x - CX, z - CZ + 20) < 22) continue;
    marsRock(w, x, G(x, z), z, 0.5 + (i % 6) * 0.4, { collide: i % 6 > 1, base: [96, 52, 40] });
  }

  // ---- Hana's camp on the slope
  const cy = G(CAMP.x, CAMP.z);
  const tent = w.mesh(new THREE.ConeGeometry(3, 3, 4, 1), M(0xffd166, { rough: 0.7 }), CAMP.x - 6, cy + 1.5, CAMP.z + 4, { ry: Math.PI / 4 }); void tent;
  w.phys.fixedCyl(CAMP.x - 6, cy + 1.2, CAMP.z + 4, 2, 1.2);
  parkedCar(w, Car, CAMP.x + 8, cy, CAMP.z + 2, -0.3, "rover");
  for (let k = 0; k < 3; k++) w.cyl(0.25, 0.25, 0.9, M(0xe8e8ec, { metal: 0.4 }), CAMP.x - 2 + k * 0.7, cy + 0.45, CAMP.z + 8, { seg: 10 });
  w.sign("SUMMIT  22 km", 3.4, 0.7, CAMP.x + 2, cy + 2.2, CAMP.z + 6.9, 0, { bg: "#2a1208", fg: "#ffd166", glow: 0.7 });
  w.box(0.15, 2.2, 0.15, M(0xd8dde4), CAMP.x + 2, cy + 1.1, CAMP.z + 7);

  // ---- the high greenhouse, for climbers
  const GX = -30, GZ = 8, gy = G(GX, GZ);
  glassDome(w, GX, gy, GZ, 6, { garden: true });
  w.sign("HIGH GREENHOUSE", 4.4, 0.7, GX, gy + 2, GZ - 6.4, Math.PI, { bg: "#0a2a14", fg: "#9fffb0", glow: 0.8 });

  // ---- the caldera gate on the rim: a deck, two walls and (in the mission) a net of lasers
  const GY = 24.6, gateM = M("metal", { args: [373, [70, 80, 96], 64], repeat: [8, 1], metal: 0.5 });
  w.box(34, 1.2, 8, M("metal", { args: [375, [110, 116, 128], 64], repeat: [8, 2], metal: 0.4 }), 0, GY - 0.6, 20);
  for (const z of [16.2, 23.8]) w.box(30, 3.2, 0.4, gateM, 0, GY + 1.6, z);
  w.sign("KEEP OUT", 3, 0.7, -15.05, GY + 3.6, 20, -Math.PI / 2, { bg: "#061a2a", fg: "#2ad0c0", glow: 1 });
  w.box(0.3, 1, 8, gateM, -15.1, GY + 3.6, 20, { collide: false });

  // ---- Undertow's radio mast in the middle of the caldera
  const teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 1.2 }), steel = M(0x3a4048, { metal: 0.7, rough: 0.4 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(0.3, 30, 0.3, steel, CX + sx * 1.2, 15, CZ + sz * 1.2);
  for (let k = 1; k <= 6; k++) w.box(2.8, 0.2, 2.8, steel, CX, k * 5, CZ, { collide: false });
  const dish = w.mesh(new THREE.SphereGeometry(3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), M(0xe8e8ec, { rough: 0.3, side: THREE.DoubleSide }), CX, 31, CZ, { rx: -0.6 }); void dish;
  w.sphere(0.6, teal, CX, 32.5, CZ, { collide: false });
  w.box(5, 3, 4, M("metal", { args: [377, [60, 70, 90], 64], repeat: [2, 1], metal: 0.5 }), CX + 6, 1.5, CZ - 4);

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  w.missionData = {
    oly1: { cells: [on(-6, -62, 2), on(-14, -44, 3), on(-18, -34, 2.5), on(-10, -16, 3), on(-2, -6, 3), on(8, 4, 2.5), on(18, 12, 3), on(-22, 24, 2.5)] },
    oly2: { start: [-14, GY + 0.1, 20], goal: [14, GY + 0.1, 20], width: 6.4, beams: 10 },
    oly3: { title: "THE SUMMIT RADIO" },
    oly4: { things: [[22, 4], [30, 8], [38, 4], [34, 14], [18, 10], [42, 12], [28, 0]].map(([x, z], i) => ["boulder", x, G(x, z), z, i * 0.7, [0x8a4a2a, 0x7a3a22, 0x9a5a3a][i % 3]]) },
    oly5: { title: "THE HIGH GREENHOUSE" },
    oly6: { center: [CX, 0, CZ - 22], radius: 16, robot: "dustkraken", height: 5.5, arms: true },
  };
  return {
    stars: [on(-60, -120, 0.2), [CX + 6, 3.2, CZ - 4], on(90, 20, 0.2)],
    spawn: on(CAMP.x - 2, CAMP.z - 2, 0.1), yaw: 0, bolt: on(CAMP.x - 4, CAMP.z - 1, 0), contact: [...on(CAMP.x + 3, CAMP.z, 0), -Math.PI / 2],
    at: { oly1: [CAMP.x + 5, CAMP.z + 10, 30], oly2: [-22, 14, 40], oly3: [CX - 10, CZ - 8, 10], oly4: [30, 22, 40], oly5: [GX + 8, GZ - 6, 40], oly6: [CX + 20, CZ - 30, 10] },
  };
}
