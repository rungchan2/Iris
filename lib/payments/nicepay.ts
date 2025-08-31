/**
 * 나이스페이먼츠 API 연동을 위한 유틸리티 함수들
 * 
 * 이 파일은 나이스페이먼츠와의 모든 API 통신을 담당합니다.
 * Server 승인 방식을 사용하여 보안을 강화했습니다.
 */

import crypto from 'crypto'
import { 
  getNicePayConfig, 
  NICEPAY_RESPONSE_CODES, 
  RESPONSE_MESSAGES,
  PAYMENT_LOG_EVENTS,
  ORDER_ID_PATTERN,
  validateAmount,
  validateOrderId
} from './constants'
import {
  NicePayApprovalRequest,
  NicePayApprovalResponse,
  NicePayCancelRequest,
  NicePayTransactionResponse,
  PaymentCreateRequest,
  PaymentCreateResponse,
  RefundRequest,
  RefundResponse,
  ApiResponse
} from './types'

// ================================
// 환경 설정
// ================================

const config = getNicePayConfig()

/**
 * Basic Auth 헤더 생성
 */
function generateAuthHeader(): string {
  const credentials = `${config.clientId}:${config.secretKey}`
  const encoded = Buffer.from(credentials).toString('base64')
  return `Basic ${encoded}`
}

/**
 * Bearer Token 헤더 생성 (필요시 사용)
 */
