import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { FiltersBar } from "@/components/FiltersBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useFilters, applyFilters } from "@/lib/filters";
import { useTasks, useWorkOrigins, useProjects, useDataSources } from "@/lib/queries";
import { STATUS_LABELS, PRIORITY_LABELS, classifyScore } from "@/lib/constants";
import { db, type Task } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { auditTasksBatch } from "@/lib/audit.functions";
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
  if (p === "high" || p === "critical") return "bg-destructive/10 text-destructive border-destructive/30";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const qc = useQueryClient();
  const auditBatch = useServerFn(auditTasksBatch);

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

  async function runRecalculate() {
    setConfirmOpen(false);
    if (filtered.length === 0) { toast.info("Nenhuma task no filtro atual."); return; }
    setAuditing(true);
    const toastId = toast.loading(`Auditando ${filtered.length} task(s)…`);
    try {
      const payload = filtered.map((t: Task) => ({
        id: t.id,
        title: t.title, description: t.description, area: t.area,
        channel: t.channel, task_type: t.task_type, status: t.status,
        priority: t.priority, evidence: t.evidence, result: t.result,
        project_id: t.project_id, data_source_id: t.data_source_id,
        work_origin_id: t.work_origin_id, deadline: t.deadline,
        completed_at: t.completed_at, task_date: t.task_date,
        estimated_time: t.estimated_time, actual_time: t.actual_time,
      }));
      // chunk to avoid huge single calls
      const CHUNK = 8;
      let done = 0;
      for (let i = 0; i < payload.length; i += CHUNK) {
        const slice = payload.slice(i, i + CHUNK);
        const results = await auditBatch({ data: { tasks: slice } });
        for (const r of results) {
          await db.from("tasks").update({
            impact: r.impact,
            complexity: r.complexity,
            strategic_relevance: r.strategic_relevance,
            urgency: r.urgency,
            evidence_score: r.evidence_score,
            score_audit_notes: r.notes,
          }).eq("id", r.id);
        }
        done += slice.length;
        toast.loading(`Auditando ${done}/${payload.length}…`, { id: toastId });
      }
      toast.success(`Scores recalculados em ${payload.length} task(s).`, { id: toastId });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Falha na auditoria.", { id: toastId });
    } finally {
      setAuditing(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        subtitle={`${filtered.length} ${filtered.length === 1 ? "task encontrada" : "tasks encontradas"}`}
        action={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(true)} disabled={auditing || isLoading}>
              {auditing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
              Recalcular scores
            </Button>
            <Button asChild><Link to="/tasks/nova"><Plus className="h-4 w-4 mr-1.5" />Nova task</Link></Button>
          </>
        }
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
          <TooltipProvider delayDuration={150}>
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
                  <th className="text-left px-3 py-3 font-semibold">Classificação</th>
                  <th className="text-left px-3 py-3 font-semibold">Data</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Carregando…</td></tr>}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">Nenhuma task encontrada.</td></tr>
                )}
                {filtered.map((t) => {
                  const score = t.quality_score ?? 0;
                  const c = classifyScore(score);
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums cursor-help ${scoreClasses(c.tone)}`}>
                              {score.toFixed(2)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            <FactorBreakdown task={t} />
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap text-muted-foreground">{c.label}</td>
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
          </TooltipProvider>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border/60">
          {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma task encontrada.</div>
          )}
          {filtered.map((t) => {
            const score = t.quality_score ?? 0;
            const c = classifyScore(score);
            return (
              <div key={t.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{t.title}</div>
                    {t.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</div>}
                  </div>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${scoreClasses(c.tone)}`}>
                    {score.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">{c.label}</div>
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular scores</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá atualizar impacto, complexidade, relevância estratégica, urgência, evidência e
              score das <strong>{filtered.length}</strong> task(s) atualmente filtradas. A IA será usada
              quando disponível; caso contrário, será aplicada a heurística local. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={runRecalculate}>Sim, recalcular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function FactorBreakdown({ task }: { task: Task }) {
  const rows: [string, number][] = [
    ["Impacto (30%)", task.impact ?? 0],
    ["Complexidade (20%)", task.complexity ?? 0],
    ["Estratégia (20%)", task.strategic_relevance ?? 0],
    ["Urgência (15%)", task.urgency ?? 0],
    ["Evidência (15%)", task.evidence_score ?? 0],
  ];
  const notes = (task as Task & { score_audit_notes?: string | null }).score_audit_notes;
  return (
    <div className="space-y-1 min-w-[180px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-semibold tabular-nums">{v} / 5</span>
        </div>
      ))}
      {notes && <div className="pt-1.5 mt-1.5 border-t border-border/50 text-[11px] text-muted-foreground max-w-[260px]">{notes}</div>}
    </div>
  );
}
