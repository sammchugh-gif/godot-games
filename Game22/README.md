# Agent Rory: Spectrum

Game 22, and the fourth Agent Rory game: somebody is stealing colour.
Baroness Grisaille, the Collector of Colour, is draining the world's brightest
places grey and hanging their colours in jars in a gallery in the sky. Rory
and PALETTE, a chameleon robot who can be any colour she likes, paint them
back, place by place, from a fishing harbour in Ireland to a flying grey
gallery over the Namib desert.

Play it at `docs/agent-rory-spectrum/`, or from Agent Rory HQ on the shelf
(FILE 004). Twelve places, sixty missions, complete and tested. The story is in
[STORY.md](STORY.md) and every line in the game is in [SCRIPT.md](SCRIPT.md).

## The idea

Every place starts grey. Not the menus: the world. The ground, the houses,
the sky, the sea and the people in it are drawn without their colour, all but
a bubble round Rory and PALETTE, who are made of it. Win a mission and a
circle of the world comes back, with a rainbow ripple running out from the
beacon. Win the last mission in a place and the whole place floods with
colour. The music does the same: a grey place hums, a coloured place plays.

## What's new compared with Zero Gravity and Deep Red

- **The colour itself.** One extra step in every material's shader, the sky's
  and the sea's too, grades the world to grey outside the spheres of colour
  that have been won back, with a moving rainbow edge while a sphere grows.
  It works on every quality setting, and it costs almost nothing.
- **Twelve places nobody in the other games has been to**: Dingle, Lisbon,
  Guatapé, the Salar de Uyuni, Lapland, Petra, Hội An, the Avenue of the
  Baobabs, Samarkand, the Plitvice lakes, Sossusvlei and the Monochrome, each
  built from a new kit: painted house fronts with zócalos and azulejos, a tram
  on rails that stops at its stops (and can be ridden), paper lanterns and
  lantern boats, baobabs you can land on, a salt-flat mirror with flamingos in
  it, the northern lights, the sandstone of the Siq and the Treasury, tiled
  domes and minarets and portals, waterfalls and boardwalks, spice sacks and
  hanging silks, an airship, and a gallery of grey paintings.
- **PALETTE**, a chameleon partner built from shapes rather than a shared
  model: her skin is whatever hue she feels like, she cycles the rainbow when
  she dances, her eyes wander on their own, her tongue flicks, and she fades
  to nearly nothing for a sneak.
- **The Blotters**, Grisaille's robots: grey blobs with a mop in the top. Splat
  one and it goes the colour of the paint, swells, and pops into confetti.
- **New mission kinds**: the mixing desk (mix red, yellow, blue and white to
  match a swatch) and the colour lock. Search (find the things that still have
  colour), rainbow runs (six gates in spectrum order), a sky-lantern flight and
  rides on the roof of a moving tram are still in the code, but those missions
  are puzzles now.
- **New rides**: the number 28 tram, a husky sled, a camel and a zebu cart,
  all on the same real suspension as the karts, with legs that trot.
- **A band for every country.** The music is written by a small composer
  from a seed: Irish whistle and bodhrán in Dingle, fado guitar in Lisbon,
  accordion and cumbia in Guatapé, panpipes and bombo on the salt, kantele in
  Lapland, ney and darbuka at Petra, đàn tranh and gong in Hội An, valiha in
  Madagascar, dutar and doira in Samarkand, tamburica at the lakes, kalimba in
  the dunes. Each band plays in layers (pad, bass, drums, plucked chords,
  lead) that open one by one as the colour comes back to where Rory stands.

## Spy clues

Every place is a few **puzzle missions** and **one action mission** (a chase, a
sneak, a boss and so on), like Operation Eclipse and Meltdown. Spectrum has 60
missions, five in each of its 12 places. Of those, 41 are puzzle missions, 7 are
the older panel puzzles (4 mixing desks and 3 colour locks) and 12 are action. So
48 missions in 60 are something to work out.

