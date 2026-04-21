import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../components/AlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { createReview, listReviews } from '../services/reviews.service'
import { formatDate } from '../utils/formatters'

function Star({ filled, onEnter, onLeave, onClick }) {
  return (
    <span
      className={`rating-star ${filled ? 'text-warning' : 'text-muted'} cursor-pointer`}
      role="button"
      tabIndex={0}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
    >
      ★
    </span>
  )
}

export default function Valoraciones() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState(null)
  const [reviews, setReviews] = useState([])

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')

  const effectiveRating = useMemo(() => (hover > 0 ? hover : rating), [hover, rating])

  useEffect(() => {
    reload()
  }, [])

  async function reload() {
    try {
      setLoading(true)
      setError('')
      const data = await listReviews()
      setReviews(data)
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar las valoraciones.')
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    if (rating === 0) return
    try {
      setSaving(true)
      setBanner(null)
      await createReview({ rating, comentario })
      setBanner({ variant: 'success', message: 'Gracias por tu reseña.' })
      setRating(0)
      setHover(0)
      setComentario('')
      await reload()
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo guardar tu reseña.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <h1 className="h3 mb-3">Valoraciones</h1>

      {banner ? (
        <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
      ) : null}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="mb-2 fw-semibold">Tu puntuación</div>
          <div className="d-flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1
              return (
                <Star
                  key={value}
                  filled={effectiveRating >= value}
                  onEnter={() => setHover(value)}
                  onLeave={() => setHover(0)}
                  onClick={() => setRating(value)}
                />
              )
            })}
          </div>
          <label className="form-label">Comentario</label>
          <textarea
            className="form-control mb-3"
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            disabled={saving}
          />
          <button className="btn btn-primary" onClick={submit} disabled={saving || rating === 0}>
            {saving ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Cargando reseñas..." /> : null}
      {error ? <AlertBanner variant="danger" message={error} /> : null}

      {!loading && !error && reviews.length === 0 ? (
        <AlertBanner variant="secondary" message="Aún no hay valoraciones." />
      ) : null}

      {!loading && !error && reviews.length > 0 ? (
        <div className="row g-3">
          {reviews.map((r) => (
            <div className="col-12 col-md-6 col-lg-4" key={r.id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    <div className="text-muted small">{formatDate(r.fecha)}</div>
                  </div>
                  <div className="text-muted">{r.comentario}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

