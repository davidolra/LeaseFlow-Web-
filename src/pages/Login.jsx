import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AlertBanner from '../components/AlertBanner'
import { login } from '../services/auth.service'
import { useSession } from '../app/useSession'
import { isValidEmail, isValidPassword } from '../utils/validators'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useSession()

  const [form, setForm] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState(null)

  const from = location.state?.from || '/'

  useEffect(() => {
    if (isLoggedIn === 'true') {
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, navigate])

  const errors = useMemo(() => {
    const next = {}
    if (!isValidEmail(form.email)) next.email = 'Email inválido.'
    if (!isValidPassword(form.password)) next.password = 'Contraseña mínima 8 caracteres.'
    return next
  }, [form])

  const hasErrors = Object.keys(errors).length > 0

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (hasErrors) return

    try {
      setLoading(true)
      setBanner(null)
      await login({ email: form.email, password: form.password })
      navigate(from, { replace: true })
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo iniciar sesión.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <h1 className="h3 mb-3">Iniciar sesión</h1>

          {banner ? (
            <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
          ) : null}

          <div className="card shadow-sm">
            <div className="card-body">
              <form className="d-grid gap-3" onSubmit={onSubmit}>
                <div>
                  <label className="form-label">Correo electrónico *</label>
                  <input
                    className={`form-control${touched.email && errors.email ? ' is-invalid' : ''}`}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="user@leaseflow.com"
                  />
                  {touched.email && errors.email ? (
                    <div className="invalid-feedback">{errors.email}</div>
                  ) : null}
                </div>

                <div>
                  <label className="form-label">Contraseña *</label>
                  <input
                    type="password"
                    className={`form-control${touched.password && errors.password ? ' is-invalid' : ''}`}
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="password123"
                  />
                  {touched.password && errors.password ? (
                    <div className="invalid-feedback">{errors.password}</div>
                  ) : null}
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading || hasErrors}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>

                <div className="text-muted small">
                  ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
                </div>

                <div className="text-muted small">
                  Usuarios demo: admin@leaseflow.com / prop@leaseflow.com / user@leaseflow.com (password123)
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

