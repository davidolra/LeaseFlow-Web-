import { delay } from './_sim'
import { nextId, readCollection, writeCollection } from './_mockDb'
import { todayISO } from '../utils/formatters'

export async function sendContactMessage(payload) {
  await delay()
  const contacts = readCollection('contacts')
  const next = {
    id: nextId('contacts'),
    nombre: payload.nombre,
    email: payload.email,
    numeroTelefono: payload.numeroTelefono || '',
    asunto: payload.asunto,
    mensaje: payload.mensaje,
    usuarioId: payload.usuarioId ?? null,
    fecha: todayISO(),
  }
  writeCollection('contacts', [next, ...contacts])
  return next
}

