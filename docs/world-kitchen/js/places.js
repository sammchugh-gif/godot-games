// The places, built the way the Agent Rory games build theirs: textured
// ground and walls (cobbles, paving, plaster house fronts with lit windows,
// tiled roofs), lamps and strings of lanterns, hills round the edge and a
// sky with a low sun. Each level is a square or a street in a different
// country, with its landmarks round the edge, an airfield at the south end,
// puzzle stations, and the boss's gate at the north end.
import * as THREE from "three";
import { TEX, M as TM, rng } from "./tex.js";
import { P, mat, label, padModel, houseModel } from "./models.js";

const TAU = Math.PI * 2;
export const SPOTS = { pad: [0, 23], puzzles: [[-17, 4], [17, 4], [0, -9]], gate: [0, -27], bound: 29 };

// ------------------------------------------------------------ sky
function skyDome(top, horizon, sunCol, sunH, night) {
  const sunDir = new THREE.Vector3(-0.55, 0.12 + sunH * 0.8, -0.8).normalize();
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(horizon) }, s: { value: new THREE.Color(sunCol) }, d: { value: sunDir }, n: { value: night ? 1 : 0 } },
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform vec3 a; uniform vec3 b; uniform vec3 s; uniform vec3 d; uniform float n; varying vec3 p;
      float h(vec3 q){ return fract(sin(dot(q, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){ float t = smoothstep(-0.08, 0.55, p.y); vec3 c = mix(b, a, t);
        float sd = max(dot(p, d), 0.0); c += s * (pow(sd, 400.0) * 3.0 + pow(sd, 12.0) * 0.45);
        if (n > 0.5) { vec3 q = floor(p * 300.0); float st = step(0.997, h(q)) * smoothstep(0.05, 0.3, p.y); c += vec3(st); }
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), m);
  return { dome, sunDir };
}
function clouds(scene, R, n, tint = 0xffffff) {
  const m = mat(tint, { r: 1, e: 0.35 });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group(), a = R() * TAU, d = 140 + R() * 160;
    for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), m); p.position.set((k - 2.5) * 5 + R() * 3, R() * 2.5, R() * 4); p.scale.set(6 + R() * 5, 3.5 + R() * 2, 5 + R() * 3); c.add(p); }
    c.position.set(Math.cos(a) * d, 55 + R() * 40, Math.sin(a) * d); c.lookAt(0, c.position.y, 0); scene.add(c);
  }
}
function aurora(scene) {
  const g = new THREE.Group();
  [[0x3affb0, -160, 0.4], [0x7a5aff, -190, -0.3], [0x3ad8ff, -140, 0.9]].forEach(([c, z, ry], i) => {
    const geo = new THREE.PlaneGeometry(320, 60, 40, 1), pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) pos.setZ(k, Math.sin(pos.getX(k) * 0.03 + i) * 18);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(0, 95 + i * 12, z); m.rotation.y = ry; g.add(m);
  });
  scene.add(g); return g;
}

// ------------------------------------------------------------ a builder that remembers what's solid
export function builder(scene) {
  const B = { scene, circles: [], rects: [], fx: [] };
  B.add = (obj, x = 0, y = 0, z = 0, ry = 0) => { obj.position.set(x, y, z); obj.rotation.y = ry; obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(obj); return obj; };
  B.box = (w, h, d, m, x, y, z, o = {}) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); B.add(b, x, y, z, o.ry || 0); if (o.solid !== false) B.rects.push({ x, z, hw: w / 2, hd: d / 2, ry: o.ry || 0 }); return b; };
  B.cyl = (rt, rb, h, m, x, y, z, o = {}) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 16), m); B.add(c, x, y, z, o.ry || 0); if (o.solid !== false) B.circles.push({ x, z, r: Math.max(rt, rb) }); return c; };
  B.glow = (x, y, z, color, s = 1.6) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(s); sp.position.set(x, y, z); scene.add(sp); return sp; };
  B.sign = (text, x, y, z, col) => { const l = label(text, col); l.position.set(x, y, z); scene.add(l); return l; };
  return B;
}

