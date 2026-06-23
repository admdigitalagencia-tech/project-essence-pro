import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkOrigins, useDataSources } from "@/lib/queries";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import {
  buildImportPreview,
  buildTaskPayload,
  getValidationMessage,
  parseImportFile,
  type ImportPreviewRow,
} from "@/lib/imports";

export const Route = createFileRoute("/importacoes")({
  head: () => ({ meta: [{ title: "Importações · Lucas Productivity OS" }] }),
  component: ImportPage,
});

const NONE = "__none__";

function ImportPage() {
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const qc = useQueryClient();
  const [origin, setOrigin] = useState("");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [formatLabel, setFormatLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | null) {
    setFile(f);
    setPreview([]);
    setFormatLabel("");
    if (!f) return;
    try {
      const parsed = await parseImportFile(f);
      setFormatLabel(parsed.formatLabel);
      setPreview(buildImportPreview(parsed.rows).prepared.slice(0, 8));
    } catch (error) {
      setFile(null);
      toast.error(getValidationMessage(error));
    }
  }

  async function doImport() {
    if (!file || !origin || !source) {
      toast.error("Selecione origem, fonte e arquivo");
      return;
    }
    setBusy(true);
    try {
      const { rows } = await parseImportFile(file);
      const validTasks = [];
      const invalidRows: Array<{ rowNumber: number; reason: string }> = [];

      rows.forEach((row, index) => {
        try {
          validTasks.push(buildTaskPayload(row, origin, source));
        } catch (error) {
          invalidRows.push({
            rowNumber: index + 2,
            reason: getValidationMessage(error),
          });
        }
      });

      if (validTasks.length === 0) {
        toast.error("Nenhuma linha valida para importar");
        return;
      }

      const seen = new Set<string>();
      const tasks = validTasks.filter((task) => {
        const key = [
          task.title,
          task.task_date ?? "",
          task.project_id ?? "",
          task.work_origin_id ?? "",
        ]
          .join("::")
          .toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const { error } = await db.from("tasks").insert(tasks);
      if (error) throw error;
      await db.from("imports").insert({
        work_origin_id: origin,
        data_source_id: source,
        filename: file.name,
        rows_imported: tasks.length,
      });
      if (invalidRows.length > 0) {
        toast.success(
          `${tasks.length} tasks importadas. ${invalidRows.length} linhas invalidas foram ignoradas.`,
        );
      } else {
        toast.success(`${tasks.length} tasks importadas`);
      }
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["imports"] });
      setFile(null);
      setPreview([]);
      setFormatLabel("");
    } catch (e: any) {
      toast.error(e.message ?? "Falha na importação");
    } finally {
      setBusy(false);
    }
  }

  const headers = useMemo(() => (preview[0] ? Object.keys(preview[0].raw) : []), [preview]);
  const validPreviewCount = preview.filter((row) => row.status === "valid").length;
  const invalidPreviewCount = preview.filter((row) => row.status === "invalid").length;

  return (
    <PageContainer>
      <PageHeader
        title="Importações"
        subtitle="Importe CSV, Excel, TSV, TXT ou JSON, ou cadastre manualmente"
      />
      <Card className="p-6 border-border/60 shadow-none space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Origem do trabalho</Label>
            <Select value={origin || NONE} onValueChange={(v) => setOrigin(v === NONE ? "" : v)}>
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
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fonte de dados</Label>
            <Select value={source || NONE} onValueChange={(v) => setSource(v === NONE ? "" : v)}>
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
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Arquivo de importação</Label>
          <Input
            type="file"
            accept=".csv,.tsv,.txt,.json,.xlsx,.xls,text/csv,text/tab-separated-values,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: CSV, XLSX, XLS, TSV, TXT e JSON.
          </p>
          <p className="text-xs text-muted-foreground">
            Colunas aceitas: title, description, area, type, status, priority, date, deadline,
            estimated_time, actual_time, impact, complexity, strategic_relevance, urgency,
            evidence_score
          </p>
          {file && formatLabel ? (
            <p className="text-xs text-muted-foreground">
              Arquivo selecionado: <span className="font-medium text-foreground">{file.name}</span>{" "}
              · Formato detectado: {formatLabel}
            </p>
          ) : null}
        </div>

        {preview.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <StatusCard
                icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                title="Linhas validas"
                value={validPreviewCount}
                subtitle="Prontas para importacao"
              />
              <StatusCard
                icon={<AlertTriangle className="h-4 w-4 text-warning-foreground" />}
                title="Linhas com problema"
                value={invalidPreviewCount}
                subtitle="Serao ignoradas no envio"
              />
            </div>

            <div className="border border-border/60 rounded-lg overflow-x-auto">
              <div className="text-xs px-3 py-2 border-b border-border/60 bg-muted/30">
                Pré-visualização (8 primeiras linhas)
              </div>
              <table className="w-full text-xs">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-medium">Status</th>
                    <th className="text-left px-2 py-1.5 font-medium">Linha</th>
                    {headers.map((h) => (
                      <th key={h} className="text-left px-2 py-1.5 font-medium">
                        {h}
                      </th>
                    ))}
                    <th className="text-left px-2 py-1.5 font-medium">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="px-2 py-1.5">{r.status === "valid" ? "OK" : "Erro"}</td>
                      <td className="px-2 py-1.5">{r.rowNumber}</td>
                      {headers.map((h) => (
                        <td key={h} className="px-2 py-1.5">
                          {r.raw[h]}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-muted-foreground">
                        {r.error ?? "Linha valida"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Button onClick={doImport} disabled={busy || !file || !origin || !source}>
          <Upload className="h-4 w-4 mr-1.5" />
          {busy ? "Importando…" : "Importar"}
        </Button>
      </Card>
    </PageContainer>
  );
}

function StatusCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Card className="p-4 border-border/60 shadow-none">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </Card>
  );
}
