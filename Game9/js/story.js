// Agent Rory: Operation Eclipse — the story as data.
// Everything here is transcribed from STORY.md. Dialogue lines are
// [speaker, text]; speakers are keys of CHARS. Sophia, Rory and Dylan Games, Inc.

export const CHARS = {
  rory:    { name: "Rory", voice: { g: "m", langs: ["en-GB"], pitch: 1.15, rate: 1.05 },
             face: { skin: "#f3cfae", hair: "#6b4423", style: "short", eyes: "#3b5f8a", clothes: "#2c3e6b", accessory: "earpiece" } },
  hale:    { name: "Commander Hale", voice: { g: "f", langs: ["en-GB"], pitch: 0.8, rate: 0.9 },
             face: { skin: "#e9c1a0", hair: "#d8d8d8", style: "bun", eyes: "#4a4a4a", clothes: "#1b2a4a", accessory: "medal", brows: "stern" } },
  vi:      { name: "Aunt Vi", voice: { g: "f", langs: ["en-GB"], pitch: 1.35, rate: 1.12 },
             face: { skin: "#f0c9a6", hair: "#c9462f", style: "curly", eyes: "#3d7a3a", glasses: "round", clothes: "#7a3fa0", accessory: "pencil" } },
  eclipse: { name: "Madame Eclipse", voice: { g: "f", langs: ["fr-FR"], pitch: 0.85, rate: 0.85 },
             face: { skin: "#f1d6c1", hair: "#101010", style: "sleek", eyes: "#222", glasses: "dark", clothes: "#0a0a0a", accessory: "collar", lips: "#b0102a" } },
  kolya:   { name: "Kolya", voice: { g: "m", langs: ["ru-RU"], pitch: 0.7, rate: 0.9 },
             face: { skin: "#e8b995", hair: "#3a2a1a", style: "ushanka", eyes: "#4a4a4a", facial: "beard", clothes: "#5a4a3a", big: true, accessory: "food" } },
  dave:    { name: "Dave", voice: { g: "m", langs: ["en-GB"], pitch: 1.0, rate: 1.05 },
             face: { skin: "#d9a57c", hair: "#2a2a2a", style: "flatcap", eyes: "#3a3a3a", clothes: "#3a3a3a", accessory: "scarf" } },
  lorenzo: { name: "Lorenzo", voice: { g: "m", langs: ["it-IT"], pitch: 1.0, rate: 1.0 },
             face: { skin: "#e2b48c", hair: "#1e1410", style: "boater", eyes: "#3a2a1a", facial: "moustache", clothes: "#c0392b", stripes: true } },
  nadia:   { name: "Dr Farouk", voice: { g: "f", langs: ["en-GB"], pitch: 1.05, rate: 0.95 },
             face: { skin: "#c9946a", hair: "#2a1a10", style: "scarf", eyes: "#3a2a1a", clothes: "#b8860b", accessory: "brush" } },
  yuki:    { name: "Yuki", voice: { g: "f", langs: ["en-US"], pitch: 1.25, rate: 1.12 },
             face: { skin: "#f3d9c4", hair: "#141414", style: "bandana", eyes: "#222", clothes: "#c0392b", accessory: "chopsticks" } },
  sal:     { name: "Detective Sal", voice: { g: "m", langs: ["en-US"], pitch: 0.9, rate: 1.0 },
             face: { skin: "#e0b08a", hair: "#4a3a2a", style: "trilby", eyes: "#3a3a3a", facial: "stubble", clothes: "#6b5b45", accessory: "badge" } },
  tiago:   { name: "Tiago", voice: { g: "m", langs: ["pt-BR"], pitch: 1.0, rate: 1.0 },
             face: { skin: "#b57a4e", hair: "#1a1a1a", style: "surfer", eyes: "#2a1a10", clothes: "#27ae60", accessory: "shades_up" } },
  natasha: { name: "Natasha", voice: { g: "f", langs: ["ru-RU"], pitch: 1.1, rate: 0.95 },
             face: { skin: "#f2d5c2", hair: "#e8c070", style: "long", eyes: "#4a7aa0", clothes: "#4a5a6a", accessory: "headset" } },
  nigel:   { name: "Nigel Pratt", voice: { g: "m", langs: ["en-GB"], pitch: 1.3, rate: 1.0 },
             face: { skin: "#f1c9a5", hair: "#8a7a5a", style: "bald", eyes: "#4a4a4a", facial: "moustache", clothes: "#2a4a8a", accessory: "capguard", sweaty: true } },
  watch:   { name: "Spy Watch", voice: { g: "n", langs: ["en-GB"], pitch: 1.0, rate: 1.1 },
             face: { skin: "#223", hair: "#223", style: "watch", eyes: "#7fd", clothes: "#223" } },
};

