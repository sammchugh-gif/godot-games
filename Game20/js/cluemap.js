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

export const CLUES = {
  // ---------------------------------------------------------------- POLARIS HQ
  hq4: { p: "pairs", lv: 1, title: "PIP'S MEMORY TEST",
    say: [["pip", "One last test. A spy has to remember things. Here are some cards, face down."], ["pip", "Turn them over two at a time, Rory. Find each sum and its answer."]],
    after: [["bolt", "You remembered all of them. I remember nothing. I have to write it down."]] },
  // ---------------------------------------------------------------- Tokyo
  tok1: { p: "sort", lv: 1, title: "THE HACKED ARCADE",
    say: [["yuki", "Look at the arcade screen! The Floaters hacked it. It's full of Floaters with numbers!"], ["pip", "It's a lock. Tap every Floater the screen asks for, and it switches off."]],
    after: [["yuki", "The screen's back to normal. Game over, Floaters!"]] },
  tok2: { p: "powercells", lv: 1, what: "The vending machine", title: "THE LAST MACHINE",
    say: [["yuki", "That machine is still on the ground, but its power's gone. Power it up and it gives you a secret message!"], ["pip", "Exactly the right power, Rory. Too much and it pops."]],
    after: [["bolt", "A drink, and a note. It says: look at the big screens."]] },
  tok3: { p: "suspect", lv: 1, title: "THE PARK HELPER",
    say: [["yuki", "Someone in the park is helping the Floaters. I saw them hand over a leech!"], ["pip", "Read the clues, Rory. Who's the spy?"]],
    after: [["rory", "Caught you. Now, who do you work for?"]] },
  tok4: { p: "cipher", lv: 1, word: "EGYPT", title: "THE MACHINE LABEL",
    say: [["bolt", "The machine on the top has a label on the bottom. It is in number code."], ["pip", "A is 1, B is 2. Crack it, Rory!"]] },
  // ---------------------------------------------------------------- Giza
  egy1: { p: "goldbars", lv: 1, title: "THE CRATE OF GOLD",
    say: [["rory", "This crate's full of gold bars. Zero's been collecting his payments already."], ["pip", "Count them, Rory. Stacks of bars: times tables."]],
    after: [["amira", "All that gold. And it's stamped with a Floater."]] },
  egy2: { p: "balance", lv: 1, title: "THE CAPSTONE",
    say: [["amira", "The capstone has to weigh just right, or it floats off again. Grandad's old balance will tell us."], ["pip", "Work out what the box weighs, Rory."]],
    after: [["amira", "Perfect balance. It'll stay put now."]] },
  egy3: { p: "map", lv: 1, title: "GRANDAD'S TOMB MAP",
    say: [["amira", "The tomb has lots of rooms. My grandad's map shows which one is the workshop."], ["pip", "Follow the steps to the workshop, Rory."]] },
  // ---------------------------------------------------------------- Sydney
  syd1: { p: "share", lv: 1, things: "surfboards", boxes: "lifeguard huts", title: "BACK TO THE HUTS",
    say: [["jack", "We saved the surfboards! They go back in the lifeguard huts, the same number in each."], ["pip", "Share them out, Rory."]],
    after: [["jack", "Spot on. Every hut's got its boards back."]] },
  syd2: { p: "cipher", lv: 2, word: "RIO", title: "THE CELL LABELS",
    say: [["rory", "These cells have labels on them. In number code."], ["pip", "Crack it, Rory. Where are they going?"]] },
  syd3: { p: "countdown", lv: 1, title: "THE SHIP'S COUNTDOWN",
    say: [["jack", "The Floater under the bridge had a countdown on it. There's a ship leaving when it ends!"], ["pip", "What comes next in the countdown, Rory?"]],
    after: [["jack", "We've got time to look in Zero's warehouse first."]] },
  syd4: { p: "powercells", lv: 2, what: "The silver case", title: "THE SILVER CASE",
    say: [["rory", "The silver case is locked, and its battery's flat."], ["pip", "Power it up with exactly the right cells, before the searchlights come back!"]] },
  // ---------------------------------------------------------------- Rio de Janeiro
  rio1: { p: "suspect", lv: 2, title: "THE DANCER WHO CAN'T SAMBA",
    say: [["lucas", "Four dancers by the float, and one of them is helping the Floaters. You can tell. They can't samba."], ["pip", "Read the clues, Rory. Which one is it?"]] },
  rio2: { p: "share", lv: 2, things: "gravity cells", boxes: "cable cars", title: "THE CABLE CARS",
    say: [["lucas", "The cells are going up the mountain, the same number in every cable car."], ["pip", "Share them out, Rory. How many in each car?"]] },
  // ---------------------------------------------------------------- New York
  ny1: { p: "sort", lv: 2, title: "FLOATERS IN THE TRAFFIC",
    say: [["marcus", "The hot dog man says some of those taxis aren't taxis. They're Floaters in disguise!"], ["pip", "Tap every Floater the rule asks for, Rory."]],
    after: [["marcus", "He says the real ones went up on the rooftops."]] },
  ny2: { p: "powercells", lv: 2, what: "The window cleaner's lift", title: "THE LIFT'S BATTERY",
    say: [["marcus", "The window cleaner's lift is stuck at the top. Its battery's flat!"], ["pip", "Exactly the right power, Rory, and we can ride it down."]] },
  // ---------------------------------------------------------------- The Savanna
  ken1: { p: "balance", lv: 2, title: "WEIGH THEM DOWN",
    say: [["wanjiru", "The ranger's balance! If it's level, the weights keep the animals on the ground."], ["pip", "Work out what the box weighs, Rory."]],
    after: [["wanjiru", "That's all of them. Nobody floated off."]] },
  ken3: { p: "sort", lv: 2, title: "THE LEECH CARRIERS",
    say: [["wanjiru", "Some of those Floaters are carrying gravity leeches. The ranger marked them."], ["pip", "Tap every one the rule asks for, Rory."]],
    after: [["wanjiru", "Mum says you'd make a very good ranger."]] },
  // ---------------------------------------------------------------- The Great Wall
  chn1: { p: "countdown", lv: 2, title: "THE GONG'S COUNTDOWN",
    say: [["mei", "The temple gong is ringing a countdown! When it gets to the end, the wall floats off."], ["pip", "What comes next, Rory? Quickly!"]] },
  chn3: { p: "pairs", lv: 2, title: "SCRAMBLE THE SIGNAL",
    say: [["bolt", "The relay's signal is made of sums and answers. If we match them all, it scrambles."], ["pip", "Turn the cards over, Rory. Find the pairs."]] },
  chn4: { p: "cipher", lv: 2, word: "INDIA", title: "THE RELAY ORDERS",
    say: [["rory", "The relay is printing out orders. In number code."], ["pip", "Crack it, Rory. Where are the orders going?"]] },
  // ---------------------------------------------------------------- The Taj Mahal
  ind1: { p: "suspect", lv: 2, title: "THE GARDENER",
    say: [["arjun", "Four gardeners, and one of them keeps looking at the hatch. That's Zero's spy!"], ["pip", "Use the clues, Rory."]] },
  ind2: { p: "balance", lv: 2, title: "THE FOUNTAIN STONES",
    say: [["arjun", "The fountain stones have to balance, or the water won't flow."], ["pip", "Work out what the box weighs, Rory."]] },
  ind4: { p: "map", lv: 2, title: "WHERE THE SIGNALS WENT",
    say: [["arjun", "The signals were going out to sea. Here's a map of where they went."], ["pip", "Follow the steps, Rory. Where's Zero's island?"]] },
  // ---------------------------------------------------------------- Zero's Island
  isl2: { p: "lever", lv: 2, title: "THE SILO LEVER",
    say: [["pip", "The silo codes are behind a gravity lever. It opens when you say which side is heavier."], ["pip", "Work out both sides, Rory."]] },
  // ---------------------------------------------------------------- POLARIS Launch Base
  lb2: { p: "stages", lv: 2, title: "STACK THE ROCKET",
    say: [["hale", "The rocket's stages were knocked off the gantry. They go back in number order, Agent."]],
    after: [["hale", "Rocket stacked. You're a natural."]] },
  lb3: { p: "countdown", lv: 2, title: "THE LAUNCH COUNTDOWN",
    say: [["hale", "The countdown's started, but the Floaters scrambled the numbers. What comes next, Agent?"]],
    after: [["hale", "Countdown fixed. Now, that buggy."]] },
  // ---------------------------------------------------------------- The Pump Station
  sta3: { p: "goldbars", lv: 2, title: "ZERO'S GOLD",
    say: [["bolt", "The Floaters were carrying gold bars! Zero's payments. They are floating everywhere."], ["pip", "How many bars, Rory? Stacks, so it's times tables."]],
    after: [["bolt", "I will write it in my report. I will add a smiley face."]] },
  sta4: { p: "lever", lv: 3, title: "THE AIRLOCK LEVER",
    say: [["pip", "The airlock has a gravity lever lock. Say which side is heavier, three times, and it opens."]] },
  sta5: { p: "pairs", lv: 3, title: "THE CARGO LABELS",
    say: [["hale", "The cargo labels got mixed up when they floated. Each sum goes with its answer."], ["pip", "Match the pairs, Rory."]],
    after: [["hale", "That matches. Nothing lost."]] },
  sta7: { p: "cipher", lv: 3, word: "MOON", title: "THE PUMP MESSAGE",
    say: [["bolt", "The scan found a message painted on the Pump. It is in symbols."], ["pip", "Use the key, Rory. Where's the battery?"]] },
  sta8: { p: "suspect", lv: 3, title: "ZERO'S MAN ON BOARD",
    say: [["pip", "Zero has a spy in the station crew. He's got the codes for the console."], ["pip", "Read the clues, Rory. Some of them say NOT."]] },
  // ---------------------------------------------------------------- The Moon
  moon1: { p: "map", lv: 3, title: "THE CRATER MAP",
    say: [["hale", "Here's the crater map. The battery is in one of these craters."], ["pip", "Follow the steps, Rory."]],
    after: [["hale", "That's the one. Right next to his base."]] },
  moon2: { p: "share", lv: 3, things: "gravity cells", boxes: "battery slots", title: "EMPTY THE BATTERY",
    say: [["pip", "The battery's slots each hold the same number of cells. How many in each? Then we know how to drain it."]] },
  moon3: { p: "stages", lv: 3, what: "signal tower blocks", title: "THE SIGNAL TOWER",
    say: [["hale", "The tower blocks are numbered. They have to go in order, or the radio won't reach Earth."]] },
  moon4: { p: "goldbars", lv: 3, title: "THE GOLD ON THE MOON",
    say: [["hale", "Zero's gold bars are bouncing all over the crater! How many has he got up here?"], ["pip", "Stacks of bars, Rory. Times tables."]] },
};
