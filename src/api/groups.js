import api from '../lib/axios'

export const getGroups = () => api.get('/groups')
export const getGroup = (id) => api.get(`/groups/${id}`)
export const createGroup = (data) => api.post('/groups', data)
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data)
export const deleteGroup = (id) => api.delete(`/groups/${id}`)
