// The food enemies: a few little ones in every level, and a boss at the end
// of each. Each model stands on the ground at its origin and faces +z.
import * as THREE from "three";
import { P, mat as M, meatballModel } from "./models.js";
import { MINIS2, BOSSES2 } from "./enemies2.js";

const TAU = Math.PI * 2;
const grp = (...k) => { const g = new THREE.Group(); k.flat().forEach(x => x && g.add(x)); return g; };
// cross eyes and frowning brows, s is the size of an eye
export function face(y, z, s = 0.2, gap = 0.22, o = {}) {
  const white = M(0xffffff, { r: 0.3 }), black = M(0x111111);
  return [-1, 1].flatMap(k => [
    P("sph", white, [k * gap, y, z], [s, s * 1.1, s * 0.6]),
    P("sph", black, [k * gap * 1.05, y - s * 0.08, z + s * 0.24], s * 0.45),
    o.nobrow ? null : P("box", black, [k * gap, y + s * 0.75, z + s * 0.1], [s * 1.2, s * 0.22, s * 0.2], [0, 0, k * 0.45]),
  ]).filter(Boolean);
}
export const feet = (c = 0x222222, w = 0.25, s = 0.22) => [-w, w].map(x => P("sph", M(c), [x, s * 0.5, 0.05], [s * 1.2, s, s * 1.5]));
export const mouth = (y, z, w = 0.25) => { const m = P("box", M(0x3a0a0a), [0, y, z], [w, 0.07, 0.06]); return m; };

// ------------------------------------------------------------ the little ones
export const MINIS = {
  tomato: () => grp(P("sph", M(0xe8322a, { r: 0.3 }), [0, 0.78, 0], [1.4, 1.2, 1.4]), P("cone6", M(0x3fae3a), [0, 1.42, 0], [0.6, 0.18, 0.6]),
    P("cyl", M(0x2f7a2f), [0, 1.55, 0], [0.08, 0.2, 0.08]), face(0.92, 0.6, 0.2), mouth(0.6, 0.68), feet()),
  chilimini: () => grp(P("cone", M(0xd81e1e, { r: 0.25 }), [0, 0.95, 0], [0.75, 1.7, 0.75], [Math.PI, 0, 0.15]), P("cone6", M(0x3f8a2a), [0.03, 1.8, 0], [0.5, 0.18, 0.5]),
    P("cyl", M(0x3f8a2a), [0.06, 2.0, 0], [0.08, 0.3, 0.08], [0, 0, 0.4]), face(1.3, 0.3, 0.15, 0.15), feet(0x3a0a0a, 0.15, 0.18)),
  ninja: () => grp(P("prism", M(0xfafafa, { f: true }), [0, 0.8, 0], [1.5, 0.8, 1.5], [Math.PI / 2, 0, 0]), P("box", M(0x1a2a1a), [0, 0.38, 0], [0.8, 0.55, 0.85]),
    P("box", M(0x2a2a3a), [0, 1.0, 0], [1.0, 0.18, 0.84]), P("box", M(0x2a2a3a), [0.45, 1.0, -0.42], [0.08, 0.1, 0.5], [0.3, 0.6, 0]),
    face(1.0, 0.42, 0.13, 0.17, { nobrow: true }), feet(0x2a2a3a, 0.2, 0.2)),
  scoop: () => grp(P("cone", M(0xd8a050, { f: true }), [0, 0.45, 0], [0.8, 0.9, 0.8], [Math.PI, 0, 0]), P("sph", M(0xff9ac0, { r: 0.6 }), [0, 1.2, 0], 1.25),
    [[0.4, 0.75, 0.3], [-0.45, 0.8, 0.2], [0.1, 0.7, -0.45]].map(p => P("sph", M(0xff9ac0), p, [0.25, 0.4, 0.25])),
    [0, 1, 2, 3, 4, 5].map(i => P("box", M([0xffd23f, 0x5fd35a, 0x4fa3ff][i % 3], { e: 0.2 }), [Math.cos(i * 1.7) * 0.45, 1.6 + (i % 2) * 0.1, Math.sin(i * 1.7) * 0.45], [0.18, 0.05, 0.05], [0, i, 0.5])),
    face(1.3, 0.56, 0.17, 0.2)),
  puncher: () => grp(P("lsph", M(0xe8a83a, { f: true }), [0, 0.95, 0], [1.2, 1.5, 1.2]), [-0.4, 0, 0.4].map((a, i) => P("cone", M(0x3f9a3a), [a * 0.3, 1.9, 0], [0.22, 0.7, 0.22], [0, 0, a])),
    [-1, 1].map(k => P("sph", M(0xe8322a, { r: 0.3 }), [k * 0.85, 0.9, 0.35], 0.5)), face(1.15, 0.55, 0.16, 0.2), feet(0x6a4020)),
  fry: () => grp(P("taper", M(0xe8322a, { r: 0.4 }), [0, 0.65, 0], [1.1, 1.1, 0.7], [Math.PI, 0, 0]), P("box", M(0xffd23f, { e: 0.2 }), [0, 0.6, 0.36], [0.4, 0.4, 0.02]),
    Array.from({ length: 9 }, (_, i) => P("box", M(0xf8d060, { r: 0.6 }), [-0.4 + (i % 5) * 0.2, 1.35 + (i % 3) * 0.12, (i % 2) * 0.2 - 0.1], [0.12, 0.9, 0.12], [0, 0, (i - 4) * 0.06])),
    face(0.85, 0.36, 0.13, 0.18), feet(0x222222, 0.22, 0.2)),
};

