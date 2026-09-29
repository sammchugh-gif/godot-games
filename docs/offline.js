/* Playing without the internet: the page's side of docs/sw.js.

   Every page (fresh.js loads this) starts the service worker. A game page
   then asks for its own game to be saved whole, a few seconds after it has
   loaded so the saving never slows the game's start - which is what makes a
   game opened from its own Home Screen icon work offline next time. The shelf
   saves the small games by itself, offers a button for the big ones, says how
   many are saved, and with no internet greys out the games that are not. */
(function () {
  if (!("serviceWorker" in navigator) || !window.caches) return;
  var me = document.currentScript, base;
  try { base = new URL(".", me && me.src ? me.src : location.href).href; } catch (e) { return; }
  var path = location.href.slice(base.length), game = path.split(/[/?#]/)[0];
  var shelf = !path || path[0] === "?" || path[0] === "#" || path === "index.html";
  // the small games are saved without asking; the rest take a tap
  var SMALL = 2.5 * 1048576;

  navigator.serviceWorker.register(base + "sw.js", { scope: base }).catch(function () {});

  function send(msg) {
    return navigator.serviceWorker.ready.then(function (reg) { var w = navigator.serviceWorker.controller || reg.active; if (w) w.postMessage(msg); });
  }
  var status = null, busy = null, reached = null, keepGoing = null, onStatus = null;
  navigator.serviceWorker.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "offline-progress") { busy = d; if (onStatus) onStatus(); }
    else if (d.type === "offline-status") { status = d.games; busy = d.busy; reached = d.reached; if (onStatus) onStatus(); }
  });
  // a service worker left alone is stopped after a while, so while there is
  // saving to do the page keeps asking (asking again for a game on its way,
  // or saved, costs nothing)
  function save(games) {
    send({ type: "offline-save", games: games });
    clearInterval(keepGoing);
    keepGoing = setInterval(function () {
      var left = games.filter(function (g) { return !status || !status[g] || status[g].state !== "saved"; });
      if (!left.length || !navigator.onLine) { clearInterval(keepGoing); return; }
      send({ type: "offline-save", games: left });
    }, 20000);
  }

  // for tools/offlinecheck.mjs: what the service worker last said
  window.__offline = function () { return { status: status, busy: busy, reached: reached, controlled: !!navigator.serviceWorker.controller }; };
  function later(fn, ms) {
    if (document.readyState === "complete") setTimeout(fn, ms);
    else addEventListener("load", function () { setTimeout(fn, ms); });
  }

  if (!shelf) {
    // this game, and whatever small things it opens (Agent Rory HQ shows the
    // shelf's pictures); a mission is saved when it is played
    if (game) later(function () {
      if (navigator.onLine === false) return;
      onStatus = function () {
        onStatus = null;
        var mine = status && status[game];
        if (!mine) return;
        save(["shared", game].concat(mine.with.filter(function (g) { return status[g] && status[g].bytes <= 3 * SMALL; })));
      };
      send({ type: "offline-status" });
    }, 6000);
    return;
  }

  /* ------------------------------------------------------------ the shelf */
  var box = document.getElementById("offline");
  if (!box) return;
  var ua = navigator.userAgent || "";
  var device = /iPhone/.test(ua) ? "iPhone" : (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) ? "iPad" : "device";
  var st = document.createElement("style");
  st.textContent = "#offline{margin:.9rem auto 0;max-width:36rem;font-size:.92rem;color:#aeb8c8;display:flex;flex-wrap:wrap;gap:.5rem .8rem;align-items:center;justify-content:center}" +
    "#offline button{font:inherit;font-weight:700;color:#0b0d12;background:#ffd166;border:0;border-radius:999px;padding:.45rem 1rem;cursor:pointer}" +
    "#offline button:disabled{opacity:.5}" +
    "#offline .bar{flex-basis:100%;height:6px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}" +
    "#offline .bar i{display:block;height:100%;background:#51cf66;width:0;transition:width .3s}" +
    // a game that would not open with no internet: grey, and says why
    "article.needs-net{position:relative}article.needs-net .shot{filter:grayscale(1) brightness(.45)}article.needs-net .about{opacity:.5}" +
    "article.needs-net::before{content:'Needs the internet';position:absolute;z-index:5;top:42%;left:50%;transform:translate(-50%,-50%);white-space:nowrap;" +
    "background:rgba(11,13,18,.92);color:#ffd166;font-weight:800;padding:.5rem 1.1rem;border-radius:999px;border:1.5px solid rgba(255,209,102,.5);pointer-events:none}" +
    "a.pick.needs-net{opacity:.4;filter:grayscale(1)}";
  document.head.appendChild(st);

  var names = {};
  document.querySelectorAll("a[href]").forEach(function (a) {
    var m = /^([a-z0-9-]+)\/$/.exec(a.getAttribute("href"));
    if (!m) return;
    var n = a.querySelector(".name");
    names[m[1]] = (n ? n.textContent : a.textContent).trim() || m[1];
  });
  var mb = function (b) { return b >= 1048576 ? Math.round(b / 1048576) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; };

  // a game plays offline when it is saved, and so is everything it opens
  // (Agent Rory HQ and its missions)
  var has = function (g) { return status[g] && (status[g].state === "saved" || status[g].state === "older"); };
  var playable = function (g) { return has(g) && status[g].with.every(has); };
  function draw() {
    if (!status) return;
    var games = Object.keys(status).filter(function (g) { return g !== "shared" && g !== "shelf" && names[g]; });
    var ready = games.filter(playable);
    var left = Object.keys(status).filter(function (g) { return !has(g); });
    var leftBytes = left.reduce(function (a, g) { return a + status[g].bytes; }, 0);
    var online = navigator.onLine !== false && reached !== false, html;
    if (busy && busy.game && online) {
      var k = busy.of ? Math.min(1, busy.bytes / busy.of) : 0;
      html = "Saving " + (names[busy.game] || "the games") + " for offline &hellip; " + Math.round(k * 100) + "%" +
        (left.length > 1 ? " &middot; " + (left.length - 1) + " more after it" : "") +
        "<span class=bar><i style='width:" + (k * 100).toFixed(1) + "%'></i></span>";
    } else if (!online) {
      html = "No internet: the " + ready.length + " game" + (ready.length === 1 ? "" : "s") + " saved on this " + device + " still play.";
    } else if (ready.length === games.length) {
      html = "All " + games.length + " games are saved on this " + device + ": they play without the internet.";
    } else {
      html = ready.length + " of " + games.length + " games play without the internet on this " + device + "." +
        " <button type=button id=offline-all>Save all (" + mb(leftBytes) + ")</button>";
    }
    box.innerHTML = html;
    box.hidden = false;
    var b = document.getElementById("offline-all");
    if (b) b.onclick = function () {
      b.disabled = true;
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
      save(["shared", "shelf"].concat(left.filter(function (g) { return g !== "shared" && g !== "shelf"; })));
    };
    // with no internet, the games that would not open are greyed out
    document.querySelectorAll("a[href]").forEach(function (a) {
      var m = /^([a-z0-9-]+)\/$/.exec(a.getAttribute("href"));
      if (!m || !status[m[1]]) return;
      var off = !online && ready.indexOf(m[1]) < 0, card = a.closest(".pick") ? a : (a.closest("article") || a);
      card.classList.toggle("needs-net", off);
    });
  }
  onStatus = draw;
  addEventListener("online", function () { send({ type: "offline-status" }); });
  addEventListener("offline", draw);
  send({ type: "offline-status" });
  // the small games save themselves
  later(function () {
    if (navigator.onLine === false) return;
    var ask = function () {
      if (!status) { setTimeout(ask, 500); return; }
      var small = Object.keys(status).filter(function (g) { return g !== "shared" && g !== "shelf" && status[g].bytes <= SMALL && status[g].state !== "saved"; });
      if (status.shelf && status.shelf.state === "saved" && status.shared && status.shared.state === "saved" && !small.length) return;
      save(["shared", "shelf"].concat(small));
    };
    ask();
  }, 2500);
})();
