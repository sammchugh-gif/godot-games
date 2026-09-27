// Pieces the Deep Red places are built from: fishing boats (floating or
// lying on the mud), cottages, piers, rocks and cliffs, and a lighthouse with a
// spiral staircase inside. Each adds its own colliders.
import * as THREE from "three";
import { M } from "../tex.js";
import { rng } from "../tex.js";

const _q = new THREE.Quaternion(), _p = new THREE.Vector3();
// a collider for a box that sits inside a group (so it turns and tilts with it)
function boxIn(w, group, mesh, hx, hy, hz) { group.updateMatrixWorld(true); mesh.getWorldPosition(_p); mesh.getWorldQuaternion(_q); return w.phys.fixedBox(_p.x, _p.y, _p.z, hx, hy, hz, 0, { q: _q }); }

// a fishing boat about 7 m long: hull, deck, wheelhouse and a mast. yaw turns it; roll leans it
// over (a boat sitting on the mud at low tide). Returns the group and the deck's height.
export function boat(w, x, y, z, yaw = 0, o = {}) {
  const s = o.size || 1, L = 7 * s, B = 2.6 * s, D = 1.5 * s;
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(0, yaw, o.roll || 0, "YXZ"); w.scene.add(g);
  const paint = M(o.color ?? 0x2a6ad8, { rough: 0.55 }), white = M(0xf2f2ee, { rough: 0.6 }), wood = M("wood", { args: [8, [150, 110, 70]], repeat: [1, 3] }), dark = M(0x2a2e34, { rough: 0.5, metal: 0.4 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  const hull = add(new THREE.BoxGeometry(B, D, L * 0.72), paint, 0, D / 2, -L * 0.1);
  const bow = add(new THREE.CylinderGeometry(B / 2, B / 2, D, 3, 1), paint, 0, D / 2, L * 0.28); bow.scale.set(1, 1, 1.9);
  add(new THREE.BoxGeometry(B + 0.06, 0.18, L * 0.72 + 0.06), white, 0, D - 0.05, -L * 0.1);
  const deck = add(new THREE.BoxGeometry(B - 0.2, 0.1, L * 0.7), wood, 0, D + 0.02, -L * 0.1);
  const cab = add(new THREE.BoxGeometry(B * 0.7, 1.5 * s, 1.8 * s), white, 0, D + 0.8 * s, L * 0.02);
  add(new THREE.BoxGeometry(B * 0.74, 0.12, 2 * s), paint, 0, D + 1.6 * s, L * 0.02);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.02, 0.5 * s, 1.2 * s), M(0x3a5a7a, { rough: 0.1, metal: 0.4 }), sx * (B * 0.35 + 0.01), D + 1.1 * s, L * 0.02);
  add(new THREE.CylinderGeometry(0.08, 0.1, 5 * s, 8), wood, 0, D + 2.5 * s, -L * 0.3);
  if (o.name) { const t = add(new THREE.PlaneGeometry(2 * s, 0.4 * s), new THREE.MeshStandardMaterial({ map: signTex(o.name), roughness: 0.6 }), B / 2 + 0.02, D * 0.6, L * 0.05); t.rotation.y = Math.PI / 2; }
  if (o.collide !== false) {
    boxIn(w, g, hull, B / 2, D / 2, L * 0.36); boxIn(w, g, cab, B * 0.35, 0.75 * s, 0.9 * s);
    const bc = new THREE.Mesh(); bc.position.set(0, D / 2, L * 0.3); g.add(bc); boxIn(w, g, bc, B * 0.3, D / 2, L * 0.12); g.remove(bc);
  }
  void deck;
  // a point on the boat in its own frame (x across, y up from the keel, z towards the bow) in the world
  const local = (lx, ly, lz) => { g.updateMatrixWorld(true); const v = new THREE.Vector3(lx, ly, lz).applyMatrix4(g.matrixWorld); return [v.x, v.y, v.z]; };
  return { g, deckY: y + D + 0.07, roofY: y + D + 1.66 * s, local, aft: local(0, D + 0.95, -L * 0.3) };
}
let signCache = new Map();
function signTex(text) {
  if (signCache.has(text)) return signCache.get(text);
  const c = document.createElement("canvas"); c.width = 256; c.height = 52; const x = c.getContext("2d");
  x.fillStyle = "#f2f2ee"; x.fillRect(0, 0, 256, 52); x.fillStyle = "#1a2a4a"; x.font = "900 34px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 28);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; signCache.set(text, t); return t;
}

