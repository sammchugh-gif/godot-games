// The sea: a wave surface that looks right from above and from below, and what
// it is like under it. Sunlight fades with depth (red first, then green, so the
// deep goes blue and then black), caustics dance on everything the light still
// reaches, shafts of light hang down from the surface, specks drift in the fog.
// sea.height(x, z) is the same waves in JavaScript, for swimming and boats.
import * as THREE from "three";

// ------------------------------------------------------------ light under water, for every lit material
// (one set of uniforms shared by every shader; a level without a sea turns it off)
export const SEA = {
  uSea: { value: new THREE.Vector4(0, 0, 0, 1) },       // on, surface height, time, caustic strength
  uSeaAbs: { value: new THREE.Vector3(0.1, 0.04, 0.028) }, // how fast red, green and blue fade per metre
  uSeaSun: { value: new THREE.Color(1, 1, 1) },
  uPing: { value: new THREE.Vector4(0, -1e4, 0, 0) },       // TORPEDO's sonar: where it pinged, and how far the ring has spread
  uPingI: { value: 0 },
};
let installed = false;
export function installSeaLight() {
  if (installed) return; installed = true;
  const C = THREE.ShaderChunk;
  C.common += `
uniform vec4 uSea; uniform vec3 uSeaAbs; uniform vec3 uSeaSun; uniform vec4 uPing; uniform float uPingI;
varying vec3 vSeaW;
float seaCaustic(vec2 p, float t) {
  mat3 m = mat3(-2.0, -1.0, 2.0, 3.0, -2.0, 1.0, 1.0, 2.0, 2.0);
  vec3 k = vec3(p, t);
  k = m * k * 0.5; float c = length(0.5 - fract(k));
  k = m * k * 0.4; c = min(c, length(0.5 - fract(k)));
  k = m * k * 0.3; c = min(c, length(0.5 - fract(k)));
  return min(pow(c, 7.0) * 25.0, 2.0);
}`;
  C.project_vertex += `
  { vec4 sw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    sw = instanceMatrix * sw;
  #endif
    vSeaW = (modelMatrix * sw).xyz; }`;
  C.lights_fragment_end += `
  if (uPingI > 0.001) {
    float pr = length(vSeaW - uPing.xyz), pd = abs(pr - uPing.w);
    reflectedLight.indirectDiffuse += vec3(0.3, 0.9, 1.0) * (exp(-pd * pd * 1.2) * 1.8 + step(pr, uPing.w) * 0.12) * uPingI;
  }
  if (uSea.x > 0.5) {
    float dep = uSea.y - vSeaW.y;
    if (dep > 0.0) {
      vec3 ab = exp(-dep * uSeaAbs);
      reflectedLight.directDiffuse *= ab; reflectedLight.directSpecular *= ab;
      reflectedLight.indirectDiffuse *= mix(vec3(1.0), ab, 0.75); reflectedLight.indirectSpecular *= ab;
      vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      float facing = clamp(dot(normal, upV) * 0.8 + 0.2, 0.0, 1.0);
      float cz = seaCaustic(vSeaW.xz * 0.55, uSea.z * 0.6);
      reflectedLight.directDiffuse += diffuseColor.rgb * uSeaSun * cz * facing * ab * smoothstep(0.0, 0.8, dep) * uSea.w * 0.55;
    }
  }`;
  const hook = function (shader) { Object.assign(shader.uniforms, SEA); };
  for (const M of [THREE.MeshStandardMaterial, THREE.MeshLambertMaterial, THREE.MeshPhongMaterial]) M.prototype.onBeforeCompile = hook;
}

