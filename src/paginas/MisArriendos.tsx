import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../config/apiConfig";
import { getErrorMessage } from "../core/errors";
import { registroService } from "../api";
import { reviewService } from "../api/reviewService";
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
// Modal de Valoración
// ─────────────────────────────────────────────
interface ModalValoracionProps {
  registro: RegistroArriendoDTO;
  onClose: () => void;
}

const ModalValoracion: React.FC<ModalValoracionProps> = ({ registro, onClose }) => {
  const propiedad = registro.solicitud?.propiedad;
  const userId = Number(localStorage.getItem("userId") || "0");

  const [puntaje, setPuntaje] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const estrellasValidas = puntaje >= 1 && puntaje <= 10;
  const comentarioValido = comentario.trim().length >= 10 && comentario.trim().length <= 500;
  const puedeEnviar = estrellasValidas && comentarioValido && !enviando;

  async function handleEnviar() {
    if (!puedeEnviar || !propiedad?.id) return;
    setEnviando(true);
    setErrorMsg(null);
    try {
      await reviewService.crear({
        usuarioId: userId,
        propiedadId: propiedad.id,
        puntaje,
        comentario: comentario.trim(),
        tipoResenaId: 1, // RESENA_PROPIEDAD
      });
      setExito(true);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "No se pudo enviar la valoración."));
    } finally {
      setEnviando(false);
    }
  }

  // Backdrop click cierra
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="modal d-flex align-items-center justify-content-center"
      style={{ display: "flex", backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, zIndex: 1050 }}
      onClick={handleBackdrop}
    >
      <div
        className="modal-dialog modal-dialog-centered w-100"
        style={{ maxWidth: 480, margin: "0 auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-lg rounded-4 border-0">
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div>
              <h5 className="modal-title fw-bold mb-0">Valorar vivienda</h5>
              {propiedad?.titulo && (
                <p className="text-muted small mb-0">{propiedad.titulo}</p>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Cerrar"
            />
          </div>

          <div className="modal-body px-4 py-3">
            {exito ? (
              <div className="text-center py-4">
                <div className="mb-3" style={{ fontSize: "3rem" }}>🎉</div>
                <h6 className="fw-bold">¡Gracias por tu valoración!</h6>
                <p className="text-muted small">Tu opinión ayuda a otros arrendatarios.</p>
                <button className="btn btn-primary rounded-pill px-4 mt-2" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="alert alert-danger py-2 small">{errorMsg}</div>
                )}

                {/* Estrellas — escala 1-10, mostramos 5 estrellas donde 1 estrella = 2 pts */}
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-uppercase text-muted">
                    Puntaje
                  </label>
                  <div className="d-flex gap-1 mb-1">
                    {[2, 4, 6, 8, 10].map((val) => {
                      const activa = (hover || puntaje) >= val;
                      return (
                        <button
                          key={val}
                          type="button"
                          className="btn p-0 border-0 bg-transparent"
                          style={{ fontSize: "2rem", lineHeight: 1, color: activa ? "#f5a623" : "#d1d5db" }}
                          onClick={() => setPuntaje(val)}
                          onMouseEnter={() => setHover(val)}
                          onMouseLeave={() => setHover(0)}
                          aria-label={`${val / 2} estrellas`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-muted small mb-0">
                    {puntaje === 0
                      ? "Selecciona una puntuación"
                      : `${puntaje / 2} de 5 estrellas (${puntaje}/10)`}
                  </p>
                </div>

                {/* Comentario */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-uppercase text-muted">
                    Comentario
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Describe tu experiencia en esta vivienda... (mínimo 10 caracteres)"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    maxLength={500}
                    style={{ resize: "none" }}
                  />
                  <div className="d-flex justify-content-between mt-1">
                    {comentario.trim().length > 0 && comentario.trim().length < 10 && (
                      <span className="text-danger small">Mínimo 10 caracteres</span>
                    )}
                    <span className="text-muted small ms-auto">
                      {comentario.length}/500
                    </span>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end pt-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-3"
                    onClick={onClose}
                    disabled={enviando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill px-4"
                    onClick={handleEnviar}
                    disabled={!puedeEnviar}
                  >
                    {enviando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar valoración"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Sub-componente: tarjeta de arriendo
// ─────────────────────────────────────────────
const TarjetaArriendo: React.FC<{ registro: RegistroArriendoDTO }> = ({ registro }) => {
  const propiedad = registro.solicitud?.propiedad;
  const foto = propiedad?.fotos?.[0]?.url;
  const dias = diasRestantes(registro.fechaFin);
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
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
          <p className="text-muted small mb-3 mt-auto">
            Contrato #{registro.id} · Solicitud #{registro.solicitudId}
          </p>

          {/* Botón valorar — solo para arriendos activos con propiedad */}
          {registro.activo && propiedad?.id && (
            <button
              type="button"
              className="btn btn-outline-warning w-100 rounded-pill"
              onClick={() => setModalAbierto(true)}
            >
              ★ Valorar vivienda
            </button>
          )}
        </div>
      </div>

      {modalAbierto && (
        <ModalValoracion
          registro={registro}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </>
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
