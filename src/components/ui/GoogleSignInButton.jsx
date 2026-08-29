import { useEffect, useRef, useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { googleLogin } from '../../api/auth'
import queryClient from '../../lib/queryClient'
import useAuthStore from '../../store/authStore'
import useGroupStore from '../../store/groupStore'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleButton({ onError, loginHint, autoTrigger }) {
  const navigate = useNavigate()
  const { setSession, clearSession } = useAuthStore()
  const { clearGroup } = useGroupStore()
  const triggered = useRef(false)
  const initialized = useRef(false)
  const [autoTriggered, setAutoTriggered] = useState(false)
  const btnRef = useRef(null)

  const { mutate, isPending } = useMutation({
    mutationFn: (credential) => googleLogin(credential),
    onSuccess: (res) => {
      clearSession()
      clearGroup()
      queryClient.clear()
      const { user, token, isNew } = res.data
      setSession(user, token)
      navigate(isNew ? '/onboarding' : '/dashboard', { replace: true })
    },
    onError: (err) => {
      onError?.(err.response?.data?.error || 'Google sign-in failed')
    },
  })

  const handleCredential = useCallback((response) => {
    if (response.credential) mutate(response.credential)
  }, [mutate])

  useEffect(() => {
    if (!clientId || initialized.current) return
    const gsi = window.google?.accounts?.id
    if (!gsi) return
    initialized.current = true

    gsi.initialize({
      client_id: clientId,
      callback: handleCredential,
      ...(loginHint ? { login_hint: loginHint } : {}),
      auto_select: !!autoTrigger,
    })

    if (btnRef.current) {
      gsi.renderButton(btnRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        size: 'large',
        width: btnRef.current.offsetWidth || 400,
        text: 'continue_with',
      })
    }

    if (autoTrigger && loginHint && !triggered.current) {
      triggered.current = true
      setAutoTriggered(true)
      gsi.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setAutoTriggered(false)
        }
      })
    }
  }, [handleCredential, loginHint, autoTrigger])

  if (isPending || autoTriggered) {
    return (
      <div className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white">
        <span className="h-4 w-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={btnRef}
      className="w-full h-11 rounded-xl overflow-hidden [&>div]:!w-full [&_iframe]:!w-full"
    />
  )
}

export default function GoogleSignInButton({ onError, loginHint, autoTrigger }) {
  if (!clientId) return null
  return <GoogleButton onError={onError} loginHint={loginHint} autoTrigger={autoTrigger} />
}
