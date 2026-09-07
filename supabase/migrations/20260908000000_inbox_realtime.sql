-- Keep the inbox REST API as the source of truth and publish message inserts
-- for the Supabase Realtime client used by src/app/messages/page.tsx.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
