# 데이터베이스 마이그레이션 - 사용자 테이블 통합 (2025.10.05)

## 📋 마이그레이션 개요

### 목적
사용자 관리 시스템을 단순화하고 role-based access control (RBAC)을 개선하기 위해 `admins`, `photographers`, `users` 세 개의 분리된 테이블을 **단일 `users` 테이블로 통합**

### 실행일
2025년 10월 5일

### 데이터베이스
- **Project ID**: `kypwcsgwjtnkiiwjedcn`
- **Database**: PostgreSQL (Supabase)
- **Region**: ap-northeast-2

---

## 🎯 마이그레이션 목표

### 문제점
1. **테이블 분리로 인한 복잡성**: admins, photographers, users 테이블이 별도로 존재
2. **중복 데이터**: email, name, phone 등이 여러 테이블에 중복 저장
3. **복잡한 쿼리**: 사용자 조회 시 여러 테이블 확인 필요
4. **권한 관리 어려움**: role 기반 접근 제어가 분산됨

### 해결 방안
1. **단일 테이블 구조**: 모든 사용자를 `users` 테이블에 통합
2. **Role Enum 도입**: `user_role` enum ('user', 'photographer', 'admin')
3. **photographers 테이블 유지**: 사진작가 상세 정보는 별도 테이블로 관리
4. **FK 재구성**: 모든 테이블이 `users` 테이블 참조

---

## 🔄 스키마 변경 사항

### Before (이전 구조)

```
auth.users (Supabase Auth)
    ├─ admins (id, email, name, role)
    ├─ photographers (id, email, name, bio, ...)
    └─ users (id, email, name, ...)
```

**문제점:**
- 3개 테이블로 분산
- 사용자 조회 시 어느 테이블에 있는지 확인 필요
- FK가 각기 다른 테이블 참조

### After (현재 구조)

```
auth.users (Supabase Auth)
    ↓ (FK)
users (통합 사용자 테이블)
    ├─ id UUID PRIMARY KEY REFERENCES auth.users(id)
    ├─ email TEXT UNIQUE NOT NULL
    ├─ name TEXT NOT NULL
    ├─ role user_role NOT NULL (enum: 'user' | 'photographer' | 'admin')
    ├─ phone TEXT
    ├─ is_active BOOLEAN DEFAULT true
    ├─ created_at TIMESTAMPTZ
    └─ updated_at TIMESTAMPTZ

photographers (사진작가 상세 정보)
    ├─ id UUID PRIMARY KEY REFERENCES users(id)
    ├─ bio TEXT
    ├─ portfolio, price_range
    ├─ approval_status approval_status (enum: 'pending' | 'approved' | 'rejected')
    └─ settlement 정보 등
```

**개선점:**
- 단일 `users` 테이블로 통합
- `role` enum으로 역할 명확화
- `photographers` 테이블은 상세 정보만 보관
- FK 일관성 확보

---

## 📊 새로운 Enum 타입

### 1. user_role
```sql
CREATE TYPE user_role AS ENUM ('user', 'photographer', 'admin');
```

**용도:**
- `users.role` 컬럼에 사용
- 사용자 역할 명확히 구분
- TypeScript에서 타입 안정성 확보

### 2. approval_status
```sql
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
```

**용도:**
- `photographers.approval_status` 컬럼에 사용
- 사진작가 승인 상태 관리

---

## 🔨 마이그레이션 단계

### Step 1: users_new 테이블 생성 및 트리거 설정
- `users_new` 테이블 생성 (role enum 포함)
- Auth 트리거 함수 생성 (`handle_new_user`)
- 신규 가입자 자동 users 테이블 추가

**Migration:** `migrations/step1-create-table.sql`

### Step 2: 기존 데이터 마이그레이션
- admins (1명) → users (role='admin')
- photographers (7명) → users (role='photographer')
- users (0명) → users (role='user')

**총 마이그레이션:** 8명

**Migration:** `migrations/step2-migrate-data.sql`

### Step 3: 외래키 업데이트
**총 27개 FK 재구성:**
- 12개: photographers 테이블 참조 유지
- 15개: users 테이블 참조로 변경

