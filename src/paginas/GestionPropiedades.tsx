import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


import { propiedadService, comunaService, tipoService } from "../api"; 
import { ROLES } from "../config/apiConfig"; 
import type { PropiedadDTO, CrearPropiedadRequest, ComunaDTO, TipoPropiedadDTO } from "../types";


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
}

const GestionPropiedades: React.FC = () => {
  const navigate = useNavigate();
  
  // Lectura del usuario y rol desde localStorage
  const userRole = localStorage.getItem("userRole") || "";
  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail") || "";

  // Estados
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [comunas, setComunas] = useState<ComunaDTO[]>([]);
  const [tipos, setTipos] = useState<TipoPropiedadDTO[]>([]);

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

        if (userRole === ROLES.ADMIN) {
            fetchedData = await propiedadService.listar(true); 
        } else if (userRole === ROLES.PROPIETARIO) {
            fetchedData = await propiedadService.listarPorPropietario(Number(userId), true);
        }

        const propiedadesConImagen: Propiedad[] = fetchedData.map(dto => ({
            ...dto,
            imagen: dto.fotos && dto.fotos.length > 0 
                    ? dto.fotos[0].url 
                    : '',
            
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
        const [comunasData, tiposData] = await Promise.all([
            comunaService.listar(),
            tipoService.listar()
        ]);
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
  }, [userRole, userId, navigate]); 
  
  
  // ----------------------------------------------------------------------
  // LÓGICA CRUD
  // ----------------------------------------------------------------------
  
  const handleAgregarPropiedad = () => {
    setModoEdicion(false);
    // Reinicia el estado con valores por defecto y código único
    setPropiedadActual({
      ...INITIAL_PROPIEDAD_STATE,
      codigo: 'AUTO-' + Date.now(), 
      propietarioId: userId ? Number(userId) : 0, 
      propietarioEmail: userEmail,
      tipoId: tipos.length > 0 ? tipos[0].id : 0, // Setea el primer tipo disponible si existe
      comunaId: comunas.length > 0 ? comunas[0].id : 0, // Setea la primera comuna disponible si existe
    });
    setShowModal(true);
  };

  const handleEditarPropiedad = (propiedad: Propiedad) => {
    if (userRole !== ROLES.ADMIN && propiedad.propietarioEmail !== userEmail) {
      alert("No tienes permisos para editar esta propiedad");
      return;
    }
    setModoEdicion(true);
    setPropiedadActual(propiedad);
    setShowModal(true);
  };

  const handleEliminarPropiedad = async (id: number) => {
    const propiedad = propiedades.find(p => p.id === id);
    
    if (userRole !== ROLES.ADMIN && propiedad?.propietarioEmail !== userEmail) {
      alert("No tienes permisos para eliminar esta propiedad");
      return;
    }

    if (window.confirm("¿Estás seguro de eliminar esta propiedad?")) {
      try {
        await propiedadService.eliminar(id); 
        alert("Propiedad eliminada exitosamente");
        fetchPropiedades(); 
      } catch (err: any) {
        alert("Error al eliminar la propiedad en el servidor: " + (err.message || "Error desconocido"));
        console.error("Error al eliminar:", err);
      }
    }
  };
  
  const handleGuardarPropiedad = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de campos de texto/precio
    if (!propiedadActual.titulo || !propiedadActual.direccion || propiedadActual.precioMensual <= 0) {
      alert("Por favor completa los campos obligatorios (Título, Dirección, Precio).");
      return;
    }
    
    // Validaciones de campos de selección/numéricos
    if (propiedadActual.comunaId <= 0 || propiedadActual.tipoId <= 0) {
      alert("Por favor, selecciona una Comuna y un Tipo de Propiedad válidos.");
      return;
    }
    
    if (propiedadActual.m2 <= 0 || propiedadActual.nHabit < 0 || propiedadActual.nBanos < 0) {
      alert("Verifica que los metros cuadrados (m2) sea mayor a cero, y el número de habitaciones y baños sean válidos.");
      return;
    }
   
    // CONSTRUCCIÓN DEL DTO COMPLETO: Usando valores del estado, sin valores mock.
    const dataToSend: CrearPropiedadRequest & { propietarioId: number } = {

        codigo: propiedadActual.codigo || 'WEB-' + Date.now(),
        titulo: propiedadActual.titulo,
        descripcion: propiedadActual.descripcion || '',
        direccion: propiedadActual.direccion,
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
      alert(message);
      fetchPropiedades(); 
      
    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido al guardar la propiedad.';
      alert(`Error al guardar la propiedad: ${errorMessage}`);
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
                  <div
                    className="d-flex align-items-center justify-content-center bg-light text-muted"
                    style={{ height: "200px" }}
                  >
                    Sin imagen
                  </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{propiedad.titulo}</h5>
                      <p className="card-text text-muted small">{propiedad.descripcion}</p>
                      <p className="fw-bold text-success">
                        ${propiedad.precioMensual.toLocaleString('es-CL')} {propiedad.divisa}
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
                                >
                                  Editar
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm flex-fill"
                                  onClick={() => handleEliminarPropiedad(propiedad.id)}
                                >
                                  Eliminar
                                </button>
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
                      value={propiedadActual.precioMensual}
                      onChange={(e) => setPropiedadActual({ ...propiedadActual, precioMensual: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                  
                  {/* 🚨 Fila de SELECTS: TIPO DE PROPIEDAD y COMUNA 🚨 */}
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
                      <label className="form-label fw-bold">Comuna *</label>
                      <select 
                        className="form-select"
                        value={propiedadActual.comunaId}
                        onChange={(e) => setPropiedadActual({ ...propiedadActual, comunaId: Number(e.target.value) })}
                        required
                      >
                        <option value={0} disabled>Seleccione una comuna</option>
                        {comunas.map((comuna) => (
                          <option key={comuna.id} value={comuna.id}>
                            {comuna.nombre}
                          </option>
                        ))}
                      </select>
                      {comunas.length === 0 && <small className="text-danger">Cargando comunas...</small>}
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Metros Cuadrados (m2) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={propiedadActual.m2}
                        onChange={(e) => setPropiedadActual({ ...propiedadActual, m2: Number(e.target.value) })}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Habitaciones</label>
                      <input
                        type="number"
                        className="form-control"
                        value={propiedadActual.nHabit}
                        onChange={(e) => setPropiedadActual({ ...propiedadActual, nHabit: Number(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Baños</label>
                      <input
                        type="number"
                        className="form-control"
                        value={propiedadActual.nBanos}
                        onChange={(e) => setPropiedadActual({ ...propiedadActual, nBanos: Number(e.target.value) })}
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
