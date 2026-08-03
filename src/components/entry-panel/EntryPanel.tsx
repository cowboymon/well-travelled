"use client";

import { useState } from "react";
import { Stamp } from "@/components/ui/Stamp";
import { countryName, COUNTRY_BY_ALPHA3 } from "@/lib/countries";
import { seededRotation } from "@/lib/palette";
import type { EntryRecord } from "@/lib/types";

export function EntryPanel({
  countryCode,
  entries,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onAddForCountry,
}: {
  countryCode: string;
  entries: EntryRecord[];
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (entry: EntryRecord) => void;
  onDelete: (entry: EntryRecord) => void;
  onAddForCountry: (countryCode: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ref = COUNTRY_BY_ALPHA3.get(countryCode);
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  async function confirmDelete(entry: EntryRecord) {
    if (!confirm(`Delete this entry for ${countryName(countryCode)}?`)) return;
    setDeletingId(entry.id);
    try {
      await onDelete(entry);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20 animate-fade-lift md:bg-transparent">
      <div className="h-full w-full overflow-y-auto border-l border-brass/30 bg-paper p-6 shadow-paper md:w-[420px] md:p-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded">
              {ref?.continent ?? "Unknown region"} &middot; {countryCode}
            </p>
            <h2 className="font-display text-4xl leading-tight text-ink">
              {countryName(countryCode)}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 font-mono-data text-lg text-ink-faded hover:text-ink"
          >
            &times;
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={() => onAddForCountry(countryCode)}
            className="mb-6 w-full rounded-sm border border-brass/50 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink hover:bg-black/5"
          >
            + Add another entry for this country
          </button>
        )}

        <div className="flex flex-col gap-8">
          {sorted.map((entry, idx) => (
            <article
              key={entry.id}
              className="border-t border-brass/30 pt-6 first:border-t-0 first:pt-0"
            >
              <div className="mb-3 flex items-start justify-between">
                <p className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded">
                  Entry no. {sorted.length - idx}
                </p>
                {entry.host && (
                  <div
                    style={{
                      transform: `rotate(${seededRotation(entry.id)}deg)`,
                    }}
                  >
                    <Stamp
                      id={entry.id}
                      colour={entry.host.colour}
                      initial={entry.host.initial}
                      size={40}
                    />
                  </div>
                )}
              </div>

              <table className="w-full border-collapse font-mono-data text-xs">
                <tbody>
                  <Row label="Host" value={entry.host?.name ?? "Unknown"} />
                  {entry.coHost && (
                    <Row label="Co-host" value={entry.coHost.name} />
                  )}
                  <Row
                    label="Date"
                    value={new Date(entry.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  />
                  <Row label="Dishes" value={entry.dishes.join(", ") || "—"} />
                </tbody>
              </table>

              {entry.photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {entry.photos.map((photo, pIdx) => (
                    <div
                      key={photo.id}
                      className="border-4 border-white bg-white shadow-sm"
                      style={{
                        transform: `rotate(${
                          (seededRotation(photo.id + pIdx) / 8) * 2
                        }deg)`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt=""
                        className="h-28 w-28 object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {entry.notes && (
                <p className="mt-4 font-body text-sm italic text-ink-faded">
                  {entry.notes}
                </p>
              )}

              {isAdmin && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => onEdit(entry)}
                    className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(entry)}
                    disabled={deletingId === entry.id}
                    className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-oxblood hover:opacity-70 disabled:opacity-40"
                  >
                    {deletingId === entry.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-brass/20">
      <td className="w-24 py-2 uppercase tracking-[0.1em] text-ink-faded">
        {label}
      </td>
      <td className="py-2 text-right text-ink">{value}</td>
    </tr>
  );
}
