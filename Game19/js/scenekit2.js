// Building blocks for the places of Operations Midnight and Hurricane: the
// landmarks and street pieces, added to the World like scenekit.js does, so a
// scene can say this.eiffel(...), this.bigBen(...), this.whiteHouse(...).
import { World, THREE, PT } from "./world.js";
import { TAU } from "./ui.js";

const P = World.prototype;
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
// a group placed in the world, and pieces added to it in its own frame
P.grp = function (x, z, ry, y) { const g = new THREE.Group(); g.position.set(x, y || 0, z); g.rotation.y = ry || 0; this.scene.add(g); return g; };
const gbox = (g, w, h, d, m, x, y, z, ry) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (ry) b.rotation.y = ry; b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
const gcyl = (g, rt, rb, h, m, x, y, z, seg) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), m); c.position.set(x, y, z); c.castShadow = true; c.receiveShadow = true; g.add(c); return c; };
const gcone = (g, r, h, m, x, y, z, seg, ry) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 12), m); c.position.set(x, y, z); if (ry) c.rotation.y = ry; c.castShadow = true; g.add(c); return c; };
const gsph = (g, r, m, x, y, z, seg, part) => { const c = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, (seg || 16) * 0.6 | 0, 0, TAU, 0, part || Math.PI), m); c.position.set(x, y, z); c.castShadow = true; g.add(c); return c; };
export { gbox, gcyl, gcone, gsph };
// a lit facade texture: rows of windows on a wall of the given colour
function facadeTex(wall, rows, cols, o) {
  o = o || {};
  const c = document.createElement("canvas"); c.width = 256; c.height = 256; const g = c.getContext("2d");
  g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
  if (o.stone) for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(hash(i, 1) * 256, hash(i, 2) * 256, 24, 2); }
  const cw = 256 / cols, rh = 256 / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const x = k * cw + cw * 0.24, y = r * rh + rh * 0.2, w = cw * 0.52, h = rh * 0.58, lit = hash(r * 13 + k, o.seed || 3) < (o.lit || 0.4);
    if (o.ground && r === rows - 1) { g.fillStyle = o.ground; g.fillRect(k * cw + cw * 0.1, y, cw * 0.8, rh * 0.8); continue; }
    g.fillStyle = lit ? (o.glow || "#ffd88a") : (o.win || "#2a3040");
    if (o.arch) { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.fill(); } else g.fillRect(x, y, w, h);
    if (o.shutters) { g.fillStyle = o.shutters; g.fillRect(x - cw * 0.14, y, cw * 0.12, h); g.fillRect(x + w + cw * 0.02, y, cw * 0.12, h); }
    if (o.balcony && r > 0) { g.fillStyle = "rgba(20,20,24,.85)"; g.fillRect(x - 4, y + h - 4, w + 8, 4); for (let i = 0; i < 5; i++) g.fillRect(x - 4 + i * (w + 8) / 4, y + h - 12, 2, 10); }
  }
  if (o.band) { g.fillStyle = o.band; for (let r = 1; r < rows; r++) g.fillRect(0, r * rh - 3, 256, 5); }
  if (o.columns) { g.fillStyle = o.columns; for (let k = 0; k <= cols; k++) g.fillRect(k * cw - 5, 0, 10, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
P.facadeMat = function (wall, rows, cols, o) { const t = facadeTex(wall, rows, cols, o); return this.M({ map: t, emissive: 0xffffff, emap: t, ei: o && o.night ? 0.5 : 0.04, roughness: 0.85 }); };
// a row of town houses along a line, facing ry, with a roof on each
P.street = function (x0, z0, x1, z1, ry, o) {
  o = o || {}; const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / (o.w || 10))), walls = o.walls || ["#e8dcc4"], roof = o.roof;
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k, h = (o.h || 14) + hash(i, x0) * (o.hv || 6), w = len / n - 0.3, d = o.d || 9;
    const m = this.facadeMat(walls[i % walls.length], Math.max(2, Math.round(h / 3.4)), Math.max(2, Math.round(w / 3)), Object.assign({ seed: i + 7 }, o.fac || {}, { night: o.night }));
    const b = this.box(w, h, d, m, x, h / 2, z, { ry, collide: o.collide !== false });
    if (roof === "mansard") { const r = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.36, w * 0.62, 3.2, 4, 1), this.M({ color: 0x5a6470, roughness: 0.6, metalness: 0.3 })); r.rotation.y = ry + Math.PI / 4; r.scale.set(1, 1, d / w); r.position.set(x, h + 1.6, z); r.castShadow = true; this.scene.add(r); }
    else if (roof === "pitched") { const r = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.6, d * 0.6, w, 3, 1), this.M({ color: o.roofColor || 0xa03a2a, roughness: 0.8 })); r.rotation.z = Math.PI / 2; r.rotation.y = ry; r.scale.set(1, 1, 0.55); r.position.set(x, h + d * 0.18, z); r.castShadow = true; this.scene.add(r); }
    else if (roof === "flat") this.box(w + 0.4, 0.5, d + 0.4, this.M({ color: o.roofColor || 0xf0ece4 }), x, h + 0.25, z, { ry });
  }
};

// ------------------------------------------------------------------ PARIS
P.eiffel = function (x, z, s, lit) {
  const g = this.grp(x, z, 0); g.scale.setScalar(s || 1);
  const m = this.M({ color: 0x7a5a36, roughness: 0.6, metalness: 0.4, emissive: 0xffb040, ei: lit ? 0.55 : 0.02 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = gbox(g, 2.2, 42, 2.2, m, sx * 13, 18, sz * 13); leg.rotation.z = sx * 0.33; leg.rotation.x = -sz * 0.33; for (let k = 0; k < 5; k++) { const br = gbox(g, 0.4, 0.4, 7, m, sx * (18 - k * 2.6), 4 + k * 6, sz * (18 - k * 2.6)); br.rotation.y = sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4; } }
  gbox(g, 26, 2, 26, m, 0, 28, 0); gbox(g, 14, 1.6, 14, m, 0, 58, 0);
  for (let k = 0; k < 4; k++) { const a = new THREE.Mesh(new THREE.TorusGeometry(9, 0.9, 6, 20, Math.PI), m); a.position.set(k < 2 ? 0 : (k === 2 ? -13 : 13), 16, k < 2 ? (k ? 13 : -13) : 0); a.rotation.y = k < 2 ? 0 : Math.PI / 2; g.add(a); }
  const up = gcyl(g, 0.9, 7, 62, m, 0, 90, 0, 4); up.rotation.y = Math.PI / 4; gcyl(g, 0.25, 0.4, 16, m, 0, 128, 0, 6);
  for (let i = 0; i < 12; i++) { const h = 30 + i * 7, w = 7 - i * 0.5; gbox(g, w * 2 + 0.5, 0.35, 0.35, m, 0, h, w); gbox(g, w * 2 + 0.5, 0.35, 0.35, m, 0, h, -w); }
  if (lit) { const l = new THREE.PointLight(0xffc060, 60, 200, 1.6); l.position.y = 60; g.add(l); }
  return g;
};
P.glassPyramid = function (x, z, s) {
  const g = this.grp(x, z, 0), h = s * 0.64;
  const glass = this.M({ color: 0xbfe8ff, roughness: 0.05, metalness: 0.8, transparent: true, opacity: 0.45, emissive: 0x9ad0ff, ei: 0.25 });
  const p = gcone(g, s * 0.707, h, glass, 0, h / 2, 0, 4, Math.PI / 4);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.ConeGeometry(s * 0.707, h, 4)), new THREE.LineBasicMaterial({ color: 0x2a3a4a })); frame.rotation.y = Math.PI / 4; frame.position.y = h / 2; g.add(frame);
  for (let i = 1; i < 6; i++) { const k = i / 6, w = s * (1 - k); const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.01, w)), new THREE.LineBasicMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.6 })); l.position.y = h * k; g.add(l); }
  this.water(s * 1.8, s * 0.5, x, z + s * 0.95, 0x2a5a7a, { opacity: 0.9, y: 0.05 }); this.water(s * 1.8, s * 0.5, x, z - s * 0.95, 0x2a5a7a, { opacity: 0.9, y: 0.05 });
  this.collider(x, z, s / 2, s / 2);
  return g;
};
P.cafe = function (x, z, n, color) {
  const red = this.M({ color: color || 0xc0302a, roughness: 0.7 }), white = this.M({ color: 0xf4f0e8 }), metal = this.M({ color: 0x2a2a2a, metalness: 0.6 });
  this.box(n * 2.4 + 1, 0.15, 2.6, red, x, 3.1, z - 0.8, {}).rotation.x = 0.25;
  for (let i = 0; i < n; i++) { const tx = x - (n - 1) * 1.2 + i * 2.4; this.cyl(0.45, 0.45, 0.05, white, tx, 0.75, z + 0.4, 12); this.cyl(0.04, 0.04, 0.75, metal, tx, 0.38, z + 0.4, 6); for (const dx of [-0.6, 0.6]) this.box(0.4, 0.05, 0.4, metal, tx + dx, 0.45, z + 0.4, {}); }
  this.collider(x, z + 0.2, n * 1.2 + 0.4, 1.0);
};

