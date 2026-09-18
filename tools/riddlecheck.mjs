/* Riddle Rumble: is every puzzle in the bank actually a puzzle?

   The bank is built from a seed by families rather than typed out one at a
   time, which is the only honest way to get to a couple of thousand - but it
   means a single slip in a generator makes hundreds of broken questions at
   once. So every family is held to its own rule here, checked against the same
   seed the game built itself from:

     Word Glue        the answer joins both halves, and no wrong answer does
     Mixed Up         exactly one option is a rearrangement of the letters
     Sounds The Same  exactly one option is the listed sound-alike
     Hide And Seek    exactly one option is inside the sentence, and the
                      answer is not sitting there as a word of its own
     Rhyme Pairs      two words, and the clue does not give the answer away
                      (whether they rhyme is authored, not machine-checked -
                      WHALE and PAIL rhyme and share no letters)

   Four families were dropped for being quizzes rather than riddles - naming
   the odd one out of a category, naming one that is in it, naming the one
   that starts with two letters, naming the one that rhymes. They were 57% of
   the bank and every one of them was obvious. Nothing may bring them back.

   Plus the rules that apply to everything: four different options, the right
   one among them exactly once, nothing so long it will not fit on a button,
   no two puzzles asking the same thing, and a fresh game that does not ask
   the same kind twice running.

     PLAYWRIGHT=... node tools/riddlecheck.mjs        */

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
const WANT = 800;

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
  s.listen(8385, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });
const pg = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://127.0.0.1:8385/docs/riddle-rumble/', { waitUntil: 'load', timeout: 20000 });
await sleep(1600);

const BANK = await pg.evaluate('window.RD.bank');
const SEED = await pg.evaluate('window.RD.SEED');
const cdp = await pg.context().newCDPSession(pg);

const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const key = s => norm(s).split('').sort().join('');
const faults = {};                         // family -> [example, ...]
const note = (fam, why, p) => {
  const k = fam + ' — ' + why;
  (faults[k] = faults[k] || []).push(p.q + '  ->  ' + p.a + '  [' + p.w.join(' | ') + ']');
};

/* ------------------------------------------------- the rules of each family */
const compound = new Set(SEED.compound.map(([a, b]) => a + '|' + b));
const partner = {};
for (const [a, b] of SEED.homophone) { partner[norm(a)] = norm(b); partner[norm(b)] = norm(a); }
/* The hink-pink answers are a pair of words I wrote down because they rhyme,
   and no letter-matching rule can hear that - WHALE and PAIL rhyme and share
   nothing, MOVE and LOVE share three letters and do not. So this family is
   checked for the things a rule can settle: two words, four different
   options, and a clue that does not simply contain the answer, which is the
   fault that actually happened. The rhyme is authored, not machine-checked,
   and the check below says so rather than faking it. */
const hinkAnswers = new Set(SEED.hink.map(([, a]) => norm(a)));

const RULES = {
  'Word Glue': p => {
    const m = p.q.match(/both ([A-Z]+) and ([A-Z]+)/);
    if (!m) return 'the question does not name two halves';
    const [, a, b] = [m[0], m[1].toLowerCase(), m[2].toLowerCase()];
    const front = /IN FRONT/.test(p.q);
    const joins = x => front ? (compound.has(norm(x) + '|' + a) && compound.has(norm(x) + '|' + b))
                             : (compound.has(a + '|' + norm(x)) && compound.has(b + '|' + norm(x)));
    if (!joins(p.a)) return 'the answer does not join both halves';
    const alsoRight = p.w.filter(joins);
    if (alsoRight.length) return 'a wrong answer also works: ' + alsoRight.join(', ');
    return null;
  },
  'Mixed Up': p => {
    const m = p.q.match(/Unscramble ([A-Z]+)/);
    if (!m) return 'no scramble in the question';
    const k = key(m[1]);
    if (key(p.a) !== k) return 'the answer is not made of those letters';
    if (norm(m[1]) === norm(p.a)) return 'the scramble is the answer already';
    const also = p.w.filter(x => key(x) === k);
    if (also.length) return 'a wrong answer is also an anagram: ' + also.join(', ');
    return null;
  },
  'Sounds The Same': p => {
    const m = p.q.match(/sounds just like ([A-Z]+)/);
    if (!m) return 'no target word';
    const t = norm(m[1]);
    if (partner[t] !== norm(p.a)) return 'the answer is not the listed sound-alike';
    const also = p.w.filter(x => partner[norm(x)] === t);
    if (also.length) return 'a wrong answer also sounds the same: ' + also.join(', ');
    return null;
  },
  'Hide And Seek': p => {
    const m = p.q.match(/“(.+)”/);
    if (!m) return 'no sentence';
    const flat = norm(m[1]);
    if (flat.indexOf(norm(p.a)) < 0) return 'the answer is not in the sentence';
    if (new RegExp('\\b' + p.a + '\\b', 'i').test(m[1])) return 'the answer is not hidden, it is just there';
    const also = p.w.filter(x => flat.indexOf(norm(x)) >= 0);
    if (also.length) return 'a wrong answer is in there too: ' + also.join(', ');
    return null;
  },
  'Rhyme Pairs': p => {
    const parts = String(p.a).split(' ');
    if (parts.length !== 2) return 'the answer is not two words';
    const clue = norm(p.q);
    for (const w of parts) if (clue.indexOf(norm(w)) >= 0) return 'the clue gives the answer away';
    if (!hinkAnswers.has(norm(p.a))) return 'the answer is not one of the pairs in the seed';
    for (const bad of p.w) {
      if (String(bad).split(' ').length !== 2) return 'a wrong answer is not two words';
      if (!hinkAnswers.has(norm(bad))) return 'a wrong answer is not one of the pairs in the seed';
    }
    return null;
  },
};

