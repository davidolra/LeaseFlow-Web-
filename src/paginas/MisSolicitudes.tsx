import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../config/apiConfig";
import { getErrorMessage } from "../core/errors";
import { mapSolicitudesApiToUI } from "../mappers/solicitudes";
import { solicitudService } from "../api";
import type { SolicitudArriendoDTO } from "../types";

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

  const solicitudesOrdenadas = useMemo(() => {
    return mapSolicitudesApiToUI(solicitudes).sort(
      (a, b) => b.fechaSolicitudTimestamp - a.fechaSolicitudTimestamp
    );
  }, [solicitudes]);

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

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando solicitudes...</p>
        </div>
      ) : solicitudesOrdenadas.length === 0 ? (
        <div className="alert alert-secondary text-center">No tienes solicitudes registradas.</div>
      ) : (
        <div className="table-responsive mt-4">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Propiedad</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesOrdenadas.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="fw-semibold">{s.tituloPropiedad}</div>
                    <div className="small text-muted">{s.direccionPropiedad}</div>
                  </td>
                  <td>
                    <span className={`badge ${s.estado === "ACEPTADA" ? "bg-success" : s.estado === "RECHAZADA" ? "bg-danger" : "bg-warning text-dark"}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td>{new Date(s.fechaSolicitud).toLocaleString()}</td>
                  <td>
                    {confirmCancelId === s.id ? (
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => cancelar(s.id)}
                          disabled={s.estado !== "PENDIENTE" || processingId === s.id}
                        >
                          {processingId === s.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                              Procesando...
                            </>
                          ) : (
                            "Confirmar"
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setConfirmCancelId(null)}
                          disabled={s.estado !== "PENDIENTE" || processingId === s.id}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setConfirmCancelId(s.id)}
                        disabled={s.estado !== "PENDIENTE" || processingId === s.id}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small text-muted">
            Nota: el botón “Cancelar” cambia el estado de la solicitud a RECHAZADA porque el backend no expone un estado “CANCELADA”.
          </div>
        </div>
      )}
    </div>
  );
};

export default MisSolicitudes;
