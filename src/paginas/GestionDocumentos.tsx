import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();
    
    const userRole = localStorage.getItem("userRole") || "";
    const revisadoPorId = localStorage.getItem("userId"); // ID del Admin
    
    // Estados principales
    const [documentos, setDocumentos] = useState<DocumentoDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado para filtros (solo mostraremos PENDIENTES por defecto)
    const filters: DocumentoFilters = { estadoId: ESTADO_PENDIENTE, includeDetails: true };

    // Estado para Modales y Acciones
    const [showModal, setShowModal] = useState(false);
    const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoDTO | null>(null);
    const [observaciones, setObservaciones] = useState("");
    const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null);


    // ----------------------------------------------------------------------
    // FUNCIÓN DE CARGA DE DATOS
    // ----------------------------------------------------------------------
    const fetchDocumentos = async () => {
        if (userRole !== ROLES.ADMIN) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let fetchedData: DocumentoDTO[] = await documentoService.listar(true);
            
            if (filters.estadoId) {
                fetchedData = fetchedData.filter(d => d.estadoId === filters.estadoId);
            }
            
            setDocumentos(fetchedData);

        } catch (err: unknown) { // Usamos 'unknown' en lugar de 'any'
            console.error("Error al cargar documentos:", err);
            setError("Error al cargar documentos. Verifica que el Document Service (8083) esté activo.");
        } finally {
            setIsLoading(false);
        }
    };


    // ----------------------------------------------------------------------
    // LÓGICA DE APROBACIÓN/RECHAZO
    // ----------------------------------------------------------------------

    const iniciarAccion = (documento: DocumentoDTO, action: 'aprobar' | 'rechazar') => {
        if (userRole !== ROLES.ADMIN) {
            alert("No tienes permisos para realizar esta acción.");
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
            alert("Las observaciones de rechazo son obligatorias y deben ser más detalladas.");
            return;
        }

        try {
            await documentoService.actualizarEstado(documentoSeleccionado.id, nuevoEstadoId);
            
            alert(`Documento ${documentoSeleccionado.nombre} ${accion === 'aprobar' ? 'APROBADO' : 'RECHAZADO'} exitosamente.`);
            
            setShowModal(false);
            fetchDocumentos(); 

        } catch (err: unknown) { // Usamos 'unknown' en lugar de 'any'
            alert(`Error al ${accion} el documento: ${err instanceof Error ? err.message : 'Error de conexión'}`);
            console.error(`Error al actualizar estado:`, err);
        }
    };

    // ----------------------------------------------------------------------
    // EFECTO DE MONTAJE
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (userRole !== ROLES.ADMIN) {
            alert("Acceso denegado. Solo Administradores.");
            navigate("/");
            return;
        }
        fetchDocumentos();
    }, [userRole, navigate, filters]); 


    // ----------------------------------------------------------------------
    // RENDERIZADO
    // ----------------------------------------------------------------------

    const documentosPendientes = documentos.filter(d => d.estadoId === ESTADO_PENDIENTE);

    if (userRole !== ROLES.ADMIN) {
        return <div className="container my-5 alert alert-danger">Acceso denegado.</div>;
    }

    return (
        <div className="container my-5">
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
