// Building blocks for the Meltdown locations, added to the World so a scene
// can say this.house(...), this.rig(...), this.penguins(...). Each piece is a
// few primitives with the materials the sky already lights well.
import { World, SCENES, THREE, PT } from "./world.js";
import { TAU } from "./ui.js";
import { Run } from "./run.js";

const P = World.prototype;
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const stripes = (a, b, n) => { const c = document.createElement("canvas"); c.width = 64; c.height = 64; const g = c.getContext("2d"); for (let i = 0; i < (n || 8); i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 64 / (n || 8), 0, 64 / (n || 8), 64); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };
export { stripes };
// light painted planks, so a house takes the colour it is given
const plankCache = {};
export function planks(seed) {
  if (plankCache[seed]) return plankCache[seed];
  const c = document.createElement("canvas"); c.width = 128; c.height = 128; const g = c.getContext("2d");
  g.fillStyle = "#f2f0ec"; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) { g.fillStyle = "rgba(0,0,0,.16)"; g.fillRect(0, y, 128, 2); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, y + 2, 128, 1); for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + hash(i, y + seed) * 0.05})`; g.fillRect(hash(y, i + seed) * 128, y + 3, 30, 12); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(2, 2);
  return (plankCache[seed] = t);
}

// a wooden or plastered house with a pitched roof, a door and lit windows
P.house = function (x, z, w, d, h, color, o) {
  o = o || {}; const ry = o.ry || 0, S = this.scene;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  const wall = o.tex ? this.M({ map: o.tex, rx: 1, ry: 1 }) : this.M({ map: o.plaster ? PT.plaster(o.plaster, (x * 7 + z) | 0) : planks((x * 3 + z) | 0), color: o.plaster ? 0xffffff : color, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall); body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  if (o.flat) { const r = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4), this.M({ color: o.roof || 0x3a3a40 })); r.position.y = h + 0.15; g.add(r); }
  else {
    const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.35, 0); sh.lineTo(w / 2 + 0.35, 0); sh.lineTo(0, (o.pitch || 0.45) * w); sh.closePath();
    const rg = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }); rg.translate(0, 0, -(d + 0.6) / 2);
    const roof = new THREE.Mesh(rg, this.M({ color: o.roof || 0x2a2a30, roughness: 0.7 })); roof.position.y = h; roof.castShadow = true; g.add(roof);
    if (o.snow) { const sr = new THREE.Mesh(rg, this.M({ color: 0xf4f8ff, roughness: 1 })); sr.position.y = h + 0.12; sr.scale.set(0.96, 0.9, 0.98); g.add(sr); }
  }
  const lit = o.lit === undefined ? 0.4 : o.lit, winM = this.M({ color: 0x1a2430, emissive: 0xffd88a, ei: lit, roughness: 0.2, metalness: 0.4 }), frame = this.M({ color: 0xf4f0e8 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.1), this.M({ color: o.doorColor || 0x3a2a1a })); door.position.set(0, 1.0, d / 2 + 0.04); g.add(door);
  const nWin = Math.max(1, Math.floor(w / 2.6)), floors = Math.max(1, Math.floor(h / 3));
  for (let f = 0; f < floors; f++) for (let i = 0; i < nWin; i++) {
    const wx = -w / 2 + (i + 0.5) * w / nWin; if (f === 0 && Math.abs(wx) < 0.9) continue;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.08), frame); fr.position.set(wx, 1.6 + f * 3, d / 2 + 0.03); g.add(fr);
    const wi = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.1), winM); wi.position.set(wx, 1.6 + f * 3, d / 2 + 0.05); g.add(wi);
  }
  if (o.collide !== false) this.collider(x, z, w / 2, d / 2, ry);
  return g;
};
// a corrugated steel shed or site cabin
P.shed = function (x, z, w, d, h, color, o) {
  o = o || {};
  const m = this.M({ tex: "steel", rx: w / 3, ry: h / 3, color: color || 0xb0b8c0, metalness: 0.5, roughness: 0.5 });
  const b = this.box(w, h, d, m, x, h / 2, z, { collide: true, ry: o.ry });
  this.box(w + 0.3, 0.25, d + 0.3, this.M({ color: 0x3a3f48, metalness: 0.4 }), x, h + 0.12, z, { ry: o.ry });
  if (o.sign) this.sign(o.sign, Math.min(w * 0.8, 5), 0.8, x + Math.sin(o.ry || 0) * (d / 2 + 0.06), h - 0.7, z + Math.cos(o.ry || 0) * (d / 2 + 0.06), o.ry || 0, o.signBg || "#10233d", o.signFg || "#ffd166", 0.6);
  return b;
};
// a lattice tower: rig derricks, radio masts, sentry towers
P.lattice = function (x, z, h, base, color, o) {
  o = o || {}; const m = this.M({ color: color || 0xd0a020, metalness: 0.5, roughness: 0.5 }), S = this.scene;
  const top = base * (o.taper === undefined ? 0.35 : o.taper);
  const pt = (sx, sz, y) => { const k = y / h, r = base + (top - base) * k; return new THREE.Vector3(x + sx * r, y, z + sz * r); };
  const beam = (a, b, t) => { const d = b.clone().sub(a), len = d.length(); const c = new THREE.Mesh(new THREE.CylinderGeometry(t, t, len, 5), m); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); c.castShadow = true; S.add(c); };
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of corners) beam(pt(sx, sz, 0), pt(sx, sz, h), 0.12);
  const n = Math.max(3, Math.round(h / 3));
  for (let i = 0; i <= n; i++) { const y = i * h / n; for (let k = 0; k < 4; k++) { const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4]; beam(pt(ax, az, y), pt(bx, bz, y), 0.06); if (i < n) beam(pt(ax, az, y), pt(bx, bz, y + h / n), 0.05); } }
  this.collider(x, z, base, base);
  return pt(0, 0, h);
};
// Kaldera's drilling rig: a derrick on a platform, steam and the flame logo
P.rig = function (x, z, o) {
  o = o || {}; const s = o.scale || 1, dark = this.M({ tex: "gunmetal", rx: 2, ry: 2, color: 0x6a6a70, metalness: 0.7, roughness: 0.4 });
  this.box(10 * s, 2 * s, 10 * s, dark, x, s, z, { collide: true });
  for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) this.cyl(0.4 * s, 0.4 * s, 2 * s, this.M({ color: 0xe05a10 }), x + dx * s, s, z + dz * s, 8);
  const top = this.lattice(x, z, 22 * s, 3.4 * s, 0xe05a10);
  this.box(3 * s, 3 * s, 3 * s, this.M({ color: 0x2a2a30, metalness: 0.6 }), x + 3.8 * s, 3.5 * s, z + 2 * s, {});
  this.flameLogo(x, 6 * s, z + 5.05 * s, 2.4 * s);
  this.steam(top.x, top.y, top.z, 5 * s, 0.35);
  this.light(0xff6a1a, 8, x, 4 * s, z + 6 * s, 20);
  return top;
};
// the Kaldera Heating flame, glowing
P.flameLogo = function (x, y, z, size, ry) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  g.fillStyle = "#1a1a1e"; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill(); g.strokeStyle = "#ff8a2a"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "#ff6a1a"; g.beginPath(); g.moveTo(64, 14); g.bezierCurveTo(112, 58, 98, 114, 64, 114); g.bezierCurveTo(30, 114, 16, 58, 64, 14); g.fill();
  g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(64, 56); g.bezierCurveTo(88, 80, 82, 108, 64, 108); g.bezierCurveTo(46, 108, 40, 80, 64, 56); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 24), this.M({ map: t, emissive: 0xffffff, emap: t, ei: 0.8, transparent: true }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; this.scene.add(m); return m;
};
// rising steam or smoke, from a handful of sprites that recycle
P.steam = function (x, y, z, size, rate, color) {
  const n = 8, sp = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex.smoke || this.dotTex, color: color || 0xffffff, transparent: true, opacity: 0, depthWrite: false })); this.scene.add(s); sp.push({ s, t: i / n }); }
  this.updaters.push(dt => { for (const p of sp) { p.t += dt * (rate || 0.3); if (p.t > 1) p.t -= 1; const k = p.t; p.s.position.set(x + Math.sin(k * 5 + p.t) * size * 0.2, y + k * size * 2.5, z); p.s.scale.setScalar(size * (0.4 + k * 1.2)); p.s.material.opacity = Math.sin(k * Math.PI) * 0.55; p.s.material.rotation = k * 2; } });
};
// a dock-side gantry crane
P.gantry = function (x, z, ry, color) {
  const m = this.M({ color: color || 0xe0b020, metalness: 0.5, roughness: 0.45 }), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; this.scene.add(g);
  const add = (w, h, d, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); b.castShadow = true; g.add(b); };
  for (const sx of [-4, 4]) for (const sz of [-3, 3]) add(0.8, 16, 0.8, sx, 8, sz);
  add(9, 1, 0.8, 0, 16, -3); add(9, 1, 0.8, 0, 16, 3); add(1, 1.2, 26, 0, 17, 6); add(3, 3, 3, 0, 18.5, -2);
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 10, 4), this.M({ color: 0x222222 })); hook.position.set(0, 12, 14); g.add(hook);
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 6), this.M({ map: this.T("container", 1, 1), color: 0xc0392b })); box.position.set(0, 6, 14); box.castShadow = true; g.add(box);
  this.updaters.push(() => { box.position.y = 6 + Math.sin(this.t * 0.4) * 2; hook.position.y = 11 + Math.sin(this.t * 0.4) * 1; hook.scale.y = 1 - Math.sin(this.t * 0.4) * 0.2; });
  this.collider(x, z, 5, 4, ry);
};
// a wooden pier on posts
P.pier = function (x, z, w, len, ry) {
  const wood = this.M({ map: PT.wood(9), rx: 1, ry: len / 4 }), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; this.scene.add(g);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, len), wood); deck.position.set(0, 0.55, -len / 2); deck.receiveShadow = true; g.add(deck);
  for (let i = 0; i <= len; i += 3) for (const sx of [-w / 2, w / 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.4, 6), this.M({ color: 0x4a3a2a })); p.position.set(sx, 0.2, -i); g.add(p); }
  return g;
};
// a small fishing or harbour boat
P.boat = function (x, z, ry, color, o) {
  o = o || {}; const g = new THREE.Group(); g.position.set(x, o.y === undefined ? 0 : o.y, z); g.rotation.y = ry || 0; this.scene.add(g);
  const sh = new THREE.Shape(), w = o.w || 1.3, L = o.len || 6; sh.moveTo(-w, -L / 2); sh.lineTo(w, -L / 2); sh.lineTo(w, L / 2 - 1.8); sh.quadraticCurveTo(w * 0.8, L / 2 - 0.2, 0, L / 2 + 0.4); sh.quadraticCurveTo(-w * 0.8, L / 2 - 0.2, -w, L / 2 - 1.8); sh.closePath();
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 1.0, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 2 }); hg.rotateX(-Math.PI / 2);
  const hull = new THREE.Mesh(hg, this.M({ color: color || 0x2a6ab0, roughness: 0.5 })); hull.position.y = -0.4; hull.castShadow = true; g.add(hull);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(w * 1.2, 1.2, 1.6), this.M({ color: 0xf4f4f0 })); cab.position.set(0, 1.2, 0.8); cab.castShadow = true; g.add(cab);
  if (o.bob !== false) this.updaters.push(() => { g.position.y = (o.y || 0) + Math.sin(this.t * 1.2 + x) * 0.08; g.rotation.z = Math.sin(this.t * 0.9 + z) * 0.03; });
  this.circle(x, z, Math.max(w, L / 2) * 0.8);
  return g;
};
// a big ship at the quay: hull, bridge, funnel and a deck of containers
P.ship = function (x, z, ry, hullColor, o) {
  o = o || {}; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; this.scene.add(g);
  const add = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const L = o.len || 40;
  add(9, 5, L, this.M({ color: hullColor || 0x3a1a1a, metalness: 0.3, roughness: 0.6 }), 0, 1.5, 0); add(9.1, 0.5, L, this.M({ color: 0xe8e8e8 }), 0, 4.2, 0);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 5, 3, 1, false, 0, Math.PI), this.M({ color: hullColor || 0x3a1a1a })); bow.rotation.y = -Math.PI / 2; bow.scale.set(1, 1, 1.6); bow.position.set(0, 1.5, -L / 2); g.add(bow);
  add(8, 6, 6, this.M({ color: 0xf0f0ec }), 0, 7.5, L / 2 - 5); add(8.4, 0.4, 7, this.M({ color: 0x2a2a30 }), 0, 10.7, L / 2 - 5);
  add(1.8, 5, 1.8, this.M({ color: o.funnel || 0xe05a10 }), 0, 12.5, L / 2 - 3);
  const cols = [0xc0392b, 0x2a6ab0, 0x2a8a4a, 0xe0a020, 0x8a8a8a];
  if (o.cargo !== false) for (let i = 0; i < Math.floor((L - 14) / 6.2); i++) for (let k = -1; k <= 1; k += 2) for (let lv = 0; lv < 2; lv++) add(3.6, 2.5, 6, this.M({ map: this.T("container", 1, 1), color: cols[(i * 3 + k + lv * 2 + 5) % 5] }), k * 1.9, 5.8 + lv * 2.5, -L / 2 + 6 + i * 6.2);
  if (o.logo) this.flameLogo(x + Math.sin(ry || 0) * (L / 2 - 1.9), 12.5, z + Math.cos(ry || 0) * (L / 2 - 1.9), 1.6, ry || 0);
  this.collider(x, z, 4.5, L / 2 + 2, ry);
  return g;
};
// a vehicle waiting at a chase station, borrowed from the chase engine
P.ride = function (kind, x, z, ry, body, trim) {
  // built by the chase engine itself (with run2.js's rides as well), parked here
  const kit = Object.assign(Object.create(Run.prototype), { w: this }), floats = ["speedboat", "jetboat", "jetski", "watertaxi", "airboat", "raft", "surfboard"].includes(kind);
  const g = Run.prototype.buildRide.call(kit, kind, body || 0x16324f, trim || 0x7fe3ff, null);
  g.position.set(x, floats ? 0.1 : 0, z); g.rotation.y = ry || 0; this.scene.add(g);
  if (floats) this.updaters.push(() => { g.position.y = 0.1 + Math.sin(this.t * 1.4) * 0.06; });
  this.circle(x, z, 1.4); return g;
};
// a market stall with a striped awning and goods on the counter
P.stall = function (x, z, ry, a, b, goods) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; this.scene.add(g);
  const wood = this.M({ map: PT.wood(4) }); const c = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 1.2), wood); c.position.y = 0.5; c.castShadow = true; g.add(c);
  for (const sx of [-1.2, 1.2]) for (const sz of [-0.5, 0.5]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), wood); p.position.set(sx, 1.25, sz); g.add(p); }
  const aw = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 1.8), this.M({ map: stripes(a || "#e03a3a", b || "#f4f0e0"), side: THREE.DoubleSide })); aw.position.set(0, 2.5, 0.2); aw.rotation.x = 0.2; g.add(aw);
  const gc = goods || [0xff7a1a, 0xffd23f, 0x7bed9f, 0xe03a3a];
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), this.M({ color: gc[i % gc.length], roughness: 0.5 })); s.position.set(-1.05 + (i % 5) * 0.52, 1.12, (i < 5 ? -0.25 : 0.2)); g.add(s); }
  this.collider(x, z, 1.4, 0.8, ry);
  return g;
};
// round tanks, domes and a flat circle of water
P.tank = function (x, z, r, h, color) { const m = this.M({ tex: "steel", rx: 3, ry: 1, color: color || 0xe8e8e0, metalness: 0.5, roughness: 0.45 }); this.cyl(r, r, h, m, x, h / 2, z, 20, { collide: true }); this.cyl(r * 1.02, r * 1.02, 0.3, this.M({ color: 0x5a6070, metalness: 0.5 }), x, h, z, 20); this.lattice(x + r + 0.3, z, h, 0.2, 0x5a6070, { taper: 1 }); };
P.obsDome = function (x, z, r, color) {
  const m = this.M({ color: color || 0xf4f4f4, metalness: 0.3, roughness: 0.35 });
  this.cyl(r, r, r * 0.8, this.M({ color: 0xe0e0e0 }), x, r * 0.4, z, 24, { collide: true });
  const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 14, 0, TAU, 0, Math.PI / 2), m); d.position.set(x, r * 0.8, z); d.castShadow = true; this.scene.add(d);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(r * 0.35, r * 1.02, r * 2.02), this.M({ color: 0x1a1a24 })); slit.position.set(x, r * 1.1, z); slit.rotation.x = 0; this.scene.add(slit); slit.scale.set(1, 0.9, 1);
  return d;
};
// Kaldera's Inferno Engine: a drill tower in rings of fire
P.inferno = function (x, z, s, o) {
  o = o || {}; s = s || 1; const dark = this.M({ tex: "gunmetal", rx: 2, ry: 6, color: 0x4a4a52, metalness: 0.7, roughness: 0.4 }), hot = this.M({ color: 0xff6a1a, emissive: 0xff4a0a, ei: 2.4 });
  this.cyl(5 * s, 7 * s, 3 * s, dark, x, 1.5 * s, z, 20, { collide: true });
  this.cyl(2.6 * s, 3.6 * s, 34 * s, dark, x, 17 * s + 1.5 * s, z, 16);
  const rings = []; for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry((3.8 - i * 0.22) * s, 0.35 * s, 8, 28), hot); r.rotation.x = Math.PI / 2; r.position.set(x, (6 + i * 6) * s, z); this.scene.add(r); rings.push(r); }
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4; const leg = this.box(0.8 * s, 12 * s, 0.8 * s, dark, x + Math.cos(a) * 6 * s, 5 * s, z + Math.sin(a) * 6 * s); leg.rotation.z = Math.cos(a) * 0.35; leg.rotation.x = -Math.sin(a) * 0.35; }
  this.flameLogo(x, 10 * s, z + 3.4 * s, 3 * s);
  const l = this.light(0xff5a14, 30 * s, x, 8 * s, z + 6 * s, 60 * s);
  this.steam(x, 36 * s, z, 8 * s, 0.25, 0xd8d0c8);
  this.updaters.push(() => { rings.forEach((r, i) => { r.material.emissiveIntensity = 1.8 + Math.sin(this.t * 3 + i) * 0.8; }); l.intensity = 30 * s * (0.8 + Math.sin(this.t * 5) * 0.2); });
};
// strings of prayer flags or festival lanterns between two points
P.flagLine = function (x0, z0, x1, z1, h, cols, lanterns) {
  const n = Math.max(4, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.9)), cs = cols || [0x2a6ad0, 0xf4f4f4, 0xd03030, 0x2a9a4a, 0xe8c020];
  const ry = Math.atan2(x1 - x0, z1 - z0);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, Math.hypot(x1 - x0, z1 - z0), 4), this.M({ color: 0x3a3a3a })); rope.position.set((x0 + x1) / 2, h - 0.5, (z0 + z1) / 2); rope.rotation.set(Math.PI / 2, 0, 0); rope.rotation.order = "YXZ"; rope.rotation.y = ry; this.scene.add(rope);
  for (let i = 1; i < n; i++) {
    const k = i / n, sag = Math.sin(k * Math.PI) * 0.9, px = x0 + (x1 - x0) * k, pz = z0 + (z1 - z0) * k;
    if (lanterns) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), this.M({ color: cs[i % cs.length], emissive: cs[i % cs.length], ei: 1.4 })); l.scale.y = 1.3; l.position.set(px, h - sag - 0.3, pz); this.scene.add(l); }
    else { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.55), this.M({ color: cs[i % cs.length], side: THREE.DoubleSide, roughness: 1 })); f.position.set(px, h - sag - 0.3, pz); f.rotation.y = ry + Math.PI / 2; this.scene.add(f); }
  }
};
// penguins: standing about, a few of them waddling
P.penguin = function (x, z, ry, s) {
  s = s || 1; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; g.scale.setScalar(s); this.scene.add(g);
  const bm = this.matC(0x15161c, { r: 0.6 }), wm = this.matC(0xf4f4f4), om = this.matC(0xffa000), ym = this.matC(0xffd23f);
  const b = new THREE.Mesh(this.geoC("pg_b", () => new THREE.CapsuleGeometry(0.28, 0.45, 4, 10)), bm); b.position.y = 0.55; b.castShadow = true; g.add(b);
  const w = new THREE.Mesh(this.geoC("pg_w", () => new THREE.SphereGeometry(0.24, 10, 8)), wm); w.position.set(0, 0.5, 0.12); w.scale.set(1, 1.5, 0.7); g.add(w);
  const h = new THREE.Mesh(this.geoC("pg_h", () => new THREE.SphereGeometry(0.2, 10, 8)), bm); h.position.set(0, 1.02, 0.02); g.add(h);
  const k = new THREE.Mesh(this.geoC("pg_k", () => new THREE.ConeGeometry(0.06, 0.2, 6)), om); k.rotation.x = Math.PI / 2; k.position.set(0, 1.0, 0.24); g.add(k);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(this.geoC("pg_e", () => new THREE.SphereGeometry(0.035, 6, 4)), ym); e.position.set(sx * 0.09, 1.08, 0.16); g.add(e); const f = new THREE.Mesh(this.geoC("pg_f", () => new THREE.BoxGeometry(0.12, 0.04, 0.2)), om); f.position.set(sx * 0.1, 0.02, 0.08); g.add(f); const fl = new THREE.Mesh(this.geoC("pg_fl", () => new THREE.BoxGeometry(0.05, 0.4, 0.14)), bm); fl.position.set(sx * 0.3, 0.6, 0); fl.rotation.z = sx * 0.3; g.add(fl); }
  return g;
};
P.penguins = function (cx, cz, r, n, o) {
  o = o || {}; const list = [];
  for (let i = 0; i < n; i++) { const a = hash(i, cx) * TAU, d = Math.sqrt(hash(cz, i)) * r; const g = this.penguin(cx + Math.cos(a) * d, cz + Math.sin(a) * d, hash(i, 7) * TAU, 0.8 + hash(i, 3) * 0.5); list.push(g); }
  this.updaters.push(() => { list.forEach((g, i) => { g.rotation.z = Math.sin(this.t * 6 + i) * (i % 4 === 0 ? 0.12 : 0.02); if (i % 5 === 0) g.rotation.y += 0.004; }); });
  if (o.collide !== false) this.circle(cx, cz, r * 0.8);
  return list;
};
// four-legged friends: sled dogs, a moose, a yak
P.animal = function (kind, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; this.scene.add(g);
  const col = { dog: 0xd8d0c0, moose: 0x5a3a22, yak: 0x2a2018, donkey: 0x8a7a6a, horse: 0x6a4a2a }[kind] || 0x8a7a6a, m = this.M({ color: col, roughness: 1 }), s = { dog: 0.5, moose: 1.5, yak: 1.1, donkey: 0.9, horse: 1.2 }[kind] || 1;
  const add = (geo, px, py, pz, rx) => { const k = new THREE.Mesh(geo, m); k.position.set(px * s, py * s, pz * s); if (rx) k.rotation.x = rx; k.castShadow = true; g.add(k); return k; };
  add(new THREE.CapsuleGeometry(0.35 * s, 0.9 * s, 4, 8), 0, 1.0, 0, Math.PI / 2);
  for (const [lx, lz] of [[-0.22, -0.4], [0.22, -0.4], [-0.22, 0.4], [0.22, 0.4]]) add(new THREE.CylinderGeometry(0.08 * s, 0.07 * s, 0.8 * s, 6), lx, 0.4, lz);
  const head = add(new THREE.BoxGeometry(0.3 * s, 0.34 * s, 0.5 * s), 0, 1.35, 0.8);
  if (kind === "moose") for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.06 * s, 0.4 * s), this.M({ color: 0xc8b890 })); a.position.set(sx * 0.4 * s, 1.65 * s, 0.7 * s); a.rotation.z = sx * 0.3; g.add(a); }
  if (kind === "yak") for (const sx of [-1, 1]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.06 * s, 0.4 * s, 6), this.M({ color: 0xe8e0d0 })); hn.position.set(sx * 0.22 * s, 1.6 * s, 0.75 * s); hn.rotation.z = -sx * 0.8; g.add(hn); }
  if (kind === "dog") { const t = add(new THREE.CylinderGeometry(0.04, 0.02, 0.5 * s, 5), 0, 1.3, -0.7); t.rotation.x = -0.8; }
  this.updaters.push(() => { head.rotation.x = Math.sin(this.t * 0.8 + x) * 0.15; });
  this.circle(x, z, 0.9 * s);
  return g;
};
// a railway: sleepers and rails between two points, and a train on it
P.rails = function (x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), g = new THREE.Group(); g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); g.rotation.y = ry; this.scene.add(g);
  const wood = this.M({ color: 0x4a3a2a }), steel = this.M({ color: 0x8a8a90, metalness: 0.8, roughness: 0.3 });
  for (let d = -len / 2; d < len / 2; d += 0.8) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.3), wood); s.position.set(0, 0.06, d); g.add(s); }
  for (const sx of [-0.72, 0.72]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, len), steel); r.position.set(sx, 0.18, 0); g.add(r); }
};
P.train = function (x, z, ry, cars, o) {
  o = o || {}; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; this.scene.add(g);
  const body = this.M({ map: o.tex ? this.T(o.tex, 2, 1) : null, color: o.color || 0xc0c4cc, metalness: 0.6, roughness: 0.35 }), dark = this.M({ color: 0x1a1a1e }), win = this.M({ color: 0x1a2430, emissive: 0xffd88a, ei: 0.5, metalness: 0.6, roughness: 0.2 });
  const L = o.len || 12;
  for (let i = 0; i < cars; i++) {
    const cz = -i * (L + 1);
    const c = new THREE.Mesh(new THREE.BoxGeometry(3, 3.2, L), body); c.position.set(0, 2.2, cz); c.castShadow = true; g.add(c);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, L, 12, 1, false, 0, Math.PI), body); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI / 2; r.rotation.order = "ZXY"; r.position.set(0, 3.8, cz); r.scale.set(1, 1, 0.4); g.add(r);
    for (const sx of [-1.52, 1.52]) for (let w = 0; w < Math.floor(L / 1.8); w++) { const wi = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.1), win); wi.position.set(sx, 2.8, cz - L / 2 + 1 + w * 1.8); g.add(wi); }
    if (o.stripe) { for (const sx of [-1.52, 1.52]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, L), this.M({ color: o.stripe })); st.position.set(sx, 1.8, cz); g.add(st); } }
    for (const bz of [-L / 2 + 1.5, L / 2 - 1.5]) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 2), dark); b.position.set(0, 0.5, cz + bz); g.add(b); }
  }
  const len = cars * (L + 1);
  this.collider(x - Math.sin(ry || 0) * (len / 2 - L / 2), z - Math.cos(ry || 0) * (len / 2 - L / 2), 1.6, len / 2, ry);
  return g;
};
// an erupting geyser and a bubbling mud pool
P.geyser = function (x, z) {
  this.cyl(1.6, 2.2, 0.5, this.M({ color: 0xd8d0b8, roughness: 1 }), x, 0.25, z, 16, { collide: true });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.2, 1, 12, 1, true), this.M({ color: 0xf4fbff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); col.position.set(x, 0, z); this.scene.add(col);
  this.steam(x, 1, z, 3, 0.4);
  this.updaters.push(() => { const c = (this.t % 14) / 14, k = c < 0.25 ? Math.sin(c / 0.25 * Math.PI) : 0; col.scale.set(1, Math.max(0.01, k * 16), 1); col.position.y = k * 8; col.visible = k > 0.02; });
};
P.mudPool = function (x, z, r) {
  const m = this.M({ color: 0x8a7a68, roughness: 0.4 }), p = this.cyl(r, r, 0.1, m, x, 0.05, z, 24); this.circle(x, z, r);
  const bubbles = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, TAU, 0, Math.PI / 2), m); this.scene.add(b); bubbles.push({ b, a: hash(i, x) * TAU, d: hash(z, i) * r * 0.8, t: hash(i, i) }); }
  this.updaters.push(dt => { for (const q of bubbles) { q.t += dt * 0.7; if (q.t > 1) { q.t = 0; q.a = Math.random() * TAU; q.d = Math.random() * r * 0.8; } q.b.position.set(x + Math.cos(q.a) * q.d, 0.1, z + Math.sin(q.a) * q.d); q.b.scale.setScalar(0.3 + q.t * 1.4); q.b.visible = q.t < 0.9; } });
  this.steam(x, 0.3, z, r * 0.8, 0.2);
};
// a fountain with jets of water
P.fountain = function (x, z, r) {
  const stone = this.M({ map: PT.paving(21, [220, 214, 200]), rx: 2, ry: 1 });
  this.cyl(r, r + 0.3, 0.8, stone, x, 0.4, z, 24, { collide: true }); this.water(r * 1.9, r * 1.9, x, z, 0x3aa0d0, { y: 0.75, opacity: 0.8 });
  this.cyl(0.5, 0.7, 2.4, stone, x, 1.2, z, 12);
  const jets = []; for (let i = 0; i < 8; i++) { const a = i * TAU / 8, j = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1, 5), this.M({ color: 0xe8f6ff, transparent: true, opacity: 0.7, emissive: 0x7fdcff, ei: 0.3 })); j.position.set(x + Math.cos(a) * r * 0.6, 1.6, z + Math.sin(a) * r * 0.6); j.rotation.z = Math.cos(a) * 0.5; j.rotation.x = -Math.sin(a) * 0.5; this.scene.add(j); jets.push(j); }
  this.updaters.push(() => { jets.forEach((j, i) => { j.scale.y = 1.6 + Math.sin(this.t * 3 + i) * 0.4; }); });
};
// a big screen (the lair, the stage, the control room)
P.screen = function (x, y, z, w, h, ry, color) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 144; const g = c.getContext("2d");
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); m.position.set(x, y, z); m.rotation.y = ry || 0; this.scene.add(m);
  this.box(w + 0.3, h + 0.3, 0.2, this.M({ color: 0x1a1a1e }), x - Math.sin(ry || 0) * 0.12, y, z - Math.cos(ry || 0) * 0.12, { ry });
  let last = -1; const col = color || "#ff6a1a";
  this.updaters.push(() => { const f = Math.floor(this.t * 4); if (f === last) return; last = f; g.fillStyle = "#0a0a12"; g.fillRect(0, 0, 256, 144); g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 64; i++) { const px = i * 4, py = 72 + Math.sin(i * 0.3 + this.t * 3) * 30 * Math.sin(this.t * 0.7); if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); g.fillStyle = col; for (let i = 0; i < 6; i++) g.fillRect(12 + i * 40, 120 - (Math.sin(this.t * 2 + i) * 0.5 + 0.5) * 40, 24, 4 + (Math.sin(this.t * 2 + i) * 0.5 + 0.5) * 40); t.needsUpdate = true; });
  return m;
};
// a white stupa with a golden spire
P.stupa = function (x, z, s) {
  s = s || 1; const white = this.M({ color: 0xf4f2ec, roughness: 0.8 }), gold = this.M({ color: 0xd4a017, metalness: 0.8, roughness: 0.3 });
  this.box(6 * s, 1.2 * s, 6 * s, white, x, 0.6 * s, z, { collide: true });
  const d = new THREE.Mesh(new THREE.SphereGeometry(2.6 * s, 20, 12, 0, TAU, 0, Math.PI / 2), white); d.position.set(x, 1.2 * s, z); d.castShadow = true; this.scene.add(d);
  this.box(1.8 * s, 1.4 * s, 1.8 * s, gold, x, 4.3 * s, z);
  this.cone(0.8 * s, 3.4 * s, gold, x, 6.7 * s, z, 12);
  this.flagLine(x, z, x + 12 * s, z + 8 * s, 8 * s); this.flagLine(x, z, x - 12 * s, z + 8 * s, 8 * s);
};
// a lighthouse
P.lighthouse = function (x, z) {
  this.cyl(1.4, 1.8, 10, this.M({ map: stripes("#d03030", "#f4f4f4", 2), rx: 1, ry: 3 }), x, 5, z, 16, { collide: true });
  this.cyl(1.1, 1.1, 1.6, this.M({ color: 0xfff4c0, emissive: 0xffe0a0, ei: 1.5 }), x, 10.8, z, 12); this.cone(1.4, 1.2, this.M({ color: 0x2a2a30 }), x, 12.2, z, 12);
};
// a Maori meeting house with a red carved gable
P.whare = function (x, z, ry) {
  const g = this.house(x, z, 7, 10, 3.2, 0x8a2a1a, { ry, roof: 0x5a1a10, pitch: 0.5, lit: 0.2, tex: null, plaster: [140, 60, 40] });
  const red = this.M({ color: 0xa02a1a, roughness: 0.6 }); const d = 5.3;
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 5.4), red); b.position.set(s * 2.0, 4.2, d); b.rotation.z = -s * 0.78; b.rotation.y = Math.PI / 2; g.add(b); }
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.4), red); post.position.set(0, 1.7, d); g.add(post);
  return g;
};
// a rope bridge over a gorge, with prayer flags along its ropes
P.ropeBridge = function (x0, z0, x1, z1, h) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), g = new THREE.Group(); g.position.set(x0, 0, z0); g.rotation.y = ry; this.scene.add(g);
  const wood = this.M({ map: PT.wood(12) }), rope = this.M({ color: 0x8a7a5a });
  for (let d = 0; d < len; d += 0.6) { const sag = Math.sin(d / len * Math.PI) * 1.2; const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.45), wood); p.position.set(0, h - sag, d); g.add(p); }
  for (const sx of [-0.85, 0.85]) for (let d = 0; d < len; d += 1.2) { const sag = Math.sin(d / len * Math.PI) * 1.2, sag2 = Math.sin(Math.min(len, d + 1.2) / len * Math.PI) * 1.2; const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.25, 4), rope); r.position.set(sx, h - (sag + sag2) / 2 + 1.0, d + 0.6); r.rotation.x = Math.PI / 2 + (sag2 - sag) / 1.2; g.add(r); }
  this.flagLine(x0 - 0.9, z0, x1 - 0.9, z1, h + 2.2);
};
// crates and drums in a heap
P.cargo = function (x, z, n, seed) {
  const wood = this.M({ map: PT.wood(3 + (seed || 0)) }), drum = this.M({ color: 0xe05a10, metalness: 0.4, roughness: 0.5 });
  for (let i = 0; i < n; i++) { const a = hash(i, seed || 1) * TAU, d = hash(seed || 2, i) * 2.2, s = 0.8 + hash(i, 5) * 0.5, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (i % 3 === 2) this.cyl(0.35, 0.35, 1.0, drum, px, 0.5, pz, 10); else this.box(s, s, s, wood, px, s / 2 + (i % 4 === 3 ? s : 0), pz, { ry: a }); }
  this.circle(x, z, 2.2);
};
// a tall stepped tower of glass (Dubai) and a tree of bright rooftops
P.skyTower = function (x, z, h, r) {
  const glass = this.M({ color: 0x9ab8d0, metalness: 0.85, roughness: 0.15 });
  let y = 0; for (let i = 0; i < 7; i++) { const hh = h * (0.28 - i * 0.03), rr = r * (1 - i * 0.13); this.cyl(rr * 0.8, rr, hh, glass, x, y + hh / 2, z, 6); y += hh; }
  this.cyl(0.3, r * 0.2, h * 0.2, glass, x, y + h * 0.1, z, 6); this.circle(x, z, r);
};

export { SCENES };
