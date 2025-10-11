# Storage RLS 설정 가이드

## 개요

이 문서는 Supabase Storage의 RLS (Row Level Security) 정책을 설정하는 방법을 설명합니다.

**모든 사진 업로드는 `photos` 버킷을 사용하며, 사용자별 폴더 구조로 관리합니다.**

## 현재 상태

### 버킷 구성
- ✅ `photos`: 모든 사진 업로드용 버킷 (작가 포트폴리오, 대시보드 업로드 등)
  - 폴더 구조: `{user_id}/{timestamp}_{random}.{ext}`
  - Public 버킷 (누구나 읽기 가능)

### 업로드 플로우

#### 1. 작가 회원가입 시 포트폴리오 업로드
```
1. 회원가입 폼 작성
2. 로그인 수행 (중요! RLS 통과 위해 필수)
3. 작가 프로필 생성 (users.role = 'photographer')
4. 포트폴리오 업로드 (RLS 체크 통과)
```

코드 위치: `components/photographer-signup-form.tsx:256-291`
서버 액션: `lib/actions/photographer-signup.ts:106-244`

#### 2. 작가 대시보드에서 사진 업로드
```
1. 로그인된 작가 사용자
2. 대시보드에서 사진 업로드
3. RLS 체크 (is_photographer() + 본인 폴더)
```

코드 위치: `components/admin/photo-uploader.tsx`
업로드 유틸: `lib/upload.ts`

## RLS 정책 설정 방법

### 1. Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `kindt (kypwcsgwjtnkiiwjedcn)`
3. 좌측 메뉴에서 **Storage** 클릭
4. **photos** 버킷 선택
5. **Policies** 탭 클릭

---

### 2. photos 버킷 RLS 정책 설정

#### 2.1. SELECT Policy (누구나 조회 가능)

**정책 이름**: `photos_select_public`

**Operation**: `SELECT`

**Policy Definition**:
```sql
bucket_id = 'photos'
```

**설명**: 누구나 공개 사진 조회 가능 (public 버킷)

---

#### 2.2. INSERT Policy (작가만 업로드, 본인 폴더)

**정책 이름**: `photos_insert_photographer`

**Operation**: `INSERT`

**Policy Definition (WITH CHECK)**:
```sql
bucket_id = 'photos'
AND public.is_photographer()
AND (storage.foldername(name))[1] = auth.uid()::text
```

**설명**:
- `public.is_photographer()`: photographer 또는 admin 권한 체크
- `(storage.foldername(name))[1] = auth.uid()::text`: 본인 폴더(`{user_id}/`)에만 업로드 가능

---

#### 2.3. UPDATE Policy (본인 파일만)

**정책 이름**: `photos_update_own_or_admin`

**Operation**: `UPDATE`

**Policy Definition (USING)**:
```sql
bucket_id = 'photos'
AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.is_admin()
)
```

**Policy Definition (WITH CHECK)**: (동일)
```sql
bucket_id = 'photos'
AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.is_admin()
)
```

**설명**: 본인 폴더의 파일만 수정 가능 (관리자는 모든 파일)

---

#### 2.4. DELETE Policy (본인 파일 또는 관리자)

**정책 이름**: `photos_delete_own_or_admin`

**Operation**: `DELETE`

**Policy Definition (USING)**:
```sql
bucket_id = 'photos'
AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.is_admin()
)
```

**설명**: 본인 폴더의 파일만 삭제 가능 (관리자는 모든 파일)

---

## RLS 함수 참조

모든 정책에서 사용하는 RLS 함수들은 `public` 스키마에 정의되어 있습니다.

### 사용 가능한 함수

```sql
-- 소유자 체크
public.is_owner(owner_id UUID) → BOOLEAN

-- 작가 권한 체크 (photographer OR admin)
public.is_photographer() → BOOLEAN

-- 관리자 체크
public.is_admin() → BOOLEAN

-- 최소 권한 체크
public.min_role(required_role TEXT) → BOOLEAN
```

### 함수 정의 위치
- SQL 파일: `/lib/auth/rls-utils.sql`
- 상세 가이드: `/docs/RLS_UTILS_GUIDE.md`

---

## 폴더 구조

### photos 버킷 구조
```
photos/
├── {user_id_1}/
│   ├── 1234567890_abc123.jpg    # 회원가입 시 포트폴리오
│   ├── 1234567891_def456.png    # 대시보드 업로드
│   └── 1234567892_ghi789.webp   # 추가 사진
├── {user_id_2}/
│   └── ...
└── {user_id_3}/
    └── ...
```

### 파일명 생성 규칙
```typescript
// lib/actions/photographer-signup.ts:147-150
const timestamp = Date.now()
const randomString = Math.random().toString(36).substring(7)
const fileExt = file.name.split('.').pop()
const fileName = `${user.id}/${timestamp}_${randomString}.${fileExt}`
```

---

## 테스트 방법

### 1. 회원가입 플로우 테스트

