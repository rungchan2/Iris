-- ==========================================
-- Users 테이블 통합 마이그레이션
-- admins + photographers + users → users_new
-- ==========================================

-- Phase 1: users_new 테이블 생성
-- ==========================================

CREATE TABLE IF NOT EXISTS public.users_new (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'photographer', 'admin')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_new_role ON users_new(role);
CREATE INDEX IF NOT EXISTS idx_users_new_email ON users_new(email);
CREATE INDEX IF NOT EXISTS idx_users_new_created_at ON users_new(created_at DESC);

-- Phase 2: Auth 트리거 설정
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_new (id, email, name, role)
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

-- 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 새 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Phase 3: 데이터 마이그레이션
-- ==========================================

-- 3.1 admins → users_new
INSERT INTO users_new (id, email, name, role, phone, created_at, updated_at)
SELECT
  id,
  email,
  name,
  'admin',
  phone,
  created_at,
  updated_at
FROM admins
ON CONFLICT (id) DO NOTHING;

-- 3.2 photographers → users_new
INSERT INTO users_new (id, email, name, role, phone, created_at, updated_at)
SELECT
  id,
  email,
  name,
  'photographer',
  phone,
  created_at,
  updated_at
FROM photographers
ON CONFLICT (id) DO NOTHING;

-- 3.3 기존 users → users_new
INSERT INTO users_new (id, email, name, role, phone, created_at, updated_at)
SELECT
  id,
  email,
  name,
  'user',
  phone,
  created_at,
  updated_at
FROM users
ON CONFLICT (id) DO NOTHING;

-- 데이터 검증 쿼리 (주석 처리)
-- SELECT
--   'admins' as source, COUNT(*) as count FROM admins
-- UNION ALL
-- SELECT 'photographers', COUNT(*) FROM photographers
-- UNION ALL
-- SELECT 'users', COUNT(*) FROM users
-- UNION ALL
-- SELECT 'users_new', COUNT(*) FROM users_new;

-- Phase 4: 외래키 업데이트
-- ==========================================

-- 4.1 embedding_jobs.requested_by (admins → users_new)
ALTER TABLE embedding_jobs
  DROP CONSTRAINT IF EXISTS embedding_jobs_requested_by_fkey;
ALTER TABLE embedding_jobs
  ADD CONSTRAINT embedding_jobs_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES users_new(id);

-- 4.2 system_settings.updated_by (admins → users_new)
ALTER TABLE system_settings
  DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;
ALTER TABLE system_settings
  ADD CONSTRAINT system_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES users_new(id);

-- 4.3 products.approved_by (admins → users_new)
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_approved_by_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES users_new(id);

-- 4.4 stories.moderated_by (admins → users_new)
ALTER TABLE stories
  DROP CONSTRAINT IF EXISTS stories_moderated_by_fkey;
ALTER TABLE stories
  ADD CONSTRAINT stories_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES users_new(id);

-- 4.5 products.created_by (photographers → users_new)
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users_new(id);

-- 4.6 products.photographer_id (photographers → users_new)
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_photographer_id_fkey;
ALTER TABLE products
  ADD CONSTRAINT products_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.7 photographer_profiles.photographer_id (photographers → users_new)
ALTER TABLE photographer_profiles
  DROP CONSTRAINT IF EXISTS photographer_profiles_photographer_id_fkey;
ALTER TABLE photographer_profiles
  ADD CONSTRAINT photographer_profiles_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.8 photographer_keywords.photographer_id (photographers → users_new)
ALTER TABLE photographer_keywords
  DROP CONSTRAINT IF EXISTS photographer_keywords_photographer_id_fkey;
ALTER TABLE photographer_keywords
  ADD CONSTRAINT photographer_keywords_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.9 photos.uploaded_by (photographers → users_new)
ALTER TABLE photos
  DROP CONSTRAINT IF EXISTS photos_uploaded_by_fkey;
ALTER TABLE photos
  ADD CONSTRAINT photos_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users_new(id);

