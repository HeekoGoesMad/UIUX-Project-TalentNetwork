# Entity-Relationship Diagram — TalentNetwork

> Generated-from-code snapshot, 2026-09-07. Source of truth is `src/db/schema.ts`; refresh this file when the schema changes.
> Mermaid syntax reviewed by hand only (no renderer available).

```mermaid
erDiagram
    users {
        uuid id PK
        uuid auth_user_id "FK,UK: supabase auth.users"
        text email UK
        user_role role
        recruiter_provisioning_status recruiter_provisioning_status
        text recruiter_rejection_reason
        timestamptz created_at
        timestamptz updated_at
    }
    profiles {
        uuid id PK
        uuid user_id "FK,UK"
        text display_name
        text avatar_url
        text phone
        timestamptz created_at
        timestamptz updated_at
    }
    organizations {
        uuid id PK
        text name
        text slug UK
        uuid created_by FK
        text nib UK
        text npwp UK
        industry_sector industry
        company_scale company_scale
        text province
        text city
        text office_address
        text company_email
        text website
        text linkedin_url
        text description
        company_verification_status verification_status
        text verification_notes
        uuid reviewed_by FK
        timestamptz reviewed_at
        subscription_tier subscription_tier
        subscription_status subscription_status
        timestamptz subscription_start_date
        timestamptz subscription_end_date
        timestamptz created_at
        timestamptz updated_at
    }
    organization_members {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        organization_member_role role
        timestamptz created_at
    }
    candidate_profiles {
        uuid id PK
        uuid user_id "FK,UK"
        text headline
        text target_role
        text location
        text summary
        bool is_published
        int completeness
        timestamptz created_at
        timestamptz updated_at
    }
    candidate_profile_sections {
        uuid id PK
        uuid candidate_profile_id FK
        profile_section_type type
        jsonb content
        int sort_order
        timestamptz created_at
        timestamptz updated_at
    }
    shortlists {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        text name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    shortlist_items {
        uuid id PK
        uuid shortlist_id FK
        uuid candidate_profile_id FK
        shortlist_item_status status
        text notes
        timestamptz created_at
        timestamptz updated_at
    }
    consent_request_batches {
        uuid id PK
        uuid organization_id FK
        uuid requested_by FK
        text purpose
        text message
        timestamptz expires_at
        timestamptz created_at
    }
    consent_request_items {
        uuid id PK
        uuid batch_id FK
        uuid candidate_profile_id FK
        consent_item_status status
        timestamptz responded_at
        timestamptz created_at
        timestamptz updated_at
    }
    consent_events {
        uuid id PK
        uuid consent_request_item_id FK
        uuid actor_user_id FK
        consent_event_type type
        jsonb metadata
        timestamptz created_at
    }
    screening_runs {
        uuid id PK
        uuid organization_id FK
        uuid candidate_profile_id FK
        uuid consent_request_item_id FK
        uuid requested_by FK
        screening_status status
        int token_cost
        timestamptz started_at
        timestamptz completed_at
        text error_message
        timestamptz created_at
    }
    screening_scores {
        uuid id PK
        uuid screening_run_id "FK,UK"
        int score
        text label
        int coverage
        jsonb evidence
        jsonb limitations
        text source
        text model_version
        timestamptz created_at
    }
    notifications {
        uuid id PK
        uuid user_id FK
        notification_type type
        text title
        text body
        jsonb data
        timestamptz read_at
        timestamptz created_at
    }
    conversations {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        uuid consent_request_item_id FK
        timestamptz retention_expires_at
        conversation_status status
        timestamptz created_at
        timestamptz updated_at
    }
    conversation_participants {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
        timestamptz joined_at
        timestamptz left_at
        timestamptz last_read_at
    }
    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text body
        timestamptz created_at
        timestamptz edited_at
        timestamptz deleted_at
        text attachment_name
        text attachment_mime_type
        int attachment_size
        text attachment_storage_path
        attachment_scan_status attachment_scan_status
    }
    message_reports {
        uuid id PK
        uuid conversation_id FK
        uuid message_id FK
        uuid reporter_id FK
        text reason
        message_report_status status
        timestamptz created_at
    }
    token_accounts {
        uuid id PK
        uuid organization_id "FK,UK"
        int balance
        timestamptz created_at
        timestamptz updated_at
    }
    token_ledger_entries {
        uuid id PK
        uuid token_account_id FK
        token_ledger_entry_type type
        int amount
        text idempotency_key UK
        uuid screening_run_id "FK,UK"
        jsonb metadata
        timestamptz created_at
    }
    audit_logs {
        uuid id PK
        uuid actor_user_id FK
        uuid organization_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb metadata
        timestamptz created_at
    }
    billing_accounts {
        uuid id PK
        uuid organization_id "FK,UK"
        uuid billing_owner_id FK
        int spend_limit
        timestamptz created_at
        timestamptz updated_at
    }
    token_packages {
        uuid id PK
        text code UK
        text name
        int token_amount
        int price_minor
        text currency
        bool active
        int validity_days
        timestamptz created_at
        timestamptz updated_at
    }
    token_purchases {
        uuid id PK
        uuid organization_id FK
        uuid package_id FK
        uuid purchased_by FK
        text provider
        text provider_reference
        token_purchase_status status
        int amount_minor
        text currency
        int token_amount
        timestamptz paid_at
        timestamptz expires_at
        timestamptz created_at
        timestamptz updated_at
    }
    payment_events {
        uuid id PK
        text provider
        text event_id UK
        text type
        payment_event_status status
        jsonb payload
        timestamptz processed_at
        timestamptz created_at
    }
    notification_preferences {
        uuid id PK
        uuid user_id "FK,UK"
        bool in_app_enabled
        bool email_enabled
        jsonb quiet_hours
        timestamptz created_at
        timestamptz updated_at
    }
    notification_deliveries {
        uuid id PK
        uuid notification_id FK
        notification_delivery_channel channel
        notification_delivery_status status
        int attempt_count
        text provider_message_id
        text last_error
        timestamptz next_attempt_at
        timestamptz sent_at
        text dedupe_key UK
        timestamptz created_at
        timestamptz updated_at
    }
    candidate_documents {
        uuid id PK
        uuid candidate_profile_id FK
        uuid owner_user_id FK
        candidate_document_kind kind
        text storage_path
        text original_name
        text mime_type
        int byte_size
        text sha256
        candidate_document_status status
        int extraction_confidence
        jsonb extracted_data
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    cv_documents {
        uuid id PK
        uuid candidate_profile_id FK
        text storage_path
        text original_file_name
        text mime_type
        int size_bytes
        text sha256
        cv_document_status status
        int page_count
        int extraction_confidence
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    cv_versions {
        uuid id PK
        uuid cv_document_id FK
        uuid candidate_profile_id FK
        int version_number
        cv_version_template template
        jsonb content
        timestamptz approved_at
        timestamptz generated_at
        timestamptz created_at
    }
    candidate_verifications {
        uuid id PK
        uuid candidate_profile_id FK
        candidate_verification_type type
        candidate_verification_status status
        jsonb evidence
        text provider
        timestamptz verified_at
        timestamptz expires_at
        timestamptz revoked_at
        text dispute_reason
        timestamptz created_at
        timestamptz updated_at
    }
    jobs {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        text title
        text description
        job_status status
        employment_type employment_type
        work_arrangement work_arrangement
        text location
        timestamptz published_at
        timestamptz closed_at
        timestamptz created_at
        timestamptz updated_at
    }
    job_requirements {
        uuid id PK
        uuid job_id FK
        job_requirement_type type
        text name
        text description
        int minimum_experience_months
        timestamptz created_at
    }
    applications {
        uuid id PK
        uuid job_id FK
        uuid candidate_profile_id FK
        application_status status
        application_source source
        text cover_note
        timestamptz submitted_at
        timestamptz withdrawn_at
        timestamptz created_at
        timestamptz updated_at
    }
    application_stage_history {
        uuid id PK
        uuid application_id FK
        application_status from_status
        application_status to_status
        uuid changed_by FK
        text reason
        timestamptz created_at
    }
    assessment_templates {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        text name
        text description
        int time_limit_minutes
        int attempt_limit
        timestamptz created_at
        timestamptz updated_at
    }
    assessment_questions {
        uuid id PK
        uuid assessment_template_id FK
        assessment_question_type type
        text prompt
        jsonb options
        jsonb response_schema
        bool is_required
        int sort_order
        timestamptz created_at
    }
    assessment_invitations {
        uuid id PK
        uuid application_id FK
        uuid assessment_template_id FK
        uuid candidate_profile_id FK
        uuid invited_by FK
        assessment_invitation_status status
        timestamptz expires_at
        timestamptz sent_at
        timestamptz created_at
        timestamptz updated_at
    }
    assessment_attempts {
        uuid id PK
        uuid invitation_id FK
        int attempt_number
        assessment_attempt_status status
        timestamptz started_at
        timestamptz submitted_at
        timestamptz created_at
        timestamptz updated_at
    }
    assessment_answers {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        jsonb response
        timestamptz saved_at
        timestamptz submitted_at
    }
    assessment_reviews {
        uuid id PK
        uuid attempt_id "FK,UK"
        uuid reviewer_id FK
        assessment_review_status status
        int score
        jsonb dimension_scores
        text notes
        timestamptz reviewed_at
        timestamptz created_at
        timestamptz updated_at
    }
    interviews {
        uuid id PK
        uuid application_id FK
        uuid organization_id FK
        uuid created_by FK
        text title
        interview_status status
        timestamptz scheduled_at
        int duration_minutes
        text timezone
        text meeting_url
        jsonb reminder_metadata
        jsonb cancellation_metadata
        jsonb reschedule_metadata
        timestamptz created_at
        timestamptz updated_at
    }
    interview_events {
        uuid id PK
        uuid interview_id FK
        uuid actor_user_id FK
        interview_event_type type
        jsonb metadata
        timestamptz occurred_at
        timestamptz created_at
    }
    interview_panel_members {
        uuid id PK
        uuid interview_id FK
        uuid user_id FK
        interview_panel_role role
        timestamptz created_at
    }
    interview_scorecards {
        uuid id PK
        uuid interview_id FK
        uuid panel_member_id FK
        jsonb criteria
        timestamptz submitted_at
        timestamptz created_at
        timestamptz updated_at
    }
    interview_feedback {
        uuid id PK
        uuid scorecard_id "FK,UK"
        interview_feedback_recommendation recommendation
        int overall_score
        text comments
        jsonb ratings
        timestamptz created_at
        timestamptz updated_at
    }
    offers {
        uuid id PK
        uuid application_id FK
        uuid organization_id FK
        uuid created_by FK
        offer_status status
        timestamptz expires_at
        timestamptz sent_at
        timestamptz responded_at
        jsonb terms
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }
    application_outcomes {
        uuid id PK
        uuid application_id "FK,UK"
        application_outcome_type type
        uuid decided_by FK
        text reason
        jsonb metadata
        timestamptz decided_at
        timestamptz created_at
    }
    application_assignments {
        uuid id PK
        uuid application_id FK
        uuid user_id FK
        assignment_role role
        uuid assigned_by FK
        timestamptz assigned_at
        jsonb metadata
        timestamptz created_at
    }
    job_stage_slas {
        uuid id PK
        uuid job_id FK
        application_status stage
        int due_after_hours
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }
    application_stage_due_dates {
        uuid id PK
        uuid application_id FK
        application_status stage
        timestamptz due_at
        timestamptz completed_at
        int sla_hours
        jsonb metadata
        timestamptz created_at
    }
    saved_searches {
        uuid id PK
        uuid organization_id FK
        uuid created_by FK
        text name
        text query
        jsonb filters
        timestamptz created_at
        timestamptz updated_at
    }
    search_alerts {
        uuid id PK
        uuid saved_search_id FK
        uuid user_id FK
        search_alert_frequency frequency
        bool enabled
        timestamptz last_sent_at
        timestamptz created_at
        timestamptz updated_at
    }
    skill_aliases {
        uuid id PK
        uuid organization_id FK
        text canonical_skill
        text alias
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }
    search_analytics {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        uuid saved_search_id FK
        search_analytics_event_type event_type
        text query
        int result_count
        jsonb metadata
        timestamptz created_at
    }
    screening_governance_versions {
        uuid id PK
        uuid organization_id FK
        int version
        jsonb policy
        timestamptz published_at
        uuid created_by FK
        timestamptz created_at
    }
    screening_governance_snapshots {
        uuid id PK
        uuid screening_run_id "FK,UK"
        uuid governance_version_id FK
        jsonb policy
        timestamptz created_at
    }
    screening_evaluations {
        uuid id PK
        uuid screening_run_id FK
        uuid evaluated_by FK
        screening_evaluation_type type
        jsonb result
        jsonb evidence
        timestamptz created_at
    }
    screening_run_telemetry {
        uuid id PK
        uuid screening_run_id "FK,UK"
        int provider_cost_minor
        int latency_ms
        int retry_count
        jsonb provider_metadata
        text last_error
        timestamptz created_at
        timestamptz updated_at
    }

    users ||--|| profiles : "profiles.user_id"
    users ||--o{ organizations : "organizations.created_by"
    users ||--o{ organizations : "organizations.reviewed_by"
    organizations ||--o{ organization_members : "organization_id"
    users ||--o{ organization_members : "organization_members.user_id"
    users ||--|| candidate_profiles : "candidate_profiles.user_id"
    candidate_profiles ||--o{ candidate_profile_sections : "candidate_profile_id"
    organizations ||--o{ shortlists : "shortlists.organization_id"
    users ||--o{ shortlists : "shortlists.created_by"
    shortlists ||--o{ shortlist_items : "shortlist_id"
    candidate_profiles ||--o{ shortlist_items : "shortlist_items.candidate_profile_id"
    organizations ||--o{ consent_request_batches : "batches.organization_id"
    users ||--o{ consent_request_batches : "batches.requested_by"
    consent_request_batches ||--o{ consent_request_items : "items.batch_id"
    candidate_profiles ||--o{ consent_request_items : "items.candidate_profile_id"
    consent_request_items ||--o{ consent_events : "events.consent_request_item_id"
    users ||--o{ consent_events : "events.actor_user_id"
    organizations ||--o{ screening_runs : "runs.organization_id"
    candidate_profiles ||--o{ screening_runs : "runs.candidate_profile_id"
    consent_request_items ||--o{ screening_runs : "runs.consent_request_item_id"
    users ||--o{ screening_runs : "runs.requested_by"
    screening_runs ||--|| screening_scores : "scores.screening_run_id"
    users ||--o{ notifications : "notifications.user_id"
    organizations ||--o{ conversations : "conversations.organization_id"
    users ||--o{ conversations : "conversations.created_by"
    consent_request_items ||--o{ conversations : "conversations.consent_request_item_id"
    conversations ||--o{ conversation_participants : "participants.conversation_id"
    users ||--o{ conversation_participants : "participants.user_id"
    conversations ||--o{ messages : "messages.conversation_id"
    users ||--o{ messages : "messages.sender_id"
    conversations ||--o{ message_reports : "reports.conversation_id"
    messages ||--o{ message_reports : "reports.message_id"
    users ||--o{ message_reports : "reports.reporter_id"
    organizations ||--|| token_accounts : "token_accounts.organization_id"
    token_accounts ||--o{ token_ledger_entries : "entries.token_account_id"
    screening_runs ||--|| token_ledger_entries : "entries.screening_run_id"
    users ||--o{ audit_logs : "audit_logs.actor_user_id"
    organizations ||--o{ audit_logs : "audit_logs.organization_id"
    organizations ||--|| billing_accounts : "billing_accounts.organization_id"
    users ||--o{ billing_accounts : "billing_accounts.billing_owner_id"
    token_packages ||--o{ token_purchases : "purchases.package_id"
    organizations ||--o{ token_purchases : "purchases.organization_id"
    users ||--o{ token_purchases : "purchases.purchased_by"
    notifications ||--o{ notification_deliveries : "deliveries.notification_id"
    users ||--|| notification_preferences : "preferences.user_id"
    candidate_profiles ||--o{ candidate_documents : "documents.candidate_profile_id"
    users ||--o{ candidate_documents : "documents.owner_user_id"
    candidate_profiles ||--o{ cv_documents : "cv_documents.candidate_profile_id"
    cv_documents ||--o{ cv_versions : "versions.cv_document_id"
    candidate_profiles ||--o{ cv_versions : "versions.candidate_profile_id"
    candidate_profiles ||--o{ candidate_verifications : "verifications.candidate_profile_id"
    organizations ||--o{ jobs : "jobs.organization_id"
    users ||--o{ jobs : "jobs.created_by"
    jobs ||--o{ job_requirements : "requirements.job_id"
    jobs ||--o{ applications : "applications.job_id"
    candidate_profiles ||--o{ applications : "applications.candidate_profile_id"
    applications ||--o{ application_stage_history : "history.application_id"
    users ||--o{ application_stage_history : "history.changed_by"
    organizations ||--o{ assessment_templates : "templates.organization_id"
    users ||--o{ assessment_templates : "templates.created_by"
    assessment_templates ||--o{ assessment_questions : "questions.assessment_template_id"
    applications ||--o{ assessment_invitations : "invitations.application_id"
    assessment_templates ||--o{ assessment_invitations : "invitations.assessment_template_id"
    candidate_profiles ||--o{ assessment_invitations : "invitations.candidate_profile_id"
    users ||--o{ assessment_invitations : "invitations.invited_by"
    assessment_invitations ||--o{ assessment_attempts : "attempts.invitation_id"
    assessment_attempts ||--o{ assessment_answers : "answers.attempt_id"
    assessment_questions ||--o{ assessment_answers : "answers.question_id"
    assessment_attempts ||--|| assessment_reviews : "reviews.attempt_id"
    users ||--o{ assessment_reviews : "reviews.reviewer_id"
    applications ||--o{ interviews : "interviews.application_id"
    organizations ||--o{ interviews : "interviews.organization_id"
    users ||--o{ interviews : "interviews.created_by"
    interviews ||--o{ interview_events : "events.interview_id"
    users ||--o{ interview_events : "events.actor_user_id"
    interviews ||--o{ interview_panel_members : "members.interview_id"
    users ||--o{ interview_panel_members : "members.user_id"
    interviews ||--o{ interview_scorecards : "scorecards.interview_id"
    interview_panel_members ||--o{ interview_scorecards : "scorecards.panel_member_id"
    interview_scorecards ||--|| interview_feedback : "feedback.scorecard_id"
    applications ||--o{ offers : "offers.application_id"
    organizations ||--o{ offers : "offers.organization_id"
    users ||--o{ offers : "offers.created_by"
    applications ||--|| application_outcomes : "outcomes.application_id"
    users ||--o{ application_outcomes : "outcomes.decided_by"
    applications ||--o{ application_assignments : "assignments.application_id"
    users ||--o{ application_assignments : "assignments.user_id"
    users ||--o{ application_assignments : "assignments.assigned_by"
    jobs ||--o{ job_stage_slas : "slas.job_id"
    applications ||--o{ application_stage_due_dates : "due_dates.application_id"
    organizations ||--o{ saved_searches : "searches.organization_id"
    users ||--o{ saved_searches : "searches.created_by"
    saved_searches ||--o{ search_alerts : "alerts.saved_search_id"
    users ||--o{ search_alerts : "alerts.user_id"
    organizations ||--o{ skill_aliases : "aliases.organization_id"
    organizations ||--o{ search_analytics : "analytics.organization_id"
    users ||--o{ search_analytics : "analytics.user_id"
    saved_searches ||--o{ search_analytics : "analytics.saved_search_id"
    organizations ||--o{ screening_governance_versions : "gov_versions.organization_id"
    users ||--o{ screening_governance_versions : "gov_versions.created_by"
    screening_runs ||--|| screening_governance_snapshots : "snapshots.screening_run_id"
    screening_governance_versions ||--o{ screening_governance_snapshots : "snapshots.governance_version_id"
    screening_runs ||--o{ screening_evaluations : "evaluations.screening_run_id"
    users ||--o{ screening_evaluations : "evaluations.evaluated_by"
    screening_runs ||--|| screening_run_telemetry : "telemetry.screening_run_id"
```

