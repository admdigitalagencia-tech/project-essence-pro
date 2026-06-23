import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { FiltersBar } from "@/components/FiltersBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilters, applyFilters } from "@/lib/filters";
import { useTasks, useWorkOrigins, useProjects, useDataSources } from "@/lib/queries";
import {
  AREAS,
  TASK_TYPES,
  STATUSES,
  STATUS_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  classifyScore,
} from "@/lib/constants";
import { db, type Task } from "@/lib/db";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks · Lucas Productivity OS" }] }),
  component: TasksPage,
});

const NONE = "__none__";

type EditableTaskForm = {
  work_origin_id: string;
  data_source_id: string;
  project_id: string;
  title: string;
  description: string;
  area: string;
  channel: string;
  task_type: string;
  status: string;
  priority: string;
  task_date: string;
  deadline: string;
  completed_at: string;
  estimated_time: string;
  actual_time: string;
  evidence: string;
  result: string;
};

function TasksPage() {
  const navigate = useNavigate();
  const { filters, update, reset } = useFilters();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const { data: projects = [] } = useProjects();
  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<EditableTaskForm | null>(null);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const qc = useQueryClient();

  const lookup = useMemo(
    () => ({
      origin: Object.fromEntries(origins.map((origin) => [origin.id, origin])),
      source: Object.fromEntries(sources.map((source) => [source.id, source])),
      project: Object.fromEntries(projects.map((project) => [project.id, project])),
    }),
    [origins, projects, sources],
  );

  const filtered = useMemo(() => {
    const list = applyFilters(tasks, filters);
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (task) =>
        task.title.toLowerCase().includes(needle) ||
        (task.description ?? "").toLowerCase().includes(needle),
    );
  }, [tasks, filters, q]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((task) => selectedIds.includes(task.id));

  function toggleSelection(taskId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, taskId])] : current.filter((id) => id !== taskId),
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? filtered.map((task) => task.id) : []);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setEditForm({
      work_origin_id: task.work_origin_id ?? "",
      data_source_id: task.data_source_id ?? "",
      project_id: task.project_id ?? "",
      title: task.title,
      description: task.description ?? "",
      area: task.area ?? "",
      channel: task.channel ?? "",
      task_type: task.task_type ?? "",
      status: task.status ?? "todo",
      priority: task.priority ?? "medium",
      task_date: task.task_date ?? "",
      deadline: task.deadline ?? "",
      completed_at: task.completed_at ?? "",
      estimated_time:
        task.estimated_time !== null && task.estimated_time !== undefined
          ? String(task.estimated_time)
          : "",
      actual_time:
        task.actual_time !== null && task.actual_time !== undefined ? String(task.actual_time) : "",
      evidence: task.evidence ?? "",
      result: task.result ?? "",
    });
  }

  function closeEdit() {
    setEditingTask(null);
    setEditForm(null);
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta task?")) return;
    const { error } = await db.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task excluida");
    setSelectedIds((current) => current.filter((taskId) => taskId !== id));
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  async function saveEdit() {
    if (!editingTask || !editForm) return;
    if (!editForm.title.trim()) {
      toast.error("Informe um titulo");
      return;
    }

    setSaveBusy(true);
    const { error } = await db
      .from("tasks")
      .update({
        work_origin_id: editForm.work_origin_id || null,
        data_source_id: editForm.data_source_id || null,
        project_id: editForm.project_id || null,
        title: editForm.title.trim(),
        description: editForm.description || null,
        area: editForm.area || null,
        channel: editForm.channel || null,
        task_type: editForm.task_type || null,
        status: editForm.status,
        priority: editForm.priority,
        task_date: editForm.task_date || null,
        deadline: editForm.deadline || null,
        completed_at: editForm.completed_at || null,
        estimated_time: editForm.estimated_time ? Number(editForm.estimated_time) : null,
        actual_time: editForm.actual_time ? Number(editForm.actual_time) : null,
        evidence: editForm.evidence || null,
        result: editForm.result || null,
      })
      .eq("id", editingTask.id);

    setSaveBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Task atualizada");
    qc.invalidateQueries({ queryKey: ["tasks"] });
    closeEdit();
  }

  async function runBulkUpdate() {
    if (selectedIds.length === 0) {
      toast.error("Selecione ao menos uma task");
      return;
    }

    const patch: Record<string, string> = {};
    if (bulkStatus) patch.status = bulkStatus;
    if (bulkPriority) patch.priority = bulkPriority;

    if (Object.keys(patch).length === 0) {
      toast.error("Escolha status e/ou prioridade para atualizar");
      return;
    }

    setBulkBusy(true);
    const { error } = await db.from("tasks").update(patch).in("id", selectedIds);
    setBulkBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${selectedIds.length} tasks atualizadas`);
    setBulkStatus("");
    setBulkPriority("");
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  async function runBulkDelete() {
    if (selectedIds.length === 0) {
      toast.error("Selecione ao menos uma task");
      return;
    }

    if (!confirm(`Excluir ${selectedIds.length} tasks selecionadas?`)) return;

    setBulkBusy(true);
    const { error } = await db.from("tasks").delete().in("id", selectedIds);
    setBulkBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${selectedIds.length} tasks excluidas`);
    setSelectedIds([]);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        subtitle="Todas as tasks de todas as origens"
        action={
          <Button type="button" onClick={() => navigate({ to: "/tasks/nova" })}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nova task
          </Button>
        }
      />
      <FiltersBar filters={filters} update={update} reset={reset} />

      <Card className="border-border/60 shadow-none overflow-hidden">
        <div className="p-3 border-b border-border/60 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <Input
              placeholder="Buscar por titulo ou descricao..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="max-w-md"
            />
            <div className="text-xs text-muted-foreground">
              {selectedIds.length > 0
                ? `${selectedIds.length} task(s) selecionada(s)`
                : `${filtered.length} task(s) visiveis`}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <Select
                value={bulkStatus || NONE}
                onValueChange={(value) => setBulkStatus(value === NONE ? "" : value)}
              >
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Status em lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Manter status</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={bulkPriority || NONE}
                onValueChange={(value) => setBulkPriority(value === NONE ? "" : value)}
              >
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Prioridade em lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Manter prioridade</SelectItem>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button onClick={runBulkUpdate} disabled={bulkBusy}>
                  Salvar em lote
                </Button>
                <Button variant="destructive" onClick={runBulkDelete} disabled={bulkBusy}>
                  Excluir selecionadas
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium w-10">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    aria-label="Selecionar todas"
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-medium">Titulo</th>
                <th className="text-left px-3 py-2.5 font-medium">Origem</th>
                <th className="text-left px-3 py-2.5 font-medium">Projeto</th>
                <th className="text-left px-3 py-2.5 font-medium">Area</th>
                <th className="text-left px-3 py-2.5 font-medium">Tipo</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-left px-3 py-2.5 font-medium">Prio.</th>
                <th className="text-right px-3 py-2.5 font-medium">Score</th>
                <th className="text-left px-3 py-2.5 font-medium">Data</th>
                <th className="text-right px-3 py-2.5 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-muted-foreground">
                    Nenhuma task encontrada.
                  </td>
                </tr>
              )}
              {filtered.map((task) => {
                const scoreStyle = classifyScore(task.quality_score ?? 0);
                const checked = selectedIds.includes(task.id);

                return (
                  <tr key={task.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleSelection(task.id, value === true)}
                        aria-label={`Selecionar ${task.title}`}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {task.work_origin_id ? lookup.origin[task.work_origin_id]?.name : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {task.project_id ? lookup.project[task.project_id]?.name : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs">{task.area ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{task.task_type ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {STATUS_LABELS[task.status ?? ""] ?? task.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {PRIORITY_LABELS[task.priority ?? ""] ?? task.priority}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                          scoreStyle.tone === "success"
                            ? "bg-success/15 text-success"
                            : scoreStyle.tone === "primary"
                              ? "bg-primary/10 text-primary"
                              : scoreStyle.tone === "warning"
                                ? "bg-warning/20 text-warning-foreground"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {(task.quality_score ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {task.task_date ?? task.created_at.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(task)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(task.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editingTask && !!editForm} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar task</DialogTitle>
            <DialogDescription>
              Atualize os dados principais da task diretamente pela tabela operacional.
            </DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField label="Titulo">
                <Input
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, title: event.target.value } : current,
                    )
                  }
                />
              </FormField>

              <FormField label="Projeto/Cliente">
                <Select
                  value={editForm.project_id || NONE}
                  onValueChange={(value) =>
                    setEditForm((current) =>
                      current ? { ...current, project_id: value === NONE ? "" : value } : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Origem do trabalho">
                <Select
                  value={editForm.work_origin_id || NONE}
                  onValueChange={(value) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, work_origin_id: value === NONE ? "" : value }
                        : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {origins.map((origin) => (
                      <SelectItem key={origin.id} value={origin.id}>
                        {origin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Fonte de dados">
                <Select
                  value={editForm.data_source_id || NONE}
                  onValueChange={(value) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, data_source_id: value === NONE ? "" : value }
                        : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Status">
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((current) => (current ? { ...current, status: value } : current))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Prioridade">
                <Select
                  value={editForm.priority}
                  onValueChange={(value) =>
                    setEditForm((current) => (current ? { ...current, priority: value } : current))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {PRIORITY_LABELS[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Area">
                <Select
                  value={editForm.area || NONE}
                  onValueChange={(value) =>
                    setEditForm((current) =>
                      current ? { ...current, area: value === NONE ? "" : value } : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Tipo de task">
                <Select
                  value={editForm.task_type || NONE}
                  onValueChange={(value) =>
                    setEditForm((current) =>
                      current ? { ...current, task_type: value === NONE ? "" : value } : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {TASK_TYPES.map((taskType) => (
                      <SelectItem key={taskType} value={taskType}>
                        {taskType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Canal">
                <Input
                  value={editForm.channel}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, channel: event.target.value } : current,
                    )
                  }
                />
              </FormField>

              <FormField label="Data da task">
                <Input
                  type="date"
                  value={editForm.task_date}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, task_date: event.target.value } : current,
                    )
                  }
                />
              </FormField>

              <FormField label="Prazo">
                <Input
                  type="date"
                  value={editForm.deadline}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, deadline: event.target.value } : current,
                    )
                  }
                />
              </FormField>

              <FormField label="Conclusao">
                <Input
                  type="date"
                  value={editForm.completed_at}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, completed_at: event.target.value } : current,
                    )
                  }
                />
              </FormField>

              <FormField label="Tempo estimado (h)">
                <Input
                  type="number"
                  step="0.25"
                  value={editForm.estimated_time}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, estimated_time: event.target.value } : current,
                    )
                  }
                />
              </FormField>

              <FormField label="Tempo real (h)">
                <Input
                  type="number"
                  step="0.25"
                  value={editForm.actual_time}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, actual_time: event.target.value } : current,
                    )
                  }
                />
              </FormField>

              <div className="lg:col-span-2">
                <FormField label="Descricao">
                  <Textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, description: event.target.value } : current,
                      )
                    }
                  />
                </FormField>
              </div>

              <div className="lg:col-span-2">
                <FormField label="Evidencia">
                  <Textarea
                    rows={2}
                    value={editForm.evidence}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, evidence: event.target.value } : current,
                      )
                    }
                  />
                </FormField>
              </div>

              <div className="lg:col-span-2">
                <FormField label="Resultado gerado">
                  <Textarea
                    rows={2}
                    value={editForm.result}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, result: event.target.value } : current,
                      )
                    }
                  />
                </FormField>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={saveBusy}>
              {saveBusy ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
