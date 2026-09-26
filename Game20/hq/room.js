// Agent Rory HQ: POLARIS's briefing room. Rory walks round, picks a game off the
// mission board, and in between can make a cup of tea, press the button he
// shouldn't, spin on the office chair, pat the office cat and answer the banana
// phone. Built on the Zero Gravity engine, loaded from its folder.
import * as THREE from "three";
import { Engine } from "../agent-rory-zero-gravity/js/engine.js";
import { initPhysics, Physics } from "../agent-rory-zero-gravity/js/physics.js";
import { World } from "../agent-rory-zero-gravity/js/world.js";
import { Input } from "../agent-rory-zero-gravity/js/input.js";
import { Player } from "../agent-rory-zero-gravity/js/player.js";
import { loadRobot, Robot } from "../agent-rory-zero-gravity/js/robots.js";
import { makePerson, animatePerson } from "../agent-rory-zero-gravity/js/people.js";
import { M, TEX } from "../agent-rory-zero-gravity/js/tex.js";
import { FX } from "../agent-rory-zero-gravity/js/fx.js";
import { Audio } from "../agent-rory-zero-gravity/js/audio.js";
import { Speech } from "../agent-rory-zero-gravity/js/speech.js";
import { Portraits } from "../agent-rory-zero-gravity/js/portraits.js";
import { Dialogue, HUD, toast, screen, clearLayer, onTap } from "../agent-rory-zero-gravity/js/ui.js";
import { earthTexture } from "../agent-rory-zero-gravity/js/globe.js";
import { CHARS } from "../agent-rory-zero-gravity/js/story.js";

// the mission files on the wall. saves: localStorage keys, total: missions in the game
export const FILES = [
  { id: "eclipse", n: "FILE 001", kicker: "THE FIRST MISSION", title: "Operation Eclipse", href: "../agent-rory/", shot: "../shots/agent-rory.jpg", accent: "#ffd166", saves: ["agentrory.save"], total: 90,
    blurb: "UMBRA is stealing the sun. Twenty-one countries from London to the Antarctic ice, ninety missions and six chases.",
    frost: "Operation Eclipse. Where it all began, Agent Rory. UMBRA and the stolen sun." },
  { id: "meltdown", n: "FILE 002", kicker: "A SPY MOVIE", title: "Meltdown", href: "../agent-rory-meltdown/", shot: "../shots/agent-rory-meltdown.jpg", accent: "#7fdcff", saves: ["rorymeltdown.save", "rorymeltdown.save2", "rorymeltdown.save3"], total: 90,
    blurb: "Baron Kaldera is melting Antarctica from underneath. Eighteen places, ninety missions, and a chase in every one.",
    frost: "Meltdown. Baron Kaldera, a volcano, and a great deal of melting ice." },
  { id: "zero", n: "FILE 003", kicker: "MOONSHOT", title: "Zero Gravity", href: "../agent-rory-zero-gravity/", shot: "../shots/agent-rory-zero-gravity.jpg", accent: "#ff9ae8", saves: ["rory20.save"], total: 60,
    blurb: "Professor Zero is stealing the world's gravity. Rory and BOLT run, jump, drive and fly from Tokyo to the Moon. Sixty missions.",
    frost: "Zero Gravity. Professor Zero, his floating shoes, and a trip to the Moon." },
];
// how far Rory has got in a file, from its saves
export function progress(f) {
  let done = 0, stars = 0, finished = 0, any = false;
  for (const key of f.saves) {
    let sv = null;
    try { sv = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { /* no save */ }
    if (!sv) continue;
    any = true;
    done += sv.done ? sv.done.length : 0;
    if (sv.stars) for (const k in sv.stars) stars += +sv.stars[k] || 0;
    if (sv.finished) finished++;
  }
  return { done: Math.min(done, f.total), stars, any, finished: finished > 0 && finished >= f.saves.filter(k => localStorage.getItem(k)).length };
}

const G = window.__hq = { state: "boot", t: 0 };
const pick = a => a[Math.floor(Math.random() * a.length)];
const count = key => { let n = 0; try { n = (+localStorage.getItem(key) || 0) + 1; localStorage.setItem(key, n); } catch (e) { n = 1; } return n; };
const canvasTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// ------------------------------------------------------------ the mission board
// a corkboard with the three mission files pinned to it, red string between the
// pins, and a few sticky notes. It redraws when Rory walks up to a file.
const BW = 18, BH = 5.6, CW = 2048, CH = Math.round(2048 * BH / BW);
const CARD_U = [0.2, 0.5, 0.8];
function boardTexture() {
  const c = document.createElement("canvas"); c.width = CW; c.height = CH;
  const g = c.getContext("2d"), tex = canvasTex(c);
  const imgs = FILES.map(f => { const i = new Image(); i.onload = () => draw(); i.src = f.shot; return i; });
  // cork, speckled the same way every time
  const cork = document.createElement("canvas"); cork.width = CW; cork.height = CH;
  { const k = cork.getContext("2d"); k.fillStyle = "#b07a45"; k.fillRect(0, 0, CW, CH); let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 9000; i++) { k.fillStyle = r() < 0.5 ? "rgba(90,50,20,.35)" : "rgba(230,180,120,.3)"; k.beginPath(); k.ellipse(r() * CW, r() * CH, 1 + r() * 3, 1 + r() * 2, r() * 3, 0, 7); k.fill(); } }
  let hi = -1;
  const draw = () => {
    g.drawImage(cork, 0, 0);
    // the header strip and a TOP SECRET stamp
    g.save(); g.translate(CW / 2, 70); g.rotate(-0.01); g.fillStyle = "#f4efe2"; g.fillRect(-330, -44, 660, 88); g.fillStyle = "#1a2438"; g.font = "900 64px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("MISSION BOARD", 0, 4); g.restore();
    g.save(); g.translate(CW / 2 + 470, 74); g.rotate(-0.18); g.strokeStyle = "#d8283a"; g.lineWidth = 7; g.strokeRect(-150, -34, 300, 68); g.fillStyle = "#d8283a"; g.font = "900 44px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("TOP SECRET", 0, 2); g.restore();
    const pins = [];
    FILES.forEach((f, i) => {
      const p = progress(f), cx = CARD_U[i] * CW, cy = CH * 0.56, w = 520, h = 470, rot = [-0.035, 0.02, -0.025][i];
      g.save(); g.translate(cx, cy); g.rotate(rot);
      if (hi === i) { g.shadowColor = "#ffd166"; g.shadowBlur = 60; g.fillStyle = "#ffd166"; g.fillRect(-w / 2 - 16, -h / 2 - 16, w + 32, h + 32); g.shadowBlur = 0; }
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(-w / 2 + 10, -h / 2 + 12, w, h);
      g.fillStyle = "#e6e0d0"; g.fillRect(-w / 2, -h / 2, w, h);
      // the photo
      const pw = w - 40, ph = 250, img = imgs[i];
      if (img.complete && img.naturalWidth) g.drawImage(img, -pw / 2, -h / 2 + 20, pw, ph);
      else { g.fillStyle = "#16305c"; g.fillRect(-pw / 2, -h / 2 + 20, pw, ph); }
      g.fillStyle = f.accent; g.fillRect(-pw / 2, -h / 2 + 20 + ph, pw, 8);
      g.fillStyle = "#6a7488"; g.font = "800 22px system-ui"; g.textAlign = "left"; g.textBaseline = "top"; g.fillText(f.n + "  ·  " + f.kicker, -pw / 2, -h / 2 + 290);
      g.fillStyle = "#141c2c"; g.font = "900 46px system-ui"; g.fillText(f.title, -pw / 2, -h / 2 + 318);
      // progress: a bar, the count and the stars
      const by = -h / 2 + 390; g.fillStyle = "#dde2ea"; g.fillRect(-pw / 2, by, pw - 150, 18); g.fillStyle = f.accent; g.fillRect(-pw / 2, by, (pw - 150) * p.done / f.total, 18);
      g.fillStyle = "#141c2c"; g.font = "800 26px system-ui"; g.fillText(`${p.done}/${f.total}`, pw / 2 - 138, by - 5);
      if (p.stars) { g.fillStyle = "#c88a10"; g.fillText("★ " + p.stars, -pw / 2, by + 30); }
      const stamp = p.finished ? ["COMPLETE", "#1f9a4a"] : p.done ? ["IN PROGRESS", "#2a7ad8"] : f.id === "zero" ? ["NEW!", "#d8283a"] : ["NOT STARTED", "#8a93a6"];
      g.save(); g.translate(pw / 2 - 110, -h / 2 + 220); g.rotate(-0.22); g.strokeStyle = stamp[1]; g.lineWidth = 6; g.font = "900 34px system-ui"; g.textAlign = "center"; g.textBaseline = "middle";
      const sw = g.measureText(stamp[0]).width + 36; g.globalAlpha = 0.9; g.strokeRect(-sw / 2, -28, sw, 56); g.fillStyle = stamp[1]; g.fillText(stamp[0], 0, 2); g.restore();
      g.restore();
      pins.push([cx, cy - h / 2 + 8]);
    });
    // red string from pin to pin, sagging
    g.strokeStyle = "#c81e2e"; g.lineWidth = 5; g.beginPath(); g.moveTo(90, 150);
    let lx = 90;
    for (const [x, y] of pins) { g.quadraticCurveTo((lx + x) / 2, y + 60, x, y); lx = x; }
    g.quadraticCurveTo((lx + CW - 90) / 2, 260, CW - 90, 150); g.stroke();
    for (const [x, y] of [[90, 150], ...pins, [CW - 90, 150]]) { g.fillStyle = "#e8283a"; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(x - 5, y - 5, 5, 0, 7); g.fill(); }
    // sticky notes
    const note = (x, y, rot, lines, col = "#ffe65a") => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(-72, -64, 150, 134); g.fillStyle = col; g.fillRect(-78, -70, 150, 134); g.fillStyle = "#2a2a3a"; g.font = "700 22px 'Comic Sans MS', 'Marker Felt', cursive"; g.textAlign = "center"; lines.forEach((l, k) => g.fillText(l, -3, -30 + k * 30)); g.restore(); };
    note(100, CH - 150, 0.08, ["Where is", "BOLT's other", "sock?"]);
    note(CW - 100, CH - 150, -0.07, ["Buy milk.", "And biscuits.", "LOTS of", "biscuits."], "#9ae8ff");
    note(CW - 110, 330, 0.05, ["Zero =", "floating", "shoes??"], "#ffb0d8");
    tex.needsUpdate = true;
  };
  draw();
  return { tex, draw, highlight(i) { if (i !== hi) { hi = i; draw(); } } };
}

