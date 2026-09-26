// Mission kinds. Each runs inside the level: it adds its own things to the
// world, reports its HUD, decides win or lose, scores stars, and has an
// autopilot (solve) so the automated playthrough can finish it honestly.
import * as THREE from "three";
import { R } from "./physics.js";
import { Robot } from "./robots.js";
import { Car } from "./vehicle.js";
import { Circuit, Codes } from "./missions2.js";
import { Nav } from "./nav.js";
import { makePerson, animatePerson } from "./people.js";
import { CHARS } from "./story.js";
import { makeCell, spinCell, makeBubble, makeBeam, aimBeam, thing } from "./props.js";
import { toast } from "./ui.js";

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

class Mission {
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
    if (w.grounded && (far || this.t > this.navAt)) {
      this.navPath = this.nav.route(pp.x, pp.y, pp.z, tx, ty, tz, reach); this.navTo = [tx, ty, tz]; this.navI = 0; this.navAt = this.t + 4; this.navMoved = this.t;
    }
    const path = this.navPath;
    const up = ty - (pp.y + 0.7), dh = Math.hypot(tx - pp.x, tz - pp.z);
    if (!path) { this.steer(tx, tz, up > 1.0 && dh < 2.2); return dh; }
    // progress along the route: the furthest square just ahead that Rory is standing on
    if (w.grounded) for (let i = this.navI; i < Math.min(path.length, this.navI + 8); i++) { const q = path[i]; if (Math.hypot(q.x - pp.x, q.z - pp.z) < 0.7 && Math.abs(q.h - pp.y) < 0.8) { if (i > this.navI) this.navMoved = this.t; this.navI = i; } }
    if (w.grounded && this.t - this.navMoved > 3) this.navAt = 0; // not getting anywhere: plan again
    const next = path[this.navI + 1];
    // at the end: step in and jump for it if it is up high
    if (!next) { this.steer(tx, tz, up > 1.0 && w.grounded); if (!w.grounded) inp.jumpHeld = w.vel.y > 0; if (dh < 0.3) inp.forced = { mx: 0, my: 0 }; return dh; }
    if (!w.grounded) { this.steer(next.x, next.z); inp.jumpHeld = w.vel.y > 0; return dh; }
    if (next.how === "pad") { const q = path[this.navI]; this.steer(q.x, q.z); return dh; }
    if (next.how === "jump") { this.steer(next.x, next.z, true); return dh; }
    // a gap: run at it and take off at the edge
    if (next.how === "gap") {
      const d = Math.hypot(next.x - pp.x, next.z - pp.z), ux = (next.x - pp.x) / (d || 1), uz = (next.z - pp.z) / (d || 1);
      this.steer(next.x, next.z, this.nav.top(pp.x + ux * 0.5, pp.z + uz * 0.5) < pp.y - 0.4 || d < 1.0);
      return dh;
    }
    // walking: aim a few squares along, but not past the next jump or pad
    let j = this.navI + 1; while (j + 1 < path.length && j < this.navI + 3 && (path[j + 1].how === "walk" || path[j + 1].how === "drop")) j++;
    this.steer(path[j].x, path[j].z);
    return dh;
  }
  // the moving platform (ferry deck, cable car roof) that carries obj
  moverOf(obj) { let best = null, bd = 3; for (const m of this.w.phys.movers) { const d = m.mesh.position.distanceTo(obj.position); if (d < bd) { bd = d; best = m; } } return best; }
  // autopilot for a target riding on a moving platform: wait on the ground the platform passes
  // closest to, hop on as it comes by, and walk to the target on board
  rideTo(tx, ty, tz, obj, pts = []) {
    const inp = this.g.input, pp = this.p.pos, w = this.p.walker, m = this.moverOf(obj), nav = this.ensureNav(pts);
    if (!m) { this.steer(tx, tz); return; }
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
      // the ground the deck passes closest to over the next minute and a half
      let best = null; const R = Math.max(m.hx, m.hz) + 1.5;
      for (let dt = 0; dt < 90; dt += 0.5) {
        const t = this.w.phys.t + dt, [cx, cy, cz] = m.fn(t);
        const ci = Math.round((cx - nav.x0) / nav.S), cj = Math.round((cz - nav.z0) / nav.S), r = Math.ceil(R / nav.S);
        for (let jj = Math.max(0, cj - r); jj <= Math.min(nav.nz - 1, cj + r); jj++) for (let ii = Math.max(0, ci - r); ii <= Math.min(nav.nx - 1, ci + r); ii++) {
          const k = ii + jj * nav.nx; if (!nav.ok[k] || Math.abs(nav.h[k] - (cy + m.hy)) > 1.2) continue;
          const [nx, nz] = nav.xz(k), d = deck(t, nx, nz).out;
          if (d < 1.0 && (!best || d < best.d)) best = { d, x: nx, y: nav.h[k], z: nz, m };
        }
      }
      this.board = best;
    }
    const now = deck(this.w.phys.t, pp.x, pp.z);
    // it's here: jump aboard, towards a spot well inside the deck
    if (w.grounded && now.out < 1.0 && now.top - pp.y > -0.8 && now.top - pp.y < 1.6) { this.steer(now.x + m.vel.x * 0.25, now.z + m.vel.z * 0.25, true); return; }
    if (!w.grounded) { this.steer(now.x + m.vel.x * 0.2, now.z + m.vel.z * 0.2); inp.jumpHeld = w.vel.y > 0; return; }
    if (!this.board) { this.steer(tx, tz); return; }
    // otherwise go to the waiting spot and wait there
    this.walkTo(this.board.x, this.board.y + 0.7, this.board.z, 0.4, pts);
    if (Math.hypot(this.board.x - pp.x, this.board.z - pp.z) < 0.5) inp.forced = { mx: 0, my: 0 };
  }
  // on a moving platform but heading somewhere else: when ground that leads there (or to the
  // platform wanted next) comes within a hop, jump onto it; until then stand still
  disembark(tx, ty, tz, reach, want = null) {
    const pp = this.p.pos, nav = this.nav, k = nav.nearestOk(pp.x, pp.y, pp.z, 2.4, 1.2);
    const leads = k >= 0 && (this.leadCache || (this.leadCache = new Map())).get(`${k}|${tx.toFixed(0)},${tz.toFixed(0)}`);
    let ok = leads;
    if (k >= 0 && leads === undefined) {
      const [x, z] = nav.xz(k);
      ok = want ? true : !!nav.route(x, nav.h[k], z, tx, ty, tz, reach);
      this.leadCache.set(`${k}|${tx.toFixed(0)},${tz.toFixed(0)}`, ok);
    }
    if (k >= 0 && ok) { const [x, z] = nav.xz(k); this.steer(x, z, true); return; }
    // meanwhile stand at the edge of the deck nearest to where we're going
    const m = this.p.walker.onMover;
    if (m && m.fn) {
      const [cx, , cz, ry = 0] = m.fn(this.w.phys.t), c = Math.cos(ry), sn = Math.sin(ry), dx = tx - cx, dz = tz - cz;
      const ix = Math.max(-(m.hx - 0.5), Math.min(m.hx - 0.5, dx * c - dz * sn)), iz = Math.max(-(m.hz - 0.5), Math.min(m.hz - 0.5, dx * sn + dz * c));
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

// ------------------------------------------------------------ Gravity Cells
class Cells extends Mission {
  start() {
    const spots = this.data.cells || [];
    this.need = Math.min(this.def.n || spots.length, spots.length);
    this.cells = spots.slice(0, this.need).map(s => { const c = this.add(makeCell()); if (Array.isArray(s)) c.position.copy(v3(s)); else { c.userData.follow = s; this.follow(c); } return c; });
    this.got = 0;
  }
  // a cell riding on something that moves (a ferry, a platform)
  follow(c) { const f = c.userData.follow; c.position.set(...f.off).applyQuaternion(f.obj.quaternion).add(f.obj.position); }
  update(dt) {
    const pc = this.p.pos.clone(); pc.y += 0.7;
    for (const c of this.cells) {
      if (!c.visible) continue;
      if (c.userData.follow) this.follow(c);
      spinCell(c, this.t);
      if (c.position.distanceTo(pc) < 1.05) {
        c.visible = false; this.got++;
        this.g.fx.burst(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 30);
        this.g.fx.ring(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 1.5);
        this.g.sound("cell"); this.g.addCells(1);
        if (this.got >= this.need) this.win();
      }
    }
  }
  hud() { return { ...super.hud(), text: `Collect the Gravity Cells  ${this.got}/${this.need}`, progress: this.got / this.need }; }
  debugState() {
    const f = x => Math.round(x * 10) / 10, pp = this.p.pos, w = this.p.walker, a = this.aim;
    return { p: [f(pp.x), f(pp.y), f(pp.z)], aim: a ? this.cells.indexOf(a) : null, aimAt: a ? [f(a.position.x), f(a.position.y), f(a.position.z)] : null, onMover: w.onMover ? this.w.phys.movers.indexOf(w.onMover) : -1, grounded: w.grounded, board: this.board ? [f(this.board.x), f(this.board.y), f(this.board.z)] : null, aimFor: a ? f(this.t - this.aimT) : 0, path: this.navPath ? this.navPath.length : null, navI: this.navI, climb: this.climbI, climbGoal: this.climbGoal };
  }
  target() { const c = this.cells.filter(c => c.visible).sort((a, b) => a.position.distanceTo(this.p.pos) - b.position.distanceTo(this.p.pos))[0]; return c ? c.position : null; }
  // autopilot: play it as a child would: walk, jump, and ride the pads for high cells. Only when a
  // cell has not been reached for 25 s does it teleport there, and it notes the cell so the test
  // can report it (a cell nobody can reach is a bug in the level).
  solve() {
    // keep after one cell until it is collected, then take the nearest
    const c = this.aim && this.aim.visible ? this.aim : this.cells.filter(c => c.visible).sort((a, b) => a.position.distanceTo(this.p.pos) - b.position.distanceTo(this.p.pos))[0];
    if (!c) return;
    const inp = this.g.input, pp = this.p.pos, w = this.p.walker;
    if (c !== this.aim) { this.aim = c; this.aimT = this.t; this.navTo = null; this.board = null; }
    // (a cell on a ferry or cable car may mean waiting a whole trip for it to come round)
    if (this.t - this.aimT > (c.userData.follow ? 75 : this.data.climb ? 45 : 25)) {
      (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} cell ${this.cells.indexOf(c)} at ${c.position.toArray().map(v => v.toFixed(1)).join(",")}`);
      this.p.teleport(c.position.x, c.position.y - 0.7, c.position.z); this.aimT = this.t; return;
    }
    const up = c.position.y - (pp.y + 0.7), dh = Math.hypot(c.position.x - pp.x, c.position.z - pp.z);
    inp.jumpHeld = false;
    // in space: jet up or drift down to the cell's height while flying at it
    if (this.w.jetpack) { this.steer(c.position.x, c.position.z); inp.jumpHeld = up > -0.2; if (dh < 0.4) inp.forced = { mx: 0, my: 0 }; return; }
    // cells riding on something that moves: wait for it and hop on
    if (c.userData.follow) { this.rideTo(c.position.x, c.position.y, c.position.z, c.userData.follow.obj, this.cells.map(c => c.position)); return; }
    // up in a low-gravity bubble: bounce off its pad and float to it
    if (this.zoneFly(c)) return;
    // stairs stacked over stairs (the launch gantry) that the walking map can't see: follow the climb
    if (this.data.climb && this.climb(c)) return;
    // everywhere else: plan a route over the level and follow it
    this.walkTo(c.position.x, c.position.y, c.position.z, 0.8, this.cells.map(c => c.position));
  }
  // A cell high up in a low-gravity bubble (the Taj Mahal's minarets) is reached the way a
  // child would: walk onto the bubble's pad, get thrown up, rise straight up until level with
  // the cell (with an air jump or two if the throw falls short), then drift across to it.
  // Returns false when the cell isn't in a bubble with a pad.
  zoneFly(c) {
    const cp = c.position, pp = this.p.pos, w = this.p.walker, inp = this.g.input;
    const Z = (this.w.zones || []).find(z => Math.hypot(cp.x - z.x, cp.y - z.y, cp.z - z.z) < z.r);
    if (!Z) return false;
    const P = (this.w.pads || []).filter(p => Math.hypot(p.x - Z.x, p.z - Z.z) < Z.r).sort((a, b) => Math.hypot(a.x - cp.x, a.z - cp.z) - Math.hypot(b.x - cp.x, b.z - cp.z))[0];
    if (!P || cp.y < P.y + 3) return false;
    const eye = pp.y + 0.7, dh = Math.hypot(cp.x - pp.x, cp.z - pp.z), inZone = Math.hypot(pp.x - Z.x, eye - Z.y, pp.z - Z.z) < Z.r;
    if (w.grounded) {
      // on a balcony in the bubble: jump for it
      if (inZone && pp.y > P.y + 2) { this.steer(cp.x, cp.z, eye < cp.y); if (dh < 0.3) inp.forced = { mx: 0, my: 0 }; return true; }
      this.walkTo(P.x, P.y + 0.7, P.z, 0.3, this.cells.map(c => c.position));
      return true;
    }
    if (eye < cp.y - 0.6) {
      inp.forced = { mx: 0, my: 0 };
      inp.jumpHeld = w.vel.y > 0;
      if (w.vel.y < 0.5 && inZone) { inp.jumpPressed = true; inp.jumpHeld = true; }
    } else { this.steer(cp.x, cp.z); if (dh < 0.3) inp.forced = { mx: 0, my: 0 }; }
    return true;
  }
  // The walking map has one floor per spot, so a tower of floors and switchback stairs is
  // invisible to it. The level lists the climb instead (a line of points, bottom to top: foot of
  // the stairs, each landing, each turn), and the autopilot walks it up or down, point to point,
  // to the point nearest the cell, then straight to the cell. Returns false when the walking map
  // can do the job.
  climb(c) {
    const P = this.data.climb, pp = this.p.pos, cp = c.position, inp = this.g.input;
    const d3 = (q, x, y, z) => Math.hypot(q[0] - x, q[2] - z) + Math.abs(q[1] - y) * 1.5;
    const at = q => Math.hypot(q[0] - pp.x, q[2] - pp.z) < 0.7 && Math.abs(q[1] - pp.y) < 1.2;
    if (this.climbFor !== c) {
      this.climbFor = c; this.climbAt = false;
      this.ensureNav(this.cells.map(c => c.position));
      const need = !this.nav.route(P[0][0], P[0][1], P[0][2], cp.x, cp.y, cp.z, 0.8);
      this.climbGoal = 0; if (need) P.forEach((q, i) => { if (d3(q, cp.x, cp.y - 1.15, cp.z) < d3(P[this.climbGoal], cp.x, cp.y - 1.15, cp.z)) this.climbGoal = i; });
      this.climbNeed = need;
    }
    const high = pp.y > P[0][1] + 1.5;
    if (!this.climbNeed && !high) { this.climbI = undefined; return false; }
    // fallen off, or not on the climb yet: from the ground, walk to its foot; from up high, the nearest point
    if (this.climbI !== undefined && pp.y < P[this.climbI][1] - 4) this.climbI = undefined;
    if (this.climbI === undefined) {
      if (!high) { if (at(P[0])) { this.climbI = 0; this.climbAt = true; } else { this.walkTo(P[0][0], P[0][1] + 0.7, P[0][2], 0.5, this.cells.map(c => c.position)); return true; } }
      else { let b = 0; P.forEach((q, i) => { if (d3(q, pp.x, pp.y, pp.z) < d3(P[b], pp.x, pp.y, pp.z)) b = i; }); this.climbI = b; this.climbAt = false; }
    }
    const q = P[this.climbI];
    if (!this.climbAt) { this.steer(q[0], q[2]); if (at(q)) this.climbAt = true; return true; }
    if (this.climbI === this.climbGoal) {
      if (!this.climbNeed) { this.climbI = undefined; return false; } // back at the foot: walk from here
      const up = cp.y - (pp.y + 0.7); this.steer(cp.x, cp.z, up > 1.0 && this.p.walker.grounded);
      if (!this.p.walker.grounded) inp.jumpHeld = this.p.walker.vel.y > 0;
      return true;
    }
    const n = P[this.climbI + Math.sign(this.climbGoal - this.climbI)];
    this.steer(n[0], n[2]);
    if (at(n)) this.climbI += Math.sign(this.climbGoal - this.climbI);
    return true;
  }
}

// ------------------------------------------------------------ Floater round-up
class Roundup extends Mission {
  start() {
    const d = this.data;
    this.area = d.area || [0, 0, 10];
    this.need = this.def.n || 4;
    this.bots = [];
    const spots = d.bots || [];
    for (let i = 0; i < this.need; i++) {
      const s = spots[i % Math.max(1, spots.length)] || [this.area[0] + i * 2, 0, this.area[1]];
      const r = new Robot("floater", 1.25); r.root.position.set(s[0], s[1], s[2]); this.add(r.root);
      this.bots.push({ r, state: "walk", goal: this.pickGoal(), t: 0, bubble: null, speed: 1.2 + this.lv * 0.5 });
    }
    this.popped = 0; this.cool = 0;
    this.shots = [];
  }
  pickGoal() { const [x, z, r] = this.area, a = Math.random() * Math.PI * 2, d = Math.random() * r; return [x + Math.cos(a) * d, z + Math.sin(a) * d]; }
  update(dt) {
    const pp = this.p.pos;
    this.cool -= dt;
    for (const b of this.bots) {
      b.r.update(dt);
      if (b.state === "walk") {
        const dx = b.r.pos.x - pp.x, dz = b.r.pos.z - pp.z, dp = Math.hypot(dx, dz);
        // on harder levels the bots run away when Rory gets close
        if (this.lv >= 2 && dp < 5) { const [x, z] = [b.r.pos.x + dx / dp * 4, b.r.pos.z + dz / dp * 4]; const [ax, az, ar] = this.area; const k = Math.hypot(x - ax, z - az) > ar ? 0.3 : 1; b.goal = [ax + (x - ax) * k, az + (z - az) * k]; b.r.play("Running"); b.speed = 2.2 + this.lv * 0.6; }
        else { b.r.play("Walking"); b.speed = 1.2 + this.lv * 0.4; }
        if (b.r.walkTo(b.goal[0], b.goal[1], b.speed, dt) < 0.3) b.goal = this.pickGoal();
        if (this.w.heightAt) b.r.pos.y = this.w.heightAt(b.r.pos.x, b.r.pos.z);
      } else if (b.state === "float") {
        b.t += dt; b.r.pos.y += dt * (1.5 + b.t); b.bubble.position.copy(b.r.pos); b.bubble.position.y += 0.65;
        b.r.root.rotation.y += dt * 2;
        if (b.t > 2.2) { b.state = "gone"; b.r.root.visible = false; b.bubble.visible = false; this.g.fx.burst(b.bubble.position.x, b.bubble.position.y, b.bubble.position.z, 0xff9ae8, 30); this.g.sound("pop"); this.g.addCells(1); }
      }
    }
    // shots in flight
    for (const s of this.shots) {
      if (s.dead) continue;
      s.t += dt;
      s.m.position.addScaledVector(s.v, dt);
      const hit = this.bots.find(b => b.state === "walk" && b.r.pos.distanceTo(s.m.position.clone().setY(b.r.pos.y)) < 1.0 && Math.abs(s.m.position.y - b.r.pos.y - 0.6) < 1.2);
      if (hit) { s.dead = true; s.m.visible = false; this.bubbleUp(hit); }
      else if (s.t > 0.8) { s.dead = true; s.m.visible = false; }
    }
    if (this.g.input.takeAction() && this.cool <= 0) this.fire();
  }
  fire() {
    this.cool = 0.4;
    const p = this.p, dir = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    // aim assist: lean the shot toward the nearest bot in front
    let best = null, bd = 9;
    for (const b of this.bots) { if (b.state !== "walk") continue; const to = b.r.pos.clone().sub(p.pos).setY(0); const d = to.length(); if (d < bd && to.normalize().dot(dir) > 0.6) { bd = d; best = to; } }
    if (best) dir.copy(best);
    const m = this.add(makeBubble(0.3));
    m.position.set(p.pos.x + dir.x * 0.6, p.pos.y + 0.9, p.pos.z + dir.z * 0.6);
    this.shots.push({ m, v: dir.multiplyScalar(14), t: 0 });
    this.g.sound("zap");
  }
  bubbleUp(b) {
    b.state = "float"; b.t = 0; b.r.play("No");
    b.bubble = this.add(makeBubble(0.95));
    this.popped++;
    this.g.fx.burst(b.r.pos.x, b.r.pos.y + 0.8, b.r.pos.z, 0x9ad8ff, 20);
    if (this.popped >= this.need) { this.finishing = true; this.later(1.6, () => this.win()); }
  }
  actionLabel() { return "ZAP"; }
  hud() { return { ...super.hud(), text: `Bubble the Floaters  ${this.popped}/${this.need}`, progress: this.popped / this.need }; }
  target() { const b = this.bots.find(b => b.state === "walk"); return b ? b.r.pos : null; }
  // autopilot: run after the nearest Floater and zap it; teleports (and notes it) only if one can't be caught in 25 s
  solve() {
    const pp = this.p.pos, b = this.bots.filter(b => b.state === "walk").sort((a, c) => a.r.pos.distanceTo(pp) - c.r.pos.distanceTo(pp))[0];
    if (!b) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    if (b !== this.aim) { this.aim = b; this.aimT = this.t; }
    if (this.t - this.aimT > 25) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} floater ${this.bots.indexOf(b)}`); this.p.teleport(b.r.pos.x + 2, b.r.pos.y, b.r.pos.z + 2); this.aimT = this.t; return; }
    this.g.input.jumpHeld = false;
    const d = this.walkTo(b.r.pos.x, b.r.pos.y + 0.6, b.r.pos.z, 2.5, this.bots.map(b => b.r.pos));
    if (d < 3.5 && Math.abs(b.r.pos.y - pp.y) < 1.2) { this.p.yaw = Math.atan2(b.r.pos.x - pp.x, b.r.pos.z - pp.z); this.g.input.actionPressed = true; }
  }
}

// ------------------------------------------------------------ Tractor-beam block stacking
class Stack extends Mission {
  start() {
    const d = this.data;
    this.pad = v3(d.pad || [0, 0, 0]); this.padR = d.padR || 2;
    this.need = this.def.n || 3;
    this.blocks = (d.blocks || []).slice(0, Math.max(this.need, (d.blocks || []).length)).map((s, i) => {
      const col = [0xff6a3a, 0x3ad0ff, 0xffd23f, 0x7bed9f, 0xff6ad5][i % 5];
      const size = d.size || 0.9;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.1, emissive: col, emissiveIntensity: 0.15 }));
      mesh.castShadow = mesh.receiveShadow = true; mesh.position.copy(v3(s)); this.add(mesh);
      const l = this.w.phys.dynamicBox(mesh, size / 2, size / 2, size / 2, { density: 1.5, gravityScale: this.data.gravity ?? 1 });
      return { mesh, ...l, size };
    });
    // the drop pad
    const ring = new THREE.Mesh(new THREE.TorusGeometry(this.padR, 0.08, 10, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7bed9f).multiplyScalar(3) }));
    ring.rotation.x = Math.PI / 2; ring.position.copy(this.pad).setY(this.pad.y + 0.06); this.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(this.padR, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7bed9f), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.copy(this.pad).setY(this.pad.y + 0.05); this.add(disc);
    this.ring = ring;
    this.beam = this.add(makeBeam()); this.beam.visible = false;
    this.carry = null; this.onPad = 0;
  }
  grab(b) {
    this.carry = b; b.body.setBodyType(R.RigidBodyType.KinematicPositionBased, true); b.col.setSensor(true);
    this.g.sound("zap");
  }
  drop() {
    const b = this.carry; this.carry = null;
    b.body.setBodyType(R.RigidBodyType.Dynamic, true); b.col.setSensor(false);
    b.body.setLinvel({ x: Math.sin(this.p.yaw) * 1.2, y: 0, z: Math.cos(this.p.yaw) * 1.2 }, true);
    this.g.sound("land");
  }
  update(dt) {
    const p = this.p;
    if (this.g.input.takeAction()) {
      if (this.carry) this.drop();
      else {
        const near = this.blocks.filter(b => b.mesh.position.distanceTo(p.pos.clone().setY(b.mesh.position.y)) < 2.2 && Math.abs(b.mesh.position.y - p.pos.y) < 2.5).sort((a, b) => a.mesh.position.distanceTo(p.pos) - b.mesh.position.distanceTo(p.pos))[0];
        if (near) this.grab(near);
      }
    }
    if (this.carry) {
      const b = this.carry, t = this.w.t;
      const want = new THREE.Vector3(p.pos.x + Math.sin(p.yaw) * 0.4, p.pos.y + 2.1 + Math.sin(t * 3) * 0.08, p.pos.z + Math.cos(p.yaw) * 0.4);
      b.body.setNextKinematicTranslation(want);
      b.body.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, t * 1.2, 0)));
      this.beam.visible = true;
      const hand = new THREE.Vector3(p.pos.x, p.pos.y + 1.1, p.pos.z);
      aimBeam(this.beam, hand, b.mesh.position);
    } else this.beam.visible = false;
    // count blocks resting on the pad
    let n = 0;
    for (const b of this.blocks) {
      if (b === this.carry) continue;
      const q = b.mesh.position, v = b.body.linvel();
      if (Math.hypot(q.x - this.pad.x, q.z - this.pad.z) < this.padR && q.y < this.pad.y + b.size * 4 && Math.hypot(v.x, v.y, v.z) < 0.5) n++;
    }
    if (n !== this.onPad && n > this.onPad) { this.g.sound("cell"); this.g.fx.ring(this.pad.x, this.pad.y + 0.1, this.pad.z, 0x7bed9f, this.padR); }
    this.onPad = n;
    this.ring.scale.setScalar(1 + Math.sin(this.w.t * 3) * 0.03);
    if (n >= this.need) this.win();
  }
  cleanup() {
    for (const b of this.blocks) this.w.phys.remove(b);
    super.cleanup();
  }
  actionLabel() { return this.carry ? "DROP" : "GRAB"; }
  hud() { return { ...super.hud(), text: `Blocks on the pad  ${this.onPad}/${this.need}`, progress: this.onPad / this.need }; }
  target() { return this.carry ? this.pad : (this.blocks.find(b => Math.hypot(b.mesh.position.x - this.pad.x, b.mesh.position.z - this.pad.z) > this.padR) || {}).mesh?.position || this.pad; }
  // autopilot: walk (round hedges and walls, on the planned route) to a block, grab it, carry it
  // to the pad and drop it
  solve() {
    const pts = [this.pad, ...this.blocks.map(b => b.mesh.position)];
    if (this.carry) {
      const k = this.blocks.indexOf(this.carry) % 3, off = [[0, 0], [0.9, 0.3], [-0.8, -0.4]][k];
      const d = this.walkTo(this.pad.x + off[0], this.pad.y + 0.5, this.pad.z + off[1], 0.4, pts);
      if (d < 0.6) { this.g.input.forced = { mx: 0, my: 0 }; this.g.input.actionPressed = true; }
      return;
    }
    const b = this.blocks.find(b => Math.hypot(b.mesh.position.x - this.pad.x, b.mesh.position.z - this.pad.z) > this.padR - 0.2);
    if (!b) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    const q = b.mesh.position, d = this.walkTo(q.x, q.y, q.z, 1.4, pts);
    if (d < 1.8) { this.g.input.forced = { mx: 0, my: 0 }; this.g.input.actionPressed = true; }
  }
}


