export interface AvailableSlot {
  id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  duration_minutes: number
  max_bookings: number
  current_bookings: number
  is_available: boolean
  admin_id: string
  created_at: string
  updated_at: string
}

export interface SlotInput {
  startTime: string
  endTime: string
  duration: number
  maxBookings: number
}

export interface RecurringSchedule {
  daysOfWeek: number[] // 0-6 (Sunday-Saturday)
  startDate: string
  endDate: string
  slots: SlotInput[]
}
