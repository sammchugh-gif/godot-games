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
var lastFrame = 0, everRan = false, loadedAt = 0, lastError = "";
if (raf) {
  window.requestAnimationFrame = function (cb) {
    if (paused) { held.push(cb); return -1; }
    return raf(function (ts) { lastFrame = now(); everRan = true; cb(ts - skew); });
  };
}
window.addEventListener("error", function (e) {
  lastError = (e && e.message ? String(e.message) : "something went wrong").slice(0, 160);
});
window.addEventListener("unhandledrejection", function (e) {
  var r = e && e.reason;
  lastError = String((r && r.message) || r || "something went wrong").slice(0, 160);
});
/* A tally of the raw input the page receives, read in the capture phase so
   it is counted whatever the game does with it afterwards. This was for
   working out why a game had stopped answering the finger; it is debug
   output, so it stays on the stuck panel - which only appears when something
   is already wrong - and is off on the ordinary pause panel unless the page
   is opened with ?diag=1. */
var tally = { ts: 0, tm: 0, te: 0, tc: 0, pd: 0, pu: 0 };
[["touchstart", "ts"], ["touchmove", "tm"], ["touchend", "te"], ["touchcancel", "tc"],
 ["pointerdown", "pd"], ["pointerup", "pu"]].forEach(function (pair) {
  try { window.addEventListener(pair[0], function () { tally[pair[1]]++; }, true); } catch (e) {}
});
function inputLine() {
  var c = document.querySelector("canvas"), r = null, extra = "";
  try { if (c) r = c.getBoundingClientRect(); } catch (e) {}
  try { if (typeof window.__shelfInput === "function") extra = " \u00b7 " + window.__shelfInput(); } catch (e) {}
  return "touch " + tally.ts + "/" + tally.tm + "/" + tally.te + "/" + tally.tc +
    " \u00b7 tap " + tally.pd + "/" + tally.pu +
    " \u00b7 win " + Math.round(window.innerWidth) + "\u00d7" + Math.round(window.innerHeight) +
    (r ? " \u00b7 canvas " + Math.round(r.width) + "\u00d7" + Math.round(r.height) : " \u00b7 no canvas") + extra;
}
/* every game stores its saves under a prefix taken from its folder name */
var slug = (location.pathname.replace(/\/+$/, "").split("/").pop() || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
function savedKeys() {
  var out = [];
  try { for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && slug && k.toLowerCase().indexOf(slug + ".") === 0) out.push(k);
  } } catch (e) {}
  return out;
}
/* Keep a handle on every audio context the game makes, so its sound can be
   stopped too. This hooks a couple of harmless prototype methods rather than
   replacing the AudioContext constructor: a wrapped constructor is exactly
   the sort of thing an older iPhone can refuse, and losing the sound is a
   great deal better than losing the game. */
