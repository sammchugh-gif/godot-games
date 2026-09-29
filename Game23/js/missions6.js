// Timeslip's new missions: a dig (brush the sand off, chip the rock away, and don't crack what's
// underneath) and a timeline (tap the pictures in the order they happened), which open on a
// screen in front of Rory; and the echo (two of you at once) and the ride, out in the era.
import * as THREE from "three";
import { screen, onTap } from "./ui.js";
import { Panel } from "./missions2.js";
import { Mission } from "./mission.js";
import { makePerson, animatePerson, RORY } from "./people.js";
import { Robot } from "./robots.js";

// ------------------------------------------------------------ Dig: uncover the find without cracking it
// Every square is sand (the brush clears it), rock (the chisel breaks it; the brush just scratches),
// or bare. Under some squares lies the find. The chisel on a square where the find is already
// showing cracks it: three cracks and it's broken. Pebble's nose (SNIFF) shows where one piece is.
// data: title, find (an emoji and a name: what's buried), shape (list of [x, y] squares it covers)
const FINDS = [
  { emoji: "🔶", name: "the golden capstone", shape: [[2, 1], [1, 2], [2, 2], [3, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3]] },
  { emoji: "🦴", name: "a fossil", shape: [[1, 1], [2, 1], [3, 1], [4, 1], [2, 2], [3, 2], [1, 3], [4, 3]] },
  { emoji: "🗝️", name: "a bronze key", shape: [[1, 2], [2, 2], [3, 2], [4, 2], [4, 1], [4, 3], [1, 1]] },
];
export class Dig extends Panel {
  start() {
    const N = this.N = [6, 6, 7, 7][this.lv - 1] || 6;
    const f = this.data.find || FINDS[0], shape = this.data.shape || f.shape;
    this.find = f;
    // where the find lies (shifted to sit somewhere inside the grid)
    const w = Math.max(...shape.map(s => s[0])) + 1, h = Math.max(...shape.map(s => s[1])) + 1;
    const ox = Math.floor(Math.random() * (N - w + 1)), oy = Math.floor(Math.random() * (N - h + 1));
    this.under = new Array(N * N).fill(false);
    for (const [x, y] of shape) this.under[(y + oy) * N + x + ox] = true;
    // the layers over each square: 1 is sand, 2 is rock with sand on it, 3 is rock (harder levels have more rock)
    const rockish = [0.25, 0.35, 0.45, 0.5][this.lv - 1] || 0.35;
    this.layer = this.under.map((u, k) => (Math.random() < rockish ? (Math.random() < 0.5 ? 2 : 3) : 1));
    this.cracks = 0; this.taps = 0; this.tool = "brush"; this.sniffs = 0;
    this.text = "BRUSH the sand. CHISEL the rock. Don't crack the find!";
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px;text-align:center"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "THE DIG"}</div>
      <canvas width="600" height="600" style="width:min(58vh,80vw);height:min(58vh,80vw);display:block;margin:8px auto;touch-action:none"></canvas>
      <div class="row" style="gap:10px;justify-content:center"><button class="btn gold small" data-t="brush">🖌️ BRUSH</button><button class="btn ghost small" data-t="chisel">⛏️ CHISEL</button><button class="btn ghost small" data-t="sniff">👃 PEBBLE, SNIFF</button></div>
      <div class="msg" style="font-weight:900;font-size:16px;margin-top:6px"></div></div>`, "screen dim");
    this.el = el; this.msg = el.querySelector(".msg");
    this.cv = el.querySelector("canvas"); this.gx = this.cv.getContext("2d");
    this.cv.addEventListener("pointerdown", e => { e.stopPropagation(); const r = this.cv.getBoundingClientRect(); this.tap(Math.floor((e.clientX - r.left) / r.width * this.N), Math.floor((e.clientY - r.top) / r.height * this.N)); });
    onTap(el, "[data-t]", b => { const t = b.dataset.t; if (t === "sniff") { this.sniff(); return; } this.setTool(t); });
    this.say(this.text); this.draw();
  }
  say(t) { this.msg.textContent = t; }
  setTool(t) { this.tool = t; for (const b of this.el.querySelectorAll("[data-t]")) b.className = "btn small " + (b.dataset.t === t ? "gold" : "ghost"); this.g.sound("click"); }
  // Pebble's nose: a covered square with the find under it glows for a moment
  sniff() {
    if (this.done) return;
    const hid = this.under.map((u, k) => u && this.layer[k] > 0 ? k : -1).filter(k => k >= 0);
    if (!hid.length) return;
    this.sniffs++; this.glow = { k: hid[Math.floor(Math.random() * hid.length)], t: 1.6 };
    if (this.g.pebble) { this.g.pebble.play("Sniff"); setTimeout(() => this.g.pebble && this.g.pebble.play("Idle"), 1600); }
    this.g.sound("beep"); this.say("Sniff sniff! Pebble smells something there.");
  }
  tap(x, y) {
    if (this.done || x < 0 || y < 0 || x >= this.N || y >= this.N) return;
    const k = y * this.N + x, L = this.layer[k];
    this.taps++;
    if (this.tool === "brush") {
      if (L === 1) { this.layer[k] = 0; this.g.sound("swish"); }
      else if (L === 2) { this.layer[k] = 3; this.g.sound("swish"); }
      else if (L === 3) { this.say("Too hard for the brush. Try the chisel!"); this.g.sound("click"); }
    } else {
      if (L === 3 || L === 2) { this.layer[k] = L === 2 ? 1 : 0; this.g.sound("land"); }
      else if (L === 1) { this.layer[k] = 0; this.g.sound("land"); }
      else if (this.under[k]) { this.cracks++; this.crackAt = (this.crackAt || []).concat(k); this.g.sound("fail"); this.say(this.cracks >= 3 ? "Oh no, it's broken!" : "Careful! That cracked it. Use the brush near the find."); if (this.cracks >= 3) { this.failed = true; this.close(); this.g.onMissionLose(this, "IT BROKE"); return; } }
    }
    this.draw();
    if (this.under.every((u, i) => !u || this.layer[i] === 0)) { this.say(`You found ${this.find.name}!`); this.g.sound("win"); this.win(); }
  }
  update(dt) { if (this.glow) { this.glow.t -= dt; if (this.glow.t <= 0) this.glow = null; this.draw(); } }
  draw() {
    const g = this.gx, N = this.N, c = 600 / N;
    g.clearRect(0, 0, 600, 600);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = y * N + x, L = this.layer[k], px = x * c, py = y * c;
      // what's at the bottom: the find, or plain earth
      g.fillStyle = this.under[k] ? "#e8b84a" : "#8a6a44"; g.fillRect(px, py, c, c);
      if (this.under[k] && L === 0) { g.font = `${Math.round(c * 0.6)}px system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(this.find.emoji, px + c / 2, py + c / 2 + 2); if ((this.crackAt || []).includes(k)) { g.strokeStyle = "#2a1a0a"; g.lineWidth = 4; g.beginPath(); g.moveTo(px + c * 0.2, py + c * 0.3); g.lineTo(px + c * 0.5, py + c * 0.55); g.lineTo(px + c * 0.4, py + c * 0.8); g.stroke(); } }
      // the layers on top
      if (L === 3 || L === 2) { g.fillStyle = "#7a7470"; g.fillRect(px + 1, py + 1, c - 2, c - 2); g.fillStyle = "#948e88"; g.fillRect(px + c * 0.15, py + c * 0.2, c * 0.35, c * 0.25); g.fillRect(px + c * 0.55, py + c * 0.55, c * 0.3, c * 0.25); }
      if (L === 2 || L === 1) { g.fillStyle = L === 2 ? "rgba(228,200,140,.75)" : "#e4c88c"; g.fillRect(px + 1, py + 1, c - 2, c - 2); g.fillStyle = "rgba(255,240,200,.35)"; g.beginPath(); g.arc(px + c * 0.3, py + c * 0.35, c * 0.08, 0, 7); g.arc(px + c * 0.7, py + c * 0.6, c * 0.06, 0, 7); g.fill(); }
      if (this.glow && this.glow.k === k) { g.fillStyle = `rgba(255,120,200,${0.3 + 0.3 * Math.sin(this.t * 12)})`; g.fillRect(px, py, c, c); }
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; g.strokeRect(px, py, c, c);
    }
  }
  stars() { return this.cracks === 0 && this.sniffs <= 1 ? 3 : this.cracks <= 1 ? 2 : 1; }
  // autopilot, as a careful child: brush the sand; chisel rock only where the find isn't showing
  solve() {
    if (this.done) return;
    this.st = (this.st || 0) + 1; if (this.st % 5) return;
    // (look for the find first: dig where it's covered)
    const order = this.under.map((u, k) => [u ? 0 : 1, k]).sort((a, b) => a[0] - b[0]).map(q => q[1]);
    for (const k of order) {
      const L = this.layer[k]; if (L === 0) continue;
      if (!this.under[k] && L === 0) continue;
      const want = L === 1 ? "brush" : "chisel";
      if (this.tool !== want) this.setTool(want);
      this.tap(k % this.N, Math.floor(k / this.N)); return;
    }
  }
}

