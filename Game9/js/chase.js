// The chase: a first-person pursuit driven along a closed route through a city
// that already exists. The camera rides the route, the player steers left and
// right, and the gap to the vehicle ahead closes while the driving stays clean.
import * as THREE from "./three.module.min.js";
import { SFX } from "./audio.js";
import { text, rrect, panel, paragraph, drawPortrait, clamp, TAU, MONO } from "./ui.js";
import { MG, L, rnd, rint, pick } from "./mgbase.js";

const HALF = 3.4;           // how far from the centre line the player may stray

// the vehicle ahead, and the one the player is riding in
function vehicle(kind) {
  const g = new THREE.Group();
  const M = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.6 : r, metalness: 0.15 });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  if (kind === "taxi") {
    const body = M(0x101014); box(1.9, 0.9, 4.2, body, 0, 0.75, 0); box(1.7, 0.8, 2.1, body, 0, 1.55, 0.1);
    box(1.55, 0.55, 0.08, M(0x2a3038, 0.2), 0, 1.6, -0.95);
    for (const [x, z] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 12), M(0x111111, 0.9)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w); }
    for (const x of [-0.6, 0.6]) box(0.3, 0.16, 0.08, new THREE.MeshBasicMaterial({ color: 0xff3b30 }), x, 0.85, 2.12);
    box(0.55, 0.2, 0.18, new THREE.MeshBasicMaterial({ color: 0xffd166 }), 0, 2.05, 0.1);
  } else if (kind === "tuktuk") {
    const body = M(0xffd166); box(1.4, 1.0, 2.4, body, 0, 0.8, 0);
    box(1.5, 0.14, 2.0, M(0x2a6fdb), 0, 1.42, 0);
    const w = (x, z, r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.18, 12), M(0x141414, 0.9)); m.rotation.z = Math.PI / 2; m.position.set(x, r, z); g.add(m); };
    w(0, -1.15, 0.34); w(-0.72, 1.05, 0.34); w(0.72, 1.05, 0.34);
    for (const x of [-0.4, 0.4]) box(0.22, 0.14, 0.08, new THREE.MeshBasicMaterial({ color: 0xff3b30 }), x, 0.9, 1.22);
  } else if (kind === "boat") {
    const hull = M(0xf2f4f6); box(1.9, 0.55, 5.0, hull, 0, 0.38, 0);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.6, 4), hull); nose.rotation.x = -Math.PI / 2; nose.rotation.y = Math.PI / 4; nose.position.set(0, 0.38, -3.0); g.add(nose);
    box(1.5, 0.5, 1.6, M(0x1f6f8a), 0, 0.9, -0.3);
    box(1.3, 0.4, 0.08, M(0x2a3038, 0.2), 0, 1.15, -1.05);
    const eng = box(0.8, 0.5, 0.7, M(0x2a2a30, 0.4), 0, 0.8, 2.4);
    for (const x of [-0.5, 0.5]) box(0.26, 0.14, 0.08, new THREE.MeshBasicMaterial({ color: 0xff3b30 }), x, 0.62, 2.52);
  } else {  // a van
    const body = M(0xe8eef2); box(2.1, 1.7, 4.6, body, 0, 1.15, 0);
    box(2.0, 0.5, 0.1, M(0x2a3038, 0.2), 0, 1.55, -2.3);
    for (const [x, z] of [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 12), M(0x111111, 0.9)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.4, z); g.add(w); }
    for (const x of [-0.7, 0.7]) box(0.34, 0.18, 0.08, new THREE.MeshBasicMaterial({ color: 0xff3b30 }), x, 1.0, 2.32);
  }
  return g;
}

