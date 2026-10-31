/* Code Lab's sprite library: cartoon characters and things, drawn in code
   in a flat, outlined style, so there is nothing to download and every one
   stays sharp at any size.

   Each look is drawn in its own units, about 100 to a character, with the
   middle at 0,0 and the feet at y = 46. Characters have four costumes: still,
   two walking steps and a jump; Code Lab switches between them by itself as
   a character walks and jumps. Things have one costume or a few (a coin that
   turns, a door that opens).

   window.ART.looks   [{k, n, g, w, h, kind, costumes, d}]
                      k key, n name, g group, w h the box it fills, kind
                      "char" (falls), "thing" or "solid" (others stand on it)
   window.ART.draw(ctx, key, costume)                                       */
(function () {
"use strict";
let X = null;
const TAU = Math.PI * 2;
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
}
const OL = f => (f[0] === "#" ? shade(f, -0.55) : "#333");
const LW = 3;
/* fill the current path and outline it in a darker shade of its own colour */
function fs(f, lw) { X.fillStyle = f; X.fill(); X.lineWidth = lw || LW; X.lineJoin = "round"; X.strokeStyle = OL(f); X.stroke(); }
function fo(f) { X.fillStyle = f; X.fill(); }
function E(x, y, rx, ry, f, rot, plain) { X.beginPath(); X.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); plain ? fo(f) : fs(f); }
function C(x, y, r, f, plain) { E(x, y, r, r, f, 0, plain); }
function rpath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r);
  X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath();
}
function R(x, y, w, h, r, f, plain) { rpath(x, y, w, h, r); plain ? fo(f) : fs(f); }
function poly(pts) { X.beginPath(); X.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) X.lineTo(pts[i], pts[i + 1]); X.closePath(); }
function P(pts, f, plain) { poly(pts); plain ? fo(f) : fs(f); }
/* a closed blob through the points, rounded */
function B(pts, f, plain) {
  const n = pts.length / 2, px = i => pts[(i % n) * 2], py = i => pts[(i % n) * 2 + 1];
  X.beginPath(); X.moveTo((px(0) + px(1)) / 2, (py(0) + py(1)) / 2);
  for (let i = 1; i <= n; i++) X.quadraticCurveTo(px(i), py(i), (px(i) + px(i + 1)) / 2, (py(i) + py(i + 1)) / 2);
  X.closePath(); plain ? fo(f) : fs(f);
}
/* an outlined limb or tail: a thick line with a darker edge */
function L(pts, w, f) {
  X.lineCap = "round"; X.lineJoin = "round";
  const path = () => {
    X.beginPath(); X.moveTo(pts[0], pts[1]);
    if (pts.length === 4) X.lineTo(pts[2], pts[3]);
    else if (pts.length === 6) X.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    else X.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
  };
  path(); X.strokeStyle = OL(f); X.lineWidth = w + LW * 2; X.stroke();
  path(); X.strokeStyle = f; X.lineWidth = w; X.stroke();
}
function line(pts, w, col) {
  X.lineCap = "round"; X.lineJoin = "round"; X.beginPath(); X.moveTo(pts[0], pts[1]);
  if (pts.length === 4) X.lineTo(pts[2], pts[3]); else X.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
  X.strokeStyle = col; X.lineWidth = w; X.stroke();
}
function eye(x, y, r, look) {
  X.beginPath(); X.ellipse(x, y, r * 0.86, r, 0, 0, TAU); X.fillStyle = "#fff"; X.fill(); X.lineWidth = 2; X.strokeStyle = "#2a2a3a"; X.stroke();
  C(x + r * (look == null ? 0.3 : look), y + r * 0.1, r * 0.55, "#1d1d2b", true);
  C(x + r * (look == null ? 0.3 : look) + r * 0.2, y - r * 0.15, r * 0.2, "#fff", true);
}
function dotEye(x, y, r) { C(x, y, r, "#1d1d2b", true); C(x + r * 0.35, y - r * 0.35, r * 0.35, "#fff", true); }
function smile(x, y, w, col) { X.beginPath(); X.arc(x, y - w * 0.4, w, 0.25 * Math.PI, 0.75 * Math.PI); X.lineWidth = 2.5; X.lineCap = "round"; X.strokeStyle = col || "#4a2a2a"; X.stroke(); }
function grin(x, y, w) { X.beginPath(); X.arc(x, y, w, 0.05 * Math.PI, 0.95 * Math.PI); X.closePath(); X.fillStyle = "#7a1f2b"; X.fill(); X.lineWidth = 2; X.strokeStyle = "#4a1018"; X.stroke(); }
function cheek(x, y) { X.globalAlpha = 0.45; E(x, y, 5, 3, "#ff7a8a", 0, true); X.globalAlpha = 1; }
function shine(x, y, rx, ry) { X.globalAlpha = 0.55; E(x, y, rx, ry, "#ffffff", -0.5, true); X.globalAlpha = 1; }

/* ------------------------------------------------------------ critters
   One animal shape on two legs, facing right, which ears, snout, tail and
   markings turn into a cat, a dog, a bunny and the rest. */
function pose(c) { return { sw: c === 1 ? 1 : c === 2 ? -1 : 0, up: c === 3, bob: c === 1 || c === 2 ? -1.5 : 0 }; }
function critter(o, c) {
  const p = pose(c), fur = o.fur, dk = o.dark || fur;
  X.save(); X.translate(0, p.bob);
  // tail
  const tails = {
    cat: () => L([-13, 24, -34, 20, -26, -4, -32, -10], 7, fur),
    long: () => L([-13, 26, -40, 26, -40, 6], 6, fur),
    dog: () => L([-13, 22, -26, 14, -28, 2], 8, fur),
    fluffy: () => { B([-12, 26, -30, 30, -42, 12, -36, -2, -24, 12], fur); B([-36, 2, -42, 10, -38, 0], o.tip || "#ffffff"); },
    bunny: () => C(-15, 26, 7, o.tip || "#ffffff"),
    curly: () => L([-13, 22, -24, 14, -20, 8, -26, 6], 4, fur),
    bear: () => C(-15, 24, 5, fur),
    lion: () => { L([-13, 26, -36, 30, -38, 10], 4, fur); C(-38, 8, 6, o.mane); },
  };
  if (o.tail) tails[o.tail]();
  // back leg and arm
  const legW = o.legW || 9;
  const lf = p.up ? [-12, 37] : [-6 - p.sw * 8, 43];
  L([-6, 26, lf[0], lf[1] - 2], legW, dk); E(lf[0] + 2, lf[1], 7, 4.5, o.paw || dk);
  const ba = p.up ? [-16, -4] : [-12 + p.sw * 5, 22];
  L([-4, 8, ba[0], ba[1]], 7, dk);
  // body
  E(0, 16, 16, 17, fur);
  if (o.belly) E(4, 19, 9, 11, o.belly, 0, true);
  if (o.body) o.body();
  // front leg
  const ff = p.up ? [12, 35] : [6 + p.sw * 8, 43];
  L([6, 26, ff[0], ff[1] - 2], legW, fur); E(ff[0] + 2, ff[1], 7, 4.5, o.paw || fur);
  // ears behind the head
  const hx = 3, hy = -16;
  const ears = {
    cat: () => { P([-14, -26, -18, -50, -2, -36], fur); P([6, -38, 18, -52, 22, -30], fur); P([-13, -30, -15, -44, -6, -36], o.inner || "#ffb3c1", 1); P([9, -37, 17, -47, 19, -33], o.inner || "#ffb3c1", 1); },
    fox: () => { P([-16, -24, -20, -54, 0, -36], fur); P([6, -38, 20, -58, 24, -30], fur); P([-15, -30, -17, -46, -7, -36], "#3a2a2a", 1); P([10, -37, 19, -51, 21, -33], "#3a2a2a", 1); },
    bunny: () => { E(-8, -50, 7, 22, fur, -0.25); E(12, -52, 7, 22, fur, 0.2); E(-8, -50, 3.5, 16, o.inner || "#ffb3c1", -0.25, true); E(12, -52, 3.5, 16, o.inner || "#ffb3c1", 0.2, true); },
    round: () => { C(-14, -34, 10, fur); C(18, -36, 10, fur); C(-14, -34, 5.5, o.inner || dk, true); C(18, -36, 5.5, o.inner || dk, true); },
    mouse: () => { C(-16, -34, 14, fur); C(20, -36, 14, fur); C(-16, -34, 8.5, o.inner || "#ffb3c1", true); C(20, -36, 8.5, o.inner || "#ffb3c1", true); },
    pig: () => { P([-12, -30, -16, -46, -2, -36], fur); P([8, -37, 18, -48, 20, -32], fur); },
    none: () => {},
  };
  if (o.mane) { X.save(); X.translate(hx, hy); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; C(Math.cos(a) * 25, Math.sin(a) * 23, 10, o.mane); } C(0, 0, 25, o.mane, true); X.restore(); }
  (ears[o.ears] || ears.none)();
  // head
  E(hx, hy, 25, 23, fur);
  if (o.face) E(hx + 8, hy + 4, 15, 14, o.face, 0, true);
  if (o.headMark) o.headMark(hx, hy);
  // snout
  if (o.snout) E(22, -8, 10, 8, o.snout);
  E(o.snout ? 29 : 26, o.snout ? -11 : -10, o.noseR || 4, (o.noseR || 4) * 0.75, o.nose || "#3a2328");
  if (o.ears === "dog") { E(-12, -18, 8, 16, o.ear || dk, 0.25); }
  if (o.ears === "dogR") { E(-12, -18, 8, 16, o.ear || dk, 0.25); E(15, -30, 7, 10, o.ear || dk, -0.6); }
  if (o.eyePatch) { E(9, -19, 7, 8, o.eyePatch, 0.3, true); E(22, -19, 6, 7, o.eyePatch, -0.3, true); }
  eye(9, -20, 6.5); eye(22, -20, 5.5);
  smile(o.snout ? 21 : 20, o.snout ? -1 : -2, 4);
  cheek(8, -6);
  if (o.whiskers) { X.globalAlpha = 0.7; line([24, -6, 38, -9], 1.4, "#333"); line([24, -4, 38, -2], 1.4, "#333"); X.globalAlpha = 1; }
  if (o.extra) o.extra(p);
  // front arm
  const fa = p.up ? [16, -8] : [14 - p.sw * 6, 21];
  L([6, 8, fa[0], fa[1]], 7, fur); C(fa[0], fa[1], 4.5, o.paw || fur);
  X.restore();
}

