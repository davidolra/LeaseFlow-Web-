/**
 * Custom Hook: useUsuarios
 * Maneja estado y operaciones de usuarios
 */

import { useState } from 'react';
import { userService } from '../api/userService';
import type { UsuarioDTO, LoginRequest, LoginResponse } from '../types';

export const useUsuarios = () => {
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login de usuario
   */
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.login(credentials);

      if (response.success && response.usuario) {
        // Guardar en localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', response.usuario.email);
        localStorage.setItem('userId', response.usuario.id.toString());
        
        // Mapear rolId a nombre de rol
        let rolNombre = 'ARRIENDATARIO';
        if (response.usuario.rolId === 1) rolNombre = 'ADMIN';
        else if (response.usuario.rolId === 2) rolNombre = 'PROPIETARIO';
        else if (response.usuario.rolId === 3) rolNombre = 'ARRIENDATARIO';
        
        localStorage.setItem('userRole', rolNombre);
        
        setUsuario(response.usuario);
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout de usuario
   */
  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setUsuario(null);
    setError(null);
  };

  /**
   * Obtener usuario actual desde localStorage
   */
  const obtenerUsuarioActual = async (): Promise<UsuarioDTO | null> => {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;

    try {
      const usuarioData = await userService.obtenerPorId(parseInt(userId), true);
      setUsuario(usuarioData);
      return usuarioData;
    } catch (err: any) {
      console.error('Error obteniendo usuario actual:', err);
      return null;
    }
  };

  return {
    usuario,
    loading,
    error,
    login,
    logout,
    obtenerUsuarioActual,
  };
};

export default useUsuarios;