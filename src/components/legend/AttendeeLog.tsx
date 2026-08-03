"use client";

import { useEffect, useState } from "react";
import type { PersonRecord } from "@/lib/types";

export function AttendeeLog({ counts }: { counts: Record<string, number> }) {
  const [people, setPeople] = useState<PersonRecord[]>([]);

  useEffect(() => {
    fetch("/api/people")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPeople)
      .catch(() => {});
  }, []);

  return (
    <div className="border-t border-brass/30 pt-4">
      <p className="mb-2 font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded">
        Attendees
      </p>
      <ul className="flex flex-col gap-1">
        {people.map(({ name }) => (
          <li
            key={name}
            className="flex items-center gap-3 rounded-sm px-2 py-2"
          >
            <span className="flex-1 truncate font-body text-sm text-ink">
              {name}
            </span>
            <span className="font-mono-data text-xs text-ink-faded">
              {counts[name] ?? 0}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
