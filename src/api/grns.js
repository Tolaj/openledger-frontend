import api from '../lib/axios'

export const getGRNs    = (groupId) => api.get('/grns', { params: { groupId } })
export const getGRN     = (id, groupId) => api.get(`/grns/${id}`, { params: { groupId } })
export const createGRN  = (data, groupId) => api.post('/grns', data, { params: { groupId } })
export const deleteGRN  = (id, groupId) => api.delete(`/grns/${id}`, { params: { groupId } })
