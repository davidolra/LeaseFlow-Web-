/**
 * Custom Hook: useSolicitudes
 * Maneja el estado y operaciones con Application Service (Solicitudes)
 */

import { useState, useCallback } from 'react';
import { solicitudService } from '../api';
import type { SolicitudArriendoDTO, CrearSolicitudRequest } from '../types';

export const useSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudArriendoDTO[]>([]);
  const [solicitud, setSolicitud] = useState<SolicitudArriendoDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudesActivas, setSolicitudesActivas] = useState(0);

  /**
   * Crear nueva solicitud de arriendo
   * Valida automáticamente:
   * - Usuario existe
   * - Usuario tiene rol correcto
   * - Usuario no tiene más de 3 solicitudes activas
   * - Propiedad existe
   * - Usuario tiene documentos aprobados
   */
  const crearSolicitud = useCallback(async (nuevaSolicitud: CrearSolicitudRequest) => {
    setLoading(true);
    setError(null);
    try {
      const solicitudCreada = await solicitudService.crear(nuevaSolicitud);
      setSolicitud(solicitudCreada);
      return solicitudCreada;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear solicitud';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Listar todas las solicitudes
   */
  const listarSolicitudes = useCallback(async (includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const solicitudesObtenidas = await solicitudService.listar(includeDetails);
      setSolicitudes(solicitudesObtenidas);
      return solicitudesObtenidas;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al listar solicitudes';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener solicitud por ID
   */
  const obtenerSolicitud = useCallback(async (id: number, includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const solicitudObtenida = await solicitudService.obtenerPorId(id, includeDetails);
      setSolicitud(solicitudObtenida);
      return solicitudObtenida;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener solicitud';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener solicitudes de un usuario
   */
  const obtenerSolicitudesUsuario = useCallback(async (usuarioId: number, includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const solicitudesUsuario = await solicitudService.obtenerPorUsuario(usuarioId, includeDetails);
      setSolicitudes(solicitudesUsuario);
      return solicitudesUsuario;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener solicitudes del usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener solicitudes de una propiedad
   */
  const obtenerSolicitudesPropiedad = useCallback(async (propiedadId: number, includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const solicitudesPropiedad = await solicitudService.obtenerPorPropiedad(propiedadId, includeDetails);
      setSolicitudes(solicitudesPropiedad);
      return solicitudesPropiedad;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener solicitudes de la propiedad';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar estado de solicitud
   * Estados válidos: PENDIENTE, ACEPTADA, RECHAZADA
   */
  const actualizarEstado = useCallback(async (
    id: number,
    nuevoEstado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const solicitudActualizada = await solicitudService.actualizarEstado(id, nuevoEstado);
      setSolicitud(solicitudActualizada);
      // Actualizar en la lista si está presente
      setSolicitudes(prev =>
        prev.map(s => s.id === id ? solicitudActualizada : s)
      );
      return solicitudActualizada;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar estado de solicitud';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aceptar solicitud
   */
  const aceptarSolicitud = useCallback(async (id: number) => {
    return actualizarEstado(id, 'ACEPTADA');
  }, [actualizarEstado]);

  /**
   * Rechazar solicitud
   */
  const rechazarSolicitud = useCallback(async (id: number) => {
    return actualizarEstado(id, 'RECHAZADA');
  }, [actualizarEstado]);

  /**
   * Eliminar solicitud
   */
  const eliminarSolicitud = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await solicitudService.eliminar(id);
      setSolicitud(null);
      // Remover de la lista si está presente
      setSolicitudes(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar solicitud';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Contar solicitudes activas de un usuario
   */
  const contarSolicitudesActivas = useCallback(async (usuarioId: number) => {
    setLoading(true);
    setError(null);
    try {
      const cantidad = await solicitudService.contarActivas(usuarioId);
      setSolicitudesActivas(cantidad);
      return cantidad;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al contar solicitudes activas';
      setError(errorMessage);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar si usuario puede crear más solicitudes
   * Límite: 3 solicitudes activas (PENDIENTE)
   */
  const puedeCrearSolicitud = useCallback(async (usuarioId: number) => {
    try {
      const cantidad = await contarSolicitudesActivas(usuarioId);
      return cantidad < 3;
    } catch (err) {
      console.error('Error al verificar límite de solicitudes:', err);
      return false;
    }
  }, [contarSolicitudesActivas]);

  return {
    // Estado
    solicitudes,
    solicitud,
    loading,
    error,
    solicitudesActivas,
    
    // Métodos
    crearSolicitud,
    listarSolicitudes,
    obtenerSolicitud,
    obtenerSolicitudesUsuario,
    obtenerSolicitudesPropiedad,
    actualizarEstado,
    aceptarSolicitud,
    rechazarSolicitud,
    eliminarSolicitud,
    contarSolicitudesActivas,
    puedeCrearSolicitud,
  };
};

export default useSolicitudes;
