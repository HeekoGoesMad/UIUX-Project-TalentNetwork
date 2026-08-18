-- RLS for the Phase 0/P1 audit, billing, notification, CV, and verification foundation.
-- This migration is intentionally separate from Drizzle and is not applied remotely yet.
-- Trusted server-side Drizzle writes remain available through the configured bypass role.

alter table public.audit_logs enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.token_packages enable row level security;
alter table public.token_purchases enable row level security;
alter table public.payment_events enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.candidate_documents enable row level security;
alter table public.cv_documents enable row level security;
alter table public.cv_versions enable row level security;
alter table public.candidate_verifications enable row level security;

revoke all on table public.audit_logs from anon;
revoke all on table public.billing_accounts from anon;
revoke all on table public.token_purchases from anon;
revoke all on table public.payment_events from anon;
revoke all on table public.notification_preferences from anon;
revoke all on table public.notification_deliveries from anon;
revoke all on table public.candidate_documents from anon;
revoke all on table public.cv_documents from anon;
revoke all on table public.cv_versions from anon;
revoke all on table public.candidate_verifications from anon;

create policy audit_logs_actor_or_member_select on public.audit_logs
  for select to authenticated
  using (
    actor_user_id = app_private.app_user_id()
    or (organization_id is not null and app_private.is_org_member(organization_id))
  );

create policy billing_accounts_owner_or_manager_select on public.billing_accounts
  for select to authenticated
  using (
    billing_owner_id = app_private.app_user_id()
    or app_private.is_org_manager(organization_id)
  );

create policy token_packages_active_select on public.token_packages
  for select to anon, authenticated
  using (active = true);

create policy token_purchases_member_or_admin_select on public.token_purchases
  for select to authenticated
  using (
    app_private.is_org_member(organization_id)
    or exists (
      select 1
      from public.users as u
      where u.id = app_private.app_user_id()
        and u.role = 'admin'
    )
  );

create policy payment_events_admin_select on public.payment_events
  for select to authenticated
  using (exists (
    select 1
    from public.users as u
    where u.id = app_private.app_user_id()
      and u.role = 'admin'
  ));

create policy notification_preferences_owner_select on public.notification_preferences
  for select to authenticated
  using (user_id = app_private.app_user_id());

create policy notification_preferences_owner_insert on public.notification_preferences
  for insert to authenticated
  with check (user_id = app_private.app_user_id());

create policy notification_preferences_owner_update on public.notification_preferences
  for update to authenticated
  using (user_id = app_private.app_user_id())
  with check (user_id = app_private.app_user_id());

create policy notification_preferences_owner_delete on public.notification_preferences
  for delete to authenticated
  using (user_id = app_private.app_user_id());

create policy notification_deliveries_owner_select on public.notification_deliveries
  for select to authenticated
  using (exists (
    select 1
    from public.notifications as n
    where n.id = notification_id
      and n.user_id = app_private.app_user_id()
  ));

create policy candidate_documents_owner_select on public.candidate_documents
  for select to authenticated
  using (owner_user_id = app_private.app_user_id());

create policy candidate_documents_owner_insert on public.candidate_documents
  for insert to authenticated
  with check (owner_user_id = app_private.app_user_id());

create policy candidate_documents_owner_update on public.candidate_documents
  for update to authenticated
  using (owner_user_id = app_private.app_user_id())
  with check (owner_user_id = app_private.app_user_id());

create policy cv_documents_candidate_select on public.cv_documents
  for select to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id));

create policy cv_documents_candidate_insert on public.cv_documents
  for insert to authenticated
  with check (app_private.owns_candidate_profile(candidate_profile_id));

create policy cv_documents_candidate_update on public.cv_documents
  for update to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id))
  with check (app_private.owns_candidate_profile(candidate_profile_id));

create policy cv_versions_candidate_select on public.cv_versions
  for select to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id));

create policy candidate_verifications_candidate_select on public.candidate_verifications
  for select to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id));

create policy candidate_verifications_candidate_or_admin_select on public.candidate_verifications
  for select to authenticated
  using (
    app_private.owns_candidate_profile(candidate_profile_id)
    or exists (
      select 1
      from public.users as u
      where u.id = app_private.app_user_id()
        and u.role = 'admin'
    )
  );

create policy candidate_verifications_admin_update on public.candidate_verifications
  for update to authenticated
  using (
    exists (
      select 1
      from public.users as u
      where u.id = app_private.app_user_id()
        and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.users as u
      where u.id = app_private.app_user_id()
        and u.role = 'admin'
    )
  );