// ------------------------------------------------------------ Timeline: tap the pictures in the order they happened
// data: title, events [[emoji, caption], ...] in the right order. They're dealt out shuffled; tap
// the first one to happen, then the next. A wrong tap shakes the card and counts as a slip.
export class Timeline extends Panel {
  start() {
    const ev = this.data.events || [["🥚", "An egg"], ["🐣", "It hatches"], ["🦕", "A baby dinosaur"], ["🦖", "All grown up"]];
    this.ev = ev.slice(0, [4, 5, 6, 6][this.lv - 1] || ev.length);
    this.order = this.ev.map((_, i) => i);
    for (let i = this.order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.order[i], this.order[j]] = [this.order[j], this.order[i]]; }
    if (this.order.every((v, i) => v === i)) this.order.reverse();
    this.next = 0; this.slips = 0;
    this.text = "Tap the pictures in the order they happened.";
    const el = screen("puzzle", `<div class="card" style="padding:14px 16px;text-align:center;max-width:min(96vw,900px)"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "IN THE RIGHT ORDER"}</div>
      <div class="slots" style="display:flex;gap:8px;justify-content:center;margin:10px 0 4px;flex-wrap:wrap">${this.ev.map((_, i) => `<div data-s="${i}" style="width:min(13vw,110px);height:min(13vw,110px);border-radius:14px;border:3px dashed rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-weight:900;color:rgba(255,255,255,.4);font-size:22px">${i + 1}</div>`).join("")}</div>
      <div class="cards" style="display:flex;gap:10px;justify-content:center;margin:12px 0;flex-wrap:wrap">${this.order.map(i => `<button data-c="${i}" style="width:min(14vw,120px);border-radius:16px;border:0;background:#1a2a4a;color:#fff;padding:8px 4px;box-shadow:0 4px 0 #0a1428;transition:transform .1s"><div style="font-size:min(7vw,52px)">${this.ev[i][0]}</div><div style="font-weight:800;font-size:13px;line-height:1.15">${this.ev[i][1]}</div></button>`).join("")}</div>
      <div class="msg" style="font-weight:900;font-size:16px"></div></div>`, "screen dim");
    this.el = el; this.msg = el.querySelector(".msg");
    onTap(el, "[data-c]", b => this.pick(+b.dataset.c, b));
    this.say(this.text);
  }
  say(t) { this.msg.textContent = t; }
  pick(i, b) {
    if (this.done) return;
    b = b || this.el.querySelector(`[data-c="${i}"]`);
    if (!b || b.disabled) return;
    if (i !== this.next) {
      this.slips++; this.g.sound("fail"); this.say("Not yet! What happened before that?");
      b.style.transform = "translateX(-6px)"; setTimeout(() => { b.style.transform = "translateX(6px)"; }, 80); setTimeout(() => { b.style.transform = "none"; }, 160);
      return;
    }
    this.g.sound("click");
    b.disabled = true; b.style.visibility = "hidden";
    const s = this.el.querySelector(`[data-s="${i}"]`);
    s.style.border = "3px solid #ffd166"; s.style.background = "#1a2a4a"; s.innerHTML = `<div style="font-size:min(7vw,48px)">${this.ev[i][0]}</div>`;
    this.next++;
    if (this.next >= this.ev.length) { this.say("That's the right order!"); this.g.sound("win"); this.win(); }
    else this.say(`${this.next} of ${this.ev.length}. What came next?`);
  }
  stars() { return this.slips === 0 ? 3 : this.slips <= 2 ? 2 : 1; }
  solve() { if (this.done) return; this.st = (this.st || 0) + 1; if (this.st % 8 === 0) this.pick(this.next); }
}

