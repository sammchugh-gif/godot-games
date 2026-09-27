// The base of every mission that happens in the level: it adds its own things to
// the world, reports its HUD, decides win or lose, scores stars, and has an
// autopilot (solve) so the automated playthrough can finish it honestly. The
// helpers here (walkTo, rideTo, steer) are how the autopilots get about.
import { Nav } from "./nav.js";

export class Mission {
  constructor(g, def, data) {
    this.g = g; this.def = def; this.data = data || {}; this.lv = def.lv || 1;
    this.time = def.time ?? 0; this.left = this.time; this.t = 0;
    this.objs = []; this.done = false; this.failed = false;
  }
  get w() { return this.g.world; }
  get p() { return this.g.player; }
  add(o) { this.w.scene.add(o); this.objs.push(o); return o; }
  start() {}
  tick(dt) {
    if (this.done || this.failed) return;
    this.t += dt;
    if (this.timers) for (const tm of this.timers.splice(0)) { if (this.t >= tm.at) tm.fn(); else this.timers.push(tm); }
    if (this.done || this.failed) return;
    if (this.time && !this.finishing) { this.left -= dt; if (this.left <= 0) { this.left = 0; this.lose(); return; } }
    this.update(dt);
  }
  update() {}
  win() { if (this.done) return; this.done = true; this.g.onMissionWin(this); }
  // do something after a delay in game time (so pausing pauses it too)
  later(sec, fn) { (this.timers || (this.timers = [])).push({ at: this.t + sec, fn }); }
  lose(why) { if (this.failed) return; this.failed = true; this.g.onMissionLose(this, why); }
  stars() { if (!this.time) return 3; const f = this.left / this.time; return f > 0.45 ? 3 : f > 0.2 ? 2 : 1; }
  hud() { return { label: this.def.title.toUpperCase(), text: "", progress: null, timer: this.time ? this.left : null }; }
  cleanup() { for (const o of this.objs) { o.parent && o.parent.remove(o); } this.objs = []; }
  // autopilot: follow a planned route (walking, steps, jumps, gaps, drops and pads) to within
  // reach of a point, then jump for it if it is above. pts widen the map to cover the mission.
  ensureNav(pts) {
    if (this.nav) return this.nav;
    const all = [this.p.pos, ...pts];
    return (this.nav = new Nav(this.w, Math.min(...all.map(q => q.x)) - 14, Math.max(...all.map(q => q.x)) + 14, Math.min(...all.map(q => q.z)) - 14, Math.max(...all.map(q => q.z)) + 14));
  }
  walkTo(tx, ty, tz, reach = 0.8, pts = []) {
    const inp = this.g.input, pp = this.p.pos, w = this.p.walker;
    this.ensureNav([{ x: tx, z: tz }, ...pts]);
    // riding something that moves: get off onto ground that leads there first
    if (w.onMover) { this.disembark(tx, ty, tz, reach); return Math.hypot(tx - pp.x, tz - pp.z); }
    const far = !this.navTo || Math.hypot(this.navTo[0] - tx, this.navTo[2] - tz) > 1.5 || Math.abs(this.navTo[1] - ty) > 1;
    if ((w.grounded || this.p.swimming) && (far || this.t > this.navAt)) {
      this.navPath = this.nav.route(pp.x, pp.y, pp.z, tx, ty, tz, reach); this.navTo = [tx, ty, tz]; this.navI = 0; this.navAt = this.t + 4; this.navMoved = this.t;
    }
    const path = this.navPath;
    const up = ty - (pp.y + 0.7), dh = Math.hypot(tx - pp.x, tz - pp.z);
    // in the water with no way from here (the sea bed is far below): swim for the nearest place to
    // climb out, a step or a ledge at the water's edge, that leads to where we're going
    if (!path && this.p.swimming && this.w.sea) {
      const e = this.exitFor(tx, ty, tz, reach);
      if (e) { const d = Math.hypot(e.x - pp.x, e.z - pp.z); this.steer(e.x, e.z, d < 1.6); if (!w.grounded) inp.jumpHeld = true; return dh; }
    }
    if (!path) { this.steer(tx, tz, up > 1.0 && dh < 2.2); return dh; }
    // in the water: swim along the route's line (its squares are on the sea bed below) and hop out
    // where it comes ashore
    if (this.p.swimming) {
      for (let i = this.navI; i < Math.min(path.length, this.navI + 12); i++) { const q = path[i]; if (Math.hypot(q.x - pp.x, q.z - pp.z) < 1.3) this.navI = i; }
      const q = path[Math.min(path.length - 1, this.navI + 2)], L = this.w.sea ? this.w.sea.level : 0;
      // (a route that climbs straight out of the water onto something too high to reach from it, a
      // pier's end or a quay wall: swim to a way out, steps or a ledge, instead)
      if (q.h > L + 1.1 && Math.hypot(q.x - pp.x, q.z - pp.z) < 2.5) {
        const e = this.exitFor(tx, ty, tz, reach);
        if (e) { const d = Math.hypot(e.x - pp.x, e.z - pp.z); this.steer(e.x, e.z, d < 1.6); inp.jumpHeld = !w.grounded; return dh; }
      }
      // (hop out where the route comes ashore: the first square out of the water, right ahead,
      // even when the one being aimed at is further up the steps)
      const out = path.slice(this.navI, this.navI + 3).find(n => n.h > L - 0.3);
      this.steer(q.x, q.z, !!out && Math.hypot(out.x - pp.x, out.z - pp.z) < (out === q ? 2 : 1.6));
      inp.jumpHeld = false;
      return dh;
    }
    // progress along the route: the furthest square just ahead that Rory is standing on
    if (w.grounded) for (let i = this.navI; i < Math.min(path.length, this.navI + 8); i++) { const q = path[i]; if (Math.hypot(q.x - pp.x, q.z - pp.z) < 0.7 && Math.abs(q.h - pp.y) < 0.8) { if (i > this.navI) this.navMoved = this.t; this.navI = i; } }
    if (w.grounded && this.t - this.navMoved > 3) this.navAt = 0; // not getting anywhere: plan again
    const next = path[this.navI + 1];
    // at the end: step in and jump for it if it is up high
    if (!next) { this.steer(tx, tz, up > 1.0 && w.grounded); if (!w.grounded) inp.jumpHeld = w.vel.y > 0; if (dh < 0.3) inp.forced = { mx: 0, my: 0 }; return dh; }
    // (thrown up by a pad before the route saw him standing on it: head for where the pad lands him)
    if (!w.grounded && path[this.navI + 2] && path[this.navI + 2].how === "pad" && Math.hypot(next.x - pp.x, next.z - pp.z) < 1.5 && w.vel.y > 2) this.navI++;
    if (!w.grounded) {
      const q = path[this.navI + 1] || next;
      // (thrown up to somewhere higher: close in, but where its side is right there at Rory's feet,
      // back off over the pad until he's above it, then drift over)
      let wait = false;
      if (q.how === "pad" && q.h > pp.y - 0.1 && path[this.navI]) {
        const d = Math.hypot(q.x - pp.x, q.z - pp.z);
        wait = d > 0.1 && this.w.phys.ray({ x: pp.x, y: pp.y + 0.3, z: pp.z }, { x: (q.x - pp.x) / d, y: 0, z: (q.z - pp.z) / d }, 1.5, w.col) !== null;
      }
      if (wait) { const o = path[this.navI]; this.steer(o.x, o.z); if (Math.hypot(o.x - pp.x, o.z - pp.z) < 0.4) inp.forced = { mx: 0, my: 0 }; }
      else this.steer(q.x, q.z);
      inp.jumpHeld = w.vel.y > 0; return dh;
    }
    if (next.how === "pad") { const q = path[this.navI]; this.steer(q.x, q.z); return dh; }
    if (next.how === "jump") { this.steer(next.x, next.z, true); return dh; }
    // a gap: run at it and take off at the edge
    if (next.how === "gap") {
      const d = Math.hypot(next.x - pp.x, next.z - pp.z), ux = (next.x - pp.x) / (d || 1), uz = (next.z - pp.z) / (d || 1);
      // (up onto something from beside it, its edge keeps Rory further off: take off sooner)
      this.steer(next.x, next.z, this.nav.top(pp.x + ux * 0.5, pp.z + uz * 0.5, pp.y) < pp.y - 0.4 || d < (next.h > pp.y + 0.5 ? 1.8 : 1.0));
      return dh;
    }
    // walking: aim a few squares along, but not past the next jump, pad or drop (the way on from
    // the bottom of a drop can double back underneath, under a pontoon or a ledge)
    // (nor past a square that can't be seen from here: aiming round a corner walks into it)
    // (nor past one where the straight line to it runs off an edge: cutting the corner of a pier
    // walks into the sea)
    const floored = (q, d) => { const lo = Math.min(pp.y, q.h) - 0.6, hi = Math.max(pp.y, q.h) + 0.3; for (let t = 0.4; t < d; t += 0.4) { const f = this.nav.top(pp.x + (q.x - pp.x) * t / d, pp.z + (q.z - pp.z) * t / d, hi); if (f < lo) return false; } return true; };
    const seen = q => { const d = Math.hypot(q.x - pp.x, q.z - pp.z); return d < 0.1 || (this.w.phys.ray({ x: pp.x, y: pp.y + 0.5, z: pp.z }, { x: (q.x - pp.x) / d, y: 0, z: (q.z - pp.z) / d }, d, w.col) === null && floored(q, d)); };
    let j = this.navI + 1; while (j + 1 < path.length && j < this.navI + 3 && path[j].how !== "drop" && (path[j + 1].how === "walk" || path[j + 1].how === "drop") && seen(path[j + 1])) j++;
    // (and walk on past the foot of a drop: it can be only a hand's width beyond the edge)
    const q = path[j], o = path[j - 1], L = Math.hypot(q.x - o.x, q.z - o.z) || 1, on = q.how === "drop" ? 0.8 / L : 0;
    this.steer(q.x + (q.x - o.x) * on, q.z + (q.z - o.z) * on);
    return dh;
  }
  // the nearest spot to climb out of the water onto (a step or ledge no higher than a hop above the
  // surface) from which the walking map can get to (tx, ty, tz); remembered for each target
  // (with no target, just the nearest way out of the water)
  exitFor(tx, ty, tz, reach) {
    const nav = this.nav, L = this.w.sea.level, pp = this.p.pos, any = tx == null, key = any ? "any" : `${tx.toFixed(0)},${ty.toFixed(0)},${tz.toFixed(0)}`;
    if (this.exitKey !== key || this.exitNav !== nav) {
      this.exitKey = key; this.exitNav = nav; this.exits = [];
      const cand = [];
      for (let k = 0; k < nav.h.length; k++) if (nav.h[k] > L - 0.4 && nav.h[k] < L + 1.3) { const [x, z] = nav.xz(k); cand.push({ x, y: nav.h[k], z, d: Math.hypot(x - pp.x, z - pp.z) }); }
      cand.sort((a, b) => a.d - b.d);
      // (the closest few that lead there)
      for (const c of cand) { if (this.exits.length >= 3 || c.d > 60) break; if (any || nav.route(c.x, c.y, c.z, tx, ty, tz, reach)) this.exits.push(c); }
    }
    let best = null, bd = 1e9;
    for (const e of this.exits) { const d = Math.hypot(e.x - pp.x, e.z - pp.z); if (d < bd) { bd = d; best = e; } }
    this.lastExit = best;
    return best;
  }
  // the moving platform (ferry deck, cable car roof) that carries obj
  moverOf(obj) { let best = null, bd = 3; for (const m of this.w.phys.movers) { const d = m.mesh.position.distanceTo(obj.position); if (d < bd) { bd = d; best = m; } } return best; }
  // autopilot for a target riding on a moving platform: wait on the ground the platform passes
  // closest to, hop on as it comes by, and walk to the target on board
  rideTo(tx, ty, tz, obj, pts = []) {
    const inp = this.g.input, pp = this.p.pos, w = this.p.walker, m = this.moverOf(obj), nav = this.ensureNav(pts);
    if (!m) { this.steer(tx, tz); return; }
    // in the air: finishing a hop off a boat, keep going for where the hop lands; jumped up for a
    // cell on another boat just now, come down on that boat again (not in the sea on the way to this one)
    if (w.onMover) { this.lastDeck = w.onMover; this.lastDeckT = this.t; }
    else if (w.grounded || this.p.swimming) this.hop = null;
    else {
      if (this.hop) { this.steer(this.hop[0], this.hop[1]); inp.jumpHeld = w.vel.y > 0; return; }
      const L = this.lastDeck;
      if (L && L !== m && this.t - this.lastDeckT < 1.5) { const [cx, , cz] = L.fn ? L.fn(this.w.phys.t) : L.mesh.position.toArray(); this.steer(cx, cz); inp.jumpHeld = w.vel.y > 0; return; }
    }
    if (w.onMover === m) { this.steer(tx, tz, ty - (pp.y + 0.7) > 1.0 && w.grounded); if (!w.grounded) inp.jumpHeld = w.vel.y > 0; return; }
    if (w.onMover) { this.disembark(tx, ty, tz, 0.8, m); return; }
    // the deck as a rectangle at time t: how far (x, z) is from it, and the nearest point well inside it
    const deck = (t, x, z) => {
      const [cx, cy, cz, ry = 0] = m.fn(t), c = Math.cos(ry), sn = Math.sin(ry), dx = x - cx, dz = z - cz;
      const lx = dx * c - dz * sn, lz = dx * sn + dz * c;
      const out = Math.hypot(Math.max(0, Math.abs(lx) - m.hx), Math.max(0, Math.abs(lz) - m.hz));
      const ix = Math.max(-(m.hx - 0.8), Math.min(m.hx - 0.8, lx)), iz = Math.max(-(m.hz - 0.8), Math.min(m.hz - 0.8, lz));
      return { out, top: cy + m.hy, x: cx + ix * c + iz * sn, z: cz - ix * sn + iz * c };
    };
    if (!this.board || this.board.m !== m) {
      // the ground the deck passes closest to over the next minute and a half, that Rory can walk to
      const spots = new Map(); const R = Math.max(m.hx, m.hz) + 1.5;
      for (let dt = 0; dt < 90; dt += 0.5) {
        const t = this.w.phys.t + dt, [cx, cy, cz] = m.fn(t);
        for (const k of nav.around(cx, cz, R)) {
          if (Math.abs(nav.h[k] - (cy + m.hy)) > 1.2) continue;
          const [nx, nz] = nav.xz(k), d = deck(t, nx, nz).out;
          // (beside the deck, not under it: under a lift, jumping aboard hits it from below)
          if (d > 0.3 && d < 1.0 && (!spots.has(k) || d < spots.get(k).d)) spots.set(k, { d, x: nx, y: nav.h[k], z: nz, m, k });
        }
      }
      // the nearest landing Rory can walk to from here
      const can = nav.reachable(pp.x, pp.y, pp.z);
      let best = null;
      for (const sp of [...spots.values()].sort((a, b) => a.d - b.d)) if (Math.hypot(sp.x - pp.x, sp.z - pp.z) < 1 && Math.abs(sp.y - pp.y) < 0.6 || (can && can[sp.k])) { best = sp; break; }
      this.board = best;
    }
    // fallen in the water: climb out (a boat can't be boarded from the sea) and wait for it again
    if (this.p.swimming) {
      const b = this.board;
      if (b) { this.walkTo(b.x, b.y + 0.7, b.z, 0.5, pts); return; }
      // (no spot to wait at worked out yet: out at the nearest step, and it's worked out from there)
      const e = this.exitFor(null); if (e) { const d = Math.hypot(e.x - pp.x, e.z - pp.z); this.steer(e.x, e.z, d < 1.6); if (!w.grounded) inp.jumpHeld = true; return; }
      this.walkTo(tx, ty, tz, 1.0, pts); return;
    }
    const now = deck(this.w.phys.t, pp.x, pp.z);
    // it's here: jump aboard, towards a spot well inside the deck
    // (a deck a little below: it can be a longer hop, as the drop carries Rory further)
    if (w.grounded && now.out < (now.top < pp.y - 0.3 ? 1.5 : 1.0) && now.top - pp.y > -0.8 && now.top - pp.y < 1.6) { this.steer(now.x + m.vel.x * 0.25, now.z + m.vel.z * 0.25, true); return; }
    // stopped (or nearly) level with the ground a few steps away: walk on
    if (w.grounded && now.out < 3 && Math.abs(now.top - pp.y) < 0.6 && m.vel.length() < 1.2) { this.steer(now.x, now.z); return; }
    if (!w.grounded) { this.steer(now.x + m.vel.x * 0.2, now.z + m.vel.z * 0.2); inp.jumpHeld = w.vel.y > 0; return; }
    if (!this.board) { this.steer(tx, tz); return; }
    // otherwise go to the waiting spot and wait there
    this.walkTo(this.board.x, this.board.y + 0.7, this.board.z, 0.4, pts);
    if (Math.hypot(this.board.x - pp.x, this.board.z - pp.z) < 0.5) inp.forced = { mx: 0, my: 0 };
  }
  // on a moving platform but heading somewhere else: when ground that leads there (or to the
  // platform wanted next) comes within a hop, jump onto it; until then stand still
  disembark(tx, ty, tz, reach, want = null) {
    const pp = this.p.pos, nav = this.nav, w = this.p.walker;
    // mid-hop: keep going the way we jumped
    if (!w.grounded && this.hop) { this.steer(this.hop[0], this.hop[1]); this.g.input.jumpHeld = w.vel.y > 0; return; }
    this.hop = null;
    const k = nav.nearestOk(pp.x, pp.y, pp.z, 2.4, 1.2);
    const leads = k >= 0 && (this.leadCache || (this.leadCache = new Map())).get(`${k}|${tx.toFixed(0)},${tz.toFixed(0)}`);
    let ok = leads;
    if (k >= 0 && leads === undefined) {
      const [x, z] = nav.xz(k);
      ok = want ? true : !!nav.route(x, nav.h[k], z, tx, ty, tz, reach);
      this.leadCache.set(`${k}|${tx.toFixed(0)},${tz.toFixed(0)}`, ok);
    }
    if (k >= 0 && ok) {
      // aim a step past the edge, not at it
      let [x, z] = nav.xz(k); const d = Math.hypot(x - pp.x, z - pp.z) || 1;
      const k2 = nav.nearestOk(x + (x - pp.x) / d * 1.2, nav.h[k], z + (z - pp.z) / d * 1.2, 0.8, 0.3);
      if (k2 >= 0) [x, z] = nav.xz(k2);
      this.steer(x, z, true); this.hop = [x, z]; return;
    }
    // meanwhile stand at the edge of the deck nearest to where we're going
    const m = this.p.walker.onMover;
    if (m && m.fn) {
      const [cx, , cz, ry = 0] = m.fn(this.w.phys.t), c = Math.cos(ry), sn = Math.sin(ry), dx = tx - cx, dz = tz - cz;
      // (well inside it: the deck turns under his feet as the boat goes round)
      const ix = Math.max(-(m.hx - 1.2), Math.min(m.hx - 1.2, dx * c - dz * sn)), iz = Math.max(-(m.hz - 1.2), Math.min(m.hz - 1.2, dx * sn + dz * c));
      const ex = cx + ix * c + iz * sn, ez = cz - ix * sn + iz * c;
      if (Math.hypot(ex - pp.x, ez - pp.z) > 0.4) { this.steer(ex, ez); return; }
    }
    this.g.input.forced = { mx: 0, my: 0 };
  }
  // autopilot helpers: steer toward a point (camera-relative stick)
  steer(x, z, jump = false) {
    const p = this.p, dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
    // point the camera behind the move so "forward" on the stick means towards the target
    p.camYaw = Math.atan2(-dx, -dz);
    this.g.input.forced = d > 0.3 ? { mx: 0, my: 1 } : { mx: 0, my: 0 };
    if (jump) { this.g.input.jumpPressed = true; this.g.input.jumpHeld = true; }
    return d;
  }
}
