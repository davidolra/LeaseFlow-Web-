import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertBanner from '../components/AlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { useSession } from '../app/useSession'
import { getUserById, updateUser } from '../services/users.service'
import { listDocumentsByUserId } from '../services/documents.service'
import { initialsFromName, formatDate } from '../utils/formatters'
import { isValidChileanPhone, minLen } from '../utils/validators'

function roleBadge(rol) {
  if (rol === 'ADMIN') return 'text-bg-danger'
  if (rol === 'PROPIETARIO') return 'text-bg-primary'
  return 'text-bg-secondary'
}

function docStatusBadge(estadoId) {
  if (estadoId === 2) return 'text-bg-success'
  if (estadoId === 1) return 'text-bg-warning'
  if (estadoId === 3) return 'text-bg-danger'
  return 'text-bg-info'
}

export default function Perfil() {
  const { userId } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [docs, setDocs] = useState([])
  const [error, setError] = useState('')
  const [banner, setBanner] = useState(null)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({ pnombre: '', snombre: '', papellido: '', ntelefono: '' })
  const [touched, setTouched] = useState({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const u = await getUserById(userId)
        if (!u) throw new Error('No se encontró el usuario de la sesión.')
        const d = await listDocumentsByUserId(u.id)
        if (!mounted) return
        setUser(u)
        setDocs(d)
        setForm({
          pnombre: u.pnombre || '',
          snombre: u.snombre || '',
          papellido: u.papellido || '',
          ntelefono: u.ntelefono || '',
        })
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'No se pudo cargar el perfil.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [userId])

  const fullName = useMemo(() => {
    if (!user) return ''
    return [user.pnombre, user.snombre, user.papellido].filter(Boolean).join(' ')
  }, [user])

  const editErrors = useMemo(() => {
    const next = {}
    if (!minLen(form.pnombre, 2)) next.pnombre = 'Primer nombre mínimo 2 caracteres.'
    if (!minLen(form.papellido, 2)) next.papellido = 'Apellido mínimo 2 caracteres.'
    if (!isValidChileanPhone(form.ntelefono)) next.ntelefono = 'Teléfono inválido (ej: +56912345678).'
    return next
  }, [form])

  const hasEditErrors = Object.keys(editErrors).length > 0

  const docCounts = useMemo(() => {
    const counts = { aprobados: 0, pendientes: 0, rechazados: 0 }
    for (const d of docs) {
      if (d.estadoId === 2) counts.aprobados += 1
      else if (d.estadoId === 3) counts.rechazados += 1
      else counts.pendientes += 1
    }
    return counts
  }, [docs])

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function onSave() {
    setTouched({ pnombre: true, papellido: true, ntelefono: true })
    if (hasEditErrors || !user) return

    try {
      setSaving(true)
      setBanner(null)
      const updated = await updateUser(user.id, {
        pnombre: form.pnombre.trim(),
        snombre: form.snombre.trim(),
        papellido: form.papellido.trim(),
        ntelefono: form.ntelefono.trim(),
      })
      setUser(updated)
      setEdit(false)
      setBanner({ variant: 'success', message: 'Perfil actualizado correctamente.' })
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo guardar.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner label="Cargando perfil..." />

  if (error) {
    return (
      <div className="container">
        <AlertBanner variant="danger" message={error} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <AlertBanner variant="secondary" message="Perfil no disponible." />
      </div>
    )
  }

  return (
    <div className="container">
      {banner ? (
        <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
      ) : null}

      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 56, height: 56, fontWeight: 700 }}
          >
            {initialsFromName(fullName)}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="h5 mb-0">{fullName}</div>
              <span className={`badge ${roleBadge(user.rol)}`}>{user.rol}</span>
              {user.duocVip ? <span className="badge text-bg-success">DuocVIP</span> : null}
              <span className={`badge ${user.estado === 'ACTIVO' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {user.estado}
              </span>
            </div>
            <div className="text-muted">{user.email}</div>
          </div>
          <div className="text-end">
            <div className="text-muted small">LeaseflowPoints</div>
            <div className="h5 mb-0">{user.puntos}</div>
          </div>
          <div className="text-end">
            <div className="text-muted small">Código de Referido</div>
            <div className="h6 mb-0">{user.codigoRef}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Información personal</h2>
                {!edit ? (
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setEdit(true)}>
                    Editar
                  </button>
                ) : null}
              </div>

              {!edit ? (
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Primer Nombre</div>
                    <div className="fw-semibold">{user.pnombre}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Segundo Nombre</div>
                    <div className="fw-semibold">{user.snombre || '-'}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Apellido</div>
                    <div className="fw-semibold">{user.papellido}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">RUT</div>
                    <div className="fw-semibold">{user.rut}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Fecha Nacimiento</div>
                    <div className="fw-semibold">{formatDate(user.fnacimiento)}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Teléfono</div>
                    <div className="fw-semibold">{user.ntelefono}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Fecha Registro</div>
                    <div className="fw-semibold">{formatDate(user.fcreacion)}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Últ. actualización</div>
                    <div className="fw-semibold">{formatDate(user.factualizacion)}</div>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Primer Nombre *</label>
                    <input
                      className={`form-control${touched.pnombre && editErrors.pnombre ? ' is-invalid' : ''}`}
                      value={form.pnombre}
                      onChange={(e) => setField('pnombre', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, pnombre: true }))}
                    />
                    {touched.pnombre && editErrors.pnombre ? (
                      <div className="invalid-feedback">{editErrors.pnombre}</div>
                    ) : null}
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Segundo Nombre</label>
                    <input
                      className="form-control"
                      value={form.snombre}
                      onChange={(e) => setField('snombre', e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Apellido *</label>
                    <input
                      className={`form-control${touched.papellido && editErrors.papellido ? ' is-invalid' : ''}`}
                      value={form.papellido}
                      onChange={(e) => setField('papellido', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, papellido: true }))}
                    />
                    {touched.papellido && editErrors.papellido ? (
                      <div className="invalid-feedback">{editErrors.papellido}</div>
                    ) : null}
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Teléfono *</label>
                    <input
                      className={`form-control${touched.ntelefono && editErrors.ntelefono ? ' is-invalid' : ''}`}
                      value={form.ntelefono}
                      onChange={(e) => setField('ntelefono', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, ntelefono: true }))}
                      placeholder="+56912345678"
                    />
                    {touched.ntelefono && editErrors.ntelefono ? (
                      <div className="invalid-feedback">{editErrors.ntelefono}</div>
                    ) : null}
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setEdit(false)
                        setTouched({})
                        setForm({
                          pnombre: user.pnombre || '',
                          snombre: user.snombre || '',
                          papellido: user.papellido || '',
                          ntelefono: user.ntelefono || '',
                        })
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button className="btn btn-primary ms-auto" onClick={onSave} disabled={saving || hasEditErrors}>
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Mis Documentos</h2>
                <Link className="btn btn-outline-primary btn-sm" to="/registro">
                  ➕ Subir Documento
                </Link>
              </div>

              <div className="d-flex gap-2 mb-3">
                <span className="badge text-bg-success">Aprobados: {docCounts.aprobados}</span>
                <span className="badge text-bg-warning">Pendientes: {docCounts.pendientes}</span>
                <span className="badge text-bg-danger">Rechazados: {docCounts.rechazados}</span>
              </div>

              {docs.length === 0 ? (
                <AlertBanner variant="secondary" message="No tienes documentos registrados." />
              ) : (
                <div className="list-group">
                  {docs.map((d) => (
                    <div className="list-group-item" key={d.id}>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="fw-semibold">{d.tipoDocNombre}</div>
                          <div className="text-muted small">{d.nombre}</div>
                          <div className="text-muted small">Subido: {formatDate(d.fechaSubido)}</div>
                          {d.estadoId === 3 && d.observaciones ? (
                            <div className="text-danger small mt-1">{d.observaciones}</div>
                          ) : null}
                        </div>
                        <span className={`badge ${docStatusBadge(d.estadoId)}`}>{d.estadoNombre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

