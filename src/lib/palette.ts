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

/** Deterministically derives a -8..+8 degree rotation from a string id. */
export function seededRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0..1
  return Math.round((normalized * 16 - 8) * 10) / 10; // -8..8, 1 decimal
}
