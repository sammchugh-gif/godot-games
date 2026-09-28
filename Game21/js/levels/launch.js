// The Sea-Launch Platform, on the equator in the middle of the Pacific: a floating launch rig as
// big as a football pitch, standing on four great columns over water four kilometres deep.
// POLARIS's rocket stands on its pad at the east end with the red launch tower beside it; the
// hangar and launch control are at the west end. Vega's ship is moored at the landing stage, and a
// long stair climbs from the stage to the deck. On the horizon, Undertow's space elevator rises out
// of the sea: a ribbon going straight up into the sky.
import * as THREE from "three";
import { M } from "../tex.js";
import { boat } from "./kit.js";
import { rocket, gantry } from "./spacekit.js";
import { roam, school } from "../critters.js";

export function buildLaunch(w) {
  w.setSky("tropical");
  const D = 12;
  const h = (x, z) => -70 + Math.sin(x * 0.02) * Math.cos(z * 0.025) * 5;
  w.terrain(460, 115, h, M("sand", { args: [14, [150, 140, 120]], repeat: [60, 60] }));
  w.ocean({ level: 0, box: [0, 0, 220, 220], shallow: 0x1a7ab0, deep: 0x06305a, under: 0x1a5a8a, deepUnder: 0x031428, clear: 0.35, waves: 1.1, absorb: [0.22, 0.08, 0.05], see: 34, caustics: 2 });
  w.floorY = -80;
  const steel = M("metal", { args: [11, [150, 156, 166], 64], repeat: [26, 16], metal: 0.5, rough: 0.5 });
  const dark = M(0x2a3038, { metal: 0.5, rough: 0.5 }), yel = M(0xf0c020, { rough: 0.4, metal: 0.2 }), white = M(0xf0f2f6, { rough: 0.4 });

  // ---- the rig: the deck, its four columns and the pontoons under the water
  const X0 = -36, X1 = 36, Z0 = -22, Z1 = 22;
  w.box(X1 - X0, 1.2, Z1 - Z0, steel, 0, D - 0.6, 0);
  w.box(X1 - X0 + 0.4, 2.4, Z1 - Z0 + 0.4, dark, 0, D - 2.4, 0, { collide: false });
  const legM = M("metal", { args: [12, [200, 204, 210], 64], repeat: [2, 6], metal: 0.4, rough: 0.4 });
  for (const x of [-26, 26]) for (const z of [-14, 14]) { w.cyl(4, 4.4, D + 12.8, legM, x, (D - 15.2) / 2, z, { seg: 20 }); w.mesh(new THREE.TorusGeometry(4.5, 0.3, 8, 24), yel, x, 0.2, z, { rx: Math.PI / 2, cast: false }); }
  for (const z of [-14, 14]) w.box(64, 5, 9, legM, 0, -12, z, { collide: false });
  // rails round the deck, with a gap at the top of the stair (south side, x -5..-1)
  const railM = M(0xf0c020, { metal: 0.3, rough: 0.5 });
  w.fence(X0, Z0, -5, Z0, 1.1, railM, { y: D }); w.fence(-1, Z0, X1, Z0, 1.1, railM, { y: D });
  w.fence(X0, Z1, X1, Z1, 1.1, railM, { y: D }); w.fence(X0, Z0, X0, Z1, 1.1, railM, { y: D }); w.fence(X1, Z0, X1, Z1, 1.1, railM, { y: D });
  // hazard stripes along the south edge
  for (let x = X0 + 1; x < X1; x += 2) w.box(1, 0.02, 0.5, x % 4 ? yel : dark, x, D + 0.01, Z0 + 0.6, { collide: false });

  // ---- the landing stage at the water, and the long stair up to the deck (gentle steps, a rail)
  const stage = M("wood", { args: [9, [120, 106, 88]], repeat: [7, 3] }), stairM = M("metal", { args: [9, [150, 160, 170]] });
  w.box(28, 1.2, 10.5, stage, -10, 0.6, -28.75);
  w.steps(30, 2.5, (D - 1.2) / 30, 0.45, stairM, -18.5, 1.2, -24.75, Math.PI / 2);
  w.box(4.5, 0.3, 4.5, stairM, -2.75, D - 0.15, -24.25);
  w.fence(-18.5, -23.45, -5, -23.45, 1, railM, { y: x => 1.2 + Math.min(1, Math.max(0, (x + 18.5) / 13.5)) * (D - 1.2) });
  w.fence(-5, -26.55, -0.45, -26.55, 1, railM, { y: D }); w.fence(-0.45, -26.55, -0.45, -22.3, 1, railM, { y: D });
  boat(w, -8, -1.4, -40, Math.PI / 2, { color: 0xf2f2f2, size: 2.6, name: "POLARIS" });
  w.lamp(-22, -33, 4, 0xffe0a0, { y: 1.2, ei: 3, light: 3 }); w.lamp(2, -33, 4, 0xffe0a0, { y: 1.2, ei: 3, light: 3 });

  // ---- the launch pad at the east end: a raised pad, a ramp up to it, the rocket and its tower
  const padM = M("paving", { args: [187, [196, 196, 192], 64], repeat: [6, 5] });
  w.box(32, 3, 24, padM, 20, D + 1.5, 0);
  w.ramp(6, 10, 3, M("asphalt", { args: [189], repeat: [2, 4] }), -6, D, 0, Math.PI / 2);
  const rk = rocket(w, 14, D + 3, 0);
  const gt = gantry(w, 28, D, 0);
  w.sign("POLARIS", 6, 1.2, 20, D + 3.2, 12.05, 0, { bg: "#0c1a36", fg: "#9fe0ff", glow: 0.8 });
  void rk;

  // ---- the west end: the hangar (open to the east) and launch control
  const hangM = M("metal", { args: [13, [180, 186, 196], 64], repeat: [6, 2], metal: 0.4, rough: 0.5 });
  w.box(18, 9, 0.5, hangM, -27, D + 4.5, -12); w.box(18, 9, 0.5, hangM, -27, D + 4.5, 4);
  w.box(0.5, 9, 16.5, hangM, -35.75, D + 4.5, -4);
  w.box(18.5, 0.5, 17, hangM, -27, D + 9.25, -4);
  w.sign("HANGAR 1", 5, 1, -18, D + 7.8, -4, Math.PI / 2, { bg: "#0c1a36", fg: "#ffd166", glow: 0.6 });
  w.building(12, 5, 8, -24, 15, { y: D, wall: [230, 234, 240], seed: 191, win: { lit: 0.5, glass: "#3a6a9a" }, trim: 0x1a3a8a });
  w.sign("LAUNCH CONTROL", 8, 1.2, -24, D + 4, 10.9, Math.PI, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1 });
  const dish = w.mesh(new THREE.SphereGeometry(2.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3.2), M(0xf0f2f6, { rough: 0.3, side: THREE.DoubleSide }), -30, D + 8.5, 16, { rx: -0.8 }); void dish;
  w.cyl(0.25, 0.35, 3, M(0xd8d8e0, { metal: 0.6 }), -30, D + 6.5, 16, { collide: false });
  // fuel tanks and crates about the deck
  for (const [x, z] of [[-8, 16], [-2, 16]]) { w.cyl(1.8, 1.8, 4, white, x, D + 2, z, { rz: Math.PI / 2, seg: 16 }); w.box(4.4, 0.5, 1.2, dark, x, D + 0.25, z); }
  for (const [x, z] of [[-10, -14], [-8.6, -14], [-10, -12.6]]) w.box(1.2, 1.2, 1.2, M("wood", { args: [5, [150, 110, 70]] }), x, D + 0.6, z);

  // ---- on the horizon: Undertow's space elevator, a ribbon from an anchor platform into the sky
  const EL = { x: 190, z: -140 };
  w.box(30, 4, 30, M(0x2a3a4a, { metal: 0.5 }), EL.x, 2, EL.z, { collide: false });
  const ribbon = w.mesh(new THREE.BoxGeometry(0.8, 2000, 0.3), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, emissive: 0x6ab0ff, emissiveIntensity: 0.4, roughness: 0.3 }), EL.x, 1000, EL.z, { cast: false });
  ribbon.userData.dynamic = true;
  for (let k = 0; k < 4; k++) { const c = w.mesh(new THREE.BoxGeometry(3, 4, 3), M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 0.6 }), EL.x, 60 + k * 180, EL.z, { cast: false, collide: false }); c.userData.dynamic = true; const k0 = k; w.updaters.push((dt, t) => { c.position.y = 30 + ((t * 8 + k0 * 180) % 720); }); }

  // ---- life in the open ocean
  school(w, 0, -8, 0, 60, 7, 0x9ad8ff); school(w, -40, -14, 40, 50, 6, 0xffd23a);
  roam(w, "manta", { cx: 20, cz: 30, rx: 50, rz: 30, y: -10, dy: 1, period: 80, scale: 1.8 });
  roam(w, "turtle", { cx: -30, cz: -50, rx: 20, rz: 12, y: -3, dy: 0.6, period: 50, scale: 1.2 });

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, D + up, z];
  w.missionData = {
    lau1: { cells: [on(-14, 18), on(-16, -18), on(4, 18), [28, D + 6.3 + 1.1, 0], [28, D + 18.3 + 1.1, 0], [28, D + 30.3 + 1.1, 0], [21, D + 36.4 + 1.1, 0]], climb: gt.climb },
    lau2: { ride: "jetski", exit: [-12, 1.3, -31], path: [[60, -40], [80, 0], [60, 45], [10, 62], [-45, 52], [-70, 12], [-62, -40], [-30, -62], [20, -62]] },
    lau3: { pad: on(-4, 6, 0), padR: 2.4, blocks: [on(-12, 12, 0.5), on(-16, 6, 0.5), on(-10, -4, 0.5), on(-4, -16, 0.5)] },
    lau4: { area: [-6, 0, 12], lanes: [[-30, -18, -8, -18, D], [-30, 8, -30, 18, D], [-14, 18, 4, 18, D], [-12, -8, -12, 10, D], [0, -18, 0, 10, D], [-20, -18, -20, -14, D]] },
    lau5: { title: "LAUNCH CONTROL" },
    lau6: { title: "LAUNCH CODE" },
  };
  return {
    stars: [[3, 1.2, -33], [21, D + 36.4, 0], [-34, D, 20]],
    spawn: [-12, 1.2, -30], yaw: Math.PI / 2, bolt: [-14, 1.2, -31], contact: [-6, 1.2, -29, -Math.PI / 2],
    // (gone if it launched before: when it launches, it goes up in front of you)
    apply: save => { if (!w.appliedOnce) { w.launched = save.done.includes("lau6"); w.appliedOnce = true; } },
    at: { lau1: [-2, -14, D + 3], lau2: [-4, -32, 4], lau3: [-10, 4, D + 3], lau4: [-8, -6, D + 3], lau5: [-24, 8, D + 3], lau6: [-20, 8, D + 3] },
  };
}