// ------------------------------------------------------------ Pin it down: things float up, Rory pins them back
class Tractor extends Mission {
  start() {
    const d = this.data;
    this.need = this.def.n || 6;
    this.allowLoss = Math.max(1, 4 - this.lv);
    this.items = (d.things || []).map(([kind, x, y, z, ry, color], i) => {
      const o = this.add(thing(kind, color)); o.position.set(x, y, z); o.rotation.y = ry || 0;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1 * o.userData.size, 0.05, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5ad8).multiplyScalar(3) }));
      ring.rotation.x = Math.PI / 2; ring.visible = false; this.add(ring);
      return { o, ring, y0: y, state: "wait", at: 1.5 + i * (4.2 - this.lv * 0.6), h: 0, spin: (Math.random() - 0.5) * 0.8 };
    });
    this.pinned = 0; this.lost = 0;
  }
  update(dt) {
    const pp = this.p.pos;
    let near = null, nd = 3.2;
    for (const it of this.items) {
      if (it.state === "wait" && this.t >= it.at) { it.state = "float"; this.g.fx.puff(it.o.position.x, it.y0 + 0.2, it.o.position.z, 0x9ad8ff, 12); }
      if (it.state === "float") {
        it.h += dt * (0.55 + this.lv * 0.18) * (1 + it.h * 0.08);
        it.o.position.y = it.y0 + it.h; it.o.rotation.z = Math.sin(this.t * 1.3 + it.at) * 0.25; it.o.rotation.y += it.spin * dt;
        it.ring.visible = true; it.ring.position.set(it.o.position.x, it.y0 + 0.05, it.o.position.z); it.ring.scale.setScalar(1 + Math.sin(this.t * 5) * 0.08);
        const d = Math.hypot(it.o.position.x - pp.x, it.o.position.z - pp.z);
        if (d < nd && it.h < 9) { nd = d; near = it; }
        if (it.h > 12) { it.state = "lost"; it.ring.visible = false; this.lost++; this.g.sound("fail"); if (this.lost >= this.allowLoss + (this.items.length - this.need)) { this.lose("IT FLOATED AWAY"); return; } }
      }
      if (it.state === "drop") {
        it.v = (it.v || 0) + 30 * dt; it.o.position.y -= it.v * dt;
        if (it.o.position.y <= it.y0) { it.o.position.y = it.y0; it.state = "pinned"; it.o.rotation.z = 0; this.g.fx.puff(it.o.position.x, it.y0 + 0.1, it.o.position.z, 0xd8c8a8, 18); this.g.sound("land"); this.pinned++; this.g.addCells(1); if (this.pinned >= this.need) this.win(); }
      }
      if (it.state === "lost") it.o.position.y += dt * 4;
    }
    this.near = near;
    if (near) { this.beam.visible = true; aimBeam(this.beam, new THREE.Vector3(pp.x, pp.y + 1.1, pp.z), near.o.position); } else if (this.beam) this.beam.visible = false;
    if (this.g.input.takeAction() && near) { near.state = "drop"; near.v = 0; near.ring.visible = false; this.g.sound("zap"); this.g.fx.burst(near.o.position.x, near.o.position.y, near.o.position.z, 0xff9ae8, 16); }
  }
  get beam() { if (!this._beam) { this._beam = this.add(makeBeam(0xff9ae8)); this._beam.visible = false; } return this._beam; }
  actionLabel() { return "PIN"; }
  hud() { return { ...super.hud(), text: `Pin them down  ${this.pinned}/${this.need}`, progress: this.pinned / this.need }; }
  target() { const f = this.items.filter(i => i.state === "float").sort((a, b) => b.h - a.h)[0]; return f ? f.o.position : null; }
  solve() {
    // the most urgent thing Rory can still get to before it floats out of reach (a smart player's choice)
    const pp = this.p.pos, rate = it => (0.55 + this.lv * 0.18) * (1 + it.h * 0.08);
    const live = this.items.filter(i => i.state === "float"), can = live.filter(it => Math.hypot(it.o.position.x - pp.x, it.o.position.z - pp.z) / 6.5 < (9 - it.h) / rate(it));
    const f = (can.length ? can : live).sort((a, b) => b.h - a.h)[0];
    if (!f) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    this.g.input.jumpHeld = false;
    const d = this.walkTo(f.o.position.x, f.y0 + 0.7, f.o.position.z, 2.0, this.items.map(i => i.o.position));
    if (d < 2.5 && this.near === f) { this.g.input.forced = { mx: 0, my: 0 }; this.g.input.actionPressed = true; }
  }
}

