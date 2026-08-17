-- RLS for reviewer scorecards. This migration is intentionally kept separate from
-- the Drizzle migration and must be approved before being applied remotely.

alter table public.assessment_reviews enable row level security;

-- No anon policy is defined, so the table is not publicly readable or writable.
revoke all on table public.assessment_reviews from anon;

create policy assessment_reviews_candidate_select on public.assessment_reviews
  for select to authenticated
  using (exists (
    select 1
    from public.assessment_attempts as aa
    join public.assessment_invitations as ai on ai.id = aa.invitation_id
    where aa.id = attempt_id
      and app_private.owns_candidate_profile(ai.candidate_profile_id)
  ));

create policy assessment_reviews_member_select on public.assessment_reviews
  for select to authenticated
  using (exists (
    select 1
    from public.assessment_attempts as aa
    join public.assessment_invitations as ai on ai.id = aa.invitation_id
    join public.applications as a on a.id = ai.application_id
    join public.jobs as j on j.id = a.job_id
    where aa.id = attempt_id
      and app_private.is_org_member(j.organization_id)
  ));

create policy assessment_reviews_member_insert on public.assessment_reviews
  for insert to authenticated
  with check (
    reviewer_id = app_private.app_user_id()
    and exists (
      select 1
      from public.assessment_attempts as aa
      join public.assessment_invitations as ai on ai.id = aa.invitation_id
      join public.applications as a on a.id = ai.application_id
      join public.jobs as j on j.id = a.job_id
      where aa.id = attempt_id
        and app_private.is_org_member(j.organization_id)
    )
  );

create policy assessment_reviews_member_update on public.assessment_reviews
  for update to authenticated
  using (
    reviewer_id = app_private.app_user_id()
    and exists (
      select 1
      from public.assessment_attempts as aa
      join public.assessment_invitations as ai on ai.id = aa.invitation_id
      join public.applications as a on a.id = ai.application_id
      join public.jobs as j on j.id = a.job_id
      where aa.id = attempt_id
        and app_private.is_org_member(j.organization_id)
    )
  )
  with check (
    reviewer_id = app_private.app_user_id()
    and exists (
      select 1
      from public.assessment_attempts as aa
      join public.assessment_invitations as ai on ai.id = aa.invitation_id
      join public.applications as a on a.id = ai.application_id
      join public.jobs as j on j.id = a.job_id
      where aa.id = attempt_id
        and app_private.is_org_member(j.organization_id)
    )
  );
