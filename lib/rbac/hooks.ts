'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UserProfile, Permission } from './types'
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
  
  const supabase = createClientComponentClient()

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

        // 먼저 admins 테이블에서 확인
        const { data: adminData } = await supabase
          .from('admins')
          .select('id, email, name, role')
          .eq('id', authUser.id)
          .single()

        if (adminData) {
          setUser({
            ...adminData,
            userType: 'admin'
          })
          return
        }

        // admins에 없으면 photographers 테이블에서 확인
        const { data: photographerData } = await supabase
          .from('photographers')
          .select('id, email, name')
          .eq('id', authUser.id)
          .single()

        if (photographerData) {
          setUser({
            ...photographerData,
            role: 'photographer',
            userType: 'photographer'
          })
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

  return {
    user,
    hasPermission: (permission: Permission) => userHasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => userHasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => userHasAllPermissions(user, permissions),
    isAdmin: () => isAdmin(user),
    isPhotographer: () => isPhotographer(user),
    canAccessPage: (path: string) => canAccessPage(user, path),
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