// ------------------------------------------------------------------ MONT-SAINT-MICHEL
P.abbeyMount = function (x, z, s) {
  const g = this.grp(x, z, 0); g.scale.setScalar(s || 1);
  const rock = this.M({ color: 0x7a7a6a, roughness: 1 }), wall = this.M({ map: PT.brick("rgb(170,160,140)", "rgb(150,140,120)", "#8a8070", 5), rx: 3, roughness: 0.9 }), roof = this.M({ color: 0x3a3a44, roughness: 0.6 }), gold = this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2, emissive: 0xffb000, ei: 0.3 });
  gcyl(g, 20, 44, 34, rock, 0, 17, 0, 14);
  for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, r = 32 - (i % 4) * 4, y = 6 + (i % 4) * 6; gbox(g, 6, 7, 6, wall, Math.cos(a) * r, y, Math.sin(a) * r, -a); gcone(g, 4.6, 4, roof, Math.cos(a) * r, y + 5.5, Math.sin(a) * r, 4, -a + Math.PI / 4); }
  gbox(g, 26, 16, 14, wall, 0, 42, 0); gcone(g, 14, 8, roof, 0, 54, 0, 4, Math.PI / 4);
  gcyl(g, 3.4, 4.2, 18, wall, 0, 58, 0, 8); gcone(g, 3.8, 24, roof, 0, 79, 0, 8); gcyl(g, 0.5, 0.5, 2.6, gold, 0, 92.5, 0, 6);
  // the walls round the bottom
  const ring = new THREE.Mesh(new THREE.TorusGeometry(43, 1.6, 6, 40, Math.PI * 1.3), wall); ring.rotation.x = -Math.PI / 2; ring.rotation.z = Math.PI * 0.35; ring.position.y = 3; g.add(ring);
  return g;
};

// ------------------------------------------------------------------ VENICE
P.canal = function (x, z, w, len, ry, color) {
  const p = this.water(w, len, x, z, color || 0x2a6a66, { y: -0.6 }); p.rotation.z = ry || 0;
  const edge = this.M({ map: PT.paving(41, [190, 184, 170]), rx: 1, ry: len / 4 });
  for (const s of [-1, 1]) { const b = this.box(0.6, 1.2, len, edge, x + Math.cos(ry || 0) * s * (w / 2 + 0.3), -0.1, z - Math.sin(ry || 0) * s * (w / 2 + 0.3), { ry }); }
  const c = Math.abs(Math.cos(ry || 0)), sn = Math.abs(Math.sin(ry || 0)); this.collider(x, z, (w / 2) * c + (len / 2) * sn, (len / 2) * c + (w / 2) * sn);
  return p;
};
P.archBridge = function (x, z, span, ry, color) {
  const g = this.grp(x, z, ry || 0), m = this.M({ color: color || 0xe8dcc8, roughness: 0.8 });
  const n = 8; for (let i = 0; i <= n; i++) { const k = i / n, a = Math.PI * k, px = -span / 2 + span * k, py = Math.sin(a) * 1.8; const st = gbox(g, span / n + 0.2, 0.4, 3.2, m, px, py + 0.6, 0); st.rotation.z = Math.cos(a) * -0.5; }
  for (const s of [-1, 1]) for (let i = 0; i <= n; i++) { const k = i / n, px = -span / 2 + span * k, py = Math.sin(Math.PI * k) * 1.8; gbox(g, 0.2, 0.9, 0.2, m, px, py + 1.2, s * 1.5); }
  return g;
};
P.clockTower = function (x, z, o) {
  o = o || {}; const g = this.grp(x, z, o.ry || 0), h = o.h || 22, w = o.w || 6;
  const wall = o.wallMat || this.M({ map: PT.brick("rgb(200,180,150)", "rgb(180,160,130)", "#9a8a70", 9), rx: 2, ry: 5 });
  gbox(g, w, h, w, wall, 0, h / 2, 0);
  const faceTex = PT.clock(); const face = new THREE.Mesh(new THREE.CircleGeometry(w * 0.36, 32), this.M({ map: faceTex, emissive: 0xfff0c0, emap: faceTex, ei: o.night ? 0.8 : 0.1 }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(w * 0.36, w * 0.44, 32), this.M({ color: o.ring || 0xffd166, metalness: 0.8, roughness: 0.3 }));
  for (let k = 0; k < (o.faces || 1); k++) { const a = k * Math.PI / 2, f = face.clone(), r = ring.clone(); for (const q of [f, r]) { q.position.set(Math.sin(a) * (w / 2 + 0.05), h * (o.faceAt || 0.72), Math.cos(a) * (w / 2 + 0.05)); q.rotation.y = a; g.add(q); } }
  if (o.dial) { const d = new THREE.Mesh(new THREE.CircleGeometry(w * 0.3, 32), this.M({ color: 0x1a3a7a, emissive: 0x1a3a7a, ei: 0.3 })); d.position.set(0, h * 0.42, w / 2 + 0.06); g.add(d); const r2 = new THREE.Mesh(new THREE.RingGeometry(w * 0.3, w * 0.38, 32), this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2 })); r2.position.copy(d.position); r2.position.z += 0.01; g.add(r2); }
  if (o.top === "spire") { gcone(g, w * 0.62, h * 0.55, this.M({ color: 0x2a3a3a, metalness: 0.4, roughness: 0.5 }), 0, h + h * 0.27, 0, 4, Math.PI / 4); }
  else if (o.top === "gothic") { gcone(g, w * 0.72, h * 0.42, this.M({ color: 0x2a2a30, roughness: 0.5 }), 0, h + h * 0.21, 0, 8); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) gcone(g, w * 0.14, h * 0.2, this.M({ color: 0x2a2a30 }), dx * w * 0.45, h + h * 0.1, dz * w * 0.45, 6); }
  else if (o.top === "bells") { gbox(g, w * 1.05, 2, w * 1.05, this.M({ color: 0x2a4a8a }), 0, h + 1, 0); for (const s of [-1, 1]) { const b = new THREE.Group(); b.position.set(s * w * 0.25, h + 3.4, 0); g.add(b); gcyl(b, 0.2, 0.4, 2.4, this.M({ color: 0x4a3a2a, metalness: 0.6 }), 0, 0, 0, 8); gsph(b, 0.4, this.M({ color: 0x4a3a2a, metalness: 0.6 }), 0, 1.4, 0, 10); } gsph(g, 1.6, this.M({ color: 0x8a6a3a, metalness: 0.7, roughness: 0.3 }), 0, h + 4.6, 0, 14); }
  else gbox(g, w * 1.1, 1.2, w * 1.1, this.M({ color: 0x6a5a4a }), 0, h + 0.6, 0);
  this.collider(x, z, w / 2, w / 2, o.ry);
  return g;
};
P.campanile = function (x, z, h) { const g = this.grp(x, z, 0), br = this.M({ map: PT.brick("rgb(170,80,60)", "rgb(150,70,50)", "#8a4a3a", 12), rx: 2, ry: 8 }); gbox(g, 6, h, 6, br, 0, h / 2, 0); gbox(g, 6.6, 5, 6.6, this.M({ color: 0xe8dcc8 }), 0, h + 2.5, 0); gcone(g, 4.4, 10, this.M({ color: 0x3a6a5a, metalness: 0.4 }), 0, h + 10, 0, 4, Math.PI / 4); gsph(g, 0.8, this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2 }), 0, h + 15.6, 0, 10); this.collider(x, z, 3, 3); return g; };
P.gondola = function (x, z, ry) { const g = this.grp(x, z, ry || 0, 0.1), black = this.M({ color: 0x111114, roughness: 0.3 }); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 6.5, 4, 12), black); b.rotation.x = Math.PI / 2; b.scale.set(1, 1, 0.5); g.add(b); gbox(g, 0.6, 1.1, 0.12, this.M({ color: 0xd8c8a0, metalness: 0.7 }), 0, 0.8, -3.6); gbox(g, 0.9, 0.35, 1.3, this.M({ color: 0xa01a2a }), 0, 0.45, 0.6); this.updaters.push(() => { g.position.y = 0.1 + Math.sin(this.t * 1.2 + x) * 0.05; }); return g; };
P.pole = function (x, z, c) { const t = document.createElement("canvas"); t.width = 8; t.height = 64; const g = t.getContext("2d"); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4f0e8" : c || "#c0203a"; g.fillRect(0, i * 8, 8, 8); } const tex = new THREE.CanvasTexture(t); tex.colorSpace = THREE.SRGBColorSpace; this.cyl(0.15, 0.15, 4.4, this.M({ map: tex }), x, 1.6, z, 8); };

// ------------------------------------------------------------------ ROME
P.colosseum = function (x, z, s) {
  const g = this.grp(x, z, 0); g.scale.setScalar(s || 1);
  const c = document.createElement("canvas"); c.width = 512; c.height = 128; const gg = c.getContext("2d"); gg.fillStyle = "#c8a878"; gg.fillRect(0, 0, 512, 128);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 32; k++) { gg.fillStyle = "#3a2a1a"; const x0 = k * 16 + 3, y0 = 8 + r * 40; gg.beginPath(); gg.moveTo(x0, y0 + 28); gg.lineTo(x0, y0 + 5); gg.arc(x0 + 5, y0 + 5, 5, Math.PI, 0); gg.lineTo(x0 + 10, y0 + 28); gg.fill(); }
  gg.fillStyle = "rgba(0,0,0,.18)"; for (let i = 0; i < 3; i++) gg.fillRect(0, i * 40 + 38, 512, 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1);
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 26, 64, 1, true), m); ring.position.y = 13; ring.scale.z = 0.82; g.add(ring);
  const broken = new THREE.Mesh(new THREE.CylinderGeometry(30.2, 30.2, 10, 64, 1, true, -0.4, Math.PI * 0.95), m); broken.position.y = 31; broken.scale.z = 0.82; g.add(broken);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 18, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xa88a60, roughness: 1, side: THREE.DoubleSide })); inner.position.y = 9; inner.scale.z = 0.8; g.add(inner);
  return g;
};
P.obelisk = function (x, z, h) { const m = this.M({ color: 0xd8c8a8, roughness: 0.8 }); this.box(2.4, 2, 2.4, this.M({ color: 0xb8a888 }), x, 1, z, { collide: true }); const o = this.box(1.4, h, 1.4, m, x, 2 + h / 2, z, {}); o.geometry = new THREE.CylinderGeometry(0.6, 0.95, h, 4); o.rotation.y = Math.PI / 4; this.cone(0.62, 1.6, m, x, 2 + h + 0.8, z, 4).rotation.y = Math.PI / 4; };
P.cypress = function (x, z, h) { const m = this.M({ color: 0x1e3a22, roughness: 1 }), c = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, h, 4, 8), m); c.position.set(x, h / 2 + 0.8, z); c.castShadow = true; this.scene.add(c); this.circle(x, z, 0.6); };
P.stonePine = function (x, z, h) { this.cyl(0.3, 0.45, h, this.M({ color: 0x6a4a3a }), x, h / 2, z, 7, { collide: true }); const top = this.sphere(1, this.M({ color: 0x2e5a2a, roughness: 1 }), x, h, z, 12); top.scale.set(5, 1.8, 5); };
P.steps = function (x, z, w, n, ry, color) { const m = this.M({ map: PT.paving(52, [230, 220, 200]), rx: w / 4, ry: 1 }); for (let i = 0; i < n; i++) this.box(w, 0.35 * (i + 1), 1.0, m, x - Math.sin(ry || 0) * i * 1.0, 0.175 * (i + 1), z - Math.cos(ry || 0) * i * 1.0, { ry }); };

