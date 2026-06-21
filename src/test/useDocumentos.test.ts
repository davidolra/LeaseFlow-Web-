import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentos } from '../hooks/useDocumentos';
import { documentoService } from '../api/documentService';

vi.mock('../api/documentService', () => ({
  documentoService: {
    crear: vi.fn(),
    listar: vi.fn(),
    obtenerPorId: vi.fn(),
    obtenerPorUsuario: vi.fn(),
    verificarDocumentosAprobados: vi.fn(),
    actualizarEstado: vi.fn(),
    eliminar: vi.fn(),
  },
}));

describe('useDocumentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe inicializar con estado vacío', () => {
    const { result } = renderHook(() => useDocumentos());
    expect(result.current.documentos).toEqual([]);
    expect(result.current.documento).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe subir documento exitosamente', async () => {
    const mockDoc = { id: 1, nombre: 'doc.pdf', fechaSubido: '2025-01-01', usuarioId: 1, estadoId: 1, tipoDocId: 1 };
    vi.mocked(documentoService.crear).mockResolvedValue(mockDoc);

    const { result } = renderHook(() => useDocumentos());

    let uploaded: any;
    await act(async () => {
      uploaded = await result.current.subirDocumento({
        nombre: 'doc.pdf',
        usuarioId: 1,
        estadoId: 1,
        tipoDocId: 1,
      });
    });

    expect(uploaded).toEqual(mockDoc);
  });

  it('debe manejar error al subir documento', async () => {
    vi.mocked(documentoService.crear).mockRejectedValue(new Error('Error de upload'));

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      try {
        await result.current.subirDocumento({
          nombre: 'test.pdf',
          usuarioId: 1,
          estadoId: 1,
          tipoDocId: 1,
        });
      } catch (err) {
        // Error esperado
      }
    });

    expect(result.current.error).toBe('Error de upload');
  });

  it('debe listar documentos', async () => {
    const mockDocs = [
      { id: 1, nombre: 'doc1.pdf', fechaSubido: '2025-01-01', usuarioId: 1, estadoId: 1, tipoDocId: 1 },
      { id: 2, nombre: 'doc2.pdf', fechaSubido: '2025-01-02', usuarioId: 2, estadoId: 2, tipoDocId: 1 },
    ];
    vi.mocked(documentoService.listar).mockResolvedValue(mockDocs);

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      await result.current.listarDocumentos();
    });

    expect(result.current.documentos).toHaveLength(2);
  });

  it('debe obtener documentos por usuario', async () => {
    const mockDocs = [{ id: 1, nombre: 'doc1.pdf', fechaSubido: '2025-01-01', usuarioId: 1, estadoId: 1, tipoDocId: 1 }];
    vi.mocked(documentoService.obtenerPorUsuario).mockResolvedValue(mockDocs);

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      await result.current.obtenerDocumentosUsuario(1);
    });

    expect(result.current.documentos).toHaveLength(1);
  });

  it('debe eliminar documento', async () => {
    vi.mocked(documentoService.eliminar).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      await result.current.eliminarDocumento(1);
    });

    expect(documentoService.eliminar).toHaveBeenCalledWith(1);
  });

  it('debe actualizar estado', async () => {
    const mockActualizado = { id: 1, nombre: 'doc.pdf', fechaSubido: '2025-01-01', usuarioId: 1, estadoId: 2, tipoDocId: 1 };
    vi.mocked(documentoService.actualizarEstado).mockResolvedValue(mockActualizado);

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      await result.current.actualizarEstado(1, 2);
    });

    expect(documentoService.actualizarEstado).toHaveBeenCalledWith(1, 2);
  });

  it('debe aprobar documento', async () => {
    const mockActualizado = { id: 1, nombre: 'doc.pdf', fechaSubido: '2025-01-01', usuarioId: 1, estadoId: 2, tipoDocId: 1 };
    vi.mocked(documentoService.actualizarEstado).mockResolvedValue(mockActualizado);

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      await result.current.aprobarDocumento(1);
    });

    expect(documentoService.actualizarEstado).toHaveBeenCalledWith(1, 2);
  });

  it('debe rechazar documento', async () => {
    const mockActualizado = { id: 1, nombre: 'doc.pdf', fechaSubido: '2025-01-01', usuarioId: 1, estadoId: 3, tipoDocId: 1 };
    vi.mocked(documentoService.actualizarEstado).mockResolvedValue(mockActualizado);

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      await result.current.rechazarDocumento(1);
    });

    expect(documentoService.actualizarEstado).toHaveBeenCalledWith(1, 3);
  });

  it('debe obtener documento por ID', async () => {
    const mockDoc = { id: 1, nombre: 'doc.pdf', fechaSubido: '2025-01-01', usuarioId: 1, estadoId: 1, tipoDocId: 1 };
    vi.mocked(documentoService.obtenerPorId).mockResolvedValue(mockDoc);

    const { result } = renderHook(() => useDocumentos());

    await act(async () => {
      await result.current.obtenerDocumento(1);
    });

    expect(result.current.documento).toEqual(mockDoc);
  });

  it('debe verificar documentos aprobados', async () => {
    vi.mocked(documentoService.verificarDocumentosAprobados).mockResolvedValue(true);

    const { result } = renderHook(() => useDocumentos());

    let tiene: boolean | undefined;
    await act(async () => {
      tiene = await result.current.verificarDocumentosAprobados(1);
    });

    expect(tiene).toBe(true);
  });
});
