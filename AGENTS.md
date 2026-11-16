# Project instructions

- Follow the SMG structure: static HTML/CSS, classic scripts in `js/`, local Vue in `vendor/`. Vue is the only runtime library. Use native Canvas, Web Audio, storage and browser APIs; no package installation or build dependency.
- Keep the first menu card Flappy and the second Pampuch. Preserve the imported Flappy runtime under `games/flappy/`; document integration changes in `SOURCES.md`.
- Keep original Pampuch data separate in `assets/pampuch-data.js`. Record provenance and fidelity limits in `SOURCES.md`; do not describe approximate timing or sound as cycle-exact.
- After adding or removing runtime resources, run `node tools/update-shell.mjs`. The root service worker caches both games; embedded Flappy must not register its own worker.
- Use `node tools/check.mjs` and `node --test tests/*.test.mjs` for shared/Pampuch changes. Run the imported Flappy tests when its runtime changes.

- Keep code identifiers, comments, and test descriptions in English. Localized application text belongs in `js/translations.js` and is exempt from this rule.
- Keep `README.md` in English and `README_CZ.md` in Czech.
- Whenever either README changes, update the corresponding content in the other README in the same change. Keep features, behavior, commands, examples, links, and technical details consistent between both versions.
- Include both README files in documentation commits when their shared content changes.
- Display the application version from `js/version.js` in the main-menu footer, starting at `1.000` and increasing by `0.001` per commit. Keep `RELEASE` in `sw.js` identical to this version.
- Enable the tracked pre-commit hook with `git config core.hooksPath .githooks`. It derives the next version from HEAD and stages only the version file and service worker. Do not skip the hook; stage any service-worker edits before committing. When hooks are unavailable, perform the same version increment manually in the commit.