// ------------------------------------------------------------------ PRAGUE
P.astroClock = function (x, z, ry, night) {
  const g = this.grp(x, z, ry || 0), stone = this.M({ map: PT.brick("rgb(150,140,125)", "rgb(130,120,108)", "#6a6258", 14), rx: 2, ry: 6 }), dark = this.M({ color: 0x2a2a30, roughness: 0.5 });
  gbox(g, 9, 34, 9, stone, 0, 17, 0); gcone(g, 6.5, 12, dark, 0, 40, 0, 4, Math.PI / 4); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) gcone(g, 0.9, 6, dark, dx * 4.2, 37, dz * 4.2, 6);
  // the dial, blue and gold, with the zodiac ring and the calendar below
  const disc = (r, c, y, e) => { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 40), this.M({ color: c, emissive: c, ei: e || 0.15, metalness: 0.3 })); d.position.set(0, y, 4.52); g.add(d); return d; };
  disc(3.4, 0x2a5aa0, 16, 0.2); disc(2.6, 0x7a4a2a, 16).position.z = 4.53; disc(1.6, 0x1a2a5a, 16).position.z = 4.54;
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.8, 40), this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2, emissive: 0xffb000, ei: 0.2 })); ring.position.set(0, 16, 4.55); g.add(ring);
  const zod = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.2, 40), this.M({ color: 0xffd166, metalness: 0.9 })); zod.position.set(0.5, 16.4, 4.56); g.add(zod); this.updaters.push(dt => { zod.rotation.z += dt * 0.05; });
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.05), this.M({ color: 0xffd166, metalness: 0.9 })); hand.geometry.translate(0, 1.4, 0); hand.position.set(0, 16, 4.6); g.add(hand); this.updaters.push(dt => { hand.rotation.z -= dt * 0.1; });
  disc(2.6, 0xe8dcc0, 9).position.z = 4.52; const cal = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.9, 40), this.M({ color: 0xffd166, metalness: 0.9 })); cal.position.set(0, 9, 4.53); g.add(cal);
  // the skeleton and the apostles' windows
  for (const s of [-1, 1]) { gbox(g, 1, 1.4, 0.2, this.M({ color: 0x3a2a2a }), s * 1.2, 21.5, 4.55); }
  const sk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.2), this.M({ color: 0xf0ece0 })); sk.position.set(4.2, 16, 4.6); g.add(sk);
  if (night) { const l = new THREE.PointLight(0xffe0a0, 12, 30, 1.6); l.position.set(0, 16, 9); g.add(l); }
  this.collider(x, z, 4.5, 4.5, ry);
  return g;
};
P.spires = function (x, z, s) { const g = this.grp(x, z, 0); g.scale.setScalar(s || 1); const stone = this.M({ color: 0x8a8074, roughness: 0.9 }), dark = this.M({ color: 0x24242a, roughness: 0.6 }), gold = this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2 }); gbox(g, 18, 24, 12, stone, 0, 12, 2); for (const x2 of [-6, 6]) { gbox(g, 6, 40, 6, stone, x2, 20, 0); gcone(g, 4.4, 22, dark, x2, 51, 0, 4, Math.PI / 4); for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) gcone(g, 1, 7, dark, x2 + dx, 43, dz, 4); gsph(g, 0.6, gold, x2, 62.6, 0, 8); } return g; };
P.statue = function (x, z, ry, h) { const m = this.M({ color: 0x2a2a28, roughness: 0.7, metalness: 0.2 }); this.box(1.2, 1.2, 1.2, this.M({ color: 0x6a6a64 }), x, 0.6 + 0.8, z, { ry }); const p = this.person({ coat: 0x2a2a28, trousers: 0x2a2a28, skin: 0x3a3a36, hair: 0x2a2a28, faces: false }); p.position.set(x, 2.0, z); p.rotation.y = ry || 0; p.scale.setScalar(h || 1.2); p.traverse(o => { if (o.isMesh) o.material = m; }); this.scene.add(p); };
P.puppetStall = function (x, z, ry) { const g = this.grp(x, z, ry || 0), red = this.M({ color: 0xa01a2a }), gold = this.M({ color: 0xffd166, metalness: 0.7 }); gbox(g, 5, 3.2, 1.2, this.M({ color: 0x5a3a2a }), 0, 1.6, 0); gbox(g, 3.4, 2, 0.1, this.M({ color: 0x1a1030 }), 0, 2.3, 0.61); for (const s of [-1, 1]) gbox(g, 0.9, 2.2, 0.14, red, s * 1.4, 2.3, 0.66); gbox(g, 5.2, 0.5, 1.4, gold, 0, 3.45, 0); for (let i = 0; i < 3; i++) { const p = this.person({ coat: [0xc0392b, 0x2a6ab0, 0xe0a020][i], skin: 0xf0d0b0, faces: false }); p.scale.setScalar(0.35); p.position.set(-0.8 + i * 0.8, 1.7, 0.7); g.add(p); } this.collider(x, z, 2.6, 0.8, ry); return g; };

