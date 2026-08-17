-- Reviewed RLS baseline for the current Drizzle schema.
--
-- The application currently uses server-only Drizzle (DATABASE_URL). Route handlers
-- must still authenticate the Supabase session and authorize the requested action.
-- This migration protects the exposed Data API and is not a replacement for route
-- authorization. The server database role is expected to bypass RLS as it does today.

create schema if not exists app_private;

-- These helpers intentionally run as definer functions so policies can inspect the
-- users and membership tables without recursive RLS evaluation. They are not a
-- public API: the schema is not exposed and execute is granted only to authenticated.
create or replace function app_private.app_user_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select u.id
  from public.users as u
  where u.auth_user_id = (select auth.uid())
$$;

create or replace function app_private.is_active_recruiter()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.users as u
    where u.id = app_private.app_user_id()
      and u.role = 'recruiter'
      and u.recruiter_provisioning_status = 'active'
  )
$$;

-- RLS policies are row-scoped, so explicitly preserve authorization columns when
-- allowing a user to update their own row. Trusted server-side Drizzle writes are
-- not subject to this policy when using the configured bypass role.
create or replace function app_private.can_update_user(
  target_user_id uuid,
  target_auth_user_id uuid,
  target_email text,
  target_role public.user_role,
  target_provisioning_status public.recruiter_provisioning_status
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.users as u
    where u.id = target_user_id
      and u.auth_user_id = (select auth.uid())
      and u.auth_user_id = target_auth_user_id
      and u.email = target_email
      and u.role = target_role
      and u.recruiter_provisioning_status = target_provisioning_status
  )
$$;

create or replace function app_private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members as om
    where om.organization_id = target_organization_id
      and om.user_id = app_private.app_user_id()
      and app_private.is_active_recruiter()
  )
$$;

create or replace function app_private.is_org_manager(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members as om
    where om.organization_id = target_organization_id
      and om.user_id = app_private.app_user_id()
      and app_private.is_active_recruiter()
      and om.role in ('owner', 'admin')
  )
$$;

create or replace function app_private.owns_candidate_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.candidate_profiles as cp
    where cp.id = target_profile_id
      and cp.user_id = app_private.app_user_id()
  )
$$;

create or replace function app_private.can_access_consent_item(target_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.consent_request_items as cri
    join public.candidate_profiles as cp on cp.id = cri.candidate_profile_id
    join public.consent_request_batches as crb on crb.id = cri.batch_id
    where cri.id = target_item_id
      and (
        cp.user_id = app_private.app_user_id()
        or app_private.is_org_member(crb.organization_id)
      )
  )
$$;

create or replace function app_private.can_access_shortlist(target_shortlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.shortlists as s
    where s.id = target_shortlist_id
      and app_private.is_org_member(s.organization_id)
  )
$$;

create or replace function app_private.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.conversation_participants as cp
    where cp.conversation_id = target_conversation_id
      and cp.user_id = app_private.app_user_id()
      and cp.left_at is null
  )
$$;

create or replace function app_private.can_send_message(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.conversations as c
    where c.id = target_conversation_id
      and c.status = 'active'
      and app_private.is_conversation_participant(c.id)
  )
$$;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
revoke all on all functions in schema app_private from public;
grant execute on function app_private.app_user_id() to authenticated;
grant execute on function app_private.is_active_recruiter() to authenticated;
grant execute on function app_private.can_update_user(uuid, uuid, text, public.user_role, public.recruiter_provisioning_status) to authenticated;
grant execute on function app_private.is_org_member(uuid) to authenticated;
grant execute on function app_private.is_org_manager(uuid) to authenticated;
grant execute on function app_private.owns_candidate_profile(uuid) to authenticated;
grant execute on function app_private.can_access_consent_item(uuid) to authenticated;
grant execute on function app_private.can_access_shortlist(uuid) to authenticated;
grant execute on function app_private.is_conversation_participant(uuid) to authenticated;
grant execute on function app_private.can_send_message(uuid) to authenticated;

-- Authorization lookups used by the helpers and policies.
create index if not exists organization_members_user_org_idx
  on public.organization_members (user_id, organization_id);
create index if not exists conversation_participants_user_conversation_idx
  on public.conversation_participants (user_id, conversation_id)
  where left_at is null;