/* ------------------------------------------------------------ people */
function person(o, c) {
  const p = pose(c);
  X.save(); X.translate(0, p.bob);
  if (o.back) o.back(p);
  if (o.hairBack) R(-18, -36, 38, o.hairBack, 12, o.hair);
  // back leg and arm
  const lf = p.up ? [-11, 36] : [-4 - p.sw * 8, 42];
  L([-4, 22, lf[0], lf[1] - 3], 9, o.pants); E(lf[0] + 3, lf[1], 7, 4.5, o.shoes);
  const ba = p.up ? [-14, -8] : [-9 + p.sw * 6, 20];
  L([-4, 4, ba[0], ba[1]], 7, o.sleeve || o.shirt); C(ba[0], ba[1], 4, o.skin);
  // body
  if (o.dress) P([-9, 0, 11, 0, 19, 30, -15, 30], o.shirt);
  else R(-11, -1, 22, 26, 8, o.shirt);
  if (o.bodyMark) o.bodyMark();
  // front leg
  const ff = p.up ? [10, 34] : [4 + p.sw * 8, 42];
  if (!o.dress || true) { L([4, 22, ff[0], ff[1] - 3], 9, o.pants); E(ff[0] + 3, ff[1], 7, 4.5, o.shoes); }
  if (o.dress) P([-9, 0, 11, 0, 19, 30, -15, 30], o.shirt);
  // head
  C(2, -20, 20, o.skin);
  if (o.hair) {
    X.beginPath(); X.arc(2, -21, 21, Math.PI * 0.95, Math.PI * 2.08); X.quadraticCurveTo(14, -30, 2, -32); X.quadraticCurveTo(-8, -26, -18, -18); X.closePath(); fs(o.hair);
  }
  if (o.hat) o.hat(p);
  eye(9, -19, 4.6); eye(19, -19, 4);
  if (o.patch) { E(19, -19, 5, 5, "#1d1d2b"); line([5, -30, 24, -12], 1.6, "#1d1d2b"); }
  smile(15, -9, 4);
  cheek(7, -11);
  if (o.mask) { R(-17, -24, 39, 9, 4, o.mask); eye(9, -19, 4.2); eye(19, -19, 3.8); }
  if (o.face) o.face();
  // front arm
  const fa = p.up ? [15, -10] : [13 - p.sw * 6, 20];
  L([6, 4, fa[0], fa[1]], 7, o.sleeve || o.shirt); C(fa[0], fa[1], 4.2, o.glove || o.skin);
  if (o.hold) o.hold(fa, p);
  X.restore();
}

/* ------------------------------------------------------------ the looks */
const CH = ["still", "walk 1", "walk 2", "jump"];
const looks = [];
function add(k, n, g, w, h, kind, costumes, d) { looks.push({ k, n, g, w, h, kind, costumes, d }); }
const animal = (k, n, o, w) => add(k, n, "Animals", w || 62, 96, "char", CH, c => critter(o, c));

animal("cat", "Cat", { fur: "#f6a33a", belly: "#ffe2b3", snout: "#fff0d6", ears: "cat", tail: "cat", whiskers: 1,
  headMark: () => { X.globalAlpha = .5; line([-4, -38, -2, -30], 3, "#c46d12"); line([4, -39, 4, -31], 3, "#c46d12"); X.globalAlpha = 1; } });
animal("blackcat", "Black Cat", { fur: "#3b3a4a", belly: "#5b5a6c", ears: "cat", tail: "cat", whiskers: 1, inner: "#ff9fb4", nose: "#ff8aa5" });
animal("dog", "Dog", { fur: "#c98b52", belly: "#f3d9b8", snout: "#f3d9b8", ears: "dog", ear: "#7a4a24", tail: "dog", noseR: 5 });
animal("puppy", "Puppy", { fur: "#f2efe8", belly: "#ffffff", snout: "#ffffff", ears: "dogR", ear: "#3a3a40", tail: "dog", eyePatch: null, noseR: 5,
  body: () => { E(-6, 10, 6, 5, "#3a3a40", 0, true); } });
animal("bunny", "Bunny", { fur: "#e9e3f2", belly: "#ffffff", snout: "#ffffff", ears: "bunny", tail: "bunny", nose: "#ff8aa5", noseR: 3 });
animal("bear", "Bear", { fur: "#9a6234", belly: "#d9a873", snout: "#e2bb8c", ears: "round", inner: "#d9a873", tail: "bear", noseR: 5 });
animal("panda", "Panda", { fur: "#ffffff", dark: "#2b2b33", belly: "#ffffff", snout: "#ffffff", ears: "round", inner: "#2b2b33", eyePatch: "#2b2b33", tail: "bear", paw: "#2b2b33",
  body: () => { R(-16, 4, 32, 8, 4, "#2b2b33", 1); } });
animal("fox", "Fox", { fur: "#ef7d2d", belly: "#ffffff", snout: "#ffffff", ears: "fox", tail: "fluffy", dark: "#3a2a2a", paw: "#3a2a2a" });
animal("pig", "Pig", { fur: "#ffb1c3", belly: "#ffd3de", snout: "#ff8fab", ears: "pig", tail: "curly", nose: "#d8607f", noseR: 2.4 });
animal("mouse", "Mouse", { fur: "#a9a7b8", belly: "#e7e4f0", ears: "mouse", tail: "long", nose: "#ff8aa5", noseR: 3.5 });
animal("monkey", "Monkey", { fur: "#8a5a32", face: "#f1cfa0", ears: "round", inner: "#f1cfa0", tail: "long", belly: "#f1cfa0" });
animal("lion", "Lion", { fur: "#f4b942", belly: "#ffe3a3", snout: "#ffe3a3", ears: "round", inner: "#d58a1f", mane: "#c0641a", tail: "lion", noseR: 5 });
animal("tiger", "Tiger", { fur: "#f28c28", belly: "#ffffff", snout: "#ffffff", ears: "round", inner: "#ffffff", tail: "long", whiskers: 1,
  headMark: () => { line([-6, -38, -2, -32], 3, "#2b2020"); line([4, -39, 4, -32], 3, "#2b2020"); line([-21, -18, -14, -16], 3, "#2b2020"); },
  body: () => { line([-14, 10, -8, 12], 3, "#2b2020"); line([-15, 18, -9, 19], 3, "#2b2020"); } });
