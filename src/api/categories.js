import api from '../lib/axios'

export const getCategories = (groupId) => api.get('/categories', { params: { groupId } })
export const getCategory   = (id) => api.get(`/categories/${id}`)
export const createCategory = (data) => api.post('/categories', data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)
