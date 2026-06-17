import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Users, UserPlus, Check, X, Trash2, Plus,
  Filter, ChevronDown, Pencil, LayoutTemplate,
} from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { logout } from '../api/auth'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import { useMe, useUpdateUser } from '../hooks/useUser'
import { useSendFriendRequest, useRespondFriendRequest } from '../hooks/useFriends'
import { useGroups, useCreateGroup, useDeleteGroup, useUpdateGroup } from '../hooks/useGroups'

function sharesGroup(groups, friendId) {
  return groups
    .filter((g) => g.name !== 'ISOLATED_GROUP')
    .some((g) => g.members?.some((m) => String(m._id || m) === String(friendId)))
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
  const { mutate: create, isPending: creating } = useCreateGroup()
  const { mutate: update, isPending: updating } = useUpdateGroup()
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', members: [] },
  })

  useEffect(() => {
    if (editing) {
      const memberIds = (editing.members || [])
        .map((m) => String(m._id || m))
        .filter((id) => id !== String(myId))
      reset({ name: editing.name, members: memberIds })
    } else {
      reset({ name: '', members: [] })
    }
  }, [editing, open])

  const onSubmit = (data) => {
    if (editing) {
      // deduplicate in case myId slipped in via the form
      const memberIds = [...new Set([String(myId), ...data.members])]
      update({ id: editing._id, data: { name: data.name, members: memberIds } }, { onSuccess: onClose })
    } else {
      // backend adds the creator automatically via userId — don't include myId in members
      create({ name: data.name, members: data.members, userId: myId }, { onSuccess: onClose })
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Group' : 'New Group'}
      footer={
        <Button type="submit" form="group-form" fullWidth loading={creating || updating}>
          {editing ? 'Save changes' : 'Create group'}
        </Button>
      }
    >
      <form id="group-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Group name"
          placeholder="e.g. Family, Flatmates"
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
    onSuccess: () => { clearSession(); navigate('/login', { replace: true }) },
  })

  const onSave    = (data) => updateUser({ id: me._id, data })
  const onPwdSave = (data) => changePwd({ newPassword: data.newPassword })

  const friendCount = (me?.friends || []).filter((f) => f.status === 'ACCEPTED').length
  const groupCount  = groups.filter((g) => g.name !== 'ISOLATED_GROUP').length

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4 p-5">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {me?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-zinc-900 truncate">{me?.name}</p>
            <p className="text-sm text-zinc-500 truncate">{me?.email}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Joined {timeAgo(me?.createdAt)}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 border-t border-zinc-100">
          <div className="flex flex-col items-center py-3 border-r border-zinc-100">
            <p className="text-xl font-bold text-zinc-900">{friendCount}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Friends</p>
          </div>
          <div className="flex flex-col items-center py-3">
            <p className="text-xl font-bold text-zinc-900">{groupCount}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Groups</p>
          </div>
        </div>

        {/* Edit name */}
        <div className="border-t border-zinc-100 p-4">
          <p className="text-sm font-semibold text-zinc-900 mb-3">Edit profile</p>
          <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-3">
            <Input label="Name" {...register('name', { required: true })} />
            <Button type="submit" fullWidth loading={saving}>Save changes</Button>
            <Button type="button" variant="outline" fullWidth onClick={() => setPwdOpen(true)}>
              Change password
            </Button>
          </form>
        </div>
      </div>

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
          {pwdError && <p className="text-xs text-red-500">Current password is incorrect.</p>}
        </form>
      </BottomSheet>

      <Button variant="outline" fullWidth loading={loggingOut} onClick={() => logoutFn()}>
        <LogOut size={15} /> Sign out
      </Button>
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
              <button onClick={() => { if (confirm('Remove friend?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-2 rounded-xl text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Remove"><Trash2 size={16} /></button>
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
function FriendsTab({ showAddForm, setShowAddForm }) {
  const { data: me, isLoading } = useMe()
  const { data: groups = [] } = useGroups()
  const { mutate: sendReq, isPending: sending } = useSendFriendRequest()
  const { mutate: respond } = useRespondFriendRequest()
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm()
  const [nameFilter, setNameFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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

  const rows = friends
    .map((f) => friendRow(f, myId))
    // Hide rows I initiated that aren't accepted yet (sender doesn't see pending/rejected)
    .filter((r) => !r.iSent || r.status === 'ACCEPTED')
    .filter((r) =>
      r.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
      r.email.toLowerCase().includes(emailFilter.toLowerCase()) &&
      r.status.toLowerCase().includes(statusFilter.toLowerCase())
    )

  return (
    <div className="flex flex-col gap-4">
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

      {/* Mobile accordion */}
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

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              {['name', 'email', 'request', 'Action'].map((h, i, a) => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide ${i < a.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
              ))}
            </tr>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {[
                { key: 'name', val: nameFilter, set: setNameFilter },
                { key: 'email', val: emailFilter, set: setEmailFilter },
                { key: 'status', val: statusFilter, set: setStatusFilter },
                { key: null },
              ].map(({ key, val, set }, i, a) => (
                <td key={i} className={`px-3 py-2 ${i < a.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                  {key && (
                    <div className="flex items-center gap-1.5">
                      <input value={val} onChange={(e) => set(e.target.value)} placeholder="Filter…"
                        className="flex-1 text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 placeholder-zinc-400 transition-colors" />
                      <Filter size={12} className="text-zinc-400 flex-shrink-0" />
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">No friends yet</td></tr>
            ) : rows.map((r) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Groups Tab ────────────────────────────────────────────────────────────────
function GroupsTab({ openAddRef }) {
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

  const openAdd  = () => { setEditingGroup(null); setGroupForm(true) }
  const openEdit = (g) => { setEditingGroup(g); setGroupForm(true) }

  useEffect(() => { if (openAddRef) openAddRef.current = openAdd }, [])

  const sharedGroups = groups
    .filter((g) => g.name !== 'ISOLATED_GROUP')
    .filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()))

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex flex-col gap-4">

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {sharedGroups.length === 0 ? (
          <EmptyState icon={Users} title="No shared groups" description="Create a group to share expenses with friends" />
        ) : sharedGroups.map((g) => (
          <div key={g._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{g.name}</p>
              <p className="text-xs text-zinc-500">{g.members?.length || 0} members</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(g)} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><Pencil size={15} /></button>
              <button onClick={() => { if (confirm(`Delete "${g.name}"?`)) deleteGroup(g._id) }} className="p-2 rounded-xl text-zinc-400 hover:text-red-500 active:bg-zinc-100"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              {['name', 'members', 'Action'].map((h, i, a) => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide ${i < a.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
              ))}
            </tr>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {[true, false, false].map((filterable, i, a) => (
                <td key={i} className={`px-3 py-2 ${i < a.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                  {filterable && (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Filter…"
                        className="flex-1 text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 placeholder-zinc-400 transition-colors"
                      />
                      <Filter size={12} className="text-zinc-400 flex-shrink-0" />
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {sharedGroups.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-400">No groups yet</td></tr>
            ) : sharedGroups.map((g) => (
              <tr key={g._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{g.name}</td>
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
                    <button onClick={() => { if (confirm(`Delete "${g.name}"?`)) deleteGroup(g._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

// ── Templates Tab ─────────────────────────────────────────────────────────────
function TemplatesTab() {
  return (
    <EmptyState icon={LayoutTemplate} title="No templates yet" description="Save shopping lists as templates to reuse them" />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'profile',   label: 'My Profile' },
  { key: 'friends',   label: 'Friends'    },
  { key: 'groups',    label: 'Groups'     },
  { key: 'templates', label: 'Templates'  },
]

export default function Settings() {
  const [tab, setTab] = useState('profile')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const openGroupAdd = useRef(null)

  const handleTabChange = (key) => {
    setTab(key)
    setShowAddFriend(false)
  }

  return (
    <>
      <TopBar title="Settings" />
      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Settings" subtitle="Manage your account, friends and groups" />

        <div className="flex items-end justify-between border-b border-zinc-200 mb-5">
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

        {tab === 'profile'   && <ProfileTab />}
        {tab === 'friends'   && <FriendsTab showAddForm={showAddFriend} setShowAddForm={setShowAddFriend} />}
        {tab === 'groups'    && <GroupsTab openAddRef={openGroupAdd} />}
        {tab === 'templates' && <TemplatesTab />}
      </div>
    </>
  )
}