// ------------------------------------------------------------ BOLT flies through rings
class Drone extends Mission {
  start() {
    const d = this.data;
    this.rings = (d.rings || []).map((r, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(r[3] || 1.6, 0.12, 12, 48), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb020, emissiveIntensity: 1.5, roughness: 0.3 }));
      m.position.set(r[0], r[1], r[2]); m.rotation.y = r[4] || 0; this.add(m);
      return { m, r: r[3] || 1.6, passed: false, i };
    });
    this.next = 0;
    const b = this.g.bolt;
    this.pos = b.pos.clone(); this.pos.y += 0.5; this.vel = new THREE.Vector3();
    this.g.droneMode = this;
    this.jets = [0, 1].map(() => { const j = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(3), transparent: true, opacity: 0.8 })); j.rotation.x = Math.PI; this.add(j); return j; });
    this.paint();
  }
  paint() { this.rings.forEach((r, i) => { const on = i === this.next; r.m.material.emissive.setHex(r.passed ? 0x2a8a3a : on ? 0xffb020 : 0x5a4a20); r.m.material.emissiveIntensity = on ? 2.2 : 0.6; r.m.visible = !r.passed || i === this.next - 1; }); }
  // BOLT's flight: stick moves across, JUMP climbs, letting go sinks slowly
  fly(dt) {
    const inp = this.g.input, p = this.p;
    const fx = -Math.sin(p.camYaw), fz = -Math.cos(p.camYaw);
    const ax = (inp.my * fx - inp.mx * fz) * 16, az = (inp.my * fz + inp.mx * fx) * 16;
    const ay = inp.jumpHeld ? 12 : (inp.forcedY ?? -3);
    this.vel.x += ax * dt; this.vel.z += az * dt; this.vel.y += ay * dt;
    this.vel.multiplyScalar(Math.exp(-dt * 2.2));
    this.pos.addScaledVector(this.vel, dt);
    const gnd = this.g.phys.ray({ x: this.pos.x, y: this.pos.y + 0.5, z: this.pos.z }, { x: 0, y: -1, z: 0 }, 40, this.p.walker.col);
    const floor = gnd !== null ? this.pos.y + 0.5 - gnd : -10;
    if (this.pos.y < floor + 0.3) { this.pos.y = floor + 0.3; this.vel.y = Math.max(0, this.vel.y); }
    this.pos.y = Math.min(this.pos.y, (this.data.ceiling ?? 40));
    const b = this.g.bolt;
    b.pos.copy(this.pos);
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.5) { let r = Math.atan2(this.vel.x, this.vel.z) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 6); }
    b.root.rotation.x = Math.min(0.4, sp * 0.04);
    b.play("Jump");
    for (let i = 0; i < 2; i++) { const j = this.jets[i]; j.position.set(this.pos.x + Math.cos(b.root.rotation.y) * (i ? 0.2 : -0.2), this.pos.y - 0.15, this.pos.z - Math.sin(b.root.rotation.y) * (i ? 0.2 : -0.2)); j.scale.y = 0.8 + Math.random() * 0.5 + (inp.jumpHeld ? 0.6 : 0); }
    if (Math.random() < 0.5) this.g.fx.trail(this.pos.x, this.pos.y - 0.3, this.pos.z, 0x7fe3ff, 0.2);
  }
  update(dt) {
    this.fly(dt);
    const r = this.rings[this.next];
    if (!r) return;
    r.m.rotation.z += dt * 0.5;
    const d = this.pos.distanceTo(r.m.position);
    if (d < r.r * 0.95) {
      r.passed = true; this.next++; this.paint(); this.g.sound("cell"); this.g.fx.ring(r.m.position.x, r.m.position.y, r.m.position.z, 0xffd166, 2);
      if (this.next >= this.rings.length) this.win();
    }
  }
  camera(cam, dt) {
    const p = this.p, back = new THREE.Vector3(Math.sin(p.camYaw) * 6, 2.4, Math.cos(p.camYaw) * 6);
    const want = this.pos.clone().add(back);
    cam.position.lerp(want, 1 - Math.exp(-dt * 6)); cam.lookAt(this.pos.x, this.pos.y + 0.4, this.pos.z);
    this.g.world.followShadow(this.pos);
  }
  cleanup() { this.g.droneMode = null; this.g.bolt.root.rotation.x = 0; this.g.input.forcedY = undefined; this.g.input.jumpHeld = false; super.cleanup(); }
  hud() { return { ...super.hud(), text: `Fly BOLT through the rings  ${this.next}/${this.rings.length}`, progress: this.next / this.rings.length }; }
  target() { const r = this.rings[this.next]; return r ? r.m.position : null; }
  solve() {
    const r = this.rings[this.next]; if (!r) return;
    const dx = r.m.position.x - this.pos.x, dz = r.m.position.z - this.pos.z, dy = r.m.position.y - this.pos.y;
    this.p.camYaw = Math.atan2(-dx, -dz);
    const inp = this.g.input;
    inp.forced = Math.hypot(dx, dz) > 0.5 ? { mx: 0, my: Math.min(1, Math.hypot(dx, dz) / 4) } : { mx: 0, my: 0 };
    inp.jumpHeld = dy > 0.2; inp.forcedY = dy < -0.2 ? -8 : -1;
  }
}

