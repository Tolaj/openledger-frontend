import api from '../lib/axios'

export const getTemplates = (userId, type) =>
  api.get('/templates', { params: { ...(userId ? { userId } : {}), ...(type ? { type } : {}) } })
export const createTemplate = (data) => api.post('/templates', data)
export const deleteTemplate = (id) => api.delete(`/templates/${id}`)
export const applyTemplate = (data) => api.post('/apply-template', data)
