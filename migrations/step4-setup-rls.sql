-- ==========================================
-- Step 4: RLS 정책 설정
-- ==========================================

-- 4.1 RLS 활성화
ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;

-- 4.2 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own profile" ON users_new;
DROP POLICY IF EXISTS "Users can update own profile" ON users_new;
DROP POLICY IF EXISTS "Admins can view all users" ON users_new;
DROP POLICY IF EXISTS "Admins can update all users" ON users_new;
DROP POLICY IF EXISTS "Admins can delete users" ON users_new;
DROP POLICY IF EXISTS "Admins can insert users" ON users_new;

-- 4.3 SELECT 정책
-- 사용자는 자기 자신의 프로필을 볼 수 있음
CREATE POLICY "Users can view own profile" ON users_new
  FOR SELECT
  USING (auth.uid() = id);

-- 관리자는 모든 사용자를 볼 수 있음
CREATE POLICY "Admins can view all users" ON users_new
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 작가는 자신의 프로필과 고객 프로필을 볼 수 있음
CREATE POLICY "Photographers can view own and customer profiles" ON users_new
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'photographer'
    )
    OR auth.uid() = id
  );

-- 4.4 UPDATE 정책
-- 사용자는 자기 자신의 프로필을 수정할 수 있음
CREATE POLICY "Users can update own profile" ON users_new
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 관리자는 모든 사용자를 수정할 수 있음
CREATE POLICY "Admins can update all users" ON users_new
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4.5 INSERT 정책
-- 관리자만 사용자를 추가할 수 있음 (일반 회원가입은 트리거로 처리)
CREATE POLICY "Admins can insert users" ON users_new
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4.6 DELETE 정책
-- 관리자만 사용자를 삭제할 수 있음
CREATE POLICY "Admins can delete users" ON users_new
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users_new
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 검증: RLS 정책 확인
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
WHERE tablename = 'users_new'
ORDER BY policyname;

-- 검증: RLS 활성화 여부 확인
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users_new';
