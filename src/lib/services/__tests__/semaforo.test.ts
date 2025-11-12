import { describe, expect, it } from "vitest";
import { buildSemaforoPrompt } from "@/lib/services/semaforo";

describe("buildSemaforoPrompt", () => {
  it("construye la plantilla determinista sin incluir datos embedidos", () => {
    const prompt = buildSemaforoPrompt();

    expect(prompt).toContain("Actúa como un analista profesional de derivados");
    expect(prompt).toContain("Debes investigar el estado actual del mercado");
    expect(prompt).toContain("Formato obligatorio");
    expect(prompt).toContain("🧠**Conclusión técnica:**");
    expect(prompt).toContain("Mantén un tono técnico y conciso; máximo 1 000 caracteres");
    expect(prompt).toMatch(/LONG: XX % SHORT: XX %/);
    expect(prompt).not.toContain("Datos entregados");
  });
});
