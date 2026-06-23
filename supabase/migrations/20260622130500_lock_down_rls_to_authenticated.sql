revoke all on public.work_origins from anon;
revoke all on public.data_sources from anon;
revoke all on public.projects from anon;
revoke all on public.tasks from anon;
revoke all on public.imports from anon;
revoke all on public.weekly_reports from anon;

grant select, insert, update, delete on public.work_origins to authenticated;
grant select, insert, update, delete on public.data_sources to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.imports to authenticated;
grant select, insert, update, delete on public.weekly_reports to authenticated;

drop policy if exists "open access work_origins" on public.work_origins;
drop policy if exists "open access data_sources" on public.data_sources;
drop policy if exists "open access projects" on public.projects;
drop policy if exists "open access tasks" on public.tasks;
drop policy if exists "open access imports" on public.imports;
drop policy if exists "open access weekly_reports" on public.weekly_reports;

create policy "authenticated access work_origins"
on public.work_origins
for all
to authenticated
using (true)
with check (true);

create policy "authenticated access data_sources"
on public.data_sources
for all
to authenticated
using (true)
with check (true);

create policy "authenticated access projects"
on public.projects
for all
to authenticated
using (true)
with check (true);

create policy "authenticated access tasks"
on public.tasks
for all
to authenticated
using (true)
with check (true);

create policy "authenticated access imports"
on public.imports
for all
to authenticated
using (true)
with check (true);

create policy "authenticated access weekly_reports"
on public.weekly_reports
for all
to authenticated
using (true)
with check (true);
