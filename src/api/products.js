import api from '../lib/axios'

export const getProducts = (groupId) => api.get('/products', { params: { groupId } })
export const getProduct  = (id) => api.get(`/products/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const convertCurrency = (rate) => api.post('/products/convert-currency', { rate })
