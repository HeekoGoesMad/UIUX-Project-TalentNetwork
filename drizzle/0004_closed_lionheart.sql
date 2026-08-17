CREATE TYPE "public"."assessment_review_status" AS ENUM('pending', 'in_review', 'completed', 'disputed');--> statement-breakpoint
CREATE TABLE "assessment_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"status" "assessment_review_status" DEFAULT 'pending' NOT NULL,
	"score" integer,
	"dimension_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_reviews_attempt_id_unique" UNIQUE("attempt_id"),
	CONSTRAINT "assessment_reviews_score_check" CHECK ("assessment_reviews"."score" is null or "assessment_reviews"."score" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "assessment_reviews" ADD CONSTRAINT "assessment_reviews_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_reviews" ADD CONSTRAINT "assessment_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_reviews_attempt_idx" ON "assessment_reviews" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "assessment_reviews_reviewer_idx" ON "assessment_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "assessment_reviews_status_idx" ON "assessment_reviews" USING btree ("status");