animal("koala", "Koala", { fur: "#9ea3ad", belly: "#e3e5ea", ears: "mouse", inner: "#e3e5ea", nose: "#2b2b33", noseR: 6, tail: "bear" });
animal("unicorn", "Unicorn", { fur: "#ffffff", belly: "#fff3fb", snout: "#ffe3f1", ears: "pig", tail: "fluffy", tip: "#b98cff", nose: "#ff9fc8", noseR: 2.5, paw: "#c8b6e6",
  extra: () => { P([4, -38, 14, -66, 14, -36], "#ffd23f"); line([7, -44, 13, -46], 1.5, "#c99a00"); line([9, -52, 14, -54], 1.5, "#c99a00");
    B([-22, -30, -14, -42, -2, -40, -10, -30, -20, -20], "#ff7ab8"); B([-24, -18, -20, -30, -14, -22, -18, -8], "#7ab8ff"); } });

/* frog: squat, big eyes on top */
add("frog", "Frog", "Animals", 70, 70, "char", CH, c => {
  const p = pose(c); X.save(); X.translate(0, p.up ? -6 : 0);
  const g = "#57c443", lg = "#c6f08a";
  const bl = p.up ? [-24, 36] : [-14 - p.sw * 6, 44];
  L([-10, 30, -26, 26, bl[0], bl[1] - 2], 9, g); E(bl[0] - 2, bl[1], 9, 4, g);
  E(0, 22, 26, 22, g); E(6, 28, 16, 13, lg, 0, true);
  C(-6, 2, 11, g); C(16, 0, 11, g); eye(-6, 1, 8, .35); eye(16, -1, 8, .35);
  X.beginPath(); X.moveTo(-8, 22); X.quadraticCurveTo(10, 34, 26, 18); X.lineWidth = 3; X.strokeStyle = "#2c6a20"; X.stroke();
  cheek(-4, 24); cheek(22, 18);
  const fl = p.up ? [24, 36] : [12 + p.sw * 6, 44];
  L([10, 32, fl[0], fl[1] - 2], 8, g); E(fl[0] + 3, fl[1], 9, 4, g);
  X.restore();
});
add("penguin", "Penguin", "Animals", 56, 92, "char", CH, c => {
  const p = pose(c); X.save(); X.translate(0, p.bob); X.rotate(p.sw * 0.08);
  E(-5 - p.sw * 4, 42, 9, 5, "#ff9f1c"); E(9 + p.sw * 4, 42, 9, 5, "#ff9f1c");
  E(0, 6, 24, 36, "#2b2f45"); E(6, 12, 15, 27, "#ffffff", 0, true);
  E(-20, p.up ? -10 : 8, 6, 18, "#2b2f45", p.up ? -0.9 : 0.25);
  eye(6, -16, 5.5); eye(17, -16, 4.8);
  P([16, -8, 32, -5, 16, -2], "#ff9f1c"); cheek(4, -6);
  E(18, p.up ? -8 : 10, 6, 17, "#2b2f45", p.up ? 0.9 : -0.25);
  X.restore();
});
add("chick", "Chick", "Animals", 54, 66, "char", CH, c => {
  const p = pose(c); X.save(); X.translate(0, p.bob + (p.up ? -4 : 0));
  line([-4, 30, -6 - p.sw * 5, 44], 3, "#ff9f1c"); line([6, 30, 6 + p.sw * 5, 44], 3, "#ff9f1c");
  E(0, 16, 26, 24, "#ffd93b"); B([-6, 0, -2, -14, 6, -4], "#ffd93b");
  E(-6, 18, 12, 9, "#ffc51a", p.up ? -0.8 : 0.3);
  eye(8, 8, 5); P([18, 12, 30, 15, 18, 19], "#ff8c1a"); cheek(10, 20);
  X.restore();
});
add("bird", "Bird", "Animals", 70, 56, "char", ["wings up", "wings down", "wings up", "wings down"], c => {
  const up = c % 2 === 0;
  L([-18, 2, -34, -4], 7, "#2f7de1"); L([-18, 6, -34, 8], 7, "#2f7de1");
  E(0, 4, 24, 18, "#3d9bff"); E(5, 10, 13, 9, "#cfe7ff", 0, true);
  B(up ? [-6, 0, -18, -26, 6, -8] : [-6, 4, -14, 26, 6, 10], "#2f7de1");
  eye(12, -2, 5.5); P([20, 2, 34, 5, 20, 9], "#ffb02e"); line([-4, 22, -6, 28], 2.5, "#ffb02e"); line([4, 22, 4, 28], 2.5, "#ffb02e");
});
add("owl", "Owl", "Animals", 62, 76, "char", CH, c => {
  const p = pose(c); X.save(); X.translate(0, p.bob);
  E(0, 8, 28, 34, "#8a5a32"); E(0, 16, 18, 24, "#e9c79a", 0, true);
  for (let i = 0; i < 3; i++) { X.beginPath(); X.arc(-6 + i * 6, 18 + (i % 2) * 6, 3, 0, Math.PI); X.strokeStyle = "#b48650"; X.lineWidth = 1.5; X.stroke(); }
  P([-22, -22, -16, -38, -8, -24], "#8a5a32"); P([22, -22, 16, -38, 8, -24], "#8a5a32");
  C(-10, -12, 11, "#f6e3c4"); C(10, -12, 11, "#f6e3c4"); eye(-10, -12, 7, 0); eye(10, -12, 7, 0);
  P([-4, -4, 4, -4, 0, 4], "#ffb02e");
  E(-26, p.up ? -6 : 10, 7, 18, "#6e4424", p.up ? -0.8 : 0.2); E(26, p.up ? -6 : 10, 7, 18, "#6e4424", p.up ? 0.8 : -0.2);
  E(-8, 42, 6, 3, "#ffb02e"); E(8, 42, 6, 3, "#ffb02e");
  X.restore();
});
add("fish", "Fish", "Animals", 76, 52, "thing", ["still", "swim 1", "swim 2"], c => {
  const w = c === 1 ? 6 : c === 2 ? -6 : 0;
  P([-20, 0, -40, -16 + w, -40, 16 + w], "#ff7b2e");
  E(0, 0, 26, 18, "#ff9a3c"); B([-6, -16, 4, -28, 12, -16], "#ff7b2e"); B([0, 14, -6, 24, 8, 16], "#ff7b2e");
  X.save(); X.globalAlpha = .9; line([-6, -15, -6, 15], 4, "#ffffff"); X.restore();
  eye(13, -4, 5.5); smile(19, 6, 3);
});
add("shark", "Shark", "Animals", 100, 50, "thing", ["still", "swim 1", "swim 2"], c => {
  const w = c === 1 ? 6 : c === 2 ? -6 : 0;
  P([-34, 0, -54, -18 + w, -50, 0, -54, 16 + w], "#7d94b3");
  B([-40, 0, -10, -20, 30, -12, 44, 2, 20, 16, -20, 14], "#8fa8c8");
  B([-20, 6, 10, 14, 34, 6, 20, 16, -10, 16], "#ffffff", 1);
  P([-6, -16, 2, -36, 12, -15], "#7d94b3"); P([-4, 10, -14, 26, 8, 12], "#7d94b3");
  dotEye(24, -4, 3); P([28, 6, 40, 4, 38, 8, 30, 10], "#ffffff");
  line([10, -4, 10, 6], 1.5, "#5d7090"); line([14, -4, 14, 6], 1.5, "#5d7090");
});
add("octopus", "Octopus", "Animals", 70, 80, "char", CH, c => {
  const p = pose(c), k = "#b45ce0";
  for (let i = 0; i < 5; i++) { const x = -20 + i * 10, s = (i % 2 ? 1 : -1) * (p.sw || 0.6) * 6; L([x, 12, x + s, 28, x - s, p.up ? 34 : 42], 7, k); }
  E(0, -6, 26, 26, k); shine(-10, -18, 7, 4);
  eye(-6, -6, 6.5); eye(10, -6, 6.5); smile(2, 6, 5); cheek(-14, 4); cheek(18, 4);
});
add("bee", "Bee", "Animals", 64, 52, "thing", ["wings up", "wings down"], c => {
  X.globalAlpha = .75; E(-4, c ? -14 : -20, 9, 14, "#dff3ff", c ? 0.6 : -0.3); E(6, c ? -14 : -20, 9, 14, "#dff3ff", c ? -0.2 : 0.4); X.globalAlpha = 1;
  P([-24, 2, -34, 4, -24, 8], "#2b2b33");
  E(0, 4, 24, 16, "#ffcf2e");
  X.save(); rpath(-24, -12, 48, 32, 16); X.clip(); X.fillStyle = "#2b2b33"; X.fillRect(-12, -14, 7, 36); X.fillRect(2, -14, 7, 36); X.restore();
  X.beginPath(); X.ellipse(0, 4, 24, 16, 0, 0, TAU); X.lineWidth = LW; X.strokeStyle = OL("#ffcf2e"); X.stroke();
  C(22, 0, 11, "#2b2b33"); eye(24, -2, 4.5); line([20, -10, 24, -22], 2, "#2b2b33"); C(24, -23, 2.5, "#2b2b33");
});
add("butterfly", "Butterfly", "Animals", 70, 60, "thing", ["open", "closed"], c => {
  const s = c ? 0.45 : 1;
  X.save(); X.scale(s, 1);
  B([0, -2, -26, -30, -36, -6, -10, 4], "#ff6fb5"); B([0, 4, -24, 26, -10, 24], "#ffb03b");
  B([0, -2, 26, -30, 36, -6, 10, 4], "#ff6fb5"); B([0, 4, 24, 26, 10, 24], "#ffb03b");
  C(-20, -12, 5, "#ffffff", 1); C(20, -12, 5, "#ffffff", 1);
  X.restore();
  E(0, 6, 4, 18, "#3a2a4a"); C(0, -14, 5, "#3a2a4a"); line([0, -18, -6, -28], 1.5, "#3a2a4a"); line([0, -18, 6, -28], 1.5, "#3a2a4a");
});
add("snail", "Snail", "Animals", 70, 56, "char", CH, c => {
  const p = pose(c), st = p.sw * 3;
  B([-30, 26, -10, 24, 22 + st, 24, 34 + st, 12, 30 + st, 26], "#c9e07a");
  line([26 + st, 10, 26 + st, -6], 3, "#a8c158"); line([32 + st, 10, 36 + st, -4], 3, "#a8c158");
  dotEye(26 + st, -8, 3); dotEye(36 + st, -6, 3); smile(30 + st, 18, 3);
  C(-4, 6, 22, "#d98b4a"); X.beginPath(); for (let a = 0; a < 12; a += .2) { const r = 18 - a * 1.4; X.lineTo(-4 + Math.cos(a) * r, 6 + Math.sin(a) * r); } X.lineWidth = 3; X.strokeStyle = "#9a5a26"; X.stroke();
});

