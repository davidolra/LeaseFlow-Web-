import React, { useEffect, useState } from "react";
import { usePropiedades, useSolicitudes, useDocumentos } from "../hooks";

const Arrienda: React.FC = () => {
  const { propiedades, loading: loadingProp, listarPropiedades } = usePropiedades();
  const { crearSolicitud, loading: loadingSol, error: errorSol } = useSolicitudes();
  const { verificarDocumentosAprobados } = useDocumentos();
  
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Cargar propiedades desde Property Service al montar componente
    listarPropiedades(true);
  }, []);

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
    } catch {
      setMensaje(errorSol || "Error al crear solicitud");
      setTipoMensaje("error");
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
        {propiedades.map((propiedad) => (
          <div key={propiedad.id} className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm">
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
                  disabled={loadingSol}
                >
                  {loadingSol ? 'Postulando...' : 'Postular a este arriendo'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {propiedades.length === 0 && (
        <div className="alert alert-info text-center">
          No hay propiedades disponibles en este momento.
        </div>
      )}
    </div>
  );
};

export default Arrienda;
