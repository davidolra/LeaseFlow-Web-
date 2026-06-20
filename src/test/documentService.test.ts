import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentoService, estadoDocumentoService, tipoDocumentoService } from '../api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('documentService - Document Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('documentoService', () => {
    it('debe crear documento exitosamente', async () => {
      const mockDoc = { id: 1, nombre: 'doc.pdf', usuarioId: 1, estadoId: 1, tipoDocId: 1 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockDoc,
      });

      const result = await documentoService.crear({
        nombre: 'doc.pdf',
        usuarioId: 1,
        estadoId: 1,
        tipoDocId: 1,
      });

      expect(result).toEqual(mockDoc);
    });

    it('debe listar documentos', async () => {
      const mockDocs = [
        { id: 1, nombre: 'doc1.pdf' },
        { id: 2, nombre: 'doc2.pdf' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDocs,
      });

      const result = await documentoService.listar();

      expect(result).toHaveLength(2);
    });

    it('debe obtener documento por ID', async () => {
      const mockDoc = { id: 1, nombre: 'doc.pdf' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDoc,
      });

      const result = await documentoService.obtenerPorId(1);

      expect(result).toEqual(mockDoc);
    });

    it('debe obtener documentos por usuario', async () => {
      const mockDocs = [{ id: 1, nombre: 'doc1.pdf', usuarioId: 1 }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDocs,
      });

      const result = await documentoService.obtenerPorUsuario(1);

      expect(result).toHaveLength(1);
    });

    it('debe eliminar documento', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      await documentoService.eliminar(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/documentos/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('debe actualizar estado', async () => {
      const mockActualizado = { id: 1, estadoId: 2 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockActualizado,
      });

      const result = await documentoService.actualizarEstado(1, 2);

      expect(result.estadoId).toBe(2);
    });

    it('debe verificar documentos aprobados', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => true,
      });

      const result = await documentoService.verificarDocumentosAprobados(1);

      expect(result).toBe(true);
    });

    it('debe manejar error 404 al obtener documento', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Documento no encontrado' }),
      });

      await expect(documentoService.obtenerPorId(999)).rejects.toThrow();
    });

    it('debe manejar error 500 en listado', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Error interno' }),
      });

      await expect(documentoService.listar()).rejects.toThrow();
    });
  });

  describe('estadoDocumentoService', () => {
    it('debe listar estados de documento', async () => {
      const mockEstados = [
        { id: 1, nombre: 'PENDIENTE' },
        { id: 2, nombre: 'ACEPTADO' },
        { id: 3, nombre: 'RECHAZADO' },
        { id: 4, nombre: 'EN_REVISION' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockEstados,
      });

      const result = await estadoDocumentoService.listar();

      expect(result).toHaveLength(4);
    });
  });

  describe('tipoDocumentoService', () => {
    it('debe listar tipos de documento', async () => {
      const mockTipos = [
        { id: 1, nombre: 'DNI' },
        { id: 2, nombre: 'PASAPORTE' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTipos,
      });

      const result = await tipoDocumentoService.listar();

      expect(result).toHaveLength(2);
    });

    it('debe obtener tipo de documento por ID', async () => {
      const mockTipo = { id: 1, nombre: 'DNI' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTipo,
      });

      const result = await tipoDocumentoService.obtenerPorId(1);

      expect(result).toEqual(mockTipo);
    });
  });
});