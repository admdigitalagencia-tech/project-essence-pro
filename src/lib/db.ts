import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"];
type PublicTable = keyof PublicSchema["Tables"];

export const db = {
  from<T extends PublicTable>(table: T) {
    return supabase.from(table);
  },
};

export type WorkOrigin = PublicSchema["Tables"]["work_origins"]["Row"];
export type DataSource = PublicSchema["Tables"]["data_sources"]["Row"];
export type Project = PublicSchema["Tables"]["projects"]["Row"];
export type Task = PublicSchema["Tables"]["tasks"]["Row"];
export type TaskInsert = PublicSchema["Tables"]["tasks"]["Insert"];
