import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/products'
import * as groupApi from '../api/groups'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useProducts() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['products', activeGroupId],
    queryFn: async () => {
      const [productsRes, groupRes] = await Promise.all([
        api.getProducts(activeGroupId),
        groupApi.getGroup(activeGroupId),
      ])
      const allProducts = productsRes.data
      const group = groupRes.data
      const groupProductIds = new Set(
        (group.products || []).map((p) => String(p._id || p))
      )
      return allProducts.filter((p) => groupProductIds.has(String(p._id)))
    },
    enabled: !!activeGroupId,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', activeGroupId] }); toast.success('Product created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateProduct(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', activeGroupId] }); toast.success('Product updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', activeGroupId] }); toast.success('Product deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
