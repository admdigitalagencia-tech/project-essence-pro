
-- Work origins
CREATE TABLE public.work_origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_origins TO anon, authenticated;
GRANT ALL ON public.work_origins TO service_role;
ALTER TABLE public.work_origins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access work_origins" ON public.work_origins FOR ALL USING (true) WITH CHECK (true);

-- Data sources
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_sources TO anon, authenticated;
GRANT ALL ON public.data_sources TO service_role;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access data_sources" ON public.data_sources FOR ALL USING (true) WITH CHECK (true);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  work_origin_id UUID REFERENCES public.work_origins(id) ON DELETE SET NULL,
  client TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_origin_id UUID REFERENCES public.work_origins(id) ON DELETE SET NULL,
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT,
  channel TEXT,
  task_type TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  impact INT DEFAULT 5,
  complexity INT DEFAULT 5,
  strategic_relevance INT DEFAULT 5,
  urgency INT DEFAULT 5,
  evidence_score INT DEFAULT 5,
  evidence TEXT,
  result TEXT,
  task_date DATE,
  deadline DATE,
  completed_at DATE,
  estimated_time NUMERIC,
  actual_time NUMERIC,
  quality_score NUMERIC GENERATED ALWAYS AS (
    (COALESCE(impact,0) * 0.30) +
    (COALESCE(complexity,0) * 0.20) +
    (COALESCE(strategic_relevance,0) * 0.20) +
    (COALESCE(urgency,0) * 0.15) +
    (COALESCE(evidence_score,0) * 0.15)
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon, authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Imports
CREATE TABLE public.imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_origin_id UUID REFERENCES public.work_origins(id) ON DELETE SET NULL,
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  filename TEXT,
  rows_imported INT DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imports TO anon, authenticated;
GRANT ALL ON public.imports TO service_role;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access imports" ON public.imports FOR ALL USING (true) WITH CHECK (true);

-- Weekly reports
CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  scope TEXT DEFAULT 'global',
  scope_ref UUID,
  summary TEXT,
  highlights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_reports TO anon, authenticated;
GRANT ALL ON public.weekly_reports TO service_role;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access weekly_reports" ON public.weekly_reports FOR ALL USING (true) WITH CHECK (true);

-- Seed work origins
INSERT INTO public.work_origins (name, color) VALUES
  ('Blue Bolt', '#3b82f6'),
  ('ADM Digital', '#8b5cf6'),
  ('Projetos Pessoais', '#10b981'),
  ('Estudos', '#f59e0b'),
  ('Administrativo', '#64748b');

-- Seed data sources
INSERT INTO public.data_sources (name) VALUES
  ('Worklenz'),('CSV'),('Manual'),('Google Calendar'),('Gmail'),('Obsidian'),('Codex'),('GitHub');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
