import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { FiltersBar } from "@/components/FiltersBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2 } from "lucide-react";
import { useFilters, applyFilters } from "@/lib/filters";
import { useTasks, useWorkOrigins, useProjects, useDataSources, usePlatforms } from "@/lib/queries";
import {
  TASK_CATEGORIES,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  classifyScore,
} from "@/lib/constants";
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

const NONE = "__none__";

type EditableTaskFields = {
  title: string;
  work_origin_id: string;
  platform_id: string;
  project_id: string;
  area: string;
  status: string;
  priority: string;
  task_date: string;
};

function TasksPage() {
  const { filters, update, reset } = useFilters();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const { data: platforms = [] } = usePlatforms();
  const { data: projects = [] } = useProjects();
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState<Record<string, EditableTaskFields>>({});
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const qc = useQueryClient();

  const lookup = useMemo(() => ({
    origin: Object.fromEntries(origins.map((o) => [o.id, o])),
    source: Object.fromEntries(sources.map((s) => [s.id, s])),
    platform: Object.fromEntries(platforms.map((p) => [p.id, p])),
    project: Object.fromEntries(projects.map((p) => [p.id, p])),
  }), [origins, sources, platforms, projects]);

  const filtered = useMemo(() => {
    const list = applyFilters(tasks, filters);
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((t) =>
      t.title.toLowerCase().includes(needle) ||
      (t.description ?? "").toLowerCase().includes(needle)
    );
  }, [tasks, filters, q]);

  useEffect(() => {
    setDrafts((current) => {
      const next: Record<string, EditableTaskFields> = {};
      tasks.forEach((task) => {
        next[task.id] = current[task.id] ?? {
          title: task.title,
          work_origin_id: task.work_origin_id ?? "",
          platform_id: task.platform_id ?? "",
          project_id: task.project_id ?? "",
          area: task.area ?? "",
          status: task.status,
          priority: task.priority,
          task_date: task.task_date ?? "",
        };
      });
      return next;
    });
  }, [tasks]);

  function patchDraft(taskId: string, patch: Partial<EditableTaskFields>) {
    setDrafts((current) => ({
      ...current,
      [taskId]: {
        ...current[taskId],
        ...patch,
      },
    }));
  }

  async function saveTask(taskId: string, patch?: Partial<EditableTaskFields>) {
    const currentDraft = drafts[taskId];
    if (!currentDraft) return;

    const nextDraft = patch ? { ...currentDraft, ...patch } : currentDraft;
    const title = nextDraft.title.trim();

    if (!title) {
      toast.error("Título não pode ficar vazio");
      setDrafts((current) => ({
        ...current,
        [taskId]: {
          ...nextDraft,
          title: currentDraft.title,
        },
      }));
      return;
    }

    setSavingIds((current) => [...new Set([...current, taskId])]);

    const { error } = await db
      .from("tasks")
      .update({
        title,
        work_origin_id: nextDraft.work_origin_id || null,
        platform_id: nextDraft.platform_id || null,
        project_id: nextDraft.project_id || null,
        area: nextDraft.area || null,
        status: nextDraft.status,
        priority: nextDraft.priority,
        task_date: nextDraft.task_date || null,
      })
      .eq("id", taskId);

    setSavingIds((current) => current.filter((id) => id !== taskId));

    if (error) {
      toast.error(error.message);
      return;
    }

    setDrafts((current) => ({
      ...current,
      [taskId]: nextDraft,
    }));
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

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
                <th className="text-left px-3 py-3 font-semibold">Plataforma</th>
                <th className="text-left px-3 py-3 font-semibold">Projeto</th>
                <th className="text-left px-3 py-3 font-semibold">Tipo</th>
                <th className="text-left px-3 py-3 font-semibold">Status</th>
                <th className="text-left px-3 py-3 font-semibold">Prio.</th>
                <th className="text-right px-3 py-3 font-semibold">Score</th>
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
                const c = classifyScore(t.quality_score ?? 0);
                const draft = drafts[t.id];
                const saving = savingIds.includes(t.id);
                if (!draft) return null;
                return (
                  <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 min-w-[240px] max-w-[360px]">
                      <Input
                        value={draft.title}
                        onChange={(e) => patchDraft(t.id, { title: e.target.value })}
                        onBlur={() => saveTask(t.id)}
                        className="h-9 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
                      />
                      {t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <CompactSelect
                        value={draft.platform_id || NONE}
                        placeholder="Selecionar"
                        onValueChange={(value) => {
                          const nextValue = value === NONE ? "" : value;
                          patchDraft(t.id, { platform_id: nextValue });
                          void saveTask(t.id, { platform_id: nextValue });
                        }}
                      >
                        <SelectItem value={NONE}>Sem plataforma</SelectItem>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            {platform.name}
                          </SelectItem>
                        ))}
                      </CompactSelect>
                    </td>
                    <td className="px-3 py-3">
                      <CompactSelect
                        value={draft.work_origin_id || NONE}
                        placeholder="Selecionar"
                        onValueChange={(value) => {
                          const nextValue = value === NONE ? "" : value;
                          patchDraft(t.id, { work_origin_id: nextValue, project_id: "" });
                          void saveTask(t.id, { work_origin_id: nextValue, project_id: "" });
                        }}
                      >
                        <SelectItem value={NONE}>Sem origem</SelectItem>
                        {origins.map((origin) => (
                          <SelectItem key={origin.id} value={origin.id}>
                            {origin.name}
                          </SelectItem>
                        ))}
                      </CompactSelect>
                    </td>
                    <td className="px-3 py-3">
                      <CompactSelect
                        value={draft.project_id || NONE}
                        placeholder="Selecionar"
                        onValueChange={(value) => {
                          const nextValue = value === NONE ? "" : value;
                          patchDraft(t.id, { project_id: nextValue });
                          void saveTask(t.id, { project_id: nextValue });
                        }}
                      >
                        <SelectItem value={NONE}>Sem projeto</SelectItem>
                        {projects
                          .filter((project) =>
                            !draft.work_origin_id || project.work_origin_id === draft.work_origin_id,
                          )
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </CompactSelect>
                    </td>
                    <td className="px-3 py-3">
                      <CompactSelect
                        value={draft.area || NONE}
                        placeholder="Selecionar"
                        onValueChange={(value) => {
                          const nextValue = value === NONE ? "" : value;
                          patchDraft(t.id, { area: nextValue });
                          void saveTask(t.id, { area: nextValue });
                        }}
                      >
                        <SelectItem value={NONE}>Sem tipo</SelectItem>
                        {TASK_CATEGORIES.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </CompactSelect>
                    </td>
                    <td className="px-3 py-3">
                      <CompactSelect
                        value={draft.status}
                        placeholder="Status"
                        triggerClassName="min-w-[140px]"
                        onValueChange={(value) => {
                          patchDraft(t.id, { status: value });
                          void saveTask(t.id, { status: value });
                        }}
                      >
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </CompactSelect>
                    </td>
                    <td className="px-3 py-3">
                      <CompactSelect
                        value={draft.priority}
                        placeholder="Prioridade"
                        triggerClassName={`min-w-[122px] ${priorityClasses(draft.priority)}`}
                        onValueChange={(value) => {
                          patchDraft(t.id, { priority: value });
                          void saveTask(t.id, { priority: value });
                        }}
                      >
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {PRIORITY_LABELS[priority]}
                          </SelectItem>
                        ))}
                      </CompactSelect>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${scoreClasses(c.tone)}`}>
                        {(t.quality_score ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                      <Input
                        type="date"
                        value={draft.task_date}
                        onChange={(e) => patchDraft(t.id, { task_date: e.target.value })}
                        onBlur={() => saveTask(t.id)}
                        className="h-9 min-w-[138px]"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(t.id)}
                        className="h-8 w-8"
                        disabled={saving}
                      >
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

function CompactSelect({
  value,
  placeholder,
  onValueChange,
  children,
  triggerClassName,
}: {
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`h-9 min-w-[132px] text-xs ${triggerClassName ?? ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