create index if not exists consent_request_batches_org_idx
  on public.consent_request_batches (organization_id);
create index if not exists consent_request_items_batch_idx
  on public.consent_request_items (batch_id);

-- Every current public table is protected, including tables with intentionally no
-- direct client-write policy. Tables without a matching policy deny by default.
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.candidate_profile_sections enable row level security;
alter table public.shortlists enable row level security;
alter table public.shortlist_items enable row level security;
alter table public.consent_request_batches enable row level security;
alter table public.consent_request_items enable row level security;
alter table public.consent_events enable row level security;
alter table public.screening_runs enable row level security;
alter table public.screening_scores enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.token_accounts enable row level security;
alter table public.token_ledger_entries enable row level security;

create policy users_owner_select on public.users
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy users_owner_update on public.users
  for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (
    app_private.can_update_user(
      id,
      auth_user_id,
      email,
      role,
      recruiter_provisioning_status
    )
  );

create policy profiles_owner_all on public.profiles
  for all to authenticated
  using (user_id = app_private.app_user_id())
  with check (user_id = app_private.app_user_id());

create policy organizations_member_select on public.organizations
  for select to authenticated
  using (app_private.is_org_member(id));

create policy organizations_owner_insert on public.organizations
  for insert to authenticated
  with check (
    created_by = app_private.app_user_id()
    and app_private.is_active_recruiter()
  );

create policy organizations_manager_update on public.organizations
  for update to authenticated
  using (app_private.is_org_manager(id))
  with check (app_private.is_org_manager(id));

create policy organizations_owner_delete on public.organizations
  for delete to authenticated
  using (
    created_by = app_private.app_user_id()
    and app_private.is_active_recruiter()
  );

create policy organization_members_member_select on public.organization_members
  for select to authenticated
  using (app_private.is_org_member(organization_id));

create policy organization_members_manager_update on public.organization_members
  for update to authenticated
  using (app_private.is_org_manager(organization_id))
  with check (app_private.is_org_manager(organization_id));

create policy organization_members_manager_delete on public.organization_members
  for delete to authenticated
  using (app_private.is_org_manager(organization_id));

-- Membership provisioning remains a trusted server operation; there is no client
-- INSERT policy for organization_members.
create policy candidate_profiles_owner_all on public.candidate_profiles
  for all to authenticated
  using (user_id = app_private.app_user_id())
  with check (user_id = app_private.app_user_id());

create policy candidate_profiles_published_select on public.candidate_profiles
  for select to anon, authenticated
  using (is_published = true);

create policy candidate_profile_sections_owner_all on public.candidate_profile_sections
  for all to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id))
  with check (app_private.owns_candidate_profile(candidate_profile_id));

create policy candidate_profile_sections_published_select on public.candidate_profile_sections
  for select to anon, authenticated
  using (exists (
    select 1
    from public.candidate_profiles as cp
    where cp.id = candidate_profile_id
      and cp.is_published = true
  ));

create policy shortlists_member_select on public.shortlists
  for select to authenticated
  using (app_private.is_org_member(organization_id));

create policy shortlists_member_insert on public.shortlists
  for insert to authenticated
  with check (
    created_by = app_private.app_user_id()
    and app_private.is_org_member(organization_id)
  );

create policy shortlists_manager_update on public.shortlists
  for update to authenticated
  using (app_private.is_org_manager(organization_id) or created_by = app_private.app_user_id())
  with check (app_private.is_org_member(organization_id));

create policy shortlists_manager_delete on public.shortlists
  for delete to authenticated
  using (app_private.is_org_manager(organization_id) or created_by = app_private.app_user_id());

create policy shortlist_items_member_select on public.shortlist_items
  for select to authenticated
  using (app_private.can_access_shortlist(shortlist_id));

create policy shortlist_items_member_insert on public.shortlist_items
  for insert to authenticated
  with check (app_private.can_access_shortlist(shortlist_id));

create policy shortlist_items_member_update on public.shortlist_items
  for update to authenticated
  using (app_private.can_access_shortlist(shortlist_id))
  with check (app_private.can_access_shortlist(shortlist_id));

create policy shortlist_items_member_delete on public.shortlist_items
  for delete to authenticated
  using (app_private.can_access_shortlist(shortlist_id));

