import React, { useEffect, useMemo, useState } from "react";
import { usePropiedades, useSolicitudes, useDocumentos } from "../hooks";
import { useLocation } from "react-router-dom";

const Arrienda: React.FC = () => {
  const location = useLocation();
  const { propiedades, loading: loadingProp, listarPropiedades, buscarPropiedades } = usePropiedades();
  const { crearSolicitud } = useSolicitudes();
  const { verificarDocumentosAprobados } = useDocumentos();
  
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'error'>('success');
  const [loadingId, setLoadingId] = useState<number | null>(null);

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
    // Verificar si está logueado
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      setMensaje("Debes iniciar sesión para postular");
      setTipoMensaje("error");
      return;
    }

    // Obtener userId
    const userIdStr = localStorage.getItem("userId");
    if (!userIdStr) {
      setMensaje("Error: No se pudo obtener el ID de usuario");
      setTipoMensaje("error");
      return;
    }

    const userId = parseInt(userIdStr, 10);

    try {
      setLoadingId(propiedadId);
      // Verificar documentos aprobados
      const tieneDocumentos = await verificarDocumentosAprobados(userId);
      if (!tieneDocumentos) {
        setMensaje("Debes tener al menos un documento aprobado para postular");
        setTipoMensaje("error");
        return;
      }

      // Crear solicitud
      await crearSolicitud({
        usuarioId: userId,
        propiedadId: propiedadId,
      });

      setMensaje("¡Solicitud creada exitosamente!");
      setTipoMensaje("success");
    } catch (err: any) {
      const raw = (err?.message || "").toString();
      const msgLower = raw.toLowerCase();

      if (raw.includes("409") || msgLower.includes("duplicate") || msgLower.includes("ya")) {
        setMensaje("Ya tienes una postulación activa para esta propiedad.");
      } else if (msgLower.includes("documento") && msgLower.includes("aprob")) {
        setMensaje("Debes tener al menos un documento aprobado para postular.");
      } else if (raw) {
        setMensaje(raw);
      } else {
        setMensaje("Error al crear solicitud");
      }
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
        <div className={`alert alert-${tipoMensaje === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
          {mensaje}
          <button type="button" className="btn-close" onClick={() => setMensaje(null)}></button>
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
              <div className="card-body">
                <h5 className="card-title">{propiedad.titulo}</h5>
                <p className="card-text">
                  <strong>Dirección:</strong> {propiedad.direccion}<br />
                  <strong>Precio:</strong> ${propiedad.precioMensual.toLocaleString()} {propiedad.divisa}<br />
                  <strong>M²:</strong> {propiedad.m2}<br />
                  <strong>Habitaciones:</strong> {propiedad.nHabit} | <strong>Baños:</strong> {propiedad.nBanos}
                </p>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => handlePostular(propiedad.id)}
                  disabled={loadingId === propiedad.id}
                >
                  {loadingId === propiedad.id ? 'Postulando...' : 'Postular a este arriendo'}
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
