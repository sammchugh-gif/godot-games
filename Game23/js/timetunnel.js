// Between eras: the time-sled flies down a glowing tunnel of time while the year counts from one
// era to the next. Same little API as the globe it replaces: play(from, to, allPlaces, cb) and
// update(dt), with its own scene and camera handed to the engine while it runs.
import * as THREE from "three";
import { makePerson, animatePerson, RORY } from "./people.js";
import { Pebble } from "./pebble.js";

// a year as the game writes it: 66 MILLION BC, 20,000 BC, AD 20, 1903
export function yearText(y) {
  const a = Math.abs(Math.round(y));
  if (y <= -1e6) return `${Math.round(a / 1e6)} MILLION BC`;
  if (y < 0) return `${a.toLocaleString("en-GB")} BC`;
  if (y < 1000) return `AD ${a}`;
  return String(a);
}
function swirlTexture() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#12062a"; g.fillRect(0, 0, 512, 256);
  // bands that run round and along the tube, in the game's gold, violet and cyan
  const cols = ["#6a2ad8", "#ffd166", "#2ad0e8", "#c84ae8", "#ffb040"];
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = cols[i % cols.length]; g.globalAlpha = 0.25 + (i % 3) * 0.2; g.lineWidth = 6 + (i % 4) * 5;
    g.beginPath(); const y0 = (i * 37) % 256;
    for (let x = 0; x <= 512; x += 8) g.lineTo(x, y0 + Math.sin(x / 512 * Math.PI * 4 + i) * 24 + x * 0.25);
    g.stroke();
  }
  // specks of light
  g.globalAlpha = 1;
  for (let i = 0; i < 220; i++) { g.fillStyle = Math.random() < 0.5 ? "#ffffff" : "#ffe9a8"; g.fillRect(Math.random() * 512, Math.random() * 256, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 8); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function clockFace() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(255,240,200,.9)"; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
  g.strokeStyle = "#8a5a1a"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "#2a1a0a"; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(64 + Math.sin(a) * 46 - 3, 64 - Math.cos(a) * 46 - 3, 6, 6); }
  g.strokeStyle = "#2a1a0a"; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 26); g.moveTo(64, 64); g.lineTo(90, 70); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Travel {
  constructor(engine) { this.engine = engine; this.built = false; }
  build() {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color(0x05020c);
    this.camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.05, 300);
    // the tunnel: a long tube seen from inside, its swirl scrolling past
    this.tex = swirlTexture();
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 240, 48, 1, true), new THREE.MeshBasicMaterial({ map: this.tex, side: THREE.BackSide, color: new THREE.Color(1.6, 1.4, 1.8) }));
    tube.rotation.x = Math.PI / 2; s.add(tube);
    // the far end glows white
    const end = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.4) }));
    end.position.z = -118; s.add(end);
    // clock faces and hourglasses drifting past
    const face = new THREE.SpriteMaterial({ map: clockFace(), transparent: true, depthWrite: false });
    this.bits = [];
    for (let i = 0; i < 26; i++) {
      const sp = new THREE.Sprite(face); const k = 0.5 + Math.random() * 1.1; sp.scale.set(k, k, 1);
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 2.8;
      sp.position.set(Math.cos(a) * r, Math.sin(a) * r, -Math.random() * 110); s.add(sp); this.bits.push(sp);
    }
    const glass = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2, 1.2), transparent: true, opacity: 0.8 });
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 12), glass); top.rotation.x = Math.PI; top.position.y = 0.23; g.add(top);
      const bot = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 12), glass); bot.position.y = -0.23; g.add(bot);
      const a = Math.random() * Math.PI * 2, r = 1.8 + Math.random() * 2.4;
      g.position.set(Math.cos(a) * r, Math.sin(a) * r, -Math.random() * 110); g.userData.spin = 0.5 + Math.random() * 2; s.add(g); this.bits.push(g);
    }
    // the time-sled: a long white pod on brass runners, the gold dial on its back, Rory in the
    // front seat and Pebble behind him (the real Pebble, at the size she is now)
    const sled = this.sled = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f5fa, roughness: 0.3, metalness: 0.5 }), brass = new THREE.MeshStandardMaterial({ color: 0xd8a848, roughness: 0.3, metalness: 0.9 });
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.3, 6, 14), white); hull.rotation.x = Math.PI / 2; hull.scale.set(1.3, 1, 0.42); sled.add(hull);
    for (const sx of [-1, 1]) { const c = new THREE.CatmullRomCurve3([[sx * 0.48, -0.21, -1.0], [sx * 0.48, -0.24, 0], [sx * 0.48, -0.21, 0.8], [sx * 0.48, -0.02, 1.12], [sx * 0.48, 0.12, 1.05]].map(p => new THREE.Vector3(...p))); sled.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.03, 6), brass)); }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.5, 3) })); rim.rotation.x = Math.PI / 2; rim.scale.set(1.05, 2.3, 1); rim.position.y = -0.26; sled.add(rim);
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshBasicMaterial({ map: clockFace(), transparent: true })); dial.position.set(0, 0.2, -0.78); dial.rotation.set(-1.0, Math.PI, 0, "YXZ"); sled.add(dial);
    const dialRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 24), brass); dialRing.position.copy(dial.position); dialRing.rotation.copy(dial.rotation); sled.add(dialRing);
    const rory = this.rory = makePerson(RORY); rory.root.scale.setScalar(0.5); rory.root.position.set(0, 0.08, 0.2); sled.add(rory.root);
    this.pebble = new Pebble(1); this.pebble.root.position.set(0, 0.08, -0.4); sled.add(this.pebble.root);
    s.add(sled);
    s.add(new THREE.AmbientLight(0xc8b8ff, 1.2)); const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 4, 3); s.add(key);
    // the year, counting between eras
    this.label = document.createElement("div");
    this.label.style.cssText = "position:fixed;left:0;right:0;bottom:12%;text-align:center;font-weight:900;font-size:clamp(28px,6vw,64px);letter-spacing:.08em;color:#ffe9a8;text-shadow:0 0 18px #a060ff,0 2px 0 #000;pointer-events:none;display:none;font-family:system-ui,sans-serif";
    document.body.appendChild(this.label);
    this.built = true;
  }
  play(from, to, allPlaces, cb) {
    if (!this.built) this.build();
    this.y0 = from.year ?? 0; this.y1 = to.year ?? 0;
    // (Pebble rides at the size she is now, scaled down to the sled's size)
    this.pebble.grow((from.pebble || 1) * 0.5, true); this.pebble.play("Sitting");
    this.t = 0; this.dur = 4.8; this.cb = cb;
    this.label.style.display = "block";
    this.engine.setScene(this.scene, this.camera);
    this.update(0);
  }
  update(dt) {
    this.t += dt;
    const f = Math.min(1, this.t / this.dur), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    // faster in the middle of the trip
    const speed = 12 + Math.sin(f * Math.PI) * 60;
    this.tex.offset.y += dt * speed * 0.02; this.tex.offset.x += dt * 0.15;
    for (const b of this.bits) { b.position.z += dt * speed; if (b.position.z > 6) b.position.z -= 116; if (b.userData.spin) { b.rotation.z += dt * b.userData.spin; b.rotation.x += dt * b.userData.spin * 0.5; } }
    animatePerson(this.rory, { dt, speed: 0, grounded: true, sit: true }); this.pebble.update(dt);
    // the sled wobbles along, the camera just behind it
    const s = this.sled; s.position.set(Math.sin(this.t * 1.7) * 0.5, -1.2 + Math.sin(this.t * 2.3) * 0.25, -4);
    s.rotation.set(0, Math.PI, Math.sin(this.t * 1.7) * 0.25);
    this.camera.position.set(Math.sin(this.t * 1.7) * 0.25, 0.45, 0); this.camera.lookAt(0, -0.8, -12);
    this.camera.fov = 62 + Math.sin(f * Math.PI) * 18; this.camera.updateProjectionMatrix();
    // the year: logarithmic across the huge gaps, so it doesn't sit at millions for the whole trip
    const lg = y => Math.sign(y) * Math.log10(1 + Math.abs(y));
    const inv = v => Math.sign(v) * (Math.pow(10, Math.abs(v)) - 1);
    const y = f >= 1 ? this.y1 : inv(lg(this.y0) + (lg(this.y1) - lg(this.y0)) * e);
    this.label.textContent = yearText(y);
    if (this.t >= this.dur + 0.6 && this.cb) { const cb = this.cb; this.cb = null; this.label.style.display = "none"; cb(); }
  }
}
