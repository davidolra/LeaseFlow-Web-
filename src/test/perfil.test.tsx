import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Perfil from "../paginas/perfil";

// Mock del hook useUsuarios
const mockObtenerUsuarioActual = vi.fn();
const mockUseUsuarios = {
  obtenerUsuarioActual: mockObtenerUsuarioActual,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  usuario: null,
};

vi.mock("../hooks/useUsuarios", () => ({
  useUsuarios: () => mockUseUsuarios,
}));

// Mock del hook useDocumentos
const mockObtenerDocumentosUsuario = vi.fn();
const mockSubirDocumento = vi.fn();
const mockUseDocumentos = {
  obtenerDocumentosUsuario: mockObtenerDocumentosUsuario,
  subirDocumento: mockSubirDocumento,
  verificarDocumentosAprobados: vi.fn(),
  documentos: [],
  loading: false,
  error: null,
};

vi.mock("../hooks/useDocumentos", () => ({
  useDocumentos: () => mockUseDocumentos,
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

describe("Perfil Component - Microservicios", () => {
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
    rol: {
      id: 3,
      nombre: "ARRIENDATARIO",
    },
    estado: {
      id: 1,
      nombre: "ACTIVO",
    },
  };

  const mockDocumentos = [
    {
      id: 1,
      nombre: "DNI_Juan_Perez.pdf",
      fechaSubido: "2024-11-20",
      usuarioId: 1,
      estadoId: 2, // ACEPTADO
      tipoDocId: 1, // DNI
    },
    {
      id: 2,
      nombre: "Liquidacion_Sueldo.pdf",
      fechaSubido: "2024-11-21",
      usuarioId: 1,
      estadoId: 1, // PENDIENTE
      tipoDocId: 3, // LIQUIDACION_SUELDO
    },
    {
      id: 3,
      nombre: "Certificado_Antecedentes.pdf",
      fechaSubido: "2024-11-22",
      usuarioId: 1,
      estadoId: 3, // RECHAZADO
      tipoDocId: 4, // CERTIFICADO_ANTECEDENTES
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userId", "1");
    localStorage.setItem("userEmail", "juan.perez@email.com");
    
    navigateMock.mockClear();
    mockObtenerUsuarioActual.mockClear();
    mockObtenerDocumentosUsuario.mockClear();
    vi.clearAllMocks();
  });

  it("redirige al login si no está autenticado", async () => {
    localStorage.removeItem("isLoggedIn");

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/login");
    });
  });

  it("muestra loading mientras carga los datos", () => {
    mockObtenerUsuarioActual.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    expect(screen.getByText(/cargando tu información/i)).toBeInTheDocument();
  });

  it("carga y muestra los datos del usuario desde la base de datos", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(mockDocumentos);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Juan Carlos Pérez")).toBeInTheDocument();
    });

    expect(screen.getByText("juan.perez@email.com")).toBeInTheDocument();
    expect(screen.getByText("ARRIENDATARIO")).toBeInTheDocument();
    expect(screen.getByText("12345678-9")).toBeInTheDocument();
    expect(screen.getByText("+56912345678")).toBeInTheDocument();
  });

  it("muestra los puntos y código de referido del usuario", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument(); // Puntos
      expect(screen.getByText("ABC123XYZ")).toBeInTheDocument(); // Código referido
    });
  });

  it("muestra badge DuocUC VIP si el usuario es de DuocUC", async () => {
    const usuarioDuoc = { ...mockUsuario, duocVip: true };
    mockObtenerUsuarioActual.mockResolvedValue(usuarioDuoc);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/duocuc vip/i)).toBeInTheDocument();
      expect(screen.getByText(/20% descuento/i)).toBeInTheDocument();
    });
  });

  it("carga y muestra los documentos del usuario", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(mockDocumentos);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/dni.*cédula/i)).toBeInTheDocument();
      expect(screen.getByText(/liquidación de sueldo/i)).toBeInTheDocument();
      expect(screen.getByText(/certificado de antecedentes/i)).toBeInTheDocument();
    });
  });

  it("muestra los estados correctos de los documentos", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(mockDocumentos);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Aprobado")).toBeInTheDocument();
      expect(screen.getByText("Pendiente")).toBeInTheDocument();
      expect(screen.getByText("Rechazado")).toBeInTheDocument();
    });
  });

  it("muestra contador de documentos por estado", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(mockDocumentos);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/aprobados.*1/i)).toBeInTheDocument();
      expect(screen.getByText(/pendientes.*1/i)).toBeInTheDocument();
      expect(screen.getByText(/rechazados.*1/i)).toBeInTheDocument();
    });
  });

  it("muestra alerta si no hay documentos aprobados", async () => {
    const docsNoAprobados = mockDocumentos.map((doc) => ({
      ...doc,
      estadoId: 1, // Todos pendientes
    }));

    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue(docsNoAprobados);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/necesitas al menos un documento aprobado/i)
      ).toBeInTheDocument();
    });
  });

  it("muestra mensaje si no hay documentos cargados", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no tienes documentos cargados/i)).toBeInTheDocument();
    });
  });

  it("permite entrar en modo edición", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /editar/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  it("permite editar los campos del perfil", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    });

    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "Pedro" } });

    expect(nombreInput).toHaveValue("Pedro");
  });

  it("valida los campos al guardar cambios", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    });

    // Limpiar campo requerido
    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    });
  });

  it("valida el formato del teléfono", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    });

    const telefonoInput = screen.getByDisplayValue("+56912345678");
    fireEvent.change(telefonoInput, { target: { value: "123" } });

    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/formato de teléfono inválido/i)).toBeInTheDocument();
    });
  });

  it("cancela la edición y restaura los valores originales", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    });

    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "Pedro" } });
    expect(nombreInput).toHaveValue("Pedro");

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.getByText("Juan Carlos Pérez")).toBeInTheDocument();
    });
  });

  it("guarda los cambios exitosamente", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    });

    const nombreInput = screen.getByDisplayValue("Juan");
    fireEvent.change(nombreInput, { target: { value: "Pedro" } });

    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(/perfil actualizado exitosamente/i);
    });
  });

  it("muestra botón para subir documentos", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /subir documento/i })).toBeInTheDocument();
    });
  });

  it("muestra las iniciales del usuario en el avatar", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("JP")).toBeInTheDocument(); // Juan Pérez
    });
  });

  it("muestra error si no se pueden cargar los datos", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar tu perfil/i)).toBeInTheDocument();
    });
  });

  it("muestra el rol correcto según rolId", async () => {
    const roles = [
      { rolId: 1, nombre: "ADMIN" },
      { rolId: 2, nombre: "PROPIETARIO" },
      { rolId: 3, nombre: "ARRIENDATARIO" },
    ];

    for (const role of roles) {
      const usuario = { ...mockUsuario, rolId: role.rolId };
      mockObtenerUsuarioActual.mockResolvedValue(usuario);
      mockObtenerDocumentosUsuario.mockResolvedValue([]);

      const { unmount } = render(
        <MemoryRouter>
          <Perfil />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(role.nombre)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it("formatea correctamente las fechas", async () => {
    mockObtenerUsuarioActual.mockResolvedValue(mockUsuario);
    mockObtenerDocumentosUsuario.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    );

    await waitFor(() => {
      // La fecha de nacimiento debe mostrarse en formato local
      expect(screen.getByText(/15-05-1995|15\/05\/1995/)).toBeInTheDocument();
    });
  });
});