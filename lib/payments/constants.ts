/**
 * 결제 시스템 상수 정의
 * 
 * 이 파일은 결제 시스템에서 사용되는 모든 상수값을 정의합니다.
 */

import { PaymentMethod, PaymentStatus, RefundStatus, RefundType } from './types'

// ================================
// 일반 결제 시스템 설정
// ================================

// ================================
// 결제 수단 관련 상수
// ================================

/**
 * 결제 수단 목록
 */
export const PAYMENT_METHODS: Record<StandardPaymentMethod, {
  code: StandardPaymentMethod
  name: string
  description: string
  icon: string
}> = {
  card: {
    code: 'card',
    name: '신용/체크카드',
    description: '국내외 모든 카드 결제 가능',
    icon: '💳'
  },
  bank_transfer: {
    code: 'bank_transfer',
    name: '실시간 계좌이체',
    description: '은행 계좌에서 바로 결제',
    icon: '🏦'
  },
  cellphone: {
    code: 'cellphone',
    name: '휴대폰',
    description: '휴대폰 소액결제',
    icon: '📱'
  },
  'wallet:naverpay': {
    code: 'wallet:naverpay',
    name: '네이버페이',
    description: '네이버페이 간편결제',
    icon: '🟢'
  },
  'wallet:kakaopay': {
    code: 'wallet:kakaopay',
    name: '카카오페이',
    description: '카카오페이 간편결제',
    icon: '🟡'
  },
  'wallet:samsungpay': {
    code: 'wallet:samsungpay',
    name: '삼성페이',
    description: '삼성페이 간편결제',
    icon: '📱'
  },
  'wallet:payco': {
    code: 'wallet:payco',
    name: '페이코',
    description: '페이코 간편결제',
    icon: '🔴'
  },
  'wallet:ssgpay': {
    code: 'wallet:ssgpay',
    name: 'SSGPAY',
    description: 'SSGPAY 간편결제',
    icon: '🛍️'
  }
} as const

/**
 * 인기 결제 수단 순서
 */
export const POPULAR_PAYMENT_METHODS: StandardPaymentMethod[] = [
  'card',
  'wallet:kakaopay', 
  'wallet:naverpay',
  'bank_transfer'
]

// ================================
// 결제 상태 관련 상수
// ================================

/**
 * 결제 상태 정보
 */
export const PAYMENT_STATUSES: Record<PaymentStatus, {
  code: PaymentStatus
  name: string
  description: string
  color: string
  icon: string
}> = {
  pending: {
    code: 'pending',
    name: '결제 대기',
    description: '결제가 진행 중입니다',
    color: 'warning',
    icon: '⏳'
  },
  paid: {
    code: 'paid', 
    name: '결제 완료',
    description: '결제가 성공적으로 완료되었습니다',
    color: 'success',
    icon: '✅'
  },
  ready: {
    code: 'ready',
    name: '준비 완료',
    description: '가상계좌가 발급되었습니다',
    color: 'info',
    icon: '📝'
  },
  failed: {
    code: 'failed',
    name: '결제 실패',
    description: '결제 처리 중 오류가 발생했습니다',
    color: 'error',
    icon: '❌'
  },
  cancelled: {
    code: 'cancelled',
    name: '결제 취소',
    description: '결제가 취소되었습니다',
    color: 'neutral',
    icon: '🚫'
  },
  partialCancelled: {
    code: 'partialCancelled',
    name: '부분 취소',
    description: '결제가 부분적으로 취소되었습니다',
    color: 'warning',
    icon: '🔸'
  },
  refunded: {
    code: 'refunded',
    name: '환불 완료',
    description: '결제 금액이 환불되었습니다',
    color: 'neutral',
    icon: '↩️'
  },
  expired: {
    code: 'expired',
    name: '결제 만료',
    description: '결제 유효기간이 만료되었습니다',
    color: 'error',
    icon: '⏰'
  }
} as const

/**
 * 완료된 결제 상태들
 */
export const COMPLETED_PAYMENT_STATUSES: PaymentStatus[] = ['paid']

/**
 * 실패한 결제 상태들  
 */
export const FAILED_PAYMENT_STATUSES: PaymentStatus[] = ['failed', 'expired']

/**
 * 취소된 결제 상태들
 */
export const CANCELLED_PAYMENT_STATUSES: PaymentStatus[] = ['cancelled', 'partialCancelled', 'refunded']

/**
 * 진행 중인 결제 상태들
 */
export const PENDING_PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'ready']

// ================================
// 환불 관련 상수
// ================================

/**
 * 환불 타입 정보
 */
export const REFUND_TYPES: Record<RefundType, {
  code: RefundType
  name: string
  description: string
}> = {
  full: {
    code: 'full',
    name: '전액 환불',
    description: '결제 금액 전체를 환불합니다'
  },
  partial: {
    code: 'partial', 
    name: '부분 환불',
    description: '결제 금액의 일부를 환불합니다'
  }
} as const

