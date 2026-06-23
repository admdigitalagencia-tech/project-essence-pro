import { z } from "zod";
import { AREAS, PRIORITIES, STATUSES, TASK_TYPES } from "./constants";
import type { TaskInsert } from "./db";

const dateOrNull = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);
const textOrNull = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);
const numberOrNull = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })
  .refine((value) => value === null || value >= 0, "Tempo nao pode ser negativo");

export const taskFormSchema = z
  .object({
    work_origin_id: textOrNull,
    data_source_id: textOrNull,
    project_id: textOrNull,
    title: z
      .string()
      .trim()
      .min(3, "Titulo precisa ter pelo menos 3 caracteres")
      .max(160, "Titulo muito longo"),
    description: textOrNull,
    area: z.enum(AREAS).nullable(),
    channel: z
      .string()
      .trim()
      .max(80, "Canal muito longo")
      .optional()
      .transform((value) => value || null),
    task_type: z.enum(TASK_TYPES).nullable(),
    status: z.enum(STATUSES),
    priority: z.enum(PRIORITIES),
    impact: z.number().min(0).max(10),
    complexity: z.number().min(0).max(10),
    strategic_relevance: z.number().min(0).max(10),
    urgency: z.number().min(0).max(10),
    evidence_score: z.number().min(0).max(10),
    evidence: textOrNull,
    result: textOrNull,
    task_date: dateOrNull,
    deadline: dateOrNull,
    completed_at: dateOrNull,
    estimated_time: numberOrNull,
    actual_time: numberOrNull,
  })
  .superRefine((value, ctx) => {
    if (value.deadline && value.task_date && value.deadline < value.task_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "Prazo nao pode ser anterior a data da task",
      });
    }

    if (value.completed_at && value.task_date && value.completed_at < value.task_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completed_at"],
        message: "Conclusao nao pode ser anterior a data da task",
      });
    }

    if (value.status === "concluida" && !value.completed_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completed_at"],
        message: "Informe a data de conclusao para tasks concluidas",
      });
    }

    if (
      value.actual_time !== null &&
      value.estimated_time !== null &&
      value.actual_time > value.estimated_time * 10
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actual_time"],
        message: "Tempo real parece fora do esperado. Revise o valor informado",
      });
    }
  });

export type TaskFormValues = z.input<typeof taskFormSchema>;

export function parseTaskInsert(input: TaskFormValues): TaskInsert {
  const parsed = taskFormSchema.parse(input);

  return {
    work_origin_id: parsed.work_origin_id,
    data_source_id: parsed.data_source_id,
    project_id: parsed.project_id,
    title: parsed.title,
    description: parsed.description,
    area: parsed.area,
    channel: parsed.channel,
    task_type: parsed.task_type,
    status: parsed.status,
    priority: parsed.priority,
    impact: parsed.impact,
    complexity: parsed.complexity,
    strategic_relevance: parsed.strategic_relevance,
    urgency: parsed.urgency,
    evidence_score: parsed.evidence_score,
    evidence: parsed.evidence,
    result: parsed.result,
    task_date: parsed.task_date,
    deadline: parsed.deadline,
    completed_at: parsed.completed_at,
    estimated_time: parsed.estimated_time,
    actual_time: parsed.actual_time,
  };
}
