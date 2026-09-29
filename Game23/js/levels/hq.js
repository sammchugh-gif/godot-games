// POLARIS HQ, today: the Time Room, where the story starts. Admiral Frost briefs Rory in front of
// the history wall (screens of the great moments, flickering out one by one), Pip's tea has turned
// back into leaves, the big clock on the wall runs backwards, and in the middle of the room the
// time-sled waits on its launch ring under a hatch in the roof. Rory collects the Chrono-watch from
// Dr Flint's bench, gets on the sled, and it goes up through the roof and into the time tunnel.
// Not an era: no missions and no golden ammonites. The level hands main.js its camera shots for
// the talking (shots), what happens on a line (cues), and the launch (launch).
import * as THREE from "three";
import { M, TEX } from "../tex.js";
import { timeSled } from "./timekit.js";

const RW = 24, RD = 24, RH = 8;           // the room: x and z from -12 to 12, the roof 8 m up
const PAD = [0, -1.5];                     // the launch ring, under the hatch
const HATCH = 7;                           // the hatch in the roof: a square this wide
const BENCH = [-RW / 2 + 0.9, 1];          // Dr Flint's bench, along the west wall
const DESK = [RW / 2 - 1.1, 3.4];          // Pip's desk, along the east wall
const CUP = [DESK[0] - 0.55, 0.86, DESK[1] - 1.0];
const CLOCK = [RW / 2 - 0.26, 4.8, -4.4];  // the big clock, high on the east wall
const DOG = [8.4, 8.2];

const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
// a screen that glows: the picture is its own light
const glowMat = (t, k = 0.9) => new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: k, roughness: 0.4 });

