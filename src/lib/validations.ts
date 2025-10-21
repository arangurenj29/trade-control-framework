import { z } from "zod";

export const phaseOptions = ["Fase 0", "Fase 1", "Fase 2", "Fase 3"] as const;
export const levelOptions = ["Nivel 1", "Nivel 2", "Nivel 3"] as const;

export const horariosSchema = z.object({
  session_start: z.string().min(5),
  session_end: z.string().min(5),
  buffer_minutes: z.number().int().min(0).max(240)
});

export const planSchema = z.object({
  patrimonio: z.number().positive(),
  r_pct: z.number().positive().max(10),
  sl_diario_r: z.number().max(-0.5),
  sl_semanal_r: z.number().min(-20).max(-1),
  horarios: horariosSchema,
  no_trade_days: z.array(z.string()),
  apalancamiento_btceth_max: z.number().positive().max(50),
  apalancamiento_alts_max: z.number().positive().max(100),
  fase_actual: z.enum(phaseOptions),
  nivel_actual: z.enum(levelOptions),
  plan_start_date: z
    .string()
    .min(10)
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Fecha de inicio inválida"
    }),
  notes: z.string().optional()
});

export const tradeSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(["long", "short", "buy", "sell"]),
  type: z.enum(["spot", "perp"]),
  exchange: z.string().optional(),
  entry: z.number().positive(),
  sl: z.number().positive(),
  tp_json: z
    .array(
      z.object({
        price: z.number().positive(),
        size: z.number().positive()
      })
    )
    .optional(),
  leverage: z.number().positive(),
  size_nominal: z.number().positive(),
  risk_monetario: z.number(),
  risk_en_r: z.number().min(-5).max(1),
  cumplimiento_flags: z.array(z.string()).optional()
});

export const closeTradeSchema = z.object({
  trade_id: z.string().uuid(),
  pnl_monetario: z.number(),
  pnl_r: z.number()
});

export const emotionalLogSchema = z.object({
  log_date: z.coerce.date(),
  estado_antes: z.coerce.number().int().min(1).max(5),
  estado_despues: z.coerce.number().int().min(1).max(5),
  confianza: z.coerce.number().int().min(1).max(5),
  cansancio: z.coerce.number().int().min(1).max(5),
  claridad: z.coerce.number().int().min(1).max(5),
  emocion_dominante: z.string().min(1),
  reflexion: z.string().min(1),
  gratitud: z.string().min(1)
});