// ------------------------------------------------------------ Echo: two of you at once
// Press ECHO and walk somewhere; press it again (STOP) and Rory jumps back to where he started,
// while a see-through blue Rory walks the same way and stays where it ends up. Plates are held down
// by either of them; a door opens while its plates are held (a latching one stays open).
// data: plates [[x, y, z]], doors [{ at: [x, y, z], size: [w, h, d], ry, need: [plate numbers],
// latch }], goal [x, y, z], plan (for the autopilot: [{ echoTo: i } | { to: i } | "goal"])
const EV = a => new THREE.Vector3(a[0], a[1], a[2]);
export class Echo extends Mission {
  start() {
    const d = this.data, w = this.w;
    const plateM = () => new THREE.MeshStandardMaterial({ color: 0x3a8ad8, emissive: 0x2a6ad8, emissiveIntensity: 0.8, roughness: 0.4 });
    this.plates = (d.plates || []).map(([x, y, z]) => {
      const m = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.08, 24), plateM())); m.position.set(x, y + 0.04, z); m.receiveShadow = true;
      return { x, y, z, m, on: false };
    });
    const stone = new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 0.85 }), band = new THREE.MeshStandardMaterial({ color: 0x3a8ad8, emissive: 0x2a6ad8, emissiveIntensity: 0.6 });
    this.doors = (d.doors || []).map(o => {
      const [x, y, z] = o.at, [sx, sy, sz] = o.size;
      const g = this.add(new THREE.Group()); g.position.set(x, y, z); g.rotation.y = o.ry || 0;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), stone); slab.castShadow = slab.receiveShadow = true; g.add(slab);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.9, 0.12, sz * 1.05), band); glow.position.y = sy * 0.25; g.add(glow);
      g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
      const col = w.phys.fixedBox(x, y, z, sx / 2, sy / 2, sz / 2, o.ry || 0);
      return { ...o, x, y, z, sy, g, col, lift: 0, latched: false, band: glow };
    });
    this.goal = EV(d.goal || [0, 0, 0]);
    const ring = this.add(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 32), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb020, emissiveIntensity: 2 })));
    ring.rotation.x = Math.PI / 2; ring.position.copy(this.goal).add(new THREE.Vector3(0, 0.15, 0)); this.ring = ring;
    this.rec = null; this.ghost = null; this.play = null; this.echoes = 0;
  }
  echoLabel() { return this.rec ? "STOP" : "ECHO"; }
  echoPress() {
    if (this.done) return;
    const pp = this.p.pos;
    if (!this.rec) { this.rec = { pts: [[pp.x, pp.y, pp.z, this.p.yaw, 0]], t: 0, next: 0.1 }; this.g.sound("beep"); this.g.fx.ring(pp.x, pp.y + 0.1, pp.z, 0x7fe3ff, 1.4); return; }
    const r = this.rec; this.rec = null;
    r.pts.push([pp.x, pp.y, pp.z, this.p.yaw, 0]);
    if (r.pts.length < 3) return;
    if (!this.ghost) {
      const rig = this.ghost = makePerson(RORY);
      rig.root.traverse(n => { if (n.isMesh) { n.material = n.material.clone(); n.material.transparent = true; n.material.opacity = 0.5; n.material.depthWrite = false; if (n.material.emissive) { n.material.emissive.set(0x3ad0ff); n.material.emissiveIntensity = 0.6; } n.castShadow = false; } });
      this.add(rig.root);
    }
    this.play = { pts: r.pts, t: 0, done: false };
    const s = r.pts[0];
    this.g.fx.burst(pp.x, pp.y + 0.8, pp.z, 0x7fe3ff, 26);
    this.p.teleport(s[0], s[1] + 0.05, s[2], s[3]); this.p.walker.vel.set(0, 0, 0);
    this.g.fx.burst(s[0], s[1] + 0.8, s[2], 0x7fe3ff, 26); this.g.sound("whoosh");
    this.echoes++;
  }
  update(dt) {
    const pp = this.p.pos;
    // recording: where Rory is, ten times a second (twelve seconds at most)
    if (this.rec) {
      const r = this.rec; r.t += dt;
      if (r.t >= r.next) { r.next += 0.1; r.pts.push([pp.x, pp.y, pp.z, this.p.yaw, this.p.speed || 0]); }
      if (r.t > 12) this.echoPress();
    }
    // the echo walks it, then stays put
    if (this.play && this.ghost) {
      const P = this.play, pts = P.pts; P.t += dt;
      const f = P.t / 0.1, i = Math.min(pts.length - 1, Math.floor(f)), j = Math.min(pts.length - 1, i + 1), k = Math.min(1, f - i);
      const a = pts[i], b = pts[j];
      this.ghost.root.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
      this.ghost.root.rotation.y = b[3];
      P.done = i >= pts.length - 1;
      animatePerson(this.ghost, { dt, speed: P.done ? 0 : Math.max(a[4], 1.5), grounded: true });
    }
    // plates, held down by Rory or his echo
    const gp = this.ghost && this.play ? this.ghost.root.position : null;
    const on = (pl, q) => q && Math.hypot(q.x - pl.x, q.z - pl.z) < 0.85 && Math.abs(q.y - pl.y) < 1.2;
    for (const pl of this.plates) {
      const was = pl.on; pl.on = on(pl, pp) || on(pl, gp);
      if (pl.on !== was) { pl.m.material.color.set(pl.on ? 0xffd166 : 0x3a8ad8); pl.m.material.emissive.set(pl.on ? 0xffb020 : 0x2a6ad8); this.g.sound(pl.on ? "click" : "pop"); }
    }
    // doors: up while their plates are held (a latching one stays up once it's opened)
    for (const d of this.doors) {
      const want = d.latched || (d.need || [0]).every(i => this.plates[i] && this.plates[i].on);
      if (want && d.latch) d.latched = true;
      const was = d.lift; d.lift = Math.max(0, Math.min(1, d.lift + (want ? dt * 1.6 : -dt * 1.2)));
      d.g.position.y = d.y + d.lift * (d.sy + 0.1);
      const open = d.lift > 0.6; if (d.col.isEnabled() === open) d.col.setEnabled(!open);
      if (was === 0 && d.lift > 0) this.g.sound("whoosh");
    }
    this.ring.rotation.z += dt;
    if (Math.hypot(pp.x - this.goal.x, pp.z - this.goal.z) < 1.3 && Math.abs(pp.y - this.goal.y) < 1.5) this.win();
  }
  cleanup() { for (const d of this.doors || []) { try { this.w.phys.world.removeCollider(d.col, false); } catch (e) { /* gone */ } } super.cleanup(); }
  hud() {
    const t = this.rec ? "Recording! Walk to where your echo should stay, then press STOP." : !this.play ? "Press ECHO, walk onto the plate, then press STOP." : this.doors.every(d => d.lift > 0.6) ? "The way is open! Reach the golden ring." : "Your echo is on its way. Reach the golden ring!";
    return { ...super.hud(), text: t };
  }
  target() {
    if (this.rec) { const pl = this.plates[0]; return pl ? new THREE.Vector3(pl.x, pl.y, pl.z) : this.goal; }
    return this.goal;
  }
  stars() { const base = super.stars(); return this.echoes <= Math.max(1, this.plates.length - 1) ? base : Math.max(1, base - 1); }
  // autopilot: the plan the level gives (or: echo onto the first plate, stand on any other, then the goal)
  solve() {
    if (this.done) return;
    const plan = this.data.plan || [{ echoTo: 0 }, ...this.plates.slice(1).map((_, i) => ({ to: i + 1 })), "goal"];
    const step = plan[this.stepI || 0]; if (!step) return;
    const pp = this.p.pos, inp = this.g.input;
    if (step === "goal") { this.walkTo(this.goal.x, this.goal.y, this.goal.z, 0.8); return; }
    const pl = this.plates[step.echoTo ?? step.to];
    if (step.echoTo !== undefined) {
      if (!this.rec && !this.play) { this.echoPress(); return; }
      const d = this.walkTo(pl.x, pl.y, pl.z, 0.4);
      if (this.rec && d < 0.5) { inp.forced = { mx: 0, my: 0 }; this.echoPress(); this.stepI = (this.stepI || 0) + 1; this.navTo = null; }
      return;
    }
    // stand on a plate until every door is open (or latched)
    const d = this.walkTo(pl.x, pl.y, pl.z, 0.4);
    if (d < 0.5) { inp.forced = { mx: 0, my: 0 }; if (this.doors.every(q => q.latched || q.lift > 0.9)) { this.stepI = (this.stepI || 0) + 1; this.navTo = null; } }
  }
}

