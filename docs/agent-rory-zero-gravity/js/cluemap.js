// Zero Gravity's clues (clues.js, puzzles.js): the missions that end with a puzzle for
// Rory to crack. p is the kind of puzzle, lv its level (1 is the gentlest), say the lines
// before it, after the line once it's solved. The kinds are Zero Gravity's own (the
// gravity balance and lever, the launch countdown, Zero's gold bars, rocket stages,
// power cells, Floater sort, memory match, sharing the cells), plus the three spy clues
// every game has (the line-up, the coded note, the spy map). The codes are the trail:
// EGYPT on the machine label, RIO on the cells, INDIA in the relay's orders, MOON on the Pump.
export const THEME = {
  things: ["Floaters", "gravity cells", "blocks", "leeches"],
  boxes: ["crates", "vans", "rockets"],
  words: ["ZERO", "PUMP", "CELL", "FLOAT", "BOLT", "SPY"],
  names: ["Max", "Ivy", "Sam", "Nell", "Otto", "Ruby", "Jay", "Mo", "Lena", "Finn"],
  // the code's symbols: the sky and the space station
  glyphs: [["☀", "#d8a020"], ["☽", "#2a6ad8"], ["★", "#e03a3a"], ["✦", "#2ab8c8"], ["⚙", "#8a5a2a"], ["▲", "#2aa84a"], ["●", "#9a4ad8"], ["■", "#ff8a1a"], ["◆", "#d83a8a"], ["✚", "#4a6a9a"], ["♦", "#6a8a2a"], ["♣", "#d84a2a"]],
  map: { tile: "#1e2a4a", ink: "#ffffff", start: "🚀" },
};

// (The clues that used to follow an action mission are missions of their own now: every
// place is puzzle missions and one action finale, like Operation Eclipse and Meltdown. So
// no mission ends in an extra clue any more.)
export const CLUES = {};
