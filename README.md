# GymApp – Workout Log

A fast, calm workout tracker. It is an installable web app (PWA) that works on phones and desktops, including offline,
and an Android app (`android-app/`). All data is stored locally on the device.

## Features

- **History** as the start page: a greeting, your number of workouts, a pie chart of the muscle groups you train most,
  and compact workout cards.
- **Daily workout log.** Change day with the arrows or the calendar. Each exercise card shows its sets as small chips;
  suggested sets have a dashed edge.
- **Set editor** with −/+ steppers, a comment, six intensity levels (warm-up, easy, normal, hard, failure, drop),
  set variants (paused, tempo, beltless, deficit, close grip, wide grip, sumo, unilateral), and tools for history,
  1RM and plates.
- **Progressive overload suggestions** with a rep range per exercise, and a rule for sets that ended in failure.
- **232 exercises** in 9 muscle groups, with our own muscle-map drawings, plus your own exercises.
- **Programs** you can name, edit, copy, import and export, and **block training** (Russian Squat, 5/3/1, Smolov Jr.
  or your own blocks).
- **Records page** with every personal record, the latest PRs and 1/3/5/10 rep maxes, plus progress charts,
  body measurements and progress photos.
- **Timers**: an automatic rest timer, countdown, Tabata and stopwatch.
- **Profile** with an optional password lock, and **backup** of everything (including photos) to one file.
- **Import** a CSV diary export from GymKeeper.

## Running locally

The app is plain HTML/CSS/JavaScript with no dependencies. It must be served over HTTP (not opened as a file):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment

Every push to the deploy branch publishes the app to GitHub Pages via `.github/workflows/pages.yml`.
No secrets are needed. Live URL: https://breenskillz-ctrl.github.io/GymApp/

The Android app is built by `.github/workflows/android.yml`.

## Credits

Exercise photos come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain / Unlicense).
Fonts: Barlow and Barlow Condensed (SIL Open Font License, `fonts/OFL.txt`).

## Secrets and API keys

**Never commit secrets or API keys to this repository.** Store them as
[GitHub Actions secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
and read them from `${{ secrets.NAME }}` in workflows. Anything shipped to the browser is public.
