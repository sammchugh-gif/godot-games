// Rory in third person: the Rapier walker, the rig, the camera that follows
// him round, and the feel of the moves (coyote time, jump buffering, pads,
// floating in low gravity), and, new in Deep Red, swimming: walk into the sea
// and he swims in three dimensions with an air meter.
import * as THREE from "three";
import { Walker } from "./physics.js";
import { makePerson, animatePerson, RORY, spaceSuit, divingSuit } from "./people.js";

const up = new THREE.Vector3(0, 1, 0);

// the camera looks through colliders tagged "camthru" (a laser net Rory mustn't fly through)
const seeThrough = c => c.userTag !== "camthru";

export class Player {
  constructor(world, x = 0, y = 0, z = 0, yaw = 0) {
    this.world = world;
    this.walker = new Walker(world.phys, x, y, z);
    this.rig = makePerson(RORY);
    this.obj = this.rig.root;
    this.obj.position.set(x, y, z);
    world.scene.add(this.obj);
    // a soft blob shadow helps judge jumps even where the sun's shadow is off
    this.blob = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
    this.blob.rotation.x = -Math.PI / 2; world.scene.add(this.blob);
    this.yaw = yaw;           // which way Rory faces
    this.camYaw = yaw + Math.PI; this.camPitch = 0.32; this.camDist = 5.2;
    this.coyote = 0; this.buffer = 0; this.jumps = 0;
    this.speed = 0;
    this.maxSpeed = 5.6;
    this.swimSpeed = 3.6;
    this.frozen = false;
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3();
    this.lastSafe = new THREE.Vector3(x, y, z);
    this.gravityScale = 1;
    this.spawn = new THREE.Vector3(x, y, z);
    // swimming: air is 0..1 and lasts airMax seconds under water
    this.swimming = false; this.headUnder = false; this.air = 1; this.airMax = 45; this.hop = 0; this.pitch = 0;
  }
  get pos() { return this.walker.pos; }
  suit(on) { spaceSuit(this.rig, on); this.suited = on; }
  dive(on) { divingSuit(this.rig, on); this.diving = on; }
  teleport(x, y, z, yaw) { this.walker.teleport(x, y, z); this.obj.position.set(x, y, z); if (yaw !== undefined) { this.yaw = yaw; this.camYaw = yaw + Math.PI; } this.snapCam = true; }
  // the sea surface over Rory, or null where there is no sea
  surface() { const s = this.world.sea; return s ? s.height(this.walker.pos.x, this.walker.pos.z) : null; }
  update(dt, input, camera) {
    const w = this.walker;
    // camera drag
    const [lx, ly] = input.takeLook();
    this.camYaw -= lx * 0.006; this.camPitch = THREE.MathUtils.clamp(this.camPitch + ly * 0.004, this.swimming ? -0.9 : -0.15, 1.1);
    // movement relative to the camera
    let mx = 0, mz = 0;
    if (!this.frozen) {
      const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw);
      // forward is away from the camera, right is forward turned a quarter
      mx = input.my * fx - input.mx * fz;
      mz = input.my * fz + input.mx * fx;
    }
    const mag = Math.min(1, Math.hypot(mx, mz));
    // in or out of the water: deep enough to swim once the water is past his waist
    const surf = this.surface();
    const depth = surf === null ? -1 : surf - w.pos.y;
    const wasSwimming = this.swimming;
    if (this.hop > 0) this.hop -= dt;
    if (!this.swimming && depth > 0.95 && this.hop <= 0) this.swimming = true;
    else if (this.swimming && (depth < 0.6 || this.hop > 0)) this.swimming = false;
    if (this.swimming !== wasSwimming) {
      w.setSwim(this.swimming);
      if (this.swimming) { w.vel.y = Math.max(w.vel.y, -2); if (this.onSplash) this.onSplash(depth); }
      else if (!this.frozen && this.hop <= 0 && w.vel.y > -1) w.vel.y = Math.max(w.vel.y, 2.5); // a little push up onto the shore
    }
    if (this.swimming) return this.swimUpdate(dt, input, camera, mx, mz, mag, surf);
    // walking: air comes straight back
    this.headUnder = false; this.air = Math.min(1, this.air + dt * 0.6);
    const target = this.maxSpeed * (input.boostHeld ? 1.35 : 1) * mag;
    const accel = w.grounded ? 30 : 12;
    // horizontal velocity eases toward the stick
    const tvx = mag > 0.01 ? mx / Math.max(mag, 1e-3) * target : 0, tvz = mag > 0.01 ? mz / Math.max(mag, 1e-3) * target : 0;
    const k = Math.min(1, accel * dt / Math.max(1, this.maxSpeed));
    w.vel.x += (tvx - w.vel.x) * Math.min(1, k * 3);
    w.vel.z += (tvz - w.vel.z) * Math.min(1, k * 3);
    if (mag > 0.05) {
      const want = Math.atan2(w.vel.x, w.vel.z);
      let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * 12);
    }
    // gravity: low-gravity bubbles
    let gs = 1, floating = false;
    for (const z of this.world.zones) {
      const d = Math.hypot(w.pos.x - z.x, w.pos.y + 0.7 - z.y, w.pos.z - z.z);
      if (d < z.r) { gs = Math.min(gs, z.g); floating = true; }
    }
    this.gravityScale = gs;
    // spacewalks: hold JUMP to fire the jetpack, let go to drift slowly down
    if (this.world.jetpack) {
      gs *= 0.12; floating = true;
      if (input.jumpHeld && !this.frozen) { w.vel.y = Math.min(5, w.vel.y + 16 * dt); w.grounded = false; this.jetting = true; if (this.onJet) this.onJet(dt); } else this.jetting = false;
    }
    // jumping, with a little grace before and after the ledge
    if (w.grounded) { this.coyote = 0.12; this.jumps = 0; } else this.coyote -= dt;
    if (input.takeJump() && !this.frozen) this.buffer = 0.14; else this.buffer -= dt;
    let jumped = false;
    if (this.buffer > 0 && !this.world.jetpack && (this.coyote > 0 || (floating && this.jumps < 3))) {
      w.vel.y = floating ? 5.5 : 8.6; this.buffer = 0; this.coyote = 0; this.jumps++; jumped = true; w.grounded = false;
      if (this.onJump) this.onJump();
    }
    // a little extra float while the button is held on the way up
    const hold = input.jumpHeld && w.vel.y > 0 ? 0.62 : 1;
    // bounce pads
    for (const p of this.world.pads) {
      if (Math.hypot(w.pos.x - p.x, w.pos.z - p.z) < p.r && Math.abs(w.pos.y - p.y) < 0.35 && w.vel.y <= 0.5) {
        w.vel.y = p.power; w.grounded = false; p.t = 0.4; jumped = true; if (this.onPad) this.onPad(p);
      }
    }
    w.move(dt, gs * hold);
    if (w.justLanded && this.onLand) this.onLand(-w.vel.y);
    // fell off the world: back to the last safe ground
    // remember the last firm ground: only ground that can't move away (never a ferry deck or a cable car)
    if (w.grounded && w.onMover === null && depth < 0.3) {
      const h = this.world.phys.rayHit({ x: w.pos.x, y: w.pos.y + 0.3, z: w.pos.z }, { x: 0, y: -1, z: 0 }, 1.0, w.col);
      const body = h && h.collider.parent();
      if (h && (!body || body.isFixed())) this.lastSafe.copy(w.pos);
    }
    if (w.pos.y < (this.world.floorY ?? -20)) { const s = this.lastSafe; this.teleport(s.x, s.y + 0.5, s.z); if (this.onFall) this.onFall(); }
    // pose the body
    this.obj.position.copy(w.pos);
    this.obj.rotation.y = this.yaw;
    this.pitch += (0 - this.pitch) * Math.min(1, dt * 8); this.rig.hips.rotation.x = this.pitch;
    this.speed = Math.hypot(w.vel.x, w.vel.z);
    if (this.rig.suit) for (const f of this.rig.suit.flames) { f.visible = !!this.jetting; if (this.jetting) f.scale.y = 0.8 + Math.random() * 0.6; }
    animatePerson(this.rig, { dt, speed: this.speed, grounded: w.grounded, vy: w.vel.y, float: floating && !w.grounded, talk: this.talking, wave: this.waving, wade: depth > 0.2 });
    this.shadow();
    this.updateCamera(dt, camera, mag);
    return jumped;
  }
  // swimming: the stick swims him along, JUMP rises, DIVE sinks, and at the surface JUMP hops
  // out onto anything low enough
  swimUpdate(dt, input, camera, mx, mz, mag, surf) {
    const w = this.walker;
    const target = this.swimSpeed * mag;
    const tvx = mag > 0.01 ? mx / Math.max(mag, 1e-3) * target : 0, tvz = mag > 0.01 ? mz / Math.max(mag, 1e-3) * target : 0;
    const k = Math.min(1, dt * 4);
    w.vel.x += (tvx - w.vel.x) * k; w.vel.z += (tvz - w.vel.z) * k;
    if (mag > 0.05) { const want = Math.atan2(w.vel.x, w.vel.z); let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * Math.min(1, dt * 8); }
    // up and down
    const headY = w.pos.y + 1.45, atTop = headY >= surf - 0.05;
    let vy = 0.5; // a gentle float upwards when nothing is pressed
    if (!this.frozen) {
      if (input.jumpHeld) vy = 3.6;
      if (input.diveHeld) vy = -3.6;
      const wheel = input.wheelY || 0; if (wheel) { vy = wheel > 0 ? -3.6 : 3.6; input.wheelY = 0; }
    }
    if (this.noAir) vy = Math.max(vy, 4); // out of air: straight up
    if (atTop && vy > 0) { vy = 0; w.pos.y = surf - 1.5; }
    w.vel.y += (vy - w.vel.y) * Math.min(1, dt * 5);
    // treading water at the surface, JUMP is a hop up onto a jetty or the shore
    if (input.takeJump() && atTop && !this.frozen && !this.noAir) {
      const ahead = this.world.phys.ray({ x: w.pos.x + Math.sin(this.yaw) * 0.6, y: surf + 1.6, z: w.pos.z + Math.cos(this.yaw) * 0.6 }, { x: 0, y: -1, z: 0 }, 2.0, w.col);
      if (ahead !== null || mag > 0.3) { this.hop = 0.45; this.swimming = false; w.setSwim(false); w.vel.y = 7.5; w.grounded = false; if (this.onJump) this.onJump(); }
    }
    input.jumpPressed = false;
    w.move(dt, 0);
    // air: it drains while his head is under and comes back at the surface
    this.headUnder = w.pos.y + 1.4 < surf;
    if (this.headUnder) this.air = Math.max(0, this.air - dt / this.airMax); else this.air = Math.min(1, this.air + dt * 0.5);
    if (this.air <= 0 && !this.noAir) { this.noAir = true; if (this.onNoAir) this.onNoAir(); }
    if (this.noAir && !this.headUnder) this.noAir = false;
    if (this.headUnder && Math.random() < dt * 1.5 && this.onBubble) this.onBubble();
    // pose: horizontal when swimming along, upright when treading water
    this.obj.position.copy(w.pos);
    this.obj.rotation.y = this.yaw;
    const sp = Math.hypot(w.vel.x, w.vel.z);
    const wantPitch = atTop && sp < 0.5 ? 0.15 : Math.min(1.3, 0.35 + sp * 0.3 + Math.max(0, -w.vel.y) * 0.1);
    this.pitch += (wantPitch - this.pitch) * Math.min(1, dt * 4); this.rig.hips.rotation.x = this.pitch;
    this.speed = sp;
    animatePerson(this.rig, { dt, speed: 0, grounded: false, vy: w.vel.y, swim: true, swimSpeed: sp + Math.abs(w.vel.y), talk: this.talking, wave: this.waving });
    if (w.pos.y < (this.world.floorY ?? -20)) { const s = this.lastSafe; this.teleport(s.x, s.y + 0.5, s.z); if (this.onFall) this.onFall(); }
    this.shadow();
    this.updateCamera(dt, camera, mag);
    return false;
  }
  shadow() {
    const w = this.walker;
    const below = this.world.phys.ray({ x: w.pos.x, y: w.pos.y + 0.5, z: w.pos.z }, { x: 0, y: -1, z: 0 }, 30, w.col);
    if (below !== null) { this.blob.visible = true; this.blob.position.set(w.pos.x, w.pos.y + 0.5 - below + 0.02, w.pos.z); const h = below - 0.5; this.blob.material.opacity = 0.3 * Math.max(0, 1 - h / 8); this.blob.scale.setScalar(1 + h * 0.05); }
    else this.blob.visible = false;
  }
  updateCamera(dt, camera, moving) {
    const p = this.walker.pos;
    // drift the camera round behind Rory while he runs
    if (moving > 0.3 && !this.camLock) {
      const behind = this.yaw + Math.PI;
      let d = behind - this.camYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.camYaw += d * Math.min(1, dt * 0.9 * moving);
    }
    const look = new THREE.Vector3(p.x, p.y + 1.25, p.z);
    const dir = new THREE.Vector3(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch));
    let dist = this.camDist;
    const hit = this.world.phys.ray({ x: look.x, y: look.y, z: look.z }, { x: dir.x, y: dir.y, z: dir.z }, dist, this.walker.col, seeThrough);
    if (hit !== null) dist = Math.max(0.8, hit - 0.25);
    const want = look.clone().addScaledVector(dir, dist);
    // keep the camera from sitting exactly on the sea surface, where the picture flickers between the two worlds
    const s = this.world.sea;
    if (s) { const sh = s.height(want.x, want.z); if (Math.abs(want.y - sh) < 0.35) want.y = sh + (this.swimming && this.headUnder ? -0.35 : 0.35); }
    if (this.snapCam) { this.camPos.copy(want); this.camLook.copy(look); this.snapCam = false; }
    const k = 1 - Math.exp(-dt * 10);
    this.camPos.lerp(want, hit !== null ? 1 : k);
    this.camLook.lerp(look, 1 - Math.exp(-dt * 14));
    if (this.camOverride) return;
    camera.position.copy(this.camPos);
    camera.lookAt(this.camLook);
    this.world.followShadow(p);
    void up;
  }
}
