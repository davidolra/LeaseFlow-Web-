import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../paginas/login';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockFetch = vi.fn();

describe('Integración: Login → Catálogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockNavigate.mockClear();
    localStorage.clear();
    // Sobrescribir fetch global con nuestro mock
    Object.defineProperty(globalThis, 'fetch', {
      value: mockFetch,
      writable: true,
      configurable: true,
    });
  });

  it('flujo completo: login exitoso redirige', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        mensaje: 'Login exitoso',
        usuario: { id: 1, email: 'juan@email.com', pnombre: 'Juan', rolId: 3 },
      }),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'juan@email.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it('campos vacíos no envían formulario', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const form = screen.getByRole('button', { name: /iniciar/i }).closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText(/por favor ingrese correo y contraseña/i)).toBeInTheDocument();
  });
});