// a whitewashed cottage with a slate roof, set into the hillside at height y
export function cottage(w, x, y, z, yaw = 0, o = {}) {
  const wd = o.w || 6, dp = o.d || 5, ht = o.h || 4;
  w.building(wd, ht, dp, x, z, { y, ry: yaw, wall: o.wall || [238, 236, 226], roof: "pitched", roofColor: o.roof || [84, 92, 104], seed: o.seed || Math.floor(x * 7 + z * 3), win: { lit: 0.15, glass: "#3a4a5a" } });
  // a chimney
  w.box(0.6, 1.4, 0.6, M(0x9a9690, { rough: 0.9 }), x + Math.cos(yaw) * wd * 0.3, y + ht + 1.1, z - Math.sin(yaw) * wd * 0.3, { ry: yaw });
}

// a straight stretch of pier or harbour wall from (x0, z0) to (x1, z1): top height, width, how deep it goes
export function pier(w, x0, z0, x1, z1, top, width = 4, bottom = -12, mat) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), h = top - bottom;
  const m = mat || M("stone", { args: [41, [150, 146, 136]], repeat: [Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(len / 3))] });
  w.box(width, h, len + width * 0.2, m, (x0 + x1) / 2, bottom + h / 2, (z0 + z1) / 2, { ry });
  return { len, ry };
}

// a scatter of boulders round (cx, cz), sitting on the ground at y (or the terrain), each with a collider
export function rocks(w, cx, cz, n, spread, size, o = {}) {
  const R = rng(o.seed || 17), mat = M("rock", { args: [o.seed || 5, o.color || [120, 116, 108]], repeat: [1, 1] });
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * spread, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const r = size * (0.5 + R() * 0.7), y = (o.y ?? (w.heightAt ? w.heightAt(x, z) : 0)) + r * 0.35;
    const m = w.mesh(new THREE.DodecahedronGeometry(r, 1), mat, x, y, z); m.rotation.set(R() * 3, R() * 3, R() * 3); m.scale.set(1, 0.7 + R() * 0.4, 1);
    if (o.collide !== false) w.phys.fixedBall(x, y, z, r * 0.85);
    out.push([x, y + r * 0.6, z]);
  }
  return out;
}

// a slab of cliff rock: a box with a rock face, rough rocks stuck to its faces to break up the edges
export function cliff(w, x, y, z, sx, sy, sz, o = {}) {
  const mat = M("rock", { args: [o.seed || 61, o.color || [118, 112, 102]], repeat: [Math.max(1, Math.round(sx / 6)), Math.max(1, Math.round(sy / 6))] });
  w.box(sx, sy, sz, mat, x, y, z, { ry: o.ry || 0 });
  if (o.lumps !== false) {
    const R = rng(o.seed || 61), n = Math.round((sx + sz) / 3);
    for (let i = 0; i < n; i++) {
      const side = R() < 0.5 ? -1 : 1, alongX = R() < sx / (sx + sz);
      const px = alongX ? x + (R() - 0.5) * sx : x + side * sx / 2, pz = alongX ? z + side * sz / 2 : z + (R() - 0.5) * sz;
      const r = 1 + R() * 2.2, py = y - sy / 2 + R() * sy;
      const m = w.mesh(new THREE.DodecahedronGeometry(r, 0), mat, px, py, pz, { cast: false }); m.rotation.set(R() * 3, R() * 3, R() * 3);
    }
  }
}

