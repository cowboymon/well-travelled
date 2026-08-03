// Fixed set of people who can be logged as attendees on a dinner entry.
// Distinct from "host" (who cooked) — attendees are everyone present.
export const ATTENDEES = ["Jess", "Mon", "Olive", "My Love (Javi)"] as const;

export type Attendee = (typeof ATTENDEES)[number];
