import { NextResponse } from "next/server";
import { drawMysteryAssignment } from "@/lib/data";
import { isSiteUnlocked } from "@/lib/session";

export async function POST() {
  if (!(await isSiteUnlocked())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 403 });
  }
  const result = await drawMysteryAssignment();
  if (!result) {
    return NextResponse.json(
      { error: "Nothing left to draw — every country is visited or suggested." },
      { status: 409 }
    );
  }
  return NextResponse.json(result);
}
