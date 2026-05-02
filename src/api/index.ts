/**
 * API Services Index
 * Exporta todos los servicios de microservicios
 */

// User Service (8081)
export { 
  userService, 
  rolService, 
  estadoUsuarioService 
} from './userService';

// Property Service (8082)
export { 
  propiedadService, 
  comunaService, 
  regionService, 
  tipoService, 
  categoriaService 
} from './propertyService';

// Document Service (8083)
export { 
  documentoService, 
  estadoDocumentoService, 
  tipoDocumentoService 
} from './documentService';

// Application Service (8084)
export { 
  solicitudService, 
  registroService 
} from './applicationService';

// Re-export de tipos
export type {
  // User Service
  UsuarioDTO,
  RolDTO,
  EstadoUsuarioDTO,
  LoginRequest,
  LoginResponse,
  CrearUsuarioRequest,
  
  // Property Service
  PropiedadDTO,
  ComunaDTO,
  RegionDTO,
  TipoPropiedadDTO,
  CategoriaDTO,
  FotoDTO,
  CrearPropiedadRequest,
  PropiedadFilters,
  
  // Document Service
  DocumentoDTO,
  EstadoDocumentoDTO,
  TipoDocumentoDTO,
  CrearDocumentoRequest,
  DocumentoFilters,
  
  // Application Service
  SolicitudArriendoDTO,
  RegistroArriendoDTO,
  CrearSolicitudRequest,
  CrearRegistroRequest,
  SolicitudFilters,
  RegistroFilters,
  
  // Shared
  ErrorResponse,
} from '../types';
