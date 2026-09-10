ALTER TYPE "public"."recruiter_provisioning_status" ADD VALUE IF NOT EXISTS 'revision_required';
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "recruiter_rejection_reason" text;
