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
- Admin password: gates editing/deleting entries, and all host management
  (create/edit/delete/colour/initial).
- Creating a new entry (and adding attendees/photos/notes to it) only
  requires the site password — any signed-in viewer can log a dinner, not
  just the admin. Editing or deleting an existing entry still requires
  admin.

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
  marker at the centroid (a `?` glyph), distinct from the solid double-ring
  stamps used for hosted dinners.
- The suggestion form/list still follow the shared modal shell (`rounded-sm`,
  `.shadow-paper`, brass hairline), but the CTA is a brass hairline outline
  button (secondary voice), never solid oxblood — suggesting isn't the
  primary admin action.

## Exports

### tokens.css
See `src/app/globals.css` `:root` and `@theme inline` blocks — those ARE
this project's tokens.css; a duplicate file was not created to avoid two
sources of truth in a single-repo app.
