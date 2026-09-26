// 2D user interface on the overlay canvas: drawing helpers, immediate-mode
// buttons, procedural portraits and flags, the dialogue box, the HUD, the
// world map, the dossier, the title, the briefing and the intel stamp.
import { CHARS, COUNTRIES, ACTS, SYMBOLS, actWord } from "./story.js";
import { landRings } from "./land.js";
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
    case "cz": { g.fillStyle = "#fff"; g.fillRect(x, y, w, h / 2); g.fillStyle = "#D7141A"; g.fillRect(x, y + h / 2, w, h / 2); g.fillStyle = "#11457E"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.5, y + h / 2); g.lineTo(x, y + h); g.closePath(); g.fill(); break; }
    case "de": band(["#000", "#DD0000", "#FFCE00"]); break;
    case "sct": { g.fillStyle = "#005EB8"; g.fillRect(x, y, w, h); g.strokeStyle = "#fff"; g.lineWidth = h * 0.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke(); break; }
    case "cu": { for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#fff" : "#002A8F"; g.fillRect(x, y + h * i / 5, w, h / 5 + 1); } g.fillStyle = "#CF142B"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.45, y + h / 2); g.lineTo(x, y + h); g.closePath(); g.fill(); drawSymbol(g, "star", x + w * 0.15, y + h / 2, h * 0.14, "#fff"); break; }
    case "cr": { band(["#002B7F", "#fff", "#CE1126", "#CE1126", "#fff", "#002B7F"]); break; }
    case "fr": band(["#0055A4", "#fff", "#EF4135"], true); break;
    case "ke": band(["#000", "#BB0000", "#006600"]); g.fillStyle = "#fff"; g.fillRect(x, y + h * 0.3, w, h * 0.04); g.fillRect(x, y + h * 0.66, w, h * 0.04); g.fillStyle = "#BB0000"; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w * 0.1, h * 0.36, 0, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = h * 0.05; g.stroke(); break;
    case "in": band(["#FF9933", "#fff", "#138808"]); g.strokeStyle = "#000080"; g.lineWidth = h * 0.04; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.14, 0, TAU); g.stroke(); break;
    case "cn": g.fillStyle = "#DE2910"; g.fillRect(x, y, w, h); g.fillStyle = "#FFDE00"; { const st = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }; st(x + w * 0.17, y + h * 0.28, h * 0.16); st(x + w * 0.33, y + h * 0.1, h * 0.05); st(x + w * 0.39, y + h * 0.22, h * 0.05); st(x + w * 0.39, y + h * 0.38, h * 0.05); st(x + w * 0.33, y + h * 0.5, h * 0.05); } break;
    case "au": g.fillStyle = "#00008B"; g.fillRect(x, y, w, h); g.save(); g.beginPath(); g.rect(x, y, w / 2, h / 2); g.clip(); drawFlag(g, "uk", x, y, w / 2, h / 2); g.restore(); g.fillStyle = "#fff"; for (const [sx, sy, r] of [[0.25, 0.75, 0.09], [0.75, 0.2, 0.05], [0.65, 0.5, 0.05], [0.85, 0.42, 0.05], [0.75, 0.8, 0.05]]) { g.beginPath(); for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + i * Math.PI / 7, rr = i % 2 ? r * h * 0.45 : r * h; g.lineTo(x + w * sx + Math.cos(a) * rr, y + h * sy + Math.sin(a) * rr); } g.closePath(); g.fill(); } break;
    case "mx": band(["#006847", "#fff", "#CE1126"], true); g.fillStyle = "#8a6a2a"; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.12, 0, TAU); g.fill(); g.fillStyle = "#2a6a2a"; g.beginPath(); g.arc(x + w / 2, y + h * 0.62, h * 0.06, 0, TAU); g.fill(); break;
    case "ch": g.fillStyle = "#D52B1E"; g.fillRect(x, y, w, h); g.fillStyle = "#fff"; g.fillRect(x + w / 2 - h * 0.1, y + h * 0.2, h * 0.2, h * 0.6); g.fillRect(x + w / 2 - h * 0.3, y + h * 0.4, h * 0.6, h * 0.2); break;
    case "tr": g.fillStyle = "#E30A17"; g.fillRect(x, y, w, h); g.fillStyle = "#fff"; g.beginPath(); g.arc(x + w * 0.36, y + h / 2, h * 0.28, 0, TAU); g.fill(); g.fillStyle = "#E30A17"; g.beginPath(); g.arc(x + w * 0.42, y + h / 2, h * 0.22, 0, TAU); g.fill(); g.fillStyle = "#fff"; { const st = (cx, cy, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }; st(x + w * 0.6, y + h / 2, h * 0.12); } break;
    case "ma": g.fillStyle = "#C1272D"; g.fillRect(x, y, w, h); g.strokeStyle = "#006233"; g.lineWidth = h * 0.05; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; const px = x + w / 2 + Math.cos(a) * h * 0.3, py = y + h / 2 + Math.sin(a) * h * 0.3; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); g.stroke(); break;
    case "is": g.fillStyle = "#02529C"; g.fillRect(x, y, w, h); g.fillStyle = "#fff"; g.fillRect(x + w * 0.28, y, w * 0.16, h); g.fillRect(x, y + h * 0.4, w, h * 0.2); g.fillStyle = "#DC1E35"; g.fillRect(x + w * 0.32, y, w * 0.08, h); g.fillRect(x, y + h * 0.45, w, h * 0.1); break;
    case "sg": band(["#EF3340", "#fff"]); g.fillStyle = "#fff"; g.beginPath(); g.arc(x + w * 0.2, y + h * 0.25, h * 0.16, 0, TAU); g.fill(); g.fillStyle = "#EF3340"; g.beginPath(); g.arc(x + w * 0.25, y + h * 0.25, h * 0.14, 0, TAU); g.fill(); g.fillStyle = "#fff"; for (const [sx2, sy2] of [[0.3, 0.14], [0.36, 0.22], [0.24, 0.22], [0.27, 0.34], [0.33, 0.34]]) { g.beginPath(); g.arc(x + w * sx2, y + h * sy2, h * 0.025, 0, TAU); g.fill(); } break;
    case "pe": band(["#D91023", "#fff", "#D91023"], true); break;
    case "nl": band(["#AE1C28", "#fff", "#21468B"]); break;
    case "aq": g.fillStyle = "#3A7DC9"; g.fillRect(x, y, w, h); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x + w * 0.32, y + h * 0.2); g.quadraticCurveTo(x + w * 0.55, y + h * 0.1, x + w * 0.7, y + h * 0.3); g.quadraticCurveTo(x + w * 0.8, y + h * 0.55, x + w * 0.62, y + h * 0.78); g.quadraticCurveTo(x + w * 0.45, y + h * 0.9, x + w * 0.34, y + h * 0.7); g.quadraticCurveTo(x + w * 0.22, y + h * 0.5, x + w * 0.32, y + h * 0.2); g.closePath(); g.fill(); break;
    case "gl": band(["#fff", "#C8102E"]); g.fillStyle = "#C8102E"; g.beginPath(); g.arc(x + w * 0.36, y + h / 2, h * 0.3, Math.PI, 0); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x + w * 0.36, y + h / 2, h * 0.3, 0, Math.PI); g.fill(); break;
    case "no": case "nordic": g.fillStyle = "#BA0C2F"; g.fillRect(x, y, w, h); g.fillStyle = "#fff"; g.fillRect(x + w * 0.27, y, w * 0.18, h); g.fillRect(x, y + h * 0.37, w, h * 0.26); g.fillStyle = "#00205B"; g.fillRect(x + w * 0.31, y, w * 0.1, h); g.fillRect(x, y + h * 0.44, w, h * 0.12); break;
    case "mc": band(["#CE1126", "#fff"]); break;
    case "es": g.fillStyle = "#AA151B"; g.fillRect(x, y, w, h); g.fillStyle = "#F1BF00"; g.fillRect(x, y + h * 0.25, w, h * 0.5); g.fillStyle = "#AA151B"; g.fillRect(x + w * 0.25, y + h * 0.38, w * 0.08, h * 0.24); break;
    case "gr": for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? "#fff" : "#0D5EAF"; g.fillRect(x, y + h * i / 9, w, h / 9 + 1); } g.fillStyle = "#0D5EAF"; g.fillRect(x, y, w * 0.37, h * 5 / 9); g.fillStyle = "#fff"; g.fillRect(x + w * 0.15, y, w * 0.07, h * 5 / 9); g.fillRect(x, y + h * 2 / 9, w * 0.37, h / 9); break;
    case "ca": g.fillStyle = "#fff"; g.fillRect(x, y, w, h); g.fillStyle = "#D80621"; g.fillRect(x, y, w * 0.25, h); g.fillRect(x + w * 0.75, y, w * 0.25, h); { const cx = x + w / 2, cy = y + h / 2, r = h * 0.32; g.beginPath(); const pts = [[0, -1], [0.18, -0.62], [0.42, -0.72], [0.34, -0.2], [0.8, -0.42], [0.66, -0.08], [0.9, 0.08], [0.42, 0.36], [0.5, 0.52], [0.06, 0.46], [0.06, 1], [-0.06, 1], [-0.06, 0.46], [-0.5, 0.52], [-0.42, 0.36], [-0.9, 0.08], [-0.66, -0.08], [-0.8, -0.42], [-0.34, -0.2], [-0.42, -0.72], [-0.18, -0.62]]; pts.forEach(([px, py], i) => i ? g.lineTo(cx + px * r, cy + py * r) : g.moveTo(cx + px * r, cy + py * r)); g.closePath(); g.fill(); } break;
    case "ae": band(["#00732F", "#fff", "#000"]); g.fillStyle = "#FF0000"; g.fillRect(x, y, w * 0.26, h); break;
    case "cl": band(["#fff", "#D52B1E"]); g.fillStyle = "#0039A6"; g.fillRect(x, y, w * 0.33, h * 0.5); g.fillStyle = "#fff"; { const cx = x + w * 0.165, cy = y + h * 0.25, r = h * 0.14; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); } break;
    case "id": band(["#CE1126", "#fff"]); break;
    case "kr": { g.fillStyle = "#fff"; g.fillRect(x, y, w, h); const cx = x + w / 2, cy = y + h / 2, r = h * 0.25; g.fillStyle = "#CD2E3A"; g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill(); g.fillStyle = "#0047A0"; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill(); g.fillStyle = "#CD2E3A"; g.beginPath(); g.arc(cx - r / 2, cy, r / 2, 0, TAU); g.fill(); g.fillStyle = "#0047A0"; g.beginPath(); g.arc(cx + r / 2, cy, r / 2, 0, TAU); g.fill();
      g.fillStyle = "#000"; for (const [dx, dy, a] of [[-1, -1, 0.6], [1, -1, -0.6], [-1, 1, -0.6], [1, 1, 0.6]]) { g.save(); g.translate(cx + dx * w * 0.3, cy + dy * h * 0.3); g.rotate(a); for (let k = 0; k < 3; k++) g.fillRect(-h * 0.08, -h * 0.07 + k * h * 0.05, h * 0.16, h * 0.03); g.restore(); } break; }
    case "np": { g.fillStyle = "#0b1426"; g.fillRect(x, y, w, h); const L2 = x + w * 0.2, R2 = x + w * 0.72; g.fillStyle = "#003893"; g.beginPath(); g.moveTo(L2, y + h * 0.04); g.lineTo(R2, y + h * 0.48); g.lineTo(L2 + w * 0.2, y + h * 0.48); g.lineTo(R2, y + h * 0.96); g.lineTo(L2, y + h * 0.96); g.closePath(); g.fill(); g.fillStyle = "#DC143C"; g.beginPath(); g.moveTo(L2 + w * 0.03, y + h * 0.1); g.lineTo(R2 - w * 0.07, y + h * 0.45); g.lineTo(L2 + w * 0.18, y + h * 0.52); g.lineTo(R2 - w * 0.07, y + h * 0.92); g.lineTo(L2 + w * 0.03, y + h * 0.92); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(L2 + w * 0.13, y + h * 0.33, h * 0.07, 0, TAU); g.fill(); g.beginPath(); g.arc(L2 + w * 0.13, y + h * 0.72, h * 0.09, 0, TAU); g.fill(); break; }
    case "za": { band(["#E03C31", "#fff", "#001489"]); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.5, y + h * 0.4); g.lineTo(x + w, y + h * 0.4); g.lineTo(x + w, y + h * 0.6); g.lineTo(x + w * 0.5, y + h * 0.6); g.lineTo(x, y + h); g.closePath(); g.fill(); g.fillStyle = "#007749"; g.beginPath(); g.moveTo(x, y + h * 0.08); g.lineTo(x + w * 0.46, y + h * 0.43); g.lineTo(x + w, y + h * 0.43); g.lineTo(x + w, y + h * 0.57); g.lineTo(x + w * 0.46, y + h * 0.57); g.lineTo(x, y + h * 0.92); g.closePath(); g.fill(); g.fillStyle = "#FFB81C"; g.beginPath(); g.moveTo(x, y + h * 0.18); g.lineTo(x + w * 0.3, y + h * 0.5); g.lineTo(x, y + h * 0.82); g.closePath(); g.fill(); g.fillStyle = "#000"; g.beginPath(); g.moveTo(x, y + h * 0.26); g.lineTo(x + w * 0.24, y + h * 0.5); g.lineTo(x, y + h * 0.74); g.closePath(); g.fill(); break; }
    case "nz": g.fillStyle = "#012169"; g.fillRect(x, y, w, h); g.save(); g.beginPath(); g.rect(x, y, w / 2, h / 2); g.clip(); drawFlag(g, "uk", x, y, w / 2, h / 2); g.restore(); for (const [sx, sy, r] of [[0.75, 0.25, 0.07], [0.66, 0.48, 0.07], [0.84, 0.44, 0.06], [0.75, 0.78, 0.08]]) { const cx = x + w * sx, cy = y + h * sy, rr = h * r; for (const [col, k] of [["#fff", 1.3], ["#C8102E", 1]]) { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rr * k * 0.42 : rr * k; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.fill(); } } break;
    case "ar": band(["#74ACDF", "#fff", "#74ACDF"]); g.fillStyle = "#F6B40E"; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.1, 0, TAU); g.fill(); break;
    case "polaris": { g.fillStyle = "#0b1a2e"; g.fillRect(x, y, w, h); g.strokeStyle = "#7fe3ff"; g.lineWidth = h * 0.06; g.lineCap = "round"; const cx = x + w / 2, cy = y + h / 2, r = h * 0.34; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); } g.fillStyle = "#ffd166"; g.beginPath(); g.arc(cx, cy, h * 0.08, 0, TAU); g.fill(); break; }
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
const FACTION = { rory: "polaris", frost: "polaris", pip: "polaris", zara: "polaris", watch: "polaris", kaldera: "villain", scorch: "villain", cinder: "villain", bruno: "bruno",
  minuit: "villain", tick: "villain", tock: "villain", coucou: "villain", tempest: "villain", drizzle: "villain", thunder: "villain", king: "royal", president: "royal" };
