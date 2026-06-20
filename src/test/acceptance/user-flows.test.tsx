import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../paginas/login';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * PRUEBAS DE ACEPTACIÓN - FLUJOS DE USUARIO
 * Formato: Given / When / Then
 */

describe('Aceptación: RF01 - Inicio de Sesión', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('RF01-CASO1: Muestra formulario de login con campos', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('RF01-CASO3: Login con credenciales inválidas muestra error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Email o contraseña incorrectos' }),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'wrong@email.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('Aceptación: RF05 - Navegación y Catálogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    localStorage.clear();
  });

  it('RF05-CASO1: Visualización de Home con bienvenida', async () => {
    // Given: propiedades disponibles
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, nombre: 'Casa' }],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const Home = (await vi.importActual('../../paginas/home')).default;
    render(
      <MemoryRouter initialEntries={['/']}>
        <Home />
      </MemoryRouter>
    );

    // Then: se muestra sección de bienvenida
    await waitFor(() => {
      expect(screen.getByText(/Bienvenidos a Leaseflow/i)).toBeInTheDocument();
    });
  });
});