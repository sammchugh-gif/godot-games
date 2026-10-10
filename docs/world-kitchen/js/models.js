// Every model in the game, built from simple shapes: ingredients, foods,
// potions, wands, the chef, the vehicles, the scenery of each place, the
// kitchen and the boss. No files to load and no emoji anywhere.
import * as THREE from "three";
import { REC, ING } from "./data.js";

const TAU = Math.PI * 2;
const mats = new Map();
// a material per look, shared: c colour, r roughness, m metalness, e glow,
// op opacity, f flat shading, map a texture, ds double sided
export function mat(c, o = {}) {
  const key = (typeof c === "object" ? c.uuid : c) + "|" + JSON.stringify(o, (k, v) => (k === "map" ? v.uuid : v));
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: o.map ? 0xffffff : c, roughness: o.r ?? 0.55, metalness: o.m ?? 0, flatShading: !!o.f,
      emissive: o.e ? (o.ec ?? c) : 0x000000, emissiveIntensity: o.e || 0,
      transparent: o.op !== undefined, opacity: o.op ?? 1, map: o.map || null,
      side: o.ds ? THREE.DoubleSide : THREE.FrontSide, depthWrite: o.op === undefined || o.op > 0.6,
    });
    mats.set(key, m);
  }
  return m;
}
const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(0.5, 22, 16),
  lsph: new THREE.IcosahedronGeometry(0.5, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 22),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  taper: new THREE.CylinderGeometry(0.5, 0.36, 1, 20),
  cone: new THREE.ConeGeometry(0.5, 1, 22),
  cone4: new THREE.ConeGeometry(0.5, 1, 4),
  cone6: new THREE.ConeGeometry(0.5, 1, 7),
  prism: new THREE.CylinderGeometry(0.5, 0.5, 1, 3),
  dome: new THREE.SphereGeometry(0.5, 22, 12, 0, TAU, 0, Math.PI / 2),
  bowl: new THREE.SphereGeometry(0.5, 22, 12, 0, TAU, Math.PI / 2, Math.PI / 2),
  slice: new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 1, false, 0, Math.PI / 3),
  half: new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 1, true, 0, Math.PI),
  tor: new THREE.TorusGeometry(0.5, 0.12, 10, 28),
  arc: new THREE.TorusGeometry(0.42, 0.11, 10, 20, Math.PI * 0.75),
  knot: new THREE.TorusKnotGeometry(0.3, 0.07, 80, 8, 3, 5),
  oct: new THREE.OctahedronGeometry(0.5),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  dod: new THREE.DodecahedronGeometry(0.5, 0),
  disc: new THREE.CircleGeometry(0.5, 32),
  ring: new THREE.RingGeometry(0.42, 0.5, 40),
};
geo.star = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.22 : 0.5, a = i / 10 * TAU + Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  g.center(); return g;
})();

