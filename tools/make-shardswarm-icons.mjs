/* Shardswarm: app icon concepts.

   Paints four 1024 x 1024 icon concepts in the game's own look, using its
   ship and alien sprites from the running game, and a contact sheet that
   shows each one as the App Store shows it (large) and on a home screen
   (small, with the rounded mask iOS applies). Icons are opaque squares with
   square corners, which is what App Store Connect wants: iOS rounds them.

     PLAYWRIGHT=... node tools/make-shardswarm-icons.mjs
     writes Game24/icons/concept-*.png and Game24/icons/contact-sheet.png   */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  const m = await import(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.mjs');
  chromium = m.chromium || (m.default && m.default.chromium);
}
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = path.join(ROOT, 'Game24', 'icons');
fs.mkdirSync(OUT, { recursive: true });
const PORT = 8393;
const srv = await new Promise(r => {
  const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { rs.writeHead(404); rs.end(''); } else { rs.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript' }); rs.end(d); } });
  });
  s.listen(PORT, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME });
const pg = await browser.newPage({ viewport: { width: 800, height: 800 } });
await pg.goto(`http://127.0.0.1:${PORT}/docs/star-swarm-plus/`, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 600));

const result = await pg.evaluate(() => {
  const S = window.SW, TAU = Math.PI * 2, N = 1024;
  // a fixed dice, so the same concepts come out every time
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const R = (a, b) => a + rnd() * (b - a);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return [c, c.getContext('2d')]; };

  function space(g, hueA, hueB) {
    const bg = g.createRadialGradient(N * 0.5, N * 0.45, 40, N * 0.5, N * 0.5, N * 0.8);
    bg.addColorStop(0, hueA); bg.addColorStop(1, hueB); g.fillStyle = bg; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 5; i++) { // nebula wisps
      const x = R(0, N), y = R(0, N), r = R(200, 420), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, i % 2 ? 'rgba(170,70,200,0.20)' : 'rgba(60,120,230,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, N, N);
    }
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${R(0.25, 0.9).toFixed(2)})`; g.beginPath(); g.arc(R(0, N), R(0, N), R(0.8, 2.6), 0, TAU); g.fill(); }
  }
  // A rock at icon resolution: a lumpy outline, lit from the top left, with
  // craters that have a lit rim and a shadowed rim, as the game draws them.
  function rockPath(g, n, r, jit, s0) { g.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (1 - jit + jit * Math.abs(Math.sin(i * 12.9898 + s0) * 43758.5453 % 1)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
  function rock(g, x, y, r, s0, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    rockPath(g, 13, r, 0.22, s0);
    const f = g.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.1, 0, 0, r * 1.1);
    f.addColorStop(0, '#a3968a'); f.addColorStop(0.45, '#6b6157'); f.addColorStop(1, '#2d2722'); g.fillStyle = f; g.fill();
    g.lineWidth = r * 0.04; g.strokeStyle = 'rgba(20,14,10,0.9)'; g.stroke();
    g.save(); rockPath(g, 13, r, 0.22, s0); g.clip();
    for (let i = 0; i < 5; i++) { const a = s0 * 3 + i * 1.9, d = r * (0.2 + 0.45 * ((i * 0.37 + s0) % 1)), cr = r * (0.1 + 0.08 * (i % 3)), cx = Math.cos(a) * d, cy = Math.sin(a) * d;
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.arc(cx, cy, cr, 0, TAU); g.fill();
      g.lineWidth = cr * 0.25; g.strokeStyle = 'rgba(210,195,180,0.35)'; g.beginPath(); g.arc(cx, cy, cr, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
    g.restore(); g.restore();
  }
  // a shard: a hot-edged triangle of rock with a streak behind it
  function shard(g, x, y, a, len, glow) {
    g.save(); g.translate(x, y); g.rotate(a);
    if (glow) { const st = g.createLinearGradient(-len * 3.2, 0, 0, 0); st.addColorStop(0, 'rgba(255,140,60,0)'); st.addColorStop(1, 'rgba(255,170,90,0.55)');
      g.fillStyle = st; g.beginPath(); g.moveTo(-len * 3.2, 0); g.lineTo(0, -len * 0.3); g.lineTo(0, len * 0.3); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(len, 0); g.lineTo(-len * 0.5, -len * 0.6); g.lineTo(-len * 0.7, len * 0.25); g.lineTo(-len * 0.1, len * 0.55); g.closePath();
    g.fillStyle = '#7d6f62'; g.fill(); g.shadowColor = '#ff9a40'; g.shadowBlur = len * 0.8; g.lineWidth = len * 0.12; g.strokeStyle = '#ffb46a'; g.stroke(); g.shadowBlur = 0;
    g.restore();
  }
  function glow(g, x, y, r, inner, outer) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, inner); gr.addColorStop(0.4, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function ship(g, x, y, size, ang, id) {
    const sh = S.SHIPS.find(s => s.id === (id || 'falcon')), sp = S.sprite(sh);
    // the sprite faces along +x, so the engine is behind it on -x
    g.save(); g.translate(x, y); g.rotate(ang);
    const fl = g.createLinearGradient(-size * 0.28, 0, -size * 1.1, 0); fl.addColorStop(0, 'rgba(255,240,180,0.95)'); fl.addColorStop(0.4, 'rgba(255,140,40,0.7)'); fl.addColorStop(1, 'rgba(255,60,20,0)');
    g.fillStyle = fl; g.beginPath(); g.moveTo(-size * 0.28, -size * 0.1); g.lineTo(-size * 0.28, size * 0.1); g.lineTo(-size * 1.1, 0); g.closePath(); g.fill();
    g.drawImage(sp, -size / 2, -size / 2, size, size); g.restore();
  }
  function alien(g, type, col, x, y, size, ang) { const sp = S.enemySprite(type, col, false); g.save(); g.translate(x, y); g.rotate(ang || 0); g.drawImage(sp, -size / 2, -size / 2, size, size); g.restore(); }
  function bolt(g, x, y, r) { glow(g, x, y, r * 3, 'rgba(255,120,255,0.9)', 'rgba(255,60,220,0.35)'); g.fillStyle = '#ff70ff'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.45, 0, TAU); g.fill(); }
  function spark(g, x, y, n, len) { g.save(); g.lineCap = 'round'; for (let i = 0; i < n; i++) { const a = R(0, TAU), l = R(len * 0.4, len); g.strokeStyle = i % 2 ? '#ffd0ff' : '#ff80ff'; g.lineWidth = R(3, 6); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } g.restore(); }

  const out = {};
  // 1 BURST: the rock the moment it breaks, shrapnel through the swarm
  { seed = 11; const [c, g] = mk(); space(g, '#2a1650', '#07061a');
    const cx = N * 0.5, cy = N * 0.5;
    glow(g, cx, cy, 420, 'rgba(255,190,120,0.55)', 'rgba(255,110,40,0.20)');
    // the rock in pieces: wedges pushed out from the centre
    const pieces = 8;
    for (let i = 0; i < pieces; i++) { const a0 = i / pieces * TAU, a1 = (i + 1) / pieces * TAU, mid = (a0 + a1) / 2, push = 46;
      g.save(); g.translate(cx + Math.cos(mid) * push, cy + Math.sin(mid) * push);
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 250, a0 + 0.04, a1 - 0.04); g.closePath(); g.clip(); rock(g, 0, 0, 250, 1.3, 0); g.restore();
      g.save(); g.translate(cx + Math.cos(mid) * push, cy + Math.sin(mid) * push); g.shadowColor = '#ff8a30'; g.shadowBlur = 30; g.strokeStyle = '#ffb060'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(Math.cos(a0 + 0.04) * 250 * 0.96, Math.sin(a0 + 0.04) * 250 * 0.96); g.lineTo(0, 0); g.lineTo(Math.cos(a1 - 0.04) * 250 * 0.96, Math.sin(a1 - 0.04) * 250 * 0.96); g.stroke(); g.restore(); }
    glow(g, cx, cy, 170, 'rgba(255,255,235,1)', 'rgba(255,200,120,0.6)');
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + R(-0.1, 0.1), d = R(330, 440); shard(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, a, R(26, 40), true); }
    const cols = ['#60e0a0', '#ff60a0']; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.35, d = R(430, 480); alien(g, i % 2 ? 'swarmer' : 'scout', cols[i % 2], cx + Math.cos(a) * d, cy + Math.sin(a) * d, 130, a + Math.PI); }
    out.burst = c.toDataURL('image/png'); }

  // 2 COVER: the ship tucked behind a rock while the plasma breaks on it
  { seed = 23; const [c, g] = mk(); space(g, '#1b2a5c', '#060818');
    for (let i = 0; i < 6; i++) alien(g, i % 2 ? 'turret' : 'scout', i % 2 ? '#ffd040' : '#60e0a0', R(640, 960), R(70, 420), R(110, 150), R(0, TAU));
    ship(g, 300, 760, 340, -Math.PI * 0.3);
    rock(g, 560, 520, 230, 2.2, 0.4);
    const hits = [[700, 360], [760, 470], [730, 590]];
    for (const [x, y] of hits) { spark(g, x, y, 9, 70); bolt(g, x + 16, y - 6, 18); }
    for (let i = 0; i < 3; i++) bolt(g, R(820, 980), R(230, 640), 16);
    out.cover = c.toDataURL('image/png'); }

  // 3 HERO: the ship at the heart of a ring of shrapnel
  { seed = 41; const [c, g] = mk(); space(g, '#34185a', '#08061a');
    glow(g, N * 0.5, N * 0.52, 360, 'rgba(120,190,255,0.45)', 'rgba(80,120,255,0.12)');
    for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + R(-0.08, 0.08), d = R(300, 420); shard(g, N * 0.5 + Math.cos(a) * d, N * 0.52 + Math.sin(a) * d, a, R(22, 36), true); }
    ship(g, N * 0.47, N * 0.56, 560, -Math.PI / 4);
    out.hero = c.toDataURL('image/png'); }

  // 4 MONOGRAM: a heavy S cut from rock, glowing at the seams
  { seed = 57; const [c, g] = mk(); space(g, '#3a1450', '#0a0618');
    g.save(); g.font = 'italic 900 820px -apple-system,"Segoe UI",system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff8a30'; g.shadowBlur = 60; g.fillStyle = '#ff9a40'; g.fillText('S', N * 0.5, N * 0.54); g.shadowBlur = 0;
    // fill the letter with rock, then crack it
    // rock over the whole square, then cut to the letter
    const [lc, lg] = mk(); lg.fillStyle = '#5f564c'; lg.fillRect(0, 0, N, N); rock(lg, N * 0.5, N * 0.5, 720, 3.1, 0);
    lg.globalCompositeOperation = 'destination-in'; lg.font = g.font; lg.textAlign = 'center'; lg.textBaseline = 'middle'; lg.fillStyle = '#fff'; lg.fillText('S', N * 0.5, N * 0.54);
    lg.globalCompositeOperation = 'source-atop'; lg.strokeStyle = '#ffb060'; lg.lineWidth = 9; lg.shadowColor = '#ff8a30'; lg.shadowBlur = 20;
    for (let i = 0; i < 7; i++) { lg.beginPath(); let x = R(260, 760), y = R(160, 900); lg.moveTo(x, y); for (let k = 0; k < 4; k++) { x += R(-120, 120); y += R(-120, 120); lg.lineTo(x, y); } lg.stroke(); }
    g.drawImage(lc, 0, 0); g.restore();
    for (let i = 0; i < 10; i++) { const a = R(-0.6, 0.6), x = R(700, 960), y = R(120, 380); shard(g, x, y, a - 0.8, R(18, 30), true); }
    const cols = ['#60e0a0', '#ff60a0']; for (let i = 0; i < 9; i++) { const t = i / 8, x = 90 + t * 260, y = 900 - Math.sin(t * Math.PI) * 180; alien(g, i % 2 ? 'swarmer' : 'scout', cols[i % 2], x, y, 84, -0.6); }
    out.mono = c.toDataURL('image/png'); }
  return out;
});

const names = { burst: 'concept-1-burst', cover: 'concept-2-cover', hero: 'concept-3-ship', mono: 'concept-4-monogram' };
for (const k in names) fs.writeFileSync(path.join(OUT, names[k] + '.png'), Buffer.from(result[k].split(',')[1], 'base64'));

/* the contact sheet: each concept large, then at home-screen size, masked */
const labels = { burst: '1  BURST', cover: '2  COVER', hero: '3  SHIP', mono: '4  MONOGRAM' };
const sheet = await browser.newPage({ viewport: { width: 1400, height: 940 } });
await sheet.setContent(`<body style="margin:0;background:#e9ecf3;font:600 22px -apple-system,system-ui,sans-serif;color:#1a1c24">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;padding:36px">
${Object.keys(names).map(k => `<div style="background:#fff;border-radius:18px;padding:22px;display:flex;gap:22px;align-items:center">
  <img src="${result[k]}" style="width:380px;height:380px;border-radius:84px">
  <div style="display:flex;flex-direction:column;gap:18px;align-items:center">
   <div>${labels[k]}</div>
   <img src="${result[k]}" style="width:120px;height:120px;border-radius:27px">
   <img src="${result[k]}" style="width:60px;height:60px;border-radius:13px">
   <div style="background:#1b1f2c;border-radius:14px;padding:12px"><img src="${result[k]}" style="width:60px;height:60px;border-radius:13px;display:block"></div>
  </div></div>`).join('')}
</div></body>`);
await new Promise(r => setTimeout(r, 400));
await sheet.screenshot({ path: path.join(OUT, 'contact-sheet.png') });
await browser.close(); srv.close();
console.log('wrote', Object.values(names).map(n => n + '.png').join(', '), 'and contact-sheet.png to Game24/icons/');
