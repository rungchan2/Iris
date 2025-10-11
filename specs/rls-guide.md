🎯 최종 Role 구조
anon (0) < user (10) < photographer (20) < admin (40)
photographer는 승인 상태 무관, 프론트에서 approval_status 필터링

---

## 📚 문서 인덱스

- **새로운 RLS 함수 상세 가이드**: [`/docs/RLS_UTILS_GUIDE.md`](/docs/RLS_UTILS_GUIDE.md)
- **클라이언트 인증 유틸**: [`/docs/AUTH_UTILS_GUIDE.md`](/docs/AUTH_UTILS_GUIDE.md)
- **SQL 함수 정의 파일**: [`/lib/auth/rls-utils.sql`](/lib/auth/rls-utils.sql)

---

🔧 RLS 유틸리티 함수 (public 스키마)

> ⚠️ **중요**: 모든 RLS 함수는 `public` 스키마에 생성되어 있습니다.
>
> 자세한 사용법은 [`/docs/RLS_UTILS_GUIDE.md`](/docs/RLS_UTILS_GUIDE.md) 참고

**새 함수의 장점**:
- ✅ **재사용성**: 모든 테이블에서 동일한 패턴 적용
- ✅ **성능**: STABLE + SECURITY DEFINER + 인덱스 최적화
- ✅ **가독성**: 복잡한 서브쿼리 대신 명확한 함수 호출
- ✅ **유지보수**: 권한 로직 중앙화 (한 곳만 수정)

### 1. 단일 소유자 체크 (`is_owner`)

