/* Keep the shelf from serving yesterday's build.

   GitHub Pages sends HTML with a short max-age, but a page added to an
   iPhone home screen can hold on to its copy for far longer, so a child can
   be playing a build from days ago and have no way to know. There is no way
   to set response headers on Pages, so the page checks for itself: shortly
   after load it asks the server what this URL looks like now, with the cache
   bypassed, and if that is not what we are running it reloads onto a URL the
   cache has never seen.

   Two rules keep it out of the way:
     - it runs once, on load, never on a timer;
     - it does nothing if anyone has already touched the screen, so it can
       never pull a game out from under whoever is playing it. */
(function () {
  if (!window.fetch || !window.localStorage) return;

  var url = location.pathname, key = "shelffresh:" + url, touched = false;
  ["pointerdown", "touchstart", "keydown"].forEach(function (n) {
    try { addEventListener(n, function () { touched = true; }, { capture: true, once: true }); } catch (e) {}
  });

  function bust() { return url + (url.indexOf("?") < 0 ? "?" : "&") + "_=" + Date.now(); }
  function stamp(res) { return res.headers.get("etag") || res.headers.get("last-modified") || ""; }
  function reloadFresh(v) {
    if (touched) return;
    location.replace(url + "?v=" + encodeURIComponent(v).replace(/[^A-Za-z0-9._-]/g, "").slice(0, 32));
  }

  /* First visit on this device: there is no stored stamp to compare against,
     so fall back to comparing the size of the document we loaded with the one
     the server has now. A browser that will not report the former tells us
     nothing, and we simply wait for the next deploy. */
  function firstLook(now) {
    var nav = null, have = 0;
    try { nav = performance.getEntriesByType("navigation")[0]; } catch (e) {}
    if (nav) have = nav.decodedBodySize || 0;
    if (!have) return;
    fetch(bust(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) {
        if (t == null) return;
        var fresh = 0;
        try { fresh = new Blob([t]).size; } catch (e) { return; }
        if (fresh && Math.abs(fresh - have) > 8) reloadFresh(now || String(fresh));
      })
      .catch(function () {});
  }

  setTimeout(function () {
    fetch(bust(), { method: "HEAD", cache: "no-store" })
      .then(function (res) {
        if (!res.ok) return;
        var now = stamp(res);
        var prev = null;
        try { prev = localStorage.getItem(key); } catch (e) {}
        /* stored before any reload, so a wrong guess costs one reload, not a loop */
        try { if (now) localStorage.setItem(key, now); } catch (e) {}
        if (!now) return;
        if (prev === null) firstLook(now);
        else if (prev !== now) reloadFresh(now);
      })
      .catch(function () {});
  }, 1500);
})();
