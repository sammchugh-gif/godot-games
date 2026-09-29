/* The games, offline.

   This service worker keeps a copy of the games on the iPad or iPhone, so
   they play with no internet - in the car, on a plane.

   - With the internet, every file comes from the website as it always has
     (so a new build still arrives straight away), and the copy is brought up
     to date on the way past. Only if the website does not answer in a few
     seconds is the copy used instead.
   - Without it, everything comes from the copy.
   - A page can ask for whole games to be saved (offline.js does, for the game
     it is showing, and the shelf does for the small games and, on a tap, for
     all of them). docs/offline/ lists every file of every game with a
     fingerprint, made by tools/offline-list.mjs, so a saved game is brought up
     to date by fetching only the files that changed.

   Asking the website what it has now (fresh.js, a game's "new version?"
   button - anything with ?_= or asked not to be cached) always goes to the
   website: only it can say.

   Safari asks for sound files (the Agent Rory voices) a piece at a time, so a
   request for a piece of a file in the copy is answered with that piece. */

const FILES = 'games-files', META = 'games-meta';
const BASE = new URL('./', self.registration.scope).href;
const FONTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const WAIT = 4000;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// a page is kept under its file's name, however it was asked for
// ("vine-swing/" and "vine-swing/?v=3" are both "vine-swing/index.html")
const noSearch = url => { const u = new URL(url); u.search = ''; u.hash = ''; if (u.pathname.endsWith('/')) u.pathname += 'index.html'; return u.href; };
const tag = r => r && (r.headers.get('etag') || r.headers.get('last-modified'));

async function fromCopy(cache, req) {
  return (await cache.match(noSearch(req.url))) || (await cache.match(noSearch(req.url), { ignoreSearch: true })) || null;
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    if (!r.url.startsWith(BASE) || u.pathname.endsWith('/sw.js') || u.pathname.includes('/offline/')) return;
    if (u.searchParams.has('_') || r.cache === 'no-store') return;
    e.respondWith(site(e, r));
  } else if (FONTS.has(u.hostname)) e.respondWith(font(e, r));
});

async function site(e, r) {
  const cache = await caches.open(FILES), key = noSearch(r.url), range = r.headers.get('range');
  const had = await fromCopy(cache, r);
  const net = fetch(r);
  // bring the copy up to date with what the website sent (a whole file only,
  // and only if it is not the one already kept - a 40 MB game is not written
  // again every time it starts)
  e.waitUntil(net.then(async res => {
    if (range || res.status !== 200 || res.type !== 'basic') return;
    if (had && tag(had) && tag(had) === tag(res)) return;
    await cache.put(key, res.clone());
  }).catch(() => {}));
  if (!had) {
    try { return await net; } catch (err) { return missing(r); }
  }
  // the website, unless it does not answer in time
  const late = new Promise(res => setTimeout(() => res(null), WAIT));
  try { const res = await Promise.race([net, late]); if (res) return res; } catch (err) {}
  return range ? piece(had, range) : had;
}

