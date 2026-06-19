import api from '../lib/axios'

export const getPurchaseInvoices  = (groupId) => api.get('/purchase-invoices', { params: { groupId } })
export const getPurchaseInvoice   = (id, groupId) => api.get(`/purchase-invoices/${id}`, { params: { groupId } })
export const createPurchaseInvoice = (data, groupId) => api.post('/purchase-invoices', data, { params: { groupId } })
export const updatePurchaseInvoice = (id, data, groupId) => api.put(`/purchase-invoices/${id}`, data, { params: { groupId } })
export const deletePurchaseInvoice = (id, groupId) => api.delete(`/purchase-invoices/${id}`, { params: { groupId } })
