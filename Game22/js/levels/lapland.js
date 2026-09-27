// Lapland, Finland: a night of snow under the northern lights. Red cabins
// with woodpiles and snow on the roofs, a frozen lake the husky sleds race
// round, the ice hotel glowing blue, and reindeer in the pines.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks, lampAt, corridor } from "../seakit.js";
import { cabin, iceMat, snowman, reindeer, aurora, campfire, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("night");
  aurora(w, { n: 4 });
  const LAKE = [-40, 20], LR = 30;
  const f = (x, z) => {
    let h = Math.sin(x * 0.05) * Math.cos(z * 0.06) * 0.6 + Math.sin(x * 0.13 + z * 0.1) * 0.25;
    const d = Math.hypot(x - LAKE[0], z - LAKE[1]);
    if (d < LR) h = Math.min(h, -0.35 + Math.max(0, (d - LR + 6)) * 0.1);  // the frozen lake, flat and a little low
    if (z < -60) h += (-60 - z) * 0.4;
    if (x > 70) h += (x - 70) * 0.3;
    return h;
  };
  w.terrain(360, 150, f, M("snow", { args: [7], repeat: [40, 40], normal: 0.6 }));
  w.mountains(12, 260, 60, { seed: 11, snow: true, color: 0x3a4050 });
  // the ice on the lake, a shade bluer than the snow
  const ice = w.mesh(new THREE.CircleGeometry(LR - 3, 40), new THREE.MeshPhysicalMaterial({ color: 0xc8e4f4, roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }), LAKE[0], -0.3, LAKE[1], { rx: -Math.PI / 2, cast: false });
  void ice;
  // the village: cabins round the spawn, with woodpiles to jump from and snow on the roofs
  const CAB = [[8, 12, 0], [-2, 24, 0.4], [20, 2, -0.6], [4, -6, Math.PI / 2], [-8, -10, -0.3]];
  for (const [x, z, ry] of CAB) { const top = cabin(w, x, z, 7, 4.2, 6, ry, { seed: 12 + Math.round(x) }); w.box(7.6, 0.3, 6.6, M(0xf4f8fc), x, top + 4.2 * 0.3 + 0.2, z, { ry, collide: false }); }
  // a woodpile and a pad by the biggest cabin so the roof can be reached; more pads for the others
  for (const [x, z] of [[8, 17], [-2, 29], [20, -3], [4, -11]]) w.pad(x, f(x, z), z, 15, 0x7bed9f);
  campfire(w, -2, 10); snowman(w, 14, 22); snowman(w, -10, 30);
  for (const [x, z] of [[-2, 14], [12, -2], [-8, 12], [26, 12]]) lampAt(w, x, z, 3.6, 0xffe0a0, { ei: 3 });
  // pines all round, and the reindeer paddock to the south
  for (let i = 0; i < 40; i++) { const a = i * 0.9, r = 46 + (i * 13) % 30; const x = Math.cos(a) * r + 10, z = Math.sin(a) * r - 10; if (Math.hypot(x - LAKE[0], z - LAKE[1]) < LR + 4) continue; w.pine(x, z, 7 + (i % 4) * 1.5, { snow: true, y: f(x, z) }); }
  const fence = M(0x6a4a30);
  for (const [x0, z0, x1, z1] of [[-24, -22, 10, -22], [10, -22, 10, -44], [10, -44, -24, -44], [-24, -44, -24, -22]]) w.fence(x0, z0, x1, z1, 1.0, fence);
  w.phys.fixedBox(-7, 0, -22, 0.01, 0.01, 0.01);
  for (const [x, z, ry, red] of [[-16, -28, 0.3, true], [-6, -34, -0.6, false], [2, -28, 1.2, false], [-18, -38, 2.4, false], [4, -40, 0.4, false], [-8, -26, 1.8, false]]) reindeer(w, x, z, ry, { red });
  // the ice hotel: translucent walls of ice blocks, lit from inside, with a hall of pillars for the sneak
  const IX = 30, IZ = -26, im = iceMat();
  const hall = (x, z, hx, hz) => { w.box(hx * 2, 4.5, 0.8, im, x, f(x, z) + 2.25, z - hz); w.box(hx * 2, 4.5, 0.8, im, x, f(x, z) + 2.25, z + hz); w.box(0.8, 4.5, hz * 2, im, x - hx, f(x, z) + 2.25, z); w.box(0.8, 4.5, hz * 2 * 0.3, im, x + hx, f(x, z) + 2.25, z - hz * 0.65); w.box(0.8, 4.5, hz * 2 * 0.3, im, x + hx, f(x, z) + 2.25, z + hz * 0.65); w.box(hx * 2 + 1, 0.6, hz * 2 + 1, im, x, f(x, z) + 4.8, z, { collide: false }); };
  hall(IX, IZ, 16, 12);
  for (const [dx, dz] of [[-8, -5], [-8, 5], [0, -5], [0, 5], [8, -5], [8, 5]]) w.box(1.4, 4.4, 1.4, im, IX + dx, f(IX, IZ) + 2.2, IZ + dz);
  for (const [dx, dz] of [[-12, 0], [-4, -9], [4, 9], [12, 0]]) { const l = new THREE.PointLight(0x7fd8ff, 4, 14, 1.6); l.position.set(IX + dx, f(IX, IZ) + 2.5, IZ + dz); w.scene.add(l); }
  w.sign("ICE HOTEL", 4, 0.9, IX + 16.5, f(IX, IZ) + 3.4, IZ, Math.PI / 2, { bg: "#0a2a4a", fg: "#bfe8ff" });
  // the machine at the back: a jar with the aurora in it, on an ice plinth, and the lock beside it
  w.box(3, 1, 3, im, IX - 12, f(IX, IZ) + 0.5, IZ);
  const jarM = new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1, depthWrite: false });
  w.mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 16), jarM, IX - 12, f(IX, IZ) + 2.1, IZ, { collide: false, cast: false });
  const glow = w.mesh(new THREE.SphereGeometry(0.6, 16, 12), new THREE.MeshStandardMaterial({ color: 0x7bed9f, emissive: 0x7bed9f, emissiveIntensity: 2 }), IX - 12, f(IX, IZ) + 2.1, IZ, { collide: false, cast: false }); glow.userData.dynamic = true;
  w.updaters.push((dt, t) => { glow.material.emissive.setHSL(0.36 + Math.sin(t * 0.7) * 0.2, 0.9, 0.55); glow.scale.setScalar(1 + Math.sin(t * 2) * 0.1); });
  corridor(w, [IX + 22, f(IX + 22, IZ - 14), IZ - 16], [IX + 22, f(IX + 22, IZ - 14), IZ - 12], 4, im, 3);
  rocks(w, [[52, f(52, 20), 20, 2.4], [-60, f(-60, -20), -20, 3], [44, f(44, 40), 40, 2]], { color: 0x5a6068 });
  // the sled track round the lake, marked with lanterns on poles
  const TRACK = [[-40, -14], [-14, -6], [-8, 20], [-16, 44], [-40, 54], [-64, 44], [-72, 20], [-62, -6]];
  for (const [x, z] of TRACK) lampAt(w, x + 3, z + 3, 2.6, 0xffb040, { ei: 3 });

  const H = (x, z, dy = 1.1) => [x, f(x, z) + dy, z];
  const cabTop = (i, dx = 0, dz = 0) => { const [x, z] = CAB[i]; return [x + dx, f(x, z) + 4.2 + 4.2 * 0.3 + 1.3, z + dz]; };
  w.missionData = {
    lp1: { cells: [H(2, 16), H(-12, 10), cabTop(0), cabTop(0, 2, 1), cabTop(1), cabTop(2), cabTop(3), H(16, 18, 1.3), H(-16, 22)] },
    lp2: { path: TRACK, car: "sled", quarry: "sled", carOpts: { grip: 1.1, maxSpeed: 15, force: 1300 }, lead: 30, y: 0.25 },
    lp3: { start: [IX + 15, f(IX, IZ), IZ], goal: [IX - 12, f(IX, IZ), IZ + 2.5], range: 8, guards: [{ path: [[IX + 10, IZ - 8], [IX + 10, IZ + 8]], speed: 1.5, pause: 1.5 }, { path: [[IX + 2, IZ + 8], [IX + 2, IZ - 8]], speed: 1.5, pause: 1.5, phase: 6 }, { path: [[IX - 6, IZ - 8], [IX - 6, IZ + 8]], speed: 1.6, pause: 1.2, phase: 3 }] },
    lp4: { title: "AURORA LOCK" },
    lp5: { area: [-7, -33, 11], bots: [[-12, 0, -30], [0, 0, -38], [6, 0, -28], [-20, 0, -34], [8, 0, -42], [-6, 0, -24]] },
  };
  void groundAt;
  return { spawn: [2, f(2, 4) + 0.3, 4], yaw: Math.PI, bolt: [4, f(4, 5) + 0.3, 5], contact: [-2, f(-2, 2), 2, 0.8] };
}
