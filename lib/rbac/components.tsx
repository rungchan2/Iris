'use client'

import { ReactNode, useEffect } from 'react'
import { Permission } from './types'
import { usePermissions, useUserProfile } from './hooks'
import { toast } from 'sonner'

interface RoleGuardProps {
  children: ReactNode
  roles?: ('admin' | 'photographer')[]
  userTypes?: ('admin' | 'photographer')[]
  fallback?: ReactNode
  showToast?: boolean
}

/**
 * 역할 기반 접근 제어 컴포넌트
 */
export function RoleGuard({ children, roles, userTypes, fallback = null, showToast = true }: RoleGuardProps) {
  const { user } = useUserProfile()

  useEffect(() => {
    if (!user && showToast) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (user && showToast) {
      const hasValidRole = roles ? roles.includes(user.role) : true
      const hasValidUserType = userTypes ? userTypes.includes(user.userType) : true

      if (!hasValidRole || !hasValidUserType) {
        toast.error('접근 권한이 없습니다.')
      }
    }
  }, [user, roles, userTypes, showToast])

  if (!user) return <>{fallback}</>

  const hasValidRole = roles ? roles.includes(user.role) : true
  const hasValidUserType = userTypes ? userTypes.includes(user.userType) : true

  if (hasValidRole && hasValidUserType) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  showToast?: boolean
}

/**
 * 권한 기반 접근 제어 컴포넌트
 */
export function PermissionGuard({ 
  children, 
  permission, 
  permissions, 
  requireAll = false, 
  fallback = null,
  showToast = true
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, user } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  } else {
    hasAccess = true // 권한 설정이 없으면 허용
  }

  useEffect(() => {
    if (!user && showToast) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (user && !hasAccess && showToast) {
      toast.error('접근 권한이 없습니다.')
    }
  }, [user, hasAccess, showToast])

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

interface AdminGuardProps {
  children: ReactNode
  adminOnly?: boolean
  fallback?: ReactNode
  showToast?: boolean
}

/**
 * 관리자 전용 컴포넌트
 */
export function AdminGuard({ children, adminOnly = true, fallback = null, showToast = true }: AdminGuardProps) {
  const { isAdmin, user } = usePermissions()

  const hasAccess = adminOnly ? isAdmin() : isAdmin()

  useEffect(() => {
    if (!user && showToast) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (user && !hasAccess && showToast) {
      toast.error('관리자 권한이 필요합니다.')
    }
  }, [user, hasAccess, showToast])

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

interface PhotographerGuardProps {
  children: ReactNode
  fallback?: ReactNode
  showToast?: boolean
}

/**
 * 작가 전용 컴포넌트
 */
export function PhotographerGuard({ children, fallback = null, showToast = true }: PhotographerGuardProps) {
  const { isPhotographer, user } = usePermissions()

  const hasAccess = isPhotographer()

  useEffect(() => {
    if (!user && showToast) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (user && !hasAccess && showToast) {
      toast.error('작가 권한이 필요합니다.')
    }
  }, [user, hasAccess, showToast])

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

interface ConditionalRenderProps {
  children: ReactNode
  condition: boolean
  fallback?: ReactNode
}

/**
 * 조건부 렌더링 컴포넌트
 */
export function ConditionalRender({ children, condition, fallback = null }: ConditionalRenderProps) {
  if (condition) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

interface ResourceOwnerGuardProps {
  children: ReactNode
  resourceOwnerId: string
  fallbackPermission?: Permission
  fallback?: ReactNode
  showToast?: boolean
}

/**
 * 리소스 소유자 또는 권한 있는 사용자만 접근 가능한 컴포넌트
 */
export function ResourceOwnerGuard({ 
  children, 
  resourceOwnerId, 
  fallbackPermission,
  fallback = null,
  showToast = true
}: ResourceOwnerGuardProps) {
  const { user, hasPermission } = usePermissions()

  const isOwner = user?.id === resourceOwnerId
  const hasRequiredPermission = fallbackPermission ? hasPermission(fallbackPermission) : false
  const hasAccess = isOwner || hasRequiredPermission

  useEffect(() => {
    if (!user && showToast) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (user && !hasAccess && showToast) {
      toast.error('리소스에 대한 접근 권한이 없습니다.')
    }
  }, [user, hasAccess, showToast])

  if (!user) return <>{fallback}</>

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

// HOC 스타일의 래퍼들
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  roles?: ('admin' | 'photographer')[],
  userTypes?: ('admin' | 'photographer')[],
  fallback?: ReactNode,
  showToast?: boolean
) {
  return function WrappedComponent(props: P) {
    return (
      <RoleGuard roles={roles} userTypes={userTypes} fallback={fallback} showToast={showToast}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}

export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permission?: Permission,
  permissions?: Permission[],
  requireAll?: boolean,
  fallback?: ReactNode,
  showToast?: boolean
) {
  return function WrappedComponent(props: P) {
    return (
      <PermissionGuard 
        permission={permission} 
        permissions={permissions}
        requireAll={requireAll}
        fallback={fallback}
        showToast={showToast}
      >
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  adminOnly?: boolean,
  fallback?: ReactNode,
  showToast?: boolean
) {
  return function WrappedComponent(props: P) {
    return (
      <AdminGuard adminOnly={adminOnly} fallback={fallback} showToast={showToast}>
        <Component {...props} />
      </AdminGuard>
    )
  }
}