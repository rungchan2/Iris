'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { getUserCookie } from '@/lib/auth/cookie'
import type { Database } from '@/types/database.types'

type InquiryRow = Database['public']['Tables']['inquiries']['Row']

export interface InquiryFilters {
  status?: string
  photographerId?: string
  dateRange?: {
    from: string
    to: string
  }
  search?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Get inquiries with filtering and pagination
 */
export async function getInquiries(filters: InquiryFilters = {}) {
  try {
    const supabase = await createClient()
    const {
      status,
      photographerId,
      dateRange,
      search,
      page = 1,
      pageSize = 20,
      sortField = 'created_at',
      sortOrder = 'desc'
    } = filters

    let query = supabase
      .from('inquiries')
      .select(`
        *,
        selected_slot_id:available_slots!inquiries_selected_slot_id_fkey (
          id,
          date,
          start_time,
          end_time,
          duration_minutes
        ),
        photographers:photographer_id (
          id,
          name,
          email
        )
      `, { count: 'exact' })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (photographerId) {
      query = query.eq('photographer_id', photographerId)
    }

    if (dateRange) {
      query = query
        .gte('desired_date', dateRange.from)
        .lte('desired_date', dateRange.to)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,instagram_id.ilike.%${search}%`)
    }

    // Sorting - only for simple fields (booking_date is handled client-side)
    if (sortField && sortField !== 'booking_date') {
      query = query.order(sortField, { ascending: sortOrder === 'asc' })
    } else {
      // Default sort
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching inquiries', error, 'Inquiries')
      return { error: error.message }
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  } catch (error) {
    logger.error('Error in getInquiries', error, 'Inquiries')
    return { error: 'Failed to fetch inquiries' }
  }
}

/**
 * Get single inquiry by ID with all relations
 */
export async function getInquiryById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        selected_slot_id:available_slots!inquiries_selected_slot_id_fkey (
          id,
          date,
          start_time,
          end_time,
          duration_minutes
        ),
        photographers:photographer_id (
          id,
          name,
          email
        ),
        products:product_id (
          id,
          name,
          price
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching inquiry', error, 'Inquiries')
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    logger.error('Error in getInquiryById', error, 'Inquiries')
    return { error: 'Failed to fetch inquiry' }
  }
}

/**
 * Update inquiry
 */
export async function updateInquiry(id: string, updates: Partial<InquiryRow>) {
  try {
    const supabase = await createClient()
    const user = await getUserCookie()

    // Build query with photographer_id filter if user is a photographer
    let query = supabase
      .from('inquiries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // If user is a photographer, only allow updating their own inquiries
    if (user?.role === 'photographer') {
      query = query.eq('photographer_id', user.id)
    }

    const { data, error } = await query.select()

    if (error) {
      logger.error('Error updating inquiry', error, 'Inquiries')
      return { success: false, error: error.message }
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      logger.warn('No inquiry found or access denied', {
        inquiryId: id,
        userId: user?.id,
        userRole: user?.role
      }, 'Inquiries')
      return { success: false, error: 'Inquiry not found or access denied' }
    }

    revalidatePath('/admin/inquiries')
    revalidatePath(`/admin/inquiries/${id}`)
    revalidatePath('/photographer-admin/inquiries')

    return { success: true, data: data[0] }
  } catch (error) {
    logger.error('Error in updateInquiry', error, 'Inquiries')
    return { success: false, error: 'Failed to update inquiry' }
  }
}

/**
 * Update inquiry status
 */
export async function updateInquiryStatus(id: string, status: 'new' | 'contacted' | 'completed') {
  try {
    const supabase = await createClient()
    const user = await getUserCookie()

    // Build query with photographer_id filter if user is a photographer
    let query = supabase
      .from('inquiries')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // If user is a photographer, only allow updating their own inquiries
    if (user?.role === 'photographer') {
      query = query.eq('photographer_id', user.id)
      logger.info('Updating inquiry status for photographer', {
        inquiryId: id,
        photographerId: user.id,
        status
      }, 'Inquiries')
    } else {
      logger.info('Updating inquiry status (admin)', {
        inquiryId: id,
        status
      }, 'Inquiries')
    }

    const { data, error, count } = await query.select()

    if (error) {
      logger.error('Error updating inquiry status', error, 'Inquiries')
      return { success: false, error: error.message }
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      logger.warn('No inquiry found or access denied', {
        inquiryId: id,
        userId: user?.id,
        userRole: user?.role
      }, 'Inquiries')
      return { success: false, error: 'Inquiry not found or access denied' }
    }

    logger.info('Successfully updated inquiry status', {
      inquiryId: id,
      status,
      updatedCount: data.length
    }, 'Inquiries')

    revalidatePath('/admin/inquiries')
    revalidatePath(`/admin/inquiries/${id}`)
    revalidatePath('/photographer-admin/inquiries')

    return { success: true, data: data[0] }
  } catch (error) {
    logger.error('Error in updateInquiryStatus', error, 'Inquiries')
    return { success: false, error: 'Failed to update inquiry status' }
  }
}

/**
 * Delete inquiry
 */
export async function deleteInquiry(id: string) {
  try {
    const supabase = await createClient()
    const user = await getUserCookie()

    // Build query with photographer_id filter if user is a photographer
    let query = supabase
      .from('inquiries')
      .delete()
      .eq('id', id)

    // If user is a photographer, only allow deleting their own inquiries
    if (user?.role === 'photographer') {
      query = query.eq('photographer_id', user.id)
    }

    const { error, count } = await query

    if (error) {
      logger.error('Error deleting inquiry', error, 'Inquiries')
      return { success: false, error: error.message }
    }

    // Check if any rows were deleted (count is available when using .delete())
    if (count === 0) {
      logger.warn('No inquiry found or access denied for deletion', {
        inquiryId: id,
        userId: user?.id,
        userRole: user?.role
      }, 'Inquiries')
      return { success: false, error: 'Inquiry not found or access denied' }
    }

    logger.info('Successfully deleted inquiry', {
      inquiryId: id,
      deletedCount: count
    }, 'Inquiries')

    revalidatePath('/admin/inquiries')
    revalidatePath('/photographer-admin/inquiries')

    return { success: true }
  } catch (error) {
    logger.error('Error in deleteInquiry', error, 'Inquiries')
    return { success: false, error: 'Failed to delete inquiry' }
  }
}
