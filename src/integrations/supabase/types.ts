export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      data_sources: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      imports: {
        Row: {
          created_at: string
          data_source_id: string | null
          filename: string | null
          id: string
          rows_imported: number | null
          status: string | null
          work_origin_id: string | null
        }
        Insert: {
          created_at?: string
          data_source_id?: string | null
          filename?: string | null
          id?: string
          rows_imported?: number | null
          status?: string | null
          work_origin_id?: string | null
        }
        Update: {
          created_at?: string
          data_source_id?: string | null
          filename?: string | null
          id?: string
          rows_imported?: number | null
          status?: string | null
          work_origin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_work_origin_id_fkey"
            columns: ["work_origin_id"]
            isOneToOne: false
            referencedRelation: "work_origins"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string | null
          work_origin_id: string | null
        }
        Insert: {
          client?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          work_origin_id?: string | null
        }
        Update: {
          client?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          work_origin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_work_origin_id_fkey"
            columns: ["work_origin_id"]
            isOneToOne: false
            referencedRelation: "work_origins"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_time: number | null
          area: string | null
          channel: string | null
          completed_at: string | null
          complexity: number | null
          created_at: string
          data_source_id: string | null
          deadline: string | null
          description: string | null
          estimated_time: number | null
          evidence: string | null
          evidence_score: number | null
          id: string
          impact: number | null
          platform_id: string | null
          priority: string | null
          project_id: string | null
          quality_score: number | null
          result: string | null
          status: string | null
          strategic_relevance: number | null
          task_date: string | null
          task_type: string | null
          title: string
          updated_at: string
          urgency: number | null
          work_origin_id: string | null
        }
        Insert: {
          actual_time?: number | null
          area?: string | null
          channel?: string | null
          completed_at?: string | null
          complexity?: number | null
          created_at?: string
          data_source_id?: string | null
          deadline?: string | null
          description?: string | null
          estimated_time?: number | null
          evidence?: string | null
          evidence_score?: number | null
          id?: string
          impact?: number | null
          platform_id?: string | null
          priority?: string | null
          project_id?: string | null
          quality_score?: number | null
          result?: string | null
          status?: string | null
          strategic_relevance?: number | null
          task_date?: string | null
          task_type?: string | null
          title: string
          updated_at?: string
          urgency?: number | null
          work_origin_id?: string | null
        }
        Update: {
          actual_time?: number | null
          area?: string | null
          channel?: string | null
          completed_at?: string | null
          complexity?: number | null
          created_at?: string
          data_source_id?: string | null
          deadline?: string | null
          description?: string | null
          estimated_time?: number | null
          evidence?: string | null
          evidence_score?: number | null
          id?: string
          impact?: number | null
          platform_id?: string | null
          priority?: string | null
          project_id?: string | null
          quality_score?: number | null
          result?: string | null
          status?: string | null
          strategic_relevance?: number | null
          task_date?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string
          urgency?: number | null
          work_origin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_work_origin_id_fkey"
            columns: ["work_origin_id"]
            isOneToOne: false
            referencedRelation: "work_origins"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          created_at: string
          highlights: Json | null
          id: string
          scope: string | null
          scope_ref: string | null
          summary: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          highlights?: Json | null
          id?: string
          scope?: string | null
          scope_ref?: string | null
          summary?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          highlights?: Json | null
          id?: string
          scope?: string | null
          scope_ref?: string | null
          summary?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      work_origins: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
