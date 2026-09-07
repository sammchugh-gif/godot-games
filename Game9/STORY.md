# Agent Rory: Operation Eclipse — the story bible

This is the plan the game is built from. Every line of dialogue, every piece
of intel and every mission in `js/story.js` comes from here. If the two ever
disagree, this file is the intent and the code is the bug.

## The one-paragraph version

Somebody has stolen the plans for the **Helios Lens**, a British invention: a
forty-metre mirror in orbit that was meant to beam a little sunshine onto
cloudy cities. The thief works for **UMBRA**, a secret network run by
**Madame Eclipse**, and she has turned the idea inside out. Pointed the other
way, the mirror can throw a city into total darkness at noon. She calls the
weapon the **Eclipse Engine**, and the ransom note is simple: *pay, or live
in the dark.* **Rory**, the youngest field agent of M.I.S.T., follows the trail
of the stolen plans across seven countries, wins a piece of intel in each
mission, and reaches the launch pad in Siberia with ten minutes on the clock.

## The tone

A Saturday-morning spy film. Nobody dies, nobody has a gun. Danger means
lasers, lie detectors, countdowns, henchmen with sandwiches and a villain who
is elegant and slightly ridiculous. The player should feel clever, not
scared. Every success is loud (a stamp slams INTEL WON across the screen) and
every failure is gentle (a hint and another go).

## The agency

**M.I.S.T.** — the *Ministry of International Secret Tasks*. Headquarters is
underneath a fish-and-chip shop on Baker Street in London. The lift is the
deep-fat fryer. Field agents wear a **Spy Watch** that shows the current
objective, talks to HQ and does the mini-game briefings.

## The cast

| Who | Role | Voice (Web Speech) | How they talk |
| --- | --- | --- | --- |
| **Rory** | The player, Agent R. First-person, so we mostly hear Rory in short replies. | en-GB, normal pitch | Keen, brave, quick. "On it." |
| **Commander Hale** | Head of M.I.S.T. Beatrice Hale, retired admiral, never smiles until the last scene. | en-GB, low pitch, slow | Crisp orders. "Agent Rory. Sit down." |
| **Aunt Vi** | Vivienne Quill, gadget genius, runs the Spy Watch. Calls Rory "pet". Explains every mini-game. | en-GB, high pitch, fast | Chatty, warm, precise. "Right then, pet, here's how it works." |
| **Madame Eclipse** | The villain. Dr Selene Noir, once an astronomer, now the head of UMBRA. Loves theatre; hides things in tombs because it is dramatic. | fr-FR, low pitch, slow | Purring, amused. "You are too late, little spy." |
| **Kolya "Two-Coats" Zima** | UMBRA's chief henchman. Enormous, wears two coats in every climate, always eating the local food. Rory keeps arriving just as he leaves. | ru-RU, low pitch | Grumbles. "Is not fair. I was eating." |
| **Dave** | London black-cab driver and M.I.S.T. wheelman. | en-GB | Cheerful. "Where to, guv?" |
| **Lorenzo** | Venetian gondolier, M.I.S.T. contact. Sings. | it-IT | Operatic. "Benvenuto! Mind the step." |
| **Dr Nadia Farouk** | Egyptian archaeologist who runs the digs around Cairo. | ar-EG, falls back to en-GB | Calm, scholarly. "The old builders hid their doors in light." |
| **Yuki** | Tokyo ramen chef, secretly the best hacker in Japan. | ja-JP, falls back to en-US | Short, sharp. "Eat first. Then hack." |
| **Detective Sal Romano** | NYPD, moonlights for M.I.S.T. | en-US | Wisecracks. "Kid, this town's got more crooks than pigeons." |
| **Tiago** | Rio surfer and harbour pilot. | pt-BR | Laid back. "Relax. The tide does the work." |
| **Natasha Volkova** | UMBRA's radio officer, secretly M.I.S.T.'s agent inside Zima Station. | ru-RU, normal pitch | Whispers. "Quickly. The cameras blink every ninety seconds." |
| **Nigel Pratt** | Night guard at the Royal Observatory. Sweats. | en-GB, nasal | Nervous. "I never saw nothing. Nothing at all." |
| **Signor Vetri** | The Glassmaker of Murano, writes everything in code. | it-IT | Off-stage; we read his order book. |
| **Marcus Sterling** | Wall Street money man who paid for the rocket. | en-US | Off-stage; his vault talks for him. |

