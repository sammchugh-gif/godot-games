// Timeslip's clues (clues.js, puzzles.js): the missions that end with a puzzle for Rory
// to crack. p is the kind of puzzle, lv its level (1 is the gentlest), say the lines
// before it, after the line once it's solved. The kinds are Timeslip's own (time-tunnel
// clocks, hourglass sums, how long, Roman numerals, the calendar, number pyramids, market
// trading, doubling and halving, footprint tracks), plus the three spy clues every game
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

export const CLUES = {
  // ---------------------------------------------------------------- Dinosaur Valley
  dino2: { p: "doubles", lv: 1, things: "eggs", title: "THE STOLEN EGGS",
    say: [["flint", "The Sandbots took eggs from two nests, the same number from each."], ["pip", "Double it, Rory. How many eggs did they take?"]] },
  dino3: { p: "hourglass", lv: 1, things: "eggs", title: "BACK TO THE NEST",
    say: [["flint", "Let's check the nest before the hourglass runs out and their mum comes back."], ["pip", "Work it out, Rory."]] },
  dino4: { p: "tracks", lv: 1, who: "The baby triceratops", title: "FOLLOW THE FOOTPRINTS",
    say: [["flint", "The last baby wandered off. Her footprints go along the numbered stones."], ["pip", "Count her steps, Rory. Where did she end up?"]] },
  dino5: { p: "clock", lv: 1, when: "The T. rex wakes up at", title: "WHEN THE T. REX WAKES",
    say: [["flint", "The T. rex wakes up at the same time every day. I wrote it down."], ["pip", "Which clock says it, Rory? Then we'll know how long we've got."]] },
  // ---------------------------------------------------------------- The Ice Age
  ice1: { p: "map", lv: 1, title: "THE BARK MAP",
    say: [["tuva", "The herd went over the hills. Here's my map. I drew it on bark."], ["pip", "Follow the steps, Rory. Where's the herd?"]] },
  ice2: { p: "calendar", lv: 1, title: "THE CAVE CALENDAR",
    say: [["tuva", "We scratch a mark on the cave wall every day. The icicles always fall on the same day of the week."], ["pip", "Your watch knows the days, Rory. Which day is it?"]] },
  ice3: { p: "cipher", lv: 1, word: "SAND", title: "THE CAVE SCRATCHES",
    say: [["rory", "Someone has scratched numbers on the cave wall. That wasn't a caveman."], ["pip", "Number code, Rory. A is 1, B is 2."]],
    after: [["rory", "SAND. The Sandbots got here first."]] },
  ice4: { p: "trade", lv: 1, goods: ["fish", "egg", "basket of figs"], title: "THE CAMP TRADE",
    say: [["tuva", "We need more snow blocks cut, and the block cutters want paying in trade."], ["pip", "Work out the swap, Rory."]] },
  // ---------------------------------------------------------------- Ancient Egypt
  egy5: { p: "pyramid", lv: 2, title: "THE BUILDERS' MARKS",
    say: [["nefi", "The builders mark the ramp blocks in a pyramid of numbers. Each block is the two under it, added."], ["pip", "Fill in the missing ones, Rory, and we'll know the ramp is strong."]] },
  egy6: { p: "duration", lv: 2, event: "The capstone ceremony", title: "HOW LONG AT THE TOP?",
    say: [["flint", "Hourglass wants to bottle the capstone ceremony. How long does it last? That's how long we've got."]] },
  // ---------------------------------------------------------------- Olympia
  gre1: { p: "clock", lv: 2, when: "The big race starts at", title: "THE BIG RACE",
    say: [["theo", "The big race starts when the sundial says. Your watch can tell us the time."], ["pip", "Which clock says it, Rory?"]] },
  gre6: { p: "trade", lv: 2, goods: ["amphora", "basket of figs", "loaf", "jar of honey"], title: "THE CROWN MAKER",
    say: [["theo", "The crown maker will make new olive crowns, but he wants paying in trade. Figs, honey, that sort of thing."], ["pip", "Work out the swap, Rory."]],
    after: [["theo", "Olive crowns for everyone!"]] },
  // ---------------------------------------------------------------- The Roman Aqueduct
  aq1: { p: "roman", lv: 2, title: "THE ARCH NUMBERS",
    say: [["livia", "The arches are numbered, the Roman way. The sparks are at one of them."], ["pip", "Read the Roman numerals, Rory."]] },
  aq4: { p: "suspect", lv: 2, title: "THE BATHHOUSE LOOKOUT",
    say: [["livia", "Four bathers were here when the Sandbots came. One of them is Doctor Hourglass's lookout!"], ["pip", "Read the clues, Rory."]] },
  // ---------------------------------------------------------------- The Viking Fjord
  vik4: { p: "pyramid", lv: 2, title: "THE LOFT CHEST",
    say: [["sigrid", "Grandad carved a number pyramid on the chest. Fill in the missing numbers and it opens."], ["pip", "Each block is the two under it, added."]] },
  vik5: { p: "doubles", lv: 2, things: "stitches", boxes: "sail pieces", box: "sail piece", title: "MENDING THE SAIL",
    say: [["sigrid", "Each piece of the sail needs the same number of stitches. Help me work it out."]] },
};
