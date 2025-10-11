# Users 테이블 통합 마이그레이션 가이드

## 📋 개요

`admins`, `photographers`, `users` 3개의 테이블을 단일 `users` 테이블로 통합하는 마이그레이션입니다.

## ⚠️ 사전 준비

### 1. 백업 생성
Supabase Dashboard > Database > Backups 에서 현재 상태를 백업하세요.

### 2. 마이그레이션 파일 확인
- `step1-create-table.sql`: users_new 테이블 생성
- `step2-migrate-data.sql`: 데이터 마이그레이션
- `step3-update-foreign-keys.sql`: 외래키 업데이트
- `step4-setup-rls.sql`: RLS 정책 설정
- `step5-finalize.sql`: 테이블명 변경 및 정리

## 🚀 실행 방법

### 옵션 1: Supabase Dashboard (추천)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/kypwcsgwjtnkiiwjedcn

2. **SQL Editor 열기**
   - 왼쪽 메뉴 > SQL Editor > New query

3. **단계별 실행**

#### Step 1: 테이블 생성
```bash
cat migrations/step1-create-table.sql
```
위 내용을 복사하여 SQL Editor에 붙여넣고 RUN

#### Step 2: 데이터 마이그레이션
```bash
cat migrations/step2-migrate-data.sql
```
위 내용을 복사하여 SQL Editor에 붙여넣고 RUN

#### Step 3: 외래키 업데이트
```bash
cat migrations/step3-update-foreign-keys.sql
```
위 내용을 복사하여 SQL Editor에 붙여넣고 RUN

#### Step 4: RLS 정책 설정
```bash
cat migrations/step4-setup-rls.sql
```
위 내용을 복사하여 SQL Editor에 붙여넣고 RUN

#### Step 5: 최종 정리 (테스트 완료 후)
```bash
cat migrations/step5-finalize.sql
```
⚠️ 모든 테스트가 완료된 후에만 실행!

### 옵션 2: psql 사용

```bash
# 환경변수 설정 (.env.local 참조)
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.kypwcsgwjtnkiiwjedcn.supabase.co:5432/postgres"

# 단계별 실행
psql $SUPABASE_DB_URL -f migrations/step1-create-table.sql
psql $SUPABASE_DB_URL -f migrations/step2-migrate-data.sql
psql $SUPABASE_DB_URL -f migrations/step3-update-foreign-keys.sql
psql $SUPABASE_DB_URL -f migrations/step4-setup-rls.sql

# 테스트 완료 후
psql $SUPABASE_DB_URL -f migrations/step5-finalize.sql
```

## ✅ 각 단계 후 검증

### Step 1 후:
```sql
SELECT COUNT(*) FROM users_new;  -- 0이어야 함
```

### Step 2 후:
```sql
SELECT
  'admins' as source, COUNT(*) FROM admins
UNION ALL
SELECT 'photographers', COUNT(*) FROM photographers
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'users_new', COUNT(*) FROM users_new;

-- users_new의 레코드 수 = admins + photographers + users 합계
```

### Step 3 후:
```sql
-- 외래키 제약조건 확인
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users_new';
```

### Step 4 후:
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'users_new';
```

## 🔄 롤백 방법

Step 5 실행 전까지는 언제든 롤백 가능:

```sql
-- users_new 테이블만 삭제
DROP TABLE IF EXISTS users_new CASCADE;

-- 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
```

Step 5 실행 후 롤백:
```sql
-- users를 users_new로 되돌리기
ALTER TABLE users RENAME TO users_new;
ALTER TABLE users_old RENAME TO users;

-- admins, photographers 복원은 백업에서
```

## 📝 마이그레이션 영향 범위

### 수정되는 외래키 (21개)

**admins → users_new:**
- embedding_jobs.requested_by
- system_settings.updated_by
- products.approved_by
- stories.moderated_by

**photographers → users_new:**
- products.created_by
- products.photographer_id
- photographer_profiles.photographer_id
- photographer_keywords.photographer_id
- photos.uploaded_by
- available_slots.admin_id
- inquiries.photographer_id
- payments.photographer_id
- matching_results.photographer_id
- settlement_items.photographer_id
- settlements.photographer_id
- user_feedback.photographer_id

**users → users_new:**
- inquiries.user_id
- matching_sessions.user_id
- payments.user_id
- coupons.user_id
- stories.user_id

## 🎯 마이그레이션 후 작업

### 1. TypeScript 타입 재생성
```bash
npm run update-types
```

### 2. 애플리케이션 코드 수정
- 모든 admins, photographers, users 참조를 users로 변경
- role 기반 필터링 추가
- Auth hooks 업데이트

### 3. 테스트
- 로그인/회원가입 테스트
- 권한 체크 테스트
- 기존 기능 동작 확인

## ❓ 문제 해결

### 외래키 오류
```
ERROR: update or delete on table "admins" violates foreign key constraint
```
→ Step 3에서 외래키를 업데이트하지 않은 경우. Step 3 재실행.

### 데이터 중복 오류
```
ERROR: duplicate key value violates unique constraint "users_new_pkey"
```
→ 동일한 id가 여러 테이블에 존재. 데이터 정합성 확인 필요.

### RLS 정책 오류
```
ERROR: new row violates row-level security policy
```
→ Step 4에서 RLS 정책을 올바르게 설정하지 않은 경우. Step 4 재실행.
