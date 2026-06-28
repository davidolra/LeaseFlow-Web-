import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../api/userService";
import { documentoService } from "../api/documentService";
import type { CrearUsuarioRequest, CrearDocumentoRequest } from "../types";

// ─── Constante: largo máximo del campo `nombre` en documentService ───────────
// Si la columna en BD es VARCHAR(50), este valor debe ser ≤ 50.
// Ajústalo si el backend usa otro límite.
const MAX_NOMBRE_DOC = 100;

/** Trunca el nombre del archivo a MAX_NOMBRE_DOC caracteres conservando la extensión */
function truncarNombreArchivo(nombreOriginal: string): string {
  if (nombreOriginal.length <= MAX_NOMBRE_DOC) return nombreOriginal;
  const lastDot = nombreOriginal.lastIndexOf(".");
  if (lastDot === -1) return nombreOriginal.slice(0, MAX_NOMBRE_DOC);
  const ext = nombreOriginal.slice(lastDot);           // ej: ".pdf"
  const maxBase = MAX_NOMBRE_DOC - ext.length;
  return nombreOriginal.slice(0, maxBase) + ext;
}

type Rol = "PROPIETARIO" | "ARRIENDATARIO" | "";

interface DocumentoArchivo {
  nombre: string;
  archivo: File | null;
  tipoDocId: number;
  requerido: boolean;
}

type RegistroMode = "register" | "upload";

