// Draws the home-screen icon (a snowflake melting into fire) to icon.png.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
await page.setContent(`<canvas id=c width=180 height=180></canvas><script>
const g=document.getElementById('c').getContext('2d');const W=180,T=Math.PI*2;
const sky=g.createLinearGradient(0,0,0,W);sky.addColorStop(0,'#071428');sky.addColorStop(0.62,'#123a66');sky.addColorStop(0.63,'#ff7a1a');sky.addColorStop(1,'#8a1a04');g.fillStyle=sky;g.fillRect(0,0,W,W);
const glow=g.createRadialGradient(90,118,6,90,118,90);glow.addColorStop(0,'rgba(255,150,60,.75)');glow.addColorStop(1,'rgba(255,150,60,0)');g.fillStyle=glow;g.fillRect(0,0,W,W);
// the snowflake
g.save();g.translate(90,72);g.strokeStyle='#dff6ff';g.lineCap='round';g.shadowColor='#7fe3ff';g.shadowBlur=10;
for(let i=0;i<6;i++){g.save();g.rotate(i*Math.PI/3);g.lineWidth=9;g.beginPath();g.moveTo(0,0);g.lineTo(0,-46);g.stroke();g.lineWidth=6;g.beginPath();g.moveTo(0,-26);g.lineTo(-13,-38);g.moveTo(0,-26);g.lineTo(13,-38);g.stroke();g.restore();}
g.restore();
// melting drips off the bottom of it
g.fillStyle='#bfefff';for(const [x,l] of [[66,26],[80,40],[96,34],[112,22]]){g.beginPath();g.moveTo(x-5,96);g.lineTo(x+5,96);g.lineTo(x+4,96+l);g.arc(x,96+l,4,0,Math.PI);g.closePath();g.fill();}
// the flame rising from the lava
g.fillStyle='#ffd166';g.beginPath();g.moveTo(90,122);g.bezierCurveTo(112,140,108,170,90,172);g.bezierCurveTo(72,170,68,140,90,122);g.fill();
g.fillStyle='#ff5a14';g.beginPath();g.moveTo(90,140);g.bezierCurveTo(102,150,100,168,90,168);g.bezierCurveTo(80,168,78,150,90,140);g.fill();
</script>`);
await page.waitForTimeout(200);
const buf = await page.locator("#c").screenshot({ omitBackground: true });
await import("node:fs").then(fs => fs.writeFileSync("icon.png", buf));
await browser.close();
console.log("icon.png written");
