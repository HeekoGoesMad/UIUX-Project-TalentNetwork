-- RLS for the jobs, applications, and assessment foundation.
-- Client policies expose only published jobs, organization-owned recruiter data,
-- and candidate-owned application/assessment data. Trusted server writes remain
-- available through the configured bypass role.

alter table public.jobs enable row level security;
alter table public.job_requirements enable row level security;
alter table public.applications enable row level security;
alter table public.application_stage_history enable row level security;
alter table public.assessment_templates enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_invitations enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;

create policy jobs_published_select on public.jobs
  for select to anon, authenticated
  using (status = 'published');

create policy jobs_member_select on public.jobs
  for select to authenticated
  using (app_private.is_org_member(organization_id));

create policy jobs_member_insert on public.jobs
  for insert to authenticated
  with check (
    created_by = app_private.app_user_id()
    and app_private.is_org_member(organization_id)
  );

create policy jobs_manager_update on public.jobs
  for update to authenticated
  using (app_private.is_org_manager(organization_id) or created_by = app_private.app_user_id())
  with check (app_private.is_org_member(organization_id));

create policy jobs_manager_delete on public.jobs
  for delete to authenticated
  using (app_private.is_org_manager(organization_id) or created_by = app_private.app_user_id());

create policy job_requirements_member_select on public.job_requirements
  for select to authenticated
  using (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_member(j.organization_id)
  ));

create policy job_requirements_member_insert on public.job_requirements
  for insert to authenticated
  with check (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_member(j.organization_id)
  ));

create policy job_requirements_manager_update on public.job_requirements
  for update to authenticated
  using (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_manager(j.organization_id)
  ))
  with check (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_member(j.organization_id)
  ));

create policy job_requirements_manager_delete on public.job_requirements
  for delete to authenticated
  using (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_manager(j.organization_id)
  ));

create policy applications_candidate_select on public.applications
  for select to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id));

create policy applications_member_select on public.applications
  for select to authenticated
  using (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_member(j.organization_id)
  ));

create policy applications_candidate_insert on public.applications
  for insert to authenticated
  with check (
    source = 'candidate'
    and app_private.owns_candidate_profile(candidate_profile_id)
    and exists (
      select 1 from public.jobs as j
      where j.id = job_id and j.status = 'published'
    )
  );

create policy applications_candidate_update on public.applications
  for update to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id))
  with check (app_private.owns_candidate_profile(candidate_profile_id));

create policy applications_manager_update on public.applications
  for update to authenticated
  using (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_manager(j.organization_id)
  ))
  with check (exists (
    select 1 from public.jobs as j
    where j.id = job_id and app_private.is_org_member(j.organization_id)
  ));

create policy application_stage_history_participant_select on public.application_stage_history
  for select to authenticated
  using (exists (
    select 1
    from public.applications as a
    join public.jobs as j on j.id = a.job_id
    where a.id = application_id
      and (app_private.owns_candidate_profile(a.candidate_profile_id) or app_private.is_org_member(j.organization_id))
  ));

create policy assessment_templates_member_select on public.assessment_templates
  for select to authenticated
  using (app_private.is_org_member(organization_id));

create policy assessment_templates_member_insert on public.assessment_templates
  for insert to authenticated
  with check (
    created_by = app_private.app_user_id()
    and app_private.is_org_member(organization_id)
  );

create policy assessment_templates_manager_update on public.assessment_templates
  for update to authenticated
  using (app_private.is_org_manager(organization_id) or created_by = app_private.app_user_id())
  with check (app_private.is_org_member(organization_id));

create policy assessment_templates_manager_delete on public.assessment_templates
  for delete to authenticated
  using (app_private.is_org_manager(organization_id) or created_by = app_private.app_user_id());

create policy assessment_questions_participant_select on public.assessment_questions
  for select to authenticated
  using (
    exists (
      select 1 from public.assessment_templates as at
      where at.id = assessment_template_id and app_private.is_org_member(at.organization_id)
    )
    or exists (
      select 1
      from public.assessment_invitations as ai
      where ai.assessment_template_id = assessment_template_id
        and app_private.owns_candidate_profile(ai.candidate_profile_id)
    )
  );

create policy assessment_questions_member_insert on public.assessment_questions
  for insert to authenticated
  with check (exists (
    select 1 from public.assessment_templates as at
    where at.id = assessment_template_id and app_private.is_org_member(at.organization_id)
  ));

create policy assessment_questions_manager_delete on public.assessment_questions
  for delete to authenticated
  using (exists (
    select 1 from public.assessment_templates as at
    where at.id = assessment_template_id and app_private.is_org_manager(at.organization_id)
  ));

