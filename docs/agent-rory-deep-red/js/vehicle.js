// A car with real suspension: a Rapier rigid body driven by Rapier's
// ray-cast vehicle controller, with a chunky body and spinning wheels on top.
import * as THREE from "three";
import { R } from "./physics.js";

const LOOKS = {
  kart:  { color: 0x2a8ad8, trim: 0xffd166, w: 0.8, l: 1.25, h: 0.28, wheel: 0.34 },
  buggy: { color: 0xe8e8ec, trim: 0x7fe3ff, w: 0.95, l: 1.4, h: 0.3, wheel: 0.42 },
  taxi:  { color: 0xf4c820, trim: 0x1a1a1a, w: 0.9, l: 1.8, h: 0.35, wheel: 0.36 },
  jeep:  { color: 0x6a7a3a, trim: 0x2a2a2a, w: 0.95, l: 1.5, h: 0.35, wheel: 0.42 },
};

export class Car {
  constructor(world, x, y, z, yaw = 0, kind = "kart", o = {}) {
    this.world = world; const phys = world.phys; this.phys = phys;
    const L = this.L = { ...LOOKS[kind], ...o };
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    this.body = phys.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x, y + 0.9, z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }).setLinearDamping(0.15).setAngularDamping(1.2).setCanSleep(false));
    // a low, heavy chassis so it doesn't roll over in the corners
    this.col = phys.world.createCollider(R.ColliderDesc.cuboid(L.w, L.h, L.l).setTranslation(0, 0.1, 0).setDensity(o.density ?? 90).setFriction(0.3), this.body);
    phys.world.createCollider(R.ColliderDesc.cuboid(L.w * 0.6, 0.08, L.l * 0.6).setTranslation(0, -0.35, 0).setDensity(400).setFriction(0.1), this.body);
    const vc = this.vc = phys.world.createVehicleController(this.body);
    vc.indexUpAxis = 1; vc.setIndexForwardAxis = 2;
    try { vc.indexForwardAxis = 2; } catch (e) { /* older builds */ }
    this.wheels = [];
    const wx = L.w * 0.95, wz = L.l * 0.72;
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const i = this.wheels.length;
      vc.addWheel({ x: sx * wx, y: -0.05, z: sz * wz }, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, 0.32, L.wheel);
      vc.setWheelSuspensionStiffness(i, 28);
      vc.setWheelSuspensionCompression(i, 2.2);
      vc.setWheelSuspensionRelaxation(i, 2.8);
      vc.setWheelFrictionSlip(i, o.grip ?? 2.2);
      vc.setWheelSideFrictionStiffness(i, 1.2);
      vc.setWheelMaxSuspensionTravel(i, 0.3);
      this.wheels.push({ sx, sz, front: sz > 0 });
    }
    this.mesh = this.build(kind);
    world.scene.add(this.mesh);
    this.steer = 0; this.speed = 0; this.boost = 0;
    this.maxForce = o.force ?? 1500; this.maxSpeed = o.maxSpeed ?? 15;
  }
  build(kind) {
    const L = this.L, g = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({ color: L.color, roughness: 0.25, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
    const trim = new THREE.MeshStandardMaterial({ color: L.trim, roughness: 0.4, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.6 });
    const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
    const body = new THREE.Group(); g.add(body); this.bodyMesh = body;
    const tub = add(new THREE.BoxGeometry(L.w * 2, L.h * 1.6, L.l * 2), paint, 0, 0.12, 0); body.add(tub);
    const nose = add(new THREE.CylinderGeometry(L.w * 0.9, L.w, 0.3, 16, 1, false, 0, Math.PI), paint, 0, 0.12, L.l); nose.rotation.set(Math.PI / 2, 0, 0); body.add(nose);
    const stripe = add(new THREE.BoxGeometry(0.3, L.h * 1.62, L.l * 2.02), trim, 0, 0.12, 0); body.add(stripe);
    const seat = add(new THREE.BoxGeometry(L.w * 1.1, 0.5, 0.35), dark, 0, 0.45, -L.l * 0.35); body.add(seat);
    const wheelBar = add(new THREE.TorusGeometry(0.2, 0.035, 8, 20), dark, 0, 0.62, L.l * 0.25); wheelBar.rotation.x = -0.9; body.add(wheelBar);
    if (kind === "taxi") { const sign = add(new THREE.BoxGeometry(0.6, 0.2, 0.25), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd166, emissiveIntensity: 1.5 }), 0, 0.95, -0.2); body.add(sign); }
    for (const sx of [-1, 1]) { const hl = add(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 3 }), sx * L.w * 0.6, 0.18, L.l + 0.12); body.add(hl); }
    for (const sx of [-1, 1]) { const tl = add(new THREE.BoxGeometry(0.22, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 2 }), sx * L.w * 0.7, 0.22, -L.l - 0.02); body.add(tl); }
    // exhaust flame for the boost
    this.flame = add(new THREE.ConeGeometry(0.12, 0.6, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(4), transparent: true, opacity: 0.9 }), 0, 0.15, -L.l - 0.35); this.flame.rotation.x = -Math.PI / 2; body.add(this.flame); this.flame.visible = false;
    this.wheelMeshes = this.wheels.map(() => {
      const w = new THREE.Group();
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(L.wheel, L.wheel, 0.26, 20), dark); tyre.rotation.z = Math.PI / 2; tyre.castShadow = true; w.add(tyre);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(L.wheel * 0.5, L.wheel * 0.5, 0.28, 12), trim); hub.rotation.z = Math.PI / 2; w.add(hub);
      g.add(w); return w;
    });
    this.seat = new THREE.Vector3(0, 0.15, -L.l * 0.25);
    return g;
  }
  get pos() { return this.mesh.position; }
  get yaw() { const q = this.body.rotation(); return new THREE.Euler().setFromQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w), "YXZ").y; }
  forward() { const y = this.yaw; return new THREE.Vector3(Math.sin(y), 0, Math.cos(y)); }
  // throttle -1..1, steer -1..1 (positive = right)
  drive(dt, throttle, steer, boost) {
    const vc = this.vc;
    const lv = this.body.linvel(), f = this.forward();
    this.speed = lv.x * f.x + lv.z * f.z;
    const want = -steer * (0.45 - Math.min(0.25, Math.abs(this.speed) * 0.013));
    this.steer += (want - this.steer) * Math.min(1, dt * 8);
    if (boost && this.boost <= 0) this.boost = 1.4;
    this.boost -= dt;
    const bo = this.boost > 0 ? 1.8 : 1;
    // less push where gravity is weak (or the nose lifts off on the Moon), and no wheelies:
    // if the front wheels leave the ground while the back ones drive, ease off
    const gs = Math.min(1, Math.max(0.5, -this.phys.gravity / 20));
    const front = vc.wheelIsInContact(0) || vc.wheelIsInContact(1), back = vc.wheelIsInContact(2) || vc.wheelIsInContact(3);
    let force = throttle * this.maxForce * bo * gs * (!front && back && throttle > 0 ? 0.25 : 1), brake = 0;
    if (this.speed > this.maxSpeed * (this.boost > 0 ? 1.5 : 1) && force > 0) force = 0;
    if (throttle < 0 && this.speed > 1) { force = 0; brake = 60; }
    for (let i = 0; i < 4; i++) {
      const w = this.wheels[i];
      vc.setWheelSteering(i, w.front ? this.steer : 0);
      // four-wheel drive (the moon buggy) has the grip to climb out of craters
      vc.setWheelEngineForce(i, this.L.awd ? force * 0.6 : w.front ? 0 : force);
      vc.setWheelBrake(i, brake + (throttle === 0 ? 4 : 0));
    }
    vc.updateVehicle(dt);
    // keep it upright if it tips right over
    const q = this.body.rotation(), up = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w));
    if (up.y < 0.3) { const t = this.body.translation(); const y = this.yaw; const nq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, y, 0)); this.body.setTranslation({ x: t.x, y: t.y + 1, z: t.z }, true); this.body.setRotation({ x: nq.x, y: nq.y, z: nq.z, w: nq.w }, true); this.body.setAngvel({ x: 0, y: 0, z: 0 }, true); }
  }
  sync() {
    const t = this.body.translation(), r = this.body.rotation();
    this.mesh.position.set(t.x, t.y, t.z); this.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    const vc = this.vc;
    for (let i = 0; i < 4; i++) {
      const c = vc.wheelChassisConnectionPointCs(i), len = vc.wheelSuspensionLength(i) ?? 0.3, m = this.wheelMeshes[i];
      m.position.set(c.x, c.y - len, c.z);
      m.rotation.set(vc.wheelRotation(i) || 0, vc.wheelSteering(i) || 0, 0, "YXZ");
    }
    this.flame.visible = this.boost > 0; if (this.flame.visible) this.flame.scale.y = 0.8 + Math.random() * 0.6;
  }
  remove() { this.world.scene.remove(this.mesh); this.phys.world.removeVehicleController(this.vc); this.phys.world.removeRigidBody(this.body); }
}
