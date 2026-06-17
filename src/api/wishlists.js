import api from '../lib/axios'

export const getWishlists  = (groupId) => api.get('/wishlists', { params: { groupId } })
export const getWishlist   = (id) => api.get(`/wishlists/${id}`)
export const createWishlist = (data) => api.post('/wishlists', data)
export const updateWishlist = (id, data) => api.put(`/wishlists/${id}`, data)
export const deleteWishlist = (id) => api.delete(`/wishlists/${id}`)
