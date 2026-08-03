import { desc, eq, sql } from "drizzle-orm";
import type { NewSuggestion, NewComment } from "@/db/schema";
import { getDb, schema } from "@/db";
import { COUNTRIES } from "@/lib/countries";
import { MYSTERY_NOTE_PREFIX } from "@/lib/suggestions";

export interface PersonRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface HostWithCount {
  id: string;
  name: string;
  colour: string;
  initial: string;
  createdAt: string;
  entryCount: number;
}

export async function listHostsWithCounts(): Promise<HostWithCount[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.hosts.id,
      name: schema.hosts.name,
      colour: schema.hosts.colour,
      initial: schema.hosts.initial,
      createdAt: schema.hosts.createdAt,
      entryCount: sql<number>`count(${schema.entries.id})::int`,
    })
    .from(schema.hosts)
    .leftJoin(schema.entries, eq(schema.entries.hostId, schema.hosts.id))
    .groupBy(schema.hosts.id)
    .orderBy(schema.hosts.name);

  return rows.map((r) => ({ ...r, createdAt: r.createdAt as unknown as string }));
}

export interface EntryWithRelations {
  id: string;
  countryCode: string;
  hostId: string;
  coHostId: string | null;
  date: string;
  dishes: string[];
  attendees: string[];
  notes: string | null;
  createdAt: string;
  host: { id: string; name: string; colour: string; initial: string } | null;
  coHost: { id: string; name: string; colour: string; initial: string } | null;
  photos: { id: string; url: string }[];
}

export async function listEntries(): Promise<EntryWithRelations[]> {
  const db = getDb();

  const entryRows = await db
    .select()
    .from(schema.entries)
    .orderBy(desc(schema.entries.date));

  const hostRows = await db.select().from(schema.hosts);
  const hostById = new Map(hostRows.map((h) => [h.id, h]));

  const photoRows = await db.select().from(schema.entryPhotos);
  const photosByEntry = new Map<string, { id: string; url: string }[]>();
  for (const p of photoRows) {
    const list = photosByEntry.get(p.entryId) ?? [];
    list.push({ id: p.id, url: p.url });
    photosByEntry.set(p.entryId, list);
  }

  return entryRows.map((e) => {
    const host = hostById.get(e.hostId) ?? null;
    const coHost = e.coHostId ? hostById.get(e.coHostId) ?? null : null;
    return {
      ...e,
      date: e.date as unknown as string,
      createdAt: e.createdAt as unknown as string,
      host: host
        ? { id: host.id, name: host.name, colour: host.colour, initial: host.initial }
        : null,
      coHost: coHost
        ? { id: coHost.id, name: coHost.name, colour: coHost.colour, initial: coHost.initial }
        : null,
      photos: photosByEntry.get(e.id) ?? [],
    };
  });
}

export interface SuggestionWithMeta {
  id: string;
  countryCode: string;
  suggestedBy: string | null;
  note: string | null;
  interested: string[];
  createdAt: string;
}

export async function listSuggestions(): Promise<SuggestionWithMeta[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.suggestions)
    .orderBy(desc(schema.suggestions.createdAt));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt as unknown as string }));
}

export async function createSuggestion(
  values: NewSuggestion
): Promise<SuggestionWithMeta> {
  const db = getDb();
  const [row] = await db.insert(schema.suggestions).values(values).returning();
  return { ...row, createdAt: row.createdAt as unknown as string };
}

export async function deleteSuggestion(id: string): Promise<void> {
  const db = getDb();
  await db.delete(schema.suggestions).where(eq(schema.suggestions.id, id));
}

export async function updateSuggestionSuggestedBy(
  id: string,
  suggestedBy: string
): Promise<SuggestionWithMeta> {
  const db = getDb();
  const [row] = await db
    .update(schema.suggestions)
    .set({ suggestedBy })
    .where(eq(schema.suggestions.id, id))
    .returning();
  return { ...row, createdAt: row.createdAt as unknown as string };
}

/**
 * Idempotent toggle of a person's name in a suggestion's `interested`
 * array. Adding grows the shared roster (mirrors how comments do it);
 * removing does not, since removal isn't "proposing" anything new.
 */
