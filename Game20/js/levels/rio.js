// Rio de Janeiro at carnival sunset: the wave-patterned promenade, Sugarloaf
// with its cable car, the parade avenue with giant floats, and the arena
// where the Big Floater waits.
import * as THREE from "three";
import { M, TEX } from "../tex.js";
import { makePerson, animatePerson } from "../people.js";

function wavePave() {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#1c1c20";
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, k * 64); for (let x = 0; x <= 256; x += 8) g.lineTo(x, k * 64 + Math.sin(x / 256 * Math.PI * 4) * 16); for (let x = 256; x >= 0; x -= 8) g.lineTo(x, k * 64 + 26 + Math.sin(x / 256 * Math.PI * 4) * 16); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(20, 3); t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
}
function sugarloaf(w, x, z) {
  const rock = M(0x6a6058, { rough: 0.95, flat: true }), green = M(0x3a7a3a, { rough: 0.95, flat: true });
  const loaf = w.mesh(new THREE.SphereGeometry(30, 24, 18), rock, x, 0, z, { cast: false }); loaf.scale.set(0.8, 2.0, 0.9);
  const cap = w.mesh(new THREE.SphereGeometry(30.5, 24, 18, 0, Math.PI * 2, 1.25, 1.1), green, x, 0, z, { cast: false }); cap.scale.set(0.8, 2.0, 0.9);
  const hill = w.mesh(new THREE.SphereGeometry(22, 20, 14), rock, x - 55, 0, z + 20, { cast: false }); hill.scale.set(1, 1.1, 1);
  return { top: new THREE.Vector3(x, 58, z), mid: new THREE.Vector3(x - 55, 23, z + 20) };
}
function cableCar(w, a, b, phase, color) {
  // a gondola sliding along the cable between a and b and back, that you can stand on
  const g = new THREE.Group(); w.scene.add(g);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.6), new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.3 })); body.position.y = -1.1; body.castShadow = true; g.add(body);
  const win = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.9, 2.64), M(0x2a3a4a, { rough: 0.1, metal: 0.6 })); win.position.y = -0.8; g.add(win);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), M(0x3a3a3a, { metal: 0.7 })); arm.position.y = 0.8; g.add(arm);
  const fn = t => { const u = (Math.sin(t * 0.09 + phase) + 1) / 2; return [a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u - 1.6, a.z + (b.z - a.z) * u, 0]; };
  const roof = new THREE.Object3D(); w.scene.add(roof);
  w.phys.mover(roof, 1.3, 0.1, 1.3, t => { const [x, y, z] = fn(t); return [x, y + 0.1, z, 0]; });
  w.updaters.push(() => { const [x, y, z] = fn(w.phys.t); g.position.set(x, y, z); });
  return { g, roof, fn };
}
function float(w, x, z, color, kind) {
  // a carnival float: a wheeled stage with a giant character on top
  const g = new THREE.Group(); g.position.set(x, 0, z); w.scene.add(g);
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 9), M(color, { rough: 0.4 })); base.position.y = 1; base.castShadow = true; g.add(base);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 9.2), M(0xffd23f, { rough: 0.3, metal: 0.5, emissive: 0xffa020, ei: 0.4 })); trim.position.y = 1.8; g.add(trim);
  const add = (geo, c, px, py, pz, e = 0) => { const me = new THREE.Mesh(geo, M(c, { rough: 0.4, emissive: e ? c : 0, ei: e })); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  if (kind === "parrot") { add(new THREE.SphereGeometry(1.6, 18, 14), 0x2ab04a, 0, 4, 0).scale.set(1, 1.3, 1); add(new THREE.SphereGeometry(1.1, 16, 12), 0x3ad05a, 0, 6.2, 0.6); add(new THREE.ConeGeometry(0.5, 1.2, 10), 0xffc020, 0, 6, 1.8).rotation.x = Math.PI / 2; for (const s of [-1, 1]) add(new THREE.SphereGeometry(1.2, 12, 8), 0xe83a3a, s * 1.8, 4.2, -0.3).scale.set(0.4, 1.4, 1); }
  if (kind === "sun") { add(new THREE.SphereGeometry(2, 20, 16), 0xffc020, 0, 4.4, 0, 1.2); for (let i = 0; i < 10; i++) { const r = add(new THREE.ConeGeometry(0.4, 1.8, 8), 0xff8a20, Math.cos(i / 10 * 6.28) * 2.8, 4.4 + Math.sin(i / 10 * 6.28) * 2.8, 0, 0.8); r.rotation.z = i / 10 * 6.28 - Math.PI / 2; } }
  if (kind === "drum") { add(new THREE.CylinderGeometry(1.8, 1.8, 2.6, 20), 0xe8e8f0, 0, 3.4, 0); add(new THREE.CylinderGeometry(1.85, 1.85, 0.3, 20), 0xe83a3a, 0, 4.7, 0); add(new THREE.CylinderGeometry(1.85, 1.85, 0.3, 20), 0xe83a3a, 0, 2.1, 0); }
  if (kind === "pineapple") { add(new THREE.SphereGeometry(1.7, 16, 12), 0xe8b020, 0, 4, 0).scale.set(1, 1.4, 1); for (let i = 0; i < 6; i++) { const l = add(new THREE.ConeGeometry(0.35, 2.2, 6), 0x3aa03a, Math.cos(i) * 0.5, 6.8, Math.sin(i) * 0.5); l.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i) * 0.5); } }
  return g;
}
function drummers(w, x, z, n) {
  // rows of carnival people bobbing in time
  {
    const rigs = [];
    const coats = [0xff3a6a, 0xffd23f, 0x3ad0ff, 0x7bed9f, 0xff9a3a, 0xb06ad8];
    for (let i = 0; i < n; i++) {
      const rig = makePerson({ coat: coats[i % 6], trousers: 0xf4f4f4, skin: [0xf0c8a0, 0xa8784e, 0x6a3a1a, 0xd8a880][i % 4], hair: 0x1a1010, hairStyle: ["short", "curly", "bun", "long"][i % 4], hat: i % 3 === 0 ? "straw" : undefined });
      rig.root.position.set(x + (i % 4) * 1.4, 0.2, z + Math.floor(i / 4) * 1.6); rig.root.rotation.y = Math.PI / 2; rig.root.traverse(o => { o.castShadow = false; }); w.scene.add(rig.root); rigs.push(rig);
    }
    w.updaters.push((dt, t) => { for (const [i, r] of rigs.entries()) { animatePerson(r, { dt, speed: 0, grounded: true }); r.root.position.y = 0.2 + Math.abs(Math.sin(t * 5.2 + i)) * 0.15; r.armL.rotation.x = -1.2 + Math.sin(t * 10.4 + i) * 0.6; r.armR.rotation.x = -1.2 - Math.sin(t * 10.4 + i) * 0.6; } });
  }
}

