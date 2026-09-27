// Deep Red's missions in and on the sea. Each has an autopilot (solve) that
// plays it the way a child would: it swims and drives through open water along a
// planned route (nav3.js), comes up for air, and waits for its passengers.
import * as THREE from "three";
import { Mission } from "./mission.js";
import { Cells, Roundup } from "./missions.js";
import { Nav3 } from "./nav3.js";
import { Robot } from "./robots.js";
import { Craft } from "./craft.js";
import { SEA } from "./sea.js";
import { makeCell, spinCell, makeBubble } from "./props.js";
import { critter, animateCritter } from "./critters.js";
import { toast } from "./ui.js";

const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);
const ringMesh = (r, color = 0xffd166) => new THREE.Mesh(new THREE.TorusGeometry(r, 0.14, 12, 48), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.3 }));
// the box a route has to stay in: round every point given, down to the sea floor, and high enough
// to go up and over a ridge between them (a canyon's rim)
function boxAround(pts, pad = 10, floor = -40, top = 0) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), zs = pts.map(p => p[2]);
  return [Math.min(...xs) - pad, Math.max(floor, Math.min(...ys) - pad), Math.min(...zs) - pad, Math.max(...xs) + pad, Math.min(top, Math.max(...ys) + 12), Math.max(...zs) + pad];
}

