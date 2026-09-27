# Decision log

Newest first. Each entry: date, decision, reason, and status (Active / Superseded by #N).
Add an entry whenever the user decides something or a non-trivial technical choice is made.

---

## #9 · 2026-09-27 · Hosting on GitHub Pages via Actions
**Decision:** A workflow (`.github/workflows/pages.yml`) deploys the app files to GitHub Pages on every push to `main`.
Only `index.html`, `manifest.webmanifest`, `sw.js`, `css/`, `js/` and `icons/` are published.
**Reason:** The user wanted to install the app on their phone. Pages is free for public repos and needs no secrets
(the workflow uses the built-in `GITHUB_TOKEN`).
**Status:** Active

## #8 · 2026-09-27 · `main` is the base branch; work is merged through PRs
**Decision:** Created `main` from an empty signed "Initial commit" and rebased the feature branch onto it
(force-push to the feature branch approved by the user), so the whole app lands on `main` via a pull request.
**Reason:** The repo was empty, so the first pushed branch became the default branch. A PR needs a base branch with shared history.
Note: never create commits with `git commit-tree`. It skips signing, and GitHub then shows the commit as Unverified.
**Status:** Active

## #7 · 2026-09-27 · Memory is kept in Markdown files in the repo
**Decision:** Project knowledge lives in `CLAUDE.md` (rules and conventions), `docs/DECISIONS.md` (this log) and
`docs/MEMORY.md` (status, preferences, next steps).
**Reason:** The user asked for `.md` files so Claude can remember decisions across sessions.
**Status:** Active

## #6 · 2026-09-27 · Never commit secrets; use GitHub Secrets
**Decision:** No secrets, API keys, tokens or passwords in the repository. Use GitHub Secrets. `.env` and key
files are git-ignored.
**Reason:** An explicit requirement from the user.
**Status:** Active

## #5 · 2026-09-27 · App language is English
**Decision:** All UI text, exercise names/descriptions, programs, dates, code comments and docs are in English.
Exercise ids were changed to English slugs at the same time (this was safe because no user data existed yet).
**Reason:** The user asked for the app in English. (The user still writes to Claude in Norwegian.)
**Status:** Active. Supersedes the original Norwegian UI from #1.

## #4 · 2026-09-27 · Exercise animations not included
**Decision:** Exercises have text descriptions only. GymKeeper's animated exercise illustrations are not copied.
**Reason:** No assets are available and we must not copy GymKeeper's content. We could add our own illustrations later.
**Status:** Active

## #3 · 2026-09-27 · Local-only storage with JSON export/import
**Decision:** All data is stored in `localStorage` (`gymapp.v1`). There is no account and no cloud sync. Backup is
done through JSON export/import in Settings.
**Reason:** It is simple and private, needs no backend and so no secrets. Cloud sync can be added later if wanted.
**Status:** Active

## #2 · 2026-09-27 · Vanilla PWA, no framework or build step
**Decision:** Plain HTML/CSS/ES modules, no dependencies. Installable PWA with a service worker for offline use.
**Reason:** Easy to host anywhere (e.g. GitHub Pages), fast, nothing to install or keep up to date.
**Status:** Active

## #1 · 2026-09-27 · Build a GymKeeper-inspired workout tracker
**Decision:** Build a workout log based on GymKeeper's feature set: daily log with swipe/calendar, smart
autofill from the last session, exercise library, ready-made and custom programs, PRs, progress charts,
rest/countdown/Tabata timers.
**Reason:** The user's original request. gymkeeper.app was blocked from the sandbox, so we worked out the features from
app-store listings (Google Play etc.) rather than the website itself.
**Status:** Active (the language part was superseded by #5)