/**
 * 환불 상태 정보
 */
export const REFUND_STATUSES: Record<RefundStatus, {
  code: RefundStatus
  name: string
  description: string
  color: string
  icon: string
}> = {
  pending: {
    code: 'pending',
    name: '환불 대기',
    description: '환불 요청이 접수되어 처리 중입니다',
    color: 'warning',
    icon: '⏳'
  },
  completed: {
    code: 'completed',
    name: '환불 완료', 
    description: '환불이 성공적으로 완료되었습니다',
    color: 'success',
    icon: '✅'
  },
  failed: {
    code: 'failed',
    name: '환불 실패',
    description: '환불 처리 중 오류가 발생했습니다',
    color: 'error',
    icon: '❌'
  }
} as const

// ================================
// 은행 코드 관련 상수
// ================================


/**
 * 은행 코드 매핑
 */
export const BANK_CODES: Record<string, string> = {
  '02': 'KDB산업은행',
  '03': 'IBK기업은행', 
  '04': 'KB국민은행',
  '05': 'KEB하나은행',
  '06': '국민은행',
  '07': '수협중앙회',
  '08': '수출입은행',
  '11': 'NH농협은행',
  '12': '지역농축협',
  '20': '우리은행',
  '23': 'SC제일은행',
  '27': '씨티은행',
  '31': '대구은행',
  '32': '부산은행',
  '34': '광주은행',
  '35': '제주은행',
  '37': '전북은행',
  '39': '경남은행',
  '45': '새마을금고',
  '48': '신협중앙회',
  '50': '상호저축은행',
  '64': '산림조합',
  '71': '우체국',
  '81': 'KEB하나은행',
  '88': '신한은행',
  '89': 'K뱅크',
  '90': '카카오뱅크',
  '92': '토스뱅크'
} as const

// ================================
// 비즈니스 규칙 상수
// ================================

/**
 * 결제 금액 관련 제한
 */
export const PAYMENT_LIMITS = {
  MIN_AMOUNT: 100,           // 최소 결제 금액 (100원)
  MAX_AMOUNT: 10_000_000,    // 최대 결제 금액 (1천만원)
  MAX_DAILY_AMOUNT: 50_000_000, // 일일 최대 결제 한도 (5천만원)
  
  // 결제수단별 제한
  CARD: {
    MIN: 100,
    MAX: 10_000_000
  },
  BANK: {
    MIN: 100,
    MAX: 50_000_000
  },
  CELLPHONE: {
    MIN: 100,
    MAX: 300_000
  }
} as const

/**
 * 시간 관련 설정
 */
export const TIME_LIMITS = {
  PAYMENT_TIMEOUT: 30 * 60 * 1000,      // 결제 타임아웃: 30분 (밀리초)
  REFUND_PROCESSING_DAYS: 3,             // 환불 처리 기간: 3일
  SETTLEMENT_DAY: 15,                    // 정산일: 매월 15일
  LOG_RETENTION_DAYS: 90                 // 로그 보관 기간: 90일
} as const

/**
 * 수수료 관련 설정
 */
export const FEE_RATES = {
  PLATFORM_FEE_RATE: 0.30,    // 플랫폼 수수료율: 30%
  TAX_RATE: 0.033,             // 원천징수율: 3.3%
  
  // 결제수단별 수수료 (예상값)
  CARD_FEE_RATE: 0.034,        // 카드 수수료: 3.4%
  BANK_FEE_RATE: 0.008,        // 계좌이체 수수료: 0.8%
  CELLPHONE_FEE_RATE: 0.055     // 휴대폰 수수료: 5.5%
} as const

// ================================
// API 응답 코드
// ================================

/**
 * 일반적인 응답 코드
 */
export const RESPONSE_CODES = {
  SUCCESS: '0000',              // 성공
  INVALID_PARAMETER: '1000',    // 파라미터 오류
  DUPLICATE_ORDER: '2001',      // 중복 주문
  CARD_DECLINED: '3001',        // 카드사 거절
  INSUFFICIENT_FUNDS: '3002',   // 잔액 부족
  SYSTEM_ERROR: '4000',         // 시스템 오류
  NETWORK_ERROR: '5000',        // 네트워크 오류
  TIMEOUT: '6000'               // 타임아웃
} as const

/**
 * 응답 코드별 메시지
 */
