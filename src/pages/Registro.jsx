import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertBanner from '../components/AlertBanner'
import { register } from '../services/auth.service'
import { createDocumentsForUser, DOC_TYPES } from '../services/documents.service'
import {
  isAdult,
  isValidChileanPhone,
  isValidEmail,
  isValidPassword,
  isValidRut,
  minLen,
} from '../utils/validators'

const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

export default function Registro() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState(null)
  const [touched, setTouched] = useState({})

  const [step1, setStep1] = useState({
    pnombre: '',
    snombre: '',
    papellido: '',
    rut: '',
    fnacimiento: '',
    email: '',
    ntelefono: '',
    password: '',
    password2: '',
    rol: 'ARRIENDATARIO',
    codigoRef: '',
  })

  const [docs, setDocs] = useState(() => {
    const initial = {}
    for (const t of DOC_TYPES) initial[t.id] = null
    return initial
  })

  const duocVip = useMemo(() => step1.email.trim().toLowerCase().endsWith('@duocuc.cl'), [step1.email])

  const step1Errors = useMemo(() => {
    const next = {}
    if (!minLen(step1.pnombre, 2)) next.pnombre = 'Primer nombre mínimo 2 caracteres.'
    if (!minLen(step1.papellido, 2)) next.papellido = 'Apellido mínimo 2 caracteres.'
    if (!isValidRut(step1.rut)) next.rut = 'RUT inválido (ej: 12345678-9).'
    if (!isAdult(step1.fnacimiento)) next.fnacimiento = 'Debes ser mayor de 18 años.'
    if (!isValidEmail(step1.email)) next.email = 'Email inválido.'
    if (!isValidChileanPhone(step1.ntelefono)) next.ntelefono = 'Teléfono inválido (ej: +56912345678).'
    if (!isValidPassword(step1.password)) next.password = 'Contraseña mínima 8 caracteres.'
    if (step1.password2 !== step1.password) next.password2 = 'Las contraseñas no coinciden.'
    if (step1.rol !== 'PROPIETARIO' && step1.rol !== 'ARRIENDATARIO') next.rol = 'Selecciona tipo de cuenta.'
    return next
  }, [step1])

  const step2Errors = useMemo(() => {
    const next = {}
    for (const t of DOC_TYPES) {
      if (!t.required) continue
      const file = docs[t.id]
      if (!file) next[`doc_${t.id}`] = `${t.name} es obligatorio.`
      if (file && !allowedDocTypes.includes(file.type)) next[`doc_${t.id}`] = `${t.name}: tipo no permitido.`
    }
    return next
  }, [docs])

  const canContinue = Object.keys(step1Errors).length === 0
  const canComplete = Object.keys(step2Errors).length === 0

  function setStep1Field(name, value) {
    setStep1((s) => ({ ...s, [name]: value }))
  }

  function setDoc(tipoId, file) {
    setDocs((d) => ({ ...d, [tipoId]: file || null }))
  }

  function touch(fields) {
    setTouched((t) => ({ ...t, ...fields }))
  }

  function goToStep2() {
    touch({
      pnombre: true,
      papellido: true,
      rut: true,
      fnacimiento: true,
      email: true,
      ntelefono: true,
      password: true,
      password2: true,
      rol: true,
    })
    if (!canContinue) return
    setStep(2)
    setBanner(null)
  }

  async function completeRegistration() {
    touch(Object.fromEntries(DOC_TYPES.filter((t) => t.required).map((t) => [`doc_${t.id}`, true])))
    if (!canComplete) return

    try {
      setLoading(true)
      setBanner(null)
      const user = await register({
        ...step1,
        duocVip,
        rol: step1.rol,
      })

      const filesByTipoId = {}
      for (const t of DOC_TYPES) {
        const file = docs[t.id]
        if (!file) continue
        filesByTipoId[t.id] = file.name
      }
      await createDocumentsForUser(user.id, filesByTipoId)

      navigate('/perfil', { replace: true })
    } catch (err) {
      setBanner({ variant: 'danger', message: err?.message || 'No se pudo completar el registro.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <h1 className="h3 mb-3">Registro</h1>

          {banner ? (
            <AlertBanner variant={banner.variant} message={banner.message} onClose={() => setBanner(null)} />
          ) : null}

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-semibold">Paso {step}/2</div>
                <div className="text-muted small">
                  {step === 1 ? 'Datos personales' : 'Documentos'}
                </div>
              </div>

              {step === 1 ? (
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Primer Nombre *</label>
                    <input
                      className={`form-control${touched.pnombre && step1Errors.pnombre ? ' is-invalid' : ''}`}
                      value={step1.pnombre}
                      onChange={(e) => setStep1Field('pnombre', e.target.value)}
                      onBlur={() => touch({ pnombre: true })}
                    />
                    {touched.pnombre && step1Errors.pnombre ? (
                      <div className="invalid-feedback">{step1Errors.pnombre}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Segundo Nombre (opcional)</label>
                    <input
                      className="form-control"
                      value={step1.snombre}
                      onChange={(e) => setStep1Field('snombre', e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Apellido *</label>
                    <input
                      className={`form-control${touched.papellido && step1Errors.papellido ? ' is-invalid' : ''}`}
                      value={step1.papellido}
                      onChange={(e) => setStep1Field('papellido', e.target.value)}
                      onBlur={() => touch({ papellido: true })}
                    />
                    {touched.papellido && step1Errors.papellido ? (
                      <div className="invalid-feedback">{step1Errors.papellido}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">RUT *</label>
                    <input
                      className={`form-control${touched.rut && step1Errors.rut ? ' is-invalid' : ''}`}
                      value={step1.rut}
                      onChange={(e) => setStep1Field('rut', e.target.value)}
                      onBlur={() => touch({ rut: true })}
                      placeholder="12345678-9"
                    />
                    {touched.rut && step1Errors.rut ? (
                      <div className="invalid-feedback">{step1Errors.rut}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Fecha de nacimiento *</label>
                    <input
                      type="date"
                      className={`form-control${touched.fnacimiento && step1Errors.fnacimiento ? ' is-invalid' : ''}`}
                      value={step1.fnacimiento}
                      onChange={(e) => setStep1Field('fnacimiento', e.target.value)}
                      onBlur={() => touch({ fnacimiento: true })}
                    />
                    {touched.fnacimiento && step1Errors.fnacimiento ? (
                      <div className="invalid-feedback">{step1Errors.fnacimiento}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Correo electrónico *</label>
                    <input
                      className={`form-control${touched.email && step1Errors.email ? ' is-invalid' : ''}`}
                      value={step1.email}
                      onChange={(e) => setStep1Field('email', e.target.value)}
                      onBlur={() => touch({ email: true })}
                      placeholder="tu@email.com"
                    />
                    {touched.email && step1Errors.email ? (
                      <div className="invalid-feedback">{step1Errors.email}</div>
                    ) : null}
                    {duocVip ? (
                      <div className="text-success small mt-1">Beneficio DuocVIP activado por correo @duocuc.cl</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Teléfono *</label>
                    <input
                      className={`form-control${touched.ntelefono && step1Errors.ntelefono ? ' is-invalid' : ''}`}
                      value={step1.ntelefono}
                      onChange={(e) => setStep1Field('ntelefono', e.target.value)}
                      onBlur={() => touch({ ntelefono: true })}
                      placeholder="+56912345678"
                    />
                    {touched.ntelefono && step1Errors.ntelefono ? (
                      <div className="invalid-feedback">{step1Errors.ntelefono}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Contraseña *</label>
                    <input
                      type="password"
                      className={`form-control${touched.password && step1Errors.password ? ' is-invalid' : ''}`}
                      value={step1.password}
                      onChange={(e) => setStep1Field('password', e.target.value)}
                      onBlur={() => touch({ password: true })}
                    />
                    {touched.password && step1Errors.password ? (
                      <div className="invalid-feedback">{step1Errors.password}</div>
                    ) : null}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Confirmar contraseña *</label>
                    <input
                      type="password"
                      className={`form-control${touched.password2 && step1Errors.password2 ? ' is-invalid' : ''}`}
                      value={step1.password2}
                      onChange={(e) => setStep1Field('password2', e.target.value)}
                      onBlur={() => touch({ password2: true })}
                    />
                    {touched.password2 && step1Errors.password2 ? (
                      <div className="invalid-feedback">{step1Errors.password2}</div>
                    ) : null}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Tipo de cuenta *</label>
                    <div className="d-flex gap-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="rol"
                          id="rolArr"
                          checked={step1.rol === 'ARRIENDATARIO'}
                          onChange={() => setStep1Field('rol', 'ARRIENDATARIO')}
                          onBlur={() => touch({ rol: true })}
                        />
                        <label className="form-check-label" htmlFor="rolArr">
                          ARRIENDATARIO
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="rol"
                          id="rolProp"
                          checked={step1.rol === 'PROPIETARIO'}
                          onChange={() => setStep1Field('rol', 'PROPIETARIO')}
                          onBlur={() => touch({ rol: true })}
                        />
                        <label className="form-check-label" htmlFor="rolProp">
                          PROPIETARIO
                        </label>
                      </div>
                    </div>
                    {touched.rol && step1Errors.rol ? (
                      <div className="text-danger small mt-1">{step1Errors.rol}</div>
                    ) : null}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Código de referido (opcional)</label>
                    <input
                      className="form-control"
                      value={step1.codigoRef}
                      onChange={(e) => setStep1Field('codigoRef', e.target.value)}
                    />
                  </div>

                  <div className="col-12 d-grid">
                    <button className="btn btn-primary" type="button" onClick={goToStep2} disabled={loading || !canContinue}>
                      Continuar a Documentos →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12">
                    <AlertBanner
                      variant="secondary"
                      message="Formatos permitidos: PDF, JPG, JPEG, PNG."
                    />
                  </div>

                  {DOC_TYPES.map((t) => {
                    const errKey = `doc_${t.id}`
                    const showError = Boolean(touched[errKey] && step2Errors[errKey])
                    return (
                      <div className="col-12 col-md-6" key={t.id}>
                        <label className="form-label">
                          {t.name} {t.required ? '*' : '(opcional)'}
                        </label>
                        <input
                          type="file"
                          className={`form-control${showError ? ' is-invalid' : ''}`}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setDoc(t.id, e.target.files?.[0] || null)}
                          onBlur={() => touch({ [errKey]: true })}
                        />
                        {showError ? <div className="invalid-feedback">{step2Errors[errKey]}</div> : null}
                        {docs[t.id] ? <div className="text-muted small mt-1">{docs[t.id].name}</div> : null}
                      </div>
                    )
                  })}

                  <div className="col-12 d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setBanner(null)
                      }}
                      disabled={loading}
                    >
                      ← Volver
                    </button>
                    <button
                      className="btn btn-primary ms-auto"
                      type="button"
                      onClick={completeRegistration}
                      disabled={loading || !canComplete}
                    >
                      {loading ? 'Registrando...' : 'Completar Registro'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

