// 2D user interface on the overlay canvas: drawing helpers, immediate-mode
// buttons, procedural portraits and flags, the dialogue box, the HUD, the
// world map, the dossier, the title, the briefing and the intel stamp.
import { CHARS, COUNTRIES, ACTS, SYMBOLS } from "./story.js";
import { SFX } from "./audio.js";
import { Speech } from "./speech.js";

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
export const MONO = 'ui-monospace, Menlo, Consolas, monospace';

export function rrect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function text(g, s, x, y, size, color, align, weight, font) {
  g.font = `${weight || 600} ${size}px ${font || FONT}`;
  g.textAlign = align || "left"; g.textBaseline = "middle";
  g.fillStyle = color || "#fff"; g.fillText(s, x, y);
}
export function textShadow(g, s, x, y, size, color, align, weight, font) {
  g.font = `${weight || 700} ${size}px ${font || FONT}`;
  g.textAlign = align || "left"; g.textBaseline = "middle";
  g.fillStyle = "rgba(0,0,0,.55)"; g.fillText(s, x + size * 0.06, y + size * 0.08);
  g.fillStyle = color || "#fff"; g.fillText(s, x, y);
}
export function wrap(g, s, maxW, size, weight, font) {
  g.font = `${weight || 500} ${size}px ${font || FONT}`;
  const words = s.split(" "), lines = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
export function paragraph(g, s, x, y, maxW, size, color, lineH, align, weight, font) {
  const lines = wrap(g, s, maxW, size, weight, font);
  lines.forEach((l, i) => text(g, l, x, y + i * (lineH || size * 1.3), size, color, align, weight, font));
  return lines.length;
}

// ------------------------------------------------------------- buttons
// Immediate mode: screens draw buttons every frame; the input layer asks
// which button (from the last frame) is under a finger.
export class Buttons {
  constructor() { this.list = []; this.pressed = null; this.hover = null; }
  begin() { this.list.length = 0; }
  add(id, x, y, w, h, opts) { this.list.push({ id, x, y, w, h, opts: opts || {} }); }
  at(px, py) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if (b.opts.disabled) continue;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
    }
    return null;
  }
}
export function drawButton(g, b, pressed, s) {
  const o = b.opts, style = o.style || "primary";
  const col = { primary: ["#2ecc71", "#1e8f4e", "#0b3d22"], blue: ["#3b82f6", "#1d4ed8", "#0b1f4d"], red: ["#ef4444", "#b91c1c", "#4a0a0a"],
    gold: ["#ffd166", "#d4a017", "#4d3800"], dark: ["#2b3342", "#1a2030", "#0a0d14"], ghost: ["rgba(255,255,255,.12)", "rgba(255,255,255,.06)", "rgba(0,0,0,.4)"],
    purple: ["#a855f7", "#7e22ce", "#2e0a4a"], grey: ["#94a3b8", "#64748b", "#1e293b"] }[style];
  const r = o.round !== undefined ? o.round : 16 * s;
  g.save();
  if (o.disabled) g.globalAlpha = 0.45;
  const dy = pressed ? 3 * s : 0;
  g.fillStyle = col[2]; rrect(g, b.x, b.y + 5 * s, b.w, b.h, r); g.fill();
  const grad = g.createLinearGradient(0, b.y, 0, b.y + b.h);
  grad.addColorStop(0, col[0]); grad.addColorStop(1, col[1]);
  g.fillStyle = grad; rrect(g, b.x, b.y + dy, b.w, b.h, r); g.fill();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5; g.stroke();
  if (o.label) {
    const fs = o.size || Math.min(b.h * 0.42, 30 * s);
    textShadow(g, o.label, b.x + b.w / 2 + (o.icon ? 10 * s : 0), b.y + dy + b.h / 2 + 1, fs, o.color || "#fff", "center", 800);
  }
  if (o.draw) o.draw(g, b, dy);
  g.restore();
}
export function chip(g, x, y, w, h, label, s, bg, fg) {
  g.fillStyle = bg || "rgba(8,12,20,.72)"; rrect(g, x, y, w, h, h / 2); g.fill();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.stroke();
  text(g, label, x + w / 2, y + h / 2 + 1, h * 0.42, fg || "#e8ecf4", "center", 700);
}
export function panel(g, x, y, w, h, s, opts) {
  opts = opts || {};
  g.save();
  g.fillStyle = opts.bg || "rgba(10,14,22,.88)"; rrect(g, x, y, w, h, opts.r || 18 * s); g.fill();
  g.strokeStyle = opts.border || "rgba(255,255,255,.18)"; g.lineWidth = 2; g.stroke();
  g.restore();
}

