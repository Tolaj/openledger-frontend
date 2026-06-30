import api from '../lib/axios'

export const getRecurrings   = (groupId) => api.get('/recurring', { params: { groupId } })
export const getRecurringLogs = (groupId) => api.get('/recurring/logs', { params: { groupId } })
export const getRecurring    = (id, groupId) => api.get(`/recurring/${id}`, { params: { groupId } })
export const createRecurring = (data, groupId) => api.post('/recurring', data, { params: { groupId } })
export const updateRecurring = (id, data, groupId) => api.put(`/recurring/${id}`, data, { params: { groupId } })
export const deleteRecurring = (id, groupId) => api.delete(`/recurring/${id}`, { params: { groupId } })
