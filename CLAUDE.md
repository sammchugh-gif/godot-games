# Notes for working in this repository

- The games play offline on the family's iPads and iPhones, through a service
  worker (`docs/sw.js`) that works from lists in `docs/offline/`. **After
  adding, removing or changing any file under `docs/`, run
  `node tools/offline-list.mjs`** and commit `docs/offline/` with the change.
  `node tools/offline-list.mjs --check` says whether the lists are current.
  See `notes/offline.md`.