const Registro: React.FC<{ onRegisterSuccess?: () => void; mode?: RegistroMode }> = ({
  onRegisterSuccess,
  mode = "register",
}) => {
  const isUploadOnly = mode === "upload";

  const [pnombre, setPnombre] = useState("");
  const [snombre, setSnombre] = useState("");
  const [papellido, setPapellido] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [ntelefono, setNtelefono] = useState("");
  const [fnacimiento, setFnacimiento] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rol, setRol] = useState<Rol>("");
  const [codigoRef, setCodigoRef] = useState("");

  const initialDocumentos: Record<string, DocumentoArchivo> = {
    dni:          { nombre: "DNI / Cédula de Identidad",      archivo: null, tipoDocId: 1, requerido: !isUploadOnly },
    pasaporte:    { nombre: "Pasaporte",                       archivo: null, tipoDocId: 2, requerido: false },
    liquidacion:  { nombre: "Liquidación de Sueldo",           archivo: null, tipoDocId: 3, requerido: !isUploadOnly },
    antecedentes: { nombre: "Certificado de Antecedentes",     archivo: null, tipoDocId: 4, requerido: !isUploadOnly },
    afp:          { nombre: "Certificado AFP",                 archivo: null, tipoDocId: 5, requerido: !isUploadOnly },
    contrato:     { nombre: "Contrato de Trabajo",             archivo: null, tipoDocId: 6, requerido: false },
  };

  const [documentos, setDocumentos] = useState<Record<string, DocumentoArchivo>>(initialDocumentos);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(isUploadOnly ? 2 : 1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notificacion, setNotificacion] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  const currentUserId = useMemo(() => {
    const id = localStorage.getItem("userId");
    return id ? Number(id) : null;
  }, []);

  // ── Validaciones ─────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    if (isUploadOnly) return true;
    const newErrors: Record<string, string> = {};

    if (!pnombre.trim()) newErrors.pnombre = "El primer nombre es obligatorio";
    else if (pnombre.length < 2) newErrors.pnombre = "El nombre debe tener al menos 2 caracteres";

    if (!papellido.trim()) newErrors.papellido = "El apellido es obligatorio";
    else if (papellido.length < 2) newErrors.papellido = "El apellido debe tener al menos 2 caracteres";

    if (!rut.trim()) newErrors.rut = "El RUT es obligatorio";
    else if (!/^\d{7,8}-[\dkK]$/.test(rut)) newErrors.rut = "Formato de RUT inválido (ej: 12345678-9)";

    if (!email.trim()) newErrors.email = "El correo es obligatorio";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) newErrors.email = "Formato de correo inválido";

    if (!ntelefono.trim()) newErrors.ntelefono = "El teléfono es obligatorio";
    else if (!/^\+?569\d{8}$/.test(ntelefono.replace(/\s/g, "")))
      newErrors.ntelefono = "Formato de teléfono inválido (ej: +56912345678)";

    if (!fnacimiento) newErrors.fnacimiento = "La fecha de nacimiento es obligatoria";
    else {
      const birthDate = new Date(fnacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) newErrors.fnacimiento = "Debes ser mayor de 18 años para registrarte";
    }

    if (!password) newErrors.password = "La contraseña es obligatoria";
    else if (password.length < 8) newErrors.password = "La contraseña debe tener al menos 8 caracteres";

    if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";

    if (!rol) newErrors.rol = "Debe seleccionar un tipo de cuenta";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isUploadOnly) {
      const anySelected = Object.values(documentos).some((d) => Boolean(d.archivo));
      if (!anySelected) newErrors._form = "Selecciona al menos un archivo para enviar.";
    } else {
      Object.entries(documentos).forEach(([key, doc]) => {
        if (doc.requerido && !doc.archivo) newErrors[key] = `${doc.nombre} es obligatorio`;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleFileChange = (key: string, file: File | null) => {
    setDocumentos((prev) => ({ ...prev, [key]: { ...prev[key], archivo: file } }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    window.scrollTo(0, 0);
  };

  /**
   * Sube los documentos seleccionados para un userId dado.
   * Retorna { subidos, errores } para que el llamador decida qué hacer.
   */
  const subirDocumentos = async (
    userId: number
  ): Promise<{ subidos: number; errores: string[] }> => {
    const errores: string[] = [];
    let subidos = 0;

    for (const [key, doc] of Object.entries(documentos)) {
      if (!doc.archivo) continue;

      // FIX: truncar nombre para respetar el límite del campo en BD
      const nombreTruncado = truncarNombreArchivo(doc.archivo.name);

      const documentoRequest: CrearDocumentoRequest = {
        nombre: nombreTruncado,
        usuarioId: userId,
        estadoId: 1, // PENDIENTE
        tipoDocId: doc.tipoDocId,
      };

      try {
        await documentoService.crear(documentoRequest);
        subidos++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        errores.push(`${doc.nombre}: ${msg}`);
        console.error(`Error subiendo ${doc.nombre}:`, err);
      }
    }

    return { subidos, errores };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);

    try {
      // ── MODO SOLO SUBIDA (desde perfil / re-subida) ───────────────────────
      if (isUploadOnly) {
        // FIX: verificar sesión activa; si no hay userId redirigir a login
        if (localStorage.getItem("isLoggedIn") !== "true" || !currentUserId) {
          navigate("/login", {
            state: {
              flash: { variant: "danger", message: "Debes iniciar sesión para subir documentos." },
            },
          });
          return;
        }

        const { subidos, errores } = await subirDocumentos(currentUserId);

        if (errores.length > 0 && subidos === 0) {
          // Todos fallaron
          setNotificacion({
            variant: "danger",
            message: `No se pudo subir ningún documento. ${errores.join(" | ")}`,
          });
          return;
        }

        // Éxito parcial o total — navegar a perfil con flash apropiado
        navigate("/perfil", {
          state: {
            flash: {
              variant: errores.length === 0 ? "success" : "warning",
              message:
                errores.length === 0
                  ? `${subidos} documento(s) enviados a revisión correctamente.`
                  : `${subidos} documento(s) subidos. Fallaron: ${errores.join(" | ")}`,
            },
          },
        });
        return;
      }

      // ── MODO REGISTRO COMPLETO ────────────────────────────────────────────
      const isDuocVip = email.toLowerCase().endsWith("@duocuc.cl");
      const rolId = rol === "PROPIETARIO" ? 2 : 3;

      const nuevoUsuario: CrearUsuarioRequest = {
        pnombre: pnombre.trim(),
        snombre: snombre.trim() || undefined,
        papellido: papellido.trim(),
        fnacimiento,
        email: email.trim().toLowerCase(),
        rut: rut.trim(),
        ntelefono: ntelefono.trim(),
        clave: password,
        estadoId: 1,
        rolId,
        duocVip: isDuocVip ? 1 : 0,
        codigoRef: codigoRef.trim() || undefined,
      };

      const usuarioCreado = await userService.registrar(nuevoUsuario);

      // FIX: guardar sesión ANTES de subir documentos para que getAuthHeaders()
      // tenga userId/userRole disponibles en las llamadas a documentService
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", usuarioCreado.email);
      localStorage.setItem("userId", usuarioCreado.id.toString());
      localStorage.setItem("userRole", rol);

      const { subidos, errores } = await subirDocumentos(usuarioCreado.id);

      if (errores.length > 0) {
        console.warn("Algunos documentos no se pudieron subir:", errores);
      }

      navigate("/", {
        state: {
          flash: {
            variant: "success",
            message:
              `¡Registro exitoso! ${isDuocVip ? "Tienes 20% de descuento DuocUC. " : ""}` +
              (subidos > 0
                ? `${subidos} documento(s) en revisión.`
                : "Puedes subir tus documentos desde tu perfil.") +
              (errores.length > 0 ? ` (${errores.length} no se pudieron subir)` : ""),
          },
        },
      });

      onRegisterSuccess?.();
    } catch (error) {
      console.error("Error en el registro:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setNotificacion({
        variant: "danger",
        message: `Error al registrar: ${errorMessage}. Verifica que los microservicios estén corriendo.`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!notificacion) return;
    const id = window.setTimeout(() => setNotificacion(null), 4000);
    return () => window.clearTimeout(id);
  }, [notificacion]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="main-content d-flex justify-content-center align-items-center py-5"
      style={{ minHeight: "100vh" }}
    >
      {notificacion && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className={`alert alert-${notificacion.variant} shadow-sm mb-0`} role="alert">
            {notificacion.message}
          </div>
        </div>
      )}

      <div
        className="contact-form-container p-4 rounded shadow-lg"
        style={{ width: "100%", maxWidth: currentStep === 1 ? "600px" : "800px" }}
      >
        <h2 className="text-center mb-4 text-primary">
          {isUploadOnly
            ? "Subir documentos"
            : currentStep === 1
            ? "Crear cuenta - Paso 1/2"
            : "Crear cuenta - Paso 2/2"}
        </h2>

        {!isUploadOnly && (
          <div className="progress mb-4" style={{ height: "5px" }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${(currentStep / 2) * 100}%` }}
              aria-valuenow={currentStep}
              aria-valuemin={0}
              aria-valuemax={2}
            />
          </div>
        )}

        {/* ── PASO 1: DATOS PERSONALES ─────────────────────────────────────── */}
        {currentStep === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="login-form">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="pnombre" className="form-label fw-bold">Primer Nombre *</label>
                <input type="text" id="pnombre" className={`form-control ${errors.pnombre ? "is-invalid" : ""}`}
                  value={pnombre} onChange={(e) => setPnombre(e.target.value)} placeholder="Juan" />
                {errors.pnombre && <div className="invalid-feedback">{errors.pnombre}</div>}
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="snombre" className="form-label fw-bold">Segundo Nombre</label>
                <input type="text" id="snombre" className="form-control"
                  value={snombre} onChange={(e) => setSnombre(e.target.value)} placeholder="Carlos (opcional)" />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="papellido" className="form-label fw-bold">Apellido *</label>
              <input type="text" id="papellido" className={`form-control ${errors.papellido ? "is-invalid" : ""}`}
                value={papellido} onChange={(e) => setPapellido(e.target.value)} placeholder="Pérez" />
              {errors.papellido && <div className="invalid-feedback">{errors.papellido}</div>}
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="rut" className="form-label fw-bold">RUT *</label>
                <input type="text" id="rut" className={`form-control ${errors.rut ? "is-invalid" : ""}`}
                  value={rut} onChange={(e) => setRut(e.target.value)} placeholder="12345678-9" />
                {errors.rut && <div className="invalid-feedback">{errors.rut}</div>}
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="fnacimiento" className="form-label fw-bold">Fecha de Nacimiento *</label>
                <input type="date" id="fnacimiento" className={`form-control ${errors.fnacimiento ? "is-invalid" : ""}`}
                  value={fnacimiento} onChange={(e) => setFnacimiento(e.target.value)} />
                {errors.fnacimiento && <div className="invalid-feedback">{errors.fnacimiento}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-bold">Correo electrónico *</label>
              <input type="email" id="email" className={`form-control ${errors.email ? "is-invalid" : ""}`}
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              {email.toLowerCase().endsWith("@duocuc.cl") && (
                <div className="text-success mt-1">
                  <small>¡Correo DuocUC detectado! Tendrás 20% de descuento de por vida en comisiones</small>
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="ntelefono" className="form-label fw-bold">Teléfono *</label>
              <input type="tel" id="ntelefono" className={`form-control ${errors.ntelefono ? "is-invalid" : ""}`}
                value={ntelefono} onChange={(e) => setNtelefono(e.target.value)} placeholder="+56912345678" />
              {errors.ntelefono && <div className="invalid-feedback">{errors.ntelefono}</div>}
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="password" className="form-label fw-bold">Contraseña *</label>
                <input type="password" id="password" className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="confirmPassword" className="form-label fw-bold">Confirmar Contraseña *</label>
                <input type="password" id="confirmPassword" className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetir contraseña" />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label className={`form-label fw-bold ${errors.rol ? "text-danger" : ""}`}>Tipo de Cuenta *</label>
              <div className="d-flex justify-content-center gap-5">
                <div className="form-check">
                  <input className={`form-check-input ${errors.rol ? "is-invalid" : ""}`} type="radio"
                    name="rolOptions" id="rolPropietario" value="PROPIETARIO"
                    checked={rol === "PROPIETARIO"} onChange={(e) => setRol(e.target.value as Rol)} />
                  <label className="form-check-label" htmlFor="rolPropietario">Propietario</label>
                </div>
                <div className="form-check">
                  <input className={`form-check-input ${errors.rol ? "is-invalid" : ""}`} type="radio"
                    name="rolOptions" id="rolArrendatario" value="ARRIENDATARIO"
                    checked={rol === "ARRIENDATARIO"} onChange={(e) => setRol(e.target.value as Rol)} />
                  <label className="form-check-label" htmlFor="rolArrendatario">Arrendatario</label>
                </div>
              </div>
              {errors.rol && <div className="invalid-feedback d-block text-center mt-2">{errors.rol}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="codigoRef" className="form-label fw-bold">Código de Referido (opcional)</label>
              <input type="text" id="codigoRef" className="form-control"
                value={codigoRef} onChange={(e) => setCodigoRef(e.target.value)} placeholder="Código de referido" />
              <small className="text-muted">Si tienes un código de referido, ¡ambos ganan LeaseflowPoints!</small>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-3">
              Continuar a Documentos →
            </button>
          </form>
        )}

        {/* ── PASO 2: DOCUMENTOS ───────────────────────────────────────────── */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="alert alert-info mb-4">
              <strong>{isUploadOnly ? "Subir documentos" : "Carga de Documentos"}</strong>
              <p className="mb-0">
                {isUploadOnly
                  ? "Puedes subir documentos de forma individual. Los archivos se enviarán a revisión."
                  : "Sube los documentos requeridos. Los documentos marcados con (*) son obligatorios."}
              </p>
            </div>

            {errors._form && <div className="alert alert-danger">{errors._form}</div>}

            <div className="row">
              {Object.entries(documentos).map(([key, doc]) => (
                <div key={key} className="col-md-6 mb-3">
                  <label htmlFor={key} className="form-label fw-bold">
                    {doc.nombre} {doc.requerido && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="file"
                    id={key}
                    className={`form-control ${errors[key] ? "is-invalid" : ""}`}
                    onChange={(e) => handleFileChange(key, e.target.files?.[0] ?? null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {doc.archivo && (
                    <small className="text-success d-block mt-1">
                      ✓ {doc.archivo.name.length > 40
                          ? doc.archivo.name.slice(0, 37) + "..."
                          : doc.archivo.name}
                    </small>
                  )}
                  {errors[key] && <div className="invalid-feedback">{errors[key]}</div>}
                </div>
              ))}
            </div>

            <div className="alert alert-warning mt-3">
              <small>
                <strong>⚠️ Importante:</strong> Los documentos serán revisados por el equipo de Leaseflow.
                Recibirás una notificación cuando sean aprobados.
              </small>
            </div>

            <div className="d-flex gap-2 mt-4">
              {!isUploadOnly && (
                <button type="button" className="btn btn-outline-secondary flex-fill"
                  onClick={handlePreviousStep} disabled={loading}>
                  ← Volver
                </button>
              )}
              <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                {loading
                  ? isUploadOnly ? "Enviando..." : "Registrando..."
                  : isUploadOnly ? "Enviar documentos" : "Completar Registro"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Registro;
