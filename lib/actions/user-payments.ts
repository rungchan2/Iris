'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserCookie } from '@/lib/auth/cookie'
import type { Payment } from '@/types'
import { paymentLogger } from '@/lib/logger'

export type PaymentWithDetails = Payment & {
  inquiry?: {
    id: string
    name: string
    desired_date: string | null
    special_request?: string | null
  } | null
  product?: {
    id: string
    name: string
  } | null
  photographer?: {
    id: string
    name: string | null
    email?: string | null
  } | null
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get user's payment history
 */
export async function getUserPayments(): Promise<ApiResponse<PaymentWithDetails[]>> {
  try {
    const user = await getUserCookie()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        inquiry:inquiries!payments_inquiry_id_fkey(id, name, desired_date),
        product:products!payments_product_id_fkey(id, name),
        photographer:photographers!payments_photographer_id_fkey(id, name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      paymentLogger.error('Error fetching user payments:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as unknown as PaymentWithDetails[] }
  } catch (error) {
    paymentLogger.error('Unexpected error in getUserPayments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get specific payment details by payment ID
 */
export async function getPaymentDetails(paymentId: string): Promise<ApiResponse<PaymentWithDetails>> {
  try {
    const user = await getUserCookie()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        inquiry:inquiries!payments_inquiry_id_fkey(id, name, desired_date),
        product:products!payments_product_id_fkey(id, name),
        photographer:photographers!payments_photographer_id_fkey(id, name)
      `)
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      paymentLogger.error('Error fetching payment details:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Payment not found' }
    }

    return { success: true, data: data as unknown as PaymentWithDetails }
  } catch (error) {
    paymentLogger.error('Unexpected error in getPaymentDetails:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get payment details by order ID (for payment success page)
 */
export async function getPaymentByOrderId(orderId: string): Promise<ApiResponse<PaymentWithDetails>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        inquiry:inquiries!payments_inquiry_id_fkey(id, name, desired_date, special_request),
        product:products!payments_product_id_fkey(id, name),
        photographer:photographers!payments_photographer_id_fkey(id, name, email)
      `)
      .eq('order_id', orderId)
      .single()

    if (error) {
      paymentLogger.error('Error fetching payment by order ID:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Payment not found' }
    }

    return { success: true, data: data as unknown as PaymentWithDetails }
  } catch (error) {
    paymentLogger.error('Unexpected error in getPaymentByOrderId:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Request payment cancellation/refund
 * This will call Toss Payments API to cancel the payment
 */
export async function requestRefund(
  paymentId: string,
  reason: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const user = await getUserCookie()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !payment) {
      paymentLogger.error('Payment not found:', fetchError)
      return { success: false, error: 'Payment not found' }
    }

    // Check if payment is already cancelled
    if (payment.status === 'cancelled') {
      return { success: false, error: 'Payment is already cancelled' }
    }

    // Check if payment is paid
    if (payment.status !== 'paid') {
      return { success: false, error: 'Only paid payments can be refunded' }
    }

    // Call Toss Payments API to cancel
    // This requires provider_transaction_id and Toss Payments secret key
    if (!payment.provider_transaction_id) {
      return { success: false, error: 'Payment transaction ID not found' }
    }

    const tossSecretKey = process.env.TOSS_SECRET_KEY
    if (!tossSecretKey) {
      paymentLogger.error('Toss secret key not configured')
      return { success: false, error: 'Payment provider not configured' }
    }

    // Call Toss Payments cancel API
    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${payment.provider_transaction_id}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: reason,
        }),
      }
    )

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json()
      paymentLogger.error('Toss Payments cancel failed:', errorData)
      return { success: false, error: errorData.message || 'Refund request failed' }
    }

    const tossData = await tossResponse.json()

    // Update payment status in database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        admin_memo: `User requested refund: ${reason}`,
        raw_response: tossData,
      })
      .eq('id', paymentId)

    if (updateError) {
      paymentLogger.error('Error updating payment status:', updateError)
      return { success: false, error: 'Failed to update payment status' }
    }

    paymentLogger.info('Refund processed successfully', {
      paymentId,
      userId: user.id,
      amount: payment.amount,
    })

    return {
      success: true,
      data: { message: 'Refund processed successfully' },
    }
  } catch (error) {
    paymentLogger.error('Unexpected error in requestRefund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
