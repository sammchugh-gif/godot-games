/* Does Fact Dash teach the facts the way it should?

   The fact engine (docs/fact-dash/index.html, the "facts" section) is pure:
   no screen, no clock, a random source passed in. This lifts it out and
   checks it:

   - the facts: every set of every kind (adding and taking away, doubles,
     missing numbers, tens, times - a grown-up's own tables too) has the
     facts it should, every answer is right, nothing negative, no division
     that does not come out even;
   - the order: plus nothing, plus one and plus two first; ones and twos
     first in times;
   - the picking: never the same fact twice running; a missed fact back
     within three more; the fast ones mixed in, but mostly the ones being
     learned;
   - children: a quick one who knows everything, a typical first grader, and
     one who finds it hard. New facts must come in only as the ones being
     learned get fast - a struggling child is never flooded - and a quick one
     must not be held back;
   - a track finished hands on: facts made fast adding to 10 are not taught
     again when taking away joins them.

   Then, with PLAYWRIGHT set, it plays all nine games in a browser with real
   input - taps on the number keys, the balloons, the lily pads and the
   ledges, the basket dragged under an apple, a snowball flicked - one answer
   wrong in each, to go through the "here is what it looks like" help - on an
   upright phone, a sideways phone and an iPad, and fails on anything thrown.
   It chooses each kind of fact from the list a child sees, buys from the
   shop, and works the grown-ups' settings.

     node tools/factcheck.mjs                 the engine
     PLAYWRIGHT=... node tools/factcheck.mjs  and the games */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'docs/fact-dash/index.html'), 'utf8');