// ------------------------------------------------------------ helpers the underwater autopilots share
export const swimMixin = {
  // Rory swims to (x, y, z): along a planned route through open water, up for air when he needs it
  swimTo(x, y, z) {
    const g = this.g, p = this.p, inp = g.input, c = [p.pos.x, p.pos.y + 0.7, p.pos.z], sea = this.w.sea;
    // still on dry land (a pontoon, a ledge, the beach): walk the way the walking map says, off the
    // edge and into the water, and swim from there
    if (!p.swimming && !p.headUnder) {
      const pts = (this.navPts || []).map(q => Array.isArray(q) ? v3(q) : q), pp = p.pos;
      // (whether it can be walked to is asked again only every few seconds: a way that isn't there
      // costs a search of the whole map to find out)
      const key = `${x.toFixed(0)},${y.toFixed(0)},${z.toFixed(0)}`;
      if (!sea || this.dryKey !== key || this.t > this.dryAt) { this.ensureNav([{ x, z }, ...pts]); this.dryKey = key; this.dryAt = this.t + 4; this.dryWalk = !sea || !!this.nav.route(pp.x, pp.y, pp.z, x, y, z, 1.0); }
      if (this.dryWalk) return this.walkTo(x, y, z, 1.0, pts);
      // no way there on foot (it's out over deep water): into the water at the nearest spot
      // that's deep enough to swim, and swim from there
      const nav = this.nav, dh = Math.hypot(x - pp.x, z - pp.z);
      if (!this.entry || this.entry.from !== nav) {
        const can = nav.reachable(pp.x, pp.y, pp.z); let best = null, bd = 1e9;
        if (can) for (let k = 0; k < nav.h.length; k++) if (can[k] && nav.h[k] < this.waterLine(nav.xz(k)[0], nav.h[k] + 1, nav.xz(k)[1]) - 1.2) { const [nx, nz] = nav.xz(k), d = Math.hypot(nx - pp.x, nz - pp.z) + Math.hypot(nx - x, nz - z) * 0.25; if (d < bd) { bd = d; best = { x: nx, y: nav.h[k], z: nz }; } }
        // (none: the water is too deep to walk down into, off a dock or a ledge over the deep. The
        // edge of the dry ground, with deep water just beyond it, and step off)
        if (!best && can) for (let k = 0; k < nav.h.length; k++) {
          if (!can[k]) continue;
          const [nx, nz] = nav.xz(k);
          for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const fx = nx + ox * nav.S, fz = nz + oz * nav.S, wl = this.waterLine(fx, nav.h[k], fz);
            if (nav.h[k] < wl - 0.5 || nav.top(fx, fz, nav.h[k] + 0.2) > wl - 1.2) continue;
            // (not over a railing: the boat's sides are railed, its stern is open)
            if (this.w.phys.ray({ x: nx, y: nav.h[k] + 0.5, z: nz }, { x: ox, y: 0, z: oz }, nav.S + 0.8) !== null) continue;
            const d = Math.hypot(nx - pp.x, nz - pp.z) + Math.hypot(fx - x, fz - z) * 0.25;
            if (d < bd) { bd = d; best = { x: nx, y: nav.h[k], z: nz, off: [fx + ox, fz + oz] }; }
          }
        }
        this.entry = { from: nav, at: best };
      }
      const e = this.entry.at;
      if (!e) { this.steer(x, z); return dh; }
      if (e.off && Math.hypot(e.x - pp.x, e.z - pp.z) < 0.8) { this.steer(e.off[0], e.off[1]); return dh; }
      this.walkTo(e.x, e.y + 0.3, e.z, e.off ? 0.5 : 1.0, pts); return dh;
    }
    // (in the deep the surface is out of reach: the top of the water is where swimming stops)
    const deep = this.w.swimTop !== undefined, lvl = deep ? this.w.swimTop - 0.4 : sea ? sea.level : 0;
    if (!this.nav3) {
      const pts = [c, [x, y, z], ...(this.navPts || [])];
      this.nav3 = new Nav3(this.w, boxAround(pts, 8, (this.data.floor ?? -40), lvl - 0.6), 0.45, 1, lvl - 0.6, this.navBlock);
    }
    // air: come up (or to a bubble stream) with time to spare
    if (!deep) {
      const depth = lvl - c[1];
      if (p.headUnder && p.air < depth / 3 + 7) {
        let best = [c[0], lvl - 0.8, c[2]], bd = depth;
        for (const v of this.w.airVents || []) { const d = Math.hypot(v.x - c[0], v.y + 1 - c[1], v.z - c[2]); if (d < bd) { bd = d; best = [v.x, Math.min(v.y + 1.5, lvl - 1), v.z]; } }
        this.gasping = true;
        return this.follow3(best, 0.7);
      }
      if (this.gasping && p.air < p.airMax * 0.9) { this.follow3([c[0], lvl - 0.8, c[2]], 0.7); return 1; }
      this.gasping = false;
    } else {
      // in the deep: to the nearest air station, bubble stream or air pocket, along a route, and
      // wait there until the tank is nearly full
      const a = this.airNear(c);
      if (a && p.headUnder && !this.gasping && p.air < a.d / 2.4 + 10) this.gasping = a.pt;
      if (this.gasping) {
        const g = this.gasping;
        if (p.air >= p.airMax * 0.92) this.gasping = false;
        else if (Math.hypot(g[0] - c[0], g[1] - c[1], g[2] - c[2]) < 1.2 || !p.headUnder) { this.follow3(g, 0.7); return 1; }
        else { x = g[0]; y = g[1]; z = g[2]; }
      }
    }
    if (!this.swimGoal || Math.hypot(this.swimGoal[0] - x, this.swimGoal[1] - y, this.swimGoal[2] - z) > 0.5 || this.t > this.swimAt) {
      this.swimGoal = [x, y, z]; this.swimAt = this.t + 4;
      this.swimPath = this.nav3.route(c, [x, y, z]); this.swimI = 1;
    }
    return this.follow3(this.swimPath ? null : [x, y, z], 0.9);
  },
  // the nearest place to breathe in the deep, as the crow swims: { pt, d }
  airNear(c) {
    let best = null;
    const put = (pt) => { const d = Math.hypot(pt[0] - c[0], pt[1] - c[1], pt[2] - c[2]); if (!best || d < best.d) best = { pt, d }; };
    for (const v of this.w.airVents || []) put([v.x, v.y + Math.min(1.5, v.h / 2), v.z]);
    for (const r of this.w.dry || []) if (r.below >= 2) put(r.air ? [r.air[0], r.wl - 0.7, r.air[1]] : [(r.x0 + r.x1) / 2, r.wl - 0.7, (r.z0 + r.z1) / 2]);
    return best;
  },
  // steer along this.swimPath (or straight at pt): the stick across, JUMP up, DIVE down
  follow3(pt, reach) {
    const p = this.p, inp = this.g.input, c = [p.pos.x, p.pos.y + 0.7, p.pos.z];
    let tgt = pt;
    if (!tgt) {
      const path = this.swimPath;
      while (this.swimI < path.length - 1 && Math.hypot(path[this.swimI][0] - c[0], path[this.swimI][1] - c[1], path[this.swimI][2] - c[2]) < reach) this.swimI++;
      tgt = path[Math.min(this.swimI, path.length - 1)];
    }
    const dx = tgt[0] - c[0], dy = tgt[1] - c[1], dz = tgt[2] - c[2], dh = Math.hypot(dx, dz);
    this.steer(tgt[0], tgt[2]);
    if (dh < 0.4) inp.forced = { mx: 0, my: 0 };
    else if (Math.abs(dy) > dh * 1.5) inp.forced = { mx: 0, my: 0.35 };
    inp.jumpHeld = dy > 0.35 && p.swimming; inp.forced.dive = dy < -0.35;
    // on land: walk to the water, jumping any step
    if (!p.swimming && dh > 0.5) inp.forced.dive = false;
    return Math.hypot(dx, dy, dz);
  },
  // TORPEDO (or any craft) to (x, y, z) along a route through open water
  driveTo(x, y, z, slow = false) {
    const cr = this.craft, inp = this.g.input, c = cr.pos.toArray(), sea = this.w.sea, lvl = this.w.swimTop !== undefined ? this.w.swimTop - 0.2 : sea ? sea.level : 0;
    if (!this.nav3) this.nav3 = new Nav3(this.w, boxAround([c, [x, y, z], ...(this.navPts || [])], 10, this.data.floor ?? -60, lvl - 0.8), cr.L.r + 0.15, 1.5, lvl - 0.8);
    if (!this.driveGoal || Math.hypot(this.driveGoal[0] - x, this.driveGoal[1] - y, this.driveGoal[2] - z) > 0.5 || this.t > this.driveAt) {
      this.driveGoal = [x, y, z]; this.driveAt = this.t + 3;
      this.drivePath = this.nav3.route(c, [x, y, z]); this.driveI = 1;
    }
    let tgt = [x, y, z];
    const path = this.drivePath;
    if (path) { while (this.driveI < path.length - 1 && Math.hypot(path[this.driveI][0] - c[0], path[this.driveI][1] - c[1], path[this.driveI][2] - c[2]) < 2) this.driveI++; tgt = path[Math.min(this.driveI, path.length - 1)]; }
    const dx = tgt[0] - c[0], dy = tgt[1] - c[1], dz = tgt[2] - c[2], dh = Math.hypot(dx, dz), d = Math.hypot(dx, dy, dz);
    cr.camYaw = Math.atan2(-dx, -dz);
    // turn on the spot before going (a sub can't go sideways), and ease in to the end
    let face = Math.atan2(dx, dz) - cr.yaw; face = Math.abs(Math.atan2(Math.sin(face), Math.cos(face)));
    const my = dh < 0.6 ? 0 : face > 1.2 ? 0.25 : Math.min(1, (slow ? 0.5 : 1) * Math.max(0.35, dh / 5));
    inp.forced = { mx: 0, my, dive: dy < -0.4 };
    inp.jumpHeld = dy > 0.4;
    return d;
  },
};

