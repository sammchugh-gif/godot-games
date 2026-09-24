/* Does Mahjong Club play American mah jongg properly?

   The rules - the card, reading a hand, the Charleston, calls, jokers,
   paying out, and the bots - are pure (no screen, no clock, a seeded
   shuffle), so this lifts them out of the page and checks them here:

   - the card: every hand on every mode's card is the right number of tiles
     and can actually be made from a real set (no more naturals than exist,
     jokers only in groups of three or more);
   - reading a hand: each hand, built from its own tiles, is mahjong; and a
     hand one tile short, or with a joker standing in a pair, is not;
   - whole games: four bots play hundreds of games in each mode. Every game
     has to end - someone goes mahjong, or the wall runs out - every one of
     the 152 tiles has to be somewhere exactly once all the way through, and
     every winner's hand has to be a hand on the card.

     node tools/mahjongcheck.mjs          200 games a mode
     node tools/mahjongcheck.mjs 1000     more */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(process.env.MAHJONG || path.join(ROOT, 'docs/mahjong-club/index.html'), 'utf8');
const SEC = '// ================================================================ ';
const a = html.indexOf(SEC + 'tiles\n'), b = html.indexOf(SEC + 'tile art');
if (a < 0 || b < 0) throw new Error('section markers missing');
const ctx = vm.createContext({ Math, Object, Int8Array, Array, Map, Set, Number, String, JSON, Infinity });
vm.runInContext(html.slice(a, b) + ';globalThis.E={CARDS,MODES,TILE,T_J,newGame,botStep,waitingOn,countsOf,winningHand,missing,tShort};', ctx);
const E = ctx.E, N = +process.argv[2] || 200;
let bad = 0;
const fail = m => { bad++; console.log('  FAIL ' + m); };

console.log('the card');
for (const m in E.CARDS) {
  const C = E.CARDS[m];
  for (const h of C.hands) {
    if (h.size !== C.size) fail(`${m}: "${h.src}" is ${h.size} tiles, not ${C.size}`);
    if (!h.variants.length) fail(`${m}: "${h.src}" cannot be made from the tiles`);
  }
  console.log(`  ${m.padEnd(9)} ${C.hands.length} hands, ${C.vars.length} ways to make them`);
}

console.log('reading a hand');
for (const m in E.CARDS) {
  const C = E.CARDS[m];
  let wins = 0, shorts = 0, pairs = 0;
  for (const h of C.hands) for (const v of h.variants) {
    // the hand from its own tiles, naturals first and jokers for the rest
    const c = new Int8Array(36);
    for (const e of v.need) { const nat = Math.min(e.t === 34 ? 8 : 4, e.n + e.j); c[e.t] += nat; c[35] += e.n + e.j - nat; }
    if (E.winningHand(C, c, [])) wins++; else fail(`${m}: "${h.src}" built from its tiles is not mahjong`);
    // one tile short is never mahjong
    const t = v.need[0].t; c[t]--; if (E.winningHand(C, c, [])) shorts++; c[t]++;
    // a joker can not stand in a pair
    const p = v.need.find(e => e.n >= 2 && c[e.t] >= 2);
    if (p) { c[p.t]--; c[35]++; if (E.missing(v, c, []) === 0) pairs++; c[p.t]++; c[35]--; }
  }
  if (shorts) fail(`${m}: ${shorts} hands a tile short read as mahjong`);
  if (pairs) fail(`${m}: ${pairs} hands took a joker in a pair`);
  console.log(`  ${m.padEnd(9)} ${wins} made hands are mahjong; none a tile short, no jokers in pairs`);
}

console.log('bots play');
for (const mode of ['easy', 'short', 'standard']) {
  let wins = 0, walls = 0, stuck = 0, steps = 0, self = 0, calls = 0;
  const t0 = Date.now();
  for (let g = 0; g < N; g++) {
    const G = E.newGame({ mode, seed: 7000 + g, dealer: g % 4, bots: [1, 1, 1, 1] });
    let n = 0;
    while (G.phase !== 'end' && n < 6000) {
      const r = E.botStep(G);
      if (r === false) break;
      if (typeof r === 'string') { fail(`${mode} game ${g}: a bot did something the rules refused: ${r}`); break; }
      n++;
      if (n % 25 === 0 || G.phase === 'end') {
        const all = [...G.wall, ...G.pool.map(p => p.id), ...G.seats.flatMap(s => [...s.hand, ...s.exp.flatMap(e => e.ids)])];
        const held = G.phase === 'claims' ? 1 : 0;
        if (new Set(all).size !== all.length || all.length + held !== 152) { fail(`${mode} game ${g}: ${all.length + held} tiles accounted for`); break; }
      }
    }
    steps += n;
    calls += G.log.filter(e => e.k === 'call').length;
    if (G.phase !== 'end') { stuck++; fail(`${mode} game ${g} never ended (${G.phase})`); continue; }
    if (G.result.wall) { walls++; continue; }
    wins++; if (G.result.self) self++;
    const s = G.seats[G.result.winner];
    if (!E.winningHand(G.card, E.countsOf(s.hand), s.exp)) fail(`${mode} game ${g}: the winner's tiles are not a hand on the card`);
    if (G.result.pay.reduce((x, y) => x + y, 0) !== 0) fail(`${mode} game ${g}: the payments do not add up`);
  }
  console.log(`  ${mode.padEnd(9)} ${N} games: ${wins} mahjong (${self} off the wall), ${walls} wall games, ${(calls / N).toFixed(1)} calls a game, ${(steps / N) | 0} moves a game (${((Date.now() - t0) / N).toFixed(0)} ms a game)`);
}
console.log(bad ? `\n${bad} problems` : '\nall good');
process.exit(bad ? 1 : 0);
