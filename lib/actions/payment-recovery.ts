'use server'

/**
 * Payment Recovery & Exception Handling Actions
 * 결제 예외 처리 및 복구 메커니즘 Server Actions
 */

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { paymentLogger } from '@/lib/logger'
import { getPayment as getTossPayment } from '@/lib/payments/toss-server'
import { revalidatePath } from 'next/cache'

/**
 * 복구 큐 항목 타입
 */
interface RecoveryQueueItem {
  id: string
  payment_id: string
  payment_key?: string
  order_id: string
  failed_step: 'update_paid' | 'create_settlement' | 'update_inquiry' | 'timeout' | 'toss_error'
  retry_count: number
  last_retry_at?: string
  error_message?: string
  status: 'pending' | 'recovered' | 'failed'
  toss_response?: any
  created_at: string
}

/**
 * 결제 로그 타입
 */
interface PaymentLog {
  id: string
  payment_id: string
  event_type: string
  event_data?: any
  error_message?: string
  http_status_code?: number
  ip_address?: string
  user_agent?: string
  created_at: string
}

/**
 * 1. 복구 큐 조회
 * NOTE: payment_recovery_queue 테이블이 아직 생성되지 않았습니다.
 * 이 기능을 활성화하려면 먼저 테이블을 생성해야 합니다.
 */
export async function getRecoveryQueue(filters?: {
  status?: 'pending' | 'recovered' | 'failed'
  failedStep?: string
  limit?: number
}): Promise<{ success: boolean; data?: any[]; error?: string }> {
  return {
    success: false,
    error: 'Recovery queue table not yet created. Please create payment_recovery_queue table first.'
  }

  /* TODO: Uncomment when payment_recovery_queue table is created
  try {
    const supabase = createServiceRoleClient()

    const queryBuilder = supabase
      .from('payment_recovery_queue')
      .select('*')
      .order('created_at', { ascending: false })

    let finalQuery = queryBuilder

    if (filters?.status) {
      finalQuery = finalQuery.eq('status', filters.status) as typeof queryBuilder
    }

    if (filters?.failedStep) {
      finalQuery = finalQuery.eq('failed_step', filters.failedStep) as typeof queryBuilder
    }

    if (filters?.limit) {
      finalQuery = finalQuery.limit(filters.limit) as typeof queryBuilder
    }

    const { data, error } = await finalQuery

    if (error) {
      paymentLogger.error('Failed to fetch recovery queue', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    paymentLogger.error('Error in getRecoveryQueue', error)
    return { success: false, error: 'Failed to fetch recovery queue' }
  }
  */
}

/**
 * 2. 결제 로그 조회
 */
export async function getPaymentLogs(paymentId: string) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false })

    if (error) {
      paymentLogger.error('Failed to fetch payment logs', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as PaymentLog[] }
  } catch (error) {
    paymentLogger.error('Error in getPaymentLogs', error)
    return { success: false, error: 'Failed to fetch payment logs' }
  }
}

/**
 * 3. 토스 결제 상태 조회 (수동 동기화)
 */
export async function syncPaymentWithToss(paymentId: string) {
  try {
    const supabase = createServiceRoleClient()

    // 1. 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return { success: false, error: '결제 정보를 찾을 수 없습니다' }
    }

    if (!payment.provider_transaction_id) {
      return { success: false, error: '토스 결제 키가 없습니다' }
    }

    // 2. 토스 API로 실제 상태 조회
    const tossPayment = await getTossPayment(payment.provider_transaction_id)

    // 3. 상태 매핑
    const statusMap: Record<string, string> = {
      'DONE': 'paid',
      'CANCELED': 'cancelled',
      'PARTIAL_CANCELED': 'partialCancelled',
      'ABORTED': 'failed',
      'EXPIRED': 'expired',
      'IN_PROGRESS': 'processing',
      'WAITING_FOR_DEPOSIT': 'pending',
    }

    const mappedStatus = statusMap[tossPayment.status] || payment.status

    // 4. DB 업데이트
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: mappedStatus,
        raw_response: tossPayment as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (updateError) {
      paymentLogger.error('Failed to sync payment status', updateError)
      return { success: false, error: '상태 동기화 실패' }
    }

    // 5. 로그 기록
    await supabase.from('payment_logs').insert({
      payment_id: paymentId,
      event_type: 'manual_sync',
      event_data: {
        previous_status: payment.status,
        new_status: mappedStatus,
        toss_status: tossPayment.status
      },
      created_at: new Date().toISOString()
    })

    paymentLogger.info('Payment synced with Toss', {
      paymentId,
      oldStatus: payment.status,
      newStatus: mappedStatus
    })

    revalidatePath('/admin/payments')

    return {
      success: true,
      data: {
        oldStatus: payment.status,
        newStatus: mappedStatus,
        tossStatus: tossPayment.status
      }
    }
  } catch (error) {
    paymentLogger.error('Error in syncPaymentWithToss', error)
    return { success: false, error: '토스 동기화 중 오류 발생' }
  }
}

