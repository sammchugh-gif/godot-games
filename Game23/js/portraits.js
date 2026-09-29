// Dialogue portraits: each character's 3D head rendered once into a small
// picture with studio lights, so the faces in the dialogue box match the world.
import * as THREE from "three";
import { critter } from "./critters.js";
import { makePerson, animatePerson, diveSuit, spaceSuit, marsSuit } from "./people.js";
import { Robot } from "./robots.js";
import { Pebble } from "./pebble.js";
import { subModel } from "./craft.js";

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
    // (in the dive suit's places Rory's portrait wears the helmet too)
    if (id === "rory" && this.suit) id = "rory_" + this.suit;
    const ch = this.chars[id] || (id.startsWith("rory_") && { ...this.chars.rory, suit: id.slice(5) });
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
    let obj, headY, dist, focus = null;
    if (ch.craft) {
      obj = subModel(); obj.rotation.y = 0.35; headY = 0.25; dist = 3.6;
    } else if (ch.dino) {
      // (her head is well forward of her middle: aim at it, from in front and a little to the side)
      const pb = new Pebble(1.5); pb.update(0.01); obj = pb.root; obj.rotation.y = -0.35; obj.updateMatrixWorld(true);
      focus = pb.head.getWorldPosition(new THREE.Vector3()); dist = 2.3;
    } else if (ch.critter) {
      obj = critter(ch.critter, 1.4); headY = 0.1; dist = 1.7;
    } else if (ch.robot) {
      const rb = new Robot(ch.robot, 1.2); rb.mixer.update(0.5); obj = rb.root; headY = 1.0; dist = 1.3;
    } else {
      const rig = makePerson(ch.look || {});
      if (ch.suit === "dive") diveSuit(rig, true);
      else if (ch.suit) { spaceSuit(rig, true); if (ch.suit === "mars") marsSuit(rig, true); }
      animatePerson(rig, { dt: 1, speed: 0, grounded: true });
      for (const e of rig.eyes) e.scale.y = 1;
      obj = rig.root; obj.updateMatrixWorld(true);
      const p = new THREE.Vector3(); rig.head.getWorldPosition(p);
      headY = p.y; dist = rig.S.headR * 6.2;
    }
    this.scene.add(obj);
    if (!ch.craft) obj.rotation.y = -0.35;
    if (focus) { this.cam.position.set(focus.x + dist * 0.3, focus.y + dist * 0.12, focus.z + dist); this.cam.lookAt(focus.x, focus.y - dist * 0.02, focus.z); }
    else { this.cam.position.set(dist * 0.28, headY + dist * 0.05, dist); this.cam.lookAt(0, headY - dist * 0.04, 0); }
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
