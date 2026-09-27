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
- **The push to GitHub is blocked (HTTP 403).** The Claude GitHub App has no access to `breenskillz-ctrl/GymApp`.
  The user needs to connect GitHub at https://claude.ai/connect-github and install the app on the repo.
  The commits are only local until that is fixed. Check `git log origin/claude/gymkeeper-app-pq7o0u..` at the start
  of a session.
- The app is not deployed anywhere yet.

## Next steps / ideas (not yet requested unless noted)

- [ ] Push once GitHub access works (requested).
- [ ] Deploy to GitHub Pages so the user can install the app on their phone (offered, not yet confirmed).
- [ ] Optional: commit an automated Playwright smoke test under `tests/`.
- [ ] Optional ideas: exercise illustrations, supersets, plate calculator, workout duration, cloud sync
      (cloud sync would need a backend and secrets → GitHub Secrets / server-side only).

## Known limitations

- Data lives only in the browser's localStorage. Clearing browser data deletes it, so export a backup first.
- No unit conversion: switching kg ↔ lb changes only the label, not the stored numbers.
- The service worker is network-first. Bump `CACHE` in `sw.js` when cached files change.
