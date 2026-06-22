import api from '../lib/axios'

export const getDeliveries   = (groupId) => api.get('/deliveries', { params: { groupId } })
export const getDelivery     = (id, groupId) => api.get(`/deliveries/${id}`, { params: { groupId } })
export const createDelivery  = (data, groupId) => api.post('/deliveries', data, { params: { groupId } })
export const updateDelivery  = (id, data, groupId) => api.put(`/deliveries/${id}`, data, { params: { groupId } })
export const deleteDelivery  = (id, groupId) => api.delete(`/deliveries/${id}`, { params: { groupId } })
