# Star Swarm: the retention features, and how to roll each one back

Three features were added after the six-sector game was finished, each in
its own pull request and each behind a switch in the game file. The main
branch as it stood before any of them landed is kept as the branch
`rollback/star-swarm-before-features`.

## The switches

At the top of `docs/star-swarm/index.html` (mirrored in `Game10/index.html`):

    const FEATURES={evolve:true,modes:true,shop:true};

Set one to `false`, copy the file over its mirror, commit, and that feature
is gone from the game while everything else stays. Saved data is not
touched: a switched-off feature's records simply stop being shown.

| switch   | feature                                  | pull request |
|----------|------------------------------------------|--------------|
| `evolve` | weapon evolutions                        | #82          |
| `modes`  | endless mode and the daily run           | #83          |
| `shop`   | the hangar shop                          | #84          |

## Rolling a feature back entirely

Each feature is one squash commit on `main`, so `git revert <sha>` removes
it cleanly. Revert in reverse order if removing more than one.

## Rolling everything back

    git checkout main
    git reset --hard rollback/star-swarm-before-features
    git push --force-with-lease origin main

That returns Star Swarm to the state it was in after "sector 1 is a first
sector again" (#81), with none of the three features.

## What each feature is

### Weapon evolutions (`evolve`)

A weapon at full rank, held with the upgrade it pairs with at rank two,
evolves at the next chest (every boss drops one). It keeps its slot and gains a new name,
colour and a good deal more of what it did. The level-up card for a
weapon's last rank names the upgrade it needs; an upgrade's card names the
weapon it would evolve. When the pair is complete the game says so.

| weapon        | needs          | becomes       |
|---------------|----------------|---------------|
| Laser         | Rapid Fire     | Prism Beam    |
| Spread Cannon | Power Core     | Starburst     |
| Drones        | Turbo Engine   | Drone Swarm   |
| Missiles      | Tractor Beam   | Warhead Salvo |
| Space Mines   | Thick Hull     | Minefield     |
| Plasma Wave   | Shield Cells   | Nova Pulse    |
| Black Hole    | Scanner        | Singularity   |

An evolution counts as three ranks toward how hard the swarm and the bosses
come, so an evolved build is not a free one. Each is tuned to about twice
the damage of the plain weapon at full rank into a ring of targets, measured
by the same test; Nova Pulse reaches a quarter further than the plain wave
and no further, after a first cut that hit the whole screen.

### Endless mode and the daily run (`modes`)

A mode row sits above the difficulty row on the title screen (beside it on
a phone held sideways).

**Endless.** Past the sixth gate the sectors keep coming: sector 7 is the
Ringed Giant again with its music, the bosses come round a third time as
MK III, and the swarm keeps scaling with the clock. It has its own best
score, sector and time per ship and difficulty.

**Daily.** The campaign with one twist chosen by the date, the same for
everyone that day. The run's dice (rocks, spawns, cards) are seeded by the
date, so two runs on the same day fall the same way. The day keeps a board
of its best five runs, any ship, shown on the end screen; the title shows
today's best and the run count. The seven twists:

| twist        | what it does                                        |
|--------------|-----------------------------------------------------|
| DOUBLE GEMS  | every gem is worth two                              |
| GLASS CANNON | double damage, half the hull                        |
| NO SHIELDS   | no shield at all, but half again the hull           |
| SWARM TIDE   | far more aliens, each far weaker                    |
| BOSS RUSH    | the boss comes at one minute, the gate right after  |
| TURBO        | you are faster, so are they                         |
| TREASURE DAY | three elite chests a sector instead of one, gems fly from far away |

With the switch off the mode row disappears and every run is a campaign
run; endless and daily records stay in storage untouched.

### The hangar shop (`shop`)

Every gem picked up in a run is banked when the run ends, won, lost or
quit. The bank is shown on the SHOP button on the title and buys small
permanent upgrades, applied to every run from then on:

| upgrade         | levels | each level                       | cost per level          |
|-----------------|--------|----------------------------------|-------------------------|
| Reinforced Hull | 5      | +8 max hull                      | 200, 400, 700, 1100, 1600 |
| Shield Bank     | 5      | +4 max shield                    | same                    |
| Weapon Tuning   | 5      | +4% damage                       | same                    |
| Engine Trim     | 3      | +3% speed                        | 200, 400, 700           |
| Gem Polish      | 3      | +8% XP from gems                 | 200, 400, 700           |
| Head Start      | 1      | every run starts at weapon rank 2| 1200                    |
| Escape Pod      | 1      | once a run, survive a killing blow| 3000                   |

