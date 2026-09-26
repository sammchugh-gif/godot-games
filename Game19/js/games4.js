// Meltdown mini-games, part four: Gadget Case, Dance Floor, Skydive,
// Tightrope, Heli Lander and Cooling Tower.
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";
import { SFX, tone, noise } from "./audio.js";
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";
import { PAL, card, tile, shade, glow, bar, icon, person2D, ease } from "./fx.js";
import { RORY } from "./games1.js";

const where = m => (m.id || "").slice(0, 3);
// big hold-down zones for the thumb games: { id: rect }
function zoneAt(zones, x, y) { for (const k in zones) { const r = zones[k]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return k; } return null; }
function drawZone(g, r, label, on, s, col) {
  g.save(); g.globalAlpha = on ? 0.9 : 0.55;
  g.fillStyle = on ? (col || PAL.ice) : "rgba(6,14,26,.7)"; rrect(g, r.x, r.y, r.w, r.h, 22 * s); g.fill();
  g.strokeStyle = col || PAL.ice; g.lineWidth = 3 * s; g.stroke();
  text(g, label, r.x + r.w / 2, r.y + r.h / 2 + 2 * s, Math.min(r.h * 0.42, 34 * s), on ? "#06101c" : "#fff", "center", 900);
  g.restore();
}

