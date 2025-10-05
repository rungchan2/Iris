'use server'

import { createClient } from '@/lib/supabase/server'
import type { AvailableSlot } from '@/types/schedule.types'

/**
 * Get available slots for a photographer by month
 */
export async function getAvailableSlotsForMonth(
  adminId: string,
  year: number,
  month: number
): Promise<{ data: AvailableSlot[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0)

    const startDateStr = startOfMonth.toISOString().split('T')[0]
    const endDateStr = endOfMonth.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('available_slots')
      .select('*')
      .eq('admin_id', adminId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching available slots:', error)
      return { data: null, error: error.message }
    }

    return { data: data as AvailableSlot[], error: null }
  } catch (error) {
    console.error('Error in getAvailableSlotsForMonth:', error)
    return { data: null, error: 'Failed to fetch available slots' }
  }
}

/**
 * Get available slots for a specific date (used by booking flow)
 */
export async function getAvailableSlotsByDate(
  date: string,
  photographerId?: string
): Promise<{ data: AvailableSlot[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('available_slots')
      .select(`
        *,
        photographers:admin_id (
          name,
          email
        )
      `)
      .eq('date', date)

    // Filter by photographer ID if provided
    if (photographerId) {
      query = query.eq('admin_id', photographerId)
    }

    const { data, error } = await query.order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching available slots by date:', error)
      return { data: null, error: error.message }
    }

    return { data: data as any[], error: null }
  } catch (error) {
    console.error('Error in getAvailableSlotsByDate:', error)
    return { data: null, error: 'Failed to fetch available slots' }
  }
}

/**
 * Get slot counts grouped by date for calendar display
 */
export async function getSlotCountsByDate(
  adminId: string,
  year: number,
  month: number
): Promise<{
  data: Record<string, { total: number; available: number; booked: number }> | null
  error: string | null
}> {
  try {
    const result = await getAvailableSlotsForMonth(adminId, year, month)

    if (result.error || !result.data) {
      return { data: null, error: result.error }
    }

    const counts: Record<string, { total: number; available: number; booked: number }> = {}

    result.data.forEach((slot) => {
      if (!counts[slot.date]) {
        counts[slot.date] = { total: 0, available: 0, booked: 0 }
      }

      counts[slot.date].total++

      if (slot.is_available) {
        counts[slot.date].available++
      } else {
        counts[slot.date].booked++
      }
    })

    return { data: counts, error: null }
  } catch (error) {
    console.error('Error in getSlotCountsByDate:', error)
    return { data: null, error: 'Failed to get slot counts' }
  }
}

/**
 * Create a single slot
 */
export async function createSlot(
  adminId: string,
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number
): Promise<{ data: AvailableSlot | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('available_slots')
      .insert({
        admin_id: adminId,
        date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        is_available: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating slot:', error)

      // Handle unique constraint violation
      if (error.code === '23505') {
        return { data: null, error: 'A slot already exists at this time' }
      }

      return { data: null, error: error.message }
    }

    return { data: data as AvailableSlot, error: null }
  } catch (error) {
    console.error('Error in createSlot:', error)
    return { data: null, error: 'Failed to create slot' }
  }
}

/**
 * Create multiple slots at once
 */
export async function createBulkSlots(
  adminId: string,
  slots: Array<{
    date: string
    start_time: string
    end_time: string
    duration_minutes: number
  }>
): Promise<{ data: AvailableSlot[] | null; error: string | null; skippedCount?: number }> {
  try {
    const supabase = await createClient()

    // Check for existing slots to avoid unique constraint violation
    const dates = [...new Set(slots.map((s) => s.date))]
    const { data: existingSlots } = await supabase
      .from('available_slots')
      .select('date, start_time')
      .eq('admin_id', adminId)
      .in('date', dates)

    const existingSlotKeys = new Set(
      existingSlots?.map((slot) => `${slot.date}_${slot.start_time}`) || []
    )

    // Filter out slots that already exist
    const uniqueSlotsToCreate = slots
      .map((slot) => ({
        admin_id: adminId,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: slot.duration_minutes,
        is_available: true,
      }))
      .filter((slot) => !existingSlotKeys.has(`${slot.date}_${slot.start_time}`))

    if (uniqueSlotsToCreate.length === 0) {
      return {
        data: null,
        error: 'All selected time slots already exist',
        skippedCount: slots.length
      }
    }

    const { data, error } = await supabase
      .from('available_slots')
      .insert(uniqueSlotsToCreate)
      .select()

    if (error) {
      console.error('Error creating bulk slots:', error)
      return { data: null, error: error.message }
    }

    const skippedCount = slots.length - uniqueSlotsToCreate.length

    return {
      data: data as AvailableSlot[],
      error: null,
      skippedCount: skippedCount > 0 ? skippedCount : undefined
    }
  } catch (error) {
    console.error('Error in createBulkSlots:', error)
    return { data: null, error: 'Failed to create bulk slots' }
  }
}