// ------------------------------------------------------------ Dive: Tide Pearls under the water
export class Dive extends Cells {
  start() { super.start(); this.navPts = this.cells.map(c => c.position.toArray()); }
  hud() { return { ...super.hud(), text: `Dive for the Tide Pearls  ${this.got}/${this.need}` }; }
  debugState() { const f = v => +v.toFixed(1), sp = this.swimPath; return { p: this.p.pos.toArray().map(f), sw: this.p.swimming, air: f(this.p.air), gasp: !!this.gasping, aim: this.aim ? this.cells.indexOf(this.aim) : null, swim: sp ? [sp.length, this.swimI, (sp[this.swimI] || []).map(f)] : null, walk: this.navPath ? [this.navPath.length, this.navI] : null, next: this.navPath ? this.navPath.slice(this.navI, this.navI + 4).map(q => [q.how, f(q.x), f(q.h), f(q.z)]) : null, inp: this.g.input.forced }; }
  solve() {
    const c = this.aim && this.aim.visible ? this.aim : this.cells.filter(c => c.visible).sort((a, b) => a.position.distanceTo(this.p.pos) - b.position.distanceTo(this.p.pos))[0];
    if (!c) return;
    if (c !== this.aim) { this.aim = c; this.aimT = this.t; }
    // (coming up for air doesn't count against getting there)
    if (this.gasping) this.aimT += 1 / 60;
    if (this.t - this.aimT > 45) {
      (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} pearl ${this.cells.indexOf(c)} at ${c.position.toArray().map(v => v.toFixed(1)).join(",")}`);
      this.p.teleport(c.position.x, c.position.y - 0.7, c.position.z); this.aimT = this.t; return;
    }
    const sea = this.w.sea;
    // a pearl above the water (on a rock, a jetty): walk to it the usual way, swimming the wet
    // parts of the route and climbing out where it comes ashore
    if (!sea || c.position.y > this.waterLine(c.position.x, c.position.y, c.position.z) + 0.3) { this.walkTo(c.position.x, c.position.y, c.position.z, 0.8, this.navPts.map(v3)); if (this.navPath || !this.p.swimming) return; }
    this.swimTo(c.position.x, c.position.y, c.position.z);
  }
}
Object.assign(Dive.prototype, swimMixin);

// things TORPEDO's claw lifts in Act Two: a tangled net with floats, a ship's safe, a crate, a block
// of ice (with something inside it)
const SALVAGE = {
  net: () => { const g = new THREE.Group(); const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshStandardMaterial({ color: 0x3a5a4a, wireframe: true })); g.add(n); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: 0x2a3a30, roughness: 0.9, transparent: true, opacity: 0.6 })); g.add(b); for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf07a1a })); const a = k * 1.7; f.position.set(Math.cos(a) * 0.6, 0.3 + (k % 2) * 0.2, Math.sin(a) * 0.6); g.add(f); } return g; },
  safe: () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a3a2a, metalness: 0.7, roughness: 0.4 })); b.castShadow = true; g.add(b); const d = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xd8b04a, metalness: 0.9, roughness: 0.3 })); d.rotation.x = Math.PI / 2; d.position.z = 0.47; g.add(d); return g; },
  crate: () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), new THREE.MeshStandardMaterial({ color: 0x5a1a2a, roughness: 0.5, emissive: 0x2a0a10, emissiveIntensity: 0.4 })); b.castShadow = true; g.add(b); const s = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0x2ad0c0, emissive: 0x2ad0c0, emissiveIntensity: 0.8 })); g.add(s); return g; },
  ice: () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.3), new THREE.MeshStandardMaterial({ color: 0xcff4ff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.7 })); g.add(b); return g; },
};

// ------------------------------------------------------------ piloting missions: in TORPEDO or on a jet-ski
class Piloted extends Mission {
  board(kind, at) {
    const [x, y, z, yaw = 0] = at;
    this.craft = this.g.pilot(kind, x, y, z, yaw);
    if (this.w.dark) this.craft.lightsOn(true);
  }
  cleanup() {
    const e = this.data.exit;
    if (this.g.craft === this.craft) { if (e) this.g.unpilot(e[0], e[1], e[2]); else this.g.unpilot(); }
    this.g.input.boostTouch = false; this.g.input.jumpHeld = false;
    super.cleanup();
  }
  post() { if (this.craft && this.craft.rig === null && this.g.craft === this.craft) { /* already aboard */ } }
  debugState() { const f = v => +v.toFixed(1), c = this.craft, t = this.target && this.target(); return c ? { p: c.pos.toArray().map(f), yaw: f(c.yaw || 0), v: f(c.vel.length()), to: t ? [f(t.x), f(t.y), f(t.z)] : null, route: this.drivePath ? [this.drivePath.length, this.driveI] : this.drivePath === null ? "none" : undefined } : {}; }
}
Object.assign(Piloted.prototype, swimMixin);

// ------------------------------------------------------------ SubRings: drive TORPEDO through the rings in order
export class SubRings extends Piloted {
  start() {
    const d = this.data;
    this.board("sub", d.sub);
    this.rings = (d.rings || []).map(r => { const m = this.add(ringMesh(r[3] || 2.2)); m.position.set(r[0], r[1], r[2]); m.rotation.y = r[4] || 0; return { m, r: r[3] || 2.2, passed: false }; });
    this.next = 0; this.paint();
    this.navPts = d.rings.map(r => r.slice(0, 3));
  }
  paint() { this.rings.forEach((r, i) => { const on = i === this.next; r.m.material.emissive.setHex(r.passed ? 0x2a8a3a : on ? 0xffb020 : 0x5a4a20); r.m.material.emissiveIntensity = on ? 2.4 : 0.5; r.m.visible = !r.passed; }); }
  update(dt) {
    const r = this.rings[this.next]; if (!r) return;
    r.m.rotation.z += dt * 0.6;
    if (this.craft.pos.distanceTo(r.m.position) < r.r * 0.95) {
      r.passed = true; this.next++; this.paint(); this.g.sound("cell"); this.g.fx.ring(r.m.position.x, r.m.position.y, r.m.position.z, 0xffd166, 2.5);
      if (this.next >= this.rings.length) this.win();
    }
  }
  hud() { return { ...super.hud(), text: `Drive through the rings  ${this.next}/${this.rings.length}`, progress: this.next / this.rings.length }; }
  target() { const r = this.rings[this.next]; return r ? r.m.position : null; }
  solve() {
    const r = this.rings[this.next]; if (!r) return;
    if (r !== this.aim) { this.aim = r; this.aimT = this.t; }
    if (this.t - this.aimT > 40) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} ring ${this.next}`); this.craft.teleport(r.m.position.x, r.m.position.y, r.m.position.z); this.aimT = this.t; return; }
    this.driveTo(r.m.position.x, r.m.position.y, r.m.position.z);
  }
}

