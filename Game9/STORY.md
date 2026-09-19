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

Act One: London, Venice, Cairo, Tokyo, New York, Rio de Janeiro, Zima
Station (Siberia). Act Two, leaving from London again: Paris, Nairobi, Agra,
Beijing, Sydney, Chichen Itza, the Alps. Act Three, once more from London:
Istanbul, Marrakech, Reykjavik, Singapore, Machu Picchu, Amsterdam and the
Curator's vault under the Antarctic ice.

## The missions

Difficulty levels run 1 to 4. Act One sits at 1 and 2, Act Two at 3 and 4;
every mini-game gets bigger, faster or subtler with the level. Act Three is
built on fourteen mini-games that appear nowhere else: each is met once at
level 2 or 3, to learn it, and once more later at level 4.

### Act One: Operation Eclipse

| # | Where | Mission | Mini-game | Level | Intel won |
| --- | --- | --- | --- | --- | --- |
| 1 | London | The Door Code | Codebreaker | 1 | The Observatory was opened from the inside |
| 2 | London | Nothing But the Truth | Lie detector | 2 | Fingers Malone, the flat on Baker Street |
| 3 | London | Dashcam | Spot the difference | 1 | A safe behind the painting of the horse |
| 4 | London | Fingers' Flat | Safe cracker | 2 | The letter from "E"; Venice |
| 5 | Venice | Il Vetraio | Cipher wheel | 2 | A 40 m lens; the courier wears the golden mask |
| 6 | Venice | The Glass Vault | Vault rings | 1 | The delivery note; the manifest is in a loft |
| 7 | Venice | Carnival of Masks | Masked ball | 2 | The courier is caught; the loft has lasers |
| 8 | Venice | Lasers in the Loft | Laser hall | 1 | Lens ships to Cairo; test on the Great Pyramid |
| 9 | Cairo | The Listening Post | Radio tuner | 2 | Fetch the Eye from the tomb |
| 10 | Cairo | The Sun Rods | Reactor rods | 1 | The tomb's inner door is primed |
| 11 | Cairo | The Tomb of Light | Mirror maze | 2 | The Eye of Ra recovered |
| 12 | Cairo | Satellite Sweep | Satellite photo | 1 | UMBRA's plane went to Tokyo; Kaito Labs |
| 13 | Tokyo | Kaito Labs | Keypad memory | 2 | The keypad door is open |
| 14 | Tokyo | The Corridor | Laser hall | 2 | The chip is gone; the servers remember |
| 15 | Tokyo | Trace the Ghost | Circuit hack | 2 | The log is behind the root password |
| 16 | Tokyo | Root Password | Codebreaker | 2 | Paid by Marcus Sterling, New York |
| 17 | New York | Window Watch | Spot the difference | 2 | The vault is behind the bookcase |
| 18 | New York | Sterling's Vault | Lock pick | 2 | The ledger: mirror, chip, rocket; Pier 9 |
| 19 | New York | Ticking | Wire cut | 2 | Rocket sails Friday, crate marked ZIMA |
| 20 | New York | The Bug | Sonar | 1 | ZIMA is a place, not a person |
| 21 | Rio | Crew Manifest | Passport match | 1 | Kolya is the Severnaya's cook |
| 22 | Rio | Sugarloaf Lens | Telephoto | 2 | ZIMA STATION, the Severnaya, Kolya in Rio |
| 23 | Rio | Pier 9 | Stealth yard | 2 | 64°N 100°E, Siberia, three days |
| 24 | Rio | Winter Satellite | Satellite photo | 2 | Zima Station from orbit |
| 25 | Siberia | The Ice Fortress | Shredder | 2 | The launch schedule and the abort code |
| 26 | Siberia | The Reactor | Reactor rods | 2 | The countdown will pause at T-minus 90 |
| 27 | Siberia | The Vault Door | Vault rings | 2 | The control room is open |
| 28 | Siberia | Countdown | Override | 2 | The Engine grounded; Eclipse escapes |

### Act Two: Operation Midnight