The end screen says how many gems the run banked. With the switch off the
SHOP button is gone and the perks do nothing; the bank and the purchases
stay in storage for when it comes back.

The shop's second tab sells three more ships. The first three (Viper,
Thunderhead, Hornet) are earned by playing as before; these are bought:

| ship     | weapon      | ability                                                          | cost |
|----------|-------------|------------------------------------------------------------------|------|
| Ghost    | Missiles    | Phase shift: a hit makes you untouchable for 1.6 s and throws the swarm back | 2500 |
| Glacier  | Plasma Wave | Frost hull: what touches you is slowed 2.5 s; shields recharge 1.5x | 3500 |
| Magnetar | Black Hole  | Gravity well: gems from twice as far, 15% more XP                 | 5000 |

A seventh, the Eclipse (space mines; deflector hull: scouts and swarmers
bounce off without hurting you), is earned by clearing all six sectors.

The hangar shows one ship at a time behind arrows. Each ship carries three
marks out of five, and the run's numbers come from them: speed 90% to
120%, damage 90% to 120%, shield 20 to 60. The Eclipse alone is 5/5/5.

| ship        | speed | damage | shield | hull |
|-------------|-------|--------|--------|------|
| Viper       | 4     | 3      | 2      | 90   |
| Thunderhead | 3     | 4      | 1      | 100  |
| Hornet      | 1     | 3      | 5      | 130  |
| Ghost       | 5     | 3      | 2      | 85   |
| Glacier     | 2     | 2      | 4      | 110  |
| Magnetar    | 3     | 4      | 3      | 95   |
| Eclipse     | 5     | 5      | 5      | 100  |

A ? beside the mode row opens a WAYS TO PLAY screen that explains the
three modes, today's twist, and the marks.
Ships not yet earned show as one generic grey hull with a question mark,
named ???, with ???? in place of their marks and hull, on the title and in
the shop. Only the price or the unlock condition shows, so what a ship is
stays part of the prize.

Ship ids are unchanged from the original three, so old records still
attach to the right ship after the renaming.

## Rations

Chests, nukes and repairs are rationed per sector, so none of them is
cheap. The counts reset at every gate.

| pickup  | per sector                  | plus            |
|---------|-----------------------------|-----------------|
| chest   | 1 from elites (3 on Treasure Day) | 1 from the boss |
| nuke    | 1                           |                 |
| repair  | 3                           |                 |
| tractor beam | 3                      |                 |

A drop that lands on a spent kind drops nothing. The numbers are
`RATION` in the game file and the chest cap in `killEnemy`.

## Balance, and how it is measured

`tools/playbot.mjs` plays whole runs with a plain bot (backs away from
anything close, sidesteps bolts, flies to the gate, collects gems and
pickups, keeps a boss at range, takes a card at every level, weapons
first) and reports the shape of each: level and ranks at every gate,
evolutions, hull lost, boss fight length, how it ended. The targets the
game is tuned to, and where it stood after the September pass:

| difficulty | target                    | measured (bot)                          |
|------------|---------------------------|-----------------------------------------|
| easy       | won about half the time   | 6 of 8 won; deaths in sectors 5 and 6   |
| medium     | won one run in five       | 2 of 8 won; deaths in sectors 1 to 5    |
| hard       | rarely won                | 0 of 6; every run ends at the sector 2 Kraken |

Levels at each gate on easy: 8 to 12, 13 to 19, 16 to 27, 20 to 32,
23 to 36. First evolution in sector 3 or 4. Hull lost per sector 40 to
70% of the pool, so every sector costs something and none is a wall.
Endless reaches sector 8 to 10 by minute 40.

What the pass changed, and why:

- XP per level is 2.8x the base curve from level six (was 1.2x). The
  build used to be full by sector 2; it fills by sector 5.
- The swarm scales off the clock, not the player's ranks. Scaling off
  ranks made levelling up the thing that killed you: with the build a
  run actually holds, a scout carried 32x its hull by sector 4 and 94x
  by sector 6. Rank terms are a fraction of what they were.
- The spawn rate has a ceiling of nine a second. It reached 27 by minute
  thirty and pinned the field at the 240 cap, which was the wall and the
  source of the turret bolts that ended every run.