// a lighthouse: a striped tower with a door at the bottom, a spiral staircase inside winding up
// to a gallery round the lamp at the top. Returns where things are.
export function lighthouse(w, x, y, z, o = {}) {
  const H = o.height || 16, Ri = 2.8, Ro = 3.4, doorA = o.door ?? 0;
  const white = M(0xf4f4f0, { rough: 0.5 }), band = M(o.band ?? 0xc83a2a, { rough: 0.5 }), dark = M(0x1a1e24, { metal: 0.6, rough: 0.4 });
  const stone = M("stone", { args: [73, [200, 196, 188]], repeat: [2, 1] });
  // the wall: a ring of slabs, with a gap for the door at the bottom and one onto the gallery at the top
  const N = 24;
  for (let i = 0; i < N; i++) {
    const a = (i + 0.5) / N * Math.PI * 2, da = Math.abs(Math.atan2(Math.sin(a - doorA), Math.cos(a - doorA)));
    const seg = 2 * Math.PI * (Ri + Ro) / 2 / N + 0.05, cx = x + Math.sin(a) * (Ri + Ro) / 2, cz = z + Math.cos(a) * (Ri + Ro) / 2;
    const door = da < 0.2, top = da < 0.2;
    const parts = door ? [[2.6, H - 2.6 - 1.4], [H - 1.4, 1.4]] : [[0, H]];
    void top;
    for (const [y0, hh] of parts) {
      if (hh <= 0) continue;
      const stripes = Math.max(1, Math.round(hh / 2));
      for (let k = 0; k < stripes; k++) { const yy = y0 + k * hh / stripes; w.box(seg, hh / stripes, Ro - Ri, (Math.floor((yy - 0) / 2.6) % 2) ? band : white, cx, y + yy + hh / stripes / 2, cz, { ry: a, collide: false }); }
      w.phys.fixedBox(cx, y + y0 + hh / 2, cz, seg / 2, hh / 2, (Ro - Ri) / 2, a);
    }
  }
  // a floor inside, the pillar up the middle, and the spiral stairs round it
  w.cyl(Ri, Ri, 0.3, stone, x, y + 0.15, z, { seg: 24 });
  w.cyl(0.45, 0.45, H + 0.4, stone, x, y + H / 2, z, { seg: 14 });
  const per = 16, rise = 0.3, n = Math.floor((H - 0.4) / rise), r0 = 0.45, r1 = Ri - 0.05, rm = (r0 + r1) / 2, run = 2 * Math.PI * rm / per + 0.12;
  const stepM = M("wood", { args: [9, [140, 100, 64]], repeat: [1, 1] });
  const steps = [];
  for (let i = 0; i < n; i++) {
    const a = doorA + Math.PI * 0.35 + i / per * Math.PI * 2, top = y + 0.3 + rise * (i + 1);
    const cx = x + Math.sin(a) * rm, cz = z + Math.cos(a) * rm;
    w.box(run, 0.24, r1 - r0, stepM, cx, top - 0.12, cz, { ry: a });
    steps.push([cx, top, cz]);
  }
  // the top: a floor round the stairwell, the gallery outside the door, the lamp room above
  const topY = y + 0.3 + rise * n;
  const last = doorA + Math.PI * 0.35 + (n - 1) / per * Math.PI * 2;
  const land = new THREE.Mesh(new THREE.RingGeometry(r0, Ri, 24, 1, last + 0.3 - Math.PI / 2, Math.PI * 1.5), stone); land.rotation.x = -Math.PI / 2; land.position.set(x, topY, z); w.scene.add(land);
  for (let k = 0; k < 6; k++) { const a = last + 0.55 + k * 0.78; w.phys.fixedBox(x + Math.sin(a) * rm, topY - 0.12, z + Math.cos(a) * rm, 0.55, 0.12, (r1 - r0) / 2, a); }
  const gal = new THREE.Mesh(new THREE.RingGeometry(Ro - 0.05, Ro + 1.3, 32), dark); gal.rotation.x = -Math.PI / 2; gal.position.set(x, topY + 0.01, z); w.scene.add(gal);
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; w.phys.fixedBox(x + Math.sin(a) * (Ro + 0.6), topY - 0.15, z + Math.cos(a) * (Ro + 0.6), 0.55, 0.15, 0.7, a); }
  for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; w.mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), dark, x + Math.sin(a) * (Ro + 1.25), topY + 0.55, z + Math.cos(a) * (Ro + 1.25)); }
  const rail = new THREE.Mesh(new THREE.TorusGeometry(Ro + 1.25, 0.05, 6, 48), dark); rail.rotation.x = Math.PI / 2; rail.position.set(x, topY + 1.1, z); w.scene.add(rail);
  for (let k = 0; k < 16; k++) { const a = (k + 0.5) / 16 * Math.PI * 2; w.phys.fixedBox(x + Math.sin(a) * (Ro + 1.3), topY + 0.6, z + Math.cos(a) * (Ro + 1.3), 0.3, 0.6, 0.05, a); }
  // the lamp room: glass all round, a red dome on top, the lamp inside
  w.cyl(Ri * 0.8, Ri * 0.8, 2.6, new THREE.MeshPhysicalMaterial({ color: 0xcfefff, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false }), x, topY + 1.3 + 1.4, z, { collide: false, cast: false });
  w.mesh(new THREE.SphereGeometry(Ri * 0.85, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), band, x, topY + 2.7 + 1.4, z);
  w.box(Ri * 1.7, 0.2, Ri * 1.7, dark, x, topY + 1.4, z, { collide: false });
  const lamp = w.mesh(new THREE.SphereGeometry(0.6, 16, 10), new THREE.MeshStandardMaterial({ color: 0xfff4c8, emissive: 0xfff0b0, emissiveIntensity: 5 }), x, topY + 2.6, z, { cast: false });
  // the way up for the autopilot: in at the door, up every step, across the landing, out onto the gallery
  const at = (r, yy) => [x + Math.sin(doorA) * r, yy, z + Math.cos(doorA) * r];
  const climb = [at(Ro + 1.5, y), at(rm, y + 0.3), ...steps, at(rm, topY), at(Ro + 0.7, topY)];
  return { top: topY, steps, lamp, climb, door: at(Ro + 1.5, y), gallery: at(Ro + 0.7, topY) };
}

