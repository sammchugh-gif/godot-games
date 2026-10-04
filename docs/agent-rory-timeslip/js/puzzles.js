// Timeslip's own clues (the frame and the three spy clues every game has are in clues.js).
// Everything here is about the eras Rory visits, and none of it is sums: footprints in the
// mud, fossils, things from the wrong time, Viking runes, pyramid blocks, Roman mosaics,
// cave paintings, a river to cross and a muddle of history to sort out.
//   whose     whose footprints? which animal (or Sandbot, or Viking) made each track
//   fossil    the fossil puzzle: turn the stones until the dinosaur skeleton is whole
//   wrongtime wrong time! tap the things that don't belong in this era
//   runes     the rune path: walk every stone once, in one go, from the glowing one
//   shapes    shape fit: fit the blocks into the gap in the pyramid (or the snow wall)
//   mosaic    the Roman mosaic: copy the little pattern, colour by colour
//   dots      cave dot-to-dot: join the dots in ABC order to see the picture
//   crossing  the river crossing: Rory and one more in the boat; don't leave the wrong pair
//   eras      lost in time: put each thing back in its own era
import { Clue, R, rnd, any, shuffle, esc, addStyle } from "./clues.js";
import { onTap } from "./ui.js";

const CSS = `
.ts-glow { outline: 4px solid #7dffa8 !important; outline-offset: 2px; animation: ts-pulse 1s infinite; }
@keyframes ts-pulse { 50% { outline-color: rgba(125,255,168,.25); } }
.ts-sel { outline: 4px solid #ffd166 !important; outline-offset: 2px; }
.ts-side { display: flex; flex-direction: column; gap: 8px; align-items: center; max-width: 15em; }
.ts-btn { border: 0; border-radius: 14px; font: inherit; font-weight: 900; cursor: pointer; color: #1a2440; background: rgba(255,255,255,.92); box-shadow: 0 4px 0 rgba(0,0,0,.3); min-width: 44px; min-height: 44px; }
.ts-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,.3); }
.ts-btn.used { opacity: .3; pointer-events: none; }
.ts-name { display: block; font-size: clamp(10px, 2.6vmin, 14px); font-weight: 900; line-height: 1.1; color: #1a2440; }
.ts-emo { display: block; font-size: clamp(24px, 7vmin, 40px); line-height: 1.15; }
.ts-emo svg { width: 1.2em; height: 1.2em; display: block; margin: 0 auto; }
.ts-left { display: flex; gap: 6px; justify-content: center; }
.ts-left i { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffd166; }
.ts-left i.on { background: #7dffa8; border-color: #7dffa8; }
/* whose footprints */
.ts-tracks { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.ts-track { position: relative; border: 3px solid transparent; border-radius: 14px; padding: 0; background: none; cursor: pointer; display: block; }
.ts-track svg { height: var(--th); width: calc(var(--th) * 4.57); display: block; border-radius: 11px; }
.ts-track.cur { border-color: #ffd166; }
.ts-track.ok { border-color: #7dffa8; }
.ts-track b { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); font-size: calc(var(--th) * .55); background: rgba(255,255,255,.85); border-radius: 50%; line-height: 1.2; padding: 0 2px; }
.ts-track b:empty { display: none; }
.ts-owners { display: grid; grid-template-columns: repeat(var(--cols), auto); gap: 8px; }
.ts-owner { padding: 4px 8px; width: clamp(76px, 18vmin, 112px); }
/* fossil */
.ts-fossil { display: grid; grid-template-columns: repeat(var(--cols), var(--t)); gap: 4px; padding: 6px; background: #5a3a1e; border-radius: 14px; transition: gap .4s; }
.ts-fossil.done { gap: 0; }
.ts-tile { width: var(--t); height: var(--t); padding: 0; border: 0; border-radius: 6px; overflow: hidden; cursor: pointer; transition: transform .25s; background: #c49a62; }
.ts-tile svg, .ts-box svg { width: 100%; height: 100%; display: block; }
.ts-box { width: clamp(110px, 30vmin, 220px); background: rgba(255,255,255,.12); border-radius: 12px; padding: 5px; color: #fff; font-weight: 900; font-size: 13px; }
.ts-box svg { height: auto; border-radius: 8px; }
/* wrong time */
.ts-scene { position: relative; width: min(100%, 104vmin, 740px); aspect-ratio: 2 / 1; border-radius: 16px; overflow: hidden; }
.ts-scene > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.ts-item { position: absolute; transform: translate(-50%, -50%); border: 3px solid transparent; background: rgba(255,255,255,.18); border-radius: 50%; padding: 2px; font-size: clamp(28px, 8.4vmin, 56px); line-height: 1.1; min-width: 46px; min-height: 46px; cursor: pointer; }
.ts-scene .ts-left { position: absolute; top: 6px; right: 8px; background: rgba(0,0,0,.4); padding: 5px 7px; border-radius: 999px; }
.ts-item.found { border-color: #ff3a3a; background: rgba(255,255,255,.75); }
/* runes */
.ts-runes { height: var(--rh); width: auto; max-width: 100%; display: block; touch-action: manipulation; }
/* shapes */
.ts-wall { display: grid; grid-template-columns: repeat(var(--w), var(--c)); gap: 2px; padding: 5px; border-radius: 10px; background: var(--grout); }
.ts-wall button { width: var(--c); height: var(--c); border: 0; padding: 0; border-radius: 3px; background: var(--block); box-shadow: inset -3px -3px 0 rgba(0,0,0,.15); cursor: pointer; }
.ts-wall button.gap { background: var(--hole); box-shadow: inset 3px 3px 6px rgba(0,0,0,.6); }
.ts-tray { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 13em; }
.ts-piece { padding: 6px; display: flex; align-items: center; justify-content: center; }
.ts-mini { display: grid; grid-template-columns: repeat(var(--w), var(--m)); grid-template-rows: repeat(var(--h), var(--m)); gap: 2px; --m: clamp(13px, 4.2vmin, 22px); }
.ts-mini i { border-radius: 3px; box-shadow: inset -2px -2px 0 rgba(0,0,0,.2); }
.ts-turn { padding: 6px 14px; font-size: clamp(14px, 3.6vmin, 18px); background: linear-gradient(#fff4cc, #ffc64a); }
/* mosaic */
.ts-mos { display: grid; grid-template-columns: repeat(var(--n), var(--c)); gap: 3px; padding: 5px; background: #6a5a48; border-radius: 10px; }
.ts-mos > * { width: var(--c); height: var(--c); border: 0; padding: 0; border-radius: 4px; background: #efe4c8; box-shadow: inset -2px -2px 0 rgba(0,0,0,.18); }
.ts-mos button { cursor: pointer; }
.ts-pal { display: flex; flex-direction: column; gap: 8px; }
.ts-sw { width: clamp(46px, 12vmin, 64px); height: clamp(46px, 12vmin, 64px); border-radius: 12px; border: 3px solid rgba(255,255,255,.6); cursor: pointer; box-shadow: inset -3px -3px 0 rgba(0,0,0,.2); }
.ts-lbl { color: var(--dim, #8ea4c4); font-weight: 900; font-size: 12px; letter-spacing: .1em; margin-top: 3px; }
/* dots */
.ts-dots { height: min(58vmin, 430px); width: auto; max-width: 100%; display: block; border-radius: 14px; touch-action: manipulation; cursor: pointer; }
.ts-next { font-weight: 900; font-size: clamp(20px, 6vmin, 34px); color: var(--gold, #ffd166); }
/* crossing */
.ts-rules { display: flex; flex-direction: column; gap: 2px; font-weight: 800; font-size: clamp(13px, 3.3vmin, 17px); color: #fff; }
.ts-rules b { font-size: 1.3em; }
.ts-river { display: flex; align-items: stretch; border-radius: 16px; overflow: hidden; min-height: clamp(130px, 38vmin, 260px); }
.ts-bank { width: clamp(118px, 30vmin, 200px); display: flex; flex-wrap: wrap; gap: 5px; align-content: center; justify-content: center; padding: 6px; background: var(--bank); }
.ts-water { width: clamp(150px, 40vmin, 320px); background: var(--water); display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 6px; }
.ts-boat { display: flex; align-items: center; gap: 4px; padding: 4px 8px; min-height: 60px; background: #8a5a2a; border-radius: 6px 6px 30px 30px; align-self: flex-start; box-shadow: 0 4px 0 rgba(0,0,0,.25); transition: all .3s; }
.ts-boat.at1 { align-self: flex-end; }
.ts-tok { width: clamp(48px, 12.5vmin, 76px); height: clamp(48px, 12.5vmin, 76px); padding: 0; font-size: clamp(22px, 6vmin, 36px); line-height: 1; }
.ts-tok small { display: block; font-size: clamp(9px, 2.3vmin, 12px); font-weight: 900; }
.ts-rory { font-size: clamp(24px, 6.5vmin, 38px); }
.ts-seat { width: clamp(48px, 12.5vmin, 76px); height: clamp(48px, 12.5vmin, 76px); border: 3px dashed rgba(255,255,255,.5); border-radius: 14px; }
.ts-go { align-self: center; min-height: 44px; padding: 8px 18px; font-size: clamp(14px, 3.8vmin, 20px); background: linear-gradient(#fff4cc, #ffc64a); }
/* eras */
.ts-things { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.ts-thing { padding: 3px 4px; width: clamp(74px, 15.5vmin, 104px); }
.ts-eras { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.ts-era { padding: 4px; width: var(--ew); display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ts-era .ts-thumb { width: 100%; aspect-ratio: 2 / 1; border-radius: 8px; overflow: hidden; }
.ts-era .ts-thumb svg { width: 100%; height: 100%; display: block; }
.ts-put { min-height: 1.2em; font-size: clamp(16px, 4vmin, 24px); line-height: 1.2; display: flex; gap: 2px; }
.ts-put svg { width: 1em; height: 1em; }
`;
const style = () => addStyle("ts-style", CSS);
if (typeof document !== "undefined") style();

const pick = (a, n) => shuffle(a).slice(0, n);
const range = n => Array.from({ length: n }, (_, i) => i);
// light up one thing (and nothing else) for a hint
const glow = (root, sel) => { root.querySelectorAll(".ts-glow").forEach(e => e.classList.remove("ts-glow")); const e = sel && root.querySelector(sel); if (e) e.classList.add("ts-glow"); };
const emo = e => e.startsWith("<") ? e : esc(e);