async function generateBearerToken(): Promise<string> {
  try {
    const response = await fetch(`${config.apiUrl}/access-token`, {
      method: 'POST',
      headers: {
        'Authorization': generateAuthHeader(),
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (data.resultCode === NICEPAY_RESPONSE_CODES.SUCCESS) {
      return `Bearer ${data.accessToken}`
    } else {
      throw new Error(`Token generation failed: ${data.resultMsg}`)
    }
  } catch (error) {
    console.error('Bearer token generation error:', error)
    throw error
  }
}

// ================================
// 주문번호 및 서명 생성
// ================================

/**
 * 고유한 주문번호 생성
 * 패턴: IRIS_YYYYMMDD_HHMMSS_RANDOM
 */
export function generateOrderId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '') // HHMMSS
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  return `IRIS_${date}_${time}_${random}`
}

/**
 * SHA256 해시 생성
 */
function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * 결제 인증 서명 검증
 */
export function verifyAuthSignature(
  authToken: string,
  amount: string,
  signature: string
): boolean {
  try {
    const expectedSignature = generateHash(`${authToken}${config.clientId}${amount}${config.secretKey}`)
    return signature === expectedSignature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * API 요청용 서명 생성
 */
export function generateSignData(tid: string, amount: number, ediDate?: string): string {
  const dateStr = ediDate || new Date().toISOString()
  return generateHash(`${tid}${amount}${dateStr}${config.secretKey}`)
}

// ================================
// HTTP 요청 헬퍼
// ================================

/**
 * HTTP 요청 실행
 */
async function makeApiRequest<T>(
  url: string,
  options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: any
    headers?: Record<string, string>
    useBearer?: boolean
  }
): Promise<ApiResponse<T>> {
  const startTime = Date.now()
  
  try {
    const authHeader = options.useBearer 
      ? await generateBearerToken()
      : generateAuthHeader()

    const response = await fetch(url, {
      method: options.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    // API 응답 로깅
    console.log(`NicePay API Response [${options.method} ${url}]:`, {
      status: response.status,
      responseTime,
      resultCode: data.resultCode,
      resultMsg: data.resultMsg
    })

    if (data.resultCode === NICEPAY_RESPONSE_CODES.SUCCESS) {
      return { success: true, data }
    } else {
      return { 
        success: false, 
        error: data.resultMsg || RESPONSE_MESSAGES[data.resultCode] || '알 수 없는 오류',
        code: data.resultCode
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`NicePay API Error [${options.method} ${url}]:`, {
      error: error instanceof Error ? error.message : String(error),
      responseTime
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다',
      code: 'NETWORK_ERROR'
    }
  }
}

// ================================
// 결제 API 함수들
// ================================

/**
 * 결제 승인 요청
 */
export async function approvePayment(
  tid: string,
  amount: number,
  options?: {
    ediDate?: string
    signData?: string
    returnCharSet?: string
  }
): Promise<ApiResponse<NicePayApprovalResponse>> {
  // 입력 검증
  if (!tid || tid.trim().length === 0) {
    return { success: false, error: '거래 ID가 필요합니다', code: 'INVALID_TID' }
  }
  
  if (!validateAmount(amount)) {
    return { success: false, error: '올바른 결제 금액을 입력해주세요', code: 'INVALID_AMOUNT' }
  }

  const ediDate = options?.ediDate || new Date().toISOString()
  const signData = options?.signData || generateSignData(tid, amount, ediDate)
  
  const requestBody: NicePayApprovalRequest = {
    amount,
    ediDate,
    signData,
    returnCharSet: options?.returnCharSet || 'utf-8'
  }

  return makeApiRequest<NicePayApprovalResponse>(
    `${config.apiUrl}/payments/${tid}`,
    {
      method: 'POST',
      body: requestBody
    }
  )
}

/**
 * 결제 취소/환불 요청
 */
export async function cancelPayment(
  tid: string,
  reason: string,
  orderId: string,
  options?: {
    cancelAmt?: number
    mallReserved?: string
    taxFreeAmt?: number
    refundAccount?: string
    refundBankCode?: string
    refundHolder?: string
    ediDate?: string
  }
): Promise<ApiResponse<NicePayApprovalResponse>> {
  // 입력 검증
  if (!tid || !reason || !orderId) {
    return { 
      success: false, 
      error: '필수 정보가 누락되었습니다 (거래ID, 취소사유, 주문번호)', 
      code: 'INVALID_PARAMETERS' 
    }
  }

  if (!validateOrderId(orderId)) {
    return { success: false, error: '올바른 주문번호 형식이 아닙니다', code: 'INVALID_ORDER_ID' }
  }

  if (options?.cancelAmt && !validateAmount(options.cancelAmt)) {
    return { success: false, error: '올바른 취소 금액을 입력해주세요', code: 'INVALID_AMOUNT' }
  }

  const ediDate = options?.ediDate || new Date().toISOString()
  
  const requestBody: NicePayCancelRequest = {
    reason: reason.trim(),
    orderId,
    ediDate,
    returnCharSet: 'utf-8',
    signData: generateSignData(tid, options?.cancelAmt || 0, ediDate),
    ...(options?.cancelAmt && { cancelAmt: options.cancelAmt }),
    ...(options?.mallReserved && { mallReserved: options.mallReserved }),
    ...(options?.taxFreeAmt && { taxFreeAmt: options.taxFreeAmt }),
    ...(options?.refundAccount && { 
      refundAccount: options.refundAccount,
      refundBankCode: options.refundBankCode,
      refundHolder: options.refundHolder
    })
  }

  return makeApiRequest<NicePayApprovalResponse>(
    `${config.apiUrl}/payments/${tid}/cancel`,
    {
      method: 'POST',
      body: requestBody
    }
  )
}

/**
 * 거래 상태 조회
 */
export async function getTransactionStatus(tid: string): Promise<ApiResponse<NicePayTransactionResponse>> {
  // 입력 검증
  if (!tid || tid.trim().length === 0) {
    return { success: false, error: '거래 ID가 필요합니다', code: 'INVALID_TID' }
  }

  return makeApiRequest<NicePayTransactionResponse>(
    `${config.apiUrl}/payments/${tid}`,
    {
      method: 'GET'
    }
  )
}

// ================================
// 결제 생성 및 관리 함수들
// ================================

/**
 * 결제 정보 생성 및 검증
 */
export async function createPaymentRequest(
  request: PaymentCreateRequest
): Promise<PaymentCreateResponse> {
  try {
    // 입력 검증
    const validation = validatePaymentRequest(request)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0] || '결제 정보가 올바르지 않습니다'
      }
    }

    // 주문번호 생성
    const orderId = generateOrderId()

    return {
      success: true,
      orderId,
      paymentId: request.inquiryId // 임시로 inquiryId 사용, 실제로는 DB에서 생성된 payment ID 사용
    }
  } catch (error) {
    console.error('Payment creation error:', error)
    return {
      success: false,
      error: '결제 생성 중 오류가 발생했습니다'
    }
  }
}

/**
 * 결제 요청 검증
 */
function validatePaymentRequest(request: PaymentCreateRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!request.inquiryId) errors.push('문의 ID가 필요합니다')
  if (!request.userId) errors.push('사용자 ID가 필요합니다')
  if (!request.photographerId) errors.push('작가 ID가 필요합니다')
  if (!validateAmount(request.amount)) errors.push('올바른 결제 금액을 입력해주세요')
  if (!request.buyerName?.trim()) errors.push('구매자 이름이 필요합니다')
  if (!request.buyerEmail?.trim()) errors.push('구매자 이메일이 필요합니다')
  if (!request.productName?.trim()) errors.push('상품명이 필요합니다')

  // 이메일 형식 검증
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (request.buyerEmail && !emailPattern.test(request.buyerEmail)) {
    errors.push('올바른 이메일 형식이 아닙니다')
  }

  // 전화번호 형식 검증 (선택사항)
  if (request.buyerTel) {
    const phonePattern = /^01[0-9]{8,9}$/
    if (!phonePattern.test(request.buyerTel.replace(/-/g, ''))) {
      errors.push('올바른 전화번호 형식이 아닙니다')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ================================
// 환불 관리 함수들
// ================================

/**
 * 환불 처리
 */
export async function processRefund(request: RefundRequest): Promise<RefundResponse> {
  try {
    // 입력 검증
    if (!request.paymentId || !request.reason?.trim()) {
      return {
        success: false,
        error: '결제 ID와 환불 사유가 필요합니다'
      }
    }

    if (request.amount && !validateAmount(request.amount)) {
      return {
        success: false,
        error: '올바른 환불 금액을 입력해주세요'
      }
    }

    // TODO: 실제로는 데이터베이스에서 결제 정보를 조회해야 함
    // 여기서는 예시로 임시 데이터 사용
    const mockTid = 'mock_transaction_id'
    const mockOrderId = generateOrderId()

    const cancelResult = await cancelPayment(
      mockTid,
      request.reason,
      mockOrderId,
      {
        cancelAmt: request.amount,
        refundAccount: request.refundAccount,
        refundBankCode: request.refundBankCode,
        refundHolder: request.refundHolder
      }
    )

    if (cancelResult.success && cancelResult.data) {
      return {
        success: true,
        refundId: cancelResult.data.cancelledTid || cancelResult.data.tid,
        cancelledTid: cancelResult.data.cancelledTid,
        refundAmount: request.amount || cancelResult.data.amount
      }
    } else {
      return {
        success: false,
        error: cancelResult.error || '환불 처리 중 오류가 발생했습니다'
      }
    }
  } catch (error) {
    console.error('Refund processing error:', error)
    return {
      success: false,
      error: '환불 처리 중 시스템 오류가 발생했습니다'
    }
  }
}

// ================================
// 웹훅 검증 함수들
// ================================

/**
 * 웹훅 요청 검증
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  try {
    const webhookSecret = secret || process.env.PAYMENT_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Webhook secret not configured')
      return false
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    // 상수 시간 비교를 통한 타이밍 공격 방지
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// ================================
// 유틸리티 함수들
// ================================

/**
 * 결제 수단별 설정 반환
 */
export function getPaymentMethodConfig(method: string) {
  const baseConfig = {
    clientId: config.clientId,
    returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/nicepay/process`,
    currency: 'KRW',
    language: 'KO' as const,
    returnCharSet: 'utf-8' as const
  }

  // 결제 수단별 특별 설정
  switch (method) {
    case 'card':
      return {
        ...baseConfig,
        cardQuota: '00,02,03,04,05,06,07,08,09,10,11,12', // 사용 가능한 할부개월
        disableScroll: true
      }
    default:
      return baseConfig
  }
}

/**
 * 에러 메시지 포맷팅
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error?.resultMsg) {
    return error.resultMsg
  }
  
  if (error?.message) {
    return error.message
  }
  
  return '알 수 없는 오류가 발생했습니다'
}

/**
 * 금액 포맷팅 (한국 원화)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount)
}

/**
 * 금액 포맷팅 (숫자만)
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

/**
 * 결제 수단명 한글 변환
 */
export function getPaymentMethodName(method: string): string {
  const methodNames: Record<string, string> = {
    card: '신용/체크카드',
    bank: '실시간 계좌이체',
    cellphone: '휴대폰',
    naverpayCard: '네이버페이',
    kakaopay: '카카오페이',
    kakaopayCard: '카카오페이 카드',
    kakaopayMoney: '카카오페이 머니',
    samsungpayCard: '삼성페이',
    payco: '페이코',
    ssgpay: 'SSGPAY',
    cardAndEasyPay: '카드 및 간편결제'
  }
  
  return methodNames[method] || method
}

/**
 * 결제 상태 한글 변환
 */
export function getPaymentStatusName(status: string): string {
  const statusNames: Record<string, string> = {
    pending: '결제 대기',
    paid: '결제 완료',
    ready: '준비 완료',
    failed: '결제 실패',
    cancelled: '결제 취소',
    partialCancelled: '부분 취소',
    refunded: '환불 완료',
    expired: '결제 만료'
  }
  
  return statusNames[status] || status
}

/**
 * 환경 설정 확인
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.clientId) {
    errors.push('NICEPAY_CLIENT_ID 환경변수가 설정되지 않았습니다')
  }
  
  if (!config.secretKey) {
    errors.push('NICEPAY_SECRET_KEY 환경변수가 설정되지 않았습니다')
  }
  
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    errors.push('NEXT_PUBLIC_SITE_URL 환경변수가 설정되지 않았습니다')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 디버깅용 로그 출력 (개발환경에서만)
 */
export function debugLog(message: string, data?: any): void {
  if (config.environment === 'sandbox' || process.env.NODE_ENV === 'development') {
    console.log(`[NicePay Debug] ${message}`, data)
  }
}

// ================================
// 내보내기
// ================================

export default {
  generateOrderId,
  verifyAuthSignature,
  generateSignData,
  approvePayment,
  cancelPayment,
  getTransactionStatus,
  createPaymentRequest,
  processRefund,
  verifyWebhookSignature,
  getPaymentMethodConfig,
  formatErrorMessage,
  formatCurrency,
  formatAmount,
  getPaymentMethodName,
  getPaymentStatusName,
  validateEnvironment,
  debugLog
}