import API_CONFIG, { getAuthHeaders } from '../config/apiConfig';
import { ErrorHandlerService } from '../core/errors';
import type { UsuarioDTO, LoginRequest, LoginResponse, RolDTO, EstadoUsuarioDTO, CrearUsuarioRequest } from '../types';

const BASE_URL = API_CONFIG.USER_SERVICE;

/**
 * Parse error response from server
 */
async function parseErrorResponse(response: Response): Promise<{ message: string; validationErrors?: Record<string, string> }> {
  try {
    return await response.json();
  } catch (_error: unknown) {
    return { message: `Error ${response.status}: ${response.statusText}` };
  }
}

/**
 * Usuario Service
 */
export const userService = {
  /**
   * Login de usuario — PÚBLICO, no requiere X-Usuario-Id ni X-Rol-Id
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Intentando login con:', credentials.email);

      const response = await fetch(`${BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        if (response.status === 401) {
          throw ErrorHandlerService.handle(
            new Error('Email o contraseña incorrectos'),
            'login'
          );
        }
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          'login'
        );
      }

      const data: LoginResponse = await response.json();
      console.log('✅ Login exitoso');

      return {
        success: true,
        mensaje: data.mensaje || 'Login exitoso',
        usuario: data.usuario
      };
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'login');
    }
  },

  /**
   * Registrar nuevo usuario — PÚBLICO, no requiere headers de auth
   */
  async registrar(usuario: CrearUsuarioRequest): Promise<UsuarioDTO> {
    try {
      console.log('Registrando nuevo usuario:', usuario.email);

      const response = await fetch(`${BASE_URL}/usuarios`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(usuario),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          'registrar'
        );
      }

      const data = await response.json();
      console.log('Usuario registrado exitosamente');
      return data;
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'registrar');
    }
  },

  /**
   * Obtener usuario por ID — PROTEGIDO, requiere X-Usuario-Id y X-Rol-Id
   */
  async obtenerPorId(id: number, includeDetails: boolean = false): Promise<UsuarioDTO> {
    try {
      const url = `${BASE_URL}/usuarios/${id}${includeDetails ? '?includeDetails=true' : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'Usuario no encontrado' },
          `obtenerPorId(${id})`
        );
      }

      const data = await response.json();
      console.log('Usuario obtenido');
      return data;
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },

  async actualizar(id: number, datos: Partial<UsuarioDTO>): Promise<UsuarioDTO> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `actualizar(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `actualizar(${id})`);
    }
  },

  async actualizarRol(id: number, rolId: number): Promise<UsuarioDTO> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}/rol?rolId=${encodeURIComponent(String(rolId))}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `actualizarRol(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `actualizarRol(${id})`);
    }
  },

  async actualizarEstado(id: number, estadoId: number): Promise<UsuarioDTO> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}/estado?estadoId=${encodeURIComponent(String(estadoId))}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

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

  async cambiarContrasena(id: number, claveActual: string, claveNueva: string): Promise<void> {
    try {
      const payload = { claveActual, claveNueva };
      const candidates = [
        `${BASE_URL}/usuarios/${id}/clave`,
        `${BASE_URL}/usuarios/${id}/password`,
        `${BASE_URL}/usuarios/${id}/contrasena`,
      ];

      for (const url of candidates) {
        const response = await fetch(url, {
          method: 'PATCH',
          headers: getAuthHeaders(true),
          body: JSON.stringify(payload),
        });

        if (response.ok) return;
        if (response.status === 404 || response.status === 405) continue;

        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `cambiarContrasena(${id})`
        );
      }

      const fallbackResponse = await fetch(`${BASE_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ claveActual, clave: claveNueva }),
      });

      if (!fallbackResponse.ok) {
        const errorData = await parseErrorResponse(fallbackResponse);
        throw ErrorHandlerService.handle(
          { status: fallbackResponse.status, message: errorData.message },
          `cambiarContrasena(${id})`
        );
      }
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `cambiarContrasena(${id})`);
    }
  },

  async eliminar(id: number, adminId?: number): Promise<void> {
    try {
      const candidates: string[] = [];
      if (adminId) {
        candidates.push(`${BASE_URL}/usuarios/${id}?adminId=${encodeURIComponent(String(adminId))}`);
      }
      candidates.push(`${BASE_URL}/usuarios/${id}`);

      for (const url of candidates) {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (response.ok) return;
        if (response.status === 404 || response.status === 405) continue;

        if (response.status === 401) {
          throw ErrorHandlerService.handle(
            new Error('Sesión expirada. Vuelve a iniciar sesión.'),
            `eliminar(${id})`
          );
        }

        if (response.status === 403) {
          throw ErrorHandlerService.handle(
            new Error('No tienes permisos para eliminar usuarios.'),
            `eliminar(${id})`
          );
        }

        if (response.status === 409) {
          throw ErrorHandlerService.handle(
            new Error('No se puede eliminar este usuario porque tiene entidades asociadas.'),
            `eliminar(${id})`
          );
        }

        const errorData = await parseErrorResponse(response);
        throw ErrorHandlerService.handle(
          { status: response.status, message: errorData.message },
          `eliminar(${id})`
        );
      }

      throw ErrorHandlerService.handle(
        new Error('No se encontró un endpoint compatible para eliminar el usuario.'),
        `eliminar(${id})`
      );
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `eliminar(${id})`);
    }
  },

  /**
   * Verificar si existe un usuario por ID — PROTEGIDO
   */
  async existe(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}/exists`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return false;
      }

      return await response.json();
    } catch (error: unknown) {
      console.warn(`Advertencia verificando existencia de usuario ${id}:`, error);
      return false;
    }
  },

  /**
   * Listar todos los usuarios — PROTEGIDO (solo Admin)
   */
  async listar(includeDetails: boolean = false): Promise<UsuarioDTO[]> {
    try {
      const url = `${BASE_URL}/usuarios${includeDetails ? '?includeDetails=true' : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los usuarios' },
          'listar'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listar');
    }
  },
};

/**
 * Servicio de Roles — PROTEGIDO
 */
export const rolService = {
  async listar(): Promise<RolDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/roles`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los roles' },
          'listar'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listar');
    }
  },

  async obtenerPorId(id: number): Promise<RolDTO> {
    try {
      const response = await fetch(`${BASE_URL}/roles/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'Rol no encontrado' },
          `obtenerPorId(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },
};

/**
 * Servicio de Estados de Usuario — PROTEGIDO
 */
export const estadoUsuarioService = {
  async listar(): Promise<EstadoUsuarioDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/estados`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'No se pudieron obtener los estados' },
          'listar'
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listar');
    }
  },

  async obtenerPorId(id: number): Promise<EstadoUsuarioDTO> {
    try {
      const response = await fetch(`${BASE_URL}/estados/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw ErrorHandlerService.handle(
          { status: response.status, message: 'Estado no encontrado' },
          `obtenerPorId(${id})`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },
};

export default userService;