- Bosses always end: the rank coefficient on boss hull is 0.05 (was
  0.085), hard's multiplier applies at its square root, the second lap
  is 1.4x (was 1.6x), and a boss alive for 150 seconds can no longer
  hold the gate.
- The enemy cap holds for swarm rings and boss hatches too.
- Turrets: bolts 200 px/s (was 240), one every 3 s (was 2.2), a smaller
  share of the swarm.
- Medium is 1.3x hull and 1.2x rate (was 1.5 and 1.3); hard 1.7x, 1.45x
  and 1.45x damage (was 2.2, 1.65, 1.6).
- An evolution needs its partner upgrade at rank two, so the guaranteed
  sector 1 boss chest cannot evolve a weapon in the first sector.
- The boss arrives at 185 seconds into a sector (was 165). The gate
  opens the moment the boss dies, nine seconds' flight away (1200 to
  2200 px, by the ship's speed), with an arrow on the screen edge and
  the distance pointing to it; the clock's 255 seconds is only the
  backstop for a boss that has held out two and a half minutes.
- When the boss arrives about five in six of the swarm turn and leave
  (it was all of them); the rest stay and fight, so the field gives way
  rather than emptying.

## A quieter HUD

Three changes, all about what the screen asks you to look at.

- The upgrade tiles are a reference, not a readout. They sit at a third
  of their opacity and come up for a moment whenever a rank changes,
  which is the only time they are worth reading.
- The clock was the largest thing on the screen and is not what you are
  watching. It is about two thirds the size, and for the first four and a
  half seconds of a sector the realm's name stands in its place. The
  middle of the top row is measured against the level on the left and the
  kills on the right rather than taking a fraction of the width, because
  "THE SHATTERED MOON" beside "LV 100" and "9999" fits in neither.
- Damage used to put a sheet of red over the whole screen, hiding the
  ship at the moment you most need to see it. It comes in from the edges
  now, as a vignette.

## The vitals dial

Hull and shield were two bars stretched across the bottom of the screen,
which is where a thumb sits. They are one dial in the bottom-left corner
now: a thin outer ring for the shield, a thick inner ring for the hull,
both sweeping three quarters of a turn from the lower left, and the hull
in figures in the middle. Under 30% the hull ring goes red and the dial
pulses. The upgrade tiles get the rest of the width and wrap as before.
One `HUDBOX.vitals` replaces `hull` and `shield`.

## Filling the screen on a phone

A phone showed the game drawn into the top of the screen with a dead band
under it: iOS had grown the viewport and the page never heard, so
everything was laid out for a screen that was no longer there. Three
changes, all in `resize`:

- the size comes from `visualViewport` when there is one, not the layout
  viewport, so hidden browser bars are accounted for;
- the canvas is `position:fixed` and given its size in pixels rather than
  a percentage of a body that may itself be wrong;
- every resize notice is taken twice more on a short delay (the event can
  arrive before the numbers behind it settle - measured, not guessed),
  and `sizeWatch` re-checks every fifth frame and repairs the canvas if
  anything, including the backing store, has drifted.

Two more things the page does not own, both of which read as the game
being cut off at the bottom of an iPhone. In a browser tab iOS keeps a
strip along the bottom of the screen for its collapsed toolbar and fills
it with the page's own background colour, so a sky that ends on a
nebula-tinted blue showed a step where the flat page ground began: the
page is now kept the colour the canvas ends on, sampled from its bottom
edge twice a second, whatever the game is showing. And the home
indicator lives inside that strip while iOS still reports a bottom
inset, so honouring it left the game floating a finger's width above the
screen; the inset is only honoured when the page owns the whole screen,
which `navigator.standalone` answers.

`tools/hudcheck.mjs` proves it: the canvas must cover the visual viewport
as the page loads, when the screen grows, turned sideways, and after
something resets the canvas out from under it.

The same three changes are in every other game that fills the screen with
a canvas - Slime Storm, Dungeon Dash, Turbo Karts, Riddle Rumble, Super
Strikers, Marble Mayhem, Tank Tussle - with the watchdog on a timer
rather than the frame loop. Paws of Fury letterboxes a fixed stage and
already re-measured; it only needed to read the visual viewport.
`tools/fitcheck.mjs` checks all nine.

## Cards that fit, and the hole that is not a gate

