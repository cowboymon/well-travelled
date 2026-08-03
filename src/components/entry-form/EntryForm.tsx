"use client";

import { FormEvent, useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import { HOST_PALETTE } from "@/lib/palette";
import type { EntryRecord, HostRecord } from "@/lib/types";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function EntryForm({
  hosts,
  entry,
  defaultCountryCode,
  onClose,
  onSaved,
  onHostCreated,
}: {
  hosts: HostRecord[];
  entry: EntryRecord | null;
  defaultCountryCode: string | null;
  onClose: () => void;
  onSaved: () => void;
  onHostCreated: () => void;
}) {
  const [countryQuery, setCountryQuery] = useState("");
  const [countryCode, setCountryCode] = useState(
    entry?.countryCode ?? defaultCountryCode ?? ""
  );
  const [hostId, setHostId] = useState(entry?.hostId ?? "");
  const [coHostId, setCoHostId] = useState(entry?.coHostId ?? "");
  const [date, setDate] = useState(entry?.date?.slice(0, 10) ?? todayISO());
  const [dishesText, setDishesText] = useState(entry?.dishes?.join(", ") ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>(
    entry?.photos.map((p) => p.url) ?? []
  );
  const [showNewHost, setShowNewHost] = useState(false);
  const [newHostName, setNewHostName] = useState("");
  const [newHostInitial, setNewHostInitial] = useState("");
  const [newHostColour, setNewHostColour] = useState<string>(HOST_PALETTE[0].hex);
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

  const usedColours = new Set(hosts.map((h) => h.colour));
  const availableColours = HOST_PALETTE.filter(
    (p) => !usedColours.has(p.hex)
  );
  const colourChoices = availableColours.length ? availableColours : HOST_PALETTE;

  async function createHost() {
    if (!newHostName.trim() || !newHostInitial.trim()) return;
    const res = await fetch("/api/hosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newHostName.trim(),
        initial: newHostInitial.trim().toUpperCase(),
        colour: newHostColour,
      }),
    });
    if (res.ok) {
      const host = await res.json();
      setHostId(host.id);
      setShowNewHost(false);
      setNewHostName("");
      setNewHostInitial("");
      onHostCreated();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create host.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!countryCode) {
      setError("Pick a country.");
      return;
    }
    if (!hostId) {
      setError("Pick a host.");
      return;
    }

    setSaving(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/photos", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Photo upload failed.");
        const body = await res.json();
        uploaded.push(body.url);
      }

      const dishes = dishesText
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const payload = {
        countryCode,
        hostId,
        coHostId: coHostId || null,
        date,
        dishes,
        notes: notes.trim() || null,
        photoUrls: [...existingPhotoUrls, ...uploaded],
      };

      const res = await fetch(
        entry ? `/api/entries/${entry.id}` : "/api/entries",
        {
          method: entry ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save entry.");
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
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-sm border border-brass/40 bg-paper p-6 shadow-paper animate-fade-lift"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">
            {entry ? "Edit entry" : "New entry"}
          </h2>
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

        <Field label="Host">
          <select
            value={hostId}
            onChange={(e) => setHostId(e.target.value)}
            className="input"
          >
            <option value="">Select host</option>
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          {!showNewHost ? (
            <button
              type="button"
              onClick={() => setShowNewHost(true)}
              className="mt-1 font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
            >
              + Add new host
            </button>
          ) : (
            <div className="mt-2 flex flex-col gap-2 rounded-sm border border-brass/30 p-3">
              <input
                value={newHostName}
                onChange={(e) => setNewHostName(e.target.value)}
                placeholder="Host name"
                className="input"
              />
              <input
                value={newHostInitial}
                onChange={(e) => setNewHostInitial(e.target.value.slice(0, 3))}
                placeholder="Initial (e.g. M)"
                className="input"
              />
              <div className="flex flex-wrap gap-2">
                {colourChoices.map((c) => (
                  <button
                    type="button"
                    key={c.hex}
                    onClick={() => setNewHostColour(c.hex)}
                    aria-label={c.name}
                    className={`h-7 w-7 rounded-full border-2 ${
                      newHostColour === c.hex
                        ? "border-ink"
                        : "border-transparent"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={createHost}
                className="rounded-sm bg-oxblood px-3 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-paper"
              >
                Save host
              </button>
            </div>
          )}
        </Field>

        <Field label="Co-host (optional)">
          <select
            value={coHostId ?? ""}
            onChange={(e) => setCoHostId(e.target.value)}
            className="input"
          >
            <option value="">None</option>
            {hosts
              .filter((h) => h.id !== hostId)
              .map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Dishes (comma separated)">
          <input
            value={dishesText}
            onChange={(e) => setDishesText(e.target.value)}
            placeholder="e.g. Pho, spring rolls"
            className="input"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input"
          />
        </Field>

        <Field label="Photos">
          {existingPhotoUrls.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {existingPhotoUrls.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-16 w-16 object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setExistingPhotoUrls((prev) =>
                        prev.filter((u) => u !== url)
                      )
                    }
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-oxblood text-xs text-paper"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="font-mono-data text-xs"
          />
        </Field>

        {error && (
          <p className="font-mono-data text-xs text-oxblood">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-sm bg-oxblood px-4 py-3 font-mono-data text-xs uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : entry ? "Save changes" : "Add entry"}
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
