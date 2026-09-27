// A car with real suspension: a Rapier rigid body driven by Rapier's
// ray-cast vehicle controller, with a chunky body and spinning wheels on top.
import * as THREE from "three";
import { R } from "./physics.js";

const LOOKS = {
  kart:  { color: 0x2a8ad8, trim: 0xffd166, w: 0.8, l: 1.25, h: 0.28, wheel: 0.34 },
  buggy: { color: 0xff6a2a, trim: 0xffd166, w: 0.95, l: 1.4, h: 0.3, wheel: 0.42 },
  taxi:  { color: 0xf4c820, trim: 0x1a1a1a, w: 0.9, l: 1.8, h: 0.35, wheel: 0.36 },
  jeep:  { color: 0xe8e0c8, trim: 0x2a2a2a, w: 0.95, l: 1.5, h: 0.35, wheel: 0.42 },
  // Lisbon's number 28, a husky sled, a camel, and a zebu cart: the same suspension under a different look
  tram:  { color: 0xffd23f, trim: 0xf4f4f0, w: 0.95, l: 2.4, wb: 1.4, h: 0.4, wheel: 0.34, hideWheels: true },
  sled:  { color: 0xd83a2a, trim: 0xf4e8d0, w: 0.7, l: 1.5, h: 0.2, wheel: 0.34, hideWheels: true, animals: "husky" },
  camel: { color: 0xc8a060, trim: 0xd83a6a, w: 0.7, l: 1.5, h: 0.2, wheel: 0.4, hideWheels: true, animals: "camel" },
  zebu:  { color: 0x8a5a2a, trim: 0xffd23f, w: 0.85, l: 1.4, h: 0.25, wheel: 0.6, hideWheels: "front", animals: "zebu" },
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
    const wx = L.w * 0.95, wz = (L.wb ?? L.l) * 0.72;   // (wb: a shorter wheelbase than the body, so a long tram still turns)
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
    this.legs = [];
    if (L.animals || kind === "tram") this.buildSpecial(kind, g, body, add, paint, trim, dark);
    else this.buildCar(kind, L, g, body, add, paint, trim, dark);
    this.wheelMeshes = this.wheels.map((w, i) => {
      const grp = new THREE.Group();
      const hidden = L.hideWheels === true || (L.hideWheels === "front" && w.front);
      if (!hidden) {
        const tyre = new THREE.Mesh(new THREE.CylinderGeometry(L.wheel, L.wheel, kind === "zebu" ? 0.14 : 0.26, 20), kind === "zebu" ? trim : dark); tyre.rotation.z = Math.PI / 2; tyre.castShadow = true; grp.add(tyre);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(L.wheel * 0.5, L.wheel * 0.5, kind === "zebu" ? 0.16 : 0.28, 12), kind === "zebu" ? dark : trim); hub.rotation.z = Math.PI / 2; grp.add(hub);
        if (kind === "zebu") for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, L.wheel * 1.8, 0.05), trim); sp.rotation.x = k / 6 * Math.PI; grp.add(sp); }
      }
      g.add(grp); void i; return grp;
    });
    this.seat = new THREE.Vector3(0, 0.15, -L.l * 0.25);
    if (kind === "tram") this.seat.set(0, 0.35, 0.4);
    if (kind === "sled") this.seat.set(0, 0.05, -0.2);
    if (kind === "camel") this.seat.set(0, 1.1, -0.1);
    if (kind === "zebu") this.seat.set(0, 0.35, -0.4);
    return g;
  }
  buildCar(kind, L, g, body, add, paint, trim, dark) {
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
  }
  // the tram, and the animals: legs swing with the wheels
  buildSpecial(kind, g, body, add, paint, trim, dark) {
    const L = this.L;
    const flame = () => { this.flame = add(new THREE.ConeGeometry(0.12, 0.6, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd166).multiplyScalar(3), transparent: true, opacity: 0.8 }), 0, 0.2, -L.l - 0.4); this.flame.rotation.x = -Math.PI / 2; body.add(this.flame); this.flame.visible = false; };
    if (kind === "tram") {
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x9ad8ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55 });
      const skirt = add(new THREE.BoxGeometry(L.w * 2, 0.5, L.l * 2), paint, 0, 0.0, 0); body.add(skirt);
      const cabin = add(new THREE.BoxGeometry(L.w * 1.9, 0.9, L.l * 1.9), glass, 0, 0.7, 0); body.add(cabin);
      for (const sz of [-1, 1]) { const end = add(new THREE.BoxGeometry(L.w * 1.9, 0.9, 0.12), paint, 0, 0.7, sz * L.l * 0.95); body.add(end); }
      for (let i = -2; i <= 2; i++) { const post = add(new THREE.BoxGeometry(0.08, 0.9, 0.08), paint, L.w * 0.95, 0.7, i * L.l * 0.45); body.add(post); const post2 = add(new THREE.BoxGeometry(0.08, 0.9, 0.08), paint, -L.w * 0.95, 0.7, i * L.l * 0.45); body.add(post2); }
      const roof = add(new THREE.BoxGeometry(L.w * 2.1, 0.12, L.l * 2.1), trim, 0, 1.2, 0); body.add(roof);
      const pole = add(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), dark, 0, 1.8, -0.3); pole.rotation.x = 0.5; body.add(pole);
      const sign = add(new THREE.BoxGeometry(0.5, 0.22, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe8a0, emissiveIntensity: 1.2 }), 0, 1.05, L.l * 0.96); body.add(sign);
      for (const sx of [-1, 1]) { const hl = add(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 3 }), sx * L.w * 0.6, 0.3, L.l + 0.02); body.add(hl); }
      flame(); return;
    }
    const fur = new THREE.MeshStandardMaterial({ color: kind === "husky" ? 0xd8d8e0 : kind === "sled" ? 0xd8d8e0 : kind === "camel" ? 0xc8a060 : 0x9a8a80, roughness: 0.95 });
    const furDark = new THREE.MeshStandardMaterial({ color: kind === "sled" ? 0x4a4a54 : kind === "camel" ? 0x8a6a3a : 0x5a4a44, roughness: 0.95 });
    const animal = (x, z, s, kindA) => {
      const a = new THREE.Group(); a.position.set(x, 0, z); g.add(a);
      const m = (geo, mt, px, py, pz, parent = a) => { const me = new THREE.Mesh(geo, mt); me.position.set(px, py, pz); me.castShadow = true; parent.add(me); return me; };
      if (kindA === "husky") {
        m(new THREE.CapsuleGeometry(0.17 * s, 0.4 * s, 6, 10), fur, 0, 0.42 * s, 0).rotation.x = Math.PI / 2;
        const head = m(new THREE.SphereGeometry(0.15 * s, 12, 8), fur, 0, 0.55 * s, 0.35 * s); m(new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.14 * s), furDark, 0, -0.03 * s, 0.14 * s, head);
        for (const sx of [-1, 1]) m(new THREE.ConeGeometry(0.05 * s, 0.12 * s, 6), furDark, sx * 0.09 * s, 0.15 * s, 0, head);
        const tail = m(new THREE.CapsuleGeometry(0.04 * s, 0.25 * s, 4, 6), fur, 0, 0.55 * s, -0.3 * s); tail.rotation.x = -0.9;
        for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const leg = new THREE.Group(); leg.position.set(sx * 0.1 * s, 0.38 * s, sz * 0.17 * s); a.add(leg); m(new THREE.CapsuleGeometry(0.04 * s, 0.3 * s, 4, 6), fur, 0, -0.17 * s, 0, leg); this.legs.push({ leg, ph: sz * Math.PI / 2 + (sx > 0 ? Math.PI : 0), amp: 0.7 }); }
      } else if (kindA === "camel") {
        const bod = m(new THREE.CapsuleGeometry(0.45 * s, 1.0 * s, 8, 14), fur, 0, 1.25 * s, 0); bod.rotation.x = Math.PI / 2;
        m(new THREE.SphereGeometry(0.42 * s, 12, 10), fur, 0, 1.72 * s, 0.05 * s).scale.set(0.8, 0.8, 1);
        const neck = m(new THREE.CapsuleGeometry(0.16 * s, 0.9 * s, 6, 10), fur, 0, 1.75 * s, 0.75 * s); neck.rotation.x = 0.5;
        const head = m(new THREE.BoxGeometry(0.28 * s, 0.26 * s, 0.5 * s), fur, 0, 2.15 * s, 1.15 * s);
        for (const sx of [-1, 1]) { m(new THREE.SphereGeometry(0.04 * s, 6, 6), furDark, sx * 0.12 * s, 0.06 * s, 0.2 * s, head); m(new THREE.ConeGeometry(0.04 * s, 0.1 * s, 5), fur, sx * 0.12 * s, 0.16 * s, -0.1 * s, head); }
        const tail = m(new THREE.CapsuleGeometry(0.03 * s, 0.5 * s, 4, 6), furDark, 0, 1.1 * s, -0.75 * s); tail.rotation.x = 0.4;
        const saddle = m(new THREE.BoxGeometry(0.7 * s, 0.14 * s, 0.9 * s), new THREE.MeshStandardMaterial({ color: L.trim, roughness: 0.8 }), 0, 1.55 * s, -0.35 * s); saddle.castShadow = true;
        for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const leg = new THREE.Group(); leg.position.set(sx * 0.25 * s, 1.1 * s, sz * 0.5 * s); a.add(leg); m(new THREE.CapsuleGeometry(0.08 * s, 0.95 * s, 4, 8), fur, 0, -0.55 * s, 0, leg); m(new THREE.SphereGeometry(0.11 * s, 8, 6), furDark, 0, -1.05 * s, 0.03 * s, leg); this.legs.push({ leg, ph: sz * Math.PI / 2 + (sx > 0 ? Math.PI : 0), amp: 0.45 }); }
      } else if (kindA === "zebu") {
        const bod = m(new THREE.CapsuleGeometry(0.4 * s, 0.9 * s, 8, 14), fur, 0, 0.95 * s, 0); bod.rotation.x = Math.PI / 2;
        m(new THREE.SphereGeometry(0.32 * s, 12, 10), fur, 0, 1.35 * s, 0.25 * s);
        const head = m(new THREE.BoxGeometry(0.34 * s, 0.32 * s, 0.5 * s), fur, 0, 1.0 * s, 0.85 * s);
        for (const sx of [-1, 1]) { const horn = m(new THREE.ConeGeometry(0.05 * s, 0.4 * s, 6), new THREE.MeshStandardMaterial({ color: 0xe8e0c8 }), sx * 0.2 * s, 0.25 * s, -0.05 * s, head); horn.rotation.z = -sx * 0.9; m(new THREE.SphereGeometry(0.05 * s, 6, 6), furDark, sx * 0.14 * s, 0.05 * s, 0.26 * s, head); }
        m(new THREE.BoxGeometry(0.2 * s, 0.5 * s, 0.1 * s), furDark, 0, 0.55 * s, 0.95 * s);
        for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const leg = new THREE.Group(); leg.position.set(sx * 0.25 * s, 0.85 * s, sz * 0.45 * s); a.add(leg); m(new THREE.CapsuleGeometry(0.07 * s, 0.7 * s, 4, 8), fur, 0, -0.42 * s, 0, leg); this.legs.push({ leg, ph: sz * Math.PI / 2 + (sx > 0 ? Math.PI : 0), amp: 0.45 }); }
      }
      return a;
    };
    if (kind === "sled") {
      const wood = new THREE.MeshStandardMaterial({ color: 0xa87848, roughness: 0.9 });
      for (const sx of [-1, 1]) { const run = add(new THREE.BoxGeometry(0.08, 0.08, L.l * 2.4), paint, sx * L.w * 0.9, -0.42, 0.1); body.add(run); const tip = add(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), paint, sx * L.w * 0.9, -0.2, L.l * 1.2); tip.rotation.x = -0.6; body.add(tip); for (const z of [-0.8, 0.6]) { const st = add(new THREE.BoxGeometry(0.06, 0.4, 0.06), wood, sx * L.w * 0.9, -0.2, z); body.add(st); } }
      for (let i = 0; i < 5; i++) { const slat = add(new THREE.BoxGeometry(L.w * 1.9, 0.05, 0.22), wood, 0, 0.0, -1.0 + i * 0.45); body.add(slat); }
      const bar = add(new THREE.BoxGeometry(L.w * 2, 0.06, 0.06), wood, 0, 0.7, -L.l * 0.9); body.add(bar);
      for (const sx of [-1, 1]) { const up = add(new THREE.BoxGeometry(0.06, 0.75, 0.06), wood, sx * L.w * 0.95, 0.35, -L.l * 0.9); body.add(up); }
      const sack = add(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: L.trim, roughness: 0.9 }), 0, 0.25, 0.7); sack.scale.set(1.2, 0.7, 1); body.add(sack);
      // six huskies in pairs, on a line
      for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) animal(sx * 0.45, L.l + 1.2 + i * 1.1, 0.9, "husky");
      const line = add(new THREE.BoxGeometry(0.03, 0.03, 3.6), dark, 0, 0.35, L.l + 2.2); g.add(line);
      flame(); return;
    }
    if (kind === "camel") {
      animal(0, 0.2, 0.9, "camel");
      // the saddle blanket carries the colour
      const blanket = add(new THREE.BoxGeometry(0.9, 0.06, 1.0), new THREE.MeshStandardMaterial({ color: L.trim, roughness: 0.9 }), 0, 1.33, -0.15); body.add(blanket);
      flame(); return;
    }
    if (kind === "zebu") {
      const wood = new THREE.MeshStandardMaterial({ color: L.color, roughness: 0.9 });
      const bed = add(new THREE.BoxGeometry(L.w * 2, 0.12, L.l * 1.6), wood, 0, 0.1, -0.3); body.add(bed);
      for (const sx of [-1, 1]) { const side = add(new THREE.BoxGeometry(0.06, 0.5, L.l * 1.6), wood, sx * L.w * 0.97, 0.4, -0.3); body.add(side); }
      const back = add(new THREE.BoxGeometry(L.w * 2, 0.5, 0.06), wood, 0, 0.4, -L.l * 1.1); body.add(back);
      const shaft = add(new THREE.BoxGeometry(0.08, 0.08, 2.2), wood, 0, 0.25, L.l * 0.9); body.add(shaft);
      const load = add(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3ad06a, roughness: 0.9 }), -0.3, 0.45, -0.7); load.scale.set(1, 0.7, 1); body.add(load);
      const load2 = add(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff8a2a, roughness: 0.9 }), 0.35, 0.4, -0.5); load2.scale.set(1, 0.7, 1); body.add(load2);
      animal(0, L.l + 1.6, 0.9, "zebu");
      flame(); return;
    }
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
    // the animals trot with the wheels
    if (this.legs.length) { const a = vc.wheelRotation(2) || 0; for (const l of this.legs) l.leg.rotation.x = Math.sin(a + l.ph) * l.amp * Math.min(1, Math.abs(this.speed) * 0.4); }
  }
  remove() { this.world.scene.remove(this.mesh); this.phys.world.removeVehicleController(this.vc); this.phys.world.removeRigidBody(this.body); }
}