`textFit` used to stop shrinking at eleven pixels and then let the line
run on out of its box, which is how an evolution line walked through the
side of a phone card. It now squeezes the glyphs to the width it was
given once shrinking runs out, so a fitted line can never be wider than
its box; `wrapFit` ellipsises a description that is a line too many and
puts every line through `textFit`. On a screen narrow enough that three
cards would be under 150 px wide, the level-up cards become rows across
the screen instead: icon at the left, name and level on one line, the
rest under it. `drawPanel` returns where its words end so the cards start
below them rather than on top, which a phone held sideways needed.

`tools/hudcheck.mjs` renders the level-up screen at four sizes with the
worst cards the game can offer and reads back every line `textFit` drew:
none may be painted wider than its box, and none squeezed below 72% of
its natural width.

The Black Hole weapon and the warp gate are both holes and must not be
confused. The gate is wide and calm: violet rings, fat orange-lit arms, a
thin white eye. The weapon is small and violent: matter drawn into
threads that run cold indigo at the rim and white-hot at the throat,
wound in by two counter-turning copies of one baked sprite, a hard white
photon ring with one side beamed bright, a lensing arc behind it, and
streaks still falling in from outside.

## The warp

Flying into the gate is a cutscene in three acts, all drawn on the same
canvas with no library. The dive (1.2 s): the camera pushes in on the
black hole and the ship spirals down into it, shrinking, while the field
is wiped in a burst of dust. The tunnel (2.6 s): a wormhole drawn in
perspective, rings and wall streaks projected by depth, dressed for the
sector it comes out in - amber ring shards for the Ringed Giant, a
twisting steel duct for the Alien Fleet, fire rings with licks for the
Ember Star, rolling hexagons for the Hive, tumbling rocks for the
Shattered Moon, spiral arms for the Black Hole - with the next realm's
backdrop growing at the far end. The exit (0.5 s): the ship climbs off
the top of the screen the way it leaves the hangar, and the next sector
opens with it flying in from the bottom (the arrival that already
existed). On the last gate of the campaign the dive is the ending. The
look table is `WARP_LOOK`, the timings `WARP`.

In the tunnel the ship is a solid, not the sprite: `shipMesh(shape)` lofts
a hull from a row of cross-sections, adds wings and fins as thin plates and
a glass canopy (the Eclipse is a disc turned on a lathe), winds every face
outward once, and `drawShip3D` paints it far to near with a perspective
projection, lit from the upper left, engines glowing. The flat ship tilts
into the tunnel over the first half second and rolls into the bends. The
warp has sounds of its own: `warpDive`, `warpRun`, and the launch for the
exit.

`window.SW.halt()`, `step(dt)` and `resume()` stop the frame loop and step
it by hand, so a checker can catch a cutscene at an exact moment. The
frame already queued when `halt()` is called still runs, and on a slow
renderer it can land a second later, so wait before drawing by hand.

## The bonus run

Clear all six sectors and the last gate's tunnel is a level of its own:
forty-five seconds down the wormhole in perspective, the look changing
every seven and a half seconds through all six realms, the stick steering
the solid ship across the tunnel while its guns fire ahead on their own.
Aliens fly at you and weave toward you; each kill pays 100 times a combo
that grows with every kill in a row. Meteoroids tumble down the tunnel:
dodge them, or shoot them three times for 30 times the combo and a gem.
A rock on the hull costs 15% of it and the combo, an alien 10%, and a
hull that runs out ends the run early; gems pay 20. What it earns goes on
the run's score before the win screen, which says so. Timings, speeds and
the rate of fire are in `BONUS`; `swarmcheck` feeds it aliens, rocks and
a gem and checks the arithmetic, then plays it out to the win.

Clearing a sector no longer hands out a free upgrade card; the gate still
restores shields and a quarter of the hull.

## Music

Six sector tracks, a title theme, and a boss piece. The boss piece is a
phrygian riff at 150 bpm over a bass on every eighth, double kicks and a
drone, played in whichever key the sector was in, so a boss changes the
mood and not the song. Once the boss is down the sector's own track comes
back at ease until the gate: 12% slower, a kick on the one and no snare,
bass on the downbeats only, the lead softer and longer, the pad up. The
gate sparkle still rides on top when it opens. Sector 2 ("fleet") was
rewritten as a dorian piece at 126 bpm with a melody that moves; the old
one hammered its root over a hat on every sixteenth.

