// Phobos, Mars's little lumpy moon: grey-brown dust and boulders, grooves and craters, the
// ground falling away all round because the whole moon is only twenty kilometres long, and Mars
// filling a quarter of the black sky. Tycho's mining station (a dome, two modules, a drill rig
// and its lamps) is on the flat to the north-west; Undertow's ship has put down on the flat to
// the east; the huge bowl of Stickney Crater is to the south. Gravity is a fifth of Earth's.
import * as THREE from "three";
import { M } from "../tex.js";
import { module } from "./spacekit.js";

const CRATERS = [[10, -64, 40, 9], [-52, -22, 14, 4], [54, -16, 15, 4], [-44, 60, 12, 3], [62, 52, 14, 4], [-86, 10, 18, 5], [28, 72, 10, 3], [-72, -76, 20, 5]];
const FLATS = [[-22, 22, 20], [38, 24, 14]];
export function ground(x, z) {
  let h = Math.sin(x * 0.03) * 1.6 + Math.cos(z * 0.035 + 1) * 1.4 + Math.sin((x + z) * 0.08) * 0.4;
  // the grooves that run across Phobos
  h -= Math.pow(Math.max(0, Math.sin(x * 0.16 + z * 0.05)), 8) * 0.6;
  for (const [cx, cz, R, d] of CRATERS) {
    const r = Math.hypot(x - cx, z - cz) / R;
    if (r < 1) h -= d * (1 - r * r);
    h += d * 0.35 * Math.exp(-(((r - 1) / 0.22) ** 2));
  }
  let flat = 0; for (const [fx, fz, fr] of FLATS) flat = Math.max(flat, Math.min(1, Math.max(0, 1.5 - Math.hypot(x - fx, z - fz) / fr)));
  h *= 1 - flat;
  // a small world: the ground curves away over the horizon
  return h - (x * x + z * z) * 0.0006;
}

function dome(w, x, z, r, color) {
  const y = ground(x, z);
  const glass = new THREE.MeshPhysicalMaterial({ color, roughness: 0.1, metalness: 0.1, clearcoat: 1, emissive: color, emissiveIntensity: 0.25 });
  w.mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass, x, y, z);
  w.mesh(new THREE.TorusGeometry(r, 0.3, 8, 40), M(0x3a3f4a, { metal: 0.8 }), x, y + 0.2, z, { rx: Math.PI / 2 });
  w.phys.fixedBall(x, y, z, r * 0.97);
}