## Enums (values from `src/db/schema.ts`)

`user_role`: candidate, recruiter, partner, admin · `organization_member_role`: owner, admin, recruiter, viewer · `profile_section_type`: headline, about, experience, education, skills, tools, preferences, portfolio · `shortlist_item_status`: active, archived · `consent_item_status`: pending, approved, declined, revoked, expired · `consent_event_type`: requested, approved, declined, revoked, expired · `screening_status`: pending, approved, in_progress, completed, failed · `notification_type`: consent_requested, consent_updated, screening_completed, message_received, system · `conversation_status`: active, read_only, blocked · `attachment_scan_status`: not_applicable, pending, clean, quarantined · `message_report_status`: open, reviewing, resolved, dismissed · `recruiter_provisioning_status`: pending, active, rejected, revision_required · `company_verification_status`: pending, approved, need_revision, rejected, suspended · `industry_sector` / `company_scale`: Indonesian-labeled sets · `subscription_tier`: trial, starter, professional, enterprise · `subscription_status`: active, expired, suspended · `token_ledger_entry_type`: grant, charge, refund · `token_purchase_status`: pending, paid, failed, refunded · `notification_delivery_channel`: email, in_app · `notification_delivery_status`: pending, sent, failed · `payment_event_status`: processed, ignored, failed · `candidate_document_kind`: cv · `candidate_document_status`: uploaded, processing, ready, failed, deleted · `cv_document_status`: uploaded, processing, review, approved, rejected, deleted · `cv_version_template`: ats, creative · `candidate_verification_type`: identity, email, phone, education, employment, certification, portfolio · `candidate_verification_status`: pending, verified, expired, revoked, disputed · `job_status`: draft, published, closed, archived · `employment_type`, `work_arrangement`, `job_requirement_type` · `application_status`: 12-state (new … hired/rejected/withdrawn) · `application_source`: candidate, recruiter_invitation · `assessment_question_type`, `assessment_invitation_status`, `assessment_attempt_status`, `assessment_review_status` · `interview_status`, `interview_event_type`, `interview_panel_role`, `interview_feedback_recommendation` · `offer_status`, `application_outcome_type`, `assignment_role` (recruiter, hiring_manager) · `search_alert_frequency`, `search_analytics_event_type`, `screening_evaluation_type` (automated, human).
