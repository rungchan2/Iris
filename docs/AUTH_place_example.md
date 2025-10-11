```tsx
/**
 * Permission Utilities
 *
 * 권한 기반 라우팅 및 UI 제어 유틸리티
 */

'use client'

import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores/user-store'
import { UserRole } from '@/types/enums'
import { checkCenterApproval, checkBranchApproval } from '@/lib/services/approval-service'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/**
 * 권한 계층 구조
 * headquarter > branch > center > teacher > viewer
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  headquarter: 4,
  branch: 3,
  center: 2,
  viewer: 0,
}

/**
 * 권한 레벨 비교
 */
function hasMinimumRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

// ==================== Permission Guard (라우팅 레벨) ====================

interface PermissionGuardProps {
  /**
   * 최소 요구 권한
   */
  minRole: UserRole

  /**
   * 센터 관리자 권한 필요 여부
   */
  requireCenterAdmin?: boolean

  /**
   * 지사 관리자 권한 필요 여부
   */
  requireBranchAdmin?: boolean

  /**
   * 센터 승인 상태 확인 필요 여부
   * (center_users.is_approved = true 검증)
   */
  requireCenterApproved?: boolean

  /**
   * 지사 승인 상태 확인 필요 여부
   * (branch_users.is_approved = true 검증)
   */
  requireBranchApproved?: boolean

  /**
   * 권한 없을 시 실행할 callback
   * (주로 redirect, toast 등)
   */
  onUnauthorized: () => void

  /**
   * 자식 컴포넌트
   */
  children: React.ReactNode

  /**
   * 로딩 중 표시할 fallback (선택)
   */
  fallback?: React.ReactNode
}

/**
 * Permission Guard
 *
 * Layout 레벨에서 권한 체크 및 라우팅 제어
 *
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * import { PermissionGuard } from '@/lib/auth/permission-utils'
 * import { useRouter } from 'next/navigation'
 *
 * export default function AdminLayout({ children }) {
 *   const router = useRouter()
 *
 *   return (
 *     <PermissionGuard
 *       minRole="branch"
 *       requireBranchAdmin={true}
 *       onUnauthorized={() => {
 *         toast.error('지사 관리자 권한이 필요합니다')
 *         router.push('/')
 *       }}
 *     >
 *       {children}
 *     </PermissionGuard>
 *   )
 * }
 * ```
 */
export function PermissionGuard({
  minRole,
  requireCenterAdmin = false,
  requireBranchAdmin = false,
  requireCenterApproved = false,
  requireBranchApproved = false,
  onUnauthorized,
  children,
  fallback,
}: PermissionGuardProps) {
  const user = useUserStore(state => state.user)
  const isLoading = useUserStore(state => state.isLoading)
  const isInitialized = useUserStore(state => state.isInitialized)
  const isCenterAdmin = useUserStore(state => state.isCenterAdmin)
  const isBranchAdmin = useUserStore(state => state.isBranchAdmin)

  const [isCenterApproved, setIsCenterApproved] = useState<boolean | null>(null)
  const [isBranchApproved, setIsBranchApproved] = useState<boolean | null>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)

  // 승인 상태 확인 (DB 조회)
  useEffect(() => {
    async function checkApprovals() {
      if (!isInitialized || isLoading || !user?.id) return

      setApprovalLoading(true)

      try {
        // 센터 승인 확인
        if (requireCenterApproved && user.center_id) {
          const approved = await checkCenterApproval(user.id, user.center_id)
          setIsCenterApproved(approved)
        } else {
          setIsCenterApproved(true) // 체크 불필요시 통과
        }

        // 지사 승인 확인
        if (requireBranchApproved && user.branch_id) {
          const approved = await checkBranchApproval(user.id, user.branch_id)
          setIsBranchApproved(approved)
        } else {
          setIsBranchApproved(true) // 체크 불필요시 통과
        }
      } catch (error) {
        console.error('[PermissionGuard] Approval check error:', error)
        setIsCenterApproved(false)
        setIsBranchApproved(false)
      } finally {
        setApprovalLoading(false)
      }
    }

    checkApprovals()
  }, [isInitialized, isLoading, user, requireCenterApproved, requireBranchApproved])

  // 권한 체크 및 callback 실행
  useEffect(() => {
    // Store 초기화 대기
    if (!isInitialized) return

    // 로딩 완료 후 권한 체크
    if (!isLoading && !approvalLoading && isCenterApproved !== null && isBranchApproved !== null) {
      const hasRole = hasMinimumRole(user?.role, minRole)
      const hasCenterAdminPermission = !requireCenterAdmin || isCenterAdmin()
      const hasBranchAdminPermission = !requireBranchAdmin || isBranchAdmin()

      // 권한 체크 실패 시 callback 실행
      if (!hasRole || !hasCenterAdminPermission || !hasBranchAdminPermission || !isCenterApproved || !isBranchApproved) {
        console.warn('[PermissionGuard] 권한 없음:', {
          userRole: user?.role,
          minRole,
          requireCenterAdmin,
          requireBranchAdmin,
          requireCenterApproved,
          requireBranchApproved,
          isCenterAdmin: isCenterAdmin(),
          isBranchAdmin: isBranchAdmin(),
          isCenterApproved,
          isBranchApproved,
        })
        onUnauthorized()
      }
    }
  }, [
    user,
    isLoading,
    isInitialized,
    approvalLoading,
    minRole,
    requireCenterAdmin,
    requireBranchAdmin,
    requireCenterApproved,
    requireBranchApproved,
    isCenterApproved,
    isBranchApproved,
    onUnauthorized,
    isCenterAdmin,
    isBranchAdmin,
  ])

  // 로딩 중
  if (!isInitialized || isLoading || approvalLoading || isCenterApproved === null || isBranchApproved === null) {
    return <>{fallback || null}</>
  }

  // 권한 체크
  const hasRole = hasMinimumRole(user?.role, minRole)
  const hasCenterAdminPermission = !requireCenterAdmin || isCenterAdmin()
  const hasBranchAdminPermission = !requireBranchAdmin || isBranchAdmin()

  // 권한 없음 (callback은 useEffect에서 실행됨)
  if (!hasRole || !hasCenterAdminPermission || !hasBranchAdminPermission || !isCenterApproved || !isBranchApproved) {
    return <>{fallback || null}</>
  }

  // 권한 있음
  return <>{children}</>
}

