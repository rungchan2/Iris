'use server'

/**
 * 결제 관련 Server Actions
 *
 * 이 파일은 클라이언트에서 호출할 수 있는 서버 액션들을 정의합니다.
 * 모든 데이터베이스 작업과 비즈니스 로직을 처리합니다.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { paymentLogger } from '@/lib/logger'
import type { Json } from '@/types/database.types'
// Payment utilities
function generateOrderId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORDER_${timestamp}_${random}`
}

function formatErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  return '알 수 없는 오류가 발생했습니다'
}
import {
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentModel,
  PaymentStatus,
  RefundRequest,
  RefundResponse,
  RefundModel,
  PaymentStatistics,
  PaymentFilterOptions,
  ApiResponse
} from '@/lib/payments/types'

// ================================
// 결제 생성 관련 함수들
// ================================

/**
 * 결제 정보 생성
 */
export async function createPayment(
  request: PaymentCreateRequest
): Promise<PaymentCreateResponse> {
  const supabase = await createClient()
  
  try {
    // 주문번호 생성
    const orderId = generateOrderId()
    
    // 결제 정보를 데이터베이스에 저장
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        inquiry_id: request.inquiryId,
        user_id: request.userId,
        photographer_id: request.photographerId,
        order_id: orderId,
        amount: request.amount,
        status: 'pending' as PaymentStatus,
        payment_method: request.paymentMethod,
        buyer_name: request.buyerName,
        buyer_email: request.buyerEmail,
        buyer_tel: request.buyerTel,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      paymentLogger.error('Payment creation error', insertError)
      return {
        success: false,
        error: '결제 정보 저장 중 오류가 발생했습니다'
      }
    }

    // inquiry 테이블도 업데이트
    await supabase
      .from('inquiries')
      .update({
        payment_required: true,
        payment_amount: request.amount,
        payment_status: 'pending',
        payment_id: payment.id
      })
      .eq('id', request.inquiryId)

    // 결제 로그 기록
    await logPaymentEvent(payment.id, 'payment_created', {
      orderId,
      amount: request.amount,
      paymentMethod: request.paymentMethod
    })

    return {
      success: true,
      orderId,
      paymentId: payment.id
    }

  } catch (error) {
    paymentLogger.error('Create payment error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

/**
 * 결제 상태 업데이트
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  additionalData?: Partial<PaymentModel>
): Promise<ApiResponse<void>> {
  const supabase = await createClient()

  try {
    type PaymentUpdate = {
      status?: string
      updated_at?: string
      paid_at?: string
      cancelled_at?: string
      failed_at?: string
      [key: string]: string | number | null | undefined | Json
    }

    const updateData: PaymentUpdate = {
      status,
      updated_at: new Date().toISOString()
    }

    // 상태별 타임스탬프 설정
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    } else if (status === 'failed') {
      updateData.failed_at = new Date().toISOString()
    }

    // 추가 데이터 병합
    if (additionalData) {
      Object.assign(updateData, additionalData)
    }

    // 결제 정보 업데이트
    const { error: paymentError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)

    if (paymentError) throw paymentError

    // inquiry 테이블도 함께 업데이트
    if (status === 'paid') {
      await supabase
        .from('inquiries')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed' // 결제 완료시 예약 확정
        })
        .eq('payment_id', paymentId)
    } else if (status === 'failed' || status === 'cancelled') {
      await supabase
        .from('inquiries')
        .update({ 
          payment_status: 'cancelled'
        })
        .eq('payment_id', paymentId)
    }

    // 결제 로그 기록
    await logPaymentEvent(paymentId, `payment_${status}`, {
      status,
      timestamp: new Date().toISOString(),
      ...additionalData
    })

    // 관련 페이지 재검증
    revalidatePath('/admin/payments')
    revalidatePath('/photographer-admin/payments')

    return { success: true, data: undefined }

  } catch (error) {
    paymentLogger.error('Update payment status error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

// ================================
// 결제 조회 관련 함수들
// ================================

/**
 * 결제 내역 조회
 */
export async function getPayments(
  filters?: PaymentFilterOptions
): Promise<ApiResponse<PaymentModel[]>> {
  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        inquiry:inquiries!payments_inquiry_id_fkey(
          id,
          name,
          phone,
          status
        ),
        photographer:photographers!payments_photographer_id_fkey(
          id,
          name,
          email,
          phone
        ),
        user:users!payments_user_id_fkey(
          id,
          name,
          email
        ),
        product:products!payments_product_id_fkey(
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.photographerId) {
      query = query.eq('photographer_id', filters.photographerId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod)
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }
    if (filters?.minAmount) {
      query = query.gte('amount', filters.minAmount)
    }
    if (filters?.maxAmount) {
      query = query.lte('amount', filters.maxAmount)
    }

    // 페이지네이션
    if (filters?.limit) {
      query = query.limit(filters.limit)
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + filters.limit - 1)
      }
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: (data || []) as any }

  } catch (error) {
    paymentLogger.error('Get payments error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

/**
 * 단일 결제 정보 조회
 */
export async function getPayment(paymentId: string): Promise<ApiResponse<PaymentModel>> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        inquiry:inquiries!payments_inquiry_id_fkey(
          id,
          name,
          phone,
          status,
          special_request
        ),
        photographer:photographers!payments_photographer_id_fkey(
          id,
          name,
          email,
          phone
        ),
        user:users!payments_user_id_fkey(
          id,
          name,
          email,
          phone
        ),
        product:products!payments_product_id_fkey(
          id,
          name,
          description,
          price
        )
      `)
      .eq('id', paymentId)
      .single()

    if (error) throw error

    if (!data) {
      return {
        success: false,
        error: '결제 정보를 찾을 수 없습니다'
      }
    }

    return { success: true, data: data as any }

  } catch (error) {
    paymentLogger.error('Get payment error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

/**
 * 주문번호로 결제 조회
 */
export async function getPaymentByOrderId(orderId: string): Promise<ApiResponse<PaymentModel>> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (error) throw error

    if (!data) {
      return {
        success: false,
        error: '결제 정보를 찾을 수 없습니다'
      }
    }

    return { success: true, data: data as any }

  } catch (error) {
    paymentLogger.error('Get payment by order ID error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

// ================================
// 결제 통계 관련 함수들
// ================================

/**
 * 결제 통계 조회
 */
export async function getPaymentStatistics(
  photographerId?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<PaymentStatistics>> {
  const supabase = await createClient()
  
  try {
    let query = supabase.from('payments').select('amount, status, payment_method, created_at, paid_at')
    
    if (photographerId) {
      query = query.eq('photographer_id', photographerId)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    // 통계 계산
    const stats: PaymentStatistics = {
      totalRevenue: 0,
      totalPayments: 0,
      pendingPayments: 0,
      completedPayments: 0,
      failedPayments: 0,
      cancelledPayments: 0,
      refundedPayments: 0,
      averageAmount: 0,
      monthlyRevenue: {},
      monthlyCount: {},
      paymentMethodStats: {} as any
    }

    if (data && data.length > 0) {
      let totalCompletedAmount = 0
      let completedCount = 0

      data.forEach(payment => {
        stats.totalPayments++

        // 상태별 집계
        switch (payment.status) {
          case 'paid':
            stats.completedPayments++
            stats.totalRevenue += payment.amount
            totalCompletedAmount += payment.amount
            completedCount++
            break
          case 'pending':
          case 'ready':
            stats.pendingPayments++
            break
          case 'failed':
          case 'expired':
            stats.failedPayments++
            break
          case 'cancelled':
          case 'partialCancelled':
            stats.cancelledPayments++
            break
          case 'refunded':
            stats.refundedPayments++
            break
        }

        // 월별 통계 (결제 완료건만)
        if (payment.status === 'paid' && payment.paid_at) {
          const month = new Date(payment.paid_at).toISOString().slice(0, 7) // YYYY-MM
          stats.monthlyRevenue[month] = (stats.monthlyRevenue[month] || 0) + payment.amount
          stats.monthlyCount[month] = (stats.monthlyCount[month] || 0) + 1
        }

        // 결제수단별 통계 (결제 완료건만)
        if (payment.status === 'paid') {
          const method = payment.payment_method
          if (method && !(stats.paymentMethodStats as any)[method]) {
            (stats.paymentMethodStats as any)[method] = { count: 0, amount: 0 }
          }
          if (method) {
            (stats.paymentMethodStats as any)[method].count++
            (stats.paymentMethodStats as any)[method].amount += payment.amount
          }
        }
      })

      // 평균 결제 금액 계산
      stats.averageAmount = completedCount > 0 ? Math.round(totalCompletedAmount / completedCount) : 0
    }

    return { success: true, data: stats }

  } catch (error) {
    paymentLogger.error('Get payment statistics error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

// ================================
// 환불 관련 함수들
// ================================

/**
 * 환불 요청 처리
 */
export async function requestRefund(request: RefundRequest): Promise<RefundResponse> {
  const supabase = await createClient()
  
  try {
    // 결제 정보 조회
    const paymentResult = await getPayment(request.paymentId)
    if (!paymentResult.success || !paymentResult.data) {
      return {
        success: false,
        error: '결제 정보를 찾을 수 없습니다'
      }
    }

    const payment = paymentResult.data
    
    // 환불 가능 여부 확인
    if (payment.status !== 'paid') {
      return {
        success: false,
        error: '완료된 결제만 환불 가능합니다'
      }
    }

    const refundAmount = request.amount || payment.amount
    
    // 환불 금액 검증
    if (refundAmount > payment.amount) {
      return {
        success: false,
        error: '환불 금액이 결제 금액을 초과할 수 없습니다'
      }
    }

    // 환불 처리 (PG사 API 호출 없이 데이터베이스에서만 처리)
    // 실제 환경에서는 각 PG사의 API를 호출해야 함

    // 환불 정보 저장
    const { data: user } = await supabase.auth.getUser()
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        payment_id: request.paymentId,
        original_amount: payment.amount,
        refund_amount: refundAmount,
        remaining_amount: payment.amount - refundAmount,
        refund_reason: request.reason,
        refund_type: refundAmount === payment.amount ? 'full' : 'partial',
        refund_category: 'user_request',
        provider: payment.provider || 'unknown',
        refund_account: request.refundAccount,
        refund_bank_code: request.refundBankCode,
        refund_holder: request.refundHolder,
        requested_at: new Date().toISOString(),
        processed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (refundError) throw refundError

    // 결제 상태 업데이트
    const newStatus = refundAmount === payment.amount ? 'refunded' : 'partialCancelled'
    await updatePaymentStatus(request.paymentId, newStatus as PaymentStatus, {
      cancelled_at: new Date().toISOString()
    })

    // 환불 로그 기록
    await logPaymentEvent(request.paymentId, 'refund_completed', {
      refundId: refund.id,
      refundAmount,
      refundType: refundAmount === payment.amount ? 'full' : 'partial',
      reason: request.reason
    })

    // 관련 페이지 재검증
    revalidatePath('/admin/payments')
    revalidatePath('/admin/refunds')

    return {
      success: true,
      refundId: refund.id,
      refundAmount
    }

  } catch (error) {
    paymentLogger.error('Request refund error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

/**
 * 환불 내역 조회
 */
export async function getRefunds(
  filters?: {
    paymentId?: string
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }
): Promise<ApiResponse<RefundModel[]>> {
  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('refunds')
      .select(`
        *,
        payment:payments(
          id,
          order_id,
          amount,
          buyer_name,
          buyer_email,
          photographer:photographers(
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (filters?.paymentId) {
      query = query.eq('payment_id', filters.paymentId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    // 페이지네이션
    if (filters?.limit) {
      query = query.limit(filters.limit)
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + filters.limit - 1)
      }
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: (data || []) as any }

  } catch (error) {
    paymentLogger.error('Get refunds error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}

// ================================
// 유틸리티 함수들
// ================================

/**
 * 결제 이벤트 로그 기록
 */
async function logPaymentEvent(
  paymentId: string,
  eventType: string,
  eventData?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = await createClient()
  
  try {
    await supabase.from('payment_logs').insert({
      payment_id: paymentId,
      event_type: eventType,
      event_data: eventData,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    // 로그 기록 실패는 주요 기능에 영향을 주지 않도록 에러를 던지지 않음
    paymentLogger.error('Payment log error', error)
  }
}

// syncPaymentStatus 함수가 제거되었습니다.
// 필요시 각 PG사별 상태 동기화 함수를 별도로 구현해야 합니다.

/**
 * 만료된 결제들 정리
 */
export async function cleanupExpiredPayments(): Promise<ApiResponse<number>> {
  const supabase = await createClient()
  
  try {
    const expiredDate = new Date()
    expiredDate.setHours(expiredDate.getHours() - 1) // 1시간 전

    // 만료된 pending 결제들을 expired로 변경
    const { data, error } = await supabase
      .from('payments')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('created_at', expiredDate.toISOString())
      .select('id')

    if (error) throw error

    const expiredCount = data?.length || 0

    // inquiry 테이블도 업데이트
    if (expiredCount > 0) {
      const expiredPaymentIds = data.map(p => p.id)
      await supabase
        .from('inquiries')
        .update({ payment_status: 'cancelled' })
        .in('payment_id', expiredPaymentIds)
    }

    return { success: true, data: expiredCount }

  } catch (error) {
    paymentLogger.error('Cleanup expired payments error', error)
    return {
      success: false,
      error: formatErrorMessage(error)
    }
  }
}