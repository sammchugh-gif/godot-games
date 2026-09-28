// Act Three's new mission kinds: the star map (join the stars into the pictures that point the
// way), the greenhouse (grow a Mars garden: water and light when each bed asks) and the climb
// (race Undertow's climber up the space elevator's ribbon).
import * as THREE from "three";
import { Panel } from "./missions2.js";
import { Mission } from "./mission.js";
import { screen, onTap } from "./ui.js";

// ------------------------------------------------------------ StarMap: join the stars
// Each picture is a handful of stars in a 0..1 box and the order to join them in.
const PICTURES = [
  { name: "THE ROCKET", pts: [[0.5, 0.1], [0.62, 0.32], [0.62, 0.7], [0.74, 0.88], [0.26, 0.88], [0.38, 0.7], [0.38, 0.32]], order: [0, 1, 2, 3, 4, 5, 6, 0] },
  { name: "THE ANCHOR", pts: [[0.5, 0.12], [0.5, 0.78], [0.28, 0.62], [0.72, 0.62], [0.34, 0.3], [0.66, 0.3]], order: [0, 1, 2, 1, 3, 1, 0, 4, 0, 5] },
  { name: "THE WHALE", pts: [[0.12, 0.55], [0.3, 0.38], [0.55, 0.36], [0.75, 0.48], [0.88, 0.3], [0.9, 0.62], [0.72, 0.62], [0.4, 0.66]], order: [0, 1, 2, 3, 4, 5, 3, 6, 7, 0] },
  { name: "THE SUBMARINE", pts: [[0.14, 0.6], [0.3, 0.46], [0.46, 0.46], [0.5, 0.28], [0.62, 0.28], [0.66, 0.46], [0.84, 0.52], [0.8, 0.68], [0.3, 0.7]], order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 0] },
  { name: "THE KITE", pts: [[0.5, 0.1], [0.78, 0.4], [0.5, 0.66], [0.22, 0.4], [0.5, 0.9]], order: [0, 1, 2, 3, 0, 2, 4] },
];
export class StarMap extends Panel {
  start() {
    this.need = Math.min(PICTURES.length, this.def.n || 3);
    // a fresh sky for each picture: its stars scattered among decoys
    this.pics = []; const pool = PICTURES.slice(); for (let i = 0; i < this.need; i++) this.pics.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    this.k = 0; this.mistakes = 0; this.flash = 0; this.glow = 0;
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "STAR MAP"}</div><div class="nm" style="font-weight:900;font-size:17px;color:#ffd166;margin-top:4px"></div><canvas width="600" height="600" style="width:min(62vh,82vw);height:min(62vh,82vw);display:block;margin:8px auto;touch-action:none;border-radius:16px"></canvas></div>`, "screen dim");
    this.cv = el.querySelector("canvas"); this.gx = this.cv.getContext("2d"); this.nm = el.querySelector(".nm");
    this.cv.addEventListener("pointerdown", e => { e.stopPropagation(); const r = this.cv.getBoundingClientRect(); this.tap((e.clientX - r.left) / r.width * 600, (e.clientY - r.top) / r.height * 600); });
    this.newSky();
  }
  newSky() {
    const pic = this.pic = this.pics[this.k];
    // where the picture sits, how big, and the decoy stars round it (more at higher levels)
    const s = 360 + Math.random() * 60, ox = 60 + Math.random() * (540 - s), oy = 60 + Math.random() * (540 - s);
    this.sky = pic.pts.map(([x, y]) => ({ x: ox + x * s, y: oy + y * s, real: true, r: 5.5 }));
    const decoys = 18 + this.lv * 10;
    for (let i = 0; i < decoys; i++) {
      let x, y, ok, tries = 0;
      do { x = 20 + Math.random() * 560; y = 20 + Math.random() * 560; ok = this.sky.every(q => Math.hypot(q.x - x, q.y - y) > 34); } while (!ok && ++tries < 40);
      if (ok) this.sky.push({ x, y, real: false, r: this.lv >= 3 ? 5.5 : 2 + Math.random() * 2.5 });
    }
    this.step = 0; this.lines = [];
    this.nm.textContent = `Draw ${pic.name}  (${this.k + 1} of ${this.need})`;
    this.text = `Tap the stars to draw ${pic.name}. Start at the flashing one.`;
    this.draw();
  }
  target(i) { return this.sky[this.pic.order[i]]; }
  tap(px, py) {
    if (this.done || this.between) return;
    let best = null, bd = 30; for (const s of this.sky) { const d = Math.hypot(s.x - px, s.y - py); if (d < bd) { bd = d; best = s; } }
    if (!best) return;
    this.hit(best);
  }
  hit(s) {
    const want = this.target(this.step);
    if (s !== want) { this.mistakes++; this.flash = 0.35; this.g.sound("fail"); this.draw(); return; }
    if (this.step > 0) this.lines.push([this.target(this.step - 1), s]);
    this.step++; this.g.sound("click");
    if (this.step >= this.pic.order.length) {
      this.g.sound("star"); this.glow = 1; this.between = true;
      this.nextAt = this.t + 0.9;
    }
    this.draw();
  }
  update(dt) {
    if (this.flash > 0) { this.flash -= dt; this.draw(); }
    if (this.glow > 0) { this.glow = Math.max(0, this.glow - dt); }
    if (this.between && this.t >= this.nextAt) {
      this.between = false; this.k++;
      if (this.k >= this.need) { this.g.sound("win"); this.text = "The way is clear!"; this.win(); return; }
      this.newSky();
    }
    // the next star to tap twinkles
    this.tw = (this.tw || 0) + dt; if (Math.floor(this.tw * 6) !== this.lastTw) { this.lastTw = Math.floor(this.tw * 6); this.draw(); }
  }
  draw() {
    const g = this.gx; if (!g) return;
    const bg = g.createLinearGradient(0, 0, 0, 600); bg.addColorStop(0, "#02041a"); bg.addColorStop(1, "#0a1440");
    g.fillStyle = bg; g.fillRect(0, 0, 600, 600);
    if (this.flash > 0) { g.fillStyle = `rgba(255,60,90,${this.flash})`; g.fillRect(0, 0, 600, 600); }
    // the picture's outline, faint (fainter at higher levels)
    const hint = [0.22, 0.16, 0.1, 0.07, 0.05][this.lv - 1] ?? 0.05;
    g.strokeStyle = `rgba(160,200,255,${hint})`; g.lineWidth = 3; g.setLineDash([6, 8]); g.beginPath();
    this.pic.order.forEach((i, n) => { const s = this.sky[i]; if (n) g.lineTo(s.x, s.y); else g.moveTo(s.x, s.y); }); g.stroke(); g.setLineDash([]);
    // the lines drawn so far
    g.strokeStyle = this.glow > 0 ? "#ffd166" : "#9fe0ff"; g.lineWidth = 4; g.lineCap = "round";
    for (const [a, b] of this.lines) { g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    const next = this.step < this.pic.order.length ? this.target(this.step) : null, on = Math.floor((this.tw || 0) * 3) % 2 === 0;
    for (const s of this.sky) {
      const r = s === next && on ? s.r + 4 : s.r;
      g.fillStyle = s === next && on ? "#ffd166" : s.real && this.lv < 3 ? "#ffffff" : "#c8d8ff";
      g.beginPath(); g.arc(s.x, s.y, r, 0, 7); g.fill();
    }
  }
  stars() { return this.mistakes === 0 ? 3 : this.mistakes <= 2 ? 2 : 1; }
  // autopilot: tap the next star now and then
  solve() { if (this.done || this.between) return; this.st = (this.st || 0) + 1; if (this.st % 8) return; this.hit(this.target(this.step)); }
}

// ------------------------------------------------------------ Greenhouse: water and light on time
const PLANTS = [["🌱", "🌿", "🍅"], ["🌱", "🌿", "🍓"], ["🌱", "🌿", "🥕"], ["🌱", "🌿", "🌻"], ["🌱", "🌿", "🥔"], ["🌱", "🌿", "🫛"]];
export class Greenhouse extends Panel {
  start() {
    const n = this.n = this.def.n || 4;
    this.beds = Array.from({ length: n }, (_, i) => ({ grow: 0, want: null, until: 0, plant: PLANTS[i % PLANTS.length] }));
    this.mistakes = 0; this.nextAsk = 0.8;
    this.window = Math.max(2.2, 4.4 - this.lv * 0.4); this.gap = Math.max(0.7, 1.6 - this.lv * 0.15); this.busy = Math.min(n, 1 + Math.ceil(this.lv / 2));
    const el = screen("puzzle", `<div class="card" style="padding:14px 16px;text-align:center"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "THE GREENHOUSE"}</div>
      <div class="beds" style="display:grid;grid-template-columns:repeat(${Math.min(n, 3)},1fr);gap:12px;width:min(92vw,560px);margin:10px auto">${this.beds.map((b, i) => `<div class="bed" style="background:#1a2a1a;border-radius:18px;padding:8px 6px;box-shadow:0 0 0 2px rgba(255,255,255,.08) inset">
        <div class="ask" data-ask="${i}" style="height:34px;font-size:26px;line-height:34px"></div>
        <div class="bar" style="height:6px;border-radius:3px;background:#2a3a2a;margin:0 10px"><i data-bar="${i}" style="display:block;height:100%;width:0;background:#ffd166;border-radius:3px"></i></div>
        <div class="pl" data-pl="${i}" style="font-size:44px;height:60px;line-height:60px">${b.plant[0]}</div>
        <div style="display:flex;gap:8px;justify-content:center"><button class="btn small" data-b="${i}:water" style="padding:8px 12px;font-size:20px">💧</button><button class="btn small" data-b="${i}:light" style="padding:8px 12px;font-size:20px">☀️</button></div></div>`).join("")}</div>
      <div class="msg" style="font-weight:900;font-size:16px"></div></div>`, "screen dim");
    this.el = el; this.msg = el.querySelector(".msg");
    onTap(el, "[data-b]", b => { const [i, what] = b.dataset.b.split(":"); this.give(+i, what); });
    this.say("Watch the beds. Give each plant what it asks for!");
  }
  say(t) { this.msg.textContent = t; this.text = t; }
  give(i, what) {
    if (this.done) return;
    const b = this.beds[i];
    if (!b.want || b.want !== what) { this.mistakes++; this.g.sound("fail"); this.shake(i); this.say(b.want ? "Wrong one! Look again." : "It didn't ask for that yet."); return; }
    b.want = null; b.grow++; this.g.sound(b.grow >= 3 ? "star" : "cell");
    this.paint(i);
    if (this.beds.every(q => q.grow >= 3)) { this.say("Everything's grown!"); this.g.sound("win"); this.win(); }
  }
  shake(i) { const el = this.el.querySelector(`[data-pl="${i}"]`); if (!el) return; el.animate([{ transform: "rotate(-12deg)" }, { transform: "rotate(12deg)" }, { transform: "none" }], { duration: 300 }); }
  paint(i) {
    const b = this.beds[i], pl = this.el.querySelector(`[data-pl="${i}"]`), ask = this.el.querySelector(`[data-ask="${i}"]`);
    if (pl) { pl.textContent = b.grow >= 3 ? b.plant[2] : b.plant[Math.min(1, b.grow)]; pl.style.fontSize = `${38 + b.grow * 6}px`; }
    if (ask) ask.textContent = b.want === "water" ? "💧?" : b.want === "light" ? "☀️?" : b.grow >= 3 ? "✓" : "";
  }
  update(dt) {
    if (this.done) return;
    for (let i = 0; i < this.n; i++) {
      const b = this.beds[i];
      const bar = this.el.querySelector(`[data-bar="${i}"]`);
      if (b.want) {
        if (bar) bar.style.width = `${Math.max(0, (b.until - this.t) / this.window) * 100}%`;
        if (this.t > b.until) { b.want = null; this.mistakes++; this.g.sound("fail"); this.shake(i); this.say("Too slow! That one drooped."); this.paint(i); }
      } else if (bar) bar.style.width = "0";
    }
    this.nextAsk -= dt;
    const asking = this.beds.filter(b => b.want).length, free = this.beds.filter(b => !b.want && b.grow < 3);
    if (this.nextAsk <= 0 && asking < this.busy && free.length) {
      const b = free[Math.floor(Math.random() * free.length)], i = this.beds.indexOf(b);
      b.want = Math.random() < 0.5 ? "water" : "light"; b.until = this.t + this.window; b.asked = this.t;
      this.nextAsk = this.gap * (0.7 + Math.random() * 0.6); this.g.sound("beep"); this.paint(i);
    }
  }
  stars() { return this.mistakes === 0 ? 3 : this.mistakes <= 2 ? 2 : 1; }
  // autopilot: a moment after a bed asks, give it what it wants
  solve() { if (this.done) return; for (let i = 0; i < this.n; i++) { const b = this.beds[i]; if (b.want && this.t - b.asked > 0.5) { this.give(i, b.want); return; } } }
}

// ------------------------------------------------------------ Climb: race up the ribbon
// data: axis [x, z] (the ribbon), base (height it starts), height (how far up the finish is), r (how
// far round the ribbon the climbers ride), exit [x, y, z] (where Rory steps off afterwards).
export class Climb extends Mission {
  start() {
    const d = this.data;
    this.ax = d.axis[0]; this.az = d.axis[1]; this.y0 = d.base; this.H = d.height || 480; this.r = d.r || 2.4;
    this.need = this.def.n || 5;
    const pod = (color, glow) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 2.6, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.3 })); body.castShadow = true; g.add(body);
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x0a1a2a, emissive: glow, emissiveIntensity: 0.8, roughness: 0.1 })); win.position.set(0, 0.5, 1.15); g.add(win);
      for (const s of [-1, 1]) { const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.8, roughness: 0.3 })); clamp.position.set(s * 0.5, 0, -1.2); g.add(clamp); }
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(glow).multiplyScalar(3) })); light.position.set(0, 1.45, 0); g.add(light);
      g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
      return this.add(g);
    };
    this.me = { mesh: pod(0x2a6ad8, 0x9fe0ff), y: this.y0, a: 0, v: 0, boost: 0, stun: 0 };
    this.rival = { mesh: pod(0x0e2a4a, 0x2ad0c0), y: this.y0, a: Math.PI, v: 0 };
    // the space junk and the boost cells up the ribbon (a gap at the bottom to get going)
    let seed = 7 + this.lv; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    this.junk = []; this.boosts = [];
    const junkM = new THREE.MeshStandardMaterial({ color: 0xa0a4ac, metalness: 0.7, roughness: 0.4 }), panelM = new THREE.MeshStandardMaterial({ color: 0x1a2a6a, metalness: 0.4, roughness: 0.3, emissive: 0x0a1a4a, emissiveIntensity: 0.4 });
    const nJunk = Math.round(this.H / (42 - this.lv * 4));
    for (let i = 0; i < nJunk; i++) {
      const y = this.y0 + 40 + (i + 0.2 + R() * 0.6) * (this.H - 60) / nJunk, a = R() * Math.PI * 2;
      const g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), junkM); g.add(box);
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), panelM); p.position.x = s * 1.4; g.add(p); }
      g.position.set(this.ax + Math.sin(a) * this.r, y, this.az + Math.cos(a) * this.r); g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
      this.junk.push({ mesh: this.add(g), y, a, spin: 0.5 + R() * 1.5, hit: false });
    }
    const cellM = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb020, emissiveIntensity: 2.2, roughness: 0.2 });
    for (let i = 0; i < this.need; i++) {
      const y = this.y0 + 60 + (i + 0.5) * (this.H - 120) / this.need;
      // (not where junk is)
      let a = R() * Math.PI * 2; for (let t = 0; t < 12 && this.junk.some(j => Math.abs(j.y - y) < 8 && this.arc(j.a, a) < 2.6); t++) a = R() * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), cellM); m.position.set(this.ax + Math.sin(a) * this.r, y, this.az + Math.cos(a) * this.r); m.userData.dynamic = true;
      this.boosts.push({ mesh: this.add(m), y, a, got: false });
    }
    this.got = 0;
    // Rory rides inside: his figure and BOLT are put away till the end
    this.g.driveMode = this; this.p.walker.col.setEnabled(false); this.p.obj.visible = false; this.g.bolt.root.visible = false;
    if (this.w.climberProp) this.w.climberProp.visible = false;
    this.place(this.me); this.place(this.rival);
    this.camPos = null;
  }
  arc(a, b) { let d = a - b; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) * this.r; }
  place(c) { c.mesh.position.set(this.ax + Math.sin(c.a) * this.r, c.y, this.az + Math.cos(c.a) * this.r); c.mesh.rotation.y = c.a; }
  ride(dt) {
    const inp = this.g.input, me = this.me;
    if (this.done || this.failed) return;
    // the throttle, the steering round the ribbon, the boost and being knocked back
    const want = me.stun > 0 ? 0 : (inp.my > 0.2 ? 11 : inp.my < -0.2 ? 3 : 7) + (me.boost > 0 ? 9 : 0);
    me.v += (want - me.v) * Math.min(1, dt * (me.stun > 0 ? 6 : 1.4));
    me.a -= (inp.mx || 0) * dt * 1.7;
    me.y += me.v * dt; me.boost -= dt; me.stun -= dt;
    this.place(me);
    // Undertow's climber keeps a steady pace, a little quicker than yours without the boosts
    const rv = 10.2 + this.lv * 0.35, rival = this.rival;
    rival.v += (rv - rival.v) * Math.min(1, dt * 1.2); rival.y += rival.v * dt; rival.a += dt * 0.15; this.place(rival);
    for (const j of this.junk) {
      j.mesh.rotation.x += dt * j.spin; j.mesh.rotation.y += dt * j.spin * 0.7;
      if (!j.hit && Math.abs(j.y - me.y) < 1.7 && this.arc(j.a, me.a) < 1.5) { j.hit = true; j.mesh.visible = false; me.stun = 0.8; me.v = Math.min(me.v, 1); this.g.sound("hit"); if (this.w.fx) this.w.fx.burst(j.mesh.position.x, j.mesh.position.y, j.mesh.position.z, 0xc0c4cc, 20); }
    }
    for (const b of this.boosts) {
      b.mesh.rotation.y += dt * 2;
      if (!b.got && Math.abs(b.y - me.y) < 1.8 && this.arc(b.a, me.a) < 1.6) { b.got = true; b.mesh.visible = false; this.got++; me.boost = 2.2; this.g.sound("cell"); if (this.w.fx) this.w.fx.burst(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, 0xffd166, 24); }
    }
  }
  update() {
    if (this.me.y >= this.y0 + this.H) { this.win(); return; }
    if (this.rival.y >= this.y0 + this.H) this.lose("UNDERTOW GOT THERE FIRST");
  }
  camera(cam, dt) {
    const me = this.me, out = new THREE.Vector3(Math.sin(me.a), 0, Math.cos(me.a));
    const want = new THREE.Vector3(this.ax, me.y - 2.5, this.az).addScaledVector(out, this.r + 9);
    if (!this.camPos) this.camPos = want.clone(); else this.camPos.lerp(want, Math.min(1, dt * 4));
    cam.position.copy(this.camPos); cam.lookAt(this.ax + out.x * this.r, me.y + 5, this.az + out.z * this.r);
  }
  cleanup() {
    this.g.driveMode = null; this.p.walker.col.setEnabled(true); this.p.obj.visible = true; this.g.bolt.root.visible = true;
    if (this.w.climberProp) this.w.climberProp.visible = true;
    const e = this.data.exit; if (e) { this.p.teleport(e[0], e[1], e[2]); this.g.bolt.pos.set(e[0] + 1, e[1], e[2]); }
    super.cleanup();
  }
  hud() { const f = Math.min(1, (this.me.y - this.y0) / this.H), lead = this.me.y - this.rival.y; return { ...super.hud(), text: `Race to the top! Boosts ${this.got}/${this.need} · ${lead >= 0 ? "ahead" : "behind"} by ${Math.abs(lead).toFixed(0)} m`, progress: f }; }
  target() { return null; }
  stars() { const lead = this.me.y - this.rival.y; return lead > 40 ? 3 : lead > 15 ? 2 : 1; }
  debugState() { const f = v => +v.toFixed(1); return { y: f(this.me.y - this.y0), rival: f(this.rival.y - this.y0), v: f(this.me.v), got: this.got, hits: this.junk.filter(j => j.hit).length }; }
  // autopilot: full throttle; steer clear of junk coming up, and round to the next boost cell
  solve() {
    const inp = this.g.input, me = this.me;
    let aim = null;
    const danger = this.junk.filter(j => !j.hit && j.y > me.y && j.y - me.y < 16 + me.v && this.arc(j.a, me.a) < 2.4).sort((a, b) => a.y - b.y)[0];
    if (danger) { let d = me.a - danger.a; d = Math.atan2(Math.sin(d), Math.cos(d)); aim = danger.a + (d >= 0 ? 1 : -1) * 1.6; }
    else { const b = this.boosts.filter(q => !q.got && q.y > me.y && q.y - me.y < 70).sort((a, c) => a.y - c.y)[0]; if (b) aim = b.a; }
    let mx = 0;
    if (aim !== null) { let d = aim - me.a; d = Math.atan2(Math.sin(d), Math.cos(d)); mx = Math.max(-1, Math.min(1, -d * 2.5)); }
    inp.forced = { mx, my: 1 };
  }
}