// ==================== Role Guard (UI 레벨) ====================

interface RoleGuardProps {
  /**
   * 최소 요구 권한
   */
  minRole: UserRole

  /**
   * 센터 관리자 권한 필요 여부
   */
  requireCenterAdmin?: boolean

  /**
   * 지사 관리자 권한 필요 여부
   */
  requireBranchAdmin?: boolean

  /**
   * 센터 승인 상태 확인 필요 여부
   * (center_users.is_approved = true 검증)
   */
  requireCenterApproved?: boolean

  /**
   * 지사 승인 상태 확인 필요 여부
   * (branch_users.is_approved = true 검증)
   */
  requireBranchApproved?: boolean

  /**
   * 자식 컴포넌트
   */
  children: React.ReactNode

  /**
   * 권한 없을 때 표시할 fallback (선택)
   * 기본: null (숨김)
   */
  fallback?: React.ReactNode
}

/**
 * Role Guard
 *
 * 권한에 따라 UI 요소 표시/숨김 제어
 *
 * @example
 * tsx
 * import { RoleGuard } from '@/lib/auth/permission-utils'
 *
 * function Dashboard() {
 *   return (
 *     <div>
 *       <h1>대시보드</h1>
 *
 *       headquarter 이상만 표시
 *       <RoleGuard minRole="headquarter">
 *         <AdminPanel />
 *       </RoleGuard>
 *
 *       center 이상 + 센터 관리자만 표시
 *       <RoleGuard minRole="center" requireCenterAdmin>
 *         <SettingsButton />
 *       </RoleGuard>
 *
 *       branch 이상 + 지사 관리자만 표시
 *       <RoleGuard minRole="branch" requireBranchAdmin>
 *         <BranchManagement />
 *       </RoleGuard>
 *     </div>
 *   )
 * }
 *
 */
