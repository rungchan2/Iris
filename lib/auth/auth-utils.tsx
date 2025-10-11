/**
 * Authentication & Authorization Utilities for kindt
 *
 * Reusable authentication and permission management utilities
 * Based on kindt's role-based access control: admin | photographer | user
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

// ==================== Types ====================

export type UserRole = 'admin' | 'photographer' | 'user'

/**
 * Role hierarchy for permission checking
 * admin > photographer > user
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  photographer: 2,
  user: 1,
}

/**
 * User information interface
 */
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name?: string
  phone?: string
}

// ==================== Permission Checking ====================

/**
 * Check if user has minimum required role
 *
 * @example
 * hasMinimumRole('photographer', 'admin') // false
 * hasMinimumRole('admin', 'photographer') // true
 */
export function hasMinimumRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin'
}

/**
 * Check if user is photographer
 */
export function isPhotographer(role: UserRole | undefined): boolean {
  return role === 'photographer'
}

/**
 * Check if user is regular user
 */
export function isRegularUser(role: UserRole | undefined): boolean {
  return role === 'user'
}

// ==================== PermissionGuard (Route Level) ====================

interface PermissionGuardProps {
  /**
   * Minimum required role
   */
  minRole: UserRole

  /**
   * Callback when unauthorized
   * (Usually redirect or toast)
   */
  onUnauthorized?: () => void

  /**
   * Children components
   */
  children: React.ReactNode

  /**
   * Loading fallback (optional)
   */
  loadingFallback?: React.ReactNode

  /**
   * Unauthorized fallback (optional)
   * Default: shows error message
   */
  unauthorizedFallback?: React.ReactNode
}

/**
 * Permission Guard
 *
 * Layout level permission check and routing control
 */
export function PermissionGuard({
  minRole,
  onUnauthorized,
  children,
  loadingFallback,
  unauthorizedFallback,
}: PermissionGuardProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()

        if (error || !authUser) {
          setHasPermission(false)
          setIsLoading(false)
          onUnauthorized?.()
          return
        }

        // Get user role from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, name, phone')
          .eq('id', authUser.id)
          .single()

        if (userError || !userData) {
          setHasPermission(false)
          setIsLoading(false)
          onUnauthorized?.()
          return
        }

        const currentUser: AuthUser = {
          id: authUser.id,
          email: authUser.email || '',
          role: userData.role as UserRole,
          name: userData.name || undefined,
          phone: userData.phone || undefined,
        }

        setUser(currentUser)

        // Check permission
        const permitted = hasMinimumRole(currentUser.role, minRole)
        setHasPermission(permitted)

        if (!permitted) {
          onUnauthorized?.()
        }
      } catch (error) {
        console.error('[PermissionGuard] Auth check error:', error)
        setHasPermission(false)
        onUnauthorized?.()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [minRole, onUnauthorized, supabase, router])

  // Loading state
  if (isLoading) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>
  }

  // Unauthorized state
  if (!hasPermission) {
    return <>{unauthorizedFallback || <DefaultUnauthorizedFallback />}</>
  }

  // Authorized
  return <>{children}</>
}

// ==================== RoleGuard (UI Level) ====================

interface RoleGuardProps {
  /**
   * Minimum required role
   */
  minRole: UserRole

  /**
   * Children components
   */
  children: React.ReactNode

  /**
   * Fallback when unauthorized (optional)
   * Default: null (hidden)
   */
  fallback?: React.ReactNode
}

/**
 * Role Guard
 *
 * Show/hide UI elements based on role
 *
 * @example
 * import { RoleGuard } from '@/lib/auth/auth-utils'
 *
 * function Dashboard() {
 *   return (
 *     <div>
 *       <h1>대시보드</h1>
 *       <RoleGuard minRole="admin">
 *         <AdminPanel />
 *       </RoleGuard>
 *       <RoleGuard minRole="photographer">
 *         <PhotographerTools />
 *       </RoleGuard>
 *     </div>
 *   )
 * }
 */
