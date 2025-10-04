'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'
import {
  getInquiries,
  getInquiryById,
  updateInquiry,
  updateInquiryStatus,
  deleteInquiry,
  type InquiryFilters,
} from '@/lib/actions/inquiries'

type InquiryRow = Database['public']['Tables']['inquiries']['Row']

/**
 * Query key factory for inquiries
 */
export const inquiryKeys = {
  all: ['inquiries'] as const,
  lists: () => [...inquiryKeys.all, 'list'] as const,
  list: (filters: InquiryFilters) => [...inquiryKeys.lists(), filters] as const,
  details: () => [...inquiryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inquiryKeys.details(), id] as const,
}

/**
 * Hook to fetch inquiries with filtering and pagination
 */
export function useInquiries(filters: InquiryFilters = {}) {
  return useQuery({
    queryKey: inquiryKeys.list(filters),
    queryFn: async () => {
      const result = await getInquiries(filters)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
  })
}

/**
 * Hook to fetch single inquiry
 */
export function useInquiry(id: string | undefined) {
  return useQuery({
    queryKey: inquiryKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Inquiry ID is required')
      const result = await getInquiryById(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!id,
  })
}

/**
 * Hook for inquiry mutations (update, delete, status change)
 */
export function useInquiryMutations() {
  const queryClient = useQueryClient()

  const updateInquiryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InquiryRow> }) =>
      updateInquiry(id, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success('문의가 업데이트되었습니다')
        // Invalidate both lists and the specific detail
        queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: inquiryKeys.detail(variables.id) })
      } else {
        toast.error(result.error || '문의 업데이트에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('문의 업데이트 중 오류가 발생했습니다')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'contacted' | 'completed' }) =>
      updateInquiryStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: inquiryKeys.detail(id) })

      // Snapshot the previous value
      const previousInquiry = queryClient.getQueryData(inquiryKeys.detail(id))

      // Optimistically update to the new value
      queryClient.setQueryData(inquiryKeys.detail(id), (old: any) => {
        if (!old) return old
        return { ...old, status }
      })

      // Return a context object with the snapshotted value
      return { previousInquiry, id }
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        // toast.success('상태가 업데이트되었습니다')
        queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: inquiryKeys.detail(variables.id) })
      } else {
        toast.error(result.error || '상태 업데이트에 실패했습니다')
      }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInquiry) {
        queryClient.setQueryData(inquiryKeys.detail(context.id), context.previousInquiry)
      }
      toast.error('상태 업데이트 중 오류가 발생했습니다')
    },
  })

  const deleteInquiryMutation = useMutation({
    mutationFn: deleteInquiry,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('문의가 삭제되었습니다')
        queryClient.invalidateQueries({ queryKey: inquiryKeys.lists() })
      } else {
        toast.error(result.error || '문의 삭제에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('문의 삭제 중 오류가 발생했습니다')
    },
  })

  return {
    // Mutations
    updateInquiry: updateInquiryMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    deleteInquiry: deleteInquiryMutation.mutate,

    // Async mutations (for when you need to await)
    updateInquiryAsync: updateInquiryMutation.mutateAsync,
    updateStatusAsync: updateStatusMutation.mutateAsync,
    deleteInquiryAsync: deleteInquiryMutation.mutateAsync,

    // Loading states
    isUpdating: updateInquiryMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteInquiryMutation.isPending,
  }
}