// ------------------------------------------------------------------ BAVARIA
P.fairyCastle = function (x, z, s, onCrag) {
  const g = this.grp(x, z, 0); g.scale.setScalar(s || 1);
  const white = this.M({ color: 0xf2eee4, roughness: 0.6 }), blue = this.M({ color: 0x3a5aa0, roughness: 0.5, metalness: 0.2 }), rock = this.M({ color: 0x7a7a70, roughness: 1 });
  const base = onCrag ? 30 : 0; if (onCrag) gcyl(g, 20, 34, base, rock, 0, base / 2, 0, 10);
  gbox(g, 22, 26, 12, this.M({ map: PT.windows(6, 7, [236, 232, 222], ["#ffe9b8"], 0.3, 5), roughness: 0.6 }), 0, base + 13, 0); gcone(g, 13, 9, blue, 0, base + 30.5, 0, 4, Math.PI / 4);
  for (const [tx, tz, r, h] of [[-11, 5, 3, 38], [11, 5, 2.6, 32], [-5, -7, 3.6, 46], [7, -6, 2.4, 28], [0, 8, 2, 22]]) { gcyl(g, r, r, h, white, tx, base + h / 2, tz, 16); gcone(g, r * 1.3, h * 0.36, blue, tx, base + h + h * 0.18, tz, 16); }
  return g;
};
P.timberHouse = function (x, z, w, d, h, ry, o) {
  o = o || {}; const g = this.grp(x, z, ry || 0);
  const c = document.createElement("canvas"); c.width = c.height = 128; const gg = c.getContext("2d"); gg.fillStyle = o.wall || "#f0e8d8"; gg.fillRect(0, 0, 128, 128); gg.strokeStyle = "#5a3a1a"; gg.lineWidth = 7; gg.strokeRect(3, 3, 122, 122); gg.beginPath(); gg.moveTo(0, 64); gg.lineTo(128, 64); gg.moveTo(64, 0); gg.lineTo(64, 128); gg.moveTo(0, 0); gg.lineTo(64, 64); gg.moveTo(128, 0); gg.lineTo(64, 64); gg.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 3, h / 3);
  gbox(g, w, h, d, this.M({ map: t, roughness: 0.9 }), 0, h / 2, 0);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.62, d * 0.62, w + 1, 3, 1), this.M({ color: o.roof || 0x8a3a2a, roughness: 0.8 })); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.8); roof.position.y = h + d * 0.26; roof.castShadow = true; g.add(roof);
  if (o.cuckoo) {
    // a giant cuckoo clock on the front
    const cx = 0, cy = h * 0.55, fz = d / 2 + 0.3; gbox(g, 3.4, 4, 0.6, this.M({ color: 0x6a3a1a }), cx, cy, fz); const roofC = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.8, 3, 1), this.M({ color: 0x4a2a10 })); roofC.rotation.x = Math.PI / 2; roofC.rotation.z = Math.PI; roofC.position.set(cx, cy + 2.6, fz); roofC.scale.set(1, 1, 1); g.add(roofC);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), this.M({ map: PT.clock() })); face.position.set(cx, cy - 0.3, fz + 0.31); g.add(face);
    const bird = gsph(g, 0.35, this.M({ color: 0xb8862a, metalness: 0.6 }), cx, cy + 1.3, fz + 0.4, 10); this.updaters.push(() => { bird.position.z = fz + 0.4 + Math.max(0, Math.sin(this.t * 1.5)) * 0.8; });
    for (const s of [-0.5, 0.5]) { const ch = gcyl(g, 0.05, 0.05, 2.4, this.M({ color: 0x8a6a2a, metalness: 0.8 }), cx + s, cy - 3, fz + 0.2, 6); gcone(g, 0.2, 0.8, this.M({ color: 0x4a2a10 }), cx + s, cy - 4.4, fz + 0.2, 8).rotation.x = Math.PI; }
  }
  this.collider(x, z, w / 2, d / 2, ry);
  return g;
};
P.chapel = function (x, z, ry) { const g = this.grp(x, z, ry || 0), white = this.M({ color: 0xf2eee4, roughness: 0.7 }), roof = this.M({ color: 0x5a3a2a }); gbox(g, 6, 5, 9, white, 0, 2.5, 0); const r = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 9.4, 3, 1), roof); r.rotation.x = Math.PI / 2; r.rotation.y = Math.PI / 2; r.rotation.z = Math.PI / 2; r.scale.set(1, 0.6, 1); r.position.y = 6; g.add(r); gbox(g, 2.4, 11, 2.4, white, 0, 5.5, -4); gsph(g, 1.5, this.M({ color: 0x3a6a5a, metalness: 0.4 }), 0, 11.6, -4, 12); gcone(g, 0.5, 2.4, this.M({ color: 0x3a6a5a, metalness: 0.4 }), 0, 13.8, -4, 8); this.collider(x, z, 3, 4.5, ry); return g; };

// ------------------------------------------------------------------ SCOTLAND
P.viaduct = function (x, z, len, h, ry) { const g = this.grp(x, z, ry || 0), m = this.M({ color: 0x9a948a, roughness: 1 }), n = Math.round(len / 8); for (let i = 0; i < n; i++) { const px = -len / 2 + (i + 0.5) * len / n; gbox(g, 1.6, h, 3.4, m, px - len / n / 2 + 0.8, h / 2, 0); const a = new THREE.Mesh(new THREE.TorusGeometry(len / n / 2 - 0.8, 0.9, 6, 16, Math.PI), m); a.position.set(px, h - len / n / 2 + 0.2, 0); g.add(a); } gbox(g, len, 1.4, 4, m, 0, h + 0.7, 0); return g; };
P.ruin = function (x, z, s) { const g = this.grp(x, z, 0); g.scale.setScalar(s || 1); const m = this.M({ map: PT.brick("rgb(130,125,115)", "rgb(110,105,98)", "#5a5650", 21), rx: 2, ry: 3 }); gbox(g, 9, 20, 9, m, 0, 10, 0); for (const [x2, h] of [[-3, 3], [-1, 6], [1.5, 2], [3.5, 5]]) gbox(g, 2, h, 2, m, x2, 20 + h / 2, -3.5); for (const [x2, z2, w, d, h] of [[12, 0, 14, 1.6, 7], [0, 12, 1.6, 18, 6], [-10, 5, 1.6, 12, 4], [8, 10, 6, 1.6, 3]]) gbox(g, w, h, d, m, x2, h / 2, z2); return g; };
P.heather = function (x, z, r, n) { const m = this.M({ color: 0x8a5a8a, roughness: 1 }); for (let i = 0; i < n; i++) { const a = hash(i, x) * TAU, d = Math.sqrt(hash(x, i)) * r; const s = this.sphere(1, m, x + Math.cos(a) * d, 0.2, z + Math.sin(a) * d, 6); s.scale.set(1 + hash(i, 2), 0.5, 1 + hash(2, i)); } };

// ------------------------------------------------------------------ STONEHENGE
P.stoneRing = function (x, z, r) {
  const m = this.M({ color: 0x8a8a7e, roughness: 1 }), lichen = this.M({ color: 0x7a806a, roughness: 1 });
  for (let i = 0; i < 18; i++) { if (i === 4 || i === 13) continue; const a = i / 18 * TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r, h = 4 + hash(i, 3); this.box(2.2, h, 1.2, i % 3 ? m : lichen, px, h / 2, pz, { ry: -a + Math.PI / 2 }); this.circle(px, pz, 1.1); if (i % 2 === 0 && i !== 12 && i !== 2) { const a2 = a + TAU / 36; this.box(5, 1, 1.2, m, x + Math.cos(a2) * r, h + 0.5, z + Math.sin(a2) * r, { ry: -a2 + Math.PI / 2 }); } }
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI + 0.3, px = x + Math.cos(a) * r * 0.45, pz = z + Math.sin(a) * r * 0.45; for (const s of [-1, 1]) { this.box(2, 7, 1.3, m, px + s * Math.sin(a) * 1.3, 3.5, pz - s * Math.cos(a) * 1.3, { ry: -a }); } this.box(1.6, 1, 4.4, m, px, 7.5, pz, { ry: -a }); this.circle(px, pz, 2.4); }
  this.box(2, 5, 2, m, x + r * 1.7, 2.5, z, {}); this.circle(x + r * 1.7, z, 1.2);
};
P.tent = function (x, z, ry, color) { const g = this.grp(x, z, ry || 0), m = this.M({ color: color || 0xe0c070, roughness: 0.9 }); const t = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 5, 3, 1), m); t.rotation.z = Math.PI / 2; t.rotation.y = Math.PI / 2; t.position.y = 1.3; t.castShadow = true; g.add(t); this.collider(x, z, 2.5, 2.6, ry); return g; };
P.trench = function (x, z, w, d) { this.box(w, 0.1, d, this.M({ color: 0x6a5238, roughness: 1 }), x, 0.02, z, {}); for (const s of [-1, 1]) this.box(w, 0.5, 0.4, this.M({ color: 0x8a6a48, roughness: 1 }), x, 0.25, z + s * d / 2, {}); for (let i = 0; i < 4; i++) this.box(0.6, 0.3, 0.4, this.M({ color: 0xc8b890 }), x - w / 3 + i * w / 5, 0.15, z + 0.4, {}); };

