// Rapier physics: the static level, props that tumble, and the kinematic
// character controller that Rory walks with.
import RAPIER from "./vendor/rapier.js";
import * as THREE from "three";

export let R = null;
export async function initPhysics() {
  if (R) return R;
  await RAPIER.init();
  R = RAPIER;
  return R;
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler();

export class Physics {
  constructor(gravity = -20) {
    this.world = new R.World({ x: 0, y: gravity, z: 0 });
    this.gravity = gravity;
    this.links = [];     // dynamic bodies and the meshes that follow them
    this.movers = [];    // kinematic platforms moved by a function of time
    this.t = 0;
  }
  setGravity(g) { this.gravity = g; this.world.gravity = { x: 0, y: g, z: 0 }; }
  // --- static shapes (the level)
  fixedBox(x, y, z, hx, hy, hz, ry = 0, o = {}) {
    const d = R.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(o.friction ?? 0.8);
    if (ry || o.rx || o.rz) { _q.setFromEuler(_e.set(o.rx || 0, ry, o.rz || 0)); d.setRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w }); }
    if (o.restitution) d.setRestitution(o.restitution);
    const c = this.world.createCollider(d);
    if (o.tag) c.userTag = o.tag;
    return c;
  }
  fixedCyl(x, y, z, r, hh, o = {}) {
    const d = R.ColliderDesc.cylinder(hh, r).setTranslation(x, y, z).setFriction(o.friction ?? 0.8);
    return this.world.createCollider(d);
  }
  fixedBall(x, y, z, r) { return this.world.createCollider(R.ColliderDesc.ball(r).setTranslation(x, y, z)); }
  // a triangle mesh collider from a three.js geometry already placed in the world
  fixedMesh(mesh) {
    mesh.updateWorldMatrix(true, false);
    const g = mesh.geometry.index ? mesh.geometry : mesh.geometry;
    const pos = g.attributes.position, v = new THREE.Vector3();
    const verts = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); verts[i * 3] = v.x; verts[i * 3 + 1] = v.y; verts[i * 3 + 2] = v.z; }
    let idx;
    if (g.index) idx = new Uint32Array(g.index.array); else { idx = new Uint32Array(pos.count); for (let i = 0; i < pos.count; i++) idx[i] = i; }
    return this.world.createCollider(R.ColliderDesc.trimesh(verts, idx));
  }
  heightfield(nx, nz, heights, sx, sz, x = 0, y = 0, z = 0) {
    return this.world.createCollider(R.ColliderDesc.heightfield(nx, nz, heights, { x: sx, y: 1, z: sz }).setTranslation(x, y, z));
  }
  // --- things that move
  dynamicBox(mesh, hx, hy, hz, o = {}) {
    const p = mesh.position, q = mesh.quaternion;
    const bd = R.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(o.damping ?? 0.1).setAngularDamping(o.angDamping ?? 0.2).setCanSleep(true);
    if (o.gravityScale !== undefined) bd.setGravityScale(o.gravityScale);
    const body = this.world.createRigidBody(bd);
    const cd = R.ColliderDesc.cuboid(hx, hy, hz).setDensity(o.density ?? 1).setFriction(o.friction ?? 0.7).setRestitution(o.restitution ?? 0.1);
    const col = this.world.createCollider(cd, body);
    this.links.push({ body, mesh });
    return { body, col };
  }
  dynamicBall(mesh, r, o = {}) {
    const p = mesh.position;
    const bd = R.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setLinearDamping(o.damping ?? 0.05).setAngularDamping(0.3);
    if (o.gravityScale !== undefined) bd.setGravityScale(o.gravityScale);
    const body = this.world.createRigidBody(bd);
    const col = this.world.createCollider(R.ColliderDesc.ball(r).setDensity(o.density ?? 1).setRestitution(o.restitution ?? 0.5).setFriction(o.friction ?? 0.6), body);
    this.links.push({ body, mesh });
    return { body, col };
  }
  // a platform that moves along fn(t) -> [x, y, z, ry]
  mover(mesh, hx, hy, hz, fn) {
    const body = this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(mesh.position.x, mesh.position.y, mesh.position.z));
    this.world.createCollider(R.ColliderDesc.cuboid(hx, hy, hz).setFriction(1), body);
    const m = { body, mesh, fn, hx, hy, hz, last: new THREE.Vector3().copy(mesh.position), vel: new THREE.Vector3() };
    this.movers.push(m);
    return m;
  }
  remove(link) {
    const i = this.links.findIndex(l => l.body === link.body);
    if (i >= 0) this.links.splice(i, 1);
    this.world.removeRigidBody(link.body);
  }
  step(dt) {
    dt = Math.min(dt, 1 / 30);
    this.t += dt;
    for (const m of this.movers) {
      const [x, y, z, ry] = m.fn(this.t);
      m.vel.set(x - m.last.x, y - m.last.y, z - m.last.z).divideScalar(Math.max(dt, 1e-4));
      m.last.set(x, y, z);
      m.body.setNextKinematicTranslation({ x, y, z });
      if (ry !== undefined) { _q.setFromEuler(_e.set(0, ry, 0)); m.body.setNextKinematicRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w }); m.mesh.quaternion.copy(_q); }
      m.mesh.position.set(x, y, z);
    }
    this.world.timestep = dt;
    this.world.step();
    for (const l of this.links) {
      const t = l.body.translation(), r = l.body.rotation();
      l.mesh.position.set(t.x, t.y, t.z);
      l.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }
  // like ray(), but also says what was hit
  rayHit(from, dir, max, exclude) {
    const hit = this.world.castRay(new R.Ray(from, dir), max, true, undefined, undefined, exclude);
    return hit ? { toi: hit.timeOfImpact, collider: hit.collider } : null;
  }
  // first hit along a ray, ignoring the given collider; returns distance or null
  ray(from, dir, max, exclude) {
    const hit = this.world.castRay(new R.Ray(from, dir), max, true, undefined, undefined, exclude);
    return hit ? hit.timeOfImpact : null;
  }
}

