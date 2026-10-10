// Everything the game knows about: the places, what grows there, what can be
// cooked from it, the wands, the vehicles and the upgrades.

// lat/lon put the place on the globe for the flight. price is the ticket
// that opens it for good; "cost" is what its ingredients cost at its market.
// The places open in this order, and a place nobody has a ticket for is
// never shown: the ticket office only sells "somewhere new".
export const PLACES = [
  { id: "home",   name: "Home Farm",      land: "England",          lat: 52,   lon: -1.5,   price: 0,   cost: 2, store: "Granny's Cafe",
    sky: [0x6fb8ff, 0xd8f0ff], ground: 0x7cc35a, items: ["apple", "egg", "milk", "wheat", "carrot", "strawberry", "twig"] },
  { id: "italy",  name: "Italy",          land: "Europe",           lat: 42,   lon: 12.5,   price: 25,  cost: 3, store: "Pizza Palace",
    sky: [0x7ab8f0, 0xffe6c0], ground: 0xc9b77a, items: ["tomato", "cheese", "olive", "basil"] },
  { id: "mexico", name: "Mexico",         land: "North America",    lat: 20.5, lon: -99,    price: 40,  cost: 3, store: "Taco Town",
    sky: [0x5aa8f0, 0xffd9a0], ground: 0xd9a35e, items: ["corn", "chili", "avocado", "cactus"] },
  { id: "jungle", name: "Amazon Jungle",  land: "Brazil",           lat: -3,   lon: -60,    price: 60,  cost: 4, store: "Monkey Juice Bar",
    sky: [0x6ac0d8, 0xd8f5d0], ground: 0x3f9a4c, items: ["banana", "cocoa", "coconut", "feather"] },
  { id: "japan",  name: "Japan",          land: "Asia",             lat: 35.5, lon: 138.5,  price: 80,  cost: 4, store: "Sakura Sushi",
    sky: [0x8ab0f0, 0xffd8e8], ground: 0x8fbf72, items: ["rice", "fish", "blossom", "tea"] },
  { id: "arctic", name: "North Pole",     land: "the Arctic",       lat: 84,   lon: 10,     price: 100, cost: 5, store: "Penguin Ice Cream",
    sky: [0x9ac8f0, 0xf0f8ff], ground: 0xeef6fb, items: ["ice", "snowflake", "blueberry"] },
  { id: "desert", name: "Egypt",          land: "Africa",           lat: 29.5, lon: 31,     price: 120, cost: 5, store: "Pharaoh's Sweets",
    sky: [0x5aa0e8, 0xffe8b0], ground: 0xe6c47a, items: ["honey", "sand", "lemon"] },
  { id: "forest", name: "Magic Forest",   land: "Canada",           lat: 56,   lon: -112,   price: 150, cost: 6, store: "Wizard's Potion Shop",
    sky: [0x3a3a7a, 0xa890d8], ground: 0x2f6e4a, items: ["mushroom", "clover", "moonflower", "star"] },
  { id: "volcano", name: "Volcano Island", land: "Hawaii",          lat: 19.5, lon: -155.5, price: 200, cost: 7, store: "Dragon Diner",
    sky: [0x6a5a8a, 0xffb080], ground: 0x5a3a30, items: ["ember", "crystal", "pineapple"] },
];
export const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));

export const ING = {
  apple: "Apple", egg: "Egg", milk: "Milk", wheat: "Wheat", carrot: "Carrot", strawberry: "Strawberry", twig: "Magic Twig",
  tomato: "Tomato", cheese: "Cheese", olive: "Olives", basil: "Basil",
  corn: "Corn", chili: "Chili", avocado: "Avocado", cactus: "Cactus",
  banana: "Banana", cocoa: "Cocoa Pod", coconut: "Coconut", feather: "Parrot Feather",
  rice: "Rice", fish: "Fish", blossom: "Cherry Blossom", tea: "Green Tea",
  ice: "Ice", snowflake: "Magic Snowflake", blueberry: "Blueberries",
  honey: "Honey", sand: "Golden Sand", lemon: "Lemon",
  mushroom: "Mushroom", clover: "Lucky Clover", moonflower: "Moonflower", star: "Star Dust",
  ember: "Fire Ember", crystal: "Crystal", pineapple: "Pineapple",
};
export const ING_PLACE = {};
PLACES.forEach(p => p.items.forEach(i => { ING_PLACE[i] = p.id; }));
export const ingCost = i => PLACE[ING_PLACE[i]].cost;

