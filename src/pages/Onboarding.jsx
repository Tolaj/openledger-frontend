import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getTemplates, applyTemplate } from '../api/templates'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { Home, Briefcase, Check, Globe } from 'lucide-react'
import { COUNTRIES, currencyForCountry, CURRENCY_META } from '../lib/countries'

const STEPS = ['region', 'type', 'name', 'template']

const ACCOUNT_TYPES = [
  {
    key: 'personal',
    icon: Home,
    label: 'Personal',
    sublabel: 'Household, family & friends',
    description: 'Track groceries, shared expenses, home inventory and budgets.',
  },
  {
    key: 'business',
    icon: Briefcase,
    label: 'Business',
    sublabel: 'Team, shop or company',
    description: 'Manage stock, purchase orders, team finances and more.',
  },
]

export default function Onboarding() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const { initGroup } = useGroupStore()

  const [step, setStep]               = useState(0)
  const [country, setCountry]         = useState(user?.country || 'IN')
  const [currency, setCurrency]       = useState(user?.currency || 'INR')
  const [accountType, setAccountType] = useState(null)         // 'personal' | 'business'
  const [spaceName, setSpaceName]     = useState('')
  const [businessName, setBusinessName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    fetch('https://api.country.is/')
      .then(r => r.json())
      .then(data => {
        const code = data.country
        if (code && COUNTRIES.find(c => c.code === code)) {
          setCountry(code)
          setCurrency(currencyForCountry(code))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setCurrency(currencyForCountry(country))
  }, [country])

  // Fetch templates filtered by chosen account type
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', accountType],
    queryFn: () => getTemplates(user?._id, accountType).then((r) => r.data || r),
    enabled: step === 3,
  })
  const templates = Array.isArray(templatesData) ? templatesData : []

  // Create primary group during onboarding, then optionally apply template
  const { mutate: setup, isPending: settingUp } = useMutation({
    mutationFn: (data) => api.post('/groups/setup', data),
    onSuccess: (res, variables) => {
      const group = res.data
      initGroup(group._id)
      if (selectedTemplate && !variables._skip) {
        applyTemplateMutation({ templateId: selectedTemplate, groupId: group._id })
      } else {
        navigate('/dashboard', { replace: true })
      }
    },
  })

  const { mutate: applyTemplateMutation, isPending: applyingTemplate } = useMutation({
    mutationFn: applyTemplate,
    onSuccess: () => navigate('/dashboard', { replace: true }),
  })

  const isLoading = settingUp || applyingTemplate

  const canProceedName = spaceName.trim().length >= 2 &&
    (accountType === 'personal' || businessName.trim().length >= 2)

  const handleFinish = (skip) => {
    setup({
      displayName:  spaceName.trim(),
      groupType:    accountType,
      accountType,
      businessName: accountType === 'business' ? businessName.trim() : undefined,
      country,
      currency,
      _skip: skip,
    })
  }

  const stepLabel = ['Your region', 'Account type', 'Name your space', 'Starter template']
  const currencyMeta = CURRENCY_META[currency]

  return (
    <div className="h-dvh flex flex-col max-w-md mx-auto overflow-hidden">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pt-10 pb-4">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={['h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-8 bg-zinc-900' : i < step ? 'w-4 bg-zinc-400' : 'w-4 bg-zinc-200',
            ].join(' ')} />
          ))}
          <span className="ml-auto text-xs text-zinc-400">{step + 1} / {STEPS.length}</span>
        </div>

        {/* ── Step 0: Region ───────────────────────────────────────────────── */}
        {step === 0 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-900">Where are you based?</h1>
              <p className="text-sm text-zinc-500 mt-1">This sets your default currency for transactions.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 w-full"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Currency</label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="flex-1 h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 min-w-0"
                  >
                    {[...COUNTRIES]
                      .sort((a, b) => {
                        if (a.code === country) return -1
                        if (b.code === country) return 1
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
          </>
        )}

        {/* ── Step 1: Account type ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-900">How will you use OpenLedger?</h1>
              <p className="text-sm text-zinc-500 mt-1">You can always change this later in Settings.</p>
            </div>
            <div className="flex flex-col gap-3">
              {ACCOUNT_TYPES.map((t) => {
                const Icon = t.icon
                const selected = accountType === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setAccountType(t.key)}
                    className={['w-full text-left rounded-2xl border-2 p-5 transition-all',
                      selected ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white active:bg-zinc-50',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-4">
                      <div className={['w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                        selected ? 'bg-zinc-900' : 'bg-zinc-100',
                      ].join(' ')}>
                        <Icon size={20} className={selected ? 'text-white' : 'text-zinc-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-zinc-900">{t.label}</p>
                          {selected && <Check size={15} className="text-zinc-900" />}
                        </div>
                        <p className="text-xs font-medium text-zinc-500 mt-0.5">{t.sublabel}</p>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{t.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── Step 2: Name your space ──────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-900">
                {accountType === 'business' ? 'Set up your workspace' : 'Name your space'}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {accountType === 'business'
                  ? 'This becomes your business workspace everyone will see.'
                  : 'Give your household or group a name.'}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Input
                label={accountType === 'business' ? 'Workspace name' : 'Space name'}
                placeholder={accountType === 'business' ? 'e.g. The Corner Store' : 'e.g. The Sharma House'}
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
              />
              {accountType === 'business' && (
                <Input
                  label="Business / company name"
                  placeholder="e.g. Sharma Enterprises Pvt Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              )}
            </div>
          </>
        )}

        {/* ── Step 3: Template ─────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-zinc-900">Pick a starter</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Pre-fill your {accountType === 'business' ? 'workspace' : 'space'} with products and categories. You can skip this.
              </p>
            </div>
            {templatesLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <div className="flex flex-col gap-3">
                {templates.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTemplate(selectedTemplate === t._id ? null : t._id)}
                    className={['w-full text-left rounded-2xl border-2 p-4 transition-all',
                      selectedTemplate === t._id
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 bg-white active:bg-zinc-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                          {selectedTemplate === t._id && <Check size={14} className="text-zinc-900" />}
                        </div>
                        {t.description && <p className="text-xs text-zinc-500 mt-0.5">{t.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-zinc-400">{t.categories?.length || 0} categories</p>
                        <p className="text-[10px] text-zinc-400">{t.products?.length || 0} products</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pinned buttons — always visible, never scrolls away */}
      <div className="flex-shrink-0 px-5 pt-3 pb-6 border-t border-zinc-200"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        {step === 0 && (
          <Button fullWidth onClick={() => setStep(1)}>Continue</Button>
        )}
        {step === 1 && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
            <Button fullWidth disabled={!accountType} onClick={() => {
              if (accountType === 'personal') {
                setSpaceName('My Ledger')
                setStep(3)
              } else {
                setStep(2)
              }
            }} className="flex-1">Continue</Button>
          </div>
        )}
        {step === 2 && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button disabled={!canProceedName} onClick={() => setStep(3)} className="flex-1">Continue</Button>
          </div>
        )}
        {step === 3 && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(accountType === 'personal' ? 1 : 2)} className="flex-1">Back</Button>
            <Button variant="outline" onClick={() => handleFinish(true)} loading={isLoading} className="flex-1">Skip</Button>
            <Button disabled={!selectedTemplate} loading={isLoading} onClick={() => handleFinish(false)} className="flex-1">Apply & Finish</Button>
          </div>
        )}
      </div>

    </div>
  )
}