// ------------------------------------------------------------ Laser hall
// Three kinds of beam: a low bar to jump, a pillar of light that sweeps across
// the hall (go when it's on the other side), and a bar that blinks on and off
// (go while it's off; it flickers just before it comes back).
class Lasers extends Mission {
  start() {
    const d = this.data;
    this.from = v3(d.start); this.goal = v3(d.goal); this.width = d.width || 6;
    const dir = this.goal.clone().sub(this.from); this.len = dir.length(); dir.normalize(); this.dir = dir;
    this.side = new THREE.Vector3(dir.z, 0, -dir.x);
    const n = d.beams || (3 + this.lv * 2);
    const KIND = ["sweep", "low", "blink"];
    this.beams = [];
    for (let i = 0; i < n; i++) {
      const kind = KIND[(i + this.lv) % 3];
      const g = new THREE.Group(); this.add(g);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a3a).multiplyScalar(4), transparent: true });
      const geo = kind === "sweep" ? new THREE.BoxGeometry(0.08, 2.4, 0.08) : new THREE.BoxGeometry(0.07, 0.07, this.width);
      const m = new THREE.Mesh(geo, mat); g.add(m);
      // emitters on the walls
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.7 })); e.position.set(0, 0, s * this.width / 2); if (kind !== "sweep") g.add(e); }
      this.beams.push({ g, m, kind, f: (i + 1) / (n + 1),
        y: kind === "low" ? 0.35 : kind === "blink" ? 1.0 : 1.2,
        speed: (0.7 + this.lv * 0.22) * (1 + (i % 3) * 0.12), phase: i * 1.9,
        on: 1.5 - this.lv * 0.12, off: 1.5 - this.lv * 0.1 });
    }
    this.case = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0xc0c8d0, metalness: 0.8, roughness: 0.25, emissive: 0x7fe3ff, emissiveIntensity: 0.4 })));
    this.case.position.copy(this.goal).setY(this.goal.y + 0.9);
    // in a space suit Rory could fly over the lot, so a laser net overhead keeps him low
    // enough that the bars still catch him
    if (this.w.jetpack) {
      const mid = this.from.clone().lerp(this.goal, 0.5), ry = Math.atan2(dir.x, dir.z), L = this.len + 3, top = this.from.y + 2.25;
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const g = c.getContext("2d"); g.strokeStyle = "#ff3040"; g.lineWidth = 3; g.strokeRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(this.width / 0.8, L / 0.8);
      const net = this.add(new THREE.Mesh(new THREE.PlaneGeometry(this.width, L), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1, 1, 1).multiplyScalar(1.5), transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })));
      net.rotation.set(-Math.PI / 2, ry, 0, "YXZ"); net.position.set(mid.x, top, mid.z);
      this.ceil = this.w.phys.fixedBox(mid.x, top + 0.1, mid.z, this.width / 2, 0.1, L / 2, ry, { tag: "camthru" });
    }
    this.tries = 0;
    this.p.teleport(this.from.x, this.from.y, this.from.z, Math.atan2(dir.x, dir.z));
  }
  // where the sweeping pillar is across the hall at time t (-w/2..w/2)
  across(b, t) { return b.kind === "sweep" ? Math.sin(t * b.speed + b.phase) * this.width * 0.42 : 0; }
  // is a blinking bar lit at time t?
  lit(b, t) { if (b.kind !== "blink") return true; const per = b.on + b.off, u = ((t + b.phase) % per + per) % per; return u < b.on; }
  update(dt) {
    const pp = this.p.pos;
    const rel = pp.clone().sub(this.from), along = rel.dot(this.dir), acr = rel.dot(this.side), feet = pp.y - this.from.y, head = feet + 1.35;
    for (const b of this.beams) {
      const a = this.across(b, this.t);
      b.g.position.copy(this.from).addScaledVector(this.dir, b.f * this.len).addScaledVector(this.side, a).setY(this.from.y + b.y);
      b.g.rotation.y = Math.atan2(this.side.x, this.side.z);
      const on = this.lit(b, this.t);
      // a blinking bar flickers for half a second before it comes back on
      const per = b.on + b.off, u = ((this.t + b.phase) % per + per) % per;
      const warn = b.kind === "blink" && !on && u > per - 0.5;
      b.m.visible = on || (warn && Math.sin(this.t * 40) > 0);
      b.m.material.opacity = on ? 1 : 0.4;
      if (!on) continue;
      const da = along - b.f * this.len;
      let hit;
      if (b.kind === "sweep") hit = Math.abs(da) < 0.35 && Math.abs(acr - a) < 0.4;
      else hit = Math.abs(da) < 0.3 && Math.abs(acr) < this.width / 2 && b.y > feet && b.y < head;
      if (hit) { this.zap(); return; }
    }
    if (pp.distanceTo(this.goal) < 1.3) { this.g.fx.burst(this.case.position.x, this.case.position.y, this.case.position.z, 0x7fe3ff, 30); this.case.visible = false; this.win(); }
    this.case.rotation.y += dt;
  }
  zap() {
    this.tries++; this.g.sound("hit");
    this.g.fx.burst(this.p.pos.x, this.p.pos.y + 0.8, this.p.pos.z, 0xff3a3a, 30);
    this.p.teleport(this.from.x, this.from.y, this.from.z, Math.atan2(this.dir.x, this.dir.z));
    this.left = Math.max(1, this.left - 3);
  }
  cleanup() { if (this.ceil) { this.w.phys.world.removeCollider(this.ceil, false); this.ceil = null; } super.cleanup(); }
  stars() { const s = super.stars(); return Math.max(1, s - (this.tries > 2 ? 1 : 0)); }
  hud() { return { ...super.hud(), text: this.tries ? `Reach the case — zapped ${this.tries}×` : "Jump the low beams. Wait for the others.", progress: Math.max(0, Math.min(1, this.p.pos.clone().sub(this.from).dot(this.dir) / this.len)) }; }
  target() { return this.goal; }
  // autopilot: keep to the middle, stop short of each beam, go when it will stay clear
  solve() {
    const pp = this.p.pos, inp = this.g.input, w = this.p.walker;
    const rel = pp.clone().sub(this.from), along = rel.dot(this.dir), acr = rel.dot(this.side), feet = pp.y - this.from.y;
    this.p.camYaw = Math.atan2(-this.dir.x, -this.dir.z);
    inp.jumpHeld = false;
    // steer back to the middle (side points to Rory's left, and the stick's +x is to his right)
    const mid = Math.max(-1, Math.min(1, acr * 0.8));
    // the first beam not yet behind him (a beam is only behind once he is clear of it)
    const next = this.beams.find(b => along - b.f * this.len < 0.5);
    if (!next) { inp.forced = { mx: mid, my: 1 }; return; }
    const ahead = next.f * this.len - along;
    this.dbg = { along: +along.toFixed(2), acr: +acr.toFixed(2), feet: +feet.toFixed(2), next: this.beams.indexOf(next), kind: next.kind, ahead: +ahead.toFixed(2) };
    if (next.kind === "low") {
      if (this.w.jetpack) {
        // in a space suit: fly up before the beam, drift over it, and keep flying till past
        inp.jumpHeld = feet < 0.9 && ahead < 2.5 && ahead > -0.5;
        inp.forced = { mx: mid, my: ahead > 1.3 || feet > 0.6 ? 1 : 0 };
      } else {
        // jump it, holding the button for the full height
        if (ahead < 1.15 && ahead > 0.35 && w.grounded) { inp.jumpPressed = true; inp.jumpHeld = true; }
        else if (!w.grounded && ahead > -0.5) inp.jumpHeld = w.vel.y > 0;
        inp.forced = { mx: mid, my: 1 };
      }
      return;
    }
    // under a pillar or bar already: keep going
    if (ahead < 0.4) { inp.forced = { mx: mid, my: 1 }; return; }
    const cross = ((ahead + 0.6) / 5.2) * 1.6 + 0.2;      // seconds until we're clear of it, with room to spare
    let go = true;
    if (next.kind === "sweep") { for (let k = 0; k <= 8; k++) if (Math.abs(this.across(next, this.t + cross * k / 8) - acr) < 1.1) go = false; }
    else { for (let k = 0; k <= 8; k++) if (this.lit(next, this.t + cross * k / 8)) go = false; }
    if (go) inp.forced = { mx: mid, my: 1 };
    else inp.forced = { mx: mid, my: ahead > 1.6 ? 0.6 : 0 };
    this.dbg.go = go;
  }
  debugState() { return { ...(this.dbg || {}), tries: this.tries }; }
}

