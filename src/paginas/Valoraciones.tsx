import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../config/apiConfig";
import API_CONFIG from "../config/apiConfig";
import { getErrorMessage } from "../core/errors";

interface ValoracionesProps {
  onEnviar?: (rating: number, comentario: string) => void;
}

// ID del tipo de reseña por defecto (RESENA_PROPIEDAD).
// Ajusta este valor si en tu BD el ID es diferente.
const TIPO_RESENA_PROPIEDAD_ID = 1;

const Valoraciones: React.FC<ValoracionesProps> = ({ onEnviar }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notificacion, setNotificacion] = useState<{ variant: "success" | "danger"; message: string } | null>(null);

  useEffect(() => {
    if (!notificacion) return;
    const id = window.setTimeout(() => setNotificacion(null), 2600);
    return () => window.clearTimeout(id);
  }, [notificacion]);

  const userId = useMemo(() => {
    const raw = localStorage.getItem("userId");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  }, []);

  const handleEnviar = async () => {
    if (rating === 0 || submitting) return;
    if (localStorage.getItem("isLoggedIn") !== "true" || !userId) {
      navigate("/login", { state: { flash: { variant: "danger", message: "Debes iniciar sesión para enviar una reseña." } } });
      return;
    }

    try {
      setSubmitting(true);
      // Campo correcto: "puntaje" (no "rating"), y tipoResenaId es @NotNull en ReviewDTO
      const payload = {
        usuarioId: userId,
        puntaje: rating,              // ← corregido: era "rating", debe ser "puntaje"
        comentario: comentario.trim() || undefined,
        tipoResenaId: TIPO_RESENA_PROPIEDAD_ID, // ← agregado: @NotNull en ReviewDTO
      };

      const response = await fetch(`${API_CONFIG.REVIEW_SERVICE}/reviews`, {
        method: "POST",
        headers: getAuthHeaders(true), // ← corregido: incluye X-Usuario-Id, X-Rol-Id y Content-Type
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch((_error: unknown) => "");
        let message = `Error ${response.status}: No se pudo enviar la reseña`;
        try {
          const json = text ? JSON.parse(text) : null;
          message = json?.message || json?.mensaje || message;
        } catch (_error: unknown) {
          if (text) message = `${message}. ${text.slice(0, 180)}`;
        }
        throw new Error(message);
      }

      onEnviar?.(rating, comentario);
      setRating(0);
      setHover(0);
      setComentario("");
      setNotificacion({ variant: "success", message: "Reseña enviada. ¡Gracias!" });
    } catch (error: unknown) {
      setNotificacion({ variant: "danger", message: getErrorMessage(error, "No se pudo enviar la reseña.") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-form-container" style={{ maxWidth: "400px" }}>
      {notificacion ? (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className={`alert alert-${notificacion.variant} shadow-sm mb-0`} role="alert">
            {notificacion.message}
          </div>
        </div>
      ) : null}
      <h1 className="valoraciones-title">Deja tu valoración</h1>
      
      <div className="valoracion-stars" style={{ margin: "1rem 0", textAlign: "center" }}>
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          const classes = [
            hover >= value ? "hover" : "",
            rating >= value ? "selected" : ""
          ].join(" ").trim();

          return (
            <span
              key={value}
              className={classes}
              onClick={() => setRating(rating === value ? 0 : value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              style={{ marginRight: "5px", cursor: "pointer", fontSize: "1.5rem" }}
            >
              ★
            </span>
          );
        })}
      </div>

      <textarea
        className="form-control"
        placeholder="Escribe tu comentario..."
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={3}
        style={{ marginBottom: "1rem" }}
      />

      <button
        className="valoracion-btn btn"
        onClick={handleEnviar}
        disabled={rating === 0 || submitting}
      >
        {submitting ? "Enviando..." : "Enviar reseña"}
      </button>
    </div>
  );
};

export default Valoraciones;
