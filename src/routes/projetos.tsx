import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWorkOrigins, useProjects, useTasks } from "@/lib/queries";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/projetos")({
  head: () => ({ meta: [{ title: "Projetos · Lucas Productivity OS" }] }),
  component: ProjetosPage,
});

const NONE = "__none__";

function ProjetosPage() {
  const { data: origins = [] } = useWorkOrigins();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", client: "", work_origin_id: "" });

  async function add() {
    if (!f.name.trim()) return;
    const { error } = await db.from("projects").insert({
      name: f.name.trim(), client: f.client || null, work_origin_id: f.work_origin_id || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Projeto criado"); setF({ name: "", client: "", work_origin_id: "" }); qc.invalidateQueries({ queryKey: ["projects"] }); }
  }
  async function remove(id: string) {
    if (!confirm("Excluir projeto?")) return;
    const { error } = await db.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["projects"] }); }
  }

  return (
    <PageContainer>
      <PageHeader title="Projetos / Clientes" subtitle="Clientes, projetos pessoais, estudos, produtos" />
      <Card className="p-5 mb-6 border-border/70 shadow-[var(--shadow-card)] gap-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Nome</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nome do projeto" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
            <Input value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} placeholder="Opcional" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Origem</Label>
            <Select value={f.work_origin_id || NONE} onValueChange={(v) => setF({ ...f, work_origin_id: v === NONE ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {origins.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} className="w-full"><Plus className="h-4 w-4 mr-1.5" />Adicionar</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {projects.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
            Nenhum projeto cadastrado.
          </div>
        )}
        {projects.map((p) => {
          const origin = origins.find((o) => o.id === p.work_origin_id);
          const count = tasks.filter((t) => t.project_id === p.id).length;
          return (
            <Card key={p.id} className="p-4 border-border/70 shadow-[var(--shadow-card)] gap-0 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  {p.client && <div className="text-xs text-muted-foreground truncate">{p.client}</div>}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-3">
                {origin && <Badge variant="outline" className="text-[10px]">{origin.name}</Badge>}
                <Badge variant="secondary" className="text-[10px] tabular-nums">{count} tasks</Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
