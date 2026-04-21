import { Navigate, createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleRoute from '../components/RoleRoute'
import AppLayout from './AppLayout'
import Home from '../pages/Home'
import Nosotros from '../pages/Nosotros'
import Arrienda from '../pages/Arrienda'
import Contacto from '../pages/Contacto'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import Perfil from '../pages/Perfil'
import GestionPropiedades from '../pages/GestionPropiedades'
import GestionDocumentos from '../pages/GestionDocumentos'
import Valoraciones from '../pages/Valoraciones'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'nosotros', element: <Nosotros /> },
      { path: 'arrienda', element: <Arrienda /> },
      { path: 'contacto', element: <Contacto /> },
      { path: 'login', element: <Login /> },
      { path: 'registro', element: <Registro /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'perfil', element: <Perfil /> },
          { path: 'valoraciones', element: <Valoraciones /> },
        ],
      },
      {
        element: <RoleRoute allowedRoles={['ADMIN', 'PROPIETARIO']} />,
        children: [{ path: 'gestion-propiedades', element: <GestionPropiedades /> }],
      },
      {
        element: <RoleRoute allowedRoles={['ADMIN']} />,
        children: [{ path: 'gestion-documentos', element: <GestionDocumentos /> }],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
