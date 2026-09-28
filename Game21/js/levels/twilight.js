// The Twilight Zone: two hundred metres down, where the last blue light gives
// out. A shelf in the east, where POLARIS's dive bell sits beside Dr Hiro's deep
// sub Kaiko, falls away down a long slope cut by a canyon. At the foot of the
// slope Undertow's pipes meet at a junction, and a cold current pours down the
// slope beside them. Lanternfish glow in shoals; a Drip beacon blinks its code.
import * as THREE from "three";
import { M } from "../tex.js";
import { diveBell } from "./deepkit.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const toPath = (path, x, z) => { let best = 1e9; for (let i = 0; i + 1 < path.length; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; };

export function buildTwilight(w) {
  w.setSky({ top: "#020c18", mid: "#041626", bottom: "#010610", sun: [80, 30], sunColor: "#4a8ac8", sunI: 0.35, hemi: ["#2a5a8a", "#040a10", 0.3], fog: null, clouds: 0 });
  const CANYON = [[40, -30], [10, -26], [-20, -34], [-50, -30], [-80, -40]];
  const JUNCTION = { x: -64, z: 8 };
  const h = (x, z) => {
    // the shelf (y 0) in the east, the slope down to the plain (y -56) in the west
    let y = -56 * S(20, -50, x) + Math.sin(x * 0.12) * Math.cos(z * 0.1) * 0.8 + Math.sin(z * 0.04 + x * 0.02) * 2;
    const c = toPath(CANYON, x, z);
    if (c < 10) y -= 12 * S(10, 3, c) * S(46, 20, x);
    return y;
  };
  w.terrain(420, 180, h, M("sand", { args: [11, [96, 104, 110]], repeat: [80, 80] }));
  w.ocean({ level: 400, abyss: { top: 10, bottom: -70, k: [0.72, 0.97] }, under: 0x0a2a4a, deepUnder: 0x01060e, see: 34, room: 60 });
  w.floorY = -100; w.dark = true;

  // ---- the shelf: the dive bell and Kaiko, a white deep sub on skids
  const bell = diveBell(w, 30, h(30, 10), 10);
  const kaiko = new THREE.Group(); kaiko.position.set(38, h(38, 22) + 1.4, 22); kaiko.rotation.y = -0.6; w.scene.add(kaiko);
  const kw = M(0xf0f0ec, { rough: 0.4 }), ko = M(0xf07a1a, { rough: 0.5 });
  const add = (geo, m, x, y, z) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); e.castShadow = true; kaiko.add(e); return e; };
  add(new THREE.CapsuleGeometry(1.4, 4, 8, 16), kw, 0, 0, 0).rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2a4a6a, metalness: 0.6, roughness: 0.1 }), 0, 0.1, 2.9);
  add(new THREE.BoxGeometry(0.3, 1.4, 1.6), ko, 0, 1.6, -1.4);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, 0.2, 4.6), ko, sx * 1.1, -1.4, 0);
  w.phys.fixedBox(38, h(38, 22) + 1.4, 22, 1.5, 1.5, 3.2, -0.6);
  const kl = new THREE.SpotLight(0xfff0d0, 60, 30, 0.5, 0.5, 1.2); kl.position.set(0, 0.3, 3.4); const kt = new THREE.Object3D(); kt.position.set(0, -2, 12); kaiko.add(kl); kaiko.add(kt); kl.target = kt;
  w.sign("KAIKO", 2.6, 0.6, 38 + Math.cos(0.6) * 1.45, h(38, 22) + 1.9, 22 + Math.sin(0.6) * 1.45, Math.PI / 2 - 0.6, { bg: "#f0f0ec", fg: "#1a2a4a" });

  // ---- Undertow's pipes: three come down the slope and meet at the junction on the plain
  const pipeM = M("metal", { args: [9, [96, 110, 104], 128], repeat: [10, 2], rough: 0.6, metal: 0.5 }), band = M(0x3a4a44, { metal: 0.6, rough: 0.5 });
  const lay = pts => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, ry = Math.atan2(bx - ax, bz - az);
      const ya = h(ax, az) + 1.3, yb = h(bx, bz) + 1.3, cy = (ya + yb) / 2, pitch = Math.atan2(yb - ya, L), len = Math.hypot(L, yb - ya);
      const m = w.mesh(new THREE.CylinderGeometry(1.1, 1.1, len + 0.8, 18), pipeM, cx, cy, cz);
      m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2 - pitch, ry, 0, "YXZ"));
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-pitch, ry, 0, "YXZ"));
      w.phys.fixedBox(cx, cy, cz, 1.0, 1.0, len / 2, 0, { q });
      for (let s = 5; s < L; s += 10) w.mesh(new THREE.TorusGeometry(1.2, 0.12, 8, 24), band, ax + (bx - ax) * s / L, ya + (yb - ya) * s / L, az + (bz - az) * s / L, { ry });
    }
  };
  const PIPES = [[[-60, 70], [-62, 40], [JUNCTION.x, JUNCTION.z + 5]], [[-110, -20], [-90, -6], [JUNCTION.x - 5, JUNCTION.z]], [[-40, -60], [-54, -30], [JUNCTION.x, JUNCTION.z - 5]]];
  for (const p of PIPES) lay(p);
  // the junction: a squat tank with three valve wheels and a panel
  const jy = h(JUNCTION.x, JUNCTION.z);
  w.cyl(4.2, 4.6, 5, M("metal", { args: [10, [80, 92, 104], 64], repeat: [3, 2], metal: 0.6, rough: 0.4 }), JUNCTION.x, jy + 2.5, JUNCTION.z, { seg: 20 });
  w.cyl(4.3, 4.3, 0.4, M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 1.4 }), JUNCTION.x, jy + 5.1, JUNCTION.z, { seg: 20, collide: false });
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; w.mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 20), M(0xe83a2a, { emissive: 0x6a0a0a, ei: 0.5 }), JUNCTION.x + Math.cos(a) * 4.5, jy + 2.2, JUNCTION.z + Math.sin(a) * 4.5, { ry: -a + Math.PI / 2 }); }
  w.sign("JUNCTION 3", 4, 0.8, JUNCTION.x + 4.7, jy + 3.8, JUNCTION.z, Math.PI / 2, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });
  const jl = new THREE.PointLight(0x2ad0c0, 10, 22, 1.4); jl.position.set(JUNCTION.x, jy + 7, JUNCTION.z); w.scene.add(jl);

  // ---- the Drip beacon: a mast on the plain with a blinking lamp on top
  const BEACON = { x: -30, z: 40 }, by = h(BEACON.x, BEACON.z);
  w.cyl(0.2, 0.3, 8, M(0x3a1a5a, { metal: 0.5 }), BEACON.x, by + 4, BEACON.z, { seg: 8 });
  const blink = w.mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshStandardMaterial({ color: 0xff3a6a, emissive: 0xff3a6a, emissiveIntensity: 2 }), BEACON.x, by + 8.4, BEACON.z, { cast: false }); blink.userData.dynamic = true;
  const bl = new THREE.PointLight(0xff3a6a, 8, 18, 1.5); bl.position.set(BEACON.x, by + 8.4, BEACON.z); w.scene.add(bl);
  w.updaters.push((dt, t) => { const on = Math.sin(t * 5) > 0.3 ? 1 : 0.1; blink.material.emissiveIntensity = 2 * on; bl.intensity = 8 * on; });

  // ---- the cold current down the slope beside the canyon
  const CUR = [[34, 4.5, -12], [16, 2.5, -18], [0, -8, -18], [-16, -26, -14], [-32, -38, -8], [-46, -48, -2], [-54, -52, 4]];
  w.current(CUR, 3.6, 7);

  // ---- life that glows: lanternfish shoals, jellies, a squid on patrol
  const SHOAL = { x: -20, y: h(-20, 34) + 4, z: 34 };
  school(w, SHOAL.x, SHOAL.y, SHOAL.z, 90, 6, 0x6ad8ff, 2.2);
  school(w, 10, -10, 30, 50, 5, 0x6ad8ff, 2.2); school(w, -80, -44, -20, 60, 6, 0x9a7aff, 1.8);
  for (let k = 0; k < 6; k++) { const j = critter("jelly", 1 + (k % 3) * 0.3); w.scene.add(j); const px = -60 + k * 18, pz = -10 + (k % 2) * 30, py = -20 - k * 4, ph = k * 1.7; w.updaters.push((dt, t) => { j.position.set(px + Math.sin(t * 0.08 + ph) * 4, py + Math.sin(t * 0.3 + ph) * 2, pz + Math.cos(t * 0.07 + ph) * 4); animateCritter(j, dt, 0.3); }); }
  roam(w, "manta", { cx: -20, cz: 0, rx: 40, rz: 30, y: -20, dy: 3, period: 90, scale: 1.3 });
  w.airStation(-6, h(-6, 20), 20); w.airStation(-50, h(-50, 20), 20); w.vent(-80, h(-80, 10), 10, 20);
  // the lost lanternfish: little ones away from the shoal
  const lost = [[12, 18], [-4, 50], [-44, 52], [-40, 22]].map(([x, z]) => [x, h(x, z) + 2.5, z]);

  // ---- the missions
  const bed = (x, z, up = 1.2) => [x, h(x, z) + up, z];
  const ring = (x, y, z, a) => [x, y, z, 2.6, a];
  w.missionData = {
    twi1: { sub: [26, 4, 0, -Math.PI / 2], exit: bell.spawn, dark: true, floor: -80,
      marks: [bed(-62, 44, 3.2), bed(-66, 20, 3.2), bed(-84, -8, 3.2), bed(-102, -18, 3.2), bed(-58, -30, 3.2), bed(-44, -54, 3.2)] },
    twi2: { critter: "lanternfish", water: true, kids: lost, goal: [SHOAL.x, SHOAL.y, SHOAL.z], goalR: 4, floor: -70 },
    twi3: { rings: [[16, 2.5, -18, 2.6], [0, -8, -18, 2.6], [-16, -26, -14, 2.6], [-32, -38, -8, 2.6], [-46, -48, -2, 2.6], [-54, -52, 4, 2.6]], floor: -70 },
    twi4: { title: "DRIP BEACON" },
    twi5: { sub: [24, -4, -24, -Math.PI / 2], exit: bell.spawn, floor: -80,
      rings: [ring(10, -8, -26, -1.5), ring(-8, -16, -32, -1.8), ring(-24, -26, -34, -1.5), ring(-40, -34, -30, -1.3), ring(-56, -40, -32, -1.8), ring(-72, -46, -38, -1.9)] },
    twi6: { title: "PIPE JUNCTION" },
  };
  return {
    stars: [bed(-90, -40, 0.3), bed(4, -30, 0.3), bed(-100, 30, 0.3)],
    spawn: bell.spawn, yaw: bell.face, bolt: [bell.hole[0] + 3.8, bell.F + 0.1, bell.hole[1]], contact: [bell.hole[0] + 2.5, bell.F, bell.hole[1] - 3.5, -0.8],
    swimTop: 16, lamp: 30,
    at: { twi1: [27.5, 13.5, bell.F + 1], twi2: [32.5, 13.5, bell.F + 1], twi3: [34, -2, 6], twi4: [BEACON.x + 3, BEACON.z, by + 6], twi5: [27.5, 6.5, bell.F + 1], twi6: [JUNCTION.x + 6.5, JUNCTION.z, jy + 6] },
  };
}
