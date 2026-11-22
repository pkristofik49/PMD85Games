# Sources and fidelity

## Auto

Original: **AUTO, R. D.** The [PMD 85 archive catalogue](https://pmd85.borik.net/wiki/Package:Games_Other.zip)
lists AUTO in `games-1.ptp`, entry point `JUMP 2000`, compatible with PMD
85-1/2/2A/3. Its publication year is not established here. The tape comes from
[the other-games archive](https://pmd85.borik.net/?action=download&did=10).

`tools/import-auto.mjs` extracts the exact 1,253-byte program at 2000h into
`assets/auto-native.js`. The existing PMD monitor, 8080 core, VRAM renderer and
PIO audio are reused; no game or image dependency is introduced. SHA-256:

- `games-1.ptp`: `bc4d5634c13d986a2fed5a224ab96c864b75e8bcd42a6bc6e6d07060c1b3a56d`.
- AUTO program: `ea21522e9d42ab934550e0e2469c775ba3920db2cd5120e09b90696144fd95d7`.

Reproduce with `node tools/import-auto.mjs path/to/games-1.ptp`. The PNG card
is original VRAM after twelve seconds of native execution, not recreated art.
AUTO has no title menu. Original code and artwork remain their authors' work.

`js/auto.js` executes the unmodified program and maps browser left/right to
native left-EOL (active-low PIO bit 5) and V (column 4, bit 4). Road patterns,
subpixel steering, automatic forward motion, increasing speed, crash counting,
bounces, five laps and all sound writes execute on the native core. Browser UI
adds pause, restart confirmation, translated help, touch steering and separate
full-machine saves. It stops at 230Fh only after the native finish banner and
its sound have executed. Tests include a complete unmodified five-lap run,
steering, collisions, original audio, frame partition independence and saves.
The existing hardware model and documented limits apply; this is not exhaustive
physical-hardware timing verification. Original in-game text remains native.

## Boulder Dash / BOULD+4

Original PMD release: **VBG Software (Ladislav Gavar, Vlastimil Veselý,
Libor Bedrlík), BOULD+4, 1988**. The earlier BOULDER release dates to 1987.
[The PMD 85 catalogue](https://pmd85.borik.net/wiki/Boulder_Dash) documents
68 sectors linked by a maze, extra-diamond lives and the compatible BOULD+4
release. [The VBG tape archive](https://pmd85.borik.net/?action=download&did=8)
contains `games-vbg.ptp`.

`tools/import-boulder.mjs` reads the BOULD+4 tape records and executes the
original loader and monitor on the existing 8080 core. The import-only USART
delivers original tape bytes; runtime play needs no tape interface or network.
The resulting unmodified lower 32 KiB is in `assets/boulder-native.js`; the
monitor is reused from `assets/pampuch-native.js`. SHA-256:

- Tape: `1d7884b3da76f610ef2ab5dcedead68ccdde8ca6d0f5eef2a2cd64ab5cfbeec5`.
- Loaded program: `02950bca05577e0f9a84895c56b18936326334dd80c372ca790fd0f8b4926a05`.

Run `node tools/import-boulder.mjs path/to/games-vbg.ptp` to reproduce the asset
and native title PNG. No emulator package, game library or image dependency is
added. Artwork and original program remain the work of their original authors.

`js/boulder.js` boots the original menu, sends a debounced native H and pauses
before the first maze loop. The browser adds pause, restart confirmation, help,
touch controls and an independent full-machine save. Arrows/WASD map to native
E/Y/left/right and Space/Shift drives the active-low SHIFT input. The native
maze owns sector selection and progression; no caves, object rules, enemies,
movement delays or effects are reimplemented. Rendering reads original VRAM
through the existing renderer without Pampuch's optional mouth presentation
filter. Sound uses original PIO edges with the same hardware-divider synthesis.
The existing PMD clock/video-arbitration model and hardware limits described
below apply; this is not a claim of exhaustive hardware or 68-sector playthrough
verification. Tests cover boot, native movement/audio, cave entry, SHIFT input,
frame partition independence, full saves and the exhausted-lives branch. Existing
independent CPU diagnostics and Pampuch C traces remain required and unchanged.

## Application conventions

[SMG](https://github.com/pkristofik49/SMG), snapshot
`a950378fad0c343626a181b442eb360d085ae028`: static structure, locally served Vue,
native APIs, green collection layout, five palettes, bilingual documentation
and per-commit versioning. `AGENTS.md`, the version hook and its PowerShell
helper are adapted from that project. Vue's license remains in
`vendor/LICENSE.vue`. Application icons are specific to PMD85Games. The approved
pixel design uses two rows (PMD / 85) drawn as SVG rectangles, without a font or
external image dependency. `tools/render-icons.mjs` creates the PNG derivatives;
the same SVG is used in the header and as the browser favicon.

## Flappy

[pkristofik49/Flappy](https://github.com/pkristofik49/Flappy), snapshot
`2bd5d6360b7cf0f2d8f89b854a821a52fb0fb645`, is copied under `games/flappy/`.
Runtime, assets, documentation, tests and tools are preserved. Git history and
the upstream GitHub workflow are not embedded. The only runtime integration
change: `src/app.js` registers its worker only in a top-level document. The root
worker caches its entire runtime for embedded offline use. It retains its own
settings and version.
The imported version-hook test additionally sets its temporary hook executable
on POSIX; staging Git's executable bit alone does not change filesystem mode.

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

`assets/pampuch-title.png` is the unchanged first title-screen screenshot
(`1.png`, original-resolution `s1600` link) from that review, credited to UgraUgra /
Herní Archeolog. It depicts the native 1986 "PAMPUCH & DUCH" loader screen and is
used locally as the collection thumbnail; it is not newly generated artwork.

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

`tools/export-pampuch-sprites.mjs` exports those 13 extracted bitmaps into
`assets/pampuch-sprites.png`, a 64 × 64 RGBA atlas with transparent background.
Each original 12 × 12 sprite occupies a 16 × 16 cell with 2-pixel padding;
`pampuch-sprites.json` records its rectangle and original program address.
`pampuch-sprites-preview.png` enlarges the same pixels by an integer factor of
six with English labels. Preview labels use the existing pixel font adapted
from Flappy. The empty native erasing bitmap is included and labelled explicitly.
No sprite artwork is redrawn or generated by AI. A regression check compares
atlas pixels directly with the original bytes in `PampuchNativeData.program`.

### Original logic, speed and sound

The previous approximate rules have been removed. `assets/pampuch-native.js`
contains the actual 3,984-byte game program (the tape checksum is excluded) and
the unmodified 4 KiB **PMD 85-1 monitor**. The custom JavaScript core executes
the game instructions and monitor routines directly. Ghost order/decisions,
byte-level framebuffer probes, XOR sprites, partial-ring clearing, input polling,
death delays, tombs, bonus lives and automatic level transitions are native code.
There is no second set of JavaScript game rules or geometric collision model.

Monitor ROM SHA-256:
`1fed5851c353d24f99eae88bfdb858ca0e01c9d737be94eb7e761efeeb84a849`.

ROM source: [GPMD85Emulator's monit1.rom](https://github.com/mborik/GPMD85Emulator/blob/main/rom/monit1.rom),
snapshot `10c6ad7f62a20efee1228bb1cf2abcb702c6bfde`. The README in that archive
identifies this as the original PMD 85-1 monitor, rather than the modified 1u,
1cs or newer PMD model variants. Reproduce/check both runtime data files with:

```sh
node tools/import-pampuch.mjs path/to/games-2.ptp path/to/monit1.rom --check
```

`js/i8080.js` implements 8080 instructions and flags. `js/pmd85.js` implements
the memory map, keyboard matrix, PIO aliases/bit-set-reset and 2,048,000 Hz clock.
PMD video arbitration follows the instruction durations and clock parity in
GPMD85Emulator's `ChipCpu8080P.{cpp,h}`. The adapted timing table's MIT notice is
retained in `vendor/LICENSE.pmd-timing`. Frame rate controls presentation only;
an accumulated cycle budget prevents rounding drift between animation frames.

`js/audio.js` renders PCM from the original OUT operations at their recorded
CPU cycles. Port C bit 2 directly drives the speaker; bits 1/0 gate the PMD's
4 kHz/1 kHz dividers (256/1,024 CPU cycles per half period). Absolute cycle phase
is preserved across frames and saves. No additional start/death/step note effect
is invented. Waveforms are resampled to the browser's audio rate. In particular,
the native ring pulse is not the old invented two-note sound.

### Independent verification

The processor passes the public historical diagnostics mirrored by
[superzazu/8080](https://github.com/superzazu/8080), snapshot
`274ffd700b81baabea99b0963bc1260b67132185`, with their independently published
cycle totals: 8080PRE **7,817**, TST8080 **4,924**, CPUTEST **255,653,383**.
The complete 8080EXM exerciser also passed all checksums, **2,919,050,698**
instructions and **23,803,381,171** cycles. Set `PMD_EXTENDED_CPU_TEST=1` to repeat
that longer check. Fixture origins/hashes are in `tests/fixtures/i8080/README.md`.

`tests/fixtures/pampuch-native-trace.json` was generated with the independent
superzazu **C core**, executing the same original game and ROM with GPMD's wait
states. The test compares 2,400 100-ms checkpoints across four scenarios: 180
seconds of pursuit/movement/deaths/tombs; completion of map four; completion of
map eight; timer expiration. Completion fixtures set the native remaining-ring
counter to one to exercise the original transition/bonus-life branches.
Every checkpoint compares all RAM/ROM bytes via a 32-bit hash, CPU registers,
program counter/stack/flags, cycle total and a hash/count of every timestamped
sound-port transition. These expectations come from C, not the JS engine.

To regenerate/check with separate source checkouts and a C compiler:

```sh
node tools/check-original-pampuch.mjs path/to/8080 path/to/GPMD85Emulator path/to/games-2.ptp path/to/cc --write-fixture
```

The C reference sources/compiler are development inputs, not runtime libraries
or bundled application dependencies. Normal CI uses the committed reference
fixtures and needs only Node. PCM tests additionally verify the 1/4 kHz gates,
OUT timing and invariance under different frame partitions.

### Browser boundary and limits

- The cassette loader/title/map selector is bypassed after monitor startup;
  the game starts at `0103h`, selecting map 1 (or an unlocked replay map) through
  the same operands written by the original menu at `1088h`. Gameplay/monitor
  instructions are unmodified. The browser observes entry at native completion
  branch `0796h` to persist completed maps; this does not alter CPU state or timing.
- The browser adds pause, restart confirmation, expanded view, touch keys and
  saved CPU/RAM state. Death and map transitions execute automatically with
  their original delays. Execution stops at `08BDh` after the final native death
  sound, before native name entry; the browser displays its game-over overlay.
- Browser presentation stabilizes the player's mouth using the original open /
  closed glyphs, alternating once per successful half-step observed at `0263h`.
  The original keyboard scanner repeatedly rewrites both glyphs during one step
  (`0713h`–`0722h`); sampling those intermediate writes at browser frame rate
  caused rapid flicker. The display-only glyph replacement does not write to the
  emulated framebuffer or change CPU timing, game rules or audio. Death entry at
  `0805h` hides the replacement until the next native spawn/turn. Mouth phase is
  preserved in compatible native snapshots. Other pixels retain native rendering.
- This runtime implements the hardware used by this game, not a general-purpose
  PMD emulator with cassette, peripherals or interrupt-driven applications.
  Verification is against independent execution plus documented PMD timing,
  not a physical-machine audio recording. Speaker response, output volume and
  browser audio latency naturally depend on the playback device. Presentation
  is capped at the browser frame rate; background tabs pause explicitly.
- This is PAMPUCH, not the ON&DUCH4 music variant; no continuous melody is added.
  Best scores remain local. Incompatible approximate v1 saves are not converted;
  the v2 format preserves RAM, CPU registers, cycle position and divider phase.

Public archival availability does not establish a new license for original
games or artwork. Authorship and upstream notices remain with their material;
this repository grants no additional rights to it. The runtime now includes
the original game/monitor program data as identified above. Whole downloaded
tape archives and reference screenshots remain excluded from publication.
