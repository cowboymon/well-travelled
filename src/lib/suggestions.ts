import type { SuggestionRecord } from "@/lib/types";

// Client-safe (no db imports) so both server code (src/lib/data.ts) and
// client components (e.g. the map) can detect mystery-drawn suggestions
// without pulling the Neon client into the browser bundle.
export const MYSTERY_NOTE_PREFIX = "Mystery assignment —";

export function isMysterySuggestion(
  suggestion: Pick<SuggestionRecord, "note">
): boolean {
  return Boolean(suggestion.note?.startsWith(MYSTERY_NOTE_PREFIX));
}