// ------------------------------------------------------------ Car chase: catch the Floater and bump it
class Chase extends Mission {
  start() {
    const d = this.data;
    const hAt = this.w.heightAt || (() => 0);
    this.hAt = (x, z) => hAt(x, z) + (d.y ?? 0.2);
    const pts = d.path.map(([x, z]) => new THREE.Vector3(x, this.hAt(x, z), z));
    this.curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    this.len = this.curve.getLength();
    const p0 = this.curve.getPointAt(0), t0 = this.curve.getTangentAt(0);
    this.car = new Car(this.w, p0.x, p0.y, p0.z, Math.atan2(t0.x, t0.z), d.car || "kart", d.carOpts || {});
    this.need = this.def.n || 3;
    this.s = d.lead ?? 28; this.qv = 0; this.boostT = 0; this.cool = 0; this.tags = 0; this.wob = 0;
    // the quarry: a Floater in its own car, driven along the route
    const q = this.q = new THREE.Group(); this.add(q);
    const qc = new Car(this.w, 0, -50, 0, 0, d.quarry || "kart", { color: 0x8a4ad8, trim: 0xff5ad8 });
    q.add(qc.mesh); qc.mesh.position.set(0, 0, 0); this.w.phys.world.removeVehicleController(qc.vc); this.w.phys.world.removeRigidBody(qc.body);
    this.qcar = qc;
    this.bot = new Robot("floater", 1.0); this.bot.root.position.set(0, 0.2, -0.3); this.bot.play("Sitting"); q.add(this.bot.root);
    this.qbody = this.w.phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -50, 0));
    this.w.phys.world.createCollider(R.ColliderDesc.cuboid(0.9, 0.5, 1.4).setTranslation(0, 0.5, 0), this.qbody);
    this.g.driveMode = this;
    this.p.walker.col.setEnabled(false);
    this.g.bolt.root.visible = false;
    this.placeQuarry(0);
  }
  placeQuarry(dt) {
    const u = ((this.s % this.len) + this.len) % this.len / this.len;
    const p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u);
    p.y = this.hAt(p.x, p.z);
    this.wob = Math.max(0, this.wob - dt * 2);
    const yaw = Math.atan2(t.x, t.z) + Math.sin(this.wob * 20) * this.wob * 0.6;
    this.q.position.copy(p); this.q.rotation.y = yaw;
    const qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    this.qbody.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z }); this.qbody.setNextKinematicRotation({ x: qq.x, y: qq.y, z: qq.z, w: qq.w });
    for (const w of this.qcar.wheelMeshes) { w.position.y = -0.3 + 0.34; w.rotation.x += dt * this.qv / 0.34; }
    this.qcar.wheelMeshes.forEach((w, i) => { const sx = i % 2 ? 1 : -1, sz = i < 2 ? 1 : -1; w.position.x = sx * this.qcar.L.w * 0.95; w.position.z = sz * this.qcar.L.l * 0.72; });
  }
  // how far along the route Rory's car is, searched near where it was
  carS() {
    const cp = this.car.pos; let best = this.cs || 0, bd = 1e9;
    for (let k = -30; k <= 30; k++) { const s = (this.cs || 0) + k * 1.5; const u = ((s % this.len) + this.len) % this.len / this.len; const d = this.curve.getPointAt(u).distanceToSquared(cp); if (d < bd) { bd = d; best = s; } }
    this.cs = best; return best;
  }
  update(dt) {
    const inp = this.g.input;
    const throttle = inp.my < -0.3 ? -1 : (this.autoThrottle ?? 1);
    const boost = inp.takeJump() || this.autoBoost;
    this.car.drive(dt, throttle, inp.mx, boost);
    this.autoBoost = false;
    // stuck against a wall with the pedal down for two seconds: back on the road, facing the right way
    this.stuckT = Math.abs(this.car.speed) < 0.6 && throttle > 0 ? (this.stuckT || 0) + dt : 0;
    if (this.stuckT > 2) { this.stuckT = 0; this.backOnRoad(); }
    // the quarry keeps its distance: slower when far ahead, faster when caught up
    const cs = this.carS();
    // how fast Rory is actually getting along the route (not his speedometer: a wide line round
    // the corners covers more ground than the route does)
    if (this.lastCs !== undefined && dt > 0) this.csv = (this.csv ?? 0) + (Math.max(0, (cs - this.lastCs) / dt) - (this.csv ?? 0)) * Math.min(1, dt * 1.5);
    this.lastCs = cs;
    const gap = this.s - cs, base = 10 + this.lv * 1.6, rv = this.csv ?? 0;
    // the Floater always stays catchable: it drives a little slower along the route than Rory
    // does, by more the further behind he is, however slowly he drives
    const r = gap > 40 ? 0.6 : gap > 14 ? 0.8 : 0.86;
    let v = Math.min(base, Math.max(3, rv * r));
    if (this.boostT > 0) { this.boostT -= dt; v += 7; }
    this.qv += (v - this.qv) * Math.min(1, dt * 2);
    this.s += this.qv * dt;
    this.placeQuarry(dt);
    this.bot.update(dt);
    this.cool -= dt;
    const d = this.car.pos.distanceTo(this.q.position);
    // a bump counts from about a metre off its back bumper: close enough is close enough
    if (d < 4.2 && this.cool <= 0) {
      this.tags++; this.cool = 2.2; this.boostT = 1.6; this.wob = 1;
      this.g.fx.burst(this.q.position.x, this.q.position.y + 1, this.q.position.z, 0xffd166, 36, { speed: 6 });
      this.g.sound("hit"); this.bot.play("No");
      if (this.tags >= this.need) { this.bubble(); }
    }
    if (this.car.boost > 0 && Math.random() < 0.8) { const f = this.car.forward(); this.g.fx.trail(this.car.pos.x - f.x * 1.6, this.car.pos.y + 0.2, this.car.pos.z - f.z * 1.6, 0x7fe3ff, 0.35); }
  }
  debugState() { const f = x => Math.round(x * 10) / 10; return { gap: f(this.s - (this.cs || 0)), qv: f(this.qv), rv: f(this.csv || 0), tags: this.tags, cs: f(this.cs || 0), resets: this.resets || 0 }; }
  // put Rory's car back on the route where he'd got to, pointing along it
  backOnRoad() {
    const s = (this.cs || 0) + 3, u = ((s % this.len) + this.len) % this.len / this.len;
    const p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u), yaw = Math.atan2(t.x, t.z);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), b = this.car.body;
    b.setTranslation({ x: p.x, y: this.hAt(p.x, p.z) + 0.9, z: p.z }, true); b.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    b.setLinvel({ x: 0, y: 0, z: 0 }, true); b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.resets = (this.resets || 0) + 1;
    this.g.fx.puff(p.x, p.y + 0.3, p.z, 0xd8d8e0, 20);
    toast("Back on the road!", 1.6);
  }
  bubble() {
    this.qv = 0; this.boostT = 0;
    const b = this.add(makeBubble(1.8)); b.position.copy(this.q.position).setY(this.q.position.y + 0.9);
    this.g.sound("pop"); this.g.addCells(1);
    this.win();
  }
  post() { this.car.sync(); }
  ride(dt) {
    const pl = this.p, car = this.car, seat = car.seat.clone().applyQuaternion(car.mesh.quaternion).add(car.pos);
    pl.obj.position.copy(seat); pl.obj.quaternion.copy(car.mesh.quaternion);
    pl.blob.visible = false;
    animateSeat(pl.rig, dt, this.car.steer);
  }
  camera(cam, dt) {
    const f = this.car.forward(), c = this.car.pos;
    const want = new THREE.Vector3(c.x - f.x * 7.5, c.y + 3.2, c.z - f.z * 7.5);
    const hit = this.g.phys.ray({ x: c.x, y: c.y + 1.5, z: c.z }, { x: -f.x, y: 0.2, z: -f.z }, 7.5, this.car.col);
    if (hit !== null && hit < 7) want.set(c.x - f.x * (hit - 0.5), c.y + 3.2, c.z - f.z * (hit - 0.5));
    cam.position.lerp(want, 1 - Math.exp(-dt * 5));
    cam.lookAt(c.x + f.x * 5, c.y + 0.8, c.z + f.z * 5);
    this.g.world.followShadow(c);
    this.p.camYaw = Math.atan2(-f.x, -f.z) + Math.PI;
  }
  cleanup() {
    const c = this.car.pos.clone(), yaw = this.car.yaw;
    this.car.remove();
    this.w.phys.world.removeRigidBody(this.qbody);
    this.g.driveMode = null;
    this.p.walker.col.setEnabled(true);
    this.p.teleport(c.x + 2, c.y + 0.3, c.z, yaw);
    this.p.obj.quaternion.identity();
    this.g.bolt.root.visible = true; this.g.bolt.pos.set(c.x + 3, c.y, c.z);
    super.cleanup();
  }
  hud() { return { ...super.hud(), text: `Catch the Floater and bump it  ${this.tags}/${this.need}`, progress: this.tags / this.need }; }
  target() { return this.q.position; }
  actionLabel() { return null; }
  solve() {
    const car = this.car, cp = car.pos, f = car.forward();
    const cs = this.carS();
    const gap = this.s - cs;
    let tgt;
    if (gap < 14) tgt = this.q.position.clone();
    else { const u = (((cs + 9) % this.len) + this.len) % this.len / this.len; tgt = this.curve.getPointAt(u); }
    const to = tgt.clone().sub(cp).setY(0).normalize();
    const cross = f.x * to.z - f.z * to.x, dot = f.x * to.x + f.z * to.z;
    const ang = Math.atan2(cross, dot);
    this.g.input.forced = { mx: Math.max(-1, Math.min(1, ang * 2.2)), my: 0 };
    // look up the road: how much it turns in the next stretch, and ease off for a sharp corner
    const at = k => { const u = ((((cs + k) % this.len) + this.len) % this.len) / this.len, t = this.curve.getTangentAt(u); return Math.atan2(t.x, t.z); };
    let bend = at(car.speed * 1.6 + 6) - at(2); bend = Math.abs(Math.atan2(Math.sin(bend), Math.cos(bend)));
    const safe = bend > 1.0 ? 9 : bend > 0.5 ? 13 : 99;
    this.autoThrottle = (Math.abs(ang) > 1.2 && car.speed > 8) || car.speed > safe + 3 ? -1 : car.speed > safe ? 0.2 : 1;
    this.autoBoost = (gap > 18 || gap < 10) && Math.abs(ang) < 0.25 && bend < 0.3;
  }
}
function animateSeat(rig, dt, steer) {
  rig.legL.rotation.set(-1.45, 0, 0); rig.legR.rotation.set(-1.45, 0, 0); rig.kneeL.rotation.x = 1.3; rig.kneeR.rotation.x = 1.3;
  rig.hips.position.y = rig.S.leg * 0.45;
  rig.armL.rotation.set(-1.0, 0, -0.15 - steer * 0.3); rig.armR.rotation.set(-1.0, 0, 0.15 - steer * 0.3); rig.elbowL.rotation.x = -0.5; rig.elbowR.rotation.x = -0.5;
  rig.spine.rotation.set(0, 0, steer * 0.12);
  void dt;
}