/* ------------------------------------------------------- the rules for all */
let bad = 0, checked = 0;
const seenQ = {};
const byFamily = {};
const MAXOPT = 56;             /* longer than this and a button cannot show it */

for (const p of BANK) {
  byFamily[p.f] = (byFamily[p.f] || 0) + 1;
  const opts = [p.a].concat(p.w);
  if (p.w.length !== 3) { note(p.f, 'not three wrong answers', p); bad++; continue; }
  if (new Set(opts.map(norm)).size !== 4) { note(p.f, 'two options are the same', p); bad++; continue; }
  if (opts.some(o => !String(o).trim())) { note(p.f, 'an option is blank', p); bad++; continue; }
  if (opts.some(o => String(o).length > MAXOPT)) { note(p.f, 'an option is too long for a button', p); bad++; continue; }
  if (!String(p.q).trim()) { note(p.f, 'no question', p); bad++; continue; }
  const k = norm(p.q) + '|' + norm(p.a);
  if (seenQ[k]) { note(p.f, 'a duplicate of another puzzle', p); bad++; continue; }
  seenQ[k] = 1;
  const rule = RULES[p.f];
  if (rule) {
    checked++;
    const why = rule(p);
    if (why) { note(p.f, why.replace(/:.*/, ''), p); bad++; }
  }
}

/* ----------------------------------------------------------------- report */
console.log(`bank: ${BANK.length} puzzles across ${Object.keys(byFamily).length} families`);
for (const f of Object.keys(byFamily).sort((a, b) => byFamily[b] - byFamily[a]))
  console.log('  ' + f.padEnd(18) + String(byFamily[f]).padStart(5) +
    (RULES[f] ? '   checked against its own rule' : '   hand written, structure only'));
console.log(`\n${checked} of them were checked against a family rule, not just for shape`);

const kinds = Object.keys(faults);
if (kinds.length) {
  console.log('');
  for (const k of kinds.slice(0, 14)) {
    console.log(`${String(faults[k].length).padStart(5)}  ${k}`);
    console.log(`       e.g. ${faults[k][0]}`);
  }
  if (kinds.length > 14) console.log(`  ...and ${kinds.length - 14} more kinds`);
}

const enough = BANK.length >= WANT;
if (!enough) bad++;
console.log(`\n${BANK.length} puzzles, ${enough ? 'past' : 'SHORT OF'} the ${WANT} asked for`);

/* ------------------------------------------------- the quizzes stay dropped
   Naming the odd one out of a category, or the one that starts with BA, is a
   spelling test with four buttons. They were more than half the bank and the
   whole of the complaint. */
const GONE = ['Odd One Out', 'Which One', 'First Letters', 'Rhyme Time'];
const back = GONE.filter(f => byFamily[f]);
if (back.length) bad++;
console.log(back.length ? `the quiz families are back: ${back.join(', ')} <-- FAIL`
  : `no category quizzes, no spelling tests: ${GONE.join(', ')} all stayed out`);

