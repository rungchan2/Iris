-- ============================================
-- RLS Utility Functions for kindt
-- ============================================
-- 모든 테이블에서 재사용 가능한 RLS 함수들
-- 성능 최적화: STABLE, SECURITY DEFINER, 인덱스 활용
-- ============================================

-- ============================================
-- 1. 기본 소유자 체크 (단일 컬럼)
-- ============================================
CREATE OR REPLACE FUNCTION auth.is_owner(owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = owner_id;
$$;

COMMENT ON FUNCTION auth.is_owner(UUID) IS
'단일 owner_id와 현재 사용자 비교.
예: auth.is_owner(user_id)';

-- ============================================
-- 2. 다중 소유자 체크 (여러 컬럼 중 하나라도)
-- ============================================
CREATE OR REPLACE FUNCTION auth.is_any_owner(VARIADIC owner_ids UUID[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = ANY(owner_ids);
$$;

COMMENT ON FUNCTION auth.is_any_owner(UUID[]) IS
'여러 owner 컬럼 중 하나라도 현재 사용자와 일치하면 true.
예: auth.is_any_owner(user_id, photographer_id, admin_id)';

-- ============================================
-- 3. 사용자 + 작가 체크 (payments, inquiries 전용)
-- ============================================
CREATE OR REPLACE FUNCTION auth.is_user_or_photographer(
  p_user_id UUID,
  p_photographer_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = p_user_id
      OR auth.uid() = p_photographer_id;
$$;

COMMENT ON FUNCTION auth.is_user_or_photographer(UUID, UUID) IS
'사용자 또는 작가가 소유한 데이터인지 체크.
예: auth.is_user_or_photographer(user_id, photographer_id)';

-- ============================================
-- 4. 최소 권한 체크 (기존 함수 유지)
-- ============================================
CREATE OR REPLACE FUNCTION auth.min_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH role_levels AS (
    SELECT
      CASE u.role
        WHEN 'admin' THEN 40
        WHEN 'photographer' THEN 20
        WHEN 'user' THEN 10
        ELSE 0  -- anon 또는 null
      END as current_level
    FROM users u
    WHERE u.id = auth.uid()
  )
  SELECT
    COALESCE(current_level, 0) >=
    CASE required_role
      WHEN 'admin' THEN 40
      WHEN 'photographer' THEN 20
      WHEN 'user' THEN 10
      WHEN 'anon' THEN 0
      ELSE 0
    END
  FROM role_levels;
$$;

COMMENT ON FUNCTION auth.min_role(TEXT) IS
'현재 사용자가 최소 요구 권한을 만족하는지 체크.
예: auth.min_role(''photographer'')';

-- ============================================
-- 5. 관리자 체크 (빠른 단축 함수)
-- ============================================
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  );
$$;

COMMENT ON FUNCTION auth.is_admin() IS
'현재 사용자가 관리자인지 빠르게 체크.
예: auth.is_admin()';

-- ============================================
-- 6. 작가 권한 체크 (빠른 단축 함수)
-- ============================================
CREATE OR REPLACE FUNCTION auth.is_photographer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid()
      AND u.role IN ('photographer', 'admin')
  );
$$;

COMMENT ON FUNCTION auth.is_photographer() IS
'현재 사용자가 작가 이상 권한인지 체크 (photographer or admin).
예: auth.is_photographer()';

-- ============================================
-- 인덱스 최적화 (성능 향상)
-- ============================================

-- users 테이블 인덱스 (role 체크용)
CREATE INDEX IF NOT EXISTS idx_users_id_role
ON users(id, role);

-- 각 테이블의 owner 컬럼에 대한 인덱스는 필요시 추가:
-- CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
-- CREATE INDEX IF NOT EXISTS idx_payments_photographer_id ON payments(photographer_id);
-- CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
-- CREATE INDEX IF NOT EXISTS idx_inquiries_photographer_id ON inquiries(photographer_id);

-- ============================================
-- 사용 예시 (실제 Policy 적용)
-- ============================================
-- 주의: 함수는 public 스키마에 생성되었으므로
-- Policy에서 public.is_owner() 형태로 호출

-- 예시 1: payments 테이블
-- SELECT: 사용자 또는 작가 또는 관리자
-- INSERT: 결제하는 사용자만
-- UPDATE: 관리자만
-- DELETE: 관리자만
/*
CREATE POLICY "payments_select_policy"
ON payments FOR SELECT
USING (
  public.is_user_or_photographer(user_id, photographer_id)
  OR public.is_admin()
);

CREATE POLICY "payments_insert_policy"
ON payments FOR INSERT
WITH CHECK (public.is_owner(user_id));

CREATE POLICY "payments_update_policy"
ON payments FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "payments_delete_policy"
ON payments FOR DELETE
USING (public.is_admin());
*/

-- 예시 2: inquiries 테이블
-- SELECT: 문의자, 작가, 관리자
-- INSERT: 로그인한 사용자
-- UPDATE: 문의자, 작가, 관리자
-- DELETE: 관리자만
/*
CREATE POLICY "inquiries_select_policy"
ON inquiries FOR SELECT
USING (
  public.is_any_owner(user_id, photographer_id)
  OR public.is_admin()
);

CREATE POLICY "inquiries_insert_policy"
ON inquiries FOR INSERT
WITH CHECK (
  public.min_role('user')
  AND public.is_owner(user_id)
);

CREATE POLICY "inquiries_update_policy"
ON inquiries FOR UPDATE
USING (
  public.is_any_owner(user_id, photographer_id)
  OR public.is_admin()
);

CREATE POLICY "inquiries_delete_policy"
ON inquiries FOR DELETE
USING (public.is_admin());
*/

-- 예시 3: photographers 테이블
-- SELECT: 누구나 (공개 프로필)
-- INSERT: user가 본인 ID로
-- UPDATE: 본인 또는 관리자
-- DELETE: 관리자만
/*
CREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (true);

CREATE POLICY "photographers_insert_policy"
ON photographers FOR INSERT
WITH CHECK (
  public.min_role('user')
  AND public.is_owner(id)
);

CREATE POLICY "photographers_update_policy"
ON photographers FOR UPDATE
USING (
  public.is_owner(id)
  OR public.is_admin()
)
WITH CHECK (
  public.is_owner(id)
  OR public.is_admin()
);

CREATE POLICY "photographers_delete_policy"
ON photographers FOR DELETE
USING (public.is_admin());
*/

-- 예시 4: products 테이블
-- SELECT: 누구나 (공개 상품)
-- INSERT: 작가가 본인 상품만
-- UPDATE: 작가 본인 또는 관리자
-- DELETE: 작가 본인 또는 관리자
/*
CREATE POLICY "products_select_policy"
ON products FOR SELECT
USING (true);

CREATE POLICY "products_insert_policy"
ON products FOR INSERT
WITH CHECK (
  public.is_photographer()
  AND public.is_owner(photographer_id)
);

CREATE POLICY "products_update_policy"
ON products FOR UPDATE
USING (
  public.is_owner(photographer_id)
  OR public.is_admin()
)
WITH CHECK (
  public.is_owner(photographer_id)
  OR public.is_admin()
);

CREATE POLICY "products_delete_policy"
ON products FOR DELETE
USING (
  public.is_owner(photographer_id)
  OR public.is_admin()
);
*/

-- 예시 5: 민감한 테이블 - 관리자만 접근
/*
CREATE POLICY "system_settings_policy"
ON system_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
*/

-- 예시 6: reviews 테이블
-- SELECT: 누구나 (공개 리뷰)
-- INSERT: 로그인한 사용자
-- UPDATE: 작성자만
-- DELETE: 작성자 또는 관리자
/*
CREATE POLICY "reviews_select_policy"
ON reviews FOR SELECT
USING (true);

CREATE POLICY "reviews_insert_policy"
ON reviews FOR INSERT
WITH CHECK (public.min_role('user'));

CREATE POLICY "reviews_update_policy"
ON reviews FOR UPDATE
USING (public.is_owner(user_id))
WITH CHECK (public.is_owner(user_id));

CREATE POLICY "reviews_delete_policy"
ON reviews FOR DELETE
USING (
  public.is_owner(user_id)
  OR public.is_admin()
);
*/
