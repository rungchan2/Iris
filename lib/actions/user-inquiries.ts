'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserCookie } from '@/lib/auth/cookie'
import type { Tables, TablesUpdate } from '@/types'
import { bookingLogger } from '@/lib/logger'

type Inquiry = Tables<'inquiries'>

export type InquiryWithDetails = Inquiry & {
  photographer?: {
    id: string
    name: string | null
    email?: string | null
    profile_image_url?: string | null
    bio?: string | null
  } | null
  product?: {
    id: string
    name: string
    price?: number
  } | null
  payment?: Array<{
    id: string
    amount: number
    status: string
    order_id: string
    paid_at?: string | null
  }> | null
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get user's inquiry history
 */
export async function getUserInquiries(): Promise<ApiResponse<InquiryWithDetails[]>> {
  try {
    const user = await getUserCookie()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        photographer:photographers!inquiries_photographer_id_fkey(id, name, email, profile_image_url, bio),
        product:products!inquiries_product_id_fkey(id, name, price),
        payment:payments!payments_inquiry_id_fkey(id, amount, status, order_id, paid_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      bookingLogger.error('Error fetching user inquiries:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as unknown as InquiryWithDetails[] }
  } catch (error) {
    bookingLogger.error('Unexpected error in getUserInquiries:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get specific inquiry details by inquiry ID
 */
export async function getInquiryDetails(inquiryId: string): Promise<ApiResponse<InquiryWithDetails>> {
  try {
    const user = await getUserCookie()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        photographer:photographers!inquiries_photographer_id_fkey(id, name, email, profile_image_url, bio),
        product:products!inquiries_product_id_fkey(id, name, price),
        payment:payments!payments_inquiry_id_fkey(id, amount, status, order_id, paid_at)
      `)
      .eq('id', inquiryId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      bookingLogger.error('Error fetching inquiry details:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Inquiry not found' }
    }

    return { success: true, data: data as unknown as InquiryWithDetails }
  } catch (error) {
    bookingLogger.error('Unexpected error in getInquiryDetails:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update inquiry optional fields only
 * Users can only update: special_request, difficulty_note, conversation_preference,
 * conversation_topics, favorite_music, shooting_meaning, relationship
 */
export async function updateInquiryOptionalFields(
  inquiryId: string,
  updates: {
    special_request?: string | null
    difficulty_note?: string | null
    conversation_preference?: string | null
    conversation_topics?: string | null
    favorite_music?: string | null
    shooting_meaning?: string | null
    relationship?: string | null
  }
): Promise<ApiResponse<{ message: string }>> {
  try {
    const user = await getUserCookie()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify inquiry belongs to user
    const { data: inquiry, error: fetchError } = await supabase
      .from('inquiries')
      .select('id, user_id, status')
      .eq('id', inquiryId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !inquiry) {
      bookingLogger.error('Inquiry not found:', fetchError)
      return { success: false, error: 'Inquiry not found' }
    }

    // Prevent editing if status is completed or cancelled
    if (inquiry.status === 'completed' || inquiry.status === 'cancelled') {
      return { success: false, error: 'Cannot edit completed or cancelled inquiries' }
    }

    // Update only optional fields
    const { error: updateError } = await supabase
      .from('inquiries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inquiryId)
      .eq('user_id', user.id)

    if (updateError) {
      bookingLogger.error('Error updating inquiry:', updateError)
      return { success: false, error: 'Failed to update inquiry' }
    }

    bookingLogger.info('Inquiry updated successfully', {
      inquiryId,
      userId: user.id,
    })

    return {
      success: true,
      data: { message: 'Inquiry updated successfully' },
    }
  } catch (error) {
    bookingLogger.error('Unexpected error in updateInquiryOptionalFields:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
