alter table public.tasks
  alter column status set default 'todo',
  alter column priority set default 'medium',
  alter column impact set default 5,
  alter column complexity set default 5,
  alter column strategic_relevance set default 5,
  alter column urgency set default 5,
  alter column evidence_score set default 5;

alter table public.tasks
  add constraint tasks_impact_range_check check (impact between 0 and 10),
  add constraint tasks_complexity_range_check check (complexity between 0 and 10),
  add constraint tasks_strategic_relevance_range_check check (strategic_relevance between 0 and 10),
  add constraint tasks_urgency_range_check check (urgency between 0 and 10),
  add constraint tasks_evidence_score_range_check check (evidence_score between 0 and 10),
  add constraint tasks_estimated_time_non_negative_check check (estimated_time is null or estimated_time >= 0),
  add constraint tasks_actual_time_non_negative_check check (actual_time is null or actual_time >= 0),
  add constraint tasks_deadline_after_task_date_check check (deadline is null or task_date is null or deadline >= task_date),
  add constraint tasks_completed_at_after_task_date_check check (completed_at is null or task_date is null or completed_at >= task_date),
  add constraint tasks_completed_status_requires_date_check check (
    status is distinct from 'concluida' or completed_at is not null
  );

create index if not exists tasks_created_at_idx on public.tasks (created_at desc);
create index if not exists tasks_task_date_idx on public.tasks (task_date desc);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_work_origin_id_idx on public.tasks (work_origin_id);
