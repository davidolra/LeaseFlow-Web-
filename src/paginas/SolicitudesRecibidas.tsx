import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../config/apiConfig";
import { getErrorMessage } from "../core/errors";
import { propiedadService, solicitudService } from "../api";
import { documentoService } from "../api/documentService";
import { userService } from "../api/userService";
import type { DocumentoDTO, PropiedadDTO, SolicitudArriendoDTO, UsuarioDTO } from "../types";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("es-CL");
};

const formatDateOnly = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-CL");
};

const formatMoney = (amount?: number, currency: "CLP" | "USD" | "EUR" = "CLP") => {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "-";

  const locale = currency === "CLP" ? "es-CL" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(amount);
};

const yesNo = (value?: boolean) => {
  if (value === undefined) return "-";
  return value ? "Si" : "No";
};

const applicantNameFromUser = (usuarioId: number, usuario?: UsuarioDTO) => {
  if (!usuario) return `Usuario #${usuarioId}`;
  return [usuario.pnombre, usuario.snombre, usuario.papellido].filter(Boolean).join(" ");
};

const applicantInitialsFromUser = (usuario?: UsuarioDTO) => {
  if (!usuario) return "U";
  return `${usuario.pnombre?.charAt(0) || ""}${usuario.papellido?.charAt(0) || ""}`.toUpperCase() || "U";
};

const statusBadgeClass = (estado: SolicitudArriendoDTO["estado"]) => {
  if (estado === "ACEPTADA") return "bg-success";
  if (estado === "RECHAZADA") return "bg-danger";
  return "bg-warning text-dark";
};

const documentStatusBadgeClass = (estadoId?: number) => {
  if (estadoId === 2) return "bg-success";
  if (estadoId === 3) return "bg-danger";
  if (estadoId === 4) return "bg-info text-dark";
  return "bg-warning text-dark";
};

const documentStatusLabel = (documento: DocumentoDTO) => {
  if (documento.estadoNombre) return documento.estadoNombre;
  if (documento.estadoId === 2) return "ACEPTADO";
  if (documento.estadoId === 3) return "RECHAZADO";
  if (documento.estadoId === 4) return "EN_REVISION";
  return "PENDIENTE";
};

const documentTypeLabel = (documento: DocumentoDTO) => {
  return documento.tipoDocNombre || `Tipo #${documento.tipoDocId}`;
};

const acceptedDocuments = (documentos: DocumentoDTO[]) => {
  return documentos.filter((doc) => doc.estadoId === 2);
};

