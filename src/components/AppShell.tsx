"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WorldMap } from "@/components/map/WorldMap";
import { Legend } from "@/components/legend/Legend";
import { EntryPanel } from "@/components/entry-panel/EntryPanel";
import { EntryForm } from "@/components/entry-form/EntryForm";
import { HostManager } from "@/components/host-manager/HostManager";
import { SuggestionForm } from "@/components/suggestions/SuggestionForm";
import { SuggestionsList } from "@/components/suggestions/SuggestionsList";
import { COUNTRY_BY_ALPHA3 } from "@/lib/countries";
import type { EntryRecord, HostRecord, SuggestionRecord } from "@/lib/types";

export function AppShell({
  initialHosts,
  initialEntries,
  initialSuggestions,
  initialIsAdmin,
}: {
  initialHosts: HostRecord[];
  initialEntries: EntryRecord[];
  initialSuggestions: SuggestionRecord[];
  initialIsAdmin: boolean;
}) {
  const router = useRouter();
  const [hosts, setHosts] = useState(initialHosts);
  const [entries, setEntries] = useState(initialEntries);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [highlightedHostId, setHighlightedHostId] = useState<string | null>(
    null
  );
  const [showEntryForm, setShowEntryForm] = useState<{
    entry: EntryRecord | null;
    defaultCountryCode: string | null;
  } | null>(null);
  const [showHostManager, setShowHostManager] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showLegendSheet, setShowLegendSheet] = useState(false);

  const hostById = useMemo(
    () => new Map(hosts.map((h) => [h.id, h])),
    [hosts]
  );

  const visitedCountries = useMemo(
    () => new Set(entries.map((e) => e.countryCode)),
    [entries]
  );
  const continentCount = useMemo(() => {
    const continents = new Set<string>();
    for (const code of visitedCountries) {
      const c = COUNTRY_BY_ALPHA3.get(code);
      if (c) continents.add(c.continent);
    }
    return continents.size;
  }, [visitedCountries]);

  async function refreshData() {
    const [hostsRes, entriesRes] = await Promise.all([
      fetch("/api/hosts"),
      fetch("/api/entries"),
    ]);
    if (hostsRes.ok) setHosts(await hostsRes.json());
    if (entriesRes.ok) setEntries(await entriesRes.json());
  }

  async function refreshSuggestions() {
    const res = await fetch("/api/suggestions");
    if (res.ok) setSuggestions(await res.json());
  }

  const entriesForSelected = selectedCountry
    ? entries.filter((e) => e.countryCode === selectedCountry)
    : [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden md:flex-row">
      <div className="relative flex-1 bg-ocean/40">
        <WorldMap
          entries={entries}
          hostById={hostById}
          highlightedHostId={highlightedHostId}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          suggestions={suggestions}
        />
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
          <button
            onClick={() => setShowSuggestionForm(true)}
            className="rounded-sm border border-brass/60 bg-paper/90 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink shadow-paper-sm transition-colors hover:bg-black/5"
          >
            Suggest a meal
          </button>
          {suggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestionsList(true)}
              className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
            >
              View suggestions ({suggestions.length})
            </button>
          )}
          <button
            onClick={() => setShowLegendSheet(true)}
            className="rounded-full bg-oxblood px-5 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-paper shadow-paper-sm md:hidden"
          >
            Legend
          </button>
        </div>
      </div>

      <div className="hidden h-full w-[320px] shrink-0 md:block">
        <Legend
          hosts={hosts}
          visitedCount={visitedCountries.size}
          continentCount={continentCount}
          highlightedHostId={highlightedHostId}
          onHoverHost={setHighlightedHostId}
          isAdmin={isAdmin}
          onManageHosts={() => setShowHostManager(true)}
          onAddEntry={() =>
            setShowEntryForm({ entry: null, defaultCountryCode: null })
          }
          onLogoutAdmin={async () => {
            await fetch("/api/auth/admin", { method: "DELETE" });
            setIsAdmin(false);
          }}
          onUnlockAdmin={() => setShowAdminLogin(true)}
        />
      </div>

      {showLegendSheet && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-black/30 md:hidden"
          onClick={() => setShowLegendSheet(false)}
        >
          <div
            className="max-h-[75vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Legend
              hosts={hosts}
              visitedCount={visitedCountries.size}
              continentCount={continentCount}
              highlightedHostId={highlightedHostId}
              onHoverHost={setHighlightedHostId}
              isAdmin={isAdmin}
              onManageHosts={() => {
                setShowLegendSheet(false);
                setShowHostManager(true);
              }}
              onAddEntry={() => {
                setShowLegendSheet(false);
                setShowEntryForm({ entry: null, defaultCountryCode: null });
              }}
              onLogoutAdmin={async () => {
                await fetch("/api/auth/admin", { method: "DELETE" });
                setIsAdmin(false);
              }}
              onUnlockAdmin={() => {
                setShowLegendSheet(false);
                setShowAdminLogin(true);
              }}
            />
          </div>
        </div>
      )}

      {selectedCountry && (
        <EntryPanel
          countryCode={selectedCountry}
          entries={entriesForSelected}
          isAdmin={isAdmin}
          onClose={() => setSelectedCountry(null)}
          onEdit={(entry) =>
            setShowEntryForm({ entry, defaultCountryCode: null })
          }
          onDelete={async (entry) => {
            await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
            await refreshData();
          }}
          onAddForCountry={(code) =>
            setShowEntryForm({ entry: null, defaultCountryCode: code })
          }
        />
      )}

      {showEntryForm && (
        <EntryForm
          hosts={hosts}
          entry={showEntryForm.entry}
          defaultCountryCode={showEntryForm.defaultCountryCode}
          onClose={() => setShowEntryForm(null)}
          onSaved={async () => {
            setShowEntryForm(null);
            await refreshData();
          }}
          onHostCreated={refreshData}
        />
      )}

      {showHostManager && (
        <HostManager
          hosts={hosts}
          onClose={() => setShowHostManager(false)}
          onChanged={refreshData}
        />
      )}

      {showSuggestionForm && (
        <SuggestionForm
          onClose={() => setShowSuggestionForm(false)}
          onSaved={async () => {
            setShowSuggestionForm(false);
            await refreshSuggestions();
          }}
        />
      )}

      {showSuggestionsList && (
        <SuggestionsList
          suggestions={suggestions}
          onClose={() => setShowSuggestionsList(false)}
        />
      )}

      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          onUnlocked={() => {
            setIsAdmin(true);
            setShowAdminLogin(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AdminLoginModal({
  onClose,
  onUnlocked,
}: {
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Incorrect password.");
        return;
      }
      onUnlocked();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-sm border border-brass/40 bg-paper p-6 shadow-paper animate-fade-lift">
        <h2 className="mb-4 font-display text-xl text-ink">Admin password</h2>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="mb-3 w-full rounded-sm border border-brass/50 bg-white/40 px-4 py-3 font-mono-data text-sm text-ink outline-none focus:border-oxblood"
        />
        {error && (
          <p className="mb-3 font-mono-data text-xs text-oxblood">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-sm bg-oxblood px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-paper disabled:opacity-50"
          >
            {loading ? "Checking..." : "Unlock"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-sm border border-brass/50 px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