// one of the great moments on the history wall: a picture, what it is, when, and MISSING across it
function momentTex(emoji, name, when) {
  const c = canvas(512, 320), g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, 320); bg.addColorStop(0, "#0e2a52"); bg.addColorStop(1, "#06142a"); g.fillStyle = bg; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#7fe3ff"; g.lineWidth = 6; g.strokeRect(8, 8, 496, 304);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "150px system-ui, 'Noto Color Emoji', sans-serif"; g.globalAlpha = 0.85; g.fillText(emoji, 256, 138); g.globalAlpha = 1;
  g.fillStyle = "#e8f6ff"; g.font = "800 34px system-ui, sans-serif"; g.fillText(name, 256, 250);
  g.fillStyle = "#7fe3ff"; g.font = "700 26px system-ui, sans-serif"; g.fillText(when, 256, 288);
  g.save(); g.translate(256, 134); g.rotate(-0.18);
  g.strokeStyle = "#ff4a5a"; g.lineWidth = 8; g.strokeRect(-170, -42, 340, 84);
  g.fillStyle = "#ff4a5a"; g.font = "900 62px system-ui, sans-serif"; g.fillText("MISSING", 0, 4); g.restore();
  return tex(c);
}
// the big screen in the middle: who's doing it
function hourglassTex() {
  const c = canvas(768, 460), g = c.getContext("2d");
  g.fillStyle = "#1a0a24"; g.fillRect(0, 0, 768, 460);
  g.strokeStyle = "#e8c070"; g.lineWidth = 8; g.strokeRect(10, 10, 748, 440);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#ffd166"; g.font = "900 40px system-ui, sans-serif"; g.fillText("WANTED", 384, 58);
  // an hourglass, drawn: two glass cones, sand running through
  g.save(); g.translate(384, 214);
  g.fillStyle = "#e8c070"; g.fillRect(-80, -120, 160, 16); g.fillRect(-80, 104, 160, 16);
  g.fillStyle = "rgba(200,230,255,.25)"; g.strokeStyle = "#cfe8ff"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(-64, -104); g.lineTo(64, -104); g.lineTo(8, 0); g.lineTo(64, 104); g.lineTo(-64, 104); g.lineTo(-8, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#f0c060"; g.beginPath(); g.moveTo(-36, -60); g.lineTo(36, -60); g.lineTo(4, -4); g.lineTo(-4, -4); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-60, 102); g.lineTo(60, 102); g.lineTo(0, 50); g.closePath(); g.fill(); g.fillRect(-2, -4, 4, 56);
  g.restore();
  g.fillStyle = "#ffffff"; g.font = "900 46px system-ui, sans-serif"; g.fillText("DOCTOR HOURGLASS", 384, 372);
  g.fillStyle = "#ff9ae8"; g.font = "italic 800 30px system-ui, sans-serif"; g.fillText("“Why wait?”", 384, 416);
  return tex(c);
}
// the blackboard over Dr Flint's bench
function chalkTex() {
  const c = canvas(640, 360), g = c.getContext("2d");
  g.fillStyle = "#23352a"; g.fillRect(0, 0, 640, 360);
  g.strokeStyle = "#8a6a3a"; g.lineWidth = 18; g.strokeRect(0, 0, 640, 360);
  g.fillStyle = "rgba(240,240,230,.9)"; g.font = "600 34px 'Comic Sans MS', 'Chalkboard', cursive, sans-serif";
  g.fillText("t → t − 66,000,000 yrs", 40, 70);
  g.fillText("sled: ✓   watch: ✓   tea: ???", 40, 130);
  g.fillText("GOOD THINGS TAKE TIME", 40, 300);
  g.strokeStyle = "rgba(240,240,230,.8)"; g.lineWidth = 4;
  g.beginPath(); g.arc(480, 205, 50, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(480, 205); g.lineTo(480, 170); g.moveTo(480, 205); g.lineTo(505, 215); g.stroke();
  g.beginPath(); g.moveTo(560, 175); g.quadraticCurveTo(610, 150, 600, 205); g.stroke();
  return tex(c);
}
// Pip's screens
function panelTex(lines, color) {
  const c = canvas(512, 320), g = c.getContext("2d");
  g.fillStyle = "#06101e"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = color; g.lineWidth = 3; g.strokeRect(8, 8, 496, 304);
  g.fillStyle = color; g.font = "800 26px ui-monospace, monospace";
  lines.forEach((l, i) => g.fillText(l, 28, 56 + i * 38));
  return tex(c);
}
function clockTex() {
  const c = canvas(512, 512), g = c.getContext("2d");
  g.fillStyle = "#f4f0e4"; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#1a2440"; g.lineWidth = 16; g.stroke();
  g.fillStyle = "#1a2440"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 58px system-ui, sans-serif";
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), 256 + Math.sin(a) * 192, 256 - Math.cos(a) * 192); }
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r0 = i % 5 ? 232 : 222; g.fillRect(256 + Math.sin(a) * r0 - 2, 256 - Math.cos(a) * r0 - 2, 4, 4); }
  g.fillStyle = "#c83a4a"; g.font = "800 26px system-ui, sans-serif"; g.fillText("POLARIS", 256, 330);
  return tex(c);
}

