import { useQuery } from "@tanstack/react-query";
import { db, type Task, type WorkOrigin, type Project, type DataSource } from "./db";

export function useWorkOrigins() {
  return useQuery<WorkOrigin[]>({
    queryKey: ["work_origins"],
    queryFn: async () => {
      const { data, error } = await db.from("work_origins").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDataSources() {
  return useQuery<DataSource[]>({
    queryKey: ["data_sources"],
    queryFn: async () => {
      const { data, error } = await db.from("data_sources").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await db.from("projects").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await db.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}