/* ------------------------------------------------------------ people */
const ppl = (k, n, o) => add(k, n, "People", 50, 96, "char", CH, c => person(o, c));
ppl("boy", "Boy", { skin: "#f5c7a1", hair: "#6b3f1f", shirt: "#3d8bff", pants: "#2c3e66", shoes: "#e14b4b" });
ppl("girl", "Girl", { skin: "#e8b48c", hair: "#2b1b14", hairBack: 46, shirt: "#ff6fa8", pants: "#5b3fa0", shoes: "#ffffff", dress: 1 });
ppl("kid", "Kid", { skin: "#8d5a3b", hair: "#1d1410", shirt: "#ffcc33", pants: "#3a7d44", shoes: "#2b2b33",
  hat: () => { X.beginPath(); X.arc(2, -24, 20, Math.PI, TAU); X.closePath(); fs("#e14b4b"); R(6, -28, 26, 6, 3, "#e14b4b"); } });
ppl("wizard", "Wizard", { skin: "#f5c7a1", shirt: "#5a3fc0", pants: "#4a32a0", shoes: "#3a2a6a", dress: 1,
  hat: () => { P([-20, -30, 26, -30, 6, -76], "#5a3fc0"); E(3, -30, 26, 6, "#4a32a0"); P([4, -52, 6, -46, 12, -46, 7, -42, 9, -36, 4, -40, -1, -36, 1, -42, -4, -46, 2, -46], "#ffd23f", 1); },
  face: () => { B([2, -8, 26, -10, 18, 14, 8, 4], "#eeeeee"); },
  hold: (f) => { line([f[0] + 2, f[1] + 16, f[0] + 6, f[1] - 30], 4, "#8a5a32"); C(f[0] + 6, f[1] - 32, 6, "#7ae0ff"); } });
ppl("knight", "Knight", { skin: "#f5c7a1", shirt: "#a9b4c4", sleeve: "#a9b4c4", pants: "#8893a6", shoes: "#5d6678", glove: "#a9b4c4",
  hat: () => { X.beginPath(); X.arc(2, -20, 22, 0, TAU); fs("#bcc6d6"); R(-6, -26, 30, 12, 4, "#5d6678"); line([4, -20, 22, -20], 2, "#2b2f45"); B([-6, -42, 0, -56, 10, -54, 4, -40], "#e14b4b"); },
  bodyMark: () => { P([-3, 3, 7, 3, 7, 12, 2, 18, -3, 12], "#e14b4b"); },
  hold: (f) => { line([f[0], f[1], f[0] + 6, f[1] - 34], 4, "#d9e1ee"); line([f[0] - 6, f[1] - 2, f[0] + 6, f[1] - 2], 4, "#8a5a32"); } });
ppl("astronaut", "Astronaut", { skin: "#f5c7a1", shirt: "#f2f4f8", sleeve: "#f2f4f8", pants: "#e2e6ee", shoes: "#9aa3b5", glove: "#e14b4b",
  bodyMark: () => { R(-6, 4, 12, 9, 2, "#3d8bff"); },
  back: () => { R(-22, -4, 12, 26, 4, "#c3cad6"); },
  hat: () => { X.globalAlpha = .35; C(2, -20, 25, "#9fd8ff"); X.globalAlpha = 1; X.beginPath(); X.arc(2, -20, 25, 0, TAU); X.lineWidth = 4; X.strokeStyle = "#c3cad6"; X.stroke(); shine(-8, -32, 6, 3); } });
ppl("ninja", "Ninja", { skin: "#f5c7a1", hair: "#22232e", shirt: "#22232e", pants: "#22232e", shoes: "#11121a", mask: "#22232e",
  hat: () => { X.beginPath(); X.arc(2, -20, 21, 0, TAU); fs("#22232e"); R(-19, -24, 40, 10, 4, "#f5c7a1", 1); L([-18, -26, -30, -30, -34, -20], 4, "#e14b4b"); },
  bodyMark: () => { R(-11, 12, 22, 4, 2, "#e14b4b", 1); } });
ppl("pirate", "Pirate", { skin: "#e8b48c", shirt: "#ffffff", pants: "#2c3e66", shoes: "#3a2a1a", patch: 1,
  bodyMark: () => { line([-8, 4, -8, 22], 3, "#e14b4b"); line([8, 4, 8, 22], 3, "#e14b4b"); },
  hat: () => { X.beginPath(); X.arc(2, -24, 21, Math.PI * 1.05, Math.PI * 1.95); X.closePath(); fs("#e14b4b"); C(-18, -26, 4, "#e14b4b"); for (let i = 0; i < 3; i++) C(-6 + i * 8, -34, 2, "#ffffff", 1); } });
ppl("princess", "Princess", { skin: "#f5d0b0", hair: "#f2c14e", hairBack: 54, shirt: "#c77dff", pants: "#f5d0b0", shoes: "#c77dff", dress: 1,
  hat: () => { P([-12, -38, -12, -50, -4, -44, 2, -54, 8, -44, 16, -50, 16, -38], "#ffd23f"); C(2, -48, 2, "#ff4f8b", 1); } });
ppl("chef", "Chef", { skin: "#f5c7a1", hair: "#6b3f1f", shirt: "#ffffff", pants: "#3a3a48", shoes: "#2b2b33",
  hat: () => { R(-12, -46, 28, 14, 3, "#ffffff"); C(-8, -50, 9, "#ffffff"); C(4, -54, 10, "#ffffff"); C(14, -50, 8, "#ffffff"); },
  bodyMark: () => { C(0, 6, 2, "#e14b4b", 1); C(0, 14, 2, "#e14b4b", 1); } });
