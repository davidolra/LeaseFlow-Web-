/**
 * Application Service API Client - REFACTORED
 * Puerto: 8084
 * Gestión de solicitudes y registros de arriendo
 */

import { API_CONFIG } from '../config/apiConfig';
import { ErrorHandlerService } from '../core/errors';
import type {
  SolicitudArriendoDTO,
  CrearSolicitudRequest,
  RegistroArriendoDTO,
  CrearRegistroRequest,
  ErrorResponse,
} from '../types';

const BASE_URL = API_CONFIG.APPLICATION_SERVICE;

async function parseErrorResponse(response: Response): Promise<{ message: string }> {
  try {
    const errorData: ErrorResponse = await response.json();
    return { message: errorData.message || `Error ${response.status}` };
  } catch {
    return { message: `Error ${response.status}: ${response.statusText}` };
  }
}

export const solicitudService = {
  async crear(solicitud: CrearSolicitudRequest): Promise<SolicitudArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/solicitudes`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(solicitud),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          'crear'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'crear');
    }
  },

  async listar(includeDetails: boolean = true): Promise<SolicitudArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/solicitudes?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          'listar'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listar');
    }
  },

  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<SolicitudArriendoDTO> {
    try {
      const url = `${BASE_URL}/solicitudes/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `obtenerPorId(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },

  async obtenerPorUsuario(usuarioId: number, _includeDetails: boolean = true): Promise<SolicitudArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/solicitudes/usuario/${usuarioId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `obtenerPorUsuario(${usuarioId})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorUsuario(${usuarioId})`);
    }
  },

  async obtenerPorPropiedad(propiedadId: number, _includeDetails: boolean = true): Promise<SolicitudArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/solicitudes/propiedad/${propiedadId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `obtenerPorPropiedad(${propiedadId})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorPropiedad(${propiedadId})`);
    }
  },

  async actualizarEstado(
    id: number,
    nuevoEstado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA'
  ): Promise<SolicitudArriendoDTO> {
    try {
      const response = await fetch(
        `${BASE_URL}/solicitudes/${id}/estado?estado=${encodeURIComponent(nuevoEstado)}`,
        {
          method: 'PATCH',
          headers: API_CONFIG.HEADERS,
        }
      );

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `actualizarEstado(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `actualizarEstado(${id})`);
    }
  },
};

export const registroService = {
  async crear(registro: CrearRegistroRequest): Promise<RegistroArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/registros`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(registro),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          'crear'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'crear');
    }
  },

  async listar(includeDetails: boolean = true): Promise<RegistroArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/registros?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          'listar'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listar');
    }
  },

  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<RegistroArriendoDTO> {
    try {
      const url = `${BASE_URL}/registros/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `obtenerPorId(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },

  async obtenerPorSolicitud(solicitudId: number, _includeDetails: boolean = true): Promise<RegistroArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/registros/solicitud/${solicitudId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `obtenerPorSolicitud(${solicitudId})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorSolicitud(${solicitudId})`);
    }
  },

  async finalizar(id: number): Promise<RegistroArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/registros/${id}/finalizar`, {
        method: 'PATCH',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `finalizar(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `finalizar(${id})`);
    }
  },
};

export default solicitudService;