// ------------------------------------------------------------ the bosses
// about 2.5 units across before scaling up
export const BOSSES = {
  meatball: () => { const g = meatballModel(true); g.position.y = 0.5; return grp(g); },
  taco: () => grp(
    // the shell: half a tube lying on its side, open at the top
    P("half", M(0xf0c050, { ds: true, r: 0.6, f: true }), [0, 1.5, 0], [1.7, 2.6, 1.7], [0, 0, -Math.PI / 2]),
    Array.from({ length: 9 }, (_, i) => P("sph", M(i % 3 === 0 ? 0x5fbf3a : i % 3 === 1 ? 0x8a4428 : 0xd8321e, { f: true }), [-1.1 + i * 0.27, 1.55 + (i % 2) * 0.1, (i % 2 ? 0.2 : -0.2)], [0.45, 0.35, 0.6])),
    face(1.15, 0.86, 0.2, 0.34), mouth(0.85, 0.86, 0.45),
    P("cyl", M(0xd8321e), [0.2, 2.15, 0], [1.9, 0.06, 1.9], [0, 0, 0.12]), P("cone", M(0xd8321e), [0.2, 2.45, 0], [0.75, 0.6, 0.75], [0, 0, 0.12]), P("tor", M(0x3fae3a), [0.2, 2.2, 0], [0.85, 0.85, 0.5], [Math.PI / 2, 0.12, 0]),
    feet(0x6a4020, 0.5, 0.3)),
  sushi: () => grp(
    P("cyl", M(0x1a2a1a, { r: 0.7 }), [0, 1, 0], [1.8, 2, 1.8]), P("cyl", M(0xfafafa, { f: true }), [0, 2.01, 0], [1.6, 0.02, 1.6]), P("cyl", M(0xff8a5a), [0, 2.03, 0], [0.8, 0.02, 0.8]),
    P("box", M(0xfafafa), [0, 1.2, 0.88], [1.1, 0.5, 0.06]), face(1.25, 0.94, 0.16, 0.25),
    P("dome", M(0x8a1a1a, { m: 0.3, r: 0.4 }), [0, 2.0, 0], [2.0, 1.2, 2.0]), P("box", M(0xffc83a, { m: 0.8 }), [0, 2.6, 0.7], [0.12, 0.7, 0.1]),
    [-1, 1].map(k => P("box", M(0xffc83a, { m: 0.8 }), [k * 0.35, 2.75, 0.7], [0.1, 0.6, 0.1], [0, 0, k * 0.7])),
    [-1, 1].map(k => P("cyl", M(0xc8a060), [k * 1.2, 1.1, 0.3], [0.08, 2.2, 0.08], [0.6, 0, k * 0.3])), feet(0x1a2a1a, 0.5, 0.3)),
  sundae: () => grp(
    P("taper", M(0xdff4ff, { op: 0.5, r: 0.05 }), [0, 0.6, 0], [2.2, 1.2, 2.2], [Math.PI, 0, 0]), P("cyl", M(0xdff4ff, { op: 0.6 }), [0, 0.06, 0], [1.2, 0.12, 1.2]),
    P("sph", M(0x6a3a1e), [0, 1.35, 0], 1.6), P("sph", M(0xfff6e8), [0, 2.2, 0], 1.4), P("sph", M(0xff9ac0), [0, 2.95, 0], 1.1),
    P("sph", M(0xffffff, { r: 0.8 }), [0, 3.5, 0], [0.8, 0.4, 0.8]), P("sph", M(0xd8102a, { r: 0.2 }), [0, 3.8, 0], 0.34),
    P("box", M(0xe8c080), [0.5, 3.2, 0], [0.18, 1.2, 0.5], [0, 0, -0.4]), face(2.25, 0.66, 0.18, 0.26),
    [-1, 1].map(k => grp(P("sph", M(0xfafafa, { f: true }), [k * 1.1, 2.0, 0.2], [0.5, 0.9, 0.5], [0, 0, k * 0.8]), P("sph", M(0xfafafa, { f: true }), [k * 1.45, 1.55, 0.35], 0.45)))),
  dragon: () => grp(
    P("cone", M(0xd81e1e, { r: 0.25 }), [0, 1.3, -0.4], [1.5, 2.8, 1.5], [-Math.PI / 2 - 0.25, 0, 0]),
    P("sph", M(0xd81e1e, { r: 0.25 }), [0, 1.7, 0.7], 1.5), P("cone6", M(0x3f8a2a), [0, 2.5, 0.5], [0.8, 0.3, 0.8]),
    [-1, 1].map(k => P("cone", M(0xffd23f), [k * 0.45, 2.55, 0.6], [0.18, 0.6, 0.18], [0, 0, -k * 0.5])),
    [-1, 1].map(k => P("prism", M(0xff8a1f, { ds: true, r: 0.5 }), [k * 1.5, 1.9, -0.2], [1.6, 0.06, 1.6], [0, 0, k * 0.5])),
    face(1.85, 1.38, 0.17, 0.3), P("sph", M(0x3a0a0a), [0, 1.35, 1.38], [0.4, 0.14, 0.1]),
    P("cone6", M(0xffa02a, { e: 2 }), [0, 1.3, 1.65], [0.25, 0.4, 0.25], [Math.PI / 2, 0, 0]), feet(0x8a1010, 0.5, 0.3)),
  burger: () => grp(
    P("cyl", M(0xd89a4a, { r: 0.7 }), [0, 0.3, 0], [2.6, 0.6, 2.6]), P("cyl", M(0x5a2e18, { f: true }), [0, 0.8, 0], [2.7, 0.5, 2.7]),
    P("box", M(0xffc83a, { r: 0.4 }), [0, 1.1, 0], [2.4, 0.08, 2.4], [0, Math.PI / 4, 0]), P("tor", M(0x5fbf3a, { f: true }), [0, 1.2, 0], [2.6, 2.6, 0.8], [Math.PI / 2, 0, 0]),
    [0, 1, 2].map(i => P("cyl", M(0xd8321e), [Math.cos(i * 2.1) * 0.6, 1.3, Math.sin(i * 2.1) * 0.6], [0.9, 0.1, 0.9])),
    P("dome", M(0xe0a050, { r: 0.6 }), [0, 1.35, 0], [2.7, 2.2, 2.7]),
    Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, r = 0.4 + (i % 4) * 0.25; return P("sph", M(0xfff6d8), [Math.cos(a) * r, 2.35 - r * 0.5, Math.sin(a) * r], [0.12, 0.05, 0.07], [0, a, 0]); }),
    face(1.9, 1.15, 0.22, 0.38),
    [-0.6, -0.3, 0, 0.3, 0.6].map(x => P("cone", M(0x3fae3a, { f: true }), [x, 0.65, 1.35], [0.32, 0.9, 0.12], [Math.PI, 0, 0])),
    P("cyl", M(0xffc83a, { m: 0.8, r: 0.2 }), [0, 2.55, 0], [1.2, 0.3, 1.2]),
    Array.from({ length: 6 }, (_, i) => P("cone", M(0xffc83a, { m: 0.8, r: 0.2 }), [Math.cos(i / 6 * TAU) * 0.55, 2.85, Math.sin(i / 6 * TAU) * 0.55], [0.2, 0.4, 0.2])),
    Array.from({ length: 6 }, (_, i) => P("sph", M([0xff3a5a, 0x3aa8ff, 0x5fd35a][i % 3], { e: 0.5 }), [Math.cos(i / 6 * TAU + 0.5) * 0.6, 2.6, Math.sin(i / 6 * TAU + 0.5) * 0.6], 0.12))),
};
export function miniModel(id) { return (MINIS[id] || MINIS2[id])(); }
export function bossModel(id) { return (BOSSES[id] || BOSSES2[id])(); }
