import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { COUNTRY_BY_ALPHA3 } from "@/lib/countries";

const entrySchema = z.object({
  countryCode: z
    .string()
    .length(3)
    .refine((c) => COUNTRY_BY_ALPHA3.has(c.toUpperCase()), "Unknown country code.")
    .transform((c) => c.toUpperCase()),
  hostId: z.string().uuid(),
  coHostId: z.string().uuid().nullable().optional(),
  date: z.string().min(4),
  dishes: z.array(z.string().trim().min(1)).default([]),
  notes: z.string().trim().max(2000).nullable().optional(),
  photoUrls: z.array(z.string().url()).default([]),
});

export async function GET() {
  const db = getDb();
  const entryRows = await db
    .select()
    .from(schema.entries)
    .orderBy(desc(schema.entries.date));
  const hostRows = await db.select().from(schema.hosts);
  const photoRows = await db.select().from(schema.entryPhotos);

  const hostById = new Map(hostRows.map((h) => [h.id, h]));
  const photosByEntry = new Map<string, { id: string; url: string }[]>();
  for (const p of photoRows) {
    const list = photosByEntry.get(p.entryId) ?? [];
    list.push({ id: p.id, url: p.url });
    photosByEntry.set(p.entryId, list);
  }

  const result = entryRows.map((e) => ({
    ...e,
    host: hostById.get(e.hostId) ?? null,
    coHost: e.coHostId ? hostById.get(e.coHostId) ?? null : null,
    photos: photosByEntry.get(e.id) ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin required." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { photoUrls, ...values } = parsed.data;
  const db = getDb();

  const [entry] = await db.insert(schema.entries).values(values).returning();

  if (photoUrls.length) {
    await db.insert(schema.entryPhotos).values(
      photoUrls.map((url) => ({ entryId: entry.id, url }))
    );
  }

  return NextResponse.json(entry, { status: 201 });
}
