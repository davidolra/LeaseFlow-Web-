import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePropiedades } from '../hooks/usePropiedades';
import { propiedadService } from '../api';

vi.mock('../api', () => ({
  propiedadService: {
    listar: vi.fn(),
    obtenerPorId: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    buscar: vi.fn(),
    existe: vi.fn(),
    obtenerFotos: vi.fn(),
  },
}));

describe('usePropiedades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => usePropiedades());
    expect(result.current.propiedades).toEqual([]);
    expect(result.current.propiedad).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe cargar propiedades exitosamente', async () => {
    const mockProps = [
      { id: 1, titulo: 'Casa 1', direccion: 'Calle 1' },
      { id: 2, titulo: 'Casa 2', direccion: 'Calle 2' },
    ];
    vi.mocked(propiedadService.listar).mockResolvedValue(mockProps as any);

    const { result } = renderHook(() => usePropiedades());

    await act(async () => {
      await result.current.listarPropiedades();
    });

    expect(result.current.propiedades).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });

  it('debe manejar error al listar propiedades', async () => {
    const errorMessage = 'Error de conexión';
    vi.mocked(propiedadService.listar).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePropiedades());

    await act(async () => {
      try {
        await result.current.listarPropiedades();
      } catch (err) {
        // Error esperado
      }
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('debe obtener propiedad por ID', async () => {
    const mockProp = { id: 1, titulo: 'Casa Test', direccion: 'Calle Test' };
    vi.mocked(propiedadService.obtenerPorId).mockResolvedValue(mockProp as any);

    const { result } = renderHook(() => usePropiedades());

    await act(async () => {
      await result.current.obtenerPropiedad(1);
    });

    expect(result.current.propiedad).toEqual(mockProp);
  });

  it('debe buscar propiedades con filtros', async () => {
    const resultados = [
      { id: 1, titulo: 'Casa Santiago', comuna: { nombre: 'Santiago' } },
    ];
    vi.mocked(propiedadService.buscar).mockResolvedValue(resultados as any);

    const { result } = renderHook(() => usePropiedades());

    await act(async () => {
      await result.current.buscarPropiedades({ comunaId: 1 });
    });

    expect(result.current.propiedades).toHaveLength(1);
  });

  it('debe crear propiedad exitosamente', async () => {
    const mockCreada = { id: 1, titulo: 'Nueva Casa' };
    vi.mocked(propiedadService.crear).mockResolvedValue(mockCreada as any);

    const { result } = renderHook(() => usePropiedades());

    await act(async () => {
      await result.current.crearPropiedad({
        titulo: 'Nueva Casa',
        direccion: 'Calle 123',
        precioMensual: 500000,
        divisa: 'CLP',
        m2: 80,
        nHabit: 3,
        nBanos: 2,
        petFriendly: false,
        tipoId: 1,
        comunaId: 1,
        codigo: 'COD-001',
      });
    });

    expect(result.current.propiedad).toEqual(mockCreada);
  });

  it('debe actualizar propiedad', async () => {
    const mockActualizada = { id: 1, titulo: 'Actualizada' };
    vi.mocked(propiedadService.actualizar).mockResolvedValue(mockActualizada as any);

    const { result } = renderHook(() => usePropiedades());

    await act(async () => {
      await result.current.actualizarPropiedad(1, { titulo: 'Actualizada' });
    });

    expect(result.current.propiedad).toEqual(mockActualizada);
  });

  it('debe eliminar propiedad', async () => {
    vi.mocked(propiedadService.eliminar).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePropiedades());

    await act(async () => {
      await result.current.eliminarPropiedad(1);
    });

    expect(propiedadService.eliminar).toHaveBeenCalledWith(1);
  });

  it('debe obtener fotos', async () => {
    const mockFotos = [{ id: 1, url: 'http://foto.jpg', propiedadId: 1 }];
    vi.mocked(propiedadService.obtenerFotos).mockResolvedValue(mockFotos);

    const { result } = renderHook(() => usePropiedades());

    let fotos: any;
    await act(async () => {
      fotos = await result.current.obtenerFotos(1);
    });

    expect(fotos).toHaveLength(1);
  });
});