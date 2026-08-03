import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
} from "drizzle-orm/pg-core";

export const hosts = pgTable("hosts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  colour: text("colour").notNull(),
  initial: text("initial").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const entries = pgTable("entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  countryCode: text("country_code").notNull(),
  hostId: uuid("host_id")
    .notNull()
    .references(() => hosts.id, { onDelete: "cascade" }),
  coHostId: uuid("co_host_id").references(() => hosts.id, {
    onDelete: "set null",
  }),
  date: date("date").notNull(),
  dishes: text("dishes").array().notNull().default([]),
  attendees: text("attendees").array().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const entryPhotos = pgTable("entry_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const suggestions = pgTable("suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  countryCode: text("country_code").notNull(),
  dish: text("dish").notNull(),
  suggestedBy: text("suggested_by"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Host = typeof hosts.$inferSelect;
export type NewHost = typeof hosts.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type EntryPhoto = typeof entryPhotos.$inferSelect;
export type NewEntryPhoto = typeof entryPhotos.$inferInsert;
export type Suggestion = typeof suggestions.$inferSelect;
export type NewSuggestion = typeof suggestions.$inferInsert;
