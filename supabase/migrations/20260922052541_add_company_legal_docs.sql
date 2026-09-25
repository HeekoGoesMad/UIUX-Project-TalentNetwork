-- Migration 20260922052541: add_company_legal_docs
-- Applied remotely on Supabase prod/dev and reflected in Drizzle schema
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "nib_document_url" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "npwp_document_url" text;
