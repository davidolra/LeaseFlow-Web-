/**
 * Custom Hook para gestionar mensajes de contacto
 */

import { useState } from 'react';
// ✅ Después:
import contactService from '../api/contactService';
import type { MensajeContactoDTO } from '../api/contactService';

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
      
      setLoading(false);
      return { success: true, data: nuevoMensaje };
    } catch (err: any) {
      const errorMessage = err.message || 'Error al enviar mensaje';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
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
      
      setLoading(false);
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar mensajes';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
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
      
      setLoading(false);
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar mensajes';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
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