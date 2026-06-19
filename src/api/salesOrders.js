import api from '../lib/axios'

export const getSalesOrders   = (groupId) => api.get('/sales-orders', { params: { groupId } })
export const getSalesOrder    = (id, groupId) => api.get(`/sales-orders/${id}`, { params: { groupId } })
export const createSalesOrder = (data, groupId) => api.post('/sales-orders', data, { params: { groupId } })
export const updateSalesOrder = (id, data, groupId) => api.put(`/sales-orders/${id}`, data, { params: { groupId } })
export const deleteSalesOrder = (id, groupId) => api.delete(`/sales-orders/${id}`, { params: { groupId } })
