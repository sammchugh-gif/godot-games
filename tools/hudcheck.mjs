/* Does anything in the HUD land on anything else?

   The text sweep could not catch this: a health bar is a filled rectangle, not
   a string, so text-against-text checks were blind to an upgrade tile sitting
   on top of one. The games now report where they put each piece of their HUD,
   and this checks the pieces pairwise, with the busiest HUD the game can make
   - every upgrade collected and a boss on screen, which is exactly the state
   in the photograph that started this.

     PLAYWRIGHT=... node tools/hudcheck.mjs        */

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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SIZES = [[320, 568, 'small phone'], [390, 844, 'phone'],
               [844, 390, 'phone sideways'], [1180, 820, 'iPad']];

/* The two survivor games share this HUD and shared the fault: upgrade tiles
   marching left from the edge until they stood on the health bar. */
const GAMES = [
  { slug: 'slime-storm', api: 'SS', start: "window.SS.fx=true;window.SS.start('dylan')" },
  { slug: 'star-swarm',  api: 'SW', start: "window.SW.fx=true;window.SW.start(window.SW.SHIPS[0])" },
];

/* fill the HUD right up: every weapon, every passive, and a boss */
const BUSY = api => `(() => {
  const S = window.${api}, G = S.G;
  for (const k in S.WEAPONS) G.weapons[k] = S.WEAPONS[k].max || 6;
  for (const k in S.PASSIVES) G.passives[k] = S.PASSIVES[k].max || 5;
  G.hp = G.maxhp * 0.8;
  if (G.maxsh != null) G.sh = G.maxsh * 0.5;
  G.level = 13; G.kills = 499;
  const b = G.en && G.en[0];
  if (b) { G.bossAlive = b; b.maxhp = b.hp = 900; }
  else {
    /* a real boss, not just the first enemy - only the bosses carry a name */
    const boss = Object.keys(S.ENEMY).find(k => S.ENEMY[k].boss);
    G.bossAlive = { type: boss, hp: 900, maxhp: 1200 };
  }
  return Object.keys(G.weapons).length + Object.keys(G.passives).length;
})()`;

const srv = await new Promise(r => {
  const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    fs.readFile(f, (e, d) => {
      if (e) { rs.writeHead(404); rs.end(''); }
      else { rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); rs.end(d); }
    });
  });
  s.listen(8341, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });

const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/* a bar and the label written on that same bar are meant to be together */
const PAIRED = new Set(['boss|bossName']);

let bad = 0;
for (const game of GAMES) {
console.log('\n' + game.slug);
for (const [W, H, tag] of SIZES) {
  const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:8341/docs/${game.slug}/`, { waitUntil: 'load', timeout: 20000 });
  await sleep(1600);
  await pg.evaluate(game.start);
  await sleep(400);
  const n = await pg.evaluate(BUSY(game.api));
  await sleep(400);                                   /* let a frame lay it out */
  const box = await pg.evaluate(`window.${game.api}.hud()`);

  const keys = Object.keys(box);
  const clashes = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i], b = keys[j];
      if (PAIRED.has(a + '|' + b) || PAIRED.has(b + '|' + a)) continue;
      if (hit(box[a], box[b])) clashes.push(a + ' on ' + b);
    }
  /* and nothing may hang off the screen */
  const off = keys.filter(k => {
    const r = box[k];
    return r.x < -1 || r.y < -1 || r.x + r.w > W + 1 || r.y + r.h > H + 1;
  });

  const ok = !clashes.length && !off.length && !errs.length;
  if (!ok) bad++;
  console.log(`  ${tag.padEnd(15)} ${String(n).padStart(2)} upgrades + a boss | ` +
    `${clashes.length ? 'OVERLAP: ' + clashes.join(', ') : 'nothing overlaps'}` +
    `${off.length ? ' | OFF SCREEN: ' + off.join(', ') : ''} ${ok ? 'ok' : '<-- FAIL'}` +
    `${errs.length ? '\n   error: ' + errs[0].slice(0, 90) : ''}`);
  await pg.close();
}
}
/* ------------------------------------------------- the upgrade cards
   Twice now a line has walked out through the side of a card on a phone:
   the font stopped shrinking at a floor and the words kept going. Every
   line the level-up screen draws is logged with the width it was given,
   and none of them may be painted wider than its box - nor squeezed so
   hard to get there that it stops reading. */
const CARDS = `(() => {
  const S = window.SW; S.fx = false; S.start(S.SHIPS[0]); const G = S.G;
  G.arrive = 0; G.hp = G.maxhp = 1e9; G.spawnAcc = -1e9; G.en.length = 0;
  /* the worst case the game can offer: a weapon going to max with its long
     partner name, and a passive that evolves a long-named weapon */
  for (const k in S.WEAPONS) G.weapons[k] = S.WEAPONS[k].max;
  G.weapons.missile = 5;
  for (const k in S.PASSIVES) G.passives[k] = S.PASSIVES[k].max;
  G.passives.tractor = 1; G.passives.hull = 1;
  G.lvlQueue = 1; S.sim(0.05);
  return S.cards.map(c => c.k + ':' + c.l);
})()`;
console.log('\nstar-swarm upgrade cards');
for (const [W, H, tag] of SIZES) {
  const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://127.0.0.1:8341/docs/star-swarm/', { waitUntil: 'load', timeout: 20000 });
  await sleep(1600);
  const picked = await pg.evaluate(CARDS);
  await sleep(300);
  await pg.evaluate('window.SW.fitLog = []');
  await sleep(300);                                   /* a frame or two of the real screen */
  const log = await pg.evaluate('window.SW.fitLog');
  await pg.evaluate('window.SW.fitLog = null');
  const over = log.filter(e => e.w > e.maxw + 0.5);
  const crushed = log.filter(e => e.squeeze < 0.72);
  const tight = log.reduce((a, e) => e.squeeze < a.squeeze ? e : a, { squeeze: 1, s: 'nothing' });
  const ok = !over.length && !crushed.length && log.length > 6 && !errs.length;
  if (!ok) bad++;
  console.log(`  ${tag.padEnd(15)} ${String(log.length).padStart(2)} lines | ` +
    `${over.length ? 'OUT OF ITS BOX: ' + over[0].s : 'all inside their boxes'}` +
    `${crushed.length ? ' | CRUSHED: ' + crushed.map(e => '"' + e.s + '" to ' + Math.round(e.squeeze * 100) + '%').join(', ') : ''}` +
    ` | tightest "${tight.s}" at ${Math.round(tight.squeeze * 100)}% ${ok ? 'ok' : '<-- FAIL'}` +
    `${errs.length ? '\n   error: ' + errs[0].slice(0, 90) : ''}`);
  await pg.close();
}

console.log(bad ? `\n${bad} sizes have a HUD that writes over itself` : '\nboth HUDs keep out of their own way, and every card line fits its card');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
