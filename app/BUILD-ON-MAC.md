# Arcade — building it on the Mac and getting it onto the App Store

Star Swarm, Slime Storm and Dungeon Dash, as one iOS app.

**What I could do from here:** everything up to the build. The three games are
bundled, the launcher is written, the Xcode project is generated, the icon and
launch screen are drawn and cut to every size iOS wants, and the whole payload
is proven to run with the network switched off.

**What I could not:** build, sign, or submit it. Those need Xcode, which is
macOS only. Everything below happens on your Mac.

---

## Before you start

- **A Mac** with **Xcode** from the Mac App Store (free, large — several GB).
- **Node 18 or newer** — `brew install node`, or from nodejs.org.
- **CocoaPods** is no longer needed; this uses Swift Package Manager.
- **An Apple Developer Program membership**, £79/$99 a year, from
  <https://developer.apple.com/programs/>. You need this to put an app on the
  store. You do **not** need it to run the app on your own iPad — a free Apple
  ID will do that, with the app expiring after 7 days.

Do the free-account route first. Get it running on the kids' iPad and let them
play it before you spend anything.

---

## Build it

```bash
cd app
npm install
npm run ios
```

That runs three things: `build` regenerates `www/` from the games in `docs/`,
`cap sync` copies it into the Xcode project, and `cap open` opens Xcode.

In Xcode:

1. Click **App** in the left-hand file list, then the **Signing & Capabilities**
   tab.
2. Tick **Automatically manage signing** and pick your name under **Team**.
   With a free Apple ID this is your personal team.
3. **Bundle Identifier** must be unique across the whole App Store. It is
   currently `io.github.sammchugh.arcade`. Change it if you would rather use
   your own domain; if you change it here, change it in
   `app/capacitor.config.json` too so the two stay in step.
4. Plug the iPad in, pick it at the top of the window, press **▶**.

First run on a device, iOS will refuse to open it until you trust the
certificate: **Settings → General → VPN & Device Management → your Apple ID →
Trust**.

## Change a game and rebuild

The games live in `docs/`, which is also the website. There is one copy, not
two. Edit the game there, then:

```bash
cd app && npm run ios
```

## When the icon changes

```bash
cd app && npm run icons
```

That redraws `assets/icon.png` and `assets/splash.png` and cuts every iOS size
from them. The drawing itself is `tools/make-icon.mjs` — it is a canvas script,
so the icon is code like everything else here.

---

## Two things to decide before you pay Apple anything

### 1. Apple rejects thin web wrappers, and this is a web wrapper

App Store Review Guideline **4.2 Minimum Functionality** is the one that turns
away apps that are "simply a web site bundled as an app". Reviewers apply it to
WebView apps regularly, and it is the single most likely reason this gets
rejected.

What is in its favour, and worth saying in the review notes:

- it works with **no network at all** — verified, not assumed, by
  `tools/appcheck.mjs`, which blocks every request that does not come from the
  bundle and then plays all three games
- three complete games, not a menu that opens a website
- nothing in it points at a URL; there is no browser chrome, no address bar,
  no way to navigate out
- it saves progress on the device

What would strengthen it further, if it does get rejected:

- **Game Center leaderboards** — a genuinely native feature, and the obvious
  one for three arcade games with high scores
- **haptics** on a hit or a crash, through `@capacitor/haptics`
- an iPad-specific layout, since the games already handle both orientations

My honest read: it has a fair chance as it stands and a good one with Game
Center. If it is rejected, the reply is usually specific about what is missing,
and Game Center is the cheapest answer to it.

### 2. If you put it in the Kids Category, freemium gets hard

This matters for your next step, so decide it before you build the paid part.

Apps in the **Kids Category** may not use third-party analytics or advertising,
must keep any external links and purchases behind a parental gate, and get
extra review scrutiny. That is not a reason to avoid the category — it is a
reason to know that "freemium" there means **in-app purchase behind a parental
gate**, not adverts.

The alternatives:

- **Kids Category, one-off unlock.** Cleanest. Free download with one or two
  games, one purchase to unlock the rest. No adverts, no subscription, no data
  collection, nothing to explain.
- **Not in the Kids Category** (Games → Arcade, rated 4+). Fewer restrictions,
  but you lose the shelf placement parents actually browse.

My recommendation is the first, and to keep the app collecting **no data at
all** — it makes the App Privacy questionnaire a single line, and it is the
honest answer for three games that never open a socket.

---

## What the store wants besides the binary

Set up in App Store Connect, at <https://appstoreconnect.apple.com>:

- **Screenshots** — 6.7" iPhone and 13" iPad, taken from the simulator or the
  real thing. Apple wants them at exact pixel sizes and is fussy about it.
- **Description, keywords, support URL.** The support URL can be the shelf:
  <https://sammchugh-gif.github.io/godot-games/>
- **Privacy policy URL** — required even when you collect nothing. A short page
  on the shelf site saying the app collects nothing, stores scores on the
  device, and contacts no servers would do, and would be true.
- **App Privacy questionnaire** — answer "no data collected".
- **Age rating** — 4+.
- **Export compliance** — no encryption beyond HTTPS, and it makes no network
  calls at all, so the answer is no.

Then **Product → Archive** in Xcode, and **Distribute App → App Store Connect**.

---

## What is source and what is generated

| | |
|---|---|
| `docs/star-swarm`, `slime-storm`, `dungeon-dash` | the games. The only copy. Edit here. |
| `tools/build-app.mjs` | makes `app/www/` from them, drops the update checker |
| `tools/make-icon.mjs` | draws the icon and launch screen |
| `tools/appcheck.mjs` | proves the bundle works with no network |
| `app/capacitor.config.json` | app id, name, iOS settings |
| `app/ios/` | the Xcode project. Committed, because your signing settings live here. |
| `app/www/`, `app/ios/App/App/public/` | generated. Not committed. Never edit. |
