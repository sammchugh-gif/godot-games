# Agent Rory: Operation Eclipse — the story bible

This is the plan the game is built from. Every line of dialogue, every piece
of intel and every mission in `js/story.js` comes from here. If the two ever
disagree, this file is the intent and the code is the bug.

The game is three acts, twenty-one countries and ninety missions. Every
country is one 3D scene with four mission stations, in order. Every mission
is a mini-game that wins a piece of intel, and the intel is the thread that
names the next station or the next country.

## The one-paragraph version

**Act One, Operation Eclipse.** Somebody has stolen the plans for the
**Helios Lens**, a British invention: a forty-metre mirror in orbit that was
meant to beam a little sunshine onto cloudy cities. The thief works for
**UMBRA**, a secret network run by **Madame Eclipse**, and she has turned
the idea inside out: pointed the other way, the mirror can throw a city into
total darkness at noon. She calls it the **Eclipse Engine**, and the ransom
note is simple: *pay, or live in the dark.* **Rory**, the youngest field agent
of M.I.S.T., follows the trail across seven countries and reaches the launch
pad in Siberia with the clock running.

**Act Two, Operation Midnight.** Three weeks later Madame Eclipse surfaces
in Paris, and she is taking orders. UMBRA has a **Chairman**, and he has
hidden seven **Shadow Lanterns** (small mirrors on balloons) over seven
cities. At the next new moon they all light at once and seven capitals go
dark. Rory puts them out one by one, from the Louvre to the Great Wall, and
climbs the Chairman's mountain for the seventh.

## The tone

A Saturday-morning spy film. Nobody dies, nobody has a gun. Danger means
lasers, lie detectors, countdowns, henchmen with sandwiches and villains who
are elegant and slightly ridiculous. The player should feel clever, not
scared. Every success is loud (a stamp slams INTEL WON across the screen) and
every failure is gentle (a hint and another go).

## The agency

**M.I.S.T.**, the *Ministry of International Secret Tasks*. Headquarters is
underneath a fish-and-chip shop on Baker Street in London. Field agents wear
a **Spy Watch** that shows the current objective, talks to HQ and does the
mini-game briefings.

## The cast

| Who | Role | Voice | How they talk |
| --- | --- | --- | --- |
| **Rory** | The player, Agent R. | en-GB | Keen, brave, quick. "On it." |
| **Commander Hale** | Head of M.I.S.T. Never smiles until an act ends. | en-GB, low | Crisp orders. |
| **Aunt Vi** | Gadget genius, runs the Spy Watch, explains every mini-game. | en-GB | Chatty, warm, precise. |
| **Madame Eclipse** | The villain of Act One, the lieutenant of Act Two. | fr-FR, low | Purring, amused. "You are too late, little spy." |
| **The Chairman** | Otto, the head of UMBRA. Grey moustache, never seen until the end. Keeps a "dairy" in the Alps. | de-DE, low | Bored superiority. |
| **Kolya "Two-Coats" Zima** | UMBRA's henchman, always eating. Escapes prison in a bread van between acts. Ends up working at the chip shop. | ru-RU, low | "Is not fair." |
| **Dave** | London cabbie and wheelman. Drives up a mountain in Act Two. | en-GB | "Where to, guv?" |
| **Lorenzo** | Venetian gondolier. Sings. | it-IT | Operatic. |
| **Dr Nadia Farouk** | Cairo archaeologist. | en-GB | Calm, scholarly. |
| **Yuki** | Tokyo ramen chef and hacker. | en-US | Short, sharp. |
| **Detective Sal Romano** | NYPD. | en-US | Wisecracks. |
| **Tiago** | Rio surfer and harbour pilot. | pt-BR | Laid back. |
| **Natasha Volkova** | M.I.S.T.'s agent inside UMBRA. | ru-RU | Whispers. |
| **Colette** | Paris café owner. | fr-FR | Hears everything. |
| **Jean-Luc** | The flower man, UMBRA's Paris courier. | fr-FR | Sweats. |
| **Amani** | Nairobi park ranger. | en-GB | "Elephants are never wrong." |
| **Priya** | Agra tuk-tuk driver and inventor. | en-IN | Brisk. |
| **Mei** | Beijing tea-house owner. | en-US | Dry. |
| **Matilda** | Sydney surf lifesaver. | en-AU | Cheerful. |
| **Diego** | Chichen Itza archaeologist and mariachi. | es-MX | Sings. |
| **Klaus** | Alpine cable-car operator. | de-DE | "It is not a dairy." |
| **The Curator** | The buyer behind UMBRA. Collects things nobody can own; wants the Northern Lights. Silver hair, monocle, never raises his voice. | en-GB, low | "Collectors never explain." |
| **Emre** | Istanbul tea seller by the Bosphorus ferry. | tr-TR | "Tea first." |
| **Yasmin** | Marrakech spice merchant. Sells information by the gram. | ar-MA | Dry, exact. |
| **Sigrún** | Reykjavik volcanologist. | is-IS | Cheerfully alarming. |
| **Wei Lin** | Singapore hawker chef and drone racer. | en-SG | "Sit." |
| **Mateo** | Machu Picchu llama herder and guide. | es-PE | Slow, kind. |
| **Femke** | Amsterdam canal-boat skipper and bicycle mechanic. | nl-NL | "That's the bike lane." |
| **Dr Okafor** | Chief of the Antarctic research station. | en-NG | Unflappable. |
| **Nigel Pratt** | Observatory night guard. | en-GB, nasal | "I never saw nothing." |

