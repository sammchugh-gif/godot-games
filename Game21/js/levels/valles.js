// Valles Marineris, the great canyon of Mars, at sunset (on Mars the sunset is blue). Rory
// starts on the south rim; the canyon falls away to the north in great steps: a ledge ten metres
// down, another ten below that, and then the floor, thirty-two metres down, with the far wall
// rising beyond. A trail zig-zags down at the west end. Undertow's pipeline runs along the
// floor (east, and then up the far wall, north); her pump station juts out of the cliff on the
// lower ledge.
import * as THREE from "three";
import { M } from "../tex.js";
import { marsGround, marsRock, strataMat, strata } from "./spacekit.js";

const sm = t => t * t * (3 - 2 * t);
const step = (z, z0, z1, a, b) => z <= z0 ? a : z >= z1 ? b : a + (b - a) * sm((z - z0) / (z1 - z0));
function terrace(z) {
  if (z < -16) return step(z, -22, -16, 0, -10);
  if (z < 4) return step(z, 0, 4, -10, -20);
  if (z < 22) return step(z, 16, 22, -20, -32);
  if (z < 130) return step(z, 80, 118, -32, 46);
  return step(z, 150, 172, 46, 60);
}
export const TRAIL_X = -90;
export function ground(x, z) {
  const w = Math.min(1, Math.max(0, (16 - Math.abs(x - TRAIL_X)) / 8));
  const ramp = z < -22 ? 0 : z > 40 ? -32 : -32 * (z + 22) / 62;
  const t = terrace(z), base = t + (ramp - t) * w;
  // a little roughness
  const h = base + Math.sin(x * 0.07 + z * 0.03) * 0.35 + Math.cos(x * 0.13 - z * 0.11) * 0.2;
  // (under the pump station's deck, kept below it)
  return x > 38 && x < 74 && z > 3 && z < 23 ? Math.min(h, -20.8) : h;
}