export function RoleGuard({
  minRole,
  requireCenterAdmin = false,
  requireBranchAdmin = false,
  requireCenterApproved = false,
  requireBranchApproved = false,
  children,
  fallback = null,
}: RoleGuardProps) {
  const user = useUserStore(state => state.user)
  const isLoading = useUserStore(state => state.isLoading)
  const isInitialized = useUserStore(state => state.isInitialized)
  const isCenterAdmin = useUserStore(state => state.isCenterAdmin)
  const isBranchAdmin = useUserStore(state => state.isBranchAdmin)

  const [isCenterApproved, setIsCenterApproved] = useState<boolean | null>(null)
  const [isBranchApproved, setIsBranchApproved] = useState<boolean | null>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)

  // 승인 상태 확인 (DB 조회)
  useEffect(() => {
    async function checkApprovals() {
      if (!isInitialized || isLoading || !user?.id) return

      setApprovalLoading(true)

      try {
        // 센터 승인 확인
        if (requireCenterApproved && user.center_id) {
          const approved = await checkCenterApproval(user.id, user.center_id)
          setIsCenterApproved(approved)
        } else {
          setIsCenterApproved(true) // 체크 불필요시 통과
        }

        // 지사 승인 확인
        if (requireBranchApproved && user.branch_id) {
          const approved = await checkBranchApproval(user.id, user.branch_id)
          setIsBranchApproved(approved)
        } else {
          setIsBranchApproved(true) // 체크 불필요시 통과
        }
      } catch (error) {
        console.error('[RoleGuard] Approval check error:', error)
        setIsCenterApproved(false)
        setIsBranchApproved(false)
      } finally {
        setApprovalLoading(false)
      }
    }

    checkApprovals()
  }, [isInitialized, isLoading, user, requireCenterApproved, requireBranchApproved])

  // 로딩 중 또는 초기화 안 됨
  if (!isInitialized || isLoading || approvalLoading || isCenterApproved === null || isBranchApproved === null) {
    return <>{fallback}</>
  }

  // 권한 체크
  const hasRole = hasMinimumRole(user?.role, minRole)
  const hasCenterAdminPermission = !requireCenterAdmin || isCenterAdmin()
  const hasBranchAdminPermission = !requireBranchAdmin || isBranchAdmin()

  // 권한 없음 - 숨김
  if (!hasRole || !hasCenterAdminPermission || !hasBranchAdminPermission || !isCenterApproved || !isBranchApproved) {
    return <>{fallback}</>
  }

  // 권한 있음 - 표시
  return <>{children}</>
}

// ==================== Protected Action (버튼/컴포넌트 비활성화) ====================

interface ProtectedActionProps {
  /**
   * 최소 요구 권한
   */
  minRole: UserRole

  /**
   * 센터 관리자 권한 필요 여부
   */
  requireCenterAdmin?: boolean

  /**
   * 지사 관리자 권한 필요 여부
   */
  requireBranchAdmin?: boolean

  /**
   * 센터 승인 상태 확인 필요 여부
   * (center_users.is_approved = true 검증)
   */
  requireCenterApproved?: boolean

  /**
   * 지사 승인 상태 확인 필요 여부
   * (branch_users.is_approved = true 검증)
   */
  requireBranchApproved?: boolean

  /**
   * 자식 컴포넌트
   */
  children: React.ReactNode

  /**
   * 권한 없을 때 표시할 메시지 (선택)
   * 기본: "접근 권한 없음"
   */
  message?: string

  /**
   * 컨테이너 className (선택)
   */
  className?: string
}

/**
 * Protected Action
 *
 * 권한이 없을 때 컴포넌트를 비활성화하고 오버레이 메시지 표시
 *
 * @example
 * ```tsx
 * import { ProtectedAction } from '@/lib/auth/permission-utils'
 *
 * function Settings() {
 *   return (
 *     <ProtectedAction minRole="center" requireCenterAdmin>
 *       <button className="btn-primary">
 *         설정 변경
 *       </button>
 *     </ProtectedAction>
 *   )
 * }
 *
 * // 커스텀 메시지
 * <ProtectedAction
 *   minRole="headquarter"
 *   message="본사 권한이 필요합니다"
 * >
 *   <div className="action-panel">
 *     <button>삭제</button>
 *   </div>
 * </ProtectedAction>
 * ```
 */
