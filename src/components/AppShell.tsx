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
import { StampCollection } from "@/components/ui/StampCollection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { COUNTRY_BY_ALPHA3, countryName } from "@/lib/countries";
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
  const [showSuggestionForm, setShowSuggestionForm] = useState<{
    defaultCountryCode: string | null;
  } | null>(null);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [showStampCollection, setShowStampCollection] = useState(false);
  const [showMysteryConfirm, setShowMysteryConfirm] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [mysteryResult, setMysteryResult] = useState<{
    person: string;
    countryCode: string;
  } | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [highlightedHostId, setHighlightedHostId] = useState<string | null>(
    null
  );
  const [showEntryForm, setShowEntryForm] = useState<{
    entry: EntryRecord | null;
    defaultCountryCode: string | null;
    defaultNotes?: string | null;
    promoteSuggestionId?: string | null;
  } | null>(null);
  const [showHostManager, setShowHostManager] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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

  const attendeeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      for (const a of e.attendees) {
        counts[a] = (counts[a] ?? 0) + 1;
      }
    }
    return counts;
  }, [entries]);

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

  async function drawMystery() {
    if (drawing) return;
    setShowMysteryConfirm(true);
  }

  async function confirmDrawMystery() {
    setShowMysteryConfirm(false);
    setDrawing(true);
    try {
      const res = await fetch("/api/suggestions/mystery", { method: "POST" });
      if (!res.ok) return;
      const result = await res.json();
      setMysteryResult({ person: result.person, countryCode: result.countryCode });
      await refreshSuggestions();
    } finally {
      setDrawing(false);
    }
  }

  const entriesForSelected = selectedCountry
    ? entries.filter((e) => e.countryCode === selectedCountry)
    : [];

  const suggestionsForSelected = selectedCountry
    ? suggestions.filter((s) => s.countryCode === selectedCountry)
    : [];

  function promoteSuggestion(suggestion: SuggestionRecord) {
    setShowEntryForm({
      entry: null,
      defaultCountryCode: suggestion.countryCode,
      defaultNotes: [
        suggestion.suggestedBy
          ? `Suggested by ${suggestion.suggestedBy}.`
          : "Suggested by a viewer.",
        suggestion.note ?? "",
      ]
        .filter(Boolean)
        .join(" "),
      promoteSuggestionId: suggestion.id,
    });
  }

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
        <div
          className={`absolute bottom-4 right-4 flex flex-col items-end gap-2 transition-opacity duration-150 ${
            selectedCountry ? "md:pointer-events-none md:opacity-0" : ""
          }`}
        >
          <button
            onClick={() =>
              setShowEntryForm({ entry: null, defaultCountryCode: null })
            }
            className="rounded-sm bg-oxblood px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-paper shadow-paper-sm transition-opacity hover:opacity-90 md:hidden"
          >
            + Add entry
          </button>
          <button
            onClick={() => setShowSuggestionForm({ defaultCountryCode: null })}
            className="rounded-sm border border-brass/60 bg-paper/90 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink shadow-paper-sm transition-colors hover:bg-black/5"
          >
            Suggest a country
          </button>
          <button
            onClick={drawMystery}
            disabled={drawing}
            className="rounded-sm border border-brass/60 bg-paper/90 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink shadow-paper-sm transition-colors hover:bg-black/5 disabled:opacity-50"
          >
            {drawing ? "Drawing..." : "Draw a mystery country"}
          </button>
          {suggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestionsList(true)}
              className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
            >
              View suggestions ({suggestions.length})
            </button>
          )}
        </div>

      </div>

      <div className="hidden h-full w-[320px] shrink-0 md:block">
        <Legend
          hosts={hosts}
          visitedCount={visitedCountries.size}
          continentCount={continentCount}
          attendeeCounts={attendeeCounts}
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
          onOpenStampCollection={() => setShowStampCollection(true)}
        />
      </div>

      {selectedCountry && (
        <EntryPanel
          countryCode={selectedCountry}
          entries={entriesForSelected}
          suggestions={suggestionsForSelected}
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
          onSuggestForCountry={(code) =>
            setShowSuggestionForm({ defaultCountryCode: code })
          }
          onPromoteSuggestion={promoteSuggestion}
        />
      )}

      {showEntryForm && (
        <EntryForm
          hosts={hosts}
          entry={showEntryForm.entry}
          defaultCountryCode={showEntryForm.defaultCountryCode}
          defaultNotes={showEntryForm.defaultNotes}
          onClose={() => setShowEntryForm(null)}
          onSaved={async () => {
            const promoteId = showEntryForm.promoteSuggestionId;
            setShowEntryForm(null);
            await refreshData();
            if (promoteId) {
              await fetch(`/api/suggestions/${promoteId}`, {
                method: "DELETE",
              });
              await refreshSuggestions();
            }
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
          defaultCountryCode={showSuggestionForm.defaultCountryCode}
          onClose={() => setShowSuggestionForm(null)}
          onSaved={async () => {
            setShowSuggestionForm(null);
            await refreshSuggestions();
          }}
        />
      )}

      {showSuggestionsList && (
        <SuggestionsList
          suggestions={suggestions}
          onClose={() => setShowSuggestionsList(false)}
          onPromoteSuggestion={(suggestion) => {
            setShowSuggestionsList(false);
            promoteSuggestion(suggestion);
          }}
        />
      )}

      {showStampCollection && (
        <StampCollection
          entries={entries}
          onClose={() => setShowStampCollection(false)}
          onSelectCountry={(code) => setSelectedCountry(code)}
        />
      )}

      <ConfirmDialog
        open={showMysteryConfirm}
        title="Mystery draw"
        message="This randomly assigns someone to an unclaimed suggestion, or a new random country if none are unclaimed. Draw a mystery country?"
        confirmLabel="Draw"
        onConfirm={confirmDrawMystery}
        onCancel={() => setShowMysteryConfirm(false)}
      />

      {mysteryResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setMysteryResult(null)}
        >
          <div
            className="animate-stamp-in rounded-sm border-2 border-oxblood bg-paper px-8 py-6 text-center shadow-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.2em] text-[var(--brass)]">
              Mystery draw
            </p>
            <p className="mt-2 font-display text-xl text-ink">
              {mysteryResult.person} has been mysteriously assigned{" "}
              {countryName(mysteryResult.countryCode)}!
            </p>
            <button
              type="button"
              onClick={() => setMysteryResult(null)}
              className="mt-4 font-mono-data text-[0.6rem] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        </div>
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
