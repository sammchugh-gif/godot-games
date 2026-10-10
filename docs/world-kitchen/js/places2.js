// Levels 6 to 30 are built from a description (scene, in data.js): the kind
// of houses along the two sides of the square, the trees, lamps, lanterns
// or flags, water, the hills, and the landmark that makes the place itself.
import * as THREE from "three";
import { TEX, M as TM } from "./tex.js";
import { P, mat } from "./models.js";
import { house, lamp, lanterns, tree, cypress, pine, palm, hills, aurora } from "./places.js";

const TAU = Math.PI * 2;
const rgb = c => new THREE.Color(`rgb(${c.join(",")})`).getHex();

export function dressScene(W, L) {
  const { B, scene, R } = W, S = L.scene;
  hills(scene, R, S.hills ?? (L.ground === "snow" ? 0xe8f0fa : L.ground === "sand" || L.ground === "drygrass" ? 0xc8a868 : 0x5a9a48), 16, 120, 190, S.tall || 1);
  if (S.aurora) aurora(scene);
  if (S.water) { const w = new THREE.Mesh(new THREE.PlaneGeometry(420, 150), new THREE.MeshStandardMaterial({ color: 0x2a7ab8, roughness: 0.08, metalness: 0.4 })); w.rotation.x = -Math.PI / 2; w.position.set(0, 0.05, -125); w.receiveShadow = true; scene.add(w); }
  // the two sides of the square
  for (const [x0, z0, ry] of [[-33, 20, Math.PI / 2], [33, -20, -Math.PI / 2]]) {
    let off = 0;
    for (let i = 0; i < 6; i++) {
      const w = S.style === "canal" ? 4.6 : S.style === "tall" ? 8 : 6 + (i % 2), c = off + w / 2, x = x0 + Math.cos(ry) * c, z = z0 - Math.sin(ry) * c;
      const wall = (S.walls || [[220, 210, 190]])[i % (S.walls || [1]).length];
      if (S.style === "gable") house(B, x, z, w, 6 + (i % 3), 6, ry, { wall, roof: S.roof, shutters: i % 2 ? "#3a5a7a" : null, lit: 0.35 });
      else if (S.style === "flat") house(B, x, z, w, 5 + (i % 3), 7, ry, { wall, flat: true, balcony: S.balcony, door: S.door, lit: 0.3 });
      else if (S.style === "tall") house(B, x, z, w, 14 + (i % 3) * 4, 8, ry, { wall, flat: true, lit: 0.5 });
      else if (S.style === "canal") house(B, x, z, w, 9 + (i % 3), 7, ry, { wall, roof: S.roof, pitch: 0.95, eave: 0.2, lit: 0.4, shutters: "#ffffff" });
      else if (S.style === "cabin") house(B, x, z, w, 4.5, 6, ry, { wall: [126, 86, 56], roof: [70, 90, 70], lit: 0.7, door: 0x4a2a14 });
      else if (S.style === "chalet") house(B, x, z, w, 5.5, 7, ry, { wall: [150, 100, 60], roof: [90, 80, 70], pitch: 0.45, eave: 1.2, balcony: true, lit: 0.5, shutters: "#c8321e" });
      else if (S.style === "stone") house(B, x, z, w, 4 + (i % 2), 6, ry, { wall: [150, 144, 136], flat: true, lit: 0.12 });
      else if (S.style === "wood") woodHouse(B, x, z, w, ry, i);
      else if (S.style === "hut" || S.style === "igloo") { /* round ones go in a ring, below */ }
      off += w;
    }
  }
  if (S.style === "hut") for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3; if (Math.abs(Math.sin(a) + 1) < 0.25) continue; hut(B, Math.cos(a) * 33, Math.sin(a) * 33); }
  if (S.style === "igloo") for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5; if (Math.abs(Math.sin(a) + 1) < 0.3) continue; igloo(B, Math.cos(a) * 31, Math.sin(a) * 31); }
  // trees round the north and south ends
  if (S.trees !== "none") for (let i = 0; i < 16; i++) {
    let a; do { a = R() * TAU; } while (Math.abs(Math.cos(a)) > 0.7);
    const d = 30 + R() * 9, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 1 + R() * 0.4;
    if (z > 18 && Math.abs(x) < 9) continue;
    ({ tree: () => tree(B, x, z, s, 0x4f9a3a, { second: true }), cherry: () => tree(B, x, z, s, 0xffb0d0, { second: true }), cypress: () => cypress(B, x, z, s),
      pine: () => pine(B, x, z, s, !!S.snow || L.ground === "snow"), palm: () => palm(B, x, z, s), baobab: () => baobab(B, x, z, s) })[S.trees]();
  }
  // lamps; and tall posts with lanterns or flags strung between them
  if (S.lamps) [[-10, 12], [10, 12], [-10, -6], [10, -6]].forEach(([x, z]) => lamp(B, x, z));
  if (S.lanterns || S.flags) {
    [[-12, 8], [12, 8], [-12, -6], [12, -6]].forEach(([x, z]) => lamp(B, x, z, S.lanterns ? S.lanterns[0] : 0xfff0c0, 7.4));
    for (const z of [8, -6]) lanterns(B, -12, z, 12, z, 7.4, S.lanterns || S.flags, 11, { flags: !S.lanterns });
  }
  LANDMARKS[S.landmark](B, scene, W);
}

