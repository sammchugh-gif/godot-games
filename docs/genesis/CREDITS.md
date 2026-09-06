# Sega Genesis Arcade: credits and licences

This page runs a Sega Mega Drive / Genesis emulator in the browser and ships a
shelf of homebrew games that their authors released for free. Nothing here is a
commercial Sega, Nintendo or third-party cartridge. If you own a Genesis game
you can add its ROM file under "My cartridges"; it is stored in the browser's
own database on that device and is never uploaded or published anywhere.

## Emulator

- **EmulatorJS 4.2.3** — https://github.com/EmulatorJS/EmulatorJS — GPL-3.0.
  The files under `data/` are built from the `@emulatorjs/emulatorjs` npm
  package (the bundled `emulator.min.js` is the package's `src/*.js` files
  concatenated in loader order and minified with terser; `emulator.min.css` is
  the package's `emulator.css` minified). Source for this exact version:
  https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3 and
  https://www.npmjs.com/package/@emulatorjs/emulatorjs/v/4.2.3.
- **Genesis Plus GX core** — https://github.com/EmulatorJS/Genesis-Plus-GX
  (fork of https://github.com/ekeeke/Genesis-Plus-GX), from the
  `@emulatorjs/core-genesis_plus_gx` npm package, version 4.2.3.
  Genesis Plus GX is distributed under its own non-commercial licence; this
  site is non-commercial.
- 7-Zip / zip / unrar extraction helpers under `data/compression/` are part of
  the EmulatorJS package.

## Games

| Game | Author | Year | Licence / permission | Source of the ROM |
| --- | --- | --- | --- | --- |
| Dragon's Castle | Javier "Sik" Degirolmo | 2016 | zlib licence (repo `LICENSE`) | `witch.bin` in https://github.com/sikthehedgehog/Dragon |
| Miniplanets (REMIX Ver., REV04) | Javier "Sik" Degirolmo | 2016–2022 | zlib licence (repo `LICENSE.txt`) | prebuilt ROM in https://github.com/sikthehedgehog/miniplanets (also https://sik.itch.io/miniplanets) |
| Project MD (2012-04-29 build) | Javier "Sik" Degirolmo | 2012 | Source released under GPL-3; prebuilt ROM published by the author | `bin/projmd-20120429.bin` in https://github.com/sikthehedgehog/projectmd |
| Star Chaser (2014-07-05 build, no sound) | Javier "Sik" Degirolmo | 2014 | Free release by the author on the SpritesMind forum | https://github.com/retrobrews/md-games (`starchaser.bin`) |
| Old Towers v1.2 | RetroSouls (Denis Grachev; music Oleg Nikitin) | 2019 | CC BY-NC-SA 4.0 (stated in the release notes) | https://retrosouls.itch.io/old-towers via https://github.com/retrobrews/md-games |
| Mega Cheril Perils | The Mojon Twins (na_th_an, davidian, kendroock, anjuel) | 2017 | Free release by the authors; source at https://github.com/mojontwins/Mega_Perils | https://github.com/retrobrews/md-games (`mega-cheril-perils.bin`) |
| Break An Egg | Dr. Ludos | 2018 | "Freeware but still copyrighted" (author's note) | https://drludos.itch.io/breakanegg via https://github.com/retrobrews/md-games |
| Gravity Pig | ComradeOj | 2015 | "You may freely distribute and play the game, but not for commercial use." | https://www.mode5.net via https://github.com/retrobrews/md-games |

Each game's copyright stays with its author. This page does not sell anything,
carries no advertising, and is not affiliated with Sega. If you are the author
of one of these games and want it removed or credited differently, open an
issue on this repository and it will be done.

## Not included, on purpose

- **Cave Story MD**: the port's own licence file says Studio Pixel's art and
  story were used without permission, so it is not redistributed here.
- **Xump 2** (Retroguru): free to download but the developer asks to be
  contacted before it is mirrored elsewhere.
- Fan remakes of commercial games (Rick Dangerous, Barbarian, IK+, Fix-It Felix
  Jr., Bare Knuckle Princess and the like), and paid games or their demos
  (Papi Commando, Bomb on Basic City, T-Gun II and others).
- Commercial Sega cartridges. Use "Add a cartridge" for games you own; they stay on your device.
