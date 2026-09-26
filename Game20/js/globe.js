// The flight between places: a glowing 3D Earth with real coastlines, a
// bright trail arcing from where Rory was to where he's going, and his jet.
import * as THREE from "three";
import { landRings } from "./land.js";

const toV = (lat, lon, r = 1) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r); };

function earthTexture() {
  const W = 2048, H = 1024, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, "#123a6a"); sea.addColorStop(0.5, "#1a5a9a"); sea.addColorStop(1, "#123a6a");
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
  const P = ([lon, lat]) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  const rings = landRings();
  // shallow-water glow round the coasts
  g.strokeStyle = "rgba(90,200,230,.35)"; g.lineWidth = 10; g.lineJoin = "round";
  for (const r of rings) { g.beginPath(); r.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke(); }
  // land, greener near the equator, sandier in the dry belts, white at the poles
  const land = g.createLinearGradient(0, 0, 0, H);
  land.addColorStop(0, "#f4f8fc"); land.addColorStop(0.1, "#e8eef4"); land.addColorStop(0.18, "#4a7a3a"); land.addColorStop(0.32, "#6a8a3a"); land.addColorStop(0.4, "#c8a860"); land.addColorStop(0.5, "#3a8a3a"); land.addColorStop(0.6, "#c8a860"); land.addColorStop(0.7, "#5a8a3a"); land.addColorStop(0.86, "#e8eef4"); land.addColorStop(1, "#ffffff");
  g.fillStyle = land;
  for (const r of rings) { g.beginPath(); r.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); }
  g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1.5;
  for (const r of rings) { g.beginPath(); r.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function cloudTexture() {
  const W = 1024, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  let s = 7; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 340; i++) { const x = R() * W, y = H * 0.1 + R() * H * 0.8, r = 8 + R() * 38; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 2.2, r * 0.8, 0, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Travel {
  constructor(engine) { this.engine = engine; this.built = false; }
  build() {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color(0x02040c);
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.01, 100);
    const earth = this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.75, metalness: 0.0 }));
    s.add(earth);
    const clouds = this.clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 48), new THREE.MeshStandardMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, roughness: 1 }));
    s.add(clouds);
    // atmosphere: a rim that glows blue
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 48), new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(vec3(0.35,0.7,1.6) * f * 2.2, f); }`,
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.add(atm);
    const sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(3, 1.5, 4); s.add(sun);
    s.add(new THREE.AmbientLight(0x6a80b0, 0.45));
    // stars
    const n = 2500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20); pos.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    s.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.6, 1.8), size: 1.5, sizeAttenuation: false })));
    // the jet
    const jet = this.jet = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.04, 4, 8), new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.3, metalness: 0.4 })); body.rotation.x = Math.PI / 2; jet.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.002, 0.014), new THREE.MeshStandardMaterial({ color: 0x3a8ad8 })); jet.add(wing);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(4) })); glow.position.z = -0.03; jet.add(glow);
    s.add(jet);
    this.pinGeo = new THREE.SphereGeometry(0.012, 12, 8);
    this.built = true;
  }
  pin(lat, lon, color) {
    const m = new THREE.Mesh(this.pinGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3) }));
    m.position.copy(toV(lat, lon, 1.005)); this.earth.add(m); this.pins.push(m);
    return m;
  }
  // fly from one place to another; cb when done
  play(from, to, allPlaces, cb) {
    if (!this.built) this.build();
    if (this.trail) { this.trail.parent && this.trail.parent.remove(this.trail); this.trail.geometry.dispose(); }
    for (const p of this.pins || []) this.earth.remove(p);
    this.pins = [];
    for (const p of allPlaces) if (p.lat !== undefined && !p.orbit && !p.moon) this.pin(p.lat, p.lon, p === to ? 0xffd166 : p === from ? 0x7fe3ff : 0x5a6a8a);
    const a = toV(from.lat, from.lon), b = toV(to.lat, to.lon);
    const pts = [];
    if (!this.moon) { this.moon = new THREE.Mesh(new THREE.SphereGeometry(0.27, 48, 32), new THREE.MeshStandardMaterial({ color: 0xc8c8cc, roughness: 1 })); this.scene.add(this.moon); }
    this.moon.position.set(3.2, 0.9, -2.2); this.moon.visible = !!(to.moon || from.moon || to.orbit || from.orbit);
    if (to.moon) {
      // from orbit out to the Moon
      const s0 = (from.orbit ? toV(from.lat, from.lon, 1.35) : a.clone().multiplyScalar(1.02));
      const m = this.moon.position.clone().add(new THREE.Vector3(-0.3, 0, 0.1));
      for (let i = 0; i <= 64; i++) { const f = i / 64; const p = s0.clone().lerp(m, f); p.add(new THREE.Vector3(0, Math.sin(f * Math.PI) * 0.6, 0)); pts.push(p); }
      b.copy(m).normalize();
    } else if (to.orbit) {
      // straight up from the launch pad, then round into orbit
      for (let i = 0; i <= 64; i++) { const f = i / 64; const up = 1.01 + Math.min(1, f * 1.6) * 0.34; const v = a.clone().lerp(b, Math.max(0, f - 0.3) / 0.7).normalize(); pts.push(v.multiplyScalar(up)); }
    } else for (let i = 0; i <= 64; i++) { const f = i / 64; const v = a.clone().lerp(b, f).normalize(); const lift = 1.01 + Math.sin(f * Math.PI) * 0.18 * a.angleTo(b); pts.push(v.multiplyScalar(lift)); }
    this.curve = new THREE.CatmullRomCurve3(pts);
    this.trail = new THREE.Mesh(new THREE.TubeGeometry(this.curve, 96, 0.004, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd166).multiplyScalar(3) }));
    this.trail.geometry.setDrawRange(0, 0);
    (to.moon ? this.scene : this.earth).add(this.trail);
    (to.moon ? this.scene : this.earth).add(this.jet);
    this.t = 0; this.dur = 4.8; this.cb = cb; this.from = a; this.to = b;
    this.engine.setScene(this.scene, this.camera);
    this.update(0);
  }
  update(dt) {
    this.t += dt;
    const f = Math.min(1, this.t / this.dur), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    const fly = Math.min(1, Math.max(0, (f - 0.12) / 0.76));
    // the camera swings round from above the start to above the destination
    const look = this.from.clone().lerp(this.to, e).normalize();
    const dist = (this.moon && this.moon.visible ? 4.6 : 3.1) - Math.sin(f * Math.PI) * 0.5;
    this.camera.position.copy(look.clone().multiplyScalar(dist).add(new THREE.Vector3(0, 0.35, 0)));
    this.camera.lookAt(look.clone().multiplyScalar(0.2));
    this.clouds.rotation.y += dt * 0.01;
    const idx = this.trail.geometry.index ? this.trail.geometry.index.count : 0;
    this.trail.geometry.setDrawRange(0, Math.floor(idx * fly));
    const p = this.curve.getPointAt(fly), tg = this.curve.getTangentAt(fly);
    this.jet.position.copy(p); this.jet.lookAt(p.clone().add(tg)); this.jet.up.copy(p).normalize();
    this.jet.visible = fly > 0 && fly < 1;
    if (this.t >= this.dur + 0.6 && this.cb) { const cb = this.cb; this.cb = null; cb(); }
  }
}
