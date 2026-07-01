import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { type Filters } from "@/lib/filters";
import { AREAS, PRIORITIES, STATUSES, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { useWorkOrigins, useDataSources, useProjects } from "@/lib/queries";

const ANY = "__any__";

export function FiltersBar({
  filters, update, reset,
}: { filters: Filters; update: (p: Partial<Filters>) => void; reset: () => void }) {
  const { data: origins = [] } = useWorkOrigins();
  const { data: sources = [] } = useDataSources();
  const { data: projects = [] } = useProjects();
  const [open, setOpen] = useState(true);

  const sel = (val: string) => (val === "" ? ANY : val);
  const onChange = (key: keyof Filters) => (v: string) =>
    update({ [key]: v === ANY ? "" : v } as Partial<Filters>);

  const activeCount =
    (filters.period !== "all" ? 1 : 0) +
    (filters.sort !== "created_desc" ? 1 : 0) +
    (filters.date_from ? 1 : 0) +
    (filters.date_to ? 1 : 0) +
    (filters.work_origin_id ? 1 : 0) +
    (filters.data_source_id ? 1 : 0) +
    (filters.project_id ? 1 : 0) +
    (filters.area ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0);

  return (
    <Card className="p-3 sm:p-4 mb-6 border-border/70 shadow-none">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold">
                  {activeCount}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground h-8">
              <X className="h-3.5 w-3.5 mr-1" /> Limpar
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 2xl:grid-cols-10 gap-3 mt-3">
            <FilterItem label="Período">
              <Select
                value={filters.period}
                onValueChange={(v) => update({ period: v as Filters["period"], date_from: "", date_to: "" })}
              >
                <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>

            <FilterItem label="Ordenar">
              <Select value={filters.sort} onValueChange={(v) => update({ sort: v as Filters["sort"] })}>
                <SelectTrigger><SelectValue placeholder="Ordenar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Criação: mais recentes</SelectItem>
                  <SelectItem value="created_asc">Criação: mais antigas</SelectItem>
                  <SelectItem value="task_desc">Data da task: recentes</SelectItem>
                  <SelectItem value="task_asc">Data da task: antigas</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>

            <FilterItem label="De">
              <Input
                type="date"
                value={filters.date_from}
                max={filters.date_to || undefined}
                onChange={(e) => update({ date_from: e.target.value, period: "all" })}
              />
            </FilterItem>

            <FilterItem label="Até">
              <Input
                type="date"
                value={filters.date_to}
                min={filters.date_from || undefined}
                onChange={(e) => update({ date_to: e.target.value, period: "all" })}
              />
            </FilterItem>

            <FilterItem label="Origem">
              <Select value={sel(filters.work_origin_id)} onValueChange={onChange("work_origin_id")}>
                <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Todas origens</SelectItem>
                  {origins.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterItem>

            <FilterItem label="Fonte">
              <Select value={sel(filters.data_source_id)} onValueChange={onChange("data_source_id")}>
                <SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Todas fontes</SelectItem>
                  {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterItem>

            <FilterItem label="Projeto">
              <Select value={sel(filters.project_id)} onValueChange={onChange("project_id")}>
                <SelectTrigger><SelectValue placeholder="Projeto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Todos projetos</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterItem>

            <FilterItem label="Área">
              <Select value={sel(filters.area)} onValueChange={onChange("area")}>
                <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Todas áreas</SelectItem>
                  {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterItem>

            <FilterItem label="Status">
              <Select value={sel(filters.status)} onValueChange={onChange("status")}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Todos status</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterItem>

            <FilterItem label="Prioridade">
              <Select value={sel(filters.priority)} onValueChange={onChange("priority")}>
                <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Todas prioridades</SelectItem>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterItem>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function FilterItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}
