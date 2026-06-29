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
import AdminDashboard from "./paginas/AdminDashboard";
import GestionUsuarios from "./paginas/GestionUsuarios";
import GestionContacto from "./paginas/GestionContacto";
import MisSolicitudes from "./paginas/MisSolicitudes";
import SolicitudesRecibidas from "./paginas/SolicitudesRecibidas";
import MisArriendos from "./paginas/MisArriendos";
import { ROLES } from "./config/apiConfig"; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [flash, setFlash] = useState<{ variant: "success" | "danger"; message: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";
  const userRole = localStorage.getItem("userRole") || "";
  const normalizedRole = userRole.toUpperCase();
  const isAdmin = isLoggedIn && normalizedRole === ROLES.ADMIN;
  const isPropietario = isLoggedIn && normalizedRole === ROLES.PROPIETARIO;
  const isArrendatario = isLoggedIn && normalizedRole === ROLES.ARRIENDATARIO;


  useEffect(() => {
    const storedLogin = localStorage.getItem("isLoggedIn");
    if (storedLogin === "true") setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    window.addEventListener("lf-auth-changed", onAuthChanged);
    return () => window.removeEventListener("lf-auth-changed", onAuthChanged);
  }, []);

  useEffect(() => {
    const state = location.state as any;
    const nextFlash = state?.flash;
    if (nextFlash?.message) {
      setFlash(nextFlash);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(id);
  }, [flash]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("lf-auth-changed"));
    navigate("/");
  };

  return (
    <div className="app-container">
      {flash ? (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1085 }}>
          <div className={`alert alert-${flash.variant} shadow-sm mb-0`} role="alert">
            {flash.message}
          </div>
        </div>
      ) : null}
      <aside className="lf-sidebar" aria-label="Navegación">
        <div className="lf-sidebar-top">
          <Link to="/" className="lf-sidebar-brand" aria-label="Leaseflow" title="Leaseflow">
            <span className="lf-mark">LF</span>
          </Link>
        </div>

        <nav className="lf-sidebar-nav">
          <Link to="/" title="Home" className={`lf-sidebar-link${location.pathname === "/" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="lf-tooltip">
              <span className="lf-tooltip-title">Home</span>
              <span className="lf-tooltip-sub">/</span>
            </span>
          </Link>

          <Link to="/nosotros" title="Nosotros" className={`lf-sidebar-link${location.pathname === "/nosotros" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M12 17v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 8.2h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <span className="lf-tooltip">
              <span className="lf-tooltip-title">Nosotros</span>
              <span className="lf-tooltip-sub">/nosotros</span>
            </span>
          </Link>

          <Link to="/arrienda" title="Arrienda" className={`lf-sidebar-link${location.pathname === "/arrienda" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M10.5 18.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="lf-tooltip">
              <span className="lf-tooltip-title">Arrienda</span>
              <span className="lf-tooltip-sub">/arrienda</span>
            </span>
          </Link>

          <Link to="/contacto" title="Contacto" className={`lf-sidebar-link${location.pathname === "/contacto" ? " active" : ""}`}>
            <span className="lf-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.8" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="lf-tooltip">
              <span className="lf-tooltip-title">Contacto</span>
              <span className="lf-tooltip-sub">/contacto</span>
            </span>
          </Link>

          {isAdmin ? (
            <>
              <details className="lf-nav-group" data-group="admin">
                <summary className="lf-sidebar-link lf-nav-group-summary" title="Opciones Admin">
                  <span className="lf-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path d="M12 2 20 6v6c0 5-3.5 9.2-8 10-4.5-.8-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="lf-tooltip">Opciones Admin</span>
                </summary>
                <div className="lf-nav-group-items">
                  <Link to="/admin" title="Dashboard" className={`lf-sidebar-link${location.pathname === "/admin" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Dashboard</span>
                      <span className="lf-tooltip-sub">/admin</span>
                    </span>
                  </Link>

                  <Link to="/gestor-propiedades" title="Gestor Propiedades" className={`lf-sidebar-link${location.pathname === "/gestor-propiedades" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 21V8l8-5 8 5v13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M7 21V12h4v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M14 12h3v3h-3zM14 16h3v3h-3z" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Gestor Propiedades</span>
                      <span className="lf-tooltip-sub">/gestor-propiedades</span>
                    </span>
                  </Link>

                  <Link to="/gestor-solicitudes" title="Gestor Solicitudes" className={`lf-sidebar-link${location.pathname === "/gestor-solicitudes" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 7h16v14H4z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M7 3h10v4H7z" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Gestor Solicitudes</span>
                      <span className="lf-tooltip-sub">/gestor-solicitudes</span>
                    </span>
                  </Link>

                  <Link to="/gestion-documentos" title="Gestión de Documentos" className={`lf-sidebar-link${location.pathname === "/gestion-documentos" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M8.5 12h7M8.5 16h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Gestión de Documentos</span>
                      <span className="lf-tooltip-sub">/gestion-documentos</span>
                    </span>
                  </Link>

                  <Link to="/gestion-usuarios" title="Gestión de Usuarios" className={`lf-sidebar-link${location.pathname === "/gestion-usuarios" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M19 8.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <path d="M21 6.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Gestión de Usuarios</span>
                      <span className="lf-tooltip-sub">/gestion-usuarios</span>
                    </span>
                  </Link>

                  <Link to="/gestion-contacto" title="Gestión de Contacto" className={`lf-sidebar-link${location.pathname === "/gestion-contacto" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M19 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Gestión de Contacto</span>
                      <span className="lf-tooltip-sub">/gestion-contacto</span>
                    </span>
                  </Link>
                </div>
              </details>

              <details className="lf-nav-group" data-group="propietario">
                <summary className="lf-sidebar-link lf-nav-group-summary" title="Opciones Propietario">
                  <span className="lf-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path d="M4 21V9.5L12 3l8 6.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M8.5 21v-6.5h7V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="lf-tooltip">Opciones Propietario</span>
                </summary>
                <div className="lf-nav-group-items">
                  <Link to="/mis-propiedades" title="Mis Propiedades" className={`lf-sidebar-link${location.pathname === "/mis-propiedades" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 21V9.5L12 3l8 6.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M7 21V12h4v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Mis Propiedades</span>
                      <span className="lf-tooltip-sub">/mis-propiedades</span>
                    </span>
                  </Link>

                  <Link to="/solicitudes-recibidas" title="Solicitudes" className={`lf-sidebar-link${location.pathname === "/solicitudes-recibidas" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 7h16v14H4z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M7 3h10v4H7z" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Solicitudes</span>
                      <span className="lf-tooltip-sub">/solicitudes-recibidas</span>
                    </span>
                  </Link>
                </div>
              </details>

              <details className="lf-nav-group" data-group="arrendatario">
                <summary className="lf-sidebar-link lf-nav-group-summary" title="Opciones Arrendatario">
                  <span className="lf-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M9 8h6M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="lf-tooltip">Opciones Arrendatario</span>
                </summary>
                <div className="lf-nav-group-items">
                  <Link to="/mis-solicitudes" title="Mis Solicitudes" className={`lf-sidebar-link${location.pathname === "/mis-solicitudes" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M9 8h6M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Mis Solicitudes</span>
                      <span className="lf-tooltip-sub">/mis-solicitudes</span>
                    </span>
                  </Link>

                  <Link to="/mis-arriendos" title="Mis Arriendos" className={`lf-sidebar-link${location.pathname === "/mis-arriendos" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M7 10h10v11H7z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M9 10V7a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Mis Arriendos</span>
                      <span className="lf-tooltip-sub">/mis-arriendos</span>
                    </span>
                  </Link>
                </div>
              </details>
            </>
          ) : (
            <>
              {isPropietario ? (
                <>
                  <Link to="/mis-propiedades" title="Mis Propiedades" className={`lf-sidebar-link${location.pathname === "/mis-propiedades" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 21V9.5L12 3l8 6.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M7 21V12h4v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Mis Propiedades</span>
                      <span className="lf-tooltip-sub">/mis-propiedades</span>
                    </span>
                  </Link>
                  <Link to="/solicitudes-recibidas" title="Solicitudes" className={`lf-sidebar-link${location.pathname === "/solicitudes-recibidas" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M4 7h16v14H4z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M7 3h10v4H7z" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Solicitudes</span>
                      <span className="lf-tooltip-sub">/solicitudes-recibidas</span>
                    </span>
                  </Link>
                </>
              ) : null}

              {isArrendatario ? (
                <>
                  <Link to="/mis-solicitudes" title="Mis Solicitudes" className={`lf-sidebar-link${location.pathname === "/mis-solicitudes" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M9 8h6M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Mis Solicitudes</span>
                      <span className="lf-tooltip-sub">/mis-solicitudes</span>
                    </span>
                  </Link>
                  <Link to="/mis-arriendos" title="Mis Arriendos" className={`lf-sidebar-link${location.pathname === "/mis-arriendos" ? " active" : ""}`}>
                    <span className="lf-ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M7 10h10v11H7z" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M9 10V7a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="lf-tooltip">
                      <span className="lf-tooltip-title">Mis Arriendos</span>
                      <span className="lf-tooltip-sub">/mis-arriendos</span>
                    </span>
                  </Link>
                </>
              ) : null}
            </>
          )}

          {isLoggedIn ? (
            <>
              <Link to="/perfil" title="Mi Perfil" className={`lf-sidebar-link${location.pathname === "/perfil" ? " active" : ""}`}>
                <span className="lf-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="lf-tooltip">
                  <span className="lf-tooltip-title">Mi Perfil</span>
                  <span className="lf-tooltip-sub">/perfil</span>
                </span>
              </Link>

              <Link
                to="/valoraciones"
                title="Valoraciones"
                className={`lf-sidebar-link${location.pathname === "/valoraciones" ? " active" : ""}`}
              >
                <span className="lf-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M12 3l2.7 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.9 6.5 20.3 7.6 14 3 9.6l6.3-.9L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="lf-tooltip">
                  <span className="lf-tooltip-title">Valoraciones</span>
                  <span className="lf-tooltip-sub">/valoraciones</span>
                </span>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="lf-sidebar-bottom">
          {!isLoggedIn ? (
            <Link
              to="/login"
              title="Iniciar sesión"
              className={`lf-sidebar-link${location.pathname === "/login" ? " active" : ""}`}
            >
              <span className="lf-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lf-tooltip">
                <span className="lf-tooltip-title">Iniciar sesión</span>
                <span className="lf-tooltip-sub">/login</span>
              </span>
            </Link>
          ) : (
            <button type="button" title="Cerrar sesión" className="lf-sidebar-link lf-sidebar-action" onClick={handleLogout}>
              <span className="lf-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <path d="M10 17H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M19 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lf-tooltip">
                <span className="lf-tooltip-title">Cerrar sesión</span>
                <span className="lf-tooltip-sub">Acción</span>
              </span>
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
            <Route path="/subir-documentos" element={<Registro mode="upload" />} />

            <Route path="/perfil" element={<Perfil />} />
            <Route path="/mis-propiedades" element={<GestionPropiedades scope={isAdmin ? "MINE" : "AUTO"} />} />
            <Route path="/gestor-propiedades" element={<GestionPropiedades scope="ALL" />} />
            <Route path="/gestion-propiedades" element={<GestionPropiedades />} />
            <Route path="/valoraciones" element={<Valoraciones />} />
            
            <Route path="/gestion-documentos" element={<GestionDocumentos />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
            <Route path="/gestion-contacto" element={<GestionContacto />} />
            <Route path="/mis-solicitudes" element={<MisSolicitudes />} />
            <Route path="/solicitudes-recibidas" element={<SolicitudesRecibidas scope="MINE" />} />
            <Route path="/gestor-solicitudes" element={<SolicitudesRecibidas scope="ALL" />} />
            <Route path="/mis-arriendos" element={<MisArriendos />} />
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