| # | Where | Mission | Mini-game | Level | Intel won |
| --- | --- | --- | --- | --- | --- |
| 29 | Paris | The Flower Man | Lie detector | 3 | The lantern is in the Louvre pyramid roof |
| 30 | Paris | Louvre After Dark | Laser hall | 3 | The lantern's panel takes five symbols |
| 31 | Paris | The Panel | Codebreaker | 3 | Lantern 1 of 7 dark; Nairobi |
| 32 | Paris | The Iron Lady | Telephoto | 3 | The van marked ALPINE DAIRY |
| 33 | Nairobi | Camera Trap | Spot the difference | 3 | The truck went to the watering hole |
| 34 | Nairobi | The Watering Hole | Sonar | 3 | The tether runs to UMBRA's camp |
| 35 | Nairobi | The Camp | Stealth yard | 3 | The disarm frequency is on the ranger channel |
| 36 | Nairobi | The Ranger Tower | Radio tuner | 3 | Lantern 2 of 7 dark; Agra |
| 37 | Agra | Festival of Colour | Masked ball | 3 | The courier's coded message |
| 38 | Agra | The Coded Message | Cipher wheel | 3 | The lantern is in the sundial observatory |
| 39 | Agra | The Sundial | Mirror maze | 3 | The keypad is exposed |
| 40 | Agra | The Keypad | Keypad memory | 3 | Lantern 3 of 7 dark; Beijing |
| 41 | Beijing | The Tea-House Safe | Safe cracker | 3 | One of three watchtowers |
| 42 | Beijing | The Dish | Satellite photo | 3 | The third watchtower |
| 43 | Beijing | Watchtower Wiring | Circuit hack | 3 | The lantern's lift is down |
| 44 | Beijing | The Lantern's Lock | Reactor rods | 3 | Lantern 4 of 7 dark; Sydney |
| 45 | Sydney | Ferry Passengers | Passport match | 2 | The diver surfaces at the south pylon |
| 46 | Sydney | The Lookout | Telephoto | 4 | The hatch under the pylon, seven pins |
| 47 | Sydney | The Hatch | Lock pick | 3 | The lantern is on a wired timer |
| 48 | Sydney | The Timer | Wire cut | 3 | Lantern 5 of 7 dark; Chichen Itza |
| 49 | Chichen Itza | The Shredded Map | Shredder | 3 | The jaguar chamber; the master abort code |
| 50 | Chichen Itza | The Serpent Stairs | Stealth yard | 4 | Inside the chamber |
| 51 | Chichen Itza | The Jaguar Vault | Vault rings | 3 | The jaguar door is open |
| 52 | Chichen Itza | The Old Code | Codebreaker | 4 | Lantern 6 of 7 dark; the Alps |
| 53 | The Alps | The Entrance Hall | Laser hall | 4 | Inside the lair |
| 54 | The Alps | The Chairman's Lie | Lie detector | 4 | The switch can be turned off; Eclipse is on the peak |
| 55 | The Alps | A Hundred Rooms | Sonar | 4 | The master switch room |
| 56 | The Alps | Midnight | Override | 4 | All seven lanterns dark; the Chairman arrested |
| 57 | London | The Getaway | Chase (boat) | 1 | Kolya's launch, caught on the Thames |
| 58 | Paris | The Rocket Backpack | Chase (air) | 2 | Madame Eclipse in custody |
| 59 | Agra | The Tuk-Tuk | Chase | 3 | The courier's van, caught |
| 60 | Chichen Itza | The Jeep | Chase | 4 | The last van, caught at the pyramid |

(The four chases sit at the end of their own cities in the game: missions
5 of London, Paris, Agra and Chichen Itza. They are numbered here after the
puzzle missions of the acts they belong to.)

### Act Three: Operation Aurora

The Chairman's mountain kept a ledger, and every lantern and mirror in it was
built for one buyer: the Curator, who collects things nobody can own. His
last wish is the Northern Lights. Seven Prism Keys, hidden in seven cities,
fit the Aurora Engine under the Antarctic ice; turn them all and the lights
come down into his vault, and every compass and satellite with them. Kolya,
lately of the chip shop and still unpaid for Siberia, comes along to help.

| # | Where | Mission | Mini-game | Level | Intel won |
| --- | --- | --- | --- | --- | --- |
| 61 | Istanbul | The Tea Glass | Fingerprints | 2 | The print is Mr Silver's, the Curator's courier |
| 62 | Istanbul | The Lighthouse | Morse code | 2 | PUMP: the cistern pump room |
| 63 | Istanbul | Under the Bazaar | Tangled wires | 2 | The pumps are off; the cup trader |
| 64 | Istanbul | The Cups | Shell game | 2 | Prism Key 1 of 7; Marrakech |
| 65 | Marrakech | The Spice Scales | Balance scale | 2 | The fake coin; the torn map |
| 66 | Marrakech | The Torn Map | Anagram | 2 | The camel camp |
| 67 | Marrakech | Desert Stars | Star chart | 2 | The riad with the blue door |
| 68 | Marrakech | The Riad Roof | Grapple gun | 2 | Prism Key 2 of 7; Reykjavik |
| 69 | Reykjavik | Thin Ice | Thin ice | 3 | The rig on the far shore |
| 70 | Reykjavik | The Seismograph | Oscilloscope | 3 | The drill is in the lava tube |
| 71 | Reykjavik | The Lava Tube | Fog maze | 3 | The drill was a decoy; the fish crate |
| 72 | Reykjavik | Harbour Cargo | Crate stacking | 3 | Prism Key 3 of 7; Singapore |
| 73 | Singapore | Three Towers | Triangulation | 3 | The drone landed on the hawker centre |
| 74 | Singapore | The Menu Board | Picross | 3 | GARDENS, MIDNIGHT |
| 75 | Singapore | Gardens by Night | Fingerprints | 4 | The Curator was here himself |
| 76 | Singapore | The Supertrees | Morse code | 4 | Prism Key 4 of 7; CUSCO |
| 77 | Machu Picchu | The Sun Gate | Star chart | 4 | The lowest terrace |
| 78 | Machu Picchu | The Terraces | Loose stones | 4 | The rope bridge |
| 79 | Machu Picchu | The Gorge | Grapple gun | 4 | Prism Key 5 of 7; the temple scales |
| 80 | Machu Picchu | The Inca Scales | Balance scale | 4 | AMSTERDAM |
| 81 | Amsterdam | The Auction Board | Anagram | 4 | The lot: tulip pots |
| 82 | Amsterdam | The Tulip Pots | Shell game | 4 | Prism Key 6 of 7; LOCK GATES |
| 83 | Amsterdam | The Lock Gates | Tangled wires | 4 | The barge is coming through |
| 84 | Amsterdam | The Barge | Crate stacking | 4 | The courier has the last label |
| 85 | Amsterdam | The Bicycle Chase | Chase (bicycle) | 3 | ANTARCTICA |
| 86 | Antarctica | Whiteout | Fog maze | 4 | The far hut and its seismographs |
| 87 | Antarctica | Three Stations | Triangulation | 4 | The vault, two kilometres out |
| 88 | Antarctica | The Curator's Ledger | Picross | 4 | The snowflake; the vault is open |
| 89 | Antarctica | The Aurora Engine | Oscilloscope | 4 | The engine cancels itself |
| 90 | Antarctica | The Snowmobile | Chase (snowmobile) | 4 | The Curator caught; the lights back |

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
