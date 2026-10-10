# Kintsugi Daily

Game 24. A calm tile-turning puzzle about kintsugi, the Japanese craft of mending broken pottery
with gold. Tap a shard to turn it a quarter turn; when every crack meets another, the seams turn
gold and the board becomes a 3D porcelain piece carrying the same seams.

Play it at `docs/kintsugi-daily/`, or from the shelf.

## How it plays

- **Moves against par.** Every tap is a move, undo is a move, and a hint adds three. Par is the
  fewest taps that can mend the bowl. Ratings run Flawless, Excellent, Great, Well done, Mended.
- **Daily.** Five bowls a day, the same for everyone on that date, scored like golf, with a
  streak and a Wordle-style result to copy (moon phases from 🌕 Flawless to 🌑 Mended). Each of
  the five has a fixed par band, so every day is equally hard. A daily started before midnight
  can be finished the next morning.
- **Collection.** Sixty bowls over five glazes (Celadon, Shino, Oribe, Tenmoku, Raku); six
  mended in one glaze opens the next. Bowl outlines follow vessel shapes, and from Oribe some
  shards are fixed in place.

## Files

- `index.html` - the game: board, scoring, daily and collection, saves (under `kintsugidaily.`).
- `js/porcelain.js` - the three.js porcelain renderer: twelve forms, ten glaze families, the
  player's seams painted on as gold. If WebGL fails the rating still shows over the gold board.
- `js/music.js` - generative music, synthesised live with Web Audio, one original piece per
  glaze on a Japanese scale (Yo, Hirajoshi, In, low In, Kumoi). Quieter on menus, resolves when a
  bowl is mended; the music button or the M key mutes it.
- `js/vendor/three.module.min.js` - three.js r160, kept here so the game plays offline.
- `publish.sh` - copies the game into `docs/kintsugi-daily/`.

Fonts come from Google Fonts when online and fall back to system serif and sans offline.
