import api from '../lib/axios'

export const getCustomers   = (groupId) => api.get('/customers', { params: { groupId } })
export const getCustomer    = (id, groupId) => api.get(`/customers/${id}`, { params: { groupId } })
export const createCustomer = (data, groupId) => api.post('/customers', data, { params: { groupId } })
export const updateCustomer = (id, data, groupId) => api.put(`/customers/${id}`, data, { params: { groupId } })
export const deleteCustomer = (id, groupId) => api.delete(`/customers/${id}`, { params: { groupId } })
