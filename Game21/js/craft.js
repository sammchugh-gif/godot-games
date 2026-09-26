// Things Rory drives on and under the sea: TORPEDO the little yellow submarine,
// and a jet-ski for chases on the surface. Both steer the way Rory walks (push
// the stick where you want to go and the craft turns and goes there); the sub
// also rises on JUMP and sinks on DIVE. A Rapier character controller with a
// ball collider slides them along rocks, walls and the sea floor.
import * as THREE from "three";
import { R } from "./physics.js";
import { animatePerson } from "./people.js";

const LOOKS = {
  sub:    { r: 0.95, speed: 7, boost: 10.5, accel: 2.6, turn: 2.4 },
  jetski: { r: 0.8, speed: 13, boost: 17, accel: 2.2, turn: 2.2, surface: true },
  boat:   { r: 1.2, speed: 10, boost: 13, accel: 1.8, turn: 1.6, surface: true },
  board:  { r: 0.6, speed: 8, boost: 8, accel: 3, turn: 1.4, surface: true },
};

export class Craft {
  constructor(world, x, y, z, yaw = 0, kind = "sub", o = {}) {
    this.world = world; this.phys = world.phys; this.kind = kind;
    const L = this.L = { ...LOOKS[kind], ...o };
    this.pos = new THREE.Vector3(x, y, z); this.vel = new THREE.Vector3();
    this.yaw = yaw; this.pitch = 0; this.roll = 0; this.turnRate = 0;
    this.camYaw = yaw + Math.PI; this.camPitch = kind === "sub" ? 0.22 : 0.3; this.camDist = kind === "sub" ? 7 : 7.5;
    this.camPos = new THREE.Vector3(); this.snap = true;
    this.body = this.phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z));
    this.col = this.phys.world.createCollider(R.ColliderDesc.ball(L.r).setFriction(0), this.body);
    const cc = this.cc = this.phys.world.createCharacterController(0.05);
    cc.setUp({ x: 0, y: 1, z: 0 }); cc.setSlideEnabled(true); cc.setMaxSlopeClimbAngle(Math.PI / 2); cc.setMinSlopeSlideAngle(Math.PI / 2);
    this.mesh = kind === "sub" ? this.buildSub() : kind === "board" ? this.buildBoard() : this.buildJetski(kind === "boat");
    world.scene.add(this.mesh);
    this.bump = 0; this.speed = 0; this.boosting = false;
    this.ignore = new Set();   // colliders it passes through (Rory's own body while he's aboard)
    this.pass = c => !this.ignore.has(c.handle);
  }
  // ------------------------------------------------------------ looks
  buildSub() {
    const g = new THREE.Group(), body = this.bodyG = new THREE.Group(); g.add(body);
    const paint = new THREE.MeshPhysicalMaterial({ color: 0xffc21a, roughness: 0.3, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.15 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.5, metalness: 0.6 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc89a3a, roughness: 0.35, metalness: 0.9 });
    const add = (geo, m, x, y, z, parent = body) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };
    // the hull: a fat capsule lying along the way it goes
    const hull = add(new THREE.CapsuleGeometry(0.72, 1.5, 12, 24), paint, 0, 0, 0); hull.rotation.x = Math.PI / 2;
    const stripe = add(new THREE.TorusGeometry(0.735, 0.05, 8, 40), new THREE.MeshStandardMaterial({ color: 0x2a6ad8, roughness: 0.4 }), 0, 0, -0.35);
    void stripe;
    // the glass dome on top, with a brass rim; Rory sits under it
    add(new THREE.TorusGeometry(0.46, 0.06, 10, 32), brass, 0, 0.62, 0.15).rotation.x = Math.PI / 2;
    const dome = add(new THREE.SphereGeometry(0.48, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.25, roughness: 0.02, clearcoat: 1, depthWrite: false }), 0, 0.62, 0.15);
    dome.castShadow = false; this.seat = new THREE.Vector3(0, 0.12, 0.1);
    // big headlight eyes
    this.eyes = [];
    for (const sx of [-1, 1]) {
      const eye = add(new THREE.SphereGeometry(0.22, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d0, emissiveIntensity: 0.6, roughness: 0.2 }), sx * 0.3, 0.18, 1.32);
      eye.scale.z = 0.7;
      const pupil = add(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.2 }), 0, 0.02, 0.17, eye);
      add(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 }), 0.04, 0.05, 0.08, pupil);
      add(new THREE.TorusGeometry(0.22, 0.035, 8, 24), brass, sx * 0.3, 0.18, 1.3);
      this.eyes.push({ eye, pupil });
    }
    // a smile under the eyes
    add(new THREE.TorusGeometry(0.16, 0.025, 6, 16, Math.PI), dark, 0, -0.14, 1.4).rotation.set(0, 0, Math.PI);
    // fins, a periscope and the propeller in its ring
    add(new THREE.BoxGeometry(0.06, 0.5, 0.5), paint, 0, 0.62, -0.95).rotation.x = -0.35;
    for (const sx of [-1, 1]) { const f = add(new THREE.BoxGeometry(0.55, 0.05, 0.4), paint, sx * 0.72, 0, -0.95); f.rotation.z = sx * 0.1; const s = add(new THREE.BoxGeometry(0.35, 0.05, 0.28), paint, sx * 0.8, -0.1, 0.45); s.rotation.z = -sx * 0.3; }
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), dark, -0.25, 0.9, -0.3);
    add(new THREE.BoxGeometry(0.1, 0.08, 0.18), dark, -0.25, 1.15, -0.25);
    add(new THREE.TorusGeometry(0.36, 0.05, 8, 28), dark, 0, 0, -1.55);
    const prop = this.prop = new THREE.Group(); prop.position.set(0, 0, -1.52); body.add(prop);
    for (let i = 0; i < 3; i++) { const b = add(new THREE.BoxGeometry(0.08, 0.3, 0.02), brass, 0, 0.16, 0, prop); b.rotation.y = 0.5; const pb = new THREE.Group(); pb.rotation.z = i * Math.PI * 2 / 3; pb.add(b); prop.add(pb); }
    // headlights that only matter in the dark
    this.lights = [-1, 1].map(sx => { const l = new THREE.SpotLight(0xfff0d0, 0, 28, 0.55, 0.5, 1.2); l.position.set(sx * 0.3, 0.18, 1.4); const t = new THREE.Object3D(); t.position.set(sx * 0.6, -0.4, 8); body.add(t); l.target = t; body.add(l); return l; });
    g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
    return g;
  }
  buildJetski(big) {
    const g = new THREE.Group(), body = this.bodyG = new THREE.Group(); g.add(body);
    const s = big ? 1.4 : 1;
    const paint = new THREE.MeshPhysicalMaterial({ color: big ? 0xf4f4f8 : 0xe83a3a, roughness: 0.3, clearcoat: 1 });
    const trim = new THREE.MeshStandardMaterial({ color: big ? 0x2a6ad8 : 0x1a1a1a, roughness: 0.5 });
    const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x * s, y * s, z * s); me.scale.setScalar(s); me.castShadow = true; body.add(me); return me; };
    const hull = add(new THREE.CylinderGeometry(0.02, 0.55, 1.9, 16, 1), paint, 0, 0.05, 0.1); hull.rotation.x = Math.PI / 2; hull.scale.set(s, s, s * 0.45);
    add(new THREE.BoxGeometry(0.9, 0.3, 1.4), paint, 0, 0.12, -0.35);
    add(new THREE.BoxGeometry(0.45, 0.2, 0.9), trim, 0, 0.35, -0.35);
    add(new THREE.BoxGeometry(0.08, 0.4, 0.08), trim, 0, 0.45, 0.35).rotation.x = -0.4;
    add(new THREE.BoxGeometry(0.7, 0.06, 0.06), trim, 0, 0.62, 0.45);
    this.seat = new THREE.Vector3(0, 0.25 * s, -0.3 * s);
    this.prop = new THREE.Group(); body.add(this.prop);
    g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
    return g;
  }
  buildBoard() {
    const g = new THREE.Group(), body = this.bodyG = new THREE.Group(); g.add(body);
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.6, 8, 16), new THREE.MeshPhysicalMaterial({ color: 0xf4f0e8, roughness: 0.3, clearcoat: 1 }));
    b.rotation.x = Math.PI / 2; b.scale.set(1, 1, 0.22); b.castShadow = true; body.add(b);
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 2.0), new THREE.MeshStandardMaterial({ color: 0xe83a3a })); s.position.y = 0.065; body.add(s);
    this.seat = new THREE.Vector3(0, 0.08, 0); this.standing = true;
    g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
    return g;
  }
  // Rory climbs in: his figure sits in the seat and rides along
  board(rig) { this.rig = rig; this.bodyG.add(rig.root); rig.root.position.copy(this.seat); rig.root.rotation.set(0, 0, 0); rig.root.scale.setScalar(this.kind === "sub" ? 0.8 : 1); }
  leave(scene) { if (!this.rig) return; const r = this.rig.root; scene.add(r); r.scale.setScalar(1); this.rig = null; }
  lightsOn(on, power = 60) { for (const l of this.lights || []) l.intensity = on ? power : 0; }
  // ------------------------------------------------------------ driving
  drive(dt, input, frozen = false) {
    const L = this.L, sea = this.world.sea;
    const [lx, ly] = input.takeLook();
    this.camYaw -= lx * 0.006; this.camPitch = THREE.MathUtils.clamp(this.camPitch + ly * 0.004, -0.6, 1.0);
    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
    let mx = 0, mz = 0;
    if (!frozen) { mx = input.my * fx - input.mx * fz; mz = input.my * fz + input.mx * fx; }
    let mag = Math.min(1, Math.hypot(mx, mz));
    if (L.auto) { if (mag < 0.05) { mx = Math.sin(this.yaw); mz = Math.cos(this.yaw); } mag = 1; }
    this.boosting = !frozen && input.boostHeld;
    const top = L.auto || (this.boosting ? L.boost : L.speed) * mag;
    // turn towards where the stick points, and go (a craft can't go sideways)
    if (mag > 0.05) {
      let d = Math.atan2(mx, mz) - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      const want = THREE.MathUtils.clamp(d * 3, -L.turn, L.turn);
      this.turnRate += (want - this.turnRate) * Math.min(1, dt * 6);
    } else this.turnRate *= Math.exp(-dt * 6);
    this.yaw += this.turnRate * dt;
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const hs = Math.max(0, fwd.x * this.vel.x + fwd.z * this.vel.z);
    const ns = hs + (top * Math.max(0, Math.cos(Math.min(Math.PI / 2, Math.abs(this.turnRate) * 0.3))) - hs) * Math.min(1, dt * L.accel);
    this.vel.x = fwd.x * ns; this.vel.z = fwd.z * ns;
    // up and down
    if (L.surface) this.vel.y = 0;
    else {
      const vy = frozen ? 0 : input.jumpHeld ? 3.5 : input.diveHeld ? -3.5 : 0;
      this.vel.y += (vy - this.vel.y) * Math.min(1, dt * 3);
    }
    const want = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    this.cc.computeColliderMovement(this.col, want, R.QueryFilterFlags.EXCLUDE_SENSORS, undefined, this.pass);
    const m = this.cc.computedMovement();
    const lost = Math.hypot(want.x - m.x, want.z - m.z);
    if (lost > 0.02 && ns > 3 && this.bump <= 0) { this.bump = 0.6; if (this.onBump) this.onBump(ns); }
    this.bump -= dt;
    if (lost > 0.01) { this.vel.x = m.x / Math.max(dt, 1e-4); this.vel.z = m.z / Math.max(dt, 1e-4); }
    this.pos.x += m.x; this.pos.z += m.z; this.pos.y += m.y;
    // the sea's surface: the sub can come up until its dome breaks the surface; boats ride on it
    if (sea) {
      const h = sea.height(this.pos.x, this.pos.z);
      if (L.surface) this.pos.y = h + 0.05;
      else if (this.pos.y > h - 0.55) { this.pos.y = h - 0.55; this.vel.y = Math.min(0, this.vel.y); }
    }
    this.body.setNextKinematicTranslation({ x: this.pos.x, y: this.pos.y, z: this.pos.z });
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    this.pose(dt, sea);
    this.driftCam(dt, mag);
  }
  pose(dt, sea) {
    const g = this.mesh, L = this.L;
    g.position.copy(this.pos);
    let pitch = -this.vel.y * 0.08, roll = -this.turnRate * 0.18 * Math.min(1, this.speed / 4);
    if (L.surface && sea) {
      const [nx, , nz] = sea.normal(this.pos.x, this.pos.z), c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      pitch = -(nx * s + nz * c) * 1.2 - this.speed * 0.012; roll += (nx * c - nz * s) * 1.2;
      g.position.y += Math.sin(this.world.t * 3 + this.pos.x) * 0.03;
    }
    this.pitch += (pitch - this.pitch) * Math.min(1, dt * 4); this.roll += (roll - this.roll) * Math.min(1, dt * 4);
    g.rotation.set(0, this.yaw, 0); this.bodyG.rotation.set(this.pitch, 0, this.roll);
    if (this.prop) this.prop.rotation.z += dt * (4 + this.speed * 4);
    // TORPEDO looks where he's going
    if (this.eyes) for (const e of this.eyes) { e.pupil.position.x = THREE.MathUtils.clamp(this.turnRate * 0.03, -0.05, 0.05); e.pupil.position.y = 0.02 + THREE.MathUtils.clamp(this.vel.y * 0.012, -0.05, 0.05); }
    if (this.rig) animatePerson(this.rig, { dt, speed: 0, grounded: true, sit: !this.standing, talk: this.talking, wave: this.standing && Math.sin(this.world.t * 0.7) > 0.8 });
    // a trail: bubbles from the propeller, or foam behind a boat
    const fx = this.world.fx;
    if (fx && this.speed > 1 && Math.random() < dt * (L.surface ? 30 : 12)) {
      const bx = this.pos.x - Math.sin(this.yaw) * 1.6, bz = this.pos.z - Math.cos(this.yaw) * 1.6;
      if (L.surface) fx.burst(bx, this.pos.y + 0.1, bz, 0xe8f6ff, 2, { bright: 0.9, speed: 1.2, up: 1.2, life: 0.7, size: 0.35, gravity: -5, drag: 2 });
      else fx.bubble(bx, this.pos.y, bz, sea ? sea.level : Infinity, 1);
    }
  }
  // the camera swings round behind the craft as it goes
  driftCam(dt, moving) {
    if (moving > 0.3 && this.speed > 1) {
      let d = this.yaw + Math.PI - this.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.camYaw += d * Math.min(1, dt * 1.4 * moving);
    }
  }
  camera(cam, dt) {
    const look = new THREE.Vector3(this.pos.x, this.pos.y + 0.8, this.pos.z);
    const dir = new THREE.Vector3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch));
    let dist = this.camDist;
    const hit = this.phys.ray({ x: look.x, y: look.y, z: look.z }, { x: dir.x, y: dir.y, z: dir.z }, dist, this.col, this.pass);
    if (hit !== null) dist = Math.max(1.5, hit - 0.3);
    const want = look.clone().addScaledVector(dir, dist);
    if (this.snap) { this.camPos.copy(want); this.snap = false; }
    this.camPos.lerp(want, hit !== null ? 1 : 1 - Math.exp(-dt * 8));
    cam.position.copy(this.camPos); cam.lookAt(look);
    this.world.followShadow(this.pos);
  }
  teleport(x, y, z, yaw) { this.pos.set(x, y, z); this.vel.set(0, 0, 0); if (yaw !== undefined) { this.yaw = yaw; this.camYaw = yaw + Math.PI; } this.body.setTranslation({ x, y, z }, true); this.snap = true; }
  dispose() { this.world.scene.remove(this.mesh); try { this.phys.world.removeCharacterController(this.cc); this.phys.world.removeRigidBody(this.body); } catch (e) { /* the world went first */ } }
}

// TORPEDO on his own, for his portrait in the dialogue box
export function subModel() { const o = {}; return Craft.prototype.buildSub.call(o); }
