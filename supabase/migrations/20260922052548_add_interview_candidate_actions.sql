-- Migration 20260922052548: add_interview_candidate_actions
-- Applied remotely on Supabase prod/dev and reflected in Drizzle schema
ALTER TYPE "public"."interview_status" ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE "public"."interview_status" ADD VALUE IF NOT EXISTS 'reschedule_requested';
ALTER TYPE "public"."interview_status" ADD VALUE IF NOT EXISTS 'declined';

ALTER TYPE "public"."interview_event_type" ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE "public"."interview_event_type" ADD VALUE IF NOT EXISTS 'reschedule_requested';
ALTER TYPE "public"."interview_event_type" ADD VALUE IF NOT EXISTS 'declined';
