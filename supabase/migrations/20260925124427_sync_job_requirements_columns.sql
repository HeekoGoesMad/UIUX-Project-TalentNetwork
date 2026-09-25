-- Sync job_requirements table columns to match Drizzle schema
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'job_requirements' 
      AND column_name = 'label'
  ) THEN
    ALTER TABLE public.job_requirements RENAME COLUMN label TO name;
  END IF;
END $$;

ALTER TABLE public.job_requirements ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.job_requirements ADD COLUMN IF NOT EXISTS minimum_experience_months integer;

ALTER TABLE public.job_requirements DROP CONSTRAINT IF EXISTS job_requirements_minimum_experience_check;
ALTER TABLE public.job_requirements ADD CONSTRAINT job_requirements_minimum_experience_check 
  CHECK (minimum_experience_months IS NULL OR minimum_experience_months >= 0);

CREATE INDEX IF NOT EXISTS job_requirements_job_type_idx 
  ON public.job_requirements (job_id, type);
