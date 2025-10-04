'use client'

import { useMutation } from '@tanstack/react-query'
import { createBooking } from '@/lib/actions/bookings'
import { toast } from 'sonner'

interface BookingData {
  name: string
  instagram_id?: string
  gender: string
  phone: string
  desired_date: Date
  selected_slot_id?: string
  people_count: number
  relationship?: string
  special_request?: string
  difficulty_note?: string
  conversation_preference?: string
  conversation_topics?: string
  favorite_music?: string
  shooting_meaning?: string
}

/**
 * Hook for creating booking inquiries
 */
export function useBookingSubmit() {
  return useMutation({
    mutationFn: (data: BookingData) => createBooking(data),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || '문의 접수 중 오류가 발생했습니다')
        throw new Error(result.error)
      }
      toast.success('문의가 성공적으로 접수되었습니다!')
    },
    onError: (error: Error) => {
      console.error('Error submitting booking:', error)
      toast.error('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  })
}
