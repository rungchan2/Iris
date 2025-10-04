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
  type ProductStats,
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

/**
 * Query Key Factory for Products
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...productKeys.lists(), filters] as const,
  photographers: () => ['photographers', 'approved'] as const,
}

/**
 * Hook to fetch all products with photographer details
 */
export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const result = await getProducts()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch products')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch approved photographers
 */
export function useApprovedPhotographers() {
  return useQuery({
    queryKey: productKeys.photographers(),
    queryFn: async () => {
      const result = await getApprovedPhotographers()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch photographers')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook to calculate product statistics from products data
 */
export function useProductStats(products: Product[]): ProductStats {
  return {
    totalProducts: products.length,
    pendingProducts: products.filter(p => p.status === 'pending').length,
    approvedProducts: products.filter(p => p.status === 'approved').length,
    rejectedProducts: products.filter(p => p.status === 'rejected').length,
  }
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: ProductInsert) => {
      const result = await createProduct(productData)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create product')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('상품이 생성되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상품 생성 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductUpdate }) => {
      const result = await updateProduct(id, data)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update product')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('상품이 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상품 수정 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook to approve a product
 */
export function useApproveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await approveProduct(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('상품이 승인되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '승인 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook to reject a product
 */
export function useRejectProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, notes }: { productId: string; notes?: string }) => {
      const result = await rejectProduct(productId, notes)
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('상품이 거부되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '거부 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await deleteProduct(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete product')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('상품이 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    },
  })
}
