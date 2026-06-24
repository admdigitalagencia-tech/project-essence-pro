
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS score_audit_notes text;

UPDATE public.tasks
SET impact = LEAST(5, GREATEST(0, ROUND(impact / 2.0)::int)),
    complexity = LEAST(5, GREATEST(0, ROUND(complexity / 2.0)::int)),
    strategic_relevance = LEAST(5, GREATEST(0, ROUND(strategic_relevance / 2.0)::int)),
    urgency = LEAST(5, GREATEST(0, ROUND(urgency / 2.0)::int)),
    evidence_score = LEAST(5, GREATEST(0, ROUND(evidence_score / 2.0)::int))
WHERE impact > 5 OR complexity > 5 OR strategic_relevance > 5 OR urgency > 5 OR evidence_score > 5;

ALTER TABLE public.tasks ALTER COLUMN impact SET DEFAULT 3;
ALTER TABLE public.tasks ALTER COLUMN complexity SET DEFAULT 3;
ALTER TABLE public.tasks ALTER COLUMN strategic_relevance SET DEFAULT 3;
ALTER TABLE public.tasks ALTER COLUMN urgency SET DEFAULT 3;
ALTER TABLE public.tasks ALTER COLUMN evidence_score SET DEFAULT 3;