// =============================================================== GADGET CASE
// Fit every gadget into the case. Tap a gadget to turn it.
const GADGETS = ["drone", "camera", "key", "bolt", "snowflake", "gear", "eye", "star"];
class Packing extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "vault"; this.icon = "key";
    this.instr = "Drag the gadgets into the case. Tap one to turn it round. Fill the whole case!";
    [this.cw, this.ch] = L(this, [4, 3], [4, 4], [5, 4], [5, 5]); this.k = L(this, 3, 4, 5, 6);
    this.make(); this.drag = null;
  }
  norm(cells) { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(c => [c[0] - mx, c[1] - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); }
  rot(cells) { return this.norm(cells.map(([x, y]) => [-y, x])); }
  make() {
    const W = this.cw, H = this.ch, k = this.k;
    for (let tries = 0; tries < 500; tries++) {
      const own = new Array(W * H).fill(-1), seeds = shuffle([...Array(W * H).keys()]).slice(0, k);
      seeds.forEach((c, i) => { own[c] = i; });
      let guard = 0;
      while (own.includes(-1) && guard++ < 500) {
        const sizes = new Array(k).fill(0); own.forEach(o => { if (o >= 0) sizes[o]++; });
        const order = [...Array(k).keys()].sort((a, b) => sizes[a] - sizes[b] + (Math.random() - 0.5) * 2);
        let grown = false;
        for (const i of order) {
          const edge = []; own.forEach((o, c) => { if (o !== i) return; const x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && own[ny * W + nx] === -1) edge.push(ny * W + nx); } });
          if (edge.length) { own[pick(edge)] = i; grown = true; break; }
        }
        if (!grown) break;
      }
      if (own.includes(-1)) continue;
      const pieces = []; let ok = true;
      for (let i = 0; i < k; i++) { const cells = []; own.forEach((o, c) => { if (o === i) cells.push([c % W, (c / W) | 0]); }); if (cells.length < 2 || cells.length > 6) { ok = false; break; } const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); pieces.push({ sol: this.norm(cells), solAt: [mx, my] }); }
      if (!ok) continue;
      this.pieces = pieces.map((p, i) => {
        let cells = p.sol, turns = this.level >= 2 ? rint(0, 3) : 0; for (let t = 0; t < turns; t++) cells = this.rot(cells);
        return Object.assign(p, { cells, at: null, color: PAL.pieces[i % 8], icon: GADGETS[i % GADGETS.length], tray: i, dx: 0, dy: 0, spin: 0 });
      });
      return;
    }
  }
  fits(p, cells, ax, ay) {
    for (const [x, y] of cells) { const X = ax + x, Y = ay + y; if (X < 0 || Y < 0 || X >= this.cw || Y >= this.ch) return false; for (const q of this.pieces) if (q !== p && q.at && q.cells.some(([qx, qy]) => q.at[0] + qx === X && q.at[1] + qy === Y)) return false; }
    return true;
  }
  full() { let n = 0; for (const p of this.pieces) if (p.at) n += p.cells.length; return n === this.cw * this.ch; }
  trayPos(p) { const L2 = this.lay; const i = p.tray, col = i % 2, row = (i / 2) | 0; return [L2.tx + col * L2.tw / 2 + 10 * this.s, L2.ty + row * L2.rowH]; }
  pieceAt(x, y) {
    const c = this.lay.cell;
    for (let i = this.pieces.length - 1; i >= 0; i--) { const p = this.pieces[i], [ox, oy] = this.origin(p); const sc = p.at ? 1 : this.lay.ts; if (p.cells.some(([cx, cy]) => x >= ox + cx * c * sc && x <= ox + (cx + 1) * c * sc && y >= oy + cy * c * sc && y <= oy + (cy + 1) * c * sc)) return p; }
    return null;
  }
  origin(p) { const Ly = this.lay; if (this.drag && this.drag.p === p) return [this.drag.x - this.drag.ox, this.drag.y - this.drag.oy]; if (p.at) return [Ly.bx + p.at[0] * Ly.cell, Ly.by + p.at[1] * Ly.cell]; return this.trayPos(p); }
  down(x, y, id) {
    if (this.done || !this.lay) return;
    const p = this.pieceAt(x, y); if (!p) return;
    const [ox, oy] = this.origin(p), sc = p.at ? 1 : this.lay.ts;
    this.drag = { id, p, x, y, x0: x, y0: y, ox: (x - ox) / sc, oy: (y - oy) / sc, from: p.at };
    this.pieces.splice(this.pieces.indexOf(p), 1); this.pieces.push(p); SFX.click();
  }
  move(x, y, id) { if (this.drag && this.drag.id === id) { this.drag.x = x; this.drag.y = y; } }
  up(x, y, id) {
    const d = this.drag; if (!d || d.id !== id) return; this.drag = null;
    const p = d.p, moved = Math.hypot(x - d.x0, y - d.y0) > 10 * this.s;
    if (!moved) { if (this.level >= 2 || true) this.turn(p); return; }
    const Ly = this.lay, ax = Math.round((x - d.ox - Ly.bx) / Ly.cell), ay = Math.round((y - d.oy - Ly.by) / Ly.cell);
    if (this.fits(p, p.cells, ax, ay)) { p.at = [ax, ay]; SFX.clunk(); this.fx.ring(Ly.bx + (ax + 0.5) * Ly.cell, Ly.by + (ay + 0.5) * Ly.cell, p.color, 50, 0.4); this.check(); }
    else { p.at = null; SFX.back(); }
  }
  turn(p) {
    const cells = this.rot(p.cells);
    if (p.at) { if (this.fits(p, cells, p.at[0], p.at[1])) { p.cells = cells; } else { p.cells = cells; p.at = null; } }
    else p.cells = cells;
    p.spin = -Math.PI / 2; SFX.snap(); this.check();
  }
  check() { if (this.full() && !this.done) { this.win(); } }
  tick(dt) { for (const p of this.pieces) p.spin = Math.min(0, p.spin + dt * 10); }
  hint() { const p = this.pieces.find(q => !q.at || q.at[0] !== q.solAt[0] || q.at[1] !== q.solAt[1] || q.cells.join() !== q.sol.join()); if (!p) return ""; this.hintT = 6; this.hintP = p; return "The dotted outline shows where the flashing gadget fits."; }
  solve() {
    const wrong = this.pieces.find(q => q.at && (q.at[0] !== q.solAt[0] || q.at[1] !== q.solAt[1] || q.cells.join() !== q.sol.join())); if (wrong) { wrong.at = null; return; }
    const p = this.pieces.find(q => !q.at); if (!p) return;
    p.cells = p.sol; p.at = p.solAt.slice(); this.check();
  }
  drawPiece(g, p, ox, oy, c, s, a) {
    g.save(); g.globalAlpha = a === undefined ? 1 : a;
    const cx = ox + (Math.max(...p.cells.map(q => q[0])) + 1) * c / 2, cy = oy + (Math.max(...p.cells.map(q => q[1])) + 1) * c / 2;
    if (p.spin) { g.translate(cx, cy); g.rotate(p.spin); g.translate(-cx, -cy); }
    for (const [x, y] of p.cells) tile(g, ox + x * c + 2 * s, oy + y * c + 2 * s, c - 4 * s, c - 4 * s, s, { color: p.color, r: 8 });
    // join neighbouring squares so a gadget reads as one piece
    g.fillStyle = p.color; for (const [x, y] of p.cells) { if (p.cells.some(q => q[0] === x + 1 && q[1] === y)) g.fillRect(ox + (x + 1) * c - 6 * s, oy + y * c + 8 * s, 12 * s, c - 20 * s); if (p.cells.some(q => q[0] === x && q[1] === y + 1)) g.fillRect(ox + x * c + 8 * s, oy + (y + 1) * c - 8 * s, c - 16 * s, 12 * s); }
    const [fx, fy] = p.cells[0]; icon(g, p.icon, ox + (fx + 0.5) * c, oy + (fy + 0.45) * c, c * 0.45, "rgba(255,255,255,.9)");
    g.restore();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const top = 86 * s, bot = H - 60 * s, split = W * 0.55;
    const cell = Math.min((split - 80 * s) / this.cw, (bot - top) / this.ch, 110 * s);
    const bx = 40 * s + (split - 80 * s - cell * this.cw) / 2, by = top + (bot - top - cell * this.ch) / 2;
    const tx = split + 10 * s, tw = W - split - 30 * s, rows = Math.ceil(this.pieces.length / 2), rowH = (bot - top) / rows;
    const maxW = Math.max(...this.pieces.map(p => Math.max(...p.cells.map(q => q[0])) + 1), 1), maxH = Math.max(...this.pieces.map(p => Math.max(...p.cells.map(q => q[1])) + 1), 1);
    const ts = Math.min(1, (tw / 2 - 20 * s) / (maxW * cell), (rowH - 10 * s) / (maxH * cell));
    this.lay = { bx, by, cell, tx, ty: top, tw, rowH, ts };
    // the case
    g.fillStyle = "#2a2014"; rrect(g, bx - 24 * s, by - 24 * s, cell * this.cw + 48 * s, cell * this.ch + 48 * s, 20 * s); g.fill();
    g.fillStyle = "#c0c4cc"; for (const [x, y] of [[bx - 16 * s, by - 16 * s], [bx + cell * this.cw + 16 * s, by - 16 * s], [bx - 16 * s, by + cell * this.ch + 16 * s], [bx + cell * this.cw + 16 * s, by + cell * this.ch + 16 * s]]) { g.beginPath(); g.arc(x, y, 5 * s, 0, TAU); g.fill(); }
    for (let y = 0; y < this.ch; y++) for (let x = 0; x < this.cw; x++) { g.fillStyle = "#1a1a24"; rrect(g, bx + x * cell + 3 * s, by + y * cell + 3 * s, cell - 6 * s, cell - 6 * s, 8 * s); g.fill(); g.fillStyle = "rgba(255,255,255,.03)"; for (let k = 0; k < 3; k++) g.fillRect(bx + x * cell + 8 * s, by + y * cell + (10 + k * 12) * s, cell - 16 * s, 4 * s); }
    card(g, tx - 8 * s, top - 8 * s, tw + 16 * s, bot - top + 16 * s, s, { bg: "rgba(8,16,28,.6)", title: "GADGETS" });
    if (this.hintT > 0 && this.hintP) { const p = this.hintP; g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.setLineDash([7 * s, 6 * s]); for (const [x, y] of p.sol) g.strokeRect(bx + (p.solAt[0] + x) * cell + 5 * s, by + (p.solAt[1] + y) * cell + 5 * s, cell - 10 * s, cell - 10 * s); g.setLineDash([]); }
    for (const p of this.pieces) {
      const [ox, oy] = this.origin(p), dragging = this.drag && this.drag.p === p, sc = p.at || dragging ? 1 : ts;
      if (dragging) { g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 20 * s; }
      this.drawPiece(g, p, ox, oy, cell * sc, s * sc, this.hintT > 0 && p === this.hintP ? 0.6 + 0.4 * Math.sin(this.t * 10) : 1);
      if (dragging) g.restore();
    }
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== DANCE FLOOR
// Tap the pads in time with the arrows to blend in on the dance floor.
const LANE_COL = ["#ff4ad8", "#40e0d0", "#ffd23f", "#7bed9f"], LANE_NOTE = [0, 3, 5, 7];
class Dance extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = { kor: "neon", ind: "jungle", ere: "volcano" }[where(m)] || "neon"; this.icon = "star";
    this.instr = "Tap a pad just as its arrow reaches the line. Fill the BLEND IN meter!";
    this.lanes = L(this, 2, 3, 4, 4); this.bpm = L(this, 88, 100, 114, 128); this.win2 = L(this, 0.22, 0.19, 0.16, 0.14);
    this.slipAllow = L(this, 6, 6, 8, 8); this.meter = 0.3; this.notes = []; this.beat = -1; this.songT = -1.5; this.auto = false; this.pose = 0; this.combo = 0;
    this.lead = 1.8; this.gen = 0; this.pressed = new Array(4).fill(0);
  }
  spb() { return 60 / this.bpm; }
  genNotes() {
    // write the next bar of notes ahead of the music
    const spb = this.spb(); while (this.gen * spb < this.songT + this.lead + 2) {
      const b = this.gen++, t = b * spb; if (b < 2) continue;
      const dens = L(this, 0.55, 0.62, 0.7, 0.78);
      if (Math.random() < dens) { const ln = rint(0, this.lanes - 1); this.notes.push({ t, ln }); if (this.level >= 4 && Math.random() < 0.2) this.notes.push({ t, ln: (ln + rint(1, this.lanes - 1)) % this.lanes }); }
      if (this.level >= 3 && Math.random() < 0.25) this.notes.push({ t: t + spb / 2, ln: rint(0, this.lanes - 1) });
    }
  }
  hit(ln) {
    if (this.done) return;
    this.pressed[ln] = 0.15;
    const n = this.notes.filter(q => q.ln === ln && !q.hit && !q.gone).sort((a, b) => Math.abs(a.t - this.songT) - Math.abs(b.t - this.songT))[0];
    if (n && Math.abs(n.t - this.songT) < this.win2) {
      n.hit = true; const perfect = Math.abs(n.t - this.songT) < this.win2 * 0.45; this.combo++;
      this.meter = Math.min(1, this.meter + (perfect ? 0.075 : 0.055)); const f = 262 * Math.pow(2, LANE_NOTE[ln] / 12); tone(f, f, 0.14, "triangle", 0.15);
      const [x, y] = this.padXY(ln); this.fx.burst(x, this.hitY, LANE_COL[ln], perfect ? 16 : 8, 260 * this.s, { gravity: 200 * this.s, life: 0.5 }); this.fx.float(x, this.hitY - 50 * this.s, perfect ? "PERFECT!" : "GOOD", perfect ? PAL.gold : LANE_COL[ln], perfect ? 22 : 18, 0.7);
      this.pose = (this.pose + 1) % 4;
      if (this.meter >= 1) this.win();
    } else { this.meter = Math.max(0, this.meter - 0.03); this.combo = 0; }
  }
  padXY(ln) { const pw = Math.min(150 * this.s, (this.W * 0.62) / this.lanes), x0 = this.W / 2 - pw * this.lanes / 2; return [x0 + (ln + 0.5) * pw, this.H - 70 * this.s, pw]; }
  down(x, y) { if (!this.W) return; for (let ln = 0; ln < this.lanes; ln++) { const [px, , pw] = this.padXY(ln); if (Math.abs(x - px) < pw / 2 && y > this.H * 0.35) { this.hit(ln); return; } } }
  tick(dt) {
    this.songT += dt; this.genNotes();
    for (let i = 0; i < 4; i++) this.pressed[i] = Math.max(0, this.pressed[i] - dt);
    for (const k of ["KeyD", "KeyF", "KeyJ", "KeyK"].slice(0, this.lanes).map((c, i) => [c, i])) if (this.keyHit(k[0])) this.hit(k[1]);
    const spb = this.spb(), b = Math.floor(this.songT / spb);
    if (b !== this.beat && this.songT >= 0 && !this.done) { this.beat = b; tone(130, 45, 0.16, "sine", 0.45); if (b % 2) noise(0.05, 0.12, 0, 7000); this.bounce = 1; }
    this.bounce = Math.max(0, (this.bounce || 0) - dt * 4);
    for (const n of this.notes) if (!n.hit && !n.gone && this.songT - n.t > this.win2) { n.gone = true; this.miss(); this.combo = 0; this.meter = Math.max(0, this.meter - 0.04); }
    this.notes = this.notes.filter(n => this.songT - n.t < 1);
    if (this.auto) for (const n of this.notes) if (!n.hit && !n.gone && Math.abs(n.t - this.songT) < this.win2 * 0.3) this.hit(n.ln);
  }
  hint() { this.hintT = 5; return "Don't tap early. Wait until the arrow is right on the white line, then tap."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const hitY = this.hitY = H - 150 * s, speed = (hitY - 80 * s) / this.lead;
    // spotlights
    for (let i = 0; i < 3; i++) { const a = Math.sin(this.t * 0.8 + i * 2) * 0.5; g.save(); g.translate(W * (0.2 + i * 0.3), 0); g.rotate(a); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, LANE_COL[i] + "55"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(-20 * s, 0); g.lineTo(20 * s, 0); g.lineTo(160 * s, H); g.lineTo(-160 * s, H); g.fill(); g.restore(); }
    // the crowd, bobbing on the beat
    for (let i = 0; i < 14; i++) { const x = (i + 0.5) * W / 14, y = H * 0.6 + (i % 3) * 14 * s - (this.bounce || 0) * 10 * s * ((i % 2) ? 1 : 0.5); g.fillStyle = "rgba(0,0,0,.55)"; g.beginPath(); g.arc(x, y - 58 * s, 16 * s, 0, TAU); g.fill(); rrect(g, x - 22 * s, y - 44 * s, 44 * s, 90 * s, 14 * s); g.fill(); if (i % 3 === 0) { g.fillRect(x - 30 * s, y - 90 * s + Math.sin(this.t * 6 + i) * 6 * s, 6 * s, 50 * s); } }
    // Rory on the stage
    const arms = ["up", "wave", "point", "down"][this.pose];
    person2D(g, W / 2, H * 0.5 - (this.bounce || 0) * 12 * s, 190 * s, Object.assign({}, RORY, { coat: "#1a1a24", tie: "#ff4ad8", sunglasses: true }), { arms, face: "smile", facing: this.pose % 2 ? -1 : 1, lean: Math.sin(this.beat * 1.7) * 0.1 });
    // lanes and notes
    for (let ln = 0; ln < this.lanes; ln++) {
      const [x, py, pw] = this.padXY(ln);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x - pw / 2 + 6 * s, 70 * s, pw - 12 * s, hitY - 70 * s + 40 * s);
      g.strokeStyle = LANE_COL[ln] + "66"; g.lineWidth = 2 * s; g.strokeRect(x - pw / 2 + 6 * s, 70 * s, pw - 12 * s, hitY - 70 * s + 40 * s);
      for (const n of this.notes) {
        if (n.ln !== ln || n.hit) continue;
        const y = hitY - (n.t - this.songT) * speed; if (y < 60 * s || y > H) continue;
        g.globalAlpha = n.gone ? 0.3 : 1; g.save(); g.translate(x, y); g.rotate([Math.PI, 0, -Math.PI / 2, Math.PI / 2][ln]);
        g.shadowColor = LANE_COL[ln]; g.shadowBlur = 16 * s; g.fillStyle = LANE_COL[ln];
        const z = pw * 0.32; g.beginPath(); g.moveTo(z, 0); g.lineTo(0, -z); g.lineTo(0, -z * 0.45); g.lineTo(-z, -z * 0.45); g.lineTo(-z, z * 0.45); g.lineTo(0, z * 0.45); g.lineTo(0, z); g.closePath(); g.fill();
        g.restore(); g.globalAlpha = 1;
      }
      // the pad
      const on = this.pressed[ln] > 0; tile(g, x - pw / 2 + 8 * s, py - 50 * s, pw - 16 * s, 96 * s, s, { color: on ? LANE_COL[ln] : shade(LANE_COL[ln], -0.55), pressed: on, r: 16, glow: on ? LANE_COL[ln] : null });
      if (this.lanes <= 4) text(g, ["D", "F", "J", "K"][ln], x, py + 30 * s, 12 * s, "rgba(255,255,255,.5)", "center", 800, MONO);
    }
    g.strokeStyle = "#fff"; g.lineWidth = 4 * s; const [xa, , pwa] = this.padXY(0), [xb, , pwb] = this.padXY(this.lanes - 1); g.beginPath(); g.moveTo(xa - pwa / 2, hitY); g.lineTo(xb + pwb / 2, hitY); g.stroke();
    if (this.hintT > 0) { g.fillStyle = "rgba(255,209,102,.25)"; g.fillRect(xa - pwa / 2, hitY - this.win2 * speed, xb - xa + pwa, this.win2 * 2 * speed); }
    // the meter
    const mx = W - 60 * s; g.fillStyle = "rgba(255,255,255,.12)"; rrect(g, mx, 80 * s, 26 * s, H - 250 * s, 13 * s); g.fill();
    const mh = (H - 250 * s) * this.meter, gr = g.createLinearGradient(0, 80 * s + H - 250 * s - mh, 0, H - 170 * s); gr.addColorStop(0, PAL.ok); gr.addColorStop(1, "#ff4ad8");
    g.fillStyle = gr; rrect(g, mx, 80 * s + (H - 250 * s) - mh, 26 * s, mh, 13 * s); g.fill();
    g.save(); g.translate(mx - 14 * s, 80 * s + (H - 250 * s) / 2); g.rotate(-Math.PI / 2); text(g, "BLEND IN", 0, 0, 13 * s, PAL.snow, "center", 900, MONO); g.restore();
    if (this.combo >= 3) text(g, `${this.combo} IN A ROW!`, W / 2, 96 * s, 22 * s, PAL.gold, "center", 900);
    if (this.songT < 0) text(g, String(Math.ceil(-this.songT)), W / 2, H * 0.3, 80 * s, PAL.snow, "center", 900);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== SKYDIVE