// Cooked in the cauldron. A potion has a colour; "drink" ones do something
// when drunk out exploring.
export const RECIPES = [
  { id: "shake",    name: "Strawberry Milkshake", need: ["strawberry", "milk"] },
  { id: "pancakes", name: "Pancakes",             need: ["egg", "milk", "wheat"] },
  { id: "applepie", name: "Apple Pie",            need: ["apple", "wheat", "egg"] },
  { id: "carrotcake", name: "Carrot Cake",        need: ["carrot", "wheat", "egg"] },
  { id: "pizza",    name: "Pizza",                need: ["wheat", "tomato", "cheese"] },
  { id: "pasta",    name: "Spaghetti",            need: ["wheat", "tomato", "basil"] },
  { id: "salad",    name: "Salad",                need: ["tomato", "olive", "carrot"] },
  { id: "tacos",    name: "Tacos",                need: ["corn", "chili", "avocado"] },
  { id: "popcorn",  name: "Popcorn",              need: ["corn", "corn"] },
  { id: "speed",    name: "Speed Potion",         need: ["chili", "cactus"], potion: 0xff3b30, drink: "speed" },
  { id: "choccake", name: "Chocolate Cake",       need: ["cocoa", "egg", "wheat"] },
  { id: "hotchoc",  name: "Hot Chocolate",        need: ["cocoa", "milk"] },
  { id: "smoothie", name: "Tropical Smoothie",    need: ["banana", "coconut", "milk"] },
  { id: "flying",   name: "Flying Potion",        need: ["feather", "blossom"], potion: 0xff7ad0, drink: "fly" },
  { id: "sushi",    name: "Sushi",                need: ["rice", "fish"] },
  { id: "riceball", name: "Rice Ball",            need: ["rice", "rice"] },
  { id: "dango",    name: "Dango",                need: ["rice", "blossom", "strawberry"] },
  { id: "icecream", name: "Ice Cream",            need: ["ice", "milk", "strawberry"] },
  { id: "muffin",   name: "Blueberry Muffin",     need: ["blueberry", "wheat", "egg"] },
  { id: "frost",    name: "Frost Potion",         need: ["ice", "snowflake", "blueberry"], potion: 0x6fd8ff },
  { id: "lemonade", name: "Lemonade",             need: ["lemon", "honey", "ice"] },
  { id: "cookies",  name: "Honey Cookies",        need: ["honey", "wheat", "cocoa"] },
  { id: "luck",     name: "Luck Potion",          need: ["clover", "sand"], potion: 0xffd23f, drink: "luck" },
  { id: "giant",    name: "Giant Potion",         need: ["mushroom", "carrot", "clover"], potion: 0x4fd35a },
  { id: "dream",    name: "Dream Potion",         need: ["moonflower", "tea", "honey"], potion: 0x9b6bff },
  { id: "invisible", name: "Invisible Potion",    need: ["moonflower", "snowflake"], potion: 0xe8f4ff },
  { id: "curry",    name: "Fire Curry",           need: ["rice", "chili", "ember"] },
  { id: "sundae",   name: "Pineapple Sundae",     need: ["pineapple", "ice", "coconut"] },
  { id: "dragon",   name: "Dragon Fire Potion",   need: ["ember", "ember", "chili"], potion: 0xff8a1f },
  { id: "rainbow",  name: "Rainbow Potion",       need: ["crystal", "blossom", "strawberry"], potion: "rainbow" },
  { id: "golden",   name: "Golden Potion",        need: ["sand", "crystal", "star"], potion: 0xf6c400 },
];

// Made at the wand bench. "dmg" is how hard it zaps the boss; "field" ones do
// something special out exploring as well.
export const WANDS = [
  { id: "bubble", name: "Bubble Wand", need: ["twig", "milk"],            color: 0x7fd8ff, dmg: 1, what: "Blows bubbles that grab things" },
  { id: "spark",  name: "Spark Wand",  need: ["twig", "chili"],           color: 0xff6a2b, dmg: 2, what: "Shoots hot sparks" },
  { id: "frost",  name: "Frost Wand",  need: ["twig", "snowflake"],       color: 0xbff0ff, dmg: 2, what: "Freezes whatever it hits", slow: true },
  { id: "grow",   name: "Grow Wand",   need: ["twig", "clover"],          color: 0x5fd35a, dmg: 1, what: "Makes ingredients pop up", field: "grow" },
  { id: "gold",   name: "Golden Wand", need: ["twig", "sand"],            color: 0xffd23f, dmg: 1, what: "Pulls everything to you", field: "pull" },
  { id: "star",   name: "Star Wand",   need: ["twig", "star", "crystal"], color: 0xfff27a, dmg: 4, what: "The strongest zap of all" },
];

export const REC = {};
for (const r of RECIPES) { r.kind = r.potion !== undefined ? "potion" : "food"; REC[r.id] = r; }
for (const w of WANDS) { w.kind = "wand"; w.id = "wand_" + w.id; REC[w.id] = w; }
for (const r of [...RECIPES, ...WANDS]) {
  r.key = r.need.slice().sort().join("+");
  r.price = Math.round(r.need.reduce((a, i) => a + ingCost(i), 0) * (r.kind === "food" ? 1.6 : 2.2) + 4);
}
export const ALL = [...RECIPES, ...WANDS];
// the recipes everyone starts out knowing
export const STARTERS = ["shake", "pancakes"];

export const DRINK = { speed: "Run twice as fast", fly: "Fly and grab everything near you", luck: "Coins everywhere, worth double" };

export const VEHICLES = [
  { id: "plane",   name: "Little Plane",    cost: 0,   time: 4.5 },
  { id: "balloon", name: "Hot-Air Balloon", cost: 60,  time: 6 },
  { id: "heli",    name: "Helicopter",      cost: 100, time: 4 },
  { id: "jet",     name: "Jet",             cost: 160, time: 3 },
  { id: "rocket",  name: "Rocket",          cost: 250, time: 2.4 },
];

export const UPGRADES = [
  { id: "shoes",  name: "Faster Shoes", what: "Walk faster",              cost: [30, 80, 160] },
  { id: "magnet", name: "Coin Magnet",  what: "Grab things from further", cost: [40, 90, 170] },
  { id: "basket", name: "Lucky Basket", what: "Sometimes pick up two",    cost: [50, 110, 200] },
];

export const BOSS = { name: "The Mighty Meatball", place: "italy", hp: 30, ordersFirst: 5 };
