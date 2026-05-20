import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../config/apiConfig";
import { registroService } from "../api";
import type { RegistroArriendoDTO } from "../types";

const MisArriendos: React.FC = () => {
  const navigate = useNavigate();
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const userId = Number(localStorage.getItem("userId") || "0");

  const [registros, setRegistros] = useState<RegistroArriendoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistros = useCallback(async () => {
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
      const data = await registroService.listar(true);
      const all = Array.isArray(data) ? data : [];
      const mine = all.filter((r) => r.solicitud?.usuarioId === userId);
      setRegistros(mine);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar tus arriendos.");
    } finally {
      setLoading(false);
    }
  }, [navigate, userId, userRole]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  const ordenados = useMemo(() => {
    return [...registros].sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
  }, [registros]);

  if (userRole !== ROLES.ARRIENDATARIO && userRole !== ROLES.ADMIN) {
    return <div className="container my-5 alert alert-danger">{error || "Acceso denegado."}</div>;
  }

  return (
    <div className="container my-5">
      <h1 className="fw-bold mb-2">Mis Arriendos</h1>
      <p className="text-muted">Historial y contratos activos.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando arriendos...</p>
        </div>
      ) : ordenados.length === 0 ? (
        <div className="alert alert-secondary text-center">No hay arriendos para mostrar.</div>
      ) : (
        <div className="table-responsive mt-4">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Propiedad</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="fw-semibold">{r.solicitud?.propiedad?.titulo || `Solicitud #${r.solicitudId}`}</div>
                    <div className="small text-muted">{r.solicitud?.propiedad?.direccion || ""}</div>
                  </td>
                  <td>{new Date(r.fechaInicio).toLocaleDateString()}</td>
                  <td>{r.fechaFin ? new Date(r.fechaFin).toLocaleDateString() : "-"}</td>
                  <td>${r.montoMensual.toLocaleString("es-CL")}</td>
                  <td>
                    <span className={`badge ${r.activo ? "bg-success" : "bg-secondary"}`}>{r.activo ? "ACTIVO" : "FINALIZADO"}</span>
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

export default MisArriendos;