create policy consent_batches_member_select on public.consent_request_batches
  for select to authenticated
  using (app_private.is_org_member(organization_id));

create policy consent_batches_member_insert on public.consent_request_batches
  for insert to authenticated
  with check (
    requested_by = app_private.app_user_id()
    and app_private.is_org_member(organization_id)
  );

create policy consent_batches_requester_update on public.consent_request_batches
  for update to authenticated
  using (requested_by = app_private.app_user_id() or app_private.is_org_manager(organization_id))
  with check (app_private.is_org_member(organization_id));

create policy consent_batches_requester_delete on public.consent_request_batches
  for delete to authenticated
  using (requested_by = app_private.app_user_id() or app_private.is_org_manager(organization_id));

create policy consent_items_participant_select on public.consent_request_items
  for select to authenticated
  using (app_private.can_access_consent_item(id));

-- Candidate response is owner-scoped. Route validation must still restrict which
-- columns and status transitions may be changed.
create policy consent_items_candidate_update on public.consent_request_items
  for update to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id))
  with check (app_private.owns_candidate_profile(candidate_profile_id));

create policy consent_events_participant_select on public.consent_events
  for select to authenticated
  using (app_private.can_access_consent_item(consent_request_item_id));

-- Consent events are append-only audit data and are written by trusted server code.
create policy screening_runs_org_select on public.screening_runs
  for select to authenticated
  using (app_private.is_org_member(organization_id));

create policy screening_scores_org_select on public.screening_scores
  for select to authenticated
  using (exists (
    select 1
    from public.screening_runs as sr
    where sr.id = screening_run_id
      and app_private.is_org_member(sr.organization_id)
  ));

-- Screening runs and scores are trusted-write records; no client INSERT/UPDATE/
-- DELETE policies are intentionally provided.
create policy notifications_owner_select on public.notifications
  for select to authenticated
  using (user_id = app_private.app_user_id());

create policy notifications_owner_update on public.notifications
  for update to authenticated
  using (user_id = app_private.app_user_id())
  with check (user_id = app_private.app_user_id());

-- Notifications are created by trusted server code. The owner update policy exists
-- for read receipts; route code must only update read_at.
create policy conversations_participant_select on public.conversations
  for select to authenticated
  using (app_private.is_conversation_participant(id));

create policy conversations_member_insert on public.conversations
  for insert to authenticated
  with check (
    created_by = app_private.app_user_id()
    and app_private.is_org_member(organization_id)
  );

create policy conversations_participant_update on public.conversations
  for update to authenticated
  using (app_private.is_conversation_participant(id))
  with check (app_private.is_conversation_participant(id));

create policy conversations_creator_delete on public.conversations
  for delete to authenticated
  using (created_by = app_private.app_user_id());

create policy conversation_participants_participant_select on public.conversation_participants
  for select to authenticated
  using (app_private.is_conversation_participant(conversation_id));

-- Participant provisioning and removal are trusted operations so users cannot add
-- themselves to another conversation.
create policy messages_participant_select on public.messages
  for select to authenticated
  using (app_private.is_conversation_participant(conversation_id));

create policy messages_participant_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = app_private.app_user_id()
    and app_private.can_send_message(conversation_id)
  );

create policy messages_sender_update on public.messages
  for update to authenticated
  using (
    sender_id = app_private.app_user_id()
    and app_private.is_conversation_participant(conversation_id)
  )
  with check (
    sender_id = app_private.app_user_id()
    and app_private.is_conversation_participant(conversation_id)
  );

create policy messages_sender_delete on public.messages
  for delete to authenticated
  using (
    sender_id = app_private.app_user_id()
    and app_private.is_conversation_participant(conversation_id)
  );

-- Token balances and ledger history are readable by active recruiter members.
-- Token creation, balance mutation, grants, charges, and refunds remain trusted
-- server operations; there are intentionally no client write policies.
create policy token_accounts_member_select on public.token_accounts
  for select to authenticated
  using (app_private.is_org_member(organization_id));

create policy token_ledger_entries_member_select on public.token_ledger_entries
  for select to authenticated
  using (exists (
    select 1
    from public.token_accounts as ta
    where ta.id = token_account_id
      and app_private.is_org_member(ta.organization_id)
  ));