// ------------------------------------------------------------ Sneak past the guard bots' searchlights
class Stealth extends Mission {
  start() {
    const d = this.data;
    this.from = v3(d.start); this.goal = v3(d.goal);
    const L = d.range || (7 + this.lv), half = (d.angle || 26 + this.lv * 3) * Math.PI / 180;
    this.range = L; this.half = half;
    this.guards = (d.guards || []).map((gd, i) => {
      const r = new Robot("guard", 1.45); this.add(r.root);
      const pts = gd.path.map(([x, z]) => new THREE.Vector2(x, z));
      const segs = []; let total = 0;
      for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; const l = a.distanceTo(b); segs.push({ a, b, l, t0: total }); total += l; }
      const cone = new THREE.Mesh(new THREE.CircleGeometry(L, 24, -half, half * 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe066).multiplyScalar(1.5), transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }));
      cone.rotation.x = -Math.PI / 2; this.add(cone);
      return { r, segs, total, speed: (gd.speed || 1.6) * (0.8 + this.lv * 0.15), pause: gd.pause ?? 1.2, y: gd.y ?? this.from.y, cone, phase: gd.phase || 0, turn: gd.turn || 0 };
    });
    this.case = this.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0xc0c8d0, metalness: 0.8, roughness: 0.25, emissive: 0x7fe3ff, emissiveIntensity: 0.5 })));
    this.case.position.copy(this.goal).setY(this.goal.y + 0.9);
    this.caught = 0; this.flash = 0;
    this.p.teleport(this.from.x, this.from.y, this.from.z);
    this.route = (d.route || []).map(v3); this.ri = 0;
  }
  // where a guard is at time t: walking its loop, stopping at each corner to look round
  pose(g, t) {
    const per = g.total / g.speed + g.segs.length * g.pause;
    let u = ((t + g.phase) % per + per) % per;
    for (const s of g.segs) {
      const walk = s.l / g.speed;
      if (u < g.pause) { const n = s.b.clone().sub(s.a); const prev = g.segs[(g.segs.indexOf(s) - 1 + g.segs.length) % g.segs.length]; const pn = prev.b.clone().sub(prev.a); const y0 = Math.atan2(pn.x, pn.y), y1 = Math.atan2(n.x, n.y); let dy = y1 - y0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); return { x: s.a.x, z: s.a.y, yaw: y0 + dy * (u / g.pause) + Math.sin(u * 3) * g.turn, moving: false }; }
      u -= g.pause;
      if (u < walk) { const f = u / walk; return { x: s.a.x + (s.b.x - s.a.x) * f, z: s.a.y + (s.b.y - s.a.y) * f, yaw: Math.atan2(s.b.x - s.a.x, s.b.y - s.a.y), moving: true }; }
      u -= walk;
    }
    const s = g.segs[0]; return { x: s.a.x, z: s.a.y, yaw: 0, moving: false };
  }
  sees(g, pose, x, z, y = this.from.y) {
    const dx = x - pose.x, dz = z - pose.z, d = Math.hypot(dx, dz);
    if (d > this.range || d < 0.01) return d < 0.9;
    let a = Math.atan2(dx, dz) - pose.yaw; a = Math.atan2(Math.sin(a), Math.cos(a));
    if (Math.abs(a) > this.half) return false;
    // walls block the light
    const hit = this.g.phys.ray({ x: pose.x, y: y + 1.0, z: pose.z }, { x: dx / d, y: 0, z: dz / d }, d, this.p.walker.col);
    return hit === null || hit > d - 0.4;
  }
  update(dt) {
    const pp = this.p.pos;
    this.flash = Math.max(0, this.flash - dt);
    for (const g of this.guards) {
      const ps = this.pose(g, this.t);
      g.r.pos.set(ps.x, g.y, ps.z); g.r.root.rotation.y = ps.yaw; g.r.play(ps.moving ? "Walking" : "Idle"); g.r.update(dt);
      g.cone.position.set(ps.x, g.y + 0.06, ps.z); g.cone.rotation.z = ps.yaw - Math.PI / 2;
      g.cone.material.color.setHex(this.flash > 0 ? 0xff3a3a : 0xffe066).multiplyScalar(1.5);
      if (this.flash <= 0 && this.sees(g, ps, pp.x, pp.z)) { this.spotted(g); return; }
    }
    if (pp.distanceTo(this.goal) < 1.3) { this.case.visible = false; this.g.fx.burst(this.goal.x, this.goal.y + 1, this.goal.z, 0x7fe3ff, 30); this.win(); }
    this.case.rotation.y += dt;
  }
  spotted(g) {
    this.caught++; this.flash = 1.2; this.g.sound("fail"); g.r.play("Punch");
    this.g.fx.burst(this.p.pos.x, this.p.pos.y + 1.2, this.p.pos.z, 0xff3a3a, 24);
    this.p.teleport(this.from.x, this.from.y, this.from.z); this.ri = 0;
    this.spot = (this.spot || 0) + 1;
    if (this.route2) this.route2.stale = true;
  }
  stars() { return this.caught === 0 ? 3 : this.caught < 3 ? 2 : 1; }
  hud() { return { ...super.hud(), text: this.caught ? `Reach the case unseen — spotted ${this.caught}×` : "Sneak to the case. Stay out of the searchlights!", progress: null }; }
  target() { return this.goal; }
  // autopilot: plan a path through space and time that no searchlight ever
  // touches (breadth-first over grid cells, one layer per fifth of a second),
  // then follow it. If there's no such path the level can't be done, and the
  // plan says so.
  plan() {
    const cell = 0.8, dt = 0.2, steps = 600, y = this.from.y;
    const pts = [this.from, this.goal, ...this.guards.flatMap(g => g.segs.map(s => new THREE.Vector3(s.a.x, 0, s.a.y)))];
    const x0 = Math.min(...pts.map(p => p.x)) - 3, z0 = Math.min(...pts.map(p => p.z)) - 3, x1 = Math.max(...pts.map(p => p.x)) + 3, z1 = Math.max(...pts.map(p => p.z)) + 3;
    const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell), N = nx * nz;
    const cx = i => x0 + (i % nx + 0.5) * cell, cz = i => z0 + (Math.floor(i / nx) + 0.5) * cell;
    const world = this.g.phys.world, me = this.p.walker.col;
    const blockedAt = (x, z) => { let hit = false; for (const [ox, oz] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) world.intersectionsWithPoint({ x: x + ox, y: y + 0.7, z: z + oz }, c => { if (c === me) return true; const b = c.parent(); if (b && !b.isFixed()) return true; hit = true; return false; }); return hit; };
    // the floor has to be there too
    const floorAt = (x, z) => { const h = this.g.phys.ray({ x, y: y + 1.5, z }, { x: 0, y: -1, z: 0 }, 3, me); return h !== null && Math.abs(y + 1.5 - h - y) < 0.4; };
    const free = new Uint8Array(N);
    for (let i = 0; i < N; i++) free[i] = !blockedAt(cx(i), cz(i)) && floorAt(cx(i), cz(i)) ? 1 : 0;
    const idx = (x, z) => { const i = Math.floor((x - x0) / cell), j = Math.floor((z - z0) / cell); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i; };
    const start = idx(this.p.pos.x, this.p.pos.z), goalR = 1.0;
    const t0 = this.t;
    const seen = (i, k) => { const t = t0 + k * dt; for (const g of this.guards) { if (this.sees(g, this.pose(g, t), cx(i), cz(i)) || this.sees(g, this.pose(g, t + dt * 0.5), cx(i), cz(i))) return true; } return false; };
    let layer = new Int32Array(N).fill(-2); layer[start] = start;
    const parents = [layer];
    for (let k = 1; k <= steps; k++) {
      const prev = parents[k - 1], next = new Int32Array(N).fill(-2);
      let any = false;
      for (let i = 0; i < N; i++) {
        if (prev[i] === -2) continue;
        const ix = i % nx, iz = Math.floor(i / nx);
        for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= nx || jz >= nz) continue;
          const j = jz * nx + jx; if (next[j] !== -2 || !free[j] || seen(j, k)) continue;
          next[j] = i; any = true;
          if (Math.hypot(cx(j) - this.goal.x, cz(j) - this.goal.z) < goalR) {
            // walk the parents back to the start
            parents.push(next);
            const out = [j]; let cur = j;
            for (let q = k; q > 0; q--) { cur = parents[q][cur]; out.unshift(cur); }
            return { t0, dt, cells: out.map(c2 => new THREE.Vector3(cx(c2), y, cz(c2))) };
          }
        }
      }
      parents.push(next);
      if (!any) break;
    }
    return null;
  }
  solve() {
    const pp = this.p.pos;
    if (!this.route2 || this.route2.stale) { this.route2 = this.plan(); this.planned = (this.planned || 0) + 1; if (!this.route2) { this.unsolvable = true; this.g.input.forced = { mx: 0, my: 0 }; return; } }
    const r = this.route2, k = Math.floor((this.t - r.t0) / r.dt);
    const here = r.cells[Math.min(k, r.cells.length - 1)], next = r.cells[Math.min(k + 1, r.cells.length - 1)];
    if (Math.hypot(pp.x - here.x, pp.z - here.z) > 1.6 && k > 1) { r.stale = true; return; }
    const d = Math.hypot(next.x - pp.x, next.z - pp.z);
    if (d < 0.15) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    this.steer(next.x, next.z);
    // don't run ahead of the plan
    if (d < 0.5) this.g.input.forced = { mx: 0, my: 0.5 };
  }
}

