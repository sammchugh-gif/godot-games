# Emits docs/riddle-rumble/index.html from the seed in riddle_seed.py.
#
#   python3 tools/riddle_build.py
#   PLAYWRIGHT=... node tools/riddlecheck.mjs
#
# The seed goes into the page as data and the puzzles are built at load time by
# the game itself, so the thing the test checks and the thing the boys play are
# the same code. tools/riddlecheck.mjs reads the finished bank back out and
# holds every family to its own rule.
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import riddle_seed as D

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'riddle-rumble', 'index.html')
MIRROR = os.path.join(ROOT, 'Game15', 'index.html')

def js(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))

SEED = "const SEED={\n" + ",\n".join([
 " hink:" + js([[c, a] for c, a in D.HINK]),
 " compound:" + js([[a,b] for a,b in D.COMPOUND]),
 " anagram:" + js([[w, c] for w, c in D.ANAGRAM]),
 " homophone:" + js([list(h) for h in D.HOMOPHONE]),
 " hidden:" + js(D.HIDDEN),
 " odd:" + js({k: v.split() for k, v in D.ODD.items()}),
 " rhyme:" + js({k: v.split() for k, v in D.RHYME.items()}),
 " riddle:" + js([[q, a, w] for q, a, w in D.RIDDLE]),
 " emoji:" + js([[e, a, w] for e, a, w in D.EMOJI]),
 " logic:" + js([[q, a, w] for q, a, w in D.LOGIC]),
]) + "\n};\n"

HEAD = '''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Riddle Rumble</title>
<style>
html,body{margin:0;padding:0;height:100%;background:#161033;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none;touch-action:none}
body{position:fixed;inset:0}canvas{display:block;position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none}
</style><script src="../menu.js" defer></script>
<script src="../fresh.js" defer></script>
</head><body><canvas id="c"></canvas>
<script>
"use strict";
// ============================================================ Riddle Rumble
// Wordplay for seven to ten year olds. Four answers, a clock that eats the
// points rather than the turn, and a bank of a couple of thousand puzzles
// built from a seed so nobody memorises their way through it.
// Sophia, Rory and Dylan Games, Inc.
document.addEventListener("touchmove",e=>{if(e.cancelable)e.preventDefault()},{passive:false});
document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
const cv=document.getElementById("c"),cx=cv.getContext("2d");
let W=0,H=0,DPR=1;
const TAU=Math.PI*2,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const store={get(k,d){try{const v=localStorage.getItem("riddlerumble."+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem("riddlerumble."+k,JSON.stringify(v))}catch(e){}}};
const SAFE={t:0,r:0,b:0,l:0};
(function(){const d=document.createElement("div");
 d.style.cssText="position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;"+
  "padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
 document.body.appendChild(d);window.__safeProbe=d;})();
function safeRead(){const d=window.__safeProbe;if(!d)return;const c=getComputedStyle(d);
 SAFE.t=parseFloat(c.paddingTop)||0;SAFE.r=parseFloat(c.paddingRight)||0;
 SAFE.b=parseFloat(c.paddingBottom)||0;SAFE.l=parseFloat(c.paddingLeft)||0}
function layout(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
 cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);safeRead()}
window.addEventListener("resize",layout);layout();
// the shelf's exit button owns the top-left corner of every game
const EXITB=46;
// ---------------------------------------------------------------- text
// One routine for every string on screen, with a floor: if a line will not fit
// at nine pixels it is cut with an ellipsis rather than drawn over its
// neighbour. Every overlap this shelf has ever had came from text that was
// allowed to be as wide as it liked.
function textFit(s,x,y,size,col,maxw,align){
 s=String(s);cx.save();cx.textAlign=align||"center";cx.textBaseline="middle";
 let fs=size;
 if(maxw){cx.font="700 "+fs+"px -apple-system,system-ui,sans-serif";
  while(fs>9&&cx.measureText(s).width>maxw){fs-=1;cx.font="700 "+fs+"px -apple-system,system-ui,sans-serif"}
  if(cx.measureText(s).width>maxw){let t=s;
   while(t.length>1&&cx.measureText(t+"\\u2026").width>maxw)t=t.slice(0,-1);
   s=t+"\\u2026"}}
 cx.font="700 "+fs+"px -apple-system,system-ui,sans-serif";
 cx.fillStyle=col;cx.fillText(s,x,y);cx.restore();return fs}
// wrap into as many lines as it takes, shrinking until they fit the box
function wrapFit(s,x,y,size,col,maxw,maxh,lh){
 s=String(s);let fs=size;const gap=lh||1.22;
 const lines=fs2=>{cx.font="700 "+fs2+"px -apple-system,system-ui,sans-serif";
  const out=[];let cur="";
  for(const w of s.split(" ")){const t=cur?cur+" "+w:w;
   if(cx.measureText(t).width<=maxw||!cur)cur=t;else{out.push(cur);cur=w}}
  if(cur)out.push(cur);return out};
 let L=lines(fs);
 while(fs>10&&L.length*fs*gap>maxh){fs-=1;L=lines(fs)}
 cx.save();cx.textAlign="center";cx.textBaseline="middle";
 cx.font="700 "+fs+"px -apple-system,system-ui,sans-serif";cx.fillStyle=col;
 const th=L.length*fs*gap,y0=y-th/2+fs*gap/2;
 L.forEach((t,i)=>cx.fillText(t,x,y0+i*fs*gap));
 cx.restore();return{size:fs,lines:L.length,h:th}}
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);cx.beginPath();
 cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);
 cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
// ---------------------------------------------------------------- audio
let AC=null,master=null,sfxOn=store.get("sfx",true)!==false;
function audioInit(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();
 master=AC.createGain();master.gain.value=0.4;master.connect(AC.destination)}catch(e){}}
function tone(f0,f1,dur,type,vol,delay){if(!AC||!sfxOn)return;
 const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();
 o.type=type||"sine";o.frequency.setValueAtTime(f0,t);
 o.frequency.exponentialRampToValueAtTime(Math.max(f1,20),t+dur);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
 o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02)}
const SFX={
 tap(){tone(900,700,0.04,"square",0.07)},
 right(){[784,988,1319].forEach((f,i)=>tone(f,f,0.12,"triangle",0.16,i*0.06))},
 wrong(){tone(220,90,0.3,"sawtooth",0.14)},
 streak(n){const b=660+Math.min(6,n)*80;[b,b*1.25,b*1.5].forEach((f,i)=>tone(f,f,0.1,"square",0.13,i*0.05))},
 tick(){tone(1400,1400,0.02,"square",0.04)},
 over(){[523,494,440,392].forEach((f,i)=>tone(f,f,0.22,"square",0.14,i*0.14))},
 win(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,f,0.16,"square",0.16,i*0.1))}};
'''

