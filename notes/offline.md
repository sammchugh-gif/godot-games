# Playing without the internet

The games play offline on the iPad and iPhone. A service worker
(`docs/sw.js`) keeps a copy of them on the device.

## How it behaves

- **With the internet**, every file still comes from the website, so a new
  build arrives straight away, and the copy is refreshed on the way past. If
  the website takes more than 4 seconds to answer, the copy is used instead.
- **Without it**, everything comes from the copy.
- **Opening a game** saves that whole game a few seconds after it has
  loaded: every file, not just the parts that happened to load. That covers
  every pinball table and every recorded voice line.
- **The shelf** (the page listing all the games) saves the small games by
  itself: 16 games, about 6 MB with the shelf's own pictures. A
  **Save all** button saves the rest (about 370 MB in all, most of it the six
  Godot games and the Agent Rory missions). The shelf says how many games
  are ready to play offline. With no internet, it greys out the games that
  are not.
- **A game that isn't saved**, opened with no internet, shows a page saying
  it needs the internet, with a way back to the shelf.
- **Checking for a new version needs the internet.** `fresh.js` and a game's
  "new version?" button always ask the website, since only the website can
  say. With no internet those checks simply do nothing.
- **Mahjong Club** playing together across phones needs the internet.
  Against the bots it plays offline.

## On the iPad and iPhone

- **Each Home Screen icon has its own storage**, for its saves and for its
  offline copy. With one icon for the shelf, everything lives together, and
  a single visit online (plus **Save all**) readies every game. With one icon
  per game, each is saved the first time it is opened online. Its saves stay
  with that icon.
- **Home Screen apps keep their data.** Safari deletes a website's stored data
  after 7 days of Safari use without a visit to it. Home Screen web apps are
  exempt ("Full Third-Party Cookie Blocking and More", WebKit blog, March
  2020).

## Keeping it up to date

To save a game whole, and to update a saved game by downloading only what
changed, the service worker reads `docs/offline/`. That folder holds a list
of every file of every game, each with a fingerprint, so it has to be
regenerated whenever files under `docs/` are added, removed or changed:

    node tools/offline-list.mjs            write the lists
    node tools/offline-list.mjs --check    are they up to date?

If a list is out of date, nothing breaks, but a new file may not be saved
until the game is played online. The lists also record which games open other
games: Agent Rory HQ is the way into the missions, and its 3D room is built
from the Zero Gravity mission's files. Saving everything for HQ therefore
means saving the missions too.

## Checking it

    PLAYWRIGHT=... node tools/offlinecheck.mjs          every game
    PLAYWRIGHT=... node tools/offlinecheck.mjs quick    the small ones

It serves the site the way GitHub Pages does and saves everything. Then it
switches the server off (really off, not simulated) and opens every game,
failing on any request left unanswered or anything thrown. It also checks:

- the voice lines' piece-at-a-time requests;
- the greyed-out cards;
- the "needs the internet" page;
- that a change on the website reaches the copy.