// ------------------------------------------------------------ the waves
// each wave: direction (x, z), height, wavelength, speed
const CALM = [[1, 0.3, 0.16, 23, 1.2], [-0.4, 1, 0.11, 13, 1.0], [0.7, -0.8, 0.06, 7.1, 0.9], [-0.9, -0.3, 0.035, 4.3, 0.8]];
const waveGLSL = n => `
uniform vec4 uW[${n}]; uniform float uWS[${n}]; uniform float uT;
vec3 seaWave(vec2 p, out vec3 nrm) {
  float h = 0.0; vec2 d = vec2(0.0);
  for (int i = 0; i < ${n}; i++) {
    vec2 dir = normalize(uW[i].xy); float k = 6.2831853 / uW[i].w, a = uW[i].z;
    float ph = k * dot(dir, p) + uWS[i] * k * uT;
    h += a * sin(ph); d += a * k * cos(ph) * dir;
  }
  nrm = normalize(vec3(-d.x, 1.0, -d.y));
  return vec3(p.x, h, p.y);
}`;

const surfVert = n => `${waveGLSL(n)}
uniform float uLevel;
varying vec3 vW; varying vec3 vN;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 nrm; vec3 w = seaWave(wp.xz, nrm);
  wp.y = uLevel + w.y; vW = wp.xyz; vN = nrm;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const surfFrag = `