// something to swerve around
function hazard(kind) {
  const g = new THREE.Group();
  const M = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.8 : r });
  if (kind === "cone") {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 10), M(0xff6b2b)); c.position.y = 0.45; g.add(c);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), M(0x1a1a1a)); b.position.y = 0.04; g.add(b);
  } else if (kind === "barrel") {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12), M(0xd94f3d)); c.position.y = 0.55; g.add(c);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.1, 12), M(0xf2f2f2)); r.position.y = 0.62; g.add(r);
  } else if (kind === "crate") {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.0), M(0x9a6a3a)); c.position.y = 0.45; g.add(c);
  } else if (kind === "cart") {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.0), M(0x8a5a2a)); c.position.y = 0.75; g.add(c);
    const a = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 1.2), M(0xe63946)); a.position.y = 1.35; a.rotation.x = 0.12; g.add(a);
    for (const x of [-0.6, 0.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 10), M(0x3a2a1a)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.4, 0); g.add(w); }
  } else if (kind === "buoy") {
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 1.2, 10), M(0xff6b2b)); b2.position.y = 0.5; g.add(b2);
    const t2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), M(0x1a1a1a)); t2.position.y = 1.3; g.add(t2);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd166 })); lamp.position.y = 1.6; g.add(lamp);
  } else if (kind === "piling") {
    for (let i = 0; i < 3; i++) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.2, 7), M(0x4a3a2a)); p2.position.set((i - 1) * 0.34, 0.9, (i % 2) * 0.3); p2.rotation.z = (i - 1) * 0.05; g.add(p2); }
  } else {  // a puddle or ice patch: still a hit, just flatter
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.8, 14), new THREE.MeshBasicMaterial({ color: 0x7fdcff, transparent: true, opacity: 0.45 }));
    c.rotation.x = -Math.PI / 2; c.position.y = 0.03; g.add(c);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export class Chase extends MG {
  constructor(G, m) {
    super(G, m);
    this.needsWorld = true;
    this.sub = "STAY ON THEM";
    this.instr = "Drag left and right to steer. Keep the road clear and you will close the gap.";
    this.slipAllow = 2;
    this.quarryKind = this.params.quarry || "van";
    this.rideKind = this.params.ride || "taxi";
    this.hazards = this.params.hazards || ["cone", "barrel", "crate"];
    this.eye = this.params.eye === undefined ? 1.35 : this.params.eye;
    this.gap0 = L(this, 70, 85, 100, 115);
    this.gap = this.gap0;
    this.close = L(this, 2.6, 2.4, 2.2, 2.0);     // metres per second gained while clean
    this.penalty = L(this, 6, 7, 8, 9);           // metres lost on a scrape
    this.nHaz = 9; this.spacing = L(this, 17, 14, 12, 10);   // metres between hazards
    this.v = L(this, 13, 14, 15, 16);
    this.s = 0; this.lat = 0; this.steer = 0; this.drag = null;
    this.hit = 0; this.hits = 0; this.shake = 0; this.wonT = 0;
  }
  start() {
    const w = this.G.world;
    this.saved = { x: w.player.x, z: w.player.z, yaw: w.player.yaw, pitch: w.player.pitch, eye: w.player.eye, roll: w.player.roll };
    this.root = new THREE.Group(); w.scene.add(this.root);
    const pts = (this.params.path || [[-10, 0], [10, 0], [10, 10], [-10, 10]]).map(([x, z]) => new THREE.Vector3(x, 0, z));
    this.curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.4);
    this.len = this.curve.getLength();
    // the vehicle ahead
    this.quarry = vehicle(this.quarryKind); this.root.add(this.quarry);
    // hazards, held as a distance along the route so they can be moved on once passed
    this.haz = [];
    this.frontS = 45;                     // three clear seconds before the first one
    for (let i = 0; i < this.nHaz; i++) { this.haz.push(this.newHazard(this.frontS)); this.frontS += this.spacing; }
    // the road itself, laid along the route, plus something to line it with
    this.buildRoad();
    // chevrons showing the racing line
    this.chev = [];
    const cm = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.5, depthWrite: false });
    for (let i = 0; i < 14; i++) {
      const sh = new THREE.Shape(); sh.moveTo(-0.9, -0.35); sh.lineTo(0, 0.35); sh.lineTo(0.9, -0.35); sh.lineTo(0.9, -0.02); sh.lineTo(0, 0.68); sh.lineTo(-0.9, -0.02);
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(sh), cm);
      mesh.rotation.x = -Math.PI / 2; this.root.add(mesh); this.chev.push(mesh);
    }
    // headlights: a night city is not drivable without them
    this.head = new THREE.PointLight(0xfff0d0, 2.6, 46, 1.5); this.root.add(this.head);
    this.head2 = new THREE.PointLight(0xffe8c0, 1.2, 90, 1.2); this.root.add(this.head2);
    // tail lights on the vehicle ahead, bright enough to follow across a long gap
    this.tail = [];
    for (const dx of [-0.62, 0.62]) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.G.world.dotTex, color: 0xff2b1a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
      sp.position.set(dx, 1.0, 2.3); sp.scale.set(1.5, 1.5, 1); this.quarry.add(sp); this.tail.push(sp);
    }
    // the city's mission markers would only be in the way
    this.hidden = w.interactables.filter(i => i.grp && i.grp.visible);
    for (const i of this.hidden) i.grp.visible = false;
    w.player.eye = this.eye;
    this.place(0);
    SFX.plane();
  }
  // a ribbon of road along the route, kerb posts, and roadside dressing, so the
  // chase always has somewhere to be rather than borrowing the city's pavements
  buildRoad() {
    if (this.params.surface === "water") return this.buildChannel();
    const N = Math.max(64, Math.round(this.len / 2)), W = HALF + 1.1;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = this.curve.getPointAt(u % 1), t = this.curve.getTangentAt(u % 1);
      const rx = -t.z, rz = t.x;
      pos.push(p.x - rx * W, 0.015, p.z - rz * W, p.x + rx * W, 0.015, p.z + rz * W);
      uv.push(0, u * this.len / 6, 1, u * this.len / 6);
      if (i < N) { const a2 = i * 2; idx.push(a2, a2 + 1, a2 + 2, a2 + 1, a2 + 3, a2 + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const road = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: this.params.road || 0x2f3238, roughness: 0.95 }));
    road.receiveShadow = true; this.root.add(road);
    // centre line
    const cl = [];
    for (let i = 0; i <= N; i++) { const u = i / N, p = this.curve.getPointAt(u % 1); cl.push(p.x, 0.03, p.z); }
    const line = new THREE.Line(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(cl, 3)),
      new THREE.LineDashedMaterial({ color: 0xf0e8d0, dashSize: 1.6, gapSize: 2.2, transparent: true, opacity: 0.5 }));
    line.computeLineDistances(); this.root.add(line);
    // kerb posts and roadside dressing
    const postG = new THREE.CylinderGeometry(0.05, 0.07, 0.62, 6);
    const postM = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.8 });
    const capM = new THREE.MeshBasicMaterial({ color: 0xff4d3a });
    const side = this.params.side || "lamp";
    for (let d = 0; d < this.len; d += 8) {
      const a2 = this.at(d);
      for (const off of [-(W + 0.5), W + 0.5]) {
        const post = new THREE.Mesh(postG, postM);
        post.position.set(a2.p.x + a2.r.x * off, 0.31, a2.p.z + a2.r.z * off); this.root.add(post);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.04), capM);
        cap.position.set(post.position.x, 0.58, post.position.z); cap.rotation.y = a2.yaw; this.root.add(cap);
      }
      if (side !== "none" && d % 16 < 8) for (const off of [-(W + 4.5), W + 4.5]) this.root.add(this.roadside(side, a2.p.x + a2.r.x * off, a2.p.z + a2.r.z * off, d));
    }
  }
  // a marked channel down the middle of open water
  buildChannel() {
    const W = HALF + 1.2;
    const buoyM = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.6 });
    const darkM = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    for (let d = 0; d < this.len; d += 9) {
      const a2 = this.at(d);
      for (const off of [-W, W]) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.9, 8), off < 0 ? buoyM : darkM);
        b.position.set(a2.p.x + a2.r.x * off, 0.35, a2.p.z + a2.r.z * off); this.root.add(b);
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), new THREE.MeshBasicMaterial({ color: off < 0 ? 0x7bed9f : 0xff4d3a }));
        l.position.set(b.position.x, 0.86, b.position.z); this.root.add(l);
      }
    }
    // a faint wake line to follow
    const cl = [];
    for (let i = 0; i <= 200; i++) { const p = this.curve.getPointAt(i / 200 % 1); cl.push(p.x, 0.06, p.z); }
    const line = new THREE.Line(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(cl, 3)),
      new THREE.LineDashedMaterial({ color: 0xbfe8ff, dashSize: 1.2, gapSize: 3.0, transparent: true, opacity: 0.35 }));
    line.computeLineDistances(); this.root.add(line);
  }
  roadside(kind, x, z, seed) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = seed * 0.7;
    const M = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.9 : r });
    if (kind === "palm") {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 5, 7), M(0x7a5a3a)); tr.position.y = 2.5; g.add(tr);
      for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.09, 0.7), M(0x3f7a2f)); const a2 = i * TAU / 6; f.position.set(Math.cos(a2) * 1.4, 4.9, Math.sin(a2) * 1.4); f.rotation.y = -a2; f.rotation.z = 0.34; g.add(f); }
    } else if (kind === "acacia") {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.4, 7), M(0x5a4632)); tr.position.y = 1.7; g.add(tr);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.0, 0.7, 10), M(0x3f5a2a)); c.position.y = 3.7; g.add(c);
    } else if (kind === "cactus") {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 3.2, 9), M(0x3f6a3a)); b.position.y = 1.6; g.add(b);
      for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.4, 8), M(0x3f6a3a)); arm.position.set(sx * 0.55, 2.1, 0); arm.rotation.z = sx * 0.9; g.add(arm); }
    } else {  // a street lamp
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.4, 6), M(0x2a2a30, 0.5)); p2.position.y = 2.2; g.add(p2);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), M(0x2a2a30, 0.5)); arm.position.set(0.45, 4.3, 0); g.add(arm);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); lamp.position.set(0.85, 4.2, 0); g.add(lamp);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  stop() {
    const w = this.G.world;
    if (this.root) { w.scene.remove(this.root); this.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); this.root = null; }
    for (const i of this.hidden || []) if (i.grp) i.grp.visible = true;
    if (this.saved) { Object.assign(w.player, this.saved); w.player.eye = this.saved.eye; w.player.roll = 0; w.updateCamera(); }
  }
  newHazard(s) {
    const kind = pick(this.hazards);
    const g = hazard(kind); this.root.add(g);
    return { s, lat: rnd(-HALF + 0.7, HALF - 0.7), g, kind };
  }
  at(s) {
    const u = ((s % this.len) + this.len) % this.len / this.len;
    const p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u);
    const r = new THREE.Vector3(-t.z, 0, t.x).normalize();
    return { p, t, r, yaw: Math.atan2(-t.x, -t.z) };
  }
  place(dt) {
    const w = this.G.world, me = this.at(this.s);
    w.player.x = me.p.x + me.r.x * this.lat;
    w.player.z = me.p.z + me.r.z * this.lat;
    w.player.yaw = me.yaw - this.steer * 0.16;
    w.player.pitch = -0.03 + (this.shake > 0 ? Math.sin(this.t * 40) * 0.02 : 0);
    w.player.roll = -this.steer * 0.05 + (this.shake > 0 ? Math.sin(this.t * 33) * 0.02 : 0);
    w.player.eye = this.eye;
    // the vehicle ahead, weaving a little
    const q = this.at(this.s + this.gap), qlat = Math.sin(this.s * 0.06) * 1.5;
    this.quarry.position.set(q.p.x + q.r.x * qlat, 0, q.p.z + q.r.z * qlat);
    this.quarry.rotation.y = q.yaw;
    // keep the tail lights readable however far ahead they are
    const far = clamp(this.gap / 70, 0, 1), pulse = 0.75 + Math.sin(this.t * 6) * 0.25;
    for (const sp of this.tail || []) { const k = 1.3 + far * 2.6; sp.scale.set(k, k, 1); sp.material.opacity = (0.55 + far * 0.4) * pulse; }
    if (this.head) {
      const fw = this.at(this.s + 7);
      this.head.position.set(w.player.x, 1.1, w.player.z);
      this.head2.position.set(fw.p.x, 1.4, fw.p.z);
    }
    for (const h of this.haz) {
      const a = this.at(h.s);
      h.g.position.set(a.p.x + a.r.x * h.lat, 0, a.p.z + a.r.z * h.lat);
      h.g.rotation.y = a.yaw;
      h.g.visible = h.s > this.s - 6 && h.s < this.s + 110;
    }
    this.chev.forEach((c, i) => {
      const cs = this.s + 12 + i * 7, a = this.at(cs);
      c.position.set(a.p.x, 0.06, a.p.z); c.rotation.z = -a.yaw;
      c.material.opacity = 0.5;
    });
    w.updateCamera();
  }
  tick(dt) {
    if (this.done) { this.wonT += dt; this.s += this.v * dt * 0.5; this.place(dt); return; }
    this.shake = Math.max(0, this.shake - dt);
    this.hit = Math.max(0, this.hit - dt);
    const k = this.G.input.keys;
    let st = this.steer;
    if (this.drag) st = this.drag.s;
    else if (k.KeyA || k.ArrowLeft) st = -1; else if (k.KeyD || k.ArrowRight) st = 1; else st = 0;
    this.steer += (st - this.steer) * Math.min(1, dt * 9);
    this.lat = clamp(this.lat + this.steer * 7.5 * dt, -HALF, HALF);
    const speed = this.hit > 0 ? this.v * 0.45 : this.v;
    this.s += speed * dt;
    // close the gap only while driving cleanly
    if (this.hit <= 0) this.gap = Math.max(0, this.gap - this.close * dt);
    // scrapes
    for (const h of this.haz) {
      if (h.hitT) continue;
      if (Math.abs(h.s - this.s) < 1.7 && Math.abs(h.lat - this.lat) < 1.25) {
        h.hitT = 1; this.hit = 0.9; this.shake = 0.5; this.hits++; this.miss();
        this.gap = Math.min(this.gap0, this.gap + this.penalty);
        SFX.clunk();
        this.say(pick(["Scrape! They are pulling away.", "Ouch. Mind the road!", "That cost us a few metres."]), false, 1.2);
      }
      if (h.s < this.s - 10) { this.frontS += rnd(this.spacing * 0.75, this.spacing * 1.25); h.s = this.frontS; h.lat = rnd(-HALF + 0.7, HALF - 0.7); h.hitT = 0; }
    }
    if (this.gap <= 0.01) { this.say("Got them! Pull over.", true, 2.2); this.win(); }
    this.place(dt);
  }
  down(x, y, id) { if (this.done) return; this.drag = { id, x0: x, s: 0 }; }
  move(x, y, id) { if (this.drag && this.drag.id === id) this.drag.s = clamp((x - this.drag.x0) / (110 * this.G.s), -1, 1); }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  hint() { return "Look as far up the road as you can, not at the bonnet. Pick your side early and hold it; the gap only closes while you are clean."; }
  solve() { this.gap = 0; this.say("Got them! Pull over.", true, 2.2); this.win(); }
  draw(g, W, H, s) {
    const closed = 1 - this.gap / this.gap0;
    // speed streaks at the edges
    g.save();
    for (let i = 0; i < 10; i++) {
      const u = (this.t * 1.7 + i * 0.1) % 1, a = Math.sin(u * Math.PI) * 0.22;
      g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 2 * s;
      const y = H * (0.22 + (i % 5) * 0.13);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W * 0.1 * u, y + 20 * s); g.stroke();
      g.beginPath(); g.moveTo(W, y); g.lineTo(W - W * 0.1 * u, y + 20 * s); g.stroke();
    }
    g.restore();
    if (this.shake > 0) { g.fillStyle = `rgba(230,57,70,${this.shake * 0.3})`; g.fillRect(0, 0, W, H); }
    // the gap
    const pw = Math.min(W - 48 * s, 460 * s), px = W / 2 - pw / 2, py = 70 * s;
    panel(g, px, py, pw, 76 * s, s, { bg: "rgba(6,10,16,.72)" });
    text(g, (this.params.quarryLabel || "THE VEHICLE AHEAD").toUpperCase(), px + 16 * s, py + 22 * s, 13 * s, "#7fd", "left", 800, MONO);
    text(g, `${Math.ceil(this.gap)} m`, px + pw - 16 * s, py + 24 * s, 22 * s, this.gap < 20 ? "#2ecc71" : "#ffd166", "right", 900, MONO);
    const bx = px + 16 * s, bw = pw - 32 * s, by = py + 42 * s;
    g.fillStyle = "rgba(255,255,255,.12)"; rrect(g, bx, by, bw, 16 * s, 8 * s); g.fill();
    g.fillStyle = this.gap < 20 ? "#2ecc71" : "#ffd166"; rrect(g, bx, by, Math.max(10 * s, bw * clamp(closed, 0, 1)), 16 * s, 8 * s); g.fill();
    text(g, this.hits ? `${this.hits} scrape${this.hits === 1 ? "" : "s"}` : "clean", px + pw / 2, py + 68 * s, 12 * s, this.hits ? "#ff8a8a" : "#2ecc71", "center", 700, MONO);
    // steering
    const cy = H - 92 * s, cw2 = 150 * s;
    g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 3 * s;
    g.beginPath(); g.moveTo(W / 2 - cw2, cy); g.lineTo(W / 2 + cw2, cy); g.stroke();
    g.fillStyle = "rgba(255,209,102,.9)"; g.beginPath(); g.arc(W / 2 + this.steer * cw2, cy, 15 * s, 0, TAU); g.fill();
    text(g, "STEER", W / 2, cy + 34 * s, 12 * s, "rgba(255,255,255,.45)", "center", 800, MONO);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS3 = { chase: Chase };