// ------------------------------------------------------------ Ride: gallop after them on a mammoth
// The mammoth runs along a track by itself; steer across it, JUMP the cracks in the ice, and grab
// the sparks for a burst of speed. Catch the Sandbots' sled before it reaches the end.
// data: path [[x, z], ...] along the ground, width (how far either side you can steer), exit
// [x, y, z] (where Rory gets off), mount ("mammoth")
function mammoth(k = 1) {
  const g = new THREE.Group(), fur = new THREE.MeshStandardMaterial({ color: 0x6a4428, roughness: 0.95 }), dark = new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.95 });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xf0e6cc, roughness: 0.4 }), eye = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.3 });
  const add = (geo, m, x, y, z, p = g) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  add(new THREE.SphereGeometry(1.3, 20, 14), fur, 0, 2.4, 0).scale.set(1, 0.95, 1.35);
  add(new THREE.SphereGeometry(0.9, 16, 12), fur, 0, 3.1, 0.9).scale.set(1, 1, 0.9); // the hump
  const head = add(new THREE.SphereGeometry(0.75, 16, 12), fur, 0, 2.9, 1.9); head.scale.set(0.9, 1, 0.9);
  // the trunk curls down, the tusks curve up
  const trunk = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.6, 2.4), new THREE.Vector3(0, 1.6, 2.7), new THREE.Vector3(0, 0.9, 2.55), new THREE.Vector3(0, 0.7, 2.3)]);
  add(new THREE.TubeGeometry(trunk, 16, 0.2, 10), dark, 0, 0, 0);
  for (const s of [-1, 1]) {
    const tusk = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.35, 2.3, 2.3), new THREE.Vector3(s * 0.6, 1.6, 2.9), new THREE.Vector3(s * 0.5, 1.9, 3.5), new THREE.Vector3(s * 0.2, 2.4, 3.6)]);
    add(new THREE.TubeGeometry(tusk, 16, 0.09, 8), ivory, 0, 0, 0);
    add(new THREE.SphereGeometry(0.1, 8, 6), eye, s * 0.42, 3.05, 2.45);
    const ear = add(new THREE.SphereGeometry(0.4, 10, 8), dark, s * 0.72, 3.0, 1.75); ear.scale.set(0.3, 1, 0.8);
  }
  const legs = [];
  for (const [x, z] of [[-0.7, 1.1], [0.7, 1.1], [-0.7, -1.1], [0.7, -1.1]]) { const leg = new THREE.Group(); leg.position.set(x, 1.8, z); g.add(leg); add(new THREE.CylinderGeometry(0.38, 0.34, 1.9, 12), fur, 0, -0.9, 0, leg); add(new THREE.CylinderGeometry(0.4, 0.42, 0.2, 12), dark, 0, -1.8, 0.02, leg); legs.push(leg); }
  add(new THREE.CylinderGeometry(0.08, 0.02, 0.9, 6), dark, 0, 2.5, -1.9).rotation.x = -0.6; // the tail
  // a blanket to sit on
  add(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xc03a2a, roughness: 0.8 }), 0, 3.62, 0.2).scale.set(1, 1, 1.2);
  g.scale.setScalar(k); g.userData.legs = legs;
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  return g;
}
function iceSled() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.7 }), gold = new THREE.MeshStandardMaterial({ color: 0xe8c070, roughness: 0.4, metalness: 0.5 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 2.8), wood); deck.position.y = 0.5; deck.castShadow = true; g.add(deck);
  for (const s of [-1, 1]) { const run = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.2), gold); run.position.set(s * 0.7, 0.15, 0.1); g.add(run); }
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0xd8c8a8, roughness: 0.8 })); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.95, -0.4); g.add(roll);
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  return g;
}
export class Ride extends Mission {
  start() {
    const d = this.data;
    this.path = (d.path || [[0, 0], [0, -200]]).map(([x, z]) => new THREE.Vector2(x, z));
    this.cum = [0]; for (let i = 1; i < this.path.length; i++) this.cum.push(this.cum[i - 1] + this.path[i].distanceTo(this.path[i - 1]));
    this.L = this.cum[this.cum.length - 1]; this.halfW = d.width || 3;
    this.s = 0; this.off = 0; this.v = 0; this.h = 0; this.vy = 0; this.stun = 0; this.boost = 0; this.stumbles = 0; this.got = 0;
    this.need = this.def.n || 6;
    let seed = 11 + this.lv; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // the cracks across the track, and the sparks between them
    const nCrack = [4, 6, 8][this.lv - 1] || 5, crackM = new THREE.MeshStandardMaterial({ color: 0x0e2a3a, roughness: 0.3, emissive: 0x0a3a5a, emissiveIntensity: 0.5 });
    this.cracks = [];
    for (let i = 0; i < nCrack; i++) {
      const s = 45 + (i + 0.5) * (this.L - 80) / nCrack + (R() - 0.5) * 6, q = this.at(s, 0);
      const m = this.add(new THREE.Mesh(new THREE.BoxGeometry(this.halfW * 2 + 3, 0.06, 1.6), crackM)); m.position.set(q.x, this.ground(q.x, q.z) + 0.04, q.z); m.rotation.y = q.yaw; m.userData.dynamic = true;
      this.cracks.push({ s, m, hit: false });
    }
    const sparkM = new THREE.MeshStandardMaterial({ color: 0xd8b8ff, emissive: 0xa070ff, emissiveIntensity: 2.4, roughness: 0.2 });
    this.sparks = [];
    for (let i = 0; i < this.need + 2; i++) {
      let s = 30 + (i + 0.5) * (this.L - 60) / (this.need + 2); if (this.cracks.some(c => Math.abs(c.s - s) < 6)) s += 8;
      const off = (R() * 2 - 1) * this.halfW * 0.8, q = this.at(s, off);
      const m = this.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.5), sparkM)); m.position.set(q.x, this.ground(q.x, q.z) + 1.6, q.z); m.userData.dynamic = true;
      this.sparks.push({ s, off, m, got: false });
    }
    // the mammoth, with Rory sat on its back, and the sled ahead
    this.mount = this.add(mammoth(0.9));
    this.rig = this.p.rig; this.mount.add(this.rig.root); this.rig.root.position.set(0, 3.72, 0.2); this.rig.root.rotation.set(0, 0, 0);
    this.quarry = { s: d.lead ?? 34, mesh: this.add(iceSled()) };
    const bots = [-0.4, 0.4].map(x => { const r = new Robot("sandbot", 0.9); r.root.position.set(x, 0.6, -0.2); r.play("Sitting"); this.quarry.mesh.add(r.root); return r; }); this.bots = bots;
    this.g.driveMode = this; this.p.walker.col.setEnabled(false); this.p.blob.visible = false; this.g.bolt.root.visible = false;
    this.camPos = null; this.place();
  }
  // a point along the track, s metres in and off metres to its right, and the way it faces
  at(s, off) {
    s = Math.max(0, Math.min(this.L, s)); let i = 1; while (i < this.cum.length - 1 && this.cum[i] < s) i++;
    const a = this.path[i - 1], b = this.path[i], f = (s - this.cum[i - 1]) / Math.max(1e-6, this.cum[i] - this.cum[i - 1]);
    const dx = b.x - a.x, dz = b.y - a.y, len = Math.hypot(dx, dz) || 1, rx = -dz / len, rz = dx / len;
    return { x: a.x + dx * f + rx * off, z: a.y + dz * f + rz * off, yaw: Math.atan2(dx, dz) };
  }
  ground(x, z) { const top = 80, d = this.w.phys.ray({ x, y: top, z }, { x: 0, y: -1, z: 0 }, 200); return d === null ? 0 : top - d; }
  place() {
    const q = this.at(this.s, this.off), m = this.mount;
    m.position.set(q.x, this.ground(q.x, q.z) + this.h, q.z); m.rotation.y = q.yaw;
    const legs = m.userData.legs, ph = this.s * 0.9;
    legs.forEach((l, i) => { l.rotation.x = this.h > 0.1 ? (i < 2 ? -0.5 : 0.5) : Math.sin(ph + (i % 2 ? Math.PI : 0) + (i < 2 ? 0 : Math.PI / 2)) * Math.min(0.6, this.v * 0.05); });
    const Q = this.at(this.quarry.s, Math.sin(this.quarry.s * 0.05) * this.halfW * 0.5), qm = this.quarry.mesh;
    qm.position.set(Q.x, this.ground(Q.x, Q.z), Q.z); qm.rotation.y = Q.yaw;
  }
  ride(dt) {
    if (this.done || this.failed) return;
    const inp = this.g.input;
    // the pace: it runs by itself; a spark's boost speeds it up, a stumble on a crack slows it
    const want = this.stun > 0 ? 3 : 12.5 + (this.boost > 0 ? 6 : 0);
    this.v += (want - this.v) * Math.min(1, dt * (this.stun > 0 ? 5 : 1.2));
    this.stun -= dt; this.boost -= dt;
    const s0 = this.s; this.s = Math.min(this.L, this.s + this.v * dt);
    this.off = Math.max(-this.halfW, Math.min(this.halfW, this.off - (inp.mx || 0) * 6 * dt));
    if (inp.takeJump() && this.h <= 0.01) { this.vy = 8; this.g.sound("jump"); }
    if (this.h > 0 || this.vy > 0) { this.vy -= 22 * dt; this.h = Math.max(0, this.h + this.vy * dt); if (this.h === 0) { this.vy = 0; this.g.sound("land"); } }
    for (const c of this.cracks) if (!c.hit && s0 < c.s && this.s >= c.s) {
      if (this.h < 0.5) { c.hit = true; this.stumbles++; this.stun = 1.1; this.g.sound("fail"); this.g.fx.puff(this.mount.position.x, this.mount.position.y + 0.5, this.mount.position.z, 0xe8f4ff, 16); }
    }
    for (const sp of this.sparks) {
      if (sp.got) continue; sp.m.rotation.y += dt * 2;
      if (Math.abs(sp.s - this.s) < 2 && Math.abs(sp.off - this.off) < 1.4) { sp.got = true; sp.m.visible = false; this.got++; this.boost = 1.6; this.g.sound("cell"); this.g.addCells(1); this.g.fx.burst(sp.m.position.x, sp.m.position.y, sp.m.position.z, 0xc8a8ff, 26); }
    }
    this.place();
    animatePerson(this.rig, { dt, speed: 0, grounded: true, sit: true });
  }
  update(dt) {
    // the sled keeps a steady pace, a little quicker than the mammoth without its boosts
    const q = this.quarry; q.s += (11 + this.lv * 0.4) * dt;
    for (const b of this.bots) b.update(dt);
    if (this.s >= q.s - 3) { this.win(); return; }
    if (q.s >= this.L) this.lose("THEY GOT AWAY");
  }
  camera(cam, dt) {
    const q = this.at(this.s, this.off), back = this.at(this.s - 9, this.off * 0.6), gy = this.ground(q.x, q.z);
    const want = new THREE.Vector3(back.x, this.ground(back.x, back.z) + 6.5, back.z);
    if (!this.camPos) this.camPos = want.clone(); else this.camPos.lerp(want, Math.min(1, dt * 5));
    const ahead = this.at(this.s + 10, this.off * 0.5);
    cam.position.copy(this.camPos); cam.lookAt(ahead.x, gy + 2.5, ahead.z);
  }
  cleanup() {
    this.g.driveMode = null; this.p.walker.col.setEnabled(true); this.p.blob.visible = true; this.g.bolt.root.visible = true;
    // Rory climbs down where the ride ended
    this.w.scene.add(this.rig.root); this.rig.root.scale.setScalar(1);
    const e = this.data.exit || (() => { const q = this.at(this.s, this.off + 3); return [q.x, this.ground(q.x, q.z) + 0.1, q.z]; })();
    this.p.teleport(e[0], e[1], e[2]); this.g.bolt.pos.set(e[0] + 1.2, e[1], e[2]);
    super.cleanup();
  }
  hud() { const gap = Math.max(0, this.quarry.s - this.s); return { ...super.hud(), text: `Catch the sled! JUMP the cracks. Sparks ${this.got} · ${gap.toFixed(0)} m behind`, progress: Math.min(1, this.s / this.L) }; }
  target() { return null; }
  stars() { return this.stumbles === 0 ? 3 : this.stumbles <= 2 ? 2 : 1; }
  debugState() { return { s: +this.s.toFixed(1), q: +this.quarry.s.toFixed(1), v: +this.v.toFixed(1), got: this.got, stumbles: this.stumbles }; }
  // autopilot: steer for the next spark ahead, and jump just before each crack
  solve() {
    const inp = this.g.input;
    const sp = this.sparks.filter(q => !q.got && q.s > this.s + 2 && q.s < this.s + 45).sort((a, b) => a.s - b.s)[0];
    const aim = sp ? sp.off : 0;
    inp.forced = { mx: Math.max(-1, Math.min(1, -(aim - this.off) * 1.5)), my: 1 };
    const c = this.cracks.find(q => !q.hit && q.s > this.s && q.s - this.s < this.v * 0.28 + 1.2);
    if (c && this.h <= 0.01) inp.jumpPressed = true;
  }
}
