import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../app/useSession'

export default function ProtectedRoute() {
  const location = useLocation()
  const { isLoggedIn } = useSession()

  if (isLoggedIn !== 'true') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

