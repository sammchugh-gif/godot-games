// Every mini-game type in Agent Rory: Meltdown, gathered from the files that
// define them. Each file exports KINDS, a map from the game name used in
// story.js to its class. A file that fails to load is reported and skipped,
// so one broken game cannot stop the others from being played.
export const KINDS = {};
const FILES = ["./games1.js", "./games2.js", "./games3.js", "./games4.js", "./run.js"];
export async function loadGames() {
  for (const f of FILES) {
    try { const m = await import(f); Object.assign(KINDS, m.KINDS || {}); }
    catch (e) { console.warn(`${f} not loaded:`, e && e.message); }
  }
  return KINDS;
}
export function makeMinigame(kind, G, mission) { const C = KINDS[kind]; return C ? new C(G, mission) : null; }
