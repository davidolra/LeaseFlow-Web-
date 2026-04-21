import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../components/AlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { useSession } from '../app/useSession'
import { listDocumentsByUserId } from '../services/documents.service'
import { listProperties } from '../services/properties.service'
import { createRequest } from '../services/requests.service'
import { formatCurrency } from '../utils/formatters'

export default function Arrienda() {
  const { isLoggedIn, userId } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [props, setProps] = useState([])
  const [banner, setBanner] = useState(null)
  const [applyingId, setApplyingId] = useState(null)

  const isAuth = isLoggedIn === 'true'
  const userIdNum = useMemo(() => (userId ? Number(userId) : null), [userId])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await listProperties()
        if (!mounted) return
        setProps(data)
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

  async function handleApply(property) {
    setBanner(null)
    if (!isAuth) {
      setBanner({ variant: 'warning', message: 'Debes iniciar sesión para postular a una propiedad.' })
      return
    }

    try {
      setApplyingId(property.id)
      const docs = await listDocumentsByUserId(userIdNum)
      const hasApproved = docs.some((d) => d.estadoId === 2)
      if (!hasApproved) {
        setBanner({
          variant: 'danger',
          message: 'Debes tener al menos un documento aprobado para postular.',
        })
        return
      }
      await createRequest({ usuarioId: userIdNum, propiedadId: property.id })
      setBanner({ variant: 'success', message: 'Postulación creada correctamente (estado: PENDIENTE).' })
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo crear la postulación.' })
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <div className="container">
      <h1 className="h3 mb-3">Arrienda</h1>

      {banner ? (
        <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
      ) : null}

      {loading ? <LoadingSpinner label="Cargando catálogo..." /> : null}
      {error ? <AlertBanner variant="danger" message={error} /> : null}

      {!loading && !error && props.length === 0 ? (
        <AlertBanner variant="secondary" message="No hay propiedades disponibles por ahora." />
      ) : null}

      {!loading && !error && props.length > 0 ? (
        <div className="row g-4">
          {props.map((p) => (
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
                  <div className="mt-2 fw-semibold">{formatCurrency(p.precioMensual, p.divisa)}</div>
                  <div className="text-muted small">
                    {p.m2} m² · {p.nHabit} hab · {p.nBanos} baños · {p.petFriendly ? 'Pet Friendly' : 'Sin mascotas'}
                  </div>

                  <div className="mt-3 d-grid">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApply(p)}
                      disabled={applyingId === p.id}
                    >
                      {applyingId === p.id ? 'Postulando...' : 'Postular'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

