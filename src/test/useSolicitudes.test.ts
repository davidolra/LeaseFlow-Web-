import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSolicitudes } from '../hooks/useSolicitudes';
import { solicitudService } from '../api';

vi.mock('../api', () => ({
  solicitudService: {
    crear: vi.fn(),
    listar: vi.fn(),
    obtenerPorId: vi.fn(),
    obtenerPorUsuario: vi.fn(),
    obtenerPorPropiedad: vi.fn(),
    actualizarEstado: vi.fn(),
  },
}));

describe('useSolicitudes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe inicializar con estado vacío', () => {
    const { result } = renderHook(() => useSolicitudes());
    expect(result.current.solicitudes).toEqual([]);
    expect(result.current.solicitud).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe crear solicitud exitosamente', async () => {
    const mockSolicitud = { id: 1, estado: 'PENDIENTE', propiedadId: 1, usuarioId: 1 };
    vi.mocked(solicitudService.crear).mockResolvedValue(mockSolicitud);

    const { result } = renderHook(() => useSolicitudes());

    await act(async () => {
      await result.current.crearSolicitud({ propiedadId: 1, usuarioId: 1 });
    });

    expect(result.current.solicitud).toEqual(mockSolicitud);
  });

  it('debe manejar error al crear solicitud', async () => {
    vi.mocked(solicitudService.crear).mockRejectedValue(new Error('Límite alcanzado'));

    const { result } = renderHook(() => useSolicitudes());

    await act(async () => {
      try {
        await result.current.crearSolicitud({ propiedadId: 1, usuarioId: 1 });
      } catch (err) {
        // Error esperado
      }
    });

    expect(result.current.error).toBe('Límite alcanzado');
  });

  it('debe listar solicitudes', async () => {
    const mockSolicitudes = [
      { id: 1, estado: 'PENDIENTE' },
      { id: 2, estado: 'ACEPTADA' },
    ];
    vi.mocked(solicitudService.listar).mockResolvedValue(mockSolicitudes);

    const { result } = renderHook(() => useSolicitudes());

    await act(async () => {
      await result.current.listarSolicitudes();
    });

    expect(result.current.solicitudes).toHaveLength(2);
  });

  it('debe aceptar solicitud', async () => {
    const mockActualizada = { id: 1, estado: 'ACEPTADA' };
    vi.mocked(solicitudService.actualizarEstado).mockResolvedValue(mockActualizada);

    const { result } = renderHook(() => useSolicitudes());

    await act(async () => {
      await result.current.aceptarSolicitud(1);
    });

    expect(solicitudService.actualizarEstado).toHaveBeenCalledWith(1, 'ACEPTADA');
  });

  it('debe rechazar solicitud', async () => {
    const mockActualizada = { id: 1, estado: 'RECHAZADA' };
    vi.mocked(solicitudService.actualizarEstado).mockResolvedValue(mockActualizada);

    const { result } = renderHook(() => useSolicitudes());

    await act(async () => {
      await result.current.rechazarSolicitud(1);
    });

    expect(solicitudService.actualizarEstado).toHaveBeenCalledWith(1, 'RECHAZADA');
  });

  it('debe eliminar solicitud', async () => {
    vi.mocked(solicitudService.actualizarEstado).mockResolvedValue({} as any);

    const { result } = renderHook(() => useSolicitudes());

    await act(async () => {
      await result.current.eliminarSolicitud(1);
    });

    expect(solicitudService.actualizarEstado).toHaveBeenCalledWith(1, 'RECHAZADA');
  });

  it('debe obtener solicitudes por usuario', async () => {
    const mockSolicitudes = [{ id: 1, usuarioId: 1 }];
    vi.mocked(solicitudService.obtenerPorUsuario).mockResolvedValue(mockSolicitudes);

    const { result } = renderHook(() => useSolicitudes());

    await act(async () => {
      await result.current.obtenerSolicitudesUsuario(1);
    });

    expect(result.current.solicitudes).toHaveLength(1);
  });

  it('debe verificar si puede crear solicitud', async () => {
    // 2 solicitudes activas (menor a 3)
    vi.mocked(solicitudService.obtenerPorUsuario).mockResolvedValue([
      { id: 1, estado: 'PENDIENTE' },
      { id: 2, estado: 'PENDIENTE' },
    ] as any);

    const { result } = renderHook(() => useSolicitudes());

    let puedeCrear: boolean;
    await act(async () => {
      puedeCrear = await result.current.puedeCrearSolicitud(1);
    });

    expect(puedeCrear!).toBe(true);
  });

  it('debe denegar creación si supera límite', async () => {
    // 3 solicitudes activas
    vi.mocked(solicitudService.obtenerPorUsuario).mockResolvedValue([
      { id: 1, estado: 'PENDIENTE' },
      { id: 2, estado: 'PENDIENTE' },
      { id: 3, estado: 'PENDIENTE' },
    ] as any);

    const { result } = renderHook(() => useSolicitudes());

    let puedeCrear: boolean;
    await act(async () => {
      puedeCrear = await result.current.puedeCrearSolicitud(1);
    });

    expect(puedeCrear!).toBe(false);
  });
});