// New York: a grid of avenues round a Times Square of giant screens,
// skyscrapers, a rooftop run, Central Park, and the Statue of Liberty across
// the water with her torch floating off.
import * as THREE from "three";
import { M } from "../tex.js";
import { thing } from "../props.js";
import { screenTex } from "./tokyo.js";

function skyscraper(w, x, z, bw, bh, bd, seed, o = {}) {
  w.building(bw, bh, bd, x, z, { wall: o.wall || [150 + (seed * 37) % 60, 160 + (seed * 13) % 50, 170 + (seed * 7) % 40], seed, win: { lit: 0.25, glass: o.glass || "#5a88b8", tall: true }, trim: 0x6a7078, roof: o.roof });
  if (o.spire) { w.box(bw * 0.6, bh * 0.12, bd * 0.6, M(0xc8c0b0), x, bh + bh * 0.06, z, { collide: false }); w.box(bw * 0.3, bh * 0.08, bd * 0.3, M(0xc8c0b0), x, bh * 1.16, z, { collide: false }); w.cyl(0.2, 0.6, bh * 0.25, M(0xd8d8e0, { metal: 0.7 }), x, bh * 1.32, z, { collide: false }); w.sphere(0.5, M(0xff3a3a, { emissive: 0xff2a2a, ei: 4 }), x, bh * 1.45, z, { collide: false }); }
}
function liberty(w, x, z) {
  const green = M(0x6ab8a0, { rough: 0.6, metal: 0.3 }), stone = M("stone", { args: [101, [200, 186, 160]], repeat: [2, 2] });
  w.mesh(new THREE.CylinderGeometry(22, 26, 3, 32), M("grass", { args: [103], repeat: [6, 6] }), x, 0, z, { cast: false });
  w.box(14, 16, 14, stone, x, 9.5, z, { collide: false });
  const g = new THREE.Group(); g.position.set(x, 17.5, z); g.rotation.y = Math.PI; w.scene.add(g);
  const add = (geo, px, py, pz, rx = 0, rz = 0) => { const me = new THREE.Mesh(geo, green); me.position.set(px, py, pz); me.rotation.set(rx, 0, rz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(3.2, 5, 22, 16), 0, 11, 0);
  add(new THREE.SphereGeometry(2.4, 16, 12), 0, 24, 0);
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.35; add(new THREE.ConeGeometry(0.35, 2.4, 6), Math.sin(a) * 2.6, 26.2 + Math.cos(a) * 0.4, 0, 0, -a); }
  add(new THREE.CylinderGeometry(0.6, 0.7, 12, 10), 3.4, 26, 0, 0, -0.25);
  add(new THREE.BoxGeometry(2.2, 3, 0.8), -3.2, 18, 1.2, 0, 0.3);
  // the torch has come loose and floats above her hand, still burning
  const torch = new THREE.Group(); w.scene.add(torch);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.6, 1.4, 12), M(0xd8a830, { metal: 0.8, rough: 0.3 })); torch.add(cup);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 12), M(0xffb020, { emissive: 0xffa020, ei: 5 })); flame.position.y = 1.9; torch.add(flame);
  w.updaters.push((dt, t) => { torch.position.set(x - 5.4, 17.5 + 36 + Math.sin(t * 0.9) * 1.5, z + Math.sin(t * 0.5) * 0.8); flame.scale.set(1 + Math.sin(t * 13) * 0.1, 1 + Math.sin(t * 17) * 0.15, 1); });
}