/**
 * 4. 결제 상태 강제 업데이트 (관리자용)
 */
export async function forceUpdatePaymentStatus(
  paymentId: string,
  newStatus: string,
  reason: string
) {
  try {
    const supabase = createServiceRoleClient()

    // 1. 현재 상태 조회
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('status')
      .eq('id', paymentId)
      .single()

    if (fetchError || !payment) {
      return { success: false, error: '결제 정보를 찾을 수 없습니다' }
    }

    // 2. 상태 업데이트
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (updateError) {
      paymentLogger.error('Failed to force update status', updateError)
      return { success: false, error: '상태 업데이트 실패' }
    }

    // 3. 로그 기록
    await supabase.from('payment_logs').insert({
      payment_id: paymentId,
      event_type: 'admin_force_update',
      event_data: {
        previous_status: payment.status,
        new_status: newStatus,
        reason
      },
      created_at: new Date().toISOString()
    })

    paymentLogger.warn('Payment status forcefully updated', {
      paymentId,
      oldStatus: payment.status,
      newStatus,
      reason
    })

    revalidatePath('/admin/payments')

    return { success: true, data: { oldStatus: payment.status, newStatus } }
  } catch (error) {
    paymentLogger.error('Error in forceUpdatePaymentStatus', error)
    return { success: false, error: '상태 강제 업데이트 실패' }
  }
}

/**
 * 5. settlement_items 수동 생성
 */
