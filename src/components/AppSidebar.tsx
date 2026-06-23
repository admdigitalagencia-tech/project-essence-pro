import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Layers, FolderKanban, ListChecks, Plus,
  Upload, FileBarChart, Settings,
} from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/origens", label: "Origens", icon: Layers },
  { to: "/projetos", label: "Projetos/Clientes", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/tasks/nova", label: "Nova Task", icon: Plus, accent: true },
  { to: "/importacoes", label: "Importações", icon: Upload },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-semibold">L</div>
          <div className="leading-tight">
            <div className="font-semibold text-sm text-sidebar-foreground">Lucas</div>
            <div className="text-[11px] text-muted-foreground">Productivity OS</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={[
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                it.accent && !active ? "text-primary" : "",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-[11px] text-muted-foreground border-t border-sidebar-border">
        v0.1 · single user
      </div>
    </aside>
  );
}