create policy assessment_invitations_participant_select on public.assessment_invitations
  for select to authenticated
  using (
    app_private.owns_candidate_profile(candidate_profile_id)
    or exists (
      select 1 from public.applications as a
      join public.jobs as j on j.id = a.job_id
      where a.id = application_id and app_private.is_org_member(j.organization_id)
    )
  );

create policy assessment_invitations_member_insert on public.assessment_invitations
  for insert to authenticated
  with check (
    invited_by = app_private.app_user_id()
    and exists (
      select 1
      from public.applications as a
      join public.jobs as j on j.id = a.job_id
      where a.id = application_id
        and a.candidate_profile_id = candidate_profile_id
        and app_private.is_org_member(j.organization_id)
    )
    and exists (
      select 1 from public.assessment_templates as at
      where at.id = assessment_template_id and app_private.is_org_member(at.organization_id)
    )
  );

create policy assessment_invitations_candidate_update on public.assessment_invitations
  for update to authenticated
  using (app_private.owns_candidate_profile(candidate_profile_id))
  with check (app_private.owns_candidate_profile(candidate_profile_id));

create policy assessment_invitations_manager_update on public.assessment_invitations
  for update to authenticated
  using (exists (
    select 1
    from public.applications as a
    join public.jobs as j on j.id = a.job_id
    where a.id = application_id and app_private.is_org_manager(j.organization_id)
  ))
  with check (exists (
    select 1
    from public.applications as a
    join public.jobs as j on j.id = a.job_id
    where a.id = application_id and app_private.is_org_member(j.organization_id)
  ));

create policy assessment_attempts_candidate_select on public.assessment_attempts
  for select to authenticated
  using (exists (
    select 1 from public.assessment_invitations as ai
    where ai.id = invitation_id and app_private.owns_candidate_profile(ai.candidate_profile_id)
  ));

create policy assessment_attempts_member_select on public.assessment_attempts
  for select to authenticated
  using (exists (
    select 1
    from public.assessment_invitations as ai
    join public.applications as a on a.id = ai.application_id
    join public.jobs as j on j.id = a.job_id
    where ai.id = invitation_id and app_private.is_org_member(j.organization_id)
  ));

create policy assessment_attempts_candidate_insert on public.assessment_attempts
  for insert to authenticated
  with check (exists (
    select 1 from public.assessment_invitations as ai
    where ai.id = invitation_id and app_private.owns_candidate_profile(ai.candidate_profile_id)
  ));

create policy assessment_attempts_candidate_update on public.assessment_attempts
  for update to authenticated
  using (exists (
    select 1 from public.assessment_invitations as ai
    where ai.id = invitation_id and app_private.owns_candidate_profile(ai.candidate_profile_id)
  ))
  with check (exists (
    select 1 from public.assessment_invitations as ai
    where ai.id = invitation_id and app_private.owns_candidate_profile(ai.candidate_profile_id)
  ));

create policy assessment_answers_candidate_select on public.assessment_answers
  for select to authenticated
  using (exists (
    select 1
    from public.assessment_attempts as aa
    join public.assessment_invitations as ai on ai.id = aa.invitation_id
    where aa.id = attempt_id and app_private.owns_candidate_profile(ai.candidate_profile_id)
  ));

create policy assessment_answers_member_select on public.assessment_answers
  for select to authenticated
  using (exists (
    select 1
    from public.assessment_attempts as aa
    join public.assessment_invitations as ai on ai.id = aa.invitation_id
    join public.applications as a on a.id = ai.application_id
    join public.jobs as j on j.id = a.job_id
    where aa.id = attempt_id and app_private.is_org_member(j.organization_id)
  ));

create policy assessment_answers_candidate_insert on public.assessment_answers
  for insert to authenticated
  with check (exists (
    select 1
    from public.assessment_attempts as aa
    join public.assessment_invitations as ai on ai.id = aa.invitation_id
    where aa.id = attempt_id
      and app_private.owns_candidate_profile(ai.candidate_profile_id)
      and aa.status = 'in_progress'
  ));

create policy assessment_answers_candidate_update on public.assessment_answers
  for update to authenticated
  using (exists (
    select 1
    from public.assessment_attempts as aa
    join public.assessment_invitations as ai on ai.id = aa.invitation_id
    where aa.id = attempt_id and app_private.owns_candidate_profile(ai.candidate_profile_id)
  ))
  with check (exists (
    select 1
    from public.assessment_attempts as aa
    join public.assessment_invitations as ai on ai.id = aa.invitation_id
    where aa.id = attempt_id
      and app_private.owns_candidate_profile(ai.candidate_profile_id)
      and aa.status = 'in_progress'
  ));
