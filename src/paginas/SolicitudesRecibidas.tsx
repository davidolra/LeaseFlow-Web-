import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../config/apiConfig";
import { propiedadService, solicitudService } from "../api";
import type { PropiedadDTO, SolicitudArriendoDTO } from "../types";

const SolicitudesRecibidas: React.FC = () => {
  const navigate = useNavigate();
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const userId = Number(localStorage.getItem("userId") || "0");

  const [solicitudes, setSolicitudes] = useState<SolicitudArriendoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<{ variant: "success" | "danger"; message: string } | null>(null);

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

      const ids = (propiedades || []).map((p) => p.id);
      const solicitudesByProp = await Promise.all(ids.map((id) => solicitudService.obtenerPorPropiedad(id, true).catch(() => [])));
      const merged = solicitudesByProp.flat();
      const uniq = new Map<number, SolicitudArriendoDTO>();
      merged.forEach((s) => uniq.set(s.id, s));
      setSolicitudes(Array.from(uniq.values()));
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar las solicitudes recibidas.");
    } finally {
      setLoading(false);
    }
  }, [navigate, userId, userRole]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const actualizar = async (id: number, estado: "ACEPTADA" | "RECHAZADA") => {
    try {
      const updated = await solicitudService.actualizarEstado(id, estado);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setNotificacion({ variant: "success", message: `Solicitud ${estado}.` });
    } catch (e: any) {
      setNotificacion({ variant: "danger", message: e?.message || "No se pudo actualizar la solicitud." });
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
        <div className="table-responsive mt-4">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Propiedad</th>
                <th>Solicitante</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="fw-semibold">{s.propiedad?.titulo || `Propiedad #${s.propiedadId}`}</div>
                    <div className="small text-muted">{s.propiedad?.direccion || ""}</div>
                  </td>
                  <td>
                    <div className="fw-semibold">{s.usuario ? `${s.usuario.pnombre} ${s.usuario.papellido}` : `Usuario #${s.usuarioId}`}</div>
                    <div className="small text-muted">{s.usuario?.email || ""}</div>
                  </td>
                  <td>
                    <span className={`badge ${s.estado === "ACEPTADA" ? "bg-success" : s.estado === "RECHAZADA" ? "bg-danger" : "bg-warning text-dark"}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td>{new Date(s.fechaSolicitud).toLocaleString()}</td>
                  <td className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-success" onClick={() => actualizar(s.id, "ACEPTADA")} disabled={s.estado !== "PENDIENTE"}>
                      Aceptar
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => actualizar(s.id, "RECHAZADA")} disabled={s.estado !== "PENDIENTE"}>
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SolicitudesRecibidas;

