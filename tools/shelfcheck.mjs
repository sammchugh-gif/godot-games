/* Does the shelf still work as a shelf?

   The front page is pictures now: every game's write-up is folded away behind
   a bar under its picture, and the three Bones Park games share one card that
   opens onto the three of them. Both of those are easy to break by accident -
   a card that opens nothing, a link that goes nowhere, a description that was
   left showing - so they are checked rather than eyeballed.

     PLAYWRIGHT=... node tools/shelfcheck.mjs        */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  const alt = process.env.PLAYWRIGHT;
  if (!alt) { console.error('needs playwright; see tools/touchcheck.mjs'); process.exit(2); }
  const m = await import(alt); chromium = m.chromium || (m.default && m.default.chromium);
}
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg',
               '.png': 'image/png', '.css': 'text/css', '.json': 'application/json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const srv = await new Promise(r => {
  const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, 'docs', p);
    fs.readFile(f, (e, d) => {
      if (e) { rs.writeHead(404); rs.end(''); }
      else { rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); rs.end(d); }
    });
  });
  s.listen(8362, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

let bad = 0;
const check = (name, ok, note) => {
  if (!ok) bad++;
  console.log('  ' + name.padEnd(46) + (note || '') + (ok ? ' ok' : ' <-- FAIL'));
};

console.log('\nthe shelf');
const pg = await browser.newPage({ viewport: { width: 393, height: 760 }, hasTouch: true });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://127.0.0.1:8362/', { waitUntil: 'load', timeout: 20000 });
await sleep(500);

/* --------------------------------------------------------- it opens as pictures */
const VIS = `d => d.checkVisibility({ contentVisibilityAuto: true,
  opacityProperty: true, visibilityProperty: true })`;
/* A closed <details> hides its contents with content-visibility, which still
   reports a box, so measuring one says it is on screen when it is not. */
const shown = await pg.evaluate(`[...document.querySelectorAll('.desc')].filter(${VIS}).length`);
const cards = await pg.evaluate(`document.querySelectorAll('article.game').length`);
check('every write-up starts folded away', shown === 0,
  `${cards} cards on the shelf, ${shown} of them showing text`);

/* ------------------------------------------------------- and each one unfolds */
const first = pg.locator('details.about:not(.group) > summary').first();
await first.tap();
await sleep(250);
const afterOne = await pg.evaluate(`[...document.querySelectorAll('.desc')].filter(${VIS}).length`);
await first.tap();
await sleep(250);
const afterShut = await pg.evaluate(`[...document.querySelectorAll('.desc')].filter(${VIS}).length`);
check('a tap on the bar opens that one and no other', afterOne === 1 && afterShut === 0,
  `one open after a tap, ${afterShut} after tapping it again`);

/* -------------------------------------------- the three parks share one card
   They are the same game three times over, so they share a card that opens
   onto the three of them - and it is the third card on the shelf. */
const VISP = `d => d.checkVisibility({ contentVisibilityAuto: true,
  opacityProperty: true, visibilityProperty: true })`;
const parks = await pg.evaluate(`[...document.querySelectorAll('.pick')].map(a => a.getAttribute('href'))`);
const topLevelParks = await pg.evaluate(
  `[...document.querySelectorAll('article.game > a.shot')].map(a => a.getAttribute('href'))
     .filter(h => /bones-park/.test(h)).length`);
const place = await pg.evaluate(
  `[...document.querySelectorAll('article.game')].findIndex(c => c.querySelector('details.group')) + 1`);
check('the three parks are behind one card', parks.length === 3 && topLevelParks === 0,
  parks.join(' '));
check('and it is third on the shelf', place === 3, `card ${place}`);
await pg.locator('details.group > summary').tap();
await sleep(250);
const picksVisible = await pg.evaluate(`[...document.querySelectorAll('.pick')].filter(${VISP}).length`);
check('and the card opens onto all three', picksVisible === 3,
  `${picksVisible} parks offered once it is open`);

/* ------------------------------------------------------ every link goes somewhere */
const links = await pg.evaluate(
  `[...document.querySelectorAll('a.shot, a.pick')].map(a => a.getAttribute('href'))`);
const dead = [];
for (const h of links) {
  const r = await fetch('http://127.0.0.1:8362/' + h);
  if (!r.ok) dead.push(h + ' -> ' + r.status);
}
check('and every link lands on a game', dead.length === 0,
  dead.length ? dead.join(', ') : `${links.length} links, all of them alive`);

/* --------------------------------------------- nothing hangs off the phone screen */
const wide = await pg.evaluate(`(() => {
  const w = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll('article.game, .shot, .desc, .pick, summary')) {
    const b = el.getBoundingClientRect();
    if (b.width > 0 && (b.left < -1 || b.right > w + 1)) out.push(el.className || el.tagName);
  }
  return out;
})()`);
check('and nothing hangs off the side of a phone', wide.length === 0,
  wide.length ? wide.slice(0, 3).join(', ') : 'every card inside 393px');

if (errs.length) { bad++; console.log('\npage error: ' + errs[0].slice(0, 160)); }
console.log(bad ? `\n${bad} checks failed` : '\npictures first, words on request');
await browser.close(); srv.close();
process.exit(bad ? 1 : 0);
