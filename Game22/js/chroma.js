// Colour, and the lack of it. Every lit or unlit material in the game is drawn
// through one extra step: outside the spheres of colour that Rory has won
// back, the world is grey. A sphere grows out from the spot where a mission
// was won with a rainbow ripple at its edge; when a whole place is done, the
// place goes to full colour and the sky and the water with it.
import * as THREE from "three";

export const MAX = 12;
export const CHROMA = {
  uChroma: { value: Array.from({ length: MAX }, () => new THREE.Vector4(0, 0, 0, 0)) }, // x, y, z, radius (0 = unused)
  uChromaRing: { value: new Float32Array(MAX) },       // 1 while a sphere is still growing: the rainbow edge
  uChromaAll: { value: 1 },                             // the whole place's colour, 0..1
  uChromaT: { value: 0 },
};

// the GLSL, for the sky and the sea shaders too
export const CHROMA_GLSL = `
uniform vec4 uChroma[${MAX}]; uniform float uChromaRing[${MAX}]; uniform float uChromaAll; uniform float uChromaT;
varying vec3 vChW;
vec3 chromaHue(float h) { vec3 p = abs(fract(vec3(h) + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0); return clamp(p - 1.0, 0.0, 1.0); }
// how much colour a point in the world has (0 grey, 1 full), and the glow of any ripple passing it
void chromaAt(vec3 p, out float sat, out vec3 glow) {
  sat = uChromaAll; glow = vec3(0.0);
  for (int i = 0; i < ${MAX}; i++) {
    vec4 c = uChroma[i]; if (c.w <= 0.0) continue;
    float d = distance(p, c.xyz);
    sat = max(sat, 1.0 - smoothstep(c.w - 2.5, c.w + 0.4, d));
    float ring = exp(-(d - c.w) * (d - c.w) * 0.6) * uChromaRing[i];
    glow += chromaHue(d * 0.12 - uChromaT * 0.5) * ring * 1.6;
  }
  sat = clamp(sat, 0.0, 1.0);
}
vec3 chromaGrade(vec3 rgb, vec3 p) {
  float sat; vec3 glow; chromaAt(p, sat, glow);
  float lum = dot(rgb, vec3(0.3, 0.59, 0.11));
  vec3 grey = vec3(lum) * vec3(0.86, 0.9, 0.97) + 0.015;   // a cold, drained grey
  return mix(grey, rgb, sat) + glow * (0.35 + 0.65 * lum);
}`;
let installed = false;
export function installChroma() {
  if (installed) return; installed = true;
  const C = THREE.ShaderChunk;
  C.common += CHROMA_GLSL.replace("varying vec3 vChW;", "varying vec3 vChW;");
  C.project_vertex += `
  { vec4 cw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    cw = instanceMatrix * cw;
  #endif
    vChW = (modelMatrix * cw).xyz; }`;
  // the last thing a fragment does before tone mapping
  C.opaque_fragment = C.opaque_fragment.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", "gl_FragColor = vec4( chromaGrade(outgoingLight, vChW), diffuseColor.a );");
}
// the uniforms every material shader gets (the sea's too: it hooks the same materials)
export function chromaHook(shader) { Object.assign(shader.uniforms, CHROMA); }

// ------------------------------------------------------------ the state of a place's colour
// (the last slot is the bubble of colour Rory carries with him: he and PALETTE are never grey)
const ROOM = MAX - 1;
export const Chroma = {
  spheres: [],   // { x, y, z, r, target, speed, ring }
  all: 1, allTarget: 1,
  hero: { x: 0, y: 0, z: 0, r: 0 },
  reset(all) { this.spheres = []; this.all = all; this.allTarget = all; this.push(); },
  // a sphere already won (from the save): full size, no ripple
  have(x, y, z, r) { if (this.spheres.length >= ROOM) return; this.spheres.push({ x, y, z, r, target: r, speed: 0, ring: 0 }); this.push(); },
  // win a sphere now: it grows out with the ripple
  restore(x, y, z, r, secs = 3.5) {
    // the same spot again (a replay): just the ripple
    const same = this.spheres.find(s => Math.hypot(s.x - x, s.z - z) < 3 && s.target >= r);
    if (same) { same.ring = 1; same.r = Math.min(same.r, 0.5); same.speed = r / secs; return; }
    if (this.spheres.length >= ROOM) { const s = this.spheres.reduce((a, b) => a.r < b.r ? a : b); s.target = Math.max(s.target, r); s.speed = r / secs; s.ring = 1; return; }
    this.spheres.push({ x, y, z, r: 0.5, target: r, speed: r / secs, ring: 1 });
  },
  // the bubble round Rory
  follow(x, y, z, r = 3.6) { const h = this.hero; if (Math.abs(h.x - x) + Math.abs(h.y - y) + Math.abs(h.z - z) + Math.abs(h.r - r) < 0.02) return; h.x = x; h.y = y; h.z = z; h.r = r; this.push(); },
  // the whole place, over a few seconds
  finish(secs = 4) { this.allTarget = 1; this.allSpeed = 1 / secs; },
  update(dt) {
    let moved = false;
    for (const s of this.spheres) { if (s.r < s.target) { s.r = Math.min(s.target, s.r + s.speed * dt); moved = true; } else if (s.ring > 0) { s.ring = Math.max(0, s.ring - dt * 0.8); moved = true; } }
    if (this.all < this.allTarget) { this.all = Math.min(this.allTarget, this.all + (this.allSpeed || 0.25) * dt); moved = true; }
    CHROMA.uChromaT.value += dt;
    if (moved) this.push();
  },
  push() {
    const u = CHROMA.uChroma.value, rg = CHROMA.uChromaRing.value;
    for (let i = 0; i < ROOM; i++) { const s = this.spheres[i]; if (s) { u[i].set(s.x, s.y, s.z, s.r); rg[i] = s.ring; } else { u[i].set(0, 0, 0, 0); rg[i] = 0; } }
    const h = this.hero; u[ROOM].set(h.x, h.y, h.z, this.all >= 1 ? 0 : h.r); rg[ROOM] = 0;
    CHROMA.uChromaAll.value = this.all;
  },
  // how coloured is a point (for the music, and for things that check)
  at(x, y, z) { let s = this.all; for (const q of this.spheres) { const d = Math.hypot(x - q.x, y - q.y, z - q.z); s = Math.max(s, THREE.MathUtils.clamp(1 - (d - (q.r - 2.5)) / 2.9, 0, 1)); } return Math.min(1, s); },
  // the fraction of the place that has its colour, roughly: the biggest sphere share plus the whole
  fraction() { return this.all; },
  // is the world coloured here (not counting Rory's own bubble)
  won(x, y, z) { for (const q of this.spheres) if (Math.hypot(x - q.x, y - q.y, z - q.z) < q.target - 1) return true; return this.all >= 1; },
};
