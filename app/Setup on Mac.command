#!/bin/bash
# Double-click this file on the Mac.
#
# It does the whole build: checks you have what you need, installs the bits it
# can, builds the app's payload from the games, syncs it into the Xcode project
# and opens Xcode. The only thing left for you is the signing dropdown, which
# has to be done by hand the first time because it needs your Apple ID.
#
# It is safe to run again any time. That is how you pick up new changes.

set -u
cd "$(dirname "$0")" || exit 1

bold=$(tput bold 2>/dev/null || true); off=$(tput sgr0 2>/dev/null || true)
say()  { printf '\n%s==> %s%s\n' "$bold" "$1" "$off"; }
die()  { printf '\n%s\n\n' "$1"; printf 'Press return to close.'; read -r _; exit 1; }

say "Arcade — building Star Swarm, Slime Storm and Dungeon Dash for iOS"

# ---------------------------------------------------------------- Xcode
if ! /usr/bin/xcode-select -p >/dev/null 2>&1; then
  die "Xcode's command line tools are missing.
A window should have appeared asking to install them — say yes, wait for it to
finish, then double-click this file again. If no window appeared, run this in
Terminal:  xcode-select --install"
fi
if [ ! -d /Applications/Xcode.app ]; then
  printf '\nXcode itself was not found in /Applications.\n'
  printf 'The build will still run, but it cannot open Xcode at the end.\n'
fi

# ---------------------------------------------------------------- Node
if ! command -v node >/dev/null 2>&1; then
  # Homebrew installs to a different place on Apple silicon and Intel, and a
  # double-clicked script does not get the PATH a Terminal window would.
  for p in /opt/homebrew/bin /usr/local/bin; do
    if [ -x "$p/node" ]; then PATH="$p:$PATH"; fi
  done
fi
if ! command -v node >/dev/null 2>&1; then
  die "Node is not installed.
Get the LTS installer from https://nodejs.org, run it, then double-click this
file again. Nothing else needs installing — this script does the rest."
fi

NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -lt 18 ]; then
  die "Node $(node -v) is too old; this needs 18 or newer.
Get the LTS installer from https://nodejs.org and run it, then try again."
fi
say "Node $(node -v) — fine"

# ---------------------------------------------------------------- latest code
# So that running this again is the whole update, rather than "git pull, then
# run this". --ff-only means it refuses rather than merges if you have edited
# something here: nothing of yours can be lost by double-clicking this.
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  say "Fetching the latest games"
  if git pull --ff-only >/dev/null 2>&1; then
    printf 'up to date with GitHub\n'
  else
    printf 'could not fast-forward — building what is already here.\n'
    printf 'That normally means you have local edits, which is fine.\n'
  fi
fi

# ---------------------------------------------------------------- build
say "Installing the build tools (a minute or two the first time)"
npm install --no-audit --no-fund || die "npm install failed. The output above says why."

say "Building the app from the games in docs/"
node ../tools/build-app.mjs || die "The build failed. The output above says why."

say "Syncing it into the Xcode project"
npx cap sync ios || die "cap sync failed. The output above says why."

say "Opening Xcode"
npx cap open ios || printf '\nCould not open Xcode automatically.\nOpen this by hand:  %s/ios/App/App.xcodeproj\n' "$PWD"

cat <<'NEXT'

==> Done. What is left, in Xcode:

  1. Click "App" at the top of the left-hand list.
  2. Go to the "Signing & Capabilities" tab.
  3. Tick "Automatically manage signing".
  4. Under "Team", choose your Apple ID. A free one works — add it with
     Xcode → Settings → Accounts → + if it is not listed.
  5. Plug the iPad in, choose it from the device menu at the top, press ▶.

  The first time on the iPad, iOS will refuse to open it until you say it is
  trusted:  Settings → General → VPN & Device Management → your Apple ID → Trust

  To pick up later changes: double-click this file again. It fetches them
  itself — there is nothing to type.

NEXT
printf 'Press return to close.'
read -r _