// ------------------------------------------------------------------ LONDON
P.whiteTower = function (x, z, s) {
  const g = this.grp(x, z, 0); g.scale.setScalar(s || 1);
  const stone = this.M({ map: PT.windows(5, 5, [226, 222, 210], ["#3a3a44"], 0, 3), roughness: 0.8 }), lead = this.M({ color: 0x5a6468, metalness: 0.4, roughness: 0.5 }), gold = this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2 });
  gbox(g, 30, 26, 24, stone, 0, 13, 0);
  for (const [tx, tz, round] of [[-15, -12, true], [15, -12, false], [-15, 12, false], [15, 12, false]]) { if (round) gcyl(g, 3.6, 3.6, 32, stone, tx, 16, tz, 16); else gbox(g, 6, 32, 6, stone, tx, 16, tz); const cap = round ? gsph(g, 3.8, lead, tx, 32, tz, 14, Math.PI / 2) : gcone(g, 3.6, 6, lead, tx, 34, tz, 4, Math.PI / 4); gcyl(g, 0.15, 0.15, 3, gold, tx, 38, tz, 6); }
  for (let i = 0; i < 14; i++) { gbox(g, 1.2, 1.4, 1.2, stone, -13 + i * 2, 26.7, -12); gbox(g, 1.2, 1.4, 1.2, stone, -13 + i * 2, 26.7, 12); }
  return g;
};
P.curtainWall = function (x0, z0, x1, z1, h) { const m = this.M({ map: PT.brick("rgb(160,150,130)", "rgb(140,130,112)", "#6a6258", 18), rx: 6, ry: 2 }), len = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; this.box(len, h, 2, m, cx, h / 2, cz, { ry, collide: true }); const n = Math.floor(len / 2.4); for (let i = 0; i < n; i += 2) { const k = (i + 0.5) / n; this.box(1.2, 1, 2, m, x0 + (x1 - x0) * k, h + 0.5, z0 + (z1 - z0) * k, { ry }); } };
P.towerBridge = function (x, z, span, ry) {
  const g = this.grp(x, z, ry || 0), stone = this.M({ map: PT.windows(3, 8, [200, 190, 170], ["#2a3a4a"], 0, 11), roughness: 0.8 }), blue = this.M({ color: 0x3a6aa0, metalness: 0.4, roughness: 0.5 }), roof = this.M({ color: 0x4a5a64, metalness: 0.3 });
  for (const s of [-1, 1]) { const tx = s * span / 2; gbox(g, 10, 44, 10, stone, tx, 22, 0); gcone(g, 7.4, 10, roof, tx, 49, 0, 4, Math.PI / 4); for (const [dx, dz] of [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]]) { gcyl(g, 1, 1, 6, stone, tx + dx, 45, dz, 10); gcone(g, 1.2, 4, roof, tx + dx, 50, dz, 10); } gbox(g, 14, 4, 14, stone, tx, -1, 0); }
  for (const z2 of [-2.5, 2.5]) gbox(g, span - 10, 2.6, 2, blue, 0, 38, z2);
  for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * (span / 2 - 5), 10, 0); piv.rotation.z = -s * 1.0; g.add(piv); gbox(piv, span / 2 - 5, 1.2, 8, blue, -s * (span / 2 - 5) / 2, 0, 0); }
  // the suspension spans to the banks
  for (const s of [-1, 1]) for (const z2 of [-4, 4]) { const c = gbox(g, 30, 0.8, 0.8, blue, s * (span / 2 + 15), 26, z2); c.rotation.z = s * -0.55; }
  return g;
};
P.bigBen = function (x, z, s, night) {
  const g = this.grp(x, z, 0); g.scale.setScalar(s || 1);
  const t = PT.windows(3, 12, [200, 180, 140], ["#ffd88a"], 0.5, 23), stone = this.M({ map: t, emissive: 0xffffff, emap: t, ei: night ? 0.35 : 0.02, roughness: 0.8 }), roof = this.M({ color: 0x2a3a3a, metalness: 0.4, roughness: 0.5 }), gold = this.M({ color: 0xc8a050, metalness: 0.8, roughness: 0.3 });
  gbox(g, 12, 70, 12, stone, 0, 35, 0); gbox(g, 14, 14, 14, gold, 0, 77, 0);
  const faceTex = PT.clock(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, f = new THREE.Mesh(new THREE.CircleGeometry(5.4, 32), this.M({ map: faceTex, emissive: 0xfff0c0, emap: faceTex, ei: night ? 1.1 : 0.15 })); f.position.set(Math.sin(a) * 7.06, 77, Math.cos(a) * 7.06); f.rotation.y = a; g.add(f); const r = new THREE.Mesh(new THREE.RingGeometry(5.4, 6.2, 32), gold); r.position.copy(f.position).multiplyScalar(1.001); r.position.y = 77; r.rotation.y = a; g.add(r); }
  gbox(g, 12, 9, 12, stone, 0, 88.5, 0); gcone(g, 9, 22, roof, 0, 104, 0, 4, Math.PI / 4); for (const [dx, dz] of [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]]) gcone(g, 1, 6, roof, dx, 96, dz, 6); gcyl(g, 0.3, 0.3, 8, gold, 0, 118, 0, 6);
  if (night) { const l = new THREE.PointLight(0xfff0c0, 40, 90, 1.5); l.position.set(0, 77, 14); g.add(l); }
  return g;
};
P.parliament = function (x, z, len, ry, night) {
  const t = PT.windows(Math.round(len / 3), 5, [196, 180, 138], ["#ffd88a", "#ffe9b8"], night ? 0.7 : 0.1, 29), m = this.M({ map: t, emissive: 0xffffff, emap: t, ei: night ? 0.45 : 0.03, roughness: 0.8 });
  this.box(len, 18, 12, m, x, 9, z, { ry, collide: true });
  const n = Math.round(len / 4); for (let i = 0; i <= n; i++) { const k = i / n - 0.5, px = x + Math.cos(ry || 0) * k * len, pz = z - Math.sin(ry || 0) * k * len; this.cone(0.6, 5 + (i % 3) * 2, this.M({ color: 0xa89a70 }), px, 20 + (i % 3), pz, 4); }
};
P.palace = function (x, z, len, ry) {
  const t = PT.windows(Math.round(len / 3.2), 4, [236, 230, 214], ["#ffe9b8"], 0.2, 31), m = this.M({ map: t, roughness: 0.7 });
  const g = this.grp(x, z, ry || 0); gbox(g, len, 20, 14, m, 0, 10, 0); gbox(g, len + 0.5, 1.4, 14.5, this.M({ color: 0xe8e0d0 }), 0, 20.7, 0);
  gbox(g, 22, 22, 15, m, 0, 11, 0.5); const ped = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 1, 3, 1), this.M({ color: 0xe8e0d0 })); ped.rotation.x = Math.PI / 2; ped.rotation.z = Math.PI / 2; ped.scale.set(0.35, 1, 1); ped.position.set(0, 24.5, 8); g.add(ped);
  for (let i = 0; i < 6; i++) gcyl(g, 0.8, 0.8, 18, this.M({ color: 0xf0ece0 }), -8 + i * 3.2, 9, 8.2, 12);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), this.M({ map: PT.flag("uk") })); flag.position.set(0, 30, 0.5); g.add(flag); gcyl(g, 0.1, 0.1, 8, this.M({ color: 0xc0c0c0 }), -2.1, 27, 0.5, 6);
  this.collider(x, z, len / 2, 8, ry); return g;
};
P.goldStatue = function (x, z, h) { const white = this.M({ color: 0xf0ece0, roughness: 0.6 }), gold = this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2, emissive: 0xffb000, ei: 0.15 }); this.cyl(5, 6, 2, white, x, 1, z, 24, { collide: true }); this.box(3, h, 3, white, x, 2 + h / 2, z, {}); const f = this.person({ coat: 0xffd166, skin: 0xffd166, hair: 0xffd166, trousers: 0xffd166, faces: false }); f.traverse(o => { if (o.isMesh) o.material = gold; }); f.scale.setScalar(1.6); f.position.set(x, 2 + h, z); this.scene.add(f); const w = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3, 3), gold); w.position.set(x + 0.8, 2 + h + 3.4, z); w.rotation.z = -0.4; this.scene.add(w); };
P.phoneBox = function (x, z, ry) { const red = this.M({ color: 0xc0202a, roughness: 0.4 }), g = this.grp(x, z, ry || 0); gbox(g, 1.2, 2.8, 1.2, red, 0, 1.4, 0); gbox(g, 1.3, 0.2, 1.3, red, 0, 2.9, 0); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), this.M({ color: 0x1a1a1a, emissive: 0xfff4d0, ei: 0.6 })); p.position.set(Math.sin(a) * 0.61, 2.6, Math.cos(a) * 0.61); p.rotation.y = a; g.add(p); } this.circle(x, z, 0.8); return g; };
P.bus = function (x, z, ry) { const red = this.M({ color: 0xc81e28, roughness: 0.4, metalness: 0.2 }), glass = this.M({ color: 0x1a2a3a, roughness: 0.1, metalness: 0.8 }), g = this.grp(x, z, ry || 0); gbox(g, 2.5, 4.2, 10, red, 0, 2.5, 0); for (const y of [2.1, 4.0]) { gbox(g, 2.55, 0.9, 9, glass, 0, y, 0); } for (const [wx, wz] of [[-1.25, -3.4], [1.25, -3.4], [-1.25, 3.4], [1.25, 3.4]]) { const w = gcyl(g, 0.55, 0.55, 0.4, this.M({ color: 0x111111 }), wx, 0.55, wz, 14); w.rotation.z = Math.PI / 2; } this.collider(x, z, 1.3, 5, ry); return g; };
P.guard = function (x, z, ry) { return this.addPerson("guard_" + Math.round(x * 10 + z), x, z, ry, { coat: 0xc81e28, trousers: 0x14141a, hat: "bearskin", skin: 0xf0d0b8, belt: 0xf4f4f4, faces: false }); };
P.fireworks = function (x, y, z, r) {
  const cols = [0xffd166, 0xff6ad5, 0x7fe3ff, 0xc9a1ff, 0x7bed9f], mats = cols.map(c => new THREE.SpriteMaterial({ map: this.dotTex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const bursts = []; for (let i = 0; i < 5; i++) { const pts = []; for (let k = 0; k < 24; k++) { const s = new THREE.Sprite(mats[i]); s.scale.setScalar(1.6); this.scene.add(s); pts.push({ s, v: new THREE.Vector3(hash(i, k) - 0.5, hash(k, i) - 0.5, hash(i + k, 3) - 0.5).normalize() }); } bursts.push({ pts, t: i * 0.5, cx: 0, cy: 0, cz: 0 }); }
  this.updaters.push(dt => { for (const b of bursts) { b.t += dt; if (b.t > 2.4) { b.t = 0; b.cx = x + (Math.random() - 0.5) * r * 2; b.cy = y + Math.random() * 20; b.cz = z + (Math.random() - 0.5) * r; } const k = Math.min(1, b.t / 1.2); for (const p of b.pts) { p.s.position.set(b.cx + p.v.x * 18 * k, b.cy + p.v.y * 18 * k - b.t * b.t * 2, b.cz + p.v.z * 18 * k); p.s.material.opacity = Math.max(0, 1 - b.t / 2.2); } } });
};

// ------------------------------------------------------------------ HAWAII AND HOLLYWOOD
P.surfShack = function (x, z, ry) { const g = this.grp(x, z, ry || 0), wood = this.M({ map: PT.wood(17), rx: 2 }), thatch = this.M({ color: 0xc8a860, roughness: 1 }); gbox(g, 6, 3, 4, wood, 0, 1.5, 0); const r = gcone(g, 5, 2.4, thatch, 0, 4.2, 0, 4, Math.PI / 4); r.scale.z = 0.8; for (let i = 0; i < 4; i++) { const b = gbox(g, 0.5, 2.6, 0.1, this.M({ color: [0xff6a3a, 0x1ab0c0, 0xffd166, 0x7bed9f][i] }), -2.2 + i * 1.4, 1.4, 2.1); b.rotation.x = -0.15; } this.collider(x, z, 3, 2.2, ry); return g; };
P.volcanoCone = function (x, z, r, h, smoke) { const m = this.mountain(x, z, r, h, { snow: false, color: 0x3a3430 }); if (smoke) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex.smoke || this.dotTex, color: 0x8a8580, transparent: true, opacity: 0.5, depthWrite: false })); s.position.set(x, h + 20, z); s.scale.set(70, 70, 1); this.scene.add(s); this.updaters.push(dt => { s.material.rotation += dt * 0.05; }); } return m; };
P.soundstage = function (x, z, w, d, ry, n) { const g = this.grp(x, z, ry || 0), wall = this.M({ color: 0xe8dcc0, roughness: 0.9 }); gbox(g, w, 12, d, wall, 0, 6, 0); const roof = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.6, w * 0.6, d, 16, 1, false, -Math.PI * 0.3, Math.PI * 0.6), this.M({ color: 0xd0c4a8 })); roof.rotation.x = Math.PI / 2; roof.rotation.y = Math.PI; roof.position.y = 12 - w * 0.6 * Math.cos(Math.PI * 0.3); g.add(roof); const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), this.M({ map: PT.sign(String(n || 7), "#1a1a22", "#ffd166", "900 180px sans-serif", 256, 256) })); sign.position.set(0, 8.5, d / 2 + 0.05); g.add(sign); gbox(g, 6, 5, 0.2, this.M({ color: 0x5a5a60, metalness: 0.4 }), 0, 2.5, d / 2 + 0.1); this.collider(x, z, w / 2, d / 2, ry); return g; };
P.bigSign = function (txt, x, y, z, w, ry, color) { const c = document.createElement("canvas"); c.width = 1024; c.height = 160; const g = c.getContext("2d"); g.fillStyle = color || "#ffffff"; g.font = "900 140px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 512, 88); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.156), new THREE.MeshStandardMaterial({ map: t, transparent: true, side: THREE.DoubleSide, roughness: 0.8 })); m.position.set(x, y, z); m.rotation.y = ry || 0; this.scene.add(m); return m; };
P.trailer = function (x, z, ry, color) { const g = this.grp(x, z, ry || 0); gbox(g, 3, 3, 8, this.M({ color: color || 0xf0ece0, metalness: 0.3, roughness: 0.4 }), 0, 1.9, 0); gbox(g, 3.05, 0.4, 8.05, this.M({ color: 0x8a2a2a }), 0, 1.4, 0); gbox(g, 0.1, 1.8, 0.9, this.M({ color: 0x3a3a44 }), 1.53, 1.6, 2); for (const wz of [-2, 2]) { const w = gcyl(g, 0.5, 0.5, 3.2, this.M({ color: 0x111111 }), 0, 0.5, wz, 12); w.rotation.z = Math.PI / 2; } this.collider(x, z, 1.6, 4, ry); return g; };
P.westernFront = function (x, z, ry, name, color) { const g = this.grp(x, z, ry || 0), wood = this.M({ map: PT.wood(23), rx: 2, color: color || 0xc89a6a }); gbox(g, 8, 7, 0.4, wood, 0, 3.5, 0); gbox(g, 8, 0.3, 2.5, wood, 0, 3.2, 1.2); for (const s of [-1, 1]) gcyl(g, 0.12, 0.12, 3.2, wood, s * 3.8, 1.6, 2.3, 6); const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.1), this.M({ map: PT.sign(name, "#f0e0c0", "#3a1a0a", "900 60px serif", 512, 112) })); sign.position.set(0, 5.6, 0.25); g.add(sign); gbox(g, 1.6, 2.4, 0.1, this.M({ color: 0x3a2a1a }), 0, 1.2, 0.25); this.collider(x, z, 4, 0.5, ry); return g; };
P.movieLight = function (x, z, ry) { const g = this.grp(x, z, ry || 0), m = this.M({ color: 0x2a2a30, metalness: 0.6 }); for (let k = 0; k < 3; k++) { const l = gbox(g, 0.06, 2.4, 0.06, m, Math.cos(k * TAU / 3) * 0.6, 1.1, Math.sin(k * TAU / 3) * 0.6); l.rotation.z = Math.cos(k * TAU / 3) * 0.25; } gcyl(g, 0.05, 0.05, 1.6, m, 0, 2.6, 0, 6); const lamp = gcyl(g, 0.6, 0.45, 0.8, m, 0, 3.4, 0.2, 14); lamp.rotation.x = 1.2; const lens = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), this.M({ color: 0xfff4d0, emissive: 0xfff0c0, ei: 1.2 })); lens.position.set(0, 3.25, 0.62); lens.rotation.x = -0.35; g.add(lens); this.circle(x, z, 0.8); return g; };

