import api from '../lib/axios'

export const getPurchaseOrders  = (groupId) => api.get('/purchase-orders', { params: { groupId } })
export const getPurchaseOrder   = (id, groupId) => api.get(`/purchase-orders/${id}`, { params: { groupId } })
export const createPurchaseOrder = (data, groupId) => api.post('/purchase-orders', data, { params: { groupId } })
export const updatePurchaseOrder = (id, data, groupId) => api.put(`/purchase-orders/${id}`, data, { params: { groupId } })
export const deletePurchaseOrder = (id, groupId) => api.delete(`/purchase-orders/${id}`, { params: { groupId } })
export const sendPurchaseOrder   = (id, groupId, data) => api.post(`/purchase-orders/${id}/send`, data, { params: { groupId } })
export const getPurchaseOrderPDF = (id, groupId, disposition = 'inline') =>
  api.get(`/purchase-orders/${id}/pdf`, { params: { groupId, disposition }, responseType: 'blob' })
