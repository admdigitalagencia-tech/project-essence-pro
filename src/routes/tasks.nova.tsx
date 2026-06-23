import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useWorkOrigins, useDataSources, usePlatforms, useProjects } from "@/lib/queries";
import { TASK_CATEGORIES, TASK_TYPES, STATUSES, STATUS_LABELS, PRIORITIES, PRIORITY_LABELS, classifyScore } from "@/lib/constants";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks/nova")({
  head: () => ({ meta: [{ title: "Nova Task · Lucas Productivity OS" }] }),
  component: NovaTask,
});

const NONE = "__none__";

function NovaTask() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const { data: platforms = [] } = usePlatforms();
  const { data: projects = [] } = useProjects();

  const [f, setF] = useState({
    work_origin_id: "", data_source_id: "", platform_id: "", project_id: "",
    title: "", description: "", area: "", channel: "", task_type: "",
    status: "todo", priority: "medium",
    impact: 5, complexity: 5, strategic_relevance: 5, urgency: 5, evidence_score: 5,
    evidence: "", result: "",
    task_date: new Date().toISOString().slice(0, 10),
    deadline: "", completed_at: "",
    estimated_time: "", actual_time: "",
  });
  const set = (k: keyof typeof f, v: any) => setF((x) => ({ ...x, [k]: v }));
  const selVal = (v: string) => (v === "" ? NONE : v);
  const fromSel = (v: string) => (v === NONE ? "" : v);

  const previewScore = useMemo(() =>
    f.impact * 0.30 + f.complexity * 0.20 + f.strategic_relevance * 0.20 + f.urgency * 0.15 + f.evidence_score * 0.15,
    [f.impact, f.complexity, f.strategic_relevance, f.urgency, f.evidence_score]
  );
  const cls = classifyScore(previewScore);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) { toast.error("Informe um título"); return; }
    const payload = {
      work_origin_id: f.work_origin_id || null,
      data_source_id: f.data_source_id || null,
      platform_id: f.platform_id || null,
      project_id: f.project_id || null,
      title: f.title.trim(),
      description: f.description || null,
      area: f.area || null,
      channel: f.channel || null,
      task_type: f.task_type || null,
      status: f.status, priority: f.priority,
      impact: f.impact, complexity: f.complexity,
      strategic_relevance: f.strategic_relevance, urgency: f.urgency,
      evidence_score: f.evidence_score,
      evidence: f.evidence || null, result: f.result || null,
      task_date: f.task_date || null,
      deadline: f.deadline || null,
      completed_at: f.completed_at || null,
      estimated_time: f.estimated_time ? Number(f.estimated_time) : null,
      actual_time: f.actual_time ? Number(f.actual_time) : null,
    };
    const { error } = await db.from("tasks").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Task criada");
    qc.invalidateQueries({ queryKey: ["tasks"] });
    navigate({ to: "/tasks" });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Nova Task"
        subtitle="Cadastro manual de uma task"
        action={
          <>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/tasks" })}>Cancelar</Button>
            <Button type="button" onClick={(e) => submit(e as unknown as React.FormEvent)}>Criar task</Button>
          </>
        }
      />
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6 min-w-0">
          <Card className="p-5 sm:p-6 border-border/70 shadow-[var(--shadow-card)] gap-0">
            <SectionTitle>Identificação</SectionTitle>
            <Field label="Título" required>
              <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Otimizar campanha Performance Max" required />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
              <Field label="Origem do trabalho">
                <Select value={selVal(f.work_origin_id)} onValueChange={(v) => set("work_origin_id", fromSel(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {origins.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fonte de dados">
                <Select value={selVal(f.data_source_id)} onValueChange={(v) => set("data_source_id", fromSel(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Plataforma">
                <Select value={selVal(f.platform_id)} onValueChange={(v) => set("platform_id", fromSel(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {platforms.map((platform) => <SelectItem key={platform.id} value={platform.id}>{platform.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Projeto/Cliente">
                <Select value={selVal(f.project_id)} onValueChange={(v) => set("project_id", fromSel(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-5 sm:p-6 border-border/70 shadow-[var(--shadow-card)] gap-0">
            <SectionTitle>Classificação</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Tipo">
                <Select value={selVal(f.area)} onValueChange={(v) => set("area", fromSel(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {TASK_CATEGORIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Canal">
                <Input value={f.channel} onChange={(e) => set("channel", e.target.value)} placeholder="Ex.: Search, Display…" />
              </Field>
              <Field label="Tipo de task">
                <Select value={selVal(f.task_type)} onValueChange={(v) => set("task_type", fromSel(v))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <Field label="Status">
                <Select value={f.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Prioridade">
                <Select value={f.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-5 sm:p-6 border-border/70 shadow-[var(--shadow-card)] gap-0">
            <SectionTitle>Datas</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Data da task"><Input type="date" value={f.task_date} onChange={(e) => set("task_date", e.target.value)} /></Field>
              <Field label="Prazo"><Input type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
              <Field label="Conclusão"><Input type="date" value={f.completed_at} onChange={(e) => set("completed_at", e.target.value)} /></Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4 min-w-0">
          <Card className="p-5 sm:p-6 border-border/70 shadow-[var(--shadow-card)] gap-0 lg:sticky lg:top-6">
            <SectionTitle>Score qualitativo</SectionTitle>
            <div className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Cálculo automático com pesos:<br />
              Impacto 30 · Complexidade 20 · Estratégia 20 · Urgência 15 · Evidência 15
            </div>
            <SliderField label="Impacto" value={f.impact} onChange={(v) => set("impact", v)} />
            <SliderField label="Complexidade" value={f.complexity} onChange={(v) => set("complexity", v)} />
            <SliderField label="Relevância estratégica" value={f.strategic_relevance} onChange={(v) => set("strategic_relevance", v)} />
            <SliderField label="Urgência" value={f.urgency} onChange={(v) => set("urgency", v)} />
            <SliderField label="Evidência/registro" value={f.evidence_score} onChange={(v) => set("evidence_score", v)} />
            <div className="mt-5 p-4 rounded-lg border border-border/70 bg-muted/40">
              <div className="text-xs text-muted-foreground">Score previsto</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-3xl font-semibold tabular-nums">{previewScore.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">/ 10</div>
              </div>
              <div className={`text-xs mt-1.5 font-medium ${cls.tone === "success" ? "text-success" : cls.tone === "warning" ? "text-warning-foreground" : cls.tone === "primary" ? "text-primary" : "text-muted-foreground"}`}>{cls.label}</div>
            </div>
            <Button type="submit" className="w-full mt-5" size="lg">Criar task</Button>
          </Card>
        </div>
      </form>
    </PageContainer>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold mb-4 text-foreground">{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{value}</span></div>
      <Slider min={0} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
