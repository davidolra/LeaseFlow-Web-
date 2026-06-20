import { API_CONFIG } from '../config/apiConfig';
import { ErrorHandlerService } from '../core/errors';
import type {
  PropiedadDTO,
  CrearPropiedadRequest,
  ComunaDTO,
  RegionDTO,
  TipoPropiedadDTO,
  CategoriaDTO,
  FotoDTO,
  PropiedadFilters,
  ErrorResponse,
} from '../types';

const BASE_URL = API_CONFIG.PROPERTY_SERVICE;

type PageResponse<T> = {
  content: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

const unwrapPage = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as PageResponse<unknown>).content)) {
    return (data as PageResponse<T>).content;
  }
  return [];
};

async function parseErrorResponse(response: Response): Promise<{ message: string }> {
  try {
    const errorData: ErrorResponse = await response.json();
    return { message: errorData.message || `Error ${response.status}` };
  } catch {
    return { message: `Error ${response.status}: ${response.statusText}` };
  }
}

/**
 * Servicio de Propiedades
 */
export const propiedadService = {
  /**
   * Crear nueva propiedad
   */
  async crear(propiedad: CrearPropiedadRequest): Promise<PropiedadDTO> {
    try {
      const response = await fetch(`${BASE_URL}/propiedades`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(propiedad),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      throw error;
    }
  },

  /**
   * Listar todas las propiedades
   */
  async listar(includeDetails: boolean = true, page: number = 0, size: number = 10000): Promise<PropiedadDTO[]> {
    try {
      const url = `${BASE_URL}/propiedades?includeDetails=${includeDetails}&page=${encodeURIComponent(String(page))}&size=${encodeURIComponent(String(size))}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      const data = await response.json();
      return unwrapPage<PropiedadDTO>(data);
    } catch (error) {
      console.error('Error al listar propiedades:', error);
      throw error;
    }
  },

  /**
   * Listar propiedades por ID de propietario (NUEVA FUNCIÓN)
   */
  async listarPorPropietario(propietarioId: number, includeDetails: boolean = true): Promise<PropiedadDTO[]> {
    try {
        // Asumiendo que el endpoint de tu backend es: /propiedades/usuario/{id}
        const url = `${BASE_URL}/propiedades/usuario/${propietarioId}?includeDetails=${includeDetails}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: API_CONFIG.HEADERS_GET,
        });

        if (!response.ok) {
          const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
        }

        const data = await response.json();
        return unwrapPage<PropiedadDTO>(data);
    } catch (error) {
        console.error(`Error al listar propiedades del propietario ${propietarioId}:`, error);
        throw error;
    }
  },


  

  /**
   * Obtener propiedad por ID
   */
  async obtenerPorId(id: number, includeDetails: boolean = true): Promise<PropiedadDTO> {
    try {
      const url = `${BASE_URL}/propiedades/${id}?includeDetails=${includeDetails}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener propiedad ${id}:`, error);
      throw error;
    }
  },

  /**
   * Verificar si una propiedad existe
   */
  async existe(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/propiedades/${id}/existe`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        return false;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al verificar existencia de propiedad ${id}:`, error);
      return false;
    }
  },

  /**
   * Buscar propiedades con filtros
   */
  async buscar(filtros: PropiedadFilters): Promise<PropiedadDTO[]> {
    try {
      const params = new URLSearchParams();
      
      if (filtros.tipoId) params.append('tipoId', filtros.tipoId.toString());
      if (filtros.comunaId) params.append('comunaId', filtros.comunaId.toString());
      const minPrecio = filtros.minPrecio ?? filtros.precioMin;
      const maxPrecio = filtros.maxPrecio ?? filtros.precioMax;
      const nHabit = filtros.nHabit ?? filtros.nHabitMin;

      if (minPrecio !== undefined) params.append('minPrecio', minPrecio.toString());
      if (maxPrecio !== undefined) params.append('maxPrecio', maxPrecio.toString());
      if (nHabit !== undefined) params.append('nHabit', nHabit.toString());
      if (filtros.nBanos !== undefined) params.append('nBanos', filtros.nBanos.toString());
      if (filtros.petFriendly !== undefined) params.append('petFriendly', filtros.petFriendly.toString());
      if (filtros.includeDetails !== undefined) params.append('includeDetails', filtros.includeDetails.toString());

      const url = `${BASE_URL}/propiedades/buscar?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      const data = await response.json();
      return unwrapPage<PropiedadDTO>(data);
    } catch (error) {
      console.error('Error al buscar propiedades:', error);
      throw error;
    }
  },

  /**
   * Actualizar propiedad
   */
  async actualizar(id: number, propiedad: Partial<PropiedadDTO>): Promise<PropiedadDTO> {
    try {
      const response = await fetch(`${BASE_URL}/propiedades/${id}`, {
        method: 'PUT',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(propiedad),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al actualizar propiedad ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar propiedad
   */
  async eliminar(id: number): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/propiedades/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }
    } catch (error) {
      console.error(`Error al eliminar propiedad ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener fotos de una propiedad
   */
  async obtenerFotos(propiedadId: number): Promise<FotoDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/propiedades/${propiedadId}/fotos`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener fotos de propiedad ${propiedadId}:`, error);
      throw error;
    }
  },
};

/**
 * Servicio de Comunas
 */
export const comunaService = {
  /**
   * Listar todas las comunas
   */
  async listar(): Promise<ComunaDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/comunas`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar comunas:', error);
      throw error;
    }
  },

  /**
   * Obtener comuna por ID
   */
  async obtenerPorId(id: number): Promise<ComunaDTO> {
    try {
      const response = await fetch(`${BASE_URL}/comunas/${id}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener comuna ${id}:`, error);
      throw error;
    }
  },
};

/**
 * Servicio de Regiones
 */
export const regionService = {
  /**
   * Listar todas las regiones
   */
  async listar(): Promise<RegionDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/regiones`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar regiones:', error);
      throw error;
    }
  },
};

/**
 * Servicio de Tipos de Propiedad
 */
export const tipoService = {
  /**
   * Listar todos los tipos
   */
  async listar(): Promise<TipoPropiedadDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/tipos`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar tipos:', error);
      throw error;
    }
  },
};

/**
 * Servicio de Categorías
 */
export const categoriaService = {
  /**
   * Listar todas las categorías
   */
  async listar(): Promise<CategoriaDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/categorias`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response); throw ErrorHandlerService.handle({ status: response.status, message: errorData.message }, String(response.status));
      }

      return await response.json();
    } catch (error) {
      console.error('Error al listar categorías:', error);
      throw error;
    }
  },
};

export default propiedadService;
