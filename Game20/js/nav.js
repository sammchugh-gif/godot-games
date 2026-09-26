// A walking map for the autopilots, so the tests play the levels as a child would:
// a grid of the surfaces Rory can stand on (found by casting rays down through the
// level), joined wherever he can walk, climb a step or ramp, jump up, jump a gap,
// drop down, or ride a bounce pad. route() is A* over it.
import { R } from "./physics.js";

const STEP = 0.45, JUMP_UP = 1.9, DROP = 8, GAP = 3.8;

export class Nav {
  constructor(world, x0, x1, z0, z1, S = 0.75) {
    this.w = world; this.S = S;
    this.x0 = x0; this.z0 = z0;
    this.nx = Math.ceil((x1 - x0) / S) + 1; this.nz = Math.ceil((z1 - z0) / S) + 1;
    this.build();
  }
  // the height of the highest fixed surface under (x, z), ignoring things that move
  top(x, z) {
    const phys = this.w.phys, flags = R.QueryFilterFlags.EXCLUDE_DYNAMIC | R.QueryFilterFlags.EXCLUDE_KINEMATIC | R.QueryFilterFlags.EXCLUDE_SENSORS;
    const hit = phys.world.castRay(new R.Ray({ x, y: this.yTop, z }, { x: 0, y: -1, z: 0 }), this.yTop + 60, true, flags);
    return hit ? this.yTop - hit.timeOfImpact : -Infinity;
  }
  build() {
    const { nx, nz, S } = this, n = nx * nz;
    this.yTop = 60;
    const h = this.h = new Float32Array(n), ok = this.ok = new Uint8Array(n);
    const floor = this.w.floorY ?? -20;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = i + j * nx, x = this.x0 + i * S, z = this.z0 + j * S, y = h[k] = this.top(x, z);
      // standable if it is above the kill floor and nothing next to it (within Rory's width) is a wall
      let good = y > floor + 0.5;
      if (good) for (const [ox, oz] of [[0.32, 0], [-0.32, 0], [0, 0.32], [0, -0.32]]) { if (this.top(x + ox, z + oz) - y > STEP) { good = false; break; } }
      ok[k] = good ? 1 : 0;
    }
    this.pads = (this.w.pads || []).map(p => ({ ...p, k: this.cellOf(p.x, p.z), apex: p.power * p.power / 31 }));
  }
  cellOf(x, z) { const i = Math.round((x - this.x0) / this.S), j = Math.round((z - this.z0) / this.S); return i < 0 || j < 0 || i >= this.nx || j >= this.nz ? -1 : i + j * this.nx; }
  xz(k) { return [this.x0 + (k % this.nx) * this.S, this.z0 + ((k / this.nx) | 0) * this.S]; }
  // the moves out of square k: [to, cost, how]
  moves(k, out) {
    out.length = 0;
    const { nx, nz, S, h, ok } = this, i = k % nx, j = (k / nx) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const q = ii + jj * nx; if (!ok[q]) continue;
      const d = (di && dj ? 1.414 : 1) * S, dh = h[q] - h[k];
      // no cutting corners past a wall or an edge
      if (di && dj) { const a = i + di + j * nx, b = i + (j + dj) * nx; if (!ok[a] || !ok[b] || Math.abs(h[a] - h[k]) > STEP || Math.abs(h[b] - h[k]) > STEP) continue; }
      if (Math.abs(dh) <= STEP) out.push([q, d, "walk"]);
      else if (dh > 0 && dh <= JUMP_UP) out.push([q, d + 2, "jump"]);
      else if (dh < 0 && dh >= -DROP) out.push([q, d + 0.5, "drop"]);
    }
    // jumping a gap in a straight line: over lower ground to a square no higher than a small hop
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const step = (di && dj ? 1.414 : 1) * S;
      for (let m = 2; m * step <= GAP; m++) {
        const ii = i + di * m, jj = j + dj * m; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) break;
        const q = ii + jj * nx, dh = h[q] - h[k];
        let lower = true; for (let t = 1; t < m; t++) { const g = h[(i + di * t) + (j + dj * t) * nx]; if (g > h[k] - 1 || g > h[q] - 1) { lower = false; break; } }
        if (!lower) break;
        if (ok[q] && dh <= 1.0 && dh >= -DROP) { out.push([q, m * step + 3, "gap"]); break; }
      }
    }
    // a bounce pad throws Rory up and he steers in the air to anything within reach below the top of the throw
    for (const p of this.pads) {
      if (Math.hypot(this.xz(k)[0] - p.x, this.xz(k)[1] - p.z) > p.r * 0.7) continue;
      const r = 6, ri = Math.ceil(r / S);
      for (let dj = -ri; dj <= ri; dj++) for (let di = -ri; di <= ri; di++) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const q = ii + jj * nx, d = Math.hypot(di, dj) * S; if (!ok[q] || d > r) continue;
        if (h[q] > h[k] + 1 && h[q] < p.y + p.apex - 0.4) out.push([q, d + 5, "pad"]);
      }
    }
    return out;
  }
  // A* to any square from which the point (tx, ty, tz) can be touched: standing, or at the top of a jump
  route(fx, fy, fz, tx, ty, tz, reach = 1.0) {
    const { nx, nz, S, h, ok } = this, n = nx * nz;
    let s = this.cellOf(fx, fz); if (s < 0) return null;
    // start from the square Rory is standing on (or the nearest one at his height)
    if (!ok[s] || Math.abs(h[s] - fy) > 1) { let best = -1, bd = 3; for (let q = 0; q < n; q++) { if (!ok[q]) continue; const [x, z] = this.xz(q); const d = Math.hypot(x - fx, z - fz) + Math.abs(h[q] - fy) * 2; if (d < bd) { bd = d; best = q; } } if (best >= 0) s = best; }
    const goal = q => { const [x, z] = this.xz(q), up = ty - (h[q] + 0.7); return Math.hypot(x - tx, z - tz) <= reach && up > -1.0 && up < 3.1; };
    const g = new Float32Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), how = new Array(n), shut = new Uint8Array(n);
    const heur = q => { const [x, z] = this.xz(q); return Math.max(0, Math.hypot(x - tx, z - tz) - reach); };
    const heap = [], push = (k, f) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top[1]; };
    g[s] = 0; push(s, heur(s));
    const out = []; let end = -1, count = 0;
    while (heap.length) {
      const k = pop(); if (shut[k]) continue; shut[k] = 1;
      if (goal(k)) { end = k; break; }
      if (++count > 60000) break;
      for (const [q, c, hw] of this.moves(k, out)) {
        if (shut[q]) continue;
        const cost = g[k] + c;
        if (cost < g[q]) { g[q] = cost; from[q] = k; how[q] = hw; push(q, cost + heur(q)); }
      }
    }
    if (end < 0) return null;
    const path = []; for (let k = end; k >= 0; k = from[k]) { const [x, z] = this.xz(k); path.push({ x, z, h: h[k], how: how[k] || "walk" }); if (k === s) break; }
    return path.reverse();
  }
}
