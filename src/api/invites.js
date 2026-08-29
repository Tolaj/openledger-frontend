import api from '../lib/axios'

export const getPendingInvites = () => api.get('/invites/pending')
export const acceptInvite = (id) => api.post(`/invites/${id}/accept`)
export const declineInvite = (id) => api.post(`/invites/${id}/decline`)
export const getInviteByToken = (token) => api.get(`/invites/token/${token}`)
export const getPendingForGroup = (groupId) => api.get(`/invites/group/${groupId}`)
