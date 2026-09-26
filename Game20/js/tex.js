// Procedural textures drawn on canvases, each with a matching normal map
// worked out from its brightness so bricks, cobbles and panels catch the light.
import * as THREE from "three";

export function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function toTex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
// a normal map from the brightness of a canvas (bright = raised)
function normalFrom(c, strength = 2) {
  const w = c.width, h = c.height;
  const src = c.getContext("2d").getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = (src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11) / 255;
  const out = canvas(w, h), g = out.getContext("2d"), img = g.createImageData(w, h), d = img.data;
  const L = (x, y) => lum[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (L(x + 1, y) - L(x - 1, y)) * strength, dy = (L(x, y + 1) - L(x, y - 1)) * strength;
    const nx = -dx, ny = dy, nz = 1, l = Math.hypot(nx, ny, nz);
    const i = (y * w + x) * 4;
    d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255; d[i + 2] = (nz / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return toTex(out, false);
}
function noise(g, w, h, base, amp, seed, cell = 4) {
  for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
    const n = (hash(x + seed, y) - 0.5) * amp;
    g.fillStyle = `rgb(${clamp(base[0] + n, 0, 255) | 0},${clamp(base[1] + n, 0, 255) | 0},${clamp(base[2] + n, 0, 255) | 0})`;
    g.fillRect(x, y, cell, cell);
  }
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const rgb = (c, k = 0) => `rgb(${clamp(c[0] + k, 0, 255) | 0},${clamp(c[1] + k, 0, 255) | 0},${clamp(c[2] + k, 0, 255) | 0})`;

const cache = new Map();
function make(key, size, draw, strength) {
  if (cache.has(key)) return cache.get(key);
  const c = canvas(size, size), g = c.getContext("2d");
  const extra = draw(g, size, size) || {};
  const r = { map: toTex(c), normalMap: strength ? normalFrom(extra.height || c, strength) : null, emissiveMap: extra.emissive ? toTex(extra.emissive) : null };
  cache.set(key, r);
  return r;
}

export const TEX = {
  grass(seed = 1, base = [86, 140, 58]) {
    return make("grass" + seed + base, 256, (g, w, h) => {
      noise(g, w, h, base, 22, seed, 4);
      const R = rng(seed);
      for (let i = 0; i < 1400; i++) { const x = R() * w, y = R() * h, k = (R() - 0.5) * 50; g.strokeStyle = rgb(base, k); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 3, y - 3 - R() * 5); g.stroke(); }
    }, 1.5);
  },
  paving(seed = 2, base = [178, 172, 160], size = 64) {
    return make("pave" + seed + base + size, 256, (g, w, h) => {
      g.fillStyle = rgb(base, -70); g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) { const k = (hash(x + seed, y) - 0.5) * 26; g.fillStyle = rgb(base, k); rr(g, x + 2, y + 2, size - 4, size - 4, 3); g.fill(); }
      const R = rng(seed); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.08})`; g.fillRect(R() * w, R() * h, 2 + R() * 4, 2 + R() * 4); }
    }, 3);
  },
  cobble(seed = 3, base = [128, 124, 118]) {
    return make("cob" + seed + base, 256, (g, w, h) => {
      g.fillStyle = rgb(base, -80); g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 21) for (let x = -13; x < w; x += 26) { const k = (hash(x + seed, y) - 0.5) * 40; const gr = g.createRadialGradient(x + 13 + ((y / 21) % 2 ? 13 : 0), y + 8, 2, x + 13 + ((y / 21) % 2 ? 13 : 0), y + 10, 14); gr.addColorStop(0, rgb(base, k + 25)); gr.addColorStop(1, rgb(base, k - 25)); g.fillStyle = gr; rr(g, x + 2 + ((y / 21) % 2 ? 13 : 0), y + 2, 22, 17, 7); g.fill(); }
    }, 4);
  },
  brick(seed = 4, a = [160, 70, 50], b = [140, 60, 44], mortar = [200, 190, 175]) {
    return make("brick" + seed + a + b, 256, (g, w, h) => {
      g.fillStyle = rgb(mortar); g.fillRect(0, 0, w, h);
      const bh = 16, bw = 42;
      for (let y = 0; y < h; y += bh) { const off = (y / bh) % 2 ? bw / 2 : 0; for (let x = -bw; x < w + bw; x += bw) { const k = hash(x + seed, y); g.fillStyle = rgb(k < 0.5 ? a : b, (k - 0.5) * 30); g.fillRect(x + off + 1.5, y + 1.5, bw - 3, bh - 3); } }
    }, 3);
  },
  stone(seed = 5, base = [196, 180, 150]) {
    return make("stone" + seed + base, 256, (g, w, h) => {
      g.fillStyle = rgb(base, -60); g.fillRect(0, 0, w, h);
      const bh = 32; for (let y = 0; y < h; y += bh) { let x = -hash(y, seed) * 60; while (x < w) { const bw = 40 + hash(x, y + seed) * 50, k = (hash(x + seed, y) - 0.5) * 30; g.fillStyle = rgb(base, k); rr(g, x + 2, y + 2, bw - 4, bh - 4, 3); g.fill(); x += bw; } }
      const R = rng(seed); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.1})`; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 3); }
    }, 3);
  },
  sand(seed = 6, base = [226, 196, 140]) {
    return make("sand" + seed + base, 256, (g, w, h) => {
      noise(g, w, h, base, 18, seed, 2);
      g.strokeStyle = rgb(base, -30); g.globalAlpha = 0.35; g.lineWidth = 3;
      for (let i = 0; i < 10; i++) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, i * 26 + 8 + Math.sin(x * 0.05 + i) * 6); g.stroke(); }
      g.globalAlpha = 1;
    }, 1.5);
  },
  snow(seed = 7) { return make("snow" + seed, 256, (g, w, h) => { noise(g, w, h, [236, 242, 250], 12, seed, 3); }, 1); },
  wood(seed = 8, base = [150, 100, 60]) {
    return make("wood" + seed + base, 256, (g, w, h) => {
      for (let y = 0; y < h; y += 32) { const k = (hash(seed, y) - 0.5) * 40; g.fillStyle = rgb(base, k); g.fillRect(0, y, w, 31); g.fillStyle = rgb(base, -60); g.fillRect(0, y + 31, w, 1); g.strokeStyle = `rgba(0,0,0,.18)`; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, y + 6 + i * 7); for (let x = 0; x < w; x += 16) g.lineTo(x, y + 6 + i * 7 + Math.sin(x * 0.03 + i + y) * 2); g.stroke(); } }
    }, 2);
  },
  metal(seed = 9, base = [150, 158, 170], panel = 64) {
    return make("metal" + seed + base + panel, 256, (g, w, h) => {
      noise(g, w, h, base, 8, seed, 2);
      for (let y = 0; y < h; y += panel) for (let x = 0; x < w; x += panel) {
        g.strokeStyle = rgb(base, -70); g.lineWidth = 2; g.strokeRect(x + 1, y + 1, panel - 2, panel - 2);
        g.fillStyle = rgb(base, 50); for (const [dx, dy] of [[6, 6], [panel - 6, 6], [6, panel - 6], [panel - 6, panel - 6]]) { g.beginPath(); g.arc(x + dx, y + dy, 2.2, 0, 7); g.fill(); }
      }
    }, 2.5);
  },
  asphalt(seed = 10) { return make("asph" + seed, 256, (g, w, h) => { noise(g, w, h, [62, 64, 68], 22, seed, 2); }, 1); },
  moon(seed = 11) {
    return make("moon" + seed, 512, (g, w, h) => {
      noise(g, w, h, [150, 150, 154], 24, seed, 4);
      const R = rng(seed);
      for (let i = 0; i < 60; i++) { const x = R() * w, y = R() * h, r = 4 + R() ** 2 * 40; const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, "rgba(40,40,44,.55)"); gr.addColorStop(0.8, "rgba(90,90,96,.3)"); gr.addColorStop(0.92, "rgba(230,230,236,.5)"); gr.addColorStop(1, "rgba(200,200,206,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    }, 3);
  },
  tiles(seed = 12, a = [230, 226, 216], b = [60, 64, 76], n = 8) {
    return make("tiles" + seed + a + b + n, 256, (g, w, h) => {
      const s = w / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = rgb((x + y) % 2 ? a : b, (hash(x + seed, y) - 0.5) * 12); g.fillRect(x * s, y * s, s, s); g.strokeStyle = "rgba(0,0,0,.25)"; g.strokeRect(x * s + 0.5, y * s + 0.5, s - 1, s - 1); }
    }, 1.5);
  },
  roof(seed = 13, base = [170, 80, 60]) {
    return make("roof" + seed + base, 256, (g, w, h) => {
      g.fillStyle = rgb(base, -60); g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 20) for (let x = (y / 20) % 2 ? -12 : 0; x < w; x += 24) { const k = (hash(x + seed, y) - 0.5) * 30; const gr = g.createLinearGradient(0, y, 0, y + 20); gr.addColorStop(0, rgb(base, k - 20)); gr.addColorStop(1, rgb(base, k + 20)); g.fillStyle = gr; rr(g, x + 1, y, 22, 19, 8); g.fill(); }
    }, 2.5);
  },
  // a building front: wall colour, window grid, and an emissive map of lit windows
  facade(seed = 14, wall = [220, 210, 190], cols = 4, rows = 4, o = {}) {
    const key = "fac" + seed + wall + cols + rows + JSON.stringify(o);
    if (cache.has(key)) return cache.get(key);
    const c = canvas(256, 256), g = c.getContext("2d"), e = canvas(256, 256), ge = e.getContext("2d");
    noise(g, 256, 256, wall, 14, seed, 4);
    ge.fillStyle = "#000"; ge.fillRect(0, 0, 256, 256);
    const cw = 256 / cols, ch = 256 / rows;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = q * cw + cw * 0.22, y = r * ch + ch * 0.18, ww = cw * 0.56, wh = ch * (o.tall ? 0.7 : 0.58);
      g.fillStyle = rgb(wall, -40); g.fillRect(x - 3, y - 3, ww + 6, wh + 6);
      const lit = hash(q + seed, r * 7 + seed) < (o.lit ?? 0.45);
      g.fillStyle = lit ? (o.glow || "#ffd88a") : (o.glass || "#34485e"); g.fillRect(x, y, ww, wh);
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x, y, ww * 0.4, wh);
      if (o.shutters) { g.fillStyle = o.shutters; g.fillRect(x - ww * 0.35, y, ww * 0.3, wh); g.fillRect(x + ww * 1.05, y, ww * 0.3, wh); }
      if (o.balcony) { g.fillStyle = "#2a2a2a"; g.fillRect(x - 4, y + wh - 6, ww + 8, 3); for (let k = 0; k < 6; k++) g.fillRect(x - 4 + k * (ww + 8) / 5, y + wh - 6, 1.5, 10); }
      if (lit) { ge.fillStyle = o.glow || "#ffd88a"; ge.fillRect(x, y, ww, wh); }
    }
    const r = { map: toTex(c), normalMap: normalFrom(c, 1.5), emissiveMap: toTex(e) };
    cache.set(key, r);
    return r;
  },
  // text on a board
  sign(text, o = {}) {
    const key = "sign" + text + JSON.stringify(o);
    if (cache.has(key)) return cache.get(key);
    const w = o.w || 512, h = o.h || 128, c = canvas(w, h), g = c.getContext("2d");
    g.fillStyle = o.bg || "#1a2440"; g.fillRect(0, 0, w, h);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); }
    g.fillStyle = o.fg || "#ffffff"; g.font = `${o.weight || 800} ${o.size || Math.round(h * 0.5)}px ${o.font || "system-ui, sans-serif"}`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 2);
    const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    cache.set(key, t);
    return t;
  },
  // a soft round glow for sprites
  glow() {
    if (cache.has("glow")) return cache.get("glow");
    const c = canvas(64, 64), g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    const t = toTex(c); cache.set("glow", t); return t;
  },
};

const mats = new Map();
// a material from a texture set. o: color rough metal repeat [x,y] emissive ei normalScale
export function M(kind, o = {}) {
  const key = kind + JSON.stringify(o);
  if (mats.has(key)) return mats.get(key);
  let m;
  if (typeof kind === "number" || (typeof kind === "string" && kind[0] === "#")) {
    m = new THREE.MeshStandardMaterial({ color: kind, roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, flatShading: !!o.flat });
  } else {
    const args = o.args || [];
    const set = TEX[kind](...args);
    const rep = o.repeat || [1, 1];
    const clone = t => { if (!t) return null; const c = t.clone(); c.repeat.set(rep[0], rep[1]); c.needsUpdate = true; return c; };
    m = new THREE.MeshStandardMaterial({ map: clone(set.map), normalMap: clone(set.normalMap), color: o.color ?? 0xffffff, roughness: o.rough ?? 0.85, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide });
    if (o.normal !== undefined && m.normalMap) m.normalScale.set(o.normal, o.normal);
    if (set.emissiveMap && o.lit !== false) { m.emissiveMap = clone(set.emissiveMap); m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = o.ei ?? 0.9; }
  }
  mats.set(key, m);
  return m;
}
