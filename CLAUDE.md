# CLAUDE.md

Guidance for Claude when working in this repository. Read this first in every session.

## Memory files – read and keep them up to date

| File | What goes in it |
|---|---|
| `CLAUDE.md` | Stable rules, conventions and how the project works (this file). |
| `docs/DECISIONS.md` | Decision log: what was decided, when and why. Add a new entry for every non-trivial decision. Never delete old entries; mark them superseded instead. |
| `docs/MEMORY.md` | Working memory: current status, open issues, the user's preferences and the next steps. Update it at the end of each task. |
| `docs/DESIGN-REFERENCE.md` | What GymKeeper looks like, from the user's screenshots, and the planned UI changes. Read it before any UI work. |

Before you finish a task: update `docs/MEMORY.md` (status and next steps) and add to `docs/DECISIONS.md`
if you made or were given a decision. Keep entries short and dated (YYYY-MM-DD).

## Hard rules

- **Never commit secrets, API keys, tokens or passwords.** Use GitHub Secrets (`${{ secrets.NAME }}` in
  workflows) instead. `.env` and key files are git-ignored. Anything shipped to the browser is public,
  so a key that must stay secret belongs on a server, never in the front-end code.
- **The app UI is in English.** The user writes in Norwegian: reply to the user in Norwegian, but
  write all app text, code, comments, commit messages and docs in English.
- **The deploy branch is `claude/gymkeeper-app-pq7o0u`.** It is the only branch the `github-pages` environment accepts.
  Every push to it deploys to https://breenskillz-ctrl.github.io/GymApp/ (see DECISIONS #12).
  `Main` and `main` are leftovers that neither the user nor Claude can delete. Keep them fast-forwarded to the same
  commit so they don't confuse anyone, but never rely on them. Do not open a pull request unless the user asks.
- The sandbox cannot reach `*.github.io`. Verify a deploy through the GitHub API instead (workflow run steps and
  `repos/.../deployments?environment=github-pages`). Deploy errors are in the check-run annotations
  (`repos/.../check-runs/<job id>/annotations`).
