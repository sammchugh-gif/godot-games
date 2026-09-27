// The Spectrum kit: the colourful things the twelve places are built from.
// Painted house fronts, trams and rails, paper lanterns, baobabs, cacti,
// flamingos, reindeer, lemurs, chameleons, domes and minarets, waterfalls and
// boardwalks, dead trees, tents, market stalls, hanging silks, paintings, the
// aurora, and the pieces of Grisaille's airship.
import * as THREE from "three";
import { M, TEX, rng } from "./tex.js";
import { Palette } from "./palette.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const rgbOf = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const canvasTex = (key, size, draw) => {
  if (!canvasTex.cache) canvasTex.cache = new Map();
  if (canvasTex.cache.has(key)) return canvasTex.cache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"); draw(g, size, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  canvasTex.cache.set(key, t); return t;
};
const css = hex => "#" + hex.toString(16).padStart(6, "0");
export const groundAt = (w, x, z) => w.heightAt ? w.heightAt(x, z) : 0;

// ------------------------------------------------------------ houses and streets
// a painted house: a bright wall, a coloured door, window boxes, a pitched roof; o.zocalo
// paints a band of pictures along the bottom (Guatapé), o.tiles a blue tile front (Lisbon)
export function paintedHouse(w, x, z, wd, h, d, ry, o = {}) {
  const y = o.y ?? groundAt(w, x, z);
  const color = o.color ?? 0xffd23f, trim = o.trim ?? 0xffffff, door = o.door ?? 0xd83a2a;
  const m = w.building(wd, h, d, x, z, { ry, wall: rgbOf(color), seed: o.seed ?? Math.abs(Math.round(x * 3 + z * 7)), roof: o.roof === "flat" ? "none" : (o.roof ?? "pitched"), roofColor: o.roofColor ?? [120, 70, 60], win: { lit: o.lit ?? 0.35, glow: "#ffe6a8", glass: "#3a5a7a" }, y });
  // a flat roof you can stand on, with a low parapet
  if (o.roof === "flat") { w.box(wd + 0.4, 0.4, d + 0.4, M(trim, { rough: 0.7 }), x, y + h + 0.2, z, { ry }); for (const s of [-1, 1]) { w.box(wd + 0.4, 0.5, 0.2, M(trim, { rough: 0.7 }), x + Math.sin(ry) * s * (d / 2 + 0.1), y + h + 0.65, z + Math.cos(ry) * s * (d / 2 + 0.1), { ry, collide: false }); } }
  const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
  const front = (dx, dy, dz) => [x + fx * (d / 2 + dz) + sx * dx, y + dy, z + fz * (d / 2 + dz) + sz * dx];
  const doorM = M(door, { rough: 0.5 });
  const [dxp, dyp, dzp] = front(o.doorAt ?? 0, 1.05, 0.08);
  w.box(1.1, 2.1, 0.14, doorM, dxp, dyp, dzp, { ry, collide: false });
  w.box(1.3, 0.12, 0.2, M(trim, { rough: 0.6 }), ...front(o.doorAt ?? 0, 2.16, 0.1), { ry, collide: false });
  w.mesh(new THREE.SphereGeometry(0.05, 8, 6), M(0xffd166, { metal: 0.8, rough: 0.3 }), ...front((o.doorAt ?? 0) + 0.4, 1.05, 0.16), { cast: false });
  if (o.zocalo !== undefined) {
    const t = canvasTex("zocalo" + (o.seed ?? 0) + o.zocalo, 256, (g, W, H) => {
      g.fillStyle = css(o.zocalo); g.fillRect(0, 0, W, H);
      const R = rng((o.seed ?? 1) * 7 + 3);
      const cols = ["#ffffff", "#ffd23f", "#2a8ad8", "#d83a2a", "#3ad06a", "#ff8a2a"];
      for (let i = 0; i < 4; i++) {
        const cx = 32 + i * 64, cy = H / 2; g.fillStyle = "#ffffff"; g.fillRect(cx - 26, cy - 40, 52, 80);
        const kind = Math.floor(R() * 4); g.fillStyle = cols[Math.floor(R() * cols.length)];
        if (kind === 0) { g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fill(); }
        else if (kind === 1) { g.beginPath(); g.moveTo(cx - 18, cy + 18); g.lineTo(cx, cy - 18); g.lineTo(cx + 18, cy + 18); g.fill(); }
        else if (kind === 2) { g.fillRect(cx - 16, cy - 16, 32, 32); g.fillStyle = "#ffffff"; g.fillRect(cx - 6, cy - 6, 12, 12); }
        else { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; g.beginPath(); g.arc(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 6, 0, 7); g.fill(); } }
      }
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6);
    });
    const zm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
    zm.map = t.clone(); zm.map.repeat.set(Math.max(1, Math.round(wd / 3)), 1); zm.map.needsUpdate = true;
    w.box(wd + 0.06, 1.3, d + 0.06, zm, x, y + 0.65, z, { ry, collide: false });
  }
  if (o.tiles) {
    const t = canvasTex("azulejo" + o.tiles, 128, (g, W, H) => {
      g.fillStyle = "#f4f4f0"; g.fillRect(0, 0, W, H); g.strokeStyle = css(o.tiles); g.lineWidth = 3; g.fillStyle = css(o.tiles);
      for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) { const cx = 32 + xx * 64, cy = 32 + yy * 64; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, r = k % 2 ? 10 : 22; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeRect(xx * 64 + 1, yy * 64 + 1, 62, 62); }
    });
    const tm = new THREE.MeshStandardMaterial({ map: t.clone(), roughness: 0.4 }); tm.map.repeat.set(Math.max(1, Math.round(wd)), Math.max(1, Math.round(h / 1.5))); tm.map.needsUpdate = true;
    w.box(wd + 0.04, h * 0.55, 0.04, tm, ...front(0, h * 0.7, 0.02), { ry, collide: false });
  }
  // window boxes of flowers under the first-floor windows
  if (o.flowers !== false && wd >= 5) for (const dx of [-wd * 0.3, wd * 0.3]) { w.box(1.0, 0.25, 0.3, M(0x6a4a30), ...front(dx, h * 0.55, 0.15), { ry, collide: false }); for (let k = 0; k < 3; k++) w.mesh(new THREE.SphereGeometry(0.14, 8, 6), M([0xff3a6a, 0xffd23f, 0xff8ac8, 0xffffff][Math.abs(k + Math.round(x)) % 4]), ...front(dx - 0.3 + k * 0.3, h * 0.55 + 0.22, 0.15), { cast: false }); }
  return m;
}
// a row of painted houses along a line from (x0, z0), facing ry, each wd wide
export function houseRow(w, x0, z0, ry, list, o = {}) {
  const sx = Math.cos(ry), sz = -Math.sin(ry);
  let along = 0;
  list.forEach((hs, i) => {
    const wd = hs.w ?? 6, h = hs.h ?? 6 + (i % 3), d = hs.d ?? 7;
    const cx = x0 + sx * (along + wd / 2), cz = z0 + sz * (along + wd / 2);
    paintedHouse(w, cx, cz, wd, h, d, ry, { ...o, ...hs, seed: (o.seed ?? 1) + i });
    along += wd + (o.gap ?? 0);
  });
  return along;
}
// tram rails along a path of [x, z] points at ground height (no colliders: they lie flat)
export function rails(w, pts, o = {}) {
  const steel = M(0x7a7a80, { metal: 0.8, rough: 0.4 }), post = M(0x2a2e34, { metal: 0.6 });
  const y = o.y ?? 0;
  for (let i = 0; i < pts.length - (o.closed ? 0 : 1); i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, gy = o.y ?? groundAt(w, cx, cz);
    for (const s of [-0.5, 0.5]) w.box(0.08, 0.06, len + 0.4, steel, cx + Math.cos(ry) * s, gy + y + 0.04, cz - Math.sin(ry) * s, { ry, collide: false, cast: false });
    if (o.wire !== false) { const px = cx + Math.cos(ry) * 2.4, pz = cz - Math.sin(ry) * 2.4; w.cyl(0.06, 0.08, 5.2, post, px, gy + 2.6, pz, { seg: 8, collide: false }); w.box(0.05, 0.05, 2.4, post, px - Math.cos(ry) * 1.2, gy + 5.1, pz + Math.sin(ry) * 1.2, { ry: ry + Math.PI / 2, collide: false, cast: false }); }
  }
}
// a tram that runs round a closed path of [x, z] points, stopping for a while at the stops
// (indexes into the path); it is a mover you can ride, and its roof carries the drops
export function tram(w, pts, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, groundAt(w, x, z) + (o.y ?? 0), z)), true, "centripetal");
  const len = curve.getLength(), speed = o.speed ?? 4, dwell = o.dwell ?? 5;
  const stops = (o.stops || [0]).map(i => i / pts.length);
  // travel: distance along the loop as a function of time, pausing at each stop
  const stopS = stops.map(u => u * len).sort((a, b) => a - b);
  const period = len / speed + stopS.length * dwell;
  const sAt = t => { let tt = ((t % period) + period) % period, s = 0; for (let k = 0; k <= stopS.length; k++) { const next = k < stopS.length ? stopS[k] : len; const run = (next - s) / speed; if (tt < run) return s + tt * speed; tt -= run; s = next; if (k < stopS.length) { if (tt < dwell) return s; tt -= dwell; } } return s; };
  const g = new THREE.Group(); g.userData.dynamic = true; w.scene.add(g);
  const paint = new THREE.MeshPhysicalMaterial({ color: o.color ?? 0xffd23f, roughness: 0.3, metalness: 0.2, clearcoat: 0.8 }), cream = M(0xf4f4f0, { rough: 0.5 }), dark = M(0x2a2e34, { metal: 0.5 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9ad8ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.5 });
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  const W = 2.2, L = 5.6, H = 2.6;
  add(new THREE.BoxGeometry(W, 0.9, L), paint, 0, -H / 2 + 0.75, 0);
  add(new THREE.BoxGeometry(W - 0.1, 1.2, L - 0.1), glass, 0, -H / 2 + 1.8, 0);
  for (let i = -2; i <= 2; i++) for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 1.2, 0.12), cream, s * (W / 2 - 0.02), -H / 2 + 1.8, i * L / 5);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(W, 1.2, 0.14), paint, 0, -H / 2 + 1.8, s * (L / 2 - 0.05));
  add(new THREE.BoxGeometry(W + 0.2, 0.2, L + 0.2), cream, 0, H / 2 - 0.1, 0);
  const pole = add(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), dark, 0, H / 2 + 0.6, -0.5); pole.rotation.x = 0.55;
  add(new THREE.BoxGeometry(0.7, 0.24, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe8a0, emissiveIntensity: 1.2 }), 0, H / 2 - 0.5, L / 2 + 0.05);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 3 }), s * 0.7, -H / 2 + 0.6, L / 2 + 0.02);
  for (const z of [-1.8, 1.8]) for (const s of [-1, 1]) { const wh = add(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14), dark, s * 0.8, -H / 2 + 0.3, z); wh.rotation.z = Math.PI / 2; }
  const p0 = curve.getPointAt(0); g.position.set(p0.x, p0.y + H / 2, p0.z);
  const mv = w.phys.mover(g, W / 2, H / 2, L / 2, t => { const s = sAt(t), u = (s % len) / len; const p = curve.getPointAt(u), tg = curve.getTangentAt(u); return [p.x, p.y + H / 2, p.z, Math.atan2(tg.x, tg.z)]; });
  g.userData.mover = mv; g.userData.top = H / 2;
  return g;
}
// a tram stop: a little shelter with a sign
export function tramStop(w, x, z, ry, o = {}) {
  const y = groundAt(w, x, z), post = M(0x2a2e34, { metal: 0.6 });
  w.cyl(0.06, 0.06, 2.6, post, x, y + 1.3, z, { seg: 8, collide: false });
  w.sign(o.text ?? "28", 0.9, 0.5, x, y + 2.5, z, ry, { bg: "#ffd23f", fg: "#1a1a1a" });
}