// ------------------------------------------------------------- flags and symbols
export function drawFlag(g, id, x, y, w, h) {
  g.save(); g.beginPath(); rrect(g, x, y, w, h, Math.min(w, h) * 0.08); g.clip();
  const band = (cols, vertical) => { const n = cols.length; cols.forEach((c, i) => { g.fillStyle = c; if (vertical) g.fillRect(x + w * i / n, y, w / n + 1, h); else g.fillRect(x, y + h * i / n, w, h / n + 1); }); };
  switch (id) {
    case "uk": {
      g.fillStyle = "#012169"; g.fillRect(x, y, w, h);
      g.strokeStyle = "#fff"; g.lineWidth = h * 0.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke();
      g.strokeStyle = "#C8102E"; g.lineWidth = h * 0.07; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke();
      g.strokeStyle = "#fff"; g.lineWidth = h * 0.33; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
      g.strokeStyle = "#C8102E"; g.lineWidth = h * 0.2; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
      break; }
    case "it": band(["#009246", "#fff", "#CE2B37"], true); break;
    case "eg": band(["#CE1126", "#fff", "#000"]); g.fillStyle = "#C09300"; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.11, 0, TAU); g.fill(); break;
    case "jp": g.fillStyle = "#fff"; g.fillRect(x, y, w, h); g.fillStyle = "#BC002D"; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.3, 0, TAU); g.fill(); break;
    case "us": {
      for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#fff" : "#B22234"; g.fillRect(x, y + h * i / 13, w, h / 13 + 1); }
      g.fillStyle = "#3C3B6E"; g.fillRect(x, y, w * 0.4, h * 7 / 13);
      g.fillStyle = "#fff"; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { g.beginPath(); g.arc(x + w * 0.05 + c * w * 0.075, y + h * 0.07 + r * h * 0.12, h * 0.025, 0, TAU); g.fill(); }
      break; }
    case "br": {
      g.fillStyle = "#009C3B"; g.fillRect(x, y, w, h);
      g.fillStyle = "#FFDF00"; g.beginPath(); g.moveTo(x + w * 0.5, y + h * 0.1); g.lineTo(x + w * 0.9, y + h * 0.5); g.lineTo(x + w * 0.5, y + h * 0.9); g.lineTo(x + w * 0.1, y + h * 0.5); g.closePath(); g.fill();
      g.fillStyle = "#002776"; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.22, 0, TAU); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = h * 0.03; g.beginPath(); g.arc(x + w / 2, y + h * 0.62, h * 0.25, -2.4, -0.7); g.stroke();
      break; }
    case "ru": band(["#fff", "#0039A6", "#D52B1E"]); break;
    case "fr": band(["#0055A4", "#fff", "#EF4135"], true); break;
    case "ke": band(["#000", "#BB0000", "#006600"]); g.fillStyle = "#fff"; g.fillRect(x, y + h * 0.3, w, h * 0.04); g.fillRect(x, y + h * 0.66, w, h * 0.04); g.fillStyle = "#BB0000"; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w * 0.1, h * 0.36, 0, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = h * 0.05; g.stroke(); break;
    case "in": band(["#FF9933", "#fff", "#138808"]); g.strokeStyle = "#000080"; g.lineWidth = h * 0.04; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.14, 0, TAU); g.stroke(); break;
    case "cn": g.fillStyle = "#DE2910"; g.fillRect(x, y, w, h); g.fillStyle = "#FFDE00"; { const st = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }; st(x + w * 0.17, y + h * 0.28, h * 0.16); st(x + w * 0.33, y + h * 0.1, h * 0.05); st(x + w * 0.39, y + h * 0.22, h * 0.05); st(x + w * 0.39, y + h * 0.38, h * 0.05); st(x + w * 0.33, y + h * 0.5, h * 0.05); } break;
    case "au": g.fillStyle = "#00008B"; g.fillRect(x, y, w, h); g.save(); g.beginPath(); g.rect(x, y, w / 2, h / 2); g.clip(); drawFlag(g, "uk", x, y, w / 2, h / 2); g.restore(); g.fillStyle = "#fff"; for (const [sx, sy, r] of [[0.25, 0.75, 0.09], [0.75, 0.2, 0.05], [0.65, 0.5, 0.05], [0.85, 0.42, 0.05], [0.75, 0.8, 0.05]]) { g.beginPath(); for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + i * Math.PI / 7, rr = i % 2 ? r * h * 0.45 : r * h; g.lineTo(x + w * sx + Math.cos(a) * rr, y + h * sy + Math.sin(a) * rr); } g.closePath(); g.fill(); } break;
    case "mx": band(["#006847", "#fff", "#CE1126"], true); g.fillStyle = "#8a6a2a"; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.12, 0, TAU); g.fill(); g.fillStyle = "#2a6a2a"; g.beginPath(); g.arc(x + w / 2, y + h * 0.62, h * 0.06, 0, TAU); g.fill(); break;
    case "ch": g.fillStyle = "#D52B1E"; g.fillRect(x, y, w, h); g.fillStyle = "#fff"; g.fillRect(x + w / 2 - h * 0.1, y + h * 0.2, h * 0.2, h * 0.6); g.fillRect(x + w / 2 - h * 0.3, y + h * 0.4, h * 0.6, h * 0.2); break;
    default: g.fillStyle = "#888"; g.fillRect(x, y, w, h);
  }
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; rrect(g, x, y, w, h, Math.min(w, h) * 0.08); g.stroke();
}
export function drawSymbol(g, name, x, y, r, color) {
  g.save(); g.translate(x, y); g.fillStyle = color || "#ffd166"; g.strokeStyle = color || "#ffd166"; g.lineWidth = r * 0.18; g.lineCap = "round"; g.lineJoin = "round";
  switch (name) {
    case "sun": g.beginPath(); g.arc(0, 0, r * 0.45, 0, TAU); g.fill(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); } break;
    case "moon": g.beginPath(); g.arc(0, 0, r * 0.85, 0, TAU); g.fill(); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(r * 0.4, -r * 0.2, r * 0.7, 0, TAU); g.fill(); break;
    case "star": g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); break;
    case "bolt": g.beginPath(); g.moveTo(r * 0.2, -r); g.lineTo(-r * 0.5, r * 0.1); g.lineTo(r * 0.05, r * 0.1); g.lineTo(-r * 0.2, r); g.lineTo(r * 0.55, -r * 0.15); g.lineTo(0, -r * 0.15); g.closePath(); g.fill(); break;
    case "eye": g.beginPath(); g.moveTo(-r, 0); g.quadraticCurveTo(0, -r * 1.1, r, 0); g.quadraticCurveTo(0, r * 1.1, -r, 0); g.closePath(); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.35, 0, TAU); g.fill(); break;
    case "key": g.beginPath(); g.arc(-r * 0.45, 0, r * 0.4, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(-r * 0.05, 0); g.lineTo(r, 0); g.moveTo(r * 0.6, 0); g.lineTo(r * 0.6, r * 0.4); g.moveTo(r * 0.9, 0); g.lineTo(r * 0.9, r * 0.35); g.stroke(); break;
    case "wave": g.beginPath(); for (let k = 0; k < 2; k++) { const yy = -r * 0.35 + k * r * 0.7; g.moveTo(-r, yy); g.bezierCurveTo(-r * 0.5, yy - r * 0.6, 0, yy + r * 0.6, r * 0.0, yy); g.bezierCurveTo(r * 0.5, yy - r * 0.6, r, yy + r * 0.6, r, yy); } g.stroke(); break;
    case "diamond": g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, 0); g.lineTo(0, r); g.lineTo(-r * 0.8, 0); g.closePath(); g.fill(); g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = r * 0.08; g.beginPath(); g.moveTo(-r * 0.8, 0); g.lineTo(r * 0.8, 0); g.moveTo(0, -r); g.lineTo(0, r); g.stroke(); break;
    case "skull": g.beginPath(); g.arc(0, -r * 0.2, r * 0.7, 0, TAU); g.fill(); g.fillRect(-r * 0.45, r * 0.1, r * 0.9, r * 0.6); g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(-r * 0.28, -r * 0.25, r * 0.2, 0, TAU); g.arc(r * 0.28, -r * 0.25, r * 0.2, 0, TAU); g.fill(); g.fillRect(-r * 0.3, r * 0.3, r * 0.12, r * 0.3); g.fillRect(-r * 0.06, r * 0.3, r * 0.12, r * 0.3); g.fillRect(r * 0.18, r * 0.3, r * 0.12, r * 0.3); break;
  }
  g.restore();
}

