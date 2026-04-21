export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidEmail(email) {
  if (!isNonEmptyString(email)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidRut(rut) {
  if (!isNonEmptyString(rut)) return false
  return /^\d{7,8}-[\dkK]$/.test(rut.trim())
}

export function isValidChileanPhone(phone) {
  if (!isNonEmptyString(phone)) return false
  return /^\+569\d{8}$/.test(phone.trim())
}

export function isValidPassword(password) {
  return isNonEmptyString(password) && password.trim().length >= 8
}

export function isAdult(dateString) {
  if (!isNonEmptyString(dateString)) return false
  const birth = new Date(dateString)
  if (Number.isNaN(birth.getTime())) return false

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 18
}

export function isValidContactName(name) {
  if (!isNonEmptyString(name)) return false
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 100) return false
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(trimmed)
}

export function maxLen(value, limit) {
  if (value == null) return true
  return String(value).length <= limit
}

export function minLen(value, limit) {
  if (!isNonEmptyString(value)) return false
  return value.trim().length >= limit
}

export function isAllowedFileType(file, allowedMimeTypes) {
  if (!file) return false
  if (!allowedMimeTypes || allowedMimeTypes.length === 0) return true
  return allowedMimeTypes.includes(file.type)
}

