// The effects kit every Meltdown mini-game shares: animated themed backdrops,
// particles, rings, floating text, screen shake and flashes, glassy panels,
// bevelled tiles, vector icons and a 2D character painter, so twenty-four
// games made by different hands still look like one game.
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";

export const ease = {
  out: k => 1 - Math.pow(1 - k, 3),
  inOut: k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  back: k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  bounce: k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; },
};
// the Meltdown palette: ice, lava and the POLARIS navy
export const PAL = {
  ice: "#7fe3ff", iceDeep: "#2a9fd8", snow: "#f4fbff", navy: "#0b1a2e", navy2: "#132a46", steel: "#8ea4bc",
  lava: "#ff6a1a", ember: "#ffb347", danger: "#ff3b4a", ok: "#35e08a", gold: "#ffd166", ink: "#e8f2ff", dim: "rgba(232,242,255,.6)",
  pieces: ["#ff5a5f", "#3aa0ff", "#ffd23f", "#35e08a", "#b47cff", "#ff9f40", "#40e0d0", "#ff7eb6"],
};

export class FX {
  constructor() { this.parts = []; this.texts = []; this.rings = []; this.shakeT = 0; this.shakeA = 0; this.flashT = 0; this.flashD = 1; this.flashC = "#fff"; }
  update(dt) {
    for (const p of this.parts) { p.t += dt; p.vy += (p.g || 0) * dt; p.vx *= Math.pow(p.drag || 0.9, dt * 10); p.vy *= Math.pow(p.drag || 0.9, dt * 10); p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < r.life);
    for (const f of this.texts) f.t += dt; this.texts = this.texts.filter(f => f.t < f.life);
    this.shakeT = Math.max(0, this.shakeT - dt); this.flashT = Math.max(0, this.flashT - dt);
  }
  // confetti and sparks flying out from a point
  burst(x, y, color, n, speed, o) {
    o = o || {}; n = n || 24; speed = speed || 320;
    const cols = Array.isArray(color) ? color : [color || PAL.gold];
    for (let i = 0; i < n; i++) {
      const a = (o.angle !== undefined ? o.angle + (Math.random() - 0.5) * (o.spread || TAU) : Math.random() * TAU), v = speed * (0.35 + Math.random() * 0.65);
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), g: o.gravity === undefined ? 700 : o.gravity, drag: o.drag || 0.92, t: 0, life: (o.life || 0.9) * (0.6 + Math.random() * 0.6), size: (o.size || 7) * (0.5 + Math.random()), color: cols[i % cols.length], rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, shape: o.shape || (i % 3 === 0 ? "dot" : "chip") });
    }
  }
  sparkle(x, y, color, n) { this.burst(x, y, color || "#ffffff", n || 8, 160, { gravity: 0, life: 0.5, size: 4, shape: "star" }); }
  // puffs of steam, smoke or snow drifting up
  puff(x, y, color, n, o) { o = o || {}; for (let i = 0; i < (n || 6); i++) this.parts.push({ x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 40, vy: -(o.rise || 60) - Math.random() * 40, g: 0, drag: 0.98, t: 0, life: o.life || 1.2, size: (o.size || 18) * (0.6 + Math.random() * 0.8), color: color || "rgba(255,255,255,.5)", rot: 0, vr: 0, shape: "puff" }); }
  ring(x, y, color, r, life) { this.rings.push({ x, y, color: color || PAL.ice, r: r || 60, t: 0, life: life || 0.6 }); }
  float(x, y, str, color, size, life) { this.texts.push({ x, y, str, color: color || PAL.gold, size: size || 26, t: 0, life: life || 1.1 }); }
  shake(a, d) { this.shakeA = Math.max(this.shakeA * (this.shakeT > 0 ? 1 : 0), a || 8); this.shakeT = Math.max(this.shakeT, d || 0.3); }
  flash(color, d) { this.flashC = color || "#fff"; this.flashT = this.flashD = d || 0.25; }
  // where the screen should be drawn this frame while it shakes
  offset() { if (this.shakeT <= 0) return { x: 0, y: 0 }; const k = this.shakeA * (this.shakeT / 0.3); return { x: (Math.random() - 0.5) * 2 * k, y: (Math.random() - 0.5) * 2 * k }; }
  draw(g, s, W, H) {
    s = s || 1;
    for (const r of this.rings) { const k = r.t / r.life; g.strokeStyle = r.color; g.globalAlpha = 1 - k; g.lineWidth = (1 - k) * 6 * s + 1; g.beginPath(); g.arc(r.x, r.y, r.r * ease.out(k) * s, 0, TAU); g.stroke(); }
    for (const p of this.parts) {
      const k = p.t / p.life; g.globalAlpha = p.shape === "puff" ? (1 - k) * 0.8 : Math.min(1, (1 - k) * 2);
      g.fillStyle = p.color; g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      const z = p.size * s * (p.shape === "puff" ? (0.6 + k) : 1);
      if (p.shape === "chip") g.fillRect(-z / 2, -z / 4, z, z / 2);
      else if (p.shape === "star") { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? z * 0.35 : z; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }
      else { g.beginPath(); g.arc(0, 0, z / 2, 0, TAU); g.fill(); }
      g.restore();
    }
    for (const f of this.texts) { const k = f.t / f.life; g.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3; const y = f.y - ease.out(Math.min(1, k * 1.4)) * 60 * s, sz = f.size * s * (k < 0.12 ? ease.back(k / 0.12) : 1); g.font = `900 ${sz}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = sz * 0.16; g.strokeStyle = "rgba(0,0,0,.55)"; g.strokeText(f.str, f.x, y); g.fillStyle = f.color; g.fillText(f.str, f.x, y); }
    g.globalAlpha = 1;
    if (this.flashT > 0 && W) { g.globalAlpha = (this.flashT / this.flashD) * 0.55; g.fillStyle = this.flashC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  }
}

// ------------------------------------------------------------- backdrops
// An animated full-screen background for a mini-game. Themes: ice, snow, sea,
// night_city, neon, desert, volcano, lab, vault, jungle, sky, cave, casino.
const BD = {
  ice:        ["#0d3a5c", "#06182a", "#7fe3ff"],
  snow:       ["#2c5a88", "#10243e", "#ffffff"],
  sea:        ["#0a4a78", "#04162a", "#5ad0ff"],
  night_city: ["#1a1840", "#070812", "#ffb347"],
  neon:       ["#2a0a4a", "#08041a", "#ff4ad8"],
  desert:     ["#a8602a", "#2a1408", "#ffd166"],
  volcano:    ["#4a0e06", "#120302", "#ff6a1a"],
  lab:        ["#12304a", "#060e18", "#40e0d0"],
  vault:      ["#2a2418", "#0a0806", "#ffd166"],
  jungle:     ["#1a4a2a", "#06140a", "#7bed9f"],
  sky:        ["#3a86d0", "#123a6a", "#ffffff"],
  cave:       ["#06344a", "#020c14", "#7fe3ff"],
  casino:     ["#3a0a1a", "#0e0206", "#ffd166"],
};
export function backdrop(g, W, H, s, t, theme) {
  const c = BD[theme] || BD.lab;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const acc = c[2];
  g.save();
  switch (theme) {
    case "ice": case "snow": case "cave": {
      // slow crystals of light drifting, and a faint hex pattern like frost
      g.strokeStyle = acc; g.globalAlpha = 0.06; g.lineWidth = 1;
      const hx = 46 * s; for (let y = 0; y < H + hx; y += hx * 0.86) for (let x = (Math.floor(y / (hx * 0.86)) % 2) * hx / 2; x < W + hx; x += hx) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; g.lineTo(x + Math.cos(a) * hx * 0.5, y + Math.sin(a) * hx * 0.5); } g.closePath(); g.stroke(); }
      g.globalAlpha = 1;
      for (let i = 0; i < 40; i++) { const x = ((i * 97.3 + t * (8 + i % 5) * s) % (W + 40)) - 20, y = ((i * 57.1 + t * (18 + (i % 7) * 4) * s) % (H + 40)) - 20, r = (1 + (i % 3)) * s; g.fillStyle = `rgba(255,255,255,${0.15 + (i % 4) * 0.08})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
      break; }
    case "sea": {
      for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(90,208,255,${0.05 + k * 0.015})`; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 12 * s) g.lineTo(x, H * (0.55 + k * 0.1) + Math.sin(x / (80 * s) + t * (0.8 + k * 0.2) + k) * 10 * s); g.lineTo(W, H); g.closePath(); g.fill(); }
      break; }
    case "night_city": case "neon": case "casino": {
      // a skyline with lit windows, and a glow along the horizon
      const hz = H * 0.72; const hg = g.createLinearGradient(0, hz - 120 * s, 0, hz); hg.addColorStop(0, "rgba(0,0,0,0)"); hg.addColorStop(1, acc + "30"); g.fillStyle = hg; g.fillRect(0, hz - 120 * s, W, 120 * s);
      let x = 0, i = 0; while (x < W) { const w = (40 + (i * 37) % 60) * s, h = (60 + (i * 53) % 160) * s; g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(x, hz - h, w - 4 * s, h + H); for (let yy = hz - h + 8 * s; yy < hz - 6 * s; yy += 12 * s) for (let xx = x + 5 * s; xx < x + w - 10 * s; xx += 10 * s) if (((xx * 7 + yy * 13 + i) | 0) % 5 < 2) { g.fillStyle = theme === "neon" ? (i % 2 ? "rgba(255,74,216,.5)" : "rgba(64,224,255,.5)") : "rgba(255,200,120,.45)"; g.fillRect(xx, yy, 4 * s, 5 * s); } x += w; i++; }
      break; }
    case "desert": {
      g.fillStyle = "rgba(255,210,120,.12)"; g.beginPath(); g.arc(W * 0.8, H * 0.28, 70 * s, 0, TAU); g.fill();
      for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(40,20,8,${0.18 + k * 0.1})`; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 16 * s) g.lineTo(x, H * (0.62 + k * 0.1) + Math.sin(x / (160 * s) + k * 2) * 24 * s); g.lineTo(W, H); g.closePath(); g.fill(); }
      break; }
    case "volcano": {
      for (let i = 0; i < 30; i++) { const x = (i * 71.3) % W, y = H - ((t * (30 + (i % 5) * 12) * s + i * 53) % (H + 40)); g.fillStyle = `rgba(255,${120 + (i % 4) * 30},40,${0.35 + (i % 3) * 0.15})`; g.beginPath(); g.arc(x + Math.sin(t + i) * 10 * s, y, (1.5 + i % 3) * s, 0, TAU); g.fill(); }
      const lg = g.createLinearGradient(0, H * 0.8, 0, H); lg.addColorStop(0, "rgba(255,90,20,0)"); lg.addColorStop(1, "rgba(255,90,20,.35)"); g.fillStyle = lg; g.fillRect(0, H * 0.8, W, H * 0.2);
      break; }
    case "jungle": {
      for (let i = 0; i < 16; i++) { const x = (i * 83) % W, y = H * 0.1 + (i * 47) % (H * 0.3); g.fillStyle = "rgba(20,60,30,.35)"; g.beginPath(); g.ellipse(x, y, 90 * s, 30 * s, Math.sin(i) * 0.6, 0, TAU); g.fill(); }
      break; }
    case "sky": {
      for (let i = 0; i < 8; i++) { const x = ((i * 190 - t * (12 + i * 3) * s) % (W + 300)) + 150, y = H * (0.15 + (i % 4) * 0.18); g.fillStyle = "rgba(255,255,255,.18)"; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(W - x + k * 40 * s, y + (k % 2) * 8 * s, 60 * s, 18 * s, 0, 0, TAU); g.fill(); } }
      break; }
    default: {
      // lab and vault: a technical grid with a slow scan line
      g.strokeStyle = acc; g.globalAlpha = 0.06; g.lineWidth = 1;
      for (let x = 0; x < W; x += 36 * s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y < H; y += 36 * s) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.globalAlpha = 0.08; g.fillStyle = acc; g.fillRect(0, (t * 60 * s) % H, W, 2 * s); g.globalAlpha = 1;
    }
  }
  // vignette, so the eye goes to the middle
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.45)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.restore();
}

