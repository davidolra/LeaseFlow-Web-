/**
 * Custom Hook: useUsuarios
 * Maneja estado y operaciones de usuarios con tipado estricto
 */

import { useState } from 'react';
import { userService } from '../api/userService';
import { ErrorHandlerService } from '../core/errors';
import type { UsuarioDTO, LoginRequest, LoginResponse } from '../types';

export const useUsuarios = () => {
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.login(credentials);

      if (response.success && response.usuario) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', response.usuario.email);
        localStorage.setItem('userId', response.usuario.id.toString());

        let rolNombre = 'ARRIENDATARIO';
        if (response.usuario.rolId === 1) rolNombre = 'ADMIN';
        else if (response.usuario.rolId === 2) rolNombre = 'PROPIETARIO';
        else if (response.usuario.rolId === 3) rolNombre = 'ARRIENDATARIO';

        localStorage.setItem('userRole', rolNombre);
        setUsuario(response.usuario);
        window.dispatchEvent(new Event('lf-auth-changed'));
      }

      return response;
    } catch (err: unknown) {
      const errorMsg = ErrorHandlerService.getUserMessage(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setUsuario(null);
    setError(null);
  };

  const obtenerUsuarioActual = async (): Promise<UsuarioDTO | null> => {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;

    try {
      const usuarioData = await userService.obtenerPorId(parseInt(userId, 10), true);
      setUsuario(usuarioData);
      return usuarioData;
    } catch (err: unknown) {
      const errorMsg = ErrorHandlerService.getUserMessage(err);
      console.error(errorMsg);
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
