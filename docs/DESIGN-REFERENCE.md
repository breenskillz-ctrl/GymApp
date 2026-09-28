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

## Still to come

- 3b. Inside a program: the list of workouts/days
- Probably: set logging for an exercise, exercise list within a group, exercise details/stats, calendar, timers, drawer menu.

## Planned changes (not started; wait for all screenshots)

- Switch the theme to pure black with a green accent. Replace the bottom nav with a hamburger drawer and a top bar (date pill, timer, calendar, ⋮).
- Replace the "Add exercise" and "Start from program" buttons with a green + FAB that opens the Exercises sheet (2×2 tiles and a group list).
- Merge the muscle groups into GymKeeper's 9 while keeping the existing exercise ids (DECISIONS: ids never change).
- Add "days since last trained" per group, and "Recent exercises".
- New "Empty Day" empty state with our own sleep graphic.
- Programs screen as a two-column image-card grid with level badges and a ⋮ menu (rename/edit/delete/export), plus program import.
