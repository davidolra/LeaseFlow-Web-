import React, { useEffect, useMemo, useState } from "react";
import { usePropiedades, useSolicitudes, useDocumentos } from "../hooks";
import { useLocation } from "react-router-dom";
import { getErrorMessage } from "../core/errors";
import API_CONFIG, { getAuthHeaders } from "../config/apiConfig";

// ─────────────────────────────────────────────
// Estrellas visuales (escala 1-10 → 0.5-5 estrellas)
// ─────────────────────────────────────────────
const Estrellas: React.FC<{ promedio: number | null; total?: number }> = ({ promedio, total }) => {
  if (promedio === null) {
    return <span className="text-muted small">Sin valoraciones aún</span>;
  }

  // El backend guarda puntaje 1-10; mostramos sobre 5
  const sobre5 = promedio / 2;
  const estrellas = Array.from({ length: 5 }, (_, i) => {
    const val = i + 1;
    if (sobre5 >= val) return "full";
    if (sobre5 >= val - 0.5) return "half";
    return "empty";
  });

  return (
    <div className="d-flex align-items-center gap-1">
      <span style={{ color: "#f5a623", fontSize: "1rem", letterSpacing: "-1px" }}>
        {estrellas.map((tipo, i) =>
          tipo === "full" ? "★" : tipo === "half" ? "⯨" : "☆"
        ).join("")}
      </span>
      <span className="text-muted small">
        {sobre5.toFixed(1)}
        {total !== undefined && total > 0 && ` (${total})`}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const Arrienda: React.FC = () => {
  const location = useLocation();
  const { propiedades, loading: loadingProp, listarPropiedades, buscarPropiedades } = usePropiedades();
  const { crearSolicitud } = useSolicitudes();
  const { verificarDocumentosAprobados } = useDocumentos();

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<"success" | "error">("success");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Mapa propiedadId → promedio (null = sin reseñas, undefined = cargando)
  const [promedios, setPromedios] = useState<Record<number, number | null>>({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    const tipoId = params.get("tipoId") ? Number(params.get("tipoId")) : undefined;
    const minPrecio = params.get("minPrecio") ? Number(params.get("minPrecio")) : undefined;
    const maxPrecio = params.get("maxPrecio") ? Number(params.get("maxPrecio")) : undefined;

    const hasFilters =
      Boolean(q) ||
      (tipoId !== undefined && !Number.isNaN(tipoId)) ||
      (minPrecio !== undefined && !Number.isNaN(minPrecio)) ||
      (maxPrecio !== undefined && !Number.isNaN(maxPrecio));

    if (hasFilters) {
      buscarPropiedades({
        tipoId: tipoId && !Number.isNaN(tipoId) ? tipoId : undefined,
        minPrecio: minPrecio && !Number.isNaN(minPrecio) ? minPrecio : undefined,
        maxPrecio: maxPrecio && !Number.isNaN(maxPrecio) ? maxPrecio : undefined,
        includeDetails: true,
      });
      return;
    }

    listarPropiedades(true);
  }, [buscarPropiedades, listarPropiedades, location.search]);

  // Cargar promedios en paralelo cuando cambian las propiedades
  useEffect(() => {
    if (!propiedades.length) return;

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) return; // el endpoint requiere headers de identidad

    const fetchPromedios = async () => {
      const resultados = await Promise.allSettled(
        propiedades.map(async (p) => {
          const res = await fetch(
            `${API_CONFIG.REVIEW_SERVICE}/reviews/propiedad/${p.id}/promedio`,
            { headers: getAuthHeaders() }
          );
          if (!res.ok) return { id: p.id, promedio: null };
          const valor = await res.json();
          // El backend devuelve un número (double) o null/0 si no hay reseñas
          const promedio = typeof valor === "number" && valor > 0 ? valor : null;
          return { id: p.id, promedio };
        })
      );

      const mapa: Record<number, number | null> = {};
      resultados.forEach((r) => {
        if (r.status === "fulfilled") {
          mapa[r.value.id] = r.value.promedio;
        }
      });
      setPromedios(mapa);
    };

    fetchPromedios();
  }, [propiedades]);

  const propiedadesFiltradas = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim().toLowerCase();
    if (!q) return propiedades;
    return propiedades.filter((p) => {
      const haystack = `${p.titulo} ${p.direccion} ${p.comuna?.nombre || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [location.search, propiedades]);

  const handlePostular = async (propiedadId: number) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      setMensaje("Debes iniciar sesión para postular");
      setTipoMensaje("error");
      return;
    }

    const userIdStr = localStorage.getItem("userId");
    if (!userIdStr) {
      setMensaje("Error: No se pudo obtener el ID de usuario");
      setTipoMensaje("error");
      return;
    }

    const userId = parseInt(userIdStr, 10);

    try {
      setLoadingId(propiedadId);
      const tieneDocumentos = await verificarDocumentosAprobados(userId);
      if (!tieneDocumentos) {
        setMensaje("Debes tener al menos un documento aprobado para postular");
        setTipoMensaje("error");
        return;
      }

      const apiMod = await import("../config/apiConfig");
      const res = await fetch(`${apiMod.API_CONFIG.APPLICATION_SERVICE}/solicitudes`, {
        method: "POST",
        headers: apiMod.getAuthHeaders(true),
        body: JSON.stringify({ usuarioId: userId, propiedadId }),
      });

      if (!res.ok) {
        let backendMsg = "Error al crear solicitud";
        try {
          const json = await res.json();
          backendMsg = json?.message || backendMsg;
        } catch (_e) { /* ignorar */ }
        setMensaje(backendMsg);
        setTipoMensaje("error");
        return;
      }

      setMensaje("¡Solicitud creada exitosamente!");
      setTipoMensaje("success");
    } catch (error: unknown) {
      setMensaje(getErrorMessage(error, "Error al crear solicitud"));
      setTipoMensaje("error");
    } finally {
      setLoadingId(null);
    }
  };

  if (loadingProp) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando propiedades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Propiedades Disponibles</h1>

      {mensaje && (
        <div
          className={`alert alert-${tipoMensaje === "success" ? "success" : "danger"} alert-dismissible fade show`}
          role="alert"
        >
          {mensaje}
          <button type="button" className="btn-close" onClick={() => setMensaje(null)} />
        </div>
      )}

      <div className="row">
        {propiedadesFiltradas.map((propiedad) => (
          <div key={propiedad.id} className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm">
              {propiedad.fotos?.[0]?.url ? (
                <img
                  src={propiedad.fotos[0].url}
                  alt={propiedad.titulo}
                  className="card-img-top"
                  style={{ height: 180, objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center bg-light text-muted"
                  style={{ height: 180 }}
                >
                  Sin imagen
                </div>
              )}
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{propiedad.titulo}</h5>

                {/* Valoración */}
                <div className="mb-2">
                  <Estrellas
                    promedio={promedios[propiedad.id] ?? null}
                  />
                </div>

                <p className="card-text">
                  <strong>Dirección:</strong> {propiedad.direccion}<br />
                  <strong>Precio:</strong> ${propiedad.precioMensual.toLocaleString()} {propiedad.divisa}<br />
                  <strong>M²:</strong> {propiedad.m2}<br />
                  <strong>Habitaciones:</strong> {propiedad.nHabit} | <strong>Baños:</strong> {propiedad.nBanos}
                </p>

                <button
                  className="btn btn-primary w-100 mt-auto"
                  onClick={() => handlePostular(propiedad.id)}
                  disabled={loadingId === propiedad.id}
                >
                  {loadingId === propiedad.id ? "Postulando..." : "Postular a este arriendo"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {propiedadesFiltradas.length === 0 && !loadingProp && (
        <div className="alert alert-info text-center">
          No hay propiedades disponibles en este momento.
        </div>
      )}
    </div>
  );
};

export default Arrienda;
