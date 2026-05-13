import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./paginas/home";
import Nosotros from "./paginas/nosotros";
import Contacto from "./paginas/contacto";
import Arrienda from "./paginas/arrienda";
import Login from "./paginas/login";
import Registro from "./paginas/Registro";
import Perfil from "./paginas/perfil";
import Valoraciones from "./paginas/Valoraciones";
import GestionPropiedades from "./paginas/GestionPropiedades";
import GestionDocumentos from "./paginas/GestionDocumentos"; 
import { ROLES } from "./config/apiConfig"; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";
  const userRole = localStorage.getItem("userRole") || "";

  const canManageProperties =
    isLoggedIn &&
    (userRole.toUpperCase() === ROLES.PROPIETARIO || userRole.toUpperCase() === ROLES.ADMIN);

  const canManageDocuments = isLoggedIn && userRole.toUpperCase() === ROLES.ADMIN;


  useEffect(() => {
    const storedLogin = localStorage.getItem("isLoggedIn");
    if (storedLogin === "true") setIsLoggedIn(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="app-container">
      <aside className="lf-sidebar" aria-label="Navegación">
        <div className="lf-sidebar-top">
          <Link to="/" className="lf-sidebar-brand" aria-label="Leaseflow">
            <span className="lf-mark">LF</span>
          </Link>
        </div>

        <nav className="lf-sidebar-nav">
          <Link to="/" className={`lf-sidebar-link${location.pathname === "/" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="lf-tooltip">Home</span>
          </Link>

          <Link to="/nosotros" className={`lf-sidebar-link${location.pathname === "/nosotros" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M12 17v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 8.2h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <span className="lf-tooltip">Nosotros</span>
          </Link>

          <Link to="/arrienda" className={`lf-sidebar-link${location.pathname === "/arrienda" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M4 21V9.5L12 3l8 6.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8.5 21v-6.5h7V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="lf-tooltip">Arrienda</span>
          </Link>

          <Link to="/contacto" className={`lf-sidebar-link${location.pathname === "/contacto" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.8" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="lf-tooltip">Contacto</span>
          </Link>

          {canManageProperties ? (
            <Link
              to="/gestion-propiedades"
              className={`lf-sidebar-link${location.pathname === "/gestion-propiedades" ? " active" : ""}`}
            >
              <span className="lf-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M4 21V9.5L12 3l8 6.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M7 21V12h4v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M13 13h4v4h-4z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <span className="lf-tooltip">Mis Propiedades</span>
            </Link>
          ) : null}

          {canManageDocuments ? (
            <Link
              to="/gestion-documentos"
              className={`lf-sidebar-link${location.pathname === "/gestion-documentos" ? " active" : ""}`}
            >
              <span className="lf-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M8.5 12h7M8.5 16h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lf-tooltip">Admin Documentos</span>
            </Link>
          ) : null}

          {isLoggedIn ? (
            <>
              <Link to="/perfil" className={`lf-sidebar-link${location.pathname === "/perfil" ? " active" : ""}`}>
                <span className="lf-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="lf-tooltip">Mi Perfil</span>
              </Link>

              <Link
                to="/valoraciones"
                className={`lf-sidebar-link${location.pathname === "/valoraciones" ? " active" : ""}`}
              >
                <span className="lf-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M12 3l2.7 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.9 6.5 20.3 7.6 14 3 9.6l6.3-.9L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="lf-tooltip">Valoraciones</span>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="lf-sidebar-bottom">
          {!isLoggedIn ? (
            <Link
              to="/login"
              className={`lf-sidebar-link${location.pathname === "/login" ? " active" : ""}`}
            >
              <span className="lf-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lf-tooltip">Iniciar sesión</span>
            </Link>
          ) : (
            <button type="button" className="lf-sidebar-link lf-sidebar-action" onClick={handleLogout}>
              <span className="lf-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M10 17H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M19 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lf-tooltip">Cerrar sesión</span>
            </button>
          )}
        </div>
      </aside>

      <div className="app-main">
        <div className={`main-content ${isHome ? "home-page" : ""}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/arrienda" element={<Arrienda />} />

            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro onRegisterSuccess={() => setIsLoggedIn(true)} />} />

            <Route path="/perfil" element={<Perfil />} />
            <Route path="/gestion-propiedades" element={<GestionPropiedades />} />
            <Route path="/valoraciones" element={<Valoraciones />} />
            
            <Route path="/gestion-documentos" element={<GestionDocumentos />} />
          </Routes>
        </div>

        <footer className="footer text-center py-3 text-white">
          © 2025 Leaseflow - Todos los derechos reservados
          <p className="mb-2">Síguenos en nuestras RRSS:</p>
          <div className="d-flex justify-content-center gap-3">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
