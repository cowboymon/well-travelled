# Well Travelled

A private record of every country a friend group has "visited" via
home-cooked dinners — a world map stamped with each host's pin, a legend
that doubles as a scoreboard, and a passport-style entry panel for the
details (host, date, dishes, photos, notes).

## Stack

- Next.js 15 (App Router, TypeScript, Tailwind v4, `src/` dir)
- Neon Postgres via `drizzle-orm` + `@neondatabase/serverless`
- Vercel Blob for photo storage
- d3-geo + topojson-client + world-atlas for the map
- Single shared site password gates viewing; a separate admin password
  unlocks create/edit/delete. No user accounts.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `SITE_PASSWORD` | Shared password to view the site |
| `ADMIN_PASSWORD` | Password to unlock admin (create/edit/delete) |
| `SESSION_SECRET` | Random secret used to HMAC-sign session cookies |

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the values above
npm run db:push              # pushes the Drizzle schema to your Neon DB
npm run dev
```

Open http://localhost:3000, enter the site password, then use "Admin
login" in the legend to unlock editing.

## Database

Schema lives in `src/db/schema.ts` (hosts, entries, entryPhotos). Useful
scripts:

- `npm run db:generate` — generate a SQL migration from the schema
  (already run once; see `drizzle/`)
- `npm run db:push` — push the schema directly to your Neon DB (fastest
  for a single-environment project like this one)
- `npm run db:migrate` — apply generated migrations instead, if you'd
  rather track migration files

## Deployment (Vercel + Neon + Vercel Blob)

1. Create a Neon Postgres database and copy its connection string.
2. Create a Vercel Blob store (Storage tab in the Vercel dashboard) and
   copy its read/write token.
3. Push this repo to GitHub and import it into Vercel.
4. In the Vercel project's Environment Variables, set `DATABASE_URL`,
   `BLOB_READ_WRITE_TOKEN`, `SITE_PASSWORD`, `ADMIN_PASSWORD`, and
   `SESSION_SECRET`.
5. Run `npm run db:push` locally (pointed at the Neon DB) once to create
   the tables, then deploy.

## Notes

- Everything under `/` is gated by `src/middleware.ts`, which redirects
  to `/login` unless a signed "site unlocked" cookie is present.
- Admin affordances (add/edit/delete buttons, the add-entry and
  host-manager UI) are only rendered when the "admin unlocked" cookie is
  present, and every mutation route re-checks that cookie server-side —
  the client is never trusted.
- The world map uses `world-atlas`'s `countries-110m.json` topology
  (keyed by ISO numeric id) and a static ISO numeric ⇄ alpha-3 ⇄
  name ⇄ continent lookup in `src/lib/countries.ts`.
