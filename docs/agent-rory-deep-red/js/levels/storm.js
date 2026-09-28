// The Dust Storm, on the plains of Utopia Planitia: dunes marching away into orange murk, a
// dry lake bed as flat as a table where Sol races his sand yacht, and Sol's camp on the dunes
// to the north with the weather station beside it. Out in the murk, Undertow's great storm
// fans turn, blowing the dust up to hide her dome. Fix the weather station and the fans slow,
// the dust settles and you can see a long way.
import * as THREE from "three";
import { M } from "../tex.js";
import { Car } from "../vehicle.js";
import { module, marsGround, marsRock, glassDome, dustDevil, parkedCar, stormFan } from "./spacekit.js";

const PAN = { x: 0, z: -34, rx: 92, rz: 62 };
const CAMP = { x: -8, z: 52, r: 22 };
export function ground(x, z) {
  // dunes, their crests across the wind
  let h = Math.sin((x * 0.8 + z * 0.35) * 0.075) * 1.8 + Math.sin((x * 0.5 - z * 0.2) * 0.13 + 1.3) * 0.7 + Math.cos(z * 0.05) * 0.6 + 0.6;
  // the dry lake bed, and the camp's flat
  const pan = Math.min(1, Math.max(0, (1.12 - Math.hypot((x - PAN.x) / PAN.rx, (z - PAN.z) / PAN.rz)) * 6));
  const camp = Math.min(1, Math.max(0, 1.5 - Math.hypot(x - CAMP.x, z - CAMP.z) / CAMP.r));
  h = h * (1 - pan) - 0.4 * pan;
  return h * (1 - camp) + 1.2 * camp;
}

