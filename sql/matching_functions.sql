-- =====================================================
-- 사진작가 매칭 시스템 SQL 함수
-- 4차원 임베딩 기반 매칭 + 키워드 보너스 시스템
-- =====================================================

-- 1. 메인 매칭 함수: 종합 점수 계산 및 순위 매김
CREATE OR REPLACE FUNCTION calculate_photographer_matching(
  session_id_param UUID,
  user_style_emotion_embedding vector(1536),
  user_communication_psychology_embedding vector(1536), 
  user_purpose_story_embedding vector(1536),
  user_companion_embedding vector(1536),
  filter_regions TEXT[] DEFAULT '{}',
  filter_price_min INTEGER DEFAULT 0,
  filter_price_max INTEGER DEFAULT 999999999,
  filter_companion_types TEXT[] DEFAULT '{}',
  user_keywords TEXT[] DEFAULT '{}',
  match_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  photographer_id UUID,
  photographer_name TEXT,
  photographer_email TEXT,
  price_range_min INTEGER,
  price_range_max INTEGER,
  
  -- 4차원 개별 점수 (0-100)
  style_emotion_score DECIMAL(5,2),
  communication_psychology_score DECIMAL(5,2),
  purpose_story_score DECIMAL(5,2),
  companion_score DECIMAL(5,2),
  
  -- 키워드 매칭 정보
  keyword_bonus DECIMAL(5,2),
  matched_keywords TEXT[],
  keyword_count INTEGER,
  
  -- 최종 점수 및 순위
  total_score DECIMAL(5,2),
  rank_position INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  -- 4차원 가중치 (합계 = 1.0)
  WEIGHT_STYLE_EMOTION CONSTANT DECIMAL := 0.40;
  WEIGHT_COMMUNICATION CONSTANT DECIMAL := 0.30;
  WEIGHT_PURPOSE_STORY CONSTANT DECIMAL := 0.20;
  WEIGHT_COMPANION CONSTANT DECIMAL := 0.10;
  
  -- 키워드 보너스 가중치
  WEIGHT_KEYWORD_BONUS CONSTANT DECIMAL := 0.05; -- 최대 5% 추가 점수
BEGIN
  RETURN QUERY
  WITH filtered_photographers AS (
    -- 1단계: 하드 필터링
    SELECT 
      pp.photographer_id,
      p.name,
      p.email,
      pp.price_min,
      pp.price_max,
      pp.style_emotion_embedding,
      pp.communication_psychology_embedding,
      pp.purpose_story_embedding,
      pp.companion_embedding
    FROM photographer_profiles pp
    INNER JOIN photographers p ON pp.photographer_id = p.id
    WHERE 
      pp.profile_completed = true
      AND p.approval_status = 'approved'
      -- 지역 필터
      AND (
        array_length(filter_regions, 1) IS NULL 
        OR pp.service_regions && filter_regions
      )
      -- 가격 필터  
      AND (
        (filter_price_min = 0 OR pp.price_max >= filter_price_min)
        AND (filter_price_max = 999999999 OR pp.price_min <= filter_price_max)
      )
      -- 동반자 필터
      AND (
        array_length(filter_companion_types, 1) IS NULL
        OR pp.companion_types && filter_companion_types
      )
  ),
  
  similarity_scores AS (
    -- 2단계: 4차원 유사도 계산
    SELECT 
      fp.*,
      -- 코사인 유사도를 0-100 점수로 변환 (1 - cosine_distance) * 100
      GREATEST(0, (1 - (fp.style_emotion_embedding <=> user_style_emotion_embedding)) * 100) 
        AS style_emotion_raw_score,
      GREATEST(0, (1 - (fp.communication_psychology_embedding <=> user_communication_psychology_embedding)) * 100) 
        AS communication_psychology_raw_score,
      GREATEST(0, (1 - (fp.purpose_story_embedding <=> user_purpose_story_embedding)) * 100) 
        AS purpose_story_raw_score,
      GREATEST(0, (1 - (fp.companion_embedding <=> user_companion_embedding)) * 100) 
        AS companion_raw_score
    FROM filtered_photographers fp
  ),
  
  keyword_matching AS (
    -- 3단계: 키워드 매칭 및 보너스 계산
    SELECT 
      ss.*,
      COALESCE(km.matched_keywords, '{}') AS matched_keywords,
      COALESCE(array_length(km.matched_keywords, 1), 0) AS keyword_count,
      -- 키워드 보너스: 1개(50%) -> 2개(70%) -> 3개+(100%)
      CASE 
        WHEN COALESCE(array_length(km.matched_keywords, 1), 0) = 0 THEN 0
        WHEN COALESCE(array_length(km.matched_keywords, 1), 0) = 1 THEN WEIGHT_KEYWORD_BONUS * 50
        WHEN COALESCE(array_length(km.matched_keywords, 1), 0) = 2 THEN WEIGHT_KEYWORD_BONUS * 70
        ELSE WEIGHT_KEYWORD_BONUS * 100
      END AS keyword_bonus_score
    FROM similarity_scores ss
    LEFT JOIN (
      SELECT 
        pk.photographer_id,
        array_agg(pk.keyword) AS matched_keywords
      FROM photographer_keywords pk
      WHERE 
        array_length(user_keywords, 1) > 0
        AND pk.keyword = ANY(user_keywords)
      GROUP BY pk.photographer_id
    ) km ON ss.photographer_id = km.photographer_id
  ),
  
  final_scores AS (
    -- 4단계: 최종 점수 계산
    SELECT 
      km.*,
      -- 4차원 가중 평균 + 키워드 보너스
      (
        (km.style_emotion_raw_score * WEIGHT_STYLE_EMOTION) +
        (km.communication_psychology_raw_score * WEIGHT_COMMUNICATION) +
        (km.purpose_story_raw_score * WEIGHT_PURPOSE_STORY) +
        (km.companion_raw_score * WEIGHT_COMPANION) +
        km.keyword_bonus_score
      ) AS calculated_total_score
    FROM keyword_matching km
  ),
  
  ranked_results AS (
    -- 5단계: 순위 매김
    SELECT 
      fs.*,
      ROW_NUMBER() OVER (ORDER BY fs.calculated_total_score DESC, fs.photographer_id) AS calculated_rank
    FROM final_scores fs
    ORDER BY fs.calculated_total_score DESC
    LIMIT match_limit
  )
  
  -- 6단계: 최종 결과 반환
  SELECT 
    rr.photographer_id,
    rr.name::TEXT,
    rr.email::TEXT,
    rr.price_min,
    rr.price_max,
    
    -- 4차원 점수
    rr.style_emotion_raw_score::DECIMAL(5,2),
    rr.communication_psychology_raw_score::DECIMAL(5,2),
    rr.purpose_story_raw_score::DECIMAL(5,2),
    rr.companion_raw_score::DECIMAL(5,2),
    
    -- 키워드 정보
    rr.keyword_bonus_score::DECIMAL(5,2),
    rr.matched_keywords,
    rr.keyword_count,
    
    -- 최종 점수 및 순위
    rr.calculated_total_score::DECIMAL(5,2),
    rr.calculated_rank::INTEGER
  FROM ranked_results rr;
END;
$$;

-- =====================================================
-- 2. 매칭 결과 저장 함수 (실제 스키마에 맞게 수정)
-- =====================================================
CREATE OR REPLACE FUNCTION save_matching_results(
  session_id_param UUID
)
RETURNS TABLE (
  success BOOLEAN,
  results_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  session_record RECORD;
  result_count INTEGER := 0;
BEGIN
  -- 세션 정보 조회 (실제 스키마 기준)
  SELECT 
    ms.*,
    -- 스키마에는 final_user_embedding만 있으므로 이를 4차원에 모두 사용
    ms.final_user_embedding AS style_emb,
    ms.final_user_embedding AS comm_emb,
    ms.final_user_embedding AS purpose_emb,
    ms.final_user_embedding AS companion_emb
  INTO session_record
  FROM matching_sessions ms 
  WHERE ms.id = session_id_param;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Session not found';
    RETURN;
  END IF;
  
  -- 기존 결과 삭제
  DELETE FROM matching_results WHERE session_id = session_id_param;
  
  -- 매칭 계산 및 결과 저장
  INSERT INTO matching_results (
    session_id,
    photographer_id,
    style_emotion_score,
    communication_psychology_score,
    purpose_story_score,
    companion_score,
    keyword_bonus,
    total_score,
    rank_position,
    created_at
  )
  SELECT 
    session_id_param,
    cm.photographer_id,
    cm.style_emotion_score,
    cm.communication_psychology_score,
    cm.purpose_story_score,
    cm.companion_score,
    cm.keyword_bonus,
    cm.total_score,
    cm.rank_position,
    NOW()
  FROM calculate_photographer_matching(
    session_id_param,
    session_record.style_emb,
    session_record.comm_emb,
    session_record.purpose_emb,
    session_record.companion_emb,
    COALESCE(extract_regions_from_responses(session_record.responses), '{}'),
    COALESCE(extract_price_min_from_responses(session_record.responses), 0),
    COALESCE(extract_price_max_from_responses(session_record.responses), 999999999),
    COALESCE(extract_companion_types_from_responses(session_record.responses), '{}'),
    COALESCE(extract_keywords_from_responses(session_record.responses), '{}'),
    20
  ) cm;
  
  GET DIAGNOSTICS result_count = ROW_COUNT;
  
  -- 세션 완료 상태 업데이트
  UPDATE matching_sessions 
  SET 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = session_id_param;
  
  RETURN QUERY SELECT true, result_count, 'Matching completed successfully';
END;
$$;

-- =====================================================
-- 3. 응답에서 필터 조건 추출하는 헬퍼 함수들
-- =====================================================

-- 지역 추출
CREATE OR REPLACE FUNCTION extract_regions_from_responses(responses JSONB)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
  -- 응답에서 지역 정보 추출 (예: q_region 키에서)
  IF responses ? 'region' THEN
    IF jsonb_typeof(responses->'region') = 'array' THEN
      RETURN ARRAY(SELECT jsonb_array_elements_text(responses->'region'));
    ELSE
      RETURN ARRAY[responses->>'region'];
    END IF;
  END IF;
  
  RETURN '{}';
END;
$$;

-- 가격 범위 추출
CREATE OR REPLACE FUNCTION extract_price_min_from_responses(responses JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  budget_str TEXT;
  price_parts TEXT[];
BEGIN
  IF responses ? 'budget' THEN
    budget_str := responses->>'budget';
    IF budget_str LIKE '%-%' THEN
      price_parts := string_to_array(budget_str, '-');
      RETURN price_parts[1]::INTEGER;
    END IF;
  END IF;
  
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION extract_price_max_from_responses(responses JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  budget_str TEXT;
  price_parts TEXT[];
BEGIN
  IF responses ? 'budget' THEN
    budget_str := responses->>'budget';
    IF budget_str LIKE '%-%' THEN
      price_parts := string_to_array(budget_str, '-');
      RETURN price_parts[2]::INTEGER;
    END IF;
  END IF;
  
  RETURN 999999999;
END;
$$;

-- 동반자 타입 추출
CREATE OR REPLACE FUNCTION extract_companion_types_from_responses(responses JSONB)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
  IF responses ? 'q2' THEN
    IF jsonb_typeof(responses->'q2') = 'array' THEN
      RETURN ARRAY(SELECT jsonb_array_elements_text(responses->'q2'));
    ELSE
      RETURN ARRAY[responses->>'q2'];
    END IF;
  END IF;
  
  RETURN '{}';
END;
$$;

-- 키워드 추출
CREATE OR REPLACE FUNCTION extract_keywords_from_responses(responses JSONB)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
  -- Q6 키워드 질문에서 추출
  IF responses ? 'q6' THEN
    IF jsonb_typeof(responses->'q6') = 'array' THEN
      RETURN ARRAY(SELECT jsonb_array_elements_text(responses->'q6'));
    ELSE
      RETURN ARRAY[responses->>'q6'];
    END IF;
  END IF;
  
  RETURN '{}';
END;
$$;

-- =====================================================
-- 4. 성능 최적화를 위한 인덱스 생성
-- =====================================================

-- pgvector 인덱스 (코사인 유사도 최적화)
CREATE INDEX IF NOT EXISTS idx_photographer_profiles_style_emotion_embedding 
ON photographer_profiles USING ivfflat (style_emotion_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_photographer_profiles_communication_psychology_embedding 
ON photographer_profiles USING ivfflat (communication_psychology_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_photographer_profiles_purpose_story_embedding 
ON photographer_profiles USING ivfflat (purpose_story_embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_photographer_profiles_companion_embedding 
ON photographer_profiles USING ivfflat (companion_embedding vector_cosine_ops)
WITH (lists = 100);

-- 일반 인덱스
CREATE INDEX IF NOT EXISTS idx_photographer_profiles_completed 
ON photographer_profiles (profile_completed) WHERE profile_completed = true;

CREATE INDEX IF NOT EXISTS idx_photographer_profiles_regions 
ON photographer_profiles USING gin (service_regions);

CREATE INDEX IF NOT EXISTS idx_photographer_profiles_companion_types 
ON photographer_profiles USING gin (companion_types);

CREATE INDEX IF NOT EXISTS idx_photographer_keywords_keyword 
ON photographer_keywords (keyword);

CREATE INDEX IF NOT EXISTS idx_matching_sessions_token 
ON matching_sessions (session_token);

CREATE INDEX IF NOT EXISTS idx_matching_results_session 
ON matching_results (session_id);

-- =====================================================
-- 5. 사용 예시 및 테스트 함수
-- =====================================================

-- 테스트용 매칭 실행 함수 (더미 임베딩 생성 간소화)
CREATE OR REPLACE FUNCTION test_matching_system(
  test_session_id UUID DEFAULT gen_random_uuid()
)
RETURNS TABLE (
  photographer_name TEXT,
  total_score DECIMAL(5,2),
  rank_position INTEGER,
  matched_keywords TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  dummy_embedding vector(1536);
  dummy_values DECIMAL[];
BEGIN
  -- 더미 임베딩 생성 (1536개 랜덤 값)
  SELECT array_agg(random()::DECIMAL) INTO dummy_values 
  FROM generate_series(1, 1536);
  
  dummy_embedding := dummy_values::vector(1536);
  
  RETURN QUERY
  SELECT 
    cm.photographer_name,
    cm.total_score,
    cm.rank_position,
    cm.matched_keywords
  FROM calculate_photographer_matching(
    test_session_id,
    dummy_embedding, -- style_emotion
    dummy_embedding, -- communication_psychology  
    dummy_embedding, -- purpose_story
    dummy_embedding, -- companion
    ARRAY['서울', '경기'], -- regions
    100000, -- price_min
    500000, -- price_max
    ARRAY['혼자', '친구'], -- companion_types
    ARRAY['자연스러운', '감성적인'], -- keywords
    10 -- limit
  ) cm;
END;
$$;

-- =====================================================
-- 사용법 예시:
-- 
-- 1. 매칭 계산:
-- SELECT * FROM calculate_photographer_matching(
--   'session-uuid',
--   user_style_embedding,
--   user_comm_embedding, 
--   user_purpose_embedding,
--   user_companion_embedding,
--   ARRAY['서울'],
--   100000,
--   500000,
--   ARRAY['혼자'],
--   ARRAY['자연스러운'],
--   20
-- );
--
-- 2. 결과 저장:
-- SELECT * FROM save_matching_results('session-uuid');
--
-- 3. 테스트:
-- SELECT * FROM test_matching_system();
-- =====================================================