ppl("robotkid", "Superhero", { skin: "#f5c7a1", hair: "#2b1b14", shirt: "#e14b4b", pants: "#2f6fe1", shoes: "#e14b4b", mask: "#2f6fe1",
  back: (p) => { P([-8, -2, 8, -2, -18 - p.sw * 4, 40, -30 - p.sw * 4, 30], "#ffcc33"); },
  bodyMark: () => { P([-5, 4, 5, 4, 0, 14], "#ffcc33"); } });

/* ------------------------------------------------------------ fantasy */
add("dragon", "Dragon", "Fantasy", 80, 96, "char", CH, c => {
  const p = pose(c), g = "#8a5be0", b = "#ffd27a";
  X.save(); X.translate(0, p.bob);
  L([-14, 26, -40, 34, -42, 14], 9, g); P([-44, 16, -50, 6, -38, 8], "#ff6f6f");
  B([-6, 0, -34, -34 + (p.up ? -10 : 0), -38, -6, -24, 6], "#b48bff");
  const lf = p.up ? [-12, 36] : [-6 - p.sw * 8, 43]; L([-6, 26, lf[0], lf[1] - 2], 10, g); E(lf[0] + 2, lf[1], 8, 5, g);
  E(0, 16, 18, 18, g); E(5, 20, 10, 12, b, 0, true); for (let i = 0; i < 3; i++) line([-1, 12 + i * 6, 11, 12 + i * 6], 1.5, "#e0a84a");
  const ff = p.up ? [12, 35] : [6 + p.sw * 8, 43]; L([6, 26, ff[0], ff[1] - 2], 10, g); E(ff[0] + 2, ff[1], 8, 5, g);
  P([-10, -30, -16, -50, -2, -36], "#ffd27a"); P([4, -36, 6, -56, 14, -36], "#ffd27a");
  E(4, -18, 24, 21, g); B([14, -14, 34, -18, 38, -6, 22, 0], g);
  C(34, -12, 1.8, "#3a2050", 1); eye(8, -22, 6.5); eye(20, -24, 5.5); smile(26, -2, 4); cheek(10, -8);
  P([-18, -14, -26, -10, -18, -6], "#ff6f6f"); P([-20, -2, -28, 2, -18, 4], "#ff6f6f");
  const fa = p.up ? [16, -8] : [14 - p.sw * 6, 20]; L([6, 8, fa[0], fa[1]], 7, g);
  X.restore();
});
add("dino", "Dino", "Fantasy", 80, 90, "char", CH, c => {
  const p = pose(c), g = "#4cc46b";
  X.save(); X.translate(0, p.bob);
  for (let i = 0; i < 4; i++) P([-30 + i * 9, 6 - i * 6, -24 + i * 9, -6 - i * 6, -20 + i * 9, 4 - i * 6], "#ffb02e");
  L([-10, 24, -36, 34, -44, 18], 11, g);
  const lf = p.up ? [-12, 36] : [-4 - p.sw * 8, 43]; L([-4, 24, lf[0], lf[1] - 2], 11, g); E(lf[0] + 3, lf[1], 9, 5, g);
  E(0, 14, 20, 20, g); E(6, 18, 11, 13, "#c9f2a6", 0, true);
  const ff = p.up ? [12, 35] : [8 + p.sw * 8, 43]; L([8, 24, ff[0], ff[1] - 2], 11, g); E(ff[0] + 3, ff[1], 9, 5, g);
  B([0, -10, 6, -36, 38, -34, 42, -16, 24, -6], g);
  eye(16, -26, 6); C(38, -28, 1.6, "#1d4a2a", 1); line([22, -14, 38, -16], 2.5, "#1d4a2a");
  P([26, -15, 28, -10, 30, -15], "#ffffff", 1); P([31, -15, 33, -10, 35, -16], "#ffffff", 1);
  const fa = p.up ? [20, -2] : [18 - p.sw * 4, 14]; L([10, 6, fa[0], fa[1]], 5, g);
  X.restore();
});
add("ghost", "Ghost", "Fantasy", 60, 76, "thing", ["float 1", "float 2", "boo!"], c => {
  const w = c === 1 ? 4 : 0;
  X.beginPath(); X.moveTo(-26, 34); X.lineTo(-26, -6); X.arc(0, -6, 26, Math.PI, TAU); X.lineTo(26, 34);
  for (let i = 0; i < 4; i++) X.quadraticCurveTo(26 - i * 13 - 6.5, (i % 2 ? 26 : 42) + (i % 2 ? w : -w), 26 - (i + 1) * 13, 34);
  X.closePath(); X.globalAlpha = .95; fs("#f5f6ff"); X.globalAlpha = 1;
  if (c === 2) { E(-8, -8, 6, 8, "#1d1d2b"); E(10, -8, 6, 8, "#1d1d2b"); E(1, 12, 8, 10, "#1d1d2b"); }
  else { dotEye(-8, -8, 5); dotEye(10, -8, 5); X.beginPath(); X.ellipse(1, 8, 5, 4, 0, 0, Math.PI); X.fillStyle = "#3a3a4a"; X.fill(); cheek(-14, 2); cheek(18, 2); }
  L([-24, 4, -36, 10 - w], 7, "#f5f6ff"); L([24, 4, 36, 10 + w], 7, "#f5f6ff");
});
add("robot", "Robot", "Fantasy", 60, 96, "char", CH, c => {
  const p = pose(c), m = "#b8c4d6";
  X.save(); X.translate(0, p.bob);
  const lf = p.up ? [-10, 36] : [-6 - p.sw * 6, 42], ff = p.up ? [10, 34] : [6 + p.sw * 6, 42];
  L([-6, 24, lf[0], lf[1] - 3], 7, "#8a96aa"); R(lf[0] - 6, lf[1] - 4, 14, 7, 2, "#5d6678");
  L([-10, 6, p.up ? -20 : -16 + p.sw * 4, p.up ? -8 : 20], 6, "#8a96aa");
  R(-18, -2, 36, 28, 6, m); R(-10, 4, 20, 14, 3, "#5d6678"); C(-4, 11, 3, "#ff4f6a", 1); C(4, 11, 3, "#3fe07a", 1);
  L([6, 24, ff[0], ff[1] - 3], 7, "#8a96aa"); R(ff[0] - 6, ff[1] - 4, 14, 7, 2, "#5d6678");
  line([0, -40, 0, -50], 3, "#5d6678"); C(0, -52, 4, "#ff4f6a");
  R(-20, -42, 40, 34, 8, m); R(-14, -36, 30, 22, 5, "#1d2b44");
  X.fillStyle = "#3fe0ff"; R(-9, -30, 7, 8, 2, "#3fe0ff", 1); R(5, -30, 7, 8, 2, "#3fe0ff", 1);
  line([-6, -18, 8, -18], 2.5, "#3fe0ff");
  C(-22, -26, 4, "#8a96aa"); C(22, -26, 4, "#8a96aa");
  const fa = p.up ? [20, -10] : [16 - p.sw * 4, 20]; L([10, 6, fa[0], fa[1]], 6, "#8a96aa"); C(fa[0], fa[1], 4.5, "#5d6678");
  X.restore();
});
add("alien", "Alien", "Fantasy", 56, 90, "char", CH, c => {
  const p = pose(c), g = "#7be05a";
  X.save(); X.translate(0, p.bob);
  const lf = p.up ? [-10, 36] : [-5 - p.sw * 7, 43], ff = p.up ? [10, 34] : [5 + p.sw * 7, 43];
  L([-5, 24, lf[0], lf[1] - 2], 7, g); E(lf[0] + 2, lf[1], 6, 4, g);
  E(0, 14, 14, 16, "#a5a5ff"); R(-14, 8, 28, 4, 2, "#7272d8", 1);
  L([5, 24, ff[0], ff[1] - 2], 7, g); E(ff[0] + 2, ff[1], 6, 4, g);
  line([-8, -38, -14, -54], 2.5, g); line([10, -38, 16, -54], 2.5, g); C(-14, -55, 4, "#ffd23f"); C(16, -55, 4, "#ffd23f");
  E(1, -20, 24, 21, g);
  E(-7, -22, 8, 10, "#1d1d2b", -0.3); E(11, -22, 8, 10, "#1d1d2b", 0.3); C(-5, -26, 2.5, "#fff", 1); C(13, -26, 2.5, "#fff", 1);
  smile(2, -6, 4, "#2a5a20");
  const fa = p.up ? [16, -8] : [14 - p.sw * 5, 20]; L([6, 6, fa[0], fa[1]], 5, g);
  X.restore();
});
add("monster", "Monster", "Fantasy", 70, 84, "char", CH, c => {
  const p = pose(c), f = "#4fb3ff";
  X.save(); X.translate(0, p.bob);
  const lf = p.up ? [-14, 36] : [-10 - p.sw * 6, 43], ff = p.up ? [14, 34] : [10 + p.sw * 6, 43];
  L([-10, 28, lf[0], lf[1] - 2], 11, f); L([10, 28, ff[0], ff[1] - 2], 11, f);
  P([-20, -26, -26, -44, -10, -32], "#ffffff"); P([20, -26, 26, -44, 10, -32], "#ffffff");
  const fur = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = i % 2 ? 30 : 34; fur.push(Math.cos(a) * r, 4 + Math.sin(a) * r); }
  B(fur, f);
  eye(2, -8, 12, .2); grin(2, 12, 11); P([-6, 12, -2, 12, -4, 17], "#ffffff", 1); P([8, 12, 12, 12, 10, 17], "#ffffff", 1);
  const fa = p.up ? [34, -14] : [34 - p.sw * 4, 14]; L([24, 2, fa[0], fa[1]], 8, f);
  L([-24, 2, p.up ? -34 : -32 + p.sw * 4, p.up ? -14 : 14], 8, f);
  X.restore();
});
add("slime", "Slime", "Fantasy", 64, 52, "char", ["still", "squish", "stretch", "jump"], c => {
  const sx = c === 1 ? 1.15 : c === 2 ? 0.9 : c === 3 ? 0.85 : 1, sy = c === 1 ? 0.85 : c === 2 ? 1.1 : c === 3 ? 1.2 : 1;
  X.save(); X.translate(0, 46); X.scale(sx, sy);
  X.beginPath(); X.moveTo(-32, 0); X.quadraticCurveTo(-34, -46, 0, -48); X.quadraticCurveTo(34, -46, 32, 0); X.closePath();
  X.globalAlpha = .92; fs("#5ee06b"); X.globalAlpha = 1; shine(-14, -34, 8, 4);
  dotEye(-4, -24, 4.5); dotEye(14, -24, 4.5); smile(5, -12, 4, "#1d5a20"); cheek(-12, -14); cheek(22, -14);
  X.restore();
});
add("unicornfly", "Pegasus", "Fantasy", 62, 96, "char", CH, c => {
  critter({ fur: "#fff4c8", belly: "#ffffff", snout: "#fff9e6", ears: "pig", tail: "fluffy", tip: "#ffd23f", nose: "#e0a84a", noseR: 2.5, paw: "#e0c870",
    extra: (p) => { B([-6, 2, -30, -24 + (p.up ? -10 : 0), -34, -2, -18, 10], "#ffffff"); B([-22, -30, -14, -42, -2, -40, -10, -30, -20, -20], "#ffd23f"); } }, c);
});
add("bat", "Bat", "Fantasy", 80, 50, "thing", ["wings up", "wings down"], c => {
  const u = c ? 14 : -14;
  B([-6, -2, -40, -10 + u, -32, 6 + u * .3, -20, 4, -10, 10], "#5a3f80"); B([6, -2, 40, -10 + u, 32, 6 + u * .3, 20, 4, 10, 10], "#5a3f80");
  E(0, 2, 13, 14, "#6e4fa0"); P([-10, -8, -8, -20, -2, -10], "#6e4fa0"); P([10, -8, 8, -20, 2, -10], "#6e4fa0");
  eye(-5, 0, 4.2, 0); eye(5, 0, 4.2, 0); P([-3, 8, -1, 12, 1, 8], "#ffffff", 1); P([2, 8, 4, 12, 5, 8], "#ffffff", 1);
});

