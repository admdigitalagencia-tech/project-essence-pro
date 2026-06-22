export const AREAS = [
  "Google Ads", "Meta Ads", "Tracking & Mensuração", "CRM & Leads",
  "Relatórios & Análise", "Criativos & Conteúdo", "Landing Pages",
  "Estratégia", "Comercial/Vendas", "Produto/SaaS", "Automação/IA",
  "Estudos/Certificações", "Administrativo", "Reuniões/Alinhamento", "Documentação",
] as const;

export const TASK_TYPES = [
  "Correção","Otimização","Criação","Análise","Setup","Reunião",
  "Documentação","Planejamento","Estudo","Desenvolvimento","Validação","Manutenção",
] as const;

export const STATUSES = ["todo","em_andamento","bloqueado","concluida","cancelada"] as const;
export const STATUS_LABELS: Record<string,string> = {
  todo: "A fazer", em_andamento: "Em andamento", bloqueado: "Bloqueado",
  concluida: "Concluída", cancelada: "Cancelada",
};

export const PRIORITIES = ["low","medium","high","critical"] as const;
export const PRIORITY_LABELS: Record<string,string> = {
  low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica",
};

export function classifyScore(score: number) {
  if (score >= 8.5) return { label: "Entrega estratégica/crítica", tone: "success" };
  if (score >= 7) return { label: "Boa entrega", tone: "primary" };
  if (score >= 5) return { label: "Tarefa comum", tone: "muted" };
  return { label: "Baixo valor operacional", tone: "warning" };
}
