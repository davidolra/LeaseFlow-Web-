/**
 * Application Service API Client
 * Puerto: 8084
 * Gestión de solicitudes y registros de arriendo
 */

import { API_CONFIG } from '../config/apiConfig';
import type {
  SolicitudArriendoDTO,
  CrearSolicitudRequest,
  RegistroArriendoDTO,
  CrearRegistroRequest,
  ErrorResponse,
} from '../types';

const BASE_URL = API_CONFIG.APPLICATION_SERVICE;

/**
 * Manejo de errores centralizado
 */
const handleError = async (response: Response): Promise<never> => {
  let errorMessage = `Error ${response.status}: ${response.statusText}`;
  
  try {
    const errorData: ErrorResponse = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch {
    // Si no se puede parsear el JSON, usar mensaje por defecto
  }
  
  throw new Error(errorMessage);
};

/**
 * Servicio de Solicitudes de Arriendo
 */
export const solicitudService = {
  /**
   * Crear nueva solicitud de arriendo
   * IMPORTANTE: Valida automáticamente:
   * - Usuario existe (User Service)
   * - Usuario tiene rol correcto
   * - Usuario no tiene más de 3 solicitudes activas
   * - Propiedad existe (Property Service)
   * - Usuario tiene documentos aprobados (Document Service)
   */
  async crear(solicitud: CrearSolicitudRequest): Promise<SolicitudArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/solicitudes`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(solicitud),
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      throw error;
    }
  },

  /**
   * Listar todas las solicitudes
   */
  async listar(includeDetails: boolean = true): Promise<SolicitudArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/solicitudes?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar solicitudes:', error);
      throw error;
    }
  },

  /**
   * Obtener solicitud por ID
   */
  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<SolicitudArriendoDTO> {
    try {
      const url = `${BASE_URL}/solicitudes/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener solicitud ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener solicitudes de un usuario
   */
  async obtenerPorUsuario(usuarioId: number, includeDetails: boolean = true): Promise<SolicitudArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/solicitudes/usuario/${usuarioId}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener solicitudes del usuario ${usuarioId}:`, error);
      throw error;
    }
  },

  /**
   * Obtener solicitudes de una propiedad
   */
  async obtenerPorPropiedad(propiedadId: number, includeDetails: boolean = true): Promise<SolicitudArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/solicitudes/propiedad/${propiedadId}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener solicitudes de la propiedad ${propiedadId}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar estado de una solicitud
   * Estados válidos: PENDIENTE, ACEPTADA, RECHAZADA
   */
  async actualizarEstado(
    id: number,
    nuevoEstado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA'
  ): Promise<SolicitudArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/solicitudes/${id}/estado`, {
        method: 'PATCH',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al actualizar estado de solicitud ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar solicitud
   */
  async eliminar(id: number): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/solicitudes/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }
    } catch (error) {
      console.error(`Error al eliminar solicitud ${id}:`, error);
      throw error;
    }
  },

  /**
   * Contar solicitudes activas de un usuario
   */
  async contarActivas(usuarioId: number): Promise<number> {
    try {
      const response = await fetch(`${BASE_URL}/solicitudes/usuario/${usuarioId}/count-activas`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al contar solicitudes activas del usuario ${usuarioId}:`, error);
      throw error;
    }
  },
};

/**
 * Servicio de Registros de Arriendo
 */
export const registroService = {
  /**
   * Crear nuevo registro de arriendo
   */
  async crear(registro: CrearRegistroRequest): Promise<RegistroArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/registros`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(registro),
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear registro:', error);
      throw error;
    }
  },

  /**
   * Listar todos los registros
   */
  async listar(includeDetails: boolean = true): Promise<RegistroArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/registros?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar registros:', error);
      throw error;
    }
  },

  /**
   * Obtener registro por ID
   */
  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<RegistroArriendoDTO> {
    try {
      const url = `${BASE_URL}/registros/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener registro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener registros de una solicitud
   */
  async obtenerPorSolicitud(solicitudId: number, includeDetails: boolean = true): Promise<RegistroArriendoDTO[]> {
    try {
      const url = `${BASE_URL}/registros/solicitud/${solicitudId}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener registros de la solicitud ${solicitudId}:`, error);
      throw error;
    }
  },

  /**
   * Actualizar registro
   */
  async actualizar(id: number, registro: Partial<RegistroArriendoDTO>): Promise<RegistroArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/registros/${id}`, {
        method: 'PUT',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(registro),
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al actualizar registro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Finalizar registro (marcar como inactivo)
   */
  async finalizar(id: number): Promise<RegistroArriendoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/registros/${id}/finalizar`, {
        method: 'PATCH',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al finalizar registro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar registro
   */
  async eliminar(id: number): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/registros/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }
    } catch (error) {
      console.error(`Error al eliminar registro ${id}:`, error);
      throw error;
    }
  },
};

export default solicitudService;
