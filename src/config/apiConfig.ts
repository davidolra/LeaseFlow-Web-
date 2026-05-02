/**
 * Configuración centralizada de URLs de microservicios
 * Leaseflow - Arquitectura de Microservicios
 * 
 * IMPORTANTE: Todos los microservicios deben estar corriendo para que el frontend funcione correctamente
 */

export const API_CONFIG = {
  // URL base de los microservicios
  APPLICATION_SERVICE: 'http://localhost:8084/api',
  USER_SERVICE: 'http://localhost:8081/api',
  PROPERTY_SERVICE: 'http://localhost:8082/api',
  DOCUMENT_SERVICE: 'http://localhost:8083/api',
  CONTACT_SERVICE: 'http://localhost:8085/api',
  REVIEW_SERVICE: 'http://localhost:8086/api',
  
  // Timeouts (en milisegundos)
  TIMEOUT: 10000, // 10 segundos
  
  // Headers por defecto
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Estados de solicitud válidos
 */
export const ESTADOS_SOLICITUD = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
} as const;

/**
 * Roles de usuario válidos
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  PROPIETARIO: 'PROPIETARIO',
  ARRIENDATARIO: 'ARRIENDATARIO',
} as const;

/**
 * Estados de documento válidos
 */
export const ESTADOS_DOCUMENTO = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADO: 'ACEPTADO',
  RECHAZADO: 'RECHAZADO',
  EN_REVISION: 'EN_REVISION',
} as const;

/**
 * Tipos de documento válidos
 */
export const TIPOS_DOCUMENTO = {
  DNI: 'DNI',
  PASAPORTE: 'PASAPORTE',
  LIQUIDACION_SUELDO: 'LIQUIDACION_SUELDO',
  CERTIFICADO_ANTECEDENTES: 'CERTIFICADO_ANTECEDENTES',
  CERTIFICADO_AFP: 'CERTIFICADO_AFP',
  CONTRATO_TRABAJO: 'CONTRATO_TRABAJO',
} as const;

export default API_CONFIG;
