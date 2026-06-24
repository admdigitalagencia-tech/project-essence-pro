// Heurísticas locais para auditoria automática de score qualitativo (escala 0–5).
// Usado como fallback quando a IA não está disponível e também como base para reconciliar resultados da IA.

export type AuditFactors = {
  impact: number;
  complexity: number;
  strategic_relevance: number;
  urgency: number;
  evidence_score: number;
};

export type AuditResult = AuditFactors & {
  quality_score: number;
  notes: string;
  source: "ai" | "heuristic";
};

export type AuditableTask = {
  title?: string | null;
  description?: string | null;
  area?: string | null;
  channel?: string | null;
  task_type?: string | null;
  status?: string | null;
  priority?: string | null;
  evidence?: string | null;
  result?: string | null;
  project_id?: string | null;
  data_source_id?: string | null;
  work_origin_id?: string | null;
  deadline?: string | null;
  completed_at?: string | null;
  task_date?: string | null;
  estimated_time?: number | null;
  actual_time?: number | null;
};

const IMPACT_KEYWORDS = [
  "lead", "leads", "conversão", "conversao", "conversoes", "tracking", "gtm", "ga4",
  "pixel", "campanha", "campanhas", "orçamento", "orcamento", "api", "integração", "integracao",
  "vendas", "venda", "formulário", "formulario", "sheets", "tag", "evento", "crm",
  "performance max", "remarketing", "automação", "automacao", "webhook", "funil",
];

const COMPLEXITY_KEYWORDS = [
  "api", "gtm", "ga4", "pixel", "integração", "integracao", "automação", "automacao",
  "webhook", "tag", "conversão", "conversao", "tracking", "script", "endpoint",
  "datalayer", "data layer", "regex", "server-side", "server side", "consent mode",
  "looker", "bigquery", "sql", "node", "edge function",
];

const STRATEGIC_KEYWORDS = [
  "performance", "otimização", "otimizacao", "análise", "analise", "relatório", "relatorio",
  "estratégia", "estrategia", "funil", "campanha", "conversão", "conversao", "mensuração",
  "mensuracao", "aquisição", "aquisicao", "orçamento", "orcamento", "decisão", "decisao",
  "executivo", "kpi", "okr",
];

function norm(s?: string | null) {
  return (s ?? "").toLowerCase();
}

function countHits(text: string, keywords: string[]) {
  let n = 0;
  for (const k of keywords) if (text.includes(k)) n++;
  return n;
}

function clamp05(n: number) {
  return Math.max(0, Math.min(5, Math.round(n)));
}

function scoreByHits(hits: number, base = 2) {
  // 0 hits → 2 (default operacional), 1 → 3, 2 → 4, 3+ → 5
  if (hits >= 3) return 5;
  if (hits === 2) return 4;
  if (hits === 1) return 3;
  return base;
}

const PRIORITY_MAP: Record<string, number> = {
  low: 2,
  medium: 3,
  high: 4,
  critical: 5,
};

function urgencyFor(task: AuditableTask): number {
  let u = PRIORITY_MAP[(task.priority ?? "medium").toLowerCase()] ?? 3;
  const status = (task.status ?? "").toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  if (status === "bloqueado") u += 1;
  if (task.deadline && task.deadline < today && status !== "concluida" && status !== "cancelada") u += 1;

  const tipo = norm(task.task_type);
  if (tipo === "documentação" || tipo === "documentacao" || tipo === "reunião" || tipo === "reuniao" || tipo === "estudo") {
    if (!task.deadline) u -= 1;
  }
  return clamp05(u);
}

function evidenceFor(task: AuditableTask): number {
  const desc = (task.description ?? "").trim();
  const ev = (task.evidence ?? "").trim();
  const res = (task.result ?? "").trim();

  const hasDesc = desc.length >= 20;
  const longDesc = desc.length >= 80;
  const hasEv = ev.length > 0;
  const hasRes = res.length > 0;
  const hasContext = !!(task.project_id || task.data_source_id || task.work_origin_id);

  if (hasEv && hasRes && longDesc) return 5;
  if ((hasEv || hasRes) && hasDesc) return 4;
  if (hasDesc && hasContext) return 3;
  if (hasDesc || hasEv || hasRes) return 2;
  if (hasContext) return 1;
  return 0;
}

function impactFor(text: string, task: AuditableTask): number {
  const hits = countHits(text, IMPACT_KEYWORDS);
  let v = scoreByHits(hits, 2);
  const tipo = norm(task.task_type);
  if (tipo === "correção" || tipo === "correcao") v = Math.max(v, 4);
  if (tipo === "documentação" || tipo === "documentacao") v = Math.min(v, 3);
  return clamp05(v);
}

function complexityFor(text: string, task: AuditableTask): number {
  const hits = countHits(text, COMPLEXITY_KEYWORDS);
  let v = scoreByHits(hits, 2);
  const tipo = norm(task.task_type);
  if (tipo === "desenvolvimento" || tipo === "setup") v = Math.max(v, 3);
  if (tipo === "reunião" || tipo === "reuniao" || tipo === "documentação" || tipo === "documentacao") v = Math.min(v, 2);
  return clamp05(v);
}

function strategicFor(text: string, task: AuditableTask): number {
  const hits = countHits(text, STRATEGIC_KEYWORDS);
  let v = scoreByHits(hits, 2);
  const area = norm(task.area);
  if (area.includes("estratég") || area.includes("estrateg") || area.includes("relatório") || area.includes("relatorio")) {
    v = Math.max(v, 4);
  }
  if (area.includes("administrativo") || area.includes("documentação") || area.includes("documentacao")) {
    v = Math.min(v, 2);
  }
  return clamp05(v);
}

export function computeScore(f: AuditFactors): number {
  const s = f.impact * 0.30 + f.complexity * 0.20 + f.strategic_relevance * 0.20 + f.urgency * 0.15 + f.evidence_score * 0.15;
  return Math.round(s * 100) / 100;
}

export function classifyScore5(score: number) {
  if (score >= 4.25) return { label: "Entrega estratégica/crítica", tone: "success" as const };
  if (score >= 3.5) return { label: "Boa entrega", tone: "primary" as const };
  if (score >= 2.5) return { label: "Tarefa comum", tone: "muted" as const };
  return { label: "Baixo valor operacional", tone: "warning" as const };
}

export function auditTaskHeuristic(task: AuditableTask): AuditResult {
  const text = [task.title, task.description, task.area, task.channel, task.task_type, task.result, task.evidence]
    .map(norm).join(" ");

  const factors: AuditFactors = {
    impact: impactFor(text, task),
    complexity: complexityFor(text, task),
    strategic_relevance: strategicFor(text, task),
    urgency: urgencyFor(task),
    evidence_score: evidenceFor(task),
  };
  const quality_score = computeScore(factors);
  const cls = classifyScore5(quality_score);
  const notes = `Heurística local: ${cls.label}. impacto ${factors.impact}, complexidade ${factors.complexity}, estratégia ${factors.strategic_relevance}, urgência ${factors.urgency}, evidência ${factors.evidence_score}.`;
  return { ...factors, quality_score, notes, source: "heuristic" };
}

export function sanitizeFactors(input: Partial<AuditFactors>): AuditFactors {
  return {
    impact: clamp05(Number(input.impact ?? 3)),
    complexity: clamp05(Number(input.complexity ?? 3)),
    strategic_relevance: clamp05(Number(input.strategic_relevance ?? 3)),
    urgency: clamp05(Number(input.urgency ?? 3)),
    evidence_score: clamp05(Number(input.evidence_score ?? 3)),
  };
}
