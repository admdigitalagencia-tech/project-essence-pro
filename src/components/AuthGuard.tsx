import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session && pathname !== "/login") {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (session && pathname === "/login") {
      navigate({ to: "/", replace: true });
    }
  }, [loading, navigate, pathname, session]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <Card className="w-full max-w-md p-6 border-border/60 shadow-none text-center">
          <div className="text-lg font-semibold">Carregando acesso</div>
          <p className="text-sm text-muted-foreground mt-2">
            Verificando sua sessao antes de abrir a plataforma.
          </p>
        </Card>
      </div>
    );
  }

  if (!session && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
