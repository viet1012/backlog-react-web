import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../../services/authService'
import { getDefaultAuthRoute, hasAnyRole } from '../../services/authService'

interface RoleRouteProps {
  roles: UserRole[]
}

export function RoleRoute({ roles }: RoleRouteProps) {
  return hasAnyRole(roles)
    ? <Outlet />
    : <Navigate to={getDefaultAuthRoute()} replace />
}
