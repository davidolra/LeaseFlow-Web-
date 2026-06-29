/**
 * Review Service API Client
 * Microservicio: reviewService (puerto 8086)
 */

import API_CONFIG, { getAuthHeaders } from '../config/apiConfig';

export interface ReviewDTO {
  id?: number;
  usuarioId: number;
  propiedadId?: number;
  usuarioResenadoId?: number;
  puntaje: number;
  comentario?: string;
  tipoResenaId: number;
  fechaResena?: string;
  fechaBaneo?: string;
  estado?: string;
  tipoResenaNombre?: string;
}

export interface CrearReviewRequest {
  usuarioId: number;
  propiedadId: number;
  puntaje: number;
  comentario: string;
  tipoResenaId: number; // 1 = RESENA_PROPIEDAD
}

const BASE = API_CONFIG.REVIEW_SERVICE;

export const reviewService = {
  /**
   * Crea una nueva reseña de propiedad
   */
  async crear(data: CrearReviewRequest): Promise<ReviewDTO> {
    const res = await fetch(`${BASE}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? `Error ${res.status}`);
    }
    return res.json();
  },

  /**
   * Obtiene todas las reseñas de una propiedad
   */
  async obtenerPorPropiedad(propiedadId: number): Promise<ReviewDTO[]> {
    const res = await fetch(`${BASE}/reviews/propiedad/${propiedadId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  },

  /**
   * Obtiene todas las reseñas creadas por un usuario
   */
  async obtenerPorUsuario(usuarioId: number): Promise<ReviewDTO[]> {
    const res = await fetch(`${BASE}/reviews/usuario/${usuarioId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  },
};
