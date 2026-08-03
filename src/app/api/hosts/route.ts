import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { HOST_PALETTE } from "@/lib/palette";
import { findOrCreatePerson } from "@/lib/data";

const hostSchema = z.object({
  name: z.string().trim().min(1).max(80),
  colour: z.enum(HOST_PALETTE.map((p) => p.hex) as [string, ...string[]]),
  initial: z.string().trim().min(1).max(3),
});

export async function GET() {
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
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin required." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = hostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const person = await findOrCreatePerson(parsed.data.name);
  const db = getDb();
  const [host] = await db
    .insert(schema.hosts)
    .values({ ...parsed.data, personId: person.id })
    .returning();
  return NextResponse.json(host, { status: 201 });
}
