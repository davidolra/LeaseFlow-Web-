import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUsuarios } from "../hooks/useUsuarios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showTestUsers, setShowTestUsers] = useState(false);
  
  const { login, loading, error } = useUsuarios();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevTranslate = html.getAttribute("translate");
    const hadNoTranslate = body.classList.contains("notranslate");

    html.setAttribute("translate", "no");
    body.classList.add("notranslate");

    return () => {
      if (prevTranslate === null) html.removeAttribute("translate");
      else html.setAttribute("translate", prevTranslate);

      if (!hadNoTranslate) body.classList.remove("notranslate");
    };
  }, []);

  const redirectPath = useMemo(() => {
    const state = location.state as any;
    const from = state?.from;
    if (typeof from === "string") return from;
    if (from?.pathname) return from.pathname;
    return "/";
  }, [location.state]);

  const uiError = errorMessage || error || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Por favor ingrese correo y contraseña");
      return;
    }

    try {
      const response = await login({ email, clave: password });

      // Verificar si la respuesta es válida
      if (!response) {
        setErrorMessage("Error: No se recibió respuesta del servidor");
        return;
      }

      if (response.success) {
        navigate(redirectPath, { replace: true });
      } else if (response.mensaje) {
        setErrorMessage(response.mensaje);
      } else {
        setErrorMessage("Credenciales inválidas");
      }
    } catch (err: any) {
      // Extraer mensaje de error más específico
      let errorMsg = "Error al conectar con el servidor";
      
      if (err.message) {
        // Si el mensaje contiene información sobre validación
        if (err.message.includes("8 caracteres")) {
          errorMsg = "La contraseña debe tener al menos 8 caracteres";
        } else if (err.message.includes("Failed to fetch")) {
          errorMsg = "No se pudo conectar con el servidor. Verifica que el backend esté corriendo en puerto 8081";
        } else if (err.message.includes("incorrectos") || err.message.includes("inválidas")) {
          errorMsg = "Email o contraseña incorrectos";
        } else {
          errorMsg = err.message;
        }
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      
      setErrorMessage(errorMsg);
    }
  };

  return (
    <div className="main-content d-flex justify-content-center align-items-center notranslate" translate="no" style={{ minHeight: "80vh" }}>
      <div className="nosotros-container lf-auth-card position-relative notranslate" translate="no">
        <button
          type="button"
          className="btn btn-link btn-sm position-absolute top-0 end-0 m-2 text-muted"
          aria-label="Ayuda"
          onClick={() => setShowTestUsers((v) => !v)}
          style={{ textDecoration: "none" }}
        >
          ?
        </button>
        <h2 className="text-center mb-4">Iniciar sesión</h2>

        {uiError && (
          <div className="alert alert-danger" role="alert">
            {uiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-bold">Correo electrónico</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-bold">Contraseña</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {showTestUsers ? (
          <div className="mt-3 p-3 lf-auth-tip">
            <small className="text-muted d-block mb-2"><strong>Usuarios de prueba:</strong></small>
            <pre className="mb-0 small" style={{ whiteSpace: "pre-wrap" }}>
da.olaver@duocuc.cl / Admin123!
fs.gonzalez@duocuc.cl / Miauu123!
juan.perez@email.com / Miau123!
maria.lopez@duoc.cl / Miau123!
pedro.ramirez@email.com / Miau123!
            </pre>
          </div>
        ) : null}

        <p className="text-center mt-3">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-primary">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
