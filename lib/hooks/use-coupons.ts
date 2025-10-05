import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCoupons,
  getCouponStats,
  getCouponById,
  issueCoupon,
  bulkIssueCoupons,
  revokeCoupon,
  getCouponTemplates,
  getCouponTemplateById,
  createCouponTemplate,
  updateCouponTemplate,
  toggleTemplateStatus,
  getTemplateUsageStats,
  type CouponFilters,
} from '@/lib/actions/coupons'

/**
 * Query Keys Factory for Coupons
 */
export const couponKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponKeys.all, 'list'] as const,
  list: (page?: number, filters?: CouponFilters) => [...couponKeys.lists(), page, filters] as const,
  detail: (id: string) => [...couponKeys.all, 'detail', id] as const,
  stats: (templateId?: string) => [...couponKeys.all, 'stats', templateId] as const,
  templates: () => [...couponKeys.all, 'templates'] as const,
}

/**
 * Hook for fetching coupons with filters and pagination
 */
export function useCoupons(page: number = 1, limit: number = 20, filters?: CouponFilters) {
  return useQuery({
    queryKey: couponKeys.list(page, filters),
    queryFn: async () => {
      const result = await getCoupons({ page, limit, filters })

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch coupons')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return {
        data: result.data,
        pagination: result.pagination,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching coupon statistics
 */
export function useCouponStats(templateId?: string) {
  return useQuery({
    queryKey: couponKeys.stats(templateId),
    queryFn: async () => {
      const result = await getCouponStats(templateId)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch coupon stats')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

/**
 * Hook for fetching a single coupon
 */
export function useCoupon(id: string) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: async () => {
      const result = await getCouponById(id)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch coupon')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for fetching coupon templates
 */
export function useCouponTemplates(includeInactive = false) {
  return useQuery({
    queryKey: [...couponKeys.templates(), includeInactive],
    queryFn: async () => {
      const result = await getCouponTemplates(includeInactive)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch templates')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for fetching a single coupon template
 */
export function useCouponTemplate(id: string) {
  return useQuery({
    queryKey: [...couponKeys.templates(), id],
    queryFn: async () => {
      const result = await getCouponTemplateById(id)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch template')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for fetching template usage statistics
 */
export function useTemplateUsageStats(templateId: string) {
  return useQuery({
    queryKey: [...couponKeys.templates(), templateId, 'stats'],
    queryFn: async () => {
      const result = await getTemplateUsageStats(templateId)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch template stats')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    enabled: !!templateId,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

/**
 * Hook for issuing a new coupon
 */
export function useIssueCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      templateId: string
      userId?: string
      sessionToken?: string
      issuedReason: string
      validDays?: number
    }) => issueCoupon(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: couponKeys.lists() })
        queryClient.invalidateQueries({ queryKey: couponKeys.stats() })
        toast.success('쿠폰이 발급되었습니다')
      } else {
        toast.error('error' in result ? result.error : '쿠폰 발급에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('쿠폰 발급 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for bulk issuing coupons
 */
export function useBulkIssueCoupons() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      templateId: string
      count: number
      issuedReason: string
      validDays?: number
    }) => bulkIssueCoupons(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: couponKeys.lists() })
        queryClient.invalidateQueries({ queryKey: couponKeys.stats() })
        toast.success(`${result.data?.length || 0}개의 쿠폰이 발급되었습니다`)
      } else {
        toast.error('error' in result ? result.error : '쿠폰 대량 발급에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('쿠폰 대량 발급 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for revoking a coupon
 */
export function useRevokeCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => revokeCoupon(id, reason),
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: couponKeys.lists() })

      // Snapshot previous value
      const previousCoupons = queryClient.getQueryData(couponKeys.lists())

      return { previousCoupons }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCoupons) {
        queryClient.setQueryData(couponKeys.lists(), context.previousCoupons)
      }
      toast.error('쿠폰 취소에 실패했습니다')
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: couponKeys.lists() })
        queryClient.invalidateQueries({ queryKey: couponKeys.stats() })
        toast.success('쿠폰이 취소되었습니다')
      } else {
        toast.error('error' in result ? result.error : '쿠폰 취소에 실패했습니다')
      }
    },
  })
}

/**
 * Hook for creating a coupon template
 */
export function useCreateCouponTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      codePrefix: string
      discountType: 'percentage' | 'fixed'
      discountValue: number
      validDays: number
      minPurchaseAmount?: number
      maxDiscountAmount?: number
      termsDescription?: string
    }) => createCouponTemplate(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: couponKeys.templates() })
        toast.success('쿠폰 템플릿이 생성되었습니다')
      } else {
        toast.error('error' in result ? result.error : '템플릿 생성에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('템플릿 생성 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for updating a coupon template
 */
export function useUpdateCouponTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: {
        codePrefix?: string
        discountType?: 'percentage' | 'fixed'
        discountValue?: number
        validDays?: number
        minPurchaseAmount?: number
        maxDiscountAmount?: number
        termsDescription?: string
      }
    }) => updateCouponTemplate(id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: couponKeys.templates() })
        toast.success('쿠폰 템플릿이 수정되었습니다')
      } else {
        toast.error('error' in result ? result.error : '템플릿 수정에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('템플릿 수정 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for toggling template status
 */
export function useToggleTemplateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => toggleTemplateStatus(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: couponKeys.templates() })
      const previousTemplates = queryClient.getQueryData(couponKeys.templates())
      return { previousTemplates }
    },
    onError: (err, id, context) => {
      if (context?.previousTemplates) {
        queryClient.setQueryData(couponKeys.templates(), context.previousTemplates)
      }
      toast.error('템플릿 상태 변경에 실패했습니다')
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: couponKeys.templates() })
        toast.success('템플릿 상태가 변경되었습니다')
      } else {
        toast.error('error' in result ? result.error : '템플릿 상태 변경에 실패했습니다')
      }
    },
  })
}