const SolicitudesRecibidas: React.FC = () => {
  const navigate = useNavigate();
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const userId = Number(localStorage.getItem("userId") || "0");

  const [solicitudes, setSolicitudes] = useState<SolicitudArriendoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<{ variant: "success" | "danger"; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [expandedApplicantId, setExpandedApplicantId] = useState<number | null>(null);
  const [loadingDocumentsUserId, setLoadingDocumentsUserId] = useState<number | null>(null);
  const [documentosPorUsuario, setDocumentosPorUsuario] = useState<Record<number, DocumentoDTO[]>>({});
  const [erroresDocumentosPorUsuario, setErroresDocumentosPorUsuario] = useState<Record<number, string>>({});
  const [usuariosPorId, setUsuariosPorId] = useState<Record<number, UsuarioDTO>>({});

  useEffect(() => {
    if (!notificacion) return;
    const id = window.setTimeout(() => setNotificacion(null), 2600);
    return () => window.clearTimeout(id);
  }, [notificacion]);

  const fetchSolicitudes = useCallback(async () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      navigate("/login");
      return;
    }

    if (userRole !== ROLES.PROPIETARIO && userRole !== ROLES.ADMIN) {
      setLoading(false);
      setError("Acceso denegado.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const propiedades: PropiedadDTO[] =
        userRole === ROLES.ADMIN ? await propiedadService.listar(true) : await propiedadService.listarPorPropietario(userId, true);

      const propiedadIds = new Set<number>((propiedades || []).map((p) => p.id));
      const propiedadPorId = new Map<number, PropiedadDTO>();
      (propiedades || []).forEach((p) => propiedadPorId.set(p.id, p));

      const allSolicitudes = await solicitudService.listar(true);
      const merged = (allSolicitudes || []).filter((s) => propiedadIds.has(s.propiedadId));

      const uniq = new Map<number, SolicitudArriendoDTO>();
      merged.forEach((s) => {
        const prop = propiedadPorId.get(s.propiedadId);
        uniq.set(s.id, { ...s, propiedad: prop || s.propiedad });
      });

      const finalSolicitudes = Array.from(uniq.values());
      setSolicitudes(finalSolicitudes);

      const missingUserIds = Array.from(
        new Set(
          finalSolicitudes
            .filter((s) => {
              return !s.usuario || !s.usuario.email;
            })
            .map((s) => s.usuarioId)
        )
      );

      if (missingUserIds.length > 0) {
        const results = await Promise.all(
          missingUserIds.map(async (id) => {
            try {
              const usuario = await userService.obtenerPorId(id, true);
              return { id, usuario };
            } catch (_error: unknown) {
              return null;
            }
          })
        );

        const next: Record<number, UsuarioDTO> = {};
        results.forEach((r) => {
          if (!r) return;
          next[r.id] = r.usuario;
        });

        if (Object.keys(next).length > 0) {
          setUsuariosPorId((prev) => ({ ...prev, ...next }));
        }
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudieron cargar las solicitudes recibidas."));
    } finally {
      setLoading(false);
    }
  }, [navigate, userId, userRole]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const toggleApplicantDocuments = async (usuarioId: number) => {
    if (expandedApplicantId === usuarioId) {
      setExpandedApplicantId(null);
      return;
    }

    setExpandedApplicantId(usuarioId);

    if (documentosPorUsuario[usuarioId] || loadingDocumentsUserId === usuarioId) {
      return;
    }

    try {
      setLoadingDocumentsUserId(usuarioId);
      setErroresDocumentosPorUsuario((prev) => {
        const next = { ...prev };
        delete next[usuarioId];
        return next;
      });
      const documentos = await documentoService.obtenerPorUsuario(usuarioId, true);
      setDocumentosPorUsuario((prev) => ({ ...prev, [usuarioId]: Array.isArray(documentos) ? documentos : [] }));
    } catch (error: unknown) {
      setErroresDocumentosPorUsuario((prev) => ({
        ...prev,
        [usuarioId]: getErrorMessage(error, "No se pudieron cargar los documentos del postulante."),
      }));
    } finally {
      setLoadingDocumentsUserId((current) => (current === usuarioId ? null : current));
    }
  };

  const actualizar = async (id: number, estado: "ACEPTADA" | "RECHAZADA") => {
    try {
      setProcessingId(id);
      const updated = await solicitudService.actualizarEstado(id, estado);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setNotificacion({ variant: "success", message: `Solicitud ${estado}.` });
    } catch (error: unknown) {
      setNotificacion({ variant: "danger", message: getErrorMessage(error, "No se pudo actualizar la solicitud.") });
    } finally {
      setProcessingId(null);
    }
  };

  const ordenadas = useMemo(() => {
    return [...solicitudes].sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
  }, [solicitudes]);

  if (userRole !== ROLES.PROPIETARIO && userRole !== ROLES.ADMIN) {
    return <div className="container my-5 alert alert-danger">{error || "Acceso denegado."}</div>;
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

      <h1 className="fw-bold mb-2">Solicitudes Recibidas</h1>
      <p className="text-muted">Revisa postulaciones a tus propiedades.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando solicitudes...</p>
        </div>
      ) : ordenadas.length === 0 ? (
        <div className="alert alert-secondary text-center">No hay solicitudes para mostrar.</div>
      ) : (
        <div className="mt-4 d-grid gap-4">
          {ordenadas.map((s) => {
            const usuario = usuariosPorId[s.usuarioId] || s.usuario;
            const nombreUsuario = applicantNameFromUser(s.usuarioId, usuario);
            const inicialesUsuario = applicantInitialsFromUser(usuario);
            const correoUsuario = usuario?.email || "-";
            const telefonoUsuario = usuario?.ntelefono || "-";
            const rutUsuario = usuario?.rut || "-";
            const fechaNacimientoUsuario = formatDateOnly(usuario?.fnacimiento);
            const rolUsuario = usuario?.rol?.nombre || (usuario?.rolId ? `Rol #${usuario.rolId}` : "-");
            const estadoUsuario = usuario?.estado?.nombre || (usuario?.estadoId ? `Estado #${usuario.estadoId}` : "-");
            const duocVipUsuario = yesNo(usuario?.duocVip);
            const puntosUsuario = usuario?.puntos ?? "-";
            const codigoRefUsuario = usuario?.codigoRef || "-";
            const registroUsuario = formatDateOnly(usuario?.fcreacion);
            const actualizacionUsuario = formatDate(usuario?.factualizacion);

            return (
              <div key={s.id} className="card shadow-sm border-0">
              <div className="card-body p-4">
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 mb-4">
                  <div>
                    <h2 className="h5 fw-bold mb-1">
                      {s.propiedad?.titulo || `Propiedad #${s.propiedadId}`}
                    </h2>
                    <div className="text-muted small">Solicitud #{s.id}</div>
                    <div className="text-muted small">
                      Fecha de postulacion: {formatDate(s.fechaSolicitud)}
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className={`badge ${statusBadgeClass(s.estado)}`}>{s.estado}</span>
                    <span className="badge bg-secondary">Propiedad #{s.propiedadId}</span>
                    <span className="badge bg-dark">Usuario #{s.usuarioId}</span>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-xl-6">
                    <div className="border rounded-3 h-100 p-3 bg-light-subtle">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 52, height: 52 }}
                        >
                          {inicialesUsuario}
                        </div>
                        <div>
                          <div className="text-uppercase small text-muted">Postulante</div>
                          <div className="fw-semibold">{nombreUsuario}</div>
                        </div>
                      </div>

                      <div className="row g-2 small">
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Correo</div>
                          <div>{correoUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Telefono</div>
                          <div>{telefonoUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">RUT</div>
                          <div>{rutUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Fecha de nacimiento</div>
                          <div>{fechaNacimientoUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Rol</div>
                          <div>{rolUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Estado de cuenta</div>
                          <div>{estadoUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Duoc VIP</div>
                          <div>{duocVipUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">LeaseflowPoints</div>
                          <div>{puntosUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Codigo de referido</div>
                          <div>{codigoRefUsuario}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Registro</div>
                          <div>{registroUsuario}</div>
                        </div>
                        <div className="col-12">
                          <div className="text-muted">Ultima actualizacion</div>
                          <div>{actualizacionUsuario}</div>
                        </div>
                        <div className="col-12 mt-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => toggleApplicantDocuments(s.usuarioId)}
                            disabled={loadingDocumentsUserId === s.usuarioId}
                          >
                            {loadingDocumentsUserId === s.usuarioId
                              ? "Cargando documentos..."
                              : expandedApplicantId === s.usuarioId
                                ? "Ocultar documentos"
                                : "Ver documentos del postulante"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-xl-6">
                    <div className="border rounded-3 h-100 p-3">
                      <div className="text-uppercase small text-muted mb-3">Propiedad postulada</div>

                      {s.propiedad?.fotos?.[0]?.url ? (
                        <img
                          src={s.propiedad.fotos[0].url}
                          alt={s.propiedad.titulo}
                          className="img-fluid rounded mb-3"
                          style={{ width: "100%", maxHeight: 220, objectFit: "cover" }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="rounded d-flex align-items-center justify-content-center bg-light text-muted mb-3"
                          style={{ width: "100%", minHeight: 160 }}
                        >
                          Sin imagen disponible
                        </div>
                      )}

                      <div className="row g-2 small">
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Titulo</div>
                          <div className="fw-semibold">
                            {s.propiedad?.titulo || `Propiedad #${s.propiedadId}`}
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Codigo</div>
                          <div>{s.propiedad?.codigo || "-"}</div>
                        </div>
                        <div className="col-12">
                          <div className="text-muted">Direccion</div>
                          <div>{s.propiedad?.direccion || "-"}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Comuna</div>
                          <div>{s.propiedad?.comuna?.nombre || "-"}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Tipo</div>
                          <div>{s.propiedad?.tipo?.nombre || (s.propiedad?.tipoId ? `Tipo #${s.propiedad.tipoId}` : "-")}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Precio</div>
                          <div>{formatMoney(s.propiedad?.precioMensual, s.propiedad?.divisa || "CLP")}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Estado de la propiedad</div>
                          <div>{s.propiedad?.estadoPropiedad || "-"}</div>
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="text-muted">m2</div>
                          <div>{s.propiedad?.m2 ?? "-"}</div>
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="text-muted">Habitaciones</div>
                          <div>{s.propiedad?.nHabit ?? "-"}</div>
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="text-muted">Banos</div>
                          <div>{s.propiedad?.nBanos ?? "-"}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Pet friendly</div>
                          <div>{yesNo(s.propiedad?.petFriendly)}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="text-muted">Creacion</div>
                          <div>{formatDateOnly(s.propiedad?.fcreacion)}</div>
                        </div>
                        <div className="col-12">
                          <div className="text-muted">Descripcion</div>
                          <div>{s.propiedad?.descripcion || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedApplicantId === s.usuarioId ? (
                  <div className="mt-4 pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                      <div>
                        <div className="fw-semibold">Documentos aceptados del postulante</div>
                        <div className="small text-muted">{nombreUsuario}</div>
                      </div>
                      <span className="badge bg-secondary">
                        {acceptedDocuments(documentosPorUsuario[s.usuarioId] || []).length} documento(s)
                      </span>
                    </div>

                    {loadingDocumentsUserId === s.usuarioId ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                        <p className="small text-muted mb-0 mt-2">Cargando documentos del postulante...</p>
                      </div>
                    ) : erroresDocumentosPorUsuario[s.usuarioId] ? (
                      <div className="alert alert-danger mb-0">
                        {erroresDocumentosPorUsuario[s.usuarioId]}
                      </div>
                    ) : acceptedDocuments(documentosPorUsuario[s.usuarioId] || []).length === 0 ? (
                      <div className="alert alert-secondary mb-0">
                        Este postulante no tiene documentos aceptados.
                      </div>
                    ) : (
                      <div className="row g-3">
                        {acceptedDocuments(documentosPorUsuario[s.usuarioId] || []).map((doc) => (
                          <div key={doc.id} className="col-12 col-lg-6">
                            <div className="border rounded-3 p-3 h-100 bg-light">
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <div>
                                  <div className="fw-semibold">{documentTypeLabel(doc)}</div>
                                  <div className="small text-muted">{doc.nombre}</div>
                                </div>
                                <span className={`badge ${documentStatusBadgeClass(doc.estadoId)}`}>
                                  {documentStatusLabel(doc)}
                                </span>
                              </div>
                              <div className="row g-2 small">
                                <div className="col-12 col-md-6">
                                  <div className="text-muted">Documento ID</div>
                                  <div>{doc.id}</div>
                                </div>
                                <div className="col-12 col-md-6">
                                  <div className="text-muted">Usuario ID</div>
                                  <div>{doc.usuarioId}</div>
                                </div>
                                <div className="col-12 col-md-6">
                                  <div className="text-muted">Subido el</div>
                                  <div>{formatDate(doc.fechaSubido)}</div>
                                </div>
                                <div className="col-12 col-md-6">
                                  <div className="text-muted">Estado</div>
                                  <div>{documentStatusLabel(doc)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="d-flex flex-wrap gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => actualizar(s.id, "ACEPTADA")}
                    disabled={s.estado !== "PENDIENTE" || processingId === s.id}
                  >
                    {processingId === s.id ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Procesando...
                      </>
                    ) : (
                      "Aceptar postulante"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => actualizar(s.id, "RECHAZADA")}
                    disabled={s.estado !== "PENDIENTE" || processingId === s.id}
                  >
                    {processingId === s.id ? "Procesando..." : "Rechazar postulante"}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolicitudesRecibidas;
