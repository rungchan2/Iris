'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { bookingLogger } from '@/lib/logger'
import { getUserCookie } from '@/lib/auth/cookie'
import type { Database, TablesInsert } from '@/types/database.types'
import { INQUIRY_STATUS, type InquiryStatus } from '@/types'

type InquiryRow = Database['public']['Tables']['inquiries']['Row']
type InquiryInsert = TablesInsert<'inquiries'>

export interface InquiryFilters {
  status?: string | InquiryStatus
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
      query = query.eq('status', status as InquiryStatus)
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
      bookingLogger.error('Error fetching inquiries', error)
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
    bookingLogger.error('Error in getInquiries', error)
    return { error: 'Failed to fetch inquiries' }
  }
}

/**
 * Create inquiry for payment (before payment is processed)
 * Includes rate limiting to prevent spam
 * IMPORTANT: Requires authenticated user (RLS enforced)
 */
export async function createInquiryForPayment(
  inquiryData: Omit<InquiryInsert, 'id' | 'created_at' | 'updated_at' | 'status' | 'payment_id'>
): Promise<{ success: boolean; inquiryId?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated (required for payment)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      bookingLogger.error('Unauthenticated inquiry creation attempt', {
        phone: inquiryData.phone,
        error: authError
      })
      return {
        success: false,
        error: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.'
      }
    }

    const phone = inquiryData.phone

    // Rate limiting: Check recent inquiries from same phone (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const { data: recentInquiries, error: rateLimitError } = await supabase
      .from('inquiries')
      .select('id, created_at, status')
      .eq('phone', phone)
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })

    if (rateLimitError) {
      bookingLogger.error('Rate limit check failed', { phone, error: rateLimitError })
      // Don't block user if rate limit check fails - just log it
    } else if (recentInquiries && recentInquiries.length >= 3) {
      bookingLogger.warn('Rate limit exceeded', {
        phone,
        attemptCount: recentInquiries.length,
        timeWindow: '10 minutes'
      })
      return {
        success: false,
        error: '잠시 후 다시 시도해주세요. (10분 내 3회 초과)'
      }
    }

    // Insert inquiry with status='new' and user_id
    const { data: inquiry, error: insertError } = await supabase
      .from('inquiries')
      .insert({
        ...inquiryData,
        user_id: user.id,  // Add authenticated user ID
        status: INQUIRY_STATUS.NEW,  // Use NEW status instead of pending_payment
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError || !inquiry) {
      bookingLogger.error('Failed to create inquiry for payment', {
        error: insertError,
        phone,
        photographerId: inquiryData.photographer_id
      })
      return {
        success: false,
        error: '예약 정보 생성에 실패했습니다.'
      }
    }

    bookingLogger.info('Inquiry created for payment', {
      inquiryId: inquiry.id,
      userId: user.id,
      phone,
      photographerId: inquiryData.photographer_id,
      productId: inquiryData.product_id,
      status: INQUIRY_STATUS.NEW
    })

    return {
      success: true,
      inquiryId: inquiry.id
    }
  } catch (error) {
    bookingLogger.error('Error in createInquiryForPayment', error)
    return {
      success: false,
      error: '예약 정보 생성 중 오류가 발생했습니다.'
    }
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
      bookingLogger.error('Error fetching inquiry', error)
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    bookingLogger.error('Error in getInquiryById', error)
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
      bookingLogger.error('Error updating inquiry', error)
      return { success: false, error: error.message }
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      bookingLogger.warn('No inquiry found or access denied', {
        inquiryId: id,
        userId: user?.id,
        userRole: user?.role
      })
      return { success: false, error: 'Inquiry not found or access denied' }
    }

    revalidatePath('/admin/inquiries')
    revalidatePath(`/admin/inquiries/${id}`)
    revalidatePath('/photographer-admin/inquiries')

    return { success: true, data: data[0] }
  } catch (error) {
    bookingLogger.error('Error in updateInquiry', error)
    return { success: false, error: 'Failed to update inquiry' }
  }
}

/**
 * Update inquiry status
 */
export async function updateInquiryStatus(id: string, status: InquiryStatus) {
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
      bookingLogger.info('Updating inquiry status for photographer', {
        inquiryId: id,
        photographerId: user.id,
        status
      })
    } else {
      bookingLogger.info('Updating inquiry status (admin)', {
        inquiryId: id,
        status
      })
    }

    const { data, error, count } = await query.select()

    if (error) {
      bookingLogger.error('Error updating inquiry status', error)
      return { success: false, error: error.message }
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      bookingLogger.warn('No inquiry found or access denied', {
        inquiryId: id,
        userId: user?.id,
        userRole: user?.role
      })
      return { success: false, error: 'Inquiry not found or access denied' }
    }

    bookingLogger.info('Successfully updated inquiry status', {
      inquiryId: id,
      status,
      updatedCount: data.length
    })

    revalidatePath('/admin/inquiries')
    revalidatePath(`/admin/inquiries/${id}`)
    revalidatePath('/photographer-admin/inquiries')

    return { success: true, data: data[0] }
  } catch (error) {
    bookingLogger.error('Error in updateInquiryStatus', error)
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
      bookingLogger.error('Error deleting inquiry', error)
      return { success: false, error: error.message }
    }

    // Check if any rows were deleted (count is available when using .delete())
    if (count === 0) {
      bookingLogger.warn('No inquiry found or access denied for deletion', {
        inquiryId: id,
        userId: user?.id,
        userRole: user?.role
      })
      return { success: false, error: 'Inquiry not found or access denied' }
    }

    bookingLogger.info('Successfully deleted inquiry', {
      inquiryId: id,
      deletedCount: count
    })

    revalidatePath('/admin/inquiries')
    revalidatePath('/photographer-admin/inquiries')

    return { success: true }
  } catch (error) {
    bookingLogger.error('Error in deleteInquiry', error)
    return { success: false, error: 'Failed to delete inquiry' }
  }
}
