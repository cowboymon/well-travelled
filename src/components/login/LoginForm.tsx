"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stamp } from "@/components/ui/Stamp";
import { PassportStamp } from "@/components/ui/PassportStamp";
import { seededRotation } from "@/lib/palette";

interface BackgroundStamp {
  id: string;
  countryCode: string;
  date: string;
}

// Fixed, sparse layout positions (percent of viewport) — a handful of
// stamps scattered at varied position/size, not a dense wallpaper.
const LAYOUT = [
  { top: "10%", left: "8%", size: 120 },
  { top: "72%", left: "14%", size: 90 },
  { top: "18%", left: "84%", size: 100 },
  { top: "62%", left: "88%", size: 130 },
  { top: "88%", left: "48%", size: 80 },
  { top: "6%", left: "46%", size: 70 },
];

export function LoginForm({ stamps }: { stamps: BackgroundStamp[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Incorrect password.");
        return;
      }
      const from = params.get("from") || "/";
      router.replace(from);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const scattered = LAYOUT.map((pos, i) => {
    const stamp = stamps[i % stamps.length];
    return { ...pos, stamp };
  });

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden animate-fade-lift motion-reduce:animate-none"
        aria-hidden
      >
        {scattered.map(({ top, left, size, stamp }, i) => (
          <div
            key={`${stamp.id}-${i}`}
            className="absolute"
            style={{
              top,
              left,
              opacity: 0.1 + (Math.abs(seededRotation(stamp.id)) % 3) / 30,
            }}
          >
            <PassportStamp id={stamp.id} countryCode={stamp.countryCode} date={stamp.date} size={size} />
          </div>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="corner-ticks relative w-full max-w-sm rounded-sm border border-[var(--brass)]/40 bg-[var(--paper)] p-8 shadow-paper"
      >
        <div className="mb-8 flex items-start justify-between border-b border-[var(--brass)]/40 pb-4">
          <div>
            <p className="font-mono-data text-[0.65rem] uppercase tracking-[0.2em] text-[var(--ink-faded)]">
              Entry Required
            </p>
            <h1 className="mt-1 font-display text-2xl uppercase tracking-[0.2em] text-[var(--ink)]">
              Well Travelled
            </h1>
          </div>
          <div className="shrink-0" aria-hidden>
            <Stamp id="well-travelled-wordmark" colour="#7A2E2E" initial="WT" size={44} />
          </div>
        </div>

        <label
          htmlFor="site-password"
          className="mb-2 block font-mono-data text-xs uppercase tracking-[0.14em] text-[var(--ink-faded)]"
        >
          Password
        </label>
        <input
          id="site-password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mb-4 w-full rounded-sm border border-[var(--brass)]/50 bg-white/40 px-4 py-3 font-mono-data text-sm tracking-wide text-[var(--ink)] outline-none focus:border-[var(--oxblood)]"
        />
        {error && (
          <p className="mb-4 font-mono-data text-xs text-[var(--oxblood)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-[var(--oxblood)] px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-[var(--paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Unlock"}
        </button>

        <p className="mt-6 border-t border-[var(--brass)]/30 pt-4 text-center font-mono-data text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ink-faded)]">
          A record of experiences at On Margaret Street
        </p>
      </form>
    </>
  );
}
