import api from '../lib/axios'

export const getSalesInvoices  = (groupId) => api.get('/sales-invoices', { params: { groupId } })
export const getSalesInvoice   = (id, groupId) => api.get(`/sales-invoices/${id}`, { params: { groupId } })
export const createSalesInvoice = (data, groupId) => api.post('/sales-invoices', data, { params: { groupId } })
export const updateSalesInvoice = (id, data, groupId) => api.put(`/sales-invoices/${id}`, data, { params: { groupId } })
export const deleteSalesInvoice = (id, groupId) => api.delete(`/sales-invoices/${id}`, { params: { groupId } })