sql
CREATE OR REPLACE FUNCTION public.is_owner(owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = owner_id;
$$;

**사용 예시**:
sql
-- 본인이 작성한 리뷰만 수정 가능
CREATE POLICY "reviews_update_own"
ON reviews FOR UPDATE
USING (public.is_owner(user_id));


### 2. 다중 소유자 체크 (`is_any_owner`)

sql
CREATE OR REPLACE FUNCTION public.is_any_owner(VARIADIC owner_ids UUID[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = ANY(owner_ids);
$$;

**사용 예시**:
sql
-- inquiries: 문의자 또는 작가가 조회 가능
CREATE POLICY "inquiries_select_policy"
ON inquiries FOR SELECT
USING (
  public.is_any_owner(user_id, photographer_id)
  OR public.is_admin()
);


### 3. 사용자 + 작가 체크 (`is_user_or_photographer`)

sql
CREATE OR REPLACE FUNCTION public.is_user_or_photographer(
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

**사용 예시**:
sql
-- payments: 결제자 또는 작가가 조회 가능
CREATE POLICY "payments_select_policy"
ON payments FOR SELECT
USING (
  public.is_user_or_photographer(user_id, photographer_id)
  OR public.is_admin()
);


### 4. 관리자 체크 (`is_admin`)

sql
CREATE OR REPLACE FUNCTION public.is_admin()
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

**사용 예시**:
sql
-- admin만 모든 사용자 정보 조회 가능
CREATE POLICY "users_admin_select"
ON users FOR SELECT
USING (
  public.is_owner(id)
  OR public.is_admin()
);


### 5. 작가 권한 체크 (`is_photographer`)

sql
CREATE OR REPLACE FUNCTION public.is_photographer()
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

**사용 예시**:
sql
-- 작가만 상품 등록 가능
CREATE POLICY "products_insert_photographer"
ON products FOR INSERT
WITH CHECK (
  public.is_photographer()
  AND public.is_owner(photographer_id)
);


### 6. 최소 권한 체크 (레거시 - `auth.min_role`)

sql
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


> 💡 **권장**: 간단한 권한 체크는 `public.is_admin()`, `public.is_photographer()` 사용 (더 빠름)

### 성능 최적화 인덱스

sql
-- users 테이블 인덱스 (role 체크용)
CREATE INDEX IF NOT EXISTS idx_users_id_role
ON users(id, role);

-- owner 컬럼 인덱스 (필요시 추가)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_photographer_id ON payments(photographer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_photographer_id ON inquiries(photographer_id);

📝 photographers 테이블 RLS 예시
sql-- ============================================
-- photographers 테이블 RLS
-- ============================================
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;

-- SELECT: 누구나 볼 수 있음 (anon 포함)
-- 프론트에서 approval_status 필터링
CREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (true);  -- 누구나 조회 가능, 프론트에서 필터링

-- INSERT: user 이상, 본인 것만
CREATE POLICY "photographers_insert_policy"
ON photographers FOR INSERT
WITH CHECK (
  auth.min_role('user')
  AND public.is_owner(id)
);

-- UPDATE: photographer 이상, 본인 것만
CREATE POLICY "photographers_update_policy"
ON photographers FOR UPDATE
USING (
  auth.min_role('photographer')
  AND public.is_owner(id)
)
WITH CHECK (
  public.is_owner(id)
);

-- DELETE: admin만
CREATE POLICY "photographers_delete_policy"
ON photographers FOR DELETE
USING (
  public.is_admin()
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
  public.is_owner(id)

  OR

  -- 관리자는 모두
  public.is_admin()
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
  public.is_owner(user_id)
  OR public.is_admin()
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
  public.is_photographer()
  AND public.is_owner(photographer_id)
);

-- UPDATE: photographer 이상, 본인 것만
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

-- DELETE: photographer 이상, 본인 것만 (또는 admin)
CREATE POLICY "products_delete_policy"
ON products FOR DELETE
USING (
  public.is_owner(photographer_id)
  OR public.is_admin()
);

inquiries (민감)
sql-- SELECT: 본인 것만 + 관련 작가 + 관리자
CREATE POLICY "inquiries_select_policy"
ON inquiries FOR SELECT
USING (
  public.is_any_owner(user_id, photographer_id)
  OR public.is_admin()
);

-- INSERT: user 이상, 본인 것만
CREATE POLICY "inquiries_insert_policy"
ON inquiries FOR INSERT
WITH CHECK (
  auth.min_role('user')
  AND public.is_owner(user_id)
);

-- UPDATE: 본인 또는 관련 작가
CREATE POLICY "inquiries_update_policy"
ON inquiries FOR UPDATE
USING (
  public.is_any_owner(user_id, photographer_id)
  OR public.is_admin()
);

-- DELETE: admin만
CREATE POLICY "inquiries_delete_policy"
ON inquiries FOR DELETE
USING (
  public.is_admin()
);

survey_questions (읽기 전용 + 관리자)
sql-- SELECT: 누구나
CREATE POLICY "survey_questions_select_policy"
ON survey_questions FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE: admin만
CREATE POLICY "survey_questions_modify_policy"
ON survey_questions FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

✅ 최종 정리

### 새로운 RLS 함수 (public 스키마)
sqlpublic.is_owner(owner_id)                    -- 단일 소유자 체크
public.is_any_owner(user_id, photographer_id)  -- 다중 소유자 체크
public.is_user_or_photographer(u_id, p_id)     -- 특화 버전 (payments/inquiries)
public.is_admin()                               -- 관리자 체크 (빠름)
public.is_photographer()                        -- 작가 이상 권한 체크

### 레거시 함수 (auth 스키마)
sqlauth.min_role('photographer')  -- 최소 권한 체크 (권장: 새 함수 사용)

### RLS 패턴 3가지
sql-- 1. 공개 테이블 (photographers, products)
USING (true);

-- 2. 본인 데이터 (inquiries, payments)
USING (
  public.is_any_owner(user_id, photographer_id)
  OR public.is_admin()
);

-- 3. 관리자 전용 (settings, logs)
USING (public.is_admin());
이제 30개 테이블에 일관되게 적용 가능합니다!
다음 단계로 JSON → SQL 자동 생성 스크립트 만들까요?재시도