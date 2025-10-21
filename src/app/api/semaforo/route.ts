import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  buildSemaforoPrompt,
  type SemaforoInput
} from "@/lib/services/semaforo";
import { env } from "@/lib/env";

type OpenAIResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SemaforoInput & { retries?: number };
  const prompt = buildSemaforoPrompt(payload);
  const fecha = easternDate();

  console.info("[SEMAFORO][PROMPT]", fecha, "\n", prompt);

  let estado: "Verde" | "Amarillo" | "Rojo" | "Indeterminado" = "Indeterminado";
  let explicacion =
    "No se pudo obtener respuesta del modelo. Revisar manualmente.";
  let structuredAnalysis: ParsedSemaforo | null = null;
  let errorMessage: string | null = null;

  if (env.openAIApiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.openAIApiKey}`
        },
        body: JSON.stringify({
          model: env.semaforoModel,
          temperature: 0,
          messages: [
            { role: "system", content: "Eres un analista de riesgo estricto." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI error: ${await response.text()}`);
      }
      const completion = (await response.json()) as OpenAIResponse;
      const content = completion.choices[0]?.message?.content ?? "";
      structuredAnalysis = parseSemaforoResponse(content);
      if (structuredAnalysis) {
        estado = structuredAnalysis.estado;
        explicacion = structuredAnalysis.conclusion.slice(0, 1000);
      } else {
        const parsed = safeParseJSON(content);
        if (parsed && parsed.estado) {
          estado = parsed.estado;
          explicacion = (parsed.explicacion ?? "").slice(0, 1000);
        }
      }
    } catch (error) {
      errorMessage = (error as Error).message;
    }
  } else {
    errorMessage = "OPENAI_API_KEY no configurado.";
  }

  const supabase = createAdminSupabaseClient();
  const { error: upsertError } = await supabase.from("global_semaforo_daily").upsert(
    {
      fecha,
      estado,
      indicadores_json: {
        open_interest: payload.open_interest,
        funding_rate: payload.funding_rate,
        liquidation_map: payload.liquidation_map,
        average_leverage_ratio: payload.average_leverage_ratio,
        long_short_ratio: payload.long_short_ratio,
        volume_variation_24h: payload.volume_variation_24h,
        cdri: payload.cdri,
        parsed: structuredAnalysis,
        error: errorMessage
      },
      explicacion_gpt: explicacion,
      computed_at: new Date().toISOString(),
      retries: payload.retries ?? 0
    },
    { onConflict: "fecha" }
  );

  if (upsertError) {
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    action: "semaforo.generated",
    payload: { fecha, estado, error: errorMessage }
  });

  revalidatePath("/dashboard");

  return NextResponse.json({
    ok: true,
    estado,
    explicacion,
    error: errorMessage
  });
}

function easternDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function safeParseJSON(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

type ParsedSemaforo = {
  estado: "Verde" | "Amarillo" | "Rojo";
  conclusion: string;
  probabilities: {
    long: number | null;
    short: number | null;
  };
  raw: string;
};

function parseSemaforoResponse(content: string): ParsedSemaforo | null {
  const estadoMatch = content.match(
    /SEMÁFORO DE RIESGO:\s*(?:\[)?(Verde|Amarillo|Rojo)(?:\])?/i
  );
  if (!estadoMatch) {
    return null;
  }
  const estadoText = capitalize(estadoMatch[1]);

  const conclusionMatch = content.match(
    /🧠\*\*Conclusión técnica:\*\*\s*([\s\S]+)/i
  );
  let conclusion = conclusionMatch ? conclusionMatch[1].trim() : "";
  if (conclusion.includes("\n")) {
    conclusion = conclusion.split("\n")[0].trim();
  }
  if (!conclusion) {
    conclusion = "Sin conclusión técnica proporcionada.";
  }

  const probabilityMatch = content.match(
    /LONG:\s*(\d{1,3})\s*%[^S]*SHORT:\s*(\d{1,3})\s*%/i
  );

  return {
    estado: estadoText as ParsedSemaforo["estado"],
    conclusion,
    probabilities: {
      long: probabilityMatch ? Number(probabilityMatch[1]) : null,
      short: probabilityMatch ? Number(probabilityMatch[2]) : null
    },
    raw: content.trim()
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
