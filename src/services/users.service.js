import { delay, randomCode } from './_sim'
import { nextId, readCollection, writeCollection } from './_mockDb'
import { todayISO } from '../utils/formatters'

export async function listUsers() {
  await delay()
  return readCollection('users')
}

export async function getUserById(id) {
  await delay()
  const users = readCollection('users')
  return users.find((u) => String(u.id) === String(id)) || null
}

export async function getUserByEmail(email) {
  await delay()
  const users = readCollection('users')
  return users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null
}

export async function createUser(payload) {
  await delay()
  const users = readCollection('users')
  const existing = users.find(
    (u) => u.email.toLowerCase() === String(payload.email).toLowerCase(),
  )
  if (existing) {
    const err = new Error('Ya existe un usuario con ese correo.')
    err.code = 'EMAIL_EXISTS'
    throw err
  }

  const id = nextId('users')
  const now = todayISO()
  const newUser = {
    id,
    pnombre: payload.pnombre,
    snombre: payload.snombre || '',
    papellido: payload.papellido,
    rut: payload.rut,
    fnacimiento: payload.fnacimiento,
    email: payload.email,
    ntelefono: payload.ntelefono,
    rol: payload.rol,
    estado: 'ACTIVO',
    puntos: 100,
    duocVip: Boolean(payload.duocVip),
    codigoRef: payload.codigoRef || randomCode(9),
    fcreacion: now,
    factualizacion: now,
    password: payload.password,
  }

  writeCollection('users', [newUser, ...users])
  return newUser
}

export async function updateUser(id, changes) {
  await delay()
  const users = readCollection('users')
  const idx = users.findIndex((u) => String(u.id) === String(id))
  if (idx < 0) {
    const err = new Error('Usuario no encontrado.')
    err.code = 'NOT_FOUND'
    throw err
  }

  const next = {
    ...users[idx],
    ...changes,
    factualizacion: todayISO(),
  }
  const updated = [...users]
  updated[idx] = next
  writeCollection('users', updated)
  return next
}

