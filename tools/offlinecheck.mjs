/* Do the games play with no internet?

   docs/sw.js keeps a copy of the games on the device. This serves the site
   the way GitHub Pages does (under /godot-games/), lets the shelf save
   everything, then switches the server off - not a simulated offline, the
   website really is gone - and opens every game. Each must load with no
   request left unanswered and nothing thrown. It also checks:

   - the lists in docs/offline/ match the files (tools/offline-list.mjs);
   - Safari's piece-at-a-time requests for sound (the Agent Rory voices) are
     answered from the copy with the right piece;
   - on a device that has only saved the small games, the shelf greys out the
     big ones when offline, and opening one says it needs the internet
     instead of a browser error;
   - a game changed on the website reaches the copy the next time it is
     opened with the internet, so the copy never holds an old build.

     PLAYWRIGHT=... node tools/offlinecheck.mjs          every game
     PLAYWRIGHT=... node tools/offlinecheck.mjs quick    the small games only */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  const alt = process.env.PLAYWRIGHT;
  if (!alt) { console.error('needs playwright; see tools/touchcheck.mjs'); process.exit(2); }
  const m = await import(alt); chromium = m.chromium || (m.default && m.default.chromium);
}
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const QUICK = process.argv[2] === 'quick';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0;
const check = (name, ok, detail) => { console.log(`  ${name.padEnd(58)} ${detail ?? ''} ${ok ? 'ok' : '<-- FAIL'}`); if (!ok) bad++; };

console.log('the lists');
const lists = spawnSync(process.execPath, [path.join(ROOT, 'tools/offline-list.mjs'), '--check'], { encoding: 'utf8' });
check('docs/offline/ matches the files in docs/', lists.status === 0, lists.stdout.trim());
const index = JSON.parse(fs.readFileSync(path.join(DOCS, 'offline/index.json'), 'utf8')).games;
// (quick: the small games, less any that open a big one - Agent Rory HQ's
// room is built from the Zero Gravity mission's files)
const small = g => g === 'shared' || g === 'shelf' || index[g].bytes <= 2.5 * 1048576;
const games = Object.keys(index).filter(g => g !== 'shared' && g !== 'shelf' && (!QUICK || (small(g) && (index[g].with || []).every(small))));

/* ---------------------------------------------------------------- server */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.pck': 'application/octet-stream' };
const override = new Map();
let server = null;
function start() {
  return new Promise(res => {
    server = http.createServer((q, r) => {
      const u = new URL(q.url, 'http://x');
      if (!u.pathname.startsWith('/godot-games/')) { r.writeHead(404); return r.end(); }
      let rel = decodeURIComponent(u.pathname.slice('/godot-games/'.length));
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      const f = path.join(DOCS, rel);
      let body = override.get(rel) ?? (fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f) : null);
      if (body == null) { r.writeHead(404); return r.end(); }
      if (typeof body === 'string') body = Buffer.from(body);
      const etag = '"' + body.length + '-' + (override.has(rel) ? 'o' : fs.statSync(f).mtimeMs) + '"';
      const h = { 'Content-Type': MIME[path.extname(rel)] || 'application/octet-stream', ETag: etag, 'Accept-Ranges': 'bytes' };
      const m = /bytes=(\d*)-(\d*)/.exec(q.headers.range || '');
      if (m) {
        const a = m[1] ? +m[1] : 0, b = m[2] ? Math.min(+m[2], body.length - 1) : body.length - 1;
        r.writeHead(206, { ...h, 'Content-Range': `bytes ${a}-${b}/${body.length}`, 'Content-Length': b - a + 1 });
        return r.end(body.subarray(a, b + 1));
      }
      r.writeHead(200, { ...h, 'Content-Length': body.length }); r.end(body);
    });
    server.listen(8407, '127.0.0.1', () => res());
  });
}
function stop() { return new Promise(res => { server.closeAllConnections?.(); server.close(() => res()); }); }
const SITE = 'http://127.0.0.1:8407/godot-games/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const SMALL = 2.5 * 1048576;
const auto = g => g === 'shared' || g === 'shelf' || index[g].bytes <= SMALL;
// what the page last heard from the service worker
async function saved(pg) { return pg.evaluate(() => window.__offline ? window.__offline() : null); }
async function waitSaved(pg, want, ms, what) {
  const t0 = Date.now();
  for (;;) {
    const o = await saved(pg);
    if (o && o.status && !o.busy && want.every(g => o.status[g] && o.status[g].state === 'saved')) return o;
    if (Date.now() - t0 > ms) throw new Error(`waited ${ms / 1000}s for ${what}; ${o && o.status ? want.filter(g => !o.status[g] || o.status[g].state !== 'saved').join(', ') + ' not saved' : 'no word from the service worker'}`);
    // (asking keeps the answers coming)
    await pg.evaluate(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({ type: 'offline-status' }));
    await sleep(1000);
  }
}
async function box(pg) { return pg.evaluate(() => { const b = document.getElementById('offline'); return b && !b.hidden ? b.textContent : ''; }); }
async function until(pg, test, ms, what) {
  const t0 = Date.now();
  for (;;) { const t = await box(pg); if (test(t)) return t; if (Date.now() - t0 > ms) throw new Error(`waited ${ms / 1000}s for ${what}; the shelf says "${t}"`); await sleep(500); }
}
// open a page and watch everything it asks for
async function visit(ctx, url, wait) {
  const pg = await ctx.newPage(), errs = [], failed = [];
  // (Blockfort and Star Digger ask to lock a mouse pointer with nobody there
  // to click; they do that online too, and an iPad has no pointer to lock)
  pg.on('pageerror', e => { if (!/Pointer Lock/.test(e.message)) errs.push(e.message); });
  pg.on('requestfailed', r => { if (r.url().startsWith(SITE) && !/[?&]_=/.test(r.url())) failed.push(r.url().slice(SITE.length) + ' ' + (r.failure() || {}).errorText); });
  pg.on('response', r => { if (r.url().startsWith(SITE) && r.status() >= 400) failed.push(r.url().slice(SITE.length) + ' ' + r.status()); });
  await pg.goto(url, { waitUntil: 'load', timeout: 60000 });
  await sleep(wait);
  const title = await pg.title();
  return { pg, errs, failed, title };
}

