/* No game may declare the same top-level function twice.

   In a script, the later declaration silently wins - and Star Swarm shipped
   a day with every run drawn over the hangar's sky, because the title
   screen's new sky-painter had taken the world's name, drawStars. Nothing
   threw. This scans every game for a repeated `function name(` at column
   one and fails on any it does not already know about.

     node tools/dupcheck.mjs          */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* Paws of Fury has carried two buildCritter's since before this check
   existed; the second is the one that runs and is the one every caller
   wants. It stays listed here rather than fixed blind. */
/* Mahjong Club's tile and face painters each live inside their own
   (()=>{ ... })() with a frame, petal and rr of their own, written at
   column one; they never meet the page's frame (the loop) or rr (the
   drawing kit). */
const KNOWN = { 'paws-of-fury': ['buildCritter'], 'mahjong-club': ['frame', 'petal', 'rr'] };

let bad = 0;
for (const slug of fs.readdirSync(path.join(ROOT, 'docs')).sort()) {
  const f = path.join(ROOT, 'docs', slug, 'index.html');
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  /* and the script must parse: a stray comment once swallowed a line's
     closing braces, and the page loaded to nothing, silently */
  const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const main = scripts.reduce((a, b) => (b.length > a.length ? b : a), '');
  const tmp = path.join(os.tmpdir(), `dupcheck-${slug}.js`);
  fs.writeFileSync(tmp, main);
  const chk = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  if (chk.status !== 0) { bad++; console.log(`${slug.padEnd(16)} does not parse: ${(chk.stderr.split('\n').find(l => /Error/.test(l)) || '').trim()} <-- FAIL`); continue; }
  const names = [...src.matchAll(/^function (\w+)\(/gm)].map(m => m[1]);
  const seen = new Map();
  for (const n of names) seen.set(n, (seen.get(n) || 0) + 1);
  const dups = [...seen].filter(([n, c]) => c > 1 && !(KNOWN[slug] || []).includes(n)).map(([n]) => n);
  if (dups.length) { bad++; console.log(`${slug.padEnd(16)} declares twice: ${dups.join(', ')} <-- FAIL`); }
  else console.log(`${slug.padEnd(16)} parses, ${names.length} functions, no name declared twice ok`);
}
console.log(bad ? `\n${bad} games would not run as written` : '\nevery game parses and every function means one thing');
process.exit(bad ? 1 : 0);
