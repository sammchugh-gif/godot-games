/* Code Lab's level materials, drawn the way the sprites are: flat colours,
   a darker outline, a pattern, and a way of moving. A material is

     { k, name, kind, shape, size, c1, c2, pat, anim }   (or shape "pixel"
                                                          with px, the 8x8
                                                          pictures of before)

   shape  square rounded circle half triangle rampR rampL diamond star heart
          cloud bush spikes pixel
   size   1, 2 or 3 squares across and down
   pat    plain grass snow bricks stones wood stripes dots spots bubbles
          waves shine checker coil
   anim   none wobble bob pulse spin flow sparkle

   LEVELART.draw(g, m, x, y, w, h, t, o) draws one in the box x,y,w,h at time
   t. o.nb says which sides touch the same material (squares join up into
   one platform), o.seed varies the stones and spots, o.hit squashes a
   bouncy one that was just landed on. topAt/bottomAt give the surface of a
   shape at an x, for walking on hills, ramps and balls.                 */
(function () {
"use strict";
const TAU = Math.PI * 2;
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
}
const COLORS = ["#e14b4b", "#ff8c1a", "#ffd23f", "#8be04a", "#4cb85a", "#2f8a3a", "#2ec4b6", "#5ac8ff", "#3d7bff",
  "#2b3f8a", "#8a5be0", "#ff6fb5", "#a8642a", "#d9a86a", "#9aa3b5", "#4a4f63", "#f4f6fb", "#22232e"];
const SHAPES = [["square", "Square"], ["rounded", "Rounded"], ["circle", "Circle"], ["half", "Hill"], ["triangle", "Triangle"],
  ["rampR", "Ramp up"], ["rampL", "Ramp down"], ["diamond", "Diamond"], ["star", "Star"], ["heart", "Heart"],
  ["cloud", "Cloud"], ["bush", "Bush"], ["spikes", "Spikes"], ["pixel", "Pixel paint"]];
const PATTERNS = [["plain", "Plain"], ["grass", "Grass top"], ["snow", "Snow top"], ["bricks", "Bricks"], ["stones", "Stones"],
  ["wood", "Wood"], ["stripes", "Stripes"], ["dots", "Dots"], ["spots", "Spots"], ["bubbles", "Bubbles"], ["waves", "Waves"],
  ["shine", "Shiny"], ["checker", "Checks"], ["coil", "Spring"]];
const ANIMS = [["none", "Still"], ["wobble", "Wobble"], ["bob", "Bob"], ["pulse", "Pulse"], ["spin", "Spin"], ["flow", "Flow"], ["sparkle", "Sparkle"]];
/* the pixel painter's colours, a character each (0-9, a-v): the first
   sixteen are the ones the 8 by 8 painter had, so old pictures keep theirs */
const PIXEL = ["", "#1d1d2b", "#ffffff", "#8a8fa3", "#5d6678", "#e14b4b", "#ff8c1a", "#ffd23f", "#5ec44a", "#2f8a3a", "#4c97ff", "#2b4fa8", "#a8e4ff", "#b97a44", "#6b4424", "#ff6fb5",
  "#8a1f2a", "#ffc9a0", "#f5c7a1", "#8d5a3b", "#e0a800", "#fff3c4", "#b8f08a", "#2ec4b6", "#7cc8ff", "#1b2a5a", "#c9b0ff", "#8a5be0", "#4a2a7a", "#ffc2dc", "#d0d5e0", "#7a8a2a"];
const pixRes = px => Math.max(1, Math.round(Math.sqrt((px || "").length)));
/* shapes whose top is flat across the whole box, for walking on */
const FLAT = new Set(["square", "rounded", "cloud", "bush", "spikes"]);
const LW = 2.2;
function rnd(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* the outline of a shape, as one path (clouds and bushes are several
   circles: drawn outline-first and then filled, the circles merge) */
function path(g, shape, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  g.beginPath();
  switch (shape) {
    case "rounded": rr(g, x, y, w, h, Math.min(w, h) * 0.28); break;
    case "circle": g.ellipse(cx, cy, w / 2, h / 2, 0, 0, TAU); break;
    // a hill is a smooth bump, gentle at its feet, so it can be walked over
    case "half": g.moveTo(x, y + h); g.bezierCurveTo(x + w * 0.28, y + h, x + w * 0.22, y, cx, y);
      g.bezierCurveTo(x + w * 0.78, y, x + w * 0.72, y + h, x + w, y + h); g.closePath(); break;
    case "triangle": g.moveTo(x, y + h); g.lineTo(cx, y); g.lineTo(x + w, y + h); g.closePath(); break;
    case "rampR": g.moveTo(x, y + h); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.closePath(); break;
    case "rampL": g.moveTo(x, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.closePath(); break;
    case "diamond": g.moveTo(cx, y); g.lineTo(x + w, cy); g.lineTo(cx, y + h); g.lineTo(x, cy); g.closePath(); break;
    case "star":
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.44 : 1;
        const px = cx + Math.cos(a) * w / 2 * r, py = cy + h * 0.05 + Math.sin(a) * h / 2 * r;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath(); break;
    case "heart":
      g.moveTo(cx, y + h * 0.95);
      g.bezierCurveTo(x - w * 0.12, y + h * 0.52, x + w * 0.06, y - h * 0.08, cx, y + h * 0.27);
      g.bezierCurveTo(x + w * 0.94, y - h * 0.08, x + w * 1.12, y + h * 0.52, cx, y + h * 0.95);
      g.closePath(); break;
    case "cloud":
      [[0.24, 0.62, 0.27], [0.45, 0.4, 0.33], [0.7, 0.44, 0.3], [0.83, 0.64, 0.22]].forEach(([px, py, r]) => {
        g.moveTo(x + px * w + r * h, y + py * h); g.arc(x + px * w, y + py * h, r * h, 0, TAU); });
      rr(g, x + w * 0.12, y + h * 0.55, w * 0.76, h * 0.33, h * 0.16); break;
    case "bush":
      [[0.25, 0.62, 0.3], [0.5, 0.42, 0.36], [0.76, 0.6, 0.3]].forEach(([px, py, r]) => {
        g.moveTo(x + px * w + r * h, y + py * h); g.arc(x + px * w, y + py * h, r * h, 0, TAU); });
      g.rect(x + w * 0.08, y + h * 0.62, w * 0.84, h * 0.38); break;
    case "spikes": {
      const n = Math.max(2, Math.round(w / 12)), sw = w / n;
      g.moveTo(x, y + h);
      for (let i = 0; i < n; i++) { g.lineTo(x + sw * (i + 0.5), y + h * 0.12); g.lineTo(x + sw * (i + 1), y + h); }
      g.closePath(); break;
    }
    default: g.rect(x, y, w, h);
  }
}

/* ------------------------------------------------------------ patterns
   Drawn inside the shape (it is the clip), in stage coordinates, so bricks
   and waves line up across squares that join. */
function pattern(g, m, x, y, w, h, t, o) {
  const c2 = m.c2, flow = m.anim === "flow" ? t : 0, rand = rnd((o.seed || 1) + 7);
  const top = !(o.nb && o.nb.u);
  switch (m.pat) {
    case "grass": case "snow": {
      if (!top) break;
      const col = m.pat === "snow" ? "#f4f6fb" : c2;
      let d;
      if (m.shape === "square") { d = Math.min(7, h * 0.3); g.fillStyle = col; g.fillRect(x - 1, y - 1, w + 2, d + 1); }
      else {
        // the band follows the shape: draw the shape again, moved down, in
        // the main colour, over a whole fill of the top colour
        d = Math.max(5, Math.min(11, h * 0.15));
        g.save(); g.fillStyle = col; g.fillRect(x - 2, y - 2, w + 4, h + 4);
        g.translate(0, d); path(g, m.shape, x, y, w, h); g.fillStyle = m.c1; g.fill(); g.restore();
      }
      // a few tufts or drips along the edge
      if (FLAT.has(m.shape)) {
        g.fillStyle = col;
        for (let px = Math.floor(x / 6) * 6; px < x + w; px += 6) { g.beginPath(); g.arc(px + 3, y + d, 2.6, 0, Math.PI); g.fill(); }
      }
      break;
    }
    case "bricks": {
      g.strokeStyle = c2; g.lineWidth = 1.3; g.beginPath();
      for (let yy = Math.floor(y / 8) * 8; yy < y + h; yy += 8) {
        g.moveTo(x, yy); g.lineTo(x + w, yy);
        const off = (Math.round(yy / 8) % 2) * 8;
        for (let xx = Math.floor((x - off) / 16) * 16 + off; xx < x + w; xx += 16) { g.moveTo(xx, yy); g.lineTo(xx, yy + 8); }
      }
      g.stroke(); break;
    }
    case "stones": {
      const n = Math.max(2, Math.round(w * h / 110));
      for (let i = 0; i < n; i++) {
        const sx = x + rand() * w, sy = y + rand() * h, r = 2 + rand() * 2.8;
        g.fillStyle = c2; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(sx, sy, r * 1.25, r, 0, 0, TAU); g.fill();
        g.globalAlpha = 0.35; g.fillStyle = "#fff"; g.beginPath(); g.arc(sx - r * 0.4, sy - r * 0.4, r * 0.35, 0, TAU); g.fill();
      }
      g.globalAlpha = 1; break;
    }
    case "wood": {
      g.strokeStyle = c2; g.lineWidth = 1.2; g.beginPath();
      for (let yy = Math.floor(y / 6) * 6 + 6; yy < y + h; yy += 6) { g.moveTo(x, yy); g.lineTo(x + w, yy); }
      g.stroke();
      if (rand() < 0.6) { g.beginPath(); g.ellipse(x + w * (0.25 + rand() * 0.5), y + h * (0.3 + rand() * 0.4), 2.4, 1.5, 0, 0, TAU); g.stroke(); }
      break;
    }
    case "stripes": {
      g.strokeStyle = c2; g.lineWidth = 3.5; g.beginPath();
      const off = (flow * 14) % 12;
      for (let d = -h - 12; d < w + h + 12; d += 12) { g.moveTo(x + d + off, y + h + 2); g.lineTo(x + d + off + h + 4, y - 2); }
      g.stroke(); break;
    }
    case "dots": {
      g.fillStyle = c2; const off = (flow * 8) % 6;
      for (let yy = Math.floor(y / 6) * 6 + 3; yy < y + h; yy += 6)
        for (let xx = Math.floor(x / 6) * 6 + 3; xx < x + w + 6; xx += 6) { g.beginPath(); g.arc(xx - off, yy, 1.3, 0, TAU); g.fill(); }
      break;
    }
    case "spots": {
      g.fillStyle = c2; const n = Math.max(2, Math.round(w * h / 160));
      for (let i = 0; i < n; i++) { g.beginPath(); g.arc(x + rand() * w, y + rand() * h * 0.8, 2.4 + rand() * 2.6, 0, TAU); g.fill(); }
      break;
    }
    case "bubbles": {
      g.fillStyle = c2; const n = Math.max(2, Math.round(w * h / 140));
      for (let i = 0; i < n; i++) {
        const bx = x + rand() * w, sp = 0.6 + rand(), r = 1.4 + rand() * 2.4;
        const by = y + ((rand() * h - flow * 9 * sp) % h + h) % h;
        g.globalAlpha = 0.75; g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fill();
      }
      g.globalAlpha = 1; break;
    }
    case "waves": {
      g.strokeStyle = c2; g.lineWidth = 1.6; g.beginPath();
      for (let yy = Math.floor(y / 7) * 7 + 4; yy < y + h; yy += 7) {
        for (let xx = x - 6; xx <= x + w + 6; xx += 2) {
          const wy = yy + Math.sin((xx + flow * 18) / 4) * 1.4;
          xx === x - 6 ? g.moveTo(xx, wy) : g.lineTo(xx, wy);
        }
      }
      g.stroke(); break;
    }
    case "shine": {
      g.fillStyle = c2; g.globalAlpha = 0.75;
      g.beginPath(); g.ellipse(x + w * 0.32, y + h * 0.3, w * 0.16, h * 0.09, -0.6, 0, TAU); g.fill();
      g.beginPath(); g.arc(x + w * 0.52, y + h * 0.2, Math.min(w, h) * 0.04, 0, TAU); g.fill();
      g.globalAlpha = 1; break;
    }
    case "checker": {
      g.fillStyle = c2;
      for (let yy = Math.floor(y / 6) * 6; yy < y + h; yy += 6)
        for (let xx = Math.floor(x / 6) * 6; xx < x + w; xx += 6) if (((xx + yy) / 6) % 2 === 0) g.fillRect(xx, yy, 6, 6);
      break;
    }
    case "coil": {
      g.fillStyle = c2; g.fillRect(x, y + h * 0.36, w, h);
      g.strokeStyle = shade(c2, -0.5); g.lineWidth = 1.8; g.beginPath();
      const n = 3, top0 = y + h * 0.4, bot = y + h;
      for (let i = 0; i <= n * 2; i++) { const px = i % 2 ? x + w * 0.78 : x + w * 0.22, py = top0 + (bot - top0) * i / (n * 2); i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
      g.fillStyle = m.c1; g.fillRect(x, y, w, h * 0.38);
      break;
    }
    default: {
      // plain: a soft shine on top and a little shade underneath, like the sprites
      g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.ellipse(x + w * 0.35, y + h * 0.22, w * 0.22, h * 0.09, -0.3, 0, TAU); g.fill();
      g.fillStyle = "rgba(0,0,0,.09)"; g.fillRect(x, y + h * 0.82, w, h * 0.2);
    }
  }
}

let pixCache = new Map();
function pixelCanvas(px) {
  let c = pixCache.get(px);
  if (!c) {
    const n = pixRes(px);
    c = document.createElement("canvas"); c.width = c.height = n; const g = c.getContext("2d");
    for (let i = 0; i < n * n; i++) { const v = parseInt(px[i], 32); if (v) { g.fillStyle = PIXEL[v] || "#000"; g.fillRect(i % n, Math.floor(i / n), 1, 1); } }
    if (pixCache.size > 200) pixCache = new Map(); pixCache.set(px, c);
  }
  return c;
}
/* the top and bottom of a painted picture, column by column, so a drawn
   shape is stood on where it is drawn */
let profCache = new Map();
function pixProfile(px) {
  let p = profCache.get(px);
  if (!p) {
    const n = pixRes(px), top = [], bot = [];
    for (let x = 0; x < n; x++) {
      let t = -1, b = -1;
      for (let y = 0; y < n; y++) if (px[y * n + x] !== "0") { if (t < 0) t = y; b = y; }
      top.push(t); bot.push(b);
    }
    p = { n, top, bot }; if (profCache.size > 200) profCache = new Map(); profCache.set(px, p);
  }
  return p;
}

/* one material in its box, at time t */
function draw(g, m, x, y, w, h, t, o) {
  o = o || {}; t = t || 0;
  if (m.shape === "pixel") {
    // a coarse picture keeps its square pixels; a detailed one is drawn smooth
    const px = m.px || "0".repeat(64), s = g.imageSmoothingEnabled; g.imageSmoothingEnabled = pixRes(px) >= 32;
    g.drawImage(pixelCanvas(px), x, y, w, h); g.imageSmoothingEnabled = s; return;
  }
  const seed = o.seed || 1, ph = seed * 1.7, cx = x + w / 2, cy = y + h / 2;
  const joined = m.shape === "square" && o.nb && (o.nb.u || o.nb.d || o.nb.l || o.nb.r);
  g.save();
  // how it moves (a joined-up platform keeps still, only its pattern moves)
  if (!joined) {
    const a = m.anim, s = Math.sin(t * 5 + ph);
    if (a === "wobble") { g.translate(cx, y + h); g.scale(1 + 0.07 * s, 1 - 0.07 * s); g.translate(-cx, -(y + h)); }
    else if (a === "bob") g.translate(0, Math.sin(t * 3 + ph) * h * 0.08);
    else if (a === "pulse") { const k = 1 + 0.06 * Math.sin(t * 4 + ph); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy); }
    else if (a === "spin") { g.translate(cx, cy); g.rotate(t * 2); g.translate(-cx, -cy); }
  }
  if (o.hit > 0) { const k = o.hit; g.translate(cx, y + h); g.scale(1 + 0.18 * k, 1 - 0.3 * k); g.translate(-cx, -(y + h)); }
  const dark = shade(m.c1, -0.5);
  if (joined) {
    // reach a little into the neighbouring squares, so no hairline shows between them
    const nb0 = o.nb, e = 0.7, ex = x - (nb0.l ? e : 0), ey = y - (nb0.u ? e : 0), ew = w + (nb0.l ? e : 0) + (nb0.r ? e : 0), eh = h + (nb0.u ? e : 0) + (nb0.d ? e : 0);
    g.save(); g.beginPath(); g.rect(ex, ey, ew, eh); g.clip();
    g.fillStyle = m.c1; g.fillRect(ex, ey, ew, eh); pattern(g, m, x, y, w, h, t, o); g.restore();
    // an outline only where the platform ends
    g.strokeStyle = dark; g.lineWidth = LW; g.lineCap = "square"; g.beginPath();
    const i = LW / 2, nb = o.nb;
    if (!nb.u) { g.moveTo(x, y + i); g.lineTo(x + w, y + i); }
    if (!nb.d) { g.moveTo(x, y + h - i); g.lineTo(x + w, y + h - i); }
    if (!nb.l) { g.moveTo(x + i, y); g.lineTo(x + i, y + h); }
    if (!nb.r) { g.moveTo(x + w - i, y); g.lineTo(x + w - i, y + h); }
    g.stroke();
  } else {
    // outline first, twice as thick, then the fill over its inner half: one
    // clean edge round the outside, even for clouds made of circles
    const inset = LW / 2, ix = x + inset, iy = y + inset, iw = w - LW, ih = h - LW;
    path(g, m.shape, ix, iy, iw, ih); g.lineJoin = "round"; g.lineWidth = LW * 2; g.strokeStyle = dark; g.stroke();
    g.fillStyle = m.c1; g.fill();
    g.save(); path(g, m.shape, ix, iy, iw, ih); g.clip(); pattern(g, m, ix, iy, iw, ih, t, o); g.restore();
  }
  if (m.anim === "sparkle") {
    const r = rnd(seed + 3);
    for (let k = 0; k < 2; k++) {
      const sx = x + w * (0.2 + r() * 0.6), sy = y + h * (0.15 + r() * 0.5), a = Math.max(0, Math.sin(t * 3 + k * 2.1 + ph));
      if (a < 0.05) continue;
      g.globalAlpha = a; g.fillStyle = "#fff"; const s = 2.6 * a + 0.8;
      g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.3, sy - s * 0.3); g.lineTo(sx + s, sy); g.lineTo(sx + s * 0.3, sy + s * 0.3);
      g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.3, sy + s * 0.3); g.lineTo(sx - s, sy); g.lineTo(sx - s * 0.3, sy - s * 0.3); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
  }
  g.restore();
}

/* the top and bottom of a shape at x (null outside it) */
function topAt(shape, x0, y0, w, h, x, m) {
  if (x < x0 - 0.01 || x > x0 + w + 0.01) return null;
  if (shape === "pixel") { const p = pixProfile(m.px || ""), c = Math.max(0, Math.min(p.n - 1, Math.floor((x - x0) / w * p.n))); return p.top[c] < 0 ? null : y0 + p.top[c] / p.n * h; }
  const cx = x0 + w / 2, dx = Math.min(1, Math.abs(x - cx) / (w / 2));
  switch (shape) {
    case "circle": case "star": case "heart": return y0 + h / 2 - h / 2 * Math.sqrt(1 - dx * dx);
    case "half": { const u = 1 - dx; return y0 + h - h * u * u * (3 - 2 * u); }
    case "triangle": return y0 + h * dx;
    case "rampR": return y0 + h * (1 - (x - x0) / w);
    case "rampL": return y0 + h * (x - x0) / w;
    case "diamond": return y0 + h / 2 * dx;
    case "spikes": return y0 + h * 0.15;
    case "cloud": case "bush": return y0 + h * 0.1;
    default: return y0;
  }
}
function bottomAt(shape, x0, y0, w, h, x, m) {
  if (x < x0 - 0.01 || x > x0 + w + 0.01) return null;
  if (shape === "pixel") { const p = pixProfile(m.px || ""), c = Math.max(0, Math.min(p.n - 1, Math.floor((x - x0) / w * p.n))); return p.bot[c] < 0 ? null : y0 + (p.bot[c] + 1) / p.n * h; }
  const cx = x0 + w / 2, dx = Math.min(1, Math.abs(x - cx) / (w / 2));
  switch (shape) {
    case "circle": case "star": case "heart": return y0 + h / 2 + h / 2 * Math.sqrt(1 - dx * dx);
    case "diamond": return y0 + h - h / 2 * dx;
    default: return y0 + h;
  }
}

window.LEVELART = { draw, path, topAt, bottomAt, shade, pixelCanvas, pixRes, COLORS, SHAPES, PATTERNS, ANIMS, PIXEL, FLAT };
})();
