# Working memory

Current state of the project. Update it at the end of every task; remove anything that is no longer true.

_Last updated: 2026-09-28_

## About the user

- Writes in Norwegian → reply in Norwegian. App and code are in English.
- Security-conscious: no secrets in GitHub, ever (see DECISIONS #6).
- Wants Claude to keep notes and decisions in these Markdown files.
- Loves being able to create programs with their own nicknames in GymKeeper. Keep that front and centre.
- Doesn't want to be sent to GitHub settings. Solve it in code or git whenever possible.

## Current status

- The first full version of the app is built and tested in headless Chromium (no console errors):
  log, programs, exercises, progress/settings, timers.
- Branch: `claude/gymkeeper-app-pq7o0u`.
- Pushed to GitHub (2026-09-27) after the user granted the Claude GitHub App access to the repo.
  If a push returns 403 again, check the app's repository access at
  https://github.com/apps/claude/installations/select_target.
- The repo is public. PR #1 was closed without merging when the user renamed the feature branch to `Main`.
- **LIVE:** https://breenskillz-ctrl.github.io/GymApp/ (first deployed 2026-09-28 from commit 848cb47).
- The deploy branch is `claude/gymkeeper-app-pq7o0u` (DECISIONS #12). Every push to it deploys. `Main`/`main` are
  leftovers kept in sync. Branch deletion returns 403 for both the user and Claude.

## Next steps / ideas (not yet requested unless noted)

- [x] Push once GitHub access works (done 2026-09-27).
- [x] Open a PR to `main` (done 2026-09-27; closed, then `main` fast-forwarded instead on 2026-09-28).
- [x] Add a GitHub Pages deploy workflow (requested, done 2026-09-27).
- [x] Get the Pages deploy working without the user changing settings (2026-09-28).
- [x] Deploy succeeded (verified via the Actions run and the deployments API; the sandbox can't open github.io).
- [ ] User: test the app on the phone and give feedback.
- [ ] Open question to the user: keep GymKeeper's DROP (drop set) level alongside purple FAILURE? What colour?
- [ ] **In progress:** the user is sending GymKeeper screenshots (5 received so far: empty day, + sheet, programs, logged day, set editor). Redesign to match once all have arrived.
      See `docs/DESIGN-REFERENCE.md`. The user said the current app looks like a different app (Strong/Hevy style).
- [ ] Optional: commit an automated Playwright smoke test under `tests/`.
- [ ] Optional ideas: exercise illustrations, supersets, plate calculator, workout duration, cloud sync
      (cloud sync would need a backend and secrets → GitHub Secrets / server-side only).

## Known limitations

- Data lives only in the browser's localStorage. Clearing browser data deletes it, so export a backup first.
- No unit conversion: switching kg ↔ lb changes only the label, not the stored numbers.
- The service worker is network-first. Bump `CACHE` in `sw.js` when cached files change.
