// Everything the game knows about: the levels, the food each one has, the
// little food enemies and the boss at the end of each, the recipes, the
// potions and wands, and the vehicles.
//
// Ingredients are only ever food, plus five magic things the bosses drop
// for potions: a crystal, a fire ember, star dust, a magic snowflake and a
// moonflower. All five together make the Grand Concoction, which opens the
// way to the last boss.

// Level 0 is home, with the only kitchen in the world. Levels 1 to 5 each
// end with a boss; beating it opens the next. Level 6 is the last boss, and
// opens when the Grand Concoction is drunk.
// sky: top, horizon, sun colour, sun height (0 low .. 1 high); ground: texture
export const LEVELS = [
  { id: "home", n: 0, name: "Home Farm", land: "England", lat: 52, lon: -1.5,
    sky: [0x5aa8f0, 0xcfe8ff, 0xfff4d8, 0.8], ground: "grass", items: ["apple", "egg", "milk", "wheat", "strawberry", "carrot", "honey"] },
  { id: "italy", n: 1, name: "Italy", land: "Europe", lat: 43.7, lon: 10.4,
    sky: [0x6aa0e0, 0xffd8a8, 0xffc070, 0.35], ground: "paving", items: ["tomato", "cheese", "basil", "olive", "lemon"],
    mini: { id: "tomato", name: "Tomato Troublemakers", n: 4, hp: 3 }, boss: { id: "meatball", name: "The Mighty Meatball", hp: 24 }, magic: "crystal" },
  { id: "mexico", n: 2, name: "Mexico", land: "North America", lat: 20.7, lon: -88.6,
    sky: [0x3a8ae8, 0xffe0b0, 0xffffff, 0.9], ground: "sand", items: ["corn", "chili", "avocado", "cocoa"],
    mini: { id: "chilimini", name: "Hot Chili Hoppers", n: 4, hp: 4 }, boss: { id: "taco", name: "The Taco Titan", hp: 30 }, magic: "ember" },
  { id: "japan", n: 3, name: "Japan", land: "Asia", lat: 35, lon: 135.8,
    sky: [0x8a7ab8, 0xffb88a, 0xff9a5a, 0.12], ground: "cobble", items: ["rice", "fish", "blossom", "tea"],
    mini: { id: "ninja", name: "Rice Ball Ninjas", n: 5, hp: 4 }, boss: { id: "sushi", name: "The Sushi Shogun", hp: 36 }, magic: "star" },
  { id: "arctic", n: 4, name: "North Pole", land: "the Arctic", lat: 84, lon: 10,
    sky: [0x0a1838, 0x2a6a7a, 0xc8e8ff, 0.5], ground: "snow", items: ["ice", "blueberry", "salmon"],
    mini: { id: "scoop", name: "Snowball Scoops", n: 5, hp: 5 }, boss: { id: "sundae", name: "The Abominable Sundae", hp: 42 }, magic: "snowflake", night: true },
  { id: "volcano", n: 5, name: "Volcano Island", land: "Hawaii", lat: 19.5, lon: -155.5,
    sky: [0x5a4a8a, 0xffa070, 0xff7040, 0.15], ground: "sand", items: ["pineapple", "coconut", "banana"],
    mini: { id: "puncher", name: "Pineapple Punchers", n: 5, hp: 5 }, boss: { id: "dragon", name: "The Chili Dragon", hp: 50 }, magic: "moonflower" },
  { id: "fortress", n: 6, name: "Burger Fortress", land: "the middle of the Pacific", lat: 5, lon: -140,
    sky: [0x2a0a2a, 0xe8503a, 0xffb040, 0.08], ground: "stone", items: ["tomato", "cheese", "wheat"],
    mini: { id: "fry", name: "Fry Guys", n: 6, hp: 5 }, boss: { id: "burger", name: "King Burgerbeard", hp: 70 }, final: true },
];
export const LEVEL = Object.fromEntries(LEVELS.map(l => [l.id, l]));

export const ING = {
  apple: "Apple", egg: "Egg", milk: "Milk", wheat: "Wheat", strawberry: "Strawberry", carrot: "Carrot", honey: "Honey",
  tomato: "Tomato", cheese: "Cheese", basil: "Basil", olive: "Olives", lemon: "Lemon",
  corn: "Corn", chili: "Chili", avocado: "Avocado", cocoa: "Cocoa Pod",
  rice: "Rice", fish: "Fish", blossom: "Cherry Blossom", tea: "Green Tea",
  ice: "Ice", blueberry: "Blueberries", salmon: "Salmon",
  pineapple: "Pineapple", coconut: "Coconut", banana: "Banana",
  crystal: "Magic Crystal", ember: "Fire Ember", star: "Star Dust", snowflake: "Magic Snowflake", moonflower: "Moonflower",
};
export const MAGIC = ["crystal", "ember", "star", "snowflake", "moonflower"];
export const ING_LEVEL = {};
for (const l of LEVELS) if (!l.final) l.items.forEach(i => { ING_LEVEL[i] = l.id; });
LEVELS.forEach(l => { if (l.magic) ING_LEVEL[l.magic] = l.id; });

