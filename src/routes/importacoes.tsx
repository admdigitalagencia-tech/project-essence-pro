import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkOrigins, useDataSources } from "@/lib/queries";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/importacoes")({
  head: () => ({ meta: [{ title: "Importações · Lucas Productivity OS" }] }),
  component: ImportPage,
});

const NONE = "__none__";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur); return out.map((s) => s.trim());
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return row;
  });
}

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const k of keys) { if (row[k] && row[k].length > 0) return row[k]; }
  return "";
}

function ImportPage() {
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const qc = useQueryClient();
  const [origin, setOrigin] = useState("");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | null) {
    setFile(f); setPreview([]);
    if (!f) return;
    const text = await f.text();
    const rows = parseCSV(text);
    setPreview(rows.slice(0, 5));
  }

  async function doImport() {
    if (!file || !origin || !source) { toast.error("Selecione origem, fonte e arquivo"); return; }
    setBusy(true);
    try {
      const rows = parseCSV(await file.text());
      const tasks = rows.map((r) => ({
        work_origin_id: origin,
        data_source_id: source,
        title: pick(r, "title", "titulo", "task", "name") || "(sem título)",
        description: pick(r, "description", "descricao", "notes") || null,
        area: pick(r, "area") || null,
        task_type: pick(r, "type", "tipo") || null,
        status: pick(r, "status") || "todo",
        priority: pick(r, "priority", "prioridade") || "medium",
        task_date: pick(r, "date", "data", "task_date") || null,
        deadline: pick(r, "deadline", "prazo") || null,
        estimated_time: Number(pick(r, "estimated_time", "estimativa")) || null,
        actual_time: Number(pick(r, "actual_time", "tempo")) || null,
      }));
      const { error } = await db.from("tasks").insert(tasks);
      if (error) throw error;
      await db.from("imports").insert({
        work_origin_id: origin, data_source_id: source,
        filename: file.name, rows_imported: tasks.length,
      });
      toast.success(`${tasks.length} tasks importadas`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setFile(null); setPreview([]);
    } catch (e: any) {
      toast.error(e.message ?? "Falha na importação");
    } finally { setBusy(false); }
  }

  const headers = useMemo(() => (preview[0] ? Object.keys(preview[0]) : []), [preview]);

  return (
    <PageContainer>
      <PageHeader title="Importações" subtitle="Importe CSV ou cadastre manualmente" />
      <Card className="p-6 border-border/60 shadow-none space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Origem do trabalho</Label>
            <Select value={origin || NONE} onValueChange={(v) => setOrigin(v === NONE ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {origins.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fonte de dados</Label>
            <Select value={source || NONE} onValueChange={(v) => setSource(v === NONE ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Arquivo CSV</Label>
          <Input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <p className="text-xs text-muted-foreground">Colunas aceitas: title, description, area, type, status, priority, date, deadline, estimated_time, actual_time</p>
        </div>

        {preview.length > 0 && (
          <div className="border border-border/60 rounded-lg overflow-x-auto">
            <div className="text-xs px-3 py-2 border-b border-border/60 bg-muted/30">Pré-visualização (5 primeiras linhas)</div>
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>{headers.map((h) => <th key={h} className="text-left px-2 py-1.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-border/60">
                    {headers.map((h) => <td key={h} className="px-2 py-1.5">{r[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Button onClick={doImport} disabled={busy || !file || !origin || !source}>
          <Upload className="h-4 w-4 mr-1.5" />{busy ? "Importando…" : "Importar"}
        </Button>
      </Card>
    </PageContainer>
  );
}
