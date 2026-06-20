import { describe, it, expect, vi, beforeEach } from 'vitest';
import { solicitudService, registroService } from '../api/applicationService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('applicationService - Application Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('solicitudService', () => {
    it('debe crear solicitud exitosamente', async () => {
      const mockSolicitud = { id: 1, estado: 'PENDIENTE', propiedadId: 1, usuarioId: 1 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockSolicitud,
      });

      const result = await solicitudService.crear({
        propiedadId: 1,
        usuarioId: 1,
      });

      expect(result).toEqual(mockSolicitud);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/solicitudes'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('debe listar solicitudes', async () => {
      const mockSolicitudes = [
        { id: 1, estado: 'PENDIENTE' },
        { id: 2, estado: 'ACEPTADA' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSolicitudes,
      });

      const result = await solicitudService.listar();

      expect(result).toHaveLength(2);
    });

    it('debe obtener solicitud por ID', async () => {
      const mockSolicitud = { id: 1, estado: 'PENDIENTE' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSolicitud,
      });

      const result = await solicitudService.obtenerPorId(1);

      expect(result).toEqual(mockSolicitud);
    });

    it('debe obtener solicitudes por usuario', async () => {
      const mockSolicitudes = [{ id: 1, usuarioId: 1 }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSolicitudes,
      });

      const result = await solicitudService.obtenerPorUsuario(1);

      expect(result).toHaveLength(1);
    });

    it('debe obtener solicitudes por propiedad', async () => {
      const mockSolicitudes = [{ id: 1, propiedadId: 5 }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSolicitudes,
      });

      const result = await solicitudService.obtenerPorPropiedad(5);

      expect(result).toHaveLength(1);
    });

    it('debe actualizar estado de solicitud', async () => {
      const mockActualizada = { id: 1, estado: 'ACEPTADA' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockActualizada,
      });

      const result = await solicitudService.actualizarEstado(1, 'ACEPTADA');

      expect(result.estado).toBe('ACEPTADA');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/solicitudes/1/estado?estado=ACEPTADA'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('debe manejar error 404 al obtener solicitud', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Solicitud no encontrada' }),
      });

      await expect(solicitudService.obtenerPorId(999)).rejects.toThrow();
    });

    it('debe manejar error 409 al crear solicitud duplicada', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Ya existe una solicitud activa' }),
      });

      await expect(
        solicitudService.crear({ propiedadId: 1, usuarioId: 1 })
      ).rejects.toThrow();
    });
  });

  describe('registroService', () => {
    it('debe crear registro exitosamente', async () => {
      const mockRegistro = { id: 1, solicitudId: 1, fechaInicio: '2025-01-01', montoMensual: 500000 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockRegistro,
      });

      const result = await registroService.crear({
        solicitudId: 1,
        fechaInicio: '2025-01-01',
        montoMensual: 500000,
      });

      expect(result).toEqual(mockRegistro);
    });

    it('debe listar registros', async () => {
      const mockRegistros = [
        { id: 1, solicitudId: 1 },
        { id: 2, solicitudId: 2 },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRegistros,
      });

      const result = await registroService.listar();

      expect(result).toHaveLength(2);
    });

    it('debe finalizar registro', async () => {
      const mockFinalizado = { id: 1, fechaFin: '2025-12-31', activo: false };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockFinalizado,
      });

      const result = await registroService.finalizar(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/finalizar'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('debe obtener por ID', async () => {
      const mockRegistro = { id: 1, solicitudId: 1 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRegistro,
      });

      const result = await registroService.obtenerPorId(1);

      expect(result).toEqual(mockRegistro);
    });

    it('debe obtener por solicitud', async () => {
      const mockRegistros = [{ id: 1, solicitudId: 1 }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRegistros,
      });

      const result = await registroService.obtenerPorSolicitud(1);

      expect(result).toHaveLength(1);
    });
  });
});