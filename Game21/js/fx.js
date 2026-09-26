// Particles and little effects: sparkle bursts, dust puffs, trails and
// rings, all additive and bright so the bloom makes them glow.
import * as THREE from "three";
import { TEX } from "./tex.js";

const MAX = 1500;
export class FX {
  constructor(scene) {
    this.scene = scene;
    const g = this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3); this.col = new Float32Array(MAX * 3); this.size = new Float32Array(MAX);
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(this.size, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: TEX.glow() }, scale: { value: 400 } },
      vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; uniform float scale;
        void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.a, t.a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
    this.p = []; // live particles
    this.rings = [];
  }
  burst(x, y, z, color = 0x7fe3ff, n = 24, o = {}) {
    const c = new THREE.Color(color).multiplyScalar(o.bright ?? 3);
    for (let i = 0; i < n && this.p.length < MAX; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = (o.speed ?? 4) * (0.4 + Math.random() * 0.8);
      this.p.push({ x, y, z, vx: r * Math.cos(a) * sp, vy: u * sp + (o.up ?? 1.5), vz: r * Math.sin(a) * sp, life: (o.life ?? 0.7) * (0.6 + Math.random() * 0.6), age: 0, size: (o.size ?? 0.35) * (0.6 + Math.random() * 0.7), c, g: o.gravity ?? -6, drag: o.drag ?? 1.5 });
    }
  }
  puff(x, y, z, color = 0xc8c0b0, n = 10) { this.burst(x, y, z, color, n, { bright: 0.5, speed: 1.6, up: 0.6, life: 0.6, size: 0.5, gravity: 0.5, drag: 3 }); }
  trail(x, y, z, color, size = 0.25) { if (this.p.length < MAX) this.p.push({ x, y, z, vx: 0, vy: 0.2, vz: 0, life: 0.35, age: 0, size, c: new THREE.Color(color).multiplyScalar(2.5), g: 0, drag: 0 }); }
  ring(x, y, z, color = 0x7fe3ff, r = 2) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.position.set(x, y, z); this.scene.add(m);
    this.rings.push({ m, t: 0, r });
  }
  update(dt) {
    let n = 0;
    for (let i = this.p.length - 1; i >= 0; i--) {
      const q = this.p[i]; q.age += dt;
      if (q.age >= q.life) { this.p.splice(i, 1); continue; }
      q.vy += q.g * dt; const d = Math.exp(-q.drag * dt); q.vx *= d; q.vy *= d; q.vz *= d;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    }
    for (const q of this.p) {
      const k = 1 - q.age / q.life;
      this.pos[n * 3] = q.x; this.pos[n * 3 + 1] = q.y; this.pos[n * 3 + 2] = q.z;
      this.col[n * 3] = q.c.r * k; this.col[n * 3 + 1] = q.c.g * k; this.col[n * 3 + 2] = q.c.b * k;
      this.size[n] = q.size * (0.5 + k * 0.5);
      n++;
    }
    this.geo.setDrawRange(0, n);
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true; this.geo.attributes.size.needsUpdate = true;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]; r.t += dt * 2.2;
      const s = 0.3 + r.t * r.r; r.m.scale.set(s, s, s); r.m.material.opacity = Math.max(0, 1 - r.t);
      if (r.t >= 1) { this.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); this.rings.splice(i, 1); }
    }
  }
}
