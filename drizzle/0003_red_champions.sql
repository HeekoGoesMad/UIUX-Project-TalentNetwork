CREATE TYPE "public"."application_outcome_type" AS ENUM('hired', 'rejected', 'withdrawn', 'offer_accepted', 'offer_declined');;
--> statement-breakpoint
CREATE TYPE "public"."assignment_role" AS ENUM('recruiter', 'hiring_manager');;
--> statement-breakpoint
CREATE TYPE "public"."interview_event_type" AS ENUM('created', 'updated', 'reminder_sent', 'cancelled', 'rescheduled', 'completed');;
--> statement-breakpoint
CREATE TYPE "public"."interview_feedback_recommendation" AS ENUM('strong_yes', 'yes', 'mixed', 'no', 'strong_no');;
--> statement-breakpoint
CREATE TYPE "public"."interview_panel_role" AS ENUM('interviewer', 'observer', 'coordinator');;
--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'cancelled', 'rescheduled');;
--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'sent', 'accepted', 'declined', 'withdrawn', 'expired');;
--> statement-breakpoint
CREATE TYPE "public"."screening_evaluation_type" AS ENUM('automated', 'human');;
--> statement-breakpoint
CREATE TYPE "public"."search_alert_frequency" AS ENUM('daily', 'weekly');;
--> statement-breakpoint
CREATE TYPE "public"."search_analytics_event_type" AS ENUM('search', 'view_result', 'save_search', 'apply_filter');;
--> statement-breakpoint
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
);;
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
);;
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
);;
--> statement-breakpoint
CREATE TABLE "interview_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"type" "interview_event_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);;
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
);;
--> statement-breakpoint
CREATE TABLE "interview_panel_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "interview_panel_role" DEFAULT 'interviewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_panel_members_interview_user_unique" UNIQUE("interview_id","user_id")
);;
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
);;
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
);;
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
);;
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
);;
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
);;
--> statement-breakpoint
CREATE TABLE "screening_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_run_id" uuid NOT NULL,
	"evaluated_by" uuid,
	"type" "screening_evaluation_type" NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);;
--> statement-breakpoint
CREATE TABLE "screening_governance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_run_id" uuid NOT NULL,
	"governance_version_id" uuid NOT NULL,
	"policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screening_governance_snapshots_screening_run_id_unique" UNIQUE("screening_run_id")
);;
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
);;
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
);;
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
);;
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
);;
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
);;
--> statement-breakpoint
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "application_outcomes" ADD CONSTRAINT "application_outcomes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "application_outcomes" ADD CONSTRAINT "application_outcomes_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "application_stage_due_dates" ADD CONSTRAINT "application_stage_due_dates_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interview_events" ADD CONSTRAINT "interview_events_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interview_events" ADD CONSTRAINT "interview_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_scorecard_id_interview_scorecards_id_fk" FOREIGN KEY ("scorecard_id") REFERENCES "public"."interview_scorecards"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interview_panel_members" ADD CONSTRAINT "interview_panel_members_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interview_panel_members" ADD CONSTRAINT "interview_panel_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_panel_member_id_interview_panel_members_id_fk" FOREIGN KEY ("panel_member_id") REFERENCES "public"."interview_panel_members"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "job_stage_slas" ADD CONSTRAINT "job_stage_slas_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "screening_evaluations" ADD CONSTRAINT "screening_evaluations_screening_run_id_screening_runs_id_fk" FOREIGN KEY ("screening_run_id") REFERENCES "public"."screening_runs"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "screening_evaluations" ADD CONSTRAINT "screening_evaluations_evaluated_by_users_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "screening_governance_snapshots" ADD CONSTRAINT "screening_governance_snapshots_screening_run_id_screening_runs_id_fk" FOREIGN KEY ("screening_run_id") REFERENCES "public"."screening_runs"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "screening_governance_snapshots" ADD CONSTRAINT "screening_governance_snapshots_governance_version_id_screening_governance_versions_id_fk" FOREIGN KEY ("governance_version_id") REFERENCES "public"."screening_governance_versions"("id") ON DELETE restrict ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "screening_governance_versions" ADD CONSTRAINT "screening_governance_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "screening_governance_versions" ADD CONSTRAINT "screening_governance_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "screening_run_telemetry" ADD CONSTRAINT "screening_run_telemetry_screening_run_id_screening_runs_id_fk" FOREIGN KEY ("screening_run_id") REFERENCES "public"."screening_runs"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "search_alerts" ADD CONSTRAINT "search_alerts_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "search_alerts" ADD CONSTRAINT "search_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE set null ON UPDATE no action;;
--> statement-breakpoint
ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;;
--> statement-breakpoint
CREATE INDEX "application_assignments_user_role_idx" ON "application_assignments" USING btree ("user_id","role");;
--> statement-breakpoint
CREATE INDEX "application_outcomes_type_idx" ON "application_outcomes" USING btree ("type");;
--> statement-breakpoint
CREATE INDEX "application_stage_due_dates_due_idx" ON "application_stage_due_dates" USING btree ("due_at","completed_at");;
--> statement-breakpoint
CREATE INDEX "interview_events_interview_occurred_idx" ON "interview_events" USING btree ("interview_id","occurred_at");;
--> statement-breakpoint
CREATE INDEX "interview_panel_members_user_idx" ON "interview_panel_members" USING btree ("user_id");;
--> statement-breakpoint
CREATE INDEX "interviews_application_scheduled_idx" ON "interviews" USING btree ("application_id","scheduled_at");;
--> statement-breakpoint
CREATE INDEX "interviews_organization_status_idx" ON "interviews" USING btree ("organization_id","status");;
--> statement-breakpoint
CREATE INDEX "offers_application_status_idx" ON "offers" USING btree ("application_id","status");;
--> statement-breakpoint
CREATE INDEX "offers_organization_status_idx" ON "offers" USING btree ("organization_id","status");;
--> statement-breakpoint
CREATE INDEX "saved_searches_created_by_idx" ON "saved_searches" USING btree ("created_by");;
--> statement-breakpoint
CREATE INDEX "screening_evaluations_run_type_idx" ON "screening_evaluations" USING btree ("screening_run_id","type");;
--> statement-breakpoint
CREATE INDEX "screening_governance_snapshots_version_idx" ON "screening_governance_snapshots" USING btree ("governance_version_id");;
--> statement-breakpoint
CREATE INDEX "screening_governance_versions_org_published_idx" ON "screening_governance_versions" USING btree ("organization_id","published_at");;
--> statement-breakpoint
CREATE INDEX "search_alerts_enabled_idx" ON "search_alerts" USING btree ("enabled","frequency");;
--> statement-breakpoint
CREATE INDEX "search_analytics_organization_created_idx" ON "search_analytics" USING btree ("organization_id","created_at");;
--> statement-breakpoint
CREATE INDEX "search_analytics_saved_search_idx" ON "search_analytics" USING btree ("saved_search_id");;
--> statement-breakpoint
CREATE INDEX "skill_aliases_canonical_idx" ON "skill_aliases" USING btree ("organization_id","canonical_skill");