// "bytes=a-b" of a file in the copy
async function piece(res, range) {
  const m = /bytes=(\d*)-(\d*)/.exec(range || ''), blob = await res.blob(), n = blob.size;
  let a = m && m[1] ? +m[1] : 0, b = m && m[2] ? +m[2] : n - 1;
  if (m && !m[1] && m[2]) { a = Math.max(0, n - +m[2]); b = n - 1; }
  b = Math.min(b, n - 1);
  if (a > b || a >= n) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${n}` } });
  return new Response(blob.slice(a, b + 1), { status: 206, headers: {
    'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
    'Content-Range': `bytes ${a}-${b}/${n}`, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } });
}

// not in the copy and no internet: a page says so, in words a child can read
function missing(r) {
  if (r.mode !== 'navigate') return Response.error();
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Needs the internet</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0d12;color:#e8ecf4;
font:18px/1.5 -apple-system,system-ui,sans-serif;text-align:center;padding:24px}h1{font-size:26px;margin:0 0 8px}a{display:inline-block;margin-top:18px;
padding:12px 22px;border-radius:12px;background:#2a8a3a;color:#fff;text-decoration:none;font-weight:700}</style></head><body><div>
<h1>This game needs the internet</h1><p>It isn't saved on this device yet.<br>Open it once with the internet on, and it will play without it after that.</p>
<a href="${BASE}">Back to all the games</a></div></body></html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function font(e, r) {
  const cache = await caches.open(FILES), had = await cache.match(r);
  const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') e.waitUntil(cache.put(r, res.clone())); return res; });
  if (had) { net.catch(() => {}); return had; }
  try { return await net; } catch (err) { return Response.error(); }
}

/* ---------------------------------------------------------- saving games */

const metaKey = g => BASE + '__offline__/' + g;
async function readMeta(g) {
  const m = await (await caches.open(META)).match(metaKey(g));
  return m ? m.json() : { hash: null, done: false, files: {} };
}
async function writeMeta(g, m) {
  await (await caches.open(META)).put(metaKey(g), new Response(JSON.stringify(m), { headers: { 'Content-Type': 'application/json' } }));
}
async function sha(res) {
  const d = await crypto.subtle.digest('SHA-1', await res.arrayBuffer());
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 12);
}
async function getJSON(p) {
  const res = await fetch(BASE + 'offline/' + p, { cache: 'no-cache' });
  if (!res.ok) throw new Error(p + ' ' + res.status);
  return res.json();
}
// the list of games, kept too so the shelf can say what is saved when offline
// (and whether the website answered: a device can be on the Wi-Fi with no
// internet behind it)
let reached = null;
async function index() {
  const meta = await caches.open(META), key = BASE + '__offline__/index';
  try { const j = await getJSON('index.json'); reached = true; await meta.put(key, new Response(JSON.stringify(j))); return j; }
  catch (err) { reached = false; const m = await meta.match(key); return m ? m.json() : null; }
}

let busy = null;
const queue = [];
const current = { game: null, done: 0, total: 0, bytes: 0, of: 0 };

async function tell(msg) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg);
}

async function saveGame(g, idx) {
  const want = idx.games[g];
  if (!want) return;
  const meta = await readMeta(g);
  if (meta.done && meta.hash === want.hash) return;
  const list = await getJSON(g + '.json'), cache = await caches.open(FILES);
  Object.assign(current, { game: g, done: 0, total: list.files.length, bytes: 0, of: want.bytes });
  const next = {};
  for (const [p, h] of list.files) if (meta.files[p] === h) next[p] = h;
  let i = 0, fails = 0, lastTell = 0;
  async function one() {
    for (;;) {
      const f = list.files[i++];
      if (!f) return;
      const [p, h, n] = f, url = BASE + p;
      try {
        if (next[p] !== h || !(await cache.match(url))) {
          // a copy already made while playing counts, if it is the right one
          const had = await cache.match(url);
          if (had && (await sha(had)) === h) next[p] = h;
          else {
            const res = await fetch(url, { cache: 'no-cache' });
            // gone from the website since the list was made: the game does
            // not need it, and waiting for it would never end
            if (res.status === 404) { current.done++; current.bytes += n; continue; }
            if (!res.ok) throw new Error(res.status);
            await cache.put(url, res);
            next[p] = h;
          }
        }
      } catch (err) { fails++; }
      current.done++; current.bytes += n;
      if (Date.now() - lastTell > 300) { lastTell = Date.now(); tell({ type: 'offline-progress', ...current }); }
    }
  }
  await Promise.all([one(), one(), one(), one(), one(), one()]);
  // files the game no longer has
  for (const p in meta.files) if (!(p in next)) await cache.delete(BASE + p);
  await writeMeta(g, { hash: want.hash, done: fails === 0, files: next });
  current.game = null;
}

async function run() {
  while (queue.length) {
    const games = queue.shift();
    const idx = await index();
    if (!idx) continue;
    for (const g of games) { try { await saveGame(g, idx); } catch (err) {} }
    await tell({ type: 'offline-status', ...(await status()) });
  }
  busy = null;
}

async function status() {
  const idx = await index(), out = {};
  if (!idx) return { games: out, busy: current.game ? { ...current } : null, reached };
  for (const g in idx.games) {
    const m = await readMeta(g);
    out[g] = { bytes: idx.games[g].bytes, with: idx.games[g].with || [],
      state: m.done ? (m.hash === idx.games[g].hash ? 'saved' : 'older') : Object.keys(m.files).length ? 'partly' : 'none' };
  }
  return { games: out, busy: current.game ? { ...current } : null, reached };
}

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'offline-save' && Array.isArray(d.games)) {
    // one game at a time, and a game already on its way is not asked for twice
    const waiting = new Set(queue.flat().concat(current.game ? [current.game] : []));
    const games = d.games.filter(g => !waiting.has(g));
    if (games.length) queue.push(games);
    if (!busy) busy = run();
    // a page that keeps asking keeps the work going (a service worker left
    // alone is stopped after a while)
    e.waitUntil(busy);
  } else if (d.type === 'offline-status') {
    e.waitUntil(status().then(s => e.source && e.source.postMessage({ type: 'offline-status', ...s })));
  }
});
