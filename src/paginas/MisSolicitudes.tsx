import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../config/apiConfig";
import { getErrorMessage } from "../core/errors";
import { solicitudService } from "../api";
import type { SolicitudArriendoDTO } from "../types";

type EstadoFiltro = "TODAS" | "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

function badgeClase(estado: string): string {
  if (estado === "ACEPTADA") return "bg-success";
  if (estado === "RECHAZADA") return "bg-danger";
  return "bg-warning text-dark";
}

const MisSolicitudes: React.FC = () => {
  const navigate = useNavigate();
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const userId = Number(localStorage.getItem("userId") || "0");

  const [solicitudes, setSolicitudes] = useState<SolicitudArriendoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<{ variant: "success" | "danger"; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<EstadoFiltro>("TODAS");

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

    if (userRole !== ROLES.ARRIENDATARIO && userRole !== ROLES.ADMIN) {
      setLoading(false);
      setError("Acceso denegado.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await solicitudService.obtenerPorUsuario(userId, true);
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudieron cargar tus solicitudes."));
    } finally {
      setLoading(false);
    }
  }, [navigate, userId, userRole]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const cancelar = async (id: number) => {
    try {
      setProcessingId(id);
      setConfirmCancelId(null);
      const updated = await solicitudService.actualizarEstado(id, "RECHAZADA");
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setNotificacion({ variant: "success", message: "Solicitud cancelada." });
    } catch (error: unknown) {
      setNotificacion({ variant: "danger", message: getErrorMessage(error, "No se pudo cancelar la solicitud.") });
    } finally {
      setProcessingId(null);
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    const base = filtro === "TODAS" ? solicitudes : solicitudes.filter((s) => s.estado === filtro);
    return [...base].sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
  }, [solicitudes, filtro]);

  const conteos = useMemo(
    () => ({
      TODAS: solicitudes.length,
      PENDIENTE: solicitudes.filter((s) => s.estado === "PENDIENTE").length,
      ACEPTADA: solicitudes.filter((s) => s.estado === "ACEPTADA").length,
      RECHAZADA: solicitudes.filter((s) => s.estado === "RECHAZADA").length,
    }),
    [solicitudes]
  );

  if (userRole !== ROLES.ARRIENDATARIO && userRole !== ROLES.ADMIN) {
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

      <h1 className="fw-bold mb-2">Mis Solicitudes</h1>
      <p className="text-muted">Seguimiento de tus postulaciones.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ── Tabs de filtro ── */}
      <ul className="nav nav-tabs mb-4">
        {(["TODAS", "PENDIENTE", "ACEPTADA", "RECHAZADA"] as EstadoFiltro[]).map((estado) => (
          <li className="nav-item" key={estado}>
            <button
              type="button"
              className={`nav-link${filtro === estado ? " active fw-semibold" : ""}`}
              onClick={() => setFiltro(estado)}
            >
              {estado === "TODAS" ? "Todas" : estado.charAt(0) + estado.slice(1).toLowerCase()}
              <span
                className={`ms-2 badge rounded-pill ${
                  estado === "PENDIENTE"
                    ? "bg-warning text-dark"
                    : estado === "ACEPTADA"
                    ? "bg-success"
                    : estado === "RECHAZADA"
                    ? "bg-danger"
                    : "bg-secondary"
                }`}
              >
                {conteos[estado]}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando solicitudes...</p>
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="alert alert-secondary text-center">
          {filtro === "TODAS" ? "No tienes solicitudes registradas." : `No tienes solicitudes con estado ${filtro.toLowerCase()}.`}
        </div>
      ) : (
        <div className="row g-4">
          {solicitudesFiltradas.map((s) => {
            const prop = s.propiedad;
            const puedeCancel = s.estado === "PENDIENTE";

            return (
              <div className="col-12 col-lg-6" key={s.id}>
                <div className="card shadow-sm h-100">
                  <div className="card-body d-flex flex-column">
                    {/* Encabezado */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1">{prop?.titulo || `Propiedad #${s.propiedadId}`}</h5>
                        <p className="text-muted small mb-0">{prop?.direccion || ""}</p>
                        {(prop?.comuna?.nombre || prop?.codigo) && (
                          <p className="text-muted small mb-0">
                            {prop?.comuna?.nombre}
                            {prop?.comuna?.nombre && prop?.codigo ? " · " : ""}
                            {prop?.codigo ? `Código ${prop.codigo}` : ""}
                          </p>
                        )}
                      </div>
                      <span className={`badge ${badgeClase(s.estado)}`}>{s.estado}</span>
                    </div>

                    {/* Características de la propiedad */}
                    {prop && (
                      <div className="border rounded p-3 mb-3 bg-light">
                        <p className="fw-semibold mb-2 small text-uppercase text-muted">Características</p>
                        <div className="d-flex flex-wrap gap-3 small">
                          {prop.tipo?.nombre && (
                            <span>
                              <strong>Tipo:</strong> {prop.tipo.nombre}
                            </span>
                          )}
                          {prop.m2 != null && (
                            <span>
                              <strong>{prop.m2}</strong> m²
                            </span>
                          )}
                          {prop.nHabit != null && (
                            <span>
                              <strong>{prop.nHabit}</strong> hab.
                            </span>
                          )}
                          {prop.nBanos != null && (
                            <span>
                              <strong>{prop.nBanos}</strong> baños
                            </span>
                          )}
                          {prop.petFriendly != null && (
                            <span>{prop.petFriendly ? "Pet friendly" : "No pet friendly"}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Precio y fecha de solicitud */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <p className="mb-0 small text-muted">Precio mensual</p>
                        <p className="fw-bold text-success mb-0">
                          {prop?.precioMensual
                            ? `$${prop.precioMensual.toLocaleString("es-CL")} ${prop.divisa ?? "CLP"}`
                            : "—"}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="mb-0 small text-muted">Fecha solicitud</p>
                        <p className="mb-0 small">{new Date(s.fechaSolicitud).toLocaleString("es-CL")}</p>
                      </div>
                    </div>

                    {/* Mensajes según estado */}
                    {s.estado === "ACEPTADA" && (
                      <div className="alert alert-success py-2 mb-3 small">
                        Solicitud aceptada. Revisa el contrato en <strong>Mis Arriendos</strong>.
                      </div>
                    )}
                    {s.estado === "RECHAZADA" && (
                      <div className="alert alert-danger py-2 mb-3 small">Solicitud rechazada.</div>
                    )}

                    {/* Acción cancelar — solo PENDIENTE */}
                    <div className="mt-auto">
                      {puedeCancel &&
                        (confirmCancelId === s.id ? (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger flex-fill"
                              onClick={() => cancelar(s.id)}
                              disabled={processingId === s.id}
                            >
                              {processingId === s.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                  Procesando...
                                </>
                              ) : (
                                "Confirmar cancelación"
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setConfirmCancelId(null)}
                              disabled={processingId === s.id}
                            >
                              Volver
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger w-100"
                            onClick={() => setConfirmCancelId(s.id)}
                            disabled={processingId === s.id}
                          >
                            Cancelar solicitud
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {solicitudesFiltradas.length > 0 && (
        <div className="small text-muted mt-3">
          Nota: el botón “Cancelar solicitud” cambia el estado de la solicitud a RECHAZADA porque el backend no expone un estado “CANCELADA”.
        </div>
      )}
    </div>
  );
};

export default MisSolicitudes;