// a house: textured front with windows, gable roof of tiles
export function house(B, x, z, w, h, d, ry, o = {}) {
  const seed = Math.round(Math.abs(x * 13 + z * 7)) + 1;
  const wall = o.wall || [228, 214, 186];
  const fac = TM("facade", { args: [seed, wall, Math.max(2, Math.round(w / 2.4)), Math.max(1, Math.round(h / 2.6)), { shutters: o.shutters, balcony: o.balcony, lit: o.lit ?? 0.35, glow: o.glow }] });
  const side = TM("facade", { args: [seed + 1, wall, Math.max(1, Math.round(d / 2.6)), Math.max(1, Math.round(h / 2.6)), { lit: o.lit ?? 0.3, shutters: o.shutters, glow: o.glow }] });
  const plain = mat(new THREE.Color(`rgb(${wall.join(",")})`).getHex(), { r: 0.9 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, plain, plain, fac, fac]); body.position.y = h / 2; g.add(body);
  // a door on the front
  g.add(P("box", mat(o.door || 0x6a3a22, { r: 0.7 }), [0, 1.1, d / 2 + 0.03], [1.1, 2.2, 0.08]));
  if (o.flat) {
    g.add(P("box", plain, [0, h + 0.15, 0], [w + 0.3, 0.3, d + 0.3]));
  } else {
    const a = o.pitch || 0.5, L = (d / 2 + (o.eave || 0.5)) / Math.cos(a), t = Math.tan(a) * d / 2;
    const roof = TM("roof", { args: [seed, o.roof || [176, 84, 60]], repeat: [Math.max(1, w / 4), Math.max(1, L / 4)] });
    for (const k of [-1, 1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.18, L), roof); s.position.set(0, h + t / 2 + 0.05, k * d / 4); s.rotation.x = k * a; g.add(s); }
    const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, t); tri.closePath();
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: w, bevelEnabled: false }), plain); gable.rotation.y = Math.PI / 2; gable.position.set(-w / 2, h, 0); g.add(gable);
  }
  B.add(g, x, 0, z, ry); B.rects.push({ x, z, hw: w / 2, hd: d / 2, ry });
  return g;
}
// a row of houses along a line, different colours, touching
export function street(B, x0, z0, ry, list, o = {}) {
  let off = 0; const cx = Math.cos(ry), sx = Math.sin(ry);
  for (const [w, h, wall, roof] of list) { const c = off + w / 2; house(B, x0 + cx * c, z0 - sx * c, w, h, o.d || 6, ry, { ...o, wall, roof }); off += w + (o.gap || 0); }
}
export function lamp(B, x, z, col = 0xffe2a0, h = 3.6) {
  B.cyl(0.07, 0.1, h, mat(0x2a2a30, { m: 0.6, r: 0.4 }), x, h / 2, z, { seg: 8, solid: false }); B.circles.push({ x, z, r: 0.25 });
  B.add(P("sph", mat(col, { e: 2.2 }), [0, 0, 0], 0.32), x, h + 0.1, z);
  B.glow(x, h + 0.1, z, col, 2.4);
}
export function lanterns(B, x0, z0, x1, z1, y, cols, n = 7, o = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 4), mat(0x222222)); wire.rotation.set(Math.PI / 2, 0, 0);
  const holder = new THREE.Group(); holder.add(wire); B.add(holder, (x0 + x1) / 2, y, (z0 + z1) / 2, ry);
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, sag = Math.sin(f * Math.PI) * 0.6, c = cols[i % cols.length];
    if (o.flags) { const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.8), mat(c, { ds: true, r: 0.8, e: 0.15 })); B.add(fl, x, y - sag - 0.4, z, ry + Math.PI / 2); }
    else { B.add(P("sph", mat(c, { e: 1.6 }), [0, 0, 0], [0.55, 0.65, 0.55]), x, y - sag - 0.35, z); B.glow(x, y - sag - 0.35, z, c, 1.8); }
  }
}
export function tree(B, x, z, s = 1, c = 0x4f9a3a, o = {}) {
  B.cyl(0.18 * s, 0.26 * s, 2.2 * s, TM("wood", { args: [8, [110, 74, 44]], repeat: [0.5, 1] }), x, 1.1 * s, z, { seg: 8, solid: false }); B.circles.push({ x, z, r: 0.5 * s });
  const f = P("lsph", mat(c, { f: true, r: 0.9 }), [0, 0, 0], [2.6 * s, 2.3 * s, 2.6 * s]); B.add(f, x, 3 * s, z);
  if (o.second) B.add(P("lsph", mat(c, { f: true, r: 0.9 }), [0, 0, 0], 1.6 * s), x + 0.8 * s, 3.6 * s, z + 0.4 * s);
}
export function cypress(B, x, z, s = 1) { B.cyl(0.12, 0.15, 1, mat(0x6a4a2a), x, 0.5, z, { seg: 6, solid: false }); B.add(P("cone6", mat(0x2f5a2a, { f: true }), [0, 0, 0], [1.4 * s, 6 * s, 1.4 * s]), x, 3.6 * s, z); B.circles.push({ x, z, r: 0.6 }); }
export function pine(B, x, z, s = 1, snow = false) {
  B.cyl(0.2 * s, 0.3 * s, 1.2 * s, mat(0x5a3a22), x, 0.6 * s, z, { seg: 6, solid: false }); B.circles.push({ x, z, r: 0.8 * s });
  for (let i = 0; i < 3; i++) B.add(P("cone6", mat(snow && i === 2 ? 0xf4f8ff : 0x2f5a44, { f: true }), [0, 0, 0], [(2.8 - i * 0.7) * s, 1.8 * s, (2.8 - i * 0.7) * s]), x, (1.7 + i * 1.1) * s, z);
  if (snow) for (let i = 0; i < 2; i++) B.add(P("cone6", mat(0xf4f8ff, { f: true }), [0, 0, 0], [(2.5 - i * 0.7) * s, 0.4 * s, (2.5 - i * 0.7) * s]), x, (2.3 + i * 1.1) * s, z);
}
export function palm(B, x, z, s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) g.add(P("cyl", TM("wood", { args: [9, [150, 112, 70]] }), [i * 0.1 * s, (0.4 + i * 0.75) * s, 0], [0.36 * s, 0.8 * s, 0.36 * s], [0, 0, -0.07]));
  for (let i = 0; i < 7; i++) g.add(P("box", mat(0x3f9a3a, { f: true }), [0.5 * s + Math.cos(i * 0.9) * 1.1 * s, 4.6 * s, Math.sin(i * 0.9) * 1.1 * s], [2.8 * s, 0.08 * s, 0.7 * s], [0, i * 0.9, -0.35]));
  B.add(g, x, 0, z, Math.random() * TAU); B.circles.push({ x, z, r: 0.5 });
}
function hills(scene, R, color, n = 16, rMin = 120, rMax = 190, tall = 1) {
  const m = mat(color, { f: true, r: 1 });
  for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * 0.3, d = rMin + R() * (rMax - rMin); const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), m); h.scale.set(40 + R() * 40, (14 + R() * 26) * tall, 40 + R() * 30); h.position.set(Math.cos(a) * d, -4, Math.sin(a) * d); scene.add(h); }
}
function water(scene, y, size, color = 0x2a7ab8, x = 0, z = 0) {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color, roughness: 0.08, metalness: 0.4 })); w.rotation.x = -Math.PI / 2; w.position.set(x, y, z); w.receiveShadow = true; scene.add(w); return w;
}

