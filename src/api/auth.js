import api from '../lib/axios'

export const getSession = () => api.get('/auth/session')
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const logout = () => api.post('/auth/logout')
