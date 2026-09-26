// The renderer: HDR scene, soft shadows, image-based light, then bloom,
// anti-aliasing and AgX tone mapping in a post-processing chain.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export { THREE };

const touch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

// 2 = everything, 1 = bloom at half size and smaller shadows, 0 = no post-processing
export function pickQuality() {
  const saved = localStorage.getItem("rory20.quality");
  if (saved !== null && !isNaN(+saved)) return Math.max(0, Math.min(2, +saved));
  const cores = navigator.hardwareConcurrency || 4;
  if (touch) return cores > 2 ? 1 : 0;
  return cores >= 4 ? 2 : 1;
}

export class Engine {
  constructor(canvas, quality = pickQuality()) {
    this.canvas = canvas;
    this.quality = quality;
    this.touch = touch;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 0, powerPreference: "high-performance", preserveDrawingBuffer: !!window.__test });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, quality === 2 ? 2 : 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.AgXToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = quality === 0 ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 3000);
    const pm = new THREE.PMREMGenerator(r);
    this.envMap = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 0.35;
    this.bloomOn = quality > 0;
    if (this.bloomOn) {
      const c = this.composer = new EffectComposer(r);
      this.renderPass = new RenderPass(this.scene, this.camera);
      c.addPass(this.renderPass);
      // threshold above sunlit walls, so only lights and glowing things bloom (not whole façades)
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.4, 1.6);
      c.addPass(this.bloom);
      if (quality === 2) { this.smaa = new SMAAPass(); c.addPass(this.smaa); }
      c.addPass(new OutputPass());
    }
    this.clock = new THREE.Clock();
    this.onResize = [];
    addEventListener("resize", () => this.resize());
    this.resize();
  }
  setScene(scene, camera) {
    this.scene = scene; this.camera = camera || this.camera;
    if (!scene.environment) { scene.environment = this.envMap; scene.environmentIntensity = scene.userData.envI ?? 0.35; }
    if (this.renderPass) { this.renderPass.scene = scene; this.renderPass.camera = this.camera; }
    this.resize();
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + "px"; this.canvas.style.height = h + "px";
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1.2 ? 68 : 55;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      const pr = this.renderer.getPixelRatio();
      this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
      // bloom runs at half resolution on the middle tier, which is most of its cost
      if (this.quality === 1) this.bloom.resolution.set(w / 2, h / 2);
    }
    for (const f of this.onResize) f(w, h);
  }
  render() {
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
  }
}
