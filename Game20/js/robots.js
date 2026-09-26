// The animated robot (RobotExpressive by Tomás Laulhé, CC0) cloned and
// repainted: BOLT, Rory's partner, and Professor Zero's Floater henchbots.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

let proto = null, protoH = 1;
export async function loadRobot(url = "models/robot.glb") {
  if (proto) return;
  const gltf = await new GLTFLoader().loadAsync(url);
  proto = gltf;
  const box = new THREE.Box3().setFromObject(gltf.scene);
  protoH = box.max.y - box.min.y;
}

export const LOOKS = {
  bolt:    { Main: 0xf2f5fa, Grey: 0x3aa8e8, Black: 0x16202c, glow: 0x7fe3ff },
  floater: { Main: 0x8a4ad8, Grey: 0x3a3a48, Black: 0x14101c, glow: 0xff5ad8 },
  boss:    { Main: 0x2a2a34, Grey: 0xd83a8a, Black: 0x0a0a10, glow: 0xff3a6a },
  guard:   { Main: 0xe8a020, Grey: 0x4a4a52, Black: 0x121216, glow: 0xffd23f },
};

const matCache = new Map();
function paint(name, look, src) {
  const key = look + ":" + name;
  if (!matCache.has(key)) {
    const m = src.clone();
    const L = LOOKS[look];
    if (L[name] !== undefined) m.color = new THREE.Color(L[name]);
    m.roughness = name === "Main" ? 0.35 : 0.5; m.metalness = name === "Grey" ? 0.4 : 0.15;
    matCache.set(key, m);
  }
  return matCache.get(key);
}

export class Robot {
  constructor(look = "bolt", height = 1) {
    this.root = new THREE.Group();
    const s = clone(proto.scene);
    s.scale.setScalar(height / protoH);
    this.root.add(s);
    s.traverse(n => {
      if (n.isMesh) { n.castShadow = true; n.material = paint(n.material.name, look, n.material); if (n.morphTargetDictionary) this.face = n; }
    });
    // a glowing antenna light that the bloom picks up
    const head = s.getObjectByName("Head");
    const glow = LOOKS[look].glow;
    this.light = new THREE.Mesh(new THREE.SphereGeometry(height * 0.035, 12, 8), new THREE.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: 4 }));
    if (head) {
      // the bones live at a tiny scale inside the armature, so place the light in world units and convert
      s.updateMatrixWorld(true);
      const top = new THREE.Box3().setFromObject(head).max.y;
      const hp = head.getWorldPosition(new THREE.Vector3());
      const ws = head.getWorldScale(new THREE.Vector3());
      const at = head.worldToLocal(new THREE.Vector3(hp.x, top + height * 0.02, hp.z));
      this.light.position.copy(at); this.light.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
      head.add(this.light);
    }
    this.mixer = new THREE.AnimationMixer(s);
    this.actions = {};
    for (const clip of proto.animations) this.actions[clip.name] = this.mixer.clipAction(clip);
    for (const n of ["Jump", "Wave", "ThumbsUp", "Yes", "No", "Punch", "Death", "WalkJump"]) { const a = this.actions[n]; if (a) { a.clampWhenFinished = true; a.loop = THREE.LoopOnce; } }
    this.cur = null;
    this.play("Idle");
    this.mixer.addEventListener("finished", () => { if (this.after) { const a = this.after; this.after = null; this.play(a); } });
    this.height = height;
    this.pos = this.root.position;
  }
  play(name, fade = 0.25, then) {
    const a = this.actions[name];
    if (!a || this.cur === a) return;
    a.reset().fadeIn(fade).play();
    if (this.cur) this.cur.fadeOut(fade);
    this.cur = a; this.curName = name;
    this.after = then || (a.loop === THREE.LoopOnce ? "Idle" : null);
  }
  expression(name, v) { if (this.face) { const i = this.face.morphTargetDictionary[name]; if (i !== undefined) this.face.morphTargetInfluences[i] = v; } }
  // walk toward (x, z) at speed; returns the distance left
  walkTo(x, z, speed, dt) {
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.1) {
      const step = Math.min(d, speed * dt);
      this.pos.x += dx / d * step; this.pos.z += dz / d * step;
      const want = Math.atan2(dx, dz);
      let r = want - this.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
      this.root.rotation.y += r * Math.min(1, dt * 8);
    }
    return d;
  }
  update(dt) { this.mixer.update(dt); if (this.light) this.light.material.emissiveIntensity = 3 + Math.sin(performance.now() / 200) * 1.2; }
}
