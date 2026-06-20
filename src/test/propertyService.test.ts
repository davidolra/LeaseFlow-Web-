import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propiedadService, tipoService, comunaService, regionService, categoriaService } from '../api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('propertyService - Property Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('propiedadService', () => {
    it('debe listar propiedades', async () => {
      const mockProps = [
        { id: 1, titulo: 'Casa 1', precio: 500000 },
        { id: 2, titulo: 'Casa 2', precio: 600000 },
      ];
      // Simular respuesta paginada (Page<PropertyDTO>) y también soportar array directo
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ content: mockProps }),
      });

      const result = await propiedadService.listar(true);

      expect(result).toHaveLength(2);
    });

    it('debe obtener propiedad por ID', async () => {
      const mockProp = { id: 1, titulo: 'Casa Test', precio: 500000 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockProp,
      });

      const result = await propiedadService.obtenerPorId(1);

      expect(result).toEqual(mockProp);
    });

    it('debe crear propiedad', async () => {
      const mockCreada = { id: 1, titulo: 'Nueva Casa', precio: 500000 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockCreada,
      });

      const result = await propiedadService.crear({
        titulo: 'Nueva Casa',
        precio: 500000,
        direccion: 'Calle 1',
        comunaId: 1,
        tipoId: 1,
      });

      expect(result).toEqual(mockCreada);
    });

    it('debe actualizar propiedad', async () => {
      const mockActualizada = { id: 1, titulo: 'Casa Actualizada', precio: 550000 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockActualizada,
      });

      const result = await propiedadService.actualizar(1, { precio: 550000 });

      expect(result.precio).toBe(550000);
    });

    it('debe eliminar propiedad', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      await propiedadService.eliminar(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/propiedades/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('debe buscar propiedades con filtros', async () => {
      const mockResultados = [
        { id: 1, titulo: 'Casa Santiago', comuna: { nombre: 'Santiago' } },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResultados,
      });

      const result = await propiedadService.buscar({
        comuna: 'Santiago',
        tipoId: 1,
      });

      expect(result).toHaveLength(1);
    });

    it('debe verificar existencia de propiedad', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ existe: true }),
      });

      const result = await propiedadService.existe(1);

      expect(result).toEqual({ existe: true });
    });

    it('debe manejar error 404 al obtener propiedad', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ mensaje: 'Propiedad no encontrada' }),
      });

      await expect(propiedadService.obtenerPorId(999)).rejects.toThrow();
    });

    it('debe manejar error 500 en listado', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ mensaje: 'Error interno' }),
      });

      await expect(propiedadService.listar()).rejects.toThrow();
    });
  });

  describe('tipoService', () => {
    it('debe listar tipos de propiedad', async () => {
      const mockTipos = [
        { id: 1, nombre: 'Casa' },
        { id: 2, nombre: 'Departamento' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTipos,
      });

      const result = await tipoService.listar();

      expect(result).toHaveLength(2);
    });
  });

  describe('comunaService', () => {
    it('debe listar comunas', async () => {
      const mockComunas = [
        { id: 1, nombre: 'Santiago' },
        { id: 2, nombre: 'Providencia' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockComunas,
      });

      const result = await comunaService.listar();

      expect(result).toHaveLength(2);
    });
  });

  describe('regionService', () => {
    it('debe listar regiones', async () => {
      const mockRegiones = [
        { id: 1, nombre: 'Metropolitana' },
        { id: 2, nombre: 'Valparaíso' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRegiones,
      });

      const result = await regionService.listar();

      expect(result).toHaveLength(2);
    });
  });

  describe('categoriaService', () => {
    it('debe listar categorías', async () => {
      const mockCategorias = [
        { id: 1, nombre: 'Residencial' },
        { id: 2, nombre: 'Comercial' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockCategorias,
      });

      const result = await categoriaService.listar();

      expect(result).toHaveLength(2);
    });
  });
});