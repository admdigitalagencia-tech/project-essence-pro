import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { FiltersBar } from "@/components/FiltersBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { useFilters, applyFilters } from "@/lib/filters";
import { useTasks, useWorkOrigins, useProjects, useDataSources } from "@/lib/queries";
import { STATUS_LABELS, PRIORITY_LABELS, classifyScore } from "@/lib/constants";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks/")({
  head: () => ({ meta: [{ title: "Tasks · Lucas Productivity OS" }] }),
  component: TasksPage,
});

function scoreClasses(tone: string) {
  if (tone === "success") return "bg-success/15 text-success";
  if (tone === "primary") return "bg-primary/10 text-primary";
  if (tone === "warning") return "bg-warning/25 text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "concluida") return "default";
  if (status === "bloqueado" || status === "cancelada") return "destructive";
  if (status === "doing") return "secondary";
  return "outline";
}

function priorityClasses(p: string) {
  if (p === "high") return "bg-destructive/10 text-destructive border-destructive/30";
  if (p === "medium") return "bg-warning/20 text-warning-foreground border-warning/40";
  return "bg-muted text-muted-foreground border-border";
}

function TasksPage() {
  const { filters, update, reset } = useFilters();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const { data: projects = [] } = useProjects();
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const lookup = useMemo(() => ({
    origin: Object.fromEntries(origins.map((o) => [o.id, o])),
    source: Object.fromEntries(sources.map((s) => [s.id, s])),
    project: Object.fromEntries(projects.map((p) => [p.id, p])),
  }), [origins, sources, projects]);

  const filtered = useMemo(() => {
    const list = applyFilters(tasks, filters);
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((t) =>
      t.title.toLowerCase().includes(needle) ||
      (t.description ?? "").toLowerCase().includes(needle)
    );
  }, [tasks, filters, q]);

  async function remove(id: string) {
    if (!confirm("Excluir esta task?")) return;
    const { error } = await db.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Task excluída"); qc.invalidateQueries({ queryKey: ["tasks"] }); }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        subtitle={`${filtered.length} ${filtered.length === 1 ? "task encontrada" : "tasks encontradas"}`}
        action={<Button asChild><Link to="/tasks/nova"><Plus className="h-4 w-4 mr-1.5" />Nova task</Link></Button>}
      />
      <FiltersBar filters={filters} update={update} reset={reset} />

      <Card className="border-border/70 shadow-[var(--shadow-card)] overflow-hidden gap-0 py-0">
        <div className="p-3 sm:p-4 border-b border-border/70">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou descrição…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Título</th>
                <th className="text-left px-3 py-3 font-semibold">Origem</th>
                <th className="text-left px-3 py-3 font-semibold">Projeto</th>
                <th className="text-left px-3 py-3 font-semibold">Área</th>
                <th className="text-left px-3 py-3 font-semibold">Status</th>
                <th className="text-left px-3 py-3 font-semibold">Prio.</th>
                <th className="text-right px-3 py-3 font-semibold">Score</th>
                <th className="text-left px-3 py-3 font-semibold">Data</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Carregando…</td></tr>}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">Nenhuma task encontrada.</td></tr>
              )}
              {filtered.map((t) => {
                const c = classifyScore(t.quality_score ?? 0);
                return (
                  <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 min-w-[240px] max-w-[360px]">
                      <div className="font-medium truncate">{t.title}</div>
                      {t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">{t.work_origin_id ? lookup.origin[t.work_origin_id]?.name : "—"}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap max-w-[160px] truncate">{t.project_id ? lookup.project[t.project_id]?.name : "—"}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">{t.area ?? "—"}</td>
                    <td className="px-3 py-3"><Badge variant={statusVariant(t.status)} className="text-[10px] font-medium">{STATUS_LABELS[t.status] ?? t.status}</Badge></td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${priorityClasses(t.priority)}`}>
                        {PRIORITY_LABELS[t.priority] ?? t.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${scoreClasses(c.tone)}`}>
                        {(t.quality_score ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">{t.task_date ?? t.created_at.slice(0,10)}</td>
                    <td className="px-2 py-3">
                      <Button size="icon" variant="ghost" onClick={() => remove(t.id)} className="h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border/60">
          {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma task encontrada.</div>
          )}
          {filtered.map((t) => {
            const c = classifyScore(t.quality_score ?? 0);
            return (
              <div key={t.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{t.title}</div>
                    {t.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</div>}
                  </div>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${scoreClasses(c.tone)}`}>
                    {(t.quality_score ?? 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <Badge variant={statusVariant(t.status)}>{STATUS_LABELS[t.status] ?? t.status}</Badge>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium border ${priorityClasses(t.priority)}`}>
                    {PRIORITY_LABELS[t.priority] ?? t.priority}
                  </span>
                  {t.work_origin_id && <Badge variant="outline">{lookup.origin[t.work_origin_id]?.name}</Badge>}
                  {t.project_id && <Badge variant="outline">{lookup.project[t.project_id]?.name}</Badge>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t.task_date ?? t.created_at.slice(0,10)}</span>
                  <button onClick={() => remove(t.id)} className="text-destructive flex items-center gap-1 hover:underline">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </PageContainer>
  );
}
