# Sources and fidelity

## Application conventions

[SMG](https://github.com/pkristofik49/SMG), snapshot
`a950378fad0c343626a181b442eb360d085ae028`: static structure, locally served Vue,
native APIs, green collection layout, five palettes, bilingual documentation
and per-commit versioning. `AGENTS.md`, the version hook and its PowerShell
helper are adapted from that project. Vue's license remains in
`vendor/LICENSE.vue`. Application icons are specific to PMD85Games.

## Flappy

[pkristofik49/Flappy](https://github.com/pkristofik49/Flappy), snapshot
`2bd5d6360b7cf0f2d8f89b854a821a52fb0fb645`, is copied under `games/flappy/`.
Runtime, assets, documentation, tests and tools are preserved. Git history and
the upstream GitHub workflow are not embedded. The only runtime integration
change: `src/app.js` registers its worker only in a top-level document. The root
worker caches its entire runtime for embedded offline use. It retains its own
settings and version. The collection's pixel font is adapted from Flappy.

Original artwork, platform graphics and sound limitations are documented in
[the imported SOURCES.md](games/flappy/SOURCES.md).

## Pampúch & Duch

Original: **Dušan Blaško / D. Blasko, PMD 85, 1986**.

- [Slovak Design Center catalogue](https://scd.sk/hra/pampuch-a-duch/): attribution
  and original screen references.
- [RM-TEAM archive listing](https://pmd85.borik.net/wiki/Package:Games_Other.zip).
  Use `games-2.ptp` from `pmd85emu_games_other.zip`, entry **PAMPUCH**, not
  PAMPUCHX (255 lives) or ON&DUCH4 (music variant).
- [Original archive download](https://pmd85.borik.net/?action=download&did=10).
- [Herní Archeolog's original-game review/screenshots](https://www.herniarcheolog.cz/2017/03/hra-27-pampuch-duch-1986.html)
  for visual/gameplay comparison. This is the PMD game, not Zoner's 1994 Windows
  release.

`games-2.ptp` SHA-256:
`1b5ca64fca1c7d550c5b146dbc96a0f08a3ba65a78627fed680e687f1c47f38e`.

PAMPUCH program block (3,985 bytes, loaded at `0x0100`) SHA-256:
`28371bc736e54701e3301cda6ff021959d0bc58a29ace968bb61c47faa098c6f`.

`tools/import-pampuch.mjs` verifies the program hash before extracting
`assets/pampuch-data.js`. Map n's target is at `0x0D69 + 55*n`; the next 54 bytes
are 18 rows × 3 bytes, MSB first, 24 columns. These are the original maps and
completion targets, including enclosed decorative rings.

Sprites encode six pixels per byte, low bit first, 12 rows of two bytes:
blank `0x0C80`; tomb `0x0C98`; ghost `0x0CC8`; left `0x0CE0`; right `0x0CF8`;
up `0x0D10`; down `0x0D28`; closed phases `0x0D40`–`0x0D88`; wall `0x0FFD`;
ring `0x1015`. Upper attribute bits are excluded from visible pixels. Canvas
shows the 288 × 256 game area without smoothing.

Rules reconstruct half-cell motion, continuing direction, five lives, four
invulnerable ghosts, persistent tombstones, native completion targets, ring
rewards, eleven-map cycles and bonus lives. The starting ring under the player
is removed without scoring. Native routines consulted: map `0x044E`, ghost
decisions `0x04E4`–`0x0664`, controls `0x0691`, ring reward `0x0725`, completion
`0x0788` and death/reset `0x0805`.

### Explicit fidelity limits

This is a JavaScript reimplementation, not an 8080/PMD emulator. Imported map
bytes and visible sprite pixels are exact. Other behavior remains a
reconstruction and must not be described as verified cycle-exact behavior:

- Simulation starts at a 120 ms half-step and speeds up after maps four/eight.
  Browser timing and the minimum interval differ from native processor delays.
- Ghosts continue until blocked, then choose a chase axis toward the player,
  using a shared five-block counter. This high-level translation is not
  differentially verified against all native decision branches or framebuffer
  byte probes.
- Walls, tombs and actors use rectangles on the half-cell grid. Native byte
  collisions, corner cases, sprite overlaps and half-collected ring graphics
  can differ.
- `js/audio.js` synthesizes new short square-wave effects for steps, rings,
  starting, death and completion. They are approximations, not original
  recordings or exact transcriptions of PMD monitor sound routines. The music
  variant's continuous melody is not included.
- Browser overlays replace the title, high-score name entry/table and some
  transition delays. The best score stays local. A tomb can still make a maze
  impossible, as in the original; new-game confirmation provides recovery.

Public archival availability does not establish a new license for original
games or artwork. Authorship and upstream notices remain with their material;
this repository grants no additional rights to it. Downloaded tape archives
and reference screenshots are development inputs, excluded from publication.
