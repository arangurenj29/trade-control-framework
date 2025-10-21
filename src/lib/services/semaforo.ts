import type { Json } from "@/lib/types";

export type SemaforoInput = {
  open_interest: Json;
  funding_rate: Json;
  liquidation_map: Json;
  average_leverage_ratio: Json;
  long_short_ratio: Json;
  volume_variation_24h: Json;
  cdri: Json;
};

export function buildSemaforoPrompt(input: SemaforoInput) {
  return `Actúa como un analista profesional de derivados y riesgo macro del mercado cripto. Tu tarea es analizar la situación actual del mercado utilizando los siguientes indicadores provenientes de CoinGlass.com:
1. Open Interest (OI)
2. Funding Rate
3. Mapa de Liquidaciones (Liquidation Map)
4. Promedio de Apalancamiento (Average Leverage Ratio)
5. Desequilibrio Long/Short (Long/Short Ratio)
6. Volumen y variación 24 h
7. Índice de Riesgo Derivado (CDRI-CoinGlass Derivatives Risk Index)

Datos entregados (formato JSON, úsalo literalmente en tu análisis):
- Open Interest = ${JSON.stringify(input.open_interest)}
- Funding Rate = ${JSON.stringify(input.funding_rate)}
- Liquidation Map = ${JSON.stringify(input.liquidation_map)}
- Average Leverage Ratio = ${JSON.stringify(input.average_leverage_ratio)}
- Long/Short Ratio = ${JSON.stringify(input.long_short_ratio)}
- Volumen 24h = ${JSON.stringify(input.volume_variation_24h)}
- CDRI = ${JSON.stringify(input.cdri)}

Con esta información, realiza lo siguiente:
A. Determina el Semáforo de Riesgo del Mercado. Clasifícalo en tres colores:
   🟢 Verde: entorno sano para operar; apalancamiento controlado, sin señales de manipulación.
   🟡 Amarillo: mercado neutral o inestable; hay desbalance leve o señales tempranas de riesgo.
   🔴 Rojo: mercado sobre-apalancado, con riesgo elevado de liquidaciones masivas o manipulación institucional.

B. Evalúa la probabilidad de operar en LONG o SHORT, expresada en porcentaje (%), con una breve justificación técnica concreta.
-Ejemplo: “Probabilidad LONG 65 %-funding neutral, OI creciente y presión
-jemplo: “Probabilidad SHORT 70 %-funding positivo extremo y OI alto sin

C. Entrega un resumen técnico estructurado con:
   - Interpretación de cada indicador.
   - Estado actual del mercado (consolidación, expansión, sobre-apalancamiento, capitulación, etc.).
   - Recomendación final de acción: Operar / Esperar / No operar.

D. Respeta el siguiente formato de salida (sustituye el color y los valores con tu análisis, usa el emoji correcto según corresponda):
🟢 SEMÁFORO DE RIESGO: Verde
🔸 Open Interest:
[breve análisis y nivel comparado con el promedio 7d]
🔸 Funding Rate:
[valor y lectura de sesgo]
🔸 Liquidation Map:
[zonas de riesgo o equilibrio]
🔸 Promedio de Apalancamiento:
[interpretación del ratio]
🔸 Long/Short Ratio:
[porcentaje de desequilibrio]
🔸 Volumen:
[cambio 24h, tendencia del flujo]
🔸 CDRI:
[valor numérico y zona de riesgo]
📊 **Probabilidades operativas:**
LONG: XX % SHORT: XX %
🧠**Conclusión técnica:**
[Diagnóstico del mercado, nivel de riesgo, recomendación de acción]

Notas adicionales:
- Usa únicamente la información suministrada.
- Mantén un tono técnico y conciso y respeta el límite máximo de 1 000 caracteres para toda la respuesta.
- Las probabilidades deben sumar aproximadamente 100 %.
- La conclusión debe cerrar con una recomendación (Operar / Esperar / No operar).\n`;
}

export function buildDefaultSemaforoInput(): SemaforoInput {
  const random = (min: number, max: number) => Number((Math.random() * (max - min) + min).toFixed(2));

  return {
    open_interest: {
      total: random(12_000_000_000, 18_000_000_000),
      change_pct: random(-6, 6)
    },
    funding_rate: [
      { symbol: "BTC", value: random(-0.01, 0.015) },
      { symbol: "ETH", value: random(-0.012, 0.018) }
    ],
    liquidation_map: {
      clusters: ["41000-41500", "42000-42500"],
      notes: "Zonas con mayor densidad de liquidaciones"
    },
    average_leverage_ratio: {
      btc: random(2.3, 4.6),
      eth: random(2.1, 4.1)
    },
    long_short_ratio: {
      long: random(45, 55),
      short: random(45, 55)
    },
    volume_variation_24h: {
      btc: {
        volume: random(800_000_000, 1_500_000_000),
        delta_pct: random(-10, 12)
      },
      eth: {
        volume: random(400_000_000, 900_000_000),
        delta_pct: random(-9, 10)
      }
    },
    cdri: {
      value: random(30, 80),
      interpretation: "Índice sintetizado de riesgo derivado"
    }
  };
}
