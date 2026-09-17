ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "nib_document_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "npwp_document_url" text;
