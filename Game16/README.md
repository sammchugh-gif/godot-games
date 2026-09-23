# Vine Swing

A one-finger jungle swinger for the iPhone's and iPad's browser. Hold anywhere
and the monkey grabs the vine ring that is glowing; let go and it flies.
Holding on pumps the swing, letting go at the right moment is the whole game.
Forty levels in four worlds, three stars a level, a new jungle every day, and
every level remembers the family's best run as a ghost to race.

Play it at <https://sammchugh-gif.github.io/godot-games/vine-swing/>. On the
iPhone or iPad, open the link in Safari, then Share → Add to Home Screen. Any
orientation. One file, no engine.

## How to play

- **Hold** anywhere on the screen: the monkey grabs the glowing ring. The
  dotted line shows which one before you touch.
- **Let go** to fly. Let go on the way up and forward for distance.
- **Hold again** in the air to catch the next ring. A catch keeps your speed.
- Standing on a ledge with nothing in reach, a hold is a hop forward.
- Splash into the water (or the swamp, the rapids, the lava), touch a thorn
  bush or a bee, and you are back at the last flag. The clock keeps running.
- Flips in the air are worth two bananas each at the next catch.
- Keyboard: Space or Up to hold, R to restart, Escape to go back.

## Stars

Each level has three, and they can be earned on different runs:

| Star | For |
| --- | --- |
| Flag | Reaching the finish |
| Gold banana | Collecting all three gold bananas in one run |
| Clock | Finishing under par |

## Worlds

| World | New in it |
| --- | --- |
| Jungle Canopy | Mushrooms that bounce you, speed hoops, thorns, bees |
| Temple Ruins | Rings that crumble a moment after you grab them, stone pillars |
| Misty Falls | Rings that slide back and forth or up and down |
| Volcano Peak | All of it, over lava, with fireballs |

A world opens with enough stars in the one before it and a banana price, paid
in the shop.

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
are, and picked the seeds in the game's `SEEDS` table.

    node tools/vinecheck.mjs            all forty levels
    node tools/vinecheck.mjs daily 30   the next thirty daily jungles

`docs/vine-swing/index.html` is the published copy; this folder mirrors it.