// ------------------------------------------------------------ a whole level
const GROUND = { grass: ["grass", [1, [86, 140, 58]], 70], paving: ["paving", [2, [196, 178, 150], 64], 80], sand: ["sand", [6, [226, 196, 140]], 60],
  cobble: ["cobble", [3, [128, 120, 112]], 90], snow: ["snow", [7], 50], stone: ["stone", [5, [110, 96, 96]], 70] };

export function buildLevel(L) {
  const s = new THREE.Scene(), R = rng(L.n * 977 + 13);
  const [top, horizon, sunCol, sunH] = L.sky;
  const { dome, sunDir } = skyDome(top, horizon, sunCol, sunH, L.night); s.add(dome);
  s.fog = new THREE.Fog(horizon, 90, 330);
  s.add(new THREE.HemisphereLight(top, 0x6a5a40, L.night ? 0.7 : 1.0));
  const sun = new THREE.DirectionalLight(sunCol, L.night ? 0.9 : 2.4);
  sun.position.copy(sunDir).multiplyScalar(60); sun.castShadow = true;
  const sc = sun.shadow.camera; sc.left = sc.bottom = -42; sc.right = sc.top = 42; sc.near = 1; sc.far = 160; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  sun.shadow.mapSize.set(2048, 2048); s.add(sun, sun.target);
  const [gk, gargs, rep] = GROUND[L.ground];
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), TM(gk, { args: gargs, repeat: [rep * 2.5, rep * 2.5] })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  const B = builder(s);
  // the square in the middle, a different texture so it reads as a place
  const plazaK = L.ground === "grass" ? ["cobble", [3, [140, 132, 120]]] : L.ground === "snow" ? ["snow", [9]] : L.ground === "sand" ? ["paving", [2, [210, 186, 150], 64]] : ["paving", [4, [190, 176, 156], 48]];
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(15, 48), TM(plazaK[0], { args: plazaK[1], repeat: [8, 8] })); plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; plaza.receiveShadow = true; s.add(plaza);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), TM(plazaK[0], { args: plazaK[1], repeat: [3, 30] })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.015, 0); road.receiveShadow = true; s.add(road);
  if (!L.night) clouds(s, R, 10, L.n === 6 ? 0xffb0a0 : 0xffffff);
  const W = { scene: s, B, fx: [], R };
  (DRESS[L.id] || (() => {}))(W, L);
  // the airfield pad
  const pad = padModel(); B.add(pad, SPOTS.pad[0], 0, SPOTS.pad[1]); B.sign("AIRFIELD", SPOTS.pad[0], 7.2, SPOTS.pad[1]);
  return { scene: s, circles: B.circles, rects: B.rects, fx: W.fx, B, sun };
}

