import { delay } from './_sim'
import { nextId, readCollection, writeCollection } from './_mockDb'
import { todayISO } from '../utils/formatters'

export const DOCUMENT_STATUS = {
  1: 'PENDIENTE',
  2: 'ACEPTADO',
  3: 'RECHAZADO',
  4: 'EN_REVISION',
}

export const DOC_TYPES = [
  { id: 1, name: 'DNI / Cédula', required: true },
  { id: 2, name: 'Pasaporte', required: false },
  { id: 3, name: 'Liquidación de sueldo', required: true },
  { id: 4, name: 'Certificado antecedentes', required: true },
  { id: 5, name: 'Certificado AFP', required: true },
  { id: 6, name: 'Contrato de trabajo', required: false },
]

export async function listDocuments() {
  await delay()
  return readCollection('documents')
}

export async function listDocumentsByUserId(usuarioId) {
  await delay()
  const docs = readCollection('documents')
  return docs.filter((d) => String(d.usuarioId) === String(usuarioId))
}

export async function listPendingDocuments() {
  await delay()
  const docs = readCollection('documents')
  return docs.filter((d) => d.estadoId === 1 || d.estadoId === 4)
}

export async function createDocumentsForUser(usuarioId, filesByTipoId) {
  await delay()
  const docs = readCollection('documents')
  let nextDocs = [...docs]

  for (const tipo of DOC_TYPES) {
    const fileName = filesByTipoId?.[tipo.id]
    if (!fileName) continue
    const id = nextId('documents')
    nextDocs = [
      {
        id,
        usuarioId: Number(usuarioId),
        tipoDocId: tipo.id,
        tipoDocNombre: tipo.name,
        nombre: fileName,
        fechaSubido: todayISO(),
        estadoId: 1,
        estadoNombre: DOCUMENT_STATUS[1],
        observaciones: '',
      },
      ...nextDocs,
    ]
    writeCollection('documents', nextDocs)
  }

  return nextDocs.filter((d) => String(d.usuarioId) === String(usuarioId))
}

export async function updateDocumentStatus(documentId, { estadoId, observaciones = '' }) {
  await delay()
  const docs = readCollection('documents')
  const idx = docs.findIndex((d) => String(d.id) === String(documentId))
  if (idx < 0) {
    const err = new Error('Documento no encontrado.')
    err.code = 'NOT_FOUND'
    throw err
  }
  const next = {
    ...docs[idx],
    estadoId,
    estadoNombre: DOCUMENT_STATUS[estadoId] || docs[idx].estadoNombre,
    observaciones: estadoId === 3 ? observaciones : '',
  }
  const updated = [...docs]
  updated[idx] = next
  writeCollection('documents', updated)
  return next
}

