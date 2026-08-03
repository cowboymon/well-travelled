import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteSuggestion, updateSuggestionSuggestedBy } from "@/lib/data";
import { isSiteUnlocked } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const { id } = await params;
  await deleteSuggestion(id);
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  suggestedBy: z.string().trim().min(1).max(80),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const row = await updateSuggestionSuggestedBy(id, parsed.data.suggestedBy);
  return NextResponse.json(row);
}
