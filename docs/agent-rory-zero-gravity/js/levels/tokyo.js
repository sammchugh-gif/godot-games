// Tokyo at night: a neon crossing, giant video screens, an arcade, a park of
// cherry trees, a bullet train overhead, and Tokyo Tower hanging in the air.
import * as THREE from "three";
import { M, TEX } from "../tex.js";
import { thing } from "../props.js";

// a video screen whose picture is drawn by fn(g, w, h, t) a few times a second
export function screenTex(w, h, fn) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { c, g, t, fn, draw(time) { fn(g, w, h, time); t.needsUpdate = true; } };
}
function neon(w, text, x, y, z, ry, color, o = {}) {
  const tex = TEX.sign(text, { bg: "#07070c", fg: color, w: 512, h: Math.round(512 * (o.h || 1) / (o.w || 4)), border: color, font: "system-ui, sans-serif", weight: 900 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 4, o.h || 1), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: o.ei ?? 2.2, roughness: 0.5 }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; w.scene.add(m);
  return m;
}
function sakura(w, x, z, h = 5) {
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, h * 0.55, 8), M(0x4a3028, { rough: 0.9 })); trunk.position.y = h * 0.27; trunk.rotation.z = 0.08; trunk.castShadow = true; g.add(trunk);
  const pink = M(0xffb8d0, { rough: 0.8, emissive: 0xff8ab0, ei: 0.15 });
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(h * (0.2 + (i % 3) * 0.04), 1), pink); const a = i / 7 * Math.PI * 2; b.position.set(Math.cos(a) * h * 0.22, h * (0.62 + (i % 2) * 0.12), Math.sin(a) * h * 0.22); b.castShadow = true; g.add(b); }
  w.phys.fixedCyl(x, h * 0.27, z, 0.25, h * 0.27);
}
function torii(w, x, z, ry = 0, s = 1) {
  const red = M(0xd8302a, { rough: 0.5 }), black = M(0x1a1a1a, { rough: 0.5 });
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); w.scene.add(g);
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  for (const sx of [-1.8, 1.8]) { add(new THREE.CylinderGeometry(0.22, 0.26, 4.6, 12), red, sx, 2.3, 0); add(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 12), black, sx, 0.15, 0); }
  add(new THREE.BoxGeometry(5.2, 0.35, 0.45), red, 0, 3.7, 0);
  const top = add(new THREE.BoxGeometry(6.2, 0.4, 0.6), black, 0, 4.6, 0); top.scale.set(1, 1, 1);
  add(new THREE.BoxGeometry(6.4, 0.2, 0.7), red, 0, 4.35, 0);
  for (const sx of [-1.8, 1.8]) w.phys.fixedCyl(x + Math.cos(ry) * sx * s, 2.3, z - Math.sin(ry) * sx * s, 0.3 * s, 2.3 * s);
}
function tower(w, x, z, h = 70) {
  // Tokyo Tower: red and white lattice, its top half floating off its legs
  const red = M(0xe8401a, { rough: 0.45, metal: 0.3 }), white = M(0xf4f4f4, { rough: 0.45, metal: 0.3 });
  const legs = new THREE.Group(); legs.position.set(x, 0, z); w.scene.add(legs);
  const top = new THREE.Group(); top.position.set(x, 0, z); w.scene.add(top);
  const seg = 14, base = 11;
  for (let i = 0; i < seg; i++) {
    const y0 = i / seg * h, y1 = (i + 1) / seg * h;
    const r0 = base * Math.pow(1 - i / seg, 1.6) + 0.6, r1 = base * Math.pow(1 - (i + 1) / seg, 1.6) + 0.6;
    const m = (Math.floor(i / 2) % 2) ? white : red;
    const parent = i < 3 ? legs : top;
    for (let k = 0; k < 4; k++) {
      const a0 = k * Math.PI / 2 + Math.PI / 4;
      const p0 = new THREE.Vector3(Math.cos(a0) * r0, y0, Math.sin(a0) * r0), p1 = new THREE.Vector3(Math.cos(a0) * r1, y1, Math.sin(a0) * r1);
      const len = p0.distanceTo(p1), mid = p0.clone().add(p1).multiplyScalar(0.5);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.5, len, 0.5), m); beam.position.copy(mid); beam.lookAt(p1); beam.rotateX(Math.PI / 2); beam.castShadow = true; parent.add(beam);
      // cross braces
      const a1 = a0 + Math.PI / 2, q0 = new THREE.Vector3(Math.cos(a1) * r1, y1, Math.sin(a1) * r1);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.22, p0.distanceTo(q0), 0.22), m); br.position.copy(p0.clone().add(q0).multiplyScalar(0.5)); br.lookAt(q0); br.rotateX(Math.PI / 2); parent.add(br);
    }
    if (i === 5 || i === 9) { const deck = new THREE.Mesh(new THREE.CylinderGeometry(r0 + 1.2, r0 + 1.2, 2.2, 16), M(0xf4f4f4, { emissive: 0xffe8b0, ei: 0.6 })); deck.position.y = y0; top.add(deck); }
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.5, 10, 8), white); spire.position.y = h + 5; top.add(spire);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), M(0xff3a3a, { emissive: 0xff2a2a, ei: 4 })); tip.position.y = h + 10.2; top.add(tip);
  // lights up the lattice at night
  for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), M(0xffc070, { emissive: 0xffa040, ei: 3 })); const a = i / 12 * Math.PI * 2, y = 4 + i * 5, r = base * Math.pow(1 - y / h, 1.6) + 0.8; b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); (y < h * 3 / seg ? legs : top).add(b); }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.phys.fixedBox(x + sx * base * 0.72, 3, z + sz * base * 0.72, 0.8, 3, 0.8);
  w.updaters.push((dt, t) => { top.position.y = 5 + Math.sin(t * 0.6) * 1.2; top.rotation.z = Math.sin(t * 0.4) * 0.02; });
  return top;
}
function train(w, zz, y) {
  // the elevated line and a bullet train that whooshes past every so often
  const conc = M(0xb8b8bc, { rough: 0.9 });
  w.box(300, 0.8, 5, conc, 0, y, zz, { collide: false });
  for (let x = -144; x <= 144; x += 16) w.box(1.4, y, 1.4, conc, x, y / 2, zz, { collide: Math.abs(x) < 50 });
  const g = new THREE.Group(); w.scene.add(g);
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f6f8, roughness: 0.2, metalness: 0.2, clearcoat: 1 }), blue = M(0x1a4ad8, { rough: 0.3 }), glass = M(0x1a2a3a, { rough: 0.1, metal: 0.6, emissive: 0xfff0c0, ei: 0.5 });
  for (let i = 0; i < 5; i++) {
    const car = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 18, 6, 12), white); car.rotation.z = Math.PI / 2; car.scale.set(1, 1, 1.1); car.position.set(i * 21.5, y + 2, zz); car.castShadow = true; g.add(car);
    const st = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 3.3), blue); st.position.set(i * 21.5, y + 1.4, zz); g.add(st);
    const win = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 3.25), glass); win.position.set(i * 21.5, y + 2.6, zz); g.add(win);
  }
  let x = -400;
  w.updaters.push(dt => { x += dt * 70; if (x > 400) x = -700; g.position.x = x; });
}

