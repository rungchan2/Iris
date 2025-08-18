import { UserRole, Permission, ROLE_PERMISSIONS, UserProfile } from './types'

/**
 * 특정 역할이 특정 권한을 가지고 있는지 확인
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * 여러 권한 중 하나라도 가지고 있는지 확인 (OR 조건)
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * 모든 권한을 가지고 있는지 확인 (AND 조건)
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * 사용자 프로필 기반 권한 체크
 */
export function userHasPermission(user: UserProfile | null, permission: Permission): boolean {
  if (!user) return false
  return hasPermission(user.role, permission)
}

/**
 * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
 */
export function userHasAnyPermission(user: UserProfile | null, permissions: Permission[]): boolean {
  if (!user) return false
  return hasAnyPermission(user.role, permissions)
}

/**
 * 사용자가 모든 권한을 가지고 있는지 확인
 */
export function userHasAllPermissions(user: UserProfile | null, permissions: Permission[]): boolean {
  if (!user) return false
  return hasAllPermissions(user.role, permissions)
}

/**
 * 관리자 권한 확인 (admin 또는 super_admin)
 */
export function isAdmin(user: UserProfile | null): boolean {
  return user?.userType === 'admin'
}

/**
 * 슈퍼 관리자 권한 확인
 */
export function isSuperAdmin(user: UserProfile | null): boolean {
  // Since role system was removed, all admins are treated equally
  return user?.userType === 'admin'
}

/**
 * 작가 권한 확인
 */
export function isPhotographer(user: UserProfile | null): boolean {
  return user?.userType === 'photographer'
}

/**
 * 자신의 리소스에 대한 권한 확인
 */
export function canAccessOwnResource(user: UserProfile | null, resourceOwnerId: string): boolean {
  return user?.id === resourceOwnerId
}

/**
 * 리소스에 대한 권한 확인 (자신 것이거나 적절한 권한이 있는 경우)
 */
export function canAccessResource(
  user: UserProfile | null, 
  resourceOwnerId: string, 
  requiredPermission: Permission
): boolean {
  if (!user) return false
  
  // 자신의 리소스인 경우
  if (canAccessOwnResource(user, resourceOwnerId)) return true
  
  // 권한이 있는 경우  
  return userHasPermission(user, requiredPermission)
}

/**
 * 네비게이션 메뉴 접근 권한 확인
 */
export const navigationPermissions = {
  '/admin': ['inquiries.read'],
  '/admin/photos': ['photos.read'],
  '/admin/category': ['categories.read'],
  '/admin/schedule': ['schedule.read'],
  '/admin/admin-users': ['users.read'],
  '/admin/my-account': [], // 모든 사용자 접근 가능
  '/admin/invites': ['invites.read'],
  '/admin/analytics': ['analytics.read'],
} as const

/**
 * 페이지 접근 권한 확인
 */
export function canAccessPage(user: UserProfile | null, path: string): boolean {
  const requiredPermissions = navigationPermissions[path as keyof typeof navigationPermissions]
  
  if (!requiredPermissions) return true // 권한 설정이 없으면 접근 허용
  if (requiredPermissions.length === 0) return !!user // 로그인한 사용자만 접근
  
  return userHasAnyPermission(user, [...requiredPermissions])
}