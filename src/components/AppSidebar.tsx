import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Layers, FolderKanban, ListChecks, Plus,
  Upload, FileBarChart, Settings, Menu, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true, group: "Visão geral" },
  { to: "/tasks", label: "Tasks", icon: ListChecks, group: "Trabalho" },
  { to: "/tasks/nova", label: "Nova task", icon: Plus, accent: true, group: "Trabalho" },
  { to: "/importacoes", label: "Importações", icon: Upload, group: "Trabalho" },
  { to: "/projetos", label: "Projetos/Clientes", icon: FolderKanban, group: "Estrutura" },
  { to: "/origens", label: "Origens", icon: Layers, group: "Estrutura" },
  { to: "/blue-bolt", label: "Painel Blue Bolt", icon: ShieldCheck, group: "Análise" },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart, group: "Análise" },
  { to: "/configuracoes", label: "Configurações", icon: Settings, group: "Análise" },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-semibold shadow-sm">L</div>
      <div className="leading-tight">
        <div className="font-semibold text-sm text-sidebar-foreground">Lucas</div>
        <div className="text-[11px] text-muted-foreground">Productivity OS</div>
      </div>
    </div>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const groups = items.reduce<Record<string, typeof items>>((acc, it) => {
    (acc[it.group] ||= []).push(it);
    return acc;
  }, {});
  return (
    <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
      {Object.entries(groups).map(([group, list]) => (
        <div key={group}>
          <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">{group}</div>
          <div className="space-y-0.5">
            {list.map((it) => {
              const active = it.exact ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + "/");
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={onNavigate}
                  className={[
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    it.accent && !active ? "text-primary" : "",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-60 lg:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
      <div className="px-5 py-4 border-b border-sidebar-border">
        <Brand />
      </div>
      <NavList pathname={pathname} />
      <div className="p-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground border-t border-sidebar-border">
        <span className="pl-2">v0.1 · single user</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <div className="px-5 py-4 border-b border-sidebar-border">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <Brand />
        </div>
        <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