- **Only use images we have the rights to.** Never use GymKeeper's or Gym visual's media without a licence (DECISIONS #4, #19).
  Check the licence of any image source, including exceptions for media, before adding it.
- **Never commit the user's own exports (e.g. GymKeeper `diary_*.csv`).** They are personal data and the repo is public.
- Don't ask the user to change GitHub settings unless there is no other way. Solve it in the repo when possible.

## Project

GymApp is a workout tracker inspired by [GymKeeper](https://gymkeeper.app/): an installable PWA written in
plain HTML/CSS/JavaScript (ES modules). There is no build step, there are no dependencies and there is no backend.
All data is stored in `localStorage` on the device.

```
index.html            App shell, SVG icon sprite (<symbol id="i-…">), side drawer, bottom tab bar, rest bar, toast
css/styles.css        All styles: "Steel & orange" dark theme, colour tokens in :root (DECISIONS #40)
fonts/                Barlow + Barlow Condensed woff2 (SIL OFL, fonts/OFL.txt); --f-ui for text, --f-num for numbers/titles
js/app.js             Startup, navigation (navigate(view); views call go(view) from utils), drawer, back-button guard (DECISIONS #37)
js/data.js            EXERCISES (231, curated order, with sub + equip), PROGRAMS, GROUPS (9) + GROUP_COLORS, SUBGROUPS,
                      LEVELS (set intensity), EQUIPMENT, TYPES
js/store.js           State, load/save + migrate(), CRUD, history(), records(), isPR(), daySummary(), daysSinceGroups(),
                      getProgression()/progressSet()/makeSets(): suggested sets via per-exercise rep ranges (DECISIONS #20, #21)
js/utils.js           Dates, formatting, esc(), openModal(), confirmDialog(), promptDialog(), menuDialog(), topBar(), toast()
js/icons.js           Our own SVG art: groupIcon(), exerciseThumb() (zoomed muscle map), programArt(), sleepArt
js/musclemap.js       Muscle maps: muscleSvg(ex, crop) thumbnails, muscleDetail(ex) close-up, musclesFor(ex) (DECISIONS #42, #43)
js/photos.js          PHOTOS: ids with photos in img/ex/<id>-0.jpg, -1.jpg, shown on the exercise detail page (public domain, #19)
js/blocks.js          Block training: templates (Russian, 5/3/1, Smolov Jr), setWeight(), addBlockWorkout(), moveBlock()
js/import.js          GymKeeper CSV import: readGymKeeperCsv() (alias table, level mapping), applyImport() (DECISIONS #27)
js/backup.js          Full backup (state + photos), share/download/restore, storage.persist() + status (DECISIONS #41)
js/photodb.js         Progress photos in IndexedDB (addPhoto/allPhotos/deletePhoto); views/photos.js = timeline + compare
js/wakelock.js        Screen wake lock while today has exercises (settings.keepAwake)
js/timer.js           Global rest timer (bottom bar; adds body.resting so the FAB moves up)
js/charts.js          lineChart(), barChart(), multiLineChart(), stackedBarChart() on canvas
js/views/history.js   History (start page): compact workout cards, "Start workout" → today's log
js/views/log.js       Day view (cards with sets as KG/REP columns, FAB, day menu, calendar, records)
js/views/seteditor.js Set editor dialog (fields, −/+, comment, levels, history/1RM/plate tools)
js/views/addsheet.js  "+" sheet and exercise browser: quick tiles, group rows, filtered exercise lists (★/region/equipment), ⋮ menu
js/views/programs.js  Program grid (page + sheet), detail, ⋮ menu (rename/edit/copy/export/delete), import, editor
js/views/blocks.js    Blocks tab inside Programs (renderBlocks(el, {embedded})), activeBlocksHtml() cards, schedule, start/1RM dialogs;
                      blockeditor.js = custom block builder
js/views/*.js         exercises (library + detail + editor), progress (+ settings, body weight), timers, picker
sw.js                 Network-first service worker with an offline cache
```

### Data model (localStorage key `gymapp.v1`)

```js
{
  customExercises: [{ id: 'c-…', name, group, equip, type, desc }],
  customPrograms:  [{ id: 'cp-…', name, desc, level, days, workouts: [{ id, name, exercises: [{ ex, sets, reps }] }] }],
  log:  { 'YYYY-MM-DD': { title, duration?, entries: [{ id, ex, block?, deload?, sets: [{ w, r, t, d, done, lvl, c?, at?, last?, pct?, amrap?, goal? }] }] } },
  body: [{ date: 'YYYY-MM-DD', weight?, chest?, waist?, armL?, armR?, thighL?, thighR? }],
  favorites: ['exercise-id', …],
  progression: { 'exercise-id': { min, max, inc, auto, rest? } },
  blocks: [{ id, name, templateId, base, maxes: { exId: kg }, weeks, pos: { w, d }, started, finished }],
  blockTemplates: [ /* the user's own templates, compact items */ ],
  lastBackup, backupSnooze,          // backup files add backupVersion: 2 and photos: [...] (not stored in state)
  settings: { unit: 'kg'|'lb', rest: 90, sound: true, autoRest: true, textScale: 100, keepAwake: true }
}
```

Exercise `type`: `wr` = weight + reps, `r` = reps only, `t` = time (seconds), `dt` = distance (km) + time.
For `t` exercises in programs, `reps` means seconds.

## Conventions

- Views render with template strings and `innerHTML`. **Always wrap user-supplied text in `esc()`.**
- Events use delegation via `data-act` / `data-*` attributes. `navigate()` clears `main.onclick` etc.,
  so views assign `root.onclick = …` (not `addEventListener` on `root`).
- Modals: `openModal(html, { className: 'tall'|'small', onMount(modal, close) })`.
- Icons: add a `<symbol id="i-name">` to `index.html` and use `icon('name')`.
- Built-in exercise and program **ids must never change**, because saved logs reference them. Add new ones instead.
- If the state shape changes, keep `load()` backward compatible (merge with defaults, migrate old data).
- **On every release that changes cached files: bump `CACHE` in `sw.js` AND the `?v=` on `styles.css` and `app.js` in
  `index.html` (keep them the same number).** When you add or rename a file, add it to `ASSETS` in `sw.js`.
  Reason: GitHub Pages lets browsers cache files for 10 minutes. Without this, a phone once loaded a new index.html with
  an old stylesheet and app.js, and showed an unstyled, broken page (2026-09-28). The service worker fetches with
  `cache: 'no-cache'` and reloads once when a new version takes over.
- **Font sizes: always write them as `font-size: calc(Npx * var(--fs))`** so the Settings text-size slider works (DECISIONS #24).
  Canvas fonts use `textScale()` from utils.
- **Colours: use the tokens in `:root` (`--bg`, `--card`, `--card2`, `--text`, `--muted`, `--accent`, `--accent-ink` …), never new
  hard-coded greys.** Text on an orange background uses `--accent-ink`. Set-level and muscle-group colours stay as they are.
- The Pages workflow copies `index.html manifest.webmanifest sw.js css js icons img fonts`. Add any new top-level folder there.
- Match the existing style: 2-space indent, single quotes, semicolons, short comments only where they help.

## Running and testing

```bash
python3 -m http.server 8765        # then open http://localhost:8765
```

There is no test suite yet. Verify changes in a real browser with Playwright. Chromium is pre-installed
in the cloud sandbox: require `$(npm root -g)/playwright`, use a 390×844 viewport with `hasTouch`, collect
`pageerror` and console errors, click through the affected flows and look at screenshots.
Check both the log flow (add exercise → fill in → mark as done → rest bar) and the affected screen.
Don't run `playwright install`.