**주요 변경된 테이블:**
- `available_slots.admin_id` → photographers 참조
- `photographer_profiles.photographer_id` → photographers 참조
- `photographer_keywords.photographer_id` → photographers 참조
- `inquiries.photographer_id` → photographers 참조
- `matching_results.photographer_id` → photographers 참조
- `payments.photographer_id` → photographers 참조
- `photos.uploaded_by` → photographers 참조
- `products.photographer_id` → photographers 참조
- `settlements.photographer_id` → photographers 참조
- `refunds.requested_by` → users 참조
- `refunds.processed_by` → users 참조
- `settlements.approved_by` → users 참조

**Migration:** `migrations/step3-update-foreign-keys.sql`

### Step 4: RLS 정책 설정
**7개 정책 생성:**
1. Users can view own profile
2. Admins can view all users
3. Photographers can view own and customer profiles
4. Users can update own profile
5. Admins can update all users
6. Admins can insert users
7. Admins can delete users

**Migration:** `migrations/step4-setup-rls.sql`

### Step 5: 테이블명 변경 및 정리
- `users` → `users_old`
- `users_new` → `users`
- `users_old`, `admins` 테이블 삭제 (CASCADE)

**Migration:** `migrations/step5-finalize.sql`

### Step 6: photographers 테이블 복구
- photographers 테이블 재생성 (users.id FK 참조)
- role='photographer'인 사용자 7명 복구
- 사진작가 상세 정보는 별도 관리

**Migration:** `migrations/restore_photographers_table.sql`

---

## 💻 코드 변경 사항

### Server Actions 수정 (8개 파일)

#### 1. `lib/actions/admin.ts`
**변경:**
- `Tables<'admins'>` → `Tables<'users'>`
- `.from('admins')` → `.from('users').eq('role', 'admin')`
- Admin 레코드 자동 생성 로직 제거

**주요 함수:**
- `getCurrentAdmin()` - users 테이블에서 role='admin' 조회
- `createAdmin()` - users 테이블에 role='admin' 삽입
- `getAllAdmins()` - users.role='admin' 필터링
- `updateAdmin()` - role 변경 방지
- `deleteAdmin()` - CASCADE 삭제

#### 2. `lib/actions/user-management.ts`
**변경:**
- Admin 생성: users 테이블 삽입 (role='admin')
- Photographer 생성: users + photographers 양쪽 삽입
- getAdminUsers: `users.role='admin'` 조회
- getPhotographerUsers: users + photographers JOIN

**롤백 로직:**
- Auth 실패 시 롤백
- users 삽입 실패 시 Auth 삭제
- photographers 삽입 실패 시 users + Auth 삭제

#### 3. `lib/auth/permissions.ts`
**변경:**
- admin 레코드 자동 생성 제거
- user_metadata.user_type 확인으로 간소화

#### 4. `lib/hooks/use-permissions.ts`
**변경:**
- admin 레코드 생성 로직 제거
- 권한 확인 단순화

#### 5. `lib/rbac/hooks.ts`
**변경:**
- admins/photographers 테이블 조회 → users 테이블 통합 조회
- userType 타입 안정성 개선

#### 6. `app/admin/my-page/page.tsx`
**변경:**
- `.from('admins')` → `.from('users').eq('role', 'admin')`
- admin 레코드 생성 로직 제거

#### 7. `components/admin/user-management.tsx`
**변경:**
- AdminUser 인터페이스: `created_at: string | null`
- `last_login_at` 필드 제거
- getPhotographerUsers: JOIN 데이터 처리

#### 8. `scripts/investigate-tables.ts`
**변경:**
- 삭제 (테스트용 스크립트)

---

## 🗃️ 데이터 마이그레이션 결과

### 마이그레이션된 데이터
```
기존:
- admins: 1명 (leeheechan0907@gmail.com)
- photographers: 7명
- users: 0명

→ 통합:
- users: 8명
  ├─ role='admin': 1명
  └─ role='photographer': 7명

- photographers: 7명 (상세 정보)
```

### FK 참조 관계
```
auth.users (Supabase Auth)
    ↓
users (8명)
    ├─ role='admin' (1명)
    │   └─ 모든 관리 권한
    │
    └─ role='photographer' (7명)
        ↓
        photographers (7명)
            ├─ bio, portfolio
            ├─ price_range
            └─ approval_status
```

