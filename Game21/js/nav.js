// A walking map for the autopilots, so the tests play the levels as a child would.
// Each spot on a grid can have several floors (a ship's decks, a lighthouse's
// stairs winding up over themselves): every solid the spot's column passes
// through is found by casting rays down and up, and the top of each is a floor
// if Rory fits standing on it. Floors are joined wherever he can walk, climb a
// step or ramp, jump up, jump a gap, drop down, or ride a bounce pad; route() is
// A* over them. A floor is called a node; h[k] is its height and xz(k) its spot.
import { R } from "./physics.js";

const STEP = 0.45, JUMP_UP = 1.9, DROP = 8, GAP = 3.8, TALL = 1.35;
const FLAGS = () => R.QueryFilterFlags.EXCLUDE_DYNAMIC | R.QueryFilterFlags.EXCLUDE_KINEMATIC | R.QueryFilterFlags.EXCLUDE_SENSORS;

export class Nav {
  constructor(world, x0, x1, z0, z1, S = 0.75) {
    this.w = world; this.S = S;
    this.x0 = x0; this.z0 = z0;
    this.nx = Math.ceil((x1 - x0) / S) + 1; this.nz = Math.ceil((z1 - z0) / S) + 1;
    this.build();
  }
  // everything solid in the column at (x, z): [bottom, top] of each thing the column passes through
  column(x, z) {
    const W = this.w.phys.world, f = FLAGS(), yTop = this.yTop, yBot = this.yBot;
    const tops = new Map(), bots = new Map(), terrain = this.w.terrainCol;
    W.intersectionsWithRay(new R.Ray({ x, y: yTop, z }, { x: 0, y: -1, z: 0 }), yTop - yBot, true, hit => { const c = hit.collider, t = yTop - (hit.timeOfImpact ?? hit.toi); if (!tops.has(c.handle) || t > tops.get(c.handle)) tops.set(c.handle, t); return true; }, f);
    W.intersectionsWithRay(new R.Ray({ x, y: yBot, z }, { x: 0, y: 1, z: 0 }), yTop - yBot, true, hit => { const c = hit.collider, b = yBot + (hit.timeOfImpact ?? hit.toi); if (!bots.has(c.handle) || b < bots.get(c.handle)) bots.set(c.handle, b); return true; }, f);
    const out = [];
    for (const [hd, top] of tops) {
      // the ground reaches all the way down; so does anything whose underside the upward ray can't find
      let bot = bots.get(hd);
      if (bot === undefined || bot > top || (terrain && hd === terrain.handle)) bot = -1e9;
      out.push([bot, top, terrain && hd === terrain.handle]);
    }
    return out;
  }
  // is there anything solid in the column between y0 and y1
  occupied(col, y0, y1) { for (const [b, t] of this.solids[col]) if (b < y1 && t > y0) return true; return false; }
  build() {
    const { nx, nz, S } = this, n = nx * nz;
    this.yTop = 80; this.yBot = (this.w.floorY ?? -20) - 5;
    const floor = this.w.floorY ?? -20, W = this.w.phys.world, f = FLAGS();
    const shape = new R.Capsule((TALL - STEP) / 2 - 0.3, 0.3), rot = { x: 0, y: 0, z: 0, w: 1 };
    this.solids = new Array(n);
    const first = this.first = new Int32Array(n + 1), hs = [], ceil = [], cols = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const c = i + j * nx, x = this.x0 + i * S, z = this.z0 + j * S;
      const sol = this.solids[c] = this.column(x, z);
      first[c] = hs.length;
      const tops = sol.filter(s => s[1] > floor + 0.5).sort((a, b) => b[1] - a[1]);
      for (const [, t, isGround] of tops) {
        if (hs.length > first[c] && hs[hs.length - 1] - t < 0.05) continue; // the same floor twice
        if (this.w.flows && this.w.hotAt(x, z, t)) continue; // glowing lava
        // nothing solid right over it (a floor buried under a slab is no floor)
        let buried = false; for (const [b, tt] of sol) if (b < t + TALL && tt > t + 0.02 && !(Math.abs(tt - t) < 0.02)) { buried = true; break; }
        if (buried) continue;
        // footing all round (not the very edge of a crate, where he'd slide off): three of four points
        // a hand's width out are inside something solid just below the floor
        if (!isGround) {
          let feet = 0;
          for (const [ox, oz] of [[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]]) { let inside = false; W.intersectionsWithPoint({ x: x + ox, y: t - 0.05, z: z + oz }, () => { inside = true; return false; }, f); if (inside || (this.w.heightAt && this.w.heightAt(x + ox, z + oz) > t - 0.05)) feet++; }
          if (feet < 3) continue;
        }
        // Rory fits here: nothing solid from a step's height above the floor up to the top of his
        // head, within his width (a wall beside him, a ceiling over him, or being inside something)
        let clear = true;
        W.intersectionsWithShape({ x, y: t + STEP + (TALL - STEP) / 2 + 0.02, z }, rot, shape, () => { clear = false; return false; }, f);
        if (!clear) continue;
        let over = 1e9; for (const [b] of sol) if (b > t + 0.02) over = Math.min(over, b - t);
        hs.push(t); ceil.push(over); cols.push(c);
      }
    }
    first[n] = hs.length;
    this.h = Float32Array.from(hs); this.ceil = Float32Array.from(ceil); this.col = Int32Array.from(cols);
    this.ok = new Uint8Array(hs.length).fill(1);
    this.pads = (this.w.pads || []).map(p => ({ ...p, k: this.nodeAt(p.x, p.y + 0.25, p.z, 0.6), apex: p.power * p.power / 31 }));
  }
  get count() { return this.h.length; }
  colOf(x, z) { const i = Math.round((x - this.x0) / this.S), j = Math.round((z - this.z0) / this.S); return i < 0 || j < 0 || i >= this.nx || j >= this.nz ? -1 : i + j * this.nx; }
  // (kept for the missions: the column a spot is in)
  cellOf(x, z) { return this.colOf(x, z); }
  // the floor in the column at (x, z) nearest to height y (within tol), or -1
  nodeAt(x, y, z, tol = 1) {
    const c = this.colOf(x, z); if (c < 0) return -1;
    let best = -1, bd = tol;
    for (let k = this.first[c]; k < this.first[c + 1]; k++) { const d = Math.abs(this.h[k] - y); if (d <= bd) { bd = d; best = k; } }
    return best;
  }
  // the highest fixed surface under (x, z) (below height y, if given)
  top(x, z, y = Infinity) {
    const c = this.colOf(x, z);
    if (c >= 0) { let t = -Infinity; for (const [, top] of this.solids[c]) if (top <= y + 0.3 && top > t) t = top; return t; }
    const hit = this.w.phys.world.castRay(new R.Ray({ x, y: Math.min(this.yTop, y + 0.3), z }, { x: 0, y: -1, z: 0 }), 200, true, FLAGS());
    return hit ? Math.min(this.yTop, y + 0.3) - hit.timeOfImpact : -Infinity;
  }
  xz(k) { const c = this.col[k]; return [this.x0 + (c % this.nx) * this.S, this.z0 + ((c / this.nx) | 0) * this.S]; }
  // every floor in the columns within r of (x, z)
  *around(x, z, r) {
    const ci = Math.round((x - this.x0) / this.S), cj = Math.round((z - this.z0) / this.S), rr = Math.ceil(r / this.S);
    for (let j = Math.max(0, cj - rr); j <= Math.min(this.nz - 1, cj + rr); j++) for (let i = Math.max(0, ci - rr); i <= Math.min(this.nx - 1, ci + rr); i++) {
      const c = i + j * this.nx; for (let k = this.first[c]; k < this.first[c + 1]; k++) yield k;
    }
  }
  // the nearest floor within maxD across and maxDy up or down of (x, y, z), or -1
  nearestOk(x, y, z, maxD, maxDy) {
    let best = -1, bd = maxD;
    for (const k of this.around(x, z, maxD)) {
      if (Math.abs(this.h[k] - y) > maxDy) continue;
      const [kx, kz] = this.xz(k), d = Math.hypot(kx - x, kz - z); if (d < bd) { bd = d; best = k; }
    }
    return best;
  }
  // the floor in column c that you'd walk onto from height y (within a step), or -1
  walkable(c, y) { let best = -1, bd = STEP; for (let k = this.first[c]; k < this.first[c + 1]; k++) { const d = Math.abs(this.h[k] - y); if (d <= bd) { bd = d; best = k; } } return best; }
  // the moves out of floor k: [to, cost, how]
  moves(k, out) {
    out.length = 0;
    const { nx, nz, S, h } = this, c = this.col[k], i = c % nx, j = (c / nx) | 0, y = h[k];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const c2 = ii + jj * nx, d = (di && dj ? 1.414 : 1) * S;
      // no cutting corners past a wall or an edge
      if (di && dj && (this.walkable(i + di + j * nx, y) < 0 || this.walkable(i + (j + dj) * nx, y) < 0)) continue;
      for (let q = this.first[c2]; q < this.first[c2 + 1]; q++) {
        const dh = h[q] - y;
        if (Math.abs(dh) <= STEP) out.push([q, d, "walk"]);
        // up onto a ledge: room over his head for the jump
        else if (dh > 0 && dh <= JUMP_UP && this.ceil[k] > dh + TALL + 0.2) out.push([q, d + 2, "jump"]);
        // off an edge: nothing in the way from the floor below up to his head
        else if (dh < 0 && dh >= -DROP && !this.occupied(c2, h[q] + 0.05, y + TALL)) out.push([q, d + 0.5, "drop"]);
      }
    }
    // jumping a gap in a straight line: over lower ground (or nothing) to a floor no higher than a small hop
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const step = (di && dj ? 1.414 : 1) * S;
      for (let m = 2; m * step <= GAP; m++) {
        const ii = i + di * m, jj = j + dj * m; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) break;
        let clear = true;
        for (let t = 1; t < m; t++) if (this.occupied((i + di * t) + (j + dj * t) * nx, y - 1, y + TALL + 0.6)) { clear = false; break; }
        if (!clear) break;
        const c2 = ii + jj * nx; let hit = false;
        for (let q = this.first[c2]; q < this.first[c2 + 1]; q++) { const dh = h[q] - y; if (dh <= 1.0 && dh >= -DROP && !this.occupied(c2, h[q] + 0.05, y + TALL)) { out.push([q, m * step + 3, "gap"]); hit = true; } }
        if (hit) break;
      }
    }
    // a bounce pad throws Rory up and he steers in the air to anything within reach below the top of the throw
    for (const p of this.pads) {
      if (p.k !== k) continue;
      for (const q of this.around(p.x, p.z, 6)) {
        const [qx, qz] = this.xz(q);
        if (Math.hypot(qx - p.x, qz - p.z) > 6) continue;
        if (h[q] > y + 1 && h[q] < p.y + p.apex - 0.4 && this.ceil[k] > h[q] - y + TALL) out.push([q, Math.hypot(qx - p.x, qz - p.z) + 5, "pad"]);
      }
    }
    return out;
  }
  // A* to any floor from which the point (tx, ty, tz) can be touched: standing, or at the top of a jump
  // every floor that can be got to from where Rory stands at (x, y, z): 1 in the returned array
  // (worked out once per starting floor, so "can he walk there?" is then instant)
  reachable(x, y, z) {
    let s = this.nodeAt(x, y, z, 1);
    if (s < 0) s = this.nearestOk(x, y, z, 3, 0.5);
    if (s < 0) return null;
    if (this._reach && this._reach.s === s) return this._reach.mark;
    const mark = new Uint8Array(this.h.length), stack = [s], out = []; mark[s] = 1;
    while (stack.length) { const k = stack.pop(); for (const [q] of this.moves(k, out)) if (!mark[q]) { mark[q] = 1; stack.push(q); } }
    this._reach = { s, mark };
    return mark;
  }
  route(fx, fy, fz, tx, ty, tz, reach = 1.0) {
    const { h } = this, n = h.length;
    // start from the floor Rory is standing on, or else the nearest one at his height
    let s = this.nodeAt(fx, fy, fz, 1);
    if (s < 0) { s = this.nearestOk(fx, fy, fz, 3, 0.5); if (s < 0) s = this.nearestOk(fx, fy, fz, 3, 1e9); }
    if (s < 0) return null;
    const goal = q => { const [x, z] = this.xz(q), up = ty - (h[q] + 0.7); return Math.hypot(x - tx, z - tz) <= reach && up > -1.0 && up < 3.1 && this.ceil[q] > up + 0.7; };
    const g = new Float32Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), how = new Array(n), shut = new Uint8Array(n);
    const heur = q => { const [x, z] = this.xz(q); return Math.max(0, Math.hypot(x - tx, z - tz) - reach) + Math.max(0, Math.abs(ty - 0.7 - h[q]) - 3) * 0.5; };
    const heap = [], push = (k, f) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top[1]; };
    g[s] = 0; push(s, heur(s));
    const out = []; let end = -1, count = 0;
    while (heap.length) {
      const k = pop(); if (shut[k]) continue; shut[k] = 1;
      if (goal(k)) { end = k; break; }
      if (++count > 80000) break;
      for (const [q, c, hw] of this.moves(k, out)) {
        if (shut[q]) continue;
        const cost = g[k] + c;
        if (cost < g[q]) { g[q] = cost; from[q] = k; how[q] = hw; push(q, cost + heur(q)); }
      }
    }
    if (end < 0) return null;
    const path = []; for (let k = end; k >= 0; k = from[k]) { const [x, z] = this.xz(k); path.push({ x, z, h: h[k], how: how[k] || "walk", k }); if (k === s) break; }
    return path.reverse();
  }
}
