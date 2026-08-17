CREATE TYPE "public"."application_source" AS ENUM('candidate', 'recruiter_invitation');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('new', 'shortlisted', 'consent_requested', 'consent_approved', 'screening', 'assessment', 'review', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."assessment_attempt_status" AS ENUM('in_progress', 'submitted', 'expired', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."assessment_invitation_status" AS ENUM('pending', 'started', 'submitted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."assessment_question_type" AS ENUM('multiple_choice', 'free_text', 'situational', 'structured_response');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary');--> statement-breakpoint
CREATE TYPE "public"."job_requirement_type" AS ENUM('required', 'preferred');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."work_arrangement" AS ENUM('onsite', 'hybrid', 'remote');--> statement-breakpoint
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
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "assessment_templates_organization_idx" ON "assessment_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "assessment_templates_created_by_idx" ON "assessment_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "job_requirements_job_idx" ON "job_requirements" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_requirements_job_type_idx" ON "job_requirements" USING btree ("job_id","type");--> statement-breakpoint
CREATE INDEX "jobs_organization_status_idx" ON "jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "jobs_created_by_idx" ON "jobs" USING btree ("created_by");