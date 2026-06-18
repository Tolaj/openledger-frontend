import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { register as registerApi } from '../api/auth'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Register() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const { mutate, isPending, error } = useMutation({
    mutationFn: registerApi,
    onSuccess: (res) => {
      setSession(res.data)
      navigate('/onboarding', { replace: true })
    },
  })

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">
      <div className="mb-10">
        <div className="w-10 h-10 bg-zinc-900 rounded-2xl mb-6" />
        <h1 className="text-2xl font-bold text-zinc-900">Create account</h1>
        <p className="text-sm text-zinc-500 mt-1">Start managing your household</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-4">
        <Input
          label="Name"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Minimum 6 characters' },
          })}
        />

        {error && (
          <p className="text-sm text-red-500 text-center">
            {error.response?.data?.error || 'Registration failed. Try again.'}
          </p>
        )}

        <Button type="submit" fullWidth loading={isPending} className="mt-2">
          Create account
        </Button>
      </form>

      <p className="text-sm text-center text-zinc-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-zinc-900 font-medium underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
