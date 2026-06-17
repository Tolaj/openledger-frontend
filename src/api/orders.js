import api from '../lib/axios'

export const getOrders  = (groupId) => api.get('/orders', { params: { groupId } })
export const getOrder   = (id) => api.get(`/orders/${id}`)
export const createOrder = (data) => api.post('/orders', data)
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data)
export const deleteOrder = (id) => api.delete(`/orders/${id}`)
