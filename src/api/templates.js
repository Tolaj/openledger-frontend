import api from '../lib/axios'

export const getTemplates = (userId) =>
  api.get('/templates', { params: userId ? { userId } : undefined })
export const createTemplate = (data) => api.post('/templates', data)
export const deleteTemplate = (id) => api.delete(`/templates/${id}`)
export const applyTemplate = (data) => api.post('/apply-template', data)