// ------------------------------------------------------------ lanterns
export function lantern(w, x, y, z, color = 0xff3a3a, o = {}) {
  const m = w.mesh(new THREE.SphereGeometry(o.r ?? 0.35, 14, 10), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: o.ei ?? 1.4, roughness: 0.8 }), x, y, z, { cast: false });
  m.scale.y = o.tall ?? 1.25;
  w.cyl(0.02, 0.02, o.string ?? 0.6, M(0x3a2a1a), x, y + (o.r ?? 0.35) * (o.tall ?? 1.25) + (o.string ?? 0.6) / 2, z, { seg: 5, collide: false, cast: false });
  w.mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8), M(0xffd166, { metal: 0.6 }), x, y - (o.r ?? 0.35) * (o.tall ?? 1.25), z, { cast: false });
  if (o.light) { const l = new THREE.PointLight(color, o.light, 8, 1.8); l.position.set(x, y, z); w.scene.add(l); }
  return m;
}
export function lanternString(w, x0, z0, x1, z1, y, n = 6, colors = [0xff3a3a, 0xffd23f, 0xff8a2a, 0x3ad06a, 0xff8ac8]) {
  const rope = M(0x3a2a1a);
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
  w.box(0.03, 0.03, len, rope, (x0 + x1) / 2, y + 0.7, (z0 + z1) / 2, { ry, collide: false, cast: false });
  for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; lantern(w, x0 + (x1 - x0) * f, y - Math.sin(f * Math.PI) * 0.3, z0 + (z1 - z0) * f, colors[i % colors.length], { r: 0.3, string: 0.5 }); }
}
// a little paper lantern boat, drifting on the water
export function lanternBoat(w, x, z, color = 0xffd23f, o = {}) {
  const g = new THREE.Group(); g.userData.dynamic = true; w.scene.add(g);
  const paper = new THREE.MeshStandardMaterial({ color: 0xfff4d0, roughness: 0.9 });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.28, 0.16, 8), paper); hull.position.y = 0.05; g.add(hull);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5 })); flame.position.y = 0.22; g.add(flame);
  const ph = Math.random() * 6;
  w.updaters.push((dt, t) => { const s = w.sea; const yy = s ? s.height(x + Math.sin(t * 0.2 + ph) * (o.drift ?? 1.5), z) : (o.y ?? 0); g.position.set(x + Math.sin(t * 0.2 + ph) * (o.drift ?? 1.5), yy, z + Math.cos(t * 0.17 + ph) * (o.drift ?? 1.5)); g.rotation.y = t * 0.1 + ph; flame.material.emissiveIntensity = 2 + Math.sin(t * 7 + ph) * 0.6; });
  return g;
}