Every track is a thirty-two bar form rather than eight bars looped: the
tune, the tune with a harmony a third above, a second tune over its own
chords (`lead2`, `chords2`), then the tune doubled an octave up with a
snare fill into the top. The title theme and the boss piece have second
tunes too.

`tools/musiccheck.mjs` renders each track offline and checks the boss
piece is faster and louder than every sector with its own melody, and the
calm mix is quieter with fewer notes than the fight.

To re-measure after any change:

    PLAYWRIGHT=... node tools/playbot.mjs --dif easy --mode campaign --runs 4


## Reading the screen on a phone

The canvas is sized from the visual viewport, which is the right measure in a
browser tab because it shrinks to make room for Safari's toolbars. A Home
Screen app has no toolbars, so the layout viewport is the whole screen; when
it reads taller than the visual viewport, `screenSize()` takes the larger of
the two.

The pause screen prints the raw numbers along the bottom: the window, the
visual viewport, the screen, the layout viewport, the canvas element and its
backing store, the safe-area insets, whether the page thinks it owns the
screen, and the pixel ratio. Two taps from play, so it works in a Home Screen
app where a query string is awkward. `window.SW.geom()` returns the same text.

On an iPhone 16 Pro Max saved to the Home Screen they read:

    win 440x894  vv 440x894  scr 440x956  doc 440x894
    cv 440x894 @0  buf 880x1788  safe 62/34  own 1  dpr 2

Every measurement of the viewport agrees at 894, which is the 956-point screen
less a 62-point status bar, while the safe-area insets still report that same
62 points at the top. The two halves disagree: the insets describe a
full-screen web view, the viewport describes an inset one. The canvas obeys
the viewport, stops short, and the bare page shows through underneath.

That combination comes from asking for `apple-mobile-web-app-status-bar-style:
black-translucent`, so the page asks for the default status bar instead. The
web view then matches the viewport it reports, and the 62 points the HUD was
holding clear of the notch come back as usable screen.

## Sectors 5 and 6 on easy

Easy runs were reaching the last two sectors and dying there. The play bot
says what is doing the killing: on a four-run sample it put down every boss up
to sector 5 in between ten and fifty seconds, then took 461 damage in sector 6
against a 185 hull. Late runs end on the swarm, not on a boss that will not
fall.

So from sector 5 on, and on easy only, the swarm and its bosses hit 15% softer
(`LATE.dmg`) and carry 10% less health (`LATE.hp`) - the larger cut on the side
that is actually doing the killing, the smaller one to shorten the fights.
Medium and hard are untouched. `swarmcheck` holds the clock and the build still
while it spawns one of each at sector 4 and again at sector 6, and checks both
halves land and that medium sees none of it.

## Two skins

The same game, drawn two ways, chosen from a switch in the top-right corner of
the hangar and remembered between runs.

**CLASSIC** is the painted art: gradients, lit hulls, a nebula behind
everything. **VECTOR** is the 1980 arcade cabinet: nothing filled, every shape
an outline with a phosphor halo, a true black void, and scanlines over the
whole screen.

The rule the skin obeys is that it touches drawing and nothing else. There is
no balance, timing or hit box anywhere in it - `skincheck` renders the same
pinned scene in both skins and checks the boss comes out with the same health,
the same damage and the same radius either way, while the picture itself
changes past recognition (around nine tenths of the vector frame is black
against a twentieth of the classic one).

How it is built: `VEC()` answers which skin is on, and the sprite builders
(`enemySprite`, `bossSprite`, `shipSprite`, the rocks, the hole and the gate)
hand over to a vector twin at their first line. Everything drawn live rather
than baked - gems, bullets, pickups, drones, exhaust, eyes, health bars - takes
a branch at the point of drawing. Sprites are cached per skin, so switching
throws the cache away and rebuilds through `artReset()`.

Two things in the skin cost frames, and both ride with `FX`, so a device that
is already dropping frames loses them rather than stuttering: the scanline
pattern over the screen and the wireframe landmark turning in the distance.

The menus go with it. A wireframe game behind painted buttons looks like two
games, so in vector the logo is cut as hollow letters with a phosphor halo and
a wireframe ring through them, and every box on every screen - mode and
difficulty rows, the ship card, upgrade cards, the shop, the buttons, LAUNCH
itself - becomes a black hole in space with a glowing outline round it, drawn
by `vbox()`.

