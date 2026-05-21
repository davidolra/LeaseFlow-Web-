/**
 * Document Service API Client
 * Puerto: 8083
 * Gestión de documentos de usuarios
 */

import { API_CONFIG } from '../config/apiConfig';
import type {
  DocumentoDTO,
  CrearDocumentoRequest,
  EstadoDocumentoDTO,
  TipoDocumentoDTO,
  ErrorResponse,
} from '../types';

const BASE_URL = API_CONFIG.DOCUMENT_SERVICE;

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
 * Servicio de Documentos
 */
export const documentoService = {
  /**
   * Subir/crear nuevo documento
   */
  async crear(documento: CrearDocumentoRequest): Promise<DocumentoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/documentos`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(documento),
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear documento:', error);
      throw error;
    }
  },

  /**
   * Listar todos los documentos
   */
  async listar(includeDetails: boolean = false): Promise<DocumentoDTO[]> {
    try {
      const url = `${BASE_URL}/documentos?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar documentos:', error);
      throw error;
    }
  },

  /**
   * Obtener documento por ID
   */
  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<DocumentoDTO> {
    try {
      const url = `${BASE_URL}/documentos/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener documento ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener documentos de un usuario específico
   */
  async obtenerPorUsuario(usuarioId: number, includeDetails: boolean = true): Promise<DocumentoDTO[]> {
    try {
      const url = `${BASE_URL}/documentos/usuario/${usuarioId}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener documentos del usuario ${usuarioId}:`, error);
      throw error;
    }
  },

  /**
   * Verificar si un usuario tiene documentos aprobados
   * CRÍTICO: Este endpoint es usado por Application Service para validar solicitudes
   */
  async verificarDocumentosAprobados(usuarioId: number): Promise<boolean> {
    try {
      const url = `${BASE_URL}/documentos/usuario/${usuarioId}/verificar-aprobados`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        return false;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al verificar documentos aprobados del usuario ${usuarioId}:`, error);
      return false;
    }
  },

  /**
   * Actualizar estado de un documento
   * Ejemplo: Cambiar de PENDIENTE a ACEPTADO
   */
  async actualizarEstado(documentoId: number, nuevoEstadoId: number): Promise<DocumentoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/documentos/${documentoId}/estado/${nuevoEstadoId}`, {
        method: 'PATCH',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al actualizar estado del documento ${documentoId}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar documento
   */
  async eliminar(id: number): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/documentos/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }
    } catch (error) {
      console.error(`Error al eliminar documento ${id}:`, error);
      throw error;
    }
  },
};

/**
 * Servicio de Estados de Documento
 */
export const estadoDocumentoService = {
  /**
   * Listar todos los estados de documento
   */
  async listar(): Promise<EstadoDocumentoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/estados`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar estados de documento:', error);
      throw error;
    }
  },

  /**
   * Obtener estado por ID
   */
  async obtenerPorId(id: number): Promise<EstadoDocumentoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/estados/${id}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener estado ${id}:`, error);
      throw error;
    }
  },
};

/**
 * Servicio de Tipos de Documento
 */
export const tipoDocumentoService = {
  /**
   * Listar todos los tipos de documento
   */
  async listar(): Promise<TipoDocumentoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/tipos-documentos`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar tipos de documento:', error);
      throw error;
    }
  },

  /**
   * Obtener tipo de documento por ID
   */
  async obtenerPorId(id: number): Promise<TipoDocumentoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/tipos-documentos/${id}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        await handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener tipo de documento ${id}:`, error);
      throw error;
    }
  },
};

export default documentoService;
