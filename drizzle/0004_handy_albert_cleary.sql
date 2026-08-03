CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN "person_id" uuid;--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "people" ("name") VALUES
	('Jess'),
	('Mon'),
	('Olive'),
	('My Love (Javi)'),
	('Benn'),
	('Alannah')
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
INSERT INTO "people" ("name")
SELECT DISTINCT "name" FROM "hosts"
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
UPDATE "hosts" SET "person_id" = "people"."id"
FROM "people"
WHERE "hosts"."name" = "people"."name" AND "hosts"."person_id" IS NULL;