import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Users, UserPlus, Check, X, Trash2, Plus,
  Filter, ChevronDown, Pencil, LayoutTemplate, Home, Briefcase,
} from 'lucide-react'
import DataTable, { DataTableFilterIcon, DataTableMobileFilters } from '../components/ui/DataTable'
import { useForm, Controller } from 'react-hook-form'
import { logout } from '../api/auth'
import { convertCurrency as convertCurrencyApi } from '../api/products'
import { getTemplates } from '../api/templates'
import { CURRENCIES as CURRENCY_LIST, CURRENCY_META, currencySymbol } from '../lib/countries'
import { getRate } from '../lib/exchangeRate'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import { useMe, useUpdateUser } from '../hooks/useUser'
import { useSendFriendRequest, useRespondFriendRequest } from '../hooks/useFriends'
import { useGroups, useCreateGroup, useDeleteGroup, useUpdateGroup } from '../hooks/useGroups'

function sharesGroup(groups, friendId) {
  return groups.some((g) => g.members?.some((m) => String(m._id || m) === String(friendId)))
}
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

// ── helpers ───────────────────────────────────────────────────────────────────
function friendRow(f, myId) {
  const reqId = f.requester?._id ? String(f.requester._id) : String(f.requester)
  const iSent = reqId === String(myId)          // true = I initiated this request
  const other = iSent ? f.recipient : f.requester
  return {
    id:     String(other?._id || other || ''),
    name:   other?.name || other?.email || 'Unknown',
    email:  other?.email || '',
    status: f.status,
    iSent,
  }
}

