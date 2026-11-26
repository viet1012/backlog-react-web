import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { loginPathWithReturn } from '../../services/authService'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const location = useLocation()
  const { user } = useAuth()

  if (!user) {
    // Giữ cả query + hash (bộ lọc trên URL, #mã máy) để đăng nhập xong
    // quay lại đúng link đã mở, vd /backlog?q=4200002732.
    // Cũng là đường quay về /login khi API trả 401 (apiClient xóa user).
    return (
      <Navigate
        to={loginPathWithReturn(`${location.pathname}${location.search}${location.hash}`)}
        replace
      />
    )
  }

  return <Outlet />
}