// one part: shape, look, where, size, turn
export function P(g, m, pos = [0, 0, 0], sc = 1, rot = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geo[g] || g, m);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (typeof sc === "number") mesh.scale.setScalar(sc); else mesh.scale.set(sc[0], sc[1], sc[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
const grp = (...kids) => { const g = new THREE.Group(); kids.flat().forEach(k => k && g.add(k)); return g; };
const M = mat;
const GLASS = () => M(0xdff4ff, { op: 0.35, r: 0.05, m: 0.1 });
const PLATE = () => P("cyl", M(0xffffff, { r: 0.3 }), [0, 0.03, 0], [1.05, 0.06, 1.05]);
const ring = (n, r, f) => Array.from({ length: n }, (_, i) => f(Math.cos(i / n * TAU) * r, Math.sin(i / n * TAU) * r, i));

let rainbowTex = null;
function rainbow() {
  if (!rainbowTex) {
    const c = document.createElement("canvas"); c.width = 8; c.height = 64; const g = c.getContext("2d");
    ["#ff3b30", "#ff9500", "#ffe03a", "#4cd964", "#3aa8ff", "#9b6bff"].forEach((k, i) => { g.fillStyle = k; g.fillRect(0, i * 64 / 6, 8, 64 / 6 + 1); });
    rainbowTex = new THREE.CanvasTexture(c); rainbowTex.colorSpace = THREE.SRGBColorSpace;
  }
  return rainbowTex;
}

// ------------------------------------------------------------ ingredients
const INGS = {
  apple: () => grp(P("sph", M(0xd8262e, { r: 0.35 }), [0, 0.4, 0], [0.8, 0.74, 0.8]), P("cyl", M(0x6a4020), [0, 0.82, 0], [0.05, 0.2, 0.05]),
    P("sph", M(0x3fae3a), [0.13, 0.86, 0], [0.26, 0.05, 0.13], [0, 0, 0.4])),
  egg: () => grp(P("sph", M(0xfff1dc, { r: 0.35 }), [0, 0.4, 0], [0.56, 0.76, 0.56])),
  milk: () => grp(P("cyl", M(0xffffff, { r: 0.3 }), [0, 0.32, 0], [0.46, 0.62, 0.46]), P("cone", M(0xffffff, { r: 0.3 }), [0, 0.72, 0], [0.46, 0.22, 0.46]),
    P("cyl", M(0x2f7fe0), [0, 0.86, 0], [0.22, 0.12, 0.22]), P("cyl", M(0x2f7fe0), [0, 0.34, 0], [0.47, 0.16, 0.47])),
  wheat: () => grp([-1, 0, 1].map(i => grp(P("cyl", M(0x9a8a3a), [i * 0.1, 0.4, 0], [0.03, 0.8, 0.03], [0, 0, -i * 0.18]),
    P("sph", M(0xe8c050, { f: true }), [i * 0.18, 0.9, 0], [0.13, 0.36, 0.13], [0, 0, -i * 0.18])))),
  carrot: () => grp(P("cone", M(0xff8a1f), [0, 0.42, 0], [0.32, 0.84, 0.32], [Math.PI, 0, 0]),
    [-0.3, 0, 0.3].map(a => P("cone", M(0x3fae3a), [a * 0.3, 0.98, 0], [0.09, 0.36, 0.09], [0, 0, a]))),
  strawberry: () => grp(P("cone", M(0xe8263a), [0, 0.32, 0], [0.56, 0.56, 0.56], [Math.PI, 0, 0]), P("sph", M(0xe8263a), [0, 0.6, 0], [0.56, 0.32, 0.56]),
    P("cone6", M(0x3fae3a), [0, 0.78, 0], [0.5, 0.08, 0.5]),
    ring(6, 0.18, (x, z) => P("sph", M(0xffe680), [x, 0.42, z], 0.05))),
  twig: () => grp(P("cyl", M(0x8a5a2b), [0, 0.5, 0], [0.07, 1.05, 0.07], [0, 0, 0.45]), P("cyl", M(0x8a5a2b), [0.06, 0.55, 0], [0.04, 0.35, 0.04], [0, 0, -0.6]),
    P("oct", M(0xfff0a0, { e: 1.2 }), [-0.24, 0.98, 0], 0.13)),
  tomato: () => grp(P("sph", M(0xe8322a, { r: 0.3 }), [0, 0.36, 0], [0.82, 0.66, 0.82]), P("cone6", M(0x3fae3a), [0, 0.7, 0], [0.32, 0.07, 0.32])),
  cheese: () => grp(P("prism", M(0xffcf3a, { r: 0.6 }), [0, 0.26, 0], [0.95, 0.52, 0.95]),
    P("sph", M(0xe0a820), [0.1, 0.3, 0.33], [0.13, 0.13, 0.04]), P("sph", M(0xe0a820), [-0.12, 0.18, 0.3], [0.09, 0.09, 0.04])),
  olive: () => grp(P("cyl", M(0x6a5030), [0, 0.6, 0], [0.03, 0.7, 0.03], [0, 0, 1.2]),
    [[-0.2, 0.45], [0.05, 0.38], [0.25, 0.48]].map(([x, y]) => P("sph", M(0x55702a, { r: 0.25 }), [x, y, 0], [0.24, 0.32, 0.24]))),
  basil: () => grp(P("cyl", M(0x2f7a2f), [0, 0.35, 0], [0.04, 0.7, 0.04]),
    [0, 1, 2, 3, 4].map(i => P("sph", M(0x3fa34a), [Math.cos(i * 2.4) * 0.18, 0.25 + i * 0.12, Math.sin(i * 2.4) * 0.18], [0.36, 0.06, 0.2], [0, i * 2.4, 0.3]))),
  corn: () => grp(P("cyl", M(0xffd23a, { f: true }), [0, 0.5, 0], [0.36, 0.72, 0.36]), P("sph", M(0xffd23a), [0, 0.86, 0], [0.36, 0.3, 0.36]),
    P("cone", M(0x5fae3a), [0.16, 0.36, 0], [0.24, 0.8, 0.12], [0, 0, -0.25]), P("cone", M(0x5fae3a), [-0.16, 0.36, 0], [0.24, 0.8, 0.12], [0, 0, 0.25])),
  chili: () => grp(P("cone", M(0xd81e1e, { r: 0.25 }), [0, 0.4, 0], [0.24, 0.86, 0.24], [0, 0, 2.7]), P("cyl", M(0x3f8a2a), [-0.18, 0.82, 0], [0.06, 0.18, 0.06], [0, 0, 0.4])),
  avocado: () => grp(P("sph", M(0x2e5a1e), [0, 0.42, 0], [0.62, 0.82, 0.5]), P("sph", M(0xc8e070), [0, 0.4, 0.2], [0.48, 0.66, 0.12]),
    P("sph", M(0x7a4a22), [0, 0.34, 0.25], [0.24, 0.24, 0.14])),
  cactus: () => grp(P("cyl", M(0x3a9a3a, { f: true }), [0, 0.42, 0], [0.3, 0.84, 0.3]), P("sph", M(0x3a9a3a), [0, 0.84, 0], 0.3),
    P("cyl", M(0x3a9a3a), [0.26, 0.45, 0], [0.14, 0.2, 0.14], [0, 0, Math.PI / 2]), P("cyl", M(0x3a9a3a), [0.33, 0.6, 0], [0.14, 0.32, 0.14]),
    P("sph", M(0xff7ab0), [0, 0.98, 0], 0.13)),
  banana: () => grp(P("arc", M(0xffe14a, { r: 0.4 }), [0, 0.55, 0], 1, [0, 0, 3.6]), P("arc", M(0xffd23a, { r: 0.4 }), [0.1, 0.52, 0.12], 0.95, [0.3, 0, 3.5])),
  cocoa: () => grp(P("lsph", M(0xc8701e, { f: true }), [0, 0.42, 0], [0.48, 0.84, 0.48], [0, 0, 0.3]), P("cyl", M(0x6a4020), [0.13, 0.86, 0], [0.05, 0.14, 0.05], [0, 0, 0.3])),
  coconut: () => grp(P("lsph", M(0x6a4428, { f: true, r: 0.9 }), [0, 0.36, 0], 0.72),
    [[-0.1, 0.62], [0.1, 0.62], [0, 0.5]].map(([x, y]) => P("sph", M(0x3a2414), [x, y, 0.3], 0.07))),
  feather: () => grp(P("sph", M(0x2ab0ff), [0, 0.52, 0], [0.22, 0.92, 0.06], [0, 0, 0.3]), P("sph", M(0xff3b30), [0.02, 0.6, 0.02], [0.12, 0.6, 0.06], [0, 0, 0.3]),
    P("cyl", M(0xf0f0f0), [0.13, 0.1, 0], [0.03, 0.3, 0.03], [0, 0, 0.3])),
  rice: () => grp(P("bowl", M(0xffffff, { r: 0.3, ds: true }), [0, 0.42, 0], [0.95, 0.75, 0.95]), P("tor", M(0x2f7fe0), [0, 0.42, 0], [0.92, 0.92, 0.4], [Math.PI / 2, 0, 0]),
    P("sph", M(0xfafafa, { f: true }), [0, 0.45, 0], [0.82, 0.42, 0.82])),
  fish: () => grp(P("sph", M(0x5aa0d8, { r: 0.3 }), [0, 0.42, 0], [0.92, 0.46, 0.3]), P("cone", M(0x5aa0d8), [-0.55, 0.42, 0], [0.32, 0.36, 0.1], [0, 0, Math.PI / 2]),
    P("sph", M(0xffffff), [0.28, 0.48, 0.13], 0.1), P("sph", M(0x111111), [0.3, 0.48, 0.17], 0.05)),
  blossom: () => grp(ring(5, 0.22, (x, z, i) => P("sph", M(0xffb0d0), [x, 0.42, z], [0.34, 0.1, 0.3], [0, -i / 5 * TAU, 0])),
    P("sph", M(0xffe04a), [0, 0.46, 0], 0.15)),
  tea: () => grp(P("taper", M(0xf0ece0, { r: 0.3 }), [0, 0.26, 0], [0.6, 0.5, 0.6]), P("cyl", M(0x7ab84a), [0, 0.48, 0], [0.54, 0.02, 0.54]),
    P("tor", M(0xf0ece0), [0.33, 0.28, 0], [0.22, 0.22, 0.3])),
  ice: () => grp(P("box", M(0xbfe8ff, { op: 0.75, r: 0.05, m: 0.1 }), [0, 0.36, 0], 0.62, [0.3, 0.5, 0.1]), P("box", M(0xbfe8ff, { op: 0.75, r: 0.05 }), [0.32, 0.2, 0.2], 0.36, [0.2, 0.9, 0.3])),
  snowflake: () => grp([0, 1, 2].map(i => P("box", M(0xe8f8ff, { e: 0.8 }), [0, 0.5, 0], [0.08, 0.9, 0.08], [0, 0, i * Math.PI / 3])),
    ring(6, 0.32, (x, y) => P("oct", M(0xe8f8ff, { e: 0.8 }), [x, 0.5 + y, 0], 0.1)), P("sph", M(0xffffff, { e: 1 }), [0, 0.5, 0], 0.14)),
  blueberry: () => grp([[0, 0.2, 0], [0.22, 0.2, 0.05], [-0.2, 0.2, 0.08], [0.05, 0.2, -0.2], [0.02, 0.4, 0.02]].map(p => P("sph", M(0x3a4ab8, { r: 0.3 }), p, 0.3))),
  honey: () => grp(P("cyl", M(0xf0a020, { op: 0.92, r: 0.15 }), [0, 0.32, 0], [0.56, 0.62, 0.56]), P("cyl", M(0xe8e0c8), [0, 0.68, 0], [0.6, 0.12, 0.6]),
    P("cyl", M(0xffffff), [0, 0.34, 0.27], [0.3, 0.25, 0.02], [Math.PI / 2, 0, 0])),
  sand: () => grp(P("cone", M(0xf0c850, { f: true }), [0, 0.24, 0], [0.84, 0.48, 0.84]),
    [[0, 0.62, 0], [0.24, 0.4, 0.2], [-0.25, 0.35, 0.15]].map(p => P("oct", M(0xfff0a0, { e: 1.5 }), p, 0.12))),
  lemon: () => grp(P("sph", M(0xffe23a, { r: 0.4 }), [0, 0.32, 0], [0.72, 0.5, 0.5]), P("sph", M(0xffe23a), [0.36, 0.32, 0], 0.12), P("sph", M(0xffe23a), [-0.36, 0.32, 0], 0.1)),
  mushroom: () => grp(P("cyl", M(0xf4ecd8), [0, 0.27, 0], [0.34, 0.54, 0.34]), P("dome", M(0xe03030, { r: 0.4 }), [0, 0.5, 0], [0.95, 0.75, 0.95]),
    [[0.2, 0.75, 0.15], [-0.18, 0.72, 0.2], [0, 0.84, -0.1], [0.28, 0.62, -0.2]].map(p => P("sph", M(0xffffff), p, [0.13, 0.06, 0.13]))),
  clover: () => grp(P("cyl", M(0x2f8a2f), [0, 0.3, 0], [0.04, 0.6, 0.04]),
    ring(4, 0.16, (x, z, i) => P("sph", M(0x3fbf4a), [x, 0.62, z], [0.32, 0.07, 0.28], [0, -i / 4 * TAU + Math.PI / 4, 0]))),
  moonflower: () => grp(P("cyl", M(0x2f8a2f), [0, 0.25, 0], [0.04, 0.5, 0.04]),
    ring(6, 0.18, (x, z, i) => P("sph", M(0xd8e4ff, { e: 0.7 }), [x, 0.55, z], [0.18, 0.06, 0.4], [0, -i / 6 * TAU + Math.PI / 2, 0])),
    P("sph", M(0xbfe0ff, { e: 1.2 }), [0, 0.58, 0], 0.13)),
  star: () => grp(P("star", M(0xffe04a, { e: 0.9, m: 0.3, r: 0.3 }), [0, 0.5, 0], 1.05),
    [[0.42, 0.85, 0], [-0.4, 0.2, 0.1]].map(p => P("oct", M(0xfff6b0, { e: 1.5 }), p, 0.12))),
  ember: () => grp(P("cone6", M(0xff5a1f, { e: 1.4 }), [0, 0.38, 0], [0.5, 0.76, 0.5]), P("cone6", M(0xffd23a, { e: 2 }), [0, 0.3, 0.05], [0.3, 0.5, 0.3]),
    P("dod", M(0x3a2a2a, { f: true }), [0, 0.06, 0], [0.55, 0.15, 0.55])),
  crystal: () => grp(P("oct", M(0x6ad8ff, { r: 0.1, m: 0.2, e: 0.35, f: true }), [0, 0.5, 0], [0.5, 1, 0.5]),
    P("oct", M(0xb08aff, { r: 0.1, e: 0.35, f: true }), [0.28, 0.25, 0.1], [0.24, 0.5, 0.24], [0, 0, -0.4])),
  salmon: () => grp(P("box", M(0xff8a6a, { r: 0.4 }), [0, 0.22, 0], [1, 0.36, 0.55], [0, 0.3, 0]),
    [-0.3, -0.1, 0.1, 0.3].map(x => P("box", M(0xffd0c0), [x, 0.41, 0], [0.04, 0.02, 0.5], [0, 0.3, 0.3]))),
  pineapple: () => grp(P("lsph", M(0xe8a83a, { f: true }), [0, 0.38, 0], [0.56, 0.76, 0.56]),
    [-0.4, 0, 0.4, 0.2, -0.2].map((a, i) => P("cone", M(0x3f9a3a), [a * 0.15, 0.88, (i % 2) * 0.05], [0.14, 0.5, 0.14], [0.1 * (i % 2), 0, a]))),
};

// ------------------------------------------------------------ cooked things
const glassOf = (col, h = 0.8) => [P("taper", GLASS(), [0, h / 2, 0], [0.5, h, 0.5]), P("taper", M(col, { r: 0.4 }), [0, h * 0.42, 0], [0.44, h * 0.8, 0.44])];
const FOODS = {
  shake: () => grp(glassOf(0xff9ac0), P("sph", M(0xffffff), [0, 0.82, 0], [0.46, 0.25, 0.46]), P("cyl", M(0xff3b30), [0.12, 1.0, 0], [0.05, 0.6, 0.05], [0, 0, -0.25]),
    P("sph", M(0xd8102a, { r: 0.2 }), [-0.05, 0.98, 0], 0.13)),
  pancakes: () => grp(PLATE(), [0, 1, 2, 3].map(i => P("cyl", M(0xe0a050), [0, 0.12 + i * 0.1, 0], [0.76, 0.09, 0.76])),
    P("cyl", M(0xb8601a, { op: 0.9, r: 0.1 }), [0, 0.5, 0], [0.62, 0.03, 0.62]), P("box", M(0xfff0a0), [0, 0.55, 0], [0.2, 0.08, 0.2])),
  applepie: () => grp(PLATE(), P("cyl", M(0xe0a050), [0, 0.18, 0], [0.86, 0.24, 0.86]),
    [-1, 0, 1].flatMap(i => [P("box", M(0xf0c070), [i * 0.2, 0.31, 0], [0.08, 0.04, 0.8]), P("box", M(0xf0c070), [0, 0.32, i * 0.2], [0.8, 0.04, 0.08])])),
  carrotcake: () => grp(PLATE(), P("slice", M(0xf0d8b0), [0, 0.3, 0], [1.4, 0.5, 1.4], [0, -0.5, 0]), P("slice", M(0xb8743a), [0, 0.3, 0], [1.42, 0.12, 1.42], [0, -0.5, 0]),
    P("slice", M(0xffffff), [0, 0.57, 0], [1.42, 0.06, 1.42], [0, -0.5, 0]), P("cone", M(0xff8a1f), [0.22, 0.68, 0.1], [0.08, 0.2, 0.08], [0, 0, 1.2])),
  pizza: () => grp(P("cyl", M(0xe8b860), [0, 0.06, 0], [1, 0.1, 1]), P("cyl", M(0xd8321e), [0, 0.11, 0], [0.86, 0.02, 0.86]), P("cyl", M(0xffd860), [0, 0.12, 0], [0.8, 0.02, 0.8]),
    [[0.2, 0.15], [-0.2, 0.1], [0.05, -0.25], [-0.15, -0.15], [0.25, -0.1]].map(([x, z]) => P("cyl", M(0xa8201a), [x, 0.14, z], [0.15, 0.02, 0.15])),
    [[0, 0.25], [-0.3, -0.05]].map(([x, z]) => P("sph", M(0x3fa34a), [x, 0.14, z], [0.12, 0.03, 0.08]))),
  pasta: () => grp(PLATE(), P("knot", M(0xf0d070), [0, 0.22, 0], [1, 0.5, 1], [Math.PI / 2, 0, 0]), P("sph", M(0xd8321e), [0, 0.32, 0], [0.4, 0.14, 0.4]),
    P("sph", M(0x3fa34a), [0.08, 0.4, 0], [0.14, 0.04, 0.08])),
  salad: () => grp(P("bowl", M(0xffffff, { ds: true }), [0, 0.42, 0], [0.95, 0.8, 0.95]),
    ring(7, 0.24, (x, z, i) => P("sph", M(i % 2 ? 0x5fbf3a : 0x3f9a2a), [x, 0.46, z], [0.3, 0.12, 0.24], [0.3, i, 0])),
    P("sph", M(0xe8322a), [0.1, 0.52, 0.05], 0.18), P("sph", M(0x55702a), [-0.15, 0.5, -0.1], 0.12), P("cyl", M(0xff8a1f), [0, 0.52, -0.2], [0.1, 0.05, 0.1])),
  tacos: () => grp(PLATE(), [-0.25, 0.25].map(x => grp(P("half", M(0xf0c050, { ds: true }), [x, 0.32, 0], [0.5, 0.7, 0.5], [Math.PI / 2, 0, Math.PI]),
    P("sph", M(0x5fbf3a), [x, 0.48, 0], [0.4, 0.14, 0.5]), P("sph", M(0xd8321e), [x + 0.05, 0.5, 0.1], 0.1), P("sph", M(0x8a5a2b), [x - 0.05, 0.45, -0.1], [0.3, 0.12, 0.3])))),
  popcorn: () => grp(P("taper", M(0xe8322a), [0, 0.36, 0], [0.62, 0.72, 0.62], [Math.PI, 0, 0]),
    Array.from({ length: 11 }, (_, i) => P("lsph", M(i % 3 ? 0xfff6d8 : 0xffe48a, { f: true }), [Math.cos(i * 2.1) * 0.2 * (i % 2 + 0.4), 0.75 + (i % 3) * 0.08, Math.sin(i * 2.1) * 0.2], 0.2))),
  choccake: () => grp(PLATE(), P("cyl", M(0x6a3a1e), [0, 0.16, 0], [0.8, 0.22, 0.8]), P("cyl", M(0xfff0e0), [0, 0.3, 0], [0.82, 0.05, 0.82]),
    P("cyl", M(0x6a3a1e), [0, 0.43, 0], [0.8, 0.22, 0.8]), P("cyl", M(0x4a2414, { r: 0.2 }), [0, 0.56, 0], [0.82, 0.05, 0.82]),
    P("cyl", M(0xff7ab0), [0, 0.7, 0], [0.05, 0.26, 0.05]), P("sph", M(0xffc83a, { e: 2 }), [0, 0.88, 0], [0.07, 0.12, 0.07])),
  hotchoc: () => grp(P("cyl", M(0xff7a5a, { r: 0.3 }), [0, 0.3, 0], [0.56, 0.58, 0.56]), P("cyl", M(0x5a2e14), [0, 0.57, 0], [0.5, 0.02, 0.5]),
    P("tor", M(0xff7a5a), [0.32, 0.32, 0], [0.26, 0.26, 0.4]), P("box", M(0xffffff), [0.08, 0.6, 0.05], 0.1), P("box", M(0xffe0f0), [-0.1, 0.6, -0.04], 0.1)),
  smoothie: () => grp(glassOf(0xffa83a, 0.9), P("cone", M(0xff7ab0, { ds: true }), [0.12, 1.1, 0], [0.5, 0.15, 0.5]), P("cyl", M(0xffffff), [0.12, 0.95, 0], [0.02, 0.3, 0.02]),
    P("slice", M(0xffe14a), [-0.2, 0.88, 0], [0.4, 0.1, 0.4], [Math.PI / 2, 0, 0])),
  sushi: () => grp([-0.24, 0.24].map(x => grp(P("box", M(0xfafafa, { f: true }), [x, 0.14, 0], [0.34, 0.24, 0.6]), P("box", M(0xff8a5a, { r: 0.3 }), [x, 0.3, 0], [0.38, 0.08, 0.64]),
    P("box", M(0x1a2a1a), [x, 0.2, 0], [0.36, 0.3, 0.12])))),
  riceball: () => grp(P("prism", M(0xfafafa, { f: true }), [0, 0.42, 0], [0.82, 0.38, 0.82], [Math.PI / 2, 0, 0]), P("box", M(0x1a2a1a), [0, 0.22, 0], [0.34, 0.3, 0.4])),
  dango: () => grp(P("cyl", M(0xc8a060), [0, 0.55, 0], [0.04, 1.1, 0.04]), [0xffa8c8, 0xfafafa, 0x9ad870].map((c, i) => P("sph", M(c, { r: 0.4 }), [0, 0.32 + i * 0.27, 0], 0.32))),
  icecream: () => grp(P("cone", M(0xd8a050, { f: true }), [0, 0.36, 0], [0.42, 0.72, 0.42], [Math.PI, 0, 0]), P("sph", M(0xff9ac0), [0, 0.78, 0], 0.44), P("sph", M(0xfff6e8), [0, 1.04, 0], 0.36),
    P("sph", M(0xd8102a), [0, 1.25, 0], 0.1)),
  muffin: () => grp(P("taper", M(0x6a8ad8), [0, 0.22, 0], [0.62, 0.44, 0.62], [Math.PI, 0, 0]), P("sph", M(0xc8905a, { f: true }), [0, 0.48, 0], [0.74, 0.5, 0.74]),
    [[0.15, 0.62, 0.15], [-0.18, 0.58, 0.1], [0, 0.66, -0.15], [0.2, 0.55, -0.15]].map(p => P("sph", M(0x3a4ab8), p, 0.1))),
  lemonade: () => grp(glassOf(0xfff07a), P("cyl", M(0xffe23a), [0.22, 0.85, 0], [0.32, 0.04, 0.32], [0, 0, Math.PI / 2]), P("box", M(0xdff4ff, { op: 0.7 }), [0, 0.62, 0], 0.16, [0.4, 0.3, 0]),
    P("cyl", M(0xffffff), [-0.1, 0.95, 0], [0.04, 0.5, 0.04], [0, 0, 0.2])),
  cookies: () => grp([0, 1, 2].map(i => grp(P("cyl", M(0xc8904a, { f: true }), [i * 0.06 - 0.06, 0.08 + i * 0.12, i * 0.04], [0.62, 0.11, 0.62], [0.05 * i, 0, 0.04 * i]))),
    [[0.1, 0.36, 0.1], [-0.15, 0.36, 0.02], [0.02, 0.36, -0.18]].map(p => P("sph", M(0x3a1e0e), p, 0.08))),
  curry: () => grp(P("bowl", M(0xffffff, { ds: true }), [0, 0.42, 0], [0.95, 0.75, 0.95]), P("cyl", M(0xe08a1e), [0, 0.38, 0], [0.86, 0.02, 0.86]),
    P("sph", M(0xfafafa, { f: true }), [-0.15, 0.42, 0], [0.42, 0.22, 0.42]), P("sph", M(0xd81e1e), [0.2, 0.42, 0.1], [0.1, 0.06, 0.2])),
  salmonrice: () => grp(P("bowl", M(0x2a2a3a, { ds: true }), [0, 0.42, 0], [0.95, 0.75, 0.95]), P("sph", M(0xfafafa, { f: true }), [0, 0.42, 0], [0.82, 0.36, 0.82]),
    [-0.2, 0, 0.2].map(x => P("box", M(0xff8a6a), [x, 0.6, 0], [0.18, 0.08, 0.5], [0, 0, 0.1]))),
  sundae: () => grp(P("taper", GLASS(), [0, 0.35, 0], [0.62, 0.7, 0.62]), P("sph", M(0xffe86a), [0, 0.74, 0], 0.4), P("sph", M(0xfff6e8), [0.12, 0.95, 0.05], 0.32),
    P("slice", M(0xffc83a), [-0.2, 0.95, 0], [0.5, 0.12, 0.5], [Math.PI / 2, 0, 0.3]), P("sph", M(0xd8102a), [0.1, 1.15, 0.05], 0.1)),
};
function potion(color) {
  const liquid = color === "rainbow" ? M(0xffffff, { map: rainbow(), e: 0.3, ec: 0xffffff }) : M(color, { e: 0.45, r: 0.2 });
  return grp(P("sph", GLASS(), [0, 0.42, 0], 0.84), P("sph", liquid, [0, 0.38, 0], [0.74, 0.62, 0.74]),
    P("cyl", GLASS(), [0, 0.9, 0], [0.26, 0.3, 0.26]), P("cyl", M(0xb8804a), [0, 1.08, 0], [0.24, 0.16, 0.24]),
    P("sph", M(0xffffff, { op: 0.8 }), [-0.18, 0.55, 0.28], 0.1));
}
function wand(color) {
  const g = grp(P("cyl", M(0x4a2e18, { r: 0.4 }), [0, 0.5, 0], [0.08, 1.1, 0.08]), P("cyl", M(0xffc83a, { m: 0.7, r: 0.3 }), [0, 0.2, 0], [0.11, 0.3, 0.11]),
    P("oct", M(color, { e: 1.5 }), [0, 1.12, 0], 0.26), P("tor", M(color, { e: 1 }), [0, 1.12, 0], [0.42, 0.42, 0.2], [Math.PI / 2, 0, 0]));
  g.rotation.z = -0.45; g.position.x = -0.15;
  return grp(g);
}

// any ingredient or cooked thing, about one unit tall
export function itemModel(id) {
  if (INGS[id]) return INGS[id]();
  const r = REC[id]; if (!r) return grp(P("box", M(0xff00ff)));
  if (r.kind === "potion") return potion(r.potion);
  if (r.kind === "wand") return wand(r.color);
  const f = FOODS[id] || FOODS[{ sundaedish: "sundae" }[id]];
  return f ? f() : grp(PLATE());
}
// pictures for the upgrades
export function upgradeModel(id) {
  if (id === "shoes") return grp([-0.3, 0.3].map(x => grp(P("box", M(0xe8322a, { r: 0.4 }), [x, 0.3, 0.05], [0.4, 0.4, 0.9]), P("box", M(0xffffff), [x, 0.08, 0.05], [0.44, 0.14, 0.96]),
    P("sph", M(0xe8322a), [x, 0.42, -0.25], [0.4, 0.5, 0.4]), P("box", M(0xffffff), [x, 0.52, 0.2], [0.3, 0.04, 0.3]))));
  if (id === "magnet") return grp(P("arc", M(0xe8322a, { r: 0.3 }), [0, 0.55, 0], 1.1, [0, 0, 0]),
    P("box", M(0xd8e0ea, { m: 0.9, r: 0.2 }), [0.46, 0.38, 0], [0.26, 0.22, 0.26]), P("box", M(0xd8e0ea, { m: 0.9, r: 0.2 }), [-0.33, 0.12, 0], [0.26, 0.22, 0.26], [0, 0, -0.8]));
  return grp(P("taper", M(0xc8904a, { f: true, r: 0.9 }), [0, 0.3, 0], [1, 0.6, 1], [Math.PI, 0, 0]), P("tor", M(0xa8703a), [0, 0.6, 0], [0.8, 0.8, 1]),
    P("sph", M(0xd8262e), [-0.15, 0.6, 0], 0.32), P("sph", M(0xffd23a), [0.2, 0.62, 0.1], 0.28));
}
export const hasModel = id => !!(INGS[id] || REC[id]);

export function coinModel() {
  return grp(P("cyl", M(0xffc83a, { m: 0.8, r: 0.25 }), [0, 0, 0], [0.62, 0.1, 0.62], [Math.PI / 2, 0, 0]),
    P("cyl", M(0xffe07a, { m: 0.6, r: 0.25 }), [0, 0, 0], [0.42, 0.13, 0.42], [Math.PI / 2, 0, 0]));
}
export function chestModel() {
  return grp(P("box", M(0x8a4a20, { r: 0.6 }), [0, 0.3, 0], [1, 0.6, 0.7]), P("box", M(0x9a5a28), [0, 0.72, 0], [1.02, 0.26, 0.72]),
    [-0.35, 0.35].map(x => P("box", M(0xffc83a, { m: 0.7 }), [x, 0.48, 0], [0.1, 0.98, 0.74])), P("box", M(0xffc83a, { m: 0.7, e: 0.3 }), [0, 0.55, 0.37], [0.18, 0.22, 0.06]));
}

// ------------------------------------------------------------ the chef
export function chefModel(shirt = 0xf6f6f6) {
  const skin = M(0xf2c39a), white = M(0xffffff, { r: 0.7 }), dark = M(0x2b2b3a);
  const g = new THREE.Group();
  const body = P("cyl", M(shirt), [0, 1.05, 0], [0.62, 0.7, 0.42]);

  const head = P("sph", skin, [0, 1.7, 0], 0.62);
  const eyes = [-0.12, 0.12].map(x => P("sph", dark, [x, 1.74, 0.27], 0.08));
  const smile = P("tor", dark, [0, 1.6, 0.27], [0.16, 0.16, 0.16], [0, 0, Math.PI]); smile.geometry = new THREE.TorusGeometry(0.5, 0.12, 8, 16, Math.PI);
  const hatBand = P("cyl", white, [0, 2.02, 0], [0.5, 0.18, 0.5]);
  const puffs = [[-0.14, 2.22, 0], [0.14, 2.22, 0], [0, 2.3, 0.05], [0, 2.22, -0.12]].map(p => P("sph", white, p, 0.34));
  const legs = [-0.14, 0.14].map(x => { const l = new THREE.Group(); l.position.set(x, 0.72, 0); l.add(P("cyl", dark, [0, -0.32, 0], [0.18, 0.64, 0.18]), P("box", M(0x111111), [0, -0.66, 0.06], [0.2, 0.1, 0.3])); return l; });
  const arms = [-0.4, 0.4].map(x => { const a = new THREE.Group(); a.position.set(x, 1.32, 0); a.add(P("cyl", M(shirt), [0, -0.25, 0], [0.15, 0.5, 0.15]), P("sph", skin, [0, -0.54, 0], 0.17)); return a; });
  const scarf = P("cyl", M(0xe8322a), [0, 1.42, 0.02], [0.5, 0.12, 0.38]), knot = P("sph", M(0xe8322a), [0, 1.36, 0.24], 0.14);
  const buttons = [1.25, 1.05, 0.85].flatMap(y => [-0.08, 0.08].map(x => P("sph", M(0x2b2b3a), [x, y, 0.22], 0.05)));
  g.add(body, head, ...eyes, smile, hatBand, ...puffs, ...legs, ...arms, scarf, knot, ...buttons);
  const hand = new THREE.Group(); hand.position.set(0, -0.56, 0.05); arms[1].add(hand);
  g.userData = { legs, arms, hand };
  return g;
}

// ------------------------------------------------------------ vehicles
export function vehicleModel(id) {
  const red = M(0xe8322a, { r: 0.35, m: 0.2 }), white = M(0xf4f4f4, { r: 0.35 }), blue = M(0x2f7fe0, { r: 0.3 }), glass = M(0x9ad8ff, { r: 0.05, m: 0.3 }), dark = M(0x333344);
  const g = new THREE.Group(); let spin = null;
  const add = (...k) => g.add(...k.flat());
  if (id === "plane") {
    add(P("cyl", red, [0, 1, 0], [0.9, 3.4, 0.9], [0, 0, Math.PI / 2]), P("cone", red, [1.95, 1, 0], [0.9, 0.5, 0.9], [0, 0, -Math.PI / 2]),
      P("box", white, [0.2, 1.05, 0], [1.1, 0.12, 5]), P("box", white, [-1.5, 1.2, 0], [0.6, 0.1, 1.8]), P("box", red, [-1.55, 1.6, 0], [0.6, 0.8, 0.1]),
      P("sph", glass, [0.7, 1.4, 0], [0.8, 0.5, 0.6]), [-0.6, 0.6].map(z => P("cyl", dark, [0.6, 0.25, z], [0.4, 0.15, 0.4], [Math.PI / 2, 0, 0])));
    spin = P("box", dark, [2.22, 1, 0], [0.08, 1.8, 0.16]); g.add(spin); g.userData.spinAxis = "x";
  } else if (id === "balloon") {
    const c = document.createElement("canvas"); c.width = 128; c.height = 8; const x = c.getContext("2d");
    for (let i = 0; i < 8; i++) { x.fillStyle = ["#ff3b30", "#ffd23f", "#3aa8ff", "#ffffff"][i % 4]; x.fillRect(i * 16, 0, 16, 8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    add(P("sph", M(0xffffff, { map: t, r: 0.6 }), [0, 4, 0], [3.2, 3.6, 3.2]), P("cone", M(0xffffff, { map: t }), [0, 2.05, 0], [1.6, 1.2, 1.6], [Math.PI, 0, 0]),
      P("box", M(0x8a5a2b, { r: 0.9 }), [0, 0.45, 0], [1.1, 0.8, 1.1]), ring(4, 0.55, (a, b) => P("cyl", dark, [a, 1.1, b], [0.04, 1.2, 0.04])),
      P("cone", M(0xffa02a, { e: 2 }), [0, 1.3, 0], [0.3, 0.5, 0.3]));
  } else if (id === "heli") {
    add(P("sph", blue, [0, 1.3, 0], [2.2, 1.6, 1.5]), P("sph", glass, [0.7, 1.45, 0], [1, 1.1, 1.2]), P("cyl", blue, [-1.8, 1.5, 0], [0.3, 2.2, 0.3], [0, 0, Math.PI / 2]),
      P("box", blue, [-2.8, 1.9, 0], [0.4, 0.9, 0.1]), [-0.6, 0.6].map(z => P("box", dark, [0, 0.25, z], [2.2, 0.1, 0.12])), P("cyl", dark, [0, 2.2, 0], [0.15, 0.4, 0.15]));
    spin = P("box", dark, [0, 2.42, 0], [5, 0.06, 0.25]); g.add(spin); g.userData.spinAxis = "y";
  } else if (id === "jet") {
    const silver = M(0xd8e0ea, { m: 0.6, r: 0.25 });
    add(P("cyl", silver, [0, 1, 0], [0.8, 4, 0.8], [0, 0, Math.PI / 2]), P("cone", silver, [2.6, 1, 0], [0.8, 1.2, 0.8], [0, 0, -Math.PI / 2]),
      P("sph", glass, [1.3, 1.35, 0], [1.2, 0.5, 0.5]), P("box", silver, [0, 1, 1.4], [1.6, 0.08, 2.4], [0, -0.5, 0]), P("box", silver, [0, 1, -1.4], [1.6, 0.08, 2.4], [0, 0.5, 0]),
      P("box", blue, [-1.8, 1.7, 0], [1, 1.1, 0.1], [0, 0, 0.5]), P("cone", M(0x6ad8ff, { e: 2 }), [-2.3, 1, 0], [0.5, 0.6, 0.5], [0, 0, Math.PI / 2]));
  } else {
    add(P("cyl", white, [0, 2, 0], [1.2, 3, 1.2]), P("cone", red, [0, 4.1, 0], [1.2, 1.2, 1.2]), P("sph", glass, [0, 2.8, 0.55], [0.5, 0.5, 0.2]),
      ring(3, 0.65, (a, b, i) => P("box", red, [a, 0.75, b], [0.1, 1.1, 0.7], [0, -i / 3 * TAU, 0])), P("cone", M(0xffa02a, { e: 2.5 }), [0, 0.15, 0], [0.8, 0.9, 0.8], [Math.PI, 0, 0]));
  }
  g.userData.spin = spin;
  return g;
}

// ------------------------------------------------------------ scenery
const tree = (s = 1, c = 0x4f9a3a) => grp(P("cyl", M(0x7a5232), [0, 0.8 * s, 0], [0.35 * s, 1.6 * s, 0.35 * s]), P("lsph", M(c, { f: true }), [0, 2.2 * s, 0], 2.2 * s));
const pine = (s = 1, c = 0x2f6e3a, snow = false) => grp(P("cyl", M(0x6a4a2a), [0, 0.5 * s, 0], [0.3 * s, 1 * s, 0.3 * s]),
  [0, 1, 2].map(i => P("cone6", M(snow && i === 2 ? 0xffffff : c, { f: true }), [0, (1.4 + i * 0.9) * s, 0], [(2.4 - i * 0.6) * s, 1.5 * s, (2.4 - i * 0.6) * s])));
const palm = (s = 1) => { const g = grp(); for (let i = 0; i < 5; i++) g.add(P("cyl", M(0x9a7040), [i * 0.08 * s, (0.4 + i * 0.75) * s, 0], [0.32 * s, 0.8 * s, 0.32 * s], [0, 0, -0.08]));
  for (let i = 0; i < 6; i++) g.add(P("box", M(0x3f9a3a, { f: true }), [0.4 * s + Math.cos(i) * 0.9 * s, 3.9 * s, Math.sin(i * 1.05) * 0.9 * s], [2.2 * s, 0.08 * s, 0.6 * s], [0, i * 1.05, -0.35]));
  g.add(P("sph", M(0x6a4428), [0.4 * s, 3.7 * s, 0.2 * s], 0.35 * s)); return g; };
const rock = (s = 1, c = 0x8a8a90) => P("dod", M(c, { f: true, r: 0.9 }), [0, 0.4 * s, 0], [1.6 * s, 1.1 * s, 1.3 * s], [0, s * 3, 0]);
const bush = (c = 0x3f8a2f) => grp(P("lsph", M(c, { f: true }), [0, 0.5, 0], 1.3), P("lsph", M(c, { f: true }), [0.6, 0.4, 0.2], 0.9));

// a word on a board that always faces the camera
export function label(text, col = "#7fe3ff") {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128; const g = c.getContext("2d");
  g.fillStyle = "rgba(8,16,34,.82)"; g.beginPath(); g.roundRect(8, 16, 496, 96, 48); g.fill();
  g.strokeStyle = col; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#fff"; g.font = "900 58px system-ui, -apple-system, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  // the same size on the screen however near or far it is
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, sizeAttenuation: false }));
  s.scale.set(0.2, 0.05, 1); s.renderOrder = 10; return s;
}

// The fixed things in each place, with circles the chef can't walk through.
// Every place keeps the middle clear for picking things up.
export function scenery(id, rnd) {
  const g = new THREE.Group(), solid = [];
  const put = (obj, x, z, r = 0, ry = rnd() * TAU) => { obj.position.set(x, 0, z); obj.rotation.y = ry; g.add(obj); if (r) solid.push({ x, z, r }); return obj; };
  // scatter round the edge, out of the walking space
  const edge = (make, n, rMin = 24, rMax = 34, solidR = 0) => { for (let i = 0; i < n; i++) { const a = rnd() * TAU, d = rMin + rnd() * (rMax - rMin); put(make(i), Math.cos(a) * d, Math.sin(a) * d, solidR); } };
  const inner = (make, n, r = 1) => { for (let i = 0; i < n; i++) { let x, z, k = 0; do { x = (rnd() - 0.5) * 40; z = (rnd() - 0.5) * 40; k++; } while (k < 30 && (Math.hypot(x, z) < 9 || Math.hypot(x - 11, z - 7) < 6 || Math.hypot(x + 11, z - 7) < 6 || Math.hypot(x + 10, z + 8) < 6 || Math.hypot(x, z + 15) < 7)); put(make(i), x, z, r); } };
  if (id === "home") {
    edge(() => tree(1 + rnd() * 0.4), 18); inner(() => tree(0.8), 4, 1.2); inner(() => bush(), 4, 1);
    const barn = grp(P("box", M(0xb8322a), [0, 2.2, 0], [6, 4.4, 5]), P("prism", M(0x5a3a2a), [0, 5.2, 0], [4.2, 5.2, 4.2], [Math.PI / 2, 0, Math.PI / 2]),
      P("box", M(0xffffff), [0, 1.6, 2.52], [2.4, 3.2, 0.05]), P("box", M(0xb8322a), [0, 1.6, 2.55], [2, 2.8, 0.05]));
    barn.scale.set(1, 1, 1); put(barn, 14, -14, 4, -0.6);
    [[9, -8], [10, -6.5], [8, -6]].forEach(([x, z]) => put(P("cyl", M(0xe8c060, { f: true }), [0, 0.6, 0], [1.2, 1.4, 1.2], [Math.PI / 2, 0, 0]), x, z, 0.8));
  } else if (id === "italy") {
    const tower = grp(); for (let i = 0; i < 7; i++) tower.add(P("cyl", M(0xf4efe4, { r: 0.7 }), [0, 1 + i * 1.6, 0], [2.6, 1.5, 2.6]), P("tor", M(0xe0d8c8), [0, 1.8 + i * 1.6, 0], [2.7, 2.7, 1], [Math.PI / 2, 0, 0]));
    tower.rotation.z = 0.07; put(tower, -15, -16, 2);
    edge(() => grp(P("cyl", M(0x6a4a2a), [0, 0.5, 0], [0.25, 1, 0.25]), P("cone", M(0x2f5a2a, { f: true }), [0, 3, 0], [1.2, 5, 1.2])), 16);
    const fountain = grp(P("cyl", M(0xd8d0c0), [0, 0.4, 0], [5, 0.8, 5]), P("cyl", M(0x4aa8e8, { r: 0.1, m: 0.2 }), [0, 0.75, 0], [4.4, 0.1, 4.4]), P("cyl", M(0xd8d0c0), [0, 1.5, 0], [0.6, 2, 0.6]), P("cyl", M(0xd8d0c0), [0, 2.6, 0], [1.8, 0.3, 1.8]));
    put(fountain, 12, -15, 2.6);
    [[-6, -20], [6, -20], [0, -22]].forEach(([x, z]) => put(grp(P("cyl", M(0xf4efe4), [0, 2.5, 0], [0.8, 5, 0.8]), P("box", M(0xf4efe4), [0, 5.1, 0], [1.2, 0.3, 1.2])), x, z, 0.7));
  } else if (id === "mexico") {
    const pyr = grp(); for (let i = 0; i < 5; i++) pyr.add(P("box", M(0xb8a080, { f: true }), [0, 0.6 + i * 1.2, 0], [12 - i * 2.2, 1.2, 12 - i * 2.2]));
    pyr.add(P("box", M(0x9a8060), [0, 7, 0], [2.4, 1.6, 2.4])); put(pyr, -6, -24, 6.5, 0);
    edge(() => grp(P("cyl", M(0x3a9a3a), [0, 2, 0], [0.8, 4, 0.8]), P("sph", M(0x3a9a3a), [0, 4, 0], 0.8), P("cyl", M(0x3a9a3a), [0.7, 2.6, 0], [0.45, 1.6, 0.45])), 14, 22, 32, 0.6);
    edge(() => P("cyl", M(0xc8643a, { f: true }), [0, 3, 0], [8, 6, 8]), 4, 34, 38);
    put(grp(P("box", M(0xe8b07a), [0, 1.5, 0], [4, 3, 4]), P("box", M(0x4a90d8), [0, 1, 2.02], [1, 2, 0.05])), 15, -12, 2.8);
  } else if (id === "jungle") {
    edge(() => palm(1 + rnd() * 0.4), 14); edge(() => tree(1.4, 0x2f7a2f), 10, 26, 36);
    inner(() => grp(P("lsph", M(0x2f8a3a, { f: true }), [0, 0.6, 0], 1.6), P("sph", M(0xff3b8a), [0.4, 1.3, 0.3], 0.5), P("sph", M(0xffa02a), [-0.5, 1.2, -0.1], 0.4)), 6, 1.2);
    const ruin = grp(P("box", M(0x8a8a70, { f: true }), [0, 1.5, 0], [6, 3, 6]), P("box", M(0x7a7a60, { f: true }), [0, 3.5, 0], [4, 1.5, 4]), P("lsph", M(0x3f8a2f, { f: true }), [1.5, 3.2, 1.8], 1.8));
    put(ruin, 14, -16, 4);
    const river = P("box", M(0x3a9ad8, { r: 0.1, m: 0.2 }), [0, 0.02, 0], [6, 0.04, 80]); river.receiveShadow = true; put(river, -26, 0, 0, 0.1);
  } else if (id === "japan") {
    const pag = grp(); for (let i = 0; i < 4; i++) { pag.add(P("box", M(0xb8322a), [0, 1 + i * 2, 0], [4 - i * 0.6, 1.6, 4 - i * 0.6]), P("cone4", M(0x3a3a4a), [0, 2 + i * 2, 0], [7 - i * 0.9, 0.8, 7 - i * 0.9], [0, Math.PI / 4, 0])); }
    pag.add(P("cyl", M(0xffc83a, { m: 0.6 }), [0, 9.6, 0], [0.12, 2, 0.12])); put(pag, -14, -16, 3);
    const torii = grp([-1.8, 1.8].map(x => P("cyl", M(0xe8322a), [x, 2.5, 0], [0.45, 5, 0.45])), P("box", M(0x222222), [0, 5.2, 0], [5.4, 0.45, 0.6]), P("box", M(0xe8322a), [0, 4.3, 0], [4.6, 0.3, 0.4]));
    put(torii, 0, -18, 0, 0); solid.push({ x: -1.8, z: -18, r: 0.5 }, { x: 1.8, z: -18, r: 0.5 });
    edge(() => tree(1, 0xffb0d0), 16);
    const fuji = grp(P("cone", M(0x6a7a9a, { f: true }), [0, 12, 0], [50, 24, 50]), P("cone", M(0xffffff, { f: true }), [0, 20.5, 0], [17, 7, 17])); put(fuji, 10, -70, 0, 0);
  } else if (id === "arctic") {
    edge(() => pine(1, 0x2f5a4a, true), 14);
    edge(() => P("cone6", M(0xbfe8ff, { op: 0.85, r: 0.05, f: true }), [0, 2, 0], [1.5, 4 + rnd() * 3, 1.5]), 12, 22, 30, 0.7);
    [[-14, -14], [13, -16]].forEach(([x, z]) => put(grp(P("dome", M(0xffffff, { f: true }), [0, 0, 0], 7), P("cyl", M(0xffffff), [0, 1, 3.2], [2, 2, 2.4], [Math.PI / 2, 0, 0]), P("cyl", M(0x223344), [0, 1, 4.3], [1.4, 0.1, 1.4], [Math.PI / 2, 0, 0])), x, z, 3.6, 0.3));
    inner(() => grp(P("sph", M(0x1a1a24), [0, 0.6, 0], [0.8, 1.2, 0.7]), P("sph", M(0xffffff), [0, 0.55, 0.2], [0.55, 0.9, 0.4]), P("sph", M(0x1a1a24), [0, 1.35, 0], 0.55), P("cone", M(0xffa02a), [0, 1.3, 0.3], [0.15, 0.25, 0.15], [Math.PI / 2, 0, 0])), 5, 0.6);
  } else if (id === "desert") {
    [[-14, -22, 14], [4, -30, 18], [18, -20, 10]].forEach(([x, z, s]) => put(P("cone4", M(0xe0b860, { f: true }), [0, s * 0.45, 0], [s, s * 0.9, s], [0, Math.PI / 4, 0]), x, z, s * 0.42, 0));
    edge(() => palm(1.1), 8, 22, 30);
    edge(() => P("sph", M(0xe8c47a, { f: true }), [0, 0, 0], [12, 3, 8]), 8, 34, 40);
    put(grp(P("box", M(0xd8b070), [0, 3, 0], [1, 6, 1]), P("cone4", M(0xffc83a, { m: 0.5 }), [0, 6.4, 0], [1.4, 0.8, 1.4], [0, Math.PI / 4, 0])), 15, -9, 0.8, 0);
  } else if (id === "forest") {
    edge(() => pine(1.3 + rnd() * 0.5, 0x1f4a3a), 22, 22, 36);
    inner(() => grp(P("cyl", M(0xf4ecd8), [0, 1.2, 0], [1.2, 2.4, 1.2]), P("dome", M(0xc8282a, { r: 0.4 }), [0, 2.2, 0], [3.4, 2.6, 3.4]), P("box", M(0x8a5a2b), [0, 0.6, 0.6], [0.6, 1.1, 0.05])), 4, 1.8);
    edge(() => P("oct", M(0xb08aff, { e: 1.2, f: true }), [0, 1, 0], [1, 2.4, 1]), 8, 18, 24, 0.6);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; put(P("box", M(0x8a8a90, { f: true }), [0, 1.6, 0], [1, 3.2, 0.6]), 14 + Math.cos(a) * 4, -14 + Math.sin(a) * 4, 0.6, -a); }
  } else if (id === "volcano") {
    const v = grp(P("cone6", M(0x4a2e28, { f: true }), [0, 10, 0], [40, 20, 40]), P("cyl", M(0xff5a1f, { e: 2 }), [0, 19.9, 0], [6, 0.3, 6]));
    put(v, -10, -45, 0, 0);
    edge(() => palm(1), 10, 22, 30); edge(() => rock(1 + rnd(), 0x2a2228), 12, 20, 34, 1);
    [[16, -12], [-18, 8]].forEach(([x, z]) => put(P("cyl", M(0xff6a1f, { e: 1.6 }), [0, 0.05, 0], [6, 0.1, 4]), x, z, 3, 0));
    g.userData.smoke = [-10, 21, -45];
  }
  return { group: g, solid };
}

