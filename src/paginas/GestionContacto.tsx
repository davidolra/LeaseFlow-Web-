import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ROLES } from "../config/apiConfig";
import { contactService, type MensajeContactoDTO } from "../api/contactService";

const GestionContacto: React.FC = () => {
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const adminId = Number(localStorage.getItem("userId") || "0");

  const [mensajes, setMensajes] = useState<MensajeContactoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<"" | "PENDIENTE" | "EN_PROCESO" | "RESUELTO">("");
  const [q, setQ] = useState("");
  const [notificacion, setNotificacion] = useState<{ variant: "success" | "danger"; message: string } | null>(null);

  const notify = useCallback((variant: "success" | "danger", message: string) => {
    setNotificacion({ variant, message });
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const id = window.setTimeout(() => setNotificacion(null), 2600);
    return () => window.clearTimeout(id);
  }, [notificacion]);

  const fetchMensajes = useCallback(async () => {
    if (userRole !== ROLES.ADMIN) {
      setLoading(false);
      setError("Acceso denegado. Solo Administradores.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await contactService.listarTodos(true);
      setMensajes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los mensajes.");
      notify("danger", e?.message || "No se pudieron cargar los mensajes.");
    } finally {
      setLoading(false);
    }
  }, [notify, userRole]);

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes]);

  const mensajesFiltrados = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return mensajes.filter((m) => {
      if (estadoFiltro && m.estado !== estadoFiltro) return false;
      if (!kw) return true;
      const haystack = `${m.nombre} ${m.email} ${m.asunto} ${m.mensaje}`.toLowerCase();
      return haystack.includes(kw);
    });
  }, [estadoFiltro, mensajes, q]);

  const actualizarEstado = async (id: number, estado: "PENDIENTE" | "EN_PROCESO" | "RESUELTO") => {
    try {
      const updated = await contactService.actualizarEstado(id, estado);
      setMensajes((prev) => prev.map((m) => (m.id === id ? updated : m)));
      notify("success", `Estado actualizado a ${estado}.`);
    } catch (e: any) {
      notify("danger", e?.message || "No se pudo actualizar el estado.");
    }
  };

  const responder = async (id: number) => {
    const respuesta = window.prompt("Respuesta al usuario:");
    if (!respuesta || respuesta.trim().length < 3) return;

    try {
      const updated = await contactService.responderMensaje(id, {
        respuesta: respuesta.trim(),
        respondidoPor: adminId,
        nuevoEstado: "RESUELTO",
      });
      setMensajes((prev) => prev.map((m) => (m.id === id ? updated : m)));
      notify("success", "Respuesta enviada.");
    } catch (e: any) {
      notify("danger", e?.message || "No se pudo responder el mensaje.");
    }
  };

  if (userRole !== ROLES.ADMIN) {
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

      <h1 className="fw-bold mb-2">Gestión de Contacto</h1>
      <p className="text-muted">Bandeja de mensajes recibidos desde “Contáctanos”.</p>

      <div className="row g-2 align-items-end mt-3">
        <div className="col-12 col-md-4">
          <label className="form-label">Buscar</label>
          <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, correo, asunto..." />
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label">Estado</label>
          <select className="form-select" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value as any)}>
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="RESUELTO">Resuelto</option>
          </select>
        </div>
        <div className="col-12 col-md-3">
          <button type="button" className="btn btn-outline-primary w-100" onClick={fetchMensajes} disabled={loading}>
            Recargar
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando mensajes...</p>
        </div>
      ) : mensajesFiltrados.length === 0 ? (
        <div className="alert alert-secondary text-center mt-4">No hay mensajes para mostrar.</div>
      ) : (
        <div className="table-responsive mt-4">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Remitente</th>
                <th>Asunto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mensajesFiltrados.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="fw-semibold">{m.nombre}</div>
                    <div className="small text-muted">{m.email}</div>
                  </td>
                  <td>
                    <div className="fw-semibold">{m.asunto}</div>
                    <div className="small text-muted text-truncate" style={{ maxWidth: 520 }}>
                      {m.mensaje}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${m.estado === "RESUELTO" ? "bg-success" : m.estado === "EN_PROCESO" ? "bg-info text-dark" : "bg-warning text-dark"}`}>
                      {m.estado || "PENDIENTE"}
                    </span>
                  </td>
                  <td>{m.fechaCreacion ? new Date(m.fechaCreacion).toLocaleString() : "-"}</td>
                  <td className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-success" onClick={() => responder(Number(m.id))} disabled={!m.id}>
                      Responder
                    </button>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 160 }}
                      value={m.estado || "PENDIENTE"}
                      onChange={(e) => actualizarEstado(Number(m.id), e.target.value as any)}
                      disabled={!m.id}
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_PROCESO">En proceso</option>
                      <option value="RESUELTO">Resuelto</option>
                    </select>
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

export default GestionContacto;