// ------------------------------------------------------------ trees and plants
// an upside-down tree: a fat trunk with a flat top you can land on, and a few stubby branches
export function baobab(w, x, z, h = 12, o = {}) {
  const y = o.y ?? groundAt(w, x, z), bark = M(o.color ?? 0x9a7a5a, { rough: 0.95 });
  const R = rng(Math.round(x * 5 + z * 3) + 1);
  w.cyl(h * 0.11, h * 0.16, h, bark, x, y + h / 2, z, { seg: 14, collide: false });
  w.phys.fixedCyl(x, y + h / 2, z, h * 0.16, h / 2);
  const top = y + h;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + R() * 0.5, bl = h * (0.18 + R() * 0.12); const br = w.mesh(new THREE.CylinderGeometry(h * 0.015, h * 0.04, bl, 7), bark, x + Math.cos(a) * bl * 0.4, top + bl * 0.35, z + Math.sin(a) * bl * 0.4, { collide: false }); br.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9, "YXZ"); for (let k = 0; k < 2; k++) w.mesh(new THREE.IcosahedronGeometry(h * 0.05 + R() * 0.3, 1), M(o.leaf ?? 0x5a8a3a, { rough: 0.9 }), x + Math.cos(a) * bl * (0.6 + k * 0.25), top + bl * (0.55 + k * 0.2), z + Math.sin(a) * bl * (0.6 + k * 0.25), { collide: false }); }
  // the flat crown you can stand on: broader than the trunk, like a table
  w.phys.fixedCyl(x, top + 0.1, z, h * 0.16, 0.1);
  w.cyl(h * 0.2, h * 0.14, 0.2, bark, x, top + 0.1, z, { seg: 16, collide: false });
  // o.climb: stubs of branch spiralling up the trunk, a hop apart, so the top can be climbed
  if (o.climb) { const rr = h * 0.16 + 0.85; let a = o.climb === true ? 0 : o.climb; for (let yy = 0.32; yy < h + 0.1; yy += 0.32) { w.box(1.7, 0.25, 0.75, bark, x + Math.cos(a) * rr, y + yy - 0.1, z + Math.sin(a) * rr, { ry: -a }); a += 0.6 / rr; } }
  return top + 0.2;
}
export function cactus(w, x, z, h = 3, o = {}) {
  const y = o.y ?? groundAt(w, x, z), green = M(0x4a8a4a, { rough: 0.9 });
  w.cyl(0.32, 0.36, h, green, x, y + h / 2, z, { seg: 10 });
  w.mesh(new THREE.SphereGeometry(0.32, 10, 8), green, x, y + h, z, { collide: false });
  for (const s of [-1, 1]) { if (o.arms === false) continue; w.mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.9, 8), green, x + s * 0.55, y + h * 0.5, z, { collide: false, rz: s * Math.PI / 2 }); w.mesh(new THREE.CylinderGeometry(0.18, 0.2, h * 0.4, 8), green, x + s * 0.95, y + h * 0.5 + h * 0.2, z, { collide: false }); w.mesh(new THREE.SphereGeometry(0.18, 8, 6), green, x + s * 0.95, y + h * 0.5 + h * 0.4, z, { collide: false }); }
  if (o.flower) w.mesh(new THREE.SphereGeometry(0.16, 8, 6), M(o.flower, { emissive: o.flower, ei: 0.4 }), x, y + h + 0.3, z, { cast: false });
}
export function deadTree(w, x, y, z, h = 6, o = {}) {
  const black = M(o.color ?? 0x14100c, { rough: 1 }), R = rng(Math.round(x * 3 + z * 5) + 2);
  w.cyl(h * 0.03, h * 0.07, h * 0.6, black, x, y + h * 0.3, z, { seg: 8 });
  for (let i = 0; i < 4; i++) { const a = R() * 6.28, bl = h * (0.3 + R() * 0.25), tilt = 0.5 + R() * 0.5; const b = w.mesh(new THREE.CylinderGeometry(h * 0.008, h * 0.025, bl, 6), black, x + Math.cos(a) * Math.sin(tilt) * bl * 0.5, y + h * 0.55 + Math.cos(tilt) * bl * 0.5, z + Math.sin(a) * Math.sin(tilt) * bl * 0.5, { collide: false }); b.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt, "YXZ"); }
}
export function reeds(w, x, z, n = 8, o = {}) { const y = o.y ?? groundAt(w, x, z), R = rng(Math.round(x + z * 7)); for (let i = 0; i < n; i++) w.cyl(0.02, 0.03, 1.2 + R(), M(0x6a8a3a), x + (R() - 0.5) * 2, y + 0.6, z + (R() - 0.5) * 2, { seg: 5, collide: false, cast: false }); }

