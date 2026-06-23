create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create unique index if not exists platforms_owner_name_idx
  on public.platforms (owner_user_id, lower(name));

create index if not exists platforms_owner_user_id_idx
  on public.platforms (owner_user_id);

alter table public.platforms enable row level security;

grant select, insert, update, delete on public.platforms to authenticated;
grant all on public.platforms to service_role;
revoke all on public.platforms from anon;

drop policy if exists "users own platforms" on public.platforms;
create policy "users own platforms"
on public.platforms
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

alter table public.tasks
add column if not exists platform_id uuid references public.platforms(id) on delete set null;

create index if not exists tasks_platform_id_idx on public.tasks (platform_id);

insert into public.platforms (name, owner_user_id)
select seeded.name, users.owner_user_id
from (
  values
    ('Google Ads'),
    ('Meta Ads'),
    ('Google Tag Manager'),
    ('GA4'),
    ('Google Sheets'),
    ('Looker Studio'),
    ('WordPress'),
    ('HighLevel'),
    ('Notion'),
    ('GitHub'),
    ('Codex')
) as seeded(name)
cross join (
  select distinct owner_user_id
  from public.work_origins
  where owner_user_id is not null
) as users
where not exists (
  select 1
  from public.platforms existing
  where existing.owner_user_id = users.owner_user_id
    and lower(existing.name) = lower(seeded.name)
);
