update public.data_sources
set name = 'Lançamento Manual'
where lower(name) = 'manual';

update public.data_sources
set name = 'Importação CSV/TSV'
where lower(name) = 'csv';

with desired_sources(name) as (
  values
    ('Worklenz'),
    ('Lançamento Manual'),
    ('Importação CSV/TSV'),
    ('Planilha Excel (XLS/XLSX)'),
    ('JSON / API'),
    ('Google Sheets'),
    ('Google Calendar'),
    ('Gmail'),
    ('Obsidian'),
    ('Notion'),
    ('Codex'),
    ('GitHub'),
    ('ClickUp'),
    ('Trello'),
    ('Asana')
),
owners(owner_user_id) as (
  select distinct owner_user_id
  from public.data_sources
)
insert into public.data_sources (name, owner_user_id)
select desired_sources.name, owners.owner_user_id
from owners
cross join desired_sources
where not exists (
  select 1
  from public.data_sources existing
  where existing.owner_user_id is not distinct from owners.owner_user_id
    and lower(existing.name) = lower(desired_sources.name)
);
