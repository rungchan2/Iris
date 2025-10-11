# Authentication & Authorization Utilities Guide

kindt 프로젝트의 재사용 가능한 인증/인가 유틸리티 사용 가이드입니다.

## 목차

1. [개요](#개요)
2. [권한 체계](#권한-체계)
3. [컴포넌트](#컴포넌트)
4. [Hooks](#hooks)
5. [유틸리티 함수](#유틸리티-함수)
6. [사용 예시](#사용-예시)

---

## 개요

`/lib/auth/auth-utils.tsx`는 kindt 프로젝트의 인증/인가를 관리하기 위한 재사용 가능한 유틸리티를 제공합니다.

### 주요 기능

- **PermissionGuard**: 라우트 레벨 권한 제어
- **RoleGuard**: UI 요소 표시/숨김 제어
- **ProtectedAction**: 컴포넌트 비활성화 및 오버레이
- **useAuth**: 현재 사용자 정보 조회
- **usePermission**: 권한 체크 Hook
- **RefreshAuthButton**: 권한 수동 갱신 버튼

---

## 권한 체계

### 역할(Role) 계층

```typescript
admin (3) > photographer (2) > user (1)
```

### 역할 타입

```typescript
export type UserRole = 'admin' | 'photographer' | 'user'
```

### 사용자 인터페이스

```typescript
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name?: string
  phone?: string
}
```

---

## 컴포넌트

### 1. PermissionGuard

**용도**: Layout이나 Page 레벨에서 권한 체크 및 라우팅 제어

**Props**:
- `minRole: UserRole` - 최소 요구 권한
- `onUnauthorized?: () => void` - 권한 없을 시 콜백
- `children: React.ReactNode` - 자식 컴포넌트
- `loadingFallback?: React.ReactNode` - 로딩 중 표시 (선택)
- `unauthorizedFallback?: React.ReactNode` - 권한 없을 때 표시 (선택)

**예시**:

```tsx
// app/admin/layout.tsx
import { PermissionGuard } from '@/lib/auth/auth-utils'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <PermissionGuard
      minRole="admin"
      onUnauthorized={() => {
        toast.error('관리자 권한이 필요합니다')
        router.push('/')
      }}
    >
      {children}
    </PermissionGuard>
  )
}
```

**커스텀 Fallback 사용**:

```tsx
<PermissionGuard
  minRole="photographer"
  onUnauthorized={() => {
    router.push('/login')
  }}
  loadingFallback={<CustomLoadingSpinner />}
  unauthorizedFallback={<CustomUnauthorizedPage />}
>
  {children}
</PermissionGuard>
```

---

### 2. RoleGuard

**용도**: UI 요소를 권한에 따라 표시/숨김

**Props**:
- `minRole: UserRole` - 최소 요구 권한
- `children: React.ReactNode` - 자식 컴포넌트
- `fallback?: React.ReactNode` - 권한 없을 때 표시 (기본: null)

**예시**:

```tsx
import { RoleGuard } from '@/lib/auth/auth-utils'

function Dashboard() {
  return (
    <div>
      <h1>대시보드</h1>

      {/* Admin만 표시 */}
      <RoleGuard minRole="admin">
        <AdminPanel />
      </RoleGuard>

      {/* Photographer 이상 표시 */}
      <RoleGuard minRole="photographer">
        <PhotographerTools />
      </RoleGuard>

      {/* 모든 로그인 사용자 표시 */}
      <RoleGuard minRole="user">
        <UserProfile />
      </RoleGuard>
    </div>
  )
}
```

**Fallback 사용**:

```tsx
<RoleGuard minRole="admin" fallback={<div>관리자 전용 기능입니다</div>}>
  <AdminSettings />
</RoleGuard>
```

---

### 3. ProtectedAction

**용도**: 권한 없을 때 컴포넌트 비활성화 및 오버레이 메시지 표시

**Props**:
- `minRole: UserRole` - 최소 요구 권한
- `children: React.ReactNode` - 자식 컴포넌트
- `message?: string` - 오버레이 메시지 (기본: "접근 권한 없음")
- `className?: string` - 컨테이너 className (선택)

**예시**:

```tsx
import { ProtectedAction } from '@/lib/auth/auth-utils'

function Settings() {
  return (
    <div>
      <h2>설정</h2>

      {/* Admin만 활성화 */}
      <ProtectedAction minRole="admin">
        <button className="btn-primary">설정 변경</button>
      </ProtectedAction>

      {/* 커스텀 메시지 */}
      <ProtectedAction minRole="admin" message="관리자 권한이 필요합니다">
        <div className="action-panel">
          <button>삭제</button>
          <button>수정</button>
        </div>
      </ProtectedAction>
    </div>
  )
}
```

---

### 4. RefreshAuthButton

**용도**: 사용자가 수동으로 권한 정보를 갱신할 수 있는 버튼

**Props**:
- `variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'` - 버튼 variant (기본: 'outline')
- `size?: 'default' | 'sm' | 'lg' | 'icon'` - 버튼 크기 (기본: 'sm')
- `children?: React.ReactNode` - 버튼 텍스트 (기본: "새로고침")
- `onSuccess?: () => void` - 갱신 성공 시 콜백
- `onError?: (error: Error) => void` - 갱신 실패 시 콜백
- `className?: string` - className (선택)
- `showIcon?: boolean` - 아이콘 표시 여부 (기본: true)

**예시**:

```tsx
import { RefreshAuthButton } from '@/lib/auth/auth-utils'

function Header() {
  return (
    <div className="flex items-center gap-2">
      <span>현재 권한: {user?.role}</span>
      <RefreshAuthButton />
    </div>
  )
}

// 커스텀 스타일
<RefreshAuthButton
  variant="default"
  size="lg"
  onSuccess={() => {
    console.log('권한이 갱신되었습니다!')
  }}
  onError={(error) => {
    console.error('갱신 실패:', error)
  }}
>
  권한 업데이트
</RefreshAuthButton>
```

---

## Hooks

### 1. useAuth

**용도**: 현재 로그인된 사용자 정보 조회

**반환값**:
```typescript
{
  user: AuthUser | null
  isLoading: boolean
  error: string | null
}
```

**예시**:

```tsx
import { useAuth } from '@/lib/auth/auth-utils'

function Profile() {
  const { user, isLoading, error } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!user) return <div>Not logged in</div>

  return (
    <div>
      <h1>프로필</h1>
      <p>이름: {user.name}</p>
      <p>이메일: {user.email}</p>
      <p>권한: {user.role}</p>
    </div>
  )
}
```

---

### 2. usePermission

**용도**: 특정 권한 체크

**파라미터**: `minRole: UserRole`

**반환값**: `boolean`

**예시**:

```tsx
import { usePermission } from '@/lib/auth/auth-utils'

function AdminButton() {
  const canAccess = usePermission('admin')

  if (!canAccess) return null

  return <button>Admin Action</button>
}

// 조건부 렌더링
function Dashboard() {
  const isAdmin = usePermission('admin')
  const isPhotographer = usePermission('photographer')

  return (
    <div>
      {isAdmin && <AdminDashboard />}
      {isPhotographer && <PhotographerDashboard />}
      <UserDashboard />
    </div>
  )
}
```

---

## 유틸리티 함수

### 1. hasMinimumRole

**용도**: 사용자 권한이 최소 요구 권한을 만족하는지 체크

**시그니처**:
```typescript
hasMinimumRole(userRole: UserRole | undefined, minRole: UserRole): boolean
```

**예시**:
```typescript
hasMinimumRole('photographer', 'admin') // false
hasMinimumRole('admin', 'photographer') // true
hasMinimumRole('admin', 'user') // true
```

---

### 2. isAdmin / isPhotographer / isRegularUser

**용도**: 특정 역할 체크

**예시**:
```typescript
import { isAdmin, isPhotographer, isRegularUser } from '@/lib/auth/auth-utils'

isAdmin('admin') // true
isPhotographer('photographer') // true
isRegularUser('user') // true
```

---

### 3. checkPermission

**용도**: 비컴포넌트 환경에서 권한 체크

**시그니처**:
```typescript
checkPermission(
  user: { role: UserRole } | null | undefined,
  options: { minRole: UserRole }
): boolean
```

**예시**:
```typescript
import { checkPermission } from '@/lib/auth/auth-utils'

const canAccess = checkPermission(user, { minRole: 'photographer' })

if (canAccess) {
  // Do something
}
```

---

## 사용 예시

### 예시 1: Admin 전용 페이지

```tsx
// app/admin/users/page.tsx
'use client'

import { PermissionGuard } from '@/lib/auth/auth-utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const router = useRouter()

  return (
    <PermissionGuard
      minRole="admin"
      onUnauthorized={() => {
        toast.error('관리자만 접근할 수 있습니다')
        router.push('/')
      }}
    >
      <div>
        <h1>사용자 관리</h1>
        {/* Admin users management UI */}
      </div>
    </PermissionGuard>
  )
}
```

---

### 예시 2: 역할별 대시보드

```tsx
// app/dashboard/page.tsx
'use client'

import { useAuth, RoleGuard } from '@/lib/auth/auth-utils'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>대시보드 - {user?.name}</h1>

      {/* Admin 대시보드 */}
      <RoleGuard minRole="admin">
        <section>
          <h2>관리자 대시보드</h2>
          <AdminAnalytics />
          <UserManagement />
        </section>
      </RoleGuard>

      {/* Photographer 대시보드 */}
      <RoleGuard minRole="photographer">
        <section>
          <h2>작가 대시보드</h2>
          <MyBookings />
          <MyPhotos />
        </section>
      </RoleGuard>

      {/* 모든 사용자 */}
      <RoleGuard minRole="user">
        <section>
          <h2>내 정보</h2>
          <ProfileCard user={user} />
        </section>
      </RoleGuard>
    </div>
  )
}
```

---

### 예시 3: 보호된 액션 버튼

```tsx
// components/inquiry/inquiry-actions.tsx
'use client'

import { ProtectedAction, useAuth } from '@/lib/auth/auth-utils'
import { Button } from '@/components/ui/button'

interface InquiryActionsProps {
  inquiryId: string
}

export function InquiryActions({ inquiryId }: InquiryActionsProps) {
  const { user } = useAuth()

  return (
    <div className="flex gap-2">
      {/* Photographer 이상만 활성화 */}
      <ProtectedAction minRole="photographer">
        <Button variant="outline">답변하기</Button>
      </ProtectedAction>

      {/* Admin만 활성화 */}
      <ProtectedAction minRole="admin" message="관리자만 삭제할 수 있습니다">
        <Button variant="destructive">삭제</Button>
      </ProtectedAction>
    </div>
  )
}
```

---

### 예시 4: 조건부 네비게이션

```tsx
// components/nav/main-nav.tsx
'use client'

import { usePermission } from '@/lib/auth/auth-utils'
import Link from 'next/link'

export function MainNav() {
  const isAdmin = usePermission('admin')
  const isPhotographer = usePermission('photographer')

  return (
    <nav className="flex gap-4">
      <Link href="/">홈</Link>
      <Link href="/gallery">갤러리</Link>
      <Link href="/matching">매칭</Link>

      {isPhotographer && <Link href="/my-bookings">내 예약</Link>}

      {isAdmin && (
        <>
          <Link href="/admin/users">사용자 관리</Link>
          <Link href="/admin/photographers">작가 관리</Link>
          <Link href="/admin/analytics">분석</Link>
        </>
      )}
    </nav>
  )
}
```

---

### 예시 5: Server Action에서 권한 체크

```typescript
// lib/actions/photographers.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/auth/auth-utils'

export async function deletePhotographer(photographerId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: '로그인이 필요합니다' }
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  // Check permission
  if (!checkPermission(userData, { minRole: 'admin' })) {
    return { success: false, error: '관리자 권한이 필요합니다' }
  }

  // Proceed with deletion
  const { error } = await supabase
    .from('photographers')
    .delete()
    .eq('id', photographerId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
```

---

## 베스트 프랙티스

### 1. Layout에서 PermissionGuard 사용

페이지 전체에 권한이 필요한 경우 Layout 레벨에서 PermissionGuard를 사용하세요:

```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard minRole="admin" onUnauthorized={() => router.push('/')}>
      <AdminSidebar />
      <main>{children}</main>
    </PermissionGuard>
  )
}
```

### 2. UI 요소에는 RoleGuard 사용

UI 요소의 표시/숨김에는 RoleGuard를 사용하세요:

```tsx
<RoleGuard minRole="admin">
  <DeleteButton />
</RoleGuard>
```

### 3. 버튼 비활성화에는 ProtectedAction 사용

버튼을 보여주되 비활성화하려면 ProtectedAction을 사용하세요:

```tsx
<ProtectedAction minRole="admin">
  <Button>관리자 전용 기능</Button>
</ProtectedAction>
```

### 4. Server Action에서도 권한 체크

클라이언트 체크와 함께 Server Action에서도 반드시 권한을 체크하세요:

```typescript
export async function updateSettings() {
  'use server'

  // Server-side permission check
  const userData = await getUserFromDatabase()
  if (!checkPermission(userData, { minRole: 'admin' })) {
    throw new Error('Unauthorized')
  }

  // Proceed...
}
```

---

## 마이그레이션 가이드

### 기존 PermissionGuard에서 마이그레이션

**Before**:
```tsx
import { PermissionGuard } from '@/components/auth/permission-guard'

<PermissionGuard requiredPermission="admin">
  {children}
</PermissionGuard>
```

**After**:
```tsx
import { PermissionGuard } from '@/lib/auth/auth-utils'

<PermissionGuard
  minRole="admin"
  onUnauthorized={() => router.push('/')}
>
  {children}
</PermissionGuard>
```

---

## 문제 해결

### Q: "권한이 업데이트되지 않습니다"

**A**: RefreshAuthButton을 사용하거나 페이지를 새로고침하세요.

```tsx
<RefreshAuthButton />
```

### Q: "로딩 상태가 계속됩니다"

**A**: Supabase 연결을 확인하고 users 테이블에 해당 사용자가 존재하는지 확인하세요.

### Q: "Server Action에서 권한 체크가 작동하지 않습니다"

**A**: Server Action은 클라이언트 Hook을 사용할 수 없습니다. `checkPermission` 유틸리티 함수를 사용하세요.

---

## RLS (Row Level Security) 연동

클라이언트 권한 체크와 함께 데이터베이스 레벨에서도 RLS를 설정해야 합니다.

### Server Action에서 권한 체크

Server Action에서는 `checkPermission` 유틸리티 함수를 사용:

```typescript
// lib/actions/photographers.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/auth/auth-utils'

export async function deletePhotographer(photographerId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: '로그인이 필요합니다' }
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  // Check permission
  if (!checkPermission(userData, { minRole: 'admin' })) {
    return { success: false, error: '관리자 권한이 필요합니다' }
  }

  // Proceed with deletion
  const { error } = await supabase
    .from('photographers')
    .delete()
    .eq('id', photographerId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
```

### RLS Policy 설정

Supabase에서 RLS Policy를 설정할 때는 다음 함수들을 사용:

```sql
-- payments 테이블: 본인 또는 작가만 조회
CREATE POLICY "payments_select_policy"
ON payments FOR SELECT
USING (
  is_user_or_photographer(user_id, photographer_id)
  OR is_admin()
);

-- products 테이블: 작가만 본인 상품 수정
CREATE POLICY "products_update_policy"
ON products FOR UPDATE
USING (
  is_owner(photographer_id)
  OR is_admin()
);
```

**RLS 함수 상세 가이드**: [RLS_UTILS_GUIDE.md](/docs/RLS_UTILS_GUIDE.md) 참고

---

## 참고 자료

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Route Guards](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
- [RLS Utils Guide](/docs/RLS_UTILS_GUIDE.md) - 데이터베이스 레벨 권한 관리
