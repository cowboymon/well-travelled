import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toggleSuggestionInterest } from "@/lib/data";
import { isSiteUnlocked } from "@/lib/session";

const interestSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = interestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  try {
    const row = await toggleSuggestionInterest(id, parsed.data.name);
    return NextResponse.json(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update.";
    const status = message.includes("not found") ? 404 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
