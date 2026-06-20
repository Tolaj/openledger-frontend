import api from '../lib/axios'

export const getRecipients   = (groupId) => api.get('/recipients', { params: { groupId } })
export const getRecipient    = (id, groupId) => api.get(`/recipients/${id}`, { params: { groupId } })
export const createRecipient = (data, groupId) => api.post('/recipients', data, { params: { groupId } })
export const updateRecipient = (id, data, groupId) => api.put(`/recipients/${id}`, data, { params: { groupId } })
export const deleteRecipient = (id, groupId) => api.delete(`/recipients/${id}`, { params: { groupId } })