export function ProtectedAction({
  minRole,
  requireCenterAdmin = false,
  requireBranchAdmin = false,
  requireCenterApproved = false,
  requireBranchApproved = false,
  children,
  message = '접근 권한 없음',
  className = '',
}: ProtectedActionProps) {
  const user = useUserStore(state => state.user)
  const isLoading = useUserStore(state => state.isLoading)
  const isInitialized = useUserStore(state => state.isInitialized)
  const isCenterAdmin = useUserStore(state => state.isCenterAdmin)
  const isBranchAdmin = useUserStore(state => state.isBranchAdmin)

  const [isCenterApproved, setIsCenterApproved] = useState<boolean | null>(null)
  const [isBranchApproved, setIsBranchApproved] = useState<boolean | null>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)

  // 승인 상태 확인 (DB 조회)
  useEffect(() => {
    async function checkApprovals() {
      if (!isInitialized || isLoading || !user?.id) return

      setApprovalLoading(true)

      try {
        // 센터 승인 확인
        if (requireCenterApproved && user.center_id) {
          const approved = await checkCenterApproval(user.id, user.center_id)
          setIsCenterApproved(approved)
        } else {
          setIsCenterApproved(true) // 체크 불필요시 통과
        }

        // 지사 승인 확인
        if (requireBranchApproved && user.branch_id) {
          const approved = await checkBranchApproval(user.id, user.branch_id)
          setIsBranchApproved(approved)
        } else {
          setIsBranchApproved(true) // 체크 불필요시 통과
        }
      } catch (error) {
        console.error('[ProtectedAction] Approval check error:', error)
        setIsCenterApproved(false)
        setIsBranchApproved(false)
      } finally {
        setApprovalLoading(false)
      }
    }

    checkApprovals()
  }, [isInitialized, isLoading, user, requireCenterApproved, requireBranchApproved])

  // 로딩 중
  if (!isInitialized || isLoading || approvalLoading || isCenterApproved === null || isBranchApproved === null) {
    return (
      <div className={`relative ${className}`}>
        {children}
      </div>
    )
  }

  // 권한 체크
  const hasRole = hasMinimumRole(user?.role, minRole)
  const hasCenterAdminPermission = !requireCenterAdmin || isCenterAdmin()
  const hasBranchAdminPermission = !requireBranchAdmin || isBranchAdmin()
  const hasPermission = hasRole && hasCenterAdminPermission && hasBranchAdminPermission && isCenterApproved && isBranchApproved

  // 권한 있음 - 정상 표시
  if (hasPermission) {
    return <div className={className}>{children}</div>
  }

  // 권한 없음 - 비활성화 + 오버레이
  return (
    <div className={`relative ${className}`}>
      {/* 비활성화된 컴포넌트 */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>

      {/* 오버레이 메시지 */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-500/10 rounded-lg cursor-not-allowed">
        <div className="bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-gray-600 shadow-sm">
          {message}
        </div>
      </div>
    </div>
  )
}

// ==================== 유틸리티 함수 ====================

/**
 * 권한 체크 헬퍼 (비컴포넌트용)
 *
 * @example
 *
 * import { checkPermission } from '@/lib/auth/permission-utils'
 *
 * const canAccess = checkPermission(user, {
 *   minRole: 'branch',
 *   requireBranchAdmin: true
 * })
 *
 */
export function checkPermission(
  user: { role: UserRole; is_center_admin?: boolean; is_branch_admin?: boolean } | null | undefined,
  options: {
    minRole: UserRole
    requireCenterAdmin?: boolean
    requireBranchAdmin?: boolean
  }
): boolean {
  if (!user) return false

  const hasRole = hasMinimumRole(user.role, options.minRole)
  const hasCenterAdmin = !options.requireCenterAdmin || (user.is_center_admin ?? false)
  const hasBranchAdmin = !options.requireBranchAdmin || (user.is_branch_admin ?? false)

  return hasRole && hasCenterAdmin && hasBranchAdmin
}

// ==================== Option D: 에러 재시도 래퍼 ====================

/**
 * 인증 에러 자동 재시도 래퍼
 *
 * JWT 만료 또는 Unauthorized 에러 발생 시 자동으로 권한을 갱신하고 재시도합니다.
 *
 * @example
 * ```typescript
 * // Server Action
 * export async function createStudent(data: StudentInsert) {
 *   'use server'
 *
 *   return withAuthRetry(async () => {
 *     const auth = await requireAuth()
 *     const centerId = auth.requireCenterId()
 *
 *     const supabase = await createClient()
 *     return await supabase.from('students').insert({
 *       ...data,
 *       center_id: centerId
 *     })
 *   })
 * }
 * ```
 *
 * @param fn 실행할 함수
 * @param maxRetries 최대 재시도 횟수 (기본: 1)
 * @returns 함수 실행 결과
 */
export async function withAuthRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // 인증 관련 에러 체크
    const isAuthError =
      error instanceof Error &&
      (error.message.includes('Unauthorized') ||
        error.message.includes('JWTExpired') ||
        error.message.includes('Authentication') ||
        error.message.includes('권한이 없습니다') ||
        error.message.includes('로그인이 필요합니다'))

    if (isAuthError && maxRetries > 0) {
      console.log(
        '\x1b[35m[withAuthRetry] 🔄 Auth error detected - refreshing and retrying...\x1b[0m',
        `\x1b[90m(${maxRetries} retries left)\x1b[0m`
      )

      try {
        // JWT 갱신
        const response = await fetch('/api/auth/perm/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Failed to refresh authentication')
        }

        console.log('\x1b[35m[withAuthRetry] ✅ Auth refreshed - retrying...\x1b[0m')

        // 재시도
        return await withAuthRetry(fn, maxRetries - 1)
      } catch (refreshError) {
        console.error('\x1b[31m[withAuthRetry] ❌ Refresh failed:\x1b[0m', refreshError)
        // 갱신 실패 시 원래 에러 전파
        throw error
      }
    }

    // 인증 에러 아니거나 재시도 횟수 소진
    throw error
  }
}

