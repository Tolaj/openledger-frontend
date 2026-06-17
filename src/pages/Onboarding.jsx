import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getTemplates, applyTemplate } from '../api/templates'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, groupId } = useAuthStore()
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates(user?._id),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: applyTemplate,
    onSuccess: () => navigate('/', { replace: true }),
  })

  const skip = () => navigate('/', { replace: true })

  const templates = data?.data || []

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Choose a starter</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Pick a template to pre-fill your products and categories
        </p>
      </div>

      {isLoading ? (
        <Spinner className="py-12" />
      ) : (
        <div className="flex flex-col gap-3 flex-1">
          {templates.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelected(t._id)}
              className={[
                'w-full text-left rounded-2xl border p-4 transition-colors',
                selected === t._id
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-200 bg-white active:bg-zinc-50',
              ].join(' ')}
            >
              <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
              {t.description && (
                <p className="text-xs text-zinc-500 mt-0.5">{t.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={skip} className="flex-1">
          Skip
        </Button>
        <Button
          fullWidth
          disabled={!selected}
          loading={isPending}
          onClick={() => mutate({ templateId: selected, groupId })}
          className="flex-1"
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
