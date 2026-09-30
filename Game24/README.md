# Shardswarm (Star Swarm, store edition)

Game 24 is a copy of Star Swarm (Game 10) being prepared for the App Store and
Google Play under the name **Shardswarm**. **Game 10 is unchanged.** This copy is where the store work
happens:
- `Game24/STORE.md`: the decisions still open, and the store checklist.
- `app-star-swarm/BUILD.md`: building the app.

Play it at <https://sammchugh-gif.github.io/godot-games/star-swarm-plus/>. Add
`?demo=1` to see it as the store build would: the free demo and the unlock.
The two copies keep separate saves.

## What is different from Star Swarm

1. **Asteroids matter more.**
   - They drift.
   - Plasma breaking on one near you says BLOCKED.
   - A rock shot to pieces bursts into shrapnel that tears through the swarm
     around it.
   - Bosses smash straight through your cover, and the pieces fly at you.
2. **Runs are saved.** A run is saved every few seconds, at every level-up and
   pause, and when the app is hidden. Hiding the app pauses the game. The
   hangar offers CONTINUE.
3. **Quick Run.** One sector in a random realm, with the boss at 2:30. The gate
   is the finish, so a run takes about five minutes.
4. **A first run that teaches itself.**
   - The first launch shows only the ship and the launch button.
   - Coach lines appear only while each one applies: flying, gems, cover,
     shrapnel, the gate.
   - The modes, the difficulty and the shop appear after the first run.
   - Hard is softer: hull ×1.5, spawn rate ×1.3, damage ×1.3 (was 1.7, 1.45,
     1.45).
5. **Free demo with one unlock** (store build only).
   - Sectors 1 and 2 are free. The gate to sector 3 opens the unlock screen,
     and buying there carries the same run on.
   - Endless and Daily are locked in the demo.
   - Restore Purchase is on the unlock screen and in settings.
6. **Rated 13+ on the App Store** (frequent cartoon violence). No ads, no analytics, no accounts. There is
   a privacy screen, and a policy page at `docs/star-swarm-plus/privacy.html`.
7. **No family names.** The credits say Much More Studios (`BRAND.studio`), and
   the saves use their own `ssplus.` prefix.
8. **Native features in the app:**
   - haptics;
   - Game Center / Play Games leaderboards and 25 awards, with an in-game
     AWARDS screen;
   - a native copy of the save, so iOS clearing web storage does not lose it;
   - game controller support (stick to fly; A, B, d-pad and Start in every
     menu).
9. **Settings:**
   - music and sound-effects volume;
   - haptics;
   - reduce flashing;
   - battery saver (30 fps);
   - a left-handed layout;
   - stick sensitivity;
   - elite markers, a spiked crown as well as the purple ring, so elites are
     not told apart by colour alone.
10. **Store readiness:** listing copy, age rating notes, screenshots plan and
    device test list, in `STORE.md`.

## Checking it

    PLAYWRIGHT=/opt/node22/lib/node_modules/playwright/index.mjs node tools/swarmpluscheck.mjs
    PLAYWRIGHT=... node tools/playbot.mjs --slug star-swarm-plus --dif hard --runs 6

Source lives in `Game24/`. To publish, copy `index.html` to
`docs/star-swarm-plus/`, then run `node tools/offline-list.mjs`.
