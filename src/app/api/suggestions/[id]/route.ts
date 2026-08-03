import { NextRequest, NextResponse } from "next/server";
import { deleteSuggestion } from "@/lib/data";
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
