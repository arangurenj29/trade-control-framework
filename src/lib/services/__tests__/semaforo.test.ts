import { describe, expect, it } from "vitest";
import { buildSemaforoPrompt } from "@/lib/services/semaforo";

describe("buildSemaforoPrompt", () => {
  it("serializa entradas en la plantilla determinista", () => {
    const prompt = buildSemaforoPrompt({
      open_interest: { total: 123456789, change_24h: -2.3 },
      funding_rate: [{ symbol: "BTC", value: 0.01 }],
      liquidation_map: { clusters: ["42000-42500"] },
      average_leverage_ratio: { btc: 3.2 },
      long_short_ratio: { long: 52, short: 48 },
      volume_variation_24h: { btc: { volume: 1200000000, delta_pct: 8.5 } },
      cdri: { value: 68, zone: "High Risk" }
    });

    expect(prompt).toContain("Actúa como un analista profesional de derivados");
    expect(prompt).toContain("Long/Short Ratio =");
    expect(prompt).toContain("{\"symbol\":\"BTC\"");
    expect(prompt).toContain("🧠**Conclusión técnica:**");
    expect(prompt).toContain("límite máximo de 1 000 caracteres");
    expect(prompt).toMatch(/LONG: XX % SHORT: XX %/);
  });
});
