export interface AvailableSlot {
  id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  duration_minutes: number | null
  is_available: boolean | null
  admin_id: string | null
  created_at: string | null
  updated_at: string | null
  // Legacy fields for backward compatibility
  max_bookings?: number
  current_bookings?: number
}

export interface SlotInput {
  startTime: string
  endTime: string
  duration: number
  maxBookings?: number // Optional for backward compatibility, not used in DB
}

export interface RecurringSchedule {
  daysOfWeek: number[] // 0-6 (Sunday-Saturday)
  startDate: string
  endDate: string
  slots: SlotInput[]
}