// ------------------------------------------------------------------ CANYON, PLAINS, FALLS, SWAMP
P.mesa = function (x, z, r, h, color) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 9), this.M({ color: color || 0xb05a34, roughness: 1 })); const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.88 + hash(i, x) * 0.24; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } m.geometry.computeVertexNormals(); m.position.set(x, h / 2 - 1, z); m.castShadow = true; m.receiveShadow = true; this.scene.add(m); for (let k = 1; k < 4; k++) { const band = new THREE.Mesh(new THREE.CylinderGeometry(r * (0.8 + 0.2 * (1 - k / 4)) + 0.3, r * (0.8 + 0.2 * (1 - k / 4)) + 0.3, 1.2, 9, 1, true), this.M({ color: 0xd88a54, roughness: 1 })); band.position.set(x, h * (1 - k / 4) - 1, z); this.scene.add(band); } return m; };
P.cornField = function (x, z, w, d) { const m = this.M({ color: 0x9aa03a, roughness: 1 }), geo = new THREE.ConeGeometry(0.3, 2.4, 5), n = Math.floor(w / 1.2) * Math.floor(d / 1.2), im = new THREE.InstancedMesh(geo, m, n), m4 = new THREE.Matrix4(); let k = 0; for (let i = 0; i < Math.floor(w / 1.2); i++) for (let j = 0; j < Math.floor(d / 1.2); j++) { m4.makeTranslation(x - w / 2 + i * 1.2 + hash(i, j) * 0.3, 1.2, z - d / 2 + j * 1.2 + hash(j, i) * 0.3); im.setMatrixAt(k++, m4); } im.castShadow = true; this.scene.add(im); this.box(w, 0.05, d, this.M({ color: 0x6a5a3a }), x, 0.02, z, {}); };
P.barn = function (x, z, ry) { const g = this.grp(x, z, ry || 0), red = this.M({ map: PT.wood(29), rx: 2, color: 0xb83a2a }), white = this.M({ color: 0xf0ece0 }); gbox(g, 12, 8, 16, red, 0, 4, 0); const roof = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 16.6, 3, 1), this.M({ color: 0x4a4a4a })); roof.rotation.x = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.scale.set(1, 1, 0.55); roof.position.y = 9.6; g.add(roof); gbox(g, 5, 6, 0.3, white, 0, 3, 8.1); for (const s of [-1, 1]) { const b = gbox(g, 0.3, 7.8, 0.35, white, s * 1.2, 3, 8.25); b.rotation.z = s * 0.66; } gbox(g, 2, 2, 0.3, this.M({ color: 0x2a1a0a }), 0, 7, 8.1); this.collider(x, z, 6, 8, ry); return g; };
P.silo = function (x, z, h) { const m = this.M({ color: 0xb8bcc0, metalness: 0.6, roughness: 0.4 }); this.cyl(3, 3, h, m, x, h / 2, z, 20, { collide: true }); const d = this.sphere(3, m, x, h, z, 20); d.scale.y = 0.6; };
P.windpump = function (x, z) { const g = this.grp(x, z, 0), m = this.M({ color: 0x6a6a6a, metalness: 0.6 }); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = gbox(g, 0.2, 12, 0.2, m, dx * 0.9, 6, dz * 0.9); l.rotation.z = -dx * 0.08; l.rotation.x = dz * 0.08; } const wheel = new THREE.Group(); wheel.position.set(0, 12.5, 0.6); g.add(wheel); for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.05), this.M({ color: 0xc0c4c8, metalness: 0.5 })); b.geometry.translate(0, 1.4, 0); b.rotation.z = i / 14 * TAU; wheel.add(b); } gbox(g, 0.1, 1.4, 2.6, m, 0, 12.5, -1.4); this.updaters.push(dt => { wheel.rotation.z += dt * 2; }); this.circle(x, z, 1.4); return g; };
P.twister = function (x, z, h) { const g = this.grp(x, z, 0), m = this.M({ color: 0x6a6a64, roughness: 1, transparent: true, opacity: 0.75 }); m.depthWrite = false; m.side = THREE.DoubleSide; const parts = []; for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(3 + i * 3.4, 1.5 + i * 3.4, h / 7, 20, 1, true), m); c.position.y = (i + 0.5) * h / 7; g.add(c); parts.push(c); } this.updaters.push(dt => { parts.forEach((c, i) => { c.rotation.y += dt * (2.5 - i * 0.2); c.position.x = Math.sin(this.t * 0.8 + i * 0.5) * i * 0.8; }); }); return g; };
P.falls = function (x, z, r, h) {
  const g = this.grp(x, z, 0);
  const c = document.createElement("canvas"); c.width = 64; c.height = 256; const gg = c.getContext("2d"); const gr = gg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#e8fbff"); gr.addColorStop(1, "#8ad0e0"); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 256); for (let i = 0; i < 160; i++) { gg.fillStyle = "rgba(255,255,255,.5)"; gg.fillRect(hash(i, 1) * 64, hash(i, 2) * 256, 1, 24); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 1); this.updaters.push(dt => { t.offset.y -= dt * 0.7; });
  const f = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true, Math.PI * 0.6, Math.PI * 0.8), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); f.position.y = h / 2 - 1; g.add(f);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 30, 2, 48, 1, false, Math.PI * 0.6, Math.PI * 0.8), this.M({ color: 0x4a6a3a })); top.position.y = h; g.add(top);
  const mist = this.M({ color: 0xffffff, transparent: true, opacity: 0.35 }); mist.depthWrite = false; for (let i = 0; i < 14; i++) { const a = Math.PI * (0.65 + hash(i, 3) * 0.7), s = new THREE.Mesh(new THREE.SphereGeometry(6 + hash(i, 5) * 8, 10, 8), mist); s.position.set(Math.sin(a) * (r - 8), 2 + hash(i, 7) * 6, Math.cos(a) * (r - 8)); g.add(s); }
  return g;
};
P.helicopter = function (x, z, ry, color) { const g = this.grp(x, z, ry || 0, 0), body = this.M({ color: color || 0xe03a2a, metalness: 0.3, roughness: 0.4 }), glass = this.M({ color: 0x1a2a3a, metalness: 0.8, roughness: 0.1 }); const b = gsph(g, 1.4, body, 0, 1.6, 0, 16); b.scale.set(1, 0.9, 1.4); const c = gsph(g, 1.1, glass, 0, 1.8, -1.0, 16); c.scale.set(0.9, 0.8, 0.8); gbox(g, 0.4, 0.4, 5, body, 0, 1.9, 3.2); gbox(g, 0.1, 1.2, 0.8, body, 0, 2.4, 5.6); for (const s of [-1, 1]) gbox(g, 0.1, 0.1, 3.4, this.M({ color: 0x2a2a2a }), s * 1.0, 0.2, 0); const rot = new THREE.Group(); rot.position.y = 3.1; g.add(rot); for (let i = 0; i < 2; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 9), this.M({ color: 0x2a2a2a })); bl.rotation.y = i * Math.PI / 2; rot.add(bl); } this.updaters.push(dt => { rot.rotation.y += dt * 0.6; }); this.circle(x, z, 2); return g; };
P.bigPlane = function (x, z, ry) { const g = this.grp(x, z, ry || 0), body = this.M({ color: 0xe8ecf0, metalness: 0.4, roughness: 0.4 }), stripe = this.M({ color: 0x2a5ab0 }); const f = new THREE.Mesh(new THREE.CapsuleGeometry(1.8, 18, 8, 16), body); f.rotation.x = Math.PI / 2; f.position.y = 3.2; g.add(f); gbox(g, 3.7, 0.5, 20, stripe, 0, 3.0, 0); gbox(g, 30, 0.4, 3.6, body, 0, 4.0, 0); gbox(g, 0.4, 5, 3, body, 0, 6.6, 9); gbox(g, 10, 0.3, 2.4, body, 0, 4.4, 9.4); for (const s of [-1, 1]) for (const d of [6, 11]) { const e = gcyl(g, 0.7, 0.7, 2.4, this.M({ color: 0x5a6068 }), s * d, 3.4, -0.6, 12); e.rotation.x = Math.PI / 2; } const rd = gsph(g, 1.6, this.M({ color: 0x3a3a44 }), 0, 1.3, 2, 14); rd.scale.set(1, 0.4, 1.6); for (const [wx, wz] of [[0, -7], [-2.4, 1], [2.4, 1]]) gcyl(g, 0.5, 0.5, 0.4, this.M({ color: 0x111111 }), wx, 0.5, wz, 12).rotation.z = Math.PI / 2; this.collider(x, z, 3, 11, ry); this.collider(x, z, 15, 2, ry); return g; };
P.dish = function (x, z, s, ry) { const g = this.grp(x, z, ry || 0), m = this.M({ color: 0xf0f0f0, roughness: 0.4, metalness: 0.2 }); gcyl(g, 0.5 * s, 0.8 * s, 4 * s, this.M({ color: 0x8a8a8a }), 0, 2 * s, 0, 10); const d = gsph(g, 3 * s, m, 0, 5 * s, 0, 20, Math.PI / 2); d.rotation.x = -Math.PI / 2 - 0.7; gcyl(g, 0.08 * s, 0.08 * s, 3 * s, this.M({ color: 0x8a8a8a }), 0, 6.4 * s, 1 * s, 6).rotation.x = -0.7; this.circle(x, z, 1.2 * s); return g; };
P.swampCypress = function (x, z, h) { this.cyl(0.35, 1.1, h, this.M({ color: 0x6a5a44 }), x, h / 2, z, 8, { collide: true }); const top = this.sphere(1, this.M({ color: 0x5a7a3a, roughness: 1 }), x, h + 0.5, z, 8); top.scale.set(4, 2, 4); const moss = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4, 6, 1, true), this.M({ color: 0x9aa08a, roughness: 1 })); moss.material.side = THREE.DoubleSide; moss.rotation.x = Math.PI; moss.position.set(x + 1.2, h - 1.8, z); this.scene.add(moss); };
P.boardwalk = function (x0, z0, x1, z1) { const len = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0), m = this.M({ map: PT.wood(31), rx: len / 3, ry: 1 }); this.box(len, 0.25, 2.4, m, (x0 + x1) / 2, 0.45, (z0 + z1) / 2, { ry }); for (let i = 0; i <= len / 3; i++) { const k = i * 3 / len; for (const s of [-1, 1]) this.cyl(0.1, 0.1, 1.4, m, x0 + (x1 - x0) * k - Math.sin(ry) * s * 1.1, 0.5, z0 + (z1 - z0) * k - Math.cos(ry) * s * 1.1, 6); } };
P.gator = function (x, z, ry) { const g = this.grp(x, z, ry || 0, 0.05), m = this.M({ color: 0x3a4a2a, roughness: 0.8 }); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 3, 4, 10), m); b.rotation.x = Math.PI / 2; b.scale.set(1.3, 1, 0.5); g.add(b); for (const s of [-1, 1]) gsph(g, 0.12, this.M({ color: 0xe0e040, emissive: 0x606000, ei: 0.5 }), s * 0.2, 0.32, -1.6, 8); this.updaters.push(() => { g.position.y = 0.05 + Math.sin(this.t * 0.8 + x) * 0.04; }); return g; };