export function buildRio(w) {
  w.setSky("sunset");
  w.water(800, 400, 0, -0.35, -230, 0x1a6a9a, { opacity: 0.95 });
  w.phys.fixedBox(0, -6, 0, 400, 1, 400);
  w.floorY = -3;
  // beach, promenade and the avenue
  w.box(300, 1, 30, M("sand", { args: [81, [240, 214, 170]], repeat: [40, 4] }), 0, -0.4, -45);
  w.box(300, 1, 10, wavePave(), 0, -0.3, -25);
  w.box(300, 1, 105, M("asphalt", { args: [83], repeat: [40, 14] }), 0, -0.3, 32.5);
  const loaf = sugarloaf(w, 70, -120);
  // the cable car line up the mountain
  const st0 = new THREE.Vector3(24, 8, -27), st1 = loaf.mid.clone().setY(loaf.mid.y + 12), st2 = loaf.top.clone().setY(loaf.top.y + 6);
  w.box(8, 8, 8, M("stone", { args: [87, [220, 214, 200]] }), st0.x, 4, st0.z - 5);
  w.steps(23, 3, 0.345, 0.42, M("metal", { args: [88] }), st0.x - 6.5, 0.2, st0.z + 5, Math.PI);
  w.box(3, 0.4, 6, M("metal", { args: [88] }), st0.x - 6.5, 7.9, st0.z - 2.7);
  for (const [a, b] of [[st0, st1], [st1, st2]]) { const len = a.distanceTo(b); const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 4), M(0x1a1a1a)); cab.position.copy(a).add(b).multiplyScalar(0.5); cab.lookAt(b); cab.rotateX(Math.PI / 2); w.scene.add(cab); }
  const cars = [cableCar(w, st0.clone().setY(st0.y + 1.6), st1, -1.2, 0xe83a3a), cableCar(w, st0.clone().setY(st0.y + 1.6), st1, 1.4, 0xffd23f)];
  w.cars = cars;
  // city behind, with hills
  for (let i = 0; i < 14; i++) w.building(12, 18 + (i * 11) % 30, 12, -90 + i * 14, 110, { wall: [236 - (i % 3) * 16, 220, 200 - (i % 4) * 10], seed: 90 + i, win: { lit: 0.5, glow: "#ffd8a0" }, ei: 0.6 });
  w.mountains(10, 260, 80, { seed: 7, snow: false, color: 0x4a6a3a });
  for (let x = -100; x <= 100; x += 12) { if (Math.abs(x + 70) < 26) continue; w.palm(x, -18, 9); w.lamp(x + 6, -20, 5, 0xffe0a0, { ei: 5 }); }
  // the parade: floats rolling slowly round the avenue loop, drummers on the kerb
  const floats = [float(w, -30, 32, 0x2a8ad8, "parrot"), float(w, 0, 44, 0xe83a6a, "sun"), float(w, 30, 32, 0x7bed9f, "drum"), float(w, 0, 20, 0xb06ad8, "pineapple")];
  const loop = new THREE.CatmullRomCurve3([[-45, 30], [0, 46], [45, 30], [0, 22]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true);
  w.updaters.push((dt, t) => floats.forEach((f, i) => { const u = (t * 0.008 + i / 4) % 1, p = loop.getPointAt(u), tg = loop.getTangentAt(u); f.position.set(p.x, 0.2, p.z); f.rotation.y = Math.atan2(tg.x, tg.z); }));
  drummers(w, -20, 6, 8); drummers(w, 12, 6, 6);
  // bunting and a confetti sky
  for (let i = 0; i < 30; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), M([0xff3a6a, 0xffd23f, 0x3ad0ff, 0x7bed9f][i % 4], { side: THREE.DoubleSide })); f.position.set(-45 + i * 3, 6 - Math.sin(i / 29 * Math.PI) * 1.2, 12); w.scene.add(f); }
  // the arena: a round plaza of wave paving with stands, where the boss waits
  const arena = new THREE.Vector3(-70, 0.2, -2);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 0.2, 48), wavePave()); disc.position.set(arena.x, 0.1, arena.z); disc.receiveShadow = true; w.scene.add(disc);
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; if (Math.abs(Math.sin(a) - 1) < 0.2) continue; w.box(4, 1.6 + (i % 2) * 0.6, 2.4, M([0x3ad0ff, 0xffd23f, 0xff3a6a, 0x7bed9f][i % 4], { rough: 0.5 }), arena.x + Math.cos(a) * 23, 0.9, arena.z + Math.sin(a) * 23, { ry: -a + Math.PI / 2 }); }
  w.sign("BIG FLOATER SHOW", 10, 1.6, arena.x, 5, arena.z - 24.5, 0, { bg: "#3a1040", fg: "#ffd166", glow: 1.4 });
  // fireworks over the bay
  const fw = [];
  w.updaters.push((dt, t) => { if (Math.random() < dt * 0.8 && w.fx) { const x = -60 + Math.random() * 120, y = 40 + Math.random() * 20, z = -120 - Math.random() * 60; w.fx.burst(x, y, z, [0xff3a6a, 0xffd23f, 0x3ad0ff, 0x7bed9f][Math.floor(Math.random() * 4)], 60, { speed: 14, life: 1.6, size: 1.4, gravity: -4, up: 0 }); } void fw; });
  const loopPath = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; loopPath.push([Math.cos(a) * 50, 34 + Math.sin(a) * 21]); }
  w.missionData = {
    rio1: { area: [0, 32, 16], bots: [[-10, 0.2, 30], [10, 0.2, 34], [0, 0.2, 40], [-16, 0.2, 38], [16, 0.2, 26], [4, 0.2, 24]] },
    rio2: { cells: [{ obj: cars[0].g, off: [0, 1.0, 0] }, { obj: cars[1].g, off: [0, 1.0, 0] }, [st0.x - 6.5, 9.2, st0.z - 2.7], [st1.x, st1.y - 0.4, st1.z], [st1.x, st1.y - 0.4, st1.z + 6], [st0.x - 6.5, 4.2, st0.z + 1], [st0.x, 9.2, st0.z - 5]] },
    rio3: { path: loopPath, y: 0.4, car: "kart", quarry: "kart", lead: 24 },
    rio4: { center: [arena.x, 0.2, arena.z], radius: 18, height: 6.5 },
  };
  // the landing at the top of the mountain station and the middle hill, so the cable car has somewhere to go
  w.box(8, 0.6, 8, M("stone", { args: [87, [220, 214, 200]] }), st1.x, st1.y - 1.9, st1.z + 6);
  return { spawn: [0, 0.2, 10], yaw: Math.PI, bolt: [2, 0.2, 9], contact: [-3, 0.2, 8, 2.4] };
}
void TEX;