// ------------------------------------------------------------- panels and tiles
// a glassy rounded panel with a soft sheen along the top
export function card(g, x, y, w, h, s, o) {
  o = o || {}; const r = (o.r === undefined ? 14 : o.r) * s;
  g.save();
  g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 18 * s; g.shadowOffsetY = 6 * s;
  g.fillStyle = o.bg || "rgba(11,26,46,.82)"; rrect(g, x, y, w, h, r); g.fill();
  g.shadowColor = "transparent";
  const sh = g.createLinearGradient(0, y, 0, y + h * 0.5); sh.addColorStop(0, "rgba(255,255,255,.10)"); sh.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = sh; rrect(g, x, y, w, h * 0.5, r); g.fill();
  g.strokeStyle = o.border || "rgba(127,227,255,.35)"; g.lineWidth = (o.lw || 1.5) * s; rrect(g, x + 0.5, y + 0.5, w - 1, h - 1, r); g.stroke();
  if (o.title) text(g, o.title, x + w / 2, y + 22 * s, 13 * s, o.titleColor || PAL.ice, "center", 900, MONO);
  g.restore();
}
// a chunky bevelled tile: the building block of most puzzle boards
export function tile(g, x, y, w, h, s, o) {
  o = o || {}; const r = (o.r === undefined ? 8 : o.r) * s, col = o.color || "#2a4a6e", d = o.pressed ? 1 * s : 4 * s;
  g.save();
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = 18 * s; }
  g.fillStyle = shade(col, -0.35); rrect(g, x, y + d, w, h - d, r); g.fill();
  g.shadowColor = "transparent";
  const gr = g.createLinearGradient(0, y, 0, y + h - d); gr.addColorStop(0, shade(col, 0.22)); gr.addColorStop(1, col); g.fillStyle = gr; rrect(g, x, o.pressed ? y + d : y, w, h - d, r); g.fill();
  g.fillStyle = "rgba(255,255,255,.14)"; rrect(g, x + 3 * s, (o.pressed ? y + d : y) + 3 * s, w - 6 * s, (h - d) * 0.35, r * 0.7); g.fill();
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = 2 * s; rrect(g, x + 1, (o.pressed ? y + d : y) + 1, w - 2, h - d - 2, r); g.stroke(); }
  g.restore();
}
// lighten (+) or darken (-) a #rrggbb colour
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  if (k >= 0) { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; } else { r *= 1 + k; gg *= 1 + k; b *= 1 + k; }
  return `rgb(${r | 0},${gg | 0},${b | 0})`;
}
export function glow(g, x, y, r, color, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, color); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = a === undefined ? 1 : a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = 1; }
export function bar(g, x, y, w, h, s, k, color, label) {
  g.fillStyle = "rgba(255,255,255,.12)"; rrect(g, x, y, w, h, h / 2); g.fill();
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, shade(color || PAL.ok, -0.2)); gr.addColorStop(1, color || PAL.ok);
  g.fillStyle = gr; rrect(g, x, y, Math.max(h, w * clamp(k, 0, 1)), h, h / 2); g.fill();
  if (label) text(g, label, x + w / 2, y + h / 2 + 1, h * 0.62, "#fff", "center", 900, MONO);
}