Every line of dialogue is also shown in a text box with a drawn portrait, so
the game is complete without sound. Speech is a bonus the iPad provides.

## The route

```
1 LONDON, ENGLAND      2 VENICE, ITALY       3 CAIRO, EGYPT
       |                      |                    |
 the guard lies ----> the glassmaker's ---> the bazaar radio
 the thief's safe     code, the masked      the tomb of light
                      courier
                                                   |
7 SIBERIA, RUSSIA   6 RIO, BRAZIL         4 TOKYO, JAPAN      5 NEW YORK, USA
       ^                 ^                        |                  ^
 the shredded ---- the rocket photo   <--  the keypad, the  --->  the vault lock
 schedule, the      the container yard      server hack           the ticking device
 countdown
```

Each country is one 3D scene with two mission stations. Finishing a mission
wins a piece of **intel**, which goes in the **Dossier** (the pause menu) and
unlocks the next station. Finishing the second mission unlocks the flight to
the next country on the world map.

## The chapters

### Chapter 1 — London, England. "The Greenwich Job."

**Scene**: a rainy night on the south bank of the Thames. Big Ben and the
Houses of Parliament across the water, a red phone box, a red double-decker,
Dave's black cab with its light on, the dome of the Royal Observatory on the
hill, and a fish-and-chip shop with a flat above it. Rain, wet asphalt, street
lamps in halos.

**Briefing** (Commander Hale, at HQ before the scene loads): the Helios Lens
blueprints were stolen from the Royal Observatory last night. The night
guard, Nigel Pratt, says he saw nothing. "He is lying, Agent Rory. Prove it."

**Mission 1 — "Nothing But the Truth"** — the Observatory. Mini-game: **LIE
DETECTOR**. Aunt Vi wires Nigel to a polygraph. He makes six statements. The
needle stays smooth on the truth and jumps into spikes on a lie. Rory marks
each one TRUTH or LIE. Get one wrong and Vi replays it with a hint. The lies
tell the story: he *did* let someone in, a man called Fingers Malone, and he
was paid in cash by "a woman with a voice like silk".

> **Intel 1**: *The thief is "Fingers" Malone. He is hiding in the flat above
> the chip shop on Baker Street.*

**Mission 2 — "Fingers' Flat"** — the flat above the chip shop. Fingers has
gone but his wall safe is still there, behind a painting of a horse.
Mini-game: **SAFE CRACKER**. A dial from 0 to 99 and Vi's stethoscope
gadget: the closer the dial gets to the right number, the louder the tick
and the harder the meter shakes. Three numbers, then the handle turns. Inside:
a letter and a photograph.

> **Intel 2**: *A letter signed "E": "The blueprints go to Venice. The
> Glassmaker will build the lens. Carnival night, Murano." The photograph
> shows a woman in dark glasses. Aunt Vi puts a name to the face: Madame
> Eclipse, head of UMBRA.*

**Chapter close**: Dave's cab, Kolya glimpsed squeezing into a taxi with a
bag of chips. Hale on the watch: "Venice. Go."

### Chapter 2 — Venice, Italy. "The Glassmaker."

**Scene**: a canal at sunset. Striped mooring poles, two gondolas (Lorenzo
in one), a stone bridge, tall shuttered houses in ochre and rose, washing
lines, a campanile, the glass workshop with a glowing furnace, lanterns
coming on for the carnival in the piazza.

**Mission 3 — "Il Vetraio"** — the workshop on Murano. Signor Vetri writes
every order in a Caesar cipher. Mini-game: **CIPHER WHEEL**. Two rings of
letters; drag the inner ring until the gibberish under the glass becomes
words. Two pages. Vi's tip: the Glassmaker signs everything "VETRI", so line
that up first.

> **Intel 3**: *Order book, page 1: "ONE MIRROR LENS, FORTY METRES, FOR
> MADAME E." Page 2: "PAYMENT ARRIVES AT THE CARNIVAL. THE COURIER WEARS THE
> GOLDEN MASK."*

