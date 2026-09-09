/*! Shelf menu - a pause button and a way back to the game list, shared by
    every game on Sophia, Rory and Dylan Games. Load it first in <head>:
        <script src="../menu.js"></script>
    It pauses the game by holding its animation frames and suspending its
    sound, then shifts the frame clock on the way out so the game never sees
    the gap. Nothing in the game itself has to know about it. */
(function () {
"use strict";
if (window.__shelfMenu) return;
window.__shelfMenu = {};

/* ---------------------------------------------------------------- pause */
var paused = false, held = [], skew = 0, stoppedAt = 0;
var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : null;
var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };
if (raf) {
  window.requestAnimationFrame = function (cb) {
    if (paused) { held.push(cb); return -1; }
    return raf(function (ts) { cb(ts - skew); });
  };
}
/* keep a handle on every audio context the game makes, so sound stops too */
var acs = [];
["AudioContext", "webkitAudioContext"].forEach(function (key) {
  var C = window[key];
  if (typeof C !== "function" || typeof Proxy !== "function") return;
  try {
    window[key] = new Proxy(C, { construct: function (t, args) {
      var c = Reflect.construct(t, args); acs.push(c); return c;
    } });
  } catch (e) {}
});
/* Suspending and resuming a Godot export's audio leaves its page unable to
   navigate away, which would trap you in the game - the one thing this is
   here to prevent. Those games fall silent on their own once their frames
   stop, so leave their sound alone and only quiet the plain canvas games. */
function audioSafe() { return !window.Engine; }
function setPaused(on) {
  if (on === paused) return;
  paused = on;
  if (on) {
    stoppedAt = now();
    if (audioSafe()) acs.forEach(function (c) { try { if (c.state === "running") c.suspend(); } catch (e) {} });
  } else {
    skew += now() - stoppedAt;
    if (audioSafe()) acs.forEach(function (c) { try { if (c.state === "suspended") c.resume(); } catch (e) {} });
    var queue = held; held = [];
    queue.forEach(function (cb) { if (raf) raf(function (ts) { cb(ts - skew); }); });
  }
}
window.__shelfMenu.isPaused = function () { return paused; };
window.__shelfMenu.audio = function () { return acs.map(function (c) { return c.state; }); };

/* ------------------------------------------------------------------- ui */
function build() {
  if (document.getElementById("shelf-menu-btn")) return;
  var css = document.createElement("style");
  css.textContent = [
    "#shelf-menu-btn{position:fixed;z-index:2147483000;top:calc(7px + env(safe-area-inset-top));",
    "left:calc(7px + env(safe-area-inset-left));width:36px;height:36px;border-radius:11px;",
    "background:rgba(8,12,20,0.45);border:1.5px solid rgba(255,255,255,0.5);display:flex;",
    "align-items:center;justify-content:center;gap:4px;cursor:pointer;touch-action:manipulation;",
    "-webkit-tap-highlight-color:transparent;backdrop-filter:blur(2px)}",
    "#shelf-menu-btn i{display:block;width:4px;height:14px;border-radius:1.5px;background:rgba(255,255,255,0.92)}",
    "#shelf-menu-btn:active{background:rgba(8,12,20,0.75)}",
    "#shelf-menu-veil{position:fixed;z-index:2147483001;inset:0;display:none;align-items:center;",
    "justify-content:center;background:rgba(4,8,16,0.72);backdrop-filter:blur(3px);",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;",
    "-webkit-user-select:none;user-select:none;touch-action:manipulation}",
    "#shelf-menu-veil.on{display:flex}",
    "#shelf-menu-card{width:min(88vw,340px);background:rgba(16,22,34,0.96);border:1.5px solid rgba(255,255,255,0.18);",
    "border-radius:20px;padding:22px 20px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,0.5)}",
    "#shelf-menu-card h2{margin:0 0 2px;font-size:26px;color:#ffe14d;letter-spacing:0.5px}",
    "#shelf-menu-card p{margin:0 0 18px;font-size:14px;color:#aeb8c8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "#shelf-menu-card button{display:block;width:100%;margin:9px 0 0;padding:15px 10px;font-size:19px;",
    "font-weight:700;color:#fff;border:0;border-radius:14px;cursor:pointer;font-family:inherit;",
    "touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
    "#shelf-menu-resume{background:#2a8a3a}#shelf-menu-quit{background:#2a4a8a}",
    "#shelf-menu-card button:active{filter:brightness(1.25)}"
  ].join("");
  document.head.appendChild(css);

  var btn = document.createElement("div");
  btn.id = "shelf-menu-btn";
  btn.setAttribute("role", "button");
  btn.setAttribute("aria-label", "Pause");
  btn.innerHTML = "<i></i><i></i>";

  var veil = document.createElement("div");
  veil.id = "shelf-menu-veil";
  var title = (document.title || "This game").replace(/\s*[:–-].*$/, "");
  veil.innerHTML = '<div id="shelf-menu-card"><h2>PAUSED</h2><p></p>' +
    '<button id="shelf-menu-resume" type="button">Keep playing</button>' +
    '<button id="shelf-menu-quit" type="button">Back to all games</button></div>';
  veil.querySelector("p").textContent = title;

  document.body.appendChild(btn);
  document.body.appendChild(veil);

  function open() { veil.classList.add("on"); btn.style.display = "none"; setPaused(true); }
  function close() { veil.classList.remove("on"); btn.style.display = ""; setPaused(false); }
  /* leave while still paused - there is nothing to resume for */
  function quit() { window.location.href = "../"; }

  /* a clean tap opens it; a drag that starts here is ignored so the corner
     stays usable in games you steer by sliding a thumb around */
  var startX = 0, startY = 0, tracking = false;
  btn.addEventListener("pointerdown", function (e) {
    tracking = true; startX = e.clientX; startY = e.clientY;
    e.stopPropagation(); e.preventDefault();
  });
  btn.addEventListener("pointerup", function (e) {
    e.stopPropagation();
    if (tracking && Math.abs(e.clientX - startX) < 14 && Math.abs(e.clientY - startY) < 14) open();
    tracking = false;
  });
  btn.addEventListener("pointercancel", function () { tracking = false; });
  btn.addEventListener("click", function (e) { e.stopPropagation(); });

  veil.querySelector("#shelf-menu-resume").addEventListener("click", function (e) { e.stopPropagation(); close(); });
  veil.querySelector("#shelf-menu-quit").addEventListener("click", function (e) { e.stopPropagation(); quit(); });
  veil.addEventListener("click", function (e) { if (e.target === veil) close(); });
  ["pointerdown", "pointerup", "touchstart", "touchend", "mousedown", "mouseup"].forEach(function (t) {
    veil.addEventListener(t, function (e) { e.stopPropagation(); }, true);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && veil.classList.contains("on")) close();
  });

  window.__shelfMenu.open = open;
  window.__shelfMenu.close = close;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
else build();
})();
