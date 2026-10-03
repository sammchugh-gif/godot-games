// Spectrum's clues (clues.js, puzzles.js): the missions that end with a puzzle for Rory
// to crack. p is the kind of puzzle, lv its level (1 is the gentlest), say the lines
// before it, after the line once it's solved. The kinds are Spectrum's own (colour
// count, paint by numbers, mirror painting, fractions, azulejo tiles, the paint shop,
// grey shadows, colour squares, the drop chart), plus the three spy clues every game has
// (the line-up, the coded note, the spy map). The clues are a trail: the lookout in
// Dingle, the boatman's tip, the lookout's map to Lapland, the plans that spell MONOCHROME.
export const THEME = {
  things: ["Blotters", "paint pots", "colour drops", "grey jars"],
  boxes: ["crates", "vans", "sacks"],
  words: ["GREY", "PAINT", "JAR", "DROP", "BLOT", "MOP"],
  names: ["Max", "Ivy", "Sam", "Nell", "Otto", "Ruby", "Jay", "Mo", "Lena", "Finn"],
  // (the code's symbols are the coloured ones: this is the colour game)
  map: { tile: "#f4e8c0", ink: "#1a2440", start: "🎨" },
};

// (The clues that used to follow an action mission are missions of their own now: every
// place is puzzle missions and one action finale, like Operation Eclipse and Meltdown. So
// no mission ends in an extra clue any more.)
export const CLUES = {};
