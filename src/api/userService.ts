import API_CONFIG, { getAuthHeaders } from '../config/apiConfig';
import { ErrorHandlerService } from '../core/errors';
import { normalizeApiData } from '../utils/textEncoding';
import type { UsuarioDTO, LoginRequest, LoginResponse, RolDTO, EstadoUsuarioDTO, CrearUsuarioRequest } from '../types';

const BASE_URL = API_CONFIG.USER_SERVICE;

async function parseErrorResponse(response: Response): Promise<{ message: string; validationErrors?: Record<string, string> }> {
  try {
    return normalizeApiData<{ message: string; validationErrors?: Record<string, string> }>(await response.json());
  } catch (_error: unknown) {
    return { message: `Error ${response.status}: ${response.statusText}` };
  }
}

export const userService = {
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

      const data = normalizeApiData<LoginResponse>(await response.json());
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

      const data = normalizeApiData<UsuarioDTO>(await response.json());
      console.log('Usuario registrado exitosamente');
      return data;
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'registrar');
    }
  },

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

      const data = normalizeApiData<UsuarioDTO>(await response.json());
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

      return normalizeApiData<UsuarioDTO>(await response.json());
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

      return normalizeApiData<UsuarioDTO>(await response.json());
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

      return normalizeApiData<UsuarioDTO>(await response.json());
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `actualizarEstado(${id})`);
    }
  },

  // ✅ SIMPLIFICADO: usa directamente PATCH /usuarios/{id}/clave
  async cambiarContrasena(id: number, claveActual: string, claveNueva: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}/clave`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ claveActual, claveNueva }),
      });

      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        const mensaje = response.status === 401 || response.status === 400
          ? 'La contraseña actual es incorrecta'
          : errorData.message || 'No se pudo cambiar la contraseña';
        throw ErrorHandlerService.handle(
          { status: response.status, message: mensaje },
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

  async existe(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}/exists`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) return false;
      return normalizeApiData<boolean>(await response.json());
    } catch (error: unknown) {
      console.warn(`Advertencia verificando existencia de usuario ${id}:`, error);
      return false;
    }
  },

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

      return normalizeApiData<UsuarioDTO[]>(await response.json());
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, 'listar');
    }
  },
};

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

      return normalizeApiData<RolDTO[]>(await response.json());
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

      return normalizeApiData<RolDTO>(await response.json());
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },
};

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

      return normalizeApiData<EstadoUsuarioDTO[]>(await response.json());
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

      return normalizeApiData<EstadoUsuarioDTO>(await response.json());
    } catch (error: unknown) {
      throw ErrorHandlerService.handle(error, `obtenerPorId(${id})`);
    }
  },
};

export default userService;
