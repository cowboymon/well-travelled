export const HOST_PALETTE = [
  { name: "rust", hex: "#993C1D" },
  { name: "ink blue", hex: "#185FA5" },
  { name: "bottle green", hex: "#0F6E56" },
  { name: "violet", hex: "#534AB7" },
  { name: "plum", hex: "#993556" },
  { name: "ochre", hex: "#854F0B" },
  { name: "olive", hex: "#3B6D11" },
  { name: "stamp red", hex: "#A32D2D" },
] as const;

export type HostColour = (typeof HOST_PALETTE)[number]["hex"];

// Passport-stamp ink palette — deliberately NOT the same list as
// HOST_PALETTE. Curated "classic travel ink" set, desaturated enough to
// still feel like this app rather than a garish sticker sheet. Used
// exclusively by `PassportStamp.tsx`; see design.md's "Passport stamps"
// section for why this component is exempt from the oxblood-only rule.
export const STAMP_INK_PALETTE = [
  { name: "oxblood", hex: "#7A2E2E" },
  { name: "ink", hex: "#1C1E26" },
  { name: "navy", hex: "#2B4C7E" },
  { name: "crimson", hex: "#8C2F2F" },
  { name: "forest", hex: "#2F5C3F" },
  { name: "purple", hex: "#5B3A7A" },
  { name: "teal-ink", hex: "#1F5C5C" },
] as const;

function hashString(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/** Deterministically derives a -8..+8 degree rotation from a string id. */
export function seededRotation(id: string): number {
  const normalized = (Math.abs(hashString(id)) % 1000) / 1000; // 0..1
  return Math.round((normalized * 16 - 8) * 10) / 10; // -8..8, 1 decimal
}

/**
 * Deterministically derives a rotation from a string id within a custom
 * +/- degree range. Used by `PassportStamp` for its wider ±16-18° tilt
 * (haphazard hand-stamped look) without disturbing `seededRotation`'s ±8°
 * contract relied on by `Stamp.tsx` and the collection grid's nudge offset.
 */
export function seededRotationRange(id: string, maxDegrees: number): number {
  const normalized = (Math.abs(hashString(id)) % 1000) / 1000; // 0..1
  return Math.round((normalized * maxDegrees * 2 - maxDegrees) * 10) / 10;
}

/** Deterministically picks one item from `options` based on a hash of `id`. */
export function seededPick<T>(id: string, options: readonly T[]): T {
  const index = Math.abs(hashString(id)) % options.length;
  return options[index];
}

const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O, avoids look-alikes

/**
 * Derives a short, purely decorative alphanumeric "reference code" from an
 * entry id, in the style of the passport-stamp references (e.g. `34BG`,
 * `AM23`) — 2 letters + 2-3 digits. Not a real system identifier.
 */
export function seededStampCode(id: string): string {
  const h = Math.abs(hashString(id));
  const l1 = CODE_LETTERS[h % CODE_LETTERS.length];
  const l2 = CODE_LETTERS[Math.floor(h / CODE_LETTERS.length) % CODE_LETTERS.length];
  const digitCount = 2 + (h % 2); // 2 or 3 digits
  const digits = Math.abs(hashString(`${id}-digits`)) % 10 ** digitCount;
  return `${l1}${l2}${String(digits).padStart(digitCount, "0")}`;
}
