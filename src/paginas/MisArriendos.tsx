import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../config/apiConfig";
import { getErrorMessage } from "../core/errors";
import { registroService } from "../api";
import type { RegistroArriendoDTO } from "../types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatFecha(fecha: string | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function diasRestantes(fechaFin: string | undefined): number | null {
  if (!fechaFin) return null;
  const diff = new Date(fechaFin).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────
// Sub-componente: tarjeta de arriendo
// ─────────────────────────────────────────────
const TarjetaArriendo: React.FC<{ registro: RegistroArriendoDTO }> = ({ registro }) => {
  const propiedad = registro.solicitud?.propiedad;
  const foto = propiedad?.fotos?.[0]?.url;
  const dias = diasRestantes(registro.fechaFin);

  return (
    <div className="card shadow-sm h-100">
      {/* Imagen o placeholder */}
      {foto ? (
        <img
          src={foto}
          alt={propiedad?.titulo ?? "Propiedad"}
          className="card-img-top"
          style={{ height: "200px", objectFit: "cover" }}
          loading="lazy"
        />
      ) : (
        <div
          className="d-flex align-items-center justify-content-center bg-light text-muted"
          style={{ height: "200px" }}
        >
          <div className="text-center">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" className="mb-2">
              <path
                d="M4 21V9.5L12 3l8 6.5V21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 21v-6h6v6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <p className="small mb-0">Sin imagen</p>
          </div>
        </div>
      )}

      {/* Badge de estado sobre la imagen */}
      <div className="position-relative">
        <span
          className={`badge position-absolute top-0 end-0 m-2 ${
            registro.activo ? "bg-success" : "bg-secondary"
          }`}
          style={{ marginTop: "-2rem" }}
        >
          {registro.activo ? "ACTIVO" : "FINALIZADO"}
        </span>
      </div>

      <div className="card-body d-flex flex-column">
        {/* Título y dirección */}
        <h5 className="card-title mb-1">
          {propiedad?.titulo || `Solicitud #${registro.solicitudId}`}
        </h5>
        {propiedad?.direccion && (
          <p className="text-muted small mb-3">{propiedad.direccion}</p>
        )}

        {/* Características de la propiedad */}
        {propiedad && (
          <div className="d-flex flex-wrap gap-2 mb-3">
            {propiedad.m2 > 0 && (
              <span className="badge bg-light text-dark border">
                {propiedad.m2} m²
              </span>
            )}
            {propiedad.nHabit > 0 && (
              <span className="badge bg-light text-dark border">
                {propiedad.nHabit} hab.
              </span>
            )}
            {propiedad.nBanos > 0 && (
              <span className="badge bg-light text-dark border">
                {propiedad.nBanos} baño{propiedad.nBanos !== 1 ? "s" : ""}
              </span>
            )}
            {propiedad.petFriendly && (
              <span className="badge bg-light text-dark border">🐾 Pet Friendly</span>
            )}
            {propiedad.tipo?.nombre && (
              <span className="badge bg-light text-dark border">{propiedad.tipo.nombre}</span>
            )}
            {propiedad.comuna?.nombre && (
              <span className="badge bg-light text-dark border">{propiedad.comuna.nombre}</span>
            )}
          </div>
        )}

        {/* Monto mensual */}
        <p className="fw-bold text-success fs-5 mb-3">
          ${registro.montoMensual.toLocaleString("es-CL")} CLP
          <span className="fw-normal text-muted fs-6"> / mes</span>
        </p>

        {/* Fechas del contrato */}
        <div className="border rounded p-3 bg-light mb-3">
          <p className="small text-muted fw-semibold text-uppercase mb-2">Contrato</p>
          <div className="row g-2">
            <div className="col-6">
              <p className="mb-0 small text-muted">Inicio</p>
              <p className="mb-0 fw-semibold small">{formatFecha(registro.fechaInicio)}</p>
            </div>
            <div className="col-6">
              <p className="mb-0 small text-muted">Fin</p>
              <p className="mb-0 fw-semibold small">{formatFecha(registro.fechaFin)}</p>
            </div>
          </div>

          {/* Días restantes — solo si está activo y tiene fecha fin */}
          {registro.activo && dias !== null && (
            <div className="mt-2 pt-2 border-top">
              {dias > 0 ? (
                <p className="mb-0 small">
                  <span
                    className={`fw-bold ${
                      dias <= 30 ? "text-warning" : "text-success"
                    }`}
                  >
                    {dias} día{dias !== 1 ? "s" : ""} restante{dias !== 1 ? "s" : ""}
                  </span>
                </p>
              ) : (
                <p className="mb-0 small text-danger fw-bold">Contrato vencido</p>
              )}
            </div>
          )}

          {registro.activo && dias === null && (
            <p className="mb-0 small text-muted mt-2 pt-2 border-top">Sin fecha de término definida</p>
          )}
        </div>

        {/* ID de referencia */}
        <p className="text-muted small mb-0 mt-auto">
          Contrato #{registro.id} · Solicitud #{registro.solicitudId}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const MisArriendos: React.FC = () => {
  const navigate = useNavigate();
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const userId = Number(localStorage.getItem("userId") || "0");

  const [registros, setRegistros] = useState<RegistroArriendoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soloActivos, setSoloActivos] = useState(false);

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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudieron cargar tus arriendos."));
    } finally {
      setLoading(false);
    }
  }, [navigate, userId, userRole]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  const ordenados = useMemo(() => {
    const base = soloActivos ? registros.filter((r) => r.activo) : registros;
    return [...base].sort(
      (a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
    );
  }, [registros, soloActivos]);

  const activos = registros.filter((r) => r.activo).length;

  if (userRole !== ROLES.ARRIENDATARIO && userRole !== ROLES.ADMIN) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">{error || "Acceso denegado."}</div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      {/* Encabezado */}
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-4 gap-3">
        <div>
          <h1 className="fw-bold mb-1">Mis Arriendos</h1>
          <p className="text-muted mb-0">
            {activos > 0
              ? `Tienes ${activos} arriendo${activos !== 1 ? "s" : ""} activo${activos !== 1 ? "s" : ""}.`
              : "Historial de tus contratos de arriendo."}
          </p>
        </div>

        {registros.length > 0 && (
          <div className="form-check form-switch pt-1">
            <input
              className="form-check-input"
              type="checkbox"
              id="filtroActivos"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="filtroActivos">
              Solo activos
            </label>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando arriendos...</p>
        </div>
      ) : ordenados.length === 0 ? (
        <div className="alert alert-secondary text-center">
          {soloActivos
            ? "No tienes arriendos activos en este momento."
            : "Aún no tienes arriendos. Cuando un propietario acepte tu solicitud, aparecerá aquí."}
        </div>
      ) : (
        <div className="row g-4">
          {ordenados.map((r) => (
            <div className="col-12 col-md-6 col-xl-4" key={r.id}>
              <TarjetaArriendo registro={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisArriendos;
