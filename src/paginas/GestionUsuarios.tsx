import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ROLES } from "../config/apiConfig";
import { estadoUsuarioService, rolService, userService } from "../api";
import type { EstadoUsuarioDTO, RolDTO, UsuarioDTO } from "../types";

const GestionUsuarios: React.FC = () => {
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();

  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [estados, setEstados] = useState<EstadoUsuarioDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [notificacion, setNotificacion] = useState<{ variant: "success" | "danger"; message: string } | null>(null);

  useEffect(() => {
    if (!notificacion) return;
    const id = window.setTimeout(() => setNotificacion(null), 2600);
    return () => window.clearTimeout(id);
  }, [notificacion]);

  const fetchAll = useCallback(async () => {
    if (userRole !== ROLES.ADMIN) {
      setLoading(false);
      setError("Acceso denegado. Solo Administradores.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [u, r, e] = await Promise.all([
        userService.listar(true),
        rolService.listar(),
        estadoUsuarioService.listar(),
      ]);
      setUsuarios(Array.isArray(u) ? u : []);
      setRoles(Array.isArray(r) ? r : []);
      setEstados(Array.isArray(e) ? e : []);
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const usuariosFiltrados = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return usuarios;
    return usuarios.filter((u) => `${u.pnombre} ${u.papellido} ${u.email} ${u.rut}`.toLowerCase().includes(kw));
  }, [q, usuarios]);

  const cambiarRol = async (id: number, rolId: number) => {
    try {
      const updated = await userService.actualizarRol(id, rolId);
      setUsuarios((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setNotificacion({ variant: "success", message: "Rol actualizado." });
    } catch (err: any) {
      setNotificacion({ variant: "danger", message: err?.message || "No se pudo actualizar el rol." });
    }
  };

  const cambiarEstado = async (id: number, estadoId: number) => {
    try {
      const updated = await userService.actualizarEstado(id, estadoId);
      setUsuarios((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setNotificacion({ variant: "success", message: "Estado actualizado." });
    } catch (err: any) {
      setNotificacion({ variant: "danger", message: err?.message || "No se pudo actualizar el estado." });
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

      <h1 className="fw-bold mb-2">Gestión de Usuarios</h1>
      <p className="text-muted">Lista de usuarios y administración de roles/estados.</p>

      <div className="row g-2 align-items-end mt-3">
        <div className="col-12 col-md-6">
          <label className="form-label">Buscar</label>
          <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, correo, RUT..." />
        </div>
        <div className="col-12 col-md-3">
          <button type="button" className="btn btn-outline-primary w-100" onClick={fetchAll} disabled={loading}>
            Recargar
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando usuarios...</p>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="alert alert-secondary text-center mt-4">No hay usuarios para mostrar.</div>
      ) : (
        <div className="table-responsive mt-4">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="fw-semibold">{u.pnombre} {u.papellido}</div>
                    <div className="small text-muted">{u.rut}</div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={u.rolId}
                      onChange={(e) => cambiarRol(u.id, Number(e.target.value))}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={u.estadoId}
                      onChange={(e) => cambiarEstado(u.id, Number(e.target.value))}
                    >
                      {estados.map((es) => (
                        <option key={es.id} value={es.id}>
                          {es.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small text-muted">
            Si algún cambio falla con 404/405, revisa el Swagger del userservice: puede que el endpoint de cambio de rol/estado use otra ruta.
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;

