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
- **New mission kinds**: search (find the things that still have colour and
  touch them to spread it), rainbow runs (six gates in spectrum order), the
  mixing desk (mix red, yellow, blue and white to match a swatch), the colour
  lock, a sky-lantern flight, and rides on the roof of a moving tram.
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

Rory is a spy, so 45 of the 60 missions have something to work out. Some are puzzles
of their own (the code locks, circuits and the rest above); the other 38 end in a
**clue**: after the action, Rory finds a coded note, a locked case, a line of
suspects or a map, and cracks it before MISSION COMPLETE. The clues make a trail
through the story: the lookout in Dingle, the boatman's tip that sends Rory to the salt, the lookout's map with a circle round Lapland, and the symbol code on Grisaille's plans that spells MONOCHROME.

There are thirteen kinds, all for a seven-year-old: adding, taking away, the 2, 3,
4, 5 and 10 times tables, story sums, balance scales, paying in coins, counting,
numbers in order, what comes next, telling the time, a spy map, a number or symbol
code, and "who is the spy?" (pick the suspect who fits every clue). Each is made
fresh every time with exactly one answer, at four levels that rise through the
game. A wrong answer never fails the mission: it gives a hint, and a stronger one
after the second try, and three slips or more cost one star. 🔊 reads the question
out.

`js/clues.js` is the puzzles (the same file in all four newer Agent Rory games) and
`js/cluemap.js` says which missions end in which clue, with the lines around it.
`node tools/cluecheck.mjs` (from the top of the repository) checks every clue map,
and `node tools/clues.mjs` (run in Game22) makes hundreds of each kind at each level, checks
each has one answer, and has the autopilot solve them at phone and tablet size.

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
  writes SCRIPT.md.
- `./publish.sh` copies the game into `docs/agent-rory-spectrum/`.
