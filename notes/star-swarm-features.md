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
