// The Sunlight Zone: the open Atlantic over the sunken Bermuda base. Dr Lani's
// research ship Albatross rides on the swell with a dive platform at her stern;
// far below, on the sand, lies the wreck of Undertow's base, tilted on its
// pillars, and from it her pipe runs away west along the sea bed. A warm current
// sweeps down from near the ship to the wreck, and turtles and mantas ride it.
import * as THREE from "three";
import { M } from "../tex.js";
import { critter, animateCritter, roam, school } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildSunlight(w) {
  w.setSky({ top: "#1a64d0", mid: "#86c0ee", bottom: "#d0ecf4", sun: [58, 40], sunColor: "#fff6e4", sunI: 2.4, hemi: ["#d0e8ff", "#2a5a8a", 0.62], fog: [160, 700], clouds: 12 });
  const WRECK = { x: -30, z: -60 }, PIPE = [[-50, -62], [-90, -66], [-130, -62], [-170, -70], [-210, -66]];
  const h = (x, z) => {
    // the deep sand, rippled; a reef ridge rising to the east; the wreck's site levelled
    let y = -44 + Math.sin(x * 0.045) * Math.cos(z * 0.05) * 1.6 + Math.sin(x * 0.13 + z * 0.1) * 0.4;
    y += 30 * S(55, 85, x) * (0.8 + 0.2 * Math.sin(z * 0.08));
    y += (-40 - y) * S(34, 22, Math.hypot(x - WRECK.x, (z - WRECK.z) * 1.2));
    return y;
  };
  w.terrain(560, 200, h, M("sand", { args: [11, [206, 196, 166]], repeat: [100, 100] }));
  w.ocean({ level: 0, box: [0, -30, 260, 200], shallow: 0x2a9ad8, deep: 0x0a3a80, under: 0x1470b0, deepUnder: 0x031a3a, clear: 0.7, waves: 1.1, caustics: 6, see: 52 });
  w.deepAt = 80;
  w.overlay(72, -30, 40, 200, M("rock", { args: [91, [110, 100, 96]], repeat: [10, 40] }), (x, z) => h(x, z) > -36, 0.05);

  // ---- the Albatross: a white research ship, her stern to the south, a dive platform behind it
  const white = M(0xf2f2ee, { rough: 0.5 }), hullM = M(0x1a3a6a, { rough: 0.45 }), deckM = M("wood", { args: [9, [170, 146, 110]], repeat: [4, 14] });
  const rail = M(0xe8ecf0, { metal: 0.6, rough: 0.3 }), orange = M(0xf07a1a, { rough: 0.5 });
  const TOP = 2.4;
  w.box(10, 5, 38, hullM, 0, -0.3, 0);
  w.box(10.1, 0.5, 38.1, white, 0, 2.0, 0, { collide: false });
  w.box(10, 0.2, 38, deckM, 0, TOP - 0.1, 0);
  const bow = w.mesh(new THREE.CylinderGeometry(5, 5, 5.2, 3, 1), hullM, 0, -0.2, 19); bow.scale.set(1, 1, 2.2); bow.rotation.y = Math.PI / 2;
  w.phys.fixedBox(0, -0.3, 22, 3.2, 2.5, 3.2);
  const bowDeck = w.mesh(new THREE.CylinderGeometry(5, 5, 0.2, 3, 1), deckM, 0, TOP - 0.1, 19); bowDeck.scale.set(1, 1, 2.2); bowDeck.rotation.y = Math.PI / 2;
  // the bridge, its windows, a mast with a radar
  w.box(8, 3, 8, white, 0, TOP + 1.5, 9);
  w.box(8.1, 0.9, 0.1, M(0x1a2a3a, { metal: 0.6, rough: 0.1 }), 0, TOP + 2.3, 13.02, { collide: false });
  w.box(6, 2.2, 6, white, 0, TOP + 4.1, 8);
  w.cyl(0.12, 0.14, 5, rail, 0, TOP + 7.7, 8, { seg: 8 });
  const radar = w.box(2.2, 0.15, 0.3, M(0x2a2e36), 0, TOP + 9, 8, { collide: false }); radar.userData.dynamic = true;
  w.updaters.push(dt => { radar.rotation.y += dt * 1.8; });
  w.sign("ALBATROSS", 6, 1.1, 5.08, 1.2, 6, Math.PI / 2, { bg: "#1a3a6a", fg: "#ffffff" });
  w.sign("ALBATROSS", 6, 1.1, -5.08, 1.2, 6, -Math.PI / 2, { bg: "#1a3a6a", fg: "#ffffff" });
  // the A-frame over the stern, and a crane with a hook
  for (const sx of [-1, 1]) w.box(0.4, 6, 0.4, orange, sx * 3.6, TOP + 3, -18.5);
  w.box(7.6, 0.5, 0.5, orange, 0, TOP + 6, -18.5, { collide: false });
  w.cyl(0.3, 0.4, 3, orange, -3.5, TOP + 1.5, -6, { seg: 10 });
  w.box(0.4, 0.4, 7, orange, -3.5, TOP + 3.4, -8.6, { collide: false, rx: 0.4 });
  // crates and a rack of air tanks
  for (const [x, z] of [[3, -8], [3.2, -5.6], [-3, 0]]) w.box(1.4, 1.1, 1.4, M(0x3a7ad8, { rough: 0.6 }), x, TOP + 0.55, z);
  for (let i = 0; i < 5; i++) w.cyl(0.18, 0.18, 1.2, M(0xf2c418, { rough: 0.35, metal: 0.3 }), -4.2, TOP + 0.6, -12 + i * 0.5, { seg: 10 });
  // rails round the deck, with a gap at the stern for the steps down
  w.fence(-5, -19, -5, 19, 1, rail, { y: TOP }); w.fence(5, -19, 5, 19, 1, rail, { y: TOP });
  w.fence(-5, -19, 1.6, -19, 1, rail, { y: TOP }); w.fence(4.6, -19, 5, -19, 1, rail, { y: TOP });
  // the dive platform, the steps down to it, a ladder into the sea
  w.box(9, 0.3, 4, M(0xd8d8d0, { rough: 0.6 }), 0, 0.35, -21.2);
  w.steps(6, 2.6, 0.32, 0.42, rail, 3.1, 0.5, -22.8, 0);
  w.sign("DIVE", 1.6, 0.5, -2.5, 1.2, -19.02, Math.PI, { bg: "#f07a1a", fg: "#ffffff" });

  // ---- the wreck of the Bermuda base: a vast deck tilted on its pillars, a hall of darkness under
  // it, a fallen tower and burst tanks
  const baseM = M("metal", { args: [10, [80, 90, 96], 64], repeat: [8, 6], metal: 0.6, rough: 0.5 }), rust = M(0x6a4a3a, { rough: 0.8, metal: 0.3 });
  const { x: WX, z: WZ } = WRECK;
  w.box(38, 1, 26, baseM, WX, -33, WZ, { rz: 0.07 });
  for (const [dx, dz] of [[-16, -10], [-16, 10], [0, -10], [0, 10], [15, -10], [15, 10], [-8, 0], [8, 0]]) w.box(1.2, 8, 1.2, rust, WX + dx, -37 - dx * 0.07 * 0.5, WZ + dz);
  // broken walls round two sides of the hall
  w.box(38, 5, 0.6, baseM, WX, -38, WZ - 13);
  w.box(0.6, 5, 14, baseM, WX - 19, -38, WZ - 6);
  // the fallen tower and the tanks
  w.cyl(3, 3, 26, rust, WX + 24, -37, WZ + 20, { rz: Math.PI / 2 });
  for (const [dx, dz] of [[-10, 20], [-4, 22]]) w.cyl(2.4, 2.4, 5, M(0x3a4a5a, { metal: 0.6, rough: 0.4 }), WX + dx, -37.5, WZ + dz, { seg: 16 });
  w.sign("UNDERTOW", 6, 1.2, WX, -31.6, WZ - 5, 0, { bg: "#0a2a4a", fg: "#2ad0c0", glow: 0.5 });
  const hallLamp = new THREE.PointLight(0x2ad0c0, 4, 14, 1.5); hallLamp.position.set(WX - 10, -36, WZ + 4); w.scene.add(hallLamp);

  // ---- Undertow's pipe away west along the sea bed
  const pipeM = M("metal", { args: [9, [104, 118, 110], 128], repeat: [10, 2], rough: 0.6, metal: 0.5 }), band = M(0x3a4a44, { metal: 0.6, rough: 0.5 });
  for (let i = 0; i + 1 < PIPE.length; i++) {
    const [ax, az] = PIPE[i], [bx, bz] = PIPE[i + 1], L = Math.hypot(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, y = Math.max(h(ax, az), h(bx, bz), h(cx, cz)) + 1.5;
    const ry = Math.atan2(bx - ax, bz - az);
    const m = w.mesh(new THREE.CylinderGeometry(1.5, 1.5, L + 1, 20), pipeM, cx, y, cz); m.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)).premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)));
    w.phys.fixedBox(cx, y, cz, 1.4, 1.4, L / 2, ry);
    for (let s = 4; s < L; s += 10) w.mesh(new THREE.TorusGeometry(1.6, 0.14, 8, 24), band, ax + (bx - ax) * s / L, y, az + (bz - az) * s / L, { ry });
  }

  // ---- the warm current: from near the ship, round the ridge and down to the wreck
  const CUR = [[14, -5, -8], [30, -9, -28], [34, -14, -52], [20, -20, -74], [-2, -26, -84], [-20, -31, -78], [-30, -34, -66]];
  w.current(CUR, 3.6, 7);

  // ---- life: turtles on the current, a manta school, a shoal round the ship, rays on the sand
  roam(w, "seaturtle", { cx: 26, cz: -44, rx: 10, rz: 22, y: -12, dy: 2, period: 30 });
  roam(w, "seaturtle", { cx: 16, cz: -60, rx: 16, rz: 14, y: -20, dy: 2, period: 36, dir: -1 });
  roam(w, "seaturtle", { cx: -6, cz: 30, rx: 20, rz: 12, y: -4, dy: 1, period: 50 });
  const MANTA = { x: 40, y: -18, z: 40 };
  for (let k = 0; k < 5; k++) roam(w, "manta", { cx: MANTA.x, cz: MANTA.z, rx: 12 + k * 1.5, rz: 9 + k, y: MANTA.y - 4 + k * 2, dy: 1, period: 40 + k * 4, phase: k * 1.3, scale: 1.4 + (k % 2) * 0.4 });
  school(w, 0, -3, 4, 60, 7, 0xc8d8e8); school(w, 8, -8, -30, 50, 6, 0xffd23a); school(w, -40, -30, -40, 50, 6, 0x7a9aff); school(w, 60, -16, 10, 40, 5, 0x3ae0ff);
  // bubble streams at the wreck, and an air station by the pipe
  w.vent(WX + 20, h(WX + 20, WZ - 8), WZ - 8, 44); w.vent(WX - 22, h(WX - 22, WZ + 16), WZ + 16, 44);
  w.airStation(-92, h(-92, -58), -58);
  w.vent(-150, h(-150, -58), -58, 44);
  w.floorY = -60;

  // ---- the missions
  const pearl = (x, z, up = 1.2) => [x, h(x, z) + up, z];
  const ring = (x, y, z, a) => [x, y, z, 2.6, a];
  w.missionData = {
    sun1: { cells: [[6, -6, -26], [-4, -12, -36], [-14, -20, -46], pearl(WX + 8, WZ - 4, 3), pearl(WX - 12, WZ + 6, 3), [WX + 24, -32.5, WZ + 20]], floor: -46 },
    sun2: { rings: [[30, -9, -28, 2.6], [34, -14, -52, 2.6], [20, -20, -74, 2.6], [-2, -26, -84, 2.6], [-20, -31, -78, 2.6]], floor: -46 },
    sun3: { area: [-160, -64, 14], bots: [[-150, 0, -62], [-158, 0, -70], [-166, 0, -60], [-172, 0, -72], [-146, 0, -70], [-164, 0, -56]], floor: -48 },
    sun4: { sub: [8, -4, -24, Math.PI], exit: [0, TOP, -14], floor: -46,
      rings: [ring(14, -8, -6, 0.4), ring(26, -14, 18, 0.9), ring(44, -16, 28, 1.6), ring(52, -18, 44, 0.3), ring(40, -20, 54, -1.4), ring(26, -16, 44, -2.6), ring(30, -12, 26, 2.8)] },
    sun5: { sub: [WX + 30, -30, WZ - 4, -Math.PI / 2], exit: [0, TOP, -14], dark: true, floor: -46,
      marks: [[WX + 14, -38.6, WZ - 6], [WX + 4, -38.4, WZ + 6], [WX - 6, -38.6, WZ - 8], [WX - 14, -38.4, WZ + 4], [WX - 4, -38.2, WZ]] },
    sun6: { exit: [0, TOP, -14], floor: -52, path: [[-44, -30, -48], [-70, -34, -60], [-100, -36, -68], [-126, -35, -60], [-150, -36, -64], [-176, -37, -72], [-204, -36, -66]].map(([x, y, z]) => [x, Math.max(y, h(x, z) + 6), z]) },
  };
  return {
    stars: [[WX + 6, h(WX + 6, WZ + 2) + 0.3, WZ + 2], [60, h(60, -10) + 0.3, -10], [-120, h(-120, -54) + 0.3, -54]],
    spawn: [0, TOP + 0.1, -10], yaw: Math.PI, bolt: [-2, TOP + 0.1, -10], contact: [2.5, TOP, -13, Math.PI * 0.9],
    at: { sun1: [-1.2, -21.6, 0.8], sun2: [-3.6, -21.6, 0.8], sun3: [-1.5, -16], sun4: [1.5, -16], sun5: [-2.5, -6], sun6: [2.5, -3] },
  };
}
