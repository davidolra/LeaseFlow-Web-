/**
 * Configuración centralizada de URLs de microservicios
 * Leaseflow - Arquitectura de Microservicios
 * 
 * IMPORTANTE: Todos los microservicios deben estar corriendo para que el frontend funcione correctamente
 */

const DEV_PROXY_BASES = {
  APPLICATION_SERVICE: '/applicationservice/api',
  USER_SERVICE: '/userservice/api',
  PROPERTY_SERVICE: '/propertyservice/api',
  DOCUMENT_SERVICE: '/documentservice/api',
  CONTACT_SERVICE: '/contactservice/api',
  REVIEW_SERVICE: '/reviewservice/api',
} as const;

export const API_CONFIG = {
  APPLICATION_SERVICE: import.meta.env.DEV ? DEV_PROXY_BASES.APPLICATION_SERVICE : 'https://applicationservice.calmbeach-1addaf50.brazilsouth.azurecontainerapps.io/api',
  USER_SERVICE: import.meta.env.DEV ? DEV_PROXY_BASES.USER_SERVICE : 'https://userservice.calmbeach-1addaf50.brazilsouth.azurecontainerapps.io/api',
  PROPERTY_SERVICE: import.meta.env.DEV ? DEV_PROXY_BASES.PROPERTY_SERVICE : 'https://propertyservice.calmbeach-1addaf50.brazilsouth.azurecontainerapps.io/api',
  DOCUMENT_SERVICE: import.meta.env.DEV ? DEV_PROXY_BASES.DOCUMENT_SERVICE : 'https://documentservice.calmbeach-1addaf50.brazilsouth.azurecontainerapps.io/api',
  CONTACT_SERVICE: import.meta.env.DEV ? DEV_PROXY_BASES.CONTACT_SERVICE : 'https://contactservice.calmbeach-1addaf50.brazilsouth.azurecontainerapps.io/api',
  REVIEW_SERVICE: import.meta.env.DEV ? DEV_PROXY_BASES.REVIEW_SERVICE : 'https://reviewservice.calmbeach-1addaf50.brazilsouth.azurecontainerapps.io/api',
  
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