export async function toggleSuggestionInterest(
  suggestionId: string,
  name: string
): Promise<SuggestionWithMeta> {
  const db = getDb();
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(schema.suggestions)
    .where(eq(schema.suggestions.id, suggestionId))
    .limit(1);
  if (!existing) {
    throw new Error("Suggestion not found.");
  }
  const current = existing.interested ?? [];
  const alreadyIn = current.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase()
  );
  let next: string[];
  if (alreadyIn) {
    next = current.filter((n) => n.toLowerCase() !== trimmed.toLowerCase());
  } else {
    await findOrCreatePerson(trimmed);
    next = [...current, trimmed];
  }
  const [row] = await db
    .update(schema.suggestions)
    .set({ interested: next })
    .where(eq(schema.suggestions.id, suggestionId))
    .returning();
  return { ...row, createdAt: row.createdAt as unknown as string };
}

export interface MysteryDrawResult {
  suggestion: SuggestionWithMeta;
  person: string;
  countryCode: string;
  createdNew: boolean;
}

/**
 * Performs one random assignment:
 *  1. If there's an unclaimed suggestion (suggestedBy IS NULL), claim a
 *     random one for a random person.
 *  2. Otherwise, pick a random not-yet-suggested, not-yet-visited country
 *     and create a brand new suggestion for a random person, tagged with
 *     a distinctly-worded note so it reads as a random draw, not a real
 *     human suggestion.
 */
export async function drawMysteryAssignment(): Promise<MysteryDrawResult | null> {
  const db = getDb();
  const people = await listPeople();
  if (people.length === 0) return null;

  const unclaimed = await db
    .select()
    .from(schema.suggestions)
    .where(sql`${schema.suggestions.suggestedBy} is null`);

  if (unclaimed.length > 0) {
    const pick = unclaimed[Math.floor(Math.random() * unclaimed.length)];
    const person = people[Math.floor(Math.random() * people.length)];
    const [row] = await db
      .update(schema.suggestions)
      .set({ suggestedBy: person.name })
      .where(eq(schema.suggestions.id, pick.id))
      .returning();
    return {
      suggestion: { ...row, createdAt: row.createdAt as unknown as string },
      person: person.name,
      countryCode: row.countryCode,
      createdNew: false,
    };
  }

  const existingSuggestions = await db.select().from(schema.suggestions);
  const suggestedCodes = new Set(existingSuggestions.map((s) => s.countryCode));
  const entryRows = await db.select().from(schema.entries);
  const visitedCodes = new Set(entryRows.map((e) => e.countryCode));

  const available = COUNTRIES.filter(
    (c) => !suggestedCodes.has(c.alpha3) && !visitedCodes.has(c.alpha3)
  );
  if (available.length === 0) return null;

  const country = available[Math.floor(Math.random() * available.length)];
  const person = people[Math.floor(Math.random() * people.length)];
  const [row] = await db
    .insert(schema.suggestions)
    .values({
      countryCode: country.alpha3,
      suggestedBy: person.name,
      note: `${MYSTERY_NOTE_PREFIX} drawn at random.`,
    })
    .returning();
  return {
    suggestion: { ...row, createdAt: row.createdAt as unknown as string },
    person: person.name,
    countryCode: row.countryCode,
    createdNew: true,
  };
}

export async function listPeople(): Promise<PersonRecord[]> {
  const db = getDb();
  const rows = await db.select().from(schema.people).orderBy(schema.people.name);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt as unknown as string }));
}

/**
 * Case-insensitive, trimmed lookup-or-create by name. Safe to call
 * repeatedly with the same name — the unique constraint plus lookup-first
 * logic makes it a no-op for existing people.
 */
export async function findOrCreatePerson(name: string): Promise<PersonRecord> {
  const db = getDb();
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(schema.people)
    .where(sql`lower(${schema.people.name}) = lower(${trimmed})`)
    .limit(1);
  if (existing) {
    return { ...existing, createdAt: existing.createdAt as unknown as string };
  }
  const [created] = await db
    .insert(schema.people)
    .values({ name: trimmed })
    .onConflictDoNothing({ target: schema.people.name })
    .returning();
  if (created) {
    return { ...created, createdAt: created.createdAt as unknown as string };
  }
  // Race: another request inserted the same name between our lookup and
  // insert. Re-fetch to return the winning row.
  const [row] = await db
    .select()
    .from(schema.people)
    .where(sql`lower(${schema.people.name}) = lower(${trimmed})`)
    .limit(1);
  return { ...row, createdAt: row.createdAt as unknown as string };
}

export interface CommentRecord {
  id: string;
  entryId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export async function listCommentsForEntry(
  entryId: string
): Promise<CommentRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.entryId, entryId))
    .orderBy(schema.comments.createdAt);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt as unknown as string }));
}

export async function createComment(
  values: NewComment
): Promise<CommentRecord> {
  const db = getDb();
  const [row] = await db.insert(schema.comments).values(values).returning();
  return { ...row, createdAt: row.createdAt as unknown as string };
}
