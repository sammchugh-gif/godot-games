// Timeslip's clues (clues.js, puzzles.js): the missions that end with a puzzle for Rory
// to crack. p is the kind of puzzle, lv its level (1 is the gentlest), say the lines
// before it, after the line once it's solved. The kinds are Timeslip's own (whose
// footprints, the fossil puzzle, wrong time, the rune path, shape fit, the Roman mosaic,
// cave dot-to-dot, the river crossing, lost in time), plus the three spy clues every game
// has (the line-up, the coded note, the spy map). Pebble honks rather than talks, so she
// has no lines.
export const THEME = {
  things: ["Sandbots", "time sparks", "eggs", "bottles"],
  boxes: ["carts", "baskets", "crates"],
  words: ["TIME", "SAND", "EGG", "CLOCK", "PAST"],
  names: ["Max", "Ivy", "Sam", "Nell", "Otto", "Ruby", "Jay", "Mo", "Lena", "Finn"],
  // the code's symbols: old marks from the eras
  glyphs: [["☥", "#d8a020"], ["☼", "#e03a3a"], ["☾", "#2a6ad8"], ["✶", "#2aa84a"], ["⌛", "#8a5a2a"], ["♜", "#9a4ad8"], ["▲", "#ff8a1a"], ["◆", "#2ab8c8"], ["●", "#6a8a2a"], ["■", "#d83a8a"], ["✚", "#4a6a9a"], ["◐", "#d84a2a"]],
  map: { tile: "#e8d8b0", ink: "#3a2a10", start: "⏳" },
};

// (The clues that used to follow an action mission are missions of their own now: every
// place is puzzle missions and one action finale, like Operation Eclipse and Meltdown. So
// no mission ends in an extra clue any more.)
export const CLUES = {};