// ------------------------------------------------------------ animals
function bob(w, g, ph, amp = 0.05) { w.updaters.push((dt, t) => { g.position.y = g.userData.y0 + Math.sin(t * 1.5 + ph) * amp; }); }
export function flamingo(w, x, y, z, ry = 0, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.userData.y0 = y; g.userData.dynamic = true; w.scene.add(g);
  const pink = M(o.color ?? 0xff8ac8, { rough: 0.8 }), dark = M(0x2a1a1a), leg = M(0xff9ab0);
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  const s = o.s ?? 1;
  add(new THREE.SphereGeometry(0.32 * s, 12, 10), pink, 0, 1.15 * s, 0).scale.set(1, 0.8, 1.4);
  const wing = add(new THREE.SphereGeometry(0.3 * s, 10, 8), M(0xff5a9a), 0, 1.25 * s, -0.05 * s); wing.scale.set(0.9, 0.5, 1.2);
  const neck = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 1.2 * s, 0.35 * s), V(0, 1.6 * s, 0.55 * s), V(0, 2.0 * s, 0.4 * s), V(0, 2.15 * s, 0.2 * s)]), 12, 0.06 * s, 6);
  add(neck, pink, 0, 0, 0);
  add(new THREE.SphereGeometry(0.12 * s, 10, 8), pink, 0, 2.15 * s, 0.15 * s);
  const beak = add(new THREE.ConeGeometry(0.06 * s, 0.3 * s, 6), dark, 0, 2.05 * s, 0.3 * s); beak.rotation.x = 2.2;
  add(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 1.0 * s, 6), leg, 0.08 * s, 0.5 * s, 0);
  if (!o.oneLeg) add(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 1.0 * s, 6), leg, -0.08 * s, 0.5 * s, 0); else { const l2 = add(new THREE.CylinderGeometry(0.025 * s, 0.03 * s, 0.5 * s, 6), leg, -0.1 * s, 0.9 * s, 0.15 * s); l2.rotation.x = 1.2; }
  bob(w, g, x + z, 0.03);
  return g;
}
export function reindeer(w, x, z, ry = 0, o = {}) {
  const y = o.y ?? groundAt(w, x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.userData.y0 = y; g.userData.dynamic = true; w.scene.add(g);
  const fur = M(0x8a6a4a, { rough: 0.95 }), pale = M(0xd8c8b0), horn = M(0xe8dcc0), nose = M(o.red ? 0xff2a2a : 0x2a1a1a, { emissive: o.red ? 0xff2a2a : 0, ei: 1.5 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.CapsuleGeometry(0.35, 0.8, 6, 12), fur, 0, 1.0, 0).rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(0.3, 10, 8), pale, 0, 0.95, -0.55);
  const neck = add(new THREE.CapsuleGeometry(0.16, 0.5, 4, 8), fur, 0, 1.35, 0.55); neck.rotation.x = 0.6;
  const head = add(new THREE.BoxGeometry(0.28, 0.28, 0.5), fur, 0, 1.65, 0.85);
  add(new THREE.SphereGeometry(0.07, 8, 6), nose, 0, 1.62, 1.12);
  for (const s of [-1, 1]) { const a = add(new THREE.CylinderGeometry(0.025, 0.035, 0.7, 6), horn, s * 0.12, 2.1, 0.75); a.rotation.z = s * 0.4; const b = add(new THREE.CylinderGeometry(0.02, 0.03, 0.4, 6), horn, s * 0.3, 2.35, 0.7); b.rotation.z = s * 1.2; const c = add(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 6), horn, s * 0.18, 2.4, 0.9); c.rotation.x = -0.9; }
  for (const [sx, sz] of [[-0.2, 0.35], [0.2, 0.35], [-0.2, -0.35], [0.2, -0.35]]) add(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 6), fur, sx, 0.45, sz);
  w.phys.fixedCyl(x, y + 0.8, z, 0.5, 0.8);
  void head;
  return g;
}
export function lemur(w, x, y, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.userData.y0 = y; g.userData.dynamic = true; w.scene.add(g);
  const grey = M(0x8a8a90, { rough: 0.9 }), white = M(0xf4f4f0), black = M(0x14141a), gold = M(0xffb020, { emissive: 0xffb020, ei: 0.4 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.CapsuleGeometry(0.16, 0.3, 6, 10), grey, 0, 0.4, 0);
  add(new THREE.SphereGeometry(0.15, 10, 8), white, 0, 0.72, 0.05);
  add(new THREE.BoxGeometry(0.1, 0.08, 0.12), black, 0, 0.68, 0.18);
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.05, 8, 6), gold, s * 0.07, 0.76, 0.13); add(new THREE.SphereGeometry(0.05, 8, 6), black, s * 0.14, 0.85, 0); }
  // the ringed tail curls up over the back
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(V(0, 0.3 + Math.sin(t * 2.6) * 0.6, -0.15 - t * 0.35 + (1 - Math.cos(t * 2.6)) * 0.2)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  for (let i = 0; i < 12; i++) { const p = curve.getPointAt(i / 12); add(new THREE.SphereGeometry(0.06, 8, 6), i % 2 ? black : white, p.x, p.y, p.z); }
  for (const sx of [-0.1, 0.1]) add(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 6), grey, sx, 0.15, 0.05);
  bob(w, g, x * 3 + z, 0.02);
  return g;
}
// one of PALETTE's cousins: a small chameleon in a colour of its own, sitting on something
export function chameleon(w, x, y, z, hue = 0.33, ry = 0) {
  const c = new Palette(0.36); c.root.position.set(x, y, z); c.root.rotation.y = ry; c.setHue(hue); c.hue = hue; c.root.userData.dynamic = true;
  w.scene.add(c.root);
  w.updaters.push(dt => c.update(dt));
  return c;
}
export function camelStanding(w, x, z, ry = 0, o = {}) {
  const y = o.y ?? groundAt(w, x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.userData.dynamic = true; w.scene.add(g);
  const fur = M(0xc8a060, { rough: 0.95 }), dark = M(0x8a6a3a, { rough: 0.9 }), s = o.s ?? 0.9;
  const m = (geo, mt, px, py, pz) => { const me = new THREE.Mesh(geo, mt); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  m(new THREE.CapsuleGeometry(0.45 * s, 1.0 * s, 8, 14), fur, 0, 1.25 * s, 0).rotation.x = Math.PI / 2;
  m(new THREE.SphereGeometry(0.42 * s, 12, 10), fur, 0, 1.72 * s, 0.05 * s).scale.set(0.8, 0.8, 1);
  m(new THREE.CapsuleGeometry(0.16 * s, 0.9 * s, 6, 10), fur, 0, 1.75 * s, 0.75 * s).rotation.x = 0.5;
  m(new THREE.BoxGeometry(0.28 * s, 0.26 * s, 0.5 * s), fur, 0, 2.15 * s, 1.15 * s);
  m(new THREE.BoxGeometry(0.7 * s, 0.14 * s, 0.9 * s), M(o.blanket ?? 0xd83a6a, { rough: 0.8 }), 0, 1.55 * s, -0.35 * s);
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { m(new THREE.CapsuleGeometry(0.08 * s, 0.95 * s, 4, 8), fur, sx * 0.25 * s, 0.55 * s, sz * 0.5 * s); m(new THREE.SphereGeometry(0.11 * s, 8, 6), dark, sx * 0.25 * s, 0.05 * s, sz * 0.5 * s); }
  w.phys.fixedBox(x, y + 1, z, 0.5, 1, 1.0, ry);
  return g;
}

// ------------------------------------------------------------ buildings
// a dome on a drum, tiled; o.color the tile colour, o.gold a gold finial
export function dome(w, x, y, z, r, o = {}) {
  const tile = tileMat(o.color ?? 0x2ab8c8, o.seed ?? 1);
  w.cyl(r, r, o.drum ?? r * 0.5, tile, x, y + (o.drum ?? r * 0.5) / 2, z, { seg: 24 });
  const d = w.mesh(new THREE.SphereGeometry(r, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), tile, x, y + (o.drum ?? r * 0.5), z, { collide: false });
  d.scale.y = o.tall ?? 1.15;
  w.phys.fixedBall(x, y + (o.drum ?? r * 0.5), z, r * 0.95);
  const topY = y + (o.drum ?? r * 0.5) + r * (o.tall ?? 1.15);
  w.phys.fixedCyl(x, topY - 0.05, z, r * 0.3, 0.05);   // a flat spot on the very top to stand on
  w.mesh(new THREE.SphereGeometry(r * 0.08, 10, 8), M(0xffd166, { metal: 0.9, rough: 0.2 }), x, topY + r * 0.06, z, { collide: false });
  return topY;
}
export function tileMat(color, seed = 1) {
  const t = canvasTex("tile" + color + seed, 128, (g, W, H) => {
    g.fillStyle = css(color); g.fillRect(0, 0, W, H);
    const R = rng(seed + 3);
    for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) { const k = R(); g.fillStyle = k < 0.15 ? "#f4f0e0" : k < 0.3 ? "#1a2a6a" : `rgba(255,255,255,${(k - 0.3) * 0.25})`; g.fillRect(xx * 16 + 1, yy * 16 + 1, 14, 14); if (k > 0.85) { g.fillStyle = "#ffd166"; g.fillRect(xx * 16 + 5, yy * 16 + 5, 6, 6); } }
  });
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.05 });
  return m;
}
// a minaret: a tall tower with a balcony you can stand on and a little dome on top
export function minaret(w, x, z, h = 16, o = {}) {
  const y = o.y ?? groundAt(w, x, z), tile = tileMat(o.color ?? 0x2ab8c8, o.seed ?? 2), stone = M("stone", { args: [o.seed ?? 4, [214, 190, 150]], repeat: [2, 4] });
  w.cyl(1.2, 1.5, h, stone, x, y + h / 2, z, { seg: 16 });
  w.cyl(1.9, 1.7, 0.4, tile, x, y + h * 0.75, z, { seg: 16 });   // the balcony
  w.cyl(1.0, 1.0, h * 0.2, tile, x, y + h + h * 0.1, z, { seg: 16 });
  dome(w, x, y + h * 1.2, z, 1.1, { color: o.color, drum: 0.2, tall: 1 });
  return y + h * 0.75 + 0.2;
}
// a portal: a big arch in a tiled wall, the way into a madrasa (the arch is open: walk through)
export function iwan(w, x, z, wd, h, d, ry, o = {}) {
  const y = o.y ?? groundAt(w, x, z), tile = tileMat(o.color ?? 0x2ab8c8, o.seed ?? 3), stone = M("stone", { args: [o.seed ?? 5, [214, 190, 150]], repeat: [3, 3] });
  const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
  const at = (dx, dy, dz) => [x + sx * dx + fx * dz, y + dy, z + sz * dx + fz * dz];
  const open = o.open ?? wd * 0.4;
  for (const s of [-1, 1]) w.box((wd - open) / 2, h, d, tile, ...at(s * (open / 2 + (wd - open) / 4), h / 2, 0), { ry });
  w.box(open + 0.2, h * 0.3, d, tile, ...at(0, h * 0.85, 0), { ry });
  // the arch's curve, as a ring of blocks
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i + 0.5) / 9; w.box(open * 0.22, 0.5, d + 0.1, stone, ...at(Math.cos(a) * open / 2, h * 0.55 + Math.sin(a) * open * 0.3, 0), { ry, rz: a - Math.PI / 2, collide: false }); }
  w.box(wd, 0.5, d, stone, ...at(0, h + 0.25, 0), { ry });
  return y + h + 0.5;
}
export function column(w, x, y, z, r, h, mat) { w.cyl(r, r * 1.1, h, mat, x, y + h / 2, z, { seg: 14 }); w.cyl(r * 1.4, r * 1.4, 0.3, mat, x, y + h + 0.15, z, { seg: 14, collide: false }); w.cyl(r * 1.3, r * 1.3, 0.25, mat, x, y + 0.12, z, { seg: 14, collide: false }); }
// the sandstone of Petra, in stripes of pink, red and orange
export function sandstone(seed = 1, base = [214, 120, 100]) {
  const t = canvasTex("sandstone" + seed + base, 256, (g, W, H) => {
    const R = rng(seed);
    for (let yy = 0; yy < H; yy += 6) { const k = (R() - 0.5) * 60, tint = R(); g.fillStyle = `rgb(${Math.min(255, base[0] + k + (tint > 0.7 ? 20 : 0))},${Math.min(255, base[1] + k * 0.8 + (tint < 0.3 ? 10 : 0))},${Math.min(255, base[2] + k * 0.6)})`; g.fillRect(0, yy, W, 6 + R() * 4); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.1})`; g.fillRect(R() * W, R() * H, 2 + R() * 6, 1 + R() * 2); }
  });
  const m = new THREE.MeshStandardMaterial({ map: t.clone(), roughness: 0.95 }); m.map.repeat.set(2, 3); m.map.needsUpdate = true;
  return m;
}
// a temple front carved into the rock: columns, a pediment, a dark doorway
export function treasury(w, x, z, ry, o = {}) {
  const y = o.y ?? 0, rock = o.mat || sandstone(3), dark = M(0x1a0c0c);
  const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
  const at = (dx, dy, dz) => [x + sx * dx + fx * dz, y + dy, z + sz * dx + fz * dz];
  const W = o.w ?? 18, H = o.h ?? 22;
  w.box(W + 10, H + 12, 10, rock, ...at(0, (H + 12) / 2, -6), { ry });          // the cliff behind
  w.box(W * 0.24, 4.5, 3, dark, ...at(0, 2.25, -1.5), { ry, collide: false });      // the doorway
  for (const dx of [-W * 0.4, -W * 0.15, W * 0.15, W * 0.4]) column(w, ...at(dx, 0, -0.5), 0.6, H * 0.45, rock);
  w.box(W, 1.2, 3, rock, ...at(0, H * 0.45 + 0.9, -1.5), { ry });                 // the entablature
  const ped = w.mesh(new THREE.CylinderGeometry(0.01, W * 0.62, H * 0.16, 3), rock, ...at(0, H * 0.45 + 1.5 + H * 0.08, -1.5), { ry: ry + Math.PI / 2, collide: false }); ped.scale.z = 0.3;
  for (const dx of [-W * 0.3, 0, W * 0.3]) column(w, ...at(dx, H * 0.45 + 1.5 + H * 0.16, -0.5), 0.5, H * 0.3, rock);
  w.cyl(W * 0.1, W * 0.1, H * 0.3, rock, ...at(0, H * 0.45 + 1.5 + H * 0.16 + H * 0.15, -0.5), { seg: 14, collide: false });
  w.box(W, 1.0, 3, rock, ...at(0, H * 0.45 + 1.5 + H * 0.16 + H * 0.3 + 0.5, -1.5), { ry, collide: false });
}
export function tent(w, x, z, ry = 0, o = {}) {
  const y = o.y ?? groundAt(w, x, z), cloth = M(o.color ?? 0x8a8a92, { rough: 0.9, side: THREE.DoubleSide });
  const c = w.cone(2.6, 3.2, cloth, x, y + 1.6, z, { ry }); c.geometry = new THREE.ConeGeometry(2.6, 3.2, 4, 1, true); c.rotation.y = ry + Math.PI / 4;
  w.cyl(0.06, 0.06, 3.2, M(0x6a4a30), x, y + 1.6, z, { seg: 6 });
  w.phys.fixedBox(x, y + 1, z, 1.6, 1, 1.6, ry);
}
export function campfire(w, x, z, o = {}) {
  const y = o.y ?? groundAt(w, x, z);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; w.mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6), M(0x4a3020), x, y + 0.12, z, { ry: a, rx: Math.PI / 2, collide: false }); }
  const fl = w.mesh(new THREE.ConeGeometry(0.3, 0.9, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a20).multiplyScalar(3), transparent: true, opacity: 0.85 }), x, y + 0.5, z, { cast: false }); fl.userData.dynamic = true;
  const l = new THREE.PointLight(0xff8a30, 6, 12, 1.6); l.position.set(x, y + 1, z); w.scene.add(l);
  w.updaters.push((dt, t) => { fl.scale.set(0.8 + Math.sin(t * 13) * 0.2, 0.8 + Math.sin(t * 9) * 0.3, 0.8 + Math.cos(t * 11) * 0.2); l.intensity = 5 + Math.sin(t * 10) * 1.5; });
}
// a wooden cabin, painted Finnish red with white corners
export function cabin(w, x, z, sx, h, sz, ry, o = {}) {
  const y = o.y ?? groundAt(w, x, z);
  w.building(sx, h, sz, x, z, { ry, wall: o.wall ?? [170, 40, 36], seed: o.seed ?? 12, roof: "pitched", roofColor: o.roofColor ?? [240, 244, 250], win: { lit: 0.6, glow: "#ffe6a8", glass: "#3a5a7a" }, y });
  const fx = Math.sin(ry), fz = Math.cos(ry), sxx = Math.cos(ry), szz = -Math.sin(ry);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(0.3, h, 0.3, M(0xf4f4f0), x + sxx * dx * sx / 2 + fx * dz * sz / 2, y + h / 2, z + szz * dx * sx / 2 + fz * dz * sz / 2, { collide: false });
  // a woodpile against the side, and a chimney
  if (o.wood !== false) { const wood = M("wood", { args: [21, [150, 110, 70]] }); w.box(2.4, 1.1, 1.0, wood, x + sxx * (sx / 2 + 0.6) - fx * 0.5, y + 0.55, z + szz * (sx / 2 + 0.6) - fz * 0.5, { ry }); }
  w.box(0.6, 1.4, 0.6, M(0x5a5a60), x + sxx * sx * 0.25, y + h + h * 0.2 + 0.3, z + szz * sx * 0.25, { collide: false });
  return y + h;
}
export const iceMat = () => new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.55, transmission: 0, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.FrontSide });
export function snowman(w, x, z, o = {}) { const y = o.y ?? groundAt(w, x, z), snow = M(0xf4f8fc); for (const [r, yy] of [[0.7, 0.6], [0.5, 1.6], [0.36, 2.35]]) w.sphere(r, snow, x, y + yy, z); w.mesh(new THREE.ConeGeometry(0.05, 0.3, 6), M(0xff8a2a), x, y + 2.35, z + 0.4, { rx: Math.PI / 2, collide: false }); w.phys.fixedCyl(x, y + 1.2, z, 0.7, 1.2); }

// ------------------------------------------------------------ water
// a waterfall: a sheet of water down a cliff, with mist at the foot
export function waterfall(w, x, ytop, ybot, z, wd = 4, o = {}) {
  const t = canvasTex("fall", 128, (g, W, H) => { g.fillStyle = "rgba(190,230,255,1)"; g.fillRect(0, 0, W, H); const R = rng(9); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.6})`; g.fillRect(R() * W, R() * H, 2 + R() * 4, 10 + R() * 40); } });
  const mat = new THREE.MeshStandardMaterial({ map: t.clone(), transparent: true, opacity: 0.8, roughness: 0.2, emissive: 0x4a8aa0, emissiveIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  mat.map.repeat.set(wd / 3, (ytop - ybot) / 4); mat.map.needsUpdate = true;
  const m = w.mesh(new THREE.PlaneGeometry(wd, ytop - ybot), mat, x, (ytop + ybot) / 2, z, { ry: o.ry ?? 0, cast: false, collide: false }); m.userData.dynamic = true; m.renderOrder = 2;
  w.updaters.push((dt, t2) => { mat.map.offset.y = -t2 * 0.8; if (w.fx && Math.random() < dt * 6) w.fx.burst(x + (Math.random() - 0.5) * wd, ybot + 0.3, z + Math.sin(o.ry ?? 0) * 0 + (Math.random() - 0.5) * 1, 0xffffff, 3, { speed: 1.2, up: 2, life: 1.2, size: 0.6, gravity: -2, bright: 1.3 }); });
  return m;
}
// a boardwalk along [x, y, z] points: planks with a rail on each side
export function boardwalk(w, pts, o = {}) {
  const wood = M("wood", { args: [33, [160, 120, 80]], repeat: [1, 3] }), rail = M(0x8a6a44);
  const wd = o.w ?? 2.4;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay, az] = pts[i], [bx, by, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az), rise = by - ay, l3 = Math.hypot(len, rise), rx = -Math.atan2(rise, len);
    const cx = (ax + bx) / 2, cy = (ay + by) / 2, cz = (az + bz) / 2;
    w.box(wd, 0.2, l3 + 0.3, wood, cx, cy, cz, { ry, rx });
    if (o.rails !== false) for (const s of [-1, 1]) { const ox = Math.cos(ry) * s * (wd / 2 - 0.1), oz = -Math.sin(ry) * s * (wd / 2 - 0.1); w.box(0.06, 0.06, l3, rail, cx + ox, cy + 0.95, cz + oz, { ry, rx, collide: false, cast: false }); for (let k = 0; k <= Math.round(l3 / 2.5); k++) { const f = Math.round(l3 / 2.5) ? k / Math.round(l3 / 2.5) : 0.5; w.box(0.07, 0.95, 0.07, rail, ax + (bx - ax) * f + ox, ay + (by - ay) * f + 0.5, az + (bz - az) * f + oz, { collide: false, cast: false }); } }
    if (o.posts !== false) for (let k = 0; k <= Math.round(l3 / 4); k++) { const f = Math.round(l3 / 4) ? k / Math.round(l3 / 4) : 0.5; for (const s of [-1, 1]) w.cyl(0.08, 0.1, 6, rail, ax + (bx - ax) * f + Math.cos(ry) * s * (wd / 2 - 0.2), ay + (by - ay) * f - 3, az + (bz - az) * f - Math.sin(ry) * s * (wd / 2 - 0.2), { seg: 6, collide: false, cast: false }); }
  }
}
// the salt flat's honeycomb of ridges
export function saltMat(seed = 1) {
  const t = canvasTex("salt" + seed, 256, (g, W, H) => {
    g.fillStyle = "#f4f2ec"; g.fillRect(0, 0, W, H); g.strokeStyle = "#d8d4c8"; g.lineWidth = 3;
    const r = 24; for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) { const cx = col * r * 1.5 + (row % 2 ? r * 0.75 : 0), cy = row * r * 0.87 * 1.0 + 12; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; g.lineTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5); } g.closePath(); g.stroke(); }
  });
  const m = new THREE.MeshStandardMaterial({ map: t.clone(), roughness: 0.6, metalness: 0.05 }); m.map.repeat.set(60, 60); m.map.needsUpdate = true;
  return m;
}
export function saltBlock(w, x, y, z, s = 0.9, o = {}) { return w.crate(x, y, z, s, { mat: M(0xf4f2ea, { rough: 0.5 }), ...o }); }
// a rusting steam engine off its rails
export function trainWreck(w, x, z, ry = 0, o = {}) {
  const y = o.y ?? groundAt(w, x, z), rust = M("metal", { args: [17, [120, 70, 50]], repeat: [3, 1] }), dark = M(0x2a2420, { rough: 0.9 });
  const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
  const at = (dx, dy, dz) => [x + sx * dx + fx * dz, y + dy, z + sz * dx + fz * dz];
  w.box(2.6, 1.0, 9, dark, ...at(0, 0.5, 0), { ry });
  const boiler = w.mesh(new THREE.CylinderGeometry(1.1, 1.1, 5.5, 16), rust, ...at(0, 2.1, 1.2), { rx: Math.PI / 2, ry, collide: false }); void boiler;
  w.phys.fixedBox(...at(0, 2.1, 1.2), 1.1, 1.1, 2.75, ry);
  w.box(2.6, 2.6, 2.6, rust, ...at(0, 2.3, -2.8), { ry });
  w.cyl(0.4, 0.5, 1.6, dark, ...at(0, 3.9, 3.4), { seg: 10, collide: false });
  for (const dz of [-3, -1, 1, 3]) for (const s of [-1, 1]) w.mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 12), dark, ...at(s * 1.4, 0.6, dz), { rz: Math.PI / 2, ry, collide: false });
  return y + 3.6;
}
export function trainRails(w, x0, z0, x1, z1, o = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), y = o.y ?? groundAt(w, (x0 + x1) / 2, (z0 + z1) / 2);
  const steel = M(0x6a5a50, { metal: 0.6, rough: 0.6 }), sleeper = M(0x4a3a2a);
  for (const s of [-0.72, 0.72]) w.box(0.1, 0.12, len, steel, (x0 + x1) / 2 + Math.cos(ry) * s, y + 0.16, (z0 + z1) / 2 - Math.sin(ry) * s, { ry, collide: false, cast: false });
  for (let d = 0; d < len; d += 1.2) w.box(2.2, 0.1, 0.3, sleeper, x0 + Math.sin(ry) * d, y + 0.05, z0 + Math.cos(ry) * d, { ry, collide: false, cast: false });
}

