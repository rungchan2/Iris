🎯 최종 Role 구조
anon (0) < user (10) < photographer (20) < admin (40)
photographer는 승인 상태 무관, 프론트에서 approval_status 필터링

🔧 최종 함수 구현
sql-- ============================================
-- 최소 권한 체크 함수
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

-- ============================================
-- 소유자 체크 함수
-- ============================================
CREATE OR REPLACE FUNCTION auth.is_owner(owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = owner_id;
$$;

-- ============================================
-- 인덱스 (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_id_role 
ON users(id, role);

📝 photographers 테이블 RLS 예시
sql-- ============================================
-- photographers 테이블 RLS
-- ============================================
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;

-- SELECT: 누구나 볼 수 있음 (anon 포함)
-- 프론트에서 approval_status 필터링
CREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (
  auth.min_role('anon')  -- 누구나 (본인 체크 불필요, 어차피 다 보임)
  OR auth.min_role('admin')  -- 명시적으로 관리자 (사실 위에서 이미 포함)
);

-- 또는 더 간단하게
CREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (true);  -- 누구나 조회 가능, 프론트에서 필터링

-- INSERT: user 이상, 본인 것만
CREATE POLICY "photographers_insert_policy"
ON photographers FOR INSERT
WITH CHECK (
  auth.min_role('user') 
  AND auth.is_owner(id)
);

-- UPDATE: photographer 이상, 본인 것만
CREATE POLICY "photographers_update_policy"
ON photographers FOR UPDATE
USING (
  auth.min_role('photographer')
  AND auth.is_owner(id)
)
WITH CHECK (
  auth.is_owner(id)
);

-- DELETE: admin만
CREATE POLICY "photographers_delete_policy"
ON photographers FOR DELETE
USING (
  auth.min_role('admin')
);

🤔 SELECT 정책 논의
옵션 A: 완전 공개 (⭐⭐⭐⭐⭐ 추천)
sqlCREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (true);  -- 누구나 조회 가능
장점:

초간단
프론트에서 approval_status = 'approved' 필터링
RLS 오버헤드 0

프론트 쿼리:
typescript// 승인된 작가만
const { data } = await supabase
  .from('photographers')
  .select('*')
  .eq('approval_status', 'approved')

// 본인 프로필 (pending이어도 OK)
const { data } = await supabase
  .from('photographers')
  .select('*')
  .eq('id', userId)

옵션 B: RLS에서도 필터링 (혼합)
sqlCREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (
  -- 승인된 것만 공개
  approval_status = 'approved'
  
  OR
  
  -- 본인은 항상 볼 수 있음
  auth.is_owner(id)
  
  OR
  
  -- 관리자는 모두
  auth.min_role('admin')
);
장점:

DB 레벨 보안 강화
프론트 실수 방지 (필터 빼먹어도 안전)

단점:

RLS 체크 오버헤드
복잡도 증가


💡 권장 사항
photographers 같은 "공개 프로필"은 옵션 A
sqlUSING (true);
이유:

어차피 공개 프로필 (숨길 필요 없음)
프론트에서 approval_status 필터링하는 게 더 유연
성능 최고

민감한 테이블은 옵션 B
sql-- payments, inquiries 등
USING (
  auth.is_owner(user_id)
  OR auth.min_role('admin')
);
이유:

개인 정보 보호
DB 레벨 최종 방어선
프론트 버그로 인한 노출 방지


📊 다른 테이블 예시
products (공개)
sql-- SELECT: 누구나, 프론트에서 status 필터링
CREATE POLICY "products_select_policy"
ON products FOR SELECT
USING (true);

-- INSERT: photographer 이상, 본인 것만
CREATE POLICY "products_insert_policy"
ON products FOR INSERT
WITH CHECK (
  auth.min_role('photographer')
  AND auth.is_owner(photographer_id)
);

-- UPDATE: photographer 이상, 본인 것만
CREATE POLICY "products_update_policy"
ON products FOR UPDATE
USING (
  auth.min_role('photographer')
  AND auth.is_owner(photographer_id)
)
WITH CHECK (
  auth.is_owner(photographer_id)
);

-- DELETE: photographer 이상, 본인 것만 (또는 admin)
CREATE POLICY "products_delete_policy"
ON products FOR DELETE
USING (
  (auth.min_role('photographer') AND auth.is_owner(photographer_id))
  OR auth.min_role('admin')
);

inquiries (민감)
sql-- SELECT: 본인 것만 + 관련 작가 + 관리자
CREATE POLICY "inquiries_select_policy"
ON inquiries FOR SELECT
USING (
  auth.is_owner(user_id)
  OR auth.is_owner(photographer_id)
  OR auth.min_role('admin')
);

-- INSERT: user 이상, 본인 것만
CREATE POLICY "inquiries_insert_policy"
ON inquiries FOR INSERT
WITH CHECK (
  auth.min_role('user')
  AND auth.is_owner(user_id)
);

-- UPDATE: 본인 또는 관련 작가
CREATE POLICY "inquiries_update_policy"
ON inquiries FOR UPDATE
USING (
  auth.is_owner(user_id)
  OR auth.is_owner(photographer_id)
  OR auth.min_role('admin')
);

-- DELETE: admin만
CREATE POLICY "inquiries_delete_policy"
ON inquiries FOR DELETE
USING (
  auth.min_role('admin')
);

survey_questions (읽기 전용 + 관리자)
sql-- SELECT: 누구나
CREATE POLICY "survey_questions_select_policy"
ON survey_questions FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE: admin만
CREATE POLICY "survey_questions_modify_policy"
ON survey_questions FOR ALL
USING (auth.min_role('admin'))
WITH CHECK (auth.min_role('admin'));

✅ 최종 정리
함수 2개만!
sqlauth.min_role('photographer')  -- 권한 체크
auth.is_owner(photographer_id) -- 소유권 체크
RLS 패턴 3가지
sql-- 1. 공개 테이블 (photographers, products)
USING (true);

-- 2. 본인 데이터 (inquiries, payments)
USING (
  auth.is_owner(user_id)
  OR auth.min_role('admin')
);

-- 3. 관리자 전용 (settings, logs)
USING (auth.min_role('admin'));
이제 30개 테이블에 일관되게 적용 가능합니다!
다음 단계로 JSON → SQL 자동 생성 스크립트 만들까요?재시도