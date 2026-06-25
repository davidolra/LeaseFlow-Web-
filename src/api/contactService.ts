import API_CONFIG, { getAuthHeaders } from '../config/apiConfig';
import { ErrorHandlerService } from '../core/errors';
import type {
  MensajeContactoDTO,
  RespuestaMensajeDTO,
  EstadisticasContacto,
} from '../types';

const BASE_URL = API_CONFIG.CONTACT_SERVICE;

async function parseErrorResponse(response: Response): Promise<{ message: string }> {
  try {
    return await response.json();
  } catch (_error: unknown) {
    return { message: `Error ${response.status}: ${response.statusText}` };
  }
}

export const contactService = {
  async crearMensaje(mensaje: Partial<MensajeContactoDTO>): Promise<MensajeContactoDTO> {
    try {
      console.log('📧 Enviando mensaje de contacto:', mensaje.email);

      const response = await fetch(`${BASE_URL}/contacto`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(mensaje),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          'crearMensaje'
        );
      }

      const data = await response.json();
      console.log('✅ Mensaje enviado exitosamente');
      return data;
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'crearMensaje');
    }
  },

  async listarTodos(includeDetails: boolean = false): Promise<MensajeContactoDTO[]> {
    try {
      const url = `${BASE_URL}/contacto?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los mensajes' },
          'listarTodos'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listarTodos');
    }
  },

  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<MensajeContactoDTO> {
    try {
      const url = `${BASE_URL}/contacto/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'Mensaje no encontrado' },
          `obtenerPorId(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },

  async listarPorEmail(email: string): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los mensajes' },
          `listarPorEmail(${email})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `listarPorEmail(${email})`);
    }
  },

  async listarPorUsuario(usuarioId: number): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/usuario/${usuarioId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los mensajes' },
          `listarPorUsuario(${usuarioId})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `listarPorUsuario(${usuarioId})`);
    }
  },

  async listarPorEstado(
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO'
  ): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/estado/${estado}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los mensajes' },
          `listarPorEstado(${estado})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `listarPorEstado(${estado})`);
    }
  },

  async listarSinResponder(): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/sin-responder`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los mensajes' },
          'listarSinResponder'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listarSinResponder');
    }
  },

  async buscarPorPalabraClave(keyword: string): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/buscar?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los mensajes' },
          `buscarPorPalabraClave(${keyword})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `buscarPorPalabraClave(${keyword})`);
    }
  },

  async actualizarEstado(
    id: number,
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO'
  ): Promise<MensajeContactoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/${id}/estado?estado=${estado}`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudo actualizar el estado' },
          `actualizarEstado(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `actualizarEstado(${id})`);
    }
  },

  async responderMensaje(id: number, respuesta: RespuestaMensajeDTO): Promise<MensajeContactoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/${id}/responder`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(respuesta),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `responderMensaje(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `responderMensaje(${id})`);
    }
  },

  async eliminarMensaje(id: number, adminId: number): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/${id}?adminId=${adminId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudo eliminar el mensaje' },
          `eliminarMensaje(${id})`
        );
      }
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `eliminarMensaje(${id})`);
    }
  },

  async obtenerEstadisticas(): Promise<EstadisticasContacto> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/estadisticas`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener las estadísticas' },
          'obtenerEstadisticas'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'obtenerEstadisticas');
    }
  },
};

export default contactService;