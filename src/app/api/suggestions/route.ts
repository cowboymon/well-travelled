import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { isSiteUnlocked } from "@/lib/session";
import { COUNTRY_BY_ALPHA3 } from "@/lib/countries";
import { desc } from "drizzle-orm";

const suggestionSchema = z.object({
  countryCode: z
    .string()
    .length(3)
    .refine((c) => COUNTRY_BY_ALPHA3.has(c.toUpperCase()), "Unknown country code.")
    .transform((c) => c.toUpperCase()),
  suggestedBy: z.string().trim().max(80).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export async function GET() {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.suggestions)
    .orderBy(desc(schema.suggestions.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = suggestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const db = getDb();
  const [row] = await db
    .insert(schema.suggestions)
    .values({
      countryCode: parsed.data.countryCode,
      suggestedBy: parsed.data.suggestedBy || null,
      note: parsed.data.note || null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
