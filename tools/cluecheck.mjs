// The Agent Rory puzzles, in Zero Gravity, Deep Red, Spectrum and Timeslip: every place is
// puzzle missions that win intel and one action finale, like Operation Eclipse and Meltdown.
// Checks every puzzle mission names a real kind (the game's own, in puzzles.js, or the three
// spy clues every game has, in clues.js) and real speakers; every mission wins intel; each
// place has at most five missions and exactly one action; three missions in four are a
// puzzle; every one of a game's own kinds is used; and no two games share more than a
// quarter of their kinds of puzzle.
//   node tools/cluecheck.mjs
const PANEL = new Set(["codes", "circuit", "mix", "colourcode", "morse", "tide", "valves", "airlock", "starmap", "timeline", "echo", "dig", "greenhouse"]);
const GAMES = ["Game20", "Game21", "Game22", "Game23"], used = {};
let bad = 0;
for (const g of GAMES) {
  const story = await import(`../${g}/js/story.js`), own = await import(`../${g}/js/puzzles.js`), core = await import(`../${g}/js/clues.js`), { CLUES } = await import(`../${g}/js/cluemap.js`);
  const KINDS = { ...core.KINDS, ...own.KINDS };
  const all = story.PLACES.flatMap(p => p.missions);
  const err = m => { bad++; console.log(`  ${g}: ${m}`); };
  if (Object.keys(CLUES).length) err(`cluemap.js still has ${Object.keys(CLUES).length} clues after missions (they're puzzle missions now)`);
  for (const p of story.PLACES) {
    if (p.missions.length > 5) err(`${p.id} has ${p.missions.length} missions (at most 5)`);
    const acts = p.missions.filter(m => m.kind !== "puzzle" && !PANEL.has(m.kind));
    if (acts.length !== 1) err(`${p.id} has ${acts.length} action missions (${acts.map(m => `${m.id} ${m.kind}`).join(", ")}): it should have one`);
  }
  for (const m of all) {
    if (!m.intel || !m.intel.title || !m.intel.text) err(`${m.id} wins no intel`);
    for (const [who, text] of [...(m.intro || []), ...(m.outro || [])]) { const ch = story.CHARS[who]; if (!ch) err(`${m.id}: nobody called ${who}`); else if (ch.dino && !/^[A-Za-z!?. ]*(honk|mrrp|sniff)/i.test(text)) err(`${m.id}: ${who} can't talk`); if (typeof text !== "string" || !text.trim()) err(`${m.id}: empty line`); }
    if (m.kind !== "puzzle") continue;
    if (!KINDS[m.p]) err(`${m.id}: no puzzle kind ${m.p} in this game`);
    if (!m.lv || m.lv < 1 || m.lv > 4) err(`${m.id}: level ${m.lv}`);
    if (m.p === "cipher" && m.word && !/^[A-Z]{2,10}$/.test(m.word)) err(`${m.id}: the code word ${m.word} should be 2 to 10 capital letters`);
  }
  const puzzles = all.filter(m => m.kind === "puzzle");
  for (const k of Object.keys(own.KINDS)) if (!puzzles.some(m => m.p === k)) err(`its own kind ${k} is never used`);
  used[g] = new Set(puzzles.map(m => m.p));
  const puz = all.filter(m => m.kind === "puzzle" || PANEL.has(m.kind)).length, need = Math.ceil(all.length * 0.75);
  const kinds = {}; for (const m of puzzles) kinds[m.p] = (kinds[m.p] || 0) + 1;
  console.log(`${puz >= need ? "ok" : "SHORT"} ${g}: ${puz} of ${all.length} missions are puzzles (need ${need}), ${puzzles.length} of them puzzle missions of ${used[g].size} kinds: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  if (puz < need) bad++;
}
// how much each pair of games shares
for (let i = 0; i < GAMES.length; i++) for (let j = i + 1; j < GAMES.length; j++) {
  const a = used[GAMES[i]], b = used[GAMES[j]], both = [...a].filter(k => b.has(k)), share = both.length / Math.min(a.size, b.size);
  console.log(`${share <= 0.25 ? "ok" : "TOO SIMILAR"} ${GAMES[i]} and ${GAMES[j]} share ${both.length} of their puzzle kinds (${Math.round(share * 100)}%): ${both.join(", ")}`);
  if (share > 0.25) bad++;
}
process.exit(bad ? 1 : 0);