/* ------------------------------------------------------------ food */
const food = (k, n, w, h, d, costumes) => add(k, n, "Food", w, h, "thing", costumes || ["still"], d);
food("apple", "Apple", 44, 48, () => { B([0, -12, 22, -16, 22, 14, 0, 22, -22, 14, -22, -16], "#ec3b3b"); shine(-10, -6, 5, 3); line([0, -12, 2, -24], 3, "#6b3f1f"); E(9, -22, 8, 4, "#4cc46b", -0.4); });
food("banana", "Banana", 50, 36, () => { X.beginPath(); X.moveTo(-24, -8); X.quadraticCurveTo(-4, 26, 26, -6); X.quadraticCurveTo(-2, 10, -24, -8); fs("#ffd93b"); line([-24, -8, -27, -12], 4, "#6b4f1f"); });
food("strawberry", "Strawberry", 40, 46, () => { B([0, -12, 20, -12, 14, 14, 0, 24, -14, 14, -20, -12], "#ff3d5a"); for (let i = 0; i < 7; i++) C(-10 + (i % 4) * 7, -2 + Math.floor(i / 4) * 9 + (i % 2) * 3, 1.3, "#ffe08a", 1); P([-14, -14, -6, -22, 0, -16, 6, -22, 14, -14, 0, -10], "#3fae4a"); });
food("pizza", "Pizza", 50, 48, () => { P([-22, -18, 22, -18, 0, 26], "#ffcf6a"); R(-24, -24, 48, 9, 4, "#d9883a"); C(-8, -6, 4.5, "#e1453a"); C(7, -4, 4.5, "#e1453a"); C(0, 8, 4, "#e1453a"); });
food("donut", "Donut", 50, 44, () => { E(0, 2, 24, 20, "#e0a35a"); B([-22, -2, -14, -16, 4, -18, 20, -10, 22, 4, 8, 4, -6, 10], "#ff8fc1", 1); E(0, 0, 7, 5, "#2b2440"); X.beginPath(); X.ellipse(0, 0, 7, 5, 0, 0, TAU); X.lineWidth = 2; X.strokeStyle = "#9a6030"; X.stroke(); [[-12, -6], [8, -10], [14, -2], [-6, -12]].forEach(([x, y], i) => line([x, y, x + 3, y + 2], 2, ["#fff", "#3fd0ff", "#ffd23f", "#7be05a"][i])); });
food("cake", "Cake", 50, 50, () => { R(-22, -4, 44, 26, 4, "#ffe4ec"); R(-22, -4, 44, 8, 4, "#ff8fc1", 1); line([0, -6, 0, -18], 3, "#3fd0ff"); B([0, -26, 3, -20, 0, -17, -3, -20], "#ffb02e"); C(-12, -6, 3, "#ff3d5a"); C(12, -6, 3, "#ff3d5a"); });
food("cookie", "Cookie", 44, 44, () => { C(0, 0, 21, "#d9a05a"); [[-8, -8], [6, -10], [10, 4], [-4, 6], [-12, 4], [2, 14]].forEach(([x, y]) => C(x, y, 2.6, "#5a3a22", 1)); });
food("carrot", "Carrot", 30, 52, () => { P([-9, -14, 9, -14, 0, 26], "#ff8c1a"); line([-4, -4, 1, -4], 1.5, "#c9600a"); line([-2, 6, 3, 6], 1.5, "#c9600a"); P([-2, -14, -8, -26, 0, -18, 6, -28, 3, -14], "#4cc46b"); });
food("bone", "Bone", 56, 26, () => { X.beginPath(); C(-22, -6, 6, "#f4efe0"); C(-22, 6, 6, "#f4efe0"); C(22, -6, 6, "#f4efe0"); C(22, 6, 6, "#f4efe0"); R(-22, -5, 44, 10, 3, "#f4efe0"); C(-22, -6, 5, "#f4efe0", 1); C(-22, 6, 5, "#f4efe0", 1); C(22, -6, 5, "#f4efe0", 1); C(22, 6, 5, "#f4efe0", 1); });

