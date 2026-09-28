// Undertow's Dome, near the north pole of Mars: a glass dome two hundred metres across over a
// crater, and in the crater a sea, made of the sea she stole. Outside, the red plain and the thin
// cold air; in through the airlock in the dome's wall, and there's warm air, a beach, and the
// water. At the bottom of the sea stands the Tidal Engine, rebuilt, its crown a round deck just
// above the waves; a clear pipe climbs from it to the top of the dome, ready to send the sea up
// and away, home to Earth as rain.
import * as THREE from "three";
import { M } from "../tex.js";
import { airlock } from "./deepkit.js";
import { marsGround, marsRock, lander } from "./spacekit.js";
import { critter, animateCritter, school, roam } from "../critters.js";

const R = 100, PLAIN = 6, SHORE = 72;
const sm = t => t * t * (3 - 2 * t), cl = t => Math.max(0, Math.min(1, t));
export function ground(x, z) {
  const r = Math.hypot(x, z);
  if (r > 84) return PLAIN + (r > R + 4 ? Math.sin(x * 0.05) * Math.cos(z * 0.045) * 0.8 * cl((r - R - 4) / 10) : 0);
  if (r > SHORE) return PLAIN - (84 - r) * 0.5;
  // under the water: down to the sea bed, a gentle bowl with ripples in the sand
  return -40 * sm(cl((SHORE - r) / 22)) + Math.sin(x * 0.2) * Math.cos(z * 0.17) * 0.4 * cl((SHORE - r) / 22);
}

