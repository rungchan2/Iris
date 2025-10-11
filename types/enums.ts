import type { Database } from './database.types'

// ============================================================================
// Database Enums - Extracted from database.types.ts
// ============================================================================

/**
 * Approval status for photographers
 * - pending: Awaiting admin review
 * - approved: Approved by admin
 * - rejected: Rejected by admin
 */
export type ApprovalStatus = Database['public']['Enums']['approval_status']

/**
 * User role in the system
 * - user: Regular customer
 * - photographer: Photographer account
 * - admin: System administrator
 */
export type UserRole = Database['public']['Enums']['user_role']

/**
 * Inquiry status in the system
 * Payment flow states:
 * - new: New inquiry (초기 문의)
 * - pending_payment: Waiting for payment (결제 대기)
 * - payment_failed: Payment failed (결제 실패)
 * - reserved: Payment completed, reservation confirmed (예약 확정)
 * - contacted: Photographer contacted customer (작가 연락 완료)
 * - completed: Shoot completed (촬영 완료)
 * - cancelled: Cancelled (취소됨)
 * - expired: Expired (만료됨)
 */
export type InquiryStatus = Database['public']['Enums']['inquiry_status']

/**
 * Document type for legal documents
 * - terms_of_service: Terms of Service (이용약관)
 * - privacy_policy: Privacy Policy (개인정보처리방침)
 */
export type DocumentType = 'terms_of_service' | 'privacy_policy'

// ============================================================================
// Enum Constants - Array values for validation and iteration
// ============================================================================

export const APPROVAL_STATUS = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
} as const

export const USER_ROLE = {
  USER: 'user' as const,
  PHOTOGRAPHER: 'photographer' as const,
  ADMIN: 'admin' as const,
} as const

export const INQUIRY_STATUS = {
  NEW: 'new' as const,
  PENDING_PAYMENT: 'pending_payment' as const,
  PAYMENT_FAILED: 'payment_failed' as const,
  RESERVED: 'reserved' as const,
  CONTACTED: 'contacted' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
  EXPIRED: 'expired' as const,
} as const

export const DOCUMENT_TYPE = {
  TERMS_OF_SERVICE: 'terms_of_service' as const,
  PRIVACY_POLICY: 'privacy_policy' as const,
} as const

// Array values for validation
export const APPROVAL_STATUS_VALUES: ApprovalStatus[] = [
  APPROVAL_STATUS.PENDING,
  APPROVAL_STATUS.APPROVED,
  APPROVAL_STATUS.REJECTED,
]

export const USER_ROLE_VALUES: UserRole[] = [
  USER_ROLE.USER,
  USER_ROLE.PHOTOGRAPHER,
  USER_ROLE.ADMIN,
]

export const INQUIRY_STATUS_VALUES: InquiryStatus[] = [
  INQUIRY_STATUS.NEW,
  INQUIRY_STATUS.PENDING_PAYMENT,
  INQUIRY_STATUS.PAYMENT_FAILED,
  INQUIRY_STATUS.RESERVED,
  INQUIRY_STATUS.CONTACTED,
  INQUIRY_STATUS.COMPLETED,
  INQUIRY_STATUS.CANCELLED,
  INQUIRY_STATUS.EXPIRED,
]

export const DOCUMENT_TYPE_VALUES: DocumentType[] = [
  DOCUMENT_TYPE.TERMS_OF_SERVICE,
  DOCUMENT_TYPE.PRIVACY_POLICY,
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a value is a valid ApprovalStatus
 */
export function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === 'string' && APPROVAL_STATUS_VALUES.includes(value as ApprovalStatus)
}

/**
 * Type guard to check if a value is a valid UserRole
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLE_VALUES.includes(value as UserRole)
}

/**
 * Type guard to check if a value is a valid InquiryStatus
 */
export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === 'string' && INQUIRY_STATUS_VALUES.includes(value as InquiryStatus)
}

/**
 * Type guard to check if a value is a valid DocumentType
 */
export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === 'string' && DOCUMENT_TYPE_VALUES.includes(value as DocumentType)
}

// ============================================================================
// Display Labels
// ============================================================================

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: '대기중',
  approved: '승인됨',
  rejected: '거절됨',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  user: '일반 사용자',
  photographer: '사진작가',
  admin: '관리자',
}

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: '새 문의',
  pending_payment: '결제 대기',
  payment_failed: '결제 실패',
  reserved: '예약 확정',
  contacted: '연락 완료',
  completed: '촬영 완료',
  cancelled: '취소됨',
  expired: '만료됨',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  terms_of_service: '이용약관',
  privacy_policy: '개인정보처리방침',
}
