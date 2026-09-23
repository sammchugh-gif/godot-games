# Pinball Quest

Four real-looking pinball tables for the iPhone's and iPad's browser: a
soccer stadium, a dog park, a blocky mine and a wizard school. Each has its
own toys, modes, multiball and five missions to earn stars, and the family's
best scores are kept for every table.

Play it at <https://sammchugh-gif.github.io/godot-games/pinball-quest/>. On the
iPhone or iPad, open the link in Safari, then Share → Add to Home Screen. Best
held upright; sideways works too, with the score display beside the table.

## How to play

- **Tap the left half** of the screen for the left flipper, **the right half**
  for the right one. Hold a flipper up to catch the ball and aim.
- **Hold the right side** while the ball sits in the shooter lane to pull back
  the plunger, and **let go** to launch it. Let go in the green part of the
  bar and the ball drops into the lit top lane: a **skill shot**.
- **Flick a finger up** the screen to nudge the table. Nudge too often and it
  warns you, then tilts and the ball is lost.
- Keyboard: Z or Left for the left flipper, / or Right for the right, Space
  or Down for the plunger, Up to nudge, P or Escape to pause.

The score display at the top is a dot-matrix panel like an arcade machine's.
Every few seconds its bottom line says what to shoot next.

Easy mode (on the table's card, on by default) lights both kickbacks at the
start of every ball and gives a 20-second ball save.

## The tables

| Table | Toys | Modes |
| --- | --- | --- |
| **Goal Rush** (soccer) | A goal with a net and a keeper who shuffles across it, soccer-ball pop bumpers, the defenders' wall (drop targets), two ramps, a corner-flag spinner, the stands and floodlights | Knock down the wall, beat the keeper: GOAL. Two goals start Penalty Multiball; ramps are jackpots, the goal the super jackpot. Four orbits give an extra ball. |
| **Puppy Park** (dogs) | A dog who wags and bobs behind his bowl, the doghouse, fire-hydrant pop bumpers, bone drop targets, the walkies ramp, a frisbee spinner, a squirrel | Hit the bowl three times to feed the dog, which opens the doghouse lock. Two locks start Fetch Multiball. All the bones knocked down is a treat. |
| **Block Mine** (mining) | A stone golem that shuffles along the top, slime-cube pop bumpers, diamond-ore drop targets, a TNT alcove, the minecart ramp with rails, a pickaxe spinner | Three diamonds make a diamond pickaxe: double score. Blow up the TNT twice for TNT Multiball. Hit the golem five times to beat it. |
| **Wizard Academy** (magic) | A castle gatehouse, a bubbling cauldron, crystal-ball pop bumpers, spell-book drop targets, the broomstick ramp, a wand spinner, an owl, floating candles | Knock down the four spell books to learn a spell and cast it at the castle: Levitate (the ball floats), Sparkle (double score) or Shield (ball save). Stir the cauldron three times to brew a potion, then shoot it for Potion Multiball. |

Every table also has three top lanes (light all three to raise the bonus
multiplier), kickbacks in both outlanes, combos for ramps and orbits made one
after the other, and a ball save at the start of each ball.

Block Mine and Wizard Academy are the game's own designs in a blocky mining
style and a magic-school style; neither uses anyone else's names, characters
or artwork.

## Missions, stars and the shop

Each table has five missions, shown on its card and on the apron. Each one
done is a star, kept the moment it happens. Games earn coins (one for every
100,000 points, ten for each new mission), and the shop sells:

- **Balls**: chrome, gold, a soccer ball, a tennis ball, pixel block, crystal,
  moon rock, rainbow and a fireball. Some need a number of stars first.
- **Power-ups**, used up when a game starts: Ball Saver+ (a 30-second ball
  save on every ball), Magnet Save (pulls one ball back out of an outlane),
  Extra Ball (four balls instead of three).

## The family

Sophia, Rory and Dylan each start with their own profile; **Add player** makes
more, up to six. Each player has their own coins, stars and balls, and every
table's card shows the family's three best scores.

The **Daily Challenge** is one table a day, the same for everyone, with one
ball. The family's scores for the day are on its card.

## How it looks real

The table is built in 3D with three.js, to a real machine's measurements in
millimetres: a lacquered playfield painted with the table's artwork, chrome
posts with rubber rings, pop bumpers that flash and duck, clear plastic ramps
on posts, wire returns, drop targets that sink, a plunger, the apron with its
rules cards, and a wooden cabinet with a lockdown bar. One overhead lamp
throws real shadows, the inserts light from underneath, and the chrome ball
reflects the table itself: once a table is built, a camera at its middle
photographs it all round, and that picture is the ball's mirror.

If frames keep arriving late, the game drops the shadows, then some
sharpness, and carries on at full pace.

## How it is checked

The tables, the physics and the rules are pure (no clock, no screen, no
`Math.random`), so `tools/pinballcheck.mjs` lifts them out of the page and
plays them with a robot:

- **Traps**: a few hundred balls on every table, plunged at random, with the
  robot flipping at whatever comes near. A ball that stops somewhere it is not
  meant to be, or leaves the cabinet, fails the table.
- **Shots**: a ball fed down each inlane and flipped at every timing, rolling
  and from a cradle. Every ramp, scoop and orbit must be makeable.
- **Games**: whole games with the rules - length, score, and how often each
  mission gets done.

The physics steps 960 times a second, so a ball at full speed moves less than
a quarter of its own size between steps and cannot pass through a wall.

    node tools/pinballcheck.mjs            every table
    node tools/pinballcheck.mjs goal 400   one table, 400 robot balls

The version is printed small in the corner of the title screen, and on the
title screen the game asks the website whether there is a newer one.

`docs/pinball-quest/` is the published copy; this folder mirrors it. three.js
(MIT licence) is vendored as `three.module.min.js` and `three.core.min.js`.