// ------------------------------------------------------------ posters
function posterMesh(w, x, y, z, ry, pw, ph, paint) {
  const c = document.createElement("canvas"); c.width = 512; c.height = Math.round(512 * ph / pw);
  const g = c.getContext("2d"); paint(g, c.width, c.height);
  const tex = canvasTex(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.85 }));
  m.position.set(x, y, z); m.rotation.y = ry; m.userData.dynamic = true; w.scene.add(m);
  return { m, redraw: fn => { fn(g, c.width, c.height); tex.needsUpdate = true; } };
}
const T = (g, text, x, y, font, color, align = "center") => { g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = "middle"; g.fillText(text, x, y); };
// a WANTED poster: face(g, cx, cy, r) draws the villain
function wanted(name, crime, reward, face) {
  return (g, W, H) => {
    g.fillStyle = "#efdcae"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,80,30,${Math.random() * 0.08})`; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); }
    g.strokeStyle = "#5a3a1a"; g.lineWidth = 8; g.strokeRect(14, 14, W - 28, H - 28);
    T(g, "WANTED", W / 2, 70, "900 86px Georgia, serif", "#3a2210");
    g.fillStyle = "#d8c49a"; g.fillRect(96, 120, W - 192, 300); face(g, W / 2, 270, 110);
    g.strokeStyle = "#5a3a1a"; g.lineWidth = 4; g.strokeRect(96, 120, W - 192, 300);
    T(g, name, W / 2, 462, "900 44px Georgia, serif", "#3a2210");
    T(g, "for " + crime, W / 2, 512, "italic 700 30px Georgia, serif", "#5a3a1a");
    T(g, "REWARD:", W / 2, 578, "900 30px Georgia, serif", "#8a2a1a");
    T(g, reward, W / 2, 618, "700 30px Georgia, serif", "#3a2210");
  };
}
function buildPosters(w, RW, RD) {
  const WX = -RW / 2 + 0.27, EX = RW / 2 - 0.27, SZ = RD / 2 - 0.27;
  // west wall
  posterMesh(w, WX, 3, -7.2, Math.PI / 2, 2.2, 3, wanted("UMBRA", "stealing the sun", "one very big torch", (g, x, y, r) => {
    g.fillStyle = "#1a1420"; g.beginPath(); g.moveTo(x - r, y + r * 1.3); g.quadraticCurveTo(x - r * 1.1, y - r * 1.2, x, y - r * 1.2); g.quadraticCurveTo(x + r * 1.1, y - r * 1.2, x + r, y + r * 1.3); g.fill();
    g.fillStyle = "#ffd23f"; g.shadowColor = "#ffd23f"; g.shadowBlur = 20; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * 0.32, y - r * 0.1, r * 0.16, r * 0.08, s * 0.3, 0, 7); g.fill(); } g.shadowBlur = 0;
  }));
  posterMesh(w, WX, 3, -4.6, Math.PI / 2, 2.2, 3, wanted("BARON KALDERA", "melting Antarctica", "free ice lollies for life", (g, x, y, r) => {
    g.fillStyle = "#f0c8a0"; g.beginPath(); g.arc(x, y + r * 0.1, r * 0.8, 0, 7); g.fill();
    g.fillStyle = "#2a1a14"; g.fillRect(x - r * 0.7, y - r * 1.25, r * 1.4, r * 0.7); g.fillRect(x - r, y - r * 0.6, r * 2, r * 0.14);
    g.strokeStyle = "#2a1a14"; g.lineWidth = 9; g.beginPath(); g.moveTo(x - r * 0.7, y + r * 0.35); g.quadraticCurveTo(x - r * 0.35, y + r * 0.1, x, y + r * 0.3); g.quadraticCurveTo(x + r * 0.35, y + r * 0.1, x + r * 0.7, y + r * 0.35); g.stroke();
    g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.1, r * 0.08, 0, 7); g.fill();
    g.strokeStyle = "#c8a030"; g.lineWidth = 5; g.beginPath(); g.arc(x + r * 0.3, y - r * 0.1, r * 0.2, 0, 7); g.stroke(); g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(x + r * 0.3, y - r * 0.1, r * 0.07, 0, 7); g.fill();
  }));
  // south wall, either side of the door
  const zero = posterMesh(w, -8.4, 3, SZ, Math.PI, 2.2, 3, wanted("PROFESSOR ZERO", "stealing gravity", "a very heavy medal", (g, x, y) => { g.fillStyle = "#3a1030"; g.fillRect(x - 160, y - 150, 320, 300); T(g, "?", x, y, "900 160px Georgia", "#ff9ae8"); }));
  posterMesh(w, -4.8, 3, SZ, Math.PI, 2.2, 3, (g, W, H) => {
    g.fillStyle = "#0c1a3a"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#ffd166"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 60 : 140; g.lineTo(W / 2 + Math.cos(a) * r, 250 + Math.sin(a) * r); } g.fill();
    T(g, "POLARIS", W / 2, 70, "900 64px system-ui", "#7fe3ff"); T(g, "NEEDS", W / 2, 450, "900 72px system-ui", "#ffffff"); T(g, "YOU!", W / 2, 530, "900 90px system-ui", "#ffd166");
    T(g, "Must like gadgets.", W / 2, 612, "700 26px system-ui", "#cfe0ff"); T(g, "Must not press the red button.", W / 2, 646, "700 24px system-ui", "#ff9aa0");
  });
  posterMesh(w, 4.8, 3, SZ, Math.PI, 2.2, 3, (g, W, H) => {
    g.fillStyle = "#05060e"; g.fillRect(0, 0, W, H); for (let i = 0; i < 120; i++) { g.fillStyle = "#fff"; g.fillRect(Math.random() * W, Math.random() * 380, 2, 2); }
    g.fillStyle = "#3a8ad8"; g.beginPath(); g.arc(380, 150, 60, 0, 7); g.fill(); g.fillStyle = "#6ac86a"; g.beginPath(); g.arc(365, 140, 26, 0, 7); g.fill();
    g.fillStyle = "#b8b8c0"; g.beginPath(); g.ellipse(W / 2, 520, 360, 170, 0, Math.PI, 0); g.fill(); for (const [x, y, r] of [[160, 440, 26], [320, 420, 18], [260, 470, 14]]) { g.fillStyle = "#8a8a94"; g.beginPath(); g.ellipse(x, y, r, r * 0.4, 0, 0, 7); g.fill(); }
    g.fillStyle = "#f0f2f6"; g.beginPath(); g.moveTo(130, 380); g.lineTo(160, 250); g.lineTo(190, 380); g.fill(); g.fillStyle = "#ff6a3a"; g.beginPath(); g.moveTo(140, 380); g.lineTo(160, 420); g.lineTo(180, 380); g.fill();
    T(g, "VISIT THE MOON", W / 2, 560, "900 50px system-ui", "#ffd166"); T(g, "Low gravity! No queues!", W / 2, 610, "700 28px system-ui", "#dfe6f2"); T(g, "Bring a sandwich.", W / 2, 648, "700 26px system-ui", "#9aa6ba");
  });
  const agent = posterMesh(w, 8.4, 3, SZ, Math.PI, 2.2, 3, () => {});
  // east wall, either side of the map
  posterMesh(w, EX, 3, -7.2, -Math.PI / 2, 2.2, 3, (g, W, H) => {
    g.fillStyle = "#c8283a"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#fff"; g.fillRect(W / 2 - 50, 60, 100, 60); g.fillRect(W / 2 - 16, 40, 32, 20); g.beginPath(); g.arc(W / 2, 90, 16, 0, 7); g.fillStyle = "#c8283a"; g.fill();
    ["KEEP", "CALM", "AND", "CARRY A", "GADGET"].forEach((l, i) => T(g, l, W / 2, 200 + i * 92, `900 ${i === 2 ? 44 : 72}px system-ui`, "#ffffff"));
  });
  posterMesh(w, 2.45, 2.3, SZ, Math.PI, 0.8, 1.09, (g, W, H) => {
    g.fillStyle = "#1a7a3a"; g.fillRect(0, 0, W, H); g.fillStyle = "#fff"; g.fillRect(30, 30, W - 60, H - 60); g.fillStyle = "#1a7a3a"; g.fillRect(44, 44, W - 88, H - 88);
    T(g, "IN CASE", W / 2, 140, "900 64px system-ui", "#fff"); T(g, "OF FIRE", W / 2, 220, "900 64px system-ui", "#fff");
    T(g, "USE", W / 2, 360, "900 60px system-ui", "#ffd166"); T(g, "JETPACK", W / 2, 440, "900 76px system-ui", "#ffd166");
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(W / 2 - 40, 560); g.lineTo(W / 2 + 40, 560); g.lineTo(W / 2, 510); g.fill();
  });
  // the team photo: a real one, in a wooden frame with a brass plaque
  const photo = new THREE.Group(); photo.position.set(EX, 3.1, 7.3); photo.rotation.y = -Math.PI / 2; w.scene.add(photo);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.74, 0.1), M("wood", { args: [315, [120, 76, 40]] })); frame.position.z = 0.02; photo.add(frame);
  const tex = new THREE.TextureLoader().load("agents.jpg"); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.43), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.6 })); pic.position.z = 0.08; pic.userData.dynamic = true; photo.add(pic);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.3), new THREE.MeshStandardMaterial({ map: TEX.sign("OUR AGENTS", { bg: "#6a4a14", fg: "#ffe8a0", border: "#ffe8a0" }), emissive: 0xffd88a, emissiveIntensity: 0.3 })); plaque.position.set(0, -1.62, 0.06); plaque.userData.dynamic = true; photo.add(plaque);
  return { zero, agent };
}
// the two posters that need 3D faces, drawn once the portrait renderer exists
function paintFaces(p) {
  p.zero.redraw(wanted("PROFESSOR ZERO", "stealing gravity", "a very heavy medal", (g, x, y) => { const f = G.portraits.get("zero"); if (f) g.drawImage(f, x - 150, y - 150, 300, 300); }));
  p.agent.redraw((g, W, H) => {
    g.fillStyle = "#10284a"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#ffd166"; g.lineWidth = 14; g.strokeRect(20, 20, W - 40, H - 40);
    T(g, "AGENT OF", W / 2, 80, "900 56px system-ui", "#ffd166"); T(g, "THE MONTH", W / 2, 140, "900 56px system-ui", "#ffd166");
    const f = G.portraits.get("rory"); if (f) { g.save(); g.beginPath(); g.arc(W / 2, 330, 140, 0, 7); g.clip(); g.drawImage(f, W / 2 - 150, 180, 300, 300); g.restore(); }
    g.strokeStyle = "#ffd166"; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, 330, 140, 0, 7); g.stroke();
    T(g, "RORY", W / 2, 530, "900 72px system-ui", "#ffffff");
    T(g, "Every month. Again.", W / 2, 600, "italic 700 28px system-ui", "#cfe0ff");
  });
}

// ------------------------------------------------------------ props
function teaTrolley(w, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const steel = M(0xc8ccd4, { metal: 0.8, rough: 0.3 }), wood = M("wood", { args: [311, [150, 100, 60]] }), china = M(0xf4f2ee, { rough: 0.25 }), blue = M(0x3a6ad8, { rough: 0.3 });
  const add = (geo, m, px, py, pz, parent = g) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; parent.add(me); return me; };
  for (const [sx, sz] of [[-0.55, -0.32], [0.55, -0.32], [-0.55, 0.32], [0.55, 0.32]]) { add(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), steel, sx, 0.5, sz); add(new THREE.SphereGeometry(0.05, 10, 8), M(0x1a1a1a), sx, 0.05, sz); }
  add(new THREE.BoxGeometry(1.25, 0.05, 0.75), wood, 0, 0.9, 0); add(new THREE.BoxGeometry(1.25, 0.04, 0.75), wood, 0, 0.35, 0);
  // the teapot, which tips to pour
  const pot = new THREE.Group(); pot.position.set(-0.3, 0.93, 0); g.add(pot);
  add(new THREE.SphereGeometry(0.16, 20, 14), blue, 0, 0.13, 0, pot).scale.y = 0.85;
  const spout = add(new THREE.CylinderGeometry(0.02, 0.035, 0.18, 10), blue, 0.17, 0.16, 0, pot); spout.rotation.z = -0.9;
  const handle = add(new THREE.TorusGeometry(0.07, 0.015, 8, 16), blue, -0.17, 0.15, 0, pot); void handle;
  add(new THREE.SphereGeometry(0.03, 10, 8), china, 0, 0.29, 0, pot);
  // cups on saucers, and a plate of biscuits
  for (const [cx, cz] of [[0.1, -0.18], [0.3, -0.18], [0.1, 0.18]]) { add(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 16), china, cx, 0.93, cz); add(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 14), china, cx, 0.97, cz); }
  add(new THREE.CylinderGeometry(0.14, 0.14, 0.015, 20), china, 0.38, 0.93, 0.16);
  for (let i = 0; i < 5; i++) { const b = add(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14), M(0xc8904a, { rough: 0.8 }), 0.38 + Math.cos(i * 1.26) * 0.06, 0.945 + i * 0.006, 0.16 + Math.sin(i * 1.26) * 0.06); void b; }
  w.phys.fixedBox(x, 0.47, z, 0.63, 0.47, 0.38);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshStandardMaterial({ map: TEX.sign("TEA", { bg: "#2a1a0a", fg: "#ffd166" }), emissive: 0xffc070, emissiveIntensity: 0.4 })); sign.position.set(0, 0.62, 0.385); g.add(sign);
  return { g, pot, spout: new THREE.Vector3(x - 0.3 + 0.24, 1.2, z) };
}
function bigRedButton(w, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.0, 20), M(0x2a3040, { metal: 0.7, rough: 0.35 })); post.position.y = 0.5; post.castShadow = true; g.add(post);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 24), M(0xffd23f, { metal: 0.4 })); rim.position.y = 1.03; g.add(rim);
  const btn = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xe8283a, { emissive: 0xff1a2a, ei: 0.8, rough: 0.3 })); btn.position.y = 1.06; g.add(btn);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.3), new THREE.MeshStandardMaterial({ map: TEX.sign("DO NOT PRESS", { bg: "#1a0a0a", fg: "#ff5a5a", border: "#ff5a5a" }), emissive: 0xff3a3a, emissiveIntensity: 0.5 }));
  sign.position.set(0, 0.62, 0.35); g.add(sign);
  w.phys.fixedCyl(x, 0.55, z, 0.36, 0.55);
  return { g, btn };
}
function officeChair(w, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const black = M(0x1a1c22, { rough: 0.5 }), chrome = M(0xc8ccd4, { metal: 0.9, rough: 0.2 }), fabric = M(0x2a6ad8, { rough: 0.8 });
  const add = (geo, m, px, py, pz, parent = g) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; parent.add(me); return me; };
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = add(new THREE.BoxGeometry(0.05, 0.04, 0.34), chrome, Math.sin(a) * 0.17, 0.08, Math.cos(a) * 0.17); leg.rotation.y = a; add(new THREE.SphereGeometry(0.04, 8, 6), black, Math.sin(a) * 0.33, 0.04, Math.cos(a) * 0.33); }
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10), chrome, 0, 0.27, 0);
  const top = new THREE.Group(); top.position.y = 0.46; g.add(top);   // the part that spins
  add(new THREE.BoxGeometry(0.5, 0.08, 0.48), fabric, 0, 0, 0, top);
  add(new THREE.BoxGeometry(0.46, 0.55, 0.07), fabric, 0, 0.33, -0.24, top);
  w.phys.fixedCyl(x, 0.3, z, 0.3, 0.3);
  return { g, top, seat: new THREE.Vector3(x, 0.46, z) };
}
function officeCat(w, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const fur = M(0xe8943a, { rough: 0.9 }), white = M(0xf4efe6, { rough: 0.9 }), dark = M(0x1a1410), pink = M(0xff9aa8);
  const add = (geo, m, px, py, pz, parent = g) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; parent.add(me); return me; };
  add(new THREE.CylinderGeometry(0.45, 0.48, 0.12, 24), M(0x8a3ad8, { rough: 0.9 }), 0, 0.06, 0);   // the cushion
  const body = add(new THREE.SphereGeometry(0.2, 16, 12), fur, 0, 0.26, 0); body.scale.set(1, 0.8, 1.4);
  add(new THREE.SphereGeometry(0.12, 12, 10), white, 0, 0.22, 0.16).scale.set(1, 0.7, 1);
  const head = new THREE.Group(); head.position.set(0, 0.4, 0.22); g.add(head);
  add(new THREE.SphereGeometry(0.12, 16, 12), fur, 0, 0, 0, head);
  for (const s of [-1, 1]) { const ear = add(new THREE.ConeGeometry(0.045, 0.09, 8), fur, s * 0.07, 0.11, -0.01, head); ear.rotation.z = -s * 0.25; }
  const eyes = [-1, 1].map(s => add(new THREE.SphereGeometry(0.02, 8, 6), dark, s * 0.045, 0.02, 0.105, head));
  add(new THREE.SphereGeometry(0.015, 8, 6), pink, 0, -0.02, 0.118, head);
  const tail = new THREE.Group(); tail.position.set(0, 0.24, -0.26); g.add(tail);
  for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.04 - i * 0.004, 8, 6), fur, 0, i * 0.04, -i * 0.05, tail);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.22), new THREE.MeshStandardMaterial({ map: TEX.sign("AGENT WHISKERS", { bg: "#1a0a2a", fg: "#ffd166" }), emissive: 0xffd166, emissiveIntensity: 0.3 }));
  tag.position.set(0, 0.03, 0.62); tag.rotation.x = -Math.PI / 2 + 0.4; g.add(tag);
  w.phys.fixedCyl(x, 0.25, z, 0.46, 0.25);
  return { g, body, head, eyes, tail, purr: 0, meow: 0 };
}
function bananaPhone(w, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.2, 0.02, 0), new THREE.Vector3(0, -0.08, 0.02), new THREE.Vector3(0.2, 0.05, 0));
  const banana = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.05, 10), M(0xffd23f, { rough: 0.5 })); banana.position.y = 0.08; banana.castShadow = true; g.add(banana);
  for (const s of [-1, 1]) { const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), M(0x5a3a1a)); tip.position.set(s * 0.2, 0.08 + (s > 0 ? 0.05 : 0.02), 0); g.add(tip); }
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 20, Math.PI * 3), M(0x1a1a1a)); cord.position.set(0.25, 0.03, 0.05); cord.rotation.x = Math.PI / 2; g.add(cord);
  return { g, banana };
}

// ------------------------------------------------------------ the room
function buildRoom(w) {
  // indoors: a dim light from above, and the room's own lights do the rest
  w.setSky({ top: "#02040a", mid: "#050a18", bottom: "#050a18", sun: [70, 30], sunColor: "#bcd8ff", sunI: 0.55, hemi: ["#8ab4ff", "#141820", 0.35], fog: null, clouds: 0 });
  w.scene.userData.envI = 0.4;
  const RW = 26, RD = 20, RH = 6.5;
  // floor: dark tiles with a glowing grid, and the POLARIS star in the middle
  w.box(RW, 0.4, RD, M("tiles", { args: [301, [26, 34, 52], [20, 26, 40], 13], repeat: [3, 2], rough: 0.35, metal: 0.4 }), 0, -0.2, 0);
  const grid = new THREE.GridHelper(RW, 26, 0x2a6ad0, 0x16305c); grid.position.y = 0.012; grid.material.transparent = true; grid.material.opacity = 0.5; w.scene.add(grid);
  const star = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.55, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(1.1) })); star.rotation.x = -Math.PI / 2; star.position.y = 0.02; w.scene.add(star);
  // walls, with strips of light
  const wall = M("metal", { args: [303, [40, 48, 66]], repeat: [6, 2], rough: 0.5, metal: 0.5 });
  w.box(RW, RH, 0.5, wall, 0, RH / 2, -RD / 2); w.box(RW, RH, 0.5, wall, 0, RH / 2, RD / 2);
  w.box(0.5, RH, RD, wall, -RW / 2, RH / 2, 0); w.box(0.5, RH, RD, wall, RW / 2, RH / 2, 0);
  w.box(RW, 0.4, RD, M(0x0a0e18, { rough: 0.8 }), 0, RH + 0.2, 0);
  const strip = M(0x7fe3ff, { emissive: 0x7fe3ff, ei: 2.2 });
  for (const z of [-RD / 2 + 0.3, RD / 2 - 0.3]) w.box(RW - 1, 0.08, 0.05, strip, 0, RH - 0.4, z, { collide: false });
  for (const x of [-RW / 2 + 0.3, RW / 2 - 0.3]) w.box(0.05, 0.08, RD - 1, strip, x, RH - 0.4, 0, { collide: false });
  for (const x of [-RW / 2 + 0.3, RW / 2 - 0.3]) w.box(0.05, 0.08, RD - 1, M(0x3a8ad8, { emissive: 0x3a8ad8, ei: 1.2 }), x, 0.3, 0, { collide: false });
  // ceiling lights (kept, so the alarm can turn them red)
  const lights = [];
  for (const [x, z] of [[-6, -4], [6, -4], [-6, 4], [6, 4], [0, 0]]) { w.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24), M(0xdff4ff, { emissive: 0xdff4ff, ei: 1.6 }), x, RH - 0.05, z, { cast: false }); const l = new THREE.PointLight(0xcfe4ff, 7, 16, 1.6); l.position.set(x, RH - 0.8, z); w.scene.add(l); lights.push(l); }
  // the round table and its hologram Earth
  w.cyl(2.4, 2.6, 0.9, M(0x1a2438, { metal: 0.7, rough: 0.3 }), 0, 0.45, 0, { seg: 40 });
  w.cyl(2.45, 2.45, 0.06, M(0x1a3a5a, { emissive: 0x3ab0ff, ei: 0.35 }), 0, 0.92, 0, { seg: 40, collide: false });
  const holo = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), new THREE.MeshBasicMaterial({ map: earthTexture(), color: new THREE.Color(0x9fe0ff).multiplyScalar(1.3), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  holo.position.set(0, 2.6, 0); w.scene.add(holo);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.3, 1.3, 32, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ab0ff), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.set(0, 1.6, 0); w.scene.add(cone);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.03, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd166).multiplyScalar(2.5) })); ring.position.copy(holo.position); w.scene.add(ring);
  w.updaters.push((dt, t) => { holo.rotation.y += dt * 0.25; ring.rotation.set(Math.PI / 2 + Math.sin(t * 0.7) * 0.3, t * 0.5, 0); });
  // the mission board on the north wall, a glowing pad on the floor in front of each file
  const bz = -RD / 2 + 0.28;
  w.box(BW + 0.6, BH + 0.6, 0.2, M("wood", { args: [313, [90, 56, 30]] }), 0, 3.2, bz - 0.05, { collide: false });
  const board = boardTexture();
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: board.tex, emissiveMap: board.tex, emissive: 0xffffff, emissiveIntensity: 0.08, roughness: 0.95 }));
  bm.position.set(0, 3.2, bz + 0.07); bm.userData.dynamic = true; w.scene.add(bm);
  const lamp = new THREE.SpotLight(0xfff0d8, 3, 14, 0.9, 0.6, 1.4); lamp.position.set(0, 5.9, bz + 3.2); lamp.target.position.set(0, 3.2, bz); w.scene.add(lamp); w.scene.add(lamp.target);
  const screens = FILES.map((f, i) => {
    const x = (CARD_U[i] - 0.5) * BW, z = bz + 3;
    const pad = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.3, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(f.accent).multiplyScalar(1.3), transparent: true, opacity: 0.85 })); pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.03, z); pad.userData.dynamic = true; w.scene.add(pad);
    return { f, i, x, z, pad };
  });
  w.updaters.push((dt, t) => { screens.forEach((s, i) => s.pad.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.05)); });
  // the gadget bench on the west wall, the world map on the east wall, a locked door on the south wall
  w.box(1.2, 1, 6, M(0x2a3448, { metal: 0.6, rough: 0.4 }), -RW / 2 + 0.9, 0.5, 2);
  for (let i = 0; i < 5; i++) w.mesh(new THREE.BoxGeometry(0.4, 0.2, 0.6), M([0xffd166, 0x7fe3ff, 0xff9ae8, 0x7bed9f, 0xe8eef4][i], { emissive: [0xffb020, 0x3ab0ff, 0xff5ad8, 0x3aa84a, 0x9ab8d8][i], ei: 0.5 }), -RW / 2 + 0.9, 1.1, 0.6 + i * 1.0, { ry: i * 0.3 });
  const map = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshStandardMaterial({ map: earthTexture(), emissiveMap: earthTexture(), emissive: 0x6a9adf, emissiveIntensity: 0.6, roughness: 0.6 }));
  map.position.set(RW / 2 - 0.27, 3, 0); map.rotation.y = -Math.PI / 2; map.userData.dynamic = true; w.scene.add(map);
  w.box(3, 4.2, 0.3, M(0x2a3040, { metal: 0.7, rough: 0.3 }), 0, 2.1, RD / 2 - 0.3, { collide: false });
  const doorSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: TEX.sign("TOP SECRET", { bg: "#2a0a10", fg: "#ff5a5a", border: "#ff5a5a" }), emissive: 0xff3a3a, emissiveIntensity: 0.5 }));
  doorSign.position.set(0, 4.6, RD / 2 - 0.47); doorSign.rotation.y = Math.PI; doorSign.userData.dynamic = true; w.scene.add(doorSign);
  const terminal = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshStandardMaterial({ map: panelTex(["> POLARIS NETWORK", "> 3 MISSION FILES", "> AGENT: RORY", "> TEA: READY"], "#7bed9f"), emissive: 0xffffff, emissiveIntensity: 0.5, emissiveMap: panelTex(["> POLARIS NETWORK", "> 3 MISSION FILES", "> AGENT: RORY", "> TEA: READY"], "#7bed9f") }));
  terminal.position.set(-RW / 2 + 0.28, 2.3, 2.5); terminal.rotation.y = Math.PI / 2; terminal.userData.dynamic = true; w.scene.add(terminal);
  const posters = buildPosters(w, RW, RD);
  const tea = teaTrolley(w, 9.4, 6.6);
  const button = bigRedButton(w, -9.4, 6.6);
  const chair = officeChair(w, -8.6, -2.4);
  const cat = officeCat(w, 10.6, -6.6);
  const phone = bananaPhone(w, -RW / 2 + 0.9, 1.0, -0.4);
  w.floorY = -10;
  return { screens, board, posters, lights, tea, button, chair, cat, phone, spawn: [0, 0, 6.5], yaw: Math.PI, frost: [3.4, 0, -1.2, -0.9], pip: [-RW / 2 + 2.2, 0, 3.2, Math.PI / 2] };
}
function panelTex(lines, color) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 320; const g = c.getContext("2d");
  g.fillStyle = "#06101e"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = color; g.lineWidth = 3; g.strokeRect(8, 8, 496, 304);
  g.fillStyle = color; g.font = "800 26px ui-monospace, monospace";
  lines.forEach((l, i) => g.fillText(l, 28, 56 + i * 38));
  return canvasTex(c);
}

// ------------------------------------------------------------ things to do in the room
// each: where it is, how close Rory must be, the button's label and what it does
function things() {
  const R = G.room, busy = G.spin || G.alarm > 0;
  return [
    { id: "tea", x: 9.4, z: 5.6, r: 1.6, label: G.cup ? "BISCUIT" : "TEA", prompt: G.cup ? "have a biscuit" : "make a cup of tea", act: G.cup ? biscuit : makeTea, off: !!G.pouring },
    { id: "button", x: -9.4, z: 5.9, r: 1.5, label: "PRESS", prompt: "the big red button", act: pressButton, off: busy },
    { id: "chair", x: R.chair.seat.x, z: R.chair.seat.z, r: 1.3, label: "SPIN", prompt: "have a spin on the chair", act: spinChair, off: busy },
    { id: "cat", x: 10.6, z: -5.9, r: 1.5, label: "PAT", prompt: "pat Agent Whiskers", act: patCat },
    { id: "photo", x: 11.2, z: 7.3, r: 1.6, label: "LOOK", prompt: "the team photo", act: lookAtPhoto },
    { id: "phone", x: -11.0, z: -0.4, r: 1.5, label: G.ringing ? "ANSWER" : "PHONE", prompt: G.ringing ? "answer the banana phone!" : "the banana phone", act: phone },
  ].filter(t => !t.off);
}
function makeTea() {
  const R = G.room;
  G.pouring = 1.4; Audio.play("pour");
  const n = count("roryhq.tea");
  setTimeout(() => {
    const cup = new THREE.Group();
    const china = M(0xf4f2ee, { rough: 0.25 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.08, 14), china); cup.add(c);
    const t = new THREE.Mesh(new THREE.CircleGeometry(0.048, 14), M(0x8a5a2a, { rough: 0.3 })); t.rotation.x = -Math.PI / 2; t.position.y = 0.035; cup.add(t);
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12), china); h.position.x = 0.06; cup.add(h);
    cup.position.set(0, -0.1, 0.05);
    G.player.rig.handR.add(cup);
    G.cup = { m: cup, t: 0, sipAt: 1 };
    toast(`☕ Cup of tea number ${n}`, 2.2);
    const lines = n === 1 ? [["frost", "Ah. A proper cup of tea. Splendid work, Agent Rory."], ["bolt", "I would like a cup of tea. I cannot drink tea. I will hold one, for the look of it."]]
      : n % 5 === 0 ? [["pip", `That's ${n} cups of tea, Rory. You're going to float away yourself.`]]
      : Math.random() < 0.35 ? [pick([["frost", "Milk, no sugar. The POLARIS way."], ["bolt", "Tea temperature: perfect. I checked with my finger. I do not have fingers."], ["pip", "Save me a biscuit!"]])] : null;
    if (lines) G.dialogue.show(lines, null);
  }, 1300);
}
function biscuit() {
  const p = G.player.pos, n = count("roryhq.biscuit");
  Audio.play("pop"); G.fx.burst(p.x, p.y + 1.2, p.z, 0xc8904a, 16, { speed: 1.5, up: 0.5, life: 0.6, size: 0.3, gravity: -6 });
  toast(`🍪 Biscuit number ${n}. Crumbs everywhere.`, 2.2);
  if (n === 1 || Math.random() < 0.3) G.dialogue.show([pick([["bolt", "Crumbs detected. Deploying broom. I do not have a broom."], ["pip", "Did you dunk it? You have to dunk it."], ["frost", "One biscuit, Agent Rory. Well. Two."]])], null);
}
function pressButton() {
  const R = G.room, n = count("roryhq.button");
  R.button.btn.scale.y = 0.4; setTimeout(() => { R.button.btn.scale.y = 1; }, 250);
  G.alarm = 3; Audio.play("alarm"); setTimeout(() => Audio.play("alarm"), 900); setTimeout(() => Audio.play("alarm"), 1800);
  G.bolt.play("Dance"); G.boltDance = 3.2;
  for (let i = 0; i < 6; i++) setTimeout(() => { if (G.fx) G.fx.burst(-8 + Math.random() * 16, 5.5, -6 + Math.random() * 12, [0xff3a6a, 0xffd23f, 0x3ad0ff, 0x7bed9f, 0xff9ae8][i % 5], 40, { speed: 5, life: 2, gravity: -4, size: 0.5 }); }, i * 250);
  const lines = n === 1
    ? [["frost", "Agent Rory. What does the sign say?"], ["rory", "Do not press."], ["frost", "And what did you do?"], ["rory", "...I pressed it."], ["bolt", "Alarm test successful. Everyone is now very awake."]]
    : [pick([["pip", "In fairness, it is a very pressable button."], ["frost", "That button is for emergencies, Agent Rory. Is this an emergency?"], ["bolt", "Weee-oooo. Weee-oooo. That is my alarm impression."], ["frost", `That's ${n} times now. I'm having a smaller button made.`], ["pip", "I've wired it to the confetti cannon. You're welcome."]])];
  setTimeout(() => G.dialogue.show(lines, null), 2600);
}
function spinChair() {
  const R = G.room, s = R.chair.seat;
  G.player.teleport(s.x, s.y, s.z, G.player.yaw); G.player.frozen = true;
  G.spin = { t: 0, dur: 3.2 }; Audio.play("whoosh"); toast("Wheeeeee!", 2);
  count("roryhq.spins");
}
function patCat() {
  const c = G.room.cat, n = count("roryhq.cat");
  c.purr = 2.5; Audio.play("purr");
  G.fx.burst(10.6, 0.8, -6.6, 0xff6ab8, 12, { speed: 1.2, up: 1.5, life: 1.2, gravity: 0.5, size: 0.4 });
  if (n === 1) G.dialogue.show([["pip", "That's Agent Whiskers. She's been at POLARIS longer than any of us."], ["bolt", "She outranks me."]], null);
  else if (Math.random() < 0.4) { c.meow = 0.8; setTimeout(() => Audio.play("meow"), 300); if (Math.random() < 0.5) G.dialogue.show([pick([["bolt", "The cat says: meow. I have translated it. It means: more patting."], ["frost", "Agent Whiskers has never lost a file. Or found one."], ["pip", "She sat on the self-destruct button once. Luckily it's also the kettle."]])], null); }
}
function lookAtPhoto() {
  const n = count("roryhq.photo");
  G.open = true; Audio.play("click");
  const el = screen("photo", `<div class="card hqphoto"><img src="agents.jpg" alt="Our agents"><div class="plaque">OUR AGENTS</div><div class="row"><button class="btn ghost" data-a="close">BACK</button></div></div>`, "screen dim");
  onTap(el, "[data-a]", () => { clearLayer("photo"); G.open = false; });
  G.dialogue.show(n === 1 ? [["frost", "Our agents. The finest POLARIS has ever had."], ["pip", "Look at those smiles. That's the face of a team that's just saved the world."], ["bolt", "I am not in this photo. I was charging."]]
    : [pick([["frost", "The best team I've ever had. Don't tell the others."], ["bolt", "I have zoomed in. Everyone is smiling. Mission status: happy."], ["pip", "One day I'll build a camera that floats. For group photos."]])], null);
}
const CALLS = [
  [["rory", "Hello, POLARIS, Agent Rory speaking."], ["zero", "Agent Rory! It is I, Professor Zero! Is your fridge running?"], ["rory", "Er... yes?"], ["zero", "Then you'd better go and catch it! Mwa ha ha ha!"], ["bolt", "He has been practising that joke for a week."]],
  [["rory", "Hello?"], ["pip", "It's Pip! I'm in the next room. I just wanted to see if the banana works."], ["rory", "It works."], ["pip", "Brilliant! Bye!"]],
  [["rory", "Hello?"], ["frost", "Agent Rory, this is Admiral Frost. I am standing right behind you."], ["rory", "..."], ["frost", "Carry on."]],
  [["rory", "Hello?"], ["THE MOON", "Hello. This is the Moon. We would like our rocks back, please."], ["rory", "Which rocks?"], ["THE MOON", "You know which rocks."]],
  [["rory", "Hello?"], ["bolt", "Hello, Rory. This is BOLT. I am calling you from over here. Look. I am waving."]],
  [["rory", "POLARIS, Agent Rory."], ["zero", "Rory! Quick question. How do you get a floating shoe down from the ceiling?"], ["rory", "Turn the gravity back on?"], ["zero", "...Hmm. Good point. Goodbye!"]],
];
function phone() {
  if (G.ringing) { G.ringing = 0; G.phoneAt = G.t + 60 + Math.random() * 40; Audio.play("click"); G.callN = (G.callN ?? Math.floor(Math.random() * CALLS.length)) + 1; G.dialogue.show(CALLS[G.callN % CALLS.length], null); }
  else G.dialogue.show([pick([["bolt", "It is a banana. It only rings when it wants to."], ["pip", "It's a phone. It's also a banana. Don't eat it."], ["rory", "Hello? ...Nobody there. Just a lot of monkeys."]])], null);
}

// ------------------------------------------------------------ boot and the loop
async function boot() {
  const bar = document.querySelector(".boot-bar i"); const prog = f => { bar.style.width = Math.round(f * 100) + "%"; };
  prog(0.1);
  const engine = G.engine = new Engine(document.getElementById("view"));
  prog(0.3); await initPhysics(); prog(0.6); await loadRobot("../agent-rory-zero-gravity/models/robot.glb"); prog(0.85);
  const phys = G.phys = new Physics(-20), w = G.world = new World(engine, phys);
  const room = G.room = buildRoom(w);
  w.bake();
  engine.setScene(w.scene);
  G.fx = w.fx = new FX(w.scene);
  G.input = new Input(engine.canvas);
  const [x, y, z] = room.spawn;
  G.player = new Player(w, x, y, z, room.yaw);
  G.player.camDist = 4.6;
  G.bolt = new Robot("bolt", 1.0); G.bolt.root.position.set(x + 1.6, 0, z + 0.5); w.scene.add(G.bolt.root);
  G.people = {};
  for (const who of ["frost", "pip"]) { const at = room[who]; const rig = makePerson(CHARS[who].look); rig.root.position.set(at[0], at[1], at[2]); rig.root.rotation.y = at[3]; w.scene.add(rig.root); phys.fixedCyl(at[0], 0.8, at[2], 0.35, 0.8); G.people[who] = rig; }
  Speech.init(); Speech.enabled = localStorage.getItem("rory20.voice") !== "false";
  G.portraits = new Portraits(engine.renderer, CHARS);
  paintFaces(room.posters);
  G.dialogue = new Dialogue(CHARS, G.portraits, Speech);
  G.dialogue.onLine = who => { G.talking = who; };
  G.hud = new HUD(); G.hud.show({ onPause: () => { location.href = "list.html"; } });
  document.querySelector('[data-layer="hud"] .pause').textContent = "LIST";
  document.querySelectorAll('[data-layer="hud"] .cells').forEach(e => e.remove());
  G.hud.set({ label: "AGENT RORY HQ", text: "Pick a mission off the board", progress: null });
  buildTouch();
  G.phoneAt = 25 + Math.random() * 20;
  prog(1);
  setTimeout(() => document.getElementById("boot").classList.add("gone"), 250);
  G.state = "room";
  const first = !localStorage.getItem("roryhq.visited");
  try { localStorage.setItem("roryhq.visited", "1"); } catch (e) { /* private mode */ }
  setTimeout(() => {
    G.dialogue.show(first
      ? [["frost", "Welcome to POLARIS headquarters, Agent Rory."], ["frost", "Your mission files are on the board. Walk up to one and open it."], ["pip", "And there's tea on the trolley. Don't press the red button."], ["bolt", "I am BOLT. I also work here now. I sweep the floor. With my feet."]]
      : [["frost", pick(["Welcome back, Agent Rory. Which mission today?", "Agent Rory. The files are on the board, as always.", "Good to see you, Agent Rory. Pick a file. Or have a cup of tea first."])]], null);
  }, 900);
  let last = performance.now();
  const frame = now => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; try { tick(dt); } catch (e) { console.error(e); } requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}

function nearest() {
  const p = G.player.pos;
  let best = null, bd = Infinity;
  const consider = (d, r, n) => { if (d < r && d < bd) { bd = d; best = n; } };
  for (const s of G.room.screens) consider(Math.hypot(p.x - s.x, p.z - s.z), 1.7, { kind: "file", s });
  for (const [who, rig] of Object.entries(G.people)) consider(rig.root.position.distanceTo(p), 2.2, { kind: "talk", who });
  for (const t of things()) consider(Math.hypot(p.x - t.x, p.z - t.z), t.r, { kind: "thing", t });
  return best;
}
function tick(dt) {
  G.t += dt;
  const w = G.world, R = G.room;
  if (G.state === "room") {
    G.input.poll();
    const busy = G.dialogue.active || G.open;
    if (busy) { G.input.mx = 0; G.input.my = 0; G.input.jumpPressed = false; }
    G.player.talking = G.talking === "rory";
    G.player.update(dt, G.input, G.engine.camera);
    updateBolt(dt);
    for (const [who, rig] of Object.entries(G.people)) { animatePerson(rig, { dt, speed: 0, grounded: true, talk: G.talking === who }); const c = rig.root.position, want = Math.atan2(G.player.pos.x - c.x, G.player.pos.z - c.z); let d = want - rig.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); rig.root.rotation.y += d * Math.min(1, dt * 2); }
    updateRoom(dt);
    const n = busy || G.spin ? null : nearest();
    const label = n ? (n.kind === "file" ? "OPEN" : n.kind === "talk" ? "TALK" : n.t.label) : null;
    const key = G.input.touchUI ? `Tap ${label}` : "Press E";
    G.hud.prompt(n ? (n.kind === "file" ? `${key}: ${n.s.f.title}` : n.kind === "talk" ? `${key} to talk` : `${key}: ${n.t.prompt}`) : null);
    showAction(label);
    if (G.input.takeAction() && n) { if (n.kind === "file") openFile(n.s); else if (n.kind === "talk") talk(n.who); else n.t.act(); }
    R.board.highlight(n && n.kind === "file" ? n.s.i : -1);
  }
  w.update(dt); G.phys.step(dt); G.fx.update(dt);
  drawTouch();
  G.engine.render();
}
// everything in the room that moves on its own
function updateRoom(dt) {
  const R = G.room, t = G.t, p = G.player;
  // tea: the pot tips to pour, then Rory holds the cup and sips now and then
  if (G.pouring > 0) {
    G.pouring -= dt; R.tea.pot.rotation.z = -Math.sin(Math.min(1, (1.4 - G.pouring) / 0.4) * Math.PI / 2) * 0.7 * (G.pouring > 0.3 ? 1 : G.pouring / 0.3);
    if (Math.random() < dt * 12) G.fx.puff(R.tea.spout.x, R.tea.spout.y, R.tea.spout.z, 0xf0f0f0, 2);
    if (G.pouring <= 0) { G.pouring = 0; R.tea.pot.rotation.z = 0; }
  }
  if (G.cup) {
    const c = G.cup; c.t += dt;
    const sip = c.t > c.sipAt && c.t < c.sipAt + 0.9;
    if (c.t > c.sipAt + 0.9) { c.sipAt = c.t + 2.5 + Math.random() * 2; }
    if (sip && Math.abs(c.t - c.sipAt - 0.45) < dt) Audio.play("slurp");
    const rig = p.rig; rig.armR.rotation.x = sip ? -2.2 : -0.9; rig.armR.rotation.z = 0.15; rig.elbowR.rotation.x = sip ? -1.1 : -0.8;
    if (Math.random() < dt * 3) { const q = new THREE.Vector3(); c.m.getWorldPosition(q); G.fx.puff(q.x, q.y + 0.08, q.z, 0xffffff, 1); }
    if (c.t > 24) { c.m.parent.remove(c.m); G.cup = null; }
  }
  // the chair spin: fast, then slowing down, then a little dizzy
  if (G.spin) {
    const s = G.spin; s.t += dt;
    const w = 13 * Math.sin(Math.min(1, s.t / s.dur) * Math.PI);
    R.chair.top.rotation.y += w * dt; p.yaw += w * dt;
    p.teleport(R.chair.seat.x, R.chair.seat.y, R.chair.seat.z, p.yaw); p.obj.rotation.y = p.yaw;
    animatePerson(p.rig, { dt: 0.3, speed: 0, grounded: true, sit: true }); // a big step, so the sitting pose wins outright
    if (s.t > s.dur) { G.spin = null; p.frozen = false; p.teleport(R.chair.seat.x + 0.8, 0, R.chair.seat.z + 0.6, p.yaw); G.dizzy = 2.5; if (Math.random() < 0.5) G.dialogue.show([pick([["rory", "Whoa. The room is still spinning."], ["bolt", "Rory is now facing every direction at once."], ["pip", "Again! Do it again!"]])], null); }
  }
  if (G.dizzy > 0) {
    G.dizzy -= dt;
    if (!G.stars) { G.stars = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd23f).multiplyScalar(2.5) })); G.world.scene.add(m); return m; }); }
    G.stars.forEach((m, i) => { const a = t * 6 + i * 2.1; m.position.set(p.pos.x + Math.cos(a) * 0.35, p.pos.y + 1.55, p.pos.z + Math.sin(a) * 0.35); m.rotation.y = a; m.visible = G.dizzy > 0; });
  }
  // the alarm: every light pulses red while it lasts
  if (G.alarm > 0) {
    G.alarm -= dt; const on = G.alarm > 0, k = (Math.sin(t * 14) + 1) / 2;
    for (const l of R.lights) l.color.setRGB(on ? 1 : 0.81, on ? 0.12 + 0.2 * k : 0.89, on ? 0.12 : 1);
  }
  if (G.boltDance > 0) { G.boltDance -= dt; }
  // Agent Whiskers breathes, flicks her tail, and purrs with her eyes shut
  const cat = R.cat;
  cat.body.scale.y = 0.8 + Math.sin(t * 2.2) * 0.03;
  cat.tail.rotation.y = Math.sin(t * (cat.purr > 0 ? 6 : 1.3)) * 0.5;
  const toRory = Math.atan2(p.pos.x - 10.6, p.pos.z + 6.6); cat.head.rotation.y += (Math.max(-0.8, Math.min(0.8, toRory)) - cat.head.rotation.y) * Math.min(1, dt * 2);
  cat.eyes.forEach(e => { e.scale.y = cat.purr > 0 ? 0.15 : 1; });
  if (cat.purr > 0) { cat.purr -= dt; if (Math.random() < dt * 4) Audio.play("purr"); }
  if (cat.meow > 0) { cat.meow -= dt; cat.head.rotation.x = -0.3; } else cat.head.rotation.x *= 0.9;
  // the banana phone rings now and then
  if (!G.ringing && G.t > G.phoneAt && !G.dialogue.active && !G.open) { G.ringing = 8; G.ringN = 0; toast("☎ The banana phone is ringing!", 3); }
  if (G.ringing > 0) {
    G.ringing -= dt; R.phone.g.rotation.z = Math.sin(t * 40) * 0.08; R.phone.g.position.y = 1.0 + Math.abs(Math.sin(t * 20)) * 0.03;
    if (Math.floor(G.ringing / 1.2) !== G.ringN) { G.ringN = Math.floor(G.ringing / 1.2); Audio.play("ring"); }
    if (G.ringing <= 0) { G.ringing = 0; G.phoneAt = G.t + 40 + Math.random() * 40; }
  } else { R.phone.g.rotation.z = 0; R.phone.g.position.y = 1.0; }
}
function updateBolt(dt) {
  const b = G.bolt, p = G.player;
  if (G.boltDance > 0) { b.play("Dance"); b.update(dt); return; }
  const tx = p.pos.x - Math.sin(p.yaw) * 1.3 + Math.cos(p.yaw) * 1.4, tz = p.pos.z - Math.cos(p.yaw) * 1.3 - Math.sin(p.yaw) * 1.4;
  const d = Math.hypot(tx - b.pos.x, tz - b.pos.z), speed = G.spin ? 0 : d > 4 ? 6 : d > 1 ? 3 : 0;
  if (speed) b.walkTo(tx, tz, speed, dt); else { let r = Math.atan2(p.pos.x - b.pos.x, p.pos.z - b.pos.z) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 3); }
  b.play(speed > 4 ? "Running" : speed ? "Walking" : G.talking === "bolt" ? "Yes" : "Idle");
  b.update(dt);
}
function talk(who) {
  const lines = who === "frost"
    ? [["frost", pick(["Three mission files, Agent Rory. Each one a different adventure.", "Operation Eclipse was your first. Meltdown was your biggest. Zero Gravity goes to the Moon.", "The board shows how far you've got. Stars and all.", "Have you tried the tea? Pip makes it far too strong."])]]
    : [["pip", pick(["I built BOLT on this bench. He was supposed to be a toaster.", "The gadgets here are all mine. The banana is also a phone. Don't ask.", "My favourite is Zero Gravity. You get a jetpack!", "Whatever you do, don't press the big red button. Unless you want to. It's quite fun."])]];
  G.dialogue.show(lines, null);
}
function openFile(s) {
  const f = s.f, p = progress(f);
  G.open = true; Audio.play("beep");
  Speech.say(f.frost, CHARS.frost.voice);
  const el = screen("file", `<div class="card hqfile" style="--accent:${f.accent}">
      <div class="hqpic" style="background-image:url('${f.shot}')"><span>${f.n}</span></div>
      <div class="kick">${f.kicker}</div><div class="ttl">${f.title}</div>
      <div class="blurb">${f.blurb}</div>
      <div class="meter"><span class="bar"><i style="width:${p.done / f.total * 100}%"></i></span><b>${p.done} / ${f.total}</b>${p.stars ? `<em>★ ${p.stars}</em>` : ""}</div>
      <div class="row"><button class="btn gold" data-a="play">${p.done && !p.finished ? "CONTINUE ▶" : "PLAY ▶"}</button><button class="btn ghost" data-a="close">BACK</button></div></div>`, "screen dim");
  onTap(el, "[data-a]", b => {
    if (b.dataset.a === "close") { clearLayer("file"); G.open = false; Speech.stop(); return; }
    Audio.play("win");
    screen("flash", `<div class="granted">ACCESS GRANTED<small>LOADING ${f.title.toUpperCase()}</small></div>`, "screen");
    setTimeout(() => { location.href = f.href; }, 900);
  });
}

// ------------------------------------------------------------ touch controls
function buildTouch() {
  const ui = document.getElementById("ui");
  const mk = (cls, txt, x, y) => { const b = document.createElement("div"); b.className = "pad-btn " + cls; b.textContent = txt; b.style.right = x + "px"; b.style.bottom = y + "px"; ui.appendChild(b); return b; };
  const jump = G.jumpBtn = mk("", "JUMP", 22, 30);
  const act = G.actBtn = mk("action hidden", "OPEN", 124, 52);
  const hold = (el, down, up) => { el.addEventListener("pointerdown", e => { e.stopPropagation(); el.classList.add("on"); down(); }); const off = () => { el.classList.remove("on"); if (up) up(); }; el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("pointerleave", off); };
  hold(jump, () => { G.input.jumpPressed = true; G.input.jumpHeld = true; }, () => { G.input.jumpHeld = false; });
  hold(act, () => { G.input.actionPressed = true; });
  if (!G.input.touchUI) jump.style.display = "none";
  const st = G.stickEl = document.createElement("div"); st.className = "stick"; st.innerHTML = "<i></i>"; st.style.display = "none"; ui.appendChild(st);
  G.engine.canvas.addEventListener("pointerdown", () => { if (G.dialogue.active) G.dialogue.tap(); });
  addEventListener("keydown", e => { if (G.dialogue.active && (e.code === "Space" || e.code === "Enter")) { G.dialogue.tap(); G.input.clear(); } if (e.code === "Escape" && G.open) { clearLayer("file"); clearLayer("photo"); G.open = false; } });
  const unlock = () => { Audio.start(); Speech.unlock(); };
  addEventListener("touchend", unlock, { passive: true }); addEventListener("click", unlock); addEventListener("keydown", unlock);
  Audio.mood("calm");
}
function showAction(label) {
  if (!label || !G.input.touchUI) { G.actBtn.classList.add("hidden"); return; }
  G.actBtn.classList.remove("hidden"); if (G.actBtn.textContent !== label) G.actBtn.textContent = label;
}
function drawTouch() {
  const s = G.input.stick, el = G.stickEl;
  if (!s) { el.style.display = "none"; return; }
  el.style.display = "block"; el.style.left = s.x0 + "px"; el.style.top = s.y0 + "px";
  el.firstChild.style.transform = `translate(${Math.max(-60, Math.min(60, s.x - s.x0))}px, ${Math.max(-60, Math.min(60, s.y - s.y0))}px)`;
}

G.debug = {
  files: () => G.room.screens.map(s => ({ id: s.f.id, x: s.x, z: s.z })),
  goTo(id) { const s = G.room.screens.find(q => q.f.id === id); G.player.teleport(s.x, 0, s.z, Math.PI); return !!s; },
  near: () => { const n = nearest(); return n ? (n.kind === "file" ? n.s.f.id : n.kind === "talk" ? n.who : n.t.id) : null; },
  skip() { if (G.dialogue.active) G.dialogue.skipAll(); },
  progress: id => progress(FILES.find(f => f.id === id)),
  things: () => things().map(t => ({ id: t.id, x: t.x, z: t.z, label: t.label })),
  goToThing(id) { const t = things().find(q => q.id === id); if (!t) return false; G.player.teleport(t.x, 0, t.z + (t.z > 0 ? -0.2 : 0.2), G.player.yaw); return true; },
  ring() { G.phoneAt = 0; },
};

// the 3D room needs WebGL; without it, go straight to the list
try { const c = document.createElement("canvas"); if (!(c.getContext("webgl2") || c.getContext("webgl"))) throw new Error("no webgl"); boot().catch(e => { console.error(e); location.replace("list.html"); }); }
catch (e) { location.replace("list.html"); }
