"use client";

import { FormEvent, useEffect, useState } from "react";
import { Stamp } from "@/components/ui/Stamp";
import { countryName, COUNTRY_BY_ALPHA3 } from "@/lib/countries";
import { seededRotation } from "@/lib/palette";
import type { CommentRecord, EntryRecord, PersonRecord } from "@/lib/types";

export function EntryPanel({
  countryCode,
  entries,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onAddForCountry,
  onSuggestForCountry,
}: {
  countryCode: string;
  entries: EntryRecord[];
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (entry: EntryRecord) => void;
  onDelete: (entry: EntryRecord) => void;
  onAddForCountry: (countryCode: string) => void;
  onSuggestForCountry: (countryCode: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(
    null
  );
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
    <div className="pointer-events-none fixed inset-0 z-40 flex justify-end bg-black/20 animate-fade-lift md:bg-transparent">
      <div className="pointer-events-auto h-full w-full overflow-y-auto border-l border-brass/30 bg-paper p-6 shadow-paper md:w-[420px] md:p-8">
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

        {sorted.length === 0 && (
          <div className="mb-6 rounded-sm border border-dashed border-brass/50 p-4">
            <p className="mb-3 font-mono-data text-xs text-ink-faded">
              No entries here yet.
            </p>
            <button
              onClick={() => onSuggestForCountry(countryCode)}
              className="w-full rounded-sm border border-brass/60 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:bg-black/5"
            >
              Suggest this country
            </button>
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => onAddForCountry(countryCode)}
            className="mb-6 w-full rounded-sm border border-brass/50 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink hover:bg-black/5"
          >
            {sorted.length === 0
              ? "+ Add an entry for this country"
              : "+ Add another entry for this country"}
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
                  <Row
                    label="Attendees"
                    value={entry.attendees.join(", ") || "—"}
                  />
                </tbody>
              </table>

              {entry.photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {entry.photos.map((photo, pIdx) => (
                    <button
                      type="button"
                      key={photo.id}
                      onClick={() =>
                        setLightbox({
                          urls: entry.photos.map((p) => p.url),
                          index: pIdx,
                        })
                      }
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
                    </button>
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

              <CommentsSection entryId={entry.id} />
            </article>
          ))}
        </div>
      </div>

      {lightbox && (
        <Lightbox
          urls={lightbox.urls}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) =>
            setLightbox((prev) => (prev ? { ...prev, index } : prev))
          }
        />
      )}
    </div>
  );
}

function Lightbox({
  urls,
  index,
  onClose,
  onIndexChange,
}: {
  urls: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && urls.length > 1) {
        onIndexChange((index + 1) % urls.length);
      }
      if (e.key === "ArrowLeft" && urls.length > 1) {
        onIndexChange((index - 1 + urls.length) % urls.length);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, urls.length, onClose, onIndexChange]);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 animate-fade-lift"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full p-2 font-mono-data text-2xl text-paper hover:opacity-70"
      >
        &times;
      </button>

      {urls.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index - 1 + urls.length) % urls.length);
          }}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-sm border border-paper/40 px-3 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-paper hover:bg-white/10"
        >
          &larr;
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] object-contain shadow-paper"
      />

      {urls.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index + 1) % urls.length);
          }}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-sm border border-paper/40 px-3 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-paper hover:bg-white/10"
        >
          &rarr;
        </button>
      )}
    </div>
  );
}

function CommentsSection({ entryId }: { entryId: string }) {
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [attendee, setAttendee] = useState<string>("");
  const [useOther, setUseOther] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  useEffect(() => {
    if (!showForm || people.length > 0) return;
    fetch("/api/people")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: PersonRecord[]) => {
        setPeople(rows);
        if (rows.length > 0) setAttendee((prev) => prev || rows[0].name);
      })
      .catch(() => {});
  }, [showForm, people.length]);

  async function loadComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries/${entryId}/comments`);
      if (res.ok) setComments(await res.json());
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next && !loaded) loadComments();
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const authorName = (useOther ? otherName : attendee).trim();
    if (!authorName) {
      setError("Who's leaving this comment?");
      return;
    }
    if (!body.trim()) {
      setError("Say something first.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${entryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, body: body.trim() }),
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        throw new Error(resBody.error ?? "Could not post comment.");
      }
      const comment: CommentRecord = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 border-t border-brass/30 pt-4">
      <button
        type="button"
        onClick={toggleOpen}
        className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink-faded hover:text-ink"
      >
        Remarks {loaded && comments.length > 0 ? `(${comments.length})` : ""}{" "}
        {open ? "−" : "+"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {loading && (
            <p className="font-mono-data text-xs text-ink-faded">Loading...</p>
          )}

          {!loading && loaded && comments.length === 0 && !showForm && (
            <p className="font-mono-data text-xs text-ink-faded">
              No remarks yet.
            </p>
          )}

          {comments.map((c, idx) => (
            <div
              key={c.id}
              className={`pt-3 ${idx > 0 ? "border-t border-brass/20" : ""}`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink-faded">
                  {c.authorName}
                </span>
                <span className="font-mono-data text-[10px] text-ink-faded">
                  {new Date(c.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="font-body text-sm text-ink">{c.body}</p>
            </div>
          ))}

          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="self-start rounded-sm border border-brass/50 px-3 py-1.5 font-mono-data text-[11px] uppercase tracking-[0.14em] text-ink hover:bg-black/5"
            >
              Leave a comment
            </button>
          )}

          {showForm && (
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-3 rounded-sm border border-brass/30 p-3"
            >
              <div>
                <p className="mb-1.5 font-mono-data text-[10px] uppercase tracking-[0.14em] text-ink-faded">
                  Who&apos;s this?
                </p>
                <div className="flex flex-wrap gap-2">
                  {people.map(({ id, name }) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => {
                        setAttendee(name);
                        setUseOther(false);
                      }}
                      className={`rounded-sm border px-3 py-1.5 font-mono-data text-[11px] uppercase tracking-[0.14em] transition-colors ${
                        !useOther && attendee === name
                          ? "border-oxblood bg-oxblood text-paper"
                          : "border-brass/50 text-ink hover:bg-black/5"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseOther(true)}
                    className={`rounded-sm border px-3 py-1.5 font-mono-data text-[11px] uppercase tracking-[0.14em] transition-colors ${
                      useOther
                        ? "border-oxblood bg-oxblood text-paper"
                        : "border-brass/50 text-ink hover:bg-black/5"
                    }`}
                  >
                    Someone else
                  </button>
                </div>
                {useOther && (
                  <input
                    value={otherName}
                    onChange={(e) => setOtherName(e.target.value)}
                    placeholder="Name"
                    className="comment-input mt-2"
                  />
                )}
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Leave a remark on this entry..."
                className="comment-input"
              />

              {error && (
                <p className="font-mono-data text-xs text-oxblood">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-sm bg-oxblood px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Posting..." : "Post"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-sm border border-brass/50 px-4 py-2 font-mono-data text-xs uppercase tracking-[0.14em] text-ink hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <style jsx global>{`
        .comment-input {
          width: 100%;
          border: 1px solid rgba(176, 141, 87, 0.5);
          background: rgba(255, 255, 255, 0.4);
          border-radius: 2px;
          padding: 0.6rem 0.8rem;
          font-size: 0.9rem;
          color: var(--ink);
          outline: none;
        }
        .comment-input:focus {
          border-color: var(--oxblood);
        }
      `}</style>
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