export function buildValles(w) {
  w.setSky("marsdusk");
  const G = ground;
  w.terrain(440, 180, G, marsGround(341, [184, 100, 64], 80));
  w.phys.fixedBox(0, -50, 0, 400, 1, 400);
  w.floorY = -60;
  // layered rock on every cliff face
  const steep = (x, z) => Math.hypot(G(x + 0.5, z) - G(x - 0.5, z), G(x, z + 0.5) - G(x, z - 0.5));
  strata(w.overlay(0, 20, 440, 400, strataMat(), (x, z) => steep(x, z) > 0.7, 0.05), 0.08);

  // ---- the rim: rocks (clear of the chase), a look-out with a rail and a sign
  const LOOP = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; LOOP.push([Math.cos(a) * 50, -82 + Math.sin(a) * 24]); }
  const nearLoop = (x, z, m) => LOOP.some(([ax, az], i) => { const [bx, bz] = LOOP[(i + 1) % LOOP.length], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2)); return Math.hypot(ax + vx * t - x, az + vz * t - z) < m; });
  for (let i = 0; i < 60; i++) {
    const a = i * 2.39996, d = 20 + (i * 53) % 150, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (nearLoop(x, z, 8) || Math.abs(x - TRAIL_X) < 14 || (z > -30 && z < 60 && x > -80 && x < 100) || Math.hypot(x + 18, z + 34) < 10) continue;
    marsRock(w, x, G(x, z), z, 0.5 + (i % 6) * 0.4, { collide: i % 6 > 1, base: [110, 56, 38] });
  }
  const railM = M(0xd8dde4, { metal: 0.5, rough: 0.4 });
  w.fence(-30, -23, -8, -23, 1.1, railM, { y: 0.15 });
  w.sign("VALLES MARINERIS  ·  4000 km", 6, 0.9, -19, 2.4, -24.5, 0, { bg: "#2a1208", fg: "#ffb070", glow: 0.7 });
  w.box(0.2, 2, 0.2, railM, -19, 1, -24.6);
  // cairns marking the trail down at the west end
  for (let k = 0; k < 6; k++) { const z = -24 + k * 12, x = TRAIL_X + (k % 2 ? 5 : -5); marsRock(w, x, G(x, z), z, 0.45, { collide: false, sy: 1.4 }); }

  // ---- the pipeline along the floor (a pipe you can't walk under), east and then up the far wall
  const pipeM = M("metal", { args: [343, [90, 110, 120], 64], repeat: [30, 1], metal: 0.6, rough: 0.4 }), teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 0.9 });
  const FL = -32, PZ = 46, PX0 = -60, PX1 = 90, PY = FL + 1.9;
  w.mesh(new THREE.CylinderGeometry(1.4, 1.4, PX1 - PX0, 20), pipeM, (PX0 + PX1) / 2, PY, PZ, { rz: Math.PI / 2 });
  w.phys.fixedBox((PX0 + PX1) / 2, PY, PZ, (PX1 - PX0) / 2, 1.4, 1.4);
  for (let x = PX0 + 6; x < PX1; x += 12) { w.box(0.6, 1.2, 3.4, M(0x3a3f48, { metal: 0.6 }), x, FL + 0.3, PZ); w.mesh(new THREE.TorusGeometry(1.45, 0.12, 6, 20), teal, x, PY, PZ, { ry: Math.PI / 2, cast: false }); }
  // (the turn north, and the climb up the far wall)
  const up = new THREE.CatmullRomCurve3([new THREE.Vector3(PX1, PY, PZ), new THREE.Vector3(PX1 + 4, PY, PZ + 6), new THREE.Vector3(PX1 + 4, PY, 74), new THREE.Vector3(PX1 + 4, G(PX1 + 4, 92) + 1.6, 92), new THREE.Vector3(PX1 + 4, G(PX1 + 4, 118) + 1.6, 118), new THREE.Vector3(PX1 + 4, G(PX1 + 4, 200) + 1.6, 200)]);
  w.mesh(new THREE.TubeGeometry(up, 60, 1.4, 12), pipeM, 0, 0, 0);
  w.phys.fixedBox(PX1 + 4, PY, 60, 1.4, 1.4, 14);
  // the pump inlet at the west end: where the pipe starts
  w.box(8, 6, 8, M("metal", { args: [345, [70, 80, 96], 64], repeat: [2, 2], metal: 0.5 }), PX0 - 4, FL + 3, PZ);
  w.sign("UNDERTOW PIPELINE", 5, 0.8, PX0 - 4, FL + 4.5, PZ - 4.05, Math.PI, { bg: "#061a2a", fg: "#2ad0c0", glow: 1 });
  // the laser corridor along the pipe: a wall on the canyon side, the pipe on the other
  const LX0 = 8, LX1 = 40;
  w.box(LX1 - LX0, 3, 0.4, M("metal", { args: [347, [90, 96, 110], 64], repeat: [8, 1] }), (LX0 + LX1) / 2, FL + 1.5, 38.4);
  // the valve station by the inlet
  for (let k = 0; k < 4; k++) { w.cyl(0.35, 0.35, 1.4, M(0x3a3f48, { metal: 0.6 }), -40 + k * 3, FL + 0.7, PZ - 2.6, { seg: 10 }); w.mesh(new THREE.TorusGeometry(0.45, 0.08, 6, 16), M(0xe83a2a), -40 + k * 3, FL + 1.5, PZ - 2.6, { rx: Math.PI / 2, cast: false }); }

  // ---- the pump station, jutting out from the cliff on the lower ledge
  const SY = -20, stM = M("metal", { args: [349, [110, 116, 128], 64], repeat: [8, 5], metal: 0.4, rough: 0.6 });
  w.box(32, 1, 18, stM, 56, SY - 0.5, 13);
  for (const [x, z] of [[42, 21], [56, 21], [70, 21]]) w.box(1, SY - FL, 1, M(0x3a3f48, { metal: 0.6 }), x, (SY + FL) / 2 - 0.5, z);
  w.building(8, 5, 10, 68, 11, { y: SY, wall: [120, 130, 146], seed: 351, win: { lit: 0.8, glass: "#2ad0c0" }, trim: 0x2ad0c0 });
  w.sign("PUMP STATION", 5, 0.8, 63.95, SY + 4, 11, -Math.PI / 2, { bg: "#061a2a", fg: "#2ad0c0", glow: 1 });
  for (const [x, z, sx, sz] of [[50, 8, 2, 2], [50, 17, 2, 2], [57, 12, 2, 4]]) w.box(sx, 2.4, sz, M(0x4a5a6a, { metal: 0.6, rough: 0.4 }), x, SY + 1.2, z);
  // (its own pipe down to the main one)
  w.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(60, SY - 0.6, 21.5), new THREE.Vector3(60, SY - 3, 26), new THREE.Vector3(60, FL + 3.5, 38), new THREE.Vector3(60, PY + 1, 45)]), 24, 0.6, 10), pipeM, 0, 0, 0);

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  w.missionData = {
    val1: { path: LOOP, y: 0.4, car: "rover", carOpts: { grip: 2.4 }, quarry: "rover", lead: 26 },
    val2: { cells: [on(30, -8), on(10, -8), on(-10, -8), on(-30, 10), on(-50, 10), on(-50, 32), on(-25, 34), on(0, 34)] },
    val3: { start: [LX0 + 0.5, FL + 0.1, 41.6], goal: [LX1 - 0.5, FL + 0.1, 41.6], width: 5.6, beams: 10 },
    val4: { title: "PIPELINE VALVES" },
    val5: { heli: true, ceiling: 20, rings: [[0, 3, -26, 2.6, 0], [10, -4, -10, 2.6, 0.5], [24, -14, 8, 2.6, 0.9], [36, -26, 24, 2.6, 1.2], [50, -25, 32, 2.6, Math.PI / 2], [74, -12, 24, 2.6, 2.4]] },
    val6: { range: 7, angle: 30, start: [42, SY + 0.1, 8], goal: [62.5, SY + 0.1, 11],
      guards: [{ path: [[46, 5], [46, 21]], speed: 1.2, y: SY }, { path: [[54, 21], [54, 5]], speed: 1.1, phase: 3, y: SY }, { path: [[61, 5], [61, 20]], speed: 1.0, phase: 6, y: SY }] },
  };
  return {
    stars: [on(TRAIL_X, 20, 0.2), [66, SY + 0.2, 19], on(130, 160, 0.2)],
    spawn: on(-20, -34, 0.1), yaw: 0, bolt: on(-22, -35, 0), contact: [...on(-15, -32, 0), -Math.PI / 2],
    at: { val1: [-4, -40, 20], val2: [34, -28, 20], val3: [2, 36, -20], val4: [-34, 40, -20], val5: [4, -30, 20], val6: [34, 8, -10] },
  };
}
