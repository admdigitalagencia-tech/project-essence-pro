alter table public.work_origins add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.data_sources add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.projects add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.tasks add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.imports add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.weekly_reports add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

alter table public.work_origins alter column owner_user_id set default auth.uid();
alter table public.data_sources alter column owner_user_id set default auth.uid();
alter table public.projects alter column owner_user_id set default auth.uid();
alter table public.tasks alter column owner_user_id set default auth.uid();
alter table public.imports alter column owner_user_id set default auth.uid();
alter table public.weekly_reports alter column owner_user_id set default auth.uid();

create index if not exists work_origins_owner_user_id_idx on public.work_origins (owner_user_id);
create index if not exists data_sources_owner_user_id_idx on public.data_sources (owner_user_id);
create index if not exists projects_owner_user_id_idx on public.projects (owner_user_id);
create index if not exists tasks_owner_user_id_idx on public.tasks (owner_user_id);
create index if not exists imports_owner_user_id_idx on public.imports (owner_user_id);
create index if not exists weekly_reports_owner_user_id_idx on public.weekly_reports (owner_user_id);

create or replace function public.claim_legacy_records()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.work_origins set owner_user_id = current_user_id where owner_user_id is null;
  update public.data_sources set owner_user_id = current_user_id where owner_user_id is null;
  update public.projects set owner_user_id = current_user_id where owner_user_id is null;
  update public.tasks set owner_user_id = current_user_id where owner_user_id is null;
  update public.imports set owner_user_id = current_user_id where owner_user_id is null;
  update public.weekly_reports set owner_user_id = current_user_id where owner_user_id is null;
end;
$$;

grant execute on function public.claim_legacy_records() to authenticated;

drop policy if exists "authenticated access work_origins" on public.work_origins;
drop policy if exists "authenticated access data_sources" on public.data_sources;
drop policy if exists "authenticated access projects" on public.projects;
drop policy if exists "authenticated access tasks" on public.tasks;
drop policy if exists "authenticated access imports" on public.imports;
drop policy if exists "authenticated access weekly_reports" on public.weekly_reports;

create policy "users own work_origins"
on public.work_origins
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "users own data_sources"
on public.data_sources
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "users own projects"
on public.projects
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "users own tasks"
on public.tasks
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "users own imports"
on public.imports
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "users own weekly_reports"
on public.weekly_reports
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