// ------------------------------------------------------------- icons
// simple vector icons, drawn centred in a box of the given size
export function icon(g, name, x, y, z, color) {
  g.save(); g.translate(x, y); g.fillStyle = color || "#fff"; g.strokeStyle = color || "#fff"; g.lineWidth = z * 0.1; g.lineCap = "round"; g.lineJoin = "round";
  const r = z / 2;
  switch (name) {
    case "key": g.beginPath(); g.arc(-r * 0.45, 0, r * 0.38, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(-r * 0.07, 0); g.lineTo(r * 0.9, 0); g.moveTo(r * 0.55, 0); g.lineTo(r * 0.55, r * 0.35); g.moveTo(r * 0.8, 0); g.lineTo(r * 0.8, r * 0.28); g.stroke(); break;
    case "lock": g.beginPath(); g.arc(0, -r * 0.2, r * 0.42, Math.PI, 0); g.stroke(); rrect(g, -r * 0.6, -r * 0.2, r * 1.2, r * 0.95, r * 0.15); g.fill(); break;
    case "bolt": g.beginPath(); g.moveTo(r * 0.2, -r); g.lineTo(-r * 0.5, r * 0.1); g.lineTo(-r * 0.02, r * 0.1); g.lineTo(-r * 0.2, r); g.lineTo(r * 0.5, -r * 0.12); g.lineTo(r * 0.02, -r * 0.12); g.closePath(); g.fill(); break;
    case "star": g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); break;
    case "snowflake": for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r); g.moveTo(0, -r * 0.55); g.lineTo(-r * 0.25, -r * 0.8); g.moveTo(0, -r * 0.55); g.lineTo(r * 0.25, -r * 0.8); g.stroke(); g.restore(); } break;
    case "flame": g.beginPath(); g.moveTo(0, -r); g.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.7, r, 0, r); g.bezierCurveTo(-r * 0.7, r, -r * 0.9, -r * 0.2, 0, -r); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.ellipse(0, r * 0.35, r * 0.3, r * 0.45, 0, 0, TAU); g.fill(); break;
    case "gear": g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * TAU / 16, rr = i % 2 ? r * 0.72 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(0, 0, r * 0.3, 0, TAU); g.fill(); g.globalCompositeOperation = "source-over"; break;
    case "camera": rrect(g, -r * 0.8, -r * 0.45, r * 1.6, r, r * 0.15); g.fill(); g.fillStyle = "rgba(0,0,0,.6)"; g.beginPath(); g.arc(0, r * 0.05, r * 0.32, 0, TAU); g.fill(); break;
    case "drone": g.fillRect(-r * 0.3, -r * 0.15, r * 0.6, r * 0.3); for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(dx * r * 0.7, dy * r * 0.55); g.stroke(); g.beginPath(); g.ellipse(dx * r * 0.7, dy * r * 0.55, r * 0.3, r * 0.08, 0, 0, TAU); g.fill(); } break;
    case "penguin": g.fillStyle = "#15161c"; g.beginPath(); g.ellipse(0, r * 0.1, r * 0.55, r * 0.85, 0, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.ellipse(0, r * 0.2, r * 0.36, r * 0.62, 0, 0, TAU); g.fill(); g.fillStyle = "#ffa000"; g.beginPath(); g.moveTo(-r * 0.12, -r * 0.35); g.lineTo(r * 0.12, -r * 0.35); g.lineTo(0, -r * 0.18); g.fill(); g.fillStyle = "#15161c"; g.beginPath(); g.arc(-r * 0.14, -r * 0.5, r * 0.06, 0, TAU); g.arc(r * 0.14, -r * 0.5, r * 0.06, 0, TAU); g.fill(); break;
    case "check": g.lineWidth = z * 0.16; g.beginPath(); g.moveTo(-r * 0.6, 0); g.lineTo(-r * 0.15, r * 0.45); g.lineTo(r * 0.65, -r * 0.45); g.stroke(); break;
    case "cross": g.lineWidth = z * 0.16; g.beginPath(); g.moveTo(-r * 0.5, -r * 0.5); g.lineTo(r * 0.5, r * 0.5); g.moveTo(r * 0.5, -r * 0.5); g.lineTo(-r * 0.5, r * 0.5); g.stroke(); break;
    case "eye": g.beginPath(); g.ellipse(0, 0, r, r * 0.55, 0, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.3, 0, TAU); g.fill(); break;
    default: g.beginPath(); g.arc(0, 0, r * 0.6, 0, TAU); g.fill();
  }
  g.restore();
}

