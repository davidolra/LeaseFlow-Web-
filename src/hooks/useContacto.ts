/**
 * Custom Hook para gestionar mensajes de contacto
 */

import { useState } from 'react';
import { contactService } from '../api/contactService';
import { getErrorMessage } from '../core/errors';
import type { MensajeContactoDTO } from '../types';

export const useContacto = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeContactoDTO[]>([]);

  /**
   * Crear un nuevo mensaje de contacto
   */
  const crearMensaje = async (mensaje: Partial<MensajeContactoDTO>) => {
    try {
      setLoading(true);
      setError(null);
      
      const nuevoMensaje = await contactService.crearMensaje(mensaje);
      return { success: true, data: nuevoMensaje };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Error al enviar mensaje');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Listar todos los mensajes (admin)
   */
  const listarTodos = async (includeDetails: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await contactService.listarTodos(includeDetails);
      setMensajes(data);
      return { success: true, data };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Error al cargar mensajes');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Listar mensajes de un usuario
   */
  const listarPorUsuario = async (usuarioId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await contactService.listarPorUsuario(usuarioId);
      setMensajes(data);
      return { success: true, data };
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Error al cargar mensajes');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    mensajes,
    crearMensaje,
    listarTodos,
    listarPorUsuario,
  };
};

export default useContacto;
