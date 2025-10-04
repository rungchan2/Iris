'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AvailableSlot } from '@/types/schedule.types'
import {
  getAvailableSlotsForMonth,
  getAvailableSlotsByDate,
  getSlotCountsByDate,
  createSlot,
  createBulkSlots,
  updateSlot,
  deleteSlot,
  deleteBulkSlots,
  toggleSlotAvailability,
  copySlotsToDate,
} from '@/lib/actions/available-slots'

/**
 * Hook to fetch available slots for a specific month
 */
export function useAvailableSlots(adminId: string, year: number, month: number) {
  return useQuery({
    queryKey: ['available-slots', adminId, year, month],
    queryFn: async () => {
      const result = await getAvailableSlotsForMonth(adminId, year, month)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data || []
    },
    enabled: !!adminId,
  })
}

/**
 * Hook to fetch available slots for a specific date (for booking flow)
 */
export function useAvailableSlotsByDate(date: Date | null, photographerId?: string) {
  return useQuery({
    queryKey: ['available-slots-by-date', date?.toISOString().split('T')[0], photographerId],
    queryFn: async () => {
      if (!date) throw new Error('Date is required')

      const dateStr = date.toISOString().split('T')[0]
      const result = await getAvailableSlotsByDate(dateStr, photographerId)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data || []
    },
    enabled: !!date,
  })
}

/**
 * Hook to fetch slot counts grouped by date
 */
export function useSlotCounts(adminId: string, year: number, month: number) {
  return useQuery({
    queryKey: ['slot-counts', adminId, year, month],
    queryFn: async () => {
      const result = await getSlotCountsByDate(adminId, year, month)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data || {}
    },
    enabled: !!adminId,
  })
}

/**
 * Hook for slot mutations (create, update, delete)
 */
export function useSlotMutations(adminId: string) {
  const queryClient = useQueryClient()

  const invalidateSlots = () => {
    queryClient.invalidateQueries({ queryKey: ['available-slots'] })
    queryClient.invalidateQueries({ queryKey: ['slot-counts'] })
  }

  const createSlotMutation = useMutation({
    mutationFn: async (params: {
      date: string
      startTime: string
      endTime: string
      durationMinutes: number
    }) => {
      const result = await createSlot(
        adminId,
        params.date,
        params.startTime,
        params.endTime,
        params.durationMinutes
      )

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      invalidateSlots()
      toast.success('Slot created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create slot')
    },
  })

  const createBulkSlotsMutation = useMutation({
    mutationFn: async (
      slots: Array<{
        date: string
        start_time: string
        end_time: string
        duration_minutes: number
      }>
    ) => {
      const result = await createBulkSlots(adminId, slots)

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: (result) => {
      invalidateSlots()

      if (result.skippedCount && result.skippedCount > 0) {
        toast.warning(`${result.skippedCount} duplicate slots were skipped`)
      }

      const createdCount = result.data?.length || 0
      if (createdCount > 0) {
        toast.success(`${createdCount} slots created successfully`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create slots')
    },
  })

  const updateSlotMutation = useMutation({
    mutationFn: async (params: {
      slotId: string
      updates: {
        start_time?: string
        end_time?: string
        duration_minutes?: number
        is_available?: boolean
      }
    }) => {
      const result = await updateSlot(params.slotId, params.updates)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      invalidateSlots()
      toast.success('Slot updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update slot')
    },
  })

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const result = await deleteSlot(slotId)

      if (result.error) {
        throw new Error(result.error)
      }

      return true
    },
    onSuccess: () => {
      invalidateSlots()
      toast.success('Slot deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete slot')
    },
  })

  const deleteBulkSlotsMutation = useMutation({
    mutationFn: async (slotIds: string[]) => {
      const result = await deleteBulkSlots(slotIds)

      if (result.error) {
        throw new Error(result.error)
      }

      return true
    },
    onSuccess: () => {
      invalidateSlots()
      toast.success('Slots deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete slots')
    },
  })

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (params: { slotId: string; isAvailable: boolean }) => {
      const result = await toggleSlotAvailability(params.slotId, params.isAvailable)

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      invalidateSlots()
      toast.success('Availability updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update availability')
    },
  })

  const copySlotsMutation = useMutation({
    mutationFn: async (params: { fromDate: string; toDate: string }) => {
      const result = await copySlotsToDate(adminId, params.fromDate, params.toDate)

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: (result) => {
      invalidateSlots()

      // copySlotsToDate returns the result from createBulkSlots, which includes skippedCount
      const skippedCount = (result as any).skippedCount
      if (skippedCount && skippedCount > 0) {
        toast.warning(`${skippedCount} duplicate slots were skipped`)
      }

      const copiedCount = result.data?.length || 0
      if (copiedCount > 0) {
        toast.success(`${copiedCount} slots copied successfully`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to copy slots')
    },
  })

  return {
    // Mutations
    createSlot: createSlotMutation.mutate,
    createBulkSlots: createBulkSlotsMutation.mutate,
    updateSlot: updateSlotMutation.mutate,
    deleteSlot: deleteSlotMutation.mutate,
    deleteBulkSlots: deleteBulkSlotsMutation.mutate,
    toggleAvailability: toggleAvailabilityMutation.mutate,
    copySlots: copySlotsMutation.mutate,

    // Async mutations (for when you need to await)
    createSlotAsync: createSlotMutation.mutateAsync,
    createBulkSlotsAsync: createBulkSlotsMutation.mutateAsync,
    updateSlotAsync: updateSlotMutation.mutateAsync,
    deleteSlotAsync: deleteSlotMutation.mutateAsync,
    deleteBulkSlotsAsync: deleteBulkSlotsMutation.mutateAsync,
    toggleAvailabilityAsync: toggleAvailabilityMutation.mutateAsync,
    copySlotsAsync: copySlotsMutation.mutateAsync,

    // Loading states
    isCreating: createSlotMutation.isPending,
    isCreatingBulk: createBulkSlotsMutation.isPending,
    isUpdating: updateSlotMutation.isPending,
    isDeleting: deleteSlotMutation.isPending,
    isDeletingBulk: deleteBulkSlotsMutation.isPending,
    isTogglingAvailability: toggleAvailabilityMutation.isPending,
    isCopying: copySlotsMutation.isPending,
  }
}
