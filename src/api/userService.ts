/**
 * User Service API - VERSIÓN CORREGIDA
 * Maneja autenticación y gestión de usuarios
 * 
 * CAMBIOS:
 * - Mejor manejo de errores de red
 * - Logs más descriptivos
 * - Validación de respuestas del backend
 */

import API_CONFIG from '../config/apiConfig';
import type { UsuarioDTO, LoginRequest, LoginResponse, RolDTO, EstadoUsuarioDTO, CrearUsuarioRequest } from '../types';

const BASE_URL = API_CONFIG.USER_SERVICE;

/**
 * Manejo centralizado de errores con logs detallados
 */
const handleError = (error: any, operation: string): never => {
  console.error(`Error en ${operation}:`, error);
  
  // Error de red (CORS, servidor caído, etc.)
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    throw new Error(
      'No se pudo conectar con el servidor. ' +
      'Verifica que:\n' +
      '1. El User Service esté corriendo en http://localhost:8081\n' +
      '2. CORS esté configurado en el backend\n' +
      '3. No haya firewall bloqueando la conexión'
    );
  }
  
  // Error HTTP (respuesta del servidor)
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || `Error ${status}`;
    throw new Error(message);
  }
  
  // Error de timeout o red
  if (error.request) {
    throw new Error(
      'No hubo respuesta del servidor. ' +
      'Verifica que el User Service (puerto 8081) esté corriendo.'
    );
  }
  
  // Otros errores
  throw new Error(error.message || 'Error desconocido');
};

/**
 * Usuario Service
 */
export const userService = {
  /**
   * Login de usuario
   * @param credentials - Email y contraseña (campo 'clave')
   * @returns LoginResponse con información del usuario
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Intentando login con:', credentials.email);
      console.log(' URL:', `${BASE_URL}/usuarios/login`);
      
      const response = await fetch(`${BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(credentials),
      });

      console.log('📥 Respuesta HTTP:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        
        if (response.status === 401) {
          throw new Error('Email o contraseña incorrectos');
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data: LoginResponse = await response.json();
      console.log('✅ Login exitoso:', {
        email: data.usuario?.email,
        rolId: data.usuario?.rolId,
        estadoId: data.usuario?.estadoId
      });
      
      // El backend devuelve { mensaje: string, usuario: UsuarioDTO }
      // Necesitamos convertirlo al formato esperado por el frontend
      return {
        success: true,
        mensaje: data.mensaje || 'Login exitoso',
        usuario: data.usuario
      };
    } catch (error: any) {
      console.error('Error capturado en login:', error);
      return handleError(error, 'login');
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al registrar usuario');
      }

      const data = await response.json();
      console.log('Usuario registrado exitosamente:', data.id);
      return data;
    } catch (error: any) {
      return handleError(error, 'registrarUsuario');
    }
  },

  /**
   * Obtener usuario por ID
   */
  async obtenerPorId(id: number, includeDetails: boolean = false): Promise<UsuarioDTO> {
    try {
      const url = `${BASE_URL}/usuarios/${id}${includeDetails ? '?includeDetails=true' : ''}`;
      console.log('Obteniendo usuario:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Usuario no encontrado`);
      }

      const data = await response.json();
      console.log('Usuario obtenido:', data.email);
      return data;
    } catch (error: any) {
      return handleError(error, `obtenerUsuarioPorId(${id})`);
    }
  },

  /**
   * Verificar si existe un usuario por ID
   */
  async existe(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/${id}/exists`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        return false;
      }

      return await response.json();
    } catch (error: any) {
      console.warn(`Error verificando existencia de usuario ${id}:`, error);
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
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los usuarios`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, 'listarUsuarios');
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
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los roles`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, 'listarRoles');
    }
  },

  /**
   * Obtener rol por ID
   */
  async obtenerPorId(id: number): Promise<RolDTO> {
    try {
      const response = await fetch(`${BASE_URL}/roles/${id}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Rol no encontrado`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `obtenerRolPorId(${id})`);
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
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener los estados`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, 'listarEstadosUsuario');
    }
  },

  /**
   * Obtener estado por ID
   */
  async obtenerPorId(id: number): Promise<EstadoUsuarioDTO> {
    try {
      const response = await fetch(`${BASE_URL}/estados/${id}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Estado no encontrado`);
      }

      return await response.json();
    } catch (error: any) {
      return handleError(error, `obtenerEstadoPorId(${id})`);
    }
  },
};

export default userService;
