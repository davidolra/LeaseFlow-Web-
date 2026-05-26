/**
 * Tipos TypeScript para Leaseflow
 * Arquitectura de Microservicios
 * 
 * User Service (8081)
 * Property Service (8082)
 * Document Service (8083)
 * Application Service (8084)
 */

// ============================================
// USER SERVICE TYPES
// ============================================

export interface UsuarioDTO {
  id: number;
  ntelefono: string;
  papellido: string;
  pnombre: string;
  puntos: number;
  rut: string;
  snombre?: string;
  duocVip: boolean;
  codigoRef: string;
  clave: string;
  email: string;
  estadoId: number;
  fcreacion: string;
  factualizacion: string;
  fnacimiento: string;
  rolId: number;
  rol?: RolDTO;
  estado?: EstadoUsuarioDTO;
}

export interface RolDTO {
  id: number;
  nombre: string;
}

export interface EstadoUsuarioDTO {
  id: number;
  nombre: string;
}

export interface LoginRequest {
  email: string;
  clave: string;
}

export interface LoginResponse {
  success: boolean;
  mensaje: string;
  usuario?: UsuarioDTO;
}

export interface CrearUsuarioRequest {
  pnombre: string;
  snombre?: string;
  papellido: string;
  fnacimiento: string;
  email: string;
  rut: string;
  ntelefono: string;
  clave: string;
  estadoId: number;
  rolId: number;
  duocVip?: number;
  codigoRef?: string;
}

// ============================================
// PROPERTY SERVICE - TIPOS
// ============================================

export interface RegionDTO {
  id: number;
  nombre: string;
}

export interface ComunaDTO {
  id: number;
  nombre: string;
  regionId: number;
  region?: RegionDTO;
}

export interface TipoPropiedadDTO {
  id: number;
  nombre: string;
}

export interface CategoriaDTO {
  id: number;
  nombre: string;
}

export interface FotoDTO {
  id: number;
  url: string;
  propiedadId: number;
}

export interface PropiedadDTO {
  id: number;
  codigo: string;
  titulo: string;
  descripcion?: string;
  direccion: string;
  precioMensual: number;
  divisa: 'CLP' | 'USD' | 'EUR';
  m2: number;
  nHabit: number;
  nBanos: number;
  petFriendly: boolean;
  tipoId: number;
  comunaId: number;
  fcreacion?: string;
  estadoPropiedad?: 'ACTIVA' | 'INACTIVA' | 'EN_REVISION' | 'ARRENDADA';
  tipo?: TipoPropiedadDTO;
  comuna?: ComunaDTO;
  fotos?: FotoDTO[];
  categorias?: CategoriaDTO[];
}

export interface CrearPropiedadRequest {
  codigo: string;
  titulo: string;
  descripcion?: string;
  direccion: string;
  precioMensual: number;
  divisa: 'CLP' | 'USD' | 'EUR';
  m2: number;
  nHabit: number;
  nBanos: number;
  petFriendly: boolean;
  tipoId: number;
  comunaId: number;
}

// ============================================
// DOCUMENT SERVICE - TIPOS
// ============================================

export interface EstadoDocumentoDTO {
  id: number;
  nombre: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'EN_REVISION';
}

export interface TipoDocumentoDTO {
  id: number;
  nombre: 'DNI' | 'PASAPORTE' | 'LIQUIDACION_SUELDO' | 'CERTIFICADO_ANTECEDENTES' | 'CERTIFICADO_AFP' | 'CONTRATO_TRABAJO';
}

export interface DocumentoDTO {
  id: number;
  nombre: string;
  fechaSubido: string;
  usuarioId: number;
  estadoId: number;
  tipoDocId: number;
  estadoNombre?: string;
  tipoDocNombre?: string;
  usuario?: UsuarioDTO;
}

export interface CrearDocumentoRequest {
  nombre: string;
  usuarioId: number;
  estadoId: number;
  tipoDocId: number;
}

// ============================================
// APPLICATION SERVICE - TIPOS
// ============================================

export interface SolicitudArriendoDTO {
  id: number;
  usuarioId: number;
  propiedadId: number;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  fechaSolicitud: string;
  usuario?: UsuarioDTO;
  propiedad?: PropiedadDTO;
}

export interface CrearSolicitudRequest {
  usuarioId: number;
  propiedadId: number;
}

export interface RegistroArriendoDTO {
  id: number;
  solicitudId: number;
  fechaInicio: string;
  fechaFin?: string;
  montoMensual: number;
  activo: boolean;
  solicitud?: SolicitudArriendoDTO;
}

export interface CrearRegistroRequest {
  solicitudId: number;
  fechaInicio: string;
  fechaFin?: string;
  montoMensual: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  message_es?: string;
  validationErrors?: Record<string, string>;
}

export interface ErrorResponse {
  message: string;
  status?: number;
  message_es?: string;
}

// ============================================
// TIPOS DE FILTROS Y PARÁMETROS
// ============================================

export interface SolicitudFilters {
  usuarioId?: number;
  propiedadId?: number;
  estado?: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  includeDetails?: boolean;
}

export interface RegistroFilters {
  solicitudId?: number;
  includeDetails?: boolean;
}

export interface PropiedadFilters {
  tipoId?: number;
  comunaId?: number;
  minPrecio?: number;
  maxPrecio?: number;
  nHabit?: number;
  nBanos?: number;
  petFriendly?: boolean;
  includeDetails?: boolean;
  precioMin?: number;
  precioMax?: number;
  nHabitMin?: number;
}

export interface DocumentoFilters {
  usuarioId?: number;
  estadoId?: number;
  tipoDocId?: number;
  includeDetails?: boolean;
}

// ============================================
// CONTACT SERVICE - TIPOS
// ============================================

export interface MensajeContactoDTO {
  id?: number;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  numeroTelefono?: string;
  usuarioId?: number;
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO';
  fechaCreacion?: string;
  fechaActualizacion?: string;
  respuesta?: string;
  respondidoPor?: number;
  usuario?: UsuarioDTO;
}

export interface RespuestaMensajeDTO {
  respuesta: string;
  respondidoPor: number;
  nuevoEstado?: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO';
}

export interface EstadisticasContacto {
  total: number;
  pendientes: number;
  enProceso: number;
  resueltos: number;
}