// ------------------------------------------------------------------ HAVANA AND COSTA RICA
P.seawall = function (x0, x1, z) { const m = this.M({ color: 0xd8d0c0, roughness: 0.9 }); this.box(x1 - x0, 1.1, 1.2, m, (x0 + x1) / 2, 0.55, z, { collide: true }); };
P.jungleTree = function (x, z, h) { this.cyl(0.5, 0.9, h, this.M({ color: 0x5a4a34 }), x, h / 2, z, 8, { collide: true }); const a = this.sphere(1, this.M({ color: 0x2a6a2a, roughness: 1 }), x, h, z, 10); a.scale.set(6, 3.4, 6); const b = this.sphere(1, this.M({ color: 0x3a7a2a, roughness: 1 }), x + 2.5, h * 0.72, z - 1, 8); b.scale.set(3.4, 2, 3.4); for (let i = 0; i < 3; i++) { const v = this.cyl(0.04, 0.04, h * 0.6, this.M({ color: 0x3a5a2a }), x - 2 + i * 2, h * 0.65, z + 1.5, 4); } };
P.sloth = function (x, y, z) { const g = this.grp(x, z, 0, y), fur = this.M({ color: 0x9a7a5a, roughness: 1 }); const b = gsph(g, 0.5, fur, 0, 0, 0, 10); b.scale.set(1, 0.8, 1.3); const h = gsph(g, 0.3, this.M({ color: 0xe8d8b8 }), 0, -0.1, -0.6, 10); for (const s of [-1, 1]) { const arm = gbox(g, 0.12, 0.9, 0.12, fur, s * 0.35, 0.5, s * 0.3); } this.updaters.push(() => { g.rotation.z = Math.sin(this.t * 0.3) * 0.1; }); return g; };
P.factory = function (x, z, ry, color) { const g = this.grp(x, z, ry || 0), wall = this.M({ color: color || 0x8a8a90, metalness: 0.4, roughness: 0.5 }); gbox(g, 14, 9, 10, wall, 0, 4.5, 0); for (const s of [-1, 1]) { gcyl(g, 1.1, 1.3, 16, this.M({ color: 0xc0c4c8, metalness: 0.6 }), s * 4, 8, -2, 14); this.steam(x + Math.cos(ry || 0) * s * 4 + Math.sin(ry || 0) * 2, 16.5, z - Math.sin(ry || 0) * s * 4 + Math.cos(ry || 0) * -2, 3, 0.8, 0xf4f8ff); } gbox(g, 4, 5, 0.2, this.M({ color: 0x4a4a54 }), 0, 2.5, 5.05); this.collider(x, z, 7, 5, ry); return g; };