**Mission 4 — "Carnival of Masks"** — the piazza at night. Sixteen masked
figures drift about the square. Mini-game: **MASKED BALL**. Aunt Vi feeds
clues to the watch one at a time (the mask is gold; there is a red feather;
the cloak is blue; they carry a fan, not a cane). Tap the courier. Tap a
tourist and they huff off and a new clue arrives. The courier carries the
shipping manifest.

> **Intel 4**: *Manifest: "ONE LENS, CRATED. SHIP TO CAIRO, EGYPT. TEST ON THE
> GREAT PYRAMID AT NOON, THURSDAY."*

**Chapter close**: Kolya escapes on a speedboat with a paper cone of
cicchetti. Lorenzo sings Rory to the airport.

### Chapter 3 — Cairo, Egypt. "Shadow Over Cairo."

**Scene**: late afternoon on the Cairo corniche. The Nile with feluccas
drifting under their white sails, the Cairo Tower and the hazy skyline on the
far bank, the three pyramids on the horizon beyond it, a mosque with a
turquoise dome and two minarets, the Khan el-Khalili bazaar with striped
awnings, lanterns and spice cones, camels, Nadia's dig camp of canvas tents,
UMBRA's radio mast on the bazaar roof, and the dark mouth of a tomb cut into
the rocky ridge at the edge of the old city.

**Mission 5 — "The Listening Post"** — the mast on the bazaar roof. UMBRA
left a relay here after the test. Mini-game: **RADIO TUNER**. Drag the needle across the
band. The static thins as you get close; there is a decoy station playing
Cairo pop, then the real channel locks and Madame Eclipse's own voice reads
out her orders.

> **Intel 5**: *Eclipse's transmission: "The test was perfect. Sixty seconds
> of night at noon. Kolya, fetch the Eye from the tomb before the diggers
> find it. Without it the Engine cannot focus."*

**Mission 6 — "The Tomb of Light"** — inside the tomb. Nadia: the old
builders opened doors with sunlight. Mini-game: **MIRROR MAZE**. A beam of
sun comes in from the entrance; tap the bronze mirrors to turn them and steer
the beam onto the sun disc. Two chambers, the second bigger. The door grinds
open and Rory takes the **Eye of Ra**, a crystal lens the size of a fist,
seconds before Kolya arrives ("Is not fair!").

> **Intel 6**: *The Eye of Ra, recovered. Vi: "Without the Eye they'll need a
> guidance chip to focus the mirror by computer. Only one lab in the world
> makes one that good: Kaito Labs, Tokyo. That's where they'll go."*

This is the turn of the story: for the first time Rory is ahead of UMBRA, and
the villain's next move is forced by the player's win.

### Chapter 4 — Tokyo, Japan. "Neon Ghost."

**Scene**: a rainy street at night in Tokyo. Neon signs stacked up the
buildings, a ramen stand under a red awning (Yuki), a cherry tree, vending
machines, a pedestrian crossing, a bullet train sliding along an elevated
track, Kaito Labs as a glass tower with a keypad door.

**Mission 7 — "Kaito Labs"** — the lab door. Yuki watched the guard type the
code from across the street and remembers the *pattern*. Mini-game: **KEYPAD
MEMORY**. The nine keys flash a sequence; repeat it. Three rounds, longer
each time. Inside the lab: the chip is already gone, an hour ago.

> **Intel 7**: *Kaito Labs, floor 44: the guidance chip was stolen tonight.
> The thief left through the server room and the servers remember
> everything.*

**Mission 8 — "Trace the Ghost"** — the server room. Mini-game: **CIRCUIT
HACK**. A board of data tiles; tap to rotate; connect the port on the left to
the port on the right and the current flows through. Two boards. The logs
show who paid for the theft.

> **Intel 8**: *Server log: "Chip shipped. Paid by STERLING HOLDINGS, New
> York, forty million dollars. Contact: Marcus Sterling, Sterling Tower,
> penthouse."*

**Chapter close**: Kolya on the bullet train with a box of takoyaki, waving.

### Chapter 5 — New York, USA. "The Money Man."

**Scene**: Manhattan at night. Skyscrapers with a thousand lit windows,
yellow cabs, steam from a manhole, a hot-dog cart (Sal), a fire escape, the
Statue of Liberty tiny across the water, Sterling Tower with a brass door.

