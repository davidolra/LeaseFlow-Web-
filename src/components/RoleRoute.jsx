import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../app/useSession'

export default function RoleRoute({ allowedRoles }) {
  const { isLoggedIn, userRole } = useSession()

  if (isLoggedIn !== 'true') {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

