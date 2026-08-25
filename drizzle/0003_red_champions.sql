CREATE TYPE "public"."application_outcome_type" AS ENUM('hired', 'rejected', 'withdrawn', 'offer_accepted', 'offer_declined');--> statement-breakpoint
CREATE TYPE "public"."application_source" AS ENUM('candidate', 'recruiter_invitation');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('new', 'shortlisted', 'consent_requested', 'consent_approved', 'screening', 'assessment', 'review', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."assessment_attempt_status" AS ENUM('in_progress', 'submitted', 'expired', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."assessment_invitation_status" AS ENUM('pending', 'started', 'submitted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."assessment_question_type" AS ENUM('multiple_choice', 'free_text', 'situational', 'structured_response');--> statement-breakpoint
CREATE TYPE "public"."assessment_review_status" AS ENUM('pending', 'in_review', 'completed', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."assignment_role" AS ENUM('recruiter', 'hiring_manager');--> statement-breakpoint
CREATE TYPE "public"."attachment_scan_status" AS ENUM('not_applicable', 'pending', 'clean', 'quarantined');--> statement-breakpoint
CREATE TYPE "public"."candidate_document_kind" AS ENUM('cv');--> statement-breakpoint
CREATE TYPE "public"."candidate_document_status" AS ENUM('uploaded', 'processing', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."candidate_verification_status" AS ENUM('pending', 'verified', 'expired', 'revoked', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."candidate_verification_type" AS ENUM('identity', 'email', 'phone', 'education', 'employment', 'certification', 'portfolio');--> statement-breakpoint
CREATE TYPE "public"."cv_document_status" AS ENUM('uploaded', 'processing', 'review', 'approved', 'rejected', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."cv_version_template" AS ENUM('ats', 'creative');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary');--> statement-breakpoint
CREATE TYPE "public"."interview_event_type" AS ENUM('created', 'updated', 'reminder_sent', 'cancelled', 'rescheduled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."interview_feedback_recommendation" AS ENUM('strong_yes', 'yes', 'mixed', 'no', 'strong_no');--> statement-breakpoint
CREATE TYPE "public"."interview_panel_role" AS ENUM('interviewer', 'observer', 'coordinator');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."job_requirement_type" AS ENUM('required', 'preferred');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."message_report_status" AS ENUM('open', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_channel" AS ENUM('email', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'sent', 'accepted', 'declined', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "public"."payment_event_status" AS ENUM('processed', 'ignored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."screening_evaluation_type" AS ENUM('automated', 'human');--> statement-breakpoint
CREATE TYPE "public"."search_alert_frequency" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."search_analytics_event_type" AS ENUM('search', 'view_result', 'save_search', 'apply_filter');--> statement-breakpoint
CREATE TYPE "public"."token_purchase_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."work_arrangement" AS ENUM('onsite', 'hybrid', 'remote');--> statement-breakpoint
CREATE TABLE "application_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "assignment_role" NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_assignments_application_role_unique" UNIQUE("application_id","role")
);
--> statement-breakpoint
CREATE TABLE "application_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"type" "application_outcome_type" NOT NULL,
	"decided_by" uuid,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_outcomes_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "application_stage_due_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"stage" "application_status" NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"sla_hours" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_stage_due_dates_application_stage_unique" UNIQUE("application_id","stage")
);
--> statement-breakpoint
CREATE TABLE "application_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"candidate_profile_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"source" "application_source" DEFAULT 'candidate' NOT NULL,
	"cover_note" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_job_candidate_unique" UNIQUE("job_id","candidate_profile_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"response" jsonb DEFAULT 'null'::jsonb NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "assessment_answers_attempt_question_unique" UNIQUE("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" "assessment_attempt_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_attempts_invitation_number_unique" UNIQUE("invitation_id","attempt_number"),
	CONSTRAINT "assessment_attempts_attempt_number_check" CHECK ("assessment_attempts"."attempt_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "assessment_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"assessment_template_id" uuid NOT NULL,
	"candidate_profile_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" "assessment_invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_template_id" uuid NOT NULL,
	"type" "assessment_question_type" NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"response_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_questions_template_order_unique" UNIQUE("assessment_template_id","sort_order")
);
--> statement-breakpoint
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
CREATE TABLE "assessment_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"time_limit_minutes" integer,
	"attempt_limit" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_templates_time_limit_check" CHECK ("assessment_templates"."time_limit_minutes" is null or "assessment_templates"."time_limit_minutes" > 0),
	CONSTRAINT "assessment_templates_attempt_limit_check" CHECK ("assessment_templates"."attempt_limit" > 0)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"organization_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_owner_id" uuid,
	"spend_limit" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_accounts_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "billing_accounts_spend_limit_check" CHECK ("billing_accounts"."spend_limit" is null or "billing_accounts"."spend_limit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "candidate_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_profile_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"kind" "candidate_document_kind" NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sha256" text NOT NULL,
	"status" "candidate_document_status" DEFAULT 'uploaded' NOT NULL,
	"extraction_confidence" integer,
	"extracted_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "candidate_documents_byte_size_check" CHECK ("candidate_documents"."byte_size" >= 0),
	CONSTRAINT "candidate_documents_extraction_confidence_check" CHECK ("candidate_documents"."extraction_confidence" is null or "candidate_documents"."extraction_confidence" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "candidate_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_profile_id" uuid NOT NULL,
	"type" "candidate_verification_type" NOT NULL,
	"status" "candidate_verification_status" DEFAULT 'pending' NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"dispute_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_profile_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" text,
	"status" "cv_document_status" DEFAULT 'uploaded' NOT NULL,
	"page_count" integer,
	"extraction_confidence" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "cv_documents_size_bytes_check" CHECK ("cv_documents"."size_bytes" > 0),
	CONSTRAINT "cv_documents_page_count_check" CHECK ("cv_documents"."page_count" is null or "cv_documents"."page_count" > 0),
	CONSTRAINT "cv_documents_extraction_confidence_check" CHECK ("cv_documents"."extraction_confidence" is null or "cv_documents"."extraction_confidence" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "cv_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cv_document_id" uuid NOT NULL,
	"candidate_profile_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"template" "cv_version_template" NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approved_at" timestamp with time zone,
	"generated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cv_versions_document_version_template_unique" UNIQUE("cv_document_id","version_number","template"),
	CONSTRAINT "cv_versions_version_number_check" CHECK ("cv_versions"."version_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "interview_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"type" "interview_event_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scorecard_id" uuid NOT NULL,
	"recommendation" "interview_feedback_recommendation",
	"overall_score" integer,
	"comments" text,
	"ratings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_feedback_scorecard_id_unique" UNIQUE("scorecard_id"),
	CONSTRAINT "interview_feedback_overall_score_check" CHECK ("interview_feedback"."overall_score" is null or "interview_feedback"."overall_score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "interview_panel_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "interview_panel_role" DEFAULT 'interviewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_panel_members_interview_user_unique" UNIQUE("interview_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "interview_scorecards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"panel_member_id" uuid NOT NULL,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_scorecards_interview_panel_unique" UNIQUE("interview_id","panel_member_id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer,
	"timezone" text,
	"meeting_url" text,
	"reminder_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cancellation_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reschedule_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interviews_duration_minutes_check" CHECK ("interviews"."duration_minutes" is null or "interviews"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "job_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"type" "job_requirement_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"minimum_experience_months" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_requirements_minimum_experience_check" CHECK ("job_requirements"."minimum_experience_months" is null or "job_requirements"."minimum_experience_months" >= 0)
);
--> statement-breakpoint
CREATE TABLE "job_stage_slas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"stage" "application_status" NOT NULL,
	"due_after_hours" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_stage_slas_job_stage_unique" UNIQUE("job_id","stage"),
	CONSTRAINT "job_stage_slas_due_after_hours_check" CHECK ("job_stage_slas"."due_after_hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"work_arrangement" "work_arrangement" NOT NULL,
	"location" text,
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"reporter_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "message_report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" "notification_delivery_channel" NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"provider_message_id" text,
	"last_error" text,
	"next_attempt_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_deliveries_dedupe_key_unique" UNIQUE("dedupe_key"),
	CONSTRAINT "notification_deliveries_attempt_count_check" CHECK ("notification_deliveries"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"expires_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"terms" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"status" "payment_event_status" DEFAULT 'processed' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"name" text NOT NULL,
	"query" text,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_searches_organization_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "screening_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_run_id" uuid NOT NULL,
	"evaluated_by" uuid,
	"type" "screening_evaluation_type" NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_governance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_run_id" uuid NOT NULL,
	"governance_version_id" uuid NOT NULL,
	"policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screening_governance_snapshots_screening_run_id_unique" UNIQUE("screening_run_id")
);
--> statement-breakpoint
CREATE TABLE "screening_governance_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screening_governance_versions_org_version_unique" UNIQUE("organization_id","version")
);
--> statement-breakpoint
CREATE TABLE "screening_run_telemetry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_run_id" uuid NOT NULL,
	"provider_cost_minor" integer,
	"latency_ms" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"provider_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screening_run_telemetry_screening_run_id_unique" UNIQUE("screening_run_id"),
	CONSTRAINT "screening_run_telemetry_provider_cost_check" CHECK ("screening_run_telemetry"."provider_cost_minor" is null or "screening_run_telemetry"."provider_cost_minor" >= 0),
	CONSTRAINT "screening_run_telemetry_latency_check" CHECK ("screening_run_telemetry"."latency_ms" is null or "screening_run_telemetry"."latency_ms" >= 0),
	CONSTRAINT "screening_run_telemetry_retry_count_check" CHECK ("screening_run_telemetry"."retry_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "search_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saved_search_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"frequency" "search_alert_frequency" DEFAULT 'weekly' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_alerts_saved_search_user_unique" UNIQUE("saved_search_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "search_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"saved_search_id" uuid,
	"event_type" "search_analytics_event_type" NOT NULL,
	"query" text,
	"result_count" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"canonical_skill" text NOT NULL,
	"alias" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_aliases_organization_alias_unique" UNIQUE("organization_id","alias")
);
--> statement-breakpoint
CREATE TABLE "token_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"token_amount" integer NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"validity_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_packages_code_unique" UNIQUE("code"),
	CONSTRAINT "token_packages_token_amount_check" CHECK ("token_packages"."token_amount" > 0),
	CONSTRAINT "token_packages_price_minor_check" CHECK ("token_packages"."price_minor" >= 0),
	CONSTRAINT "token_packages_validity_days_check" CHECK ("token_packages"."validity_days" is null or "token_packages"."validity_days" > 0)
);
--> statement-breakpoint
CREATE TABLE "token_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"purchased_by" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_reference" text,
	"status" "token_purchase_status" DEFAULT 'pending' NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"token_amount" integer NOT NULL,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_purchases_provider_reference_unique" UNIQUE("provider_reference"),
	CONSTRAINT "token_purchases_amount_minor_check" CHECK ("token_purchases"."amount_minor" >= 0),
	CONSTRAINT "token_purchases_token_amount_check" CHECK ("token_purchases"."token_amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD COLUMN "last_read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "consent_request_item_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "retention_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_name" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_mime_type" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_size" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_storage_path" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_scan_status" "attachment_scan_status" DEFAULT 'not_applicable' NOT NULL;--> statement-breakpoint
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_outcomes" ADD CONSTRAINT "application_outcomes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_outcomes" ADD CONSTRAINT "application_outcomes_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_stage_due_dates" ADD CONSTRAINT "application_stage_due_dates_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_invitation_id_assessment_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."assessment_invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_assessment_template_id_assessment_templates_id_fk" FOREIGN KEY ("assessment_template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_template_id_assessment_templates_id_fk" FOREIGN KEY ("assessment_template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_reviews" ADD CONSTRAINT "assessment_reviews_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_reviews" ADD CONSTRAINT "assessment_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_billing_owner_id_users_id_fk" FOREIGN KEY ("billing_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_verifications" ADD CONSTRAINT "candidate_verifications_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_documents" ADD CONSTRAINT "cv_documents_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_cv_document_id_cv_documents_id_fk" FOREIGN KEY ("cv_document_id") REFERENCES "public"."cv_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_events" ADD CONSTRAINT "interview_events_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_events" ADD CONSTRAINT "interview_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_scorecard_id_interview_scorecards_id_fk" FOREIGN KEY ("scorecard_id") REFERENCES "public"."interview_scorecards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_panel_members" ADD CONSTRAINT "interview_panel_members_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_panel_members" ADD CONSTRAINT "interview_panel_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_panel_member_id_interview_panel_members_id_fk" FOREIGN KEY ("panel_member_id") REFERENCES "public"."interview_panel_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_stage_slas" ADD CONSTRAINT "job_stage_slas_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_evaluations" ADD CONSTRAINT "screening_evaluations_screening_run_id_screening_runs_id_fk" FOREIGN KEY ("screening_run_id") REFERENCES "public"."screening_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_evaluations" ADD CONSTRAINT "screening_evaluations_evaluated_by_users_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_governance_snapshots" ADD CONSTRAINT "screening_governance_snapshots_screening_run_id_screening_runs_id_fk" FOREIGN KEY ("screening_run_id") REFERENCES "public"."screening_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_governance_snapshots" ADD CONSTRAINT "screening_governance_snapshots_governance_version_id_screening_governance_versions_id_fk" FOREIGN KEY ("governance_version_id") REFERENCES "public"."screening_governance_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_governance_versions" ADD CONSTRAINT "screening_governance_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_governance_versions" ADD CONSTRAINT "screening_governance_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_run_telemetry" ADD CONSTRAINT "screening_run_telemetry_screening_run_id_screening_runs_id_fk" FOREIGN KEY ("screening_run_id") REFERENCES "public"."screening_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_alerts" ADD CONSTRAINT "search_alerts_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_alerts" ADD CONSTRAINT "search_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_package_id_token_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."token_packages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_purchased_by_users_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_assignments_user_role_idx" ON "application_assignments" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "application_outcomes_type_idx" ON "application_outcomes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "application_stage_due_dates_due_idx" ON "application_stage_due_dates" USING btree ("due_at","completed_at");--> statement-breakpoint
CREATE INDEX "application_stage_history_application_created_idx" ON "application_stage_history" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX "application_stage_history_changed_by_idx" ON "application_stage_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "applications_job_status_idx" ON "applications" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "applications_candidate_status_idx" ON "applications" USING btree ("candidate_profile_id","status");--> statement-breakpoint
CREATE INDEX "assessment_answers_attempt_idx" ON "assessment_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "assessment_answers_question_idx" ON "assessment_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_invitation_status_idx" ON "assessment_attempts" USING btree ("invitation_id","status");--> statement-breakpoint
CREATE INDEX "assessment_invitations_application_idx" ON "assessment_invitations" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "assessment_invitations_candidate_status_idx" ON "assessment_invitations" USING btree ("candidate_profile_id","status");--> statement-breakpoint
CREATE INDEX "assessment_invitations_template_idx" ON "assessment_invitations" USING btree ("assessment_template_id");--> statement-breakpoint
CREATE INDEX "assessment_invitations_invited_by_idx" ON "assessment_invitations" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "assessment_questions_template_idx" ON "assessment_questions" USING btree ("assessment_template_id");--> statement-breakpoint
CREATE INDEX "assessment_reviews_attempt_idx" ON "assessment_reviews" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "assessment_reviews_reviewer_idx" ON "assessment_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "assessment_reviews_status_idx" ON "assessment_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assessment_templates_organization_idx" ON "assessment_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "assessment_templates_created_by_idx" ON "assessment_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_created_idx" ON "audit_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_created_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "billing_accounts_billing_owner_idx" ON "billing_accounts" USING btree ("billing_owner_id");--> statement-breakpoint
CREATE INDEX "candidate_documents_owner_status_idx" ON "candidate_documents" USING btree ("owner_user_id","status");--> statement-breakpoint
CREATE INDEX "candidate_documents_profile_idx" ON "candidate_documents" USING btree ("candidate_profile_id");--> statement-breakpoint
CREATE INDEX "candidate_verifications_profile_type_status_idx" ON "candidate_verifications" USING btree ("candidate_profile_id","type","status");--> statement-breakpoint
CREATE INDEX "cv_documents_candidate_status_idx" ON "cv_documents" USING btree ("candidate_profile_id","status");--> statement-breakpoint
CREATE INDEX "cv_versions_document_idx" ON "cv_versions" USING btree ("cv_document_id");--> statement-breakpoint
CREATE INDEX "cv_versions_candidate_idx" ON "cv_versions" USING btree ("candidate_profile_id");--> statement-breakpoint
CREATE INDEX "interview_events_interview_occurred_idx" ON "interview_events" USING btree ("interview_id","occurred_at");--> statement-breakpoint
CREATE INDEX "interview_panel_members_user_idx" ON "interview_panel_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "interviews_application_scheduled_idx" ON "interviews" USING btree ("application_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "interviews_organization_status_idx" ON "interviews" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "job_requirements_job_idx" ON "job_requirements" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_requirements_job_type_idx" ON "job_requirements" USING btree ("job_id","type");--> statement-breakpoint
CREATE INDEX "jobs_organization_status_idx" ON "jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "jobs_created_by_idx" ON "jobs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "message_reports_conversation_idx" ON "message_reports" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_reports_reporter_idx" ON "message_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_notification_status_idx" ON "notification_deliveries" USING btree ("notification_id","status");--> statement-breakpoint
CREATE INDEX "offers_application_status_idx" ON "offers" USING btree ("application_id","status");--> statement-breakpoint
CREATE INDEX "offers_organization_status_idx" ON "offers" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "payment_events_provider_event_idx" ON "payment_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "saved_searches_created_by_idx" ON "saved_searches" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "screening_evaluations_run_type_idx" ON "screening_evaluations" USING btree ("screening_run_id","type");--> statement-breakpoint
CREATE INDEX "screening_governance_snapshots_version_idx" ON "screening_governance_snapshots" USING btree ("governance_version_id");--> statement-breakpoint
CREATE INDEX "screening_governance_versions_org_published_idx" ON "screening_governance_versions" USING btree ("organization_id","published_at");--> statement-breakpoint
CREATE INDEX "search_alerts_enabled_idx" ON "search_alerts" USING btree ("enabled","frequency");--> statement-breakpoint
CREATE INDEX "search_analytics_organization_created_idx" ON "search_analytics" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "search_analytics_saved_search_idx" ON "search_analytics" USING btree ("saved_search_id");--> statement-breakpoint
CREATE INDEX "skill_aliases_canonical_idx" ON "skill_aliases" USING btree ("organization_id","canonical_skill");--> statement-breakpoint
CREATE INDEX "token_packages_active_idx" ON "token_packages" USING btree ("active");--> statement-breakpoint
CREATE INDEX "token_purchases_organization_status_idx" ON "token_purchases" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "token_purchases_package_idx" ON "token_purchases" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "token_purchases_provider_reference_idx" ON "token_purchases" USING btree ("provider","provider_reference");--> statement-breakpoint
CREATE INDEX "token_purchases_purchased_by_idx" ON "token_purchases" USING btree ("purchased_by");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_consent_request_item_id_consent_request_items_id_fk" FOREIGN KEY ("consent_request_item_id") REFERENCES "public"."consent_request_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "token_ledger_entries_screening_run_idx" ON "token_ledger_entries" USING btree ("screening_run_id");--> statement-breakpoint
ALTER TABLE "token_ledger_entries" ADD CONSTRAINT "token_ledger_entries_grant_refund_amount_check" CHECK ("token_ledger_entries"."type" = 'charge' or "token_ledger_entries"."amount" > 0);