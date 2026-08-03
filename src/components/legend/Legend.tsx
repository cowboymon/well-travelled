"use client";

import { Stamp } from "@/components/ui/Stamp";
import { AttendeeLog } from "@/components/legend/AttendeeLog";
import type { HostRecord } from "@/lib/types";

export function Legend({
  hosts,
  visitedCount,
  continentCount,
  attendeeCounts,
  highlightedHostId,
  onHoverHost,
  isAdmin,
  onManageHosts,
  onAddEntry,
  onLogoutAdmin,
  onUnlockAdmin,
}: {
  hosts: HostRecord[];
  visitedCount: number;
  continentCount: number;
  attendeeCounts: Record<string, number>;
  highlightedHostId: string | null;
  onHoverHost: (id: string | null) => void;
  isAdmin: boolean;
  onManageHosts: () => void;
  onAddEntry: () => void;
  onLogoutAdmin: () => void;
  onUnlockAdmin: () => void;
}) {
  return (
    <aside className="flex h-full w-full flex-col gap-5 overflow-y-auto border-l border-brass/30 bg-paper/95 p-6 backdrop-blur-sm">
      <div>
        <p className="font-mono-data text-[11px] uppercase tracking-[0.2em] text-ink-faded">
          Well Travelled
        </p>
        <h1 className="font-display text-2xl text-ink">The Passport</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 border-y border-brass/30 py-4">
        <Stat label="Countries" value={visitedCount} />
        <Stat label="Continents" value={continentCount} />
      </div>

      <div className="flex-1">
        <p className="mb-2 font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded">
          Hosts
        </p>
        <ul className="flex flex-col gap-1">
          {hosts.map((host) => (
            <li
              key={host.id}
              onMouseEnter={() => onHoverHost(host.id)}
              onMouseLeave={() => onHoverHost(null)}
              className={`flex items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-150 ${
                highlightedHostId && highlightedHostId !== host.id
                  ? "opacity-40"
                  : "opacity-100"
              } hover:bg-black/5`}
            >
              <Stamp id={host.id} colour={host.colour} initial={host.initial} size={30} />
              <span className="flex-1 truncate font-body text-sm text-ink">
                {host.name}
              </span>
              <span className="font-mono-data text-xs text-ink-faded">
                {host.entryCount}
              </span>
            </li>
          ))}
          {hosts.length === 0 && (
            <li className="font-mono-data text-xs text-ink-faded">
              No hosts yet.
            </li>
          )}
        </ul>
      </div>

      <AttendeeLog counts={attendeeCounts} />

      <div className="flex flex-col gap-2 border-t border-brass/30 pt-4">
        {isAdmin ? (
          <>
            <button
              onClick={onAddEntry}
              className="rounded-sm bg-oxblood px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90"
            >
              + Add entry
            </button>
            <button
              onClick={onManageHosts}
              className="rounded-sm border border-brass/50 px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:bg-black/5"
            >
              Manage hosts
            </button>
            <button
              onClick={onLogoutAdmin}
              className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
            >
              Exit admin mode
            </button>
          </>
        ) : (
          <button
            onClick={onUnlockAdmin}
            className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
          >
            Admin login
          </button>
        )}
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-3xl text-oxblood">{value}</p>
      <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink-faded">
        {label}
      </p>
    </div>
  );
}
