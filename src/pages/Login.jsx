import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const navigate = useNavigate()
  const { setSession, clearSession } = useAuthStore()
  const { clearGroup } = useGroupStore()

  const { register, handleSubmit, formState: { errors } } = useForm()

  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      clearSession()
      clearGroup()
      setSession(res.data.user, res.data.token)
      navigate('/dashboard', { replace: true })
    },
  })

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
      <div className="mb-10">
        <div className="w-10 h-10 bg-zinc-900 rounded-2xl mb-6" />
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
        <p className="text-sm text-zinc-500 mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />

        {error && (
          <p className="text-sm text-red-500 text-center">
            {error.response?.data?.error || 'Login failed. Try again.'}
          </p>
        )}

        <Button type="submit" fullWidth loading={isPending} className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="text-sm text-center text-zinc-500 mt-6">
        No account?{' '}
        <Link to="/register" className="text-zinc-900 font-medium underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
