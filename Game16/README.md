# Vine Swing

A one-finger jungle swinger for the iPhone's and iPad's browser. Hold anywhere
and the monkey grabs the vine ring that is glowing; let go and it flies.
Holding on pumps the swing, letting go at the right moment is the whole game.
Sixty levels in six worlds, every one with a name, three stars a level, a new
jungle every day, and every level remembers the family's best run as a ghost
to race.

Play it at <https://sammchugh-gif.github.io/godot-games/vine-swing/>. On the
iPhone or iPad, open the link in Safari, then Share → Add to Home Screen. Any
orientation. One file, no engine.

## How to play

- **Hold** anywhere on the screen: the monkey grabs the glowing ring. The
  dotted line shows which one before you touch.
- **Let go** to fly. Let go on the way up and forward for distance.
- **Hold again** in the air to catch the next ring. A catch keeps your speed.
- **Slide your finger up** while holding to climb the vine, **down** to go
  lower. A shorter vine swings faster, so climbing on the way down the
  swing is how to go really fast. (Keyboard: Up and Down.) A vine is never
  let out so far that its swing reaches the water, and a catch close to a
  ring still gives a comfortable length of vine.
- Holding again too soon after letting go does not re-take the ring you
  just left: the hold waits for the ring ahead.
- Standing on a ledge with nothing in reach, holding hops forward until a
  ring is in reach (the game says so). Standing on a ledge, a hold never grabs a ring behind you.
- Swing into the side of a ledge and the monkey scrambles up onto it. If it
  is ever hanging too far down the wall for that, it climbs its vine.
- Every world also has a thing of its own, worked with the same finger:
  - **Poles** (the Jungle): hold near one to grab it, keep holding to climb,
    let go to leap off forward. Climb higher to leap higher - but not into
    a beehive at the top.
  - **Zip lines** (the Savanna): hold near the rope to take the handle and
    ride it down; let go (or reach the end) to jump off.
  - **Blast barrels** (the Temple): fly into one and it holds you. A barrel
    that swings from side to side fires when you tap - wait until it points
    at the next one. One that does not swing fires by itself.
  - **Springy branches** (the Night Rainforest): land on one, hold to bend it
    (the bar fills), let go to be launched. The longer the hold, the further.
  - **Water wheels** (Misty Falls): hold to catch a peg, ride it round, and
    let go near the top to be flung forward.
  - The Volcano has all of them. Each level leans on one thing - the thing
    it brings in, or one of the world's others - so no two feel the same.
- Splash into the water (or the swamp, the rapids, the lava), touch a thorn
  bush or a bee, and a bubble scoops the monkey up and floats it back to the
  last flag. The clock keeps running.
- Flips in the air are worth two bananas each at the next catch.
- Catch three rings or more in a row without touching a ledge or the water
  and every catch in the combo is a bonus banana. A good let-go (up and
  forward, with speed) gets a NICE! or an AWESOME!
- Keyboard: Space to hold, Up and Down to climb, R to restart, Escape to go back.

## Stars

Each level has three, and they can be earned on different runs:

| Star | For |
| --- | --- |
| Flag | Reaching the finish |
| Gold banana | Collecting all three gold bananas in one run |
| Clock | Finishing under par |

## Worlds

In order of difficulty, as the map shows them:

| World | What is in it |
| --- | --- |
| Jungle Canopy | Bamboo poles to climb (from Bamboo Climb), speed hoops, thorns, bees; butterflies, jumping fish and a crocodile |
| Safari Savanna | Zip lines, poles, a low afternoon sun, mesas, acacias and giraffes, termite-mound pillars, a river with a hippo |
| Temple Ruins | Blast barrels (from Blast Barrels), rings that crumble a moment after you grab them, stone pillars, poles, a swamp |
| Night Rainforest | Springy branches, zip lines, poles, moonlight, fireflies, glowing rings, rain, and glowing crocodile eyes |
| Misty Falls | Water wheels (from Water Wheels), rings that slide back and forth or up and down, barrels, poles, rapids, a rainbow |
| Volcano Peak | All of it, over lava, with fireballs |

A world opens with enough stars in the world it follows on from and a banana
price, paid in the shop. Safari follows the Jungle, the Temple follows the
Jungle, the Night Rainforest follows the Safari, the Falls follow the Temple
and the Volcano follows the Falls.

## The monkey

Drawn side-on with one ink outline round head, snout, tuft and body, tapered
arms and legs, gripping hands, feet with toes, and a tail that trails the way
it is moving. Its face acts: happy, a grin when it is going fast or on a
combo, scared when it is falling at the water, focused when it climbs, dizzy
after thorns. Its eye looks at the ring a hold would take. Each character has
its own touches - the lemur's orange eyes, the fluffy snow monkey and red
panda, the golden monkey's blue face, the space monkey's helmet.

## The family

Sophia, Rory and Dylan each start with their own profile. **Add player** makes
more (up to six). Each player has their own bananas, stars and wardrobe. Every
level's card shows the family's three best times, and the best run ever put in
on a level plays alongside you as a see-through ghost with its owner's name.

The **Daily Jungle** is a new level each day, the same for everyone. The first
finish of the day pays 40 bananas plus a streak bonus.

## Shop

- **Monkeys**: Momo, Lulu the Lemur, Yuki the Snow Monkey, Rusty the Red
  Panda, Sunny the Golden Monkey, Cosmo the Space Monkey.
- **Hats** and **Trails**: looks only.
- **Power-ups**, used up when a run starts: Banana Magnet, Bubble Shield
  (saves you once), Long Arms (grab rings from further away).
- **Worlds**.

## How it is checked

The level builder and the physics are pure (no clock, no screen, no
`Math.random`), so `tools/vinecheck.mjs` lifts them out of the page and plays
every level with a searching robot. It proves each one can be finished and
all three gold bananas reached, measures how wide the let-go timing windows
are, and picked the seeds in the game's `SEEDS` table. It also drops the
monkey in the water past every checkpoint and checks it comes back standing
on that ledge, and that the robot can get from there to the finish. And it
hangs the monkey on the longest dry vine from the ring before each ledge,
beside the ledge's wall, and checks the robot can still get to the finish
without a splash: that is where a child was once stuck.

If frames keep arriving late (an older iPad, a phone saving battery), the
game quietly drops the mist and the shading on the hills and carries on at
full pace.

The robot plays the new things with the same two numbers it plays a vine
with - how long to hold, how long to wait before holding again - so a pole's
climb, a barrel's aim, a zip line, a branch's bend and a wheel's ride are all
searched and proved the same way.

The bouncy mushrooms are gone: they looked like they should do something,
and mostly did not (the ring after one was nearly always in reach anyway,
and a landing off the middle of a cap threw the monkey sideways into the
water).

When the levels changed to bring the new things in, each player's best
times and the family ghosts on the levels that changed were cleared, since a
record set on a different level is one nobody could beat. Stars and bananas
were kept.

    node tools/vinecheck.mjs            all sixty levels
    node tools/vinecheck.mjs daily 30   the next thirty daily jungles

The version is printed small in the corner of the title screen. On the
title screen the game asks the website whether there is a newer one, and
if there is, offers a button to update - a Home Screen app can otherwise
hold on to an old copy for days.

`docs/vine-swing/index.html` is the published copy; this folder mirrors it.
