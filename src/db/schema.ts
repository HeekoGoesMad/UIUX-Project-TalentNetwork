import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const userRole = pgEnum("user_role", ["candidate", "recruiter", "partner", "admin"]);
export const organizationMemberRole = pgEnum("organization_member_role", ["owner", "admin", "recruiter", "viewer"]);
export const profileSectionType = pgEnum("profile_section_type", [
  "headline",
  "about",
  "experience",
  "education",
  "skills",
  "tools",
  "preferences",
  "portfolio",
]);
export const shortlistItemStatus = pgEnum("shortlist_item_status", ["active", "archived"]);
export const consentItemStatus = pgEnum("consent_item_status", ["pending", "approved", "declined", "revoked", "expired"]);
export const consentEventType = pgEnum("consent_event_type", ["requested", "approved", "declined", "revoked", "expired"]);
export const screeningStatus = pgEnum("screening_status", ["pending", "approved", "in_progress", "completed", "failed"]);
export const notificationType = pgEnum("notification_type", ["consent_requested", "consent_updated", "screening_completed", "message_received", "system"]);
export const conversationStatus = pgEnum("conversation_status", ["active", "read_only", "blocked"]);
export const attachmentScanStatus = pgEnum("attachment_scan_status", ["not_applicable", "pending", "clean", "quarantined"]);
export const messageReportStatus = pgEnum("message_report_status", ["open", "reviewing", "resolved", "dismissed"]);
export const recruiterProvisioningStatus = pgEnum("recruiter_provisioning_status", ["pending", "active", "rejected", "revision_required"]);
export const companyVerificationStatus = pgEnum("company_verification_status", [
  "pending",
  "approved",
  "need_revision",
  "rejected",
  "suspended",
]);
export const industrySector = pgEnum("industry_sector", [
  "Technology",
  "Financial Services",
  "Hospitality",
  "Retail",
  "Manufacturing",
  "Education",
  "Healthcare",
  "Logistics",
  "Professional Services",
  "Other",
]);
export const companyScale = pgEnum("company_scale", [
  "1-10 Karyawan",
  "11-50 Karyawan",
  "51-200 Karyawan",
  "201-500 Karyawan",
  "500+ Karyawan",
]);
export const subscriptionTier = pgEnum("subscription_tier", [
  "trial",
  "starter",
  "professional",
  "enterprise",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "expired",
  "suspended",
]);
export const tokenLedgerEntryType = pgEnum("token_ledger_entry_type", ["grant", "charge", "refund"]);
export const tokenPurchaseStatus = pgEnum("token_purchase_status", ["pending", "paid", "failed", "refunded"]);
export const notificationDeliveryChannel = pgEnum("notification_delivery_channel", ["email", "in_app"]);
export const notificationDeliveryStatus = pgEnum("notification_delivery_status", ["pending", "sent", "failed"]);
export const paymentEventStatus = pgEnum("payment_event_status", ["processed", "ignored", "failed"]);
export const candidateDocumentKind = pgEnum("candidate_document_kind", ["cv"]);
export const candidateDocumentStatus = pgEnum("candidate_document_status", ["uploaded", "processing", "ready", "failed", "deleted"]);
export const cvDocumentStatus = pgEnum("cv_document_status", ["uploaded", "processing", "review", "approved", "rejected", "deleted"]);
export const cvVersionTemplate = pgEnum("cv_version_template", ["ats", "creative"]);
export const candidateVerificationType = pgEnum("candidate_verification_type", [
  "identity",
  "email",
  "phone",
  "education",
  "employment",
  "certification",
  "portfolio",
]);
export const candidateVerificationStatus = pgEnum("candidate_verification_status", [
  "pending",
  "verified",
  "expired",
  "revoked",
  "disputed",
]);
export const jobStatus = pgEnum("job_status", ["draft", "published", "closed", "archived"]);
export const employmentType = pgEnum("employment_type", ["full_time", "part_time", "contract", "internship", "temporary"]);
export const workArrangement = pgEnum("work_arrangement", ["onsite", "hybrid", "remote"]);
export const jobRequirementType = pgEnum("job_requirement_type", ["required", "preferred"]);
export const applicationStatus = pgEnum("application_status", [
  "new",
  "shortlisted",
  "consent_requested",
  "consent_approved",
  "screening",
  "assessment",
  "review",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
]);
export const applicationSource = pgEnum("application_source", ["candidate", "recruiter_invitation"]);
export const assessmentQuestionType = pgEnum("assessment_question_type", [
  "multiple_choice",
  "free_text",
  "situational",
  "structured_response",
]);
export const assessmentInvitationStatus = pgEnum("assessment_invitation_status", [
  "pending",
  "started",
  "submitted",
  "expired",
  "revoked",
]);
export const assessmentAttemptStatus = pgEnum("assessment_attempt_status", ["in_progress", "submitted", "expired", "abandoned"]);
export const assessmentReviewStatus = pgEnum("assessment_review_status", ["pending", "in_review", "completed", "disputed"]);
export const interviewStatus = pgEnum("interview_status", ["scheduled", "completed", "cancelled", "rescheduled"]);
export const interviewEventType = pgEnum("interview_event_type", ["created", "updated", "reminder_sent", "cancelled", "rescheduled", "completed"]);
export const interviewPanelRole = pgEnum("interview_panel_role", ["interviewer", "observer", "coordinator"]);
export const interviewFeedbackRecommendation = pgEnum("interview_feedback_recommendation", ["strong_yes", "yes", "mixed", "no", "strong_no"]);
export const offerStatus = pgEnum("offer_status", ["draft", "sent", "accepted", "declined", "withdrawn", "expired"]);
export const applicationOutcomeType = pgEnum("application_outcome_type", ["hired", "rejected", "withdrawn", "offer_accepted", "offer_declined"]);
export const assignmentRole = pgEnum("assignment_role", ["recruiter", "hiring_manager"]);
export const searchAlertFrequency = pgEnum("search_alert_frequency", ["daily", "weekly"]);
export const searchAnalyticsEventType = pgEnum("search_analytics_event_type", ["search", "view_result", "save_search", "apply_filter"]);
export const screeningEvaluationType = pgEnum("screening_evaluation_type", ["automated", "human"]);

