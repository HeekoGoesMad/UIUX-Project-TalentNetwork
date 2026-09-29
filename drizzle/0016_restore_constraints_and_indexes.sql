-- Idempotent restoration of missing constraints and indexes for production parity

-- 1. candidate_documents
DO $$ BEGIN
  ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_candidate_profile_id_candidate_profiles_id_" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_byte_size_check" CHECK ("byte_size" >= 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_extraction_confidence_check" CHECK (("extraction_confidence" IS NULL) OR (("extraction_confidence" >= 0) AND ("extraction_confidence" <= 100)));
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidate_documents_owner_status_idx" ON "candidate_documents" USING btree ("owner_user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidate_documents_profile_idx" ON "candidate_documents" USING btree ("candidate_profile_id");
--> statement-breakpoint

-- 2. candidate_verifications
DO $$ BEGIN
  ALTER TABLE "candidate_verifications" ADD CONSTRAINT "candidate_verifications_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "candidate_verifications" ADD CONSTRAINT "candidate_verifications_candidate_profile_id_candidate_profiles" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidate_verifications_profile_type_status_idx" ON "candidate_verifications" USING btree ("candidate_profile_id", "type", "status");
--> statement-breakpoint

-- 3. cv_documents
DO $$ BEGIN
  ALTER TABLE "cv_documents" ADD CONSTRAINT "cv_documents_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_documents" ADD CONSTRAINT "cv_documents_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_documents" ADD CONSTRAINT "cv_documents_size_bytes_check" CHECK ("size_bytes" > 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_documents" ADD CONSTRAINT "cv_documents_page_count_check" CHECK (("page_count" IS NULL) OR ("page_count" > 0));
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_documents" ADD CONSTRAINT "cv_documents_extraction_confidence_check" CHECK (("extraction_confidence" IS NULL) OR (("extraction_confidence" >= 0) AND ("extraction_confidence" <= 100)));
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_documents_candidate_status_idx" ON "cv_documents" USING btree ("candidate_profile_id", "status");
--> statement-breakpoint

-- 4. cv_versions
DO $$ BEGIN
  ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_cv_document_id_cv_documents_id_fk" FOREIGN KEY ("cv_document_id") REFERENCES "public"."cv_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_candidate_profile_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_document_version_template_unique" UNIQUE ("cv_document_id", "version_number", "template");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cv_versions" ADD CONSTRAINT "cv_versions_version_number_check" CHECK ("version_number" > 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_versions_candidate_idx" ON "cv_versions" USING btree ("candidate_profile_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cv_versions_document_idx" ON "cv_versions" USING btree ("cv_document_id");
--> statement-breakpoint

-- 5. notification_deliveries
DO $$ BEGIN
  ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_dedupe_key_unique" UNIQUE ("dedupe_key");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_attempt_count_check" CHECK ("attempt_count" >= 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_deliveries_notification_status_idx" ON "notification_deliveries" USING btree ("notification_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_deliveries_status_next_attempt_idx" ON "notification_deliveries" USING btree ("status", "next_attempt_at");
--> statement-breakpoint

-- 6. notification_preferences
DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_unique" UNIQUE ("user_id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint

-- 7. partner_applications
DO $$ BEGIN
  ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_applications_status_idx" ON "partner_applications" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_applications_submitted_idx" ON "partner_applications" USING btree ("submitted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_applications_user_idx" ON "partner_applications" USING btree ("user_id");
--> statement-breakpoint

-- 8. payment_events
DO $$ BEGIN
  ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_event_id_unique" UNIQUE ("event_id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_events_provider_event_idx" ON "payment_events" USING btree ("provider", "event_id");
--> statement-breakpoint

-- 9. token_packages
DO $$ BEGIN
  ALTER TABLE "token_packages" ADD CONSTRAINT "token_packages_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_packages" ADD CONSTRAINT "token_packages_code_unique" UNIQUE ("code");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_packages" ADD CONSTRAINT "token_packages_price_minor_check" CHECK ("price_minor" >= 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_packages" ADD CONSTRAINT "token_packages_token_amount_check" CHECK ("token_amount" > 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_packages" ADD CONSTRAINT "token_packages_validity_days_check" CHECK (("validity_days" IS NULL) OR ("validity_days" > 0));
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_packages_active_idx" ON "token_packages" USING btree ("active");
--> statement-breakpoint

-- 10. token_purchases
DO $$ BEGIN
  ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_pkey" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_provider_reference_unique" UNIQUE ("provider_reference");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_package_id_token_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."token_packages"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_purchased_by_users_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_token_amount_check" CHECK ("token_amount" > 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_amount_minor_check" CHECK ("amount_minor" >= 0);
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_purchases_organization_status_idx" ON "token_purchases" USING btree ("organization_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_purchases_package_idx" ON "token_purchases" USING btree ("package_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_purchases_provider_reference_idx" ON "token_purchases" USING btree ("provider", "provider_reference");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_purchases_purchased_by_idx" ON "token_purchases" USING btree ("purchased_by");
--> statement-breakpoint

-- 11. Additional constraints and performance indexes
DO $$ BEGIN
  ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_template_order_unique" UNIQUE ("assessment_template_id", "sort_order");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_organization_id_unique" UNIQUE ("organization_id");
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_spend_limit_check" CHECK (("spend_limit" IS NULL) OR ("spend_limit" >= 0));
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "token_ledger_entries" ADD CONSTRAINT "token_ledger_entries_grant_refund_amount_check" CHECK (("type" = 'charge'::token_ledger_entry_type) OR ("amount" > 0));
EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_ledger_entries_screening_run_idx" ON "token_ledger_entries" USING btree ("screening_run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_templates_organization_idx" ON "assessment_templates" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_requirements_job_idx" ON "job_requirements" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_organization_status_idx" ON "jobs" USING btree ("organization_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_stage_history_application_created_idx" ON "application_stage_history" USING btree ("application_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_stage_history_changed_by_idx" ON "application_stage_history" USING btree ("changed_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_candidate_status_idx" ON "applications" USING btree ("candidate_profile_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_job_status_idx" ON "applications" USING btree ("job_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_answers_attempt_idx" ON "assessment_answers" USING btree ("attempt_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_answers_question_idx" ON "assessment_answers" USING btree ("question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_attempts_invitation_status_idx" ON "assessment_attempts" USING btree ("invitation_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_invitations_application_idx" ON "assessment_invitations" USING btree ("application_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_invitations_candidate_status_idx" ON "assessment_invitations" USING btree ("candidate_profile_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_invitations_invited_by_idx" ON "assessment_invitations" USING btree ("invited_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_invitations_template_idx" ON "assessment_invitations" USING btree ("assessment_template_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_questions_template_idx" ON "assessment_questions" USING btree ("assessment_template_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_templates_created_by_idx" ON "assessment_templates" USING btree ("created_by");