**Mission 9 — "Sterling's Vault"** — the penthouse. Sterling has fled but his
vault is here. Mini-game: **LOCK PICK**. Five pins; a marker rides up and
down each one; tap when it is in the green. A miss drops the pin you were on.
The pins get quicker. Inside: UMBRA's ledger, and something ticking.

> **Intel 9**: *Sterling's ledger: "Paid: one mirror (Venice). One chip
> (Tokyo). One rocket (Brazil). Ship rocket from Rio de Janeiro, Pier 9."*

**Mission 10 — "Ticking"** — the device in the vault. UMBRA rigged it to burn
the ledger if anyone opened the door. Mini-game: **WIRE CUT**. Five coloured
wires, a display, a light, and three rules from Vi's manual. Read the rules,
cut the right wire. Three devices, sixty seconds. Sparks and a second go if
you get it wrong; the clock keeps running.

> **Intel 10**: *The ledger's last page, saved from the flames: "Rocket
> sails Friday. Pier 9, Rio. Crate marked ZIMA."*

**Chapter close**: Sal arrests Sterling at the airport with a suitcase of
cash. Kolya is not in New York, which worries Hale.

### Chapter 6 — Rio de Janeiro, Brazil. "The Rocket at Pier 9."

**Scene**: Rio at golden hour. Copacabana's black-and-white wave pavement,
palms, the sea, Sugarloaf Mountain, the statue on Corcovado with its arms
out, a cable car, and across the bay the docks: stacked shipping containers,
a crane, a freighter with a long crate on its deck.

**Mission 11 — "Sugarloaf Lens"** — the cable-car platform. Mini-game:
**TELEPHOTO** (this one is played in the 3D world). Vi's camera: drag to aim
through the scope, pinch or slide to zoom, hold the target in the ring until
it focuses, tap the shutter. Three photographs: the crate, the freighter's
name, and Kolya on the quay (with a coconut).

> **Intel 11**: *Photographs: the crate is stencilled "ZIMA STATION"; the
> freighter is the "SEVERNAYA"; Kolya is in Rio. Vi: "Zima means winter.
> Somewhere very cold."*

**Mission 12 — "Pier 9"** — the container yard at night. Mini-game:
**STEALTH YARD**. Top-down, the guards' torch cones sweep, a searchlight
turns; slip between the containers to the crate and plant Vi's tracker.
Spotted and it's back to the fence.

> **Intel 12**: *The tracker on the rocket crate pings from 64°N, 100°E:
> Zima Station, Siberia. The launch is in three days.*

**Chapter close**: Tiago's boat, the freighter's lights going out to sea.

### Chapter 7 — Siberia, Russia. "Zima Station."

**Scene**: a frozen night in the taiga. Snow, black pine trees, a frozen
lake, an aurora rippling green across the sky, a train on a siding, the
fortress of Zima Station in riveted steel with searchlights, and on the pad
behind it the rocket, the Eclipse Engine folded on top.

**Mission 13 — "The Ice Fortress"** — the station office. Natasha gets Rory
in through the boiler room. Kolya has shredded the launch schedule.
Mini-game: **SHREDDER**. Eight strips of a document; drag them back into
order and tape it. The schedule has the abort code on it, four symbols.

> **Intel 13**: *Launch schedule: "ECLIPSE ENGINE. T-minus 10 minutes at
> midnight. ABORT CODE: ☀ ☾ ★ ⚡" (the code is generated fresh each game and
> written in the Dossier).*

**Mission 14 — "Countdown"** — the control room. Madame Eclipse on the big
screen: "Agent Rory. You have come a very long way to watch the lights go
out." Mini-game: **OVERRIDE**, a finale that uses what the player learned.
Ninety seconds on the clock. Stage one: type the abort code from the
schedule on the symbol keypad. Stage two: turn the dial to the frequency
flickering on the screen, safe-cracker style. Stage three: cut the wires in
the order the rules give. The rocket's engines cut out with three seconds to
spare and the Engine slumps back onto its pad.

> **Intel 14**: *The Eclipse Engine never left the ground. Kolya arrested
> (with a pirozhok). Madame Eclipse gone on a snowmobile: "We will meet
> again, little spy."*

**Ending**: back at HQ under the chip shop. Hale, for the first time, smiles.
"The world stays bright because of you, Agent Rory." A medal. Credits over
the world map with the whole route drawn in.