// ------------------------------------------------------------ the eras: little pictures, and what belongs in each
const ICON = {
  ship: `<svg viewBox="0 0 40 40"><path d="M20 27 V5" stroke="#5a3a1a" stroke-width="2"/><path d="M11 7 H29 V22 H11 Z" fill="#e03a3a"/><path d="M11 11 H29 M11 16 H29" stroke="#fff" stroke-width="2.4"/><path d="M2 24 Q20 34 38 24 L35 31 Q20 37 5 31 Z" fill="#8a5a2a"/><path d="M37 25 Q41 15 35 13 M3 25 Q-1 16 5 14" stroke="#8a5a2a" stroke-width="2.6" fill="none"/><circle cx="12" cy="29" r="2" fill="#f0c020"/><circle cx="20" cy="30" r="2" fill="#2a6ad8"/><circle cx="28" cy="29" r="2" fill="#f0c020"/></svg>`,
  arch: `<svg viewBox="0 0 40 40"><path d="M1 6 H39 V36 H1 Z" fill="#e0c890"/><path d="M1 6 H39 V10 H1 Z" fill="#c8a868"/><path d="M5 36 V22 A5 5 0 0 1 15 22 V36 Z M25 36 V22 A5 5 0 0 1 35 22 V36 Z" fill="#7ab8e8"/><path d="M17 36 V24 A3 3 0 0 1 23 24 V36 Z" fill="#7ab8e8"/></svg>`,
  shield: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#6a4a2a"/><circle cx="20" cy="20" r="15.5" fill="#2a5ab8"/><path d="M20 4.5 A15.5 15.5 0 0 1 35.5 20 L20 20 Z M20 35.5 A15.5 15.5 0 0 1 4.5 20 L20 20 Z" fill="#f0c020"/><path d="M12 6 V34 M20 4.5 V35.5 M28 6 V34" stroke="rgba(0,0,0,.25)" stroke-width="1"/><circle cx="20" cy="20" r="5.5" fill="#c0c8d0" stroke="#4a4a50" stroke-width="2"/></svg>`,
  ankh: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="11" rx="6.5" ry="8" fill="none" stroke="#d8a020" stroke-width="4"/><path d="M20 19 V38 M9 21 H31" stroke="#d8a020" stroke-width="4.5" stroke-linecap="round"/></svg>`,
};
const ERA = {
  dino:   { name: "Dinosaur Valley", in: "Dinosaur Valley", things: [["🥚", "Dinosaur egg"], ["🦖", "T. rex"], ["🌋", "Volcano"]], belong: ["🦖", "🦕", "🌋", "🥚", "🌿", "🐢", "🦎", "🌴"], other: ["🦣"] },
  ice:    { name: "The Ice Age", in: "the Ice Age", things: [["🦣", "Mammoth"], ["🖐️", "Cave handprint"], ["🦬", "Woolly bison"]], belong: ["🦣", "🐺", "🦌", "🔥", "🐟", "🦴", "🐻", "❄️"], other: ["🦖"] },
  egypt:  { name: "Ancient Egypt", in: "Ancient Egypt", things: [["🪲", "Scarab"], ["🐪", "Camel"], [ICON.ankh, "Ankh"]], belong: ["🐪", "🐊", "🐈", "🌴", "🌾", "🪲", "🐍", "🏺"], other: ["🦖", "🦣"] },
  greece: { name: "Olympia", in: "Olympia, in Ancient Greece", things: [["🫒", "Olive crown"], ["🥏", "Discus"], ["🔥", "Olympic flame"]], belong: ["🏺", "🫒", "🍇", "🐐", "🔥", "🦉", "🥏", "🌿"], other: ["🦖", "🦣"] },
  rome:   { name: "Ancient Rome", in: "Ancient Rome", things: [[ICON.arch, "Aqueduct arch"], ["🏟️", "Colosseum"], ["🦅", "Eagle standard"]], belong: ["🍇", "🐎", "🏺", "🦅", "⛲", "🛡️", "🏟️", "🐐"], other: ["🦖", "🦣"] },
  fjord:  { name: "The Vikings", in: "the Viking fjord", things: [[ICON.ship, "Longship"], ["🪓", "Battle axe"], [ICON.shield, "Round shield"]], belong: ["🪓", "🛡️", "🐟", "🐑", "🌲", "🦌", "🐻", "⚓"], other: ["🦖", "🦣"] },
};
const ERAS = Object.keys(ERA);
// things from our time that the Sandbots keep dropping
const MODERN = ["📱", "🛹", "🚗", "🚲", "🎮", "💻", "📺", "🚁", "🍔", "🎧", "🚀", "✈️", "🛴", "🕶️", "🎸", "💡", "🚂", "📷"];
// a picture of each era (300 x 150)
const SCENE = {
  dino: `<rect width="300" height="150" fill="#ffc98a"/><circle cx="250" cy="30" r="16" fill="#fff0b0"/><circle cx="196" cy="22" r="9" fill="#8a7a70" opacity=".6"/><circle cx="186" cy="10" r="7" fill="#8a7a70" opacity=".5"/><path d="M140 100 L188 36 L206 36 L258 100 Z" fill="#7a4a2a"/><path d="M188 36 L197 26 L206 36 Z" fill="#ff5a2a"/><path d="M0 92 Q80 78 150 90 T300 86 V150 H0 Z" fill="#6aa040"/><path d="M38 92 Q36 60 42 40 M268 92 Q270 66 262 48" stroke="#6a4a2a" stroke-width="5" fill="none"/><path d="M42 40 Q20 34 12 46 M42 40 Q60 30 72 42 M42 40 Q34 20 22 22 M42 40 Q56 22 66 26 M262 48 Q246 40 236 50 M262 48 Q280 40 290 52 M262 48 Q258 30 248 30" stroke="#3a7a2a" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  ice: `<rect width="300" height="150" fill="#cfe6ff"/><path d="M0 90 L50 30 L90 70 L140 20 L200 80 L240 40 L300 90 Z" fill="#fff"/><path d="M50 30 L60 90 L0 90 Z M140 20 L150 90 L100 90 Z M240 40 L250 90 L210 90 Z" fill="#b8d4f0"/><path d="M0 88 H300 V150 H0 Z" fill="#f2f8ff"/><path d="M14 150 V112 Q14 92 40 92 Q66 92 66 112 V150 Z" fill="#4a5a6a"/><path d="M20 98 L22 108 L24 98 M30 94 L32 106 L34 94 M44 94 L46 104 L48 94" fill="#e8f4ff"/>`,
  egypt: `<rect width="300" height="150" fill="#ffe2a8"/><circle cx="60" cy="30" r="15" fill="#fff4c0"/><path d="M110 98 L170 26 L230 98 Z" fill="#e8b860"/><path d="M170 26 L230 98 L186 98 Z" fill="#c8984a"/><path d="M165 32 L170 26 L175 32 Z" fill="#ffd700"/><path d="M220 98 L252 60 L284 98 Z" fill="#e0b058"/><path d="M252 60 L284 98 L262 98 Z" fill="#c0904a"/><path d="M0 94 Q100 84 200 96 T300 92 V150 H0 Z" fill="#e8c070"/><path d="M0 128 Q150 118 300 130 V150 H0 Z" fill="#3a8ad8"/>`,
  greece: `<rect width="300" height="150" fill="#a8d8ff"/><path d="M0 92 Q70 60 150 84 Q220 64 300 86 V150 H0 Z" fill="#8aa858"/><path d="M110 46 L190 46 L150 24 Z" fill="#f4f0e8"/><rect x="108" y="46" width="84" height="6" fill="#e0dcd0"/><path d="M114 52 V88 M128 52 V88 M142 52 V88 M158 52 V88 M172 52 V88 M186 52 V88" stroke="#f4f0e8" stroke-width="7"/><rect x="104" y="88" width="92" height="7" fill="#e0dcd0"/><circle cx="50" cy="104" r="9" fill="#5a7a3a"/><circle cx="250" cy="100" r="11" fill="#5a7a3a"/><path d="M50 113 V122 M250 111 V122" stroke="#6a4a2a" stroke-width="3"/>`,
  rome: `<rect width="300" height="150" fill="#bfe0ff"/><path d="M0 100 H300 V150 H0 Z" fill="#8ab858"/><rect x="0" y="34" width="300" height="66" fill="#e0c890"/><rect x="0" y="34" width="300" height="8" fill="#c8a868"/>${range(7).map(i => `<path d="M${8 + i * 44} 100 V68 A15 15 0 0 1 ${38 + i * 44} 68 V100 Z" fill="#bfe0ff"/>`).join("")}<path d="M0 100 H300" stroke="#c8a868" stroke-width="3"/>`,
  fjord: `<rect width="300" height="150" fill="#9ec8e8"/><path d="M0 100 L0 30 L40 18 L90 70 L110 100 Z" fill="#3a5a6a"/><path d="M300 100 L300 24 L250 14 L200 74 L184 100 Z" fill="#2e4e5e"/><path d="M40 18 L52 30 L30 26 Z M250 14 L262 24 L240 22 Z" fill="#fff"/><path d="M0 96 H300 V150 H0 Z" fill="#2a6a9a"/><path d="M0 120 Q150 112 300 120" stroke="#5a9ac8" stroke-width="3" fill="none"/>${[20, 60, 240, 280].map(x => `<path d="M${x} 100 L${x - 9} 100 L${x} 72 L${x + 9} 100 Z" fill="#1e4a2e"/>`).join("")}`,
};
const sceneSVG = id => `<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">${SCENE[id]}</svg>`;