export const users = pgTable("users", {
  id: id(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  role: userRole("role").notNull(),
  recruiterProvisioningStatus: recruiterProvisioningStatus("recruiter_provisioning_status").notNull().default("pending"),
  recruiterRejectionReason: text("recruiter_rejection_reason"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("users_role_idx").on(table.role),
  index("users_role_provisioning_status_idx").on(table.role, table.recruiterProvisioningStatus),
]);

export const profiles = pgTable("profiles", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  // Legalitas
  nib: text("nib").unique(),
  npwp: text("npwp").unique(),
  // Informasi Bisnis
  industry: industrySector("industry"),
  companyScale: companyScale("company_scale"),
  province: text("province"),
  city: text("city"),
  officeAddress: text("office_address"),
  companyEmail: text("company_email"),
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  description: text("description"),
  // Informasi Verifikasi Admin
  verificationStatus: companyVerificationStatus("verification_status").notNull().default("pending"),
  verificationNotes: text("verification_notes"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  // Informasi Langganan
  subscriptionTier: subscriptionTier("subscription_tier").notNull().default("trial"),
  subscriptionStatus: subscriptionStatus("subscription_status").notNull().default("active"),
  subscriptionStartDate: timestamp("subscription_start_date", { withTimezone: true }),
  subscriptionEndDate: timestamp("subscription_end_date", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("organizations_created_by_idx").on(table.createdBy),
  index("organizations_verification_status_idx").on(table.verificationStatus),
  index("organizations_subscription_status_idx").on(table.subscriptionStatus),
]);

export const organizationMembers = pgTable("organization_members", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: organizationMemberRole("role").notNull().default("recruiter"),
  createdAt: createdAt(),
}, (table) => [
  unique("organization_members_org_user_unique").on(table.organizationId, table.userId),
  index("organization_members_user_idx").on(table.userId),
]);

export const candidateProfiles = pgTable("candidate_profiles", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  targetRole: text("target_role"),
  location: text("location"),
  summary: text("summary"),
  isPublished: boolean("is_published").notNull().default(false),
  completeness: integer("completeness").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [check("candidate_profiles_completeness_check", sql`${table.completeness} between 0 and 100`)]);

export const candidateProfileSections = pgTable("candidate_profile_sections", {
  id: id(),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "cascade" }),
  type: profileSectionType("type").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique("candidate_profile_sections_profile_type_unique").on(table.candidateProfileId, table.type),
  index("candidate_profile_sections_profile_idx").on(table.candidateProfileId),
]);

export const shortlists = pgTable("shortlists", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique("shortlists_organization_name_unique").on(table.organizationId, table.name),
  index("shortlists_organization_idx").on(table.organizationId),
  index("shortlists_created_by_idx").on(table.createdBy),
]);

