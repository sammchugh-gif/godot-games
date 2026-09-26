// A level: sky, sun and shadows, fog, and building helpers that add both the
// mesh and its Rapier collider, plus props that tumble, platforms that move,
// bounce pads and low-gravity bubbles.
import * as THREE from "three";
import { M, TEX, rng } from "./tex.js";
import { R } from "./physics.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const SKIES = {
  day:      { top: "#2d6fd0", mid: "#8fc0ec", bottom: "#c8d8e0", sun: [40, 50], sunColor: "#fff4dc", sunI: 2.3, hemi: ["#cfe4ff", "#6a6048", 0.66], fog: [90, 420], clouds: 18 },
  morning:  { top: "#3a74c8", mid: "#b4d0ea", bottom: "#e8dccc", sun: [18, 110], sunColor: "#ffe2b8", sunI: 2.02, hemi: ["#d8e4ff", "#6a5a48", 0.6], fog: [80, 380], clouds: 14 },
  sunset:   { top: "#28366e", mid: "#e0787a", bottom: "#ffc080", sun: [6, 250], sunColor: "#ffb070", sunI: 1.87, hemi: ["#ffc8a0", "#4a4050", 0.54], fog: [70, 360], clouds: 14, cloudTint: "#ffc0a8" },
  night:    { top: "#02040e", mid: "#081230", bottom: "#141c34", sun: [35, 200], sunColor: "#9ab8ff", sunI: 0.4, hemi: ["#3a5088", "#10141c", 0.26], fog: [60, 320], clouds: 0, stars: 1500, moon: true },
  desert:   { top: "#3a7ad0", mid: "#a8c8e4", bottom: "#f0d8a8", sun: [55, 200], sunColor: "#fff0d0", sunI: 2.59, hemi: ["#e8e0c8", "#a08050", 0.66], fog: [120, 520], clouds: 4 },
  tropical: { top: "#1a78d8", mid: "#7cc8f0", bottom: "#c8f0f0", sun: [60, 140], sunColor: "#fff8e8", sunI: 2.45, hemi: ["#c8ecff", "#4a7a48", 0.66], fog: [120, 520], clouds: 22 },
  snow:     { top: "#6a8ab8", mid: "#c8d8e8", bottom: "#eef2f6", sun: [22, 160], sunColor: "#fff4e8", sunI: 1.73, hemi: ["#e0ecff", "#b8c4d0", 0.78], fog: [60, 300], clouds: 10 },
  storm:    { top: "#20283a", mid: "#4a5668", bottom: "#6a7280", sun: [30, 100], sunColor: "#c8d4e8", sunI: 0.86, hemi: ["#8a9ab0", "#2a2e34", 0.6], fog: [40, 240], clouds: 30, cloudTint: "#6a7486" },
  space:    { top: "#000004", mid: "#02040c", bottom: "#000004", sun: [20, 60], sunColor: "#ffffff", sunI: 2.45, hemi: ["#6a7aa0", "#101018", 0.21], fog: null, clouds: 0, stars: 4000, earth: true },
  moon:     { top: "#000004", mid: "#03050c", bottom: "#101014", sun: [18, 120], sunColor: "#fffaf0", sunI: 2.74, hemi: ["#5a6480", "#202024", 0.24], fog: null, clouds: 0, stars: 4000, earth: true },
};

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position,0.0)).xyz); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`;
const skyFrag = `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; uniform float sunDisc; uniform float haze;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir); float h = d.y;
  vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(mid, bottom, pow(clamp(-h*3.0,0.0,1.0), 0.6));
  float s = max(dot(d, sunDir), 0.0);
  c += sunColor * (smoothstep(0.9994, 0.9998, s) * sunDisc + pow(s, 16.0) * 0.35 + pow(s, 3.0) * 0.08 * haze);
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class World {
  constructor(engine, phys) {
    this.engine = engine; this.phys = phys;
    this.scene = new THREE.Scene();
    this.updaters = [];
    this.pads = [];        // bounce pads { x, y, z, r, power }
    this.zones = [];       // low-gravity bubbles { x, y, z, r, g }
    this.triggers = [];    // { x, y, z, r, fn, once }
    this.t = 0;
    this.q = engine.quality;
  }
  add(o, x = 0, y = 0, z = 0) { o.position.set(x, y, z); this.scene.add(o); return o; }
  // ------------------------------------------------------------ sky and light
  setSky(name) {
    const s = this.sky = typeof name === "string" ? SKIES[name] : name;
    const C = c => new THREE.Color(c);
    const el = s.sun[0] * Math.PI / 180, az = s.sun[1] * Math.PI / 180;
    this.sunDir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
    const mat = new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: C(s.top) }, mid: { value: C(s.mid) }, bottom: { value: C(s.bottom) }, sunDir: { value: this.sunDir }, sunColor: { value: C(s.sunColor).multiplyScalar(s.stars ? 0.6 : 1) }, sunDisc: { value: s.moon ? 0 : 30 }, haze: { value: s.stars ? 0.15 : 1 } } });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), mat);
    dome.renderOrder = -10; dome.frustumCulled = false;
    this.scene.add(dome); this.skyDome = dome;
    this.scene.background = C(s.mid);
    if (s.fog) this.scene.fog = new THREE.Fog(C(s.bottom).lerp(C(s.mid), 0.4), s.fog[0], s.fog[1]);
    const hemi = new THREE.HemisphereLight(C(s.hemi[0]), C(s.hemi[1]), s.hemi[2]);
    this.scene.add(hemi); this.hemi = hemi;
    const sun = this.sun = new THREE.DirectionalLight(C(s.sunColor), s.sunI);
    sun.castShadow = true;
    const size = this.q === 2 ? 2048 : 1024;
    sun.shadow.mapSize.set(size, size);
    const sc = sun.shadow.camera; sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 220;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    this.scene.add(sun); this.scene.add(sun.target);
    this.followShadow(new THREE.Vector3());
    if (s.stars) this.stars(s.stars);
    if (s.clouds) this.clouds(s.clouds, s.cloudTint);
    if (s.moon) { const m = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff6dc").multiplyScalar(3), fog: false })); m.position.copy(this.sunDir).multiplyScalar(1200); this.scene.add(m); }
    if (s.earth) this.earth();
  }
  followShadow(p) {
    this.sun.position.copy(p).addScaledVector(this.sunDir, 100);
    this.sun.target.position.copy(p);
  }
  stars(n) {
    const R = rng(77), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = R() * 2 - 1, a = R() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      pos[i * 3] = r * Math.cos(a) * 1400; pos[i * 3 + 1] = Math.abs(u) * 1400 * (this.sky.earth ? Math.sign(u) : 1); pos[i * 3 + 2] = r * Math.sin(a) * 1400;
      const b = 0.6 + R() ** 4 * 5, tint = R();
      col[i * 3] = b * (tint > 0.8 ? 0.8 : 1); col[i * 3 + 1] = b * 0.95; col[i * 3 + 2] = b * (tint < 0.2 ? 0.8 : 1.05);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, map: TEX.glow(), transparent: true, depthWrite: false, fog: false }));
    pts.frustumCulled = false; this.scene.add(pts);
  }
  clouds(n, tint) {
    const R = rng(31), m = new THREE.MeshStandardMaterial({ color: tint || 0xffffff, roughness: 1, emissive: new THREE.Color(tint || 0xffffff), emissiveIntensity: 0.25, fog: true });
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1, 2);
    for (let i = 0; i < n; i++) {
      const c = new THREE.Group(), a = R() * Math.PI * 2, d = 160 + R() * 260;
      c.position.set(Math.cos(a) * d, 70 + R() * 60, Math.sin(a) * d);
      const k = 8 + R() * 14;
      for (let j = 0; j < 6; j++) { const p = new THREE.Mesh(geo, m); p.position.set((j - 2.5) * k * 0.55 + R() * 4, R() * k * 0.3, R() * k * 0.4); p.scale.setScalar(k * (0.5 + R() * 0.5)); p.scale.y *= 0.6; c.add(p); }
      g.add(c);
    }
    this.scene.add(g);
    this.updaters.push(dt => { g.rotation.y += dt * 0.002; });
  }
  earth() {
    // the Earth hanging in the black sky, blue and white with a glowing rim
    const g = new THREE.Group();
    const e = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 32), new THREE.MeshStandardMaterial({ map: earthTex(), roughness: 0.8, emissive: 0x0a1a3a, emissiveIntensity: 0.4, fog: false }));
    g.add(e);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(126, 48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color("#5ab0ff").multiplyScalar(1.4), transparent: true, opacity: 0.25, side: THREE.BackSide, fog: false, depthWrite: false }));
    g.add(atm);
    g.position.set(-500, 380, -900); g.rotation.z = 0.4;
    this.scene.add(g);
    this.updaters.push(dt => { e.rotation.y += dt * 0.01; });
  }
  // ------------------------------------------------------------ ground and shapes
  ground(mat, size = 400, o = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), mat);
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
    this.add(m, o.x || 0, o.y || 0, o.z || 0);
    if (o.collide !== false) this.phys.fixedBox(o.x || 0, (o.y || 0) - 1, o.z || 0, size / 2, 1, size / 2);
    return m;
  }
  // rolling ground: f(x, z) gives the height; the collider is a Rapier heightfield of the same samples
  terrain(size, n, f, mat, o = {}) {
    const geo = new THREE.PlaneGeometry(size, size, n, n); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, heights = new Float32Array((n + 1) * (n + 1));
    for (let row = 0; row <= n; row++) for (let col = 0; col <= n; col++) {
      const k = row * (n + 1) + col, x = pos.getX(k), z = pos.getZ(k), h = f(x, z);
      pos.setY(k, h); heights[row + col * (n + 1)] = h;
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.castShadow = !!o.cast; this.scene.add(m);
    this.terrainCol = this.phys.world.createCollider(R.ColliderDesc.heightfield(n, n, heights, { x: size, y: 1, z: size }).setFriction(0.9));
    this.heightAt = f;
    return m;
  }
  mesh(geo, mat, x, y, z, o = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry;
    if (o.rx) m.rotation.x = o.rx;
    if (o.rz) m.rotation.z = o.rz;
    m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false;
    (o.parent || this.scene).add(m);
    return m;
  }
  box(w, h, d, mat, x, y, z, o = {}) {
    const m = this.mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, o);
    if (o.collide !== false && !o.parent) this.phys.fixedBox(x, y, z, w / 2, h / 2, d / 2, o.ry || 0, { rx: o.rx, rz: o.rz, restitution: o.bouncy });
    return m;
  }
  cyl(rt, rb, h, mat, x, y, z, o = {}) {
    const m = this.mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 24, 1, !!o.open), mat, x, y, z, o);
    if (o.collide !== false && !o.parent) this.phys.fixedCyl(x, y, z, Math.max(rt, rb), h / 2);
    return m;
  }
  sphere(r, mat, x, y, z, o = {}) {
    const m = this.mesh(new THREE.SphereGeometry(r, o.seg || 24, o.seg ? o.seg / 2 : 16), mat, x, y, z, o);
    if (o.collide && !o.parent) this.phys.fixedBall(x, y, z, r);
    return m;
  }
  cone(r, h, mat, x, y, z, o = {}) { return this.cyl(0.001, r, h, mat, x, y, z, { ...o, collide: o.collide ?? false }); }
  // a slope from (x, z) running along ry for len, rising h
  ramp(w, len, h, mat, x, y, z, ry = 0) {
    const a = Math.atan2(h, len), l = Math.hypot(h, len);
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; this.scene.add(g);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, l), mat);
    m.rotation.x = -a; m.position.set(0, h / 2, len / 2); m.castShadow = m.receiveShadow = true; g.add(m);
    g.updateMatrixWorld(true);
    const p = new THREE.Vector3(); m.getWorldPosition(p);
    const q = new THREE.Quaternion(); m.getWorldQuaternion(q);
    const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
    const c = this.phys.world.createCollider(R.ColliderDesc.cuboid(w / 2, 0.15, l / 2).setTranslation(p.x, p.y, p.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }));
    void e; void c;
    return g;
  }
  steps(n, w, rise, run, mat, x, y, z, ry = 0) {
    for (let i = 0; i < n; i++) {
      const dz = (i + 0.5) * run;
      this.box(w, rise * (i + 1), run, mat, x + Math.sin(ry) * dz, y + rise * (i + 1) / 2, z + Math.cos(ry) * dz, { ry });
    }
  }
  // a floating slab you can stand on; with fn(t) -> [x, y, z, ry] it moves
  platform(w, h, d, mat, x, y, z, fn) {
    const m = this.mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    if (fn) { m.userData.dynamic = true; this.phys.mover(m, w / 2, h / 2, d / 2, fn); } else this.phys.fixedBox(x, y, z, w / 2, h / 2, d / 2);
    return m;
  }
  // a glowing pad that throws Rory into the air
  pad(x, y, z, power = 16, color = 0x39f0ff) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.scene.add(g);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.25, 32), M(0x2a3040, { metal: 0.7, rough: 0.35 })); base.position.y = 0.12; base.castShadow = base.receiveShadow = true; g.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 10, 40), M(color, { emissive: color, ei: 1.1 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.27; g.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), M(color, { emissive: color, ei: 0.25, opacity: 0.45 })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.26; g.add(disc);
    this.phys.fixedCyl(x, y + 0.12, z, 1.2, 0.125);
    const p = { x, y: y + 0.25, z, r: 1.1, power, ring, t: 0 };
    this.pads.push(p);
    this.updaters.push(dt => { p.t = Math.max(0, p.t - dt); ring.scale.setScalar(1 + p.t * 0.8); ring.position.y = 0.27 + Math.sin(this.t * 4) * 0.03; });
    return p;
  }
  // a shimmering bubble where gravity is weak
  zone(x, y, z, r, g = 0.2) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 24), new THREE.MeshStandardMaterial({ color: 0x7fd8ff, emissive: 0x3aa8ff, emissiveIntensity: 0.4, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
    this.add(m, x, y, z);
    const zone = { x, y, z, r, g, m };
    this.zones.push(zone);
    this.updaters.push(() => { m.material.opacity = 0.1 + Math.sin(this.t * 2) * 0.03; m.rotation.y += 0.002; });
    return zone;
  }
  crate(x, y, z, s = 1, o = {}) {
    const m = this.mesh(new THREE.BoxGeometry(s, s, s), o.mat || M("wood", { args: [21, [170, 120, 70]] }), x, y, z);
    return { mesh: m, ...this.phys.dynamicBox(m, s / 2, s / 2, s / 2, o) };
  }
  ball(x, y, z, r, mat, o = {}) {
    const m = this.mesh(new THREE.SphereGeometry(r, 24, 16), mat, x, y, z);
    return { mesh: m, ...this.phys.dynamicBall(m, r, o) };
  }
  trigger(x, y, z, r, fn, once = true) { const t = { x, y, z, r, fn, once, done: false }; this.triggers.push(t); return t; }
  // ------------------------------------------------------------ decoration
  tree(x, z, h = 6, o = {}) {
    const g = new THREE.Group(); g.position.set(x, o.y || 0, z); this.scene.add(g);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.04, h * 0.06, h * 0.5, 8), M(0x6a4a30, { rough: 0.9 })); trunk.position.y = h * 0.25; trunk.castShadow = true; g.add(trunk);
    const leaf = M(o.color ?? 0x3f8a3a, { rough: 0.8 });
    const R = rng(Math.floor(x * 13 + z * 7) + 5);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(h * (0.2 + R() * 0.08), 1), leaf); b.position.set((R() - 0.5) * h * 0.3, h * (0.55 + R() * 0.3), (R() - 0.5) * h * 0.3); b.castShadow = true; g.add(b); }
    if (o.collide !== false) this.phys.fixedCyl(x, (o.y || 0) + h * 0.25, z, h * 0.06, h * 0.25);
    return g;
  }
  pine(x, z, h = 8, o = {}) {
    const g = new THREE.Group(); g.position.set(x, o.y || 0, z); this.scene.add(g);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.03, h * 0.05, h * 0.3, 8), M(0x5a3a24)); trunk.position.y = h * 0.15; trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * (0.3 - i * 0.07), h * 0.42, 10), M(o.snow ? 0xe8f0f8 : 0x2a5a34, { rough: 0.85 })); c.position.y = h * (0.35 + i * 0.2); c.castShadow = true; g.add(c); }
    if (o.collide !== false) this.phys.fixedCyl(x, (o.y || 0) + h * 0.2, z, h * 0.06, h * 0.2);
    return g;
  }
  palm(x, z, h = 7) {
    const g = new THREE.Group(); g.position.set(x, 0, z); this.scene.add(g);
    const bark = M(0x8a6a44, { rough: 0.95 });
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16 - i * 0.008, 0.2 - i * 0.008, h / 8, 8), bark); s.position.set(Math.sin(i * 0.2) * i * 0.08, h / 16 + i * h / 8, 0); s.castShadow = true; g.add(s); }
    const leaf = M(0x3a9a3a, { rough: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6, 1, 4), leaf); const pos = l.geometry.attributes.position; for (let k = 0; k < pos.count; k++) pos.setZ(k, -Math.pow((pos.getY(k) + 1.8) / 3.6, 2) * 1.2); l.geometry.computeVertexNormals(); l.position.set(0.6, h, 0); l.rotation.set(-1.1, i / 7 * Math.PI * 2, 0, "YXZ"); l.translateY(1.6); l.castShadow = true; g.add(l); }
    this.phys.fixedCyl(x, h / 2, z, 0.25, h / 2);
    return g;
  }
  lamp(x, z, h = 4.2, color = 0xffe0a0, o = {}) {
    const post = M(o.post ?? 0x1e2228, { metal: 0.6, rough: 0.4 });
    this.cyl(0.07, 0.1, h, post, x, h / 2, z, { seg: 10 });
    const bulb = this.mesh(new THREE.SphereGeometry(0.22, 16, 10), M(color, { emissive: color, ei: o.ei ?? 4 }), x, h + 0.1, z, { cast: false });
    if (o.light) { const l = new THREE.PointLight(color, o.light, 14, 1.6); l.position.set(x, h, z); this.scene.add(l); }
    return bulb;
  }
  bench(x, z, ry = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.scene.add(g);
    const w = M("wood", { args: [31, [150, 96, 54]] }), f = M(0x1e2228, { metal: 0.6 });
    for (const [y, zz, rx] of [[0.45, 0, 0], [0.8, -0.25, 0.25]]) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.45), w); s.position.set(0, y, zz); s.rotation.x = rx; s.castShadow = true; g.add(s); }
    for (const sx of [-0.8, 0.8]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.45), f); l.position.set(sx, 0.22, 0); g.add(l); }
    this.phys.fixedBox(x, 0.3, z, 0.9 * Math.abs(Math.cos(ry)) + 0.25 * Math.abs(Math.sin(ry)), 0.3, 0.25 * Math.abs(Math.cos(ry)) + 0.9 * Math.abs(Math.sin(ry)));
    return g;
  }
  fence(x0, z0, x1, z1, h = 1, mat) {
    const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2));
    const m = mat || M(0x2a2e34, { metal: 0.5, rough: 0.5 });
    for (let i = 0; i <= n; i++) this.mesh(new THREE.BoxGeometry(0.08, h, 0.08), m, x0 + (x1 - x0) * i / n, h / 2, z0 + (z1 - z0) * i / n);
    this.box(0.05, 0.06, len, m, (x0 + x1) / 2, h * 0.9, (z0 + z1) / 2, { ry, collide: false });
    this.phys.fixedBox((x0 + x1) / 2, h / 2, (z0 + z1) / 2, 0.08, h / 2, len / 2, ry);
  }
  sign(text, w, h, x, y, z, ry = 0, o = {}) {
    const t = TEX.sign(text, { bg: o.bg, fg: o.fg, border: o.border, w: 512, h: Math.round(512 * h / w) });
    const m = this.mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, emissive: o.glow ? 0xffffff : 0, emissiveMap: o.glow ? t : null, emissiveIntensity: o.glow || 0, roughness: 0.6 }), x, y, z, { ry, cast: false });
    return m;
  }
  // a building with a textured front on all four sides and a roof
  building(w, h, d, x, z, o = {}) {
    const fac = M("facade", { args: [o.seed || 1, o.wall || [220, 210, 190], Math.max(2, Math.round(w / 3)), Math.max(2, Math.round(h / 3.2)), o.win || {}], repeat: [1, 1], ei: o.ei ?? (this.sky && this.sky.stars ? 1.4 : 0.25) });
    const m = this.box(w, h, d, fac, x, h / 2 + (o.y || 0), z, { ry: o.ry || 0 });
    if (o.roof === "pitched") { const r = this.mesh(new THREE.CylinderGeometry(0.01, Math.max(w, d) * 0.72, h * 0.3, 4), M("roof", { args: [o.seed || 1, o.roofColor || [170, 80, 60]], repeat: [3, 2] }), x, h + h * 0.15 + (o.y || 0), z, { ry: (o.ry || 0) + Math.PI / 4 }); r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); }
    else if (o.roof !== "none") this.mesh(new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4), M(o.trim ?? 0x8a8478), x, h + 0.2 + (o.y || 0), z, { ry: o.ry || 0 });
    return m;
  }
  // distant scenery: mountains around the edge (no colliders)
  mountains(n, dist, h, o = {}) {
    const R = rng(o.seed || 9);
    const rock = M(o.color ?? 0x6a7078, { rough: 1, flat: true }), snow = M(0xf4f8fc, { rough: 0.9, flat: true });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.3, d = dist + R() * dist * 0.4, hh = h * (0.6 + R() * 0.7), r = hh * (0.9 + R() * 0.5);
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 7, 3), rock); m.position.set(Math.cos(a) * d, hh / 2 - 2, Math.sin(a) * d); m.rotation.y = R() * 3; this.scene.add(m);
      if (o.snow !== false) { const s = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, hh * 0.35, 7, 1), snow); s.position.set(m.position.x, hh - hh * 0.175 - 2 + 0.2, m.position.z); s.rotation.y = m.rotation.y; this.scene.add(s); }
    }
  }
  water(w, d, x, y, z, color = 0x1a6aa0, o = {}) {
    const geo = new THREE.PlaneGeometry(w, d, Math.min(80, Math.round(w / 4)), Math.min(80, Math.round(d / 4)));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.08, metalness: 0.2, transparent: true, opacity: o.opacity ?? 0.88 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.userData.dynamic = true; this.scene.add(m);
    const pos = geo.attributes.position, base = Float32Array.from(pos.array);
    let tick = 0;
    this.updaters.push(dt => {
      if ((tick = (tick + 1) % 2)) return;
      for (let i = 0; i < pos.count; i++) { const px = base[i * 3], py = base[i * 3 + 1]; pos.setZ(i, Math.sin(px * 0.25 + this.t * 1.4) * 0.12 + Math.cos(py * 0.3 + this.t * 1.1) * 0.1); }
      pos.needsUpdate = true; geo.computeVertexNormals();
    });
    return m;
  }
  update(dt) { this.t += dt; for (const u of this.updaters) u(dt, this.t); }
  // merge every static mesh that shares a material into one, so a level is a
  // few dozen draw calls instead of hundreds (road lines, stripes, crates...)
  bake() {
    const groups = new Map();
    for (const o of [...this.scene.children]) {
      if (!o.isMesh || o.userData.dynamic || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.material.transparent || !o.geometry.attributes.uv || !o.geometry.attributes.normal) continue;
      if (o.geometry.attributes.position.count > 20000) continue;
      const key = o.material.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : "");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(o);
    }
    let merged = 0;
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const geos = list.map(o => { o.updateMatrixWorld(true); const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k); g.clearGroups(); return g; });
      const geo = mergeGeometries(geos, false);
      if (!geo) continue;
      const m = new THREE.Mesh(geo, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow;
      this.scene.add(m);
      for (const o of list) { this.scene.remove(o); }
      for (const g of geos) g.dispose();
      merged += list.length;
    }
    return merged;
  }
}

// a little painted Earth for the space sky
let _earth = null;
function earthTex() {
  if (_earth) return _earth;
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#1a4a9a"; g.fillRect(0, 0, 512, 256);
  const R = rng(3);
  g.fillStyle = "#3a8a4a";
  for (let i = 0; i < 26; i++) { const x = R() * 512, y = 40 + R() * 176, r = 10 + R() * 40; g.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, rr = r * (0.6 + R() * 0.6); g.lineTo(x + Math.cos(a) * rr * 1.4, y + Math.sin(a) * rr * 0.8); } g.fill(); }
  g.fillStyle = "#f0f4f8"; g.fillRect(0, 0, 512, 16); g.fillRect(0, 240, 512, 16);
  g.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 60; i++) { g.beginPath(); g.ellipse(R() * 512, R() * 256, 10 + R() * 30, 3 + R() * 6, R(), 0, 7); g.fill(); }
  _earth = new THREE.CanvasTexture(c); _earth.colorSpace = THREE.SRGBColorSpace;
  return _earth;
}
