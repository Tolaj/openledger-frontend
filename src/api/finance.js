import api from '../lib/axios'

export const getFinance     = (params) => api.get('/finance', { params })
export const getFinanceSummary = (params) => api.get('/finance/summary', { params })
export const createFinance  = (data)   => api.post('/finance', data)
export const updateFinance  = (id, data) => api.put(`/finance/${id}`, data)
export const deleteFinance  = (id)     => api.delete(`/finance/${id}`)
export const settleDebt     = (id, debtIndex) => api.patch(`/finance/${id}/settle/${debtIndex}`)

export const getBudgets     = (params) => api.get('/budgets', { params })
export const createBudget   = (data)   => api.post('/budgets', data)
export const updateBudget   = (id, data) => api.put(`/budgets/${id}`, data)
export const deleteBudget   = (id)     => api.delete(`/budgets/${id}`)
