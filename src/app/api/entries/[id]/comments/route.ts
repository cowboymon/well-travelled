import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSiteUnlocked } from "@/lib/session";
import { createComment, listCommentsForEntry } from "@/lib/data";

const commentSchema = z.object({
  authorName: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(1000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const { id } = await params;
  const rows = await listCommentsForEntry(id);
  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const row = await createComment({
    entryId: id,
    authorName: parsed.data.authorName,
    body: parsed.data.body,
  });
  return NextResponse.json(row, { status: 201 });
}
