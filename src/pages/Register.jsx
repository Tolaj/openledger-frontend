import { useEffect, useState, forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { register as registerApi } from '../api/auth'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AppLogo from '../components/ui/AppLogo'
import { COUNTRIES, currencyForCountry, CURRENCY_META } from '../lib/countries'

function FieldLabel({ children, sub }) {
  return (
    <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
      {children}
      {sub && <span className="text-xs text-zinc-400 font-normal">{sub}</span>}
    </label>
  )
}

// forwardRef so react-hook-form's ref works correctly
const SelectField = forwardRef(function SelectField({ label, sub, children, error, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel sub={sub}>{label}</FieldLabel>
      <select
        ref={ref}
        {...props}
        className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 w-full"
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default function Register() {
  const navigate = useNavigate()
  const { setSession, clearSession } = useAuthStore()
  const { clearGroup } = useGroupStore()
  const [detectedCountry, setDetectedCountry] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '', country: 'IN', currency: 'INR', role: 'user' },
  })

  const selectedCountry = watch('country')
  const selectedCurrency = watch('currency')

  // Auto-detect country by IP — using api.country.is (CORS-friendly, free, no key)
  useEffect(() => {
    fetch('https://api.country.is/')
      .then(r => r.json())
      .then(data => {
        const countryCode = data.country
        if (countryCode && COUNTRIES.find(c => c.code === countryCode)) {
          setDetectedCountry(true)
          setValue('country', countryCode)
          setValue('currency', currencyForCountry(countryCode))
        }
      })
      .catch(() => {}) // silently ignore — defaults remain
  }, [])

  // When country changes, auto-fill currency
  useEffect(() => {
    setValue('currency', currencyForCountry(selectedCountry))
  }, [selectedCountry])

  const { mutate, isPending, error } = useMutation({
    mutationFn: registerApi,
    onSuccess: (res) => {
      clearSession()
      clearGroup()
      setSession(res.data.user ?? res.data, res.data.token)
      navigate('/onboarding', { replace: true })
    },
  })

  const currencyMeta = CURRENCY_META[selectedCurrency]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="min-h-full flex flex-col justify-center px-6 py-10 max-w-xl mx-auto w-full" style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom) + 1rem)' }}>
        <div className="mb-8">
          <Link to="/" className="w-10 h-10 bg-zinc-900 rounded-2xl mb-6 flex items-center justify-center hover:bg-zinc-800 transition-colors">
            <AppLogo size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Create account</h1>
          <p className="text-sm text-zinc-500 mt-1">Start managing your household</p>
        </div>

        <form onSubmit={handleSubmit((d) => mutate(d))} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 1 — Account type */}
            <SelectField
              label="Account type"
              sub="more roles coming soon"
              {...register('role')}
            >
              <option value="user">👤 User</option>
              <option value="admin" disabled>🛡 Admin (coming soon)</option>
            </SelectField>

            {/* 2 — Name */}
            <Input
              label="Name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />

            {/* 3 — Email */}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />

            {/* 4 — Password */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />

            {/* 5 — Country */}
            <SelectField
              label="Country"
              sub={detectedCountry ? 'auto-detected' : ''}
              {...register('country')}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </SelectField>

            {/* 6 — Currency */}
            <div className="flex flex-col gap-1">
              <FieldLabel>Currency</FieldLabel>
              <div className="flex gap-2">
                <select
                  {...register('currency')}
                  className="flex-1 h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 min-w-0"
                >
                  {[...COUNTRIES]
                    .sort((a, b) => {
                      if (a.code === selectedCountry) return -1
                      if (b.code === selectedCountry) return 1
                      return a.currency.localeCompare(b.currency)
                    })
                    .filter((c, i, arr) => arr.findIndex(x => x.currency === c.currency) === i)
                    .map(c => {
                      const meta = CURRENCY_META[c.currency]
                      return (
                        <option key={c.currency} value={c.currency}>
                          {meta?.symbol} {c.currency} — {meta?.name}
                        </option>
                      )
                    })
                  }
                </select>
                {currencyMeta && (
                  <div className="h-11 w-11 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-base font-semibold text-zinc-700 select-none flex-shrink-0">
                    {currencyMeta.symbol}
                  </div>
                )}
              </div>
            </div>

          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">
              {error.response?.data?.error || 'Registration failed. Try again.'}
            </p>
          )}

          <Button type="submit" fullWidth loading={isPending}>
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
    </div>
  )
}
