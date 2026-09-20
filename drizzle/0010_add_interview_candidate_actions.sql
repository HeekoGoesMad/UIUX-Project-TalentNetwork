ALTER TYPE "public"."interview_status" ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE "public"."interview_status" ADD VALUE IF NOT EXISTS 'reschedule_requested';
ALTER TYPE "public"."interview_status" ADD VALUE IF NOT EXISTS 'declined';

ALTER TYPE "public"."interview_event_type" ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE "public"."interview_event_type" ADD VALUE IF NOT EXISTS 'reschedule_requested';
ALTER TYPE "public"."interview_event_type" ADD VALUE IF NOT EXISTS 'declined';
