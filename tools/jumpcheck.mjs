/* Does the jump behave, and does a real finger produce one?

   Four things, because a jump that only exists in the physics is no use and a
   button that only works from JS proves nothing:
     - a tap of DRIFT lifts the kart and puts it back down
     - a ramp throws it much higher, for about a second
     - a trick in the air pays a boost on landing, and no trick pays nothing
     - the ramps are where a kart actually drives, on every circuit

   The tap is a real CDP touch, not a synthesised TouchEvent - an untrusted
   event skips the hit-testing, so it can pass while the game is dead to a
   finger.

     PLAYWRIGHT=... node tools/jumpcheck.mjs        */

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
const W = 430, H = 932;

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
  s.listen(8353, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });
const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://127.0.0.1:8353/docs/turbo-karts/', { waitUntil: 'load', timeout: 20000 });
await sleep(1500);
const cdp = await pg.context().newCDPSession(pg);
const clearShelf = () => pg.evaluate(() => {
  for (const id of ['shelf-menu-stuck', 'shelf-menu-veil']) {
    const el = document.getElementById(id); if (el) el.remove(); }
}).catch(() => {});

/* what the physics says should happen, so the checks below are against the
   design rather than against a number somebody once measured */
const PH = await pg.evaluate('window.TK.physics');

let bad = 0;
const check = (name, ok, detail) => {
  if (!ok) bad++;
  console.log(`${name.padEnd(34)} ${detail} ${ok ? 'ok' : '<-- FAIL'}`);
};

/* --------------------------------------------- a real finger on DRIFT hops */
await pg.evaluate(`window.TK.fx=false;window.TK.start(0,'sophia');window.TK.go()`);
await sleep(500);
await clearShelf();
/* Standing still on purpose. A hop needs no speed - that is part of the point,
   you can flick it over a banana from a standstill - and a rolling kart would
   reach a real ramp mid-measurement and chain one jump into the next. */
await pg.evaluate(`window.TK.R.player.sp=0`);
const pads = await pg.evaluate('window.TK.__pads()');
const dp = pads.drift;
const tap = async () => {
  const x = Math.round(dp.x + dp.w / 2), y = Math.round(dp.y + dp.h / 2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart',
    touchPoints: [{ x, y, id: 1 }] });
  await sleep(70);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
await tap();
/* the finger only has to produce a jump - how high is the next check's job,
   and a poll from out here is far too coarse to measure a 0.4s arc */
let sawAir = false;
for (let i = 0; i < 30 && !sawAir; i++) {
  if ((await pg.evaluate('window.TK.jump.z')) > 0) sawAir = true;
  await sleep(20);
}
check('a real finger on DRIFT hops', sawAir, 'the kart left the road');

/* ------------------------------------------- and the arc is what it claims.
   Stepped at a fixed dt inside the page: a software-rendered frame here is
   slower than the game's own clamp, so timing anything from out here measures
   this container rather than the game. */
const arc = k => pg.evaluate(`(() => {
  const k = window.TK.R.player;
  k.boost = 0; k.rampCd = 0; k.jz = 0; k.jvz = 0;
  k.sp = k.top * 0.8;
  window.TK.__${k}();
  k.sp = k.top * 0.15;          /* too slow to reach a second, real ramp */
  let peak = 0, t = 0;
  for (let i = 0; i < 200 && (i === 0 || k.jz > 0); i++) {
    window.TK.sim(1/60, 1/60); t += 1/60;
    if (k.jz > peak) peak = k.jz;
  }
  return { peak, air: t, down: k.jz, boost: k.boost };
})()`);

/* Stepping at 1/60 samples the apex just after it, so the measured peak is a
   little under the analytic one - by at most one step's worth of climb, v/60.
   It may never be over it. */
const near = (got, want, v) => got <= want + 0.5 && want - got < v / 60;

const hopA = await arc('hop');
check('the hop goes as high as it should',
  near(hopA.peak, PH.hopPeak, PH.HOP_V) && hopA.down === 0
  && hopA.air > 0.35 && hopA.air < 0.55,
  `${hopA.peak.toFixed(0)} units up (wants ${PH.hopPeak.toFixed(0)}), ` +
  `${hopA.air.toFixed(2)}s in the air`);

const rampA = await arc('ramp');
check('a ramp throws it much higher',
  near(rampA.peak, PH.rampPeak, PH.RAMP_V) && rampA.down === 0
  && rampA.air > 0.7 && rampA.air < 0.95 && rampA.peak > hopA.peak * 3,
  `${rampA.peak.toFixed(0)} units up (wants ${PH.rampPeak.toFixed(0)}), ` +
  `${rampA.air.toFixed(2)}s, against ${hopA.peak.toFixed(0)} for a hop`);

check('landing flat pays nothing', rampA.boost <= 0,
  `boost ${rampA.boost.toFixed(2)} after a plain landing`);

