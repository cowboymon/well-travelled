// Lightweight signed-token helpers built on Web Crypto so they work in both
// the Node runtime (route handlers) and the Edge runtime (middleware).

const encoder = new TextEncoder();

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const buffer = new ArrayBuffer(bin.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set.");
  }
  return secret;
}

/** Creates a signed token of the form `<payload>.<signature>` for a given scope. */
export async function createSessionToken(scope: string): Promise<string> {
  const secret = getSecret();
  const payload = `${scope}:${Date.now()}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return `${toBase64Url(encoder.encode(payload))}.${toBase64Url(sig)}`;
}

/** Verifies a token was signed with SESSION_SECRET and matches the expected scope. */
export async function verifySessionToken(
  token: string | undefined,
  scope: string
): Promise<boolean> {
  if (!token) return false;
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  let payloadBytes: Uint8Array<ArrayBuffer>;
  let sigBytes: Uint8Array<ArrayBuffer>;
  try {
    payloadBytes = fromBase64Url(payloadB64);
    sigBytes = fromBase64Url(sigB64);
  } catch {
    return false;
  }
  const key = await getKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    payloadBytes
  );
  if (!valid) return false;
  const payload = new TextDecoder().decode(payloadBytes);
  const [payloadScope] = payload.split(":");
  return payloadScope === scope;
}

export const SITE_COOKIE = "wt_site";
export const ADMIN_COOKIE = "wt_admin";