## The intel chain, as a list

| # | Country | Mission | Mini-game | Intel won |
| --- | --- | --- | --- | --- |
| 1 | London | Nothing But the Truth | Lie detector | Fingers Malone, the flat on Baker Street |
| 2 | London | Fingers' Flat | Safe cracker | The letter from "E" and the photo of Madame Eclipse; Venice |
| 3 | Venice | Il Vetraio | Cipher wheel | A 40 m lens for Madame E; the courier wears the golden mask |
| 4 | Venice | Carnival of Masks | Masked ball | Lens ships to Cairo; test on the Great Pyramid |
| 5 | Cairo | The Listening Post | Radio tuner | The test worked; fetch the Eye from the tomb |
| 6 | Cairo | The Tomb of Light | Mirror maze | The Eye of Ra recovered; UMBRA needs the Kaito chip; Tokyo |
| 7 | Tokyo | Kaito Labs | Keypad memory | The chip is gone; the servers remember |
| 8 | Tokyo | Trace the Ghost | Circuit hack | Paid by Marcus Sterling, New York |
| 9 | New York | Sterling's Vault | Lock pick | The ledger: mirror, chip, rocket; Pier 9, Rio |
| 10 | New York | Ticking | Wire cut | Rocket sails Friday, crate marked ZIMA |
| 11 | Rio | Sugarloaf Lens | Telephoto | ZIMA STATION, the Severnaya, Kolya in Rio |
| 12 | Rio | Pier 9 | Stealth yard | 64°N 100°E, Siberia; launch in three days |
| 13 | Siberia | The Ice Fortress | Shredder | The launch schedule and the abort code |
| 14 | Siberia | Countdown | Override | The Engine grounded; Eclipse escapes |

## Mini-game rules (the design)

Every mini-game follows the same shape so the player always knows where they
are: Aunt Vi explains it in one or two text boxes, the game runs full screen
with a big HINT chip and a QUIT chip, failure gives a hint and another go with
no penalty, and success slams the INTEL WON stamp and reads the intel aloud.

- **Lie detector** — six statements, TRUTH / LIE buttons, a scrolling
  polygraph strip with two pens. Truth: smooth, slow waves. Lie: sharp
  spikes and the portrait sweats. Later lies spike less obviously.
- **Safe cracker** — drag around a dial (0–99). A stethoscope meter and a
  tick that grows as the dial nears the number. Land on it and a tumbler
  light turns green; tap SET. Three numbers; the handle turns; the door
  swings open.
- **Cipher wheel** — outer ring fixed, inner ring drags. The decoded text
  updates live. Two messages with different shifts. A crib word helps.
- **Masked ball** — sixteen figures generated from mask colour, feather,
  cloak, hat and prop. Clues arrive one by one. Tap to accuse.
- **Radio tuner** — a needle on a band, static that fades with distance, a
  decoy station, then the message spoken by the villain.
- **Mirror maze** — a grid, a beam, mirrors that rotate on tap, stone blocks
  that stop the beam, a target. Levels are generated from a solved path and
  then scrambled, so they are always solvable.
- **Keypad memory** — three-by-three keypad, sequences of 3, 4 and 5.
- **Circuit hack** — a grid of pipe tiles (straight, corner, tee) that rotate
  on tap; current lights the connected tiles; two boards.
- **Lock pick** — five pins, a bouncing marker, a green zone, speed rising.
- **Wire cut** — five wires, a display value, a light, three rules; three
  devices on one sixty-second clock.
- **Telephoto** — in the 3D scene: scope overlay, zoom, sway, focus ring,
  three targets.
- **Stealth yard** — top-down, drag to move, torch cones, a sweeping
  searchlight, containers for cover, the crate as the goal.
- **Shredder** — eight strips of a generated document; drag to reorder.
- **Override** — the abort code keypad, then the dial, then the wires, on one
  ninety-second countdown.

## Controls

- **Move**: left thumb anywhere on the left half of the screen (a floating
  stick).
- **Look**: drag anywhere on the right half.
- **Interact**: walk up to a glowing station or a person and tap the big
  green button that appears, or tap them directly.
- Mini-games are touch-first: drag, tap, that's all.
- Keyboard for testing on a desktop: WASD, mouse drag to look, E or click to
  interact, Esc pauses.
