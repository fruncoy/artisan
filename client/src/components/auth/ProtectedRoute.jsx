import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { ARTISAN_STATUS, ROLES } from '@/utils/constants'

export function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const { user, loading } = useAuthStore()

  if (loading) return <div className="p-8 text-sm text-neutral-600">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  if (user.role === ROLES.ARTISAN && user.artisanStatus !== ARTISAN_STATUS.APPROVED) {
    return <Navigate to="/artisan/pending" replace />
  }
  return children
}