// a road along a closed loop of [x, z] points, laid on the ground: a strip of asphalt with a
// dashed centre line, following the terrain (for the chases)
export function road(w, path, width = 7, o = {}) {
  const pts = path.map(([x, z]) => new THREE.Vector3(x, 0, z)), curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
  const n = Math.round(curve.getLength() / 1.5), pos = [], uv = [], idx = [];
  const hAt = (x, z) => (w.heightAt ? w.heightAt(x, z) : 0) + (o.lift ?? 0.06);
  for (let i = 0; i <= n; i++) {
    const u = i / n, p = curve.getPointAt(u % 1), t = curve.getTangentAt(u % 1), sx = -t.z, sz = t.x;
    for (const s of [-1, 1]) { const x = p.x + sx * s * width / 2, z = p.z + sz * s * width / 2; pos.push(x, hAt(x, z), z); uv.push(s < 0 ? 0 : 1, i * 1.5 / width); }
    if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const tex = roadTex(), m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })); m.receiveShadow = true; w.scene.add(m);
  return curve;
}
let _road = null;
function roadTex() {
  if (_road) return _road;
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const x = c.getContext("2d");
  x.fillStyle = "#3a3c40"; x.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},0.05)`; x.fillRect(Math.random() * 64, Math.random() * 128, 2, 2); }
  x.fillStyle = "#e8e0c8"; x.fillRect(2, 0, 3, 128); x.fillRect(59, 0, 3, 128); x.fillStyle = "#f0c020"; x.fillRect(30, 0, 4, 64);
  _road = new THREE.CanvasTexture(c); _road.wrapS = _road.wrapT = THREE.RepeatWrapping; _road.colorSpace = THREE.SRGBColorSpace; _road.anisotropy = 4;
  return _road;
}

// a sea stack shaped like a flowerpot: narrow at the foot where the tides wore it away, wide at
// the top, with trees growing on it. Returns the height of its flat top.
export function flowerpot(w, x, y, z, h, r, o = {}) {
  const red = M("rock", { args: [o.seed || 81, [168, 92, 64]], repeat: [2, 3] }), turf = M("grass", { args: [23, [80, 120, 60]], repeat: [2, 2] });
  const foot = w.cyl(r * 0.55, r * 0.65, h * 0.45, red, x, y + h * 0.225, z, { seg: 11 });
  const top = w.cyl(r, r * 0.6, h * 0.55, red, x, y + h * 0.45 + h * 0.275, z, { seg: 11 });
  foot.rotation.y = top.rotation.y = (o.seed || 1) * 0.7;
  w.cyl(r * 0.98, r * 0.98, 0.3, turf, x, y + h + 0.15, z, { seg: 11 });
  for (let k = 0; k < (o.trees ?? 3); k++) { const a = k * 2.1 + (o.seed || 0), d = r * 0.5; w.pine(x + Math.cos(a) * d, z + Math.sin(a) * d, 4 + (k % 2) * 1.5, { y: y + h + 0.3, collide: k === 0 }); }
  return y + h + 0.3;
}

// a coral head on the sea bed at (x, y, z), about s metres across: brain coral, branching coral,
// a table coral or a sea fan (picked by the seed), in reef colours. Big ones get a collider.
const CORAL = [0xff7a8a, 0xffb040, 0xb070e0, 0x40c8b0, 0xff5a5a, 0xf0e070, 0x6a90ff];
export function coral(w, x, y, z, s = 1.5, seed = 1) {
  const R = rng(seed * 31 + 7), col = CORAL[seed % CORAL.length], mat = M(col, { rough: 0.8, emissive: col, ei: 0.08 });
  const kind = seed % 4, g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = R() * 6; w.scene.add(g);
  const add = (geo, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  if (kind === 0) {
    // brain coral: a lumpy dome
    const geo = new THREE.IcosahedronGeometry(s / 2, 3), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = 1 + Math.sin(vx * 9 / s + vz * 5 / s) * 0.05 + Math.cos(vz * 11 / s) * 0.04; p.setXYZ(i, vx * k, Math.max(-s * 0.1, vy * k * 0.75), vz * k); }
    geo.computeVertexNormals(); add(geo, 0, s * 0.1, 0);
    if (s > 1) w.phys.fixedBall(x, y + s * 0.1, z, s * 0.4);
  } else if (kind === 1) {
    // branching (staghorn) coral: a bush of thin cones
    for (let i = 0; i < 9; i++) { const a = R() * 6.28, t = 0.2 + R() * 0.7, br = add(new THREE.CylinderGeometry(0.03 * s, 0.08 * s, s * (0.5 + R() * 0.5), 6), (R() - 0.5) * s * 0.4, s * 0.3, (R() - 0.5) * s * 0.4); br.rotation.set(Math.cos(a) * t, 0, Math.sin(a) * t); }
  } else if (kind === 2) {
    // table coral: a flat plate on a stalk
    add(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, s * 0.5, 8), 0, s * 0.25, 0);
    add(new THREE.CylinderGeometry(s * 0.6, s * 0.45, 0.12 * s, 14), 0, s * 0.52, 0);
    if (s > 1) w.phys.fixedCyl(x, y + s * 0.52, z, s * 0.55, 0.06 * s);
  } else {
    // a sea fan: a flat lacy disc standing up
    const fan = add(new THREE.CircleGeometry(s * 0.5, 16, 0, Math.PI), 0, 0.05, 0);
    fan.material = M(col, { rough: 0.8, side: THREE.DoubleSide, emissive: col, ei: 0.1 });
    add(new THREE.CylinderGeometry(0.03, 0.05, 0.3, 5), 0, 0.1, 0);
  }
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = false; });
  return g;
}
