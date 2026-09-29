// Agent Rory: Meltdown — the cast, and the story of whichever operation is
// being played. The engine reads COUNTRIES, ACTS, CREDITS and ALL_MISSIONS;
// useOp() points them at another operation by refilling them in place, so
// every module that imported them sees the change.
// Sophia, Rory and Dylan Games, Inc.
import { OP as OP1 } from "./op1.js";
import { OP as OP2 } from "./op2.js";
import { OP as OP3 } from "./op3.js";

export const CHARS = {
  rory:     { name: "Rory", voice: { g: "m", langs: ["en-GB"], pitch: 1.15, rate: 1.05 },
              face: { skin: "#f3cfae", hair: "#6b4423", style: "short", eyes: "#3b5f8a", clothes: "#16324f", accessory: "earpiece" } },
  frost:    { name: "Admiral Frost", voice: { g: "m", langs: ["en-GB"], pitch: 0.7, rate: 0.9 },
              face: { skin: "#f0c8a8", hair: "#f4f4f4", style: "captain", eyes: "#3a4a5a", facial: "bigbeard", eyepatch: true, clothes: "#10233d", accessory: "medal", brows: "stern" } },
  pip:      { name: "Pip", voice: { g: "f", langs: ["en-AU", "en-GB"], pitch: 1.35, rate: 1.12 },
              face: { skin: "#f6d7bf", hair: "#e0a040", style: "messy", eyes: "#3a7a4a", goggles: true, clothes: "#f4f4f4", accessory: "labcoat" } },
  zara:     { name: "Zara", voice: { g: "f", langs: ["en-US"], pitch: 1.12, rate: 1.08 },
              face: { skin: "#8a5a3a", hair: "#1a1010", style: "ponytail", eyes: "#2a1a10", clothes: "#e0442a", accessory: "headset" } },
  kaldera:  { name: "Baron Kaldera", voice: { g: "m", langs: ["es-ES"], pitch: 0.62, rate: 0.82 },
              face: { skin: "#e8c8a8", hair: "#1a1a1a", style: "sleek", eyes: "#2a1a10", facial: "goatee", monocle: true, clothes: "#e05a10", accessory: "cape", brows: "stern" } },
  scorch:   { name: "Scorch", voice: { g: "f", langs: ["en-US"], pitch: 0.95, rate: 1.05 },
              face: { skin: "#f0c8a8", hair: "#c0202a", style: "helmet", eyes: "#222", clothes: "#b01020", accessory: "flames" } },
  bruno:    { name: "Bruno", voice: { g: "m", langs: ["sv-SE", "en-GB"], pitch: 0.6, rate: 0.85 },
              face: { skin: "#f0c8a8", hair: "#3a2a1a", style: "beanie", eyes: "#3a5a8a", facial: "stubble", clothes: "#3a3a44", big: true, accessory: "penguin" } },
  cinder:   { name: "Dr Cinder", voice: { g: "m", langs: ["en-GB"], pitch: 1.3, rate: 1.1 },
              face: { skin: "#f1c9a5", hair: "#8a7a5a", style: "bald", eyes: "#4a4a4a", glasses: "round", clothes: "#f0f0f0", accessory: "pencil", sweaty: true } },
  watch:    { name: "Spy Watch", voice: { g: "n", langs: ["en-GB"], pitch: 1.0, rate: 1.1 },
              face: { skin: "#223", hair: "#223", style: "watch", eyes: "#7fd", clothes: "#223" } },
  // the contacts
  nuka:     { name: "Nuka", voice: { g: "f", langs: ["da-DK", "en-GB"], pitch: 1.25, rate: 1.05 },
              face: { skin: "#d8a878", hair: "#141414", style: "furhood", eyes: "#2a1a10", clothes: "#3a6aa0" } },
  lars:     { name: "Captain Lars", voice: { g: "m", langs: ["nb-NO", "en-GB"], pitch: 0.85, rate: 0.95 },
              face: { skin: "#f0c8a8", hair: "#d0c8b8", style: "captain", eyes: "#3a5a8a", facial: "beard", clothes: "#1b2a4a", accessory: "pipe" } },
  luca:     { name: "Luca", voice: { g: "m", langs: ["fr-FR"], pitch: 1.2, rate: 1.1 },
              face: { skin: "#f0d0b0", hair: "#3a2414", style: "cap", eyes: "#3a2a1a", clothes: "#c01818", accessory: "wrench" } },
  ines:     { name: "Inés", voice: { g: "f", langs: ["es-ES"], pitch: 1.2, rate: 1.1 },
              face: { skin: "#e0b48c", hair: "#2a1810", style: "long", eyes: "#3a2a1a", clothes: "#f0a020", accessory: "skateboard" } },
  nikos:    { name: "Nikos", voice: { g: "m", langs: ["el-GR", "en-GB"], pitch: 1.1, rate: 1.05 },
              face: { skin: "#d8a878", hair: "#1a1a1a", style: "curly", eyes: "#2a1a10", clothes: "#2a6ab0", stripes: true } },
  mac:      { name: "Ranger Mac", voice: { g: "f", langs: ["en-CA", "en-US"], pitch: 1.0, rate: 1.0 },
              face: { skin: "#f0c8a8", hair: "#a0502a", style: "ranger", eyes: "#3a6a3a", clothes: "#3a5a2a", accessory: "badge" } },
  omar:     { name: "Omar", voice: { g: "m", langs: ["ar-SA", "en-GB"], pitch: 1.1, rate: 1.05 },
              face: { skin: "#c8946a", hair: "#1a1010", style: "short", eyes: "#2a1a10", clothes: "#2a8ac0", accessory: "harness" } },
  valentina:{ name: "Dr Valentina", voice: { g: "f", langs: ["es-CL", "es-ES"], pitch: 1.05, rate: 1.0 },
              face: { skin: "#d8a878", hair: "#2a1810", style: "bun", eyes: "#2a1a10", glasses: "round", clothes: "#5a3a8a" } },
  budi:     { name: "Budi", voice: { g: "m", langs: ["id-ID", "en-GB"], pitch: 1.0, rate: 1.0 },
              face: { skin: "#b07a4e", hair: "#141414", style: "short", eyes: "#2a1a10", clothes: "#c05a20", accessory: "scarf" } },
  minjun:   { name: "Min-jun", voice: { g: "m", langs: ["ko-KR", "en-US"], pitch: 1.2, rate: 1.1 },
              face: { skin: "#f0d8c0", hair: "#141414", style: "swept", eyes: "#222", clothes: "#8a2ae0", accessory: "headset" } },
  tenzing:  { name: "Tenzing", voice: { g: "m", langs: ["en-IN", "en-GB"], pitch: 1.15, rate: 1.0 },
              face: { skin: "#b8845a", hair: "#141414", style: "beanie", eyes: "#2a1a10", clothes: "#e0a020", accessory: "scarf" } },
  thandi:   { name: "Thandi", voice: { g: "f", langs: ["en-ZA", "en-GB"], pitch: 1.1, rate: 1.05 },
              face: { skin: "#6b4226", hair: "#111111", style: "puffs", eyes: "#2a1a10", clothes: "#2a8a4a", accessory: "badge" } },
  aroha:    { name: "Aroha", voice: { g: "f", langs: ["en-NZ", "en-AU"], pitch: 1.05, rate: 1.0 },
              face: { skin: "#b07a52", hair: "#1a1010", style: "long", eyes: "#2a1a10", clothes: "#1a6a6a", accessory: "pendant" } },
  lucia:    { name: "Lucía", voice: { g: "f", langs: ["es-AR", "es-ES"], pitch: 1.1, rate: 1.05 },
              face: { skin: "#e0b890", hair: "#5a3018", style: "beanie", eyes: "#3a2a1a", clothes: "#d02a2a" } },
  ellie:    { name: "Dr Ellie", voice: { g: "f", langs: ["en-IE", "en-GB"], pitch: 1.05, rate: 1.0 },
              face: { skin: "#f4d8c4", hair: "#c05a20", style: "curly", eyes: "#3a7a4a", clothes: "#e06a1a", accessory: "clipboard" } },
  // ---------------------------------------------------------- Operation Midnight
  minuit:   { name: "Madame Minuit", voice: { g: "f", langs: ["fr-FR", "fr-CA"], pitch: 0.95, rate: 0.92 },
              face: { skin: "#f2d6c8", hair: "#d8dde6", style: "bun", eyes: "#4a3a6a", clothes: "#1a1426", accessory: "clockpins", brows: "stern" } },
  tick:     { name: "Tick", voice: { g: "m", langs: ["en-GB"], pitch: 0.6, rate: 0.9 },
              face: { skin: "#f0c8a8", hair: "#2a1a10", style: "bowler", eyes: "#222", facial: "moustache", clothes: "#2a2a30", big: true, hatColor: "#141418" } },
  tock:     { name: "Tock", voice: { g: "m", langs: ["en-GB"], pitch: 0.68, rate: 0.9 },
              face: { skin: "#f0c8a8", hair: "#2a1a10", style: "bowler", eyes: "#222", facial: "moustache", clothes: "#2a2a30", big: true, hatColor: "#141418" } },
  coucou:   { name: "Coucou", voice: { g: "n", langs: ["fr-FR"], pitch: 1.6, rate: 1.2 },
              face: { skin: "#8a5a2a", hair: "#8a5a2a", style: "cuckoo", eyes: "#ffd166", clothes: "#8a5a2a" } },
  king:     { name: "The King", voice: { g: "m", langs: ["en-GB"], pitch: 0.8, rate: 0.88 },
              face: { skin: "#f0c8b0", hair: "#d8d8d8", style: "crown", eyes: "#4a5a7a", clothes: "#1a2a5a", accessory: "sash" } },
  camille:  { name: "Camille", voice: { g: "f", langs: ["fr-FR", "fr-CA"], pitch: 1.3, rate: 1.05 },
              face: { skin: "#f3d2b8", hair: "#2a1810", style: "beret", eyes: "#3a5a8a", clothes: "#1a2a5a", hatColor: "#c0203a" } },
  yann:     { name: "Yann", voice: { g: "m", langs: ["fr-FR", "fr-CA"], pitch: 1.25, rate: 1.05 },
              face: { skin: "#f0c8a0", hair: "#6a4a2a", style: "beanie", eyes: "#3a5a4a", clothes: "#e0c040", hatColor: "#1a3a6a" } },
  giulia:   { name: "Giulia", voice: { g: "f", langs: ["it-IT"], pitch: 1.3, rate: 1.08 },
              face: { skin: "#ecc7a4", hair: "#3a2010", style: "boater", eyes: "#3a2a1a", clothes: "#1a2a5a", stripes: true } },
  marco:    { name: "Marco", voice: { g: "m", langs: ["it-IT"], pitch: 1.25, rate: 1.12 },
              face: { skin: "#e8bc94", hair: "#1a1010", style: "curly", eyes: "#3a2a1a", clothes: "#c0392b", accessory: "pizza" } },
  tomas:    { name: "Tomáš", voice: { g: "m", langs: ["cs-CZ", "sk-SK", "en-GB"], pitch: 1.2, rate: 1.0 },
              face: { skin: "#f0d0b4", hair: "#8a5a2a", style: "messy", eyes: "#4a6a8a", clothes: "#2a6a3a", accessory: "puppet" } },
  lena:     { name: "Lena", voice: { g: "f", langs: ["de-DE", "de-AT"], pitch: 1.3, rate: 1.02 },
              face: { skin: "#f4d8c4", hair: "#e0b050", style: "braids", eyes: "#3a6a9a", clothes: "#2a5a2a", accessory: "owl" } },
  isla:     { name: "Isla", voice: { g: "f", langs: ["en-GB", "en-IE"], pitch: 1.32, rate: 1.08 },
              face: { skin: "#f6dccb", hair: "#c0501a", style: "curly", eyes: "#3a7a4a", clothes: "#1a4a2a", tartan: true } },
  priya:    { name: "Priya", voice: { g: "f", langs: ["en-GB", "en-IN"], pitch: 1.3, rate: 1.05 },
              face: { skin: "#a8744c", hair: "#141010", style: "ranger", eyes: "#2a1a10", clothes: "#e0a020", accessory: "clipboard" } },
  alfie:    { name: "Alfie", voice: { g: "m", langs: ["en-GB"], pitch: 1.28, rate: 1.1 },
              face: { skin: "#f4d0b8", hair: "#c08040", style: "short", eyes: "#3a5a8a", clothes: "#a01a2a", accessory: "raven" } },
  // ---------------------------------------------------------- Operation Hurricane
  tempest:  { name: "Doctor Tempest", voice: { g: "f", langs: ["en-US"], pitch: 1.0, rate: 1.05 },
              face: { skin: "#f0d0b8", hair: "#6a4aa0", style: "cloudhat", eyes: "#4a2a6a", clothes: "#3a3a5a", accessory: "labcoat", brows: "stern" } },
  drizzle:  { name: "Drizzle", voice: { g: "m", langs: ["en-GB", "en-US"], pitch: 1.35, rate: 1.18 },
              face: { skin: "#e8c8b0", hair: "#6a5a4a", style: "bald", eyes: "#4a4a4a", clothes: "#4a5a6a", accessory: "umbrella", sweaty: true } },
  thunder:  { name: "Thunder", voice: { g: "m", langs: ["en-US"], pitch: 0.5, rate: 0.8 },
              face: { skin: "#8a5a3a", hair: "#141414", style: "short", eyes: "#222", facial: "beard", clothes: "#2a2a3a", big: true, brows: "stern" } },
  president:{ name: "The President", voice: { g: "m", langs: ["en-US"], pitch: 0.85, rate: 0.95 },
              face: { skin: "#e8c0a0", hair: "#c8c8c8", style: "swept", eyes: "#3a4a6a", clothes: "#1a2440", accessory: "flagpin" } },
  kai:      { name: "Kai", voice: { g: "m", langs: ["en-US", "en-AU"], pitch: 1.2, rate: 1.05 },
              face: { skin: "#b8845a", hair: "#1a1010", style: "messy", eyes: "#2a1a10", clothes: "#1ab0c0", accessory: "pendant" } },
  maya:     { name: "Maya", voice: { g: "f", langs: ["en-US"], pitch: 1.3, rate: 1.1 },
              face: { skin: "#8a5a3a", hair: "#1a1010", style: "puffs", eyes: "#2a1a10", clothes: "#e03a6a", accessory: "headset" } },
  ruby:     { name: "Ruby", voice: { g: "f", langs: ["en-US"], pitch: 1.3, rate: 1.05 },
              face: { skin: "#f0c8a8", hair: "#8a3a1a", style: "ranger", eyes: "#3a5a3a", clothes: "#6a7a3a", accessory: "badge" } },
  dusty:    { name: "Dusty", voice: { g: "m", langs: ["en-US"], pitch: 1.25, rate: 1.08 },
              face: { skin: "#f0c8a8", hair: "#c09040", style: "cap", eyes: "#3a5a8a", clothes: "#3a6aa0", hatColor: "#c0392b" } },
  chloe:    { name: "Chloe", voice: { g: "f", langs: ["en-CA", "en-US"], pitch: 1.32, rate: 1.05 },
              face: { skin: "#f4d8c4", hair: "#e0c080", style: "beanie", eyes: "#3a6a9a", clothes: "#1a4a8a", hatColor: "#c0392b" } },
  leo:      { name: "Leo", voice: { g: "m", langs: ["en-US"], pitch: 1.2, rate: 1.05 },
              face: { skin: "#c09070", hair: "#3a2010", style: "cap", eyes: "#3a2a1a", clothes: "#e0a030", hatColor: "#2a6a3a" } },
  elena:    { name: "Elena", voice: { g: "f", langs: ["es-US", "es-MX", "es-ES"], pitch: 1.3, rate: 1.05 },
              face: { skin: "#a0704a", hair: "#1a1010", style: "curly", eyes: "#2a1a10", clothes: "#f0e030", accessory: "trumpet" } },
  mateo:    { name: "Mateo", voice: { g: "m", langs: ["es-MX", "es-US", "es-ES"], pitch: 1.2, rate: 1.0 },
              face: { skin: "#b07a52", hair: "#1a1010", style: "short", eyes: "#2a1a10", clothes: "#2a8a4a", accessory: "sloth" } },
  nia:      { name: "Nia", voice: { g: "f", langs: ["en-US"], pitch: 1.25, rate: 1.05 },
              face: { skin: "#6b4226", hair: "#111111", style: "long", eyes: "#2a1a10", glasses: "round", clothes: "#5a3a8a" } },
};

// kept for the engine's symbol drawing
export const SYMBOLS = ["sun", "moon", "star", "bolt", "eye", "key", "wave", "diamond", "skull"];

export const OPS = [OP1, OP2, OP3];
export const COUNTRIES = [], ACTS = [], CREDITS = [], ALL_MISSIONS = [];
export const CUR = { op: OP1, i: 0 };
export function useOp(i) {
  const op = OPS[i] || OPS[0]; CUR.op = op; CUR.i = OPS.indexOf(op);
  const fill = (a, b) => { a.length = 0; a.push(...b); };
  fill(COUNTRIES, op.countries); fill(ACTS, op.acts); fill(CREDITS, op.credits);
  fill(ALL_MISSIONS, op.countries.flatMap(c => c.missions));
  return op;
}
useOp(0);
// every mission of every operation, for the things that must know them all
export const EVERY_MISSION = OPS.flatMap(o => o.countries.flatMap(c => c.missions));
export const ACT_WORDS = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];
export const actWord = n => ACT_WORDS[n - 1] || String(n);
export function missionIndex(id) { return ALL_MISSIONS.findIndex(m => m.id === id); }
export function countryOf(mission) { return COUNTRIES.find(c => c.missions.includes(mission)); }
