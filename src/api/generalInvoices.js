import api from '../lib/axios'

export const getGeneralInvoices   = (groupId) => api.get('/general-invoices', { params: { groupId } })
export const getGeneralInvoice    = (id, groupId) => api.get(`/general-invoices/${id}`, { params: { groupId } })
export const createGeneralInvoice = (data, groupId) => api.post('/general-invoices', data, { params: { groupId } })
export const updateGeneralInvoice = (id, data, groupId) => api.put(`/general-invoices/${id}`, data, { params: { groupId } })
export const deleteGeneralInvoice  = (id, groupId) => api.delete(`/general-invoices/${id}`, { params: { groupId } })
export const getGeneralInvoicePDF  = (id, groupId, disposition = 'inline') =>
  api.get(`/general-invoices/${id}/pdf`, { params: { groupId, disposition }, responseType: 'blob' })
export const sendGeneralInvoice    = (id, groupId, data) => api.post(`/general-invoices/${id}/send`, data, { params: { groupId } })
