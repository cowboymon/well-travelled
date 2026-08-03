CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"dish" text NOT NULL,
	"suggested_by" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