export function buildDome(w) {
  w.setSky("mars");
  const G = ground;
  w.terrain(1100, 260, G, marsGround(391, [200, 116, 72], 140));
  w.overlay(0, 0, 2 * (SHORE + 12), 2 * (SHORE + 12), M("sand", { args: [393, [214, 196, 160]], repeat: [30, 30] }), (x, z) => Math.hypot(x, z) < SHORE + 11, 0.04);
  w.ocean({ level: 0, box: [0, 0, 160, 160], shallow: 0x2ab8c8, deep: 0x0a4a7a, under: 0x1a70a0, deepUnder: 0x052038, clear: 0.6, waves: 0.35, caustics: 5, see: 44, absorb: [0.2, 0.07, 0.04] });
  w.phys.fixedBox(0, -60, 0, 600, 1, 600);
  w.floorY = -60;
  const steel = M(0x8a96a8, { metal: 0.6, rough: 0.4 }), dark = M("metal", { args: [10, [58, 52, 72], 64], repeat: [6, 4], metal: 0.6, rough: 0.45 });
  const teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 1.6 });

  // ---- the dome: a glass hemisphere on a steel ring, with its wall solid all round but for the airlock
  const glass = new THREE.MeshStandardMaterial({ color: 0xdff0ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  const shell = w.mesh(new THREE.SphereGeometry(R, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, PLAIN, 0, { cast: false }); shell.userData.dynamic = true;
  for (let k = 0; k < 12; k++) w.mesh(new THREE.TorusGeometry(R, 0.25, 6, 64, Math.PI), M(0xd8dde4, { metal: 0.6 }), 0, PLAIN, 0, { ry: k * Math.PI / 12, cast: false });
  w.mesh(new THREE.TorusGeometry(R, 0.8, 8, 96), M(0x5a6068, { metal: 0.7, rough: 0.4 }), 0, PLAIN + 0.6, 0, { rx: Math.PI / 2 });
  const N = 64;
  // (segments round the wall with a gap centred on the airlock in the south, and short pieces
  // closing the gap either side of it)
  for (let k = 1; k < N; k++) {
    const a = -Math.PI / 2 + k / N * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R;
    w.phys.fixedBox(x, PLAIN + 5, z, 0.4, 5, R * Math.PI / N + 0.1, -a);
  }
  const gap = R * Math.sin(Math.PI / N);
  for (const s of [-1, 1]) w.phys.fixedBox(s * (2.3 + gap) / 2, PLAIN + 5, -R + 0.1, (gap - 2.3) / 2 + 0.1, 5, 0.4);
  const lock = airlock(w, 0, PLAIN, -R, 0, { space: true, wall: M(0xc8ccd4, { metal: 0.5, rough: 0.4 }) });
  w.sign("DOME", 3, 0.8, 0, PLAIN + 4, -R - 2.6, Math.PI, { bg: "#061a2a", fg: "#2ad0c0", glow: 1 });
  // outside: the POLARIS lander, and rocks on the plain
  lander(w, 22, PLAIN, -122);
  for (let i = 0; i < 40; i++) { const a = i * 2.39996, d = R + 14 + (i * 37) % 120, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.hypot(x - 22, z + 122) < 12 || (Math.abs(x) < 16 && z < -R && z > -R - 30)) continue; marsRock(w, x, G(x, z), z, 0.5 + (i % 5) * 0.4, { collide: i % 5 > 1 }); }
  // inside: the beach walk round the rim, palm-less but with a few deck chairs (she likes it here)
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.12, x = Math.cos(a) * 80, z = Math.sin(a) * 80; w.box(0.8, 0.2, 1.8, M(0xff7a5a, { rough: 0.6 }), x + 6, G(x + 6, z) + 0.4, z, { ry: a, collide: false }); }

  // ---- the Tidal Engine, on the sea bed in the middle: rings, intakes, a heart; its crown is the deck
  const SB = -40;
  w.cyl(10, 13, 8, dark, 0, SB + 4, 0, { seg: 32 });
  w.cyl(8, 10, 12, dark, 0, SB + 14, 0, { seg: 32 });
  w.cyl(5, 7, 18, dark, 0, SB + 29, 0, { seg: 28 });
  const rings = [];
  for (const [y, r] of [[SB + 8.2, 12], [SB + 20.2, 9.5], [SB + 32, 6.5]]) { const m = w.mesh(new THREE.TorusGeometry(r, 0.4, 10, 48), teal, 0, y, 0, { rx: Math.PI / 2, cast: false }); m.userData.dynamic = true; rings.push(m); }
  const heartM = new THREE.MeshStandardMaterial({ color: 0xff3a8a, emissive: 0xff3a8a, emissiveIntensity: 1.6 });
  const heart = w.mesh(new THREE.SphereGeometry(2.4, 24, 16), heartM, 0, SB + 14, 13.4, { cast: false }); heart.userData.dynamic = true;
  const hl = new THREE.PointLight(0xff3a8a, 16, 40, 1.2); hl.position.set(0, SB + 14, 16); w.scene.add(hl);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; w.mesh(new THREE.TorusGeometry(3, 0.2, 8, 28), teal, Math.cos(a) * 19, SB + 3, Math.sin(a) * 19, { ry: -a + Math.PI / 2, cast: false }); w.box(3, 5, 3, dark, Math.cos(a) * 16, SB + 2.5, Math.sin(a) * 16, { ry: -a }); }
  // the crown: a round deck just above the water, on the tower's top
  const DECK = 1.2;
  w.cyl(18, 18, 1, M("metal", { args: [395, [110, 116, 128], 64], repeat: [8, 8], metal: 0.4 }), 0, DECK - 0.5, 0, { seg: 48 });
  w.cyl(5, 5, -SB + DECK - 16, dark, 0, (SB + 16 + DECK) / 2, 0, { seg: 20, collide: false });
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; w.cyl(0.06, 0.06, 1, M(0xd8dde4, { metal: 0.6 }), Math.cos(a) * 17.6, DECK + 0.5, Math.sin(a) * 17.6, { collide: false, seg: 6 }); }
  w.mesh(new THREE.TorusGeometry(17.6, 0.05, 6, 96), M(0xd8dde4, { metal: 0.6 }), 0, DECK + 1, 0, { rx: Math.PI / 2, cast: false });
  // a ladder up to the crown from the water, on its south side
  for (let k = 0; k < 6; k++) w.box(1.2, 0.12, 0.3, steel, 0, -3 + k * 0.8, -18.3, { collide: false });
  w.steps(8, 1.4, (DECK + 2.5) / 8, 0.5, steel, 0, -2.5, -22.5, 0);
  // the clear pipe from the crown to the top of the dome; when the Engine turns round, the sea runs up it
  const tubeM = new THREE.MeshPhysicalMaterial({ color: 0xcff4ff, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  w.mesh(new THREE.CylinderGeometry(2.4, 2.4, R - DECK, 24, 1, true), tubeM, 0, DECK + (R - DECK) / 2 + PLAIN * 0.5, 0, { cast: false }).userData.dynamic = true;
  const flow = w.mesh(new THREE.CylinderGeometry(2.1, 2.1, R - DECK, 20, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ab0ff).multiplyScalar(1.3), transparent: true, opacity: 0.5, depthWrite: false }), 0, DECK + (R - DECK) / 2 + PLAIN * 0.5, 0, { cast: false });
  flow.userData.dynamic = true;
  w.updaters.push((dt, t) => {
    rings.forEach((r, i) => { r.rotation.z += dt * (0.4 + i * 0.3) * (i % 2 ? -1 : 1) * (w.reversed ? -1 : 1); });
    const b = 1 + Math.sin(t * 2.5) * 0.08; heart.scale.setScalar(b); hl.intensity = 14 + Math.sin(t * 2.5) * 5;
    const c = w.reversed ? 0x3ab0ff : 0xff3a8a; heartM.color.setHex(c); heartM.emissive.setHex(c); hl.color.setHex(c);
    flow.visible = !!w.reversed; flow.scale.set(1 + Math.sin(t * 8) * 0.03, 1, 1 + Math.cos(t * 8) * 0.03);
  });
  w.sign("TIDAL ENGINE", 6, 1.1, 0, DECK + 2.4, -17.2, Math.PI, { bg: "#1a0a2a", fg: "#ff5ad8", glow: 0.8 });

  // ---- the current the Engine drives, up from its intakes, round and up to the surface
  const CUR = [[-20, SB + 4, -6], [-28, SB + 10, -22], [-18, SB + 16, -36], [2, SB + 22, -40], [22, SB + 27, -30], [30, SB + 32, -10], [26, SB + 36, 12], [8, SB + 38, 28]];
  w.current(CUR, 3.6, 7);

  // ---- life in the stolen sea (it came with the water)
  school(w, 30, -12, 20, 50, 7, 0xffd23a); school(w, -30, -20, -10, 50, 6, 0x9ad8ff); school(w, 0, -30, 40, 40, 6, 0xff7a3a);
  roam(w, "seaturtle", { cx: 0, cz: 0, rx: 44, rz: 36, y: -14, dy: 2, period: 60 });
  roam(w, "manta", { cx: 10, cz: -10, rx: 34, rz: 30, y: -26, dy: 2, period: 70, scale: 1.6, dir: -1 });
  for (let k = 0; k < 3; k++) { const j = critter("jelly", 1.1); w.scene.add(j); const ph = k * 2.1; w.updaters.push((dt, t) => { j.position.set(Math.cos(t * 0.04 + ph) * 36, -10 + Math.sin(t * 0.3 + ph) * 3, Math.sin(t * 0.04 + ph) * 36); animateCritter(j, dt, 0.3); }); }
  w.airStation(-36, G(-36, 20), 20); w.airStation(34, G(34, -24), -24); w.airStation(10, G(10, 44), 44);

  // ---- the missions
  const bed = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const ring = (x, y, z, a) => [x, y, z, 2.8, a];
  const IN = [0, PLAIN + 0.1, -R + 6];
  w.missionData = {
    dom1: { steps: [[lock, "in"]], goal: [0, PLAIN + 0.5, -R + 8] },
    dom2: { cells: [bed(-40, -30), bed(-24, 40), bed(30, 36), bed(42, -10), [0, SB + 20, -12], bed(-10, -52), [24, -20, 20]], floor: SB - 6 },
    dom3: { sub: [0, -3, -64, 0], exit: IN, floor: SB - 6,
      rings: [ring(0, -6, -48, 0), ring(14, -12, -34, 0.8), ring(30, -18, -14, 1.4), ring(28, -26, 12, 2.4), ring(8, -30, 28, 3), ring(-16, -32, 20, -2.2), ring(-26, -34, -2, -1.4)] },
    dom4: { title: "THE ENGINE'S VALVES", valves: 5, gauges: 5 },
    dom5: { enter: [0, DECK + 0.1, -12, 0], center: [0, DECK, 2], radius: 13, robot: "kraken", height: 5.5, arms: true, rider: "undertow" },
    dom6: { rings: [[-28, SB + 10, -22, 2.8], [-18, SB + 16, -36, 2.8], [2, SB + 22, -40, 2.8], [22, SB + 27, -30, 2.8], [30, SB + 32, -10, 2.8], [26, SB + 36, 12, 2.8]], floor: SB - 6 },
  };
  const info = {
    stars: [bed(-50, 20, 0.3), [0, DECK + 0.3, 14], bed(40, -150, 0.3)],
    spawn: [4, PLAIN + 0.1, -114], yaw: 0, bolt: [2, PLAIN + 0.1, -115], contact: [-4, PLAIN, -111, Math.PI / 2],
    // (once Rory has been through the airlock, he arrives inside, on the beach, and Vega with him)
    apply: save => {
      w.reversed = save.done.includes("dom4");
      if (save.done.includes("dom1")) Object.assign(info, { spawn: [4, PLAIN + 0.1, -R + 10], yaw: 0, bolt: [2, PLAIN + 0.1, -R + 9], contact: [-4, PLAIN, -R + 12, Math.PI / 2] });
    },
    at: { dom1: [6, -R - 8, 20], dom2: [-6, -R + 10, 20], dom3: [6, -R + 12, 20], dom4: [-10, -64, -1], dom5: [10, -64, -1], dom6: [-4, -R + 14, 20] },
  };
  return info;
}
