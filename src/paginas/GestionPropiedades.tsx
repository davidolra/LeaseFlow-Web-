import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


import { propiedadService, comunaService, tipoService, regionService } from "../api"; 
import { ROLES } from "../config/apiConfig"; 
import type { PropiedadDTO, CrearPropiedadRequest, ComunaDTO, TipoPropiedadDTO, RegionDTO } from "../types";


interface Propiedad {
  id: number;
  codigo: string;
  titulo: string;          
  descripcion: string;
  direccion: string;
  precioMensual: number;   
  divisa: 'CLP' | 'USD' | 'EUR'; 
  m2: number; 
  nHabit: number;
  nBanos: number;
  petFriendly: boolean;
  tipoId: number;
  comunaId: number;
  propietarioId: number; 
  propietarioEmail: string;
  imagen: string; 
  estadoPropiedad?: 'ACTIVA' | 'INACTIVA' | 'EN_REVISION' | 'ARRENDADA';
}

type GestionPropiedadesScope = 'AUTO' | 'MINE' | 'ALL';

const GestionPropiedades: React.FC<{ scope?: GestionPropiedadesScope }> = ({ scope = 'AUTO' }) => {
  const navigate = useNavigate();
  
  // Lectura del usuario y rol desde localStorage
  const userRole = localStorage.getItem("userRole") || "";
  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail") || "";

  // Estados
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<{ variant: "success" | "danger"; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // ESTADO INICIAL COMPLETO (NECESARIO PARA EL DTO)
  const INITIAL_PROPIEDAD_STATE: Propiedad = {
    id: 0,
    codigo: "",
    titulo: "",
    descripcion: "",
    direccion: "",
    precioMensual: 0,
    divisa: 'CLP',
    m2: 0, // Inicializado en 0 para forzar selección/ingreso
    nHabit: 0,
    nBanos: 0,
    petFriendly: false,
    tipoId: 0, // Inicializado en 0 para forzar selección
    comunaId: 0, // Inicializado en 0 para forzar selección
    propietarioId: userId ? Number(userId) : 0, 
    propietarioEmail: userEmail,
    imagen: "",
  };

  const [propiedadActual, setPropiedadActual] = useState<Propiedad>(INITIAL_PROPIEDAD_STATE);
  const [regionId, setRegionId] = useState<number>(0);
  const [comunas, setComunas] = useState<ComunaDTO[]>([]);
  const [regiones, setRegiones] = useState<RegionDTO[]>([]);
  const [tipos, setTipos] = useState<TipoPropiedadDTO[]>([]);
  const comunasFiltradas = useMemo(() => {
    if (!regionId) return comunas;
    return comunas.filter((c) => c.regionId === regionId);
  }, [comunas, regionId]);

  // ----------------------------------------------------------------------
  // FUNCIÓN CRÍTICA: CARGA DE DATOS DESDE EL BACKEND
  // ----------------------------------------------------------------------
const fetchPropiedades = async () => {
    if (!userId || (!userRole)) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        let fetchedData: PropiedadDTO[] = [];

        if (scope === 'ALL') {
            fetchedData = await propiedadService.listar(true);
        } else if (scope === 'MINE') {
            fetchedData = await propiedadService.listarPorPropietario(Number(userId), true);
        } else if (userRole === ROLES.ADMIN) {
            fetchedData = await propiedadService.listar(true);
        } else if (userRole === ROLES.PROPIETARIO) {
            fetchedData = await propiedadService.listarPorPropietario(Number(userId), true);
        }

        const propiedadesConImagen: Propiedad[] = fetchedData.map(dto => ({
            ...dto,
            imagen: dto.fotos && dto.fotos.length > 0 
                    ? dto.fotos[0].url 
                    : '',
            estadoPropiedad: dto.estadoPropiedad,
            
            // Mapeamos los campos que cambiaron de nombre:
            titulo: dto.titulo,
            precioMensual: dto.precioMensual,
        })) as Propiedad[]; 


        setPropiedades(propiedadesConImagen); 
        
    } catch (err: any) {
        console.error("Error al cargar propiedades del backend:", err);
        setError("Error al cargar propiedades. Verifica que el Property Service (8082) esté activo.");
    } finally {
        setIsLoading(false);
    }
  };

  /**
   * Carga las listas de Comunas y Tipos al iniciar la aplicación.
   */
  const fetchListasMaestras = async () => {
    try {
        const [regionesData, comunasData, tiposData] = await Promise.all([
            regionService.listar(),
            comunaService.listar(),
            tipoService.listar()
        ]);
        setRegiones(regionesData);
        setComunas(comunasData);
        setTipos(tiposData);
    } catch (err) {
        console.error("Error al cargar listas de Comunas/Tipos:", err);
    }
  };


  // ----------------------------------------------------------------------
  // EFECTO DE MONTAJE Y REDIRECCIÓN (ACTUALIZADO)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (userRole && userRole !== ROLES.PROPIETARIO && userRole !== ROLES.ADMIN) {
      navigate("/");
      return;
    }
    
    // 1. Cargar datos maestros (Comunas y Tipos)
    fetchListasMaestras();
    
    // 2. Cargar propiedades del usuario/admin
    if (userId && (userRole === ROLES.PROPIETARIO || userRole === ROLES.ADMIN)) {
      fetchPropiedades();
    }
  }, [userRole, userId, navigate, scope]); 

  useEffect(() => {
    if (!notificacion) return;
    const id = window.setTimeout(() => setNotificacion(null), 2600);
    return () => window.clearTimeout(id);
  }, [notificacion]);
  
  
  // ----------------------------------------------------------------------
  // LÓGICA CRUD
  // ----------------------------------------------------------------------
  
  const handleAgregarPropiedad = () => {
    setModoEdicion(false);
    const nextRegionId = regiones.length > 0 ? regiones[0].id : 0;
    const firstComunaInRegion =
      nextRegionId ? comunas.find((c) => c.regionId === nextRegionId)?.id : undefined;
    const nextComunaId = firstComunaInRegion ?? (comunas.length > 0 ? comunas[0].id : 0);

    setPropiedadActual({
      ...INITIAL_PROPIEDAD_STATE,
      codigo: `AUTO-${Date.now()}`,
      propietarioId: userId ? Number(userId) : 0,
      propietarioEmail: userEmail,
      tipoId: tipos.length > 0 ? tipos[0].id : 0,
      comunaId: nextComunaId,
    });
    setRegionId(nextRegionId);
    setShowModal(true);
  };

  const handleEditarPropiedad = (propiedad: Propiedad) => {
    if (userRole !== ROLES.ADMIN && propiedad.propietarioEmail !== userEmail) {
      setNotificacion({ variant: "danger", message: "No tienes permisos para editar esta propiedad." });
      return;
    }
    setModoEdicion(true);
    setPropiedadActual(propiedad);
    const comuna = comunas.find(c => c.id === propiedad.comunaId);
    setRegionId(comuna?.regionId || 0);
    setShowModal(true);
  };

  const handleEliminarPropiedad = async (id: number) => {
    const propiedad = propiedades.find(p => p.id === id);
    
    if (userRole !== ROLES.ADMIN && propiedad?.propietarioEmail !== userEmail) {
      setNotificacion({ variant: "danger", message: "No tienes permisos para eliminar esta propiedad." });
      return;
    }
    try {
      setDeletingId(id);
      setConfirmDeleteId(null);
      await propiedadService.eliminar(id);
      setNotificacion({ variant: "success", message: "Propiedad eliminada exitosamente." });
      fetchPropiedades();
    } catch (err: any) {
      setNotificacion({
        variant: "danger",
        message: "Error al eliminar la propiedad: " + (err?.message || "Error desconocido"),
      });
      console.error("Error al eliminar:", err);
    } finally {
      setDeletingId(null);
    }
  };
  
  const handleGuardarPropiedad = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de campos de texto/precio
    if (!propiedadActual.titulo || !propiedadActual.direccion || propiedadActual.precioMensual <= 0) {
      setNotificacion({ variant: "danger", message: "Completa los campos obligatorios (Título, Dirección, Precio)." });
      return;
    }
    
    // Validaciones de campos de selección/numéricos
    if (propiedadActual.comunaId <= 0 || propiedadActual.tipoId <= 0) {
      setNotificacion({ variant: "danger", message: "Selecciona una Comuna y un Tipo de Propiedad válidos." });
      return;
    }
    
    if (propiedadActual.m2 <= 0 || propiedadActual.nHabit < 0 || propiedadActual.nBanos < 0) {
      setNotificacion({
        variant: "danger",
        message: "Verifica m² (> 0) y que habitaciones/baños sean valores válidos.",
      });
      return;
    }
   
   // CONSTRUCCIÓN DEL DTO COMPLETO: Usando valores del estado, sin valores mock.
    const dataToSend: CrearPropiedadRequest & { propietarioId: number } = {
        codigo: propiedadActual.codigo || 'W-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        titulo: propiedadActual.titulo,               // 🚨 Lo recuperamos
        descripcion: propiedadActual.descripcion || '', // 🚨 Lo recuperamos
        direccion: propiedadActual.direccion,         // 🚨 Lo recuperamos
        precioMensual: propiedadActual.precioMensual,
        
        // CAMPOS OBLIGATORIOS OBTENIDOS DEL ESTADO ACTUAL (DESDE EL FORMULARIO) 
        divisa: propiedadActual.divisa,
        m2: propiedadActual.m2,          
        nHabit: propiedadActual.nHabit,   
        nBanos: propiedadActual.nBanos,   
        petFriendly: propiedadActual.petFriendly,
        tipoId: propiedadActual.tipoId,    
        comunaId: propiedadActual.comunaId,  
        
        // Campo extra para el Backend
        propietarioId: Number(userId), 
    };

    try {
      let message: string;
      if (modoEdicion) {
        await propiedadService.actualizar(propiedadActual.id, dataToSend);
        message = "Propiedad actualizada exitosamente";
      } else {
        await propiedadService.crear(dataToSend);
        message = "Propiedad agregada exitosamente";
      }
      
      setShowModal(false);
      setNotificacion({ variant: "success", message });
      fetchPropiedades(); 
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido al guardar la propiedad.';
      setNotificacion({ variant: "danger", message: `Error al guardar la propiedad: ${errorMessage}` });
      console.error("Error al guardar:", err);
    }
  };
  
  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropiedadActual(prev => ({
          ...prev,
          imagen: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  // ----------------------------------------------------------------------
  // RENDERIZADO
  // ----------------------------------------------------------------------

  return (
    <div className="container my-5">
      {notificacion ? (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className={`alert alert-${notificacion.variant} shadow-sm mb-0`} role="alert">
            {notificacion.message}
          </div>
        </div>
      ) : null}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold">
          {userRole === ROLES.ADMIN ? "Gestión de Propiedades (Administrador)" : "Mis Propiedades"}
        </h1>
        {userRole === ROLES.PROPIETARIO && (
          <button className="btn btn-success" onClick={handleAgregarPropiedad}>
            Agregar Propiedad
          </button>
        )}
      </div>

      {userRole === ROLES.ADMIN && (
        <div className="alert alert-info">
          <strong>Modo Administrador:</strong> Puedes ver y gestionar todas las propiedades del sistema.
        </div>
      )}
      
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Pantalla de carga */}
      {isLoading ? (
        <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2">Cargando propiedades...</p>
        </div>
      ) : (
        // Contenido cargado
        propiedades.length === 0 ? (
          <div className="alert alert-warning text-center">
            {userRole === ROLES.ADMIN 
              ? "No hay propiedades en el sistema." 
              : "No tienes propiedades publicadas. ¡Agrega tu primera propiedad!"}
          </div>
        ) : (
          <div className="row g-4">
            {propiedades.map((propiedad) => (
              <div className="col-md-6 col-lg-4" key={propiedad.id}>
                <div className="card shadow-sm h-100">
                  {propiedad.imagen ? (
                    <img
                      src={propiedad.imagen}
                      alt={propiedad.titulo}
                      style={{ height: "200px", objectFit: "cover", width: "100%" }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light text-muted"
                      style={{ height: "200px" }}
                    >
                      Sin imagen
                    </div>
                  )}
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{propiedad.titulo}</h5>
                      {propiedad.estadoPropiedad ? (
                        <div className="mb-2">
                          <span
                            className={`badge ${
                              propiedad.estadoPropiedad === "ARRENDADA"
                                ? "bg-warning text-dark"
                                : propiedad.estadoPropiedad === "ACTIVA"
                                  ? "bg-success"
                                  : propiedad.estadoPropiedad === "EN_REVISION"
                                    ? "bg-info text-dark"
                                    : "bg-secondary"
                            }`}
                          >
                            {propiedad.estadoPropiedad}
                          </span>
                        </div>
                      ) : null}
                      <p className="card-text text-muted small">{propiedad.descripcion}</p>
                <p className="fw-bold text-success">
                  ${propiedad.precioMensual?.toLocaleString('es-CL') ?? '0'} {propiedad.divisa}
                </p>
                      <p className="text-muted small">{propiedad.direccion}</p>
                      
                      {userRole === ROLES.ADMIN && (
                        <p className="text-muted small">
                          <strong>Propietario:</strong> {propiedad.propietarioEmail}
                        </p>
                      )}

                      <div className="mt-auto d-flex gap-2">
                        {(userRole === ROLES.ADMIN || (userRole === ROLES.PROPIETARIO && propiedad.propietarioEmail === userEmail)) && (
                            <>
                                <button 
                                  className="btn btn-primary btn-sm flex-fill"
                                  onClick={() => handleEditarPropiedad(propiedad)}
                          disabled={deletingId === propiedad.id}
                                >
                                  Editar
                                </button>
                        {confirmDeleteId === propiedad.id ? (
                          <div className="d-flex gap-2 flex-fill">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm flex-fill"
                              onClick={() => handleEliminarPropiedad(propiedad.id)}
                              disabled={deletingId === propiedad.id}
                            >
                              {deletingId === propiedad.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                  ...
                                </>
                              ) : (
                                "Confirmar"
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm flex-fill"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletingId === propiedad.id}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm flex-fill"
                            onClick={() => setConfirmDeleteId(propiedad.id)}
                            disabled={deletingId === propiedad.id}
                          >
                            Eliminar
                          </button>
                        )}
                            </>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      
      {/* --- MODAL DE AGREGAR/EDITAR (ACTUALIZADO CON SELECTS) --- */}
      {showModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)", position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modoEdicion ? "Editar Propiedad" : "Agregar Nueva Propiedad"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleGuardarPropiedad}>
                <div className="modal-body">
                  
                  {/* TÍTULO/NOMBRE */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Título/Nombre de la Propiedad *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={propiedadActual.titulo}
                      onChange={(e) => setPropiedadActual({ ...propiedadActual, titulo: e.target.value })}
                      required
                    />
                  </div>

                  {/* DESCRIPCIÓN */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Descripción</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={propiedadActual.descripcion}
                      onChange={(e) => setPropiedadActual({ ...propiedadActual, descripcion: e.target.value })}
                    />
                  </div>

                  {/* DIRECCIÓN */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Dirección *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={propiedadActual.direccion}
                      onChange={(e) => setPropiedadActual({ ...propiedadActual, direccion: e.target.value })}
                      required
                    />
                  </div>

                  {/* PRECIO MENSUAL (Mapeado a precioMensual) */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Precio Mensual (CLP) *</label>
                    <input
                      type="number"
                      className="form-control"
                    value={propiedadActual.precioMensual === 0 ? "" : propiedadActual.precioMensual}
                    onChange={(e) =>
                        setPropiedadActual({
                          ...propiedadActual,
                          precioMensual: e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      min="0"
                      required
                    />
                  </div>
                  
                  {/* SELECTS: TIPO DE PROPIEDAD y REGIÓN */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Tipo de Propiedad *</label>
                      <select 
                        className="form-select"
                        value={propiedadActual.tipoId}
                        onChange={(e) => setPropiedadActual({ ...propiedadActual, tipoId: Number(e.target.value) })}
                        required
                      >
                        <option value={0} disabled>Seleccione un tipo</option>
                        {tipos.map((tipo) => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.nombre}
                          </option>
                        ))}
                      </select>
                      {tipos.length === 0 && <small className="text-danger">Cargando tipos...</small>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Región *</label>
                      <select
                        className="form-select"
                        value={regionId}
                        onChange={(e) => {
                          const nextRegionId = Number(e.target.value);
                          setRegionId(nextRegionId);
                          const first = comunas.find(c => c.regionId === nextRegionId);
                          if (first) {
                            setPropiedadActual({ ...propiedadActual, comunaId: first.id });
                          }
                        }}
                        required
                      >
                        <option value={0} disabled>Seleccione una región</option>
                        {regiones.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.nombre}
                          </option>
                        ))}
                      </select>
                      {regiones.length === 0 && <small className="text-danger">Cargando regiones...</small>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Comuna *</label>
                    <select
                      className="form-select"
                      value={propiedadActual.comunaId}
                      onChange={(e) => setPropiedadActual({ ...propiedadActual, comunaId: Number(e.target.value) })}
                      required
                    >
                      <option value={0} disabled>Seleccione una comuna</option>
                      {comunasFiltradas.map((comuna) => (
                        <option key={comuna.id} value={comuna.id}>
                          {comuna.nombre}
                        </option>
                      ))}
                    </select>
                    {comunasFiltradas.length === 0 && (
                      <small className="text-danger">Seleccione una región para ver comunas</small>
                    )}
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Metros Cuadrados (m2) *</label>
                      <input
                        type="number"
                        className="form-control"
                      value={propiedadActual.m2 === 0 ? "" : propiedadActual.m2}
                      onChange={(e) =>
                          setPropiedadActual({
                            ...propiedadActual,
                            m2: e.target.value === "" ? 0 : Number(e.target.value),
                          })
                        }
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Habitaciones</label>
                      <input
                        type="number"
                        className="form-control"
                      value={propiedadActual.nHabit === 0 ? "" : propiedadActual.nHabit}
                      onChange={(e) =>
                          setPropiedadActual({
                            ...propiedadActual,
                            nHabit: e.target.value === "" ? 0 : Number(e.target.value),
                          })
                        }
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Baños</label>
                      <input
                        type="number"
                        className="form-control"
                      value={propiedadActual.nBanos === 0 ? "" : propiedadActual.nBanos}
                      onChange={(e) =>
                          setPropiedadActual({
                            ...propiedadActual,
                            nBanos: e.target.value === "" ? 0 : Number(e.target.value),
                          })
                        }
                        min="0"
                        required
                      />
                    </div>
                  </div>


                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="petFriendlyCheck"
                      checked={propiedadActual.petFriendly}
                      onChange={(e) => setPropiedadActual({ ...propiedadActual, petFriendly: e.target.checked })}
                    />
                    <label className="form-check-label fw-bold" htmlFor="petFriendlyCheck">Permite Mascotas (Pet Friendly)</label>
                  </div>
                  
                  {/* IMAGEN */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Imagen Principal</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImagenChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-success">
                    {modoEdicion ? "Guardar Cambios" : "Agregar Propiedad"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GestionPropiedades;
