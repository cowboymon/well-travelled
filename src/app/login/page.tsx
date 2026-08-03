import { Suspense } from "react";
import { listEntries } from "@/lib/data";
import { LoginForm } from "@/components/login/LoginForm";

// Entries change over time (new dinners logged) and this page is publicly
// reachable pre-auth, so render it fresh per request rather than baking a
// stale entries snapshot in at build time.
export const dynamic = "force-dynamic";

// Evergreen placeholders used only when there are zero real entries yet
// (fresh install) — invented plausible countries/dates, clearly not real
// data, so the login background isn't empty on day one.
const PLACEHOLDER_STAMPS = [
  { id: "placeholder-jpn", countryCode: "JPN", date: "2024-04-12" },
  { id: "placeholder-ita", countryCode: "ITA", date: "2024-09-03" },
  { id: "placeholder-per", countryCode: "PER", date: "2025-01-27" },
  { id: "placeholder-mar", countryCode: "MAR", date: "2025-06-15" },
  { id: "placeholder-vnm", countryCode: "VNM", date: "2025-08-30" },
];

export default async function LoginPage() {
  // The login page itself is exempt from the site-password gate (see
  // `PUBLIC_PATHS` in middleware.ts), so this direct server-side call
  // (bypassing any authenticated API route) only ever exposes country code
  // + date for the watermark background — no host names, notes, photos, or
  // attendees. Kept to this minimal a slice deliberately, since the login
  // screen is the one place an unauthenticated visitor renders.
  const entries = await listEntries();
  const stamps =
    entries.length > 0
      ? entries.map((e) => ({ id: e.id, countryCode: e.countryCode, date: e.date }))
      : PLACEHOLDER_STAMPS;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[var(--paper)] px-4">
      <Suspense fallback={null}>
        <LoginForm stamps={stamps} />
      </Suspense>
    </div>
  );
}