One thing that fell out of this: buttons that exist only as hit boxes laid over
something already drawn (a difficulty segment, an upgrade card, the whole
credits screen) used to be given a transparent fill and a transparent stroke,
which drew nothing by luck rather than by intent. They now say `ghost: true`
and `drawButtons` skips them, which is what stopped the vector skin painting
black over its own labels.

## Four skins

CLASSIC is the painted art. VECTOR is the 1980 cabinet. PIXEL is the eight-bit
port. NEON is the sign in the rain. One button in the top-right of the hangar
cycles them, and the choice is remembered.

VECTOR and NEON are the same drawing - `LINE()` is true for both - and part
company only on palette (`PALS`), on how hard the light bleeds (`GLOWK()`), and
on what is behind them: vector has a void and scanlines, neon has a grid that
slides with the camera and no scanlines at all.

PIXEL was first built by squeezing the finished frame through a small canvas
every frame. That looked right in a screenshot and wrong in motion: the grid
belonged to the screen rather than to the world, so everything crawled and
shimmered as the camera moved, and the colours stayed as painted because there
is no cheap way to quantise a whole frame sixty times a second.

So PIXEL has real art. Every sprite is baked once at full size, shrunk to a
handful of pixels and snapped to a sixteen-colour palette (`PIXPAL`), all of it
at bake time, so the cost per frame is one `drawImage` with the smoothing off.
The backdrop is drawn rather than shrunk: flat ground, square stars and patches
of dithered cloud whose density is smoothed between its corners, because a
dither laid flat across the screen is a chequerboard and one cut on a block
boundary is a wall.

Motion took two goes to get right, and the first diagnosis was wrong. The sky
was not boiling; it was **hopping**. The cell a block belonged to was worked
out from its world position measured against a drifting origin, which pinned
the cloud to the world - no parallax at all - and then shunted the entire field
a full block sideways every time that origin crossed one. Still, hop, still,
hop. A parallax layer is now walked in its own cells, so a cell's identity is
the loop variable and cannot change, and the offset that carries it is
continuous.

Snapping is only ever to the device pixel, never to a block - for the sky, for
the stars and for the camera itself. Snapping the camera to blocks, which the
first fix did, makes the whole world judder three pixels at a time under a ship
that is moving smoothly, which is the same fault wearing a different hat.

`skincheck` measures this rather than taking it on trust: five equal hops must
move the cloud layer by the same small amount each time. The fix gives
-9, -9, -9, -9, -9 samples with the rows matching at 99%; the old code gives
-7, -12, -7, -31, -26, which is what still-then-hop looks like in numbers. There is no bloom and no vignette - an eight-bit machine
had neither, and a soft radial gradient is the one thing that would put
hundreds of colours back on a screen meant to have sixteen.

Two things were sharpened after the first vector build went out. The furniture
had the same double glowing stroke the ships do, which made every menu box read
as slightly out of focus, so `vbox` now draws one crisp stroke and a short
bloom. And the scanlines now only fall over the fight, not over the menus,
where they were softening text that people are trying to read.

The logo went the same way. Hollow letters with a halo round them are a lovely
idea and unreadable at the size a phone gives the title: the glow fills the
counters and the name turns to mush. In VECTOR and NEON the letters are solid,
in the skin's own light, with a dark edge cut round them.

The bloom is capped (`GLOWMAX`), because a sprite is baked into a box and a
halo wider than the margin round the shape clips at the edge - which on the
asteroids drew a visible square of light round every rock.

The dial in the corner takes its colours from the skin too (`VITALS`). Hull and
shield are read at a glance by colour rather than by reading a number, so
leaving them blue-and-green on a magenta screen was the one place the switch
had not reached: neon runs magenta hull against cyan shield, vector the cold
greens and blues of a tube, pixel straight out of its sixteen. `skincheck`
checks no two skins share a pair, and then reads the pixels under the dial in
each of them to prove the pair is actually being drawn rather than merely
declared.

Adding a fifth skin means another entry in `SKINS`, a palette, a vitals pair,
and whatever it does differently; nothing else in the game needs to know.

## Drones

A drone was a nine-pixel triangle, and four to six of them round the ship read
as litter rather than a squadron. Each one is now a little ship in its own
right: a tapered hull lit from the top, two outrigger pods on struts with a
muzzle on each, a dark socket with a hot lens in it, and a nozzle with the
engine burning behind it. It rocks as it flies, and the pods flash for an
eighth of a second after it shoots, which is the only way to tell at a glance
which of them is actually firing.

