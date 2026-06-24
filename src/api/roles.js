import api from '../lib/axios'

export const getRoles    = (groupId)       => api.get('/roles', { params: { groupId } })
export const createRole  = (data)          => api.post('/roles', data)
export const updateRole  = (id, data)      => api.put(`/roles/${id}`, data)
export const deleteRole  = (id, groupId)   => api.delete(`/roles/${id}`, { params: { groupId } })
