import { API_CONFIG, getAuthHeaders } from '../config/apiConfig';
import { ErrorHandlerService } from '../core/errors';
import type {
  DocumentoDTO,
  CrearDocumentoRequest,
  EstadoDocumentoDTO,
  TipoDocumentoDTO,
  ErrorResponse,
} from '../types';

const BASE_URL = API_CONFIG.DOCUMENT_SERVICE;

async function parseErrorResponse(response: Response): Promise<{ message: string }> {
  try {
    const errorData: ErrorResponse = await response.json();
    return { message: errorData.message || `Error ${response.status}` };
  } catch (_error: unknown) {
    return { message: `Error ${response.status}: ${response.statusText}` };
  }
}

export const documentoService = {
  async crear(documento: CrearDocumentoRequest): Promise<DocumentoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/documentos`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(documento),
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

  async listar(includeDetails: boolean = false): Promise<DocumentoDTO[]> {
    try {
      const url = `${BASE_URL}/documentos?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
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

  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<DocumentoDTO> {
    try {
      const url = `${BASE_URL}/documentos/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
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

  async obtenerPorUsuario(
    usuarioId: number,
    includeDetails: boolean = true
  ): Promise<DocumentoDTO[]> {
    try {
      const url = `${BASE_URL}/documentos/usuario/${usuarioId}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      // FIX: El backend retorna 404 cuando el usuario no tiene documentos.
      // Tratamos 404 como lista vacía en vez de lanzar excepción,
      // para que perfil.tsx pueda cargar normalmente sin documentos subidos.
      if (response.status === 404) {
        return [];
      }

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

  async verificarDocumentosAprobados(usuarioId: number): Promise<boolean> {
    try {
      const url = `${BASE_URL}/documentos/usuario/${usuarioId}/verificar-aprobados`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return false;
      }

      return await response.json();
    } catch (error: unknown) {
      console.warn(
        `Advertencia verificando documentos aprobados del usuario ${usuarioId}:`,
        error
      );
      return false;
    }
  },

  async actualizarEstado(documentoId: number, nuevoEstadoId: number): Promise<DocumentoDTO> {
    try {
      const response = await fetch(
        `${BASE_URL}/documentos/${documentoId}/estado/${nuevoEstadoId}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(true),
        }
      );

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `actualizarEstado(${documentoId})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `actualizarEstado(${documentoId})`);
    }
  },

  async eliminar(id: number): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/documentos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `eliminar(${id})`
        );
      }
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `eliminar(${id})`);
    }
  },
};

export const estadoDocumentoService = {
  async listar(): Promise<EstadoDocumentoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/estados`, {
        method: 'GET',
        headers: getAuthHeaders(),
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

  async obtenerPorId(id: number): Promise<EstadoDocumentoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/estados/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
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
};

export const tipoDocumentoService = {
  async listar(): Promise<TipoDocumentoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/tipos-documentos`, {
        method: 'GET',
        headers: getAuthHeaders(),
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

  async obtenerPorId(id: number): Promise<TipoDocumentoDTO> {
    try {
      const response = await fetch(`${BASE_URL}/tipos-documentos/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
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
};

export default documentoService;