// ------------------------------------------------------------------ THE EYE AND WASHINGTON
P.maelstrom = function (x, z, s) {
  const g = this.grp(x, z, 0); g.scale.setScalar(s || 1);
  const steel = this.M({ color: 0x4a5058, metalness: 0.7, roughness: 0.3 }), glow = this.M({ color: 0x7fe3ff, emissive: 0x3ab0ff, ei: 1.6 });
  gcyl(g, 6, 8, 4, steel, 0, 2, 0, 24); gcyl(g, 1.6, 2.2, 22, steel, 0, 13, 0, 16);
  const rings = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(7 + i * 2.5, 0.5, 8, 40), i === 1 ? glow : steel); r.position.y = 10 + i * 5; r.rotation.x = Math.PI / 2 + (i - 1) * 0.3; g.add(r); rings.push(r); }
  const core = gsph(g, 2.4, glow, 0, 25, 0, 20); const l = new THREE.PointLight(0x7fe3ff, 30, 60, 1.4); l.position.y = 25; g.add(l);
  this.updaters.push(dt => { rings.forEach((r, i) => { r.rotation.z += dt * (1 + i * 0.6) * (i % 2 ? -1 : 1); }); core.scale.setScalar(1 + Math.sin(this.t * 6) * 0.08); l.intensity = 24 + Math.sin(this.t * 13) * 8; });
  this.collider(x, z, 8 * (s || 1), 8 * (s || 1));
  return g;
};
P.stormWall = function (x, z, r, h) { const m = this.M({ color: 0x3a4454, roughness: 1, transparent: true, opacity: 0.92 }); m.side = THREE.BackSide; m.depthWrite = false; const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.3, h, 48, 1, true), m); w.position.set(x, h / 2 - 5, z); this.scene.add(w); const flashes = []; for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xdff0ff, 0, 200, 1.2); l.position.set(x + Math.cos(i * 2.1) * r * 0.8, 40, z + Math.sin(i * 2.1) * r * 0.8); this.scene.add(l); flashes.push(l); } this.updaters.push(() => { for (const [i, l] of flashes.entries()) l.intensity = ((this.t * 0.7 + i * 0.37) % 1) < 0.04 ? 60 : 0; }); this.updaters.push(dt => { w.rotation.y += dt * 0.05; }); };
P.whiteHouse = function (x, z, ry) {
  const g = this.grp(x, z, ry || 0), t = PT.windows(11, 3, [240, 238, 232], ["#ffe9b8"], 0.2, 41), m = this.M({ map: t, roughness: 0.6 }), white = this.M({ color: 0xf4f2ec, roughness: 0.5 });
  gbox(g, 34, 13, 16, m, 0, 6.5, 0); gbox(g, 34.6, 1.2, 16.6, white, 0, 13.6, 0); for (let i = 0; i < 12; i++) gbox(g, 0.6, 0.8, 0.6, white, -16 + i * 2.9, 14.6, 8);
  // the round portico with its columns
  const por = gcyl(g, 6, 6, 1, white, 0, 12.6, 8.5, 24, Math.PI); for (let i = 0; i < 6; i++) { const a = Math.PI * (0.1 + i * 0.16); gcyl(g, 0.45, 0.45, 12, white, Math.cos(a) * 5.2, 6, 8.5 + Math.sin(a) * 5.2, 12); }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), this.M({ map: PT.flag("us") })); flag.position.set(1.9, 19, 0); g.add(flag); gcyl(g, 0.08, 0.08, 7, this.M({ color: 0xc0c0c0 }), 0, 17, 0, 6);
  this.collider(x, z, 17, 9, ry); return g;
};
P.monumentObelisk = function (x, z, h) { const m = this.M({ color: 0xece8e0, roughness: 0.6 }); const o = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.6, h, 4), m); o.rotation.y = Math.PI / 4; o.position.set(x, h / 2, z); o.castShadow = true; this.scene.add(o); const tip = new THREE.Mesh(new THREE.ConeGeometry(3.3, 5, 4), m); tip.rotation.y = Math.PI / 4; tip.position.set(x, h + 2.5, z); this.scene.add(tip); const l = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), this.M({ color: 0xff3a3a, emissive: 0xff2a2a, ei: 3 })); l.position.set(x, h - 2, z + 3.4); this.scene.add(l); this.collider(x, z, 3.4, 3.4); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; this.cyl(0.06, 0.06, 8, this.M({ color: 0xc0c0c0 }), x + Math.cos(a) * 9, 4, z + Math.sin(a) * 9, 4); } };
P.capitolDome = function (x, z, s) { const g = this.grp(x, z, 0); g.scale.setScalar(s || 1); const w = this.M({ color: 0xf0ece4, roughness: 0.6 }); gbox(g, 110, 22, 30, this.M({ map: PT.windows(16, 3, [240, 236, 228], ["#ffe9b8"], 0.15, 43), roughness: 0.7 }), 0, 11, 0); gbox(g, 36, 10, 36, w, 0, 27, 0); gcyl(g, 13, 13, 12, w, 0, 38, 0, 28); for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; gcyl(g, 0.6, 0.6, 11, w, Math.cos(a) * 14, 38, Math.sin(a) * 14, 8); } const d = gsph(g, 13, w, 0, 44, 0, 28, Math.PI / 2); d.scale.y = 1.2; gcyl(g, 2, 2, 7, w, 0, 62, 0, 14); gcyl(g, 0.5, 1, 5, this.M({ color: 0x5a5a50 }), 0, 68, 0, 8); return g; };
P.lincoln = function (x, z, ry) { const g = this.grp(x, z, ry || 0), w = this.M({ color: 0xece8e0, roughness: 0.6 }); gbox(g, 30, 3, 20, w, 0, 1.5, 0); gbox(g, 28, 2, 18, w, 0, 14, 0); gbox(g, 22, 3, 12, w, 0, 16.5, 0); for (let i = 0; i < 12; i++) { gcyl(g, 0.7, 0.8, 10, w, -12 + i * 2.2, 8, 8.4, 12); gcyl(g, 0.7, 0.8, 10, w, -12 + i * 2.2, 8, -8.4, 12); } gbox(g, 20, 10, 12, this.M({ color: 0xd8d4cc }), 0, 8, 0); for (let i = 0; i < 6; i++) gbox(g, 30 - i, 0.5, 2, w, 0, 0.25 + i * 0.5, 11 + i * 0.9); this.collider(x, z, 15, 10, ry); return g; };
