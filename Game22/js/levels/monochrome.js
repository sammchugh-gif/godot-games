// The Monochrome: Baroness Grisaille's airship, a flying gallery where every
// colour she has taken hangs in a jar. The gallery of grey paintings, the
// colour vault of shelves and jars, the engine room, the open deck under the
// great grey balloon, and the bow, where the Eraser waits.
import * as THREE from "three";
import { M } from "../tex.js";
import { painting, jar, groundAt } from "../kit.js";

export function build(w) {
  w.setSky("day");
  // the desert, far below (you can't fall that far: the deck's rails and the floor limit catch you)
  w.terrain(600, 60, (x, z) => -60 + Math.sin(x * 0.03) * 4 * Math.cos(z * 0.025), M("sand", { args: [10, [200, 70, 40]], repeat: [30, 30] }));
  w.floorY = -18;
  const grey = M("metal", { args: [6, [150, 150, 158]], repeat: [6, 2] }), dark = M(0x3a3a44, { metal: 0.5, rough: 0.4 }), pale = M(0xd8d8e0, { rough: 0.6 });
  const deckM = M("metal", { args: [7, [170, 170, 176], 48], repeat: [12, 40], normal: 0.5 });
  // the deck: a long hull-shaped platform, rails all round, the balloon above on struts
  const L = 150, W = 44;
  w.box(W, 3, L, deckM, 0, -1.5, 0);
  for (const s of [-1, 1]) { w.box(0.3, 1.2, L, dark, s * (W / 2 - 0.15), 0.6, 0); w.box(W, 1.2, 0.3, dark, 0, 0.6, s * (L / 2 - 0.15)); }
  const bow = w.mesh(new THREE.ConeGeometry(W / 2, 30, 24, 1, false, 0, Math.PI * 2), deckM, 0, -1.5, -L / 2 - 15, { rx: -Math.PI / 2, collide: false }); bow.scale.y = 0.1; void bow;
  const balloon = w.mesh(new THREE.SphereGeometry(1, 32, 20), M(0xb8b8c0, { rough: 0.5, metal: 0.3 }), 0, 44, 0, { collide: false }); balloon.scale.set(W * 0.9, 24, L * 0.62);
  for (let i = -3; i <= 3; i++) for (const s of [-1, 1]) w.cyl(0.35, 0.4, 24, dark, s * (W / 2 - 0.9), 12, i * 22 + 11, { seg: 8 });
  // the rooms, stern to bow: the gallery, the vault, the engine room; walls with doorways between
  const wall = (x, z, wd, h, d, o = {}) => w.box(wd, h, d, pale, x, o.y ?? h / 2, z);
  const doorway = (x, z, wd, h, along) => { // a wall with a gap in the middle, along x (along = true) or z
    if (along) { wall(x - wd / 4 - 1.5, z, wd / 2 - 3, h, 0.6); wall(x + wd / 4 + 1.5, z, wd / 2 - 3, h, 0.6); wall(x, z, 6, 1.5, 0.6, { y: h - 0.75 }); }
    else { wall(x, z - wd / 4 - 1.5, 0.6, h, wd / 2 - 3); wall(x, z + wd / 4 + 1.5, 0.6, h, wd / 2 - 3); }
  };
  // the gallery: at the stern, long and narrow, frames down both walls
  const GZ = 48;
  wall(-14, GZ, 0.6, 5, 44); wall(14, GZ, 0.6, 5, 44); doorway(0, GZ + 22, 28, 5, true); doorway(0, GZ - 22, 28, 5, true);
  w.box(30, 0.5, 46, pale, 0, 5.25, GZ, { collide: false });
  for (let i = 0; i < 6; i++) { painting(w, -13.6, 2.4, GZ - 18 + i * 7.2, Math.PI / 2, 2.2, 1.6, { blank: true, seed: i, frame: 0x8a8a90 }); painting(w, 13.6, 2.4, GZ - 18 + i * 7.2, -Math.PI / 2, 2.2, 1.6, { blank: true, seed: i + 6, frame: 0x8a8a90 }); }
  for (const dz of [-12, -4, 4, 12]) for (const s of [-1, 1]) w.box(1.6, 3, 0.4, dark, s * 6, 1.5, GZ + dz);   // display panels to hide behind
  for (const dz of [-16, 0, 16]) { const l = new THREE.PointLight(0xe0e0f0, 2.5, 18, 1.5); l.position.set(0, 4.5, GZ + dz); w.scene.add(l); }
  w.sign("THE GRISAILLE COLLECTION", 6, 0.8, 0, 4.2, GZ + 21.6, Math.PI, { bg: "#2a2a30", fg: "#d0d0d8" });
  // the vault: shelves of jars stacked up the walls, pads to bounce up the shelves
  const VZ = 0;
  wall(-18, VZ, 0.6, 9, 36); wall(18, VZ, 0.6, 9, 36); doorway(0, VZ - 18, 36, 9, true); doorway(0, VZ + 18, 36, 9, true);
  w.box(38, 0.5, 38, pale, 0, 9.25, VZ, { collide: false });
  // the shelves step up and inward like stairs, to the top shelf in the middle
  const shelves = [];
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const y = 1.6 + k * 1.6, x = s * (16 - k * 3.4); w.box(3.4, 0.3, 30, dark, x, y, VZ); shelves.push([x, y + 0.15, VZ]); for (let j = 0; j < 4; j++) jar(w, x, y + 0.15, VZ - 9 + j * 6, [0x2ab8c8, 0x3ad06a, 0xffd23f, 0xd83a2a, 0x9a4aff, 0xff8a2a, 0x3a8aff, 0xff8ac8][(k * 4 + j + (s > 0 ? 3 : 0)) % 8], { full: 0.3 + 0.1 * j }); }
  w.box(12, 0.3, 10, dark, 0, 6.4, VZ); shelves.push([0, 6.55, VZ]);    // the top shelf in the middle
  for (let j = 0; j < 3; j++) jar(w, -4 + j * 4, 6.55, VZ - 3, [0xffd23f, 0xff8ac8, 0x3ad06a][j], { full: 0.8 });
  w.sign("THE COLOUR VAULT", 5, 0.8, 0, 8, VZ + 17.6, Math.PI, { bg: "#2a2a30", fg: "#d0d0d8" });
  // the engine room: a great grey drum, pipes, the feeding hatch with its mixing desk
  const EZ = -44;
  wall(-16, EZ, 0.6, 7, 28); wall(16, EZ, 0.6, 7, 28); doorway(0, EZ - 14, 32, 7, true); doorway(0, EZ + 14, 32, 7, true);
  w.cyl(5, 5, 6, grey, 0, 3, EZ - 2, { seg: 24 });
  const eng = w.mesh(new THREE.TorusGeometry(5.6, 0.4, 10, 40), M(0x8a8a94, { metal: 0.6 }), 0, 3, EZ - 2, { rx: Math.PI / 2, collide: false }); eng.userData.dynamic = true;
  w.updaters.push(dt => { eng.rotation.z += dt * 0.8; });
  for (const s of [-1, 1]) for (const dz of [-8, 4]) w.cyl(0.5, 0.5, 14, dark, s * 8, 6, EZ + dz, { seg: 10, rz: Math.PI / 2, collide: false });
  w.box(2, 1, 1.2, dark, -8, 0.5, EZ + 10); w.sign("FEED", 1.4, 0.5, -8, 1.4, EZ + 10.7, 0, { bg: "#3a3a40", fg: "#ffd23f" });
  w.sign("ENGINE ROOM", 4, 0.8, 0, 6, EZ + 13.6, Math.PI, { bg: "#2a2a30", fg: "#d0d0d8" });
  // the open deck round the rooms: the rainbow run goes round the outside of the rooms
  const GATES = [[-19, 56, Math.PI / 2], [-19, 20, Math.PI / 2], [-19, -20, Math.PI / 2], [0, -62, 0], [19, -20, -Math.PI / 2], [19, 20, -Math.PI / 2]];
  for (const [x, z] of [[-20, 40], [-20, 0], [-20, -40], [20, 40], [20, 0], [20, -40]]) { w.cyl(0.08, 0.1, 4, dark, x, 2, z, { seg: 8 }); w.mesh(new THREE.SphereGeometry(0.25, 12, 8), M(0xffffff, { emissive: 0xe8e8ff, ei: 3 }), x, 4.1, z, { cast: false }); }
  // the bow: the arena, open, with the Eraser's rails
  const AZ = -64;
  for (const a of [0.3, 1.2, 2.1, 3.0, 3.9, 4.8, 5.7]) w.cyl(0.2, 0.25, 1.4, dark, Math.cos(a) * 17, 0.7, AZ + Math.sin(a) * 10, { seg: 8 });

  w.missionData = {
    mc1: { start: [0, 0, GZ + 20], goal: [0, 0, GZ - 20], range: 8, guards: [{ path: [[-9, GZ + 14], [9, GZ + 14]], speed: 1.5, pause: 1.4 }, { path: [[9, GZ + 2], [-9, GZ + 2]], speed: 1.6, pause: 1.2, phase: 5 }, { path: [[-9, GZ - 8], [9, GZ - 8]], speed: 1.6, pause: 1.2, phase: 2 }, { path: [[9, GZ - 16], [-9, GZ - 16]], speed: 1.7, pause: 1.0, phase: 7 }] },
    mc2: { cells: [...shelves.map(([x, y, z], i) => [x, y + 1.1, z + (i % 2 ? 6 : -6)]), [0, 1.1, VZ - 14], [12, 1.1, VZ + 15], [-12, 1.1, VZ + 15]] },
    mc3: { title: "EVERY COLOUR" },
    mc4: { gates: GATES.map(([x, z, r]) => [x, 0, z, r]) },
    mc5: { center: [0, 0, AZ], radius: 11, height: 6, rider: "grisaille" },
  };
  void groundAt;
  return { spawn: [-6, 0.2, L / 2 - 3], yaw: Math.PI, bolt: [-4, 0.2, L / 2 - 2], contact: null };
}
