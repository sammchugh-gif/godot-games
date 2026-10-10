// Everything the game knows about: the levels, the food each one has, the
// little food enemies and the boss at the end of each, the recipes, the
// potions and wands, and the vehicles.
//
// Ingredients are only ever food, plus five magic things the bosses drop
// for potions: a crystal, a fire ember, star dust, a magic snowflake and a
// moonflower. All five together make the Grand Concoction which, once the
// thirtieth boss is beaten, opens the way to the last boss of all.

// Level 0 is home, with the only kitchen in the world. Levels 1 to 30 each
// end with a boss; beating it opens the next. Level 31 is the last boss.
// sky: top, horizon, sun colour, sun height (0 low .. 1 high); ground: a texture.
// boss.attacks are what the boss does (see main.js); size is how big it is.
// store: the shop there, which orders the food that comes from there.
// scene (levels 6 to 30): how the place is built, in places.js.
const L = (n, id, name, land, lat, lon, sky, ground, items, mini, boss, store, scene, more = {}) =>
  ({ n, id, name, land, lat, lon, sky, ground, items, mini: { n: Math.min(6, 4 + Math.floor(n / 6)), hp: Math.min(9, 3 + Math.floor(n / 3)), ...mini },
    boss: { hp: Math.round(24 + (n - 1) * 3.2), size: 2.2, ...boss }, store, scene, ...more });