// ==================== Supabase 세션 기반 인증 체크 ====================

/**
 * Supabase 세션 확인 (JWT 쿠키 없이도 로그인 여부 파악)
 *
 * 사용 시나리오:
 * - 로그인 페이지에서 이미 로그인된 사용자 체크
 * - JWT 쿠키가 없지만 Supabase 세션은 있는 경우
 *
 * @returns Supabase 세션 존재 여부
 */
export async function checkSupabaseSession(): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[checkSupabaseSession] Error:', error)
      return false
    }

    return !!session
  } catch (error) {
    console.error('[checkSupabaseSession] Failed:', error)
    return false
  }
}

/**
 * Supabase 사용자 정보 가져오기 (세션 기반)
 *
 * JWT 쿠키 없이도 Supabase 세션에서 사용자 정보를 가져옵니다.
 *
 * @returns Supabase 사용자 정보 또는 null
 */
export async function getSupabaseUser(): Promise<{ id: string; email: string } | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || ''
    }
  } catch (error) {
    console.error('[getSupabaseUser] Failed:', error)
    return null
  }
}

/**
 * JWT 쿠키 재발급 요청
 *
 * Supabase 세션은 있지만 JWT 쿠키가 없을 때 호출하여 쿠키를 재발급합니다.
 *
 * @returns 재발급 성공 여부
 */
export async function reissuePermCookie(): Promise<boolean> {
  try {
    console.log('[reissuePermCookie] 🔄 Requesting JWT cookie reissue...')

    const response = await fetch('/api/auth/perm/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      console.error('[reissuePermCookie] ❌ Failed:', response.status)
      return false
    }

    console.log('[reissuePermCookie] ✅ JWT cookie reissued')
    return true
  } catch (error) {
    console.error('[reissuePermCookie] ❌ Error:', error)
    return false
  }
}

// ==================== RefreshAuthButton 컴포넌트 ====================

interface RefreshAuthButtonProps {
  /**
   * 버튼 variant (기본: outline)
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

  /**
   * 버튼 크기 (기본: sm)
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'

  /**
   * 버튼 텍스트 (기본: "권한 새로고침")
   */
  children?: React.ReactNode

  /**
   * 갱신 성공 시 콜백
   */
  onSuccess?: () => void

  /**
   * 갱신 실패 시 콜백
   */
  onError?: (error: Error) => void

  /**
   * className (선택)
   */
  className?: string

  /**
   * 아이콘 표시 여부 (기본: true)
   */
  showIcon?: boolean
}

/**
 * 권한 즉시 갱신 버튼
 *
 * 사용자가 수동으로 권한 정보를 갱신할 수 있는 버튼 컴포넌트
 *
 * @example
 * ```tsx
 * import { RefreshAuthButton } from '@/lib/auth/permission-utils'
 *
 * function Header() {
 *   return (
 *     <div className="flex items-center gap-2">
 *       <span>현재 권한: {user?.role}</span>
 *       <RefreshAuthButton />
 *     </div>
 *   )
 * }
 *
 * // 커스텀 스타일
 * <RefreshAuthButton
 *   variant="default"
 *   size="lg"
 *   onSuccess={() => console.log('Refreshed!')}
 * >
 *   권한 업데이트
 * </RefreshAuthButton>
 * ```
 */
export function RefreshAuthButton({
  variant = 'outline',
  size = 'sm',
  children = '권한 새로고침',
  onSuccess,
  onError,
  className = '',
  showIcon = true,
}: RefreshAuthButtonProps) {
  const refreshUserData = useUserStore(state => state.refreshUserData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      console.log('\x1b[35m[RefreshAuthButton] 🔄 Manual refresh triggered\x1b[0m')

      // 1. Server Action으로 권한 갱신
      await refreshUserData(true) // forceRefresh = true

      console.log('\x1b[35m[RefreshAuthButton] ✅ Refresh complete\x1b[0m')

      toast.success('권한 정보가 업데이트되었습니다')

      onSuccess?.()
    } catch (error) {
      console.error('\x1b[31m[RefreshAuthButton] ❌ Refresh failed:\x1b[0m', error)

      toast.error('권한 정보 업데이트에 실패했습니다')

      onError?.(error instanceof Error ? error : new Error('Unknown error'))
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className}
    >
      {showIcon && (
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} ${children ? 'mr-2' : ''}`} />
      )}
      {children}
    </Button>
  )
}

```