// ------------------------------------------------------------ market and gallery
// a market stall: a table, a striped awning and piles of colourful goods
export function stall(w, x, z, ry = 0, o = {}) {
  const y = o.y ?? groundAt(w, x, z), wood = M("wood", { args: [22, [150, 110, 70]] });
  const a = o.awning ?? 0xd83a2a;
  const t = canvasTex("awning" + a, 64, (g, W, H) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#f4f4f0" : css(a); g.fillRect(i * 16, 0, 16, H); } });
  const awn = new THREE.MeshStandardMaterial({ map: t.clone(), roughness: 0.8, side: THREE.DoubleSide }); awn.map.repeat.set(3, 1); awn.map.needsUpdate = true;
  w.box(3, 0.1, 1.6, wood, x, y + 0.9, z, { ry });
  w.phys.fixedBox(x, y + 0.45, z, 1.5, 0.45, 0.8, ry);
  const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
  for (const [dx, dz] of [[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]]) w.cyl(0.05, 0.05, 2.6, wood, x + sx * dx + fx * dz, y + 1.3, z + sz * dx + fz * dz, { seg: 6, collide: false });
  const roof = w.box(3.4, 0.06, 2.0, awn, x, y + 2.6, z, { ry, collide: false }); roof.rotation.x = 0.12;
  const goods = o.goods || [0xff3a3a, 0xffd23f, 0x3ad06a];
  goods.forEach((c, i) => { const gx = x + sx * (-1 + i * 1.0), gz = z + sz * (-1 + i * 1.0); w.box(0.8, 0.3, 0.8, M(0x8a6a44), gx, y + 1.1, gz, { ry, collide: false }); for (let k = 0; k < 5; k++) w.mesh(new THREE.SphereGeometry(0.13, 8, 6), M(c, { rough: 0.6 }), gx + Math.cos(k * 1.3) * 0.2, y + 1.32 + (k === 4 ? 0.2 : 0), gz + Math.sin(k * 1.3) * 0.2, { cast: false }); });
  return y + 0.95;
}
// a sack of spice, open at the top, heaped with colour
export function spiceSack(w, x, z, color, o = {}) {
  const y = o.y ?? groundAt(w, x, z);
  w.cyl(0.42, 0.36, 0.7, M(0xc8b090, { rough: 0.95 }), x, y + 0.35, z, { seg: 12 });
  const heap = w.mesh(new THREE.SphereGeometry(0.38, 12, 8), M(color, { rough: 1 }), x, y + 0.66, z, { collide: false }); heap.scale.y = 0.45;
  return heap;
}
// a length of silk hanging from a rail, waving
export function silk(w, x, y, z, ry, color, wd = 1.4, h = 3.2) {
  const geo = new THREE.PlaneGeometry(wd, h, 4, 10); geo.translate(0, -h / 2, 0);
  const m = w.mesh(geo, M(color, { rough: 0.7, side: THREE.DoubleSide }), x, y, z, { ry, cast: false }); m.userData.dynamic = true;
  const base = Float32Array.from(geo.attributes.position.array), ph = x + z;
  w.updaters.push((dt, t) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const yy = base[i * 3 + 1]; p.setZ(i, Math.sin(t * 1.4 + ph + yy * 1.2) * 0.12 * (-yy / h)); } p.needsUpdate = true; });
  return m;
}
export function silkRail(w, x0, z0, x1, z1, y, colors, n = 5) { const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0); w.box(0.05, 0.05, len, M(0x6a4a30), (x0 + x1) / 2, y, (z0 + z1) / 2, { ry, collide: false, cast: false }); for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; silk(w, x0 + (x1 - x0) * f, y - 0.05, z0 + (z1 - z0) * f, ry + Math.PI / 2, colors[i % colors.length]); } }
// a framed painting on a wall (o.blank: an empty grey canvas)
export function painting(w, x, y, z, ry, pw = 2, ph = 1.5, o = {}) {
  const seed = o.seed ?? Math.abs(Math.round(x * 3 + y * 5 + z * 7));
  const t = canvasTex("paint" + seed + (o.blank ? "b" : ""), 128, (g, W, H) => {
    const R = rng(seed + 1);
    g.fillStyle = o.blank ? "#a0a0a8" : ["#ffe8c0", "#c8e8ff", "#f8d0d8", "#d8f4d0"][seed % 4]; g.fillRect(0, 0, W, H);
    if (o.blank) return;
    const cols = ["#d83a2a", "#ffd23f", "#2a8ad8", "#3ad06a", "#ff8a2a", "#9a4aff", "#ff8ac8"];
    for (let i = 0; i < 7; i++) { g.fillStyle = cols[Math.floor(R() * cols.length)]; g.beginPath(); g.ellipse(R() * W, R() * H, 10 + R() * 30, 8 + R() * 24, R() * 3, 0, 7); g.fill(); }
    g.fillStyle = "#1a1a2a"; for (let i = 0; i < 3; i++) g.fillRect(R() * W, R() * H, 3 + R() * 20, 2 + R() * 4);
  });
  const gold = M(o.frame ?? 0xd8a840, { metal: 0.8, rough: 0.3 });
  const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
  w.mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), x + fx * 0.06, y, z + fz * 0.06, { ry, cast: false });
  for (const s of [-1, 1]) { w.box(pw + 0.16, 0.08, 0.06, gold, x + fx * 0.05, y + s * (ph / 2 + 0.04), z + fz * 0.05, { ry, collide: false, cast: false }); w.box(0.08, ph + 0.16, 0.06, gold, x + fx * 0.05 + sx * s * (pw / 2 + 0.04), y, z + fz * 0.05 + sz * s * (pw / 2 + 0.04), { ry, collide: false, cast: false }); }
}
// a glass jar of colour on a plinth: the Baroness's collection
export function jar(w, x, y, z, color, o = {}) {
  w.cyl(0.5, 0.55, 1.0, M(0x2a2a30, { metal: 0.4 }), x, y + 0.5, z, { seg: 12 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, depthWrite: false });
  w.mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.9, 14), glass, x, y + 1.45, z, { collide: false, cast: false });
  const fill = w.mesh(new THREE.CylinderGeometry(0.3, 0.3, o.full ?? 0.5, 14), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.3 }), x, y + 1.0 + (o.full ?? 0.5) / 2, z, { collide: false, cast: false });
  w.mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 14), M(0xffd166, { metal: 0.8, rough: 0.3 }), x, y + 1.95, z, { collide: false });
  return fill;
}