export const LEVELS = [
  { id: "home", n: 0, name: "Home Farm", land: "England", lat: 52, lon: -1.5, store: "Granny's Cafe",
    sky: [0x5aa8f0, 0xcfe8ff, 0xfff4d8, 0.8], ground: "grass", items: ["apple", "egg", "milk", "wheat", "strawberry", "carrot", "honey"] },
  L(1, "italy", "Italy", "Europe", 43.7, 10.4, [0x6aa0e0, 0xffd8a8, 0xffc070, 0.35], "paving", ["tomato", "cheese", "basil", "olive", "lemon"],
    { id: "tomato", name: "Tomato Troublemakers" }, { id: "meatball", name: "The Mighty Meatball", attacks: ["charge", "lob"], size: 2.6, tip: "He rolls at you, and throws sauce where the red rings are. Keep zapping!" }, "Pizza Palace"),
  L(2, "mexico", "Mexico", "North America", 20.7, -88.6, [0x3a8ae8, 0xffe0b0, 0xffffff, 0.9], "sand", ["corn", "chili", "avocado", "cocoa"],
    { id: "chilimini", name: "Hot Chili Hoppers" }, { id: "taco", name: "The Taco Titan", attacks: ["stomp", "volley"], tip: "When he stomps, a ring rolls across the ground: JUMP over it! Watch for his chili peppers." }, "Taco Town"),
  L(3, "japan", "Japan", "Asia", 35, 135.8, [0x8a7ab8, 0xffb88a, 0xff9a5a, 0.12], "cobble", ["rice", "fish", "blossom", "tea"],
    { id: "ninja", name: "Rice Ball Ninjas" }, { id: "sushi", name: "The Sushi Shogun", attacks: ["spin", "lob"], tip: "He spins round fast, then throws rice balls. Keep away when he spins, and zap him when he stops." }, "Sakura Sushi"),
  L(4, "arctic", "North Pole", "the Arctic", 84, 10, [0x0a1838, 0x2a6a7a, 0xc8e8ff, 0.5], "snow", ["ice", "blueberry", "salmon"],
    { id: "scoop", name: "Snowball Scoops" }, { id: "sundae", name: "The Abominable Sundae", attacks: ["volley", "charge", "summon"], size: 1.8, tip: "He throws snowballs and slides at you. He sends Snowball Scoops too: zap them first!" }, "Penguin Ice Cream", null, { night: true }),
  L(5, "volcano", "Volcano Island", "Hawaii", 19.5, -155.5, [0x5a4a8a, 0xffa070, 0xff7040, 0.15], "sand", ["pineapple", "coconut", "banana"],
    { id: "puncher", name: "Pineapple Punchers" }, { id: "dragon", name: "The Chili Dragon", attacks: ["breath", "volley", "stomp"], tip: "His fire breath goes where the red glow is. Run round the side of him and zap!" }, "Tiki Smoothie Bar"),

  L(6, "france", "France", "Paris", 48.86, 2.35, [0x6aa8e8, 0xe8eef8, 0xfff4e0, 0.6], "paving", ["butter", "grape"],
    { id: "croissantmini", name: "Croissant Crawlers" }, { id: "count", name: "Count Croissant", attacks: ["charge", "volley"], tip: "He rolls about like a croissant and flicks butter. Dodge sideways and zap!" }, "Le Petit Bistro",
    { style: "gable", walls: [[236, 228, 210], [220, 214, 200], [232, 220, 196]], roof: [110, 120, 140], trees: "tree", landmark: "eiffel", lamps: true }),
  L(7, "usa", "USA", "New York", 40.7, -74, [0x5a98e0, 0xd8e8f8, 0xfff8e8, 0.65], "asphalt", ["beef", "pickle"],
    { id: "hotdog", name: "Hot Dog Hooligans" }, { id: "donut", name: "The Donut Destroyer", attacks: ["charge", "lob", "stomp"], tip: "He rolls like a wheel and stomps. Jump the rings and keep zapping!" }, "Big Apple Diner",
    { style: "tall", walls: [[170, 80, 60], [190, 170, 150], [140, 70, 56], [200, 190, 176]], trees: "tree", landmark: "liberty", water: true, lamps: true }),
  L(8, "india", "India", "Agra", 27.17, 78.04, [0x6ab0e0, 0xffe0b0, 0xfff0c0, 0.5], "sand", ["mango", "lentil"],
    { id: "samosa", name: "Samosa Scamps" }, { id: "currypot", name: "The Great Curry Pot", attacks: ["lob", "breath", "summon"], tip: "Hot curry splashes where the rings are, and steam blows where it glows red. Keep moving!" }, "Taj Spice Kitchen",
    { style: "flat", walls: [[240, 170, 180], [250, 210, 120], [140, 200, 210], [240, 150, 90]], trees: "palm", landmark: "taj", flags: [0xff8a1f, 0xffd23f, 0xff3a8a] }),
  L(9, "china", "China", "the Great Wall", 40.4, 116.6, [0x8a7ab8, 0xffc090, 0xffa060, 0.2], "cobble", ["noodles", "bokchoy"],
    { id: "dumpling", name: "Dumpling Dodgers" }, { id: "fortune", name: "The Fortune Cookie Emperor", attacks: ["spin", "volley"], tip: "He spins, then throws fortunes at you. Zap him while he's dizzy!" }, "Golden Dragon Noodles",
    { style: "wood", trees: "cherry", landmark: "greatwall", lanterns: [0xff3a3a] }),
  L(10, "australia", "Australia", "Sydney", -33.86, 151.2, [0x3a90e8, 0xd8f0ff, 0xffffff, 0.85], "paving", ["kiwi", "macadamia"],
    { id: "kiwimini", name: "Kiwi Kickers" }, { id: "meatpie", name: "The Meat Pie Monster", attacks: ["charge", "stomp"], tip: "He charges and stomps. Jump the rings, then zap him when he stops." }, "Harbour Pie Shop",
    { style: "gable", walls: [[226, 196, 150], [236, 226, 206], [210, 170, 130]], roof: [170, 70, 50], trees: "palm", landmark: "opera", water: true, lamps: true }),
  L(11, "brazil", "Brazil", "Rio de Janeiro", -22.95, -43.2, [0x3a98e8, 0xe0f4ff, 0xffffff, 0.8], "sand", ["acai", "orange"],
    { id: "brigadeiro", name: "Brigadeiro Bouncers" }, { id: "carnival", name: "The Carnival Cake", attacks: ["spin", "lob", "summon"], tip: "She dances round in circles and throws icing. Zap her when she stops!" }, "Copacabana Juice Bar",
    { style: "flat", walls: [[250, 200, 60], [60, 180, 120], [240, 110, 90], [90, 160, 230]], trees: "palm", landmark: "christ", water: true, flags: [0x3ad06a, 0xffd23f, 0x3a8ae8] }),
  L(12, "egypt", "Egypt", "Giza", 29.98, 31.13, [0x5aa0e8, 0xffe8b0, 0xfff4d0, 0.6], "sand", ["date", "fig"],
    { id: "falafel", name: "Falafel Fiends" }, { id: "mummy", name: "The Mummy Melon", attacks: ["charge", "volley", "summon"], tip: "He shuffles at you and throws seeds. He wakes up Falafel Fiends too!" }, "Pharaoh's Sweets",
    { style: "flat", walls: [[226, 200, 150], [214, 186, 136], [236, 214, 170]], trees: "palm", landmark: "pyramids" }),
  L(13, "greece", "Greece", "Athens", 37.97, 23.72, [0x3a88e8, 0xe0f0ff, 0xffffff, 0.7], "paving", ["yogurt", "cucumber"],
    { id: "olivemini", name: "Olive Oddballs" }, { id: "gyro", name: "The Giant Gyro", attacks: ["spin", "volley"], tip: "He spins like a gyro and flings onions. Keep back when he spins!" }, "Acropolis Taverna",
    { style: "flat", walls: [[248, 248, 244], [244, 244, 240]], door: 0x2a6ad8, trees: "cypress", landmark: "parthenon", water: true }),
  L(14, "netherlands", "Netherlands", "Kinderdijk", 51.88, 4.64, [0x6aa0d8, 0xe0ecf4, 0xfff0d8, 0.5], "cobble", ["pear", "caramel"],
    { id: "cheesewheel", name: "Cheese Wheel Rollers" }, { id: "stroop", name: "The Stroopwafel Giant", attacks: ["charge", "stomp", "lob"], tip: "He rolls, stomps and drips caramel. Jump and dodge!" }, "Windmill Waffles",
    { style: "canal", walls: [[150, 70, 50], [120, 60, 46], [170, 90, 60], [90, 60, 50]], roof: [70, 60, 60], trees: "tree", landmark: "windmills", water: true }),
  L(15, "russia", "Russia", "Moscow", 55.75, 37.62, [0x7a90b8, 0xe8eef8, 0xffe8d0, 0.3], "snow", ["beetroot", "cabbage"],
    { id: "beet", name: "Beetroot Bruisers" }, { id: "matryoshka", name: "The Pancake Matryoshka", attacks: ["stomp", "summon", "volley"], tip: "She stomps and sends Beetroot Bruisers. Jump the rings!" }, "Red Square Blini",
    { style: "gable", walls: [[240, 220, 160], [200, 120, 110], [150, 190, 210]], roof: [70, 110, 80], trees: "pine", snow: true, landmark: "onion", lamps: true }),
  L(16, "peru", "Peru", "Machu Picchu", -13.16, -72.54, [0x5a98d8, 0xe0f0f0, 0xffffff, 0.7], "grass", ["potato", "quinoa"],
    { id: "potatomini", name: "Potato Peeps" }, { id: "bigpotato", name: "The Great Potato", attacks: ["charge", "lob"], tip: "He rolls downhill at you and throws little potatoes. Dodge!" }, "Andes Kitchen",
    { style: "stone", trees: "none", landmark: "machu", hills: 0x3a8a4a, tall: 2.4 }),
  L(17, "canada", "Canada", "the Rocky Mountains", 51.18, -115.57, [0x5a90d8, 0xdcecf4, 0xffffff, 0.6], "grass", ["maple", "blueberry"],
    { id: "syrup", name: "Syrup Slimes" }, { id: "moose", name: "The Moose Mousse", attacks: ["charge", "stomp", "summon"], tip: "He charges with his antlers and stomps. Jump the rings!" }, "Maple Leaf Cabin",
    { style: "cabin", trees: "pine", landmark: "rockies", water: true }),
  L(18, "kenya", "Kenya", "the Savanna", -1.3, 36.8, [0x5aa0e0, 0xffe8b8, 0xfff0c8, 0.5], "drygrass", ["plantain", "peanut"],
    { id: "plantainmini", name: "Plantain Pouncers" }, { id: "giraffe", name: "The Jelly Giraffe", attacks: ["stomp", "volley"], tip: "She wobbles and stomps, and spits jelly beans. Jump and dodge!" }, "Savanna Snack Shack",
    { style: "hut", trees: "baobab", landmark: "kilimanjaro" }),
  L(19, "thailand", "Thailand", "Bangkok", 13.75, 100.49, [0x7a8ac8, 0xffc8a0, 0xffb070, 0.25], "paving", ["lime", "shrimp"],
    { id: "springroll", name: "Spring Roll Rascals" }, { id: "tomyum", name: "The Tom Yum Turtle", attacks: ["spin", "lob", "breath"], tip: "He spins in his shell, splashes soup and breathes hot steam!" }, "Floating Market Noodles",
    { style: "wood", trees: "palm", landmark: "wat", water: true, lanterns: [0xffd23f, 0xff8a2a] }),
  L(20, "iceland", "Iceland", "Reykjavik", 64.1, -21.9, [0x2a3a6a, 0x8ab8c8, 0xffe0c0, 0.2], "blacksand", ["cod", "rye"],
    { id: "fishcake", name: "Fishcake Flippers" }, { id: "puffin", name: "The Puffin Pudding", attacks: ["lob", "stomp", "volley"], tip: "He hops and flops and throws pudding. Jump the rings!" }, "Northern Lights Bakery",
    { style: "gable", walls: [[230, 60, 50], [250, 220, 80], [60, 120, 200], [240, 240, 236]], roof: [60, 60, 66], trees: "none", landmark: "geyser", hills: 0x5a6a5a }),
  L(21, "spain", "Spain", "Barcelona", 41.4, 2.17, [0x4a98e8, 0xffe8c0, 0xfff4d8, 0.55], "paving", ["saffron", "pepper"],
    { id: "churro", name: "Churro Chompers" }, { id: "toro", name: "El Toro Tortilla", attacks: ["charge", "volley", "stomp"], tip: "He charges like a bull! Step aside at the last moment, then zap." }, "Casa Paella",
    { style: "flat", walls: [[232, 190, 130], [226, 170, 120], [240, 214, 170]], balcony: true, trees: "palm", landmark: "sagrada", flags: [0xd8321e, 0xffd23f] }),
  L(22, "turkey", "Turkey", "Istanbul", 41.0, 28.98, [0x6a88c8, 0xffd0a8, 0xffb880, 0.25], "cobble", ["pistachio", "apricot"],
    { id: "delight", name: "Turkish Delight Dots" }, { id: "kebab", name: "The Kebab Knight", attacks: ["spin", "charge", "lob"], tip: "He spins his skewer and charges. Keep out of his way!" }, "Bosphorus Bakery",
    { style: "gable", walls: [[200, 160, 120], [230, 200, 160], [180, 120, 100]], roof: [150, 70, 50], trees: "cypress", landmark: "mosque", water: true, lanterns: [0x3ad8ff, 0xff3a8a, 0xffd23f] }),
  L(23, "korea", "South Korea", "Seoul", 37.57, 126.98, [0x6a7ab8, 0xffc8b0, 0xffa880, 0.2], "cobble", ["seaweed", "sesame"],
    { id: "kimbapmini", name: "Kimbap Kids" }, { id: "bibimbap", name: "The Bibimbap Bear", attacks: ["stomp", "volley", "summon"], tip: "He stomps and throws veggies, and calls the Kimbap Kids!" }, "Seoul Food Street",
    { style: "wood", trees: "cherry", landmark: "palace", lanterns: [0xff3a3a, 0x3a8ae8, 0xffd23f] }),
  L(24, "morocco", "Morocco", "Marrakech", 31.63, -7.99, [0x5a98e0, 0xffe0b8, 0xfff0d0, 0.5], "sand", ["couscous", "mint"],
    { id: "tagine", name: "Tagine Troopers" }, { id: "genie", name: "The Spice Genie", attacks: ["breath", "volley", "spin"], tip: "He blows spicy wind where it glows red, and spins. Go round the side!" }, "Marrakech Mint Cafe",
    { style: "flat", walls: [[200, 90, 70], [210, 110, 80], [190, 80, 66]], trees: "palm", landmark: "minaret", lanterns: [0xffb030, 0xff6a2a] }),
  L(25, "switzerland", "Switzerland", "the Alps", 46.0, 7.75, [0x4a90e8, 0xe0f0ff, 0xffffff, 0.75], "grass", ["hazelnut", "cream"],
    { id: "chocchunk", name: "Chocolate Chunks" }, { id: "fondue", name: "The Fondue Golem", attacks: ["stomp", "lob", "breath"], tip: "He stomps, splats cheese and breathes hot air. Jump and keep moving!" }, "Alpine Chocolatier",
    { style: "chalet", trees: "pine", landmark: "matterhorn", hills: 0x4a8a48, tall: 1.8 }),
  L(26, "jamaica", "Jamaica", "the Caribbean", 18.0, -76.8, [0x2a98e8, 0xd8f4ff, 0xffffff, 0.8], "sand", ["papaya", "sugarcane"],
    { id: "papayamini", name: "Papaya Pirates" }, { id: "crab", name: "Captain Coconut Crab", attacks: ["charge", "volley", "summon"], tip: "He scuttles at you sideways and throws coconuts. Dodge and zap!" }, "Island Fruit Stand",
    { style: "flat", walls: [[250, 180, 200], [140, 220, 200], [250, 230, 120], [180, 200, 250]], trees: "palm", landmark: "lighthouse", water: true }),
  L(27, "argentina", "Argentina", "Buenos Aires", -34.6, -58.38, [0x5a98e0, 0xe8f0ff, 0xfff0d8, 0.55], "cobble", ["dulce", "peach"],
    { id: "empanada", name: "Empanada Ambush" }, { id: "gaucho", name: "The Gaucho Grill", attacks: ["breath", "charge", "lob"], tip: "He blows smoke where it glows red and charges. Go round him!" }, "La Boca Bakery",
    { style: "flat", walls: [[60, 140, 220], [250, 210, 60], [230, 80, 70], [80, 190, 110]], trees: "tree", landmark: "obelisk", flags: [0x6ab8f0, 0xffffff] }),
  L(28, "vietnam", "Vietnam", "Hoi An", 15.88, 108.33, [0x1a1a48, 0x5a4a8a, 0xffc890, 0.1], "paving", ["dragonfruit", "starfruit"],
    { id: "banhmi", name: "Banh Mi Bandits" }, { id: "pho", name: "The Pho Phantom", attacks: ["spin", "lob", "summon"], tip: "He swirls like soup steam and splashes noodles. Zap him when he stops!" }, "Lantern Town Pho",
    { style: "flat", walls: [[240, 200, 80], [236, 190, 70], [230, 180, 90]], trees: "palm", landmark: "bridge", water: true, lanterns: [0xff3a3a, 0xffd23f, 0xff8a2a, 0x9b6bff] }, { night: true }),
  L(29, "antarctica", "Antarctica", "the South Pole", -78, 166, [0x0a1838, 0x2a5a7a, 0xd8f0ff, 0.4], "snow", ["vanilla", "snowberry"],
    { id: "popsicle", name: "Popsicle Penguins" }, { id: "gelato", name: "The Glacier Gelato", attacks: ["charge", "volley", "stomp"], tip: "He slides at you and throws snowballs. Jump the rings!" }, "South Pole Gelato",
    { style: "igloo", trees: "none", landmark: "icebergs", aurora: true }, { night: true }),
  L(30, "nepal", "Nepal", "Mount Everest", 27.99, 86.93, [0x3a70c8, 0xd8e8f8, 0xffffff, 0.7], "stone", ["barley", "ginger"],
    { id: "momo", name: "Momo Monks" }, { id: "hotpot", name: "The Himalayan Hot Pot", attacks: ["breath", "stomp", "summon", "lob"], tip: "The thirtieth boss! Steam, stomps, splashes and Momo Monks. Use your best wand and your potions!" }, "Everest Tea House",
    { style: "stone", trees: "pine", landmark: "everest", flags: [0x3a8ae8, 0xffffff, 0xd8321e, 0x3fae3a, 0xffd23f], hills: 0xd8e0ea, tall: 2 }),

  { id: "fortress", n: 31, name: "Burger Fortress", land: "the middle of the Pacific", lat: 5, lon: -140,
    sky: [0x2a0a2a, 0xe8503a, 0xffb040, 0.08], ground: "stone", items: ["tomato", "cheese", "wheat"],
    mini: { id: "fry", name: "Fry Guys", n: 6, hp: 9 }, boss: { id: "burger", name: "King Burgerbeard", hp: 160, size: 2.4, attacks: ["charge", "lob", "stomp", "volley", "spin", "breath", "summon"],
      tip: "The last boss of all! He does everything the other bosses did. Use your best wand and your potions!" }, final: true },
];
export const LEVEL = Object.fromEntries(LEVELS.map(l => [l.id, l]));
export const LAST = LEVELS[LEVELS.length - 2].id;
export const MAGIC = ["crystal", "ember", "star", "snowflake", "moonflower"];
// every boss drops one magic thing, the first five in turn and then round again
LEVELS.forEach(l => { if (l.n > 0 && !l.final) l.magic = MAGIC[(l.n - 1) % 5]; });