const SEC = '// ================================================================ ';
const a = html.indexOf(SEC + 'facts'), b = html.indexOf(SEC + 'saves');
if (a < 0 || b < 0) throw new Error('section markers missing');
const ctx = vm.createContext({ Math, Object, Array, Set, Number, String, JSON });
vm.runInContext(html.slice(a, b) + ';globalThis.E={AREAS,TRACKS,TRACK,trk,tablesId,families,trackFacts,toMeet,meet,pickFact,record,fluent,isFast,activeFacts,trackDone,fastCount,choices,factText,solved,keyText,POOL};', ctx);
const E = ctx.E;
let bad = 0;
const check = (name, ok, detail) => { console.log(`  ${name.padEnd(62)} ${detail ?? ''} ${ok ? 'ok' : '<-- FAIL'}`); if (!ok) bad++; };
function mulberry(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const kid = track => ({ facts: {}, intro: {}, retry: [], recent: [], tick: 0, track, pace: 5000 });

console.log('the facts');
const want = { add10: 66, addsub10: 132, addsub20: 242, dbl10: 10, dblh10: 20, dblh20: 40, dblh50: 100, bond10: 18, miss10: 90, miss20: 200,
  ten1: 100, tens2: 90, x2510: 126, x2345: 190, muldiv: 288, 'x:3': 46 };
// the answer worked out again here, from the numbers on show
const value = f => {
  if (f.op === 'm') { const [p0, s, p2, c] = f.p; return p0 == null ? (s === '+' ? c - p2 : c + p2) : s === '+' ? c - p0 : p0 - c; }
  return f.op === '+' ? f.x + f.y : f.op === '-' ? f.x - f.y : f.op === 'x' ? f.x * f.y : f.op === 'd' ? 2 * f.x : f.op === 'h' ? f.x / 2 : f.x / f.y;
};
function inRange(t, f) {
  if (t.kind === 'dbl') return f.op === 'd' ? f.x <= t.max : f.ans <= t.max;
  if (t.kind === 'mul') { const tb = t.tables, ok = f.op === 'x' ? f.x <= 12 && f.y <= 12 : f.ans <= 12 && f.y <= 12 && f.y >= 1;
    const a = f.op === 'x' ? f.x : f.y, b = f.op === 'x' ? f.y : f.ans; return ok && (!tb || tb.includes(a) || tb.includes(b)); }
  if (t.kind === 'miss') { const [p0, s, p2, c] = f.p, whole = s === '+' ? c : (p0 ?? f.ans);
    return whole <= t.max && (!t.bond || whole === 10) && f.x >= 1 && f.y >= 1 && (s === '+' ? Math.max(f.x, f.y) <= 10 : Math.max(f.y, c) <= 10) && (p0 == null) !== (p2 == null); }
  if (t.kind === 'ten') return f.y === 10 && (f.op === '+' ? f.x <= t.max : f.x <= t.max + 10);
  if (t.kind === 'tens') return f.x % 10 === 0 && f.y % 10 === 0 && f.ans % 10 === 0 && f.x <= 100 && f.ans <= 100 && f.ans >= 10;
  return f.op === '+' ? f.ans <= t.max && f.x <= 10 && f.y <= 10 : f.x <= t.max;
}
for (const t of E.TRACKS.concat([E.trk('x:3')])) {
  const fs_ = E.trackFacts(t.id), keys = new Set(fs_.map(f => f.k));
  const right = fs_.every(f => value(f) === f.ans && Number.isInteger(f.ans) && f.ans >= 0 && f.x >= 0 && f.y >= 0 && inRange(t, f));
  check(`${t.id}: ${want[t.id]} facts, each once, every answer right`, fs_.length === want[t.id] && keys.size === fs_.length && right, `${fs_.length} facts`);
}
check('every set belongs to a kind, and each kind is a ladder', E.TRACKS.every(t => E.AREAS.some(a => a.id === t.area) && (!t.next || E.TRACK[t.next].area === t.area)) && E.AREAS.every(a => E.TRACKS.some(t => t.area === a.id)));
check('a grown-up\'s own tables: "x:3,7" is the 3s and 7s, and only written one way', E.trk('x:3,7').name === 'The 3s and 7s' && E.trk('x:7,3') === null && E.tablesId([7, 3, 3, 13]) === 'x:3,7' && E.trk('x:3,7').area === 'times');
const fam = E.families('addsub10');
check('to 10: plus nothing, one, two, then doubles, then making ten', fam.slice(0, 11).every(f => f.a === 0) && fam.find(f => f.a === f.b && f.a > 2).r === 3 && fam.findIndex(f => f.c === 10 && f.a > 2 && f.a !== f.b) > fam.findIndex(f => f.a === 4 && f.b === 4), fam.slice(0, 4).map(f => f.id).join(' '));
const mf = E.families('muldiv');
check('times: ones, twos and tens before sevens and eights', mf.findIndex(f => f.a === 7 && f.b === 8) > mf.findIndex(f => f.a === 2 && f.b === 9) && mf[0].a === 1, mf.slice(0, 3).map(f => f.id).join(' '));
check('the 2s, 5s and 10s: no 7 x 8 in them, and the 2s first', !E.families('x2510').some(f => f.a === 7 && f.b === 8) && E.families('x2510').slice(0, 3).every(f => f.a === 1 || f.a === 2 || f.b === 2), E.families('x2510').slice(0, 3).map(f => f.id).join(' '));
const df = E.families('dblh50');
check('doubling: the small ones first, then tens, then fives', df.slice(0, 5).every(f => f.a <= 5) && df.findIndex(f => f.a === 30) < df.findIndex(f => f.a === 35) && df.findIndex(f => f.a === 35) < df.findIndex(f => f.a === 37), df.slice(0, 7).map(f => f.id).join(' '));
check('a double comes with its half: double 4 and half of 8', JSON.stringify(E.families('dblh10').find(f => f.id === 'd4').facts.map(f => [f.k, f.ans])) === '[["d4",8],["h8",4]]');
check('every family holds its own facts: 3 + 5, 5 + 3, 8 - 3, 8 - 5', JSON.stringify(fam.find(f => f.id === '3+5').facts.map(f => f.k)) === '["3+5","5+3","8-3","8-5"]');
check('Make 10: 1 + 9, 2 + 8 and 5 + 5 first', E.families('bond10').map(f => f.id).join(' ') === '1+9 2+8 5+5 3+7 4+6', E.families('bond10').map(f => f.id).join(' '));
{ const f = E.families('miss10').find(f => f.id === '3+5');
  check('a missing-number family: 3 + ? = 8, 5 + ? = 8, 8 - ? = 3, 8 - ? = 5', JSON.stringify(f.facts.map(x => [E.factText(x), x.ans])) === '[["3 + ? = 8",5],["5 + ? = 8",3],["8 − ? = 3",5],["8 − ? = 5",3]]'
    && E.solved(f.facts[2]) === '8 − 5 = 3' && E.keyText(f.facts[0].k) === '3 + ? = 8', f.facts.map(x => E.factText(x)).join(', ')); }
check('ten more, ten less: the ones under ten first, then the tens', E.families('ten1').slice(0, 9).every(f => f.a < 10) && E.families('ten1')[9].a === 10, E.families('ten1').slice(8, 12).map(f => f.facts[0].k).join(' '));
check('adding tens: 30 + 40, 40 + 30, 70 - 30, 70 - 40', JSON.stringify(E.families('tens2').find(f => f.id === '30+40').facts.map(f => f.k)) === '["30+40","40+30","70-30","70-40"]');

console.log('choosing answers to tap');
{ const R = mulberry(7); let ok = true, n = 0;
  for (const t of E.TRACKS.concat([E.trk('x:3,7')])) for (const f of E.trackFacts(t.id)) for (const k of [3, 4]) {
    const c = E.choices(f, k, R); n++;
    if (c.length !== k || !c.includes(f.ans) || new Set(c).size !== k || c.some(v => v < 0 || !Number.isInteger(v))) { ok = false; console.log('   ', f.k, c); break; }
  }
  check('always the answer, never twice, nothing negative', ok, `${n} sets`); }

/* a child who gets better with practice: at first right with probability
   p0, and quick (when right) with probability q0; after `grow` goes at a
   fact, nearly always right and quick */
function play(track, p0, q0, n, seed, onEach, grow = 1) {
  const R = mulberry(seed), k = kid(track), log = [], seen = {};
  let maxLearning = 0, rounds = 0;
  for (let i = 0; i < n; i++) {
    if (i % 12 === 0) { const m = E.toMeet(k, track); E.meet(k, track, m.quiet); E.meet(k, track, m.show); rounds++; }
    // mid-round: everything met is fast, so the next ones come in
    else if (!E.activeFacts(k, track).some(f => !E.isFast(k, f.k))) { const m = E.toMeet(k, track); E.meet(k, track, m.quiet); E.meet(k, track, m.show); }
    const f = E.pickFact(k, track, R);
    if (!f) break;
    const g = Math.min(1, (seen[f.k] = (seen[f.k] || 0) + 1) / grow), p = p0 + (Math.max(p0, 0.97) - p0) * g, q = q0 + (Math.max(q0, 0.95) - q0) * g;
    const right = R() < p, ms = right && R() < q ? 1500 : 4500;
    E.record(k, f.k, right, ms, 3000);
    log.push({ k: f.k, right });
    const learning = E.activeFacts(k, track).filter(x => !E.isFast(k, x.k)).length;
    maxLearning = Math.max(maxLearning, learning);
    if (onEach) onEach(k, f, right, i);
    if (E.trackDone(k, track)) return { k, n: i + 1, done: true, maxLearning, log };
  }
  return { k, n, done: false, maxLearning, log };
}

console.log('picking the next fact');
{ const r = play('addsub10', 0.85, 0.7, 3000, 11, null, 1e9);
  let twice = 0; for (let i = 1; i < r.log.length; i++) if (r.log[i].k === r.log[i - 1].k) twice++;
  check('never the same fact twice running', twice === 0, `${r.log.length} questions`);
  let late = 0, missed = 0;
  for (let i = 0; i < r.log.length; i++) if (!r.log[i].right) { missed++; const back = r.log.slice(i + 1, i + 5).findIndex(x => x.k === r.log[i].k); if (back < 0) late++; }
  check('a missed fact comes back within the next four', late === 0, `${missed} missed`); }
{ // with some fast and some being learned, about a quarter are the fast ones
  const R = mulberry(3), k = kid('addsub10');
  E.meet(k, 'addsub10', E.families('addsub10').slice(0, 12));
  const act = E.activeFacts(k, 'addsub10');
  act.forEach((f, i) => { if (i % 2) for (let j = 0; j < 3; j++) E.record(k, f.k, true, 1000, 3000); });
  let review = 0; const N = 2000;
  for (let i = 0; i < N; i++) { const f = E.pickFact(k, 'addsub10', R); if (E.isFast(k, f.k)) review++; k.recent = [f.k].concat(k.recent).slice(0, 4); }
  check('mostly facts being learned, fast ones mixed in', review / N > 0.18 && review / N < 0.4, `${Math.round(review / N * 100)}% review`); }

console.log('children');
// (a fact takes at least two quick right answers, and a quarter of the
// questions go to keeping the fast ones fast)
const quick = play('addsub10', 1, 1, 4000, 5);
check('a child who knows them all is not held back', quick.done && quick.n <= 132 * 2.8, `all 132 fast in ${quick.n} answers (${Math.ceil(quick.n / 30)} days of 30)`);
const typical = play('addsub10', 0.75, 0.3, 8000, 9, null, 6);
check('a typical first grader gets there', typical.done && typical.maxLearning <= E.POOL + 6, `${typical.n} answers (${Math.ceil(typical.n / 30)} days of 30), at most ${typical.maxLearning} being learned at once`);
const hard = play('addsub10', 0.55, 0.15, 12000, 13, null, 14);
check('a child who finds it hard gets there too, never flooded', hard.done && hard.maxLearning <= E.POOL + 6, `${hard.n} answers (${Math.ceil(hard.n / 30)} days of 30), at most ${hard.maxLearning} being learned at once`);
const times = play('muldiv', 0.8, 0.4, 15000, 21, null, 6);
for (const [tid, lim] of [['bond10', 300], ['miss10', 2500], ['ten1', 2500], ['tens2', 2500], ['x2510', 2500]]) {
  const r = play(tid, 0.75, 0.3, 8000, 23, null, 6);
  check(`a typical child gets through ${E.TRACK[tid].name.toLowerCase()}`, r.done && r.n <= lim && r.maxLearning <= E.POOL + 6, `${r.n} answers, at most ${r.maxLearning} being learned at once`);
}
const dbl = play('dbl10', 0.75, 0.3, 4000, 17, null, 6);
check('a typical first grader learns double 1 to double 10', dbl.done && dbl.maxLearning <= E.POOL + 6, `${dbl.n} answers`);
check('times and divide to 12 can be finished', times.done, `${times.n} answers`);
{ const m = E.toMeet(dbl.k, 'dblh10');
  check('doubles learned: the halves come in a family at a time', m.quiet.length === 0 && m.show.length >= 1 && m.show.length <= 3 && m.show.every(f => f.facts.length === 2), `${m.show.length} shown`); }

console.log('one track to the next');
{ const k = quick.k; const m = E.toMeet(k, 'addsub20');
  const shownAgain = m.show.filter(f => f.c <= 10).length;
  check('facts made fast to 10 are not taught again to 20', shownAgain === 0 && m.quiet.length > 0 && m.show.length > 0, `${m.quiet.length} met quietly, ${m.show.length} shown`);
  const k2 = play('add10', 1, 1, 2000, 2).k;
  const m2 = E.toMeet(k2, 'addsub10');
  check('adding to 10 learned: taking away comes in a family at a time', m2.quiet.length === 0 && m2.show.length >= 1 && m2.show.length <= 3, `${m2.show.length} shown`);
  // (families already fast are passed over quietly when their turn comes)
  const k3 = play('bond10', 1, 1, 2000, 4).k, shown = [], quiet = [];
  for (let g = 0; g < 200; g++) { const m = E.toMeet(k3, 'miss10'); if (!m.show.length && !m.quiet.length) break;
    shown.push(...m.show); quiet.push(...m.quiet); E.meet(k3, 'miss10', m.quiet.concat(m.show));
    for (const f of m.show) for (const x of f.facts) for (let i = 0; i < 2; i++) E.record(k3, x.k, true, 1000, 3000); }
  check('Make 10 learned: the tens are not taught again in missing numbers', quiet.length === 5 && quiet.every(f => f.c === 10) && !shown.some(f => f.c === 10), `${quiet.length} met quietly, ${shown.length} shown`);
  const k4 = play('x2510', 1, 1, 3000, 6).k, m4 = E.toMeet(k4, 'x2345');
  check('the 2s, 5s and 10s learned: only the 3s and 4s are new', m4.quiet.length === 33 && m4.show.every(f => [3, 4].includes(f.a) || [3, 4].includes(f.b)), `${m4.quiet.length} met quietly, ${m4.show.length} shown`); }

/* ---------------------------------------------------------------- the games */
if (process.env.PLAYWRIGHT || await import('playwright').then(() => true, () => false)) {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { const m = await import(process.env.PLAYWRIGHT); chromium = m.chromium || (m.default && m.default.chromium); }
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
  const srv = await new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    fs.readFile(path.join(ROOT, 'docs', p), (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'text/plain' }); res.end(d); } }); });
    s.listen(8421, () => r(s)); });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p)) });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shots = process.env.SHOTS;
  for (const [w, h, tag] of [[393, 852, 'phone'], [852, 393, 'sideways'], [1024, 768, 'ipad']]) {
    console.log(`playing every game: ${tag} (${w}x${h})`);
    const bctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: tag !== 'ipad' });
    const pg = await bctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('http://127.0.0.1:8421/fact-dash/');
    await sleep(500);
    // a finger put down, moved and lifted, as the phone sends it
    const cdp = await bctx.newCDPSession(pg);
    const swipe = async (x0, y0, x1, y1, steps = 6) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
      for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps }] }); await sleep(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const tap = async b => { await pg.touchscreen.tap(b.x + b.w / 2, b.y + b.h / 2 + 2); await sleep(150); };
    const btn = async re => (await pg.evaluate(() => FD.buttons)).find(b => re.test(b.label));
    // the first screen asks who is playing: tap Dylan for real
    const who = await pg.evaluate(() => FD.scene);
    const card = await btn(/^Dylan$/);
    if (card) await tap(card);
    check('"Who\'s playing?", then a tap on Dylan', who === 'who' && (await pg.evaluate(() => FD.scene)) === 'home' && (await pg.evaluate(() => FD.me.name)) === 'Dylan');
    await pg.evaluate(() => { for (const g of FD.GAMES) FD.me.games[g.id] = 1; });
    if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_home.png` });
    let flicked = 0, dragged = 0;
    for (const g of ['rocket', 'balloon', 'ninja', 'ladybug', 'frog', 'apple', 'monster', 'snow', 'race']) {
      const c0 = await pg.evaluate(() => FD.me.coins);
      await pg.evaluate(id => FD.start(id), g);
      await sleep(150);
      let met = false, wrongs = 0, answered = 0, guard = 0, shot = false;
      for (;;) {
        if (++guard > 400) break;
        const s = await pg.evaluate(() => ({ scene: FD.scene, st: FD.R && FD.R.state, q: FD.R && FD.R.q && { ans: FD.R.q.ans, k: FD.R.q.k }, input: FD.R && FD.R.g.input,
          buttons: FD.buttons }));
        if (s.scene === 'meet') { met = true; if (shots && !shot) await pg.screenshot({ path: `${shots}/fd_${tag}_meet.png` });
          const b = s.buttons.find(b => /Let's play/.test(b.label));
          if (!b) { check(`${g}: "New facts!" can be left`, false, errs[0] || JSON.stringify(s.buttons.map(b => b.label))); break; }
          await tap(b); continue; }
        if (s.scene === 'done') break;
        if (s.scene !== 'play' || !s.q || (s.st !== 'ask' && s.st !== 'coach')) { await sleep(120); continue; }
        // the second question of each game is answered wrong, on purpose
        const wrong = s.st === 'ask' && answered === 1 && wrongs === 0;
        if (s.input === 'keys') {
          const v = wrong ? s.q.ans + 1 : s.q.ans;
          for (const d of String(v)) { const b = s.buttons.find(b => b.label === d); await pg.touchscreen.tap(b.x + b.w / 2, b.y + b.h / 2 + 2); await sleep(40); }
        } else {
          await sleep(650); // let the balloons rise, the pads, ledges and apples arrive
          const t2 = await pg.evaluate(() => FD.R.targets.map(t => ({ v: t.v, x: t.hx, y: t.hy, dead: !!t.dead || !!t.away })));
          const t = t2.find(t => (wrong ? t.v !== s.q.ans : t.v === s.q.ans) && !t.dead);
          if (!t || t.x == null) { await sleep(100); continue; }
          if (s.input === 'move') {
            // drag the basket from where it is to under the apple
            const from = await pg.evaluate(() => { const G = FD.R.L.G; return { x: G.x + G.w * FD.R.bx, y: G.y + G.h * 0.85 }; });
            await swipe(from.x, from.y, t.x, from.y); dragged++;
          } else if (s.input === 'fling' && !flicked && !wrong && await pg.evaluate(v => { const f = FD.R.from, a = t => Math.atan2(t.hy - f.y, t.hx - f.x),
              me = FD.R.targets.find(t => t.v === v); return FD.R.targets.every(t => t === me || t.dead || t.away || t.hx == null || Math.abs(a(t) - a(me)) > 0.35); }, t.v)) {
            // flick a snowball from below the thrower towards the snowman,
            // when no other snowman stands in the same line
            const f = await pg.evaluate(() => FD.R.from), d = Math.hypot(t.x - f.x, t.y - f.y);
            await swipe(f.x, f.y + 30, f.x + (t.x - f.x) / d * 90, f.y + 30 + (t.y - f.y) / d * 90, 5); flicked++;
          } else await pg.touchscreen.tap(t.x, t.y);
          // a basket waits for the apple to fall, a snowball has to fly
          if (s.input !== 'tap') for (let i = 0; i < 90; i++) { const st = await pg.evaluate(() => FD.R && FD.R.state); if (st !== s.st) break; await sleep(100); }
        }
        await sleep(60);
        if (wrong) { wrongs++; const st = await pg.evaluate(() => FD.R.state); if (st !== 'coach') check(`${g}: a wrong answer shows the fact`, false, st);
          if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_${g}_help.png` }); }
        else answered++;
        if (shots && answered === 3 && !shot) { shot = true; await sleep(300); await pg.screenshot({ path: `${shots}/fd_${tag}_${g}.png` }); }
        await sleep(200);
      }
      const end = await pg.evaluate(() => ({ scene: FD.scene, coins: FD.me.coins }));
      if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_${g}_done.png` });
      check(`${g}: played through with real input, one wrong and helped`, end.scene === 'done' && wrongs === 1 && end.coins > c0 && !errs.length,
        `${answered} right, +${end.coins - c0} coins${met ? ', met new facts' : ''}${errs.length ? ' ' + errs[0] : ''}`);
      await pg.evaluate(() => { FD.scene = 'home'; });
    }
    check('the basket was dragged and a snowball flicked, finger down to finger up', dragged >= 10 && flicked === 1, `${dragged} drags, ${flicked} flick`);
    // each kind of fact, chosen from the list a child sees on the home screen
    const choose = async name => { await pg.evaluate(() => { FD.scene = 'home'; }); await sleep(120); await tap(await btn(/^practise$/));
      const ok = (await pg.evaluate(() => FD.scene)) === 'pick'; if (shots && name === 'Doubles and halves') await pg.screenshot({ path: `${shots}/fd_${tag}_pick.png` });
      const b = await btn(new RegExp('^' + name + '$')); if (b) await tap(b); return ok && !!b; };
    const firstQ = async gid => { await pg.evaluate(id => FD.start(id), gid); await sleep(200);
      if ((await pg.evaluate(() => FD.scene)) === 'meet') { if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_meet_${gid}.png` }); await pg.evaluate(() => FD.go()); await sleep(150); }
      return pg.evaluate(() => FD.R && FD.R.q && FD.R.q.k); };
    const picked = await choose('Doubles and halves'), dq = await firstQ('balloon');
    await pg.evaluate(() => { FD.scene = 'home'; FD.me.mode = 'plus'; });
    const lq = await firstQ('ladybug');
    check('"Doubles" from the list turns the games to doubling; Ladybird always doubles', picked && /^[dh]\d+$/.test(dq || '') && /^[dh]\d+$/.test(lq || ''), `${dq}, ${lq}`);
    await choose('Missing numbers');
    const mq = await firstQ('rocket');
    if (shots) { await sleep(300); await pg.screenshot({ path: `${shots}/fd_${tag}_rocket_missing.png` }); }
    { const s = await pg.evaluate(() => ({ ans: FD.R.q.ans, buttons: FD.buttons }));
      for (const d of String(s.ans)) { const b = s.buttons.find(b => b.label === d); await pg.touchscreen.tap(b.x + b.w / 2, b.y + b.h / 2 + 2); await sleep(40); }
      const r = await pg.evaluate(() => ({ ok: FD.R.ok, st: FD.R.state }));
      check('missing numbers: "3 + ? = 8", the answer typed on the keys', /\?/.test(mq || '') && r.ok === 1 && r.st === 'good', `${mq}`); }
    await choose('Tens');
    const tq = await firstQ('balloon');
    if (shots) { await sleep(700); await pg.screenshot({ path: `${shots}/fd_${tag}_balloon_tens.png` }); }
    check('tens: ten more and ten less', /^\d+[+-]10$/.test(tq || ''), tq);
    // times and divide are off Dylan's list until a grown-up adds them
    await pg.evaluate(() => { FD.scene = 'home'; }); await sleep(100); await tap(await btn(/^practise$/));
    const hidden = !(await btn(/^Times and divide$/));
    await pg.evaluate(() => { FD.scene = 'settings'; }); await sleep(150);
    await tap(await btn(/^× and ÷$/)); // on the list row
    await tap(await btn(/^Choose tables$/));
    const t1 = await pg.evaluate(() => FD.me.lv.times);
    await tap(await btn(/^7$/));
    const t2 = await pg.evaluate(() => FD.me.lv.times);
    if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_settings.png` });
    for (const n of [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12]) { const b = await btn(new RegExp('^' + n + '$')); const on = await pg.evaluate(k => FD.me.lv.times.split(/[:,]/).includes(String(k)), n); if (on) await tap(b); }
    const t3 = await pg.evaluate(() => FD.me.lv.times);
    await choose('Times and divide');
    const xq = await firstQ('balloon');
    check('grown-ups: times added to the list, the 7s alone chosen, and asked', hidden && t1 === 'x:2,5,10' && t2 === 'x:2,5,7,10' && t3 === 'x:7' && /(^|\D)7(\D|$)/.test(xq || '') && /[x/]/.test(xq || ''), `${t1} > ${t2} > ${t3}: ${xq}`);
    await pg.evaluate(() => { FD.scene = 'settings'; }); await sleep(100); await tap(await btn(/^Speed and more$/));
    if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_settings2.png` });
    // the shop: buy a pet and a room with real taps, page through the hats,
    // and save up for something too dear
    await pg.evaluate(() => { FD.me.coins = 500; FD.me.wish = null; FD.scene = 'shop'; }); await sleep(150);
    await tap(await btn(/^Pets$/)); await tap(await btn(/^Puppy$/));
    if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_shop_pets.png` });
    await tap(await btn(/^Rooms$/)); await tap(await btn(/^Outer space$/));
    await tap(await btn(/^Hats$/));
    // (the halo is on whichever page the screen's size puts it)
    let halo = await btn(/^Halo$/), pages = 0;
    while (!halo && pages < 4) { const nx = await btn(/^next$/); if (!nx) break; await tap(nx); pages++; halo = await btn(/^Halo$/); }
    if (halo) await tap(halo);
    const sh = await pg.evaluate(() => ({ pet: FD.me.look.pet, room: FD.me.look.room, hat: FD.me.look.hat, coins: FD.me.coins, wish: FD.me.wish }));
    if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_shop_hats.png` });
    check('shop: a puppy and a room bought with real taps, the hats paged through', sh.pet === 'puppy' && sh.room === 'space' && sh.coins === 30 && !!halo,
      `${sh.pet}, ${sh.room}, ${sh.coins} coins left, ${pages} pages turned`);
    check('shop: a thing too dear (the halo) becomes what the player is saving for', sh.wish === 'hat:halo' && sh.hat !== 'halo', sh.wish);
    for (const sc of ['home', 'facts', 'who']) { await pg.evaluate(s => { FD.scene = s; }, sc); await sleep(150); if (shots) await pg.screenshot({ path: `${shots}/fd_${tag}_${sc}_after.png` }); }
    // every room, pattern, hat, extra and pet drawn once
    const drawn = await pg.evaluate(() => { const me = FD.me, was = JSON.stringify(me.look); let n = 0;
      for (const s of FD.SHOP) for (const it of s.items) { me.look[s.key] = it.id; n++; }
      me.look = JSON.parse(was); return n; });
    await pg.evaluate(() => { FD.scene = 'home'; });
    for (const s of await pg.evaluate(() => FD.SHOP.map(s => ({ key: s.key, ids: s.items.map(i => i.id) })))) for (const id of s.ids) {
      await pg.evaluate(([k, v]) => { FD.me.look[k] = v; }, [s.key, id]); await sleep(20); }
    check(`${tag}: every screen, and all ${drawn} things in the shop, draw`, !errs.length, errs[0] || '');
    await bctx.close();
  }
  await browser.close(); srv.close();
}
console.log(bad ? `\n${bad} checks failed` : '\nthe facts are taught as they should be');
process.exit(bad ? 1 : 0);