// ------------------------------------------------------------- portraits
// Every face is drawn from a handful of attributes so there are no image
// files. `talk` is 0..1 mouth openness, `t` is time for blinking.
export function drawPortrait(g, id, x, y, size, talk, t, sweat) {
  const c = CHARS[id]; if (!c) return;
  const f = c.face; const s = size / 100;
  g.save(); g.translate(x, y); g.scale(s, s);
  // frame
  g.fillStyle = "#0d1118"; rrect(g, 0, 0, 100, 100, 14); g.fill();
  g.save(); rrect(g, 0, 0, 100, 100, 14); g.clip();
  const grad = g.createLinearGradient(0, 0, 0, 100); grad.addColorStop(0, "#1c2436"); grad.addColorStop(1, "#0d1118");
  g.fillStyle = grad; g.fillRect(0, 0, 100, 100);
  if (f.style === "watch") {
    g.fillStyle = "#101a2a"; g.beginPath(); g.arc(50, 50, 34, 0, TAU); g.fill();
    g.strokeStyle = "#7fd"; g.lineWidth = 3; g.beginPath(); g.arc(50, 50, 30, 0, TAU); g.stroke();
    g.fillStyle = "#7fd"; g.fillRect(48, 28, 4, 24); g.fillRect(48, 48, 16, 4);
    g.restore(); g.restore(); return;
  }
  const blink = ((t * 0.7 + id.length) % 4.3) < 0.12;
  const big = f.big ? 1.15 : 1;
  const cx = 50, cy = 56;
  // hair behind
  g.fillStyle = f.hair;
  if (f.style === "long") { g.beginPath(); g.ellipse(cx, cy + 6, 30 * big, 40, 0, 0, TAU); g.fill(); }
  if (f.style === "curly") { for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; g.beginPath(); g.arc(cx + Math.cos(a) * 27, cy - 6 + Math.sin(a) * 27, 10, 0, TAU); g.fill(); } }
  if (f.style === "surfer") { g.beginPath(); g.ellipse(cx, cy - 4, 30, 30, 0, 0, TAU); g.fill(); }
  // neck and shoulders
  g.fillStyle = f.clothes; g.beginPath(); g.moveTo(8, 100); g.quadraticCurveTo(50, 62, 92, 100); g.closePath(); g.fill();
  if (f.stripes) { g.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { g.fillRect(10, 84 + i * 6, 80, 3); } }
  g.fillStyle = f.skin; g.fillRect(cx - 8, cy + 18, 16, 14);
  // head
  g.fillStyle = f.skin; g.beginPath(); g.ellipse(cx, cy, 24 * big, 27 * big, 0, 0, TAU); g.fill();
  // ears
  g.beginPath(); g.arc(cx - 24 * big, cy + 2, 5, 0, TAU); g.arc(cx + 24 * big, cy + 2, 5, 0, TAU); g.fill();
  // hair front / hats
  g.fillStyle = f.hair;
  switch (f.style) {
    case "short": g.beginPath(); g.ellipse(cx, cy - 16, 25, 14, 0, Math.PI, TAU); g.fill(); break;
    case "sleek": g.beginPath(); g.ellipse(cx, cy - 14, 26, 16, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 26, cy - 14, 6, 30); g.fillRect(cx + 20, cy - 14, 6, 30); break;
    case "bun": g.beginPath(); g.ellipse(cx, cy - 16, 25, 13, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.arc(cx, cy - 30, 9, 0, TAU); g.fill(); break;
    case "long": g.beginPath(); g.ellipse(cx, cy - 16, 25, 14, 0, Math.PI, TAU); g.fill(); break;
    case "curly": g.beginPath(); g.ellipse(cx, cy - 18, 26, 14, 0, Math.PI, TAU); g.fill(); break;
    case "surfer": g.beginPath(); g.ellipse(cx, cy - 16, 27, 16, 0, Math.PI, TAU); g.fill(); g.fillStyle = f.skin; break;
    case "bald": g.fillStyle = f.hair; g.beginPath(); g.ellipse(cx - 20, cy - 4, 6, 12, 0, 0, TAU); g.ellipse(cx + 20, cy - 4, 6, 12, 0, 0, TAU); g.fill(); break;
    case "ushanka": g.fillStyle = "#6b5040"; g.beginPath(); g.ellipse(cx, cy - 18, 32, 18, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 34, cy - 20, 10, 30); g.fillRect(cx + 24, cy - 20, 10, 30); g.fillStyle = "#8a7060"; g.fillRect(cx - 30, cy - 22, 60, 8); break;
    case "flatcap": g.fillStyle = "#4a4a3a"; g.beginPath(); g.ellipse(cx, cy - 16, 28, 14, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 10, cy - 18, 40, 6); break;
    case "boater": g.fillStyle = "#e8d8a0"; g.fillRect(cx - 34, cy - 18, 68, 5); g.fillRect(cx - 22, cy - 34, 44, 17); g.fillStyle = "#c0392b"; g.fillRect(cx - 22, cy - 22, 44, 4); break;
    case "scarf": g.fillStyle = "#b8860b"; g.beginPath(); g.ellipse(cx, cy - 12, 29, 20, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 29, cy - 12, 8, 40); g.fillRect(cx + 21, cy - 12, 8, 40); break;
    case "bandana": g.beginPath(); g.ellipse(cx, cy - 16, 25, 14, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#fff"; g.fillRect(cx - 27, cy - 22, 54, 8); g.fillStyle = "#c0392b"; g.fillRect(cx - 27, cy - 20, 54, 3); break;
    case "trilby": g.beginPath(); g.ellipse(cx, cy - 14, 25, 12, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#3a3a3a"; g.fillRect(cx - 33, cy - 22, 66, 5); g.beginPath(); g.moveTo(cx - 22, cy - 22); g.lineTo(cx - 18, cy - 40); g.lineTo(cx + 18, cy - 40); g.lineTo(cx + 22, cy - 22); g.closePath(); g.fill(); g.fillStyle = "#7a5a3a"; g.fillRect(cx - 21, cy - 27, 42, 4); break;
  }
  if (f.accessory === "capguard") { g.fillStyle = "#1a2a5a"; g.beginPath(); g.ellipse(cx, cy - 16, 26, 12, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#101a3a"; g.fillRect(cx - 28, cy - 18, 56, 5); g.fillStyle = "#ffd166"; g.beginPath(); g.arc(cx, cy - 24, 4, 0, TAU); g.fill(); }
  // eyes
  const ey = cy - 4, ex = 10 * big;
  g.fillStyle = "#fff";
  if (!blink) { g.beginPath(); g.ellipse(cx - ex, ey, 6, 5, 0, 0, TAU); g.ellipse(cx + ex, ey, 6, 5, 0, 0, TAU); g.fill();
    g.fillStyle = f.eyes; g.beginPath(); g.arc(cx - ex + 1, ey, 3, 0, TAU); g.arc(cx + ex + 1, ey, 3, 0, TAU); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(cx - ex + 2, ey - 1, 1, 0, TAU); g.arc(cx + ex + 2, ey - 1, 1, 0, TAU); g.fill(); }
  else { g.strokeStyle = "#5a3a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - ex - 6, ey); g.lineTo(cx - ex + 6, ey); g.moveTo(cx + ex - 6, ey); g.lineTo(cx + ex + 6, ey); g.stroke(); }
  // brows
  g.strokeStyle = f.hair === "#d8d8d8" ? "#9a9a9a" : f.hair; g.lineWidth = 2.5; g.lineCap = "round";
  const bs = f.brows === "stern" ? 3 : 0;
  g.beginPath(); g.moveTo(cx - ex - 6, ey - 9 + bs); g.lineTo(cx - ex + 6, ey - 9 - bs + (f.brows === "stern" ? 4 : 0));
  g.moveTo(cx + ex - 6, ey - 9 - bs + (f.brows === "stern" ? 4 : 0)); g.lineTo(cx + ex + 6, ey - 9 + bs); g.stroke();
  // glasses
  if (f.glasses === "dark") { g.fillStyle = "#111"; rrect(g, cx - ex - 9, ey - 6, 18, 12, 4); g.fill(); rrect(g, cx + ex - 9, ey - 6, 18, 12, 4); g.fill(); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(cx - ex - 6, ey - 4, 6, 2); g.fillRect(cx + ex - 6, ey - 4, 6, 2); g.fillStyle = "#111"; g.fillRect(cx - 2, ey - 2, 4, 2); }
  if (f.glasses === "round") { g.strokeStyle = "#2a1a4a"; g.lineWidth = 2; g.beginPath(); g.arc(cx - ex, ey, 9, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx + ex, ey, 9, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(cx - ex + 9, ey); g.lineTo(cx + ex - 9, ey); g.stroke(); }
  // nose
  g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, ey + 2); g.lineTo(cx - 3, ey + 11); g.lineTo(cx + 2, ey + 12); g.stroke();
  // mouth
  const my = cy + 13, open = 2 + talk * 9;
  if (f.facial === "moustache") { g.fillStyle = f.hair; g.beginPath(); g.ellipse(cx - 6, my - 4, 8, 3.5, 0.2, 0, TAU); g.ellipse(cx + 6, my - 4, 8, 3.5, -0.2, 0, TAU); g.fill(); }
  if (f.facial === "beard") { g.fillStyle = f.hair; g.beginPath(); g.ellipse(cx, my + 6, 22, 14, 0, 0, Math.PI); g.fill(); }
  if (f.facial === "stubble") { g.fillStyle = "rgba(60,40,30,.25)"; g.beginPath(); g.ellipse(cx, my + 4, 20, 12, 0, 0, Math.PI); g.fill(); }
  g.fillStyle = f.lips || "#8a3a3a"; g.beginPath(); g.ellipse(cx, my, 8, open / 2, 0, 0, TAU); g.fill();
  if (talk > 0.3) { g.fillStyle = "#fff"; g.fillRect(cx - 5, my - open / 2, 10, 2); }
  // accessories
  if (f.accessory === "earpiece") { g.fillStyle = "#222"; g.beginPath(); g.arc(cx + 24 * big, cy + 2, 3, 0, TAU); g.fill(); }
  if (f.accessory === "headset") { g.strokeStyle = "#222"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy - 10, 30, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.fillStyle = "#222"; g.beginPath(); g.arc(cx - 26, cy + 2, 5, 0, TAU); g.fill(); g.fillRect(cx - 26, cy + 2, 3, 16); }
  if (f.accessory === "medal") { g.fillStyle = "#ffd166"; g.beginPath(); g.arc(cx + 18, 92, 6, 0, TAU); g.fill(); g.fillStyle = "#c0392b"; g.fillRect(cx + 15, 82, 6, 6); }
  if (f.accessory === "pencil") { g.fillStyle = "#ffd166"; g.save(); g.translate(cx + 24, cy - 24); g.rotate(-0.6); g.fillRect(-2, -12, 4, 24); g.restore(); }
  if (f.accessory === "scarf") { g.fillStyle = "#8a2a2a"; g.fillRect(cx - 14, cy + 22, 28, 8); }
  if (f.accessory === "badge") { g.fillStyle = "#ffd166"; drawSymbol(g, "star", cx - 22, 90, 6, "#ffd166"); }
  if (f.accessory === "chopsticks") { g.fillStyle = "#c9a56a"; g.fillRect(cx + 24, cy - 30, 2, 22); g.fillRect(cx + 28, cy - 30, 2, 22); }
  if (f.accessory === "shades_up") { g.fillStyle = "#222"; rrect(g, cx - 18, cy - 24, 36, 6, 3); g.fill(); }
  if (f.accessory === "collar") { g.fillStyle = "#3a0a1a"; g.beginPath(); g.moveTo(20, 100); g.lineTo(cx - 8, 72); g.lineTo(cx, 84); g.lineTo(cx + 8, 72); g.lineTo(80, 100); g.closePath(); g.fill(); }
  if (f.accessory === "food") { g.fillStyle = "#d9a066"; g.beginPath(); g.ellipse(82, 88, 12, 7, 0.3, 0, TAU); g.fill(); g.fillStyle = "#8a4a2a"; g.beginPath(); g.ellipse(82, 86, 8, 3, 0.3, 0, TAU); g.fill(); }
  if (f.accessory === "brush") { g.fillStyle = "#8a6a4a"; g.fillRect(cx - 34, cy + 10, 3, 24); g.fillStyle = "#ddd"; g.fillRect(cx - 37, cy + 30, 9, 8); }
  if (sweat || (f.sweaty && talk > 0.5)) { g.fillStyle = "#7ec8ff"; const k = Math.floor(t * 6) % 3; g.beginPath(); g.ellipse(cx - 20, cy - 12 + k * 4, 2.5, 4, 0, 0, TAU); g.ellipse(cx + 22, cy - 8 + ((k + 1) % 3) * 4, 2.5, 4, 0, 0, TAU); g.fill(); }
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 2; rrect(g, 0, 0, 100, 100, 14); g.stroke();
  g.restore();
}

// ------------------------------------------------------------- dialogue
export class Dialogue {
  constructor(game) { this.G = game; this.lines = []; this.i = 0; this.shown = 0; this.t = 0; this.talk = 0; this.onDone = null; this.active = false; this.speaking = false; this.speakStart = 0; this.lineLen = 0; this.holdT = 0; }
  show(lines, onDone) {
    if (!lines || !lines.length) { if (onDone) onDone(); return; }
    this.lines = lines; this.i = -1; this.onDone = onDone; this.active = true; this.next();
  }
  next() {
    this.i++;
    if (this.i >= this.lines.length) { this.active = false; Speech.stop(); const cb = this.onDone; this.onDone = null; if (cb) cb(); return; }
    const [who, txt] = this.lines[this.i];
    this.shown = 0; this.t = 0; this.holdT = 0; this.speaking = false;
    const c = CHARS[who];
    this.lineLen = txt.length;
    const started = Speech.say(txt, c ? c.voice : null, { onStart: () => { this.speaking = true; this.speakStart = this.t; }, onEnd: () => { this.speaking = false; } });
    if (!started) this.speaking = false;
  }
  tap() {
    if (!this.active) return;
    const [, txt] = this.lines[this.i];
    if (this.shown < txt.length) { this.shown = txt.length; return; }
    SFX.click(); this.next();
  }
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    const [, txt] = this.lines[this.i];
    // typewriter, roughly paced with the voice
    const cps = this.speaking ? 34 : 48;
    if (this.shown < txt.length) { const before = this.shown; this.shown = Math.min(txt.length, this.shown + cps * dt); if (Math.floor(this.shown / 3) !== Math.floor(before / 3)) SFX.type(); }
    const talking = this.speaking || (this.shown < txt.length && !Speech.available);
    const target = talking ? 0.35 + 0.65 * Math.abs(Math.sin(this.t * 14)) * (Math.sin(this.t * 3.1) > -0.6 ? 1 : 0.2) : 0;
    this.talk += (target - this.talk) * Math.min(1, dt * 20);
    if (this.shown >= txt.length && !this.speaking) this.holdT += dt;
  }
  draw(g, W, H, s) {
    if (!this.active) return;
    const [who, txt] = this.lines[this.i];
    const c = CHARS[who];
    const bh = Math.min(H * 0.34, 250 * s), bw = Math.min(W - 40 * s, 1100 * s);
    const bx = (W - bw) / 2, by = H - bh - 18 * s;
    panel(g, bx, by, bw, bh, s, { bg: "rgba(8,12,20,.9)" });
    const ps = bh - 30 * s;
    drawPortrait(g, who, bx + 16 * s, by + 15 * s, ps, this.talk, this.t, who === "nigel" && this.i > 0);
    // name plate
    const nx = bx + 16 * s + ps + 18 * s;
    const nw = g.measureText(c.name).width;
    g.font = `800 ${20 * s}px ${FONT}`;
    const plateW = g.measureText(c.name).width + 28 * s;
    g.fillStyle = who === "eclipse" ? "#5a0a2a" : who === "vi" ? "#5a2a8a" : who === "hale" ? "#1b2a4a" : "#1f6f4a";
    rrect(g, nx, by - 14 * s, plateW, 30 * s, 8 * s); g.fill();
    text(g, c.name, nx + plateW / 2, by + 1, 20 * s, "#fff", "center", 800);
    // text
    const tx = nx, ty = by + 40 * s, tw = bw - (nx - bx) - 24 * s;
    const fs = Math.min(27 * s, bh * 0.135);
    const lines = wrap(g, txt, tw, fs, 500);
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const take = clamp(Math.floor(this.shown) - count, 0, l.length);
      text(g, l.slice(0, take), tx, ty + i * fs * 1.32, fs, "#eef2f8", "left", 500);
      count += l.length + 1;
    }
    // continue arrow
    if (this.shown >= txt.length) {
      const ax = bx + bw - 30 * s, ay = by + bh - 24 * s + Math.sin(this.t * 5) * 3 * s;
      g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(ax - 10 * s, ay - 8 * s); g.lineTo(ax + 10 * s, ay - 8 * s); g.lineTo(ax, ay + 6 * s); g.closePath(); g.fill();
    }
    text(g, `${this.i + 1}/${this.lines.length}`, bx + bw - 16 * s, by + 16 * s, 13 * s, "rgba(255,255,255,.4)", "right", 600);
  }
}

// ------------------------------------------------------------- world map
// Simplified continents in longitude/latitude, drawn on an equirectangular
// projection. Stylised, not a survey.
const CONTINENTS = [
  [[-168,66],[-165,62],[-158,58],[-150,60],[-140,60],[-135,58],[-130,54],[-125,49],[-124,42],[-122,37],[-118,34],[-115,30],[-110,24],[-105,20],[-97,16],[-92,15],[-87,13],[-83,9],[-78,8],[-83,11],[-88,16],[-90,21],[-97,26],[-94,30],[-89,30],[-84,30],[-82,26],[-80,25],[-81,31],[-76,35],[-74,40],[-70,42],[-67,45],[-65,47],[-60,46],[-64,49],[-58,52],[-60,56],[-64,60],[-70,62],[-78,63],[-78,58],[-80,52],[-85,55],[-92,57],[-94,60],[-92,64],[-86,66],[-82,68],[-90,70],[-100,69],[-110,68],[-120,70],[-128,70],[-140,70],[-156,71]],
  [[-73,78],[-60,82],[-30,83],[-20,80],[-18,72],[-22,70],[-40,64],[-45,60],[-50,62],[-55,67],[-60,72],[-70,76]],
  [[-78,8],[-72,12],[-62,10],[-52,5],[-50,0],[-44,-2],[-35,-5],[-35,-8],[-39,-13],[-40,-20],[-42,-23],[-48,-26],[-52,-32],[-58,-38],[-62,-40],[-65,-45],[-68,-52],[-70,-55],[-74,-52],[-74,-45],[-72,-38],[-71,-30],[-70,-20],[-75,-15],[-80,-5],[-81,0],[-79,4]],
  [[-9,43],[-9,37],[-6,36],[-2,37],[0,39],[3,42],[5,43],[8,44],[10,44],[12,42],[15,40],[18,40],[16,42],[13,44],[14,45],[16,44],[19,42],[20,40],[22,37],[24,38],[26,40],[28,41],[28,37],[30,36],[36,36],[35,33],[34,31],[35,29],[40,20],[44,12],[50,15],[56,18],[59,23],[56,26],[51,25],[48,29],[50,30],[57,27],[62,25],[67,24],[72,20],[73,15],[77,8],[80,13],[82,17],[87,21],[91,22],[94,18],[98,10],[101,3],[104,2],[103,8],[100,13],[106,10],[109,12],[108,18],[112,21],[117,23],[121,29],[121,32],[120,36],[122,38],[118,39],[122,40],[124,40],[127,36],[129,35],[129,38],[130,42],[135,44],[140,50],[141,53],[137,54],[140,58],[148,59],[156,61],[163,60],[160,63],[170,60],[180,65],[180,70],[170,70],[160,70],[150,72],[140,73],[130,72],[120,73],[110,77],[100,78],[90,75],[80,73],[70,73],[60,70],[55,68],[50,68],[45,66],[40,68],[35,70],[28,71],[20,70],[15,68],[10,63],[5,60],[6,58],[11,59],[12,56],[10,54],[8,54],[4,52],[2,51],[-2,48],[-5,48],[-2,44]],
  [[-5,50],[1,51],[2,53],[-2,56],[-3,58],[-6,58],[-5,55],[-3,54],[-5,52]],
  [[-10,52],[-6,52],[-6,55],[-8,55],[-10,53]],
  [[130,31],[132,34],[135,34],[137,35],[140,36],[141,39],[142,42],[145,44],[142,45],[140,42],[140,39],[138,37],[135,36],[132,35],[130,33]],
  [[-6,36],[-10,30],[-17,21],[-17,15],[-15,11],[-8,5],[0,5],[8,4],[10,2],[9,-2],[12,-6],[13,-12],[12,-17],[15,-23],[17,-30],[20,-34],[27,-34],[33,-28],[35,-24],[40,-15],[40,-10],[42,-2],[49,4],[51,11],[43,12],[39,15],[37,20],[34,28],[32,31],[25,32],[20,31],[10,37],[3,37],[-2,35]],
  [[114,-22],[114,-34],[118,-35],[124,-33],[130,-31],[135,-35],[139,-37],[146,-39],[150,-37],[153,-30],[153,-25],[146,-19],[142,-11],[137,-13],[136,-12],[130,-12],[126,-14],[122,-17]],
  [[167,-46],[172,-44],[174,-41],[176,-38],[174,-35],[172,-40],[170,-44]],
  [[44,-25],[48,-25],[50,-16],[49,-12],[44,-17],[43,-22]],
  [[95,5],[106,-6],[114,-8],[120,-9],[125,-8],[120,-6],[117,0],[110,1],[104,1]],
  [[131,-1],[141,-3],[150,-10],[146,-8],[140,-8],[135,-4]],
  [[-180,-62],[180,-62],[180,-90],[-180,-90]],
];
export class WorldMap {
  constructor(game) { this.G = game; this.t = 0; this.flight = null; this.pulse = 0; }
  project(lon, lat, r) { return [r.x + (lon + 180) / 360 * r.w, r.y + (90 - lat) / 180 * r.h]; }
  rect(W, H, s) {
    // keep a 2:1 map that fills the width but leaves room for the panel below
    let w = W - 40 * s, h = w / 2;
    const maxH = H - 150 * s;
    if (h > maxH) { h = maxH; w = h * 2; }
    return { x: (W - w) / 2, y: 40 * s + (maxH - h) / 2 * 0.4, w, h };
  }
  fly(from, to, onDone) { this.flight = { from, to, t: 0, dur: 3.2, onDone }; SFX.plane(); }
  update(dt) {
    this.t += dt; this.pulse += dt;
    if (this.flight) { this.flight.t += dt; if (this.flight.t >= this.flight.dur) { const f = this.flight; this.flight = null; if (f.onDone) f.onDone(); } }
  }
  draw(g, W, H, s, progress, act) {
    act = act || 1;
    const r = this.rect(W, H, s);
    // ocean
    g.fillStyle = "#08131f"; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
    const grad = g.createLinearGradient(0, r.y, 0, r.y + r.h); grad.addColorStop(0, "#0b2238"); grad.addColorStop(1, "#071827");
    g.fillStyle = grad; g.fillRect(r.x, r.y, r.w, r.h);
    // grid
    g.strokeStyle = "rgba(120,180,230,.09)"; g.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) { const [x] = this.project(lon, 0, r); g.beginPath(); g.moveTo(x, r.y); g.lineTo(x, r.y + r.h); g.stroke(); }
    for (let lat = -60; lat <= 90; lat += 30) { const [, y] = this.project(0, lat, r); g.beginPath(); g.moveTo(r.x, y); g.lineTo(r.x + r.w, y); g.stroke(); }
    // land
    for (let ci = 0; ci < CONTINENTS.length; ci++) {
      const poly = CONTINENTS[ci];
      g.beginPath(); poly.forEach((p, i) => { const [x, y] = this.project(p[0], p[1], r); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath();
      g.fillStyle = ci === CONTINENTS.length - 1 ? "#1c3346" : "#1f4d3a"; g.fill();
      g.strokeStyle = "rgba(140,220,180,.35)"; g.lineWidth = 1.2; g.stroke();
    }
    // routes: one chain per act, the second act leaving from London again
    const pts = COUNTRIES.map(c => this.project(c.lon, c.lat, r));
    g.setLineDash([6 * s, 6 * s]); g.lineWidth = 2 * s;
    for (const a of ACTS) {
      if (a.n > act) continue;
      const chain = a.countries.map(id => COUNTRIES.findIndex(c => c.id === id)); if (a.n > 1) chain.unshift(0);
      for (let k = 0; k < chain.length - 1; k++) {
        const i = chain[k], j = chain[k + 1];
        g.strokeStyle = j <= progress ? (a.n === 1 ? "#ffd166" : "#ff9f43") : "rgba(255,255,255,.18)";
        g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); const [mx, my] = mid(pts[i], pts[j]); g.quadraticCurveTo(mx, my, pts[j][0], pts[j][1]); g.stroke();
      }
    }
    g.setLineDash([]);
    // pins
    COUNTRIES.forEach((c, i) => {
      if (c.act > act) return;
      const [x, y] = pts[i];
      const done = i < progress, cur = i === progress;
      if (cur && !this.flight) { const p = (this.pulse % 1.4) / 1.4; g.strokeStyle = `rgba(255,209,102,${1 - p})`; g.lineWidth = 3 * s; g.beginPath(); g.arc(x, y, 8 * s + p * 26 * s, 0, TAU); g.stroke(); }
      g.fillStyle = done ? "#2ecc71" : cur ? "#ffd166" : "rgba(255,255,255,.35)";
      g.beginPath(); g.arc(x, y, 6 * s, 0, TAU); g.fill();
      g.strokeStyle = "#000"; g.lineWidth = 1.5; g.stroke();
      const above = c.lat > 0;
      drawFlag(g, c.flag, x - 14 * s, above ? y - 34 * s : y + 12 * s, 28 * s, 19 * s);
      if (cur || done) text(g, c.city, x, above ? y - 44 * s : y + 42 * s, 13 * s, done ? "#9be7b6" : "#ffd166", "center", 700);
    });
    // plane
    if (this.flight) {
      const f = this.flight, a = pts[f.from], b = pts[f.to], k = ease(clamp(f.t / f.dur, 0, 1));
      const [mx, my] = mid(a, b);
      const x = (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * mx + k * k * b[0];
      const y = (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * my + k * k * b[1];
      const k2 = clamp(k + 0.02, 0, 1);
      const x2 = (1 - k2) * (1 - k2) * a[0] + 2 * (1 - k2) * k2 * mx + k2 * k2 * b[0];
      const y2 = (1 - k2) * (1 - k2) * a[1] + 2 * (1 - k2) * k2 * my + k2 * k2 * b[1];
      g.save(); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x));
      g.fillStyle = "#fff"; g.beginPath(); g.moveTo(14 * s, 0); g.lineTo(-8 * s, -5 * s); g.lineTo(-4 * s, 0); g.lineTo(-8 * s, 5 * s); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(2 * s, 0); g.lineTo(-6 * s, -14 * s); g.lineTo(-2 * s, -14 * s); g.lineTo(6 * s, 0); g.lineTo(-2 * s, 14 * s); g.lineTo(-6 * s, 14 * s); g.closePath(); g.fill();
      g.restore();
    }
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 2; g.strokeRect(r.x, r.y, r.w, r.h);
    return r;
  }
}
function mid(a, b) { return [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - Math.abs(a[0] - b[0]) * 0.18 - 10]; }

// ------------------------------------------------------------- misc screens
export function drawStamp(g, W, H, s, k, title, body, t) {
  // k: 0..1 slam animation
  g.fillStyle = `rgba(0,0,0,${0.65 * clamp(k * 3, 0, 1)})`; g.fillRect(0, 0, W, H);
  const sc = 1 + (1 - ease(clamp(k * 1.6, 0, 1))) * 2.5;
  g.save(); g.translate(W / 2, H * 0.3); g.rotate(-0.1); g.scale(sc, sc); g.globalAlpha = clamp(k * 3, 0, 1);
  g.strokeStyle = "#e63946"; g.lineWidth = 8 * s; rrect(g, -260 * s, -60 * s, 520 * s, 120 * s, 12 * s); g.stroke();
  g.fillStyle = "rgba(230,57,70,.12)"; g.fill();
  text(g, "INTEL WON", 0, 4 * s, 72 * s, "#e63946", "center", 900);
  g.restore();
  if (k > 0.5) {
    const a = clamp((k - 0.5) * 4, 0, 1);
    g.globalAlpha = a;
    const pw = Math.min(W - 60 * s, 900 * s), ph = 210 * s, px = (W - pw) / 2, py = H * 0.47;
    panel(g, px, py, pw, ph, s, { bg: "rgba(255,248,225,.97)", border: "#c9a15a" });
    g.fillStyle = "#c9a15a"; g.fillRect(px + 20 * s, py + 46 * s, pw - 40 * s, 2);
    text(g, title.toUpperCase(), px + 24 * s, py + 26 * s, 20 * s, "#7a4a10", "left", 900, MONO);
    paragraph(g, body, px + 24 * s, py + 76 * s, pw - 48 * s, 22 * s, "#2a1a0a", 30 * s, "left", 500, MONO);
    g.globalAlpha = 1;
    if (Math.sin(t * 5) > 0) text(g, "tap to continue", W / 2, py + ph + 36 * s, 18 * s, "#ffd166", "center", 700);
  }
}
export function drawRotatePrompt(g, W, H, s, t) {
  g.fillStyle = "#05070c"; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2 - 40 * s); g.rotate(Math.sin(t * 2) * 0.35 - 0.4);
  g.fillStyle = "#e8ecf4"; rrect(g, -45 * s, -65 * s, 90 * s, 130 * s, 12 * s); g.fill();
  g.fillStyle = "#05070c"; rrect(g, -38 * s, -52 * s, 76 * s, 104 * s, 4 * s); g.fill();
  g.restore();
  text(g, "Turn the iPad sideways", W / 2, H / 2 + 60 * s, 26 * s, "#fff", "center", 700);
  text(g, "Agent Rory plays in landscape", W / 2, H / 2 + 96 * s, 17 * s, "#94a2bb", "center", 500);
}
export function drawBriefingRoom(g, W, H, s, t) {
  g.fillStyle = "#101418"; g.fillRect(0, 0, W, H);
  // wall panels
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? "#151a20" : "#121720"; g.fillRect(i * W / 12, 0, W / 12 + 1, H * 0.62); }
  // floor
  const fg = g.createLinearGradient(0, H * 0.62, 0, H); fg.addColorStop(0, "#2a2320"); fg.addColorStop(1, "#0d0b0a"); g.fillStyle = fg; g.fillRect(0, H * 0.62, W, H * 0.38);
  // table
  g.fillStyle = "#3a2a1a"; g.beginPath(); g.ellipse(W / 2, H * 0.78, W * 0.36, H * 0.12, 0, 0, TAU); g.fill();
  g.fillStyle = "#5a4020"; g.beginPath(); g.ellipse(W / 2, H * 0.75, W * 0.36, H * 0.12, 0, 0, TAU); g.fill();
  // screen
  const sw = W * 0.42, sh = sw * 0.56, sx = W / 2 - sw / 2, sy = H * 0.09;
  g.fillStyle = "#0a0c10"; rrect(g, sx - 10 * s, sy - 10 * s, sw + 20 * s, sh + 20 * s, 8 * s); g.fill();
  const sg = g.createLinearGradient(0, sy, 0, sy + sh); sg.addColorStop(0, "#0f2a3f"); sg.addColorStop(1, "#08141f"); g.fillStyle = sg; g.fillRect(sx, sy, sw, sh);
  g.strokeStyle = "rgba(120,200,255,.25)"; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(sx, sy + sh * i / 6); g.lineTo(sx + sw, sy + sh * i / 6); g.stroke(); }
  // the Helios lens diagram
  g.save(); g.translate(sx + sw * 0.32, sy + sh * 0.5);
  g.strokeStyle = "#7fd0ff"; g.lineWidth = 2 * s; g.beginPath(); g.ellipse(0, 0, sh * 0.32, sh * 0.12, -0.5, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(0, 0); g.lineTo(sh * 0.6, -sh * 0.25); g.stroke();
  g.fillStyle = "#ffd166"; g.beginPath(); g.arc(sh * 0.62, -sh * 0.27, sh * 0.07, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,209,102,.6)"; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-sh * 0.1 + i * 8 * s, sh * 0.05); g.lineTo(-sh * 0.4 + i * 8 * s, sh * 0.45); g.stroke(); }
  g.restore();
  text(g, "HELIOS LENS", sx + sw * 0.62, sy + sh * 0.25, sh * 0.11, "#7fd0ff", "left", 800, MONO);
  text(g, "TOP SECRET", sx + sw * 0.62, sy + sh * 0.4, sh * 0.08, "#e63946", "left", 800, MONO);
  text(g, "STOLEN " + (Math.sin(t * 4) > 0 ? "▮" : " "), sx + sw * 0.62, sy + sh * 0.55, sh * 0.08, "#ffd166", "left", 800, MONO);
  // M.I.S.T. crest
  g.fillStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.arc(W * 0.12, H * 0.3, 60 * s, 0, TAU); g.fill();
  text(g, "M.I.S.T.", W * 0.12, H * 0.3, 22 * s, "rgba(255,255,255,.25)", "center", 900);
  // a lamp
  g.fillStyle = "rgba(255,220,150,.08)"; g.beginPath(); g.moveTo(W * 0.85, 0); g.lineTo(W * 0.72, H * 0.62); g.lineTo(W * 0.98, H * 0.62); g.closePath(); g.fill();
}
export function drawTitleBackdrop(g, W, H, s, t) {
  const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, "#050914"); grad.addColorStop(1, "#0b1a2e");
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // an eclipse
  const cx = W * 0.5, cy = H * 0.36, R = Math.min(W, H) * 0.19;
  const glow = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 2.4); glow.addColorStop(0, "rgba(255,200,90,.55)"); glow.addColorStop(1, "rgba(255,200,90,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = "#ffe6a0"; g.beginPath(); g.arc(cx, cy, R * 1.04, 0, TAU); g.fill();
  g.fillStyle = "#070a12"; g.beginPath(); g.arc(cx + Math.sin(t * 0.3) * R * 0.05, cy, R, 0, TAU); g.fill();
  // silhouettes of the seven landmarks along the bottom
  g.fillStyle = "#04060b";
  const base = H * 0.86;
  const sk = [[0.05, 0.18, 0.5], [0.12, 0.05, 0.9], [0.2, 0.12, 0.45], [0.3, 0.16, 0.3], [0.42, 0.1, 0.8], [0.55, 0.14, 0.4], [0.68, 0.12, 0.6], [0.8, 0.2, 0.35], [0.9, 0.08, 0.7]];
  for (const [x, w, h] of sk) g.fillRect(W * x, base - H * 0.3 * h, W * w, H * 0.3 * h + H * 0.2);
  g.beginPath(); g.moveTo(W * 0.3, base); g.lineTo(W * 0.38, base - H * 0.2); g.lineTo(W * 0.46, base); g.fill();
  g.fillRect(W * 0.68 + W * 0.05, base - H * 0.34, W * 0.02, H * 0.34);
  g.fillRect(0, base, W, H - base);
}
export function drawSpyWatch(g, x, y, w, h, s, objective, intelCount, total, t) {
  g.save();
  g.fillStyle = "rgba(6,10,16,.78)"; rrect(g, x, y, w, h, 14 * s); g.fill();
  g.strokeStyle = "rgba(127,221,204,.5)"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#7fd"; g.beginPath(); g.arc(x + 18 * s, y + 18 * s, 5 * s + Math.sin(t * 4) * 1.5 * s, 0, TAU); g.fill();
  text(g, "SPY WATCH", x + 32 * s, y + 18 * s, 13 * s, "#7fd", "left", 800, MONO);
  text(g, "INTEL " + intelCount + "/" + total, x + w - 12 * s, y + 18 * s, 13 * s, "#ffd166", "right", 800, MONO);
  paragraph(g, objective, x + 14 * s, y + 46 * s, w - 28 * s, 17 * s, "#eef2f8", 21 * s, "left", 600);
  g.restore();
}
export function drawDossier(g, W, H, s, save, scroll, t, abortCode) {
  g.fillStyle = "rgba(4,6,10,.92)"; g.fillRect(0, 0, W, H);
  text(g, "DOSSIER", W / 2, 42 * s, 34 * s, "#ffd166", "center", 900);
  text(g, "Everything Rory has found out so far", W / 2, 74 * s, 16 * s, "#94a2bb", "center", 500);
  const cw = Math.min(W - 80 * s, 820 * s), cx = (W - cw) / 2;
  let y = 110 * s - scroll;
  let n = 0;
  g.save(); g.beginPath(); g.rect(0, 96 * s, W, H - 96 * s - 80 * s); g.clip();
  let lastAct = 0;
  for (const c of COUNTRIES) {
    if (c.act !== lastAct) { lastAct = c.act; if (y + 40 * s > 90 * s && y < H) text(g, `ACT ${c.act === 1 ? "ONE" : "TWO"}  ·  ${ACTS[c.act - 1].title.toUpperCase()}`, cx, y + 16 * s, 16 * s, "#ff9f43", "left", 900, MONO); y += 40 * s; }
    for (const m of c.missions) {
      n++;
      const done = save.done.includes(m.id);
      const h = done ? 118 * s : 56 * s;
      if (y + h > 90 * s && y < H) {
        panel(g, cx, y, cw, h, s, { bg: done ? "rgba(255,248,225,.95)" : "rgba(255,255,255,.06)", border: done ? "#c9a15a" : "rgba(255,255,255,.12)", r: 10 * s });
        drawFlag(g, c.flag, cx + 14 * s, y + 14 * s, 30 * s, 20 * s);
        text(g, `${n}. ${m.title}`, cx + 56 * s, y + 24 * s, 17 * s, done ? "#7a4a10" : "rgba(255,255,255,.5)", "left", 800, MONO);
        text(g, c.city.toUpperCase(), cx + cw - 14 * s, y + 24 * s, 12 * s, done ? "#a07030" : "rgba(255,255,255,.3)", "right", 700, MONO);
        if (done) {
          let txt = m.intel.text;
          if (m.game === "shredder" && abortCode) txt = txt.replace("written in the Dossier", "shown below");
          paragraph(g, txt, cx + 14 * s, y + 56 * s, cw - 28 * s, 15 * s, "#2a1a0a", 19 * s, "left", 500, MONO);
          if (m.game === "shredder" && abortCode && !save.done.some(id => id !== m.id && COUNTRIES.some(cc => cc.missions.some(q => q.id === id && q.game === "shredder" && ALL_IDS.indexOf(id) > ALL_IDS.indexOf(m.id))))) { abortCode.forEach((sym, i) => drawSymbol(g, sym, cx + cw - 30 * s - (abortCode.length - 1 - i) * 34 * s, y + 96 * s, 11 * s, "#7a1a10")); }
        } else text(g, "locked", cx + 56 * s, y + 42 * s, 12 * s, "rgba(255,255,255,.3)", "left", 600, MONO);
      }
      y += h + 10 * s;
    }
  }
  g.restore();
  return y + scroll; // content height
}
const ALL_IDS = COUNTRIES.flatMap(c => c.missions.map(m => m.id));
export { CONTINENTS };