// things you walk up to: the market stall, the airfield, the puzzle chest,
// the farmhouse and the boss's arena gate
export function stallModel(color = 0xff5a5a) {
  const c = document.createElement("canvas"); c.width = 64; c.height = 4; const x = c.getContext("2d");
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#ffffff" : "#" + color.toString(16).padStart(6, "0"); x.fillRect(i * 8, 0, 8, 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return grp(P("box", M(0x9a6a3a), [0, 0.6, 0], [4, 1.2, 1.6]), P("box", M(0xc89a5a), [0, 1.25, 0], [4.2, 0.1, 1.8]),
    [[-1.9, -0.7], [1.9, -0.7], [-1.9, 0.7], [1.9, 0.7]].map(([a, b]) => P("cyl", M(0x6a4a2a), [a, 1.5, b], [0.12, 3, 0.12])),
    P("prism", M(0xffffff, { map: t }), [0, 3.3, 0], [2.2, 4.6, 1.6], [Math.PI / 2, 0, Math.PI / 2]),
    ring(5, 0.0001, (a, b, i) => P("sph", M([0xe8322a, 0xffd23a, 0x5fbf3a, 0xff8a1f, 0x9b6bff][i]), [-1.4 + i * 0.7, 1.45, 0.2], 0.4)));
}
export function puzzleModel() {
  return grp(P("cyl", M(0x7a5aff, { e: 0.6 }), [0, 0.05, 0], [3, 0.1, 3]), chestModel().translateY(0.1).rotateY(0),
    P("oct", M(0xffd23f, { e: 1.6 }), [0, 2.2, 0], [0.5, 0.8, 0.5]));
}
export function padModel() {
  return grp(P("cyl", M(0x3a4458, { r: 0.8 }), [0, 0.05, 0], [9, 0.1, 9]), P("ring", M(0xffd23f, { e: 0.6 }), [0, 0.12, 0], 8, [-Math.PI / 2, 0, 0]),
    [0, 1, 2, 3].map(i => P("cyl", M(0x7fe3ff, { e: 1.5 }), [Math.cos(i * TAU / 4) * 4.2, 0.3, Math.sin(i * TAU / 4) * 4.2], [0.25, 0.5, 0.25])));
}
export function houseModel() {
  const wall = M(0xfff2dc, { r: 0.8 });
  const h = grp(P("box", wall, [0, 2.4, 0], [9, 4.8, 7]), P("prism", M(0xc0392b, { f: true }), [0, 6.3, 0], [5.6, 9.6, 5.6], [Math.PI / 2, 0, Math.PI / 2]),
    P("box", M(0x8a5a2b), [2.6, 7.2, -1], [0.9, 2.6, 0.9]),
    P("box", M(0x2a8ad8, { e: 0.25 }), [0, 1.5, 3.52], [2, 3, 0.1]), P("sph", M(0xffc83a, { m: 0.8 }), [0.7, 1.5, 3.6], 0.18),
    [-3, 3].map(x => grp(P("box", M(0x9ad8ff, { e: 0.35, r: 0.1 }), [x, 2.8, 3.52], [1.8, 1.6, 0.1]), P("box", M(0xffffff), [x, 2.8, 3.55], [0.12, 1.6, 0.1]), P("box", M(0xffffff), [x, 2.8, 3.55], [1.8, 0.12, 0.1]))),
    P("box", M(0x9a9a9a), [0, 0.1, 4.4], [3, 0.2, 1.8]));
  return h;
}
export function gateModel() {
  const stone = M(0xe8dcc4, { r: 0.8 });
  return grp([-3.5, 3.5].map(x => P("box", stone, [x, 3, 0], [1.6, 6, 1.6])), P("box", stone, [0, 6.4, 0], [9, 1, 1.8]),
    P("box", M(0xd8321e, { e: 0.8 }), [0, 3, 0], [5.4, 6, 0.2]), P("sph", M(0x7a3a22, { f: true }), [0, 7.6, 0], 1.8));
}

