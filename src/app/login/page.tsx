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
      className="w-full max-w-sm rounded-sm border border-[var(--brass)]/40 bg-[var(--paper)] p-8 shadow-sm"
    >
      <p className="mb-1 font-mono-data text-xs uppercase tracking-[0.14em] text-[var(--ink-faded)]">
        Well Travelled
      </p>
      <h1 className="mb-6 font-display text-3xl text-[var(--ink)]">
        Enter password
      </h1>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Site password"
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