// ------------------------------------------------------------ BoatChase: catch the Drips' boat on a jet-ski and bump it
export class BoatChase extends Piloted {
  start() {
    const d = this.data, sea = this.w.sea, lvl = sea ? sea.level : 0;
    this.curve = new THREE.CatmullRomCurve3(d.path.map(([x, z]) => new THREE.Vector3(x, lvl, z)), true, "centripetal");
    this.len = this.curve.getLength();
    const p0 = this.curve.getPointAt(0), t0 = this.curve.getTangentAt(0);
    this.board(d.ride || "jetski", [p0.x, lvl, p0.z, Math.atan2(t0.x, t0.z)]);
    this.need = this.def.n || 3;
    this.s = d.lead ?? 30; this.qv = 0; this.boostT = 0; this.cool = 0; this.tags = 0; this.cs = 0;
    // the quarry: a Drip at the wheel of a boat, run along the route
    const q = this.quarry = new Craft(this.w, p0.x, lvl, p0.z, 0, d.quarry || "boat");
    this.craft.ignore.add(q.col.handle);
    this.bot = new Robot("drip", 0.9); this.bot.play("Sitting"); q.bodyG.add(this.bot.root); this.bot.root.position.copy(q.seat);
    this.place(0);
  }
  place(dt) {
    const u = ((this.s % this.len) + this.len) % this.len / this.len, p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u), q = this.quarry;
    q.pos.set(p.x, q.pos.y, p.z); q.yaw = Math.atan2(t.x, t.z); q.speed = this.qv;
    q.vel.set(t.x * this.qv, 0, t.z * this.qv);
    const sea = this.w.sea; if (sea) q.pos.y = sea.height(p.x, p.z) + 0.05;
    q.body.setNextKinematicTranslation({ x: q.pos.x, y: q.pos.y, z: q.pos.z });
    q.pose(dt, sea);
  }
  craftS() {
    const cp = this.craft.pos; let best = this.cs, bd = 1e9;
    for (let k = -30; k <= 30; k++) { const s = this.cs + k * 1.5, u = ((s % this.len) + this.len) % this.len / this.len, d = this.curve.getPointAt(u).distanceToSquared(new THREE.Vector3(cp.x, this.curve.getPointAt(u).y, cp.z)); if (d < bd) { bd = d; best = s; } }
    return (this.cs = best);
  }
  update(dt) {
    const cs = this.craftS();
    if (this.lastCs !== undefined && dt > 0) this.csv = (this.csv ?? 0) + (Math.max(0, (cs - this.lastCs) / dt) - (this.csv ?? 0)) * Math.min(1, dt * 1.5);
    this.lastCs = cs;
    // the boat always stays catchable: a little slower along the route than Rory is going
    const gap = this.s - cs, base = 9 + this.lv * 1.5, rv = this.csv ?? 0, r = gap > 40 ? 0.6 : gap > 14 ? 0.8 : 0.86;
    let v = Math.min(base, Math.max(3, rv * r));
    if (this.boostT > 0) { this.boostT -= dt; v += 6; }
    this.qv += (v - this.qv) * Math.min(1, dt * 2);
    this.s += this.qv * dt;
    this.place(dt); this.bot.update(dt);
    // stuck on a rock with the stick pushed: back on course
    this.stuckT = this.craft.speed < 1 && Math.hypot(this.g.input.mx, this.g.input.my) > 0.5 ? (this.stuckT || 0) + dt : 0;
    if (this.stuckT > 2) { this.stuckT = 0; const u = ((((cs + 4) % this.len) + this.len) % this.len) / this.len, p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u); this.craft.teleport(p.x, p.y, p.z, Math.atan2(t.x, t.z)); toast("Back on course!", 1.5); this.resets = (this.resets || 0) + 1; }
    this.cool -= dt;
    if (this.craft.pos.distanceTo(this.quarry.pos) < 3.6 && this.cool <= 0) {
      this.tags++; this.cool = 2.2; this.boostT = 1.6;
      this.g.fx.burst(this.quarry.pos.x, this.quarry.pos.y + 1, this.quarry.pos.z, 0xffd166, 36, { speed: 6 });
      this.g.sound("hit"); this.bot.play("No");
      if (this.tags >= this.need) { this.qv = 0; const b = this.add(makeBubble(2)); b.position.copy(this.quarry.pos).setY(this.quarry.pos.y + 1); this.g.sound("pop"); this.win(); }
    }
  }
  cleanup() { this.quarry.dispose(); super.cleanup(); }
  hud() { return { ...super.hud(), text: `Catch the boat and bump it  ${this.tags}/${this.need}`, progress: this.tags / this.need }; }
  target() { return this.quarry.pos; }
  debugState() { const f = x => Math.round(x * 10) / 10; return { gap: f(this.s - this.cs), qv: f(this.qv), rv: f(this.csv || 0), tags: this.tags, resets: this.resets || 0 }; }
  solve() {
    const cr = this.craft, cs = this.craftS(), gap = this.s - cs, inp = this.g.input;
    let tgt;
    if (gap < 12) tgt = this.quarry.pos.clone();
    else { const u = (((cs + 10) % this.len) + this.len) % this.len / this.len; tgt = this.curve.getPointAt(u); }
    const dx = tgt.x - cr.pos.x, dz = tgt.z - cr.pos.z;
    cr.camYaw = Math.atan2(-dx, -dz);
    inp.forced = { mx: 0, my: 1 };
    inp.boostTouch = gap > 16;
  }
}