// Abort-code symbols for the finale keypad, drawn by the UI (no fonts needed).
export const SYMBOLS = ["sun", "moon", "star", "bolt", "eye", "key", "wave", "diamond", "skull"];

export const COUNTRIES = [
  {
    id: "london", city: "London", country: "England", flag: "uk", lat: 51.5, lon: -0.12,
    chapter: "The Greenwich Job", sky: "night", ambience: "rain", contact: "dave",
    arrive: [
      ["dave", "Evening, Agent Rory. Dave, M.I.S.T. wheelman. Lovely night for it. If you're a duck."],
      ["dave", "The Observatory's up the hill, past the phone box. The guard, Nigel, is waiting. Sweating, mostly."],
      ["vi", "Rory, pet, it's Vi. Your Spy Watch is on your wrist. Walk with the left thumb, look with the right."],
      ["vi", "Tap the green button when you reach something glowing. Off you go."],
    ],
    missions: [
      {
        id: "m1", title: "Nothing But the Truth", game: "lie", station: "observatory",
        stationLabel: "Royal Observatory", icon: "dome",
        intro: [
          ["nigel", "I never saw nothing. Nothing at all. I was at my desk with my tea."],
          ["vi", "Right then, pet. I've wired Nigel to the lie detector. Watch the needle while he talks."],
          ["vi", "Smooth waves mean the truth. Big jumpy spikes mean a fib. Tap TRUTH or LIE after each one."],
        ],
        outro: [
          ["nigel", "Alright! ALRIGHT! A lady with a voice like silk paid me. I let a man in. Fingers Malone."],
          ["nigel", "He's hiding in the flat above the chip shop on Baker Street. Please don't tell my mum."],
          ["hale", "Good work, Agent Rory. Baker Street. Move."],
        ],
        intel: { title: "The thief", text: "\"Fingers\" Malone stole the blueprints. He is hiding in the flat above the chip shop on Baker Street." },
      },
      {
        id: "m2", title: "Fingers' Flat", game: "safe", station: "flat",
        stationLabel: "Flat above the chip shop", icon: "door",
        intro: [
          ["rory", "He's gone. Left in a hurry. But there's a safe behind this painting of a horse."],
          ["vi", "My stethoscope gadget, pet. Drag the dial round. The closer you get to a number, the louder the tick."],
          ["vi", "When the light goes green, tap SET. Three numbers and the door opens."],
        ],
        outro: [
          ["rory", "A letter. \"The blueprints go to Venice. The Glassmaker will build the lens. Carnival night, Murano.\" Signed E."],
          ["rory", "And a photograph. A woman in dark glasses."],
          ["vi", "Oh, pet. That's Madame Eclipse. Head of UMBRA. If she's got the Helios plans, the whole world's in trouble."],
        ],
        intel: { title: "The letter from \"E\"", text: "The blueprints go to Venice. The Glassmaker will build the lens on carnival night. The photo shows Madame Eclipse, head of UMBRA." },
      },
    ],
    leave: [
      ["dave", "Oi! Big fella in two coats just squeezed into a taxi with a bag of chips. Yours?"],
      ["hale", "Kolya Zima. UMBRA's henchman. Where he goes, Eclipse follows. Venice, Agent Rory. Go."],
    ],
  },
  {
    id: "venice", city: "Venice", country: "Italy", flag: "it", lat: 45.44, lon: 12.33,
    chapter: "The Glassmaker", sky: "sunset", ambience: "water", contact: "lorenzo",
    arrive: [
      ["lorenzo", "Benvenuto a Venezia! Lorenzo. Mind the step, the canal is wetter than it looks."],
      ["lorenzo", "The Glassmaker's workshop is by the furnace. Tonight is carnival, so everybody wears a mask. Even the pigeons."],
    ],
    missions: [
      {
        id: "m3", title: "Il Vetraio", game: "cipher", station: "workshop",
        stationLabel: "The Glassmaker's workshop", icon: "furnace",
        intro: [
          ["rory", "His order book. Every page is gibberish. Q-Z-V... it's in code."],
          ["vi", "A cipher wheel, pet. Every letter has been slid along the alphabet. Drag the inner ring until the words come out."],
          ["vi", "Tip: he signs everything VETRI. Line that up first, then tap DECODE."],
        ],
        outro: [
          ["rory", "\"One mirror lens, forty metres, for Madame E.\" Forty metres! That's bigger than a house."],
          ["rory", "Page two: \"Payment arrives at the carnival. The courier wears the golden mask.\""],
          ["lorenzo", "Then to the piazza, my friend! Half of Venice is wearing gold tonight. Tonight, we play spot the courier."],
        ],
        intel: { title: "The order book", text: "One mirror lens, forty metres, for Madame E. Payment arrives at the carnival. The courier wears the golden mask." },
      },
      {
        id: "m4", title: "Carnival of Masks", game: "masks", station: "piazza",
        stationLabel: "The carnival piazza", icon: "mask",
        intro: [
          ["vi", "Sixteen masked dancers, pet, and one of them is UMBRA's courier. I'll feed you clues on the watch."],
          ["vi", "Tap the one who matches every clue. Tap a tourist and you'll just get told off in Italian."],
        ],
        outro: [
          ["rory", "Got you! And in your cloak... a shipping manifest."],
          ["rory", "\"One lens, crated. Ship to Cairo, Egypt. Test on the Great Pyramid at noon, Thursday.\""],
          ["hale", "A test on the pyramids. She's going to switch off the sun over Cairo. Egypt. Now."],
        ],
        intel: { title: "The manifest", text: "The lens ships to Cairo, Egypt, to be tested on the Great Pyramid at noon on Thursday." },
      },
    ],
    leave: [
      ["lorenzo", "There! The big man in two coats, in the speedboat, with a paper cone of cicchetti!"],
      ["kolya", "Is not fair! I was eating!"],
      ["lorenzo", "I will sing you to the airport. It is a long song."],
    ],
  },
  {
    id: "cairo", city: "Cairo", country: "Egypt", flag: "eg", lat: 30.04, lon: 31.24,
    chapter: "Shadow Over Cairo", sky: "desert", ambience: "wind", contact: "nadia",
    arrive: [
      ["nadia", "Agent Rory. Dr Nadia Farouk. Welcome to Cairo. Yesterday at noon the pyramids across the river went dark for one whole minute. The camels fainted."],
      ["nadia", "UMBRA left a radio mast on the roof of the bazaar. And they have been sniffing around my tomb in the old ridge. Nobody sniffs around my tomb."],
    ],
    missions: [
      {
        id: "m5", title: "The Listening Post", game: "radio", station: "mast",
        stationLabel: "UMBRA's radio mast", icon: "mast",
        intro: [
          ["vi", "Their relay's still switched on, pet. Drag the needle along the band. Less crackle means you're getting warm."],
          ["vi", "Careful, there's a pop station on the same band. Find the channel where somebody's talking, and hold it."],
        ],
        outro: [
          ["rory", "That was HER. \"Fetch the Eye from the tomb.\" Whatever the Eye is, the Engine can't focus without it."],
          ["nadia", "The Eye of Ra. A crystal lens the old astronomers kept in the tomb of light. It has been sealed for three thousand years."],
          ["nadia", "The builders opened their doors with sunlight. Come. I will show you."],
        ],
        intel: { title: "Eclipse's transmission", text: "The test was perfect: sixty seconds of night at noon. Kolya must fetch the Eye from the tomb, or the Engine cannot focus." },
      },
      {
        id: "m6", title: "The Tomb of Light", game: "mirror", station: "tomb",
        stationLabel: "The tomb of light", icon: "tomb",
        intro: [
          ["nadia", "A beam of sun comes through the door. Tap the bronze mirrors to turn them and steer it onto the sun disc."],
          ["vi", "Stone blocks stop the beam, pet. Two chambers. Then the door should open by itself. Or so Nadia says."],
        ],
        outro: [
          ["rory", "The door's opening... and there it is. The Eye of Ra. It's warm."],
          ["kolya", "Hey! Little spy! That is MY crystal! ...Is not fair."],
          ["vi", "First time we've beaten them to it, pet! Now they'll need a computer chip to focus that mirror instead."],
          ["vi", "Only one lab in the world makes a chip that good. Kaito Labs, Tokyo. That's where they'll go. So that's where you go."],
        ],
        intel: { title: "The Eye of Ra", text: "Recovered before UMBRA. Without it they need a guidance chip to focus the mirror, and only Kaito Labs in Tokyo makes one." },
      },
    ],
    leave: [
      ["nadia", "He ran off through the bazaar, shouting about his lunch. Go well, Agent Rory. Bring me back a postcard."],
    ],
  },
  {
    id: "tokyo", city: "Tokyo", country: "Japan", flag: "jp", lat: 35.68, lon: 139.69,
    chapter: "Neon Ghost", sky: "night", ambience: "city_rain", contact: "yuki",
    arrive: [
      ["yuki", "Rory-san. Yuki. Ramen chef. Also the best hacker in Japan, but the ramen pays better."],
      ["yuki", "Kaito Labs is the glass tower. Keypad door. I watched the guard type the code from here. I remember the pattern. Eat first. Then hack."],
    ],
    missions: [
      {
        id: "m7", title: "Kaito Labs", game: "keypad", station: "lab",
        stationLabel: "Kaito Labs, keypad door", icon: "keypad",
        intro: [
          ["yuki", "Watch the keys light up. Then press them in the same order. Three codes, each one longer."],
          ["vi", "Just like Simon Says, pet, only the prize is a break-in."],
        ],
        outro: [
          ["rory", "We're in. Floor forty-four... the chip cabinet's empty. Someone took it an hour ago."],
          ["yuki", "They left through the server room. Servers remember everything. Come."],
        ],
        intel: { title: "Kaito Labs, floor 44", text: "The guidance chip was stolen tonight. The thief left through the server room, and the servers remember everything." },
      },
      {
        id: "m8", title: "Trace the Ghost", game: "circuit", station: "servers",
        stationLabel: "The server room", icon: "server",
        intro: [
          ["yuki", "The data lines are scrambled. Tap the tiles to turn them. Connect the port on the left to the port on the right."],
          ["vi", "When the current runs all the way across, the logs will open. Two boards, pet."],
        ],
        outro: [
          ["yuki", "Here. \"Chip shipped. Paid by STERLING HOLDINGS, New York. Forty million dollars.\""],
          ["rory", "\"Contact: Marcus Sterling. Sterling Tower, penthouse.\""],
          ["hale", "Sterling. Wall Street's slipperiest banker. New York, Agent Rory. Detective Romano will meet you."],
        ],
        intel: { title: "The server log", text: "The chip was paid for by Sterling Holdings, New York: forty million dollars. Contact Marcus Sterling, Sterling Tower penthouse." },
      },
    ],
    leave: [
      ["yuki", "Look. The bullet train. Big man, two coats, box of takoyaki. He is waving at you."],
      ["kolya", "Bye bye, little spy!"],
    ],
  },
  {
    id: "newyork", city: "New York", country: "USA", flag: "us", lat: 40.71, lon: -74.0,
    chapter: "The Money Man", sky: "night", ambience: "city", contact: "sal",
    arrive: [
      ["sal", "Kid. Sal Romano, NYPD. Hot dog? No? Suit yourself."],
      ["sal", "Sterling skipped town this morning, but his vault's still up in the penthouse. This town's got more crooks than pigeons, and that's saying something."],
    ],
    missions: [
      {
        id: "m9", title: "Sterling's Vault", game: "lock", station: "tower",
        stationLabel: "Sterling Tower, penthouse", icon: "vault",
        intro: [
          ["vi", "A pin-tumbler lock, pet. Five pins. The marker bounces up and down each one."],
          ["vi", "Tap PICK when it's in the green. Miss and that pin drops. They get quicker as you go."],
        ],
        outro: [
          ["rory", "It's open. A ledger. \"Paid: one mirror, Venice. One chip, Tokyo. One rocket, Brazil.\""],
          ["rory", "\"Ship rocket from Rio de Janeiro, Pier 9.\" A ROCKET? And... Sal, something in here is ticking."],
          ["sal", "Oh, that's not good. That's really not good."],
        ],
        intel: { title: "Sterling's ledger", text: "Paid: one mirror (Venice), one chip (Tokyo), one rocket (Brazil). The rocket ships from Rio de Janeiro, Pier 9." },
      },
      {
        id: "m10", title: "Ticking", game: "wires", station: "device",
        stationLabel: "The ticking device", icon: "bomb",
        intro: [
          ["vi", "UMBRA rigged it to burn the ledger. Sixty seconds, pet. Five wires and a little screen."],
          ["vi", "I'm sending the manual to your watch. Read the rules in order and cut the first wire that fits. Three devices."],
        ],
        outro: [
          ["rory", "It stopped. The ledger's last page is a bit singed. \"Rocket sails Friday. Pier 9, Rio. Crate marked ZIMA.\""],
          ["sal", "Nice work, kid. We grabbed Sterling at the airport with a suitcase of cash. He cried."],
          ["hale", "No sign of Kolya in New York, which worries me. Rio, Agent Rory. Friday is the day after tomorrow."],
        ],
        intel: { title: "The last page", text: "The rocket sails on Friday from Pier 9, Rio de Janeiro, in a crate marked ZIMA." },
      },
    ],
    leave: [
      ["sal", "Cab to the airport's on me. Don't tell the captain."],
    ],
  },
  {
    id: "rio", city: "Rio de Janeiro", country: "Brazil", flag: "br", lat: -22.9, lon: -43.2,
    chapter: "The Rocket at Pier 9", sky: "sunset", ambience: "waves", contact: "tiago",
    arrive: [
      ["tiago", "Rory! Tiago. Surfer, harbour pilot, part-time spy. Relax. The tide does the work."],
      ["tiago", "Pier 9 is across the bay. Big crate, big crane, big men. Best view is from the cable car on Sugarloaf."],
    ],
    missions: [
      {
        id: "m11", title: "Sugarloaf Lens", game: "photo", station: "cablecar",
        stationLabel: "The cable-car platform", icon: "camera",
        intro: [
          ["vi", "My camera, pet. Drag to aim through the scope, slide the zoom, hold the target in the ring until it focuses."],
          ["vi", "Three photographs: the crate, the ship's name, and anyone we know. Then tap SNAP."],
        ],
        outro: [
          ["rory", "The crate says ZIMA STATION. The ship is the Severnaya. And that's Kolya on the quay with a coconut."],
          ["vi", "Zima means winter, pet. Somewhere very, very cold. We need to know exactly where."],
          ["tiago", "Then tonight we go to Pier 9 and put a tracker on that crate. Quietly. Very quietly."],
        ],
        intel: { title: "The photographs", text: "The crate is stencilled ZIMA STATION. The freighter is the Severnaya. Kolya is in Rio. Zima means winter." },
      },
      {
        id: "m12", title: "Pier 9", game: "stealth", station: "docks",
        stationLabel: "Pier 9, the container yard", icon: "crate",
        intro: [
          ["tiago", "Guards with torches, and a searchlight on the crane. Stay out of the light and slip between the containers."],
          ["vi", "Drag to move, pet. Reach the crate and the tracker plants itself. If they spot you, it's back to the fence."],
        ],
        outro: [
          ["vi", "Tracker's pinging! Sixty-four degrees north, one hundred degrees east. Siberia. Zima Station."],
          ["hale", "And the launch is in three days. Pack a coat, Agent Rory. Two coats."],
        ],
        intel: { title: "The tracker", text: "The rocket crate pings from 64°N 100°E: Zima Station, Siberia. The launch is in three days." },
      },
    ],
    leave: [
      ["tiago", "There goes the Severnaya, lights out, heading north. My boat will take you to the airport. Hold on to your hat."],
    ],
  },
  {
    id: "siberia", city: "Zima Station", country: "Russia", flag: "ru", lat: 64, lon: 100,
    chapter: "Zima Station", sky: "aurora", ambience: "blizzard", contact: "natasha",
    arrive: [
      ["natasha", "Agent Rory. Natasha Volkova. Radio officer of UMBRA, and M.I.S.T.'s only friend inside these walls. Quietly."],
      ["natasha", "The rocket is on the pad behind the station. Ten minutes to launch at midnight. The office is through the boiler room. Kolya shredded the schedule."],
    ],
    missions: [
      {
        id: "m13", title: "The Ice Fortress", game: "shredder", station: "office",
        stationLabel: "The station office", icon: "door",
        intro: [
          ["natasha", "The shredder bin. Eight strips. Kolya is thorough, but not clever."],
          ["vi", "Drag the strips back into order, pet, then tape it up. The abort code should be on there somewhere."],
        ],
        outro: [
          ["rory", "\"ECLIPSE ENGINE. Launch at midnight. ABORT CODE...\" four symbols. I've got them, Vi."],
          ["natasha", "The control room is next door. And the cameras have just blinked. Go now."],
        ],
        intel: { title: "The launch schedule", text: "Eclipse Engine launches at midnight, T-minus ten minutes. The abort code is four symbols, written in the Dossier." },
      },
      {
        id: "m14", title: "Countdown", game: "override", station: "control",
        stationLabel: "The control room", icon: "screen",
        intro: [
          ["eclipse", "Agent Rory. You have come a very long way to watch the lights go out."],
          ["eclipse", "Ninety seconds, little spy. Then every city on Earth learns what midnight at noon feels like."],
          ["vi", "Ignore her, pet. Three things, fast. Type the abort code. Turn the dial to the number on the screen. Then cut the wires by the rules."],
        ],
        outro: [
          ["rory", "Engines... off. Three seconds to spare. The Engine's just sitting on the pad."],
          ["kolya", "Is not fair. I was eating a pirozhok."],
          ["eclipse", "We will meet again, little spy. Somewhere the sun still shines."],
          ["natasha", "She took the snowmobile. Kolya took the pirozhok. You, Agent Rory, take the plane home."],
        ],
        intel: { title: "Operation Eclipse: stopped", text: "The Eclipse Engine never left the ground. Kolya arrested. Madame Eclipse escaped on a snowmobile." },
      },
    ],
    leave: [],
  },
];