---

## ✅ 검증 항목

### 1. 데이터 무결성
- ✅ 8명 전원 마이그레이션 완료
- ✅ role 정확히 할당 (admin 1, photographer 7)
- ✅ FK 제약 조건 모두 정상

### 2. FK 참조 관계
- ✅ users.id → auth.users(id)
- ✅ photographers.id → users(id)
- ✅ 27개 FK 모두 정상 작동

### 3. RLS 정책
- ✅ 7개 정책 활성화
- ✅ Admin 전체 접근 가능
- ✅ Photographer 본인 프로필 접근 가능

### 4. TypeScript 타입
- ✅ database.types.ts 재생성
- ✅ Enum 타입 반영
- ✅ 컴파일 에러 0개

---

## 📝 주요 변경점 요약

### 1. 테이블 구조
- ❌ **삭제:** `admins`, `users_old` 테이블
- ✅ **통합:** 모든 사용자 → `users` 테이블
- ✅ **유지:** `photographers` 테이블 (상세 정보)

### 2. Enum 타입
- ✅ `user_role`: 'user' | 'photographer' | 'admin'
- ✅ `approval_status`: 'pending' | 'approved' | 'rejected'

### 3. FK 참조
- ✅ **photographers 참조 (12개):** 사진작가 관련 테이블
- ✅ **users 참조 (15개):** 일반 사용자 관련 테이블
- ✅ **auth.users 참조 (1개):** users.id만

### 4. 코드 변경
- ✅ **Server Actions:** 8개 파일 수정
- ✅ **TypeScript:** enum 타입 적용
- ✅ **RLS 정책:** role 기반 재작성

---

## 🚀 개선 효과

### 1. 코드 단순화
- 사용자 조회: 1개 테이블만 확인
- 권한 확인: `users.role` 하나로 통일
- JOIN 쿼리 감소

### 2. 데이터 일관성
- 중복 데이터 제거
- 단일 소스 진실 (Single Source of Truth)
- FK 제약 조건 강화

### 3. 유지보수성
- role 추가 시 enum만 수정
- 테이블 구조 간소화
- 명확한 참조 관계

### 4. 타입 안정성
- TypeScript enum 타입
- 컴파일 시점 에러 감지
- IDE 자동완성 개선

---

## 📚 관련 문서

- **CLAUDE.md**: 프로젝트 전체 가이드 업데이트 필요
- **database-schema.md**: 스키마 문서 업데이트 필요
- **rbac-guide.md**: RBAC 가이드 업데이트 필요

---

## ⚠️ 주의사항

### 1. 이전 코드 호환성
- `admins` 테이블 참조 코드는 모두 수정 필요
- `users` 테이블 기존 참조는 그대로 작동

### 2. Auth 트리거
- 신규 가입 시 `handle_new_user()` 자동 실행
- `raw_user_meta_data`에서 role 추출
- 기본값: 'user'

### 3. photographers 테이블
- 사진작가만 photographers 레코드 보유
- users + photographers JOIN 필요
- approval_status는 photographers에만 존재

### 4. 마이그레이션 롤백
- ❌ 불가: `admins` 테이블이 CASCADE로 삭제됨
- ✅ 복구: git 히스토리에서 스키마 복원 가능
- ⚠️ 데이터 백업 필수

---

## 🔮 향후 작업

### 1. 문서 업데이트
- [ ] CLAUDE.md 업데이트
- [ ] database-schema.md 업데이트
- [ ] rbac-guide.md 업데이트

### 2. 추가 개선
- [ ] user_role enum에 'super_admin' 추가 고려
- [ ] photographers.approval_status 워크플로우 개선
- [ ] audit_log 테이블 추가 고려

### 3. 성능 최적화
- [ ] users.role 인덱스 성능 모니터링
- [ ] JOIN 쿼리 성능 측정
- [ ] RLS 정책 성능 검증

---

## 📞 문의

마이그레이션 관련 문제 발생 시:
1. Git 커밋 히스토리 확인
2. `migrations/` 폴더의 SQL 파일 검토
3. Supabase Dashboard에서 테이블 구조 확인
