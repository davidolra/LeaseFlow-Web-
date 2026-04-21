const SESSION_KEYS = ['isLoggedIn', 'userId', 'userEmail', 'userRole']

export function getSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  const userId = localStorage.getItem('userId')
  const userEmail = localStorage.getItem('userEmail')
  const userRole = localStorage.getItem('userRole')

  return {
    isLoggedIn,
    userId,
    userEmail,
    userRole,
  }
}

export function setSession({ userId, userEmail, userRole }) {
  localStorage.setItem('isLoggedIn', 'true')
  localStorage.setItem('userId', String(userId))
  localStorage.setItem('userEmail', String(userEmail))
  localStorage.setItem('userRole', String(userRole))
  window.dispatchEvent(new Event('leaseflow:session'))
}

export function clearSession() {
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key)
  }
  window.dispatchEvent(new Event('leaseflow:session'))
}

export function subscribeSession(callback) {
  const handler = () => callback()
  window.addEventListener('leaseflow:session', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('leaseflow:session', handler)
    window.removeEventListener('storage', handler)
  }
}

export function readJson(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallbackValue
    return JSON.parse(raw)
  } catch {
    return fallbackValue
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

