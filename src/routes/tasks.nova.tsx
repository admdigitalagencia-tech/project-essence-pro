import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useWorkOrigins, useDataSources, useProjects } from "@/lib/queries";
import {
  AREAS,
  TASK_TYPES,
  STATUSES,
  STATUS_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  classifyScore,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { parseTaskInsert } from "@/lib/task-schema";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ZodError } from "zod";

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
  const { data: projects = [] } = useProjects();

  const [f, setF] = useState({
    work_origin_id: "",
    data_source_id: "",
    project_id: "",
    title: "",
    description: "",
    area: "",
    channel: "",
    task_type: "",
    status: "todo",
    priority: "medium",
    impact: 5,
    complexity: 5,
    strategic_relevance: 5,
    urgency: 5,
    evidence_score: 5,
    evidence: "",
    result: "",
    task_date: new Date().toISOString().slice(0, 10),
    deadline: "",
    completed_at: "",
    estimated_time: "",
    actual_time: "",
  });
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) =>
    setF((current) => ({ ...current, [key]: value }));
  const selVal = (v: string) => (v === "" ? NONE : v);
  const fromSel = (v: string) => (v === NONE ? "" : v);

  const previewScore = useMemo(
    () =>
      f.impact * 0.3 +
      f.complexity * 0.2 +
      f.strategic_relevance * 0.2 +
      f.urgency * 0.15 +
      f.evidence_score * 0.15,
    [f.impact, f.complexity, f.strategic_relevance, f.urgency, f.evidence_score],
  );
  const cls = classifyScore(previewScore);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let payload;
    try {
      payload = parseTaskInsert(f);
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message ?? "Revise os dados informados");
        return;
      }
      toast.error("Nao foi possivel validar a task");
      return;
    }
    const { error } = await db.from("tasks").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Task criada");
    qc.invalidateQueries({ queryKey: ["tasks"] });
    navigate({ to: "/tasks" });
  }

  return (
    <PageContainer>
      <PageHeader title="Nova Task" subtitle="Cadastro manual de uma task" />
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-border/60 shadow-none space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Origem do trabalho">
                <Select
                  value={selVal(f.work_origin_id)}
                  onValueChange={(v) => set("work_origin_id", fromSel(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {origins.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fonte de dados">
                <Select
                  value={selVal(f.data_source_id)}
                  onValueChange={(v) => set("data_source_id", fromSel(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Projeto/Cliente">
                <Select
                  value={selVal(f.project_id)}
                  onValueChange={(v) => set("project_id", fromSel(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Título">
              <Input
                value={f.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex.: Otimizar campanha Performance Max"
                required
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={f.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Área">
                <Select value={selVal(f.area)} onValueChange={(v) => set("area", fromSel(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Canal">
                <Input
                  value={f.channel}
                  onChange={(e) => set("channel", e.target.value)}
                  placeholder="Ex.: Search, Display…"
                />
              </Field>
              <Field label="Tipo de task">
                <Select
                  value={selVal(f.task_type)}
                  onValueChange={(v) => set("task_type", fromSel(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Status">
                <Select value={f.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prioridade">
                <Select value={f.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Data da task">
                <Input
                  type="date"
                  value={f.task_date}
                  onChange={(e) => set("task_date", e.target.value)}
                />
              </Field>
              <Field label="Prazo">
                <Input
                  type="date"
                  value={f.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                />
              </Field>
              <Field label="Conclusão">
                <Input
                  type="date"
                  value={f.completed_at}
                  onChange={(e) => set("completed_at", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tempo estimado (h)">
                <Input
                  type="number"
                  step="0.25"
                  value={f.estimated_time}
                  onChange={(e) => set("estimated_time", e.target.value)}
                />
              </Field>
              <Field label="Tempo real (h)">
                <Input
                  type="number"
                  step="0.25"
                  value={f.actual_time}
                  onChange={(e) => set("actual_time", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Evidência">
              <Textarea
                rows={2}
                value={f.evidence}
                onChange={(e) => set("evidence", e.target.value)}
                placeholder="Link, print, doc…"
              />
            </Field>
            <Field label="Resultado gerado">
              <Textarea rows={2} value={f.result} onChange={(e) => set("result", e.target.value)} />
            </Field>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 border-border/60 shadow-none">
            <div className="text-sm font-medium mb-1">Score qualitativo</div>
            <div className="text-xs text-muted-foreground mb-4">
              Cálculo automático com pesos: Impacto 30 · Complexidade 20 · Estratégia 20 · Urgência
              15 · Evidência 15
            </div>
            <SliderField label="Impacto" value={f.impact} onChange={(v) => set("impact", v)} />
            <SliderField
              label="Complexidade"
              value={f.complexity}
              onChange={(v) => set("complexity", v)}
            />
            <SliderField
              label="Relevância estratégica"
              value={f.strategic_relevance}
              onChange={(v) => set("strategic_relevance", v)}
            />
            <SliderField label="Urgência" value={f.urgency} onChange={(v) => set("urgency", v)} />
            <SliderField
              label="Evidência/registro"
              value={f.evidence_score}
              onChange={(v) => set("evidence_score", v)}
            />
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground">Score previsto</div>
              <div className="text-3xl font-semibold">{previewScore.toFixed(1)}</div>
              <div
                className={`text-xs mt-1 ${cls.tone === "success" ? "text-success" : cls.tone === "warning" ? "text-warning-foreground" : "text-muted-foreground"}`}
              >
                {cls.label}
              </div>
            </div>
          </Card>
          <Button type="submit" className="w-full" size="lg">
            Criar task
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Slider min={0} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
