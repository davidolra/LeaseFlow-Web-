import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Registro from "../paginas/Registro";

// Mock de userService
const mockRegistrar = vi.fn();
vi.mock("../api/userService", () => ({
  userService: {
    registrar: mockRegistrar,
  },
}));

// Mock de documentoService
const mockCrearDocumento = vi.fn();
vi.mock("../api/documentService", () => ({
  documentoService: {
    crear: mockCrearDocumento,
  },
}));

// Mock de useNavigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("Registro Component - Microservicios", () => {
  const onRegisterSuccess = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    mockRegistrar.mockClear();
    mockCrearDocumento.mockClear();
    onRegisterSuccess.mockClear();
    vi.clearAllMocks();
  });

  it("muestra todos los campos del formulario en paso 1", () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/primer nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rut/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de nacimiento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it("muestra errores de validación si los campos están vacíos", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByText(/el primer nombre es obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/el apellido es obligatorio/i)).toBeInTheDocument();
    });
  });

  it("valida el formato del email", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "emailinvalido" },
    });

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByText(/formato de correo inválido/i)).toBeInTheDocument();
    });
  });

  it("valida que el usuario sea mayor de 18 años", async () => {
    const fechaMenor = new Date();
    fechaMenor.setFullYear(fechaMenor.getFullYear() - 15);

    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
      target: { value: fechaMenor.toISOString().split("T")[0] },
    });

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByText(/debes ser mayor de 18 años/i)).toBeInTheDocument();
    });
  });

  it("valida que las contraseñas coincidan", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "password456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it("valida la contraseña con mínimo 8 caracteres", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    });
  });

  it("detecta correos DuocUC y muestra beneficio", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "test@duocuc.cl" },
    });

    await waitFor(() => {
      expect(screen.getByText(/correo duocuc detectado/i)).toBeInTheDocument();
      expect(screen.getByText(/20% de descuento/i)).toBeInTheDocument();
    });
  });

  it("avanza al paso 2 (documentos) con datos válidos", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    // Llenar todos los campos requeridos
    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/rut/i), {
      target: { value: "12345678-9" },
    });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "juan.perez@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: "+56912345678" },
    });
    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
      target: { value: "1995-05-15" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "password123" },
    });

    // Seleccionar rol
    fireEvent.click(screen.getByLabelText(/arrendatario/i));

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByText(/carga de documentos/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /volver/i })).toBeInTheDocument();
    });
  });

  it("permite volver del paso 2 al paso 1", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    // Llenar datos y avanzar
    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/rut/i), {
      target: { value: "12345678-9" },
    });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "juan.perez@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: "+56912345678" },
    });
    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
      target: { value: "1995-05-15" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByLabelText(/arrendatario/i));

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /volver/i })).toBeInTheDocument();
    });

    // Volver al paso 1
    fireEvent.click(screen.getByRole("button", { name: /volver/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/primer nombre/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /continuar a documentos/i })).toBeInTheDocument();
    });
  });

  it("valida que los documentos requeridos estén cargados", async () => {
    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    // Avanzar al paso 2 (asumiendo datos válidos)
    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/rut/i), {
      target: { value: "12345678-9" },
    });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "juan.perez@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: "+56912345678" },
    });
    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
      target: { value: "1995-05-15" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByLabelText(/arrendatario/i));

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /completar registro/i })).toBeInTheDocument();
    });

    // Intentar completar sin documentos
    fireEvent.click(screen.getByRole("button", { name: /completar registro/i }));

    // Debería mostrar errores de validación para documentos requeridos
    await waitFor(() => {
      expect(screen.getByText(/dni.*es obligatorio/i)).toBeInTheDocument();
    });
  });

  it("completa el registro exitosamente", async () => {
    mockRegistrar.mockResolvedValue({
      id: 1,
      email: "juan.perez@email.com",
      pnombre: "Juan",
      papellido: "Pérez",
      rolId: 3,
    });

    mockCrearDocumento.mockResolvedValue({
      id: 1,
      nombre: "DNI_Juan_Perez.pdf",
      usuarioId: 1,
      estadoId: 1,
      tipoDocId: 1,
    });

    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);

    render(
      <MemoryRouter>
        <Registro onRegisterSuccess={onRegisterSuccess} />
      </MemoryRouter>
    );

    // Paso 1: Datos personales
    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText(/rut/i), {
      target: { value: "12345678-9" },
    });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "juan.perez@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: "+56912345678" },
    });
    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
      target: { value: "1995-05-15" },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByLabelText(/arrendatario/i));

    fireEvent.click(screen.getByRole("button", { name: /continuar a documentos/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /completar registro/i })).toBeInTheDocument();
    });

    // Paso 2: Subir documentos requeridos
    const file = new File(["dummy content"], "dni.pdf", { type: "application/pdf" });
    
    const dniInput = screen.getByLabelText(/dni.*cédula de identidad \*/i);
    fireEvent.change(dniInput, { target: { files: [file] } });

    const liquidacionInput = screen.getByLabelText(/liquidación de sueldo \*/i);
    fireEvent.change(liquidacionInput, { target: { files: [file] } });

    const antecedentesInput = screen.getByLabelText(/certificado de antecedentes \*/i);
    fireEvent.change(antecedentesInput, { target: { files: [file] } });

    const afpInput = screen.getByLabelText(/certificado afp \*/i);
    fireEvent.change(afpInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /completar registro/i }));

    await waitFor(() => {
      expect(mockRegistrar).toHaveBeenCalled();
      expect(onRegisterSuccess).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });
});