import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { FiltersBar } from "@/components/FiltersBar";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilters, applyFilters } from "@/lib/filters";
import { useTasks, useWorkOrigins, useProjects } from "@/lib/queries";
import { classifyScore } from "@/lib/constants";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · Lucas Productivity OS" }] }),
  component: ReportsPage,
});

type Scope = "global" | "origin" | "project";

function ReportsPage() {
  const { filters, update, reset } = useFilters();
  const [scope, setScope] = useState<Scope>("global");
  const { data: tasks = [] } = useTasks();
  const { data: origins = [] } = useWorkOrigins();
  const { data: projects = [] } = useProjects();

  const filtered = useMemo(() => applyFilters(tasks, filters), [tasks, filters]);

  const data = useMemo(() => {
    const groups: { label: string; tasks: typeof filtered }[] = [];
    if (scope === "global") groups.push({ label: "Visão Global", tasks: filtered });
    else if (scope === "origin") {
      origins.forEach((o) => {
        const t = filtered.filter((x) => x.work_origin_id === o.id);
        if (t.length) groups.push({ label: o.name, tasks: t });
      });
    } else {
      projects.forEach((p) => {
        const t = filtered.filter((x) => x.project_id === p.id);
        if (t.length) groups.push({ label: p.name, tasks: t });
      });
    }
    return groups;
  }, [scope, filtered, origins, projects]);

  return (
    <PageContainer>
      <PageHeader title="Relatórios" subtitle="Resumos executivos por visão" action={
        <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Visão global</SelectItem>
            <SelectItem value="origin">Por origem do trabalho</SelectItem>
            <SelectItem value="project">Por projeto/cliente</SelectItem>
          </SelectContent>
        </Select>
      } />
      <FiltersBar filters={filters} update={update} reset={reset} />

      <div className="space-y-4 lg:space-y-6">
        {data.length === 0 && <Card className="p-10 text-center text-muted-foreground border-dashed">Sem dados para gerar relatório.</Card>}
        {data.map((g) => <ReportCard key={g.label} title={g.label} tasks={g.tasks} projects={projects} />)}
      </div>
    </PageContainer>
  );
}

function ReportCard({ title, tasks, projects }: { title: string; tasks: any[]; projects: any[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "concluida").length;
  const avgScore = total ? tasks.reduce((a, t) => a + (t.quality_score ?? 0), 0) / total : 0;
  const strategic = tasks.filter((t) => (t.quality_score ?? 0) >= 8.5);
  const overdue = tasks.filter((t) => t.deadline && t.status !== "concluida" && new Date(t.deadline) < new Date());
  const blocked = tasks.filter((t) => t.status === "bloqueado");
  const next = tasks.filter((t) => t.status !== "concluida" && t.status !== "cancelada")
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")).slice(0, 5);

  const byProject = new Map<string, number>();
  tasks.forEach((t) => { if (t.project_id) byProject.set(t.project_id, (byProject.get(t.project_id) ?? 0) + 1); });
  const topProjects = [...byProject.entries()].sort((a,b) => b[1]-a[1]).slice(0, 5)
    .map(([id, c]) => ({ name: projects.find((p) => p.id === id)?.name ?? "—", count: c }));

  const byArea = new Map<string, number>();
  tasks.forEach((t) => { if (t.area) byArea.set(t.area, (byArea.get(t.area) ?? 0) + 1); });
  const topAreas = [...byArea.entries()].sort((a,b) => b[1]-a[1]).slice(0, 5);

  return (
    <Card className="p-5 sm:p-6 border-border/70 shadow-[var(--shadow-card)] gap-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between mb-5 pb-4 border-b border-border/60">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="text-xs text-muted-foreground">Score médio: <span className="font-semibold text-foreground tabular-nums">{avgScore.toFixed(1)}</span> · {classifyScore(avgScore).label}</div>
      </div>

      <Section title="Resumo executivo">
        <p className="text-sm text-muted-foreground">
          {total} tasks no período, com {done} concluídas ({total ? Math.round(done/total*100) : 0}%).
          {strategic.length > 0 && ` ${strategic.length} entregas estratégicas (score ≥ 8.5).`}
          {overdue.length > 0 && ` ${overdue.length} tasks atrasadas.`}
          {blocked.length > 0 && ` ${blocked.length} bloqueadas.`}
        </p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Section title="Principais entregas">
          {strategic.length === 0 ? <Muted>Nenhuma entrega estratégica.</Muted> :
            <ul className="space-y-1.5 text-sm">{strategic.slice(0,6).map((t) => <li key={t.id} className="flex justify-between gap-3"><span className="truncate">{t.title}</span><span className="text-muted-foreground shrink-0">{(t.quality_score ?? 0).toFixed(1)}</span></li>)}</ul>
          }
        </Section>
        <Section title="Tarefas estratégicas">
          {strategic.length === 0 ? <Muted>—</Muted> : <div className="text-2xl font-semibold">{strategic.length}</div>}
        </Section>
        <Section title="Projetos mais trabalhados">
          {topProjects.length === 0 ? <Muted>—</Muted> :
            <ul className="space-y-1.5 text-sm">{topProjects.map((p, i) => <li key={i} className="flex justify-between"><span className="truncate">{p.name}</span><span className="text-muted-foreground">{p.count}</span></li>)}</ul>
          }
        </Section>
        <Section title="Áreas mais trabalhadas">
          {topAreas.length === 0 ? <Muted>—</Muted> :
            <ul className="space-y-1.5 text-sm">{topAreas.map(([a, c]) => <li key={a} className="flex justify-between"><span className="truncate">{a}</span><span className="text-muted-foreground">{c}</span></li>)}</ul>
          }
        </Section>
        <Section title="Riscos operacionais">
          {overdue.length === 0 && blocked.length === 0 ? <Muted>Sem riscos.</Muted> :
            <ul className="space-y-1 text-sm">
              {overdue.length > 0 && <li>⚠️ {overdue.length} tasks com prazo vencido</li>}
              {blocked.length > 0 && <li>🚧 {blocked.length} tasks bloqueadas</li>}
            </ul>}
        </Section>
        <Section title="Próximas ações">
          {next.length === 0 ? <Muted>—</Muted> :
            <ul className="space-y-1.5 text-sm">{next.map((t) => <li key={t.id} className="flex justify-between gap-3"><span className="truncate">{t.title}</span><span className="text-muted-foreground shrink-0">{t.deadline ?? "—"}</span></li>)}</ul>
          }
        </Section>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</div>{children}</div>;
}
function Muted({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground">{children}</div>;
}