// Rory's body: a capsule moved by Rapier's character controller, with our own
// gravity so jumps feel snappy and low-gravity zones can float him.
export class Walker {
  constructor(phys, x, y, z, o = {}) {
    this.phys = phys;
    this.radius = o.radius ?? 0.3; this.half = o.half ?? 0.35;
    this.body = phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y + this.half + this.radius, z));
    this.col = phys.world.createCollider(R.ColliderDesc.capsule(this.half, this.radius).setFriction(0), this.body);
    const cc = this.cc = phys.world.createCharacterController(0.02);
    cc.setUp({ x: 0, y: 1, z: 0 });
    cc.setMaxSlopeClimbAngle(50 * Math.PI / 180);
    cc.setMinSlopeSlideAngle(35 * Math.PI / 180);
    cc.enableAutostep(0.42, 0.15, true); // every staircase in the game rises 0.35 or less per step
    cc.enableSnapToGround(0.25);
    cc.setApplyImpulsesToDynamicBodies(true);
    cc.setCharacterMass(3);
    this.vel = new THREE.Vector3();
    this.grounded = false;
    this.pos = new THREE.Vector3(x, y, z);  // feet
  }
  teleport(x, y, z) {
    this.body.setTranslation({ x, y: y + this.half + this.radius, z }, true);
    this.body.setNextKinematicTranslation({ x, y: y + this.half + this.radius, z });
    this.vel.set(0, 0, 0); this.pos.set(x, y, z);
  }
  // move by velocity for dt; returns the corrected displacement
  move(dt, gravityScale = 1) {
    if (!this.grounded || this.vel.y > 0) this.vel.y += this.phys.gravity * 1.25 * gravityScale * dt;
    this.vel.y = Math.max(this.vel.y, -30);
    const want = { x: this.vel.x * dt, y: this.vel.y * dt, z: this.vel.z * dt };
    // ride along with a moving platform under our feet
    if (this.onMover) { want.x += this.onMover.vel.x * dt; want.y += Math.min(0, this.onMover.vel.y * dt); want.z += this.onMover.vel.z * dt; }
    this.cc.computeColliderMovement(this.col, want);
    const m = this.cc.computedMovement();
    const wasGrounded = this.grounded;
    this.grounded = this.cc.computedGrounded();
    if (this.grounded && this.vel.y < 0) this.vel.y = 0;
    // bumped our head
    if (this.vel.y > 0 && m.y < want.y * 0.5) this.vel.y = 0;
    const t = this.body.translation();
    const n = { x: t.x + m.x, y: t.y + m.y, z: t.z + m.z };
    this.body.setNextKinematicTranslation(n);
    this.pos.set(n.x, n.y - this.half - this.radius, n.z);
    this.justLanded = !wasGrounded && this.grounded;
    // which mover (if any) are we standing on
    this.onMover = null;
    if (this.grounded) {
      for (let i = 0; i < this.cc.numComputedCollisions(); i++) {
        const c = this.cc.computedCollision(i);
        if (!c || !c.collider) continue;
        const b = c.collider.parent();
        if (b && b.isKinematic()) { const mv = this.phys.movers.find(q => q.body === b); if (mv) this.onMover = mv; }
      }
    }
    return m;
  }
}
