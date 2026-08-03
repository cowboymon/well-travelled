"use client";

import { useState } from "react";
import { Stamp } from "@/components/ui/Stamp";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HOST_PALETTE } from "@/lib/palette";
import type { HostRecord } from "@/lib/types";

export function HostManager({
  hosts,
  onClose,
  onChanged,
}: {
  hosts: HostRecord[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [initial, setInitial] = useState("");
  const [colour, setColour] = useState<string>(HOST_PALETTE[0].hex);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HostRecord | null>(null);

  function startEdit(host: HostRecord) {
    setEditingId(host.id);
    setName(host.name);
    setInitial(host.initial);
    setColour(host.colour);
  }

  function startCreate() {
    setEditingId("new");
    setName("");
    setInitial("");
    setColour(HOST_PALETTE[0].hex);
  }

  async function save() {
    if (!name.trim() || !initial.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/hosts" : `/api/hosts/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            initial: initial.trim().toUpperCase(),
            colour,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save host.");
      }
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  async function performRemove(host: HostRecord) {
    setPendingDelete(null);
    const res = await fetch(`/api/hosts/${host.id}`, { method: "DELETE" });
    if (res.ok) onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-sm border border-brass/40 bg-paper p-6 shadow-paper animate-fade-lift">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Hosts</h2>
          <button
            onClick={onClose}
            className="font-mono-data text-lg text-ink-faded hover:text-ink"
          >
            &times;
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {hosts.map((host) => (
            <li
              key={host.id}
              className="flex items-center gap-3 rounded-sm border border-brass/20 p-2"
            >
              <Stamp id={host.id} colour={host.colour} initial={host.initial} size={30} />
              <span className="flex-1 font-body text-sm text-ink">
                {host.name}
              </span>
              <span className="font-mono-data text-xs text-ink-faded">
                {host.entryCount}
              </span>
              <button
                onClick={() => startEdit(host)}
                className="font-mono-data text-[11px] uppercase tracking-[0.1em] text-ink-faded hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => setPendingDelete(host)}
                className="font-mono-data text-[11px] uppercase tracking-[0.1em] text-oxblood hover:opacity-70"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        {editingId ? (
          <div className="flex flex-col gap-2 rounded-sm border border-brass/30 p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Host name"
              className="input"
            />
            <input
              value={initial}
              onChange={(e) => setInitial(e.target.value.slice(0, 3))}
              placeholder="Initial"
              className="input"
            />
            <div className="flex flex-wrap gap-2">
              {HOST_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setColour(c.hex)}
                  aria-label={c.name}
                  className={`h-7 w-7 rounded-full border-2 ${
                    colour === c.hex ? "border-ink" : "border-transparent"
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
            {error && (
              <p className="font-mono-data text-xs text-oxblood">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={creating}
                className="flex-1 rounded-sm bg-oxblood px-3 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-paper disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 rounded-sm border border-brass/50 px-3 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={startCreate}
            className="rounded-sm border border-brass/50 px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-ink hover:bg-black/5"
          >
            + Add host
          </button>
        )}
      </div>

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
      `}</style>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete host"
        message={
          pendingDelete && pendingDelete.entryCount > 0
            ? `${pendingDelete.name} has ${pendingDelete.entryCount} entr${
                pendingDelete.entryCount === 1 ? "y" : "ies"
              }. Deleting them will remove those entries too. Continue?`
            : `Delete ${pendingDelete?.name ?? "this host"}?`
        }
        confirmLabel="Delete"
        onConfirm={() => pendingDelete && performRemove(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
