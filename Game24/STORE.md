# Star Swarm, store edition: getting it onto the App Store and Google Play

Game24 is a copy of Star Swarm (Game10) prepared for sale. The family game is
unchanged. This page lists what the stores need, what is already done, and
what only a person can do.

## Decisions still open

1. **The name.** "Star Swarm" is already taken:
   - a Google Play game called Star Swarm (`com.Temenoi.StarSwarm`);
   - Oxide Games' well-known *Star Swarm* engine benchmark on Steam.

   A web search found no store listings under **Warpfall**, **Rockshadow**,
   **Rockshade** or **Warpwake**. The research proxy blocked the stores and the
   trademark office, so search both stores on a phone and check
   <https://tmsearch.uspto.gov> before choosing. Changing the name takes two edits:
   - `BRAND.game` near the top of `Game24/index.html`;
   - `appName` in `app-star-swarm/capacitor.config.json`.

2. **The age rating.** Apple now rates 4+, 9+, 13+, 16+ and 18+. 9+ allows
   *infrequent* cartoon or fantasy violence; *frequent* moves it to 13+. The
   ship fires constantly, so an honest answer to that question is probably
   "frequent", which gives **13+**. Answer the questionnaire truthfully; a
   rating found to be understated can get the app pulled. On Google Play the
   IARC questionnaire should give about ESRB Everyone 10+ / PEGI 7.

3. **The price** of the full-game unlock. Suggested: **$3.99** (tier 4). That
   is within the usual range for a premium arcade game, and cheap enough to
   buy on impulse after two sectors.

4. **The studio name** in the credits: `BRAND.studio`, currently "Starlight
   Arcade" as a placeholder. It must match the seller name on your developer
   account, or at least not contradict it.

## The business model

- **Free download:**
  - campaign sectors 1 and 2;
  - Quick Run in those two realms;
  - the shop;
  - the ships you can earn in those two sectors.
- **One non-consumable in-app purchase unlocks everything else:**
  - sectors 3 to 6;
  - Endless and Daily;
  - the rest of the ships.
- **The unlock screen appears in three places only:**
  - at the sector 2 gate. Buying there carries the *same run* on into sector 3;
  - when a locked mode is tapped;
  - from the gold button on the hangar.

  It never interrupts a fight.
- **No ads, no gem packs, no subscription.**
- **Restore Purchase** is on both the unlock screen and the settings screen, as
  Apple guideline 3.1.1 expects.
- **Product id:** `io.github.sammchugh.starswarm.full` (`BRAND.full`). Create it
  in App Store Connect and in the Play Console as a non-consumable / one-time
  product with exactly this id.

## App Store Connect: what to create

| Item | Value |
| --- | --- |
| Bundle id | `io.github.sammchugh.starswarm` |
| In-app purchase | non-consumable, id `io.github.sammchugh.starswarm.full` |
| Leaderboard | `ss.campaign`: campaign best score, high to low |
| Leaderboard | `ss.quick`: quick run best score |
| Leaderboard | `ss.endless.sector`: furthest endless sector |
| Leaderboard | `ss.daily`: daily run score, **recurring daily** |
| Achievements | 25, ids `ss.` + the id in the table below |
| Privacy label | **Data Not Collected** (see the privacy section) |
| Privacy policy URL | <https://sammchugh-gif.github.io/godot-games/star-swarm-plus/privacy.html> |
| Category | Games > Action (secondary: Arcade) |

Achievements (id: name):
- `first`: First Flight
- `s2`: Deep Space
- `s4`: Beyond the Ember Star
- `clear`: Escape the Swarm
- `clearM`: Veteran Pilot
- `clearH`: Ace of Aces
- `mother`: Hatch Closed
- `kraken`: Calamari
- `warlord`: Regime Change
- `evo`: Evolution
- `evo3`: Apex Build
- `lv20`: Seasoned
- `lv40`: Legendary
- `k1000`: Swarm Breaker
- `k10k`: Exterminator
- `cover`: Take Cover
- `rockslide`: Rockslide
- `quick`: Short and Sweet
- `daily`: Daily Pilot
- `e8`: Lap Two
- `clean`: Untouchable
- `pod`: Close Call
- `fleet`: Full Hangar
- `maxed`: Fully Tuned
- `tunnel`: Tunnel Vision