// Agent Biscuit, the office dog (the same dog as in the HQ room), in his bed
function officeDog(w, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -2.4; g.userData.dynamic = true; w.scene.add(g);
  const fur = M(0xd9a05b, { rough: 0.9 }), cream = M(0xf4e4c8, { rough: 0.9 }), ear = M(0xa8703a, { rough: 0.9 }), dark = M(0x1a1410, { rough: 0.3 }), bed = M(0x2a6ad8, { rough: 0.9 });
  const add = (geo, m, px, py, pz, parent = g) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; parent.add(me); return me; };
  add(new THREE.CylinderGeometry(0.5, 0.52, 0.12, 24), bed, 0, 0.06, 0);
  add(new THREE.TorusGeometry(0.48, 0.07, 10, 28), bed, 0, 0.14, 0).rotation.x = Math.PI / 2;
  const body = add(new THREE.SphereGeometry(0.2, 18, 14), fur, 0, 0.3, -0.06); body.scale.set(1, 1.15, 1.1); body.rotation.x = -0.35;
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.11, 12, 10), fur, s * 0.13, 0.2, -0.12).scale.set(0.9, 0.8, 1.3);
  add(new THREE.SphereGeometry(0.12, 12, 10), cream, 0, 0.36, 0.08).scale.set(1, 1.2, 0.8);
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.035, 0.04, 0.26, 8), fur, s * 0.08, 0.26, 0.1); add(new THREE.SphereGeometry(0.045, 8, 6), cream, s * 0.08, 0.14, 0.13).scale.set(1, 0.6, 1.4); }
  add(new THREE.TorusGeometry(0.1, 0.018, 8, 20), M(0xd82a2a, { rough: 0.5 }), 0, 0.47, 0.02).rotation.x = Math.PI / 2 + 0.3;
  const head = new THREE.Group(); head.position.set(0, 0.56, 0.04); g.add(head);
  add(new THREE.SphereGeometry(0.12, 16, 12), fur, 0, 0, 0, head);
  add(new THREE.SphereGeometry(0.07, 12, 10), cream, 0, -0.035, 0.1, head).scale.set(1, 0.8, 1.2);
  add(new THREE.SphereGeometry(0.025, 8, 6), dark, 0, -0.01, 0.18, head);
  for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.set(s * 0.1, 0.05, -0.01); e.rotation.z = s * 0.15; head.add(e); add(new THREE.SphereGeometry(0.05, 10, 8), ear, 0, -0.06, 0, e).scale.set(0.45, 1.3, 0.9); }
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.02, 8, 6), dark, s * 0.05, 0.035, 0.1, head);
  const tail = new THREE.Group(); tail.position.set(0, 0.2, -0.3); g.add(tail);
  for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.035 - i * 0.003, 8, 6), fur, 0, 0.02 + i * 0.035, -i * 0.03, tail);
  w.phys.fixedCyl(x, 0.3, z, 0.5, 0.3);
  const dog = { g, head, tail, wag: 0, pos: new THREE.Vector3(x, 0, z) };
  w.updaters.push((dt, t) => {
    dog.wag = Math.max(0, dog.wag - dt);
    tail.rotation.y = Math.sin(t * (dog.wag > 0 ? 22 : 3)) * (dog.wag > 0 ? 0.7 : 0.15);
    head.rotation.z = dog.wag > 0 ? Math.sin(t * 5) * 0.2 : Math.sin(t * 0.7) * 0.05;
  });
  return dog;
}

