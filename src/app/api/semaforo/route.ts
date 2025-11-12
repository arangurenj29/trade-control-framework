import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { buildSemaforoPrompt } from "@/lib/services/semaforo";
import { env } from "@/lib/env";
import { getEasternDateString } from "@/lib/dates";

type ClaudeResponse = {
  content: Array<
    | {
        type: "text";
        text: string;
      }
    | {
        type: string;
        text?: string;
      }
  >;
};

export async function POST(request: Request) {
  const body = await readRequestBody(request);
  const bodyObject = (body && typeof body === "object" ? (body as Record<string, unknown>) : null) ?? null;
  const shouldAutoGenerate = !bodyObject || Boolean((bodyObject as { auto?: boolean }).auto);
  const retries = typeof (bodyObject as { retries?: number })?.retries === "number" ? (bodyObject as { retries?: number }).retries : 0;
  const manualIndicators =
    shouldAutoGenerate || !bodyObject
      ? null
      : buildManualIndicatorsPayload(bodyObject);

  const prompt = buildSemaforoPrompt();
  const fecha = getEasternDateString();

  console.info("[SEMAFORO][PROMPT]", fecha, "\n", prompt);

  let estado: "Verde" | "Amarillo" | "Rojo" | "Indeterminado" = "Indeterminado";
  let explicacion = "No se pudo obtener respuesta del modelo. Revisar manualmente.";
  let structuredAnalysis: ParsedSemaforo | null = null;
  let errorMessage: string | null = null;

  if (!env.claudeApiKey) {
    errorMessage = "CLAUDE_API_KEY no configurado.";
    explicacion = errorMessage;
  } else {
    try {
      const completion = await generateClaudeCompletion(prompt);
      const content =
        completion.content
          ?.map((block) => ("text" in block ? block.text ?? "" : ""))
          .join("\n")
          .trim() ?? "";
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
      explicacion = errorMessage.slice(0, 1000);
    }
  }

  const supabase = createAdminSupabaseClient();
  const { error: upsertError } = await supabase.from("global_semaforo_daily").upsert(
    {
      fecha,
      estado,
      indicadores_json: buildIndicadoresJson(manualIndicators, structuredAnalysis, errorMessage),
      explicacion_gpt: explicacion,
      computed_at: new Date().toISOString(),
      retries
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

  const responseError = errorMessage;

  return NextResponse.json({
    ok: !responseError,
    estado,
    explicacion,
    error: responseError
  });
}

async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
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

function buildManualIndicatorsPayload(input: Record<string, unknown>) {
  const filteredEntries = Object.entries(input).filter(
    ([key]) => key !== "auto" && key !== "retries"
  );
  if (filteredEntries.length === 0) {
    return null;
  }
  return Object.fromEntries(filteredEntries);
}

function buildIndicadoresJson(
  manualIndicators: Record<string, unknown> | null,
  structuredAnalysis: ParsedSemaforo | null,
  errorMessage: string | null
) {
  return {
    source: manualIndicators ? "manual" : "claude:auto",
    payload: manualIndicators,
    parsed: structuredAnalysis,
    error: errorMessage,
    note: manualIndicators
      ? "Payload proporcionado manualmente. Claude no recibió datos estructurados."
      : "Claude obtuvo los indicadores directamente desde sus fuentes."
  };
}

class ClaudeAPIError extends Error {
  constructor(message: string, readonly isModelMissing = false) {
    super(message);
    this.name = "ClaudeAPIError";
  }
}

async function generateClaudeCompletion(prompt: string) {
  const candidates = resolveModelCandidates();
  let lastError: Error | null = null;

  for (const model of candidates) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.claudeApiKey!,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 800,
          temperature: 0,
          system: "Eres un analista de riesgo estricto.",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const { error, raw } = await readClaudeError(response);
        const isModelMissing = error?.type === "not_found_error" || /model:\s*/i.test(error?.message ?? "");
        throw new ClaudeAPIError(`Claude error: ${raw}`, isModelMissing);
      }

      console.info("[SEMAFORO][CLAUDE] modelo utilizado:", model);
      return (await response.json()) as ClaudeResponse;
    } catch (error) {
      lastError = error as Error;
      const shouldFallback = error instanceof ClaudeAPIError && error.isModelMissing;
      if (!shouldFallback) {
        throw error;
      }
      console.warn(`[SEMAFORO][CLAUDE] modelo no disponible (${model}). Probando siguiente fallback...`);
    }
  }

  throw lastError ?? new Error("Claude no disponible");
}

function resolveModelCandidates() {
  const preferred = env.semaforoModel;
  const fallbacks = [
    "claude-3-5-sonnet-20240620",
    "claude-3-5-sonnet-20241022",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307"
  ];
  const unique = [preferred, ...fallbacks].filter((model, index, arr) => model && arr.indexOf(model) === index);
  return unique;
}

async function readClaudeError(response: Response) {
  const raw = await response.text();
  try {
    return { raw, error: JSON.parse(raw).error as { type?: string; message?: string } };
  } catch {
    return { raw, error: null };
  }
}