// Steer your parachute onto the landing pad, against the wind.
class Skydive extends MG {
  constructor(G, m) {
    super(G, m);
    this.place = { dub: "tower", kor: "tower", ere: "volcano" }[where(m)] || "tower";
    this.theme = this.place === "volcano" ? "volcano" : "sky"; this.icon = "star"; this.slipAllow = 1;
    this.instr = "Hold the left or right side to steer. Watch the wind! Land on the pad.";
    this.need = L(this, 2, 2, 3, 3); this.got = 0; this.padW = L(this, 230, 190, 160, 130); this.windMax = L(this, 25, 55, 85, 110); this.movePad = L(this, 0, 0, 0, 40);
    this.hold = {}; this.auto = false; this.jump();
  }
  jump() { this.x = rnd(0.2, 0.8); this.y = 0; this.vx = 0; this.wind = rnd(-1, 1) * this.windMax; this.padX = rnd(0.25, 0.75); this.landT = 0; this.ph = rnd(0, TAU); this.fall = L(this, 0.1, 0.105, 0.11, 0.115); }
  windNow() { return this.wind + Math.sin(this.t * 0.9 + this.ph) * this.windMax * 0.5; }
  padNow() { return this.padX * this.W + Math.sin(this.t * 0.7) * this.movePad * this.s; }
  down(x, y, id) { this.hold[id] = x < this.W / 2 ? -1 : 1; }
  up(x, y, id) { delete this.hold[id]; }
  tick(dt) {
    if (this.done) return;
    if (this.landT > 0) { this.landT -= dt; if (this.landT <= 0) this.jump(); return; }
    const s = this.s, W = this.W; let steer = 0; for (const k in this.hold) steer += this.hold[k]; if (this.keyDown("ArrowLeft")) steer -= 1; if (this.keyDown("ArrowRight")) steer += 1;
    const gy = this.H - 120 * s, px = this.padNow();
    if (this.auto) { const tl = Math.max(0.3, (1 - this.y) / this.fall), want = (px - this.x * W) / tl - this.windNow() * s; steer = clamp((want - this.vx) / (60 * s), -1, 1); }
    steer = clamp(steer, -1, 1);
    this.vx += (steer * 260 * s - this.vx * 0.9) * dt; const wx = this.windNow() * s;
    this.x = clamp(this.x + (this.vx + wx) * dt / W, 0.03, 0.97); this.y += this.fall * dt; this.steer = steer;
    if (this.y >= 1) {
      const d = Math.abs(this.x * W - px);
      if (d < this.padW * s / 2) {
        this.got++; const bull = d < this.padW * s * 0.12; SFX.good(); this.pop(this.x * W, gy, bull ? PAL.gold : PAL.ok); this.fx.float(this.x * W, gy - 80 * s, bull ? "BULLSEYE!" : "ON THE PAD!", bull ? PAL.gold : PAL.ok, 26);
        if (this.got >= this.need) this.win(); else this.landT = 1.4;
      } else { this.say("Missed the pad! Up you go again.", false); this.landT = 1.6; }
      this.y = 1;
    }
  }
  hint() { this.hintT = 5; return "The wind pushes you sideways. Steer against it early, while you're still high up."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const gy = H - 120 * s, px = this.padNow(), pw = this.padW * s, y = 90 * s + this.y * (gy - 90 * s - 60 * s);
    // clouds rushing up past you
    for (let i = 0; i < 7; i++) { const cy = ((i * 170 * s - this.y * 900 * s) % (H + 200 * s) + H + 200 * s) % (H + 200 * s) - 100 * s, cx = (i * 263 * s) % W; g.fillStyle = "rgba(255,255,255,.14)"; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx + k * 40 * s, cy + (k % 2) * 10 * s, 70 * s, 26 * s, 0, 0, TAU); g.fill(); } }
    // the ground far below
    if (this.place === "volcano") { g.fillStyle = "#2a1410"; g.beginPath(); g.moveTo(0, H); g.lineTo(0, gy + 30 * s); g.lineTo(px - pw * 1.2, gy); g.lineTo(px + pw * 1.2, gy); g.lineTo(W, gy + 40 * s); g.lineTo(W, H); g.fill(); glow(g, px + pw * 2, gy + 60 * s, 140 * s, "rgba(255,90,20,.6)"); }
    else { for (let i = 0; i < 12; i++) { const bx = i * W / 12, bh = (60 + (i * 37) % 90) * s; g.fillStyle = "rgba(20,40,70,.5)"; g.fillRect(bx, gy + 20 * s - bh * 0.3, W / 12 - 4 * s, H); } g.fillStyle = "#4a5a6a"; g.fillRect(px - pw * 0.7, gy, pw * 1.4, H - gy); }
    // the pad
    g.fillStyle = "#2a3040"; rrect(g, px - pw / 2, gy - 8 * s, pw, 16 * s, 8 * s); g.fill();
    g.fillStyle = PAL.gold; rrect(g, px - pw / 2, gy - 12 * s, pw, 8 * s, 4 * s); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 3 * s; g.beginPath(); g.ellipse(px, gy - 8 * s, pw * 0.12, 5 * s, 0, 0, TAU); g.stroke();
    text(g, "H", px, gy + 26 * s, 20 * s, "#fff", "center", 900);
    // wind
    const w = this.windNow(), wa = Math.abs(w) / Math.max(1, this.windMax);
    card(g, W / 2 - 110 * s, 64 * s, 220 * s, 56 * s, s, { title: "WIND" });
    for (let k = 0; k < Math.max(1, Math.round(wa * 3)); k++) { const ax = W / 2 + (k - 1) * 30 * s; g.fillStyle = PAL.ice; g.save(); g.translate(ax, 102 * s); g.scale(Math.sign(w) || 1, 1); g.beginPath(); g.moveTo(12 * s, 0); g.lineTo(-6 * s, -9 * s); g.lineTo(-6 * s, 9 * s); g.closePath(); g.fill(); g.restore(); }
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 2 * s; for (let i = 0; i < 8; i++) { const sx = ((i * 157 * s + this.t * w * s * 3) % W + W) % W, sy = 150 * s + (i * 83 * s) % (H * 0.6); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.sign(w) * 40 * s, sy); g.stroke(); }
    // Rory and the parachute
    const rx = this.x * W, tilt = (this.steer || 0) * 0.25 + w / 400;
    g.save(); g.translate(rx, y); g.rotate(tilt);
    g.fillStyle = "rgba(0,0,0,.2)"; g.beginPath(); g.arc(0, -86 * s + 4 * s, 70 * s, Math.PI, 0); g.fill();
    for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? "#fff" : PAL.lava; g.beginPath(); g.moveTo(0, -86 * s); g.arc(0, -86 * s, 70 * s, Math.PI + k * Math.PI / 5, Math.PI + (k + 1) * Math.PI / 5); g.closePath(); g.fill(); }
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5 * s; for (const lx of [-66, -30, 30, 66]) { g.beginPath(); g.moveTo(lx * s, -86 * s); g.lineTo(0, -10 * s); g.stroke(); }
    person2D(g, 0, 40 * s, 60 * s, RORY, { arms: "up", face: this.landT > 0 ? "smile" : "smile" });
    g.restore();
    if (this.hintT > 0) { g.strokeStyle = PAL.gold; g.setLineDash([6 * s, 6 * s]); g.lineWidth = 2 * s; g.beginPath(); g.moveTo(rx, y + 40 * s); g.lineTo(px, gy - 12 * s); g.stroke(); g.setLineDash([]); }
    // steering zones
    drawZone(g, { x: 16 * s, y: H - 100 * s, w: 120 * s, h: 70 * s }, "◀", (this.steer || 0) < -0.2, s);
    drawZone(g, { x: W - 136 * s, y: H - 100 * s, w: 120 * s, h: 70 * s }, "▶", (this.steer || 0) > 0.2, s);
    card(g, 20 * s, 64 * s, 130 * s, 70 * s, s, { title: "LANDINGS" }); text(g, `${this.got} / ${this.need}`, 85 * s, 110 * s, 24 * s, PAL.snow, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== TIGHTROPE
// Keep your balance on the wire. Hold the side you want to lean towards.
class Tightrope extends MG {
  constructor(G, m) {
    super(G, m);
    this.place = { dub: "towers", nep: "gorge", pen: "crevasse" }[where(m)] || "towers";
    this.theme = this.place === "towers" ? "desert" : "snow"; this.icon = "star"; this.slipAllow = 1;
    this.instr = "Rory walks by himself. Hold left or right to push his pole and keep him upright!";
    this.pos = 0; this.th = rnd(-0.05, 0.05); this.w = 0; this.speed = L(this, 0.07, 0.064, 0.058, 0.054); this.unstable = L(this, 1.3, 1.6, 1.9, 2.2);
    this.gustEvery = L(this, 99, 4.5, 3.4, 2.6); this.gustT = 3; this.gust = 0; this.gustDir = 0; this.warn = 0; this.hold = {}; this.wobble = 0; this.auto = false;
  }
  down(x, y, id) { this.hold[id] = x < this.W / 2 ? -1 : 1; }
  up(x, y, id) { delete this.hold[id]; }
  tick(dt) {
    if (this.done) return;
    if (this.wobble > 0) { this.wobble -= dt; this.th *= 0.9; this.w = 0; if (this.wobble <= 0) this.th = 0; return; }
    let u = 0; for (const k in this.hold) u += this.hold[k]; if (this.keyDown("ArrowLeft")) u -= 1; if (this.keyDown("ArrowRight")) u += 1;
    if (this.auto) u = clamp(-(this.th * 5 + this.w * 1.6) + (this.gust ? -this.gustDir * 0.6 : 0), -1, 1);
    u = clamp(u, -1, 1); this.u = u;
    this.gustT -= dt;
    if (this.gustT <= 0 && !this.warn && !this.gust) { this.warn = 1.0; this.gustDir = Math.random() < 0.5 ? -1 : 1; }
    if (this.warn) { this.warn -= dt; if (this.warn <= 0) { this.warn = 0; this.gust = 1.2; SFX.whoosh(); } }
    if (this.gust) { this.gust = Math.max(0, this.gust - dt); if (!this.gust) this.gustT = this.gustEvery * rnd(0.7, 1.3); }
    const gustF = this.gust ? this.gustDir * L(this, 0, 1.0, 1.4, 1.8) : 0;
    const acc = this.unstable * Math.sin(this.th) + u * 2.6 + gustF + Math.sin(this.t * 1.3) * 0.15 - this.w * 0.6;
    this.w += acc * dt; this.th += this.w * dt;
    if (Math.abs(this.th) > 0.85) { this.wobble = 1.2; this.miss(); SFX.bad(); this.msg = { text: "Whoa! Rory grabs the wire...", t: 1.4, t0: 1.4, good: false }; this.fx.shake(6, 0.3); this.pos = Math.max(0, this.pos - 0.05); return; }
    this.pos += this.speed * dt * (1 - Math.min(0.7, Math.abs(this.th))); this.step = (this.step || 0) + dt * 5;
    if (this.pos >= 1) { this.pos = 1; this.win(); }
  }
  hint() { this.hintT = 5; return "Tiny pushes work best. When you see the wind arrow, get ready to push the other way."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const wy = H * 0.62, x0 = 60 * s, x1 = W - 60 * s;
    // what's below
    if (this.place === "towers") { for (let i = 0; i < 10; i++) { const bx = i * W / 10, bh = H * (0.2 + (i * 37 % 30) / 100); g.fillStyle = "rgba(40,20,8,.5)"; g.fillRect(bx, H - bh * 0.6, W / 10 - 6 * s, H); } }
    else { g.fillStyle = this.place === "gorge" ? "#5a6a80" : "#9fd6f4"; g.beginPath(); g.moveTo(0, wy + 20 * s); g.lineTo(x0 + 40 * s, wy + 20 * s); g.lineTo(x0 + 80 * s, H); g.lineTo(0, H); g.fill(); g.beginPath(); g.moveTo(W, wy + 20 * s); g.lineTo(x1 - 40 * s, wy + 20 * s); g.lineTo(x1 - 80 * s, H); g.lineTo(W, H); g.fill(); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x0 + 80 * s, H - 40 * s, x1 - x0 - 160 * s, 40 * s); }
    // the towers and the wire
    for (const tx of [x0, x1]) { g.fillStyle = this.place === "towers" ? "#6a7888" : "#6a5a4a"; g.fillRect(tx - 14 * s, wy - 30 * s, 28 * s, H); g.fillStyle = PAL.lava; g.fillRect(tx - 18 * s, wy - 36 * s, 36 * s, 8 * s); }
    const sag = 18 * s; g.strokeStyle = "#1a1a24"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x0, wy - 30 * s); g.quadraticCurveTo(W / 2, wy - 30 * s + sag * 2, x1, wy - 30 * s); g.stroke();
    const rx = lerp(x0 + 20 * s, x1 - 20 * s, this.pos), ry = wy - 30 * s + sag * 2 * (1 - Math.pow((rx - W / 2) / ((x1 - x0) / 2), 2)) * 0.5;
    glow(g, x1, wy - 60 * s, 60 * s, "rgba(53,224,138,.5)", 0.5 + 0.3 * Math.sin(this.t * 4));
    // Rory, tilting about his feet
    g.save(); g.translate(rx, ry); g.rotate(this.th + (this.wobble > 0 ? Math.sin(this.t * 30) * 0.1 : 0));
    const P = 170 * s; person2D(g, 0, 0, P, RORY, { walk: this.wobble > 0 ? undefined : this.step, arms: "up", face: Math.abs(this.th) > 0.45 || this.wobble > 0 ? "shock" : "smile" });
    g.strokeStyle = "#c0a060"; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(-150 * s, -P * 0.95 + (this.u || 0) * 18 * s); g.lineTo(150 * s, -P * 0.95 - (this.u || 0) * 18 * s); g.stroke();
    for (const e of [-150, 150]) { g.fillStyle = PAL.lava; g.beginPath(); g.arc(e * s, -P * 0.95 - Math.sign(e) * (this.u || 0) * 18 * s, 8 * s, 0, TAU); g.fill(); }
    g.restore();
    // the wind warning
    if (this.warn || this.gust) { const d = this.gustDir, a = this.gust ? 1 : 0.5 + 0.5 * Math.sin(this.t * 12); g.globalAlpha = a; for (let k = 0; k < 3; k++) { const ax = W / 2 - d * (100 - k * 50) * s, ay = H * 0.28; g.fillStyle = PAL.ice; g.save(); g.translate(ax, ay); g.scale(d, 1); g.beginPath(); g.moveTo(24 * s, 0); g.lineTo(-10 * s, -18 * s); g.lineTo(-10 * s, 18 * s); g.closePath(); g.fill(); g.restore(); } text(g, "WIND!", W / 2, H * 0.28 - 40 * s, 22 * s, PAL.ice, "center", 900); g.globalAlpha = 1; }
    // balance gauge
    const gx = W / 2, gy2 = H - 70 * s, R = 70 * s;
    g.lineWidth = 12 * s; g.strokeStyle = "rgba(255,59,74,.6)"; g.beginPath(); g.arc(gx, gy2, R, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.strokeStyle = "rgba(53,224,138,.8)"; g.beginPath(); g.arc(gx, gy2, R, Math.PI * 1.35, Math.PI * 1.65); g.stroke();
    const na = -Math.PI / 2 + clamp(this.th / 0.85, -1, 1) * Math.PI * 0.4; g.strokeStyle = "#fff"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(gx, gy2); g.lineTo(gx + Math.cos(na) * R * 1.05, gy2 + Math.sin(na) * R * 1.05); g.stroke();
    drawZone(g, { x: 16 * s, y: H - 110 * s, w: 150 * s, h: 80 * s }, "◀ PUSH", (this.u || 0) < -0.2, s);
    drawZone(g, { x: W - 166 * s, y: H - 110 * s, w: 150 * s, h: 80 * s }, "PUSH ▶", (this.u || 0) > 0.2, s);
    bar(g, W / 2 - 150 * s, 70 * s, 300 * s, 16 * s, s, this.pos, PAL.ok, Math.round(this.pos * 100) + "%");
    if (this.hintT > 0) text(g, this.th > 0.1 ? "Push LEFT" : this.th < -0.1 ? "Push RIGHT" : "Steady...", W / 2, 110 * s, 20 * s, PAL.gold, "center", 900);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== HELI LANDER
// Land the helicopter softly on the pad.
class Lander extends MG {
  constructor(G, m) {
    super(G, m);
    this.place = { chi: "desert", nep: "mountain", nzl: "ship" }[where(m)] || "mountain";
    this.theme = this.place === "desert" ? "desert" : this.place === "ship" ? "sea" : "snow"; this.icon = "star"; this.slipAllow = 1;
    this.instr = "Hold LIFT to go up. Hold ◀ ▶ to fly sideways. Land gently on the pad!";
    this.need = L(this, 2, 2, 3, 3); this.got = 0; this.soft = L(this, 150, 130, 115, 100); this.wind = L(this, 0, 20, 35, 50); this.padMove = L(this, 0, 0, 50, 80);
    this.zones = {}; this.held = {}; this.auto = false; this.reset();
  }
  reset() { this.x = rnd(0.15, 0.3); this.y = 0.12; this.vx = 0; this.vy = 0; this.padX = rnd(0.55, 0.85); this.landed = 0; this.ph = rnd(0, TAU); if (this.got % 2) { this.x = 1 - this.x; this.padX = 1 - this.padX; } }
  padNow() { return this.padX * this.W + Math.sin(this.t * 0.5 + this.ph) * this.padMove * this.s; }
  padVx() { return Math.cos(this.t * 0.5 + this.ph) * 0.5 * this.padMove * this.s; }
  down(x, y, id) { const z = zoneAt(this.zones, x, y); if (z) this.held[id] = z; }
  up(x, y, id) { delete this.held[id]; }
  ctl() {
    const v = Object.values(this.held); let lift = v.includes("lift") || this.keyDown("ArrowUp") || this.keyDown("Space"), side = (v.includes("right") || this.keyDown("ArrowRight") ? 1 : 0) - (v.includes("left") || this.keyDown("ArrowLeft") ? 1 : 0);
    if (this.auto) {
      const s = this.s, px = this.padNow(), dx = px - this.x * this.W, gy = this.groundY(), height = gy - this.y * this.H;
      side = clamp((dx * 0.02 - (this.vx - this.padVx()) * 0.012) , -1, 1); side = Math.abs(side) < 0.15 ? 0 : Math.sign(side);
      const wantVy = Math.abs(dx) > 30 * s ? (height > 160 * s ? 0 : -60 * s) : Math.min(260 * s, 40 * s + height * 0.6);
      lift = this.vy > wantVy;
    }
    return { lift, side };
  }
  groundY() { return this.H - 120 * this.s; }
  tick(dt) {
    if (this.done) return;
    const s = this.s, W = this.W, H = this.H;
    if (this.landed) { this.landed -= dt; if (this.landed <= 0) { if (this.got >= this.need) return; this.reset(); } return; }
    const { lift, side } = this.ctl(); this.c = { lift, side };
    const windX = this.wind * s * Math.sin(this.t * 0.6 + this.ph);
    this.vy += (260 - (lift ? 560 : 0)) * s * dt; this.vx += (side * 240 * s - (this.vx - windX) * 0.8) * dt;
    this.vy = clamp(this.vy, -320 * s, 420 * s);
    let x = this.x * W + this.vx * dt, y = this.y * H + this.vy * dt;
    if (y < 80 * s) { y = 80 * s; this.vy = 0; } x = clamp(x, 40 * s, W - 40 * s);
    const gy = this.groundY(), px = this.padNow(), pw = 170 * s, padTop = gy - 30 * s;
    const onPad = Math.abs(x - px) < pw / 2 - 20 * s;
    const floor = onPad ? padTop : gy;
    if (y + 30 * s >= floor) {
      y = floor - 30 * s;
      if (onPad && this.vy < this.soft * s && Math.abs(this.vx - this.padVx()) < 110 * s) { this.got++; SFX.good(); this.pop(x, floor, PAL.ok); this.fx.float(x, floor - 90 * s, "PERFECT LANDING!", PAL.ok, 24); this.landed = 1.4; this.vx = this.vy = 0; if (this.got >= this.need) this.win(); }
      else { this.say(onPad ? "Too hard! Gently does it." : "That's not the pad!", false); this.fx.burst(x, floor, [PAL.gold, "#fff"], 16, 250 * s); this.vy = -200 * s; y -= 10 * s; }
    }
    this.x = x / W; this.y = y / H;
  }
  hint() { this.hintT = 5; return "Get right above the pad first. Then let the helicopter sink slowly, tapping LIFT to slow down."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const gy = this.groundY(), px = this.padNow(), pw = 170 * s;
    // ground / sea
    if (this.place === "ship") { g.fillStyle = "#0a3a5a"; g.fillRect(0, gy, W, H - gy); g.fillStyle = "#c0282a"; g.beginPath(); g.moveTo(px - pw * 0.9, gy - 30 * s); g.lineTo(px + pw * 0.9, gy - 30 * s); g.lineTo(px + pw * 0.7, gy + 30 * s); g.lineTo(px - pw * 0.7, gy + 30 * s); g.fill(); }
    else { g.fillStyle = this.place === "desert" ? "#8a5a2a" : "#e8f4ff"; g.beginPath(); g.moveTo(0, gy); for (let x = 0; x <= W; x += 40 * s) g.lineTo(x, gy + Math.sin(x / (90 * s)) * 8 * s); g.lineTo(W, H); g.lineTo(0, H); g.fill(); g.fillStyle = "#5a6070"; g.fillRect(px - pw / 2 + 10 * s, gy - 30 * s, pw - 20 * s, 30 * s); }
    g.fillStyle = "#2a3040"; rrect(g, px - pw / 2, gy - 36 * s, pw, 12 * s, 6 * s); g.fill();
    g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.beginPath(); g.arc(px, gy - 36 * s, 26 * s, Math.PI, 0); g.stroke(); text(g, "H", px, gy - 46 * s, 18 * s, PAL.gold, "center", 900);
    for (const sx of [-1, 1]) { g.fillStyle = Math.sin(this.t * 6) > 0 ? PAL.ok : "#1a5a3a"; g.beginPath(); g.arc(px + sx * (pw / 2 - 6 * s), gy - 40 * s, 5 * s, 0, TAU); g.fill(); }
    // the helicopter
    const X = this.x * W, Y = this.y * H, tilt = clamp(this.vx / (400 * s), -0.3, 0.3);
    g.save(); g.translate(X, Y); g.rotate(tilt);
    g.fillStyle = "rgba(0,0,0,.15)"; g.fillRect(-60 * s, -34 * s, 120 * s * Math.abs(Math.sin(this.t * 30)), 4 * s);
    g.fillStyle = "#2a3a50"; g.fillRect(-2 * s, -32 * s, 4 * s, 12 * s);
    g.strokeStyle = "#e8eef4"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(-70 * s * Math.cos(this.t * 30), -32 * s); g.lineTo(70 * s * Math.cos(this.t * 30), -32 * s); g.stroke();
    g.fillStyle = "#e05a10"; rrect(g, -60 * s, -6 * s, 50 * s, 10 * s, 5 * s); g.fill();
    g.fillStyle = "#16324f"; g.beginPath(); g.ellipse(4 * s, 0, 36 * s, 22 * s, 0, 0, TAU); g.fill();
    g.fillStyle = "rgba(127,227,255,.8)"; g.beginPath(); g.ellipse(18 * s, -4 * s, 16 * s, 12 * s, 0, 0, TAU); g.fill();
    icon(g, "snowflake", -10 * s, 2 * s, 14 * s, PAL.ice);
    g.strokeStyle = "#8a92a2"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(-26 * s, 30 * s); g.lineTo(30 * s, 30 * s); g.moveTo(-14 * s, 20 * s); g.lineTo(-18 * s, 30 * s); g.moveTo(18 * s, 20 * s); g.lineTo(22 * s, 30 * s); g.stroke();
    g.restore();
    if (this.c && this.c.lift) this.fx.puff(X, Y + 34 * s, "rgba(255,255,255,.35)", 1, { rise: -40 });
    // speed readout: green when soft enough
    const soft = this.vy < this.soft * s; card(g, 20 * s, 64 * s, 150 * s, 76 * s, s, { title: "DROP SPEED" });
    text(g, soft ? "GENTLE" : "TOO FAST", 95 * s, 112 * s, 18 * s, soft ? PAL.ok : PAL.danger, "center", 900);
    card(g, W - 170 * s, 64 * s, 150 * s, 76 * s, s, { title: "LANDINGS" }); text(g, `${this.got} / ${this.need}`, W - 95 * s, 112 * s, 24 * s, PAL.snow, "center", 900, MONO);
    if (this.hintT > 0) { g.strokeStyle = PAL.gold; g.setLineDash([6 * s, 6 * s]); g.lineWidth = 2 * s; g.beginPath(); g.moveTo(px, 80 * s); g.lineTo(px, gy - 40 * s); g.stroke(); g.setLineDash([]); }
    const c = this.c || {}; const zw = 110 * s, zh = 90 * s, zy = H - zh - 16 * s;
    this.zones = { left: { x: 16 * s, y: zy, w: zw, h: zh }, right: { x: 32 * s + zw, y: zy, w: zw, h: zh }, lift: { x: W - 16 * s - zw * 1.4, y: zy, w: zw * 1.4, h: zh } };
    drawZone(g, this.zones.left, "◀", c.side < 0, s); drawZone(g, this.zones.right, "▶", c.side > 0, s); drawZone(g, this.zones.lift, "LIFT", c.lift, s, PAL.gold);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== COOLING TOWER
// Keep every gauge out of the red. Tap a valve to cool its gauge.
class Cooling extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "volcano"; this.icon = "snowflake"; this.slipAllow = 1;
    this.instr = "The needles creep up. Tap a blue valve to cool its gauge. Keep them all out of the red!";
    this.n = L(this, 3, 4, 5, 6); this.dur = L(this, 20, 24, 28, 32); this.left = this.dur; this.auto = false; this.autoT = 0;
    this.g = []; for (let i = 0; i < this.n; i++) this.g.push({ v: rnd(0.2, 0.45), rate: rnd(0.035, 0.06) * L(this, 1, 1.15, 1.3, 1.45), spin: 0, warn: 0 });
    this.surgeT = 5;
  }
  vent(i) { const q = this.g[i]; if (!q || this.done) return; q.v = Math.max(0, q.v - 0.3); q.spin = 1; SFX.whoosh(); const r = this.rects && this.rects[i]; if (r) this.fx.puff(r.x + r.w / 2, r.y + 10 * this.s, "rgba(200,240,255,.7)", 8, { rise: 90 }); }
  down(x, y) { if (!this.rects) return; this.rects.forEach((r, i) => { if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) this.vent(i); }); }
  tick(dt) {
    if (this.done) return;
    this.left -= dt; if (this.left <= 0) { this.left = 0; this.win(); return; }
    this.surgeT -= dt;
    if (this.level >= 3 && this.surgeT <= 0) { const q = pick(this.g); q.warn = 0.8; this.surgeT = rnd(3, 5.5) / (this.level - 1.5); }
    this.g.forEach((q, i) => {
      q.spin = Math.max(0, q.spin - dt * 2);
      if (q.warn) { q.warn -= dt; if (q.warn <= 0) { q.warn = 0; q.v += 0.22; SFX.beep(300); } }
      q.v += q.rate * dt * (1 + 0.3 * Math.sin(this.t * 1.7 + i));
      if (q.v >= 1) { q.v = 0.5; this.say("Overheat! Vent it sooner.", false); SFX.alarm(); }
    });
    if (this.auto) { this.autoT -= dt; if (this.autoT <= 0) { this.autoT = 0.25; let b = -1, bv = 0.55; this.g.forEach((q, i) => { const v = q.v + (q.warn ? 0.22 : 0); if (v > bv) { bv = v; b = i; } }); if (b >= 0) this.vent(b); } }
  }
  hint() { this.hintT = 5; return "Watch for a flashing gauge: it's about to jump up. Vent the highest needle first."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    // the engine core behind
    glow(g, W / 2, H * 0.45, Math.min(W, H) * 0.5, "rgba(255,90,20,.35)", 0.6 + 0.2 * Math.sin(this.t * 3));
    const n = this.n, gw = Math.min(170 * s, (W - 60 * s) / n - 14 * s), R = gw * 0.42, cy = H * 0.44;
    this.rects = [];
    this.g.forEach((q, i) => {
      const cx = W / 2 + (i - (n - 1) / 2) * (gw + 14 * s);
      card(g, cx - gw / 2, cy - R - 40 * s, gw, R * 2 + 200 * s, s, { bg: "rgba(20,12,10,.8)", border: q.warn && Math.sin(this.t * 20) > 0 ? PAL.danger : "rgba(255,106,26,.35)" });
      // the dial
      const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, arc = (f0, f1, c) => { g.strokeStyle = c; g.lineWidth = 12 * s; g.beginPath(); g.arc(cx, cy, R, a0 + (a1 - a0) * f0, a0 + (a1 - a0) * f1); g.stroke(); };
      arc(0, 0.6, "#2ecc71"); arc(0.6, 0.82, "#ffd23f"); arc(0.82, 1, "#ff3b4a");
      const na = a0 + (a1 - a0) * clamp(q.v, 0, 1);
      g.strokeStyle = "#fff"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(na) * R * 0.9, cy + Math.sin(na) * R * 0.9); g.stroke();
      g.fillStyle = "#3a3f48"; g.beginPath(); g.arc(cx, cy, 8 * s, 0, TAU); g.fill();
      text(g, Math.round(q.v * 900 + 100) + "°", cx, cy + R * 0.55, 15 * s, q.v > 0.82 ? PAL.danger : PAL.snow, "center", 900, MONO);
      if (q.v > 0.82 && Math.sin(this.t * 14) > 0) glow(g, cx, cy, R * 1.3, "rgba(255,59,74,.5)");
      // the valve
      const vy = cy + R + 70 * s, vr = Math.min(46 * s, gw * 0.34);
      g.save(); g.translate(cx, vy); g.rotate(q.spin * 6);
      g.strokeStyle = "#3aa0ff"; g.lineWidth = 8 * s; g.beginPath(); g.arc(0, 0, vr, 0, TAU); g.stroke();
      for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 2); g.fillStyle = "#3aa0ff"; g.fillRect(-3 * s, -vr, 6 * s, vr); g.restore(); }
      g.fillStyle = "#1a5aa0"; g.beginPath(); g.arc(0, 0, 10 * s, 0, TAU); g.fill();
      g.restore();
      if (this.hintT > 0 && q.v > 0.6) { g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.beginPath(); g.arc(cx, vy, vr + 10 * s, 0, TAU); g.stroke(); }
      this.rects.push({ x: cx - gw / 2, y: cy - R - 40 * s, w: gw, h: R * 2 + 200 * s });
    });
    bar(g, W / 2 - 200 * s, 70 * s, 400 * s, 20 * s, s, 1 - this.left / this.dur, PAL.ice, `COOLING CYCLE ${Math.ceil(this.left)}s`);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS = { packing: Packing, dance: Dance, skydive: Skydive, tightrope: Tightrope, lander: Lander, cooling: Cooling };
