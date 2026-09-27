// The coast kit: jetties, rocks, cliffs, lighthouses, sheds, pumps and pipes,
// and under the water: coral, seaweed, shoals of fish and columns of bubbles.
import * as THREE from "three";
import { M, TEX, rng } from "./tex.js";
import { thing } from "./props.js";
import { makeBoat } from "./boats.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------ the shore
// a coastline profile for a heightfield: land height h at the back, sloping into the sea
// beyond the line, down to the seabed depth; r is the distance from the line (negative on land)
export function shoreProfile(r, o = {}) {
  const land = o.land ?? 1.5, beach = o.beach ?? 10, depth = o.depth ?? -12, slope = o.slope ?? 30;
  if (r < -beach) return land;
  if (r < 0) return land * (-r / beach) + (o.water ?? 0.2) * (1 + r / beach);
  return Math.max(depth, (o.water ?? 0.2) - r * (-(depth) / slope));
}

// ------------------------------------------------------------ built things
export function jetty(w, x, z, len, ry = 0, o = {}) {
  const wood = M("wood", { args: [21, [150, 110, 70]], repeat: [1, Math.max(1, Math.round(len / 4))] });
  const y = o.y ?? 1.0, wid = o.w ?? 3;
  const cx = x + Math.sin(ry) * len / 2, cz = z + Math.cos(ry) * len / 2;
  w.box(wid, 0.3, len, wood, cx, y, cz, { ry });
  for (let i = 0; i <= len; i += 4) { for (const s of [-1, 1]) { const px = x + Math.sin(ry) * i + Math.cos(ry) * s * (wid / 2 - 0.2), pz = z + Math.cos(ry) * i - Math.sin(ry) * s * (wid / 2 - 0.2); w.cyl(0.18, 0.18, y + 12, M(0x6a4a30, { rough: 0.9 }), px, y - 6, pz, { seg: 8, collide: false }); } }
  if (o.rail) for (const s of [-1, 1]) w.box(0.08, 0.9, len, M(0x6a4a30), cx + Math.cos(ry) * s * (wid / 2 - 0.1), y + 0.6, cz - Math.sin(ry) * s * (wid / 2 - 0.1), { ry, collide: false });
  return [x + Math.sin(ry) * len, y + 0.15, z + Math.cos(ry) * len];
}
export function rock(w, x, y, z, r, o = {}) {
  const m = w.mesh(new THREE.DodecahedronGeometry(r, 0), o.mat || M(o.color ?? 0x6a6a72, { rough: 0.95, flat: true }), x, y, z, { ry: o.ry ?? (x * 7 + z * 3) % 6 });
  m.scale.set(1, o.flat ?? 0.7, 1);
  if (o.collide !== false) w.phys.fixedBall(x, y, z, r * (o.flat ?? 0.7));
  return m;
}
export function rocks(w, list, o = {}) { for (const [x, y, z, r] of list) rock(w, x, y, z, r, o); }
// a cliff face: a run of rock blocks along a line, with a little top you can stand on
export function cliff(w, x0, z0, x1, z1, h, o = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 6));
  const mat = o.mat || M("stone", { args: [o.seed ?? 33, o.color ?? [120, 100, 90]], repeat: [2, 2], normal: 1.2 });
  const R = rng(o.seed ?? 5);
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, hh = h * (0.85 + R() * 0.3), th = o.thick ?? 6;
    w.box(len / n + 0.4, hh, th, mat, x, (o.y ?? 0) + hh / 2, z, { ry });
  }
}
export function lighthouse(w, x, z, h = 14, o = {}) {
  const y = o.y ?? 0;
  const white = M(0xf4f4f0, { rough: 0.6 }), red = M(o.band ?? 0xd8302a, { rough: 0.6 });
  for (let i = 0; i < 5; i++) w.cyl(1.5 - i * 0.12, 1.62 - i * 0.12, h / 5, i % 2 ? red : white, x, y + h / 5 * (i + 0.5), z, { seg: 20, collide: i === 0 });
  w.phys.fixedCyl(x, y + h / 2, z, 1.6, h / 2);
  w.cyl(1.4, 1.4, 0.3, M(0x2a2a30, { metal: 0.6 }), x, y + h + 0.15, z, { seg: 20, collide: false });
  const lamp = w.mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 16, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.4, roughness: 0.05, emissive: 0xffe090, emissiveIntensity: 1.5, side: THREE.DoubleSide }), x, y + h + 1.1, z, { cast: false });
  w.cone(1.3, 1.2, red, x, y + h + 2.5, z);
  const beam = w.mesh(new THREE.ConeGeometry(0.15, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0b0).multiplyScalar(1.2), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), x, y + h + 1.1, z, { cast: false });
  beam.geometry.translate(0, 20, 0); beam.geometry.rotateX(Math.PI / 2); beam.userData.dynamic = true;
  const light = new THREE.PointLight(0xffe0a0, 12, 40, 1.4); light.position.set(x, y + h + 1.1, z); w.scene.add(light);
  w.updaters.push((dt, t) => { beam.rotation.y = t * 0.8; lamp.material.emissiveIntensity = 1.2 + Math.sin(t * 0.8 * 4) * 0.4; });
  return lamp;
}
export function shed(w, x, z, sx, h, sz, ry, o = {}) {
  const m = w.building(sx, h, sz, x, z, { ry, wall: o.wall ?? [200, 190, 170], seed: o.seed ?? Math.abs(Math.round(x * 3 + z)), roof: o.roof ?? "pitched", roofColor: o.roofColor ?? [90, 80, 80], win: { lit: o.lit ?? 0.3, glow: "#ffe6a8", glass: "#3a5a7a" }, y: o.y ?? 0 });
  if (o.sign) w.sign(o.sign, sx * 0.7, 0.9, x + Math.sin(ry) * (sz / 2 + 0.06), (o.y ?? 0) + h * 0.8, z + Math.cos(ry) * (sz / 2 + 0.06), ry, { bg: o.bg ?? "#1a2440", fg: o.fg ?? "#ffffff" });
  return m;
}
export function container(w, x, y, z, ry, color) {
  const g = thing("container", color); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  w.phys.fixedBox(x, y + 1.2, z, 1.2, 1.2, 3, ry);
  return g;
}
export function crateStack(w, x, y, z, n = 3, color) {
  const mat = M("wood", { args: [79, color ?? [170, 124, 70]] });
  for (let i = 0; i < n; i++) w.box(1.4, 1.4, 1.4, mat, x + (i % 2) * 1.45, y + 0.7 + Math.floor(i / 2) * 1.4, z, { ry: 0 });
}
export function buoy(w, x, z, color = 0xff5a2a) {
  const g = thing("buoy", color); g.position.set(x, 0, z); g.userData.dynamic = true; w.scene.add(g);
  w.updaters.push((dt, t) => { const s = w.sea; if (s) { g.position.y = s.height(x, z) - 0.15; const n = s.normal(x, z); g.rotation.set(n[2] * 0.8, 0, -n[0] * 0.8); } else g.position.y = Math.sin(t) * 0.1; });
  return g;
}
export function bollard(w, x, y, z) { w.cyl(0.18, 0.22, 0.6, M(0x1a1c22, { metal: 0.6 }), x, y + 0.3, z, { seg: 10 }); }
// a boat tied up, riding the waves (or leaning on the mud where the sea has gone)
export function mooredBoat(w, kind, x, z, ry, o = {}) {
  const g = makeBoat(kind, o.color); g.position.set(x, o.y ?? 0, z); g.rotation.y = ry; w.scene.add(g);
  g.traverse(n => { n.userData.dynamic = true; });
  const L = g.userData.L;
  if (o.collide !== false) w.phys.fixedBox(x, (o.y ?? 0) + 0.5, z, L.w * 0.55, 0.5, L.len * 0.5, ry);
  if (o.aground) { g.rotation.z = o.lean ?? 0.35; }
  else w.updaters.push((dt, t) => { const s = w.sea; if (s) { g.position.y = s.height(x, z) - 0.05; const n = s.normal(x, z); g.rotation.set(n[2] * 0.7, ry, -n[0] * 0.7, "YXZ"); } else g.position.y = Math.sin(t + x) * 0.1; });
  return g;
}
export function cargoShip(w, x, z, ry, o = {}) {
  const len = o.len ?? 60, wid = o.wid ?? 14, hull = M(o.color ?? 0x8a2a2a, { rough: 0.6, metal: 0.2 }), y = o.y ?? 0;
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(wid, 7, len), hull, 0, 1.5, 0);
  add(new THREE.BoxGeometry(wid + 0.6, 0.6, len + 0.6), M(0xf0f0f0, { rough: 0.5 }), 0, 5.2, 0);
  const bow = add(new THREE.ConeGeometry(wid / 2, 12, 4), hull, 0, 1.5, len / 2 + 5); bow.rotation.set(Math.PI / 2, Math.PI / 4, 0); bow.scale.set(1, 1, 7 / wid);
  add(new THREE.BoxGeometry(wid * 0.8, 9, 8), M(0xf0f0f0, { rough: 0.5 }), 0, 9.5, -len / 2 + 8);
  add(new THREE.BoxGeometry(wid * 0.82, 1.4, 8.2), M(0x1a3050, { rough: 0.1, metal: 0.6, emissive: 0xffe0a0, ei: 0.4 }), 0, 12.5, -len / 2 + 8);
  add(new THREE.CylinderGeometry(1.2, 1.5, 6, 12), M(0xd83a2a), 0, 17, -len / 2 + 4);
  const cols = [0xd83a2a, 0x2a6ad8, 0x3aa84a, 0xffd23f, 0xf0f0f0];
  let k = 0; for (let r = 0; r < Math.floor((len - 24) / 6.5); r++) for (let c = -1; c <= 1; c++) for (let lv = 0; lv < 1 + (r % 2); lv++) { const m = thing("container", cols[k++ % 5]); m.position.set(c * 2.8, 5.5 + lv * 2.4, len / 2 - 14 - r * 6.5); m.rotation.y = 0; g.add(m); }
  g.updateMatrixWorld(true);
  w.phys.fixedBox(x, y + 2.5, z, wid / 2, 3, len / 2, ry);
  w.phys.fixedBox(x, y + 5.5 + 2.4, z, wid * 0.42, 2.4, (len - 24) / 2 - 2, ry);
  if (o.deck) { /* a deck you can walk: the top of the hull collider is at y + 5.5 */ }
  return g;
}
// Undertow's pump: a drum with a column of glowing crystals, a pipe running off it
export function pump(w, x, y, z, o = {}) {
  const s = o.s ?? 1;
  const metal = M(0x3a4048, { metal: 0.8, rough: 0.35 }), red = M(0x8a1a2a, { metal: 0.5, rough: 0.4 });
  w.cyl(2.2 * s, 2.5 * s, 3 * s, red, x, y + 1.5 * s, z, { seg: 24 });
  w.cyl(2.4 * s, 2.4 * s, 0.4 * s, metal, x, y + 3.2 * s, z, { seg: 24, collide: false });
  const core = w.mesh(new THREE.CylinderGeometry(0.9 * s, 0.9 * s, 4 * s, 16), new THREE.MeshPhysicalMaterial({ color: 0x6ad8ff, emissive: 0x2a9aff, emissiveIntensity: 1.6, transparent: true, opacity: 0.8, roughness: 0.1 }), x, y + 5.2 * s, z, { cast: false });
  core.userData.dynamic = true;
  w.cyl(1.2 * s, 1.2 * s, 0.6 * s, metal, x, y + 7.4 * s, z, { seg: 16, collide: false });
  w.phys.fixedCyl(x, y + 5.5 * s, z, 1.0 * s, 2.5 * s);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; w.cyl(0.25 * s, 0.25 * s, 3 * s, metal, x + Math.cos(a) * 2.2 * s, y + 1.5 * s, z + Math.sin(a) * 2.2 * s, { seg: 8, collide: false }); }
  w.sign("UNDERTOW", 3.2 * s, 0.7 * s, x, y + 2.4 * s, z + 2.5 * s, 0, { bg: "#3a0a14", fg: "#ff5a6a" });
  w.updaters.push((dt, t) => { core.material.emissiveIntensity = w.pumpOff ? 0.15 : 1.4 + Math.sin(t * 5) * 0.6; core.rotation.y = w.pumpOff ? core.rotation.y : t * 1.5; if (!w.pumpOff && w.fx && Math.random() < dt * 4) w.fx.burst(x + (Math.random() - 0.5) * 2 * s, y + 7.8 * s, z + (Math.random() - 0.5) * 2 * s, 0x9ad8ff, 3, { speed: 0.5, up: 2, life: 1.2, size: 0.3, gravity: 0, bright: 2 }); });
  return core;
}
// a fat pipe along a line of points
export function pipe(w, pts, r = 1.2, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => V(...p)), false, "catmullrom", 0.2);
  const m = w.mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 6), r, 12, false), o.mat || M(0x4a5058, { metal: 0.7, rough: 0.4 }), 0, 0, 0, { cast: o.cast ?? true });
  for (let i = 0; i < pts.length; i += Math.max(1, o.ringEvery ?? 2)) { const p = pts[i]; w.mesh(new THREE.TorusGeometry(r + 0.15, 0.12, 8, 24), M(0x8a1a2a, { metal: 0.5 }), p[0], p[1], p[2], { cast: false }).lookAt(V(...(pts[Math.min(i + 1, pts.length - 1)]))); }
  if (o.collide) for (let i = 0; i < pts.length - 1; i++) {
    const a = V(...pts[i]), b = V(...pts[i + 1]), mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    w.phys.fixedBox(mid.x, mid.y, mid.z, r * 0.8, len / 2, r * 0.8, 0, { q });
  }
  return m;
}

