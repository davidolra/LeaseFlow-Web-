import { useMemo, useState } from 'react'
import AlertBanner from '../components/AlertBanner'
import { sendContactMessage } from '../services/contact.service'
import { useSession } from '../app/useSession'
import { isValidEmail, isValidContactName, maxLen, minLen } from '../utils/validators'

export default function Contacto() {
  const { userEmail, userId } = useSession()
  const [form, setForm] = useState(() => ({
    nombre: '',
    email: userEmail || '',
    numeroTelefono: '',
    asunto: '',
    mensaje: '',
  }))
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState(null)

  const asuntoCount = form.asunto.length
  const mensajeCount = form.mensaje.length

  const errors = useMemo(() => {
    const next = {}
    if (!isValidContactName(form.nombre)) next.nombre = 'Nombre inválido (2-100, solo letras/espacios).'
    if (!isValidEmail(form.email)) next.email = 'Email inválido.'
    if (form.numeroTelefono && !maxLen(form.numeroTelefono, 20)) next.numeroTelefono = 'Máximo 20 caracteres.'
    if (!maxLen(form.asunto, 200)) next.asunto = 'Máximo 200 caracteres.'
    if (!minLen(form.asunto, 1)) next.asunto = 'Asunto es obligatorio.'
    if (!minLen(form.mensaje, 10)) next.mensaje = 'Mensaje mínimo 10 caracteres.'
    if (!maxLen(form.mensaje, 5000)) next.mensaje = 'Mensaje máximo 5000 caracteres.'
    return next
  }, [form])

  const hasErrors = Object.keys(errors).length > 0

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setTouched({ nombre: true, email: true, numeroTelefono: true, asunto: true, mensaje: true })
    if (hasErrors) return

    try {
      setLoading(true)
      setBanner(null)
      await sendContactMessage({
        ...form,
        usuarioId: userId ? Number(userId) : null,
      })
      setBanner({ variant: 'success', message: 'Mensaje enviado correctamente. Te contactaremos pronto.' })
      setForm({ nombre: '', email: userEmail || '', numeroTelefono: '', asunto: '', mensaje: '' })
      setTouched({})
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo enviar el mensaje.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <h1 className="h3 mb-3">Contacto</h1>

          {userEmail ? (
            <AlertBanner
              variant="info"
              message={`Detectamos una sesión activa. Usaremos ${userEmail} como correo sugerido.`}
            />
          ) : null}

          {banner ? (
            <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
          ) : null}

          <div className="card shadow-sm">
            <div className="card-body">
              <form className="row g-3" onSubmit={onSubmit}>
                <div className="col-12">
                  <label className="form-label">Nombre *</label>
                  <input
                    className={`form-control${touched.nombre && errors.nombre ? ' is-invalid' : ''}`}
                    value={form.nombre}
                    onChange={(e) => setField('nombre', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
                  />
                  {touched.nombre && errors.nombre ? (
                    <div className="invalid-feedback">{errors.nombre}</div>
                  ) : null}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Email *</label>
                  <input
                    className={`form-control${touched.email && errors.email ? ' is-invalid' : ''}`}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  />
                  {touched.email && errors.email ? (
                    <div className="invalid-feedback">{errors.email}</div>
                  ) : null}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Teléfono (opcional)</label>
                  <input
                    className={`form-control${touched.numeroTelefono && errors.numeroTelefono ? ' is-invalid' : ''}`}
                    value={form.numeroTelefono}
                    onChange={(e) => setField('numeroTelefono', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, numeroTelefono: true }))}
                    placeholder="+56912345678"
                  />
                  {touched.numeroTelefono && errors.numeroTelefono ? (
                    <div className="invalid-feedback">{errors.numeroTelefono}</div>
                  ) : null}
                </div>

                <div className="col-12">
                  <label className="form-label d-flex justify-content-between">
                    <span>Asunto *</span>
                    <span className="text-muted small">{asuntoCount}/200</span>
                  </label>
                  <input
                    className={`form-control${touched.asunto && errors.asunto ? ' is-invalid' : ''}`}
                    value={form.asunto}
                    onChange={(e) => setField('asunto', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, asunto: true }))}
                  />
                  {touched.asunto && errors.asunto ? (
                    <div className="invalid-feedback">{errors.asunto}</div>
                  ) : null}
                </div>

                <div className="col-12">
                  <label className="form-label d-flex justify-content-between">
                    <span>Mensaje *</span>
                    <span className="text-muted small">{mensajeCount}/5000</span>
                  </label>
                  <textarea
                    className={`form-control${touched.mensaje && errors.mensaje ? ' is-invalid' : ''}`}
                    rows={6}
                    value={form.mensaje}
                    onChange={(e) => setField('mensaje', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, mensaje: true }))}
                  />
                  {touched.mensaje && errors.mensaje ? (
                    <div className="invalid-feedback">{errors.mensaje}</div>
                  ) : null}
                </div>

                <div className="col-12 d-grid">
                  <button className="btn btn-primary" type="submit" disabled={loading || hasErrors}>
                    {loading ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
