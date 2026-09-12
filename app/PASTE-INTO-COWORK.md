# Paste this into Claude Cowork on the Mac

Cowork runs on your machine, so it can do the parts this session cannot: it has
your Terminal, your filesystem and your copy of Xcode.

What it can do: everything up to a built app. What it cannot: the signing
dropdown and the Trust tap on the iPad. Those are Apple ID prompts and a
physical device, and no agent gets past them for you.

Paste the block below as your first message. Everything inside it is the
instruction — the surrounding text is for you.

---

## Block 1 — build it and get it onto the iPad

```
I want to build an iOS app from a GitHub repo and run it on my iPad. Work on
this Mac, in the Terminal, and tell me plainly when you hit something only I
can do.

The repo is https://github.com/sammchugh-gif/godot-games — it is mine, it is
public, and it holds three HTML5 games (Star Swarm, Slime Storm, Dungeon Dash)
already wrapped as a Capacitor iOS app under app/.

Do this:

1. Find the repo if it is already cloned somewhere under my home folder. If it
   is not, clone it into ~/Developer (make that folder if it does not exist).
   Tell me which of the two happened and the full path.

2. Check I have what the build needs, and tell me what to install if I do not:
   - Xcode from the Mac App Store, and its command line tools
     (xcode-select -p should print a path)
   - Node 18 or newer (node -v)

3. Run the build. There is a script that does the whole thing:
   app/Setup on Mac.command
   Run it from the Terminal rather than double-clicking it, so you can see the
   output: cd into the app folder and run ./"Setup on Mac.command"
   If any step of it fails, read the error, fix the cause, and run it again.
   Do not edit the games to work around a build failure — tell me instead.

4. That script ends by opening Xcode. Once Xcode is open, walk me through the
   signing step one instruction at a time, waiting for me after each one:
   - click App at the top of the left-hand file list
   - open the Signing & Capabilities tab
   - tick Automatically manage signing
   - choose my Apple ID under Team (a free Apple ID is fine; if none is
     listed, tell me how to add one in Xcode Settings > Accounts)
   - with the iPad plugged in and unlocked, pick it from the device menu at
     the top, then press the play button

5. The first launch on the iPad will fail with an untrusted developer error.
   Tell me to go to Settings > General > VPN & Device Management > my Apple
   ID > Trust, then try again.

Ground rules:
- Do not commit or push anything to the repo unless I ask.
- Do not change any file under docs/ — those are the live games and the
  website runs from them.
- If a command needs sudo, stop and ask me first.
- When it is running on the iPad, say so and stop.
```

---

## Block 2 — later, to pick up changes

Once it has been built once, this is all it takes. The script fetches the
latest games itself, so there is no `git pull` to remember.

```
Rebuild the Arcade iOS app from my godot-games repo and put the new version on
my iPad.

Find the repo (it should be under ~/Developer/godot-games), cd into its app
folder, and run ./"Setup on Mac.command" from the Terminal. It fetches the
latest games, rebuilds, and opens Xcode. Then tell me to press play in Xcode
with the iPad plugged in.

If the script says it could not fast-forward, that means something in the
folder was edited locally. Show me what (git status) and ask me before doing
anything about it.
```

---

## What to expect

The first run installs build tools and takes a few minutes. Later runs are
seconds. The only slow part is Xcode itself compiling the wrapper the first
time.

If Cowork tells you it cannot see the repo or cannot run Terminal commands,
check that the folder it is working in is one you have granted it access to —
it is sandboxed to what you point it at.