export const shortlistItems = pgTable("shortlist_items", {
  id: id(),
  shortlistId: uuid("shortlist_id").notNull().references(() => shortlists.id, { onDelete: "cascade" }),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "cascade" }),
  status: shortlistItemStatus("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique("shortlist_items_shortlist_candidate_unique").on(table.shortlistId, table.candidateProfileId),
  index("shortlist_items_candidate_idx").on(table.candidateProfileId),
]);

export const consentRequestBatches = pgTable("consent_request_batches", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  purpose: text("purpose").notNull(),
  message: text("message"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  index("consent_request_batches_organization_idx").on(table.organizationId),
  index("consent_request_batches_requested_by_idx").on(table.requestedBy),
]);

export const consentRequestItems = pgTable("consent_request_items", {
  id: id(),
  batchId: uuid("batch_id").notNull().references(() => consentRequestBatches.id, { onDelete: "cascade" }),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "cascade" }),
  status: consentItemStatus("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique("consent_request_items_batch_candidate_unique").on(table.batchId, table.candidateProfileId),
  index("consent_request_items_batch_idx").on(table.batchId),
  index("consent_request_items_candidate_status_idx").on(table.candidateProfileId, table.status),
]);

export const consentEvents = pgTable("consent_events", {
  id: id(),
  consentRequestItemId: uuid("consent_request_item_id").notNull().references(() => consentRequestItems.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  type: consentEventType("type").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (table) => [
  index("consent_events_item_created_idx").on(table.consentRequestItemId, table.createdAt),
  index("consent_events_actor_idx").on(table.actorUserId),
]);

export const screeningRuns = pgTable("screening_runs", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id),
  consentRequestItemId: uuid("consent_request_item_id").notNull().references(() => consentRequestItems.id),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  status: screeningStatus("status").notNull().default("pending"),
  tokenCost: integer("token_cost").notNull().default(1),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: createdAt(),
}, (table) => [
  check("screening_runs_token_cost_check", sql`${table.tokenCost} > 0`),
  index("screening_runs_org_candidate_idx").on(table.organizationId, table.candidateProfileId),
  index("screening_runs_candidate_idx").on(table.candidateProfileId),
  index("screening_runs_consent_item_idx").on(table.consentRequestItemId),
  index("screening_runs_requested_by_idx").on(table.requestedBy),
]);

