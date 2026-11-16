# PMD85Games

[Česká verze](README_CZ.md)

A Vue collection of PMD 85 game reimplementations. First card: **Flappy**.
Second card: **Pampúch & Duch**. Structure and development rules follow
[SMG](https://github.com/pkristofik49/SMG): local Vue 3.5.45, static HTML/CSS/JS,
native browser APIs, no other runtime library or npm installation.

## Run

Serve the directory using any static HTTP server. The supplied server requires
Node.js 22+ and no packages:

```sh
node tools/serve.mjs
```

Open **http://127.0.0.1:4173/PMD85Games/**. Paths also support a server root and
GitHub Pages under `/PMD85Games/`. Direct `file://` opening supports the menu and
Pampuch; Flappy's ES modules and offline support require HTTP/HTTPS.

## Games and controls

- `#/flappy`: copied from [Flappy](https://github.com/pkristofik49/Flappy), with
  200 rooms, six graphics modes, passwords, touch controls, sound and saves.
  Language, sound and graphics remain independently configurable in its window.
  See [the imported README](games/flappy/README.md).
- `#/pampuch`: eleven native maps and original monochrome sprites; five lives,
  four invulnerable ghosts, half-cell movement, one point and four time units
  per ring, blocking tombstones, repeating maps and bonus lives after completing
  maps four and eight of each cycle. Time starts at 500; expiration ends play.

Arrows/WASD change the continuing movement direction. Turning too early stops
against a wall. Touch devices provide direction buttons. P/Escape pauses,
Enter continues, N requests a new game, H toggles help, F expands and Z toggles
sound. New games require confirmation; Escape cancels. Leaving the game,
losing focus or hiding the page pauses play. Reloading restores a paused game.

Native maps and sprite pixels are exact imports. **This is not a cycle-exact
PMD emulator.** Browser timing, rectangular collisions, the ghost-chase
translation and synthesized sounds remain reconstructions. Original title,
high-score name entry and continuous melody are not reproduced. See
[SOURCES.md](SOURCES.md) for provenance and explicit fidelity limits.

## Interface, storage and offline use

Czech is the default; English and five SMG-style palettes are available.
Strings live in `js/translations.js`. Shared settings and Pampuch saves use
`pmd85games.*` localStorage keys. Flappy retains its original `flappy.*` and
`flappy-pmd85-progress-v1` keys, including existing saves on the same origin.
Storage failure does not prevent play. Saves stay in this browser without
cross-device synchronization.

The optional PWA caches both games and all runtime assets after a complete first
online load. Installation requires HTTPS or localhost. Updates wait for old
windows to close without interrupting play. Offline use before the initial
installation is complete is unavailable. Clearing browser data removes saves
and offline files. Embedded Flappy uses the root service worker.

## Structure and verification

The shared app uses `index.html`, `styles.css`, `js/`, `vendor/`, `assets/`,
`icons/` and `sw.js`. Imported Flappy lives in `games/flappy/`. Tests and tools
use only Node's built-in modules.

```sh
node tools/check.mjs
node --test tests/*.test.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File tests/versioning.ps1
cd games/flappy
node --test tests/*.test.mjs
```

From the root, `node tools/update-shell.mjs` refreshes the offline asset list;
checks reject an outdated list. Reproduce native asset extraction from a
separately downloaded tape with:

```sh
node tools/import-pampuch.mjs path/to/games-2.ptp --check
```

Optional browser checks require the development server and Chrome headless with
an isolated user-data directory and `--remote-debugging-port=9333`. Run
`node tools/browser-check.mjs`. It tests desktop/mobile, gameplay, saves,
translations, palettes, Flappy and both games offline. It clears storage on the
tested local origin, saves ignored screenshots under `test-results/`, and
regenerates PNG icons from `icons/icon.svg`.

## Versioning and GitHub Pages

Repository: https://github.com/pkristofik49/PMD85Games

```sh
git config core.hooksPath .githooks
```

The first commit is **1.000**; subsequent commits increment it by 0.001. The
hook synchronizes `js/version.js`, `sw.js` and `commit.json`. Stage edits to these
files before committing. The footer shows the version and available short
commit hash; the development server and publishing tool supply that hash.

The workflow checks both games and packages the static app with
`node tools/package.mjs`, then publishes `dist/` on pushes to `main`. Set
**Settings → Pages → Source: GitHub Actions** in the repository and enable
Actions/Pages. Intended URL: **https://pkristofik49.github.io/PMD85Games/**.
The application does not change hosting settings automatically.
