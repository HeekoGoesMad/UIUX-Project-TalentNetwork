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

export const userRole = pgEnum("user_role", ["candidate", "recruiter", "admin"]);
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
export const recruiterProvisioningStatus = pgEnum("recruiter_provisioning_status", ["pending", "active", "rejected"]);
export const tokenLedgerEntryType = pgEnum("token_ledger_entry_type", ["grant", "charge", "refund"]);
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

export const users = pgTable("users", {
  id: id(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  role: userRole("role").notNull(),
  recruiterProvisioningStatus: recruiterProvisioningStatus("recruiter_provisioning_status").notNull().default("pending"),
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
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("organizations_created_by_idx").on(table.createdBy)]);

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
  index("token_ledger_entries_account_created_idx").on(table.tokenAccountId, table.createdAt),
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
  tokenAccounts,
  tokenLedgerEntries,
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
};
