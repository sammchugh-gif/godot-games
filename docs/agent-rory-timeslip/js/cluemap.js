// Timeslip's clues (clues.js): the missions that end with a puzzle for Rory to crack.
// p is the kind of puzzle, lv its level (1 is the gentlest), say the lines before it,
// after the line once it's solved. (Pebble honks rather than talks, so she has no lines.)
export const THEME = {
  things: ["Sandbots", "time sparks", "eggs", "bottles"],
  boxes: ["carts", "baskets", "crates"],
  words: ["TIME", "SAND", "EGG", "CLOCK", "PAST"],
  names: ["Max", "Ivy", "Sam", "Nell", "Otto", "Ruby", "Jay", "Mo", "Lena", "Finn"],
};

export const CLUES = {
  // ---------------------------------------------------------------- Dinosaur Valley
  dino2: { p: "count", lv: 1, title: "THE EGG LIST",
    say: [["flint", "The Sandbots dropped a list of the eggs they took. In shapes! Robots can't spell."], ["pip", "Count the ones it asks for, Rory."]] },
  dino3: { p: "order", lv: 1, title: "THE NUMBERED EGGS",
    say: [["flint", "The eggs have numbers on them. The Sandbots were sorting them!"], ["pip", "Put them in order, Rory, smallest first, so we know none are missing."]] },
  dino4: { p: "story", lv: 1, things: "baby dinosaurs", boxes: "nests", title: "THE HATCHLING COUNT",
    say: [["flint", "Let's count the babies, to be sure they're all home."]] },
  dino5: { p: "clock", lv: 1, title: "WHEN THE T. REX WAKES",
    say: [["flint", "The T. rex wakes up at the same time every day. I wrote it down."], ["pip", "Which clock says it, Rory? Then we'll know how long we've got."]] },
  // ---------------------------------------------------------------- The Ice Age
  ice1: { p: "map", lv: 1, title: "THE BARK MAP",
    say: [["tuva", "The herd went over the hills. Here's my map. I drew it on bark."], ["pip", "Follow the steps, Rory. Where's the herd?"]] },
  ice2: { p: "scale", lv: 1, title: "THE ICICLE SCALE",
    say: [["tuva", "Those icicles are heavy! Our old scale says how heavy."], ["pip", "Work out what the box weighs, Rory."]] },
  ice3: { p: "cipher", lv: 1, word: "SAND", title: "THE CAVE SCRATCHES",
    say: [["rory", "Someone has scratched numbers on the cave wall. That wasn't a caveman."], ["pip", "Number code, Rory. A is 1, B is 2."]],
    after: [["rory", "SAND. The Sandbots got here first."]] },
  ice4: { p: "times", lv: 1, title: "THE SNOW WALL",
    say: [["tuva", "The wall needs the same number of blocks in every row. How many altogether?"], ["pip", "Times tables, Rory."]] },
  // ---------------------------------------------------------------- Ancient Egypt
  egy5: { p: "sum", lv: 2, title: "THE BUILDERS' MARKS",
    say: [["nefi", "The builders mark every block with a number. Add them up, and we'll know the ramp is strong enough."]] },
  egy6: { p: "next", lv: 2, title: "THE TUNNEL DOORS",
    say: [["flint", "The tunnel doors are numbered in a pattern. Which one did the Sandbots take?"], ["pip", "What comes next, Rory?"]] },
  // ---------------------------------------------------------------- Olympia
  gre1: { p: "clock", lv: 2, title: "THE BIG RACE",
    say: [["theo", "The big race starts when the sundial says. Your watch can tell us the time."], ["pip", "Which clock says it, Rory?"]] },
  gre6: { p: "coins", lv: 2, title: "THE CROWN MAKER",
    say: [["theo", "The crown maker will make new crowns for the winners. But he wants paying."], ["pip", "Pay him exactly, Rory."]],
    after: [["theo", "Olive crowns for everyone!"]] },
  // ---------------------------------------------------------------- The Roman Aqueduct
  aq1: { p: "minus", lv: 2, title: "THE WATER GAUGE",
    say: [["livia", "The aqueduct is losing water. The gauge says how much."], ["pip", "Take away, Rory. How much is still flowing?"]] },
  aq4: { p: "suspect", lv: 2, title: "THE BATHHOUSE LOOKOUT",
    say: [["livia", "Four bathers were here when the Sandbots came. One of them is Doctor Hourglass's lookout!"], ["pip", "Read the clues, Rory."]] },
  // ---------------------------------------------------------------- The Viking Fjord
  vik4: { p: "order", lv: 2, title: "THE LOFT CHEST",
    say: [["sigrid", "There's a chest in the loft with a number lock."], ["pip", "Put the numbers in order, Rory."]] },
  vik5: { p: "story", lv: 2, things: "stitches", boxes: "sail pieces", title: "MENDING THE SAIL",
    say: [["sigrid", "We have to sew the sail back together. How many stitches? Work it out, Rory."]] },
};
