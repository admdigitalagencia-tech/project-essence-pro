import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePlatforms, useTasks } from "@/lib/queries";
import { db } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/plataformas")({
  head: () => ({ meta: [{ title: "Plataformas · Lucas Productivity OS" }] }),
  component: PlataformasPage,
});

function PlataformasPage() {
  const { data: platforms = [] } = usePlatforms();
  const { data: tasks = [] } = useTasks();
  const [name, setName] = useState("");
  const qc = useQueryClient();

  async function add() {
    if (!name.trim()) return;
    const { error } = await db.from("platforms").insert({ name: name.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plataforma criada");
    setName("");
    qc.invalidateQueries({ queryKey: ["platforms"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir plataforma?")) return;
    const { error } = await db.from("platforms").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plataforma excluída");
    qc.invalidateQueries({ queryKey: ["platforms"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  return (
    <PageContainer>
      <PageHeader title="Plataformas" subtitle="Cadastre e gerencie as plataformas usadas nas tasks" />
      <Card className="p-4 mb-6 border-border/60 shadow-none flex gap-2">
        <Input
          placeholder="Nova plataforma (ex.: Google Ads, Meta Ads, GTM)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={add}>
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {platforms.map((platform) => {
          const count = tasks.filter((task) => task.platform_id === platform.id).length;
          return (
            <Card key={platform.id} className="p-4 border-border/60 shadow-none">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium">{platform.name}</div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => remove(platform.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              <Badge variant="secondary" className="mt-3 text-[10px]">
                {count} tasks
              </Badge>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
