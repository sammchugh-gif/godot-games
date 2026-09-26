// The Kenyan savanna: rolling golden grass, flat-topped acacias, a watering
// hole, rocky kopjes, a ranger station, and Zero's crackling battery tower.
import * as THREE from "three";
import { M } from "../tex.js";
import { thing } from "../props.js";

function acacia(w, x, z, h = 6) {
  const y = w.heightAt ? w.heightAt(x, z) : 0;
  const bark = M(0x5a4030, { rough: 0.95 }), leaf = M(0x5a7a2a, { rough: 0.9, flat: true });
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, h * 0.75, 8), bark); trunk.position.y = h * 0.37; trunk.rotation.z = 0.12; trunk.castShadow = true; g.add(trunk);
  for (const s of [-1, 1]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, h * 0.4, 6), bark); br.position.set(s * h * 0.12, h * 0.72, 0); br.rotation.z = -s * 0.7; g.add(br); }
  const top = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.62, h * 0.45, h * 0.18, 12), leaf); top.position.y = h * 0.86; top.castShadow = true; g.add(top);
  const top2 = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.4, h * 0.3, h * 0.14, 10), leaf); top2.position.set(h * 0.2, h * 0.98, 0.3); g.add(top2);
  w.phys.fixedCyl(x, y + h * 0.37, z, 0.35, h * 0.37);
}
function kopje(w, x, z, s) {
  const y = w.heightAt ? w.heightAt(x, z) : 0;
  const rock = M(0x9a7a5a, { rough: 0.95, flat: true });
  for (let i = 0; i < 5; i++) { const r = s * (0.5 + (i % 3) * 0.25); const m = w.mesh(new THREE.DodecahedronGeometry(r, 0), rock, x + Math.cos(i * 1.3) * s * 0.7, y + r * 0.6, z + Math.sin(i * 1.3) * s * 0.7, { ry: i }); m.scale.y = 0.75; w.phys.fixedBall(m.position.x, m.position.y, m.position.z, r * 0.75); }
}
function hut(w, x, z, ry) {
  const wall = M(0xc89a6a, { rough: 0.95 }), roof = M(0xb8a060, { rough: 1 });
  w.cyl(2.6, 2.6, 2.4, wall, x, 1.2, z, {});
  const r = w.cone(3.4, 2.4, roof, x, 3.6, z); r.rotation.y = ry;
  w.sign("RANGER STATION", 3.6, 0.7, x + Math.sin(ry) * 2.65, 2.2, z + Math.cos(ry) * 2.65, ry, { bg: "#3a5a2a", fg: "#ffffff" });
}
function batteryTower(w, x, z) {
  const steel = M(0x5a6068, { rough: 0.4, metal: 0.8 });
  const y = w.heightAt ? w.heightAt(x, z) : 0;
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const leg = w.cyl(0.25, 0.35, 22, steel, x + dx * 0.6, y + 11, z + dz * 0.6, { seg: 8 }); leg.rotation.set(dz * 0.04, 0, -dx * 0.04); }
  for (let i = 0; i < 6; i++) w.box(3.4, 0.25, 3.4, steel, x, y + 3 + i * 3.4, z, { collide: false });
  // the glowing battery cells stacked up the middle
  const cells = [];
  for (let i = 0; i < 5; i++) { const c = w.mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.2, 16), M(0x3aa8ff, { emissive: 0x3ab0ff, ei: 2, rough: 0.2 }), x, y + 4.5 + i * 3.4, z); c.userData.dynamic = true; cells.push(c); }
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ae8ff).multiplyScalar(4) }));
  bolt.userData.dynamic = true; w.scene.add(bolt);
  w.updaters.push((dt, t) => {
    const on = !w.towerOff;
    cells.forEach((c, i) => { c.material.emissiveIntensity = on ? 1.5 + Math.sin(t * 6 + i) : 0.1; });
    bolt.visible = on && Math.sin(t * 9) > 0.3;
    if (bolt.visible) { const a = t * 7; const top = new THREE.Vector3(x, y + 23, z), end = new THREE.Vector3(x + Math.cos(a) * 9, y + 14 + Math.sin(a * 1.3) * 5, z + Math.sin(a) * 9); bolt.position.copy(top).lerp(end, 0.5); bolt.scale.set(1, top.distanceTo(end), 1); bolt.lookAt(end); bolt.rotateX(Math.PI / 2); }
  });
  return { cells };
}

