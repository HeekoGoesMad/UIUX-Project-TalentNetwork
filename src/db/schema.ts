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
};
