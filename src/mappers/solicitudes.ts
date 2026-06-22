import type { SolicitudArriendoDTO } from "../types";

export type SolicitudEstadoUI = "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

export interface SolicitudUI {
  id: number;
  usuarioId: number;
  propiedadId: number;
  estado: SolicitudEstadoUI;
  estadoRaw: string;
  fechaSolicitud: string;
  fechaSolicitudTimestamp: number;
  nombreSolicitante: string;
  inicialesSolicitante: string;
  emailSolicitante: string;
  telefonoSolicitante: string;
  rutSolicitante: string;
  rolSolicitante: string;
  estadoCuentaSolicitante: string;
  duocVipSolicitante?: boolean;
  puntosSolicitante?: number;
  codigoRefSolicitante: string;
  fechaRegistroSolicitante: string;
  fechaActualizacionSolicitante: string;
  tituloPropiedad: string;
  codigoPropiedad: string;
  direccionPropiedad: string;
  precioMensual: number | null;
  divisaPropiedad: "CLP" | "USD" | "EUR";
  fotoUrl: string;
  comunaPropiedad: string;
  tipoPropiedad: string;
  descripcionPropiedad: string;
  estadoPropiedad: string;
  fechaCreacionPropiedad: string;
  m2: number | null;
  nHabit: number | null;
  nBanos: number | null;
  petFriendly?: boolean;
  source: SolicitudArriendoDTO;
}

export const normalizeSolicitudEstado = (estado?: string): SolicitudEstadoUI => {
  const normalized = (estado || "").trim().toUpperCase();

  if (normalized === "ACEPTADA" || normalized === "APPROVED" || normalized === "ACCEPTED") {
    return "ACEPTADA";
  }

  if (normalized === "RECHAZADA" || normalized === "REJECTED" || normalized === "DENIED") {
    return "RECHAZADA";
  }

  return "PENDIENTE";
};

const buildApplicantName = (dto: SolicitudArriendoDTO) => {
  const usuario = dto.usuario;
  if (!usuario) return `Usuario #${dto.usuarioId}`;

  const fullName = [usuario.pnombre, usuario.snombre, usuario.papellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || `Usuario #${dto.usuarioId}`;
};

const buildApplicantInitials = (dto: SolicitudArriendoDTO) => {
  const usuario = dto.usuario;
  if (!usuario) return "U";

  const initials = `${usuario.pnombre?.charAt(0) || ""}${usuario.papellido?.charAt(0) || ""}`.toUpperCase();
  return initials || "U";
};

export const mapSolicitudApiToUI = (dto: SolicitudArriendoDTO): SolicitudUI => {
  const usuario = dto.usuario;
  const propiedad = dto.propiedad;
  const timestamp = new Date(dto.fechaSolicitud).getTime();

  return {
    id: dto.id,
    usuarioId: dto.usuarioId,
    propiedadId: dto.propiedadId,
    estado: normalizeSolicitudEstado(dto.estado),
    estadoRaw: dto.estado,
    fechaSolicitud: dto.fechaSolicitud,
    fechaSolicitudTimestamp: Number.isNaN(timestamp) ? 0 : timestamp,
    nombreSolicitante: buildApplicantName(dto),
    inicialesSolicitante: buildApplicantInitials(dto),
    emailSolicitante: usuario?.email || "",
    telefonoSolicitante: usuario?.ntelefono || "",
    rutSolicitante: usuario?.rut || "",
    rolSolicitante: usuario?.rol?.nombre || (usuario?.rolId ? `Rol #${usuario.rolId}` : ""),
    estadoCuentaSolicitante: usuario?.estado?.nombre || (usuario?.estadoId ? `Estado #${usuario.estadoId}` : ""),
    duocVipSolicitante: usuario?.duocVip,
    puntosSolicitante: usuario?.puntos,
    codigoRefSolicitante: usuario?.codigoRef || "",
    fechaRegistroSolicitante: usuario?.fcreacion || "",
    fechaActualizacionSolicitante: usuario?.factualizacion || "",
    tituloPropiedad: propiedad?.titulo || `Propiedad #${dto.propiedadId}`,
    codigoPropiedad: propiedad?.codigo || "",
    direccionPropiedad: propiedad?.direccion || "",
    precioMensual: typeof propiedad?.precioMensual === "number" ? propiedad.precioMensual : null,
    divisaPropiedad: propiedad?.divisa || "CLP",
    fotoUrl: propiedad?.fotos?.[0]?.url || "",
    comunaPropiedad: propiedad?.comuna?.nombre || "",
    tipoPropiedad: propiedad?.tipo?.nombre || (propiedad?.tipoId ? `Tipo #${propiedad.tipoId}` : ""),
    descripcionPropiedad: propiedad?.descripcion || "",
    estadoPropiedad: propiedad?.estadoPropiedad || "",
    fechaCreacionPropiedad: propiedad?.fcreacion || "",
    m2: typeof propiedad?.m2 === "number" ? propiedad.m2 : null,
    nHabit: typeof propiedad?.nHabit === "number" ? propiedad.nHabit : null,
    nBanos: typeof propiedad?.nBanos === "number" ? propiedad.nBanos : null,
    petFriendly: propiedad?.petFriendly,
    source: dto,
  };
};

export const mapSolicitudesApiToUI = (solicitudes: SolicitudArriendoDTO[]): SolicitudUI[] => {
  return solicitudes.map(mapSolicitudApiToUI);
};
