import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, useTasks, useWorkOrigins } from "@/lib/queries";
import { AREAS, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS, classifyScore } from "@/lib/constants";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, FolderKanban, ListChecks, ShieldCheck, Star, Target, Trophy } from "lucide-react";

export const Route = createFileRoute("/blue-bolt")({
  head: () => ({ meta: [{ title: "Painel Blue Bolt · Lucas Productivity OS" }] }),
  component: BlueBoltManagerPage,
});

const ANY = "__any__";
const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

type ManagerFilters = {
  period: "all" | "7d" | "30d" | "90d";
  date_from: string;
  date_to: string;
  project_id: string;
  area: string;
  status: string;
  priority: string;
};

const initialManagerFilters: ManagerFilters = {
  period: "all",
  date_from: "",
  date_to: "",
  project_id: "",
  area: "",
  status: "",
  priority: "",
};

function BlueBoltManagerPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: origins = [] } = useWorkOrigins();
  const { data: projects = [] } = useProjects();
  const [filters, setFilters] = useState<ManagerFilters>(initialManagerFilters);

  const blueBoltOrigin = useMemo(
    () => origins.find((origin) => origin.name.toLowerCase() === "blue bolt"),
    [origins],
  );

  const blueBoltTasks = useMemo(() => {
    if (!blueBoltOrigin) return [];
    return tasks.filter((task) => task.work_origin_id === blueBoltOrigin.id);
  }, [blueBoltOrigin, tasks]);

  const blueBoltProjects = useMemo(() => {
    if (!blueBoltOrigin) return [];
    return projects
      .filter((project) => project.work_origin_id === blueBoltOrigin.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [blueBoltOrigin, projects]);

  const filtered = useMemo(() => applyManagerFilters(blueBoltTasks, filters), [blueBoltTasks, filters]);

  const metrics = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((task) => task.status === "concluida").length;
    const open = filtered.filter((task) => task.status !== "concluida" && task.status !== "cancelada").length;
    const strategic = filtered.filter((task) => (task.quality_score ?? 0) >= 4).length;
    const avgScore = total ? filtered.reduce((acc, task) => acc + (task.quality_score ?? 0), 0) / total : 0;
    const activeProjects = new Set(filtered.map((task) => task.project_id).filter(Boolean)).size;

    const byProject = blueBoltProjects
      .map((project) => ({
        id: project.id,
        name: project.name,
        value: filtered.filter((task) => task.project_id === project.id).length,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const areaMap = new Map<string, number>();
    filtered.forEach((task) => {
      if (task.area) areaMap.set(task.area, (areaMap.get(task.area) ?? 0) + 1);
    });
    const byArea = [...areaMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const statusMap = new Map<string, number>();
    filtered.forEach((task) => statusMap.set(task.status, (statusMap.get(task.status) ?? 0) + 1));
    const byStatus = [...statusMap.entries()].map(([status, value]) => ({
      status,
      name: STATUS_LABELS[status] ?? status,
      value,
    }));

    const weeks: { name: string; value: number; start: string; end: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i * 7 - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const count = filtered.filter((task) => {
        const date = new Date(task.task_date ?? task.created_at);
        return date >= start && date <= end;
      }).length;
      weeks.push({
        name: `${start.getDate()}/${start.getMonth() + 1}`,
        value: count,
        start: toDateInput(start),
        end: toDateInput(end),
      });
    }

    const keyDeliveries = [...filtered]
      .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
      .slice(0, 8);

    const allDeliveries = [...filtered].sort((a, b) =>
      (b.task_date ?? b.created_at).localeCompare(a.task_date ?? a.created_at),
    );

    return {
      total,
      done,
      open,
      strategic,
      avgScore,
      activeProjects,
      byProject,
      byArea,
      byStatus,
      weeks,
      keyDeliveries,
      allDeliveries,
    };
  }, [blueBoltProjects, filtered]);

  const update = (patch: Partial<ManagerFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const reset = () => setFilters(initialManagerFilters);
  const activeFilters =
    (filters.period !== "all" ? 1 : 0) +
    (filters.date_from ? 1 : 0) +
    (filters.date_to ? 1 : 0) +
    (filters.project_id ? 1 : 0) +
    (filters.area ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0);

  return (
    <PageContainer>
      <PageHeader
        title="Painel Gerencial Blue Bolt"
        subtitle="Link público de leitura para acompanhar entregas, evolução e prioridades da operação Blue Bolt"
        action={
          <Badge variant="outline" className="h-9 px-3 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Link público · Somente leitura
          </Badge>
        }
      />

      <ManagerFiltersBar
        filters={filters}
        projects={blueBoltProjects}
        activeFilters={activeFilters}
        update={update}
        reset={reset}
      />

      {isLoading ? (
        <Card className="p-10 text-center text-muted-foreground border-border/70">Carregando painel…</Card>
      ) : !blueBoltOrigin ? (
        <Card className="p-10 text-center text-muted-foreground border-dashed">
          Origem "Blue Bolt" não encontrada no banco.
        </Card>
      ) : blueBoltTasks.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground border-dashed">
          Ainda não existem tasks cadastradas para Blue Bolt.
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <Stat icon={<ListChecks className="h-4 w-4" />} label="Tasks no filtro" value={metrics.total} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Concluídas" value={metrics.done} sub={metrics.total ? `${Math.round((metrics.done / metrics.total) * 100)}% do total` : "—"} />
            <Stat icon={<Target className="h-4 w-4" />} label="Em aberto" value={metrics.open} />
            <Stat icon={<Star className="h-4 w-4" />} label="Score médio" value={metrics.avgScore.toFixed(1)} sub={classifyScore(metrics.avgScore).label} />
            <Stat icon={<Trophy className="h-4 w-4" />} label="Estratégicas" value={metrics.strategic} sub="score ≥ 4" />
            <Stat icon={<FolderKanban className="h-4 w-4" />} label="Projetos ativos" value={metrics.activeProjects} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <ChartCard title="Evolução semanal">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={metrics.weeks}
                  onClick={(state) => {
                    const payload = state?.activePayload?.[0]?.payload;
                    if (payload) update({ period: "all", date_from: payload.start, date_to: payload.end });
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Projetos mais trabalhados">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={metrics.byProject}
                  layout="vertical"
                  onClick={(state) => {
                    const payload = state?.activePayload?.[0]?.payload;
                    if (payload?.id) update({ project_id: payload.id });
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={118} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Distribuição por status">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metrics.byStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={86}
                    label
                    onClick={(entry) => update({ status: entry.status })}
                    className="cursor-pointer"
                  >
                    {metrics.byStatus.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <ChartCard title="Tipos/áreas mais trabalhadas">
              {metrics.byArea.length === 0 ? (
                <Muted>Sem áreas registradas no período.</Muted>
              ) : (
                <div className="space-y-2">
                  {metrics.byArea.map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => update({ area: area.name })}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="text-sm truncate">{area.name}</span>
                      <Badge variant="secondary">{area.value}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </ChartCard>

            <Card className="xl:col-span-2 p-4 sm:p-5 border-border/70 shadow-[var(--shadow-card)] gap-0">
              <div className="text-sm font-semibold mb-3">Principais entregas estratégicas</div>
              <div className="space-y-2">
                {metrics.keyDeliveries.length === 0 ? (
                  <Muted>Sem entregas no filtro atual.</Muted>
                ) : (
                  metrics.keyDeliveries.map((task) => (
                    <DeliveryRow key={task.id} task={task} projects={projects} />
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="border-border/70 shadow-[var(--shadow-card)] overflow-hidden gap-0 py-0">
            <div className="p-4 border-b border-border/70">
              <div className="text-sm font-semibold">Todas as tasks Blue Bolt</div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.allDeliveries.length} task(s) no filtro atual. Clique nos gráficos para refinar a lista.
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Task</th>
                    <th className="text-left px-3 py-3 font-semibold">Projeto</th>
                    <th className="text-left px-3 py-3 font-semibold">Área</th>
                    <th className="text-left px-3 py-3 font-semibold">Status</th>
                    <th className="text-left px-3 py-3 font-semibold">Prioridade</th>
                    <th className="text-right px-3 py-3 font-semibold">Score</th>
                    <th className="text-left px-3 py-3 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.allDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">Sem tasks no filtro atual.</td>
                    </tr>
                  ) : (
                    metrics.allDeliveries.map((task) => {
                      const score = task.quality_score ?? 0;
                      const scoreInfo = classifyScore(score);
                      return (
                        <tr key={task.id} className="border-t border-border/60">
                          <td className="px-4 py-3 min-w-[260px]">
                            <div className="font-medium line-clamp-1">{task.title}</div>
                            {task.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</div>}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">{projectName(task.project_id, projects)}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{task.area ?? "—"}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge variant="outline">{STATUS_LABELS[task.status] ?? task.status}</Badge>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${priorityClasses(task.priority)}`}>
                              {PRIORITY_LABELS[task.priority] ?? task.priority}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${scoreClasses(scoreInfo.tone)}`}>
                              {score.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">{task.task_date ?? task.created_at.slice(0, 10)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function ManagerFiltersBar({
  filters,
  projects,
  activeFilters,
  update,
  reset,
}: {
  filters: ManagerFilters;
  projects: { id: string; name: string }[];
  activeFilters: number;
  update: (patch: Partial<ManagerFilters>) => void;
  reset: () => void;
}) {
  const sel = (value: string) => (value ? value : ANY);
  const selectChange = (key: keyof ManagerFilters) => (value: string) =>
    update({ [key]: value === ANY ? "" : value } as Partial<ManagerFilters>);

  return (
    <Card className="p-3 sm:p-4 mb-6 border-border/70 shadow-none gap-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 flex-1">
          <FilterItem label="Período">
            <Select
              value={filters.period}
              onValueChange={(value) => update({ period: value as ManagerFilters["period"], date_from: "", date_to: "" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </FilterItem>

          <FilterItem label="De">
            <Input
              type="date"
              value={filters.date_from}
              max={filters.date_to || undefined}
              onChange={(event) => update({ date_from: event.target.value, period: "all" })}
            />
          </FilterItem>

          <FilterItem label="Até">
            <Input
              type="date"
              value={filters.date_to}
              min={filters.date_from || undefined}
              onChange={(event) => update({ date_to: event.target.value, period: "all" })}
            />
          </FilterItem>

          <FilterItem label="Projeto">
            <Select value={sel(filters.project_id)} onValueChange={selectChange("project_id")}>
              <SelectTrigger><SelectValue placeholder="Projeto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Todos projetos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>

          <FilterItem label="Área">
            <Select value={sel(filters.area)} onValueChange={selectChange("area")}>
              <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Todas áreas</SelectItem>
                {AREAS.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>

          <FilterItem label="Status">
            <Select value={sel(filters.status)} onValueChange={selectChange("status")}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Todos status</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>

          <FilterItem label="Prioridade">
            <Select value={sel(filters.priority)} onValueChange={selectChange("priority")}>
              <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Todas prioridades</SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>{PRIORITY_LABELS[priority]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>
        </div>

        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md"
        >
          Limpar filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>
      </div>
    </Card>
  );
}

function applyManagerFilters<T extends {
  task_date: string | null;
  created_at: string;
  project_id: string | null;
  area: string | null;
  status: string;
  priority: string;
}>(tasks: T[], filters: ManagerFilters): T[] {
  let cutoff: Date | null = null;
  if (filters.period !== "all") {
    const days = filters.period === "7d" ? 7 : filters.period === "30d" ? 30 : 90;
    cutoff = new Date(Date.now() - days * 86400000);
  }

  return tasks.filter((task) => {
    const taskDate = (task.task_date ?? task.created_at.slice(0, 10)).slice(0, 10);
    if (filters.date_from && taskDate < filters.date_from) return false;
    if (filters.date_to && taskDate > filters.date_to) return false;
    if (cutoff && new Date(task.task_date ?? task.created_at) < cutoff) return false;
    if (filters.project_id && task.project_id !== filters.project_id) return false;
    if (filters.area && task.area !== filters.area) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    return true;
  });
}

function DeliveryRow({ task, projects }: { task: any; projects: any[] }) {
  const score = task.quality_score ?? 0;
  const scoreInfo = classifyScore(score);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium line-clamp-1">{task.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {projectName(task.project_id, projects)} · {task.area ?? "Sem área"} · {task.task_date ?? task.created_at.slice(0, 10)}
        </div>
      </div>
      <span className={`shrink-0 self-start sm:self-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${scoreClasses(scoreInfo.tone)}`}>
        {score.toFixed(2)} · {scoreInfo.label}
      </span>
    </div>
  );
}

function projectName(projectId: string | null, projects: any[]) {
  if (!projectId) return "Sem projeto";
  return projects.find((project) => project.id === projectId)?.name ?? "Sem projeto";
}

function toDateInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function priorityClasses(priority: string) {
  if (priority === "high" || priority === "critical") return "bg-destructive/10 text-destructive border-destructive/30";
  if (priority === "medium") return "bg-warning/20 text-warning-foreground border-warning/40";
  return "bg-muted text-muted-foreground border-border";
}

function scoreClasses(tone: string) {
  if (tone === "success") return "bg-success/15 text-success";
  if (tone === "primary") return "bg-primary/10 text-primary";
  if (tone === "warning") return "bg-warning/25 text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card className="p-4 border-border/70 shadow-[var(--shadow-card)] gap-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="grid place-items-center h-6 w-6 rounded-md bg-muted text-foreground/70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-2xl font-semibold mt-2.5 truncate tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 truncate">{sub}</div>}
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5 border-border/70 shadow-[var(--shadow-card)] gap-0">
      <div className="text-sm font-semibold mb-3">{title}</div>
      {children}
    </Card>
  );
}

function FilterItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground">{children}</div>;
}
