"use client";

import { FormEvent, useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

export function SuggestionForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [countryQuery, setCountryQuery] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [suggestedBy, setSuggestedBy] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 8);
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)).slice(
      0,
      8
    );
  }, [countryQuery]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!countryCode) {
      setError("Pick a country.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          suggestedBy: suggestedBy.trim() || null,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save suggestion.");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-sm border border-brass/40 bg-paper p-6 shadow-paper animate-fade-lift"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.2em] text-ink-faded">
              Pencilled note, not a stamp
            </p>
            <h2 className="font-display text-2xl text-ink">Suggest a country</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-data text-lg text-ink-faded hover:text-ink"
          >
            &times;
          </button>
        </div>

        <Field label="Country">
          <input
            value={
              countryCode
                ? COUNTRIES.find((c) => c.alpha3 === countryCode)?.name ??
                  countryQuery
                : countryQuery
            }
            onChange={(e) => {
              setCountryQuery(e.target.value);
              setCountryCode("");
            }}
            placeholder="Search countries..."
            className="input"
          />
          {!countryCode && countryQuery && (
            <ul className="mt-1 max-h-40 overflow-y-auto rounded-sm border border-brass/30 bg-white/60">
              {filteredCountries.map((c) => (
                <li key={c.alpha3}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountryCode(c.alpha3);
                      setCountryQuery("");
                    }}
                    className="w-full px-3 py-2 text-left font-body text-sm hover:bg-black/5"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <Field label="Your name (optional)">
          <input
            value={suggestedBy}
            onChange={(e) => setSuggestedBy(e.target.value)}
            placeholder="e.g. Jamie"
            className="input"
          />
        </Field>

        <Field label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. someone's aunt makes an amazing tagine"
            className="input"
          />
        </Field>

        {error && (
          <p className="font-mono-data text-xs text-oxblood">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-sm border border-brass/60 bg-transparent px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:bg-black/5 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Suggest it"}
        </button>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgba(176, 141, 87, 0.5);
          background: rgba(255, 255, 255, 0.4);
          border-radius: 2px;
          padding: 0.6rem 0.8rem;
          font-size: 0.9rem;
          color: var(--ink);
          outline: none;
        }
        .input:focus {
          border-color: var(--oxblood);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink-faded">
        {label}
      </span>
      {children}
    </label>
  );
}
