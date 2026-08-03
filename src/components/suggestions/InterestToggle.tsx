"use client";

import { useEffect, useState } from "react";
import type { PersonRecord, SuggestionRecord } from "@/lib/types";

const WHOAMI_KEY = "wt:whoami";

function readCachedWhoAmI(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(WHOAMI_KEY);
  } catch {
    return null;
  }
}

export function InterestToggle({
  suggestion,
  onUpdated,
}: {
  suggestion: SuggestionRecord;
  onUpdated: (suggestion: SuggestionRecord) => void;
}) {
  const [whoAmI, setWhoAmI] = useState<string | null>(readCachedWhoAmI);
  const [showPicker, setShowPicker] = useState(false);
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [useOther, setUseOther] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showPicker || people.length > 0) return;
    fetch("/api/people")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: PersonRecord[]) => setPeople(rows))
      .catch(() => {});
  }, [showPicker, people.length]);

  const isInterested = whoAmI
    ? suggestion.interested.some(
        (n) => n.toLowerCase() === whoAmI.toLowerCase()
      )
    : false;

  async function toggle(name: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const updated: SuggestionRecord = await res.json();
        onUpdated(updated);
        try {
          sessionStorage.setItem(WHOAMI_KEY, name);
        } catch {
          // ignore
        }
        setWhoAmI(name);
        setShowPicker(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function onMainClick() {
    if (whoAmI) {
      toggle(whoAmI);
    } else {
      setShowPicker((prev) => !prev);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        {suggestion.interested.length > 0 && (
          <p className="font-mono-data text-[0.6rem] uppercase tracking-[0.14em] text-ink-faded">
            Interested: {suggestion.interested.join(", ")}
          </p>
        )}
        <button
          type="button"
          onClick={onMainClick}
          disabled={saving}
          className="font-mono-data text-[0.6rem] uppercase tracking-[0.14em] text-[var(--brass)] hover:text-ink disabled:opacity-50"
        >
          {isInterested ? "Not interested anymore" : "I'm interested"}
        </button>
        {whoAmI && (
          <button
            type="button"
            onClick={() => {
              setWhoAmI(null);
              try {
                sessionStorage.removeItem(WHOAMI_KEY);
              } catch {
                // ignore
              }
              setShowPicker(true);
            }}
            className="font-mono-data text-[0.55rem] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
          >
            (as {whoAmI} — not you?)
          </button>
        )}
      </div>

      {showPicker && !whoAmI && (
        <div className="mt-2 rounded-sm border border-dashed border-[var(--ink-faded)]/40 p-2">
          <p className="mb-1.5 font-mono-data text-[0.55rem] uppercase tracking-[0.14em] text-ink-faded">
            Who&apos;s this?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {people.map(({ id, name }) => (
              <button
                type="button"
                key={id}
                onClick={() => toggle(name)}
                disabled={saving}
                className="rounded-sm border border-brass/50 px-2 py-1 font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink hover:bg-black/5 disabled:opacity-50"
              >
                {name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseOther((prev) => !prev)}
              className="rounded-sm border border-brass/50 px-2 py-1 font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink hover:bg-black/5"
            >
              Someone else
            </button>
          </div>
          {useOther && (
            <div className="mt-1.5 flex gap-1.5">
              <input
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="Name"
                className="flex-1 rounded-sm border border-brass/50 bg-white/40 px-2 py-1 font-mono-data text-xs text-ink outline-none focus:border-oxblood"
              />
              <button
                type="button"
                disabled={saving || !otherName.trim()}
                onClick={() => toggle(otherName.trim())}
                className="rounded-sm border border-brass/50 px-2 py-1 font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink hover:bg-black/5 disabled:opacity-50"
              >
                Go
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