export const ING = {
  apple: "Apple", egg: "Egg", milk: "Milk", wheat: "Wheat", strawberry: "Strawberry", carrot: "Carrot", honey: "Honey",
  tomato: "Tomato", cheese: "Cheese", basil: "Basil", olive: "Olives", lemon: "Lemon",
  corn: "Corn", chili: "Chili", avocado: "Avocado", cocoa: "Cocoa Pod",
  rice: "Rice", fish: "Fish", blossom: "Cherry Blossom", tea: "Green Tea",
  ice: "Ice", blueberry: "Blueberries", salmon: "Salmon",
  pineapple: "Pineapple", coconut: "Coconut", banana: "Banana",
  butter: "Butter", grape: "Grapes", beef: "Beef", pickle: "Pickle", mango: "Mango", lentil: "Lentils",
  noodles: "Noodles", bokchoy: "Bok Choy", kiwi: "Kiwi", macadamia: "Macadamia Nuts", acai: "Acai Berries", orange: "Orange",
  date: "Dates", fig: "Fig", yogurt: "Yogurt", cucumber: "Cucumber", pear: "Pear", caramel: "Caramel",
  beetroot: "Beetroot", cabbage: "Cabbage", potato: "Potato", quinoa: "Quinoa", maple: "Maple Syrup",
  plantain: "Plantain", peanut: "Peanuts", lime: "Lime", shrimp: "Shrimp", cod: "Cod", rye: "Rye",
  saffron: "Saffron", pepper: "Red Pepper", pistachio: "Pistachios", apricot: "Apricot", seaweed: "Seaweed", sesame: "Sesame Seeds",
  couscous: "Couscous", mint: "Mint", hazelnut: "Hazelnuts", cream: "Cream", papaya: "Papaya", sugarcane: "Sugar Cane",
  dulce: "Dulce de Leche", peach: "Peach", dragonfruit: "Dragon Fruit", starfruit: "Star Fruit", vanilla: "Vanilla", snowberry: "Snowberries",
  barley: "Barley", ginger: "Ginger",
  crystal: "Magic Crystal", ember: "Fire Ember", star: "Star Dust", snowflake: "Magic Snowflake", moonflower: "Moonflower",
};
export const ING_LEVEL = {};
for (const l of LEVELS) if (!l.final) l.items.forEach(i => { ING_LEVEL[i] = l.id; });
MAGIC.forEach((m, i) => { ING_LEVEL[m] = LEVELS[i + 1].id; });

