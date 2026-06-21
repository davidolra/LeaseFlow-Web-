import React, { useEffect, useState } from "react";
import { ROLES } from "../config/apiConfig";
import { getErrorMessage } from "../core/errors";
import { documentoService, propiedadService, registroService, solicitudService, userService } from "../api";
import { contactService } from "../api/contactService";

type Kpi = {
  usuarios: number;
  propiedades: number;
  solicitudes: number;
  registros: number;
  documentos: number;
  mensajesContacto: number;
};

const AdminDashboard: React.FC = () => {
  const userRole = (localStorage.getItem("userRole") || "").toUpperCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<Kpi>({
    usuarios: 0,
    propiedades: 0,
    solicitudes: 0,
    registros: 0,
    documentos: 0,
    mensajesContacto: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (userRole !== ROLES.ADMIN) {
        setLoading(false);
        setError("Acceso denegado. Solo Administradores.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          usuarios,
          propiedades,
          solicitudes,
          registros,
          documentos,
          mensajes,
        ] = await Promise.all([
          userService.listar(false),
          propiedadService.listar(false),
          solicitudService.listar(false),
          registroService.listar(false),
          documentoService.listar(false),
          contactService.listarTodos(false),
        ]);

        if (cancelled) return;

        setKpi({
          usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
          propiedades: Array.isArray(propiedades) ? propiedades.length : 0,
          solicitudes: Array.isArray(solicitudes) ? solicitudes.length : 0,
          registros: Array.isArray(registros) ? registros.length : 0,
          documentos: Array.isArray(documentos) ? documentos.length : 0,
          mensajesContacto: Array.isArray(mensajes) ? mensajes.length : 0,
        });
      } catch (error: unknown) {
        if (cancelled) return;
        setError(getErrorMessage(error, "No se pudo cargar el dashboard."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  if (userRole !== ROLES.ADMIN) {
    return <div className="container my-5 alert alert-danger">{error || "Acceso denegado."}</div>;
  }

  return (
    <div className="container my-5">
      <h1 className="fw-bold mb-2">Panel de Administración</h1>
      <p className="text-muted mb-4">Vista general del estado del sistema.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Cargando métricas...</p>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Usuarios</div>
                <div className="fs-3 fw-bold">{kpi.usuarios}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Propiedades</div>
                <div className="fs-3 fw-bold">{kpi.propiedades}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Solicitudes</div>
                <div className="fs-3 fw-bold">{kpi.solicitudes}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Registros</div>
                <div className="fs-3 fw-bold">{kpi.registros}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Documentos</div>
                <div className="fs-3 fw-bold">{kpi.documentos}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="text-muted small">Mensajes de contacto</div>
                <div className="fs-3 fw-bold">{kpi.mensajesContacto}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