/* ------------------------------------------- trick in the air, boost on land */
const trick = await pg.evaluate(`(() => {
  const k = window.TK.R.player;
  k.boost = 0; k.rampCd = 0; k.jz = 0; k.jvz = 0; k.sp = k.top * 0.8;
  window.TK.__ramp(); k.sp = k.top * 0.15;
  window.TK.sim(0.2, 1/60);
  const at = k.jz; window.TK.__trick();
  const took = k.tricked;
  for (let i = 0; i < 200 && k.jz > 0; i++) window.TK.sim(1/60, 1/60);
  return { at, took, down: k.jz, boost: k.boost };
})()`);
check('a trick takes in the air', trick.took === 1 && trick.at > 0,
  `tricked at ${trick.at.toFixed(0)} units up`);
check('and pays a boost on landing', trick.down === 0 && trick.boost > 0.2,
  `boost ${trick.boost.toFixed(2)}`);

/* ------------------------------------------------- and you can hop a banana */
/* The banana goes a little way ahead, not underfoot: a hop started while you
   are already on top of one is still only three units up on its first frame,
   and that should hit. Timing it is the skill. */
const banana = await pg.evaluate(`(() => {
  const k = window.TK.R.player, out = {};
  const set = () => { k.spin = 0; k.jz = 0; k.jvz = 0; k.sp = k.top * 0.5;
    window.TK.R.hazards.length = 0;
    window.TK.R.hazards.push({ x: k.x + Math.cos(k.a) * 45,
                               y: k.y + Math.sin(k.a) * 45, r: 18, t: 0, life: 30 }) };
  set(); window.TK.sim(0.5, 1/60);
  out.grounded = k.spin > 0;                     /* driven into: it spins you */
  set(); window.TK.__hop(); window.TK.sim(0.5, 1/60);
  out.hopped = k.spin > 0;                       /* hopped early: it misses */
  k.spin = 0; k.jz = 0; k.jvz = 0; window.TK.R.hazards.length = 0;
  return out;
})()`);
check('a hop clears a banana',
  banana.grounded === true && banana.hopped === false,
  `driven into it spins you, hopped it misses`);

/* ------------------------------------- the ramps sit where a kart will drive */
for (let ti = 0; ti < 3; ti++) {
  const r = await pg.evaluate(`(() => {
    window.TK.start(${ti}, 'sophia');
    const R = window.TK.R, P = R.line.pts, N = P.length;
    /* how bent is the whole flight, take-off to landing - the bit that
       decides whether you come down on tarmac or in the trees */
    const run = i => { let w = 0;
      for (let t = -2; t <= 22; t++) { const c = Math.abs(P[((i + t) % N + N) % N].curve);
        if (c > w) w = c } return w };
    return { name: R.track.name, n: R.ramps.length,
      bends: R.ramps.map(rp => run(rp.i)),
      /* the promise is not "flat" - Jungle Ruins has no flat - but "the
         flattest run anywhere in this third of the lap". Check that. */
      best: R.ramps.map((rp, k) => {
        let b = 1e9;
        for (let t = 0; t < Math.floor(N / 3); t++) {
          const j = (Math.floor(N * k / 3) + t) % N;
          const w = run(j); if (w < b) b = w }
        return b }),
      gaps: R.ramps.map((rp, i) => {
        const nx = R.ramps[(i + 1) % R.ramps.length];
        let d = nx.i - rp.i; if (d < 0) d += N;
        return d / N;
      }) };
  })()`);
  await sleep(150);
  /* within 15% of the flattest run its third of the lap has to offer */
  const optimal = r.bends.every((b, i) => b <= r.best[i] * 1.15 + 0.01);
  const spread = r.gaps.every(g => g > 0.1);
  check(`${r.name.toLowerCase()} ramps`, r.n === 3 && optimal && spread,
    `${r.n} ramps, worst flight bends ${Math.max(...r.bends).toFixed(3)} ` +
    `(flattest on offer ${Math.max(...r.best).toFixed(3)}), ` +
    `closest pair ${(Math.min(...r.gaps) * 100).toFixed(0)}% of a lap apart`);
}

/* --------------------------- and the rivals can still get round without help */
const lap = await pg.evaluate(`(() => {
  window.TK.start(0, 'sophia'); window.TK.auto(true); window.TK.go();
  window.TK.sim(150, 1/60);
  const R = window.TK.R;
  return { laps: R.karts.map(k => k.lap), stuck: R.karts.filter(k => (k.stuckT||0) > 2).length,
           tricks: R.karts.filter(k => k.boost > 0).length };
})()`);
check('a race still runs itself', Math.min(...lap.laps) >= 1 && lap.stuck === 0,
  `after 150s everyone is on lap ${Math.min(...lap.laps)}+, ${lap.stuck} stuck`);

if (errs.length) { bad++; console.log('\npage error: ' + errs[0].slice(0, 140)); }
console.log(bad ? `\n${bad} checks failed` : '\nthe jump works, and a real finger makes one');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
