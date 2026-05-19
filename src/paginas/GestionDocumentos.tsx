import React, { useCallback, useEffect, useMemo, useState } from "react";

import { ROLES } from "../config/apiConfig"; 

import { documentoService } from "../api/documentService"; 


import type { 
    DocumentoDTO, 
    DocumentoFilters,
} from "../types/index";
// ===============================================
// CONSTANTES DE ESTADO 
// ===============================================
const ESTADO_PENDIENTE = 1;
const ESTADO_ACEPTADO = 2;
const ESTADO_RECHAZADO = 3;

// DECLARACIÓN DE COMPONENTE (Sin React.FC)
const GestionDocumentos = () => {
    
    const userRole = localStorage.getItem("userRole") || "";
    const revisadoPorId = localStorage.getItem("userId"); // ID del Admin
    const normalizedRole = userRole.toUpperCase();
    
    // Estados principales
    const [documentos, setDocumentos] = useState<DocumentoDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notificacion, setNotificacion] = useState<{ variant: 'success' | 'danger'; message: string } | null>(null);

    // Estado para filtros (solo mostraremos PENDIENTES por defecto)
    const filters: DocumentoFilters = useMemo(
        () => ({ estadoId: ESTADO_PENDIENTE, includeDetails: true }),
        []
    );

    // Estado para Modales y Acciones
    const [showModal, setShowModal] = useState(false);
    const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoDTO | null>(null);
    const [observaciones, setObservaciones] = useState("");
    const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null);

    const notify = useCallback((variant: 'success' | 'danger', message: string) => {
        setNotificacion({ variant, message });
    }, []);

    useEffect(() => {
        if (!notificacion) return;
        const id = window.setTimeout(() => setNotificacion(null), 2600);
        return () => window.clearTimeout(id);
    }, [notificacion]);


    // ----------------------------------------------------------------------
    // FUNCIÓN DE CARGA DE DATOS
    // ----------------------------------------------------------------------
    const fetchDocumentos = useCallback(async () => {
        if (normalizedRole !== ROLES.ADMIN) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let fetchedData: DocumentoDTO[] = await documentoService.listar(Boolean(filters.includeDetails));
            
            if (filters.estadoId) {
                fetchedData = fetchedData.filter(d => d.estadoId === filters.estadoId);
            }
            
            setDocumentos(fetchedData);

        } catch (err: unknown) { // Usamos 'unknown' en lugar de 'any'
            console.error("Error al cargar documentos:", err);
            const message = "Error al cargar documentos. Verifica que el Document Service (8083) esté activo.";
            setError(message);
            notify('danger', message);
        } finally {
            setIsLoading(false);
        }
    }, [filters.estadoId, filters.includeDetails, normalizedRole, notify]);


    // ----------------------------------------------------------------------
    // LÓGICA DE APROBACIÓN/RECHAZO
    // ----------------------------------------------------------------------

    const iniciarAccion = (documento: DocumentoDTO, action: 'aprobar' | 'rechazar') => {
        if (normalizedRole !== ROLES.ADMIN) {
            notify('danger', "No tienes permisos para realizar esta acción.");
            return;
        }
        setDocumentoSeleccionado(documento);
        setAccion(action);
        setObservaciones("");
        setShowModal(true);
    };

    const handleActualizarEstado = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentoSeleccionado || !revisadoPorId) return;

        const nuevoEstadoId = accion === 'aprobar' ? ESTADO_ACEPTADO : ESTADO_RECHAZADO;

        // Validar si es rechazo y faltan observaciones
        if (accion === 'rechazar' && (!observaciones || observaciones.trim().length < 5)) {
            notify('danger', "Las observaciones de rechazo son obligatorias y deben ser más detalladas.");
            return;
        }

        try {
            await documentoService.actualizarEstado(documentoSeleccionado.id, nuevoEstadoId);
            notify(
                accion === 'aprobar' ? 'success' : 'danger',
                `Documento ${documentoSeleccionado.nombre} ${accion === 'aprobar' ? 'APROBADO' : 'RECHAZADO'} exitosamente.`
            );
            
            setShowModal(false);
            fetchDocumentos(); 

        } catch (err: unknown) { // Usamos 'unknown' en lugar de 'any'
            notify(
                'danger',
                `Error al ${accion} el documento: ${err instanceof Error ? err.message : 'Error de conexión'}`
            );
            console.error(`Error al actualizar estado:`, err);
        }
    };

    // ----------------------------------------------------------------------
    // EFECTO DE MONTAJE
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (normalizedRole !== ROLES.ADMIN) {
            notify('danger', "Acceso denegado. Solo Administradores.");
            setIsLoading(false);
            return;
        }
        fetchDocumentos();
    }, [fetchDocumentos, normalizedRole, notify]); 


    // ----------------------------------------------------------------------
    // RENDERIZADO
    // ----------------------------------------------------------------------

    const documentosPendientes = documentos.filter(d => d.estadoId === ESTADO_PENDIENTE);

    if (normalizedRole !== ROLES.ADMIN) {
        return <div className="container my-5 alert alert-danger">Acceso denegado.</div>;
    }

    return (
        <div className="container my-5">
            {notificacion && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
                    <div className={`alert alert-${notificacion.variant} shadow-sm mb-0`} role="alert">
                        {notificacion.message}
                    </div>
                </div>
            )}
            <h1 className="fw-bold">Gestión de Documentos ({documentosPendientes.length} Pendientes)</h1>
            <p className="text-muted">Revisa y gestiona los documentos de los usuarios para aprobar o rechazar su elegibilidad.</p>
            
            {error && <div className="alert alert-danger mt-3">{error}</div>}

            {isLoading ? (
                <div className="text-center my-5"><div className="spinner-border text-primary"></div><p className="mt-2">Cargando documentos...</p></div>
            ) : documentosPendientes.length === 0 ? (
                <div className="alert alert-success text-center mt-4">
                    🎉 ¡No hay documentos pendientes de revisión!
                </div>
            ) : (
                <div className="table-responsive mt-4">
                    <table className="table table-hover align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>Usuario</th>
                                <th>Tipo de Documento</th>
                                <th>Nombre Archivo</th>
                                <th>Subido en</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documentosPendientes.map((doc) => (
                                <tr key={doc.id}>
                                    <td>
                                        {doc.usuario?.pnombre} {doc.usuario?.papellido || 'Usuario Desconocido'}
                                        <div className="small text-muted">{doc.usuario?.email}</div>
                                    </td>
                                    <td>{doc.tipoDocNombre || `ID: ${doc.tipoDocId}`}</td>
                                    <td>
                                        {doc.nombre}
                                        {/* 🚨 Aquí deberías añadir un botón/link para ver/descargar el documento real */}
                                        <button className="btn btn-sm btn-outline-info ms-2">Ver</button>
                                    </td>
                                    <td>{new Date(doc.fechaSubido).toLocaleDateString()}</td>
                                    <td>
                                        <span className="badge bg-warning">{doc.estadoNombre || 'PENDIENTE'}</span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-success btn-sm me-2"
                                            onClick={() => iniciarAccion(doc, 'aprobar')}
                                        >
                                            Aprobar
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-sm"
                                            onClick={() => iniciarAccion(doc, 'rechazar')}
                                        >
                                            Rechazar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- MODAL DE APROBACIÓN/RECHAZO --- */}
            {showModal && documentoSeleccionado && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <form className="modal-content" onSubmit={handleActualizarEstado}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {accion === 'aprobar' ? 'Aprobar Documento' : 'Rechazar Documento'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Confirma que deseas {accion} el documento:</p>
                                <p>
                                    <strong>Archivo:</strong> {documentoSeleccionado.nombre}<br/>
                                    <strong>Usuario:</strong> {documentoSeleccionado.usuario?.pnombre} {documentoSeleccionado.usuario?.papellido}
                                </p>

                                {accion === 'rechazar' && (
                                    <div className="mb-3">
                                        <label htmlFor="observaciones" className="form-label">Motivo de Rechazo *</label>
                                        <textarea
                                            id="observaciones"
                                            className="form-control"
                                            rows={3}
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            placeholder="Detalle el motivo para que el usuario pueda corregir."
                                            required
                                        ></textarea>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className={`btn btn-${accion === 'aprobar' ? 'success' : 'danger'}`}
                                >
                                    {accion === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionDocumentos;
