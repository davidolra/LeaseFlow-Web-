import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Contacto from "../paginas/contacto";

// Mock del hook useContacto
const mockCrearMensaje = vi.fn();
const mockUseContacto = {
  crearMensaje: mockCrearMensaje,
  loading: false,
  error: null,
  mensajes: [],
  listarTodos: vi.fn(),
  listarPorUsuario: vi.fn(),
};

vi.mock("../hooks/useContacto", () => ({
  default: () => mockUseContacto,
  useContacto: () => mockUseContacto,
}));

describe("Contacto Component - Microservicios", () => {
  beforeEach(() => {
    localStorage.clear();
    mockCrearMensaje.mockClear();
    vi.clearAllMocks();
  });

  it("muestra todos los campos del formulario", () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asunto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaje/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar mensaje/i })).toBeInTheDocument();
  });

  it("el botón está deshabilitado con campos vacíos", () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    const boton = screen.getByRole("button", { name: /enviar mensaje/i });
    expect(boton).toBeDisabled();
  });

  it("muestra errores de validación para campos obligatorios", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    // Intentar enviar con campos vacíos
    const nombreInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nombreInput, { target: { value: "" } });
    fireEvent.blur(nombreInput);

    await waitFor(() => {
      expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    });
  });

  it("valida que el nombre solo contenga letras", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    const nombreInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nombreInput, { target: { value: "Juan123" } });
    fireEvent.blur(nombreInput);

    await waitFor(() => {
      expect(screen.getByText(/ingrese solo letras y espacios/i)).toBeInTheDocument();
    });
  });

  it("valida el formato del email", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "emailinvalido" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/formato de email no válido/i)).toBeInTheDocument();
    });
  });

  it("valida la longitud mínima del mensaje", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    const mensajeInput = screen.getByLabelText(/mensaje/i);
    fireEvent.change(mensajeInput, { target: { value: "Corto" } });
    fireEvent.blur(mensajeInput);

    await waitFor(() => {
      expect(screen.getByText(/el mensaje debe tener al menos 10 caracteres/i)).toBeInTheDocument();
    });
  });

  it("muestra el contador de caracteres para asunto y mensaje", () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    expect(screen.getByText(/0\/200 caracteres/i)).toBeInTheDocument(); // Asunto
    expect(screen.getByText(/0\/5000 caracteres/i)).toBeInTheDocument(); // Mensaje
  });

  it("actualiza el contador de caracteres al escribir", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    const asuntoInput = screen.getByLabelText(/asunto/i);
    fireEvent.change(asuntoInput, { target: { value: "Consulta sobre arriendo" } });

    await waitFor(() => {
      expect(screen.getByText(/24\/200 caracteres/i)).toBeInTheDocument();
    });
  });

  it("habilita el botón cuando todos los campos requeridos son válidos", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Juan Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "juan@correo.com" },
    });
    fireEvent.change(screen.getByLabelText(/asunto/i), {
      target: { value: "Consulta sobre arriendo" },
    });
    fireEvent.change(screen.getByLabelText(/mensaje/i), {
      target: { value: "Hola, este es un mensaje válido con más de 10 caracteres." },
    });

    await waitFor(() => {
      const boton = screen.getByRole("button", { name: /enviar mensaje/i });
      expect(boton).not.toBeDisabled();
    });
  });

  it("envía el mensaje correctamente cuando el formulario es válido", async () => {
    mockCrearMensaje.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        nombre: "Juan Pérez",
        email: "juan@correo.com",
        asunto: "Consulta",
        mensaje: "Este es un mensaje de prueba válido.",
        estado: "PENDIENTE",
      },
    });

    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Juan Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "juan@correo.com" },
    });
    fireEvent.change(screen.getByLabelText(/asunto/i), {
      target: { value: "Consulta sobre arriendo" },
    });
    fireEvent.change(screen.getByLabelText(/mensaje/i), {
      target: { value: "Este es un mensaje de prueba válido con más de 10 caracteres." },
    });

    fireEvent.click(screen.getByRole("button", { name: /enviar mensaje/i }));

    await waitFor(() => {
      expect(mockCrearMensaje).toHaveBeenCalledWith({
        nombre: "Juan Pérez",
        email: "juan@correo.com",
        asunto: "Consulta sobre arriendo",
        mensaje: "Este es un mensaje de prueba válido con más de 10 caracteres.",
        numeroTelefono: undefined,
        usuarioId: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/gracias juan pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/tu mensaje ha sido enviado correctamente/i)).toBeInTheDocument();
    });
  });

  it("limpia el formulario después de enviar exitosamente", async () => {
    mockCrearMensaje.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        nombre: "Juan Pérez",
        email: "juan@correo.com",
        asunto: "Consulta",
        mensaje: "Mensaje de prueba",
      },
    });

    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Juan Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "juan@correo.com" },
    });
    fireEvent.change(screen.getByLabelText(/asunto/i), {
      target: { value: "Consulta" },
    });
    fireEvent.change(screen.getByLabelText(/mensaje/i), {
      target: { value: "Este es un mensaje válido." },
    });

    fireEvent.click(screen.getByRole("button", { name: /enviar mensaje/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toHaveValue("");
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/asunto/i)).toHaveValue("");
      expect(screen.getByLabelText(/mensaje/i)).toHaveValue("");
    });
  });

  it("muestra mensaje de error cuando falla el envío", async () => {
    mockCrearMensaje.mockResolvedValue({
      success: false,
      error: "Error al enviar el mensaje",
    });

    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Juan Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "juan@correo.com" },
    });
    fireEvent.change(screen.getByLabelText(/asunto/i), {
      target: { value: "Consulta" },
    });
    fireEvent.change(screen.getByLabelText(/mensaje/i), {
      target: { value: "Este es un mensaje válido." },
    });

    fireEvent.click(screen.getByRole("button", { name: /enviar mensaje/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al enviar el mensaje/i)).toBeInTheDocument();
    });
  });

  it("pre-llena el email si el usuario está logueado", () => {
    localStorage.setItem("userEmail", "usuario.logueado@email.com");

    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/email/i)).toHaveValue("usuario.logueado@email.com");
    expect(screen.getByText(/detectamos que estás logueado/i)).toBeInTheDocument();
  });

  it("incluye usuarioId si el usuario está logueado", async () => {
    localStorage.setItem("userId", "123");
    localStorage.setItem("userEmail", "usuario@email.com");

    mockCrearMensaje.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        usuarioId: 123,
      },
    });

    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/asunto/i), {
      target: { value: "Consulta" },
    });
    fireEvent.change(screen.getByLabelText(/mensaje/i), {
      target: { value: "Mensaje de prueba válido." },
    });

    fireEvent.click(screen.getByRole("button", { name: /enviar mensaje/i }));

    await waitFor(() => {
      expect(mockCrearMensaje).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 123,
        })
      );
    });
  });

  it("deshabilita el botón mientras está enviando", async () => {
    mockUseContacto.loading = true;

    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "juan@correo.com" },
    });
    fireEvent.change(screen.getByLabelText(/asunto/i), {
      target: { value: "Consulta" },
    });
    fireEvent.change(screen.getByLabelText(/mensaje/i), {
      target: { value: "Mensaje válido de prueba." },
    });

    const boton = screen.getByRole("button", { name: /enviando/i });
    expect(boton).toBeDisabled();

    mockUseContacto.loading = false;
  });

  it("valida límite máximo de caracteres en asunto", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    const asuntoLargo = "A".repeat(201);
    fireEvent.change(screen.getByLabelText(/asunto/i), {
      target: { value: asuntoLargo },
    });
    fireEvent.blur(screen.getByLabelText(/asunto/i));

    await waitFor(() => {
      expect(screen.getByText(/el asunto no puede exceder 200 caracteres/i)).toBeInTheDocument();
    });
  });

  it("valida límite máximo de caracteres en mensaje", async () => {
    render(
      <MemoryRouter>
        <Contacto />
      </MemoryRouter>
    );

    const mensajeLargo = "A".repeat(5001);
    fireEvent.change(screen.getByLabelText(/mensaje/i), {
      target: { value: mensajeLargo },
    });
    fireEvent.blur(screen.getByLabelText(/mensaje/i));

    await waitFor(() => {
      expect(screen.getByText(/el mensaje no puede exceder 5000 caracteres/i)).toBeInTheDocument();
    });
  });
});