Every line is also a text box with a drawn portrait, so the game is complete
without sound.

## The routes

Act One: London, Venice, Istanbul, Cairo, Marrakech, Tokyo, New York, Rio de
Janeiro, Zima Station (Siberia). Act Two, leaving from London again: Paris,
Nairobi, Reykjavik, Agra, Singapore, Beijing, Sydney, Chichen Itza, the Alps.
Act Three: Machu Picchu, Amsterdam and the Curator's vault under the Antarctic
ice.

The seven newest cities are spread across all three acts rather than saved for
the end, so a new mechanic turns up every few missions all the way through.

## The missions

Difficulty levels run 1 to 4. Act One sits at 1 and 2, Act Two at 3 and 4,
Act Three at 3 and 4; every mini-game gets bigger, faster or subtler with the
level. The fourteen newest mini-games are each met twice, far apart: once in
Act One or Two at a gentle level, to learn them, and once more at level 4 in
the closing cities.

### Act One: Operation Eclipse

The trail of the stolen Helios Lens plans, from the Observatory robbery to a launch site in the snow.
Nine cities; Istanbul and Marrakech are where the crate changes hands.

| # | Where | Mission | Mini-game | Level | Intel won |
| --- | --- | --- | --- | --- | --- |
| 1 | London | The Door Code | Codebreaker | 1 | The door log |
| 2 | London | Nothing But the Truth | Lie detector | 2 | The thief |
| 3 | London | Dashcam | Spot the difference | 1 | The dashcam |
| 4 | London | Fingers' Flat | Safe cracker | 2 | The letter from "E" |
| 5 | London | Downriver | Chase (boat) | 1 | Kolya's boarding pass |
| 6 | Venice | Il Vetraio | Cipher wheel | 2 | The order book |
| 7 | Venice | The Glass Vault | Vault rings | 1 | The delivery note |
| 8 | Venice | Carnival of Masks | Masked ball | 2 | The courier |
| 9 | Venice | Lasers in the Loft | Laser hall | 1 | The manifest |
| 10 | Istanbul | The Tea Glass | Fingerprints | 2 | Mr Silver |
| 11 | Istanbul | The Lighthouse | Morse code | 2 | DOCK |
| 12 | Istanbul | Under the Bazaar | Tangled wires | 2 | The empty crate |
| 13 | Istanbul | The Cups | Shell game | 2 | The customs seal |
| 14 | Cairo | The Listening Post | Radio tuner | 2 | Eclipse's transmission |
| 15 | Cairo | The Sun Rods | Reactor rods | 1 | The counterweights |
| 16 | Cairo | The Tomb of Light | Mirror maze | 2 | The Eye of Ra |
| 17 | Cairo | Satellite Sweep | Satellite photo | 1 | The satellite picture |
| 18 | Marrakech | The Spice Scales | Balance scale | 2 | The fake coin |
| 19 | Marrakech | The Torn Map | Anagram | 2 | The camel camp |
| 20 | Marrakech | Desert Stars | Star chart | 2 | The riad |
| 21 | Marrakech | The Riad Roof | Grapple gun | 2 | The mirror mount |
| 22 | Tokyo | Kaito Labs | Keypad memory | 2 | Kaito Labs, ground floor |
| 23 | Tokyo | The Corridor | Laser hall | 2 | Floor 44 |
| 24 | Tokyo | Trace the Ghost | Circuit hack | 2 | The server log |
| 25 | Tokyo | Root Password | Codebreaker | 2 | The root log |
| 26 | New York | Window Watch | Spot the difference | 2 | The penthouse photos |
| 27 | New York | Sterling's Vault | Lock pick | 2 | Sterling's ledger |
| 28 | New York | Ticking | Wire cut | 2 | The last page |
| 29 | New York | The Bug | Sonar | 1 | The transmitter |
| 30 | Rio de Janeiro | Crew Manifest | Passport match | 1 | The crew list |
| 31 | Rio de Janeiro | Sugarloaf Lens | Telephoto | 2 | The photographs |
| 32 | Rio de Janeiro | Pier 9 | Stealth yard | 2 | The tracker |
| 33 | Rio de Janeiro | Winter Satellite | Satellite photo | 2 | Zima Station from orbit |
| 34 | Zima Station | The Ice Fortress | Shredder | 2 | The launch schedule |
| 35 | Zima Station | The Reactor | Reactor rods | 2 | The reactor |
| 36 | Zima Station | The Vault Door | Vault rings | 2 | The vault door |
| 37 | Zima Station | Countdown | Override | 2 | Operation Eclipse: stopped |

