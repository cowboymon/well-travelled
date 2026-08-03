import { cookies } from "next/headers";
import { ADMIN_COOKIE, SITE_COOKIE, verifySessionToken } from "@/lib/auth";

export async function isSiteUnlocked(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SITE_COOKIE)?.value, "site");
}

export async function isAdminUnlocked(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value, "admin");
}

/** Throws-free guard for API routes: returns true only when the admin cookie is valid. */
export async function requireAdmin(req: Request): Promise<boolean> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`));
  const token = match?.slice(ADMIN_COOKIE.length + 1);
  return verifySessionToken(token, "admin");
}
