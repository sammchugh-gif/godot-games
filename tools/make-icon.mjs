/* The app icon and launch image, drawn rather than hand-cut.

   Capacitor's asset tool wants one 1024 icon and one 2732 splash and makes
   every other size from them, so these two are all that is needed.

     PLAYWRIGHT=... node tools/make-icon.mjs     -> app/assets/{icon,splash}.png

   The icon is the player's ship from Star Swarm over the night sky the three
   games share, because a kid scanning a home screen recognises a shape long
   before they read a word. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app', 'assets');

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  const alt = process.env.PLAYWRIGHT;
  if (!alt) { console.error('needs playwright; see tools/touchcheck.mjs'); process.exit(2); }
  const m = await import(alt); chromium = m.chromium || (m.default && m.default.chromium);
}
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* S is the canvas size; everything is drawn in fractions of it so one routine
   serves a 1024 icon and a 2732 splash. `pad` keeps the art inside the circle
   iOS crops the icon to. */
const art = (S, kind) => `<!doctype html><html><head><style>
html,body{margin:0;width:${S}px;height:${S}px;overflow:hidden;background:#0a0c1e}
canvas{display:block}</style></head><body>
<canvas id="c" width="${S}" height="${S}"></canvas><script>
const S=${S}, kind=${JSON.stringify(kind)};
const x=document.getElementById('c').getContext('2d');
const TAU=Math.PI*2;
// night sky, the same one the three games open on
// The icon gets the gradient. The launch screen is flat: it shows for a blink,
// and a flat field compresses to a few KB where a 2732-square gradient does not.
if(kind==='icon'){const g=x.createLinearGradient(0,0,S*0.35,S);
 g.addColorStop(0,'#241a52');g.addColorStop(0.55,'#111233');g.addColorStop(1,'#05060f');
 x.fillStyle=g}else x.fillStyle='#0a0c14';
x.fillRect(0,0,S,S);
// a scatter of stars, bigger ones nearer the middle
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
if(kind==='icon'){for(let i=0;i<140;i++){
 const sx=rnd()*S,sy=rnd()*S,r=S*(0.0012+rnd()*0.0035);
 x.globalAlpha=0.25+rnd()*0.75;x.fillStyle='#ffffff';
 x.beginPath();x.arc(sx,sy,r,0,TAU);x.fill()}}
x.globalAlpha=1;
// a planet edge, bottom right, for depth
if(kind==='icon'){const pr=S*0.46,pcx=S*1.06,pcy=S*1.02;
 const pg=x.createRadialGradient(pcx-pr*0.4,pcy-pr*0.5,pr*0.1,pcx,pcy,pr);
 pg.addColorStop(0,'#4a3a7a');pg.addColorStop(1,'#1a1236');
 x.fillStyle=pg;x.beginPath();x.arc(pcx,pcy,pr,0,TAU);x.fill()}

// iOS crops an icon to a rounded square and then some, so the ship and its
// flame have to sit well inside the edges
const cx=S*0.5, cy=S*(kind==='splash'?0.44:0.44), s=S*(kind==='splash'?0.15:0.235);
// the exhaust flame
const fg=x.createLinearGradient(0,cy+s*0.5,0,cy+s*1.9);
fg.addColorStop(0,'rgba(255,200,80,0.95)');fg.addColorStop(1,'rgba(255,80,40,0)');
x.fillStyle=fg;
x.beginPath();x.moveTo(cx-s*0.34,cy+s*0.55);x.lineTo(cx,cy+s*1.85);
x.lineTo(cx+s*0.34,cy+s*0.55);x.closePath();x.fill();
// wings
x.fillStyle='#e0452f';
x.beginPath();x.moveTo(cx-s*0.30,cy-s*0.10);x.lineTo(cx-s*1.00,cy+s*0.72);
x.lineTo(cx-s*0.30,cy+s*0.56);x.closePath();x.fill();
x.beginPath();x.moveTo(cx+s*0.30,cy-s*0.10);x.lineTo(cx+s*1.00,cy+s*0.72);
x.lineTo(cx+s*0.30,cy+s*0.56);x.closePath();x.fill();
// hull
const hg=x.createLinearGradient(cx-s*0.4,0,cx+s*0.4,0);
hg.addColorStop(0,'#ff8a5a');hg.addColorStop(0.45,'#ff5a3a');hg.addColorStop(1,'#c4321f');
x.fillStyle=hg;
x.beginPath();x.moveTo(cx,cy-s*1.05);
x.quadraticCurveTo(cx+s*0.42,cy-s*0.2,cx+s*0.34,cy+s*0.62);
x.lineTo(cx-s*0.34,cy+s*0.62);
x.quadraticCurveTo(cx-s*0.42,cy-s*0.2,cx,cy-s*1.05);x.closePath();x.fill();
// canopy
x.fillStyle='#8fe3ff';
x.beginPath();x.ellipse(cx,cy-s*0.22,s*0.19,s*0.30,0,0,TAU);x.fill();
x.fillStyle='rgba(255,255,255,0.55)';
x.beginPath();x.ellipse(cx-s*0.06,cy-s*0.32,s*0.07,s*0.12,0,0,TAU);x.fill();
if(kind==='splash'){ // room for a word under the ship on the launch screen
 x.fillStyle='#ffd23f';x.textAlign='center';x.textBaseline='middle';
 x.font='600 '+Math.round(S*0.042)+'px -apple-system,system-ui,sans-serif';
 x.fillText('ARCADE',cx,cy+s*3.1)}
</script></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

for (const [name, size, kind] of [['icon', 1024, 'icon'], ['splash', 2732, 'splash']]) {
  const pg = await browser.newPage({ viewport: { width: size, height: size } });
  await pg.setContent(art(size, kind));
  await pg.waitForTimeout(250);
  const file = path.join(OUT, name + '.png');
  await pg.screenshot({ path: file });
  console.log(name + '.png', size + 'x' + size,
    (fs.statSync(file).size / 1024).toFixed(0) + 'KB');
  await pg.close();
}
await browser.close();
console.log('\nboth in app/assets - the Mac turns them into every size iOS wants:');
console.log('  npx @capacitor/assets generate --ios');