export const screeningScores = pgTable("screening_scores", {
  id: id(),
  screeningRunId: uuid("screening_run_id").notNull().unique().references(() => screeningRuns.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  label: text("label").notNull(),
  coverage: integer("coverage").notNull(),
  evidence: jsonb("evidence").$type<unknown[]>().notNull().default([]),
  limitations: jsonb("limitations").$type<string[]>().notNull().default([]),
  source: text("source").notNull(),
  modelVersion: text("model_version").notNull(),
  createdAt: createdAt(),
}, (table) => [
  check("screening_scores_score_check", sql`${table.score} between 0 and 100`),
  check("screening_scores_coverage_check", sql`${table.coverage} between 0 and 100`),
]);

export const notifications = pgTable("notifications", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationType("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [index("notifications_user_read_created_idx").on(table.userId, table.readAt, table.createdAt)]);

export const conversations = pgTable("conversations", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  consentRequestItemId: uuid("consent_request_item_id").references(() => consentRequestItems.id, { onDelete: "set null" }),
  retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }),
  status: conversationStatus("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("conversations_organization_idx").on(table.organizationId),
  index("conversations_created_by_idx").on(table.createdBy),
]);

export const conversationParticipants = pgTable("conversation_participants", {
  id: id(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: createdAt(),
  leftAt: timestamp("left_at", { withTimezone: true }),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
}, (table) => [
  unique("conversation_participants_conversation_user_unique").on(table.conversationId, table.userId),
  index("conversation_participants_user_idx").on(table.userId),
]);

export const messages = pgTable("messages", {
  id: id(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: createdAt(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  attachmentName: text("attachment_name"),
  attachmentMimeType: text("attachment_mime_type"),
  attachmentSize: integer("attachment_size"),
  attachmentStoragePath: text("attachment_storage_path"),
  attachmentScanStatus: attachmentScanStatus("attachment_scan_status").notNull().default("not_applicable"),
}, (table) => [
  index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
  index("messages_sender_idx").on(table.senderId),
]);

export const tokenAccounts = pgTable("token_accounts", {
  id: id(),
  organizationId: uuid("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("token_accounts_balance_check", sql`${table.balance} >= 0`),
]);

export const tokenLedgerEntries = pgTable("token_ledger_entries", {
  id: id(),
  tokenAccountId: uuid("token_account_id").notNull().references(() => tokenAccounts.id, { onDelete: "cascade" }),
  type: tokenLedgerEntryType("type").notNull(),
  amount: integer("amount").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  screeningRunId: uuid("screening_run_id").unique().references(() => screeningRuns.id, { onDelete: "restrict" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (table) => [
  check("token_ledger_entries_amount_check", sql`${table.amount} <> 0`),
  check(
    "token_ledger_entries_charge_amount_check",
    sql`${table.type} <> 'charge' or ${table.amount} < 0`,
  ),
  check(
    "token_ledger_entries_grant_refund_amount_check",
    sql`${table.type} = 'charge' or ${table.amount} > 0`,
  ),
  index("token_ledger_entries_account_created_idx").on(table.tokenAccountId, table.createdAt),
  index("token_ledger_entries_screening_run_idx").on(table.screeningRunId),
]);

export const messageReports = pgTable("message_reports", {
  id: id(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  reporterId: uuid("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: messageReportStatus("status").notNull().default("open"),
  createdAt: createdAt(),
}, (table) => [
  index("message_reports_conversation_idx").on(table.conversationId),
  index("message_reports_reporter_idx").on(table.reporterId),
]);

export const jobs = pgTable("jobs", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: jobStatus("status").notNull().default("draft"),
  employmentType: employmentType("employment_type").notNull(),
  workArrangement: workArrangement("work_arrangement").notNull(),
  location: text("location"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("jobs_organization_status_idx").on(table.organizationId, table.status),
  index("jobs_created_by_idx").on(table.createdBy),
]);

export const jobRequirements = pgTable("job_requirements", {
  id: id(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  type: jobRequirementType("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  minimumExperienceMonths: integer("minimum_experience_months"),
  createdAt: createdAt(),
}, (table) => [
  check("job_requirements_minimum_experience_check", sql`${table.minimumExperienceMonths} is null or ${table.minimumExperienceMonths} >= 0`),
  index("job_requirements_job_idx").on(table.jobId),
  index("job_requirements_job_type_idx").on(table.jobId, table.type),
]);

export const applications = pgTable("applications", {
  id: id(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "restrict" }),
  status: applicationStatus("status").notNull().default("new"),
  source: applicationSource("source").notNull().default("candidate"),
  coverNote: text("cover_note"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique("applications_job_candidate_unique").on(table.jobId, table.candidateProfileId),
  index("applications_job_status_idx").on(table.jobId, table.status),
  index("applications_candidate_status_idx").on(table.candidateProfileId, table.status),
]);

export const applicationStageHistory = pgTable("application_stage_history", {
  id: id(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  fromStatus: applicationStatus("from_status"),
  toStatus: applicationStatus("to_status").notNull(),
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: createdAt(),
}, (table) => [
  index("application_stage_history_application_created_idx").on(table.applicationId, table.createdAt),
  index("application_stage_history_changed_by_idx").on(table.changedBy),
]);

export const assessmentTemplates = pgTable("assessment_templates", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  timeLimitMinutes: integer("time_limit_minutes"),
  attemptLimit: integer("attempt_limit").notNull().default(1),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("assessment_templates_time_limit_check", sql`${table.timeLimitMinutes} is null or ${table.timeLimitMinutes} > 0`),
  check("assessment_templates_attempt_limit_check", sql`${table.attemptLimit} > 0`),
  index("assessment_templates_organization_idx").on(table.organizationId),
  index("assessment_templates_created_by_idx").on(table.createdBy),
]);

export const assessmentQuestions = pgTable("assessment_questions", {
  id: id(),
  assessmentTemplateId: uuid("assessment_template_id").notNull().references(() => assessmentTemplates.id, { onDelete: "cascade" }),
  type: assessmentQuestionType("type").notNull(),
  prompt: text("prompt").notNull(),
  options: jsonb("options").$type<unknown[]>().notNull().default([]),
  responseSchema: jsonb("response_schema").$type<Record<string, unknown>>().notNull().default({}),
  isRequired: boolean("is_required").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
}, (table) => [
  index("assessment_questions_template_idx").on(table.assessmentTemplateId),
  unique("assessment_questions_template_order_unique").on(table.assessmentTemplateId, table.sortOrder),
]);

export const assessmentInvitations = pgTable("assessment_invitations", {
  id: id(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  assessmentTemplateId: uuid("assessment_template_id").notNull().references(() => assessmentTemplates.id, { onDelete: "restrict" }),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "restrict" }),
  invitedBy: uuid("invited_by").notNull().references(() => users.id),
  status: assessmentInvitationStatus("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("assessment_invitations_application_idx").on(table.applicationId),
  index("assessment_invitations_candidate_status_idx").on(table.candidateProfileId, table.status),
  index("assessment_invitations_template_idx").on(table.assessmentTemplateId),
  index("assessment_invitations_invited_by_idx").on(table.invitedBy),
]);

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: id(),
  invitationId: uuid("invitation_id").notNull().references(() => assessmentInvitations.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull(),
  status: assessmentAttemptStatus("status").notNull().default("in_progress"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("assessment_attempts_attempt_number_check", sql`${table.attemptNumber} > 0`),
  unique("assessment_attempts_invitation_number_unique").on(table.invitationId, table.attemptNumber),
  index("assessment_attempts_invitation_status_idx").on(table.invitationId, table.status),
]);

export const assessmentAnswers = pgTable("assessment_answers", {
  id: id(),
  attemptId: uuid("attempt_id").notNull().references(() => assessmentAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => assessmentQuestions.id, { onDelete: "restrict" }),
  response: jsonb("response").$type<unknown>().notNull().default(null),
  savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
}, (table) => [
  unique("assessment_answers_attempt_question_unique").on(table.attemptId, table.questionId),
  index("assessment_answers_attempt_idx").on(table.attemptId),
  index("assessment_answers_question_idx").on(table.questionId),
]);

export const assessmentReviews = pgTable("assessment_reviews", {
  id: id(),
  attemptId: uuid("attempt_id").notNull().unique().references(() => assessmentAttempts.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id),
  status: assessmentReviewStatus("status").notNull().default("pending"),
  score: integer("score"),
  dimensionScores: jsonb("dimension_scores").$type<Record<string, unknown>>().notNull().default({}),
  notes: text("notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("assessment_reviews_score_check", sql`${table.score} is null or ${table.score} between 0 and 100`),
  index("assessment_reviews_attempt_idx").on(table.attemptId),
  index("assessment_reviews_reviewer_idx").on(table.reviewerId),
  index("assessment_reviews_status_idx").on(table.status),
]);

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (table) => [
  index("audit_logs_actor_created_idx").on(table.actorUserId, table.createdAt),
  index("audit_logs_organization_created_idx").on(table.organizationId, table.createdAt),
  index("audit_logs_entity_created_idx").on(table.entityType, table.entityId, table.createdAt),
]);

export const billingAccounts = pgTable("billing_accounts", {
  id: id(),
  organizationId: uuid("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }),
  billingOwnerId: uuid("billing_owner_id").references(() => users.id, { onDelete: "set null" }),
  spendLimit: integer("spend_limit"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("billing_accounts_spend_limit_check", sql`${table.spendLimit} is null or ${table.spendLimit} >= 0`),
  index("billing_accounts_billing_owner_idx").on(table.billingOwnerId),
]);

export const tokenPackages = pgTable("token_packages", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  tokenAmount: integer("token_amount").notNull(),
  priceMinor: integer("price_minor").notNull(),
  currency: text("currency").notNull(),
  active: boolean("active").notNull().default(true),
  validityDays: integer("validity_days"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("token_packages_token_amount_check", sql`${table.tokenAmount} > 0`),
  check("token_packages_price_minor_check", sql`${table.priceMinor} >= 0`),
  check("token_packages_validity_days_check", sql`${table.validityDays} is null or ${table.validityDays} > 0`),
  index("token_packages_active_idx").on(table.active),
]);

export const tokenPurchases = pgTable("token_purchases", {
  id: id(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  packageId: uuid("package_id").notNull().references(() => tokenPackages.id, { onDelete: "restrict" }),
  purchasedBy: uuid("purchased_by").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  providerReference: text("provider_reference").unique(),
  status: tokenPurchaseStatus("status").notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  tokenAmount: integer("token_amount").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("token_purchases_amount_minor_check", sql`${table.amountMinor} >= 0`),
  check("token_purchases_token_amount_check", sql`${table.tokenAmount} > 0`),
  index("token_purchases_organization_status_idx").on(table.organizationId, table.status),
  index("token_purchases_package_idx").on(table.packageId),
  index("token_purchases_provider_reference_idx").on(table.provider, table.providerReference),
  index("token_purchases_purchased_by_idx").on(table.purchasedBy),
]);

export const paymentEvents = pgTable("payment_events", {
  id: id(),
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull().unique(),
  type: text("type").notNull(),
  status: paymentEventStatus("status").notNull().default("processed"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  index("payment_events_provider_event_idx").on(table.provider, table.eventId),
]);

export const notificationPreferences = pgTable("notification_preferences", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  inAppEnabled: boolean("in_app_enabled").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  quietHours: jsonb("quiet_hours").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: id(),
  notificationId: uuid("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  channel: notificationDeliveryChannel("channel").notNull(),
  status: notificationDeliveryStatus("status").notNull().default("pending"),
  attemptCount: integer("attempt_count").notNull().default(0),
  providerMessageId: text("provider_message_id"),
  lastError: text("last_error"),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  dedupeKey: text("dedupe_key").notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("notification_deliveries_attempt_count_check", sql`${table.attemptCount} >= 0`),
  index("notification_deliveries_notification_status_idx").on(table.notificationId, table.status),
]);

export const candidateDocuments = pgTable("candidate_documents", {
  id: id(),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "cascade" }),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: candidateDocumentKind("kind").notNull(),
  storagePath: text("storage_path").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  sha256: text("sha256").notNull(),
  status: candidateDocumentStatus("status").notNull().default("uploaded"),
  extractionConfidence: integer("extraction_confidence"),
  extractedData: jsonb("extracted_data").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("candidate_documents_owner_status_idx").on(table.ownerUserId, table.status),
  index("candidate_documents_profile_idx").on(table.candidateProfileId),
  check("candidate_documents_byte_size_check", sql`${table.byteSize} >= 0`),
  check("candidate_documents_extraction_confidence_check", sql`${table.extractionConfidence} is null or ${table.extractionConfidence} between 0 and 100`),
]);

export const cvDocuments = pgTable("cv_documents", {
  id: id(),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  originalFileName: text("original_file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256"),
  status: cvDocumentStatus("status").notNull().default("uploaded"),
  pageCount: integer("page_count"),
  extractionConfidence: integer("extraction_confidence"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  check("cv_documents_size_bytes_check", sql`${table.sizeBytes} > 0`),
  check("cv_documents_page_count_check", sql`${table.pageCount} is null or ${table.pageCount} > 0`),
  check("cv_documents_extraction_confidence_check", sql`${table.extractionConfidence} is null or ${table.extractionConfidence} between 0 and 100`),
  index("cv_documents_candidate_status_idx").on(table.candidateProfileId, table.status),
]);

export const cvVersions = pgTable("cv_versions", {
  id: id(),
  cvDocumentId: uuid("cv_document_id").notNull().references(() => cvDocuments.id, { onDelete: "cascade" }),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  template: cvVersionTemplate("template").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (table) => [
  check("cv_versions_version_number_check", sql`${table.versionNumber} > 0`),
  unique("cv_versions_document_version_template_unique").on(table.cvDocumentId, table.versionNumber, table.template),
  index("cv_versions_document_idx").on(table.cvDocumentId),
  index("cv_versions_candidate_idx").on(table.candidateProfileId),
]);

export const candidateVerifications = pgTable("candidate_verifications", {
  id: id(),
  candidateProfileId: uuid("candidate_profile_id").notNull().references(() => candidateProfiles.id, { onDelete: "cascade" }),
  type: candidateVerificationType("type").notNull(),
  status: candidateVerificationStatus("status").notNull().default("pending"),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
  provider: text("provider"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  disputeReason: text("dispute_reason"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("candidate_verifications_profile_type_status_idx").on(table.candidateProfileId, table.type, table.status),
]);

export const interviews = pgTable("interviews", {
  id: id(), applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id), title: text("title").notNull(),
  status: interviewStatus("status").notNull().default("scheduled"), scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes"), timezone: text("timezone"), meetingUrl: text("meeting_url"),
  reminderMetadata: jsonb("reminder_metadata").$type<Record<string, unknown>>().notNull().default({}), cancellationMetadata: jsonb("cancellation_metadata").$type<Record<string, unknown>>().notNull().default({}), rescheduleMetadata: jsonb("reschedule_metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [check("interviews_duration_minutes_check", sql`${table.durationMinutes} is null or ${table.durationMinutes} > 0`), index("interviews_application_scheduled_idx").on(table.applicationId, table.scheduledAt), index("interviews_organization_status_idx").on(table.organizationId, table.status)]);

export const interviewEvents = pgTable("interview_events", {
  id: id(), interviewId: uuid("interview_id").notNull().references(() => interviews.id, { onDelete: "cascade" }), actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }), type: interviewEventType("type").notNull(), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(), createdAt: createdAt(),
}, (table) => [index("interview_events_interview_occurred_idx").on(table.interviewId, table.occurredAt)]);

export const interviewPanelMembers = pgTable("interview_panel_members", {
  id: id(), interviewId: uuid("interview_id").notNull().references(() => interviews.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), role: interviewPanelRole("role").notNull().default("interviewer"), createdAt: createdAt(),
}, (table) => [unique("interview_panel_members_interview_user_unique").on(table.interviewId, table.userId), index("interview_panel_members_user_idx").on(table.userId)]);

export const interviewScorecards = pgTable("interview_scorecards", {
  id: id(), interviewId: uuid("interview_id").notNull().references(() => interviews.id, { onDelete: "cascade" }), panelMemberId: uuid("panel_member_id").notNull().references(() => interviewPanelMembers.id, { onDelete: "cascade" }), criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull().default({}), submittedAt: timestamp("submitted_at", { withTimezone: true }), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [unique("interview_scorecards_interview_panel_unique").on(table.interviewId, table.panelMemberId)]);

export const interviewFeedback = pgTable("interview_feedback", {
  id: id(), scorecardId: uuid("scorecard_id").notNull().unique().references(() => interviewScorecards.id, { onDelete: "cascade" }), recommendation: interviewFeedbackRecommendation("recommendation"), overallScore: integer("overall_score"), comments: text("comments"), ratings: jsonb("ratings").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [check("interview_feedback_overall_score_check", sql`${table.overallScore} is null or ${table.overallScore} between 0 and 100`)]);

export const offers = pgTable("offers", {
  id: id(), applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), createdBy: uuid("created_by").notNull().references(() => users.id), status: offerStatus("status").notNull().default("draft"), expiresAt: timestamp("expires_at", { withTimezone: true }), sentAt: timestamp("sent_at", { withTimezone: true }), respondedAt: timestamp("responded_at", { withTimezone: true }), terms: jsonb("terms").$type<Record<string, unknown>>().notNull().default({}), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index("offers_application_status_idx").on(table.applicationId, table.status), index("offers_organization_status_idx").on(table.organizationId, table.status)]);

export const applicationOutcomes = pgTable("application_outcomes", {
  id: id(), applicationId: uuid("application_id").notNull().unique().references(() => applications.id, { onDelete: "cascade" }), type: applicationOutcomeType("type").notNull(), decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }), reason: text("reason"), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), decidedAt: timestamp("decided_at", { withTimezone: true }).defaultNow().notNull(), createdAt: createdAt(),
}, (table) => [index("application_outcomes_type_idx").on(table.type)]);

export const applicationAssignments = pgTable("application_assignments", {
  id: id(), applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), role: assignmentRole("role").notNull(), assignedBy: uuid("assigned_by").notNull().references(() => users.id), assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(),
}, (table) => [unique("application_assignments_application_role_unique").on(table.applicationId, table.role), index("application_assignments_user_role_idx").on(table.userId, table.role)]);

export const jobStageSlas = pgTable("job_stage_slas", {
  id: id(), jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }), stage: applicationStatus("stage").notNull(), dueAfterHours: integer("due_after_hours").notNull(), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [check("job_stage_slas_due_after_hours_check", sql`${table.dueAfterHours} > 0`), unique("job_stage_slas_job_stage_unique").on(table.jobId, table.stage)]);

export const applicationStageDueDates = pgTable("application_stage_due_dates", {
  id: id(), applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }), stage: applicationStatus("stage").notNull(), dueAt: timestamp("due_at", { withTimezone: true }).notNull(), completedAt: timestamp("completed_at", { withTimezone: true }), slaHours: integer("sla_hours"), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(),
}, (table) => [unique("application_stage_due_dates_application_stage_unique").on(table.applicationId, table.stage), index("application_stage_due_dates_due_idx").on(table.dueAt, table.completedAt)]);

export const savedSearches = pgTable("saved_searches", {
  id: id(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), createdBy: uuid("created_by").notNull().references(() => users.id), name: text("name").notNull(), query: text("query"), filters: jsonb("filters").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [unique("saved_searches_organization_name_unique").on(table.organizationId, table.name), index("saved_searches_created_by_idx").on(table.createdBy)]);

export const searchAlerts = pgTable("search_alerts", {
  id: id(), savedSearchId: uuid("saved_search_id").notNull().references(() => savedSearches.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), frequency: searchAlertFrequency("frequency").notNull().default("weekly"), enabled: boolean("enabled").notNull().default(true), lastSentAt: timestamp("last_sent_at", { withTimezone: true }), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [unique("search_alerts_saved_search_user_unique").on(table.savedSearchId, table.userId), index("search_alerts_enabled_idx").on(table.enabled, table.frequency)]);

export const skillAliases = pgTable("skill_aliases", {
  id: id(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), canonicalSkill: text("canonical_skill").notNull(), alias: text("alias").notNull(), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [unique("skill_aliases_organization_alias_unique").on(table.organizationId, table.alias), index("skill_aliases_canonical_idx").on(table.organizationId, table.canonicalSkill)]);

export const searchAnalytics = pgTable("search_analytics", {
  id: id(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), savedSearchId: uuid("saved_search_id").references(() => savedSearches.id, { onDelete: "set null" }), eventType: searchAnalyticsEventType("event_type").notNull(), query: text("query"), resultCount: integer("result_count"), metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(),
}, (table) => [index("search_analytics_organization_created_idx").on(table.organizationId, table.createdAt), index("search_analytics_saved_search_idx").on(table.savedSearchId)]);

export const screeningGovernanceVersions = pgTable("screening_governance_versions", {
  id: id(), organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }), version: integer("version").notNull(), policy: jsonb("policy").$type<Record<string, unknown>>().notNull().default({}), publishedAt: timestamp("published_at", { withTimezone: true }), createdBy: uuid("created_by").notNull().references(() => users.id), createdAt: createdAt(),
}, (table) => [unique("screening_governance_versions_org_version_unique").on(table.organizationId, table.version), index("screening_governance_versions_org_published_idx").on(table.organizationId, table.publishedAt)]);

export const screeningGovernanceSnapshots = pgTable("screening_governance_snapshots", {
  id: id(), screeningRunId: uuid("screening_run_id").notNull().unique().references(() => screeningRuns.id, { onDelete: "cascade" }), governanceVersionId: uuid("governance_version_id").notNull().references(() => screeningGovernanceVersions.id, { onDelete: "restrict" }), policy: jsonb("policy").$type<Record<string, unknown>>().notNull().default({}), createdAt: createdAt(),
}, (table) => [index("screening_governance_snapshots_version_idx").on(table.governanceVersionId)]);

export const screeningEvaluations = pgTable("screening_evaluations", {
  id: id(), screeningRunId: uuid("screening_run_id").notNull().references(() => screeningRuns.id, { onDelete: "cascade" }), evaluatedBy: uuid("evaluated_by").references(() => users.id, { onDelete: "set null" }), type: screeningEvaluationType("type").notNull(), result: jsonb("result").$type<Record<string, unknown>>().notNull().default({}), evidence: jsonb("evidence").$type<unknown[]>().notNull().default([]), createdAt: createdAt(),
}, (table) => [index("screening_evaluations_run_type_idx").on(table.screeningRunId, table.type)]);

export const screeningRunTelemetry = pgTable("screening_run_telemetry", {
  id: id(), screeningRunId: uuid("screening_run_id").notNull().unique().references(() => screeningRuns.id, { onDelete: "cascade" }), providerCostMinor: integer("provider_cost_minor"), latencyMs: integer("latency_ms"), retryCount: integer("retry_count").notNull().default(0), providerMetadata: jsonb("provider_metadata").$type<Record<string, unknown>>().notNull().default({}), lastError: text("last_error"), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [check("screening_run_telemetry_provider_cost_check", sql`${table.providerCostMinor} is null or ${table.providerCostMinor} >= 0`), check("screening_run_telemetry_latency_check", sql`${table.latencyMs} is null or ${table.latencyMs} >= 0`), check("screening_run_telemetry_retry_count_check", sql`${table.retryCount} >= 0`)]);

export const schema = {
  users,
  profiles,
  organizations,
  organizationMembers,
  candidateProfiles,
  candidateProfileSections,
  shortlists,
  shortlistItems,
  consentRequestBatches,
  consentRequestItems,
  consentEvents,
  screeningRuns,
  screeningScores,
  notifications,
  conversations,
  conversationParticipants,
  messages,
  messageReports,
  tokenAccounts,
  tokenLedgerEntries,
  auditLogs,
  billingAccounts,
  tokenPackages,
  tokenPurchases,
  paymentEvents,
  notificationPreferences,
  notificationDeliveries,
  candidateDocuments,
  cvDocuments,
  cvVersions,
  candidateVerifications,
  jobs,
  jobRequirements,
  applications,
  applicationStageHistory,
  assessmentTemplates,
  assessmentQuestions,
  assessmentInvitations,
  assessmentAttempts,
  assessmentAnswers,
  assessmentReviews,
  interviews,
  interviewEvents,
  interviewPanelMembers,
  interviewScorecards,
  interviewFeedback,
  offers,
  applicationOutcomes,
  applicationAssignments,
  jobStageSlas,
  applicationStageDueDates,
  savedSearches,
  searchAlerts,
  skillAliases,
  searchAnalytics,
  screeningGovernanceVersions,
  screeningGovernanceSnapshots,
  screeningEvaluations,
  screeningRunTelemetry,
};
