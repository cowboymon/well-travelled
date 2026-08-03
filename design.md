# Design — Well Travelled

A locked design system for this app. It was not invented by Hallmark — it is
transcribed from the project's own brief (vintage passport / travel
scrapbook) and the tokens already committed in `src/app/globals.css`.
Every redesign pass reads this file before touching a page; extend or amend
it when the system needs to grow, don't regenerate per page.

## Genre
editorial (restrained, document-led — a passport register, not a marketing site)

## Macrostructure family
This is a single-purpose private app, not a multi-page marketing site.
- App shell (map + legend + panels): full-bleed document macrostructure —
  the map is the content, chrome is minimal.
- Modals/forms (add entry, host manager, admin unlock): passport-page card —
  hairline top rule, mono label, display heading, corner ticks on the
  primary entry checkpoint (login) only.

## Theme
- `--paper`          #F4EFE4
- `--ink`             #1C1E26
- `--ink-faded`       #6B6259
- `--ocean`           #C9D3D3 (pale desaturated blue-grey)
- `--unvisited-land`  #B4B2A9 (low opacity)
- `--oxblood`         #7A2E2E
- `--brass`           #B08D57

Host pin palette (the only saturated colour in the system):
rust #993C1D · ink blue #185FA5 · bottle green #0F6E56 · violet #534AB7 ·
plum #993556 · ochre #854F0B · olive #3B6D11 · stamp red #A32D2D

## Typography
- Display: Gambarino 400 — logo, country names, entry headings. Letterspaced
  ~0.2em, uppercase for wordmark/checkpoint contexts.
- Body: Supreme 400 — prose, menus, notes.
- Mono: DM Mono 300/400 — dates, codes, stats, labels, form fields.
  Uppercase, letterspaced ~0.14em.
- No italic headers. Italic reserved for the notes/running-joke field only.

## Spacing
Tailwind default scale, used consistently (no ad-hoc pixel values in
components). `rounded-sm` throughout — never `rounded-lg`/`rounded-xl`; this
is a flat-paper aesthetic, not a soft-UI one.

## Motion
- Stamp-in: scale 0.6→1, 180ms ease-out (`.animate-stamp-in`)
- Fade-lift: translateY 6px→0 + opacity, 180ms ease-out (`.animate-fade-lift`)
- Nothing longer than 200ms, nothing bouncy.

## Shadows
Hard-edged "paper lift" shadow (`.shadow-paper`, `.shadow-paper-sm` in
globals.css) replaces generic soft Tailwind `shadow-xl`/`shadow-lg` on
modals and panels — a 2–3px offset hard shadow plus a brass hairline, so
panels read as paper laid on paper, not a default web-app card. Photos keep
`shadow-sm` deliberately — that's the taped-polaroid effect, not slop.

## Microinteractions stance
- Silent success (no toasts) on entry/host mutations — the map/legend
  updating is the confirmation.
- No confirm dialogs except destructive host deletion (has entries).

## CTA voice
- Primary: solid oxblood fill, `rounded-sm`, mono uppercase label,
  tracking-[0.14em].
- Secondary: brass hairline outline, same label voice, transparent fill.

## What every screen must share
- The paper/ink/oxblood/brass palette — no new hex values outside the host
  pin palette without updating this file first.
- Gambarino for any heading-weight text, DM Mono for any label/data/form
  text, Supreme for prose.
- The mono uppercase label voice for buttons and field labels.
- `rounded-sm` cards, hairline brass dividers, no soft drop shadows.

## What screens may differ on
- Whether a card gets the `.corner-ticks` passport-stamp corner treatment
  (checkpoint/entry-gate contexts only — login. Not every modal needs it).
- Layout density (map page is full-bleed; forms are single-column, phone-
  first, under-two-minutes-to-complete).

## Access model
- Site password: gates viewing the whole app.
- Admin password: gates editing/deleting entries, and editing/deleting
  hosts (colour/initial changes, removal).
- Creating a new entry (and adding attendees/photos/notes to it) only
  requires the site password — any signed-in viewer can log a dinner, not
  just the admin. Editing or deleting an existing entry still requires
  admin.
- Creating a new host also only requires the site password — this has to
  match entry creation's access level, since the entry form's host/co-host
  pickers let any viewer promote an attendee to a host inline (via an
  explicit "Save host" step, not a silent background call). Editing an
  existing host's colour/initial or deleting a host still requires admin.

## Suggestions vs. entries (permanent rule)
Viewer-submitted country suggestions ("suggest a country") are explicitly
out of the core scope and must never be visually confused with confirmed
entries:
- Never render a suggestion as an ink stamp (`Stamp.tsx`) or with any host
  pin colour — those are reserved for confirmed hosts/dinners.
- Suggestions use a muted, "pencilled note" language: dashed borders
  (`border-dashed`), `--ink-faded` / `--brass` only, mono uppercase
  "Suggested"/"Proposed" labels.
- On the map, suggested-but-unvisited countries get a small dashed-outline
  marker at the centroid (a `?` glyph) by default. If the suggestion was
  mystery-drawn AND has an assigned person, it instead gets a solid oxblood
  push-pin marker (round head with a paper-coloured hole, point at the
  centroid) — no name label on the map itself (the assigned person's name
  lives in the suggestion card, not as map clutter) — visually distinct
  from both the plain `?` marker and the solid double-ring host stamps.
