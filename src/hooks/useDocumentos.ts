/**
 * Custom Hook: useDocumentos
 * Maneja el estado y operaciones con Document Service
 */

import { useState, useCallback } from 'react';
import { documentoService } from '../api';
import type { DocumentoDTO, CrearDocumentoRequest } from '../types';

export const useDocumentos = () => {
  const [documentos, setDocumentos] = useState<DocumentoDTO[]>([]);
  const [documento, setDocumento] = useState<DocumentoDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tieneDocumentosAprobados, setTieneDocumentosAprobados] = useState(false);

  /**
   * Subir/crear nuevo documento
   */
  const subirDocumento = useCallback(async (nuevoDocumento: CrearDocumentoRequest) => {
    setLoading(true);
    setError(null);
    try {
      const documentoCreado = await documentoService.crear(nuevoDocumento);
      setDocumento(documentoCreado);
      return documentoCreado;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir documento';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Listar todos los documentos
   */
  const listarDocumentos = useCallback(async (includeDetails: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const documentosObtenidos = await documentoService.listar(includeDetails);
      setDocumentos(documentosObtenidos);
      return documentosObtenidos;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al listar documentos';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener documento por ID
   */
  const obtenerDocumento = useCallback(async (id: number, includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const documentoObtenido = await documentoService.obtenerPorId(id, includeDetails);
      setDocumento(documentoObtenido);
      return documentoObtenido;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener documento';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener documentos de un usuario
   */
  const obtenerDocumentosUsuario = useCallback(async (usuarioId: number, includeDetails: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const documentosUsuario = await documentoService.obtenerPorUsuario(usuarioId, includeDetails);
      setDocumentos(documentosUsuario);
      return documentosUsuario;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener documentos del usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verificar si usuario tiene documentos aprobados
   * CRÍTICO para crear solicitudes de arriendo
   */
  const verificarDocumentosAprobados = useCallback(async (usuarioId: number) => {
    setLoading(true);
    setError(null);
    try {
      const tieneAprobados = await documentoService.verificarDocumentosAprobados(usuarioId);
      setTieneDocumentosAprobados(tieneAprobados);
      return tieneAprobados;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar documentos aprobados';
      setError(errorMessage);
      setTieneDocumentosAprobados(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar estado de documento
   * Estados: 1=PENDIENTE, 2=ACEPTADO, 3=RECHAZADO, 4=EN_REVISION
   */
  const actualizarEstado = useCallback(async (documentoId: number, nuevoEstadoId: number) => {
    setLoading(true);
    setError(null);
    try {
      const documentoActualizado = await documentoService.actualizarEstado(documentoId, nuevoEstadoId);
      setDocumento(documentoActualizado);
      return documentoActualizado;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar estado del documento';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aprobar documento (cambiar estado a ACEPTADO)
   */
  const aprobarDocumento = useCallback(async (documentoId: number) => {
    return actualizarEstado(documentoId, 2); // 2 = ACEPTADO
  }, [actualizarEstado]);

  /**
   * Rechazar documento (cambiar estado a RECHAZADO)
   */
  const rechazarDocumento = useCallback(async (documentoId: number) => {
    return actualizarEstado(documentoId, 3); // 3 = RECHAZADO
  }, [actualizarEstado]);

  /**
   * Eliminar documento
   */
  const eliminarDocumento = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await documentoService.eliminar(id);
      setDocumento(null);
      // Remover de la lista si está presente
      setDocumentos(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar documento';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    documentos,
    documento,
    loading,
    error,
    tieneDocumentosAprobados,
    
    // Métodos
    subirDocumento,
    listarDocumentos,
    obtenerDocumento,
    obtenerDocumentosUsuario,
    verificarDocumentosAprobados,
    actualizarEstado,
    aprobarDocumento,
    rechazarDocumento,
    eliminarDocumento,
  };
};

export default useDocumentos;
