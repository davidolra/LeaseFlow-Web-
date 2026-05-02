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
      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom fixed-top w-100 shadow">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold" to="/">Leaseflow</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/nosotros">Nosotros</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/arrienda">Arrienda</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/contacto">Contacto</Link></li>

              {!isLoggedIn ? (
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Iniciar sesión</Link>
                </li>
              ) : (
                <>
                  <li className="nav-item">
      <Link className="nav-link" to="/perfil">Mi Perfil</Link>
    </li>

          
                  {((userRole.toUpperCase() === ROLES.PROPIETARIO) || (userRole.toUpperCase() === ROLES.ADMIN)) && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/gestion-propiedades">Mis Propiedades</Link>
                    </li>
                  )}
                  
       
                  {(userRole.toUpperCase() === ROLES.ADMIN) && (
                    <li className="nav-item">
                      <Link className="nav-link " to="/gestion-documentos">Admin Documentos</Link>
                    </li>
                  )}

                  <li className="nav-item">
                    <Link className="nav-link" to="/valoraciones">Valoraciones</Link>
                  </li>
                  <li className="nav-item">
                    <button
                      onClick={handleLogout}
                      className="btn btn-outline-light ms-2"
                      style={{ borderRadius: "20px", padding: "5px 15px" }}
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div
        className={`main-content ${isHome ? "home-page" : ""}`}
        style={{ marginTop: isHome ? "0" : "80px", minHeight: "calc(100vh - 160px)" }}
      >
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
  );
}

export default App;
