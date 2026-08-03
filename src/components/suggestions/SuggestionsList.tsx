"use client";

import { useState } from "react";
import { countryName } from "@/lib/countries";
import { InterestToggle } from "@/components/suggestions/InterestToggle";
import type { SuggestionRecord } from "@/lib/types";

export function SuggestionsList({
  suggestions,
  onClose,
  onPromoteSuggestion,
}: {
  suggestions: SuggestionRecord[];
  onClose: () => void;
  onPromoteSuggestion: (suggestion: SuggestionRecord) => void;
}) {
  // Optimistic overrides for interest toggles, keyed by suggestion id, so a
  // toggle updates instantly without waiting on a parent-level refetch.
  const [overrides, setOverrides] = useState<Record<string, SuggestionRecord>>(
    {}
  );
  const displayed = suggestions.map((s) => overrides[s.id] ?? s);
  function onInterestUpdated(updated: SuggestionRecord) {
    setOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-sm border border-brass/40 bg-paper p-6 shadow-paper animate-fade-lift">
        <div className="flex items-center justify-between border-b border-dashed border-[var(--ink-faded)]/40 pb-3">
          <div>
            <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.2em] text-ink-faded">
              Proposed, not yet cooked
            </p>
            <h2 className="font-display text-2xl text-ink">Country suggestions</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-data text-lg text-ink-faded hover:text-ink"
          >
            &times;
          </button>
        </div>

        <ul className="flex flex-col gap-3">
          {displayed.map((s) => (
            <li
              key={s.id}
              className="rounded-sm border border-dashed border-[var(--ink-faded)]/50 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-body text-sm text-ink">
                  {countryName(s.countryCode)}
                </span>
                <span className="font-mono-data text-[0.6rem] uppercase tracking-[0.14em] text-[var(--brass)]">
                  Suggested
                </span>
              </div>
              {s.note && (
                <p className="mt-1 font-body text-xs text-ink-faded">
                  {s.note}
                </p>
              )}
              <div className="mt-1 flex items-center justify-between gap-2">
                {s.suggestedBy ? (
                  <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.14em] text-ink-faded">
                    &mdash; {s.suggestedBy}
                  </p>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onPromoteSuggestion(s)}
                  className="font-mono-data text-[0.6rem] uppercase tracking-[0.14em] text-oxblood hover:opacity-70"
                >
                  Promote to entry
                </button>
              </div>
              <InterestToggle suggestion={s} onUpdated={onInterestUpdated} />
            </li>
          ))}
          {suggestions.length === 0 && (
            <li className="font-mono-data text-xs text-ink-faded">
              No suggestions yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