A puzzle mission starts at a beacon like any other. Rory walks up, hears the
briefing, and the puzzle opens. Each one has a level from 1 to 4, and the levels
rise through the game. The line-ups catch Grisaille's lookouts: one in Dingle,
and one on the salt with a map that has a red circle round Lapland. The coded
notes spell out the rest of the trail: LOT on the stolen drops in Lisbon, the
TENT at Petra, MONOCHROME on Grisaille's plans, and the VAULT at the very end.

**Intel.** Every mission wins a piece of intel. After the last lines of the
mission, a card says INTEL WON and the intel is read aloud. Put together, the
intel is the story: what Baroness Grisaille is up to, and where to go next.
**DOSSIER** in the pause menu lists all the intel won so far, place by place,
with the stars for each mission.

**HINT and LEAVE.** A puzzle mission has two buttons at the top. HINT gives the
strongest help the puzzle has, and reads it out. LEAVE walks away, and the
mission waits to be tried again. A wrong answer never fails the mission: it
gives a hint, and a stronger one after the second try. Three stars means no hint
and at most one slip. Two stars allows one hint and up to four slips. 🔊 reads
the question out.

The puzzles are made from the story. Spectrum's own nine are colour count, paint
by numbers (each square's sum picks its paint, and a picture appears), mirror
painting (paint the other half), fractions (paint a half, a quarter, a third;
which one shows it?), Lisbon's and Samarkand's tiles (which tile fills the gap?),
the paint shop (two pots for exactly the money), grey shadows (which shape made
it?), the colour square (every colour once in each row and column) and the drop
chart (a pictogram, each picture worth 2, 5 or 10). They make 29 of the puzzle
missions. Only three kinds are in every Agent Rory game, because every spy needs
them: the line-up (pick the suspect who fits every clue), the coded note (a
number or symbol code, in this game's own symbols) and the spy map. Here there
are 4 of each. So no two games share more than a quarter of their puzzles.

All of it is for a seven-year-old. Each puzzle is made fresh every time, with
exactly one answer.

- `js/clues.js` is the same file in all four newer Agent Rory games. It has the
  frame every puzzle shares, the three spy clues, the `PuzzleMission` class that
  makes a puzzle into a mission (with HINT, LEAVE and the stars), and the intel
  card and the dossier.
- `js/puzzles.js` is this game's own puzzles.
- In `js/story.js` a puzzle mission is `kind: "puzzle"`, with `p` the kind of
  puzzle, `lv` its level and, for a code, `word`. Every mission has
  `intel: { title, text }`.
- `js/cluemap.js` now only keeps `THEME`: this game's words, names and code
  symbols for the puzzles. Its `CLUES` is empty, so no mission ends in an extra
  clue any more.

From the top of the repository, `node tools/cluecheck.mjs` checks every game. Each
puzzle mission must name a real kind, a level from 1 to 4 and real speakers.
Every mission must win intel. Each place must have at most five missions and
exactly one action. At least three missions in four must be puzzles, every one of
a game's own kinds must be used, and no two games may share more than a quarter
of their kinds. `node tools/cluetest.mjs` makes hundreds of each puzzle at each
level, checks each has one answer, and has the autopilot solve them at phone and
tablet size.

## Controls

Drag to look, stick or WASD to run, JUMP (space) to jump; the watch fires
paint with USE (E). In the water JUMP rises and DIVE (Shift, C or the wheel)
sinks. On a tram, sled, camel, cart, jeep or buggy the stick steers and JUMP
boosts. In the sky lantern, hold JUMP to rise.

## Tools

- `node tools/levelcheck.mjs [place,...]`: builds every place and checks
  nothing that has to be reached is buried.
- `node tools/missions.mjs [id,...]`: starts each mission and lets its
  autopilot play it; a mission the autopilot has to teleport for is a level
  bug.
- `node tools/flow.mjs`: the whole game from the title, with screenshots.
- `node tools/look.mjs out place x,y,z,lx,ly,lz`: a screenshot from a fixed
  camera; `node tools/icon.mjs` draws the icon; `node tools/storydoc.mjs`
  writes SCRIPT.md (every line, each puzzle's kind and level, and the intel).
- `./publish.sh` copies the game into `docs/agent-rory-spectrum/`.
