import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { FiltersBar } from "@/components/FiltersBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFilters, applyFilters } from "@/lib/filters";
import { useTasks, useWorkOrigins, useProjects } from "@/lib/queries";
import { classifyScore, STATUS_LABELS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Plus, TrendingUp, CheckCircle2, FolderKanban, Star, Flame, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · Lucas Productivity OS" }] }),
  component: Dashboard,
});

const CHART_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16"];

function Dashboard() {
  const { filters, update, reset } = useFilters();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: origins = [] } = useWorkOrigins();
  const { data: projects = [] } = useProjects();

  const filtered = useMemo(() => applyFilters(tasks, filters), [tasks, filters]);

  const m = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((t) => t.status === "concluida").length;
    const avgScore = total ? filtered.reduce((a, t) => a + (t.quality_score ?? 0), 0) / total : 0;
    const strategic = filtered.filter((t) => (t.quality_score ?? 0) >= 4).length;
    const activeProjects = new Set(filtered.map((t) => t.project_id).filter(Boolean)).size;

    const byOrigin = origins.map((o) => ({
      name: o.name,
      value: filtered.filter((t) => t.work_origin_id === o.id).length,
      color: o.color || "#6366f1",
    }));
    const topOrigin = [...byOrigin].sort((a, b) => b.value - a.value)[0];

    const byProject = projects.map((p) => ({
      name: p.name,
      value: filtered.filter((t) => t.project_id === p.id).length,
    })).filter((p) => p.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
    const topProject = byProject[0];

    const areaMap = new Map<string, number>();
    filtered.forEach((t) => { if (t.area) areaMap.set(t.area, (areaMap.get(t.area) ?? 0) + 1); });
    const byArea = [...areaMap.entries()].map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 10);

    const statusMap = new Map<string, number>();
    filtered.forEach((t) => statusMap.set(t.status, (statusMap.get(t.status) ?? 0) + 1));
    const byStatus = [...statusMap.entries()].map(([k, v]) => ({ name: STATUS_LABELS[k] ?? k, value: v }));

    // weekly evolution (last 8 weeks)
    const weeks: { name: string; value: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i * 7 - 6); start.setHours(0,0,0,0);
      const end = new Date(); end.setDate(end.getDate() - i * 7); end.setHours(23,59,59,999);
      const count = filtered.filter((t) => {
        const d = new Date(t.task_date ?? t.created_at);
        return d >= start && d <= end;
      }).length;
      weeks.push({ name: `${start.getDate()}/${start.getMonth()+1}`, value: count });
    }

    const highImpact = [...filtered].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0)).slice(0, 6);

    return { total, done, avgScore, strategic, activeProjects, byOrigin, topOrigin, byProject, topProject, byArea, byStatus, weeks, highImpact };
  }, [filtered, origins, projects]);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard Global"
        subtitle="Visão consolidada de toda a sua produtividade"
        action={
          <Button asChild>
            <Link to="/tasks/nova"><Plus className="h-4 w-4 mr-1.5" /> Nova task</Link>
          </Button>
        }
      />
      <FiltersBar filters={filters} update={update} reset={reset} />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Stat icon={<TrendingUp className="h-4 w-4" />} label="Total de tasks" value={m.total} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Concluídas" value={m.done} sub={m.total ? `${Math.round(m.done/m.total*100)}% do total` : "—"} />
            <Stat icon={<FolderKanban className="h-4 w-4" />} label="Projetos ativos" value={m.activeProjects} />
            <Stat icon={<Star className="h-4 w-4" />} label="Score médio" value={m.avgScore.toFixed(1)} sub={classifyScore(m.avgScore).label} />
            <Stat icon={<Trophy className="h-4 w-4" />} label="Tasks estratégicas" value={m.strategic} sub="score ≥ 4" />
            <Stat icon={<Flame className="h-4 w-4" />} label="Origem demandante" value={m.topOrigin?.name ?? "—"} sub={m.topOrigin ? `${m.topOrigin.value} tasks` : ""} />
            <Stat icon={<FolderKanban className="h-4 w-4" />} label="Maior carga" value={m.topProject?.name ?? "—"} sub={m.topProject ? `${m.topProject.value} tasks` : ""} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartCard title="Tasks por origem">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={m.byOrigin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {m.byOrigin.map((o, i) => <Cell key={i} fill={o.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tasks por projeto/cliente">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={m.byProject} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tasks por área">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={m.byArea}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Evolução semanal">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={m.weeks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Distribuição por status">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={m.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {m.byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Ranking de alto impacto">
              <div className="space-y-2">
                {m.highImpact.length === 0 && <div className="text-sm text-muted-foreground">Sem tasks ainda.</div>}
                {m.highImpact.map((t) => {
                  const c = classifyScore(t.quality_score ?? 0);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/60">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.area ?? "—"}</div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{(t.quality_score ?? 0).toFixed(1)} · {c.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </PageContainer>
  );
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

function EmptyState() {
  return (
    <Card className="p-12 text-center border-dashed">
      <h3 className="text-lg font-medium">Nenhuma task ainda</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Comece cadastrando uma task manualmente ou importando um CSV.
      </p>
      <div className="flex justify-center gap-2">
        <Button asChild><Link to="/tasks/nova"><Plus className="h-4 w-4 mr-1.5" />Nova task</Link></Button>
        <Button asChild variant="outline"><Link to="/importacoes">Importar CSV</Link></Button>
      </div>
    </Card>
  );
}
