-- =====================================================
-- 데이터 흐름 검증 쿼리 모음
-- =====================================================

-- 1. 기본 테이블 존재 및 구조 확인
-- =====================================================

-- pgvector 확장 확인
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'vector';

-- 매칭 시스템 핵심 테이블 존재 확인
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN (
  'survey_questions',
  'survey_choices', 
  'survey_images',
  'matching_sessions',
  'photographer_profiles',
  'photographer_keywords',
  'matching_results'
) 
ORDER BY table_name;

-- 각 테이블의 컬럼 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN (
  'matching_sessions',
  'photographer_profiles', 
  'matching_results'
)
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 2. 데이터 존재 여부 확인
-- =====================================================

-- 설문 질문 데이터 확인
SELECT 
  COUNT(*) as total_questions,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions
FROM survey_questions;

-- 선택지 데이터 확인
SELECT 
  sq.question_key,
  sq.question_type,
  COUNT(sc.id) as choice_count,
  COUNT(CASE WHEN sc.choice_embedding IS NOT NULL THEN 1 END) as embedded_choices
FROM survey_questions sq
LEFT JOIN survey_choices sc ON sq.id = sc.question_id AND sc.is_active = true
GROUP BY sq.id, sq.question_key, sq.question_type
ORDER BY sq.question_order;

-- 이미지 선택지 데이터 확인
SELECT 
  sq.question_key,
  COUNT(si.id) as image_count,
  COUNT(CASE WHEN si.image_embedding IS NOT NULL THEN 1 END) as embedded_images
FROM survey_questions sq
LEFT JOIN survey_images si ON sq.id = si.question_id AND si.is_active = true
WHERE sq.question_type = 'image_choice'
GROUP BY sq.id, sq.question_key
ORDER BY sq.question_order;

-- 작가 프로필 완성도 확인
SELECT 
  COUNT(*) as total_photographers,
  COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profiles,
  COUNT(CASE WHEN style_emotion_embedding IS NOT NULL THEN 1 END) as has_style_embedding,
  COUNT(CASE WHEN communication_psychology_embedding IS NOT NULL THEN 1 END) as has_comm_embedding,
  COUNT(CASE WHEN purpose_story_embedding IS NOT NULL THEN 1 END) as has_purpose_embedding,
  COUNT(CASE WHEN companion_embedding IS NOT NULL THEN 1 END) as has_companion_embedding
FROM photographer_profiles;

-- 키워드 데이터 확인
SELECT 
  COUNT(DISTINCT photographer_id) as photographers_with_keywords,
  COUNT(*) as total_keywords,
  COUNT(DISTINCT keyword) as unique_keywords
FROM photographer_keywords;

-- =====================================================
-- 3. 매칭 세션 데이터 확인
-- =====================================================

-- 최근 매칭 세션 확인
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_sessions,
  COUNT(CASE WHEN final_user_embedding IS NOT NULL THEN 1 END) as sessions_with_embedding,
  COUNT(CASE WHEN subjective_embedding IS NOT NULL THEN 1 END) as sessions_with_subjective
FROM matching_sessions;

-- 최근 5개 세션 상세 정보
SELECT 
  id,
  session_token,
  CASE WHEN final_user_embedding IS NOT NULL THEN 'Yes' ELSE 'No' END as has_embedding,
  CASE WHEN completed_at IS NOT NULL THEN 'Yes' ELSE 'No' END as is_completed,
  jsonb_object_keys(responses) as response_keys,
  created_at
FROM matching_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- 매칭 결과 데이터 확인
SELECT 
  COUNT(DISTINCT session_id) as sessions_with_results,
  COUNT(*) as total_results,
  AVG(total_score) as avg_total_score,
  MIN(total_score) as min_score,
  MAX(total_score) as max_score
FROM matching_results;

-- =====================================================
-- 4. 인덱스 확인
-- =====================================================

-- pgvector 인덱스 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE indexdef LIKE '%vector%' 
   OR indexdef LIKE '%ivfflat%'
ORDER BY tablename, indexname;

-- 일반 인덱스 확인
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN (
  'matching_sessions',
  'photographer_profiles',
  'matching_results',
  'photographer_keywords'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 5. 함수 존재 확인
-- =====================================================

-- 매칭 관련 함수 확인
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN (
  'calculate_photographer_matching',
  'save_matching_results',
  'extract_regions_from_responses',
  'extract_companion_types_from_responses',
  'extract_keywords_from_responses',
  'test_matching_system'
)
ORDER BY routine_name;

-- =====================================================
-- 6. 데이터 품질 검증
-- =====================================================

-- 임베딩 벡터 차원 확인
SELECT 
  'photographer_profiles.style_emotion_embedding' as field,
  AVG(array_length(style_emotion_embedding::float[], 1)) as avg_dimensions,
  COUNT(CASE WHEN style_emotion_embedding IS NOT NULL THEN 1 END) as non_null_count
FROM photographer_profiles
WHERE style_emotion_embedding IS NOT NULL

UNION ALL

SELECT 
  'matching_sessions.final_user_embedding' as field,
  AVG(array_length(final_user_embedding::float[], 1)) as avg_dimensions,
  COUNT(CASE WHEN final_user_embedding IS NOT NULL THEN 1 END) as non_null_count
FROM matching_sessions
WHERE final_user_embedding IS NOT NULL

UNION ALL

SELECT 
  'survey_choices.choice_embedding' as field,
  AVG(array_length(choice_embedding::float[], 1)) as avg_dimensions,
  COUNT(CASE WHEN choice_embedding IS NOT NULL THEN 1 END) as non_null_count
FROM survey_choices
WHERE choice_embedding IS NOT NULL;

-- 응답 데이터 패턴 확인
SELECT 
  jsonb_object_keys(responses) as question_keys,
  COUNT(*) as frequency
FROM matching_sessions 
WHERE responses IS NOT NULL
GROUP BY jsonb_object_keys(responses)
ORDER BY frequency DESC;

-- RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN (
  'survey_questions',
  'survey_choices',
  'survey_images',
  'matching_sessions',
  'matching_results',
  'photographer_profiles'
)
ORDER BY tablename, policyname;

-- =====================================================
-- 사용법:
-- 이 파일의 각 쿼리를 Supabase SQL Editor에서 실행하여
-- 매칭 시스템의 데이터 상태를 종합적으로 점검할 수 있습니다.
-- =====================================================