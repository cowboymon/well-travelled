"use client";

import { PassportStamp } from "@/components/ui/PassportStamp";
import { seededRotation } from "@/lib/palette";
import type { EntryRecord } from "@/lib/types";

/**
 * "Stamp collection" view — every confirmed entry rendered as a passport
 * visa stamp in a loosely scattered grid. Clicking a stamp closes this view
 * and opens the normal `EntryPanel` for that country (same flow as
 * clicking the country on the map).
 */
export function StampCollection({
  entries,
  onClose,
  onSelectCountry,
}: {
  entries: EntryRecord[];
  onClose: () => void;
  onSelectCountry: (countryCode: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-sm border border-brass/40 bg-paper shadow-paper animate-fade-lift">
        <div className="flex shrink-0 items-center justify-between border-b border-brass/40 bg-paper px-6 pb-3 pt-6">
          <div>
            <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.2em] text-ink-faded">
              {entries.length} {entries.length === 1 ? "stamp" : "stamps"}
            </p>
            <h2 className="font-display text-2xl text-ink">Passport stamps</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-data text-lg text-ink-faded hover:text-ink"
          >
            &times;
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-6">
          {entries.length === 0 ? (
            <p className="font-mono-data text-xs text-ink-faded">
              No entries yet — cook a dinner to earn your first stamp.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
              {entries.map((entry) => {
                // Small extra offset (independent of the stamp's own
                // internal rotation) so the grid reads as scattered, not
                // rigid — still fully deterministic per entry.
                const nudge = seededRotation(`${entry.id}-nudge`) / 2;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      onSelectCountry(entry.countryCode);
                      onClose();
                    }}
                    className="flex flex-col items-center justify-self-center transition-transform hover:scale-105"
                    style={{ transform: `translateY(${nudge}px)` }}
                    title={entry.host?.name ?? undefined}
                  >
                    <PassportStamp
                      id={entry.id}
                      countryCode={entry.countryCode}
                      date={entry.date}
                      size={100}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
