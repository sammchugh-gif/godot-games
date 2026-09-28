// The Orbital Dock at the top of the space elevator: a great flat deck of girders in space, with
// the tether coming up through the climber port at its west end and on up to the counterweight.
// The dock hall (air inside; in through the airlock) is on the north side, the cargo bay on the
// south, solar wings out either side, and at the east end, moored to the deck, Undertow's ship,
// its cargo hold open and full of ice. Rory wears his space suit and flies with the jetpack.
import * as THREE from "three";
import { M } from "../tex.js";
import { airlock, walls } from "./deepkit.js";
import { solarWing, module, climberPod } from "./spacekit.js";

export function buildDock(w) {
  w.setSky("space");
  w.scene.userData.envI = 0.45;
  w.floorY = -40;
  const deckM = M("metal", { args: [205, [150, 156, 168]], repeat: [20, 10] }), dark = M(0x2a3038, { metal: 0.6, rough: 0.45 });
  const yel = M(0xffd166, { emissive: 0xffb020, ei: 0.6 }), frame = M(0xd8dce4, { metal: 0.7, rough: 0.3 });

  // ---- the deck, and the girders under it
  const X0 = -40, X1 = 40, Z0 = -16, Z1 = 24;
  w.box(X1 - X0, 1, Z1 - Z0, deckM, (X0 + X1) / 2, -0.5, (Z0 + Z1) / 2);
  for (let x = X0 + 4; x < X1; x += 8) w.box(0.6, 2, Z1 - Z0, dark, x, -2, (Z0 + Z1) / 2, { collide: false });
  for (const z of [Z0 + 2, (Z0 + Z1) / 2, Z1 - 2]) w.box(X1 - X0, 0.6, 0.6, dark, 0, -2.6, z, { collide: false });
  // a low lip round the edge, and lights along it
  for (const [x0, z0, x1, z1] of [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1], [X0, Z0, X0, Z1]]) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    w.box(x0 === x1 ? 0.3 : L, 0.35, x0 === x1 ? L : 0.3, frame, (x0 + x1) / 2, 0.175, (z0 + z1) / 2);
    for (let k = 1; k < L / 6; k++) { const f = k * 6 / L; w.mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0x7fe3ff, { emissive: 0x7fe3ff, ei: 3 }), x0 + (x1 - x0) * f, 0.45, z0 + (z1 - z0) * f, { cast: false }); }
  }

  // ---- the tether, up through the climber port and on to the counterweight far overhead
  const TX = -30, TZ = 4;
  const tetherM = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, emissive: 0x6ab0ff, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.3 });
  const tBelow = w.mesh(new THREE.CylinderGeometry(1, 1, 1600, 16), tetherM, TX, -800, TZ, { cast: false, collide: false }); tBelow.userData.dynamic = true;
  const tAbove = w.mesh(new THREE.CylinderGeometry(1, 1, 400, 16), tetherM, TX, 200, TZ, { cast: false }); tAbove.userData.dynamic = true;
  w.phys.fixedCyl(TX, 20, TZ, 1, 20);
  w.box(18, 10, 18, M("metal", { args: [207, [90, 96, 110]], repeat: [3, 3] }), TX, 405, TZ, { collide: false });
  w.mesh(new THREE.RingGeometry(4.6, 5, 40), yel, TX, 0.02, TZ, { rx: -Math.PI / 2, cast: false });
  w.cyl(2.4, 2.8, 0.8, dark, TX, 0.4, TZ, { seg: 24 });
  climberPod(w, TX, 1.7, TZ + 2.4, 0); w.phys.fixedCyl(TX, 1.7, TZ + 2.4, 1.25, 1.3);
  w.sign("CLIMBER PORT", 5, 0.9, TX, 5.2, TZ + 5.2, 0, { bg: "#0c1a36", fg: "#ffd166", glow: 0.6 });

  // ---- the dock hall (north), with the airlock into it from the deck
  const HX0 = -12, HX1 = 12, HZ0 = 12.4, HZ1 = 22, HT = 5.5;
  const lock = airlock(w, 0, 0, HZ0 - 2.35, 0, { space: true, wall: M(0xc8ccd4, { metal: 0.5, rough: 0.4 }) });
  walls(w, HX0, HZ0, HX1, HZ1, 0, HT, [{ side: "s", at: 0, w: 3.4 }], { glass: true });
  w.box(HX1 - HX0 + 0.4, 0.4, HZ1 - HZ0 + 0.4, M(0xa8b0bc, { metal: 0.3, rough: 0.7 }), 0, HT + 0.2, (HZ0 + HZ1) / 2);
  w.sign("DOCK HALL", 4, 0.8, 0, HT - 0.9, HZ0 - 0.2, 0, { bg: "#0c1a36", fg: "#9fe0ff", glow: 0.8 });
  // inside: Juno's desk, the big chart screen, a sofa, plants
  w.box(4, 0.9, 1.2, M(0xe8ecf0, { rough: 0.4 }), -6, 0.45, 19);
  w.box(6, 3, 0.1, M(0x0a1a3a, { emissive: 0x1a3a7a, ei: 0.8 }), 0, 2.8, HZ1 - 0.3, { collide: false });
  for (let i = 0; i < 24; i++) w.mesh(new THREE.SphereGeometry(0.04, 6, 4), M(0xffffff, { emissive: 0xffffff, ei: 3 }), -2.8 + (i * 7.3 % 5.6), 1.5 + (i * 3.7 % 2.6), HZ1 - 0.36, { cast: false });
  w.box(3, 0.6, 1, M(0x2a6ad8, { rough: 0.8 }), 7, 0.3, 19.5);
  for (const x of [-10, 10]) { w.cyl(0.4, 0.3, 0.6, M(0xe8e8e8), x, 0.3, 21); w.mesh(new THREE.IcosahedronGeometry(0.6, 1), M(0x3a9a4a, { rough: 0.8 }), x, 1.1, 21); }

  // ---- the cargo bay (south): a marked square for the drifting crates
  for (const [x, z, sx, sz] of [[0, -4, 22, 0.25], [0, -15, 22, 0.25], [-11, -9.5, 0.25, 11], [11, -9.5, 0.25, 11]]) w.box(sx, 0.03, sz, yel, x, 0.02, z, { collide: false });
  w.sign("CARGO BAY", 4, 0.8, -14, 1.4, -9.5, Math.PI / 2, { bg: "#0c1a36", fg: "#ffd166", glow: 0.6 });
  w.box(0.2, 2, 0.2, frame, -14, 0.5, -9.5);
  // modules along the deck
  module(w, -20, 2.6, -8, 0, 12, [210, 214, 222]);
  module(w, 24, 2.6, 16, 0, 12, [220, 206, 200]);
  // solar wings out north and south
  solarWing(w, 20, 3, Z1, 0, 3); solarWing(w, 20, 3, Z0, Math.PI, 3);
  solarWing(w, -10, 3, Z1, 0, 2); solarWing(w, -10, 3, Z0, Math.PI, 2);

  // ---- Undertow's ship, moored at the east end: a long dark hull, its hold open to the deck
  const shipM = M("metal", { args: [211, [40, 52, 72], 64], repeat: [8, 3], metal: 0.4, rough: 0.7 }), teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 0.8 });
  const SX0 = 44, SX1 = 72, SW = 8, SH = 7;
  w.box(4.2, 1, 8, deckM, 42, -0.5, 0);                                    // the gangway
  w.box(SX1 - SX0, 1, SW * 2 + 1, shipM, (SX0 + SX1) / 2, -0.5, 0);       // the hold floor
  for (const s of [-1, 1]) w.box(SX1 - SX0, SH, 0.5, shipM, (SX0 + SX1) / 2, SH / 2, s * (SW + 0.25));
  const roof = new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  w.mesh(new THREE.BoxGeometry(SX1 - SX0, 0.2, SW * 2 + 0.5), roof, (SX0 + SX1) / 2, SH + 0.1, 0, { cast: false }).userData.dynamic = true;
  w.phys.fixedBox((SX0 + SX1) / 2, SH + 0.1, 0, (SX1 - SX0) / 2, 0.1, SW + 0.25);
  for (let x = SX0 + 2; x < SX1; x += 4) w.box(0.3, 0.3, SW * 2 + 0.5, shipM, x, SH + 0.1, 0, { collide: false });
  // the rest of the ship: the engine block, the bridge and its nose, and the engines
  w.box(20, SH + 6, SW * 2 + 2, shipM, SX1 + 10, (SH + 6) / 2 - 1, 0);
  w.mesh(new THREE.ConeGeometry(SW + 1, 10, 4, 1), shipM, SX1 + 25, 5, 0, { rz: -Math.PI / 2, ry: Math.PI / 4 });
  for (const z of [-5, 5]) { w.cyl(2.2, 3, 5, dark, SX0 - 0.5, 9, z, { rz: Math.PI / 2, collide: false }); w.mesh(new THREE.CircleGeometry(2, 20), M(0x1a4a5a, { emissive: 0x2ad0ff, ei: 0.7 }), SX0 - 3.05, 9, z, { ry: -Math.PI / 2, cast: false }); }
  w.box(SX1 - SX0, 0.3, 0.3, teal, (SX0 + SX1) / 2, SH - 0.5, -SW - 0.55, { collide: false }); w.box(SX1 - SX0, 0.3, 0.3, teal, (SX0 + SX1) / 2, SH - 0.5, SW + 0.55, { collide: false });
  w.sign("UNDERTOW", 7, 1.3, 58, 5, -SW - 0.55, Math.PI, { bg: "#061a2a", fg: "#2ad0c0", glow: 1 });
  // the ice: stacks of frozen-sea bricks in the hold (the cover in there)
  const ice = new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.15, transmission: 0, transparent: true, opacity: 0.85, emissive: 0x2a6a9a, emissiveIntensity: 0.25 });
  const stacks = [[53, -3, 2, 4], [53, 5, 2, 3], [61, 0, 2, 6], [61, -6.5, 2, 2], [67, 4, 3, 2], [66, -3, 2, 2.4]];
  for (const [x, z, sx, sz] of stacks) { w.box(sx, 2.4, sz, ice, x, 1.2, z); }
  for (const [x, z] of [[46, 7], [47.2, 7], [46, -7]]) w.box(1.1, 1.1, 1.1, ice, x, 0.55, z, { collide: false });

  // ---- the missions
  w.missionData = {
    doc1: { cells: [[20, 4.6, 32], [20, 4.6, 47], [20, 4.6, -24], [20, 4.6, -39], [-27, 9, 4], [0, 8.2, 17], [56, 9.2, 0]] },
    doc2: { things: [["crate", -6, 0, -7, 0, 0xd8c060], ["barrel", 4, 0, -8, 0, 0x3a8ad8], ["crate", -2, 0, -12, 0.4, 0xd8c060], ["barrel", 8, 0, -12, 0, 0xe83a3a], ["crate", 2, 0, -6, 1, 0xf0f2f6], ["barrel", -8, 0, -12, 0, 0x7bed9f], ["crate", 6, 0, -14, 0.3, 0xd8c060]] },
    doc3: { steps: [[lock, "in"]], goal: [0, 0.5, 17] },
    doc4: { title: "STAR CHARTS" },
    doc5: { rings: [[34, 4, 0, 2.6, Math.PI / 2], [46, 12, -13, 2.6, Math.PI / 2], [64, 15, -13, 2.6, Math.PI / 2], [86, 16, -12, 2.6, 0.8], [98, 12, 10, 2.6, -0.8], [72, 15, 13, 2.6, Math.PI / 2], [50, 11, 13, 2.6, Math.PI / 2]], ceiling: 40 },
    doc6: { range: 7, angle: 30, start: [45, 0.1, -6], goal: [69.5, 0.1, 6.5],
      guards: [{ path: [[50, -7], [50, 7]], speed: 1.2, y: 0 }, { path: [[57, 7], [57, -7]], speed: 1.1, phase: 3, y: 0 }, { path: [[64, -7], [64, 7]], speed: 1.0, phase: 6, y: 0 }] },
  };
  return {
    stars: [[TX, 2.1, TZ - 5], [20, 3.2, 54], [80, 12.2, 0]],
    spawn: [-24, 0, 2], yaw: Math.PI / 2, bolt: [-25, 0, 0], contact: [-20, 0, 6, -Math.PI / 2], jetpack: true,
    at: { doc1: [-16, -2, 3], doc2: [-14, -13, 3], doc3: [4, 6, 3], doc4: [-8, 8, 3], doc5: [30, -8, 3], doc6: [38, 5, 3] },
  };
}