// what makes each place itself
const DRESS = {
  home(W) {
    const { B, scene, R } = W;
    hills(scene, R, 0x5a9a48, 18);
    // an English village: white cottages, brick houses, a pond
    street(B, -30, -6, Math.PI / 2, [[7, 5, [236, 232, 220], [120, 90, 70]], [6, 6, [168, 84, 60], [90, 60, 50]], [7, 5, [236, 226, 200], [120, 90, 70]]], { shutters: "#3a6a4a" });
    street(B, 30, 14, -Math.PI / 2, [[7, 5, [236, 232, 220], [120, 90, 70]], [6, 6, [196, 110, 80], [90, 60, 50]], [7, 5, [226, 220, 196], [120, 90, 70]]], { shutters: "#2a4a7a" });
    water(scene, 0.04, 14, 0x3a8ac8, -20, 18);
    [[-26, 22], [-14, 26], [20, -18], [26, -8], [-24, -22], [12, 28]].forEach(([x, z]) => tree(B, x, z, 1 + R() * 0.3, 0x4f9a3a, { second: true }));
    [[-8, 8], [8, 8], [-8, -14], [8, -14], [-6, 18], [6, 18]].forEach(([x, z]) => lamp(B, x, z));
    // the farmhouse with the kitchen in it, and the barn
    const fh = houseModel(); B.add(fh, 0, 0, -26); B.rects.push({ x: 0, z: -26, hw: 4.6, hd: 3.6, ry: 0 });
    B.sign("KITCHEN", 0, 10.5, -23, "#ffd166");
    const barn = new THREE.Group(); barn.add(P("box", TM("wood", { args: [11, [170, 50, 40]], repeat: [2, 1] }), [0, 2.5, 0], [7, 5, 6]), P("prism", mat(0x4a3a30, { f: true }), [0, 6, 0], [4.8, 7.4, 4.8], [Math.PI / 2, 0, Math.PI / 2]));
    B.add(barn, 18, 0, -24, -0.3); B.rects.push({ x: 18, z: -24, hw: 3.6, hd: 3.2, ry: -0.3 });
    // the vegetable patch and the hen house the puzzles are at
    for (let i = 0; i < 5; i++) B.add(P("box", mat(0x6a4a2a, { r: 1 }), [0, 0, 0], [5, 0.3, 0.8]), -20, 0.15, -2 + i * 1.6);
    for (let i = 0; i < 10; i++) B.add(P("cone", mat(0xff8a1f), [0, 0, 0], [0.15, 0.3, 0.15]), -22 + (i % 5), 0.45, -2 + Math.floor(i / 5) * 3.2);
    const hen = new THREE.Group(); hen.add(P("box", TM("wood", { args: [8, [196, 160, 110]] }), [0, 1, 0], [3, 2, 2.4]), P("prism", mat(0xc0392b), [0, 2.4, 0], [1.8, 3.4, 1.8], [Math.PI / 2, 0, Math.PI / 2]));
    B.add(hen, 21, 0, 2, -0.4); B.rects.push({ x: 21, z: 2, hw: 1.6, hd: 1.3, ry: -0.4 });
    for (let i = 0; i < 4; i++) { const c = new THREE.Group(); c.add(P("sph", mat(0xffffff), [0, 0.35, 0], [0.5, 0.45, 0.6]), P("sph", mat(0xffffff), [0, 0.65, 0.22], 0.3), P("cone", mat(0xe8322a), [0, 0.85, 0.22], [0.12, 0.15, 0.12]), P("cone", mat(0xffa02a), [0, 0.62, 0.42], [0.08, 0.15, 0.08], [Math.PI / 2, 0, 0])); B.add(c, 17 + i * 1.3, 0, 5 + (i % 2), R() * TAU); W.fx.push(["peck", c]); }
  },
  italy(W) {
    const { B, scene, R } = W;
    hills(scene, R, 0x7a9a50, 18);
    const ochre = [[226, 170, 100], [214, 120, 80], [236, 200, 140], [200, 140, 110], [230, 186, 120]];
    street(B, -33, 18, Math.PI / 2, [[7, 9, ochre[0], [170, 84, 56]], [6, 11, ochre[1], [150, 70, 50]], [7, 9, ochre[2], [170, 84, 56]], [6, 10, ochre[3], [150, 70, 50]], [7, 9, ochre[4], [170, 84, 56]], [6, 11, ochre[0], [150, 70, 50]]], { shutters: "#2f6a3a", balcony: true, d: 7 });
    street(B, 33, -22, -Math.PI / 2, [[7, 10, ochre[2], [170, 84, 56]], [6, 9, ochre[4], [150, 70, 50]], [7, 11, ochre[1], [170, 84, 56]], [6, 9, ochre[0], [150, 70, 50]], [7, 10, ochre[3], [170, 84, 56]], [6, 9, ochre[2], [150, 70, 50]]], { shutters: "#2f6a3a", balcony: true, d: 7 });
    // the Leaning Tower
    const tw = new THREE.Group(), st = TM("stone", { args: [5, [236, 230, 216]], repeat: [3, 1] });
    for (let i = 0; i < 8; i++) { tw.add(P("cyl", st, [0, 1.2 + i * 2.2, 0], [4.4, 2.2, 4.4])); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; tw.add(P("cyl", mat(0xf4efe4), [Math.cos(a) * 2.35, 1.2 + i * 2.2, Math.sin(a) * 2.35], [0.18, 1.8, 0.18])); } tw.add(P("cyl", mat(0xe8e0d0), [0, 2.3 + i * 2.2, 0], [5.0, 0.2, 5.0])); }
    tw.add(P("cyl", st, [0, 18.7, 0], [3, 1.8, 3])); tw.rotation.z = 0.08; B.add(tw, -20, 0, -30); B.circles.push({ x: -20, z: -30, r: 2.8 });
    // a fountain in the square
    B.cyl(4, 4.2, 0.9, TM("stone", { args: [5, [220, 210, 190]] }), 0, 0.45, 2); B.add(P("cyl", mat(0x4aa8e8, { r: 0.05, m: 0.3 }), [0, 0, 0], [7.4, 0.1, 7.4]), 0, 0.85, 2);
    B.cyl(0.5, 0.6, 2.6, TM("stone", { args: [5, [220, 210, 190]] }), 0, 1.3, 2, { solid: false }); B.add(P("cyl", mat(0xd8d0c0), [0, 0, 0], [2.4, 0.3, 2.4]), 0, 2.7, 2);
    [[-26, -10], [-26, 0], [26, 6], [26, 16], [-24, 26], [24, 26]].forEach(([x, z]) => cypress(B, x, z, 1 + R() * 0.3));
    [[-10, 12], [10, 12], [-10, -6], [10, -6]].forEach(([x, z]) => lamp(B, x, z, 0xffe2a0, 7.4));
    lanterns(B, -10, 12, 10, 12, 7.4, [0xffffff, 0xff3a3a, 0x3fae3a], 8);
  },
  mexico(W) {
    const { B, scene, R } = W;
    hills(scene, R, 0xc89a60, 16, 120, 190, 0.6);
    const adobe = [[240, 160, 180], [100, 200, 200], [250, 210, 100], [240, 130, 90], [170, 140, 220]];
    street(B, -33, 20, Math.PI / 2, adobe.map((c, i) => [6 + (i % 2), 5 + (i % 2), c]), { flat: true, d: 7, lit: 0.2 });
    street(B, 33, -20, -Math.PI / 2, adobe.map((c, i) => [6 + ((i + 1) % 2), 5 + (i % 3 === 0 ? 1 : 0), adobe[(i + 2) % 5]]), { flat: true, d: 7, lit: 0.2 });
    // the stepped pyramid
    const py = new THREE.Group(), st = TM("stone", { args: [5, [196, 180, 150]], repeat: [4, 1] });
    for (let i = 0; i < 7; i++) py.add(P("box", st, [0, 0.9 + i * 1.8, 0], [24 - i * 3.2, 1.8, 24 - i * 3.2]));
    py.add(P("box", st, [0, 14, 0], [4, 3, 4])); py.add(P("box", mat(0xa89070, { r: 1 }), [0, 6.5, 10.5], [4, 0.4, 14], [-0.82, 0, 0]));
    B.add(py, 0, 0, -48);
    [[-24, -8], [-26, 4], [25, 8], [27, -2], [-20, 27], [22, 27], [-14, -22], [14, -22]].forEach(([x, z]) => {
      const c = new THREE.Group(), m = mat(0x3a9a3a, { f: true }); c.add(P("cyl", m, [0, 2, 0], [0.8, 4, 0.8]), P("sph", m, [0, 4, 0], 0.8), P("cyl", m, [0.7, 2.4, 0], [0.45, 1.4, 0.45]), P("cyl", m, [-0.6, 2.8, 0], [0.4, 1.2, 0.4]));
      B.add(c, x, 0, z, R() * TAU); B.circles.push({ x, z, r: 0.7 }); });
    lanterns(B, -12, 10, 12, 10, 7.4, [0xff3a8a, 0xffd23f, 0x3ad8ff, 0x5fd35a, 0xff8a2a], 12, { flags: true });
    lanterns(B, -12, -4, 12, -4, 7.4, [0x3ad8ff, 0xff3a8a, 0x5fd35a, 0xffd23f, 0x9b6bff], 12, { flags: true });
    [[-12, 10], [12, 10], [-12, -4], [12, -4]].forEach(([x, z]) => lamp(B, x, z, 0xfff0c0, 7.4));
  },
  japan(W) {
    const { B, scene, R } = W;
    hills(scene, R, 0x4a6a4a, 16);
    const fuji = new THREE.Group(); fuji.add(P("cone", mat(0x5a6a8a, { f: true }), [0, 40, 0], [180, 80, 180]), P("cone", mat(0xf4f4ff, { f: true }), [0, 68, 0], [60, 24, 60])); scene.add(fuji); fuji.position.set(60, -4, -260);
    const wood = [[150, 100, 60], [130, 86, 54], [160, 112, 70]];
    for (const [x0, z0, ry] of [[-31, 22, Math.PI / 2], [31, -22, -Math.PI / 2]]) {
      let off = 0; for (let i = 0; i < 6; i++) { const w = 6 + (i % 2), c = off + w / 2, x = x0 + Math.cos(ry) * c, z = z0 - Math.sin(ry) * c;
        const g = new THREE.Group(); g.add(P("box", TM("wood", { args: [8 + i, wood[i % 3]] }), [0, 2.2, 0], [w, 4.4, 6]),
          P("box", mat(0xf4ecd8, { e: 0.25 }), [0, 2.4, 3.02], [w * 0.7, 1.6, 0.05]), P("cone4", TM("roof", { args: [13, [60, 62, 72]] }), [0, 5.4, 0], [w * 1.25, 2, 8.6], [0, Math.PI / 4, 0]));
        B.add(g, x, 0, z, ry); B.rects.push({ x, z, hw: w / 2, hd: 3, ry }); off += w; } }
    // the torii gate on the road, and a pagoda
    const red = mat(0xd8321e, { r: 0.4 });
    for (const z of [14, -16]) { B.cyl(0.42, 0.48, 6, red, -3.6, 3, z); B.cyl(0.42, 0.48, 6, red, 3.6, 3, z); B.box(9.6, 0.5, 0.8, mat(0x222222), 0, 6.3, z, { solid: false }); B.box(8.4, 0.35, 0.5, red, 0, 5.3, z, { solid: false }); }
    const pag = new THREE.Group(); for (let i = 0; i < 5; i++) pag.add(P("box", red, [0, 1.2 + i * 2.6, 0], [5 - i * 0.7, 2.2, 5 - i * 0.7]), P("cone4", TM("roof", { args: [13, [60, 62, 72]] }), [0, 2.6 + i * 2.6, 0], [9 - i * 1.1, 1.1, 9 - i * 1.1], [0, Math.PI / 4, 0]));
    pag.add(P("cyl", mat(0xffc83a, { m: 0.7 }), [0, 15, 0], [0.15, 3, 0.15])); B.add(pag, -22, 0, -30); B.circles.push({ x: -22, z: -30, r: 3.4 });
    [[-25, -8], [-26, 6], [25, 6], [26, 16], [-20, 28], [20, 28], [14, -26]].forEach(([x, z]) => tree(B, x, z, 1, 0xffb0d0, { second: true }));
    lanterns(B, -12, 6, 12, 6, 7.4, [0xff8a2a], 9); lanterns(B, -12, -6, 12, -6, 7.4, [0xff8a2a], 9);
    [[-12, 6], [12, 6], [-12, -6], [12, -6]].forEach(([x, z]) => lamp(B, x, z, 0xffb060, 7.4));
  },
  arctic(W) {
    const { B, scene, R } = W;
    hills(scene, R, 0xe8f0fa, 18, 110, 180, 1.4);
    aurora(scene);
    for (const [x, z] of [[-24, -14], [24, -16], [-25, 14], [26, 14]]) {
      const ig = new THREE.Group(), snow = TM("snow", { args: [7], repeat: [3, 2] }); ig.add(P("dome", snow, [0, 0, 0], 8), P("cyl", snow, [0, 1.2, 3.8], [2.4, 2.4, 2.6], [Math.PI / 2, 0, 0]), P("cyl", mat(0xffb060, { e: 1.2 }), [0, 1.2, 5.1], [1.6, 0.05, 1.6], [Math.PI / 2, 0, 0]));
      B.add(ig, x, 0, z, Math.atan2(-x, -z)); B.circles.push({ x, z, r: 4.2 }); B.glow(x, 1.4, z, 0xffb060, 3);
    }
    for (const [x, z, ry] of [[-14, -27, 0.3], [14, -28, -0.3]]) house(B, x, z, 7, 4, 6, ry, { wall: [130, 90, 60], roof: [236, 242, 250], lit: 0.8, glow: "#ffcf80" });
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + 0.2, d = 31 + R() * 6; pine(B, Math.cos(a) * d, Math.sin(a) * d, 1.2 + R() * 0.4, true); }
    for (let i = 0; i < 8; i++) { const a = R() * TAU, d = 20 + R() * 6, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 8 && z > 15) continue; B.cyl(0, 0.9, 3 + R() * 3, mat(0xbfe8ff, { op: 0.8, r: 0.05, m: 0.2 }), x, 1.8, z, { seg: 6 }); }
    [[-9, 10], [9, 10], [-9, -8], [9, -8]].forEach(([x, z]) => lamp(B, x, z, 0xffd8a0));
  },
  volcano(W) {
    const { B, scene, R } = W;
    water(scene, 0.03, 600, 0x2a8ab8);
    const isl = new THREE.Mesh(new THREE.CircleGeometry(42, 48), TM("sand", { args: [6, [226, 196, 140]], repeat: [14, 14] })); isl.rotation.x = -Math.PI / 2; isl.position.y = 0.06; isl.receiveShadow = true; scene.add(isl);
    const v = new THREE.Group(); v.add(P("cone6", mat(0x3a2a28, { f: true, r: 1 }), [0, 30, 0], [110, 60, 110]), P("cyl", mat(0xff5a1f, { e: 2.5 }), [0, 59.8, 0], [16, 0.5, 16]));
    v.position.set(-30, -2, -120); scene.add(v);
    for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(0x5a5060, { op: 0.5, r: 1 })); p.userData.t = i / 10; scene.add(p); W.fx.push(["smoke", p, [-30, 58, -120]]); }
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, d = 30 + R() * 8; palm(B, Math.cos(a) * d, Math.sin(a) * d, 1.1 + R() * 0.4); }
    for (const [x, z] of [[-22, -16], [22, -14], [-22, 14], [23, 16]]) {
      const h = new THREE.Group(); [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([a, b]) => h.add(P("cyl", TM("wood", { args: [9, [140, 100, 60]] }), [a, 1.5, b], [0.3, 3, 0.3])));
      h.add(P("cone6", mat(0xd8b060, { f: true, r: 1 }), [0, 4.2, 0], [6, 2.6, 6])); B.add(h, x, 0, z, R()); B.circles.push({ x, z, r: 2.6 });
    }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, x = Math.cos(a) * 13, z = Math.sin(a) * 13;
      B.cyl(0.1, 0.12, 2.4, TM("wood", { args: [9, [120, 80, 50]] }), x, 1.2, z, { seg: 6 }); B.add(P("cone6", mat(0xff8a1f, { e: 2.5 }), [0, 0, 0], [0.4, 0.7, 0.4]), x, 2.7, z); B.glow(x, 2.7, z, 0xff8a1f, 2.6); }
  },
  fortress(W) {
    const { B, scene, R } = W;
    water(scene, -30, 900, 0x1a3a6a);
    const st = TM("stone", { args: [5, [100, 86, 86]], repeat: [6, 2] });
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; if (Math.abs(Math.sin(a) - 1) < 0.05) continue; const x = Math.cos(a) * 33, z = Math.sin(a) * 33; B.box(9, 7, 2, st, x, 3.5, z, { ry: -a + Math.PI / 2 }); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.26, x = Math.cos(a) * 33, z = Math.sin(a) * 33; B.cyl(3, 3.4, 12, st, x, 6, z); B.add(P("cone6", mat(0xd8321e), [0, 0, 0], [7.4, 5, 7.4]), x, 14.5, z); B.add(P("box", mat(0xffc83a), [0, 0, 0], [0.1, 1.2, 1.6]), x, 18, z); }
    const under = new THREE.Mesh(new THREE.ConeGeometry(40, 30, 10), mat(0x4a3a30, { f: true })); under.rotation.x = Math.PI; under.position.y = -15.2; scene.add(under);
    for (const [x, z, c] of [[-14, -12, 0xd8201a], [14, -12, 0xffc83a]]) { B.cyl(2.2, 2.6, 1.2, st, x, 0.6, z); B.add(P("cyl", mat(c, { r: 0.2, e: 0.3 }), [0, 0, 0], [3.8, 0.2, 3.8]), x, 1.15, z); B.cyl(0.4, 0.4, 3, mat(c, { e: 0.3 }), x, 2.4, z, { solid: false }); }
    [[-10, 12], [10, 12], [-10, -4], [10, -4], [-18, 2], [18, 2]].forEach(([x, z]) => { B.cyl(0.12, 0.14, 2.6, mat(0x2a2a2a), x, 1.3, z, { seg: 6 }); B.add(P("cone6", mat(0xff6a1f, { e: 2.5 }), [0, 0, 0], [0.5, 0.9, 0.5]), x, 3, z); B.glow(x, 3, z, 0xff6a1f, 3); });
  },
};

