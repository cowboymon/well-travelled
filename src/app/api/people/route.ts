import { NextResponse } from "next/server";
import { isSiteUnlocked } from "@/lib/session";
import { listPeople } from "@/lib/data";

export async function GET() {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const rows = await listPeople();
  return NextResponse.json(rows);
}
