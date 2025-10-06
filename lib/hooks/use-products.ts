import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getProducts,
  getApprovedPhotographers,
  createProduct,
  updateProduct,
  approveProduct,
  rejectProduct,
  deleteProduct,
} from '@/lib/actions/products'
import type { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row'] & {
  photographer?: {
    name: string
    email: string
  }
}

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

interface ProductStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

// ============================================
// 통합 훅: useProducts
// ============================================

export function useProducts() {
  const queryClient = useQueryClient()

  // === Queries ===
  
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const result = await getProducts()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch products')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5분
  })

  const photographersQuery = useQuery({
    queryKey: ['photographers', 'approved'],
    queryFn: async () => {
      const result = await getApprovedPhotographers()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch photographers')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 10, // 10분
  })

  // === Mutations ===

  const createMutation = useMutation({
    mutationFn: async (data: ProductInsert) => {
      const result = await createProduct(data)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create product')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('상품이 생성되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상품 생성 중 오류가 발생했습니다')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductUpdate }) => {
      const result = await updateProduct(id, data)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update product')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('상품이 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상품 수정 중 오류가 발생했습니다')
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (productId: string) => {
      const result = await approveProduct(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('상품이 승인되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '승인 중 오류가 발생했습니다')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ productId, notes }: { productId: string; notes?: string }) => {
      const result = await rejectProduct(productId, notes)
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('상품이 거부되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '거부 중 오류가 발생했습니다')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const result = await deleteProduct(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('상품이 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    },
  })

  // === Computed Values ===

  const products = productsQuery.data || []
  const photographers = photographersQuery.data || []

  const stats: ProductStats = {
    total: products.length,
    pending: products.filter(p => p.status === 'pending').length,
    approved: products.filter(p => p.status === 'approved').length,
    rejected: products.filter(p => p.status === 'rejected').length,
  }

  // === 편의 함수 (옵션) ===

  const actions = {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    approve: approveMutation.mutate,
    approveAsync: approveMutation.mutateAsync,
    reject: rejectMutation.mutate,
    rejectAsync: rejectMutation.mutateAsync,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
  }

  // === Return ===

  return {
    // Data
    products,
    photographers,
    stats,

    // Loading states
    isLoading: productsQuery.isPending || photographersQuery.isPending,
    isProductsLoading: productsQuery.isPending,
    isPhotographersLoading: photographersQuery.isPending,

    // Error states
    error: productsQuery.error || photographersQuery.error,
    isError: productsQuery.isError || photographersQuery.isError,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions (간편 사용)
    ...actions,

    // Mutations (고급 제어 필요 시)
    mutations: {
      create: createMutation,
      update: updateMutation,
      approve: approveMutation,
      reject: rejectMutation,
      delete: deleteMutation,
    },

    // Queries (고급 제어 필요 시)
    queries: {
      products: productsQuery,
      photographers: photographersQuery,
    },

    // Refetch
    refetch: () => {
      productsQuery.refetch()
      photographersQuery.refetch()
    },
  }
}