- The suggestion form/list still follow the shared modal shell (`rounded-sm`,
  `.shadow-paper`, brass hairline), but the CTA is a brass hairline outline
  button (secondary voice), never solid oxblood — suggesting isn't the
  primary admin action.
- No emoji anywhere in the UI — buttons and labels are plain mono/display
  text per the rest of the system's typography rules.

## Suggestions extensions (permanent rule)
- Mystery-drawn suggestions (the "Draw a mystery country" button) are plain
  suggestion rows — no extra DB column — distinguished only by their note
  text always starting with `Mystery assignment —` (plain text, no emoji),
  so they read differently from a human-written note without adding schema.
  The shared `isMysterySuggestion()` helper in `src/lib/suggestions.ts` is
  the single source of truth for this check (used by both the map marker
  and anywhere else that needs to tell mystery vs. human suggestions apart).
- Expressing interest in a suggestion ("I'm interested in hosting this") is
  viewer-level like the rest of the suggestions system — no admin gate.
  Interest is a `text[]` column on `suggestions` (same pattern as
  `entries.attendees`). The interested-names list and the toggle button are
  two visually separate lines/elements (italic body text for the names,
  a bordered brass button for the toggle) — never merged into one line, so
  they don't read as the same control.

## Passport stamps (permanent rule) — EXPLICIT PALETTE EXCEPTION
`src/components/ui/PassportStamp.tsx` renders a visited *country* as a
generative visa/customs stamp — a separate system from the host-pin
`Stamp.tsx` (double-ring circle only, used exclusively for map/entry-panel
host markers). Do not merge the two components or let one borrow the
other's colour system.

**This component is an intentional, explicit exception to "What every
screen must share" above.** The user asked for it to look "a bit more out
there" than the rest of the app, referencing real passport/visa/postal
stamp reference sheets (saturated single-ink colours per stamp, varied
shapes, hand-stamped tilt, small decorative flourishes). Every other
component in this app — map, forms, buttons, suggestions system — stays
locked to the paper/ink/oxblood/brass system with zero exceptions.
**A future pass must not "fix" `PassportStamp` back to oxblood-only** —
that would be reverting a deliberate decision, not a cleanup.

- **Ink palette.** One colour is picked deterministically per entry from
  `STAMP_INK_PALETTE` (`src/lib/palette.ts`) via `seededPick`: oxblood
  `#7A2E2E`, ink `#1C1E26`, navy `#2B4C7E`, crimson `#8C2F2F`, forest
  `#2F5C3F`, purple `#5B3A7A`, teal-ink `#1F5C5C`. Every element of a given
  stamp (border, text, icon) uses that one picked colour — still strictly
  single-colour-per-stamp, just not always oxblood. These are desaturated
  "classic travel ink" tones, not garish stickers — restraint still applies
  within the wider hue range.
- **Shape vocabulary.** One of eight shapes is picked deterministically per
  entry via `seededPick(id, options)`: circle, hexagon, octagon, rounded
  rectangle, horizontal oval, triangle, diamond, and a scalloped/gear-edge
  circle (wavy perforated-looking outer edge).
- **Rotation.** Each stamp gets an independent seeded tilt via
  `seededRotationRange(id, 17)` — roughly ±17°, wider than `Stamp.tsx`'s
  ±8° (`seededRotation`) — so a collection of stamps reads as more
  haphazardly hand-stamped than the neat host pins. `Stamp.tsx` and the
  collection grid's scatter nudge keep using `seededRotation`'s original
  ±8° contract unchanged.
- **Border language.** Reuses `Stamp.tsx`'s double-ring technique (solid
  outer border, ~40%-opacity inner border) and its `feTurbulence`/
  `feDisplacementMap` roughness filter, adapted to whichever shape is
  picked — still the one texture effect on the stamp, nothing layered on
  top (no second grain overlay, no compound double-stamps).
- **Text and decoration.** Country name (`font-display`, largest — arced
  along the top of the ring via `textPath` for circle/scallop shapes, a
  straight centred line for every other shape); continent
  (`font-mono-data` uppercase); a mandatory entry date formatted as a
  compact visa date (e.g. `18 NOV 2025`); a seeded `ARRIVAL`/`VISITED`
  label; short flanking rule-lines beside the label line; a small mirrored
  corner reference code (2 letters + 2-3 digits, `seededStampCode(id)`,
  purely decorative, not a real identifier); and one small seeded transit
  icon (plane, ship, train, or a 5-point star) tucked in a spare corner.
- **Detail scaling.** A `detail: "full" | "simple"` prop (defaulting to a
  `size >= 60` threshold) drops the reference-code corners, icon, arced
  text, and label at small sizes — the login watermark instances render
  `simple` automatically, keeping country/continent/date legible without
  crowding a ~70-130px stamp; the collection grid (size 100) renders
  `full`.
- **Used in:** a sparse, low-opacity watermark scatter behind the login
  form (`src/components/login/LoginForm.tsx`), and the "stamp collection"
  view (`src/components/ui/StampCollection.tsx`, opened via the Legend's
  "View stamp collection" button) — a loosely scattered grid of every
  confirmed entry, each stamp clickable through to its `EntryPanel`.

## Exports

### tokens.css
See `src/app/globals.css` `:root` and `@theme inline` blocks — those ARE
this project's tokens.css; a duplicate file was not created to avoid two
sources of truth in a single-repo app.