export function buildNewYork(w) {
  w.setSky("day");
  w.ground(M("asphalt", { args: [105], repeat: [60, 60] }), 500);
  w.water(600, 300, 0, 0.05, 260, 0x2a5a7a, { opacity: 0.95 });
  // pavements: the blocks between the avenues
  const pave = M("paving", { args: [107, [178, 172, 164], 32], repeat: [6, 6] });
  const roadsX = [-30, 0, 30], roadsZ = [-30, 0, 30];
  const blocks = [];
  for (const bx of [-45, -15, 15, 45]) for (const bz of [-45, -15, 15, 45]) { w.box(18, 0.18, 18, pave, bx, 0.09, bz); blocks.push([bx, bz]); }
  // lane lines and crossings
  const white = M(0xf4f4f4, { rough: 0.6 }), yellow = M(0xf0c020, { rough: 0.6 });
  for (const x of roadsX) for (let z = -60; z <= 60; z += 5) if (!roadsZ.some(rz => Math.abs(z - rz) < 7)) w.box(0.2, 0.02, 2.6, yellow, x, 0.011, z, { collide: false });
  for (const z of roadsZ) for (let x = -60; x <= 60; x += 5) if (!roadsX.some(rx => Math.abs(x - rx) < 7)) w.box(2.6, 0.02, 0.2, yellow, x, 0.011, z, { collide: false });
  for (const x of roadsX) for (const z of roadsZ) for (let i = -4; i <= 4; i++) { w.box(0.6, 0.02, 3, white, x + i * 1.3, 0.012, z - 7.5, { collide: false }); w.box(3, 0.02, 0.6, white, x - 7.5, 0.012, z + i * 1.3, { collide: false }); }
  // Times Square: the middle blocks are covered in screens
  const ads = ["ZERO COLA", "BROADWAY", "PIZZA!", "I ♥ NY", "ROBO NEWS", "TAXI"];
  const screens = [];
  for (const [bx, bz] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) {
    const h = 34 + ((bx + bz + 60) % 20);
    skyscraper(w, bx, bz, 14, h, 14, Math.abs(bx * 7 + bz), {});
    const faceX = bx > 0 ? bx - 7.05 : bx + 7.05, faceZ = bz > 0 ? bz - 7.05 : bz + 7.05;
    const txt = ads[screens.length % ads.length];
    const sc = screenTex(256, 160, (g, W, H, t) => { if (w.powerOff) { g.fillStyle = "#0a0a0e"; g.fillRect(0, 0, W, H); return; } const k = Math.floor(t * 0.5 + screens.length) % 3; g.fillStyle = ["#e8302a", "#1a4ad8", "#18181c"][k]; g.fillRect(0, 0, W, H); g.fillStyle = k === 2 ? "#ffd166" : "#fff"; g.font = "900 40px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, W / 2, H / 2 + Math.sin(t * 2) * 6); });
    const mat = new THREE.MeshStandardMaterial({ map: sc.t, emissiveMap: sc.t, emissive: 0xffffff, emissiveIntensity: 1.2 });
    const a = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.2), mat); a.position.set(faceX, 12, bz); a.rotation.y = bx > 0 ? -Math.PI / 2 : Math.PI / 2; w.scene.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.2), mat); b.position.set(bx, 20, faceZ); b.rotation.y = bz > 0 ? Math.PI : 0; w.scene.add(b);
    screens.push(sc);
  }
  let st = 0; w.updaters.push((dt, t) => { st -= dt; if (st <= 0) { st = 0.15; screens.forEach(s => s.draw(t)); } });
  w.screens = screens;
  // the outer blocks: skyscrapers, and the Empire State
  let seed = 1;
  for (const [bx, bz] of blocks) { if (Math.abs(bx) < 20 && Math.abs(bz) < 20) continue; if (bx === -45 && bz === -45) continue; if (bx === 45 && bz === 45) continue; const h = 30 + (seed * 29) % 60; skyscraper(w, bx, bz, 15, h, 15, seed++, { spire: bx === 45 && bz === -45 }); }
  // the rooftop run: three low buildings in the south-east block, rising
  const roofM = M("metal", { args: [109, [120, 124, 130]], repeat: [2, 2] });
  w.box(6, 8, 6, M("brick", { args: [111], repeat: [2, 2] }), 40, 4, 40); w.box(6, 11, 6, M("brick", { args: [112, [120, 60, 50], [110, 56, 46]], repeat: [2, 3] }), 49, 5.5, 40); w.box(6, 14, 6, M("brick", { args: [113, [140, 110, 90], [120, 96, 80]], repeat: [2, 4] }), 49, 7, 49);
  w.box(6, 0.3, 6, roofM, 40, 8.15, 49);
  w.platform(2.4, 0.3, 2, M(0xf0c020, { rough: 0.5 }), 35.6, 1, 40, t => [35.6, 1 + (Math.sin(t * 0.6) + 1) * 3.6, 40]);
  w.pad(41.5, 8, 41.5, 12, 0xff5ad8); w.pad(50.5, 11, 41.5, 12, 0xff5ad8);
  w.pad(44.5, 0.18, 36, 13, 0x39f0ff);
  // Central Park in the north-west block, with a pond
  w.box(18, 0.3, 18, M("grass", { args: [115], repeat: [4, 4] }), -45, 0.15, -45);
  for (const [x, z] of [[-50, -50], [-40, -52], [-52, -40], [-38, -40], [-46, -38]]) w.tree(x, z, 7, { y: 0.3 });
  w.water(6, 5, -44, 0.35, -45, 0x2a6a7a);
  // lamps, hot dog carts, parked taxis, fire hydrants
  for (const x of roadsX) for (const z of [-45, -15, 15, 45]) { w.lamp(x - 7.4, z, 5, 0xfff0d0); }
  for (const [x, z, ry] of [[-8, 44, 0], [8, -44, Math.PI], [-44, 8, Math.PI / 2]]) { const c = thing("cart", 0xe8e0d0); c.position.set(x, 0.18, z); c.rotation.y = ry; w.scene.add(c); w.phys.fixedBox(x, 0.8, z, 0.8, 0.8, 0.8); }
  for (const [x, z, ry] of [[-26, 40, 0], [26, -40, 0], [-40, 26, Math.PI / 2]]) { const c = thing("car", 0xf4c820); c.position.set(x, 0, z); c.rotation.y = ry; w.scene.add(c); w.phys.fixedBox(x, 0.9, z, ry ? 1.9 : 1, 0.9, ry ? 1 : 1.9); }
  liberty(w, 20, 200);
  w.floorY = -20;
  const loop = [[-30, -30], [0, -31], [30, -30], [31, 0], [30, 30], [0, 31], [-30, 30], [-31, 0]];
  w.missionData = {
    ny1: { things: [["car", -4, 0, 6, 0, 0xf4c820], ["cart", 4, 0.02, -6, 0.3, 0xe8e0d0], ["car", 5, 0, 8, 1.4, 0xf4c820], ["bench", -6, 0.02, -4, 0.2], ["car", -6, 0, -8, 0.4, 0xf4c820], ["cart", 6, 0.02, 3, 1.1, 0xe8e0d0], ["bin", 2, 0.02, 10, 0], ["car", 0, 0, -12, 1.57, 0xf4c820]] },
    ny2: { cells: [[40, 9.3, 40], [49, 12.3, 40], [49, 15.3, 49], [40, 9.4, 49], [35.6, 6, 40], [44.5, 5, 36], [49, 18, 49], [40, 12, 44.5]] },
    ny3: { title: "POWER TO THE SQUARE" },
    ny4: { path: loop, y: 0.3, car: "taxi", quarry: "jeep", lead: 30 },
  };
  return { spawn: [0, 0.05, 24], yaw: Math.PI, bolt: [2, 0.05, 23], contact: [-3.5, 0.05, 21, 2.4], apply: save => { w.powerOff = !save.done.includes("ny3"); } };
}
