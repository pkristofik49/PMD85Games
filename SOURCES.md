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
