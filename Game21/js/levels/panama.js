// The Panama Canal: three lock chambers climb like steps from the canal up to
// the lake, each with its own water (the top one is running dry). A container
// ship waits in the middle lock; the control house watches over the locks; a
// tunnel of machinery runs beside them; and east of the locks the canal opens
// into a lagoon among jungle islands.
import * as THREE from "three";
import { M } from "../tex.js";
import { boat, rocks } from "./kit.js";
import { school, roam } from "../critters.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function buildPanama(w) {
  w.setSky("tropical");
  const LV = 0, TOP = 8;
  // the land round the locks is flat at 8; the lock chambers are cut into it; east of the locks
  // the ground falls to a lagoon with islands; jungle hills all round
  const islands = [[140, 40, 16], [175, -35, 14], [215, 25, 18], [150, -80, 12]];
  const h = (x, z) => {
    if (x > -64 && x < 94 && Math.abs(z) < 7) return -8;
    let y = TOP + Math.max(0, Math.abs(z) - 60) * 0.35 + S(60, 140, Math.abs(z)) * 10 * (0.5 + 0.5 * Math.sin(x * 0.04));
    if (x > 90) {
      const lag = -8 * S(90, 110, x) * S(130, 100, Math.abs(z - 0) * 0.7);
      let isl = -99; for (const [ix, iz, r] of islands) isl = Math.max(isl, 6 * S(r, r * 0.4, Math.hypot(x - ix, z - iz)) - 3);
      y = Math.min(y, Math.max(lag, isl, x > 260 ? (x - 260) * 0.4 - 4 : -99));
      if (x > 94 && Math.abs(z) < 7) y = Math.min(y, -8);
    }
    if (x < -64 && Math.abs(z) < 40) y = Math.min(y, -4);
    return y;
  };
  w.terrain(600, 300, h, M("grass", { args: [25, [64, 128, 52]], repeat: [100, 100], normal: 0.6 }));
  w.ocean({ level: LV, box: [150, 0, 240, 240], shallow: 0x3a9a8a, deep: 0x1a4a5a, under: 0x245a60, clear: 0.35, waves: 0.5, absorb: [0.2, 0.08, 0.06] });
  // the lock chambers: concrete walls, steel gates, and the water in each (lower chamber is the canal)
  const conc = M("paving", { args: [51, [184, 180, 170], 64], repeat: [30, 2] }), steel = M(0x3a4a5a, { metal: 0.7, rough: 0.4 }), yellow = M(0xf0c020);
  for (const s of [-1, 1]) {
    w.box(158, 20, 4, conc, 15, -2, s * 9);
    w.box(158, 0.05, 0.25, yellow, 15, TOP + 0.03, s * 7.4, { collide: false });
    for (let x = -60; x <= 90; x += 10) w.cyl(0.25, 0.3, 0.6, M(0x1e2228, { metal: 0.6 }), x, TOP + 0.3, s * 7.8, { seg: 10 });
  }
  for (const x of [-60, -10, 40, 90]) { w.box(1.2, 16, 14, steel, x, 0, 0); w.box(1.4, 0.6, 14.4, yellow, x, TOP + 0.3, 0); }
  const chamber = (x0, x1, y) => w.water(x1 - x0, 14, (x0 + x1) / 2, y, 0, 0x2a8a8a, { opacity: 0.9 });
  chamber(-10, 40, 3.2); chamber(-60, -10, 1.0); chamber(-240, -60, 6);
  // the ship in the middle lock: a hull, a bridge at the stern, containers stacked in steps, a pad
  const shipX = 15, deck = 6.4;
  const hullM = M(0x2a3a6a, { rough: 0.5, metal: 0.3 }), redM = M(0xb83a2a);
  w.box(44, 6, 10, hullM, shipX, deck - 3, 0); w.box(44.2, 1.4, 10.2, redM, shipX, deck - 5.4, 0, { collide: false });
  w.box(2, 1.2, 10, hullM, shipX + 22.5, deck - 0.2, 0);
  w.box(8, 8, 9, M(0xf2f2ee, { rough: 0.5 }), shipX - 17, deck + 4, 0);
  w.box(8.4, 0.4, 9.4, M(0x2a2e34), shipX - 17, deck + 8.2, 0);
  w.sign("PACIFIC PEARL", 8, 1.2, shipX + 10, deck - 1.8, 5.02, 0, { bg: "#2a3a6a", fg: "#ffffff" });
  const colors = [0xd83a3a, 0x2a8ad8, 0x2a9a5a, 0xf0a020, 0x8a4ad8, 0xe8e8ec];
  const stacks = [[shipX - 8, 1], [shipX - 3, 2], [shipX + 2, 3], [shipX + 7, 2], [shipX + 12, 1], [shipX + 17, 2]];
  stacks.forEach(([x, n], i) => { for (let k = 0; k < n; k++) for (const z of [-2.5, 2.5]) w.box(4.6, 2.2, 4.8, M(colors[(i * 2 + k + (z > 0)) % colors.length], { metal: 0.3, rough: 0.6 }), x, deck + 1.1 + k * 2.2, z); });
  const crate = M("wood", { args: [8, [150, 110, 70]] });
  for (const [x, y, z] of [[shipX - 5.5, deck + 0.65, 3.6], [shipX - 0.6, deck + 2.85, 3.8], [shipX + 4.4, deck + 5.05, 3.8], [shipX + 9.6, deck + 2.85, 3.8], [shipX + 14.5, deck + 0.65, 3.8]]) w.box(1.3, 1.3, 1.3, crate, x, y, z);
  w.pad(shipX + 14.8, deck, -3.4, 14, 0xff5ad8);
  // the control house on the north side, its yard with crates to hide behind
  w.building(14, 9, 10, 15, 26, { y: TOP, wall: [236, 232, 220], seed: 51, win: { lit: 0.2, glass: "#3a5a7a" } });
  w.sign("MIRAFLORES CONTROL", 8, 1.2, 15, TOP + 7.5, 20.95, Math.PI, { bg: "#0c2a4a", fg: "#ffffff" });
  for (const [x, z] of [[4, 14], [8, 17], [22, 15], [28, 14], [12, 13]]) w.box(2, 1.6, 2, crate, x, TOP + 0.8, z);
  // the gate machinery tunnel: a long room of gears and pipes, to the south
  const hall = M("metal", { args: [9, [110, 118, 128]], repeat: [6, 1] });
  const hx0 = -44, hx1 = -12, hz = 26;
  w.box(hx1 - hx0, 4.5, 0.5, hall, (hx0 + hx1) / 2, TOP + 2.25, hz - 3.25); w.box(hx1 - hx0, 4.5, 0.5, hall, (hx0 + hx1) / 2, TOP + 2.25, hz + 3.25);
  w.box(hx1 - hx0, 0.4, 7, hall, (hx0 + hx1) / 2, TOP + 4.7, hz);
  w.box(0.5, 4.5, 2.2, hall, hx0, TOP + 2.25, hz - 2.4); w.box(0.5, 4.5, 2.2, hall, hx0, TOP + 2.25, hz + 2.4);
  w.box(0.5, 4.5, 2.2, hall, hx1, TOP + 2.25, hz - 2.4); w.box(0.5, 4.5, 2.2, hall, hx1, TOP + 2.25, hz + 2.4);
  for (let x = hx0 + 3; x < hx1; x += 6) { const g = w.mesh(new THREE.TorusGeometry(1.1, 0.25, 6, 12), M(0x8a6a3a, { metal: 0.8, rough: 0.4 }), x, TOP + 3.2, hz + 2.7, { cast: false }); g.userData.dynamic = true; w.updaters.push(dt => { g.rotation.z += dt * 0.8; }); }
  w.sign("GATE MACHINERY", 5, 1, hx0 - 0.3, TOP + 5.6, hz, -Math.PI / 2, { bg: "#3a2a1a", fg: "#ffd166" });
  // the lagoon to the east: channel buoys, a speedboat at the jetty, jungle on the islands
  const buoy = [M(0xe83a3a), M(0x2ac870)];
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = 175 + Math.cos(a) * 58, z = -5 + Math.sin(a) * 44; if (h(x, z) < -2) w.cyl(0.4, 0.5, 1.4, buoy[k % 2], x, LV + 0.2, z, { seg: 10, collide: false }); }
  w.box(12, 1, 3, M("wood", { args: [8, [140, 100, 60]], repeat: [1, 4] }), 100, 1.2, 12);
  boat(w, 104, -1.1, 17, Math.PI / 2, { color: 0xf2f2f2, size: 0.8, collide: false });
  for (const [ix, iz, r] of islands) for (let k = 0; k < Math.round(r * 0.8); k++) { const a = k * 2.4, d = (k % 3) / 3 * r * 0.5, x = ix + Math.cos(a) * d, z = iz + Math.sin(a) * d; if (h(x, z) > 1) w.palm(x, z, 7 + (k % 3)); }
  // rainforest on the hills round the locks
  for (let k = 0; k < 90; k++) { const a = k * 2.399, r = 70 + (k % 9) * 14, x = Math.cos(a) * r * 1.6, z = Math.sin(a) * r; if (Math.abs(z) < 30 && x > -70 && x < 100) continue; const y = h(x, z); if (y < 2) continue; w.tree(x, z, 12 + (k % 5) * 2.5, { y, color: [0x2a7a3a, 0x3a8a2a, 0x2a6a34][k % 3], collide: false }); }
  school(w, 170, -3, 0, 40, 5, 0xe8c83a);
  roam(w, "turtle", { cx: 150, cz: -10, rx: 20, rz: 12, y: -1.5, dy: 0.3, period: 60, scale: 4 });
  w.floorY = -30;
  const onShip = (x, z, y) => [x, y, z];
  w.missionData = {
    pan1: { title: "FILL THE LOCKS" },
    pan2: { cells: [onShip(shipX - 8, 2.5, deck + 3.1), onShip(shipX - 3, -2.5, deck + 5.3), onShip(shipX + 2, 2.5, deck + 7.5), onShip(shipX + 7, -2.5, deck + 5.3), onShip(shipX + 17, 2.5, deck + 5.3), onShip(shipX - 17, 0, deck + 9.2), onShip(shipX + 20, 0, deck + 1), [-30, TOP + 0.9, 8.5]] },
    pan3: { start: [15, TOP, 40], goal: [15, TOP, 20.3], guards: [{ path: [[2, 19.5], [24, 19.5]], speed: 1.5 }, { path: [[18, 11.5], [18, 20]], speed: 1.2, phase: 0.4 }] },
    pan4: { start: [hx0 + 1.5, TOP, hz], goal: [hx1 - 1.5, TOP, hz], width: 5.8 },
    pan5: { ride: "boat", path: [[110, 0], [150, 12], [190, 5], [230, -10], [240, -50], [205, -75], [170, -60], [130, -45], [105, -25]] },
    pan6: { rings: [[-30, 26, 60, 2.2], [0, 30, 80, 2.2], [40, 28, 90, 2.2], [80, 32, 75, 2.2], [110, 30, 55, 2.2], [120, 26, 25, 2.2]], ceiling: 60 },
  };
  return {
    spawn: [15, TOP, 34], yaw: Math.PI, bolt: [17, TOP, 34], contact: [10, TOP, 30, Math.PI],
    at: { pan1: [8, 23], pan2: [-30, 10.5], pan3: [15, 42], pan4: [-48, 26], pan5: [100, 12], pan6: [-30, 40] },
  };
}
void rocks;
