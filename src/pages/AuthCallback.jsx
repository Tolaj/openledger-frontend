import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import queryClient from '../lib/queryClient'
import api from '../lib/axios'
import Spinner from '../components/ui/Spinner'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setSession, clearSession } = useAuthStore()
  const { clearGroup } = useGroupStore()

  useEffect(() => {
    const token = params.get('token')
    const dest = params.get('dest') || 'dashboard'

    if (!token) {
      navigate('/register', { replace: true })
      return
    }

    clearSession()
    clearGroup()
    queryClient.clear()

    api.get('/auth/session', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setSession(res.data.user, token)
        navigate(`/${dest}`, { replace: true })
      })
      .catch(() => {
        navigate('/register?error=session_failed', { replace: true })
      })
  }, [])

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-zinc-500">Signing you in...</p>
      </div>
    </div>
  )
}
