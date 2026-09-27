// The Bermuda Triangle: Captain Undertow's floating base, a ring of steel
// decks round a pump tower in a storm, with a POLARIS landing pad and a
// laser-fenced gangway the only way on. Under it, the tanks that keep it up.
import * as THREE from "three";
import { M } from "../tex.js";
import { container, crateStack, bollard, torpedoParked, fish, corridor, pipe, bubbles } from "../seakit.js";

export function buildBermuda(w) {
  w.setSky("storm");
  w.terrain(400, 100, (x, z) => -30 + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5, M("sand", { args: [131, [90, 96, 100]], repeat: [40, 40] }));
  w.ocean({ level: 0, box: [0, 0, 240, 240], shallow: 0x2a5a6a, deep: 0x06141c, under: 0x08202a, see: 18, waves: 1.6, foam: 0.7 });
  const DECK = 3.0;
  const steel = M("metal", { args: [133, [70, 74, 84]], repeat: [12, 10], metal: 0.6, rough: 0.45 }), red = M("metal", { args: [134, [110, 30, 40]], repeat: [4, 4], metal: 0.5 }), dark = M(0x1a1e26, { metal: 0.7, rough: 0.4 });
  // the main deck, its rim, the tanks beneath
  w.box(80, 3, 70, steel, 0, DECK - 1.5, 0);
  for (const [x, z, sx, sz] of [[0, -35.2, 80, 0.5], [0, 35.2, 80, 0.5], [-40.2, 0, 0.5, 70], [40.2, 0, 0.5, 70]]) w.box(sx, 1.0, sz, M(0xffd23f, { emissive: 0xffd23f, ei: 0.5 }), x, DECK + 0.5, z, { collide: false });
  for (const [x, z] of [[-24, -20], [24, -20], [-24, 20], [24, 20], [0, 0]]) w.cyl(7, 7, 16, dark, x, -8, z, { seg: 20 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; w.mesh(new THREE.SphereGeometry(0.3, 8, 6), M(0xff3a3a, { emissive: 0xff2a2a, ei: 3 }), Math.cos(a) * 42, DECK + 0.4, Math.sin(a) * 37, { cast: false }); }
  // the pump tower in the middle of the north half
  const TX = 0, TZ = -14;
  w.cyl(6, 7, 40, red, TX, DECK + 20, TZ, { seg: 24 });
  w.phys.fixedCyl(TX, DECK + 20, TZ, 7, 20);
  for (let i = 0; i < 6; i++) w.mesh(new THREE.TorusGeometry(6.4, 0.3, 8, 32), dark, TX, DECK + 4 + i * 6, TZ, { rx: Math.PI / 2, cast: false });
  const core = w.mesh(new THREE.CylinderGeometry(2.2, 2.2, 36, 16), new THREE.MeshPhysicalMaterial({ color: 0x6ad8ff, emissive: 0x2a9aff, emissiveIntensity: 1.6, transparent: true, opacity: 0.85, roughness: 0.1 }), TX, DECK + 46, TZ, { cast: false });
  core.userData.dynamic = true; w.updaters.push((dt, t) => { core.material.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.6; core.rotation.y = t; });
  w.sign("UNDERTOW", 8, 1.6, TX, DECK + 10, TZ + 7.1, 0, { bg: "#3a0a14", fg: "#ff5a6a", glow: 1.5 });
  w.box(4, 5, 0.6, dark, TX, DECK + 2.5, TZ + 7, { collide: false }); w.sign("TOWER DOOR", 3, 0.6, TX, DECK + 5.4, TZ + 7.4, 0, { bg: "#1a1a24", fg: "#ffd23f" });
  pipe(w, [[TX + 6, DECK + 6, TZ], [TX + 16, DECK + 6, TZ - 6], [TX + 30, DECK + 5, TZ - 10], [TX + 38, DECK + 2, TZ - 12], [46, -4, -26], [50, -20, -40]], 1.0);
  pipe(w, [[TX - 6, DECK + 8, TZ], [TX - 18, DECK + 8, TZ + 4], [TX - 30, DECK + 6, TZ + 8], [TX - 38, DECK + 2, TZ + 8], [-46, -6, 8], [-52, -22, 20]], 1.0);
  // cranes, containers, crates, pipes and lamps about the deck
  const cols = [0x8a1a2a, 0x2ab8c8, 0x3a3a48, 0xffd23f];
  for (const [x, z, ry, i] of [[22, 22, 0.3, 0], [32, 16, 0, 1], [26, 6, 0.2, 2], [14, 28, -0.3, 3], [34, -2, 0.1, 0], [30, 30, 0, 1], [-30, -26, 0.2, 2], [-22, -30, 0, 3], [-34, 26, 0.3, 0]]) container(w, x, DECK, z, ry, cols[i]);
  for (const [x, z, n] of [[8, 14, 3], [36, 26, 4], [-14, 24, 3], [-36, 10, 2], [28, -24, 3], [-30, 0, 4]]) crateStack(w, x, DECK, z, n, [90, 96, 110]);
  for (const [x, z] of [[-36, -30], [36, -30], [-36, 30], [36, 30], [-14, -30], [14, 30]]) { w.cyl(0.1, 0.12, 5, dark, x, DECK + 2.5, z, { seg: 8 }); w.mesh(new THREE.SphereGeometry(0.25, 10, 8), M(0xff5a6a, { emissive: 0xff3a4a, ei: 4 }), x, DECK + 5.2, z, { cast: false }); const l = new THREE.PointLight(0xff5a6a, 10, 26, 1.6); l.position.set(x, DECK + 5, z); w.scene.add(l); }
  const crane = M(0xe8a020, { metal: 0.6, rough: 0.4 });
  w.box(2.4, 1.2, 2.4, dark, 30, DECK + 0.6, -20); w.cyl(0.5, 0.6, 14, crane, 30, DECK + 8, -20, { seg: 10 }); w.mesh(new THREE.BoxGeometry(0.6, 0.6, 18), crane, 30, DECK + 14.5, -12);
  // the landing pad and the gangway across to the deck
  w.box(14, 3, 14, steel, -30, DECK - 1.5, 56); w.box(13, 0.06, 13, M(0x2a3040), -30, DECK + 0.04, 56, { collide: false });
  w.mesh(new THREE.RingGeometry(3.6, 4, 40), M(0xffd23f, { emissive: 0xffd23f, ei: 1 }), -30, DECK + 0.08, 56, { rx: -Math.PI / 2, cast: false });
  w.sign("POLARIS", 4, 0.8, -30, DECK + 0.1, 51, 0, { bg: "#0c1a36", fg: "#9fe0ff" }).rotation.x = -Math.PI / 2;
  w.box(8, 1, 16, steel, -30, DECK - 0.5, 42);
  corridor(w, [-30, DECK, 52], [-30, DECK, 30], 7, dark, 3.2);
  // the dock for TORPEDO on the south edge, steps down to it
  w.box(10, 1, 8, steel, -18, 0.5, -40); w.steps(6, 3, 0.34, 0.6, steel, -18, 1.0, -36, 0);
  for (const x of [-22, -14]) bollard(w, x, 1.0, -43);
  torpedoParked(w, -18, 0, -46, Math.PI);
  // rain, and the odd flash of lightning
  const drops = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0x9ab8d8, transparent: true, opacity: 0.5 }), 500);
  const dd = []; for (let i = 0; i < 500; i++) dd.push([Math.random() * 80 - 40, Math.random() * 30, Math.random() * 80 - 40]);
  drops.frustumCulled = false; w.scene.add(drops);
  const mm = new THREE.Matrix4();
  w.updaters.push((dt) => { const c = w.camTarget || { x: 0, z: 0 }; const under = w.sea && w.sea.isUnder; drops.visible = !under; if (under) return; for (let i = 0; i < 500; i++) { const d = dd[i]; d[1] -= dt * 22; if (d[1] < 0) d[1] = 30; mm.makeTranslation(c.x + d[0], DECK + d[1], c.z + d[2]); drops.setMatrixAt(i, mm); } drops.instanceMatrix.needsUpdate = true; });
  w.updaters.push((dt, t) => { const f = Math.max(0, Math.sin(t * 0.7) * 30 - 29) + Math.max(0, Math.sin(t * 1.9 + 1) * 40 - 39.5); w.hemi.intensity = w.sky.hemi[2] + f * 1.5; });
  fish(w, 0, -12, 40, 14, 30, 0x9ad8ff, { size: 1.4 }); bubbles(w, 0, -20, 0, 6); bubbles(w, 24, -20, 20, 3);
  w.floorY = -50;
  w.missionData = {
    bm1: { start: [-30, DECK, 50], goal: [-30, DECK, 30], width: 6.4, beams: 11 },
    bm2: { start: [14, DECK, 20], goal: [32, DECK, -20], range: 9, guards: [{ path: [[16, 2], [36, 2]], speed: 1.8, pause: 1.4 }, { path: [[36, -12], [16, -12]], speed: 1.7, pause: 1.3, phase: 6 }, { path: [[24, 14], [24, -26]], speed: 1.5, pause: 1.6, phase: 11 }],
      route: [[14, DECK, 18], [20, DECK, 12], [20, DECK, -6], [30, DECK, -8], [32, DECK, -20]] },
    bm3: { title: "BASE POWER" },
    bm4: { start: [-18, -2.6, -50, Math.PI], exit: [-18, 1.05, -41, Math.PI], rings: [[-24, -6, -34, 2.4, 0.3], [-12, -8, -24, 2.4, 0.6], [-12, -10, -8, 2.4, 0], [-10, -12, 8, 2.4, 0.2], [-12, -9, 24, 2.4, 0.4], [0, -8, 30, 2.4, 1.6], [12, -9, 24, 2.4, 2.6], [10, -12, 8, 2.4, 3.0], [12, -10, -8, 2.4, 3.1], [12, -8, -24, 2.4, 2.6], [24, -6, -34, 2.4, 2.8]] },
    bm5: { entry: [-12, -1.6, -46], bubbles: [[-6, -4, -30], [16, -5, -6], [-20, -6, 12]], cells: [[-10, -4.5, -28], [4, -6, -24], [16, -5, -10], [16, -6.5, 8], [4, -5, 22], [-16, -6, 18], [-32, -5, 4], [-30, -6.5, -12]] },
    bm6: { center: [0, DECK, 12], radius: 14, height: 7 },
  };
  return { spawn: [-30, DECK, 60], yaw: Math.PI, bolt: [-28, DECK, 60], contact: null };
}