`droneSprite(evo)` bakes one per rank per skin - the evolved Drone Swarm is the
paler, hotter one - so six on screen cost six `drawImage` calls. The vector skin
gets its own: the same silhouette as an outline with a phosphor halo, a ring
for the lens and a V of flame behind.

The one engine-side change is cosmetic: a drone now carries `fire`, a timer set
when it shoots so the flash has something to read.

## What a gem is worth

Inside a run a gem is worth its full value. That is the levelling curve and
nothing touches it.

Afterwards it is worth a quarter (`BANK_RATE`). Banking every gem in full paid
off the entire shelf - all seven perks and all three ships, near enough thirty
thousand gems - inside four finished runs: the play bot banks about eight
thousand two hundred on a win and around three thousand on a run that dies in
sector 3. A quarter makes the same shelf about fifteen runs of work, while a
run that ends early still brings home enough to buy the cheapest upgrade.

Everything the player is shown is the banked figure, not the collected one, so
the end screen and the shop never disagree. `swarmcheck` holds both halves: a
gem picked up still counts twenty for twenty and still levels the ship, and the
bank still takes exactly a quarter.

## The hangar will not launch a ship you have not earned

You can walk the hangar past a ship you have not earned - that is the point of
the arrows - but the button underneath used to say LAUNCH VIPER over a row of
question marks, and launch the Viper. It is now that ship's button: LOCKED,
with the price beside it when it is a shop ship, drawn cold and flat, and the
tap does nothing. `swarmcheck` dispatches a real finger at it and checks the
hangar is still the hangar afterwards.

## One songbook, four bands

Each skin has its own band playing the same eight pieces. The notes do not
move - a sector's tune is that sector's tune, the boss still borrows the
sector's key, the form is still thirty-two bars - but who plays them, how fast,
how low and how long changes completely. That is four soundtracks out of one
songbook, and it costs a table (`VOICES`) rather than four sets of melodies
that would then have to be maintained four times over.

| skin | the band |
| --- | --- |
| classic | the full lot: sawtooth lead, sawtooth pad, triangle bass |
| vector | a cabinet: three square channels and one for noise, no pad, short stabs, a touch quicker and brighter |
| pixel | NES: a pulse lead over a triangle bass, no pad, every lead note answered an octave up a sixteenth later |
| neon | everything a sawtooth, a fourth lower, slower, notes held long over a pad twice the size |

`musiccheck` renders the same sector in all four and holds them apart: each is
audible and none clips, neon really is a fourth lower (87Hz against classic's
117Hz) and the thickest of the four, vector the sparest, and no two of them
render the same eight seconds.

One thing that is easy to get wrong and was: a slower tempo does not mean
fewer note events. Neon is slower and yet fires more oscillators in the same
eight seconds, because it doubles its lead and carries a bigger pad. The
tempo is read from the kit; the sound is judged on what the sound can show.

## What a skin costs per frame

A skin must not make the game slower. It nearly did: VECTOR and NEON drew every
gem, bullet, pair of enemy eyes and health bar with a live `shadowBlur`, which
is a gaussian blur per draw call - hundreds of them a frame in a busy sector.
On a like-for-like busy frame they cost 1.6 and 1.5 times classic. On an iPad
that is enough to push frames past the time-step clamp, at which point the
fight itself runs slow and the ship feels sluggish - which is exactly how it was
reported: "slower, even with the Viper". The ship's speed never changed; it is
221 units a second in every version.

Now:

- gems and bullets are baked once per tier or kind with their glow in them, and
  drawn as one `drawImage` each (`vecGemSprite`, `vecBulletSprite`);
- everything else drawn live - eyes, health bars, barrels, exhaust, drone
  flashes, kraken arms, the gate, the neon grid, the landmark - glows by being
  stroked twice, wide and faint then thin and bright (`gstroke`), with no blur;
- the neon grid is one path per colour rather than forty separate lines;
- the scanlines are drawn once per screen size and laid over each frame as a
  single copy, instead of a full-screen pattern fill.

Only four live blurs are left, all one-offs: the pause box, the two arcs of the
vitals dial, and the title's LAUNCH button.

`skincheck` times every skin on the same busy frame, with classic timed before
and after (and a warm-up first, since the first busy frame bakes every sprite).
No skin may cost more than 1.45 times classic. The old code measures 1.64 and
1.85 and fails; the new code measures about 0.7 to 1.0.
