import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Perfil from "../paginas/perfil";

// =====================================================================
// vi.hoisted garantiza que estas variables existen ANTES del hoist de vi.mock
// =====================================================================
const { mockActualizar, mockCambiarContrasena, mockObtenerUsuarioActual, mockObtenerDocumentosUsuario, navigateMock } =
  vi.hoisted(() => ({
    mockActualizar: vi.fn(),
    mockCambiarContrasena: vi.fn(),
    mockObtenerUsuarioActual: vi.fn(),
    mockObtenerDocumentosUsuario: vi.fn(),
    navigateMock: vi.fn(),
  }));

// =====================================================================
// MOCK DE userService
// =====================================================================
vi.mock("../api/userService", () => ({
  userService: {
    actualizar: mockActualizar,
    cambiarContrasena: mockCambiarContrasena,
  },
}));

// =====================================================================
// MOCK DE useUsuarios
// =====================================================================
vi.mock("../hooks/useUsuarios", () => ({
  useUsuarios: () => ({
    obtenerUsuarioActual: mockObtenerUsuarioActual,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    error: null,
    usuario: null,
  }),
}));

// =====================================================================
// MOCK DE useDocumentos
// =====================================================================
vi.mock("../hooks/useDocumentos", () => ({
  useDocumentos: () => ({
    obtenerDocumentosUsuario: mockObtenerDocumentosUsuario,
    subirDocumento: vi.fn(),
    verificarDocumentosAprobados: vi.fn(),
    documentos: [],
    loading: false,
    error: null,
  }),
}));

// =====================================================================
// MOCK DE useNavigate
// =====================================================================
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// =====================================================================
// DATOS DE PRUEBA
// =====================================================================
const mockUsuario = {
  id: 1,
  pnombre: "Juan",
  snombre: "Carlos",
  papellido: "Pérez",
  email: "juan.perez@email.com",
  rut: "12345678-9",
  ntelefono: "+56912345678",
  fnacimiento: "1995-05-15",
  fcreacion: "2024-01-01",
  factualizacion: "2024-11-26",
  rolId: 3,
  estadoId: 1,
  duocVip: false,
  puntos: 100,
  codigoRef: "ABC123XYZ",
  clave: "hashedpassword",
  rol: { id: 3, nombre: "ARRIENDATARIO" },
  estado: { id: 1, nombre: "ACTIVO" },
};

const mockDocumentos = [
  { id: 1, nombre: "DNI_Juan_Perez.pdf", fechaSubido: "2024-11-20", usuarioId: 1, estadoId: 2, tipoDocId: 1 },
  { id: 2, nombre: "Liquidacion_Sueldo.pdf", fechaSubido: "2024-11-21", usuarioId: 1, estadoId: 1, tipoDocId: 3 },
  { id: 3, nombre: "Certificado_Antecedentes.pdf", fechaSubido: "2024-11-22", usuarioId: 1, estadoId: 3, tipoDocId: 4 },
];

// =====================================================================
// HELPER
// =====================================================================
const renderPerfil = () =>
  render(
    <MemoryRouter>
      <Perfil />
    </MemoryRouter>
  );

const waitForUsuario = () =>
  waitFor(() => expect(screen.getByText("Juan Carlos Pérez")).toBeInTheDocument(), { timeout: 3000 });