export function buildStorm(w) {
  w.setSky("duststorm");
  const G = ground;
  w.terrain(460, 140, G, marsGround(361, [200, 118, 72], 70));
  w.overlay(PAN.x, PAN.z, PAN.rx * 2.2, PAN.rz * 2.2, M("sand", { args: [363, [214, 150, 108]], repeat: [50, 50] }), (x, z) => Math.hypot((x - PAN.x) / PAN.rx, (z - PAN.z) / PAN.rz) < 0.98);
  w.phys.fixedBox(0, -20, 0, 400, 1, 400);
  w.floorY = -30;

  // ---- the chase round the lake bed (and rocks everywhere else)
  const LOOP = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; LOOP.push([PAN.x + Math.cos(a) * 70, PAN.z + Math.sin(a) * 42]); }
  for (let i = 0; i < 60; i++) {
    const a = i * 2.39996, d = 24 + (i * 53) % 150, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot((x - PAN.x) / PAN.rx, (z - PAN.z) / PAN.rz) < 1.1 || Math.hypot(x - CAMP.x, z - CAMP.z) < CAMP.r + 6) continue;
    marsRock(w, x, G(x, z), z, 0.5 + (i % 5) * 0.35, { collide: i % 5 > 1 });
  }

  // ---- Sol's camp: his hab, the POLARIS rover, his sand yacht, a windsock
  const cy = G(CAMP.x, CAMP.z);
  glassDome(w, CAMP.x - 10, cy, CAMP.z + 10, 5, { color: 0xffe0c0 });
  module(w, CAMP.x + 6, cy + 2.2, CAMP.z + 12, 0, 8, [230, 214, 196], 2.2);
  w.sign("SOL'S CAMP", 4, 0.8, CAMP.x + 6, cy + 5, CAMP.z + 9.7, Math.PI, { bg: "#0a2a2a", fg: "#7ff4e8", glow: 0.9 });
  parkedCar(w, Car, CAMP.x + 12, cy, CAMP.z - 2, 0.4, "yacht");
  parkedCar(w, Car, CAMP.x - 14, cy, CAMP.z - 4, -0.6, "rover");
  w.cyl(0.06, 0.06, 5, M(0xe8e8ec, { metal: 0.5 }), CAMP.x + 2, cy + 2.5, CAMP.z - 6, { collide: false });
  const sock = w.mesh(new THREE.ConeGeometry(0.35, 1.6, 10, 1, true), M(0xff7a1a, { side: THREE.DoubleSide }), CAMP.x + 2.8, cy + 4.8, CAMP.z - 6, { rz: -Math.PI / 2, cast: false }); sock.userData.dynamic = true;
  w.updaters.push((dt, t) => { sock.rotation.y = -0.35 + Math.sin(t * 3) * (w.calm ? 0.05 : 0.2); sock.rotation.z = w.calm ? -0.4 : -Math.PI / 2 + Math.sin(t * 7) * 0.08; });
  // ---- the weather station: a mast of instruments and a hut
  const WX = CAMP.x + 26, WZ = CAMP.z + 16, wy = G(WX, WZ);
  w.building(4, 3, 4, WX, WZ, { y: wy - 0.2, wall: [230, 230, 236], seed: 365, win: { lit: 0.8, glass: "#3a6a9a" }, trim: 0x2ad0c0 });
  w.cyl(0.12, 0.16, 12, M(0xd8dde4, { metal: 0.6 }), WX + 4, wy + 6, WZ, { seg: 8 });
  const cups = new THREE.Group(); cups.position.set(WX + 4, wy + 12.2, WZ); w.scene.add(cups);
  for (let k = 0; k < 3; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.05), M(0xd8dde4)); arm.rotation.y = k * Math.PI * 2 / 3; arm.position.set(Math.cos(k * 2.09) * 0.6, 0, -Math.sin(k * 2.09) * 0.6); cups.add(arm); const c = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI), M(0xff7a1a)); c.position.set(Math.cos(k * 2.09) * 1.2, 0, -Math.sin(k * 2.09) * 1.2); cups.add(c); }
  cups.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  w.updaters.push(dt => { cups.rotation.y += dt * (w.calm ? 1 : 9); });
  w.sign("WEATHER STATION", 4, 0.7, WX, wy + 3.6, WZ - 2.05, Math.PI, { bg: "#0a2a2a", fg: "#7ff4e8", glow: 0.9 });

  // ---- Undertow's storm fans, out in the murk, and dust devils wandering the dunes
  stormFan(w, 90, G(90, 70) - 1, 70, -2.2);
  stormFan(w, -100, G(-100, 40) - 1, 40, 2.0);
  stormFan(w, 30, G(30, -130) - 1, -130, 0.2);
  dustDevil(w, 60, 20, 30); dustDevil(w, -70, -10, 40, { phase: 2 }); dustDevil(w, 20, -120, 30, { phase: 4, h: 34 });

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  // (the path beacons: posts with a lamp, which the missing ones stand beside)
  const CELLS = [[CAMP.x + 33, CAMP.z + 10], [CAMP.x + 53, CAMP.z - 12], [CAMP.x + 68, CAMP.z - 42], [CAMP.x + 38, CAMP.z - 58], [CAMP.x - 12, CAMP.z - 42], [CAMP.x - 37, CAMP.z - 22], [CAMP.x - 52, CAMP.z + 10]];
  for (const [x, z] of CELLS) { w.cyl(0.08, 0.1, 2.2, M(0x3a4048, { metal: 0.6 }), x + 1.4, G(x + 1.4, z) + 1.1, z, { collide: false, seg: 6 }); }
  w.missionData = {
    sto1: { path: LOOP, y: 0.4, car: "yacht", carOpts: { grip: 2.2 }, quarry: "yacht", lead: 26 },
    sto2: { cells: CELLS.map(([x, z]) => on(x, z)) },
    sto3: { area: [CAMP.x + 22, CAMP.z - 26, 13] },
    sto4: { pad: on(CAMP.x - 22, CAMP.z + 6, 0), padR: 2.4, size: 1.1, gravity: 1, blocks: [on(CAMP.x - 14, CAMP.z + 16, 1), on(CAMP.x - 30, CAMP.z + 14, 1), on(CAMP.x - 30, CAMP.z - 4, 1), on(CAMP.x - 18, CAMP.z - 10, 1), on(CAMP.x - 8, CAMP.z + 4, 1)] },
    sto5: { title: "THE WEATHER STATION" },
    sto6: { word: "SUMMIT", title: "DRIP SIGNALS" },
  };
  return {
    stars: [on(-130, 90, 0.2), on(120, -60, 0.2), on(10, 150, 0.2)],
    spawn: on(CAMP.x - 2, CAMP.z - 2, 0.1), yaw: Math.PI, bolt: on(CAMP.x - 4, CAMP.z - 1, 0), contact: [...on(CAMP.x + 3, CAMP.z, 0), -Math.PI / 2],
    // (the storm blows itself out once the weather station switches the fans off)
    apply: save => { w.calm = save.done.includes("sto5"); if (w.scene.fog) { w.scene.fog.near = w.calm ? 50 : 14; w.scene.fog.far = w.calm ? 380 : 110; } if (w.wind) w.wind.set(w.calm ? 1.5 : 11, 0, w.calm ? 0.5 : 4); },
    at: { sto1: [CAMP.x + 6, CAMP.z - 16, 20], sto2: [CAMP.x + 16, CAMP.z + 4, 20], sto3: [CAMP.x + 12, CAMP.z - 10, 20], sto4: [CAMP.x - 16, CAMP.z + 4, 20], sto5: [WX - 4, WZ - 5, 20], sto6: [CAMP.x - 4, CAMP.z + 6, 20] },
  };
}
