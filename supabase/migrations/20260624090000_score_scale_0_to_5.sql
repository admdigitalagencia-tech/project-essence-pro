alter table public.tasks
  alter column impact set default 3,
  alter column complexity set default 3,
  alter column strategic_relevance set default 3,
  alter column urgency set default 3,
  alter column evidence_score set default 3;

alter table public.tasks
drop column if exists quality_score;

alter table public.tasks
add column quality_score numeric generated always as (
  least(
    5,
    greatest(
      0,
      (coalesce(impact, 0) * 0.30) +
      (coalesce(complexity, 0) * 0.20) +
      (coalesce(strategic_relevance, 0) * 0.20) +
      (coalesce(urgency, 0) * 0.15) +
      (coalesce(evidence_score, 0) * 0.15)
    )
  )
) stored;
