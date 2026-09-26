# Mahjong Club

American mah jongg for the family, in the iPhone's and iPad's browser: the
Charleston, jokers, calling tiles, joker swaps and a card of hands to aim for.
Play with three bots, or together on your own phones and iPads with a room
code, with bots in any empty seats.

Play it at <https://sammchugh-gif.github.io/godot-games/mahjong-club/>. On the
iPhone or iPad, open the link in Safari, then Share → Add to Home Screen. Any
orientation; sideways gives the rack more room.

## Three sizes of game

| Mode | In your hand | Mahjong with | Charleston |
| --- | --- | --- | --- |
| **Easy** | 8 | 9 | one round of two tiles: right, across, left |
| **Short** | 12 | 13 | the full Charleston (below) |
| **Standard** | 13 | 14 | the full Charleston, as American mah jongg is played |

Each mode has its own card. Easy's hands are nine tiles. Standard's are
fourteen. Short's are the Standard card's hands with one tile fewer: the
first pair becomes a single, or where a hand has no pair, the first kong
becomes a pung (then a quint a kong, a pung a pair).

## The card

The game has its own card, in the American style. It has the same kinds of
hands as the League's card: a year (2026), 2468, like numbers, quints,
consecutive runs, 13579, winds and dragons, 369, and singles and pairs. The
hands themselves are the game's own, because the National Mah Jongg League's
card is theirs and changes every year. Tap **Card** at the table:

- colours are suits: the same colour, the same suit; different colours,
  different suits;
- D is the dragon of that colour's suit (green with bams, red with craks,
  white with dots). 0 is the white dragon, the "soap", which is also the
  zero in 2026;
- numbers written from 1 with the note "any numbers in a row" or "any like
  numbers" can start anywhere on the tiles;
- X hands may use tiles you call; C hands stay hidden until mahjong;
- beside every hand: how many tiles you are away from it with what you hold
  now. Tap a hand to aim for it. The tiles it wants get a green dot on your
  rack, and a strip over your buttons keeps it in view. With hints on, the
  game aims for your closest hand until you pick one;
- at the table, the card opens with **Your hand** in a wooden tray beneath
  it: your tiles in rack order, then any you have shown, with green dots
  on the tiles the hand you picked needs and how far away it is.

## Playing

- **The tiles.** 152 of them: bams (green), craks (red) and dots (blue),
  1-9, four of each. Four of each wind and dragon. Eight flowers, eight
  jokers. Every tile has its number or letter in the corner, as American
  tiles do.
- **The Charleston.** Tap tiles to lift them and tap **Pass**. A big arrow
  shows who they go to. First Charleston: right, across, left. If nobody
  stops it: a second Charleston, left, across, right. Then the courtesy
  pass: up to three tiles with the player across, and the smaller offer is
  what both give. Jokers are never passed.
- **Turns.** East (the red E) starts by throwing. Tap a tile to lift it, then
  **Throw** (or tap it again).
- **Calling.** When someone throws a tile you can use, a panel asks you:
  **Pung**, **Kong** or **Quint** to show that group (jokers make up the rest),
  **Mahjong!** if it finishes your hand, or **Pass**. A call has to fit a hand
  on the card. The game only offers calls that do, so nobody's hand ever goes
  dead. A bar shows how long you have (Settings: 6-20 seconds).
- **Jokers.** On your turn, if someone has a joker in a shown group and you
  hold the real tile, **Get joker** swaps it in.
- **Mahjong.** When your tiles make a hand on the card, **Mahjong!** appears.
- **Paying.** Everyone pays the hand's value. Whoever threw your winning tile
  pays double. Everyone pays double if you drew it yourself, and it all
  doubles again with no jokers (not on singles and pairs, which can never
  have any). The totals carry on from game to game, and East moves along
  one seat each game.
- **Following along.** Whoever's turn it is has their name lit up with a
  ring that breathes, the side of the table they sit on glows, and a bot
  shows three dots while it thinks. A thrown tile flies from the thrower to
  the middle of the table and stays there, big, with "Leo threw 5 Dot",
  before it drops into the pile; a call pops up **PUNG!** (or KONG!, QUINT!)
  by whoever made it; and **Your turn!** pops over your rack when it comes
  round. A bot waits about 1.3 seconds after a throw, then thinks for about
  0.9 more before it plays (Settings, Bots: "take their time" is 1.6 times
  as long, "quick" half).
