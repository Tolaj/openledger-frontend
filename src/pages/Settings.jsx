import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Users, UserPlus, Check, X, Trash2, Plus,
  Filter, ChevronDown, Pencil, LayoutTemplate, Home, Briefcase,
  ShieldCheck, Eye, PencilLine, PlusCircle, Trash,
} from 'lucide-react'
import DataTable, { DataTableFilterIcon, DataTableMobileFilters } from '../components/ui/DataTable'
import Tabs from '../components/ui/Tabs'
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
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useRoles'
import { usePermission, getPermissionForGroup } from '../hooks/usePermission'

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
function MembersDropdown({ friends = [], value = [], onChange, isBusiness, ...props }) {
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
            <p className="px-4 py-3 text-sm text-zinc-400">{isBusiness ? 'No accepted colleagues yet' : 'No accepted friends yet'}</p>
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

  const [createdGroupId, setCreatedGroupId] = useState(null)
  const [createdMembers, setCreatedMembers] = useState([])
  const phase2 = !!createdGroupId

  const { activeGroupId } = useGroupStore()
  // When editing: use that group's roles. When creating: fall back to active group's roles.
  const targetGroupId = editing?._id || createdGroupId || activeGroupId
  const { data: roles = [] } = useQuery({
    queryKey: ['roles', targetGroupId],
    queryFn: () => import('../api/roles').then((m) => m.getRoles(targetGroupId).then((r) => r.data)),
    enabled: !!targetGroupId,
  })
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '', type: 'personal', members: [], templateId: null },
  })
  const groupType = watch('type')
  const selectedTemplate = watch('templateId')

  // memberRoles: { [memberId]: roleId }
  const [memberRoles, setMemberRoles] = useState({})
  const [transferAdminTo, setTransferAdminTo] = useState('') // userId to transfer admin to

  // Derived admin info for this workspace
  const adminRole    = roles.find((r) => r.isSystem)
  const adminRoleId  = adminRole?._id
  const nonAdminRoles = roles.filter((r) => !r.isSystem)

  // Who currently holds admin in this group
  const currentAdminMemberId = (() => {
    if (!adminRoleId) return null
    // In phase 2 (just created), creator is always admin
    if (phase2) return String(myId)
    if (!editing) return null
    const mr = (editing.memberRoles || []).find(
      (r) => String(r.roleId?._id || r.roleId) === String(adminRoleId)
    )
    return mr ? String(mr.userId?._id || mr.userId) : null
  })()
  const iAmAdmin = currentAdminMemberId === String(myId)

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
      // Seed role assignments from existing memberRoles
      const rolesMap = {}
      ;(editing.memberRoles || []).forEach((mr) => {
        rolesMap[String(mr.userId?._id || mr.userId)] = String(mr.roleId?._id || mr.roleId)
      })
      setMemberRoles(rolesMap)
    } else {
      reset({ name: '', type: 'personal', members: [], templateId: null })
      setMemberRoles({})
    }
    setTransferAdminTo('')
    setCreatedGroupId(null)
    setCreatedMembers([])
  }, [editing, open])

  const [submitting, setSubmitting] = useState(false)

  const buildMemberRolesArray = (memberIds) => {
    const result = []
    for (const id of memberIds) {
      // Admin transfer: if transferring, new admin gets adminRoleId; current admin loses it
      if (adminRoleId && iAmAdmin && transferAdminTo) {
        if (id === transferAdminTo) {
          result.push({ userId: id, roleId: adminRoleId })
          continue
        }
        if (id === String(myId)) {
          // Current admin gets their newly selected role (or none)
          if (memberRoles[id]) result.push({ userId: id, roleId: memberRoles[id] })
          continue
        }
      } else if (adminRoleId && id === String(myId) && iAmAdmin) {
        // Admin keeps their admin role — always include it
        result.push({ userId: id, roleId: adminRoleId })
        continue
      }
      if (memberRoles[id]) result.push({ userId: id, roleId: memberRoles[id] })
    }
    return result
  }

  const onSubmit = async (data) => {
    // ── Edit mode ──────────────────────────────────────────────
    if (editing) {
      const memberIds = [...new Set([String(myId), ...data.members])]
      if (iAmAdmin && transferAdminTo && !memberIds.includes(transferAdminTo)) return
      const memberRolesArr = buildMemberRolesArray(memberIds)
      update({ id: editing._id, data: { displayName: data.name, members: memberIds, memberRoles: memberRolesArr } }, { onSuccess: onClose })
      return
    }

    // ── Create mode ─────────────────────────────────────────────
    setSubmitting(true)
    try {
      const groupRes = await api.post('/groups', {
        name: data.name,
        displayName: data.name,
        type: data.type,
        members: data.members,
        userId: myId,
      })
      const group = groupRes.data
      const groupId = group._id

      setActiveGroup(groupId)

      if (data.templateId) {
        await api.post('/apply-template', { templateId: data.templateId, groupId })
      }

      // Save role assignments if any were selected
      if (data.type === 'business' && Object.keys(memberRoles).length > 0) {
        const memberIds = [...new Set([String(myId), ...data.members])]
        const memberRolesArr = memberIds
          .filter((id) => memberRoles[id])
          .map((id) => ({ userId: id, roleId: memberRoles[id] }))
        if (memberRolesArr.length > 0) {
          await api.put(`/groups/${groupId}`, { memberRoles: memberRolesArr })
        }
      }

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
      title={editing ? 'Edit Workspace' : 'New Group'}
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
          <label className="text-sm font-medium text-zinc-700">{groupType === 'business' ? 'Team members' : 'Members'}</label>
          <Controller
            name="members"
            control={control}
            render={({ field }) => (
              <MembersDropdown
                friends={acceptedFriends}
                value={field.value}
                onChange={field.onChange}
                isBusiness={groupType === 'business'}
              />
            )}
          />
          <p className="text-xs text-zinc-400">{groupType === 'business' ? 'You are always included as the owner.' : 'You are always included as a member.'}</p>

          {/* Role assignment — business groups, whenever members are selected */}
          {groupType === 'business' && (
            <Controller
              name="members"
              control={control}
              render={({ field }) =>
                field.value.length > 0 ? (
                  <div className="flex flex-col gap-0 mt-3 border border-zinc-200 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-zinc-500" />
                        <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide">Assign Roles</p>
                      </div>
                      {nonAdminRoles.length === 0 && (
                        <span className="text-[11px] text-zinc-400">Create roles in the Roles tab first</span>
                      )}
                    </div>

                    {/* Member rows */}
                    {field.value.map((memberId, i) => {
                      const friend = acceptedFriends.find((f) => f.id === memberId)
                      if (!friend) return null
                      const isThisAdmin = memberId === currentAdminMemberId
                      const isMe = memberId === String(myId)

                      return (
                        <div key={memberId} className={`flex items-center gap-3 px-3 py-2.5 ${i < field.value.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                          <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-zinc-600">
                            {(friend.name || friend.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-800 truncate">{friend.name || friend.email}</p>
                            {friend.name && <p className="text-[11px] text-zinc-400 truncate">{friend.email}</p>}
                          </div>

                          {/* Admin badge — locked, not changeable here */}
                          {isThisAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-bold flex-shrink-0">
                              <ShieldCheck size={11} /> Admin
                            </span>
                          ) : (
                            /* Non-admin members: show role picker (excluding Admin role) */
                            <select
                              value={memberRoles[memberId] || ''}
                              onChange={(e) => setMemberRoles((prev) => ({ ...prev, [memberId]: e.target.value || undefined }))}
                              disabled={nonAdminRoles.length === 0}
                              className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 w-36 flex-shrink-0 disabled:opacity-40"
                            >
                              <option value="">No role</option>
                              {nonAdminRoles.map((r) => (
                                <option key={r._id} value={r._id}>{r.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )
                    })}

                    {/* Admin transfer — only visible to current admin */}
                    {editing && iAmAdmin && field.value.length > 0 && (
                      <div className="border-t border-zinc-200 bg-amber-50 px-3 py-3 flex flex-col gap-2">
                        <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Transfer Admin</p>
                        <p className="text-[11px] text-amber-600">To change your own role you must transfer Admin to another member first. The workspace must always have one Admin.</p>
                        <div className="flex items-center gap-2 mt-1">
                          <select
                            value={transferAdminTo}
                            onChange={(e) => setTransferAdminTo(e.target.value)}
                            className="flex-1 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            <option value="">— Keep Admin role —</option>
                            {field.value.map((memberId) => {
                              if (memberId === String(myId)) return null
                              const friend = acceptedFriends.find((f) => f.id === memberId)
                              if (!friend) return null
                              return <option key={memberId} value={memberId}>{friend.name || friend.email}</option>
                            })}
                          </select>
                          {transferAdminTo && (
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <select
                                value={memberRoles[String(myId)] || ''}
                                onChange={(e) => setMemberRoles((prev) => ({ ...prev, [String(myId)]: e.target.value || undefined }))}
                                className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 w-36"
                              >
                                <option value="">My new role (none)</option>
                                {nonAdminRoles.map((r) => (
                                  <option key={r._id} value={r._id}>{r.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null
              }
            />
          )}
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
function ProfileTab({ isBusiness }) {
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
          <p className="text-xs text-zinc-500">{isBusiness ? 'Colleagues' : 'Friends'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col items-center gap-0.5">
          <p className="text-2xl font-bold text-zinc-900">{groupCount}</p>
          <p className="text-xs text-zinc-500">{isBusiness ? 'Workspaces' : 'Groups'}</p>
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
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
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
function FriendCard({ r, myId, respond, canReject, isBusiness, canEdit = true, canDelete = true }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
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
              {canEdit && <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-2 rounded-xl bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={14} /></button>}
              {canEdit && <RejectBtn canReject={canReject} size={14} className="p-2 rounded-xl" onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />}
            </>
          ) : r.status === 'ACCEPTED' ? (
            <>
              {canEdit && <RejectBtn canReject={canReject} size={14} className="p-2 rounded-xl" onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />}
              {canDelete && <button onClick={() => { if (confirm(isBusiness ? 'Remove colleague?' : 'Remove friend?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-1 rounded-xl text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Remove"><Trash2 size={16} /></button>}
            </>
          ) : (
            <>
              {canEdit && <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-2 rounded-xl bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={14} /></button>}
              {canDelete && <button onClick={() => { if (confirm(isBusiness ? 'Remove colleague?' : 'Remove?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-2 rounded-xl text-zinc-500 active:bg-zinc-100" title="Delete"><Trash2 size={16} /></button>}
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
function FriendsTab({ showAddForm, setShowAddForm, mobileFiltersOpen, onMobileFiltersOpenChange, isBusiness, canEdit = true, canDelete = true }) {
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
          <p className="text-sm font-semibold text-zinc-900">{isBusiness ? 'Add a colleague' : 'Add a friend'}</p>
          <form onSubmit={handleSubmit(onSend)} className="flex gap-2">
            <div className="flex-1">
              <Input placeholder={isBusiness ? 'colleague@email.com' : 'friend@email.com'} type="email" error={errors.email?.message} {...register('email', { required: true })} />
            </div>
            <Button type="submit" size="sm" loading={sending} className="flex-shrink-0"><UserPlus size={15} /></Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { reset(); setShowAddForm(false) }} className="flex-shrink-0"><X size={15} /></Button>
          </form>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Users} title={isBusiness ? 'No colleagues yet' : 'No friends yet'} description={isBusiness ? 'Invite colleagues by email to collaborate on workspaces' : 'Add friends using their email to share groups and split expenses'} />
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
                      {canEdit && <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={13} /></button>}
                      {canEdit && <RejectBtn canReject={cr} onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />}
                    </>
                  ) : r.status === 'ACCEPTED' ? (
                    <>
                      {canEdit && <RejectBtn canReject={cr} onClick={() => respond({ userId: myId, friendId: r.id, action: 'REJECTED' })} />}
                      {canDelete && <button onClick={() => { if (confirm(isBusiness ? 'Remove colleague?' : 'Remove friend?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Remove"><Trash2 size={14} /></button>}
                    </>
                  ) : (
                    <>
                      {canEdit && <button onClick={() => respond({ userId: myId, friendId: r.id, action: 'ACCEPTED' })} className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Accept"><Check size={13} /></button>}
                      {canDelete && <button onClick={() => { if (confirm(isBusiness ? 'Remove colleague?' : 'Remove?')) respond({ userId: myId, friendId: r.id, action: 'DELETE' }) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>}
                    </>
                  )
                })()}
              </div>
            </td>
          </tr>
        )}
        emptyMessage={isBusiness ? 'No colleagues yet' : 'No friends yet'}
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.length === 0
          ? <EmptyState icon={Users} title={isBusiness ? 'No colleagues yet' : 'No friends yet'} description={isBusiness ? 'Invite colleagues by email' : 'Send a request using their email'} />
          : rows.map((r) => (
              <FriendCard
                key={r.id}
                r={r}
                myId={myId}
                respond={respond}
                canReject={!sharesGroup(groups, r.id)}
                isBusiness={isBusiness}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))
        }
      </div>
    </div>
  )
}

// ── Groups Tab ────────────────────────────────────────────────────────────────
function GroupMobileCard({ g, onEdit, onDelete, cantDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          {g.type === 'business' ? <Briefcase size={18} className="text-white" /> : <Home size={18} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-zinc-900 truncate">{g.displayName || g.name}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${g.type === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
              {g.type === 'business' ? 'Business' : 'Personal'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{g.members?.length || 0} members</p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(g)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
              <Pencil size={17} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(g)} disabled={cantDelete}
              className={`px-1 py-2 rounded-xl ${cantDelete ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-400 active:bg-zinc-100 hover:text-red-500'}`}>
              <Trash2 size={17} />
            </button>
          )}
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Type</span>
            <span className="text-sm text-zinc-900 capitalize">{g.type || 'personal'}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Members</span>
            <span className="text-sm text-zinc-900">{g.members?.length || 0}</span>
          </div>
          {g.members?.length > 0 && (
            <div className="flex items-start px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0 mt-0.5">People</span>
              <div className="flex flex-col gap-0.5">
                {g.members.map((m) => (
                  <span key={m._id || m} className="text-sm text-zinc-900">{m.name || m.email || String(m)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GroupsTab({ openAddRef, mobileFiltersOpen, onMobileFiltersOpenChange, isBusiness, canEdit = true, canDelete = true }) {
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
        <EmptyState icon={Users} title={isBusiness ? 'No workspaces yet' : 'No groups yet'} description={isBusiness ? 'Create a workspace to collaborate with your team' : 'Create a group to share expenses and manage inventory with others'} />
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
                  const memberId = String(m?._id || m)
                  const mr = (g.memberRoles || []).find((r) => String(r.userId?._id || r.userId) === memberId)
                  const roleName = mr?.roleId?.name || null
                  return (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-xs text-zinc-700">
                      <span className="w-4 h-4 rounded-full bg-zinc-300 flex items-center justify-center text-[10px] font-bold">
                        {name[0]?.toUpperCase()}
                      </span>
                      {name}
                      {roleName && <span className="text-[10px] px-1 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">{roleName}</span>}
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
                {getPermissionForGroup(g, myId, 'settings', 'workspace', 'edit') && (
                  <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit"><Pencil size={14} /></button>
                )}
                {getPermissionForGroup(g, myId, 'settings', 'workspace', 'delete') && (() => {
                  const isCreator = g.createdBy === String(myId) || g.createdBy?._id === String(myId) || !g.createdBy
                  const cantDelete = allGroups.length <= 1 || g._id === activeGroupId || !isCreator
                  const deleteTitle = !isCreator ? 'Only the group creator can delete this' : allGroups.length <= 1 ? 'Last group cannot be deleted' : g._id === activeGroupId ? 'Switch away from this group first' : 'Delete'
                  return (
                    <button
                      onClick={() => { if (!cantDelete && confirm(`Delete "${g.displayName || g.name}"?`)) deleteGroup(g._id) }}
                      disabled={cantDelete}
                      className={`p-1.5 rounded-lg ${cantDelete ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500 active:bg-zinc-100'}`}
                      title={deleteTitle}
                    ><Trash2 size={14} /></button>
                  )
                })()}
              </div>
            </td>
          </tr>
        )}
        emptyMessage={isBusiness ? 'No workspaces yet' : 'No groups yet'}
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {sharedGroups.length === 0 ? (
          <EmptyState icon={Users} title={isBusiness ? 'No workspaces yet' : 'No shared groups'} description={isBusiness ? 'Create a workspace to collaborate with your team' : 'Create a group to share expenses with friends'} />
        ) : sharedGroups.map((g) => {
          const isCreator = g.createdBy === String(myId) || g.createdBy?._id === String(myId) || !g.createdBy
          const cantDelete = allGroups.length <= 1 || g._id === activeGroupId || !isCreator
          const rowCanEdit   = getPermissionForGroup(g, myId, 'settings', 'workspace', 'edit')
          const rowCanDelete = getPermissionForGroup(g, myId, 'settings', 'workspace', 'delete')
          return (
            <GroupMobileCard
              key={g._id}
              g={g}
              onEdit={rowCanEdit ? openEdit : null}
              onDelete={rowCanDelete ? (g) => { if (!cantDelete && confirm(`Delete "${g.displayName || g.name}"?`)) deleteGroup(g._id) } : null}
              cantDelete={cantDelete}
            />
          )
        })}
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
function ConfigurationTab({ canEdit = true }) {
  const { data: me, isLoading } = useMe()
  const { data: groups = [], isLoading: groupsLoading } = useGroups()
  const { activeGroupId } = useGroupStore()
  const { mutate: updateUser, isPending: saving } = useUpdateUser()
  const { mutate: updateGroup, isPending: savingBiz } = useUpdateGroup()
  const queryClient = useQueryClient()

  const activeGroup = groups.find((g) => g._id === activeGroupId)

  // Business details form state (synced from activeGroup)
  const bd = activeGroup?.businessDetails || {}
  const [biz, setBiz] = useState({})
  const [bizSaved, setBizSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')

  // Sync biz state when activeGroup loads/changes
  useEffect(() => {
    if (activeGroup) {
      const d = activeGroup.businessDetails || {}
      setBiz({
        legalName:    d.legalName    || '',
        logo:         d.logo         || '',
        template:     d.template     || 'classic',
        color:        d.color        || 'forest',
        gstin:        d.gstin        || '',
        pan:          d.pan          || '',
        email:        d.email        || '',
        phone:        d.phone        || '',
        website:      d.website      || '',
        addressLine1: d.addressLine1 || '',
        addressLine2: d.addressLine2 || '',
        city:         d.city         || '',
        state:        d.state        || '',
        pincode:      d.pincode      || '',
        country:      d.country      || 'India',
      })
    }
  }, [activeGroup?._id])

  const handleBizSave = () => {
    updateGroup({ id: activeGroupId, data: { businessDetails: biz } }, {
      onSuccess: () => { setBizSaved(true); setTimeout(() => setBizSaved(false), 2000) },
    })
  }

  // Currency conversion state
  const [pendingCurrency, setPendingCurrency] = useState(null) // { code, label }
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState(null)

  // Active group's currency (group-level, shared by all members)
  const groupCurrency = activeGroup?.currency || me?.currency || 'INR'

  const handleCurrencySelect = (newCode) => {
    if (newCode === groupCurrency) return
    setPendingCurrency(newCode)
    setConvertError(null)
  }

  const confirmCurrencyChange = async (convertPrices) => {
    const fromCode = groupCurrency
    const toCode = pendingCurrency
    setConverting(true)
    setConvertError(null)
    try {
      if (convertPrices) {
        const rate = await getRate(fromCode, toCode)
        await convertCurrencyApi(rate, activeGroupId, toCode)
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
        queryClient.invalidateQueries({ queryKey: ['wishlists'] })
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['finance'] })
        queryClient.invalidateQueries({ queryKey: ['budgets'] })
      } else {
        // No price conversion — just update the group currency
        updateGroup({ id: activeGroupId, data: { currency: toCode } })
      }
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setPendingCurrency(null)
    } catch (err) {
      setConvertError(err.message || 'Failed to fetch exchange rate. Try again.')
    } finally {
      setConverting(false)
    }
  }

  if (isLoading) return <Spinner className="py-12" />

  const [previewTemplate, setPreviewTemplate] = useState(null)

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Top row: business form | account+currency | template */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* Business Details — left column (only for business groups) */}
        {activeGroup?.type === 'business' && (
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden md:max-w-md flex-1">
            <div className="p-3 border-b border-zinc-100">
              <p className="text-sm font-semibold text-zinc-900">Business Details</p>
              <p className="text-xs text-zinc-400 mt-0.5">Shown on invoices, purchase orders, and documents.</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {/* Logo upload */}
              <div className="flex items-center gap-2">
                {biz.logo ? (
                  <img src={biz.logo} alt="logo" className="h-9 w-9 rounded-lg object-contain border border-zinc-200 bg-zinc-50 p-0.5 flex-shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-zinc-400 text-[9px] text-center leading-tight flex-shrink-0">Logo</div>
                )}
                <label className={`flex-1 h-8 px-3 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-700 flex items-center justify-center gap-1.5 transition-colors ${canEdit ? 'cursor-pointer hover:bg-zinc-50' : 'opacity-50 cursor-not-allowed'} ${logoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" disabled={!canEdit} onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setLogoUploading(true)
                    setLogoError('')
                    try {
                      const fd = new FormData()
                      fd.append('file', file)
                      fd.append('upload_preset', 'openledger')
                      const res = await fetch('https://api.cloudinary.com/v1_1/dwicc7oxu/image/upload', { method: 'POST', body: fd })
                      if (!res.ok) throw new Error('Upload failed')
                      const data = await res.json()
                      setBiz((b) => ({ ...b, logo: data.secure_url }))
                    } catch (err) {
                      setLogoError('Upload failed. Please try again.')
                    } finally {
                      setLogoUploading(false)
                      e.target.value = ''
                    }
                  }} />
                  {logoUploading ? <><span className="h-3 w-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> Uploading…</> : 'Upload logo'}
                </label>
                {biz.logo && canEdit && (
                  <button onClick={() => setBiz((b) => ({ ...b, logo: '' }))}
                    className="h-8 px-2.5 rounded-lg border border-zinc-200 text-xs text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    Remove
                  </button>
                )}
                {logoError && <p className="text-xs text-red-500">{logoError}</p>}
              </div>

              {/* Fields */}
              {[
                { label: 'Legal / Trading Name', key: 'legalName', placeholder: 'e.g. Acme Pvt. Ltd.', full: true },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{label}</label>
                  <input value={biz[key] || ''} onChange={(e) => setBiz((b) => ({ ...b, [key]: e.target.value }))}
                    readOnly={!canEdit} placeholder={placeholder} className={`h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-900 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2">
                {[['GSTIN', 'gstin', '22AAAAA0000A1Z5'], ['PAN', 'pan', 'AAAAA0000A'], ['Email', 'email', 'billing@company.com'], ['Phone', 'phone', '+91 98765 43210']].map(([label, key, placeholder]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{label}</label>
                    <input type={key === 'email' ? 'email' : 'text'} value={biz[key] || ''} onChange={(e) => setBiz((b) => ({ ...b, [key]: e.target.value }))}
                      readOnly={!canEdit} placeholder={placeholder} className={`h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-900 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Website</label>
                <input value={biz.website || ''} onChange={(e) => setBiz((b) => ({ ...b, website: e.target.value }))}
                  readOnly={!canEdit} placeholder="https://yourcompany.com" className={`h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-900 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Address</label>
                <div className="flex flex-col gap-1.5">
                  <input value={biz.addressLine1 || ''} onChange={(e) => setBiz((b) => ({ ...b, addressLine1: e.target.value }))}
                    readOnly={!canEdit} placeholder="Street / Building" className={`h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-900 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  <input value={biz.addressLine2 || ''} onChange={(e) => setBiz((b) => ({ ...b, addressLine2: e.target.value }))}
                    readOnly={!canEdit} placeholder="Area / Locality (optional)" className={`h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-900 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  <div className="grid grid-cols-2 gap-1.5">
                    {[['City', 'city'], ['State', 'state'], ['Pincode', 'pincode'], ['Country', 'country']].map(([ph, key]) => (
                      <input key={key} value={biz[key] || ''} onChange={(e) => setBiz((b) => ({ ...b, [key]: e.target.value }))}
                        readOnly={!canEdit} placeholder={ph} className={`h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-zinc-900 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleBizSave} disabled={savingBiz || !canEdit}
                className="h-10 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {savingBiz ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {bizSaved ? '✓ Saved' : savingBiz ? 'Saving…' : 'Save Business Details'}
              </button>
            </div>
          </div>
        )}

        {/* Middle column: account type + currency */}
        <div className={`flex flex-col gap-4 ${activeGroup?.type === 'business' ? 'md:w-72' : 'max-w-lg'} w-full`}>
          {/* Account type */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
            <div className="p-4">
              <p className="text-sm font-semibold text-zinc-900 mb-1">Account type</p>
              <p className="text-xs text-zinc-400 mb-3">Set when your first group was created. Each group has its own type.</p>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-xl">{activeGroup?.type === 'business' ? '🏢' : '🏠'}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 capitalize">{activeGroup?.type || 'Personal'}</p>
                  {activeGroup?.name && <p className="text-xs text-zinc-500">{activeGroup.name}</p>}
                </div>
                <span className="ml-auto text-[10px] text-zinc-400 bg-zinc-200 px-2 py-0.5 rounded-full">Locked</span>
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
            <div className="p-4">
              <p className="text-sm font-semibold text-zinc-900 mb-1">Currency</p>
              <p className="text-xs text-zinc-400 mb-3">
                Changing currency can also convert all your product prices using live exchange rates.
              </p>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 mb-3">
                <span className="text-2xl font-bold text-zinc-900">{currencySymbol(groupCurrency)}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{groupCurrency}</p>
                  <p className="text-xs text-zinc-400">{CURRENCY_LIST.find(c => c.code === groupCurrency)?.name || ''}</p>
                </div>
              </div>
              <select
                key={groupCurrency}
                defaultValue={groupCurrency}
                onChange={(e) => canEdit && handleCurrencySelect(e.target.value)}
                disabled={!canEdit}
                className={`w-full h-10 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {[...CURRENCY_LIST].sort((a, b) => {
                  if (a.code === groupCurrency) return -1
                  if (b.code === groupCurrency) return 1
                  return a.code.localeCompare(b.code)
                }).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right column: invoice template (business only) */}
        {activeGroup?.type === 'business' && (
          <div className="flex flex-col gap-4 md:w-96 w-full">
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
              <div className="p-4">
                <p className="text-sm font-semibold text-zinc-900 mb-1">Invoice template</p>
                <p className="text-xs text-zinc-400 mb-3">Applies to all PDFs generated for this group.</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'classic',   label: 'Classic',   desc: 'Traditional letterhead' },
                    { key: 'modern',    label: 'Modern',    desc: 'Left rail, big number' },
                    { key: 'minimal',   label: 'Minimal',   desc: 'Clean, no borders' },
                    { key: 'executive', label: 'Executive', desc: 'Accent header band' },
                    { key: 'bold',      label: 'Bold',      desc: 'Strong typography' },
                    { key: 'elegant',   label: 'Elegant',   desc: 'Warm cream paper' },
                    { key: 'retro',     label: 'Retro',     desc: 'Monospace, dashed' },
                    { key: 'compact',   label: 'Compact',   desc: 'Dense, data-heavy' },
                    { key: 'stripe',    label: 'Stripe',    desc: 'Split-panel header' },
                    { key: 'bureau',    label: 'Bureau',    desc: 'Centered, formal' },
                  ].map((t) => {
                    const active = (biz.template || 'classic') === t.key
                    return (
                      <div key={t.key} className={`rounded-lg border transition-all ${active ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'} ${!canEdit ? 'opacity-60' : ''}`}>
                        <button
                          disabled={!canEdit}
                          onClick={() => {
                            setBiz((b) => ({ ...b, template: t.key }))
                            updateGroup({ id: activeGroupId, data: { businessDetails: { ...biz, template: t.key } } })
                          }}
                          className="flex items-start gap-2 px-2.5 py-2 w-full text-left disabled:cursor-not-allowed"
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? 'border-zinc-900' : 'border-zinc-300'}`}>
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 leading-tight">{t.label}</p>
                            <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 truncate">{t.desc}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setPreviewTemplate(t.key)}
                          className="w-full text-[10px] text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors pb-1.5 rounded-b-lg"
                        >
                          Preview
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Color theme picker */}
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Color theme</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'forest', color: '#14532d', label: 'Forest' },
                      { key: 'rose',   color: '#be123c', label: 'Rose' },
                      { key: 'indigo', color: '#4338ca', label: 'Indigo' },
                      { key: 'amber',  color: '#b45309', label: 'Amber' },
                      { key: 'teal',   color: '#0f766e', label: 'Teal' },
                      { key: 'purple', color: '#6d28d9', label: 'Purple' },
                      { key: 'slate',  color: '#1e293b', label: 'Slate' },
                    ].map((c) => {
                      const active = (biz.color || 'forest') === c.key
                      return (
                        <button
                          key={c.key}
                          title={c.label}
                          disabled={!canEdit}
                          onClick={() => {
                            setBiz((b) => ({ ...b, color: c.key }))
                            updateGroup({ id: activeGroupId, data: { businessDetails: { ...biz, color: c.key } } })
                          }}
                          className={`w-6 h-6 rounded-full transition-all disabled:cursor-not-allowed ${active ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'hover:scale-110'} ${!canEdit ? 'opacity-60' : ''}`}
                          style={{ backgroundColor: c.color }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <p className="text-2xl font-bold text-zinc-900">{currencySymbol(groupCurrency)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{groupCurrency}</p>
            </div>
            <div className="text-zinc-300 text-xl">→</div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900">{currencySymbol(pendingCurrency)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{pendingCurrency}</p>
            </div>
          </div>

          <p className="text-sm text-zinc-600 text-center leading-relaxed">
            Do you also want to convert all your <strong>product prices</strong> from{' '}
            <strong>{groupCurrency}</strong> to <strong>{pendingCurrency}</strong> using live exchange rates?
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

      {/* Template preview modal */}
      {previewTemplate && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewTemplate(null)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 hover:bg-zinc-600 text-white text-base leading-none">✕</button>
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-1 pr-1" style={{ width: 'max-content' }}>
                {['classic','modern','minimal','executive','bold','elegant','retro','compact','stripe','bureau'].map((k) => (
                  <button key={k} onClick={() => setPreviewTemplate(k)}
                    className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors whitespace-nowrap ${previewTemplate === k ? 'bg-white text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-white'}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-3 flex justify-center" onClick={() => setPreviewTemplate(null)}>
            <iframe
              key={previewTemplate}
              srcDoc={buildTemplatePreview(previewTemplate, biz, biz.color)}
              className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-zinc-200"
              style={{ height: '100%' }}
              title="Invoice preview"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}

const PREVIEW_COLOR_THEMES = {
  forest: { accent: '#14532d', mid: '#166534', light: '#f0fdf4', border: '#bbf7d0', badge: '#dcfce7', badgeText: '#166534' },
  rose:   { accent: '#be123c', mid: '#e11d48', light: '#fff1f2', border: '#fecdd3', badge: '#ffe4e6', badgeText: '#be123c' },
  indigo: { accent: '#4338ca', mid: '#4f46e5', light: '#eef2ff', border: '#c7d2fe', badge: '#e0e7ff', badgeText: '#3730a3' },
  amber:  { accent: '#b45309', mid: '#d97706', light: '#fffbeb', border: '#fde68a', badge: '#fef3c7', badgeText: '#92400e' },
  teal:   { accent: '#0f766e', mid: '#0d9488', light: '#f0fdfa', border: '#99f6e4', badge: '#ccfbf1', badgeText: '#0f766e' },
  purple: { accent: '#6d28d9', mid: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', badge: '#ede9fe', badgeText: '#5b21b6' },
  slate:  { accent: '#1e293b', mid: '#334155', light: '#f8fafc', border: '#cbd5e1', badge: '#f1f5f9', badgeText: '#334155' },
}

function buildTemplatePreview(template, biz = {}, colorKey = 'forest') {
  const t = template || 'classic'
  const modern  = t === 'modern'
  const minimal = t === 'minimal'
  const col = PREVIEW_COLOR_THEMES[colorKey] || PREVIEW_COLOR_THEMES.forest

  const bizName  = biz.legalName || 'Your Company'
  const gstin    = biz.gstin  || '22AAAAA0000A1Z5'
  const email    = biz.email  || 'billing@yourcompany.com'
  const logoHtml = biz.logo
    ? `<img src="${biz.logo}" style="max-height:40px;max-width:100px;object-fit:contain;margin-bottom:4px;display:block;"/>`
    : ''

  const cfg = {
    modern: {
      pageStyle:   `padding:40px 40px 40px 36px;border-left:5px solid ${col.mid};`,
      brandSize:   '18px', brandWeight: '700', brandColor: '#09090b',
      subColor:    '#a1a1aa',
      numSize:     '32px', numWeight: '700', numColor: col.mid, numSpacing: '-1.5px',
      numMarginBottom: '8px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:4px;font-weight:700;`,
      divider:     '<div style="height:1px;background:#f4f4f5;margin-bottom:32px;"></div>',
      headerMb:    '36px',
      cardGap:     '32px',
      card:        `padding-left:14px;border-left:2px solid ${col.border};`,
      lbl:         col.mid,
      dateGap:     '32px',
      dateCard:    `padding-left:14px;border-left:2px solid ${col.border};`,
      dateLbl:     col.mid,
      theadBg:     'transparent', theadColor: '#09090b', theadBorder: 'border-bottom:2px solid #09090b;',
      rowEven:     null, tdColor: '#3f3f46', rowGap: '#f4f4f5',
      totalsColor: '#71717a',
      grand:       `font-size:15px;font-weight:700;color:${col.mid};border-top:2px solid #09090b;border-bottom:none;padding-top:10px;`,
      noteBox:     `border-left:2px solid ${col.border};padding-left:16px;margin-bottom:28px;`,
      noteLbl:     col.mid, noteText: '#52525b',
      footer:      'border-top:1px solid #f4f4f5;padding-top:16px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a1a1aa',
    },
    minimal: {
      pageStyle:   'padding:48px;',
      brandSize:   '18px', brandWeight: '600', brandColor: '#09090b',
      subColor:    '#a1a1aa',
      numSize:     '24px', numWeight: '300', numColor: '#09090b', numSpacing: '-1px',
      numMarginBottom: '6px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:100px;font-weight:600;`,
      divider:     '<div style="height:1px;background:#f4f4f5;margin-bottom:36px;"></div>',
      headerMb:    '40px',
      cardGap:     '32px',
      card:        'padding:0;',
      lbl:         '#a1a1aa',
      dateGap:     '32px',
      dateCard:    'padding:0;',
      dateLbl:     '#a1a1aa',
      theadBg:     'transparent', theadColor: '#09090b', theadBorder: 'border-bottom:2px solid #09090b;',
      rowEven:     null, tdColor: '#3f3f46', rowGap: '#f4f4f5',
      totalsColor: '#71717a',
      grand:       `font-size:15px;font-weight:600;color:${col.accent};border-top:1px solid #e4e4e7;border-bottom:none;padding-top:12px;`,
      noteBox:     'padding:0;margin-bottom:28px;',
      noteLbl:     '#a1a1aa', noteText: '#52525b',
      footer:      'border-top:1px solid #f4f4f5;padding-top:16px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a1a1aa',
    },
    classic: {
      pageStyle:   'padding:40px;',
      brandSize:   '22px', brandWeight: '700', brandColor: col.accent,
      subColor:    '#a1a1aa',
      numSize:     '20px', numWeight: '700', numColor: col.accent, numSpacing: 'normal',
      numMarginBottom: '4px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:4px;font-weight:700;`,
      divider:     '<div style="margin-bottom:28px;border-top:3px double #d1d5db;padding-top:3px;border-bottom:1px solid #d1d5db;"></div>',
      headerMb:    '24px',
      cardGap:     '24px',
      card:        'background:#fff;border:1px solid #d1d5db;border-radius:8px;padding:16px;',
      lbl:         '#6b7280',
      dateGap:     '20px',
      dateCard:    'background:#fff;border:1px solid #d1d5db;border-radius:8px;padding:12px 16px;',
      dateLbl:     '#6b7280',
      theadBg:     col.accent, theadColor: '#fff', theadBorder: '',
      rowEven:     '#f9fafb', tdColor: '#374151', rowGap: '#f3f4f6',
      totalsColor: '#6b7280',
      grand:       `font-size:15px;font-weight:700;color:${col.accent};border-top:1px solid #d1d5db;border-bottom:none;padding-top:10px;`,
      noteBox:     'background:#f9fafb;border:1px solid #d1d5db;border-radius:8px;padding:16px;margin-bottom:32px;',
      noteLbl:     '#6b7280', noteText: '#4b5563',
      footer:      'border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a1a1aa',
    },
    executive: {
      pageStyle:   `padding:0;`,
      headerWrap:  `display:flex;justify-content:space-between;align-items:flex-start;padding:40px;background:${col.accent};`,
      brandSize:   '22px', brandWeight: '700', brandColor: '#fff',
      subColor:    'rgba(255,255,255,0.55)',
      numSize:     '24px', numWeight: '700', numColor: '#fff', numSpacing: 'normal',
      numMarginBottom: '4px',
      badge:       'background:rgba(255,255,255,0.18);color:#fff;border-radius:4px;font-weight:700;',
      bodyStyle:   'padding:32px 40px 40px;',
      divider:     '',
      headerMb:    '0',
      cardGap:     '20px',
      card:        `background:${col.light};border:1px solid ${col.border};border-radius:8px;padding:16px;`,
      lbl:         col.mid,
      dateGap:     '16px',
      dateCard:    `background:${col.light};border:1px solid ${col.border};border-radius:6px;padding:10px 14px;`,
      dateLbl:     col.mid,
      theadBg:     col.accent, theadColor: '#fff', theadBorder: '',
      rowEven:     '#f9fafb', tdColor: '#374151', rowGap: '#f3f4f6',
      totalsColor: '#6b7280',
      grand:       `font-size:15px;font-weight:700;color:${col.accent};border-top:2px solid ${col.border};border-bottom:none;padding-top:10px;`,
      noteBox:     `background:${col.light};border:1px solid ${col.border};border-radius:8px;padding:16px;margin-bottom:32px;`,
      noteLbl:     col.mid, noteText: '#4b5563',
      footer:      'border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a1a1aa',
    },
    bold: {
      pageStyle:   'padding:48px;',
      brandSize:   '28px', brandWeight: '800', brandColor: col.accent,
      subColor:    '#a1a1aa',
      numSize:     '28px', numWeight: '800', numColor: col.accent, numSpacing: '-1px',
      numMarginBottom: '4px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:4px;font-weight:700;`,
      divider:     '',
      headerMb:    '0',
      headerExtra: `padding-bottom:20px;border-bottom:5px solid ${col.accent};margin-bottom:32px;align-items:flex-end;`,
      cardGap:     '20px',
      card:        `padding:14px 16px;border-left:4px solid ${col.accent};background:${col.light};`,
      lbl:         col.mid,
      dateGap:     '20px',
      dateCard:    `padding:10px 14px;border-left:4px solid ${col.border};`,
      dateLbl:     '#71717a',
      theadBg:     col.accent, theadColor: '#fff', theadBorder: '',
      rowEven:     col.light, tdColor: '#374151', rowGap: '#f3f4f6',
      totalsColor: '#6b7280',
      grand:       `font-size:15px;font-weight:800;color:${col.accent};border-top:5px solid ${col.accent};border-bottom:none;padding-top:10px;`,
      noteBox:     `padding:14px 16px;border-left:4px solid ${col.accent};background:${col.light};margin-bottom:32px;`,
      noteLbl:     col.mid, noteText: '#4b5563',
      footer:      `border-top:5px solid ${col.accent};padding-top:14px;display:flex;justify-content:space-between;align-items:center;`,
      footerNote:  '#a1a1aa',
    },
    elegant: {
      pageStyle:   'padding:52px;background:#fdfaf5;',
      brandSize:   '20px', brandWeight: '600', brandColor: '#1c1917',
      subColor:    '#78716c',
      numSize:     '22px', numWeight: '600', numColor: col.accent, numSpacing: '-0.5px',
      numMarginBottom: '4px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:100px;font-weight:600;`,
      divider:     '',
      headerMb:    '0',
      headerExtra: 'padding-bottom:24px;border-bottom:1px solid #d6cfc4;margin-bottom:28px;',
      cardGap:     '28px',
      card:        'background:#fff;border:1px solid #e7e0d5;border-radius:6px;padding:16px 18px;',
      lbl:         '#78716c',
      dateGap:     '20px',
      dateCard:    'background:#fff;border:1px solid #e7e0d5;border-radius:6px;padding:10px 14px;',
      dateLbl:     '#78716c',
      theadBg:     '#f5ede0', theadColor: '#44403c', theadBorder: 'border-bottom:1px solid #d6cfc4;',
      rowEven:     '#faf7f2', tdColor: '#44403c', rowGap: '#ede8e0',
      totalsColor: '#78716c',
      grand:       `font-size:15px;font-weight:600;color:${col.accent};border-top:1px solid #d6cfc4;border-bottom:none;padding-top:12px;`,
      noteBox:     'background:#fff;border:1px solid #e7e0d5;border-radius:6px;padding:16px 18px;margin-bottom:32px;',
      noteLbl:     '#78716c', noteText: '#57534e',
      footer:      'border-top:1px solid #d6cfc4;padding-top:16px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a8a29e',
    },
    retro: {
      pageStyle:   'padding:40px;background:#fefce8;font-family:"Courier New",Courier,monospace;',
      brandSize:   '20px', brandWeight: '700', brandColor: '#1c1917',
      subColor:    '#78716c',
      numSize:     '20px', numWeight: '700', numColor: col.accent, numSpacing: 'normal',
      numMarginBottom: '4px',
      badge:       `background:transparent;color:${col.accent};border:2px dashed ${col.accent};border-radius:0;font-weight:700;`,
      divider:     '',
      headerMb:    '0',
      headerExtra: 'padding-bottom:16px;border-bottom:2px dashed #a16207;margin-bottom:24px;',
      cardGap:     '20px',
      card:        'background:#fff;border:2px dashed #d6d3d1;padding:14px;',
      lbl:         '#a16207',
      dateGap:     '16px',
      dateCard:    'background:#fff;border:2px dashed #d6d3d1;padding:10px 12px;',
      dateLbl:     '#a16207',
      theadBg:     '#1c1917', theadColor: '#fefce8', theadBorder: '',
      rowEven:     '#fef9c3', tdColor: '#292524', rowGap: '#d6d3d1',
      totalsColor: '#78716c',
      grand:       `font-size:14px;font-weight:700;color:${col.accent};border-top:2px dashed #a16207;border-bottom:none;padding-top:10px;`,
      noteBox:     'background:#fff;border:2px dashed #d6d3d1;padding:14px;margin-bottom:28px;',
      noteLbl:     '#a16207', noteText: '#44403c',
      footer:      'border-top:2px dashed #a16207;padding-top:14px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a8a29e',
    },
    compact: {
      pageStyle:   'padding:28px;',
      brandSize:   '16px', brandWeight: '700', brandColor: col.accent,
      subColor:    '#9ca3af',
      numSize:     '16px', numWeight: '700', numColor: col.accent, numSpacing: 'normal',
      numMarginBottom: '2px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:3px;font-size:9px;padding:2px 6px;font-weight:700;`,
      divider:     '',
      headerMb:    '0',
      headerExtra: 'padding-bottom:12px;border-bottom:1px solid #e5e7eb;margin-bottom:16px;',
      cardGap:     '12px',
      card:        'border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;',
      lbl:         '#9ca3af',
      dateGap:     '10px',
      dateCard:    'border:1px solid #e5e7eb;border-radius:4px;padding:8px 10px;',
      dateLbl:     '#9ca3af',
      theadBg:     col.accent, theadColor: '#fff', theadBorder: '',
      rowEven:     '#f9fafb', tdColor: '#374151', rowGap: '#f3f4f6',
      totalsColor: '#6b7280',
      grand:       `font-size:13px;font-weight:700;color:${col.accent};border-top:1px solid #e5e7eb;border-bottom:none;padding-top:6px;`,
      noteBox:     'border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;margin-bottom:16px;',
      noteLbl:     '#9ca3af', noteText: '#4b5563',
      footer:      'border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a1a1aa',
    },
    stripe: {
      pageStyle:   'padding:0;',
      headerWrap:  'display:flex;align-items:stretch;margin-bottom:0;',
      brandStyle:  `flex:1;padding:36px 40px;background:${col.accent};color:#fff;font-size:22px;font-weight:700;`,
      metaStyle:   `padding:36px 40px;background:${col.light};text-align:right;min-width:200px;border-bottom:4px solid ${col.accent};`,
      brandSize:   '22px', brandWeight: '700', brandColor: '#fff',
      subColor:    'rgba(255,255,255,0.55)',
      numSize:     '22px', numWeight: '700', numColor: col.accent, numSpacing: 'normal',
      numMarginBottom: '4px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:4px;font-weight:700;`,
      bodyStyle:   'padding:0 40px 40px;',
      divider:     '',
      headerMb:    '0',
      cardGap:     '24px',
      card:        `border:1px solid #e5e7eb;border-top:3px solid ${col.accent};border-radius:0 0 8px 8px;padding:16px;`,
      lbl:         col.mid,
      dateGap:     '16px',
      dateCard:    'border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;',
      dateLbl:     '#71717a',
      theadBg:     col.accent, theadColor: '#fff', theadBorder: '',
      rowEven:     '#f9fafb', tdColor: '#374151', rowGap: '#f3f4f6',
      totalsColor: '#6b7280',
      grand:       `font-size:15px;font-weight:700;color:${col.accent};border-top:2px solid ${col.accent};border-bottom:none;padding-top:10px;`,
      noteBox:     `border:1px solid #e5e7eb;border-top:3px solid ${col.accent};padding:14px;margin-bottom:28px;`,
      noteLbl:     col.mid, noteText: '#4b5563',
      footer:      'border-top:1px solid #e5e7eb;padding-top:14px;display:flex;justify-content:space-between;align-items:center;',
      footerNote:  '#a1a1aa',
    },
    bureau: {
      pageStyle:   'padding:40px 48px;',
      brandSize:   '22px', brandWeight: '700', brandColor: col.accent,
      subColor:    '#6b7280',
      numSize:     '18px', numWeight: '700', numColor: '#1c1917', numSpacing: 'normal',
      numMarginBottom: '4px',
      badge:       `background:${col.badge};color:${col.badgeText};border-radius:0;font-weight:700;letter-spacing:0.08em;`,
      divider:     '',
      headerMb:    '0',
      headerExtra: `flex-direction:column;align-items:center;text-align:center;border-top:4px double ${col.accent};border-bottom:4px double ${col.accent};padding:20px 0;margin-bottom:28px;`,
      cardGap:     '28px',
      card:        'padding:0;',
      lbl:         col.mid,
      dateGap:     '0',
      dateCard:    'flex:1;padding:0 16px 0 0;border-right:1px solid #e5e7eb;margin-right:16px;',
      dateLbl:     col.mid,
      theadBg:     'transparent', theadColor: col.accent, theadBorder: `border-top:2px solid ${col.accent};border-bottom:2px solid ${col.accent};`,
      rowEven:     col.light, tdColor: '#374151', rowGap: '#f3f4f6',
      totalsColor: '#6b7280',
      grand:       `font-size:15px;font-weight:700;color:${col.accent};border-top:2px solid ${col.accent};border-bottom:2px solid ${col.accent};padding-top:8px;padding-bottom:8px;`,
      noteBox:     'border:1px solid #e5e7eb;padding:14px;margin-bottom:28px;',
      noteLbl:     col.mid, noteText: '#4b5563',
      footer:      `border-top:4px double ${col.accent};padding-top:14px;display:flex;justify-content:space-between;align-items:center;`,
      footerNote:  '#a1a1aa',
    },
  }[t] || {}

  const rows = [
    ['Website Redesign',  '1',        '₹45,000', '18%', '₹45,000'],
    ['SEO Optimization',  '3 months', '₹12,000', '18%', '₹36,000'],
    ['Brand Identity Kit','1',        '₹25,000', '18%', '₹25,000'],
  ].map((r, i) => `
    <tr style="border-bottom:1px solid ${cfg.rowGap};${cfg.rowEven && i % 2 === 0 ? `background:${cfg.rowEven};` : ''}">
      <td style="padding:10px 12px;font-size:13px;color:${cfg.tdColor};">${r[0]}</td>
      <td style="padding:10px 12px;font-size:13px;color:${cfg.tdColor};text-align:center;">${r[1]}</td>
      <td style="padding:10px 12px;font-size:13px;color:${cfg.tdColor};text-align:right;font-variant-numeric:tabular-nums;">${r[2]}</td>
      <td style="padding:10px 12px;font-size:13px;color:${cfg.tdColor};text-align:center;">${r[3]}</td>
      <td style="padding:10px 12px;font-size:13px;color:${cfg.tdColor};text-align:right;font-variant-numeric:tabular-nums;">${r[4]}</td>
    </tr>`).join('')

  const headerHtml = cfg.headerWrap
    ? `<div style="${cfg.headerWrap}">
        <div style="${cfg.brandStyle}">${logoHtml}${bizName}<div style="font-size:11px;margin-top:2px;">Sales Invoice</div></div>
        <div style="${cfg.metaStyle}">
          <div style="font-size:${cfg.numSize};font-weight:${cfg.numWeight};color:${cfg.numColor};font-variant-numeric:tabular-nums;margin-bottom:${cfg.numMarginBottom || '4px'};">INV-2025-001</div>
          <div style="font-size:11px;color:#71717a;margin-top:4px;">Issued 22 Jun 2025</div>
          <span style="display:inline-block;margin-top:6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding:3px 8px;${cfg.badge}">Paid</span>
        </div>
      </div>`
    : `<div style="display:flex;justify-content:space-between;align-items:flex-start;${cfg.headerExtra || `margin-bottom:${cfg.headerMb};`}">
        <div>${logoHtml}
          <div style="font-size:${cfg.brandSize};font-weight:${cfg.brandWeight};color:${cfg.brandColor};letter-spacing:-0.5px;">${bizName}</div>
          <div style="font-size:11px;color:${cfg.subColor};margin-top:2px;">Sales Invoice</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:${cfg.numSize};font-weight:${cfg.numWeight};color:${cfg.numColor};letter-spacing:${cfg.numSpacing};line-height:1;font-variant-numeric:tabular-nums;margin-bottom:${cfg.numMarginBottom};">INV-2025-001</div>
          <div style="font-size:11px;color:${cfg.subColor};margin-top:4px;">Issued 22 Jun 2025</div>
          <span style="display:inline-block;margin-top:6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;padding:3px 8px;${cfg.badge}">Paid</span>
        </div>
      </div>`

  const bodyContent = `
  ${cfg.divider || ''}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:${cfg.cardGap};margin-bottom:28px;">
    <div style="${cfg.card}">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${cfg.lbl};margin-bottom:8px;">From</div>
      <div style="font-size:15px;font-weight:600;color:#09090b;margin-bottom:4px;">${bizName}</div>
      <div style="font-size:12px;color:#52525b;">GSTIN: ${gstin}</div>
      <div style="font-size:12px;color:#52525b;">${email}</div>
    </div>
    <div style="${cfg.card}">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${cfg.lbl};margin-bottom:8px;">Bill To</div>
      <div style="font-size:15px;font-weight:600;color:#09090b;margin-bottom:4px;">Acme Corp Pvt. Ltd.</div>
      <div style="font-size:12px;color:#52525b;">accounts@acme.co</div>
      <div style="font-size:12px;color:#52525b;">+91 98765 43210</div>
    </div>
  </div>
  <div style="display:flex;gap:${cfg.dateGap};margin-bottom:28px;">
    <div style="${cfg.dateCard}">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${cfg.dateLbl};margin-bottom:4px;">Invoice Date</div>
      <div style="font-size:13px;font-weight:600;color:#09090b;">22 Jun 2025</div>
    </div>
    <div style="${cfg.dateCard}">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${cfg.dateLbl};margin-bottom:4px;">Due Date</div>
      <div style="font-size:13px;font-weight:600;color:#09090b;">22 Jul 2025</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead><tr style="background:${cfg.theadBg};color:${cfg.theadColor};${cfg.theadBorder}">
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Product / Description</th>
      <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;">Qty</th>
      <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;">Unit Price</th>
      <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;">Tax</th>
      <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;">Amount</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
    <div style="width:280px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:${cfg.totalsColor};border-bottom:1px solid #f4f4f5;"><span>Subtotal</span><span>₹1,06,000</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:${cfg.totalsColor};border-bottom:1px solid #f4f4f5;"><span>Tax (18%)</span><span>₹19,080</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;${cfg.grand}"><span>Grand Total</span><span>₹1,25,080</span></div>
    </div>
  </div>
  <div style="${cfg.noteBox}">
    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${cfg.noteLbl};margin-bottom:6px;">Notes</div>
    <div style="font-size:13px;color:${cfg.noteText};line-height:1.6;">Payment due within 30 days. Bank transfer preferred. Thank you for your business!</div>
  </div>
  <div style="${cfg.footer}">
    <span style="font-size:11px;color:${cfg.footerNote};">Generated by OpenLedger · 22 Jun 2025</span>
    <span style="font-size:11px;color:${cfg.footerNote};">This is a computer-generated document.</span>
  </div>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:#18181b;background:#fff;${t==='retro'?'font-family:"Courier New",Courier,monospace;background:#fefce8;':''}${t==='elegant'?'background:#fdfaf5;':''}}
</style></head><body>
<div style="${cfg.pageStyle}">
  ${headerHtml}
  ${cfg.bodyStyle ? `<div style="${cfg.bodyStyle}">${bodyContent}</div>` : bodyContent}
</div>
</body></html>`
}

// ── Roles Tab ─────────────────────────────────────────────────────────────────
const PAGES = [
  { key: 'products', label: 'Products', tabs: [
    { key: 'products',  label: 'Products',  actions: ['view','add','edit','delete','cart'] },
    { key: 'category',  label: 'Category',  actions: ['view','add','edit','delete'] },
    { key: 'wishlist',  label: 'Wish List', actions: ['view','add','edit','delete','cart'] },
    { key: 'orders',    label: 'Orders',    actions: ['view','delete'] },
  ]},
  { key: 'stock', label: 'Stock', tabs: [
    { key: 'levels',     label: 'Levels',     actions: ['view','cart','delete'] },
    { key: 'movements',  label: 'Movements',  actions: ['view'] },
    { key: 'adjustment', label: 'Adjustment', actions: ['view','add'] },
  ]},
  { key: 'general_orders', label: 'General Orders', tabs: [
    { key: 'gen_orders',   label: 'Orders',     actions: ['view','add','status','email','delete'] },
    { key: 'gen_invoices', label: 'Invoice',    actions: ['view','add','status','email','delete'] },
    { key: 'recipients',   label: 'Recipients', actions: ['view','add','edit','delete'] },
    { key: 'recurring',    label: 'Recurring',  actions: ['view','add','status','edit','delete'] },
  ]},
  { key: 'purchase_orders', label: 'Purchase Orders', tabs: [
    { key: 'po',      label: 'Purchase Orders', actions: ['view','add','status','email','delete'] },
    { key: 'grn',     label: 'Goods Receipt',   actions: ['view','add','delete'] },
    { key: 'po_inv',  label: 'Invoice',         actions: ['view','add','status','email','delete'] },
    { key: 'vendors', label: 'Vendors',         actions: ['view','add','edit','delete'] },
  ]},
  { key: 'sales_orders', label: 'Sales Orders', tabs: [
    { key: 'so',       label: 'Sales Orders', actions: ['view','add','status','email','delete'] },
    { key: 'delivery', label: 'Delivery',     actions: ['view','add','delete'] },
    { key: 'so_inv',   label: 'Invoice',      actions: ['view','add','status','email','delete'] },
    { key: 'customers',label: 'Customers',    actions: ['view','add','edit','delete'] },
  ]},
  { key: 'finance', label: 'Finance', tabs: [
    { key: 'overview',     label: 'Overview',     actions: ['view'] },
    { key: 'transactions', label: 'Transactions', actions: ['view','add','edit','delete'] },
    { key: 'budget',       label: 'Budget',       actions: ['view','add','edit','delete'] },
    { key: 'ap_ar',        label: 'AP/AR',        actions: ['view'] },
  ]},
  { key: 'cart', label: 'Cart', tabs: [] },
  { key: 'settings', label: 'Settings', tabs: [
    { key: 'team',          label: 'Team',          actions: ['view','add','edit','delete'] },
    { key: 'roles',         label: 'Roles',         actions: ['view','add','edit','delete'] },
    { key: 'workspace',     label: 'Workspace',     actions: ['view','edit','delete'] },
    { key: 'configuration', label: 'Configuration', actions: ['view','edit'] },
  ], alwaysAccessible: true },
]

const ALL_ACTIONS = ['view','add','edit','delete','status','email','cart','place_order']
const ACTION_LABELS = { view:'View', add:'Add', edit:'Edit', delete:'Delete', status:'Status', email:'Email', cart:'Cart', place_order:'Place Order' }

const buildBlankPermissions = () => {
  const perms = []
  for (const page of PAGES) {
    perms.push({ page: page.key, tab: null, view: false, place_order: false })
    for (const tab of page.tabs) {
      const entry = { page: page.key, tab: tab.key }
      for (const a of ALL_ACTIONS) entry[a] = false
      perms.push(entry)
    }
  }
  return perms
}
const BLANK_PERMISSIONS = buildBlankPermissions()

function PermCheckbox({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0
        ${checked
          ? 'bg-zinc-900 border-zinc-900 text-white'
          : 'bg-white border border-zinc-300 text-transparent'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-500'}`}
    >
      <Check size={11} strokeWidth={3} />
    </button>
  )
}

function RoleForm({ open, onClose, editing }) {
  const { mutate: create, isPending: creating } = useCreateRole()
  const { mutate: update, isPending: updating } = useUpdateRole()
  const saving = creating || updating

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault]     = useState(false)
  const [permissions, setPermissions] = useState(BLANK_PERMISSIONS)
  const [expanded, setExpanded]       = useState({})

  const togglePage = (pageKey) => setExpanded((e) => ({ ...e, [pageKey]: !e[pageKey] }))

  useEffect(() => {
    if (editing) {
      setName(editing.name || '')
      setDescription(editing.description || '')
      setIsDefault(editing.isDefault || false)
      // Rebuild permissions from saved data
      setPermissions(buildBlankPermissions().map((blank) => {
        const saved = editing.permissions?.find(
          (p) => p.page === blank.page && (p.tab ?? null) === (blank.tab ?? null)
        )
        return saved ? { ...blank, ...saved } : blank
      }))
    } else {
      setName(''); setDescription(''); setIsDefault(false)
      setPermissions(BLANK_PERMISSIONS)
      setExpanded({})
    }
  }, [editing, open])

  const setPerm = (page, tab, field, val) => {
    setPermissions((prev) => prev.map((p) =>
      p.page === page && (p.tab ?? null) === (tab ?? null) ? { ...p, [field]: val } : p
    ))
  }

  // Toggle page-level view — if turning off, also uncheck all tabs underneath
  const setPageView = (pageKey, val) => {
    setPermissions((prev) => prev.map((p) => {
      if (p.page !== pageKey) return p
      if (p.tab === null) return { ...p, view: val, place_order: val ? p.place_order : false }
      // If page view turned off, disable all tab perms
      if (!val) {
        const reset = { ...p }
        for (const a of ALL_ACTIONS) reset[a] = false
        return reset
      }
      return p
    }))
  }

  // Toggle all actions for a single tab row
  const toggleTabAll = (pageKey, tabKey, tabActions, val) => {
    setPermissions((prev) => prev.map((p) => {
      if (p.page !== pageKey || p.tab !== tabKey) return p
      const updated = { ...p }
      for (const a of tabActions) updated[a] = val
      return updated
    }))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const data = { name: name.trim(), description: description.trim(), isDefault, permissions }
    if (editing) {
      update({ id: editing._id, data }, { onSuccess: onClose })
    } else {
      create(data, { onSuccess: onClose })
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-3xl md:rounded-2xl rounded-t-3xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle bar (mobile) */}
        <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mt-3 md:hidden flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-zinc-900">{editing ? 'Edit Role' : 'New Role'}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-700">
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Top fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Role Title</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Manager"
                className="border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this role do?"
                className="border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Default Role</label>
              <select
                value={isDefault ? 'yes' : 'no'}
                onChange={(e) => setIsDefault(e.target.value === 'yes')}
                className="border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Permissions accordion */}
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Permissions</p>
            <div className="flex flex-col gap-2">
              {PAGES.map((page) => {
                const pagePerm = permissions.find((p) => p.page === page.key && p.tab === null) || {}
                const pageOn   = page.alwaysAccessible ? true : !!pagePerm.view
                const isOpen   = !!expanded[page.key]

                return (
                  <div key={page.key} className="border border-zinc-200 rounded-xl overflow-hidden">
                    {/* Page header row */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50">
                      {/* Expand toggle (only if has tabs) */}
                      {page.tabs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => togglePage(page.key)}
                          className="text-zinc-400 hover:text-zinc-700 transition-colors flex-shrink-0"
                        >
                          <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                        </button>
                      ) : (
                        <span className="w-[15px] flex-shrink-0" />
                      )}

                      {/* Page name */}
                      <span className="flex-1 text-sm font-bold text-zinc-800">{page.label}</span>

                      {/* Page-level VIEW toggle — hidden for always-accessible pages */}
                      {page.alwaysAccessible ? (
                        <span className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wide px-2 py-0.5 bg-emerald-50 rounded-full">Always On</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide">Page Access</span>
                          <PermCheckbox
                            checked={pageOn}
                            onChange={(val) => { setPageView(page.key, val); if (val && page.tabs.length > 0) setExpanded((e) => ({ ...e, [page.key]: true })) }}
                          />
                        </div>
                      )}

                      {/* Cart: place_order */}
                      {page.key === 'cart' && (
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide">Place Order</span>
                          <PermCheckbox
                            checked={!!pagePerm.place_order}
                            onChange={(val) => setPerm(page.key, null, 'place_order', val)}
                            disabled={!pageOn}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tabs sub-table */}
                    {isOpen && page.tabs.length > 0 && (() => {
                      // Collect all unique actions across tabs for this page
                      const pageActions = [...new Set(page.tabs.flatMap((t) => t.actions))]
                      return (
                        <div className="border-t border-zinc-100">
                          {/* Sub-header */}
                          <div className="grid bg-white border-b border-zinc-100 px-4 py-2"
                            style={{ gridTemplateColumns: `180px repeat(${pageActions.length}, 1fr)` }}>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Tab</span>
                            {pageActions.map((a) => (
                              <span key={a} className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide text-center">{ACTION_LABELS[a]}</span>
                            ))}
                          </div>
                          {/* Tab rows */}
                          {page.tabs.map((tab, ti) => {
                            const tabPerm   = permissions.find((p) => p.page === page.key && p.tab === tab.key) || {}
                            const tabAllOn  = tab.actions.every((a) => !!tabPerm[a])
                            return (
                              <div
                                key={tab.key}
                                className={`grid items-center px-4 py-2.5 ${ti < page.tabs.length - 1 ? 'border-b border-zinc-50' : ''}`}
                                style={{ gridTemplateColumns: `180px repeat(${pageActions.length}, 1fr)` }}
                              >
                                {/* Tab label — click to toggle all actions for this tab */}
                                <button
                                  type="button"
                                  onClick={() => toggleTabAll(page.key, tab.key, tab.actions, !tabAllOn)}
                                  disabled={!pageOn}
                                  className="text-xs text-zinc-600 font-medium text-left hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  {tab.label}
                                </button>
                                {pageActions.map((action) => {
                                  const applicable = tab.actions.includes(action)
                                  return (
                                    <div key={action} className="flex justify-center">
                                      {applicable ? (
                                        <PermCheckbox
                                          checked={!!tabPerm[action]}
                                          onChange={(val) => setPerm(page.key, tab.key, action, val)}
                                          disabled={!pageOn}
                                        />
                                      ) : (
                                        <span className="text-zinc-200 text-sm select-none">—</span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">Enable Page Access first to configure tab permissions. Click a tab name to toggle all its actions.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-700">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-5 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl disabled:opacity-50 active:bg-zinc-700"
          >
            {saving ? 'Saving…' : editing ? 'Update Role' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Inline permission mini-table used in expanded row and mobile card
function PermMiniTable({ role }) {
  const perms = role.permissions || []
  return (
    <div className="w-full grid grid-cols-2 xl:grid-cols-3 gap-2">
      {PAGES.map((page) => {
        const pagePerm = perms.find((p) => p.page === page.key && (p.tab ?? null) === null)
        const pageOn   = !!pagePerm?.view
        const pageActions = [...new Set(page.tabs.flatMap((t) => t.actions))]

        return (
          <div key={page.key} className="border border-zinc-100 rounded-lg overflow-hidden">
            {/* Page header */}
            <div className={`flex items-center justify-between px-3 py-1.5 ${pageOn ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
              <span className={`text-[11px] font-bold uppercase tracking-wide ${pageOn ? 'text-white' : 'text-zinc-400'}`}>{page.label}</span>
              <div className="flex items-center gap-1.5">
                {page.key === 'cart' && !!pagePerm?.place_order && (
                  <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-medium">Place Order</span>
                )}
                {pageOn
                  ? <Check size={11} className="text-emerald-400" strokeWidth={3} />
                  : <X size={11} className="text-zinc-400" strokeWidth={2.5} />}
              </div>
            </div>
            {/* Tabs */}
            {page.tabs.length > 0 && (
              <div>
                {/* Sub-header */}
                <div className="grid bg-zinc-50 border-b border-zinc-100 px-3 py-1"
                  style={{ gridTemplateColumns: `1fr repeat(${pageActions.length}, 40px)` }}>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Tab</span>
                  {pageActions.map((a) => (
                    <span key={a} className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide text-center">{ACTION_LABELS[a]}</span>
                  ))}
                </div>
                {page.tabs.map((tab, ti) => {
                  const tabPerm = perms.find((p) => p.page === page.key && p.tab === tab.key) || {}
                  return (
                    <div
                      key={tab.key}
                      className={`grid items-center px-3 py-1 ${ti < page.tabs.length - 1 ? 'border-b border-zinc-50' : ''} ${ti % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}`}
                      style={{ gridTemplateColumns: `1fr repeat(${pageActions.length}, 40px)` }}
                    >
                      <span className="text-[11px] text-zinc-600 font-medium">{tab.label}</span>
                      {pageActions.map((action) => {
                        const applicable = tab.actions.includes(action)
                        return (
                          <div key={action} className="flex justify-center">
                            {applicable
                              ? tabPerm[action]
                                ? <Check size={11} className="text-emerald-500" strokeWidth={3} />
                                : <X size={11} className="text-zinc-300" strokeWidth={2.5} />
                              : <span className="text-zinc-100 text-xs">—</span>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Mobile accordion card
function RoleMobileCard({ role, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const permCount = role.permissions?.filter((p) => p.tab === null && p.view).length || 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={16} className="text-zinc-600" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => setOpen((o) => !o)}>
          <p className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            {role.name}
            {role.isDefault && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Default</span>}
          </p>
          <p className="text-xs text-zinc-500">{role.description || `${permCount} module${permCount !== 1 ? 's' : ''} with access`}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!role.isSystem && <button onClick={() => onEdit(role)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><Pencil size={14} /></button>}
          {!role.isSystem && <button onClick={() => onDelete(role._id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"><Trash2 size={14} /></button>}
          {role.isSystem && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-400 uppercase tracking-wide">System</span>}
          <button onClick={() => setOpen((o) => !o)} className={`p-2 rounded-lg text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-zinc-100 px-4 pb-4">
          <PermMiniTable role={role} />
        </div>
      )}
    </div>
  )
}

function RolesTab({ openAddRef, mobileFiltersOpen, onMobileFiltersOpenChange, canEdit = true, canDelete = true }) {
  const { data: roles = [], isLoading } = useRoles()
  const { mutate: deleteRole } = useDeleteRole()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [nameFilter, setNameFilter] = useState('')
  const [dropSel, setDropSel]   = useState([])

  const [expanded, setExpanded] = useState({})
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const openCreate = useCallback(() => { setEditing(null); setFormOpen(true) }, [])
  useEffect(() => { if (openAddRef) openAddRef.current = openCreate }, [openCreate, openAddRef])

  const openEdit     = (role) => { setEditing(role); setFormOpen(true) }
  const handleDelete = (id)   => { if (confirm('Delete this role?')) deleteRole(id) }

  const ROLE_COLS = [{ key: 'name', label: 'name', filterable: true }]
  const nameOpts  = [...new Set(roles.map((r) => r.name).filter(Boolean))]

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
    (dropSel.length === 0 || dropSel.includes(r.name))
  )

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex flex-col gap-4 md:flex-1 md:min-h-0">
      <DataTableMobileFilters
        columns={ROLE_COLS}
        filters={{ name: nameFilter }}
        onFilterChange={(key, val) => { if (key === 'name') setNameFilter(val) }}
        dropOpts={{ name: nameOpts }}
        dropSel={{ name: dropSel }}
        onDropChange={(key, vals) => setDropSel(vals)}
        open={mobileFiltersOpen}
      />

      {/* Desktop DataTable */}
      {roles.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No roles yet" description="Create roles to define what your team members can access" />
      ) : (
        <DataTable
          leadingCol
          columns={[
            { key: 'name',        label: 'Role',        filterable: true },
            { key: 'description', label: 'Description' },
            { key: 'default',     label: 'Default'     },
            { key: 'action',      label: 'Action'      },
          ]}
          data={filtered}
          filters={{ name: nameFilter }}
          onFilterChange={(key, val) => { if (key === 'name') setNameFilter(val) }}
          dropOpts={{ name: nameOpts }}
          dropSel={{ name: dropSel }}
          onDropChange={(key, vals) => setDropSel(vals)}
          renderRow={(role) => (
            <React.Fragment key={role._id}>
              <tr
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(role._id)}
              >
                <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${expanded[role._id] ? '' : '-rotate-90'}`}
                  />
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={13} className="text-zinc-600" />
                    </div>
                    {role.name}
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 max-w-[200px] truncate text-sm">
                  {role.description || '—'}
                </td>
                <td className="px-4 py-3 border-r border-zinc-100">
                  {role.isDefault
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Yes</span>
                    : <span className="text-xs text-zinc-400">No</span>}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {role.isSystem
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-400 uppercase tracking-wide">System</span>
                      : <>
                          {canEdit   && <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit"><Pencil size={14} /></button>}
                          {canDelete && <button onClick={() => handleDelete(role._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>}
                        </>}
                  </div>
                </td>
              </tr>
              {expanded[role._id] && (
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <td />
                  <td colSpan={4} className="px-4 py-4">
                    <PermMiniTable role={role} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          )}
          emptyMessage="No roles found"
          mobileFiltersOpen={mobileFiltersOpen}
          onMobileFiltersOpenChange={onMobileFiltersOpenChange}
        />
      )}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0
          ? <EmptyState icon={ShieldCheck} title="No roles yet" description="Create roles to define what your team members can access" />
          : filtered.map((r) => (
              <RoleMobileCard key={r._id} role={r} onEdit={openEdit} onDelete={handleDelete} />
            ))
        }
      </div>

      <RoleForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState('profile')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const openGroupAdd = useRef(null)
  const openRoleAdd  = useRef(null)

  // Detect active group type for context-aware copy
  const { activeGroupId } = useGroupStore()
  const { data: groups = [] } = useGroups()
  const activeGroup = groups.find((g) => g._id === activeGroupId)
  const isBusiness = activeGroup?.type === 'business'

  // Business-only permission gates (hooks always called, ignored for personal)
  const canViewTeam   = usePermission('settings', 'team',          'view')
  const canViewRoles  = usePermission('settings', 'roles',         'view')
  const canViewWS     = usePermission('settings', 'workspace',     'view')
  const canViewConfig = usePermission('settings', 'configuration', 'view')
  const canAddTeam    = usePermission('settings', 'team',          'add')
  const canEditTeam   = usePermission('settings', 'team',          'edit')
  const canDeleteTeam = usePermission('settings', 'team',          'delete')
  const canAddRole    = usePermission('settings', 'roles',         'add')
  const canEditRole   = usePermission('settings', 'roles',         'edit')
  const canDeleteRole = usePermission('settings', 'roles',         'delete')
  const canAddWS      = usePermission('settings', 'workspace',     'add')
  const canEditWS     = usePermission('settings', 'workspace',     'edit')
  const canDeleteWS   = usePermission('settings', 'workspace',     'delete')
  const canEditConfig = usePermission('settings', 'configuration', 'edit')

  const TABS = [
    { key: 'profile', label: 'My Profile', mobileLabel: 'Profile' },
    ...(!isBusiness || canViewTeam
      ? [{ key: 'friends', label: isBusiness ? 'Team' : 'Friends', mobileLabel: isBusiness ? 'Team' : 'Friends' }]
      : []),
    ...(isBusiness && canViewRoles
      ? [{ key: 'roles', label: 'Roles', mobileLabel: 'Roles' }]
      : []),
    ...(!isBusiness || canViewWS
      ? [{ key: 'groups', label: isBusiness ? 'Workspaces' : 'Groups', mobileLabel: isBusiness ? 'Spaces' : 'Groups' }]
      : []),
    ...(!isBusiness || canViewConfig
      ? [{ key: 'configuration', label: 'Configuration', mobileLabel: 'Config' }]
      : []),
  ]

  const handleTabChange = (key) => {
    setTab(key)
    setShowAddFriend(false)
    setMobileFiltersOpen(false)
  }

  return (
    <>
      <TopBar
        title="Settings"
        filterIcon={(tab === 'friends' || tab === 'groups' || tab === 'roles') && (
          <DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />
        )}
        right={
          <div className="flex items-center">
            {tab === 'friends' && !showAddFriend && (!isBusiness || canAddTeam) && (
              <button onClick={() => setShowAddFriend(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white active:bg-zinc-700 transition-colors">
                <UserPlus size={20} />
              </button>
            )}
            {tab === 'groups' && (!isBusiness || canAddWS) && (
              <button onClick={() => openGroupAdd.current?.()} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white active:bg-zinc-700 transition-colors">
                <Plus size={20} />
              </button>
            )}
            {tab === 'roles' && canAddRole && (
              <button onClick={() => openRoleAdd.current?.()} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white active:bg-zinc-700 transition-colors">
                <Plus size={20} />
              </button>
            )}
          </div>
        }
      />
      <div className="md:px-0 md:flex md:flex-col md:flex-1 md:min-h-0">
        {/* Tab bar — fixed below TopBar on mobile, static on desktop */}
        <div className="flex items-center justify-between gap-4 flex-shrink-0
                        sticky top-14 z-10 bg-transparent px-4 py-4
                        md:static md:top-auto md:bg-transparent md:px-0 md:py-0 md:mb-4">
          <Tabs tabs={TABS} active={tab} onChange={handleTabChange} />
          <PageActions add={
            tab === 'friends' && !showAddFriend && (!isBusiness || canAddTeam)
              ? <Button size="sm" onClick={() => setShowAddFriend(true)}><UserPlus size={15} /> {isBusiness ? 'Add colleague' : 'Add friend'}</Button>
              : tab === 'groups' && (!isBusiness || canAddWS)
              ? <Button size="sm" onClick={() => openGroupAdd.current?.()}><Plus size={15} /> {isBusiness ? 'New workspace' : 'New group'}</Button>
              : tab === 'roles' && canAddRole
              ? <Button size="sm" onClick={() => openRoleAdd.current?.()}><Plus size={15} /> New role</Button>
              : null
          } />
        </div>

        {/* Content — scrolls internally on desktop, naturally on mobile */}
        <div className="px-4 pb-5 md:px-0 md:pb-4 md:flex-1 md:min-h-0 md:overflow-y-auto md:flex md:flex-col">
          {tab === 'profile'       && <ProfileTab isBusiness={isBusiness} />}
          {tab === 'friends'       && <FriendsTab showAddForm={showAddFriend} setShowAddForm={setShowAddFriend} mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} isBusiness={isBusiness} canEdit={!isBusiness || canEditTeam} canDelete={!isBusiness || canDeleteTeam} />}
          {tab === 'groups'        && <GroupsTab openAddRef={openGroupAdd} mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} isBusiness={isBusiness} canEdit={!isBusiness || canEditWS} canDelete={!isBusiness || canDeleteWS} />}
          {tab === 'roles'         && <RolesTab openAddRef={openRoleAdd} mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} canEdit={canEditRole} canDelete={canDeleteRole} />}
          {tab === 'configuration' && <ConfigurationTab canEdit={!isBusiness || canEditConfig} />}
        </div>
      </div>
    </>
  )
}
