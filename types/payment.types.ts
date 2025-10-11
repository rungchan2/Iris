import { z } from 'zod'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Database Types
// ============================================================================

export type Payment = Tables<'payments'>
export type PaymentInsert = TablesInsert<'payments'>
export type PaymentUpdate = TablesUpdate<'payments'>

export type Refund = Tables<'refunds'>
export type RefundInsert = TablesInsert<'refunds'>
export type RefundUpdate = TablesUpdate<'refunds'>

// ============================================================================
// Payment Provider Types (타입 안전성을 위한 정의)
// ============================================================================

// Toss Payments 카드 정보
export interface TossCardInfo {
  company: string
  number: string
  installmentPlanMonths: number
  isInterestFree: boolean
  approveNo: string
  useCardPoint: boolean
  cardType: 'credit' | 'debit' | 'gift'
  ownerType: 'personal' | 'corporate'
  acquireStatus: 'ready' | 'requested' | 'completed' | 'cancel_requested' | 'canceled'
  receiptUrl: string | null
}

// Toss Payments 가상계좌 정보
export interface TossBankInfo {
  bank: string
  accountNumber: string
  accountHolder: string
  dueDate: string
  refundStatus: 'none' | 'pending' | 'failed' | 'completed'
  refundReceiveAccount: {
    bank: string
    accountNumber: string
    holderName: string
  } | null
}

// Toss Payments 간편결제 정보
export interface TossWalletInfo {
  provider: string
}

// Eximbay 카드 정보
export interface EximbayCardInfo {
  authcode: string
  cardno: string
  cardname: string
  quota: string
  displayCardno: string
}

// Adyen 카드 정보
export interface AdyenCardInfo {
  type: string
  number: string
  expiryMonth: string
  expiryYear: string
  holderName: string
  summary: string
}

// Stripe 카드 정보
export interface StripeCardInfo {
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  country: string
  funding: 'credit' | 'debit' | 'prepaid' | 'unknown'
}

// Payment Provider별 메타데이터 통합 타입
export type PaymentMetadata =
  | { provider: 'toss'; cardInfo?: TossCardInfo; bankInfo?: TossBankInfo; walletInfo?: TossWalletInfo }
  | { provider: 'eximbay'; cardInfo?: EximbayCardInfo }
  | { provider: 'adyen'; cardInfo?: AdyenCardInfo }
  | { provider: 'stripe'; cardInfo?: StripeCardInfo }
  | { provider: string; [key: string]: unknown }  // fallback for unknown providers

// ============================================================================
// Refund Form Schema
// ============================================================================

export const refundFormSchema = z.object({
  payment_id: z.string().min(1, '결제 ID를 입력해주세요'),
  refund_amount: z.number().min(1, '환불 금액은 1원 이상이어야 합니다'),
  refund_reason: z.string().min(1, '환불 사유를 입력해주세요').max(500, '최대 500자까지 입력 가능합니다'),
  refund_category: z.enum(['customer_request', 'photographer_cancel', 'admin_decision', 'payment_error'], {
    errorMap: () => ({ message: '환불 유형을 선택해주세요' }),
  }),
  refund_type: z.enum(['full', 'partial'], {
    errorMap: () => ({ message: '환불 타입을 선택해주세요' }),
  }),
  // 부분 환불 시 계좌 정보 (optional)
  refund_account: z.string().optional(),
  refund_bank_code: z.string().optional(),
  refund_holder: z.string().optional(),
  admin_note: z.string().max(1000, '최대 1000자까지 입력 가능합니다').optional(),
})

export type RefundFormData = z.infer<typeof refundFormSchema>

// ============================================================================
// Payment Methods Schema (결제 수단 선택)
// ============================================================================

export const paymentMethodSchema = z.enum([
  'card',
  'virtual_account',
  'transfer',
  'mobile',
  'wallet',
  'foreign_card'
], {
  errorMap: () => ({ message: '결제 수단을 선택해주세요' }),
})

export type PaymentMethod = z.infer<typeof paymentMethodSchema>

// ============================================================================
// Build-time Type Checks (Database와 Form 타입 일치 검증)
// ============================================================================

type _RefundFormDataCheck = {
  payment_id: RefundFormData['payment_id'] extends NonNullable<RefundInsert['payment_id']>
    ? true
    : 'payment_id type mismatch - check refunds.payment_id column type'

  refund_amount: RefundFormData['refund_amount'] extends NonNullable<RefundInsert['refund_amount']>
    ? true
    : 'refund_amount type mismatch - check refunds.refund_amount column type'

  refund_reason: RefundFormData['refund_reason'] extends NonNullable<RefundInsert['refund_reason']>
    ? true
    : 'refund_reason type mismatch - check refunds.refund_reason column type'

  refund_category: RefundFormData['refund_category'] extends NonNullable<RefundInsert['refund_category']>
    ? true
    : 'refund_category type mismatch - check refunds.refund_category column type'

  refund_type: RefundFormData['refund_type'] extends NonNullable<RefundInsert['refund_type']>
    ? true
    : 'refund_type type mismatch - check refunds.refund_type column type'

  refund_account: RefundFormData['refund_account'] extends RefundInsert['refund_account']
    ? true
    : 'refund_account type mismatch - check refunds.refund_account column type'

  refund_bank_code: RefundFormData['refund_bank_code'] extends RefundInsert['refund_bank_code']
    ? true
    : 'refund_bank_code type mismatch - check refunds.refund_bank_code column type'

  refund_holder: RefundFormData['refund_holder'] extends RefundInsert['refund_holder']
    ? true
    : 'refund_holder type mismatch - check refunds.refund_holder column type'

  admin_note: RefundFormData['admin_note'] extends RefundInsert['admin_note']
    ? true
    : 'admin_note type mismatch - check refunds.admin_note column type'
}

// ============================================================================
// Helper Types for Payment Flow
// ============================================================================

// 결제 생성 요청
export interface CreatePaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
  customerMobilePhone?: string
  provider: 'toss' | 'eximbay' | 'adyen' | 'stripe'
  successUrl: string
  failUrl: string
}

// 결제 승인 요청
export interface ConfirmPaymentRequest {
  paymentKey: string
  orderId: string
  amount: number
}

// 결제 상태
export type PaymentStatus =
  | 'pending'
  | 'ready'
  | 'in_progress'
  | 'waiting_for_deposit'
  | 'done'
  | 'canceled'
  | 'partial_canceled'
  | 'aborted'
  | 'expired'

// 결제 결과
export interface PaymentResult {
  success: boolean
  payment?: Payment
  error?: string
  metadata?: PaymentMetadata
}
