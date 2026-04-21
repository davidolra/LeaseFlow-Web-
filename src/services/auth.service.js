import { delay } from './_sim'
import { clearSession, getSession, setSession } from '../utils/storage'
import { createUser, getUserByEmail } from './users.service'

export async function login({ email, password }) {
  await delay()
  const user = await getUserByEmail(email)
  if (!user || user.password !== password) {
    const err = new Error('Credenciales inválidas. Verifica tu correo y contraseña.')
    err.code = 'INVALID_CREDENTIALS'
    throw err
  }
  setSession({ userId: user.id, userEmail: user.email, userRole: user.rol })
  return user
}

export async function register(payload) {
  const user = await createUser(payload)
  setSession({ userId: user.id, userEmail: user.email, userRole: user.rol })
  return user
}

export async function logout() {
  await delay(150)
  clearSession()
}

export function session() {
  return getSession()
}