// ------------------------------------------------------------- people in 2D
// A friendly cartoon person for the games that need a crowd, a guard, a
// dancer or a suspect. `h` is the full height in pixels, (x, y) the feet.
// look: { skin, hair, hairStyle: short|long|bun|curly|bald|spiky, coat, trousers,
//   shoes, hat: cap|beanie|top|helmet|captain|beret|cowboy|hood, hatColor,
//   glasses, sunglasses, beard, moustache, tie, scarf, bag, mask }
// pose: { walk (a phase, animates the legs), arms: "down"|"up"|"wave"|"point",
//   face: "smile"|"shock"|"frown"|"sly", facing: 1|-1, lean }
export function person2D(g, x, y, h, look, pose) {
  look = look || {}; pose = pose || {};
  const u = h / 100, skin = look.skin || "#f1c9a5", coat = look.coat || "#3a5a8a", trous = look.trousers || "#2a2a36", shoes = look.shoes || "#161618";
  g.save(); g.translate(x, y); if (pose.facing === -1) g.scale(-1, 1); if (pose.lean) g.rotate(pose.lean);
  const w = pose.walk === undefined ? 0 : Math.sin(pose.walk) * 0.5;
  const out = (c) => { g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 1.6 * u; g.stroke(); };
  // legs
  for (const [sx, a] of [[-1, w], [1, -w]]) { g.save(); g.translate(sx * 7 * u, -46 * u); g.rotate(a); g.fillStyle = trous; rrect(g, -5 * u, 0, 10 * u, 40 * u, 4 * u); g.fill(); out(); g.fillStyle = shoes; rrect(g, -6 * u, 38 * u, 15 * u, 7 * u, 3 * u); g.fill(); g.restore(); }
  // arms behind the body when down
  const armAng = pose.arms === "up" ? [-2.6, 2.6] : pose.arms === "wave" ? [0.15, 2.5 + Math.sin(Date.now() / 120) * 0.3] : pose.arms === "point" ? [0.2, 1.5] : [0.15 - w * 0.6, -0.15 + w * 0.6];
  const arm = (sx, a) => { g.save(); g.translate(sx * 15 * u, -76 * u); g.rotate(-sx * a); g.fillStyle = coat; rrect(g, -4.5 * u, 0, 9 * u, 30 * u, 4 * u); g.fill(); out(); g.fillStyle = skin; g.beginPath(); g.arc(0, 31 * u, 4.5 * u, 0, TAU); g.fill(); g.restore(); };
  arm(-1, armAng[0]); arm(1, armAng[1]);
  // body
  g.fillStyle = coat; rrect(g, -15 * u, -82 * u, 30 * u, 40 * u, 9 * u); g.fill(); out();
  if (look.tie) { g.fillStyle = look.tie; g.beginPath(); g.moveTo(-2.5 * u, -80 * u); g.lineTo(2.5 * u, -80 * u); g.lineTo(3.5 * u, -60 * u); g.lineTo(0, -56 * u); g.lineTo(-3.5 * u, -60 * u); g.closePath(); g.fill(); }
  if (look.scarf) { g.fillStyle = look.scarf; rrect(g, -12 * u, -84 * u, 24 * u, 7 * u, 3 * u); g.fill(); g.fillRect(5 * u, -80 * u, 6 * u, 16 * u); }
  if (look.bag) { g.fillStyle = look.bag; rrect(g, 10 * u, -60 * u, 12 * u, 14 * u, 3 * u); g.fill(); out(); }
  // head
  const hy = -95 * u, hr = 13 * u;
  g.fillStyle = skin; g.beginPath(); g.arc(0, hy, hr, 0, TAU); g.fill(); out();
  // hair
  const hair = look.hair || "#3a2414";
  g.fillStyle = hair;
  const hs = look.hat && look.hat !== "beret" && look.hat !== "cap" ? "none" : (look.hairStyle || "short");
  if (hs === "short" || hs === "long" || hs === "bun" || hs === "spiky") { g.beginPath(); g.arc(0, hy - 2 * u, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(hr, hy - 1 * u); g.quadraticCurveTo(0, hy - 9 * u, -hr, hy - 1 * u); g.fill(); }
  if (hs === "none" && look.hat) { rrect(g, -hr * 1.02, hy - 5 * u, hr * 0.42, 12 * u, 4 * u); g.fill(); rrect(g, hr * 0.6, hy - 5 * u, hr * 0.42, 12 * u, 4 * u); g.fill(); }
  if (hs === "long") { rrect(g, -hr * 1.05, hy - 4 * u, hr * 0.5, 22 * u, 5 * u); g.fill(); rrect(g, hr * 0.55, hy - 4 * u, hr * 0.5, 22 * u, 5 * u); g.fill(); }
  if (hs === "bun") { g.beginPath(); g.arc(0, hy - hr * 1.15, 6 * u, 0, TAU); g.fill(); }
  if (hs === "spiky") for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5 * u - 3 * u, hy - hr * 0.8); g.lineTo(i * 5 * u, hy - hr * 1.45); g.lineTo(i * 5 * u + 3 * u, hy - hr * 0.8); g.fill(); }
  if (hs === "curly") for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; g.beginPath(); g.arc(Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.9, 5 * u, 0, TAU); g.fill(); }
  // face
  const face = pose.face || "smile";
  g.fillStyle = "#1a1418";
  if (look.sunglasses) { g.fillStyle = "#101014"; rrect(g, -10 * u, hy - 3 * u, 9 * u, 5 * u, 2 * u); g.fill(); rrect(g, 1 * u, hy - 3 * u, 9 * u, 5 * u, 2 * u); g.fill(); g.fillRect(-2 * u, hy - 2 * u, 4 * u, 1.5 * u); }
  else if (face === "shock") { g.beginPath(); g.arc(-4.5 * u, hy - 1 * u, 2.4 * u, 0, TAU); g.arc(4.5 * u, hy - 1 * u, 2.4 * u, 0, TAU); g.fill(); }
  else { g.beginPath(); g.ellipse(-4.5 * u, hy - 1 * u, 1.7 * u, 2.2 * u, 0, 0, TAU); g.ellipse(4.5 * u, hy - 1 * u, 1.7 * u, 2.2 * u, 0, 0, TAU); g.fill(); }
  if (look.glasses && !look.sunglasses) { g.strokeStyle = "#1a1418"; g.lineWidth = 1.4 * u; g.beginPath(); g.arc(-4.5 * u, hy - 1 * u, 4 * u, 0, TAU); g.moveTo(8.5 * u, hy - 1 * u); g.arc(4.5 * u, hy - 1 * u, 4 * u, 0, TAU); g.stroke(); }
  g.strokeStyle = "#7a2a2a"; g.lineWidth = 1.6 * u; g.beginPath();
  if (face === "shock") { g.fillStyle = "#5a1a1a"; g.ellipse(0, hy + 6 * u, 2.6 * u, 3.2 * u, 0, 0, TAU); g.fill(); }
  else if (face === "frown") g.arc(0, hy + 9 * u, 4 * u, Math.PI * 1.2, Math.PI * 1.8);
  else if (face === "sly") { g.moveTo(-3 * u, hy + 5 * u); g.quadraticCurveTo(1 * u, hy + 7 * u, 5 * u, hy + 3 * u); }
  else g.arc(0, hy + 3 * u, 4.5 * u, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  if (look.beard) { g.fillStyle = look.beard; g.beginPath(); g.arc(0, hy + 3 * u, hr * 0.95, Math.PI * 0.05, Math.PI * 0.95); g.quadraticCurveTo(0, hy + hr * 1.4, hr * 0.95, hy + 4 * u); g.fill(); }
  if (look.moustache) { g.fillStyle = look.moustache; rrect(g, -6 * u, hy + 2.5 * u, 12 * u, 3 * u, 1.5 * u); g.fill(); }
  if (look.mask) { g.fillStyle = look.mask; rrect(g, -hr, hy - 5 * u, hr * 2, 8 * u, 3 * u); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(-4.5 * u, hy - 1 * u, 1.6 * u, 0, TAU); g.arc(4.5 * u, hy - 1 * u, 1.6 * u, 0, TAU); g.fill(); }
  // hats
  const hc = look.hatColor || "#2a2a30"; g.fillStyle = hc;
  switch (look.hat) {
    case "cap": g.beginPath(); g.arc(0, hy - 3 * u, hr * 1.02, Math.PI, 0); g.fill(); rrect(g, 0, hy - 5 * u, hr * 1.6, 3.5 * u, 1.5 * u); g.fill(); break;
    case "beanie": g.beginPath(); g.arc(0, hy - 2 * u, hr * 1.06, Math.PI, 0); g.fill(); g.fillStyle = "#f4f4f4"; rrect(g, -hr * 1.08, hy - 4 * u, hr * 2.16, 4.5 * u, 2 * u); g.fill(); g.beginPath(); g.arc(0, hy - hr * 1.2, 4 * u, 0, TAU); g.fill(); break;
    case "top": rrect(g, -hr * 1.4, hy - hr * 0.95, hr * 2.8, 3 * u, 1.5 * u); g.fill(); rrect(g, -hr * 0.85, hy - hr * 2.3, hr * 1.7, hr * 1.4, 2 * u); g.fill(); break;
    case "helmet": g.beginPath(); g.arc(0, hy, hr * 1.2, 0, TAU); g.fill(); g.fillStyle = "rgba(20,20,30,.9)"; rrect(g, -hr * 0.9, hy - 5 * u, hr * 1.8, 9 * u, 4 * u); g.fill(); g.fillStyle = "rgba(255,255,255,.35)"; rrect(g, -hr * 0.6, hy - 4 * u, hr * 0.8, 2 * u, 1 * u); g.fill(); break;
    case "captain": rrect(g, -hr * 1.1, hy - hr * 1.35, hr * 2.2, hr * 0.7, 3 * u); g.fillStyle = "#f4f4f4"; g.fill(); g.fillStyle = "#10182a"; rrect(g, -hr * 1.05, hy - hr * 0.72, hr * 2.1, 4 * u, 1.5 * u); g.fill(); g.fillStyle = "#ffd166"; g.beginPath(); g.arc(0, hy - hr, 2.4 * u, 0, TAU); g.fill(); break;
    case "beret": g.beginPath(); g.ellipse(2 * u, hy - hr * 0.8, hr * 1.1, hr * 0.45, -0.15, 0, TAU); g.fill(); break;
    case "cowboy": g.beginPath(); g.ellipse(0, hy - hr * 0.75, hr * 1.8, 3.5 * u, 0, 0, TAU); g.fill(); rrect(g, -hr * 0.75, hy - hr * 1.6, hr * 1.5, hr * 0.95, 4 * u); g.fill(); break;
    case "hood": g.fillStyle = hc; g.beginPath(); g.arc(0, hy, hr * 1.3, Math.PI * 0.75, Math.PI * 2.25); g.lineTo(hr * 0.8, hy + hr * 0.5); g.arc(0, hy, hr * 0.95, Math.PI * 0.2, Math.PI * 0.8, true); g.fill(); g.strokeStyle = "#f0ece0"; g.lineWidth = 3 * u; g.beginPath(); g.arc(0, hy, hr * 1.02, Math.PI * 0.8, Math.PI * 2.2); g.stroke(); break;
  }
  g.restore();
}