-- 4.10 available_slots.admin_id (photographers → users_new)
-- 주의: admin_id라는 이름이지만 photographers를 참조함
ALTER TABLE available_slots
  DROP CONSTRAINT IF EXISTS available_slots_admin_id_fkey;
ALTER TABLE available_slots
  ADD CONSTRAINT available_slots_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES users_new(id);

-- 4.11 inquiries.photographer_id (photographers → users_new)
ALTER TABLE inquiries
  DROP CONSTRAINT IF EXISTS inquiries_photographer_id_fkey;
ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.12 payments.photographer_id (photographers → users_new)
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_photographer_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.13 matching_results.photographer_id (photographers → users_new)
ALTER TABLE matching_results
  DROP CONSTRAINT IF EXISTS matching_results_photographer_id_fkey;
ALTER TABLE matching_results
  ADD CONSTRAINT matching_results_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.14 settlement_items.photographer_id (photographers → users_new)
ALTER TABLE settlement_items
  DROP CONSTRAINT IF EXISTS settlement_items_photographer_id_fkey;
ALTER TABLE settlement_items
  ADD CONSTRAINT settlement_items_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.15 settlements.photographer_id (photographers → users_new)
ALTER TABLE settlements
  DROP CONSTRAINT IF EXISTS settlements_photographer_id_fkey;
ALTER TABLE settlements
  ADD CONSTRAINT settlements_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.16 user_feedback.photographer_id (photographers → users_new)
ALTER TABLE user_feedback
  DROP CONSTRAINT IF EXISTS user_feedback_photographer_id_fkey;
ALTER TABLE user_feedback
  ADD CONSTRAINT user_feedback_photographer_id_fkey
  FOREIGN KEY (photographer_id) REFERENCES users_new(id);

-- 4.17 inquiries.user_id (users → users_new)
ALTER TABLE inquiries
  DROP CONSTRAINT IF EXISTS inquiries_user_id_fkey;
ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- 4.18 matching_sessions.user_id (users → users_new)
ALTER TABLE matching_sessions
  DROP CONSTRAINT IF EXISTS matching_sessions_user_id_fkey;
ALTER TABLE matching_sessions
  ADD CONSTRAINT matching_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- 4.19 payments.user_id (users → users_new)
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- 4.20 coupons.user_id (users → users_new)
ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_user_id_fkey;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- 4.21 stories.user_id (users → users_new)
ALTER TABLE stories
  DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE stories
  ADD CONSTRAINT stories_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users_new(id);

-- Phase 5: RLS 정책 설정
-- ==========================================

-- RLS 활성화
ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 자기 자신 조회
CREATE POLICY "Users can view own profile" ON users_new
  FOR SELECT USING (auth.uid() = id);

-- 자기 자신 수정
CREATE POLICY "Users can update own profile" ON users_new
  FOR UPDATE USING (auth.uid() = id);

-- 관리자 모든 사용자 조회
CREATE POLICY "Admins can view all users" ON users_new
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자 모든 사용자 수정
CREATE POLICY "Admins can update all users" ON users_new
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 관리자 사용자 삭제
CREATE POLICY "Admins can delete users" ON users_new
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Phase 6: 테이블명 변경 및 정리
-- ==========================================
-- 주의: 이 단계는 모든 테스트가 완료된 후에만 실행하세요!

-- users 테이블을 users_old로 백업
-- ALTER TABLE users RENAME TO users_old;

-- users_new를 users로 변경
-- ALTER TABLE users_new RENAME TO users;

-- 인덱스 이름 변경
-- ALTER INDEX idx_users_new_role RENAME TO idx_users_role;
-- ALTER INDEX idx_users_new_email RENAME TO idx_users_email;
-- ALTER INDEX idx_users_new_created_at RENAME TO idx_users_created_at;

-- 기존 테이블 삭제 (백업 확인 후)
-- DROP TABLE IF EXISTS admins CASCADE;
-- DROP TABLE IF EXISTS photographers CASCADE;
-- DROP TABLE IF EXISTS users_old CASCADE;

-- ==========================================
-- 마이그레이션 완료
-- ==========================================
