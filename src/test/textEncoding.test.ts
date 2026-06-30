import { describe, expect, it } from "vitest";
import { normalizeApiData, normalizeUtf8Text } from "../utils/textEncoding";

describe("textEncoding", () => {
  it("repara texto mojibake comun", () => {
    expect(normalizeUtf8Text("ContraseÃ±a invÃ¡lida")).toBe("Contraseña inválida");
    expect(normalizeUtf8Text("Â¿CÃ³mo estÃ¡s?")).toBe("¿Cómo estás?");
  });

  it("normaliza recursivamente respuestas JSON", () => {
    const input = {
      titulo: "GestiÃ³n de Usuarios",
      usuario: {
        nombre: "JosÃ© PiÃ±era",
      },
      etiquetas: ["AÃ±o", "InformaciÃ³n"],
    };

    expect(normalizeApiData(input)).toEqual({
      titulo: "Gestión de Usuarios",
      usuario: {
        nombre: "José Piñera",
      },
      etiquetas: ["Año", "Información"],
    });
  });
});
