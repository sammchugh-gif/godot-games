/* Play Star Swarm with a bot, many runs at once, and report how each went.

   The bot is a plain player: it backs away from anything close, flies to
   the gate when it opens, picks up chests and pickups, collects gems, keeps
   a boss at range, and takes a card at every level (weapons first). It is
   not good, and it is not meant to be: it plays like someone who has the
   controls but no plan, which is about what a seven-year-old brings.

   What comes back is the shape of the run: for every sector, the level and
   ranks held, evolutions, hull lost, how long the boss fight took, and how
   the run ended. That is what balance is tuned against.

     PLAYWRIGHT=... node tools/playbot.mjs --dif easy --mode campaign --runs 4
     options: --dif easy|medium|hard  --mode campaign|endless|daily
              --twist gems|glass|noshield|tide|rush|turbo|loot (daily only)
              --runs N  --par N (pages at once, default 3)  --maxmin N (endless cap)
              --policy weapons|balanced  --json out.jsonl                    */

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
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const DIF = arg('dif', 'easy'), MODE = arg('mode', 'campaign'), TWIST = arg('twist', ''), RUNS = +arg('runs', 4);
const PAR = +arg('par', 3), MAXMIN = +arg('maxmin', 45), POLICY = arg('policy', 'weapons'), JSONL = arg('json', '');

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
  s.listen(0, () => r(s));
});
const PORT = srv.address().port;
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

/* the whole run happens inside the page: one evaluate, one report */
const PLAY = (dif, mode, twist, maxmin, policy, seed) => `(() => {
  const S = window.SW; S.fx = false;
  S.mode = ['campaign', 'endless', 'daily'].indexOf(${JSON.stringify(mode)});
  const difs = S.DIFFS.map(d => d.id); window.__setDif && window.__setDif(difs.indexOf(${JSON.stringify(dif)}));
  S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0;
  if (${JSON.stringify(mode)} === 'daily' && ${JSON.stringify(twist)}) { const m = S.DAILY_MODS.find(m => m.id === ${JSON.stringify(twist)}); if (m) { G.mod = m;
    if (m.hull) { G.maxhp = Math.round(G.maxhp * m.hull); G.hp = G.maxhp; } if (m.shield != null) { G.maxsh = Math.round(G.maxsh * m.shield); G.sh = G.maxsh; } } }
  const DT = 1 / 30, MAXT = ${maxmin} * 60;
  const ranks = () => { let r = 0; for (const k in G.weapons) r += G.weapons[k]; for (const k in G.passives) r += G.passives[k]; return r; };
  const build = () => Object.entries(G.weapons).map(([k, v]) => k + v + (G.evo[k] ? '*' : '')).join(' ') + ' | ' + Object.entries(G.passives).map(([k, v]) => k + v).join(' ');
  const sectors = []; let cur = { sector: G.sector, t0: 0, lost: 0, bossAt: 0, bossDown: 0, chests: 0, nukes: 0, peakEn: 0, maxWeapons: 0 };
  const bot = () => {
    let fx = 0, fy = 0, threat = false;
    for (const e of G.en) { if (e.flee) continue; const dx = G.px - e.x, dy = G.py - e.y, d = Math.hypot(dx, dy) || 1; if (d < (e.boss ? 300 : 150) + e.r) { threat = true; fx += dx / d / d * 220; fy += dy / d / d * 220; } }
    for (const b of G.bul) { if (!b.enemy) continue; const dx = G.px - b.x, dy = G.py - b.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { threat = true; fx += dx / d / d * 120; fy += dy / d / d * 120; } }
    if (!threat) {
      if (G.gate) { fx = G.gate.x - G.px; fy = G.gate.y - G.py; }
      else { let best = null, bd = 600;
        for (const p of G.pk) { if (p.k === 'mine' || p.k === 'hole') continue; const d = Math.hypot(p.x - G.px, p.y - G.py); if (d < bd) { bd = d; best = p; } }
        if (!best) { bd = 460; for (const g of G.gems) { const d = Math.hypot(g.x - G.px, g.y - G.py); if (d < bd) { bd = d; best = g; } } }
        if (best) { fx = best.x - G.px; fy = best.y - G.py; }
        else if (G.bossAlive) { const b = G.bossAlive, d = Math.hypot(b.x - G.px, b.y - G.py); if (d > 420) { fx = b.x - G.px; fy = b.y - G.py; } } } }
    const l = Math.hypot(fx, fy); S.stick = l > 0.01 ? { x: fx / l, y: fy / l, l: 1 } : { x: 0, y: 0, l: 0 };
  };
  const pickCard = () => { const c = S.cards; if (!c.length) return; let w;
    if (${JSON.stringify(policy)} === 'weapons') w = c.find(k => k.w) || c[0];
    else w = c[G.level % 2] || c[0];
    S.applyCard(w); S.scene = 'play'; };
  let steps = 0, lastHp = G.hp + G.sh, lastPk = 0;
  while (steps < MAXT / DT) {
    bot(); S.sim(DT, DT); steps++;
    if (S.scene === 'levelup') pickCard();
    if (S.scene !== 'play') break;
    const now = G.hp + G.sh; if (now < lastHp) cur.lost += lastHp - now; lastHp = now;
    if (G.en.length > cur.peakEn) cur.peakEn = G.en.length;
    if (G.bossAlive && !cur.bossAt) cur.bossAt = +G.secT.toFixed(1);
    if (cur.bossAt && !cur.bossDown && !G.bossAlive) cur.bossDown = +G.secT.toFixed(1);
    if (G.sector !== cur.sector) { cur.level = G.level; cur.ranks = ranks(); cur.evolved = G.evolved || 0; cur.build = build(); cur.t = +G.t.toFixed(0); cur.pool = G.maxhp + G.maxsh; cur.fight = cur.bossDown ? +(cur.bossDown - cur.bossAt).toFixed(1) : null; sectors.push(cur);
      cur = { sector: G.sector, t0: G.t, lost: 0, bossAt: 0, bossDown: 0, chests: 0, nukes: 0, peakEn: 0 }; lastHp = G.hp + G.sh; }
  }
  cur.level = G.level; cur.ranks = ranks(); cur.evolved = G.evolved || 0; cur.build = build(); cur.t = +G.t.toFixed(0); cur.pool = G.maxhp + G.maxsh; cur.fight = cur.bossDown ? +(cur.bossDown - cur.bossAt).toFixed(1) : null; cur.partial = true; sectors.push(cur);
  const out = { dif: G.dif.id, mode: G.mode, twist: G.mod ? G.mod.id : '', end: S.scene === 'win' ? 'won' : S.scene === 'over' ? 'died' : 'timeout', sector: G.sector, t: +G.t.toFixed(0), level: G.level, score: G.score, kills: G.kills, gems: Math.round(G.gemsGot || 0), by: G.lastHit || '', evolved: G.evolved || 0, build: build(), sectors };
  S.stick = null; S.scene = 'title'; return out;
})()`;

