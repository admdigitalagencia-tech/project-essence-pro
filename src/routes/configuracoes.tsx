import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { useWorkOrigins, useDataSources } from "@/lib/queries";
import { AREAS, TASK_TYPES } from "@/lib/constants";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · Lucas Productivity OS" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();

  return (
    <PageContainer>
      <PageHeader title="Configurações" subtitle="Catálogos e regras do sistema" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ListCard title="Origens do trabalho" items={origins.map((o) => o.name)} />
        <ListCard title="Fontes de dados" items={sources.map((s) => s.name)} />
        <ListCard title="Áreas" items={[...AREAS]} />
        <ListCard title="Tipos de task" items={[...TASK_TYPES]} />
      </div>

      <Card className="p-5 sm:p-6 mt-4 sm:mt-6 border-border/70 shadow-[var(--shadow-card)] gap-0">
        <h3 className="font-semibold mb-2">Cálculo do score qualitativo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          O score é calculado automaticamente em cada task com os pesos:
        </p>
        <ul className="text-sm space-y-1 text-muted-foreground mb-5">
          <li>• <span className="text-foreground font-medium">Impacto</span> — 30%</li>
          <li>• <span className="text-foreground font-medium">Complexidade</span> — 20%</li>
          <li>• <span className="text-foreground font-medium">Relevância estratégica</span> — 20%</li>
          <li>• <span className="text-foreground font-medium">Urgência</span> — 15%</li>
          <li>• <span className="text-foreground font-medium">Evidência</span> — 15%</li>
        </ul>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <Range label="0 — 4.9" tone="bg-muted text-foreground/70" desc="Baixo valor operacional" />
          <Range label="5 — 6.9" tone="bg-accent text-accent-foreground" desc="Tarefa comum" />
          <Range label="7 — 8.4" tone="bg-primary/15 text-primary" desc="Boa entrega" />
          <Range label="8.5 — 10" tone="bg-success/15 text-success" desc="Estratégica/crítica" />
        </div>
      </Card>
    </PageContainer>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-5 border-border/70 shadow-[var(--shadow-card)] gap-0">
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs text-muted-foreground">Nenhum item.</span>}
        {items.map((i) => (
          <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground/80 border border-border/60">{i}</span>
        ))}
      </div>
    </Card>
  );
}

function Range({ label, tone, desc }: { label: string; tone: string; desc: string }) {
  return (
    <div className={`p-3 rounded-lg ${tone}`}>
      <div className="font-semibold text-sm tabular-nums">{label}</div>
      <div className="text-xs opacity-80 mt-0.5">{desc}</div>
    </div>
  );
}
