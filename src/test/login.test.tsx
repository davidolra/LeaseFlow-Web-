import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../paginas/login";

// Mock del hook useUsuarios
const mockLogin = vi.fn();
const mockUseUsuarios = {
  login: mockLogin,
  loading: false,
  error: null,
};

vi.mock("../hooks/useUsuarios", () => ({
  useUsuarios: () => mockUseUsuarios,
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

describe("Login Component - Microservicios", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    mockLogin.mockClear();
    vi.clearAllMocks();
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

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/por favor ingrese correo y contraseña/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
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

    await waitFor(() => {
      expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("llama al servicio de login con credenciales válidas", async () => {
    mockLogin.mockResolvedValue({
      success: true,
      mensaje: "Login exitoso",
      usuario: {
        id: 1,
        email: "juan.perez@email.com",
        pnombre: "Juan",
        papellido: "Pérez",
        rolId: 3,
      },
    });

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
      expect(mockLogin).toHaveBeenCalledWith({
        email: "juan.perez@email.com",
        clave: "password123",
      });
    });

    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("muestra mensaje de error cuando las credenciales son incorrectas", async () => {
    mockLogin.mockResolvedValue({
      success: false,
      mensaje: "Email o contraseña incorrectos",
    });

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
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("muestra mensaje de error cuando hay un error de conexión", async () => {
    mockLogin.mockRejectedValue(new Error("Failed to fetch"));

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
      expect(screen.getByText(/no se pudo conectar con el servidor/i)).toBeInTheDocument();
    });
  });

  it("deshabilita el botón mientras está cargando", async () => {
    mockUseUsuarios.loading = true;

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const button = screen.getByRole("button", { name: /iniciando sesión/i });
    expect(button).toBeDisabled();

    mockUseUsuarios.loading = false;
  });

  it("guarda datos en localStorage al hacer login exitoso", async () => {
    mockLogin.mockResolvedValue({
      success: true,
      mensaje: "Login exitoso",
      usuario: {
        id: 1,
        email: "juan.perez@email.com",
        pnombre: "Juan",
        papellido: "Pérez",
        rolId: 3,
      },
    });

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