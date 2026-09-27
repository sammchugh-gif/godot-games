// Finding the way through open water, for the autopilots that swim and drive
// TORPEDO: a 3D grid of the water in a box round the mission, each cell open if a
// ball the size of the swimmer (or the sub) fits there under the surface, joined
// to its 26 neighbours. route() is A* over it, then cut short wherever a straight
// line is clear, so the path is a few long legs rather than a staircase.
import { R } from "./physics.js";

const FLAGS = () => R.QueryFilterFlags.EXCLUDE_DYNAMIC | R.QueryFilterFlags.EXCLUDE_KINEMATIC | R.QueryFilterFlags.EXCLUDE_SENSORS;

export class Nav3 {
  // box: [x0, y0, z0, x1, y1, z1]; r: the swimmer's size; S: the grid spacing; top: the highest a
  // centre may be (under the surface)
  // (block: an extra test for cells to keep out of, (x, y, z) => true, such as a current's tube)
  constructor(world, box, r = 0.5, S = 1, top = Infinity, block = null) {
    this.w = world; this.r = r; this.S = S;
    const [x0, y0, z0, x1, y1, z1] = box;
    this.x0 = x0; this.y0 = y0; this.z0 = z0;
    this.nx = Math.ceil((x1 - x0) / S) + 1; this.ny = Math.ceil((y1 - y0) / S) + 1; this.nz = Math.ceil((z1 - z0) / S) + 1;
    this.top = top;
    const n = this.nx * this.ny * this.nz, W = world.phys.world, f = FLAGS(), ball = new R.Ball(r), rot = { x: 0, y: 0, z: 0, w: 1 };
    const open = this.open = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      const [x, y, z] = this.at(k);
      if (y > top) continue;
      let free = true;
      W.intersectionsWithShape({ x, y, z }, rot, ball, () => { free = false; return false; }, f);
      if (free && world.heightAt && world.heightAt(x, z) > y - r) free = false;
      if (free && block && block(x, y, z)) free = false;
      // (and keep out of the vents' scalding plumes)
      if (free && world.plumes) for (const p of world.plumes) if (Math.hypot(x - p.x, z - p.z) < p.r + r + 0.4 && y > p.y - 1 && y < p.y + p.h + 1) { free = false; break; }
      open[k] = free ? 1 : 0;
    }
  }
  at(k) { const nx = this.nx, ny = this.ny, i = k % nx, j = ((k / nx) | 0) % ny, l = (k / (nx * ny)) | 0; return [this.x0 + i * this.S, this.y0 + j * this.S, this.z0 + l * this.S]; }
  idx(x, y, z) { const i = Math.round((x - this.x0) / this.S), j = Math.round((y - this.y0) / this.S), l = Math.round((z - this.z0) / this.S); return i < 0 || j < 0 || l < 0 || i >= this.nx || j >= this.ny || l >= this.nz ? -1 : i + this.nx * (j + this.ny * l); }
  // the nearest open cell to a point
  near(x, y, z, maxR = 4) {
    let best = -1, bd = Infinity; const S = this.S, rr = Math.ceil(maxR / S);
    const ci = Math.round((x - this.x0) / S), cj = Math.round((y - this.y0) / S), cl = Math.round((z - this.z0) / S);
    for (let l = cl - rr; l <= cl + rr; l++) for (let j = cj - rr; j <= cj + rr; j++) for (let i = ci - rr; i <= ci + rr; i++) {
      if (i < 0 || j < 0 || l < 0 || i >= this.nx || j >= this.ny || l >= this.nz) continue;
      const k = i + this.nx * (j + this.ny * l); if (!this.open[k]) continue;
      const [px, py, pz] = this.at(k), d = (px - x) ** 2 + (py - y) ** 2 + (pz - z) ** 2; if (d < bd) { bd = d; best = k; }
    }
    return best;
  }
  // a straight swim from a to b, with room for the swimmer all the way
  clear(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    if (len < 1e-3) return true;
    const W = this.w.phys.world;
    const hit = W.castShape({ x: a[0], y: a[1], z: a[2] }, { x: 0, y: 0, z: 0, w: 1 }, { x: dx / len, y: dy / len, z: dz / len }, new R.Ball(this.r * 0.9), 0, len, true, FLAGS());
    if (hit) return false;
    if (this.w.heightAt) for (let t = 0.1; t < 1; t += 0.1) { const x = a[0] + dx * t, y = a[1] + dy * t, z = a[2] + dz * t; if (this.w.heightAt(x, z) > y - this.r * 0.9) return false; }
    return !(Math.max(a[1], b[1]) > this.top + 0.3);
  }
  route(from, to) {
    const s = this.near(...from), e = this.near(...to);
    if (s < 0 || e < 0) return null;
    const n = this.open.length, g = new Float32Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), shut = new Uint8Array(n);
    const [ex, ey, ez] = this.at(e), heur = k => { const [x, y, z] = this.at(k); return Math.hypot(x - ex, y - ey, z - ez); };
    const heap = [], push = (k, f) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top[1]; };
    g[s] = 0; push(s, heur(s));
    const { nx, ny, nz } = this; let found = false, count = 0;
    while (heap.length) {
      const k = pop(); if (shut[k]) continue; shut[k] = 1;
      if (k === e) { found = true; break; }
      if (++count > 400000) break;
      const i = k % nx, j = ((k / nx) | 0) % ny, l = (k / (nx * ny)) | 0;
      for (let dl = -1; dl <= 1; dl++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj && !dl) continue;
        const ii = i + di, jj = j + dj, ll = l + dl; if (ii < 0 || jj < 0 || ll < 0 || ii >= nx || jj >= ny || ll >= nz) continue;
        const q = ii + nx * (jj + ny * ll); if (!this.open[q] || shut[q]) continue;
        const c = g[k] + Math.hypot(di, dj, dl) * this.S;
        if (c < g[q]) { g[q] = c; prev[q] = k; push(q, c + heur(q)); }
      }
    }
    if (!found) return null;
    const cells = []; for (let k = e; k >= 0; k = prev[k]) { cells.push(this.at(k)); if (k === s) break; }
    cells.reverse(); cells[0] = from.slice(); cells.push(to.slice());
    // keep only the corners: skip ahead to the furthest point in a clear straight line
    const out = [cells[0]]; let i = 0;
    while (i < cells.length - 1) { let j = cells.length - 1; while (j > i + 1 && !this.clear(cells[i], cells[j])) j--; out.push(cells[j]); i = j; }
    return out;
  }
}