const FACTION_BG = { polaris: ["#1d4a7a", "#0a1628"], villain: ["#8a2a10", "#1e0804"], bruno: ["#4a4a6a", "#14141e"], contact: ["#1f6a6a", "#081a1c"], royal: ["#8a6a1a", "#1e1604"] };
export function factionOf(id) { return FACTION[id] || "contact"; }
export function drawPortrait(g, id, x, y, size, talk, t, sweat) {
  const c = CHARS[id]; if (!c) return;
  const f = c.face; const s = size / 100;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = "#0d1118"; rrect(g, 0, 0, 100, 100, 14); g.fill();
  g.save(); rrect(g, 0, 0, 100, 100, 14); g.clip();
  const bg = FACTION_BG[factionOf(id)], grad = g.createRadialGradient(50, 30, 10, 50, 50, 80); grad.addColorStop(0, bg[0]); grad.addColorStop(1, bg[1]);
  g.fillStyle = grad; g.fillRect(0, 0, 100, 100);
  g.globalAlpha = 0.12; g.fillStyle = "#fff"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(12 + i * 17, 14 + (i % 2) * 8, 1.5, 0, TAU); g.fill(); } g.globalAlpha = 1;
  if (f.style === "watch") {
    g.fillStyle = "#101a2a"; g.beginPath(); g.arc(50, 50, 34, 0, TAU); g.fill();
    g.strokeStyle = "#7fe3ff"; g.lineWidth = 3; g.beginPath(); g.arc(50, 50, 30, 0, TAU); g.stroke();
    g.fillStyle = "#7fe3ff"; g.fillRect(48, 28, 4, 24); g.fillRect(48, 48, 16, 4);
    g.restore(); g.restore(); return;
  }
  if (f.style === "cuckoo") {
    // a clockwork cuckoo: brass body, a key in its back, a gear for an eye
    const bob = Math.sin(t * 5) * 2 - talk * 3;
    g.fillStyle = "#6a4a1a"; g.fillRect(44, 70, 12, 30);
    g.fillStyle = "#b8862a"; g.beginPath(); g.ellipse(50, 62 + bob, 24, 20, -0.2, 0, TAU); g.fill();
    g.fillStyle = "#d8a84a"; g.beginPath(); g.ellipse(46, 66 + bob, 14, 11, -0.2, 0, TAU); g.fill();
    g.fillStyle = "#b8862a"; g.beginPath(); g.arc(62, 40 + bob, 15, 0, TAU); g.fill();
    g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(74, 38 + bob); g.lineTo(90 + talk * 4, 36 + bob - talk * 4); g.lineTo(74, 44 + bob); g.closePath(); g.fill(); if (talk > 0.3) { g.beginPath(); g.moveTo(74, 44 + bob); g.lineTo(88, 48 + bob); g.lineTo(74, 46 + bob); g.fill(); }
    g.save(); g.translate(64, 37 + bob); g.rotate(t * 2); g.fillStyle = "#ffd166"; for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.fillRect(-1.5, -7, 3, 3); } g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(0, 0, 2.5, 0, TAU); g.fill(); g.restore();
    g.fillStyle = "#6a4a1a"; g.beginPath(); g.moveTo(26, 60 + bob); g.lineTo(8, 50 + bob); g.lineTo(12, 66 + bob); g.closePath(); g.fill();
    g.save(); g.translate(30, 50 + bob); g.rotate(t * -3); g.strokeStyle = "#c0c8d0"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(-10, -10); g.stroke(); g.beginPath(); g.ellipse(-12, -12, 5, 3, 0.8, 0, TAU); g.stroke(); g.restore();
    g.restore(); g.strokeStyle = "rgba(255,140,60,.7)"; g.lineWidth = 2.5; rrect(g, 0, 0, 100, 100, 14); g.stroke(); g.restore(); return;
  }
  const blink = ((t * 0.7 + id.length) % 4.3) < 0.12;
  const big = f.big ? 1.15 : 1, cx = 50, cy = 56, hc = f.hatColor || { bruno: "#2a2a30", tenzing: "#c0392b", lucia: "#2a4a6a" }[id] || f.clothes;
  // hair and hoods behind the head
  g.fillStyle = f.hair;
  if (f.style === "long") { g.beginPath(); g.ellipse(cx, cy + 6, 30 * big, 40, 0, 0, TAU); g.fill(); }
  if (f.style === "curly") { for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; g.beginPath(); g.arc(cx + Math.cos(a) * 27, cy - 6 + Math.sin(a) * 27, 10, 0, TAU); g.fill(); } }
  if (f.style === "ponytail") { g.beginPath(); g.ellipse(cx + 26, cy + 14, 8, 22, -0.3, 0, TAU); g.fill(); }
  if (f.style === "puffs") { for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 24, cy - 24, 14, 0, TAU); g.fill(); } }
  if (f.style === "braids") { for (const sx of [-1, 1]) { for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(cx + sx * (24 + i * 1.5), cy + 4 + i * 9, 6, 6, 0, 0, TAU); g.fill(); } g.fillStyle = "#c0392b"; g.fillRect(cx + sx * 31 - 4, cy + 46, 8, 4); g.fillStyle = f.hair; } }
  if (f.style === "boater" || f.style === "beret") { g.beginPath(); g.ellipse(cx, cy + 4, 28, 30, 0, 0, TAU); g.fill(); }
  if (f.style === "furhood") { g.fillStyle = hc; g.beginPath(); g.ellipse(cx, cy + 2, 38, 42, 0, 0, TAU); g.fill(); g.fillStyle = "#f0e8d8"; g.beginPath(); g.ellipse(cx, cy + 2, 32, 36, 0, 0, TAU); g.fill(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * 32, cy + 2 + Math.sin(a) * 36, 4, 0, TAU); g.fill(); } }
  if (f.accessory === "cape") { g.fillStyle = "#1a1a1e"; g.beginPath(); g.moveTo(10, 100); g.lineTo(18, 64); g.lineTo(cx, 80); g.lineTo(82, 64); g.lineTo(90, 100); g.closePath(); g.fill(); g.fillStyle = "#e05a10"; g.beginPath(); g.moveTo(18, 64); g.lineTo(14, 44); g.lineTo(34, 70); g.closePath(); g.moveTo(82, 64); g.lineTo(86, 44); g.lineTo(66, 70); g.closePath(); g.fill(); }
  if (f.accessory === "skateboard") { g.save(); g.translate(80, 70); g.rotate(0.35); g.fillStyle = "#e03a2a"; rrect(g, -6, -30, 12, 60, 6); g.fill(); g.fillStyle = "#222"; g.beginPath(); g.arc(-6, -18, 3, 0, TAU); g.arc(-6, 18, 3, 0, TAU); g.fill(); g.restore(); }
  // shoulders: clothes with a little shading
  const cg = g.createLinearGradient(0, 66, 0, 100); cg.addColorStop(0, f.clothes); cg.addColorStop(1, "rgba(0,0,0,.35)");
  g.fillStyle = f.clothes; g.beginPath(); g.moveTo(8, 100); g.quadraticCurveTo(50, 62, 92, 100); g.closePath(); g.fill(); g.fillStyle = cg; g.fill();
  if (f.stripes) { g.fillStyle = "#fff"; for (let i = 0; i < 4; i++) g.fillRect(10, 84 + i * 6, 80, 3); }
  if (f.tartan) { g.save(); g.beginPath(); g.moveTo(8, 100); g.quadraticCurveTo(50, 62, 92, 100); g.closePath(); g.clip(); g.fillStyle = "rgba(200,40,40,.45)"; for (let i = 0; i < 6; i++) { g.fillRect(8 + i * 16, 60, 5, 40); g.fillRect(0, 72 + i * 7, 100, 3); } g.fillStyle = "rgba(255,210,80,.35)"; for (let i = 0; i < 6; i++) g.fillRect(14 + i * 16, 60, 1.5, 40); g.restore(); }
  if (f.accessory === "sash") { g.fillStyle = "#2a5ab0"; g.beginPath(); g.moveTo(24, 82); g.lineTo(34, 76); g.lineTo(80, 100); g.lineTo(66, 100); g.closePath(); g.fill(); drawSymbol(g, "star", 38, 88, 6, "#ffd166"); g.fillStyle = "#e8e8e8"; g.beginPath(); g.moveTo(cx - 8, 76); g.lineTo(cx, 86); g.lineTo(cx + 8, 76); g.fill(); }
  if (f.accessory === "flagpin") { g.fillStyle = "#f4f4f4"; g.beginPath(); g.moveTo(cx - 9, 76); g.lineTo(cx, 90); g.lineTo(cx + 9, 76); g.fill(); g.fillStyle = "#b0202a"; g.beginPath(); g.moveTo(cx - 3, 80); g.lineTo(cx + 3, 80); g.lineTo(cx + 4, 100); g.lineTo(cx - 4, 100); g.closePath(); g.fill(); drawFlag(g, "us", cx - 30, 84, 12, 8); }
  if (f.accessory === "labcoat") { g.fillStyle = "#f4f4f4"; g.beginPath(); g.moveTo(14, 100); g.lineTo(cx - 10, 76); g.lineTo(cx - 4, 100); g.closePath(); g.moveTo(86, 100); g.lineTo(cx + 10, 76); g.lineTo(cx + 4, 100); g.closePath(); g.fill(); g.fillStyle = "#7fe3ff"; g.fillRect(cx - 3, 84, 6, 16); }
  if (f.accessory === "harness") { g.strokeStyle = "#f0c020"; g.lineWidth = 5; g.beginPath(); g.moveTo(26, 100); g.lineTo(cx - 12, 74); g.moveTo(74, 100); g.lineTo(cx + 12, 74); g.stroke(); }
  if (f.accessory === "flames") { g.fillStyle = "#ff9a2a"; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 36, 100); g.quadraticCurveTo(cx + sx * 30, 86, cx + sx * 40, 78); g.quadraticCurveTo(cx + sx * 26, 86, cx + sx * 22, 100); g.fill(); } }
  g.fillStyle = f.skin; g.fillRect(cx - 8, cy + 18, 16, 14);
  // the head, lit from above
  const hg = g.createRadialGradient(cx - 6, cy - 10, 4, cx, cy, 30); hg.addColorStop(0, f.skin); hg.addColorStop(1, f.skin);
  g.fillStyle = hg; g.beginPath(); g.ellipse(cx, cy, 24 * big, 27 * big, 0, 0, TAU); g.fill();
  g.fillStyle = "rgba(0,0,0,.08)"; g.beginPath(); g.ellipse(cx + 8, cy + 6, 16 * big, 20 * big, 0, 0, TAU); g.fill();
  g.fillStyle = f.skin; g.beginPath(); g.arc(cx - 24 * big, cy + 2, 5, 0, TAU); g.arc(cx + 24 * big, cy + 2, 5, 0, TAU); g.fill();
  g.fillStyle = "rgba(255,120,120,.18)"; g.beginPath(); g.arc(cx - 14, cy + 8, 5, 0, TAU); g.arc(cx + 14, cy + 8, 5, 0, TAU); g.fill();
  // hair on top, and hats
  g.fillStyle = f.hair;
  switch (f.style) {
    case "short": g.beginPath(); g.ellipse(cx, cy - 16, 25, 14, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.ellipse(cx - 8, cy - 20, 12, 7, -0.4, 0, TAU); g.fill(); break;
    case "sleek": g.beginPath(); g.ellipse(cx, cy - 14, 26, 16, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 26, cy - 14, 5, 18); g.fillRect(cx + 21, cy - 14, 5, 18); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 14, cy - 26); g.quadraticCurveTo(cx, cy - 30, cx + 16, cy - 22); g.stroke(); break;
    case "bun": g.beginPath(); g.ellipse(cx, cy - 16, 25, 13, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.arc(cx, cy - 30, 9, 0, TAU); g.fill(); break;
    case "long": case "ponytail": g.beginPath(); g.ellipse(cx, cy - 16, 25, 14, 0, Math.PI, TAU); g.fill(); break;
    case "curly": g.beginPath(); g.ellipse(cx, cy - 18, 26, 14, 0, Math.PI, TAU); g.fill(); break;
    case "puffs": g.beginPath(); g.ellipse(cx, cy - 16, 25, 13, 0, Math.PI, TAU); g.fill(); break;
    case "swept": g.beginPath(); g.ellipse(cx, cy - 16, 25, 14, 0, Math.PI, TAU); g.fill(); g.beginPath(); g.moveTo(cx - 24, cy - 14); g.quadraticCurveTo(cx, cy - 36, cx + 26, cy - 8); g.lineTo(cx + 12, cy - 12); g.closePath(); g.fill(); break;
    case "messy": g.beginPath(); g.ellipse(cx, cy - 16, 26, 14, 0, Math.PI, TAU); g.fill(); for (let i = 0; i < 7; i++) { const a = Math.PI * 1.1 + i * 0.14 * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * 20, cy - 14 + Math.sin(a) * 12); g.lineTo(cx + Math.cos(a) * 34, cy - 14 + Math.sin(a) * 26); g.lineTo(cx + Math.cos(a + 0.2) * 20, cy - 14 + Math.sin(a + 0.2) * 12); g.fill(); } break;
    case "bald": g.beginPath(); g.ellipse(cx - 21, cy - 4, 5, 11, 0, 0, TAU); g.ellipse(cx + 21, cy - 4, 5, 11, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.ellipse(cx - 6, cy - 20, 8, 4, -0.3, 0, TAU); g.fill(); break;
    case "captain": g.fillStyle = f.hair; g.fillRect(cx - 25, cy - 16, 6, 16); g.fillRect(cx + 19, cy - 16, 6, 16); g.fillStyle = "#f4f4f4"; g.beginPath(); g.ellipse(cx, cy - 24, 30, 11, 0, 0, TAU); g.fill(); g.fillStyle = "#10182a"; rrect(g, cx - 27, cy - 21, 54, 8, 3); g.fill(); g.beginPath(); g.ellipse(cx, cy - 12, 22, 5, 0, 0, Math.PI); g.fill(); g.fillStyle = "#ffd166"; g.beginPath(); g.arc(cx, cy - 18, 4, 0, TAU); g.fill(); break;
    case "helmet": { const hm = g.createLinearGradient(0, cy - 40, 0, cy + 20); hm.addColorStop(0, "#e0303a"); hm.addColorStop(1, "#7a0a10"); g.fillStyle = hm; g.beginPath(); g.ellipse(cx, cy - 2, 31, 34, 0, 0, TAU); g.fill(); g.fillStyle = "#ff9a2a"; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 30, cy + 16); g.quadraticCurveTo(cx + sx * 34, cy - 8, cx + sx * 18, cy - 28); g.quadraticCurveTo(cx + sx * 26, cy - 6, cx + sx * 18, cy + 18); g.fill(); } g.fillStyle = "#101014"; rrect(g, cx - 24, cy - 12, 48, 20, 9); g.fill(); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(cx - 18, cy - 9, 18, 3); break; }
    case "beanie": g.fillStyle = hc; g.beginPath(); g.ellipse(cx, cy - 14, 27, 20, 0, Math.PI, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.2)"; for (let i = 0; i < 6; i++) g.fillRect(cx - 20 + i * 8, cy - 30, 3, 14); g.fillStyle = hc; rrect(g, cx - 28, cy - 18, 56, 9, 4); g.fill(); g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(cx - 28, cy - 12, 56, 3); g.fillStyle = "#f4f4f4"; g.beginPath(); g.arc(cx, cy - 36, 6, 0, TAU); g.fill(); break;
    case "cap": g.beginPath(); g.ellipse(cx, cy - 16, 25, 13, 0, Math.PI, TAU); g.fill(); g.fillStyle = hc; g.beginPath(); g.ellipse(cx, cy - 18, 26, 14, 0, Math.PI, TAU); g.fill(); rrect(g, cx - 4, cy - 20, 36, 6, 3); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(cx, cy - 24, 3, 0, TAU); g.fill(); break;
    case "ranger": g.beginPath(); g.ellipse(cx, cy - 14, 25, 12, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#8a6a3a"; g.beginPath(); g.ellipse(cx, cy - 18, 38, 7, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(cx - 18, cy - 18); g.lineTo(cx - 12, cy - 40); g.lineTo(cx, cy - 34); g.lineTo(cx + 12, cy - 40); g.lineTo(cx + 18, cy - 18); g.closePath(); g.fill(); g.fillStyle = "#5a3a1a"; g.fillRect(cx - 18, cy - 22, 36, 4); break;
    case "furhood": g.fillStyle = f.hair; g.beginPath(); g.ellipse(cx, cy - 18, 22, 10, 0, Math.PI, TAU); g.fill(); break;
    case "bowler": g.beginPath(); g.ellipse(cx, cy - 12, 25, 10, 0, Math.PI, TAU); g.fill(); g.fillStyle = hc; g.beginPath(); g.ellipse(cx, cy - 18, 36 * big, 7, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx, cy - 24, 23 * big, 20, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#3a2a2a"; g.fillRect(cx - 23 * big, cy - 24, 46 * big, 5); g.fillStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.ellipse(cx - 8, cy - 34, 7, 4, -0.4, 0, TAU); g.fill(); break;
    case "crown": g.beginPath(); g.ellipse(cx, cy - 14, 25, 13, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 25, cy - 14, 5, 12); g.fillRect(cx + 20, cy - 14, 5, 12);
      { const cg2 = g.createLinearGradient(0, cy - 48, 0, cy - 18); cg2.addColorStop(0, "#fff0a0"); cg2.addColorStop(1, "#c9a015"); g.fillStyle = cg2; g.beginPath(); g.moveTo(cx - 22, cy - 18); g.lineTo(cx - 24, cy - 40); g.lineTo(cx - 12, cy - 30); g.lineTo(cx, cy - 46); g.lineTo(cx + 12, cy - 30); g.lineTo(cx + 24, cy - 40); g.lineTo(cx + 22, cy - 18); g.closePath(); g.fill(); g.fillStyle = "#c0203a"; g.fillRect(cx - 22, cy - 26, 44, 6); for (const [px, pc] of [[-12, "#2a8a4a"], [0, "#2a5ab0"], [12, "#2a8a4a"]]) { g.fillStyle = pc; g.beginPath(); g.arc(cx + px, cy - 23, 2.5, 0, TAU); g.fill(); } g.fillStyle = "#fff"; for (const px of [-24, 0, 24]) { g.beginPath(); g.arc(cx + px, px ? cy - 41 : cy - 47, 2.5, 0, TAU); g.fill(); } } break;
    case "cloudhat": g.beginPath(); g.ellipse(cx, cy - 14, 26, 14, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 26, cy - 14, 6, 26); g.fillRect(cx + 20, cy - 14, 6, 26);
      g.fillStyle = "#8a92a8"; for (const [px, py, pr] of [[-18, -26, 12], [0, -34, 16], [18, -26, 12], [-8, -22, 12], [10, -22, 12]]) { g.beginPath(); g.arc(cx + px, cy + py, pr, 0, TAU); g.fill(); }
      g.fillStyle = "#c8d0e0"; for (const [px, py, pr] of [[-6, -38, 7], [8, -36, 6]]) { g.beginPath(); g.arc(cx + px, cy + py, pr, 0, TAU); g.fill(); }
      g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(cx + 4, cy - 30); g.lineTo(cx - 4, cy - 18); g.lineTo(cx + 2, cy - 18); g.lineTo(cx - 4, cy - 6); g.lineTo(cx + 8, cy - 22); g.lineTo(cx + 2, cy - 22); g.closePath(); g.fill(); break;
    case "beret": g.beginPath(); g.ellipse(cx, cy - 14, 25, 13, 0, Math.PI, TAU); g.fill(); g.fillStyle = hc; g.beginPath(); g.ellipse(cx - 4, cy - 24, 28, 12, -0.15, 0, TAU); g.fill(); g.fillRect(cx - 2, cy - 38, 3, 6); break;
    case "boater": g.beginPath(); g.ellipse(cx, cy - 14, 25, 13, 0, Math.PI, TAU); g.fill(); g.fillStyle = "#e8cf8a"; g.beginPath(); g.ellipse(cx, cy - 20, 38, 7, 0, 0, TAU); g.fill(); g.fillRect(cx - 20, cy - 36, 40, 16); g.beginPath(); g.ellipse(cx, cy - 36, 20, 4, 0, 0, TAU); g.fill(); g.fillStyle = "#c0203a"; g.fillRect(cx - 20, cy - 26, 40, 5); break;
    case "braids": g.beginPath(); g.ellipse(cx, cy - 16, 25, 14, 0, Math.PI, TAU); g.fill(); g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, cy - 30); g.lineTo(cx, cy - 16); g.stroke(); break;
  }
  // eyes
  const ey = cy - 4, ex = 10 * big;
  if (!blink) {
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(cx - ex, ey, 6, 5.5, 0, 0, TAU); g.ellipse(cx + ex, ey, 6, 5.5, 0, 0, TAU); g.fill();
    const look = Math.sin(t * 0.6 + id.length) * 1.2;
    g.fillStyle = f.eyes; g.beginPath(); g.arc(cx - ex + 1 + look, ey, 3.2, 0, TAU); g.arc(cx + ex + 1 + look, ey, 3.2, 0, TAU); g.fill();
    g.fillStyle = "#000"; g.beginPath(); g.arc(cx - ex + 1 + look, ey, 1.5, 0, TAU); g.arc(cx + ex + 1 + look, ey, 1.5, 0, TAU); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(cx - ex + 2.2 + look, ey - 1.4, 1.1, 0, TAU); g.arc(cx + ex + 2.2 + look, ey - 1.4, 1.1, 0, TAU); g.fill();
  } else { g.strokeStyle = "#5a3a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - ex - 6, ey); g.lineTo(cx - ex + 6, ey); g.moveTo(cx + ex - 6, ey); g.lineTo(cx + ex + 6, ey); g.stroke(); }
  if (f.eyepatch) { g.fillStyle = "#101014"; g.beginPath(); g.ellipse(cx + ex, ey, 8, 7, 0, 0, TAU); g.fill(); g.strokeStyle = "#101014"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 24, ey - 10); g.lineTo(cx + ex, ey - 2); g.lineTo(cx + 24, ey + 4); g.stroke(); }
  // brows
  if (f.style !== "helmet") {
    g.strokeStyle = f.hair === "#f4f4f4" ? "#c8c8c8" : f.hair; g.lineWidth = f.brows === "stern" ? 3.5 : 2.5; g.lineCap = "round";
    const st = f.brows === "stern" ? 3 : 0, lift = talk * 1.5;
    g.beginPath(); g.moveTo(cx - ex - 6, ey - 9 - lift); g.lineTo(cx - ex + 6, ey - 9 + st - lift);
    g.moveTo(cx + ex - 6, ey - 9 + st - lift); g.lineTo(cx + ex + 6, ey - 9 - lift); g.stroke();
  }
  // glasses, monocles and goggles
  if (f.glasses === "round") { g.strokeStyle = "#2a1a4a"; g.lineWidth = 2; g.beginPath(); g.arc(cx - ex, ey, 9, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx + ex, ey, 9, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(cx - ex + 9, ey); g.lineTo(cx + ex - 9, ey); g.stroke(); }
  if (f.monocle) { g.strokeStyle = "#ffd166"; g.lineWidth = 2.5; g.beginPath(); g.arc(cx + ex, ey, 8.5, 0, TAU); g.stroke(); g.lineWidth = 1; g.beginPath(); g.moveTo(cx + ex + 6, ey + 6); g.quadraticCurveTo(cx + 30, cy + 20, cx + 26, 96); g.stroke(); }
  if (f.goggles) { g.fillStyle = "#3a3a3a"; g.fillRect(cx - 27, cy - 24, 54, 5); for (const sx of [-1, 1]) { g.fillStyle = "#e0a020"; g.beginPath(); g.arc(cx + sx * 11, cy - 22, 9, 0, TAU); g.fill(); g.fillStyle = "#7fe3ff"; g.beginPath(); g.arc(cx + sx * 11, cy - 22, 6, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(cx + sx * 11 - 2, cy - 24, 2, 0, TAU); g.fill(); } }
  // nose and mouth
  if (f.style !== "helmet") {
    g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, ey + 2); g.lineTo(cx - 3, ey + 11); g.lineTo(cx + 2, ey + 12); g.stroke();
    const my = cy + 13, open = 2 + talk * 9;
    if (f.facial === "bigbeard") { g.fillStyle = f.hair; g.beginPath(); g.moveTo(cx - 25, cy); g.quadraticCurveTo(cx - 30, cy + 40, cx, cy + 46); g.quadraticCurveTo(cx + 30, cy + 40, cx + 25, cy); g.quadraticCurveTo(cx, cy + 14, cx - 25, cy); g.fill(); g.fillStyle = "#e8e8e8"; g.beginPath(); g.ellipse(cx - 7, my - 4, 9, 4, 0.25, 0, TAU); g.ellipse(cx + 7, my - 4, 9, 4, -0.25, 0, TAU); g.fill(); }
    if (f.facial === "beard") { g.fillStyle = f.hair; g.beginPath(); g.ellipse(cx, my + 6, 22, 14, 0, 0, Math.PI); g.fill(); }
    if (f.facial === "goatee") { g.fillStyle = f.hair; g.beginPath(); g.moveTo(cx - 6, my + 5); g.lineTo(cx + 6, my + 5); g.lineTo(cx, my + 16); g.closePath(); g.fill(); g.beginPath(); g.ellipse(cx - 7, my - 4, 8, 2.5, 0.35, 0, TAU); g.ellipse(cx + 7, my - 4, 8, 2.5, -0.35, 0, TAU); g.fill(); }
    if (f.facial === "moustache") { g.fillStyle = f.hair; g.beginPath(); g.ellipse(cx - 6, my - 4, 8, 3.5, 0.2, 0, TAU); g.ellipse(cx + 6, my - 4, 8, 3.5, -0.2, 0, TAU); g.fill(); }
    if (f.facial === "stubble") { g.fillStyle = "rgba(60,40,30,.25)"; g.beginPath(); g.ellipse(cx, my + 4, 20, 12, 0, 0, Math.PI); g.fill(); }
    g.fillStyle = "#6a2a2a"; g.beginPath(); g.ellipse(cx, my, 8, open / 2, 0, 0, TAU); g.fill();
    if (talk > 0.3) { g.fillStyle = "#fff"; g.fillRect(cx - 5, my - open / 2, 10, 2); }
    else { g.strokeStyle = "#6a2a2a"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, my - 6, 9, 0.3 * Math.PI, 0.7 * Math.PI); g.stroke(); }
    if (f.accessory === "pipe") { g.fillStyle = "#5a3a1a"; g.fillRect(cx + 4, my, 14, 3); g.fillRect(cx + 16, my - 6, 6, 9); }
  } else { g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(cx - 10, cy + 12, 20, 2 + talk * 4); }
  // things they carry
  if (f.accessory === "earpiece") { g.fillStyle = "#222"; g.beginPath(); g.arc(cx + 24 * big, cy + 2, 3, 0, TAU); g.fill(); g.strokeStyle = "#222"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + 24, cy + 4); g.quadraticCurveTo(cx + 22, cy + 16, cx + 14, cy + 18); g.stroke(); }
  if (f.accessory === "headset") { g.strokeStyle = "#222"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy - 10, 30, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.fillStyle = "#222"; g.beginPath(); g.arc(cx - 26, cy + 2, 5, 0, TAU); g.fill(); g.fillRect(cx - 26, cy + 2, 3, 16); }
  if (f.accessory === "medal") { g.fillStyle = "#c0392b"; g.fillRect(cx + 14, 80, 8, 8); g.fillStyle = "#ffd166"; g.beginPath(); g.arc(cx + 18, 92, 6, 0, TAU); g.fill(); }
  if (f.accessory === "pencil") { g.fillStyle = "#ffd166"; g.save(); g.translate(cx + 24, cy - 24); g.rotate(-0.6); g.fillRect(-2, -12, 4, 24); g.restore(); }
  if (f.accessory === "scarf") { g.fillStyle = "#c0392b"; rrect(g, cx - 16, cy + 22, 32, 9, 4); g.fill(); g.fillRect(cx + 6, cy + 26, 8, 14); }
  if (f.accessory === "badge") drawSymbol(g, "star", cx - 22, 90, 6, "#ffd166");
  if (f.accessory === "pendant") { g.strokeStyle = "#1a1a1a"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 8, 76); g.lineTo(cx, 88); g.lineTo(cx + 8, 76); g.stroke(); g.fillStyle = "#2a9a6a"; g.beginPath(); g.ellipse(cx, 90, 4, 6, 0, 0, TAU); g.fill(); }
  if (f.accessory === "wrench") { g.fillStyle = "#b0b8c0"; g.save(); g.translate(18, 86); g.rotate(-0.5); g.fillRect(-2, -12, 5, 22); g.beginPath(); g.arc(0.5, -14, 5, 0, TAU); g.fill(); g.restore(); }
  if (f.accessory === "clipboard") { g.fillStyle = "#c89a5a"; rrect(g, 70, 78, 18, 22, 2); g.fill(); g.fillStyle = "#fff"; g.fillRect(72, 82, 14, 16); g.fillStyle = "#888"; for (let i = 0; i < 3; i++) g.fillRect(74, 85 + i * 4, 10, 1.5); }
  if (f.accessory === "penguin") { g.fillStyle = "#15161c"; g.beginPath(); g.ellipse(78, 90, 10, 14, 0, 0, TAU); g.fill(); g.fillStyle = "#f4f4f4"; g.beginPath(); g.ellipse(78, 93, 6, 10, 0, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(75, 82, 2, 0, TAU); g.arc(81, 82, 2, 0, TAU); g.fill(); g.fillStyle = "#ffa000"; g.beginPath(); g.moveTo(76, 86); g.lineTo(80, 86); g.lineTo(78, 89); g.fill(); }
  if (f.accessory === "clockpins") { g.save(); g.translate(cx + 2, cy - 30); for (const [a, l] of [[-0.5, 16], [0.4, 22]]) { g.save(); g.rotate(a); g.fillStyle = "#ffd166"; g.fillRect(-1.2, -l, 2.4, l); g.beginPath(); g.moveTo(-3, -l); g.lineTo(0, -l - 6); g.lineTo(3, -l); g.fill(); g.restore(); } g.restore();
    g.strokeStyle = "#ffd166"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 10, 76); g.lineTo(cx, 86); g.lineTo(cx + 10, 76); g.stroke(); g.fillStyle = "#ffd166"; g.beginPath(); g.arc(cx, 91, 6, 0, TAU); g.fill(); g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(cx, 91, 4.5, 0, TAU); g.fill(); g.strokeStyle = "#1a1a1a"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, 91); g.lineTo(cx, 88); g.moveTo(cx, 91); g.lineTo(cx + 2.5, 92); g.stroke(); }
  if (f.accessory === "pizza") { g.save(); g.translate(78, 84); g.rotate(-0.3); g.fillStyle = "#e8b04a"; g.beginPath(); g.moveTo(-10, -8); g.lineTo(10, -8); g.lineTo(0, 14); g.closePath(); g.fill(); g.fillStyle = "#d0402a"; g.beginPath(); g.moveTo(-8, -5); g.lineTo(8, -5); g.lineTo(0, 11); g.closePath(); g.fill(); g.fillStyle = "#a01a10"; for (const [px, py] of [[-3, -1], [3, 1], [0, 5]]) { g.beginPath(); g.arc(px, py, 1.8, 0, TAU); g.fill(); } g.fillStyle = "#c08a3a"; g.fillRect(-11, -10, 22, 4); g.restore(); }
  if (f.accessory === "puppet") { g.strokeStyle = "#8a5a2a"; g.lineWidth = 3; g.beginPath(); g.moveTo(66, 62); g.lineTo(92, 62); g.moveTo(79, 56); g.lineTo(79, 70); g.stroke(); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 0.8; g.beginPath(); for (const px of [68, 79, 90]) { g.moveTo(px, 62); g.lineTo(px - 2, 84); } g.stroke(); g.fillStyle = "#c0392b"; g.beginPath(); g.arc(77, 84, 5, 0, TAU); g.fill(); g.fillRect(73, 88, 8, 10); }
  if (f.accessory === "owl") { g.fillStyle = "#8a6a4a"; g.beginPath(); g.ellipse(82, 82, 11, 14, 0, 0, TAU); g.fill(); g.fillStyle = "#c8a882"; g.beginPath(); g.ellipse(82, 86, 7, 9, 0, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(78, 76, 4, 0, TAU); g.arc(86, 76, 4, 0, TAU); g.fill(); g.fillStyle = "#e0a020"; g.beginPath(); g.arc(78, 76, 2.4, 0, TAU); g.arc(86, 76, 2.4, 0, TAU); g.fill(); g.fillStyle = "#111"; g.beginPath(); g.arc(78, 76, 1.2, 0, TAU); g.arc(86, 76, 1.2, 0, TAU); g.fill(); g.fillStyle = "#e0a020"; g.beginPath(); g.moveTo(80, 79); g.lineTo(84, 79); g.lineTo(82, 82); g.fill(); g.fillStyle = "#8a6a4a"; g.beginPath(); g.moveTo(73, 70); g.lineTo(75, 64); g.lineTo(78, 70); g.moveTo(86, 70); g.lineTo(89, 64); g.lineTo(91, 70); g.fill(); }
  if (f.accessory === "raven") { g.fillStyle = "#14141a"; g.beginPath(); g.ellipse(80, 78, 10, 7, -0.3, 0, TAU); g.fill(); g.beginPath(); g.arc(88, 70, 5.5, 0, TAU); g.fill(); g.beginPath(); g.moveTo(70, 80); g.lineTo(62, 88); g.lineTo(72, 84); g.fill(); g.fillStyle = "#3a3a44"; g.beginPath(); g.moveTo(92, 69); g.lineTo(99, 71); g.lineTo(92, 73); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(89, 69, 1.3, 0, TAU); g.fill(); }
  if (f.accessory === "umbrella") { g.strokeStyle = "#3a2a1a"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(84, 44); g.lineTo(84, 96); g.arc(80, 96, 4, 0, Math.PI); g.stroke(); g.fillStyle = "#2a3a5a"; g.beginPath(); g.moveTo(64, 46); g.quadraticCurveTo(84, 16, 104, 46); g.closePath(); g.fill(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(84, 26); g.lineTo(76, 46); g.moveTo(84, 26); g.lineTo(92, 46); g.stroke(); }
  if (f.accessory === "trumpet") { g.save(); g.translate(76, 84); g.rotate(-0.4); g.fillStyle = "#e0b030"; g.fillRect(-14, -2, 24, 4); g.beginPath(); g.moveTo(10, -2); g.lineTo(20, -8); g.lineTo(20, 8); g.lineTo(10, 2); g.closePath(); g.fill(); for (let i = 0; i < 3; i++) g.fillRect(-6 + i * 5, -7, 3, 5); g.restore(); }
  if (f.accessory === "sloth") { g.fillStyle = "#9a7a5a"; g.beginPath(); g.ellipse(80, 80, 12, 10, 0, 0, TAU); g.fill(); g.fillStyle = "#e8d8b8"; g.beginPath(); g.ellipse(82, 76, 7, 6, 0, 0, TAU); g.fill(); g.fillStyle = "#3a2a1a"; g.beginPath(); g.ellipse(79, 76, 3, 2, -0.3, 0, TAU); g.ellipse(85, 76, 3, 2, 0.3, 0, TAU); g.fill(); g.fillStyle = "#111"; g.beginPath(); g.arc(82, 79, 1.2, 0, TAU); g.fill(); g.strokeStyle = "#3a2a1a"; g.lineWidth = 1; g.beginPath(); g.arc(82, 79, 3, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); g.strokeStyle = "#9a7a5a"; g.lineWidth = 4; g.beginPath(); g.moveTo(70, 78); g.lineTo(60, 70); g.stroke(); }
  if (sweat || (f.sweaty && talk > 0.3)) { g.fillStyle = "#7ec8ff"; const k = Math.floor(t * 6) % 3; g.beginPath(); g.ellipse(cx - 20, cy - 12 + k * 4, 2.5, 4, 0, 0, TAU); g.ellipse(cx + 22, cy - 8 + ((k + 1) % 3) * 4, 2.5, 4, 0, 0, TAU); g.fill(); }
  g.restore();
  g.strokeStyle = factionOf(id) === "villain" ? "rgba(255,140,60,.7)" : "rgba(127,227,255,.55)"; g.lineWidth = 2.5; rrect(g, 0, 0, 100, 100, 14); g.stroke();
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
    if (!this.active) { this.lb = 0; return; }
    this.lb = Math.min(1, (this.lb || 0) + 0.06);
    if (this.G && this.G.state !== "briefing") { g.fillStyle = "#000"; g.fillRect(0, 0, W, H * 0.07 * this.lb); }
    const [who, txt] = this.lines[this.i];
    const c = CHARS[who];
    const bh = Math.min(H * 0.34, 250 * s), bw = Math.min(W - 40 * s, 1100 * s);
    const bx = (W - bw) / 2, by = H - bh - 18 * s;
    panel(g, bx, by, bw, bh, s, { bg: "rgba(8,12,20,.9)" });
    const ps = bh - 30 * s;
    drawPortrait(g, who, bx + 16 * s, by + 15 * s, ps, this.talk, this.t, false);
    // name plate
    const nx = bx + 16 * s + ps + 18 * s;
    const nw = g.measureText(c.name).width;
    g.font = `800 ${20 * s}px ${FONT}`;
    const plateW = g.measureText(c.name).width + 28 * s;
    g.fillStyle = { polaris: "#1d4a7a", villain: "#a0300e", bruno: "#4a4a6a", contact: "#1f6a5a", royal: "#8a6a1a" }[factionOf(who)];
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
// Real coastlines (land.js), drawn once into a picture and reused. Operation
// Meltdown shows the whole world; the others zoom in on their part of it, with
// longitudes squeezed by the cosine of the latitude so nothing looks stretched.
// one colour of route per act
const ACT_COLORS = ["#ffd166", "#ff9f43", "#7fdcff"];
let RING_INFO = null;
function ringInfo() {
  if (RING_INFO) return RING_INFO;
  RING_INFO = landRings().map(r => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, sx = 0, sy = 0;
    for (const [x, y] of r) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); sx += x; sy += y; }
    const mx = sx / r.length, my = sy / r.length;
    // Antarctica, Greenland and the Arctic islands are ice
    const ice = y1 < -55 || (my > 59 && mx > -75 && mx < -10) || my > 74;
    return { r, x0, x1, y0, y1, ice };
  });
  return RING_INFO;
}
export class WorldMap {
  constructor(game) { this.G = game; this.t = 0; this.flight = null; this.pulse = 0; this.view = null; this.cache = null; }
  project(lon, lat, r) {
    const v = this.view;
    if (!v) return [r.x + (lon + 180) / 360 * r.w, r.y + (90 - lat) / 180 * r.h];
    const kx = r.w / v.span, ky = kx / Math.cos(v.lat * Math.PI / 180);
    return [r.x + r.w / 2 + (lon - v.lon) * kx, r.y + r.h / 2 - (lat - v.lat) * ky];
  }
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
  // the sea, the grid and the land, drawn into a picture of their own
  land(r, s) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), key = [r.x, r.y, r.w, r.h, dpr, JSON.stringify(this.view)].join();
    if (this.cache && this.cache.key === key) return this.cache.canvas;
    const cv = this.cache && this.cache.canvas || document.createElement("canvas");
    cv.width = Math.ceil(r.w * dpr); cv.height = Math.ceil(r.h * dpr);
    const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, -r.x * dpr, -r.y * dpr);
    const grad = g.createLinearGradient(0, r.y, 0, r.y + r.h); grad.addColorStop(0, "#0c2742"); grad.addColorStop(1, "#061526");
    g.fillStyle = grad; g.fillRect(r.x, r.y, r.w, r.h);
    // grid
    const step = this.view ? (this.view.span > 80 ? 10 : 5) : 30;
    g.strokeStyle = "rgba(120,180,230,.09)"; g.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += step) { const [x] = this.project(lon, 0, r); if (x < r.x || x > r.x + r.w) continue; g.beginPath(); g.moveTo(x, r.y); g.lineTo(x, r.y + r.h); g.stroke(); }
    for (let lat = -90; lat <= 90; lat += step) { const [, y] = this.project(0, lat, r); if (y < r.y || y > r.y + r.h) continue; g.beginPath(); g.moveTo(r.x, y); g.lineTo(r.x + r.w, y); g.stroke(); }
    // what is on screen, in degrees, to skip the rest of the world
    const tl = this.unproject(r.x, r.y, r), br = this.unproject(r.x + r.w, r.y + r.h, r);
    const vis = ringInfo().filter(q => q.x1 >= tl[0] - 1 && q.x0 <= br[0] + 1 && q.y1 >= br[1] - 1 && q.y0 <= tl[1] + 1);
    // a soft glow of shallow water round the coasts, then the land, then a coastline
    const trace = q => { g.beginPath(); q.r.forEach(([lon, lat], i) => { const [x, y] = this.project(lon, lat, r); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.lineJoin = "round";
    g.strokeStyle = "rgba(90,180,220,.18)"; g.lineWidth = (this.view ? 7 : 4) * s; for (const q of vis) { trace(q); g.stroke(); }
    for (const q of vis) {
      trace(q);
      const [, ya] = this.project(0, q.y1, r), [, yb] = this.project(0, q.y0, r);
      const lg = g.createLinearGradient(0, ya, 0, yb);
      if (q.ice) { lg.addColorStop(0, "#e8f4fb"); lg.addColorStop(1, "#b9d8ea"); } else { lg.addColorStop(0, "#2f6a4a"); lg.addColorStop(1, "#1d4a36"); }
      g.fillStyle = lg; g.fill();
      g.strokeStyle = q.ice ? "rgba(255,255,255,.7)" : "rgba(160,230,190,.45)"; g.lineWidth = 1.1; g.stroke();
    }
    this.cache = { key, canvas: cv };
    return cv;
  }
  unproject(x, y, r) {
    const v = this.view;
    if (!v) return [(x - r.x) / r.w * 360 - 180, 90 - (y - r.y) / r.h * 180];
    const kx = r.w / v.span, ky = kx / Math.cos(v.lat * Math.PI / 180);
    return [v.lon + (x - r.x - r.w / 2) / kx, v.lat - (y - r.y - r.h / 2) / ky];
  }
  draw(g, W, H, s, progress, act, view) {
    act = act || 1; this.view = view || null;
    const r = this.rect(W, H, s);
    g.fillStyle = "#08131f"; g.fillRect(0, 0, W, H);
    g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
    g.drawImage(this.land(r, s), r.x, r.y, r.w, r.h);
    // routes: one chain per act, each act carrying on from where the last one ended
    const pts = COUNTRIES.map(c => { const [x, y] = this.project(c.lon, c.lat, r), d = c.dot || [0, 0]; return [x + d[0] * s, y + d[1] * s]; });
    g.setLineDash([6 * s, 6 * s]); g.lineWidth = 2 * s;
    for (const a of ACTS) {
      if (a.n > act) continue;
      const chain = a.countries.map(id => COUNTRIES.findIndex(c => c.id === id)); if (a.n > 1) chain.unshift(chain[0] - 1);
      for (let k = 0; k < chain.length - 1; k++) {
        const i = chain[k], j = chain[k + 1];
        g.strokeStyle = j <= progress ? (ACT_COLORS[a.n - 1] || "#ffd166") : "rgba(255,255,255,.18)";
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
      const above = c.pinBelow ? false : this.view ? y - 52 * s > r.y : (c.lat > 0 || y > r.y + r.h * 0.82), fx = x + (c.pinDx || 0) * s;
      drawFlag(g, c.flag, fx - 14 * s, above ? y - 34 * s : y + 12 * s, 28 * s, 19 * s);
      if (cur || done) text(g, c.city, fx, above ? y - 44 * s : y + 42 * s, 13 * s, done ? "#9be7b6" : "#ffd166", "center", 700);
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
// a row of three stars, the earned ones gold
export function drawStars(g, cx, cy, size, earned, t) {
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * size * 1.5, lit = i < earned;
    const pop = t !== undefined && lit ? clamp((t - 0.25 - i * 0.22) * 6, 0, 1) : 1;
    if (pop <= 0) continue;
    const r = size * 0.5 * (pop < 1 ? 1 + (1 - pop) * 1.6 : 1);
    g.save(); g.translate(x, cy); g.globalAlpha = pop;
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a2 = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; g[k ? "lineTo" : "moveTo"](Math.cos(a2) * rr, Math.sin(a2) * rr); }
    g.closePath();
    g.fillStyle = lit ? "#ffd166" : "rgba(255,255,255,.13)"; g.fill();
    g.strokeStyle = lit ? "#b8860b" : "rgba(255,255,255,.22)"; g.lineWidth = Math.max(1, size * 0.07); g.stroke();
    g.restore();
  }
}

export function drawStamp(g, W, H, s, k, title, body, t, stars, record) {
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
    if (stars) {
      drawStars(g, W / 2, py + ph + 40 * s, 34 * s, stars, t);
      if (record && t > 1.4) text(g, "NEW BEST", W / 2, py + ph + 78 * s, 14 * s, "#2ecc71", "center", 900, MONO);
    }
    if (Math.sin(t * 5) > 0) text(g, "tap to continue", W / 2, py + ph + (stars ? 104 : 36) * s, 18 * s, "#ffd166", "center", 700);
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
// the bridge of the Narwhal: portholes onto the deep, a navigation table and
// a big screen that shows what the act is about
export function drawBriefingRoom(g, W, H, s, t, act, op) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0e1a26"); bg.addColorStop(1, "#060b12"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // curved hull ribs
  for (let i = 0; i < 9; i++) { const x = (i + 0.5) * W / 9; g.fillStyle = "rgba(127,227,255,.05)"; g.fillRect(x - 6 * s, 0, 12 * s, H * 0.64); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x + 6 * s, 0, 3 * s, H * 0.64); for (let k = 0; k < 8; k++) { g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(x, 20 * s + k * H * 0.08, 2 * s, 0, TAU); g.fill(); } }
  // portholes onto the sea, with bubbles and fish going past
  for (const px of [0.1, 0.9]) {
    const cx = W * px, cy = H * 0.3, R = Math.min(W, H) * 0.11;
    g.fillStyle = "#3a4a5a"; g.beginPath(); g.arc(cx, cy, R * 1.18, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    const sea = g.createLinearGradient(0, cy - R, 0, cy + R); sea.addColorStop(0, "#0e5a8a"); sea.addColorStop(1, "#031a2e"); g.fillStyle = sea; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    for (let i = 0; i < 8; i++) { const by = cy + R - ((t * 30 * s + i * 37 * s) % (R * 2)), bx = cx - R * 0.6 + (i * 29 % 100) / 100 * R * 1.2 + Math.sin(t * 2 + i) * 4 * s; g.strokeStyle = "rgba(200,240,255,.6)"; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, (2 + i % 3) * s, 0, TAU); g.stroke(); }
    const fx = cx - R * 1.6 + ((t * 20 * s + px * 300) % (R * 3.2)); g.fillStyle = "rgba(255,200,80,.7)"; g.beginPath(); g.ellipse(fx, cy + R * 0.2, 9 * s, 4 * s, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(fx - 8 * s, cy + R * 0.2); g.lineTo(fx - 14 * s, cy + R * 0.2 - 4 * s); g.lineTo(fx - 14 * s, cy + R * 0.2 + 4 * s); g.fill();
    g.restore();
    g.strokeStyle = "#8a9aaa"; g.lineWidth = 6 * s; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; g.fillStyle = "#c0c8d0"; g.beginPath(); g.arc(cx + Math.cos(a) * R * 1.1, cy + Math.sin(a) * R * 1.1, 3 * s, 0, TAU); g.fill(); }
  }
  // the big screen
  const sw = W * 0.44, sh = sw * 0.52, sx = W / 2 - sw / 2, sy = H * 0.07;
  g.fillStyle = "#050a10"; rrect(g, sx - 10 * s, sy - 10 * s, sw + 20 * s, sh + 20 * s, 10 * s); g.fill();
  const sg = g.createLinearGradient(0, sy, 0, sy + sh); sg.addColorStop(0, "#0f2a3f"); sg.addColorStop(1, "#06121c"); g.fillStyle = sg; g.fillRect(sx, sy, sw, sh);
  g.strokeStyle = "rgba(127,227,255,.12)"; g.lineWidth = 1; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(sx + sw * i / 8, sy); g.lineTo(sx + sw * i / 8, sy + sh); g.stroke(); } for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(sx, sy + sh * i / 5); g.lineTo(sx + sw, sy + sh * i / 5); g.stroke(); }
  const a = act || 1;
  if (op === "midnight" || op === "hurricane") briefingScreen(g, sx, sy, sw, sh, s, t, a, op);
  else {
  const a = act || 1;
    if (a === 1) {
      const cx = sx + sw * 0.28, cy = sy + sh * 0.5, r = sh * 0.3;
      g.fillStyle = "#1a1a1e"; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); g.strokeStyle = "#ff8a2a"; g.lineWidth = 3 * s; g.stroke();
      g.fillStyle = "#ff6a1a"; g.beginPath(); g.moveTo(cx, cy - r * 0.8); g.bezierCurveTo(cx + r * 0.75, cy - r * 0.1, cx + r * 0.55, cy + r * 0.8, cx, cy + r * 0.8); g.bezierCurveTo(cx - r * 0.55, cy + r * 0.8, cx - r * 0.75, cy - r * 0.1, cx, cy - r * 0.8); g.fill();
      text(g, "KALDERA HEATING", sx + sw * 0.52, sy + sh * 0.36, sh * 0.1, "#ff9a4a", "left", 900, MONO);
      text(g, "Keeping the world toasty", sx + sw * 0.52, sy + sh * 0.52, sh * 0.065, "#c8d0e0", "left", 700, MONO);
      text(g, "since 1896", sx + sw * 0.52, sy + sh * 0.62, sh * 0.065, "#c8d0e0", "left", 700, MONO);
    } else {
      // a map: the pieces of the engines in Act Two, Antarctica and six red dots in Act Three
      const cx = sx + sw / 2, cy = sy + sh * 0.55;
      if (a === 2) { const pts = [[0.2, 0.35], [0.28, 0.72], [0.62, 0.3], [0.68, 0.55], [0.8, 0.38], [0.52, 0.78]]; g.strokeStyle = "rgba(255,120,40,.5)"; g.lineWidth = 2 * s; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(sx + sw * px, sy + sh * py) : g.moveTo(sx + sw * px, sy + sh * py)); g.stroke(); for (const [px, py] of pts) { g.fillStyle = Math.sin(t * 4 + px * 9) > 0 ? "#ff6a1a" : "#ffb347"; g.beginPath(); g.arc(sx + sw * px, sy + sh * py, 6 * s, 0, TAU); g.fill(); } text(g, "SIX PIECES. SIX PLACES.", cx, sy + sh * 0.12, sh * 0.075, "#ff9a4a", "center", 900, MONO); }
      else { g.fillStyle = "#dff2ff"; g.beginPath(); for (let i = 0; i < 24; i++) { const an = i / 24 * TAU, rr = sh * (0.3 + Math.sin(i * 1.7) * 0.05 + (i === 5 ? 0.12 : 0)); g.lineTo(cx + Math.cos(an) * rr * 1.2, cy + Math.sin(an) * rr * 0.8); } g.closePath(); g.fill();
        for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + 0.4, px = cx + Math.cos(an) * sh * 0.2, py = cy + Math.sin(an) * sh * 0.12; g.fillStyle = "#ff3b1a"; g.beginPath(); g.arc(px, py, (5 + Math.sin(t * 5 + i) * 2) * s, 0, TAU); g.fill(); }
        text(g, "ANTARCTICA", cx, sy + sh * 0.12, sh * 0.08, "#7fe3ff", "center", 900, MONO); }
    }
  }
  text(g, "TOP SECRET" + (Math.sin(t * 4) > 0 ? " ▮" : "  "), sx + 12 * s, sy + sh - 14 * s, sh * 0.06, "#ff5a5a", "left", 800, MONO);
  // the navigation table, glowing
  const ty = H * 0.72; g.fillStyle = "#1a2a3a"; g.beginPath(); g.ellipse(W / 2, ty + 12 * s, W * 0.34, H * 0.1, 0, 0, TAU); g.fill();
  const tg = g.createRadialGradient(W / 2, ty, 10, W / 2, ty, W * 0.34); tg.addColorStop(0, "rgba(127,227,255,.35)"); tg.addColorStop(1, "rgba(127,227,255,.05)"); g.fillStyle = tg; g.beginPath(); g.ellipse(W / 2, ty, W * 0.34, H * 0.1, 0, 0, TAU); g.fill();
  g.strokeStyle = "rgba(127,227,255,.4)"; g.lineWidth = 1.5; for (let k = 1; k <= 3; k++) { g.beginPath(); g.ellipse(W / 2, ty, W * 0.1 * k, H * 0.03 * k, 0, 0, TAU); g.stroke(); }
  const sweep = t * 1.2; g.strokeStyle = "rgba(127,227,255,.7)"; g.beginPath(); g.moveTo(W / 2, ty); g.lineTo(W / 2 + Math.cos(sweep) * W * 0.3, ty + Math.sin(sweep) * H * 0.09); g.stroke();
  // the POLARIS emblem and a cup of cocoa for the Admiral
  g.fillStyle = "rgba(127,227,255,.08)"; g.beginPath(); g.arc(W * 0.5, H * 0.52, 34 * s, 0, TAU); g.fill();
  text(g, "POLARIS", W * 0.5, H * 0.52 + 1, 15 * s, "rgba(127,227,255,.55)", "center", 900, MONO);
  g.fillStyle = "#f4f4f0"; rrect(g, W * 0.66, ty - 22 * s, 20 * s, 22 * s, 4 * s); g.fill(); g.strokeStyle = "#f4f4f0"; g.lineWidth = 3 * s; g.beginPath(); g.arc(W * 0.66 + 22 * s, ty - 12 * s, 6 * s, -1.2, 1.2); g.stroke();
  for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(255,255,255,${0.25 - i * 0.07})`; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(W * 0.66 + (6 + i * 4) * s, ty - 26 * s); g.quadraticCurveTo(W * 0.66 + (2 + i * 4) * s + Math.sin(t * 2 + i) * 4 * s, ty - 36 * s, W * 0.66 + (8 + i * 4) * s, ty - 46 * s); g.stroke(); }
}
// the poster: a sheet of ice melting over a sea of fire, an Inferno Engine
// in the middle, and the aurora above
export function drawTitleBackdrop(g, W, H, s, t, op) {
  if (op === "midnight") return backdropMidnight(g, W, H, s, t);
  if (op === "hurricane") return backdropHurricane(g, W, H, s, t);
  backdropMeltdown(g, W, H, s, t);
}
function backdropMeltdown(g, W, H, s, t) {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#030712"); sky.addColorStop(0.55, "#0b1f3a"); sky.addColorStop(1, "#1a0a06");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) { const x = (i * 97.13) % W, y = (i * 53.7) % (H * 0.5); g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))})`; g.fillRect(x, y, 1.5 * s, 1.5 * s); }
  // aurora curtains
  for (let k = 0; k < 3; k++) { g.save(); g.globalAlpha = 0.22; const ag = g.createLinearGradient(0, H * 0.05, 0, H * 0.4); ag.addColorStop(0, "rgba(120,80,255,0)"); ag.addColorStop(0.5, k === 1 ? "#40e0a0" : "#3ad0ff"); ag.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = ag; g.beginPath(); g.moveTo(0, H * 0.4); for (let x = 0; x <= W; x += 20 * s) g.lineTo(x, H * (0.12 + k * 0.05) + Math.sin(x / (140 * s) + t * 0.4 + k) * 30 * s); g.lineTo(W, H * 0.4); g.closePath(); g.fill(); g.restore(); }
  // the sea of fire beneath
  const base = H * 0.72, lava = g.createLinearGradient(0, base, 0, H); lava.addColorStop(0, "#ff7a1a"); lava.addColorStop(0.4, "#c02a08"); lava.addColorStop(1, "#300802");
  g.fillStyle = lava; g.fillRect(0, base, W, H - base);
  for (let i = 0; i < 14; i++) { const x = ((i * 131 + t * 18) % (W + 100)) - 50, y = base + 20 * s + (i % 4) * 22 * s; g.fillStyle = "rgba(255,210,120,.35)"; g.beginPath(); g.ellipse(x, y, 40 * s, 5 * s, 0, 0, TAU); g.fill(); }
  // the ice sheet, cracked, with drips falling into the fire
  g.fillStyle = "#dff2ff"; g.beginPath(); g.moveTo(0, base - 40 * s); for (let x = 0; x <= W; x += 30 * s) g.lineTo(x, base - 60 * s - Math.abs(Math.sin(x / (170 * s))) * 50 * s - (x % (90 * s) < 30 * s ? 18 * s : 0)); g.lineTo(W, base + 6 * s); g.lineTo(0, base + 6 * s); g.closePath(); g.fill();
  g.fillStyle = "#9fd8f4"; g.fillRect(0, base - 8 * s, W, 14 * s);
  g.strokeStyle = "#ff8a2a"; g.lineWidth = 3 * s; g.shadowColor = "#ff6a1a"; g.shadowBlur = 12 * s;
  for (let i = 0; i < 6; i++) { const x0 = W * (0.08 + i * 0.17); g.beginPath(); g.moveTo(x0, base + 4 * s); g.lineTo(x0 + 10 * s, base - 20 * s); g.lineTo(x0 - 6 * s, base - 38 * s); g.lineTo(x0 + 14 * s, base - 60 * s); g.stroke(); }
  g.shadowBlur = 0;
  for (let i = 0; i < 12; i++) { const x = W * ((i * 0.083 + 0.04) % 1), k = ((t * 0.6 + i * 0.37) % 1), y = base + 6 * s + k * 50 * s; g.fillStyle = `rgba(160,220,255,${1 - k})`; g.beginPath(); g.ellipse(x, y, 3 * s, 5 * s, 0, 0, TAU); g.fill(); }
  // the Inferno Engine
  const ex = W / 2, eh = H * 0.46;
  const eg = g.createLinearGradient(ex - 30 * s, 0, ex + 30 * s, 0); eg.addColorStop(0, "#15151a"); eg.addColorStop(0.5, "#3a3a44"); eg.addColorStop(1, "#15151a");
  g.fillStyle = eg; g.beginPath(); g.moveTo(ex - 22 * s, base - eh); g.lineTo(ex + 22 * s, base - eh); g.lineTo(ex + 40 * s, base); g.lineTo(ex - 40 * s, base); g.closePath(); g.fill();
  for (let i = 0; i < 5; i++) { const y = base - eh * (0.15 + i * 0.18), w2 = (44 - i * 4) * s; g.strokeStyle = `rgba(255,${130 + i * 12},40,${0.7 + 0.3 * Math.sin(t * 3 + i)})`; g.lineWidth = 5 * s; g.beginPath(); g.ellipse(ex, y, w2, 7 * s, 0, 0, TAU); g.stroke(); }
  const glow2 = g.createRadialGradient(ex, base, 10, ex, base, W * 0.4); glow2.addColorStop(0, "rgba(255,120,30,.55)"); glow2.addColorStop(1, "rgba(255,120,30,0)"); g.fillStyle = glow2; g.fillRect(0, H * 0.3, W, H * 0.7);
  // penguins watching, unimpressed
  for (let i = 0; i < 5; i++) { const px = W * (0.12 + i * 0.045), py = base - 58 * s - (i % 2) * 4 * s; g.fillStyle = "#101014"; g.beginPath(); g.ellipse(px, py, 7 * s, 12 * s, 0, 0, TAU); g.fill(); g.fillStyle = "#f4f4f4"; g.beginPath(); g.ellipse(px + 1.5 * s, py + 2 * s, 4 * s, 8 * s, 0, 0, TAU); g.fill(); g.fillStyle = "#ffa000"; g.fillRect(px + 5 * s, py - 7 * s, 4 * s, 2 * s); }
  // steam off the melt
  for (let i = 0; i < 8; i++) { const k = (t * 0.15 + i / 8) % 1, x = W * (0.1 + i * 0.11) + Math.sin(t + i) * 10 * s, y = base - 60 * s - k * H * 0.3; g.fillStyle = `rgba(255,255,255,${0.12 * (1 - k)})`; g.beginPath(); g.arc(x, y, (20 + k * 40) * s, 0, TAU); g.fill(); }
}
// the game's name: AGENT RORY, and under it the operation's own word, with a
// little melt dripping off MELTDOWN, a clock ticking by MIDNIGHT, and rain and
// lightning on HURRICANE
export function drawLogo(g, cx, cy, size, t, op) {
  const s1 = size, s2 = size * 1.35;
  g.save();
  g.font = `900 ${s1}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = size * 0.2;
  const ig = g.createLinearGradient(0, cy - s1, 0, cy); ig.addColorStop(0, "#ffffff"); ig.addColorStop(1, "#9fe0ff"); g.fillStyle = ig;
  if (op === "none") { g.font = `900 ${s1 * 1.4}px ${FONT}`; g.fillText("AGENT RORY", cx, cy); g.restore(); return; }
  g.fillText("AGENT RORY", cx, cy - s1 * 0.55);
  g.font = `900 ${s2}px ${FONT}`;
  const word = op === "midnight" ? "MIDNIGHT" : op === "hurricane" ? "HURRICANE" : "MELTDOWN";
  const fg = g.createLinearGradient(0, cy + s2 * 0.2, 0, cy + s2 * 1.1);
  if (op === "midnight") { fg.addColorStop(0, "#ffffff"); fg.addColorStop(0.5, "#d8c8ff"); fg.addColorStop(1, "#8a5ae0"); }
  else if (op === "hurricane") { fg.addColorStop(0, "#ffffff"); fg.addColorStop(0.5, "#8ad8ff"); fg.addColorStop(1, "#2a7ae0"); }
  else { fg.addColorStop(0, "#ffd166"); fg.addColorStop(0.5, "#ff7a1a"); fg.addColorStop(1, "#c0200a"); }
  g.fillStyle = fg; g.fillText(word, cx, cy + s2 * 0.62);
  g.shadowBlur = 0;
  const w2 = g.measureText(word).width;
  if (op === "midnight") {
    // a clock on each side, both hands closing on twelve
    for (const sx of [-1, 1]) {
      const x = cx + sx * (w2 / 2 + s2 * 0.62), y = cy + s2 * 0.6, R = s2 * 0.42;
      g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); g.strokeStyle = "#ffd166"; g.lineWidth = s2 * 0.07; g.stroke();
      g.fillStyle = "#3a2a5a"; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.arc(x + Math.sin(a) * R * 0.78, y - Math.cos(a) * R * 0.78, s2 * (i % 3 ? 0.02 : 0.04), 0, TAU); g.fill(); }
      const m = -0.35 + ((t * 0.08) % 0.35);
      g.strokeStyle = "#1a1030"; g.lineCap = "round"; g.lineWidth = s2 * 0.06; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(m * 0.08) * R * 0.45, y - Math.cos(m * 0.08) * R * 0.45); g.stroke();
      g.lineWidth = s2 * 0.035; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(m) * R * 0.7, y - Math.cos(m) * R * 0.7); g.stroke();
    }
    for (let i = 0; i < 6; i++) { const k = (t * 0.7 + i / 6) % 1, x = cx - w2 / 2 + w2 * ((i * 0.37) % 1), y = cy + s2 * 0.1 - k * s2 * 0.4; g.globalAlpha = 1 - k; drawSymbol(g, "star", x, y, s2 * 0.08 * (1 - k * 0.5), "#fff4c0"); } g.globalAlpha = 1;
  } else if (op === "hurricane") {
    g.strokeStyle = "rgba(170,220,255,.8)"; g.lineWidth = s2 * 0.025; g.lineCap = "round";
    for (let i = 0; i < 14; i++) { const x = cx - w2 / 2 + w2 * ((i * 0.071 + 0.03) % 1), k = (t * 1.3 + i * 0.37) % 1, y = cy + s2 * 1.0 + k * s2 * 0.5; g.globalAlpha = 1 - k; g.beginPath(); g.moveTo(x, y); g.lineTo(x - s2 * 0.05, y + s2 * 0.16); g.stroke(); } g.globalAlpha = 1;
    const flash = (t % 3.1) < 0.12;
    for (const sx of [-1, 1]) { const x = cx + sx * (w2 / 2 + s2 * 0.45), y = cy + s2 * 0.62; g.fillStyle = flash ? "#ffffff" : "#ffd166"; g.beginPath(); g.moveTo(x + s2 * 0.12, y - s2 * 0.5); g.lineTo(x - s2 * 0.14, y + s2 * 0.05); g.lineTo(x + s2 * 0.02, y + s2 * 0.05); g.lineTo(x - s2 * 0.1, y + s2 * 0.5); g.lineTo(x + s2 * 0.18, y - s2 * 0.08); g.lineTo(x + s2 * 0.02, y - s2 * 0.08); g.closePath(); g.fill(); }
  } else {
    for (let i = 0; i < 7; i++) { const x = cx - w2 / 2 + w2 * (0.08 + i * 0.14), k = (t * 0.5 + i * 0.29) % 1, len = s2 * 0.25 * Math.min(1, k * 3); g.fillStyle = "#e04a10"; rrect(g, x - s2 * 0.035, cy + s2 * 0.95, s2 * 0.07, len, s2 * 0.035); g.fill(); if (k > 0.4) { g.globalAlpha = 1 - (k - 0.4) / 0.6; g.beginPath(); g.ellipse(x, cy + s2 * 0.95 + len + (k - 0.4) * s2 * 1.2, s2 * 0.04, s2 * 0.055, 0, 0, TAU); g.fill(); g.globalAlpha = 1; } }
  }
  g.restore();
}
// New Year's Eve in London: fireworks over the Houses of Parliament, the clock
// tower's face lit up, and the river full of reflections
function backdropMidnight(g, W, H, s, t) {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#04040f"); sky.addColorStop(0.55, "#1a1040"); sky.addColorStop(0.75, "#3a1f5a"); sky.addColorStop(1, "#0a0818");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { const x = (i * 97.13) % W, y = (i * 53.7) % (H * 0.55); g.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * Math.abs(Math.sin(t * 1.1 + i))})`; g.fillRect(x, y, 1.4 * s, 1.4 * s); }
  // the moon
  const mx = W * 0.84, my = H * 0.16, mr = Math.min(W, H) * 0.07;
  const mg = g.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3); mg.addColorStop(0, "rgba(255,250,220,.35)"); mg.addColorStop(1, "rgba(255,250,220,0)"); g.fillStyle = mg; g.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
  g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill(); g.fillStyle = "rgba(200,190,160,.35)"; g.beginPath(); g.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.2, 0, TAU); g.arc(mx + mr * 0.25, my + mr * 0.3, mr * 0.14, 0, TAU); g.fill();
  // fireworks
  const COLS = ["#ffd166", "#ff6ad5", "#7fe3ff", "#c9a1ff", "#7bed9f"];
  for (let i = 0; i < 6; i++) {
    const k = (t * 0.32 + i * 0.173) % 1, fx = W * (0.08 + ((i * 0.37) % 1) * 0.84), fy = H * (0.12 + ((i * 0.29) % 1) * 0.28), col = COLS[i % COLS.length];
    if (k < 0.18) { const kk = k / 0.18; g.fillStyle = col; g.beginPath(); g.arc(fx, H * 0.72 - (H * 0.72 - fy) * kk, 2.5 * s, 0, TAU); g.fill(); continue; }
    const kk = (k - 0.18) / 0.82, R = (30 + 90 * Math.sqrt(kk)) * s, fall = kk * kk * 30 * s;
    g.globalAlpha = Math.max(0, 1 - kk);
    for (let j = 0; j < 22; j++) { const a = j * TAU / 22 + i; const x1 = fx + Math.cos(a) * R, y1 = fy + Math.sin(a) * R + fall; g.strokeStyle = col; g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(fx + Math.cos(a) * R * 0.7, fy + Math.sin(a) * R * 0.7 + fall * 0.7); g.lineTo(x1, y1); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x1, y1, 1.8 * s, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  }
  // the river
  const ry = H * 0.78; const river = g.createLinearGradient(0, ry, 0, H); river.addColorStop(0, "#1a1440"); river.addColorStop(1, "#05040c"); g.fillStyle = river; g.fillRect(0, ry, W, H - ry);
  for (let i = 0; i < 40; i++) { const x = (i * 71.3) % W, y = ry + 6 * s + ((i * 37) % 60) * s, w = (10 + (i % 5) * 8) * s; g.fillStyle = `rgba(255,210,120,${0.12 + 0.12 * Math.sin(t * 3 + i)})`; g.fillRect(x + Math.sin(t * 2 + i) * 4 * s, y, w, 2 * s); }
  // the Houses of Parliament, all spires, and the clock tower
  const base = ry, sil = "#0a0816";
  g.fillStyle = sil; g.fillRect(W * 0.3, base - H * 0.12, W * 0.62, H * 0.12);
  for (let i = 0; i < 24; i++) { const x = W * 0.3 + i * W * 0.026; g.beginPath(); g.moveTo(x, base - H * 0.12); g.lineTo(x + W * 0.006, base - H * (0.15 + (i % 3) * 0.012)); g.lineTo(x + W * 0.012, base - H * 0.12); g.fill(); }
  g.fillStyle = "rgba(255,200,110,.55)"; for (let i = 0; i < 36; i++) { const x = W * 0.31 + i * W * 0.017, y = base - H * (0.03 + (i % 3) * 0.03); g.fillRect(x, y, 4 * s, 7 * s); }
  // Victoria Tower at the far end
  g.fillStyle = sil; g.fillRect(W * 0.86, base - H * 0.3, W * 0.06, H * 0.3); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(W * 0.86 + i * W * 0.02 - W * 0.004, base - H * 0.3); g.lineTo(W * 0.86 + i * W * 0.02, base - H * 0.34); g.lineTo(W * 0.86 + i * W * 0.02 + W * 0.004, base - H * 0.3); g.fill(); }
  // the clock tower
  const tx = W * 0.22, tw = W * 0.055, th = H * 0.5;
  g.fillStyle = sil; g.fillRect(tx - tw / 2, base - th, tw, th); g.fillRect(tx - tw * 0.62, base - th * 0.86, tw * 1.24, th * 0.2);
  g.beginPath(); g.moveTo(tx - tw * 0.62, base - th * 1.03); g.lineTo(tx, base - th * 1.3); g.lineTo(tx + tw * 0.62, base - th * 1.03); g.closePath(); g.fill(); g.fillRect(tx - tw * 0.55, base - th * 1.04, tw * 1.1, th * 0.2);
  g.fillRect(tx - 1.5 * s, base - th * 1.42, 3 * s, th * 0.14);
  const cy = base - th * 0.76, cr = tw * 0.42;
  const cg = g.createRadialGradient(tx, cy, 2, tx, cy, cr * 3); cg.addColorStop(0, "rgba(255,240,190,.5)"); cg.addColorStop(1, "rgba(255,240,190,0)"); g.fillStyle = cg; g.fillRect(tx - cr * 3, cy - cr * 3, cr * 6, cr * 6);
  g.fillStyle = "#fff4cc"; g.beginPath(); g.arc(tx, cy, cr, 0, TAU); g.fill(); g.strokeStyle = "#2a1a0a"; g.lineWidth = 1.5 * s; g.stroke();
  const mm = -0.08 + ((t * 0.01) % 0.08) ; g.lineCap = "round"; g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(tx, cy); g.lineTo(tx + Math.sin(mm / 12) * cr * 0.5, cy - Math.cos(mm / 12) * cr * 0.5); g.stroke(); g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(tx, cy); g.lineTo(tx + Math.sin(mm * TAU) * cr * 0.8, cy - Math.cos(mm * TAU) * cr * 0.8); g.stroke();
  // the big wheel on the far bank
  const ex = W * 0.08, ey = base - H * 0.2, er = H * 0.17;
  g.strokeStyle = "rgba(127,227,255,.55)"; g.lineWidth = 2 * s; g.beginPath(); g.arc(ex, ey, er, 0, TAU); g.stroke();
  for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + t * 0.05; g.strokeStyle = "rgba(127,227,255,.2)"; g.lineWidth = 1; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a) * er, ey + Math.sin(a) * er); g.stroke(); g.fillStyle = "rgba(200,240,255,.8)"; g.beginPath(); g.arc(ex + Math.cos(a) * er, ey + Math.sin(a) * er, 2.5 * s, 0, TAU); g.fill(); }
  g.strokeStyle = sil; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(ex - er * 0.4, base); g.lineTo(ex, ey); g.lineTo(ex + er * 0.4, base); g.stroke();
}
// a hurricane turning over Washington: the eye, the rain, the lightning, the
// dome, the monument and the sea coming up the river
function backdropHurricane(g, W, H, s, t) {
  const flash = (t % 4.3) < 0.09 || ((t + 0.2) % 4.3) < 0.05;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, flash ? "#6a7a9a" : "#0a1420"); sky.addColorStop(0.6, flash ? "#4a5a7a" : "#1a2a3a"); sky.addColorStop(1, "#0a1018");
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // the storm, turning
  const cx = W * 0.55, cy = H * 0.26, R = Math.max(W, H) * 0.55;
  g.save(); g.translate(cx, cy); g.scale(1, 0.42); g.rotate(-t * 0.12);
  for (let arm = 0; arm < 5; arm++) {
    for (let k = 0; k < 40; k++) {
      const u = k / 40, a = arm * TAU / 5 + u * 3.2, r = R * (0.08 + u * 0.95);
      g.fillStyle = `rgba(${170 + arm * 8},${190 + arm * 6},215,${0.1 * (1 - u) + 0.02})`;
      g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, (30 + u * 140) * s, 0, TAU); g.fill();
    }
  }
  g.fillStyle = "rgba(10,20,32,.9)"; g.beginPath(); g.arc(0, 0, R * 0.06, 0, TAU); g.fill();
  g.restore();
  // lightning
  if (flash) { g.strokeStyle = "#ffffff"; g.lineWidth = 3 * s; g.shadowColor = "#bfe8ff"; g.shadowBlur = 20 * s; let x = W * 0.32, y = H * 0.25; g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 7; i++) { x += (Math.sin(i * 7.3) * 30) * s; y += H * 0.07; g.lineTo(x, y); } g.stroke(); g.shadowBlur = 0; }
  // rain
  g.strokeStyle = "rgba(170,210,240,.35)"; g.lineWidth = 1.2 * s;
  for (let i = 0; i < 120; i++) { const k = (t * 1.6 + i * 0.137) % 1, x = ((i * 53.7) % (W + 200)) - 100 + k * 90 * s, y = k * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 12 * s, y + 26 * s); g.stroke(); }
  // the city
  const base = H * 0.8, sil = flash ? "#2a3446" : "#070b12";
  g.fillStyle = sil;
  // the Capitol
  const dx = W * 0.22; g.fillRect(dx - W * 0.16, base - H * 0.08, W * 0.32, H * 0.08); g.fillRect(dx - W * 0.05, base - H * 0.14, W * 0.1, H * 0.06);
  g.beginPath(); g.ellipse(dx, base - H * 0.14, W * 0.045, H * 0.09, 0, Math.PI, TAU); g.fill(); g.fillRect(dx - 3 * s, base - H * 0.27, 6 * s, H * 0.05); g.beginPath(); g.arc(dx, base - H * 0.28, 5 * s, 0, TAU); g.fill();
  for (let i = 0; i < 12; i++) { g.fillStyle = "rgba(255,210,140,.4)"; g.fillRect(dx - W * 0.15 + i * W * 0.026, base - H * 0.05, 3 * s, 8 * s); } g.fillStyle = sil;
  // the monument
  const mx = W * 0.62; g.beginPath(); g.moveTo(mx - W * 0.014, base); g.lineTo(mx - W * 0.01, base - H * 0.44); g.lineTo(mx, base - H * 0.48); g.lineTo(mx + W * 0.01, base - H * 0.44); g.lineTo(mx + W * 0.014, base); g.closePath(); g.fill();
  g.fillStyle = `rgba(255,60,60,${0.5 + 0.5 * Math.sin(t * 3)})`; g.beginPath(); g.arc(mx, base - H * 0.45, 2.5 * s, 0, TAU); g.fill(); g.fillStyle = sil;
  // the memorial
  const lx = W * 0.86; g.fillRect(lx - W * 0.08, base - H * 0.1, W * 0.16, H * 0.1); for (let i = 0; i < 9; i++) { g.fillStyle = flash ? "#3a4456" : "#0e141e"; g.fillRect(lx - W * 0.075 + i * W * 0.0185, base - H * 0.085, W * 0.008, H * 0.075); } g.fillStyle = sil; g.fillRect(lx - W * 0.085, base - H * 0.115, W * 0.17, H * 0.02);
  // the surge
  const sea = g.createLinearGradient(0, base, 0, H); sea.addColorStop(0, "#1a3a4a"); sea.addColorStop(1, "#050a10"); g.fillStyle = sea;
  g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 16 * s) g.lineTo(x, base + 8 * s + Math.sin(x / (60 * s) + t * 2) * 7 * s + Math.sin(x / (23 * s) - t * 3) * 3 * s); g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = "rgba(220,240,255,.35)"; g.lineWidth = 2 * s; g.beginPath(); for (let x = 0; x <= W; x += 16 * s) { const y = base + 8 * s + Math.sin(x / (60 * s) + t * 2) * 7 * s + Math.sin(x / (23 * s) - t * 3) * 3 * s; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
}
// a film poster for one operation, for the menu
export function drawOpPoster(g, x, y, w, h, s, t, op, p) {
  const col = op.colors;
  g.save();
  rrect(g, x, y, w, h, 16 * s); g.clip();
  // the operation's own picture, cropped to the poster
  const bw = h * 1.35; g.save(); g.translate(x + w / 2 - bw / 2, y - h * 0.05); drawTitleBackdrop(g, bw, h * 1.05, s * h / 780, t, op.id); g.restore();
  const shade = g.createLinearGradient(0, y + h * 0.35, 0, y + h); shade.addColorStop(0, "rgba(3,6,14,0)"); shade.addColorStop(0.45, "rgba(3,6,14,.85)"); shade.addColorStop(1, "rgba(3,6,14,.97)");
  g.fillStyle = shade; g.fillRect(x, y, w, h);
  text(g, `OPERATION ${op.n}`, x + w / 2, y + h * 0.56, 12 * s, col[1], "center", 800, MONO);
  g.save(); g.font = `900 ${Math.min(34 * s, w * 0.13)}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  const tg = g.createLinearGradient(0, y + h * 0.6, 0, y + h * 0.68); tg.addColorStop(0, col[0]); tg.addColorStop(1, col[1]); g.fillStyle = tg; g.shadowColor = "rgba(0,0,0,.7)"; g.shadowBlur = 8 * s;
  g.fillText(op.title, x + w / 2, y + h * 0.645); g.restore();
  paragraph(g, op.blurb, x + 16 * s, y + h * 0.72, w - 32 * s, 13 * s, "#dde6f4", 17 * s, "center", 600);
  // progress
  const by = y + h - 40 * s, bx = x + 18 * s, bw2 = w - 36 * s;
  g.fillStyle = "rgba(255,255,255,.1)"; rrect(g, bx, by, bw2, 8 * s, 4 * s); g.fill();
  if (p.done) { g.fillStyle = col[1]; rrect(g, bx, by, Math.max(8 * s, bw2 * p.done / p.total), 8 * s, 4 * s); g.fill(); }
  text(g, p.finished ? "MISSION COMPLETE" : p.started ? `${p.done} / ${p.total} MISSIONS` : `${p.total} MISSIONS`, x + w / 2, by + 22 * s, 12 * s, p.finished ? "#7bed9f" : "#c8d0e0", "center", 800, MONO);
  // a stamp
  if (!p.started || p.finished) { g.save(); g.translate(x + w - 52 * s, y + 34 * s); g.rotate(0.18); const lbl = p.finished ? "DONE" : "NEW", sc = p.finished ? "#7bed9f" : "#ffd166"; g.strokeStyle = sc; g.lineWidth = 3 * s; rrect(g, -34 * s, -14 * s, 68 * s, 28 * s, 5 * s); g.stroke(); text(g, lbl, 0, 1 * s, 16 * s, sc, "center", 900); g.restore(); }
  g.restore();
  g.strokeStyle = col[1]; g.globalAlpha = 0.7; g.lineWidth = 2 * s; rrect(g, x, y, w, h, 16 * s); g.stroke(); g.globalAlpha = 1;
}
export function drawSpyWatch(g, x, y, w, h, s, objective, intelCount, total, t, bugs) {
  g.save();
  g.fillStyle = "rgba(6,10,16,.78)"; rrect(g, x, y, w, h, 14 * s); g.fill();
  g.strokeStyle = "rgba(127,221,204,.5)"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#7fd"; g.beginPath(); g.arc(x + 18 * s, y + 18 * s, 5 * s + Math.sin(t * 4) * 1.5 * s, 0, TAU); g.fill();
  text(g, "SPY WATCH", x + 32 * s, y + 18 * s, 13 * s, "#7fd", "left", 800, MONO);
  text(g, "INTEL " + intelCount + "/" + total, x + w - 12 * s, y + 18 * s, 13 * s, "#ffd166", "right", 800, MONO);
  paragraph(g, objective, x + 14 * s, y + 46 * s, w - 28 * s, 17 * s, "#eef2f8", 21 * s, "left", 600);
  if (bugs) {
    const by = y + h - 13 * s, all = bugs.found >= bugs.of;
    g.fillStyle = all ? "#2ecc71" : "#ff4d5e"; g.beginPath(); g.arc(x + 18 * s, by, 3.5 * s, 0, TAU); g.fill();
    text(g, `BUGS ${bugs.found}/${bugs.of}`, x + 30 * s, by + 1, 11 * s, all ? "#2ecc71" : "rgba(255,255,255,.55)", "left", 800, MONO);
  }
  g.restore();
}
export function drawDossier(g, W, H, s, save, scroll, t, abortCode, rows, op) {
  g.fillStyle = "rgba(4,6,10,.92)"; g.fillRect(0, 0, W, H);
  text(g, "DOSSIER", W / 2, 42 * s, 34 * s, "#ffd166", "center", 900);
  const total = COUNTRIES.reduce((n, c) => n + c.missions.length, 0);
  const got = Object.values(save.stars || {}).reduce((n, v) => n + v, 0);
  text(g, "Everything Rory has found out so far", W / 2, 70 * s, 15 * s, "#94a2bb", "center", 500);
  { const label = `${got} / ${total * 3}`; g.font = `800 ${15 * s}px ${MONO}`; const lw = g.measureText(label).width;
    drawStars(g, W / 2 - lw / 2 - 40 * s, 92 * s, 15 * s, 3);
    text(g, label, W / 2 + 14 * s, 97 * s, 15 * s, "#ffd166", "center", 800, MONO); }
  { const nb = (save.bugs || []).length;
    g.fillStyle = nb >= COUNTRIES.length * 3 ? "#2ecc71" : "#ff4d5e"; g.beginPath(); g.arc(W / 2 - 58 * s, 112 * s, 4 * s, 0, TAU); g.fill();
    text(g, `${(op ? op.bugName : "Kaldera").toUpperCase()} BUGS FOUND  ${nb} / ${COUNTRIES.length * 3}`, W / 2 - 46 * s, 116 * s, 12 * s, nb >= COUNTRIES.length * 3 ? "#2ecc71" : "#94a2bb", "left", 700, MONO); }
  const cw = Math.min(W - 80 * s, 820 * s), cx = (W - cw) / 2;
  let y = 136 * s - scroll;
  let n = 0;
  g.save(); g.beginPath(); g.rect(0, 128 * s, W, H - 128 * s - 80 * s); g.clip();
  let lastAct = 0;
  for (const c of COUNTRIES) {
    if (c.act !== lastAct) { lastAct = c.act; if (y + 40 * s > 122 * s && y < H) text(g, `ACT ${actWord(c.act)}  ·  ${ACTS[c.act - 1].title.toUpperCase()}`, cx, y + 16 * s, 16 * s, "#ff9f43", "left", 900, MONO); y += 40 * s; }
    for (const m of c.missions) {
      n++;
      const done = save.done.includes(m.id);
      const h = done ? 118 * s : 56 * s;
      if (y + h > 122 * s && y < H) {
        panel(g, cx, y, cw, h, s, { bg: done ? "rgba(255,248,225,.95)" : "rgba(255,255,255,.06)", border: done ? "#c9a15a" : "rgba(255,255,255,.12)", r: 10 * s });
        drawFlag(g, c.flag, cx + 14 * s, y + 14 * s, 30 * s, 20 * s);
        text(g, `${n}. ${m.title}`, cx + 56 * s, y + 24 * s, 17 * s, done ? "#7a4a10" : "rgba(255,255,255,.5)", "left", 800, MONO);
        text(g, c.city.toUpperCase(), cx + cw - 14 * s, y + 24 * s, 12 * s, done ? "#a07030" : "rgba(255,255,255,.3)", "right", 700, MONO);
        if (done) {
          drawStars(g, cx + cw - 150 * s, y + 22 * s, 15 * s, (save.stars || {})[m.id] || 0);
          const bw = 92 * s, bh = 30 * s, bx = cx + cw - bw - 14 * s, by = y + h - bh - 12 * s;
          rrect(g, bx, by, bw, bh, 8 * s); g.fillStyle = "rgba(122,74,16,.14)"; g.fill();
          g.strokeStyle = "rgba(122,74,16,.45)"; g.lineWidth = 1.5; g.stroke();
          text(g, "REPLAY", bx + bw / 2, by + bh / 2 + 1, 13 * s, "#7a4a10", "center", 800, MONO);
          if (rows && by > 128 * s && by + bh < H - 80 * s) rows.push({ id: m.id, x: bx, y: by, w: bw, h: bh });
        }
        if (done) {
          let txt = m.intel.text;
          if (m.game === "shredder" && abortCode) txt = txt.replace("written in the Dossier", "shown below");
          paragraph(g, txt, cx + 14 * s, y + 56 * s, cw - 28 * s, 15 * s, "#2a1a0a", 19 * s, "left", 500, MONO);
          if (m.game === "shredder" && abortCode && !save.done.some(id => id !== m.id && COUNTRIES.some(cc => cc.missions.some(q => q.id === id && q.game === "shredder" && idsNow().indexOf(id) > idsNow().indexOf(m.id))))) { abortCode.forEach((sym, i) => drawSymbol(g, sym, cx + cw - 30 * s - (abortCode.length - 1 - i) * 34 * s, y + 96 * s, 11 * s, "#7a1a10")); }
        } else text(g, "locked", cx + 56 * s, y + 42 * s, 12 * s, "rgba(255,255,255,.3)", "left", 600, MONO);
      }
      y += h + 10 * s;
    }
  }
  g.restore();
  return y + scroll; // content height
}
const idsNow = () => COUNTRIES.flatMap(c => c.missions.map(m => m.id));
// what the Narwhal's big screen shows in the briefings of the other operations
function briefingScreen(g, sx, sy, sw, sh, s, t, a, op) {
  const cx = sx + sw / 2, cy = sy + sh * 0.55;
  const icons = (list, colr) => list.forEach(([label, draw], i) => { const x = sx + sw * (0.14 + i * 0.24), y = sy + sh * 0.5, on = Math.sin(t * 3 - i) > -0.3; g.globalAlpha = on ? 1 : 0.5; draw(x, y, sh * 0.16); text(g, label, x, y + sh * 0.3, sh * 0.06, colr, "center", 800, MONO); g.globalAlpha = 1; });
  if (op === "midnight") {
    if (a === 1) {
      const x = sx + sw * 0.25, R = sh * 0.3; g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(x, cy, R, 0, TAU); g.fill(); g.strokeStyle = "#c9a1ff"; g.lineWidth = 4 * s; g.stroke();
      g.fillStyle = "#3a2a5a"; for (let i = 0; i < 12; i++) { const an = i * TAU / 12; g.beginPath(); g.arc(x + Math.sin(an) * R * 0.8, cy - Math.cos(an) * R * 0.8, 3 * s, 0, TAU); g.fill(); }
      g.strokeStyle = "#1a1030"; g.lineWidth = 3 * s; g.lineCap = "round"; g.beginPath(); g.moveTo(x, cy); g.lineTo(x + Math.sin(t) * R * 0.7, cy - Math.cos(t) * R * 0.7); g.moveTo(x, cy); g.lineTo(x + Math.sin(t / 12) * R * 0.45, cy - Math.cos(t / 12) * R * 0.45); g.stroke();
      text(g, "MADAME MINUIT", sx + sw * 0.5, sy + sh * 0.38, sh * 0.1, "#d8c8ff", "left", 900, MONO);
      text(g, "Clockmaker. Thief.", sx + sw * 0.5, sy + sh * 0.54, sh * 0.065, "#c8d0e0", "left", 700, MONO);
      text(g, "Never, ever late.", sx + sw * 0.5, sy + sh * 0.64, sh * 0.065, "#c8d0e0", "left", 700, MONO);
    } else if (a === 2) {
      const c = "#d8c8ff";
      icons([["PRAGUE", (x, y, r) => { g.strokeStyle = "#ffd166"; g.lineWidth = 3 * s; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) { const an = i * TAU / 12; g.beginPath(); g.moveTo(x + Math.cos(an) * r * 0.75, y + Math.sin(an) * r * 0.75); g.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); g.stroke(); } }],
             ["BAVARIA", (x, y, r) => { g.fillStyle = "#8a5a2a"; g.fillRect(x - r * 0.8, y - r * 0.6, r * 1.6, r * 1.3); g.beginPath(); g.moveTo(x - r, y - r * 0.6); g.lineTo(x, y - r * 1.2); g.lineTo(x + r, y - r * 0.6); g.fill(); g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(x, y, r * 0.4, 0, TAU); g.fill(); }],
             ["SCOTLAND", (x, y, r) => { g.strokeStyle = "#ffd166"; g.lineWidth = 4 * s; g.beginPath(); g.arc(x - r * 0.4, y, r * 0.4, 0, TAU); g.moveTo(x, y); g.lineTo(x + r, y); g.moveTo(x + r * 0.7, y); g.lineTo(x + r * 0.7, y + r * 0.35); g.stroke(); }],
             ["STONEHENGE", (x, y, r) => { g.fillStyle = "#bfefff"; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.7, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.7, y); g.closePath(); g.fill(); }]], c);
      text(g, "FOUR MORE PIECES", cx, sy + sh * 0.12, sh * 0.075, c, "center", 900, MONO);
    } else {
      const x = cx - sw * 0.2, base = sy + sh * 0.92; g.fillStyle = "#2a1f4a"; g.fillRect(x - sh * 0.07, base - sh * 0.7, sh * 0.14, sh * 0.7); g.beginPath(); g.moveTo(x - sh * 0.09, base - sh * 0.7); g.lineTo(x, base - sh * 0.86); g.lineTo(x + sh * 0.09, base - sh * 0.7); g.fill();
      g.fillStyle = "#fff4cc"; g.beginPath(); g.arc(x, base - sh * 0.56, sh * 0.055, 0, TAU); g.fill();
      text(g, Math.sin(t * 4) > 0 ? "23:59" : "23 59", cx + sw * 0.12, cy, sh * 0.2, "#ff6a8a", "center", 900, MONO);
      text(g, "NEW YEAR'S EVE", cx + sw * 0.12, cy + sh * 0.18, sh * 0.065, "#d8c8ff", "center", 800, MONO);
    }
  } else {
    if (a === 1) {
      const x = sx + sw * 0.24; g.fillStyle = "#c8d0e0"; for (const [px, py, pr] of [[-0.12, 0, 0.13], [0, -0.07, 0.17], [0.13, 0, 0.13], [0, 0.04, 0.14]]) { g.beginPath(); g.arc(x + px * sh, cy + py * sh, pr * sh, 0, TAU); g.fill(); }
      g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(x + sh * 0.03, cy + sh * 0.05); g.lineTo(x - sh * 0.05, cy + sh * 0.2); g.lineTo(x + sh * 0.01, cy + sh * 0.2); g.lineTo(x - sh * 0.04, cy + sh * 0.34); g.lineTo(x + sh * 0.08, cy + sh * 0.14); g.lineTo(x + sh * 0.02, cy + sh * 0.14); g.closePath(); g.fill();
      text(g, "TEMPEST WEATHER", sx + sw * 0.46, sy + sh * 0.38, sh * 0.1, "#8ad8ff", "left", 900, MONO);
      text(g, "Always right.", sx + sw * 0.46, sy + sh * 0.54, sh * 0.065, "#c8d0e0", "left", 700, MONO);
      text(g, "Eventually.", sx + sw * 0.46, sy + sh * 0.64, sh * 0.065, "#c8d0e0", "left", 700, MONO);
    } else if (a === 2) {
      const c = "#8ad8ff";
      icons([["NIAGARA", (x, y, r) => { g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(x + r * 0.2, y - r); g.lineTo(x - r * 0.5, y + r * 0.1); g.lineTo(x, y + r * 0.1); g.lineTo(x - r * 0.3, y + r); g.lineTo(x + r * 0.5, y - r * 0.2); g.lineTo(x, y - r * 0.2); g.closePath(); g.fill(); }],
             ["FLORIDA", (x, y, r) => { g.fillStyle = "#e8eef8"; g.fillRect(x - r, y - r * 0.12, r * 2, r * 0.24); g.beginPath(); g.moveTo(x - r * 0.2, y); g.lineTo(x - r * 0.5, y - r * 0.8); g.lineTo(x - r * 0.1, y - r * 0.8); g.lineTo(x + r * 0.3, y); g.lineTo(x - r * 0.1, y + r * 0.8); g.lineTo(x - r * 0.5, y + r * 0.8); g.closePath(); g.fill(); }],
             ["HAVANA", (x, y, r) => { g.strokeStyle = "#e8eef8"; g.lineWidth = 3 * s; g.beginPath(); g.arc(x, y + r * 0.2, r * 0.8, Math.PI * 1.1, Math.PI * 1.9); g.moveTo(x, y + r * 0.2); g.lineTo(x, y + r); g.stroke(); for (let k = 1; k <= 2; k++) { g.beginPath(); g.arc(x + r * 0.3, y - r * 0.5, r * 0.25 * k, -0.9, 0.2); g.stroke(); } }],
             ["COSTA RICA", (x, y, r) => { g.fillStyle = "#c8d0e0"; for (const [px, py, pr] of [[-0.4, 0.1, 0.4], [0, -0.2, 0.55], [0.45, 0.1, 0.4]]) { g.beginPath(); g.arc(x + px * r, y + py * r, pr * r, 0, TAU); g.fill(); } }]], c);
      text(g, "POWER. TRACKING. RADAR. CLOUDS.", cx, sy + sh * 0.12, sh * 0.07, c, "center", 900, MONO);
    } else {
      const x = cx - sw * 0.18; g.save(); g.translate(x, cy); g.rotate(-t * 0.8);
      for (let arm = 0; arm < 4; arm++) { g.strokeStyle = "rgba(200,230,255,.8)"; g.lineWidth = 5 * s; g.beginPath(); for (let k = 0; k <= 20; k++) { const u = k / 20, an = arm * TAU / 4 + u * 2.6, r = sh * (0.05 + u * 0.3); if (k) g.lineTo(Math.cos(an) * r, Math.sin(an) * r); else g.moveTo(Math.cos(an) * r, Math.sin(an) * r); } g.stroke(); }
      g.fillStyle = "#0a1420"; g.beginPath(); g.arc(0, 0, sh * 0.05, 0, TAU); g.fill(); g.restore();
      text(g, "HILDA", cx + sw * 0.16, cy - sh * 0.04, sh * 0.18, "#ff6a6a", "center", 900, MONO);
      text(g, "BIGGEST STORM EVER", cx + sw * 0.16, cy + sh * 0.14, sh * 0.06, "#8ad8ff", "center", 800, MONO);
    }
  }
}
