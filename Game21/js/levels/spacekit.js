// Act Three's pieces: the POLARIS rocket and its gantry (from Zero Gravity, standing on
// whatever they're built on), and more as the act goes up and out to Mars.
import * as THREE from "three";
import { M } from "../tex.js";

// A tall white rocket with four boosters, standing on its pad at (x, y, z). When w.launch is set
// it lights its engines and climbs away (and afterwards stays gone: w.launched).
export function rocket(w, x, y, z, o = {}) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f6fa, roughness: 0.3, clearcoat: 0.8 }), blue = M(o.trim ?? 0x1a3a8a, { rough: 0.4 }), black = M(0x1a1c22, { rough: 0.5 });
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(3.2, 3.2, 40, 32), white, 0, 20, 0);
  add(new THREE.CylinderGeometry(3.25, 3.25, 2, 32), black, 0, 30, 0);
  add(new THREE.CylinderGeometry(2.6, 3.2, 6, 32), white, 0, 43, 0);
  add(new THREE.ConeGeometry(2.6, 8, 32), blue, 0, 50, 0);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { add(new THREE.CylinderGeometry(1.2, 1.2, 24, 20), white, Math.cos(a) * 4.4, 12, Math.sin(a) * 4.4); add(new THREE.ConeGeometry(1.2, 3, 20), white, Math.cos(a) * 4.4, 25.5, Math.sin(a) * 4.4); }
  add(new THREE.PlaneGeometry(3.2, 12), M(o.trim ?? 0x1a3a8a), 0, 22, 3.22);
  const flame = add(new THREE.ConeGeometry(4, 14, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb040).multiplyScalar(4), transparent: true, opacity: 0.9 }), 0, -7, 0); flame.rotation.x = Math.PI; flame.visible = false;
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  const col = w.phys.fixedCyl(x, y + 20, z, 3.3, 20);
  let up = 0;
  w.updaters.push(dt => {
    if (w.launched) { g.visible = false; if (col && !up) { try { w.phys.world.removeCollider(col, false); } catch (e) { /* gone */ } up = -1; } return; }
    if (!w.launch) return;
    if (!up && col) { try { w.phys.world.removeCollider(col, false); } catch (e) { /* gone */ } }
    up = Math.max(0, up) + dt; flame.visible = true; flame.scale.set(1 + Math.random() * 0.2, 1 + Math.random() * 0.3, 1 + Math.random() * 0.2);
    g.position.y = y + up * up * 2.5;
    if (w.fx && Math.random() < dt * 30) w.fx.puff(x + (Math.random() - 0.5) * 8, y + 1, z + (Math.random() - 0.5) * 8, 0xf0f0f0, 6);
    if (g.position.y > y + 900) { w.launched = true; }
  });
  return g;
}

// A red steel launch tower beside the rocket: a platform every 6 m, a switchback stair up the east
// side a child can run up, a lift up the open south face, and an arm across to the rocket at the
// top. (x, y, z) is its foot. Returns the route up the stairs (for the autopilot) and the top.
export function gantry(w, x, y, z, o = {}) {
  const red = M(0xc8302a, { rough: 0.5, metal: 0.6 }), grate = M("metal", { args: [181, [120, 124, 130]], repeat: [2, 2] });
  const levels = o.levels || 6, step = 6, Y = y;
  for (const [sx, sz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) w.box(0.5, levels * step + 4, 0.5, red, x + sx, Y + (levels * step + 4) / 2, z + sz);
  for (let i = 1; i <= levels; i++) {
    const yy = Y + i * step;
    w.box(7, 0.3, 7, grate, x, yy, z);
    const rails = i === levels ? [[0, -3.4, 7, 0.1], [-3.4, -2.4, 0.1, 2.2], [-3.4, 2.4, 0.1, 2.2]] : [[0, -3.4, 7, 0.1], [-3.4, 0, 0.1, 7]];
    for (const [sx, sz, rw, rd] of rails) w.box(rw, 1, rd, red, x + sx, yy + 0.65, z + sz, { collide: true });
  }
  const tread = M(0x8a9098, { rough: 0.5, metal: 0.5 }), laneA = x + 4.25, laneB = x + 5.75, climb = [[laneB, Y + 3, z + 9.2]];
  w.steps(10, 1.5, (step + 0.15 - 3) / 10, 0.7, tread, laneB, Y + 3, z + 8.5, Math.PI);
  for (let i = 1; i <= levels; i++) {
    const h = Y + i * step + 0.15;
    w.box(3, 0.3, 1.5, grate, x + 5, Y + i * step, z + 0.75);
    climb.push([laneB, h, z + 0.7]);
    if (i === levels) break;
    w.steps(9, 1.5, 1 / 3, 7 / 9, tread, laneA, h, z, Math.PI);
    w.box(3, 0.3, 1.5, grate, x + 5, h + 2.85, z - 7.75);
    w.steps(9, 1.5, 1 / 3, 7 / 9, tread, laneB, h + 3, z - 7, 0);
    climb.push([laneA, h, z + 0.7], [laneA, h + 3, z - 7.75], [laneB, h + 3, z - 7.75]);
  }
  w.platform(2.6, 0.3, 2.6, M(0xf0c020, { rough: 0.4 }), x, Y + 2.85, z + 4.9, t => [x, Y + 2.85 + (Math.sin(t * 0.35 - Math.PI / 2) + 1) / 2 * (levels * step - 2.85), z + 4.9]);
  w.box(9, 0.4, 2.4, grate, x - 7, Y + levels * step, z);
  return { top: Y + levels * step, step, climb };
}
