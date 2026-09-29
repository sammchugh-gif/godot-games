// The Agent Rory spy clues: every game's cluemap.js names real missions, real kinds of
// puzzle and real speakers, and three missions in four end with a puzzle.
//   node tools/cluecheck.mjs
const STRICT = new Set(["codes", "circuit", "mix", "colourcode", "morse", "tide", "valves", "airlock", "starmap", "timeline", "echo", "dig"]);
let bad = 0;
for (const g of ["Game20", "Game21", "Game22", "Game23"]) {
  const story = await import(`../${g}/js/story.js`), { CLUES } = await import(`../${g}/js/cluemap.js`), { KINDS } = await import(`../${g}/js/clues.js`).catch(() => import("../Game22/js/clues.js"));
  const all = story.PLACES.flatMap(p => p.missions), ids = new Set(all.map(m => m.id));
  const err = m => { bad++; console.log(`  ${g}: ${m}`); };
  for (const [id, c] of Object.entries(CLUES)) {
    if (!ids.has(id)) err(`${id} is not a mission`);
    if (!KINDS[c.p]) err(`${id}: no puzzle kind ${c.p}`);
    const m = all.find(x => x.id === id); if (m && STRICT.has(m.kind)) err(`${id} is already a puzzle (${m.kind})`);
    for (const [who, text] of [...(c.say || []), ...(c.after || [])]) { const ch = story.CHARS[who]; if (!ch) err(`${id}: nobody called ${who}`); else if (ch.dino) err(`${id}: ${who} can't talk`); if (typeof text !== "string" || !text.trim()) err(`${id}: empty line`); }
    if (c.lv && (c.lv < 1 || c.lv > 4)) err(`${id}: level ${c.lv}`);
  }
  const puz = all.filter(m => STRICT.has(m.kind) || CLUES[m.id]).length, need = Math.ceil(all.length * 0.75);
  const kinds = {}; for (const c of Object.values(CLUES)) kinds[c.p] = (kinds[c.p] || 0) + 1;
  console.log(`${puz >= need ? "ok" : "SHORT"} ${g}: ${puz} of ${all.length} missions have a puzzle (need ${need}); ${Object.keys(CLUES).length} clues: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  if (puz < need) bad++;
}
process.exit(bad ? 1 : 0);
