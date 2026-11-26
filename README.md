# PMD85Games

[Česká verze](README_CZ.md)

A Vue collection of PMD 85 game reimplementations. First card: **Flappy**.
Second card: **Pampúch & Duch**. Third card: **Boulder Dash**. Fourth card: **Auto**.
Fifth card: **Žáby / Frogs**. Sixth card: **Manic Miner**.
Seventh card: **Cihly / Bricks**. Eighth card: **MANIC2+3**.
Structure and development rules follow
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
Pampuch, Boulder Dash, Auto, Frogs, Manic Miner, Bricks and MANIC2+3; Flappy's ES modules and offline support require HTTP/HTTPS.

## Games and controls

- `#/flappy`: copied from [Flappy](https://github.com/pkristofik49/Flappy), with
  200 rooms, six graphics modes, passwords, touch controls, sound and saves.
  Language, sound and graphics remain independently configurable in its window.
  See [the imported README](games/flappy/README.md).
- `#/pampuch`: eleven native maps and original monochrome sprites; five lives,
  four invulnerable ghosts, half-cell movement, one point and four time units
  per ring, blocking tombstones, repeating maps and bonus lives after completing
  maps four and eight of each cycle. Time starts at 500; expiration ends play.
- `#/boulder`: the original **BOULD+4 (VBG Software, 1988)** PMD program,
  with 68 sectors connected by its original maze and ten initial lives. Original
  framebuffer graphics, cave rules, enemies, falling rocks and PIO sound execute
  on the same 8080/PMD core as Pampuch. Enter sectors through the native maze;
  there is no separate browser sector picker. The card uses the native title.
  Hold arrows/WASD to move and Space/Shift for the native action; mobile controls
  include a round action button. The original E/Y/left/right/Shift matrix is
  mapped without modifying the game program. P/Escape, N, H, F and Z work as in
  Pampuch. Saves use the separate `pmd85games.boulder.v1` key with complete CPU,
  RAM and sound phase; reloading restores paused. All eight games work offline
  after the updated service worker has installed successfully.
- `#/auto`: **AUTO by R. D.**, the original PMD program from `games-1.ptp`.
  Drive five laps along the original winding road with as few crashes as possible.
  The original program controls subpixel steering, road scrolling, collision
  bounce, speed increases, crash count, finish screen and sound. Use left/right
  arrows or A/D; phones have two steering buttons. These map to the native
  left-EOL and V inputs. P/Escape, Enter, N, H, F and Z work as in Pampuch.
  Native crashes and laps are also shown below the board. A separate full-machine
  save uses `pmd85games.auto.v1`; reloading pauses play. The card uses a native
  driving screenshot because the original has no title menu. No library was added.
- `#/zaby`: **ZABY / Frogs**, the original archived MRM version. Its original
  depacker, title, platforms, jumps, eight-frog stock, pixel collisions, BCD
  scoring and PIO sound run on the existing PMD core. First press R to deploy
  a frog (native K9), then Space/Up/W to jump (native K4). Platforms carry the
  frog sideways; there is no separate steering. Phones have two corresponding
  buttons. P/Escape, Enter, N, H, F and Z work as in Pampuch. Original score
  and frog stock remain in the native screen. Saves use `pmd85games.zaby.v1`
  and restore paused. The browser replaces native high-score name entry with
  its game-over/restart overlay. The card shows the original title; no library
  was added. Author and year are not established.
- `#/manic`: **MANIC+ for PMD 85-1 (Vít Libovický and Daniel Jenne, 1985)**,
  with twenty original caverns and eight initial lives. Original item collection,
  oxygen, enemies, conveyors, crumbling floors, jumping, falls and cave transitions
  run on the existing PMD core. Move with left/right or A/D; jump with
  Space/Shift/Up/W. Phones have left/right and a separate round jump button.
  P/Escape, Enter, N, H, F and Z work as in Pampuch. Native HUD and title pixels
  are preserved. With sound enabled, the ready screen runs the native title tune
  once, stopping before attract mode; starting skips it through the original
  STOP input. The original in-game music and effects also use native PIO writes.
  Saves use `pmd85games.manic.v1`: the title resumes at its saved position;
  active play restores paused. The web game-over overlay replaces native
  high-score name entry. The card uses the original title, and no library is added.
- `#/cihly`: **Cihly / Bricks (ZED, R. D.)**, imported byte for byte from the
  original tape. The PMD program controls the paddle, ball, rebounds, brick
  erasure, points, three balls, completion animation and sounds. Use left/right
  arrows or A/D; phones have two steering buttons. P/Escape, Enter, N, H, F and
  Z work as in Pampuch. The native screen shows score, high score and ball stock.
  New game runs the original restart entry, preserving and updating the native
  record. A separate full-machine save uses `pmd85games.cihly.v1`; active games
  restore paused. The card shows the native board because this game has no
  separate title screen. No library is added; its publication year is unknown.

- `#/manic2`: **MANIC2+3 (VBG Software, 1987)**, the original connected map
  of 22 rooms and 139 keys. Choose normal play or training on the ready screen
  or new-game confirmation. The original overview, title melody, enemies,
  platforms, deaths, room transitions and PIO audio execute on the shared PMD
  core. Move with left/right or A/D; hold a direction together with Space/Shift
  to jump. Phones have two direction buttons and a separate jump button.
  P/Escape, Enter, N, H, F and Z work as in Pampuch. Training preserves lives
  but locks the final gate; the timer still runs in this archived program.
  Original HUD pixels remain intact. Saves use `pmd85games.manic2.v1` and restore
  active play paused. Native congratulations run before the victory overlay.
  No library was added. Reproduce assets with
  `node tools/import-manic2.mjs path/to/games-vbg.ptp`.

Reproduce Boulder assets without dependencies using
`node tools/import-boulder.mjs path/to/games-vbg.ptp`; see [SOURCES.md](SOURCES.md).
Auto assets can likewise be reproduced with
`node tools/import-auto.mjs path/to/games-1.ptp`.
Frogs assets use `node tools/import-zaby.mjs path/to/games-other.mrm` from the
same archive. See SOURCES.md for why the working MRM edition is used.
Manic Miner assets use `node tools/import-manic.mjs path/to/games-2.ptp` from
the same archive, executing its original tape loader during import.
Bricks assets use `node tools/import-cihly.mjs path/to/games-1.ptp`; its ZED
tape name and comparison with the annotated Cihly listing are documented in SOURCES.md.

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

The optional PWA caches all eight games and all runtime assets after a complete first
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

The original sprite graphics are also exported as
[a transparent PNG atlas](assets/pampuch-sprites.png),
[JSON frame coordinates](assets/pampuch-sprites.json) and
[a labelled enlarged preview](assets/pampuch-sprites-preview.png).
The atlas contains all 13 original 12 × 12 bitmaps (including the empty erasing
sprite) in a 64 × 64 image, using 16-pixel cells with 2-pixel padding. Regenerate
it with `node tools/export-pampuch-sprites.mjs`; `tools/check.mjs` checks it stays
up to date. This is an inspection/export asset; gameplay still uses native data.

To reproduce native program/monitor assets, append the path to `monit1.rom`.
Regular tests run three independent 8080 diagnostics and compare 2,400 native
checkpoints generated by an independent C implementation. The extended CPU
exerciser is optional: set `PMD_EXTENDED_CPU_TEST=1` and run
`node --test tests/i8080.test.mjs` (about a minute). Reference fixture generation
requires a C compiler and separate source checkouts; see `SOURCES.md`.

Optional browser checks require the development server and Chrome headless with
an isolated user-data directory and `--remote-debugging-port=9333`. Run
`node tools/browser-check.mjs`. It tests desktop/mobile, gameplay, saves,
translations, palettes, Flappy and all eight games offline. It clears storage on the
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

The workflow checks the collection and Flappy and packages the static app with
`node tools/package.mjs`, then publishes `dist/` on pushes to `main`. Set
**Settings → Pages → Source: GitHub Actions** in the repository and enable
Actions/Pages. Intended URL: **https://pkristofik49.github.io/PMD85Games/**.
The application does not change hosting settings automatically. Until Pages is
enabled, checks and artifact preparation run successfully and deployment is
skipped with a notice. After enabling Pages, rerun the workflow to publish.