// ------------------------------------------------------------ the boss's arena
export function buildArena(L) {
  const s = new THREE.Scene(), R = rng(L.n * 31 + 7);
  const [top, horizon, sunCol, sunH] = L.sky;
  const { dome, sunDir } = skyDome(top, horizon, sunCol, Math.max(0.3, sunH), L.night); s.add(dome);
  s.fog = new THREE.Fog(horizon, 70, 300);
  s.add(new THREE.HemisphereLight(top, 0x6a5a40, L.night ? 0.8 : 1.0));
  const sun = new THREE.DirectionalLight(sunCol, L.night ? 1.2 : 2.4); sun.position.copy(sunDir).multiplyScalar(60); sun.castShadow = true;
  const sc = sun.shadow.camera; sc.left = sc.bottom = -26; sc.right = sc.top = 26; sc.near = 1; sc.far = 160; sun.shadow.mapSize.set(2048, 2048); sun.shadow.normalBias = 0.04; s.add(sun, sun.target);
  const [gk, gargs, rep] = GROUND[L.ground];
  const g = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), TM(gk, { args: gargs, repeat: [rep * 2.5, rep * 2.5] })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; s.add(g);
  if (L.id === "volcano") water(s, 0.03, 600, 0x2a8ab8);
  if (L.id === "arctic") aurora(s);
  hills(s, R, L.id === "arctic" ? 0xe8f0fa : L.id === "mexico" || L.id === "volcano" ? 0xc89a60 : 0x5a8a48, 14);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(19, 19.5, 0.4, 48), TM("stone", { args: [5, [200, 190, 170]], repeat: [6, 6] })); floor.position.y = 0.2; floor.receiveShadow = true; s.add(floor);
  const B = builder(s), st = TM("stone", { args: [5, [226, 216, 196]], repeat: [1, 2] });
  for (let i = 0; i < 20; i++) { if (i === 5) continue; const a = i / 20 * TAU; B.cyl(0.9, 1, 7, st, Math.cos(a) * 19, 3.5, Math.sin(a) * 19, { solid: false }); B.add(P("cone6", mat(0xff8a1f, { e: 2 }), [0, 0, 0], [0.5, 0.9, 0.5]), Math.cos(a) * 19, 7.6, Math.sin(a) * 19); }
  return { scene: s, circles: B.circles, rects: B.rects, fx: [], B, bound: 17 };
}
