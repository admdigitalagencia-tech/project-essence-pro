import { useQuery } from "@tanstack/react-query";
import { db, type Task, type WorkOrigin, type Project, type DataSource } from "./db";
import { useAuth } from "@/hooks/use-auth";

export function useWorkOrigins() {
  const { session, loading } = useAuth();
  return useQuery<WorkOrigin[]>({
    queryKey: ["work_origins"],
    enabled: !loading && !!session,
    queryFn: async () => {
      const { data, error } = await db.from("work_origins").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDataSources() {
  const { session, loading } = useAuth();
  return useQuery<DataSource[]>({
    queryKey: ["data_sources"],
    enabled: !loading && !!session,
    queryFn: async () => {
      const { data, error } = await db.from("data_sources").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjects() {
  const { session, loading } = useAuth();
  return useQuery<Project[]>({
    queryKey: ["projects"],
    enabled: !loading && !!session,
    queryFn: async () => {
      const { data, error } = await db.from("projects").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTasks() {
  const { session, loading } = useAuth();
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    enabled: !loading && !!session,
    queryFn: async () => {
      const { data, error } = await db
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}