export function buildKenya(w) {
  w.setSky("desert");
  const hill = (x, z) => {
    const r = Math.hypot(x, z), k = Math.min(1, Math.max(0, (r - 26) / 26));
    const hole = Math.max(0, 1 - Math.hypot(x + 22, z - 18) / 9) * 1.4;
    return k * (1.6 + Math.sin(x * 0.035 + 1) * 1.8 + Math.cos(z * 0.03) * 1.5) - hole;
  };
  w.terrain(320, 96, hill, M("grass", { args: [121, [196, 170, 90]], repeat: [60, 60], normal: 0.7 }));
  w.phys.fixedBox(0, -3, 0, 400, 1, 400);
  w.mountains(12, 220, 70, { seed: 11, snow: true, color: 0x7a6a8a });
  // the watering hole
  w.water(16, 16, -22, -0.3, 18, 0x5a7a6a, { opacity: 0.92 });
  // acacias, kopjes, the ranger station and the tower
  for (const [x, z, h] of [[-38, -10, 7], [24, -30, 6], [40, 20, 7.5], [-10, -44, 6], [-46, 34, 6.5], [10, 46, 7], [54, -8, 6], [-60, -30, 7]]) acacia(w, x, z, h);
  kopje(w, 30, 4, 3); kopje(w, -32, -34, 4);
  hut(w, -8, 8, 0.4);
  const tower = batteryTower(w, 20, -16);
  w.tower = tower;
  // the herd: animals grazing and wandering
  {
    const herd = [];
    for (const [k, x, z] of [["zebra", -30, 4], ["zebra", -34, 8], ["zebra", -28, 10], ["giraffe", 36, -24], ["giraffe", 40, -18], ["elephant", -16, 36], ["elephant", -24, 40]]) {
      const a = thing(k); a.position.set(x, hill(x, z), z); a.rotation.y = Math.random() * 6; w.scene.add(a); herd.push({ a, x0: x, z0: z, ph: Math.random() * 6 });
    }
    w.updaters.push((dt, t) => { for (const h of herd) { const x = h.x0 + Math.sin(t * 0.05 + h.ph) * 4, z = h.z0 + Math.cos(t * 0.04 + h.ph) * 4; h.a.rotation.y = Math.atan2(Math.cos(t * 0.05 + h.ph), -Math.sin(t * 0.04 + h.ph)) + Math.PI / 2; h.a.position.set(x, hill(x, z), z); } });
  }
  w.floorY = -20;
  const loop = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; loop.push([Math.cos(a) * (66 + Math.sin(a * 2) * 8), Math.sin(a) * (58 + Math.cos(a * 3) * 6)]); }
  const g = (x, z) => hill(x, z) + 0.02;
  w.missionData = {
    ken1: { things: [["zebra", -6, g(-6, 20), 20, 0.4], ["elephant", 6, g(6, 24), 24, 2.2], ["giraffe", -12, g(-12, 26), 26, 1], ["zebra", 10, g(10, 14), 14, -0.6], ["elephant", -2, g(-2, 30), 30, 0.2], ["zebra", 14, g(14, 30), 30, 2.8], ["giraffe", 0, g(0, 16), 16, -1.4]] },
    ken2: { path: loop, y: 0.3, car: "jeep", quarry: "jeep", lead: 28 },
    ken3: { area: [-20, 16, 12], bots: [[-14, 0.1, 10], [-28, 0.1, 12], [-24, 0.1, 26], [-10, 0.1, 22], [-30, 0.1, 22], [-18, 0.1, 30]] },
    ken4: { title: "SHUT DOWN THE TOWER" },
  };
  return { spawn: [0, 0.05, 8], yaw: Math.PI, bolt: [2, 0.05, 7], contact: [-4, 0.05, 6, 2.4], apply: save => { w.towerOff = save.done.includes("ken4"); } };
}
