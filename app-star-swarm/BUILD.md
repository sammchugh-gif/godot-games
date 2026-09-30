# The store edition as an app: building it on the Mac

`app-star-swarm/` is a standalone Capacitor project for iOS and Android. It is
separate from `app/`, which bundles three games as one "Arcade" app. The
game itself is `docs/star-swarm-plus/index.html`, built from
`Game24/index.html`.

## Build

```bash
cd app-star-swarm
npm install
npm run ios        # or: npm run android
```

`npm run build` copies the game into `www/` without the web-only scripts
(`tools/build-app-plus.mjs`). `cap sync` copies `www/` and the plugins into the
native projects, and `cap open` opens Xcode or Android Studio.

## One-time setup in Xcode

1. **Signing & Capabilities:**
   - choose your team;
   - check that the bundle id is `io.github.sammchugh.shardswarm`, or your own.
     If you change it, change `appId` in `capacitor.config.json` to match.
2. **+ Capability → Game Center.**
3. **+ Capability → In-App Purchase.**
4. **App icon:** put a 1024 × 1024 PNG in `assets/icon.png`, then run
   `npx @capacitor/assets generate --ios --android`.

## One-time setup in Android Studio / Play Console

1. **Play Games Services:** create a Play Games project in the Play Console. Its
   project id goes into `android/app/src/main/res/values/strings.xml` as
   `game_services_project_id`. The README of
   `@idleflowgames/capacitor-play-games` has the exact manifest lines.
2. **Achievements and leaderboards:** create them with the ids in
   `Game24/STORE.md`. Play Games generates its own ids, so map them in
   `BOARDS` and `ACH_PREFIX` in `index.html` if they differ from Apple's.
3. **The one-time product:** create `io.github.sammchugh.shardswarm.full`.

## The plugins, and what the game calls

| Plugin | Name on the page | Used for |
| --- | --- | --- |
| `@capacitor/haptics` | `Haptics` | hits, level-ups, boss kills |
| `@capacitor/preferences` | `Preferences` | a copy of the save that iOS cannot evict |
| `@capgo/native-purchases` | `NativePurchases` | the unlock, restore, ownership check |
| `@idleflowgames/capacitor-play-games` | `PlayGames` | Game Center / Play Games |

The game looks each one up by name (`capPlugin()` in `index.html`) and does
nothing when a plugin is missing, so the web build and the app are the same
file.

`@idleflowgames/capacitor-play-games` is new (0.3.0, September 2026) and has
few users. Try it on a device before relying on it. If it misbehaves, remove
it: the game keeps its own awards screen and only the Game Center sync is lost.

## Testing a purchase

- **iOS:** use a Sandbox tester (App Store Connect → Users and Access →
  Sandbox). Buy, then delete the app, reinstall and tap RESTORE.
- **Android:** use a license tester and an internal testing track.
- **On the web:** `docs/star-swarm-plus/?demo=1` shows the store build, and
  the purchase is a labelled pretend one.