// ------------------------------------------------------------ under the water
const coralCols = [0xff6a8a, 0xff9a3a, 0xffd23f, 0x9a5aff, 0x3ad0c0, 0xff5a5a, 0x7bed9f];
export function coral(w, x, y, z, s = 1, seed = 1, o = {}) {
  const R = rng(seed + Math.round(x * 3 + z * 7)), g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const n = o.n ?? 5;
  for (let i = 0; i < n; i++) {
    const c = coralCols[Math.floor(R() * coralCols.length)], k = R();
    const mat = M(c, { rough: 0.8, emissive: c, ei: 0.12 });
    let m;
    if (k < 0.35) { m = new THREE.Mesh(new THREE.SphereGeometry(s * (0.5 + R() * 0.5), 10, 8), mat); m.scale.y = 0.6 + R() * 0.3; } // a brain coral
    else if (k < 0.7) { const gg = new THREE.Group(); for (let b = 0; b < 5; b++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.05, s * 0.12, s * (0.8 + R() * 0.8), 6), mat); br.position.y = s * 0.4; br.rotation.set((R() - 0.5) * 1.2, R() * 6, (R() - 0.5) * 1.2); const wrap = new THREE.Group(); wrap.add(br); wrap.position.set((R() - 0.5) * s * 0.5, 0, (R() - 0.5) * s * 0.5); gg.add(wrap); } m = gg; } // branches
    else { m = new THREE.Mesh(new THREE.ConeGeometry(s * (0.4 + R() * 0.4), s * (0.9 + R() * 0.8), 7), mat); m.position.y = s * 0.5; } // a fan
    m.position.x += (R() - 0.5) * s * 2; m.position.z += (R() - 0.5) * s * 2; m.castShadow = true;
    g.add(m);
  }
  if (o.collide) w.phys.fixedBall(x, y, z, s * 1.2);
  return g;
}
// a few swaying fronds of kelp
export function seaweed(w, x, y, z, n = 6, h = 3, color = 0x2a8a3a) {
  const mat = M(color, { rough: 0.9, side: THREE.DoubleSide });
  const R = rng(Math.round(x * 5 + z * 11) + 3), fronds = [];
  for (let i = 0; i < n; i++) {
    const hh = h * (0.6 + R() * 0.8), m = new THREE.Mesh(new THREE.PlaneGeometry(0.35, hh, 1, 6), mat);
    m.geometry.translate(0, hh / 2, 0); m.position.set(x + (R() - 0.5) * 2.5, y, z + (R() - 0.5) * 2.5); m.rotation.y = R() * 6; m.userData.dynamic = true; m.castShadow = false;
    w.scene.add(m); fronds.push({ m, ph: R() * 6, base: Float32Array.from(m.geometry.attributes.position.array) });
  }
  w.updaters.push((dt, t) => { for (const f of fronds) { const p = f.m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const yy = f.base[i * 3 + 1]; p.setX(i, f.base[i * 3] + Math.sin(t * 1.3 + f.ph + yy * 0.8) * yy * 0.12); } p.needsUpdate = true; } });
}
// a shoal of little fish circling a spot
export function fish(w, cx, cy, cz, r = 6, n = 30, color = 0xffb040, o = {}) {
  const geo = new THREE.ConeGeometry(0.12, 0.45, 5); geo.rotateX(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: color, emissiveIntensity: 0.15 });
  const inst = new THREE.InstancedMesh(geo, mat, n); inst.frustumCulled = false; inst.castShadow = false; w.scene.add(inst);
  const R = rng(Math.round(cx * 3 + cz * 5) + 9), F = []; for (let i = 0; i < n; i++) F.push({ a: R() * 6.28, ra: r * (0.4 + R() * 0.6), dy: (R() - 0.5) * r * 0.4, ph: R() * 6, sp: (o.speed ?? 0.5) * (0.8 + R() * 0.4) });
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(o.size ?? 1, o.size ?? 1, o.size ?? 1), e = new THREE.Euler();
  w.updaters.push((dt, t) => { for (let i = 0; i < n; i++) { const f = F[i]; f.a += dt * f.sp; const x = cx + Math.cos(f.a) * f.ra, z = cz + Math.sin(f.a) * f.ra, y = cy + f.dy + Math.sin(t * 2 + f.ph) * 0.3; e.set(0, -f.a, Math.sin(t * 8 + f.ph) * 0.15); q.setFromEuler(e); mm.compose(new THREE.Vector3(x, y, z), q, s); inst.setMatrixAt(i, mm); } inst.instanceMatrix.needsUpdate = true; });
  return inst;
}
// a column of bubbles rising from the seabed
export function bubbles(w, x, y, z, rate = 4) {
  w.updaters.push(dt => { if (w.fx && Math.random() < dt * rate) w.fx.burst(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6, 0xdff6ff, 2, { speed: 0.2, up: 1.8, life: 3, size: 0.25, gravity: 0.6, drag: 0.2, bright: 1.5 }); });
}
// a big sea creature drifting slowly through: a turtle, a manta or a whale shark
export function bigFish(w, kind, path, o = {}) {
  const g = new THREE.Group(); w.scene.add(g);
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); me.castShadow = true; g.add(me); return me; };
  const fins = [];
  if (kind === "turtle") {
    const shell = M(0x4a7a3a, { rough: 0.7 }), skin = M(0x8ab070, { rough: 0.8 });
    add(new THREE.SphereGeometry(1, 16, 12), shell, 0, 0, 0).scale.set(1.2, 0.5, 1.5);
    add(new THREE.SphereGeometry(0.35, 12, 8), skin, 0, 0, 1.7);
    for (const s of [-1, 1]) { fins.push(add(new THREE.BoxGeometry(1.4, 0.08, 0.6), skin, s * 1.3, 0, 0.6, 0, 0, s * 0.3)); add(new THREE.BoxGeometry(0.8, 0.08, 0.4), skin, s * 1.0, 0, -0.9, 0, 0, s * 0.5); }
  } else if (kind === "manta") {
    const dark = M(0x1a2a3a, { rough: 0.6 });
    add(new THREE.SphereGeometry(1, 12, 8), dark, 0, 0, 0).scale.set(1.4, 0.3, 1.6);
    for (const s of [-1, 1]) fins.push(add(new THREE.BoxGeometry(3.2, 0.08, 1.8), dark, s * 2.6, 0, 0, 0, 0, 0));
    add(new THREE.CylinderGeometry(0.04, 0.02, 3, 6), dark, 0, 0, -2.8, Math.PI / 2);
  } else {
    const grey = M(0x6a7a8a, { rough: 0.6 }), pale = M(0xc8d0d8);
    add(new THREE.CapsuleGeometry(1.4, 5, 8, 16), grey, 0, 0, 0, Math.PI / 2);
    add(new THREE.CapsuleGeometry(1.0, 4.4, 8, 16), pale, 0, -0.6, 0.2, Math.PI / 2);
    fins.push(add(new THREE.BoxGeometry(0.15, 2.4, 1.6), grey, 0, 0.2, -3.6));
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.8, 0.1, 0.9), grey, s * 1.6, -0.5, 1.2, 0, 0, s * 0.2);
  }
  const curve = new THREE.CatmullRomCurve3(path.map(p => V(...p)), true);
  const len = curve.getLength(), speed = o.speed ?? 2;
  let s = o.phase ?? 0;
  w.updaters.push((dt, t) => { s += dt * speed; const u = (s % len) / len; const p = curve.getPointAt(u), tg = curve.getTangentAt(u); g.position.copy(p); g.lookAt(p.clone().add(tg)); fins.forEach((f, i) => { f.rotation.x = Math.sin(t * 1.6 + i) * 0.3; }); });
  return g;
}
// a few gulls wheeling overhead
export function gulls(w, cx, cy, cz, n = 5) {
  const mat = M(0xf4f4f4, { rough: 0.8, side: THREE.DoubleSide }), birds = [];
  for (let i = 0; i < n; i++) { const g = new THREE.Group(); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.25), mat), r = l.clone(); l.position.x = -0.45; r.position.x = 0.45; g.add(l); g.add(r); g.traverse(q => { q.userData.dynamic = true; }); w.scene.add(g); birds.push({ g, l, r, a: i * 1.3, ra: 8 + i * 3, ph: i }); }
  w.updaters.push((dt, t) => { for (const b of birds) { b.a += dt * 0.4; b.g.position.set(cx + Math.cos(b.a) * b.ra, cy + Math.sin(t * 0.7 + b.ph) * 2, cz + Math.sin(b.a) * b.ra); b.g.rotation.y = -b.a; const f = Math.sin(t * 6 + b.ph) * 0.5; b.l.rotation.z = f; b.r.rotation.z = -f; } });
}
export function tortoise(w, x, z, ry = 0, s = 1) {
  const y = w.heightAt ? w.heightAt(x, z) : 0;
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); w.scene.add(g);
  const shell = M(0x5a4a2a, { rough: 0.8 }), skin = M(0x8a8060, { rough: 0.9 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.SphereGeometry(1, 16, 12), shell, 0, 0.9, 0).scale.set(1.1, 0.75, 1.4);
  for (const [px, pz] of [[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]]) add(new THREE.CylinderGeometry(0.22, 0.28, 0.7, 8), skin, px, 0.35, pz);
  const head = add(new THREE.SphereGeometry(0.32, 10, 8), skin, 0, 0.9, 1.6); add(new THREE.CylinderGeometry(0.2, 0.26, 0.9, 8), skin, 0, 0.75, 1.15).rotation.x = Math.PI / 2 - 0.4;
  w.phys.fixedBall(x, y + 0.9, z, 1.2 * s);
  w.updaters.push((dt, t) => { head.position.y = 0.9 + Math.sin(t * 0.5 + x) * 0.08; });
  return g;
}
export function iguana(w, x, y, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  const dark = M(0x2a2a28, { rough: 0.9 }), add = (geo, m, px, py, pz, rx = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.rotation.x = rx; me.castShadow = true; g.add(me); return me; };
  add(new THREE.CapsuleGeometry(0.16, 0.8, 4, 8), dark, 0, 0.18, 0, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.02, 0.08, 1.0, 5), dark, 0, 0.14, -0.9, Math.PI / 2);
  add(new THREE.SphereGeometry(0.14, 8, 6), dark, 0, 0.22, 0.55);
  for (let i = 0; i < 6; i++) add(new THREE.ConeGeometry(0.03, 0.14, 4), M(0x4a4a44), 0, 0.36, 0.3 - i * 0.16);
  return g;
}
// a house on stilts over the lagoon, with a deck you can walk on
export function villa(w, x, z, ry = 0, o = {}) {
  const y = o.y ?? 1.6, wood = M("wood", { args: [45, [190, 150, 100]], repeat: [3, 3] }), thatch = M(0xa88a50, { rough: 1 });
  w.box(8, 0.3, 8, wood, x, y, z, { ry });
  w.box(5, 3, 5, M("wood", { args: [46, [230, 220, 200]], repeat: [2, 1] }), x, y + 1.65, z, { ry });
  const r = w.cone(5, 2.6, thatch, x, y + 4.4, z); r.rotation.y = ry + Math.PI / 4;
  for (const [dx, dz] of [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]]) w.cyl(0.18, 0.18, y + 10, M(0x6a4a30), x + Math.cos(ry) * dx - Math.sin(ry) * dz, y - 5, z + Math.sin(ry) * dx + Math.cos(ry) * dz, { seg: 8, collide: false });
  return y;
}
// a palm that knows the ground height
export function palmAt(w, x, z, h = 7) { const y = w.heightAt ? w.heightAt(x, z) : 0; const g = w.palm(x, z, h); g.position.y = y; return g; }
export function treeAt(w, x, z, h = 6, o = {}) { const y = w.heightAt ? w.heightAt(x, z) : 0; return w.tree(x, z, h, { ...o, y }); }
export function lampAt(w, x, z, h = 4.2, color = 0xffe0a0, o = {}) { const y = w.heightAt ? w.heightAt(x, z) : 0; w.cyl(0.07, 0.1, h, M(0x1e2228, { metal: 0.6, rough: 0.4 }), x, y + h / 2, z, { seg: 10 }); return w.mesh(new THREE.SphereGeometry(0.22, 16, 10), M(color, { emissive: color, ei: o.ei ?? 4 }), x, y + h + 0.1, z, { cast: false }); }
// a laser corridor: two walls either side of the run between start and goal
export function corridor(w, start, goal, width, mat, h = 3) {
  const [sx, sy, sz] = start, [gx, , gz] = goal, len = Math.hypot(gx - sx, gz - sz) + 6, ry = Math.atan2(gx - sx, gz - sz);
  const cx = (sx + gx) / 2, cz = (sz + gz) / 2, side = [Math.cos(ry), -Math.sin(ry)];
  for (const s of [-1, 1]) w.box(0.6, h, len, mat, cx + side[0] * s * (width / 2 + 0.3), sy + h / 2, cz + side[1] * s * (width / 2 + 0.3), { ry });
  w.box(width + 1.2, 0.3, len, mat, cx, sy + h + 0.15, cz, { ry, collide: false });
}
export { TEX };
