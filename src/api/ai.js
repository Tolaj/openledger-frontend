import api from '../lib/axios'

export const scanReceipt    = (data)          => api.post('/ai/scan-receipt', data)
export const suggestProduct = (data)          => api.post('/ai/suggest-product', data)
export const getInsights    = (groupId)       => api.post('/ai/insights', { groupId })
export const chat           = (data)          => api.post('/ai/chat', data)
