import { useState } from "react";

interface ValoracionesProps {
  onEnviar?: (rating: number, comentario: string) => void;
}

const Valoraciones: React.FC<ValoracionesProps> = ({ onEnviar }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");

  const handleEnviar = () => {
    if (rating === 0) return;
    if (onEnviar) onEnviar(rating, comentario);

    // Limpiar campos después de enviar
    setRating(0);
    setHover(0);
    setComentario("");
    alert("¡Gracias por tu reseña!");
  };

  return (
    <div className="contact-form-container" style={{ maxWidth: "400px" }}>
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
              onClick={() => setRating(value)}
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
        disabled={rating === 0}
      >
        Enviar reseña
      </button>
    </div>
  );
};

export default Valoraciones;