var acs = [];
["AudioContext", "webkitAudioContext"].forEach(function (key) {
  var C = window[key];
  if (typeof C !== "function" || !C.prototype) return;
  ["createGain", "createOscillator", "createBufferSource"].forEach(function (m) {
    var orig = C.prototype[m];
    if (typeof orig !== "function") return;
    try {
      C.prototype[m] = function () {
        try { if (acs.indexOf(this) < 0) acs.push(this); } catch (e) {}
        return orig.apply(this, arguments);
      };
    } catch (e) {}
  });
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
    /* A red circle with a cross: this one leaves the game, and every game
       draws its own pause button of its own. Two identical pause glyphs in
       opposite corners was a guess for a child to make. The two bars that
       used to be the pause glyph are rotated into the cross, so the markup
       is unchanged. */
    "#shelf-menu-btn{position:fixed;z-index:2147483000;top:calc(7px + env(safe-area-inset-top));",
    "left:calc(7px + env(safe-area-inset-left));width:36px;height:36px;border-radius:50%;",
    "background:rgba(198,38,46,0.88);border:2px solid rgba(255,255,255,0.9);display:flex;",
    "align-items:center;justify-content:center;gap:0;cursor:pointer;touch-action:manipulation;",
    "box-shadow:0 1px 4px rgba(0,0,0,0.45);",
    "-webkit-tap-highlight-color:transparent;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}",
    "#shelf-menu-btn i{position:absolute;display:block;width:3.5px;height:17px;border-radius:2px;background:#fff}",
    "#shelf-menu-btn i:first-child{transform:rotate(45deg)}",
    "#shelf-menu-btn i:last-child{transform:rotate(-45deg)}",
    "#shelf-menu-btn:active{background:rgba(150,22,30,0.96)}",
    "#shelf-menu-veil,#shelf-menu-stuck{position:fixed;z-index:2147483001;top:0;right:0;bottom:0;left:0;display:none;align-items:center;",
    "justify-content:center;background:rgba(4,8,16,0.78);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;",
    "-webkit-user-select:none;user-select:none;touch-action:manipulation}",
    "#shelf-menu-veil.on,#shelf-menu-stuck.on{display:flex}",
    "#shelf-menu-stuck{z-index:2147483002}",
    "#shelf-menu-card,#shelf-menu-stuckcard{width:340px;max-width:88vw;background:rgba(16,22,34,0.96);border:1.5px solid rgba(255,255,255,0.18);",
    "border-radius:20px;padding:22px 20px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,0.5)}",
    "#shelf-menu-card h2,#shelf-menu-stuckcard h2{margin:0 0 2px;font-size:26px;color:#ffe14d;letter-spacing:0.5px}",
    "#shelf-menu-card p,#shelf-menu-stuckcard p{margin:0 0 18px;font-size:14px;color:#aeb8c8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "#shelf-menu-card button,#shelf-menu-stuckcard button{display:block;width:100%;margin:9px 0 0;padding:15px 10px;font-size:19px;",
    "font-weight:700;color:#fff;border:0;border-radius:14px;cursor:pointer;font-family:inherit;",
    "touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
    "#shelf-menu-resume,#shelf-stuck-retry{background:#2a8a3a}#shelf-menu-quit,#shelf-stuck-quit{background:#2a4a8a}",
    "#shelf-stuck-wipe{background:#8a3a2a}#shelf-stuck-wait{background:rgba(255,255,255,0.14)}",
    "#shelf-menu-stuckcard button[hidden]{display:none}",
    "#shelf-menu-stuckcard p.why{color:#ffb0a0;font-size:12px;white-space:normal;margin:-8px 0 14px}",
    "#shelf-menu-card button:active,#shelf-menu-stuckcard button:active{filter:brightness(1.25)}",
    "#shelf-diag,#shelf-diag2{margin:14px 0 0;font:11px/1.45 ui-monospace,Menlo,monospace;color:#7f8b9e;white-space:normal;word-break:break-word}"
  ].join("");
  document.head.appendChild(css);

  var btn = document.createElement("div");
  btn.id = "shelf-menu-btn";
  btn.setAttribute("role", "button");
  btn.setAttribute("aria-label", "Leave this game");
  btn.innerHTML = "<i></i><i></i>";

  var veil = document.createElement("div");
  veil.id = "shelf-menu-veil";
  var title = (document.title || "This game").replace(/\s*[:–-].*$/, "");
  var wantDiag = /[?&]diag=1\b/.test(location.search);
  veil.innerHTML = '<div id="shelf-menu-card"><h2>PAUSED</h2><p></p>' +
    '<button id="shelf-menu-resume" type="button">Keep playing</button>' +
    '<button id="shelf-menu-quit" type="button">Back to all games</button>' +
    (wantDiag ? '<p id="shelf-diag"></p>' : '') + '</div>';
  veil.querySelector("p").textContent = title;

  document.body.appendChild(btn);
  document.body.appendChild(veil);

  /* A game with a pause screen of its own does not need this button sitting on
     its HUD as well: it can set window.__shelfPaused to a function saying
     whether it is paused, and the button then shows only while it is. A game
     that sets nothing keeps the button all the time, because for most of them
     it is the only way out. */
  function gameIsPlaying() {
    if (typeof window.__shelfPaused !== "function") return false;
    try { return !window.__shelfPaused(); } catch (e) { return false; }
  }
  function syncBtn() {
    if (veil.classList.contains("on") || stuck.classList.contains("on")) return;
    btn.style.display = gameIsPlaying() ? "none" : "";
  }

  var openedAt = 0;
  function open() {
    if (wantDiag) { try { veil.querySelector("#shelf-diag").textContent = inputLine(); } catch (e) {} }
    openedAt = now();
    veil.classList.add("on"); btn.style.display = "none"; setPaused(true);
  }
  function close() { veil.classList.remove("on"); btn.style.display = ""; setPaused(false); syncBtn(); }
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
  ["click", "touchstart", "touchmove", "touchend", "touchcancel", "mousedown", "mouseup"].forEach(function (t) {
    btn.addEventListener(t, function (e) { e.stopPropagation(); }, false);
  });

  veil.querySelector("#shelf-menu-resume").addEventListener("click", function (e) { e.stopPropagation(); close(); });
  veil.querySelector("#shelf-menu-quit").addEventListener("click", function (e) { e.stopPropagation(); quit(); });
  // a tap on the button is followed by a synthetic click a moment later, and
  // by then the panel is under the finger: ignore the backdrop until it settles
  veil.addEventListener("click", function (e) { if (e.target === veil && now() - openedAt > 450) close(); });
  var SWALLOW = ["pointerdown", "pointerup", "pointermove", "touchstart", "touchmove", "touchend", "touchcancel", "mousedown", "mouseup"];
  SWALLOW.forEach(function (t) { veil.addEventListener(t, function (e) { e.stopPropagation(); }, true); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && veil.classList.contains("on")) close();
  });

  /* ------------------------------------------------------- stuck helper */
  /* If the game stops drawing, or never starts, say so and offer a way out
     instead of leaving a frozen picture with no buttons on it. */
  var stuck = document.createElement("div");
  stuck.id = "shelf-menu-stuck";
  stuck.innerHTML = '<div id="shelf-menu-stuckcard"><h2>STUCK?</h2><p></p><p class="why"></p>' +
    '<button id="shelf-stuck-wait" type="button">Keep waiting</button>' +
    '<button id="shelf-stuck-retry" type="button">Start the game again</button>' +
    '<button id="shelf-stuck-quit" type="button">Back to all games</button>' +
    '<button id="shelf-stuck-wipe" type="button" hidden>Erase this game\u2019s saved progress</button>' +
    '<p id="shelf-diag2"></p></div>';
  document.body.appendChild(stuck);
  SWALLOW.forEach(function (t) { stuck.addEventListener(t, function (e) { e.stopPropagation(); }, true); });
  var stuckShown = false, snoozeUntil = 0;
  function showStuck(why) {
    if (stuckShown || now() < snoozeUntil) return;
    stuckShown = true;
    stuck.querySelector("p").textContent = why;
    var w = stuck.querySelector("p.why");
    w.textContent = lastError ? "It said: " + lastError : "";
    try { stuck.querySelector("#shelf-diag2").textContent = inputLine(); } catch (e) {}
    var keys = savedKeys();
    var wipe = stuck.querySelector("#shelf-stuck-wipe");
    wipe.hidden = keys.length === 0;
    stuck.classList.add("on");
    btn.style.display = "none";
  }
  function hideStuck(snoozeSeconds) {
    stuckShown = false; stuck.classList.remove("on");
    if (!veil.classList.contains("on")) { btn.style.display = ""; syncBtn(); }
    snoozeUntil = now() + (snoozeSeconds || 30) * 1000;
    lastFrame = now();
  }
  stuck.querySelector("#shelf-stuck-wait").addEventListener("click", function () { hideStuck(30); });
  stuck.querySelector("#shelf-stuck-retry").addEventListener("click", function () { location.reload(); });
  stuck.querySelector("#shelf-stuck-quit").addEventListener("click", function () { window.location.href = "../"; });
  stuck.querySelector("#shelf-stuck-wipe").addEventListener("click", function () {
    savedKeys().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    location.reload();
  });
  loadedAt = now();
  setInterval(syncBtn, 150);
  setInterval(function () {
    if (paused || document.hidden || veil.classList.contains("on")) { lastFrame = now(); return; }
    if (stuckShown) { if (now() - lastFrame < 1500) hideStuck(5); return; }
    if (everRan) { if (now() - lastFrame > 5000) showStuck("The game has stopped moving."); }
    else if (now() - loadedAt > 25000) showStuck("This game is taking a long time to start.");
  }, 1000);

  window.__shelfMenu.open = open;
  window.__shelfMenu.close = close;
  window.__shelfMenu.stuck = function () { return stuck.classList.contains("on"); };
  window.__shelfMenu.keys = savedKeys;
  window.__shelfMenu.sync = syncBtn;
}
function safeBuild() { try { build(); } catch (e) { /* never let the overlay break a game */ } }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", safeBuild);
else safeBuild();
})();
