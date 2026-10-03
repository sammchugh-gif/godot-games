// Deep Red's clues (clues.js, puzzles.js): the missions that end with a puzzle for Rory
// to crack. p is the kind of puzzle, lv its level (1 is the gentlest), say the lines
// before it, after the line once it's solved. The kinds are Deep Red's own (pressure
// locks, depth gauges, tide charts, fish tallies, pearl necklaces, the depth line, air
// tanks, measuring, porthole shapes), plus the three spy clues every game has (the
// line-up, the coded note, the spy map). Every place has four or five puzzles out of six.
export const THEME = {
  things: ["Drips", "Tide Pearls", "pumps", "crates"],
  boxes: ["crates", "boats", "nets"],
  words: ["SEA", "TIDE", "PEARL", "DRIP", "PUMP", "DEEP"],
  names: ["Max", "Ivy", "Sam", "Nell", "Otto", "Ruby", "Jay", "Mo", "Lena", "Finn"],
  // the code's symbols: a sailor's
  glyphs: [["⚓", "#2a6ad8"], ["〰", "#2ab8c8"], ["◎", "#e03a3a"], ["▲", "#2aa84a"], ["◆", "#9a4ad8"], ["✚", "#ff8a1a"], ["☾", "#d8a020"], ["★", "#d83a8a"], ["●", "#6a8a2a"], ["■", "#8a5a2a"], ["▼", "#4a6a9a"], ["◐", "#d84a2a"]],
  map: { tile: "#2a6a9a", ink: "#ffffff", start: "⚓" },
};

// (The clues that used to follow an action mission are missions of their own now: every
// place is puzzle missions and one action finale, like Operation Eclipse and Meltdown. So
// no mission ends in an extra clue any more.)
export const CLUES = {};
