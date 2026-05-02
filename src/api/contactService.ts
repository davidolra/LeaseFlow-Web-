/**
 * Contact Service API
 * Maneja mensajes de contacto
 * Puerto: 8085
 */

import API_CONFIG from '../config/apiConfig';

const BASE_URL = API_CONFIG.CONTACT_SERVICE;

/**
 * Tipos para Contact Service
 */
export interface MensajeContactoDTO {
  id?: number;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  numeroTelefono?: string;
  usuarioId?: number;
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO';
  fechaCreacion?: string;
  fechaActualizacion?: string;
  respuesta?: string;
  respondidoPor?: number;
  usuario?: any; // UsuarioDTO cuando includeDetails=true
}

export interface RespuestaMensajeDTO {
  respuesta: string;
  respondidoPor: number;
  nuevoEstado?: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO';
}

export interface EstadisticasContacto {
  total: number;
  pendientes: number;
  enProceso: number;
  resueltos: number;
}

/**
 * Manejo de errores
 */
const handleError = (error: any, operation: string): never => {
  console.error(`❌ Error en ${operation}:`, error);
  
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    throw new Error(
      'No se pudo conectar con el servidor de contacto. ' +
      'Verifica que Contact Service esté corriendo en puerto 8085'
    );
  }
  
  throw new Error(error.message || 'Error desconocido en Contact Service');
};

/**
 * Contact Service
 */
export const contactService = {
  /**
   * Crear nuevo mensaje de contacto
   * @param mensaje - Datos del mensaje
   * @returns MensajeContactoDTO creado
   */
  async crearMensaje(mensaje: Partial<MensajeContactoDTO>): Promise<MensajeContactoDTO> {
    try {
      console.log('📧 Enviando mensaje de contacto:', mensaje.email);
      
      const response = await fetch(`${BASE_URL}/contacto`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(mensaje),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al enviar mensaje');
      }

      const data = await response.json();
      console.log('✅ Mensaje enviado exitosamente');
      return data;
    } catch (error: any) {
      return handleError(error, 'crearMensaje');
    }
  },

  /**
   * Listar todos los mensajes (solo admin)
   * @param includeDetails - Incluir información del usuario
   * @returns Lista de mensajes
   */
  async listarTodos(includeDetails: boolean = false): Promise<MensajeContactoDTO[]> {
    try {
      const url = `${BASE_URL}/contacto?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los mensajes`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, 'listarTodosMensajes');
    }
  },

  /**
   * Obtener mensaje por ID
   * @param id - ID del mensaje
   * @param includeDetails - Incluir información del usuario
   * @returns Mensaje encontrado
   */
  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<MensajeContactoDTO> {
    try {
      const url = `${BASE_URL}/contacto/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Mensaje no encontrado`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `obtenerMensajePorId(${id})`);
    }
  },

  /**
   * Listar mensajes por email
   * @param email - Email del remitente
   * @returns Lista de mensajes
   */
  async listarPorEmail(email: string): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los mensajes`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `listarMensajesPorEmail(${email})`);
    }
  },

  /**
   * Listar mensajes por usuario autenticado
   * @param usuarioId - ID del usuario
   * @returns Lista de mensajes
   */
  async listarPorUsuario(usuarioId: number): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/usuario/${usuarioId}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los mensajes`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `listarMensajesPorUsuario(${usuarioId})`);
    }
  },

  /**
   * Listar mensajes por estado
   * @param estado - Estado del mensaje
   * @returns Lista de mensajes
   */
  async listarPorEstado(estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO'): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/estado/${estado}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los mensajes`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `listarMensajesPorEstado(${estado})`);
    }
  },

  /**
   * Listar mensajes sin responder (solo admin)
   * @returns Lista de mensajes pendientes
   */
  async listarSinResponder(): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/sin-responder`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los mensajes`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, 'listarMensajesSinResponder');
    }
  },

  /**
   * Buscar mensajes por palabra clave
   * @param keyword - Palabra clave
   * @returns Lista de mensajes
   */
  async buscarPorPalabraClave(keyword: string): Promise<MensajeContactoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/buscar?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los mensajes`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `buscarMensajes(${keyword})`);
    }
  },

  /**
   * Actualizar estado de un mensaje (solo admin)
   * @param id - ID del mensaje
   * @param estado - Nuevo estado
   * @returns Mensaje actualizado
   */
  async actualizarEstado(id: number, estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO'): Promise<MensajeContactoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/${id}/estado?estado=${estado}`, {
        method: 'PATCH',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo actualizar el estado`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `actualizarEstadoMensaje(${id})`);
    }
  },

  /**
   * Responder un mensaje (solo admin)
   * @param id - ID del mensaje
   * @param respuesta - Datos de la respuesta
   * @returns Mensaje actualizado
   */
  async responderMensaje(id: number, respuesta: RespuestaMensajeDTO): Promise<MensajeContactoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/${id}/responder`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(respuesta),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al responder mensaje');
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `responderMensaje(${id})`);
    }
  },

  /**
   * Eliminar un mensaje (solo admin)
   * @param id - ID del mensaje
   * @param adminId - ID del admin que elimina
   */
  async eliminarMensaje(id: number, adminId: number): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/${id}?adminId=${adminId}`, {
        method: 'DELETE',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo eliminar el mensaje`);
      }
    } catch (error: any) {
      return handleError(error, `eliminarMensaje(${id})`);
    }
  },

  /**
   * Obtener estadísticas de mensajes (solo admin)
   * @returns Estadísticas
   */
  async obtenerEstadisticas(): Promise<EstadisticasContacto> {
    try {
      const response = await fetch(`${BASE_URL}/contacto/estadisticas`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener las estadísticas`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, 'obtenerEstadisticas');
    }
  },
};

export default contactService;