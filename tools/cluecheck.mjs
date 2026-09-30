// The Agent Rory spy clues: every game's cluemap.js names real missions, real kinds of
// puzzle (its own in puzzles.js, or the three spy clues every game has in clues.js) and
// real speakers; three missions in four end with a puzzle; and no two games share more
// than a quarter of their kinds of clue.
//   node tools/cluecheck.mjs
const STRICT = new Set(["codes", "circuit", "mix", "colourcode", "morse", "tide", "valves", "airlock", "starmap", "timeline", "echo", "dig"]);
const GAMES = ["Game20", "Game21", "Game22", "Game23"], used = {};
let bad = 0;
for (const g of GAMES) {
  const story = await import(`../${g}/js/story.js`), { CLUES } = await import(`../${g}/js/cluemap.js`), own = await import(`../${g}/js/puzzles.js`), core = await import(`../${g}/js/clues.js`);
  const KINDS = { ...core.KINDS, ...own.KINDS };
  const all = story.PLACES.flatMap(p => p.missions), ids = new Set(all.map(m => m.id));
  const err = m => { bad++; console.log(`  ${g}: ${m}`); };
  for (const [id, c] of Object.entries(CLUES)) {
    if (!ids.has(id)) err(`${id} is not a mission`);
    if (!KINDS[c.p]) err(`${id}: no puzzle kind ${c.p} in this game`);
    const m = all.find(x => x.id === id); if (m && STRICT.has(m.kind)) err(`${id} is already a puzzle (${m.kind})`);
    for (const [who, text] of [...(c.say || []), ...(c.after || [])]) { const ch = story.CHARS[who]; if (!ch) err(`${id}: nobody called ${who}`); else if (ch.dino) err(`${id}: ${who} can't talk`); if (typeof text !== "string" || !text.trim()) err(`${id}: empty line`); }
    if (c.lv && (c.lv < 1 || c.lv > 4)) err(`${id}: level ${c.lv}`);
  }
  for (const k of Object.keys(own.KINDS)) if (!Object.values(CLUES).some(c => c.p === k)) err(`its own kind ${k} is never used`);
  used[g] = new Set(Object.values(CLUES).map(c => c.p));
  const puz = all.filter(m => STRICT.has(m.kind) || CLUES[m.id]).length, need = Math.ceil(all.length * 0.75);
  const kinds = {}; for (const c of Object.values(CLUES)) kinds[c.p] = (kinds[c.p] || 0) + 1;
  console.log(`${puz >= need ? "ok" : "SHORT"} ${g}: ${puz} of ${all.length} missions have a puzzle (need ${need}); ${Object.keys(CLUES).length} clues of ${used[g].size} kinds: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  if (puz < need) bad++;
}
// how much each pair of games shares
for (let i = 0; i < GAMES.length; i++) for (let j = i + 1; j < GAMES.length; j++) {
  const a = used[GAMES[i]], b = used[GAMES[j]], both = [...a].filter(k => b.has(k)), share = both.length / Math.min(a.size, b.size);
  console.log(`${share <= 0.25 ? "ok" : "TOO SIMILAR"} ${GAMES[i]} and ${GAMES[j]} share ${both.length} of their clue kinds (${Math.round(share * 100)}%): ${both.join(", ")}`);
  if (share > 0.25) bad++;
}
process.exit(bad ? 1 : 0);