// ------------------------------------------------------------ SubChase: follow Undertow's sub down through the rings it leaves
export class SubChase extends Piloted {
  start() {
    const d = this.data;
    this.curve = new THREE.CatmullRomCurve3(d.path.map(v3), false, "centripetal");
    this.len = this.curve.getLength();
    const p0 = this.curve.getPointAt(0), t0 = this.curve.getTangentAt(0);
    this.board("sub", [p0.x - t0.x * 8, p0.y, p0.z - t0.z * 8, Math.atan2(t0.x, t0.z)]);
    this.need = this.def.n || 6;
    // rings along the way, evenly spaced after the start
    this.rings = [];
    for (let i = 0; i < this.need; i++) { const u = (i + 1) / (this.need + 0.6), p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u), m = this.add(ringMesh(2.6, 0x7fe3ff)); m.position.copy(p); m.lookAt(p.clone().add(t)); this.rings.push({ m, u, passed: false }); }
    this.next = 0; this.s = 0; this.v = 0;
    const q = this.q = new THREE.Group(); this.add(q);
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.4, 10, 20), new THREE.MeshStandardMaterial({ color: 0x3a1a5a, roughness: 0.4, metalness: 0.5, emissive: 0x2a0a4a, emissiveIntensity: 0.4 })); hull.rotation.x = Math.PI / 2; q.add(hull);
    for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 2.4, 8), hull.material); const a = i / 6 * Math.PI * 2; t.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, -2.6); t.rotation.x = Math.PI / 2; q.add(t); }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3a6a).multiplyScalar(3) })); eye.position.set(0, 0.4, 1.6); q.add(eye);
    this.navPts = d.path;
  }
  update(dt) {
    // she keeps ahead, but never so far that Rory loses her
    const cu = this.nearestU(), lead = (this.s - cu * this.len);
    const want = lead > 26 ? 2 : lead > 14 ? 6 : 9;
    this.v += (want - this.v) * Math.min(1, dt * 1.5);
    this.s = Math.min(this.len, this.s + this.v * dt);
    const u = this.s / this.len, p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u);
    this.q.position.copy(p); this.q.lookAt(p.clone().add(t));
    if (Math.random() < dt * 20) this.g.fx.bubble(p.x - t.x * 3, p.y, p.z - t.z * 3, this.w.sea ? this.w.sea.level : Infinity, 1);
    const r = this.rings[this.next]; if (!r) return;
    r.m.rotation.z += dt;
    if (this.craft.pos.distanceTo(r.m.position) < 2.6) { r.passed = true; r.m.visible = false; this.next++; this.g.sound("cell"); this.g.fx.ring(r.m.position.x, r.m.position.y, r.m.position.z, 0x7fe3ff, 3); if (this.next >= this.rings.length) this.win(); }
  }
  nearestU() { let best = 0, bd = 1e9; for (let i = 0; i <= 100; i++) { const d = this.curve.getPointAt(i / 100).distanceToSquared(this.craft.pos); if (d < bd) { bd = d; best = i / 100; } } return best; }
  hud() { return { ...super.hud(), text: `Follow her down through the rings  ${this.next}/${this.need}`, progress: this.next / this.need }; }
  target() { const r = this.rings[this.next]; return r ? r.m.position : this.q.position; }
  solve() { const r = this.rings[this.next]; if (r) this.driveTo(r.m.position.x, r.m.position.y, r.m.position.z); }
}

