/* Build the iOS app's web payload from the games that already work.

   The games stay where they are - docs/ is still the shelf on the web - and
   this copies the three chosen ones into app/www/ with the handful of changes
   an app needs that a web page does not:

     - fresh.js comes out. It exists to pull a newer build over the wire when
       a phone is holding a stale copy of a web page. Inside an app bundle
       there is nothing newer to fetch, and a reviewer testing on a plane
       would see a failed request at launch.
     - the shelf's "Back to all games" lands on the app's own launcher, which
       lists three games rather than fifteen.

   Everything else is untouched, so a fix to a game on the web is a fix in the
   app the next time this runs.

     node tools/build-app.mjs        */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, 'app', 'www');

/* The three that are going in, in the order the launcher shows them. */
export const GAMES = [
  { slug: 'star-swarm',   name: 'Star Swarm',   tag: 'Fly, shoot, survive the swarm.',
    from: '#2a1a4a', to: '#0a0c1e', ink: '#ffd23f' },
  { slug: 'slime-storm',  name: 'Slime Storm',  tag: 'Hold them off and grow stronger.',
    from: '#0f3a2a', to: '#07161a', ink: '#8dff5a' },
  { slug: 'dungeon-dash', name: 'Dungeon Dash', tag: 'Dash through the dark and out again.',
    from: '#2a1030', to: '#0d0a16', ink: '#ff9a3f' },
];

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function copyGame(g) {
  const src = path.join(SRC, g.slug, 'index.html');
  let html = fs.readFileSync(src, 'utf8');

  /* no update check inside a bundle */
  const before = html;
  html = html.replace(/\n?\s*<script src="\.\.\/fresh\.js"[^>]*><\/script>/, '');
  if (html === before) throw new Error(g.slug + ': could not find the fresh.js tag to remove');
  if (/fresh\.js/.test(html)) throw new Error(g.slug + ': fresh.js still referenced');

  const dir = path.join(OUT, g.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return html.length;
}

function launcher() {
  const card = g => `      <a class="game" href="${g.slug}/" style="--from:${g.from};--to:${g.to};--ink:${g.ink}">
        <span class="name">${g.name}</span>
        <span class="tag">${g.tag}</span>
      </a>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Arcade</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#0a0c14;color:#fff;
 font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
 -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;
 overscroll-behavior:none}
body{display:flex;flex-direction:column;
 padding:calc(24px + env(safe-area-inset-top)) calc(20px + env(safe-area-inset-right))
         calc(24px + env(safe-area-inset-bottom)) calc(20px + env(safe-area-inset-left))}
h1{margin:0 0 4px;font-size:clamp(26px,7vw,40px);letter-spacing:-0.5px}
p.sub{margin:0 0 22px;color:#8e9bb3;font-size:clamp(13px,3.4vw,16px)}
.grid{display:grid;gap:14px;grid-template-columns:1fr;flex:1;align-content:start}
@media(min-width:620px){.grid{grid-template-columns:1fr 1fr}}
@media(orientation:landscape) and (max-height:500px){
 body{padding-top:calc(14px + env(safe-area-inset-top))}
 h1{font-size:24px}p.sub{margin-bottom:12px}
 .grid{grid-template-columns:1fr 1fr 1fr}}
a.game{display:flex;flex-direction:column;justify-content:flex-end;
 min-height:118px;padding:16px 18px;border-radius:18px;text-decoration:none;color:#fff;
 background:linear-gradient(150deg,var(--from),var(--to));
 border:1.5px solid rgba(255,255,255,0.12);
 box-shadow:0 10px 26px rgba(0,0,0,0.4);
 transition:transform .12s ease}
a.game:active{transform:scale(0.975)}
.name{font-size:clamp(20px,5.2vw,26px);font-weight:700;color:var(--ink)}
.tag{margin-top:3px;font-size:clamp(12px,3.2vw,14px);color:rgba(255,255,255,0.72)}
footer{margin-top:18px;color:#5c6780;font-size:12px;text-align:center}
</style></head><body>
  <h1>Arcade</h1>
  <p class="sub">Three games. No adverts, nothing to buy, works with no signal.</p>
  <div class="grid">
${GAMES.map(card).join('\n')}
  </div>
  <footer>Made for Sophia, Rory and Dylan.</footer>
</body></html>
`;
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

let total = 0;
for (const g of GAMES) total += copyGame(g);

/* the shared shelf button - pause, and a way back to the launcher */
fs.copyFileSync(path.join(SRC, 'menu.js'), path.join(OUT, 'menu.js'));
fs.writeFileSync(path.join(OUT, 'index.html'), launcher());

/* nothing in here may reach for the network: an app that needs a server is an
   app that fails on a plane, and a reviewer will try it on a plane */
for (const f of walk(OUT)) {
  const t = fs.readFileSync(f, 'utf8');
  const bad = t.match(/https?:\/\/(?!www\.w3\.org)[a-z0-9.-]+/gi);
  if (bad) throw new Error(f + ' reaches for ' + [...new Set(bad)].join(', '));
  if (/\bfetch\s*\(/.test(t)) throw new Error(f + ' calls fetch()');
}
function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p); else if (/\.(html|js)$/.test(e.name)) yield p;
  }
}

const files = [...walk(OUT)];
console.log('app/www built:', files.length, 'files,',
  (files.reduce((a, f) => a + fs.statSync(f).size, 0) / 1024).toFixed(0) + 'KB');
for (const g of GAMES) console.log('  ' + g.slug);
console.log('  no network calls, no external URLs');
