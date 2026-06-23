import { useMemo, useState } from "react";
import type { Task } from "./db";
import { AREAS, PRIORITIES, STATUSES } from "./constants";

export type Filters = {
  period: "all" | "7d" | "30d" | "90d";
  sortDate: "desc" | "asc";
  work_origin_id: string;
  data_source_id: string;
  project_id: string;
  area: string;
  status: string;
  priority: string;
  impactMin: number;
  complexityMin: number;
};

export const initialFilters: Filters = {
  period: "all",
  sortDate: "desc",
  work_origin_id: "",
  data_source_id: "",
  project_id: "",
  area: "",
  status: "",
  priority: "",
  impactMin: 0,
  complexityMin: 0,
};

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters(initialFilters);
  return { filters, update, reset };
}

export function applyFilters(tasks: Task[], f: Filters): Task[] {
  let cutoff: Date | null = null;
  if (f.period !== "all") {
    const days = f.period === "7d" ? 7 : f.period === "30d" ? 30 : 90;
    cutoff = new Date(Date.now() - days * 86400000);
  }
  return tasks.filter((t) => {
    if (cutoff) {
      const d = new Date(t.task_date ?? t.created_at);
      if (d < cutoff) return false;
    }
    if (f.work_origin_id && t.work_origin_id !== f.work_origin_id) return false;
    if (f.data_source_id && t.data_source_id !== f.data_source_id) return false;
    if (f.project_id && t.project_id !== f.project_id) return false;
    if (f.area && t.area !== f.area) return false;
    if (f.status && t.status !== f.status) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.impactMin && (t.impact ?? 0) < f.impactMin) return false;
    if (f.complexityMin && (t.complexity ?? 0) < f.complexityMin) return false;
    return true;
  }).sort((a, b) => {
    const left = new Date(a.task_date ?? a.created_at).getTime();
    const right = new Date(b.task_date ?? b.created_at).getTime();
    return f.sortDate === "asc" ? left - right : right - left;
  });
}

export { AREAS, PRIORITIES, STATUSES };
