import api from '../lib/axios'

export const getGeneralOrders   = (groupId) => api.get('/general-orders', { params: { groupId } })
export const getGeneralOrder    = (id, groupId) => api.get(`/general-orders/${id}`, { params: { groupId } })
export const createGeneralOrder = (data, groupId) => api.post('/general-orders', data, { params: { groupId } })
export const updateGeneralOrder = (id, data, groupId) => api.put(`/general-orders/${id}`, data, { params: { groupId } })
export const deleteGeneralOrder = (id, groupId) => api.delete(`/general-orders/${id}`, { params: { groupId } })
export const getGeneralOrderPDF = (id, groupId, disposition = 'inline') =>
  api.get(`/general-orders/${id}/pdf`, { params: { groupId, disposition }, responseType: 'blob' })
export const sendGeneralOrder   = (id, groupId, data) => api.post(`/general-orders/${id}/send`, data, { params: { groupId } })
