"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
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

  return (
    <form
      onSubmit={onSubmit}
      className="corner-ticks w-full max-w-sm rounded-sm border border-[var(--brass)]/40 bg-[var(--paper)] p-8 shadow-paper"
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
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--oxblood)]/70 font-mono-data text-[0.6rem] uppercase tracking-[0.1em] text-[var(--oxblood)]/80"
          style={{ transform: "rotate(-6deg)" }}
        >
          WT
        </span>
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
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--paper)] px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
