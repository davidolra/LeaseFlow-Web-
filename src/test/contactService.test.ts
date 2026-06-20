import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactService } from '../api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('contactService - Contact Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('debe enviar mensaje exitosamente', async () => {
    const mockMensaje = {
      id: 1,
      nombre: 'Juan',
      email: 'juan@email.com',
      numeroTelefono: '+56912345678',
      asunto: 'Consulta',
      mensaje: 'Me interesa la propiedad',
      estado: 'PENDIENTE',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockMensaje,
    });

    const result = await contactService.crearMensaje({
      nombre: 'Juan',
      email: 'juan@email.com',
      numeroTelefono: '+56912345678',
      asunto: 'Consulta',
      mensaje: 'Me interesa la propiedad',
    });

    expect(result).toEqual(mockMensaje);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/contacto'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('debe manejar error 400 por campos faltantes', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'El campo nombre es obligatorio' }),
    });

    await expect(
      contactService.crearMensaje({
        nombre: '',
        email: 'juan@email.com',
        asunto: 'Test',
        mensaje: 'Hola',
      })
    ).rejects.toThrow();
  });

  it('debe listar todos los mensajes', async () => {
    const mockMensajes = [
      { id: 1, nombre: 'Juan', mensaje: 'Hola' },
      { id: 2, nombre: 'María', mensaje: 'Buenos días' },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMensajes,
    });

    const result = await contactService.listarTodos();

    expect(result).toHaveLength(2);
  });

  it('debe listar por email', async () => {
    const mockMensajes = [{ id: 1, nombre: 'Juan', email: 'juan@email.com' }];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMensajes,
    });

    const result = await contactService.listarPorEmail('juan@email.com');

    expect(result).toHaveLength(1);
  });

  it('debe listar por usuario', async () => {
    const mockMensajes = [{ id: 1, nombre: 'Juan', usuarioId: 1 }];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMensajes,
    });

    const result = await contactService.listarPorUsuario(1);

    expect(result).toHaveLength(1);
  });

  it('debe listar por estado', async () => {
    const mockMensajes = [{ id: 1, nombre: 'Juan', estado: 'PENDIENTE' }];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMensajes,
    });

    const result = await contactService.listarPorEstado('PENDIENTE');

    expect(result).toHaveLength(1);
  });

  it('debe listar sin responder', async () => {
    const mockMensajes = [{ id: 1, nombre: 'Juan', estado: 'PENDIENTE' }];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMensajes,
    });

    const result = await contactService.listarSinResponder();

    expect(result).toHaveLength(1);
  });

  it('debe responder mensaje', async () => {
    const mockRespuesta = {
      id: 1,
      respuesta: 'Gracias por contactarnos',
      respondidoPor: 1,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRespuesta,
    });

    const result = await contactService.responderMensaje(1, {
      respuesta: 'Gracias por contactarnos',
      respondidoPor: 1,
    });

    expect(result.respuesta).toContain('Gracias');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/responder'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('debe actualizar estado', async () => {
    const mockActualizado = { id: 1, estado: 'EN_PROCESO' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockActualizado,
    });

    const result = await contactService.actualizarEstado(1, 'EN_PROCESO');

    expect(result.estado).toBe('EN_PROCESO');
  });

  it('debe obtener estadísticas', async () => {
    const mockStats = {
      total: 25,
      pendientes: 5,
      enProceso: 3,
      resueltos: 17,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockStats,
    });

    const result = await contactService.obtenerEstadisticas();

    expect(result.total).toBe(25);
    expect(result.pendientes).toBe(5);
  });

  it('debe buscar por palabra clave', async () => {
    const mockMensajes = [{ id: 1, nombre: 'Juan', mensaje: 'consulta sobre arriendo' }];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockMensajes,
    });

    const result = await contactService.buscarPorPalabraClave('arriendo');

    expect(result).toHaveLength(1);
  });

  it('debe eliminar mensaje', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    await contactService.eliminarMensaje(1, 1);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/contacto/1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('debe manejar error 401 al listar sin autenticación', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'No autorizado' }),
    });

    await expect(contactService.listarTodos()).rejects.toThrow();
  });

  it('debe manejar error 404 al obtener mensaje', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Mensaje no encontrado' }),
    });

    await expect(contactService.obtenerPorId(999)).rejects.toThrow();
  });

  it('debe manejar error 500 del servidor', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Error interno del servidor' }),
    });

    await expect(contactService.crearMensaje({
      nombre: 'Test',
      email: 'test@email.com',
      asunto: 'Test',
      mensaje: 'Test de prueba',
    })).rejects.toThrow();
  });
});