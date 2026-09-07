// Draws the home-screen icon (the eclipse) to icon.png.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
await page.setContent(`<canvas id=c width=180 height=180></canvas><script>
const g=document.getElementById('c').getContext('2d');const W=180;
const gr=g.createLinearGradient(0,0,0,W);gr.addColorStop(0,'#050914');gr.addColorStop(1,'#0b1a2e');g.fillStyle=gr;g.fillRect(0,0,W,W);
const glow=g.createRadialGradient(90,84,30,90,84,100);glow.addColorStop(0,'rgba(255,200,90,.7)');glow.addColorStop(1,'rgba(255,200,90,0)');g.fillStyle=glow;g.fillRect(0,0,W,W);
g.fillStyle='#ffe6a0';g.beginPath();g.arc(90,84,48,0,Math.PI*2);g.fill();g.fillStyle='#070a12';g.beginPath();g.arc(93,84,45,0,Math.PI*2);g.fill();
g.fillStyle='#04060b';for(const [x,w,h] of [[0,30,40],[30,22,70],[52,26,50],[78,20,84],[98,30,58],[128,24,72],[152,28,44]])g.fillRect(x,180-h,w,h);
g.fillStyle='#ffd166';g.font='900 26px sans-serif';g.textAlign='center';g.fillText('RORY',90,164);
</script>`);
await page.waitForTimeout(200);
const buf = await page.locator("#c").screenshot({ omitBackground: true });
await import("node:fs").then(fs => fs.writeFileSync("icon.png", buf));
await browser.close();
console.log("icon.png written");