const jobs = []; for (let i = 0; i < RUNS; i++) jobs.push(i);
const results = [];
const worker = async () => {
  while (jobs.length) {
    const i = jobs.shift();
    const ctx = await browser.newContext({ viewport: { width: 430, height: 932 } });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(`http://127.0.0.1:${PORT}/docs/star-swarm/`, { waitUntil: 'load', timeout: 20000 });
    await sleep(800);
    /* difficulty is a title choice; set it through the store the title reads */
    await pg.evaluate(`window.__setDif = i => { localStorage.setItem('starswarm.diff', JSON.stringify(i)); }`);
    await pg.evaluate(`localStorage.setItem('starswarm.diff', JSON.stringify(${['easy', 'medium', 'hard'].indexOf(DIF)})); localStorage.setItem('starswarm.mode', JSON.stringify(${['campaign', 'endless', 'daily'].indexOf(MODE)}));`);
    await pg.reload({ waitUntil: 'load' }); await sleep(800);
    const t0 = Date.now();
    let r;
    try { r = await pg.evaluate(PLAY(DIF, MODE, TWIST, MAXMIN, POLICY, i)); }
    catch (e) { r = { error: e.message.slice(0, 200) }; }
    r.run = i + 1; r.wall = Math.round((Date.now() - t0) / 1000); if (errs.length) r.pageError = errs[0].slice(0, 160);
    results.push(r);
    const line = r.error ? `run ${r.run}: ERROR ${r.error}` :
      `run ${r.run}: ${r.end} in sector ${r.sector} at ${Math.floor(r.t / 60)}:${String(r.t % 60).padStart(2, '0')}  level ${r.level}  score ${r.score}  evolved ${r.evolved}  ${r.by ? 'killed by ' + r.by.toLowerCase() : ''}  (${r.wall}s)`;
    console.log(line);
    for (const s of r.sectors || []) console.log(`    s${s.sector}${s.partial ? '*' : ' '} lvl ${String(s.level).padStart(2)} ranks ${String(s.ranks).padStart(2)} evo ${s.evolved}  lost ${String(Math.round(s.lost)).padStart(4)}/${s.pool}  boss ${s.fight == null ? (s.bossAt ? 'unfinished' : '   -   ') : String(s.fight + 's').padStart(6)}  peak ${String(s.peakEn).padStart(3)}  ${s.build}`);
    if (JSONL) fs.appendFileSync(JSONL, JSON.stringify(r) + '\n');
    await ctx.close();
  }
};
console.log(`${DIF} ${MODE}${TWIST ? ' ' + TWIST : ''}: ${RUNS} runs, ${PAR} at a time, ${POLICY} first`);
await Promise.all(Array.from({ length: Math.min(PAR, RUNS) }, worker));
await browser.close(); srv.close();
