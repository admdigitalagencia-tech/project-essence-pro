import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { type Filters } from "@/lib/filters";
import { AREAS, PRIORITIES, STATUSES, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { useWorkOrigins, useDataSources, useProjects } from "@/lib/queries";

const ANY = "__any__";
const SCORE_VALUES = [
  { value: "0", label: "Qualquer nota" },
  { value: "4", label: "4+" },
  { value: "6", label: "6+" },
  { value: "8", label: "8+" },
];

export function FiltersBar({
  filters,
  update,
  reset,
}: {
  filters: Filters;
  update: (p: Partial<Filters>) => void;
  reset: () => void;
}) {
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const { data: projects = [] } = useProjects();

  const sel = (val: string) => (val === "" ? ANY : val);
  const onChange = (key: keyof Filters) => (v: string) =>
    update({ [key]: v === ANY ? "" : v } as Partial<Filters>);

  return (
    <Card className="p-4 mb-6 border-border/60 shadow-none">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
        <Select
          value={filters.period}
          onValueChange={(v) => update({ period: v as Filters["period"] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sel(filters.work_origin_id)} onValueChange={onChange("work_origin_id")}>
          <SelectTrigger>
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas origens</SelectItem>
            {origins.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sel(filters.data_source_id)} onValueChange={onChange("data_source_id")}>
          <SelectTrigger>
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas fontes</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sel(filters.project_id)} onValueChange={onChange("project_id")}>
          <SelectTrigger>
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos projetos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sel(filters.area)} onValueChange={onChange("area")}>
          <SelectTrigger>
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas áreas</SelectItem>
            {AREAS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sel(filters.status)} onValueChange={onChange("status")}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sel(filters.priority)} onValueChange={onChange("priority")}>
          <SelectTrigger>
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas prioridades</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.impactMin)}
          onValueChange={(v) => update({ impactMin: Number(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Impacto mínimo" />
          </SelectTrigger>
          <SelectContent>
            {SCORE_VALUES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                Impacto {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.complexityMin)}
          onValueChange={(v) => update({ complexityMin: Number(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Complexidade mínima" />
          </SelectTrigger>
          <SelectContent>
            {SCORE_VALUES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                Complexidade {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end mt-3">
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
          <X className="h-3.5 w-3.5 mr-1" /> Limpar filtros
        </Button>
      </div>
    </Card>
  );
}
