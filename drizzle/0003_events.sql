CREATE TYPE "public"."event_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"summary" text NOT NULL,
	"description" text[] DEFAULT '{}' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"venue_name" text NOT NULL,
	"venue_address" text NOT NULL,
	"venue_url" text,
	"rsvp_url" text NOT NULL,
	"rsvp_label" text DEFAULT 'RSVP' NOT NULL,
	"rsvp_banner_text" text,
	"poster_url" text NOT NULL,
	"poster_width" integer,
	"poster_height" integer,
	"poster_alt" text NOT NULL,
	"poster_pdf_url" text,
	"agenda" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"speakers" text[] DEFAULT '{}' NOT NULL,
	"speaker_cards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"partners" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text[] DEFAULT '{}' NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;