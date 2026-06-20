import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SolicitudesRecibidas from '../paginas/SolicitudesRecibidas';

const mockFetch = vi.fn();
global.fetch = mockFetch;
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('SolicitudesRecibidas Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    localStorage.clear();
  });

  it('redirige al login si no está autenticado', () => {
    render(<MemoryRouter><SolicitudesRecibidas /></MemoryRouter>);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('muestra acceso denegado si no es PROPIETARIO ni ADMIN', () => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'ARRIENDATARIO');
    localStorage.setItem('userId', '1');
    render(<MemoryRouter><SolicitudesRecibidas /></MemoryRouter>);
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
  });

  it('muestra título para propietario', () => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'PROPIETARIO');
    localStorage.setItem('userId', '1');
    render(<MemoryRouter><SolicitudesRecibidas /></MemoryRouter>);
    expect(screen.getByText(/solicitudes recibidas/i)).toBeInTheDocument();
  });
});