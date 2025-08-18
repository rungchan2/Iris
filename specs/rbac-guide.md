# RBAC (Role-Based Access Control) Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Types & Permissions](#user-types--permissions)
4. [Implementation Components](#implementation-components)
5. [Usage Patterns](#usage-patterns)
6. [Security Guidelines](#security-guidelines)
7. [Testing Strategies](#testing-strategies)
8. [Troubleshooting](#troubleshooting)
9. [Migration & Deployment](#migration--deployment)

## 🎯 Overview

Iris implements a comprehensive Role-Based Access Control (RBAC) system that provides:

- **Granular Permission Control**: 15+ specific permissions across different system areas
- **Type-Safe Implementation**: Full TypeScript integration with compile-time safety
- **Component-Level Guards**: React components that automatically enforce permissions
- **Database Security**: Row Level Security (RLS) policies aligned with application permissions
- **Scalable Architecture**: Easy to extend with new roles and permissions

### Key Benefits
- **Security**: Multi-layered permission validation (client + server + database)
- **Maintainability**: Centralized permission logic with clear separation of concerns
- **Developer Experience**: IntelliSense support and type checking for all permission operations
- **Performance**: Efficient permission checking with minimal database queries

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side   │    │   Database      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Guard Components│    │ Server Actions  │    │ RLS Policies    │
│ Permission Hooks│ ── │ Permission      │ ── │ Table Access    │
│ UI Conditionals │    │ Validation      │    │ Control         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Authentication**: Supabase Auth handles login
2. **Type Detection**: System identifies user type (admin vs photographer)
3. **Permission Loading**: User profile and permissions fetched
4. **UI Rendering**: Components conditionally render based on permissions
5. **Action Execution**: Server actions validate permissions before execution
6. **Database Access**: RLS policies provide final authorization layer

## 👥 User Types & Permissions

### User Hierarchy
```
Super Admin (super_admin)
    └── Admin (admin)
        └── Photographer (photographer)
```

### Permission Matrix

| Category | Permission | Super Admin | Admin | Photographer |
|----------|------------|-------------|-------|--------------|
| **Users** | `users.create` | ✅ | ❌ | ❌ |
| | `users.read` | ✅ | ✅ | ❌ |
| | `users.update` | ✅ | ✅ | 본인만 |
| | `users.delete` | ✅ | ❌ | ❌ |
| **Photos** | `photos.create` | ✅ | ✅ | ✅ |
| | `photos.read` | ✅ | ✅ | ✅ |
| | `photos.update` | ✅ | ✅ | 본인만 |
| | `photos.delete` | ✅ | ✅ | 본인만 |
| **Categories** | `categories.create` | ✅ | ✅ | ❌ |
| | `categories.read` | ✅ | ✅ | ✅ |
| | `categories.update` | ✅ | ✅ | ❌ |
| | `categories.delete` | ✅ | ✅ | ❌ |
| **Inquiries** | `inquiries.read` | ✅ | ✅ | 본인 관련만 |
| | `inquiries.update` | ✅ | ✅ | 본인 관련만 |
| | `inquiries.delete` | ✅ | ✅ | ❌ |
| **Schedule** | `schedule.create` | ✅ | ✅ | ✅ |
| | `schedule.read` | ✅ | ✅ | ✅ |
| | `schedule.update` | ✅ | ✅ | ✅ |
| | `schedule.delete` | ✅ | ✅ | 본인만 |
| **System** | `system.config` | ✅ | ❌ | ❌ |
| | `system.logs` | ✅ | ❌ | ❌ |
| **Analytics** | `analytics.read` | ✅ | ✅ | 제한적 |

### User Type Characteristics

#### Super Admin (`super_admin`)
- **Purpose**: System owner, initial setup and critical operations
- **Count**: Typically 1-2 users
- **Capabilities**: Full system access, user management, system configuration
- **Creation**: Only via `/superadmin` (first time) or by existing Super Admin

#### Admin (`admin`)
- **Purpose**: Content managers, customer service, daily operations
- **Count**: Multiple users as needed
- **Capabilities**: Content management, inquiry handling, photographer oversight
- **Creation**: Only by Super Admin via `/admin/users`

#### Photographer (`photographer`)
- **Purpose**: Content creators, portfolio management, booking handling
- **Count**: Unlimited
- **Capabilities**: Own content management, schedule management, limited inquiries
- **Creation**: By Admin+ via `/admin/users`

## 🔧 Implementation Components

### 1. Core Types (`lib/rbac/types.ts`)

```typescript
export type UserRole = 'super_admin' | 'admin' | 'photographer'

export type Permission = 
  // User management
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete'
  // Photo management
  | 'photos.create' | 'photos.read' | 'photos.update' | 'photos.delete'
  // Category management
  | 'categories.create' | 'categories.read' | 'categories.update' | 'categories.delete'
  // Inquiry management
  | 'inquiries.read' | 'inquiries.update' | 'inquiries.delete'
  // Schedule management
  | 'schedule.create' | 'schedule.read' | 'schedule.update' | 'schedule.delete'
  // System management
  | 'system.config' | 'system.logs'
  // Analytics
  | 'analytics.read'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'photos.create', 'photos.read', 'photos.update', 'photos.delete',
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    'inquiries.read', 'inquiries.update', 'inquiries.delete',
    'schedule.create', 'schedule.read', 'schedule.update', 'schedule.delete',
    'system.config', 'system.logs',
    'analytics.read'
  ],
  admin: [
    'users.read', 'users.update',
    'photos.create', 'photos.read', 'photos.update', 'photos.delete',
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    'inquiries.read', 'inquiries.update', 'inquiries.delete',
    'schedule.create', 'schedule.read', 'schedule.update', 'schedule.delete',
    'analytics.read'
  ],
  photographer: [
    'photos.create', 'photos.read', 'photos.update', 'photos.delete',
    'categories.read',
    'inquiries.read', 'inquiries.update',
    'schedule.create', 'schedule.read', 'schedule.update', 'schedule.delete',
    'analytics.read'
  ]
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role?: UserRole
  created_at: string
  last_login_at?: string
}

export interface AdminProfile extends UserProfile {
  role: 'super_admin' | 'admin'
  is_active: boolean
}

export interface PhotographerProfile extends UserProfile {
  phone?: string
  website_url?: string
  instagram_handle?: string
  bio?: string
  approval_status: 'pending' | 'approved' | 'rejected'
  application_status: 'pending' | 'approved' | 'rejected'
}
```

### 2. Permission Hooks (`lib/rbac/hooks.ts`)

```typescript
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ROLE_PERMISSIONS, type Permission, type UserRole } from './types'

/**
 * Get current user profile with type detection
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      // Try admins table first
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single()

      if (admin) {
        return {
          profile: admin,
          userType: 'admin' as const,
          role: admin.role
        }
      }

      // Try photographers table
      const { data: photographer } = await supabase
        .from('photographers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (photographer) {
        return {
          profile: photographer,
          userType: 'photographer' as const,
          role: 'photographer' as UserRole
        }
      }

      return null
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Check if user has specific permissions
 */
export function usePermissions(permissions: Permission[]) {
  const { data: userProfile } = useUserProfile()

  if (!userProfile?.role) {
    return permissions.map(() => false)
  }

  const userPermissions = ROLE_PERMISSIONS[userProfile.role]
  return permissions.map(permission => userPermissions.includes(permission))
}

/**
 * Check if user is admin or super admin
 */
export function useIsAdmin(superAdminOnly = false) {
  const { data: userProfile } = useUserProfile()

  if (!userProfile?.role) return false

  if (superAdminOnly) {
    return userProfile.role === 'super_admin'
  }

  return ['admin', 'super_admin'].includes(userProfile.role)
}

/**
 * Check if user has a specific role
 */
export function useHasRole(roles: UserRole[]) {
  const { data: userProfile } = useUserProfile()
  
  if (!userProfile?.role) return false
  
  return roles.includes(userProfile.role)
}
```

### 3. Guard Components (`lib/rbac/components.tsx`)

```typescript
import React from 'react'
import { useIsAdmin, usePermissions, useHasRole } from './hooks'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { Permission, UserRole } from './types'

interface AdminGuardProps {
  children: React.ReactNode
  superAdminOnly?: boolean
  fallback?: React.ReactNode
}

/**
 * Protects content for admin users only
 */
export function AdminGuard({ children, superAdminOnly = false, fallback }: AdminGuardProps) {
  const isAdmin = useIsAdmin(superAdminOnly)

  if (!isAdmin) {
    return fallback || (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {superAdminOnly 
            ? 'Super Admin 권한이 필요합니다.' 
            : '관리자 권한이 필요합니다.'
          }
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

interface PermissionGuardProps {
  children: React.ReactNode
  permissions: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

/**
 * Protects content based on specific permissions
 */
export function PermissionGuard({ 
  children, 
  permissions, 
  requireAll = true,
  fallback 
}: PermissionGuardProps) {
  const userPermissions = usePermissions(permissions)
  
  const hasAccess = requireAll 
    ? userPermissions.every(Boolean)
    : userPermissions.some(Boolean)

  if (!hasAccess) {
    return fallback || (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          이 기능을 사용할 권한이 없습니다.
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

interface RoleGuardProps {
  children: React.ReactNode
  roles: UserRole[]
  fallback?: React.ReactNode
}

/**
 * Protects content based on user roles
 */
export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const hasRole = useHasRole(roles)

  if (!hasRole) {
    return fallback || (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          접근 권한이 없습니다.
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}
```

## 📝 Usage Patterns

### 1. Page-Level Protection

```typescript
// app/admin/users/page.tsx
import { AdminGuard } from '@/lib/rbac/components'

export default function UsersPage() {
  return (
    <AdminGuard superAdminOnly>
      <UserManagementDashboard />
    </AdminGuard>
  )
}
```

### 2. Component-Level Conditional Rendering

```typescript
// components/admin/toolbar.tsx
import { usePermissions } from '@/lib/rbac/hooks'

export function AdminToolbar() {
  const [canCreateUsers, canDeletePhotos] = usePermissions([
    'users.create',
    'photos.delete'
  ])

  return (
    <div className="toolbar">
      {canCreateUsers && (
        <CreateUserButton />
      )}
      {canDeletePhotos && (
        <DeletePhotoButton />
      )}
    </div>
  )
}
```

### 3. Navigation Filtering

```typescript
// components/admin/sidebar.tsx
import { usePermissions, useIsAdmin } from '@/lib/rbac/hooks'

const navigationItems = [
  { 
    label: 'Users', 
    href: '/admin/users', 
    permission: 'users.read',
    adminOnly: true 
  },
  { 
    label: 'Photos', 
    href: '/admin/photos', 
    permission: 'photos.read' 
  },
  { 
    label: 'System', 
    href: '/admin/system', 
    permission: 'system.config' 
  }
]

export function AdminSidebar() {
  const isAdmin = useIsAdmin()
  const permissions = usePermissions(
    navigationItems.map(item => item.permission)
  )

  const filteredItems = navigationItems.filter((item, index) => {
    if (item.adminOnly && !isAdmin) return false
    return permissions[index]
  })

  return (
    <nav>
      {filteredItems.map(item => (
        <SidebarItem key={item.href} {...item} />
      ))}
    </nav>
  )
}
```

### 4. Server Action Protection

```typescript
// lib/actions/user-management.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'Unauthorized' }
  }

  // Check if user is super admin
  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (!admin || admin.role !== 'super_admin') {
    return { error: 'Insufficient permissions' }
  }

  // Proceed with deletion
  const { error } = await supabase.auth.admin.deleteUser(userId)
  
  if (error) {
    return { error: 'Failed to delete user' }
  }

  return { success: true }
}
```

### 5. Dynamic Permission Checking

```typescript
// utils/permission-utils.ts
import { ROLE_PERMISSIONS, type Permission, type UserRole } from '@/lib/rbac/types'

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole]
  return permissions.some(permission => userPermissions.includes(permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole]
  return permissions.every(permission => userPermissions.includes(permission))
}
```

## 🔒 Security Guidelines

### 1. Never Trust Client-Side Only

```typescript
// ❌ BAD: Client-side only protection
export function DeleteButton({ userId }: { userId: string }) {
  const [canDelete] = usePermissions(['users.delete'])
  
  const handleDelete = () => {
    // This can be bypassed!
    fetch(`/api/users/${userId}`, { method: 'DELETE' })
  }

  return canDelete ? <Button onClick={handleDelete}>Delete</Button> : null
}

// ✅ GOOD: Server-side validation
export function DeleteButton({ userId }: { userId: string }) {
  const [canDelete] = usePermissions(['users.delete'])
  
  const handleDelete = async () => {
    // Server action validates permissions
    const result = await deleteUserAction(userId)
    if (result.error) {
      showError(result.error)
    }
  }

  return canDelete ? <Button onClick={handleDelete}>Delete</Button> : null
}
```

### 2. Database-Level Security

```sql
-- Always implement RLS policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Example: Admins can only see their own profile unless they're super_admin
CREATE POLICY "admin_profile_access" ON admins
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM admins 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### 3. Permission Validation Patterns

```typescript
// ✅ Standard permission check pattern
export async function protectedAction() {
  const supabase = await createClient()
  
  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication required' }
  
  // 2. Get user role
  const { data: profile } = await supabase
    .from('admins')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // 3. Validate permission
  if (!profile || !hasPermission(profile.role, 'required.permission')) {
    return { error: 'Insufficient permissions' }
  }
  
  // 4. Proceed with action
  // ...
}
```

### 4. Secure User Creation

```typescript
// Only use service role for user creation
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin privileges
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function createUser(userData: UserData) {
  // Validate caller permissions first
  const hasPermission = await validateCallerPermissions()
  if (!hasPermission) return { error: 'Unauthorized' }
  
  // Use service role for creation
  const { data, error } = await supabaseService.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true
  })
  
  // Handle result...
}
```

## 🧪 Testing Strategies

### 1. Unit Testing Permissions

```typescript
// tests/rbac/permissions.test.ts
import { hasPermission, ROLE_PERMISSIONS } from '@/lib/rbac/types'

describe('RBAC Permissions', () => {
  describe('super_admin', () => {
    test('has all permissions', () => {
      const allPermissions = Object.values(ROLE_PERMISSIONS).flat()
      const uniquePermissions = [...new Set(allPermissions)]
      
      uniquePermissions.forEach(permission => {
        expect(hasPermission('super_admin', permission)).toBe(true)
      })
    })
  })

  describe('admin', () => {
    test('cannot manage users', () => {
      expect(hasPermission('admin', 'users.create')).toBe(false)
      expect(hasPermission('admin', 'users.delete')).toBe(false)
    })

    test('can manage photos', () => {
      expect(hasPermission('admin', 'photos.create')).toBe(true)
      expect(hasPermission('admin', 'photos.update')).toBe(true)
    })
  })

  describe('photographer', () => {
    test('has limited permissions', () => {
      expect(hasPermission('photographer', 'users.create')).toBe(false)
      expect(hasPermission('photographer', 'system.config')).toBe(false)
      expect(hasPermission('photographer', 'photos.create')).toBe(true)
    })
  })
})
```

### 2. Component Testing

```typescript
// tests/components/admin-guard.test.tsx
import { render } from '@testing-library/react'
import { AdminGuard } from '@/lib/rbac/components'
import { useIsAdmin } from '@/lib/rbac/hooks'

jest.mock('@/lib/rbac/hooks')
const mockUseIsAdmin = useIsAdmin as jest.MockedFunction<typeof useIsAdmin>

describe('AdminGuard', () => {
  test('renders children for admin users', () => {
    mockUseIsAdmin.mockReturnValue(true)
    
    const { getByText } = render(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>
    )
    
    expect(getByText('Admin Content')).toBeInTheDocument()
  })

  test('blocks non-admin users', () => {
    mockUseIsAdmin.mockReturnValue(false)
    
    const { queryByText } = render(
      <AdminGuard>
        <div>Admin Content</div>
      </AdminGuard>
    )
    
    expect(queryByText('Admin Content')).not.toBeInTheDocument()
  })

  test('shows custom fallback', () => {
    mockUseIsAdmin.mockReturnValue(false)
    
    const { getByText } = render(
      <AdminGuard fallback={<div>Access Denied</div>}>
        <div>Admin Content</div>
      </AdminGuard>
    )
    
    expect(getByText('Access Denied')).toBeInTheDocument()
  })
})
```

### 3. Integration Testing

```typescript
// tests/integration/user-management.test.ts
import { createTestUser, loginTestUser } from './test-utils'
import { createAdminUser } from '@/lib/actions/user-management'

describe('User Management Integration', () => {
  test('super admin can create admin users', async () => {
    const superAdmin = await createTestUser('super_admin')
    await loginTestUser(superAdmin)
    
    const result = await createAdminUser({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test Admin',
      role: 'admin'
    })
    
    expect(result.success).toBe(true)
    expect(result.user).toMatchObject({
      email: 'test@example.com',
      role: 'admin'
    })
  })

  test('regular admin cannot create users', async () => {
    const admin = await createTestUser('admin')
    await loginTestUser(admin)
    
    const result = await createAdminUser({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test Admin',
      role: 'admin'
    })
    
    expect(result.error).toBe('관리자 사용자 생성 권한이 없습니다.')
  })
})
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Permission Denied Errors

**Issue**: Users getting permission denied even with correct roles

**Solution**: Check user profile loading and permission mapping
```typescript
// Debug user profile
const { data: userProfile, isLoading, error } = useUserProfile()
console.log('User Profile:', { userProfile, isLoading, error })

// Check permission calculation
const permissions = usePermissions(['users.create'])
console.log('Permissions:', permissions)
```

#### 2. RLS Policy Conflicts

**Issue**: Database queries fail due to RLS policies

**Solution**: Verify policy logic and user context
```sql
-- Debug policy execution
SELECT * FROM admins WHERE id = auth.uid();

-- Check if user exists in expected table
SELECT 
  auth.uid() as current_user_id,
  EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()) as is_admin,
  EXISTS(SELECT 1 FROM photographers WHERE id = auth.uid()) as is_photographer;
```

#### 3. Type Detection Issues

**Issue**: User type not detected correctly

**Solution**: Verify authentication state and table structure
```typescript
// Check auth state
const { data: { user } } = await supabase.auth.getUser()
console.log('Auth User:', user)

// Verify table lookups
const { data: admin } = await supabase
  .from('admins')
  .select('*')
  .eq('id', user.id)
  .single()

const { data: photographer } = await supabase
  .from('photographers')
  .select('*')
  .eq('id', user.id)
  .single()

console.log('Admin lookup:', admin)
console.log('Photographer lookup:', photographer)
```

#### 4. Permission Hook Not Updating

**Issue**: Permission changes not reflected in UI

**Solution**: Check React Query cache invalidation
```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// Invalidate user profile cache after role changes
const invalidateUserProfile = () => {
  queryClient.invalidateQueries({ queryKey: ['user-profile'] })
}
```

## 🚀 Migration & Deployment

### Initial Setup Checklist

1. **Database Setup**
   ```sql
   -- Create new tables
   CREATE TABLE admins (...);
   CREATE TABLE photographers (...);
   
   -- Migrate existing data
   INSERT INTO photographers (...)
   SELECT ... FROM photographers;
   
   -- Create RLS policies
   ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
   CREATE POLICY ...;
   ```

2. **Environment Variables**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Initial Super Admin Creation**
   - Deploy application
   - Visit `/superadmin`
   - Create first Super Admin
   - Verify admin dashboard access

### Production Deployment

1. **Pre-deployment**
   - Run all RBAC tests
   - Verify RLS policies
   - Test user creation flows
   - Validate permission matrix

2. **Deployment Steps**
   - Deploy database migrations
   - Deploy application code
   - Create initial Super Admin
   - Create additional admin users
   - Test all permission flows

3. **Post-deployment Monitoring**
   - Monitor authentication errors
   - Check permission-related logs
   - Verify user creation workflows
   - Validate security policies

### Maintenance Tasks

1. **Regular Audits**
   - Review user permissions quarterly
   - Audit admin user list
   - Check for unused permissions
   - Validate RLS policy effectiveness

2. **Updates and Extensions**
   - Add new permissions to `types.ts`
   - Update role permission matrix
   - Create corresponding RLS policies
   - Update documentation

## 📚 References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [React Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Note**: This RBAC system is designed for Iris's specific needs but can be adapted for other applications by modifying the permission matrix and user types in `lib/rbac/types.ts`.