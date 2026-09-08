// The first-person 3D world: renderer, procedural textures, building
// helpers, the player, collision, people, weather, and the seven scenes.
import * as THREE from "./three.module.min.js";
import { drawFlag, drawSymbol, rrect, TAU, clamp, lerp } from "./ui.js";
import { SFX } from "./audio.js";

const TEX_FILES = ["asphalt", "asphalt_n", "steel", "steel_n", "gunmetal", "gunmetal_n", "rivet", "rivet_n", "tech", "tech_n", "scifi_floor", "scifi_floor_n",
  "container", "container_n", "train", "train_n", "ice", "ice_n", "lava", "trim", "trim_e", "pillars", "antislip", "antislip_n", "water_n", "carbon"];
const SKY_FILES = ["sky_sunset", "sky_night"];

function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ------------------------------------------------------------- procedural textures
function canvasTex(w, h, fn, opts) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); fn(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  if (opts && opts.nearest) { t.magFilter = THREE.NearestFilter; }
  t.anisotropy = 4;
  return t;
}
function noiseFill(g, w, h, base, amp, seed, cell) {
  cell = cell || 4;
  for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
    const n = hash(x + seed, y) * amp - amp / 2;
    g.fillStyle = `rgb(${clamp(base[0] + n, 0, 255) | 0},${clamp(base[1] + n, 0, 255) | 0},${clamp(base[2] + n, 0, 255) | 0})`;
    g.fillRect(x, y, cell, cell);
  }
}
export const PT = {
  windows(cols, rows, wall, lit, chance, seed, dark) {
    return canvasTex(256, 256, (g, w, h) => {
      noiseFill(g, w, h, wall, 18, seed, 4);
      const cw = w / cols, ch = h / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const on = hash(c + seed, r * 7 + seed) < chance;
        g.fillStyle = on ? lit[Math.floor(hash(c * 3, r + seed) * lit.length)] : (dark || "#0a0e16");
        g.fillRect(c * cw + cw * 0.22, r * ch + ch * 0.2, cw * 0.56, ch * 0.6);
        if (on && hash(c, r * 13 + seed) < 0.3) { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(c * cw + cw * 0.22, r * ch + ch * 0.2, cw * 0.56, ch * 0.3); }
      }
    });
  },
  brick(a, b, mortar, seed) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = mortar || "#8a8078"; g.fillRect(0, 0, w, h);
      const bh = 16, bw = 40;
      for (let y = 0; y < h; y += bh) { const off = (y / bh) % 2 ? bw / 2 : 0; for (let x = -bw; x < w + bw; x += bw) {
        const k = hash(x + seed, y); g.fillStyle = k < 0.5 ? a : b; g.fillRect(x + off + 1, y + 1, bw - 2, bh - 2);
        g.fillStyle = `rgba(0,0,0,${k * 0.18})`; g.fillRect(x + off + 1, y + 1, bw - 2, bh - 2); } }
    });
  },
  plaster(base, seed) { return canvasTex(256, 256, (g, w, h) => { noiseFill(g, w, h, base, 26, seed, 3); g.fillStyle = "rgba(0,0,0,.08)"; for (let i = 0; i < 12; i++) { const x = hash(i, seed) * w, y = hash(seed, i) * h; g.fillRect(x, y, hash(i * 3, seed) * 40, 2); } }); },
  cobble(seed) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#3a3a3c"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 22) for (let x = 0; x < w; x += 26) { const k = hash(x + seed, y); const v = 70 + k * 40; g.fillStyle = `rgb(${v},${v},${v + 4})`; rrect(g, x + 2 + ((y / 22) % 2 ? 13 : 0), y + 2, 22, 18, 6); g.fill(); }
    });
  },
  paving(seed, base) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#4a4a4e"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const k = hash(x + seed, y); const b = base || [120, 120, 122]; g.fillStyle = `rgb(${b[0] + k * 20},${b[1] + k * 20},${b[2] + k * 20})`; g.fillRect(x + 2, y + 2, 60, 60); }
    });
  },
  sand(seed) { return canvasTex(256, 256, (g, w, h) => { noiseFill(g, w, h, [214, 180, 120], 30, seed, 3); g.strokeStyle = "rgba(160,120,70,.25)"; g.lineWidth = 3; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(0, i * 26 + 8); for (let x = 0; x <= w; x += 16) g.lineTo(x, i * 26 + 8 + Math.sin(x * 0.05 + i) * 6); g.stroke(); } }); },
  snow(seed) { return canvasTex(256, 256, (g, w, h) => { noiseFill(g, w, h, [232, 238, 248], 14, seed, 3); }); },
  wood(seed) { return canvasTex(256, 256, (g, w, h) => { for (let y = 0; y < h; y += 32) { const k = hash(seed, y); g.fillStyle = `rgb(${120 + k * 40},${80 + k * 30},${40 + k * 20})`; g.fillRect(0, y, w, 31); g.strokeStyle = "rgba(0,0,0,.2)"; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, y + 6 + i * 7); g.lineTo(w, y + 6 + i * 7 + hash(i, y) * 4); g.stroke(); } } }); },
  sign(txt, bg, fg, font, w, h) {
    return canvasTex(w || 512, h || 128, (g, W, H) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = fg; g.font = `${font || "900 64px sans-serif"}`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(txt, W / 2, H / 2 + 2);
    });
  },
  neon(color, seed, count) {
    // abstract glyph-like strokes so no font is needed
    return canvasTex(128, 512, (g, w, h) => {
      g.fillStyle = "#0b0b12"; g.fillRect(0, 0, w, h);
      g.strokeStyle = color; g.lineWidth = 9; g.lineCap = "round"; g.shadowColor = color; g.shadowBlur = 14;
      const n = count || 5;
      for (let i = 0; i < n; i++) {
        const y0 = 20 + i * (h - 40) / n, size = (h - 40) / n - 22;
        g.beginPath();
        for (let k = 0; k < 4; k++) { const x = 24 + hash(i * 5 + k, seed) * (w - 48), y = y0 + hash(seed + k, i * 7) * size; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
        if (hash(i, seed * 3) > 0.5) { g.beginPath(); g.moveTo(24, y0 + size); g.lineTo(w - 24, y0 + size); g.stroke(); }
      }
    });
  },
  clock() {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#c9a15a"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#f4f0e0"; g.beginPath(); g.arc(128, 128, 104, 0, TAU); g.fill();
      g.strokeStyle = "#2a2a2a"; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 104, 0, TAU); g.stroke();
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); g.lineTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); g.stroke(); }
      g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + 50, 128 - 40); g.moveTo(128, 128); g.lineTo(128 - 20, 128 - 80); g.stroke();
    });
  },
  zebra() { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#2a2a2e"; g.fillRect(0, 0, w, h); g.fillStyle = "#e8e8e0"; for (let i = 0; i < 8; i++) g.fillRect(0, i * 32 + 6, w, 18); }); },
  wavepave() { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#eae6d8"; g.fillRect(0, 0, w, h); g.fillStyle = "#1a1a1a"; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, k * 64); for (let x = 0; x <= w; x += 8) g.lineTo(x, k * 64 + Math.sin(x / w * TAU * 2) * 18); for (let x = w; x >= 0; x -= 8) g.lineTo(x, k * 64 + 28 + Math.sin(x / w * TAU * 2) * 18); g.closePath(); g.fill(); } }); },
  hiero(seed) {
    return canvasTex(256, 256, (g, w, h) => {
      noiseFill(g, w, h, [200, 170, 120], 24, seed, 4);
      g.strokeStyle = "#5a3a1a"; g.lineWidth = 3; g.lineCap = "round";
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const x = c * 64 + 12, y = r * 64 + 12, k = Math.floor(hash(c + seed, r) * 5);
        g.beginPath();
        if (k === 0) { g.moveTo(x, y + 40); g.lineTo(x + 20, y); g.lineTo(x + 40, y + 40); }
        else if (k === 1) { g.arc(x + 20, y + 20, 16, 0, TAU); g.moveTo(x + 20, y + 4); g.lineTo(x + 20, y + 44); }
        else if (k === 2) { g.moveTo(x, y + 20); g.quadraticCurveTo(x + 20, y - 10, x + 40, y + 20); g.quadraticCurveTo(x + 20, y + 50, x, y + 20); }
        else if (k === 3) { g.rect(x + 6, y + 6, 28, 28); g.moveTo(x + 6, y + 20); g.lineTo(x + 34, y + 20); }
        else { g.moveTo(x + 20, y); g.lineTo(x + 20, y + 40); g.moveTo(x + 4, y + 12); g.lineTo(x + 36, y + 12); g.moveTo(x + 8, y + 30); g.lineTo(x + 32, y + 30); }
        g.stroke();
      }
    });
  },
  flag(id) { return canvasTex(256, 160, (g, w, h) => { drawFlag(g, id, 0, 0, w, h); }); },
  dot() { return canvasTex(64, 64, (g, w, h) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,.5)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); }); },
  streak() { return canvasTex(16, 64, (g, w, h) => { const r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, "rgba(255,255,255,0)"); r.addColorStop(0.5, "rgba(255,255,255,.9)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(5, 0, 6, h); }); },
  icon(name, color) {
    return canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, w, h);
      g.fillStyle = "#0b1220"; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.fill();
      g.strokeStyle = color; g.lineWidth = 6; g.stroke();
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 7; g.lineCap = "round"; g.lineJoin = "round";
      switch (name) {
        case "dome": g.beginPath(); g.arc(64, 70, 30, Math.PI, TAU); g.fill(); g.fillRect(30, 70, 68, 22); break;
        case "door": g.beginPath(); rrect(g, 40, 30, 48, 68, 8); g.stroke(); g.beginPath(); g.arc(76, 66, 5, 0, TAU); g.fill(); break;
        case "furnace": g.beginPath(); g.moveTo(40, 96); g.quadraticCurveTo(64, 20, 88, 96); g.closePath(); g.fill(); g.fillStyle = "#0b1220"; g.beginPath(); g.moveTo(52, 96); g.quadraticCurveTo(64, 56, 76, 96); g.fill(); break;
        case "mask": g.beginPath(); g.ellipse(64, 62, 36, 26, 0, 0, TAU); g.fill(); g.fillStyle = "#0b1220"; g.beginPath(); g.ellipse(50, 60, 9, 6, 0, 0, TAU); g.ellipse(78, 60, 9, 6, 0, 0, TAU); g.fill(); break;
        case "mast": g.beginPath(); g.moveTo(64, 100); g.lineTo(64, 30); g.moveTo(44, 50); g.lineTo(84, 50); g.moveTo(50, 70); g.lineTo(78, 70); g.stroke(); g.beginPath(); g.arc(64, 30, 8, 0, TAU); g.fill(); break;
        case "tomb": g.beginPath(); g.moveTo(28, 98); g.lineTo(64, 30); g.lineTo(100, 98); g.closePath(); g.fill(); g.fillStyle = "#0b1220"; g.fillRect(54, 66, 20, 32); break;
        case "keypad": for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { g.beginPath(); rrect(g, 36 + c * 20, 36 + r * 20, 16, 16, 3); g.fill(); } break;
        case "server": for (let r = 0; r < 3; r++) { g.beginPath(); rrect(g, 36, 34 + r * 22, 56, 16, 3); g.stroke(); g.beginPath(); g.arc(46, 42 + r * 22, 3, 0, TAU); g.fill(); } break;
        case "vault": g.beginPath(); g.arc(64, 64, 30, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(64, 34); g.lineTo(64, 94); g.moveTo(34, 64); g.lineTo(94, 64); g.stroke(); break;
        case "bomb": g.beginPath(); g.arc(64, 72, 28, 0, TAU); g.fill(); g.beginPath(); g.moveTo(80, 50); g.quadraticCurveTo(96, 34, 96, 26); g.stroke(); break;
        case "camera": g.beginPath(); rrect(g, 30, 46, 68, 44, 6); g.fill(); g.fillStyle = "#0b1220"; g.beginPath(); g.arc(64, 68, 14, 0, TAU); g.fill(); g.fillStyle = color; g.fillRect(48, 36, 24, 12); break;
        case "crate": g.beginPath(); rrect(g, 30, 40, 68, 50, 4); g.stroke(); g.beginPath(); g.moveTo(30, 40); g.lineTo(98, 90); g.moveTo(98, 40); g.lineTo(30, 90); g.stroke(); break;
        case "screen": g.beginPath(); rrect(g, 28, 34, 72, 50, 6); g.stroke(); g.fillRect(56, 88, 16, 10); g.fillRect(44, 96, 40, 6); break;
        case "laser": g.beginPath(); g.moveTo(24, 40); g.lineTo(104, 88); g.moveTo(24, 88); g.lineTo(104, 40); g.moveTo(24, 64); g.lineTo(104, 64); g.stroke(); g.beginPath(); g.arc(64, 64, 8, 0, TAU); g.fill(); break;
        case "rods": for (let i = 0; i < 3; i++) g.fillRect(34 + i * 24, 40, 8, 56); g.fillRect(28, 96, 72, 6); g.fillRect(24, 76, 28, 8); g.fillRect(28, 62, 20, 8); break;
        case "sonar": for (let r = 14; r <= 46; r += 16) { g.beginPath(); g.arc(64, 64, r, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } g.beginPath(); g.arc(64, 70, 7, 0, TAU); g.fill(); break;
        default: g.beginPath(); g.arc(64, 64, 20, 0, TAU); g.fill();
      }
    });
  },
};

// ------------------------------------------------------------- the world
export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.mobile = /iPad|iPhone|Android|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    this.r = r;
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.1, 400);
    this.camera.rotation.order = "YXZ";
    this.scene = null; this.tex = {}; this.sky = {};
    this.player = { x: 0, z: 0, yaw: 0, pitch: 0, bob: 0, moving: 0, stepT: 0 };
    this.colliders = []; this.circles = []; this.bounds = { x0: -30, x1: 30, z0: -30, z1: 30 };
    this.interactables = []; this.people = []; this.updaters = []; this.t = 0;
    this.input = { mx: 0, my: 0, dx: 0, dy: 0 };
    this.fovBase = 72; this.zoom = 1; this.sway = 0;
    this.stationEnabled = {};
    this.dotTex = PT.dot(); this.streakTex = PT.streak();
    this.iconTex = {};
  }
  async loadTextures(onProgress) {
    const loader = new THREE.TextureLoader();
    const all = [...TEX_FILES.map(n => ["tex/" + n + ".jpg", n, false]), ...SKY_FILES.map(n => ["tex/" + n + ".jpg", n, true]), ["tex/smoke.png", "smoke", false], ["tex/spark.png", "spark", false]];
    let done = 0;
    await Promise.all(all.map(([url, name, sky]) => new Promise(res => {
      loader.load(url, t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
        if (!name.endsWith("_n")) t.colorSpace = THREE.SRGBColorSpace;
        if (sky) { t.mapping = THREE.EquirectangularReflectionMapping; this.sky[name] = t; } else this.tex[name] = t;
        done++; if (onProgress) onProgress(done / all.length); res();
      }, undefined, () => { done++; if (onProgress) onProgress(done / all.length); res(); });
    })));
  }
  T(name, rx, ry) { const t = this.tex[name]; if (!t) return null; const c = t.clone(); c.repeat.set(rx || 1, ry || rx || 1); c.needsUpdate = true; return c; }
  M(o) {
    o = o || {};
    const m = new THREE.MeshStandardMaterial({ color: o.color !== undefined ? o.color : 0xffffff, roughness: o.roughness !== undefined ? o.roughness : 0.85, metalness: o.metalness || 0 });
    if (o.tex) { m.map = this.T(o.tex, o.rx, o.ry); if (this.tex[o.tex + "_n"]) { m.normalMap = this.T(o.tex + "_n", o.rx, o.ry); m.normalScale = new THREE.Vector2(o.ns || 0.7, o.ns || 0.7); } }
    if (o.map) { m.map = o.map; if (o.rx) { m.map.repeat.set(o.rx, o.ry || o.rx); } }
    if (o.emissive !== undefined) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei || 1; if (o.emap) m.emissiveMap = o.emap; }
    if (o.transparent) { m.transparent = true; m.opacity = o.opacity !== undefined ? o.opacity : 0.5; }
    if (o.side) m.side = o.side;
    return m;
  }
  resize(w, h) { this.r.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.W = w; this.H = h; }

  // ---- building helpers. Every mesh casts and receives shadows by default.
  add(mesh, x, y, z, ry) { mesh.position.set(x || 0, y || 0, z || 0); if (ry) mesh.rotation.y = ry; mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh); return mesh; }
  box(w, h, d, mat, x, y, z, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    this.add(m, x, y === undefined ? h / 2 : y, z, o.ry);
    if (o.collide !== false && o.collide !== undefined) this.collider(x, z, w / 2, d / 2, o.ry);
    if (o.noShadow) { m.castShadow = false; }
    return m;
  }
  cyl(rt, rb, h, mat, x, y, z, segs, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs || 16), mat);
    this.add(m, x, y === undefined ? h / 2 : y, z, o.ry);
    if (o.collide) this.circle(x, z, Math.max(rt, rb));
    return m;
  }
  cone(r, h, mat, x, y, z, segs, o) { return this.cyl(0, r, h, mat, x, y, z, segs, o); }
  sphere(r, mat, x, y, z, segs) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs || 18, segs ? Math.max(6, segs / 2) : 12), mat); return this.add(m, x, y, z); }
  plane(w, h, mat, x, y, z, rx, ry) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.rotation.order = "YXZ"; m.rotation.x = rx || 0; m.rotation.y = ry || 0; this.add(m, x, y, z); m.castShadow = false; return m; }
  ground(mat, size) { const m = this.plane(size || 400, size || 400, mat, 0, 0, 0, -Math.PI / 2); m.receiveShadow = true; return m; }
  collider(x, z, hw, hd, ry) {
    if (ry) { const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); const nhw = hw * c + hd * s, nhd = hw * s + hd * c; hw = nhw; hd = nhd; }
    this.colliders.push({ x, z, hw, hd });
  }
  circle(x, z, r) { this.circles.push({ x, z, r }); }
  sprite(tex, x, y, z, size, color, additive) {
    const m = new THREE.SpriteMaterial({ map: tex, color: color || 0xffffff, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    const s = new THREE.Sprite(m); s.position.set(x, y, z); s.scale.set(size, size, 1); this.scene.add(s); return s;
  }
  lamp(x, z, h, color, intensity, dist, o) {
    o = o || {};
    const post = this.M({ color: o.post || 0x222226, metalness: 0.4, roughness: 0.6 });
    this.cyl(0.07, 0.1, h, post, x, undefined, z, 8);
    this.box(0.5, 0.25, 0.5, this.M({ color: 0x111111, emissive: color, ei: 2.2 }), x, h, z, { noShadow: true });
    this.sprite(this.dotTex, x, h, z, 3.2, color, true).material.opacity = 0.55;
    if (intensity) { const l = new THREE.PointLight(color, intensity, dist || 18, 1.6); l.position.set(x, h - 0.4, z); this.scene.add(l); }
    this.circle(x, z, 0.25);
  }
  light(color, intensity, x, y, z, dist) { const l = new THREE.PointLight(color, intensity, dist || 16, 1.7); l.position.set(x, y, z); this.scene.add(l); return l; }
  sun(color, intensity, x, y, z, shadowSize, target) {
    const d = new THREE.DirectionalLight(color, intensity); d.position.set(x, y, z);
    d.castShadow = true; const S = shadowSize || 45;
    d.shadow.mapSize.set(this.mobile ? 1024 : 2048, this.mobile ? 1024 : 2048);
    d.shadow.camera.left = -S; d.shadow.camera.right = S; d.shadow.camera.top = S; d.shadow.camera.bottom = -S;
    d.shadow.camera.near = 1; d.shadow.camera.far = 250; d.shadow.bias = -0.0008; d.shadow.normalBias = 0.03;
    if (target) { d.target.position.set(target[0], 0, target[1]); this.scene.add(d.target); }
    this.scene.add(d); return d;
  }
  station(id, x, z, icon, color, label, o) {
    o = o || {};
    const grp = new THREE.Group(); grp.position.set(x, 0, z); this.scene.add(grp);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.07, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; grp.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.05; grp.add(ring2);
    if (!this.iconTex[icon]) this.iconTex[icon] = PT.icon(icon, "#" + new THREE.Color(color).getHexString());
    const sm = new THREE.SpriteMaterial({ map: this.iconTex[icon], transparent: true, depthTest: false });
    const sp = new THREE.Sprite(sm); sp.position.y = o.iconY || 2.3; sp.scale.set(0.85, 0.85, 1); grp.add(sp);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
    beam.position.y = 1.5; grp.add(beam);
    const it = { id, kind: "station", x, z, y: 1.2, radius: o.radius || 2.6, label, grp, ring, sp, beam, color, enabled: true };
    this.interactables.push(it);
    return it;
  }
  // A person built from boxes. Returns a group with an `anim` function.
  person(o) {
    o = o || {};
    const g = new THREE.Group();
    const skin = this.M({ color: o.skin || 0xf1c9a5 }), coat = this.M({ color: o.coat || 0x334466 }), trous = this.M({ color: o.trousers || 0x222233 });
    const sc = o.big ? 1.25 : 1;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 0.8, 0.22 * sc), trous); legL.position.set(-0.14 * sc, 0.4, 0);
    const legR = legL.clone(); legR.position.x = 0.14 * sc;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.56 * sc, 0.7, 0.32 * sc), coat); body.position.y = 1.15;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16 * sc, 0.66, 0.16 * sc), coat); armL.position.set(-0.37 * sc, 1.15, 0);
    const armR = armL.clone(); armR.position.x = 0.37 * sc;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2 * sc, 14, 10), skin); head.position.y = 1.72;
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 0.05, 0.05), this.M({ color: o.glasses ? 0x111111 : 0x222222 })); eyes.position.set(0, 1.75, 0.17 * sc); head.add(eyes); eyes.position.set(0, 0.03, 0.17 * sc);
    const parts = [legL, legR, body, armL, armR, head];
    if (o.hat === "cap") { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.21 * sc, 0.21 * sc, 0.1, 12), this.M({ color: o.hatColor || 0x333333 })); h.position.y = 0.16 * sc; head.add(h); const peak = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.16), h.material); peak.position.set(0, 0.12 * sc, 0.22 * sc); head.add(peak); }
    if (o.hat === "ushanka") { const h = new THREE.Mesh(new THREE.SphereGeometry(0.25 * sc, 12, 8, 0, TAU, 0, Math.PI / 2), this.M({ color: 0x6b5040 })); h.position.y = 0.02; head.add(h); const fl = new THREE.Mesh(new THREE.BoxGeometry(0.55 * sc, 0.2, 0.2), h.material); fl.position.y = -0.05; head.add(fl); }
    if (o.hat === "boater") { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 16), this.M({ color: 0xe8d8a0 })); h.position.y = 0.12; head.add(h); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), h.material); top.position.y = 0.19; head.add(top); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 16), this.M({ color: 0xc0392b })); band.position.y = 0.15; head.add(band); }
    if (o.hat === "trilby") { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 16), this.M({ color: 0x3a3a3a })); h.position.y = 0.1; head.add(h); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.18, 16), h.material); top.position.y = 0.2; head.add(top); }
    if (o.hat === "helmet") { const h = new THREE.Mesh(new THREE.SphereGeometry(0.23 * sc, 12, 8, 0, TAU, 0, Math.PI / 2), this.M({ color: o.hatColor || 0x445566 })); h.position.y = 0.0; head.add(h); }
    if (o.hat === "scarf") { const h = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8, 0, TAU, 0, Math.PI / 1.6), this.M({ color: o.hatColor || 0xb8860b })); head.add(h); }
    if (o.hat === "bandana") { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.08, 12), this.M({ color: 0xffffff })); h.position.y = 0.1; head.add(h); }
    if (o.hair) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.215 * sc, 12, 8, 0, TAU, 0, Math.PI / 2.2), this.M({ color: o.hair })); h.position.y = 0.02; head.add(h); }
    if (o.mask) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), this.M({ color: o.mask, metalness: 0.6, roughness: 0.3 })); m.position.set(0, 0.02, 0.18); head.add(m); }
    if (o.feather) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.1), this.M({ color: o.feather })); f.position.set(0.12, 0.35, 0); f.rotation.z = -0.3; head.add(f); }
    if (o.prop === "food") { const f = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.12), this.M({ color: 0xd9a066 })); f.position.set(0.5 * sc, 1.0, 0.15); g.add(f); }
    if (o.prop === "board") { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.08), this.M({ color: 0x27ae60 })); b.position.set(0.55, 1.1, -0.1); g.add(b); }
    if (o.prop === "oar") { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8), this.M({ color: 0x6b4423 })); b.position.set(0.5, 1.3, 0.1); b.rotation.z = 0.2; g.add(b); }
    if (o.prop === "torch") { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), this.M({ color: 0x333333 })); b.position.set(0.45, 1.0, 0.25); b.rotation.x = Math.PI / 2; g.add(b); }
    for (const p of parts) { p.castShadow = true; p.receiveShadow = true; g.add(p); }
    g.userData = { legL, legR, armL, armR, head, body, t: Math.random() * 10, walk: 0 };
    return g;
  }
  addPerson(id, x, z, ry, o, label) {
    const p = this.person(o); p.position.set(x, 0, z); p.rotation.y = ry || 0; this.scene.add(p);
    const rec = { id, grp: p, x, z, faces: o.faces !== false, walk: 0 };
    this.people.push(rec);
    if (label) this.interactables.push({ id, kind: "npc", x, z, y: 1.5, radius: 2.4, label, enabled: true, person: rec });
    return rec;
  }
  animatePerson(rec, dt) {
    const u = rec.grp.userData; u.t += dt;
    const w = rec.walk;
    if (w > 0) { const s = Math.sin(u.t * 9) * 0.6 * w; u.legL.rotation.x = s; u.legR.rotation.x = -s; u.armL.rotation.x = -s; u.armR.rotation.x = s; }
    else { u.legL.rotation.x = u.legR.rotation.x = 0; u.armL.rotation.x = Math.sin(u.t * 1.3) * 0.08; u.armR.rotation.x = -Math.sin(u.t * 1.3 + 1) * 0.08; }
    u.body.position.y = 1.15 + Math.sin(u.t * 2.1) * 0.012; u.head.position.y = 1.72 + Math.sin(u.t * 2.1) * 0.015;
    if (rec.faces && w === 0) {
      const dx = this.player.x - rec.grp.position.x, dz = this.player.z - rec.grp.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 7) { const want = Math.atan2(dx, dz); let diff = want - rec.grp.rotation.y; while (diff > Math.PI) diff -= TAU; while (diff < -Math.PI) diff += TAU; rec.grp.rotation.y += diff * Math.min(1, dt * 3); }
    }
  }
  weather(kind, count) {
    const n = count || (this.mobile ? 600 : 1400);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    const R = 22;
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * R * 2; pos[i * 3 + 1] = Math.random() * 16; pos[i * 3 + 2] = (Math.random() - 0.5) * R * 2; vel[i * 3] = 0; vel[i * 3 + 1] = 0; vel[i * 3 + 2] = 0; }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    let mat;
    if (kind === "rain") mat = new THREE.PointsMaterial({ map: this.streakTex, size: 0.32, transparent: true, opacity: 0.4, depthWrite: false, color: 0xbcd4ff, sizeAttenuation: true });
    else if (kind === "snow") mat = new THREE.PointsMaterial({ map: this.dotTex, size: 0.22, transparent: true, opacity: 0.9, depthWrite: false, color: 0xffffff });
    else mat = new THREE.PointsMaterial({ map: this.dotTex, size: 0.35, transparent: true, opacity: 0.35, depthWrite: false, color: 0xe8c890 });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; this.scene.add(pts);
    const self = this;
    this.updaters.push(dt => {
      const a = geo.attributes.position.array, px = self.player.x, pz = self.player.z, tt = self.t;
      for (let i = 0; i < n; i++) {
        let x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
        if (kind === "rain") { y -= 14 * dt; x += 1.2 * dt; }
        else if (kind === "snow") { y -= 1.4 * dt; x += Math.sin(tt * 0.7 + i) * 0.6 * dt + 0.9 * dt; z += Math.cos(tt * 0.5 + i * 0.3) * 0.4 * dt; }
        else { x += 3.5 * dt; y += Math.sin(tt + i) * 0.3 * dt; }
        if (y < 0) { y += 16; }
        if (x - px > R) x -= R * 2; if (x - px < -R) x += R * 2;
        if (z - pz > R) z -= R * 2; if (z - pz < -R) z += R * 2;
        a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
    });
  }
  water(w, d, x, z, color, o) {
    o = o || {};
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.18, metalness: 0.55, transparent: true, opacity: o.opacity || 0.92 });
    m.normalMap = this.T("water_n", w / 8, d / 8); m.normalScale = new THREE.Vector2(0.6, 0.6);
    const p = this.plane(w, d, m, x, o.y || -0.05, z, -Math.PI / 2); p.receiveShadow = true;
    this.updaters.push(dt => { m.normalMap.offset.x += dt * 0.02; m.normalMap.offset.y += dt * 0.013; });
    return p;
  }
  gradientSky(top, mid, bottom) {
    const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, mid); gr.addColorStop(0.62, bottom); gr.addColorStop(1, bottom);
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  aurora() {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { t: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float t; varying vec2 vUv;
        float n(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        float sn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(n(i),n(i+vec2(1,0)),f.x),mix(n(i+vec2(0,1)),n(i+vec2(1,1)),f.x),f.y); }
        void main(){
          float x = vUv.x*6.0 + t*0.05;
          float band = sn(vec2(x, t*0.1)) * 0.6 + sn(vec2(x*2.3, t*0.17))*0.4;
          float y = vUv.y;
          float curtain = smoothstep(0.0, 0.15, y) * (1.0 - smoothstep(0.35, 0.95, y));
          float rays = 0.5 + 0.5*sin(vUv.x*80.0 + sn(vec2(vUv.x*10.0, t*0.3))*8.0);
          float a = curtain * (0.35 + 0.65*band) * (0.6 + 0.4*rays);
          vec3 col = mix(vec3(0.1,0.9,0.5), vec3(0.6,0.2,0.9), smoothstep(0.2,0.8,y));
          gl_FragColor = vec4(col, a*0.55);
        }`,
    });
    const geo = new THREE.CylinderGeometry(160, 160, 70, 48, 1, true, Math.PI * 0.6, Math.PI * 0.8);
    const m = new THREE.Mesh(geo, mat); m.position.y = 60; this.scene.add(m);
    this.updaters.push(dt => { mat.uniforms.t.value += dt; });
  }
  pineForest(list, snowy) {
    // one draw call for every tree: a lathe profile with three tiers
    const prof = [];
    prof.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.09, 0), new THREE.Vector2(0.09, 0.22), new THREE.Vector2(0.42, 0.22), new THREE.Vector2(0.12, 0.5), new THREE.Vector2(0.34, 0.5), new THREE.Vector2(0.09, 0.74), new THREE.Vector2(0.24, 0.74), new THREE.Vector2(0, 1.0));
    const geo = new THREE.LatheGeometry(prof, 8);
    const mat = this.M({ color: snowy ? 0x1b3d2a : 0x1f4d2a, roughness: 1 });
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const m4 = new THREE.Matrix4();
    list.forEach(([x, z, h], i) => { m4.makeScale(h, h, h); m4.setPosition(x, 0, z); im.setMatrixAt(i, m4); this.circle(x, z, 0.4); });
    im.castShadow = true; im.receiveShadow = true; this.scene.add(im);
    if (snowy) {
      const cap = [new THREE.Vector2(0, 0.99), new THREE.Vector2(0.2, 0.76), new THREE.Vector2(0.09, 0.76), new THREE.Vector2(0.3, 0.52), new THREE.Vector2(0.12, 0.52), new THREE.Vector2(0.38, 0.25), new THREE.Vector2(0.42, 0.22), new THREE.Vector2(0.44, 0.24), new THREE.Vector2(0.14, 0.53), new THREE.Vector2(0.34, 0.53), new THREE.Vector2(0.11, 0.77), new THREE.Vector2(0.26, 0.77), new THREE.Vector2(0.02, 1.02)];
      const sg = new THREE.LatheGeometry(cap, 8);
      const sm = new THREE.InstancedMesh(sg, this.M({ color: 0xf0f4ff, roughness: 1 }), list.length);
      list.forEach(([x, z, h], i) => { m4.makeScale(h, h, h); m4.setPosition(x, 0, z); sm.setMatrixAt(i, m4); });
      sm.castShadow = false; this.scene.add(sm);
    }
    return im;
  }
  pine(x, z, h, snowy) {
    const trunk = this.M({ color: 0x3a2a1a }), leaf = this.M({ color: snowy ? 0x1e3a2a : 0x1f4d2a });
    this.cyl(0.12, 0.2, h * 0.3, trunk, x, undefined, z, 6);
    for (let i = 0; i < 3; i++) { const r = 1.4 - i * 0.35, y = h * 0.25 + i * h * 0.22; this.cone(r * (h / 6), h * 0.35, leaf, x, y, z, 8); if (snowy) this.cone(r * (h / 6) * 0.9, h * 0.1, this.M({ color: 0xf0f4ff }), x, y + h * 0.28, z, 8); }
    this.circle(x, z, 0.4);
  }
  palm(x, z, h) {
    const trunk = this.M({ color: 0x8a6a4a }), leaf = this.M({ color: 0x2e8b45, side: THREE.DoubleSide });
    const t = this.cyl(0.14, 0.22, h, trunk, x, undefined, z, 7); t.rotation.z = 0.06;
    for (let i = 0; i < 7; i++) { const a = i * TAU / 7; const l = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.7), leaf); l.position.set(x + Math.cos(a) * 1.1, h, z + Math.sin(a) * 1.1); l.rotation.y = -a; l.rotation.z = -0.5; l.castShadow = true; this.scene.add(l); }
    this.sphere(0.35, this.M({ color: 0x6b4a2a }), x, h - 0.2, z, 8);
    this.circle(x, z, 0.35);
  }
  car(x, z, ry, color, o) {
    o = o || {};
    const body = this.M({ color, metalness: 0.5, roughness: 0.35 }), glass = this.M({ color: 0x223344, metalness: 0.8, roughness: 0.1 }), tyre = this.M({ color: 0x111111 });
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; this.scene.add(g);
    const b = new THREE.Mesh(new THREE.BoxGeometry(o.len || 4.4, 0.7, 1.9), body); b.position.y = 0.65; b.castShadow = true; g.add(b);
    const c = new THREE.Mesh(new THREE.BoxGeometry((o.len || 4.4) * 0.55, 0.6, 1.7), o.cab ? body : glass); c.position.set(-0.2, 1.3, 0); c.castShadow = true; g.add(c);
    if (o.cab) { const w = new THREE.Mesh(new THREE.BoxGeometry((o.len || 4.4) * 0.5, 0.35, 1.74), glass); w.position.set(-0.2, 1.35, 0); g.add(w); }
    for (const [wx, wz] of [[1.4, 0.9], [-1.4, 0.9], [1.4, -0.9], [-1.4, -0.9]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.25, 12), tyre); t.rotation.x = Math.PI / 2; t.position.set(wx, 0.33, wz); g.add(t); }
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), this.M({ color: 0xfff4c0, emissive: 0xffe0a0, ei: 1.5 })); lamp.position.set((o.len || 4.4) / 2, 0.7, 0.6); g.add(lamp); const lamp2 = lamp.clone(); lamp2.position.z = -0.6; g.add(lamp2);
    if (o.sign) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.3), this.M({ color: 0xffd166, emissive: 0xffb000, ei: 1.5 })); s.position.y = 1.7; g.add(s); }
    this.collider(x, z, (o.len || 4.4) / 2, 1, ry);
    return g;
  }
  container(x, y, z, ry, color) {
    const m = this.M({ tex: "container", color, rx: 1, ry: 1, roughness: 0.7, metalness: 0.3 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.4), m); b.position.set(x, y + 1.3, z); b.rotation.y = ry || 0; b.castShadow = b.receiveShadow = true; this.scene.add(b);
    if (y === 0) this.collider(x, z, 3, 1.2, ry);
    return b;
  }
  sign(txt, w, h, x, y, z, ry, bg, fg, glow, font) {
    const t = PT.sign(txt, bg, fg, font, 512, Math.round(512 * h / w));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow ? this.M({ map: t, emissive: 0xffffff, emap: t, ei: glow }) : this.M({ map: t }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; this.scene.add(m); return m;
  }
  building(w, h, d, x, z, o) {
    o = o || {};
    const wallTex = o.tex || PT.windows(o.cols || Math.max(2, Math.round(w / 3)), o.rows || Math.max(2, Math.round(h / 3.2)), o.wall || [40, 44, 56], o.lit || ["#ffd88a", "#ffe9b8", "#9ad0ff"], o.chance !== undefined ? o.chance : 0.55, o.seed || (x * 31 + z * 17), o.dark);
    const m = this.M({ map: wallTex, roughness: 0.8, emissive: o.glow !== undefined ? 0xffffff : undefined, emap: o.glow !== undefined ? wallTex : undefined, ei: o.glow !== undefined ? o.glow : 1 });
    if (o.glow !== undefined) { m.emissiveMap = wallTex; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = o.glow; }
    const b = this.box(w, h, d, m, x, undefined, z, { collide: true, ry: o.ry });
    if (o.roof) { const r = this.box(w * 0.9, 0.5, d * 0.9, this.M({ color: 0x1a1a22 }), x, h + 0.25, z, { ry: o.ry }); r.castShadow = false; }
    return b;
  }

  // ---- scenes
  reset() {
    if (this.scene) {
      const keep = new Set([...Object.values(this.tex), ...Object.values(this.sky), this.dotTex, this.streakTex, ...Object.values(this.iconTex)]);
      const mats = new Set(), geos = new Set();
      this.scene.traverse(o => { if (o.geometry) geos.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); });
      for (const gm of geos) gm.dispose();
      for (const m of mats) { for (const k of ["map", "normalMap", "emissiveMap", "alphaMap", "roughnessMap", "metalnessMap"]) { const t = m[k]; if (t && !keep.has(t)) t.dispose(); } m.dispose(); }
      if (this.scene.background && !keep.has(this.scene.background)) this.scene.background.dispose();
    }
    this.scene = new THREE.Scene();
    // a soft fill that follows the player so faces read in the night scenes
    this.fill = new THREE.PointLight(0xfff0e0, 1.6, 14, 1.4); this.fill.castShadow = false; this.scene.add(this.fill);
    this.colliders = []; this.circles = []; this.interactables = []; this.people = []; this.updaters = [];
    this.photoTargets = []; this.kolya = null; this.t = 0; this.zoom = 1; this.fovBase = 72;
  }
  load(id) {
    this.reset();
    const spawn = SCENES[id].call(this);
    this.player.x = spawn.x; this.player.z = spawn.z; this.player.yaw = spawn.yaw || 0; this.player.pitch = 0;
    this.bounds = spawn.bounds || { x0: -28, x1: 28, z0: -28, z1: 28 };
    this.camera.fov = this.fovBase; this.camera.updateProjectionMatrix();
    this.updateCamera();
    return spawn;
  }
  setStation(id, enabled) {
    for (const it of this.interactables) if (it.id === id) { it.enabled = enabled; if (it.grp) it.grp.visible = enabled; }
  }
  // ---- the player
  move(dt, mx, my, dx, dy) {
    const p = this.player;
    const sens = 0.0042 / this.zoom;
    p.yaw -= dx * sens; p.pitch = clamp(p.pitch - dy * sens, -1.2, 1.2);
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const speed = 4.6;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    let nx = p.x + (fx * my + rx * mx) * speed * dt, nz = p.z + (fz * my + rz * mx) * speed * dt;
    // collide
    const R = 0.38;
    for (let pass = 0; pass < 2; pass++) {
      for (const c of this.colliders) {
        const cx = clamp(nx, c.x - c.hw, c.x + c.hw), cz = clamp(nz, c.z - c.hd, c.z + c.hd);
        let ddx = nx - cx, ddz = nz - cz; let d = Math.hypot(ddx, ddz);
        if (d < R) {
          if (d < 1e-5) { // inside: push out along the smallest axis
            const ox = (c.hw - Math.abs(nx - c.x)), oz = (c.hd - Math.abs(nz - c.z));
            if (ox < oz) nx = c.x + Math.sign(nx - c.x || 1) * (c.hw + R); else nz = c.z + Math.sign(nz - c.z || 1) * (c.hd + R);
          } else { nx = cx + ddx / d * R; nz = cz + ddz / d * R; }
        }
      }
      for (const c of this.circles) {
        const ddx = nx - c.x, ddz = nz - c.z, d = Math.hypot(ddx, ddz), min = c.r + R;
        if (d < min) { if (d < 1e-5) nx += min; else { nx = c.x + ddx / d * min; nz = c.z + ddz / d * min; } }
      }
    }
    const b = this.bounds;
    nx = clamp(nx, b.x0, b.x1); nz = clamp(nz, b.z0, b.z1);
    const moved = Math.hypot(nx - p.x, nz - p.z);
    p.x = nx; p.z = nz;
    p.moving = lerp(p.moving, moved > 0.001 ? 1 : 0, Math.min(1, dt * 10));
    if (moved > 0.001) { p.bob += dt * 9; if (Math.sin(p.bob) > 0.98 && p.stepT <= 0) { SFX.step(); p.stepT = 0.25; } }
    p.stepT -= dt;
  }
  updateCamera() {
    const p = this.player;
    this.camera.position.set(p.x, 1.62 + Math.sin(p.bob) * 0.035 * p.moving, p.z);
    this.camera.rotation.set(p.pitch + this.sway * 0.5, p.yaw + this.sway, 0);
    if (this.fill) this.fill.position.set(p.x, 2.2, p.z);
  }
  forward() { return new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw)); }
  nearest() {
    const p = this.player; let best = null, bd = 1e9;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    for (const it of this.interactables) {
      if (!it.enabled) continue;
      const dx = it.x - p.x, dz = it.z - p.z, d = Math.hypot(dx, dz);
      if (d > it.radius) continue;
      const dot = (dx * fx + dz * fz) / (d || 1);
      if (d > 1.0 && dot < 0.2) continue;
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }
  // screen position of a world point (or null when behind the camera)
  project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    if (v.z > 1) return null;
    return { x: (v.x + 1) / 2 * this.W, y: (1 - v.y) / 2 * this.H };
  }
  angleTo(x, y, z) {
    const d = new THREE.Vector3(x, y, z).sub(this.camera.position).normalize();
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    return Math.acos(clamp(d.dot(f), -1, 1));
  }
  setZoom(z) { this.zoom = z; this.camera.fov = this.fovBase / z; this.camera.updateProjectionMatrix(); }
  update(dt, inp) {
    this.t += dt;
    if (inp) this.move(dt, inp.mx, inp.my, inp.dx, inp.dy);
    this.updateCamera();
    for (const u of this.updaters) u(dt);
    for (const rec of this.people) this.animatePerson(rec, dt);
    for (const it of this.interactables) if (it.kind === "station" && it.enabled) {
      const k = 0.5 + 0.5 * Math.sin(this.t * 3 + it.x);
      it.ring.scale.setScalar(1 + k * 0.15); it.ring.material.opacity = 0.5 + k * 0.5;
      it.sp.position.y = (2.3) + Math.sin(this.t * 2 + it.z) * 0.15;
      it.beam.material.opacity = 0.05 + k * 0.06;
    }
    if (this.kolya) {
      const k = this.kolya; k.t += dt; const u = clamp(k.t / k.dur, 0, 1);
      k.rec.grp.position.set(lerp(k.from[0], k.to[0], u), 0, lerp(k.from[1], k.to[1], u));
      k.rec.grp.rotation.y = Math.atan2(k.to[0] - k.from[0], k.to[1] - k.from[1]);
      k.rec.walk = 1.4;
      if (u >= 1) { k.rec.grp.visible = false; k.rec.walk = 0; this.kolya = null; }
    }
  }
  kolyaRun(from, to, dur) {
    let rec = this.people.find(p => p.id === "kolya");
    if (!rec) rec = this.addPerson("kolya", from[0], from[1], 0, { big: true, coat: 0x5a4a3a, hat: "ushanka", skin: 0xe8b995, prop: "food", faces: false });
    rec.grp.visible = true; rec.grp.position.set(from[0], 0, from[1]);
    this.kolya = { rec, from, to, dur: dur || 6, t: 0 };
  }
  render() { this.r.render(this.scene, this.camera); }
}

// Each scene function runs with `this` = the World and returns the spawn.
const SCENES = {};
export { SCENES, THREE };
