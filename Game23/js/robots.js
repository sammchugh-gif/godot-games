// The animated robot (RobotExpressive by Tomás Laulhé, CC0) cloned and
// repainted: BOLT, Rory's partner, and Captain Undertow's Drips (in diving helmets).
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
  digger:  { Main: 0xe87a1a, Grey: 0x2a3a4a, Black: 0x14100c, glow: 0xffd23f, helmet: true },
  guard:   { Main: 0xe8a020, Grey: 0x4a4a52, Black: 0x121216, glow: 0xffd23f },
  drip:    { Main: 0x2ac8c0, Grey: 0x1a5a8a, Black: 0x0a1a24, glow: 0x7fe3ff, helmet: true },
  kraken:  { Main: 0x5a2a8a, Grey: 0x2ac8c0, Black: 0x14081c, glow: 0xff3a6a },
  dustkraken: { Main: 0xa8583a, Grey: 0x2ad0c0, Black: 0x2a140c, glow: 0xffb040 },
  sandbot: { Main: 0xe8c070, Grey: 0x6a4a2a, Black: 0x2a1a0a, glow: 0xffd06a, hourglass: true },
  serpent: { Main: 0xd8a860, Grey: 0x8a5a2a, Black: 0x2a1a0a, glow: 0xffe08a },
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
    if (LOOKS[look].helmet && head) {
      const top = new THREE.Box3().setFromObject(head), c = top.getCenter(new THREE.Vector3()), r = (top.max.y - top.min.y) * 0.75;
      const glass = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.28, roughness: 0.05, clearcoat: 1, depthWrite: false }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.75, r * 0.12, 8, 24), new THREE.MeshStandardMaterial({ color: 0xc89a3a, metalness: 0.9, roughness: 0.3 }));
      const hp = head.getWorldPosition(new THREE.Vector3()), ws = head.getWorldScale(new THREE.Vector3());
      for (const [m, dy] of [[glass, 0], [ring, -r * 0.7]]) { const at = head.worldToLocal(new THREE.Vector3(c.x, c.y + dy, c.z)); m.position.copy(at); m.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z); if (m === ring) m.rotation.x = Math.PI / 2; head.add(m); }
      void hp;
    }
    // a Sandbot's hourglass hat, its sand running through
    if (LOOKS[look].hourglass && head) {
      const top = new THREE.Box3().setFromObject(head), c = top.getCenter(new THREE.Vector3()), r = (top.max.y - top.min.y) * 0.34;
      const g = new THREE.Group(), glass = new THREE.MeshPhysicalMaterial({ color: 0xfff4d8, transparent: true, opacity: 0.45, roughness: 0.05, clearcoat: 1, depthWrite: false });
      const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.6 }), sand = new THREE.MeshStandardMaterial({ color: 0xf0c060, emissive: 0xa06a10, emissiveIntensity: 0.4 });
      for (const sy of [1, -1]) { const cone = new THREE.Mesh(new THREE.ConeGeometry(r, r * 1.2, 14), glass); cone.rotation.x = sy > 0 ? Math.PI : 0; cone.position.y = sy * r * 0.6; g.add(cone); }
      const pile = new THREE.Mesh(new THREE.ConeGeometry(r * 0.7, r * 0.5, 12), sand); pile.position.y = -r * 0.9; g.add(pile);
      for (const sy of [1, -1]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, r * 0.2, 14), wood); cap.position.y = sy * r * 1.3; g.add(cap); }
      const ws = head.getWorldScale(new THREE.Vector3()), at = head.worldToLocal(new THREE.Vector3(c.x, top.max.y + r * 1.3, c.z));
      g.position.copy(at); g.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z); head.add(g);
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
