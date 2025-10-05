import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getPayments, getPayment, getPaymentStatistics } from '@/lib/actions/payments'
import type { PaymentStatus } from '@/lib/payments/types'

/**
 * Query Keys Factory for Payments
 */
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  detail: (id: string) => [...paymentKeys.all, 'detail', id] as const,
  statistics: (photographerId?: string, startDate?: string, endDate?: string) =>
    [...paymentKeys.all, 'statistics', photographerId, startDate, endDate] as const,
}

interface PaymentFilters {
  photographerId?: string
  status?: PaymentStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

/**
 * Hook for fetching payments with filters
 */
export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: async () => {
      const result = await getPayments({
        photographerId: filters?.photographerId,
        status: filters?.status,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        limit: filters?.limit,
        offset: filters?.offset,
      })

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch payments')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single payment
 */
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId),
    queryFn: async () => {
      const result = await getPayment(paymentId)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch payment')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    enabled: !!paymentId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for fetching payment statistics
 */
export function usePaymentStatistics(
  photographerId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: paymentKeys.statistics(photographerId, startDate, endDate),
    queryFn: async () => {
      const result = await getPaymentStatistics(photographerId, startDate, endDate)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch statistics')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    enabled: !!photographerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