export function RoleGuard({ minRole, children, fallback = null }: RoleGuardProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()

        if (error || !authUser) {
          setUser(null)
          setIsLoading(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role, name, phone')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: userData.role as UserRole,
            name: userData.name || undefined,
            phone: userData.phone || undefined,
          })
        }
      } catch (error) {
        console.error('[RoleGuard] User fetch error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [supabase])

  // Loading or not initialized
  if (isLoading) {
    return <>{fallback}</>
  }

  // Check permission
  if (!hasMinimumRole(user?.role, minRole)) {
    return <>{fallback}</>
  }

  // Has permission
  return <>{children}</>
}

// ==================== ProtectedAction (Button/Component Disable) ====================

interface ProtectedActionProps {
  /**
   * Minimum required role
   */
  minRole: UserRole

  /**
   * Children components
   */
  children: React.ReactNode

  /**
   * Message when unauthorized (optional)
   * Default: "접근 권한 없음"
   */
  message?: string

  /**
   * Container className (optional)
   */
  className?: string
}

/**
 * Protected Action
 *
 * Disable component and show overlay message when unauthorized
 */
export function ProtectedAction({
  minRole,
  children,
  message = '접근 권한 없음',
  className = '',
}: ProtectedActionProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()

        if (error || !authUser) {
          setUser(null)
          setIsLoading(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role, name, phone')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: userData.role as UserRole,
            name: userData.name || undefined,
            phone: userData.phone || undefined,
          })
        }
      } catch (error) {
        console.error('[ProtectedAction] User fetch error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [supabase])

  // Loading
  if (isLoading) {
    return <div className={`relative ${className}`}>{children}</div>
  }

  // Check permission
  const hasPermission = hasMinimumRole(user?.role, minRole)

  // Has permission - normal display
  if (hasPermission) {
    return <div className={className}>{children}</div>
  }

  // No permission - disabled + overlay
  return (
    <div className={`relative ${className}`}>
      {/* Disabled component */}
      <div className="opacity-50 pointer-events-none">{children}</div>

      {/* Overlay message */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-500/10 rounded-lg cursor-not-allowed">
        <div className="bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-gray-600 shadow-sm">
          {message}
        </div>
      </div>
    </div>
  )
}

// ==================== Utility Hooks ====================

/**
 * Hook to get current user
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          setError(authError.message)
          setUser(null)
          setIsLoading(false)
          return
        }

        if (!authUser) {
          setUser(null)
          setIsLoading(false)
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, name, phone')
          .eq('id', authUser.id)
          .single()

        if (userError) {
          setError(userError.message)
          setUser(null)
          setIsLoading(false)
          return
        }

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: userData.role as UserRole,
          name: userData.name || undefined,
          phone: userData.phone || undefined,
        })
        setError(null)
      } catch (err) {
        console.error('[useAuth] Error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [supabase])

  return { user, isLoading, error }
}

/**
 * Hook to check specific permission
 */
export function usePermission(minRole: UserRole): boolean {
  const { user, isLoading } = useAuth()

  if (isLoading) return false

  return hasMinimumRole(user?.role, minRole)
}

// ==================== Refresh Auth Button ====================

interface RefreshAuthButtonProps {
  /**
   * Button variant (default: outline)
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

  /**
   * Button size (default: sm)
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'

  /**
   * Button text (default: "새로고침")
   */
  children?: React.ReactNode

  /**
   * Callback on success
   */
  onSuccess?: () => void

  /**
   * Callback on error
   */
  onError?: (error: Error) => void

  /**
   * className (optional)
   */
  className?: string

  /**
   * Show icon (default: true)
   */
  showIcon?: boolean
}

/**
 * Refresh Auth Button
 *
 * Manual auth refresh button component
 */
export function RefreshAuthButton({
  variant = 'outline',
  size = 'sm',
  children = '새로고침',
  onSuccess,
  onError,
  className = '',
  showIcon = true,
}: RefreshAuthButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = createClient()

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // Refresh session
      const { error } = await supabase.auth.refreshSession()

      if (error) throw error

      toast.success('권한 정보가 업데이트되었습니다')
      onSuccess?.()

      // Reload page to reflect changes
      window.location.reload()
    } catch (error) {
      console.error('[RefreshAuthButton] Refresh failed:', error)
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
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} ${children ? 'mr-2' : ''}`}
        />
      )}
      {children}
    </Button>
  )
}

// ==================== Default Fallbacks ====================

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

function DefaultUnauthorizedFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">접근 권한 없음</h2>
        <p className="text-muted-foreground">이 페이지에 접근할 권한이 없습니다.</p>
      </div>
    </div>
  )
}

// ==================== Utility Functions ====================

/**
 * Permission check helper (non-component)
 */
export function checkPermission(
  user: { role: UserRole } | null | undefined,
  options: {
    minRole: UserRole
  }
): boolean {
  if (!user) return false

  return hasMinimumRole(user.role, options.minRole)
}
