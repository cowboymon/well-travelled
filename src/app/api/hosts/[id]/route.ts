import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { HOST_PALETTE } from "@/lib/palette";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  colour: z.enum(HOST_PALETTE.map((p) => p.hex) as [string, ...string[]]).optional(),
  initial: z.string().trim().min(1).max(3).optional(),
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
  const db = getDb();
  const [host] = await db
    .update(schema.hosts)
    .set(parsed.data)
    .where(eq(schema.hosts.id, id))
    .returning();
  if (!host) {
    return NextResponse.json({ error: "Host not found." }, { status: 404 });
  }
  return NextResponse.json(host);
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
  await db.delete(schema.hosts).where(eq(schema.hosts.id, id));
  return NextResponse.json({ ok: true });
}