// Cooked in the cauldron. A potion has a colour; "drink" ones help out
// exploring and fighting. The Grand Concoction takes five things.
export const RECIPES = [
  { id: "shake",    name: "Strawberry Milkshake", need: ["strawberry", "milk"] },
  { id: "pancakes", name: "Pancakes",             need: ["egg", "milk", "wheat"] },
  { id: "applepie", name: "Apple Pie",            need: ["apple", "wheat", "egg"] },
  { id: "carrotcake", name: "Carrot Cake",        need: ["carrot", "wheat", "egg"] },
  { id: "pizza",    name: "Pizza",                need: ["wheat", "tomato", "cheese"] },
  { id: "pasta",    name: "Spaghetti",            need: ["wheat", "tomato", "basil"] },
  { id: "salad",    name: "Salad",                need: ["tomato", "olive", "carrot"] },
  { id: "lemonade", name: "Lemonade",             need: ["lemon", "honey"] },
  { id: "tacos",    name: "Tacos",                need: ["corn", "chili", "avocado"] },
  { id: "popcorn",  name: "Popcorn",              need: ["corn", "corn"] },
  { id: "choccake", name: "Chocolate Cake",       need: ["cocoa", "egg", "wheat"] },
  { id: "hotchoc",  name: "Hot Chocolate",        need: ["cocoa", "milk"] },
  { id: "cookies",  name: "Honey Cookies",        need: ["honey", "wheat", "cocoa"] },
  { id: "sushi",    name: "Sushi",                need: ["rice", "fish"] },
  { id: "riceball", name: "Rice Ball",            need: ["rice", "rice"] },
  { id: "dango",    name: "Dango",                need: ["rice", "blossom", "strawberry"] },
  { id: "icecream", name: "Ice Cream",            need: ["ice", "milk", "strawberry"] },
  { id: "muffin",   name: "Blueberry Muffin",     need: ["blueberry", "wheat", "egg"] },
  { id: "salmonrice", name: "Salmon Rice Bowl",   need: ["salmon", "rice"] },
  { id: "smoothie", name: "Tropical Smoothie",    need: ["banana", "coconut", "milk"] },
  { id: "sundaedish", name: "Pineapple Sundae",   need: ["pineapple", "ice", "coconut"] },
  { id: "speed",    name: "Speed Potion",         need: ["ember", "chili"], potion: 0xff3b30, drink: "speed" },
  { id: "power",    name: "Power Potion",         need: ["crystal", "tomato"], potion: 0xff7ad0, drink: "power" },
  { id: "heal",     name: "Healing Potion",       need: ["crystal", "strawberry"], potion: 0x5fd35a, drink: "heal" },
  { id: "shield",   name: "Shield Potion",        need: ["snowflake", "blueberry"], potion: 0x6fd8ff, drink: "shield" },
  { id: "jump",     name: "Super Jump Potion",    need: ["star", "honey"], potion: 0xffd23f, drink: "jump" },
  { id: "dream",    name: "Dream Potion",         need: ["moonflower", "tea", "honey"], potion: 0x9b6bff },
  { id: "rainbow",  name: "Rainbow Potion",       need: ["crystal", "star", "blossom"], potion: "rainbow" },
  { id: "grand",    name: "The Grand Concoction", need: ["crystal", "ember", "star", "snowflake", "moonflower"], potion: "rainbow", grand: true },
];

// Made at the wand bench from magic things. You start with the Bubble Wand.
export const WANDS = [
  { id: "bubble", name: "Bubble Wand",  need: [],                              color: 0x7fd8ff, dmg: 1, what: "Blows hard bubbles" },
  { id: "ruby",   name: "Ruby Wand",    need: ["crystal"],                     color: 0xff3a5a, dmg: 2, what: "Twice as strong" },
  { id: "fire",   name: "Fire Wand",    need: ["ember", "crystal"],            color: 0xff8a1f, dmg: 3, what: "Shoots fireballs" },
  { id: "frost",  name: "Frost Wand",   need: ["snowflake", "crystal"],        color: 0xbff0ff, dmg: 2, what: "Freezes what it hits", slow: true },
  { id: "starw",  name: "Star Wand",    need: ["star", "crystal"],             color: 0xfff27a, dmg: 2, what: "Shoots three stars at once", spread: true },
  { id: "rainbw", name: "Rainbow Wand", need: ["moonflower", "star", "ember"], color: 0xff7ad0, dmg: 5, what: "The strongest wand of all" },
];

export const REC = {};
for (const r of RECIPES) { r.kind = r.potion !== undefined ? "potion" : "food"; REC[r.id] = r; }
for (const w of WANDS) { w.kind = "wand"; w.id = "wand_" + w.id; REC[w.id] = w; }
for (const r of [...RECIPES, ...WANDS]) r.key = r.need.slice().sort().join("+");
// stars an order earns
export const orderStars = (r, q) => q * (r.kind === "potion" ? 2 : 1) + (r.need.length > 2 ? 1 : 0);

export const DRINK = { speed: "Run twice as fast", power: "Zaps do double damage", heal: "Hearts back to full", shield: "Nothing can hurt you", jump: "Jump really high" };

// Stars from orders unlock better vehicles.
export const VEHICLES = [
  { id: "plane",   name: "Little Plane",    stars: 0,  time: 4.5 },
  { id: "balloon", name: "Hot-Air Balloon", stars: 3,  time: 6 },
  { id: "heli",    name: "Helicopter",      stars: 6,  time: 4 },
  { id: "jet",     name: "Jet",             stars: 10, time: 3 },
  { id: "rocket",  name: "Rocket",          stars: 15, time: 2.4 },
];
