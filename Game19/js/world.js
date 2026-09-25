// The first-person 3D world: renderer, procedural textures, skies and
// image-based lighting, building and landform helpers, the player, collision,
// people, weather, and the stand-in scene used until a place has its own.
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

// ------------------------------------------------------------- skies
// Each preset is a painted sky (it is also what every shiny surface reflects),
// the fog that matches its horizon, a fill light and a sun.
const SKY_PRESETS = {
  day:           { zenith: "#2f6fc4", mid: "#7fb0e4", horizon: "#d8e8f4", ground: "#8a949a", sunEl: 48, sunAz: 35, sunColor: "#fff2dc", sunI: 2.1, glow: "#fff6e0", clouds: 16, fog: "#cfe0ec", fogNear: 70, fogFar: 330, hemiSky: "#bcd6f4", hemiGround: "#6a6052", hemiI: 0.55 },
  bright_day:    { zenith: "#1a66cc", mid: "#5aa0ec", horizon: "#d4eafa", ground: "#9aa6ae", sunEl: 60, sunAz: 20, sunColor: "#fff8e8", sunI: 2.5, glow: "#ffffff", clouds: 8, fog: "#d6ebf8", fogNear: 80, fogFar: 360, hemiSky: "#c4dcf8", hemiGround: "#8a7a60", hemiI: 0.55 },
  polar_day:     { zenith: "#3f74b8", mid: "#98bde4", horizon: "#f4d8c8", ground: "#d8e4f0", sunEl: 11, sunAz: -40, sunColor: "#ffd4ae", sunI: 2.0, glow: "#ffe0c0", clouds: 10, fog: "#e6edf5", fogNear: 70, fogFar: 340, hemiSky: "#cfe0ff", hemiGround: "#aebfd2", hemiI: 0.75 },
  fjord_day:     { zenith: "#52809f", mid: "#94b4ce", horizon: "#dce4ea", ground: "#6a7470", sunEl: 34, sunAz: 50, sunColor: "#fff0da", sunI: 1.6, glow: "#fff4e4", clouds: 26, fog: "#cfdbe3", fogNear: 50, fogFar: 290, hemiSky: "#b8cce0", hemiGround: "#4a5a48", hemiI: 0.6 },
  snow_day:      { zenith: "#3474c6", mid: "#86b4e6", horizon: "#e2eefb", ground: "#d8e2ec", sunEl: 30, sunAz: 30, sunColor: "#fff4e6", sunI: 2.0, glow: "#ffffff", clouds: 12, fog: "#e6eef7", fogNear: 70, fogFar: 330, hemiSky: "#cfe0ff", hemiGround: "#b4c4d4", hemiI: 0.7 },
  high_day:      { zenith: "#143f9a", mid: "#4a7ed0", horizon: "#cddff4", ground: "#c8d4e0", sunEl: 46, sunAz: 30, sunColor: "#ffffff", sunI: 2.4, glow: "#ffffff", clouds: 6, fog: "#d8e4f2", fogNear: 90, fogFar: 380, hemiSky: "#c0d4f4", hemiGround: "#9aa8b8", hemiI: 0.65 },
  sunset:        { zenith: "#26336e", mid: "#c8606a", horizon: "#ffbe78", ground: "#5a4048", sunEl: 6, sunAz: 250, sunColor: "#ffae6a", sunI: 2.1, glow: "#ffd090", clouds: 14, cloudTint: "#ffb0a0", fog: "#e8a888", fogNear: 60, fogFar: 300, hemiSky: "#ffc8a0", hemiGround: "#5a4450", hemiI: 0.6 },
  desert_day:    { zenith: "#3c7ec6", mid: "#98c0e0", horizon: "#f2e2c4", ground: "#c8a878", sunEl: 56, sunAz: 40, sunColor: "#fff0d0", sunI: 2.5, glow: "#fff8e8", clouds: 4, fog: "#efdcc0", fogNear: 80, fogFar: 380, hemiSky: "#cfe0f0", hemiGround: "#c8a070", hemiI: 0.55 },
  desert_dusk:   { zenith: "#161c48", mid: "#6a4a8a", horizon: "#ff965a", ground: "#5a3a3a", sunEl: 4, sunAz: 280, sunColor: "#ff9a5a", sunI: 1.6, glow: "#ffb070", clouds: 6, cloudTint: "#ff9a8a", stars: 220, fog: "#a87478", fogNear: 60, fogFar: 320, hemiSky: "#9a7ab0", hemiGround: "#5a3a30", hemiI: 0.6 },
  dawn:          { zenith: "#26386a", mid: "#b07a9a", horizon: "#ffc890", ground: "#6a5a58", sunEl: 8, sunAz: 90, sunColor: "#ffc890", sunI: 1.8, glow: "#ffe0b0", clouds: 12, cloudTint: "#ffc0b0", fog: "#d8b8b0", fogNear: 35, fogFar: 260, hemiSky: "#e0b8c0", hemiGround: "#4a4a40", hemiI: 0.65 },
  night_glam:    { zenith: "#060a1c", mid: "#161838", horizon: "#3a2a52", ground: "#141420", sunEl: 38, sunAz: 200, sunColor: "#9ab0ff", sunI: 0.55, glow: "#c8d4ff", moon: true, clouds: 4, stars: 420, cityGlow: "#ffb060", fog: "#181630", fogNear: 50, fogFar: 260, hemiSky: "#4a5a9a", hemiGround: "#20202a", hemiI: 0.6, envI: 0.55 },
  night_neon:    { zenith: "#08051c", mid: "#260a46", horizon: "#782888", ground: "#140a20", sunEl: 40, sunAz: 150, sunColor: "#a090ff", sunI: 0.45, glow: "#d0c0ff", moon: true, clouds: 6, cloudTint: "#8a4aa0", stars: 150, cityGlow: "#ff4aa0", fog: "#2a1440", fogNear: 40, fogFar: 230, hemiSky: "#6a4aa0", hemiGround: "#1a0a20", hemiI: 0.6, envI: 0.6 },
  overcast_cold: { zenith: "#667686", mid: "#98a6b2", horizon: "#c8d0d8", ground: "#6a7278", sunEl: 24, sunAz: 30, sunColor: "#e8eef4", sunI: 1.1, glow: "#f0f4f8", clouds: 40, fog: "#b8c4cc", fogNear: 40, fogFar: 250, hemiSky: "#b0bcc8", hemiGround: "#5a6268", hemiI: 0.8 },
  blizzard:      { zenith: "#8898a8", mid: "#b8c6d2", horizon: "#e0e7ed", ground: "#d8e0e8", sunEl: 22, sunAz: 30, sunColor: "#eef4fa", sunI: 0.9, glow: "#ffffff", clouds: 60, fog: "#d6dee6", fogNear: 16, fogFar: 140, hemiSky: "#d0dce8", hemiGround: "#b8c4d0", hemiI: 1.0 },
  cave:          { zenith: "#021018", mid: "#063048", horizon: "#0a4a6a", ground: "#021018", sunEl: 80, sunAz: 0, sunColor: "#7fd0ff", sunI: 0.8, glow: "#4ab0e0", clouds: 0, fog: "#062436", fogNear: 14, fogFar: 110, hemiSky: "#3a90c0", hemiGround: "#0a1a28", hemiI: 1.0, envI: 1.0 },
  volcano_night: { zenith: "#0a0508", mid: "#2a0a0a", horizon: "#a8360c", ground: "#1a0806", sunEl: 36, sunAz: 160, sunColor: "#ff7a44", sunI: 0.95, glow: "#ff6a20", clouds: 18, cloudTint: "#8a2a14", stars: 220, fog: "#2a0e08", fogNear: 35, fogFar: 230, hemiSky: "#ff8a58", hemiGround: "#240808", hemiI: 0.6, envI: 0.7 },
};
// a painted equirectangular sky: gradient, sun or moon, soft clouds, stars
function skyTexture(P) {
  const W = 1024, H = 512;
  return (() => {
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, P.zenith); gr.addColorStop(0.3, P.mid); gr.addColorStop(0.49, P.horizon); gr.addColorStop(0.52, P.horizon); gr.addColorStop(0.62, P.ground); gr.addColorStop(1, P.ground);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // where the sun (or moon) sits, using three.js's own equirectangular mapping
    const el = P.sunEl * Math.PI / 180, az = P.sunAz * Math.PI / 180;
    const dx = Math.cos(el) * Math.sin(az), dy = Math.sin(el), dz = Math.cos(el) * Math.cos(az);
    const sx = (Math.atan2(dz, dx) / TAU + 0.5) * W, sy = (0.5 - Math.asin(dy) / Math.PI) * H;
    if (P.cityGlow) { const cg = g.createLinearGradient(0, H * 0.36, 0, H * 0.52); cg.addColorStop(0, "rgba(0,0,0,0)"); cg.addColorStop(1, P.cityGlow + "88"); g.fillStyle = cg; g.fillRect(0, H * 0.36, W, H * 0.16); }
    if (P.stars) { for (let i = 0; i < P.stars * 1.6; i++) { const x = hash(i, 3) * W, y = hash(i, 5) * H * 0.46; g.fillStyle = `rgba(255,255,255,${0.25 + hash(i, 8) * 0.6})`; const r = hash(i, 11) < 0.08 ? 1.6 : 0.8; g.fillRect(x, y, r, r); } }
    // glow round the sun, wrapped across the seam
    for (const off of [-W, 0, W]) {
      const rg = g.createRadialGradient(sx + off, sy, 0, sx + off, sy, P.moon ? 90 : 220);
      rg.addColorStop(0, P.glow + (P.moon ? "88" : "ff")); rg.addColorStop(0.08, P.glow + (P.moon ? "44" : "cc")); rg.addColorStop(1, P.glow + "00");
      g.fillStyle = rg; g.fillRect(sx + off - 240, sy - 240, 480, 480);
    }
    g.fillStyle = P.moon ? "#e8eeff" : "#ffffff"; g.beginPath(); g.arc(sx, sy, P.moon ? 9 : 11, 0, TAU); g.fill();
    // soft clouds in a band above the horizon
    const tint = P.cloudTint || "#ffffff";
    for (let i = 0; i < P.clouds; i++) {
      const cx = hash(i, 21) * W, cy = H * (0.28 + hash(i, 23) * 0.19), w = 60 + hash(i, 25) * 150, h = 10 + hash(i, 27) * 18;
      for (let k = 0; k < 6; k++) { for (const off of [-W, 0, W]) { const x = cx + off + (hash(i, k) - 0.5) * w, y = cy + (hash(k, i) - 0.5) * h; const rg = g.createRadialGradient(x, y, 0, x, y, w * 0.4); rg.addColorStop(0, tint + "66"); rg.addColorStop(1, tint + "00"); g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, w * 0.4, h, 0, 0, TAU); g.fill(); } }
    }
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
}

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
  // a hidden UMBRA listening device: small, dark, and blinking once a second
  bug(x, y, z) {
    const n = this.bugN = (this.bugN || 0) + 1;
    const id = `${this.sceneId}:${n - 1}`;
    if (this.foundBugs && this.foundBugs.has(id)) return null;
    const grp = new THREE.Group(); grp.position.set(x, y, z); this.scene.add(grp);
    const dark = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.5, metalness: 0.5 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.03, 10), dark);
    base.position.y = -0.05; grp.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.11, 0.14), dark);
    grp.add(body);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2b3c }));
    led.position.set(0.07, 0.055, 0); grp.add(led);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.dotTex, color: 0xff2b3c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.copy(led.position); glow.scale.set(0.34, 0.34, 1); grp.add(glow);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0x6a6a70 }));
    wire.position.set(-0.09, 0.14, 0); wire.rotation.z = 0.25; grp.add(wire);
    const it = { id, kind: "bug", x, z, y: y + 0.1, radius: 2.4, label: "UMBRA listening device", grp, enabled: true };
    this.interactables.push(it);
    this.updaters.push(dt => { const b = (Math.sin(this.t * 3.2) + 1) / 2; glow.material.opacity = 0.12 + b * 0.5; led.material.color.setRGB(0.5 + b * 0.5, 0.06, 0.1); });
    return it;
  }
  removeBug(it) {
    if (it.grp) { this.scene.remove(it.grp); it.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map && o.material.map !== this.dotTex) o.material.map.dispose(); o.material.dispose(); } }); it.grp = null; }
    const i = this.interactables.indexOf(it); if (i >= 0) this.interactables.splice(i, 1);
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
  // ---- people. Rounded bodies that swing from the hips and shoulders, and a
  // painted face: eyes that catch the light, brows, a nose and a smile.
  // Geometry and materials are shared between everyone in a scene.
  geoC(key, make) { this.gcache = this.gcache || {}; return this.gcache[key] || (this.gcache[key] = make()); }
  matC(color, o) { o = o || {}; const key = color + "|" + (o.r === undefined ? "" : o.r) + "|" + (o.m || 0) + "|" + (o.e || ""); this.mcache = this.mcache || {}; return this.mcache[key] || (this.mcache[key] = this.M({ color, roughness: o.r === undefined ? 0.8 : o.r, metalness: o.m || 0, emissive: o.e, ei: o.ei })); }
  faceTex(f) {
    const key = JSON.stringify(f); this.fcache = this.fcache || {};
    if (this.fcache[key]) return this.fcache[key];
    const t = canvasTex(256, 128, (g, w, h) => {
      const skin = "#" + new THREE.Color(f.skin).getHexString();
      g.fillStyle = skin; g.fillRect(0, 0, w, h);
      const cx = w * 0.25, ey = h * 0.47, dx = w * 0.047;
      // cheeks
      g.fillStyle = "rgba(230,110,110,.22)"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * dx * 1.55, h * 0.6, 9, 6, 0, 0, TAU); g.fill(); }
      // eyes
      for (const s of [-1, 1]) {
        const x = cx + s * dx;
        if (f.patch && s < 0) { g.fillStyle = "#141414"; g.beginPath(); g.ellipse(x, ey, 10, 9, 0, 0, TAU); g.fill(); continue; }
        g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, ey, 7.5, 8.5, 0, 0, TAU); g.fill();
        g.fillStyle = "#" + new THREE.Color(f.eyes || 0x3a4a6a).getHexString(); g.beginPath(); g.arc(x, ey + 1, 5, 0, TAU); g.fill();
        g.fillStyle = "#101014"; g.beginPath(); g.arc(x, ey + 1, 2.7, 0, TAU); g.fill();
        g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 1.6, ey - 1.4, 1.4, 0, TAU); g.fill();
      }
      // brows
      g.strokeStyle = "#" + new THREE.Color(f.brow || f.hair || 0x3a2a1a).getHexString(); g.lineWidth = f.stern ? 3.6 : 2.6; g.lineCap = "round";
      for (const s of [-1, 1]) { g.beginPath(); if (f.stern) { g.moveTo(cx + s * dx - s * 7, ey - 10); g.lineTo(cx + s * dx + s * 6, ey - 13); } else g.arc(cx + s * dx, ey + 2, 11, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
      // nose and mouth
      g.strokeStyle = "rgba(90,40,30,.35)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, h * 0.55, 3.5, 0.2, Math.PI - 0.2); g.stroke();
      g.strokeStyle = f.lips || "#8a3030"; g.lineWidth = 2.6; g.beginPath();
      if (f.frown) g.arc(cx, h * 0.7, 7, Math.PI * 1.15, Math.PI * 1.85); else g.arc(cx, h * 0.6, 8, Math.PI * 0.18, Math.PI * 0.82);
      g.stroke();
    });
    return (this.fcache[key] = t);
  }
  person(o) {
    o = o || {};
    const g = new THREE.Group();
    const sc = o.big ? 1.3 : 1;
    const skinC = o.skin === undefined ? 0xf1c9a5 : o.skin;
    const skin = this.matC(skinC), coat = this.matC(o.coat === undefined ? 0x334466 : o.coat), trous = this.matC(o.trousers === undefined ? 0x222233 : o.trousers), shoe = this.matC(o.shoes === undefined ? 0x1a1a1e : o.shoes, { r: 0.5 });
    const cap = (r, len) => this.geoC(`cap${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 4, 10));
    const sph = (r, a, b) => this.geoC(`sph${r}|${a}|${b}`, () => new THREE.SphereGeometry(r, a || 16, b || 12));
    const mesh = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || g).add(m); return m; };
    // legs swing from the hips
    const legs = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(s * 0.11 * sc, 0.86, 0); g.add(hip);
      mesh(cap(0.085 * sc, 0.58), trous, 0, -0.38, 0, hip);
      const f = mesh(this.geoC("shoe" + sc, () => new THREE.BoxGeometry(0.16 * sc, 0.1, 0.27 * sc)), shoe, 0, -0.8, 0.04, hip);
      legs.push(hip);
    }
    // body, with an optional long coat below the waist
    const body = mesh(cap(0.2 * sc, 0.38), coat, 0, 1.15, 0); body.scale.set(1.25, 1, 0.82);
    if (o.long) { const skirt = mesh(this.geoC("skirt" + sc, () => new THREE.CylinderGeometry(0.24 * sc, 0.33 * sc, 0.5, 14, 1, true)), coat, 0, 0.72, 0); skirt.material = this.matC(o.coat, {}); }
    if (o.tie) mesh(this.geoC("tie", () => new THREE.BoxGeometry(0.06, 0.3, 0.02)), this.matC(o.tie), 0, 1.22, 0.2 * sc * 0.84);
    if (o.belt) mesh(this.geoC("belt" + sc, () => new THREE.CylinderGeometry(0.255 * sc, 0.255 * sc, 0.06, 14)), this.matC(o.belt, { r: 0.4 }), 0, 0.9, 0).scale.set(1, 1, 0.82);
    // arms swing from the shoulders
    const arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(s * 0.3 * sc, 1.42, 0); g.add(sh);
      mesh(cap(0.065 * sc, 0.42), coat, 0, -0.27, 0, sh);
      mesh(sph(0.062 * sc, 10, 8), skin, 0, -0.55, 0.01, sh);
      arms.push(sh);
    }
    mesh(this.geoC("neck" + sc, () => new THREE.CylinderGeometry(0.07 * sc, 0.08 * sc, 0.12, 10)), skin, 0, 1.55, 0);
    // the head and its face
    const face = this.matC(skinC); const faceMat = new THREE.MeshStandardMaterial({ map: this.faceTex({ skin: skinC, eyes: o.eyes, hair: o.hair, stern: o.stern, patch: o.eyepatch, frown: o.frown }), roughness: 0.75 });
    const head = new THREE.Mesh(sph(0.19 * sc, 20, 14), faceMat); head.position.y = 1.72; head.castShadow = true; g.add(head);
    const hairC = o.hair === undefined ? 0x2a1a10 : o.hair;
    const hairM = this.matC(hairC, { r: 0.9 });
    const hr = 0.2 * sc;
    const hairCap = () => { const m = new THREE.Mesh(this.geoC("hair" + sc, () => new THREE.SphereGeometry(hr, 18, 10, 0, TAU, 0, Math.PI * 0.42)), hairM); m.rotation.x = -0.42; m.position.set(0, 0.01, -0.012); head.add(m); return m; };
    const style = o.hairStyle || (o.hat ? "none" : "short");
    if (style !== "bald" && style !== "none") hairCap();
    if (style === "long") { const b = new THREE.Mesh(this.geoC("hairlong" + sc, () => new THREE.CylinderGeometry(hr * 0.95, hr * 1.05, 0.34, 14, 1, true, Math.PI * 0.62, Math.PI * 1.76)), hairM); b.position.set(0, -0.14, -0.01); head.add(b); }
    if (style === "bun") { const b = new THREE.Mesh(sph(0.08 * sc, 10, 8), hairM); b.position.set(0, 0.12, -0.17); head.add(b); }
    if (style === "ponytail") { const b = new THREE.Mesh(cap(0.05 * sc, 0.22), hairM); b.position.set(0, -0.05, -0.22); b.rotation.x = 0.35; head.add(b); }
    if (style === "curly") for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; const b = new THREE.Mesh(sph(0.065 * sc, 8, 6), hairM); b.position.set(Math.cos(a) * 0.16, 0.1 + Math.sin(i * 1.7) * 0.03, Math.sin(a) * 0.14 - 0.04); head.add(b); }
    if (o.beard !== undefined) { const b = new THREE.Mesh(this.geoC("beard" + sc, () => new THREE.SphereGeometry(hr * 0.96, 16, 10, Math.PI * 0.05, Math.PI * 0.9, Math.PI * 0.52, Math.PI * 0.42)), this.matC(o.beard, { r: 1 })); b.rotation.y = Math.PI; b.scale.set(1, o.bigBeard ? 1.5 : 1, 1.05); b.position.y = o.bigBeard ? -0.05 : 0; head.add(b); }
    if (o.moustache !== undefined) { const m = new THREE.Mesh(this.geoC("mous", () => new THREE.CapsuleGeometry(0.018, 0.09, 2, 6)), this.matC(o.moustache)); m.rotation.z = Math.PI / 2; m.position.set(0, -0.055, 0.185 * sc); head.add(m); }
    // hats
    const hatM = this.matC(o.hatColor === undefined ? 0x2a2a30 : o.hatColor, { r: 0.7 });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; head.add(m); return m; };
    switch (o.hat) {
      case "cap": add(this.geoC("hatcap" + sc, () => new THREE.SphereGeometry(hr * 1.04, 16, 8, 0, TAU, 0, Math.PI * 0.45)), hatM, 0, 0.02, 0); add(this.geoC("peak", () => new THREE.BoxGeometry(0.2, 0.025, 0.16)), hatM, 0, 0.07, 0.2 * sc).rotation.x = 0.2; break;
      case "beanie": add(this.geoC("beanie" + sc, () => new THREE.SphereGeometry(hr * 1.07, 16, 8, 0, TAU, 0, Math.PI * 0.5)), hatM, 0, 0.03, 0); add(this.geoC("fold" + sc, () => new THREE.CylinderGeometry(hr * 1.08, hr * 1.08, 0.06, 16)), this.matC(o.hatColor2 === undefined ? 0xf0f0f0 : o.hatColor2), 0, 0.05, 0); add(sph(0.05, 8, 6), this.matC(o.hatColor2 === undefined ? 0xf0f0f0 : o.hatColor2), 0, 0.25 * sc, 0); break;
      case "ushanka": add(this.geoC("ush" + sc, () => new THREE.SphereGeometry(hr * 1.2, 14, 8, 0, TAU, 0, Math.PI * 0.55)), hatM, 0, 0.02, 0); add(this.geoC("ushflap" + sc, () => new THREE.BoxGeometry(0.5 * sc, 0.16, 0.2)), hatM, 0, -0.06, -0.02); break;
      case "hood": { const t = add(this.geoC("hood" + sc, () => new THREE.TorusGeometry(hr * 1.02, 0.07 * sc, 8, 18)), this.matC(o.hatColor2 === undefined ? 0xf0ece0 : o.hatColor2, { r: 1 }), 0, 0, 0.05); add(this.geoC("hoodback" + sc, () => new THREE.SphereGeometry(hr * 1.14, 14, 10, Math.PI * 0.5, Math.PI, 0, Math.PI * 0.8)), hatM, 0, 0.01, -0.02).rotation.y = Math.PI; break; }
      case "helmet": add(this.geoC("helm" + sc, () => new THREE.SphereGeometry(hr * 1.18, 18, 12)), hatM, 0, 0.02, -0.01); add(this.geoC("visor" + sc, () => new THREE.SphereGeometry(hr * 1.2, 16, 8, Math.PI * 1.2, Math.PI * 0.6, Math.PI * 0.35, Math.PI * 0.3)), this.matC(o.visor === undefined ? 0x101018 : o.visor, { r: 0.1, m: 0.6 }), 0, 0.02, 0); break;
      case "captain": add(this.geoC("capt" + sc, () => new THREE.CylinderGeometry(hr * 1.15, hr * 1.02, 0.12, 18)), this.matC(0xf4f4f4), 0, 0.14, -0.01); add(this.geoC("captband" + sc, () => new THREE.CylinderGeometry(hr * 1.03, hr * 1.03, 0.06, 18)), this.matC(0x10182a), 0, 0.08, 0); add(this.geoC("captpeak", () => new THREE.BoxGeometry(0.22, 0.02, 0.12)), this.matC(0x10182a, { r: 0.3 }), 0, 0.06, 0.2 * sc).rotation.x = 0.15; add(sph(0.025, 6, 5), this.matC(0xffd166, { m: 0.8, r: 0.3 }), 0, 0.1, 0.21 * sc); break;
      case "ranger": add(this.geoC("rangerbrim" + sc, () => new THREE.CylinderGeometry(0.36 * sc, 0.36 * sc, 0.02, 18)), hatM, 0, 0.1, 0); add(this.geoC("rangertop" + sc, () => new THREE.CylinderGeometry(0.14 * sc, 0.19 * sc, 0.16, 14)), hatM, 0, 0.18, 0); break;
      case "trilby": add(this.geoC("tril", () => new THREE.CylinderGeometry(0.32, 0.32, 0.02, 16)), hatM, 0, 0.1, 0); add(this.geoC("triltop", () => new THREE.CylinderGeometry(0.17, 0.2, 0.18, 16)), hatM, 0, 0.2, 0); break;
      case "beret": { const m = add(this.geoC("beret" + sc, () => new THREE.SphereGeometry(hr * 1.15, 14, 6)), hatM, 0.03, 0.14, 0); m.scale.set(1, 0.35, 1); break; }
      case "hardhat": add(this.geoC("hard" + sc, () => new THREE.SphereGeometry(hr * 1.1, 14, 8, 0, TAU, 0, Math.PI * 0.5)), this.matC(o.hatColor === undefined ? 0xf0c020 : o.hatColor, { r: 0.4 }), 0, 0.03, 0); add(this.geoC("hardbrim" + sc, () => new THREE.CylinderGeometry(hr * 1.3, hr * 1.3, 0.02, 16)), this.matC(o.hatColor === undefined ? 0xf0c020 : o.hatColor, { r: 0.4 }), 0, 0.03, 0.03); break;
      case "bandana": add(this.geoC("band" + sc, () => new THREE.CylinderGeometry(hr * 1.04, hr * 1.04, 0.07, 14)), hatM, 0, 0.1, 0); break;
      case "boater": add(this.geoC("boat", () => new THREE.CylinderGeometry(0.34, 0.34, 0.02, 16)), this.matC(0xe8d8a0), 0, 0.12, 0); add(this.geoC("boattop", () => new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16)), this.matC(0xe8d8a0), 0, 0.19, 0); break;
    }
    if (o.hat && style !== "none" && style !== "bald" && o.hat !== "helmet" && o.hat !== "hood" && o.hat !== "ushanka") hairCap();
    if (o.glasses) { const gm = this.matC(0x141414, { r: 0.3 }); for (const s of [-1, 1]) add(this.geoC("lens", () => new THREE.TorusGeometry(0.042, 0.009, 6, 14)), gm, s * 0.05 * sc, 0.015, 0.182 * sc); add(this.geoC("bridge", () => new THREE.BoxGeometry(0.03, 0.008, 0.008)), gm, 0, 0.02, 0.19 * sc); }
    if (o.goggles) { const gm = this.matC(0xffa020, { r: 0.3, m: 0.3 }); for (const s of [-1, 1]) add(this.geoC("gog", () => new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12)), gm, s * 0.06, 0.13, 0.15).rotation.x = Math.PI / 2 - 0.5; add(this.geoC("gogstrap" + sc, () => new THREE.TorusGeometry(hr * 1.02, 0.012, 5, 20)), this.matC(0x2a2a30), 0, 0.1, 0).rotation.x = Math.PI / 2 - 0.25; }
    if (o.monocle) add(this.geoC("mono", () => new THREE.TorusGeometry(0.045, 0.008, 6, 14)), this.matC(0xffd166, { m: 0.9, r: 0.2 }), 0.05, 0.015, 0.185 * sc);
    // props held in the hands
    const P = (geo, mat, x, y, z) => mesh(geo, mat, x * sc, y, z);
    switch (o.prop) {
      case "food": P(this.geoC("food", () => new THREE.BoxGeometry(0.2, 0.12, 0.12)), this.matC(0xd9a066), 0.36, 0.9, 0.18); break;
      case "penguin": { const pg = new THREE.Group(); pg.position.set(0, 1.0, 0.3 * sc); g.add(pg); const bm = this.matC(0x141418), wm = this.matC(0xf4f4f4), om = this.matC(0xffa000); const b = new THREE.Mesh(this.geoC("pgb", () => new THREE.CapsuleGeometry(0.09, 0.12, 3, 8)), bm); pg.add(b); const w = new THREE.Mesh(this.geoC("pgw", () => new THREE.SphereGeometry(0.075, 10, 8)), wm); w.position.set(0, -0.02, 0.05); w.scale.set(1, 1.3, 0.6); pg.add(w); const bk = new THREE.Mesh(this.geoC("pgk", () => new THREE.ConeGeometry(0.025, 0.06, 6)), om); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.1, 0.09); pg.add(bk); break; }
      case "clipboard": P(this.geoC("clip", () => new THREE.BoxGeometry(0.22, 0.3, 0.02)), this.matC(0xc89a5a), 0.3, 1.0, 0.2); break;
      case "wrench": P(this.geoC("wrench", () => new THREE.BoxGeometry(0.04, 0.3, 0.03)), this.matC(0xb0b8c0, { m: 0.8, r: 0.3 }), 0.33, 0.85, 0.12); break;
      case "skateboard": { const m = P(this.geoC("skate", () => new THREE.BoxGeometry(0.2, 0.7, 0.03)), this.matC(0xe03a2a), 0.42, 1.0, -0.05); m.rotation.z = 0.2; break; }
      case "pipe": add(this.geoC("pipe", () => new THREE.CylinderGeometry(0.02, 0.03, 0.12, 6)), this.matC(0x5a3a1a), 0.06, -0.08, 0.22).rotation.x = Math.PI / 2 - 0.3; break;
      case "torch": P(this.geoC("torch", () => new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8)), this.matC(0x333333), 0.36, 0.95, 0.25).rotation.x = Math.PI / 2; break;
      case "board": P(this.geoC("board", () => new THREE.BoxGeometry(0.5, 2.2, 0.08)), this.matC(0x27ae60), 0.55, 1.1, -0.1); break;
      case "oar": { const m = P(this.geoC("oar", () => new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8)), this.matC(0x6b4423), 0.45, 1.3, 0.1); m.rotation.z = 0.2; break; }
      case "tablet": P(this.geoC("tab", () => new THREE.BoxGeometry(0.26, 0.18, 0.02)), this.matC(0x1a1a22, { r: 0.2, e: 0x3a9aff, ei: 0.6 }), 0, 1.05, 0.32).rotation.x = -0.6; break;
    }
    if (o.kid) g.scale.setScalar(0.8);
    g.userData = { legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1], head, body, t: Math.random() * 10, walk: 0 };
    return g;
  }
  // ---- skies. One call sets the sky picture, the reflections every metal and
  // glass surface picks up (image-based lighting), the fog, the fill light and
  // the sun, so every scene is lit the same way and nothing looks flat.
  setSky(preset, o) {
    o = o || {};
    const P = Object.assign({}, SKY_PRESETS[preset] || SKY_PRESETS.day, o);
    const S = this.scene;
    const key = preset + JSON.stringify(o);
    let pack = this.skyCache && this.skyCache[key];
    if (!pack) {
      const tex = skyTexture(P);
      if (!this.pmrem) this.pmrem = new THREE.PMREMGenerator(this.r);
      const env = this.pmrem.fromEquirectangular(tex).texture;
      pack = { tex, env };
      this.skyCache = this.skyCache || {}; this.skyCache[key] = pack;
    }
    S.background = pack.tex; S.environment = pack.env;
    S.environmentIntensity = P.envI === undefined ? 0.8 : P.envI;
    S.backgroundIntensity = 1;
    S.fog = new THREE.Fog(new THREE.Color(P.fog), P.fogNear, P.fogFar);
    S.add(new THREE.HemisphereLight(new THREE.Color(P.hemiSky), new THREE.Color(P.hemiGround), P.hemiI));
    const el = P.sunEl * Math.PI / 180, az = P.sunAz * Math.PI / 180;
    const sx = Math.cos(el) * Math.sin(az) * 60, sy = Math.max(8, Math.sin(el) * 60), sz = Math.cos(el) * Math.cos(az) * 60;
    this.sunLight = this.sun(new THREE.Color(P.sunColor), P.sunI, sx, sy, sz, o.shadow || 55);
    this.skyPreset = P;
    if (P.stars) this.starfield(P.stars);
    return P;
  }
  // a few hundred points of light on a dome, twinkling
  starfield(n) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = hash(i, 7) * TAU, e = 0.12 + hash(i, 9) * 1.35; pos[i * 3] = Math.cos(e) * Math.sin(a) * 180; pos[i * 3 + 1] = Math.sin(e) * 180; pos[i * 3 + 2] = Math.cos(e) * Math.cos(a) * 180; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ map: this.dotTex, size: 1.6, transparent: true, opacity: 0.9, depthWrite: false, fog: false, color: 0xffffff, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; this.scene.add(pts);
    this.updaters.push(() => { mat.opacity = 0.75 + Math.sin(this.t * 1.7) * 0.15; pts.position.set(this.player.x, 0, this.player.z); });
    return pts;
  }

  // ---- landforms
  // a jagged mountain with an optional snow cap
  mountain(x, z, r, h, o) {
    o = o || {};
    const seed = o.seed || (x * 13 + z * 7);
    const geo = new THREE.ConeGeometry(r, h, 11, 6);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > h / 2 - 0.01) continue; const k = 1 - (y + h / 2) / h; p.setX(i, p.getX(i) * (0.82 + hash(i, seed) * 0.36)); p.setZ(i, p.getZ(i) * (0.82 + hash(seed, i) * 0.36)); p.setY(i, y + (hash(i * 3, seed) - 0.5) * h * 0.08 * k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.M({ color: o.color || 0x5a5f68, roughness: 1 })); m.position.set(x, h / 2 + (o.y || 0), z); m.castShadow = false; m.receiveShadow = true; this.scene.add(m);
    if (o.snow !== false) {
      const k = o.snowLine || 0.38, cap = new THREE.Mesh(new THREE.ConeGeometry(r * k * 1.04, h * k, 11, 1), this.M({ color: o.snowColor || 0xf2f6ff, roughness: 0.9 }));
      cap.position.set(x, h - h * k / 2 + (o.y || 0) + 0.05, z); cap.rotation.y = hash(seed, 3) * TAU; this.scene.add(cap);
    }
    return m;
  }
  // a floating slab of ice, part of it under the water
  iceberg(x, z, s, o) {
    o = o || {};
    const geo = new THREE.IcosahedronGeometry(s, 1); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 0.75 + hash(i, (x * 7 + z) | 0) * 0.5; p.setXYZ(i, p.getX(i) * k * (o.wide || 1.4), p.getY(i) * k * (o.tall || 0.8), p.getZ(i) * k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.M({ color: o.color || 0xdff2ff, roughness: 0.35, metalness: 0.05 })); m.position.set(x, (o.y || 0) + s * 0.25, z); m.rotation.y = hash(x | 0, z | 0) * TAU; m.castShadow = true; m.receiveShadow = true; this.scene.add(m);
    if (o.collide !== false) this.circle(x, z, s * 1.1);
    if (o.bob) this.updaters.push(() => { m.position.y = (o.y || 0) + s * 0.25 + Math.sin(this.t * 0.6 + x) * 0.08; });
    return m;
  }
  rock(x, z, s, o) {
    o = o || {};
    const geo = new THREE.DodecahedronGeometry(s, 0); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 0.8 + hash(i, (x * 3 + z * 11) | 0) * 0.4; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * (o.flat || 0.7), p.getZ(i) * k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.M({ color: o.color || 0x6a6660, roughness: 1 })); m.position.set(x, s * 0.35 * (o.flat || 0.7), z); m.rotation.y = hash(z | 0, x | 0) * TAU; m.castShadow = true; m.receiveShadow = true; this.scene.add(m);
    if (o.collide !== false) this.circle(x, z, s * 0.9);
    return m;
  }
  // ---- ambient life: people walking their own routes, traffic, and birds
  // A path is a list of [x, z] corners walked as a loop.
  pathWalker(path, t) {
    let total = 0; const segs = [];
    for (let i = 0; i < path.length; i++) {
      const a = path[i], b = path[(i + 1) % path.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push({ a, b, len, at: total }); total += len;
    }
    const d = ((t % total) + total) % total;
    const sg = segs.find(q => d < q.at + q.len) || segs[segs.length - 1];
    const u = sg.len ? (d - sg.at) / sg.len : 0;
    return { x: sg.a[0] + (sg.b[0] - sg.a[0]) * u, z: sg.a[1] + (sg.b[1] - sg.a[1]) * u,
      yaw: Math.atan2(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]), total };
  }
  crowd(path, n, o) {
    o = o || {};
    const skins = o.skins || [0xf1d2b8, 0xc9946a, 0x8a5a3a, 0x6b4226, 0xe8b890, 0xf3ddc4];
    const coats = o.coats || [0x2a4a7a, 0x8a3a3a, 0x3a6a4a, 0x6a4a8a, 0xb8860b, 0x3a3a44, 0xc0603a];
    for (let i = 0; i < n; i++) {
      const look = { coat: coats[(i * 3 + 1) % coats.length], skin: skins[(i * 5 + 2) % skins.length],
        trousers: [0x2a2a33, 0x4a3a2a, 0x33405a][i % 3], hair: [0x1a1a1a, 0x4a2a12, 0x6a5a3a][(i * 2) % 3], faces: false };
      if (o.hat && i % 3 === 0) look.hat = o.hat;
      const rec = this.addPerson("walker" + i, path[0][0], path[0][1], 0, look);
      rec.walk = 1;
      const speed = (o.speed || 1.15) * (0.82 + (i % 5) * 0.09);
      const off = (i / n) * 1000 + (i % 3) * 7;
      this.updaters.push(dt => {
        const p = this.pathWalker(path, off + this.t * speed);
        rec.grp.position.set(p.x, 0, p.z); rec.grp.rotation.y = p.yaw;
        rec.x = p.x; rec.z = p.z;
      });
    }
  }
  traffic(path, n, o) {
    o = o || {};
    const cols = o.colors || [0xd94f3d, 0x2a6fdb, 0xe8e4dc, 0x2a2a30, 0xf0b429, 0x3f7a5a];
    for (let i = 0; i < n; i++) {
      // the car is built at the origin and driven by the updater below, so the
      // collider car() registers there would be a phantom wall: drop it
      const nC = this.colliders.length, nR = this.circles.length;
      const g = o.build ? o.build.call(this, i) : this.car(0, 0, 0, cols[i % cols.length], o.carOpts);
      this.colliders.length = nC; this.circles.length = nR;
      const speed = (o.speed || 7) * (0.85 + (i % 4) * 0.1);
      const off = (i / n) * 1000;
      this.updaters.push(dt => {
        const p = this.pathWalker(path, off + this.t * speed);
        g.position.set(p.x, o.y || 0, p.z); g.rotation.y = p.yaw;
      });
    }
  }
  birds(x, y, z, r, n, o) {
    o = o || {};
    const m = new THREE.MeshBasicMaterial({ color: o.color === undefined ? 0x2a2a2a : o.color });
    const g = new THREE.Group(); g.position.set(x, y, z); this.scene.add(g);
    const wings = [];
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(o.size || 0.5, 0.04, 0.1), m);
      b.position.set(Math.sin(i * 2.3) * r * 0.4, Math.cos(i * 1.9) * 2.2, Math.cos(i * 2.7) * r * 0.4);
      g.add(b); wings.push(b);
    }
    const sp = o.speed || 0.25;
    this.updaters.push(dt => {
      g.rotation.y = this.t * sp;
      g.position.y = y + Math.sin(this.t * 0.5) * 1.6;
      wings.forEach((b, i) => { b.rotation.z = Math.sin(this.t * 7 + i) * 0.7; });
    });
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
    const p = this.plane(w, d, m, x, o.y === undefined ? 0.02 : o.y, z, -Math.PI / 2); p.receiveShadow = true;
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
      const keep = new Set([...Object.values(this.tex), ...Object.values(this.sky), this.dotTex, this.streakTex, ...Object.values(this.iconTex), ...Object.values(this.skyCache || {}).flatMap(p => [p.tex, p.env])]);
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
    this.gcache = {}; this.mcache = {}; this.fcache = {}; this.sunLight = null; this.skyPreset = null;
  }
  load(id, info) {
    this.reset();
    this.sceneId = id; this.bugN = 0;
    const spawn = SCENES[id] ? SCENES[id].call(this) : this.standIn(info);
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
    const eye = p.eye === undefined ? 1.62 : p.eye;
    this.camera.position.set(p.x, eye + Math.sin(p.bob) * 0.035 * p.moving, p.z);
    this.camera.rotation.set(p.pitch + this.sway * 0.5, p.yaw + this.sway, p.roll || 0);
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
      // a hidden bug must never stand between the player and a mission
      const rank = it.kind === "bug" ? 6 : 0;
      const dot = (dx * fx + dz * fz) / (d || 1);
      if (d > 1.0 && dot < 0.2) continue;
      if (d + rank < bd) { bd = d + rank; best = it; }
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
// Until a place has its own scene it gets this one: its sky, a plaza, its
// stations in a ring, its contact and its three bugs, so the whole game can be
// played from the first day.
World.prototype.standIn = function (info) {
  info = info || { missions: [], sky: "day" };
  this.setSky(info.sky || "day");
  const snowy = /polar|snow|blizzard|high/.test(info.sky || "");
  this.ground(this.M({ map: snowy ? PT.snow(3) : PT.paving(5, [150, 150, 158]), rx: 60, roughness: 0.9 }), 300);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; this.mountain(Math.cos(a) * 140, Math.sin(a) * 140, 40, 40 + (i % 3) * 14, { snow: true }); }
  this.plane(3.6, 0.9, this.M({ map: PT.sign((info.city || "").toUpperCase(), "#10233d", "#ffd166", "900 56px sans-serif"), emissive: 0xffffff, emap: PT.sign((info.city || "").toUpperCase(), "#10233d", "#ffd166", "900 56px sans-serif"), ei: 0.6 }), 0, 2.4, -3.95);
  this.box(4, 3, 0.4, this.M({ color: 0x10233d }), 0, 1.5, -4.2, { collide: true });
  const ms = info.missions || [];
  ms.forEach((m, i) => { const a = -Math.PI / 2 + (i - (ms.length - 1) / 2) * 0.62; this.station(m.station, Math.cos(a) * 12, Math.sin(a) * 12 + 4, m.icon || "screen", 0x7fdcff, m.stationLabel); });
  if (info.contact) this.addPerson(info.contact, -4, 6, Math.PI * 0.8, { coat: 0x2a6ab0, hair: 0x2a1a10, skin: 0xe8c0a0 }, info.contact.charAt(0).toUpperCase() + info.contact.slice(1));
  this.bug(14, 0.09, 14); this.bug(-15, 0.09, 12); this.bug(16, 0.09, -12);
  return { x: 0, z: 10, yaw: 0, bounds: { x0: -24, x1: 24, z0: -18, z1: 20 } };
};
const SCENES = {};
export { SCENES, THREE };
