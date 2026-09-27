# Working memory

Current state of the project. Update it at the end of every task; remove anything that is no longer true.

_Last updated: 2026-09-27_

## About the user

- Writes in Norwegian → reply in Norwegian. App and code are in English.
- Security-conscious: no secrets in GitHub, ever (see DECISIONS #6).
- Wants Claude to keep notes and decisions in these Markdown files.

## Current status

- The first full version of the app is built and tested in headless Chromium (no console errors):
  log, programs, exercises, progress/settings, timers.
- Branch: `claude/gymkeeper-app-pq7o0u`.
- Pushed to GitHub (2026-09-27) after the user granted the Claude GitHub App access to the repo.
  If a push returns 403 again, check the app's repository access at
  https://github.com/apps/claude/installations/select_target.
- The repo's default branch is still empty. All work is on the feature branch; no pull request yet.
- The app is not deployed anywhere yet.

## Next steps / ideas (not yet requested unless noted)

- [x] Push once GitHub access works (done 2026-09-27).
- [ ] Merge to the default branch / open a PR (only if the user asks).
- [ ] Deploy to GitHub Pages so the user can install the app on their phone (offered, not yet confirmed).
- [ ] Optional: commit an automated Playwright smoke test under `tests/`.
- [ ] Optional ideas: exercise illustrations, supersets, plate calculator, workout duration, cloud sync
      (cloud sync would need a backend and secrets → GitHub Secrets / server-side only).

## Known limitations

- Data lives only in the browser's localStorage. Clearing browser data deletes it, so export a backup first.
- No unit conversion: switching kg ↔ lb changes only the label, not the stored numbers.
- The service worker is network-first. Bump `CACHE` in `sw.js` when cached files change.