### Act Two: Operation Midnight

Seven Shadow Lanterns over seven cities, and the supply line that feeds them: the glassworks in
Iceland that grinds their mirrors and the relay in Singapore that gives them their orders.

| # | Where | Mission | Mini-game | Level | Intel won |
| --- | --- | --- | --- | --- | --- |
| 38 | Paris | The Flower Man | Lie detector | 3 | Jean-Luc's confession |
| 39 | Paris | Louvre After Dark | Laser hall | 3 | The lantern's panel |
| 40 | Paris | The Panel | Codebreaker | 3 | Lantern 1 of 7 |
| 41 | Paris | The Iron Lady | Telephoto | 3 | The meeting |
| 42 | Paris | The Rocket Backpack | Chase (jetpack) | 2 | Madame Eclipse |
| 43 | Nairobi | Camera Trap | Spot the difference | 3 | The camera trap |
| 44 | Nairobi | The Watering Hole | Sonar | 3 | The tether |
| 45 | Nairobi | The Camp | Stealth yard | 3 | The crate |
| 46 | Nairobi | The Ranger Tower | Radio tuner | 3 | Lantern 2 of 7 |
| 47 | Reykjavik | Thin Ice | Thin ice | 3 | The rig |
| 48 | Reykjavik | The Seismograph | Oscilloscope | 3 | The drill |
| 49 | Reykjavik | The Lava Tube | Fog maze | 3 | The decoy |
| 50 | Reykjavik | Harbour Cargo | Crate stacking | 3 | The mirror blanks |
| 51 | Agra | Festival of Colour | Masked ball | 3 | The courier's message |
| 52 | Agra | The Coded Message | Cipher wheel | 3 | The coded pages |
| 53 | Agra | The Sundial | Mirror maze | 3 | The star disc |
| 54 | Agra | The Keypad | Keypad memory | 3 | Lantern 3 of 7 |
| 55 | Agra | The Tuk-Tuk Dash | Chase (tuktuk) | 2 | The courier's chip |
| 56 | Singapore | Three Towers | Triangulation | 3 | The drone |
| 57 | Singapore | The Menu Board | Picross | 3 | GARDENS, MIDNIGHT |
| 58 | Singapore | Gardens by Night | Fingerprints | 4 | Mr Silver again |
| 59 | Singapore | The Supertrees | Morse code | 4 | The relay |
| 60 | Beijing | The Tea-House Safe | Safe cracker | 3 | The wall map |
| 61 | Beijing | The Dish | Satellite photo | 3 | The satellite picture |
| 62 | Beijing | Watchtower Wiring | Circuit hack | 3 | The lift |
| 63 | Beijing | The Lantern's Lock | Reactor rods | 3 | Lantern 4 of 7 |
| 64 | Sydney | Ferry Passengers | Passport match | 2 | The diver |
| 65 | Sydney | The Lookout | Telephoto | 4 | The harbour photos |
| 66 | Sydney | The Hatch | Lock pick | 3 | The hatch |
| 67 | Sydney | The Timer | Wire cut | 3 | Lantern 5 of 7 |
| 68 | Chichen Itza | The Shredded Map | Shredder | 3 | The pyramid map |
| 69 | Chichen Itza | The Serpent Stairs | Stealth yard | 4 | The jaguar chamber |
| 70 | Chichen Itza | The Jaguar Vault | Vault rings | 3 | The jaguar door |
| 71 | Chichen Itza | The Old Code | Codebreaker | 4 | Lantern 6 of 7 |
| 72 | Chichen Itza | Through the Jungle | Chase (taxi) | 3 | The circled valley |
| 73 | The Alps | The Entrance Hall | Laser hall | 4 | The entrance hall |
| 74 | The Alps | The Chairman's Lie | Lie detector | 4 | The Chairman's lies |
| 75 | The Alps | A Hundred Rooms | Sonar | 4 | The switch room |
| 76 | The Alps | Midnight | Override | 4 | Operation Midnight: stopped |

