import { delay } from './_sim'
import { nextId, readCollection, writeCollection } from './_mockDb'
import { todayISO } from '../utils/formatters'

export async function listRequests() {
  await delay()
  return readCollection('requests')
}

export async function createRequest({ usuarioId, propiedadId }) {
  await delay()
  const reqs = readCollection('requests')
  const already = reqs.find(
    (r) =>
      String(r.usuarioId) === String(usuarioId) &&
      String(r.propiedadId) === String(propiedadId) &&
      r.estado === 'PENDIENTE',
  )
  if (already) {
    const err = new Error('Ya tienes una postulación pendiente para esta propiedad.')
    err.code = 'DUPLICATE'
    throw err
  }

  const next = {
    id: nextId('requests'),
    usuarioId: Number(usuarioId),
    propiedadId: Number(propiedadId),
    estado: 'PENDIENTE',
    fecha: todayISO(),
  }
  writeCollection('requests', [next, ...reqs])
  return next
}

