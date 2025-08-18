// RBAC 타입 정의

export type UserRole = 'admin' | 'photographer'

export type Permission = 
  // 사용자 관리
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  // 초대 관리
  | 'invites.create'
  | 'invites.read'
  | 'invites.delete'
  // 사진 관리
  | 'photos.create'
  | 'photos.read'
  | 'photos.update'
  | 'photos.delete'
  // 카테고리 관리
  | 'categories.create'
  | 'categories.read'
  | 'categories.update'
  | 'categories.delete'
  // 문의 관리
  | 'inquiries.read'
  | 'inquiries.update'
  | 'inquiries.delete'
  // 일정 관리
  | 'schedule.create'
  | 'schedule.read'
  | 'schedule.update'
  | 'schedule.delete'
  // 시스템 설정
  | 'system.config'
  | 'system.logs'
  // 통계 및 분석
  | 'analytics.read'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  userType: 'admin' | 'photographer'
}

export interface RolePermissions {
  [key: string]: Permission[]
}

// 권한 매트릭스 (2단계 구조: Admin → Photographer)
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    // 사용자 관리 (모든 권한)
    'users.create',
    'users.read', 
    'users.update',
    'users.delete',
    // 초대 관리
    'invites.create',
    'invites.read',
    'invites.delete',
    // 사진 관리 (모든 권한)
    'photos.create',
    'photos.read',
    'photos.update', 
    'photos.delete',
    // 카테고리 관리 (모든 권한)
    'categories.create',
    'categories.read',
    'categories.update',
    'categories.delete',
    // 문의 관리 (모든 권한)
    'inquiries.read',
    'inquiries.update', 
    'inquiries.delete',
    // 일정 관리 (모든 권한)
    'schedule.create',
    'schedule.read',
    'schedule.update',
    'schedule.delete',
    // 시스템 설정 (모든 권한)
    'system.config',
    'system.logs',
    // 통계 분석 (모든 권한)
    'analytics.read'
  ],
  photographer: [
    // 사진 관리 (자신의 것만)
    'photos.create',
    'photos.read',
    'photos.update',
    // 카테고리 읽기만
    'categories.read',
    // 문의 관리 (자신 관련만)
    'inquiries.read',
    'inquiries.update',
    // 일정 관리 (자신의 것만)
    'schedule.create',
    'schedule.read', 
    'schedule.update',
    'schedule.delete'
  ]
}