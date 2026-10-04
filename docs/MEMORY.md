# Working memory

Current state of the project. Update it at the end of every task; remove anything that is no longer true.

_Last updated: 2026-10-04 (v36: Android app with automatic folder backup)_

## About the user

- **Wants to approve before anything is published (2026-09-29):** build locally, show screenshots/preview, and only push/deploy
  after the user says they are happy.
- Writes in Norwegian → reply in Norwegian. App and code are in English.
- Security-conscious: no secrets in GitHub, ever (see DECISIONS #6).
- Wants Claude to keep notes and decisions in these Markdown files.
- Loves being able to create programs with their own nicknames. Keep that front and centre.
- Chose the "Steel & orange" look (slate greys, Barlow / Barlow Condensed); since 2026-10-03 the accent is the icon's plate blue
  #2c5aa8 (lighter #6b97e0 for text/lines), not orange (DECISIONS #48). Keep new UI in that style.
- Wants a **minimal, calm** UI: small controls, few colours, no figures except in exercise lists/search and the detail page.
- Does not want RIR/RPE; the set levels are enough.
- Progression rule: after a failure set, fill all sets up to the same reps at the same weight before adding reps or weight.
- Trains with wide, exercise-specific rep ranges (deadlift 1–5, sometimes 10 at lighter weight; bench 1–12; triceps 10–30).
- Blocks: Russian Squat (and Smolov) must use 100 % of the real 1RM, not a 90 % training max (the user corrected this 2026-09-28).
- Likes a compact History list (workout cards) as the start screen; the Android back button must never close the app by surprise.
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
- [x] First redesign (2026-09-28): black/green theme, drawer, + sheet, card day view,
      set editor dialog, 6 intensity levels, program grid with rename/import/export, 9 muscle groups.
- [x] Exercise library expanded to 231 exercises, with group lists and filters (2026-09-28).
- [x] Exercise photos added: 198/231 from free-exercise-db (public domain), 2026-09-28 (DECISIONS #19).
- [x] Progressive overload suggestions: +1 rep per working set, warm-ups unchanged (2026-09-28, DECISIONS #20).
- [x] Per-exercise rep ranges with double progression (2026-09-28, DECISIONS #21). User's ranges: DL 1–5, bench 1–12, triceps 10–30.
- [x] "Last time → Suggestion" deltas on cards and in the set editor (2026-09-28, DECISIONS #22).
- [x] Block training built (2026-09-28, DECISIONS #23): Russian Squat, 5/3/1, Smolov Jr, custom builder, schedule table,
      1RM update at the end. Base %: 100 % (Russian/Smolov/custom), 90 % (5/3/1), see DECISIONS #25. Sequential progress, all three templates.
- [x] Blocks moved under Programs (tabs + active-block cards at the top), 2026-09-28, DECISIONS #26.
- [x] Text/number size slider in Settings, 80–150 % (2026-09-28, DECISIONS #24).
- [x] Feature batch v15 (2026-09-28, DECISIONS #27–#32): GymKeeper CSV import, log all, warm-up sets, rest per exercise,
      wake lock, workout duration, strength trend + weekly sets charts, body measurements (weight/chest/waist/arm/thigh),
      5/3/1 next cycle from AMRAP, stall/deload, backup reminder.
- [ ] User: import their GymKeeper CSV on the phone (Settings → Import from GymKeeper). Tested locally with their file:
      320 days, 7512 sets, 22 new custom exercises. The file must never be committed.
- [ ] Imported custom exercises have guessed groups/equipment; the user may want to fix some (e.g. Bayesian Curls → Cable).
- [x] Left/right arm and thigh (v16, DECISIONS #33). Progress photos with compare (v17, DECISIONS #34).
- [x] Export/import of progress photos (v18, DECISIONS #35).
- [x] Failure rule: failure at a weight → all sets there repeat at the best reps before progressing (v21, DECISIONS #38).
- [x] New look "Steel & orange" with bottom tab bar and self-hosted Barlow fonts (v22, DECISIONS #40). Preview page of the
      three options: https://claude.ai/artifact/LE1Tts48g3CwKzv79Z4Ff2 (private to the user).
- [x] Persistent storage request + status in Settings, one backup file incl. photos, share to Drive/iCloud (v23, DECISIONS #41).
- [x] Own muscle-map thumbnails for all 231 exercises + custom ones (v24, DECISIONS #42). Photos only on the detail page.
- [x] Own minimal buttons/controls, approved after two preview rounds (v26, DECISIONS #44).
- [x] Local profile (name, username, optional password lock), greeting + muscle-group pie at the top of History (v27,
      DECISIONS #45). Approved and published 2026-10-03.
- [x] New app icon: five dark-blue plates with black outlines on a bar, stopper + clip (v28, DECISIONS #46). Published 2026-10-03.
- [x] "What's new" sheet after each update (v28, DECISIONS #47). Add a CHANGELOG entry with every release.
- [x] Blue accent instead of orange, icon with four plates, motivating text on an empty day (v29, DECISIONS #48).
      Published 2026-10-03.
- [x] Explained how to import all GymKeeper workouts: Settings & backup → Import from GymKeeper (CSV), on the phone (2026-10-03).
- [x] Records page with all PRs, always 1/3/5/10RM (v30, DECISIONS #49). Published 2026-10-03.
- [x] Fix: rack pulls logged as deadlifts move to a new Rack Pull exercise (v31, DECISIONS #50). Published 2026-10-03.
- [x] Set variants as tags (DECISIONS #51): now Paused, Tempo (= speed), Beltless, Deficit, Close grip, Wide grip, Sumo,
      Unilateral (v34). Backoff and Touch & go were dropped by the user; never re-add them without asking.
- [x] Removed every "inspired by / built like" reference to other apps from code comments and docs (DECISIONS #53).
      Still open (asked the user 2026-10-04): keep the GymKeeper CSV import label? Fresh private repo (drops the git
      history and the branch name)?
- [ ] Selling (DECISIONS #54): 7 days free + 199 NOK one-time, decided. Name: Loadlog (2026-10-04, DECISIONS #55). Needs: private repo, bundled files, Play Billing, merchant account.
- The user's imported set notes use "rackpull" for rack pulls; other variants may hide in set notes the same way.
- [x] Figure redrawn and approved by the user; zoomed thumbnails, muscle close-up + equipment on the detail page (v25, DECISIONS #43).
- [ ] Android app + safe storage (DECISIONS #52). The user chose Google Play; storage: no preference → folder backup.
      Phase 1 done 2026-10-04: Capacitor project in android-app/, CI builds a test APK (pre-release `android-test`, file Loadlog-test.apk; the file is replaced, the release is kept).
      Waiting for: the user to test the APK and to create a Google Play developer account (25 USD, ID check).
      Phase 2 done 2026-10-04: app renamed Loadlog (appId app.loadlog), automatic backup to a picked folder (v36).
      Next: (3) upload key in GitHub Secrets + signed .aab,
      (4) privacy policy page + store texts/screenshots, internal testing track.
      The user's phone is Android. The sandbox cannot download Actions artifacts or release files (gh refuses the redirect).
- [ ] Ideas offered, not yet requested: supersets, goals ("bench 120 by Christmas"), Monday weekly summary, voice logging,
      shareable workout card, long-press plate calculator.
- [ ] Ideas offered again 2026-10-03 (after v31), waiting for the user's pick: goals on the Records page, weekly summary on
      History, set variants as tags (paused/speed/backoff, seen in the user's set notes), supersets, Google Drive
      backup/sync, Android app (APK/Play Store), an automated test suite in the repo.
- [x] RIR/RPE: declined by the user (2026-09-29, DECISIONS #39). Don't suggest it again.
- [x] History page as the start screen + "Start workout", and the phone back button no longer closes the app (v19, DECISIONS #36, #37).
- [ ] Ideas for blocks (not requested): RPE-based prescriptions, exporting/sharing block templates, a warm-up set generator.
- [ ] 33 exercises still have no photo (list in docs/photo-sources.json → ids not in map).
- [ ] Optional: commit an automated Playwright smoke test under `tests/`.
- [ ] Optional ideas: exercise illustrations, supersets, plate calculator, workout duration, cloud sync
      (cloud sync would need a backend and secrets → GitHub Secrets / server-side only).

## Known limitations

- 2026-09-28: right after the redesign, the user's phone showed a broken page (a mix of new and old cached files). Fixed in
  `sw.js` (no-cache fetch, reload on update) and with `?v=` in index.html. See the CLAUDE.md release rule.

- Data lives only in the browser's localStorage. Clearing browser data deletes it, so export a backup first.
- No unit conversion: switching kg ↔ lb changes only the label, not the stored numbers.
- The service worker is network-first. Bump `CACHE` in `sw.js` when cached files change.

## Block training notes (2026-09-28, implemented)

The user's example is the Russian Squat Program (from ExRx's calculator, 1RM = 150 kg). The percentages are ours to encode, not copied text:

| Week | Day 1 | Day 2 | Day 3 |
|---|---|---|---|
| 1 | 80 % 6×2 | 80 % 6×3 | 80 % 6×2 |
| 2 | 80 % 6×4 | 80 % 6×2 | 80 % 6×5 |
| 3 | 80 % 6×2 | 80 % 6×6 | 80 % 6×2 |
| 4 | 85 % 5×5 | 80 % 6×2 | 90 % 4×4 |
| 5 | 80 % 6×2 | 95 % 3×3 | 80 % 6×2 |
| 6 | 100 % 2×2 | 80 % 6×2 | 105 % 1×1 (test) |

Proposed design: the block is a program type with weeks × days and a prescription per exercise (sets × reps @ %1RM, a fixed kg, or
"normal progression" for accessories). The user enters a 1RM per main lift; weights are rounded to the plate step. The app tracks
the position ("Week 2 · Day 3"), so "Next workout" adds the right day. While a block is active, it overrides rep-range suggestions for
its lifts. At the end, it offers to update the 1RM from the test.
