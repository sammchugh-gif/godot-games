// Timeslip's kit for the eras, built from simple shapes: ferns (instanced, so a whole field is a
// few draw calls), cycads, tree ferns and monkey-puzzle trees for the dinosaurs' valley; a nest of
// eggs; a smoking volcano on the skyline; long-necked sauropods grazing far off and pterosaurs
// circling; and the POLARIS time-sled, parked where Rory lands.
import * as THREE from "three";
import { M } from "../tex.js";

const leafM = (c) => M(c, { rough: 0.75, side: THREE.DoubleSide });
// a frond: a long, curved, tapering leaf
function frondGeo(len = 1.6, w = 0.45) {
  const g = new THREE.PlaneGeometry(w, len, 1, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) + len / 2, t = y / len; p.setX(i, p.getX(i) * (1 - t * 0.85)); p.setZ(i, -t * t * len * 0.55); p.setY(i, y); }
  g.computeVertexNormals(); return g;
}
// a field of ferns: spots [[x, y, z, size]], each a ring of fronds; a handful of draw calls in all
export function ferns(w, spots, color = 0x3e8a3a) {
  const per = 7, geo = frondGeo(), im = new THREE.InstancedMesh(geo, leafM(color), spots.length * per), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let n = 0;
  for (const [x, y, z, s = 1] of spots) for (let i = 0; i < per; i++) {
    e.set(-0.5 - (i % 2) * 0.25, i / per * Math.PI * 2 + x * 0.7, 0, "YXZ"); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s)); im.setMatrixAt(n++, m);
  }
  im.castShadow = true; im.receiveShadow = true; w.scene.add(im); return im;
}
// a cycad: a stubby scaly trunk and a crown of stiff fronds
export function cycad(w, x, y, z, h = 2.2) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, h, 10), M(0x7a5a3a, { rough: 0.95 })); trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  const geo = frondGeo(1.9, 0.5), lm = leafM(0x4a8a3a);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(geo, lm); f.position.y = h; f.rotation.set(-0.6, i / 9 * Math.PI * 2, 0, "YXZ"); f.castShadow = true; g.add(f); }
  w.phys.fixedCyl(x, y + h / 2, z, 0.35, h / 2);
  return g;
}
// a tree fern: a tall thin trunk and an umbrella of long fronds
export function treeFern(w, x, y, z, h = 5) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, h, 8), M(0x5a4030, { rough: 0.95 })); trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  const geo = frondGeo(3, 0.7), lm = leafM(0x3a8040);
  for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(geo, lm); f.position.y = h; f.rotation.set(-1.0, i / 10 * Math.PI * 2, 0, "YXZ"); f.castShadow = true; g.add(f); }
  w.phys.fixedCyl(x, y + h / 2, z, 0.25, h / 2);
  return g;
}
// a monkey-puzzle tree: a tall bare trunk with tiers of stiff branches at the top
export function monkeyPuzzle(w, x, y, z, h = 14) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const bark = M(0x6a5040, { rough: 0.95 }), needle = M(0x2a5a30, { rough: 0.85 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, h, 10), bark); trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  for (let t = 0; t < 4; t++) {
    const ty = h * (0.6 + t * 0.12), r = 2.6 - t * 0.55;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 0.5; const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, r, 6), needle); b.position.set(Math.cos(a) * r / 2, ty, Math.sin(a) * r / 2); b.rotation.set(0, -a, Math.PI / 2 - 0.25); b.castShadow = true; g.add(b); }
  }
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 8), needle); top.position.y = h + 0.6; g.add(top);
  w.phys.fixedCyl(x, y + h / 2, z, 0.45, h / 2);
  return g;
}
// a nest: a ring of mud and sticks, with eggs in it (count), and a soft glow for the goal
export function nest(w, x, y, z, eggs = 3, r = 2.2) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const mud = new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 10, 28), M(0x6a4a2a, { rough: 1 })); mud.rotation.x = Math.PI / 2; mud.position.y = 0.2; mud.scale.z = 0.6; mud.receiveShadow = mud.castShadow = true; g.add(mud);
  const bed = new THREE.Mesh(new THREE.CircleGeometry(r, 24), M(0xa88a50, { rough: 1 })); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.06; g.add(bed);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 5), M(0x5a3a1a)); st.position.set(Math.cos(a) * r, 0.45, Math.sin(a) * r); st.rotation.set(0.6, -a, 1.3); g.add(st); }
  const eggM = M(0xf0e6c8, { rough: 0.6 }), spotM = M(0x9ab87a, { rough: 0.6 });
  g.userData.eggs = [];
  for (let i = 0; i < eggs; i++) { const a = i / eggs * Math.PI * 2; const e = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), i % 2 ? spotM : eggM); e.scale.y = 1.3; e.position.set(Math.cos(a) * r * 0.35, 0.4, Math.sin(a) * r * 0.35); e.castShadow = true; g.add(e); g.userData.eggs.push(e); }
  return g;
}
// an egg to carry (a stack mission's block, in the shape of an egg)
export function eggMesh(size = 0.9) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(size * 0.45, 16, 12), M(0xf0e6c8, { rough: 0.6 })); e.scale.y = 1.3; e.castShadow = true;
  const g = new THREE.Group(); g.add(e);
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(size * 0.08, 8, 6), M(0x9ab87a)); const a = i * 1.3; s.position.set(Math.cos(a) * size * 0.36, (i - 2) * size * 0.12, Math.sin(a) * size * 0.36); g.add(s); }
  return g;
}
// a volcano on the skyline, glowing at the top, with smoke rising from it
export function volcano(w, x, z, r = 90, h = 120, y = -10) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24, 1, true), M("rock", { args: [91, [74, 62, 56]], repeat: [8, 4] })); cone.position.y = h / 2; g.add(cone);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.14, 3, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a1a).multiplyScalar(3) })); glow.position.y = h - 4; g.add(glow);
  w.updaters.push((dt) => { if (w.fx && Math.random() < dt * 3) w.fx.puff(x + (Math.random() - 0.5) * r * 0.1, y + h + 4, z + (Math.random() - 0.5) * r * 0.1, 0x6a6460, 14); });
  return g;
}
// a sauropod, grazing far off: a great body, a long neck and tail (it only sways, it's scenery)
export function sauropod(w, x, y, z, s = 1, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; g.scale.setScalar(s); w.scene.add(g);
  const skin = M(0x7a8a6a, { rough: 0.85 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), skin); body.scale.set(1, 0.8, 1.6); body.position.y = 7; g.add(body);
  const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 8, 4), new THREE.Vector3(0, 12, 8), new THREE.Vector3(0, 16, 10)]), 12, 0.7, 8), skin); g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), skin); head.scale.set(0.8, 0.7, 1.3); head.position.set(0, 16.2, 10.8); g.add(head);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 7, -4), new THREE.Vector3(0, 5, -9), new THREE.Vector3(0, 2, -14)]), 12, 0.6, 8), skin); g.add(tail);
  for (const [lx, lz] of [[-1.6, 2.5], [1.6, 2.5], [-1.6, -2.5], [1.6, -2.5]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 6, 10), skin); l.position.set(lx, 3, lz); g.add(l); }
  const ph = Math.random() * 6;
  w.updaters.push((dt, t) => { neck.rotation.y = Math.sin(t * 0.25 + ph) * 0.12; head.position.x = Math.sin(t * 0.25 + ph) * 1.6; });
  return g;
}
// pterosaurs circling high over the valley
export function pterosaurs(w, cx, cy, cz, n = 5, r = 40) {
  const skin = M(0x8a6a4a, { rough: 0.7, side: THREE.DoubleSide }), list = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(); w.scene.add(g);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 1.1, 4, 8), skin); body.rotation.x = Math.PI / 2; g.add(body);
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.1, 6), skin); crest.rotation.x = -Math.PI / 2 - 0.5; crest.position.set(0, 0.2, 0.8); g.add(crest);
    const wings = [-1, 1].map(s => { const wg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), skin); wg.position.x = s * 1.3; const p = new THREE.Group(); p.add(wg); g.add(p); return p; });
    list.push({ g, wings, a: i / n * Math.PI * 2, rr: r * (0.7 + (i % 3) * 0.15), y: cy + (i % 4) * 5, sp: 0.12 + (i % 3) * 0.03 });
  }
  w.updaters.push((dt, t) => { for (const p of list) { p.a += dt * p.sp; p.g.position.set(cx + Math.cos(p.a) * p.rr, p.y + Math.sin(t + p.a) * 1.5, cz + Math.sin(p.a) * p.rr); p.g.rotation.y = -p.a; const f = Math.sin(t * 3 + p.a * 5) * 0.35; p.wings[0].rotation.z = f; p.wings[1].rotation.z = -f; } });
  return list;
}
// the POLARIS time-sled, parked: white, with its violet skirt glowing
export function timeSled(w, x, y, z, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, y + 0.5, z); g.rotation.y = yaw; w.scene.add(g);
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.2, 6, 14), M(0xf2f5fa, { rough: 0.3, metal: 0.5 })); hull.rotation.x = Math.PI / 2; hull.scale.set(1.2, 0.55, 1); hull.castShadow = true; g.add(hull);
  const skirt = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.09, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xa070ff).multiplyScalar(2.5) })); skirt.rotation.x = Math.PI / 2; skirt.scale.set(1, 1.7, 1); skirt.position.y = -0.35; g.add(skirt);
  const screen = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.4, roughness: 0.05, clearcoat: 1 })); screen.position.set(0, 0.3, 0.9); screen.scale.set(1.1, 0.7, 0.8); g.add(screen);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd166).multiplyScalar(2) })); dial.position.set(0, 0.55, -0.9); dial.rotation.y = Math.PI; g.add(dial);
  w.phys.fixedBox(x, y + 0.5, z, 1.2, 0.5, 1.9, yaw);
  w.updaters.push((dt, t) => { g.position.y = y + 0.5 + Math.sin(t * 1.6) * 0.06; });
  return g;
}
// snow falling round the camera (a box of flakes that follows it)
export function snowfall(w, k = 1) {
  const n = Math.round(900 * k), S = 40, pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * S;
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  pts.frustumCulled = false; pts.userData.dynamic = true; w.scene.add(pts);
  const wrap = (v, c) => ((v - c + S / 2) % S + S) % S - S / 2 + c;
  w.updaters.push((dt, t) => {
    const cam = w.engine.camera; if (!cam) return;
    const c = cam.position, a = g.attributes.position.array;
    for (let i = 0; i < n; i++) { const j = i * 3; a[j] = wrap(a[j] + Math.sin(t * 0.6 + i) * dt * 0.4 + dt * 0.3, c.x); a[j + 1] = wrap(a[j + 1] - dt * (1.2 + (i % 5) * 0.15), c.y); a[j + 2] = wrap(a[j + 2] + Math.cos(t * 0.5 + i) * dt * 0.4, c.z); }
    g.attributes.position.needsUpdate = true;
  });
}
// a hide tent: a cone of skins on poles, with its door flap
export function hideTent(w, x, y, z, r = 2.2, h = 3.4, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; w.scene.add(g);
  const skin = M("sand", { args: [251, [168, 130, 92]], repeat: [3, 2] });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12, 1, true), skin); cone.position.y = h / 2; cone.material.side = THREE.DoubleSide; cone.castShadow = true; g.add(cone);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h + 0.8, 5), M(0x5a3a1a)); p.position.set(Math.cos(a) * 0.25, h / 2 + 0.3, Math.sin(a) * 0.25); p.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); g.add(p); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), M(0x2a1a10)); door.position.set(0, 0.7, r * 0.72); door.rotation.x = -0.5; g.add(door);
  w.phys.fixedCyl(x, y + h * 0.4, z, r * 0.75, h * 0.4);
  return g;
}
// a campfire: a ring of stones, logs, flames that flicker and smoke rising
export function campfire(w, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), M(0x6a6660)); s.position.set(Math.cos(a) * 0.7, 0.12, Math.sin(a) * 0.7); g.add(s); }
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6), M(0x4a2a14)); l.position.y = 0.2; l.rotation.set(Math.PI / 2, i / 3 * Math.PI, 0.3); g.add(l); }
  const flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.55, 0.15).multiplyScalar(3), transparent: true, opacity: 0.9 });
  const fl = [0, 1, 2].map(i => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.28 - i * 0.06, 0.9 - i * 0.2, 8), flameM); f.position.set((i - 1) * 0.12, 0.55, (i % 2) * 0.1); g.add(f); return f; });
  const light = new THREE.PointLight(0xff9a40, 18, 12, 1.6); light.position.y = 1; g.add(light);
  w.updaters.push((dt, t) => { fl.forEach((f, i) => { f.scale.y = 0.8 + Math.sin(t * 9 + i * 2) * 0.25; }); light.intensity = 16 + Math.sin(t * 11) * 3; if (w.fx && Math.random() < dt * 2) w.fx.puff(x, y + 1.6, z, 0x8a8480, 6); });
  return g;
}
// a cave painting: animals and handprints in ochre and charcoal, on a panel of rock
export function cavePainting(w, x, y, z, width, height, ry = 0, what = ["horse", "mammoth", "deer", "hands"]) {
  const c = document.createElement("canvas"); c.width = 512; c.height = Math.round(512 * height / width); const g = c.getContext("2d");
  g.fillStyle = "#a8927a"; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${90 + Math.random() * 60},${80 + Math.random() * 40},${60 + Math.random() * 30},.25)`; g.fillRect(Math.random() * c.width, Math.random() * c.height, 6, 6); }
  const col = ["#8a2a14", "#1a1410", "#b8601a"];
  const beast = (kind, cx, cy, s, colour) => {
    g.strokeStyle = colour; g.fillStyle = colour; g.lineWidth = 5; g.lineCap = "round";
    g.beginPath(); g.ellipse(cx, cy, s * 1.1, s * 0.55, 0, 0, 7); g.globalAlpha = 0.75; g.fill(); g.globalAlpha = 1;
    const head = kind === "mammoth" ? [cx + s * 1.1, cy - s * 0.3, s * 0.45] : [cx + s * 1.25, cy - s * 0.55, s * 0.3];
    g.beginPath(); g.arc(head[0], head[1], head[2], 0, 7); g.fill();
    for (const lx of [-0.7, -0.3, 0.3, 0.7]) { g.beginPath(); g.moveTo(cx + lx * s, cy + s * 0.4); g.lineTo(cx + lx * s, cy + s * 1.05); g.stroke(); }
    if (kind === "mammoth") { g.beginPath(); g.moveTo(head[0] + s * 0.3, head[1]); g.quadraticCurveTo(head[0] + s * 0.6, head[1] + s * 0.8, head[0] + s * 0.3, head[1] + s * 1.0); g.stroke(); }
    if (kind === "deer") for (const k of [-1, 1]) { g.beginPath(); g.moveTo(head[0], head[1] - s * 0.2); g.lineTo(head[0] + k * s * 0.3, head[1] - s * 0.8); g.stroke(); }
    if (kind === "horse") { g.beginPath(); g.moveTo(cx + s * 0.8, cy - s * 0.5); g.lineTo(cx + s * 1.2, cy - s * 0.85); g.stroke(); }
  };
  what.forEach((k, i) => {
    const cx = c.width * (0.2 + (i % 2) * 0.5), cy = c.height * (0.3 + Math.floor(i / 2) * 0.4);
    if (k === "hands") for (let j = 0; j < 5; j++) { const hx = cx + (j - 2) * 34, hy = cy + (j % 2) * 20; g.fillStyle = col[j % 3]; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(hx, hy, 11, 14, 0, 0, 7); g.fill(); for (let f = 0; f < 5; f++) { const a = -Math.PI / 2 + (f - 2) * 0.4; g.beginPath(); g.ellipse(hx + Math.cos(a) * 18, hy + Math.sin(a) * 18, 3.5, 8, a + Math.PI / 2, 0, 7); g.fill(); } g.globalAlpha = 1; }
    else beast(k, cx, cy, 48, col[i % 3]);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 }));
  m.position.set(x, y, z); m.rotation.y = ry; w.scene.add(m);
  return m;
}
// a torch bowl on a stand, burning (with an optional light)
export function torch(w, x, y, z, light = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.14, 0.22, 10), M(0x3a2a1a)); bowl.position.y = 1.2; g.add(bowl);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 6), M(0x4a3020)); post.position.y = 0.6; g.add(post);
  const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.55, 0.15).multiplyScalar(3.2) })); f.position.y = 1.55; g.add(f);
  if (light) { const l = new THREE.PointLight(0xff9a40, 14, 14, 1.6); l.position.y = 1.8; g.add(l); }
  w.updaters.push((dt, t) => { f.scale.y = 0.85 + Math.sin(t * 10 + x) * 0.2; });
  return g;
}
// flat land all round the edge of a level, just above its water, so a river or a lake doesn't
// run on out to the horizon past the end of the terrain
export function landFrame(w, half, y, color) {
  const F = 1400, mat = M(color, { rough: 1 });
  for (const [sx, sz, cx, cz] of [[2 * F, F - half, 0, -(half + (F - half) / 2)], [2 * F, F - half, 0, half + (F - half) / 2], [F - half, 2 * half, -(half + (F - half) / 2), 0], [F - half, 2 * half, half + (F - half) / 2, 0]]) {
    const m = w.mesh(new THREE.PlaneGeometry(sx, sz), mat, cx, y, cz, { rx: -Math.PI / 2, cast: false }); m.userData.dynamic = true;
  }
}
