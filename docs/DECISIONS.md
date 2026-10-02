# Decision log

Newest first. Each entry: date, decision, reason, and status (Active / Superseded by #N).
Add an entry whenever the user decides something or a non-trivial technical choice is made.

---

## #44 · 2026-10-02 · Own, minimal controls instead of GymKeeper's
**Decision:** After two preview rounds with the user (first version felt "big and noisy"):
- Sets are hairline chips; the set level is a thin coloured line at the bottom; suggested sets have a dashed edge. A small
  dashed "+" chip ends the row (no "+" icon in the card header). Log cards have no muscle figure and no group tags.
- Set editor: round outline −/+ steppers around an underlined number, levels as one row of text chips, one "Save set" button;
  delete is a trash icon in the header, cancel = tap outside / back.
- Log: day label with ‹ › arrows (tap the label for the calendar), trophy in the top bar, a small "Add exercise" pill
  bottom-right instead of the round FAB.
- "+" sheet: shortcut text links (Recent, Program, Copy a day, Comment), muscle groups as a plain list with a colour dot;
  closed with ✕ in the header and a grip (no floating "CLOSE").
- Rest timer: a small ring that empties, text buttons.
- Muscle-figure thumbnails stay only in exercise lists/search and on the exercise detail page.
**Reason:** The user did not want the app to be a copy of GymKeeper and asked for a calmer, minimalist look.
**Status:** Active

## #43 · 2026-09-29 · Muscle-map figure redrawn with the user, plus a detail close-up
**Decision:** The body figure was redrawn over several rounds with the user, using their reference pictures for proportions
only (no copied artwork): a muscular build with a larger head, thick arms and legs, light outline between the muscles; then
20 % shorter (option 3 of 3) and about 8 % narrower with the arms moved in, because the shoulders looked too wide. Thumbnails
have no equipment badge and zoom to the upper or lower body when all primary muscles are there (option B), else show the whole
body. The exercise detail page opens with a close-up of the trained body part with muscle fibres (inspired by the user's
engraving-style reference), the primary and secondary muscles as chips and the equipment in large type; photos follow under
"How to". Code: `muscleSvg(ex, crop)`, `muscleDetail(ex)`, `muscleLists(ex)` in `js/musclemap.js`.
**Reason:** The user found the first figure blocky, the head too small and the arms too thin, and approved this version.
**Status:** Active (updates #42)

## #42 · 2026-09-29 · Own muscle-map thumbnails for every exercise
**Decision:** List and card thumbnails are our own drawings (`js/musclemap.js`): a front or back body figure where the trained
muscles are lit (orange = primary, faded orange = secondary) and a small badge for the equipment. Muscles come from an id
override, else the muscle region (`group|sub`), else keywords in the name (covers custom and imported exercises). The
free-exercise-db photos (#19) stay on the exercise detail page only.
**Reason:** The user found the photo thumbnails messy and wanted one style for all exercises. Gym Visual images cannot be used:
the app and repo are public, so even "personal use" would redistribute them (#4). The legal route, if the user ever buys a
Gym Visual licence, is a local image-pack import that never goes into the repo.
**Status:** Active (supersedes the thumbnail part of #19)

## #41 · 2026-09-29 · Persistent storage and one backup file with photos
**Decision:** On start the app calls `navigator.storage.persist()`. Settings shows whether storage is protected (and warns on
iPhone Safari when the app is not opened from the home screen, because of Safari's 7-day rule). A backup is one JSON file: the
state plus `photos` (data URLs) and `backupVersion: 2`; old backups without photos still restore. "Back up to Drive, iCloud…"
uses the Web Share API with the file (shown only where file sharing works); "Download backup" saves to downloads; the weekly
reminder uses sharing when available. Restore replaces workout data and adds the photos. Code: `js/backup.js`.
**Reason:** The user asked whether data can disappear and wanted both protections (2026-09-29).
**Status:** Active (the separate photo export from #35 stays as an extra)

## #40 · 2026-09-29 · "Steel & orange" look, bottom tab bar
**Decision:** Replace the GymKeeper-like black/green look with the user's pick from a preview of three options:
slate greys (#15181c background, #1e2329 cards with a thin edge) and one orange accent (#ff7a1a, dark text on it). Type is Barlow
for the UI and Barlow Condensed for numbers and page titles (uppercase), self-hosted in `fonts/` (SIL OFL, `fonts/OFL.txt`) so
they work offline. A bottom tab bar (History, Log, Programs, Progress) sits on every page; the drawer keeps the rest. Round FAB,
pill "Start workout", orange app icon. Set level colours and muscle-group colours are unchanged. All colours are tokens in `:root`.
**Reason:** The user wanted the app to look less like GymKeeper and chose option 1 of 3 from a preview (2026-09-29).
**Status:** Active (supersedes the colour part of #14)

## #39 · 2026-09-29 · No RIR/RPE
**Decision:** The app does not get RIR or RPE. Effort stays as the six set levels (warm-up, easy, normal, hard, failure, drop).
**Reason:** The user decided against it after the proposal (2026-09-29).
**Status:** Active

## #38 · 2026-09-28 · Failure holds the weight until every set matches
**Decision:** `progressSets()` in store.js: if any working set at a weight ended in failure last time, every working set at that
weight is suggested at the same weight with the best reps done there (110×4, 110×4, 110×3 F → 110×4 ×3). Only when they are all
done without failure does normal double progression (+1 rep, then more weight) continue. Warm-up and drop sets are not affected;
applies to weight+reps and reps-only exercises with suggestions on.
**Reason:** The user's rule (2026-09-28): "110×4, 110×4 and 110×4 before you move on to 110×5".
**Status:** Active. (RIR/RPE was proposed at the same time and declined, see #39.)

## #37 · 2026-09-28 · Phone back button stays inside the app
**Decision:** app.js keeps one "guard" history entry above the app's own entry. Back pops it; the app then closes the drawer or the
top dialog, or goes from any page to History, and pushes the guard again. On History with nothing open it shows "Press back again
to exit", and the next back leaves. The guard is renewed on every tap because Chrome skips entries made without a user gesture.
**Reason:** The user found that the phone's back button closed the app ("fryktelig irriterende").
**Status:** Active

## #36 · 2026-09-28 · History page, and the app opens there
**Decision:** New History view (drawer, above Workout log): compact cards per workout day, newest first, grouped by month, loaded 25
at a time. Each card: title (day comment, else Morning/Afternoon/Evening Workout from set times), date, duration, volume, PRs, and
"n × exercise | best set". Tap opens the day; ⋮ = open, repeat today, delete. The app starts on History; "Start workout" (bottom
right, "Continue workout" when today has exercises) opens today's log. Also: empty 0 kg × 0 rep sets from GymKeeper are skipped on
import and removed from already imported data (they were planned sets that were never done).
**Reason:** The user asked for it with a screenshot from another app (Strong-style history).
**Status:** Active. 2026-09-28 update (user): the card title is only Morning/Afternoon/Evening Workout ("Workout" when there
are no set times, e.g. imported days); the day comment or block name goes on its own smaller line right under it.

## #35 · 2026-09-28 · Separate export/import file for progress photos
**Decision:** Photos get their own file (`gymapp-photos-YYYY-MM-DD.json`, images as data URLs) from Settings or the ⬇/⬆ buttons in
Progress photos. Import merges: photos with an id already on the device are skipped. Choosing a photo file under "Import backup"
imports the photos instead of failing. The workout backup stays small and separate.
**Reason:** The user wanted photos to survive a phone change (follow-up to #34).
**Status:** Active

## #34 · 2026-09-28 · Progress photos in IndexedDB
**Decision:** Front/side/back photos per date (drawer → Progress photos, also from Progress and Body measurements). Images are
scaled to 1400 px (plus a 320 px thumbnail), stored as JPEG blobs in IndexedDB (`gymapp-photos`, `js/photodb.js`), never
uploaded and not part of the JSON backup. Compare picks a pose and two dates: side by side or a before/after slider, with days
apart and the body-weight change. "Delete all data" also clears the photos.
**Reason:** The user asked for progress photos that can be compared. localStorage (~5 MB) is too small for images; keeping them
on the device keeps private photos private.
**Status:** Active

## #33 · 2026-09-28 · Left and right arm and thigh
**Decision:** Body measurements have `armL`/`armR` and `thighL`/`thighR` instead of `arm`/`thigh`. `migrate()` moves an old
single value to the right side.
**Reason:** The user asked for left/right on arm and thigh (screenshot of the measurement form).
**Status:** Active (updates #28)

## #32 · 2026-09-28 · Weekly backup reminder
**Decision:** A banner on today's log when there are 3+ workout days and no backup (or "later") in 7 days. Export sets
`state.lastBackup`; the ✕ sets `state.backupSnooze`.
**Reason:** All data lives only in localStorage; the user asked for the reminder (idea #11).
**Status:** Active

## #31 · 2026-09-28 · 5/3/1 next cycle from the AMRAP sets
**Decision:** Block AMRAP sets store `goal` (prescribed reps). When a block ends, a lift whose "+" sets all reached their goal
gets its training max raised one step (2.5 kg upper / 5 kg lower); stored 1RM += step ÷ base %. A missed "+" set keeps the max.
Blocks without AMRAP sets still suggest the best e1RM (#23). "Start again from week 1" stays ticked.
**Reason:** Wendler's standard progression; user asked for auto training max (idea #9).
**Status:** Active

## #30 · 2026-09-28 · Stall detection and one-tap deload
**Decision:** A weighted card (not a block card, nothing logged yet) shows "No progress in 3 sessions" when the best working e1RM
of the last 3 sessions did not beat the session before. "Deload −10 %" lowers the planned working weights by 10 % (rounded).
**Reason:** Idea #10.
**Status:** Active

## #29 · 2026-09-28 · Strength trend and weekly sets charts
**Decision:** Progress shows best e1RM per month (sets ≤ 12 reps, warm-ups excluded) for the 4 most-trained weighted lifts over
12 months, and stacked weekly working sets per muscle group for 12 weeks. Own canvas code, no libraries.
**Reason:** Idea #7.
**Status:** Active

## #28 · 2026-09-28 · Body measurements
**Decision:** `state.body` entries become `{ date, weight?, chest?, waist?, arm?, thigh? }` (old entries still valid, no migration).
Chips on Progress pick the measure for the chart; the drawer item opens a form for all five. Lengths in cm (in for lb).
**Reason:** Idea #8; the user added chest.
**Status:** Active

## #27 · 2026-09-28 · GymKeeper CSV import, plus log-all, warm-ups, rest per exercise, wake lock, duration
**Decision:** Settings → "Import from GymKeeper (CSV)" (`js/import.js`). Exercises match by "Name · Equipment" plus an alias table;
unknown ones become custom exercises with a guessed group/type. Set comments map to levels ("Hard (failure)" → failure, other
text in brackets → set comment). Day rows give `duration` and the 💬 title. Existing days are kept or replaced (user chooses).
The user's own export file is never committed (public repo, personal data).
Also: "Log all as suggested" (button + menu), "Add warm-up sets" (bar×10, 50 %×5, 70 %×3, 85 %×1), rest seconds per exercise
in "Exercise settings" (`progression.rest`), set timestamps `at` → workout duration in the day summary, and a screen wake lock
while today has exercises (Settings toggle, on by default).
**Reason:** The user asked for all suggested ideas (#1–#6) and sent their export.
**Status:** Active

## #26 · 2026-09-28 · Blocks live under Programs
**Decision:** The Programs page has two tabs, **Programs | Blocks**. The Blocks tab holds everything the old Blocks page had.
Running blocks show as an **"Active blocks" card at the top** of the Programs tab and of the "From program" sheet, with an "Add"
button for the next block day. The drawer item is now "Programs & blocks". The old `#blocks` link opens the Blocks tab.
**Reason:** The user wanted blocks under Programs, possibly as their own category at the top. This was the suggested option.
**Status:** Active

## #25 · 2026-09-28 · Block base % per template: 100 % for Russian Squat and Smolov Jr.
**Decision:** The default base % comes from the template: **Russian Squat Program 100 %, Smolov Jr. 100 %, 5/3/1 90 %** (training
max is part of 5/3/1), and custom blocks 100 %. It can still be changed per block. Running Russian/Smolov blocks that were started
with 90 % are corrected to 100 % once, by `migrate()`.
**Reason:** The user said the 90 % training max is wrong for blocks, at least for the Russian Squat Program, whose percentages are
of the real 1RM (1RM 150 → 120 kg at 80 %, as in the user's ExRx table).
**Status:** Active. Supersedes the "base defaults to 90 %" part of #23.

## #24 · 2026-09-28 · Adjustable text and number size
**Decision:** Settings has a "Text and number size" slider (80–150 %, step 5, live preview), stored as `settings.textScale`. Every
font size in `styles.css` is written as `calc(Npx * var(--fs))`, and `applyTextScale()` sets `--fs` on `<html>` at startup and while
dragging. The canvas charts scale their fonts too. Only text and numbers scale; icons, buttons and spacing stay the same.
**Reason:** The user asked for a slider to change the text and number size.
**Status:** Active

## #23 · 2026-09-28 · Block training
**Decision:** A new "Blocks" page (drawer). A block is weeks × days × items. An item is either sets × reps @ % (with optional AMRAP
"+" and weight steps) or "normal progression" for accessories. Weight = 1RM × base % × set % (+ steps), rounded to the exercise's
weight step. Base % per block (defaults: see #25). Progress is sequential ("Week 2 · Day 3"): "Add next workout to today" adds the day as planned sets (showing "80 %")
and moves on. You can skip, go back, or tap any day in the schedule table. At the end, the app suggests new 1RMs (best e1RM
during the block) and can restart the block. Built-in templates: Russian Squat Program (6×3, per the user's ExRx table), 5/3/1
(4-week cycle, "+" sets, deload) and Smolov Jr. (3×4, +steps in weeks 2–3). The user can create their own templates (copy week,
add week). The code is in `js/blocks.js`, `js/views/blocks.js` and `js/views/blockeditor.js`. The data is in `state.blocks` and
`state.blockTemplates`. Entries created by a block carry `entry.block = { id, w, d }`, and their sets carry `pct` / `amrap`.
**Reason:** The user asked for block training and answered: training max 90 %, sequential progress, templates Russian/5-3-1/Smolov Jr + custom.
The accessory choice was left open, so the recommended option (normal progression) was used.
**Status:** Active

## #22 · 2026-09-28 · Show "Last time → Suggestion" in the app
**Decision:** Suggested sets keep last session's values (`set.last`). The card shows the change under each suggested set
(green "+1 rep" / "+2.5 kg"), and the set editor shows a "Last time | Suggestion" table for that set. Logged sets don't store `last`.
**Reason:** The user liked the "Sist / Forslag" table from the chat and wanted it in the app.
**Status:** Active

## #21 · 2026-09-28 · Per-exercise rep ranges with double progression
**Decision:** Each exercise has a rep range (min–max), a weight step and an on/off switch (`state.progression[exId]`,
defaults in `getProgression()`). Suggestions per working set:
- below max: same weight, +1 rep
- at max: + weight step, with reps from the same estimated 1RM (Epley), rounded, capped at max−1 and at least min
- far above max (e.g. 10 reps on deadlift with a 1–5 range): jump to the weight where max reps fits
- warm-ups are unchanged; bodyweight without added weight stays at max; timed exercises get +5 s
Defaults are the user's own ranges: Deadlift 1–5, Bench Press (barbell) 1–12, all triceps 10–30. Otherwise 6–12 (weight + reps)
or 5–20 (reps only). The weight step is 2.5 kg (dumbbell 2, kettlebell 4, lb 5). Edit it via the card or list ⋮ → "Rep range", or in
the exercise details. Changing the range recalculates today's suggestions if nothing has been logged on that card yet.
Examples: DL 180×5 → 182.5×4; Bench 110×12 → 112.5×11; Triceps 20×30 → 22.5×23.
**Reason:** The user pointed out that different exercises have different rep targets.
**Status:** Active. Extends #20 (the flat +1 rep rule).

## #20 · 2026-09-28 · Progressive overload suggestions
**Decision:** When an exercise is added manually or from a program and it has history, the card gets *suggested* (planned) sets
copied from the last session with progression: **same weight, same number of sets, +1 rep** on every working set (+5 s for timed
exercises; distance unchanged). **Warm-up sets (grey) are repeated unchanged.** Suggested sets show a hollow dot in last time's
level colour; tapping one opens the editor pre-filled, and saving marks it done. Exercises without history still open the set
editor directly. "From another day" and "Copy to today" copy sets exactly, without progression. The logic is in `progressSet()` / `makeSets()` in `store.js`.
**Reason:** The user asked for it. Example: last time 3 × 110 kg × 3 → suggestion 3 × 110 kg × 4.
**Status:** Active, refined by #21 (rep ranges)

## #19 · 2026-09-28 · Exercise photos from free-exercise-db (public domain) for now
**Decision:** 198 of 231 exercises show photos from free-exercise-db (Unlicense / public domain): a 144px thumbnail and
two 420×280 frames (start and end position) that alternate in the detail view. The rest keep our pictograms. The mapping is in
`js/photos.js` and `docs/photo-sources.json`. A credit is shown in Settings → About.
**Reason:** The user wanted real exercise images. The dataset the user found (hasaneyldrm/exercises-dataset) is MIT for data
only; its images/GIFs are © Gym visual and need our own purchased licence ("cloning this repository does not grant you any licence
to the media"). Gym visual's licence is a one-time purchase per item. The user may buy it later. The images are swappable
per exercise id (replace `img/ex/<id>-*.jpg`). If Gym visual media is bought, check its redistribution terms first, because the
repo is public.
**Status:** Active

## #18 · 2026-09-28 · GymKeeper-style exercise library and lists
**Decision:** 231 built-in exercises, named "Movement" + equipment variant ("Curl · Cable") in a curated order, each with a muscle
region (`sub`). Group lists have ★/region/equipment filter chips, "N days" since last done, favourites (★, first) and a ⋮ menu.
The Exercises page uses the same lists. Chin Up moved from Back to Arms; Pullover to Chest; Swing/Farmer's Walk to Full-Body;
Burpee/Mountain Climber/Jumping Jack to Cardio (as in GymKeeper). Brand names are replaced ("Hammer Strength Press" →
"Plate-Loaded Chest Press"). The equipment "Dumbbells" was renamed "Dumbbell", and saved custom exercises are migrated.
**Reason:** It matches the user's GymKeeper screenshots. Exercise names are generic, but images are not copied (#4).
**Status:** Active

## #17 · 2026-09-28 · Filled muscle-group icons
**Decision:** Muscle-group icons are body outlines with the trained muscle filled in the group colour (chest = pecs, back = lats,
core = six-pack, and so on). They are drawn larger (40px) with bolder strokes, and each group row has a ⋮ menu, like GymKeeper.
**Reason:** The user said the first thin line icons looked very poor next to GymKeeper's. The drawings are our own (#4).
**Status:** Active

## #16 · 2026-09-28 · Adding exercises and sets works like GymKeeper
**Decision:** The + button opens an "Exercises" sheet (four quick tiles, then muscle groups showing days since last trained).
Picking an exercise adds an empty card and opens the set editor. Sets are entered in a dialog, not typed inline.
Sets from a program or another day are added as *planned* sets (`done: false`, no dot) and become done when saved in the editor.
**Reason:** The user wants the app to work like GymKeeper (screenshots in DESIGN-REFERENCE.md).
**Status:** Active

## #15 · 2026-09-28 · Nine muscle groups
**Decision:** Chest, Arms, Back, Legs, Shoulders, Core, Full-Body, Cardio, Other, each with its own colour (`GROUP_COLORS`).
Biceps/Triceps/Forearms became Arms, and Glutes/Calves became Legs. Exercise ids are unchanged, and `migrate()` in `store.js`
converts old saved data.
**Reason:** It matches GymKeeper's group list.
**Status:** Active

## #14 · 2026-09-28 · GymKeeper-style look: black and green, drawer navigation
**Decision:** Pure black background, dark grey cards and a green accent (`#3bb54a`), dark theme only. Navigation uses a ☰ side
drawer and a top bar; there is no bottom tab bar. Programs are shown as a two-column card grid with our own SVG artwork.
The app icon is green.
**Reason:** The user said the first version looked like a different app. The design now follows their GymKeeper screenshots.
We use our own artwork and never GymKeeper's images or icons (#4).
**Status:** Active. Replaces the first version's orange theme with a bottom nav.

## #13 · 2026-09-28 · Set intensity levels, with failure in purple
**Decision:** Each set gets an intensity level shown as a coloured dot: **grey = warm-up, green = easy, yellow = normal,
red = hard, purple = failure, blue = drop**. Failure is a full level of its own and is shown in purple. The user approved keeping
GymKeeper's DROP level too, shown in blue.
**Reason:** It matches GymKeeper's dots (grey/green/yellow/red), as confirmed by the user. The user misses failure as a level
there and suggested purple. Purple is also clearly different from red, so the two are easy to tell apart.
**Status:** Active

## #12 · 2026-09-28 · Deploy from `claude/gymkeeper-app-pq7o0u`
**Decision:** The Pages workflow deploys on pushes to `claude/gymkeeper-app-pq7o0u`. `Main` and `main` are kept in sync as
harmless leftovers.
**Reason:** The `github-pages` environment rejected both `main` and `Main` ("not allowed to deploy to github-pages due to
environment protection rules"). A test deploy from `claude/gymkeeper-app-pq7o0u` succeeded, because that was the default
branch when Pages was enabled. The user wanted it solved without changing GitHub settings. It is also the session's
designated work branch.
**Status:** Active. Supersedes #11.

## #11 · 2026-09-28 · `Main` (capital M) is the main and deploy branch
**Decision:** `Main` is the single main branch. The Pages workflow deploys on pushes to `Main`. Lowercase `main` is obsolete.
**Reason:** The `github-pages` environment only allows deploys from `Main` (it was the default branch when Pages was
enabled). The deploy from `main` failed with "Branch main is not allowed to deploy to github-pages due to environment
protection rules". The user could not delete `Main` and did not want to be asked to change more settings.
**Status:** Superseded by #12 (Main was also rejected).

## #10 · 2026-09-28 · Use lowercase `main`; `Main` to be removed
**Decision:** Fast-forward `main` to the full app instead of a new PR. Lowercase `main` is the only main branch;
the user deletes the accidental `Main` branch and sets `main` as the default.
**Reason:** PR #1 closed when the feature branch was renamed to `Main`. The user chose option 1 (fast-forward `main`).
Branch names are case-sensitive, and the Pages workflow listens on `main`.
**Status:** Superseded by #11

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