/* ------------------------------------------------------ and a fresh shuffle
   Two games in a row must not open the same way, and one game must not ask
   the same kind of puzzle twice running while it has anything else left. */
const orders = await pg.evaluate(`(() => {
  const R = window.RD, out = [];
  for (let n = 0; n < 3; n++) { R.start('quiz', 0); out.push(R.G.order.slice(0, 40).map(i => R.bank[i])); }
  R.scene = 'title';
  return out.map(g => ({ q: g.map(p => p.q), f: g.map(p => p.f) }));
})()`);
const sameStart = orders[0].q[0] === orders[1].q[0] && orders[1].q[0] === orders[2].q[0];
const runs = orders.map(g => g.f.filter((f, i) => i && f === g.f[i - 1]).length);
const shuffled = !sameStart && runs.every(r => r === 0);
if (!shuffled) bad++;
console.log(shuffled
  ? `three games open on three different puzzles, and none asks the same kind twice running`
  : `SHUFFLE: ${sameStart ? 'three games opened on the same puzzle' : ''} ${runs.some(r => r) ? 'a game asked the same kind twice running (' + runs.join(', ') + ' times)' : ''} <-- FAIL`);

/* ------------------------------------------------ and can a finger play it?
   A bank of perfect puzzles is no use if the buttons are dead. This is a real
   CDP touch, the same queue a thumb goes through - a TouchEvent built in
   JavaScript is untrusted, skips hit-testing, and has passed on this shelf
   while the game was dead under a finger. */
const tap = async (x, y) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart',
    touchPoints: [{ x: Math.round(x), y: Math.round(y), radiusX: 9, radiusY: 9, force: 1, id: 1 }] });
  await sleep(50);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(180);
};
await pg.evaluate(() => { for (const id of ['shelf-menu-stuck', 'shelf-menu-veil']) {
  const el = document.getElementById(id); if (el) el.remove(); } });
const hit = async label => {
  const bs = await pg.evaluate('window.RD.buttons()');
  const b = bs.find(x => String(x.label).toUpperCase() === label.toUpperCase());
  if (!b) return false;
  await tap(b.x + b.w / 2, b.y + b.h / 2);
  return true;
};
let play = [];
if (!(await hit('START'))) play.push('no START button to press');
else {
  const inPlay = await pg.evaluate('window.RD.scene');
  if (inPlay !== 'play') play.push('pressing START did not start a game');
  else {
    /* find the right answer on screen and press it for real */
    const right = await pg.evaluate(`(() => {
      const G = window.RD.G, want = G.q.opts.findIndex(o => o.ok);
      const bs = window.RD.buttons();
      const b = bs.find(x => x.label.toLowerCase() === G.q.opts[want].t.toLowerCase());
      return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2, score: G.score } : null;
    })()`);
    if (!right) play.push('could not find the right answer among the buttons');
    else {
      await tap(right.x, right.y);
      const after = await pg.evaluate('({score:window.RD.G.score,right:window.RD.G.right})');
      if (after.score <= right.score) play.push('a correct tap scored nothing');
      if (after.right !== 1) play.push('a correct tap was not counted');
    }
    /* and a wrong one costs a life */
    await sleep(900);
    const wrong = await pg.evaluate(`(() => {
      const G = window.RD.G; if (G.picked >= 0) return null;
      const want = G.q.opts.findIndex(o => !o.ok);
      const bs = window.RD.buttons();
      const b = bs.find(x => x.label.toLowerCase() === G.q.opts[want].t.toLowerCase());
      return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2, lives: G.lives } : null;
    })()`);
    if (wrong) {
      await tap(wrong.x, wrong.y);
      const lives = await pg.evaluate('window.RD.G.lives');
      if (lives !== wrong.lives - 1) play.push('a wrong tap did not cost a life');
    }
  }
}
if (play.length) bad += play.length;
console.log('\na real finger: ' + (play.length ? play.join('; ') + '  <-- FAIL'
  : 'pressed START, answered right for points, answered wrong for a life'));

await browser.close();
srv.close();
if (errs.length) { bad++; console.log('page error: ' + errs[0].slice(0, 140)); }
console.log(bad ? `\n${bad} things are wrong` : '\nevery puzzle has one right answer and three wrong ones, and a finger can play it');
process.exit(bad ? 1 : 0);