GEN = r'''
// ============================================================ the bank
// A seed of a few hundred curated things, turned into a couple of thousand
// puzzles. Families rather than a list, for two reasons: a list of 2000
// hand-typed riddles is 1800 bad ones, and a child who plays this every day
// for a month would learn a list off by heart. A family cannot be memorised,
// only understood, which is the point of the thing.
let RNG=1;
function srand(s){RNG=(s>>>0)||1}
function rnd(){RNG^=RNG<<13;RNG>>>=0;RNG^=RNG>>17;RNG^=RNG<<5;RNG>>>=0;return RNG/4294967296}
function rint(a,b){return a+Math.floor(rnd()*(b-a+1))}
function pick(a){return a[rint(0,a.length-1)]}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rint(0,i);const t=a[i];a[i]=a[j];a[j]=t}return a}
// pick n distinct items from a pool, none of them in `not`
function others(pool,n,not){const seen={};for(const x of not)seen[norm(x)]=1;
 const out=[],tries=pool.length*6;
 for(let i=0;i<tries&&out.length<n;i++){const c=pick(pool);const k=norm(c);
  if(seen[k])continue;seen[k]=1;out.push(c)}
 return out}
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,"");
const cap=s=>String(s).charAt(0).toUpperCase()+String(s).slice(1);

function buildBank(){
 srand(20260913);
 const B=[];
 const add=(fam,q,a,w,hint)=>{if(w.length!==3)return;B.push({f:fam,q,a,w,h:hint||""})};

 // --- hink pinks -------------------------------------------------------
 {const all=SEED.hink.map(h=>h[1]);
  for(const [clue,ans] of SEED.hink)
   add("Rhyme Pairs","Two rhyming words: "+clue,ans,others(all,3,[ans]),
       "Both words rhyme.");}

 // --- compounds --------------------------------------------------------
 // Which word joins both of these? The halves are given as pairs rather than
 // worked out by splitting, and a wrong answer is checked against the same
 // pairs, so a distractor can never be quietly right.
 {const set={};for(const [a,b] of SEED.compound)set[a+"|"+b]=1;
  const heads={},tails={};
  for(const [a,b] of SEED.compound){(heads[a]=heads[a]||[]).push(b);(tails[b]=tails[b]||[]).push(a)}
  const headWords=Object.keys(heads),tailWords=Object.keys(tails);
  for(const h of headWords){
   const ends=[...new Set(heads[h])];if(ends.length<2)continue;
   const two=shuffle(ends.slice()).slice(0,2);
   const bad=others(headWords,20,[h]).filter(x=>!set[x+"|"+two[0]]&&!set[x+"|"+two[1]]).slice(0,3);
   add("Word Glue","Which word goes IN FRONT of both "+two[0].toUpperCase()+" and "+two[1].toUpperCase()+"?",
       h,bad,"Stick it on the front of both.");}
  for(const t of tailWords){
   const starts=[...new Set(tails[t])];if(starts.length<2)continue;
   const two=shuffle(starts.slice()).slice(0,2);
   const bad=others(tailWords,20,[t]).filter(x=>!set[two[0]+"|"+x]&&!set[two[1]+"|"+x]).slice(0,3);
   add("Word Glue","Which word goes AFTER both "+two[0].toUpperCase()+" and "+two[1].toUpperCase()+"?",
       t,bad,"Stick it on the end of both.");}}

 // --- anagrams ---------------------------------------------------------
 // Exactly one option is a rearrangement of the letters. The others are not,
 // so there is never an argument about it.
 {const key=s=>norm(s).split("").sort().join("");
  const all=SEED.anagram.map(a=>a[0]);
  for(const [word,clue] of SEED.anagram){
   const k=key(word);
   const bad=others(all,12,[word]).filter(x=>key(x)!==k).slice(0,3);
   const scram=shuffle(word.split("")).join("").toUpperCase();
   if(scram===word.toUpperCase())continue;
   add("Mixed Up","Unscramble "+scram+" — "+clue,word,bad,"Same letters, new order.");}}

 // --- homophones -------------------------------------------------------
 {const all=[];for(const h of SEED.homophone){all.push(h[0]);all.push(h[1])}
  const partner={};for(const h of SEED.homophone){partner[norm(h[0])]=norm(h[1]);partner[norm(h[1])]=norm(h[0])}
  for(const [a,b,clue] of SEED.homophone){
   const bad=others(all,14,[a,b]).filter(x=>partner[norm(x)]!==norm(a)&&partner[norm(x)]!==norm(b)).slice(0,3);
   add("Sounds The Same","Which word sounds just like "+a.toUpperCase()+" but "+clue+"?",b,bad,
       "Say them out loud.");
   const bad2=others(all,14,[a,b]).filter(x=>partner[norm(x)]!==norm(a)&&partner[norm(x)]!==norm(b)).slice(0,3);
   add("Sounds The Same","Which word sounds just like "+b.toUpperCase()+"?",a,bad2,"Say them out loud.");}}

 // --- hidden words -----------------------------------------------------
 // The word really is inside the sentence. Exactly one of the four is.
 {const all=Object.keys(SEED.hidden);
  for(const word of all){
   for(const carrier of SEED.hidden[word]){
    const flat=norm(carrier);
    if(flat.indexOf(norm(word))<0)continue;
    // sitting there as a word of its own is not hiding
    if(new RegExp("\\b"+word+"\\b","i").test(carrier))continue;
    const bad=others(all,14,[word]).filter(x=>flat.indexOf(norm(x))<0).slice(0,3);
    add("Hide And Seek","An animal is hiding in this sentence. Which one? “"+carrier+"”",
        word,bad,"Look across the gaps between words.");}}}

 // --- odd one out ------------------------------------------------------
 {const names=Object.keys(SEED.odd);
  // anything that turns up in two lists is no use as an odd one out
  const count={};for(const n of names)for(const m of SEED.odd[n])count[norm(m)]=(count[norm(m)]||0)+1;
  for(const n of names){
   const inside=SEED.odd[n].filter(m=>count[norm(m)]===1);
   if(inside.length<4)continue;
   const outside=[];
   for(const o of names){if(o===n)continue;
    for(const m of SEED.odd[o])if(count[norm(m)]===1)outside.push(m)}
   const howMany=Math.min(12,inside.length);
   for(let i=0;i<howMany;i++){
    const three=shuffle(inside.slice()).slice(0,3);
    const odd=others(outside,1,three)[0];if(!odd)continue;
    add("Odd One Out","Which one is NOT a "+n+"?",odd,three,"Three belong together.");}
   // and the other way round, which is a different puzzle to a child
   for(let i=0;i<Math.min(8,inside.length);i++){
    const one=pick(inside);
    const three=others(outside,3,[one]);
    if(three.length<3)continue;
    add("Which One","Which one IS a "+n+"?",one,three,"Only one fits.");}}}

 // --- rhymes -----------------------------------------------------------
 {const keys=Object.keys(SEED.rhyme);
  const groupOf={};for(const k of keys)for(const w of SEED.rhyme[k])groupOf[norm(w)]=k;
  const every=[];for(const k of keys)for(const w of SEED.rhyme[k])every.push(w);
  for(const k of keys){
   const g=SEED.rhyme[k];
   for(const target of g){
    const mates=g.filter(w=>norm(w)!==norm(target));if(!mates.length)continue;
    const right=pick(mates);
    const bad=others(every,14,[target,right]).filter(x=>groupOf[norm(x)]!==k).slice(0,3);
    add("Rhyme Time","Which word rhymes with "+target.toUpperCase()+"?",right,bad,"Listen to the ending.");
    // and the negative, which catches the child who is pattern-matching letters
    const three=shuffle(mates.slice()).slice(0,3);
    if(three.length<3)continue;
    const odd=others(every,1,g)[0];if(!odd)continue;
    add("Rhyme Time","Which word does NOT rhyme with "+target.toUpperCase()+"?",odd,three,"Three of them match.");}}}

 // --- starts with ------------------------------------------------------
 {const names=Object.keys(SEED.odd);
  const count={};for(const n of names)for(const m of SEED.odd[n])count[norm(m)]=(count[norm(m)]||0)+1;
  for(const n of names){
   const inside=SEED.odd[n].filter(m=>count[norm(m)]===1);
   for(const m of inside){
    const pre=String(m).slice(0,2);
    const same=inside.filter(x=>norm(x)!==norm(m)&&String(x).slice(0,2).toLowerCase()===pre.toLowerCase());
    if(same.length)continue;                       // two answers would fit
    const bad=others(inside,10,[m]).filter(x=>String(x).slice(0,2).toLowerCase()!==pre.toLowerCase()).slice(0,3);
    if(bad.length<3)continue;
    add("First Letters","Which "+n+" starts with "+pre.toUpperCase()+"?",m,bad,"Look at the first two letters.");}}}

 // --- the hand-written ones -------------------------------------------
 for(const [q,a,w] of SEED.riddle)add("Brain Teaser",q,a,w.slice(),"");
 for(const [e,a,w] of SEED.emoji)add("Picture Sums","What word do these make?  "+e,a,w.slice(),"Say each picture out loud.");
 for(const [q,a,w] of SEED.logic)add("Word Puzzles",q,a,w.slice(),"");

 // no two puzzles asking the same thing
 const seen={},out=[];
 for(const p of B){const k=p.f+"|"+norm(p.q)+"|"+norm(p.a);if(seen[k])continue;seen[k]=1;out.push(p)}
 return out}
const BANK=buildBank();
const FAMILIES=[...new Set(BANK.map(p=>p.f))];
'''

