# GymApp – Workout Log

A fast, simple workout tracker inspired by [GymKeeper](https://gymkeeper.app/). It is an installable
web app (PWA) that works on phones and desktops, including offline. All data is stored locally on the device.

## Features

- **Daily workout log** – swipe left/right or use the calendar to change day.
- **Smart autofill** – new exercises are pre-filled with the weight and reps from last time, and the
  "Previous" column shows what you did in your last session.
- **100+ exercises** with descriptions, grouped by muscle group and equipment (including resistance bands,
  kettlebells and bodyweight).
- **Custom exercises** with different tracking types: weight + reps, reps only, time, or distance + time.
- **10 ready-made programs** (full body, 5×5, push/pull/legs, upper/lower, home workout, resistance bands and more),
  plus your own programs or customised copies of the built-in ones.
- **Personal records** – get notified when you hit a new PR; see estimated 1RM, heaviest lift and best volume.
- **Progress and statistics** – per-exercise charts, workouts per week, sets per muscle group, week streak and body weight.
- **Timers** – a rest timer that starts automatically when you complete a set, countdown, Tabata intervals and a stopwatch.
- **Backup** – export and import all data as JSON.
- Dark and light theme (follows the system), kg or lb.

## Running locally

The app is plain HTML/CSS/JavaScript with no dependencies. It must be served over HTTP (not opened as a file):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

To use it on your phone, publish the folder on e.g. GitHub Pages, Netlify or Vercel, open the page in your
browser and choose "Add to Home Screen" to install it as an app.

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
