import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../components/AlertBanner'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { useSession } from '../app/useSession'
import { createProperty, deleteProperty, listProperties, updateProperty } from '../services/properties.service'
import { fileToDataUrl } from '../services/_sim'

const tipos = [
  { id: 1, name: 'Departamento' },
  { id: 2, name: 'Casa' },
]

const comunas = [
  { id: 10, name: 'Santiago' },
  { id: 20, name: 'Maipú' },
  { id: 30, name: 'Providencia' },
  { id: 40, name: 'Ñuñoa' },
  { id: 50, name: 'Las Condes' },
  { id: 60, name: 'Lo Barnechea' },
  { id: 70, name: 'Quilicura' },
  { id: 80, name: 'San Joaquín' },
]

function emptyForm() {
  return {
    id: null,
    titulo: '',
    descripcion: '',
    direccion: '',
    precioMensual: '',
    divisa: 'CLP',
    tipoId: '',
    comunaId: '',
    m2: '',
    nHabit: '',
    nBanos: '',
    petFriendly: false,
    imagen: '',
    imageFile: null,
    imagePreview: '',
  }
}

export default function GestionPropiedades() {
  const { userId, userEmail, userRole } = useSession()
  const isAdmin = userRole === 'ADMIN'
  const ownerId = Number(userId)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState(null)
  const [items, setItems] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalSaving, setModalSaving] = useState(false)
  const [form, setForm] = useState(() => emptyForm())
  const [touched, setTouched] = useState({})

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const visibleItems = useMemo(() => {
    if (isAdmin) return items
    return items.filter((p) => Number(p.propietarioId) === ownerId)
  }, [items, isAdmin, ownerId])

  useEffect(() => {
    reload()
  }, [])

  async function reload() {
    try {
      setLoading(true)
      setError('')
      const data = await listProperties()
      setItems(data)
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar las propiedades.')
    } finally {
      setLoading(false)
    }
  }

  const formErrors = useMemo(() => {
    const next = {}
    if (!form.titulo.trim()) next.titulo = 'Título es obligatorio.'
    if (!form.direccion.trim()) next.direccion = 'Dirección es obligatoria.'
    const price = Number(form.precioMensual)
    if (!Number.isFinite(price) || price <= 0) next.precioMensual = 'Precio mensual debe ser mayor a 0.'
    if (!form.tipoId) next.tipoId = 'Tipo de propiedad es obligatorio.'
    if (!form.comunaId) next.comunaId = 'Comuna es obligatoria.'
    const m2 = Number(form.m2)
    if (!Number.isFinite(m2) || m2 <= 0) next.m2 = 'Metros cuadrados debe ser mayor a 0.'
    return next
  }, [form])

  const hasFormErrors = Object.keys(formErrors).length > 0

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function onPickImage(file) {
    if (!file) {
      setForm((f) => ({ ...f, imageFile: null, imagePreview: '' }))
      return
    }
    try {
      const preview = await fileToDataUrl(file)
      setForm((f) => ({ ...f, imageFile: file, imagePreview: preview }))
    } catch (e) {
      setBanner({ variant: 'danger', message: e?.message || 'No se pudo cargar la imagen.' })
    }
  }

  function openCreate() {
    setBanner(null)
    setTouched({})
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(item) {
    setBanner(null)
    setTouched({})
    setForm({
      id: item.id,
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      direccion: item.direccion || '',
      precioMensual: String(item.precioMensual ?? ''),
      divisa: item.divisa || 'CLP',
      tipoId: String(item.tipoId ?? ''),
      comunaId: String(item.comunaId ?? ''),
      m2: String(item.m2 ?? ''),
      nHabit: String(item.nHabit ?? ''),
      nBanos: String(item.nBanos ?? ''),
      petFriendly: Boolean(item.petFriendly),
      imagen: item.imagen || '',
      imageFile: null,
      imagePreview: item.imagen || '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setForm(emptyForm())
    setTouched({})
  }

  async function save() {
    setTouched({
      titulo: true,
      direccion: true,
      precioMensual: true,
      tipoId: true,
      comunaId: true,
      m2: true,
    })
    if (hasFormErrors) return

    try {
      setModalSaving(true)
      setBanner(null)

      const tipo = tipos.find((t) => String(t.id) === String(form.tipoId))
      const comuna = comunas.find((c) => String(c.id) === String(form.comunaId))

      const imagenFinal = form.imagePreview || form.imagen || ''

      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        direccion: form.direccion.trim(),
        precioMensual: Number(form.precioMensual),
        divisa: 'CLP',
        m2: Number(form.m2),
        nHabit: form.nHabit ? Number(form.nHabit) : 0,
        nBanos: form.nBanos ? Number(form.nBanos) : 0,
        petFriendly: Boolean(form.petFriendly),
        tipoId: Number(form.tipoId),
        tipoNombre: tipo?.name || '',
        comunaId: Number(form.comunaId),
        comunaNombre: comuna?.name || '',
        propietarioId: ownerId,
        propietarioEmail: userEmail || '',
        imagen: imagenFinal,
      }

      if (!form.id) {
        await createProperty(payload)
        setBanner({ variant: 'success', message: 'Propiedad creada correctamente.' })
      } else {
        await updateProperty(form.id, payload)
        setBanner({ variant: 'success', message: 'Propiedad actualizada correctamente.' })
      }

      closeModal()
      await reload()
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo guardar la propiedad.' })
    } finally {
      setModalSaving(false)
    }
  }

  function askDelete(item) {
    setToDelete(item)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!toDelete) return
    try {
      setConfirmLoading(true)
      setBanner(null)
      await deleteProperty(toDelete.id)
      setConfirmOpen(false)
      setToDelete(null)
      setBanner({ variant: 'success', message: 'Propiedad eliminada.' })
      await reload()
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo eliminar.' })
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Gestión Propiedades</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          Agregar
        </button>
      </div>

      {banner ? (
        <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
      ) : null}

      {loading ? <LoadingSpinner label="Cargando propiedades..." /> : null}
      {error ? <AlertBanner variant="danger" message={error} /> : null}

      {!loading && !error && visibleItems.length === 0 ? (
        <AlertBanner variant="secondary" message="No hay propiedades para mostrar." />
      ) : null}

      {!loading && !error && visibleItems.length > 0 ? (
        <div className="row g-4">
          {visibleItems.map((p) => (
            <div className="col-12 col-md-6 col-lg-4" key={p.id}>
              <div className="card shadow-sm h-100">
                <div className="ratio ratio-4x3">
                  <img
                    src={p.imagen}
                    alt={p.titulo}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="fw-semibold">{p.titulo}</div>
                  <div className="text-muted small">{p.direccion}</div>
                  {isAdmin ? <div className="text-muted small">Propietario: {p.propietarioEmail}</div> : null}
                  <div className="mt-3 d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => openEdit(p)}>
                      Editar
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => askDelete(p)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {modalOpen ? (
        <>
          <div className="modal show" tabIndex="-1" role="dialog" style={{ display: 'block' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{form.id ? 'Editar Propiedad' : 'Agregar Propiedad'}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeModal}
                    disabled={modalSaving}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Título/Nombre *</label>
                      <input
                        className={`form-control${touched.titulo && formErrors.titulo ? ' is-invalid' : ''}`}
                        value={form.titulo}
                        onChange={(e) => setField('titulo', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, titulo: true }))}
                      />
                      {touched.titulo && formErrors.titulo ? (
                        <div className="invalid-feedback">{formErrors.titulo}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Dirección *</label>
                      <input
                        className={`form-control${touched.direccion && formErrors.direccion ? ' is-invalid' : ''}`}
                        value={form.direccion}
                        onChange={(e) => setField('direccion', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, direccion: true }))}
                      />
                      {touched.direccion && formErrors.direccion ? (
                        <div className="invalid-feedback">{formErrors.direccion}</div>
                      ) : null}
                    </div>

                    <div className="col-12">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.descripcion}
                        onChange={(e) => setField('descripcion', e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Precio Mensual CLP *</label>
                      <input
                        className={`form-control${touched.precioMensual && formErrors.precioMensual ? ' is-invalid' : ''}`}
                        value={form.precioMensual}
                        onChange={(e) => setField('precioMensual', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, precioMensual: true }))}
                      />
                      {touched.precioMensual && formErrors.precioMensual ? (
                        <div className="invalid-feedback">{formErrors.precioMensual}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Tipo de Propiedad *</label>
                      <select
                        className={`form-select${touched.tipoId && formErrors.tipoId ? ' is-invalid' : ''}`}
                        value={form.tipoId}
                        onChange={(e) => setField('tipoId', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, tipoId: true }))}
                      >
                        <option value="">Seleccionar...</option>
                        {tipos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      {touched.tipoId && formErrors.tipoId ? (
                        <div className="invalid-feedback">{formErrors.tipoId}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Comuna *</label>
                      <select
                        className={`form-select${touched.comunaId && formErrors.comunaId ? ' is-invalid' : ''}`}
                        value={form.comunaId}
                        onChange={(e) => setField('comunaId', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, comunaId: true }))}
                      >
                        <option value="">Seleccionar...</option>
                        {comunas.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {touched.comunaId && formErrors.comunaId ? (
                        <div className="invalid-feedback">{formErrors.comunaId}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Metros cuadrados *</label>
                      <input
                        className={`form-control${touched.m2 && formErrors.m2 ? ' is-invalid' : ''}`}
                        value={form.m2}
                        onChange={(e) => setField('m2', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, m2: true }))}
                      />
                      {touched.m2 && formErrors.m2 ? <div className="invalid-feedback">{formErrors.m2}</div> : null}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Habitaciones</label>
                      <input
                        className="form-control"
                        value={form.nHabit}
                        onChange={(e) => setField('nHabit', e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Baños</label>
                      <input
                        className="form-control"
                        value={form.nBanos}
                        onChange={(e) => setField('nBanos', e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="petFriendly"
                          checked={form.petFriendly}
                          onChange={(e) => setField('petFriendly', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="petFriendly">
                          Permite mascotas
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Imagen principal</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                      />
                      {form.imagePreview ? (
                        <div className="mt-2 ratio ratio-16x9 rounded overflow-hidden border">
                          <img
                            src={form.imagePreview}
                            alt="Preview"
                            className="w-100 h-100"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={closeModal} disabled={modalSaving}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={save} disabled={modalSaving || hasFormErrors}>
                    {modalSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      ) : null}

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar propiedad"
        message={`¿Seguro que deseas eliminar "${toDelete?.titulo || ''}"?`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onCancel={() => {
          if (confirmLoading) return
          setConfirmOpen(false)
          setToDelete(null)
        }}
        onConfirm={confirmDelete}
        loading={confirmLoading}
      />
    </div>
  )
}

