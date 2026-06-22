import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <Spinner className="min-h-screen" />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}