function woodHouse(B, x, z, w, ry, i) {
  const g = new THREE.Group();
  g.add(P("box", TM("wood", { args: [8 + i, [[150, 100, 60], [130, 86, 54], [160, 112, 70]][i % 3]] }), [0, 2.2, 0], [w, 4.4, 6]),
    P("box", mat(0xf4ecd8, { e: 0.25 }), [0, 2.4, 3.02], [w * 0.7, 1.6, 0.05]), P("cone4", TM("roof", { args: [13, [60, 62, 72]] }), [0, 5.4, 0], [w * 1.25, 2, 8.6], [0, Math.PI / 4, 0]));
  B.add(g, x, 0, z, ry); B.rects.push({ x, z, hw: w / 2, hd: 3, ry });
}
function hut(B, x, z) {
  const g = new THREE.Group(); g.add(P("cyl", mat(0xb8784a, { r: 1 }), [0, 1.3, 0], [5, 2.6, 5]), P("cone6", mat(0xd8b060, { f: true, r: 1 }), [0, 3.7, 0], [6.4, 2.6, 6.4]), P("box", mat(0x4a2a14), [0, 0.9, 2.45], [1, 1.8, 0.1]));
  B.add(g, x, 0, z, Math.atan2(-x, -z)); B.circles.push({ x, z, r: 2.6 });
}
function igloo(B, x, z) {
  const ig = new THREE.Group(), snow = TM("snow", { args: [7], repeat: [3, 2] }); ig.add(P("dome", snow, [0, 0, 0], 7), P("cyl", snow, [0, 1.1, 3.4], [2.2, 2.2, 2.4], [Math.PI / 2, 0, 0]), P("cyl", mat(0xffb060, { e: 1.2 }), [0, 1.1, 4.6], [1.5, 0.05, 1.5], [Math.PI / 2, 0, 0]));
  B.add(ig, x, 0, z, Math.atan2(-x, -z)); B.circles.push({ x, z, r: 3.7 }); B.glow(x, 1.3, z, 0xffb060, 3);
}
function baobab(B, x, z, s = 1) {
  const g = new THREE.Group(); g.add(P("cyl", TM("wood", { args: [9, [140, 110, 90]] }), [0, 3 * s, 0], [1.6 * s, 6 * s, 1.6 * s]));
  for (let i = 0; i < 6; i++) g.add(P("cyl", mat(0x8a6a50), [Math.cos(i) * 1.2 * s, 6.4 * s, Math.sin(i) * 1.2 * s], [0.25 * s, 2 * s, 0.25 * s], [Math.sin(i) * 0.6, 0, -Math.cos(i) * 0.6]));
  g.add(P("lsph", mat(0x6a8a3a, { f: true }), [0, 7.4 * s, 0], [5 * s, 1.2 * s, 5 * s]));
  B.add(g, x, 0, z); B.circles.push({ x, z, r: 1 * s });
}

