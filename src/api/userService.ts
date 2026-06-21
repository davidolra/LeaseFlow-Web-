import API_CONFIG from '../config/apiConfig';
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
   * Login de usuario
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
   * Registrar nuevo usuario
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
   * Obtener usuario por ID
   */
  async obtenerPorId(id: number, includeDetails: boolean = false): Promise<UsuarioDTO> {
    try {
      const url = `${BASE_URL}/usuarios/${id}${includeDetails ? '?includeDetails=true' : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
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
        headers: API_CONFIG.HEADERS,
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
        headers: API_CONFIG.HEADERS,
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
        headers: API_CONFIG.HEADERS,
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
          headers: API_CONFIG.HEADERS,
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
        headers: API_CONFIG.HEADERS,
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
          headers: API_CONFIG.HEADERS_GET,
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
   * Verificar si existe un usuario por ID
   */
  async existe(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}/exists`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
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
   * Listar todos los usuarios
   */
  async listar(includeDetails: boolean = false): Promise<UsuarioDTO[]> {
    try {
      const url = `${BASE_URL}/usuarios${includeDetails ? '?includeDetails=true' : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
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
 * Servicio de Roles
 */
export const rolService = {
  /**
   * Listar todos los roles
   */
  async listar(): Promise<RolDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/roles`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
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

  /**
   * Obtener rol por ID
   */
  async obtenerPorId(id: number): Promise<RolDTO> {
    try {
      const response = await fetch(`${BASE_URL}/roles/${id}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
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
 * Servicio de Estados de Usuario
 */
export const estadoUsuarioService = {
  /**
   * Listar todos los estados
   */
  async listar(): Promise<EstadoUsuarioDTO[]> {
    try {
      const response = await fetch(`${BASE_URL}/estados`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
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

  /**
   * Obtener estado por ID
   */
  async obtenerPorId(id: number): Promise<EstadoUsuarioDTO> {
    try {
      const response = await fetch(`${BASE_URL}/estados/${id}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS_GET,
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
