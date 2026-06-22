import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkOrigins, useTasks } from "@/lib/queries";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/origens")({
  head: () => ({ meta: [{ title: "Origens · Lucas Productivity OS" }] }),
  component: OrigensPage,
});

function OrigensPage() {
  const { data: origins = [] } = useWorkOrigins();
  const { data: tasks = [] } = useTasks();
  const [name, setName] = useState("");
  const qc = useQueryClient();

  async function add() {
    if (!name.trim()) return;
    const { error } = await db.from("work_origins").insert({ name: name.trim() });
    if (error) toast.error(error.message);
    else { toast.success("Origem criada"); setName(""); qc.invalidateQueries({ queryKey: ["work_origins"] }); }
  }

  return (
    <PageContainer>
      <PageHeader title="Origens do trabalho" subtitle="De onde vem a demanda" />
      <Card className="p-4 mb-6 border-border/60 shadow-none flex gap-2">
        <Input placeholder="Nova origem (ex.: Cliente Novo)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={add}><Plus className="h-4 w-4 mr-1.5" />Adicionar</Button>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {origins.map((o) => {
          const count = tasks.filter((t) => t.work_origin_id === o.id).length;
          return (
            <Card key={o.id} className="p-4 border-border/60 shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: o.color ?? "#6366f1" }} />
                <div className="font-medium">{o.name}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">{count} tasks</div>
              <Badge variant="secondary" className="mt-3 text-[10px]">{count > 0 ? "ativa" : "sem tasks"}</Badge>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