// Cooked in the cauldron. "from" is where the food comes from in the
// world: the shop there is the one that orders it. A potion has a colour;
// "drink" ones help out exploring and fighting.
export const RECIPES = [
  { id: "shake",    name: "Strawberry Milkshake", need: ["strawberry", "milk"], from: "home" },
  { id: "pancakes", name: "Pancakes",             need: ["egg", "milk", "wheat"], from: "home" },
  { id: "applepie", name: "Apple Pie",            need: ["apple", "wheat", "egg"], from: "home" },
  { id: "carrotcake", name: "Carrot Cake",        need: ["carrot", "wheat", "egg"], from: "home" },
  { id: "cookies",  name: "Honey Cookies",        need: ["honey", "wheat", "cocoa"], from: "home" },
  { id: "muffin",   name: "Blueberry Muffin",     need: ["blueberry", "wheat", "egg"], from: "home" },
  { id: "pizza",    name: "Pizza",                need: ["wheat", "tomato", "cheese"], from: "italy" },
  { id: "pasta",    name: "Spaghetti",            need: ["wheat", "tomato", "basil"], from: "italy" },
  { id: "salad",    name: "Salad",                need: ["tomato", "olive", "carrot"], from: "italy" },
  { id: "lemonade", name: "Lemonade",             need: ["lemon", "honey"], from: "italy" },
  { id: "tacos",    name: "Tacos",                need: ["corn", "chili", "avocado"], from: "mexico" },
  { id: "popcorn",  name: "Popcorn",              need: ["corn", "corn"], from: "mexico" },
  { id: "choccake", name: "Chocolate Cake",       need: ["cocoa", "egg", "wheat"], from: "mexico" },
  { id: "hotchoc",  name: "Hot Chocolate",        need: ["cocoa", "milk"], from: "mexico" },
  { id: "sushi",    name: "Sushi",                need: ["rice", "fish"], from: "japan" },
  { id: "riceball", name: "Rice Ball",            need: ["rice", "rice"], from: "japan" },
  { id: "dango",    name: "Dango",                need: ["rice", "blossom", "strawberry"], from: "japan" },
  { id: "icecream", name: "Ice Cream",            need: ["ice", "milk", "strawberry"], from: "arctic" },
  { id: "salmonrice", name: "Salmon Rice Bowl",   need: ["salmon", "rice"], from: "arctic" },
  { id: "smoothie", name: "Tropical Smoothie",    need: ["banana", "coconut", "milk"], from: "volcano" },
  { id: "sundaedish", name: "Pineapple Sundae",   need: ["pineapple", "ice", "coconut"], from: "volcano" },
  { id: "croissant", name: "Croissant",           need: ["butter", "wheat"], from: "france" },
  { id: "grapejuice", name: "Grape Juice",        need: ["grape", "grape"], from: "france" },
  { id: "hamburger", name: "Hamburger",           need: ["beef", "wheat", "pickle"], from: "usa" },
  { id: "lassi",    name: "Mango Lassi",          need: ["mango", "yogurt"], from: "india" },
  { id: "dal",      name: "Dal and Rice",         need: ["lentil", "rice"], from: "india" },
  { id: "noodlesoup", name: "Noodle Soup",        need: ["noodles", "bokchoy"], from: "china" },
  { id: "dumplings", name: "Dumplings",           need: ["wheat", "beef", "bokchoy"], from: "china" },
  { id: "pavlova",  name: "Pavlova",              need: ["egg", "kiwi", "strawberry"], from: "australia" },
  { id: "acaibowl", name: "Acai Bowl",            need: ["acai", "banana"], from: "brazil" },
  { id: "orangejuice", name: "Orange Juice",      need: ["orange", "orange"], from: "brazil" },
  { id: "datecake", name: "Date Cake",            need: ["date", "wheat", "honey"], from: "egypt" },
  { id: "greeksalad", name: "Greek Salad",        need: ["tomato", "cucumber", "olive"], from: "greece" },
  { id: "tzatziki", name: "Tzatziki",             need: ["yogurt", "cucumber"], from: "greece" },
  { id: "stroopwafel", name: "Stroopwafels",      need: ["caramel", "wheat"], from: "netherlands" },
  { id: "borscht",  name: "Borscht",              need: ["beetroot", "cabbage", "carrot"], from: "russia" },
  { id: "fries",    name: "Chips",                need: ["potato", "potato"], from: "peru" },
  { id: "quinoasalad", name: "Quinoa Salad",      need: ["quinoa", "tomato", "avocado"], from: "peru" },
  { id: "maplepancakes", name: "Maple Pancakes",  need: ["maple", "egg", "milk"], from: "canada" },
  { id: "plantainchips", name: "Plantain Chips",  need: ["plantain", "plantain"], from: "kenya" },
  { id: "padthai",  name: "Pad Thai",             need: ["noodles", "shrimp", "lime"], from: "thailand" },
  { id: "ryebread", name: "Rye Bread",            need: ["rye", "honey"], from: "iceland" },
  { id: "fishstew", name: "Fish Stew",            need: ["cod", "potato"], from: "iceland" },
  { id: "paella",   name: "Paella",               need: ["rice", "saffron", "shrimp"], from: "spain" },
  { id: "baklava",  name: "Baklava",              need: ["pistachio", "honey", "wheat"], from: "turkey" },
  { id: "kimbap",   name: "Kimbap",               need: ["rice", "seaweed", "egg"], from: "korea" },
  { id: "minttea",  name: "Mint Tea",             need: ["mint", "tea"], from: "morocco" },
  { id: "couscousdish", name: "Couscous",         need: ["couscous", "carrot"], from: "morocco" },
  { id: "fondue",   name: "Cheese Fondue",        need: ["cheese", "wheat", "cream"], from: "switzerland" },
  { id: "fruitpunch", name: "Fruit Punch",        need: ["papaya", "sugarcane", "lime"], from: "jamaica" },
  { id: "alfajores", name: "Alfajores",           need: ["dulce", "wheat", "cocoa"], from: "argentina" },
  { id: "dragonsmoothie", name: "Dragon Fruit Smoothie", need: ["dragonfruit", "milk"], from: "vietnam" },
  { id: "vanillaicecream", name: "Vanilla Ice Cream", need: ["vanilla", "ice", "milk"], from: "antarctica" },
  { id: "momos",    name: "Momos",                need: ["wheat", "beef", "ginger"], from: "nepal" },
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
