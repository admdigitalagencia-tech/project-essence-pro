import { supabase } from "@/integrations/supabase/client";

// We use untyped client because generated types lag behind the migration.
// All app tables are accessed via this thin wrapper.
export const db = supabase as unknown as {
  from: (table: string) => any;
};

export type WorkOrigin = { id: string; name: string; color: string | null };
export type DataSource = { id: string; name: string };
export type Platform = { id: string; name: string };
export type Project = {
  id: string; name: string; client: string | null;
  work_origin_id: string | null; status: string | null; notes: string | null;
};
export type Task = {
  id: string;
  work_origin_id: string | null;
  data_source_id: string | null;
  platform_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  area: string | null;
  channel: string | null;
  task_type: string | null;
  status: string;
  priority: string;
  impact: number;
  complexity: number;
  strategic_relevance: number;
  urgency: number;
  evidence_score: number;
  evidence: string | null;
  result: string | null;
  task_date: string | null;
  deadline: string | null;
  completed_at: string | null;
  estimated_time: number | null;
  actual_time: number | null;
  quality_score: number;
  created_at: string;
};
