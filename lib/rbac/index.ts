// RBAC 모듈 통합 내보내기

// 타입
export type { UserRole, Permission, UserProfile, RolePermissions } from './types'
export { ROLE_PERMISSIONS } from './types'

// 권한 체크 함수들
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  isAdmin,
  isSuperAdmin,
  isPhotographer,
  canAccessOwnResource,
  canAccessResource,
  canAccessPage,
  navigationPermissions
} from './permissions'

// React 훅들
export {
  useUserProfile,
  usePermissions,
  useHasPermission,
  useHasAnyPermission,
  useIsAdmin,
  useIsPhotographer
} from './hooks'

// 컴포넌트 가드들
export {
  RoleGuard,
  PermissionGuard,
  AdminGuard,
  PhotographerGuard,
  ConditionalRender,
  ResourceOwnerGuard,
  withRoleGuard,
  withPermissionGuard,
  withAdminGuard
} from './components'

// 사용 예시들을 위한 유틸리티
export const RBAC = {
  // 자주 사용하는 권한 조합들
  PHOTO_MANAGEMENT: ['photos.create', 'photos.read', 'photos.update', 'photos.delete'] as Permission[],
  USER_MANAGEMENT: ['users.create', 'users.read', 'users.update', 'users.delete'] as Permission[],
  SYSTEM_ADMIN: ['system.config', 'system.logs', 'invites.create'] as Permission[],
  
  // 자주 사용하는 역할 조합들
  ADMIN_ROLES: ['admin', 'super_admin'] as const,
  ALL_ROLES: ['super_admin', 'admin', 'photographer'] as const,
} as const