export const BRIEFING = [
  ["hale", "Agent Rory. Sit down. Last night the Royal Observatory in Greenwich was robbed."],
  ["hale", "They took the plans for the Helios Lens: a forty-metre mirror in orbit, built to beam a little sunshine onto cloudy cities."],
  ["vi", "Only if you point it the other way, pet, it can throw a whole city into darkness at noon."],
  ["hale", "The night guard says he saw nothing. He is lying. Prove it, find the thief, and follow the plans wherever they go."],
  ["vi", "Your Spy Watch will show the objective. I'll be in your ear the whole way. Dave's outside with the cab."],
  ["hale", "The lights of the world are in your hands, Agent Rory. Don't drop them."],
];

export const ENDING = [
  ["hale", "Agent Rory. For the first time in eleven years I am going to smile. There. Did you see it?"],
  ["hale", "The Eclipse Engine is in pieces, Sterling is in a cell, and Kolya has asked for seconds."],
  ["vi", "And Madame Eclipse is out there somewhere in the snow, pet, plotting. Which means we'll need you again."],
  ["hale", "The world stays bright because of you. This medal is yours."],
  ["rory", "Thank you, Commander. Same time next week?"],
];

export const CREDITS = [
  "AGENT RORY: OPERATION ECLIPSE",
  "",
  "Starring Rory as Agent R",
  "with Aunt Vi, Commander Hale, Dave, Lorenzo, Dr Farouk,",
  "Yuki, Detective Sal, Tiago, Natasha and Nigel Pratt",
  "",
  "Madame Eclipse and Kolya Zima as themselves",
  "",
  "London  ·  Venice  ·  Cairo  ·  Tokyo",
  "New York  ·  Rio de Janeiro  ·  Zima Station",
  "",
  "Every voice is the iPad's own",
  "Textures from the Godot TPS demo (CC-BY 3.0) and three.js examples (MIT)",
  "Built with three.js (MIT)",
  "",
  "Sophia, Rory and Dylan Games, Inc",
];