try {
  /* ------------------------------------------------ a device that saves all */
  console.log('saving every game' + (QUICK ? ' (the small ones: quick)' : ''));
  await start();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  let shelf = await ctx.newPage();
  await shelf.goto(SITE, { waitUntil: 'load' });
  const smallOnes = Object.keys(index).filter(auto);
  await waitSaved(shelf, smallOnes, 120000, 'the small games to save');
  check('the shelf saves the small games by itself', true, `${smallOnes.length - 2} games, "${(await box(shelf)).replace(/\s+/g, ' ').trim()}"`);
  if (!QUICK) {
    const t0 = Date.now();
    await shelf.click('#offline-all');
    await waitSaved(shelf, Object.keys(index), 20 * 60000, 'every game to save');
    const all = await until(shelf, t => /^All \d+ games/.test(t.trim()), 10000, 'the shelf to say so');
    check('a tap saves all of them', true, `"${all.trim()}" in ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  await shelf.close();

  console.log('with the website switched off');
  await stop();
  shelf = await ctx.newPage();
  await shelf.goto(SITE, { waitUntil: 'load' });
  const offText = await until(shelf, t => /No internet/.test(t), 20000, 'the shelf to notice there is no internet');
  check('the shelf opens, and knows there is no internet', true, `"${offText.trim()}"`);
  // the voices come a piece at a time
  const withMp3 = g => JSON.parse(fs.readFileSync(path.join(DOCS, `offline/${g}.json`), 'utf8')).files.find(f => f[0].endsWith('.mp3'));
  const voice = QUICK ? null : games.find(withMp3);
  if (voice) {
    const mp3 = withMp3(voice);
    const r = await shelf.evaluate(async u => { const res = await fetch(u, { headers: { Range: 'bytes=100-1099' } }); return [res.status, (await res.arrayBuffer()).byteLength, res.headers.get('content-range')]; }, SITE + mp3[0]);
    check('a piece of a voice line comes from the copy', r[0] === 206 && r[1] === 1000 && r[2] === `bytes 100-1099/${mp3[2]}`, JSON.stringify(r));
  }
  await shelf.close();
  for (const g of games) {
    const v = await visit(ctx, SITE + g + '/', index[g].bytes > 5e6 ? 4000 : 2500);
    const ok = !v.failed.length && !v.errs.length && !/needs the internet/i.test(v.title);
    check(g, ok, ok ? `"${v.title}"` : (v.failed.slice(0, 3).concat(v.errs.slice(0, 2)).join(' | ')));
    await v.pg.close();
  }

  /* -------------------------------------- the copy follows the website */
  console.log('a change on the website reaches the copy');
  await start();
  const f = fs.readFileSync(path.join(DOCS, 'vine-swing/index.html'), 'utf8');
  override.set('vine-swing/index.html', f.replace('<title>', '<title>NEW BUILD '));
  let v = await visit(ctx, SITE + 'vine-swing/', 1500); await v.pg.close();
  await stop();
  v = await visit(ctx, SITE + 'vine-swing/', 1000);
  check('opened once with the internet, the new build plays offline', /^NEW BUILD /.test(v.title), `"${v.title}"`);
  await v.pg.close();
  override.clear();
  await ctx.close();

  /* ------------------------------------- a device with only the small ones */
  if (!QUICK) {
    console.log('a device that has only saved the small games');
    await start();
    const ctx2 = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    shelf = await ctx2.newPage();
    await shelf.goto(SITE, { waitUntil: 'load' });
    await waitSaved(shelf, Object.keys(index).filter(auto), 120000, 'the small games to save');
    await shelf.close();
    await stop();
    shelf = await ctx2.newPage();
    await shelf.goto(SITE, { waitUntil: 'load' });
    await until(shelf, t => /No internet/.test(t), 20000, 'the shelf to notice');
    const cards = await shelf.evaluate(() => [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /^[a-z0-9-]+\/$/.test(h)))]);
    const grey = await shelf.evaluate(() => [...new Set([...document.querySelectorAll('.needs-net a[href], a.needs-net')].map(a => a.getAttribute('href')))]);
    // a card needs the internet if its game, or anything it opens, is not saved
    const want = cards.filter(h => { const g = h.slice(0, -1); return index[g] && (!auto(g) || (index[g].with || []).some(w => !auto(w))); });
    check('the games not saved are greyed out, and only those', want.length > 0 && want.every(h => grey.includes(h)) && grey.every(h => want.includes(h)), `${grey.length} greyed: ${grey.join(' ')}`);
    await shelf.close();
    v = await visit(ctx2, SITE + 'blockfort/', 500);
    check('an unsaved game says it needs the internet', /needs the internet/i.test(v.title), `"${v.title}"`);
    await v.pg.close();
    await ctx2.close();
  }
} catch (e) { bad++; console.log('  FAIL ' + e.message); }
await browser.close();
if (server && server.listening) await stop();
console.log(bad ? `\n${bad} checks failed` : '\nthe games play without the internet');
process.exit(bad ? 1 : 0);
