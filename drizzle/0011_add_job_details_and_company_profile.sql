ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "banner_url" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "company_phone" text;

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "salary_min" integer;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "salary_max" integer;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "salary_currency" text DEFAULT 'IDR' NOT NULL;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "salary_period" text DEFAULT 'monthly' NOT NULL;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "is_salary_negotiable" boolean DEFAULT false NOT NULL;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "hide_salary" boolean DEFAULT false NOT NULL;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "experience_level" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "min_education" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_category" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "responsibilities" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "qualifications" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "benefits" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "vacancies_count" integer DEFAULT 1;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
