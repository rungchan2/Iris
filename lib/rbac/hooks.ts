'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, Permission, UserRole } from './types'
import { 
  userHasPermission, 
  userHasAnyPermission, 
  userHasAllPermissions,
  isAdmin,
  isPhotographer,
  canAccessPage
} from './permissions'

/**
 * 현재 사용자 프로필 정보를 가져오는 훅
 */
export function useUserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          setUser(null)
          return
        }

        // users 테이블에서 사용자 정보 확인
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          const userType: 'admin' | 'photographer' | null =
            userData.role === 'admin' ? 'admin' :
            userData.role === 'photographer' ? 'photographer' :
            null

          if (userType) {
            setUser({
              ...userData,
              userType,
              role: userData.role as UserRole,
            })
          } else {
            setUser(null)
          }
          return
        }

        // 둘 다 없으면 사용자 없음
        setUser(null)
        setError('사용자 정보를 찾을 수 없습니다.')

      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다.')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN') {
        fetchUserProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, loading, error, refetch: () => setLoading(true) }
}

/**
 * 권한 체크 훅
 */
export function usePermissions() {
  const { user } = useUserProfile()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    hasPermission: (permission: Permission) => userHasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => userHasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => userHasAllPermissions(user, permissions),
    isAdmin: () => isAdmin(user),
    isPhotographer: () => isPhotographer(user),
    canAccessPage: (path: string) => canAccessPage(user, path),
    signOut,
  }
}

/**
 * 특정 권한이 있는지 확인하는 훅
 */
export function useHasPermission(permission: Permission) {
  const { user } = useUserProfile()
  return userHasPermission(user, permission)
}

/**
 * 여러 권한 중 하나라도 있는지 확인하는 훅
 */
export function useHasAnyPermission(permissions: Permission[]) {
  const { user } = useUserProfile()
  return userHasAnyPermission(user, permissions)
}

/**
 * 관리자 권한이 있는지 확인하는 훅
 */
export function useIsAdmin() {
  const { user } = useUserProfile()
  return isAdmin(user)
}

/**
 * 관리자 권한이 있는지 확인하는 훅 (Admin-only)
 */
export function useIsAdminOnly() {
  const { user } = useUserProfile()
  return user?.role === 'admin'
}

/**
 * 작가 권한이 있는지 확인하는 훅
 */
export function useIsPhotographer() {
  const { user } = useUserProfile()
  return isPhotographer(user)
}