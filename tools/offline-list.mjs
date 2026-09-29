/* The lists the offline copy is made from.

   docs/sw.js keeps a copy of each game on the iPad or iPhone so it plays
   with no internet. To save a whole game - not just the parts that happened
   to load, like the one pinball table played or the voice lines heard so far
   - it needs to know every file in it, and to bring a saved game up to date
   without downloading it all again, which files changed. So for every folder
   under docs/ this writes docs/offline/<folder>.json: each file, its size,
   and the start of its SHA-1. docs/offline/index.json has each game's total
   size and one fingerprint for the lot, so a device can tell in one small
   request which of its saved games are out of date.

   "shared" is what every game page loads from the top of the site (menu.js,
   fresh.js, offline.js); "shelf" is the page of games itself, with its
   pictures.

   Run it after adding, removing or changing files in docs/:

     node tools/offline-list.mjs           write the lists
     node tools/offline-list.mjs --check   fail if they are out of date */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(DOCS, 'offline');

/* never part of a game: notes for people, and the offline machinery itself
   (the lists are fetched fresh, and a service worker is never served from a
   cache) */
const skip = rel => /(^|\/)\./.test(rel) || /\.md$/i.test(rel) || rel.startsWith('offline/') || rel === 'sw.js';

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}
function entry(abs) {
  const rel = path.relative(DOCS, abs).split(path.sep).join('/');
  const buf = fs.readFileSync(abs);
  return [rel, crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12), buf.length];
}
function group(files) {
  files = files.filter(f => !skip(f[0])).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const bytes = files.reduce((a, f) => a + f[2], 0);
  const hash = crypto.createHash('sha1').update(files.map(f => f[0] + ' ' + f[1]).join('\n')).digest('hex').slice(0, 12);
  return { files, bytes, hash };
}

export function build() {
  const top = fs.readdirSync(DOCS, { withFileTypes: true });
  const groups = {};
  const rootFiles = top.filter(e => e.isFile()).map(e => entry(path.join(DOCS, e.name)));
  groups.shared = group(rootFiles.filter(f => f[0] !== 'index.html'));
  const shots = fs.existsSync(path.join(DOCS, 'shots')) ? walk(path.join(DOCS, 'shots')).map(entry) : [];
  groups.shelf = group(rootFiles.filter(f => f[0] === 'index.html').concat(shots));
  for (const e of top) {
    if (!e.isDirectory() || e.name === 'shots' || e.name === 'offline' || e.name.startsWith('.')) continue;
    if (!fs.existsSync(path.join(DOCS, e.name, 'index.html'))) continue;
    groups[e.name] = group(walk(path.join(DOCS, e.name)).map(entry));
  }
  /* what else a game opens: Agent Rory HQ is the way into the missions (and
     shows the shelf's pictures of them), so saving HQ for offline has to save
     those too */
  const withOf = {};
  for (const k in groups) {
    if (k === 'shared' || k === 'shelf') continue;
    const w = new Set();
    for (const [rel] of groups[k].files) {
      if (!/\.(html|js)$/.test(rel)) continue;
      const src = fs.readFileSync(path.join(DOCS, rel), 'utf8');
      for (const m of src.matchAll(/\.\.\/([a-z0-9-]+)\//g)) {
        const g = m[1] === 'shots' ? 'shelf' : m[1];
        if (g !== k && groups[g] && g !== 'shared') w.add(g);
      }
    }
    if (w.size) withOf[k] = [...w].sort();
  }
  const index = { v: 1, games: {} };
  for (const k of Object.keys(groups).sort()) {
    index.games[k] = { bytes: groups[k].bytes, n: groups[k].files.length, hash: groups[k].hash };
    if (withOf[k]) index.games[k].with = withOf[k];
  }
  const out = { 'index.json': JSON.stringify(index, null, 1) + '\n' };
  for (const k in groups) out[k + '.json'] = JSON.stringify({ hash: groups[k].hash, files: groups[k].files }) + '\n';
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const want = build();
  if (process.argv[2] === '--check') {
    const have = fs.existsSync(OUT) ? fs.readdirSync(OUT) : [];
    const stale = Object.keys(want).filter(f => !have.includes(f) || fs.readFileSync(path.join(OUT, f), 'utf8') !== want[f]);
    const extra = have.filter(f => !(f in want));
    if (stale.length || extra.length) {
      console.log(`the offline lists are out of date (${stale.concat(extra).join(', ')}): run node tools/offline-list.mjs`);
      process.exit(1);
    }
    console.log('the offline lists match the site');
  } else {
    fs.mkdirSync(OUT, { recursive: true });
    for (const f of fs.readdirSync(OUT)) if (!(f in want)) fs.unlinkSync(path.join(OUT, f));
    for (const f in want) fs.writeFileSync(path.join(OUT, f), want[f]);
    const idx = JSON.parse(want['index.json']).games;
    const mb = b => (b / 1048576).toFixed(1) + ' MB';
    for (const k in idx) console.log(`${k.padEnd(26)} ${String(idx[k].n).padStart(5)} files ${mb(idx[k].bytes).padStart(9)}`);
    console.log(`\n${Object.keys(idx).length} groups, ${mb(Object.values(idx).reduce((a, g) => a + g.bytes, 0))} in all`);
  }
}
