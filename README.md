# GymApp – Workout Log

A fast, simple workout tracker inspired by [GymKeeper](https://gymkeeper.app/). It is an installable
web app (PWA) that works on phones and desktops, including offline. All data is stored locally on the device.

## Features

The look and flow follow GymKeeper: a black and green theme, a side menu, and a green **+** button.

- **Daily workout log.** Change day by swiping or with the calendar. Each day shows a summary (exercises · sets · kg),
  the muscle groups trained, and a comment you can use as the workout's name.
- **Exercise cards** with a picture, "Name · Equipment", and the sets shown as compact KG/REP columns.
- **Set editor.** KG and REP fields with −/+ buttons, a comment per set, and six intensity levels shown as coloured dots:
  warm-up (grey), easy (green), normal (yellow), hard (red), failure (purple) and drop (blue).
  It also has buttons for exercise history, a 1RM calculator and a plate calculator.
- **Progressive overload suggestions.** When you add an exercise you have done before, it is pre-filled with last session's
  sets: same weight, +1 rep on each working set. Warm-up sets stay the same. Tap a suggested set to log it.
- **Add from:** a program, another day, recent exercises, or muscle groups, which show how many days since you last trained each one.
- **100+ exercises** in 9 muscle groups. You can also add your own exercises.
- **Programs** as a card grid with level badges. Give your own programs nicknames, edit them, copy them, and import or export them as files.
- **Records and progress.** A notification when you set a new PR, per-exercise charts, workouts per week, sets per muscle group, and body weight.
- **Timers.** A rest timer that starts automatically, plus countdown, Tabata and stopwatch.
- **Backup.** Export and import all your data as JSON. kg or lb.

## Running locally

The app is plain HTML/CSS/JavaScript with no dependencies. It must be served over HTTP (not opened as a file):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment

Every push to `main` deploys the app to GitHub Pages via `.github/workflows/pages.yml`
(one-time setup: **Settings → Pages → Source: GitHub Actions**). No secrets are needed.

Live URL: https://breenskillz-ctrl.github.io/GymApp/ — on your phone, open it and choose
"Add to Home Screen" to install it as an app.

## Credits

Exercise photos come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain / Unlicense).

## Secrets and API keys

The app currently uses no external APIs or keys. **Never commit secrets or API keys to this repository.**
If a key is ever needed (e.g. for a deployment or a backend), store it as a
[GitHub Actions secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
and read it from `${{ secrets.NAME }}` in workflows. Local `.env` files are ignored by `.gitignore`.
Note that anything shipped to the browser is public, so keys that must stay secret belong on a server, never in the front-end code.

## Structure

```
index.html            App shell, icons and navigation
css/styles.css        Styles (dark/light theme)
js/app.js             Startup and navigation
js/data.js            Exercise library and ready-made programs
js/store.js           Storage (localStorage), history and records
js/timer.js           Global rest timer
js/charts.js          Charts drawn on canvas
js/views/*.js         Screens: log, programs, exercises, progress, timers
sw.js                 Service worker for offline use
```
