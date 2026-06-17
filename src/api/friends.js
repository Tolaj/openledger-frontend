import api from '../lib/axios'

export const sendFriendRequest = (data) => api.post('/friends/send', data)
export const respondFriendRequest = (data) => api.post('/friends/receive', data)
