CREATE INDEX IF NOT EXISTS "applications_candidate_updated_idx" ON "applications" USING btree ("candidate_profile_id","updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_display_name_idx" ON "profiles" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "screening_runs_organization_status_idx" ON "screening_runs" USING btree ("organization_id","status");