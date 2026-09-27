// The Midnight Zone: a kilometre down, where no sunlight has ever reached. The
// only light is alive: plankton that sparkles when you swim through it, jellies
// that pulse, lanternfish shoals, an anglerfish's lure. A canyon splits the
// plain; POLARIS's dive bell sits on its eastern lip with TORPEDO beside it; a
// jelly current drifts through the canyon; and somewhere far below, someone
// flashes a lamp every night.
import * as THREE from "three";
import { M } from "../tex.js";
import { diveBell } from "./deepkit.js";
import { subModel } from "../craft.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const toPath = (path, x, z) => { let best = 1e9; for (let i = 0; i + 1 < path.length; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; };

export function buildMidnight(w) {
  w.setSky({ top: "#000308", mid: "#01050c", bottom: "#000206", sun: [80, 30], sunColor: "#2a4a7a", sunI: 0.12, hemi: ["#1a3a6a", "#020408", 0.16], fog: null, clouds: 0 });
  const CANYON = [[60, -60], [30, -30], [0, -20], [-30, -8], [-60, 10], [-100, 20]];
  const h = (x, z) => {
    let y = Math.sin(x * 0.07) * Math.cos(z * 0.06) * 1.5 + Math.sin(x * 0.2 + z * 0.13) * 0.4;
    const c = toPath(CANYON, x, z);
    y -= 30 * S(16, 6, c);
    return y;
  };
  w.terrain(420, 180, h, M("sand", { args: [11, [70, 74, 84]], repeat: [80, 80] }));
  w.ocean({ level: 1200, abyss: { top: 0, bottom: -40, k: [0.9, 1] }, under: 0x04142a, deepUnder: 0x000206, see: 30, room: 50 });
  w.floorY = -80; w.dark = true;
  // rock pillars and boulders on the plain
  const rock = M("rock", { args: [91, [60, 60, 66]], repeat: [2, 3], rough: 0.95 });
  let seed = 3; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let k = 0; k < 26; k++) {
    const x = -140 + R() * 260, z = -110 + R() * 200; if (toPath(CANYON, x, z) < 20 || Math.hypot(x - 40, z - 30) < 16) continue;
    const ht = 4 + R() * 10, r = 1.5 + R() * 2.5;
    w.cyl(r * 0.7, r, ht, rock, x, h(x, z) + ht / 2 - 0.5, z, { seg: 7 });
  }

  // ---- the dive bell and TORPEDO parked beside it (where Glim is taken home to)
  const bell = diveBell(w, 40, h(40, 30), 30);
  const home = subModel(); home.position.set(50, h(50, 38) + 1.4, 38); home.rotation.y = -2.2; home.traverse(n => { if (n.isMesh) n.userData.dynamic = true; }); w.scene.add(home);
  w.phys.fixedBox(50, h(50, 38) + 1.4, 38, 1.2, 1.1, 2.2, -2.2);
  const hl = new THREE.SpotLight(0xfff0d0, 50, 30, 0.5, 0.5, 1.2); hl.position.set(50, h(50, 38) + 1.8, 38); const ht0 = new THREE.Object3D(); ht0.position.set(50 - 10 * Math.sin(2.2), h(50, 38), 38 - 10 * Math.cos(2.2)); w.scene.add(hl); w.scene.add(ht0); hl.target = ht0;

  // ---- the living lights: sparkling plankton everywhere, drifting
  const N = 2400, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), pal = [[0.3, 1, 0.9], [0.4, 0.7, 1], [0.7, 1, 0.5], [0.9, 0.5, 1]];
  for (let i = 0; i < N; i++) { pos[i * 3] = -140 + R() * 260; pos[i * 3 + 2] = -120 + R() * 220; pos[i * 3 + 1] = h(pos[i * 3], pos[i * 3 + 2]) + 1 + R() * 30; const c = pal[i % 4]; col.set(c, i * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const plank = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  plank.frustumCulled = false; plank.userData.dynamic = true; w.scene.add(plank);
  w.updaters.push((dt, t) => { plank.position.y = Math.sin(t * 0.1) * 0.6; plank.material.opacity = 0.7 + Math.sin(t * 1.3) * 0.15; });
  // jellies drifting on the canyon's current, and a few loose ones
  const CUR = [[40, -12, -40], [24, -16, -26], [4, -20, -18], [-18, -22, -10], [-40, -24, 2], [-62, -24, 12], [-86, -24, 18]];
  w.current(CUR, 4, 6);
  const jellies = [];
  for (let k = 0; k < 10; k++) { const j = critter("jelly", 0.9 + (k % 3) * 0.3); w.scene.add(j); jellies.push(j); }
  const curve = new THREE.CatmullRomCurve3(CUR.map(p => new THREE.Vector3(...p)));
  w.updaters.push((dt, t) => jellies.forEach((j, k) => { const u = ((t * 0.012 + k / jellies.length) % 1), p = curve.getPointAt(u); j.position.set(p.x + Math.sin(k * 2.1) * 2.6, p.y + Math.cos(k * 1.3) * 2, p.z + Math.cos(k * 2.1) * 2.6); animateCritter(j, dt, 0.3); }));
  // lanternfish, an anglerfish with its lure, a slow giant squid-shaped shadow (a manta, darkly)
  school(w, -20, -6, 40, 80, 6, 0x6ad8ff, 2.4); school(w, 20, -8, -60, 60, 5, 0x9aff7a, 2);
  const angler = critter("angler", 2.2); angler.position.set(-40, h(-40, -40) + 3, -40); w.scene.add(angler);
  w.updaters.push((dt, t) => { angler.position.x = -40 + Math.sin(t * 0.05) * 10; angler.rotation.y = Math.cos(t * 0.05) > 0 ? Math.PI / 2 : -Math.PI / 2; animateCritter(angler, dt, 0.2); });
  w.airStation(0, h(0, 30), 30); w.airStation(-60, h(-60, -30), -30); w.airStation(-40, h(-40, 40), 40); w.vent(10, h(10, -20), -20, 16);

  // ---- the lamp far below: at the bottom of the canyon, flashing (the morse)
  const LAMP = { x: -100, z: 20 }, ly = h(LAMP.x, LAMP.z);
  const lamp = w.mesh(new THREE.SphereGeometry(0.6, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xfff0c0, emissiveIntensity: 2 }), LAMP.x, ly + 1.5, LAMP.z, { cast: false }); lamp.userData.dynamic = true;
  const ll = new THREE.PointLight(0xfff0c0, 10, 30, 1.4); ll.position.set(LAMP.x, ly + 2, LAMP.z); w.scene.add(ll);
  w.updaters.push((dt, t) => { const on = (t % 3) < 0.4 || ((t % 3) > 0.7 && (t % 3) < 1.6) ? 1 : 0.05; lamp.material.emissiveIntensity = 2 * on; ll.intensity = 10 * on; });

  // ---- the missions
  const bed = (x, z, up = 1.2) => [x, h(x, z) + up, z];
  w.missionData = {
    mid1: { cells: [bed(20, 20, 2), bed(4, 44, 3), bed(-20, 40, 5), bed(-30, 10, 3), bed(-40, -36, 5), bed(-8, -24, 2), bed(22, -48, 3)], floor: -40 },
    mid2: { rings: [[24, -16, -26, 2.8], [4, -20, -18, 2.8], [-18, -22, -10, 2.8], [-40, -24, 2, 2.8], [-62, -24, 12, 2.8], [-86, -24, 18, 2.8]], floor: -40 },
    mid3: { area: [-70, -40, 14], bots: [[-64, 0, -36], [-72, 0, -44], [-78, 0, -34], [-60, 0, -46], [-82, 0, -46], [-68, 0, -28]], floor: -30, lamps: true },
    mid4: { sub: [34, -6, 18, -Math.PI * 0.75], exit: bell.spawn, dark: true, floor: -40,
      marks: [bed(26, -32, 2.5), bed(0, -22, 2.5), bed(-28, -10, 2.5), bed(-56, 6, 2.5), bed(-80, 16, 2.5), bed(-104, 20, 2.5)] },
    mid5: { word: "MISTAKE", title: "THE LAMP BELOW" },
    mid6: { critter: "glim", water: true, kids: [bed(-110, 40, 3)], goal: [50, h(50, 38) + 2.2, 42], goalR: 3.5, floor: -40 },
  };
  return {
    stars: [bed(-120, -60, 0.3), bed(60, -80, 0.3), bed(-20, 70, 0.3)],
    spawn: bell.spawn, yaw: -Math.PI / 2, bolt: [bell.hole[0] + 3.8, bell.F + 0.1, bell.hole[1] - 1.5], contact: null,
    swimTop: 10, lamp: 40,
    at: { mid1: [37.5, 33.5, bell.F + 1], mid2: [42.5, 33.5, bell.F + 1], mid3: [37.5, 26.5, bell.F + 1], mid4: [42.5, 26.5, bell.F + 1], mid5: [36.5, 28.5, bell.F + 1], mid6: [-104, 40, 6] },
  };
}
