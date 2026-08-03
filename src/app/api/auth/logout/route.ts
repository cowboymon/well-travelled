import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SITE_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SITE_COOKIE);
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
