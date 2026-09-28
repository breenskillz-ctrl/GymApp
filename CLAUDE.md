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
- Don't ask the user to change GitHub settings unless there is no other way. Solve it in the repo when possible.

## Project

GymApp is a workout tracker inspired by [GymKeeper](https://gymkeeper.app/): an installable PWA written in
plain HTML/CSS/JavaScript (ES modules). There is no build step, there are no dependencies and there is no backend.
All data is stored in `localStorage` on the device.

```
index.html            App shell, SVG icon sprite (<symbol id="i-…">), side drawer, rest bar, toast
css/styles.css        All styles: GymKeeper-like black/green dark theme (DECISIONS #14)
js/app.js             Startup, navigation (navigate(view); views call go(view) from utils), drawer
js/data.js            EXERCISES, PROGRAMS, GROUPS (9) + GROUP_COLORS, LEVELS (set intensity), EQUIPMENT, TYPES
js/store.js           State, load/save + migrate(), CRUD, history(), records(), isPR(), daySummary(), daysSinceGroups()
js/utils.js           Dates, formatting, esc(), openModal(), confirmDialog(), promptDialog(), menuDialog(), topBar(), toast()
js/icons.js           Our own SVG art: groupIcon(), exerciseThumb(), programArt(), sleepArt
js/timer.js           Global rest timer (bottom bar; adds body.resting so the FAB moves up)
js/charts.js          lineChart() and barChart() on canvas
js/views/log.js       Day view (cards with sets as KG/REP columns, FAB, day menu, calendar, records)
js/views/seteditor.js Set editor dialog (fields, −/+, comment, levels, history/1RM/plate tools)
js/views/addsheet.js  "+" sheet: quick tiles, muscle groups, exercise lists, search, copy another day
js/views/programs.js  Program grid (page + sheet), detail, ⋮ menu (rename/edit/copy/export/delete), import, editor
js/views/*.js         exercises (library + detail + editor), progress (+ settings, body weight), timers, picker
sw.js                 Network-first service worker with an offline cache
```

### Data model (localStorage key `gymapp.v1`)

```js
{
  customExercises: [{ id: 'c-…', name, group, equip, type, desc }],
  customPrograms:  [{ id: 'cp-…', name, desc, level, days, workouts: [{ id, name, exercises: [{ ex, sets, reps }] }] }],
  log:  { 'YYYY-MM-DD': { title, note, entries: [{ id, ex, sets: [{ w, r, t, d, done }] }] } },
  body: [{ date: 'YYYY-MM-DD', weight }],
  settings: { unit: 'kg'|'lb', rest: 90, sound: true, autoRest: true }
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
- When you add or rename a file under `js/`, `css/` or `icons/`, add it to `ASSETS` in `sw.js` and
  **bump `CACHE`** (e.g. `gymapp-v2` → `gymapp-v3`). Bump it on any release that changes cached files.
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
