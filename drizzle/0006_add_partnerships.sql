ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'partner';
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."partner_verification_status" AS ENUM('pending', 'approved', 'need_revision', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partnerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"sk_document_url" text,
	"sk_number" text,
	"location" text,
	"verification_status" "public"."partner_verification_status" DEFAULT 'pending' NOT NULL,
	"verification_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partnerships_user_id_idx" ON "partnerships" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partnerships_verification_status_idx" ON "partnerships" USING btree ("verification_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partnerships_reviewed_by_idx" ON "partnerships" USING btree ("reviewed_by");