// ------------------------------------------------------------ the landmarks, behind the boss's gate
const stoneT = (c, rep = [2, 2]) => TM("stone", { args: [5, c], repeat: rep });
const white = () => mat(0xf4f0ea, { r: 0.6 });
const onion = (c, s) => [P("sph", mat(c, { r: 0.4 }), [0, 0, 0], [s, s * 1.1, s]), P("cone", mat(c, { r: 0.4 }), [0, s * 0.75, 0], [s * 0.5, s * 0.6, s * 0.5]), P("cyl", mat(0xffc83a, { m: 0.8 }), [0, s * 1.2, 0], [0.08, s * 0.4, 0.08])];
const at = (B, parts, x, z, ry = 0, s = 1) => { const g = new THREE.Group(); parts.flat().forEach(p => p && g.add(p)); g.scale.setScalar(s); B.add(g, x, 0, z, ry); return g; };
const mountain = (B, x, z, r, h, c = 0x7a7a88, snow = 0xf4f8ff, seg = "cone6") => at(B, [P(seg, mat(c, { f: true, r: 1 }), [0, h / 2, 0], [r, h, r]), P(seg, mat(snow, { f: true }), [0, h * 0.86, 0], [r * 0.3, h * 0.28, r * 0.3])], x, z);

export const LANDMARKS = {
  eiffel(B) {
    const iron = mat(0x6a5a48, { m: 0.5, r: 0.5 }), p = [];
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.push(P("box", iron, [a * 3.6, 6, b * 3.6], [1.2, 13, 1.2], [-b * 0.32, 0, a * 0.32]));
    p.push(P("box", iron, [0, 11.5, 0], [8, 0.8, 8]), P("cyl", iron, [0, 21, 0], [1.1, 19, 3.6], [0, Math.PI / 4, 0]), P("box", iron, [0, 21, 0], [3.6, 0.6, 3.6]), P("cyl", iron, [0, 34, 0], [0.2, 8, 0.6]));
    p.push(P("tor", iron, [0, 9.5, 3.8], [2.6, 2.6, 1]));
    at(B, p, 20, -48, 0.3, 1.3);
  },
  liberty(B) {
    const cu = mat(0x6ab8a0, { r: 0.6 });
    at(B, [P("box", stoneT([200, 190, 170]), [0, 4, 0], [9, 8, 9]), P("cone6", cu, [0, 13, 0], [5, 10, 5]), P("sph", cu, [0, 19, 0], 2.4), Array.from({ length: 7 }, (_, i) => P("cone", cu, [(i - 3) * 0.45, 20.6, -Math.abs(i - 3) * 0.2], [0.3, 1.6, 0.3], [0, 0, (i - 3) * 0.3])),
      P("cyl", cu, [1.6, 19.5, 0], [0.6, 6, 0.6], [0, 0, -0.2]), P("cone6", mat(0xffa02a, { e: 2.5 }), [2.2, 23.2, 0], [1, 1.6, 1]), P("box", cu, [-1.6, 14, 1.4], [1.6, 2.2, 0.4])], 26, -70, -0.4, 1.4);
  },
  taj(B) {
    const w = white();
    at(B, [P("box", w, [0, 0.6, 0], [30, 1.2, 30]), P("box", w, [0, 6, 0], [16, 10, 16]), P("box", mat(0x3a3a4a), [0, 5, 8.05], [4, 7, 0.1]), P("cyl", w, [0, 12, 0], [5.4, 2, 5.4]), ...onion(0xf8f4ee, 6).map(m => { m.position.y += 16; return m; }),
      ...[[-6, -6], [6, -6], [-6, 6], [6, 6]].flatMap(([x, z]) => onion(0xf8f4ee, 1.8).map(m => { m.position.x += x; m.position.z += z; m.position.y += 12.5; return m; })),
      ...[[-13, -13], [13, -13], [-13, 13], [13, 13]].flatMap(([x, z]) => [P("cyl", w, [x, 9, z], [1.2, 18, 1.2]), ...onion(0xf8f4ee, 1.2).map(m => { m.position.x += x; m.position.z += z; m.position.y += 18.6; return m; })])], 0, -62, 0, 1.2);
  },
  greatwall(B, scene) {
    const st = stoneT([150, 140, 120], [6, 1]);
    for (let i = 0; i < 14; i++) {
      const x = -90 + i * 14, z = -55 - Math.sin(i * 0.8) * 12, y = Math.max(0, Math.sin(i * 0.6) * 6);
      const g = new THREE.Group(); g.add(P("box", st, [0, y + 2.5, 0], [14.5, 5 + y * 2, 4]));
      for (let k = 0; k < 6; k++) g.add(P("box", st, [-6 + k * 2.4, y * 2 + 5.5, 1.6], [1.1, 1, 0.8]));
      if (i % 3 === 0) g.add(P("box", st, [0, y + 4.5, 0], [6, 9 + y * 2, 6]), P("box", mat(0x8a3a2a), [0, y * 2 + 10, 0], [6.6, 0.6, 6.6]));
      B.add(g, x, 0, z, Math.sin(i * 0.8) * 0.4);
    }
  },
  opera(B) {
    const w = mat(0xf8f6f0, { r: 0.3 });
    at(B, [P("box", stoneT([200, 160, 130]), [0, 1.5, 0], [34, 3, 16]),
      ...[[-10, 1.0], [-4, 1.25], [3, 1.4], [10, 1.1]].flatMap(([x, s]) => [P("cone", w, [x, 3 + 5 * s, 2], [5 * s, 10 * s, 7 * s], [-0.5, 0, 0]), P("cone", w, [x + 1.5, 3 + 3.5 * s, -3], [4 * s, 7 * s, 5 * s], [0.5, 0, 0])])], 6, -70, 0.2);
  },
  christ(B) {
    const w = white();
    mountain(B, 0, -140, 70, 60, 0x3a7a3a, 0x3a7a3a);
    at(B, [P("box", w, [0, 2, 0], [4, 4, 4]), P("cyl", w, [0, 9, 0], [1.6, 10, 2.2]), P("box", w, [0, 13, 0], [16, 1.6, 1.6]), P("sph", w, [0, 15.5, 0], 2)], 0, -140, 0, 1.4).position.y = 60;
  },
  pyramids(B) {
    [[-18, -48, 26], [14, -64, 34], [40, -46, 18]].forEach(([x, z, s]) => at(B, [P("cone4", stoneT([214, 186, 130], [4, 4]), [0, s * 0.45, 0], [s, s * 0.9, s], [0, Math.PI / 4, 0])], x, z));
    const st = stoneT([210, 180, 130]);
    at(B, [P("box", st, [0, 2, 0], [5, 4, 14]), P("box", st, [0, 5, 5], [4.6, 5, 4.4]), P("box", st, [0, 7.6, 5.4], [5.4, 2, 4]), P("box", mat(0x2a6ab8), [0, 6, 7.3], [3, 3, 0.2])], -32, -26, 0.5);
  },
  parthenon(B) {
    const st = stoneT([230, 222, 204]), cols = [];
    for (let i = 0; i < 8; i++) for (const z of [-5, 5]) cols.push(P("cyl", st, [-14 + i * 4, 6, z], [1.1, 9, 1.1]));
    for (const x of [-14, 14]) for (const z of [-1.7, 1.7]) cols.push(P("cyl", st, [x, 6, z], [1.1, 9, 1.1]));
    at(B, [P("dome", mat(0x8a9a5a, { f: true }), [0, -8, 0], [70, 18, 50]), P("box", st, [0, 1, 0], [34, 2, 16]), ...cols, P("box", st, [0, 11, 0], [33, 1.6, 15]), P("prism", st, [0, 13, 0], [8.6, 33, 3], [Math.PI / 2, 0, Math.PI / 2])], 0, -62);
  },
  windmills(B, scene, W) {
    for (const [x, z] of [[-26, -42], [0, -52], [26, -44]]) {
      at(B, [P("taper", TM("wood", { args: [9, [90, 70, 60]] }), [0, 6, 0], [6, 12, 6], [Math.PI, 0, 0]), P("cone6", mat(0x3a3a3a, { f: true }), [0, 13.2, 0], [5, 3, 5])], x, z);
      // four sails that turn in the wind
      const blades = new THREE.Group(); blades.position.set(x, 12, z + 3);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; blades.add(P("box", mat(0xf4ecd8, { r: 0.8 }), [Math.sin(a) * 4, Math.cos(a) * 4, 0], [1.4, 8, 0.15], [0, 0, -a])); }
      scene.add(blades); W.fx.push(["spin", blades]);
    }
  },
  onion(B) {
    const cols = [0xd8321e, 0x3aa86a, 0xffc83a, 0x3a8ae8, 0xff8a2a];
    const towers = [[0, 0, 18, 3.4], [-7, 4, 11, 2.4], [7, 4, 11, 2.4], [-6, -5, 12, 2.4], [6, -5, 12, 2.4]];
    at(B, [P("box", TM("brick", { args: [4, [170, 60, 40], [150, 50, 36], [220, 210, 190]], repeat: [4, 2] }), [0, 3, 0], [20, 6, 16]),
      ...towers.flatMap(([x, z, h, r], i) => [P("cyl8", mat(cols[(i + 2) % 5], { r: 0.6 }), [x, h / 2, z], [r * 1.2, h, r * 1.2]), ...onion(cols[i], r * 1.3).map(m => { m.position.x += x; m.position.z += z; m.position.y += h + r; return m; })])], 0, -56);
  },
  machu(B) {
    const st = stoneT([150, 146, 136]), g = mat(0x4a9a4a, { r: 1 });
    for (let i = 0; i < 6; i++) at(B, [P("box", g, [0, 1 + i * 2, 0], [70 - i * 9, 2, 20 - i * 2]), P("box", st, [0, i * 2 + 1, 10 - i], [70 - i * 9, 2, 0.6])], 0, -48 - i * 3);
    for (let i = 0; i < 6; i++) at(B, [P("box", st, [0, 1.5, 0], [5, 3, 4])], -14 + i * 6, -63, 0.1 * i).position.y = 12;
    mountain(B, 10, -110, 30, 70, 0x3a7a3a, 0x3a7a3a, "cone");
  },
  rockies(B) { [[-40, -140, 70, 60], [20, -160, 90, 80], [70, -130, 60, 50], [-90, -120, 60, 45]].forEach(([x, z, r, h]) => mountain(B, x, z, r, h)); },
  kilimanjaro(B) {
    at(B, [P("cyl", mat(0x6a5a4a, { f: true }), [0, 20, 0], [40, 40, 120]), P("cyl", mat(0xf4f8ff, { f: true }), [0, 40.5, 0], [42, 2, 52])], 30, -200);
    for (let i = 0; i < 4; i++) at(B, [P("cyl", mat(0x6a4a2a), [0, 2, 0], [0.4, 4, 0.4]), P("cyl", mat(0x5a7a2a, { f: true }), [0, 4.4, 0], [7, 0.8, 7])], -28 + i * 18, -40 - (i % 2) * 6);
  },
  wat(B) {
    const gold = mat(0xffc83a, { m: 0.7, r: 0.3 }), red = mat(0xc8321e);
    const stupa = (x, z, s) => [P("cyl", mat(0xf4ecd8), [x, 1 * s, z], [5 * s, 2 * s, 5 * s]), P("sph", gold, [x, 4 * s, z], [4.4 * s, 5 * s, 4.4 * s]), P("cone", gold, [x, 10 * s, z], [1.4 * s, 9 * s, 1.4 * s])];
    at(B, [...stupa(0, 0, 1.6), ...stupa(-16, 6, 1), ...stupa(16, 6, 1), P("box", mat(0xf4ecd8), [0, 3, 18], [20, 6, 10]),
      P("prism", red, [0, 8, 18], [6, 21, 6], [Math.PI / 2, 0, Math.PI / 2]), P("prism", mat(0x2a8a4a), [0, 10.6, 18], [4, 15, 4], [Math.PI / 2, 0, Math.PI / 2])], 0, -68);
  },
  geyser(B, scene, W) {
    at(B, [P("cyl", mat(0x3aa8c8, { r: 0.1, m: 0.3 }), [0, 0.1, 0], [12, 0.2, 12]), P("cyl", mat(0x8a8a80, { f: true }), [0, 0.05, 0], [16, 0.1, 16])], -18, -40);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 1, 16), mat(0xf4fbff, { op: 0.7, e: 0.2 })); jet.position.set(-18, 0, -40); scene.add(jet); W.fx.push(["geyser", jet]);
    [[-60, -150, 60, 40], [40, -170, 80, 55]].forEach(([x, z, r, h]) => mountain(B, x, z, r, h, 0x4a4a50));
  },
  sagrada(B) {
    const st = stoneT([200, 176, 140], [1, 3]);
    const spires = [[-6, 0, 30], [-2, 0, 36], [2, 0, 36], [6, 0, 30], [-4, -10, 26], [4, -10, 26], [0, -6, 44]];
    at(B, [P("box", st, [0, 6, -4], [22, 12, 16]), ...spires.flatMap(([x, z, h]) => [P("cyl8", st, [x, h / 2, z], [2.4, h, 2.4]), P("cone6", st, [x, h + 3, z], [2.2, 6, 2.2]), P("sph", mat(0xffc83a, { e: 0.4 }), [x, h + 6.4, z], 0.8)])], 0, -62);
  },
  mosque(B) {
    const st = mat(0xb8c0c8, { r: 0.6 }), dome = mat(0x8a98a8, { r: 0.5 });
    at(B, [P("box", st, [0, 5, 0], [28, 10, 26]), P("dome", dome, [0, 10, 0], [18, 14, 18]), ...[[-9, 0], [9, 0], [0, -9], [0, 9]].map(([x, z]) => P("dome", dome, [x, 10, z], [8, 6, 8])),
      ...[[-18, -16], [18, -16], [-18, 16], [18, 16], [-18, 0], [18, 0]].flatMap(([x, z]) => [P("cyl", st, [x, 11, z], [1.4, 22, 1.4]), P("cone", st, [x, 24, z], [1.4, 4, 1.4]), P("cyl", st, [x, 17, z], [2, 0.6, 2])])], 0, -66);
  },
  palace(B) {
    const red = mat(0xb8321e), green = mat(0x2a8a6a), roof = TM("roof", { args: [13, [60, 62, 72]] });
    at(B, [P("box", stoneT([170, 160, 150]), [0, 2, 0], [30, 4, 12]), ...[-12, -6, 0, 6, 12].map(x => P("cyl", red, [x, 7, 4], [1, 6, 1])), P("box", green, [0, 10.4, 0], [30, 1, 12]),
      P("cone4", roof, [0, 13.5, 0], [40, 5, 18], [0, Math.PI / 4, 0])], 0, -50);
    at(B, [P("dome", mat(0x3a8a4a, { f: true }), [0, -6, 0], [40, 20, 40]), P("cyl", mat(0xe8e8f0), [0, 22, 0], [2, 30, 2]), P("cyl", mat(0xe8e8f0), [0, 37, 0], [6, 4, 6]), P("cyl", mat(0xff5a3a, { e: 0.4 }), [0, 44, 0], [0.4, 10, 0.4])], 40, -110);
  },
  minaret(B) {
    const st = stoneT([200, 130, 90], [1, 4]);
    at(B, [P("box", st, [0, 16, 0], [8, 32, 8]), P("box", st, [0, 34, 0], [5, 4, 5]), P("dome", mat(0x3a8a5a), [0, 36, 0], [4, 2.4, 4]), ...[0, 1, 2].map(i => P("sph", mat(0xffc83a, { m: 0.8 }), [0, 38.6 + i * 1.2, 0], 0.9 - i * 0.15))], -14, -54);
  },
  matterhorn(B) { mountain(B, 30, -170, 70, 110, 0x7a7a80, 0xffffff, "cone4"); mountain(B, -70, -150, 60, 50); },
  lighthouse(B) {
    const segs = []; for (let i = 0; i < 7; i++) segs.push(P("cyl", mat(i % 2 ? 0xd8321e : 0xffffff, { r: 0.5 }), [0, 2 + i * 3, 0], [4 - i * 0.2, 3, 4 - i * 0.2]));
    at(B, [P("dod", mat(0x6a6a6a, { f: true }), [0, 0, 0], [16, 6, 12]), ...segs, P("cyl", mat(0xfff0a0, { e: 2.5 }), [0, 24, 0], [2.6, 2.4, 2.6]), P("cone", mat(0xd8321e), [0, 26.6, 0], [3.4, 2.6, 3.4])], 34, -70);
  },
  obelisk(B) { at(B, [P("box", stoneT([240, 236, 226], [1, 6]), [0, 17, 0], [5, 34, 5]), P("cone4", white(), [0, 36, 0], [3.6, 4, 3.6], [0, Math.PI / 4, 0]), P("box", stoneT([200, 196, 186]), [0, 0.5, 0], [12, 1, 12])], 0, -54); },
  bridge(B, scene) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(400, 14), new THREE.MeshStandardMaterial({ color: 0x3a7a8a, roughness: 0.1, metalness: 0.3 })); w.rotation.x = -Math.PI / 2; w.position.set(0, 0.04, -42); scene.add(w);
    const wood = TM("wood", { args: [9, [170, 110, 60]] });
    at(B, [P("box", wood, [0, 1.2, 0], [5, 0.6, 18]), ...[-1, 1].flatMap(s => [-7, 0, 7].map(z => P("cyl", mat(0xb8321e), [s * 2.2, 2.8, z], [0.3, 3.4, 0.3]))), P("cone4", TM("roof", { args: [13, [90, 60, 50]] }), [0, 5.6, 0], [7.4, 2.4, 22], [0, Math.PI / 4, 0])], -20, -42, 0);
  },
  icebergs(B, scene) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(420, 150), new THREE.MeshStandardMaterial({ color: 0x1a4a6a, roughness: 0.1, metalness: 0.4 })); w.rotation.x = -Math.PI / 2; w.position.set(0, 0.05, -125); scene.add(w);
    [[-40, -80, 14], [10, -95, 20], [60, -85, 12], [-80, -110, 18]].forEach(([x, z, s]) => at(B, [P("ico", mat(0xe8f6ff, { f: true, r: 0.2 }), [0, s * 0.3, 0], [s * 1.6, s, s * 1.2])], x, z));
    at(B, [P("box", mat(0xff7a1f), [0, 2, 0], [10, 4, 6]), P("box", mat(0xffffff), [0, 4.2, 0], [10.4, 0.4, 6.4]), P("cyl", mat(0xaaaaaa), [3, 6, 0], [0.2, 4, 0.2])], -20, -42, 0.3);
    for (let i = 0; i < 5; i++) at(B, [P("sph", mat(0x1a1a24), [0, 0.6, 0], [0.8, 1.2, 0.7]), P("sph", mat(0xffffff), [0, 0.55, 0.2], [0.55, 0.9, 0.4]), P("sph", mat(0x1a1a24), [0, 1.35, 0], 0.55), P("cone", mat(0xffa02a), [0, 1.3, 0.3], [0.15, 0.25, 0.15], [Math.PI / 2, 0, 0])], 12 + i * 2, -38 + (i % 2) * 2, 0, 1);
  },
  everest(B) { mountain(B, 0, -230, 150, 150, 0x6a6a78, 0xffffff, "cone4"); mountain(B, -120, -190, 80, 80); mountain(B, 120, -200, 90, 90); },
};
