# RLS Utility Functions Guide

kindt 프로젝트의 Row Level Security (RLS) 유틸리티 함수 사용 가이드입니다.

## 목차

1. [개요](#개요)
2. [함수 목록](#함수-목록)
3. [사용 예시](#사용-예시)
4. [테이블별 Policy 패턴](#테이블별-policy-패턴)
5. [성능 최적화](#성능-최적화)

---

## 개요

Supabase의 RLS (Row Level Security)를 효율적으로 관리하기 위한 재사용 가능한 유틸리티 함수들입니다.

### 설치 완료

모든 함수는 이미 `public` 스키마에 생성되어 있으며, 바로 사용 가능합니다.

### 함수 특징

- ✅ **STABLE**: 동일 입력에 대해 동일 결과 보장 (성능 최적화)
- ✅ **SECURITY DEFINER**: 함수 소유자 권한으로 실행 (RLS 우회)
- ✅ **인덱스 최적화**: `users(id, role)` 인덱스로 빠른 조회

---

## 함수 목록

### 1. `is_owner(owner_id UUID)`

**용도**: 단일 소유자 컬럼 체크

**반환값**: `BOOLEAN`

**설명**: 현재 로그인한 사용자가 특정 owner_id와 일치하는지 확인

**예시**:
```sql
-- 본인이 작성한 리뷰만 수정 가능
CREATE POLICY "reviews_update_own"
ON reviews FOR UPDATE
USING (is_owner(user_id));
```

**사용 케이스**:
- 본인의 프로필만 수정
- 본인이 작성한 리뷰만 삭제
- 본인의 예약만 조회

---

### 2. `is_any_owner(VARIADIC owner_ids UUID[])`

**용도**: 여러 소유자 컬럼 중 하나라도 일치하면 true

**반환값**: `BOOLEAN`

**설명**: 테이블에 여러 owner 컬럼이 있을 때 (예: user_id, photographer_id) 그 중 하나라도 현재 사용자와 일치하면 true

**예시**:
```sql
-- inquiries: user 또는 photographer가 조회 가능
CREATE POLICY "inquiries_select_policy"
ON inquiries FOR SELECT
USING (
  is_any_owner(user_id, photographer_id)
  OR is_admin()
);
```

**사용 케이스**:
- inquiries: 문의한 사용자 + 담당 작가
- payments: 결제한 사용자 + 정산받을 작가
- messages: 보낸 사람 + 받은 사람

---

### 3. `is_user_or_photographer(p_user_id UUID, p_photographer_id UUID)`

**용도**: 사용자 또는 작가 소유 데이터 체크 (payments, inquiries 전용)

**반환값**: `BOOLEAN`

**설명**: `is_any_owner`의 2개 파라미터 특화 버전 (더 명확한 의도 표현)

**예시**:
```sql
-- payments: 결제자 또는 작가가 조회 가능
CREATE POLICY "payments_select_policy"
ON payments FOR SELECT
USING (
  is_user_or_photographer(user_id, photographer_id)
  OR is_admin()
);
```

**사용 케이스**:
- payments 테이블
- inquiries 테이블
- settlements 테이블

---

### 4. `is_admin()`

**용도**: 관리자 권한 체크 (빠른 단축 함수)

**반환값**: `BOOLEAN`

**설명**: 현재 사용자가 `role = 'admin'`인지 빠르게 체크

**예시**:
```sql
-- admin만 모든 사용자 정보 조회 가능
CREATE POLICY "users_admin_select"
ON users FOR SELECT
USING (
  is_owner(id)
  OR is_admin()
);

-- admin만 삭제 가능
CREATE POLICY "photographers_delete_admin_only"
ON photographers FOR DELETE
USING (is_admin());
```

**사용 케이스**:
- 관리자 전용 테이블 (system_settings, logs)
- 삭제 권한 제한
- 전체 데이터 조회 권한

---

### 5. `is_photographer()`

**용도**: 작가 이상 권한 체크 (photographer 또는 admin)

**반환값**: `BOOLEAN`

**설명**: 현재 사용자가 `role IN ('photographer', 'admin')`인지 체크

**예시**:
```sql
-- 작가만 상품 등록 가능
CREATE POLICY "products_insert_photographer"
ON products FOR INSERT
WITH CHECK (
  is_photographer()
  AND is_owner(photographer_id)
);

-- 작가만 자신의 스케줄 수정 가능
CREATE POLICY "available_slots_update_photographer"
ON available_slots FOR UPDATE
USING (
  is_photographer()
  AND is_owner(admin_id)
);
```

**사용 케이스**:
- products: 작가가 상품 등록
- available_slots: 작가가 일정 관리
- photos: 작가가 포트폴리오 업로드

---

## 사용 예시

### 예시 1: payments 테이블

**요구사항**:
- SELECT: 결제한 사용자 + 정산받을 작가 + 관리자
- INSERT: 결제한 사용자만
- UPDATE: 관리자만
- DELETE: 관리자만

```sql
-- SELECT: 사용자, 작가, 관리자
CREATE POLICY "payments_select_policy"
ON payments FOR SELECT
USING (
  is_user_or_photographer(user_id, photographer_id)
  OR is_admin()
);

-- INSERT: 결제하는 사용자만
CREATE POLICY "payments_insert_policy"
ON payments FOR INSERT
WITH CHECK (is_owner(user_id));

-- UPDATE: 관리자만
CREATE POLICY "payments_update_policy"
ON payments FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- DELETE: 관리자만
CREATE POLICY "payments_delete_policy"
ON payments FOR DELETE
USING (is_admin());
```

---

### 예시 2: inquiries 테이블

**요구사항**:
- SELECT: 문의한 사용자 + 담당 작가 + 관리자
- INSERT: 로그인한 사용자만
- UPDATE: 문의자 + 작가 + 관리자
- DELETE: 관리자만

```sql
-- SELECT: 여러 owner 체크
CREATE POLICY "inquiries_select_policy"
ON inquiries FOR SELECT
USING (
  is_any_owner(user_id, photographer_id)
  OR is_admin()
);

-- INSERT: 본인 것만
CREATE POLICY "inquiries_insert_policy"
ON inquiries FOR INSERT
WITH CHECK (
  min_role('user')
  AND is_owner(user_id)
);

-- UPDATE: 문의자, 작가, 관리자
CREATE POLICY "inquiries_update_policy"
ON inquiries FOR UPDATE
USING (
  is_any_owner(user_id, photographer_id)
  OR is_admin()
);

-- DELETE: 관리자만
CREATE POLICY "inquiries_delete_policy"
ON inquiries FOR DELETE
USING (is_admin());
```

---

### 예시 3: photographers 테이블

**요구사항**:
- SELECT: 누구나 (공개 프로필)
- INSERT: user가 본인 ID로 등록
- UPDATE: 본인 또는 관리자
- DELETE: 관리자만

```sql
-- SELECT: 누구나 (프론트에서 approval_status 필터링)
CREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (true);

-- INSERT: user가 본인 ID로
CREATE POLICY "photographers_insert_policy"
ON photographers FOR INSERT
WITH CHECK (
  min_role('user')
  AND is_owner(id)
);

-- UPDATE: 본인 또는 관리자
CREATE POLICY "photographers_update_policy"
ON photographers FOR UPDATE
USING (
  is_owner(id)
  OR is_admin()
)
WITH CHECK (
  is_owner(id)
  OR is_admin()
);

-- DELETE: 관리자만
CREATE POLICY "photographers_delete_policy"
ON photographers FOR DELETE
USING (is_admin());
```

---

### 예시 4: products 테이블

**요구사항**:
- SELECT: 누구나 (공개 상품)
- INSERT: 작가가 본인 상품만
- UPDATE: 작가가 본인 상품만 (또는 관리자)
- DELETE: 작가 본인 또는 관리자

```sql
-- SELECT: 누구나
CREATE POLICY "products_select_policy"
ON products FOR SELECT
USING (true);

-- INSERT: 작가가 본인 것만
CREATE POLICY "products_insert_policy"
ON products FOR INSERT
WITH CHECK (
  is_photographer()
  AND is_owner(photographer_id)
);

-- UPDATE: 작가 본인 또는 관리자
CREATE POLICY "products_update_policy"
ON products FOR UPDATE
USING (
  is_owner(photographer_id)
  OR is_admin()
)
WITH CHECK (
  is_owner(photographer_id)
  OR is_admin()
);

-- DELETE: 작가 본인 또는 관리자
CREATE POLICY "products_delete_policy"
ON products FOR DELETE
USING (
  is_owner(photographer_id)
  OR is_admin()
);
```

---

### 예시 5: reviews 테이블

**요구사항**:
- SELECT: 누구나 (공개 리뷰)
- INSERT: 예약한 사용자만
- UPDATE: 작성자만
- DELETE: 작성자 또는 관리자

```sql
-- SELECT: 누구나
CREATE POLICY "reviews_select_policy"
ON reviews FOR SELECT
USING (true);

-- INSERT: 예약 확인 후 작성 (복잡한 로직은 프론트/백엔드에서)
CREATE POLICY "reviews_insert_policy"
ON reviews FOR INSERT
WITH CHECK (min_role('user'));

-- UPDATE: 작성자만
CREATE POLICY "reviews_update_policy"
ON reviews FOR UPDATE
USING (is_owner(user_id))
WITH CHECK (is_owner(user_id));

-- DELETE: 작성자 또는 관리자
CREATE POLICY "reviews_delete_policy"
ON reviews FOR DELETE
USING (
  is_owner(user_id)
  OR is_admin()
);
```

---

## 테이블별 Policy 패턴

### 패턴 1: 공개 테이블 (photographers, products, photos)

**특징**: 누구나 조회 가능, 작성자만 수정

```sql
-- SELECT: 누구나
USING (true);

-- INSERT/UPDATE: 본인 것만
WITH CHECK (is_owner(owner_column));

-- DELETE: 본인 또는 관리자
USING (is_owner(owner_column) OR is_admin());
```

---

### 패턴 2: 본인 데이터 (payments, inquiries, settlements)

**특징**: 관련자만 조회, 제한적 수정

```sql
-- SELECT: 여러 관련자
USING (
  is_any_owner(user_id, photographer_id)
  OR is_admin()
);

-- INSERT: 본인 것만
WITH CHECK (is_owner(user_id));

-- UPDATE: 관련자 또는 관리자
USING (
  is_any_owner(user_id, photographer_id)
  OR is_admin()
);

-- DELETE: 관리자만
USING (is_admin());
```

---

### 패턴 3: 관리자 전용 (system_settings, logs)

**특징**: 관리자만 모든 작업 가능

```sql
-- ALL operations: 관리자만
USING (is_admin())
WITH CHECK (is_admin());
```

---

### 패턴 4: 읽기 전용 공개 (survey_questions, terms)

**특징**: 누구나 읽기, 관리자만 수정

```sql
-- SELECT: 누구나
USING (true);

-- INSERT/UPDATE/DELETE: 관리자만
USING (is_admin())
WITH CHECK (is_admin());
```

---

## 성능 최적화

### 1. 인덱스 활용

RLS 함수는 다음 인덱스를 활용하여 빠르게 동작합니다:

```sql
-- 이미 생성됨
CREATE INDEX idx_users_id_role ON users(id, role);
```

**추가 권장 인덱스** (필요시 생성):

```sql
-- owner 컬럼에 대한 인덱스
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_photographer_id ON payments(photographer_id);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_photographer_id ON inquiries(photographer_id);
CREATE INDEX idx_products_photographer_id ON products(photographer_id);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
```

---

### 2. 함수 선택 가이드

**빠른 순서** (성능 우선):

1. `is_admin()` - 단순 role 체크 (가장 빠름)
2. `is_photographer()` - role IN 체크
3. `is_owner(uuid)` - 단순 UUID 비교
4. `is_user_or_photographer(uuid, uuid)` - 2개 UUID 비교
5. `is_any_owner(uuid[])` - 배열 비교 (가장 느림)

**권장 사항**:
- 가능하면 구체적인 함수 사용 (`is_admin()` > `min_role('admin')`)
- 2개 owner만 체크할 때는 `is_user_or_photographer()` 사용
- 3개 이상일 때만 `is_any_owner()` 사용

---

### 3. Policy 최적화 팁

```sql
-- ❌ 비효율: 복잡한 서브쿼리
USING (
  auth.uid() IN (
    SELECT user_id FROM some_table WHERE ...
  )
);

-- ✅ 효율: 간단한 함수 호출
USING (is_owner(user_id));

-- ❌ 비효율: 여러 조건을 AND로
USING (
  is_owner(user_id) AND is_owner(photographer_id)
);

-- ✅ 효율: 한 번에 체크
USING (is_any_owner(user_id, photographer_id));
```

---

## 함수 조합 예시

### 복잡한 권한 체크

```sql
-- 본인 또는 관리자
USING (is_owner(user_id) OR is_admin());

-- 작가 본인 또는 관리자
USING (
  (is_photographer() AND is_owner(photographer_id))
  OR is_admin()
);

-- 관련자 중 한 명
USING (
  is_any_owner(user_id, photographer_id, admin_id)
  OR is_admin()
);
```

---

## 마이그레이션 가이드

### 기존 Policy 업데이트

**Before**:
```sql
CREATE POLICY "old_policy"
ON table_name FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = photographer_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

**After**:
```sql
CREATE POLICY "new_policy"
ON table_name FOR SELECT
USING (
  is_any_owner(user_id, photographer_id)
  OR is_admin()
);
```

**개선점**:
- ✅ 가독성 향상
- ✅ 재사용 가능
- ✅ 성능 최적화 (STABLE, 인덱스 활용)
- ✅ 유지보수 용이

---

## 트러블슈팅

### Q: "함수를 찾을 수 없습니다"

**A**: 함수가 `public` 스키마에 있는지 확인하세요.

```sql
-- 함수 확인
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name LIKE 'is_%'
  AND routine_schema = 'public';
```

### Q: "권한이 없습니다"

**A**: 함수는 `SECURITY DEFINER`로 생성되어야 합니다.

```sql
-- 함수 속성 확인
SELECT prosecdef
FROM pg_proc
WHERE proname = 'is_owner';
-- prosecdef가 true여야 함
```

### Q: "성능이 느립니다"

**A**: 인덱스를 확인하세요.

```sql
-- users 테이블 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexdef LIKE '%role%';
```

---

## 참고 자료

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy 문서](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [kindt RLS Guide](/specs/rls-guide.md)