export function buildTokyo(w) {
  w.setSky("night");
  w.scene.userData.envI = 0.25;
  const asphalt = M("asphalt", { args: [21], repeat: [40, 40] });
  w.ground(asphalt, 400);
  // pavements: four raised corners around the crossing
  const pave = M("paving", { args: [23, [150, 146, 140], 32], repeat: [10, 10] });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(40, 0.18, 40, pave, sx * 26, 0.09, sz * 26);
  // the famous crossing: zebra stripes in every direction and a diagonal pair
  const stripe = M(0xf0f0f0, { rough: 0.7 });
  for (let i = -5; i <= 5; i++) { w.box(0.7, 0.02, 4, stripe, i * 1.1, 0.01, -8, { collide: false }); w.box(0.7, 0.02, 4, stripe, i * 1.1, 0.01, 8, { collide: false }); w.box(4, 0.02, 0.7, stripe, -8, 0.01, i * 1.1, { collide: false }); w.box(4, 0.02, 0.7, stripe, 8, 0.01, i * 1.1, { collide: false }); }
  for (let i = -6; i <= 6; i++) { const s = w.box(0.7, 0.02, 3, stripe, i * 0.9, 0.012, i * 0.9, { collide: false, ry: Math.PI / 4 }); void s; }
  // road lines
  const yellow = M(0xf0c020, { rough: 0.7 });
  for (let z = -140; z <= 140; z += 6) if (Math.abs(z) > 12) w.box(0.2, 0.02, 3, yellow, 0, 0.012, z, { collide: false });
  for (let x = -140; x <= 140; x += 6) if (Math.abs(x) > 12) w.box(3, 0.02, 0.2, yellow, x, 0.012, 0, { collide: false });
  // buildings, lit up with neon
  const B = [
    [12, 22, 10, 16, -16, "#e8e0d8", "RAMEN", "#ff5a5a"], [10, 34, 12, 30, -18, "#c8ccd4", "SUSHI", "#5ae8ff"], [12, 16, 10, 16, -34, "#d8d0c8", null],
    [12, 28, 12, -16, -16, "#b8c0cc", "KARAOKE", "#ff5ad8"], [14, 20, 10, -32, -16, "#e0d8d0", null], [10, 38, 10, -18, -34, "#a8b0c0", "TOKYO", "#ffd166"],
    [12, 18, 12, -16, 16, "#d8d0c8", null], [10, 26, 10, -50, 34, "#c0c8d4", "MANGA", "#7bed9f"],
    [10, 24, 10, 32, 30, "#d0c8c0", "CAFE", "#ffd166"], [12, 14, 10, 34, 14, "#c8c0b8", null],
  ];
  for (const [bw, bh, bd, x, z, wall, sign, col] of B) {
    const hex = parseInt(wall.slice(1), 16), rgb = [hex >> 16, (hex >> 8) & 255, hex & 255];
    w.building(bw, bh, bd, x, z, { wall: rgb, seed: Math.abs(x * 3 + z), win: { lit: 0.55, glow: "#ffe6a8", glass: "#1a2230" }, ei: 1.3, trim: 0x3a3a40 });
    if (sign) { const face = z < 0 ? 1 : -1; neon(w, sign, x, bh * 0.55, z + face * (bd / 2 + 0.06), face > 0 ? 0 : Math.PI, col, { w: bw * 0.6, h: 1.8 }); }
  }
  // the giant screens where Professor Zero shows up
  const big = screenTex(512, 288, (g, W, H, t) => {
    if (w.zeroFace) { g.fillStyle = "#1a0820"; g.fillRect(0, 0, W, H); g.drawImage(w.zeroFace, W / 2 - H * 0.42, H * 0.06, H * 0.84, H * 0.84); g.fillStyle = "#ff5ad8"; g.font = "900 34px system-ui"; g.textAlign = "center"; g.fillText("PROFESSOR ZERO", W / 2, H - 10); return; }
    const k = Math.floor(t / 3) % 3;
    const bg = ["#ff3a6a", "#3a8aff", "#ffd23f"][k]; g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = "#fff"; g.font = "900 64px system-ui"; g.textAlign = "center"; g.textBaseline = "middle";
    const txt = ["RAMEN!", "ROBO CAT", "ARCADE"][k]; g.fillText(txt, W / 2 + Math.sin(t * 3) * 20, H / 2);
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc((i * 97 + t * 80) % W, H * 0.2 + (i % 3) * 70, 12, 0, 7); g.fill(); }
  });
  const scrMat = new THREE.MeshStandardMaterial({ map: big.t, emissiveMap: big.t, emissive: 0xffffff, emissiveIntensity: 1.6 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.75), scrMat); scr.position.set(16, 16, -10.9); w.scene.add(scr);
  const scr2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.6), scrMat); scr2.position.set(-10.9, 14, -16); scr2.rotation.y = Math.PI / 2; w.scene.add(scr2);
  let st = 0; w.updaters.push((dt, t) => { st -= dt; if (st <= 0) { big.draw(t); st = 0.12; } });
  w.bigScreen = big;
  // the arcade: a low building whose roof you can reach by the stairs and a pad
  const arcade = M("metal", { args: [25, [70, 60, 110]], repeat: [3, 1] });
  w.box(14, 6, 12, arcade, 18, 3, 20);
  neon(w, "ARCADE", 18, 4.6, 13.94, Math.PI, "#ff5ad8", { w: 8, h: 1.8, ei: 3 });
  w.steps(18, 2.4, 0.34, 0.6, M("metal", { args: [26], repeat: [1, 1] }), 9.8, 0.2, 31, Math.PI);
  w.pad(26, 0.2, 10, 15, 0x39f0ff);
  w.box(8, 0.3, 8, M("metal", { args: [27, [90, 96, 110]] }), 32, 10, 22);
  w.pad(18, 6.05, 18, 13, 0xff5ad8);
  w.pad(23, 6.05, 23, 13, 0x7bed9f); // from the arcade roof over to the slab
  // lamps, vending machines, a park with cherry trees and a gate
  for (const [x, z] of [[-7, 14], [7, 14], [-7, -14], [7, -14], [-14, 7], [14, 7], [-14, -7], [14, -7], [-7, 30], [7, 30], [-7, 44], [7, 44]]) w.lamp(x, z, 5, 0xfff0d0, { ei: 5 });
  for (const [x, z, c] of [[-8.5, 22, 0xe83a3a], [-8.5, 24, 0x3a8ae8], [8.5, 36, 0xe8e8e8], [-24, 8.5, 0x3ae87a]]) { const v = new THREE.Group(); v.position.set(x, 0.18, z); w.scene.add(v); const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.8), M(c, { rough: 0.4 })); b.position.y = 0.95; b.castShadow = true; v.add(b); const f = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.05), M(0x9ad8ff, { emissive: 0x9ad8ff, ei: 1.8 })); f.position.set(0, 1.15, 0.41); v.add(f); v.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2; w.phys.fixedBox(x, 1.1, z, 0.55, 0.95, 0.55); }
  const grass = M("grass", { args: [29, [70, 110, 60]], repeat: [6, 6] });
  w.box(30, 0.3, 26, grass, -28, 0.15, 28);
  for (const [x, z] of [[-18, 20], [-24, 18], [-34, 22], [-20, 34], [-30, 36], [-38, 30], [-26, 28]]) sakura(w, x, z, 5.5);
  torii(w, -14, 28, Math.PI / 2, 0.9);
  w.water(8, 6, -34, 0.35, 28, 0x1a3a5a, { opacity: 0.9 });
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), M(0xff5a3a, { emissive: 0xff5a2a, ei: 2.5 })); l.scale.y = 1.25; l.position.set(-18 - i * 3.5, 3.2, 15.2); w.scene.add(l); }
  w.box(22, 0.05, 0.05, M(0x1a1a1a), -26.8, 3.6, 15.2, { collide: false });
  // falling petals
  const petals = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc0d8).multiplyScalar(1.4), side: THREE.DoubleSide }), 140);
  const pd = []; const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), ss = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 140; i++) pd.push([-40 + Math.random() * 26, Math.random() * 7, 16 + Math.random() * 24, Math.random() * 6]);
  w.scene.add(petals);
  w.updaters.push((dt, t) => { for (let i = 0; i < 140; i++) { const p = pd[i]; p[1] -= dt * 0.6; if (p[1] < 0) p[1] = 7; qq.setFromEuler(new THREE.Euler(t * 2 + p[3], t + p[3], 0)); mm.compose(new THREE.Vector3(p[0] + Math.sin(t + p[3]) * 0.6, p[1], p[2] + Math.cos(t * 0.7 + p[3]) * 0.4), qq, ss); petals.setMatrixAt(i, mm); } petals.instanceMatrix.needsUpdate = true; });
  // Tokyo Tower and the train
  w.tower = tower(w, 0, -78, 64);
  train(w, -46, 9);
  // a few floating things drifting overhead: the gravity is going
  const drift = [["car", 20, 8, -30, 0xe8c020], ["bike", -12, 6, -28, 0x2a8ad8], ["bin", 6, 5, -36, 0x2a8a4a]];
  for (const [k, x, y, z, c] of drift) { const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g); g.add(thing(k, c)); w.updaters.push((dt, t) => { g.position.y = y + Math.sin(t * 0.7 + x) * 0.8; g.rotation.set(Math.sin(t * 0.3 + z) * 0.3, t * 0.2, Math.cos(t * 0.4) * 0.3); }); }
  // a few coloured lights in the crossing for the neon glow on the road
  for (const [x, z, c] of [[10, -10, 0xff5ad8], [-10, -10, 0x5ae8ff], [10, 10, 0xffd166], [-10, 10, 0x7bed9f]]) { const l = new THREE.PointLight(c, 18, 26, 1.8); l.position.set(x, 6, z); w.scene.add(l); }
  w.floorY = -20;
  w.missionData = {
    tok1: { cells: [[16, 7.2, 22], [22, 7.2, 16], [32, 11.3, 22], [26, 5.5, 10], [18, 11, 18], [9.8, 5.3, 24], [30, 11.3, 23.4], [13, 7.2, 25]] },
    tok2: { things: [["vending", -6.5, 0.18, 27, Math.PI / 2, 0xe83a3a], ["bike", -4, 0.18, 18, 0.4, 0x2a8ad8], ["bin", 4, 0.18, 20, 0, 0x2a8a4a], ["vending", 6.5, 0.18, 40, -Math.PI / 2, 0xe8e8e8], ["bench", 5, 0.18, 28, 0.2], ["bike", -5, 0.18, 32, -0.3, 0xe83a3a], ["bin", 2, 0.18, 38, 0, 0x3a3a3a]] },
    tok3: { area: [-26, 28, 9], bots: [[-20, 0.3, 24], [-27, 0.3, 25], [-24, 0.3, 34], [-34, 0.3, 24], [-28, 0.3, 20]] },
    tok4: { rings: [[0, 6, -22, 2.2], [6, 10, -32, 2.2, 0.6], [10, 16, -44, 2.2, 0.9], [4, 22, -58, 2.2, 1.5], [-8, 28, -66, 2.2, 2.4], [-14, 34, -80, 2.2, 3], [-4, 40, -92, 2.2, 3.8], [10, 46, -88, 2.2, 4.6], [12, 52, -76, 2.2, 5.4], [0, 58, -66, 2.4, 6.2]], ceiling: 70 },
  };
  return { spawn: [0, 0.2, 34], yaw: Math.PI, bolt: [2, 0.2, 33], contact: [-3.5, 0.2, 30, 2.4] };
}