/* ------------------------------------------------------------ things */
const thing = (k, n, w, h, d, costumes, kind) => add(k, n, "Things", w, h, kind || "thing", costumes || ["still"], d);
function star(r, f) { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push(Math.cos(a) * rr, Math.sin(a) * rr); } P(pts, f); }
thing("star", "Star", 48, 46, () => { star(24, "#ffd23f"); shine(-6, -8, 4, 2.5); dotEye(-5, 0, 2.6); dotEye(5, 0, 2.6); smile(0, 7, 3); });
thing("coin", "Coin", 40, 40, c => { const s = [1, 0.6, 0.15, 0.6][c]; X.save(); X.scale(s, 1); C(0, 0, 18, "#ffcc33"); C(0, 0, 12, "#ffdd66", 1); X.restore(); if (c === 0) { line([0, -7, 0, 7], 4, "#d99a00"); } shine(-6 * s, -8, 3 * s + .5, 2); }, ["front", "turn 1", "edge", "turn 2"]);
thing("gem", "Gem", 44, 40, () => { P([-20, -6, -10, -18, 10, -18, 20, -6, 0, 20], "#3fd0ff"); P([-10, -18, -4, -6, 4, -6, 10, -18], "#9cecff", 1); P([-20, -6, 20, -6, 0, 20], "#2bb0e0", 1); shine(-8, -12, 3, 2); X.beginPath(); poly([-20, -6, -10, -18, 10, -18, 20, -6, 0, 20]); X.lineWidth = LW; X.strokeStyle = OL("#3fd0ff"); X.stroke(); });
thing("heart", "Heart", 46, 42, () => { X.beginPath(); X.moveTo(0, 20); X.bezierCurveTo(-30, 0, -22, -24, 0, -10); X.bezierCurveTo(22, -24, 30, 0, 0, 20); fs("#ff3d6a"); shine(-9, -8, 5, 3); });
thing("key", "Key", 52, 30, () => { C(-14, 0, 11, "#ffcc33"); C(-14, 0, 4.5, "#2b2440", 1); R(-4, -3, 30, 7, 2, "#ffcc33"); R(16, 3, 4, 7, 1, "#ffcc33"); R(22, 3, 4, 6, 1, "#ffcc33"); });
thing("chest", "Treasure Chest", 60, 46, c => {
  R(-26, -4, 52, 26, 3, "#a8642a"); R(-26, 6, 52, 4, 1, "#7a4418", 1);
  if (c) { P([-26, -4, 26, -4, 22, -28, -22, -28], "#c47a36"); C(-6, -6, 5, "#ffcc33"); C(6, -8, 5, "#ffcc33"); C(0, -10, 5, "#3fd0ff"); }
  else { X.beginPath(); X.moveTo(-26, -4); X.quadraticCurveTo(0, -26, 26, -4); X.closePath(); fs("#c47a36"); }
  R(-5, -8, 10, 12, 2, "#ffcc33");
}, ["closed", "open"]);
thing("door", "Door", 46, 80, c => {
  R(-22, -38, 44, 76, 20, "#6b4424");
  if (c) { R(-18, -34, 36, 72, 16, "#1d1d2b"); P([-18, -30, -6, -24, -6, 36, -18, 38], "#b97a44"); }
  else { R(-18, -34, 36, 72, 16, "#b97a44"); line([-6, -26, -6, 34], 2, "#8a5a32"); line([6, -26, 6, 34], 2, "#8a5a32"); C(11, 4, 3, "#ffcc33"); }
}, ["closed", "open"]);
thing("flag", "Flag", 44, 80, c => {
  line([-14, 40, -14, -38], 4, "#8a8a9a"); C(-14, -40, 4, "#ffcc33");
  const w = c ? 5 : -5;
  X.beginPath(); X.moveTo(-12, -36); X.quadraticCurveTo(4, -36 + w, 22, -34); X.lineTo(22, -12); X.quadraticCurveTo(4, -14 + w, -12, -14); X.closePath(); fs("#ff3d5a");
  X.save(); X.translate(5, -25 + w / 2); star(5, "#ffffff"); X.restore();
}, ["wave 1", "wave 2"]);
thing("trophy", "Trophy", 46, 56, () => { L([-14, -16, -26, -12, -16, 2], 4, "#ffcc33"); L([14, -16, 26, -12, 16, 2], 4, "#ffcc33"); B([-16, -22, 16, -22, 12, 4, 0, 10, -12, 4], "#ffcc33"); R(-4, 8, 8, 10, 1, "#e0a800"); R(-14, 18, 28, 8, 2, "#8a5a32"); shine(-8, -14, 3, 5); });
thing("ball", "Ball", 40, 40, c => { X.save(); X.rotate(c * Math.PI / 2); C(0, 0, 18, "#ffffff"); P([0, -7, 7, -2, 4, 6, -4, 6, -7, -2], "#2b2b33", 1); [0, 1, 2, 3, 4].forEach(i => { const a = -Math.PI / 2 + i * TAU / 5; P([Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a - .3) * 13, Math.sin(a - .3) * 13, Math.cos(a + .3) * 13, Math.sin(a + .3) * 13], "#2b2b33", 1); }); X.restore(); }, ["still", "roll 1", "roll 2", "roll 3"]);
thing("basketball", "Basketball", 40, 40, () => { C(0, 0, 18, "#ff8c2e"); line([-18, 0, 18, 0], 1.8, "#8a3a0a"); line([0, -18, 0, 18], 1.8, "#8a3a0a"); X.beginPath(); X.arc(-24, 0, 16, -0.8, 0.8); X.arc(24, 0, 16, Math.PI - .8, Math.PI + .8); X.strokeStyle = "#8a3a0a"; X.lineWidth = 1.8; X.stroke(); });
thing("balloon", "Balloon", 40, 70, () => { line([0, 16, -2, 30, 2, 40], 1.5, "#666"); E(0, -8, 17, 21, "#ff4f8b"); P([-4, 14, 4, 14, 0, 18], "#ff4f8b"); shine(-7, -16, 4, 6); });
thing("rocket", "Rocket", 44, 86, c => {
  if (c) { B([-8, 28, 8, 28, 4, 46, 0, 40, -4, 46], "#ffb02e"); B([-4, 28, 4, 28, 0, 38], "#fff3a0", 1); }
  P([-10, 14, -20, 30, -8, 24], "#e14b4b"); P([10, 14, 20, 30, 8, 24], "#e14b4b");
  B([0, -40, 14, -20, 12, 24, -12, 24, -14, -20], "#f2f4f8"); X.beginPath(); X.moveTo(-9, -26); X.quadraticCurveTo(0, -46, 9, -26); X.closePath(); fs("#e14b4b");
  C(0, -6, 7, "#5ac8ff"); shine(-3, -9, 2, 1.5); R(-8, 22, 16, 6, 2, "#8a96aa");
}, ["still", "blast off"]);
thing("car", "Car", 90, 50, c => {
  const r = c * 0.8;
  B([-40, 10, -38, -4, -20, -6, -10, -22, 16, -22, 26, -6, 40, -2, 42, 12], "#ff4f4f");
  P([-6, -18, 6, -18, 6, -6, -14, -6], "#bfe9ff"); P([10, -18, 15, -18, 22, -6, 10, -6], "#bfe9ff");
  C(36, 0, 3, "#ffe36a", 1);
  [-24, 24].forEach(x => { C(x, 12, 10, "#2b2b33"); C(x, 12, 4, "#c3cad6", 1); line([x, 12, x + Math.cos(r) * 7, 12 + Math.sin(r) * 7], 2, "#c3cad6"); });
}, ["still", "drive"]);
thing("bomb", "Bomb", 46, 50, c => { C(-2, 6, 18, "#2b2b3a"); R(-6, -16, 10, 8, 2, "#4a4a5a"); L([0, -16, 6, -24, 14, -22], 2.5, "#c9a06a"); shine(-9, -2, 4, 3); if (c) { star(7, "#ffd23f"); X.save(); X.translate(15, -23); star(6, "#ffd23f"); X.restore(); } }, ["off", "lit"]);
thing("fire", "Fire", 40, 50, c => { const w = c ? 3 : -3; B([0, -24 + w, 16, -2, 14, 18, 0, 22, -14, 18, -16, -2, -6, -10], "#ff6a2e"); B([0, -8 - w, 9, 6, 7, 16, -7, 16, -9, 6], "#ffd23f", 1); }, ["flicker 1", "flicker 2"]);
thing("lightning", "Lightning", 34, 54, () => { P([4, -26, -12, 4, -2, 4, -6, 26, 12, -6, 2, -6, 8, -26], "#ffe23f"); });
thing("sun", "Sun", 60, 60, () => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; P([Math.cos(a - .12) * 20, Math.sin(a - .12) * 20, Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a + .12) * 20, Math.sin(a + .12) * 20], "#ffb02e"); } C(0, 0, 20, "#ffd93b"); dotEye(-6, -3, 2.6); dotEye(6, -3, 2.6); smile(0, 6, 5); cheek(-11, 5); cheek(11, 5); });
thing("moon", "Moon", 48, 50, () => { X.beginPath(); X.arc(0, 0, 22, Math.PI * 0.3, Math.PI * 1.7); X.arc(10, -4, 18, Math.PI * 1.5, Math.PI * 0.5, true); X.closePath(); fs("#ffe9a3"); dotEye(-10, -2, 2.4); smile(-8, 8, 3); });
thing("present", "Present", 46, 46, () => { R(-20, -10, 40, 30, 3, "#3fb0ff"); R(-22, -16, 44, 9, 3, "#5ac8ff"); R(-4, -16, 8, 36, 1, "#ff4f8b", 1); B([0, -16, -12, -28, -14, -18], "#ff4f8b"); B([0, -16, 12, -28, 14, -18], "#ff4f8b"); });
thing("button", "Button", 50, 30, c => { R(-24, 4, 48, 10, 3, "#5d6678"); if (c) R(-16, 0, 32, 6, 3, "#c4303b"); else R(-16, -10, 32, 16, 6, "#ff4f5a"); }, ["up", "pressed"]);
thing("portal", "Portal", 54, 70, c => { const r = c * 0.6; X.save(); X.scale(.8, 1); for (let i = 0; i < 4; i++) { C(0, 0, 32 - i * 7, ["#6b3fd0", "#8a5be0", "#b48bff", "#e0ccff"][i]); } X.rotate(r); for (let i = 0; i < 4; i++) { X.rotate(TAU / 4); line([4, 0, 18, 12, 24, 0], 2.5, "#ffffff"); } X.restore(); }, ["swirl 1", "swirl 2"]);
thing("arrow", "Arrow sign", 50, 60, () => { line([0, 30, 0, -4], 5, "#8a5a32"); P([-20, -24, 10, -24, 22, -12, 10, 0, -20, 0], "#ffcc33"); P([-8, -15, 4, -15, 4, -19, 12, -12, 4, -5, 4, -9, -8, -9], "#5a3a22", 1); });

