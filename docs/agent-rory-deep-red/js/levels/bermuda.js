// The Bermuda Triangle: grey sea, fog and lightning, and Undertow's floating
// base as big as a town, standing on twelve legs over water a mile deep. Nia's
// cutter is tied up at the landing stage; stairs climb to the deck, where Drip
// guards patrol between the containers; the pump hall and its control room run
// along one side and the helipad (the Kraken's arena) the other. Below the
// deck, between the legs, the sonar markers lead down into the dark.
import * as THREE from "three";
import { M } from "../tex.js";
import { boat } from "./kit.js";
import { roam, school } from "../critters.js";

export function buildBermuda(w) {
  w.setSky({ top: "#1a2230", mid: "#4a5462", bottom: "#626a74", sun: [28, 120], sunColor: "#c8d2e4", sunI: 1.0, hemi: ["#8a98ae", "#262a30", 0.64], fog: [36, 230], clouds: 30, cloudTint: "#5a6474" });
  const LV = 0, D = 9;
  const h = (x, z) => -80 + Math.sin(x * 0.02) * Math.cos(z * 0.025) * 6;
  w.terrain(460, 115, h, M("sand", { args: [14, [120, 116, 104]], repeat: [60, 60] }));
  w.ocean({ level: LV, box: [0, 0, 200, 200], shallow: 0x3a5a6a, deep: 0x0a1a2a, under: 0x14303e, deepUnder: 0x010308, clear: 0.15, waves: 1.6, absorb: [0.24, 0.1, 0.07], see: 30, caustics: 3 });
  // lightning: now and then the whole sky flashes
  // (added on top of whatever the light is, so a mission can dim the day without the storm undoing it)
  let flash = 0, next = 6, added = 0;
  w.updaters.push(dt => { next -= dt; if (next < 0) { flash = 1; next = 5 + Math.random() * 9; } flash = Math.max(0, flash - dt * 3); w.hemi.intensity -= added; added = flash * flash * 2.5; w.hemi.intensity += added; });

  // ---- the base: a deck on twelve legs, rails round the edge, the landing stage and its stairs
  const plate = M("metal", { args: [11, [96, 104, 112], 64], repeat: [25, 18], metal: 0.5, rough: 0.5 });
  w.box(100, 1.2, 70, plate, 0, D - 0.6, 0);
  w.box(100.4, 2.2, 70.4, M(0x2a3038, { metal: 0.5 }), 0, D - 2.3, 0, { collide: false });
  const legM = M("metal", { args: [12, [70, 76, 84], 64], repeat: [2, 6], metal: 0.6, rough: 0.4 });
  const LEGS = [];
  for (const x of [-40, -13, 13, 40]) for (const z of [-25, 0, 25]) { w.cyl(2.5, 2.8, 36, legM, x, D - 19, z, { seg: 16 }); LEGS.push([x, z]); for (let y = -1; y > -16; y -= 6) w.mesh(new THREE.TorusGeometry(2.7, 0.2, 6, 20), M(0xd8b020, { metal: 0.4 }), x, y, z, { rx: Math.PI / 2 }); }
  const railM = M(0xd8b020, { metal: 0.4, rough: 0.5 });
  w.fence(-50, -35, -2, -35, 1.1, railM, { y: D }); w.fence(2, -35, 50, -35, 1.1, railM, { y: D });
  w.fence(-50, 35, 50, 35, 1.1, railM, { y: D }); w.fence(-50, -35, -50, 35, 1.1, railM, { y: D }); w.fence(50, -35, 50, 35, 1.1, railM, { y: D });
  const dock = M("wood", { args: [9, [110, 96, 80]], repeat: [6, 2] });
  w.box(24, 1.2, 8, dock, 0, 0.6, -42);
  // the stairs: a long flight along the back of the landing stage (gentle steps a child can run
  // up), a landing at the top that bridges to the gap in the deck rail, and a handrail
  const stairM = M("metal", { args: [9, [140, 150, 160]] });
  w.steps(22, 2.5, 7.8 / 22, 0.45, stairM, -11, 1.2, -39.25, Math.PI / 2);
  w.box(3.4, 0.3, 5.5, stairM, 0.6, D - 0.15, -37.75);
  w.fence(-11, -38.05, -1.1, -38.05, 1, railM, { y: x => 1.2 + Math.min(1, Math.max(0, (x + 11) / 9.9)) * 7.8 });
  w.fence(-1.1, -40.45, 2.25, -40.45, 1, railM, { y: D }); w.fence(2.25, -40.45, 2.25, -35.1, 1, railM, { y: D }); w.fence(-1.1, -38.05, -1.1, -35.1, 1, railM, { y: D });
  boat(w, -19, -1.2, -44, Math.PI / 2, { color: 0xf2f2f2, size: 1.6, name: "CADET" });
  w.lamp(-11, -45, 4, 0xffe0a0, { y: 1.2, ei: 4, light: 4 }); w.lamp(11, -39, 4, 0xffe0a0, { y: 1.2, ei: 4, light: 4 });

  // ---- on deck: container rows with lanes between (cover for sneaking), the main hatch
  const conts = [0x7a2a2a, 0x2a4a6a, 0x3a5a3a, 0x8a6a2a, 0x4a3a5a];
  const CONT = [];
  for (const [x, z] of [[-18, -26], [-6, -26], [6, -26], [18, -26], [-24, -16], [-12, -16], [12, -16], [24, -16], [-18, -7], [18, -7]]) { w.box(6, 2.6, 2.5, M(conts[CONT.length % 5], { metal: 0.3, rough: 0.6 }), x, D + 1.3, z); CONT.push([x, z]); }
  w.box(5, 0.6, 5, M(0x3a4048, { metal: 0.6 }), 0, D + 0.3, 3);
  w.mesh(new THREE.TorusGeometry(1.8, 0.15, 8, 32), M(0x39f0ff, { emissive: 0x39f0ff, ei: 2 }), 0, D + 0.62, 3, { rx: Math.PI / 2, cast: false });
  w.sign("MAIN HATCH", 3.4, 0.6, 0, D + 1.4, 0.45, Math.PI, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });
  // searchlight towers at the corners, the light beams sweeping the sea
  const beamM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff4d0).multiplyScalar(1.5), transparent: true, opacity: 0.12, depthWrite: false });
  const sweep = [];
  for (const [x, z] of [[-47, -32], [47, -32], [47, 32], [-47, 32]]) {
    w.box(1.2, 10, 1.2, M(0x2a3038, { metal: 0.5 }), x, D + 5, z);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 5, 60, 12, 1, true), beamM); b.geometry.translate(0, -30, 0); b.position.set(x, D + 10, z); b.userData.dynamic = true; w.scene.add(b); sweep.push(b);
  }
  w.updaters.push(() => sweep.forEach((b, i) => { b.rotation.set(Math.PI / 2 - 0.35, w.t * 0.3 + i * 1.6, 0, "YXZ"); }));

  // ---- the pump hall (a long shed along the west side) and its control room beyond
  const hallM = M("metal", { args: [13, [110, 116, 124], 64], repeat: [8, 1], metal: 0.5, rough: 0.5 });
  const hx0 = -44, hx1 = -14, hz = 21;
  for (const s of [-1, 1]) w.box(hx1 - hx0, 5, 0.5, hallM, (hx0 + hx1) / 2, D + 2.5, hz + s * 3.25);
  w.box(hx1 - hx0, 0.4, 7, hallM, (hx0 + hx1) / 2, D + 5.2, hz);
  for (const x of [hx0, hx1]) for (const s of [-1, 1]) w.box(0.5, 5, 2.2, hallM, x, D + 2.5, hz + s * 2.4);
  for (let x = hx0 + 3; x < hx1; x += 5) { w.cyl(0.5, 0.5, 5, M(0x3a6a8a, { metal: 0.6 }), x, D + 2.5, hz + 2.5, { seg: 10, collide: false }); const l = new THREE.PointLight(0x39c0ff, 3, 8, 1.8); l.position.set(x, D + 4, hz); w.scene.add(l); }
  w.sign("PUMP HALL", 4, 0.8, hx1 + 0.3, D + 4.2, hz, Math.PI / 2, { bg: "#0a2a4a", fg: "#39f0ff", glow: 0.6 });
  w.building(8, 4, 7, hx0 + 4, hz + 9.5, { y: D, wall: [200, 204, 210], seed: 33, win: { lit: 0.8, glow: "#9fe8ff", glass: "#1a2a3a" }, ei: 0.9 });
  w.sign("ENGINE CONTROL", 4, 0.7, hx0 + 4, D + 3.3, hz + 5.95, Math.PI, { bg: "#3a0a2a", fg: "#ff9ad8", glow: 0.6 });
  // the great intake pipes going down into the sea
  for (const z of [-20, 0, 20]) { w.cyl(1.4, 1.4, 22, legM, 52, D - 8, z, { seg: 14, collide: false }); w.cyl(1.4, 1.4, 4, legM, 50, D + 0.5, z, { rz: Math.PI / 2, seg: 14, collide: false }); }

  // ---- the helipad: the Kraken's arena, with a big painted circle and a giant compass rose that spins
  const hp = [28, 12];
  w.cyl(13, 13, 0.06, M(0x2a3a4a, { rough: 0.8 }), hp[0], D + 0.03, hp[1], { seg: 48, collide: false });
  w.mesh(new THREE.TorusGeometry(11, 0.25, 8, 64), M(0xf0c020), hp[0], D + 0.07, hp[1], { rx: Math.PI / 2, cast: false });
  const rose = new THREE.Group(); rose.position.set(hp[0], D + 0.08, hp[1]); w.scene.add(rose);
  const star = (n, R, r, color, turn) => { const sh = new THREE.Shape(); for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * Math.PI * 2 + turn, rr = k % 2 ? r : R; if (k) sh.lineTo(Math.sin(a) * rr, Math.cos(a) * rr); else sh.moveTo(Math.sin(a) * rr, Math.cos(a) * rr); } const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), M(color, { rough: 0.6, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.userData.dynamic = true; return m; };
  rose.add(star(4, 5, 1.1, 0xd8d8d8, Math.PI / 4)); const top = star(4, 8, 1.4, 0xd83a3a, 0); top.position.y = 0.01; rose.add(top);
  w.updaters.push(dt => { rose.rotation.y += dt * (0.4 + Math.sin(w.t * 0.7) * 0.6); });

  // ---- the working deck: a crane, a radar mast with its dish turning, pipe runs, hazard stripes
  const yel = M(0xd8b020, { metal: 0.3 }), steel = M(0x5a646e, { metal: 0.7, rough: 0.4 });
  w.box(1.6, 18, 1.6, yel, 44, D + 9, -26); w.box(1.2, 1.2, 22, yel, 44, D + 18, -17); w.cyl(0.04, 0.04, 12, M(0x1a1a1a), 44, D + 12, -7, { collide: false, seg: 4 });
  w.box(1.2, 1, 1.2, M(0x2a2a2a), 44, D + 5.6, -7, { collide: false });
  w.box(0.6, 14, 0.6, steel, -46, D + 7, -2);
  const dish = new THREE.Group(); dish.position.set(-46, D + 14.4, -2); w.scene.add(dish);
  { const d = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), M(0xe8e8ec, { metal: 0.3, side: THREE.DoubleSide })); d.rotation.x = -Math.PI / 2 + 0.4; d.userData.dynamic = true; dish.add(d); }
  w.updaters.push(dt => { dish.rotation.y += dt * 0.8; });
  for (const z of [31, 33]) w.cyl(0.45, 0.45, 74, steel, 7, D + 0.45, z, { rz: Math.PI / 2, seg: 12 });
  for (const x of [46.5, 48.5]) w.cyl(0.45, 0.45, 50, steel, x, D + 0.45, 5, { rx: Math.PI / 2, seg: 12 });
  const hz2 = M(0x1a1a1a);
  for (let x = -49; x < 50; x += 2) { w.box(1, 0.02, 0.5, x % 4 ? yel : hz2, x, D + 0.01, -34.4, { collide: false }); }
  // ---- under the base: fish sheltering in the shade, and the dark going down
  school(w, 0, -6, 0, 60, 8, 0x8a9aaa); school(w, -30, -10, 12, 40, 6, 0x6a8a9a);
  roam(w, "manta", { cx: 0, cz: 10, rx: 40, rz: 28, y: -14, dy: 1, period: 90, scale: 1.8 });
  w.floorY = -90;

  w.missionData = {
    ber1: { start: [0, D, -32], goal: [0, D, -1], guards: [{ path: [[-28, -21], [28, -21]], speed: 1.8, y: D }, { path: [[0, -30], [0, -12]], speed: 1.4, phase: 0.4, y: D }, { path: [[-28, -11.5], [-8, -11.5], [-8, -3], [-28, -3]], speed: 1.5, y: D }, { path: [[28, -11.5], [8, -11.5], [8, -3], [28, -3]], speed: 1.5, phase: 0.5, y: D }] },
    ber2: { start: [hx1 - 1.5, D, hz], goal: [hx0 + 1.5, D, hz], width: 5.8 },
    ber3: { title: "THE ENGINE ROOM" },
    ber4: { sub: [6, -1.6, -46, 0], exit: [5, 1.3, -42], dark: true, floor: -40, marks: [[-26, -4, -12], [13, -8, -12], [30, -6, 12], [-13, -10, 12], [0, -14, 30]] },
    ber5: { center: [hp[0], D, hp[1]], radius: 11, robot: "kraken", height: 5, arms: true },
    ber6: { exit: [5, 1.3, -42], floor: -75, path: [[4, -3, -38], [6, -6, -20], [0, -10, -4], [-20, -16, 6], [-26, -24, 26], [-8, -34, 44], [16, -44, 52], [30, -54, 70], [24, -62, 96]] },
  };
  return {
    stars: [[-46, D, -31], [46, D, 31], [-46, D, 31]],
    spawn: [-2, 1.2, -44.5], yaw: 0, bolt: [0, 1.2, -45], contact: [-5, 1.2, -43, 0.3],
    at: { ber1: [5, -42], ber2: [hx1 + 3, hz], ber3: [hx0 + 4, hz + 4.6], ber4: [-5, -42], ber5: [hp[0], hp[1] - 13], ber6: [10, -44] },
  };
}
