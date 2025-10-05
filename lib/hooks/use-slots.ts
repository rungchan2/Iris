import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createSlot,
  deleteSlot,
  toggleSlotAvailability,
  getSlotCountsByDates,
} from '@/lib/actions/available-slots'

/**
 * Query Keys Factory for Slots
 */
export const slotKeys = {
  all: ['slots'] as const,
  byDate: (date: string, adminId?: string) => [...slotKeys.all, 'date', date, adminId] as const,
  byMonth: (adminId: string, year: number, month: number) =>
    [...slotKeys.all, 'month', adminId, year, month] as const,
  counts: (dates: string[], photographerId?: string) =>
    [...slotKeys.all, 'counts', dates, photographerId] as const,
}

/**
 * Hook for creating a slot
 */
export function useCreateSlot(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      adminId,
      date,
      startTime,
      endTime,
      durationMinutes,
    }: {
      adminId: string
      date: string
      startTime: string
      endTime: string
      durationMinutes: number
    }) => {
      const result = await createSlot(adminId, date, startTime, endTime, durationMinutes)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotKeys.all })
      toast.success('시간 슬롯이 성공적으로 추가되었습니다')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || '시간 슬롯 추가에 실패했습니다')
    },
  })
}

/**
 * Hook for deleting a slot
 */
export function useDeleteSlot(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (slotId: string) => {
      const result = await deleteSlot(slotId)

      if (result.error) {
        throw new Error(result.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotKeys.all })
      toast.success('시간 슬롯이 삭제되었습니다')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || '시간 슬롯 삭제에 실패했습니다')
    },
  })
}

/**
 * Hook for toggling slot availability
 */
export function useToggleSlotAvailability(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      slotId,
      isAvailable,
    }: {
      slotId: string
      isAvailable: boolean
    }) => {
      const result = await toggleSlotAvailability(slotId, isAvailable)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: slotKeys.all })
      const status = data?.is_available ? '예약 가능' : '예약 불가'
      toast.success(`슬롯이 ${status}으로 변경되었습니다`)
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || '슬롯 상태 변경에 실패했습니다')
    },
  })
}

/**
 * Hook for fetching slot counts for multiple dates
 */
export function useSlotCounts(availableDates: string[], photographerId?: string) {
  return useQuery({
    queryKey: slotKeys.counts(availableDates, photographerId),
    queryFn: async () => {
      const result = await getSlotCountsByDates(availableDates, photographerId)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data || {}
    },
    enabled: availableDates.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
