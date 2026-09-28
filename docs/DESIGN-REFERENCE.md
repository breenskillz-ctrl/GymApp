# Design reference: GymKeeper screenshots

The user sent screenshots from GymKeeper on their phone (Android) so the app can match its layout and flow.
We copy **structure, flow and look & feel**, not GymKeeper's assets. That means no logo, no name, and no copied
icons, illustrations or exercise animations: we draw our own equivalents (DECISIONS #4). Screenshots are not
stored in the repo (the repo is public); this file describes them in words.

## 1. Day view: empty day (received 2026-09-28)

- **Background: pure black** (`#000`), not dark grey. Text is white, and secondary text is dark grey.
- **Top bar, left to right:**
  - hamburger menu ☰: navigation is in a **side drawer**, and there is **no bottom tab bar**
  - **green pill button showing the date label** ("Today"), which opens the date/calendar
  - stopwatch icon (timers)
  - calendar icon
  - overflow menu ⋮
- A small "≡" (lines) icon at the top right under the bar, probably the day comment or reorder.
- **Empty state:** a large grey "Z z z" sleep graphic in the centre, with the text **"Empty Day"** in grey below it.
- **Floating action button:** a green, rounded-square **+** at the bottom right. It opens the "Exercises" sheet (screen 2).
- Accent colour: **green** (about `#34A853`).

## 2. "Exercises" sheet: add to the day (received 2026-09-28)

Opened with the + button. Full screen, black background.

- **Header:** "Exercises" on the left, with **+** (new exercise) and **search** icons on the right.
- **A 2×2 grid of quick-action tiles.** Each is a large rounded tile with a dark background tinted in its own colour, and an icon plus a coloured label:
  | Tile | Colour | Icon |
  |---|---|---|
  | From program | purple / magenta | flexing figure |
  | From another day | green | calendar |
  | Recent exercises | blue | history clock |
  | Add comment | grey-blue | lines |
- **A list of muscle-group categories below the grid.** Each is a dark grey rounded card (about `#1E1E1E`) with:
  - a **coloured outline icon for the muscle group** on the left
  - the group name
  - **"N days"** on the right: days since that group was last trained. It is blank if the group has never been trained.
  - a ⋮ menu
- **Groups (9) and their icon colours:**
  - Chest (green)
  - Arms (red)
  - Back (blue)
  - Legs (yellow-green)
  - Shoulders (light blue)
  - Core (purple)
  - Full-Body (orange)
  - Cardio (pink/red heart)
  - Other (grey dumbbell)

  GymKeeper uses fewer and broader groups than our current 12. Arms covers biceps, triceps and forearms, and Legs covers glutes and calves.
- **"CLOSE"** text button at the bottom right.

## 3. "Programs": opened from the "From program" tile (received 2026-09-28)

- **Header:** "Programs" on the left. On the right, an **import icon** (a file with an up arrow: import a program from a file)
  and **+** (new program).
- **A two-column grid of large image cards** (roughly 4:3, rounded corners, tight gaps):
  - a background image covering the whole card
  - the **program name centred** in bold white with a text shadow, wrapping over up to 3 lines
  - a **⋮ menu** at the top right of each card
  - a **level badge** at the bottom right as a coloured pill with uppercase text: **INTERMEDIATE** is yellow with dark text,
    **ADVANCED** is red with dark red text (so **BEGINNER** is probably green). No badge when no level is set.
- **The user's own programs come first.** They get a default greyscale photo of kettlebells, and the user gives them
  **their own nicknames** (e.g. "DT's plan", "Cardio based", "Hybrid PPL", "Heggen", "AI", "Chest/Arms").
  **The user especially likes this.**
- **Built-in programs come next,** with colour photos of athletes. Examples: "Power Hypertrophy Upper Lower (P.H.U.L.) Workout",
  "10 Week Mass Building Program", "Dumbbell Only Home Or Gym Full Body Workout", "4 Day Power … Burn Workout".
- A floating **CLOSE** button at the bottom right.
- Tapping a card presumably opens the program's workouts (days) to pick one to add to today. Screenshot pending.

**Our version:** we cannot use their photos. Each card gets its own background: a dark greyscale gradient with our own
SVG illustration (kettlebell/dumbbell/barbell silhouettes), varied per program. Keep the same layout, name and badge
placement. Add program import/export (JSON file) and let users rename programs easily (nickname).

## 4. Day view: a logged workout (received 2026-09-28)

A previous day (25 Sep) with 9 exercises. **This is the most important screen.**

- **Top bar:** ☰, the **date as plain text ("25 sep.")** when it is not today (the green pill only shows "Today"),
  then the timer, calendar and ⋮ icons.
- **Day summary:** centred, small, uppercase, grey: **"9 EXS · 34 SETS · 7010 KG"**, with a ≡ icon at the right edge.
- **Muscle-group tags:** a centred row of coloured words for the groups trained that day, e.g. **Back** (blue),
  **Legs** (yellow-green), **Core** (purple), using the same colours as in the group list.
- **Day comment / title:** centred grey text, **"Fredag Lower + Hypers"**, with a ≡ icon at the right. This is the
  "Add comment" text from the + sheet, and it works as a name for the workout.
- **Exercise cards:** stacked dark grey (`#1E1E1E`) rounded cards with small gaps:
  - **A thumbnail on the left:** a square, rounded, pastel-background illustration of the exercise, with a **coloured
    left edge in the muscle-group colour** (blue = back, yellow-green = legs, purple = core).
  - **Title: "Name · Equipment"**, e.g. "Squat · Barbell", "Leg Press · Machine", "Crunch · Cable". Just the name
    if there is no equipment ("Hyperextension", "Russian Twist").
  - **Right side:** a large **+** (add a set) and **⋮** (exercise menu).
  - **Sets are shown as compact columns that wrap onto new rows** (about 6 per row), not as a table with input fields:
    - the top line is a big bold number with a small grey uppercase unit: **"120 KG"**
    - the bottom line is **"2 REP"**
    - an empty value shows as **"- KG"** / **"- REP"** (e.g. bodyweight exercises: "- KG / 15 REP")
    - there is a **small coloured dot above each set showing the set's intensity** (confirmed by the user):
      **grey = warm-up**, **green = easy**, **yellow = normal**, **red = hard**. Sets with no dot are planned but not yet performed.
    - some sets have a **red "FAILURE" pill** above them. In GymKeeper, failure is a separate tag and **not an intensity
      level**. The user misses that: **our version adds purple = failure as a fifth intensity level** (DECISIONS #13).
  - Planned sets from a program show the target reps (e.g. "- KG / 20 REP") before they are filled in.
- **Bottom right:** a round grey **🏆 trophy** button (records) next to the green **+** FAB.
- Sets are edited by tapping, not typed inline (the set editor screenshot is still to come).

## 5. Set editor dialog (received 2026-09-28)

Opens when you tap **+** on an exercise card (and presumably when you tap an existing set to edit it).

- **A centred modal dialog** in dark grey (`#1F1F1F`), rounded, over a dimmed background (not a bottom sheet).
- **Title "Set №5"**, the set number, with the subtitle **"Leg Press · Machine"** in grey.
- **Three icons at the top right:**
  - a barbell-with-plates icon, probably a plate calculator or equipment choice (to confirm)
  - a **calculator** (e.g. 1RM or plate calculator)
  - a **history clock**: this exercise's previous sets
- **Input rows**, each with a label, a large number field and **− / +** stepper buttons:
  - **"▾ KG"**: the ▾ suggests the field type or unit can be switched (kg/lb, or other measures)
  - **"REP"**
  - the focused field has a **green underline**, and the value is pre-selected so typing replaces it
- **"≡ Add comment"** row: a per-set comment.
- **Intensity selector:** a row of uppercase text buttons **WARMUP · EASY · NORMAL · HARD · DROP**. GymKeeper's levels
  therefore include **DROP** (drop set). Failure is not a level there (see #4 and DECISIONS #13).
- **CANCEL** (grey) and **ADD** (green) text buttons at the bottom right. "ADD" is presumably "SAVE" when editing.
- The number pad is the **phone's own numeric keyboard** ("Neste" = next field), not part of the app.
  → For us: `inputmode="decimal"` and `enterkeyhint="next"` so Enter moves from KG to REP and then submits.

## Still unknown (ask the user for screenshots if needed)

- 3b. Inside a program: the list of workouts/days (ours: a list of workouts with an ADD button)
- Probably: set logging for an exercise, exercise list within a group, exercise details/stats, calendar, timers, drawer menu.

## Implemented (2026-09-28)

- Switch the theme to pure black with a green accent. Replace the bottom nav with a hamburger drawer and a top bar (date pill, timer, calendar, ⋮).
- Replace the "Add exercise" and "Start from program" buttons with a green + FAB that opens the Exercises sheet (2×2 tiles and a group list).
- Merge the muscle groups into GymKeeper's 9 while keeping the existing exercise ids (DECISIONS: ids never change).
- Add "days since last trained" per group, and "Recent exercises".
- New "Empty Day" empty state with our own sleep graphic.
- Day view: summary line, coloured group tags, day comment as the title, exercise cards with a thumbnail, "Name · Equipment",
  + / ⋮, and sets as wrapping KG/REP columns with intensity dots
  (grey warm-up, green easy, yellow normal, red hard, purple failure). Trophy button next to the FAB.
- Set editor as a centred dialog: "Set №N", "Name · Equipment", history/calculator icons, KG and REP fields with −/+,
  a per-set comment, an intensity row (WARMUP · EASY · NORMAL · HARD · FAILURE · DROP), and CANCEL/ADD.
  Steppers change by 2.5 kg and 1 rep. Pre-fill from the previous set or the last session.
- Our own exercise thumbnails (simple SVG pictograms per exercise or equipment type; never GymKeeper's illustrations).
- Programs screen as a two-column image-card grid with level badges and a ⋮ menu (rename/edit/delete/export), plus program import.
