import api from '../lib/axios'

export const getVendors    = (groupId) => api.get('/vendors', { params: { groupId } })
export const getVendor     = (id, groupId) => api.get(`/vendors/${id}`, { params: { groupId } })
export const createVendor  = (data, groupId) => api.post('/vendors', data, { params: { groupId } })
export const updateVendor  = (id, data, groupId) => api.put(`/vendors/${id}`, data, { params: { groupId } })
export const deleteVendor  = (id, groupId) => api.delete(`/vendors/${id}`, { params: { groupId } })
