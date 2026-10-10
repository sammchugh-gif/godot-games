// Pictures for the drawers: each ingredient, dish, potion, wand and vehicle
// is its own 3D model, photographed once on a small renderer of its own and
// kept as an image.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { itemModel, vehicleModel, coinModel, meatballModel, chestModel, upgradeModel } from "./models.js";

const S = 160;
let r = null, scene, cam;
const cache = new Map();

function setup() {
  const c = document.createElement("canvas"); c.width = c.height = S;
  r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(S, S, false);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.AgXToneMapping; r.toneMappingExposure = 1.15;
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  scene.environmentIntensity = 0.6;
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(2, 4, 3); scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  cam = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
}

function build(id) {
  if (id === "coin") return coinModel();
  if (id === "chest") return chestModel();
  if (id === "boss") return meatballModel(true);
  if (id.startsWith("veh_")) return vehicleModel(id.slice(4));
  if (id.startsWith("up_")) return upgradeModel(id.slice(3));
  return itemModel(id);
}

// a data: URL for the picture of id
export function icon(id) {
  let u = cache.get(id);
  if (u) return u;
  try {
    if (!r) setup();
    const m = build(id);
    m.rotation.y = id.startsWith("veh_") ? -0.7 : -0.35;
    scene.add(m);
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
    const rad = Math.max(size.x, size.y, size.z) * 0.62;
    const d = rad / Math.tan(cam.fov * Math.PI / 360) * 1.05;
    cam.position.copy(mid).add(new THREE.Vector3(0, 0.45, 1).normalize().multiplyScalar(d));
    cam.lookAt(mid);
    r.render(scene, cam);
    u = r.domElement.toDataURL("image/png");
    scene.remove(m);
  } catch (e) { u = ""; }
  cache.set(id, u);
  return u;
}
