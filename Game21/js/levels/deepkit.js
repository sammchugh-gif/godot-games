// Pieces the Act Two places are built from: airlocks between the sea and the dry
// rooms, kelp that sways, glowing things for the dark. Each adds its own colliders.
import * as THREE from "three";
import { M } from "../tex.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// ------------------------------------------------------------ an airlock
// A chamber (inside w wide, d deep, h high, its floor at y) with a door at each end: the outer one to
// the sea, the inner one to a dry room. q is how it's turned, in quarter turns (0: the sea is to -z).
// Three levers on its wall: shut or open the outer door, pump the water out or let it in, open or
// shut the inner door. They only work in a safe order (never both doors open, never pump with the
// sea door open, never open the inner door while it's full). Outside a mission it runs itself:
// step in and it cycles you through.
export function airlock(w, x, y, z, q = 0, o = {}) {
  const W = o.w ?? 3.4, D = o.d ?? 4.4, H = o.h ?? 3.2, T = 0.3;
  const c = Math.round(Math.cos(q * Math.PI / 2)), s = Math.round(Math.sin(q * Math.PI / 2));
  // local (lx along the width, lz along the depth, sea at -lz) to world
  const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const dims = (a, b) => (q % 2 ? [b, a] : [a, b]);
  const wall = o.wall || M(0x8a96a8, { metal: 0.6, rough: 0.4 }), trim = M(0xf2c418, { rough: 0.4 });
  const put = (lx, ly, lz, sx, sy, sz, mat = wall) => { const [px, pz] = P(lx, lz), [bx, bz] = dims(sx, sz); return w.box(bx, sy, bz, mat, px, ly, pz); };
  // floor, roof, side walls
  put(0, y - T / 2, 0, W + 2 * T, T, D + 2 * T);
  put(0, y + H + T / 2, 0, W + 2 * T, T, D + 2 * T);
  for (const sx of [-1, 1]) put(sx * (W / 2 + T / 2), y + H / 2, 0, T, H, D + 2 * T);
  // the end walls round each doorway (the doorway 1.6 wide, 2.4 high)
  const DW = 1.6, DH = 2.4;
  for (const e of [-1, 1]) {
    const lz = e * (D / 2 + T / 2);
    for (const sx of [-1, 1]) put(sx * (DW / 2 + (W - DW) / 4), y + H / 2, lz, (W - DW) / 2, H, T);
    put(0, y + DH + (H - DH) / 2, lz, DW, H - DH, T);
    put(0, y + DH + 0.08, lz + e * 0.05, DW + 0.2, 0.16, T + 0.1, trim);
  }
  // the doors: slabs that slide up into the roof
  const S = { outer: o.open === "inner" ? 0 : 1, inner: o.open === "inner" ? 1 : 0, water: o.open === "inner" ? 0 : 1 };
  const V = { ...S };
  const doorMat = M(0x3a4a5a, { metal: 0.7, rough: 0.35 });
  const door = (e, key) => {
    const [px, pz] = P(0, e * (D / 2 + T / 2)), [bx, bz] = dims(DW, T * 0.8);
    return w.platform(bx, DH, bz, doorMat, px, y + DH / 2, pz, () => [px, y + DH / 2 + V[key] * (DH - 0.05), pz, 0]);
  };
  door(-1, "outer"); door(1, "inner");
  // the water inside, and the room of air it leaves as the pump runs
  const [x0, z0] = P(-W / 2, -D / 2), [x1, z1] = P(W / 2, D / 2);
  const room = w.dryRoom(Math.min(x0, x1), y, Math.min(z0, z1), Math.max(x0, x1), y + H, Math.max(z0, z1), { wl: y + H + 2 });
  const [wx, wz] = dims(W, D);
  const water = new THREE.Mesh(new THREE.BoxGeometry(wx, 1, wz), new THREE.MeshStandardMaterial({ color: 0x2a8ab8, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }));
  water.userData.dynamic = true; water.position.set(x, y, z); w.scene.add(water);
  // the levers, on the wall on the +x side: red (outer door), blue (pump), green (inner door)
  const levers = {};
  [["outer", 0xe8402a, -1.2], ["pump", 0x2a8ae8, 0], ["inner", 0x2ac870, 1.2]].forEach(([k, col, lz]) => {
    const [px, pz] = P(W / 2 - 0.12, lz);
    const base = w.mesh(new THREE.BoxGeometry(0.2, 0.5, 0.36), M(0x2a2e36, { metal: 0.7 }), px, y + 1.2, pz, { ry: q * Math.PI / 2 });
    const arm = new THREE.Group(); arm.position.set(px, y + 1.2, pz); arm.rotation.y = q * Math.PI / 2; arm.userData.dynamic = true; w.scene.add(arm);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), M(0xd8d8d8, { metal: 0.8 })); h.position.y = 0.25; arm.add(h);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8 })); knob.position.y = 0.5; arm.add(knob);
    void base;
    const [sx, sz] = P(W / 2 - 0.9, lz);
    levers[k] = { arm, x: px, y: y + 1.2, z: pz, stand: [sx, y, sz] };
  });
  const lamp = new THREE.PointLight(0xfff0d0, 6, 9, 1.5); lamp.position.set(x, y + H - 0.4, z); w.scene.add(lamp);
  const DRY = { outer: 0, inner: 1, water: 0 }, SEA = { outer: 1, inner: 0, water: 1 };
  const A = {
    S, V, room, levers, x, y, z, W, D, H, auto: true, busy: 0,
    inside: p => p.x > room.x0 + 0.2 && p.x < room.x1 - 0.2 && p.z > room.z0 + 0.2 && p.z < room.z1 - 0.2 && p.y > y - 0.5 && p.y < y + H,
    // the sea side and the dry side, a step out from each door
    sea: [...P(0, -D / 2 - 1.6)], dry: [...P(0, D / 2 + 1.6)],
    // pull a lever; says why not if it isn't safe
    pull(k) {
      if (A.busy > 0) return "wait";
      if (k === "outer") { if (!S.outer && S.water < 1) return "flood"; S.outer = S.outer ? 0 : 1; }
      else if (k === "pump") { if (S.outer || S.inner) return "doors"; S.water = S.water ? 0 : 1; }
      else if (k === "inner") { if (!S.inner && S.water > 0) return "full"; S.inner = S.inner ? 0 : 1; }
      A.busy = k === "pump" ? 3 : 1.2;
      return "ok";
    },
    // the next safe pull on the way to the state g (null when it's there, or busy)
    next(g) {
      if (S.water !== g.water) return S.outer ? "outer" : S.inner ? "inner" : "pump";
      if (S.outer !== g.outer) return "outer";
      if (S.inner !== g.inner) return "inner";
      return null;
    },
    toward(g) { const k = A.next(g); if (k && A.busy <= 0) A.pull(k); },
  };
  w.updaters.push(dt => {
    A.busy -= dt;
    for (const k of ["outer", "inner"]) V[k] += Math.sign(S[k] - V[k]) * Math.min(Math.abs(S[k] - V[k]), dt / 1.1);
    V.water += Math.sign(S.water - V.water) * Math.min(Math.abs(S.water - V.water), dt / 2.8);
    room.wl = V.water > 0.999 ? y + H + 2 : y + V.water * H;
    water.scale.y = Math.max(0.01, V.water * H); water.position.y = y + water.scale.y / 2; water.visible = V.water > 0.01;
    for (const [k, v] of [["outer", V.outer], ["pump", 1 - V.water], ["inner", V.inner]]) levers[k].arm.rotation.z = (v - 0.5) * 1.2;
    // running itself: step in and it cycles you through to the other side; walk up to a shut door
    // from outside and it gets that side ready for you
    const pl = w.player && w.player.pos;
    if (A.auto && pl) {
      const inside = A.inside(pl);
      if (inside && !A.wasIn) A.goal = V.outer > 0.5 ? DRY : SEA;
      A.wasIn = inside;
      A.dwell = inside ? (A.dwell || 0) + dt : 0;
      if (!inside) A.goal = Math.hypot(pl.x - A.dry[0], pl.z - A.dry[1]) < 2.6 && Math.abs(pl.y - y) < 2 ? DRY : Math.hypot(pl.x - A.sea[0], pl.z - A.sea[1]) < 2.6 && Math.abs(pl.y - y) < 3 ? SEA : null;
      if (A.goal && (!inside || A.dwell > 1.2)) A.toward(A.goal);
    }
  });
  (w.airlocks || (w.airlocks = [])).push(A);
  return A;
}