// ------------------------------------------------------------ Sonar: find the markers in the dark by pinging
export class Sonar extends Piloted {
  start() {
    const d = this.data;
    this.board("sub", d.sub);
    this.craft.lightsOn(true, 40);
    // inside a pipe it's pitch black: turn the daylight right down while the mission runs
    if (d.dark && this.w.sun) { this.lit = [this.w.sun.intensity, this.w.hemi.intensity]; this.w.sun.intensity *= 0.08; this.w.hemi.intensity *= 0.12; }
    this.marks = (d.marks || []).slice(0, this.def.n || 5).map(m => {
      const g = new THREE.Group(); g.position.set(m[0], m[1], m[2]); this.add(g);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x7fe3ff, emissiveIntensity: 0.6 })); g.add(core);
      return { g, core, got: false, flash: 0 };
    });
    this.got = 0; this.ping = -1; this.pingAt = 0;
    this.navPts = d.marks;
  }
  actionLabel() { return "PING"; }
  doPing() {
    this.ping = 0; this.pingFrom = this.craft.pos.clone(); this.g.sound("ping");
    SEA.uPing.value.set(this.pingFrom.x, this.pingFrom.y, this.pingFrom.z, 0);
  }
  update(dt) {
    if (this.g.input.takeAction() || (this.autoPing && this.t - this.pingAt > 3)) { this.pingAt = this.t; this.doPing(); }
    if (this.ping >= 0) {
      this.ping += dt * 22;
      SEA.uPing.value.w = this.ping; SEA.uPingI.value = Math.max(0, 1 - this.ping / 60);
      for (const m of this.marks) if (!m.got && Math.abs(m.g.position.distanceTo(this.pingFrom) - this.ping) < 1.5) m.flash = 3;
      if (this.ping > 60) { this.ping = -1; SEA.uPingI.value = 0; }
    }
    for (const m of this.marks) {
      if (m.got) continue;
      m.flash = Math.max(0, m.flash - dt);
      m.core.material.emissiveIntensity = 0.4 + m.flash * 1.5 + Math.sin(this.t * 3) * 0.2; m.core.rotation.y += dt * 2;
      if (m.g.position.distanceTo(this.craft.pos) < 2.6) { m.got = true; m.g.visible = false; this.got++; this.g.sound("cell"); this.g.fx.ring(m.g.position.x, m.g.position.y, m.g.position.z, 0x7fe3ff, 2); if (this.got >= this.marks.length) this.win(); }
    }
  }
  cleanup() { SEA.uPingI.value = 0; if (this.lit) { this.w.sun.intensity = this.lit[0]; this.w.hemi.intensity = this.lit[1]; this.lit = null; } super.cleanup(); }
  hud() { return { ...super.hud(), text: `Ping and find the markers  ${this.got}/${this.marks.length}`, progress: this.got / this.marks.length }; }
  target() { const m = this.marks.find(m => !m.got); return m ? m.g.position : null; }
  solve() {
    this.autoPing = true;
    const m = this.marks.filter(m => !m.got).sort((a, b) => a.g.position.distanceTo(this.craft.pos) - b.g.position.distanceTo(this.craft.pos))[0]; if (!m) return;
    if (m !== this.aim) { this.aim = m; this.aimT = this.t; }
    if (this.t - this.aimT > 45) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} marker`); this.craft.teleport(m.g.position.x, m.g.position.y, m.g.position.z); this.aimT = this.t; return; }
    this.driveTo(m.g.position.x, m.g.position.y, m.g.position.z);
  }
}

// ------------------------------------------------------------ Salvage: TORPEDO's claw lifts things onto the ring
export class Salvage extends Piloted {
  start() {
    const d = this.data;
    this.board("sub", d.sub);
    const claw = this.claw = new THREE.Group(); claw.position.set(0, -0.8, 0.6); this.craft.bodyG.add(claw);
    const metal = new THREE.MeshStandardMaterial({ color: 0x8a939e, metalness: 0.8, roughness: 0.35 });
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), metal); arm.position.y = 0.2; claw.add(arm);
    this.fingers = [-1, 1].map(s => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.12), metal); f.position.set(s * 0.15, -0.15, 0); claw.add(f); return f; });
    const kind = d.thing || "part";
    this.items = (d.items || []).slice(0, this.def.n || 3).map(p => {
      const m = kind === "rock" ? new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), new THREE.MeshStandardMaterial({ color: 0x6a6a64, roughness: 0.95, flatShading: true }))
        : SALVAGE[kind] ? SALVAGE[kind]()
        : new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0x3a8ad8, metalness: 0.6, roughness: 0.4, emissive: 0x0a2a4a, emissiveIntensity: 0.5 }));
      m.position.set(p[0], p[1], p[2]); m.castShadow = true; this.add(m);
      return { m, state: "floor", home: p };
    });
    this.pad = v3(d.pad); this.padR = d.padR || 2.5;
    const ring = this.add(ringMesh(this.padR, 0x7bed9f)); ring.position.copy(this.pad); ring.rotation.x = Math.PI / 2;
    this.held = null; this.placed = 0;
    this.navPts = [...d.items, d.pad];
  }
  actionLabel() { return this.held ? "DROP" : this.near() ? "GRAB" : null; }
  near() { const c = this.craft.pos; return this.items.find(it => it.state === "floor" && Math.hypot(it.m.position.x - c.x, it.m.position.z - c.z) < 2 && c.y - it.m.position.y < 3.2 && c.y > it.m.position.y) || null; }
  update(dt) {
    const inp = this.g.input;
    if (inp.takeAction()) {
      if (this.held) this.drop(); else { const it = this.near(); if (it) { this.held = it; it.state = "held"; this.g.sound("zap"); } }
    }
    for (const f of this.fingers) f.rotation.z = (this.held ? 0.05 : 0.4) * Math.sign(f.position.x);
    if (this.held) { const w = new THREE.Vector3(); this.claw.getWorldPosition(w); this.held.m.position.set(w.x, w.y - 0.6, w.z); }
    for (const it of this.items) if (it.state === "falling") {
      it.v = (it.v || 0) + dt * 6; it.m.position.y -= it.v * dt;
      const g = this.w.phys.ray({ x: it.m.position.x, y: it.m.position.y + 0.5, z: it.m.position.z }, { x: 0, y: -1, z: 0 }, 60, this.craft.col);
      const floor = g !== null ? it.m.position.y + 0.5 - g + 0.45 : -1e9;
      if (it.m.position.y <= floor) { it.m.position.y = floor; it.state = it.onPad ? "placed" : "floor"; it.v = 0; this.g.fx.puff(it.m.position.x, it.m.position.y, it.m.position.z, 0xd8d0b0, 10); }
    }
  }
  drop() {
    const it = this.held; this.held = null; it.state = "falling";
    it.onPad = Math.hypot(it.m.position.x - this.pad.x, it.m.position.z - this.pad.z) < this.padR;
    this.g.sound("land");
    if (it.onPad) { this.placed++; this.g.sound("cell"); this.g.fx.ring(this.pad.x, this.pad.y + 0.2, this.pad.z, 0x7bed9f, this.padR); if (this.placed >= this.items.length) this.later(0.8, () => this.win()); }
  }
  hud() { return { ...super.hud(), text: `Lift them onto the ring  ${this.placed}/${this.items.length}`, progress: this.placed / this.items.length }; }
  target() { if (this.held) return this.pad; const it = this.items.find(i => i.state === "floor"); return it ? it.m.position : null; }
  solve() {
    const inp = this.g.input, c = this.craft.pos;
    if (this.held) {
      const d = this.driveTo(this.pad.x, this.pad.y + 2.6, this.pad.z, true);
      if (Math.hypot(c.x - this.pad.x, c.z - this.pad.z) < this.padR * 0.5 && d < 1.5) inp.actionPressed = true;
      return;
    }
    const it = this.items.filter(i => i.state === "floor").sort((a, b) => a.m.position.distanceTo(c) - b.m.position.distanceTo(c))[0]; if (!it) return;
    const d = this.driveTo(it.m.position.x, it.m.position.y + 1.9, it.m.position.z, true);
    if (this.near() === it && d < 1.4) inp.actionPressed = true;
  }
}

// ------------------------------------------------------------ Escort: little ones follow Rory home
export class Escort extends Mission {
  start() {
    const d = this.data, kind = d.critter || "turtle";
    this.goal = v3(d.goal); this.goalR = d.goalR || 3;
    this.water = d.water ?? kind === "clownfish";
    this.kids = (d.kids || []).slice(0, this.def.n || 3).map(k => { const c = critter(kind); c.position.set(k[0], k[1], k[2]); this.add(c); return { c, home: v3(k), state: "wait", t: 0 }; });
    const gm = this.add(ringMesh(this.goalR, 0x7bed9f)); gm.position.copy(this.goal); gm.rotation.x = Math.PI / 2;
    // crabs patrol back and forth; a crab scares a little one back to where it started
    this.crabs = (d.crabs || []).map(([ax, az, bx, bz, sp = 1.6]) => { const c = critter("crab"); this.add(c); return { c, a: [ax, az], b: [bx, bz], sp, u: Math.random() }; });
    this.saved = 0;
    this.navPts = [...d.kids, d.goal];
  }
  ground(x, z, y) { const h = this.w.phys.ray({ x, y: y + 1.5, z }, { x: 0, y: -1, z: 0 }, 6, this.p.walker.col); return h !== null ? y + 1.5 - h : y; }
  update(dt) {
    const pp = this.p.pos, head = pp.clone().setY(pp.y + (this.water ? 0.7 : 0));
    let lead = 0;
    for (const k of this.kids) {
      const c = k.c;
      animateCritter(c, dt, k.state === "follow" ? 1 : 0.2);
      if (k.state === "saved") continue;
      if (k.state === "wait" && c.position.distanceTo(head) < 2.4) { k.state = "follow"; this.g.sound("pad"); }
      if (k.state === "follow" || k.state === "home") {
        // follow in a line behind Rory; frightened ones hurry back to where they started
        const tgt = k.state === "home" ? k.home : head.clone().add(new THREE.Vector3(-Math.sin(this.p.yaw), 0, -Math.cos(this.p.yaw)).multiplyScalar(1.2 + lead++ * 0.9));
        const dv = tgt.clone().sub(c.position); if (!this.water) dv.y = 0;
        const d = dv.length(), sp = k.state === "home" ? 4 : Math.min(4.2, d * 1.6);
        if (d > 0.15) { c.position.addScaledVector(dv.normalize(), Math.min(d, sp * dt)); c.rotation.y = Math.atan2(dv.x, dv.z); }
        if (!this.water) c.position.y = this.ground(c.position.x, c.position.z, c.position.y);
        if (k.state === "home" && c.position.distanceTo(k.home) < 0.3) k.state = "wait";
        if (k.state === "follow" && Math.hypot(c.position.x - this.goal.x, c.position.z - this.goal.z) < this.goalR && Math.abs(c.position.y - this.goal.y) < 3) {
          k.state = "saved"; this.saved++; this.g.sound("cell"); this.g.fx.burst(c.position.x, c.position.y + 0.3, c.position.z, 0x7bed9f, 20);
          if (this.data.release) { c.visible = false; } else c.position.copy(this.goal).add(new THREE.Vector3((Math.random() - 0.5) * this.goalR, 0, (Math.random() - 0.5) * this.goalR));
          if (this.saved >= this.kids.length) this.win();
        }
      }
    }
    for (const cr of this.crabs) {
      cr.u += dt * cr.sp / Math.max(1, Math.hypot(cr.b[0] - cr.a[0], cr.b[1] - cr.a[1]));
      const f = (Math.sin(cr.u * Math.PI) + 1) / 2, x = cr.a[0] + (cr.b[0] - cr.a[0]) * f, z = cr.a[1] + (cr.b[1] - cr.a[1]) * f;
      cr.c.position.set(x, this.ground(x, z, pp.y + 2), z); cr.c.rotation.y = Math.PI / 2; animateCritter(cr.c, dt, 1);
      for (const k of this.kids) if (k.state === "follow" && k.c.position.distanceTo(cr.c.position) < 1.0) { k.state = "home"; this.g.sound("fail"); toast("A crab scared it! It ran back.", 2); }
    }
  }
  hud() { return { ...super.hud(), text: `Lead them home  ${this.saved}/${this.kids.length}`, progress: this.saved / this.kids.length }; }
  debugState() { const f = v => +v.toFixed(1); return { p: this.p.pos.toArray().map(f), sw: this.p.swimming, kids: this.kids.map(k => [k.state, ...k.c.position.toArray().map(f)]), path: this.navPath ? this.navPath.length : null, navI: this.navI, next: this.navPath ? this.navPath.slice(this.navI, this.navI + 3).map(q => [q.how, f(q.x), f(q.h), f(q.z)]) : null, end: this.navPath && this.navPath.length ? [f(this.navPath.at(-1).x), f(this.navPath.at(-1).h), f(this.navPath.at(-1).z)] : null, inp: this.g.input.forced }; }
  target() { const w = this.kids.find(k => k.state === "wait" || k.state === "home"); return this.kids.some(k => k.state === "follow") ? this.goal : w ? w.c.position : this.goal; }
  solve() {
    const following = this.kids.filter(k => k.state === "follow"), waiting = this.kids.filter(k => k.state === "wait").sort((a, b) => a.c.position.distanceTo(this.p.pos) - b.c.position.distanceTo(this.p.pos));
    // pick them all up first, then lead the way, waiting for stragglers
    let tgt = waiting.length ? waiting[0].c.position : following.length ? this.goal : null;
    if (!tgt) return;
    // (the line gets longer with every little one in it, so the last one sits further back)
    if (!waiting.length && following.some(k => Math.hypot(k.c.position.x - this.p.pos.x, k.c.position.z - this.p.pos.z) > 2.6 + following.length * 0.9)) { this.g.input.forced = { mx: 0, my: 0 }; this.g.input.jumpHeld = false; return; }
    // a crab's beat across the way home: wait short of it until the crab is well away from where
    // we'll cross, then take the whole line of little ones over in one go
    if (following.length && !waiting.length) {
      const pp = this.p.pos, gx = this.goal.x, gz = this.goal.z;
      for (const cr of this.crabs) {
        const [ax, az] = cr.a, [bx, bz] = cr.b, rx = gx - pp.x, rz = gz - pp.z, sx = bx - ax, sz = bz - az, den = rx * sz - rz * sx;
        if (Math.abs(den) < 1e-6) continue;
        const t = ((ax - pp.x) * rz - (az - pp.z) * rx) / den, u = ((ax - pp.x) * sz - (az - pp.z) * sx) / den;
        if (t < -0.1 || t > 1.1 || u < 0 || u > 1) continue;
        const cx = ax + sx * t, cz = az + sz * t;
        if (Math.hypot(cx - pp.x, cz - pp.z) < 3.5 && Math.hypot(cr.c.position.x - cx, cr.c.position.z - cz) < 6) { this.g.input.forced = { mx: 0, my: 0 }; return; }
      }
    }
    if (this.water) this.swimTo(tgt.x, tgt.y + (waiting.length ? 0 : 0.5), tgt.z);
    else this.walkTo(tgt.x, tgt.y + 0.3, tgt.z, waiting.length ? 1.2 : 1.0, this.navPts.map(v3));
  }
}
Object.assign(Escort.prototype, swimMixin);

// ------------------------------------------------------------ Surf: ride the wave in and grab the pearls on it
export class Surf extends Piloted {
  start() {
    const d = this.data, sea = this.w.sea;
    this.board("board", d.start);
    this.craft.L.auto = d.speed || 8;
    this.pearls = (d.pearls || []).slice(0, this.def.n || 10).map(p => { const c = this.add(makeCell()); c.position.set(p[0], (sea ? sea.level : 0) + 0.8, p[1]); return c; });
    this.got = 0; this.need = Math.min(this.def.n || this.pearls.length, this.pearls.length) - (d.spare ?? 2);
    // the wave: a long green swell that rolls in with Rory on its face
    const wave = this.wave = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 80, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2aa8b8, transparent: true, opacity: 0.85, roughness: 0.15, side: THREE.DoubleSide }));
    wave.rotation.z = Math.PI / 2; this.add(wave);
    this.beach = d.beach;
  }
  update(dt) {
    const c = this.craft, sea = this.w.sea;
    c.L.auto = this.data.speed || 8;
    const fw = new THREE.Vector3(Math.sin(this.data.start[3] || 0), 0, Math.cos(this.data.start[3] || 0));
    this.wave.position.set(c.pos.x - fw.x * 1.6, (sea ? sea.level : 0) - 0.4, c.pos.z - fw.z * 1.6); this.wave.rotation.set(0, Math.atan2(fw.x, fw.z) + Math.PI / 2, Math.PI / 2);
    for (const p of this.pearls) {
      if (!p.visible) continue;
      spinCell(p, this.t); p.position.y = (sea ? sea.height(p.position.x, p.position.z) : 0) + 0.8;
      if (Math.hypot(p.position.x - c.pos.x, p.position.z - c.pos.z) < 1.6) { p.visible = false; this.got++; this.g.sound("cell"); this.g.addCells(1); this.g.fx.burst(p.position.x, p.position.y, p.position.z, 0x7fe3ff, 20); }
    }
    // the ride ends on the beach: enough pearls wins, too few and it's another go
    const along = (c.pos.x - this.data.start[0]) * fw.x + (c.pos.z - this.data.start[2]) * fw.z;
    if (along > this.beach) { if (this.got >= this.need) this.win(); else this.lose("NOT ENOUGH PEARLS"); }
  }
  hud() { return { ...super.hud(), text: `Surf in and grab the pearls  ${Math.min(this.got, this.need)}/${this.need}`, progress: Math.min(1, this.got / this.need) }; }
  target() { const p = this.pearls.find(p => p.visible); return p ? p.position : null; }
  solve() {
    const c = this.craft, fw = new THREE.Vector3(Math.sin(this.data.start[3] || 0), 0, Math.cos(this.data.start[3] || 0));
    const ahead = this.pearls.filter(p => p.visible && (p.position.x - c.pos.x) * fw.x + (p.position.z - c.pos.z) * fw.z > 1).sort((a, b) => a.position.distanceTo(c.pos) - b.position.distanceTo(c.pos))[0];
    const tgt = ahead ? ahead.position : c.pos.clone().addScaledVector(fw, 10);
    c.camYaw = Math.atan2(-(tgt.x - c.pos.x), -(tgt.z - c.pos.z));
    this.g.input.forced = { mx: 0, my: 1 };
  }
}

// ------------------------------------------------------------ Divers: Drips swimming round a pump; bubble them under water
export class Divers extends Roundup {
  start() {
    super.start();
    for (const b of this.bots) { b.swimY = 1.4 + Math.random() * 2; b.ph = Math.random() * 6; }
    this.navPts = this.bots.map(b => b.r.pos.toArray());
  }
  botY(b) { return (this.w.heightAt ? this.w.heightAt(b.r.pos.x, b.r.pos.z) : 0) + (b.swimY || 1.5) + Math.sin(this.t * 1.3 + (b.ph || 0)) * 0.3; }
  fire() {
    // aim assist in three dimensions: at the nearest Drip in front, up or down
    this.cool = 0.4;
    const p = this.p, from = new THREE.Vector3(p.pos.x, p.pos.y + 0.9, p.pos.z), fw = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    let dir = fw.clone(), bd = 10;
    for (const b of this.bots) { if (b.state !== "walk") continue; const to = b.r.pos.clone().setY(b.r.pos.y + 0.6).sub(from), d = to.length(); if (d < bd && to.clone().setY(0).normalize().dot(fw) > 0.5) { bd = d; dir = to.normalize(); } }
    const m = this.add(makeBubble(0.3)); m.position.copy(from).addScaledVector(fw, 0.6);
    this.shots.push({ m, v: dir.multiplyScalar(12), t: 0 });
    this.g.sound("zap");
  }
  hud() { return { ...super.hud(), text: `Bubble the Drip divers  ${this.popped}/${this.need}` }; }
  debugState() { const f = v => +v.toFixed(1), pp = this.p.pos; return { p: pp.toArray().map(f), sw: this.p.swimming, under: this.p.headUnder, air: f(this.p.air), gasp: !!this.gasping, bots: this.bots.filter(b => b.state === "walk").map(b => b.r.pos.toArray().map(f)).slice(0, 3), path: this.swimPath ? this.swimPath.length : null }; }
  solve() {
    const pp = this.p.pos, b = this.bots.filter(b => b.state === "walk").sort((a, c) => a.r.pos.distanceTo(pp) - c.r.pos.distanceTo(pp))[0];
    if (!b) { this.g.input.forced = { mx: 0, my: 0 }; return; }
    if (b !== this.aim) { this.aim = b; this.aimT = this.t; }
    if (this.t - this.aimT > 30) { (this.g.teleports || (this.g.teleports = [])).push(`${this.def.id} diver ${this.bots.indexOf(b)}`); this.p.teleport(b.r.pos.x + 2, b.r.pos.y, b.r.pos.z + 2); this.aimT = this.t; return; }
    const d = b.r.pos.distanceTo(pp);
    this.swimTo(b.r.pos.x, b.r.pos.y + 0.4, b.r.pos.z);
    if (d < 5) { this.p.yaw = Math.atan2(b.r.pos.x - pp.x, b.r.pos.z - pp.z); if (this.cool <= 0) this.g.input.actionPressed = true; }
  }
}
Object.assign(Divers.prototype, swimMixin);