// ── MembersDropdown ────────────────────────────────────────────────────────────
function MembersDropdown({ friends = [], value = [], onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const dropRef = useRef(null)
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen((o) => !o)
  }

  const toggleMember = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const label = value.length === 0
    ? 'Select members…'
    : `${value.length} member${value.length > 1 ? 's' : ''} selected`

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        onClick={toggle}
        className="w-full h-11 flex items-center justify-between px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
      >
        <span className={value.length === 0 ? 'text-zinc-400' : 'text-zinc-900'}>{label}</span>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: rect.bottom + 4,
            zIndex: 9999,
          }}
          className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto"
        >
          {friends.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-400">No accepted friends yet</p>
          ) : (
            friends.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleMember(f.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors"
              >
                <span className={[
                  'w-4 h-4 rounded flex items-center justify-center border flex-shrink-0',
                  value.includes(f.id) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300',
                ].join(' ')}>
                  {value.includes(f.id) && <Check size={10} className="text-white" />}
                </span>
                <div className="text-left min-w-0">
                  <p className="text-sm text-zinc-900 truncate">{f.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{f.email}</p>
                </div>
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Group Form (BottomSheet) ───────────────────────────────────────────────────
function GroupForm({ open, onClose, editing, myId, acceptedFriends }) {
  const { mutate: update, isPending: updating } = useUpdateGroup()
  const { setActiveGroup } = useGroupStore()
  const qc = useQueryClient()
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '', type: 'personal', members: [], templateId: null },
  })
  const groupType = watch('type')
  const selectedTemplate = watch('templateId')

  // Fetch templates filtered by type (only when creating)
  const { data: templatesData } = useQuery({
    queryKey: ['templates', groupType],
    queryFn: () => getTemplates(myId, groupType).then((r) => r.data || r),
    enabled: open && !editing,
  })
  const templates = Array.isArray(templatesData) ? templatesData : []

  useEffect(() => {
    if (editing) {
      const memberIds = (editing.members || [])
        .map((m) => String(m._id || m))
        .filter((id) => id !== String(myId))
      reset({ name: editing.displayName || editing.name, type: editing.type || 'personal', members: memberIds, templateId: null })
    } else {
      reset({ name: '', type: 'personal', members: [], templateId: null })
    }
  }, [editing, open])

  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (data) => {
    if (editing) {
      const memberIds = [...new Set([String(myId), ...data.members])]
      update({ id: editing._id, data: { displayName: data.name, members: memberIds } }, { onSuccess: onClose })
      return
    }

    setSubmitting(true)
    try {
      // 1. Create the group
      const groupRes = await api.post('/groups', {
        name: data.name,
        displayName: data.name,
        type: data.type,
        members: data.members,
        userId: myId,
      })
      const group = groupRes.data
      const groupId = group._id

      // 2. Switch to the new group immediately
      setActiveGroup(groupId)

      // 3. Apply template if selected
      if (data.templateId) {
        await api.post('/apply-template', { templateId: data.templateId, groupId })
      }

      // Invalidate all relevant queries so Products/Categories refresh
      await qc.invalidateQueries({ queryKey: ['groups'] })
      await qc.invalidateQueries({ queryKey: ['products', groupId] })
      await qc.invalidateQueries({ queryKey: ['categories', groupId] })

      onClose()
    } catch (err) {
      console.error('Group creation failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Group' : 'New Group'}
      footer={
        <Button type="submit" form="group-form" fullWidth loading={submitting || updating}>
          {editing ? 'Save changes' : 'Create group'}
        </Button>
      }
    >
      <form id="group-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Type selector — only on create, locked on edit */}
        {!editing ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Group type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'personal', icon: '🏠', label: 'Personal', sub: 'Household, family' },
                { key: 'business', icon: '🏢', label: 'Business', sub: 'Team, shop, company' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setValue('type', t.key); setValue('templateId', null) }}
                  className={['rounded-xl border-2 p-3 text-left transition-all',
                    groupType === t.key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white',
                  ].join(' ')}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">{t.label}</p>
                  <p className="text-[10px] text-zinc-400">{t.sub}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-lg">{editing.type === 'business' ? '🏢' : '🏠'}</span>
            <p className="text-sm text-zinc-700 font-medium capitalize">{editing.type || 'Personal'}</p>
            <span className="ml-auto text-[10px] text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full">Locked</span>
          </div>
        )}

        <Input
          label={groupType === 'business' ? 'Workspace name' : 'Group name'}
          placeholder={groupType === 'business' ? 'e.g. The Corner Store' : 'e.g. Family, Flatmates'}
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Members</label>
          <Controller
            name="members"
            control={control}
            render={({ field }) => (
              <MembersDropdown
                friends={acceptedFriends}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <p className="text-xs text-zinc-400">You are always included as a member.</p>
        </div>

        {/* Template picker — only on create */}
        {!editing && templates.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Starter template <span className="text-zinc-400 font-normal">(optional)</span></label>
            <div className="flex flex-col gap-2">
              {templates.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setValue('templateId', selectedTemplate === t._id ? null : t._id)}
                  className={['flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all',
                    selectedTemplate === t._id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white',
                  ].join(' ')}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                    {t.description && <p className="text-[10px] text-zinc-400 truncate">{t.description}</p>}
                  </div>
                  <p className="text-[10px] text-zinc-400 flex-shrink-0">{t.categories?.length}cat · {t.products?.length}items</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </BottomSheet>
  )
}

function timeAgo(date) {
  if (!date) return '—'
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60)   return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)    return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)   return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const navigate = useNavigate()
  const { clearSession } = useAuthStore()
  const { clearGroup } = useGroupStore()
  const { data: me, isLoading } = useMe()
  const { data: groups = [] } = useGroups()
  const { mutate: updateUser, isPending: saving } = useUpdateUser()
  const { register, handleSubmit } = useForm({ values: { name: me?.name || '' } })

  const [pwdOpen, setPwdOpen] = useState(false)

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    watch: watchPwd,
    formState: { errors: pwdErrors },
  } = useForm()

  const { mutate: changePwd, isPending: changingPwd, isError: pwdError } = useMutation({
    mutationFn: ({ newPassword }) =>
      api.patch(`/users/${me._id}`, { newPassword }),
    onSuccess: () => { resetPwd(); setPwdOpen(false) },
  })

  const { mutate: logoutFn, isPending: loggingOut } = useMutation({
    mutationFn: logout,
    onSuccess: () => { clearGroup(); clearSession(); navigate('/login', { replace: true }) },
  })

  const onSave    = (data) => updateUser({ id: me._id, data })
  const onPwdSave = (data) => changePwd({ newPassword: data.newPassword })

  const friendCount = (me?.friends || []).filter((f) => f.status === 'ACCEPTED').length
  const groupCount  = groups.length

  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <Spinner className="py-12" />

  const initials = me?.name
    ? me.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : me?.email?.[0]?.toUpperCase()

  return (
    <div className="flex flex-col gap-4 max-w-md">

      {/* Hero card */}
      <div className="bg-zinc-900 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{me?.name}</p>
          <p className="text-sm text-zinc-400 truncate">{me?.email}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Member since {timeAgo(me?.createdAt)}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col items-center gap-0.5">
          <p className="text-2xl font-bold text-zinc-900">{friendCount}</p>
          <p className="text-xs text-zinc-500">Friends</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col items-center gap-0.5">
          <p className="text-2xl font-bold text-zinc-900">{groupCount}</p>
          <p className="text-xs text-zinc-500">Groups</p>
        </div>
      </div>

      {/* Action rows */}
      <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        <button
          onClick={() => setEditOpen(true)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Pencil size={15} className="text-zinc-600" />
            </div>
            <span className="text-sm font-medium text-zinc-900">Edit profile</span>
          </div>
          <ChevronDown size={16} className="text-zinc-400 -rotate-90" />
        </button>

        <button
          onClick={() => setPwdOpen(true)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <span className="text-sm">🔑</span>
            </div>
            <span className="text-sm font-medium text-zinc-900">Change password</span>
          </div>
          <ChevronDown size={16} className="text-zinc-400 -rotate-90" />
        </button>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <button
          onClick={() => logoutFn()}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="text-sm font-medium text-red-500">
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </span>
        </button>
      </div>

      {/* Edit profile sheet */}
      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        footer={
          <Button form="profile-form" type="submit" fullWidth loading={saving}>
            Save changes
          </Button>
        }
      >
        <form id="profile-form" onSubmit={handleSubmit((data) => { onSave(data); setEditOpen(false) })} className="flex flex-col gap-3">
          <Input label="Name" {...register('name', { required: true })} />
        </form>
      </BottomSheet>

      {/* Change password sheet */}
      <BottomSheet
        open={pwdOpen}
        onClose={() => { setPwdOpen(false); resetPwd() }}
        title="Change password"
        footer={
          <Button form="pwd-form" type="submit" fullWidth loading={changingPwd}>
            Update password
          </Button>
        }
      >
        <form id="pwd-form" onSubmit={handlePwd(onPwdSave)} className="flex flex-col gap-3">
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            error={pwdErrors.newPassword?.message}
            {...regPwd('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            error={pwdErrors.confirmPassword?.message}
            {...regPwd('confirmPassword', {
              required: 'Required',
              validate: (v) => v === watchPwd('newPassword') || 'Passwords do not match',
            })}
          />
          {pwdError && <p className="text-xs text-red-500">Something went wrong. Please try again.</p>}
        </form>
      </BottomSheet>

    </div>
  )
}

// ── RejectBtn — disabled with tooltip when users share a group ─────────────────
function RejectBtn({ canReject, onClick, size = 13, className = 'p-1.5 rounded-lg' }) {
  if (canReject) {
    return (
      <button
        onClick={onClick}
        className={`${className} bg-zinc-100 text-zinc-600 active:bg-zinc-200`}
        title="Reject"
      >
        <X size={size} />
      </button>
    )
  }
  return (
    <span title="Cannot reject — you share a group with this person" className="relative group">
      <button disabled className={`${className} bg-zinc-50 text-zinc-300 cursor-not-allowed`}>
        <X size={size} />
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 rounded-lg bg-zinc-900 text-white text-[11px] text-center px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        Can't reject — you share a group
      </span>
    </span>
  )
}

// ── Friend card (mobile accordion) ────────────────────────────────────────────
function FriendCard({ r, myId, respond, canReject }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <Users size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => setOpen((o) => !o)}>
          <p className="text-sm font-semibold text-zinc-900">{r.name}</p>
          {!open && <p className="text-xs text-zinc-500 truncate">{r.email}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {r.status === 'PENDING' ? (
            <>
              <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-2 rounded-xl bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={14} /></button>
              <RejectBtn canReject={canReject} size={14} className="p-2 rounded-xl" onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />
            </>
          ) : r.status === 'ACCEPTED' ? (
            <>
              <RejectBtn canReject={canReject} size={14} className="p-2 rounded-xl" onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />
              <button onClick={() => { if (confirm('Remove friend?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-1 rounded-xl text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Remove"><Trash2 size={16} /></button>
            </>
          ) : (
            <>
              <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-2 rounded-xl bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={14} /></button>
              <button onClick={() => { if (confirm('Remove?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-2 rounded-xl text-zinc-500 active:bg-zinc-100" title="Delete"><Trash2 size={16} /></button>
            </>
          )}
          <button onClick={() => setOpen((o) => !o)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={18} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-zinc-100">
          {[
            { label: 'name', value: r.name },
            { label: 'email', value: r.email },
            { label: 'status', value: (
              <span className={[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide',
                r.status === 'ACCEPTED' ? 'bg-zinc-900 text-white' : 'bg-amber-100 text-amber-800',
              ].join(' ')}>
                {r.status}
              </span>
            )},
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 border-b border-zinc-100 last:border-0">
              <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
              {typeof value === 'string' ? <p className="text-sm text-zinc-900">{value}</p> : value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Friends Tab ───────────────────────────────────────────────────────────────
function FriendsTab({ showAddForm, setShowAddForm, mobileFiltersOpen, onMobileFiltersOpenChange }) {
  const { data: me, isLoading } = useMe()
  const { data: groups = [] } = useGroups()
  const { mutate: sendReq, isPending: sending } = useSendFriendRequest()
  const { mutate: respond } = useRespondFriendRequest()
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm()
  const [nameFilter, setNameFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dropSel, setDropSel] = useState({})
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))

  const myId = me?._id

  const onSend = (data) => {
    sendReq(
      { _id: myId, friendEmail: data.email },
      {
        onSuccess: () => { reset(); setShowAddForm(false) },
        onError: (err) => setError('email', { message: err.response?.data?.error || 'Failed to send' }),
      }
    )
  }

  if (isLoading) return <Spinner className="py-12" />

  const friends = me?.friends || []

  const allRows = friends
    .map((f) => friendRow(f, myId))
    .filter((r) => !r.iSent || r.status === 'ACCEPTED')

  const dropOpts = {
    name:   [...new Set(allRows.map((r) => r.name).filter(Boolean))],
    email:  [...new Set(allRows.map((r) => r.email).filter(Boolean))],
    status: [...new Set(allRows.map((r) => r.status).filter(Boolean))],
  }

  const rows = allRows.filter((r) =>
    r.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
    r.email.toLowerCase().includes(emailFilter.toLowerCase()) &&
    r.status.toLowerCase().includes(statusFilter.toLowerCase()) &&
    (getDrop('name').length === 0 || getDrop('name').includes(r.name)) &&
    (getDrop('email').length === 0 || getDrop('email').includes(r.email)) &&
    (getDrop('status').length === 0 || getDrop('status').includes(r.status))
  )

  const FRIEND_COLS = [
    { key: 'name', label: 'name', filterable: true },
    { key: 'email', label: 'email', filterable: true },
    { key: 'status', label: 'request', filterable: true },
  ]

  return (
    <div className="flex flex-col gap-4 md:flex-1 md:min-h-0">
      <DataTableMobileFilters columns={FRIEND_COLS} filters={{ name: nameFilter, email: emailFilter, status: statusFilter }} onFilterChange={(key, val) => { if (key === 'name') setNameFilter(val); else if (key === 'email') setEmailFilter(val); else if (key === 'status') setStatusFilter(val) }} dropOpts={dropOpts} dropSel={dropSel} onDropChange={(key, vals) => setDrop(key, vals)} open={mobileFiltersOpen} />
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-zinc-900">Add a friend</p>
          <form onSubmit={handleSubmit(onSend)} className="flex gap-2">
            <div className="flex-1">
              <Input placeholder="friend@email.com" type="email" error={errors.email?.message} {...register('email', { required: true })} />
            </div>
            <Button type="submit" size="sm" loading={sending} className="flex-shrink-0"><UserPlus size={15} /></Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { reset(); setShowAddForm(false) }} className="flex-shrink-0"><X size={15} /></Button>
          </form>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No friends yet" description="Add friends using their email to share groups and split expenses" />
      ) : null}

      {rows.length > 0 && <DataTable
        columns={[
          { key: 'name', label: 'name', filterable: true },
          { key: 'email', label: 'email', filterable: true },
          { key: 'status', label: 'request', filterable: true },
          { key: 'action', label: 'Action' },
        ]}
        data={rows}
        filters={{ name: nameFilter, email: emailFilter, status: statusFilter }}
        onFilterChange={(key, val) => {
          if (key === 'name') setNameFilter(val)
          else if (key === 'email') setEmailFilter(val)
          else if (key === 'status') setStatusFilter(val)
        }}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={(key, vals) => setDrop(key, vals)}
        renderRow={(r) => (
          <tr key={r.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
            <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{r.name}</td>
            <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 max-w-[200px] truncate">{r.email}</td>
            <td className="px-4 py-3 border-r border-zinc-100">
              <span className={[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                r.status === 'ACCEPTED' ? 'bg-zinc-900 text-white' : 'bg-amber-100 text-amber-800',
              ].join(' ')}>
                {r.status}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const cr = !sharesGroup(groups, r.id)
                  return r.status === 'PENDING' ? (
                    <>
                      <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={13} /></button>
                      <RejectBtn canReject={cr} onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />
                    </>
                  ) : r.status === 'ACCEPTED' ? (
                    <>
                      <RejectBtn canReject={cr} onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />
                      <button onClick={() => { if (confirm('Remove friend?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Remove"><Trash2 size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={13} /></button>
                      <button onClick={() => { if (confirm('Remove?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                    </>
                  )
                })()}
              </div>
            </td>
          </tr>
        )}
        emptyMessage="No friends yet"
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.length === 0
          ? <EmptyState icon={Users} title="No friends yet" description="Send a request using their email" />
          : rows.map((r) => (
              <FriendCard
                key={r.id}
                r={r}
                myId={myId}
                respond={respond}
                canReject={!sharesGroup(groups, r.id)}
              />
            ))
        }
      </div>
    </div>
  )
}

// ── Groups Tab ────────────────────────────────────────────────────────────────
function GroupsTab({ openAddRef, mobileFiltersOpen, onMobileFiltersOpenChange }) {
  const { data: me } = useMe()
  const { data: groups = [], isLoading } = useGroups()
  const { mutate: deleteGroup } = useDeleteGroup()
  const [groupForm, setGroupForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)

  const myId = me?._id
  const friends = me?.friends || []
  const acceptedFriends = friends
    .map((f) => friendRow(f, myId))
    .filter((r) => r.status === 'ACCEPTED' && r.id && r.id !== 'undefined')
    .map((r) => ({ id: r.id, name: r.name, email: r.email }))

  const [nameFilter, setNameFilter] = useState('')
  const [groupDropSel, setGroupDropSel] = useState([])

  const openAdd  = () => { setEditingGroup(null); setGroupForm(true) }
  const openEdit = (g) => { setEditingGroup(g); setGroupForm(true) }

  useEffect(() => { if (openAddRef) openAddRef.current = openAdd }, [])

  const { activeGroupId } = useGroupStore()
  const allGroups = groups
  const groupNameOpts = [...new Set(allGroups.map((g) => g.displayName || g.name).filter(Boolean))]

  const sharedGroups = allGroups
    .filter((g) => (g.displayName || g.name).toLowerCase().includes(nameFilter.toLowerCase()))
    .filter((g) => groupDropSel.length === 0 || groupDropSel.includes(g.displayName || g.name))

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex flex-col gap-4 md:flex-1 md:min-h-0">
      <DataTableMobileFilters columns={[{ key: 'name', label: 'name', filterable: true }]} filters={{ name: nameFilter }} onFilterChange={(key, val) => { if (key === 'name') setNameFilter(val) }} dropOpts={{ name: groupNameOpts }} dropSel={{ name: groupDropSel }} onDropChange={(key, vals) => { if (key === 'name') setGroupDropSel(vals) }} open={mobileFiltersOpen} />

      {sharedGroups.length === 0 ? (
        <EmptyState icon={Users} title="No groups yet" description="Create a group to share expenses and manage inventory with others" />
      ) : null}

      {sharedGroups.length > 0 && <DataTable
        columns={[
          { key: 'name', label: 'name', filterable: true },
          { key: 'type', label: 'type' },
          { key: 'members', label: 'members' },
          { key: 'action', label: 'Action' },
        ]}
        data={sharedGroups}
        filters={{ name: nameFilter }}
        onFilterChange={(key, val) => { if (key === 'name') setNameFilter(val) }}
        dropOpts={{ name: groupNameOpts }}
        dropSel={{ name: groupDropSel }}
        onDropChange={(key, vals) => { if (key === 'name') setGroupDropSel(vals) }}
        renderRow={(g) => (
          <tr key={g._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
            <td className="px-4 py-3 border-r border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  {g.type === 'business' ? <Briefcase size={13} className="text-zinc-600" /> : <Home size={13} className="text-zinc-600" />}
                </div>
                <span className="font-medium text-zinc-900">{g.displayName || g.name}</span>
              </div>
            </td>
            <td className="px-4 py-3 border-r border-zinc-100">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.type === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
                {g.type === 'business' ? 'Business' : 'Personal'}
              </span>
            </td>
            <td className="px-4 py-3 border-r border-zinc-100">
              <div className="flex flex-wrap gap-1">
                {(g.members || []).slice(0, 4).map((m, i) => {
                  const name = m?.name || m?.email || '?'
                  return (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-xs text-zinc-700">
                      <span className="w-4 h-4 rounded-full bg-zinc-300 flex items-center justify-center text-[10px] font-bold">
                        {name[0]?.toUpperCase()}
                      </span>
                      {name}
                    </span>
                  )
                })}
                {(g.members?.length || 0) > 4 && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-xs text-zinc-500">+{g.members.length - 4} more</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit"><Pencil size={14} /></button>
                {(() => {
                  const cantDelete = allGroups.length <= 1 || g._id === activeGroupId
                  return (
                    <button
                      onClick={() => { if (!cantDelete && confirm(`Delete "${g.displayName || g.name}"?`)) deleteGroup(g._id) }}
                      disabled={cantDelete}
                      className={`p-1.5 rounded-lg ${cantDelete ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500 active:bg-zinc-100'}`}
                      title={cantDelete ? (allGroups.length <= 1 ? 'Last group cannot be deleted' : 'Switch away from this group first') : 'Delete'}
                    ><Trash2 size={14} /></button>
                  )
                })()}
              </div>
            </td>
          </tr>
        )}
        emptyMessage="No groups yet"
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {sharedGroups.length === 0 ? (
          <EmptyState icon={Users} title="No shared groups" description="Create a group to share expenses with friends" />
        ) : sharedGroups.map((g) => (
          <div key={g._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
              {g.type === 'business' ? <Briefcase size={18} className="text-zinc-600" /> : <Home size={18} className="text-zinc-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-900">{g.displayName || g.name}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${g.type === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
                  {g.type === 'business' ? 'Business' : 'Personal'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{g.members?.length || 0} members</p>
            </div>
            <div className="flex gap-0">
              <button onClick={() => openEdit(g)} className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><Pencil size={15} /></button>
              {(() => {
                const cantDelete = allGroups.length <= 1 || g._id === activeGroupId
                return (
                  <button
                    onClick={() => { if (!cantDelete && confirm(`Delete "${g.displayName || g.name}"?`)) deleteGroup(g._id) }}
                    disabled={cantDelete}
                    className={`p-1 rounded-xl ${cantDelete ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500 active:bg-zinc-100'}`}
                    title={cantDelete ? (allGroups.length <= 1 ? 'Last group' : 'Active group') : 'Delete'}
                  ><Trash2 size={15} /></button>
                )
              })()}
            </div>
          </div>
        ))}
      </div>

      <GroupForm
        open={groupForm}
        onClose={() => setGroupForm(false)}
        editing={editingGroup}
        myId={myId}
        acceptedFriends={acceptedFriends}
      />
    </div>
  )
}

// ── Configuration Tab ─────────────────────────────────────────────────────────
function ConfigurationTab() {
  const { data: me, isLoading } = useMe()
  const { mutate: updateUser, isPending: saving } = useUpdateUser()
  const queryClient = useQueryClient()

  // Currency conversion state
  const [pendingCurrency, setPendingCurrency] = useState(null) // { code, label }
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState(null)

  const handleCurrencySelect = (newCode) => {
    const old = me?.currency || 'INR'
    if (newCode === old) return
    setPendingCurrency(newCode)
    setConvertError(null)
  }

  const confirmCurrencyChange = async (convertPrices) => {
    const fromCode = me?.currency || 'INR'
    const toCode = pendingCurrency
    setConverting(true)
    setConvertError(null)
    try {
      if (convertPrices) {
        const rate = await getRate(fromCode, toCode)
        await convertCurrencyApi(rate)
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
        queryClient.invalidateQueries({ queryKey: ['wishlists'] })
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['finance'] })
        queryClient.invalidateQueries({ queryKey: ['budgets'] })
      }
      updateUser({ id: me._id, data: { currency: toCode } })
      setPendingCurrency(null)
    } catch (err) {
      setConvertError(err.message || 'Failed to fetch exchange rate. Try again.')
    } finally {
      setConverting(false)
    }
  }

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {/* Account type — read-only display */}
        <div className="p-4">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Account type</p>
          <p className="text-xs text-zinc-400 mb-3">Set when your first group was created. Each group has its own type.</p>
          <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-xl">{me?.accountType === 'business' ? '🏢' : '🏠'}</span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 capitalize">{me?.accountType || 'Personal'}</p>
              {me?.businessName && <p className="text-xs text-zinc-500">{me.businessName}</p>}
            </div>
            <span className="ml-auto text-[10px] text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full">Locked</span>
          </div>
        </div>

        {/* Currency */}
        <div className="border-t border-zinc-100 p-4">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Currency</p>
          <p className="text-xs text-zinc-400 mb-3">
            Changing currency can also convert all your product prices using live exchange rates.
          </p>
          <div className="flex gap-2">
            <select
              key={me?.currency}
              defaultValue={me?.currency || 'INR'}
              onChange={(e) => handleCurrencySelect(e.target.value)}
              className="flex-1 h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900"
            >
              {[...CURRENCY_LIST].sort((a, b) => {
                if (a.code === (me?.currency || 'INR')) return -1
                if (b.code === (me?.currency || 'INR')) return 1
                return a.code.localeCompare(b.code)
              }).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>
            <div className="h-11 w-12 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-lg font-semibold text-zinc-700 select-none">
              {currencySymbol(me?.currency || 'INR')}
            </div>
          </div>
        </div>
      </div>

      {/* Currency conversion confirmation sheet */}
      <BottomSheet
        open={!!pendingCurrency}
        onClose={() => !converting && setPendingCurrency(null)}
        title="Change currency"
      >
        <div className="flex flex-col gap-4 px-1">
          {/* From → To */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900">{currencySymbol(me?.currency || 'INR')}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{me?.currency || 'INR'}</p>
            </div>
            <div className="text-zinc-300 text-xl">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900">{currencySymbol(pendingCurrency)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{pendingCurrency}</p>
            </div>
          </div>

          <p className="text-sm text-zinc-600 text-center leading-relaxed">
            Do you also want to convert all your <strong>product prices</strong> from{' '}
            <strong>{me?.currency}</strong> to <strong>{pendingCurrency}</strong> using live exchange rates?
          </p>

          {convertError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center">{convertError}</p>
          )}

          <Button
            fullWidth
            loading={converting}
            onClick={() => confirmCurrencyChange(true)}
          >
            Yes, convert prices too
          </Button>
          <Button
            fullWidth
            variant="secondary"
            disabled={converting}
            onClick={() => confirmCurrencyChange(false)}
          >
            Just change the symbol
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'profile',       label: 'My Profile',    mobileLabel: 'Profile' },
  { key: 'friends',       label: 'Friends',        mobileLabel: 'Friends' },
  { key: 'groups',        label: 'Groups',         mobileLabel: 'Groups'  },
  { key: 'configuration', label: 'Configuration',  mobileLabel: 'Config'  },
]

export default function Settings() {
  const [tab, setTab] = useState('profile')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const openGroupAdd = useRef(null)

  const handleTabChange = (key) => {
    setTab(key)
    setShowAddFriend(false)
    setMobileFiltersOpen(false)
  }

  return (
    <>
      <TopBar
        title="Settings"
        filterIcon={(tab === 'friends' || tab === 'groups') && (
          <DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />
        )}
        right={
          <div className="flex items-center">
            {tab === 'friends' && !showAddFriend && (
              <button onClick={() => setShowAddFriend(true)} className="p-2 rounded-xl active:bg-zinc-100">
                <UserPlus size={20} className="text-zinc-600" />
              </button>
            )}
            {tab === 'groups' && (
              <button onClick={() => openGroupAdd.current?.()} className="p-2 rounded-xl active:bg-zinc-100">
                <Plus size={20} className="text-zinc-600" />
              </button>
            )}
          </div>
        }
      />
      <div className="px-4 pt-0 pb-5 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        {/* Mobile sticky pill tab bar */}
        <div className="md:hidden sticky z-30 bg-zinc-50 -mx-4 px-4 py-4 flex-shrink-0 flex flex-col gap-1" style={{ top: 'calc(3.5rem + env(safe-area-inset-top))' }}>
          <div className="bg-zinc-100 rounded-xl p-0.5 flex">
            {TABS.slice(0, 3).map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={[
                  'flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all duration-200 whitespace-nowrap',
                  tab === t.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 active:bg-zinc-200',
                ].join(' ')}
              >
                {t.mobileLabel}
              </button>
            ))}
          </div>
          <div className="bg-zinc-100 rounded-xl p-0.5 flex">
            {TABS.slice(3).map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={[
                  'flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all duration-200 whitespace-nowrap',
                  tab === t.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 active:bg-zinc-200',
                ].join(' ')}
              >
                {t.mobileLabel}
              </button>
            ))}
          </div>
        </div>
        {/* Desktop underline tab bar */}
        <div className="hidden md:flex items-end justify-between border-b border-zinc-200 mb-5 flex-shrink-0">
          <div className="flex flex-wrap gap-x-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={[
                  'pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.key
                    ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-px'
                    : 'text-zinc-400 hover:text-zinc-600',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="pb-3">
            <PageActions add={
              tab === 'friends' && !showAddFriend
                ? <Button size="sm" onClick={() => setShowAddFriend(true)}><UserPlus size={15} /> Add friend</Button>
                : tab === 'groups'
                ? <Button size="sm" onClick={() => openGroupAdd.current?.()}><Plus size={15} /> New group</Button>
                : null
            } />
          </div>
        </div>

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {tab === 'profile'   && <ProfileTab />}
          {tab === 'friends'   && <FriendsTab showAddForm={showAddFriend} setShowAddForm={setShowAddFriend} mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} />}
          {tab === 'groups'    && <GroupsTab openAddRef={openGroupAdd} mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} />}
          {tab === 'configuration' && <ConfigurationTab />}
        </div>
      </div>
    </>
  )
}