```bash
# 1. 작가 회원가입 페이지 접속
http://localhost:3000/signup/photographer

# 2. 회원가입 폼 작성
- 이메일, 비밀번호, 이름 등 입력
- 전문 분야, 경력 등 입력
- 포트폴리오 이미지 3장 이상 업로드

# 3. 제출 버튼 클릭
- ✅ 회원가입 성공
- ✅ 자동 로그인
- ✅ 작가 프로필 생성
- ✅ 포트폴리오 업로드 (RLS 통과)
- ✅ photos/{user_id}/ 폴더에 저장
```

### 2. 대시보드 업로드 테스트

```bash
# 1. 작가로 로그인
# 2. 대시보드 접속
# 3. Photo Uploader 사용
- ✅ photos/{user_id}/ 폴더에 업로드
- ✅ RLS 정책 통과 (is_photographer() + 본인 폴더)
```

### 3. RLS 정책 검증

#### 테스트 케이스 1: 로그인하지 않은 사용자
```
- SELECT: ✅ 성공 (누구나 조회 가능)
- INSERT: ❌ 실패 (is_photographer() = false)
```

#### 테스트 케이스 2: 일반 사용자 (role = 'user')
```
- SELECT: ✅ 성공
- INSERT: ❌ 실패 (is_photographer() = false)
```

#### 테스트 케이스 3: 작가 (role = 'photographer')
```
- SELECT: ✅ 성공
- INSERT: ✅ 성공 (본인 폴더에만)
- INSERT (다른 사용자 폴더): ❌ 실패
- UPDATE/DELETE: ✅ 성공 (본인 파일만)
```

#### 테스트 케이스 4: 관리자 (role = 'admin')
```
- SELECT: ✅ 성공
- INSERT: ✅ 성공 (모든 폴더)
- UPDATE/DELETE: ✅ 성공 (모든 파일)
```

---

## SQL 쿼리로 정책 확인

```sql
-- Storage 정책 조회
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'photos_%'
ORDER BY policyname;
```

---

## 문제 해결

### 업로드 실패: "new row violates row-level security policy"

**원인**: RLS 정책이 업로드를 차단함

**해결 방법**:

1. **사용자가 로그인했는지 확인**
```sql
-- 현재 로그인된 사용자 확인
SELECT auth.uid(), auth.email();
```

2. **사용자 role 확인**
```sql
SELECT id, email, role FROM users WHERE id = auth.uid();
```

3. **폴더 경로 확인**
```typescript
// 올바른 경로: photos/{user_id}/filename.jpg
// 잘못된 경로: photos/filename.jpg (폴더 없음)
```

4. **RLS 함수 동작 확인**
```sql
-- is_photographer() 함수 테스트
SELECT public.is_photographer(); -- true 또는 false
```

### 업로드 실패: "The resource already exists"

**원인**: 동일한 파일명으로 업로드 시도

**해결 방법**: 타임스탬프 + 랜덤 문자열로 파일명 생성 (이미 구현됨)

```typescript
// lib/actions/photographer-signup.ts:147-150
const timestamp = Date.now()
const randomString = Math.random().toString(36).substring(7)
const fileName = `${user.id}/${timestamp}_${randomString}.${fileExt}`
```

### 업로드 실패: "Bucket not found"

**원인**: photos 버킷이 존재하지 않음

**해결 방법**:
```sql
-- photos 버킷 확인
SELECT id, name, public FROM storage.buckets WHERE id = 'photos';

-- 버킷이 없으면 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true);
```

---

## 기존 코드와의 통일성

### photo-uploader.tsx와 동일한 패턴

모든 업로드는 `photos` 버킷 + `{user_id}/` 폴더 구조를 사용합니다:

1. **회원가입 시**: `lib/actions/photographer-signup.ts`
   ```typescript
   const fileName = `${user.id}/${timestamp}_${randomString}.${fileExt}`
   await supabase.storage.from('photos').upload(fileName, file)
   ```

2. **대시보드**: `lib/upload.ts` (photo-uploader.tsx에서 사용)
   ```typescript
   const fileName = `${userId}/${timestamp}_${randomString}.${fileExt}`
   await supabase.storage.from('photos').upload(fileName, file)
   ```

### RLS 정책 일관성

- ✅ SELECT: 누구나 (공개 버킷)
- ✅ INSERT: photographer + 본인 폴더
- ✅ UPDATE/DELETE: 본인 파일 또는 관리자

---

## 참고 문서

- [RLS 유틸리티 함수 가이드](/docs/RLS_UTILS_GUIDE.md)
- [RLS 설정 가이드](/specs/rls-guide.md)
- [Supabase Storage 공식 문서](https://supabase.com/docs/guides/storage)
- [PostgreSQL RLS 공식 문서](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 업데이트 이력

- **2025-10-11 (v2)**: photos 버킷으로 통일
  - portfolio-images 버킷 사용 중단
  - 모든 업로드를 photos 버킷으로 통합
  - 사용자별 폴더 구조로 관리 (`{user_id}/filename`)
  - 기존 photo-uploader.tsx와 동일한 패턴 적용

- **2025-10-11 (v1)**: Storage RLS 정책 초기 설계
  - portfolio-images 버킷 생성 (폐기됨)
  - photographer 권한 체크 기반 업로드 제한