export function buildPhobos(w) {
  w.setSky("phobos");
  w.scene.userData.envI = 0.3;
  w.terrain(320, 128, ground, M("moon", { args: [231], repeat: [26, 26], normal: 1.2, rough: 0.95, color: 0xa89484 }));
  w.phys.fixedBox(0, -40, 0, 400, 1, 400);
  w.floorY = -50;
  const G = ground, rockM = M("moon", { args: [233], repeat: [1, 1], rough: 1, color: 0x8a7a6e });
  const boulder = (x, z, r, sy = 0.8) => { const m = w.mesh(new THREE.DodecahedronGeometry(r, 1), rockM, x, G(x, z) + r * 0.4, z, { ry: x * 0.7 + z }); m.scale.set(1, sy, 1.1); w.phys.fixedBall(x, G(x, z) + r * 0.3, z, r * 0.75); return G(x, z) + r * 1.05; };

  // ---- the hopping boulders between the ship and the station (each has a cell above it)
  const HOPS = [[16, 4, 2.2], [8, -6, 1.8], [-2, -12, 2.4], [-14, -8, 2], [-26, -14, 2.2], [-38, -4, 2], [-44, 10, 2.2], [4, 40, 2.4]];
  const hopTops = HOPS.map(([x, z, r]) => [x, boulder(x, z, r), z]);
  // and a scatter of others, clear of the flats and the drive round the crater
  for (let i = 0; i < 46; i++) {
    const a = i * 2.39, d = 30 + (i * 37) % 110, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (FLATS.some(([fx, fz, fr]) => Math.hypot(x - fx, z - fz) < fr + 4) || Math.abs(Math.hypot(x - 10, z + 64) - 24) < 8 || HOPS.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 6)) continue;
    const r = 0.6 + (i % 5) * 0.5; boulder(x, z, r, 0.7);
  }

  // ---- Tycho's mining station
  const SX = -22, SZ = 22, sy = G(SX, SZ);
  dome(w, SX - 4, SZ + 6, 7, 0xd8a040);
  module(w, SX + 10, sy + 2.6, SZ + 8, 0, 10, [220, 214, 200]);
  module(w, SX - 12, sy + 2.6, SZ - 6, Math.PI / 2, 10, [210, 214, 222]);
  w.sign("PHOBOS MINING CO.", 7, 1, SX + 10, sy + 6, SZ + 5.2, 0, { bg: "#2a1a10", fg: "#ffb040", glow: 0.9 });
  // the landing pad, and its ring of lamps (dark until the station's wiring is fixed)
  const PX = SX + 8, PZ = SZ - 10, PY = G(PX, PZ) + 0.5;
  w.cyl(8, 8, 1, M("paving", { args: [241, [150, 146, 140], 64], repeat: [4, 4] }), PX, PY - 0.5, PZ, { seg: 32 });
  w.mesh(new THREE.RingGeometry(6.4, 6.8, 40), M(0xffd166, { emissive: 0xffb020, ei: 0.6 }), PX, PY + 0.02, PZ, { rx: -Math.PI / 2, cast: false });
  const bulbs = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, lx = PX + Math.cos(a) * 9, lz = PZ + Math.sin(a) * 9; bulbs.push(w.lamp(lx, lz, 3, 0xffe0a0, { y: G(lx, lz), ei: 3 })); }
  bulbs.forEach(b => { b.material = b.material.clone(); b.userData.dynamic = true; });
  w.updaters.push((dt, t) => { for (const b of bulbs) b.material.emissiveIntensity = w.stationLit ? 3 : 0.05 + (Math.sin(t * 9 + b.position.x) > 0.95 ? 1 : 0); });
  // the drill rig: a tower over a hole, a conveyor to the hopper
  const rigM = M(0xe8a020, { metal: 0.4, rough: 0.5 }), steel = M(0x5a6068, { metal: 0.7, rough: 0.4 });
  const DX = SX - 14, DZ = SZ + 16, dy = G(DX, DZ);
  for (const [sx, sz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) w.box(0.4, 12, 0.4, rigM, DX + sx, dy + 6, DZ + sz);
  for (let k = 1; k <= 3; k++) w.box(4.4, 0.3, 4.4, rigM, DX, dy + k * 4, DZ, { collide: false });
  const bit = w.cyl(0.5, 0.1, 8, steel, DX, dy + 4, DZ, { collide: false, seg: 10 }); bit.userData.dynamic = true;
  w.updaters.push((dt, t) => { bit.rotation.y = t * 3; bit.position.y = dy + 3 + Math.sin(t * 0.5) * 1.5; });
  w.box(10, 0.5, 1.2, steel, DX + 7, dy + 2.5, DZ, { rz: -0.35, collide: false });
  w.box(4, 3, 4, M(0x6a5a4a, { rough: 0.9 }), DX + 12, dy + 1.5, DZ);

  // ---- Undertow's ship on the flat to the east, on its landing legs
  const shipM = M("metal", { args: [211, [40, 52, 72], 64], repeat: [8, 3], metal: 0.4, rough: 0.7 }), teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 0.8 });
  const UX = 40, UZ = 26, uy = G(UX, UZ);
  w.box(34, 8, 12, shipM, UX, uy + 6, UZ);
  w.mesh(new THREE.ConeGeometry(7, 10, 4, 1), shipM, UX + 22, uy + 6, UZ, { rz: -Math.PI / 2, ry: Math.PI / 4 });
  w.box(34, 0.3, 0.3, teal, UX, uy + 8, UZ - 6.1, { collide: false });
  for (const [lx, lz] of [[-14, -5], [14, -5], [-14, 5], [14, 5]]) { w.cyl(0.35, 0.35, 3, steel, UX + lx, uy + 1.5, UZ + lz, { seg: 8 }); w.cyl(1, 1.2, 0.3, steel, UX + lx, uy + 0.15, UZ + lz, { seg: 12 }); }
  // (its ramp down, and the ice bricks it dropped when it landed)
  w.ramp(4, 5, 2, shipM, UX - 10, uy, UZ - 11, 0);
  w.sign("UNDERTOW", 6, 1.1, UX, uy + 6, UZ - 6.05, Math.PI, { bg: "#061a2a", fg: "#2ad0c0", glow: 1 });

  // ---- a few flags and markers along the way
  for (const [x, z] of [[20, -20], [-4, -30], [30, -44]]) { w.cyl(0.05, 0.05, 2.4, M(0xe8e8ec), x, G(x, z) + 1.2, z, { collide: false }); w.mesh(new THREE.PlaneGeometry(0.9, 0.5), M(0xffb040, { side: THREE.DoubleSide, emissive: 0xffb040, ei: 0.3 }), x + 0.45, G(x, z) + 2.2, z, { cast: false }); }

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const loop = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.3; loop.push([10 + Math.cos(a) * 24, -64 + Math.sin(a) * 24]); }
  w.missionData = {
    pho1: { cells: hopTops.map(([x, y, z]) => [x, y + 1.3, z]) },
    pho2: { what: "glowing cells", start: [...on(14, -22, 0.5), Math.PI], car: "buggy", carOpts: { color: 0xf0f2f6, trim: 0xffb040, grip: 2.2, awd: true }, cells: loop.map(([x, z]) => on(x, z)) },
    pho3: { robot: "digger", area: [0, 4, 10], bots: [on(-4, 6, 0), on(6, 2, 0), on(2, 12, 0), on(-6, -2, 0), on(8, 10, 0), on(0, -4, 0)] },
    pho4: { title: "STATION LIGHTS" },
    pho5: { title: "FIND MARS" },
    pho6: { pad: [PX, PY, PZ], padR: 2.4, size: 1.1, gravity: 2, blocks: [on(SX + 16, SZ - 4, 1), on(SX + 18, SZ - 14, 1), on(SX + 2, SZ - 18, 1), on(SX - 2, SZ - 6, 1), on(SX + 12, SZ - 20, 1)] },
  };
  return {
    stars: [on(-44, 60, 0.2), on(10, -64, 0.2), on(UX + 24, UZ + 8, 0.2)],
    spawn: on(26, 14, 0.1), yaw: -Math.PI / 2, bolt: on(27, 16, 0), contact: [...on(-4, 16, 0), Math.PI / 2],
    apply: save => { w.stationLit = save.done.includes("pho4"); },
    at: { pho1: [20, 8, 30], pho2: [18, -16, 30], pho3: [4, 20, 30], pho4: [-10, 12, 30], pho5: [-8, 30, 30], pho6: [-8, 2, 30] },
  };
}
