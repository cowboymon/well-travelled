import { desc, eq, sql } from "drizzle-orm";
import type { NewSuggestion } from "@/db/schema";
import { getDb, schema } from "@/db";

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
  dish: string;
  suggestedBy: string | null;
  note: string | null;
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
