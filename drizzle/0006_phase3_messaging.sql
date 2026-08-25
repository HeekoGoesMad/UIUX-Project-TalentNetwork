-- Custom SQL migration file, put your code below! --
CREATE TYPE "public"."attachment_scan_status" AS ENUM('not_applicable', 'pending', 'clean', 'quarantined');--> statement-breakpoint
CREATE TYPE "public"."message_report_status" AS ENUM('open', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "consent_request_item_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "retention_expires_at" timestamptz;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_consent_request_item_id_consent_request_items_id_fk" FOREIGN KEY ("consent_request_item_id") REFERENCES "public"."consent_request_items"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD COLUMN "last_read_at" timestamptz;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_name" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_mime_type" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_size" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_storage_path" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attachment_scan_status" "public"."attachment_scan_status" DEFAULT 'not_applicable' NOT NULL;--> statement-breakpoint
CREATE TABLE "message_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"reporter_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "public"."message_report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "message_reports_conversation_idx" ON "message_reports" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_reports_reporter_idx" ON "message_reports" USING btree ("reporter_id");