/**
 * Update a slot's availability or time
 */
export async function updateSlot(
  slotId: string,
  updates: {
    start_time?: string
    end_time?: string
    duration_minutes?: number
    is_available?: boolean
  }
): Promise<{ data: AvailableSlot | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('available_slots')
      .update(updates)
      .eq('id', slotId)
      .select()
      .single()

    if (error) {
      console.error('Error updating slot:', error)
      return { data: null, error: error.message }
    }

    return { data: data as AvailableSlot, error: null }
  } catch (error) {
    console.error('Error in updateSlot:', error)
    return { data: null, error: 'Failed to update slot' }
  }
}

/**
 * Delete a single slot
 */
export async function deleteSlot(slotId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('available_slots')
      .delete()
      .eq('id', slotId)

    if (error) {
      console.error('Error deleting slot:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in deleteSlot:', error)
    return { error: 'Failed to delete slot' }
  }
}

/**
 * Delete multiple slots at once
 */
export async function deleteBulkSlots(slotIds: string[]): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('available_slots')
      .delete()
      .in('id', slotIds)

    if (error) {
      console.error('Error deleting bulk slots:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in deleteBulkSlots:', error)
    return { error: 'Failed to delete slots' }
  }
}

/**
 * Toggle slot availability
 */
export async function toggleSlotAvailability(
  slotId: string,
  isAvailable: boolean
): Promise<{ data: AvailableSlot | null; error: string | null }> {
  return updateSlot(slotId, { is_available: isAvailable })
}

/**
 * Copy slots from one date to another
 */
export async function copySlotsToDate(
  adminId: string,
  fromDate: string,
  toDate: string
): Promise<{ data: AvailableSlot[] | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Get slots from source date
    const { data: sourceSlots, error: fetchError } = await supabase
      .from('available_slots')
      .select('*')
      .eq('admin_id', adminId)
      .eq('date', fromDate)

    if (fetchError) {
      console.error('Error fetching source slots:', fetchError)
      return { data: null, error: fetchError.message }
    }

    if (!sourceSlots || sourceSlots.length === 0) {
      return { data: null, error: 'No slots found on the source date' }
    }

    // Create new slots for target date
    const newSlots = sourceSlots.map((slot) => ({
      date: toDate,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: slot.duration_minutes || 60, // Default to 60 if null
    }))

    return createBulkSlots(adminId, newSlots)
  } catch (error) {
    console.error('Error in copySlotsToDate:', error)
    return { data: null, error: 'Failed to copy slots' }
  }
}

/**
 * Get slot counts for multiple dates (used by booking calendar)
 */
export async function getSlotCountsByDates(
  availableDates: string[],
  photographerId?: string
): Promise<{
  data: Record<string, { total: number; available: number }> | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    if (availableDates.length === 0) {
      return { data: {}, error: null }
    }

    let query = supabase
      .from('available_slots')
      .select('date, is_available')
      .in('date', availableDates)

    // Filter by photographer ID if provided
    if (photographerId) {
      query = query.eq('admin_id', photographerId)
    }

    const { data: slots, error } = await query

    if (error) {
      console.error('Error fetching slot counts:', error)
      return { data: null, error: error.message }
    }

    const counts: Record<string, { total: number; available: number }> = {}

    for (const date of availableDates) {
      const dateSlots = slots?.filter((slot) => slot.date === date) || []
      counts[date] = {
        total: dateSlots.length,
        available: dateSlots.filter((slot) => slot.is_available).length,
      }
    }

    return { data: counts, error: null }
  } catch (error) {
    console.error('Error in getSlotCountsByDates:', error)
    return { data: null, error: 'Failed to get slot counts' }
  }
}