export async function createSettlementItem(paymentId: string) {
  try {
    const supabase = createServiceRoleClient()

    // 1. 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        photographer:photographers(
          id,
          settlement_ratio,
          tax_rate
        )
      `)
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return { success: false, error: '결제 정보를 찾을 수 없습니다' }
    }

    if (!payment.photographer) {
      return { success: false, error: '작가 정보를 찾을 수 없습니다' }
    }

    // 2. 이미 정산 항목이 있는지 확인
    const { data: existingItem } = await supabase
      .from('settlement_items')
      .select('id')
      .eq('payment_id', paymentId)
      .single()

    if (existingItem) {
      return { success: false, error: '이미 정산 항목이 존재합니다' }
    }

    // 3. 정산 금액 계산
    const amount = payment.amount
    const settlementRatio = payment.photographer.settlement_ratio || 70
    const taxRate = payment.photographer.tax_rate || 3.3

    const platformFee = Math.floor(amount * (100 - settlementRatio) / 100)
    const taxAmount = Math.floor(amount * taxRate / 100)
    const settlementAmount = amount - platformFee - taxAmount

    // 4. 정산 날짜 계산 (익월 10일)
    const settlementDate = new Date()
    settlementDate.setMonth(settlementDate.getMonth() + 1)
    settlementDate.setDate(10)

    // 5. settlement_items 생성
    const { error: insertError } = await supabase
      .from('settlement_items')
      .insert({
        payment_id: paymentId,
        payment_amount: amount,
        platform_fee: platformFee,
        payment_gateway_fee: 0, // Default to 0 for manual creation
        tax_amount: taxAmount,
        settlement_amount: settlementAmount,
        status: 'pending',
        created_at: new Date().toISOString()
      } as any)

    if (insertError) {
      paymentLogger.error('Failed to create settlement item', insertError)
      return { success: false, error: '정산 항목 생성 실패' }
    }

    // 6. 로그 기록
    await supabase.from('payment_logs').insert({
      payment_id: paymentId,
      event_type: 'settlement_created_manually',
      event_data: {
        settlement_amount: settlementAmount,
        platform_fee: platformFee,
        tax_amount: taxAmount
      },
      created_at: new Date().toISOString()
    })

    paymentLogger.info('Settlement item created manually', {
      paymentId,
      settlementAmount
    })

    return { success: true, data: { settlementAmount } }
  } catch (error) {
    paymentLogger.error('Error in createSettlementItem', error)
    return { success: false, error: '정산 항목 생성 중 오류 발생' }
  }
}

/**
 * 6. 복구 큐 항목 재시도
 * NOTE: payment_recovery_queue 테이블이 아직 생성되지 않았습니다.
 */
export async function retryRecoveryItem(recoveryId: string) {
  return {
    success: false,
    error: 'Recovery queue table not yet created. Please create payment_recovery_queue table first.'
  }

  /* TODO: Uncomment when payment_recovery_queue table is created
  try {
    const supabase = createServiceRoleClient()

    // 1. 복구 항목 조회
    const { data: recovery, error: fetchError } = await supabase
      .from('payment_recovery_queue')
      .select('*')
      .eq('id', recoveryId)
      .single()

    if (fetchError || !recovery) {
      return { success: false, error: '복구 항목을 찾을 수 없습니다' }
    }

    if (recovery.retry_count >= 5) {
      return { success: false, error: '최대 재시도 횟수 초과 (5회)' }
    }

    // 2. failed_step별 복구 로직
    let recoveryResult

    switch (recovery.failed_step) {
      case 'update_paid':
        // payments 상태 업데이트 재시도
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            provider_transaction_id: recovery.payment_key,
            paid_at: new Date().toISOString(),
            raw_response: recovery.toss_response,
            updated_at: new Date().toISOString()
          })
          .eq('id', recovery.payment_id)
          .eq('status', 'processing')

        recoveryResult = !updateError
        break

      case 'create_settlement':
        // settlement_items 생성 재시도
        const settlementResult = await createSettlementItem(recovery.payment_id)
        recoveryResult = settlementResult.success
        break

      case 'timeout':
        // 토스 상태 조회 후 업데이트
        const syncResult = await syncPaymentWithToss(recovery.payment_id)
        recoveryResult = syncResult.success
        break

      default:
        return { success: false, error: '알 수 없는 복구 단계' }
    }

    // 3. 복구 결과에 따라 큐 업데이트
    if (recoveryResult) {
      // 복구 성공
      await supabase
        .from('payment_recovery_queue')
        .update({
          status: 'recovered',
          updated_at: new Date().toISOString()
        })
        .eq('id', recoveryId)

      await supabase.from('payment_logs').insert({
        payment_id: recovery.payment_id,
        event_type: 'recovered',
        event_data: {
          recovery_id: recoveryId,
          failed_step: recovery.failed_step,
          retry_count: recovery.retry_count + 1
        },
        created_at: new Date().toISOString()
      })

      paymentLogger.info('Recovery successful', {
        recoveryId,
        paymentId: recovery.payment_id,
        failedStep: recovery.failed_step
      })

      revalidatePath('/admin/payments')

      return { success: true, message: '복구 성공' }
    } else {
      // 복구 실패 - retry_count 증가
      const newRetryCount = recovery.retry_count + 1
      const newStatus = newRetryCount >= 5 ? 'failed' : 'pending'

      await supabase
        .from('payment_recovery_queue')
        .update({
          retry_count: newRetryCount,
          last_retry_at: new Date().toISOString(),
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', recoveryId)

      paymentLogger.warn('Recovery retry failed', {
        recoveryId,
        paymentId: recovery.payment_id,
        retryCount: newRetryCount
      })

      return {
        success: false,
        error: `복구 실패 (재시도 ${newRetryCount}/5)`
      }
    }
  } catch (error) {
    paymentLogger.error('Error in retryRecoveryItem', error)
    return { success: false, error: '복구 재시도 중 오류 발생' }
  }
  */
}

/**
 * 7. 사기 시도 감지 내역 조회
 */
export async function getFraudAttempts(filters?: {
  startDate?: string
  endDate?: string
  limit?: number
}) {
  try {
    const supabase = createServiceRoleClient()

    let query = supabase
      .from('payment_logs')
      .select(`
        *,
        payment:payments(
          order_id,
          amount,
          buyer_name,
          buyer_email,
          user_id
        )
      `)
      .eq('event_type', 'fraud_attempt')
      .order('created_at', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      paymentLogger.error('Failed to fetch fraud attempts', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    paymentLogger.error('Error in getFraudAttempts', error)
    return { success: false, error: 'Failed to fetch fraud attempts' }
  }
}

/**
 * 8. 결제 이상 패턴 분석
 */
export async function analyzePaymentAnomalies() {
  try {
    const supabase = createServiceRoleClient()

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // 1. 최근 5분간 타임아웃 비율
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('status')
      .gte('created_at', fiveMinutesAgo.toISOString())

    const timeoutCount = recentPayments?.filter(p => p.status === 'timeout').length || 0
    const totalCount = recentPayments?.length || 0
    const timeoutRatio = totalCount > 0 ? (timeoutCount / totalCount) * 100 : 0

    // 2. 최근 1시간 동일 IP 사기 시도
    const { data: fraudByIP } = await supabase
      .from('payment_logs')
      .select('ip_address')
      .eq('event_type', 'fraud_attempt')
      .gte('created_at', oneHourAgo.toISOString())

    const ipCounts: Record<string, number> = {}
    fraudByIP?.forEach((log: any) => {
      if (log.ip_address) {
        ipCounts[log.ip_address as string] = (ipCounts[log.ip_address as string] || 0) + 1
      }
    })

    const suspiciousIPs = Object.entries(ipCounts)
      .filter(([_, count]) => count >= 3)
      .map(([ip, count]) => ({ ip, count }))

    // 3. 최근 5분간 토스 500 에러
    const { data: tossErrors } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('event_type', 'toss_api_failed')
      .eq('http_status_code', 500)
      .gte('created_at', fiveMinutesAgo.toISOString())

    return {
      success: true,
      data: {
        timeoutRatio,
        timeoutAlert: timeoutRatio > 20,
        suspiciousIPs,
        tossErrorCount: tossErrors?.length || 0,
        tossErrorAlert: (tossErrors?.length || 0) >= 3
      }
    }
  } catch (error) {
    paymentLogger.error('Error in analyzePaymentAnomalies', error)
    return { success: false, error: 'Failed to analyze anomalies' }
  }
}
