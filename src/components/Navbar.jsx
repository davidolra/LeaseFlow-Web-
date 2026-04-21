import { useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../services/auth.service'
import { useSession } from '../app/useSession'

function navLinkClass({ isActive }) {
  return `nav-link${isActive ? ' active' : ''}`
}

export default function Navbar() {
  const navigate = useNavigate()
  const { isLoggedIn, userRole } = useSession()
  const [open, setOpen] = useState(false)

  const isAuth = isLoggedIn === 'true'
  const canManageProperties = useMemo(
    () => isAuth && (userRole === 'ADMIN' || userRole === 'PROPIETARIO'),
    [isAuth, userRole],
  )
  const canManageDocuments = useMemo(() => isAuth && userRole === 'ADMIN', [isAuth, userRole])

  async function handleLogout() {
    await logout()
    setOpen(false)
    navigate('/')
  }

  function close() {
    setOpen(false)
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/" onClick={close}>
          Leaseflow
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="leaseflowNav"
          aria-expanded={open ? 'true' : 'false'}
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse${open ? ' show' : ''}`} id="leaseflowNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/" end onClick={close}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/nosotros" onClick={close}>
                Nosotros
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/arrienda" onClick={close}>
                Arrienda
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/contacto" onClick={close}>
                Contacto
              </NavLink>
            </li>

            {canManageProperties ? (
              <li className="nav-item">
                <NavLink className={navLinkClass} to="/gestion-propiedades" onClick={close}>
                  Mis Propiedades
                </NavLink>
              </li>
            ) : null}

            {canManageDocuments ? (
              <li className="nav-item">
                <NavLink className={navLinkClass} to="/gestion-documentos" onClick={close}>
                  Admin Documentos
                </NavLink>
              </li>
            ) : null}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {!isAuth ? (
              <NavLink className="btn btn-outline-light btn-sm" to="/login" onClick={close}>
                Iniciar sesión
              </NavLink>
            ) : (
              <>
                <NavLink className="btn btn-outline-light btn-sm" to="/perfil" onClick={close}>
                  Mi Perfil
                </NavLink>
                <NavLink className="btn btn-outline-light btn-sm" to="/valoraciones" onClick={close}>
                  Valoraciones
                </NavLink>
                <button className="btn btn-warning btn-sm" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

