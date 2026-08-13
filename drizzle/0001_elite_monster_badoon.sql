CREATE TYPE "public"."recruiter_provisioning_status" AS ENUM('pending', 'active', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."token_ledger_entry_type" AS ENUM('grant', 'charge', 'refund');--> statement-breakpoint
CREATE TABLE "token_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_accounts_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "token_accounts_balance_check" CHECK ("token_accounts"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "token_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_account_id" uuid NOT NULL,
	"type" "token_ledger_entry_type" NOT NULL,
	"amount" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"screening_run_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_ledger_entries_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "token_ledger_entries_screening_run_id_unique" UNIQUE("screening_run_id"),
	CONSTRAINT "token_ledger_entries_amount_check" CHECK ("token_ledger_entries"."amount" <> 0),
	CONSTRAINT "token_ledger_entries_charge_amount_check" CHECK ("token_ledger_entries"."type" <> 'charge' or "token_ledger_entries"."amount" < 0)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "recruiter_provisioning_status" "recruiter_provisioning_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_accounts" ADD CONSTRAINT "token_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_ledger_entries" ADD CONSTRAINT "token_ledger_entries_token_account_id_token_accounts_id_fk" FOREIGN KEY ("token_account_id") REFERENCES "public"."token_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_ledger_entries" ADD CONSTRAINT "token_ledger_entries_screening_run_id_screening_runs_id_fk" FOREIGN KEY ("screening_run_id") REFERENCES "public"."screening_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "token_ledger_entries_account_created_idx" ON "token_ledger_entries" USING btree ("token_account_id","created_at");--> statement-breakpoint
CREATE INDEX "consent_events_actor_idx" ON "consent_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "consent_request_batches_organization_idx" ON "consent_request_batches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "consent_request_batches_requested_by_idx" ON "consent_request_batches" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "consent_request_items_batch_idx" ON "consent_request_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "conversation_participants_user_idx" ON "conversation_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_organization_idx" ON "conversations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversations_created_by_idx" ON "conversations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizations_created_by_idx" ON "organizations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "screening_runs_candidate_idx" ON "screening_runs" USING btree ("candidate_profile_id");--> statement-breakpoint
CREATE INDEX "screening_runs_consent_item_idx" ON "screening_runs" USING btree ("consent_request_item_id");--> statement-breakpoint
CREATE INDEX "screening_runs_requested_by_idx" ON "screening_runs" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "shortlists_created_by_idx" ON "shortlists" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "users_role_provisioning_status_idx" ON "users" USING btree ("role","recruiter_provisioning_status");