### Act Three: Operation Aurora

The Curator has been shadowing Rory the whole way. His people took a Prism Key out of Istanbul,
Marrakech, Reykjavik and Singapore about a week after Rory left each of them. Three keys are
still loose, and the last of those is already in the Aurora Engine.

| # | Where | Mission | Mini-game | Level | Intel won |
| --- | --- | --- | --- | --- | --- |
| 77 | Machu Picchu | The Sun Gate | Star chart | 4 | The lowest terrace |
| 78 | Machu Picchu | The Terraces | Thin ice | 4 | The rope bridge |
| 79 | Machu Picchu | The Gorge | Grapple gun | 4 | The temple scales |
| 80 | Machu Picchu | The Inca Scales | Balance scale | 4 | Prism Key 5 of 7 |
| 81 | Amsterdam | The Auction Board | Anagram | 4 | The lot |
| 82 | Amsterdam | The Tulip Pots | Shell game | 4 | Prism Key 6 of 7 |
| 83 | Amsterdam | The Lock Gates | Tangled wires | 4 | The barge |
| 84 | Amsterdam | The Barge | Crate stacking | 4 | The courier |
| 85 | Amsterdam | The Bicycle Chase | Chase (bicycle) | 3 | ANTARCTICA |
| 86 | The Ice Vault | Whiteout | Fog maze | 4 | The far hut |
| 87 | The Ice Vault | Three Stations | Triangulation | 4 | The vault |
| 88 | The Ice Vault | The Curator's Ledger | Picross | 4 | The snowflake |
| 89 | The Ice Vault | The Aurora Engine | Oscilloscope | 4 | The engine is off |
| 90 | The Ice Vault | The Snowmobile | Chase (snowmobile) | 4 | Operation Aurora: complete |

## The mini-games

Every mini-game follows the same shape: Aunt Vi explains it, the game runs
full screen with HINT and LEAVE chips, failure gives a hint and another go
with no penalty, and success slams the INTEL WON stamp and reads the intel
aloud.

HINT is always worth pressing and never costs anything. In the puzzle games
Vi names the next move outright; in the two games that are about timing
rather than thinking, HINT slows the game down instead: the lock pick's
marker crawls and its green band widens, and the laser beams drop to a third
of their speed for several seconds. Nothing in any mini-game can undo
progress the player has already made.

- **Lie detector**: statements on a polygraph strip; TRUTH or LIE. Levels
  add statements, shrink the spikes, hide the sweat and add nervous wobbles
  on true statements.
- **Safe cracker**: a dial and a stethoscope; three then four numbers, with
  a narrower "warm" zone.
- **Cipher wheel**: two then three pages, each with its own shift.
- **Masked ball**: 12 to 24 dancers, three to five clues (the hat is the
  fifth). In Agra the masks are Holi face paint.
- **Radio tuner**: one or two channels to lock, more decoy stations, a
  narrower lock window.
- **Mirror maze**: two then three chambers, up to 11 by 11, with more stone
  and more decoy mirrors.
- **Keypad memory**: sequences up to 8, flashed faster.
- **Circuit hack**: boards up to 9 by 9.
- **Lock pick**: five to eight pins, smaller green bands, quicker markers. A
  miss costs a moment, never a pin that was already set.
- **Wire cut**: three to five devices; from level 3 a fifth rule about
  yellow wires joins the manual.
- **Telephoto**: three to five targets, longer focus, more sway.
- **Stealth yard**: three to six guards, faster, and a second searchlight
  at level 4.
- **Shredder**: eight to twelve strips; the Mexico map carries a
  five-symbol master code.
- **Override**: the code, the dial, the wires; 90 down to 70 seconds; a
  five-symbol code in the Alps.
- **Codebreaker** (new): guess the code, black pips for right place, white
  pips for right symbol; four or five pegs from five to seven symbols.
- **Reactor rods** (new): the towers of Hanoi with three to five discs.
- **Satellite photo** (new): a scrambled picture, 3 by 3 then 4 by 4. Tap two
  tiles to swap them; a tile that lands in the right place locks with a green
  edge, so progress only ever goes forwards. The finished picture is shown
  beside the board, and the hint names the exact pair to swap next.
