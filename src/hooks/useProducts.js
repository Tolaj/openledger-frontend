import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/products'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts().then((r) => r.data),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