// ------------------------------------------------------------ whose footprints?
// each print drawn toes-up round (0,0); the track turns them to walk left to right
const FOOT = {
  trex:    { e: "🦖", name: "T. rex", grp: "claw", s: 1.1, tell: "Three long pointy toes. Dinosaur claws!", d: `<path d="M-3 6 L0 -17 L3 6 Z M-3 4 L-13 -10 L-8 -12 L1 2 Z M3 4 L13 -10 L8 -12 L-1 2 Z"/><circle cy="6" r="5"/>` },
  duck:    { e: "🦆", name: "Duck", grp: "claw", s: 1, tell: "Three toes joined with skin, like a fan. Webbed feet!", d: `<path d="M0 8 L-12 -10 Q-6 -6 0 -13 Q6 -6 12 -10 Z" opacity=".45"/><path d="M0 8 L-12 -10 M0 8 L0 -13 M0 8 L12 -10" stroke-width="2.6" fill="none" stroke-linecap="round"/>` },
  mammoth: { e: "🦣", name: "Mammoth", grp: "round", s: 1.12, tell: "A huge round foot. Something very big and heavy!", d: `<circle r="12"/><circle cx="-8" cy="-11" r="2.8"/><circle cx="-3" cy="-13.5" r="2.8"/><circle cx="3" cy="-13.5" r="2.8"/><circle cx="8" cy="-11" r="2.8"/>` },
  sandbot: { e: "⌛", name: "Sandbot", grp: "round", s: 1, line: true, tell: "Little round rings with sand in, all in one line. Not an animal at all!", d: `<circle r="7" fill="none" stroke-width="3"/><circle cx="-2" cy="-1" r="1.3"/><circle cx="2.5" cy="2" r="1.3"/><circle cx="1.5" cy="-3" r="1.3"/>` },
  camel:   { e: "🐪", name: "Camel", grp: "hoof", s: 1, tell: "Two big toes side by side. Camels walk on two toes!", d: `<ellipse cx="-4.5" rx="4" ry="10"/><ellipse cx="4.5" rx="4" ry="10"/>` },
  horse:   { e: "🐎", name: "Horse", grp: "hoof", s: 1, tell: "A hoof shaped like a U. A horse!", d: `<path d="M-8 9 Q-11 -11 0 -12 Q11 -11 8 9" fill="none" stroke-width="4.5" stroke-linecap="round"/><path d="M0 -3 L-3.5 7 L3.5 7 Z"/>` },
  cat:     { e: "🐈", name: "Cat", grp: "paw", s: 0.9, tell: "Four soft toes and a pad, and no claw marks. Cats hide their claws!", d: `<path d="M-7 8 Q-8 0 0 0 Q8 0 7 8 Q0 12 -7 8 Z"/><ellipse cx="-8.5" cy="-5" rx="2.7" ry="3.3"/><ellipse cx="-3" cy="-9.5" rx="2.7" ry="3.3"/><ellipse cx="3" cy="-9.5" rx="2.7" ry="3.3"/><ellipse cx="8.5" cy="-5" rx="2.7" ry="3.3"/>` },
  wolf:    { e: "🐺", name: "Wolf", grp: "paw", s: 1.05, tell: "Four toes, with claw marks in front. Wolves can't hide their claws!", d: `<path d="M-7 9 Q-8 0 0 0 Q8 0 7 9 Q0 13 -7 9 Z"/><ellipse cx="-7.5" cy="-5" rx="2.7" ry="3.5"/><ellipse cx="-2.6" cy="-10" rx="2.7" ry="3.5"/><ellipse cx="2.6" cy="-10" rx="2.7" ry="3.5"/><ellipse cx="7.5" cy="-5" rx="2.7" ry="3.5"/><path d="M-9 -10 L-8.5 -14 L-7 -10 Z M-3.6 -15 L-2.6 -19 L-1.6 -15 Z M1.6 -15 L2.6 -19 L3.6 -15 Z M7 -10 L8.5 -14 L9 -10 Z"/>` },
  viking:  { e: "🥾", name: "Viking boot", grp: "people", s: 1.15, tell: "A big boot with a heel. A Viking's boot!", d: `<ellipse cy="-5" rx="7" ry="10"/><ellipse cy="11.5" rx="5.5" ry="4.5"/>` },
  runner:  { e: "🏃", name: "Runner", grp: "people", s: 1.05, mirror: true, tell: "Five little toes and no shoes. A bare foot!", d: `<ellipse cx="0.5" cy="2" rx="5.5" ry="10"/><circle cx="-3" cy="-11" r="2.7"/><circle cx="1" cy="-12.6" r="1.9"/><circle cx="4" cy="-11.6" r="1.7"/><circle cx="6.2" cy="-9.4" r="1.5"/><circle cx="7.4" cy="-6.6" r="1.3"/>` },
};
const FEET = Object.keys(FOOT);
const trackSVG = k => {
  const f = FOOT[k];
  let s = `<svg viewBox="0 0 320 70"><rect width="320" height="70" fill="#b89462"/><path d="M0 18 Q80 8 160 20 T320 14 M0 56 Q90 64 170 52 T320 60" stroke="#a07c4c" stroke-width="5" fill="none"/>`;
  for (let i = 0; i < 5; i++) {
    const x = 32 + i * 62, y = f.line ? 35 : i % 2 ? 48 : 22, sc = f.s * 1.4;
    s += `<g transform="translate(${x} ${y}) rotate(90) scale(${f.mirror && i % 2 ? -sc : sc} ${sc})" fill="#4a2e14" stroke="#4a2e14" stroke-width="0">${f.d}</g>`;
  }
  return s + "</svg>";
};
class Whose extends Clue {
  get eyebrow() { return "FOOTPRINTS"; }
  get title() { return "WHOSE FOOTPRINTS?"; }
  setup() { this.rounds = this.lv <= 2 ? 2 : 1; }
  make() {
    const lv = this.lv, nt = [1, 1, 2, 3][lv - 1], no = [3, 4, 4, 5][lv - 1];
    const tracks = pick(FEET, nt), own = this.spec.owner;
    // the story's own track (dino1: the Sandbot's) comes last
    if (own && FOOT[own] && this.round === this.rounds - 1 && !tracks.includes(own)) tracks[nt - 1] = own;
    const grps = new Set(tracks.map(k => FOOT[k].grp)), opts = [...tracks];
    // a look-alike makes it harder; at level 1 every choice looks quite different
    if (lv >= 2) for (const k of shuffle(FEET)) if (opts.length < no && !opts.includes(k) && grps.has(FOOT[k].grp)) opts.push(k);
    for (const k of shuffle(FEET)) if (opts.length < no && !opts.includes(k) && (lv >= 2 || !grps.has(FOOT[k].grp))) { opts.push(k); grps.add(FOOT[k].grp); }
    const text = nt === 1 ? "Who made these footprints? Look at the toes, then tap who it was." : "Tap a track, then tap who made it. Look at the toes!";
    return { text, tracks, opts: shuffle(opts), tip: FOOT[tracks[0]].tell };
  }
  render() {
    const q = this.q, th = ["min(28vmin, 150px, 11vw)", "", "min(19vmin, 120px, 10vw)", "min(14.5vmin, 100px, 10vw)"][q.tracks.length + (q.tracks.length > 1 ? 1 : 0) - 1] || "13vmin";
    this.got = q.tracks.map(() => false); this.sel = 0;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="ts-tracks" style="--th:${th}">${q.tracks.map((k, i) => `<button class="ts-track" data-t="${i}">${trackSVG(k)}<b></b></button>`).join("")}</div></div>
      <div class="cl-side"><div class="ts-owners" style="--cols:${q.opts.length > 3 ? 2 : 1}">${q.opts.map(k => `<button class="ts-btn ts-owner" data-o="${k}"><span class="ts-emo">${FOOT[k].e}</span><span class="ts-name">${esc(FOOT[k].name)}</span></button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-t]", b => this.pickTrack(+b.dataset.t));
    onTap(this.body, "[data-o]", b => this.tap(b.dataset.o, b));
    this.mark();
  }
  mark() { this.body.querySelectorAll("[data-t]").forEach((b, i) => { b.classList.toggle("cur", this.q.tracks.length > 1 && i === this.sel); b.classList.toggle("ok", this.got[i]); }); this.q.tip = FOOT[this.q.tracks[this.sel]].tell; glow(this.body, null); }
  pickTrack(i) { if (this.busy || this.got[i]) return; this.sel = i; this.G.sound("click"); this.mark(); }
  tap(k, b) {
    if (this.busy) return;
    const want = this.q.tracks[this.sel];
    if (k !== want) { this.wrong(`Not the ${FOOT[k].name}. Look at the toes again!`, b); return; }
    this.got[this.sel] = true; b.classList.add("used");
    this.body.querySelector(`[data-t="${this.sel}"] b`).textContent = FOOT[k].e;
    const next = this.got.indexOf(false);
    if (next < 0) { this.mark(); this.right(this.q.tracks.length > 1 ? "Every track matched!" : `Yes! The ${FOOT[k].name}!`); return; }
    this.G.sound("pop"); this.say(`Yes! The ${FOOT[k].name}. Now the next track.`, "good");
    this.sel = next; this.mark();
  }
  hint(n) { const k = this.q.tracks[this.sel]; this.say(FOOT[k].tell, "bad"); if (n >= 2) glow(this.body, `[data-o="${k}"]`); }
  auto() { const k = this.q.tracks[this.sel]; this.tap(k, this.body.querySelector(`[data-o="${k}"]`)); }
  verify(q) {
    const no = [3, 4, 4, 5][this.lv - 1], nt = [1, 1, 2, 3][this.lv - 1];
    return (q.tracks.length === nt && new Set(q.tracks).size === nt && q.opts.length === no && new Set(q.opts).size === no && q.tracks.every(k => q.opts.includes(k)) && q.opts.every(k => FOOT[k])) || "tracks and owners don't match up";
  }
}

// ------------------------------------------------------------ the fossil puzzle
// skeletons drawn in 400 x 300, facing right: bones (stroked) and skulls (filled)
const SKEL = {
  trex: { name: "T. rex", bones: ["M300 112 Q250 95 200 112 Q140 135 80 160 Q40 175 12 172", "M300 112 Q312 100 318 92", "M218 108 Q226 135 214 160", "M240 104 Q248 135 236 162", "M262 103 Q270 132 258 156", "M282 106 Q290 128 280 146", "M200 118 L214 180 L196 238 L226 250", "M186 124 L182 184 L168 240 L196 252", "M290 130 L300 152 L314 146", "M150 130 L144 150 M120 144 L114 162 M90 156 L86 172"],
    skull: `<path d="M312 70 L362 62 L388 78 L386 98 L360 104 L336 118 L314 108 Z"/><path d="M332 104 L384 98 L380 112 L340 120 Z"/>`, eye: [350, 80] },
  tri: { name: "Triceratops", bones: ["M10 178 Q40 160 70 148 Q140 118 210 116 Q260 118 292 132", "M130 124 Q138 160 128 192", "M155 120 Q163 158 153 194", "M180 117 Q188 156 178 194", "M205 116 Q213 152 203 188", "M240 124 L250 190 L244 248 L268 252", "M222 122 L224 190 L214 246 L238 250", "M110 132 L120 190 L104 246 L130 252", "M88 140 L92 196 L80 248 L104 250", "M336 106 L362 66", "M352 110 L388 74", "M50 160 L46 176 M30 168 L26 182"],
    skull: `<path d="M286 132 Q276 70 318 56 Q346 76 334 120 Z"/><path d="M308 112 L352 102 L388 122 L376 142 L340 152 L312 142 Z"/>`, eye: [338, 122] },
  neck: { name: "Long-neck", bones: ["M8 210 Q60 186 120 156 Q180 128 240 140", "M240 140 Q296 120 316 74 Q326 44 348 36", "M150 142 Q158 175 148 206", "M175 134 Q183 170 173 204", "M200 132 Q208 166 198 200", "M222 136 Q230 166 220 196", "M228 148 L236 208 L228 262 L252 266", "M212 146 L212 208 L202 262 L226 266", "M140 154 L148 212 L138 262 L162 266", "M124 160 L122 216 L112 262 L136 266", "M60 188 L56 204 M90 172 L86 188 M268 134 L262 120 M296 112 L284 104"],
    skull: `<path d="M340 30 Q352 20 376 26 Q394 32 392 42 Q378 50 352 48 Q338 44 340 30 Z"/>`, eye: [366, 33] },
};
const fossilPic = (k, cols, rows) => {
  const W = cols * 100, H = rows * 100, S = SKEL[k], s = Math.min(W / 400, H / 300) * 0.96, tx = (W - 400 * s) / 2, ty = (H - 300 * s) / 2;
  const bands = [[0, 0.3, "#d8b47a"], [0.3, 0.56, "#c49a62"], [0.56, 0.8, "#ae8250"], [0.8, 1, "#946a3e"]];
  let g = bands.map(([a, b, c]) => `<rect x="0" y="${a * H}" width="${W}" height="${(b - a) * H + 1}" fill="${c}"/>`).join("");
  g += bands.slice(1).map(([a]) => `<path d="M0 ${a * H} Q${W / 4} ${a * H - 8} ${W / 2} ${a * H} T${W} ${a * H}" stroke="#7a5a30" stroke-width="3" fill="none" opacity=".5"/>`).join("");
  // a little fossil in every square, so every stone shows which way is up
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const X = x * 100, Y = y * 100, t = (x * 7 + y * 3) % 3;
    g += t === 0 ? `<g transform="translate(${X + 20} ${Y + 80})"><circle r="9" fill="#ead8b0" stroke="#7a5a30" stroke-width="2"/><path d="M1 0 a2 2 0 1 0 -2 -1 M-1 -1 a4 4 0 1 1 5 4 a6 6 0 1 1 -10 -6" fill="none" stroke="#7a5a30" stroke-width="1.6"/></g>`
      : t === 1 ? `<path d="M${X + 82} ${Y + 92} V${Y + 64} M${X + 82} ${Y + 86} l-7 -7 M${X + 82} ${Y + 86} l7 -7 M${X + 82} ${Y + 77} l-6 -7 M${X + 82} ${Y + 77} l6 -7 M${X + 82} ${Y + 69} l-4 -5 M${X + 82} ${Y + 69} l4 -5" stroke="#6a5a30" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : `<path d="M${X + 14} ${Y + 90} q8 -14 16 0 Z" fill="#ead8b0" stroke="#7a5a30" stroke-width="2"/><ellipse cx="${X + 84}" cy="${Y + 16}" rx="6" ry="4" fill="#8a7050"/>`;
  }
  const bone = (w, c) => `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${S.bones.map(d => `<path d="${d}"/>`).join("")}</g>`;
  g += `<g transform="translate(${tx} ${ty}) scale(${s})">${bone(17, "#5a3a1a")}<g fill="#f4ecd8" stroke="#5a3a1a" stroke-width="5" stroke-linejoin="round">${S.skull}</g>${bone(10, "#f4ecd8")}<circle cx="${S.eye[0]}" cy="${S.eye[1]}" r="7" fill="#3a2410"/></g>`;
  return g;
};
const GRID = [[2, 2], [3, 2], [3, 3], [4, 3]];
class Fossil extends Clue {
  get eyebrow() { return "FOSSIL PUZZLE"; }
  get title() { return "MAKE THE SKELETON WHOLE"; }
  setup() { this.rounds = 1; }
  make() {
    const lv = this.lv, [cols, rows] = GRID[lv - 1], n = cols * rows, k = [rnd(2, 3), rnd(3, 4), rnd(5, 7), rnd(7, 10)][lv - 1];
    const rot = Array(n).fill(0); for (const i of pick(range(n), k)) rot[i] = rnd(1, 3);
    const dino = this.spec.dino && SKEL[this.spec.dino] ? this.spec.dino : any(Object.keys(SKEL));
    return { text: lv <= 2 ? "Tap a stone to turn it. Make the skeleton whole, like the little picture." : "Tap a stone to turn it, until the dinosaur skeleton is whole again.", cols, rows, rot, dino, tip: "Find a bone that doesn't join up. Keep tapping that stone until it does." };
  }
  render() {
    const q = this.q, pic = fossilPic(q.dino, q.cols, q.rows); this.ang = q.rot.map(r => r * 90);
    const tiles = range(q.cols * q.rows).map(i => `<button class="ts-tile" data-i="${i}" style="transform:rotate(${this.ang[i]}deg)"><svg viewBox="${(i % q.cols) * 100} ${Math.floor(i / q.cols) * 100} 100 100">${pic}</svg></button>`).join("");
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="ts-fossil" style="--cols:${q.cols};--t:min(calc(54vmin / ${q.rows}), 116px)">${tiles}</div></div>
      <div class="cl-side ts-side"><div class="cl-q small">${esc(q.text)}</div><div class="ts-box" style="${this.lv <= 2 ? "" : "display:none"}"><svg viewBox="0 0 ${q.cols * 100} ${q.rows * 100}">${pic}</svg>THE PICTURE</div></div></div>`;
    onTap(this.body, "[data-i]", b => this.tap(+b.dataset.i));
  }
  tap(i) {
    if (this.busy) return;
    if (this.ang[i] % 360 === 0) { this.wrong("That stone is already the right way up!", this.body.querySelector(".ts-fossil")); return; }
    this.ang[i] += 90; this.G.sound("click");
    const b = this.body.querySelector(`[data-i="${i}"]`); b.style.transform = `rotate(${this.ang[i]}deg)`; b.classList.remove("ts-glow");
    if (this.ang.every(a => a % 360 === 0)) { this.body.querySelector(".ts-fossil").classList.add("done"); this.right(`The fossil is whole! It's a ${SKEL[this.q.dino].name}!`); }
  }
  hint(n) { const i = this.ang.findIndex(a => a % 360); if (i >= 0) glow(this.body, `[data-i="${i}"]`); if (n >= 2) this.body.querySelector(".ts-box").style.display = ""; this.say("The glowing stone is the wrong way round. Keep tapping it.", "bad"); }
  auto() { const i = this.ang.findIndex(a => a % 360); if (i >= 0) this.tap(i); }
  verify(q) { const [c, r] = GRID[this.lv - 1], wrong = q.rot.filter(x => x).length; return (q.cols === c && q.rows === r && q.rot.length === c * r && wrong >= 2 && q.rot.every(x => x >= 0 && x <= 3) && !!SKEL[q.dino]) || "the fossil isn't jumbled right"; }
}

// ------------------------------------------------------------ wrong time!
const SLOTS = range(10).map(i => [10 + (i % 5) * 20, i < 5 ? 52 : 80]);
class WrongTime extends Clue {
  get eyebrow() { return "WRONG TIME!"; }
  get title() { return "WHAT DOESN'T BELONG?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, nodd = [1, 2, 2, 3][lv - 1], nall = [5, 7, 8, 10][lv - 1];
    const era = ERA[this.spec.era] ? this.spec.era : any(ERAS.filter(e => e !== this.lastEra)); this.lastEra = era;
    const E = ERA[era], odd = pick(MODERN, nodd);
    if (lv === 4) odd[0] = any(E.other);
    const items = shuffle([...odd.map(e => ({ e, odd: true })), ...pick(E.belong, nall - nodd).map(e => ({ e, odd: false }))]);
    const slots = pick(SLOTS, nall);
    items.forEach((it, i) => { it.x = slots[i][0] + rnd(-4, 4); it.y = slots[i][1] + rnd(-4, 3); });
    const many = nodd > 1;
    return { text: `Tap ${many ? "the things" : "the thing"} that ${many ? "don't" : "doesn't"} belong in ${E.in}!`, era, items, nodd,
      tip: lv === 4 ? "Look for things from our time, like a phone or a bike. And an animal from a different time!" : "Look for something from our time, like a phone or a bike. Nobody had those yet!" };
  }
  render() {
    const q = this.q;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="ts-scene">${sceneSVG(q.era)}${q.items.map((it, i) => `<button class="ts-item" data-i="${i}" style="left:${it.x}%;top:${it.y}%">${it.e}</button>`).join("")}<div class="ts-left">${range(q.nodd).map(() => "<i></i>").join("")}</div></div></div>`;
    onTap(this.body, "[data-i]", b => this.tap(+b.dataset.i, b));
  }
  tap(i, b) {
    if (this.busy) return;
    const it = this.q.items[i];
    if (it.found) return;
    if (!it.odd) { this.wrong("That one belongs here. Look for something from the wrong time!", b); return; }
    it.found = true; b.classList.add("found"); b.classList.remove("ts-glow");
    const got = this.q.items.filter(x => x.found).length;
    this.body.querySelectorAll(".ts-left i").forEach((e, k) => e.classList.toggle("on", k < got));
    if (got >= this.q.nodd) { this.right(this.q.nodd > 1 ? "Found them all! Back to the future with those." : "Found it! That's from the wrong time."); return; }
    this.G.sound("pop"); this.say("Found one! Keep looking.", "good");
  }
  hint(n) { const i = this.q.items.findIndex(x => x.odd && !x.found); if (n >= 2 && i >= 0) glow(this.body, `[data-i="${i}"]`); }
  auto() { const i = this.q.items.findIndex(x => x.odd && !x.found); if (i >= 0) this.tap(i, this.body.querySelector(`[data-i="${i}"]`)); }
  verify(q) {
    const E = ERA[q.era], odd = q.items.filter(x => x.odd), es = q.items.map(x => x.e);
    return (E && odd.length === q.nodd && odd.length === [1, 2, 2, 3][this.lv - 1] && new Set(es).size === es.length && odd.every(x => !E.belong.includes(x.e)) && q.items.every(x => x.odd || E.belong.includes(x.e))) || "the odd ones out are muddled";
  }
}

// ------------------------------------------------------------ the rune path
// runes drawn with straight strokes, in a 40 x 60 box
const RUNE = ["M12 5 V55 M12 15 L30 5 M12 28 L30 18", "M10 55 V5 L30 18 V55", "M12 5 V55 M12 18 L28 30 L12 42", "M12 5 V55 M12 5 L28 15 M12 20 L28 30", "M12 55 V5 L28 15 L12 27 L28 55", "M28 10 L12 30 L28 50", "M8 8 L32 52 M32 8 L8 52",
  "M10 5 V55 M30 5 V55 M10 22 L30 38", "M20 5 V55 M10 22 L30 38", "M20 5 V55 M8 18 L20 5 L32 18", "M12 5 V55 M12 5 L28 17 L12 30 L28 43 L12 55", "M10 5 V55 M30 5 V55 M10 5 L30 22 M30 5 L10 22", "M20 5 V55 M20 25 L8 10 M20 25 L32 10", "M10 55 L30 25 L20 5 L10 25 L30 55"];
const RGRID = [[3, 3, 7], [4, 3, 10], [4, 4, 14], [5, 4, 18]];
// a random walk that visits len squares of a w x h grid, each once (it steers towards the squares with fewest ways out)
function walk(w, h, len) {
  const nb = i => { const x = i % w, y = Math.floor(i / w), out = []; if (x > 0) out.push(i - 1); if (x < w - 1) out.push(i + 1); if (y > 0) out.push(i - w); if (y < h - 1) out.push(i + w); return out; };
  for (let t = 0; t < 400; t++) {
    const path = [R(w * h)], seen = new Set(path);
    while (path.length < len) {
      const c = shuffle(nb(path[path.length - 1]).filter(j => !seen.has(j)));
      if (!c.length) break;
      const free = j => nb(j).filter(k => !seen.has(k)).length;
      const nx = R(3) ? c.sort((a, b) => free(a) - free(b))[0] : c[0];
      path.push(nx); seen.add(nx);
    }
    if (path.length === len) return path;
  }
  return null;
}
class Runes extends Clue {
  get eyebrow() { return "RUNE PATH"; }
  get title() { return "WALK EVERY STONE ONCE"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const lv = this.lv; let [w, h, len] = RGRID[lv - 1]; let sol = walk(w, h, len);
    if (!sol) { [w, h, len] = [3, 3, 9]; sol = range(9).map(i => Math.floor(i / 3) % 2 ? Math.floor(i / 3) * 3 + 2 - i % 3 : i); }
    const glyph = {}; sol.forEach(i => { glyph[i] = R(RUNE.length); });
    return { text: lv <= 2 ? "Start on the yellow stone. Step on every stone once, in one go, and finish on the flag." : "Start on the yellow stone. Step on every stone once, in one go. Tap back to undo.",
      w, h, sol, glyph, showEnd: lv <= 2, tip: "Stones in corners and at the ends are tricky. Make sure you don't leave one behind with no way back." };
  }
  render() { this.path = [this.q.sol[0]]; this.draw(); }
  draw() {
    const q = this.q, { w, h } = q, on = new Set(this.path), last = this.path[this.path.length - 1], c = i => [(i % w) * 100 + 50, Math.floor(i / w) * 100 + 50];
    let s = `<rect width="${w * 100}" height="${h * 100}" rx="20" fill="#2a4a5a"/>`;
    for (let i = 0; i < w * h; i++) if (!(i in q.glyph)) { const [x, y] = c(i); s += `<ellipse cx="${x}" cy="${y}" rx="30" ry="18" fill="#3a6a8a" opacity=".6"/>`; }
    if (this.path.length > 1) s += `<polyline points="${this.path.map(i => c(i).join(",")).join(" ")}" fill="none" stroke="#ffe08a" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
    for (const i of Object.keys(q.glyph).map(Number)) {
      const [x, y] = c(i), cur = i === last, fill = cur ? "#ffd166" : on.has(i) ? "#8ad8ff" : "#9a9a8e";
      s += `<g data-i="${i}"><rect x="${x - 42}" y="${y - 42}" width="84" height="84" rx="24" fill="${fill}" stroke="${cur ? "#fff" : "#5a5a50"}" stroke-width="${cur ? 6 : 3}"/>
        <path d="${RUNE[q.glyph[i]]}" transform="translate(${x - 20} ${y - 30})" fill="none" stroke="${on.has(i) ? "#1a3a5a" : "#3a3a32"}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        ${q.showEnd && i === q.sol[q.sol.length - 1] ? `<path d="M${x + 18} ${y + 34} V${y - 4} L${x + 40} ${y + 6} L${x + 18} ${y + 14}" fill="#e03a3a" stroke="#fff" stroke-width="2"/>` : ""}</g>`;
    }
    const rh = `min(58vmin, ${h * 120}px)`;
    if (!this.board) {
      this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><svg class="ts-runes" viewBox="0 0 ${w * 100} ${h * 100}" style="--rh:${rh}"></svg></div><div class="cl-side ts-side"><div class="cl-q small">${esc(q.text)}</div></div></div>`;
      this.board = this.body.querySelector("svg");
    }
    this.board.innerHTML = s;
    onTap(this.board, "[data-i]", b => this.tap(+b.dataset.i, b));
  }
  next() { this.board = null; super.next(); }
  tap(i, b) {
    if (this.busy) return;
    const q = this.q, last = this.path[this.path.length - 1], k = this.path.indexOf(i);
    if (k >= 0) { if (k < this.path.length - 1) { this.path.length = k + 1; this.G.sound("click"); this.say("Back you go.", ""); this.draw(); } return; }
    const near = Math.abs(i - last) === q.w ? true : Math.abs(i - last) === 1 && Math.floor(i / q.w) === Math.floor(last / q.w);
    if (!near) { this.wrong("Step to a stone right next to the yellow one. No jumping!", b); return; }
    this.path.push(i); this.G.sound("pop"); this.draw();
    if (this.path.length === q.sol.length) { this.right("The whole rune path glows!"); return; }
    const stuck = ![i - q.w, i + q.w, i % q.w ? i - 1 : -1, i % q.w < q.w - 1 ? i + 1 : -1].some(j => j in q.glyph && !this.path.includes(j));
    this.say(stuck ? "Stuck! Tap back along your path to try another way." : "", stuck ? "bad" : "");
  }
  // the next stone to tap: on along the answer, or back to where the path left it
  step() { const s = this.q.sol; let k = 0; while (k < this.path.length && this.path[k] === s[k]) k++; return k === this.path.length ? s[k] : s[k - 1]; }
  hint() { glow(this.board, `[data-i="${this.step()}"]`); this.say(this.step() === undefined ? "" : this.path.includes(this.step()) ? "Go back to the glowing stone and try another way." : "Try the glowing stone next.", "bad"); }
  auto() { const i = this.step(); this.tap(i, this.board.querySelector(`[data-i="${i}"]`)); }
  verify(q) {
    const s = q.sol, ok = s.every((i, k) => k === 0 || Math.abs(i - s[k - 1]) === q.w || (Math.abs(i - s[k - 1]) === 1 && Math.floor(i / q.w) === Math.floor(s[k - 1] / q.w)));
    return (ok && new Set(s).size === s.length && s.length === Object.keys(q.glyph).length && s.length >= 7 && s.every(i => i >= 0 && i < q.w * q.h)) || "the rune path can't be walked";
  }
}

// ------------------------------------------------------------ shape fit
const norm = cells => { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
const rot90 = cells => norm(cells.map(([x, y]) => [-y, x]));
const skey = cells => cells.map(c => c.join(",")).join(";");
const orients = cells => { const out = []; let c = norm(cells); for (let i = 0; i < 4; i++) { if (!out.some(o => skey(o) === skey(c))) out.push(c); c = rot90(c); } return out; };
const canon = cells => orients(cells).map(skey).sort()[0];
// fill the empty squares exactly with the pieces ({ id, ors }); the list of placements, or null
function fit(empty, pieces) {
  if (!empty.size) return pieces.length ? null : [];
  let first = null; for (const k of empty) { const [x, y] = k.split(",").map(Number); if (!first || y < first[1] || (y === first[1] && x < first[0])) first = [x, y]; }
  const tried = new Set();
  for (const p of pieces) for (const o of p.ors) {
    const sk = skey(o); if (tried.has(sk)) continue; tried.add(sk);
    const dx = first[0] - o[0][0], dy = first[1] - o[0][1], cells = o.map(([x, y]) => `${x + dx},${y + dy}`);
    if (!cells.every(c => empty.has(c))) continue;
    cells.forEach(c => empty.delete(c));
    const rest = fit(empty, pieces.filter(q => q !== p));
    cells.forEach(c => empty.add(c));
    if (rest) return [{ id: p.id, shape: o, cells }, ...rest];
  }
  return null;
}
const LOOK = {
  sand: { block: "#e8c070", grout: "#a07830", hole: "#2a1a08", cols: ["#ff8a3a", "#3ab0ff", "#8ad83a", "#e070d8"] },
  snow: { block: "#f4faff", grout: "#9ac0e0", hole: "#2a3a5a", cols: ["#ffb03a", "#ff6a8a", "#6ad8a0", "#b08aff"] },
  stone: { block: "#c8c0b0", grout: "#7a7468", hole: "#1e1e24", cols: ["#ff8a3a", "#3ab0ff", "#8ad83a", "#e070d8"] },
};
const SGRID = [[4, 3, 2, [2, 3]], [5, 3, 3, [2, 3, 4]], [5, 4, 3, [3, 4]], [6, 4, 4, [3, 4]]];
class Shapes extends Clue {
  get eyebrow() { return "SHAPE FIT"; }
  get title() { return "FILL THE GAP"; }
  setup() { this.rounds = this.lv <= 2 ? 2 : 1; }
  make() {
    const lv = this.lv, [W, H, np, sizes] = SGRID[lv - 1], turn = lv >= 3, look = LOOK[this.spec.look] ? this.spec.look : "sand";
    for (let t = 0; t < 300; t++) {
      const gap = new Set(), pieces = []; let ok = true;
      const inb = ([x, y]) => x >= 0 && y >= 0 && x < W && y < H, nb = ([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(inb);
      for (let p = 0; p < np && ok; p++) {
        const size = lv === 1 ? (p ? any(sizes) : 3) : any(sizes);
        const cand = gap.size ? [...gap].flatMap(k => nb(k.split(",").map(Number))).filter(c => !gap.has(c.join(","))) : [[R(W), R(H)]];
        if (!cand.length) { ok = false; break; }
        const cells = [any(cand)], has = c => cells.some(d => d[0] === c[0] && d[1] === c[1]);
        while (cells.length < size) { const c = cells.flatMap(nb).filter(c => !has(c) && !gap.has(c.join(","))); if (!c.length) { ok = false; break; } cells.push(any(c)); }
        if (!ok) break;
        cells.forEach(c => gap.add(c.join(",")));
        pieces.push({ id: p, cells: cells.map(c => c.join(",")), shape: norm(cells) });
      }
      if (!ok) continue;
      // every block a different shape, and none of them could go in two ways that muddle a child
      if (new Set(pieces.map(p => canon(p.shape))).size < np) continue;
      for (const p of pieces) { p.show = p.shape; if (turn) { const os = orients(p.shape); if (os.length > 1) p.show = any(os.filter(o => skey(o) !== skey(p.shape))); } }
      if (turn && pieces.every(p => skey(p.show) === skey(p.shape))) continue;
      return { W, H, gap: [...gap], pieces, turn, look, text: turn ? "Tap a block, then tap where it fits. TURN spins it." : "Tap a block, then tap the gap where it fits.", tip: "Start with the biggest block. Look at the shape of the gap: where would it slot in?" };
    }
    return this.make();
  }
  render() { const q = this.q; this.cur = q.pieces.map(p => p.show); this.placed = q.pieces.map(() => null); this.sel = null; this.gapSet = new Set(q.gap); this.draw(); }
  draw() {
    const q = this.q, L = LOOK[q.look], owner = {};
    this.placed.forEach((cells, i) => cells && cells.forEach(c => { owner[c] = i; }));
    let wall = ""; for (let y = 0; y < q.H; y++) for (let x = 0; x < q.W; x++) { const k = `${x},${y}`, o = owner[k]; wall += `<button data-c="${k}" class="${this.gapSet.has(k) ? "gap" : ""}"${o !== undefined ? ` style="background:${L.cols[o]}"` : ""}></button>`; }
    const tray = q.pieces.map((p, i) => { if (this.placed[i]) return ""; const s = this.cur[i], w = Math.max(...s.map(c => c[0])) + 1, h = Math.max(...s.map(c => c[1])) + 1;
      return `<button class="ts-btn ts-piece ${this.sel === i ? "ts-sel" : ""}" data-p="${i}"><span class="ts-mini" style="--w:${w};--h:${h}">${s.map(([x, y]) => `<i style="grid-column:${x + 1};grid-row:${y + 1};background:${L.cols[i]}"></i>`).join("")}</span></button>`; }).join("");
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="ts-wall" style="--w:${q.W};--c:min(calc(50vmin / ${q.H}), 70px);--block:${L.block};--grout:${L.grout};--hole:${L.hole}">${wall}</div></div>
      <div class="cl-side ts-side"><div class="ts-tray">${tray}</div>${q.turn ? `<button class="ts-btn ts-turn" data-turn>↻ TURN</button>` : ""}</div></div>`;
    onTap(this.body, "[data-c]", b => this.tapCell(b.dataset.c, b));
    onTap(this.body, "[data-p]", b => this.tapPiece(+b.dataset.p));
    onTap(this.body, "[data-turn]", () => this.turn());
  }
  tapPiece(i) { if (this.busy) return; this.sel = this.sel === i ? null : i; this.G.sound("click"); this.draw(); }
  turn() { if (this.busy) return; if (this.sel === null) { this.say("Tap a block first, then TURN it.", ""); return; } this.cur[this.sel] = rot90(this.cur[this.sel]); this.G.sound("click"); this.draw(); }
  // what's left to fill, and the blocks left to fill it (each in any way round, if they can be turned)
  left(skip) {
    const filled = new Set(this.placed.filter(Boolean).flat()), empty = new Set(this.q.gap.filter(c => !filled.has(c)));
    const pieces = this.q.pieces.map((p, i) => ({ id: i, ors: this.q.turn ? orients(this.cur[i]) : [this.cur[i]] })).filter(p => !this.placed[p.id] && p.id !== skip);
    return { empty, pieces };
  }
  tapCell(k, b) {
    if (this.busy) return;
    const j = this.placed.findIndex(c => c && c.includes(k));
    if (j >= 0) { this.placed[j] = null; this.G.sound("click"); this.say("Block back out.", ""); this.draw(); return; }
    if (!this.gapSet.has(k)) { this.say("That's solid. Tap the dark gap.", ""); return; }
    if (this.sel === null) { this.say("Tap a block first, then the gap.", ""); return; }
    const i = this.sel, s = this.cur[i], [x, y] = k.split(",").map(Number), { empty, pieces } = this.left(i);
    const spots = s.map(([cx, cy]) => s.map(([px, py]) => `${px + x - cx},${py + y - cy}`)).filter(cells => cells.every(c => empty.has(c)));
    if (!spots.length) { this.wrong("That block doesn't fit there. Try another spot, or another block.", b); return; }
    const good = spots.filter(cells => { cells.forEach(c => empty.delete(c)); const r = fit(empty, pieces); cells.forEach(c => empty.add(c)); return r; });
    if (!good.length) { this.wrong("It fits, but then the other blocks won't. Try somewhere else!", b); return; }
    const mine = this.q.pieces[i].cells.slice().sort().join(";");
    this.placed[i] = good.find(c => c.slice().sort().join(";") === mine) || good[0]; this.sel = null;
    this.G.sound("pop"); this.draw();
    if (this.placed.every(Boolean)) this.right("A perfect fit!"); else this.say("In it goes!", "good");
  }
  plan() { const { empty, pieces } = this.left(-1); return fit(empty, pieces); }
  hint(n) {
    const p = this.plan(); if (!p) return; const st = p[0];
    if (this.sel !== st.id) glow(this.body, `[data-p="${st.id}"]`); else if (skey(this.cur[st.id]) !== skey(st.shape)) glow(this.body, "[data-turn]"); else glow(this.body, `[data-c="${st.cells[0]}"]`);
    if (n >= 2) this.say("Try the glowing one.", "bad");
  }
  auto() {
    const p = this.plan();
    if (!p) { const j = this.placed.findIndex(Boolean); this.tapCell(this.placed[j][0]); return; }
    const st = p[0];
    if (this.sel !== st.id) { this.tapPiece(st.id); return; }
    if (skey(this.cur[st.id]) !== skey(st.shape)) { this.turn(); return; }
    this.tapCell(st.cells[0], this.body.querySelector(`[data-c="${st.cells[0]}"]`));
  }
  verify(q) {
    const all = q.pieces.flatMap(p => p.cells), gap = new Set(q.gap);
    if (all.length !== gap.size || new Set(all).size !== all.length || !all.every(c => gap.has(c))) return "the blocks don't make the gap";
    if (q.pieces.some(p => p.cells.length < 2)) return "a block is too small";
    if (!fit(new Set(q.gap), q.pieces.map(p => ({ id: p.id, ors: q.turn ? orients(p.show) : [p.show] })))) return "the blocks can't fill the gap";
    if (q.turn && q.pieces.every(p => skey(p.show) === skey(p.shape))) return "nothing needs turning";
    return true;
  }
}

// ------------------------------------------------------------ the Roman mosaic
const TESS = [["#c0402a", "red"], ["#2a2420", "black"], ["#e0a830", "gold"], ["#2a5ab8", "blue"], ["#3a8a4a", "green"]];
class Mosaic extends Clue {
  get eyebrow() { return "ROMAN MOSAIC"; }
  get title() { return "COPY THE MOSAIC"; }
  setup() { this.rounds = 1; }
  make() {
    const lv = this.lv, n = [3, 4, 4, 5][lv - 1], k = [2, 2, 3, 4][lv - 1], cols = pick(TESS, k);
    for (let t = 0; t < 300; t++) {
      const sym = any(["lr", "both", "diag"]), memo = {}, target = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const rx = sym === "diag" ? Math.min(x, y) : Math.min(x, n - 1 - x), ry = sym === "lr" ? y : sym === "both" ? Math.min(y, n - 1 - y) : Math.max(x, y), key = rx + "," + ry;
        if (!(key in memo)) memo[key] = R(10) < 4 ? -1 : R(k);
        target.push(memo[key]);
      }
      const used = new Set(target.filter(c => c >= 0)), painted = target.filter(c => c >= 0).length;
      if (used.size === k && painted >= n && painted <= n * n - 2) return { n, cols, target, text: "Copy the little mosaic. Tap a colour, then tap the squares that need it.", tip: "Do one row of the little mosaic at a time, starting at the top." };
    }
    return this.make();
  }
  render() {
    const q = this.q; this.cells = q.target.map(() => -1); this.col = null;
    const sq = c => c >= 0 ? q.cols[c][0] : "#efe4c8";
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-side ts-side"><div class="cl-q small">${esc(q.text)}</div><div><div class="ts-mos" style="--n:${q.n};--c:min(calc(30vmin / ${q.n}), 40px)">${q.target.map((c, i) => `<i data-t="${i}" style="background:${sq(c)}"></i>`).join("")}</div><div class="ts-lbl">THE PATTERN</div></div></div>
      <div class="cl-main"><div class="ts-mos" style="--n:${q.n};--c:min(calc(56vmin / ${q.n}), 72px)">${q.target.map((_, i) => `<button data-i="${i}"></button>`).join("")}</div></div>
      <div class="cl-side"><div class="ts-pal">${q.cols.map(([hex, name], c) => `<button class="ts-sw" data-col="${c}" style="background:${hex}" aria-label="${name}"></button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-col]", b => this.pick(+b.dataset.col));
    onTap(this.body, "[data-i]", b => this.tap(+b.dataset.i, b));
  }
  pick(c) { if (this.busy) return; this.col = c; this.G.sound("click"); this.body.querySelectorAll("[data-col]").forEach(b => b.classList.toggle("ts-sel", +b.dataset.col === c)); }
  tap(i, b) {
    if (this.busy) return;
    const q = this.q, want = q.target[i];
    if (this.cells[i] === want) return;
    if (this.col === null) { this.say("Tap a colour first!", ""); return; }
    if (want !== this.col) { this.wrong(want < 0 ? "That square stays plain. Look at the little mosaic!" : `Not ${q.cols[this.col][1]} there. Look at the little mosaic!`, b); return; }
    this.cells[i] = want; b.style.background = q.cols[want][0]; b.classList.remove("ts-glow"); this.G.sound("pop");
    if (this.todo() < 0) this.right("The mosaic is mended!");
  }
  todo() { return this.q.target.findIndex((c, i) => c >= 0 && this.cells[i] !== c); }
  hint(n) { const i = this.todo(); if (i < 0) return; glow(this.body, `[data-i="${i}"]`); if (n >= 2) { this.body.querySelector(`[data-t="${i}"]`).classList.add("ts-glow"); this.say(`That square is ${this.q.cols[this.q.target[i]][1]}.`, "bad"); } }
  auto() { const i = this.todo(); if (i < 0) return; const c = this.q.target[i]; if (this.col !== c) this.pick(c); else this.tap(i, this.body.querySelector(`[data-i="${i}"]`)); }
  verify(q) { const used = new Set(q.target.filter(c => c >= 0)), painted = q.target.filter(c => c >= 0).length; return (q.target.length === q.n * q.n && used.size === q.cols.length && painted >= q.n && painted < q.n * q.n) || "the mosaic pattern is wrong"; }
}

// ------------------------------------------------------------ cave dot-to-dot
// outlines in a 120 x 100 box, joined in order and back to the start
const PICS = [
  { lv: 1, name: "pyramids", pts: [[10, 86], [48, 20], [72, 58], [88, 38], [112, 86]], extra: `<circle cx="104" cy="16" r="8" fill="#e0a830"/>` },
  { lv: 1, name: "a Sandbot", pts: [[30, 10], [90, 10], [66, 50], [90, 90], [30, 90], [54, 50]], extra: `<path d="M44 80 Q60 66 76 80 Z M48 20 H72 L60 34 Z" fill="#f0d080"/>` },
  { lv: 2, name: "a Viking longship", pts: [[6, 22], [16, 58], [38, 72], [82, 72], [104, 58], [114, 22], [104, 46], [82, 50], [84, 40], [84, 8], [36, 8], [36, 40], [38, 50]], extra: `<path d="M38 18 H82 M38 31 H82" stroke="#f4e0b0" stroke-width="5"/><circle cx="34" cy="61" r="4" fill="#e0a830"/><circle cx="50" cy="63" r="4" fill="#2a6ad8"/><circle cx="66" cy="63" r="4" fill="#e0a830"/><circle cx="82" cy="61" r="4" fill="#2a6ad8"/>` },
  { lv: 2, name: "a Greek temple", pts: [[10, 90], [10, 78], [20, 78], [20, 42], [8, 42], [60, 12], [112, 42], [100, 42], [100, 78], [110, 78], [110, 90]], extra: `<path d="M40 44 V78 M60 44 V78 M80 44 V78" stroke="#e8c890" stroke-width="5"/>` },
  { lv: 3, name: "a horse", pts: [[18, 40], [66, 36], [90, 14], [110, 30], [106, 42], [88, 42], [82, 58], [86, 86], [74, 86], [68, 62], [36, 62], [34, 86], [22, 86], [14, 58], [4, 70]], extra: `<circle cx="96" cy="28" r="2.5" fill="#f4e0b0"/>` },
  { lv: 3, name: "a T. rex", pts: [[4, 60], [40, 40], [68, 30], [84, 14], [112, 16], [114, 32], [92, 32], [82, 44], [92, 54], [74, 58], [72, 88], [54, 88], [50, 64], [28, 58]], extra: `<circle cx="96" cy="21" r="2.5" fill="#f4e0b0"/>` },
  { lv: 4, name: "a mammoth", pts: [[16, 44], [38, 22], [66, 18], [88, 24], [100, 40], [106, 62], [114, 84], [102, 88], [94, 62], [84, 58], [80, 88], [66, 88], [64, 68], [40, 68], [38, 88], [24, 88], [16, 64], [6, 80]], extra: `<path d="M86 60 Q98 82 112 66" stroke="#f4ecd8" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="78" cy="36" r="2.5" fill="#f4e0b0"/>` },
  { lv: 4, name: "a triceratops", pts: [[4, 56], [30, 36], [60, 30], [76, 34], [80, 12], [94, 20], [104, 14], [102, 30], [116, 44], [100, 54], [88, 52], [86, 86], [74, 86], [70, 66], [42, 66], [40, 86], [26, 86], [20, 62]], extra: `<circle cx="96" cy="38" r="2.5" fill="#f4e0b0"/>` },
];
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
class Dots extends Clue {
  get eyebrow() { return "CAVE DOT-TO-DOT"; }
  get title() { return "JOIN THE DOTS"; }
  setup() { this.rounds = 1; }
  make() {
    const lv = this.lv, pic = any(PICS.filter(p => p.lv === lv));
    return { text: "Tap the dots in ABC order: A, then B, then C...", pic, n: pic.pts.length, tip: `Say the alphabet: A, B, C, D... Find each letter in turn.` };
  }
  render() {
    this.k = 1; const q = this.q;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><svg class="ts-dots" viewBox="0 0 120 100"></svg></div><div class="cl-side ts-side"><div class="cl-q small">${esc(q.text)}</div><div class="ts-next"></div></div></div>`;
    this.svg = this.body.querySelector("svg");
    onTap(this.body, "svg.ts-dots", (s, e) => this.press(e));
    this.draw();
  }
  draw() {
    const q = this.q, P = q.pic.pts, n = P.length, done = this.k >= n;
    const cx = P.reduce((a, p) => a + p[0], 0) / n, cy = P.reduce((a, p) => a + p[1], 0) / n;
    let s = `<rect width="120" height="100" fill="#c8a070"/><path d="M0 20 Q40 14 70 24 T120 18 M0 70 Q50 62 80 74 T120 66" stroke="#b08858" stroke-width="3" fill="none"/>`;
    if (done) s += `<polygon points="${P.map(p => p.join(",")).join(" ")}" fill="#8a2a1a" opacity=".85"/>${q.pic.extra}`;
    if (this.k > 1) s += `<polyline points="${P.slice(0, this.k).concat(done ? [P[0]] : []).map(p => p.join(",")).join(" ")}" fill="none" stroke="#7a1a10" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    P.forEach(([x, y], i) => {
      const d = Math.hypot(x - cx, y - cy) || 1, lx = Math.max(4, Math.min(116, x + (x - cx) / d * 6.5)), ly = Math.max(6, Math.min(97, y + (y - cy) / d * 6.5 + 2.5));
      const nx = !done && i === this.k && this.lv <= 2;
      s += `${nx ? `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#fff" stroke-width="1.4"><animate attributeName="r" values="3;6;3" dur="1s" repeatCount="indefinite"/></circle>` : ""}<circle cx="${x}" cy="${y}" r="${i < this.k ? 2.2 : 2.6}" fill="${i < this.k ? "#7a1a10" : "#1e1208"}"/>
        ${done ? "" : `<text x="${lx}" y="${ly}" font-size="7.5" font-weight="900" text-anchor="middle" fill="${i < this.k ? "#7a5a3a" : "#1e1208"}" stroke="#f4e0b0" stroke-width="1.6" paint-order="stroke">${ABC[i]}</text>`}`;
    });
    if (this.hl !== undefined && !done) s += `<circle cx="${P[this.hl][0]}" cy="${P[this.hl][1]}" r="6" fill="none" stroke="#7dffa8" stroke-width="2"/>`;
    this.svg.innerHTML = s;
    this.body.querySelector(".ts-next").textContent = done ? "" : this.lv <= 2 ? `Next: ${ABC[this.k]}` : "";
  }
  press(e) {
    if (this.busy || !this.svg.getScreenCTM) return;
    const pt = this.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = this.svg.getScreenCTM(); if (!m) return;
    const p = pt.matrixTransform(m.inverse()); let best = -1, bd = 1e9;
    this.q.pic.pts.forEach(([x, y], i) => { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = i; } });
    if (bd <= 11) this.tap(best);
  }
  tap(i) {
    if (this.busy) return;
    if (i < this.k) return;
    if (i !== this.k) { this.wrong(`That's ${ABC[i]}. Find ${ABC[this.k]} next!`, this.svg); return; }
    this.k++; this.hl = undefined; this.G.sound("click");
    if (this.k >= this.q.n) { this.draw(); this.right(`It's ${this.q.pic.name}!`); return; }
    this.draw();
  }
  hint(n) { if (n >= 2) { this.hl = this.k; this.draw(); this.say(`${ABC[this.k]} is in the green ring.`, "bad"); } }
  auto() { this.tap(this.k); }
  verify(q) {
    const P = q.pic.pts; let near = 1e9;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) near = Math.min(near, Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]));
    return (P.length >= 5 && P.length <= 26 && near >= 9 && q.pic.lv === this.lv && P.every(([x, y]) => x >= 0 && x <= 120 && y >= 0 && y <= 100)) || `dots too close (${near.toFixed(1)}) or off the picture`;
  }
}

// ------------------------------------------------------------ the river crossing
const CAST = {
  pebble: ["🦕", "Pebble"], egg: ["🥚", "Eggs"], ferns: ["🌿", "Ferns"], sandbot: ["⌛", "Sandbot"], map: ["🗺️", "Map"],
  croc: ["🐊", "Croc"], goat: ["🐐", "Goat"], scroll: ["📜", "Scroll"], cat: ["🐈", "Cat"], fish: ["🐟", "Fish"],
  wolf: ["🐺", "Wolf"], sheep: ["🐑", "Sheep"], grain: ["🌾", "Grain"],
};
const EATS = [["pebble", "ferns", "Pebble would gobble the ferns"], ["pebble", "sandbot", "Pebble would sit on the Sandbot"], ["sandbot", "egg", "the Sandbot would bottle the eggs"], ["sandbot", "map", "the Sandbot would grab the map"],
  ["croc", "goat", "the croc would snap at the goat"], ["goat", "scroll", "the goat would eat the scroll"], ["cat", "fish", "the cat would eat the fish"], ["croc", "fish", "the croc would gulp the fish"],
  ["wolf", "sheep", "the wolf would chase the sheep"], ["sheep", "grain", "the sheep would eat the grain"]];
const RIVER = {
  valley: { name: "the river", cast: ["pebble", "egg", "ferns", "sandbot", "map"], bank: "#6aa040", water: "#3a8ab8" },
  nile:   { name: "the Nile", cast: ["croc", "goat", "scroll", "cat", "fish", "sandbot", "egg"], bank: "#e0b860", water: "#2a7ac8" },
  fjord:  { name: "the fjord", cast: ["wolf", "sheep", "grain", "cat", "fish", "sandbot", "egg"], bank: "#4a6a4a", water: "#1e5a8a" },
};
// the quickest way over: one move per crossing (who goes in the boat, or -1 for nobody), or null
function ferry(n, bad, mask, side) {
  const full = (1 << n) - 1, safe = (m, s) => { const bank = s === 0 ? m : full & ~m; return !bad.some(([a, b]) => (bank >> a & 1) && (bank >> b & 1)); };
  const start = mask * 2 + side, prev = new Map([[start, null]]), todo = [start];
  while (todo.length) {
    const st = todo.shift(), m = st >> 1, s = st & 1;
    if (m === full) { const path = []; let k = st; while (prev.get(k)) { const [p, mv] = prev.get(k); path.unshift(mv); k = p; } return path; }
    for (let p = -1; p < n; p++) {
      if (p >= 0 && ((m >> p & 1) !== s)) continue;
      const nm = p < 0 ? m : m ^ (1 << p), ns = 1 - s, key = nm * 2 + ns;
      if (!safe(nm, ns) || prev.has(key)) continue;
      prev.set(key, [st, p]); todo.push(key);
    }
  }
  return null;
}
class Crossing extends Clue {
  get eyebrow() { return "RIVER CROSSING"; }
  get title() { return "GET EVERYONE ACROSS"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const lv = this.lv, river = RIVER[this.spec.river] ? this.spec.river : any(Object.keys(RIVER)), Rv = RIVER[river];
    const N = [2, 3, 4, 3][lv - 1], want = [0, 1, 1, 2][lv - 1], minMoves = [3, 5, 7, 7][lv - 1];
    for (let t = 0; t < 500; t++) {
      const who = pick(Rv.cast, N), bad = [], rules = [];
      EATS.forEach(([a, b, words]) => { const i = who.indexOf(a), j = who.indexOf(b); if (i >= 0 && j >= 0) { bad.push([i, j]); rules.push(words); } });
      if (bad.length !== want) continue;
      // level 4 is the classic: one of them can't be left with either of the others
      if (lv === 4 && !bad.flat().some(x => bad.flat().filter(y => y === x).length === 2)) continue;
      const path = ferry(N, bad, 0, 0);
      if (!path || path.length < minMoves) continue;
      return { river, who, bad, rules, path, text: `Get everyone across ${Rv.name}. The boat takes Rory and one more.`,
        tip: lv === 4 ? "Here's the trick: you can bring someone back with you!" : want ? "Who can't be left together? Take one of those two over first." : "Take one over, row back, then take the other." };
    }
    return this.make();
  }
  render() { this.mask = 0; this.side = 0; this.seat = -1; this.draw(); }
  draw() {
    const q = this.q, Rv = RIVER[q.river], tok = i => `<button class="ts-btn ts-tok" data-p="${i}">${CAST[q.who[i]][0]}<small>${CAST[q.who[i]][1]}</small></button>`;
    const bank = s => q.who.map((_, i) => i).filter(i => (this.mask >> i & 1) === s && i !== this.seat).map(tok).join("");
    const rules = q.rules.length ? q.rules.map(r => `<div>⚠️ Left alone, ${esc(r)}.</div>`).join("") : "<div>Nobody squabbles here. Just get everyone over!</div>";
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small" style="font-size:clamp(14px,3.6vmin,22px);max-width:none">${esc(q.text)}</div><div class="ts-rules">${rules}</div>
      <div class="ts-river" style="--bank:${Rv.bank};--water:${Rv.water}"><div class="ts-bank">${bank(0)}</div>
      <div class="ts-water"><div class="ts-boat at${this.side}"><span class="ts-rory">🧒</span>${this.seat >= 0 ? tok(this.seat) : `<span class="ts-seat"></span>`}</div><button class="ts-btn ts-go" data-go>${this.side ? "⬅ ROW" : "ROW ➜"}</button></div>
      <div class="ts-bank">${bank(1)}</div></div></div>`;
    onTap(this.body, "[data-p]", b => this.tap(+b.dataset.p));
    onTap(this.body, "[data-go]", b => this.go(b));
  }
  tap(i) {
    if (this.busy) return;
    if (this.seat === i) { this.seat = -1; this.G.sound("click"); this.draw(); return; }
    if ((this.mask >> i & 1) !== this.side) { this.say("They're on the other side. Row over to fetch them.", ""); return; }
    this.seat = i; this.G.sound("click"); this.draw();
  }
  go(b) {
    if (this.busy) return;
    const q = this.q, m = this.seat >= 0 ? this.mask ^ (1 << this.seat) : this.mask, full = (1 << q.who.length) - 1;
    const behind = this.side === 0 ? full & ~m : m, k = q.bad.findIndex(([a, c]) => (behind >> a & 1) && (behind >> c & 1));
    if (k >= 0) { const w = q.rules[k]; this.wrong(`Wait! If Rory rows away, ${w}!`, b); return; }
    this.mask = m; this.side = 1 - this.side; this.seat = -1; this.G.sound("pop"); this.draw();
    if (this.mask === full) this.right("Everyone's safely across!"); else this.say("", "");
  }
  move() { const p = ferry(this.q.who.length, this.q.bad, this.mask, this.side); return p && p.length ? p[0] : null; }
  hint() {
    const mv = this.move(); if (mv === null) return;
    if (mv !== this.seat) { glow(this.body, mv >= 0 ? `.ts-bank [data-p="${mv}"]` : `.ts-boat [data-p]`); this.say(mv >= 0 ? `Take the ${CAST[this.q.who[mv]][1].toLowerCase()} next.` : "Row over on your own this time.", "bad"); }
    else { glow(this.body, "[data-go]"); this.say("Now row!", "bad"); }
  }
  auto() {
    const mv = this.move(); if (mv === null) return;
    if (mv !== this.seat) this.tap(mv >= 0 ? mv : this.seat); else this.go(this.body.querySelector("[data-go]"));
  }
  verify(q) { const p = ferry(q.who.length, q.bad, 0, 0); return (p && p.length >= [3, 5, 7, 7][this.lv - 1] && q.bad.length === [0, 1, 1, 2][this.lv - 1] && new Set(q.who).size === q.who.length) || "the river can't be crossed"; }
}

// ------------------------------------------------------------ lost in time
class Eras extends Clue {
  get eyebrow() { return "LOST IN TIME"; }
  get title() { return "PUT THEM BACK IN TIME"; }
  setup() { this.rounds = 1; }
  make() {
    const lv = this.lv, [ne, nt] = [[2, 4], [3, 5], [4, 6], [6, 8]][lv - 1];
    const eras = pick(ERAS, ne).sort((a, b) => ERAS.indexOf(a) - ERAS.indexOf(b));
    const pool = eras.map(e => shuffle(ERA[e].things).map(([icon, name]) => ({ era: e, icon, name })));
    const things = pool.map(p => p.shift()), rest = shuffle(pool.flat());
    while (things.length < nt) things.push(rest.shift());
    return { text: "Things have slipped out of their time! Tap a thing, then tap the time it belongs in.", eras, things: shuffle(things), tip: "Think about where you'd see it: with the dinosaurs, in the snow, by the pyramids, at the games, in Rome or with the Vikings." };
  }
  render() {
    const q = this.q, ew = `clamp(${q.eras.length > 4 ? 92 : 110}px, ${q.eras.length > 4 ? 15 : q.eras.length > 2 ? 20 : 26}vmin, ${q.eras.length > 4 ? 140 : 200}px)`;
    this.sel = null; this.home = q.things.map(() => false);
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="ts-things">${q.things.map((t, i) => `<button class="ts-btn ts-thing" data-i="${i}"><span class="ts-emo">${emo(t.icon)}</span><span class="ts-name">${esc(t.name)}</span></button>`).join("")}</div>
      <div class="ts-eras" style="--ew:${ew}">${q.eras.map(e => `<button class="ts-btn ts-era" data-e="${e}"><span class="ts-thumb">${sceneSVG(e)}</span><span class="ts-name">${esc(ERA[e].name)}</span><span class="ts-put"></span></button>`).join("")}</div></div>`;
    onTap(this.body, "[data-i]", b => this.pick(+b.dataset.i));
    onTap(this.body, "[data-e]", b => this.drop(b.dataset.e, b));
  }
  pick(i) { if (this.busy || this.home[i]) return; this.sel = i; this.G.sound("click"); this.body.querySelectorAll("[data-i]").forEach(b => b.classList.toggle("ts-sel", +b.dataset.i === i)); glow(this.body, null); }
  drop(e, b) {
    if (this.busy) return;
    if (this.sel === null) { this.say("Tap a thing first, then its time.", ""); return; }
    const t = this.q.things[this.sel];
    if (t.era !== e) { this.wrong(`The ${t.name.toLowerCase()} isn't from ${ERA[e].in}. Try another time!`, b); return; }
    this.home[this.sel] = true;
    const tb = this.body.querySelector(`[data-i="${this.sel}"]`); tb.classList.remove("ts-sel"); tb.classList.add("used");
    b.querySelector(".ts-put").insertAdjacentHTML("beforeend", `<span>${emo(t.icon)}</span>`);
    this.sel = null; glow(this.body, null);
    if (this.home.every(Boolean)) { this.right("Everything is back in its own time!"); return; }
    this.G.sound("pop"); this.say(`Yes! Back to ${ERA[e].in}.`, "good");
  }
  hint(n) {
    const i = this.sel !== null ? this.sel : this.home.indexOf(false); if (i < 0) return;
    if (this.sel === null) { glow(this.body, `[data-i="${i}"]`); return; }
    if (n >= 2) { glow(this.body, `[data-e="${this.q.things[i].era}"]`); this.say(`The ${this.q.things[i].name.toLowerCase()} belongs in ${ERA[this.q.things[i].era].in}.`, "bad"); }
  }
  auto() {
    if (this.sel === null) { this.pick(this.home.indexOf(false)); return; }
    const e = this.q.things[this.sel].era; this.drop(e, this.body.querySelector(`[data-e="${e}"]`));
  }
  verify(q) {
    const [ne, nt] = [[2, 4], [3, 5], [4, 6], [6, 8]][this.lv - 1], names = q.things.map(t => t.name);
    return (q.eras.length === ne && new Set(q.eras).size === ne && q.things.length === nt && new Set(names).size === nt && q.things.every(t => q.eras.includes(t.era)) && q.eras.every(e => q.things.some(t => t.era === e))) || "the things and times don't match";
  }
}

export const KINDS = { whose: Whose, fossil: Fossil, wrongtime: WrongTime, runes: Runes, shapes: Shapes, mosaic: Mosaic, dots: Dots, crossing: Crossing, eras: Eras };
