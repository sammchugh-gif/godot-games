// Dialogue portraits: each character's 3D head rendered once into a small
// picture with studio lights, so the faces in the dialogue box match the world.
import * as THREE from "three";
import { makePerson, animatePerson } from "./people.js";
import { Robot } from "./robots.js";

export class Portraits {
  constructor(renderer, chars) {
    this.renderer = renderer; this.chars = chars; this.cache = new Map();
    const S = 192;
    this.size = S;
    this.rt = new THREE.WebGLRenderTarget(S, S, { samples: 4 });
    this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(26, 1, 0.05, 20);
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(1.5, 2, 3); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fe0ff, 1.6); rim.position.set(-2, 1.5, -2); this.scene.add(rim);
    this.scene.add(new THREE.HemisphereLight(0xdfefff, 0x302a3a, 1.0));
  }
  // a fresh canvas each call, so the same face can sit in two places at once
  get(id) {
    const ch = this.chars[id];
    if (!ch) return null;
    if (!this.cache.has(id)) this.cache.set(id, this.render(ch));
    const src = this.cache.get(id);
    const c = document.createElement("canvas"); c.width = c.height = this.size;
    c.getContext("2d").drawImage(src, 0, 0);
    return c;
  }
  render(ch) {
    const r = this.renderer, S = this.size;
    const bg = new THREE.Color(ch.bg || (ch.side === "villain" ? "#3a1030" : "#10284a"));
    this.scene.background = bg;
    let obj, headY, dist;
    if (ch.robot) {
      const rb = new Robot(ch.robot, 1.2); rb.mixer.update(0.5); obj = rb.root; headY = 1.0; dist = 1.3;
    } else {
      const rig = makePerson(ch.look || {});
      animatePerson(rig, { dt: 1, speed: 0, grounded: true });
      for (const e of rig.eyes) e.scale.y = 1;
      obj = rig.root; obj.updateMatrixWorld(true);
      const p = new THREE.Vector3(); rig.head.getWorldPosition(p);
      headY = p.y; dist = rig.S.headR * 6.2;
    }
    this.scene.add(obj);
    obj.rotation.y = -0.35;
    this.cam.position.set(dist * 0.28, headY + dist * 0.05, dist);
    this.cam.lookAt(0, headY - dist * 0.04, 0);
    r.setRenderTarget(this.rt); r.clear(); r.render(this.scene, this.cam); r.setRenderTarget(null);
    const px = new Uint8Array(S * S * 4);
    r.readRenderTargetPixels(this.rt, 0, 0, S, S, px);
    this.scene.remove(obj);
    const c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d"), img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) img.data.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
    g.putImageData(img, 0, 0);
    return c;
  }
}
