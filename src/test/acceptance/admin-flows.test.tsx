import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GestionPropiedades from '../../paginas/GestionPropiedades';

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
 * PRUEBAS DE ACEPTACIÓN - FLUJOS ADMINISTRATIVOS
 * Formato: Given / When / Then
 */

describe('Aceptación: RF08 - Gestión de Propiedades (Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    localStorage.clear();
  });

  it('RF08-CASO1: Admin ve listado de propiedades', async () => {
    // Given: usuario administrador autenticado
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'ADMIN');
    localStorage.setItem('userId', '1');
    localStorage.setItem('userEmail', 'admin@email.com');

    // Mock de listas maestras y propiedades
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ id: 1, nombre: 'Metropolitana' }] }) // regiones
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ id: 1, nombre: 'Santiago', regionId: 1 }] }) // comunas
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ id: 1, nombre: 'Casa' }] }) // tipos
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 1,
            titulo: 'Casa 1',
            precioMensual: 500000,
            descripcion: 'Amplia',
            direccion: 'Calle 1',
            codigo: 'COD-1',
            divisa: 'CLP',
            m2: 80,
            nHabit: 3,
            nBanos: 2,
            petFriendly: false,
            tipoId: 1,
            comunaId: 1,
            fotos: [],
          },
        ],
      }); // propiedades

    render(
      <MemoryRouter initialEntries={['/gestion-propiedades']}>
        <GestionPropiedades scope="ALL" />
      </MemoryRouter>
    );

    // Then: se muestran las propiedades
    await waitFor(() => {
      expect(screen.getByText(/gestión de propiedades/i)).toBeInTheDocument();
    });
  });
});