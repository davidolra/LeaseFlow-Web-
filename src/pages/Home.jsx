import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AlertBanner from '../components/AlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { listProperties } from '../services/properties.service'
import { useSession } from '../app/useSession'
import { formatCurrency } from '../utils/formatters'

const carouselImages = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=60',
  'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=60',
  'https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=1600&q=60',
]

export default function Home() {
  const { isLoggedIn } = useSession()
  const [activeSlide, setActiveSlide] = useState(0)
  const [viewers, setViewers] = useState(12)
  const [banner, setBanner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState(null)
  const [error, setError] = useState('')

  const isAuth = isLoggedIn === 'true'
  const verMasHref = useMemo(() => (isAuth ? '/arrienda' : '/login'), [isAuth])

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((s) => (s + 1) % carouselImages.length)
    }, 4500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setViewers((v) => {
        const next = v + (Math.random() > 0.4 ? 1 : 0)
        return next > 99 ? 14 : next
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const props = await listProperties()
        if (!mounted) return
        setFeatured(props[0] || null)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'No se pudieron cargar las propiedades.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  function handleBuscar(e) {
    e.preventDefault()
    setBanner({ variant: 'info', message: 'Próximamente: búsqueda avanzada.' })
  }

  return (
    <div className="container">
      {banner ? (
        <AlertBanner
          variant={banner.variant}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      ) : null}

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm overflow-hidden">
            <div className="ratio ratio-21x9">
              <img
                src={carouselImages[activeSlide]}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
                alt="Leaseflow"
              />
            </div>
            <div className="card-body">
              <h1 className="h3 mb-2">Bienvenidos a Leaseflow</h1>
              <p className="text-muted mb-4">Arrendar es sencillo, directo y sin comisiones.</p>

              <form className="row g-2 align-items-end" onSubmit={handleBuscar}>
                <div className="col-12 col-md-4">
                  <label className="form-label">Ubicación</label>
                  <input className="form-control" placeholder="Ej: Santiago, Ñuñoa..." />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label">Tipo inmueble</label>
                  <select className="form-select" defaultValue="">
                    <option value="" disabled>
                      Seleccionar...
                    </option>
                    <option>Departamento</option>
                    <option>Casa</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label">Rango precio</label>
                  <select className="form-select" defaultValue="">
                    <option value="" disabled>
                      Seleccionar...
                    </option>
                    <option>$350.000 - $500.000</option>
                    <option>$500.000 - $700.000</option>
                    <option>$700.000 - $1.000.000</option>
                    <option>$1.000.000+</option>
                  </select>
                </div>
                <div className="col-12 col-md-2 d-grid">
                  <button className="btn btn-primary" type="submit">
                    Buscar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Beneficios</h2>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="border rounded p-3 h-100">
                    <div className="fw-semibold mb-1">Sin comisiones</div>
                    <div className="text-muted small">Transparente y simple desde el inicio.</div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="border rounded p-3 h-100">
                    <div className="fw-semibold mb-1">Documentos ordenados</div>
                    <div className="text-muted small">Sube y gestiona tu información fácilmente.</div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="border rounded p-3 h-100">
                    <div className="fw-semibold mb-1">Postulación rápida</div>
                    <div className="text-muted small">Aplica a propiedades en un par de clicks.</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-light border rounded d-flex justify-content-between align-items-center">
                <div className="fw-semibold">Personas están viendo esto ahora</div>
                <div className="badge text-bg-primary fs-6">{viewers}</div>
              </div>

              <div className="mt-4">
                <h2 className="h5 mb-3">Opiniones</h2>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="fw-semibold">Camila</div>
                        <div className="text-muted small mb-2">Arrendataria</div>
                        <div className="small">“Me encantó lo simple del flujo. Todo claro.”</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="fw-semibold">Rodrigo</div>
                        <div className="text-muted small mb-2">Propietario</div>
                        <div className="small">“Pude gestionar mis propiedades en minutos.”</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="fw-semibold">María José</div>
                        <div className="text-muted small mb-2">Arrendataria</div>
                        <div className="small">“Me ayudó a organizar documentos sin estrés.”</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Propiedad Destacada</h2>
              {loading ? <LoadingSpinner label="Cargando propiedad..." /> : null}
              {error ? <AlertBanner variant="danger" message={error} /> : null}
              {!loading && !error && !featured ? (
                <AlertBanner variant="secondary" message="No hay propiedades disponibles." />
              ) : null}

              {!loading && !error && featured ? (
                <>
                  <div className="ratio ratio-4x3 rounded overflow-hidden mb-3">
                    <img
                      src={featured.imagen}
                      alt={featured.titulo}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="fw-semibold">{featured.titulo}</div>
                  <div className="text-muted small">{featured.direccion}</div>
                  <div className="mt-2 fw-semibold">{formatCurrency(featured.precioMensual, featured.divisa)}</div>
                  <div className="mt-3 d-grid">
                    <Link className="btn btn-primary" to={verMasHref}>
                      Ver Más
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

