# Working memory

Current state of the project. Update it at the end of every task; remove anything that is no longer true.

_Last updated: 2026-09-28_

## About the user

- Writes in Norwegian → reply in Norwegian. App and code are in English.
- Security-conscious: no secrets in GitHub, ever (see DECISIONS #6).
- Wants Claude to keep notes and decisions in these Markdown files.
- Doesn't want to be sent to GitHub settings. Solve it in code or git whenever possible.

## Current status

- The first full version of the app is built and tested in headless Chromium (no console errors):
  log, programs, exercises, progress/settings, timers.
- Branch: `claude/gymkeeper-app-pq7o0u`.
- Pushed to GitHub (2026-09-27) after the user granted the Claude GitHub App access to the repo.
  If a push returns 403 again, check the app's repository access at
  https://github.com/apps/claude/installations/select_target.
- The repo is public. PR #1 was closed without merging when the user renamed the feature branch to `Main`.
- **`Main` (capital M) is the main branch and deploys to GitHub Pages** (DECISIONS #11). Lowercase `main` is an obsolete
  leftover. Neither the user nor Claude can delete it (branch deletion returns 403), and it is harmless.
- Pages URL: https://breenskillz-ctrl.github.io/GymApp/

## Next steps / ideas (not yet requested unless noted)

- [x] Push once GitHub access works (done 2026-09-27).
- [x] Open a PR to `main` (done 2026-09-27; closed, then `main` fast-forwarded instead on 2026-09-28).
- [x] Add a GitHub Pages deploy workflow (requested, done 2026-09-27).
- [x] Get the Pages deploy working without the user changing settings (2026-09-28).
- [ ] Verify that the deployed site works once it is live.
- [ ] Optional: commit an automated Playwright smoke test under `tests/`.
- [ ] Optional ideas: exercise illustrations, supersets, plate calculator, workout duration, cloud sync
      (cloud sync would need a backend and secrets → GitHub Secrets / server-side only).

## Known limitations

- Data lives only in the browser's localStorage. Clearing browser data deletes it, so export a backup first.
- No unit conversion: switching kg ↔ lb changes only the label, not the stored numbers.
- The service worker is network-first. Bump `CACHE` in `sw.js` when cached files change.
