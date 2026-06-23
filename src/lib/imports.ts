import { ZodError } from "zod";
import * as XLSX from "xlsx";
import { parseTaskInsert, type TaskFormValues } from "./task-schema";

export type ImportPreviewRow = {
  rowNumber: number;
  raw: Record<string, string>;
  normalizedTitle: string;
  status: "valid" | "invalid";
  error?: string;
};

export type ParsedImportData = {
  rows: Record<string, string>[];
  formatLabel: string;
};

const STATUS_ALIASES: Record<string, TaskFormValues["status"]> = {
  todo: "todo",
  "a fazer": "todo",
  pendente: "todo",
  em_andamento: "em_andamento",
  "em andamento": "em_andamento",
  doing: "em_andamento",
  bloqueado: "bloqueado",
  blocked: "bloqueado",
  concluida: "concluida",
  concluído: "concluida",
  concluida_: "concluida",
  done: "concluida",
  finalizada: "concluida",
  cancelada: "cancelada",
  canceled: "cancelada",
};

const PRIORITY_ALIASES: Record<string, TaskFormValues["priority"]> = {
  low: "low",
  baixa: "low",
  medium: "medium",
  media: "medium",
  média: "medium",
  high: "high",
  alta: "high",
  critical: "critical",
  critica: "critical",
  crítica: "critical",
};

export function parseCSV(text: string): Record<string, string>[] {
  return parseDelimitedText(text, ",");
}

export async function parseImportFile(file: File): Promise<ParsedImportData> {
  const extension = getFileExtension(file.name);

  if (extension === "csv") {
    return {
      rows: parseDelimitedText(await file.text(), ","),
      formatLabel: "CSV",
    };
  }

  if (extension === "tsv" || extension === "txt") {
    return {
      rows: parseDelimitedText(await file.text(), "\t"),
      formatLabel: extension === "tsv" ? "TSV" : "TXT",
    };
  }

  if (extension === "json") {
    return {
      rows: parseJSON(await file.text()),
      formatLabel: "JSON",
    };
  }

  if (extension === "xlsx" || extension === "xls") {
    return {
      rows: parseSpreadsheet(await file.arrayBuffer()),
      formatLabel: extension.toUpperCase(),
    };
  }

  throw new Error("Formato não suportado. Use CSV, XLSX, XLS, TSV, TXT ou JSON");
}

export function buildImportPreview(rows: Record<string, string>[]) {
  const prepared = rows.map((row, index) => {
    try {
      const payload = buildTaskPayload(row, "", "");
      return {
        rowNumber: index + 2,
        raw: row,
        normalizedTitle: payload.title,
        status: "valid",
      } satisfies ImportPreviewRow;
    } catch (error) {
      return {
        rowNumber: index + 2,
        raw: row,
        normalizedTitle: pick(row, "title", "titulo", "task", "name") || "(sem titulo)",
        status: "invalid",
        error: getValidationMessage(error),
      } satisfies ImportPreviewRow;
    }
  });

  const validRows = prepared.filter((row) => row.status === "valid");
  const invalidRows = prepared.filter((row) => row.status === "invalid");

  return { prepared, validRows, invalidRows };
}

export function buildTaskPayload(row: Record<string, string>, originId: string, sourceId: string) {
  return parseTaskInsert({
    work_origin_id: originId,
    data_source_id: sourceId,
    project_id: "",
    title: pick(row, "title", "titulo", "task", "name") || "(sem titulo)",
    description: pick(row, "description", "descricao", "notes"),
    area: nullableValue(pick(row, "area")),
    channel: pick(row, "channel", "canal"),
    task_type: nullableValue(pick(row, "type", "tipo", "task_type")),
    status: normalizeStatus(pick(row, "status")),
    priority: normalizePriority(pick(row, "priority", "prioridade")),
    impact: normalizeScore(pick(row, "impacto", "impact"), 5),
    complexity: normalizeScore(pick(row, "complexidade", "complexity"), 5),
    strategic_relevance: normalizeScore(
      pick(row, "relevancia_estrategica", "relevancia", "strategic_relevance"),
      5,
    ),
    urgency: normalizeScore(pick(row, "urgencia", "urgency"), 5),
    evidence_score: normalizeScore(pick(row, "evidence_score", "evidencia_score", "evidencia"), 5),
    evidence: pick(row, "evidence", "evidencia"),
    result: pick(row, "result", "resultado"),
    task_date: pick(row, "date", "data", "task_date"),
    deadline: pick(row, "deadline", "prazo"),
    completed_at: pick(row, "completed_at", "conclusion_date", "data_conclusao"),
    estimated_time: pick(row, "estimated_time", "estimativa", "tempo_estimado"),
    actual_time: pick(row, "actual_time", "tempo", "tempo_real"),
  });
}

export function getValidationMessage(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Linha invalida";
  if (error instanceof Error) return error.message;
  return "Linha invalida";
}

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[normalizeKey(key)];
    if (value && value.length > 0) return value;
  }
  return "";
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function parseDelimitedText(text: string, delimiter: "," | "\t") {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const split = (line: string) => {
    const out: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        out.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    out.push(current);
    return out.map((value) => value.trim());
  };

  const headers = split(lines[0]).map((header) => normalizeKey(header));
  return lines.slice(1).map((line) => {
    const cols = split(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cols[index] ?? "";
    });
    return row;
  });
}

function parseJSON(text: string) {
  const parsed = JSON.parse(text);
  const inputRows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.rows) ? parsed.rows : null;

  if (!inputRows) {
    throw new Error("JSON inválido. Use um array de objetos ou um objeto com a chave rows");
  }

  return inputRows.map((row) => normalizeObjectRow(row));
}

function parseSpreadsheet(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  return rows.map((row) => normalizeObjectRow(row));
}

function normalizeObjectRow(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Estrutura inválida no arquivo importado");
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [normalizeKey(key), stringifyCell(value)]),
  );
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function getFileExtension(filename: string) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function normalizeStatus(value: string): TaskFormValues["status"] {
  return STATUS_ALIASES[normalizeKey(value)] ?? "todo";
}

function normalizePriority(value: string): TaskFormValues["priority"] {
  return PRIORITY_ALIASES[normalizeKey(value)] ?? "medium";
}

function normalizeScore(value: string, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(10, parsed));
}

function nullableValue<T extends string>(value: T | "") {
  return value || null;
}
