# Star Swarm: launch and visibility plan

Written 2026-09-30, before submission. The launch date is not set, so every
step is keyed to launch day, **L**. `L-8w` means eight weeks before launch.

## The three decisions that matter more than any post

1. **Start eight weeks before launch.** Apple asks for at least two weeks'
   notice for featuring and recommends up to three months
   ([Apple, Getting featured](https://developer.apple.com/app-store/getting-featured)).
   Pre-orders on iOS and pre-registration on Google Play build up a launch-day
   spike. Neither can be set up afterwards.
2. **Ship Star Swarm as its own app.** The Capacitor project is currently one
   app called "Arcade" (`app/capacitor.config.json`, appId
   `io.github.sammchugh.arcade`) that bundles three games. Nobody searches for
   "Arcade", and a bundle cannot be pitched in one sentence. Give Star Swarm
   its own bundle ID and listing. Slime Storm and Dungeon Dash can follow
   later as separate launches, and each launch is another chance at press.
3. **Sell what makes it different, not the genre.** Survivors-likes are
   crowded. Poncle rushed Vampire Survivors onto mobile to push back against
   clones
   ([CGM](https://www.cgmagonline.com/news/vampire-survivor-mobile-clones-dev/)),
   and on Steam the number of breakout titles in the genre fell to one in 2024
   ([GameDev Reports](https://gamedevreports.substack.com/p/how-to-market-a-game-results-of-the)).
   Star Swarm's real differences:
   - no ads, no in-app purchases, works fully offline
   - one-thumb controls, a ten-minute run, a warp gate to reach
   - a daily run
   - made by a parent for their three kids, who each have a ship named after
     them
   - the whole game is one HTML file with no engine (this one is for
     developer audiences)

   The positioning line: **"A survivors-like with no ads, no purchases and no
   internet needed. Ten minutes, one thumb."**

**A decision for the owner (it is not an agent's call):** the "made for my
kids" story is the strongest hook, and it puts the children's first names
into public posts. Choose on purpose. One option is to tell the story without
the names in marketing copy and keep the in-game ship names as they are.

## Name and store listing

- "Star Swarm" collides with Oxide Games' 2014 Star Swarm benchmark and with
  existing store apps. Use a title plus a keyword subtitle, for example
  **Star Swarm: Space Survivors**. Search both stores before deciding.
- Put in the keyword field: survivors, roguelite, bullet heaven, offline, no
  ads, space shooter, arcade.
- Make six to eight screenshots. The first two decide conversion: frame one
  shows a busy swarm with the evolved weapons, and frame two says "No ads.
  No purchases. Plays offline." Claude can capture these from the web build
  at store sizes with the Chromium already in the container.
- Make a 15–30 second preview video that opens on the fullest moment of
  swarm, not on the title screen.
- After launch, A/B test the screenshots with Apple's Product Page
  Optimization and Google Play's store listing experiments.

## Build changes worth making before launch

Claude can make each of these in this repo.

| Change | Why |
|---|---|
| Turn SHARE into a Wordle-style daily card, e.g. `Star Swarm Daily #41 · Sector 6 · 9:43 · 1,204 kills 🚀` plus a store link | The current SHARE text (`runSummary`, `docs/star-swarm/index.html` ~line 1527) is a tuning log meant for the family. A short daily card is the only built-in way players can spread the game. |
| Ask for a review (native in-app review prompt) right after the first warp-gate win | The number of ratings drives both ranking and conversion. Ask at a moment when the player is happy, never after a death. |
| Add campaign tokens (`ct=`) to every store link we post | App Store Connect then shows which post produced which downloads. Without them we are guessing. |
| Put the free web version on itch.io, with store badges | The web version already exists. A game people can try without installing is the cheapest discovery we have, and it also qualifies for r/WebGames. |

## Where to post

These rules are unverified. Reddit is blocked from this container, so I could
not read the sidebars. Check every rule by hand before posting.
Reddit-wide: keep your own links to about 10% or less of your activity
([Steam Page Analyzer](https://www.steampageanalyzer.com/blog/reddit-indie-game-marketing)).
Reddit's spam policy covers "bots, generative AI tools that… facilitate the
proliferation of spam"
([summary](https://horadecodar.com.br/?p=44116)).

| Tier | Community | Angle | When |
|---|---|---|---|
| 1 | r/iosgaming | Launch post, dev flair, "no ads, no IAP" | L |
| 1 | r/AndroidGaming | Same. It may require the weekly dev thread, so check first | L (Android launch) |
| 1 | r/SurvivorsLike | Genre fans who want this kind of game. Lead with a GIF of an evolution | L+1 |
| 2 | r/playmygame | Built for exactly this; asking for feedback is welcome | L+2 |
| 2 | r/indiegames | Launch GIF. Do not dress an ad up as a feedback request | L+3 |
| 2 | r/IndieGaming | Best clip only | L+4 |
| 2 | r/WebGames | The itch.io web version | L+5 |
| 3 | r/IndieDev | Devlog: "I built a survivors-like for my kids in one HTML file" | L-3w and L+7 |
| 3 | r/roguelites | Only if the rules allow dev posts | L+10 |
| 3 | Hacker News (Show HN) | The one-file, no-engine canvas build and how it adapts to frame rate. Link to the web version, not the store | A weekday morning US time, L+1w to L+2w |
| ✗ | r/gaming, r/gamedev | The big subs bury small launches, and r/gamedev bans promotion ([WN Hub](https://wnhub.io/news/marketing/item-4286)) | Skip |

Post in **one community per day**. Posting the same link to several
subreddits on the same day looks like spam to both moderators and the
filters.

## X (and Threads and Bluesky)

- Post every week from L-8w: **#ScreenshotSaturday** with a 5–10 second clip,
  plus #indiedev, #gamedev and #indiegame. Posts with images get roughly 2–3×
  the engagement of text-only posts, and video gets more
  ([Abratabia](https://www.abratabia.com/game-marketing/social-media-for-games.php)).
- Join **#PitchYaGame** when it next runs. Publishers and press watch it
  ([Game Developer](https://www.gamedeveloper.com/business/marketing-tools-for-indie-game-developers)).
- On launch day, post a thread (clip, the "why", store links) and pin it.
- Use the same clips as vertical video on TikTok, Shorts and Reels. For a
  game this visual, short video is probably the channel most likely to work,
  more than Reddit.

## Press, creators and store programmes

- **Apple featuring nomination.** Submit it in App Store Connect at L-8w, and
  again for every meaningful update
  ([Apple](https://developer.apple.com/contact/app-store/promote/)). It is
  free, with no minimum download count.
- **Google Play Indie Games Festival and Accelerator.** They open each year.
  Check the dates and eligibility
  ([Google](https://blog.google/products/google-play/google-play-helps-indie-games-go-further-faster/)).
- **Pocket Gamer.** Send a pitch and enter The Big Indie Pitch
  ([pocketgamer.biz](https://www.pocketgamer.biz/pr-activity-that-indies-can-do-for-themselves)).
  Before pitching any other mobile outlet, check that it is still active:
  several have shut down.
- **Creators.** Search YouTube for "best survivors games mobile 2026" and
  "offline games no ads". Build a list of 20–30 channels that make roundup
  videos. Offer them early access or a pre-release TestFlight build. A place
  on a roundup does more than any one Reddit post.
- **Press kit.** A one-page site with the pitch line, trailer, eight
  screenshots, logo, facts and contact details. Claude builds it.

## Timeline

| When | What | Who |
|---|---|---|
| L-8w | Decide the standalone listing and name. Submit the Apple featuring nomination. Start weekly #ScreenshotSaturday | Owner decides, Claude drafts |
| L-6w | Set up pre-order and pre-registration. Store screenshots and preview video. Press kit site | Cowork (App Store Connect), Claude (assets) |
| L-4w | Share card, review prompt, campaign links. itch.io web version | Claude (code), Owner (itch.io account) |
| L-3w | r/IndieDev devlog. Build the creator list | Owner posts, Claude drafts |
| L-2w | Draft press and creator emails as Gmail drafts. Put a posting calendar in Google Calendar | Claude |
| L | Store launch. X thread. r/iosgaming | Owner |
| L+1 → L+10 | One community a day (table above). Reply to every comment within a few hours | Owner posts, Claude drafts replies for review |
| L+1w → L+2w | Show HN | Owner |
| L+30 | Read campaign-token results. Stop channels that did nothing. Plan update 1.1 (new ship or sector), which brings a new featuring nomination and a new post | Claude reports, Owner decides |

## What to measure

In App Store Connect (and the Play Console):

- impressions, product page views, and conversion from page view to download
- downloads for each `ct=` campaign
- ratings count and average

Treat a channel as working if it beats about 50 downloads per post or keeps
its conversion rate above what the store page gets on its own.

## Rules for the agents

- **No agent posts or comments on Reddit or X by itself.** X forbids
  automated replies driven by keyword searches
  ([X automation rules](https://help.x.com/en/rules-and-policies/x-automation)).
  Reddit's spam policy names generative-AI spam, and its detection flags
  accounts that behave like bots. Losing the owner's account to a ban costs
  more than any single post brings in. Agents draft; the owner posts and
  replies from their own account.
- No asking friends or family to upvote (Reddit counts that as vote
  manipulation). No second accounts. No fake reviews.
- Agents can do the rest: drafts, assets, code, emails left as drafts,
  calendar events and reports.
