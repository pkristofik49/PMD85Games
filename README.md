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

Pampuch's **Level** grid button opens the eleven-map selector. Completed maps are
marked with a check; map 1 and the next map unlocked by each completion are also
available. Other maps stay locked. Selecting a map starts a fresh attempt with
five lives and zero score through the original start-menu operands. Opening the
selector pauses play; closing it or pressing Escape restores the previous state.
Completion is detected at the native success branch, not from entering a map or
dying. The completed-map list is saved separately as `pmd85games.pampuch.completed`
and survives new games, replay, reloads and offline use in the same browser.
Older native saves infer completed earlier maps from their reached level.

The expanded view fits the native aspect ratio to the available viewport with no
fixed width cap and recalculates on resize/rotation. Touch controls remain below
the board in portrait and move beside it on short landscape screens. The menu
thumbnail shows the original Pampuch title screen. For presentation, the mouth
alternates once per completed movement half-step; intermediate native keyboard
redraws are hidden without changing game RAM, CPU timing, collisions or sound.

Pampuch now executes the original game and PMD 85-1 monitor on a small custom
JavaScript 8080 core. Ghost decisions, framebuffer-byte collisions, input polls,
death delays and level transitions follow the original instructions. Timing uses
the 2.048 MHz clock with PMD video wait states; there is no fixed browser movement
interval. Sound comes from the original PIO writes and hardware 1/4 kHz dividers,
not invented note effects. Deaths and map transitions proceed automatically.
The browser replaces the title/map selector and high-score name entry with its
own controls. This is the original PAMPUCH variant, not ON&DUCH4 with music.
See [SOURCES.md](SOURCES.md) for the exact verification scope and hardware limits.

## Interface, storage and offline use

Czech is the default; English and five SMG-style palettes are available.
Strings live in `js/translations.js`. Shared settings and Pampuch saves use
`pmd85games.*` localStorage keys. Flappy retains its original `flappy.*` and
`flappy-pmd85-progress-v1` keys, including existing saves on the same origin.
Storage failure does not prevent play. Saves stay in this browser without
cross-device synchronization. Native Pampuch snapshots use `pmd85games.pampuch.v2`
and include RAM, CPU state and divider phase. Incompatible approximate v1 games
start fresh; the old save is left untouched. Best scores/settings are retained.

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

To reproduce native program/monitor assets, append the path to `monit1.rom`.
Regular tests run three independent 8080 diagnostics and compare 2,400 native
checkpoints generated by an independent C implementation. The extended CPU
exerciser is optional: set `PMD_EXTENDED_CPU_TEST=1` and run
`node --test tests/i8080.test.mjs` (about a minute). Reference fixture generation
requires a C compiler and separate source checkouts; see `SOURCES.md`.

Optional browser checks require the development server and Chrome headless with
an isolated user-data directory and `--remote-debugging-port=9333`. Run
`node tools/browser-check.mjs`. It tests desktop/mobile, gameplay, saves,
translations, palettes, Flappy and both games offline. It clears storage on the
tested local origin and saves ignored screenshots under `test-results/`.
With the same isolated Chrome running, `node tools/render-icons.mjs` regenerates
the PNG icons from `icons/icon.svg`. The approved pixel icon shows PMD above 85;
the maskable version adds a safe inset for launcher cropping.

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
The application does not change hosting settings automatically. Until Pages is
enabled, checks and artifact preparation run successfully and deployment is
skipped with a notice. After enabling Pages, rerun the workflow to publish.
