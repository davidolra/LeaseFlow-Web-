/**
 * Custom Hook: usePropiedades
 * Maneja el estado y operaciones con Property Service
 */

import { useState, useCallback } from 'react';
import { propiedadService } from '../api';
import type { PropiedadDTO, CrearPropiedadRequest, PropiedadFilters } from '../types';

export const usePropiedades = () => {
  const [propiedades, setPropiedades] = useState<PropiedadDTO[]>([]);
  const [propiedad, setPropiedad] = useState<PropiedadDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crear nueva propiedad
   */
  const crearPropiedad = useCallback(async (nuevaPropiedad: CrearPropiedadRequest) => {
    setLoading(true);
    setError(null);
    try {
      const propiedadCreada = await propiedadService.crear(nuevaPropiedad);
      setPropiedad(propiedadCreada);
      return propiedadCreada;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear propiedad';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Listar todas las propiedades
   */
  const listarPropiedades = useCallback(async (includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const propiedadesObtenidas = await propiedadService.listar(includeDetails);
      setPropiedades(propiedadesObtenidas);
      return propiedadesObtenidas;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al listar propiedades';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener propiedad por ID
   */
  const obtenerPropiedad = useCallback(async (id: number, includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const propiedadObtenida = await propiedadService.obtenerPorId(id, includeDetails);
      setPropiedad(propiedadObtenida);
      return propiedadObtenida;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener propiedad';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar propiedades con filtros
   */
  const buscarPropiedades = useCallback(async (filtros: PropiedadFilters) => {
    setLoading(true);
    setError(null);
    try {
      const propiedadesEncontradas = await propiedadService.buscar(filtros);
      setPropiedades(propiedadesEncontradas);
      return propiedadesEncontradas;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar propiedades';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar propiedad
   */
  const actualizarPropiedad = useCallback(async (id: number, datosActualizados: Partial<PropiedadDTO>) => {
    setLoading(true);
    setError(null);
    try {
      const propiedadActualizada = await propiedadService.actualizar(id, datosActualizados);
      setPropiedad(propiedadActualizada);
      return propiedadActualizada;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar propiedad';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar propiedad
   */
  const eliminarPropiedad = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await propiedadService.eliminar(id);
      setPropiedad(null);
      // Remover de la lista si está presente
      setPropiedades(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar propiedad';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar si propiedad existe
   */
  const verificarExistencia = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const existe = await propiedadService.existe(id);
      return existe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar propiedad';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener fotos de una propiedad
   */
  const obtenerFotos = useCallback(async (propiedadId: number) => {
    setLoading(true);
    setError(null);
    try {
      const fotos = await propiedadService.obtenerFotos(propiedadId);
      return fotos;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener fotos';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    propiedades,
    propiedad,
    loading,
    error,
    
    // Métodos
    crearPropiedad,
    listarPropiedades,
    obtenerPropiedad,
    buscarPropiedades,
    actualizarPropiedad,
    eliminarPropiedad,
    verificarExistencia,
    obtenerFotos,
  };
};

export default usePropiedades;