// ------------------------------------------------------------ Boss: the Big Floater
// It stomps after Rory; its ground-pound sends out a ring (jump it!); after a
// pound it's stuck for a moment, and a ZAP on the glowing battery on its back hurts it.
class Boss extends Mission {
  start() {
    const d = this.data;
    this.c = v3(d.center || [0, 0, 0]); this.arenaR = d.radius || 16;
    this.hp = this.need = this.def.n || 3; this.hearts = 3;
    const b = this.b = new Robot("boss", d.height || 6); b.root.position.set(this.c.x, this.c.y, this.c.z - this.arenaR * 0.5); this.add(b.root);
    // the battery on its back
    this.bat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16), new THREE.MeshStandardMaterial({ color: 0xff5ad8, emissive: 0xff3ad8, emissiveIntensity: 2 }));
    this.add(this.bat);
    this.state = "walk"; this.st = 0; this.cool = 0; this.inv = 0; this.rings = [];
    this.speed = 2.2 + this.lv * 0.4;
    // Professor Zero rides the last one, in a glass bubble on its head
    if (d.rider) {
      const rig = this.rider = makePerson(CHARS[d.rider].look); this.add(rig.root);
      this.riderDome = this.add(new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1, depthWrite: false })));
    }
  }
  placeRider(dt) {
    if (!this.rider) return;
    const b = this.b, h = this.data.height || 6;
    this.rider.root.position.set(b.pos.x, b.pos.y + h * 0.92, b.pos.z); this.rider.root.rotation.y = b.root.rotation.y;
    animatePerson(this.rider, { dt, speed: 0, grounded: true, sit: true, talk: this.g.talking === "zero", wave: this.state === "stuck" });
    this.riderDome.position.set(b.pos.x, b.pos.y + h * 0.92 + 0.9, b.pos.z);
  }
  back() { const y = this.b.root.rotation.y; return new THREE.Vector3(this.b.pos.x - Math.sin(y) * 1.2, this.b.pos.y + (this.data.height || 6) * 0.55, this.b.pos.z - Math.cos(y) * 1.2); }
  update(dt) {
    const b = this.b, pp = this.p.pos;
    b.update(dt); this.st += dt; this.cool -= dt; this.inv -= dt;
    this.placeRider(dt);
    if (this.w.heightAt && this.state !== "gone") b.pos.y = this.w.heightAt(b.pos.x, b.pos.z);
    const dx = pp.x - b.pos.x, dz = pp.z - b.pos.z, d = Math.hypot(dx, dz);
    if (this.state === "walk") {
      b.play("Walking");
      let r = Math.atan2(dx, dz) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 2);
      if (d > 5) { b.pos.x += Math.sin(b.root.rotation.y) * this.speed * dt; b.pos.z += Math.cos(b.root.rotation.y) * this.speed * dt; }
      // it winds up after a short walk, or sooner if Rory is right under it (never straight after being zapped)
      if (this.st > 3.4 - this.lv * 0.3 || (d < 4 && this.st > 1.4)) { this.state = "pound"; this.st = 0; b.play("Jump"); }
    } else if (this.state === "pound") {
      if (this.st > 0.7 && !this.pounded) {
        this.pounded = true; this.g.sound("hit"); this.g.fx.puff(b.pos.x, b.pos.y + 0.2, b.pos.z, 0xd8c8b0, 30);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.18, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5ad8).multiplyScalar(3) }));
        ring.rotation.x = Math.PI / 2; ring.position.set(b.pos.x, b.pos.y + 0.3, b.pos.z); this.add(ring);
        // a ring can't catch Rory if he was already inside where it starts
        this.rings.push({ m: ring, r: 1, hit: Math.hypot(pp.x - b.pos.x, pp.z - b.pos.z) < 2 });
      }
      if (this.st > 1.1) { this.state = "stuck"; this.st = 0; this.pounded = false; b.play("Death"); }
    } else if (this.state === "stuck") {
      if (Math.random() < 0.3) this.g.fx.trail(this.back().x, this.back().y, this.back().z, 0xffd166, 0.3);
      if (this.st > 4 - this.lv * 0.3) { this.state = "walk"; this.st = 0; b.play("Standing"); }
    } else if (this.state === "hurt") {
      if (this.st > 1.2) { this.state = "walk"; this.st = 0; }
    }
    // shock rings roll outward; jumping clears them
    for (const r of this.rings) {
      r.r += dt * this.ringSpeed(); r.m.scale.setScalar(r.r); r.m.material.opacity = 1;
      const dist = Math.hypot(pp.x - r.m.position.x, pp.z - r.m.position.z);
      // it only catches feet on the ground: any jump at all clears it
      if (!r.hit && Math.abs(dist - r.r) < 0.5 && this.p.walker.grounded && this.inv <= 0) { r.hit = true; this.ouch(); }
      if (r.r > this.arenaR * 1.6) r.m.visible = false;
    }
    this.rings = this.rings.filter(r => r.m.visible);
    const bp = this.back(); this.bat.position.copy(bp); this.bat.rotation.y = b.root.rotation.y;
    this.bat.material.emissiveIntensity = this.state === "stuck" ? 3 + Math.sin(this.t * 20) * 1.5 : 1.2;
    // keep Rory in the arena
    if (Math.hypot(pp.x - this.c.x, pp.z - this.c.z) > this.arenaR + 4) { this.p.teleport(this.c.x, this.c.y, this.c.z + this.arenaR * 0.6); }
    if (this.g.input.takeAction() && this.cool <= 0) {
      this.cool = 0.5; this.g.sound("zap");
      const toBat = bp.clone().sub(pp); toBat.y = 0;
      const behind = new THREE.Vector3(Math.sin(b.root.rotation.y), 0, Math.cos(b.root.rotation.y)).dot(toBat.clone().normalize()) > 0.2;
      this.g.fx.burst(pp.x + Math.sin(this.p.yaw) * 1.2, pp.y + 1, pp.z + Math.cos(this.p.yaw) * 1.2, 0x9ad8ff, 12);
      if (this.state === "stuck" && toBat.length() < 4.5 && behind) {
        this.hp--; this.state = "hurt"; this.st = 0; b.play("No"); this.g.sound("pop");
        this.g.fx.burst(bp.x, bp.y, bp.z, 0xff5ad8, 50, { speed: 7 });
        if (this.hp <= 0) this.defeat();
      }
    }
  }
  ouch() {
    this.hearts--; this.inv = 2; this.g.sound("fail");
    const pp = this.p.pos, away = pp.clone().sub(this.b.pos).setY(0).normalize();
    this.p.walker.vel.set(away.x * 8, 7, away.z * 8); this.p.walker.grounded = false;
    this.g.fx.burst(pp.x, pp.y + 1, pp.z, 0xff3a3a, 20);
    if (this.hearts <= 0) this.lose("KNOCKED OUT");
  }
  defeat() {
    const b = this.b; this.state = "gone";
    const bub = this.add(makeBubble((this.data.height || 6) * 0.6)); bub.position.copy(b.pos).setY(b.pos.y + (this.data.height || 6) * 0.5);
    let t = 0; this.w.updaters.push(dt => { t += dt; if (t < 4) { b.pos.y += dt * (1 + t * 2); bub.position.y += dt * (1 + t * 2); b.root.rotation.y += dt; } });
    // Zero himself hops out and floats gently down, caught
    if (this.rider) { let u = 0; const r = this.rider; this.w.updaters.push(dt => { u += dt; if (u < 3) { r.root.position.y = Math.max(this.c.y, r.root.position.y - dt * 2); r.root.position.x += dt * 1.2; } this.riderDome.visible = false; animatePerson(r, { dt, speed: 0, grounded: true, talk: this.g.talking === "zero" }); }); }
    this.g.addCells(3);
    this.finishing = true; this.later(2.2, () => this.win());
  }
  ringSpeed() { return 5.5 + this.lv * 0.7; }
  stars() { return this.hearts >= 3 ? 3 : this.hearts === 2 ? 2 : 1; }
  hud() { return { ...super.hud(), text: `${"❤".repeat(Math.max(0, this.hearts))}${"♡".repeat(3 - Math.max(0, this.hearts))}  Boss: ${"■".repeat(Math.max(0, this.hp))}${"□".repeat(this.need - Math.max(0, this.hp))}`, progress: 1 - this.hp / this.need }; }
  actionLabel() { return "ZAP"; }
  target() { return this.state === "stuck" ? this.back() : null; }
  solve() {
    const b = this.b, pp = this.p.pos, inp = this.g.input;
    if (this.state === "gone") { inp.forced = { mx: 0, my: 0 }; return; }
    // jump any ring about to reach us (a fifth of a second before it arrives)
    for (const r of this.rings) {
      if (r.hit) continue;
      const gap = Math.hypot(pp.x - r.m.position.x, pp.z - r.m.position.z) - r.r;
      if (gap > -0.3 && gap < this.ringSpeed() * 0.2 + 0.5 && this.p.walker.grounded) { inp.jumpPressed = true; inp.jumpHeld = true; }
    }
    const jump = inp.jumpPressed;
    const d = Math.hypot(pp.x - b.pos.x, pp.z - b.pos.z);
    if (this.state === "stuck") {
      // round the side to the spot behind it, then zap
      const y = b.root.rotation.y, bx = b.pos.x - Math.sin(y) * 3, bz = b.pos.z - Math.cos(y) * 3;
      const side = Math.sign((pp.x - b.pos.x) * Math.cos(y) - (pp.z - b.pos.z) * Math.sin(y)) || 1;
      const inFront = Math.sin(y) * (pp.x - b.pos.x) + Math.cos(y) * (pp.z - b.pos.z) > 0;
      const tx = inFront ? b.pos.x + Math.cos(y) * 4 * side - Math.sin(y) * 1.5 : bx, tz = inFront ? b.pos.z - Math.sin(y) * 4 * side - Math.cos(y) * 1.5 : bz;
      if (this.steer(tx, tz) < 1.2 && !inFront) { inp.forced = { mx: 0, my: 0 }; this.p.yaw = Math.atan2(b.pos.x - pp.x, b.pos.z - pp.z); inp.actionPressed = true; }
    } else if (d < 8) {
      // back off to a safe distance, straight away from it
      const ax = pp.x - b.pos.x, az = pp.z - b.pos.z, n = Math.hypot(ax, az) || 1;
      let tx = pp.x + ax / n * 4, tz = pp.z + az / n * 4;
      // but not out of the arena: slide round the edge instead
      const ex = tx - this.c.x, ez = tz - this.c.z, e = Math.hypot(ex, ez), R = this.arenaR * 0.8;
      if (e > R) { const a = Math.atan2(ex, ez) + 0.9; tx = this.c.x + Math.sin(a) * R; tz = this.c.z + Math.cos(a) * R; }
      this.steer(tx, tz);
    } else inp.forced = { mx: 0, my: 0 };
    if (jump) { inp.jumpPressed = true; inp.jumpHeld = true; }
  }
}

