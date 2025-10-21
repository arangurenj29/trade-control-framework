export type SemaforoState = {
  fecha: string;
  estado: "Verde" | "Amarillo" | "Rojo" | "Indeterminado";
  explicacion: string | null;
  computed_at: string | null;
  analisis: string | null;
};

export type PlanSummary = {
  version: number;
  patrimonio: number;
  fase_actual: string;
  nivel_actual: string;
  sl_diario_r: number;
  sl_semanal_r: number;
  r_pct: number;
  r_disponible: number;
  sl_restante_dia: number;
  sl_restante_semana: number;
  apalancamiento_btceth_max: number;
  apalancamiento_alts_max: number;
  plan_start_date: string;
};

export type PlanDetail = PlanSummary & {
  horarios: {
    session_start: string;
    session_end: string;
    buffer_minutes: number;
  };
  no_trade_days: string[];
  apalancamiento_btceth_max: number;
  apalancamiento_alts_max: number;
  notes: string | null;
};

export type PlanVersion = {
  id: string;
  version: number;
  patrimonio: number;
  r_pct: number;
  sl_diario_r: number;
  sl_semanal_r: number;
  fase_actual: string;
  nivel_actual: string;
  plan_start_date: string;
  effective_from: string;
  updated_at: string;
};

export type MetricsSnapshot = {
  pnl_r_dia: number;
  pnl_r_semana: number;
  tp_count: number;
  streak_dias_verdes: number;
  cumplimiento_pct: number;
};

export type AscensoSummary = {
  xp: number;
  level_perfil: number;
  streak_cumplimiento: number;
  badges: string[];
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward_xp: number;
};

export type DashboardData = {
  semaforo: SemaforoState | null;
  plan: PlanSummary | null;
  metrics: MetricsSnapshot | null;
  ascenso: AscensoSummary | null;
  can_operate: boolean;
  bloqueo_motivo: string | null;
};

export type TradeListItem = {
  id: string;
  symbol: string;
  side: string;
  type: "spot" | "perp";
  exchange: string | null;
  entry: number;
  sl: number;
  leverage: number;
  size_nominal: number;
  risk_en_r: number;
  status: "open" | "closed" | "invalid";
  open_time: string;
  close_time: string | null;
  pnl_r: number | null;
  cumplimiento_flags: string[];
};

export type TradesPageData = {
  openTrades: TradeListItem[];
  closedTrades: TradeListItem[];
  stats: TradesStats;
};

export type TradesStats = {
  balance: number | null;
  equity: number | null;
  available_balance: number | null;
  pnl_day: number;
  pnl_week: number;
  pnl_month: number;
};

export type AscensoPageData = {
  summary: AscensoSummary | null;
  missions: Mission[];
};

export type WeeklyReportData = {
  rango: {
    inicio: string;
    fin: string;
  };
  pnl_r: number;
  pnl_monetario: number;
  cumplimiento_pct: number;
  streak_dias_verdes: number;
  violaciones: {
    sl_diario: number;
    sl_semanal: number;
  };
  recomendacion_fase: string | null;
  trades: TradeListItem[];
};

export type EmotionalLog = {
  id: string;
  log_date: string;
  estado_antes: number;
  estado_despues: number;
  confianza: number;
  cansancio: number;
  claridad: number;
  emocion_dominante: string | null;
  reflexion: string | null;
  gratitud: string | null;
  created_at: string;
};

export type EmotionalLogsPageData = {
  latest: EmotionalLog[];
  today: EmotionalLog | null;
};