/* ------------------------------------------------------------ level pieces */
const piece = (k, n, w, h, d, kind) => add(k, n, "Level", w, h, kind || "solid", ["still"], d);
piece("grass", "Grass platform", 150, 36, () => { R(-75, -14, 150, 32, 8, "#a8642a"); B([-76, -8, -74, -18, 0, -20, 74, -18, 76, -8, 70, -4, 50, -8, 30, -2, 10, -8, -10, -2, -30, -8, -50, -2, -70, -6], "#5ec44a"); [[-50, 6], [-10, 10], [30, 4], [56, 10]].forEach(([x, y]) => C(x, y, 3, "#8a4f1e", 1)); });
piece("stone", "Stone platform", 150, 32, () => { R(-75, -16, 150, 32, 5, "#9aa3b5"); for (let i = 0; i < 5; i++) line([-75 + i * 30 + (i ? 0 : 0), -16, -75 + i * 30, 16], 2, "#6d7688"); line([-75, 0, 75, 0], 2, "#6d7688"); });
piece("cloudplat", "Cloud platform", 130, 36, () => { B([-62, 12, -64, -4, -40, -16, -10, -20, 20, -18, 50, -14, 64, 0, 60, 14], "#ffffff"); shine(-20, -10, 16, 3); });
piece("brick", "Brick", 48, 48, () => { R(-24, -24, 48, 48, 3, "#d65a32"); for (let y = 0; y < 4; y++) { line([-24, -24 + y * 12, 24, -24 + y * 12], 2, "#8a2f14"); for (let x = (y % 2) * 12; x < 48; x += 24) line([-24 + x, -24 + y * 12, -24 + x, -12 + y * 12], 2, "#8a2f14"); } });
piece("qblock", "? Block", 48, 48, c => { R(-24, -24, 48, 48, 5, c ? "#a8642a" : "#ffb02e"); [[-18, -18], [18, -18], [-18, 18], [18, 18]].forEach(([x, y]) => C(x, y, 2.4, "#8a4f1e", 1)); if (!c) { X.font = "900 30px system-ui,sans-serif"; X.textAlign = "center"; X.textBaseline = "middle"; X.lineWidth = 4; X.strokeStyle = "#8a4f1e"; X.strokeText("?", 0, 2); X.fillStyle = "#fff6d0"; X.fillText("?", 0, 2); } });
looks[looks.length - 1].costumes = ["full", "empty"];
piece("crate", "Crate", 48, 48, () => { R(-24, -24, 48, 48, 3, "#c98b52"); R(-18, -18, 36, 36, 1, "#b47640", 1); line([-18, -18, 18, 18], 5, "#8a5a32"); line([-18, -18, 18, 18], 3, "#d9a06a"); });
piece("ice", "Ice block", 48, 48, () => { R(-24, -24, 48, 48, 6, "#a8e4ff"); shine(-10, -12, 8, 3); line([6, 8, 14, 14], 2, "#ffffff"); });
piece("spikes", "Spikes", 96, 26, () => { for (let i = 0; i < 6; i++) P([-48 + i * 16, 12, -40 + i * 16, -14, -32 + i * 16, 12], "#c3cad6"); R(-48, 8, 96, 6, 2, "#6d7688"); }, "thing");
piece("lava", "Lava", 120, 28, c => { R(-60, -8, 120, 22, 4, "#ff5a1f"); B([-60, -4, -40, -14, -20, -4, 0, -14, 20, -4, 40, -14, 60, -4, 60, 4, -60, 4], "#ffb02e", 1); }, "thing");
piece("spring", "Spring", 44, 40, () => { R(-20, 12, 40, 8, 2, "#5d6678"); L([-12, 12, 12, 6, -12, 0, 12, -6], 3, "#c3cad6"); R(-20, -14, 40, 8, 3, "#ff4f5a"); }, "thing");
piece("ladder", "Ladder", 40, 100, () => { line([-14, -48, -14, 48], 5, "#a8642a"); line([14, -48, 14, 48], 5, "#a8642a"); for (let y = -40; y <= 40; y += 16) line([-14, y, 14, y], 4, "#c98b52"); }, "thing");
piece("tree", "Tree", 80, 110, () => { R(-8, 10, 16, 44, 4, "#8a5a32"); B([-34, 10, -38, -20, -20, -46, 10, -50, 34, -30, 38, 4, 14, 16], "#3fae4a"); shine(-14, -28, 8, 4); C(14, -14, 3, "#ff4f5a", 1); C(-18, -2, 3, "#ff4f5a", 1); }, "thing");
piece("cactus", "Cactus", 50, 70, () => { L([-10, 6, -20, 6, -20, -12], 9, "#4cb85a"); L([10, 0, 20, 0, 20, -18], 9, "#4cb85a"); R(-9, -32, 18, 66, 9, "#4cb85a"); line([0, -26, 0, 26], 1.5, "#2f8a3a"); C(0, -34, 4, "#ff6fb5"); }, "thing");
piece("mushroom", "Mushroom", 50, 50, () => { R(-9, 0, 18, 22, 6, "#fff1d6"); X.beginPath(); X.moveTo(-24, 4); X.quadraticCurveTo(-24, -24, 0, -24); X.quadraticCurveTo(24, -24, 24, 4); X.closePath(); fs("#ff3d4a"); C(-10, -10, 4, "#ffffff", 1); C(8, -14, 5, "#ffffff", 1); C(14, -2, 3, "#ffffff", 1); dotEye(-4, 10, 2); dotEye(4, 10, 2); }, "thing");
piece("cloud", "Cloud", 90, 44, () => { B([-40, 14, -42, 0, -24, -12, -4, -20, 18, -16, 34, -6, 42, 6, 36, 16], "#ffffff"); }, "thing");
piece("bush", "Bush", 70, 40, () => { B([-34, 18, -34, 0, -18, -14, 4, -18, 22, -12, 34, 2, 34, 18], "#3fae4a"); C(-12, 0, 2.5, "#ff6fb5", 1); C(14, -4, 2.5, "#ffd23f", 1); }, "thing");

window.ART = {
  looks,
  get: k => looks.find(l => l.k === k),
  draw(ctx, k, costume) {
    const l = looks.find(q => q.k === k); if (!l) return;
    X = ctx; X.save(); X.lineJoin = "round"; X.lineCap = "round";
    try { l.d(Math.max(0, Math.min(l.costumes.length - 1, costume | 0))); } finally { X.restore(); X = null; }
  },
};
})();