// ------------------------------------------------------------ Drive and collect: a buggy, cells spread over rough ground
class Drive extends Mission {
  start() {
    const d = this.data;
    const [x, y, z, yaw] = d.start;
    this.car = new Car(this.w, x, y, z, yaw || 0, d.car || "buggy", d.carOpts || {});
    this.need = Math.min(this.def.n || d.cells.length, d.cells.length);
    this.cells = d.cells.slice(0, this.need).map(s => { const c = this.add(makeCell()); c.position.copy(v3(s)); c.scale.setScalar(1.6); return c; });
    this.got = 0;
    this.g.driveMode = this; this.p.walker.col.setEnabled(false); this.g.bolt.root.visible = false;
  }
  update(dt) {
    const inp = this.g.input;
    const throttle = inp.my < -0.3 ? -1 : (this.autoThrottle ?? (Math.abs(inp.my) > 0.1 || Math.abs(inp.mx) > 0.1 || this.t > 0.5 ? 1 : 0));
    this.car.drive(dt, throttle, inp.mx, inp.takeJump() || this.autoBoost);
    this.autoBoost = false;
    for (const c of this.cells) {
      if (!c.visible) continue;
      spinCell(c, this.t);
      // generous for small drivers: close enough across the ground, and a bounce over it still counts
      if (Math.hypot(c.position.x - this.car.pos.x, c.position.z - this.car.pos.z) < 3 && Math.abs(c.position.y - this.car.pos.y) < 3) { c.visible = false; this.got++; this.g.fx.burst(c.position.x, c.position.y, c.position.z, 0x7fe3ff, 30); this.g.sound("cell"); this.g.addCells(1); if (this.got >= this.need) this.win(); }
    }
  }
  post() { this.car.sync(); }
  ride(dt) { Chase.prototype.ride.call(this, dt); }
  camera(cam, dt) { Chase.prototype.camera.call(this, cam, dt); }
  cleanup() {
    const c = this.car.pos.clone(), yaw = this.car.yaw; this.car.remove();
    this.g.driveMode = null; this.p.walker.col.setEnabled(true);
    this.p.teleport(c.x + 2, c.y + 0.3, c.z, yaw); this.p.obj.quaternion.identity();
    this.g.bolt.root.visible = true; this.g.bolt.pos.set(c.x + 3, c.y, c.z);
    super.cleanup();
  }
  hud() { return { ...super.hud(), text: `Drive over the Gravity Cells  ${this.got}/${this.need}`, progress: this.got / this.need }; }
  target() { const c = this.cells.filter(c => c.visible).sort((a, b) => a.position.distanceTo(this.car.pos) - b.position.distanceTo(this.car.pos))[0]; return c ? c.position : null; }
  debugState() { return { path: this.path ? this.path.length : null, blocked: this.blocked ? this.blocked.size : 0, freeFrac: this.grid ? +(this.grid.free.reduce((a, b) => a + b, 0) / this.grid.free.length).toFixed(2) : null }; }
  // The autopilot's map: a 2 m grid over the drive, each square free or blocked (walls, rocks,
  // domes), with its ground height so slopes too steep to climb can be avoided.
  buildGrid() {
    const S = 2, pad = 16, pts = [this.car.pos, ...this.cells.map(c => c.position)];
    const x0 = Math.min(...pts.map(p => p.x)) - pad, x1 = Math.max(...pts.map(p => p.x)) + pad;
    const z0 = Math.min(...pts.map(p => p.z)) - pad, z1 = Math.max(...pts.map(p => p.z)) + pad;
    const nx = Math.ceil((x1 - x0) / S) + 1, nz = Math.ceil((z1 - z0) / S) + 1;
    const h = new Float32Array(nx * nz), free = new Uint8Array(nx * nz);
    const world = this.w.phys.world, ball = new R.Ball(1.3), rot = { x: 0, y: 0, z: 0, w: 1 };
    const ha = this.w.heightAt || (() => this.data.start[1] - 0.5), terrain = this.w.terrainCol;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = i + j * nx, x = x0 + i * S, z = z0 + j * S, y = h[k] = ha(x, z);
      let hit = false;
      world.intersectionsWithShape({ x, y: y + 1.5, z }, rot, ball, c => { if (c === terrain) return true; const b = c.parent(); if (b && !b.isFixed()) return true; hit = true; return false; });
      free[k] = hit ? 0 : 1;
    }
    this.grid = { S, x0, z0, nx, nz, h, free };
  }
  cellOf(x, z) { const G = this.grid, i = Math.round((x - G.x0) / G.S), j = Math.round((z - G.z0) / G.S); return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? -1 : i + j * G.nx; }
  // A* from the buggy to (tx, tz); returns waypoints [[x, z], ...] or null
  route(tx, tz) {
    if (!this.grid) this.buildGrid();
    const G = this.grid, { nx, nz, h, free, S } = G, s = this.cellOf(this.car.pos.x, this.car.pos.z), goal = this.cellOf(tx, tz);
    if (s < 0 || goal < 0) return null;
    const n = nx * nz, g = new Float32Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), shut = new Uint8Array(n);
    const gi = goal % nx, gj = (goal / nx) | 0, heur = k => Math.hypot((k % nx) - gi, ((k / nx) | 0) - gj) * S;
    const heap = [], push = (k, f) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top[1]; };
    g[s] = 0; push(s, heur(s));
    const ok = k => free[k] || k === s || k === goal;
    while (heap.length) {
      const k = pop(); if (shut[k]) continue; shut[k] = 1;
      if (k === goal) break;
      const i = k % nx, j = (k / nx) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const q = ii + jj * nx; if (shut[q] || !ok(q) || (this.blocked && this.blocked.has(q))) continue;
        // no cutting a blocked corner
        if (di && dj && (!ok(i + di + j * nx) || !ok(i + (j + dj) * nx))) continue;
        const d = (di && dj ? 1.414 : 1) * S, slope = Math.abs(h[q] - h[k]) / d;
        if (slope > 0.8) continue;
        const cost = g[k] + d * (1 + 2 * slope);
        if (cost < g[q]) { g[q] = cost; from[q] = k; push(q, cost + heur(q)); }
      }
    }
    if (from[goal] < 0 && goal !== s) return null;
    const path = []; for (let k = goal; k >= 0 && k !== s; k = from[k]) path.push([G.x0 + (k % nx) * S, G.z0 + ((k / nx) | 0) * S]);
    path.reverse(); path.push([tx, tz]);
    return path;
  }
  solve() {
    const cell = this.target(); if (!cell) return;
    const car = this.car, inp = this.g.input, f = car.forward();
    // follow a planned route to the cell, looking a few metres along it; replan now and then
    if (cell !== this.routeFor || this.t > (this.replanAt ?? 0)) { this.path = this.route(cell.x, cell.z); this.routeFor = cell; this.replanAt = this.t + 2.5; }
    let t = cell;
    if (this.path && this.path.length) {
      let best = 0, bd = Infinity;
      this.path.forEach(([x, z], i) => { const d = Math.hypot(x - car.pos.x, z - car.pos.z); if (d < bd) { bd = d; best = i; } });
      let k = best; while (k < this.path.length - 1 && Math.hypot(this.path[k][0] - car.pos.x, this.path[k][1] - car.pos.z) < 6) k++;
      t = new THREE.Vector3(this.path[k][0], 0, this.path[k][1]);
    }
    const to = t.clone().sub(car.pos).setY(0), d = to.length(); to.normalize();
    const ang = Math.atan2(f.x * to.z - f.z * to.x, f.x * to.x + f.z * to.z);
    // is the point inside the circle the buggy turns in at this speed? then no amount of steering reaches it
    const lx = Math.abs(Math.sin(ang)) * d, lz = Math.cos(ang) * d;
    const inside = sp => { const R = 2 / Math.tan(0.45 - Math.min(0.25, Math.abs(sp) * 0.013)); return (lx - R) ** 2 + lz ** 2 < R * R * 0.9; };
    if (Math.abs(car.speed) > 0.6) this.movedAt = this.t;
    // stuck against something: back off turning towards the route, mark the square ahead blocked and replan
    if (this.t - (this.movedAt ?? this.t) > 1.5) {
      const side = Math.sign(ang) || 1;
      this.revUntil = this.t + 1.4; this.revSteer = -side; this.movedAt = this.t + 1.4;
      const ahead = this.cellOf(car.pos.x + f.x * 2.5, car.pos.z + f.z * 2.5);
      if (ahead >= 0) (this.blocked || (this.blocked = new Set())).add(ahead);
      this.replanAt = this.t + 1.4;
    }
    // behind us and close, or too tight to turn into: reverse with the wheels the other way (a three-point turn)
    if (!this.revUntil && (inside(0) || (Math.abs(ang) > 1.9 && d < 12))) { this.revUntil = this.t + 2.5; this.revSteer = null; }
    if (this.revUntil && this.t < this.revUntil && (this.revSteer !== null || Math.abs(ang) > 0.6)) {
      inp.forced = { mx: this.revSteer ?? -Math.sign(ang), my: 0 }; this.autoThrottle = -1; return;
    }
    this.revUntil = 0;
    inp.forced = { mx: Math.max(-1, Math.min(1, ang * 2.2)), my: 0 };
    // ease off to tighten the turn when the route bends
    this.autoThrottle = inside(car.speed) ? (car.speed > 3 ? -1 : 0.5) : Math.abs(ang) > 0.8 && car.speed > 7 ? 0.2 : 1;
  }
}

export const KINDS = { cells: Cells, roundup: Roundup, stack: Stack, tractor: Tractor, drone: Drone, lasers: Lasers, chase: Chase, stealth: Stealth, boss: Boss, circuit: Circuit, codes: Codes, drive: Drive };
export function makeMission(g, def, data) { const K = KINDS[def.kind]; return K ? new K(g, def, data) : null; }