describe("Perfil Component - Microservicios", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userId", "1");
    localStorage.setItem("userEmail", "juan.perez@email.com");

    vi.clearAllMocks();
    navigateMock.mockClear();
  });

  // ===================================================================
  // AUTENTICACIÓN Y CARGA
  // ===================================================================

  it("redirige al login si no está autenticado", async () => {
    localStorage.removeItem("isLoggedIn");
    renderPerfil();
    expect(localStorage.getItem("isLoggedIn")).toBeNull();
  });

  it("muestra loading mientras carga los datos", () => {
    mockObtenerUsuarioActual.mockImplementation(() => new Promise(() => {}));
    renderPerfil();
    expect(screen.getByText(/cargando tu información/i)).toBeInTheDocument();
  });

  it("muestra error si no se pueden cargar los datos", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(null);
    renderPerfil();
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar tu perfil/i)).toBeInTheDocument();
    });
  });

  // ===================================================================
  // VISUALIZACIÓN DE DATOS
  // ===================================================================

  it("carga y muestra los datos del usuario", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(mockDocumentos);
    renderPerfil();

    await waitForUsuario();
    expect(screen.getByText("juan.perez@email.com")).toBeInTheDocument();
    expect(screen.getByText("ARRIENDATARIO")).toBeInTheDocument();
    expect(screen.getByText("12345678-9")).toBeInTheDocument();
    expect(screen.getByText("+56912345678")).toBeInTheDocument();
  });

  it("muestra los puntos y código de referido del usuario", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("ABC123XYZ")).toBeInTheDocument();
    });
  });

  it("muestra badge DuocUC VIP si el usuario es de DuocUC", async () => {
    mockObtenerUsuarioActual.mockResolvedValue({ ...mockUsuario, duocVip: true });
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByText(/duocuc vip/i)).toBeInTheDocument();
      expect(screen.getByText(/20% descuento/i)).toBeInTheDocument();
    });
  });

  it("muestra las iniciales del usuario en el avatar", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => expect(screen.getByText("JP")).toBeInTheDocument());
  });

  it("muestra el rol correcto según rolId", async () => {
    mockObtenerUsuarioActual.mockResolvedValue({ ...mockUsuario, rolId: 3 });
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => expect(screen.getByText("ARRIENDATARIO")).toBeInTheDocument(), { timeout: 2000 });
  });

  // ===================================================================
  // DOCUMENTOS
  // ===================================================================

  it("carga y muestra los documentos del usuario", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(mockDocumentos);
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByText(/dni.*cédula/i)).toBeInTheDocument();
      expect(screen.getByText(/liquidación de sueldo/i)).toBeInTheDocument();
      expect(screen.getByText(/certificado de antecedentes/i)).toBeInTheDocument();
    });
  });

  it("muestra los estados correctos de los documentos", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(mockDocumentos);
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByText("Aprobado")).toBeInTheDocument();
      expect(screen.getByText("Pendiente")).toBeInTheDocument();
      expect(screen.getByText("Rechazado")).toBeInTheDocument();
    });
  });

  it("muestra alerta si no hay documentos aprobados", async () => {
    const docsNoAprobados = mockDocumentos.map((doc) => ({ ...doc, estadoId: 1 }));
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(docsNoAprobados);
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByText(/necesitas al menos un documento aprobado/i)).toBeInTheDocument();
    });
  });

  it("muestra mensaje si no hay documentos cargados", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByText(/no tienes documentos cargados/i)).toBeInTheDocument();
    });
  });

  it("muestra botón para subir documentos", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /subir documento/i })).toBeInTheDocument();
    });
  });

  // ===================================================================
  // EDICIÓN DE PERFIL
  // ===================================================================

  it("permite entrar en modo edición", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  it("permite editar los campos del perfil", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /editar/i })));

    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "Pedro" } });
    expect(nombreInput).toHaveValue("Pedro");
  });

  it("valida los campos al guardar cambios — nombre vacío", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /editar/i })));

    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    });
    expect(mockActualizar).not.toHaveBeenCalled();
  });

  it("valida el formato del teléfono", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /editar/i })));

    const telefonoInput = screen.getByDisplayValue("+56912345678");
    fireEvent.change(telefonoInput, { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/formato de teléfono inválido/i)).toBeInTheDocument();
    });
    expect(mockActualizar).not.toHaveBeenCalled();
  });

  it("guarda los cambios exitosamente y muestra notificación", async () => {
    const usuarioActualizado = { ...mockUsuario, pnombre: "Pedro" };
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    mockActualizar.mockResolvedValue(usuarioActualizado);
    renderPerfil();

    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /editar/i })));

    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "Pedro" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(mockActualizar).toHaveBeenCalledWith(1, expect.objectContaining({ pnombre: "Pedro" }));
      expect(screen.getByText(/perfil actualizado exitosamente/i)).toBeInTheDocument();
    });
  });

  it("muestra error si falla al guardar cambios", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    mockActualizar.mockRejectedValue(new Error("Error de red"));
    renderPerfil();

    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /editar/i })));
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/error al actualizar el perfil/i)).toBeInTheDocument();
    });
  });

  it("cancela la edición y restaura los valores originales", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /editar/i })));

    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "Pedro" } });
    expect(nombreInput).toHaveValue("Pedro");

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.getByText("Juan Carlos Pérez")).toBeInTheDocument());
  });

  // ===================================================================
  // CAMBIO DE CONTRASEÑA
  // ===================================================================

  it("muestra el formulario de cambio de contraseña", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitForUsuario();
    expect(screen.getByText(/cambio de contraseña/i)).toBeInTheDocument();
    expect(screen.getByText(/contraseña actual/i)).toBeInTheDocument();
    expect(screen.getByText(/nueva contraseña/i)).toBeInTheDocument();
  });

  it("valida que la nueva contraseña tenga al menos 8 caracteres", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitForUsuario();

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "actual123" } });
    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), { target: { value: "corta" } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: "corta" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    });
    expect(mockCambiarContrasena).not.toHaveBeenCalled();
  });

  it("valida que las contraseñas nuevas coincidan", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    renderPerfil();

    await waitForUsuario();

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "actual123" } });
    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), { target: { value: "nuevaPass1" } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: "diferente1" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirmación de la contraseña no coincide/i)).toBeInTheDocument();
    });
    expect(mockCambiarContrasena).not.toHaveBeenCalled();
  });

  it("cambia la contraseña exitosamente", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    mockCambiarContrasena.mockResolvedValue(undefined);
    renderPerfil();

    await waitForUsuario();

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "actual123" } });
    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), { target: { value: "nuevaPass1" } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: "nuevaPass1" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(mockCambiarContrasena).toHaveBeenCalledWith(1, "actual123", "nuevaPass1");
      expect(screen.getByText(/contraseña actualizada exitosamente/i)).toBeInTheDocument();
    });
  });

  it("muestra error si falla el cambio de contraseña", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);
    mockCambiarContrasena.mockRejectedValue(new Error("La contraseña actual es incorrecta"));
    renderPerfil();

    await waitForUsuario();

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "incorrecta" } });
    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), { target: { value: "nuevaPass1" } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: "nuevaPass1" } });

    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cambiar la contraseña/i)).toBeInTheDocument();
    });
  });
});
