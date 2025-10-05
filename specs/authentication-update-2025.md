# Authentication System Update - 2025년 1월

## 📋 요약
kindt의 인증 및 권한 시스템이 대폭 간소화되었습니다. 복잡한 3-tier RBAC 시스템에서 2개의 완전히 분리된 시스템으로 변경되었습니다.

## 🔄 주요 변경사항

### 1. **RBAC 시스템 제거**
- **이전**: super_admin → admin → photographer 계층 구조
- **현재**: Admin과 Photographer 완전 분리

### 2. **데이터베이스 구조 변경**

#### photographers 테이블
```sql
-- role 컬럼 제거됨
ALTER TABLE photographers DROP COLUMN IF EXISTS role;
```

#### admins 테이블 (더 이상 사용 안함)
- Admin 사용자는 `auth.users` 테이블에만 존재
- `user_metadata.user_type = 'admin'`으로 식별

### 3. **인증 시스템 분리**

#### Admin 시스템
- **저장 위치**: Supabase `auth.users` 테이블만 사용
- **식별 방법**: `user_metadata.user_type === 'admin'`
- **회원가입**: `/admin/signup` (초대 코드 필요)
- **로그인**: `/login` (공용)
- **대시보드 접근**: 인증된 모든 사용자 접근 가능 (role guard 없음)

#### Photographer 시스템
- **저장 위치**: `auth.users` + `photographers` 테이블
- **회원가입**: Admin이 `/admin/users`에서 생성
- **로그인**: `/login` (공용)
- **특징**: 원래 플로우 유지

### 4. **접근 권한 변경**

#### 이전 시스템
```typescript
// 복잡한 role 기반 접근 제어
if (user.role === 'admin' || user.role === 'super_admin') {
  // 접근 허용
}
```

#### 현재 시스템
```typescript
// 단순 인증 확인만
if (session) {
  // 모든 admin 페이지 접근 가능
}
```

## 📁 수정된 파일들

### 1. **Layout 파일** (`app/admin/layout.tsx`)
```typescript
// 이전
const { data: adminUser } = await supabase
  .from("photographers")
  .select("*")
  .eq("id", session.user.id)
  .single();

if (!adminUser) {
  redirect("/unauthorized");
}

// 현재
if (!session) {
  redirect("/login");
}
// role 체크 없음, 로그인만 확인
```

### 2. **User Management** (`lib/actions/user-management.ts`)
- `createAdminUser`: `auth.users`에만 생성
- `getAdminUsers`: `auth.users`에서 admin 타입 필터링
- `createPhotographerUser`: role 체크 제거
- `deleteUser`: role 체크 제거

### 3. **Admin Auth** (`lib/actions/admin-auth.ts`)
- `signupWithInviteCode`: photographers 테이블 삽입 제거
- `createInviteCode`: role 체크 제거
- `getInviteCodes`: role 체크 제거

### 4. **Component Updates**
- `UserManagement`: role 필드 제거
- `AdminGuard`: 완전 제거 또는 비활성화
- `Sidebar`: role 기반 필터링 제거

## 🔑 초대 코드 시스템

### Admin 회원가입 플로우
1. 기존 Admin이 초대 코드 생성 (`/admin/invites`)
2. 신규 사용자가 `/admin/signup`에서 초대 코드로 가입
3. `auth.users`에만 계정 생성
4. 로그인 후 모든 admin 기능 접근 가능

### 테스트용 초대 코드
```sql
INSERT INTO admin_invite_codes (code, expires_at, notes)
VALUES ('TEST-ADMIN-2025', '2025-12-31', '테스트용 관리자 초대 코드');
```

## 🚀 Migration Guide

### 기존 시스템에서 업그레이드
1. **데이터베이스 업데이트**
   ```sql
   -- photographers 테이블에서 role 컬럼 제거
   ALTER TABLE photographers DROP COLUMN IF EXISTS role;
   ```

2. **타입 재생성**
   ```bash
   npx supabase gen types typescript --local > types/database.types.ts
   ```

3. **코드 업데이트**
   - AdminGuard 컴포넌트 제거
   - role 체크 로직 제거
   - user-management 함수 업데이트

## 🔍 현재 시스템 상태

### ✅ 완료된 변경사항
- photographers 테이블 role 컬럼 제거
- 모든 admin 페이지 role guard 제거
- admin 인증을 auth.users만 사용하도록 변경
- user-management.ts 파일 업데이트
- admin layout 단순화

### 🔄 남은 작업
- Photographer 전용 기능 구현 (필요시)
- 레거시 코드 정리

## 💡 장점

1. **단순성**: 복잡한 role 계층 구조 제거
2. **유지보수성**: 두 시스템 완전 분리로 관리 용이
3. **확장성**: 각 시스템 독립적 확장 가능
4. **보안**: 단순한 구조로 보안 취약점 감소

## ⚠️ 주의사항

1. **기존 데이터**: photographers 테이블의 기존 데이터는 유지됨
2. **로그인 인터페이스**: Admin과 Photographer 모두 동일한 `/login` 사용
3. **권한 관리**: 모든 인증된 사용자가 admin 기능 접근 가능 (추후 제한 필요시 재구현 필요)

## 📊 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│                 Auth System                  │
├──────────────────┬──────────────────────────┤
│   Admin Users    │   Photographer Users     │
├──────────────────┼──────────────────────────┤
│ auth.users only  │ auth.users +             │
│                  │ photographers table      │
├──────────────────┼──────────────────────────┤
│ Invite code      │ Admin creates via        │
│ signup           │ /admin/users             │
├──────────────────┼──────────────────────────┤
│ Full dashboard   │ Limited dashboard        │
│ access           │ access (future)          │
└──────────────────┴──────────────────────────┘
```

## 📝 참고사항

- 이 변경사항은 2025년 1월 18일에 구현되었습니다
- 기존 RBAC 가이드(`rbac-guide.md`)는 레거시 문서로 유지됩니다
- 새로운 시스템은 kindt의 실제 요구사항에 더 적합합니다