// ------------------------------------------------------------ the boss
export function meatballModel(big = true) {
  const meat = M(0x8a4428, { f: true, r: 0.9 }), dark = M(0x5a2a18, { f: true });
  const g = new THREE.Group();
  const ball = P(new THREE.IcosahedronGeometry(0.5, 2), meat, [0, 0, 0], 1);
  const pos = ball.geometry.attributes.position; ball.geometry = ball.geometry.clone();
  const p2 = ball.geometry.attributes.position;
  for (let i = 0; i < p2.count; i++) { const k = 1 + Math.sin(i * 12.9898) * 0.06; p2.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k); }
  ball.geometry.computeVertexNormals();
  g.add(ball);
  for (let i = 0; i < 10; i++) { const a = i * 2.4, b = Math.acos(1 - 2 * ((i + 0.5) / 10)); g.add(P("dod", dark, [Math.sin(b) * Math.cos(a) * 0.48, Math.cos(b) * 0.48, Math.sin(b) * Math.sin(a) * 0.48], 0.12)); }
  // a face on the front
  const white = M(0xffffff), black = M(0x111111);
  [-0.16, 0.16].forEach(x => { g.add(P("sph", white, [x, 0.12, 0.42], [0.18, 0.2, 0.1]), P("sph", black, [x * 1.05, 0.1, 0.48], 0.08),
    P("box", black, [x, 0.27, 0.45], [0.22, 0.05, 0.05], [0, 0, x > 0 ? 0.45 : -0.45])); });
  if (big) {
    [-1, 1].forEach(s => g.add(P("sph", M(0x3a1a0e), [s * 0.12, -0.06, 0.47], [0.2, 0.08, 0.08], [0, 0, s * -0.3])));
    // spaghetti hair and a little gold crown
    for (let i = 0; i < 7; i++) g.add(P("arc", M(0xf0d070), [Math.cos(i) * 0.15, 0.42, Math.sin(i * 1.7) * 0.15], 0.35, [Math.PI / 2 + i * 0.4, i, 0]));
    g.add(P("sph", M(0xd8321e, { r: 0.2 }), [0, 0.46, 0], [0.4, 0.12, 0.4]));
    const crown = grp(P("cyl", M(0xffc83a, { m: 0.8, r: 0.2 }), [0, 0, 0], [0.32, 0.1, 0.32]),
      ring(5, 0.14, (x, z) => P("cone", M(0xffc83a, { m: 0.8, r: 0.2 }), [x, 0.1, z], [0.07, 0.14, 0.07])));
    crown.position.y = 0.58; g.add(crown);
  }
  return g;
}

