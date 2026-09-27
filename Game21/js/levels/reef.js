// The Great Barrier Reef: nothing but sea, a sand cay with three palms, and
// Ruby's dive pontoon moored over the reef flat. The coral garden runs out to
// the reef wall, which drops away into the blue; a canyon winds back in through
// the reef to the mouth of Undertow's pipe, and the pipe runs under the lagoon
// to a pump bigger than a house.
import * as THREE from "three";
import { M } from "../tex.js";
import { boat, coral } from "./kit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
// distance from (x, z) to a path of points
const toPath = (path, x, z) => { let best = 1e9; for (let i = 0; i + 1 < path.length; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; };

export function buildReef(w) {
  w.setSky({ top: "#1c6ed8", mid: "#8ccaf2", bottom: "#d8f0f4", sun: [62, 30], sunColor: "#fff8e8", sunI: 2.5, hemi: ["#d0ecff", "#3a7a8a", 0.66], fog: [140, 600], clouds: 16 });
  const LV = 0;
  const wallZ = x => -20 + Math.sin(x * 0.05) * 4;
  const CANYON = [[10, -34], [10, -22], [4, -10], [-4, -2], [-14, 2], [-26, 6], [-38, 10], [-46, 10]];
  const PIPE = { x0: -42, x1: -106, y: -11, z: 10, r: 3 }, PUMP = { x: -114, z: 10 };
  const h = (x, z) => {
    // the reef flat, the wall, the deep floor
    const flat = -2.5 + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.3 + Math.sin(x * 0.09 + 1) * Math.cos(z * 0.07) * 0.6, t = S(wallZ(x), wallZ(x) - 7, z);
    let y = flat * (1 - t) + (-30 + Math.sin(x * 0.07) * 1.5 - Math.max(0, -z - 60) * 0.05) * t;
    // the lagoon to the west, where the pipe lies on the floor
    y = y + (-14 - y) * S(-34, -46, x) * S(wallZ(x) - 2, wallZ(x) + 4, z);
    // the canyon cut through the reef
    const c = toPath(CANYON, x, z);
    if (c < 9) y = Math.min(y, -14 + (y + 14) * S(3.5, 8, c));
    // the sand cay
    const cay = Math.hypot(x - 46, (z - 36) * 1.3);
    if (cay < 16) y = Math.max(y, -2.2 + 3.8 * S(16, 5, cay));
    return y;
  };
  w.terrain(460, 230, h, M("sand", { args: [11, [214, 204, 172]], repeat: [90, 90] }));
  w.ocean({ level: LV, box: [-30, -10, 240, 120], shallow: 0x40e0d0, deep: 0x0a3a80, under: 0x1478a0, clear: 0.75, waves: 0.6, caustics: 7, see: 44 });
  // the cay's dry sand, the reef rock of the wall
  w.overlay(46, 36, 30, 26, M("sand", { args: [12, [240, 232, 206]], repeat: [8, 7] }), (x, z) => h(x, z) > -0.4, 0.04);
  w.overlay(0, -24, 240, 18, M("rock", { args: [91, [120, 104, 96]], repeat: [60, 5] }), (x, z) => { const t = S(wallZ(x), wallZ(x) - 7, z); return t > 0.05 && t < 0.97; }, 0.05);

  // ---- the pontoon: a floating deck with a shade roof, rails, a dive ladder; Ruby's boat alongside
  const deckM = M("wood", { args: [9, [176, 150, 112]], repeat: [6, 3] }), rail = M(0xe8ecf0, { metal: 0.6, rough: 0.3 });
  w.box(20, 1.6, 10, M(0xe8e8e0, { rough: 0.6 }), 0, 0.2, 10, { collide: false });
  w.box(20, 0.2, 10, deckM, 0, 1.1, 10);
  w.phys.fixedBox(0, 0.3, 10, 10, 0.9, 5);
  w.fence(-10, 15, 10, 15, 1, rail, { y: 1.2 }); w.fence(-10, 5, -10, 15, 1, rail, { y: 1.2 });
  w.fence(10, 5, 10, 11, 1, rail, { y: 1.2 });
  for (const [x, z] of [[-6, 8], [6, 8], [-6, 14], [6, 14]]) w.cyl(0.08, 0.08, 2.6, rail, x, 2.5, z, { seg: 6 });
  w.box(13, 0.12, 7, M(0x2a9ad8, { rough: 0.7, side: THREE.DoubleSide }), 0, 3.85, 11, { collide: false });
  w.sign("REEF DIVE", 3, 0.7, 0, 3.4, 7.45, Math.PI, { bg: "#0a4a8a", fg: "#ffffff" });
  w.steps(4, 1.4, 0.3, 0.3, rail, 3, -0.2, 3.6, 0);
  const dive = w.box(0.8, 0.5, 0.02, M(0xd82a2a), 9.3, 4.2, 5.2, { collide: false }); void dive;
  w.cyl(0.04, 0.04, 3, rail, 9.7, 2.6, 5.2, { collide: false, seg: 4 });
  boat(w, 14, -1.0, 11, 0.05, { color: 0xf0f0f0, size: 1.2, name: "CORAL QUEEN" });
  // the cay: palms, birds and a tiny beacon mast
  for (const [x, z, ht] of [[42, 36, 7], [48, 38, 8], [45, 32, 6]]) w.palm(x, z, ht, { y: h(x, z) - 0.2 });
  w.cyl(0.08, 0.1, 5, M(0xd8d8d8, { metal: 0.5 }), 52, h(52, 34) + 2.5, 34, { seg: 6 });
  school(w, 46, 14, 36, 18, 8, 0xf4f4f4);

  // ---- the coral garden over the reef flat and down the wall, kept clear of the canyon
  // spots that must stay clear: the lost clownfish, the golden starfish
  const KEEP = [[-20, 26], [30, -6], [-30, -12], [-18, 32], [30, 24], ...[-24, -12, -4, 8, 16, 26, -30, 36].map(x => [x, wallZ(x) - 4])];
  let seed = 11;
  for (let x = -60; x < 64; x += 3.3) for (let z = 34; z > -30; z -= 3.3) {
    const jx = x + Math.sin(seed * 1.3) * 1.6, jz = z + Math.cos(seed * 1.9) * 1.6, y = h(jx, jz); seed++;
    if (y > -1.2 || y < -28 || KEEP.some(([kx, kz]) => Math.hypot(jx - kx, jz - kz) < 4) || toPath(CANYON, jx, jz) < 8 || jx < -36 || (Math.abs(jx) < 12 && jz > 3 && jz < 17) || Math.hypot(jx - 14, jz - 22) < 4) continue;
    if ((seed * 7) % 10 < 3) continue;
    coral(w, jx, y, jz, 0.8 + (seed % 5) * 0.35, seed);
  }
  // the anemone the clownfish live in
  const anem = M(0xd870c0, { rough: 0.6, emissive: 0xd060b0, ei: 0.15 }), ax = 14, az = 22, ay = h(ax, az);
  const tent = [];
  for (let k = 0; k < 40; k++) { const a = k * 2.4, d = Math.sqrt(k / 40) * 1.4, t = w.mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 5), anem, ax + Math.cos(a) * d, ay + 0.3, az + Math.sin(a) * d, { cast: false }); t.userData.dynamic = true; tent.push(t); }
  w.updaters.push(() => tent.forEach((t, i) => { t.rotation.x = Math.sin(w.t * 1.6 + i) * 0.25; t.rotation.z = Math.cos(w.t * 1.3 + i * 0.7) * 0.25; }));
  for (let k = 0; k < 3; k++) { const f = critter("clownfish", 1.3), a = k * 2.1; w.scene.add(f); w.updaters.push((dt, t) => { f.position.set(ax + Math.cos(t * 0.8 + a) * 1.1, ay + 0.8 + Math.sin(t * 1.3 + a) * 0.2, az + Math.sin(t * 0.8 + a) * 1.1); f.rotation.y = -t * 0.8 - a; animateCritter(f, dt, 0.7); }); }

  // ---- the pipe: a steel tube lying through the lagoon, from its mouth in the canyon to the pump
  const pipeM = M("metal", { args: [9, [104, 118, 110], 128], repeat: [12, 3], side: THREE.DoubleSide, rough: 0.6, metal: 0.5 });
  const len = PIPE.x0 - PIPE.x1, cx = (PIPE.x0 + PIPE.x1) / 2;
  w.mesh(new THREE.CylinderGeometry(PIPE.r, PIPE.r, len, 28, 1, true), pipeM, cx, PIPE.y, PIPE.z, { rz: Math.PI / 2 });
  const facets = 16, q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let k = 0; k < facets; k++) {
    const a = k / facets * Math.PI * 2, R = PIPE.r + 0.15;
    q.setFromEuler(e.set(a, 0, 0));
    w.phys.fixedBox(cx, PIPE.y + Math.cos(a) * R, PIPE.z + Math.sin(a) * R, len / 2, 0.15, Math.PI * R / facets + 0.05, 0, { q });
  }
  const band = M(0x3a4a44, { metal: 0.6, rough: 0.5 });
  for (let x = PIPE.x1 + 4; x < PIPE.x0; x += 8) w.mesh(new THREE.TorusGeometry(PIPE.r + 0.1, 0.18, 8, 28), band, x, PIPE.y, PIPE.z, { ry: Math.PI / 2 });
  w.mesh(new THREE.TorusGeometry(PIPE.r + 0.2, 0.35, 10, 32), M(0xf0c020, { metal: 0.4, emissive: 0x6a5000, ei: 0.4 }), PIPE.x0, PIPE.y, PIPE.z, { ry: Math.PI / 2 });
  for (let x = PIPE.x1 + 8; x < PIPE.x0; x += 16) for (const s of [-1, 1]) w.box(0.6, 1.6, 0.6, band, x, -13.2, PIPE.z + s * 2.6);
  // the pump: a tower with a slowly turning fan where the pipe meets it
  const pumpM = M("metal", { args: [10, [80, 92, 104], 64], repeat: [4, 3], metal: 0.6, rough: 0.4 });
  w.cyl(6, 7, 12, pumpM, PUMP.x, -8, PUMP.z, { seg: 24 });
  w.cyl(6.2, 6.2, 0.6, M(0x39c0ff, { emissive: 0x39c0ff, ei: 1.6 }), PUMP.x, -3, PUMP.z, { seg: 24, collide: false });
  w.cyl(3, 4, 3, pumpM, PUMP.x, -0.5, PUMP.z, { seg: 16 });
  const fan = new THREE.Group(); fan.position.set(PIPE.x1 + 0.4, PIPE.y, PIPE.z); w.scene.add(fan);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.4, 0.8), M(0x8a939e, { metal: 0.8 })); b.rotation.x = k * Math.PI / 4; fan.add(b); b.userData.dynamic = true; }
  w.updaters.push(dt => { fan.rotation.x += dt * 1.2; });
  w.phys.fixedBox(PIPE.x1 - 0.2, PIPE.y, PIPE.z, 0.2, PIPE.r, PIPE.r);
  w.sign("DRIP PUMP 7", 5, 1, PUMP.x + 6.9, -6, PUMP.z + 3, Math.PI / 2 + 0.4, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });

  // ---- life: turtles, a manta, reef sharks, shoals of every colour, bubble streams on the wall
  roam(w, "seaturtle", { cx: 10, cz: 0, rx: 20, rz: 10, y: -1.2, dy: 0.3, period: 70 });
  roam(w, "seaturtle", { cx: -10, cz: -30, rx: 12, rz: 6, y: -14, dy: 1, period: 50, dir: -1 });
  roam(w, "manta", { cx: 10, cz: -44, rx: 30, rz: 12, y: -12, dy: 1, period: 60, scale: 1.8 });
  school(w, 20, -1.3, 10, 50, 5, 0xffd23a); school(w, -20, -1.4, 20, 40, 4, 0x3ae0ff); school(w, 30, -8, -24, 60, 6, 0x7a9aff);
  school(w, -8, -14, -34, 40, 6, 0xc8d8e8); school(w, -90, -9, 26, 30, 4, 0xff8a3a);
  const vents = [[-16, -21], [18, -22], [2, -24]].map(([x, z]) => { const y = h(x, z); w.vent(x, y, z, 40); return [x, y, z]; });
  void vents;
  w.floorY = -40;

  // the pearls down the wall: each a little out from the face, deeper and deeper
  const onWall = (x, depth) => { let z = wallZ(x); while (h(x, z) > depth && z > wallZ(x) - 9) z -= 0.25; return [x, depth + 0.3, z - 1.2]; };
  const ring = (x, y, z, a) => [x, y, z, 2.6, a];
  w.missionData = {
    reef1: { cells: [onWall(-24, -6), onWall(-12, -10), onWall(-4, -14), onWall(8, -18), onWall(16, -22), onWall(26, -25), onWall(-30, -20), onWall(36, -12)], floor: -32 },
    reef2: { sub: [10, -8, -38, 0], exit: [0, 1.3, 12], rings: [ring(10, -10, -26, 0), ring(8, -11, -16, -0.46), ring(1, -11, -6, -0.78), ring(-9, -11, 0, -1.2), ring(-20, -11, 4, -1.25), ring(-32, -11, 8, -1.25), ring(-40, -11, 10, -Math.PI / 2)], floor: -32 },
    reef3: { sub: [-35, -11, 10, -Math.PI / 2], exit: [0, 1.3, 12], dark: true, floor: -16,
      marks: [[-52, -11.5, 11.2], [-64, -10.2, 9], [-76, -12, 10.8], [-88, -10.4, 9.2], [-99, -11.2, 10.4]] },
    reef4: { sub: [-26, -9, 2, Math.PI], exit: [0, 1.3, 12], thing: "rock", items: [[-14, 1.5], [4, -9], [16, -30], [-8, -32]].map(([x, z]) => [x, h(x, z) + 0.7, z]), pad: [-38.5, -14, 10], padR: 2.6, floor: -32 },
    reef5: { area: [-94, 28, 10], bots: [[-90, -14, 24], [-98, -14, 30], [-86, -14, 32], [-102, -14, 22], [-94, -14, 36], [-88, -14, 20]], floor: -16 },
    reef6: { critter: "clownfish", kids: [[-20, -1.2, 26], [30, -1.2, -6], [-30, -1.3, -12]], goal: [ax, ay + 0.9, az], goalR: 2.4 },
  };
  return {
    stars: [[-18, h(-18, 32), 32], [30, h(30, 24), 24], [50, h(50, 38), 38]],
    spawn: [0, 1.25, 12], yaw: Math.PI, bolt: [-2, 1.25, 12], contact: [3, 1.25, 13, Math.PI * 0.9],
    at: { reef1: [-7, 7], reef2: [7, 7], reef3: [-7, 13.5], reef4: [7, 13.5], reef5: [-2, 6.5], reef6: [2.5, 6.5] },
  };
}