- **?** lifts the tiles a bot would pass or throw. **Sort** puts the rack in
  order; you can also drag tiles to arrange them.

Not in this version: the Charleston's blind pass, and "dead" hands (the
game never lets a hand go dead).

## Together, on separate devices

One person taps **Host a game** and gets a four-digit room code. The others
tap **Join a game** and type it in. Bots fill the empty seats. The host
picks the size of game and deals. Whoever hosts keeps the game: it runs on
their device, and each player's device is sent only what that player may
see, so hands stay private.

If a player's phone drops out (the screen locks, it leaves the wifi), a bot
plays for them after eight seconds, and they get their seat back by joining
again with the same code. A player can also join a game already under way,
taking a bot's seat.

The devices find each other through PeerJS's free public broker and then
talk directly (WebRTC). On the same wifi this is reliable. Over mobile data
some networks will not connect two phones directly, and there is no relay
server behind it, so if joining fails, put everyone on the same wifi.

## Tiles and tables

The tiles are rendered in 3D, as the pinball tables are: each tile is a real
object - a two-layer resin body (the face layer over a coloured back, the way
American tiles are made), bevelled, with its glyphs carved into the face (the
artwork's height map drives the bump) and painted, lit by a studio room and a
key light. Each tile is rendered once, in the background, and the picture kept,
so the table costs no more to draw than before. Until a tile has been rendered,
or on a device without WebGL, a flat drawing stands in.

Every tile has pictures and ornament, not just symbols: shaded bamboo with
nodes, studded coins, a peacock on the 1 Bam, a dragon behind the red and green
dragons, an ornate frame for the soap, eight different flowers (plum blossom,
hibiscus, chrysanthemum, daisy, lotus, rose, tulips, sunflower - one on each
flower tile, as real sets have), and a crowned, rainbow-bordered joker. Every
tile keeps its corner index.

Four sets, under **Tiles**:

- **Classic Ivory**: warm ivory over deep emerald, traditional inks.
- **Butterscotch**: vintage American Bakelite - butterscotch over amber,
  faded inks.
- **Pearl**: bright pearl over navy, the biggest numbers - for learning.
- **Midnight**: black lacquer, carvings filled with gold, silver and jewel
  colours.

Six tables, under **Table**: Emerald Felt in a walnut rim, Walnut, Marble with
gold inlay, Red Lacquer with gold fret and clouds, Moon Garden (indigo silk,
cherry blossom and the moon) and Seaside (weathered painted boards). Words
drawn on the table take each table's own colours.

## The family

Sophia, Rory and Dylan each start with their own profile, and **+ Add** makes
more, up to six. Each keeps their games, wins and points.

## How it is checked

The rules are pure (no screen, no clock, a seeded shuffle): the card, reading
a hand, the Charleston, calls, jokers, paying out, and the bots.
`tools/mahjongcheck.mjs` lifts them out of the page:

- **The card.** Every hand is the right size and can be made from a real set:
  no more natural tiles than exist, and jokers only in groups of three or
  more.
- **Reading a hand.** Every way of making every hand is mahjong when built
  from its own tiles. A hand one tile short never is, and a joker can never
  stand in a pair.
- **Whole games.** Four bots play hundreds of games in each mode. Every game
  ends, all 152 tiles are accounted for exactly once throughout, every winner
  holds a hand on the card, and the payments add up to nothing.

      node tools/mahjongcheck.mjs          200 games a mode
      node tools/mahjongcheck.mjs 1000     more

Online play was checked with two browsers against a local copy of the PeerJS
broker (the page takes `?peer=host:port`):

- the host opens a room;
- a guest joins with the code and appears in the lobby;
- a whole game is played through on both devices;
- when the guest disappears mid-game, a bot takes over and the game still
  ends.

`docs/mahjong-club/` is the published copy; this folder mirrors it.

Vendored, with their licences:
- `peerjs.min.js`: PeerJS 1.5.5 (MIT, © Michelle Bu and Eric Zhang).
- `three.bundle.min.js`: three.js r180 (MIT), the same bundle as Pinball Quest's.
- Some of the pictures on the tiles (flowers, the peacock, the crown, the
  dragons) are Google's Noto Emoji artwork, Apache License 2.0, painted onto
  the tiles in the game's own styles.
