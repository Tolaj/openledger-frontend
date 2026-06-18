import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFinance, getFinanceSummary, createFinance, updateFinance, deleteFinance, settleDebt,
  getBudgets, createBudget, updateBudget, deleteBudget,
} from '../api/finance'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance'] }),
  })
}

export function useUpdateFinance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateFinance(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance'] }),
  })
}

export function useDeleteFinance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFinance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance'] }),
  })
}

export function useSettleDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, debtIndex }) => settleDebt(id, debtIndex),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateBudget(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
