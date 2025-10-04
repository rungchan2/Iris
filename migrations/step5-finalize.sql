-- ==========================================
-- Step 5: 테이블명 변경 및 정리 (최종 단계)
-- ⚠️ 모든 테스트가 완료된 후에만 실행!
-- ==========================================

-- 5.1 기존 users 테이블을 users_old로 백업
ALTER TABLE users RENAME TO users_old;

-- 5.2 users_new를 users로 변경
ALTER TABLE users_new RENAME TO users;

-- 5.3 인덱스 이름 변경
ALTER INDEX IF EXISTS idx_users_new_role RENAME TO idx_users_role;
ALTER INDEX IF EXISTS idx_users_new_email RENAME TO idx_users_email;
ALTER INDEX IF EXISTS idx_users_new_created_at RENAME TO idx_users_created_at;

-- 5.4 제약조건 이름 변경 (선택사항)
-- users_new_pkey → users_pkey
ALTER TABLE users RENAME CONSTRAINT users_new_pkey TO users_pkey;
ALTER TABLE users RENAME CONSTRAINT users_new_email_key TO users_email_key;
ALTER TABLE users RENAME CONSTRAINT users_new_role_check TO users_role_check;
ALTER TABLE users RENAME CONSTRAINT users_new_id_fkey TO users_id_fkey;

-- 5.5 RLS 정책 테이블명 업데이트 (자동으로 반영됨)

-- 5.6 트리거 함수 업데이트
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.7 기존 테이블 삭제 (백업 확인 후 - 주석 해제하여 실행)
-- DROP TABLE IF EXISTS admins CASCADE;
-- DROP TABLE IF EXISTS photographers CASCADE;
-- DROP TABLE IF EXISTS users_old CASCADE;

-- 검증: 최종 테이블 구조 확인
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('users', 'users_old', 'admins', 'photographers')
ORDER BY table_name;

-- 검증: users 테이블 레코드 수
SELECT COUNT(*) as total_users FROM users;

-- 검증: role별 분포
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- 검증: 외래키 참조 확인
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
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;