export const RESPONSE_MESSAGES: Record<string, string> = {
  [RESPONSE_CODES.SUCCESS]: '처리가 완료되었습니다',
  [RESPONSE_CODES.INVALID_PARAMETER]: '요청 정보를 확인해주세요',
  [RESPONSE_CODES.DUPLICATE_ORDER]: '이미 처리된 주문입니다',
  [RESPONSE_CODES.CARD_DECLINED]: '카드사에서 거절했습니다',
  [RESPONSE_CODES.INSUFFICIENT_FUNDS]: '잔액이 부족합니다',
  [RESPONSE_CODES.SYSTEM_ERROR]: '일시적인 오류가 발생했습니다',
  [RESPONSE_CODES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요',
  [RESPONSE_CODES.TIMEOUT]: '요청 시간이 초과되었습니다'
} as const

// ================================
// 로그 이벤트 타입
// ================================

/**
 * 결제 로그 이벤트 타입
 */
export const PAYMENT_LOG_EVENTS = {
  // 인증 관련
  AUTH_REQUEST: 'auth_request',
  AUTH_SUCCESS: 'auth_success', 
  AUTH_FAILED: 'auth_failed',
  
  // 결제 관련  
  PAYMENT_REQUEST: 'payment_request',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  
  // 취소/환불 관련
  CANCEL_REQUEST: 'cancel_request',
  CANCEL_SUCCESS: 'cancel_success',
  CANCEL_FAILED: 'cancel_failed',
  
  // 웹훅 관련
  WEBHOOK_RECEIVED: 'webhook_received',
  WEBHOOK_PROCESSED: 'webhook_processed',
  WEBHOOK_FAILED: 'webhook_failed',
  
  // 오류 관련
  VALIDATION_ERROR: 'validation_error',
  SYSTEM_ERROR: 'system_error',
  NETWORK_ERROR: 'network_error'
} as const

// ================================
// 검증 규칙
// ================================

/**
 * 주문번호 생성 패턴
 */
export const ORDER_ID_PATTERN = /^IRIS_\d{8}_\d{6}_[A-Z0-9]{6}$/

/**
 * 전화번호 검증 패턴
 */
export const PHONE_PATTERN = /^01[0-9]{8,9}$/

/**
 * 이메일 검증 패턴  
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 금액 검증 함수
 */
export const validateAmount = (amount: number): boolean => {
  return amount >= PAYMENT_LIMITS.MIN_AMOUNT && amount <= PAYMENT_LIMITS.MAX_AMOUNT
}

/**
 * 주문번호 검증 함수
 */
export const validateOrderId = (orderId: string): boolean => {
  return ORDER_ID_PATTERN.test(orderId)
}

// ================================
// URL 경로
// ================================

/**
 * 결제 관련 URL 경로
 */
export const PAYMENT_ROUTES = {
  // 결제 페이지
  PAYMENT: '/payment',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_FAIL: '/payment/fail',
  PAYMENT_STATUS: '/payment/[id]',
  
  // API 경로
  API_CONFIG: '/api/payment/config',
  API_PROCESS: '/api/payment/process', 
  API_CANCEL: '/api/payment/cancel',
  API_STATUS: '/api/payment/status',
  API_WEBHOOK: '/api/payment/webhook',
  
  // 관리자 경로
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_PAYMENT_DETAIL: '/admin/payments/[id]',
  ADMIN_REFUNDS: '/admin/refunds',
  
  // 작가 경로
  PHOTOGRAPHER_PAYMENTS: '/photographer-admin/payments'
} as const

// ================================
// 에러 메시지
// ================================

/**
 * 공통 에러 메시지
 */
export const ERROR_MESSAGES = {
  // 일반적인 에러
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요',
  SERVER_ERROR: '서버 오류가 발생했습니다',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다',
  
  // 인증 관련
  UNAUTHORIZED: '인증이 필요합니다',
  FORBIDDEN: '접근 권한이 없습니다',
  INVALID_TOKEN: '유효하지 않은 토큰입니다',
  
  // 결제 관련
  INVALID_AMOUNT: '올바른 결제 금액을 입력해주세요',
  INVALID_ORDER_ID: '올바른 주문번호 형식이 아닙니다', 
  PAYMENT_NOT_FOUND: '결제 정보를 찾을 수 없습니다',
  PAYMENT_ALREADY_PROCESSED: '이미 처리된 결제입니다',
  PAYMENT_CANCELLED: '취소된 결제입니다',
  PAYMENT_EXPIRED: '결제 유효기간이 만료되었습니다',
  
  // 환불 관련
  REFUND_NOT_ALLOWED: '환불할 수 없는 결제입니다',
  REFUND_AMOUNT_EXCEEDED: '환불 가능 금액을 초과했습니다',
  REFUND_ALREADY_PROCESSED: '이미 환불된 결제입니다',
  
  
  // 검증 관련
  REQUIRED_FIELD: '필수 입력 항목입니다',
  INVALID_EMAIL: '올바른 이메일 형식이 아닙니다',
  INVALID_PHONE: '올바른 전화번호 형식이 아닙니다',
  INVALID_FORMAT: '올바른 형식이 아닙니다'
} as const

// ================================
// 성공 메시지  
// ================================

/**
 * 공통 성공 메시지
 */
export const SUCCESS_MESSAGES = {
  PAYMENT_SUCCESS: '결제가 성공적으로 완료되었습니다',
  REFUND_SUCCESS: '환불이 성공적으로 완료되었습니다',
  CANCEL_SUCCESS: '결제가 성공적으로 취소되었습니다'
} as const