// Act Two's new kinds of mission: valves on a pipe network, airlocks between the sea and the
// dry rooms, and currents to ride.
import * as THREE from "three";
import { Mission } from "./mission.js";
import { Panel } from "./missions2.js";
import { swimMixin } from "./missions3.js";
import { screen, toast } from "./ui.js";

const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);

// ------------------------------------------------------------ Valves: set every gauge in the green
// A pump pushes water through a row of valves into the pipes; each pipe feeds some of the gauges.
// Each valve wheel has four settings (shut, a quarter, half, open: tap to turn it one more notch),
// and a gauge reads the sum of what its pipes bring. Every gauge's needle must sit on its green band.
const VCOL = ["#ff6a3a", "#3ad0ff", "#ffd23f", "#7bed9f", "#ff6ad5"];
export class Valves extends Panel {
  start() {
    const n = this.n = this.data.valves || [3, 3, 4, 5][this.lv - 1] || 4, m = this.m = this.data.gauges || [2, 3, 4, 4][this.lv - 1] || 3;
    // which valves feed which gauges: every valve at least one gauge, every gauge at least one valve,
    // and no two gauges fed the same way (or one could never differ from the other)
    let A;
    for (let tries = 0; tries < 200; tries++) {
      A = Array.from({ length: m }, () => Array.from({ length: n }, () => (Math.random() < 0.45 ? 1 : 0)));
      for (let i = 0; i < n; i++) if (!A.some(r => r[i])) A[Math.floor(Math.random() * m)][i] = 1;
      for (const r of A) if (!r.some(x => x)) r[Math.floor(Math.random() * n)] = 1;
      if (new Set(A.map(r => r.join(""))).size === m) break;
    }
    this.A = A;
    // the answer, and the green band each gauge must reach (never the setting it starts at)
    do { this.goal = Array.from({ length: n }, () => Math.floor(Math.random() * 4)); this.v = Array.from({ length: n }, () => Math.floor(Math.random() * 4)); }
    while (this.read(this.v).every((x, j) => x === this.read(this.goal)[j]));
    this.want = this.read(this.goal); this.max = A.map(r => r.reduce((s, x) => s + x * 3, 0));
    this.shown = this.read(this.v).slice(); this.turns = 0; this.still = 0;
    this.text = this.data.text || "Tap a valve to turn it. Get every needle into the green!";
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "PRESSURE VALVES"}</div><canvas width="800" height="480" style="width:min(92vw,110vh);height:auto;display:block;margin:8px auto;touch-action:none"></canvas><div class="msg" style="font-weight:800;font-size:16px;text-align:center">${this.text}</div></div>`, "screen dim");
    this.cv = el.querySelector("canvas"); this.gx = this.cv.getContext("2d"); this.msg = el.querySelector(".msg");
    this.cv.addEventListener("pointerdown", e => { e.stopPropagation(); const r = this.cv.getBoundingClientRect(); this.tap((e.clientX - r.left) / r.width * 800, (e.clientY - r.top) / r.height * 480); });
    this.vx = i => 150 + (i + 0.5) * (620 / n); this.gxAt = j => 60 + (j + 0.5) * (700 / m);
    this.draw();
  }
  read(v) { return this.A.map(r => r.reduce((s, x, i) => s + x * v[i], 0)); }
  ok(j) { return Math.abs(this.read(this.v)[j] - this.want[j]) < 0.5; }
  tap(x, y) {
    if (this.done) return;
    for (let i = 0; i < this.n; i++) if (Math.hypot(x - this.vx(i), y - 110) < 46) { this.turn(i); return; }
  }
  turn(i) { this.v[i] = (this.v[i] + 1) % 4; this.turns++; this.g.sound(this.v[i] ? "click" : "whoosh"); }
  update(dt) {
    const now = this.read(this.v);
    let moving = 0;
    for (let j = 0; j < this.m; j++) { const d = now[j] - this.shown[j]; this.shown[j] += d * Math.min(1, dt * 5); moving += Math.abs(d); }
    const all = now.every((x, j) => x === this.want[j]);
    this.still = all && moving < 0.05 ? this.still + dt : 0;
    if (all && this.still > 0.3) { this.msg.textContent = "Every gauge in the green!"; this.g.sound("win"); this.win(); }
    this.draw();
  }
  draw() {
    const g = this.gx, n = this.n, m = this.m, t = this.t;
    g.clearRect(0, 0, 800, 480);
    g.fillStyle = "#081226"; g.beginPath(); g.roundRect(0, 0, 800, 480, 18); g.fill();
    // the pump and the main pipe along the top
    g.fillStyle = "#3a4a6a"; g.beginPath(); g.roundRect(20, 70, 90, 80, 14); g.fill();
    g.fillStyle = "#dfe8ff"; g.font = "900 15px system-ui"; g.textAlign = "center"; g.fillText("PUMP", 65, 116);
    g.save(); g.translate(65, 92); g.rotate(t * 4); g.strokeStyle = "#7ff4e8"; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(12, 0); g.stroke(); } g.restore();
    g.strokeStyle = "#5a6a8a"; g.lineWidth = 12; g.beginPath(); g.moveTo(110, 60); g.lineTo(this.vx(n - 1), 60); g.stroke();
    // a pipe down from every valve to every gauge it feeds, in the valve's colour; flow shows as moving dashes
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      if (!this.A[j][i]) continue;
      const x0 = this.vx(i), x1 = this.gxAt(j) + (i - (n - 1) / 2) * 10;
      g.strokeStyle = VCOL[i % 5]; g.globalAlpha = 0.35 + this.v[i] * 0.2; g.lineWidth = 3 + this.v[i] * 1.5;
      g.beginPath(); g.moveTo(x0, 150); g.bezierCurveTo(x0, 230, x1, 220, x1, 300); g.stroke();
      if (this.v[i]) { g.setLineDash([8, 14]); g.lineDashOffset = -t * 40 * this.v[i]; g.strokeStyle = "#ffffff"; g.globalAlpha = 0.5; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, 150); g.bezierCurveTo(x0, 230, x1, 220, x1, 300); g.stroke(); g.setLineDash([]); }
      g.globalAlpha = 1;
    }
    // the valve wheels: a rim, spokes turned to the setting, and four notches
    for (let i = 0; i < n; i++) {
      const x = this.vx(i), y = 110;
      g.strokeStyle = "#5a6a8a"; g.lineWidth = 10; g.beginPath(); g.moveTo(x, 60); g.lineTo(x, 150); g.stroke();
      g.fillStyle = "#101c34"; g.beginPath(); g.arc(x, y, 40, 0, 7); g.fill();
      g.strokeStyle = VCOL[i % 5]; g.lineWidth = 7; g.beginPath(); g.arc(x, y, 34, 0, 7); g.stroke();
      g.save(); g.translate(x, y); g.rotate(this.v[i] * Math.PI / 2 + Math.PI / 4); g.lineWidth = 5; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(32, 0); g.stroke(); } g.restore();
      for (let k = 0; k < 4; k++) { g.fillStyle = k < this.v[i] ? "#7ff4e8" : "#2a3a5a"; g.beginPath(); g.arc(x - 18 + k * 12, y + 56, 4.5, 0, 7); g.fill(); }
      g.fillStyle = "#dfe8ff"; g.font = "900 13px system-ui"; g.textAlign = "center"; g.fillText(["SHUT", "¼", "½", "OPEN"][this.v[i]], x, y + 4);
    }
    // the gauges: a dial with its green band and a needle
    for (let j = 0; j < m; j++) {
      const x = this.gxAt(j), y = 380, R = Math.min(62, 330 / m), mx = Math.max(1, this.max[j]);
      const ang = v => Math.PI * (1 + v / mx);
      g.fillStyle = "#e8ecf4"; g.beginPath(); g.arc(x, y, R, Math.PI, 0); g.lineTo(x + R, y + 14); g.lineTo(x - R, y + 14); g.fill();
      g.strokeStyle = "#3a4a6a"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, R, Math.PI, 0); g.stroke();
      g.strokeStyle = "#2ac870"; g.lineWidth = 12; g.beginPath(); g.arc(x, y, R - 12, ang(this.want[j] - 0.5), ang(this.want[j] + 0.5)); g.stroke();
      const a = ang(Math.max(0, Math.min(mx, this.shown[j])) + Math.sin(t * 20 + j) * 0.03);
      g.strokeStyle = this.ok(j) ? "#1a8a4a" : "#d83a2a"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (R - 8), y + Math.sin(a) * (R - 8)); g.stroke();
      g.fillStyle = "#2a3a5a"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
      g.fillStyle = this.ok(j) ? "#7bed9f" : "#ffd166"; g.font = "900 20px system-ui"; g.textAlign = "center"; g.fillText(this.ok(j) ? "✓" : "✗", x, y + 40);
    }
  }
  stars() { const f = this.left / (this.time || 1); return this.turns <= this.n * 4 && f > 0.4 ? 3 : f > 0.2 ? 2 : 1; }
  // autopilot: find the closest settings (fewest notches round) that read right, then turn one valve
  // a notch at a time towards them
  solve() {
    if (this.done) return;
    if ((this.cool = (this.cool || 0) + 1) % 6) return;
    if (!this.plan) {
      let best = null, bc = Infinity;
      for (let k = 0; k < 4 ** this.n; k++) {
        const v = Array.from({ length: this.n }, (_, i) => Math.floor(k / 4 ** i) % 4);
        if (!this.read(v).every((x, j) => x === this.want[j])) continue;
        const c = v.reduce((s, x, i) => s + (x - this.v[i] + 4) % 4, 0);
        if (c < bc) { bc = c; best = v; }
      }
      this.plan = best;
    }
    const i = this.plan.findIndex((x, i) => x !== this.v[i]);
    if (i >= 0) this.turn(i);
  }
}

// ------------------------------------------------------------ Airlock: from the sea into the dry, the safe way
// data.steps: [[airlock, "in" | "out"], ...] (see deepkit.js); data.goal: where to end up. At each
// airlock: in through the open door, shut it behind you, pump (out, or in to go back to the sea),
// then open the far door. The levers refuse anything unsafe, and every refusal costs a star.
const SAY = {
  flood: "Not yet! Opening the sea door with the air still in would flood it all at once. Let the water in first.",
  doors: "Shut both doors before you pump!",
  full: "Not while it's full of water! Pump it out first, or you'll flood the station.",
};
const DONE = { outer: ["The sea door is open.", "The sea door is shut."], pump: ["The water's gone! The pump's done.", "The water's in."], inner: ["The inner door is open.", "The inner door is shut."] };
// (the same in space, with air where the water was)
const SAY_SPACE = {
  flood: "Not yet! Open the space door with the air still in and it all rushes out. Pump the air out first.",
  doors: "Shut both doors before you pump!",
  full: "Not yet! There's no air in there. Pump the air in first.",
};
const DONE_SPACE = { outer: ["The space door is open.", "The space door is shut."], pump: ["Air's in! The pump's done.", "The air's pumped out."], inner: ["The inner door is open.", "The inner door is shut."] };
export class Airlock extends Mission {
  start() {
    this.steps = (this.data.steps || []).map(([a, dir]) => ({ a, dir }));
    // each airlock waits for Rory on the side he comes from
    for (const { a, dir } of this.steps) {
      a.auto = false;
      const st = dir === "in" ? { outer: 1, inner: 0, water: 1 } : { outer: 0, inner: 1, water: 0 };
      Object.assign(a.S, st); Object.assign(a.V, st); a.busy = 0;
    }
    this.k = 0; this.mistakes = 0; this.goal = v3(this.data.goal);
    this.navPts = [this.goal.toArray(), ...this.steps.flatMap(({ a }) => [[a.sea[0], a.y + 1, a.sea[1]], [a.dry[0], a.y + 0.5, a.dry[1]]])];
  }
  get cur() { return this.steps[this.k]; }
  want(s) { return s.dir === "in" ? { outer: 0, inner: 1, water: 0 } : { outer: 1, inner: 0, water: 1 }; }
  nearLever() {
    const s = this.cur; if (!s) return null;
    const pp = this.p.pos;
    let best = null, bd = 1.5;
    for (const [k, l] of Object.entries(s.a.levers)) { const d = Math.hypot(l.x - pp.x, l.z - pp.z); if (d < bd && Math.abs(l.y - (pp.y + 1)) < 1.6) { bd = d; best = k; } }
    return best;
  }
  update() {
    const s = this.cur, pp = this.p.pos;
    if (this.g.input.takeAction()) {
      const k = this.nearLever();
      if (k) {
        const r = s.a.pull(k);
        if (r === "ok") { this.g.sound(k === "pump" ? "whoosh" : "click"); toast((s.a.space ? DONE_SPACE : DONE)[k][k === "pump" ? s.a.S.water : s.a.S[k] ? 0 : 1], 2); }
        else if (r !== "wait") { this.mistakes++; this.g.sound("fail"); toast((s.a.space ? SAY_SPACE : SAY)[r], 3.2); }
      }
    }
    // through this airlock: its far door open and Rory out past it
    if (s) {
      const g = this.want(s), there = s.a.S.outer === g.outer && s.a.S.inner === g.inner && s.a.S.water === g.water;
      const far = s.dir === "in" ? s.a.dry : s.a.sea;
      if (there && Math.hypot(pp.x - far[0], pp.z - far[1]) < 1.4) { this.k++; this.entered = false; this.g.sound("cell"); if (this.k < this.steps.length) toast("Through! On to the next one.", 2); }
    } else if (pp.distanceTo(this.goal) < 1.8) this.win();
  }
  hint() {
    const s = this.cur; if (!s) return "Through! Now to the marker.";
    const a = s.a, pp = this.p.pos;
    if (!a.inside(pp) && !(a.S.outer === this.want(s).outer && a.S.inner === this.want(s).inner && a.S.water === this.want(s).water)) return s.dir === "in" ? (a.space ? "Go into the airlock" : "Swim into the airlock") : "Walk into the airlock";
    const k = a.next(this.want(s));
    return k ? (a.space ? { outer: "Pull the RED lever: the space door", pump: "Pull the BLUE lever: the air pump", inner: "Pull the GREEN lever: the inner door" } : { outer: "Pull the RED lever: the sea door", pump: "Pull the BLUE lever: the pump", inner: "Pull the GREEN lever: the inner door" })[k] : "The way's open. Go through!";
  }
  hud() { return { ...super.hud(), text: this.hint() }; }
  actionLabel() { return this.nearLever() ? "PULL" : null; }
  target() {
    const s = this.cur; if (!s) return this.goal;
    const a = s.a, k = a.inside(this.p.pos) ? a.next(this.want(s)) : null;
    if (k) { const l = a.levers[k]; return new THREE.Vector3(l.x, l.y, l.z); }
    const g = this.want(s), there = a.S.outer === g.outer && a.S.inner === g.inner && a.S.water === g.water;
    const e = there ? (s.dir === "in" ? a.dry : a.sea) : (s.dir === "in" ? a.sea : a.dry);
    return new THREE.Vector3(e[0], a.y + 0.5, e[1]);
  }
  stars() { return this.mistakes === 0 ? super.stars() : this.mistakes < 2 ? Math.min(2, super.stars()) : 1; }
  debugState() { const s = this.cur, f = v => +v.toFixed(1); return { k: this.k, p: this.p.pos.toArray().map(f), sw: this.p.swimming, st: s ? { ...s.a.S } : null, busy: s ? f(s.a.busy) : 0, inside: s ? s.a.inside(this.p.pos) : null, mis: this.mistakes }; }
  // autopilot: to the door it comes in by, into the middle, each lever in turn (standing by it),
  // and out through the far door; then on to the next airlock, or the goal
  solve() {
    const s = this.cur, inp = this.g.input, pp = this.p.pos;
    if (!s) { this.go(this.goal.x, this.goal.y, this.goal.z); return; }
    const a = s.a, g = this.want(s), there = a.S.outer === g.outer && a.S.inner === g.inner && a.S.water === g.water;
    const near = s.dir === "in" ? a.sea : a.dry, far = s.dir === "in" ? a.dry : a.sea;
    const inside = a.inside(pp);
    if (there) { this.straight(far[0], a.y + 0.8, far[1]); return; }
    if (!inside) {
      const dn = Math.hypot(pp.x - near[0], pp.z - near[1]);
      if (dn > 1.2 && !this.entered) { this.go(near[0], a.y + 0.8, near[1]); return; }
      // (outside the door but below it, come up level with it first: straight in from underneath
      // is into the airlock's floor)
      if (!this.entered && this.p.swimming && Math.abs(pp.y + 0.7 - (a.y + 0.8)) > 0.6) { this.follow3([near[0], a.y + 0.8, near[1]], 0.5); return; }
      this.entered = true; this.straight(a.x, a.y + 0.8, a.z); return;
    }
    const k = a.next(g);
    if (!k || a.busy > 0) { this.straight(a.x, a.y + 0.8, a.z); return; }
    const l = a.levers[k], d = this.straight(l.stand[0], a.y + 0.8, l.stand[2]);
    if (d < 0.5 && this.nearLever() === k) { inp.forced = { mx: 0, my: 0 }; inp.actionPressed = true; }
  }
  // along a route (swimming or walking)
  go(x, y, z) { return this.p.swimming || this.p.headUnder ? this.swimTo(x, y, z) : this.walkTo(x, y, z, 1.0, this.navPts.map(v3)); }
  // straight there, inside the airlock (swimming: up and down too)
  straight(x, y, z) {
    if (this.p.swimming) return this.follow3([x, y, z], 0.5);
    return this.steer(x, z);
  }
}
Object.assign(Airlock.prototype, swimMixin);

// ------------------------------------------------------------ Current: ride the currents through the rings
// data.rings: [[x, y, z, r], ...] in order, mostly inside the level's currents (world.current). Too
// far to swim in the time: let the current do the work.
export class Current extends Mission {
  start() {
    this.rings = (this.data.rings || []).map(([x, y, z, r = 2.2], i) => {
      const m = this.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.14, 12, 48), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 1.5, roughness: 0.3 })));
      m.position.set(x, y, z);
      const c = this.w.currentAt(x, y, z), nx = this.data.rings[i + 1];
      const dir = c ? new THREE.Vector3(c.x, c.y, c.z) : nx ? new THREE.Vector3(nx[0] - x, nx[1] - y, nx[2] - z) : new THREE.Vector3(0, 0, 1);
      m.lookAt(m.position.clone().add(dir));
      return { m, r, got: false };
    });
    this.got = 0; this.navPts = [...this.rings.map(r => r.m.position.toArray()), ...(this.w.currents || []).map(c => c.pts[0].toArray())];
    // (the way to a current's start keeps out of its tube: nobody can swim up a current)
    this.navBlock = (x, y, z) => { const a = this.along(x, y, z, 0.8); return !!a && a.s > 5; };
  }
  update() {
    const pp = this.p.pos, c = new THREE.Vector3(pp.x, pp.y + 0.7, pp.z);
    const r = this.rings[this.got];
    for (const q of this.rings) q.m.material.emissiveIntensity = q === r ? 1.5 + Math.sin(this.t * 6) * 0.5 : q.got ? 0.2 : 0.6;
    if (r && c.distanceTo(r.m.position) < r.r * 0.95) {
      r.got = true; r.m.visible = false; this.got++; this.g.sound("cell"); this.g.fx.ring(r.m.position.x, r.m.position.y, r.m.position.z, 0xffd166, r.r);
      if (this.got >= this.rings.length) this.win();
    }
  }
  hud() { return { ...super.hud(), text: `Ride the current through the rings  ${this.got}/${this.rings.length}`, progress: this.got / this.rings.length }; }
  target() { const r = this.rings[this.got]; return r ? r.m.position : null; }
  // which current (if any) runs through a point, and how far along it that is
  along(x, y, z, pad = 0) {
    for (const c of this.w.currents || []) for (const q of c.seg) {
      const t = Math.max(0, Math.min(q.l, (x - q.a.x) * q.d.x + (y - q.a.y) * q.d.y + (z - q.a.z) * q.d.z));
      if (Math.hypot(q.a.x + q.d.x * t - x, q.a.y + q.d.y * t - y, q.a.z + q.d.z * t - z) < c.r + pad) return { c, s: q.s + t };
    }
    return null;
  }
  debugState() { const f = v => +v.toFixed(1), pp = this.p.pos, a = this.along(pp.x, pp.y + 0.7, pp.z); return { got: this.got, p: pp.toArray().map(f), sw: this.p.swimming, air: f(this.p.air), gasp: !!this.gasping, cur: a ? f(a.s) : null }; }
  // autopilot: a ring in a current is reached by swimming (round the outside of the tube) to the
  // current's start, then steering for the ring while the current carries you; missed it, round
  // again. Anything else, swim there.
  solve() {
    const r = this.rings[this.got]; if (!r) return;
    const q = r.m.position, pp = this.p.pos, ring = this.along(q.x, q.y, q.z), me = this.along(pp.x, pp.y + 0.7, pp.z);
    if (ring && !this.gasping) {
      if (me && me.c === ring.c && me.s < ring.s + 1) { this.follow3([q.x, q.y, q.z], 0.5); return; }
      const e = ring.c.pts[0];
      this.swimTo(e.x, e.y, e.z); return;
    }
    this.swimTo(q.x, q.y, q.z);
  }
}
Object.assign(Current.prototype, swimMixin);
