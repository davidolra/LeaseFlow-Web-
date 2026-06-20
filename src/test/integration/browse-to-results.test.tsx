import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockListarPropiedades, mockBuscarPropiedades, mockUsePropiedades, mockUseSolicitudes } = vi.hoisted(() => ({
  mockListarPropiedades: vi.fn(),
  mockBuscarPropiedades: vi.fn(),
  mockUsePropiedades: vi.fn(() => ({
    propiedades: [],
    loading: false,
    error: null,
    listarPropiedades: mockListarPropiedades,
    buscarPropiedades: mockBuscarPropiedades,
    propiedad: null,
    crearPropiedad: vi.fn(),
    obtenerPropiedad: vi.fn(),
    actualizarPropiedad: vi.fn(),
    eliminarPropiedad: vi.fn(),
    verificarExistencia: vi.fn(),
    obtenerFotos: vi.fn(),
  })),
  mockUseSolicitudes: vi.fn(() => ({
    solicitudes: [],
    solicitud: null,
    loading: false,
    error: null,
    solicitudesActivas: 0,
    crearSolicitud: vi.fn(),
    listarSolicitudes: vi.fn(),
    obtenerSolicitud: vi.fn(),
    obtenerSolicitudesUsuario: vi.fn(),
    obtenerSolicitudesPropiedad: vi.fn(),
    actualizarEstado: vi.fn(),
    aceptarSolicitud: vi.fn(),
    rechazarSolicitud: vi.fn(),
    eliminarSolicitud: vi.fn(),
    contarSolicitudesActivas: vi.fn(),
    puedeCrearSolicitud: vi.fn(),
  })),
}));

vi.mock('../../hooks/usePropiedades', () => ({
  usePropiedades: mockUsePropiedades,
}));

vi.mock('../../hooks/useSolicitudes', () => ({
  useSolicitudes: mockUseSolicitudes,
}));

import Arrienda from '../../paginas/arrienda';

describe('Integración: Búsqueda → Resultados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListarPropiedades.mockClear();
    mockBuscarPropiedades.mockClear();
    localStorage.clear();
  });

  it('debe cargar propiedades al montar sin filtros', async () => {
    const mockPropiedades = [
      { id: 1, titulo: 'Casa 1', direccion: 'Calle 1', precioMensual: 500000, comuna: { nombre: 'Santiago' }, fotos: [] },
    ];
    mockListarPropiedades.mockResolvedValueOnce(mockPropiedades);

    localStorage.setItem('isLoggedIn', 'true');

    render(
      <MemoryRouter initialEntries={['/arrienda']}>
        <Arrienda />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockListarPropiedades).toHaveBeenCalledWith(true);
    });
  });

  it('debe realizar búsqueda con query params', async () => {
    const mockPropiedades = [
      { id: 1, titulo: 'Casa en Santiago', direccion: 'Calle 1', comuna: { nombre: 'Santiago' }, precioMensual: 500000, fotos: [] },
    ];
    mockBuscarPropiedades.mockResolvedValueOnce(mockPropiedades);

    localStorage.setItem('isLoggedIn', 'true');

    render(
      <MemoryRouter initialEntries={['/arrienda?q=Santiago']}>
        <Arrienda />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockBuscarPropiedades).toHaveBeenCalled();
    });
  });

  it('debe mostrar mensaje cuando no hay resultados', async () => {
    mockListarPropiedades.mockResolvedValueOnce([]);

    localStorage.setItem('isLoggedIn', 'true');

    render(
      <MemoryRouter initialEntries={['/arrienda']}>
        <Arrienda />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No hay propiedades disponibles/i)).toBeInTheDocument();
    });
  });
});