export function buildHQ(w) {
  // indoors, at night: the moon is straight overhead, so when the hatch opens it shines down the
  // hole onto the sled; the room's own lights do the rest
  w.setSky({ top: "#02040e", mid: "#0a1638", bottom: "#141c34", sun: [78, 200], sunColor: "#b8ccff", sunI: 0.55, hemi: ["#8ab4ff", "#141820", 0.4], fog: null, clouds: 0, stars: 1200, moon: true });
  w.scene.userData.envI = 0.45;
  w.noPebble = true;
  w.floorY = -10;
  // the floor: dark tiles with a glowing grid
  w.box(RW, 0.4, RD, M("tiles", { args: [301, [26, 34, 52], [20, 26, 40], 13], repeat: [3, 3], rough: 0.35, metal: 0.4 }), 0, -0.2, 0);
  const grid = new THREE.GridHelper(RW, 24, 0x2a6ad0, 0x16305c); grid.position.y = 0.012; grid.material.transparent = true; grid.material.opacity = 0.45; w.scene.add(grid);
  // the walls, with strips of light along the top and the bottom
  const wall = M("metal", { args: [303, [40, 48, 66]], repeat: [6, 2], rough: 0.5, metal: 0.5 });
  w.box(RW, RH, 0.5, wall, 0, RH / 2, -RD / 2); w.box(RW, RH, 0.5, wall, 0, RH / 2, RD / 2);
  w.box(0.5, RH, RD, wall, -RW / 2, RH / 2, 0); w.box(0.5, RH, RD, wall, RW / 2, RH / 2, 0);
  const strip = M(0x7fe3ff, { emissive: 0x7fe3ff, ei: 2.2 }), low = M(0x3a8ad8, { emissive: 0x3a8ad8, ei: 1.2 });
  for (const z of [-RD / 2 + 0.3, RD / 2 - 0.3]) { w.box(RW - 1, 0.08, 0.05, strip, 0, RH - 0.5, z, { collide: false }); w.box(RW - 1, 0.08, 0.05, low, 0, 0.3, z, { collide: false }); }
  for (const x of [-RW / 2 + 0.3, RW / 2 - 0.3]) { w.box(0.05, 0.08, RD - 1, strip, x, RH - 0.5, 0, { collide: false }); w.box(0.05, 0.08, RD - 1, low, x, 0.3, 0, { collide: false }); }
  // the roof, round a square hatch over the launch ring
  const roofM = M(0x0a0e18, { rough: 0.8 }), h0 = PAD[0] - HATCH / 2, h1 = PAD[0] + HATCH / 2, k0 = PAD[1] - HATCH / 2, k1 = PAD[1] + HATCH / 2, ry = RH + 0.2;
  w.box(RW, 0.4, k0 + RD / 2, roofM, 0, ry, (k0 - RD / 2) / 2);
  w.box(RW, 0.4, RD / 2 - k1, roofM, 0, ry, (k1 + RD / 2) / 2);
  w.box(h0 + RW / 2, 0.4, HATCH, roofM, (h0 - RW / 2) / 2, ry, PAD[1]);
  w.box(RW / 2 - h1, 0.4, HATCH, roofM, (h1 + RW / 2) / 2, ry, PAD[1]);
  // (the hatch's rim glows, with yellow and black stripes round it)
  const rimM = M(0xffd23f, { emissive: 0xffb020, ei: 0.8 });
  for (const s of [-1, 1]) { w.box(HATCH + 0.4, 0.12, 0.2, rimM, PAD[0], RH - 0.06, PAD[1] + s * (HATCH / 2 + 0.1), { collide: false }); w.box(0.2, 0.12, HATCH, rimM, PAD[0] + s * (HATCH / 2 + 0.1), RH - 0.06, PAD[1], { collide: false }); }
  // the two halves of the hatch, which slide away into the roof
  const doorM = M("metal", { args: [305, [58, 64, 80]], repeat: [2, 2], rough: 0.45, metal: 0.6 });
  const doors = [-1, 1].map(s => { const d = w.box(HATCH / 2, 0.3, HATCH, doorM, PAD[0] + s * HATCH / 4, ry, PAD[1], { collide: false }); d.userData.dynamic = true; return d; });
  // lights in the roof
  for (const [x, z] of [[-7.5, -7.5], [7.5, -7.5], [-7.5, 7], [7.5, 7]]) {
    w.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24), M(0xdff4ff, { emissive: 0xdff4ff, ei: 1.6 }), x, RH - 0.05, z, { cast: false });
    const l = new THREE.PointLight(0xcfe4ff, 9, 18, 1.5); l.position.set(x, RH - 0.8, z); w.scene.add(l);
  }

  // ---- the launch ring and the time-sled on it
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xa070ff).multiplyScalar(1.6) });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.7, 3.0, 64), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(PAD[0], 0.02, PAD[1]); ring.userData.dynamic = true; w.scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.4, 64), ringMat); ring2.rotation.x = -Math.PI / 2; ring2.position.set(PAD[0], 0.02, PAD[1]); ring2.userData.dynamic = true; w.scene.add(ring2);
  const padDisc = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), new THREE.MeshBasicMaterial({ color: 0x6a3ad8, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  padDisc.rotation.x = -Math.PI / 2; padDisc.position.set(PAD[0], 0.03, PAD[1]); padDisc.userData.dynamic = true; w.scene.add(padDisc);
  const padLight = new THREE.PointLight(0xa070ff, 5, 9, 1.4); padLight.position.set(PAD[0], 1.2, PAD[1]); w.scene.add(padLight);
  const sled = timeSled(w, PAD[0], 0, PAD[1], 0);
  w.sign("TIME ROOM", 5, 0.9, 0, RH - 1.4, RD / 2 - 0.28, Math.PI, { bg: "#0a1a3a", fg: "#c89aff", border: "#c89aff", glow: 0.6 });

  // ---- the history wall (north): the great moments going missing, and who's taking them
  const bz = -RD / 2 + 0.27, flick = [];
  const moment = (x, y, t) => {
    w.box(3.0, 1.95, 0.12, M(0x10141e, { rough: 0.5, metal: 0.5 }), x, y, bz - 0.02, { collide: false });
    const s = w.mesh(new THREE.PlaneGeometry(2.8, 1.75), glowMat(t), x, y, bz + 0.05, { cast: false }); s.userData.dynamic = true; flick.push(s);
  };
  moment(-8.6, 4.4, momentTex("🐎", "THE GREAT HORSE", "20,000 BC")); moment(-5.0, 4.4, momentTex("🔺", "THE PYRAMID'S TOP", "2,500 BC"));
  moment(5.0, 4.4, momentTex("🔥", "THE OLYMPIC FLAME", "700 BC")); moment(8.6, 4.4, momentTex("⛵", "THE LONGSHIP'S SAIL", "AD 1000"));
  w.box(5.4, 3.3, 0.12, M(0x10141e, { rough: 0.5, metal: 0.5 }), 0, 4.6, bz - 0.02, { collide: false });
  const hg = w.mesh(new THREE.PlaneGeometry(5.1, 3.05), glowMat(hourglassTex(), 0.8), 0, 4.6, bz + 0.05, { cast: false }); hg.userData.dynamic = true;
  w.sign("THE GREAT MOMENTS OF HISTORY", 10, 0.7, 0, 6.85, bz + 0.05, 0, { bg: "#06142a", fg: "#7fe3ff", glow: 0.7 });
  // the console under them, where Frost stands
  w.box(10, 0.95, 1.1, M(0x1a2438, { metal: 0.7, rough: 0.3 }), 0, 0.475, bz + 1.4);
  w.box(9.6, 0.05, 0.7, M(0x1a3a5a, { emissive: 0x3ab0ff, ei: 0.5 }), 0, 0.97, bz + 1.4, { collide: false });
  w.updaters.push((dt, t) => {
    // the moments flicker, as if they might go out at any second
    flick.forEach((s, i) => { const k = Math.sin(t * 7 + i * 2.1) * Math.sin(t * 3.3 + i) > 0.82 ? 0.15 : 0.9; s.material.emissiveIntensity = k; });
  });

  // ---- Dr Flint's bench (west wall): tools, gears, the blackboard, and the Chrono-watch
  w.box(1.2, 1.0, 6, M(0x5a3a22, { rough: 0.7 }), BENCH[0], 0.5, BENCH[1]);
  w.box(1.3, 0.06, 6.1, M("wood", { args: [311, [150, 100, 60]], repeat: [1, 3] }), BENCH[0], 1.03, BENCH[1], { collide: false });
  const brass = M(0xd8a848, { rough: 0.3, metal: 0.9 });
  for (const [dz, r] of [[-2.2, 0.28], [-1.7, 0.18], [2.0, 0.22]]) w.mesh(new THREE.TorusGeometry(r, 0.06, 8, 20), brass, BENCH[0] + 0.1, 1.06 + 0.03, BENCH[1] + dz, { rx: Math.PI / 2 });
  w.box(0.4, 0.3, 0.5, M(0x3a4a5a, { metal: 0.7, rough: 0.35 }), BENCH[0] + 0.1, 1.21, BENCH[1] + 2.6, { collide: false });
  w.mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshStandardMaterial({ map: chalkTex(), roughness: 0.95 }), -RW / 2 + 0.27, 2.9, BENCH[1], { ry: Math.PI / 2, cast: false });
  const benchLamp = new THREE.PointLight(0xffe0b0, 4, 7, 1.6); benchLamp.position.set(BENCH[0] + 1, 2.6, BENCH[1]); w.scene.add(benchLamp);
  // the Chrono-watch on its little stand: a brass case, a glowing face and a strap
  const watch = new THREE.Group(); watch.position.set(BENCH[0] + 0.15, 1.2, BENCH[1]); watch.userData.dynamic = true; w.scene.add(watch);
  const wcase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24), brass); wcase.rotation.z = Math.PI / 2; watch.add(wcase);
  const wface = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x7fe3ff, emissiveIntensity: 1.6 })); wface.position.x = 0.03; wface.rotation.y = Math.PI / 2; watch.add(wface);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 24), M(0x2a2a3a, { rough: 0.6 })); strap.rotation.y = Math.PI / 2; strap.scale.set(1, 1.3, 1); strap.position.x = -0.02; watch.add(strap);
  const wglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow(), color: 0x7fe3ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); wglow.scale.setScalar(0.9); watch.add(wglow);
  w.cyl(0.08, 0.14, 0.12, brass, BENCH[0] + 0.15, 1.1, BENCH[1], { collide: false });
  w.updaters.push((dt, t) => { watch.rotation.y = t * 1.2; watch.position.y = 1.22 + Math.sin(t * 2) * 0.03; wglow.material.opacity = 0.55 + Math.sin(t * 4) * 0.25; });

  // ---- Pip's desk (east wall): screens, the time map, and a cup of what used to be tea
  w.box(1.6, 0.8, 3.4, M(0x2a3448, { metal: 0.6, rough: 0.4 }), DESK[0], 0.4, DESK[1]);
  for (const [dz, lines, col] of [[-0.9, ["> TIME MAP", "> LEAK: 66,000,000 BC", "> SLED: READY"], "#c89aff"], [0.9, ["> POLARIS NETWORK", "> AGENT: RORY", "> TEA: LEAVES?!"], "#7bed9f"]]) {
    w.box(0.08, 0.9, 1.5, M(0x10141e), DESK[0] + 0.45, 1.3, DESK[1] + dz, { collide: false });
    const s = w.mesh(new THREE.PlaneGeometry(1.4, 0.82), glowMat(panelTex(lines, col), 0.7), DESK[0] + 0.4, 1.3, DESK[1] + dz, { ry: -Math.PI / 2, cast: false }); s.userData.dynamic = true;
  }
  const china = M(0xf4f2ee, { rough: 0.25 });
  w.cyl(0.13, 0.13, 0.015, china, CUP[0], CUP[1] - 0.05, CUP[2], { collide: false });
  w.cyl(0.085, 0.065, 0.12, china, CUP[0], CUP[1] + 0.02, CUP[2], { collide: false, seg: 18 });
  w.mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12), china, CUP[0] + 0.1, CUP[1] + 0.03, CUP[2], {});
  // (the tea, turned back into leaves: a heap of them, dry, in the cup)
  const leaf = M(0x4a6a2a, { rough: 0.9 });
  for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.02 + (i % 3) * 0.022; const l = w.mesh(new THREE.SphereGeometry(0.03, 6, 4), leaf, CUP[0] + Math.cos(a) * r, CUP[1] + 0.075 + (i % 2) * 0.012, CUP[2] + Math.sin(a) * r, { ry: a }); l.scale.set(1.4, 0.35, 0.7); }
  // the big clock over it all, going backwards
  const clock = new THREE.Group(); clock.position.set(...CLOCK); clock.rotation.y = -Math.PI / 2; clock.userData.dynamic = true; w.scene.add(clock);
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshStandardMaterial({ map: clockTex(), emissiveMap: clockTex(), emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.6 })); clock.add(face);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.09, 8, 48), brass); clock.add(bezel);
  const hand = (len, wid, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(wid, len, 0.03), M(col, { rough: 0.4 })); m.geometry.translate(0, len / 2 - 0.1, 0.04); clock.add(m); return m; };
  const hourH = hand(0.8, 0.09, 0x1a2440), minH = hand(1.2, 0.06, 0x1a2440), secH = hand(1.3, 0.025, 0xc83a4a);
  w.sign("HQ TIME", 2.2, 0.5, CLOCK[0] - 0.02, CLOCK[1] - 2.0, CLOCK[2], -Math.PI / 2, { bg: "#1a2440", fg: "#ffd166", glow: 0.4 });
  // (backwards: the hands go the wrong way round, the second hand fastest)
  w.updaters.push((dt, t) => { secH.rotation.z = t * 1.5; minH.rotation.z = 0.8 + t * 0.2; hourH.rotation.z = 2.1 + t * 0.02; });

  // ---- the door we came in by (south), a gadget shelf, and Biscuit
  w.box(3, 4.2, 0.3, M(0x2a3040, { metal: 0.7, rough: 0.3 }), 0, 2.1, RD / 2 - 0.3, { collide: false });
  w.box(1.2, 1, 3.6, M(0x2a3448, { metal: 0.6, rough: 0.4 }), -RW / 2 + 0.9, 0.5, -7.5);
  for (let i = 0; i < 6; i++) w.mesh(new THREE.BoxGeometry(0.4, 0.22, 0.4), M([0xffd166, 0x7fe3ff, 0xff9ae8, 0x7bed9f, 0xe8eef4, 0xc89aff][i], { emissive: [0xffb020, 0x3ab0ff, 0xff5ad8, 0x3aa84a, 0x9ab8d8, 0x8a5ad8][i], ei: 0.5 }), -RW / 2 + 0.9, 1.11, -8.9 + i * 0.56, { ry: i * 0.3 });
  const dog = officeDog(w, DOG[0], DOG[1]);

  // ---- where everybody stands, and the camera shots for the talking
  const P = PAD, spawn = [0, 0.05, 8.6];
  const shots = {
    wide:      [8.6, 4.4, 10.2, -0.5, 1.6, -4],
    room:      [2.3, 2.2, 11.3, -0.9, 1.2, 2.0],
    frost:     [-0.9, 1.85, -5.4, -2.8, 1.55, -9.2],
    screens:   [0, 3.4, -3.2, 0, 4.2, -12],
    hourglass: [0, 4.3, -6.2, 0, 4.5, -12],
    tea:       [CUP[0] - 1.25, CUP[1] + 0.62, CUP[2] - 0.55, CUP[0], CUP[1] + 0.05, CUP[2]],
    clock:     [5.6, 3.4, -2.2, CLOCK[0], CLOCK[1], CLOCK[2]],
    sled:      [5.6, 2.6, 4.0, P[0], 0.9, P[1]],
    flint:     [4.7, 1.75, 4.6, 2.9, 1.45, 1.4],
    bench:     [-7.4, 2.3, 3.6, BENCH[0] + 0.3, 1.2, BENCH[1]],
    riders:    [3.3, 2.1, P[1] + 3.6, P[0], 1.2, P[1]],
    roof:      [4.6, 1.2, P[1] + 5.2, P[0], RH, P[1]],
    launch:    [6.5, 1.0, P[1] + 7.5, P[0], 2.5, P[1]],
  };
  // what happens on a line: the roof opens, the ring powers up
  let hatchK = 0, hatchGo = false, glowK = 0;
  w.updaters.push((dt, t) => {
    if (hatchGo) hatchK = Math.min(1, hatchK + dt / 2.6);
    const e = hatchK * hatchK * (3 - 2 * hatchK);
    doors[0].position.x = PAD[0] - HATCH / 4 - e * (HATCH / 2 + 0.2); doors[1].position.x = PAD[0] + HATCH / 4 + e * (HATCH / 2 + 0.2);
    const pulse = 1 + Math.sin(t * 3) * 0.04 + glowK * Math.sin(t * 18) * 0.05;
    ring.scale.setScalar(pulse); ring2.scale.setScalar(2 - pulse);
    ringMat.color.setRGB(0.63 * (1.6 + glowK * 2.5), 0.44 * (1.6 + glowK * 2.5), 1.6 + glowK * 2.5);
    padDisc.material.opacity = 0.18 + glowK * 0.4;
    padLight.intensity = 5 + glowK * 40;
  });
  const cues = {
    roof: () => { hatchGo = true; },
    launch: () => { glowK = 0.4; },
  };
  const launch = {
    sled, lift: y => { sled.userData.lift = y; }, glow: k => { glowK = k; },
    // the seats, in the sled's own frame: Rory in front, Dr Flint behind (an adult sits lower)
    seats: { front: [0, 0.09, 0.35], back: [0, -0.06, -0.55] },
  };
  return {
    spawn, yaw: Math.PI, contact: null, shots, cues, launch, dog,
    // (on the title screen Rory stands in front of the sled, facing the camera)
    title: [0, 0.05, 4.4, 0],
    people: { frost: [-2.8, 0.05, -9.2, 0], pip: [DESK[0] - 1.4, 0.05, DESK[1] + 0.6, -Math.PI / 2], flint: [2.9, 0.05, 1.4, -0.6] },
    // where the prologue's beacons stand: in front of the bench, and beside the sled
    watchAt: [BENCH[0] + 1.6, 0, BENCH[1]], watch, sledAt: [P[0] + 2.4, 0, P[1] + 0.4],
  };
}
