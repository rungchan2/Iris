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
