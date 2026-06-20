import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MisArriendos from '../paginas/MisArriendos';

const mockFetch = vi.fn();
global.fetch = mockFetch;
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('MisArriendos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    localStorage.clear();
  });

  it('redirige al login si no está autenticado', () => {
    render(<MemoryRouter><MisArriendos /></MemoryRouter>);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('muestra acceso denegado si no es ARRIENDATARIO ni ADMIN', () => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'PROPIETARIO');
    localStorage.setItem('userId', '1');
    render(<MemoryRouter><MisArriendos /></MemoryRouter>);
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
  });

  it('muestra título para arrendatario', () => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'ARRIENDATARIO');
    localStorage.setItem('userId', '1');
    render(<MemoryRouter><MisArriendos /></MemoryRouter>);
    expect(screen.getByText(/mis arriendos/i)).toBeInTheDocument();
  });
});