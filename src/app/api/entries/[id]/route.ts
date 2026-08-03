import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { COUNTRY_BY_ALPHA3 } from "@/lib/countries";

const updateSchema = z.object({
  countryCode: z
    .string()
    .length(3)
    .refine((c) => COUNTRY_BY_ALPHA3.has(c.toUpperCase()), "Unknown country code.")
    .transform((c) => c.toUpperCase())
    .optional(),
  hostId: z.string().uuid().optional(),
  coHostId: z.string().uuid().nullable().optional(),
  date: z.string().min(4).optional(),
  dishes: z.array(z.string().trim().min(1)).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin required." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { photoUrls, ...values } = parsed.data;
  const db = getDb();

  const [entry] = await db
    .update(schema.entries)
    .set(values)
    .where(eq(schema.entries.id, id))
    .returning();

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  if (photoUrls) {
    await db.delete(schema.entryPhotos).where(eq(schema.entryPhotos.entryId, id));
    if (photoUrls.length) {
      await db.insert(schema.entryPhotos).values(
        photoUrls.map((url) => ({ entryId: id, url }))
      );
    }
  }

  return NextResponse.json(entry);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin required." }, { status: 403 });
  }
  const { id } = await params;
  const db = getDb();
  await db.delete(schema.entries).where(eq(schema.entries.id, id));
  return NextResponse.json({ ok: true });
}
