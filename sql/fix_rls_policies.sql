-- =====================================================
-- RLS 정책 수정 - 무한 재귀 문제 해결
-- =====================================================

-- 1. 기존 RLS 정책 제거
-- =====================================================

-- matching_sessions 테이블의 모든 정책 제거
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON matching_sessions;
DROP POLICY IF EXISTS "Enable select for users based on session_token" ON matching_sessions;
DROP POLICY IF EXISTS "Enable select for own sessions" ON matching_sessions;
DROP POLICY IF EXISTS "Users can insert matching sessions" ON matching_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON matching_sessions;
DROP POLICY IF EXISTS "Anonymous users can create sessions" ON matching_sessions;
DROP POLICY IF EXISTS "Session token access" ON matching_sessions;

-- matching_results 테이블의 정책도 확인
DROP POLICY IF EXISTS "Enable select for session owners" ON matching_results;
DROP POLICY IF EXISTS "Users can view matching results" ON matching_results;
DROP POLICY IF EXISTS "Session token result access" ON matching_results;

-- 2. 새로운 RLS 정책 생성 (무한 재귀 방지)
-- =====================================================

-- matching_sessions 테이블 정책
-- 익명 사용자도 세션 생성 가능
CREATE POLICY "Allow anonymous session creation" ON matching_sessions
  FOR INSERT WITH CHECK (true);

-- 세션 토큰으로 본인 세션 조회 가능  
CREATE POLICY "Allow session token access" ON matching_sessions
  FOR SELECT USING (
    session_token = current_setting('request.headers')::json->>'session-token'
    OR session_token IN (
      SELECT unnest(string_to_array(
        current_setting('request.headers', true)::json->>'authorization', 
        ' '
      ))
    )
    OR auth.uid() = user_id
  );

-- 세션 업데이트 권한 (토큰 기반)
CREATE POLICY "Allow session token updates" ON matching_sessions
  FOR UPDATE USING (
    session_token = current_setting('request.headers')::json->>'session-token'
    OR auth.uid() = user_id
  );

-- matching_results 테이블 정책
-- 세션 소유자가 결과 조회 가능
CREATE POLICY "Allow session results access" ON matching_results
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM matching_sessions 
      WHERE session_token = current_setting('request.headers')::json->>'session-token'
      OR user_id = auth.uid()
    )
  );

-- 시스템이 결과 삽입 가능 (서비스 역할)
CREATE POLICY "Allow system result insertion" ON matching_results
  FOR INSERT WITH CHECK (true);

-- 결과 업데이트 (행동 추적용)
CREATE POLICY "Allow result updates" ON matching_results
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM matching_sessions 
      WHERE session_token = current_setting('request.headers')::json->>'session-token'
      OR user_id = auth.uid()
    )
  );

-- 3. 읽기 전용 테이블들 (익명 접근 허용)
-- =====================================================

-- survey_questions 정책
DROP POLICY IF EXISTS "Enable read access for all users" ON survey_questions;
CREATE POLICY "Allow public question access" ON survey_questions
  FOR SELECT USING (is_active = true);

-- survey_choices 정책  
DROP POLICY IF EXISTS "Enable read access for all users" ON survey_choices;
CREATE POLICY "Allow public choice access" ON survey_choices
  FOR SELECT USING (is_active = true);

-- survey_images 정책
DROP POLICY IF EXISTS "Enable read access for all users" ON survey_images;
CREATE POLICY "Allow public image access" ON survey_images
  FOR SELECT USING (is_active = true);

-- photographer_profiles 정책 (완성된 프로필만 공개)
DROP POLICY IF EXISTS "Enable read access for completed profiles" ON photographer_profiles;
CREATE POLICY "Allow public completed profiles" ON photographer_profiles
  FOR SELECT USING (profile_completed = true);

-- photographers 정책 (승인된 작가만 공개)
DROP POLICY IF EXISTS "Enable read access for approved photographers" ON photographers;
CREATE POLICY "Allow public approved photographers" ON photographers
  FOR SELECT USING (approval_status = 'approved');

-- 4. 대안: RLS 비활성화 (개발 중인 경우)
-- =====================================================
-- 개발 중이라면 RLS를 잠시 비활성화할 수 있습니다:

/*
ALTER TABLE matching_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE matching_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_choices DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE photographers DISABLE ROW LEVEL SECURITY;
*/

-- 5. 서비스 역할 권한 확인
-- =====================================================

-- 필요한 경우 서비스 역할에 권한 부여
GRANT SELECT, INSERT, UPDATE ON matching_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON matching_results TO service_role;
GRANT SELECT ON survey_questions TO service_role;
GRANT SELECT ON survey_choices TO service_role;
GRANT SELECT ON survey_images TO service_role;
GRANT SELECT ON photographer_profiles TO service_role;
GRANT SELECT ON photographers TO service_role;
GRANT SELECT ON photographer_keywords TO service_role;

-- 6. 익명 역할 권한 (읽기 전용)
-- =====================================================

GRANT SELECT ON survey_questions TO anon;
GRANT SELECT ON survey_choices TO anon;
GRANT SELECT ON survey_images TO anon;
GRANT SELECT ON photographer_profiles TO anon;
GRANT SELECT ON photographers TO anon;
GRANT INSERT ON matching_sessions TO anon;
GRANT SELECT ON matching_sessions TO anon;
GRANT SELECT ON matching_results TO anon;

-- =====================================================
-- 적용 후 테스트:
-- 
-- 1. Supabase Dashboard에서 이 스크립트 실행
-- 2. 브라우저에서 매칭 페이지 테스트
-- 3. 네트워크 탭에서 API 호출 확인
-- =====================================================