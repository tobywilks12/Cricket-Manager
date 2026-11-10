# Cricket Manager

Football Manager style career mode for cricket: Tests, ODIs, T20Is, Sheffield Shield, One-Day Cup and BBL.

## Files
- `data.js`, `data_wb.js`: players, squads, venues, real-life ratings (edit these for squad and rating updates)
- `engine.js` (Tests) and `engine_lo.js` (ODI and T20): match engines
- `career.js`, `career_wb.js`: career mode, development, competitions, saves migration (`migrate`)
- `app.js`: the interface. `GAME_VERSION` and `CHANGELOG` live at the top
- `lz.js`: save compression (lz-string, MIT)
- `sw-template.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `_headers`: installable app files
- `build.py`: builds `cricket-manager.html` (single file) and `dist/` (website and app; Netlify runs this, so dist is not committed)
- `test-*.js`: test harnesses (`node test-lo.js odi 300 AUS ENG mcg`, `node test-agg.js 3`, `node test-ct.js 12`)

## Releasing an update
1. Make the change. If the save format changes, add a step to `migrate` (never assume a field exists).
2. Bump `GAME_VERSION` in `app.js` and add a line to `CHANGELOG`.
3. Run `python3 build.py` and the tools, load an old save, play a match.
4. Commit and push. Netlify rebuilds and publishes in about a minute.
5. Players see "A new version is ready" with an Update button. Website visitors get it on their next visit.

## Hosting (Netlify)
New site from Git, pick this repository. `netlify.toml` already sets the build command and publish folder.