The descriptions are in the `ACH` table in `index.html`.

## Privacy

The game makes no network requests of its own and has no third-party SDKs
that collect data:
- **Haptics and Preferences:** Capacitor's own plugins.
- **Purchases:** `@capgo/native-purchases`. It talks to StoreKit and Play
  Billing and has no backend of its own.
- **Game Center / Play Games:** `@idleflowgames/capacitor-play-games`. Apple and
  Google receive scores only when the player is signed in.

So the Apple label is **Data Not Collected**, and the Play data-safety form
says **no data collected or shared**. RevenueCat was ruled out for this reason:
its own documentation says apps using it must declare purchase data. The
privacy policy is `docs/star-swarm-plus/privacy.html`, and the same text is on
the in-game PRIVACY screen (Apple guideline 5.1.1 asks for both).

## Listing copy (draft)

**Subtitle (30 max):** Survive the swarm. Use the rocks.

**Promotional text:** Drag to fly, your guns fire themselves, and every
asteroid is either your shield or a bomb. Two sectors free.

**Description:**

> One thumb. Endless aliens. Six sectors between you and home.
>
> Your ship's weapons fire on their own - you steer. Grab gems to level up and
> pick from three upgrades every time: lasers, spread cannons, drones, homing
> missiles, space mines, plasma waves and black holes, each one evolving into
> something bigger when paired with the right upgrade.
>
> The asteroids are the twist. Plasma can't pass them, so hide behind them. Shoot
> one to pieces and its shrapnel rips through the swarm around it. But the bosses
> don't go round your cover - they smash straight through it.
>
> - Six sectors, three bosses that come back harder
> - Quick Runs of about five minutes
> - Endless mode and a Daily run with a new twist every day
> - Seven ships, each with its own trick
> - Four art styles: Classic, Vector, Pixel and Neon
> - Game Center leaderboards and 25 awards
> - Plays offline. No ads. No data collected.
>
> The first two sectors are free. One purchase unlocks the whole game, for good.

**Keywords (100 max):**
`roguelite,survivor,space shooter,arcade,bullet,asteroid,aliens,offline,one thumb,upgrade,boss`

## Screenshots

Apple needs 6.9" iPhone (1320 × 2868) and 13" iPad (2064 × 2752). Play needs
at least two phone screenshots. Take them in this order, one idea each, with a
caption at the top:

1. Mid-fight behind an asteroid, plasma breaking on it: "Hide behind the rocks."
2. A rock bursting into shrapnel through a crowd: "Or blow them up."
3. The level-up cards with an evolution hint: "Build your ship every run."
4. A boss: "Three bosses. They come back harder."
5. The warp tunnel: "Six sectors to home."
6. The hangar showing the four skins: "Classic, Vector, Pixel, Neon."

A 15 to 30 second App Preview video of screens 1, 2 and 4 is worth more than
the rest put together.

## Devices to test before sending it in

- **Oldest iPhone you'll support:** iPhone XR / 11 (A12/A13). Play a full
  campaign sector with Battery Saver off, then on.
- **iPad, both orientations:** check the level-up cards and the hangar.
- **Recent iPhone with a Dynamic Island:** check nothing hides under it.
- **Mid-range Android:** e.g. a Pixel 6a or a Galaxy A-series.
- **On each device:**
  - Lock the screen mid-run, reopen, check it is paused.
  - Kill the app mid-run, reopen, check CONTINUE brings the run back.
  - Buy in the sandbox, delete the app, reinstall, and use Restore.
  - Play offline in airplane mode.

## What is already done

- Every item on the ten-point list apart from the name, which is open above.
- `app-star-swarm/`: a standalone Capacitor project for iOS and Android with
  the plugins installed. See `app-star-swarm/BUILD.md`.
- `tools/swarmpluscheck.mjs` checks the new features in a browser.
- `tools/playbot.mjs --slug star-swarm-plus` plays balance runs.

## What needs a person

- Apple Developer ($99/yr) and Google Play Console ($25 once) accounts.
- The name, the price, the rating answers and the studio name.
- The App Store Connect and Play Console items in the table above.
- Signing, building and uploading on a Mac: `app-star-swarm/BUILD.md`.
- An app icon of its own. The one in `app/assets/` is the Arcade icon.
- Screenshots and the preview video.
