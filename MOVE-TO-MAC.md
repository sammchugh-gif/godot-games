# Moving these projects to the Mac permanently

This zip is the **complete source** of both games — everything needed to build,
run and change them. It is about half a megabyte, because all the weight in the
earlier downloads was the Godot engine binary, not your project.

What is deliberately **not** here:

- `.godot/` — Godot's import and shader cache. It is regenerated on first open
  and is full of Windows-specific absolute paths, so copying it between
  machines causes problems rather than saving time.
- `build/` — export output. Rebuild it on the Mac in one command.
- `_shots/` — dev screenshots.

A `.gitignore` in each project already excludes those.

## Setting up on the Mac

1. **Unzip somewhere outside OneDrive.** Something like `~/Developer/godot-games/`
   is ideal. Working inside a synced folder is possible but annoying: Godot
   rewrites its cache constantly and OneDrive will churn on it.

2. **Install Godot 4.7.2** from <https://godotengine.org/download/macos/> —
   the standard build, not .NET. Drag it to Applications.

3. **Open Godot → Import**, point it at `Game1/project.godot`, and click
   Import & Edit. It will spend a few seconds rebuilding the import cache.
   Repeat for `Game2`.

4. Press **F5** to play. That is it — running from the editor needs no code
   signing, so none of the "unidentified developer" trouble applies.

The first time you export, Godot will ask for **export templates**. Let it
download them (Editor → Manage Export Templates → Download and Install), and
macOS, iOS and Web exports all become available.

## Then delete the Windows copy

Once a game runs on the Mac, the copy in `OneDrive/Desktop/Godot games/` is
redundant. Move it out of OneDrive, or delete it, so you never end up editing
two diverging copies. This zip and the Mac folder become the only truth.

## Better still: put it in Git

If you want this to survive machines properly rather than being copied around:

```bash
cd ~/Developer/godot-games/Game1
git init
git add .
git commit -m "Blockfort: initial import"
```

`.gitignore` is already set up correctly, so the cache and build output stay
out. Push it to a private GitHub repo and any machine can `git clone` it —
that is what "permanently" really looks like, and you get history for free.

Do the same in `Game2`, or put both under one repo if you would rather keep
them together.

## Rebuilding on the Mac

Paths differ slightly from the Windows README (Godot lives inside its .app):

```bash
GODOT=/Applications/Godot.app/Contents/MacOS/Godot

# Play
"$GODOT" --path Game1

# Tests
"$GODOT" --headless --path Game1 -- --selftest
"$GODOT" --headless --path Game1 -- --soak

# Web build for the iPad
"$GODOT" --headless --path Game1 --export-release "Web" build/web/index.html

# Native Mac app -- signed properly this time, because you are on a Mac
"$GODOT" --headless --path Game1 --export-release "macOS" build/macos/Blockfort.zip
```

Exports made on the Mac are ad-hoc signed automatically, so the `codesign`
workaround in `READ-ME-ON-MAC.md` stops being necessary.
