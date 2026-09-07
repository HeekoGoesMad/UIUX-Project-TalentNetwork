ALTER TABLE "screening_runs" ALTER COLUMN "consent_request_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "screening_runs" DROP CONSTRAINT IF EXISTS "screening_runs_consent_request_item_id_consent_request_items_id_fk";--> statement-breakpoint
ALTER TABLE "screening_runs" ADD CONSTRAINT "screening_runs_consent_request_item_id_consent_request_items_id_fk" FOREIGN KEY ("consent_request_item_id") REFERENCES "public"."consent_request_items"("id") ON DELETE set null ON UPDATE no action;
