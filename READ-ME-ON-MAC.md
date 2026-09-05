# Running Blockfort and Star Digger on the Mac

Everything here is inside OneDrive, so this whole folder should already be on
the Mac once you sign into OneDrive there (or via onedrive.com → Desktop →
"Godot games").

## Quickest: just play them

Both games are built as native macOS apps:

- `Game1/build/macos/Blockfort.zip`
- `Game2/build/macos/StarDigger.zip`

Double-click to unzip. **They are unsigned**, because they were built on the
Windows PC and code signing needs a Mac. macOS will refuse to open them until
you sign them locally — this is a one-time, one-line fix per app. In Terminal:

```bash
cd ~/Desktop
xattr -dr com.apple.quarantine "Blockfort- Boss Siege.app"
codesign --force --deep --sign - "Blockfort- Boss Siege.app"
```

and the same for `Star Digger- Deep Boss.app`. Then double-click to play.

On an Apple Silicon Mac the `codesign` line is **required**, not optional —
macOS kills unsigned arm64 apps outright, usually with a misleading "the app is
damaged" message. Signing with `-` means "ad-hoc", which is just a local
signature; it does not need an Apple account.

(The stray dash in the app name comes from the colon in "Blockfort: Boss
Siege", which is not legal in a filename. Rename the app in Finder if you like —
that is safe.)

## Better: run them from Godot on the Mac

This avoids the signing dance entirely and lets you change the games.

1. Download **Godot 4.7.2** for macOS from <https://godotengine.org/download/macos/>
   (the standard, non-.NET build).
2. Open it, choose **Import**, and point it at `Godot games/Game1` (or `Game2`)
   in this folder.
3. Press the play button.

Running from the editor needs no signing at all. Exporting from the Mac also
produces properly signed apps, because `codesign` is present there.

## The iPad

Two options, and the web one is genuinely better for a game you just want to
play.

**Web (recommended).** `Game1/build/blockfort-web.zip` and
`Game2/build/star-digger-web.zip` are ~10 MB each and run in iPad Safari. Upload
one to any static host (itch.io, Netlify Drop, GitHub Pages), open the link on
the iPad, then Share → Add to Home Screen for a fullscreen icon. No Xcode, no
Apple account, and it never expires.

**Native iOS.** Now that you have a Mac this is possible, but it needs Xcode
and an Apple ID: export the iOS preset from Godot on the Mac, open the
generated Xcode project, set your signing team, and run it onto the iPad over
USB. With a free Apple ID the app stops working after 7 days and has to be
re-installed; a paid developer account ($99/yr) lifts that. Say the word and I
will set the iOS export preset up.

## Why opening index.html failed

`build/web/index.html` cannot be opened by double-clicking it. Browsers refuse
to load WebAssembly and fetch the `.pck` over a `file://` URL — that is a
security rule, not a broken build. It has to be served over http.

To check it locally on the Mac:

```bash
cd "Game1/build/web"
python3 -m http.server 8060
```

then open <http://localhost:8060>. If `python3` is missing, macOS will offer to
install the Command Line Tools, or you can use the Godot script instead:

```bash
/Applications/Godot.app/Contents/MacOS/Godot --headless --path Game1 --script tools/serve.gd
```

Uploading to a real host does the same job — that is why itch.io or Netlify
"just works" while a local file does not.
