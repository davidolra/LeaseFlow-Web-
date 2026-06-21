import React, { useState, useMemo } from "react";
import useContacto from "../hooks/useContacto";

// Tipado de la estructura de errores
interface Errores {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  telefono: string;
}

const Contacto: React.FC = () => {
  // Hook personalizado
  const { crearMensaje, loading } = useContacto();

  // Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estadoEnvio, setEstadoEnvio] = useState("");

  // Estado para los mensajes de error de validación
  const [errores, setErrores] = useState<Errores>({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
    telefono: "",
  });

  // Obtener usuarioId si está logueado (opcional)
  const usuarioId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail");

  // ---------------- LÓGICA DE VALIDACIÓN ----------------

  const validarFormulario = (
    currentNombre: string,
    currentEmail: string,
    currentAsunto: string,
    currentMensaje: string,
    currentTelefono: string
  ): Errores => {
    const nuevosErrores: Errores = {
      nombre: "",
      email: "",
      asunto: "",
      mensaje: "",
      telefono: "",
    };

    const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;

    if (!currentNombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (currentNombre.length < 2) {
      nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (currentNombre.length > 100) {
      nuevosErrores.nombre = "El nombre no puede exceder 100 caracteres";
    } else if (!soloLetrasRegex.test(currentNombre)) {
      nuevosErrores.nombre = "⚠️ Ingrese solo letras y espacios";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!currentEmail.trim()) {
      nuevosErrores.email = "El email es obligatorio";
    } else if (!emailRegex.test(currentEmail)) {
      nuevosErrores.email = "Formato de email no válido";
    }

    if (!currentAsunto.trim()) {
      nuevosErrores.asunto = "El asunto es obligatorio";
    } else if (currentAsunto.length > 200) {
      nuevosErrores.asunto = "El asunto no puede exceder 200 caracteres";
    }

    if (!currentMensaje.trim()) {
      nuevosErrores.mensaje = "El mensaje es obligatorio";
    } else if (currentMensaje.length < 10) {
      nuevosErrores.mensaje = "El mensaje debe tener al menos 10 caracteres";
    } else if (currentMensaje.length > 5000) {
      nuevosErrores.mensaje = "El mensaje no puede exceder 5000 caracteres";
    }

    if (currentTelefono.trim() && currentTelefono.length > 20) {
      nuevosErrores.telefono = "El teléfono no puede exceder 20 caracteres";
    }

    setErrores(nuevosErrores);
    return nuevosErrores;
  };

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
    campo: keyof Errores
  ) => {
    const limites: Partial<Record<keyof Errores, number>> = {
      asunto: 200,
      mensaje: 5000,
    };

    const max = limites[campo];
    const nextValue = max !== undefined ? value.slice(0, max) : value;

    setter(nextValue);

    const currentFormState = { nombre, email, asunto, mensaje, telefono };
    const updatedState = { ...currentFormState, [campo]: nextValue };

    validarFormulario(
      updatedState.nombre,
      updatedState.email,
      updatedState.asunto,
      updatedState.mensaje,
      updatedState.telefono
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const erroresValidacion = validarFormulario(nombre, email, asunto, mensaje, telefono);
    const hayErrores = Object.values(erroresValidacion).some((error) => error !== "");

    if (hayErrores) {
      setEstadoEnvio("❌ Por favor corrige los errores antes de enviar el formulario");
      return;
    }

    const mensajeData = {
      nombre: nombre.trim(),
      email: email.trim(),
      asunto: asunto.trim(),
      mensaje: mensaje.trim(),
      numeroTelefono: telefono.trim() || undefined,
      usuarioId: usuarioId ? parseInt(usuarioId) : undefined,
    };

    setEstadoEnvio("");

    console.log("📧 Enviando mensaje de contacto...", mensajeData);

    // Usar el hook
    const result = await crearMensaje(mensajeData);

    if (result.success) {
      console.log("✅ Mensaje enviado:", result.data);
      setEstadoEnvio(`✅ ¡Gracias ${nombre}! Tu mensaje ha sido enviado correctamente. Te responderemos pronto.`);

      // Limpiar formulario
      setNombre("");
      setEmail("");
      setAsunto("");
      setMensaje("");
      setTelefono("");
      setErrores({ nombre: "", email: "", asunto: "", mensaje: "", telefono: "" });
    } else {
      console.error("❌ Error:", result.error);
      
      if (result.error?.includes("límite")) {
        setEstadoEnvio(
          "⚠️ Has alcanzado el límite de mensajes pendientes. Por favor espera respuesta a tus mensajes anteriores."
        );
      } else if (result.error?.includes("conectar")) {
        setEstadoEnvio(
          "❌ No se pudo conectar con el servidor. Verifica que el Contact Service esté corriendo en puerto 8085."
        );
      } else {
        setEstadoEnvio(`❌ Error al enviar el mensaje: ${result.error}`);
      }
    }
  };

  const botonDeshabilitado = useMemo(() => {
    const camposObligatoriosLlenos =
      nombre.trim() && email.trim() && asunto.trim() && mensaje.trim();
    const hayErrores =
      !!errores.nombre ||
      !!errores.email ||
      !!errores.asunto ||
      !!errores.mensaje ||
      !!errores.telefono;

    return !camposObligatoriosLlenos || hayErrores || loading;
  }, [nombre, email, asunto, mensaje, telefono, errores, loading]);

  return (
    <div className="container">
      <div className="contact-form-container">
      <h1 className="fw-bold display-5 mb-3">Contacto 📨</h1>
      <p className="lead mb-4">
        Completa el formulario y nos pondremos en contacto contigo.
      </p>

      {userEmail && !email && (
        <div className="alert alert-info mb-3">
          <small>
            💡 Detectamos que estás logueado como <strong>{userEmail}</strong>
          </small>
        </div>
      )}

      <form onSubmit={handleSubmit} className="row g-3 notranslate" translate="no">
        <div className="col-12 col-md-6">
          <label htmlFor="nombre" className="form-label">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="nombre"
            className="form-control"
            value={nombre}
            onChange={(e) => handleInputChange(setNombre, e.target.value, "nombre")}
            placeholder="Juan Pérez"
            disabled={loading}
          />
          {errores.nombre && <p className="text-danger mt-1">{errores.nombre}</p>}
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="email" className="form-label">
            Email <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email || userEmail || ""}
            onChange={(e) => handleInputChange(setEmail, e.target.value, "email")}
            placeholder="tu@email.com"
            disabled={loading}
          />
          {errores.email && <p className="text-danger mt-1">{errores.email}</p>}
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="telefono" className="form-label">
            Teléfono <small className="text-muted">(opcional)</small>
          </label>
          <input
            type="tel"
            id="telefono"
            className="form-control"
            value={telefono}
            onChange={(e) => handleInputChange(setTelefono, e.target.value, "telefono")}
            placeholder="+56912345678"
            disabled={loading}
          />
          {errores.telefono && <p className="text-danger mt-1">{errores.telefono}</p>}
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="asunto" className="form-label">
            Asunto <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="asunto"
            className="form-control"
            value={asunto}
            onChange={(e) => handleInputChange(setAsunto, e.target.value, "asunto")}
            placeholder="Consulta sobre arriendo"
            disabled={loading}
            maxLength={200}
          />
          {errores.asunto && <p className="text-danger mt-1">{errores.asunto}</p>}
          <small className="text-muted">{asunto.length}/200 caracteres</small>
        </div>

        <div className="col-12">
          <label htmlFor="mensaje" className="form-label">
            Mensaje <span className="text-danger">*</span>
          </label>
          <textarea
            id="mensaje"
            className="form-control"
            value={mensaje}
            onChange={(e) => handleInputChange(setMensaje, e.target.value, "mensaje")}
            rows={6}
            placeholder="Escribe tu mensaje aquí... (mínimo 10 caracteres)"
            disabled={loading}
            maxLength={5000}
          ></textarea>
          {errores.mensaje && <p className="text-danger mt-1">{errores.mensaje}</p>}
          <small className="text-muted">{mensaje.length}/5000 caracteres</small>
        </div>

        <div className="col-12">
          <button type="submit" className="btn w-100" disabled={botonDeshabilitado}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Enviando...
              </>
            ) : (
              "Enviar Mensaje"
            )}
          </button>
        </div>
      </form>

      {estadoEnvio && (
        <div
          style={{
            marginTop: "1rem",
            padding: "10px",
            borderRadius: "6px",
            textAlign: "center",
            fontWeight: "600",
            backgroundColor: estadoEnvio.startsWith("✅") ? "#ede9fe" : "#fee2e2",
            color: estadoEnvio.startsWith("✅") ? "#0b1b3a" : "#991b1b",
            border: `1px solid ${estadoEnvio.startsWith("✅") ? "rgba(109, 61, 245, 0.45)" : "#fecaca"}`,
          }}
        >
          {estadoEnvio}
        </div>
      )}
      </div>
    </div>
  );
};

export default Contacto;