// ------------------------------------------------------------ sky things
// the northern lights: curtains of green and pink that ripple overhead (grey until won back)
export function aurora(w, o = {}) {
  const n = o.n ?? 4, ribbons = [];
  for (let k = 0; k < n; k++) {
    const segs = 40, geo = new THREE.PlaneGeometry(420, 70, segs, 6);
    const col = new Float32Array(geo.attributes.position.count * 3), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const f = (pos.getY(i) + 35) / 70; const c = new THREE.Color().setHSL(0.36 - f * 0.05 + (k % 2) * 0.5 * (f > 0.7 ? 1 : 0), 0.9, 0.5); const a = Math.sin(f * Math.PI); col[i * 3] = c.r * a; col[i * 3 + 1] = c.g * a; col[i * 3 + 2] = c.b * a; }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(0, 120 + k * 12, -160 - k * 60); m.rotation.y = (k - n / 2) * 0.25; m.userData.dynamic = true; m.frustumCulled = false; w.scene.add(m);
    ribbons.push({ m, geo, base: Float32Array.from(pos.array), ph: k * 1.7 });
  }
  w.updaters.push((dt, t) => { for (const r of ribbons) { const p = r.geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = r.base[i * 3], y = r.base[i * 3 + 1]; p.setZ(i, Math.sin(x * 0.02 + t * 0.4 + r.ph) * 12 + Math.sin(x * 0.07 - t * 0.7) * 4 * (y / 35 + 1)); } p.needsUpdate = true; r.m.material.opacity = 0.22 + Math.sin(t * 0.5 + r.ph) * 0.08; } });
}
// Grisaille's airship in the sky, seen from below
export function airshipInSky(w, x, y, z, o = {}) {
  const grey = M(0x9a9aa4, { rough: 0.5, metal: 0.3 }), dark = M(0x3a3a44, { metal: 0.5 });
  const hull = w.mesh(new THREE.SphereGeometry(1, 24, 16), grey, x, y, z, { collide: false }); hull.scale.set(o.s ?? 60, (o.s ?? 60) * 0.28, (o.s ?? 60) * 0.28); hull.rotation.y = o.ry ?? 0;
  const gond = w.mesh(new THREE.BoxGeometry((o.s ?? 60) * 0.5, (o.s ?? 60) * 0.08, (o.s ?? 60) * 0.12), dark, x, y - (o.s ?? 60) * 0.3, z, { collide: false }); gond.rotation.y = o.ry ?? 0;
  for (const s of [-1, 1]) { const fin = w.mesh(new THREE.BoxGeometry(2, (o.s ?? 60) * 0.25, (o.s ?? 60) * 0.15), grey, x - Math.cos(o.ry ?? 0) * (o.s ?? 60) * 0.85, y + s * 4, z + Math.sin(o.ry ?? 0) * (o.s ?? 60) * 0.85, { collide: false }); fin.rotation.y = o.ry ?? 0; }
  const drain = w.mesh(new THREE.ConeGeometry((o.s ?? 60) * 0.5, y - 2, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xc8c8d0, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }), x, y / 2, z, { collide: false, cast: false });
  drain.userData.dynamic = true;
  w.updaters.push((dt, t) => { drain.rotation.y = t * 0.1; drain.material.opacity = 0.06 + Math.sin(t * 1.5) * 0.03; });
  return hull;
}
export { TEX, M };
