import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../paginas/AdminDashboard';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    localStorage.clear();
  });

  it('muestra acceso denegado si no es ADMIN', () => {
    localStorage.setItem('userRole', 'ARRIENDATARIO');
    localStorage.setItem('userId', '1');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
  });

  it('muestra cargando inicialmente', () => {
    localStorage.setItem('userRole', 'ADMIN');
    localStorage.setItem('userId', '1');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/cargando métricas/i)).toBeInTheDocument();
  });

  it('carga y muestra KPIs correctamente', async () => {
    localStorage.setItem('userRole', 'ADMIN');
    localStorage.setItem('userId', '1');

    const mockResponse = (data: any[]) => ({
      ok: true,
      status: 200,
      json: async () => data,
    });

    mockFetch
      .mockResolvedValueOnce(mockResponse([{ id: 1 }, { id: 2 }]))
      .mockResolvedValueOnce(mockResponse([{ id: 1 }]))
      .mockResolvedValueOnce(mockResponse([{ id: 1 }, { id: 2 }, { id: 3 }]))
      .mockResolvedValueOnce(mockResponse([{ id: 1 }]))
      .mockResolvedValueOnce(mockResponse([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]))
      .mockResolvedValueOnce(mockResponse([{ id: 1 }]));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/panel de administración/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Usuarios')).toBeInTheDocument();
      expect(screen.getByText('Propiedades')).toBeInTheDocument();
      expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    });
  });
});