GAME = r'''
// ============================================================ the game
const MODES={
 quiz:{id:"quiz",name:"QUICK QUIZ",sub:"Twelve riddles. Three lives. Answer fast for more points.",
       col:"#ffd23f",n:12,lives:3,clock:0},
 clock:{id:"clock",name:"BEAT THE CLOCK",sub:"Ninety seconds. As many as you can. A wrong answer costs you five.",
        col:"#5ad1ff",n:0,lives:0,clock:90}};
const LEVELS=[
 {id:"easy",name:"WARM UP",col:"#8dff5a",think:18,desc:"Plenty of thinking time."},
 {id:"hard",name:"QUICK THINKING",col:"#ff8a5a",think:10,desc:"Half the time, double the points."}];

let scene="title",G=null,T=0;
let modeId=store.get("mode","quiz"),levelIdx=store.get("level",0);
let best=store.get("best",{});
let buttons=[];
const bestKey=(m,l)=>m+"@"+LEVELS[l].id;

function newGame(){
 const M=MODES[modeId],L=LEVELS[levelIdx];
 const order=shuffle(BANK.map((p,i)=>i));
 G={M,L,order,at:0,score:0,streak:0,bestStreak:0,right:0,wrong:0,
    lives:M.lives,clock:M.clock,q:null,think:0,picked:-1,revealT:0,
    asked:0,done:false,fresh:true};
 nextQuestion();
 scene="play"}

function nextQuestion(){
 if(G.at>=G.order.length)G.order=shuffle(BANK.map((p,i)=>i)),G.at=0;
 const p=BANK[G.order[G.at++]];
 const opts=shuffle([{t:p.a,ok:true}].concat(p.w.map(t=>({t,ok:false}))));
 G.q={p,opts};G.think=G.L.think;G.picked=-1;G.revealT=0;G.asked++}

function answer(i){
 if(G.picked>=0||G.done)return;
 G.picked=i;G.revealT=0;
 const ok=G.q.opts[i].ok;
 if(ok){
  // the clock takes points off rather than the turn away: a seven-year-old
  // still finishes the question, a ten-year-old still races
  const speed=clamp(G.think/G.L.think,0,1);
  const gain=Math.round((100+Math.round(speed*100))*(levelIdx?2:1)*(1+Math.min(5,G.streak)*0.2));
  G.score+=gain;G.right++;G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);
  G.q.gain=gain;
  if(G.streak>=3)SFX.streak(G.streak);else SFX.right()}
 else{
  G.wrong++;G.streak=0;G.q.gain=0;SFX.wrong();
  if(G.M.lives)G.lives--;
  if(G.M.clock)G.clock=Math.max(0,G.clock-5)}}

function advance(){
 if(G.M.lives&&G.lives<=0){finish();return}
 if(G.M.n&&G.asked>=G.M.n){finish();return}
 if(G.M.clock&&G.clock<=0){finish();return}
 nextQuestion()}

function finish(){
 G.done=true;scene="over";
 const k=bestKey(G.M.id,levelIdx);
 const b=best[k]||{score:0,streak:0,right:0};
 if(G.score>b.score)b.score=G.score;
 if(G.bestStreak>b.streak)b.streak=G.bestStreak;
 if(G.right>b.right)b.right=G.right;
 best[k]=b;store.set("best",best);
 if(G.right>G.wrong)SFX.win();else SFX.over()}

function step(dt){
 T+=dt;
 if(scene!=="play"||!G)return;
 if(G.picked>=0){
  G.revealT+=dt;
  if(G.revealT>(G.q.opts[G.picked].ok?0.85:1.9))advance();
  return}
 if(G.M.clock){const was=Math.ceil(G.clock);G.clock=Math.max(0,G.clock-dt);
  if(Math.ceil(G.clock)!==was&&G.clock<=10)SFX.tick();
  if(G.clock<=0){finish();return}}
 // the thinking clock only drains the points on offer, never the turn
 G.think=Math.max(0,G.think-dt)}

// ---------------------------------------------------------------- drawing
function btn(x,y,w,h,label,fn,o){o=o||{};buttons.push({x,y,w,h,fn,label,o})}
function drawButtons(){
 for(const b of buttons){
  const o=b.o;
  cx.fillStyle=o.fill||"rgba(255,255,255,0.09)";rr(b.x,b.y,b.w,b.h,o.r==null?14:o.r);cx.fill();
  cx.strokeStyle=o.stroke||"rgba(255,255,255,0.22)";cx.lineWidth=2;
  rr(b.x,b.y,b.w,b.h,o.r==null?14:o.r);cx.stroke();
  if(o.wrap)wrapFit(b.label,b.x+b.w/2,b.y+b.h/2,o.size||20,o.col||"#fff",b.w-24,b.h-16);
  else textFit(b.label,b.x+b.w/2,b.y+b.h/2,o.size||20,o.col||"#fff",b.w-24);
  if(o.note)textFit(o.note,b.x+b.w/2,b.y+b.h-13,Math.min(12,b.h*0.2),o.noteCol||"rgba(255,255,255,0.6)",b.w-20)}}

function backdrop(){
 const g=cx.createLinearGradient(0,0,W*0.3,H);
 g.addColorStop(0,"#2a1b5e");g.addColorStop(0.55,"#1a1240");g.addColorStop(1,"#0e0a22");
 cx.fillStyle=g;cx.fillRect(0,0,W,H);
 // a few quiet question marks drifting behind everything
 cx.save();cx.globalAlpha=0.07;
 for(let i=0;i<14;i++){
  const s=(i*97)%100/100,x=((s*W)+Math.sin(T*0.14+i)*22)%W;
  const y=((i*137)%H+T*7)%(H+90)-45;
  textFit("?",x,y,26+((i*31)%40),"#ffffff")}
 cx.restore()}

function uiBottom(){return H-SAFE.b-10}

function drawTitle(){
 backdrop();buttons=[];
 const wide=W>H*1.15;
 const bw=Math.min(360,W*0.82),bx=W/2-bw/2;
 const bh=Math.max(52,Math.min(74,H*0.09)),gap=10;
 // from the bottom up, so nothing can push off the foot of the screen
 let y=uiBottom()-bh;
 const startY=y;
 btn(bx,y,bw,bh,"START",()=>{audioInit();newGame()},
  {fill:"rgba(255,210,63,0.92)",stroke:"rgba(255,240,190,0.9)",col:"#231a00",size:Math.min(26,bh*0.4)});
 y-=bh*0.78+gap;
 const hw=(bw-gap)/2;
 for(let i=0;i<2;i++){
  const L=LEVELS[i],on=i===levelIdx;
  btn(bx+i*(hw+gap),y,hw,bh*0.78,L.name,()=>{levelIdx=i;store.set("level",i);SFX.tap()},
   {fill:on?"rgba(255,255,255,0.16)":"rgba(255,255,255,0.05)",
    stroke:on?L.col:"rgba(255,255,255,0.18)",col:on?L.col:"rgba(255,255,255,0.55)",
    size:Math.min(15,bh*0.24)})}
 y-=bh*0.92+gap;
 const ids=Object.keys(MODES);
 for(let i=0;i<ids.length;i++){
  const M=MODES[ids[i]],on=ids[i]===modeId;
  btn(bx+i*(hw+gap),y,hw,bh*0.92,M.name,()=>{modeId=ids[i];store.set("mode",ids[i]);SFX.tap()},
   {fill:on?"rgba(255,255,255,0.16)":"rgba(255,255,255,0.05)",
    stroke:on?M.col:"rgba(255,255,255,0.18)",col:on?M.col:"rgba(255,255,255,0.55)",
    size:Math.min(15,bh*0.22),wrap:true})}
 // one line of explanation for both choices, rather than a caption squeezed
 // inside a button that a small phone then draws over the label
 const M=MODES[modeId];
 const tz=Math.min(13,W*0.033);
 const tipY=y-14-tz;
 wrapFit(M.sub+"  "+LEVELS[levelIdx].desc,W/2,tipY,tz,
  "rgba(255,255,255,0.62)",W*0.86,tz*2.6);
 // the logo takes whatever room is left above all that
 const top=SAFE.t+EXITB+8,space=tipY-20-top;
 const cy=top+space*0.44,lz=Math.min(72,W*0.16,space*0.3);
 textFit("RIDDLE",W/2,cy-lz*0.54,lz,"#ffd23f",W*0.84);
 textFit("RUMBLE",W/2,cy+lz*0.54,lz,"#ff6ad5",W*0.84);
 const sz=Math.min(14,W*0.033,space*0.08);
 textFit(BANK.length.toLocaleString()+" riddles, and it shuffles them every time.",
  W/2,cy+lz*1.32,sz,"rgba(255,255,255,0.6)",W*0.86);
 const b=best[bestKey(modeId,levelIdx)];
 if(b&&b.score)textFit("Best "+b.score+"   ·   longest streak "+b.streak,
  W/2,cy+lz*1.32+sz*1.7,sz,"#9ad8ff",W*0.86);
 drawButtons();
 if(wide&&space<120)return}

function drawPlay(){
 backdrop();buttons=[];
 const M=G.M,L=G.L,wide=W>H*1.15;
 const top=SAFE.t+8;
 // --- the bar along the top
 const barY=top+EXITB*0.5;
 const rightX=W-16-SAFE.r;
 textFit(G.score.toLocaleString(),rightX,barY-8,Math.min(26,W*0.06),"#ffd23f",W*0.3,"right");
 if(M.lives){
  let hx=rightX;
  for(let i=0;i<3;i++){textFit(i<G.lives?"♥":"♡",hx,barY+14,15,i<G.lives?"#ff5a7a":"rgba(255,255,255,0.25)",40,"right");hx-=19}}
 else textFit(Math.ceil(G.clock)+"s",rightX,barY+14,15,G.clock<=10?"#ff5a7a":"rgba(255,255,255,0.7)",W*0.3,"right");
 const leftX=SAFE.l+EXITB+14;
 textFit(M.n?("RIDDLE "+Math.min(G.asked,M.n)+" / "+M.n):("RIDDLE "+G.asked),
  leftX,barY-8,Math.min(15,W*0.036),"rgba(255,255,255,0.7)",W*0.4,"left");
 textFit(G.q.p.f,leftX,barY+13,Math.min(13,W*0.032),L.col,W*0.4,"left");
 if(G.streak>=2)textFit(G.streak+" in a row!",leftX,barY+34,Math.min(13,W*0.032),"#ffd23f",W*0.4,"left");
 // --- the answers, budgeted from the bottom so they always fit
 const bot=uiBottom();
 const cols=wide?2:1,rows=wide?2:4;
 const gap=10;
 const aw=(Math.min(W-32-SAFE.l-SAFE.r,wide?W*0.9:460)-(cols-1)*gap)/cols;
 const ah=Math.max(44,Math.min(wide?110:94,(H*0.52-(rows-1)*gap)/rows));
 const gridH=rows*ah+(rows-1)*gap;
 const gx=W/2-(cols*aw+(cols-1)*gap)/2,gy=bot-gridH;
 for(let i=0;i<4;i++){
  const c=i%cols,r=Math.floor(i/cols);
  const x=gx+c*(aw+gap),y=gy+r*(ah+gap);
  const o=G.q.opts[i];
  let fill="rgba(46,36,96,0.94)",stroke="rgba(255,255,255,0.26)",col="#fff";
  if(G.picked>=0){
   if(o.ok){fill="rgba(80,220,120,0.86)";stroke="#d6ffe4";col="#05230f"}
   else if(i===G.picked){fill="rgba(235,70,90,0.86)";stroke="#ffd8de";col="#2a0208"}
   else{fill="rgba(30,24,66,0.9)";stroke="rgba(255,255,255,0.12)";col="rgba(255,255,255,0.45)"}}
  const idx=i;
  btn(x,y,aw,ah,cap(o.t),()=>answer(idx),{fill,stroke,col,size:Math.min(22,ah*0.32),wrap:true,r:16});}
 // --- the question. It gets the room it needs rather than all the room
 // there is: a two-line riddle in a panel half a screen tall looks like a
 // mistake, so the panel is sized to the text and floated in the gap.
 const bandTop=barY+42,bandBot=gy-14,band=Math.max(70,bandBot-bandTop);
 const qw=Math.min(W*0.94,520);
 const qsize=Math.min(30,W*0.062);
 const need=wrapFit(G.q.p.q,-9999,-9999,qsize,"#000",qw-36,band*0.62).h;
 const qh=clamp(need+64,90,band);
 const qTop=bandTop+(band-qh)/2;
 cx.fillStyle="rgba(0,0,0,0.24)";rr(W/2-qw/2,qTop,qw,qh,18);cx.fill();
 wrapFit(G.q.p.q,W/2,qTop+qh*0.42,qsize,"#ffffff",qw-36,qh-58);
 // the thinking clock, as a bar under the question rather than a countdown in
 // your face - it takes points off, not the turn
 if(G.picked<0){
  const tw=Math.min(W*0.6,300),tx=W/2-tw/2,ty=qTop+qh-16;
  cx.fillStyle="rgba(255,255,255,0.12)";rr(tx,ty,tw,6,3);cx.fill();
  const f=clamp(G.think/L.think,0,1);
  cx.fillStyle=f>0.5?"#8dff5a":f>0.2?"#ffd23f":"#ff7a5a";rr(tx,ty,tw*f,6,3);cx.fill()}
 else if(G.q.gain>0)textFit("+"+G.q.gain,W/2,qTop+qh-14,Math.min(19,W*0.045),"#8dff5a",W*0.5);
 else if(G.q.p.h)textFit(G.q.p.h,W/2,qTop+qh-14,Math.min(14,W*0.034),"rgba(255,255,255,0.6)",Math.min(W*0.9,480));
 drawButtons()}

function drawOver(){
 backdrop();buttons=[];
 const bw=Math.min(340,W*0.8),bx=W/2-bw/2;
 const bh=Math.max(48,Math.min(64,H*0.085)),gap=10;
 let y=uiBottom()-bh;
 btn(bx,y,bw,bh,"PLAY AGAIN",()=>newGame(),
  {fill:"rgba(255,210,63,0.92)",stroke:"rgba(255,240,190,0.9)",col:"#231a00",size:Math.min(22,bh*0.38)});
 y-=bh*0.82+gap;
 btn(bx,y,bw,bh*0.82,"BACK TO THE MENU",()=>{scene="title"},{size:Math.min(16,bh*0.28)});
 const top=SAFE.t+EXITB+10,space=y-18-top;
 const good=G.right>G.wrong;
 const ty=top+space*0.2;
 textFit(good?"NICE ONE!":"GOOD TRY",W/2,ty,Math.min(36,W*0.085,space*0.18),good?"#ffd23f":"#ffffff",W*0.84);
 const rows=[
  ["Score",G.score.toLocaleString(),"#ffd23f"],
  ["Right",G.right+" of "+(G.right+G.wrong),"#8dff5a"],
  ["Longest streak",G.bestStreak,"#ff6ad5"]];
 const b=best[bestKey(G.M.id,levelIdx)];
 if(b)rows.push(["Best ever",b.score.toLocaleString(),"#9ad8ff"]);
 const rh=Math.min(40,space*0.13),y0=ty+space*0.2;
 const rw=Math.min(320,W*0.8),rx=W/2-rw/2;
 rows.forEach((r,i)=>{
  const ry=y0+i*rh;
  cx.fillStyle=i%2?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)";
  rr(rx,ry,rw,rh-5,10);cx.fill();
  const fs=Math.min(16,rh*0.42);
  textFit(r[0],rx+14,ry+(rh-5)/2,fs,"rgba(255,255,255,0.7)",rw*0.55,"left");
  textFit(r[1],rx+rw-14,ry+(rh-5)/2,fs,r[2],rw*0.4,"right")});
 drawButtons()}

function render(){
 cx.setTransform(DPR,0,0,DPR,0,0);
 cx.clearRect(0,0,W,H);
 if(scene==="title")drawTitle();
 else if(scene==="play")drawPlay();
 else drawOver()}

// ---------------------------------------------------------------- input
// Taps only. A press marks a button, and the release has to land on the same
// one - so a finger that slides off changes its mind, the way a button should.
let held=-1,heldId=-1;
function at(x,y){for(let i=buttons.length-1;i>=0;i--){const b=buttons[i];
 if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return i}return -1}
function down(x,y,id){audioInit();const i=at(x,y);if(i<0)return;held=i;heldId=id}
function up(x,y,id){
 if(held<0||(heldId!==id&&heldId!==-1))return;
 const i=at(x,y);const was=buttons[held];held=-1;heldId=-1;
 if(i>=0&&buttons[i]===was)was.fn()}
cv.addEventListener("touchstart",e=>{if(e.cancelable)e.preventDefault();
 const t=e.changedTouches[0];down(t.clientX,t.clientY,t.identifier)},{passive:false});
cv.addEventListener("touchend",e=>{if(e.cancelable)e.preventDefault();
 const t=e.changedTouches[0];up(t.clientX,t.clientY,t.identifier)},{passive:false});
cv.addEventListener("touchcancel",()=>{held=-1;heldId=-1});
cv.addEventListener("mousedown",e=>down(e.clientX,e.clientY,-1));
cv.addEventListener("mouseup",e=>up(e.clientX,e.clientY,-1));
addEventListener("keydown",e=>{
 if(scene==="play"&&G&&G.picked<0&&"1234".includes(e.key))answer(+e.key-1);
 else if(e.key==="Enter"||e.key===" "){if(scene==="title")newGame();else if(scene==="over")newGame()}});

let last=0;
function frame(ts){
 requestAnimationFrame(frame);
 if(!last)last=ts;
 let dt=(ts-last)/1000;last=ts;
 if(dt>0.05)dt=0.05;if(dt<=0)dt=1/60;
 step(dt);render()}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- hooks
// The whole bank, so a test can hold every family to its own rule rather than
// trusting a count.
window.RD={
 get bank(){return BANK},get families(){return FAMILIES},
 get scene(){return scene},set scene(v){scene=v},
 get G(){return G},SEED,MODES,LEVELS,
 start(mode,level){modeId=mode||modeId;levelIdx=level==null?levelIdx:level;newGame()},
 answer(i){answer(i)},
 buttons(){return buttons.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,label:b.label}))},
 tap(i){const b=buttons[i];if(b)b.fn()}};
</script></body></html>
'''

page = HEAD + SEED + GEN + GAME
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write(page)
os.makedirs(os.path.dirname(MIRROR), exist_ok=True)
open(MIRROR, 'w').write(page)          # the shelf's numbered copy
print(OUT, os.path.getsize(OUT) // 1024, 'KB')
