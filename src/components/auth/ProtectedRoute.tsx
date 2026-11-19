import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../services/authService'

export function ProtectedRoute() {
  const location = useLocation()

  if (!isAuthenticated()) {
    // Giữ cả query + hash (bộ lọc trên URL, #mã máy) để đăng nhập xong
    // quay lại đúng link đã mở, vd /backlog?q=4200002732
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    )
  }

  return <Outlet />
}