// ------------------------------------------------------------ kelp
// A forest of giant kelp: for each [x, y, z, height] a stalk from the sea bed up to the surface,
// its blades all the way up and a canopy spread on top. All of it is one mesh, and it sways in the
// swell in its vertex shader (the higher up, the further), so a whole forest is one draw call.
// No colliders: Rory and TORPEDO push through it.
export function kelp(w, stalks, o = {}) {
  const geos = [];
  const tag = (g, base, ht) => { const p = g.attributes.position, a = new Float32Array(p.count); for (let i = 0; i < p.count; i++) a[i] = Math.max(0, (p.getY(i) - base) / ht); g.setAttribute("aH", new THREE.BufferAttribute(a, 1)); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "aH"].includes(k)) g.deleteAttribute(k); return g; };
  let seed = 1; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const [x, y, z, ht] of stalks) {
    const st = new THREE.CylinderGeometry(0.05, 0.08, ht, 5, Math.max(2, Math.round(ht / 2)), true); st.translate(x, y + ht / 2, z);
    geos.push(tag(st.index ? st.toNonIndexed() : st, y, ht));
    // blades up the stalk, turning as they go
    for (let k = 0; k < (ht - 1.4) / 0.9; k++) {
      const b = new THREE.PlaneGeometry(0.28, 1.1, 1, 2); b.translate(0.18, 0, 0); b.rotateZ(-0.7 + R() * 0.3); b.rotateY(k * 2.4 + R()); b.translate(x, y + 0.6 + k * 0.9, z);
      geos.push(tag(b.toNonIndexed(), y, ht));
    }
    // the canopy: long blades lying out along the surface
    if (o.canopy !== false) for (let k = 0; k < 7; k++) {
      const b = new THREE.PlaneGeometry(0.5, 3.4, 1, 3); b.rotateX(-Math.PI / 2); b.translate(0, 0, 1.7); b.rotateY(k * 0.9 + R()); b.translate(x, (o.top ?? y + ht) - k * 0.012, z);
      geos.push(tag(b.toNonIndexed(), y, ht));
    }
  }
  const geo = mergeGeometries(geos, false);
  const mat = new THREE.MeshStandardMaterial({ color: o.color ?? 0x6a7a2a, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x1a2408, emissiveIntensity: 0.4 });
  const hook = THREE.MeshStandardMaterial.prototype.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    if (hook) hook.call(mat, sh);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aH;").replace("#include <begin_vertex>", `#include <begin_vertex>
      { float k = pow(aH, 1.3) * ${(o.sway ?? 1.2).toFixed(2)}; vec2 ph = position.xz * vec2(0.13, 0.09);
        transformed.x += sin(uSea.z * 0.7 + ph.x + ph.y) * k; transformed.z += cos(uSea.z * 0.55 + ph.x * 0.7 - ph.y) * k * 0.8; }`);
  };
  mat.customProgramCacheKey = () => "kelp";
  const m = new THREE.Mesh(geo, mat); m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; m.userData.dynamic = true;
  w.scene.add(m);
  for (const g of geos) g.dispose();
  return m;
}

// ------------------------------------------------------------ the POLARIS dive bell
// Where Rory starts in the deep places: a glass dome on legs over the sea bed with a floor of air
// inside it and a round moon pool in the middle, open to the sea below. Swim up through the pool to
// breathe; walk to its edge and drop in to go out. (x, z) is its middle; y is the sea bed under it.
export function diveBell(w, x, y, z, o = {}) {
  const F = y + (o.legs ?? 3), R = 5, HOLE = 1.4;
  const steel = M(0xd8dde4, { metal: 0.7, rough: 0.35 }), yellow = M(0xf2c418, { rough: 0.4 }), floorM = M(0x5a6a7a, { metal: 0.5, rough: 0.6 });
  // the floor: a square round the pool (four slabs), on four legs
  const t = 0.3, span = R * 1.9, mid = (HOLE + span / 2) / 2, dd = span / 2 - HOLE;
  for (const [cx, cz, sx, sz] of [[0, mid, span, dd], [0, -mid, span, dd], [mid, 0, dd, HOLE * 2], [-mid, 0, dd, HOLE * 2]])
    w.box(sx, t, sz, floorM, x + cx, F - t / 2, z + cz);
  w.mesh(new THREE.TorusGeometry(HOLE * 1.05, 0.08, 8, 32), yellow, x, F + 0.02, z, { rx: Math.PI / 2 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.cyl(0.25, 0.3, F - y, steel, x + sx * span * 0.42, (y + F) / 2, z + sz * span * 0.42, { seg: 10 });
  // the walls (an octagon of glass panes in steel frames) and the dome
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const WH = 3.2;
  for (let k = 0; k < 8; k++) {
    const a = (k + 0.5) / 8 * Math.PI * 2, px = x + Math.cos(a) * R * 0.92, pz = z + Math.sin(a) * R * 0.92, wd = 2 * R * 0.92 * Math.tan(Math.PI / 8);
    const pane = w.mesh(new THREE.PlaneGeometry(wd, WH), glass, px, F + WH / 2, pz, { ry: -a + Math.PI / 2, cast: false }); pane.userData.dynamic = true;
    w.phys.fixedBox(px, F + WH / 2, pz, wd / 2, WH / 2, 0.1, -a + Math.PI / 2);
    const fa = k / 8 * Math.PI * 2; w.cyl(0.07, 0.07, WH, steel, x + Math.cos(fa) * R, F + WH / 2, z + Math.sin(fa) * R, { seg: 6, collide: false });
  }
  const dome = w.mesh(new THREE.SphereGeometry(R, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass, x, F + WH, z, { cast: false }); dome.userData.dynamic = true;
  w.phys.fixedBox(x, F + WH + 0.2, z, R, 0.2, R);
  w.mesh(new THREE.TorusGeometry(R, 0.12, 8, 40), steel, x, F + WH, z, { rx: Math.PI / 2 });
  // lamps, a POLARIS sign, a bench and an air rack
  const lamp = new THREE.PointLight(0xfff0d8, 10, 14, 1.3); lamp.position.set(x, F + WH + 1.5, z); w.scene.add(lamp);
  w.sign("POLARIS", 2.2, 0.5, x, F + WH - 0.4, z - R * 0.85, 0, { bg: "#0a2a4a", fg: "#7ff4e8", glow: 0.6 });
  w.box(2.4, 0.4, 0.6, yellow, x - R * 0.55, F + 0.2, z + R * 0.5, { ry: -0.6 }); // (low enough to step over)
  for (let i = 0; i < 4; i++) w.cyl(0.14, 0.14, 1, M(0xf2c418, { rough: 0.35, metal: 0.3 }), x + R * 0.6 + i * 0.3, F + 0.5, z - R * 0.35, { seg: 8, collide: false });
  const room = w.dryRoom(x - R, F - 0.3, z - R, x + R, F + WH + R, z + R, { wl: F - 0.3, below: F - 0.3 - y });
  // (Rory starts by the glass on the side the place's sights are, o.face being the way he looks)
  const fa = o.face ?? -Math.PI / 2;
  return { F, room, spawn: [x + Math.sin(fa) * 3.2, F + 0.1, z + Math.cos(fa) * 3.2], hole: [x, z], face: fa };
}

// ------------------------------------------------------------ the vents
// A black smoker: a knobbly chimney ht metres tall with scalding black water pouring out of its
// top (a plume that pushes swimmers away) and a warm glow round its foot.
export function smoker(w, x, y, z, ht = 8, o = {}) {
  const rock = o.mat || M("rock", { args: [91, [52, 46, 44]], repeat: [2, 4], rough: 0.95 });
  const segs = Math.max(2, Math.round(ht / 3));
  for (let i = 0; i < segs; i++) { const r0 = 1.6 - i * 1.0 / segs, r1 = 1.6 - (i + 1) * 1.0 / segs, sh = ht / segs; w.cyl(r1 * 0.9, r0, sh, rock, x + Math.sin(i * 1.7) * 0.15, y + sh * (i + 0.5), z + Math.cos(i * 2.3) * 0.15, { seg: 7 }); }
  // the smoke: dark specks rising and spreading, recycled
  const n = 90, pos = new Float32Array(n * 3), st = [];
  for (let i = 0; i < n; i++) st.push({ t: Math.random() * 6, a: Math.random() * 6.28, s: 0.5 + Math.random() * 0.8 });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const smoke = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, color: 0x18161a, transparent: true, opacity: 0.55, depthWrite: false }));
  smoke.frustumCulled = false; smoke.userData.dynamic = true; w.scene.add(smoke);
  const top = y + ht;
  w.updaters.push(dt => {
    for (let i = 0; i < n; i++) { const k = st[i]; k.t += dt * k.s; if (k.t > 6) k.t -= 6; const r = 0.3 + k.t * 0.35; pos[i * 3] = x + Math.cos(k.a + k.t * 0.5) * r; pos[i * 3 + 1] = top + k.t * 2.2; pos[i * 3 + 2] = z + Math.sin(k.a + k.t * 0.5) * r; }
    g.attributes.position.needsUpdate = true;
  });
  // the glow of hot rock at the mouth
  w.mesh(new THREE.TorusGeometry(0.62, 0.14, 8, 18), M(0xff6a1a, { emissive: 0xff5a10, ei: 2.2 }), x, top, z, { rx: Math.PI / 2, cast: false });
  if (o.light !== false) { const l = new THREE.PointLight(0xff7a2a, 6, 14, 1.5); l.position.set(x, top + 1, z); w.scene.add(l); }
  return w.plume(x, top, z, 1.3, 13);
}
// a clump of giant tube worms: white tubes with red plumes on top
export function tubeWorms(w, x, y, z, n = 20, spread = 1.6) {
  const tube = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.09, 1, 6), M(0xe8e4d8, { rough: 0.6 }), n);
  const tip = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), M(0xd8203a, { rough: 0.5, emissive: 0x6a0a14, ei: 0.6 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = i * 2.4, d = Math.sqrt(i / n) * spread, ht = 1.2 + ((i * 7) % 10) / 10 * 1.6, lx = x + Math.cos(a) * d, lz = z + Math.sin(a) * d, lean = (Math.sin(i * 3.1)) * 0.12;
    q.setFromEuler(e.set(lean, 0, Math.cos(i * 1.7) * 0.12));
    m4.compose(p.set(lx, y + ht / 2, lz), q, one.set(1, ht, 1)); tube.setMatrixAt(i, m4);
    m4.compose(p.set(lx + Math.sin(e.z) * -ht * 0.5, y + ht, lz + Math.sin(lean) * ht * 0.5), q, one.set(1, 1.6, 1)); tip.setMatrixAt(i, m4);
  }
  tube.userData.dynamic = tip.userData.dynamic = true; w.scene.add(tube); w.scene.add(tip);
}

// ------------------------------------------------------------ station rooms
// Walls round the rectangle x0..x1, z0..z1 from its floor at y up ht metres, with doorways (each
// { side: "n" | "s" | "e" | "w", at, w }: n is the z1 side, e the x1 side; at is where along it)
// and glass panes (glass: true) or solid panels. Returns nothing; it's all fixed.
export function walls(w, x0, z0, x1, z1, y, ht, doors = [], o = {}) {
  const T = 0.25, frame = o.frame || M(0xd8dde4, { metal: 0.7, rough: 0.35 }), solid = o.mat || M(0xc8ccd4, { metal: 0.4, rough: 0.5 });
  const glass = o.glass ? (o.glassMat || new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide })) : null;
  const DH = o.doorH ?? 2.6;
  const run = (side, a0, a1, fixed, along) => {
    const ds = doors.filter(d => d.side === side).sort((p, q) => p.at - q.at);
    let a = a0;
    const seg = (s0, s1, yb, yt) => {
      if (s1 - s0 < 0.05 || yt - yb < 0.05) return;
      const c = (s0 + s1) / 2, L = s1 - s0, cy = (yb + yt) / 2, hh = yt - yb;
      const [x, z, sx, sz] = along === "x" ? [c, fixed, L, T] : [fixed, c, T, L];
      if (glass && yb === y) { const m = w.mesh(new THREE.BoxGeometry(sx, hh, sz), glass, x, cy, z, { cast: false }); m.userData.dynamic = true; w.phys.fixedBox(x, cy, z, sx / 2, hh / 2, sz / 2); }
      else w.box(sx, hh, sz, solid, x, cy, z);
    };
    for (const d of ds) { seg(a, d.at - d.w / 2, y, y + ht); seg(d.at - d.w / 2, d.at + d.w / 2, y + DH, y + ht); a = d.at + d.w / 2; }
    seg(a, a1, y, y + ht);
    // frames every few metres, and along the top
    for (let s = a0; s <= a1 + 0.01; s += o.frameEvery || 3) { const [x, z] = along === "x" ? [s, fixed] : [fixed, s]; w.mesh(new THREE.BoxGeometry(0.14, ht, 0.14), frame, x, y + ht / 2, z, { cast: false }); }
    const [x, z, sx, sz] = along === "x" ? [(a0 + a1) / 2, fixed, a1 - a0, 0.2] : [fixed, (a0 + a1) / 2, 0.2, a1 - a0];
    w.mesh(new THREE.BoxGeometry(sx, 0.2, sz), frame, x, y + ht, z, { cast: false });
  };
  run("s", x0, x1, z0, "x"); run("n", x0, x1, z1, "x"); run("w", z0, z1, x0, "z"); run("e", z0, z1, x1, "z");
}
