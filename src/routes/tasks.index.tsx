import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { FiltersBar } from "@/components/FiltersBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useFilters, applyFilters } from "@/lib/filters";
import { useTasks, useWorkOrigins, useProjects, useDataSources } from "@/lib/queries";
import { STATUS_LABELS, PRIORITY_LABELS, classifyScore } from "@/lib/constants";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks · Lucas Productivity OS" }] }),
  component: TasksPage,
});

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
        subtitle="Todas as tasks de todas as origens"
        action={<Button asChild><Link to="/tasks/nova"><Plus className="h-4 w-4 mr-1.5" />Nova task</Link></Button>}
      />
      <FiltersBar filters={filters} update={update} reset={reset} />

      <Card className="border-border/60 shadow-none overflow-hidden">
        <div className="p-3 border-b border-border/60">
          <Input placeholder="Buscar por título ou descrição…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Título</th>
                <th className="text-left px-3 py-2.5 font-medium">Origem</th>
                <th className="text-left px-3 py-2.5 font-medium">Projeto</th>
                <th className="text-left px-3 py-2.5 font-medium">Área</th>
                <th className="text-left px-3 py-2.5 font-medium">Tipo</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-left px-3 py-2.5 font-medium">Prio.</th>
                <th className="text-right px-3 py-2.5 font-medium">Score</th>
                <th className="text-left px-3 py-2.5 font-medium">Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Nenhuma task encontrada.</td></tr>
              )}
              {filtered.map((t) => {
                const c = classifyScore(t.quality_score ?? 0);
                return (
                  <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{t.title}</div>
                      {t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-xs">{t.work_origin_id ? lookup.origin[t.work_origin_id]?.name : "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{t.project_id ? lookup.project[t.project_id]?.name : "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{t.area ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{t.task_type ?? "—"}</td>
                    <td className="px-3 py-2.5"><Badge variant="outline" className="text-[10px]">{STATUS_LABELS[t.status] ?? t.status}</Badge></td>
                    <td className="px-3 py-2.5 text-xs">{PRIORITY_LABELS[t.priority] ?? t.priority}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                        c.tone === "success" ? "bg-success/15 text-success" :
                        c.tone === "primary" ? "bg-primary/10 text-primary" :
                        c.tone === "warning" ? "bg-warning/20 text-warning-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>{(t.quality_score ?? 0).toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{t.task_date ?? t.created_at.slice(0,10)}</td>
                    <td className="px-3 py-2.5">
                      <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
