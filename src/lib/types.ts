export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_plans: {
        Row: {
          id: string;
          user_id: string;
          version: number;
          patrimonio: string;
          r_pct: string;
          sl_diario_r: string;
          sl_semanal_r: string;
          horarios: Json;
          no_trade_days: string[];
          apalancamiento_btceth_max: string;
          apalancamiento_alts_max: string;
          fase_actual: string;
          nivel_actual: string;
          notes: string | null;
          effective_from: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          version: number;
          patrimonio: string;
          r_pct: string;
          sl_diario_r: string;
          sl_semanal_r: string;
          horarios: Json;
          no_trade_days?: string[];
          apalancamiento_btceth_max: string;
          apalancamiento_alts_max: string;
          fase_actual: string;
          nivel_actual: string;
          notes?: string | null;
          effective_from?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          patrimonio: string;
          r_pct: string;
          sl_diario_r: string;
          sl_semanal_r: string;
          horarios: Json;
          no_trade_days: string[];
          apalancamiento_btceth_max: string;
          apalancamiento_alts_max: string;
          fase_actual: string;
          nivel_actual: string;
          notes: string | null;
          effective_from: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "user_plans_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      global_semaforo_daily: {
        Row: {
          id: string;
          fecha: string;
          estado: "Verde" | "Amarillo" | "Rojo" | "Indeterminado";
          indicadores_json: Json;
          explicacion_gpt: string | null;
          computed_at: string;
          retries: number;
        };
        Insert: {
          id?: string;
          fecha: string;
          estado: "Verde" | "Amarillo" | "Rojo" | "Indeterminado";
          indicadores_json: Json;
          explicacion_gpt?: string | null;
          computed_at?: string;
          retries?: number;
        };
        Update: Partial<Database["public"]["Tables"]["global_semaforo_daily"]["Insert"]>;
        Relationships: [];
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          side: string;
          type: "spot" | "perp";
          exchange: string | null;
          entry: string;
          sl: string;
          tp_json: Json | null;
          leverage: string;
          size_nominal: string;
          risk_monetario: string;
          risk_en_r: string;
          open_time: string;
          close_time: string | null;
          pnl_monetario: string | null;
          pnl_r: string | null;
          cumplimiento_flags: string[];
          status: "open" | "closed" | "invalid";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          side: string;
          type: "spot" | "perp";
          exchange?: string | null;
          entry: string;
          sl: string;
          tp_json?: Json | null;
          leverage?: string;
          size_nominal: string;
          risk_monetario: string;
          risk_en_r: string;
          open_time?: string;
          close_time?: string | null;
          pnl_monetario?: string | null;
          pnl_r?: string | null;
          cumplimiento_flags?: string[];
          status?: "open" | "closed" | "invalid";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trades"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      metrics_daily: {
        Row: {
          id: string;
          user_id: string;
          fecha: string;
          pnl_r_dia: string;
          pnl_r_semana: string;
          tp_count: number;
          sl_hits_48h: number;
          streak_dias_verdes: number;
          cumplimiento_pct: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fecha: string;
          pnl_r_dia?: string;
          pnl_r_semana?: string;
          tp_count?: number;
          sl_hits_48h?: number;
          streak_dias_verdes?: number;
          cumplimiento_pct?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["metrics_daily"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "metrics_daily_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      gamification_state: {
        Row: {
          id: string;
          user_id: string;
          xp: number;
          level_perfil: number;
          badges_json: Json;
          streak_cumplimiento: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          xp?: number;
          level_perfil?: number;
          badges_json?: Json;
          streak_cumplimiento?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gamification_state"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "gamification_state_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: number;
          user_id: string | null;
          action: string;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          action: string;
          payload?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Enums: {
      semaforo_estado: "Verde" | "Amarillo" | "Rojo" | "Indeterminado";
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserPlan = Database["public"]["Tables"]["user_plans"]["Row"];
export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type MetricsDaily = Database["public"]["Tables"]["metrics_daily"]["Row"];
export type GamificationState = Database["public"]["Tables"]["gamification_state"]["Row"];
export type GlobalSemaforoDaily =
  Database["public"]["Tables"]["global_semaforo_daily"]["Row"];
