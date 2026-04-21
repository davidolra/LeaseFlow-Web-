import { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../components/AlertBanner'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { listPendingDocuments, updateDocumentStatus } from '../services/documents.service'
import { listUsers } from '../services/users.service'
import { formatDate } from '../utils/formatters'
import { minLen } from '../utils/validators'

export default function GestionDocumentos() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState(null)
  const [docs, setDocs] = useState([])
  const [users, setUsers] = useState([])

  const [approveOpen, setApproveOpen] = useState(false)
  const [approveLoading, setApproveLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectTouched, setRejectTouched] = useState(false)

  const userById = useMemo(() => {
    const map = new Map()
    for (const u of users) map.set(String(u.id), u)
    return map
  }, [users])

  useEffect(() => {
    reload()
  }, [])

  async function reload() {
    try {
      setLoading(true)
      setError('')
      const [pending, allUsers] = await Promise.all([listPendingDocuments(), listUsers()])
      setDocs(pending)
      setUsers(allUsers)
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los documentos.')
    } finally {
      setLoading(false)
    }
  }

  function openApprove(doc) {
    setBanner(null)
    setSelected(doc)
    setApproveOpen(true)
  }

  async function confirmApprove() {
    if (!selected) return
    try {
      setApproveLoading(true)
      setBanner(null)
      await updateDocumentStatus(selected.id, { estadoId: 2 })
      setApproveOpen(false)
      setSelected(null)
      setBanner({ variant: 'success', message: 'Documento aprobado.' })
      await reload()
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo aprobar.' })
    } finally {
      setApproveLoading(false)
    }
  }

  function openReject(doc) {
    setBanner(null)
    setSelected(doc)
    setRejectReason('')
    setRejectTouched(false)
    setRejectOpen(true)
  }

  const rejectError = useMemo(() => {
    if (!rejectTouched) return ''
    if (!minLen(rejectReason, 5)) return 'Motivo de rechazo mínimo 5 caracteres.'
    return ''
  }, [rejectReason, rejectTouched])

  async function confirmReject() {
    setRejectTouched(true)
    if (rejectError) return
    if (!selected) return
    try {
      setRejectLoading(true)
      setBanner(null)
      await updateDocumentStatus(selected.id, { estadoId: 3, observaciones: rejectReason.trim() })
      setRejectOpen(false)
      setSelected(null)
      setBanner({ variant: 'success', message: 'Documento rechazado.' })
      await reload()
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo rechazar.' })
    } finally {
      setRejectLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="h3 mb-3">Gestión Documentos</h1>

      {banner ? (
        <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
      ) : null}

      {loading ? <LoadingSpinner label="Cargando documentos pendientes..." /> : null}
      {error ? <AlertBanner variant="danger" message={error} /> : null}

      {!loading && !error && docs.length === 0 ? (
        <AlertBanner variant="secondary" message="No hay documentos pendientes." />
      ) : null}

      {!loading && !error && docs.length > 0 ? (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Usuario</th>
                  <th>Tipo</th>
                  <th>Archivo</th>
                  <th>Fecha subida</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => {
                  const u = userById.get(String(d.usuarioId))
                  const userLabel = u ? `${u.pnombre} ${u.papellido}` : `Usuario #${d.usuarioId}`
                  const email = u?.email || ''
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="fw-semibold">{userLabel}</div>
                        <div className="text-muted small">{email}</div>
                      </td>
                      <td>{d.tipoDocNombre}</td>
                      <td className="text-muted">{d.nombre}</td>
                      <td>{formatDate(d.fechaSubido)}</td>
                      <td>
                        <span className="badge text-bg-warning">{d.estadoNombre}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button className="btn btn-outline-success" onClick={() => openApprove(d)}>
                            Aprobar
                          </button>
                          <button className="btn btn-outline-danger" onClick={() => openReject(d)}>
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={approveOpen}
        title="Aprobar documento"
        message={`¿Confirmas aprobar "${selected?.tipoDocNombre || ''}"?`}
        confirmLabel="Aprobar"
        confirmVariant="success"
        onCancel={() => {
          if (approveLoading) return
          setApproveOpen(false)
          setSelected(null)
        }}
        onConfirm={confirmApprove}
        loading={approveLoading}
      />

      {rejectOpen ? (
        <>
          <div className="modal show" tabIndex="-1" role="dialog" style={{ display: 'block' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Rechazar documento</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => {
                      if (rejectLoading) return
                      setRejectOpen(false)
                      setSelected(null)
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <div className="fw-semibold">{selected?.tipoDocNombre}</div>
                    <div className="text-muted small">{selected?.nombre}</div>
                  </div>
                  <label className="form-label">Motivo de rechazo *</label>
                  <textarea
                    className={`form-control${rejectError ? ' is-invalid' : ''}`}
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    onBlur={() => setRejectTouched(true)}
                    disabled={rejectLoading}
                  />
                  {rejectError ? <div className="invalid-feedback">{rejectError}</div> : null}
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      if (rejectLoading) return
                      setRejectOpen(false)
                      setSelected(null)
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={confirmReject}
                    disabled={rejectLoading || Boolean(rejectError)}
                  >
                    {rejectLoading ? 'Rechazando...' : 'Rechazar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      ) : null}
    </div>
  )
}

