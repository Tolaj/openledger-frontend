import api from '../lib/axios'

export const getInventory    = (groupId) => api.get('/inventory', { params: { groupId } })
export const createInventory = (data) => api.post('/inventory', data)
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data)
export const deleteInventory = (id) => api.delete(`/inventory/${id}`)