- **Sonar** (new): ping a grid, read the distance, find the signal in eight
  to ten pings.
- **Vault rings** (new): line up the notches; inner rings drag the ring
  outside them, so innermost first.
- **Spot the difference** (new): four to seven changes between two pictures.
- **Laser hall** (new): cross a room of sweeping and spinning beams. HINT
  slows them right down for a few seconds.
- **Passport match** (new): memory pairs of the cast's faces.

Act Three adds fourteen more, none of them a repeat of anything above:

- **Fingerprints**: match the lifted print to the one on file by its core
  (whorl, loop or arch), its ridge breaks and its scar. 4 to 8 on file.
- **Morse code**: a lamp blinks a word; spell it on a twelve-letter keyboard
  with the chart beside you. Words get longer and the lamp faster.
- **Tangled wires**: numbered sockets, lettered terminals, and the wires cross
  over each other. Say where the lit one ends. 4 to 7 wires.
- **Shell game**: the key goes under a cup, the cups shuffle, tap the right
  one. 3 to 5 cups, 4 to 11 swaps.
- **Balance scale**: one coin (or gold llama) is heavier; two or three
  weighings, then accuse. 6 to 12 to choose from.
- **Anagram**: unscramble a word from its clue. 5 to 8 letters.
- **Star chart**: find the chart's constellation in a sky full of decoys and
  join it in order. 4 to 7 stars.
- **Grapple gun**: set the angle and power and hook the ledge. Further, and
  with wind, at the higher levels.
- **Thin ice** (loose stones at Machu Picchu): cross a grid where every safe
  tile counts its dangerous neighbours; a minesweeper you walk across.
- **Oscilloscope**: slide two or three dials until your wave lies on the
  recorded one. The tolerance tightens with the level.
- **Fog maze**: find the way out seeing only a few steps ahead; where you've
  been stays lit. 7 by 5 up to 13 by 9.
- **Crate stacking**: balance a deck so weight times distance matches on
  both sides. 3 to 6 crates.
- **Triangulation**: three (or four) rings, one crossing; drag the marker
  onto it and lock.
- **Picross**: fill a grid from its row and column numbers to reveal a
  picture; a wrong square marks itself.

## Stars, replay and the bugs

Every mission is scored out of three stars: three for finishing with no hint
and no more slips than that mini-game allows, two for one of those, one for
finishing at all. The dossier lists the best score for each mission and a
running total, and any finished mission can be replayed from there with the
REPLAY chip. A replay never removes what was already won.

Three UMBRA listening devices are hidden in each of the twenty-one cities,
sixty-three in all: small black boxes with a stub antenna and an LED that
blinks once a second, left on the ground where they are worth walking around
to find. Standing next to one and tapping DISABLE takes it out of play. The
spy watch shows the count for the city you are in, the dossier the total.

## The chase missions

Six missions are chases rather than puzzles, for a change of tempo: a night
launch down the Thames after Kolya in London, a rocket backpack after Madame
Eclipse around the Eiffel Tower, Priya's tuk-tuk after a courier van in Agra,
a jeep around the pyramid in Chichen Itza, Femke's bicycle after a cargo bike
over the canal bridges of Amsterdam, and a snowmobile after the Curator's
snowcat across the Antarctic ice. Each lays its own route through
the city it is set in, verified clear of anything solid by
`tools/routecheck.mjs`. Drag left and right to steer, and in the air up and
down to climb and dive. The gap to the quarry closes only while the driving is
clean, and every scrape hands some of it back. There is no timer and no way to
lose, only to take longer.

The air chase also lays a Paris of its own under the flight path, because a
scene built for walking is a small island on a very large empty plane when you
see it from fifty metres up.

## Living cities

Every city has people walking their own routes, most have traffic passing
outside the barriers, and nearly all have birds overhead. The routes were found
by search rather than by eye: the largest clear rectangle in each city that
also stays seven metres clear of where the player lands. `tools/lifecheck.mjs`
runs the clock forward two full laps in all twenty-one to confirm nobody walks
through a wall or into the player.

## Controls

- **Move**: left thumb anywhere on the left half of the screen.
- **Look**: drag anywhere on the right half.
- **Interact**: walk up to a glowing station or a person and tap the big
  green button, or tap them. A yellow arrow points to the objective when it
  is off screen.
- Mini-games are touch-first: drag, tap, that's all.
- Keyboard for testing on a desktop: WASD, mouse drag to look, E or click to
  interact, Esc pauses, H for a hint.