// ------------------------------------------------------------ the kitchen
// A cool kitchen: a checked floor, neon strips, a disco ball, pastel drawers,
// a big fridge and a bubbling cauldron in the middle.
export function kitchenModel() {
  const g = new THREE.Group(), parts = {};
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? "#1d2440" : "#f4f0ff"; x.fillRect(i * 32, j * 32, 32, 32); }
  const ft = new THREE.CanvasTexture(c); ft.colorSpace = THREE.SRGBColorSpace; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(4, 3);
  const floor = P("box", M(0xffffff, { map: ft, r: 0.25, m: 0.05 }), [0, -0.05, 0], [20, 0.1, 14]); g.add(floor);
  const wallM = M(0x2a3a6a, { r: 0.8 });
  g.add(P("box", wallM, [0, 4, -7], [20, 8, 0.2]), P("box", wallM, [-10, 4, 0], [0.2, 8, 14]), P("box", wallM, [10, 4, 0], [0.2, 8, 14]));
  // neon
  [[0, 7.4, -6.85, 19, 0xff5ad8], [-9.85, 7.4, 0, 0.1, 0x7fe3ff], [9.85, 7.4, 0, 0.1, 0x7fe3ff]].forEach(([a, b, d, w, col], i) =>
    g.add(P("box", M(col, { e: 3 }), [a, b, d], i ? [0.1, 0.15, 13.6] : [w, 0.15, 0.1])));
  g.add(P("box", M(0xffd23f, { e: 2.5 }), [0, 0.2, -6.85], [19, 0.08, 0.1]));
  // a window onto the farm
  g.add(P("box", M(0x8ad0ff, { e: 0.6 }), [-4.5, 4.6, -6.88], [3.6, 2.4, 0.05]), P("box", M(0xffffff), [-4.5, 4.6, -6.85], [3.8, 0.15, 0.1]), P("box", M(0xffffff), [-4.5, 4.6, -6.85], [0.15, 2.6, 0.1]));
  // the counter with drawers, along the back wall
  const drawers = []; const cols = [0x7fe3c8, 0xff9ac8, 0xffe07a, 0x9ab8ff, 0x7fe3c8, 0xff9ac8];
  for (let i = 0; i < 6; i++) {
    const cx = -8.4 + i * 1.9;
    g.add(P("box", M(0xf4f4fa, { r: 0.4 }), [cx, 1.1, -6.1], [1.86, 2.2, 1.6]));
    for (let j = 0; j < 3; j++) {
      const d = grp(P("box", M(cols[(i + j) % cols.length], { r: 0.35 }), [0, 0, 0], [1.66, 0.6, 0.12]), P("cyl", M(0xd8e0ea, { m: 0.9, r: 0.2 }), [0, 0, 0.12], [0.06, 0.8, 0.06], [0, 0, Math.PI / 2]));
      d.position.set(cx, 0.45 + j * 0.68, -5.24); d.userData.home = -5.24; g.add(d); drawers.push(d);
    }
  }
  g.add(P("box", M(0xe8e4f4, { r: 0.15, m: 0.1 }), [-3.65, 2.28, -6.1], [11.6, 0.16, 1.8]));
  parts.drawers = drawers;
  // things on the counter: jars and a mixer
  [[-7, 0xff5a5a], [-6.2, 0x5fd35a], [-5.4, 0x7fd8ff]].forEach(([a, col]) => g.add(P("cyl", M(col, { op: 0.8, r: 0.1 }), [a, 2.75, -6.2], [0.5, 0.8, 0.5]), P("cyl", M(0xffffff), [a, 3.2, -6.2], [0.54, 0.12, 0.54])));
  // the fridge
  const fridge = grp(P("box", M(0x9ae8e0, { r: 0.25, m: 0.15 }), [0, 2.8, 0], [2.6, 5.6, 1.8]), P("box", M(0x86d8d0, { r: 0.25 }), [0, 4.3, 0.92], [2.5, 2.4, 0.06]),
    P("box", M(0x86d8d0, { r: 0.25 }), [0, 1.6, 0.92], [2.5, 3.0, 0.06]), [4.3, 1.6].map(y => P("box", M(0xd8e0ea, { m: 0.9, r: 0.2 }), [-0.95, y, 1.0], [0.12, 1, 0.12])));
  fridge.position.set(7.8, 0, -5.9); g.add(fridge); parts.fridge = fridge;
  // the stove and cauldron in the middle
  const stove = grp(P("cyl", M(0x2b2b3a, { r: 0.4, m: 0.4 }), [0, 0.6, 0], [3.4, 1.2, 3.4]), ring(6, 1.2, (a, b) => P("cone6", M(0xff7a2b, { e: 2.5 }), [a, 1.35, b], [0.35, 0.6, 0.35])));
  const pot = grp(P("bowl", M(0xc87a3a, { m: 0.8, r: 0.3, ds: true }), [0, 2.9, 0], [3.4, 2.6, 3.4]), P("tor", M(0xa85a2a, { m: 0.8, r: 0.3 }), [0, 2.9, 0], [3.4, 3.4, 1.4], [Math.PI / 2, 0, 0]));
  const brew = P("cyl", M(0x6fe08a, { e: 1.2, r: 0.1 }), [0, 2.62, 0], [3.1, 0.06, 3.1]);
  stove.add(pot, brew); stove.position.set(0, 0, -1); g.add(stove); parts.brew = brew; parts.stove = stove;
  // the wand bench
  const bench = grp(P("box", M(0x8a5a2b, { r: 0.7 }), [0, 1.6, 0], [3, 0.2, 1.6]), [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]].map(([a, b]) => P("box", M(0x6a4020), [a, 0.75, b], [0.18, 1.5, 0.18])),
    [0x7fd8ff, 0xff6a2b, 0x5fd35a].map((col, i) => grp(P("cyl", M(0x4a2e18), [0, 0, 0], [0.06, 1.1, 0.06]), P("oct", M(col, { e: 1.6 }), [0, 0.6, 0], 0.18)).translateX(-0.8 + i * 0.8).translateY(2.0).rotateZ(-0.6)));
  bench.position.set(-7.5, 0, 1.5); bench.rotation.y = Math.PI / 2; g.add(bench);
  // the recipe book on a stand
  const book = grp(P("cyl", M(0x6a4020), [0, 0.8, 0], [0.3, 1.6, 0.3]), P("box", M(0x6a4020), [0, 1.65, 0], [1.6, 0.1, 1.2], [-0.35, 0, 0]),
    P("box", M(0xfff6e0, { e: 0.25 }), [-0.36, 1.78, 0], [0.7, 0.06, 1], [-0.35, 0, 0.12]), P("box", M(0xfff6e0, { e: 0.25 }), [0.36, 1.78, 0], [0.7, 0.06, 1], [-0.35, 0, -0.12]));
  book.position.set(7.5, 0, 1.5); book.rotation.y = -Math.PI / 2; g.add(book);
  // the order board
  const board = grp(P("box", M(0x8a5a2b), [0, 0, 0], [4.2, 2.6, 0.12]), P("box", M(0x1f3a2a, { r: 0.95 }), [0, 0, 0.07], [3.9, 2.3, 0.04]));
  board.position.set(3.4, 4.6, -6.85); g.add(board);
  // a disco ball, because it is a cool kitchen
  const disco = P(new THREE.IcosahedronGeometry(0.5, 2), M(0xe0e8ff, { m: 1, r: 0.15, f: true }), [0, 6.6, -1], 1.3);
  g.add(disco, P("cyl", M(0xaaaaaa), [0, 7.4, -1], [0.04, 1.2, 0.04])); parts.disco = disco;
  // the way out to the farm: a glowing mat at the open front, where the
  // camera looks in like a doll's house
  g.add(P("box", M(0x5fd35a, { e: 0.8 }), [0, 0.02, 6.2], [3, 0.04, 1.4]));
  return { group: g, parts };
}
