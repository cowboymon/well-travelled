import { AppShell } from "@/components/AppShell";
import { listEntries, listHostsWithCounts, listSuggestions } from "@/lib/data";
import { isAdminUnlocked } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  let hosts: Awaited<ReturnType<typeof listHostsWithCounts>> = [];
  let entries: Awaited<ReturnType<typeof listEntries>> = [];
  let suggestions: Awaited<ReturnType<typeof listSuggestions>> = [];
  let dbError: string | null = null;

  try {
    [hosts, entries, suggestions] = await Promise.all([
      listHostsWithCounts(),
      listEntries(),
      listSuggestions(),
    ]);
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Could not load data.";
  }

  const isAdmin = await isAdminUnlocked();

  if (dbError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-paper p-8 text-center">
        <div>
          <p className="font-mono-data text-xs uppercase tracking-[0.14em] text-oxblood">
            Configuration needed
          </p>
          <p className="mt-2 max-w-md font-body text-sm text-ink-faded">
            {dbError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      initialHosts={hosts.map((h) => ({ ...h, createdAt: String(h.createdAt) }))}
      initialEntries={entries}
      initialSuggestions={suggestions.map((s) => ({
        ...s,
        createdAt: String(s.createdAt),
      }))}
      initialIsAdmin={isAdmin}
    />
  );
}
