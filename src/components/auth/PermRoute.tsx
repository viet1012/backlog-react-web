import { Navigate, Outlet } from 'react-router-dom'

import { getDefaultAuthRoute } from '../../services/authService'
import { canOpenPage, type PagePerm } from '../../routes/appPages'
import { useAuth } from './useAuth'

interface PermRouteProps {
  /** [feature, action]; undefined = mọi người đã đăng nhập */
  perm?: PagePerm
}

export function PermRoute({ perm }: PermRouteProps) {
  const { can } = useAuth()

  return canOpenPage({ perm }, can)
    ? <Outlet />
    : <Navigate to={getDefaultAuthRoute()} replace />
}
