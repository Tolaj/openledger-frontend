import api from '../lib/axios'

export const getStockMovements  = (groupId) => api.get('/stock-movements', { params: { groupId } })
export const createAdjustment   = (groupId, data) => api.post('/stock-movements/adjustment', data, { params: { groupId } })
