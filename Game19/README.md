# Nufa from Planet Shmid

An interactive picture book for about seven-year-olds, for the iPhone's and
iPad's browser. Nufa is a little green alien with two wobbly antennae. His
spaceship crashes into the oak tree at the bottom of the Bramble family's
garden. He falls in love with pickles, and then learns from Mum and Dad that
being different is OK.

Read it at <https://sammchugh-gif.github.io/godot-games/nufa-from-shmid/>. On
the iPhone or iPad, open the link in Safari, then Share → Add to Home Screen.
It works in any orientation. It is one file with no engine and nothing to
download: every picture is drawn in code.

## Reading it

- **Read to me** reads each page aloud and lights up each word as it is
  read. Nufa, Lily, Ben, Mum and Dad each speak in a voice of their own. The
  speaker button at the top turns the reading on and off, and the arrow
  beside it reads the page again.
- **I'll read it myself** turns the reading off. Tapping any word still says
  it aloud, which helps a child who gets stuck on a word.
- Turn the page with the green arrows, by swiping, or with the arrow keys.
- The book remembers the page a child reached. The cover offers to carry on
  from that page.
- Held upright, the picture sits above the words. Held sideways, and on an
  iPad, the words go on a page down the right-hand side.

## The story

| Page | What happens | What to tap |
| --- | --- | --- |
| Cover | Nufa floats in space by planet Shmid | Nufa, the planets, the pickles |
| 1 | Planet Shmid, where everyone is green | Nufa, his pet blorp, glowing plants, other Shmidlings |
| 2 | He zooms his spaceship a bit too fast | The spaceship (a loop-the-loop), the comet, Earth |
| 3 | CRASH! into the Brambles' oak tree at night | The owl, the tree, the smoking spaceship |
| 4 | Lily and Ben see something glowing in the tree | The leaves, to find out who is hiding |
| 5 | "Hello. I am Nufa, from planet Shmid." | Nufa, Lily, Ben |
| 6 | Mum and Dad say he can stay | Everyone |
| 7 | Toast, too crunchy; milk, too wet; pickles! | The jar, again and again (it counts the pickles) |
| 8 | Pickles on his ice cream. "Yuck!" "Yum!" | The ice cream, to add up to three pickles |
| 9 | At school the other children stare | Each child, for their question; Nufa |
| 10 | He hides his antennae under a woolly hat | The hat (the antennae will not stay down), the soap bubbles, the mirror |
| 11 | "Look at our family": curly hair, tall as a lamppost, glasses, a goose laugh | Each Bramble; Nufa, once all four have been tapped |
| 12 | "Being different is what makes you YOU." | Nufa's hat, to take it off |
| 13 | At the picnic Mia's kitten is stuck up a tree in the dusk | Pepper the kitten, Mia, Nufa |
| 14 | His antennae glow like lanterns and he climbs up to rescue her | Nufa, to light up the dark, then Pepper |
| 15 | Everyone cheers, and everybody tries a pickle | Everyone, to taste one: SOUR! or YUM! |
| 16 | On the roof at night, waving to planet Shmid | Planet Shmid, the sky (a shooting star) |
| The End | Things to talk about together | Nufa |

If nothing has been tapped for a few seconds, little sparkles show which
things in the picture do something.

The Brambles look after Nufa as Mum and Dad. He calls them that on page 12.

## How it is made

Every character and place is SVG drawn by functions in the page: `nufa()`
and `person()` draw a character with a mood and a pose, and a tap redraws
one with a new face and then puts the old one back. The words are real text,
so they stay sharp at any size and the browser's own voice can read them.
The sound effects are made with Web Audio when they play.

The page has no animation loop. Everything moves with CSS animations and the
Web Animations API, so it sets `window.__shelfStatic` and the shelf's stuck
checker leaves it alone. The shelf's pause stops the voice and the moving
pictures together.

`tools/wakecheck.mjs nufa-from-shmid` checks that the first touch starts
the sound on a phone.

`docs/nufa-from-shmid/index.html` is the published copy; this folder mirrors it.
