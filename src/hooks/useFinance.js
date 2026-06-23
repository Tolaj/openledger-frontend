import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFinance, getFinanceSummary, createFinance, updateFinance, deleteFinance, settleDebt,
  getBudgets, createBudget, updateBudget, deleteBudget,
} from '../api/finance'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

// ── Finance ───────────────────────────────────────────────────────────────────
export function useFinance(params) {
  return useQuery({
    queryKey: ['finance', params],
    queryFn: () => getFinance(params).then((r) => r.data),
    enabled: !!params?.groupId,
  })
}

export function useFinanceSummary(params) {
  return useQuery({
    queryKey: ['finance-summary', params],
    queryFn: () => getFinanceSummary(params).then((r) => r.data),
    enabled: !!params?.groupId,
  })
}

export function useCreateFinance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createFinance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); toast.success('Transaction added') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateFinance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateFinance(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); toast.success('Transaction updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteFinance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFinance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); toast.success('Transaction deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useSettleDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, debtIndex }) => settleDebt(id, debtIndex),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); toast.success('Debt marked as settled') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

// ── Budgets ───────────────────────────────────────────────────────────────────
export function useBudgets(params) {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: () => getBudgets(params).then((r) => r.data),
    enabled: !!params?.groupId,
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateBudget(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
