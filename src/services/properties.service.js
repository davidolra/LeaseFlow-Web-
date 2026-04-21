import { delay } from './_sim'
import { nextId, readCollection, writeCollection } from './_mockDb'

export async function listProperties() {
  await delay()
  return readCollection('properties')
}

export async function getPropertyById(id) {
  await delay()
  const props = readCollection('properties')
  return props.find((p) => String(p.id) === String(id)) || null
}

export async function createProperty(payload) {
  await delay()
  const props = readCollection('properties')
  const id = nextId('properties')
  const codigo = payload.codigo || `PROP-${String(id).padStart(3, '0')}`
  const next = { id, codigo, ...payload }
  writeCollection('properties', [next, ...props])
  return next
}

export async function updateProperty(id, changes) {
  await delay()
  const props = readCollection('properties')
  const idx = props.findIndex((p) => String(p.id) === String(id))
  if (idx < 0) {
    const err = new Error('Propiedad no encontrada.')
    err.code = 'NOT_FOUND'
    throw err
  }
  const updated = [...props]
  updated[idx] = { ...updated[idx], ...changes }
  writeCollection('properties', updated)
  return updated[idx]
}

export async function deleteProperty(id) {
  await delay()
  const props = readCollection('properties')
  writeCollection(
    'properties',
    props.filter((p) => String(p.id) !== String(id)),
  )
}

