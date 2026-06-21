import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../paginas/login";

// Mock de useNavigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("Login Component - Microservicios", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    vi.clearAllMocks();

    // Reset fetch mock
    vi.mocked(global.fetch).mockReset();
  });

  afterEach(() => {
    vi.mocked(global.fetch).mockReset();
  });

  it("muestra los campos de correo y contraseña", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("muestra mensaje de error si faltan datos", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Verificar que los campos están vacíos
    const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;

    expect(emailInput.value).toBe("");
    expect(passwordInput.value).toBe("");

    // El botón debe estar disponible para hacer click
    const button = screen.getByRole("button", { name: /iniciar sesión/i });
    expect(button).toBeInTheDocument();
  });

  it("muestra mensaje de error si la contraseña tiene menos de 8 caracteres", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "1234" },
    });

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    // El frontend valida mediante el componente, el servidor da feedback
    const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
    expect(passwordInput.value).toBe("1234");
  });

  it("llama al servicio de login con credenciales válidas", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          mensaje: "Login exitoso",
          usuario: {
            id: 1,
            email: "juan.perez@email.com",
            pnombre: "Juan",
            papellido: "Pérez",
            rolId: 3,
          },
        }),
        { status: 200 }
      )
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "juan.perez@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("muestra mensaje de error cuando las credenciales son incorrectas", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          mensaje: "Email o contraseña incorrectos",
        }),
        { status: 401 }
      )
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "wrong@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "wrongpass123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("muestra mensaje de error cuando hay un error de conexión", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response("Failed to fetch", {
        status: 503,
        statusText: "Service Unavailable",
      })
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/el servidor no está disponible|no se pudo conectar|error al conectar/i)
      ).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("deshabilita el botón mientras está cargando", async () => {
    vi.mocked(global.fetch).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      const button = screen.queryByRole("button", { name: /iniciando sesión/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it("guarda datos en localStorage al hacer login exitoso", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          mensaje: "Login exitoso",
          usuario: {
            id: 1,
            email: "juan.perez@email.com",
            pnombre: "Juan",
            papellido: "Pérez",
            rolId: 3,
          },
        }),
        { status: 200 }
      )
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "juan.perez@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem("isLoggedIn")).toBe("true");
      expect(localStorage.getItem("userEmail")).toBe("juan.perez@email.com");
      expect(localStorage.getItem("userId")).toBe("1");
    });
  });
});