uniform float uT; uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uSkyTop; uniform vec3 uSkyMid; uniform vec3 uSunDir; uniform vec3 uSunCol;
uniform vec3 uUnder; uniform sampler2D uDepth; uniform vec4 uDepthBox; uniform float uFoam; uniform float uClear;
varying vec3 vW; varying vec3 vN;
#include <fog_pars_fragment>
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
// small ripples on top of the big waves: the slope of two drifting noise layers
vec2 ripple(vec2 p) {
  float e = 0.15;
  vec2 a = p * 0.9 + vec2(uT * 0.35, uT * 0.2), b = p * 2.1 - vec2(uT * 0.25, -uT * 0.4);
  float h0 = vnoise(a) + 0.5 * vnoise(b);
  float hx = vnoise(a + vec2(e, 0)) + 0.5 * vnoise(b + vec2(e * 2.33, 0));
  float hz = vnoise(a + vec2(0, e)) + 0.5 * vnoise(b + vec2(0, e * 2.33));
  return vec2(hx - h0, hz - h0) / e;
}
void main() {
  vec2 r = ripple(vW.xz);
  vec3 N = normalize(vN + vec3(-r.x, 0.0, -r.y) * 0.09);
  vec3 V = normalize(cameraPosition - vW);
  // how deep the water is here (baked from the level)
  vec2 duv = (vW.xz - uDepthBox.xy) / uDepthBox.zw + 0.5;
  float depth = (duv.x > 0.0 && duv.x < 1.0 && duv.y > 0.0 && duv.y < 1.0) ? texture2D(uDepth, duv).r * 16.0 : 16.0;
  vec3 col; float alpha = 1.0;
  if (gl_FrontFacing) {
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 R = reflect(-V, N);
    vec3 sky = mix(uSkyMid, uSkyTop, pow(clamp(R.y, 0.0, 1.0), 0.6));
    float d = clamp(depth / 7.0, 0.0, 1.0);
    vec3 body = mix(uShallow, uDeep, d) * (0.55 + 0.45 * max(dot(N, uSunDir), 0.0));
    col = mix(body, sky, fres);
    col += uSunCol * pow(max(dot(R, uSunDir), 0.0), 350.0) * 6.0 + uSunCol * pow(max(dot(R, uSunDir), 0.0), 40.0) * 0.25;
    // foam along the shore and round anything standing in the water
    float f = smoothstep(0.9, 0.0, depth) * (0.55 + 0.45 * sin(depth * 9.0 - uT * 2.2 + vnoise(vW.xz * 0.6) * 4.0));
    f = max(f, smoothstep(0.35, 0.0, depth));
    f *= smoothstep(0.35, 0.65, vnoise(vW.xz * 1.7 + uT * 0.3)) * 0.6 + 0.4;
    col = mix(col, vec3(0.92, 0.97, 1.0) * (0.6 + 0.4 * max(uSunDir.y, 0.2)) * 1.25, clamp(f * uFoam, 0.0, 1.0));
    // see the sand through shallow water
    alpha = mix(uClear, 0.94, smoothstep(0.0, 5.0, depth));
    alpha = max(alpha, clamp(f * uFoam, 0.0, 1.0));
    alpha = max(alpha, fres);
  } else {
    // from underneath: the sky through a bright round window straight up, the deep reflected all round it
    float s = clamp(-V.y, 0.0, 1.0);
    float win = smoothstep(0.62, 0.74, s);
    vec3 up = mix(uSkyMid, uSkyTop, 0.4) * 1.4 + uSunCol * pow(max(dot(-V * vec3(1.0, -1.0, 1.0), uSunDir), 0.0), 30.0) * 1.5;
    float rip = 0.92 + 0.08 * clamp(r.x + r.y, -1.5, 1.5);
    win = smoothstep(0.6, 0.76, s + 0.02 * clamp(r.x, -1.5, 1.5));
    col = mix(uUnder * 1.3, up * rip, win);
  }
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const C = c => new THREE.Color(c);

export class Sea {
  // o: level (surface height), size, shallow and deep colours, waves (a height scale), under
  // (the colour of the water from inside), clear (how see-through shallow water is), box (x, z,
  // w, d: the area the depth map covers, for shallows and foam)
  constructor(world, o = {}) {
    installSeaLight();
    this.world = world; this.level = o.level ?? 0;
    const scale = o.waves ?? 1;
    this.waves = (o.list || CALM).map(([x, z, a, l, s]) => { const d = Math.hypot(x, z); return [x / d, z / d, a * scale, l, s]; });
    const n = this.waves.length;
    this.under = C(o.under ?? 0x0d5a78); this.deepUnder = C(o.deepUnder ?? 0x020a14);
    this.absorb = o.absorb || [0.17, 0.05, 0.03];
    const sky = world.sky || { top: "#2d6fd0", mid: "#8fc0ec", sunColor: "#fff4dc", sunI: 2 };
    const size = o.size ?? 700, seg = Math.min(150, Math.round(size / 4.5));
    const box = this.box = o.box || [0, 0, 160, 160];
    this.depthTex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); this.depthTex.needsUpdate = true;
    this.u = {
      uW: { value: this.waves.map(w => new THREE.Vector4(w[0], w[1], w[2], w[3])) }, uWS: { value: this.waves.map(w => w[4]) },
      uT: { value: 0 }, uLevel: { value: this.level },
      uShallow: { value: C(o.shallow ?? 0x2ac8c0) }, uDeep: { value: C(o.deep ?? 0x0a3a6a) },
      uSkyTop: { value: C(sky.top) }, uSkyMid: { value: C(sky.mid) },
      uSunDir: { value: (world.sunDir || new THREE.Vector3(0.3, 0.8, 0.4)).clone() }, uSunCol: { value: C(sky.sunColor).multiplyScalar(sky.stars ? 0.5 : 1) },
      uUnder: { value: this.under.clone() }, uDepth: { value: this.depthTex }, uDepthBox: { value: new THREE.Vector4(...box) },
      uFoam: { value: o.foam ?? 1 }, uClear: { value: o.clear ?? 0.45 },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    };
    const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({ vertexShader: surfVert(n), fragmentShader: surfFrag, uniforms: this.u, transparent: true, side: THREE.DoubleSide, fog: true, depthWrite: true });
    const m = this.mesh = new THREE.Mesh(geo, mat);
    m.position.set(o.x ?? 0, 0, o.z ?? 0); m.frustumCulled = false; m.userData.dynamic = true; m.renderOrder = 1;
    world.scene.add(m);
    // out past its edge to the horizon, a frame of the same sea (plain: only the fog sees it), so the
    // sky's pale bottom doesn't show as a band under the horizon
    { const S = size / 2, F = 2800, mid = S + (F - S) / 2;
      for (const [fw, fd, cx, cz] of [[2 * F, F - S, 0, -mid], [2 * F, F - S, 0, mid], [F - S, 2 * S, -mid, 0], [F - S, 2 * S, mid, 0]]) {
        const g = new THREE.PlaneGeometry(fw, fd, 6, 3); g.rotateX(-Math.PI / 2);
        const f = new THREE.Mesh(g, mat); f.position.set(m.position.x + cx, -0.02, m.position.z + cz); f.userData.off = [cx, cz];
        f.frustumCulled = false; f.userData.dynamic = true; f.renderOrder = 1; world.scene.add(f); (this.skirt || (this.skirt = [])).push(f);
      } }
    this.grid = size / seg;
    // light shafts and drifting specks, seen only from under the water
    this.rays = this.makeRays(); this.specks = this.makeSpecks();
    SEA.uSea.value.set(1, this.level, 0, o.caustics ?? 6);
    SEA.uSeaAbs.value.set(...this.absorb);
    SEA.uSeaSun.value.copy(C(sky.sunColor)).multiplyScalar((sky.sunI || 2) * 0.5);
    // under water the fog closes in: the same kind of fog as above the water, so no shader has to
    // be rebuilt the first time Rory dives
    this.see = o.see ?? 38;
    this.isUnder = false; this.camDepth = 0;
  }
  // height of the surface at (x, z) now
  height(x, z) {
    let h = this.level; const t = this.world.t;
    for (const [dx, dz, a, l, s] of this.waves) { const k = 6.2831853 / l; h += a * Math.sin(k * (dx * x + dz * z) + s * k * t); }
    return h;
  }
  // the surface's tilt at (x, z): [nx, ny, nz]
  normal(x, z) {
    let gx = 0, gz = 0; const t = this.world.t;
    for (const [dx, dz, a, l, s] of this.waves) { const k = 6.2831853 / l, c = a * k * Math.cos(k * (dx * x + dz * z) + s * k * t); gx += c * dx; gz += c * dz; }
    const d = Math.hypot(gx, 1, gz); return [-gx / d, 1 / d, -gz / d];
  }
  // how deep the water is under every spot of the play area: a ray down through the level at
  // each texel. Shallow water shows the sand and gets foam at its edges.
  bakeDepth() {
    const phys = this.world.phys; phys.refresh();
    const N = 192, [cx, cz, w, d] = this.box, data = new Uint8Array(N * N * 4);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = cx + ((i + 0.5) / N - 0.5) * w, z = cz + ((j + 0.5) / N - 0.5) * d;
      // (from just above the water, so a roof or a bridge overhead isn't taken for the sea bed)
      const top = this.level + 0.6, hit = phys.ray({ x, y: top, z }, { x: 0, y: -1, z: 0 }, 80);
      let floor = hit === null ? -1e9 : top - hit;
      if (this.world.heightAt) floor = Math.max(floor, this.world.heightAt(x, z));
      const dep = Math.max(0, Math.min(16, this.level - floor));
      const k = (i + j * N) * 4; data[k] = data[k + 1] = data[k + 2] = Math.round(dep / 16 * 255); data[k + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, N, N); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
    this.depthTex.dispose(); this.depthTex = tex; this.u.uDepth.value = tex;
  }
  makeRays() {
    const g = new THREE.Group(), cv = document.createElement("canvas"); cv.width = 32; cv.height = 128;
    const x = cv.getContext("2d"), gr = x.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.06, "rgba(255,255,255,0.45)"); gr.addColorStop(0.4, "rgba(255,255,255,0.14)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 32, 128);
    const h = x.createLinearGradient(0, 0, 32, 0); h.addColorStop(0, "rgba(0,0,0,1)"); h.addColorStop(0.5, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,1)");
    x.globalCompositeOperation = "destination-out"; x.fillStyle = h; x.fillRect(0, 0, 32, 128);
    const tex = new THREE.CanvasTexture(cv);
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.55, 0.85, 1).multiplyScalar(0.28), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    this.rayMat = mat;
    for (let i = 0; i < 22; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8 + Math.random() * 2.4, 30), mat);
      m.geometry.translate(0, -15, 0);
      m.userData = { ox: (Math.random() - 0.5) * 36, oz: (Math.random() - 0.5) * 36, ph: Math.random() * 6, tilt: 0.25 + Math.random() * 0.1 };
      g.add(m);
    }
    g.visible = false; this.world.scene.add(g);
    return g;
  }
  makeSpecks() {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 30;
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.07, color: new THREE.Color(0.75, 0.9, 1).multiplyScalar(1.2), transparent: true, opacity: 0.55, depthWrite: false }));
    p.frustumCulled = false; p.visible = false; this.world.scene.add(p);
    return p;
  }
  // once a frame, after the camera has moved: follow the camera, and switch the fog, sky and
  // light shafts over when it goes under
  frame(cam) {
    const t = this.world.t, u = this.u, s = this.world.scene;
    u.uT.value = t; SEA.uSea.value.z = t;
    // keep the wave grid under the camera, snapped to the grid so the waves don't slide
    this.mesh.position.x = Math.round(cam.position.x / this.grid) * this.grid; this.mesh.position.z = Math.round(cam.position.z / this.grid) * this.grid;
    for (const f of this.skirt || []) f.position.set(this.mesh.position.x + f.userData.off[0], -0.02, this.mesh.position.z + f.userData.off[1]);
    const depth = this.height(cam.position.x, cam.position.z) - cam.position.y;
    const under = depth > 0.02; this.camDepth = depth;
    if (under !== this.isUnder) {
      this.isUnder = under;
      if (!s.fog) s.fog = new THREE.Fog(0x000000, 1e5, 1e6);
      if (under) { this.above = { c: s.fog.color.clone(), n: s.fog.near, f: s.fog.far, bg: s.background }; s.fog.near = 0.5; if (this.world.skyDome) this.world.skyDome.visible = false; }
      else { s.fog.color.copy(this.above.c); s.fog.near = this.above.n; s.fog.far = this.above.f; s.background = this.above.bg; if (this.world.skyDome) this.world.skyDome.visible = true; }
      this.rays.visible = this.specks.visible = under;
      document.body.classList.toggle("underwater", under);
    }
    if (under) {
      // the fog darkens and thickens with depth
      const k = Math.min(1, Math.max(0, depth / (this.world.deepAt || 70)));
      const c = this.under.clone().lerp(this.deepUnder, Math.pow(k, 0.7));
      s.fog.color.copy(c); s.fog.far = this.see * (1 - k * 0.45); s.background = c; u.uUnder.value.copy(c);
      this.rayMat.opacity = Math.max(0, 1 - depth / 30);
      this.rays.position.set(cam.position.x, this.level, cam.position.z);
      for (const r of this.rays.children) {
        const d = r.userData; r.position.set(d.ox + Math.sin(t * 0.2 + d.ph) * 2, 0, d.oz);
        r.rotation.set(0, Math.atan2(cam.position.x - (this.rays.position.x + r.position.x), cam.position.z - (this.rays.position.z + r.position.z)), 0);
        r.rotateX(d.tilt * Math.sin(d.ph)); r.scale.x = 0.7 + 0.3 * Math.sin(t * 0.7 + d.ph);
      }
      const sp = this.specks; sp.position.set(Math.floor(cam.position.x / 30) * 30, Math.floor(cam.position.y / 30) * 30, Math.floor(cam.position.z / 30) * 30);
      // (wrap the specks round the camera by shifting them in whole boxes)
      const p = sp.geometry.attributes.position, a = p.array;
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] += Math.sin(t + i) * 0.002 + 0.003;
        for (let c = 0; c < 3; c++) { const v = a[i + c] + sp.position.getComponent(c) - cam.position.getComponent(c); if (v > 15) a[i + c] -= 30; else if (v < -15) a[i + c] += 30; }
      }
      p.needsUpdate = true;
    }
  }
  dispose() { document.body.classList.remove("underwater"); SEA.uSea.value.x = 0; }
}
