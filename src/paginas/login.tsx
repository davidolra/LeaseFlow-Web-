import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUsuarios } from "../hooks/useUsuarios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const { login, loading, error } = useUsuarios();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Por favor ingrese correo y contraseña");
      return;
    }

    // Validación local de longitud de contraseña
    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      console.log("Intentando login con:", email);
      
      const response = await login({ email, clave: password });

      // Verificar si la respuesta es válida
      if (!response) {
        setErrorMessage("Error: No se recibió respuesta del servidor");
        return;
      }

      if (response.success) {
        console.log("Login exitoso, redirigiendo...");
        navigate("/");
        window.location.reload(); // Forzar recarga para actualizar navbar
      } else if (response.mensaje) {
        setErrorMessage(response.mensaje);
      } else {
        setErrorMessage("Credenciales inválidas");
      }
    } catch (err: any) {
      console.error("Error en login:", err);
      
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
    <div className="main-content d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="login-container p-4 bg-light rounded shadow" style={{ width: "100%", maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Iniciar sesión</h2>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
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
              minLength={8}
            />
            <small className="text-muted">La contraseña debe tener al menos 8 caracteres</small>
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

        <div className="mt-3 p-3 bg-info bg-opacity-10 border border-info rounded">
          <small className="text-muted d-block mb-2"><strong>Usuarios de prueba:</strong></small>
          <small className="d-block">
            • <strong>Usuario válido:</strong> juan.perez@email.com / password123
          </small>
          <small className="d-block text-danger mt-2">
            ⚠️ Nota: Las contraseñas deben tener mínimo 8 caracteres
          </small>
        </div>

        <p className="text-center mt-3">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-primary">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;