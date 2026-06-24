import { createServerFn } from "@tanstack/react-start";
import { auditTaskHeuristic, sanitizeFactors, computeScore, type AuditableTask, type AuditResult } from "./score-audit";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `Você é um auditor de produtividade. Recebe uma task de trabalho (marketing digital, tracking, dados, gestão) e atribui 5 fatores em escala 0–5 inteiros:
- impact: 0–5. Alto quando afeta leads, vendas, tracking, GTM/GA4, pixels, campanhas, orçamento, conversões, relatórios estratégicos.
- complexity: 0–5. Alto para API, GTM, GA4, Meta Pixel, integrações, automações, tracking, múltiplas plataformas.
- strategic_relevance: 0–5. Alto para decisões, crescimento, aquisição, mensuração, redução de risco, melhoria estrutural.
- urgency: 0–5. Base: critical=5, high=4, medium=3, low=2. Aumente se atrasada/bloqueadora; reduza se for só doc/acompanhamento sem prazo.
- evidence_score: 0–5. 5 = evidência+resultado+descrição clara; 0 = sem informação útil.
Responda APENAS com JSON válido no formato: {"impact":N,"complexity":N,"strategic_relevance":N,"urgency":N,"evidence_score":N,"notes":"justificativa curta em pt-BR (máx 240 chars)"}`;

function buildUserContent(task: AuditableTask): string {
  return JSON.stringify({
    title: task.title ?? "",
    description: task.description ?? "",
    area: task.area ?? "",
    channel: task.channel ?? "",
    task_type: task.task_type ?? "",
    status: task.status ?? "",
    priority: task.priority ?? "medium",
    evidence: task.evidence ?? "",
    result: task.result ?? "",
    deadline: task.deadline ?? "",
    completed_at: task.completed_at ?? "",
  });
}

async function auditWithAi(task: AuditableTask, apiKey: string): Promise<AuditResult | null> {
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "manual-fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserContent(task) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      console.error("[audit] AI gateway error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content);
    const factors = sanitizeFactors(parsed);
    const quality_score = computeScore(factors);
    const notes = typeof parsed.notes === "string" ? parsed.notes.slice(0, 240) : "Auditoria por IA.";
    return { ...factors, quality_score, notes, source: "ai" };
  } catch (err) {
    console.error("[audit] AI exception", err);
    return null;
  }
}

export const auditTaskScore = createServerFn({ method: "POST" })
  .inputValidator((data: { task: AuditableTask }) => data)
  .handler(async ({ data }): Promise<AuditResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (key) {
      const result = await auditWithAi(data.task, key);
      if (result) return result;
    }
    return auditTaskHeuristic(data.task);
  });

export const auditTasksBatch = createServerFn({ method: "POST" })
  .inputValidator((data: { tasks: (AuditableTask & { id: string })[] }) => data)
  .handler(async ({ data }): Promise<Array<{ id: string } & AuditResult>> => {
    const key = process.env.LOVABLE_API_KEY;
    const out: Array<{ id: string } & AuditResult> = [];
    // Sequential to avoid gateway burst rate limits.
    for (const t of data.tasks) {
      let r: AuditResult | null = null;
      if (key) r = await auditWithAi(t, key);
      if (!r) r = auditTaskHeuristic(t);
      out.push({ id: t.id, ...r });
    }
    return out;
  });
